import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { logger } from '../lib/logger.js';

export interface NativeTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
}

export interface NativePageExtract {
  pageNumber: number;
  textLayerQuality: 'good' | 'poor' | 'none';
  needsOcr: boolean;
  rawText: string;
  items: NativeTextItem[];
}

export async function stage2NativeExtraction(
  documentId: string,
  pdfBuffer: Buffer
): Promise<NativePageExtract[]> {
  logger.info({ documentId }, 'Stage 2: Extracting native text layers and layout');

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const extractedPages: NativePageExtract[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items: NativeTextItem[] = [];
    let fullText = '';

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str) continue;

      const tx = item.transform;
      const x = tx[4];
      const y = tx[5];
      const fontSize = Math.hypot(tx[2], tx[3]) || item.height || 10;

      items.push({
        text: item.str,
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        width: Math.round(item.width * 100) / 100,
        height: Math.round(item.height * 100) / 100,
        fontSize: Math.round(fontSize * 100) / 100,
        fontName: item.fontName || '',
      });
    }

    // Sort items into natural reading order:
    // Group into horizontal lines with a Y tolerance (e.g. 4 points), then sort X left to right
    items.sort((a, b) => {
      if (Math.abs(b.y - a.y) > 4) {
        return b.y - a.y; // Top to bottom (PDF Y is 0 at bottom)
      }
      return a.x - b.x; // Left to right
    });

    // Reconstruct lines of text
    const lines: string[] = [];
    let currentLine: NativeTextItem[] = [];
    let lastY = -1;

    for (const it of items) {
      if (lastY === -1 || Math.abs(it.y - lastY) <= 4) {
        currentLine.push(it);
        lastY = it.y;
      } else {
        lines.push(currentLine.map((c) => c.text).join(' '));
        currentLine = [it];
        lastY = it.y;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine.map((c) => c.text).join(' '));
    }

    fullText = lines.join('\n').trim();

    // Assess text layer quality
    const charCount = fullText.length;
    const alphanumericCount = (fullText.match(/[a-zA-Z0-9]/g) || []).length;
    const alphanumericRatio = charCount > 0 ? alphanumericCount / charCount : 0;

    let textLayerQuality: 'good' | 'poor' | 'none' = 'good';
    let needsOcr = false;

    if (charCount < 15 || alphanumericCount < 10) {
      textLayerQuality = 'none';
      needsOcr = true;
    } else if (charCount < 60 || alphanumericRatio < 0.4) {
      textLayerQuality = 'poor';
      needsOcr = true;
    }

    extractedPages.push({
      pageNumber: pageNum,
      textLayerQuality,
      needsOcr,
      rawText: fullText,
      items,
    });
  }

  logger.info({ documentId, totalPages: numPages }, 'Stage 2 complete: Native extraction done');
  return extractedPages;
}

