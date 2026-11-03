"use client";

import { useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ImagePlus, FileText } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface ExtractImagesToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

interface ExtractedImage {
  pageNumber: number;
  index: number;
  dataUrl: string;
  width: number;
  height: number;
}

export function ExtractImagesTool({ tool, onBack }: ExtractImagesToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setImages([]);
    extractImages(f);
  };

  const extractImages = async (file: File) => {
    setLoading(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      const buf = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf) });
      const pdf = await loadingTask.promise;
      const OPS = pdfjs.OPS;
      const allImages: ExtractedImage[] = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const opList = await page.getOperatorList();
        for (let i = 0; i < opList.fnArray.length; i++) {
          const fn = opList.fnArray[i];
          if (fn !== OPS.paintImageXObject && fn !== OPS.paintInlineImageXObject) continue;
          const args = opList.argsArray[i];
          if (!args || args.length < 1) continue;
          const isInline = fn === OPS.paintInlineImageXObject;
          const objId = isInline ? `inline-${p}-${i}` : String(args[0]);
          try {
            const imgObj = await new Promise<any>((resolve, reject) => {
              if (isInline) {
                resolve(args[0]);
              } else {
                const tryGet = (attempt: number) => {
                  if (attempt > 30) {
                    reject(new Error("timeout"));
                    return;
                  }
                  const obj = page.objs.get(objId);
                  if (obj) resolve(obj);
                  else setTimeout(() => tryGet(attempt + 1), 100);
                };
                tryGet(0);
              }
            });
            if (imgObj) {
              const w = imgObj.width || args[1] || 100;
              const h = imgObj.height || args[2] || 100;
              const canvas = document.createElement("canvas");
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                if (imgObj.bitmap) {
                  ctx.drawImage(imgObj.bitmap, 0, 0);
                } else if (imgObj.data && imgObj.width && imgObj.height) {
                  const tempCanvas = document.createElement("canvas");
                  tempCanvas.width = imgObj.width;
                  tempCanvas.height = imgObj.height;
                  const tempCtx = tempCanvas.getContext("2d");
                  if (tempCtx) {
                    const imgData = new ImageData(
                      new Uint8ClampedArray(imgObj.data),
                      imgObj.width,
                      imgObj.height
                    );
                    tempCtx.putImageData(imgData, 0, 0);
                    ctx.drawImage(tempCanvas, 0, 0);
                  }
                }
                const dataUrl = canvas.toDataURL("image/png");
                allImages.push({
                  pageNumber: p,
                  index: allImages.length,
                  dataUrl,
                  width: w,
                  height: h,
                });
                setImages([...allImages]);
              }
            }
          } catch {
            // skip this image
          }
        }
        page.cleanup();
      }
      if (allImages.length === 0) {
        toast.info("No embedded images found", {
          description:
            "This PDF may contain only vector graphics or text. Try PDF to JPG instead.",
        });
      } else {
        toast.success(`Found ${allImages.length} image${allImages.length !== 1 ? "s" : ""}!`);
      }
    } catch (e) {
      console.error(e);
      toast.error("Image extraction failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadAll = async () => {
    if (!file) return;
    const baseName = file.name.replace(/\.pdf$/i, "");
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const a = document.createElement("a");
      a.href = img.dataUrl;
      a.download = `${baseName}_image_${i + 1}_p${img.pageNumber}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise((r) => setTimeout(r, 150));
    }
    toast.success(`Downloaded ${images.length} images`);
  };

  return (
    <ToolLayout tool={tool} onBack={onBack}>
      {!file ? (
        <FileDropZone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop your PDF here"
          sublabel="to extract images"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {images.length > 0
                    ? `${images.length} image${images.length !== 1 ? "s" : ""} found`
                    : loading
                    ? "Scanning…"
                    : "Ready"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                setImages([]);
              }}
            >
              Change
            </Button>
          </div>

          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                Scanning pages for images… ({images.length} found)
              </p>
            </div>
          )}

          {images.length > 0 && !loading && (
            <>
              <Button
                onClick={downloadAll}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90 border-0 gap-2"
              >
                <Download className="h-4 w-4" />
                Download all {images.length} images
              </Button>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border bg-card overflow-hidden"
                  >
                    <a href={img.dataUrl} download={`image_${i + 1}_p${img.pageNumber}.png`}>
                      <div className="aspect-square bg-muted/40 flex items-center justify-center overflow-hidden">
                        <img
                          src={img.dataUrl}
                          alt={`Image ${i + 1} from page ${img.pageNumber}`}
                          className="max-h-full max-w-full object-contain cursor-pointer hover:opacity-90"
                        />
                      </div>
                    </a>
                    <div className="p-2 text-xs flex items-center justify-between">
                      <span className="text-muted-foreground">Page {img.pageNumber}</span>
                      <span className="font-medium">{img.width}×{img.height}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {!loading && images.length === 0 && (
            <div className="text-center py-12">
              <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No images found yet — try uploading a PDF with embedded images.
              </p>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
