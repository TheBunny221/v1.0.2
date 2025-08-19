import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppSelector } from "../store/hooks";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  CalendarDays,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Users,
  Zap,
  Filter,
  RefreshCw,
  Share2,
  FileSpreadsheet,
  Calendar,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { exportToPDF, exportToExcel, exportToCSV } from "../utils/exportUtils";

interface AnalyticsData {
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

interface FilterOptions {
  dateRange: {
    from: string;
    to: string;
  };
  ward: string;
  complaintType: string;
  status: string;
  priority: string;
}

const UnifiedReports: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  // State for filters
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    },
    ward: "all",
    complaintType: "all",
    status: "all",
    priority: "all",
  });

  // State for data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get role-based access permissions
  const permissions = useMemo(() => {
    const role = user?.role;
    return {
      canViewAllWards: role === "ADMINISTRATOR",
      canViewMaintenanceTasks: role === "MAINTENANCE_TEAM" || role === "ADMINISTRATOR",
      canExportData: role === "ADMINISTRATOR" || role === "WARD_OFFICER",
      defaultWard: role === "WARD_OFFICER" ? user?.wardId : "all",
    };
  }, [user]);

  // Apply role-based filter restrictions
  useEffect(() => {
    if (permissions.defaultWard !== "all") {
      setFilters(prev => ({
        ...prev,
        ward: permissions.defaultWard,
      }));
    }
  }, [permissions.defaultWard]);

  // Memoized analytics fetching with debouncing
  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        from: filters.dateRange.from,
        to: filters.dateRange.to,
        ...(filters.ward !== "all" && { ward: filters.ward }),
        ...(filters.complaintType !== "all" && { type: filters.complaintType }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.priority !== "all" && { priority: filters.priority }),
      });

      // Use different endpoints based on user role
      let endpoint = "/api/reports/analytics";
      if (user?.role === "MAINTENANCE_TEAM") {
        endpoint = "/api/maintenance/analytics";
      }

      const response = await fetch(`${endpoint}?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalyticsData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics data");
      console.error("Analytics fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, user?.role]);

  // Debounced effect for filter changes to improve performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAnalyticsData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchAnalyticsData]);

  // Export functionality
  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    if (!permissions.canExportData) {
      alert("You don't have permission to export data");
      return;
    }

    if (!analyticsData) {
      alert("No data available for export");
      return;
    }

    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams({
        from: filters.dateRange.from,
        to: filters.dateRange.to,
        ...(filters.ward !== "all" && { ward: filters.ward }),
        ...(filters.complaintType !== "all" && { type: filters.complaintType }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.priority !== "all" && { priority: filters.priority }),
      });

      // Fetch detailed data for export
      const response = await fetch(`/api/reports/export?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch export data");
      }

      const exportData = await response.json();

      if (!exportData.success) {
        throw new Error(exportData.message || "Export failed");
      }

      const userRole = user?.role || "Unknown";
      const orgName = "Cochin Smart City Corporation";

      // Use appropriate export utility based on format
      switch (format) {
        case "pdf":
          await exportToPDF(
            exportData.data,
            analyticsData.trends,
            analyticsData.categories,
            userRole,
            orgName
          );
          break;
        case "excel":
          exportToExcel(
            exportData.data,
            analyticsData.trends,
            analyticsData.categories,
            userRole,
            orgName
          );
          break;
        case "csv":
          exportToCSV(exportData.data);
          break;
      }
    } catch (err) {
      console.error("Export error:", err);
      alert(`Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate custom report
  const handleGenerateReport = () => {
    fetchAnalyticsData();
  };

  // Chart colors
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

  // Memoized chart data processing for better performance
  const processedChartData = useMemo(() => {
    if (!analyticsData) return null;

    return {
      trendsData: analyticsData.trends.map(trend => ({
        ...trend,
        date: new Date(trend.date).toLocaleDateString(),
      })),
      categoriesWithColors: analyticsData.categories.map((category, index) => ({
        ...category,
        color: COLORS[index % COLORS.length],
      })),
      wardsData: analyticsData.wards.map(ward => ({
        ...ward,
        efficiency: ward.complaints > 0 ? (ward.resolved / ward.complaints) * 100 : 0,
      })),
    };
  }, [analyticsData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading analytics data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {translations?.reports?.title || "Reports & Analytics"}
          </h1>
          <p className="text-muted-foreground">
            {user?.role === "ADMINISTRATOR" 
              ? "Comprehensive system-wide insights and analytics"
              : user?.role === "WARD_OFFICER"
              ? `Analytics for ${user?.ward || "your ward"}`
              : "Your assigned task analytics and performance metrics"
            }
          </p>
        </div>
        
        {permissions.canExportData && (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleExport("csv")}
              disabled={isExporting}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport("excel")}
              disabled={isExporting}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date Range */}
            <div>
              <Label htmlFor="from-date">From Date</Label>
              <Input
                id="from-date"
                type="date"
                value={filters.dateRange.from}
                onChange={(e) =>
                  setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, from: e.target.value }
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="to-date">To Date</Label>
              <Input
                id="to-date"
                type="date"
                value={filters.dateRange.to}
                onChange={(e) =>
                  setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, to: e.target.value }
                  }))
                }
              />
            </div>

            {/* Ward Filter (only for admins) */}
            {permissions.canViewAllWards && (
              <div>
                <Label htmlFor="ward-filter">Ward</Label>
                <Select 
                  value={filters.ward} 
                  onValueChange={(value) => 
                    setFilters(prev => ({ ...prev, ward: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ward" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wards</SelectItem>
                    <SelectItem value="ward1">Ward 1</SelectItem>
                    <SelectItem value="ward2">Ward 2</SelectItem>
                    <SelectItem value="ward3">Ward 3</SelectItem>
                    <SelectItem value="ward4">Ward 4</SelectItem>
                    <SelectItem value="ward5">Ward 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Complaint Type */}
            <div>
              <Label htmlFor="type-filter">Complaint Type</Label>
              <Select 
                value={filters.complaintType} 
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, complaintType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="water">Water Supply</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="road">Road Repair</SelectItem>
                  <SelectItem value="garbage">Garbage Collection</SelectItem>
                  <SelectItem value="lighting">Street Lighting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4 space-x-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
            <Button onClick={handleGenerateReport}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.complaints.total}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.complaints.resolved}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                {((analyticsData.complaints.resolved / analyticsData.complaints.total) * 100).toFixed(1)}% resolution rate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.sla.compliance}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Avg: {analyticsData.sla.avgResolutionTime} days
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.performance.userSatisfaction.toFixed(2)}/5</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                +0.2 from last month
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Tabs */}
      {analyticsData && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            {permissions.canViewAllWards && <TabsTrigger value="wards">Ward Analysis</TabsTrigger>}
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Complaints Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Complaints Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={processedChartData?.trendsData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="complaints" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="resolved" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Complaint Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={processedChartData?.categoriesWithColors || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(processedChartData?.categoriesWithColors || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Trends Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={analyticsData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="complaints" fill="#8884d8" />
                    <Bar yAxisId="left" dataKey="resolved" fill="#82ca9d" />
                    <Line yAxisId="right" type="monotone" dataKey="slaCompliance" stroke="#ff7300" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>User Satisfaction</span>
                      <Badge variant="outline">{analyticsData.performance.userSatisfaction.toFixed(2)}/5</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Escalation Rate</span>
                      <Badge variant="outline">{analyticsData.performance.escalationRate}%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>First Call Resolution</span>
                      <Badge variant="outline">{analyticsData.performance.firstCallResolution}%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Repeat Complaints</span>
                      <Badge variant="outline">{analyticsData.performance.repeatComplaints}%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resolution Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.categories}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgTime" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ward Analysis Tab (Admin only) */}
          {permissions.canViewAllWards && (
            <TabsContent value="wards" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ward Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analyticsData.wards}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="complaints" fill="#8884d8" />
                      <Bar dataKey="resolved" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.categories.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{category.count} complaints</span>
                        <span>Avg: {category.avgTime} days</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default UnifiedReports;
