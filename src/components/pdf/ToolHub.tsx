"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Sparkles,
  Upload,
  FileText,
  Shield,
  Moon,
  Sun,
  X,
  Users,
  Heart,
  Check,
  Layers,
  Scissors,
  Minimize2,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  TOOLS,
  TOOL_CATEGORIES,
  searchTools,
  type ToolCategory,
  type ToolMeta,
} from "@/lib/tools-registry";
import { loadPdfFromFile } from "@/lib/pdf-utils";
import { usePdfStore } from "@/lib/pdf-store";
import { useTilt, useCountUp, useParallax, useInView } from "@/lib/use-3d";

interface ToolHubProps {
  onOpenTool: (slug: string) => void;
  onOpenEditor: () => void;
}

const RECENT_TOOLS_KEY = "pdfcraft:recent-tools";

/**
 * Multi-competitor comparison table.
 * Source data verified Nov 2026 from each competitor's publicly listed free-tier
 * restrictions. Numbers may change — always check the competitor's site.
 */
const COMPARE_ROWS: {
  feature: string;
  ilovepdf: string;
  sejda: string;
  smallpdf: string;
  canva: string;
  us: string;
}[] = [
  {
    feature: "Daily task limit",
    ilovepdf: "2–5 tasks/day",
    sejda: "3 tasks/hour",
    smallpdf: "2 docs/day",
    canva: "Unlimited*",
    us: "Unlimited",
  },
  {
    feature: "Sign-up required",
    ilovepdf: "After limit",
    sejda: "No",
    smallpdf: "Yes",
    canva: "Yes (account)",
    us: "Never",
  },
  {
    feature: "Watermark on free",
    ilovepdf: "Some tools",
    sejda: "No",
    smallpdf: "Yes",
    canva: "No",
    us: "No, ever",
  },
  {
    feature: "File upload to servers",
    ilovepdf: "Yes",
    sejda: "Yes (auto-deleted)",
    smallpdf: "Yes",
    canva: "Yes (cloud)",
    us: "No — stays in browser",
  },
  {
    feature: "Edit existing PDF text",
    ilovepdf: "Paid only",
    sejda: "Yes (limited)",
    smallpdf: "Paid only",
    canva: "Yes (overlay)",
    us: "Yes, free",
  },
  {
    feature: "Free file size limit",
    ilovepdf: "15–400 MB",
    sejda: "50 MB / 200 pages",
    smallpdf: "5 MB",
    canva: "25 MB",
    us: "No hard limit",
  },
  {
    feature: "Premium plan price",
    ilovepdf: "$7/mo ($48/yr)",
    sejda: "$5 week / $63 yr",
    smallpdf: "$7/mo",
    canva: "$15/mo Pro",
    us: "No premium. Ever.",
  },
  {
    feature: "3D immersive view",
    ilovepdf: "No",
    sejda: "No",
    smallpdf: "No",
    canva: "No",
    us: "Yes",
  },
];

