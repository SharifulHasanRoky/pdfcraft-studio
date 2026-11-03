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

// An image element extracted from the PDF.
export interface PdfImageItem {
  // Position as percentage of page (0-1, top-left origin)
  x: number;
  y: number;
  width: number;
  height: number;
  objId: string;
  // Rendered data URL preview (JPEG)
  src?: string;
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
// ADJACENT ITEMS ARE MERGED INTO LINES so each editable unit is a natural
// piece of text (e.g. one paragraph, one heading) rather than tiny chunks.
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

  // First pass: build raw items in page coordinates with proper metrics
  interface RawItem {
    text: string;
    pdfX: number; // bottom-left origin x in pdf points
    pdfYTop: number; // top-left origin y (in pdf points, from top)
    width: number;
    height: number;
    fontSize: number;
    fontName?: string;
  }
  const rawItems: RawItem[] = [];
  for (const raw of textContent.items) {
    if (!("str" in raw)) continue;
    const str = (raw as any).str as string;
    if (!str) continue; // keep empty strings for spacing logic
    const tr = (raw as any).transform as number[];
    if (!tr || tr.length < 6) continue;
    const a = tr[0];
    const d = tr[3];
    const pdfX = tr[4];
    const pdfY = tr[5];
    const fontSize = Math.abs(d) || Math.abs(a) || 10;
    const itemWidth = (raw as any).width as number;
    const itemHeight = (raw as any).height as number || fontSize;
    rawItems.push({
      text: str,
      pdfX,
      pdfYTop: pageH - pdfY, // convert to top-left origin
      width: itemWidth > 0 ? itemWidth : fontSize * str.length * 0.5,
      height: itemHeight > 0 ? itemHeight : fontSize,
      fontSize,
      fontName: (raw as any).fontName,
    });
  }

  // Second pass: merge items on the same line (same y ± 25% font size, x within gap threshold)
  // into line items. Then we'll merge adjacent lines into paragraphs.
  const lines: RawItem[] = [];
  const used = new Set<number>();
  for (let i = 0; i < rawItems.length; i++) {
    if (used.has(i)) continue;
    const base = rawItems[i];
    used.add(i);
    const lineItems: RawItem[] = [base];
    let curRight = base.pdfX + base.width;
    // Find items on the same line to the right
    for (let j = i + 1; j < rawItems.length; j++) {
      if (used.has(j)) continue;
      const cand = rawItems[j];
      const dy = Math.abs(cand.pdfYTop - base.pdfYTop);
      // Same line if vertical distance is small relative to font size
      if (dy < base.fontSize * 0.5) {
        // Check x proximity — items should be reasonably close
        const gap = cand.pdfX - curRight;
        // Average character width for this font size
        const charW = base.fontSize * 0.5;
        if (gap > -charW * 2 && gap < charW * 8) {
          lineItems.push(cand);
          used.add(j);
          curRight = Math.max(curRight, cand.pdfX + cand.width);
        }
      }
    }
    // Sort line items by x position
    lineItems.sort((a, b) => a.pdfX - b.pdfX);
    // Build merged line item
    const minX = Math.min(...lineItems.map((it) => it.pdfX));
    const maxX = Math.max(...lineItems.map((it) => it.pdfX + it.width));
    const minY = Math.min(...lineItems.map((it) => it.pdfYTop));
    const maxY = Math.max(...lineItems.map((it) => it.pdfYTop + it.height));
    // Join text — preserve single space between items if there was a gap
    let lineText = "";
    for (let k = 0; k < lineItems.length; k++) {
      const it = lineItems[k];
      if (k > 0) {
        const prev = lineItems[k - 1];
        const prevRight = prev.pdfX + prev.width;
        const gap = it.pdfX - prevRight;
        const charW = it.fontSize * 0.3;
        if (gap > charW) lineText += " ";
      }
      lineText += it.text;
    }
    if (!lineText.trim()) continue;
    const fontSize = Math.max(...lineItems.map((it) => it.fontSize));
    lines.push({
      text: lineText.trim(),
      pdfX: minX,
      pdfYTop: minY,
      width: maxX - minX,
      height: maxY - minY,
      fontSize,
      fontName: base.fontName,
    });
  }

