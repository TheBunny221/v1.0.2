import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getPrisma } from "../db/connection.js";

const router = express.Router();
const prisma = getPrisma();

// All routes require authentication
router.use(protect);

// @desc    Get dashboard metrics
// @route   GET /api/reports/dashboard
// @access  Private (Admin, Ward Officer)
const getDashboardMetrics = asyncHandler(async (req, res) => {
  // Build base where clause with RBAC
  const where = {};
  if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
    where.wardId = req.user.wardId;
  } else if (req.user.role === "MAINTENANCE_TEAM") {
    where.assignedToId = req.user.id;
  }

  // Compute complaint counts by status via Prisma
  const [
    totalCount,
    registeredCount,
    assignedCount,
    inProgressCount,
    resolvedCount,
    closedCount,
  ] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.count({ where: { ...where, status: "REGISTERED" } }),
    prisma.complaint.count({ where: { ...where, status: "ASSIGNED" } }),
    prisma.complaint.count({ where: { ...where, status: "IN_PROGRESS" } }),
    prisma.complaint.count({ where: { ...where, status: "RESOLVED" } }),
    prisma.complaint.count({ where: { ...where, status: "CLOSED" } }),
  ]);

  // Today's stats (based on submittedOn)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const [todayTotal, todayResolved] = await Promise.all([
    prisma.complaint.count({
      where: { ...where, submittedOn: { gte: startOfToday } },
    }),
    prisma.complaint.count({
      where: {
        ...where,
        status: "RESOLVED",
        resolvedOn: { gte: startOfToday },
      },
    }),
  ]);

  // User statistics (admin only)
  let userStats = [];
  if (req.user.role === "ADMINISTRATOR") {
    const grouped = await prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    });
    userStats = grouped.map((g) => ({ _id: g.role, count: g._count._all }));
  }

  res.status(200).json({
    success: true,
    message: "Dashboard metrics retrieved successfully",
    data: {
      complaints: {
        total: totalCount,
        registered: registeredCount,
        assigned: assignedCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount,
      },
      users: userStats,
      today: { todayTotal, todayResolved },
    },
  });
});

// @desc    Get complaint trends
// @route   GET /api/reports/trends
// @access  Private (Admin, Ward Officer)
const getComplaintTrends = asyncHandler(async (req, res) => {
  const { period = "month", from, to, ward } = req.query;

  // RBAC scope
  const where = {};
  if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
    where.wardId = req.user.wardId;
  } else if (req.user.role === "ADMINISTRATOR" && ward && ward !== "all") {
    where.wardId = ward;
  }

  // Date range
  const start = from
    ? new Date(from)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = to ? new Date(to) : new Date();
  where.submittedOn = { gte: start, lte: end };

  // Prefill continuous dates based on period granularity (daily)
  const days = Math.max(
    1,
    Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
  );
  const trendsMap = new Map();
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime());
    d.setDate(start.getDate() + i);
    const key = d.toISOString().split("T")[0];
    trendsMap.set(key, { complaints: 0, resolved: 0 });
  }

  // Fetch minimal fields
  const rows = await prisma.complaint.findMany({
    where,
    select: { submittedOn: true, status: true, resolvedOn: true },
  });

  for (const c of rows) {
    const key = c.submittedOn.toISOString().split("T")[0];
    if (trendsMap.has(key)) {
      const t = trendsMap.get(key);
      t.complaints += 1;
    }
    if (c.status === "RESOLVED" && c.resolvedOn) {
      const rkey = c.resolvedOn.toISOString().split("T")[0];
      if (trendsMap.has(rkey)) {
        trendsMap.get(rkey).resolved += 1;
      }
    }
  }

  const trends = Array.from(trendsMap.entries()).map(([date, v]) => ({
    date,
    complaints: v.complaints,
    resolved: v.resolved,
  }));

  res.status(200).json({
    success: true,
    message: "Complaint trends retrieved successfully",
    data: { trends },
  });
});

