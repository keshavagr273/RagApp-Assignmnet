import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from workspace root or current dir
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/folioq'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(32).default('default_jwt_access_secret_folioq_development_minimum_32_chars'),
  JWT_REFRESH_SECRET: z.string().min(32).default('default_jwt_refresh_secret_folioq_development_minimum_32_chars'),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),

  // LLM - optional, stubs used if absent
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_BASE_URL: z.string().optional(),
  LLM_MODEL: z.string().default('gemini-2.5-flash'),
  LLM_VISION_MODEL: z.string().default('gemini-2.5-flash'),

  // Embeddings - optional
  VOYAGE_API_KEY: z.string().optional(),
  COHERE_API_KEY: z.string().optional(),
  EMBED_MODEL: z.string().default('embed-english-v3.0'),
  EMBED_DIMENSIONS: z.coerce.number().default(1024),

  // Vector store
  MONGODB_USE_ATLAS: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true' || val === '1')
    .default(false),

  // Storage
  STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
  AWS_REGION: z.string().optional(),
  AWS_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // Ingestion
  INGESTION_CONCURRENCY: z.coerce.number().default(3),
  VISION_PAGE_CONCURRENCY: z.coerce.number().default(5),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  LLM_RATE_LIMIT_MAX: z.coerce.number().default(10),
});

export type Env = z.infer<typeof EnvSchema>;

function parseEnv(): Env {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten());
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
