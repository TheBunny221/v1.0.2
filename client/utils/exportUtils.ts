import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface ExportData {
  complaints: any[];
  summary: {
    total: number;
    resolved: number;
    pending: number;
  };
  filters: any;
  exportedAt: string;
}

interface ChartDataPoint {
  date: string;
  complaints: number;
  resolved: number;
  slaCompliance: number;
}

interface CategoryData {
  name: string;
  count: number;
  avgTime: number;
}

// Export reports to PDF
export const exportToPDF = async (
  data: ExportData,
  trendsData: ChartDataPoint[],
  categoriesData: CategoryData[],
  userRole: string,
  organizationName: string = "Cochin Smart City"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Complaint Management Report", pageWidth / 2, yPosition, { align: "center" });
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(organizationName, pageWidth / 2, yPosition, { align: "center" });
  
  yPosition += 20;

  // Report Info
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date(data.exportedAt).toLocaleString()}`, 20, yPosition);
  yPosition += 6;
  doc.text(`User Role: ${userRole}`, 20, yPosition);
  yPosition += 6;
  
  // Filters
  if (data.filters.from && data.filters.to) {
    doc.text(`Date Range: ${data.filters.from} to ${data.filters.to}`, 20, yPosition);
    yPosition += 6;
  }
  if (data.filters.ward && data.filters.ward !== "all") {
    doc.text(`Ward: ${data.filters.ward}`, 20, yPosition);
    yPosition += 6;
  }
  if (data.filters.type && data.filters.type !== "all") {
    doc.text(`Type: ${data.filters.type}`, 20, yPosition);
    yPosition += 6;
  }
  if (data.filters.status && data.filters.status !== "all") {
    doc.text(`Status: ${data.filters.status}`, 20, yPosition);
    yPosition += 6;
  }

  yPosition += 10;

  // Summary Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Summary", 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summaryLines = [
    `Total Complaints: ${data.summary.total}`,
    `Resolved Complaints: ${data.summary.resolved}`,
    `Pending Complaints: ${data.summary.pending}`,
    `Resolution Rate: ${((data.summary.resolved / data.summary.total) * 100).toFixed(1)}%`,
  ];

  summaryLines.forEach(line => {
    doc.text(line, 20, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Categories Section
  if (categoriesData.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Complaint Categories", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    categoriesData.forEach(category => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`${category.name}: ${category.count} complaints (Avg: ${category.avgTime.toFixed(1)} days)`, 20, yPosition);
      yPosition += 6;
    });
  }

  // New page for detailed data
  doc.addPage();
  yPosition = 20;

  // Detailed Complaints Table
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Complaint Report", 20, yPosition);
  yPosition += 15;

  // Table headers
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  const headers = ["ID", "Type", "Status", "Priority", "Created", "Ward"];
  let xPosition = 20;
  const columnWidths = [25, 30, 20, 20, 25, 30];

  headers.forEach((header, index) => {
    doc.text(header, xPosition, yPosition);
    xPosition += columnWidths[index];
  });

  yPosition += 8;
  doc.setFont("helvetica", "normal");

  // Table data
  data.complaints.slice(0, 50).forEach((complaint, index) => { // Limit to 50 for PDF
    if (yPosition > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }

    xPosition = 20;
    const rowData = [
      complaint.id?.toString().substring(0, 8) || "N/A",
      complaint.type?.substring(0, 12) || "N/A",
      complaint.status?.substring(0, 8) || "N/A",
      complaint.priority?.substring(0, 8) || "N/A",
      complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : "N/A",
      complaint.ward?.name?.substring(0, 12) || "N/A",
    ];

    rowData.forEach((data, colIndex) => {
      doc.text(data.toString(), xPosition, yPosition);
      xPosition += columnWidths[colIndex];
    });

    yPosition += 6;
  });

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 30,
      pageHeight - 10,
      { align: "right" }
    );
  }

  // Save the PDF
  doc.save(`complaints-report-${Date.now()}.pdf`);
};

// Export reports to Excel
export const exportToExcel = (
  data: ExportData,
  trendsData: ChartDataPoint[],
  categoriesData: CategoryData[],
  userRole: string,
  organizationName: string = "Cochin Smart City"
) => {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const summaryData = [
    ["Complaint Management Report"],
    [organizationName],
    [""],
    ["Generated on:", new Date(data.exportedAt).toLocaleString()],
    ["User Role:", userRole],
    [""],
    ["Filters Applied:"],
    ["Date Range:", data.filters.from && data.filters.to ? `${data.filters.from} to ${data.filters.to}` : "All dates"],
    ["Ward:", data.filters.ward || "All wards"],
    ["Type:", data.filters.type || "All types"],
    ["Status:", data.filters.status || "All statuses"],
    [""],
    ["Executive Summary:"],
    ["Total Complaints:", data.summary.total],
    ["Resolved Complaints:", data.summary.resolved],
    ["Pending Complaints:", data.summary.pending],
    ["Resolution Rate:", `${((data.summary.resolved / data.summary.total) * 100).toFixed(1)}%`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Detailed Complaints Sheet
  const complaintsData = data.complaints.map(complaint => ({
    "Complaint ID": complaint.id || "N/A",
    "Type": complaint.type || "N/A",
    "Description": complaint.description || "N/A",
    "Status": complaint.status || "N/A",
    "Priority": complaint.priority || "N/A",
    "Ward": complaint.ward?.name || "N/A",
    "Created Date": complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : "N/A",
    "Resolved Date": complaint.resolvedOn ? new Date(complaint.resolvedOn).toLocaleDateString() : "Not resolved",
    "Assigned To": complaint.assignedTo?.fullName || "Unassigned",
    "Citizen Name": complaint.submittedBy?.fullName || "Guest",
    "Contact Phone": complaint.contactPhone || "N/A",
    "Contact Email": complaint.contactEmail || "N/A",
    "Location": complaint.location || "N/A",
    "Landmark": complaint.landmark || "N/A",
  }));

  const complaintsSheet = XLSX.utils.json_to_sheet(complaintsData);
  XLSX.utils.book_append_sheet(workbook, complaintsSheet, "Complaints");

  // Trends Sheet
  if (trendsData.length > 0) {
    const trendsSheet = XLSX.utils.json_to_sheet(trendsData.map(trend => ({
      "Date": trend.date,
      "New Complaints": trend.complaints,
      "Resolved Complaints": trend.resolved,
      "SLA Compliance %": trend.slaCompliance.toFixed(1),
    })));
    XLSX.utils.book_append_sheet(workbook, trendsSheet, "Trends");
  }

  // Categories Sheet
  if (categoriesData.length > 0) {
    const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData.map(category => ({
      "Category": category.name,
      "Total Complaints": category.count,
      "Average Resolution Time (days)": category.avgTime.toFixed(1),
    })));
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categories");
  }

  // Set column widths
  const wscols = [
    { wch: 15 }, // Complaint ID
    { wch: 20 }, // Type
    { wch: 50 }, // Description
    { wch: 15 }, // Status
    { wch: 10 }, // Priority
    { wch: 15 }, // Ward
    { wch: 12 }, // Created Date
    { wch: 12 }, // Resolved Date
    { wch: 20 }, // Assigned To
    { wch: 20 }, // Citizen Name
    { wch: 15 }, // Contact Phone
    { wch: 25 }, // Contact Email
    { wch: 30 }, // Location
    { wch: 20 }, // Landmark
  ];

  complaintsSheet["!cols"] = wscols;

  // Save the Excel file
  XLSX.writeFile(workbook, `complaints-report-${Date.now()}.xlsx`);
};

// Export CSV
export const exportToCSV = (data: ExportData) => {
  const complaintsData = data.complaints.map(complaint => ({
    "Complaint ID": complaint.id || "N/A",
    "Type": complaint.type || "N/A",
    "Description": complaint.description || "N/A",
    "Status": complaint.status || "N/A",
    "Priority": complaint.priority || "N/A",
    "Ward": complaint.ward?.name || "N/A",
    "Created Date": complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : "N/A",
    "Resolved Date": complaint.resolvedOn ? new Date(complaint.resolvedOn).toLocaleDateString() : "Not resolved",
    "Assigned To": complaint.assignedTo?.fullName || "Unassigned",
    "Citizen Name": complaint.submittedBy?.fullName || "Guest",
    "Contact Phone": complaint.contactPhone || "N/A",
    "Contact Email": complaint.contactEmail || "N/A",
    "Location": complaint.location || "N/A",
    "Landmark": complaint.landmark || "N/A",
  }));

  const worksheet = XLSX.utils.json_to_sheet(complaintsData);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  // Create and download CSV file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `complaints-report-${Date.now()}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Utility function to format data for charts
export const formatDataForChart = (data: any[], dateField: string = "createdAt") => {
  const groupedData = new Map();
  
  data.forEach(item => {
    const date = new Date(item[dateField]).toISOString().split('T')[0];
    if (!groupedData.has(date)) {
      groupedData.set(date, { date, count: 0, resolved: 0 });
    }
    const dayData = groupedData.get(date);
    dayData.count++;
    if (item.status === "resolved") {
      dayData.resolved++;
    }
  });

  return Array.from(groupedData.values()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

// Utility function to get color palette for charts
export const getChartColors = (count: number) => {
  const baseColors = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", 
    "#82CA9D", "#FFC658", "#FF7C7C", "#8DD1E1", "#D084D0"
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
};
