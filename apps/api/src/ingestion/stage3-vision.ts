import { z } from 'zod';
import { getVisionLLMProvider } from '../providers/llm/index.js';
import { RenderedPage } from './stage1-render.js';
import { NativePageExtract } from './stage2-native.js';
import { env } from '../lib/env.js';
import { logger } from '../lib/logger.js';
import { Page } from '../models/Page.js';
import mongoose from 'mongoose';
import Tesseract from 'tesseract.js';

async function performLocalOcr(buffer: Buffer): Promise<string> {
  try {
    const res = await Tesseract.recognize(buffer, 'eng');
    return res.data.text || '';
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Tesseract OCR fallback error');
    return '';
  }
}

export const BBoxZod = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
}).optional();

export const HeadingZod = z.object({
  type: z.literal('heading'),
  level: z.number().int().min(1).max(6),
  text: z.string(),
  bbox: BBoxZod,
});

export const ParagraphZod = z.object({
  type: z.literal('paragraph'),
  text: z.string(),
  bbox: BBoxZod,
});

export const ListZod = z.object({
  type: z.literal('list'),
  items: z.array(z.string()),
  ordered: z.boolean().optional(),
  bbox: BBoxZod,
});

export const TableZod = z.object({
  type: z.literal('table'),
  caption: z.string().optional(),
  units: z.string().optional(),
  headers: z.union([
    z.array(z.string()),
    z.array(z.array(z.string())).transform((arr) => arr.flat()),
  ]).transform((headers) => headers.map((header) => header.trim()).filter(Boolean)),
  rows: z.array(z.array(z.union([z.string(), z.number()]).transform((v) => String(v)))),
  markdown: z.string().optional().default(''),
  bbox: BBoxZod,
});

export const DataPointZod = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.coerce.number(),
  label: z.string().optional(),
});

export const ChartSeriesZod = z.object({
  name: z.string(),
  data: z.array(DataPointZod),
  unit: z.string().optional(),
});

export const ChartZod = z.object({
  type: z.literal('chart'),
  chartType: z.enum(['bar', 'line', 'pie', 'scatter', 'area', 'other']),
  title: z.string().optional(),
  xAxisLabel: z.string().optional(),
  xAxisUnit: z.string().optional(),
  yAxisLabel: z.string().optional(),
  yAxisUnit: z.string().optional(),
  series: z.array(ChartSeriesZod),
  legendEntries: z.array(z.string()).optional(),
  summary: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  estimatedValues: z.boolean().optional(),
  bbox: BBoxZod,
});

export const FigureZod = z.object({
  type: z.literal('figure'),
  caption: z.string().optional(),
  description: z.string(),
  containedText: z.string().optional(),
  bbox: BBoxZod,
});

export const EquationZod = z.object({
  type: z.literal('equation'),
  latex: z.string(),
  text: z.string().optional(),
  bbox: BBoxZod,
});

export const FootnoteZod = z.object({
  type: z.literal('footnote'),
  text: z.string(),
  bbox: BBoxZod,
});

export const HeaderFooterZod = z.object({
  type: z.literal('header_footer'),
  text: z.string(),
  position: z.enum(['header', 'footer']).optional(),
  bbox: BBoxZod,
});

export const PageElementZod = z.discriminatedUnion('type', [
  HeadingZod,
  ParagraphZod,
  ListZod,
  TableZod,
  ChartZod,
  FigureZod,
  EquationZod,
  FootnoteZod,
  HeaderFooterZod,
]);

export type PageElement = z.infer<typeof PageElementZod>;

export const PageUnderstandingResponseZod = z.object({
  pageNumber: z.number(),
  elements: z.array(PageElementZod),
});

export type PageUnderstandingResponse = z.infer<typeof PageUnderstandingResponseZod>;

export interface ProcessedVisionPage {
  pageNumber: number;
  imageRef: string;
  degraded: boolean;
  needsOcr: boolean;
  textLayerQuality: 'good' | 'poor' | 'none';
  elements: PageElement[];
  width: number;
  height: number;
}

const VISION_SYSTEM_PROMPT = `You are a high-precision document structure understanding engine.
Analyze the provided PDF page image and native text layer.
Extract ALL information faithfully into a structured JSON representation.
Preserve exact numbers, table grids, chart data points, and reading hierarchy.
Do not hallucinate or omit data.`;

const SCHEMA_DESCRIPTION = `
{
  "pageNumber": number,
  "elements": Array<
    | { "type": "heading", "level": 1-6, "text": string }
    | { "type": "paragraph", "text": string }
    | { "type": "list", "items": string[], "ordered"?: boolean }
    | { "type": "table", "caption"?: string, "units"?: string, "headers": string[] | string[][], "rows": string[][], "markdown": string, "bbox"?: { "x": number, "y": number, "width": number, "height": number } }
    | { "type": "chart", "chartType": "bar"|"line"|"pie"|"scatter"|"area"|"other", "title"?: string, "xAxisLabel"?: string, "xAxisUnit"?: string, "yAxisLabel"?: string, "yAxisUnit"?: string, "series": Array<{ "name": string, "data": Array<{ "x": string|number, "y": number, "label"?: string }>, "unit"?: string }>, "legendEntries"?: string[], "summary": string, "confidence": "high"|"medium"|"low", "estimatedValues"?: boolean }
    | { "type": "figure", "caption"?: string, "description": string, "containedText"?: string }
    | { "type": "equation", "latex": string, "text"?: string }
    | { "type": "footnote", "text": string }
    | { "type": "header_footer", "text": string, "position"?: "header"|"footer" }
  >
}
`;

