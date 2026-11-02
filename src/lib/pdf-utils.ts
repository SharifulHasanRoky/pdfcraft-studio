// PDF utilities - load, render, and export PDFs
// All operations preserve original quality: original PDF bytes are never re-encoded,
// we only overlay new annotations on top using pdf-lib.

import type {
  Annotation,
  PdfDocument,
  PdfPageData,
  TextAnnotation,
  TextReplaceAnnotation,
  ShapeAnnotation,
  HighlightAnnotation,
  DrawingAnnotation,
  ImageAnnotation,
} from "./pdf-types";

// A text item extracted from the PDF — used to make existing PDF text editable.
export interface PdfTextItem {
  text: string;
  // Position as percentage of page (0-1, top-left origin)
  x: number;
  y: number;
  width: number;
  height: number;
  // Font size in PDF points (relative to page height as 0-1)
  fontSizeRel: number;
  fontSizePx: number; // approximate size at scale 1.5
  fontName?: string;
}

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

// Extract existing text items from a page so they can be made editable.
// Returns positions in percentage coordinates (0-1, top-left origin).
export async function extractTextItems(
  doc: PdfDocument,
  pageIndex: number
): Promise<PdfTextItem[]> {
  const pdfDoc = await getPdfDoc(doc.data);
  const page = await pdfDoc.getPage(doc.pages[pageIndex].pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const pageW = viewport.width;
  const pageH = viewport.height;
  const textContent = await page.getTextContent();
  const items: PdfTextItem[] = [];
  for (const raw of textContent.items) {
    if (!("str" in raw)) continue;
    const str = (raw as any).str as string;
    if (!str || !str.trim()) continue;
    const tr = (raw as any).transform as number[];
    if (!tr || tr.length < 6) continue;
    // transform = [a, b, c, d, e, f]
    // a = horizontal scale, d = vertical scale (= font size for horizontal text)
    // e, f = x, y position in PDF (bottom-left origin)
    const a = tr[0];
    const d = tr[3];
    const pdfX = tr[4];
    const pdfY = tr[5];
    const fontSize = Math.abs(d) || Math.abs(a) || 10;
    const itemWidth = (raw as any).width as number;
    const itemHeight = (raw as any).height as number || fontSize;
    // Convert to top-left origin percentage
    const xPct = pdfX / pageW;
    const yPct = (pageH - pdfY) / pageH;
    // Width and height as percentage of page
    const wPct = (itemWidth > 0 ? itemWidth : fontSize * str.length * 0.5) / pageW;
    const hPct = fontSize / pageH;
    if (xPct < 0 || xPct > 1 || yPct < 0 || yPct > 1) continue;
    items.push({
      text: str,
      x: xPct,
      y: yPct - hPct, // adjust so the box top is at the text top
      width: wPct,
      height: hPct,
      fontSizeRel: fontSize / pageH,
      fontSizePx: fontSize * 1.5, // approximate pixel size at our default render scale of 1.5
      fontName: (raw as any).fontName,
    });
  }
  return items;
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

  function getFont(ann: TextAnnotation | TextReplaceAnnotation) {
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
        case "text-replace": {
          // Edit existing PDF text: cover original with a rectangle in the
          // cover color (typically white), then draw new text on top.
          const t = ann as TextReplaceAnnotation;
          // 1. Cover the original text area
          p.drawRectangle({
            x: ax,
            y: py,
            width: aw,
            height: ah,
            color: hexToRgb(t.coverColor || "#FFFFFF"),
            opacity: 1,
          });
          // 2. Draw the new text on top
          if (t.text.trim()) {
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
          }
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
