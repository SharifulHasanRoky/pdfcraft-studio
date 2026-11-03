"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePdfStore } from "@/lib/pdf-store";
import { renderPageToCanvas, extractTextItems } from "@/lib/pdf-utils";
import type { PdfTextItem } from "@/lib/pdf-utils";
import type {
  Annotation,
  TextAnnotation,
  TextReplaceAnnotation,
  ShapeAnnotation,
  HighlightAnnotation,
  DrawingAnnotation,
  ImageAnnotation,
} from "@/lib/pdf-types";
import { motion } from "framer-motion";
import { Trash2, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DragState {
  startX: number;
  startY: number;
  curX: number;
  curY: number;
}

export function CanvasEditor() {
  const {
    document: doc,
    pages,
    currentPageIndex,
    setCurrentPageIndex,
    activeTool,
    activeColor,
    activeStrokeWidth,
    activeFontSize,
    activeFontFamily,
    fillShape,
    annotations,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    selectedAnnotationId,
    selectAnnotation,
    zoom,
    setPendingImageSrc,
    setPendingSignatureSrc,
    pendingImageSrc,
    activeBold,
    activeItalic,
    activeUnderline,
  } = usePdfStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(false);
  // Drag state stored in a ref so event handlers always see the latest value
  // without depending on React re-render between pointer events.
  const dragRef = useRef<DragState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const drawingPointsRef = useRef<{ x: number; y: number }[] | null>(null);
  const [drawingPoints, setDrawingPoints] = useState<
    { x: number; y: number }[] | null
  >(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [pageRenderSize, setPageRenderSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });
  // Existing-PDF text items shown when "edit-text" tool is active
  const [textItems, setTextItems] = useState<PdfTextItem[]>([]);
  const [textItemsLoading, setTextItemsLoading] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  // The text item the user is currently editing (becomes a textarea)
  const [editingItem, setEditingItem] = useState<{
    index: number;
    text: string;
    fontSizePx: number;
  } | null>(null);

  const startDrag = (d: DragState | null) => {
    dragRef.current = d;
    setDrag(d);
  };
  const setDrawing = (d: { x: number; y: number }[] | null) => {
    drawingPointsRef.current = d;
    setDrawingPoints(d);
  };

  const page = pages[currentPageIndex];

  // Listen for "edit-text" events (from double-clicking a text annotation)
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      setEditingTextId(id);
      selectAnnotation(id);
    };
    window.addEventListener("edit-text", handler);
    return () => window.removeEventListener("edit-text", handler);
  }, [selectAnnotation]);

  // Listen for "place-signature" events
  useEffect(() => {
    const handler = (e: Event) => {
      const src = (e as CustomEvent<string>).detail;
      if (!page) return;
      const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const w = 0.2;
        const h = w / aspect;
        const ann: ImageAnnotation = {
          id,
          page: currentPageIndex,
          type: "signature",
          x: 0.5 - w / 2,
          y: 0.5 - h / 2,
          width: w,
          height: h,
          color: "#000000",
          rotation: 0,
          src,
        };
        addAnnotation(ann);
        selectAnnotation(id);
        setPendingSignatureSrc(undefined);
      };
      img.src = src;
    };
    window.addEventListener("place-signature", handler);
    return () => window.removeEventListener("place-signature", handler);
  }, [page, currentPageIndex, addAnnotation, selectAnnotation, setPendingSignatureSrc]);

  // Extract existing PDF text items when the "edit-text" tool is active
  useEffect(() => {
    if (!doc || !page) return;
    if (activeTool !== "edit-text") {
      setTextItems([]);
      return;
    }
    let cancelled = false;
    setTextItemsLoading(true);
    (async () => {
      try {
        const items = await extractTextItems(doc, currentPageIndex);
        if (!cancelled) {
          setTextItems(items);
        }
      } catch (e) {
        console.error("Failed to extract text items:", e);
      } finally {
        if (!cancelled) setTextItemsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, page, activeTool, currentPageIndex]);

  // Render the PDF page to canvas whenever page or zoom changes
  useEffect(() => {
    if (!doc || !page || !canvasRef.current) return;
    let cancelled = false;
    setRendering(true);
    (async () => {
      try {
        await renderPageToCanvas(
          doc,
          currentPageIndex,
          canvasRef.current!,
          1.5 * zoom,
          page.rotation
        );
        if (!cancelled && canvasRef.current) {
          setPageRenderSize({
            w: canvasRef.current.width,
            h: canvasRef.current.height,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, currentPageIndex, page?.rotation, zoom]);

  // Pointer handlers
  const getRelPos = useCallback((e: React.PointerEvent) => {
    const rect = overlayRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!page || !overlayRef.current) return;
    if (activeTool === "select") {
      // Clicking on empty area deselects
      if (e.target === overlayRef.current) selectAnnotation(null);
      return;
    }
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Synthetic events may not support pointer capture — that's fine, we
      // dispatch move/up events on the same target anyway.
    }
    const pos = getRelPos(e);

    if (activeTool === "eraser") {
      // Erase annotation under click
      const ann = findAnnotationAt(pos.x, pos.y);
      if (ann) removeAnnotation(ann.id);
      return;
    }

    if (activeTool === "draw") {
      setDrawing([{ x: pos.x, y: pos.y }]);
      return;
    }

    if (activeTool === "text") {
      const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const ann: TextAnnotation = {
        id,
        page: currentPageIndex,
        type: "text",
        x: pos.x,
        y: pos.y,
        width: 0.3,
        height: 0.05,
        color: activeColor,
        rotation: 0,
        text: "",
        fontSize: activeFontSize / 100,
        fontFamily: activeFontFamily,
        bold: activeBold,
        italic: activeItalic,
        underline: activeUnderline,
      };
      addAnnotation(ann);
      selectAnnotation(id);
      setEditingTextId(id);
      setActiveToolInternal("select");
      return;
    }

    if (activeTool === "image") {
      const pendingImage = pendingImageSrc;
      if (!pendingImage) {
        setActiveToolInternal("select");
        return;
      }
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const w = 0.25;
        const h = w / aspect;
        const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const ann: ImageAnnotation = {
          id,
          page: currentPageIndex,
          type: "image",
          x: pos.x - w / 2,
          y: pos.y - h / 2,
          width: w,
          height: h,
          color: "#000000",
          rotation: 0,
          src: pendingImage,
        };
        addAnnotation(ann);
        selectAnnotation(id);
        setPendingImageSrc(undefined);
        setActiveToolInternal("select");
      };
      img.src = pendingImage;
      return;
    }

    if (activeTool === "signature") {
      // Open signature pad — handled by EditorApp
      window.dispatchEvent(new CustomEvent("open-signature-pad"));
      return;
    }

    // Shapes & highlight — start drag
    startDrag({ startX: pos.x, startY: pos.y, curX: pos.x, curY: pos.y });
  };

  const setActiveToolInternal = (t: any) => usePdfStore.getState().setActiveTool(t);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!page) return;
    const pts = drawingPointsRef.current;
    if (pts) {
      const pos = getRelPos(e);
      const updated = [...pts, pos];
      setDrawing(updated);
      return;
    }
    const d = dragRef.current;
    if (d) {
      const pos = getRelPos(e);
      const updated = { ...d, curX: pos.x, curY: pos.y };
      dragRef.current = updated;
      setDrag(updated);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const pts = drawingPointsRef.current;
    if (pts && pts.length > 1) {
      const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const ann: DrawingAnnotation = {
        id,
        page: currentPageIndex,
        type: "drawing",
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        color: activeColor,
        rotation: 0,
        points: pts,
        strokeWidth: activeStrokeWidth / 200,
      };
      addAnnotation(ann);
      setDrawing(null);
      return;
    }
    const d = dragRef.current;
    if (d) {
      const x = Math.min(d.startX, d.curX);
      const y = Math.min(d.startY, d.curY);
      const w = Math.abs(d.curX - d.startX);
      const h = Math.abs(d.curY - d.startY);
      if (w < 0.005 || h < 0.005) {
        startDrag(null);
        return;
      }
      const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      let ann: Annotation | null = null;
      if (activeTool === "rectangle") {
        ann = {
          id,
          page: currentPageIndex,
          type: "rectangle",
          x,
          y,
          width: w,
          height: h,
          color: activeColor,
          rotation: 0,
          strokeWidth: activeStrokeWidth / 200,
          fill: fillShape,
          fillColor: activeColor,
          opacity: 1,
        } as ShapeAnnotation;
      } else if (activeTool === "circle") {
        ann = {
          id,
          page: currentPageIndex,
          type: "circle",
          x,
          y,
          width: w,
          height: h,
          color: activeColor,
          rotation: 0,
          strokeWidth: activeStrokeWidth / 200,
          fill: fillShape,
          fillColor: activeColor,
          opacity: 1,
        } as ShapeAnnotation;
      } else if (activeTool === "line") {
        ann = {
          id,
          page: currentPageIndex,
          type: "line",
          x: d.startX,
          y: d.startY,
          width: d.curX - d.startX,
          height: d.curY - d.startY,
          color: activeColor,
          rotation: 0,
          strokeWidth: activeStrokeWidth / 200,
          fill: false,
          fillColor: "#000000",
          opacity: 1,
        } as ShapeAnnotation;
      } else if (activeTool === "highlight") {
        ann = {
          id,
          page: currentPageIndex,
          type: "highlight",
          x,
          y,
          width: w,
          height: h,
          color: "#FBBF24",
          rotation: 0,
          opacity: 0.35,
        } as HighlightAnnotation;
      }
      if (ann) {
        addAnnotation(ann);
        selectAnnotation(id);
      }
      startDrag(null);
      setActiveToolInternal("select");
    }
  };

  // For eraser: find topmost annotation at point
  const findAnnotationAt = (x: number, y: number): Annotation | null => {
    const pageAnnotations = annotations.filter((a) => a.page === currentPageIndex);
    // Iterate in reverse to get topmost
    for (let i = pageAnnotations.length - 1; i >= 0; i--) {
      const a = pageAnnotations[i];
      if (a.type === "drawing") {
        const d = a as DrawingAnnotation;
        // Check if any point is near
        for (const p of d.points) {
          const dx = (p.x - x) * pageRenderSize.w;
          const dy = (p.y - y) * pageRenderSize.h;
          if (Math.sqrt(dx * dx + dy * dy) < 10) return a;
        }
      } else {
        if (x >= a.x && x <= a.x + a.width && y >= a.y && y <= a.y + a.height) {
          return a;
        }
      }
    }
    return null;
  };

  if (!doc || !page) return null;

  const pageAnnotations = annotations.filter((a) => a.page === currentPageIndex);

  return (
    <div className="flex-1 overflow-auto bg-muted/30 p-4 md:p-8 flex flex-col items-center">
      {/* Page navigation top */}
      <div className="sticky top-0 z-10 mb-4 flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-full border px-3 py-1.5 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPageIndex === 0}
          onClick={() => setCurrentPageIndex(currentPageIndex - 1)}
        >
          Prev
        </Button>
        <span className="text-xs tabular-nums">
          {currentPageIndex + 1} / {pages.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPageIndex >= pages.length - 1}
          onClick={() => setCurrentPageIndex(currentPageIndex + 1)}
        >
          Next
        </Button>
      </div>

      <div
        className="relative shadow-2xl"
        style={{
          width: pageRenderSize.w ? `${pageRenderSize.w}px` : "auto",
          height: pageRenderSize.h ? `${pageRenderSize.h}px` : "auto",
        }}
      >
        <canvas
          ref={canvasRef}
          className="block bg-white"
          style={{
            width: pageRenderSize.w ? `${pageRenderSize.w}px` : undefined,
            height: pageRenderSize.h ? `${pageRenderSize.h}px` : undefined,
          }}
        />
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Annotations overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0"
          style={{
            cursor:
              activeTool === "select"
                ? "default"
                : activeTool === "draw"
                ? "crosshair"
                : activeTool === "eraser"
                ? "cell"
                : "crosshair",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Render existing annotations */}
          {pageAnnotations.map((ann) => (
            <AnnotationView
              key={ann.id}
              annotation={ann}
              isSelected={selectedAnnotationId === ann.id}
              editing={editingTextId === ann.id}
              onSelect={() => selectAnnotation(ann.id)}
              onMove={(dx, dy) => {
                const rect = overlayRef.current!.getBoundingClientRect();
                updateAnnotation(ann.id, {
                  x: Math.max(0, Math.min(1, ann.x + dx / rect.width)),
                  y: Math.max(0, Math.min(1, ann.y + dy / rect.height)),
                });
              }}
              onResize={(dw, dh) => {
                const rect = overlayRef.current!.getBoundingClientRect();
                updateAnnotation(ann.id, {
                  width: Math.max(0.01, ann.width + dw / rect.width),
                  height: Math.max(0.01, ann.height + dh / rect.height),
                });
              }}
              onTextChange={(text) => updateAnnotation(ann.id, { text })}
              onFinishEditing={() => setEditingTextId(null)}
              onDelete={() => removeAnnotation(ann.id)}
            />
          ))}

          {/* Live drag preview */}
          {drag && (
            <DragPreview
              tool={activeTool}
              drag={drag}
              color={activeColor}
              fill={fillShape}
            />
          )}

          {/* Existing PDF text items (edit-text mode) */}
          {activeTool === "edit-text" &&
            textItems.map((item, idx) => {
              const isEditing = editingItem?.index === idx;
              const isHovered = hoveredItem === idx;
              return (
                <div
                  key={`ti-${idx}`}
                  onPointerEnter={() => setHoveredItem(idx)}
                  onPointerLeave={() =>
                    setHoveredItem((cur) => (cur === idx ? null : cur))
                  }
                  onPointerDown={(e) => {
                    if (isEditing) return;
                    e.stopPropagation();
                    setEditingItem({
                      index: idx,
                      text: item.text,
                      fontSizePx: item.fontSizePx,
                    });
                  }}
                  className="absolute transition-colors"
                  style={{
                    left: `${item.x * 100}%`,
                    top: `${item.y * 100}%`,
                    width: `${item.width * 100}%`,
                    minHeight: `${item.height * 100}%`,
                    cursor: isEditing ? "text" : "pointer",
                    backgroundColor: isEditing
                      ? "rgba(255,255,255,0.95)"
                      : isHovered
                      ? "rgba(99, 102, 241, 0.15)"
                      : "rgba(99, 102, 241, 0.05)",
                    border: `1px dashed ${
                      isEditing
                        ? "#6366f1"
                        : isHovered
                        ? "#6366f1"
                        : "rgba(99, 102, 241, 0.4)"
                    }`,
                    zIndex: isEditing || isHovered ? 5 : 2,
                  }}
                >
                  {isEditing ? (
                    <EditTextItem
                      item={item}
                      initialText={editingItem!.text}
                      fontSizePx={editingItem!.fontSizePx}
                      onSave={(newText) => {
                        const id = `ann-${Date.now()}-${Math.random()
                          .toString(36)
                          .slice(2, 7)}`;
                        const ann: TextReplaceAnnotation = {
                          id,
                          page: currentPageIndex,
                          type: "text-replace",
                          x: item.x,
                          y: item.y,
                          width: Math.max(item.width, 0.05),
                          height: item.height,
                          color: activeColor,
                          rotation: 0,
                          text: newText,
                          // Use the toolbar font size if user changed it; otherwise
                          // preserve the original font size from the PDF.
                          fontSize:
                            activeFontSize !== 16
                              ? activeFontSize / 100
                              : item.fontSizeRel,
                          fontFamily: activeFontFamily,
                          bold: activeBold,
                          italic: activeItalic,
                          underline: activeUnderline,
                          originalText: item.text,
                          coverColor: "#FFFFFF",
                        };
                        addAnnotation(ann);
                        selectAnnotation(id);
                        setEditingItem(null);
                        // Remove this text item from the list so it doesn't show as
                        // still-editable; the new TextReplaceAnnotation is on top.
                        setTextItems((prev) => prev.filter((_, i) => i !== idx));
                      }}
                      onCancel={() => setEditingItem(null)}
                    />
                  ) : (
                    <span
                      className="block whitespace-pre"
                      style={{
                        fontSize: `${item.fontSizePx}px`,
                        lineHeight: 1.2,
                        color: "transparent",
                      }}
                    >
                      {item.text}
                    </span>
                  )}
                </div>
              );
            })}

          {/* Edit-text mode loading indicator */}
          {activeTool === "edit-text" && textItemsLoading && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border text-xs text-muted-foreground flex items-center gap-2 shadow">
              <Loader2 className="h-3 w-3 animate-spin" />
              Scanning page for text…
            </div>
          )}

          {/* Edit-text mode empty hint */}
          {activeTool === "edit-text" &&
            !textItemsLoading &&
            textItems.length === 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-3 rounded-xl bg-card/90 backdrop-blur-sm border text-center text-sm text-muted-foreground shadow max-w-xs">
                No selectable text found on this page.
                <br />
                <span className="text-xs">
                  (Scanned PDFs without a text layer can't be edited this way —
                  use the Text tool instead.)
                </span>
              </div>
            )}

          {/* Live drawing preview */}
          {drawingPoints && drawingPoints.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <polyline
                points={drawingPoints
                  .map((p) => `${p.x * 100}%,${p.y * 100}%`)
                  .join(" ")}
                fill="none"
                stroke={activeColor}
                strokeWidth={activeStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

interface DragPreviewProps {
  tool: string;
  drag: DragState;
  color: string;
  fill: boolean;
}

function DragPreview({ tool, drag, color, fill }: DragPreviewProps) {
  const x = Math.min(drag.startX, drag.curX);
  const y = Math.min(drag.startY, drag.curY);
  const w = Math.abs(drag.curX - drag.startX);
  const h = Math.abs(drag.curY - drag.startY);
  const style: React.CSSProperties = {
    position: "absolute",
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    width: `${w * 100}%`,
    height: `${h * 100}%`,
    pointerEvents: "none",
  };
  if (tool === "rectangle") {
    return (
      <div
        style={{
          ...style,
          border: `${drag.curX ? 2 : 0}px solid ${color}`,
          backgroundColor: fill ? color + "40" : "transparent",
        }}
      />
    );
  }
  if (tool === "circle") {
    return (
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ overflow: "visible" }}
      >
        <ellipse
          cx={`${(x + w / 2) * 100}%`}
          cy={`${(y + h / 2) * 100}%`}
          rx={`${(w / 2) * 100}%`}
          ry={`${(h / 2) * 100}%`}
          fill={fill ? color + "40" : "transparent"}
          stroke={color}
          strokeWidth={2}
        />
      </svg>
    );
  }
  if (tool === "highlight") {
    return (
      <div
        style={{
          ...style,
          backgroundColor: "#FBBF2440",
          border: "1px dashed #FBBF24",
        }}
      />
    );
  }
  if (tool === "line") {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <line
          x1={`${drag.startX * 100}%`}
          y1={`${drag.startY * 100}%`}
          x2={`${drag.curX * 100}%`}
          y2={`${drag.curY * 100}%`}
          stroke={color}
          strokeWidth={2}
        />
      </svg>
    );
  }
  return null;
}

interface AnnotationViewProps {
  annotation: Annotation;
  isSelected: boolean;
  editing: boolean;
  onSelect: () => void;
  onMove: (dx: number, dy: number) => void;
  onResize: (dw: number, dh: number) => void;
  onTextChange: (text: string) => void;
  onFinishEditing: () => void;
  onDelete: () => void;
}

function AnnotationView(props: AnnotationViewProps) {
  const { annotation: a, isSelected, editing, onSelect } = props;
  const dragData = useRef<{ startX: number; startY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (usePdfStore.getState().activeTool !== "select") return;
    e.stopPropagation();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragData.current = { startX: e.clientX, startY: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragData.current) return;
    const dx = e.clientX - dragData.current.startX;
    const dy = e.clientY - dragData.current.startY;
    dragData.current = { startX: e.clientX, startY: e.clientY };
    props.onMove(dx, dy);
  };

  const handlePointerUp = () => {
    dragData.current = null;
  };

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: `${a.x * 100}%`,
    top: `${a.y * 100}%`,
    width: `${a.width * 100}%`,
    height: `${a.height * 100}%`,
  };

  let content: React.ReactNode = null;

  if (a.type === "text" || a.type === "text-replace") {
    const t = a as TextAnnotation | TextReplaceAnnotation;
    content = editing ? (
      <textarea
        autoFocus
        placeholder="Type text here…"
        value={t.text}
        onChange={(e) => props.onTextChange(e.target.value)}
        onBlur={props.onFinishEditing}
        onKeyDown={(e) => {
          if (e.key === "Escape") props.onFinishEditing();
        }}
        className="w-full h-full bg-transparent outline-none resize-none p-0 m-0 border-0"
        style={{
          fontSize: `${t.fontSize * 100 * 16}px`,
          color: t.color,
          fontFamily: t.fontFamily,
          fontWeight: t.bold ? "bold" : "normal",
          fontStyle: t.italic ? "italic" : "normal",
          textDecoration: t.underline ? "underline" : "none",
          lineHeight: 1.2,
        }}
      />
    ) : (
      <div
        onDoubleClick={() => {
          // start editing handled by parent via onSelect then a state setter
          // We dispatch event to parent
          window.dispatchEvent(new CustomEvent("edit-text", { detail: t.id }));
        }}
        className="whitespace-pre-wrap break-words w-full h-full"
        style={{
          fontSize: `${t.fontSize * 100 * 16}px`,
          color: t.color,
          fontFamily: t.fontFamily,
          fontWeight: t.bold ? "bold" : "normal",
          fontStyle: t.italic ? "italic" : "normal",
          textDecoration: t.underline ? "underline" : "none",
          lineHeight: 1.2,
          cursor: "move",
          backgroundColor:
            a.type === "text-replace"
              ? (a as TextReplaceAnnotation).coverColor
              : undefined,
        }}
      >
        {t.text || <span style={{ opacity: 0.4 }}>Double-click to edit</span>}
      </div>
    );
  } else if (a.type === "rectangle") {
    const s = a as ShapeAnnotation;
    content = (
      <div
        className="w-full h-full"
        style={{
          border: `${s.strokeWidth * 100 * 2}px solid ${s.color}`,
          backgroundColor: s.fill ? s.fillColor + "60" : "transparent",
          opacity: s.opacity,
        }}
      />
    );
  } else if (a.type === "circle") {
    const s = a as ShapeAnnotation;
    content = (
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <ellipse
          cx={50}
          cy={50}
          rx={50 - s.strokeWidth * 100 * 2}
          ry={50 - s.strokeWidth * 100 * 2}
          fill={s.fill ? s.fillColor + "60" : "transparent"}
          stroke={s.color}
          strokeWidth={s.strokeWidth * 100 * 2}
          opacity={s.opacity}
        />
      </svg>
    );
  } else if (a.type === "line") {
    const s = a as ShapeAnnotation;
    content = (
      <svg className="w-full h-full" preserveAspectRatio="none">
        <line
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
          stroke={s.color}
          strokeWidth={s.strokeWidth * 100 * 2}
          opacity={s.opacity}
        />
      </svg>
    );
  } else if (a.type === "highlight") {
    const h = a as HighlightAnnotation;
    content = (
      <div
        className="w-full h-full"
        style={{ backgroundColor: h.color, opacity: h.opacity }}
      />
    );
  } else if (a.type === "drawing") {
    const d = a as DrawingAnnotation;
    content = (
      <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
        <polyline
          points={d.points
            .map((p) => `${(p.x - a.x) * 100}%,${(p.y - a.y) * 100}%`)
            .join(" ")}
          fill="none"
          stroke={d.color}
          strokeWidth={d.strokeWidth * 100 * 4}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  } else if (a.type === "image" || a.type === "signature") {
    const img = a as ImageAnnotation;
    content = (
      <img
        src={img.src}
        alt={a.type}
        className="w-full h-full object-contain"
        draggable={false}
      />
    );
  }

  // For drawing we need to use absolute coordinates (already in percentage)
  // but they aren't tied to width/height (we set width:0,height:0)
  if (a.type === "drawing") {
    const d = a as DrawingAnnotation;
    const xs = d.points.map((p) => p.x);
    const ys = d.points.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const w = maxX - minX;
    const h = maxY - minY;
    return (
      <div
        style={{
          position: "absolute",
          left: `${minX * 100}%`,
          top: `${minY * 100}%`,
          width: `${w * 100}%`,
          height: `${h * 100}%`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {content}
        {isSelected && (
          <SelectionBox
            onDelete={props.onDelete}
            onResize={(dw, dh) => {
              // drawing resize not supported — keep simple
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      style={baseStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={isSelected ? "outline-2 outline-dashed outline-primary" : ""}
    >
      {content}
      {isSelected && (
        <SelectionBox onDelete={props.onDelete} onResize={props.onResize} />
      )}
    </div>
  );
}

// Inline editor for an existing PDF text item.
// Shows a textarea with the original text, plus save/cancel buttons.
interface EditTextItemProps {
  item: PdfTextItem;
  initialText: string;
  fontSizePx: number;
  onSave: (newText: string) => void;
  onCancel: () => void;
}

function EditTextItem({
  item,
  initialText,
  fontSizePx,
  onSave,
  onCancel,
}: EditTextItemProps) {
  const [text, setText] = useState(initialText);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
    taRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSave(text);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Save on blur if text changed; otherwise cancel
          if (text !== initialText) onSave(text);
          else onCancel();
        }}
        className="w-full flex-1 bg-white text-black outline-none resize-none p-0 m-0 border-0"
        style={{
          fontSize: `${fontSizePx}px`,
          lineHeight: 1.2,
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      />
      <div className="flex items-center justify-end gap-1 mt-1 px-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          className="h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center hover:bg-destructive/90"
          title="Cancel (Esc)"
        >
          <X className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSave(text);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
          title="Save (Ctrl+Enter)"
        >
          <Check className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

interface SelectionBoxProps {
  onDelete: () => void;
  onResize: (dw: number, dh: number) => void;
}

function SelectionBox({ onDelete, onResize }: SelectionBoxProps) {
  const resizeData = useRef<{ startX: number; startY: number } | null>(null);
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    resizeData.current = { startX: e.clientX, startY: e.clientY };
  };
  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!resizeData.current) return;
    const dw = e.clientX - resizeData.current.startX;
    const dh = e.clientY - resizeData.current.startY;
    resizeData.current = { startX: e.clientX, startY: e.clientY };
    onResize(dw, dh);
  };
  const handleResizePointerUp = () => {
    resizeData.current = null;
  };
  return (
    <>
      <div className="absolute -inset-1 border-2 border-primary border-dashed rounded-sm pointer-events-none" />
      {/* Resize handles */}
      {["nw", "ne", "sw", "se"].map((corner) => {
        const positions: Record<string, string> = {
          nw: "-top-1 -left-1 cursor-nwse-resize",
          ne: "-top-1 -right-1 cursor-nesw-resize",
          sw: "-bottom-1 -left-1 cursor-nesw-resize",
          se: "-bottom-1 -right-1 cursor-nwse-resize",
        };
        return (
          <div
            key={corner}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            className={`absolute h-2.5 w-2.5 bg-primary rounded-full border-2 border-white ${positions[corner]}`}
          />
        );
      })}
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -top-7 -right-1 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 shadow"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </>
  );
}
