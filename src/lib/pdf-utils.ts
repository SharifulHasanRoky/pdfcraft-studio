// PDF utilities - load, render, and export PDFs
// All operations preserve original quality: original PDF bytes are never re-encoded,
// we only overlay new annotations on top using pdf-lib.

import type {
  Annotation,
  PdfDocument,
  PdfPageData,
  TextAnnotation,
  ShapeAnnotation,
  HighlightAnnotation,
  DrawingAnnotation,
  ImageAnnotation,
} from "./pdf-types";

// pdf.js is loaded lazily on the client only
let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  const mod = await import("pdfjs-dist");
  mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  pdfjsLib = mod;
  return mod;
}

// Cache PDFDocumentProxy per ArrayBuffer reference (one per loaded PDF).
// This avoids re-parsing the PDF on every render, which is expensive.
const docCache = new WeakMap<ArrayBuffer, import("pdfjs-dist").PDFDocumentProxy>();

async function getPdfDoc(data: ArrayBuffer) {
  const existing = docCache.get(data);
  if (existing) return existing;
  const pdfjs = await getPdfjs();
  // Copy buffer — pdf.js transfers ownership of typed arrays to the worker
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(data.slice(0)) });
  const pdfDoc = await loadingTask.promise;
  docCache.set(data, pdfDoc);
  return pdfDoc;
}

