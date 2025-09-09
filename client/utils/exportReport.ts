import { jsPDF as _jsPDF } from "jspdf";

// Helper: convert image URL to data URL (robust against fetch instrumentation)
async function fetchImageDataURL(url: string): Promise<string | null> {
  return await new Promise((resolve) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.responseType = "blob";
      xhr.withCredentials = true;
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(xhr.response as Blob);
        } else {
          resolve(null);
        }
      };
      xhr.onerror = () => resolve(null);
      xhr.send();
    } catch {
      resolve(null);
    }
  });
}

function isImage(mime?: string | null, url?: string) {
  if (mime && mime.startsWith("image/")) return true;
  if (!mime && url) {
    const lower = url.toLowerCase();
    return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].some((ext) => lower.endsWith(ext));
  }
  return false;
}

export type ExportOptions = {
  orientation?: "p" | "l";
  title?: string;
};

export async function exportComplaintReport(complaint: any, role: string, options: ExportOptions = {}) {
  const jsPDF = _jsPDF as unknown as typeof _jsPDF;
  const orientation = options.orientation || "p";
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const gray = [245, 247, 250];
  const primary = [28, 100, 242];
  const muted = [100, 116, 139];

  const ensureSpace = (needed = 24) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderFooter();
    }
  };

  const headerTitle = options.title || "Complaint Report";

  const drawHeaderFooter = () => {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      // Header bar
      doc.setFillColor(...gray as any);
      doc.rect(0, 0, pageWidth, 56, "F");
      doc.setTextColor(primary[0], primary[1], primary[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(headerTitle, margin, 34);
      const idText = `#${complaint?.complaintId || complaint?.id || "-"}`;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(11);
      doc.text(idText, pageWidth - margin - doc.getTextWidth(idText), 34);

      // Footer
      const footerY = pageHeight - 24;
      doc.setDrawColor(230);
      doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
      doc.setFontSize(9);
      doc.setTextColor(120);
      const pageTxt = `Page ${i} of ${total}`;
      doc.text(pageTxt, pageWidth - margin - doc.getTextWidth(pageTxt), footerY);
      doc.text(new Date().toLocaleString(), margin, footerY);
    }
    doc.setPage(total);
  };

  const section = (title: string) => {
    ensureSpace(36);
    doc.setFillColor(...gray as any);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 6, 6, "F");
    doc.setTextColor(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, margin + 12, y + 18);
    y += 36;
  };

  const kv = (k: string, v: string) => {
    ensureSpace(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40);
    doc.setFontSize(10);
    const keyText = `${k}:`;
    doc.text(keyText, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(70);
    const maxWidth = pageWidth - margin * 2 - doc.getTextWidth(keyText) - 8;
    const lines = doc.splitTextToSize(v || "-", maxWidth);
    doc.text(lines, margin + doc.getTextWidth(keyText) + 8, y);
    y += (Array.isArray(lines) ? lines.length : 1) * 14;
  };

  const paragraph = (text: string) => {
    ensureSpace(18);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.setFontSize(10);
    const maxWidth = pageWidth - margin * 2;
    const lines = doc.splitTextToSize(text || "-", maxWidth);
    lines.forEach((line: string) => {
      ensureSpace(14);
      doc.text(line, margin, y);
      y += 14;
    });
  };

  // Header and metadata
  drawHeaderFooter();
  y = 72; // start below header

  section("Complaint Summary");
  kv("Complaint ID", complaint.complaintId || complaint.id);
  if (complaint.title) kv("Title", complaint.title);
  if (complaint.type) kv("Type", complaint.type.replace(/_/g, " "));
  if (complaint.priority) kv("Priority", complaint.priority);
  if (complaint.status) kv("Status", complaint.status.replace(/_/g, " "));
  if (complaint.submittedOn) kv("Submitted", new Date(complaint.submittedOn).toLocaleString());

  // Role-based: Assigned staff
  const showAssignments = ["ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"].includes(role);
  if (showAssignments) {
    section("Assignments");
    if (complaint.wardOfficer?.fullName) kv("Ward Officer", complaint.wardOfficer.fullName);
    if (complaint.maintenanceTeam?.fullName) kv("Maintenance Team", complaint.maintenanceTeam.fullName);
    if (complaint.assignedTo?.fullName) kv("Assigned To", complaint.assignedTo.fullName);
    if (complaint.assignedOn) kv("Assigned On", new Date(complaint.assignedOn).toLocaleString());
  }

  // Description (all roles)
  if (complaint.description) {
    section("Description");
    paragraph(complaint.description);
  }

  // Status history / progress logs
  const showStatus = role !== "CITIZEN" || (complaint.statusLogs && complaint.statusLogs.length);
  if (showStatus) {
    section(role === "CITIZEN" ? "Status History" : "Status & Progress Logs");
    if (complaint.statusLogs && complaint.statusLogs.length > 0) {
      complaint.statusLogs.forEach((log: any, idx: number) => {
        const label = `${idx + 1}. ${log.fromStatus ? `${log.fromStatus} → ` : ""}${log.toStatus}`;
        kv(label, new Date(log.timestamp).toLocaleString());
        if (log.comment && role !== "CITIZEN") paragraph(`Remarks: ${log.comment}`);
      });
    } else {
      paragraph("No status updates available.");
    }
  }

  // Internal notes (admin only)
  if (role === "ADMINISTRATOR" && complaint.remarks) {
    section("Internal Notes");
    paragraph(complaint.remarks);
  }

  // Attachments
  const allImages: { name: string; dataUrl: string }[] = [];
  const allDocs: { name: string; type: string; url: string }[] = [];

  const pushAttachment = async (name: string, url: string, type?: string | null) => {
    if (isImage(type || undefined, url)) {
      const dataUrl = await fetchImageDataURL(url);
      if (dataUrl) allImages.push({ name, dataUrl });
    } else {
      allDocs.push({ name, type: type || "", url });
    }
  };

  if (complaint.attachments && complaint.attachments.length) {
    for (const a of complaint.attachments) {
      await pushAttachment(a.originalName || a.fileName, a.url, a.mimeType);
    }
  }
  if (complaint.photos && complaint.photos.length) {
    for (const p of complaint.photos) {
      await pushAttachment(p.originalName || p.fileName, p.photoUrl, "image/*");
    }
  }

  section("Attachments");
  if (allImages.length === 0 && allDocs.length === 0) {
    paragraph("No attachments available.");
  } else {
    // Image thumbnails
    for (const img of allImages) {
      ensureSpace(140);
      const maxW = pageWidth - margin * 2;
      const thumbW = Math.min(240, maxW);
      // Add image
      try {
        doc.addImage(img.dataUrl, "JPEG", margin, y, thumbW, thumbW * 0.62, undefined, "FAST");
        y += thumbW * 0.62 + 6;
        doc.setFontSize(9);
        doc.setTextColor(90);
        paragraph(img.name);
      } catch {
        paragraph(img.name);
      }
    }

    // Document links
    if (allDocs.length) {
      ensureSpace(18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.text("Documents", margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70);
      for (const d of allDocs) {
        ensureSpace(14);
        const label = `${d.name} (${d.type || "file"})`;
        // Fallback if textWithLink not supported in this build
        try {
          // @ts-ignore
          if (doc.textWithLink) {
            // @ts-ignore
            doc.textWithLink(label, margin, y, { url: d.url });
          } else {
            doc.text(label, margin, y);
          }
        } catch {
          doc.text(label, margin, y);
        }
        y += 14;
      }
    }
  }

  // Citizen view specific resolution summary
  if (role === "CITIZEN" && complaint.status) {
    section("Resolution Summary");
    paragraph(
      complaint.status === "CLOSED" || complaint.status === "RESOLVED"
        ? "Your complaint has been addressed. Thank you for your patience."
        : "Your complaint is being processed. You will be notified on updates."
    );
  }

  // Finalize with headers/footers on all pages (already drawn) and save
  const fileName = `complaint-${complaint.complaintId || complaint.id}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
