"use client";

import { useState, useEffect } from "react";
import { FileDropZone } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RotateCw, RotateCcw, FileText } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface RotatePdfToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

interface PagePreview {
  index: number;
  thumbnail: string;
  rotation: number; // 0, 90, 180, 270
}

export function RotatePdfTool({ tool, onBack }: RotatePdfToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [processing, setProcessing] = useState(false);
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setResultUrl(null);
    const buf = await f.arrayBuffer();
    setPdfData(buf);
    loadThumbnails(buf);
  };

  const loadThumbnails = async (buf: ArrayBuffer) => {
    setLoadingThumbs(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf.slice(0)) });
      const pdf = await loadingTask.promise;
      const newPages: PagePreview[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport } as any).promise;
          newPages.push({
            index: i,
            thumbnail: canvas.toDataURL("image/jpeg", 0.6),
            rotation: 0,
          });
        }
        page.cleanup();
      }
      setPages(newPages);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load thumbnails");
    } finally {
      setLoadingThumbs(false);
    }
  };

  const rotatePage = (idx: number, direction: 1 | -1) => {
    setPages((prev) =>
      prev.map((p, i) =>
        i === idx
          ? { ...p, rotation: (p.rotation + direction * 90 + 360) % 360 }
          : p
      )
    );
    setResultUrl(null);
  };

  const rotateAll = (direction: 1 | -1) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + direction * 90 + 360) % 360,
      }))
    );
    setResultUrl(null);
  };

  const handleApply = async () => {
    if (!pdfData) return;
    setProcessing(true);
    setResultUrl(null);
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const pdf = await PDFDocument.load(pdfData.slice(0));
      const pdfPages = pdf.getPages();
      for (let i = 0; i < pdfPages.length && i < pages.length; i++) {
        if (pages[i].rotation > 0) {
          const current = pdfPages[i].getRotation().angle;
          const newRotation = (current + pages[i].rotation) % 360;
          pdfPages[i].setRotation(degrees(newRotation));
        }
      }
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      toast.success(`Rotated PDF saved!`);
    } catch (e) {
      console.error(e);
      toast.error("Rotation failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolLayout tool={tool} onBack={onBack}>
      {!file ? (
        <FileDropZone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop your PDF here"
          sublabel="to rotate pages"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {pages.length} page{pages.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                setPdfData(null);
                setPages([]);
                setResultUrl(null);
              }}
            >
              Change
            </Button>
          </div>

          {loadingThumbs && (
            <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading page thumbnails…
            </div>
          )}

          {pages.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground">
                  Click rotation buttons under each page
                </p>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rotateAll(-1)}
                    className="gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    All left
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rotateAll(1)}
                    className="gap-1.5"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    All right
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {pages.map((p, idx) => (
                  <div
                    key={p.index}
                    className="rounded-xl border bg-card overflow-hidden"
                  >
                    <div className="aspect-[3/4] bg-muted/40 flex items-center justify-center overflow-hidden">
                      <img
                        src={p.thumbnail}
                        alt={`Page ${p.index}`}
                        className="max-h-full max-w-full object-contain"
                        style={{
                          transform: `rotate(${p.rotation}deg)`,
                          transition: "transform 0.2s",
                        }}
                      />
                    </div>
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Page {p.index}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => rotatePage(idx, -1)}
                          className="h-7 w-7 rounded-md hover:bg-accent text-amber-600 flex items-center justify-center"
                          title="Rotate left"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => rotatePage(idx, 1)}
                          className="h-7 w-7 rounded-md hover:bg-accent text-amber-600 flex items-center justify-center"
                          title="Rotate right"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleApply}
                disabled={processing}
                className="w-full h-12 bg-amber-500 text-white hover:brightness-95 gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Applying rotation…
                  </>
                ) : (
                  <>
                    <RotateCw className="h-4 w-4" />
                    Apply &amp; Download
                  </>
                )}
              </Button>

              {resultUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5 text-center"
                >
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
                    Rotated PDF ready!
                  </p>
                  <a
                    href={resultUrl}
                    download={`${file.name.replace(/\.pdf$/i, "")}-rotated.pdf`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:opacity-90"
                  >
                    <Download className="h-4 w-4" />
                    Download rotated PDF
                  </a>
                </motion.div>
              )}
            </>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
