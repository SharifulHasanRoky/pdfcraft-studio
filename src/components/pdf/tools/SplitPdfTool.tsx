"use client";

import { useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Scissors, FileText } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface SplitPdfToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

type SplitMode = "ranges" | "individual";

export function SplitPdfTool({ tool, onBack }: SplitPdfToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SplitMode>("ranges");
  const [pageRanges, setPageRanges] = useState("");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{ name: string; url: string; size: number }[]>([]);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResults([]);
    }
  };

  const parseRanges = (input: string): number[][] => {
    const parts = input.split(",").map((p) => p.trim()).filter(Boolean);
    const ranges: number[][] = [];
    for (const part of parts) {
      const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        const start = parseInt(m[1]);
        const end = parseInt(m[2]);
        if (start > end) {
          ranges.push([end, start]);
        } else {
          ranges.push([start, end]);
        }
      } else if (/^\d+$/.test(part)) {
        ranges.push([parseInt(part), parseInt(part)]);
      } else {
        throw new Error(`Invalid range: "${part}"`);
      }
    }
    return ranges;
  };

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);
    setResults([]);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf);
      const total = src.getPageCount();
      const output: { name: string; url: string; size: number }[] = [];

      if (mode === "ranges") {
        if (!pageRanges.trim()) {
          toast.error("Please enter at least one page range");
          setProcessing(false);
          return;
        }
        const ranges = parseRanges(pageRanges);
        for (const r of ranges) {
          const [start, end] = r;
          if (start < 1 || end > total) {
            toast.error(`Range ${start}-${end} is out of bounds (PDF has ${total} pages)`);
            setProcessing(false);
            return;
          }
        }
        for (let i = 0; i < ranges.length; i++) {
          const [start, end] = ranges[i];
          const out = await PDFDocument.create();
          const pageIndices = [];
          for (let p = start - 1; p < end; p++) pageIndices.push(p);
          const pages = await out.copyPages(src, pageIndices);
          pages.forEach((p) => out.addPage(p));
          const bytes = await out.save();
          const blob = new Blob([bytes], { type: "application/pdf" });
          output.push({
            name: `${file.name.replace(/\.pdf$/i, "")}_pages_${start}-${end}.pdf`,
            url: URL.createObjectURL(blob),
            size: blob.size,
          });
        }
      } else {
        // Split into individual pages
        for (let i = 0; i < total; i++) {
          const out = await PDFDocument.create();
          const [page] = await out.copyPages(src, [i]);
          out.addPage(page);
          const bytes = await out.save();
          const blob = new Blob([bytes], { type: "application/pdf" });
          output.push({
            name: `${file.name.replace(/\.pdf$/i, "")}_page_${i + 1}.pdf`,
            url: URL.createObjectURL(blob),
            size: blob.size,
          });
        }
      }

      setResults(output);
      toast.success(
        `Split into ${output.length} file${output.length !== 1 ? "s" : ""}!`
      );
    } catch (e) {
      console.error(e);
      toast.error("Split failed", {
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

  return (
    <ToolLayout tool={tool} onBack={onBack}>
      {!file ? (
        <FileDropZone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop your PDF here"
          sublabel="to split or extract pages"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                setResults([]);
              }}
            >
              Change file
            </Button>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Split mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("ranges")}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  mode === "ranges"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-medium">Extract page ranges</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  e.g., 1-3, 5, 7-9
                </p>
              </button>
              <button
                onClick={() => setMode("individual")}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  mode === "individual"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-medium">Split into individual pages</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  One PDF per page
                </p>
              </button>
            </div>
          </div>

          {mode === "ranges" && (
            <div>
              <Label htmlFor="ranges" className="text-sm font-medium mb-1.5 block">
                Page ranges
              </Label>
              <Input
                id="ranges"
                value={pageRanges}
                onChange={(e) => setPageRanges(e.target.value)}
                placeholder="1-3, 5, 7-9"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Use commas to separate ranges. Hyphen means &quot;from-to&quot;.
              </p>
            </div>
          )}

          <Button
            onClick={handleSplit}
            disabled={processing || (mode === "ranges" && !pageRanges.trim())}
            className="w-full h-12 bg-orange-500 text-white hover:brightness-95 gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Splitting PDF…
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4" />
                Split PDF
              </>
            )}
          </Button>

          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Split into {results.length} files
              </p>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl border bg-card"
                  >
                    <FileText className="h-5 w-5 text-orange-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(r.size)}
                      </p>
                    </div>
                    <a
                      href={r.url}
                      download={r.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
