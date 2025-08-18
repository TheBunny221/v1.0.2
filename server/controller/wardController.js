import { getPrisma } from "../db/connection.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = getPrisma();

// @desc    Get ward team members
// @route   GET /api/wards/:wardId/team
// @access  Private (Ward Officer, Administrator)
export const getWardTeamMembers = asyncHandler(async (req, res) => {
  const { wardId } = req.params;

  // Authorization check
  const isAuthorized =
    req.user.role === "ADMINISTRATOR" ||
    (req.user.role === "WARD_OFFICER" && req.user.wardId === wardId);

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to access team information for this ward",
      data: null,
    });
  }

  try {
    // Get maintenance team members who could be assigned to this ward
    const teamMembers = await prisma.user.findMany({
      where: {
        role: "MAINTENANCE_TEAM",
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        department: true,
        // Count active assignments
        assignedComplaints: {
          where: {
            status: {
              in: ["ASSIGNED", "IN_PROGRESS"],
            },
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        fullName: "asc",
      },
    });

    // Transform data to include workload information
    const formattedTeamMembers = teamMembers.map((member) => ({
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      phoneNumber: member.phoneNumber,
      department: member.department,
      activeAssignments: member.assignedComplaints.length,
      displayName: `${member.fullName} - ${member.department || "General"}`,
    }));

    res.status(200).json({
      success: true,
      message: "Team members retrieved successfully",
      data: {
        teamMembers: formattedTeamMembers,
        total: formattedTeamMembers.length,
      },
    });
  } catch (error) {
    console.error("Error fetching ward team members:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch team members",
      data: null,
    });
  }
});

// @desc    Get ward statistics
// @route   GET /api/wards/:wardId/stats
// @access  Private (Ward Officer, Administrator)
export const getWardStats = asyncHandler(async (req, res) => {
  const { wardId } = req.params;

  // Authorization check
  const isAuthorized =
    req.user.role === "ADMINISTRATOR" ||
    (req.user.role === "WARD_OFFICER" && req.user.wardId === wardId);

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to access statistics for this ward",
      data: null,
    });
  }

  try {
    // Get ward information
    const ward = await prisma.ward.findUnique({
      where: { id: wardId },
      include: {
        subZones: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!ward) {
      return res.status(404).json({
        success: false,
        message: "Ward not found",
        data: null,
      });
    }

    // Get complaint statistics
    const complaintStats = await prisma.complaint.groupBy({
      by: ["status", "priority"],
      where: {
        wardId: wardId,
      },
      _count: {
        id: true,
      },
    });

    // Calculate summary statistics
    const totalComplaints = await prisma.complaint.count({
      where: { wardId: wardId },
    });

    const resolvedComplaints = await prisma.complaint.count({
      where: {
        wardId: wardId,
        status: {
          in: ["RESOLVED", "CLOSED"],
        },
      },
    });

    const pendingComplaints = await prisma.complaint.count({
      where: {
        wardId: wardId,
        status: {
          in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS"],
        },
      },
    });

    // Group by area
    const complaintsByArea = await prisma.complaint.groupBy({
      by: ["area"],
      where: {
        wardId: wardId,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Ward statistics retrieved successfully",
      data: {
        ward: {
          id: ward.id,
          name: ward.name,
          description: ward.description,
          subZones: ward.subZones,
        },
        summary: {
          totalComplaints,
          resolvedComplaints,
          pendingComplaints,
          resolutionRate:
            totalComplaints > 0
              ? Math.round((resolvedComplaints / totalComplaints) * 100)
              : 0,
        },
        complaintsByStatus: complaintStats.reduce((acc, stat) => {
          const key = `${stat.status}_${stat.priority}`;
          acc[key] = stat._count.id;
          return acc;
        }, {}),
        complaintsByArea: complaintsByArea.map((area) => ({
          area: area.area,
          count: area._count.id,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching ward statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch ward statistics",
      data: null,
    });
  }
});
