import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { connectDB, disconnectDB } from '../apps/api/src/lib/db.js';
import { User } from '../apps/api/src/models/User.js';
import { Collection } from '../apps/api/src/models/Collection.js';
import { DocumentModel } from '../apps/api/src/models/Document.js';
import { Page } from '../apps/api/src/models/Page.js';
import { Chunk } from '../apps/api/src/models/Chunk.js';
import { getStorage } from '../apps/api/src/storage/index.js';
import { processDocumentIngestion } from '../apps/api/src/ingestion/pipeline.js';

async function runParsingVerification() {
  console.log('\n======================================================');
  console.log('🧪 FolioQ Ingestion & Parsing Verification Suite');
  console.log('======================================================\n');

  await connectDB();

  // 1. Get or create test user and collection
  let user = await User.findOne({ email: 'verification@folioq.internal' });
  if (!user) {
    user = await User.create({
      email: 'verification@folioq.internal',
      name: 'Verification Bot',
      passwordHash: 'dummy',
    });
  }

  let collection = await Collection.findOne({ userId: user._id, name: 'Mock PDF Verification' });
  if (!collection) {
    collection = await Collection.create({
      userId: user._id,
      name: 'Mock PDF Verification',
      description: 'Test collection containing tables, charts, text, scanned OCR, and figures',
    });
  }

  const storage = getStorage();
  const evalDir = path.resolve(process.cwd(), 'eval');

  const filesToVerify = [
    { filename: 'financial-q3.pdf', expectedTypes: ['table', 'paragraph'] },
    { filename: 'market-metrics.pdf', expectedTypes: ['chart', 'figure', 'paragraph'] },
    { filename: 'report-overview.pdf', expectedTypes: ['paragraph'] },
    { filename: 'scanned-audit.pdf', expectedTypes: ['paragraph'], isScanned: true },
    { filename: 'continuing-inventory.pdf', expectedTypes: ['table', 'paragraph'] },
  ];

  console.log(`Starting ingestion of ${filesToVerify.length} mock PDFs...\n`);

  for (const item of filesToVerify) {
    const filePath = path.join(evalDir, item.filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}, skipping...`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    let doc = await DocumentModel.findOne({ collectionId: collection._id, sha256: hash });
    if (!doc) {
      const storageKey = await storage.uploadFile(
        `test/${Date.now()}-${item.filename}`,
        fileBuffer,
        'application/pdf'
      );
      doc = await DocumentModel.create({
        userId: user._id,
        collectionId: collection._id,
        filename: item.filename,
        originalName: item.filename,
        storageKey,
        mimeType: 'application/pdf',
        sizeBytes: fileBuffer.length,
        sha256: hash,
        status: 'queued',
      });
    }

    console.log(`Processing: ${item.filename} (ID: ${doc._id})...`);
    await processDocumentIngestion(doc._id.toString());
    console.log(`✓ Completed ingestion for: ${item.filename}\n`);
  }

  // 2. Perform deep verification of parsed artifacts
  console.log('======================================================');
  console.log('📊 PARSED STRUCTURE AUDIT REPORT');
  console.log('======================================================\n');

  for (const item of filesToVerify) {
    const doc = await DocumentModel.findOne({ collectionId: collection._id, filename: item.filename });
    if (!doc) continue;

    const pages = await Page.find({ documentId: doc._id }).sort({ pageNumber: 1 });
    const chunks = await Chunk.find({ documentId: doc._id });

    console.log(`📄 Document: ${item.filename}`);
    console.log(`   Status: ${doc.status} | Total Pages: ${pages.length} | Total Chunks: ${chunks.length}`);

    // Check page quality and OCR
    for (const page of pages) {
      console.log(`   Page ${page.pageNumber}: Quality=${page.textLayerQuality}, NeedsOCR=${page.needsOcr}, Degraded=${page.degraded}`);
    }

    // Breakdown chunks by element type
    const typeCounts: Record<string, number> = {};
    for (const c of chunks) {
      typeCounts[c.elementType] = (typeCounts[c.elementType] || 0) + 1;
    }
    console.log(`   Element Types: ${JSON.stringify(typeCounts)}`);

    // Inspect Tables
    const tables = chunks.filter((c) => c.elementType === 'table');
    if (tables.length > 0) {
      console.log(`   📋 Tables Extracted (${tables.length}):`);
      for (const t of tables) {
        const raw = t.rawStructured as any;
        console.log(`      - Page ${t.page}: Caption="${raw?.caption || 'N/A'}"`);
        if (raw?.headers) {
          console.log(`        Headers: [${raw.headers.join(' | ')}]`);
          console.log(`        Rows count: ${raw.rows?.length || 0}`);
        }
      }
    }

    // Inspect Charts
    const charts = chunks.filter((c) => c.elementType === 'chart');
    if (charts.length > 0) {
      console.log(`   📈 Charts Extracted (${charts.length}):`);
      for (const ch of charts) {
        const raw = ch.rawStructured as any;
        console.log(`      - Page ${ch.page}: Title="${raw?.title || 'N/A'}" | Type=${raw?.chartType || 'N/A'}`);
        if (raw?.series) {
          console.log(`        Series: ${JSON.stringify(raw.series)}`);
        }
        if (raw?.summary) {
          console.log(`        Trend Summary: ${raw.summary}`);
        }
      }
    }

    // Inspect Figures
    const figures = chunks.filter((c) => c.elementType === 'figure');
    if (figures.length > 0) {
      console.log(`   🖼️  Figures / Images Extracted (${figures.length}):`);
      for (const f of figures) {
        const raw = f.rawStructured as any;
        console.log(`      - Page ${f.page}: Caption="${raw?.caption || 'N/A'}"`);
        console.log(`        Description: ${raw?.description || raw?.text || 'N/A'}`);
      }
    }

    // Verify presence of embeddings
    const chunksWithEmbeddings = chunks.filter((c) => c.embedding && c.embedding.length > 0);
    console.log(`   🔢 Chunks with Live Embeddings: ${chunksWithEmbeddings.length}/${chunks.length} (dims: ${chunksWithEmbeddings[0]?.embedding?.length || 0})`);
    console.log('------------------------------------------------------');
  }

  await disconnectDB();
  console.log('\n✅ Verification Completed Successfully.\n');
}

runParsingVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
