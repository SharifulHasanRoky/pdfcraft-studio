"use client";

import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import type { ToolMeta } from "@/lib/tools-registry";

interface ToolLayoutProps {
  tool: ToolMeta;
  onBack: () => void;
  children: ReactNode;
}

/**
 * Compact, premium tool layout.
 * - Slim sticky breadcrumb header (no big hero — saves vertical space)
 * - Tool content gets all the focus
 * - FAQs + how-it-works sit in a single compact panel BELOW the tool,
 *   so they don't dominate the first screen
 */
export function ToolLayout({ tool, onBack, children }: ToolLayoutProps) {
  const Icon = tool.icon;
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Slim sticky header with breadcrumb */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">All tools</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`h-6 w-6 rounded-md bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0`}
            >
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
            <h1 className="font-semibold text-sm truncate">{tool.title}</h1>
            {tool.isBeta && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
                BETA
              </span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Browser-based
          </div>
        </div>
      </header>

      {/* Tool content — gets the focus */}
      <main className="container mx-auto max-w-3xl px-4 sm:px-6 py-8 md:py-12">
        {/* Compact title block — no big hero */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-3">
            <div
              className={`h-12 w-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 shadow-sm`}
            >
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight leading-tight">
                {tool.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-snug">
                {tool.description}
              </p>
            </div>
          </div>
        </div>

        {/* The actual tool UI */}
        {children}

        {/* Compact info panel — how it works + FAQ combined into a tidy card */}
        <section className="mt-12 grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/60 bg-card/50 p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="h-5 w-5 rounded bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                1
              </span>
              How it works
            </h3>
            <ol className="space-y-2">
              {tool.howItWorks.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="text-xs font-semibold text-muted-foreground/70 mt-0.5 shrink-0">
                    {i + 1}.
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/50 p-5">
            <h3 className="text-sm font-semibold mb-3">FAQ</h3>
            <div className="space-y-3">
              {tool.faqs.slice(0, 3).map((faq, i) => (
                <div key={i}>
                  <p className="text-xs font-medium mb-0.5">{faq.q}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ad slot — clearly labeled, single placement */}
        <section className="mt-6 p-4 rounded-xl border border-dashed border-border/40 bg-muted/20 text-center">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">
            Advertisement
          </p>
          <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/40">
            Ad slot
          </div>
        </section>
      </main>
    </div>
  );
}
