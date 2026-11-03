// Shared helpers for the PDF tool components (client-side only).
import { toast } from "sonner";

/** Format bytes as a human-friendly string. */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(k)),
    sizes.length - 1
  );
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Trigger a browser download for a Blob/Uint8Array.
 * Pure client-side. Also best-effort POSTs a copy to /api/save-download so
 * a copy lands in /home/z/my-project/download/ for the sandbox deliverable.
 */
export async function downloadBytes(
  bytes: Uint8Array | Blob,
  filename: string,
  mime = "application/octet-stream"
): Promise<void> {
  const blob =
    bytes instanceof Blob ? bytes : new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  // Best-effort server-side copy (sandbox deliverable).
  try {
    const arrayBuf =
      bytes instanceof Blob ? await bytes.arrayBuffer() : bytes.buffer.slice(0);
    await fetch("/api/save-download", {
      method: "POST",
      headers: { "Content-Type": mime, "X-Filename": filename },
      body: arrayBuf,
    }).catch(() => {});
  } catch {
    /* ignore — purely a convenience copy */
  }
}

/** Trigger sequential downloads of multiple files (no ZIP dep needed). */
export async function downloadMultiple(
  files: { bytes: Uint8Array; filename: string; mime?: string }[],
  onProgress?: (i: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    await downloadBytes(f.bytes, f.filename, f.mime || "application/octet-stream");
    onProgress?.(i + 1, files.length);
    // small delay so the browser doesn't choke
    await new Promise((r) => setTimeout(r, 350));
  }
}

/** Lazy-load pdfjs-dist and configure the worker. */
export async function getPdfjs(): Promise<typeof import("pdfjs-dist")> {
  const mod = await import("pdfjs-dist");
  mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return mod;
}

/** Parse a page-range string like "1-3, 5, 7-9" into an array of 0-based page indices. */
export function parsePageRanges(input: string, totalPages: number): number[] {
  const out: number[] = [];
  const parts = input.split(",").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map((s) => parseInt(s.trim(), 10));
      if (Number.isNaN(a) || Number.isNaN(b)) continue;
      const start = Math.max(1, Math.min(a, b));
      const end = Math.min(totalPages, Math.max(a, b));
      for (let i = start; i <= end; i++) out.push(i - 1);
    } else {
      const n = parseInt(part, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= totalPages) out.push(n - 1);
    }
  }
  // de-dupe, keep order
  return Array.from(new Set(out));
}

/** Render a single page of a PDF to a JPEG data URL using pdfjs. */
export async function renderPdfPreview(
  data: ArrayBuffer,
  pageIndex = 0,
  targetWidth = 160
): Promise<string> {
  const pdfjs = await getPdfjs();
  // pdfjs mutates the input buffer; clone first so callers can reuse `data`.
  const clone = data.slice(0);
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(clone) });
  const doc = await loadingTask.promise;
  const page = await doc.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale: 1 });
  const scale = targetWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(scaledViewport.width));
  canvas.height = Math.max(1, Math.floor(scaledViewport.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d context unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: scaledViewport, canvas }).promise;
  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
  try {
    await doc.destroy();
  } catch {}
  return dataUrl;
}
