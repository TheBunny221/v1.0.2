import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Progress } from "../components/ui/progress";
// Recharts components will be loaded dynamically to prevent module loading issues
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
// date-fns and export utilities will be loaded dynamically

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
  const { appName, appLogoUrl, getConfig } = useSystemConfig();

  // Dynamic imports state
  const [rechartsLoaded, setRechartsLoaded] = useState(false);
  const [dateFnsLoaded, setDateFnsLoaded] = useState(false);
  const [exportUtilsLoaded, setExportUtilsLoaded] = useState(false);
  const [dynamicLibraries, setDynamicLibraries] = useState<any>({});
  const [libraryLoadError, setLibraryLoadError] = useState<string | null>(null);

  // Load dynamic libraries
  const loadDynamicLibraries = useCallback(async () => {
    try {
      // Load recharts
      if (!rechartsLoaded) {
        const recharts = await import("recharts");
        setDynamicLibraries((prev) => ({ ...prev, recharts }));
        setRechartsLoaded(true);
      }

      // Load date-fns
      if (!dateFnsLoaded) {
        const dateFns = await import("date-fns");
        setDynamicLibraries((prev) => ({ ...prev, dateFns }));
        setDateFnsLoaded(true);
      }

      // Load export utilities
      if (!exportUtilsLoaded) {
        const exportUtils = await import("../utils/exportUtils");
        setDynamicLibraries((prev) => ({ ...prev, exportUtils }));
        setExportUtilsLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load dynamic libraries:", error);
      setLibraryLoadError(
        "Failed to load required libraries. Some features may not work.",
      );
    }
  }, [rechartsLoaded, dateFnsLoaded, exportUtilsLoaded]);

  // Load libraries on component mount
  useEffect(() => {
    loadDynamicLibraries();
  }, [loadDynamicLibraries]);

  // Initialize date filters when date-fns is loaded
  useEffect(() => {
    if (dateFnsLoaded && dynamicLibraries.dateFns) {
      const { format, startOfMonth, endOfMonth } = dynamicLibraries.dateFns;
      try {
        setFilters((prev) => ({
          ...prev,
          dateRange: {
            from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
            to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
          },
        }));
      } catch (error) {
        console.error("Error initializing date filters:", error);
      }
    }
  }, [dateFnsLoaded, dynamicLibraries.dateFns]);

  // State for filters - initialize with current date strings
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      from: new Date().toISOString().split("T")[0], // Will be updated when date-fns loads
      to: new Date().toISOString().split("T")[0],
    },
    ward: "all",
    complaintType: "all",
    status: "all",
    priority: "all",
  });

  // State for data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportAbortController, setReportAbortController] =
    useState<AbortController | null>(null);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Get role-based access permissions
  const permissions = useMemo(() => {
    const role = user?.role;
    return {
      canViewAllWards: role === "ADMINISTRATOR",
      canViewMaintenanceTasks:
        role === "MAINTENANCE_TEAM" || role === "ADMINISTRATOR",
      canExportData: role === "ADMINISTRATOR" || role === "WARD_OFFICER",
      defaultWard: role === "WARD_OFFICER" ? user?.wardId : "all",
    };
  }, [user]);

  // Apply role-based filter restrictions
  useEffect(() => {
    if (permissions.defaultWard !== "all") {
      setFilters((prev) => ({
        ...prev,
        ward: permissions.defaultWard,
      }));
    }
  }, [permissions.defaultWard]);

  // Initial data fetch to get actual date range
  useEffect(() => {
    const fetchInitialData = async () => {
      if (filtersInitialized) return;

      try {
        // Fetch data without date filters to get full range
        const queryParams = new URLSearchParams();

        // Only apply role-based filters for initial fetch
        if (user?.role === "WARD_OFFICER" && user?.wardId) {
          queryParams.set("ward", user.wardId);
        } else if (user?.role === "MAINTENANCE_TEAM") {
          queryParams.set("assignedTo", user.id);
        }

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

        if (response.ok) {
          const data = await response.json();
          console.log("Initial data fetch:", data);

          // Initialize filters from this data
          if (data.data?.trends && data.data.trends.length > 0) {
            const dates = data.data.trends
              .map((t) => new Date(t.date))
              .sort((a, b) => a.getTime() - b.getTime());

            // Use fallback date formatting since date-fns might not be loaded yet
            const earliestDate = dates[0].toISOString().split("T")[0];
            const latestDate = dates[dates.length - 1]
              .toISOString()
              .split("T")[0];

            console.log("Setting initial date range:", {
              earliestDate,
              latestDate,
            });

            // Set filters without triggering a new fetch loop
            setFilters((prev) => ({
              ...prev,
              dateRange: {
                from: earliestDate,
                to: latestDate,
              },
            }));

            // Also set the initial analytics data
            const transformedData = {
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
                firstCallResolution:
                  data.data?.performance?.firstCallResolution || 0,
                repeatComplaints: data.data?.performance?.repeatComplaints || 0,
              },
            };

            setAnalyticsData(transformedData);
            setIsLoading(false);
          }
          setFiltersInitialized(true);
        }
      } catch (error) {
        console.error("Initial data fetch error:", error);
        // Fallback to current month if initial fetch fails
        setFiltersInitialized(true);
      }
    };

    if (user && !filtersInitialized) {
      fetchInitialData();
    }
  }, [user, filtersInitialized]);

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

      console.log("Fetching analytics with params:", {
        filters,
        queryString: queryParams.toString(),
        url: `/api/reports/analytics?${queryParams}`,
      });

      // Use different endpoints based on user role
      let endpoint = "/api/reports/analytics";
      if (user?.role === "MAINTENANCE_TEAM") {
        endpoint = "/api/maintenance/analytics";
      }

      // Use absolute URL to match the deployed environment
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}${endpoint}?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch analytics data: ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("Received analytics data:", data);

      // Transform the API response to match the expected format
      const transformedData = {
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

      setAnalyticsData(transformedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load analytics data",
      );
      console.error("Analytics fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, user?.role, filtersInitialized]);

  // Debounced effect for filter changes to improve performance
  useEffect(() => {
    if (!filtersInitialized) return;

    const timeoutId = setTimeout(() => {
      console.log("Filters changed, fetching new data:", filters);
      fetchAnalyticsData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchAnalyticsData, filtersInitialized]);

  // Force re-fetch when filters change (only after initialization)
  useEffect(() => {
    if (!filtersInitialized) return;

    console.log("Filter state updated:", filters);
    setAnalyticsData(null); // Clear existing data to show loading
  }, [filters, filtersInitialized]);

  // Export functionality with enhanced features
  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    if (!permissions.canExportData) {
      alert("You don't have permission to export data");
      return;
    }

    if (!analyticsData) {
      alert("No data available for export");
      return;
    }

    if (!exportUtilsLoaded || !dynamicLibraries.exportUtils) {
      alert(
        "Export functionality is still loading. Please try again in a moment.",
      );
      return;
    }

    setIsExporting(true);
    try {
      const {
        validateExportPermissions,
        exportToPDF,
        exportToExcel,
        exportToCSV,
      } = dynamicLibraries.exportUtils;

      const queryParams = new URLSearchParams({
        from: filters.dateRange.from,
        to: filters.dateRange.to,
        ...(filters.ward !== "all" && { ward: filters.ward }),
        ...(filters.complaintType !== "all" && { type: filters.complaintType }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.priority !== "all" && { priority: filters.priority }),
      });

      // Validate export permissions based on role
      const requestedData = {
        includesOtherWards:
          filters.ward === "all" && user?.role !== "ADMINISTRATOR",
        includesUnassignedComplaints:
          user?.role === "MAINTENANCE_TEAM" && filters.ward === "all",
      };

      if (!validateExportPermissions(user?.role || "", requestedData)) {
        alert(
          "You don't have permission to export data outside your assigned scope",
        );
        return;
      }

      // Fetch detailed data for export with real-time backend call
      const baseUrl = window.location.origin;
      const response = await fetch(
        `${baseUrl}/api/reports/export?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch export data");
      }

      const exportData = await response.json();

      if (!exportData.success) {
        throw new Error(exportData.message || "Export failed");
      }

      // Prepare export options with system config
      const exportOptions = {
        systemConfig: {
          appName,
          appLogoUrl,
          complaintIdPrefix: getConfig("COMPLAINT_ID_PREFIX", "KSC"),
        },
        userRole: user?.role || "Unknown",
        userWard: user?.ward || permissions.defaultWard,
        includeCharts: true,
        maxRecords: user?.role === "ADMINISTRATOR" ? 1000 : 500,
      };

      // Use appropriate export utility based on format
      switch (format) {
        case "pdf":
          await exportToPDF(
            exportData.data,
            analyticsData.trends,
            analyticsData.categories,
            exportOptions,
          );
          break;
        case "excel":
          exportToExcel(
            exportData.data,
            analyticsData.trends,
            analyticsData.categories,
            exportOptions,
          );
          break;
        case "csv":
          exportToCSV(exportData.data, exportOptions);
          break;
      }
    } catch (err) {
      console.error("Export error:", err);
      alert(
        `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsExporting(false);
    }
  };

  // Generate custom report with countdown and cancellation
  const handleGenerateReport = async () => {
    if (isGeneratingReport) return;

    setIsGeneratingReport(true);
    setShowReportModal(true);
    setReportProgress(0);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    setReportAbortController(abortController);

    try {
      // Start countdown timer - more realistic progression
      let progress = 0;
      const timer = setInterval(() => {
        progress += Math.random() * 3 + 1; // Random increment between 1-4
        if (progress > 95) progress = 95; // Cap at 95% until API responds
        setReportProgress(progress);
      }, 200); // Update every 200ms

      // Prepare query parameters
      const queryParams = new URLSearchParams({
        from: filters.dateRange.from,
        to: filters.dateRange.to,
        ...(filters.ward !== "all" && { ward: filters.ward }),
        ...(filters.complaintType !== "all" && { type: filters.complaintType }),
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.priority !== "all" && { priority: filters.priority }),
        detailed: "true",
      });

      // Make API call with abort signal
      const baseUrl = window.location.origin;
      const response = await fetch(
        `${baseUrl}/api/reports/analytics?${queryParams}`,
        {
          signal: abortController.signal,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const reportData = await response.json();

      // Clear timer
      clearInterval(timer);
      setReportProgress(100);

      // Wait a bit to show completion
      setTimeout(() => {
        setShowReportModal(false);
        setIsGeneratingReport(false);
        setReportAbortController(null);

        // Update analytics data with fresh report data
        setAnalyticsData(reportData.data);

        // Report completed successfully - no alert needed
        console.log(
          `Report generated successfully! Found ${reportData.data?.complaints?.total || 0} records based on applied filters.`,
        );
      }, 500);
    } catch (error) {
      clearInterval(timer);

      if (error.name === "AbortError") {
        console.log("Report generation cancelled by user");
      } else {
        console.error("Report generation error:", error);
        alert(`Failed to generate report: ${error.message}`);
      }

      setShowReportModal(false);
      setIsGeneratingReport(false);
      setReportAbortController(null);
      setReportProgress(0);
    }
  };

  // Cancel report generation
  const handleCancelReport = () => {
    if (reportAbortController) {
      reportAbortController.abort();
    }
    setShowReportModal(false);
    setIsGeneratingReport(false);
    setReportAbortController(null);
    setReportProgress(0);
  };

  // Calculate time period for chart titles
  const getTimePeriodLabel = useCallback(() => {
    if (!dateFnsLoaded || !dynamicLibraries.dateFns) {
      return `${filters.dateRange.from} - ${filters.dateRange.to}`;
    }

    try {
      const { format } = dynamicLibraries.dateFns;
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Format dates for display
      const formatDate = (date: Date) => format(date, "MMM dd, yyyy");
      const fromFormatted = formatDate(fromDate);
      const toFormatted = formatDate(toDate);

      // Determine period type
      if (diffDays <= 1) {
        return `${fromFormatted}`;
      } else if (diffDays <= 7) {
        return `Past Week (${fromFormatted} - ${toFormatted})`;
      } else if (diffDays <= 31) {
        return `Past Month (${fromFormatted} - ${toFormatted})`;
      } else if (diffDays <= 90) {
        return `Past 3 Months (${fromFormatted} - ${toFormatted})`;
      } else {
        return `${fromFormatted} - ${toFormatted}`;
      }
    } catch (error) {
      console.error("Error formatting date period:", error);
      return `${filters.dateRange.from} - ${filters.dateRange.to}`;
    }
  }, [filters.dateRange, dateFnsLoaded, dynamicLibraries.dateFns]);

  // Chart colors
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  // Memoized chart data processing for better performance
  const processedChartData = useMemo(() => {
    if (!analyticsData) return null;

    console.log("Processing chart data:", analyticsData);

    let trendsData = [];
    if (analyticsData.trends) {
      if (dateFnsLoaded && dynamicLibraries.dateFns) {
        try {
          const { format } = dynamicLibraries.dateFns;
          trendsData = analyticsData.trends.map((trend) => ({
            ...trend,
            date: format(new Date(trend.date), "MMM dd"),
            fullDate: format(new Date(trend.date), "MMM dd, yyyy"),
            rawDate: trend.date,
          }));
        } catch (error) {
          console.error("Error formatting trend dates:", error);
          trendsData = analyticsData.trends.map((trend) => ({
            ...trend,
            date: new Date(trend.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            fullDate: new Date(trend.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            rawDate: trend.date,
          }));
        }
      } else {
        // Fallback formatting without date-fns
        trendsData = analyticsData.trends.map((trend) => ({
          ...trend,
          date: new Date(trend.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          fullDate: new Date(trend.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          rawDate: trend.date,
        }));
      }
    }

    return {
      trendsData,
      categoriesWithColors:
        analyticsData.categories?.map((category, index) => ({
          ...category,
          color: COLORS[index % COLORS.length],
        })) || [],
      wardsData:
        analyticsData.wards?.map((ward) => ({
          ...ward,
          efficiency:
            ward.complaints > 0 ? (ward.resolved / ward.complaints) * 100 : 0,
        })) || [],
    };
  }, [analyticsData, filters, dateFnsLoaded, dynamicLibraries.dateFns]); // Added dependencies

  // Helper function to render charts with dynamic recharts
  const renderChart = (chartType: string, chartProps: any) => {
    if (!rechartsLoaded || !dynamicLibraries.recharts) {
      return (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p>Loading chart...</p>
          </div>
        </div>
      );
    }

    try {
      const {
        ResponsiveContainer,
        AreaChart,
        Area,
        PieChart,
        Pie,
        Cell,
        BarChart,
        Bar,
        ComposedChart,
        LineChart,
        Line,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        Legend,
      } = dynamicLibraries.recharts;

      const { data, ...otherProps } = chartProps;

      switch (chartType) {
        case "area":
          return (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...otherProps.xAxis} />
                <YAxis />
                <Tooltip {...otherProps.tooltip} />
                <Legend />
                {otherProps.areas?.map((area: any, index: number) => (
                  <Area key={index} {...area} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          );
        case "pie":
          return (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie {...otherProps.pie} data={data}>
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...otherProps.tooltip} />
              </PieChart>
            </ResponsiveContainer>
          );
        case "bar":
          return (
            <ResponsiveContainer width="100%" height={otherProps.height || 300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...otherProps.xAxis} />
                <YAxis />
                <Tooltip />
                <Legend />
                {otherProps.bars?.map((bar: any, index: number) => (
                  <Bar key={index} {...bar} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          );
        case "composed":
          return (
            <ResponsiveContainer width="100%" height={otherProps.height || 400}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis {...otherProps.xAxis} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip {...otherProps.tooltip} />
                <Legend />
                {otherProps.bars?.map((bar: any, index: number) => (
                  <Bar key={index} {...bar} />
                ))}
                {otherProps.lines?.map((line: any, index: number) => (
                  <Line key={index} {...line} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          );
        default:
          return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p>Chart type not supported</p>
            </div>
          );
      }
    } catch (error) {
      console.error("Error rendering chart:", error);
      return (
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <p>Error loading chart</p>
          </div>
        </div>
      );
    }
  };

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

  if (libraryLoadError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Feature Loading Error</h2>
          <p className="text-gray-600 mb-4">{libraryLoadError}</p>
          <Button onClick={loadDynamicLibraries}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading Features
          </Button>
        </div>
      </div>
    );
  }

  if (!rechartsLoaded || !dateFnsLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading chart libraries...</span>
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
            {appName} -{" "}
            {user?.role === "ADMINISTRATOR"
              ? "Comprehensive system-wide insights and analytics"
              : user?.role === "WARD_OFFICER"
                ? `Analytics for ${user?.ward || "your ward"}`
                : "Your assigned task analytics and performance metrics"}
          </p>
          <div className="mt-2">
            <Badge variant="secondary" className="text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              Data Period: {getTimePeriodLabel()}
            </Badge>
          </div>
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
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, from: e.target.value },
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
                  setFilters((prev) => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, to: e.target.value },
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
                    setFilters((prev) => ({ ...prev, ward: value }))
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
                  setFilters((prev) => ({ ...prev, complaintType: value }))
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
                  setFilters((prev) => ({ ...prev, status: value }))
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
            <Button
              variant="outline"
              onClick={() => {
                console.log("Resetting filters...");
                // Reset to original data range if available
                if (analyticsData?.trends && analyticsData.trends.length > 0) {
                  const dates = analyticsData.trends
                    .map((t) => new Date(t.date))
                    .sort((a, b) => a.getTime() - b.getTime());
                  // Use fallback date formatting
                  const earliestDate = dates[0].toISOString().split("T")[0];
                  const latestDate = dates[dates.length - 1]
                    .toISOString()
                    .split("T")[0];

                  setFilters({
                    dateRange: {
                      from: earliestDate,
                      to: latestDate,
                    },
                    ward: permissions.defaultWard,
                    complaintType: "all",
                    status: "all",
                    priority: "all",
                  });
                } else {
                  // Fallback to current month if no data
                  const now = new Date();
                  const firstDay = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1,
                  );
                  const lastDay = new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    0,
                  );

                  setFilters({
                    dateRange: {
                      from: firstDay.toISOString().split("T")[0],
                      to: lastDay.toISOString().split("T")[0],
                    },
                    ward: permissions.defaultWard,
                    complaintType: "all",
                    status: "all",
                    priority: "all",
                  });
                }
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {isGeneratingReport ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Key Metrics</h2>
        <Badge variant="outline" className="text-xs">
          <Calendar className="h-3 w-3 mr-1" />
          {getTimePeriodLabel()}
        </Badge>
      </div>
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Complaints
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.complaints.total}
              </div>
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
              <div className="text-2xl font-bold">
                {analyticsData.complaints.resolved}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                {(
                  (analyticsData.complaints.resolved /
                    analyticsData.complaints.total) *
                  100
                ).toFixed(1)}
                % resolution rate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                SLA Compliance
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.sla.compliance}%
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Avg: {analyticsData.sla.avgResolutionTime} days
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Satisfaction
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.performance.userSatisfaction.toFixed(2)}/5
              </div>
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
            {permissions.canViewAllWards && (
              <TabsTrigger value="wards">Ward Analysis</TabsTrigger>
            )}
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Complaints Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Complaints Trend</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getTimePeriodLabel()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div id="trends-chart">
                    {processedChartData?.trendsData?.length > 0 ? (
                      renderChart("area", {
                        data: processedChartData.trendsData,
                        xAxis: {
                          dataKey: "date",
                          tick: { fontSize: 12 },
                          angle: -45,
                          textAnchor: "end",
                          height: 60,
                        },
                        tooltip: {
                          labelFormatter: (label: any, payload: any) => {
                            if (payload && payload[0]) {
                              return `Date: ${payload[0].payload.fullDate || label}`;
                            }
                            return `Date: ${label}`;
                          },
                          formatter: (value: any, name: any) => [
                            value,
                            name === "complaints"
                              ? "Total Complaints"
                              : "Resolved Complaints",
                          ],
                        },
                        areas: [
                          {
                            type: "monotone",
                            dataKey: "complaints",
                            stackId: "1",
                            stroke: "#8884d8",
                            fill: "#8884d8",
                          },
                          {
                            type: "monotone",
                            dataKey: "resolved",
                            stackId: "1",
                            stroke: "#82ca9d",
                            fill: "#82ca9d",
                          },
                        ],
                      })
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No trend data available for selected period</p>
                          <p className="text-sm font-medium">
                            {getTimePeriodLabel()}
                          </p>
                          <p className="text-xs">
                            Try adjusting your date range or filters
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Complaint Categories</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getTimePeriodLabel()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div id="categories-chart">
                    {processedChartData?.categoriesWithColors?.length > 0 ? (
                      renderChart("pie", {
                        data: processedChartData.categoriesWithColors,
                        pie: {
                          cx: "50%",
                          cy: "50%",
                          labelLine: false,
                          label: ({ name, percent }: any) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`,
                          outerRadius: 80,
                          fill: "#8884d8",
                          dataKey: "count",
                        },
                        tooltip: {
                          formatter: (value: any, name: any) => [
                            `${value} complaints`,
                            name,
                          ],
                          labelFormatter: (label: any) => `Category: ${label}`,
                        },
                      })
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No category data available for selected period</p>
                          <p className="text-sm font-medium">
                            {getTimePeriodLabel()}
                          </p>
                          <p className="text-xs">
                            Try adjusting your filters or date range
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Trends Analysis</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {getTimePeriodLabel()}
                </p>
              </CardHeader>
              <CardContent>
                <div id="detailed-trends-chart">
                  {renderChart("composed", {
                    data: processedChartData?.trendsData || [],
                    height: 400,
                    xAxis: {
                      dataKey: "date",
                      tick: { fontSize: 12 },
                      angle: -45,
                      textAnchor: "end",
                      height: 60,
                    },
                    tooltip: {
                      labelFormatter: (label: any, payload: any) => {
                        if (payload && payload[0]) {
                          return `Date: ${payload[0].payload.fullDate || label}`;
                        }
                        return `Date: ${label}`;
                      },
                      formatter: (value: any, name: any) => [
                        name === "slaCompliance" ? `${value}%` : value,
                        name === "slaCompliance" ? "SLA Compliance" : name,
                      ],
                    },
                    bars: [
                      {
                        yAxisId: "left",
                        dataKey: "complaints",
                        fill: "#8884d8",
                      },
                      { yAxisId: "left", dataKey: "resolved", fill: "#82ca9d" },
                    ],
                    lines: [
                      {
                        yAxisId: "right",
                        type: "monotone",
                        dataKey: "slaCompliance",
                        stroke: "#ff7300",
                      },
                    ],
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getTimePeriodLabel()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>User Satisfaction</span>
                      <Badge variant="outline">
                        {analyticsData.performance.userSatisfaction.toFixed(2)}
                        /5
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Escalation Rate</span>
                      <Badge variant="outline">
                        {analyticsData.performance.escalationRate.toFixed(2)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>First Call Resolution</span>
                      <Badge variant="outline">
                        {analyticsData.performance.firstCallResolution.toFixed(
                          2,
                        )}
                        %
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Repeat Complaints</span>
                      <Badge variant="outline">
                        {analyticsData.performance.repeatComplaints.toFixed(2)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resolution Time Distribution</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getTimePeriodLabel()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div id="resolution-time-chart">
                    {renderChart("bar", {
                      data: processedChartData?.categoriesWithColors || [],
                      xAxis: {
                        dataKey: "name",
                        tick: { fontSize: 11 },
                        angle: -45,
                        textAnchor: "end",
                        height: 80,
                      },
                      bars: [{ dataKey: "avgTime", fill: "#8884d8" }],
                    })}
                  </div>
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
                  <p className="text-sm text-muted-foreground mt-1">
                    {getTimePeriodLabel()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div id="ward-performance-chart">
                    {renderChart("bar", {
                      data: processedChartData?.wardsData || [],
                      height: 400,
                      xAxis: {
                        dataKey: "name",
                        tick: { fontSize: 11 },
                        angle: -45,
                        textAnchor: "end",
                        height: 80,
                      },
                      bars: [
                        { dataKey: "complaints", fill: "#8884d8" },
                        { dataKey: "resolved", fill: "#82ca9d" },
                      ],
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Analysis</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {getTimePeriodLabel()}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(processedChartData?.categoriesWithColors || []).map(
                    (category, index) => (
                      <div
                        key={category.name}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{category.count} complaints</span>
                          <span>Avg: {category.avgTime} days</span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Report Generation Modal */}
      <Dialog open={showReportModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Generating Report
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">
                Generating Report...
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                Processing {getTimePeriodLabel()} data
              </div>

              {/* Circular Progress with Timer */}
              <div className="relative inline-flex items-center justify-center mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-gray-200">
                  <div
                    className="w-20 h-20 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
                    style={{
                      animation: "spin 2s linear infinite",
                    }}
                  ></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">
                    {Math.floor(reportProgress)}%
                  </span>
                </div>
              </div>

              <Progress value={reportProgress} className="w-full mb-2" />
              <div className="text-sm text-muted-foreground">
                {reportProgress < 100
                  ? `Estimated time remaining: ${Math.max(0, Math.ceil((100 - reportProgress) * 0.05))} seconds`
                  : "Finalizing report..."}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Report Scope</span>
              </div>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Period:</span>
                  <span className="font-medium">{getTimePeriodLabel()}</span>
                </div>
                {filters.ward !== "all" && (
                  <div className="flex justify-between">
                    <span>Ward:</span>
                    <span className="font-medium">{filters.ward}</span>
                  </div>
                )}
                {filters.complaintType !== "all" && (
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{filters.complaintType}</span>
                  </div>
                )}
                {filters.status !== "all" && (
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">{filters.status}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelReport}
              disabled={reportProgress >= 100}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedReports;
