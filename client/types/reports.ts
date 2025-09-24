export interface AnalyticsData {
  complaints: {
    total: number;
    resolved: number;
    pending: number;
    overdue: number;
  };
  sla: {
    compliance: number;
    avgResolutionTime: number;
    target: number;
  };
  trends: Array<{
    date: string;
    complaints: number;
    resolved: number;
    slaCompliance: number;
  }>;
  wards: Array<{
    id: string;
    name: string;
    complaints: number;
    resolved: number;
    avgTime: number;
    slaScore: number;
  }>;
  categories: Array<{
    name: string;
    count: number;
    avgTime: number;
    color: string;
  }>;
  performance: {
    userSatisfaction: number;
    escalationRate: number;
    firstCallResolution: number;
    repeatComplaints: number;
  };
}

export interface FilterOptions {
  dateRange: {
    from: string;
    to: string;
  };
  ward: string;
  complaintType: string;
  status: string;
  priority: string;
}
