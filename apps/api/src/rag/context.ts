import { RetrievedChunk } from './retrieval.js';
import { DocumentModel } from '../models/Document.js';
import { getStorage } from '../storage/index.js';
import { VisionImage } from '../providers/llm/llm.interface.js';
import { logger } from '../lib/logger.js';
import mongoose from 'mongoose';

export interface CitationItem {
  id: string;
  documentId: string;
  documentTitle: string;
  page: number;
  chunkId: string;
  elementType: string;
  excerpt: string;
  bbox?: { x: number; y: number; width: number; height: number };
  pageImageRef?: string;
}

export interface AssembledContext {
  promptText: string;
  citations: CitationItem[];
  tables: any[];
  charts: any[];
  pageImages: VisionImage[];
  sourcePages: number[];
}

export async function assembleContext(
  chunks: RetrievedChunk[],
  attachVisuals = false
): Promise<AssembledContext> {
  const storage = getStorage();

  // Load document titles in bulk
  const docIds = Array.from(new Set(chunks.map((c) => c.chunk.documentId.toString())));
  const docs = await DocumentModel.find({
    _id: { $in: docIds.map((id) => new mongoose.Types.ObjectId(id)) },
  }).lean();

  const titleMap = new Map<string, string>();
  for (const d of docs) {
    titleMap.set(d._id.toString(), d.originalName);
  }

  const citations: CitationItem[] = [];
  const tables: any[] = [];
  const charts: any[] = [];
  const distinctPages = new Set<string>(); // key: `${docId}-${page}`
  const pageImages: VisionImage[] = [];
  const sourcePages: number[] = [];

  let contextBuilder = '### GROUNDING DOCUMENTS CONTEXT:\n\n';

  for (let idx = 0; idx < chunks.length; idx++) {
    const { chunk } = chunks[idx];
    const docTitle = titleMap.get(chunk.documentId.toString()) || 'Document';
    const chunkId = chunk._id.toString();

    // Citation item
    citations.push({
      id: `cite-${idx + 1}`,
      documentId: chunk.documentId.toString(),
      documentTitle: docTitle,
      page: chunk.page,
      chunkId,
      elementType: chunk.elementType,
      excerpt: chunk.rawText ? chunk.rawText.slice(0, 180) : chunk.text.slice(0, 180),
      bbox: chunk.bbox,
      pageImageRef: chunk.pageImageRef,
    });

    if (!sourcePages.includes(chunk.page)) {
      sourcePages.push(chunk.page);
    }

    // Accumulate structured tables and charts for rich frontend rendering
    if (chunk.elementType === 'table' && chunk.rawStructured) {
      tables.push(chunk.rawStructured);
    }
    if (chunk.elementType === 'chart' && chunk.rawStructured) {
      charts.push(chunk.rawStructured);
    }

    // Text representation for LLM prompt
    contextBuilder += `[SOURCE ${idx + 1}] (Document: "${docTitle}", Page: ${chunk.page}, Type: ${chunk.elementType})\n${chunk.text}\n\n`;

    // Track pages for visual attachment
    const pageKey = `${chunk.documentId}-${chunk.page}`;
    if (!distinctPages.has(pageKey) && (attachVisuals || chunk.elementType === 'chart' || chunk.elementType === 'figure')) {
      distinctPages.add(pageKey);
    }
  }

  // Load images for up to 4 top pages if visual verification is desired
  if (attachVisuals || distinctPages.size > 0) {
    const pagesToLoad = Array.from(distinctPages).slice(0, 4);
    for (const key of pagesToLoad) {
      const [docId, pageNum] = key.split('-');
      const imagePath = `pages/${docId}/page-${pageNum}.png`;
      try {
        const buffer = await storage.getFile(imagePath);
        pageImages.push({
          buffer,
          mimeType: 'image/png',
        });
      } catch (err: any) {
        logger.warn({ imagePath, error: err.message }, 'Could not load page image for visual grounding');
      }
    }
  }

  return {
    promptText: contextBuilder.trim(),
    citations,
    tables,
    charts,
    pageImages,
    sourcePages,
  };
}

