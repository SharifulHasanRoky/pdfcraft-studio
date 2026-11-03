"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePdfStore } from "@/lib/pdf-store";
import { renderPageToCanvas } from "@/lib/pdf-utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
} from "lucide-react";

export function Immersive3DView() {
  const { document: doc, pages, currentPageIndex, setCurrentPageIndex } =
    usePdfStore();
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Render all pages to data URLs
  useEffect(() => {
    if (!doc || pages.length === 0) return;
    let cancelled = false;
    (async () => {
      const images: string[] = [];
      for (let i = 0; i < pages.length; i++) {
        if (cancelled) return;
        const tempCanvas = document.createElement("canvas");
        try {
          await renderPageToCanvas(doc, i, tempCanvas, 1.2, pages[i].rotation);
          images.push(tempCanvas.toDataURL("image/jpeg", 0.85));
          if (!cancelled) setPageImages([...images]);
        } catch (e) {
          console.error(e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, pages]);

  const goToNext = useCallback(() => {
    if (currentPageIndex < pages.length - 1) {
      setFlipDirection("next");
      setTimeout(() => {
        setCurrentPageIndex(currentPageIndex + 1);
        setFlipDirection(null);
      }, 600);
    }
  }, [currentPageIndex, pages.length, setCurrentPageIndex]);

  const goToPrev = useCallback(() => {
    if (currentPageIndex > 0) {
      setFlipDirection("prev");
      setTimeout(() => {
        setCurrentPageIndex(currentPageIndex - 1);
        setFlipDirection(null);
      }, 600);
    }
  }, [currentPageIndex, setCurrentPageIndex]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNext();
      else if (e.key === "ArrowLeft") goToPrev();
      else if (e.key === "f") toggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToNext, goToPrev, toggleFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (!doc) return null;

  const currentImage = pageImages[currentPageIndex];
  const nextImage = pageImages[currentPageIndex + 1];
  const prevImage = pageImages[currentPageIndex - 1];

  // For "book" mode, show current page (right side) + next page (left side, mirrored)
  const showSpread = pages.length > 1;

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black"
      style={{ perspective: "2000px" }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">3D Immersive View</span>
        <span className="text-xs text-white/60 tabular-nums ml-2">
          {currentPageIndex + 1} / {pages.length}
        </span>
      </div>

      {/* Fullscreen toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-20 text-white hover:bg-white/10"
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>

      {/* Book stage */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(8deg) rotateY(-3deg)",
          }}
        >
          {/* Book "spine" shadow */}
          {showSpread && (
            <div
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/50 via-black/30 to-black/50 z-10"
              style={{ filter: "blur(8px)" }}
            />
          )}

          {/* Page */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentPageIndex}
              initial={{
                rotateY:
                  flipDirection === "next" ? -90 : flipDirection === "prev" ? 90 : 0,
                opacity: 0,
              }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{
                rotateY:
                  flipDirection === "next" ? 90 : flipDirection === "prev" ? -90 : 0,
                opacity: 0,
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="relative flex items-stretch shadow-2xl"
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: "left center",
              }}
            >
              {currentImage ? (
                <div
                  className="relative bg-white"
                  style={{
                    width: "min(48vw, 600px)",
                    aspectRatio: `${pages[currentPageIndex].width} / ${pages[currentPageIndex].height}`,
                  }}
                >
                  <img
                    src={currentImage}
                    alt={`Page ${currentPageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {/* Page edge gradient */}
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/30 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 ring-1 ring-black/10 pointer-events-none" />
                </div>
              ) : (
                <div
                  className="bg-white flex items-center justify-center"
                  style={{ width: "min(48vw, 600px)", aspectRatio: "3/4" }}
                >
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Reflection */}
          {currentImage && (
            <div
              className="absolute left-0 right-0 -bottom-full opacity-30"
              style={{
                transform: "scaleY(-1)",
                maskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 60%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent 60%)",
              }}
            >
              <img
                src={currentImage}
                alt=""
                className="w-full h-full object-contain"
                style={{
                  width: "min(48vw, 600px)",
                  aspectRatio: `${pages[currentPageIndex].width} / ${pages[currentPageIndex].height}`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nav arrows */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrev}
          disabled={currentPageIndex === 0}
          className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 pointer-events-auto disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNext}
          disabled={currentPageIndex >= pages.length - 1}
          className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 pointer-events-auto disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs flex items-center gap-3">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px]">←</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px]">→</kbd>
          to navigate
        </span>
        <span>•</span>
        <span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px]">F</kbd>{" "}
          for fullscreen
        </span>
      </div>
    </div>
  );
}
