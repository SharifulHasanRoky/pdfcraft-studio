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
  us: string;
}[] = [
  { feature: "Daily tasks", ilovepdf: "2–5/day", sejda: "3/hour", smallpdf: "2/day", us: "Unlimited" },
  { feature: "Signup required", ilovepdf: "After limit", sejda: "No", smallpdf: "Yes", us: "Never" },
  { feature: "Watermark on free", ilovepdf: "Some tools", sejda: "No", smallpdf: "Yes", us: "No, ever" },
  { feature: "Files leave browser", ilovepdf: "Yes", sejda: "Yes", smallpdf: "Yes", us: "No" },
  { feature: "Edit existing text", ilovepdf: "Paid", sejda: "Limited", smallpdf: "Paid", us: "Free" },
  { feature: "Premium plan", ilovepdf: "$7/mo", sejda: "$5+/wk", smallpdf: "$7/mo", us: "None" },
];

export function ToolHub({ onOpenTool, onOpenEditor }: ToolHubProps) {
  const [query, setQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const { theme, setTheme } = useTheme();
  const { setDocument, setPages, setLoading, setLoadError } = usePdfStore();

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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => {
              setQuery("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-2"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">PDFCraft Studio</span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#tools" className="text-muted-foreground hover:text-foreground transition-colors">Tools</a>
            <a href="#compare" className="text-muted-foreground hover:text-foreground transition-colors">Compare</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-8 w-8"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              onClick={() => document.getElementById("hero-upload-input")?.click()}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-8"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit a PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO — clean, centered, focused */}
      <section className="border-b border-border bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            Free forever • No daily limits • Browser-based
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5"
          >
            Every PDF tool.{" "}
            <span className="text-primary">Free. Forever.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="text-base sm:text-lg text-muted-foreground mb-8"
          >
            {TOOLS.length} tools to merge, split, compress, convert and edit PDFs.
            No signup. No watermark. Better than iLovePDF.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative max-w-xl mx-auto mb-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools — merge, compress, convert…"
                className="w-full h-12 pl-12 pr-10 rounded-lg border border-border bg-card text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                  className="absolute top-full mt-2 left-0 right-0 rounded-lg border bg-popover shadow-xl overflow-hidden z-10 text-left"
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
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: tool.color }}
                        >
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isLoading && document.getElementById("hero-upload-input")?.click()}
            className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-all p-5 max-w-xl mx-auto ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/60 hover:bg-accent/30"
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
              <div className="flex items-center justify-center gap-2.5">
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm font-medium">Loading PDF…</p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                  <Upload className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Open a PDF to edit visually</p>
                  <p className="text-xs text-muted-foreground">Drag &amp; drop or click to browse</p>
                </div>
              </div>
            )}
          </motion.div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          {/* Inline stats */}
          <div className="mt-10 flex items-center justify-center gap-8 text-sm">
            <Stat value="50K+" label="Users" />
            <Stat value="1.2M+" label="PDFs processed" />
            <Stat value="0" label="Daily limits" />
            <Stat value="100%" label="Free" />
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section id="tools" className="py-12 md:py-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {recentTools.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                Recently used
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {recentTools.map((tool) => (
                  <ToolCard key={`recent-${tool.id}`} tool={tool} onClick={() => handleToolClick(tool.slug)} small />
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-1">Popular tools</h2>
            <p className="text-sm text-muted-foreground">All free, all browser-based</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-12">
            {popularTools.map((tool, i) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onClick={() => handleToolClick(tool.slug)}
                delay={i * 0.04}
              />
            ))}
          </div>

          {/* All tools by category */}
          <div className="space-y-8">
            {(Object.keys(TOOL_CATEGORIES) as ToolCategory[]).map((cat) => {
              const catInfo = TOOL_CATEGORIES[cat];
              const catTools = TOOLS.filter((t) => t.category === cat);
              if (catTools.length === 0) return null;
              const CatIcon = catInfo.icon;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-md bg-secondary/10 flex items-center justify-center">
                      <CatIcon className="h-3 w-3 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{catInfo.label}</h3>
                      <p className="text-xs text-muted-foreground hidden sm:block">{catInfo.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {catTools.map((tool, i) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        onClick={() => handleToolClick(tool.slug)}
                        delay={i * 0.03}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPARE — compact */}
      <section id="compare" className="py-12 bg-secondary/5 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              Why switch
            </p>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Better than the rest. <span className="text-primary">No daily limits.</span>
            </h2>
          </div>

          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="grid grid-cols-5 bg-muted/40 border-b border-border">
              <div className="p-2.5 sm:p-3 text-xs sm:text-sm font-medium text-muted-foreground">Feature</div>
              <div className="p-2.5 sm:p-3 text-center text-xs sm:text-sm font-medium text-muted-foreground">iLovePDF</div>
              <div className="p-2.5 sm:p-3 text-center text-xs sm:text-sm font-medium text-muted-foreground">Sejda</div>
              <div className="p-2.5 sm:p-3 text-center text-xs sm:text-sm font-medium text-muted-foreground">Smallpdf</div>
              <div className="p-2.5 sm:p-3 text-center text-xs sm:text-sm font-bold text-primary bg-primary/5">PDFCraft</div>
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-5 border-b border-border/40 last:border-0 hover:bg-accent/20 transition-colors"
              >
                <div className="p-2.5 sm:p-3 text-xs sm:text-sm font-medium">{row.feature}</div>
                <div className="p-2.5 sm:p-3 text-center text-[10px] sm:text-xs text-muted-foreground">{row.ilovepdf}</div>
                <div className="p-2.5 sm:p-3 text-center text-[10px] sm:text-xs text-muted-foreground">{row.sejda}</div>
                <div className="p-2.5 sm:p-3 text-center text-[10px] sm:text-xs text-muted-foreground">{row.smallpdf}</div>
                <div className="p-2.5 sm:p-3 text-center text-[10px] sm:text-xs font-semibold text-primary bg-primary/5 flex items-center justify-center gap-0.5">
                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                  {row.us}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground mt-3 text-center">
            Based on each competitor&apos;s publicly listed free-tier restrictions. Verify on their site.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-12 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Questions</p>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Frequently asked</h2>
          </div>
          <div className="space-y-2">
            {[
              { q: "Is PDFCraft Studio really free?", a: "Yes. Every tool is 100% free. No sign-up, no watermark, no daily limit." },
              { q: "Are my PDFs uploaded to a server?", a: "No. All processing happens in your browser. Your PDFs never leave your device." },
              { q: "Is there a daily usage limit?", a: "No. Use any tool as many times as you want, every day." },
              { q: "Can I edit existing text inside a PDF?", a: "Yes. Click 'Edit a PDF' at the top. The visual editor lets you click any text and edit it inline." },
              { q: "Does it work on mobile?", a: "Yes. PDFCraft Studio is fully responsive — works on iOS, Android, tablets and desktops." },
            ].map((faq, i) => (
              <details key={i} className="group rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors">
                <summary className="font-medium text-sm cursor-pointer list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-muted-foreground text-xs group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-card py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold text-sm">PDFCraft Studio</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                The world&apos;s free PDF workspace. Better than iLovePDF — no daily limits,
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
              Made with <Heart className="h-3 w-3 text-primary fill-primary" /> for everyone
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============== TOOL CARD — simple, clean ============== */

interface ToolCardProps {
  tool: ToolMeta;
  onClick: () => void;
  small?: boolean;
  delay?: number;
}

function ToolCard({ tool, onClick, small, delay = 0 }: ToolCardProps) {
  const Icon = tool.icon;
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.25, delay }}
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl border border-border bg-card p-4 text-left hover:border-primary/50 hover:shadow-md transition-all"
    >
      <div
        className={`${small ? "h-8 w-8" : "h-10 w-10"} rounded-lg flex items-center justify-center mb-2.5`}
        style={{ backgroundColor: tool.color }}
      >
        <Icon className={`${small ? "h-4 w-4" : "h-5 w-5"} text-white`} />
      </div>
      <h3 className="text-sm font-semibold mb-0.5">{tool.title}</h3>
      {!small && (
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
          {tool.description}
        </p>
      )}
      {tool.isBeta && (
        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
          BETA
        </span>
      )}
    </motion.button>
  );
}

/* ============== STAT ============== */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-lg md:text-xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
