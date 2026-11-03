// Barrel export for all PDF tool components.
// Each tool is a default export in its own file; this re-exports them as
// named exports for convenient dynamic imports from the tool hub.

export { default as MergePdfTool } from "./MergePdfTool";
export { default as SplitPdfTool } from "./SplitPdfTool";
export { default as CompressPdfTool } from "./CompressPdfTool";
export { default as RotatePdfTool } from "./RotatePdfTool";
export { default as OrganizePagesTool } from "./OrganizePagesTool";
export { default as PageNumbersTool } from "./PageNumbersTool";
export { default as PdfToJpgTool } from "./PdfToJpgTool";
export { default as JpgToPdfTool } from "./JpgToPdfTool";
export { default as PdfMetadataTool } from "./PdfMetadataTool";
export { default as ProtectPdfTool } from "./ProtectPdfTool";
export { default as UnlockPdfTool } from "./UnlockPdfTool";
export { default as PdfToTextTool } from "./PdfToTextTool";
export { default as ExtractImagesTool } from "./ExtractImagesTool";
export { default as WatermarkPdfTool } from "./WatermarkPdfTool";
export { default as HtmlToPdfTool } from "./HtmlToPdfTool";

export { ToolLayout } from "./ToolLayout";
export type { FAQ } from "./ToolLayout";
export { FileDropZone } from "./FileDropZone";

// Tool metadata for the hub UI
import {
  FileStack,
  Scissors,
  Minimize2,
  Rotate3d,
  LayoutGrid,
  Hash,
  FileImage,
  ImagePlus,
  FileCog,
  ShieldAlert,
  LockOpen,
  Type,
  Images,
  Stamp,
  Code2,
  type LucideIcon,
} from "lucide-react";

export interface ToolMeta {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  accent: "violet" | "pink" | "amber" | "cyan";
  component: React.LazyExoticComponent<React.ComponentType<{ onBack: () => void }>>;
  keywords: string[];
}

import { lazy } from "react";

export const TOOLS: ToolMeta[] = [
  {
    id: "merge",
    name: "Merge PDF",
    description: "Combine multiple PDFs into one document.",
    icon: FileStack,
    accent: "violet",
    component: lazy(() => import("./MergePdfTool")),
    keywords: ["combine", "join", "concatenate"],
  },
  {
    id: "split",
    name: "Split PDF",
    description: "Extract page ranges or split into individual pages.",
    icon: Scissors,
    accent: "pink",
    component: lazy(() => import("./SplitPdfTool")),
    keywords: ["extract", "separate", "divide"],
  },
  {
    id: "compress",
    name: "Compress PDF",
    description: "Reduce file size with three compression levels.",
    icon: Minimize2,
    accent: "cyan",
    component: lazy(() => import("./CompressPdfTool")),
    keywords: ["reduce", "optimize", "shrink", "smaller"],
  },
  {
    id: "rotate",
    name: "Rotate PDF",
    description: "Rotate every page or just a few — no quality loss.",
    icon: Rotate3d,
    accent: "violet",
    component: lazy(() => import("./RotatePdfTool")),
    keywords: ["turn", "orient", "flip"],
  },
  {
    id: "organize",
    name: "Organize Pages",
    description: "Delete, reorder, and rotate pages visually.",
    icon: LayoutGrid,
    accent: "pink",
    component: lazy(() => import("./OrganizePagesTool")),
    keywords: ["reorder", "delete pages", "arrange"],
  },
  {
    id: "numbers",
    name: "Add Page Numbers",
    description: "Stamp page numbers in your chosen format and position.",
    icon: Hash,
    accent: "violet",
    component: lazy(() => import("./PageNumbersTool")),
    keywords: ["paginate", "numbering", "stamp"],
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    description: "Convert each page to a high-quality JPG image.",
    icon: FileImage,
    accent: "amber",
    component: lazy(() => import("./PdfToJpgTool")),
    keywords: ["image", "extract images", "rasterize"],
  },
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    description: "Combine JPG and PNG images into a single PDF.",
    icon: ImagePlus,
    accent: "amber",
    component: lazy(() => import("./JpgToPdfTool")),
    keywords: ["images to pdf", "convert image"],
  },
  {
    id: "metadata",
    name: "PDF Properties",
    description: "View and edit PDF metadata: title, author, dates, etc.",
    icon: FileCog,
    accent: "violet",
    component: lazy(() => import("./PdfMetadataTool")),
    keywords: ["edit", "info", "properties", "tags"],
  },
  {
    id: "protect",
    name: "Protect PDF",
    description: "Add restriction metadata (note: not real encryption).",
    icon: ShieldAlert,
    accent: "pink",
    component: lazy(() => import("./ProtectPdfTool")),
    keywords: ["restrict", "permissions", "secure"],
  },
  {
    id: "unlock",
    name: "Unlock PDF",
    description: "Remove password protection from a PDF you can open.",
    icon: LockOpen,
    accent: "violet",
    component: lazy(() => import("./UnlockPdfTool")),
    keywords: ["decrypt", "remove password", "free"],
  },
  {
    id: "pdf-to-text",
    name: "PDF to Text",
    description: "Extract plain text from any text-based PDF.",
    icon: Type,
    accent: "cyan",
    component: lazy(() => import("./PdfToTextTool")),
    keywords: ["extract text", "txt", "copy"],
  },
  {
    id: "extract-images",
    name: "Extract Images",
    description: "Pull every embedded image out of a PDF.",
    icon: Images,
    accent: "amber",
    component: lazy(() => import("./ExtractImagesTool")),
    keywords: ["images", "pictures", "raster"],
  },
  {
    id: "watermark",
    name: "Add Watermark",
    description: "Stamp custom text watermarks on every page.",
    icon: Stamp,
    accent: "pink",
    component: lazy(() => import("./WatermarkPdfTool")),
    keywords: ["stamp", "brand", "confidential"],
  },
  {
    id: "html-to-pdf",
    name: "HTML to PDF",
    description: "Render HTML to PDF using your browser's print engine.",
    icon: Code2,
    accent: "cyan",
    component: lazy(() => import("./HtmlToPdfTool")),
    keywords: ["convert", "render", "print"],
  },
];
