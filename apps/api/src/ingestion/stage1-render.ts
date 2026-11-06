import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { getStorage } from '../storage/index.js';
import { logger } from '../lib/logger.js';

export interface RenderedPage {
  pageNumber: number;
  imageRef: string;
  imageBuffer: Buffer;
  width: number;
  height: number;
}

export async function stage1RenderPages(
  documentId: string,
  pdfBuffer: Buffer
): Promise<RenderedPage[]> {
  logger.info({ documentId }, 'Stage 1: Rendering PDF pages to PNG (150-200 DPI)');
  const storage = getStorage();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const renderedPages: RenderedPage[] = [];

  // Render at scale 2.0 (approx 150-200 DPI for standard 72 DPI PDF points)
  const scale = 2.0;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
    const context = canvas.getContext('2d');

    await page.render({
      canvasContext: context as any,
      viewport,
      canvas: canvas as any,
    } as any).promise;

    const imageBuffer = canvas.toBuffer('image/png');
    const imageKey = `pages/${documentId}/page-${pageNum}.png`;

    await storage.uploadFile(imageKey, imageBuffer, 'image/png');

    renderedPages.push({
      pageNumber: pageNum,
      imageRef: imageKey,
      imageBuffer,
      width: Math.floor(viewport.width),
      height: Math.floor(viewport.height),
    });
  }

  logger.info({ documentId, totalPages: numPages }, 'Stage 1 complete: Rendered all pages');
  return renderedPages;
}
