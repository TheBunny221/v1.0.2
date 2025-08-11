import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
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
} from "lucide-react";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";

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
    coordinates: { lat: number; lng: number };
  }>;
  categories: Array<{
    name: string;
    count: number;
    avgTime: number;
    color: string;
  }>;
  performance: Array<{
    metric: string;
    current: number;
    target: number;
    change: number;
  }>;
}

const ReportsAnalytics: React.FC = () => {
  const dispatch = useAppDispatch();
  const { translations } = useAppSelector((state) => state.language);
  const [dateRange, setDateRange] = useState("30d");
  const [selectedWard, setSelectedWard] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  // Mock analytics data
  const [analyticsData] = useState<AnalyticsData>({
    complaints: {
      total: 1248,
      resolved: 1094,
      pending: 154,
      overdue: 23,
    },
    sla: {
      compliance: 87.6,
      avgResolutionTime: 2.3,
      target: 3.0,
    },
    trends: [
      { date: "2024-01", complaints: 98, resolved: 89, slaCompliance: 85 },
      { date: "2024-02", complaints: 112, resolved: 98, slaCompliance: 88 },
      { date: "2024-03", complaints: 87, resolved: 82, slaCompliance: 92 },
      { date: "2024-04", complaints: 134, resolved: 121, slaCompliance: 89 },
      { date: "2024-05", complaints: 156, resolved: 142, slaCompliance: 87 },
      { date: "2024-06", complaints: 143, resolved: 138, slaCompliance: 91 },
    ],
    wards: [
      {
        id: "ward1",
        name: "Ward 1 - Central",
        complaints: 245,
        resolved: 228,
        avgTime: 2.1,
        slaScore: 93,
        coordinates: { lat: 9.9312, lng: 76.2673 },
      },
      {
        id: "ward2",
        name: "Ward 2 - North",
        complaints: 198,
        resolved: 182,
        avgTime: 2.8,
        slaScore: 89,
        coordinates: { lat: 9.9816, lng: 76.2999 },
      },
      {
        id: "ward3",
        name: "Ward 3 - South",
        complaints: 312,
        resolved: 267,
        avgTime: 3.2,
        slaScore: 82,
        coordinates: { lat: 9.8997, lng: 76.2749 },
      },
    ],
    categories: [
      { name: "Water Supply", count: 356, avgTime: 2.1, color: "#3B82F6" },
      { name: "Electricity", count: 287, avgTime: 1.8, color: "#EF4444" },
      { name: "Road Repair", count: 234, avgTime: 4.2, color: "#10B981" },
      { name: "Garbage", count: 198, avgTime: 1.5, color: "#F59E0B" },
      { name: "Street Lighting", count: 173, avgTime: 2.3, color: "#8B5CF6" },
    ],
    performance: [
      { metric: "Response Time", current: 2.3, target: 4.0, change: -12 },
      { metric: "Resolution Rate", current: 87.6, target: 85.0, change: 8 },
      { metric: "Citizen Satisfaction", current: 4.2, target: 4.0, change: 5 },
      { metric: "SLA Compliance", current: 89.2, target: 85.0, change: 3 },
    ],
  });

  const exportReport = async (format: "pdf" | "excel" | "csv") => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const fileName = `complaint-report-${dateRange}.${format}`;
      dispatch(
        showSuccessToast("Export Successful", `Report exported as ${fileName}`),
      );
    } catch (error) {
      dispatch(showErrorToast("Export Failed", "Failed to export report"));
    } finally {
      setIsExporting(false);
    }
  };

  const generateHeatmapData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return days.flatMap((day, dayIndex) =>
      hours.map((hour) => ({
        day: dayIndex,
        hour,
        value: Math.floor(Math.random() * 50) + 1,
        dayName: day,
      })),
    );
  };

  const heatmapData = generateHeatmapData();

  const HeatmapCell = ({ x, y, width, height, value }: any) => {
    const intensity = Math.min(value / 50, 1);
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`rgba(59, 130, 246, ${intensity})`}
        stroke="#fff"
        strokeWidth={1}
        rx={2}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {translations?.admin?.reportsAnalytics || "Reports & Analytics"}
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>

        <div className="flex space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          <Select
            value="pdf"
            onValueChange={(value) => exportReport(value as any)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF Report</SelectItem>
              <SelectItem value="excel">Excel File</SelectItem>
              <SelectItem value="csv">CSV Data</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Complaints
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.complaints.total}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Resolution Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                (analyticsData.complaints.resolved /
                  analyticsData.complaints.total) *
                100
              ).toFixed(1)}
              %
            </div>
            <p className="text-xs text-muted-foreground">+5% improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Resolution Time
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.sla.avgResolutionTime}d
            </div>
            <p className="text-xs text-muted-foreground">
              Target: {analyticsData.sla.target}d
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              SLA Compliance
            </CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.sla.compliance}%
            </div>
            <p className="text-xs text-muted-foreground">Above target (85%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="wards">Ward Analysis</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaint Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Complaint Trends (6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={analyticsData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="complaints" fill="#3B82F6" />
                    <Bar yAxisId="left" dataKey="resolved" fill="#10B981" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="slaCompliance"
                      stroke="#F59E0B"
                      strokeWidth={3}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Complaints by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {analyticsData.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {analyticsData.categories.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {category.count} ({category.avgTime}d avg)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {analyticsData.performance.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {metric.metric}
                      </span>
                      <div className="flex items-center space-x-1">
                        {metric.change > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span
                          className={`text-xs ${
                            metric.change > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {Math.abs(metric.change)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Current: {metric.current}</span>
                        <span>Target: {metric.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.min((metric.current / metric.target) * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="complaints"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stackId="2"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complaint Activity Heatmap</CardTitle>
              <p className="text-sm text-muted-foreground">
                Peak hours and days for complaint submissions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Days of Week vs Hours</div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span>Low</span>
                    <div className="w-20 h-3 bg-gradient-to-r from-blue-100 to-blue-600 rounded" />
                    <span>High</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart>
                    <XAxis
                      type="number"
                      dataKey="hour"
                      domain={[0, 23]}
                      ticks={[0, 6, 12, 18, 23]}
                    />
                    <YAxis
                      type="number"
                      dataKey="day"
                      domain={[0, 6]}
                      tickFormatter={(value) =>
                        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][value]
                      }
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 border rounded shadow">
                              <p>
                                {data.dayName} {data.hour}:00
                              </p>
                              <p>Complaints: {data.value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter data={heatmapData} shape={HeatmapCell} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SLA Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="slaCompliance"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { range: "< 1 day", count: 342, percentage: 27 },
                    { range: "1-2 days", count: 456, percentage: 37 },
                    { range: "2-3 days", count: 298, percentage: 24 },
                    { range: "3-5 days", count: 124, percentage: 10 },
                    { range: "> 5 days", count: 28, percentage: 2 },
                  ].map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {item.range}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="wards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ward Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.wards}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="complaints" fill="#3B82F6" />
                  <Bar yAxisId="left" dataKey="resolved" fill="#10B981" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="slaScore"
                    stroke="#F59E0B"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.categories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#3B82F6" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgTime"
                    stroke="#EF4444"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Status */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-80">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <div>
                  <h3 className="font-medium">Generating Report</h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we compile your analytics data...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
