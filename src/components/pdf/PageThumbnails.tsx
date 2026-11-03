"use client";

import { useEffect, useState } from "react";
import { usePdfStore } from "@/lib/pdf-store";
import { renderPageThumbnail } from "@/lib/pdf-utils";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function PageThumbnails() {
  const {
    document: doc,
    pages,
    currentPageIndex,
    setCurrentPageIndex,
    deletePage,
    rotatePage,
    movePage,
    showThumbnails,
    annotations,
  } = usePdfStore();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  // Render thumbnails for all pages
  useEffect(() => {
    if (!doc || pages.length === 0) return;
    let cancelled = false;
    (async () => {
      const newThumbs: Record<string, string> = {};
      for (let i = 0; i < pages.length; i++) {
        if (cancelled) return;
        if (thumbnails[pages[i].id]) {
          newThumbs[pages[i].id] = thumbnails[pages[i].id];
          continue;
        }
        try {
          const thumb = await renderPageThumbnail(doc, i);
          newThumbs[pages[i].id] = thumb;
          if (!cancelled) setThumbnails((prev) => ({ ...prev, ...newThumbs }));
        } catch (e) {
          console.error(e);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // Re-render when number of pages changes (but skip thumbnail values themselves to avoid infinite loop)
  }, [doc, pages.length]);

  if (!showThumbnails) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-56 border-r bg-card/50 backdrop-blur-sm overflow-y-auto shrink-0 hidden md:block"
      >
        <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b px-3 py-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pages
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            {pages.length}
          </span>
        </div>
        <div className="p-2 space-y-2">
          {pages.map((p, idx) => {
            const isActive = idx === currentPageIndex;
            const annCount = annotations.filter((a) => a.page === idx).length;
            return (
              <div
                key={p.id}
                className={`group relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  isActive
                    ? "border-primary shadow-lg"
                    : "border-transparent hover:border-border"
                }`}
                onClick={() => setCurrentPageIndex(idx)}
              >
                <div className="aspect-[3/4] bg-white relative">
                  {thumbnails[p.id] ? (
                    <img
                      src={thumbnails[p.id]}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-contain"
                      style={{
                        transform: `rotate(${p.rotation}deg)`,
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    </div>
                  )}
                  <div className="absolute top-1 left-1 h-5 w-5 rounded bg-black/70 text-white text-[10px] font-semibold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  {annCount > 0 && (
                    <div className="absolute top-1 right-1 px-1.5 h-5 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center">
                      {annCount}
                    </div>
                  )}
                </div>
                {/* Hover actions */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      movePage(p.id, -1);
                    }}
                    disabled={idx === 0}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      rotatePage(p.id, -1);
                    }}
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      rotatePage(p.id, 1);
                    }}
                  >
                    <RotateCw className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-white hover:bg-white/20"
                        onClick={(e) => e.stopPropagation()}
                        disabled={pages.length <= 1}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete page {idx + 1}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the page from the exported PDF. You can refresh to undo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePage(p.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      movePage(p.id, 1);
                    }}
                    disabled={idx === pages.length - 1}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
