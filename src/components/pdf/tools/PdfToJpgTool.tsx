"use client";

import { useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Download, FileImage } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface PdfToJpgToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

interface PageImage {
  pageNumber: number;
  dataUrl: string;
  size: number;
}

export function PdfToJpgTool({ tool, onBack }: PdfToJpgToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [images, setImages] = useState<PageImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setImages([]);
    const buf = await f.arrayBuffer();
    setPdfData(buf);
    convertToImages(buf);
  };

  const convertToImages = async (buf: ArrayBuffer) => {
    setLoading(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf.slice(0)) });
      const pdf = await loadingTask.promise;
      const newImages: PageImage[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Fill white background first (PDFs may have transparent)
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport } as any).promise;
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          const size = Math.round((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75);
          newImages.push({ pageNumber: i, dataUrl, size });
        }
        page.cleanup();
        setImages([...newImages]);
      }
      toast.success(`Converted ${newImages.length} pages to JPG!`);
    } catch (e) {
      console.error(e);
      toast.error("Conversion failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadAll = async () => {
    if (!file) return;
    setDownloadingAll(true);
    // Sequential download — simpler than ZIP for browser-only
    const baseName = file.name.replace(/\.pdf$/i, "");
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const a = document.createElement("a");
      a.href = img.dataUrl;
      a.download = `${baseName}_page_${img.pageNumber}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Small delay to avoid browser blocking downloads
      await new Promise((r) => setTimeout(r, 200));
    }
    setDownloadingAll(false);
    toast.success(`Downloaded ${images.length} JPGs`);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <ToolLayout tool={tool} onBack={onBack}>
      {!file ? (
        <FileDropZone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop your PDF here"
          sublabel="to convert pages to JPG"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shrink-0">
                <FileImage className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {images.length > 0
                    ? `${images.length} pages converted`
                    : loading
                    ? "Converting…"
                    : "Ready to convert"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                setPdfData(null);
                setImages([]);
              }}
            >
              Change
            </Button>
          </div>

          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Converting pages to JPG… ({images.length} done)
              </p>
            </div>
          )}

          {images.length > 0 && (
            <>
              <Button
                onClick={downloadAll}
                disabled={downloadingAll}
                className="w-full h-12 bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white hover:opacity-90 border-0 gap-2"
              >
                {downloadingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Downloading {images.length} files…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download all {images.length} JPGs
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img) => (
                  <motion.div
                    key={img.pageNumber}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border bg-card overflow-hidden"
                  >
                    <div className="aspect-[3/4] bg-muted/40 flex items-center justify-center overflow-hidden">
                      <a href={img.dataUrl} download={`${file.name.replace(/\.pdf$/i, "")}_page_${img.pageNumber}.jpg`}>
                        <img
                          src={img.dataUrl}
                          alt={`Page ${img.pageNumber}`}
                          className="max-h-full max-w-full object-contain cursor-pointer hover:opacity-90"
                        />
                      </a>
                    </div>
                    <div className="p-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Page {img.pageNumber}</span>
                      <span className="font-medium">{formatSize(img.size)}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
