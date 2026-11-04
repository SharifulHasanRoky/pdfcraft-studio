"use client";

import { useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Loader2, Download, Stamp, FileText } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface WatermarkPdfToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

export function WatermarkPdfTool({ tool, onBack }: WatermarkPdfToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(60);
  const [color, setColor] = useState("#FB7185");
  const [opacity, setOpacity] = useState(20); // 0-100
  const [rotation, setRotation] = useState(45);
  const [position, setPosition] = useState<"center" | "tile">("center");
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResultUrl(null);
    }
  };

  const hexToRgb = (hex: string) => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return { r, g, b };
  };

  const handleApply = async () => {
    if (!file) return;
    if (!text.trim()) {
      toast.error("Please enter watermark text");
      return;
    }
    setProcessing(true);
    setResultUrl(null);
    try {
      const { PDFDocument, StandardFonts, rgb, degrees } = await import("pdf-lib");
      const buf = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buf);
      const font = await pdf.embedFont(StandardFonts.HelveticaBold);
      const color = hexToRgb(colorHex);
      const pages = pdf.getPages();
      pages.forEach((page) => {
        const w = page.getWidth();
        const h = page.getHeight();
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        const textHeight = fontSize;
        if (position === "center") {
          // Center, rotated
          const cx = w / 2;
          const cy = h / 2;
          page.drawText(text, {
            x: cx - textWidth / 2,
            y: cy - textHeight / 2,
            size: fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
            opacity: opacity / 100,
            rotate: degrees(rotation),
          });
        } else {
          // Tile: draw multiple watermarks in a grid
          const spacingX = 250;
          const spacingY = 200;
          for (let y = -spacingY; y < h + spacingY; y += spacingY) {
            for (let x = -spacingX; x < w + spacingX; x += spacingX) {
              page.drawText(text, {
                x: x + (y % (spacingY * 2) === 0 ? 0 : spacingX / 2),
                y,
                size: fontSize,
                font,
                color: rgb(color.r, color.g, color.b),
                opacity: opacity / 100,
                rotate: degrees(rotation),
              });
            }
          }
        }
      });
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      toast.success(`Watermark added to ${pages.length} pages!`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to add watermark", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setProcessing(false);
    }
  };

  const colorHex = color;

  return (
    <ToolLayout tool={tool} onBack={onBack}>
      {!file ? (
        <FileDropZone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop your PDF here"
          sublabel="to add a watermark"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-cyan-500 flex items-center justify-center shrink-0">
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

          <div>
            <Label htmlFor="wm-text" className="text-sm font-medium mb-1.5 block">
              Watermark text
            </Label>
            <Input
              id="wm-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="CONFIDENTIAL"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Font size: <span className="text-primary font-semibold">{fontSize}px</span>
              </Label>
              <Slider
                value={[fontSize]}
                min={12}
                max={120}
                step={2}
                onValueChange={(v) => setFontSize(v[0])}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Opacity: <span className="text-primary font-semibold">{opacity}%</span>
              </Label>
              <Slider
                value={[opacity]}
                min={5}
                max={100}
                step={5}
                onValueChange={(v) => setOpacity(v[0])}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">
                Rotation: <span className="text-primary font-semibold">{rotation}°</span>
              </Label>
              <Slider
                value={[rotation]}
                min={0}
                max={90}
                step={5}
                onValueChange={(v) => setRotation(v[0])}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-1.5 block">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 rounded-md cursor-pointer border"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-1.5 block">Position</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPosition("center")}
                className={`p-3 rounded-xl border-2 text-left ${
                  position === "center"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-medium">Center</p>
                <p className="text-xs text-muted-foreground">Single centered watermark</p>
              </button>
              <button
                onClick={() => setPosition("tile")}
                className={`p-3 rounded-xl border-2 text-left ${
                  position === "tile"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-medium">Tile (repeating)</p>
                <p className="text-xs text-muted-foreground">Watermarks across the page</p>
              </button>
            </div>
          </div>

          <Button
            onClick={handleApply}
            disabled={processing || !text.trim()}
            className="w-full h-12 bg-cyan-500 text-white hover:brightness-95 gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding watermark…
              </>
            ) : (
              <>
                <Stamp className="h-4 w-4" />
                Add Watermark
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
                Watermark added!
              </p>
              <a
                href={resultUrl}
                download={`${file.name.replace(/\.pdf$/i, "")}-watermarked.pdf`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download watermarked PDF
              </a>
            </motion.div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
