"use client";

import { ReactNode } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { ToolMeta } from "@/lib/tools-registry";

interface ToolLayoutProps {
  tool: ToolMeta;
  onBack: () => void;
  children: ReactNode;
}

export function ToolLayout({ tool, onBack, children }: ToolLayoutProps) {
  const Icon = tool.icon;
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Tool header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">All tools</span>
            <span className="sm:hidden">Back</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`h-7 w-7 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0`}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm truncate">{tool.title}</span>
            {tool.isBeta && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
                BETA
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Tool hero */}
      <section className="relative overflow-hidden border-b bg-hero-gradient">
        <div className="container relative mx-auto max-w-4xl px-4 sm:px-6 py-10 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center"
          >
            <div
              className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-5 shadow-lg`}
            >
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              {tool.title}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
              {tool.description}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <Sparkles className="h-3 w-3" />
                Free forever
              </span>
              <span className="px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400">
                No signup
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400">
                Browser-based
              </span>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-400">
                No watermark
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tool body */}
      <main className="container mx-auto max-w-4xl px-4 sm:px-6 py-8 md:py-10">
        {children}

        {/* How it works */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <ol className="space-y-3">
            {tool.howItWorks.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-rose-500 to-violet-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* About */}
        <section className="mt-10 p-6 rounded-2xl border bg-card">
          <h2 className="text-lg font-semibold mb-2">About {tool.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tool.longDescription}
          </p>
        </section>

        {/* FAQs */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Frequently asked questions</h2>
          <div className="space-y-3">
            {tool.faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-card/50 p-4"
              >
                <h3 className="font-medium text-sm mb-1.5">{faq.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related tools / ad slot */}
        <section className="mt-10 p-6 rounded-2xl border border-dashed border-border/60 bg-muted/20 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Advertisement
          </p>
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground/60">
            {/* AdSense ad unit placeholder — replace with real AdSense code when approved */}
            Ad slot
          </div>
        </section>
      </main>
    </div>
  );
}
