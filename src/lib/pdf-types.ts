// PDF Editor Types

export type ToolType =
  | "select"
  | "text"
  | "rectangle"
  | "circle"
  | "line"
  | "highlight"
  | "draw"
  | "image"
  | "signature"
  | "eraser";

export type AnnotationType =
  | "text"
  | "rectangle"
  | "circle"
  | "line"
  | "highlight"
  | "drawing"
  | "image"
  | "signature";

export interface BaseAnnotation {
  id: string;
  page: number;
  type: AnnotationType;
  // Position is stored as percentage of page width/height (0-1)
  // so it scales correctly with the rendered page size
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: "text";
  text: string;
  fontSize: number; // relative to page height (0-1)
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface ShapeAnnotation extends BaseAnnotation {
  type: "rectangle" | "circle" | "line";
  strokeWidth: number; // relative to page width
  fill: boolean;
  fillColor: string;
  opacity: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: "highlight";
  opacity: number;
}

export interface DrawingAnnotation extends BaseAnnotation {
  type: "drawing";
  // points stored as array of {x, y} in percentage coords
  points: { x: number; y: number }[];
  strokeWidth: number;
}

export interface ImageAnnotation extends BaseAnnotation {
  type: "image" | "signature";
  src: string; // dataURL
}

export type Annotation =
  | TextAnnotation
  | ShapeAnnotation
  | HighlightAnnotation
  | DrawingAnnotation
  | ImageAnnotation;

export interface PdfPageData {
  id: string;
  pageNumber: number; // original page number
  rotation: number; // 0, 90, 180, 270
  width: number; // original page width in points
  height: number; // original page height in points
  thumbnail?: string; // dataURL for thumbnail
}

export interface PdfDocument {
  file: File;
  data: ArrayBuffer;
  numPages: number;
  pages: PdfPageData[];
  fileName: string;
}
