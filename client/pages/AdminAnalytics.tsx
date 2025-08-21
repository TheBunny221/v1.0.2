import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  Users,
  Clock,
  Target,
  MapPin,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";

const AdminAnalytics: React.FC = () => {
  // Mock data for charts
  const complaintTrends = [
    { month: "Jan", complaints: 45, resolved: 40, satisfaction: 4.2 },
    { month: "Feb", complaints: 52, resolved: 48, satisfaction: 4.1 },
    { month: "Mar", complaints: 61, resolved: 55, satisfaction: 4.3 },
    { month: "Apr", complaints: 38, resolved: 42, satisfaction: 4.5 },
    { month: "May", complaints: 67, resolved: 61, satisfaction: 4.2 },
    { month: "Jun", complaints: 74, resolved: 69, satisfaction: 4.4 },
  ];

  const wardPerformance = [
    {
      ward: "Ward 1",
      complaints: 45,
      resolved: 42,
      efficiency: 93,
      avgTime: 2.1,
    },
    {
      ward: "Ward 2",
      complaints: 38,
      resolved: 35,
      efficiency: 92,
      avgTime: 2.3,
    },
    {
      ward: "Ward 3",
      complaints: 52,
      resolved: 46,
      efficiency: 88,
      avgTime: 2.8,
    },
    {
      ward: "Ward 4",
      complaints: 29,
      resolved: 28,
      efficiency: 97,
      avgTime: 1.9,
    },
    {
      ward: "Ward 5",
      complaints: 41,
      resolved: 37,
      efficiency: 90,
      avgTime: 2.5,
    },
  ];

  const complaintTypes = [
    { name: "Water Supply", value: 35, color: "#3B82F6", resolved: 32 },
    { name: "Electricity", value: 28, color: "#EF4444", resolved: 25 },
    { name: "Road Repair", value: 22, color: "#10B981", resolved: 20 },
    { name: "Garbage", value: 15, color: "#F59E0B", resolved: 14 },
  ];

  const resolutionTimes = [
    { timeRange: "< 1 day", count: 45, percentage: 35 },
    { timeRange: "1-3 days", count: 52, percentage: 40 },
    { timeRange: "3-7 days", count: 25, percentage: 20 },
    { timeRange: "> 7 days", count: 8, percentage: 5 },
  ];

  const teamEfficiency = [
    { team: "Electrical", efficiency: 95, workload: 18, satisfaction: 4.6 },
    { team: "Water Works", efficiency: 92, workload: 22, satisfaction: 4.3 },
    {
      team: "Road Maintenance",
      efficiency: 88,
      workload: 15,
      satisfaction: 4.1,
    },
    { team: "Sanitation", efficiency: 97, workload: 12, satisfaction: 4.7 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
          <p className="text-gray-600">Comprehensive analytics and insights</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Complaints
                </p>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-xs text-green-600">↑ 12% from last month</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Resolution Rate
                </p>
                <p className="text-2xl font-bold">92.3%</p>
                <p className="text-xs text-green-600">↑ 3% from last month</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Avg Resolution
                </p>
                <p className="text-2xl font-bold">2.3 days</p>
                <p className="text-xs text-green-600">↓ 0.5 days improved</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Satisfaction
                </p>
                <p className="text-2xl font-bold">4.3/5</p>
                <p className="text-xs text-green-600">↑ 0.2 points</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="types">Complaint Types</TabsTrigger>
          <TabsTrigger value="teams">Team Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaint Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Complaint Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={complaintTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        name === "complaints"
                          ? "Complaints"
                          : name === "resolved"
                            ? "Resolved"
                            : name,
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
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

            {/* Satisfaction Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Citizen Satisfaction Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complaintTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis domain={[3.5, 5]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [
                        `${value}/5`,
                        "Satisfaction Score",
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="satisfaction"
                      stroke="#F59E0B"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Resolution Time Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Resolution Time Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resolutionTimes.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <span className="text-sm font-medium w-20">
                        {item.timeRange}
                      </span>
                      <Progress value={item.percentage} className="flex-1" />
                      <span className="text-sm text-gray-600 w-16 text-right">
                        {item.count} cases
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ward Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Ward Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={wardPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="ward"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value, name) => [`${value}%`, "Efficiency"]}
                      labelFormatter={(label) => `Ward: ${label}`}
                    />
                    <Bar dataKey="efficiency" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Ward Details */}
            <Card>
              <CardHeader>
                <CardTitle>Ward Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {wardPerformance.map((ward, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{ward.ward}</h3>
                        <Badge
                          className={`${
                            ward.efficiency >= 95
                              ? "bg-green-100 text-green-800"
                              : ward.efficiency >= 90
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {ward.efficiency}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <p className="text-gray-600">
                            Total: {ward.complaints}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">
                            Resolved: {ward.resolved}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg: {ward.avgTime}d</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="types" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaint Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Complaint Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={complaintTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {complaintTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${value} complaints`,
                        "Count",
                      ]}
                      labelFormatter={(label) => `Type: ${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {complaintTypes.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Type Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Resolution Performance by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complaintTypes.map((type, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{type.name}</span>
                        <span className="text-sm text-gray-600">
                          {type.resolved}/{type.value} (
                          {Math.round((type.resolved / type.value) * 100)}%)
                        </span>
                      </div>
                      <Progress
                        value={(type.resolved / type.value) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Team Efficiency Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {teamEfficiency.map((team, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">{team.team}</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Efficiency</span>
                          <span>{team.efficiency}%</span>
                        </div>
                        <Progress value={team.efficiency} className="h-2" />
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Active Jobs: {team.workload}</p>
                        <p>Satisfaction: {team.satisfaction}/5</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
