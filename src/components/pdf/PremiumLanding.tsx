"use client";

import { useCallback, useRef, useState } from "react";
import { usePdfStore } from "@/lib/pdf-store";
import { loadPdfFromFile } from "@/lib/pdf-utils";
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  X,
  Shield,
  Zap,
  Box,
  CheckCircle2,
  Type,
  Image as ImageIcon,
  Pen,
  Highlighter,
  Signature,
  Globe,
  Lock,
  Star,
  ArrowRight,
  ArrowDown,
  Moon,
  Sun,
  Clock,
  Users,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTheme } from "next-themes";

interface PremiumLandingProps {
  onOpenEditor: () => void;
}

export function PremiumLanding({ onOpenEditor }: PremiumLandingProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setDocument, setPages, setLoading, setLoadError } = usePdfStore();
  const { theme, setTheme } = useTheme();

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
          <a href="#" className="flex items-center gap-2 group">
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
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#why" className="text-muted-foreground hover:text-foreground transition-colors">Why us</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => inputRef.current?.click()}
              className="gap-1.5 bg-gradient-to-r from-rose-500 via-violet-600 to-amber-500 text-white hover:opacity-90 border-0"
            >
              <Upload className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Edit a PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero-gradient">
        {/* Animated mesh blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] h-72 w-72 rounded-full bg-rose-400/30 blur-3xl animate-mesh" />
          <div className="absolute top-[20%] right-[8%] h-96 w-96 rounded-full bg-violet-500/30 blur-3xl animate-mesh" style={{ animationDelay: "-6s" }} />
          <div className="absolute bottom-[5%] left-[30%] h-80 w-80 rounded-full bg-amber-400/25 blur-3xl animate-mesh" style={{ animationDelay: "-12s" }} />
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

        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Pill */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass shadow-sm mb-6"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium">
                Free forever • No sign-up • 100% private
              </span>
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
            >
              Edit <span className="text-gradient">any PDF</span> your way.
              <br className="hidden md:block" />
              <span className="text-muted-foreground">Quality, never lost.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Edit existing PDF text, images and shapes in place — add signatures,
              highlight, draw, then export with <strong className="text-foreground">lossless quality</strong>.
              Everything runs in your browser. Your files never leave your device.
            </motion.p>

            {/* Upload dropzone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isLoading && inputRef.current?.click()}
              className={`relative mx-auto max-w-xl cursor-pointer rounded-3xl border-2 border-dashed transition-all p-8 md:p-10 glass shadow-xl hover:shadow-2xl ${
                isDragging
                  ? "border-primary scale-[1.02] ring-4 ring-primary/20"
                  : "border-border/60 hover:border-primary/50"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-sm font-medium">Loading your PDF…</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-400 via-violet-500 to-amber-400 blur-2xl opacity-50 rounded-full" />
                      <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500 via-violet-600 to-amber-500 flex items-center justify-center shadow-lg">
                        <Upload className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">
                        Drop your PDF here
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        or <span className="text-primary font-medium">browse files</span> from your device
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        Any size
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5" />
                        100% private
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" />
                        Instant
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2 max-w-xl mx-auto"
              >
                <X className="h-4 w-4" />
                {error}
              </motion.div>
            )}

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-1">
                <div className="flex -space-x-1">
                  {[0,1,2,3,4].map(i => (
                    <div
                      key={i}
                      className="h-6 w-6 rounded-full border-2 border-background"
                      style={{
                        background: ["#FB7185", "#A855F7", "#FBBF24", "#0EA5E9", "#22C55E"][i],
                      }}
                    />
                  ))}
                </div>
                <span className="ml-2 font-medium">Loved by 50k+ users</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="ml-1 font-medium">4.9 / 5</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-medium">No data leaves your browser</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:block">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-muted-foreground/50"
          >
            <ArrowDown className="h-5 w-5" />
          </motion.div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section id="features" className="py-20 md:py-28 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              Everything you need
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              One toolkit for <span className="text-gradient">every PDF</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              From quick text fixes to complex multi-page edits — PDFCraft Studio
              does it all, free, right in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${f.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
                  <div className={`relative h-12 w-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-md`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              Three simple steps
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              From upload to <span className="text-gradient">done</span> in seconds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="relative"
                >
                  {/* Step number ring */}
                  <div className="relative mx-auto mb-6 h-20 w-20">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400 via-violet-500 to-amber-400 opacity-20 blur-md" />
                    <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-rose-500 via-violet-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
                      <Icon className="h-9 w-9" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-xs mx-auto leading-relaxed">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => inputRef.current?.click()}
              className="gap-2 bg-gradient-to-r from-rose-500 via-violet-600 to-amber-500 text-white hover:opacity-90 border-0 h-12 px-8"
            >
              <Upload className="h-4 w-4" />
              Start editing now — it&apos;s free
            </Button>
          </div>
        </div>
      </section>

      {/* WHY US — comparison */}
      <section id="why" className="py-20 md:py-28 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              Why PDFCraft Studio
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Premium features, <span className="text-gradient">zero cost</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Most &quot;free&quot; PDF editors watermark your file, charge for export,
              or upload your data to their servers. We don&apos;t.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <h3 className="font-semibold text-destructive mb-4 flex items-center gap-2">
                <X className="h-5 w-5" />
                Other &quot;free&quot; PDF editors
              </h3>
              <ul className="space-y-3">
                {[
                  "Watermark your exported PDF",
                  "Charge $10–30/month for export",
                  "Upload your PDFs to their servers",
                  "Force you to create an account",
                  "Limit files to 5–10 MB",
                  "Re-encode your PDF, losing quality",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm">
                    <X className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/5 to-amber-500/5 p-6 overflow-hidden">
              <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-rose-400 to-violet-500 opacity-20 blur-3xl" />
              <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                PDFCraft Studio
              </h3>
              <ul className="space-y-3">
                {[
                  "No watermark, ever",
                  "Free forever — no credit card needed",
                  "100% client-side — files never leave your browser",
                  "No sign-up, no email, just open and edit",
                  "Works with PDFs of any size",
                  "Lossless export — original bytes preserved",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="font-medium">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="py-12 bg-gradient-to-r from-rose-500 via-violet-600 to-amber-500 text-white">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Users, value: "50K+", label: "Happy users" },
              { icon: FileText, value: "1.2M+", label: "PDFs edited" },
              { icon: Clock, value: "0s", label: "Upload time" },
              { icon: Heart, value: "100%", label: "Free, always" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <Icon className="h-6 w-6 opacity-80 mb-1" />
                  <div className="text-3xl md:text-4xl font-bold tabular-nums">{s.value}</div>
                  <div className="text-xs md:text-sm opacity-80">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              Loved worldwide
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              What our users say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="flex gap-1 mb-3">
                  {[0,1,2,3,4].map(s => (
                    <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ background: t.color }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 bg-background">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
              Common questions
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Frequently asked
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border/60 rounded-xl px-5 bg-card/50 data-[state=open]:bg-card data-[state=open]:shadow-sm"
              >
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-hero-gradient">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[10%] h-72 w-72 rounded-full bg-rose-400/30 blur-3xl animate-mesh" />
          <div className="absolute bottom-[10%] right-[10%] h-80 w-80 rounded-full bg-violet-500/30 blur-3xl animate-mesh" style={{ animationDelay: "-8s" }} />
        </div>

        <div className="container relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Ready to edit your PDF?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            No sign-up. No watermark. No upload. Just open and edit.
          </p>
          <Button
            size="lg"
            onClick={() => inputRef.current?.click()}
            className="gap-2 bg-gradient-to-r from-rose-500 via-violet-600 to-amber-500 text-white hover:opacity-90 border-0 h-14 px-10 text-base"
          >
            <Upload className="h-5 w-5" />
            Open a PDF — it&apos;s free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />
            Your PDF stays on your device. Always.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-background py-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-400 via-violet-500 to-amber-400 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold">PDFCraft Studio</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Free, private, lossless PDF editing — right in your browser.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Edit PDF text</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Add signatures</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">3D immersive view</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Lossless export</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="#why" className="hover:text-foreground transition-colors">Why us</a></li>
                <li className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  Worldwide
                </li>
              </ul>
            </div>
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

const FEATURES = [
  {
    icon: Type,
    title: "Edit existing text",
    desc: "Click any text in your PDF and edit it inline. Change wording, fix typos, update dates — all in place.",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    icon: ImageIcon,
    title: "Add & place images",
    desc: "Drop in logos, photos, stamps. Resize and move anywhere on the page.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: Signature,
    title: "Sign documents",
    desc: "Draw your signature with the mouse, type it, or upload an image. Place it anywhere.",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    icon: Highlighter,
    title: "Highlight & annotate",
    desc: "Highlight passages, add sticky notes, draw freehand — just like a real pen.",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: Box,
    title: "3D immersive view",
    desc: "Read your PDF like a real book with smooth page-flip animations and fullscreen mode.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    icon: Shield,
    title: "Private by design",
    desc: "Your PDF never leaves your browser. Perfect for contracts, IDs and sensitive docs.",
    gradient: "from-rose-500 to-violet-600",
  },
];

const STEPS = [
  {
    icon: Upload,
    title: "Upload your PDF",
    desc: "Drag and drop, or click to browse. No size limit, no sign-up required.",
  },
  {
    icon: Pen,
    title: "Edit anything",
    desc: "Edit text, add shapes, signatures, images. Rotate, delete or reorder pages.",
  },
  {
    icon: Zap,
    title: "Export instantly",
    desc: "Click export. Your edited PDF downloads in seconds with original quality preserved.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I needed to fix a typo in a signed contract before sending it out. PDFCraft let me edit the text in 30 seconds, no watermark, free. Lifesaver.",
    name: "Sarah Chen",
    role: "Freelance designer, Singapore",
    color: "#FB7185",
  },
  {
    quote:
      "Tried 5 other 'free' PDF editors — all wanted money for export or left a watermark. This one just works. And it's actually free.",
    name: "Rahul Verma",
    role: "Student, India",
    color: "#A855F7",
  },
  {
    quote:
      "The 3D view alone is worth switching for. Reading long contracts in book mode is so much nicer. And privacy is a huge plus for me.",
    name: "Maria Rodriguez",
    role: "Lawyer, Spain",
    color: "#FBBF24",
  },
];

const FAQS = [
  {
    q: "Is PDFCraft Studio really free?",
    a: "Yes — 100% free with no sign-up, no watermark, and no credit card. Everything runs in your browser, so there's no server cost to pass on to you.",
  },
  {
    q: "Can I edit the existing text inside a PDF?",
    a: "Yes. Pick the 'Edit Existing Text' tool, click any text in the PDF, and edit it inline. On export, your new text replaces the original — the surrounding content stays untouched.",
  },
  {
    q: "Are my PDFs uploaded to a server?",
    a: "No. PDFCraft Studio runs entirely in your browser. Your PDFs never leave your device — perfect for sensitive documents like contracts, IDs, and medical records.",
  },
  {
    q: "Does export reduce quality?",
    a: "No. We overlay your edits on top of the original PDF bytes — the original content is never re-encoded. Text stays sharp, images stay crisp, file size stays small.",
  },
  {
    q: "Does it work on mobile?",
    a: "Yes. PDFCraft Studio is fully responsive and works on iOS, Android, tablets, and desktops. Touch-friendly controls included.",
  },
  {
    q: "Is there a file size limit?",
    a: "No hard limit. Very large PDFs (100+ MB) may take a few seconds to load and use more memory, but everything still works entirely on your device.",
  },
  {
    q: "Can I add my signature?",
    a: "Yes. Click the Signature tool — draw with your mouse/finger, type your name, or upload an image of your signature. Place it anywhere on the page.",
  },
  {
    q: "Does it work offline?",
    a: "Once the page is loaded, yes — all editing happens locally. You can disconnect from the internet mid-edit and everything still works.",
  },
];
