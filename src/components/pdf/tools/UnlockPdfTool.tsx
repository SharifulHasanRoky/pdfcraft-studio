"use client";

import { useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Unlock, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface UnlockPdfToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

export function UnlockPdfTool({ tool, onBack }: UnlockPdfToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notEncrypted, setNotEncrypted] = useState(false);

  const handleFile = (files: File[]) => {
    if (files.length === 0) return;
    setFile(files[0]);
    setResultUrl(null);
    setError(null);
    setNotEncrypted(false);
    // Check if encrypted
    (async () => {
      try {
        const { PDFDocument } = await import("pdf-lib");
        const buf = await files[0].arrayBuffer();
        const pdf = await PDFDocument.load(buf, { ignoreEncryption: true });
        if (!pdf.isEncrypted) {
          setNotEncrypted(true);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  };

  const handleUnlock = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    setResultUrl(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const buf = await file.arrayBuffer();
      // First try loading without password
      let pdf;
      try {
        pdf = await PDFDocument.load(buf, { ignoreEncryption: false });
      } catch {
        // Try with password
        try {
          pdf = await PDFDocument.load(buf, {
            ignoreEncryption: false,
            password,
          });
        } catch {
          setError("Incorrect password. Please check and try again.");
          setProcessing(false);
          return;
        }
      }
      const bytes = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: "application/pdf" });
      setResultUrl(URL.createObjectURL(blob));
      toast.success("PDF unlocked!");
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to unlock PDF");
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
          sublabel="to remove the password"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {notEncrypted ? "This PDF is not password-protected" : "Password required"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFile(null);
                setResultUrl(null);
                setError(null);
                setNotEncrypted(false);
                setPassword("");
              }}
            >
              Change
            </Button>
          </div>

          {notEncrypted && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">This PDF is not encrypted.</p>
                <p className="text-xs mt-1">
                  You can still re-save it without any password protection (which it
                  already doesn&apos;t have). Use the button below.
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="password" className="text-sm font-medium mb-1.5 block">
              PDF password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the PDF password"
              disabled={notEncrypted}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              We can only remove the password if you know it. We do not crack passwords.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <Button
            onClick={handleUnlock}
            disabled={processing || (!password && !notEncrypted)}
            className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 border-0 gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Unlocking PDF…
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" />
                Unlock PDF
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
                PDF unlocked!
              </p>
              <a
                href={resultUrl}
                download={`${file.name.replace(/\.pdf$/i, "")}-unlocked.pdf`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                Download unlocked PDF
              </a>
            </motion.div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
