"use client";

import { usePdfStore } from "@/lib/pdf-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MousePointer2,
  Type,
  PencilLine,
  Square,
  Circle,
  Minus,
  Highlighter,
  Pen,
  Image as ImageIcon,
  Signature,
  Eraser,
  Download,
  Box,
  PanelLeft,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  FileText,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import { exportAnnotatedPdf } from "@/lib/pdf-utils";
import { useState, useRef } from "react";
import { toast } from "sonner";

const COLOR_PRESETS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#000000",
  "#FFFFFF",
];

export function Toolbar() {
  const {
    activeTool,
    setActiveTool,
    activeColor,
    setActiveColor,
    activeStrokeWidth,
    setActiveStrokeWidth,
    activeFontSize,
    setActiveFontSize,
    activeFontFamily,
    setActiveFontFamily,
    fillShape,
    setFillShape,
    activeBold,
    setActiveBold,
    activeItalic,
    setActiveItalic,
    activeUnderline,
    setActiveUnderline,
    document: pdfDoc,
    annotations,
    zoom,
    setZoom,
    showThumbnails,
    setShowThumbnails,
    activeView,
    setActiveView,
    theme,
    toggleTheme,
    setPendingImageSrc,
  } = usePdfStore();
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tools = [
    { id: "select", icon: MousePointer2, label: "Select / Move" },
    { id: "text", icon: Type, label: "Add Text" },
    { id: "edit-text", icon: PencilLine, label: "Edit Existing Text" },
    { id: "rectangle", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "highlight", icon: Highlighter, label: "Highlight" },
    { id: "draw", icon: Pen, label: "Draw" },
    { id: "image", icon: ImageIcon, label: "Image" },
    { id: "signature", icon: Signature, label: "Signature" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
  ] as const;

  const handleExport = async () => {
    if (!pdfDoc) return;
    setExporting(true);
    try {
      const blob = await exportAnnotatedPdf(pdfDoc, annotations);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      const originalName = pdfDoc.fileName.replace(/\.pdf$/i, "");
      a.download = `${originalName}-edited.pdf`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF exported successfully!", {
        description: "Your edited PDF is downloaded.",
      });
    } catch (e) {
      console.error("Export failed:", e);
      toast.error("Export failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImageSrc(reader.result as string);
      setActiveTool("image");
      toast.info("Click on the page where you want the image", {
        description: "Image will be placed at the clicked position.",
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const showShapeOptions =
    activeTool === "rectangle" ||
    activeTool === "circle" ||
    activeTool === "line" ||
    activeTool === "draw";
  const showTextOptions = activeTool === "text" || activeTool === "edit-text";
  const showHighlightOptions = activeTool === "highlight";

  return (
    <div className="flex flex-col gap-2 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Top row: file info + main actions */}
      <div className="flex items-center justify-between px-3 py-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={showThumbnails ? "bg-accent" : ""}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-sm font-medium truncate max-w-[180px]">
                {pdfDoc?.fileName ?? "Untitled"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {pdfDoc?.numPages ?? 0} pages
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant={activeView === "editor" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("editor")}
            className="gap-1.5"
          >
            <Pen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Editor</span>
          </Button>
          <Button
            variant={activeView === "3d" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveView("3d")}
            className="gap-1.5"
          >
            <Box className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">3D View</span>
          </Button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            {exporting ? "Exporting…" : "Export"}
          </Button>
        </div>
      </div>

      {activeView === "editor" && (
        <>
          <Separator />
          {/* Tools row */}
          <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
            <TooltipProvider delayDuration={200}>
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="icon"
                        onClick={() => {
                          if (tool.id === "image") {
                            fileInputRef.current?.click();
                          } else {
                            setActiveTool(tool.id);
                          }
                        }}
                        className="shrink-0"
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {tool.label}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleImagePick}
            />
          </div>

          {/* Properties row */}
          <div className="flex items-center gap-3 px-3 pb-2 flex-wrap">
            {/* Color picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground hidden sm:inline">Color</span>
              <div className="flex items-center gap-1">
                {COLOR_PRESETS.slice(0, 8).map((color) => (
                  <button
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      activeColor === color
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-white/40 dark:border-white/20"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                  />
                ))}
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => setActiveColor(e.target.value)}
                  className="h-6 w-6 rounded-full cursor-pointer overflow-hidden border-2 border-white/40 dark:border-white/20 bg-transparent"
                  title="Custom color"
                />
              </div>
            </div>

            {showShapeOptions && (
              <div className="flex items-center gap-2">
                <Separator orientation="vertical" className="h-6" />
                <Label className="text-xs text-muted-foreground hidden sm:inline">
                  Width
                </Label>
                <div className="w-24">
                  <Slider
                    value={[activeStrokeWidth]}
                    min={1}
                    max={20}
                    step={1}
                    onValueChange={(v) => setActiveStrokeWidth(v[0])}
                  />
                </div>
                <span className="text-xs w-6 tabular-nums">
                  {activeStrokeWidth}
                </span>
                {(activeTool === "rectangle" || activeTool === "circle") && (
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={fillShape}
                      onCheckedChange={setFillShape}
                      id="fill"
                    />
                    <Label htmlFor="fill" className="text-xs cursor-pointer">
                      Fill
                    </Label>
                  </div>
                )}
              </div>
            )}

            {showTextOptions && (
              <div className="flex items-center gap-2 flex-wrap">
                <Separator orientation="vertical" className="h-6" />
                <select
                  value={activeFontFamily}
                  onChange={(e) => setActiveFontFamily(e.target.value)}
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                >
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times">Times</option>
                  <option value="Courier">Courier</option>
                </select>
                <Label className="text-xs text-muted-foreground hidden sm:inline">
                  Size
                </Label>
                <div className="w-20 sm:w-24">
                  <Slider
                    value={[activeFontSize]}
                    min={8}
                    max={72}
                    step={1}
                    onValueChange={(v) => setActiveFontSize(v[0])}
                  />
                </div>
                <span className="text-xs w-6 tabular-nums">
                  {activeFontSize}
                </span>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-0.5">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={activeBold ? "default" : "ghost"}
                          size="icon"
                          onClick={() => setActiveBold(!activeBold)}
                          className="h-7 w-7"
                        >
                          <Bold className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Bold</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={activeItalic ? "default" : "ghost"}
                          size="icon"
                          onClick={() => setActiveItalic(!activeItalic)}
                          className="h-7 w-7"
                        >
                          <Italic className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Italic</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={activeUnderline ? "default" : "ghost"}
                          size="icon"
                          onClick={() => setActiveUnderline(!activeUnderline)}
                          className="h-7 w-7"
                        >
                          <Underline className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Underline</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}

            {showHighlightOptions && (
              <p className="text-xs text-muted-foreground">
                Click and drag to highlight. Use color picker to change color.
              </p>
            )}

            {activeTool === "edit-text" && (
              <p className="text-xs text-muted-foreground">
                Click any existing text in the PDF to edit it. The original text
                is covered, and your new text is drawn on top when you export.
              </p>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(zoom - 0.1)}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs tabular-nums w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(zoom + 0.1)}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
