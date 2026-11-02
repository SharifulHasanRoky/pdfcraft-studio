"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pen, Eraser, Upload, Type } from "lucide-react";
import { toast } from "sonner";

interface SignaturePadProps {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export function SignaturePad({ open, onClose, onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (!open) return;
    // init canvas when dialog opens
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.clientWidth * 2;
    canvas.height = canvas.clientHeight * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    ctxRef.current = ctx;
    // Reset state asynchronously (rAF) to avoid cascading renders.
    drawing.current = false;
    lastPos.current = null;
    const id = requestAnimationFrame(() => {
      if (canvasRef.current) {
        const c = canvasRef.current.getContext("2d");
        c?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      setHasDrawn(false);
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDraw = (e: React.PointerEvent) => {
    drawing.current = true;
    lastPos.current = getPos(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const moveDraw = (e: React.PointerEvent) => {
    if (!drawing.current || !ctxRef.current || !lastPos.current) return;
    const pos = getPos(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(lastPos.current.x, lastPos.current.y);
    ctxRef.current.lineTo(pos.x, pos.y);
    ctxRef.current.stroke();
    lastPos.current = pos;
    setHasDrawn(true);
  };

  const endDraw = () => {
    drawing.current = false;
    lastPos.current = null;
  };

  const clearCanvas = () => {
    if (!ctxRef.current || !canvasRef.current) return;
    ctxRef.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    setHasDrawn(false);
  };

  const handleSave = () => {
    if (!hasDrawn && !typedText.trim()) {
      toast.error("Please draw or type your signature first");
      return;
    }
    if (typedText.trim()) {
      // Create text signature
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.font = "italic 64px 'Brush Script MT', cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(typedText, canvas.width / 2, canvas.height / 2);
      onSave(canvas.toDataURL("image/png"));
    } else if (canvasRef.current) {
      // Trim transparent edges and convert to PNG with white background
      const canvas = canvasRef.current;
      // Create a copy with white background
      const out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = canvas.height;
      const octx = out.getContext("2d");
      if (!octx) return;
      octx.fillStyle = "white";
      octx.fillRect(0, 0, out.width, out.height);
      octx.drawImage(canvas, 0, 0);
      onSave(out.toDataURL("image/png"));
    }
    clearCanvas();
    setTypedText("");
    onClose();
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onSave(reader.result as string);
      onClose();
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add your signature</DialogTitle>
          <DialogDescription>
            Draw with your mouse, type your name, or upload an image.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="draw">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw" className="gap-1.5">
              <Pen className="h-3.5 w-3.5" />
              Draw
            </TabsTrigger>
            <TabsTrigger value="type" className="gap-1.5">
              <Type className="h-3.5 w-3.5" />
              Type
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="mt-4">
            <div className="border-2 border-dashed rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                className="w-full h-48 cursor-crosshair touch-none"
                onPointerDown={startDraw}
                onPointerMove={moveDraw}
                onPointerUp={endDraw}
                onPointerCancel={endDraw}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-muted-foreground">
                {hasDrawn ? "Signature captured" : "Draw your signature above"}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCanvas}
                className="gap-1.5"
              >
                <Eraser className="h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="type" className="mt-4">
            <div className="space-y-2">
              <Label htmlFor="sig-text">Your name</Label>
              <Input
                id="sig-text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
            <div className="mt-3 p-6 rounded-lg bg-white border-2 border-dashed text-center">
              <span
                className="text-3xl text-black"
                style={{ fontFamily: "'Brush Script MT', cursive", fontStyle: "italic" }}
              >
                {typedText || "Preview"}
              </span>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <label className="block">
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload signature image</p>
                <p className="text-xs text-muted-foreground mt-1">PNG or JPG</p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Place signature</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
