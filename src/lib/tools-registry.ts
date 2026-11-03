// Tools registry — single source of truth for all PDF tools.
// Each tool entry contains: id, slug, title, description, category, icon, keywords, FAQ.

import {
  FileText,
  Layers,
  Scissors,
  Minimize2,
  RotateCw,
  ListOrdered,
  Hash,
  FileImage,
  Image as ImageIcon,
  Info,
  Lock,
  Unlock,
  Type,
  ImagePlus,
  Stamp,
  Code2,
  type LucideIcon,
} from "lucide-react";

export type ToolCategory =
  | "edit"
  | "organize"
  | "convert"
  | "optimize"
  | "security";

export interface ToolMeta {
  id: string;
  slug: string; // for hash route: #/merge-pdf
  title: string;
  shortTitle: string;
  description: string;
  longDescription: string;
  category: ToolCategory;
  icon: LucideIcon;
  color: string; // tailwind gradient classes e.g. "from-rose-500 to-pink-600"
  keywords: string[];
  faqs: { q: string; a: string }[];
  howItWorks: string[];
  popular?: boolean;
  isBeta?: boolean;
}

export const TOOL_CATEGORIES: Record<
  ToolCategory,
  { label: string; description: string; icon: LucideIcon }
> = {
  edit: {
    label: "Edit PDF",
    description: "Add text, images, watermarks and more",
    icon: FileText,
  },
  organize: {
    label: "Organize PDF",
    description: "Merge, split, reorder and rotate pages",
    icon: Layers,
  },
  convert: {
    label: "Convert PDF",
    description: "Convert to and from PDF format",
    icon: FileImage,
  },
  optimize: {
    label: "Optimize PDF",
    description: "Compress, repair and clean up PDFs",
    icon: Minimize2,
  },
  security: {
    label: "PDF Security",
    description: "Protect, unlock and watermark PDFs",
    icon: Lock,
  },
};

