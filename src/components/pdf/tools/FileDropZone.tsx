"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";

interface FileDropZoneProps {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  sublabel?: string;
  disabled?: boolean;
}

export function FileDropZone({
  accept = "application/pdf",
  multiple = false,
  onFiles,
  label = "Drop your file here",
  sublabel = "or click to browse",
  disabled = false,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const accepted = accept.split(",").map((a) => a.trim());
      const filtered = files.filter((f) => {
        if (accept === "*") return true;
        // Accept if file type matches OR extension matches
        const ext = "." + f.name.split(".").pop()?.toLowerCase();
        return (
          accepted.some((a) => f.type === a || a === "*") ||
          accepted.some((a) => a.startsWith(".") && a === ext)
        );
      });
      if (filtered.length === 0) return;
      setIsLoading(true);
      setTimeout(() => {
        onFiles(filtered);
        setIsLoading(false);
      }, 100);
    },
    [accept, onFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => !disabled && !isLoading && inputRef.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all p-8 md:p-12 text-center ${
        disabled
          ? "opacity-50 cursor-not-allowed border-border"
          : isDragging
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-accent/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
        disabled={disabled}
      />
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <div className="relative h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-md">
              <Upload className="h-7 w-7 text-white" />
            </div>
          </div>
          <div>
            <p className="text-base font-semibold">{label}</p>
            <p className="text-sm text-muted-foreground mt-1">
              or <span className="text-primary font-medium">browse files</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface FileChipProps {
  file: File;
  onRemove?: () => void;
  index?: number;
}

export function FileChip({ file, onRemove, index }: FileChipProps) {
  const sizeKb = (file.size / 1024).toFixed(0);
  const sizeMb = file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${sizeKb} KB`;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-3 p-3 rounded-xl border bg-card"
    >
      <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {index !== undefined && (
            <span className="text-muted-foreground mr-1.5">#{index + 1}</span>
          )}
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">{sizeMb}</p>
      </div>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="h-7 w-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}
