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
  Lock,
  Zap,
  Globe,
  Star,
  ArrowRight,
  Layers,
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

const FEATURES = [
  {
    icon: Lock,
    title: "Private by design",
    desc: "Every tool runs in your browser. Your PDFs never touch a server — perfect for contracts, IDs, and sensitive docs.",
  },
  {
    icon: Zap,
    title: "Instant results",
    desc: "No upload wait, no processing queue. Your PDF is ready the moment you click. Powered by WebAssembly-grade libraries.",
  },
  {
    icon: Globe,
    title: "Works everywhere",
    desc: "Desktop, tablet, phone — same premium experience. Touch-friendly controls. No app to install.",
  },
  {
    icon: Shield,
    title: "No daily limits",
    desc: "Use any tool as many times as you want. No quotas, no 'come back tomorrow', no premium upsells. Ever.",
  },
  {
    icon: Heart,
    title: "Free forever",
    desc: "Every tool, every feature, every day. Funded by unobtrusive ads, never by you or your data.",
  },
  {
    icon: Star,
    title: "Trusted worldwide",
    desc: "50,000+ users from 90+ countries process their PDFs with PDFCraft Studio every month.",
  },
];

const STEPS = [
  { num: "01", title: "Pick a tool", desc: "Choose from 14 PDF tools, or drag a PDF anywhere to open the visual editor." },
  { num: "02", title: "Process your PDF", desc: "Your file is processed entirely in your browser. No uploads, no waiting, no tracking." },
  { num: "03", title: "Download instantly", desc: "Get your result immediately. No watermark, no signup, no email required." },
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
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/50">
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
            <span className="font-bold text-sm tracking-tight">PDFCraft Studio</span>
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm">
            <a href="#tools" className="text-muted-foreground hover:text-foreground transition-colors">Tools</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
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
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-8 font-semibold"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit a PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-noise relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 md:py-32 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass text-xs font-medium mb-8"
          >
            <Sparkles className="h-3 w-3" />
            Free forever • No daily limits • Browser-based
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Every PDF tool.
            <br />
            <span className="italic">Free. Forever.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {TOOLS.length} tools to merge, split, compress, convert and edit your PDFs.
            No signup. No watermark. Better than iLovePDF, Sejda and Smallpdf.
          </motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="relative max-w-xl mx-auto mb-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tools — merge, compress, convert…"
                className="w-full h-12 pl-12 pr-10 rounded-xl glass border-0 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-ring transition-all"
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
                  className="absolute top-full mt-2 left-0 right-0 rounded-xl border border-border bg-popover shadow-xl overflow-hidden z-10 text-left"
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

          {/* Upload */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isLoading && document.getElementById("hero-upload-input")?.click()}
            className={`relative cursor-pointer rounded-xl glass border-2 border-dashed transition-all p-5 max-w-xl mx-auto ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/60"
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

          {/* Trust line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-12 flex items-center justify-center gap-6 text-sm"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-foreground">4.9</span>
              <span>· 1,200 reviews</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">50K+</span> users
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              Browser-only
            </span>
          </motion.div>
        </div>
      </section>

      {/* TOOLS SLIDER */}
      <section id="tools" className="py-16 md:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              Explore tools
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
              {TOOLS.length} tools at your fingertips
            </h2>
            <p className="text-sm text-muted-foreground">
              Hover to pause, click to use any tool.
            </p>
          </div>

          {recentTools.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-semibold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                Recently used
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {recentTools.map((tool) => (
                  <ToolCard key={`recent-${tool.id}`} tool={tool} onClick={() => handleToolClick(tool.slug)} small />
                ))}
              </div>
            </div>
          )}

          {/* Infinite slider with 2 rows */}
          <ToolsSlider tools={TOOLS} onToolClick={handleToolClick} />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 md:py-24 bg-secondary/5 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              Why PDFCraft
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Built different. Built better.
            </h2>
            <p className="text-sm text-muted-foreground">
              Most &quot;free&quot; PDF tools watermark your file, limit your usage, or upload your data
              to their servers. We don&apos;t.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="group rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-lg transition-all"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              How it works
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Three steps. No accounts.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="relative"
              >
                <div className="font-display text-5xl font-bold text-primary/20 mb-3">{step.num}</div>
                <h3 className="font-semibold text-lg mb-1.5">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button
              size="lg"
              onClick={() => document.getElementById("hero-upload-input")?.click()}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 font-semibold"
            >
              <Upload className="h-4 w-4" />
              Open a PDF — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section id="compare" className="py-16 md:py-20 bg-secondary/5 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              Why switch
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Better than the rest.{" "}
              <span className="italic">No daily limits.</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              How PDFCraft Studio compares to iLovePDF, Sejda and Smallpdf.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="grid grid-cols-5 bg-muted/40 border-b border-border">
              <div className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Feature</div>
              <div className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-muted-foreground">iLovePDF</div>
              <div className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-muted-foreground">Sejda</div>
              <div className="p-3 sm:p-4 text-center text-xs sm:text-sm font-medium text-muted-foreground">Smallpdf</div>
              <div className="p-3 sm:p-4 text-center text-xs sm:text-sm font-bold text-primary bg-primary/5">PDFCraft</div>
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-5 border-b border-border/40 last:border-0 hover:bg-accent/20 transition-colors"
              >
                <div className="p-3 sm:p-4 text-xs sm:text-sm font-medium">{row.feature}</div>
                <div className="p-3 sm:p-4 text-center text-[10px] sm:text-xs text-muted-foreground">{row.ilovepdf}</div>
                <div className="p-3 sm:p-4 text-center text-[10px] sm:text-xs text-muted-foreground">{row.sejda}</div>
                <div className="p-3 sm:p-4 text-center text-[10px] sm:text-xs text-muted-foreground">{row.smallpdf}</div>
                <div className="p-3 sm:p-4 text-center text-[10px] sm:text-xs font-semibold text-primary bg-primary/5 flex items-center justify-center gap-0.5">
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
      <section id="faq" className="py-16 md:py-20 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              Questions
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Frequently asked
            </h2>
          </div>
          <div className="space-y-2">
            {[
              { q: "Is PDFCraft Studio really free?", a: "Yes. Every tool is 100% free. No sign-up, no watermark, no daily limit. Funded by ads, never by you." },
              { q: "Are my PDFs uploaded to a server?", a: "No. All processing happens in your browser using JavaScript. Your PDFs never leave your device." },
              { q: "Is there a daily usage limit?", a: "No. Use any tool as many times as you want, every day. No quotas, no 'come back tomorrow' messages." },
              { q: "Can I edit existing text inside a PDF?", a: "Yes. Click 'Edit a PDF' at the top. The visual editor lets you click any text and edit it inline." },
              { q: "Does it work on mobile?", a: "Yes. PDFCraft Studio is fully responsive — works on iOS, Android, tablets and desktops." },
            ].map((faq, i) => (
              <details key={i} className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
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
      <section className="py-16 md:py-24 bg-secondary text-secondary-foreground">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Layers className="h-10 w-10 mx-auto mb-4 text-primary" />
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Ready to edit your PDF?
          </h2>
          <p className="text-base opacity-80 mb-8">
            No sign-up. No watermark. No upload. Just open and edit.
          </p>
          <Button
            size="lg"
            onClick={() => document.getElementById("hero-upload-input")?.click()}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 font-semibold"
          >
            <Upload className="h-4 w-4" />
            Open a PDF — it&apos;s free
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-card py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3">
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
              Made with <Heart className="h-3 w-3 text-primary fill-primary" /> for everyone, everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============== TOOL CARD — clean, premium ============== */

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
      className="group relative w-full overflow-hidden rounded-xl border border-border bg-card p-4 text-left hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all"
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

/* ============== TOOLS SLIDER — infinite scroll, 2 rows ============== */

interface ToolsSliderProps {
  tools: ToolMeta[];
  onToolClick: (slug: string) => void;
}

function ToolsSlider({ tools, onToolClick }: ToolsSliderProps) {
  const row1 = tools.filter((_, i) => i % 2 === 0);
  const row2 = tools.filter((_, i) => i % 2 === 1);
  const row1Loop = [...row1, ...row1];
  const row2Loop = [...row2, ...row2];

  return (
    <div className="scroll-pause relative mb-14 -mx-4 sm:-mx-6">
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

      <div className="flex gap-3 mb-3 px-4 sm:px-6 overflow-hidden">
        <div className="flex gap-3 scroll-left" style={{ width: "max-content" }}>
          {row1Loop.map((tool, i) => (
            <SliderCard
              key={`r1-${tool.id}-${i}`}
              tool={tool}
              onClick={() => onToolClick(tool.slug)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 px-4 sm:px-6 overflow-hidden">
        <div className="flex gap-3 scroll-right" style={{ width: "max-content" }}>
          {row2Loop.map((tool, i) => (
            <SliderCard
              key={`r2-${tool.id}-${i}`}
              tool={tool}
              onClick={() => onToolClick(tool.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SliderCard({ tool, onClick }: { tool: ToolMeta; onClick: () => void }) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onClick}
      className="group relative shrink-0 w-44 sm:w-48 rounded-xl border border-border bg-card p-4 text-left hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <div
        className="h-10 w-10 rounded-lg flex items-center justify-center mb-2.5"
        style={{ backgroundColor: tool.color }}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="text-sm font-semibold mb-0.5 truncate">{tool.title}</h3>
      <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
        {tool.description}
      </p>
      {tool.isBeta && (
        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
          BETA
        </span>
      )}
    </button>
  );
}