export async function stage3VisionPageUnderstanding(
  documentId: string,
  renderedPages: RenderedPage[],
  nativePages: NativePageExtract[]
): Promise<ProcessedVisionPage[]> {
  logger.info({ documentId, totalPages: renderedPages.length }, 'Stage 3: Vision-based page understanding');
  const llm = getVisionLLMProvider();
  const concurrency = env.VISION_PAGE_CONCURRENCY || 3;
  const results: ProcessedVisionPage[] = new Array(renderedPages.length);

  // Check existing page checkpoints in DB to resume if crashed
  const existingPages = await Page.find({ documentId: new mongoose.Types.ObjectId(documentId) });
  const checkpointMap = new Map<number, boolean>();
  for (const ep of existingPages) {
    checkpointMap.set(ep.pageNumber, true);
  }

  // Bounded concurrency pool
  let cursor = 0;
  const runWorker = async () => {
    while (cursor < renderedPages.length) {
      const index = cursor++;
      const render = renderedPages[index];
      const native = nativePages.find((p) => p.pageNumber === render.pageNumber) || {
        pageNumber: render.pageNumber,
        textLayerQuality: 'none',
        needsOcr: true,
        rawText: '',
        items: [],
      };

      if (native.needsOcr && render.imageBuffer) {
        logger.info({ page: render.pageNumber }, 'Page flagged needsOcr: performing OCR extraction');
        const ocrText = await performLocalOcr(render.imageBuffer);
        if (ocrText && ocrText.trim().length > 0) {
          native.rawText = ocrText;
        }
      }

      const prompt = `Page ${render.pageNumber}.
Native text extracted from this page:
"""
${native.rawText || '(No native text layer present; visual OCR/parsing required)'}
"""

Please parse every element on this page carefully. Extract charts with all coordinates/data points, tables with complete rows and markdown, and headings.`;

      let elements: PageElement[] = [];
      let degraded = false;

      try {
        const rawJson = await llm.generateStructured<any>(
          prompt,
          SCHEMA_DESCRIPTION,
          [{ buffer: render.imageBuffer, mimeType: 'image/png' }],
          VISION_SYSTEM_PROMPT
        );

        const parsed = PageUnderstandingResponseZod.safeParse(rawJson);
        if (parsed.success) {
          elements = parsed.data.elements;
        } else {
          // Attempt 1 repair
          logger.warn({ page: render.pageNumber, issues: parsed.error.issues }, 'Vision response failed zod schema. Retrying repair...');
          try {
            const repairPrompt = `The previous JSON was invalid:\n${JSON.stringify(parsed.error.issues)}\n\nFix the JSON to strictly conform to the schema:`;
            const repairedJson = await llm.generateStructured<any>(
              repairPrompt,
              SCHEMA_DESCRIPTION
            );
            const repaired = PageUnderstandingResponseZod.parse(repairedJson);
            elements = repaired.elements;
          } catch (repairErr: any) {
            logger.error({ page: render.pageNumber, error: repairErr.message }, 'Repair failed; falling back to degraded native text');
            degraded = true;
            elements = fallbackNativeToElements(native);
          }
        }
      } catch (llmErr: any) {
        logger.error({ page: render.pageNumber, error: llmErr.message }, 'Vision LLM call failed; falling back to degraded native text');
        degraded = true;
        elements = fallbackNativeToElements(native);
      }

      // Ensure elements is not empty
      if (elements.length === 0) {
        elements = fallbackNativeToElements(native);
      }

      // Checkpoint page in DB
      await Page.findOneAndUpdate(
        { documentId: new mongoose.Types.ObjectId(documentId), pageNumber: render.pageNumber },
        {
          $set: {
            documentId: new mongoose.Types.ObjectId(documentId),
            pageNumber: render.pageNumber,
            imageRef: render.imageRef,
            textLayerQuality: native.textLayerQuality,
            needsOcr: native.needsOcr,
            degraded,
            width: render.width,
            height: render.height,
          },
        },
        { upsert: true, new: true }
      );

      results[index] = {
        pageNumber: render.pageNumber,
        imageRef: render.imageRef,
        degraded,
        needsOcr: native.needsOcr,
        textLayerQuality: native.textLayerQuality,
        elements,
        width: render.width,
        height: render.height,
      };
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, renderedPages.length) }, () => runWorker());
  await Promise.all(workers);

  logger.info({ documentId, pagesParsed: results.length }, 'Stage 3 complete: All pages understood');
  return results;
}

function fallbackNativeToElements(native: NativePageExtract): PageElement[] {
  if (!native.rawText || native.rawText.trim().length === 0) {
    return [{ type: 'paragraph', text: '(Scanned or empty page with no extracted text)' }];
  }

  const lines = native.rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const elements: PageElement[] = [];

  for (const line of lines) {
    if (line.length < 50 && (line === line.toUpperCase() || /^\d+\./.test(line))) {
      elements.push({ type: 'heading', level: 2, text: line });
    } else {
      elements.push({ type: 'paragraph', text: line });
    }
  }

  return elements.length > 0 ? elements : [{ type: 'paragraph', text: native.rawText }];
}
