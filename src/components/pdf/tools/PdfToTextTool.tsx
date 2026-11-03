"use client";

import { useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Type, Copy, FileText } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface PdfToTextToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

export function PdfToTextTool({ tool, onBack }: PdfToTextToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setText("");
    extractText(f);
  };

  const extractText = async (file: File) => {
    setLoading(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const buf = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf) });
      const pdf = await loadingTask.promise;
      const allText: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Group items by line based on y position
        const lines: { y: number; items: { x: number; str: string }[] }[] = [];
        for (const raw of textContent.items) {
          if (!("str" in raw)) continue;
          const str = (raw as any).str as string;
          if (!str) continue;
          const tr = (raw as any).transform as number[];
          if (!tr || tr.length < 6) continue;
          const x = tr[4];
          const y = tr[5];
          // Find existing line within tolerance
          let line = lines.find((l) => Math.abs(l.y - y) < 3);
          if (!line) {
            line = { y, items: [] };
            lines.push(line);
          }
          line.items.push({ x, str });
        }
        // Sort lines by y descending (top to bottom in PDF coords means high to low)
        lines.sort((a, b) => b.y - a.y);
        const pageText = lines
          .map((line) => {
            line.items.sort((a, b) => a.x - b.x);
            return line.items.map((i) => i.str).join("");
          })
          .join("\n");
        allText.push(`--- Page ${i} ---\n${pageText}`);
        page.cleanup();
      }
      setText(allText.join("\n\n"));
      if (allText.join("").trim().length === 0) {
        toast.info("No text found", {
          description:
            "This PDF may be scanned (image-only). OCR support is coming soon.",
        });
      } else {
        toast.success(`Extracted text from ${pdf.numPages} pages!`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Text extraction failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const downloadTxt = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name.replace(/\.pdf$/i, "") || "extracted"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolLayout tool={tool} onBack={onBack}>
      {!file ? (
        <FileDropZone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop your PDF here"
          sublabel="to extract text"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {text.length > 0 ? `${text.length} characters extracted` : loading ? "Extracting…" : "Ready"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                setText("");
              }}
            >
              Change
            </Button>
          </div>

          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Extracting text…</p>
            </div>
          )}

          {text && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} variant="outline" size="sm" className="gap-1.5">
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
                <Button onClick={downloadTxt} size="sm" className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Download .txt
                </Button>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-96 p-4 rounded-xl border bg-card text-sm font-mono resize-y"
                placeholder="Extracted text will appear here…"
              />
            </motion.div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
