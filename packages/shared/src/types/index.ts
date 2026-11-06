export type ElementType =
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'table'
  | 'chart'
  | 'figure'
  | 'equation'
  | 'footnote'
  | 'header_footer';

export type DocumentStatus =
  | 'queued'
  | 'rendering'
  | 'parsing'
  | 'embedding'
  | 'ready'
  | 'failed';

export type IngestionStage =
  | 'rendering_pages'
  | 'extracting_text'
  | 'vision_parsing'
  | 'stitching'
  | 'chunking'
  | 'embedding'
  | 'indexing';

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HeadingPath {
  level: number;
  text: string;
}

export interface ParsedElement {
  type: ElementType;
  page: number;
  bbox?: BBox;
  content: unknown; // typed per element in element-specific types
}

export interface ParsedHeading {
  type: 'heading';
  level: number;
  text: string;
  page: number;
  bbox?: BBox;
}

export interface ParsedParagraph {
  type: 'paragraph';
  text: string;
  page: number;
  bbox?: BBox;
}

export interface ParsedTable {
  type: 'table';
  caption?: string;
  units?: string;
  headers: string[][];
  rows: string[][];
  markdown: string;
  page: number;
  endPage?: number; // if spans multiple pages
  bbox?: BBox;
}

export interface DataPoint {
  x: string | number;
  y: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: DataPoint[];
  unit?: string;
}

export interface ParsedChart {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'other';
  title?: string;
  xAxisLabel?: string;
  xAxisUnit?: string;
  yAxisLabel?: string;
  yAxisUnit?: string;
  series: ChartSeries[];
  legendEntries?: string[];
  summary: string;
  confidence: 'high' | 'medium' | 'low';
  estimatedValues?: boolean;
  page: number;
  bbox?: BBox;
}

export interface ParsedFigure {
  type: 'figure';
  caption?: string;
  description: string;
  containedText?: string;
  page: number;
  bbox?: BBox;
}

export interface Citation {
  id: string;
  documentId: string;
  documentTitle: string;
  page: number;
  chunkId: string;
  elementType: ElementType;
  excerpt: string;
  bbox?: BBox;
  pageImageRef?: string;
}

export interface AnswerResponse {
  answer_markdown: string;
  citations: Citation[];
  tables: ParsedTable[];
  charts: ParsedChart[];
  confidence: 'high' | 'medium' | 'low';
  followups: string[];
}

export interface IngestionProgress {
  documentId: string;
  status: DocumentStatus;
  stage?: IngestionStage;
  progress: number; // 0-100
  currentPage?: number;
  totalPages?: number;
  error?: string;
}
