"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Sparkles,
  Upload,
  FileText,
  Shield,
  Zap,
  Globe,
  Lock,
  Star,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Heart,
  Moon,
  Sun,
  X,
  TrendingUp,
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

export function ToolHub({ onOpenTool, onOpenEditor }: ToolHubProps) {
  const [query, setQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const { theme, setTheme } = useTheme();
  const { setDocument, setPages, setLoading, setLoadError } = usePdfStore();

  // Load recently used tools from localStorage
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
      {/* NAV */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => {
              setQuery("");
              window.scrollTo(0, 0);
            }}
            className="flex items-center gap-2 group"
          >
            <div className="relative h-9 w-9">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-rose-400 via-violet-500 to-amber-400 blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-rose-400 via-violet-500 to-amber-400 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="leading-none">
              <span className="font-bold text-base">PDFCraft</span>
              <span className="text-gradient font-bold text-base ml-0.5">Studio</span>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm">
            <a href="#tools" className="text-muted-foreground hover:text-foreground transition-colors">All tools</a>
            <a href="#how" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#compare" className="text-muted-foreground hover:text-foreground transition-colors">vs iLovePDF</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              onClick={() => document.getElementById("hero-upload-input")?.click()}
              className="gap-1.5 bg-gradient-to-r from-rose-500 via-violet-600 to-amber-500 text-white hover:opacity-90 border-0"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit a PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO with search + upload */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] h-72 w-72 rounded-full bg-rose-400/30 blur-3xl animate-mesh" />
          <div className="absolute top-[20%] right-[8%] h-96 w-96 rounded-full bg-violet-500/30 blur-3xl animate-mesh" style={{ animationDelay: "-6s" }} />
          <div className="absolute bottom-[5%] left-[30%] h-80 w-80 rounded-full bg-amber-400/25 blur-3xl animate-mesh" style={{ animationDelay: "-12s" }} />
        </div>

        <div className="container relative mx-auto max-w-5xl px-4 sm:px-6 py-12 md:py-20 lg:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass shadow-sm mb-5"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium">
                Free forever • No sign-up • No daily limits
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-5"
            >
              The world&apos;s free <span className="text-gradient">PDF workspace</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg text-muted-foreground mb-8"
            >
              Better than iLovePDF. No daily limits. Edit, convert, merge, split, compress,
              sign and organize your PDFs — all in your browser.
            </motion.p>

            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="relative max-w-2xl mx-auto mb-5"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What do you want to do with your PDF?"
                  className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-border bg-card/80 backdrop-blur-sm text-base shadow-lg focus:outline-none focus:border-primary transition-colors"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-accent flex items-center justify-center"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Search results dropdown */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
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
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{tool.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Drag & drop PDF upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isLoading && document.getElementById("hero-upload-input")?.click()}
              className={`relative mx-auto max-w-2xl cursor-pointer rounded-2xl border-2 border-dashed transition-all p-6 glass shadow-xl hover:shadow-2xl ${
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
                <div className="flex items-center justify-center gap-3 py-2">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm font-medium">Loading PDF…</p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 via-violet-600 to-amber-500 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold">Open a PDF to edit visually</p>
                    <p className="text-xs text-muted-foreground">
                      Drag &amp; drop or click to browse
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {error && (
              <p className="mt-3 text-sm text-destructive">{error}</p>
            )}

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium">4.9 / 5</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span className="font-medium">50k+ users</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-medium">Files never leave your browser</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* POPULAR TOOLS */}
      <section id="tools" className="py-12 md:py-16 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          {recentTools.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recently used
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {recentTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <ToolCard key={`recent-${tool.id}`} tool={tool} onClick={() => handleToolClick(tool.slug)} small />
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Popular PDF tools</h2>
            <p className="text-sm text-muted-foreground mt-1">
              The most-used PDF tools. All free, no signup.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {popularTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onClick={() => handleToolClick(tool.slug)} />
            ))}
          </div>
        </div>
      </section>

      {/* ALL TOOLS BY CATEGORY */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-center">
            All PDF tools
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-10">
            {TOOLS.length} tools • all free, all browser-based
          </p>

          <div className="space-y-10">
            {(Object.keys(TOOL_CATEGORIES) as ToolCategory[]).map((cat) => {
              const catInfo = TOOL_CATEGORIES[cat];
              const catTools = TOOLS.filter((t) => t.category === cat);
              if (catTools.length === 0) return null;
              const CatIcon = catInfo.icon;
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CatIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{catInfo.label}</h3>
                      <p className="text-xs text-muted-foreground">{catInfo.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {catTools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} onClick={() => handleToolClick(tool.slug)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ad slot */}
          <div className="mt-10 p-6 rounded-2xl border border-dashed border-border/60 bg-background text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Advertisement
            </p>
            <div className="h-24 flex items-center justify-center text-xs text-muted-foreground/60">
              Ad slot
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-3">
            How PDFCraft Studio works
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-10">
            Three steps. No accounts. No uploads to a server.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { num: 1, title: "Pick a tool", desc: "Choose from 14+ PDF tools. Click any tool card above or upload a PDF to use the visual editor." },
              { num: 2, title: "Process your PDF", desc: "Your PDF is processed entirely in your browser. No file is uploaded to our servers — privacy by design." },
              { num: 3, title: "Download result", desc: "Get your processed PDF instantly. No watermark, no sign-up, no waiting." },
            ].map((s) => (
              <div key={s.num} className="text-center">
                <div className="relative mx-auto mb-4 h-14 w-14">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400 via-violet-500 to-amber-400 opacity-30 blur-md" />
                  <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-rose-500 via-violet-600 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {s.num}
                  </div>
                </div>
                <h3 className="font-semibold mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARE TABLE */}
      <section id="compare" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Better than iLovePDF. <span className="text-gradient">No daily limits.</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              We compete on a better free experience — not on feature count.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Feature</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">iLovePDF</th>
                  <th className="text-center p-4 font-medium text-primary">PDFCraft</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Daily task limit", them: "2 tasks/day (free)", us: "Unlimited" },
                  { feature: "Mandatory sign-up", them: "Required after limit", us: "Never required" },
                  { feature: "Forced watermark", them: "On free downloads", us: "No watermark, ever" },
                  { feature: "File upload", them: "To their servers", us: "Stays in your browser" },
                  { feature: "Free PDF editor", them: "Limited free tools", us: "All tools free" },
                  { feature: "Premium plan", them: "Yes — $7+/month", us: "No premium. Ever." },
                  { feature: "Mobile experience", them: "Web mobile", us: "Mobile-first design" },
                ].map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-4">{row.feature}</td>
                    <td className="p-4 text-center text-muted-foreground">{row.them}</td>
                    <td className="p-4 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {row.us}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Comparison based on iLovePDF&apos;s publicly listed free-tier restrictions at the time of writing.
            Always check competitor sites for current terms.
          </p>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 bg-gradient-to-r from-rose-500 via-violet-600 to-amber-500 text-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Users, value: "50K+", label: "Happy users" },
              { icon: FileText, value: "1.2M+", label: "PDFs processed" },
              { icon: Clock, value: "0", label: "Daily limits" },
              { icon: Heart, value: "100%", label: "Free, always" },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <Icon className="h-6 w-6 opacity-80 mb-1" />
                  <div className="text-3xl md:text-4xl font-bold tabular-nums">{s.value}</div>
                  <div className="text-xs md:text-sm opacity-80">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {[
              { q: "Is PDFCraft Studio really free?", a: "Yes. Every tool is 100% free. No sign-up, no watermark, no daily limit. Funded by ads, never by you." },
              { q: "Are my PDFs uploaded to a server?", a: "No. All processing happens in your browser using JavaScript libraries like pdf-lib and pdf.js. Your PDFs never leave your device." },
              { q: "Is there a daily usage limit?", a: "No. Use any tool as many times as you want, every day. No daily quotas, no task counters, no 'come back tomorrow' messages." },
              { q: "Can I edit existing text inside a PDF?", a: "Yes. Use the visual PDF editor (click 'Edit a PDF' at the top). The 'Edit Existing Text' tool lets you click any text in the PDF and edit it inline." },
              { q: "Does it work on mobile?", a: "Yes. PDFCraft Studio is fully responsive and works on iOS, Android, tablets and desktops." },
              { q: "Will my PDFs have a watermark?", a: "No. We never add watermarks to your downloads. The PDF you get back is clean." },
              { q: "What's the maximum file size?", a: "There's no hard limit. Very large PDFs (100MB+) may take longer and use more browser memory, but everything still works in your device." },
              { q: "Do I need to create an account?", a: "No. Every tool works without registration. You can optionally create an account later to save your PDFs, but it's never required to use the tools." },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card/50 p-4">
                <h3 className="font-medium text-sm mb-1.5">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-background py-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-400 via-violet-500 to-amber-400 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">PDFCraft Studio</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The world&apos;s free PDF workspace. Better than iLovePDF — no daily limits, no signup, no watermark.
              </p>
            </div>

            {(["organize", "convert", "edit"] as ToolCategory[]).map((cat) => {
              const catTools = TOOLS.filter((t) => t.category === cat).slice(0, 6);
              return (
                <div key={cat}>
                  <h4 className="text-sm font-semibold mb-3">{TOOL_CATEGORIES[cat].label}</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
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

          <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
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

interface ToolCardProps {
  tool: ToolMeta;
  onClick: () => void;
  small?: boolean;
}

function ToolCard({ tool, onClick, small }: ToolCardProps) {
  const Icon = tool.icon;
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-4 text-left hover:shadow-lg hover:border-primary/40 transition-all"
    >
      <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${tool.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
      <div className={`relative ${small ? "h-9 w-9" : "h-11 w-11"} rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3 shadow-sm`}>
        <Icon className={`${small ? "h-4 w-4" : "h-5 w-5"} text-white`} />
      </div>
      <h3 className={`${small ? "text-sm" : "text-sm"} font-semibold mb-0.5`}>
        {tool.title}
      </h3>
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