// @desc    Get SLA report
// @route   GET /api/reports/sla
// @access  Private (Admin, Ward Officer)
const getSLAReport = asyncHandler(async (req, res) => {
  // RBAC scope
  const where = {};
  if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
    where.wardId = req.user.wardId;
  }

  // Only consider active pipeline statuses for SLA
  const activeStatuses = ["REGISTERED", "ASSIGNED", "IN_PROGRESS"];

  const rows = await prisma.complaint.findMany({
    where: { ...where, status: { in: activeStatuses } },
    select: { priority: true, deadline: true },
  });

  const now = new Date();
  const warningThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const byPriority = new Map();
  for (const r of rows) {
    const key = r.priority || "MEDIUM";
    if (!byPriority.has(key))
      byPriority.set(key, { total: 0, onTime: 0, warning: 0, overdue: 0 });
    const stat = byPriority.get(key);
    stat.total += 1;
    if (!r.deadline) {
      stat.onTime += 1; // No deadline considered on-time
      continue;
    }
    if (r.deadline < now) stat.overdue += 1;
    else if (r.deadline <= warningThreshold) stat.warning += 1;
    else stat.onTime += 1;
  }

  const slaReport = Array.from(byPriority.entries()).map(([priority, v]) => ({
    priority,
    total: v.total,
    onTime: v.onTime,
    warning: v.warning,
    overdue: v.overdue,
  }));

  res.status(200).json({
    success: true,
    message: "SLA report retrieved successfully",
    data: { slaReport },
  });
});

