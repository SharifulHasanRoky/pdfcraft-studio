"use client";

import { useState } from "react";
import { FileDropZone, FileChip } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowUp, ArrowDown, Layers } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface MergePdfToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

export function MergePdfTool({ tool, onBack }: MergePdfToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);

  const handleFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles.filter((f) => f.type === "application/pdf")]);
    setResultUrl(null);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveFile = (idx: number, direction: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev];
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error("Please add at least 2 PDFs to merge");
      return;
    }
    setProcessing(true);
    setResultUrl(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const merged = await PDFDocument.create();
      for (const file of files) {
        const buf = await file.arrayBuffer();
        const src = await PDFDocument.load(buf);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultSize(blob.size);
      toast.success("PDFs merged successfully!", {
        description: `Combined ${files.length} files into one PDF.`,
      });
    } catch (e) {
      console.error(e);
      toast.error("Merge failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <ToolLayout tool={tool} onBack={onBack}>
      {files.length === 0 ? (
        <FileDropZone
          accept="application/pdf"
          multiple
          onFiles={handleFiles}
          label="Drop PDF files to merge"
          sublabel="or click to browse (you can add more later)"
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""} •{" "}
              {formatSize(totalSize)}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiles([]);
                setResultUrl(null);
              }}
            >
              Clear all
            </Button>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {files.map((f, idx) => (
                <motion.div
                  key={`${f.name}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  layout
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <FileChip file={f} index={idx} onRemove={() => removeFile(idx)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveFile(idx, -1)}
                        disabled={idx === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => moveFile(idx, 1)}
                        disabled={idx === files.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "application/pdf";
              input.multiple = true;
              input.onchange = () => {
                if (input.files) handleFiles(Array.from(input.files));
              };
              input.click();
            }}
            className="w-full border-dashed"
          >
            + Add more PDFs
          </Button>

          <Button
            onClick={handleMerge}
            disabled={processing || files.length < 2}
            className="w-full h-12 bg-gradient-to-r from-rose-500 via-violet-600 to-amber-500 text-white hover:opacity-90 border-0 gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Merging {files.length} PDFs…
              </>
            ) : (
              <>
                <Layers className="h-4 w-4" />
                Merge {files.length} PDFs
              </>
            )}
          </Button>

          {resultUrl && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5 text-center"
            >
              <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                Merged successfully!
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Combined {files.length} PDFs • {formatSize(resultSize)}
              </p>
              <a
                href={resultUrl}
                download="merged.pdf"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download merged PDF
              </a>
            </motion.div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
