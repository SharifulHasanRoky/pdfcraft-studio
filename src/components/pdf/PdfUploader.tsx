"use client";

import { useCallback, useRef, useState } from "react";
import { usePdfStore } from "@/lib/pdf-store";
import { loadPdfFromFile } from "@/lib/pdf-utils";
import { Upload, FileText, Sparkles, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";

interface PdfUploaderProps {
  onLoaded?: () => void;
}

export function PdfUploader({ onLoaded }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setDocument, setPages, setLoading, setLoadError } = usePdfStore();

  const handleFile = useCallback(
    async (file: File) => {
      if (!file || file.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }
      setError(null);
      setIsLoading(true);
      setLoading(true);
      setLoadError(null);
      try {
        const doc = await loadPdfFromFile(file);
        setDocument(doc);
        setPages(doc.pages);
        onLoaded?.();
      } catch (e) {
        console.error(e);
        const msg = e instanceof Error ? e.message : "Failed to load PDF";
        setError(msg);
        setLoadError(msg);
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    },
    [setDocument, setPages, setLoading, setLoadError, onLoaded]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Free • No Sign-up • Quality Preserved
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent">
          PDFCraft Studio
        </h1>
        <p className="mt-3 text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
          Edit any PDF your way — add text, shapes, signatures, images, drawings.
          Then export with original quality fully preserved.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`relative cursor-pointer rounded-3xl border-2 border-dashed transition-all p-12 md:p-16 text-center bg-card/50 hover:bg-card hover:border-primary/50 ${
          isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-border"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading PDF…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold">Drop your PDF here</p>
              <p className="text-sm text-muted-foreground mt-1">
                or <span className="text-primary font-medium">browse files</span> from your device
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Any size
              </span>
              <span>•</span>
              <span>100% private</span>
              <span>•</span>
              <span>Processed in browser</span>
            </div>
          </div>
        )}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          {error}
        </motion.div>
      )}

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { title: "Text & Shapes", icon: "T", desc: "Add anywhere" },
          { title: "Signatures", icon: "✎", desc: "Draw or upload" },
          { title: "3D View", icon: "3D", desc: "Immersive reading" },
          { title: "Quality Safe", icon: "★", desc: "Lossless export" },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border bg-card/50 p-3 text-center"
          >
            <div className="h-9 w-9 mx-auto rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold mb-1.5">
              {f.icon}
            </div>
            <p className="text-xs font-semibold">{f.title}</p>
            <p className="text-[10px] text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
