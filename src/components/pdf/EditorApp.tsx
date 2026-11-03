"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { usePdfStore } from "@/lib/pdf-store";
import { useTheme } from "next-themes";
import { Toolbar } from "./Toolbar";
import { PageThumbnails } from "./PageThumbnails";
import { CanvasEditor } from "./CanvasEditor";
import { Immersive3DView } from "./Immersive3DView";
import { SignaturePad } from "./SignaturePad";
import { ToolHub } from "./ToolHub";
import {
  TOOLS,
  getToolBySlug,
  type ToolMeta,
} from "@/lib/tools-registry";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

// Lazy-load tool components to keep the bundle small
import dynamic from "next/dynamic";

const toolComponents: Record<string, React.ComponentType<{ tool: ToolMeta; onBack: () => void }>> = {
  merge: dynamic(() => import("./tools/MergePdfTool").then((m) => m.MergePdfTool), { ssr: false }),
  split: dynamic(() => import("./tools/SplitPdfTool").then((m) => m.SplitPdfTool), { ssr: false }),
  compress: dynamic(() => import("./tools/CompressPdfTool").then((m) => m.CompressPdfTool), { ssr: false }),
  rotate: dynamic(() => import("./tools/RotatePdfTool").then((m) => m.RotatePdfTool), { ssr: false }),
  organize: dynamic(() => import("./tools/OrganizePagesTool").then((m) => m.OrganizePagesTool), { ssr: false }),
  "page-numbers": dynamic(() => import("./tools/PageNumbersTool").then((m) => m.PageNumbersTool), { ssr: false }),
  watermark: dynamic(() => import("./tools/WatermarkPdfTool").then((m) => m.WatermarkPdfTool), { ssr: false }),
  "pdf-to-jpg": dynamic(() => import("./tools/PdfToJpgTool").then((m) => m.PdfToJpgTool), { ssr: false }),
  "jpg-to-pdf": dynamic(() => import("./tools/JpgToPdfTool").then((m) => m.JpgToPdfTool), { ssr: false }),
  "pdf-to-text": dynamic(() => import("./tools/PdfToTextTool").then((m) => m.PdfToTextTool), { ssr: false }),
  "extract-images": dynamic(() => import("./tools/ExtractImagesTool").then((m) => m.ExtractImagesTool), { ssr: false }),
  metadata: dynamic(() => import("./tools/PdfMetadataTool").then((m) => m.PdfMetadataTool), { ssr: false }),
  unlock: dynamic(() => import("./tools/UnlockPdfTool").then((m) => m.UnlockPdfTool), { ssr: false }),
  protect: dynamic(() => import("./tools/ProtectPdfTool").then((m) => m.ProtectPdfTool), { ssr: false }),
};

type View = "hub" | "tool" | "editor";

export function EditorApp() {
  const { document: doc, activeView, reset, theme } = usePdfStore();
  const { setTheme } = useTheme();
  const [sigOpen, setSigOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [view, setView] = useState<View>("hub");
  const [activeToolSlug, setActiveToolSlug] = useState<string | null>(null);

  // Sync store theme with next-themes
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  // Listen for "open-signature-pad" events (from PDF editor)
  useEffect(() => {
    const handler = () => setSigOpen(true);
    window.addEventListener("open-signature-pad", handler);
    return () => window.removeEventListener("open-signature-pad", handler);
  }, []);

  // Sync view state with URL hash on mount + on hashchange
  // Allows deep-linking: #/merge-pdf, #/editor, etc.
  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, "");
      if (hash === "editor" || hash === "") {
        // Default to hub
        if (hash === "" && view !== "tool") {
          setView("hub");
          setActiveToolSlug(null);
        }
      } else {
        const tool = getToolBySlug(hash);
        if (tool) {
          setView("tool");
          setActiveToolSlug(tool.slug);
          return;
        }
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  // Open a tool (changes view + updates URL hash)
  const openTool = useCallback((slug: string) => {
    if (typeof history !== "undefined" && history.pushState) {
      history.pushState(null, "", `#/${slug}`);
    }
    setView("tool");
    setActiveToolSlug(slug);
    // Scroll to top
    window.scrollTo(0, 0);
  }, []);

  // Back to tool hub
  const backToHub = useCallback(() => {
    if (typeof history !== "undefined" && history.pushState) {
      history.pushState(null, "", "#");
    }
    setView("hub");
    setActiveToolSlug(null);
    setEntered(false);
    window.scrollTo(0, 0);
    reset();
  }, [reset]);

  // Open the visual PDF editor (the existing full-featured one)
  const openEditor = useCallback(() => {
    if (typeof history !== "undefined" && history.pushState) {
      history.pushState(null, "", "#/editor");
    }
    setView("editor");
    setEntered(true);
    window.scrollTo(0, 0);
  }, []);

  // Theme sync
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  // Auto-switch to editor view when a PDF document is loaded.
  // We detect this during render and queue the state change via microtask
  // to avoid setState-in-effect cascading renders.
  if (doc && view !== "editor") {
    queueMicrotask(() => {
      setView("editor");
      setEntered(true);
      // Use history API to avoid the no-mutate rule on window.location.hash
      if (typeof history !== "undefined" && history.replaceState) {
        history.replaceState(null, "", "#/editor");
      }
    });
  }

  const activeTool = useMemo(
    () => (activeToolSlug ? getToolBySlug(activeToolSlug) : null),
    [activeToolSlug]
  );

  // Render the appropriate view
  if (view === "tool" && activeTool) {
    const ToolComponent = toolComponents[activeTool.id];
    if (ToolComponent) {
      return <ToolComponent tool={activeTool} onBack={backToHub} />;
    }
    // Fall back to hub if tool not found
  }

  if (view === "editor" && doc && entered) {
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
              if (confirm("Start over? This will clear the current document and all edits.")) {
                backToHub();
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

  // Default: tool hub (homepage)
  return <ToolHub onOpenTool={openTool} onOpenEditor={openEditor} />;
}
