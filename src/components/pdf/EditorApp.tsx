"use client";

import { useEffect, useState } from "react";
import { usePdfStore } from "@/lib/pdf-store";
import { useTheme } from "next-themes";
import { PdfUploader } from "./PdfUploader";
import { Toolbar } from "./Toolbar";
import { PageThumbnails } from "./PageThumbnails";
import { CanvasEditor } from "./CanvasEditor";
import { Immersive3DView } from "./Immersive3DView";
import { SignaturePad } from "./SignaturePad";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function EditorApp() {
  const { document: doc, activeView, reset, theme } = usePdfStore();
  const { setTheme } = useTheme();
  const [sigOpen, setSigOpen] = useState(false);

  // Sync store theme with next-themes
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  // Listen for "open-signature-pad" events
  useEffect(() => {
    const handler = () => setSigOpen(true);
    window.addEventListener("open-signature-pad", handler);
    return () => window.removeEventListener("open-signature-pad", handler);
  }, []);

  if (!doc) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <main className="flex-1 flex flex-col items-center justify-center py-12">
          <PdfUploader />
        </main>
        <footer className="mt-auto border-t py-6 text-center text-xs text-muted-foreground">
          PDFCraft Studio • 100% client-side • Your PDFs never leave your browser
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Toolbar />
      {activeView === "editor" ? (
        <div className="flex flex-1 overflow-hidden">
          <PageThumbnails />
          <CanvasEditor />
        </div>
      ) : (
        <Immersive3DView />
      )}

      <footer className="mt-auto border-t py-2 px-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {doc.fileName} • {doc.numPages} pages
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (
              confirm(
                "Start over? This will clear the current document and all edits."
              )
            ) {
              reset();
            }
          }}
          className="gap-1.5 text-xs h-7"
        >
          <RotateCcw className="h-3 w-3" />
          New PDF
        </Button>
      </footer>

      <SignaturePad
        open={sigOpen}
        onClose={() => setSigOpen(false)}
        onSave={(dataUrl) => {
          window.dispatchEvent(
            new CustomEvent("place-signature", { detail: dataUrl })
          );
        }}
      />
    </div>
  );
}