export async function loadPdfFromFile(file: File): Promise<PdfDocument> {
  const buf = await file.arrayBuffer();
  const pdfDoc = await getPdfDoc(buf);
  const pages: PdfPageData[] = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    pages.push({
      id: `page-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pageNumber: i,
      rotation: 0,
      width: viewport.width,
      height: viewport.height,
    });
    page.cleanup();
  }
  return {
    file,
    data: buf,
    numPages: pdfDoc.numPages,
    pages,
    fileName: file.name,
  };
}

// Render a single page to a canvas at given scale
export async function renderPageToCanvas(
  doc: PdfDocument,
  pageIndex: number,
  canvas: HTMLCanvasElement,
  scale: number,
  rotation: number = 0
): Promise<void> {
  const pdfDoc = await getPdfDoc(doc.data);
  const page = await pdfDoc.getPage(doc.pages[pageIndex].pageNumber);
  const viewport = page.getViewport({ scale, rotation });
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  await page.render({
    canvasContext: ctx,
    viewport,
  } as any).promise;
  page.cleanup();
}

// Render a thumbnail of a page
export async function renderPageThumbnail(
  doc: PdfDocument,
  pageIndex: number,
  maxWidth = 160
): Promise<string> {
  const pdfDoc = await getPdfDoc(doc.data);
  const page = await pdfDoc.getPage(doc.pages[pageIndex].pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / baseViewport.width;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  await page.render({ canvasContext: ctx, viewport } as any).promise;
  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
  page.cleanup();
  return dataUrl;
}

// ============================================================
// Export logic — uses pdf-lib to overlay annotations on the
// original PDF, preserving all original quality.
// ============================================================

export async function exportAnnotatedPdf(
  doc: PdfDocument,
  annotations: Annotation[]
): Promise<Blob> {
  const { PDFDocument, rgb, degrees, StandardFonts } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.load(doc.data.slice(0));
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaObliqueFont = await pdfDoc.embedFont(
    StandardFonts.HelveticaOblique
  );
  const helveticaBoldObliqueFont = await pdfDoc.embedFont(
    StandardFonts.HelveticaBoldOblique
  );
  const timesFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

  function hexToRgb(hex: string) {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return rgb(0, 0, 0);
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return rgb(r, g, b);
  }

  function getFont(ann: TextAnnotation) {
    const wantBold = ann.bold;
    const wantItalic = ann.italic;
    if (ann.fontFamily === "Times") return timesFont;
    if (ann.fontFamily === "Courier") return courierFont;
    if (wantBold && wantItalic) return helveticaBoldObliqueFont;
    if (wantBold) return helveticaBoldFont;
    if (wantItalic) return helveticaObliqueFont;
    return helveticaFont;
  }

  // Apply per-page rotation first by re-creating pages.
  // pdf-lib cannot rotate a page in place, but we can call setRotation.
  const pages = pdfDoc.getPages();
  for (let i = 0; i < doc.pages.length && i < pages.length; i++) {
    const p = pages[i];
    const stored = doc.pages[i];
    p.setRotation(degrees(stored.rotation));
    const w = p.getWidth();
    const h = p.getHeight();
    const pageAnnotations = annotations.filter((a) => a.page === i);

    for (const ann of pageAnnotations) {
      const ax = ann.x * w;
      const ay = ann.y * h;
      const aw = ann.width * w;
      const ah = ann.height * h;
      // pdf-lib origin is bottom-left; we use top-left origin in editor
      // so y becomes (h - ay - ah)
      const py = h - ay - ah;

      switch (ann.type) {
        case "text": {
          const t = ann as TextAnnotation;
          if (!t.text.trim()) break; // skip empty text annotations
          const font = getFont(t);
          const fontSize = t.fontSize * h;
          const lines = t.text.split("\n");
          lines.forEach((line, idx) => {
            const textHeightOffset = idx * fontSize * 1.2;
            p.drawText(line, {
              x: ax,
              y: py + ah - fontSize + textHeightOffset * -1 + fontSize * 0.2,
              size: fontSize,
              font,
              color: hexToRgb(t.color),
            });
          });
          break;
        }
        case "rectangle": {
          const s = ann as ShapeAnnotation;
          p.drawRectangle({
            x: ax,
            y: py,
            width: aw,
            height: ah,
            borderColor: hexToRgb(s.color),
            borderWidth: s.strokeWidth * w,
            color: s.fill ? hexToRgb(s.fillColor) : undefined,
            opacity: s.opacity,
          });
          break;
        }
        case "circle": {
          const s = ann as ShapeAnnotation;
          p.drawEllipse({
            x: ax,
            y: py,
            width: aw,
            height: ah,
            borderColor: hexToRgb(s.color),
            borderWidth: s.strokeWidth * w,
            color: s.fill ? hexToRgb(s.fillColor) : undefined,
            opacity: s.opacity,
          });
          break;
        }
        case "line": {
          const s = ann as ShapeAnnotation;
          p.drawLine({
            start: { x: ax, y: h - ay },
            end: { x: ax + aw, y: h - ay - ah },
            thickness: s.strokeWidth * w,
            color: hexToRgb(s.color),
            opacity: s.opacity,
          });
          break;
        }
        case "highlight": {
          const h_ann = ann as HighlightAnnotation;
          p.drawRectangle({
            x: ax,
            y: py,
            width: aw,
            height: ah,
            color: hexToRgb(h_ann.color),
            opacity: h_ann.opacity,
            borderColor: undefined,
          });
          break;
        }
        case "drawing": {
          const d = ann as DrawingAnnotation;
          if (d.points.length < 2) break;
          // Draw segment by segment as thin rectangles
          for (let k = 1; k < d.points.length; k++) {
            const a = d.points[k - 1];
            const b = d.points[k];
            const x1 = a.x * w;
            const y1 = h - a.y * h;
            const x2 = b.x * w;
            const y2 = h - b.y * h;
            p.drawLine({
              start: { x: x1, y: y1 },
              end: { x: x2, y: y2 },
              thickness: d.strokeWidth * w,
              color: hexToRgb(d.color),
            });
          }
          break;
        }
        case "image":
        case "signature": {
          const img = ann as ImageAnnotation;
          const dataUrl = img.src;
          try {
            const base64 = dataUrl.split(",")[1];
            const isPng = dataUrl.startsWith("data:image/png");
            const bytes = Uint8Array.from(atob(base64), (c) =>
              c.charCodeAt(0)
            );
            const embedded = isPng
              ? await pdfDoc.embedPng(bytes)
              : await pdfDoc.embedJpg(bytes);
            p.drawImage(embedded, {
              x: ax,
              y: py,
              width: aw,
              height: ah,
            });
          } catch (e) {
            console.error("Failed to embed image:", e);
          }
          break;
        }
      }
    }
  }

  // If pages were deleted, remove them from the exported PDF
  // pdf-lib removes by index — we need to remove from end
  if (doc.pages.length < pages.length) {
    const toRemove = pages.length - doc.pages.length;
    for (let i = 0; i < toRemove; i++) {
      pdfDoc.removePage(pages.length - 1 - i);
    }
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

// Helper: read an image File as data URL
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
