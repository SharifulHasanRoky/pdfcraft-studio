"use client";

import { useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, Hash, FileText } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface PageNumbersToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

type Position =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "top-left"
  | "top-right";

type Format = "plain" | "page-x" | "x-of-y" | "x-y";

export function PageNumbersTool({ tool, onBack }: PageNumbersToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>("bottom-center");
  const [format, setFormat] = useState<Format>("x-of-y");
  const [startAt, setStartAt] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResultUrl(null);
    }
  };

  const handleApply = async () => {
    if (!file) return;
    setProcessing(true);
    setResultUrl(null);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const buf = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buf);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      const total = pages.length;
      pages.forEach((page, i) => {
        const pageNum = startAt + i;
        const w = page.getWidth();
        const h = page.getHeight();
        let label = "";
        switch (format) {
          case "plain":
            label = `${pageNum}`;
            break;
          case "page-x":
            label = `Page ${pageNum}`;
            break;
          case "x-of-y":
            label = `${pageNum} of ${total + startAt - 1}`;
            break;
          case "x-y":
            label = `${pageNum} / ${total + startAt - 1}`;
            break;
        }
        const textWidth = font.widthOfTextAtSize(label, fontSize);
        const margin = 30;
        let x: number;
        let y: number;
        switch (position) {
          case "bottom-left":
            x = margin;
            y = margin;
            break;
          case "bottom-center":
            x = (w - textWidth) / 2;
            y = margin;
            break;
          case "bottom-right":
            x = w - textWidth - margin;
            y = margin;
            break;
          case "top-left":
            x = margin;
            y = h - margin - fontSize;
            break;
          case "top-center":
            x = (w - textWidth) / 2;
            y = h - margin - fontSize;
            break;
          case "top-right":
            x = w - textWidth - margin;
            y = h - margin - fontSize;
            break;
        }
        page.drawText(label, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      toast.success(`Added page numbers to ${total} pages!`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to add page numbers", {
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
          sublabel="to add page numbers"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
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

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Position</Label>
              <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-center">Bottom center</SelectItem>
                  <SelectItem value="bottom-left">Bottom left</SelectItem>
                  <SelectItem value="bottom-right">Bottom right</SelectItem>
                  <SelectItem value="top-center">Top center</SelectItem>
                  <SelectItem value="top-left">Top left</SelectItem>
                  <SelectItem value="top-right">Top right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">1, 2, 3…</SelectItem>
                  <SelectItem value="page-x">Page 1, Page 2…</SelectItem>
                  <SelectItem value="x-of-y">1 of N</SelectItem>
                  <SelectItem value="x-y">1 / N</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start" className="text-sm font-medium mb-1.5 block">
                Start at
              </Label>
              <input
                id="start"
                type="number"
                value={startAt}
                onChange={(e) => setStartAt(parseInt(e.target.value) || 1)}
                min={1}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="fontsize" className="text-sm font-medium mb-1.5 block">
                Font size
              </Label>
              <input
                id="fontsize"
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                min={6}
                max={36}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              />
            </div>
          </div>

          <Button
            onClick={handleApply}
            disabled={processing}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 border-0 gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding page numbers…
              </>
            ) : (
              <>
                <Hash className="h-4 w-4" />
                Add Page Numbers
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
                Page numbers added!
              </p>
              <a
                href={resultUrl}
                download={`${file.name.replace(/\.pdf$/i, "")}-numbered.pdf`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download numbered PDF
              </a>
            </motion.div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
