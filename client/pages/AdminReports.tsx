import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  TrendingUp,
  Clock,
  Users,
  MapPin,
  Filter,
} from "lucide-react";

const AdminReports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedWard, setSelectedWard] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const reportMetrics = {
    totalComplaints: 1247,
    resolvedComplaints: 1089,
    slaCompliance: 87.3,
    avgResolutionTime: 2.4, // days
    citizenSatisfaction: 4.2, // out of 5
  };

  const wardPerformance = [
    { ward: "Ward 1", complaints: 234, resolved: 201, slaCompliance: 85.9 },
    { ward: "Ward 2", complaints: 298, resolved: 267, slaCompliance: 89.6 },
    { ward: "Ward 3", complaints: 189, resolved: 165, slaCompliance: 87.3 },
    { ward: "Ward 4", complaints: 276, resolved: 241, slaCompliance: 87.3 },
    { ward: "Ward 5", complaints: 250, resolved: 215, slaCompliance: 86.0 },
  ];

  const complaintTrends = [
    { month: "Jan", total: 234, resolved: 201 },
    { month: "Feb", total: 298, resolved: 267 },
    { month: "Mar", total: 189, resolved: 165 },
    { month: "Apr", total: 276, resolved: 241 },
    { month: "May", total: 250, resolved: 215 },
  ];

  const typeBreakdown = [
    { type: "Water Supply", count: 287, percentage: 23 },
    { type: "Electricity", count: 243, percentage: 19.5 },
    { type: "Road Repair", count: 198, percentage: 15.9 },
    { type: "Garbage Collection", count: 167, percentage: 13.4 },
    { type: "Street Lighting", count: 134, percentage: 10.7 },
    { type: "Others", count: 218, percentage: 17.5 },
  ];

  const exportReport = (format: "pdf" | "excel") => {
    console.log(`Exporting report in ${format} format...`);
    // Here you would implement the actual export functionality
  };

  const generateReport = () => {
    console.log("Generating custom report with filters:", {
      period: selectedPeriod,
      ward: selectedWard,
      type: selectedType,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive complaint management insights
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportReport("excel")}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => exportReport("pdf")}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={generateReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Report Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ward</Label>
              <Select value={selectedWard} onValueChange={setSelectedWard}>
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <Label>Complaint Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
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

            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Complaints
                </p>
                <p className="text-2xl font-bold">
                  {reportMetrics.totalComplaints.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold">
                  {reportMetrics.resolvedComplaints.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                <p className="text-2xl font-bold">
                  {reportMetrics.slaCompliance}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Resolution</p>
                <p className="text-2xl font-bold">
                  {reportMetrics.avgResolutionTime}d
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold">
                  {reportMetrics.citizenSatisfaction}/5
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Report Overview</TabsTrigger>
          <TabsTrigger value="export">Export Options</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Report Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">
                    Current Period Summary
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Report Period:</span>
                      <span className="font-medium">
                        {selectedPeriod === "month"
                          ? "This Month"
                          : selectedPeriod}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ward Filter:</span>
                      <span className="font-medium">
                        {selectedWard === "all" ? "All Wards" : selectedWard}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type Filter:</span>
                      <span className="font-medium">
                        {selectedType === "all" ? "All Types" : selectedType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Generated:</span>
                      <span className="font-medium">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Key Insights</h4>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800">
                        Top Performing Ward
                      </div>
                      <div className="text-green-600">
                        Ward 2 - 89.6% SLA compliance
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium text-blue-800">
                        Most Common Issue
                      </div>
                      <div className="text-blue-600">
                        Water Supply (23% of complaints)
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="font-medium text-orange-800">
                        Avg Resolution Time
                      </div>
                      <div className="text-orange-600">
                        {reportMetrics.avgResolutionTime} days
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    For detailed analytics and trends, visit the Analytics page
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() =>
                        (window.location.href = "/admin/analytics")
                      }
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Formats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => exportReport("pdf")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Report
                    <span className="ml-auto text-xs text-gray-500">
                      Formatted
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => exportReport("excel")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Excel Spreadsheet
                    <span className="ml-auto text-xs text-gray-500">
                      Raw data
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => console.log("CSV export")}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    CSV Export
                    <span className="ml-auto text-xs text-gray-500">
                      Data only
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Set up automatic report generation and delivery
                </div>

                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Daily Reports
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Weekly Summary
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Monthly Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReports;
