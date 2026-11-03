"use client";

import { useState } from "react";
import { FileDropZone } from "./FileDropZone";
import { ToolLayout } from "./ToolLayout";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lock, FileText, Info } from "lucide-react";
import { motion } from "framer-motion";
import type { ToolMeta } from "@/lib/tools-registry";

interface ProtectPdfToolProps {
  tool: ToolMeta;
  onBack: () => void;
}

export function ProtectPdfTool({ tool, onBack }: ProtectPdfToolProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleFile = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  return (
    <ToolLayout tool={tool} onBack={onBack}>
      {!file ? (
        <FileDropZone
          accept="application/pdf"
          onFiles={handleFile}
          label="Drop your PDF here"
          sublabel="to add protection"
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-xl border bg-card">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
              Change
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-amber-500/40 bg-amber-500/5 p-5"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  Browser-based PDF encryption is limited
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  The JavaScript PDF library we use (pdf-lib) does not support
                  full PDF encryption. We&apos;re working on adding WebAssembly-based
                  encryption in a future update.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p className="font-medium">Recommended alternatives for now:</p>
              <ul className="space-y-1.5 text-muted-foreground ml-4">
                <li className="list-disc">
                  Use{" "}
                  <a
                    href="https://www.adobe.com/acrobat/online/password-protect-pdf.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Adobe Acrobat Online
                  </a>{" "}
                  (free for limited use)
                </li>
                <li className="list-disc">
                  Desktop tools:{" "}
                  <span className="font-mono text-foreground">qpdf</span> (free, command line),
                  Adobe Acrobat Pro, Foxit
                </li>
                <li className="list-disc">
                  Mac: Open in Preview → File → Export → Encrypt
                </li>
              </ul>
            </div>
          </motion.div>

          <div className="p-4 rounded-xl border bg-card">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p className="font-medium text-foreground mb-1">
                  Why no encryption in browser?
                </p>
                PDF encryption requires complex cryptographic operations
                (AES-128, AES-256, RC4) that browser-based JavaScript libraries
                don&apos;t fully support. Implementing it incorrectly could give
                users a false sense of security, so we&apos;d rather be honest
                about the limitation than ship a fake &quot;protected&quot; PDF.
              </div>
            </div>
          </div>

          <Button
            onClick={() => {
              setFile(null);
              onBack();
            }}
            variant="outline"
            className="w-full gap-2"
          >
            <Lock className="h-4 w-4" />
            Back to all tools
          </Button>
        </div>
      )}
    </ToolLayout>
  );
}