export const TOOLS: ToolMeta[] = [
  // ORGANIZE
  {
    id: "merge",
    slug: "merge-pdf",
    title: "Merge PDF",
    shortTitle: "Merge",
    description:
      "Combine multiple PDF files into one. Reorder pages, then merge them into a single document.",
    longDescription:
      "Merge PDF is a free online tool that lets you combine multiple PDF files into a single document. Reorder pages by dragging, then click Merge to combine them. 100% free, no signup, processed in your browser.",
    category: "organize",
    icon: Layers,
    color: "from-rose-500 to-pink-600",
    keywords: ["merge pdf", "combine pdf", "join pdf", "pdf merger"],
    popular: true,
    howItWorks: [
      "Upload two or more PDF files using drag & drop or file picker.",
      "Reorder the files using the up/down arrows to set the merge order.",
      "Click 'Merge PDF' to combine them into a single document.",
      "Download the merged PDF — your original files are unchanged.",
    ],
    faqs: [
      {
        q: "Is merging PDFs really free?",
        a: "Yes. Merge as many PDFs as you want, every day, completely free. No sign-up, no watermark, no daily limits.",
      },
      {
        q: "Are my PDFs uploaded to a server?",
        a: "No. Merging happens entirely in your browser using pdf-lib. Your files never leave your device.",
      },
      {
        q: "Is there a file size limit?",
        a: "There's no hard limit, but very large PDFs (100MB+) may take longer and use more browser memory.",
      },
      {
        q: "Can I merge more than two PDFs at once?",
        a: "Yes — add as many PDF files as you need and reorder them freely before merging.",
      },
    ],
  },
  {
    id: "split",
    slug: "split-pdf",
    title: "Split PDF",
    shortTitle: "Split",
    description:
      "Extract specific pages or split a PDF into multiple files by page ranges.",
    longDescription:
      "Split PDF lets you extract pages from a PDF or split one PDF into many. Enter page ranges like '1-3, 5, 7-9' or split every page into a separate file. Free, browser-based, no signup.",
    category: "organize",
    icon: Scissors,
    color: "from-orange-500 to-amber-600",
    keywords: ["split pdf", "extract pages", "divide pdf", "pdf splitter"],
    popular: true,
    howItWorks: [
      "Upload a PDF file.",
      "Choose split mode: extract page ranges OR split into individual pages.",
      "Enter page ranges like '1-3, 5, 7-9' if extracting.",
      "Download the resulting PDF (or multiple PDFs for split mode).",
    ],
    faqs: [
      {
        q: "Can I split one PDF into many files?",
        a: "Yes. Choose 'Split into individual pages' to create one PDF per page, or use 'Extract page ranges' to create custom splits.",
      },
      {
        q: "How do I specify page ranges?",
        a: "Use commas to separate ranges and hyphens for ranges. Example: '1-3, 5, 7-9' extracts pages 1, 2, 3, 5, 7, 8, 9.",
      },
      {
        q: "Are the original pages preserved?",
        a: "Yes. Splitting creates new PDFs containing copies of selected pages. Your original PDF is never modified.",
      },
    ],
  },
  {
    id: "rotate",
    slug: "rotate-pdf",
    title: "Rotate PDF",
    shortTitle: "Rotate",
    description:
      "Rotate PDF pages 90°, 180° or 270°. Rotate individual pages or all pages at once.",
    longDescription:
      "Rotate PDF pages permanently. Fix sideways or upside-down pages. Rotate every page or pick specific pages. Free, browser-based, no signup.",
    category: "organize",
    icon: RotateCw,
    color: "from-amber-500 to-yellow-600",
    keywords: ["rotate pdf", "flip pdf", "pdf rotation", "rotate page"],
    howItWorks: [
      "Upload a PDF file.",
      "Each page shows rotate left/right buttons with a thumbnail preview.",
      "Click 'Rotate All' to apply the same rotation to every page.",
      "Download the rotated PDF.",
    ],
    faqs: [
      {
        q: "Does rotation permanently change the PDF?",
        a: "Yes — the rotation is written into the PDF page properties, so the rotation persists in any PDF reader.",
      },
      {
        q: "Can I rotate just some pages?",
        a: "Yes. Each page thumbnail has its own rotate buttons, so you can rotate individual pages independently.",
      },
    ],
  },
  {
    id: "organize",
    slug: "organize-pdf",
    title: "Organize PDF Pages",
    shortTitle: "Organize",
    description:
      "Delete, reorder and rotate PDF pages visually. Drag to reorder, click to delete.",
    longDescription:
      "Organize PDF pages visually. See thumbnails of every page, delete unwanted pages, reorder by moving pages, and rotate any page. Free, no signup, browser-based.",
    category: "organize",
    icon: ListOrdered,
    color: "from-violet-500 to-purple-600",
    keywords: ["organize pdf", "reorder pages", "delete pages", "pdf organizer"],
    popular: true,
    howItWorks: [
      "Upload a PDF file.",
      "Thumbnails of every page appear in a grid.",
      "Use the move buttons to reorder, trash to delete, and rotate to fix orientation.",
      "Download the reorganized PDF.",
    ],
    faqs: [
      {
        q: "Can I undo a deletion?",
        a: "No — once you delete a page in the organizer, it's removed from the working set. To start over, re-upload the original PDF.",
      },
      {
        q: "How many pages can I organize at once?",
        a: "There's no hard limit. Large PDFs (100+ pages) will load more slowly because we render every page thumbnail.",
      },
    ],
  },
  // EDIT
  {
    id: "page-numbers",
    slug: "add-page-numbers",
    title: "Add Page Numbers",
    shortTitle: "Page Numbers",
    description:
      "Add page numbers to a PDF. Choose position, starting number and format.",
    longDescription:
      "Add page numbers to any PDF. Pick position (top/bottom, left/center/right), starting number, and format like 'Page 1 of 10' or '1/10'. Free, browser-based, no signup.",
    category: "edit",
    icon: Hash,
    color: "from-emerald-500 to-teal-600",
    keywords: ["page numbers", "number pdf pages", "add numbers to pdf"],
    howItWorks: [
      "Upload a PDF file.",
      "Choose position (top/bottom + left/center/right), starting number, and format.",
      "Click 'Add Page Numbers' to apply.",
      "Download the numbered PDF.",
    ],
    faqs: [
      {
        q: "Can I start page numbers from a number other than 1?",
        a: "Yes. Set the 'Start at' field to any number — useful for chapters and appendices.",
      },
      {
        q: "What formats are supported?",
        a: "Plain number (1), 'Page 1', '1 of 10', or '1/10'. Pick the format that fits your document.",
      },
    ],
  },
  {
    id: "watermark",
    slug: "add-watermark",
    title: "Add Watermark to PDF",
    shortTitle: "Watermark",
    description:
      "Add a text watermark to every page. Choose font size, color, opacity and rotation.",
    longDescription:
      "Add a custom text watermark to every page of a PDF. Control font size, color, opacity, rotation angle, and position. Common use: 'CONFIDENTIAL', 'DRAFT', 'SAMPLE'. Free, browser-based.",
    category: "edit",
    icon: Stamp,
    color: "from-cyan-500 to-blue-600",
    keywords: ["watermark pdf", "add watermark", "stamp pdf", "confidential pdf"],
    howItWorks: [
      "Upload a PDF file.",
      "Enter watermark text (e.g., 'CONFIDENTIAL').",
      "Adjust font size, color, opacity, and rotation angle.",
      "Click 'Add Watermark' and download the result.",
    ],
    faqs: [
      {
        q: "Can I add an image watermark?",
        a: "Currently we support text watermarks. For image watermarks, you can use the PDF editor's image tool to place a logo on each page.",
      },
      {
        q: "Does the watermark appear on every page?",
        a: "Yes. The watermark is drawn on every page of the PDF at the position and angle you choose.",
      },
    ],
  },
  // CONVERT
  {
    id: "pdf-to-jpg",
    slug: "pdf-to-jpg",
    title: "PDF to JPG",
    shortTitle: "PDF → JPG",
    description:
      "Convert each page of a PDF into a JPG image. Download individual pages or all at once.",
    longDescription:
      "Convert PDF to JPG images. Each page becomes a high-quality JPG. Download individual pages or all of them. Free, browser-based, no signup.",
    category: "convert",
    icon: FileImage,
    color: "from-fuchsia-500 to-pink-600",
    keywords: ["pdf to jpg", "pdf to image", "convert pdf to image"],
    popular: true,
    howItWorks: [
      "Upload a PDF file.",
      "Each page is rendered to a JPG image using pdf.js.",
      "Preview thumbnails appear — click any to download individually.",
      "Click 'Download All' to save every JPG.",
    ],
    faqs: [
      {
        q: "What image quality will I get?",
        a: "JPGs are saved at 85% quality by default — a good balance of quality and file size for most uses.",
      },
      {
        q: "Are vector PDFs converted at high resolution?",
        a: "Yes. We render at 1.5× scale, so vector content stays crisp. For higher resolution, use the PDF editor's zoom + screenshot.",
      },
    ],
  },
  {
    id: "jpg-to-pdf",
    slug: "jpg-to-pdf",
    title: "JPG to PDF",
    shortTitle: "JPG → PDF",
    description:
      "Convert JPG, PNG and other images into a single PDF. Reorder images, choose page size.",
    longDescription:
      "Convert images to PDF. Combine JPG, PNG, and other formats into one PDF document. Reorder images freely. Choose A4, Letter, or fit-to-image page size. Free, no signup.",
    category: "convert",
    icon: ImageIcon,
    color: "from-rose-500 to-orange-500",
    keywords: ["jpg to pdf", "image to pdf", "convert images to pdf"],
    popular: true,
    howItWorks: [
      "Upload one or more image files (JPG, PNG).",
      "Reorder images using the up/down arrows.",
      "Choose page size: A4, Letter, or Fit to image.",
      "Click 'Convert to PDF' and download the result.",
    ],
    faqs: [
      {
        q: "What image formats are supported?",
        a: "JPG and PNG. Other formats (GIF, BMP, WebP) may also work if your browser can read them.",
      },
      {
        q: "Can I add multiple images to one PDF?",
        a: "Yes. Upload as many images as you want — each image becomes a page in the PDF.",
      },
    ],
  },
  {
    id: "pdf-to-text",
    slug: "pdf-to-text",
    title: "PDF to Text",
    shortTitle: "PDF → Text",
    description:
      "Extract text from a PDF. Editable text output that you can copy or download as .txt.",
    longDescription:
      "Extract text from any PDF that has a text layer. Edit the extracted text, copy to clipboard, or download as a .txt file. Free, browser-based, no signup.",
    category: "convert",
    icon: Type,
    color: "from-violet-500 to-fuchsia-600",
    keywords: ["pdf to text", "extract text from pdf", "pdf text extractor"],
    howItWorks: [
      "Upload a PDF file.",
      "We extract text from every page using pdf.js's text content API.",
      "Text appears in an editable textarea.",
      "Edit, copy, or download as .txt.",
    ],
    faqs: [
      {
        q: "Can it extract text from scanned PDFs?",
        a: "No. Scanned PDFs contain images, not text. For scanned PDFs, you'd need OCR (coming soon).",
      },
      {
        q: "Is the original formatting preserved?",
        a: "Text is extracted with line breaks preserved. Complex layouts, tables, and columns may not be perfectly reconstructed.",
      },
    ],
  },
  {
    id: "extract-images",
    slug: "extract-pdf-images",
    title: "Extract Images from PDF",
    shortTitle: "Extract Images",
    description:
      "Pull out all embedded images from a PDF. Download as PNG files.",
    longDescription:
      "Extract every embedded image from a PDF. Preview thumbnails, download individual images or all as PNGs. Free, browser-based, no signup.",
    category: "convert",
    icon: ImagePlus,
    color: "from-amber-500 to-orange-600",
    keywords: ["extract images from pdf", "pdf image extractor", "save pdf images"],
    howItWorks: [
      "Upload a PDF file.",
      "We scan every page for embedded images using pdf.js's operator list.",
      "Each image is rendered to a PNG and shown as a thumbnail.",
      "Download individual images or all at once.",
    ],
    faqs: [
      {
        q: "Are images extracted at original quality?",
        a: "We extract the raw image data as embedded in the PDF, so quality is preserved exactly as stored.",
      },
      {
        q: "What if my PDF has no embedded images?",
        a: "If the PDF contains only vector graphics or text, no images will be found. Try PDF to JPG instead to rasterize pages.",
      },
    ],
  },
  // OPTIMIZE
  {
    id: "compress",
    slug: "compress-pdf",
    title: "Compress PDF",
    shortTitle: "Compress",
    description:
      "Reduce PDF file size. Three compression levels — pick the one that fits your needs.",
    longDescription:
      "Compress PDF to reduce file size. Choose Light, Recommended, or Extreme compression. See before/after file sizes. Free, browser-based, no signup.",
    category: "optimize",
    icon: Minimize2,
    color: "from-emerald-500 to-green-600",
    keywords: ["compress pdf", "reduce pdf size", "pdf compressor", "shrink pdf"],
    popular: true,
    howItWorks: [
      "Upload a PDF file.",
      "Choose compression level: Light, Recommended, or Extreme.",
      "Click 'Compress PDF' — we re-save with object streams and remove duplicate objects.",
      "Download the compressed PDF and see the size reduction.",
    ],
    faqs: [
      {
        q: "How much can I compress a PDF?",
        a: "It depends on the PDF. Text-heavy PDFs may shrink 5-20%. Image-heavy PDFs may shrink more if we can recompress images.",
      },
      {
        q: "Does compression reduce quality?",
        a: "Light compression preserves all content. Extreme compression may reduce image quality. We always show the size reduction before download.",
      },
      {
        q: "Why is my PDF not smaller after compression?",
        a: "Some PDFs are already optimally compressed. If your PDF is mostly text with no duplicates, there's little to compress.",
      },
    ],
  },
  {
    id: "metadata",
    slug: "pdf-properties",
    title: "PDF Properties & Metadata",
    shortTitle: "Properties",
    description:
      "View and edit PDF metadata: title, author, subject, keywords and more.",
    longDescription:
      "View and edit PDF metadata. See title, author, subject, keywords, creator, dates, page count, file size, PDF version. Edit fields and download. Free, browser-based, no signup.",
    category: "optimize",
    icon: Info,
    color: "from-slate-500 to-gray-600",
    keywords: ["pdf properties", "pdf metadata", "edit pdf metadata", "pdf info"],
    howItWorks: [
      "Upload a PDF file.",
      "View all metadata fields and PDF properties.",
      "Edit any field (title, author, subject, keywords).",
      "Click 'Save & Download' to apply changes.",
    ],
    faqs: [
      {
        q: "What metadata can I edit?",
        a: "Title, author, subject, keywords, creator, producer, creation date, and modification date.",
      },
      {
        q: "Are my changes permanent?",
        a: "Yes. The edited metadata is written into the downloaded PDF and visible in any PDF reader's document properties.",
      },
    ],
  },
  // SECURITY
  {
    id: "unlock",
    slug: "unlock-pdf",
    title: "Unlock PDF",
    shortTitle: "Unlock",
    description:
      "Remove password protection from a PDF. You need to know the password.",
    longDescription:
      "Unlock PDF removes password protection from a PDF — but you must know the password. Upload the locked PDF, enter the password, download an unlocked copy. Free, browser-based, no signup.",
    category: "security",
    icon: Unlock,
    color: "from-emerald-500 to-teal-600",
    keywords: ["unlock pdf", "remove pdf password", "decrypt pdf", "pdf unlocker"],
    howItWorks: [
      "Upload a password-protected PDF.",
      "Enter the password.",
      "Click 'Unlock PDF' — if the password is correct, we save a new copy without password.",
      "Download the unlocked PDF.",
    ],
    faqs: [
      {
        q: "Can I unlock a PDF without knowing the password?",
        a: "No. We can only remove a password if you provide the correct one. We do not crack passwords.",
      },
      {
        q: "Is unlocking PDFs legal?",
        a: "Yes, if you own the document or have permission. Use responsibly and only on PDFs you have rights to.",
      },
    ],
  },
  {
    id: "protect",
    slug: "protect-pdf",
    title: "Protect PDF",
    shortTitle: "Protect",
    description:
      "Add a password to a PDF. Note: browser-based encryption is limited.",
    longDescription:
      "Add password protection to a PDF. Browser-based PDF encryption is technically limited, so we offer metadata-level protection. For true encryption, consider a desktop tool. Free, browser-based, no signup.",
    category: "security",
    icon: Lock,
    color: "from-red-500 to-rose-600",
    keywords: ["protect pdf", "password pdf", "encrypt pdf", "secure pdf"],
    isBeta: true,
    howItWorks: [
      "Upload a PDF file.",
      "Enter a password.",
      "We add a metadata-level password hint to the PDF.",
      "For true PDF encryption, use a desktop tool like Adobe Acrobat or qpdf.",
    ],
    faqs: [
      {
        q: "Does this encrypt my PDF?",
        a: "Browser-based PDF libraries cannot fully encrypt PDFs. We add a metadata password hint, but for true 256-bit AES encryption, use a desktop tool.",
      },
      {
        q: "Why isn't full encryption supported in browser?",
        a: "PDF encryption requires complex cryptographic operations that browser libraries don't fully support. We're working on adding WebAssembly-based encryption in a future update.",
      },
    ],
  },
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function getPopularTools(): ToolMeta[] {
  return TOOLS.filter((t) => t.popular);
}

export function getToolsByCategory(category: ToolCategory): ToolMeta[] {
  return TOOLS.filter((t) => t.category === category);
}

export function searchTools(query: string): ToolMeta[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return TOOLS.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some((k) => k.includes(q))
  ).slice(0, 8);
}
