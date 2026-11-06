import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { connectDB, disconnectDB } from '../lib/db.js';
import { User } from '../models/User.js';
import { Collection } from '../models/Collection.js';
import { DocumentModel } from '../models/Document.js';
import { Chunk } from '../models/Chunk.js';
import { getStorage } from '../storage/index.js';
import { processDocumentIngestion } from '../ingestion/pipeline.js';
import { logger } from '../lib/logger.js';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npx tsx src/cli/ingest.ts <path-to-pdf>');
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`📄 FolioQ Ingestion CLI Tester`);
  console.log(`Testing PDF: ${resolvedPath}`);
  console.log(`========================================\n`);

  await connectDB();

  // Create or get test user
  let user = await User.findOne({ email: 'cli-test@folioq.internal' });
  if (!user) {
    user = await User.create({
      email: 'cli-test@folioq.internal',
      name: 'CLI Tester',
      passwordHash: 'dummy',
    });
  }

  // Create or get test collection
  let collection = await Collection.findOne({ userId: user._id, name: 'CLI Ingestion Test' });
  if (!collection) {
    collection = await Collection.create({
      userId: user._id,
      name: 'CLI Ingestion Test',
      description: 'Temporary collection for CLI ingestion testing',
    });
  }

  const fileBuffer = fs.readFileSync(resolvedPath);
  const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const filename = `${crypto.randomUUID()}.pdf`;

  // Store file
  const storage = getStorage();
  await storage.uploadFile(filename, fileBuffer, 'application/pdf');

  // Create document
  const doc = await DocumentModel.create({
    userId: user._id,
    collectionId: collection._id,
    filename,
    originalName: path.basename(resolvedPath),
    mimeType: 'application/pdf',
    sizeBytes: fileBuffer.length,
    sha256,
    storageKey: filename,
    status: 'queued',
  });

  const startTime = Date.now();
  console.log(`[Ingestion] Starting 6-stage pipeline for Document ID: ${doc._id}...`);

  await processDocumentIngestion(doc._id.toString());

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ Ingestion completed in ${elapsed}s!\n`);

  // Inspect generated chunks
  const chunks = await Chunk.find({ documentId: doc._id }).sort({ page: 1 });
  console.log(`📊 Chunks generated: ${chunks.length}`);

  const counts: Record<string, number> = {};
  for (const c of chunks) {
    counts[c.elementType] = (counts[c.elementType] || 0) + 1;
  }
  console.log('Breakdown by Element Type:');
  for (const [type, count] of Object.entries(counts)) {
    console.log(`  - ${type}: ${count}`);
  }

  console.log('\n--- Chunk Previews ---');
  chunks.slice(0, 5).forEach((c, i) => {
    console.log(`\n[Chunk ${i + 1}] Type: ${c.elementType} | Page: ${c.page} | Tokens: ~${c.tokenCount}`);
    console.log(`Heading: ${c.headingPath.map((h) => h.text).join(' > ') || 'None'}`);
    console.log(`Text preview: ${c.text.substring(0, 200).replace(/\n/g, ' ')}...`);
  });

  await disconnectDB();
  console.log('\n========================================\n');
}

main().catch((err) => {
  console.error('Fatal CLI error:', err);
  process.exit(1);
});