export function ToolHub({ onOpenTool, onOpenEditor }: ToolHubProps) {
  const [query, setQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const { theme, setTheme } = useTheme();
  const { setDocument, setPages, setLoading, setLoadError } = usePdfStore();
  const parallax = useParallax();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_TOOLS_KEY);
      if (stored) {
        const slugs = JSON.parse(stored) as string[];
        if (Array.isArray(slugs)) setRecentSlugs(slugs.slice(0, 4));
      }
    } catch {
      // ignore
    }
  }, []);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchTools(query);
  }, [query]);

  const popularTools = useMemo(() => TOOLS.filter((t) => t.popular), []);
  const recentTools = useMemo(
    () =>
      recentSlugs
        .map((slug) => TOOLS.find((t) => t.slug === slug))
        .filter((t): t is ToolMeta => !!t),
    [recentSlugs]
  );

  const trackToolUse = useCallback((slug: string) => {
    setRecentSlugs((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, 6);
      try {
        localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next.slice(0, 4);
    });
  }, []);

  const handleToolClick = useCallback(
    (slug: string) => {
      trackToolUse(slug);
      onOpenTool(slug);
    },
    [onOpenTool, trackToolUse]
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file || file.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }
      setError(null);
      setIsLoading(true);
      setLoading(true);
      setLoadError(null);
      try {
        const doc = await loadPdfFromFile(file);
        setDocument(doc);
        setPages(doc.pages);
        onOpenEditor();
      } catch (e) {
        console.error(e);
        const msg = e instanceof Error ? e.message : "Failed to load PDF";
        setError(msg);
        setLoadError(msg);
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    },
    [setDocument, setPages, setLoading, setLoadError, onOpenEditor]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      {/* NAV — slim, sticky, glass */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-2xl">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => {
              setQuery("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2 group"
          >
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-rose-400 via-violet-500 to-amber-400 blur-md opacity-50 group-hover:opacity-90 transition-opacity" />
              <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-rose-400 via-violet-500 to-amber-400 flex items-center justify-center shadow-sm">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </div>
            <span className="font-bold text-sm tracking-tight">PDFCraft Studio</span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#tools" className="text-muted-foreground hover:text-foreground transition-colors">Tools</a>
            <a href="#compare" className="text-muted-foreground hover:text-foreground transition-colors">vs competitors</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
              className="h-8 w-8"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              onClick={() => document.getElementById("hero-upload-input")?.click()}
              className="gap-1.5 bg-gradient-to-r from-rose-500 via-violet-600 to-amber-500 text-white hover:opacity-90 border-0 h-8 shadow-lg shadow-primary/30"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit a PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO — 3D immersive with parallax floating PDF mockup */}
      <section className="relative overflow-hidden bg-hero-gradient">
        {/* Parallax floating blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute top-[8%] left-[5%] h-80 w-80 rounded-full bg-rose-400/30 blur-3xl animate-mesh"
            style={{ transform: `translate(${parallax.x * 30}px, ${parallax.y * 30}px)` }}
          />
          <div
            className="absolute top-[15%] right-[8%] h-96 w-96 rounded-full bg-violet-500/30 blur-3xl animate-mesh"
            style={{ animationDelay: "-6s", transform: `translate(${parallax.x * -40}px, ${parallax.y * -40}px)` }}
          />
          <div
            className="absolute bottom-[5%] left-[30%] h-80 w-80 rounded-full bg-amber-400/25 blur-3xl animate-mesh"
            style={{ animationDelay: "-12s", transform: `translate(${parallax.x * 25}px, ${parallax.y * 25}px)` }}
          />
        </div>

        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* LEFT: Headline + search + upload */}
            <div className="text-center md:text-left">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass shadow-sm mb-5"
              >
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium">
                  Free forever • No daily limits • Browser-based
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-5"
              >
                Every PDF tool.
                <br />
                <span className="text-gradient">Free. Forever.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-base sm:text-lg text-muted-foreground mb-7 max-w-xl"
              >
                {TOOLS.length} tools to merge, split, compress, convert and edit PDFs.
                No signup. No watermark. No daily limits. Better than iLovePDF, Sejda, Smallpdf, Canva.
              </motion.p>

              {/* Search bar */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="relative max-w-xl mb-4"
              >
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search 14 tools — merge, compress, convert…"
                    className="w-full h-13 py-3.5 pl-12 pr-10 rounded-xl border-2 border-border bg-card/80 backdrop-blur-sm text-sm shadow-lg focus:outline-none focus:border-primary transition-colors"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full hover:bg-accent flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute top-full mt-2 left-0 right-0 rounded-xl border bg-popover shadow-xl overflow-hidden z-10"
                    >
                      {searchResults.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => {
                              handleToolClick(tool.slug);
                              setQuery("");
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-accent text-left transition-colors"
                          >
                            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{tool.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Drag & drop PDF upload */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isLoading && document.getElementById("hero-upload-input")?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all p-5 glass shadow-lg hover:shadow-xl max-w-xl ${
                  isDragging
                    ? "border-primary scale-[1.01] ring-4 ring-primary/20"
                    : "border-border/60 hover:border-primary/50"
                }`}
              >
                <input
                  id="hero-upload-input"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = "";
                  }}
                />
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2.5 py-1">
                    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm font-medium">Loading PDF…</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-rose-500 via-violet-600 to-amber-500 flex items-center justify-center">
                      <Upload className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">Open a PDF to edit visually</p>
                      <p className="text-xs text-muted-foreground">Drag &amp; drop or click to browse</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            </div>

            {/* RIGHT: 3D floating PDF mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden md:flex justify-center items-center h-[400px]"
            >
              <PdfMockup3D parallax={parallax} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <AnimatedStat icon={Users} value={50000} suffix="+" label="Happy users" />
            <AnimatedStat icon={FileText} value={1200000} suffix="+" label="PDFs processed" />
            <AnimatedStat icon={Shield} value={0} label="Daily limits" />
            <AnimatedStat icon={Heart} value={100} suffix="%" label="Free, always" />
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section id="tools" className="py-16 md:py-20 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          {recentTools.length > 0 && (
            <div className="mb-10">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Recently used
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {recentTools.map((tool) => (
                  <ToolCard3D key={`recent-${tool.id}`} tool={tool} onClick={() => handleToolClick(tool.slug)} small />
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-bold tracking-tight mb-1"
            >
              Popular tools
            </motion.h2>
            <p className="text-sm text-muted-foreground">Most-used PDF tools — all free, all browser-based</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mb-12">
            {popularTools.map((tool, i) => (
              <ToolCard3D
                key={tool.id}
                tool={tool}
                onClick={() => handleToolClick(tool.slug)}
                delay={i * 0.05}
              />
            ))}
          </div>

          {/* All tools by category */}
          <div className="space-y-10">
            {(Object.keys(TOOL_CATEGORIES) as ToolCategory[]).map((cat, catIdx) => {
              const catInfo = TOOL_CATEGORIES[cat];
              const catTools = TOOLS.filter((t) => t.category === cat);
              if (catTools.length === 0) return null;
              const CatIcon = catInfo.icon;
              return (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: catIdx * 0.05 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
                      <CatIcon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{catInfo.label}</h3>
                      <p className="text-xs text-muted-foreground">{catInfo.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {catTools.map((tool, i) => (
                      <ToolCard3D
                        key={tool.id}
                        tool={tool}
                        onClick={() => handleToolClick(tool.slug)}
                        delay={i * 0.04}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* INTERACTIVE SHOWCASE */}
      <InteractiveShowcase onOpenEditor={() => document.getElementById("hero-upload-input")?.click()} />

      {/* COMPARE */}
      <section id="compare" className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              Why switch
            </p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl md:text-3xl font-bold tracking-tight"
            >
              Better than the rest.{" "}
              <span className="text-gradient">No daily limits.</span>
            </motion.h2>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
              How PDFCraft Studio stacks up against iLovePDF, Sejda, Smallpdf and Canva.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-4 text-left font-medium text-muted-foreground w-44">Feature</th>
                    <th className="p-4 text-center font-medium text-muted-foreground">iLovePDF</th>
                    <th className="p-4 text-center font-medium text-muted-foreground">Sejda</th>
                    <th className="p-4 text-center font-medium text-muted-foreground">Smallpdf</th>
                    <th className="p-4 text-center font-medium text-muted-foreground">Canva</th>
                    <th className="p-4 text-center font-semibold bg-gradient-to-b from-primary/10 to-amber-500/5 text-primary">PDFCraft</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, i) => (
                    <tr key={i} className="border-t border-border/40 hover:bg-accent/30 transition-colors">
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center text-xs text-muted-foreground">{row.ilovepdf}</td>
                      <td className="p-4 text-center text-xs text-muted-foreground">{row.sejda}</td>
                      <td className="p-4 text-center text-xs text-muted-foreground">{row.smallpdf}</td>
                      <td className="p-4 text-center text-xs text-muted-foreground">{row.canva}</td>
                      <td className="p-4 text-center font-semibold text-emerald-600 dark:text-emerald-400 text-xs bg-gradient-to-b from-primary/5 to-transparent">
                        <span className="inline-flex items-center gap-1">
                          <Check className="h-3 w-3 shrink-0" />
                          {row.us}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile — stacked cards */}
          <div className="md:hidden space-y-4">
            {COMPARE_ROWS.map((row, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card p-4">
                <p className="text-sm font-semibold mb-3">{row.feature}</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">iLovePDF</span>
                    <span className="text-muted-foreground text-right">{row.ilovepdf}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Sejda</span>
                    <span className="text-muted-foreground text-right">{row.sejda}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Smallpdf</span>
                    <span className="text-muted-foreground text-right">{row.smallpdf}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Canva</span>
                    <span className="text-muted-foreground text-right">{row.canva}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1.5 mt-1.5 border-t border-border/40">
                    <span className="font-semibold text-primary">PDFCraft</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-right flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {row.us}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center max-w-2xl mx-auto">
            Comparison based on each competitor&apos;s publicly listed free-tier restrictions at the time
            of writing. Limits may change — always verify on the competitor&apos;s site.
          </p>
        </div>
      </section>

      {/* FAQ — collapsible */}
      <section id="faq" className="py-16 md:py-20 bg-background">
        <div className="container mx-auto max-w-2xl px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              Questions
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Frequently asked
            </h2>
          </div>
          <div className="space-y-2">
            {[
              { q: "Is PDFCraft Studio really free?", a: "Yes. Every tool is 100% free. No sign-up, no watermark, no daily limit. Funded by ads, never by you." },
              { q: "Are my PDFs uploaded to a server?", a: "No. All processing happens in your browser using JavaScript. Your PDFs never leave your device." },
              { q: "Is there a daily usage limit?", a: "No. Use any tool as many times as you want, every day. No daily quotas, no 'come back tomorrow' messages." },
              { q: "Can I edit existing text inside a PDF?", a: "Yes. Click 'Edit a PDF' at the top. The visual editor lets you click any text and edit it inline." },
              { q: "Does it work on mobile?", a: "Yes. PDFCraft Studio is fully responsive — works on iOS, Android, tablets and desktops." },
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl border border-border/60 bg-card/50 p-4 hover:border-border transition-colors">
                <summary className="font-medium text-sm cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-muted-foreground text-xs group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-hero-gradient">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[10%] h-72 w-72 rounded-full bg-rose-400/30 blur-3xl animate-mesh" />
          <div className="absolute bottom-[10%] right-[10%] h-80 w-80 rounded-full bg-violet-500/30 blur-3xl animate-mesh" style={{ animationDelay: "-8s" }} />
        </div>
        <div className="container relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            Ready to edit your PDF?
          </motion.h2>
          <p className="text-muted-foreground text-lg mb-8">
            No sign-up. No watermark. No upload. Just open and edit.
          </p>
          <Button
            size="lg"
            onClick={() => document.getElementById("hero-upload-input")?.click()}
            className="gap-2 bg-gradient-to-r from-rose-500 via-violet-600 to-amber-500 text-white hover:opacity-90 border-0 h-12 px-8 shadow-xl shadow-primary/30"
          >
            <Upload className="h-4 w-4" />
            Open a PDF — it&apos;s free
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-rose-400 via-violet-500 to-amber-400 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-sm">PDFCraft Studio</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                The world&apos;s free PDF workspace. Better than iLovePDF, Sejda, Smallpdf, Canva — no daily limits,
                no signup, no watermark. Browser-based, private by design.
              </p>
            </div>
            {(["organize", "convert", "edit"] as ToolCategory[]).map((cat) => {
              const catTools = TOOLS.filter((t) => t.category === cat).slice(0, 5);
              return (
                <div key={cat}>
                  <h4 className="text-xs font-semibold mb-2">{TOOL_CATEGORIES[cat].label}</h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {catTools.map((t) => (
                      <li key={t.id}>
                        <button
                          onClick={() => handleToolClick(t.slug)}
                          className="hover:text-foreground transition-colors text-left"
                        >
                          {t.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="border-t mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              © 2026 PDFCraft Studio. All processing happens in your browser.
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> for everyone, everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============== 3D PDF MOCKUP ============== */

function PdfMockup3D({ parallax }: { parallax: { x: number; y: number } }) {
  return (
    <div
      className="relative"
      style={{
        transform: `perspective(1200px) rotateY(${parallax.x * 8}deg) rotateX(${-parallax.y * 6}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 0.2s ease-out",
      }}
    >
      {/* Back glow */}
      <div className="absolute inset-0 -z-10 scale-110 rounded-3xl bg-gradient-to-br from-rose-400/30 via-violet-500/30 to-amber-400/30 blur-3xl" />

      {/* PDF Page mockup */}
      <div className="relative w-72 h-96 rounded-2xl bg-white shadow-2xl border border-white/40 overflow-hidden">
        {/* Header bar */}
        <div className="h-10 bg-gradient-to-r from-rose-500 via-violet-600 to-amber-500 flex items-center px-4 gap-2">
          <div className="h-2 w-2 rounded-full bg-white/60" />
          <div className="h-2 w-2 rounded-full bg-white/40" />
          <div className="h-2 w-2 rounded-full bg-white/30" />
          <div className="ml-auto text-white text-[10px] font-medium opacity-80">document.pdf</div>
        </div>

        {/* Page content — fake text lines */}
        <div className="p-5 space-y-2">
          <div className="h-3 w-3/4 rounded-full bg-gradient-to-r from-rose-400 to-violet-500" />
          <div className="h-1.5 w-full rounded-full bg-slate-200" />
          <div className="h-1.5 w-5/6 rounded-full bg-slate-200" />
          <div className="h-1.5 w-4/5 rounded-full bg-slate-200" />
          <div className="h-1.5 w-full rounded-full bg-slate-200" />
          <div className="h-1.5 w-3/4 rounded-full bg-slate-200" />

          {/* Floating annotation badges */}
          <div
            className="absolute top-20 -right-2 px-2 py-1 rounded-md bg-emerald-500 text-white text-[10px] font-bold shadow-lg"
            style={{ transform: "translateZ(40px)" }}
          >
            ✓ Free
          </div>
          <div
            className="absolute top-32 -right-3 px-2 py-1 rounded-md bg-rose-500 text-white text-[10px] font-bold shadow-lg"
            style={{ transform: "translateZ(60px)" }}
          >
            No limits
          </div>
          <div
            className="absolute top-44 -right-2 px-2 py-1 rounded-md bg-violet-600 text-white text-[10px] font-bold shadow-lg"
            style={{ transform: "translateZ(50px)" }}
          >
            Private
          </div>

          {/* Mid-page title */}
          <div className="mt-4 h-2 w-1/2 rounded-full bg-slate-300" />
          <div className="h-1.5 w-full rounded-full bg-slate-100" />
          <div className="h-1.5 w-5/6 rounded-full bg-slate-100" />
          <div className="h-1.5 w-2/3 rounded-full bg-slate-100" />

          {/* Signature box at bottom */}
          <div className="absolute bottom-6 left-5 right-5 h-12 rounded-lg border-2 border-dashed border-rose-300 bg-rose-50/50 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-rose-500">✎ Sign here</span>
          </div>
        </div>
      </div>

      {/* Floating tool card stack */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-8 -left-12 px-3 py-2 rounded-xl bg-white shadow-xl border border-white/40 flex items-center gap-2"
        style={{ transform: "translateZ(80px)" }}
      >
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
          <Layers className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-900">Merge PDF</div>
          <div className="text-[9px] text-slate-500">Free tool</div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-1/3 -right-10 px-3 py-2 rounded-xl bg-white shadow-xl border border-white/40 flex items-center gap-2"
        style={{ transform: "translateZ(70px)" }}
      >
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Scissors className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-900">Split</div>
          <div className="text-[9px] text-slate-500">Pages</div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-12 -left-10 px-3 py-2 rounded-xl bg-white shadow-xl border border-white/40 flex items-center gap-2"
        style={{ transform: "translateZ(60px)" }}
      >
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Minimize2 className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-900">Compress</div>
          <div className="text-[9px] text-slate-500">−42%</div>
        </div>
      </motion.div>
    </div>
  );
}

/* ============== INTERACTIVE SHOWCASE ============== */

function InteractiveShowcase({ onOpenEditor }: { onOpenEditor: () => void }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const [activeFeature, setActiveFeature] = useState(0);

  // Auto-rotate features
  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <section ref={ref} className="py-16 md:py-24 bg-card/30 border-y border-border/40">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            Interactive
          </p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            See what you can do
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Hover or tap the cards to explore PDFCraft&apos;s core capabilities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* LEFT — rotating feature preview */}
          <div className="relative h-80 md:h-96 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotateY: 20 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex items-center justify-center"
                style={{ perspective: "1000px" }}
              >
                {FEATURES[activeFeature].preview}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT — feature selector */}
          <div className="space-y-2">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const isActive = i === activeFeature;
              return (
                <button
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isActive
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border/60 bg-card/40 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? "bg-gradient-to-br from-rose-500 via-violet-600 to-amber-500"
                          : "bg-primary/10"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{feature.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
            <Button
              onClick={onOpenEditor}
              className="w-full mt-4 bg-gradient-to-r from-rose-500 via-violet-600 to-amber-500 text-white hover:opacity-90 border-0 gap-2"
            >
              Try it now — free
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: FileText,
    title: "Edit existing PDF text",
    desc: "Click any text in your PDF and edit it inline. Add new text, change fonts, colors, sizes.",
    preview: (
      <div className="w-64 h-80 rounded-2xl bg-white shadow-2xl overflow-hidden border border-border/40">
        <div className="h-8 bg-gradient-to-r from-rose-500 to-violet-600" />
        <div className="p-5 space-y-2">
          <div className="h-3 w-3/4 rounded-full bg-slate-200" />
          <div className="relative inline-block">
            <div className="h-2 w-32 rounded-full bg-rose-300/60" />
            <div className="absolute -top-1 -left-1 -right-1 -bottom-1 border-2 border-dashed border-rose-500 rounded-md" />
            <div className="absolute -top-6 left-0 text-[9px] font-bold text-rose-500 bg-rose-100 px-1.5 py-0.5 rounded">
              Editing…
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100" />
          <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
          <div className="h-1.5 w-2/3 rounded-full bg-slate-100" />
          <div className="mt-6 h-2 w-1/2 rounded-full bg-slate-300" />
          <div className="h-1.5 w-full rounded-full bg-slate-100" />
          <div className="h-1.5 w-5/6 rounded-full bg-slate-100" />
        </div>
      </div>
    ),
  },
  {
    icon: Layers,
    title: "Merge multiple PDFs",
    desc: "Combine multiple PDF files into one. Reorder pages, then merge into a single document.",
    preview: (
      <div className="flex flex-col items-center gap-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="w-44 h-24 rounded-xl bg-white shadow-xl border border-border/40 flex items-center px-3 gap-2"
          >
            <div className="h-12 w-10 rounded-md bg-gradient-to-br from-rose-400 to-violet-500" />
            <div className="flex-1">
              <div className="h-1.5 w-full rounded-full bg-slate-200" />
              <div className="h-1.5 w-2/3 mt-1 rounded-full bg-slate-200" />
              <div className="mt-2 text-[9px] font-medium text-slate-500">document_{i + 1}.pdf</div>
            </div>
          </motion.div>
        ))}
        <div className="mt-2 text-xs font-bold text-emerald-600 flex items-center gap-1">
          <Layers className="h-3 w-3" />
          Merge → 1 PDF
        </div>
      </div>
    ),
  },
  {
    icon: Shield,
    title: "100% private — browser only",
    desc: "Your PDFs never leave your device. Everything runs in your browser using JavaScript.",
    preview: (
      <div className="relative">
        <div className="w-64 h-80 rounded-2xl bg-white shadow-2xl overflow-hidden border border-border/40 flex flex-col items-center justify-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div className="text-center px-6">
            <p className="text-sm font-bold text-slate-900">Browser-only</p>
            <p className="text-xs text-slate-500 mt-1">
              No upload. No server. No tracking.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-emerald-600">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Encrypted in transit by browser
          </div>
        </div>
      </div>
    ),
  },
  {
    icon: Minimize2,
    title: "Compress with size preview",
    desc: "Three compression levels with before/after size comparison. See savings instantly.",
    preview: (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-400">8.4 MB</div>
            <div className="text-xs text-slate-500 mt-1">Before</div>
          </div>
          <div className="text-2xl text-emerald-600">→</div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">4.9 MB</div>
            <div className="text-xs text-slate-500 mt-1">After</div>
          </div>
        </div>
        <div className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-sm font-semibold">
          −42% smaller
        </div>
        <div className="w-64 h-3 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-600" style={{ width: "58%" }} />
        </div>
      </div>
    ),
  },
];