  // Third pass: merge lines into paragraphs if they're close vertically
  // and have similar x position + font size (typical paragraph structure).
  lines.sort((a, b) => a.pdfYTop - b.pdfYTop);
  const merged: RawItem[] = [];
  const usedLine = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    if (usedLine.has(i)) continue;
    const base = lines[i];
    usedLine.add(i);
    const group: RawItem[] = [base];
    let curBottom = base.pdfYTop + base.height;
    for (let j = i + 1; j < lines.length; j++) {
      if (usedLine.has(j)) continue;
      const cand = lines[j];
      const dx = Math.abs(cand.pdfX - base.pdfX);
      const sizeRatio = cand.fontSize / base.fontSize;
      const verticalGap = cand.pdfYTop - curBottom;
      // Same paragraph if: similar x position, similar font size, gap is line-height-ish
      if (
        dx < base.fontSize * 2 &&
        sizeRatio > 0.85 &&
        sizeRatio < 1.15 &&
        verticalGap > 0 &&
        verticalGap < base.fontSize * 1.5
      ) {
        group.push(cand);
        usedLine.add(j);
        curBottom = cand.pdfYTop + cand.height;
      } else {
        break; // lines are sorted, so we can stop
      }
    }
    if (group.length === 1) {
      merged.push(group[0]);
    } else {
      const minX = Math.min(...group.map((g) => g.pdfX));
      const maxX = Math.max(...group.map((g) => g.pdfX + g.width));
      const minY = Math.min(...group.map((g) => g.pdfYTop));
      const maxY = Math.max(...group.map((g) => g.pdfYTop + g.height));
      const fontSize = group[0].fontSize;
      merged.push({
        text: group.map((g) => g.text).join("\n"),
        pdfX: minX,
        pdfYTop: minY,
        width: maxX - minX,
        height: maxY - minY,
        fontSize,
        fontName: base.fontName,
      });
    }
  }

  // Convert to percentage coordinates and apply scale
  const items: PdfTextItem[] = merged
    .map((m) => {
      // Skip if entirely off-page
      if (m.pdfX < 0 || m.pdfX > pageW || m.pdfYTop < 0 || m.pdfYTop > pageH)
        return null;
      return {
        text: m.text,
        x: m.pdfX / pageW,
        y: m.pdfYTop / pageH,
        width: m.width / pageW,
        height: Math.max(m.height, m.fontSize) / pageH,
        fontSizeRel: m.fontSize / pageH,
        fontSizePx: m.fontSize * 1.5, // matches our default render scale of 1.5
        fontName: m.fontName,
      } as PdfTextItem;
    })
    .filter((x): x is PdfTextItem => x !== null);

  return items;
}

