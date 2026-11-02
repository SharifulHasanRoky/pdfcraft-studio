"use client";

import { create } from "zustand";
import type {
  ToolType,
  Annotation,
  PdfDocument,
  PdfPageData,
} from "./pdf-types";

interface PdfEditorState {
  // Document
  document: PdfDocument | null;
  isLoading: boolean;
  loadError: string | null;

  // Pages
  pages: PdfPageData[];
  currentPageIndex: number;

  // Tool state
  activeTool: ToolType;
  activeColor: string;
  activeStrokeWidth: number;
  activeFontSize: number;
  activeFontFamily: string;
  fillShape: boolean;

  // Annotations
  annotations: Annotation[];
  selectedAnnotationId: string | null;

  // UI
  zoom: number;
  showThumbnails: boolean;
  activeView: "editor" | "3d";
  theme: "light" | "dark";
  pendingImageSrc?: string;
  pendingSignatureSrc?: string;

  // Actions
  setDocument: (doc: PdfDocument | null) => void;
  setPages: (pages: PdfPageData[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadError: (error: string | null) => void;
  setCurrentPageIndex: (index: number) => void;
  setActiveTool: (tool: ToolType) => void;
  setActiveColor: (color: string) => void;
  setActiveStrokeWidth: (w: number) => void;
  setActiveFontSize: (s: number) => void;
  setActiveFontFamily: (f: string) => void;
  setFillShape: (f: boolean) => void;
  addAnnotation: (ann: Annotation) => void;
  updateAnnotation: (id: string, patch: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  setZoom: (z: number) => void;
  setShowThumbnails: (show: boolean) => void;
  setActiveView: (view: "editor" | "3d") => void;
  toggleTheme: () => void;
  setPendingImageSrc: (src?: string) => void;
  setPendingSignatureSrc: (src?: string) => void;
  deletePage: (id: string) => void;
  rotatePage: (id: string, direction: 1 | -1) => void;
  movePage: (id: string, direction: -1 | 1) => void;
  reset: () => void;
}

const DEFAULT_COLOR = "#EF4444";
const DEFAULT_STROKE = 3;
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_FONT_FAMILY = "Inter";

export const usePdfStore = create<PdfEditorState>((set, get) => ({
  document: null,
  isLoading: false,
  loadError: null,
  pages: [],
  currentPageIndex: 0,
  activeTool: "select",
  activeColor: DEFAULT_COLOR,
  activeStrokeWidth: DEFAULT_STROKE,
  activeFontSize: DEFAULT_FONT_SIZE,
  activeFontFamily: DEFAULT_FONT_FAMILY,
  fillShape: false,
  annotations: [],
  selectedAnnotationId: null,
  zoom: 1,
  showThumbnails: true,
  activeView: "editor",
  theme: "light",

  setDocument: (doc) => set({ document: doc }),
  setPages: (pages) => set({ pages }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoadError: (loadError) => set({ loadError }),
  setCurrentPageIndex: (currentPageIndex) => set({ currentPageIndex }),
  setActiveTool: (activeTool) =>
    set({ activeTool, selectedAnnotationId: activeTool === "select" ? get().selectedAnnotationId : null }),
  setActiveColor: (activeColor) => set({ activeColor }),
  setActiveStrokeWidth: (activeStrokeWidth) => set({ activeStrokeWidth }),
  setActiveFontSize: (activeFontSize) => set({ activeFontSize }),
  setActiveFontFamily: (activeFontFamily) => set({ activeFontFamily }),
  setFillShape: (fillShape) => set({ fillShape }),
  addAnnotation: (ann) => set({ annotations: [...get().annotations, ann] }),
  updateAnnotation: (id, patch) =>
    set({
      annotations: get().annotations.map((a) =>
        a.id === id ? ({ ...a, ...patch } as Annotation) : a
      ),
    }),
  removeAnnotation: (id) =>
    set({
      annotations: get().annotations.filter((a) => a.id !== id),
      selectedAnnotationId:
        get().selectedAnnotationId === id ? null : get().selectedAnnotationId,
    }),
  selectAnnotation: (selectedAnnotationId) => set({ selectedAnnotationId }),
  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(3, zoom)) }),
  setShowThumbnails: (showThumbnails) => set({ showThumbnails }),
  setActiveView: (activeView) => set({ activeView }),
  toggleTheme: () =>
    set({ theme: get().theme === "light" ? "dark" : "light" }),
  setPendingImageSrc: (src?: string) => set({ pendingImageSrc: src }),
  setPendingSignatureSrc: (src?: string) => set({ pendingSignatureSrc: src }),
  deletePage: (id) => {
    const pages = get().pages.filter((p) => p.id !== id);
    const currentPageIndex = Math.min(get().currentPageIndex, pages.length - 1);
    set({ pages, currentPageIndex: Math.max(0, currentPageIndex) });
  },
  rotatePage: (id, direction) =>
    set({
      pages: get().pages.map((p) =>
        p.id === id
          ? { ...p, rotation: (p.rotation + direction * 90 + 360) % 360 }
          : p
      ),
    }),
  movePage: (id, direction) => {
    const pages = [...get().pages];
    const idx = pages.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= pages.length) return;
    [pages[idx], pages[newIdx]] = [pages[newIdx], pages[idx]];
    set({ pages });
  },
  reset: () =>
    set({
      document: null,
      pages: [],
      annotations: [],
      selectedAnnotationId: null,
      currentPageIndex: 0,
      isLoading: false,
      loadError: null,
      activeTool: "select",
      zoom: 1,
      activeView: "editor",
    }),
}));
