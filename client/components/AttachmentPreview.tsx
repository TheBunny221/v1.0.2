import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Download, ZoomIn, ZoomOut, RotateCcw, FileText, ExternalLink, Printer, X } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
// Vite will bundle the worker and give us an internal URL
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { renderAsync as renderDocx } from "docx-preview";

type PreviewItem = {
  url: string;
  mimeType?: string | null;
  name?: string | null;
  size?: number | null;
};

interface AttachmentPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PreviewItem | null;
  canDownload?: boolean;
}

function isImage(mime?: string | null, url?: string) {
  if (mime && mime.startsWith("image/")) return true;
  if (!mime && url) {
    const lower = url.toLowerCase();
    return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].some((ext) => lower.endsWith(ext));
  }
  return false;
}

function isPdf(mime?: string | null, url?: string) {
  if (mime === "application/pdf") return true;
  if (!mime && url) return url.toLowerCase().endsWith(".pdf");
  return false;
}

function isDocx(mime?: string | null, url?: string) {
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return true;
  if (!mime && url) return url.toLowerCase().endsWith(".docx");
  return false;
}

function isDoc(mime?: string | null, url?: string) {
  if (mime === "application/msword") return true;
  if (!mime && url) return url.toLowerCase().endsWith(".doc");
  return false;
}

export default function AttachmentPreview({ open, onOpenChange, item, canDownload = true }: AttachmentPreviewProps) {
  const name = item?.name || (item?.url ? item.url.split("/").pop() || "Attachment" : "Attachment");
  const [scale, setScale] = useState(1);

  const contentType = useMemo(() => {
    if (!item) return "none" as const;
    if (isImage(item.mimeType, item.url)) return "image" as const;
    if (isPdf(item.mimeType, item.url)) return "pdf" as const;
    if (isDocx(item.mimeType, item.url)) return "docx" as const;
    if (isDoc(item.mimeType, item.url)) return "doc" as const;
    return "other" as const;
  }, [item]);

  const resetZoom = () => setScale(1);
  const zoomIn = () => setScale((s) => Math.min(4, s + 0.25));
  const zoomOut = () => setScale((s) => Math.max(0.25, s - 0.25));


  const printAttachment = () => {
    if (!item?.url) return;
    if (contentType === "image") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      const html = `<!doctype html><html><head><title>${name}</title><style>html,body{margin:0;padding:0}img{max-width:100%;width:100%}</style></head><body><img src="${item.url}" onload="window.focus();window.print();"/></body></html>`;
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      const w = window.open(item.url, "_blank");
      if (w) w.focus();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) setScale(1);
      onOpenChange(o);
    }}>
      <DialogContent hideClose className="max-w-[92vw] w-[92vw] h-[86vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b bg-background/60">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <DialogTitle className="truncate">{name}</DialogTitle>
              {item?.mimeType && (
                <DialogDescription className="truncate">{item.mimeType}</DialogDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {contentType === "image" && (
                <div className="flex items-center gap-1 mr-2">
                  <Button size="sm" variant="outline" onClick={zoomOut} aria-label="Zoom out">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
                  <Button size="sm" variant="outline" onClick={zoomIn} aria-label="Zoom in">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetZoom} aria-label="Reset zoom">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {item?.url && (
                <Button size="sm" variant="outline" onClick={printAttachment} aria-label="Print">
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
              )}
              {canDownload && item?.url && (
                <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex">
                  <Button size="sm" variant="default" aria-label="Download">
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </a>
              )}
              <DialogClose asChild>
                <Button size="sm" variant="destructive" className="font-bold">
                  <X className="h-4 w-4 mr-1" /> Close
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        <div className="w-full h-[calc(86vh-72px)] bg-muted/20 flex items-center justify-center overflow-hidden">
          {contentType === "image" && item?.url && (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              <img
                src={item.url}
                alt={name || "attachment"}
                style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
                className="max-w-none select-none rounded shadow"
                draggable={false}
              />
            </div>
          )}

          {contentType === "pdf" && item?.url && (
            <PdfViewer url={item.url} />
          )}

          {contentType === "docx" && item?.url && (
            <DocxViewer url={item.url} />
          )}

          {contentType === "doc" && (
            <div className="text-center p-8">
              <FileText className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-3">DOC preview is not supported. Please download to view.</p>
              {item?.url && (
                <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" /> Open / Download
                  </Button>
                </a>
              )}
            </div>
          )}

          {contentType === "other" && (
            <div className="text-center p-8">
              <FileText className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-2">No inline preview available.</p>
              {item?.url && (
                <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" /> Open / Download
                  </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