// Extract existing images from a page so they can be made editable.
// Uses pdf.js's operator list to find paintImageXObject operations,
// then resolves the image data via page.objs.
export async function extractImageItems(
  doc: PdfDocument,
  pageIndex: number
): Promise<PdfImageItem[]> {
  const pdfDoc = await getPdfDoc(doc.data);
  const page = await pdfDoc.getPage(doc.pages[pageIndex].pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const pageW = viewport.width;
  const pageH = viewport.height;
  const opList = await page.getOperatorList();
  const pdfjs = await getPdfjs();
  const OPS = pdfjs.OPS;
  const items: PdfImageItem[] = [];
  const paintImageFn = OPS.paintImageXObject;
  const paintInlineFn = OPS.paintInlineImageXObject;
  const transformFn = OPS.transform;
  const saveFn = OPS.save;
  const restoreFn = OPS.restore;

  // Track the current transformation matrix (CTM) by walking through the ops.
  function multiply(m1: number[], m2: number[]): number[] {
    const [a1, b1, c1, d1, e1, f1] = m1;
    const [a2, b2, c2, d2, e2, f2] = m2;
    return [
      a1 * a2 + c1 * b2,
      b1 * a2 + d1 * b2,
      a1 * c2 + c1 * d2,
      b1 * c2 + d1 * d2,
      a1 * e2 + c1 * f2 + e1,
      b1 * e2 + d1 * f2 + f1,
    ];
  }
  // Initial CTM: pdf.js default transform for the viewport at scale 1.
  // For viewport at scale 1, the transform converts PDF coords (bottom-left)
  // to viewport coords (top-left). But the operator list operates in PDF
  // user space, NOT viewport space. So we start with the identity CTM
  // representing the PDF's default coordinate system.
  let ctm: number[] = [1, 0, 0, 1, 0, 0];
  const ctmStack: number[][] = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];

    // Maintain CTM
    if (fn === saveFn) {
      ctmStack.push([...ctm]);
    } else if (fn === restoreFn) {
      if (ctmStack.length > 0) ctm = ctmStack.pop()!;
    } else if (fn === transformFn) {
      const args = opList.argsArray[i] as number[];
      if (args && args.length >= 6) {
        ctm = multiply(args, ctm);
      }
      continue;
    }

    const isPaintImage = fn === paintImageFn || fn === paintInlineFn;
    if (!isPaintImage) continue;
    const args = opList.argsArray[i];
    if (!args || args.length < 1) continue;
    const isInline = fn === paintInlineFn;
    let objId: string;
    if (!isInline) {
      objId = String(args[0]);
    } else {
      objId = `inline-${i}`;
    }

    // The CTM at this point gives us the matrix that maps image unit-space
    // (0..1) to PDF user space. For a typical image drawn at position (x, y)
    // with width w and height h, the CTM is [w, 0, 0, h, x, y] (no flip in
    // PDF user space; pdf.js handles the flip in the render step).
    const a = ctm[0];
    const d = ctm[3];
    const e = ctm[4];
    const f = ctm[5];
    // pdf.js's operator-list transforms use device-space coords where the unit
    // length equals PDF points multiplied by an internal device scale. We can
    // recover the scale by noting that for a typical image, the CTM's a and d
    // equal the display width/height in PDF points × device scale. We don't know
    // the device scale directly, but we can detect it: for any image, the CTM
    // value `a` should equal displayWidth × deviceScale. If we know the image's
    // intrinsic width from args (imgWidth, imgHeight), then deviceScale = a / imgWidth.
    // For paintImageXObject, args = [objId, imgWidth, imgHeight].
    // For paintInlineImageXObject, args[0] is the image data; args[1,2] are w,h.
    let intrinsicW = 1;
    let intrinsicH = 1;
    if (!isInline) {
      intrinsicW = args[1] || 1;
      intrinsicH = args[2] || 1;
    } else {
      intrinsicW = args[1] || 1;
      intrinsicH = args[2] || 1;
    }
    // deviceScale = a / intrinsicW (assuming image is drawn 1:1 with intrinsic size)
    // BUT some images are scaled non-uniformly. To be safe, derive scale from
    // the relationship: page width in PDF points = page width in device units / deviceScale.
    // We know pageW (PDF points) and we can compute device page width = e_max - e_min
    // across all ops. Easier: derive deviceScale from the assumption that the image
    // was placed in PDF user space at the intrinsic size or a simple scale.
    // Use the simplest robust approach: deviceScale = a / intrinsicW when a > 0.
    const deviceScale = intrinsicW > 0 ? Math.abs(a) / intrinsicW : 1;
    const realA = a / deviceScale;
    const realD = d / deviceScale;
    const realE = e / deviceScale;
    const realF = f / deviceScale;
    const displayW = Math.abs(realA);
    const displayH = Math.abs(realD);
    const pdfX = realE;
    // In PDF user space, y is bottom-left origin. Convert to top-left.
    const pdfYBottom = realD < 0 ? realF - displayH : realF;
    const pdfYTop = pageH - pdfYBottom - displayH;
    if (displayW <= 1 || displayH <= 1) continue;
    if (pdfX < -10 || pdfX > pageW + 10 || pdfYTop < -10 || pdfYTop > pageH + 10)
      continue;

    // Try to resolve the image data URL
    let src: string | undefined;
    try {
      if (!isInline) {
        const imgObj = await new Promise<any>((resolve, reject) => {
          const tryGet = (attempt: number) => {
            if (attempt > 20) {
              reject(new Error("Image object not resolved"));
              return;
            }
            const obj = page.objs.get(objId);
            if (obj) resolve(obj);
            else setTimeout(() => tryGet(attempt + 1), 100);
          };
          tryGet(0);
        });
        if (imgObj) {
          const canvas = document.createElement("canvas");
          canvas.width = imgObj.width || 256;
          canvas.height = imgObj.height || 256;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            if (imgObj.bitmap) {
              ctx.drawImage(imgObj.bitmap, 0, 0, canvas.width, canvas.height);
              src = canvas.toDataURL("image/png");
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
                ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
                src = canvas.toDataURL("image/png");
              }
            }
          }
        }
      }
    } catch {
      // ignore resolution errors — still record position
    }

    items.push({
      x: Math.max(0, pdfX) / pageW,
      y: Math.max(0, pdfYTop) / pageH,
      width: displayW / pageW,
      height: displayH / pageH,
      objId,
      src,
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
