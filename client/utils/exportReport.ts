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
    return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"].some((ext) =>
      lower.endsWith(ext),
    );
  }
  return false;
}

export type ExportOptions = {
  orientation?: "p" | "l";
  title?: string;
  appName?: string;
  appLogoUrl?: string;
};

function formatDate(dt?: string | number | Date) {
  if (!dt) return "-";
  const d = new Date(dt);
  const day = String(d.getDate()).padStart(2, "0");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mon = months[d.getMonth()];
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day} ${mon} ${d.getFullYear()}, ${hours}:${minutes} ${ampm}`;
}

export async function exportComplaintReport(
  complaint: any,
  role: string,
  options: ExportOptions = {},
) {
  const jsPDF = _jsPDF as unknown as typeof _jsPDF;
  const orientation = options.orientation || "p";
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const gray: [number, number, number] = [245, 247, 250];
  const primary: [number, number, number] = [28, 100, 242];
  const muted: [number, number, number] = [100, 116, 139];

  const ensureSpace = (needed = 24) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderFooter();
    }
  };

  const headerTitle = options.title || "Complaint Report";
  const appName = options.appName || "NLC-CMS";
  const logoDataUrl = options.appLogoUrl
    ? await fetchImageDataURL(options.appLogoUrl)
    : null;

  const drawHeaderFooter = () => {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      // Header bar
      doc.setFillColor(...(gray as any));
      doc.rect(0, 0, pageWidth, 64, "F");

      // Logo (left)
      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, "PNG", margin, 14, 96, 32);
        } catch {}
      }

      // Title (center)
      doc.setTextColor(primary[0], primary[1], primary[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      const titleX = pageWidth / 2 - doc.getTextWidth(headerTitle) / 2;
      doc.text(headerTitle, titleX, 34);

      // Complaint ID (right)
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
      doc.text(
        pageTxt,
        pageWidth - margin - doc.getTextWidth(pageTxt),
        footerY,
      );
      const genTxt = `Generated ${formatDate(new Date())} • ${appName}`;
      doc.text(genTxt, margin, footerY);
    }
    doc.setPage(total);
  };

  const section = (title: string) => {
    ensureSpace(36);
    doc.setFillColor(...(gray as any));
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
  if (complaint.submittedOn) kv("Submitted", formatDate(complaint.submittedOn));

  // Role-based: Assigned staff
  const showAssignments = [
    "ADMINISTRATOR",
    "WARD_OFFICER",
    "MAINTENANCE_TEAM",
  ].includes(role);
  if (showAssignments) {
    section("Assignments");
    if (complaint.wardOfficer?.fullName)
      kv("Ward Officer", complaint.wardOfficer.fullName);
    if (complaint.maintenanceTeam?.fullName)
      kv("Maintenance Team", complaint.maintenanceTeam.fullName);
    if (complaint.assignedTo?.fullName)
      kv("Assigned To", complaint.assignedTo.fullName);
    if (complaint.assignedOn)
      kv("Assigned On", formatDate(complaint.assignedOn));
  }

  // Description (all roles)
  if (complaint.description) {
    section("Description");
    paragraph(complaint.description);
  }

  // Status history / progress logs
  const showStatus =
    role !== "CITIZEN" || (complaint.statusLogs && complaint.statusLogs.length);
  if (showStatus) {
    section(role === "CITIZEN" ? "Status History" : "Status & Progress Logs");
    if (complaint.statusLogs && complaint.statusLogs.length > 0) {
      complaint.statusLogs.forEach((log: any, idx: number) => {
        ensureSpace(28);
        // Timeline bullet
        doc.setFillColor(primary[0], primary[1], primary[2]);
        doc.circle(margin + 4, y - 6, 3, "F");
        // Status label
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30);
        const statusText = `${idx + 1}. ${log.fromStatus ? `${log.fromStatus} → ` : ""}${log.toStatus}`;
        doc.text(statusText, margin + 14, y);
        y += 14;
        // Timestamp & remarks
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.setFontSize(10);
        doc.text(formatDate(log.timestamp), margin + 14, y);
        y += 14;
        if (log.comment && role !== "CITIZEN") {
          paragraph(`Remarks: ${log.comment}`);
        }
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
  const compImages: { name: string; dataUrl: string }[] = [];
  const compDocs: { name: string; type: string; url: string }[] = [];
  const teamImages: { name: string; dataUrl: string }[] = [];
  const teamDocs: { name: string; type: string; url: string }[] = [];

  const pushAttachment = async (
    bucket: "comp" | "team",
    name: string,
    url: string,
    type?: string | null,
  ) => {
    if (isImage(type || undefined, url)) {
      const dataUrl = await fetchImageDataURL(url);
      if (dataUrl)
        (bucket === "comp" ? compImages : teamImages).push({ name, dataUrl });
    } else {
      (bucket === "comp" ? compDocs : teamDocs).push({
        name,
        type: type || "",
        url,
      });
    }
  };

  if (complaint.attachments && complaint.attachments.length) {
    for (const a of complaint.attachments) {
      await pushAttachment(
        "comp",
        a.originalName || a.fileName,
        a.url,
        a.mimeType,
      );
    }
  }
  if (complaint.photos && complaint.photos.length) {
    for (const p of complaint.photos) {
      await pushAttachment(
        "team",
        p.originalName || p.fileName,
        p.photoUrl,
        "image/*",
      );
    }
  }

  section("Attachments");
  const renderAttachmentGroup = (
    title: string,
    images: typeof compImages,
    docs: typeof compDocs,
  ) => {
    ensureSpace(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text(title, margin, y);
    y += 12;

    if (images.length === 0 && docs.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70);
      paragraph("None");
      return;
    }

    // Image thumbnails
    for (const img of images) {
      ensureSpace(140);
      const maxW = pageWidth - margin * 2;
      const thumbW = Math.min(240, maxW);
      try {
        doc.addImage(
          img.dataUrl,
          "JPEG",
          margin,
          y,
          thumbW,
          thumbW * 0.62,
          undefined,
          "FAST",
        );
        y += thumbW * 0.62 + 6;
        doc.setFontSize(9);
        doc.setTextColor(90);
        paragraph(img.name);
      } catch {
        paragraph(img.name);
      }
    }

    // Document links
    if (docs.length) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(70);
      for (const d of docs) {
        ensureSpace(14);
        const icon = d.type?.includes("pdf") ? "📄" : "📄";
        const label = `${icon} ${d.name} (${d.type || "file"})`;
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
  };

  renderAttachmentGroup("Complaint Attachments", compImages, compDocs);
  renderAttachmentGroup("Maintenance Team Attachments", teamImages, teamDocs);

  // Citizen view specific resolution summary
  if (role === "CITIZEN" && complaint.status) {
    section("Resolution Summary");
    paragraph(
      complaint.status === "CLOSED" || complaint.status === "RESOLVED"
        ? "Your complaint has been addressed. Thank you for your patience."
        : "Your complaint is being processed. You will be notified on updates.",
    );
  }

  // Role-based filtering (hide internal notes or assignments for limited roles)
  if (role === "MAINTENANCE_TEAM") {
    // Already shows assignments/logs/attachments; avoid extra personal info
  } else if (role === "WARD_OFFICER") {
    // Current sections are appropriate
  } else if (role === "ADMINISTRATOR") {
    // Full details already included
  }

  // Finalize with headers/footers on all pages (already drawn) and save
  const fileName = `complaint-${complaint.complaintId || complaint.id}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
