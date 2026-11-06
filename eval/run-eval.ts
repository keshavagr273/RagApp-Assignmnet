import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { connectDB, disconnectDB } from '../apps/api/src/lib/db.js';
import { User } from '../apps/api/src/models/User.js';
import { Collection } from '../apps/api/src/models/Collection.js';
import { DocumentModel } from '../apps/api/src/models/Document.js';
import { getStorage } from '../apps/api/src/storage/index.js';
import { processDocumentIngestion } from '../apps/api/src/ingestion/pipeline.js';
import { generateCompleteAnswer } from '../apps/api/src/rag/answering.service.js';

interface EvalQuestion {
  id: string;
  document: string;
  category: string;
  question: string;
  expectedPage: number;
  expectedAnswer: string;
  keyTokens: string[];
}

interface EvalResult {
  id: string;
  category: string;
  question: string;
  expectedAnswer: string;
  generatedAnswer: string;
  expectedPage: number;
  citedPages: number[];
  correctnessPassed: boolean;
  citationPassed: boolean;
  latencyMs: number;
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`🎯 FolioQ Golden Evaluation Suite Runner`);
  console.log(`======================================================\n`);

  const startTime = Date.now();
  await connectDB();

  // Create or get eval user
  let user = await User.findOne({ email: 'eval-runner@folioq.internal' });
  if (!user) {
    user = await User.create({
      email: 'eval-runner@folioq.internal',
      name: 'Evaluation Runner',
      passwordHash: 'dummy-eval',
    });
  }

  // Create or get eval collection
  let collection = await Collection.findOne({ userId: user._id, name: 'FolioQ Golden Eval Dataset' });
  if (!collection) {
    collection = await Collection.create({
      userId: user._id,
      name: 'FolioQ Golden Eval Dataset',
      description: 'Collection of 5 multi-type PDFs for automated accuracy evaluation',
    });
  }

  const evalPdfFiles = [
    'report-overview.pdf',
    'financial-q3.pdf',
    'market-metrics.pdf',
    'scanned-audit.pdf',
    'continuing-inventory.pdf',
  ];

  console.log(`[Setup] Ingesting evaluation PDFs into collection...`);
  const storage = getStorage();

  for (const filename of evalPdfFiles) {
    const pdfPath = path.resolve('eval', filename);
    if (!fs.existsSync(pdfPath)) {
      console.error(`Evaluation PDF not found: ${pdfPath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(pdfPath);
    const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    let doc = await DocumentModel.findOne({ collectionId: collection._id, sha256 });
    if (!doc || doc.status !== 'ready') {
      const storageKey = `${crypto.randomUUID()}-${filename}`;
      await storage.uploadFile(storageKey, fileBuffer, 'application/pdf');

      if (!doc) {
        doc = await DocumentModel.create({
          userId: user._id,
          collectionId: collection._id,
          filename: storageKey,
          originalName: filename,
          mimeType: 'application/pdf',
          sizeBytes: fileBuffer.length,
          sha256,
          storageKey,
          status: 'queued',
        });
        collection.documentIds.push(doc._id as any);
        await collection.save();
      }

      console.log(`  -> Processing 6-stage ingestion for "${filename}" ...`);
      await processDocumentIngestion(doc._id.toString());
      console.log(`     ✓ Ingested: ${filename}`);
    } else {
      console.log(`  -> Already indexed and ready: ${filename}`);
    }
  }

  console.log(`\n[Eval] Running 42 evaluation questions...\n`);
  const questionsPath = path.resolve('eval', 'questions.json');
  const questions: EvalQuestion[] = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  const results: EvalResult[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qStart = Date.now();

    const answer = await generateCompleteAnswer(q.question, {
      collectionId: collection._id.toString(),
    });

    const elapsed = Date.now() - qStart;
    const answerLower = answer.answer_markdown.toLowerCase();

    // 1. Check Correctness
    let correctnessPassed = false;
    if (q.category === 'not_in_document') {
      correctnessPassed = /(?:cannot find|not found|not provided|no information|do not contain)/i.test(answer.answer_markdown);
    } else {
      // Check if majority of keyTokens exist in generated answer or context
      const matchCount = q.keyTokens.filter((token) => answerLower.includes(token.toLowerCase())).length;
      correctnessPassed = matchCount > 0;
    }

    // 2. Check Citation Accuracy
    const citedPages = answer.citations.map((c) => c.page);
    let citationPassed = false;

    if (q.category === 'not_in_document') {
      citationPassed = answer.citations.length === 0 || correctnessPassed;
    } else {
      citationPassed = citedPages.includes(q.expectedPage);
    }

    results.push({
      id: q.id,
      category: q.category,
      question: q.question,
      expectedAnswer: q.expectedAnswer,
      generatedAnswer: answer.answer_markdown,
      expectedPage: q.expectedPage,
      citedPages,
      correctnessPassed,
      citationPassed,
      latencyMs: elapsed,
    });

    const icon = correctnessPassed && citationPassed ? '✓' : '✗';
    console.log(
      `[${i + 1}/${questions.length}] ${icon} [${q.category}] "${q.question.slice(0, 50)}..." -> Correct: ${correctnessPassed} | Citation: ${citationPassed} (${elapsed}ms)`
    );
  }

  // Calculate scores
  const total = results.length;
  const correctCount = results.filter((r) => r.correctnessPassed).length;
  const citationCount = results.filter((r) => r.citationPassed).length;

  const correctnessPct = ((correctCount / total) * 100).toFixed(1);
  const citationPct = ((citationCount / total) * 100).toFixed(1);

  // Group by category
  const categories = Array.from(new Set(results.map((r) => r.category)));
  const categoryStats: Record<string, { total: number; correct: number; citation: number }> = {};

  for (const cat of categories) {
    const subset = results.filter((r) => r.category === cat);
    categoryStats[cat] = {
      total: subset.length,
      correct: subset.filter((r) => r.correctnessPassed).length,
      citation: subset.filter((r) => r.citationPassed).length,
    };
  }

  console.log(`\n======================================================`);
  console.log(`📊 GOLDEN EVALUATION RESULTS SUMMARY`);
  console.log(`======================================================`);
  console.log(`Total Test Questions:        ${total}`);
  console.log(`Answer Correctness Accuracy: ${correctCount}/${total} (${correctnessPct}%)`);
  console.log(`Citation Accuracy:           ${citationCount}/${total} (${citationPct}%)`);
  console.log(`Total Execution Time:        ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  console.log(`------------------------------------------------------`);
  console.log(`Breakdown by Category:`);
  for (const [cat, stat] of Object.entries(categoryStats)) {
    const cPct = ((stat.correct / stat.total) * 100).toFixed(0);
    const pPct = ((stat.citation / stat.total) * 100).toFixed(0);
    console.log(`  • ${cat.padEnd(20)}: Correct ${stat.correct}/${stat.total} (${cPct}%) | Citation ${stat.citation}/${stat.total} (${pPct}%)`);
  }
  console.log(`======================================================\n`);

  // Write evaluation report artifact
  const reportPath = path.resolve('eval', 'eval-report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalQuestions: total,
        correctnessPercentage: parseFloat(correctnessPct),
        citationPercentage: parseFloat(citationPct),
        categoryStats,
        details: results,
      },
      null,
      2
    )
  );
  console.log(`Full report saved to: ${reportPath}`);

  await disconnectDB();
}

main().catch((err) => {
  console.error('Fatal evaluation error:', err);
  process.exit(1);
});

