import type { AnalyticsData, FilterOptions } from "../types/reports";
import { HeatmapData } from "../components/charts/HeatmapGrid";

interface User {
  role?: string;
  wardId?: string;
}

// Helper to construct query parameters
const buildQueryParams = (filters: FilterOptions, user?: User | null): URLSearchParams => {
  const queryParams = new URLSearchParams({
    from: filters.dateRange.from,
    to: filters.dateRange.to,
    ...(filters.ward !== "all" && { ward: filters.ward }),
    ...(filters.complaintType !== "all" && { type: filters.complaintType }),
    ...(filters.status !== "all" && { status: filters.status }),
    ...(filters.priority !== "all" && { priority: filters.priority }),
  });

  // Enforce ward scope for Ward Officers
  if (user?.role === "WARD_OFFICER" && user?.wardId) {
    queryParams.set("ward", user.wardId);
  }

  return queryParams;
};

/**
 * Fetches the main analytics data for the reports page.
 */
export const getAnalyticsData = async (filters: FilterOptions, user: User | null): Promise<AnalyticsData> => {
  const queryParams = buildQueryParams(filters, user);

  let endpoint = "/api/reports/analytics";
  if (user?.role === "MAINTENANCE_TEAM") {
    endpoint = "/api/maintenance/analytics";
  }

  const baseUrl = window.location.origin;
  const response = await fetch(`${baseUrl}${endpoint}?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
  }

  const data = await response.json();

  // Transform the API response to match the expected format
  return {
    complaints: {
      total: data.data?.complaints?.total || 0,
      resolved: data.data?.complaints?.resolved || 0,
      pending: data.data?.complaints?.pending || 0,
      overdue: data.data?.complaints?.overdue || 0,
    },
    sla: {
      compliance: data.data?.sla?.compliance || 0,
      avgResolutionTime: data.data?.sla?.avgResolutionTime || 0,
      target: data.data?.sla?.target || 3,
    },
    trends: data.data?.trends || [],
    wards: data.data?.wards || [],
    categories: data.data?.categories || [],
    performance: {
      userSatisfaction: data.data?.performance?.userSatisfaction || 0,
      escalationRate: data.data?.performance?.escalationRate || 0,
      firstCallResolution: data.data?.performance?.firstCallResolution || 0,
      repeatComplaints: data.data?.performance?.repeatComplaints || 0,
    },
  };
};

/**
 * Fetches heatmap data based on filters.
 */
export const getHeatmapData = async (filters: FilterOptions, user: User | null): Promise<HeatmapData> => {
  const queryParams = new URLSearchParams({
    from: filters.dateRange.from,
    to: filters.dateRange.to,
    ...(filters.complaintType !== "all" && { type: filters.complaintType }),
    ...(filters.status !== "all" && { status: filters.status }),
    ...(filters.priority !== "all" && { priority: filters.priority }),
  } as Record<string, string>);

  // Enforce ward scope for Ward Officers; allow Admins to scope to a ward
  if (user?.role === "WARD_OFFICER" && user?.wardId) {
    queryParams.set("ward", user.wardId);
  } else if (user?.role === "ADMINISTRATOR" && filters.ward && filters.ward !== "all") {
    queryParams.set("ward", filters.ward);
  }

  const baseUrl = window.location.origin;
  const resp = await fetch(`${baseUrl}/api/reports/heatmap?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch heatmap: ${resp.statusText}`);
  }

  const json = await resp.json();
  return json.data as HeatmapData;
};
