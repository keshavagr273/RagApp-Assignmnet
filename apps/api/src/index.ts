import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { logger } from './lib/logger.js';
import { connectDB } from './lib/db.js';
import { connectRedis } from './lib/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';
import collectionsRouter from './routes/collections.js';
import documentsRouter from './routes/documents.js';
import threadsRouter from './routes/threads.js';
import uploadRouter from './routes/upload.js';
import { env } from './lib/env.js';
import { getIngestionQueue } from './queue/index.js';
import { processDocumentIngestion } from './ingestion/pipeline.js';

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/collections', uploadRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/threads', threadsRouter);

app.use(errorHandler);

async function start() {
  await connectDB();
  await connectRedis();

  // Start background ingestion worker
  const queue = getIngestionQueue();
  await queue.startWorker(async (data) => {
    await processDocumentIngestion(data.documentId);
  });

  app.listen(env.PORT, '0.0.0.0', () => {
    logger.info({ port: env.PORT, host: '0.0.0.0' }, 'FolioQ API started and ready');
  });
}

start().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
