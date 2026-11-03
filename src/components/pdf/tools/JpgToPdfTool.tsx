"use client";

import { useState } from "react";
import { FileDropZone, FileChip } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface JpgToPdfToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

type PageSize = "a4" | "letter" | "fit";

export function JpgToPdfTool({ tool, onBack }: JpgToPdfToolProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFiles = async (newFiles: File[]) => {
    const images = newFiles.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setFiles((prev) => [...prev, ...images]);
    setResultUrl(null);
    // Generate thumbnails
    const newThumbs: string[] = [];
    for (const f of images) {
      newThumbs.push(await readFileAsDataURL(f));
    }
    setThumbnails((prev) => [...prev, ...newThumbs]);
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setThumbnails((prev) => prev.filter((_, i) => i !== idx));
    setResultUrl(null);
  };

  const moveFile = (idx: number, direction: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev];
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
    setThumbnails((prev) => {
      const next = [...prev];
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
    setResultUrl(null);
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setResultUrl(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      // A4 = 595 x 842 pts, Letter = 612 x 792 pts
      const pageW = pageSize === "a4" ? 595 : pageSize === "letter" ? 612 : 0;
      const pageH = pageSize === "a4" ? 842 : pageSize === "letter" ? 792 : 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = thumbnails[i];
        const base64 = dataUrl.split(",")[1];
        const isPng = dataUrl.startsWith("data:image/png");
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        let embedded;
        try {
          embedded = isPng
            ? await pdf.embedPng(bytes)
            : await pdf.embedJpg(bytes);
        } catch {
          // Try the other format if first fails
          try {
            embedded = isPng
              ? await pdf.embedJpg(bytes)
              : await pdf.embedPng(bytes);
          } catch (e2) {
            console.error("Failed to embed image", file.name, e2);
            continue;
          }
        }
        const imgW = embedded.width;
        const imgH = embedded.height;
        let w: number, h: number, x: number, y: number;
        if (pageSize === "fit") {
          w = imgW;
          h = imgH;
          x = 0;
          y = 0;
        } else {
          const targetW = orientation === "portrait" ? pageW : pageH;
          const targetH = orientation === "portrait" ? pageH : pageW;
          // Fit image within page margins (50pt)
          const margin = 50;
          const availW = targetW - margin * 2;
          const availH = targetH - margin * 2;
          const scale = Math.min(availW / imgW, availH / imgH, 1);
          w = imgW * scale;
          h = imgH * scale;
          x = (targetW - w) / 2;
          y = (targetH - h) / 2;
          const page = pdf.addPage([targetW, targetH]);
          page.drawImage(embedded, { x, y, width: w, height: h });
          continue;
        }
        const page = pdf.addPage([w, h]);
        page.drawImage(embedded, { x: 0, y: 0, width: w, height: h });
      }
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      toast.success(`Created PDF with ${files.length} image${files.length !== 1 ? "s" : ""}!`);
    } catch (e) {
      console.error(e);
      toast.error("Conversion failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ToolLayout tool={tool} onBack={onBack}>
      {files.length === 0 ? (
        <FileDropZone
          accept="image/jpeg,image/png,image/jpg"
          multiple
          onFiles={handleFiles}
          label="Drop images here"
          sublabel="JPG, PNG — convert to a single PDF"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {files.length} image{files.length !== 1 ? "s" : ""}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiles([]);
                setThumbnails([]);
                setResultUrl(null);
              }}
            >
              Clear all
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence>
              {files.map((f, idx) => (
                <motion.div
                  key={`${f.name}-${idx}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="rounded-xl border bg-card overflow-hidden"
                >
                  <div className="aspect-square bg-muted/40 flex items-center justify-center overflow-hidden">
                    <img
                      src={thumbnails[idx]}
                      alt={f.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="p-1.5 flex items-center justify-between gap-0.5">
                    <button
                      onClick={() => moveFile(idx, -1)}
                      disabled={idx === 0}
                      className="h-7 w-7 rounded-md hover:bg-accent flex items-center justify-center disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs text-muted-foreground flex-1 text-center">
                      #{idx + 1}
                    </span>
                    <button
                      onClick={() => removeFile(idx)}
                      className="h-7 w-7 rounded-md hover:bg-destructive/10 text-destructive flex items-center justify-center"
                    >
                      ×
                    </button>
                    <button
                      onClick={() => moveFile(idx, 1)}
                      disabled={idx === files.length - 1}
                      className="h-7 w-7 rounded-md hover:bg-accent flex items-center justify-center disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
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
              input.accept = "image/jpeg,image/png,image/jpg";
              input.multiple = true;
              input.onchange = () => {
                if (input.files) handleFiles(Array.from(input.files));
              };
              input.click();
            }}
            className="w-full border-dashed"
          >
            + Add more images
          </Button>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Page size</Label>
              <Select value={pageSize} onValueChange={(v) => setPageSize(v as PageSize)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                  <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                  <SelectItem value="fit">Fit to image size</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pageSize !== "fit" && (
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Orientation</Label>
                <Select
                  value={orientation}
                  onValueChange={(v) => setOrientation(v as "portrait" | "landscape")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button
            onClick={handleConvert}
            disabled={processing || files.length === 0}
            className="w-full h-12 bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:opacity-90 border-0 gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Converting to PDF…
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Convert to PDF
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
                PDF created!
              </p>
              <a
                href={resultUrl}
                download="images.pdf"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </a>
            </motion.div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
