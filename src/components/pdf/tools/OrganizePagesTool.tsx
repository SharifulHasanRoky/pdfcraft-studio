"use client";

import { useState, useEffect } from "react";
import { FileDropZone } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Download,
  Trash2,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface OrganizePagesToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

interface PageItem {
  id: string;
  pageNumber: number;
  thumbnail: string;
  rotation: number;
}

export function OrganizePagesTool({ tool, onBack }: OrganizePagesToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [processing, setProcessing] = useState(false);
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
      const newPages: PageItem[] = [];
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
            id: `page-${i}-${Math.random().toString(36).slice(2, 7)}`,
            pageNumber: i,
            thumbnail: canvas.toDataURL("image/jpeg", 0.6),
            rotation: 0,
          });
        }
        page.cleanup();
      }
      setPages(newPages);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load page thumbnails");
    } finally {
      setLoadingThumbs(false);
    }
  };

  const deletePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    setResultUrl(null);
  };

  const rotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p
      )
    );
    setResultUrl(null);
  };

  const movePage = (idx: number, direction: -1 | 1) => {
    setPages((prev) => {
      const next = [...prev];
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
    setResultUrl(null);
  };

  const handleApply = async () => {
    if (!pdfData || pages.length === 0) return;
    setProcessing(true);
    setResultUrl(null);
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const src = await PDFDocument.load(pdfData.slice(0));
      const out = await PDFDocument.create();
      // Copy pages in the new order
      const pageIndices = pages.map((p) => p.pageNumber - 1);
      const copied = await out.copyPages(src, pageIndices);
      // Apply rotation
      for (let i = 0; i < copied.length; i++) {
        if (pages[i].rotation > 0) {
          const current = copied[i].getRotation().angle;
          copied[i].setRotation(degrees((current + pages[i].rotation) % 360));
        }
        out.addPage(copied[i]);
      }
      const bytes = await out.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      toast.success("PDF organized!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to organize PDF", {
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
          sublabel="to organize pages"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {pages.length} page{pages.length !== 1 ? "s" : ""} in document
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-muted-foreground">
                  {pages.length} pages • drag-free reorder using arrows
                </p>
                <span className="text-xs px-2 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
                  Tip: Trash to delete • Arrows to reorder
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <AnimatePresence>
                  {pages.map((p, idx) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="rounded-xl border bg-card overflow-hidden"
                    >
                      <div className="aspect-[3/4] bg-muted/40 flex items-center justify-center overflow-hidden relative">
                        <img
                          src={p.thumbnail}
                          alt={`Page ${p.pageNumber}`}
                          className="max-h-full max-w-full object-contain"
                          style={{
                            transform: `rotate(${p.rotation}deg)`,
                            transition: "transform 0.2s",
                          }}
                        />
                        <span className="absolute top-1 left-1 h-5 min-w-5 px-1.5 rounded bg-black/70 text-white text-[10px] font-semibold flex items-center justify-center">
                          {idx + 1}
                        </span>
                      </div>
                      <div className="p-1.5 flex items-center justify-between gap-0.5">
                        <button
                          onClick={() => movePage(idx, -1)}
                          disabled={idx === 0}
                          className="h-7 w-7 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center disabled:opacity-30"
                          title="Move left"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => rotatePage(p.id)}
                          className="h-7 w-7 rounded-md hover:bg-accent text-amber-600 flex items-center justify-center"
                          title="Rotate 90°"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deletePage(p.id)}
                          className="h-7 w-7 rounded-md hover:bg-destructive/10 text-destructive flex items-center justify-center"
                          title="Delete page"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => movePage(idx, 1)}
                          disabled={idx === pages.length - 1}
                          className="h-7 w-7 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center disabled:opacity-30"
                          title="Move right"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Button
                onClick={handleApply}
                disabled={processing || pages.length === 0}
                className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 border-0 gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Organizing pages…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Apply &amp; Download ({pages.length} pages)
                  </>
                )}
              </Button>

              {resultUrl && file && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5 text-center"
                >
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
                    Organized PDF ready!
                  </p>
                  <a
                    href={resultUrl}
                    download={`${file.name.replace(/\.pdf$/i, "")}-organized.pdf`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium hover:opacity-90"
                  >
                    <Download className="h-4 w-4" />
                    Download organized PDF
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