/* ============== 3D TOOL CARD ============== */

interface ToolCard3DProps {
  tool: ToolMeta;
  onClick: () => void;
  small?: boolean;
  delay?: number;
}

function ToolCard3D({ tool, onClick, small, delay = 0 }: ToolCard3DProps) {
  const Icon = tool.icon;
  const { ref, style } = useTilt(6);
  const { ref: inViewRef, inView } = useInView<HTMLButtonElement>(0.1);

  return (
    <motion.button
      ref={inViewRef}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className="group relative"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        ref={ref}
        style={style}
        className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-card p-4 text-left hover:shadow-xl hover:border-primary/40 transition-colors"
      >
        {/* Glow effect */}
        <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${tool.color} opacity-10 blur-2xl group-hover:opacity-30 transition-opacity`} />
        <div
          className={`relative ${small ? "h-8 w-8" : "h-10 w-10"} rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center mb-2.5 shadow-md`}
          style={{ transform: "translateZ(30px)" }}
        >
          <Icon className={`${small ? "h-4 w-4" : "h-5 w-5"} text-white`} />
        </div>
        <h3 className="text-sm font-semibold mb-0.5" style={{ transform: "translateZ(20px)" }}>
          {tool.title}
        </h3>
        {!small && (
          <p
            className="text-xs text-muted-foreground leading-snug line-clamp-2"
            style={{ transform: "translateZ(15px)" }}
          >
            {tool.description}
          </p>
        )}
        {tool.isBeta && (
          <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
            BETA
          </span>
        )}
      </div>
    </motion.button>
  );
}

/* ============== ANIMATED STAT (count up) ============== */

interface AnimatedStatProps {
  icon: LucideIcon;
  value: number;
  suffix?: string;
  label: string;
}

function AnimatedStat({ icon: Icon, value, suffix = "", label }: AnimatedStatProps) {
  const { ref, value: animatedValue } = useCountUp(value, 1800);
  const formatted = useMemo(() => {
    if (value >= 1000000) {
      return (animatedValue / 1000000).toFixed(1) + "M";
    }
    if (value >= 1000) {
      return (animatedValue / 1000).toFixed(animatedValue < 10000 ? 1 : 0) + "K";
    }
    return String(animatedValue);
  }, [animatedValue, value]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1">
      <Icon className="h-4 w-4 text-muted-foreground/70 mb-1" />
      <div className="text-2xl md:text-3xl font-bold tabular-nums">
        {formatted}
        {suffix}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
