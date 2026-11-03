"use client";

import { useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Info, FileText } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface PdfMetadataToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

interface PdfInfo {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: string;
  modificationDate: string;
  pageCount: number;
  fileSize: number;
  pdfVersion: string;
  isEncrypted: boolean;
}

export function PdfMetadataTool({ tool, onBack }: PdfMetadataToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<PdfInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setResultUrl(null);
    loadMetadata(f);
  };

  const loadMetadata = async (file: File) => {
    setLoading(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buf = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
      setInfo({
        title: pdf.getTitle() || "",
        author: pdf.getAuthor() || "",
        subject: pdf.getSubject() || "",
        keywords: (pdf.getKeywords() || "").toString(),
        creator: pdf.getCreator() || "",
        producer: pdf.getProducer() || "",
        creationDate: pdf.getCreationDate()?.toISOString().slice(0, 10) || "",
        modificationDate: pdf.getModificationDate()?.toISOString().slice(0, 10) || "",
        pageCount: pdf.getPageCount(),
        fileSize: file.size,
        pdfVersion: pdf.getHeader() || "unknown",
        isEncrypted: pdf.isEncrypted,
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to read PDF properties", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof PdfInfo, value: string) => {
    setInfo((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!file || !info) return;
    setProcessing(true);
    setResultUrl(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buf = await file.arrayBuffer();
      const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
      pdf.setTitle(info.title);
      pdf.setAuthor(info.author);
      pdf.setSubject(info.subject);
      pdf.setKeywords(info.keywords.split(",").map((k) => k.trim()).filter(Boolean));
      pdf.setCreator(info.creator);
      pdf.setProducer(info.producer);
      if (info.creationDate) {
        pdf.setCreationDate(new Date(info.creationDate));
      }
      if (info.modificationDate) {
        pdf.setModificationDate(new Date(info.modificationDate));
      }
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      toast.success("Metadata updated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update metadata", {
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

  return (
    <ToolLayout tool={tool} onBack={onBack}>
      {!file ? (
        <FileDropZone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop your PDF here"
          sublabel="to view and edit properties"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {info ? `${info.pageCount} pages • ${formatSize(info.fileSize)} • ${info.pdfVersion}` : "Loading…"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                setInfo(null);
                setResultUrl(null);
              }}
            >
              Change
            </Button>
          </div>

          {loading && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Reading PDF properties…</p>
            </div>
          )}

          {info && !loading && (
            <>
              {/* Read-only properties */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Document properties
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-xs text-muted-foreground">Pages</p>
                    <p className="text-sm font-medium">{info.pageCount}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-xs text-muted-foreground">File size</p>
                    <p className="text-sm font-medium">{formatSize(info.fileSize)}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-xs text-muted-foreground">PDF version</p>
                    <p className="text-sm font-medium font-mono">{info.pdfVersion}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-card">
                    <p className="text-xs text-muted-foreground">Encrypted</p>
                    <p className="text-sm font-medium">
                      {info.isEncrypted ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable metadata */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Edit metadata</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                    <input
                      type="text"
                      value={info.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      className="w-full h-9 px-3 rounded-md border bg-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Author</label>
                    <input
                      type="text"
                      value={info.author}
                      onChange={(e) => updateField("author", e.target.value)}
                      className="w-full h-9 px-3 rounded-md border bg-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                    <input
                      type="text"
                      value={info.subject}
                      onChange={(e) => updateField("subject", e.target.value)}
                      className="w-full h-9 px-3 rounded-md border bg-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={info.keywords}
                      onChange={(e) => updateField("keywords", e.target.value)}
                      className="w-full h-9 px-3 rounded-md border bg-transparent text-sm"
                      placeholder="report, finance, 2026"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Creation date</label>
                      <input
                        type="date"
                        value={info.creationDate}
                        onChange={(e) => updateField("creationDate", e.target.value)}
                        className="w-full h-9 px-3 rounded-md border bg-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Modification date</label>
                      <input
                        type="date"
                        value={info.modificationDate}
                        onChange={(e) => updateField("modificationDate", e.target.value)}
                        className="w-full h-9 px-3 rounded-md border bg-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={processing}
                className="w-full h-12 bg-gradient-to-r from-slate-600 to-gray-700 text-white hover:opacity-90 border-0 gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving metadata…
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Save &amp; Download
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
                    Metadata saved!
                  </p>
                  <a
                    href={resultUrl}
                    download={`${file.name.replace(/\.pdf$/i, "")}-metadata.pdf`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium hover:opacity-90"
                  >
                    <Download className="h-4 w-4" />
                    Download updated PDF
                  </a>
                </motion.div>
              )}
            </>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