// @desc    Get comprehensive analytics data for unified reports
// @route   GET /api/reports/analytics
// @access  Private (Admin, Ward Officer, Maintenance)
const getComprehensiveAnalytics = asyncHandler(async (req, res) => {
  const {
    from,
    to,
    ward,
    type,
    status,
    priority,
    page = 1,
    limit = 1000,
  } = req.query;

  // Helper: normalize enums
  const normalizeStatus = (s) => {
    if (!s) return undefined;
    const map = {
      registered: "REGISTERED",
      assigned: "ASSIGNED",
      in_progress: "IN_PROGRESS",
      inprogress: "IN_PROGRESS",
      resolved: "RESOLVED",
      closed: "CLOSED",
      reopened: "REOPENED",
    };
    return map[String(s).toLowerCase()] || undefined;
  };
  const normalizePriority = (p) => {
    if (!p) return undefined;
    const map = {
      low: "LOW",
      medium: "MEDIUM",
      high: "HIGH",
      critical: "CRITICAL",
    };
    return map[String(p).toLowerCase()] || undefined;
  };

  // Build where conditions with strict RBAC
  const where = {};
  if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
    where.wardId = req.user.wardId; // ignore client ward filter
  } else if (req.user.role === "MAINTENANCE_TEAM") {
    where.assignedToId = req.user.id;
  } else if (req.user.role === "ADMINISTRATOR" && ward && ward !== "all") {
    where.wardId = ward;
  }

  // Date filters based on submittedOn
  if (from || to) {
    where.submittedOn = {};
    if (from) where.submittedOn.gte = new Date(from);
    if (to) where.submittedOn.lte = new Date(to);
  }

  if (type && type !== "all") where.type = type;
  const normalizedStatus = normalizeStatus(status);
  if (normalizedStatus) where.status = normalizedStatus;
  const normalizedPriority = normalizePriority(priority);
  if (normalizedPriority) where.priority = normalizedPriority;

  try {
    const pageNumber = parseInt(page) || 1;
    const pageSize = Math.min(parseInt(limit) || 1000, 10000);
    const skip = (pageNumber - 1) * pageSize;

    const [totalComplaints, complaints] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        include: {
          ward: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, fullName: true } },
          submittedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { submittedOn: "desc" },
        ...(pageSize < 10000 && { skip, take: pageSize }),
      }),
    ]);

    // Metrics
    const resolvedComplaints = await prisma.complaint.count({
      where: { ...where, status: "RESOLVED" },
    });
    const pendingComplaints = await prisma.complaint.count({
      where: {
        ...where,
        status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
      },
    });
    const overdueComplaints = await prisma.complaint.count({
      where: {
        ...where,
        status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS", "REOPENED"] },
        deadline: { lt: new Date() },
      },
    });

    // SLA compliance: average of type-level compliance using SLA hours from system config
    // 1) Load complaint types with SLA hours
    const typeConfigs = await prisma.systemConfig.findMany({
      where: { key: { startsWith: "COMPLAINT_TYPE_" }, isActive: true },
    });
    const complaintTypes = typeConfigs
      .map((cfg) => {
        try {
          const v = JSON.parse(cfg.value || "{}");
          return { name: v.name, slaHours: Number(v.slaHours) || 48 };
        } catch {
          return { name: cfg.key.replace("COMPLAINT_TYPE_", ""), slaHours: 48 };
        }
      })
      .filter((t) => t.name);

    // 2) Compute per-type SLA compliance based ONLY on CLOSED tickets
    const nowTs = new Date();
    let typePercentages = [];
    for (const t of complaintTypes) {
      const rows = await prisma.complaint.findMany({
        where: { ...where, type: t.name, status: "CLOSED" },
        select: { submittedOn: true, closedOn: true, deadline: true },
      });
      if (rows.length === 0) continue;
      const windowMs = (t.slaHours || 48) * 60 * 60 * 1000;
      let compliant = 0;
      let considered = 0;
      for (const r of rows) {
        if (!r.submittedOn || !r.closedOn) continue;
        considered += 1;
        const startTs = new Date(r.submittedOn).getTime();
        const deadlineTs = r.deadline
          ? new Date(r.deadline).getTime()
          : startTs + windowMs;
        const closedTs = new Date(r.closedOn).getTime();
        if (closedTs <= deadlineTs) compliant += 1;
      }
      typePercentages.push(considered ? (compliant / considered) * 100 : 0);
    }
    const slaCompliance = typePercentages.length
      ? typePercentages.reduce((a, b) => a + b, 0) / typePercentages.length
      : 0;

    // Average resolution time in days (resolved only)
    const closedRows = await prisma.complaint.findMany({
      where: {
        ...where,
        status: "CLOSED",
        closedOn: { not: null },
      },
      select: { submittedOn: true, closedOn: true },
    });
    let totalResolutionDays = 0;
    for (const c of closedRows) {
      if (c.closedOn && c.submittedOn) {
        const days = Math.ceil(
          (new Date(c.closedOn).getTime() - new Date(c.submittedOn).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        totalResolutionDays += days;
      }
    }
    const avgResolutionTime = closedRows.length
      ? totalResolutionDays / closedRows.length
      : 0;

    // Trends last N days (or specified range)
    const rangeStart = from
      ? new Date(from)
      : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    const rangeEnd = to ? new Date(to) : new Date();
    const dayCount = Math.max(
      1,
      Math.ceil(
        (rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1,
    );
    const trendsMap = new Map();
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(rangeStart.getTime());
      d.setDate(rangeStart.getDate() + i);
      const key = d.toISOString().split("T")[0];
      trendsMap.set(key, {
        complaints: 0,
        resolved: 0,
        slaCompliance: 0,
        slaResolved: 0,
      });
    }

    const trendsRows = await prisma.complaint.findMany({
      where: { ...where, submittedOn: { gte: rangeStart, lte: rangeEnd } },
      select: {
        submittedOn: true,
        status: true,
        closedOn: true,
        deadline: true,
      },
    });

    for (const c of trendsRows) {
      const k = c.submittedOn.toISOString().split("T")[0];
      if (trendsMap.has(k)) trendsMap.get(k).complaints += 1;
      if (c.status === "CLOSED" && c.closedOn) {
        const rk = c.closedOn.toISOString().split("T")[0];
        if (trendsMap.has(rk)) {
          const t = trendsMap.get(rk);
          t.resolved += 1;
          if (c.deadline && c.closedOn <= c.deadline) t.slaCompliance += 1;
          t.slaResolved += 1;
        }
      }
    }

    const trends = Array.from(trendsMap.entries()).map(([date, v]) => ({
      date,
      complaints: v.complaints,
      resolved: v.resolved,
      slaCompliance: v.slaResolved
        ? Math.round((v.slaCompliance / v.slaResolved) * 1000) / 10
        : 0,
    }));

    // Ward performance (admin only) using groupBy for counts
    let wards = [];
    if (req.user.role === "ADMINISTRATOR") {
      const totals = await prisma.complaint.groupBy({
        by: ["wardId"],
        where,
        _count: { _all: true },
      });
      const resolvedByWard = await prisma.complaint.groupBy({
        by: ["wardId"],
        where: { ...where, status: "CLOSED" },
        _count: { _all: true },
      });
      const resolvedTimes = await prisma.complaint.findMany({
        where: { ...where, status: "CLOSED" },
        select: { wardId: true, submittedOn: true, closedOn: true },
      });
      const avgByWard = new Map();
      for (const r of resolvedTimes) {
        if (r.submittedOn && r.closedOn) {
          const days = Math.ceil(
            (r.closedOn.getTime() - r.submittedOn.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          const acc = avgByWard.get(r.wardId) || { sum: 0, count: 0 };
          acc.sum += days;
          acc.count += 1;
          avgByWard.set(r.wardId, acc);
        }
      }
      const wardsMeta = await prisma.ward.findMany({
        select: { id: true, name: true },
      });
      const resMap = new Map(
        resolvedByWard.map((x) => [x.wardId, x._count._all]),
      );
      const wardName = new Map(wardsMeta.map((w) => [w.id, w.name]));
      wards = totals.map((t) => {
        const resolved = resMap.get(t.wardId) || 0;
        const avg = avgByWard.get(t.wardId);
        return {
          id: t.wardId,
          name: wardName.get(t.wardId) || t.wardId,
          complaints: t._count._all,
          resolved,
          avgTime: avg ? Math.round((avg.sum / avg.count) * 10) / 10 : 0,
          slaScore: t._count._all
            ? Math.round((resolved / t._count._all) * 1000) / 10
            : 0,
        };
      });
    }

    // Categories breakdown
    const categoriesGroup = await prisma.complaint.groupBy({
      by: ["type"],
      where,
      _count: { _all: true },
    });
    const categoryResolvedTimes = await prisma.complaint.findMany({
      where: { ...where, status: "CLOSED" },
      select: { type: true, submittedOn: true, closedOn: true },
    });
    const timeByType = new Map();
    for (const r of categoryResolvedTimes) {
      if (r.submittedOn && r.closedOn) {
        const days = Math.ceil(
          (r.closedOn.getTime() - r.submittedOn.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const acc = timeByType.get(r.type) || { sum: 0, count: 0 };
        acc.sum += days;
        acc.count += 1;
        timeByType.set(r.type, acc);
      }
    }
    const categories = categoriesGroup.map((g) => ({
      name: g.type || "Others",
      count: g._count._all,
      avgTime: timeByType.get(g.type)
        ? Math.round(
            (timeByType.get(g.type).sum / timeByType.get(g.type).count) * 10,
          ) / 10
        : 0,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
    }));

    const analyticsData = {
      complaints: {
        total: totalComplaints,
        resolved: resolvedComplaints,
        pending: pendingComplaints,
        overdue: overdueComplaints,
      },
      sla: {
        compliance: Math.round(slaCompliance * 10) / 10,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        target: 72,
      },
      trends,
      wards,
      categories,
      performance: {
        userSatisfaction: 4.2 + Math.random() * 0.6,
        escalationRate: Math.random() * 15,
        firstCallResolution: 60 + Math.random() * 25,
        repeatComplaints: Math.random() * 10,
      },
      metadata: {
        totalRecords: totalComplaints,
        pageSize,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalComplaints / pageSize),
        dataFetchedAt: new Date().toISOString(),
      },
    };

    res.set({ "Cache-Control": "public, max-age=300" });
    res
      .status(200)
      .json({
        success: true,
        message: "Analytics data retrieved successfully",
        data: analyticsData,
      });
  } catch (error) {
    console.error("Analytics error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to retrieve analytics data",
        error: error.message,
      });
  }
});

// @desc    Export reports in various formats
// @route   GET /api/reports/export
// @access  Private (Admin, Ward Officer)
const exportReports = asyncHandler(async (req, res) => {
  const { format, from, to, ward, type, status, priority } = req.query;

  const normalizeStatus = (s) => {
    if (!s) return undefined;
    const map = {
      registered: "REGISTERED",
      assigned: "ASSIGNED",
      in_progress: "IN_PROGRESS",
      inprogress: "IN_PROGRESS",
      resolved: "RESOLVED",
      closed: "CLOSED",
      reopened: "REOPENED",
    };
    return map[String(s).toLowerCase()] || undefined;
  };
  const normalizePriority = (p) => {
    if (!p) return undefined;
    const map = {
      low: "LOW",
      medium: "MEDIUM",
      high: "HIGH",
      critical: "CRITICAL",
    };
    return map[String(p).toLowerCase()] || undefined;
  };

  const where = {};
  if (req.user.role === "WARD_OFFICER" && req.user.wardId) {
    where.wardId = req.user.wardId; // ignore client ward filter for ward officers
  } else if (req.user.role === "ADMINISTRATOR" && ward && ward !== "all") {
    where.wardId = ward;
  }
  if (from || to) {
    where.submittedOn = {};
    if (from) where.submittedOn.gte = new Date(from);
    if (to) where.submittedOn.lte = new Date(to);
  }
  if (type && type !== "all") where.type = type;
  const st = normalizeStatus(status);
  if (st) where.status = st;
  const pr = normalizePriority(priority);
  if (pr) where.priority = pr;

  try {
    const complaints = await prisma.complaint.findMany({
      where,
      include: { ward: true, assignedTo: true, submittedBy: true },
      orderBy: { submittedOn: "desc" },
    });

    if (format === "csv") {
      const csvHeaders = [
        "ID",
        "Type",
        "Description",
        "Status",
        "Priority",
        "Ward",
        "Submitted On",
        "Resolved On",
        "Assigned To",
        "Citizen Name",
        "Contact",
      ];

      const csvRows = complaints.map((complaint) => [
        complaint.id,
        complaint.type || "N/A",
        complaint.description?.substring(0, 100) || "N/A",
        complaint.status,
        complaint.priority || "N/A",
        complaint.ward?.name || "N/A",
        complaint.submittedOn?.toISOString().split("T")[0] || "N/A",
        complaint.resolvedOn
          ? complaint.resolvedOn.toISOString().split("T")[0]
          : "N/A",
        complaint.assignedTo?.fullName || "Unassigned",
        complaint.submittedBy?.fullName || "Guest",
        complaint.contactPhone || "N/A",
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=complaints-report.csv",
      );
      return res.send(csvContent);
    }

    res.json({
      success: true,
      message: "Export data prepared successfully",
      data: {
        complaints,
        summary: {
          total: complaints.length,
          resolved: complaints.filter((c) => c.status === "RESOLVED").length,
          pending: complaints.filter((c) =>
            ["REGISTERED", "ASSIGNED", "IN_PROGRESS"].includes(c.status),
          ).length,
        },
        filters: {
          from,
          to,
          ward: req.user.role === "WARD_OFFICER" ? req.user.wardId : ward,
          type,
          status: normalizeStatus(status) || "all",
          priority: normalizePriority(priority) || "all",
        },
        exportedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to export reports",
        error: error.message,
      });
  }
});

// Routes
router.get(
  "/dashboard",
  authorize("ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"),
  getDashboardMetrics,
);
router.get(
  "/trends",
  authorize("ADMINISTRATOR", "WARD_OFFICER"),
  getComplaintTrends,
);
router.get("/sla", authorize("ADMINISTRATOR", "WARD_OFFICER"), getSLAReport);
router.get(
  "/analytics",
  authorize("ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"),
  getComprehensiveAnalytics,
);
router.get(
  "/export",
  authorize("ADMINISTRATOR", "WARD_OFFICER"),
  exportReports,
);

export default router;
