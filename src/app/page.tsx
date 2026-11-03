"use client";

import dynamic from "next/dynamic";

// Load editor only on client (uses browser-only PDF.js)
const EditorApp = dynamic(
  () => import("@/components/pdf/EditorApp").then((m) => m.EditorApp),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading PDFCraft Studio…</p>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  return <EditorApp />;
}
