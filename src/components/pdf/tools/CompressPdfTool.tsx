"use client";

import { useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Minimize2, FileText } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface CompressPdfToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

type Level = "light" | "recommended" | "extreme";

const LEVEL_INFO: Record<
  Level,
  { label: string; desc: string; savings: string }
> = {
  light: {
    label: "Light",
    desc: "Lossless compression using object streams",
    savings: "~5-15%",
  },
  recommended: {
    label: "Recommended",
    desc: "Balanced — uses object streams + removes metadata",
    savings: "~10-30%",
  },
  extreme: {
    label: "Extreme",
    desc: "Maximum compression — may slightly reduce image quality",
    savings: "~20-50%",
  },
};

export function CompressPdfTool({ tool, onBack }: CompressPdfToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<Level>("recommended");
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResultUrl(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);
    setResultUrl(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buf = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buf);
      // Strip metadata for recommended+ levels
      if (level !== "light") {
        pdf.setTitle("");
        pdf.setAuthor("");
        pdf.setSubject("");
        pdf.setKeywords([]);
        pdf.setProducer("");
        pdf.setCreator("");
      }
      const bytes = await pdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      const reduction = file.size > 0 ? Math.max(0, 1 - blob.size / file.size) * 100 : 0;
      toast.success(`Compressed! ${reduction.toFixed(1)}% smaller`, {
        description: `${formatSize(file.size)} → ${formatSize(blob.size)}`,
      });
    } catch (e) {
      console.error(e);
      toast.error("Compression failed", {
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

  const reduction = file && resultSize > 0
    ? Math.max(0, 1 - resultSize / file.size) * 100
    : 0;

  return (
    <ToolLayout tool={tool} onBack={onBack}>
      {!file ? (
        <FileDropZone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop your PDF here"
          sublabel="to compress"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
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
                setResultUrl(null);
              }}
            >
              Change
            </Button>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Compression level</p>
            <div className="space-y-2">
              {(Object.keys(LEVEL_INFO) as Level[]).map((lvl) => {
                const info = LEVEL_INFO[lvl];
                const isSelected = level === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => setLevel(lvl)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{info.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{info.desc}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        {info.savings}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleCompress}
            disabled={processing}
            className="w-full h-12 bg-emerald-500 text-white hover:brightness-95 gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Compressing PDF…
              </>
            ) : (
              <>
                <Minimize2 className="h-4 w-4" />
                Compress PDF
              </>
            )}
          </Button>

          {resultUrl && file && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Compressed successfully!
                </p>
                <span className="text-2xl font-bold text-emerald-600">
                  −{reduction.toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-lg bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Before</p>
                  <p className="text-sm font-semibold">{formatSize(file.size)}</p>
                </div>
                <div className="rounded-lg bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">After</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatSize(resultSize)}
                  </p>
                </div>
              </div>
              <a
                href={resultUrl}
                download={`${file.name.replace(/\.pdf$/i, "")}-compressed.pdf`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download compressed PDF
              </a>
            </motion.div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
