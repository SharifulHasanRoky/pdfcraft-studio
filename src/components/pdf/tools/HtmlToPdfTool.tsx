"use client";

import * as React from "react";
import {
  Code2,
  Loader2,
  Upload,
  FileCode,
  Printer,
  Info,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { ToolLayout } from "./ToolLayout";
import { FileDropZone } from "./FileDropZone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { downloadBytes } from "./_shared";

const FAQS = [
  {
    q: "How does HTML to PDF conversion work here?",
    a: "We don't ship a headless Chromium in the browser (that would be enormous). Instead we render your HTML in a hidden iframe and trigger the browser's native print-to-PDF dialog. You pick 'Save as PDF' as the destination. This is the most reliable approach for pixel-perfect HTML → PDF without a server.",
  },
  {
    q: "Is there a 100% programmatic HTML-to-PDF in the browser?",
    a: "Pure-JS libraries like jsPDF + html2canvas exist, but they rasterize pages (text becomes images, no selectable text, larger files). The print approach preserves text and uses your browser's high-quality rendering engine. We chose the print approach for fidelity.",
  },
  {
    q: "Can I include CSS and images?",
    a: "Yes. Inline CSS works directly. For external CSS or images, use absolute URLs (https://...) — relative URLs won't resolve inside the print iframe. Same-origin restrictions apply.",
  },
  {
    q: "What page size does the PDF use?",
    a: "Whatever you choose in the browser's print dialog (A4, Letter, etc.). You can also pick landscape orientation there. We pre-set @page CSS hints for A4 portrait.",
  },
];

const SAMPLE = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Sample Document</title>
    <style>
      body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; margin: 2.5cm; color: #1a1a2e; }
      h1 { color: #7c3aed; font-size: 28pt; margin-bottom: 0.25em; }
      h2 { color: #db2777; font-size: 16pt; margin-top: 1.5em; }
      p { font-size: 11pt; line-height: 1.55; }
      .meta { color: #64748b; font-size: 9pt; margin-bottom: 2em; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5em; }
      .callout { background: #faf5ff; border-left: 4px solid #7c3aed; padding: 0.75em 1em; margin: 1em 0; font-size: 10.5pt; }
    </style>
  </head>
  <body>
    <h1>Hello from PDF Workspace</h1>
    <p class="meta">Generated ${new Date().toLocaleDateString()}</p>
    <p>
      This is a sample HTML document converted to PDF using your browser's native
      print engine. Edit the HTML on the left, then click <strong>Print / Save as PDF</strong>.
    </p>
    <h2>Why this approach?</h2>
    <p>
      Browser-native print preserves selectable text, vector graphics, and crisp
      fonts at any zoom level — no rasterization artifacts.
    </p>
    <div class="callout">
      Tip: set <code>@page { size: A4; margin: 1.5cm }</code> in your CSS for
      precise page geometry.
    </div>
  </body>
</html>`;

export default function HtmlToPdfTool({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = React.useState<"paste" | "upload">("paste");
  const [html, setHtml] = React.useState(SAMPLE);
  const [fileName, setFileName] = React.useState("document.html");
  const [busy, setBusy] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const previewRef = React.useRef<HTMLIFrameElement | null>(null);

  const onFiles = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setHtml(String(reader.result || ""));
      setFileName(f.name);
      toast.success(`Loaded ${f.name}.`);
    };
    reader.onerror = () => toast.error("Could not read file.");
    reader.readAsText(f);
  };

  // Update live preview whenever html changes
  React.useEffect(() => {
    const iframe = previewRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  const print = () => {
    setBusy(true);
    try {
      const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
      if (!win) {
        toast.error(
          "Pop-up blocked. Please allow pop-ups for this site, then try again."
        );
        setBusy(false);
        return;
      }
      win.document.open();
      win.document.write(html);
      win.document.close();
      // Give the browser a tick to render before triggering print.
      setTimeout(() => {
        try {
          win.focus();
          win.print();
        } catch (e) {
          toast.error("Print failed: " + (e instanceof Error ? e.message : "?"));
        }
        setBusy(false);
      }, 350);
      toast.success("Opened print dialog — pick 'Save as PDF'.");
    } catch (e) {
      toast.error("Failed: " + (e instanceof Error ? e.message : "?"));
      setBusy(false);
    }
  };

  const downloadHtml = () => {
    downloadBytes(
      new TextEncoder().encode(html),
      fileName || "document.html",
      "text/html"
    );
  };

  return (
    <ToolLayout
      title="HTML to PDF"
      description="Convert HTML markup to a PDF using your browser's native print engine. Paste your HTML or upload an .html file — no server required."
      icon={Code2}
      onBack={onBack}
      accent="cyan"
      faqs={FAQS}
    >
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 mb-2">
        <div className="flex items-start gap-3">
          <Info className="size-5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-sm text-cyan-800 dark:text-cyan-200">
              How this works (honest note)
            </h3>
            <p className="mt-1 text-xs text-cyan-800/80 dark:text-cyan-200/80 leading-relaxed">
              We render your HTML in a hidden iframe at full browser quality,
              then trigger <code>window.print()</code>. In the print dialog,
              choose <strong>“Save as PDF”</strong> as the destination. This
              preserves selectable text and vector graphics — much higher quality
              than rasterizing libraries.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "paste" | "upload")}>
            <TabsList className="w-full">
              <TabsTrigger value="paste" className="flex-1 gap-1.5">
                <Code2 className="size-3.5" /> Paste HTML
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex-1 gap-1.5">
                <Upload className="size-3.5" /> Upload .html
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paste" className="space-y-3">
              <Label htmlFor="html">HTML source</Label>
              <Textarea
                id="html"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="min-h-[24rem] font-mono text-xs leading-relaxed"
                spellCheck={false}
              />
            </TabsContent>

            <TabsContent value="upload" className="space-y-3">
              <FileDropZone
                accept="text/html,.html,.htm"
                onFiles={onFiles}
                label="Drop an HTML file here or click to browse"
                hint="The HTML will be loaded into the editor for preview and printing."
                icon="generic"
              />
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={print} disabled={busy} className="gap-2">
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Printer className="size-4" />
              )}
              Print / Save as PDF
            </Button>
            <Button
              onClick={downloadHtml}
              variant="outline"
              className="gap-2"
            >
              <Download className="size-4" />
              Download .html
            </Button>
            <Button
              onClick={() => setHtml(SAMPLE)}
              variant="ghost"
              className="gap-2"
            >
              <FileCode className="size-4" />
              Load sample
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileCode className="size-4 text-primary" />
            Live preview
          </div>
          <div className="rounded-lg border overflow-hidden bg-white">
            <iframe
              ref={previewRef}
              title="HTML preview"
              className="w-full h-[28rem] bg-white"
              sandbox="allow-same-origin"
            />
          </div>
        </CardContent>
      </Card>

      {/* Hidden iframe used as a fallback render context (kept for future use) */}
      <iframe
        ref={iframeRef}
        title="render-context"
        className="hidden"
        sandbox="allow-same-origin"
      />
    </ToolLayout>
  );
}
