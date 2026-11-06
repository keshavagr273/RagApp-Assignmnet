import { StitchedDocument, StitchedElement } from './stage4-stitch.js';
import { logger } from '../lib/logger.js';

export interface PreparedChunk {
  documentId: string;
  collectionId: string;
  page: number;
  endPage?: number;
  elementType: string;
  headingPath: Array<{ level: number; text: string }>;
  text: string; // Contextualized retrieval text
  rawText: string; // Plain element text
  rawStructured: any; // Original JSON
  bbox?: { x: number; y: number; width: number; height: number };
  pageImageRef?: string;
  tokenCount: number;
}

export function stage5SemanticChunking(
  documentId: string,
  collectionId: string,
  documentTitle: string,
  stitched: StitchedDocument
): PreparedChunk[] {
  logger.info({ documentId }, 'Stage 5: Semantic element chunking');
  const chunks: PreparedChunk[] = [];

  const formatHeadingPath = (path: Array<{ level: number; text: string }>) => {
    return path.map((h) => h.text).join(' > ') || 'General';
  };

  const estimateTokens = (text: string) => Math.ceil(text.length / 4);

  let pendingParagraphs: StitchedElement[] = [];
  let pendingTokens = 0;

  const flushParagraphs = () => {
    if (pendingParagraphs.length === 0) return;

    const first = pendingParagraphs[0];
    const last = pendingParagraphs[pendingParagraphs.length - 1];
    const headingBreadcrumb = formatHeadingPath(first.headingPath);

    const bodyText = pendingParagraphs
      .map((p) => {
        const el = p.element;
        if (el.type === 'paragraph') return el.text;
        if (el.type === 'list') {
          return el.items.map((it, i) => `${el.ordered ? `${i + 1}.` : '•'} ${it}`).join('\n');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');

    const contextualText = `[Document: ${documentTitle}] [Section: ${headingBreadcrumb}] [Type: text]\n${bodyText}`;

    chunks.push({
      documentId,
      collectionId,
      page: first.page,
      endPage: last.page !== first.page ? last.page : undefined,
      elementType: 'paragraph',
      headingPath: first.headingPath,
      text: contextualText,
      rawText: bodyText,
      rawStructured: pendingParagraphs.map((p) => p.element),
      bbox: first.element.bbox,
      pageImageRef: first.imageRef,
      tokenCount: estimateTokens(contextualText),
    });

    pendingParagraphs = [];
    pendingTokens = 0;
  };

  for (let i = 0; i < stitched.elements.length; i++) {
    const item = stitched.elements[i];
    const el = item.element;
    const headingBreadcrumb = formatHeadingPath(item.headingPath);

    if (el.type === 'table') {
      flushParagraphs();

      const tableCaption = el.caption ? `Caption: ${el.caption}\n` : '';
      const tableUnits = el.units ? `Units: ${el.units}\n` : '';
      const headers = normalizedHeaders(el.headers);
      const markdown = tableMarkdown(headers, el.rows, el.markdown);
      const rawText = `${tableCaption}${tableUnits}${markdown}`.trim();

      // If table is very large (> 60 rows), split into row groups repeating headers
      const rows = el.rows || [];
      if (rows.length > 50) {
        const batchSize = 35;
        const headerRow = headers;
        const headerMd = `| ${headerRow.join(' | ')} |\n| ${headerRow.map(() => '---').join(' | ')} |`;

        for (let r = 0; r < rows.length; r += batchSize) {
          const sliceRows = rows.slice(r, r + batchSize);
          const partMd = `${headerMd}\n${sliceRows.map((row) => `| ${row.join(' | ')} |`).join('\n')}`;
          const partRawText = `${tableCaption}${tableUnits}(Rows ${r + 1} to ${r + sliceRows.length})\n${partMd}`;
          const contextualText = `[Document: ${documentTitle}] [Section: ${headingBreadcrumb}] [Type: table]\n${partRawText}`;

          chunks.push({
            documentId,
            collectionId,
            page: item.page,
            endPage: item.endPage,
            elementType: 'table',
            headingPath: item.headingPath,
            text: contextualText,
            rawText: partRawText,
            rawStructured: {
              ...el,
              rows: sliceRows,
              part: `${r + 1}-${r + sliceRows.length}`,
            },
            bbox: el.bbox,
            pageImageRef: item.imageRef,
            tokenCount: estimateTokens(contextualText),
          });
        }
      } else {
        const contextualText = `[Document: ${documentTitle}] [Section: ${headingBreadcrumb}] [Type: table]\n${rawText}`;
        chunks.push({
          documentId,
          collectionId,
          page: item.page,
          endPage: item.endPage,
          elementType: 'table',
          headingPath: item.headingPath,
          text: contextualText,
          rawText,
          rawStructured: el,
          bbox: el.bbox,
          pageImageRef: item.imageRef,
          tokenCount: estimateTokens(contextualText),
        });
      }
    } else if (el.type === 'chart') {
      flushParagraphs();

      const seriesText = el.series
        .map((s) => {
          const points = s.data.map((d) => `(${d.x}: ${d.y}${d.label ? ` ${d.label}` : ''})`).join(', ');
          return `Series "${s.name}"${s.unit ? ` [${s.unit}]` : ''}: ${points}`;
        })
        .join('\n');

      const rawText = [
        `Chart Title: ${el.title || 'Untitled Chart'}`,
        `Type: ${el.chartType}`,
        el.xAxisLabel ? `X-Axis: ${el.xAxisLabel}${el.xAxisUnit ? ` (${el.xAxisUnit})` : ''}` : '',
        el.yAxisLabel ? `Y-Axis: ${el.yAxisLabel}${el.yAxisUnit ? ` (${el.yAxisUnit})` : ''}` : '',
        seriesText,
        `Trend Summary: ${el.summary}`,
        el.estimatedValues ? '(Values estimated visually from chart rendering)' : '',
      ]
        .filter(Boolean)
        .join('\n');

      const contextualText = `[Document: ${documentTitle}] [Section: ${headingBreadcrumb}] [Type: chart]\n${rawText}`;

      chunks.push({
        documentId,
        collectionId,
        page: item.page,
        elementType: 'chart',
        headingPath: item.headingPath,
        text: contextualText,
        rawText,
        rawStructured: el,
        bbox: el.bbox,
        pageImageRef: item.imageRef,
        tokenCount: estimateTokens(contextualText),
      });
    } else if (el.type === 'figure') {
      flushParagraphs();

      const rawText = [
        el.caption ? `Caption: ${el.caption}` : '',
        `Description: ${el.description}`,
        el.containedText ? `Contained Text: ${el.containedText}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const contextualText = `[Document: ${documentTitle}] [Section: ${headingBreadcrumb}] [Type: figure]\n${rawText}`;

      chunks.push({
        documentId,
        collectionId,
        page: item.page,
        elementType: 'figure',
        headingPath: item.headingPath,
        text: contextualText,
        rawText,
        rawStructured: el,
        bbox: el.bbox,
        pageImageRef: item.imageRef,
        tokenCount: estimateTokens(contextualText),
      });
    } else if (el.type === 'equation') {
      flushParagraphs();

      const rawText = `LaTeX: ${el.latex}${el.text ? `\nDescription: ${el.text}` : ''}`;
      const contextualText = `[Document: ${documentTitle}] [Section: ${headingBreadcrumb}] [Type: equation]\n${rawText}`;

      chunks.push({
        documentId,
        collectionId,
        page: item.page,
        elementType: 'equation',
        headingPath: item.headingPath,
        text: contextualText,
        rawText,
        rawStructured: el,
        bbox: el.bbox,
        pageImageRef: item.imageRef,
        tokenCount: estimateTokens(contextualText),
      });
    } else if (el.type === 'heading') {
      flushParagraphs();
      // Headings update headingPath and don't need isolated chunks unless long
    } else if (el.type === 'paragraph' || el.type === 'list') {
      const sourceText = el.type === 'paragraph' ? el.text : el.items.join(' ');
      const tokens = estimateTokens(sourceText);

      if (pendingTokens + tokens > 500) {
        flushParagraphs();
      }

      pendingParagraphs.push(item);
      pendingTokens += tokens;
    } else {
      // footnotes, header_footer
      flushParagraphs();
    }
  }

  flushParagraphs();

  logger.info({ documentId, totalChunks: chunks.length }, 'Stage 5 complete: Prepared chunks');
  return chunks;
}

function tableMarkdown(headers: string[], rows: string[][], suppliedMarkdown: string): string {
  if (suppliedMarkdown.trim()) return suppliedMarkdown.trim();
  if (headers.length === 0) return rows.map((row) => row.join(' | ')).join('\n');
  const header = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
  return [header, separator, body].filter(Boolean).join('\n');
}

function normalizedHeaders(headers: unknown): string[] {
  if (!Array.isArray(headers)) return [];
  return headers.flat(Infinity).filter((value): value is string => typeof value === 'string');
}
