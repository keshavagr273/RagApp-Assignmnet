<p align="center">
  <img src="docs/assets/logo.svg" alt="FolioQ Logo" width="130" style="border-radius: 28px; box-shadow: 0 16px 36px rgba(0,0,0,0.35);" />
  <h1 align="center">FolioQ</h1>
  <p align="center">
    <strong>Production-Grade Multimodal PDF Intelligence & Grounded Architecture Platform</strong><br/>
    <em>Faithful Multi-Stage Ingestion, Vision Page Understanding, Semantic Chunking, Parallel Hybrid RAG, and Verifiable Source-Page Citations.</em>
  </p>
  <p align="center">
    <a href="#-quick-start"><img src="https://img.shields.io/badge/Docker-dev_stack-2496ED?logo=docker&logoColor=white" alt="Docker"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e.svg" alt="MIT License"></a>
    <img src="https://img.shields.io/badge/TypeScript-5.x_Strict-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61DAFB?logo=react&logoColor=black" alt="React 18 + Vite">
    <img src="https://img.shields.io/badge/Backend-Node.js_20_%2B_Express-339933?logo=node.js&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/Database-MongoDB_Atlas_%2B_BM25-47A248?logo=mongodb&logoColor=white" alt="MongoDB Atlas">
    <img src="https://img.shields.io/badge/Vector_Embeddings-Cohere_1024d-395B64" alt="Cohere Embeddings">
    <img src="https://img.shields.io/badge/Queue-BullMQ_%2B_Redis-D82C20?logo=redis&logoColor=white" alt="BullMQ + Redis">
    <img src="https://img.shields.io/badge/Design-Strict_Flat_Editorial-1F4D3A" alt="Strict Flat Editorial">
    <img src="https://img.shields.io/badge/AI_Law-Evidence_Over_Inference-10B981" alt="Evidence Over Inference">
  </p>
  <p align="center">
    <a href="#-what-is-folioq">About</a> · 
    <a href="#-the-problem">The Problem</a> · 
    <a href="#-features">Features</a> · 
    <a href="#-pipeline-workflow">Pipeline</a> · 
    <a href="#-feature-comparison">Comparison</a> · 
    <a href="#-quick-start">Quick Start</a> · 
    <a href="#-configuration-reference">Configuration</a> · 
    <a href="#-api-documentation">API Docs</a> · 
    <a href="#-monorepo-structure">Structure</a> · 
    <a href="#-golden-evaluation-suite">Evaluation</a>
  </p>
</p>

---

## What is FolioQ?

> **"Every PDF is parsed faithfully, and every answer is correct, grounded in the documents, and cites its source page."**

**FolioQ** is an enterprise-grade, multimodal document intelligence and grounded Q&A platform engineered specifically for complex, mission-critical PDF documents. It transforms heterogeneous PDF files containing text, financial tables, time-series charts, engineering diagrams, and scanned records into faithfully extracted, structured knowledge bases with zero hallucination tolerance.

Generic "Chat-with-PDF" tools fail catastrophically on real-world business and technical documents: they rip out unformatted text streams, flatten complex multi-row tables into unreadable garbage, completely ignore visual bar/line/pie charts, and cite imaginary page numbers.

FolioQ solves this with a strict **Evidence Over Inference** philosophy:

- **Faithful 6-Stage Multi-Modal Ingestion** — High-resolution 150–200 DPI page rendering (`@napi-rs/canvas`), native coordinate layout extraction (`pdfjs-dist`), structured vision element parsing, cross-page table continuation stitching, and semantic element chunking.
- **Multimodal Page Understanding** — Vision-capable LLMs (Claude Opus / Gemini 2.5 Flash / Groq) extract structured 2D tables, full chart time-series coordinate points with trend summaries, and figure descriptions, validated strictly with Zod schemas.
- **Parallel Hybrid Retrieval (Vector + BM25)** — Dense 1024-dimensional semantic search (Cohere / Voyage / OpenAI) runs in parallel with sparse MongoDB text search, fused via **Reciprocal Rank Fusion ($RRF = \sum \frac{1}{60 + r_i}$)** with intent-driven boosting for tables and charts.
- **Visual Grounding & Verification Pass** — High-resolution page crops of retrieved candidates are fed alongside extracted text to the answering engine. A secondary deterministic verification pass audits every cited number and claim, preventing phantom citations.
- **Interactive Human-Centered Editorial Workspace** — Built with React 18, TanStack Query, and Tailwind CSS. Adheres to strict human-centered design: **zero gradients**, hairline 1px borders, accessible contrast ratios, real interactive tables with CSV export, interactive Recharts visualizations, and a synced PDF viewer with flat ochre bounding-box highlights.

---

## The Problem

Navigating complex business and technical PDFs with traditional tools or generic AI wrappers leads to severe data corruption, blind spots, and hallucinations:

| What you need to do | Traditional Tools / Generic ChatPDF | With FolioQ |
|---|---|---|
| **Parse multi-page continuing financial tables** | Headers get lost; rows become unaligned text soup | **Deterministic Cross-Page Stitching**: Merges continuing tables and repeats headers across page boundaries |
| **Extract data from bar/line/pie charts** | Completely ignored or treated as blank space | **Multimodal Vision Extraction**: Extracts exact $(x, y)$ coordinates, legends, units, and trend summaries |
| **Read scanned image-only pages** | Fails silently with 0 extracted text | **Automatic OCR Fallback**: Flags `needsOcr`, routes through Tesseract and Vision models with visual checkpoints |
| **Verify numbers and mathematical calculations** | LLMs hallucinate calculations and invent percentages | **Dual Verification Pass**: Audits every number against source context and displays step-by-step arithmetic |
| **Locate exact visual evidence in the PDF** | Generic "Page 4" citation without context | **Interactive PDF Viewer**: Jumps to the exact page and highlights the element bounding box with flat ochre fill |
| **Chunking boundary integrity** | Arbitrary 500-token slicing cuts sentences and tables in half | **Semantic Element Chunking**: Tables and charts are preserved as whole atomic units with section heading breadcrumbs |
| **Cloud resilience & offline decoupling** | Cloud vendor lock-in; system crashes if AI provider drops | **Provider-Agnostic Interface**: Seamlessly toggles Anthropic, Gemini, Groq, Cohere, or internal offline Mock Engine |

---

## Features

### 1. Multi-Stage Ingestion Pipeline
- **Stage 1 (Page Rendering)**: Renders every page to a 150–200 DPI PNG using `pdfjs-dist` and native `@napi-rs/canvas`. Page images are stored for vision understanding and visual verification.
- **Stage 2 (Native Layout Extraction)**: Analyzes text layer density, coordinate bounding boxes, and reading order. Pages with missing or corrupted text layers are automatically flagged as `needsOcr`.
- **Stage 3 (Vision-Based Structured Understanding)**: Sends page images to vision LLMs with strict Zod structured output schemas. Extracts:
  - `table`: 2D row/column arrays, multi-row headers, captions, units, and Markdown representations.
  - `chart`: Chart type (bar, line, pie), title, axis labels, units, series coordinates $(x, y)$, and plain-language trend summaries.
  - `figure`: Visual diagrams, photos, technical architecture schemes, and stamped seals with descriptive captions.
  - `heading`, `paragraph`, `list`, `equation`, `footnote`, `header_footer`.
  - Self-healing JSON repair prompt (max 2 retries) with graceful native text fallback.
- **Stage 4 (Cross-Page Stitching)**: Detects continuing tables across page breaks by identifying matching column signatures and "continued" markers. Preserves multi-level heading breadcrumbs (`document → section → subsection`).
- **Stage 5 (Semantic Element Chunking)**:
  - A table is chunked as an atomic unit (large tables split by row groups with headers repeated).
  - A chart is chunked with title, axes, series data, and summary.
  - Paragraphs are grouped under their heading path with 300–600 token targets.
  - Every chunk preserves `documentId, collectionId, page, endPage, elementType, headingPath, bbox, pageImageRef`.
- **Stage 6 (Batch Indexing & Idempotent Vector Store)**: Embeds chunks in batches using dense vector models, stores vectors in MongoDB, and builds compound text indexes idempotently.

### 2. Grounded Multimodal RAG Engine
- **Query Understanding & Rewriting**: Rewrites follow-up questions into self-contained search queries and classifies intent (`lookup`, `calculation`, `visual_chart_table`, `comparison`, `summary`).
- **Parallel Hybrid Retrieval**: Vector cosine search ($k=35$) and MongoDB BM25 text search ($k=35$) run simultaneously.
- **Reciprocal Rank Fusion (RRF)**: Merges candidates using $RRF = \sum \frac{1}{60 + r_i}$ with dynamic weight boosting for `table` and `chart` chunks on numeric/visual queries.
- **Cross-Candidate Reranking**: Reranks top candidates down to the top 8 most relevant elements using lexical token overlap and heading hierarchy match.
- **Visual Context Assembly**: Attaches high-resolution rendered page images of top candidates directly to the answering model, allowing the LLM to inspect visual charts and figures.
- **Arithmetic Verification Pass**: Inspects the drafted response to verify that every number is present in the source context or is mathematically derivable, eliminating hallucinated statistics.
- **SSE Token Streaming**: Real-time token streaming with structured citation markers `[doc, p.N]` rendered as interactive pills.

### 3. Strict Human-Centered Editorial UI
- **Flat Solid Design System**: Absolutely **NO gradients anywhere** — no glassmorphism, no artificial glow, no non-functional visual noise.
- **Warm Editorial Color Palette**:
  - Paper: `#F6F3EC`
  - Surface: `#FFFFFF`
  - Ink: `#1C1B19`
  - Muted: `#6B665C`
  - Hairline Border: `#DDD7CA`
  - Forest Green Accent: `#1F4D3A`
  - Terracotta Secondary: `#B4532A`
  - Ochre Highlight: `#E3B04B`
- **Dark Mode**: Handcrafted with equal precision (`#141312` paper, `#1D1C19` surface, `#F2EFE9` ink).
- **Interactive Rich Answers**:
  - Real HTML `<table>` elements with sticky header rows, alternating hairline bands, and instant CSV export.
  - Accessible **Recharts** visualizations with bar and line charts, complete with a data-table toggle.
- **PDF Viewer with Bounding Box Synchronization**: Clicking any citation pill opens the document viewer at the exact cited page with a flat ochre bounding box highlight over the cited region.

### 4. Enterprise Architecture & Multi-Tenancy
- **Workspaces & Collections**: Users organize documents into isolated collections (e.g., "Q3 Financial Reports", "Security Audits").
- **Asynchronous Ingestion Worker**: Background job queue powered by **BullMQ + Redis** with concurrency control, exponential backoff, and in-memory queue fallback for zero-dependency local development.
- **Secure Authentication**: JWT access and refresh tokens stored strictly in `httpOnly` secure cookies.
- **Storage Abstraction Layer**: Pluggable storage adapters (`LocalStorageAdapter` for local development, `S3StorageAdapter` for AWS S3 / Cloudflare R2).

---

## Pipeline Workflow

```
┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│ Multi-PDF│    │  Stage 1:   │    │   Stage 2:   │    │  Stage 3:   │    │  Stage 4:   │
│ Upload   ├───►│ 150-200 DPI ├───►│ Native Layout├───►│ Multimodal  ├───►│ Cross-Page  │
│ SHA-256  │    │ Page Render │    │ & OCR Detect │    │ Vision Parse│    │ Stitching   │
└──────────┘    └─────────────┘    └──────────────┘    └─────────────┘    └──────┬──────┘
                                                                                 │
┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐           │
│ Grounded │    │ Reciprocal  │    │ Parallel     │    │  Stage 6:   │    ┌──────▼──────┐
│ Chat &   │◄───┤ Rank Fusion │◄───┤ Vector+BM25  │◄───┤ Dense Batch │◄───┤  Stage 5:   │
│ Citation │    │ Top-8 Rerank│    │ Hybrid Search│    │ Embed & Idx │    │ Semantic Chk│
└──────────┘    └─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
```

---

## Feature Comparison

| Capability | FolioQ | Generic ChatPDF | LangChain Template | Adobe Acrobat AI | NotebookLM |
|---|:---:|:---:|:---:|:---:|:---:|
| **Multimodal Vision Chart Extraction** | ✅ **Series coordinates $(x,y)$** | ❌ Text-only | ❌ | ⚠️ Basic Summary | ⚠️ Text-only |
| **Cross-Page Continuing Table Stitching** | ✅ **Deterministic headers** | ❌ Slices table | ❌ Unstructured | ⚠️ Partial | ❌ |
| **Parallel Hybrid Search (Vector + BM25)** | ✅ **RRF ($k=60$)** | ❌ Naive Vector | ⚠️ Optional | ❌ Unknown | ❌ Closed |
| **Exact Source Page & BBox Highlighting** | ✅ **Flat ochre highlight** | ⚠️ Page number only | ❌ Hallucinates | ⚠️ Jump to page | ⚠️ Snippet only |
| **Arithmetic Grounding & Number Audit** | ✅ **Dual-pass validator** | ❌ Hallucinates | ❌ | ❌ | ⚠️ Inferences |
| **Interactive In-Chat Tables & Charts** | ✅ **Sticky headers + Recharts**| ❌ Markdown text | ❌ Raw text | ❌ Plain text | ❌ Plain text |
| **Scanned Document OCR Detection** | ✅ **Automatic `needsOcr`** | ❌ Fails | ⚠️ Requires setup | ✅ Good | ⚠️ Good |
| **Zero-Gradient Human Editorial Design** | ✅ **Strict solid palette** | ❌ Generic SaaS | ❌ Default Tailwind | ❌ Corporate | ❌ Minimalist |
| **Local Offline Fallback Engine** | ✅ **100% Functional** | ❌ Cloud only | ⚠️ Complex | ❌ Cloud only | ❌ Cloud only |

---

## Quick Start

### Prerequisites
- **[Node.js 20+](https://nodejs.org/)** & `npm`
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (optional; local in-memory fallbacks work out-of-the-box!)
- **Git**

---

### Step 1: Clone and Configure

```bash
git clone https://github.com/keshavagr273/RagApp-Assignmnet.git folioq
cd folioq
cp .env.example .env
```

Edit `.env` with your MongoDB and API provider credentials (or leave defaults for local offline mode):

```env
# Server & Client
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Database (MongoDB Atlas or Local MongoDB)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.kxkeood.mongodb.net/folioq?retryWrites=true&w=majority
MONGODB_USE_ATLAS=true

# Redis (Upstash or Local Redis)
REDIS_URL=rediss://default:<password>@<host>:6379

# LLM Provider (Anthropic Claude, Gemini 2.5 Flash, or Groq)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
LLM_MODEL=gemini-2.5-flash
LLM_VISION_MODEL=gemini-2.5-flash

# Embeddings (Cohere 1024-dim, Voyage, or OpenAI)
COHERE_API_KEY=your_cohere_api_key
EMBED_MODEL=embed-english-v3.0
EMBED_DIMENSIONS=1024
```

---

### Step 2: Start Infrastructure Stack (Optional)

If running local database and Redis services via Docker:

```bash
# Start MongoDB and Redis containers
docker compose up -d
```

*(Note: FolioQ includes an in-memory queue and local cosine similarity fallback; Docker is completely optional).*

---

### Step 3: Run Ingestion Verification & Start Development Servers

```bash
# Install all monorepo dependencies
npm install

# Run build across all workspaces
npm run build

# Start both API and Web frontend concurrently
npm run dev
```

### Access Your Applications:
- 🌐 **Web Application**: [http://localhost:5173](http://localhost:5173)
- ⚙️ **Backend REST API**: [http://localhost:3001](http://localhost:3001)

---

### Step 4: Run the Golden Evaluation Suite

Run the automated evaluation benchmark across all 5 multi-type PDFs (financial tables, charts, scanned OCR, multi-page tables, and text overviews):

```bash
# Verify parsing across all mock PDFs
npm run verify:parsing

# Run the 42-question benchmark suite
npm run eval
```

---

## Configuration Reference

All environment variables are validated at startup with strict Zod schemas:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend Express API server port |
| `NODE_ENV` | `development` | Runtime environment (`development`, `test`, `production`) |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin for CORS |
| `MONGODB_URI` | `mongodb://localhost:27017/folioq` | MongoDB Atlas or local MongoDB connection string |
| `MONGODB_USE_ATLAS` | `false` | Enable Atlas Search `$vectorSearch` with automatic fallback to local cosine |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL for BullMQ job queue |
| `JWT_ACCESS_SECRET` | *(auto-generated)* | 32-character minimum secret for JWT access tokens |
| `JWT_REFRESH_SECRET` | *(auto-generated)* | 32-character minimum secret for JWT refresh tokens |
| `JWT_ACCESS_EXPIRES` | `15m` | Access token lifespan |
| `JWT_REFRESH_EXPIRES` | `7d` | Refresh token lifespan |
| `ANTHROPIC_API_KEY` | *(optional)* | Anthropic Claude API key for vision understanding and answering |
| `GEMINI_API_KEY` | *(optional)* | Google Gemini API key for vision and LLM operations |
| `GEMINI_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` | Gemini OpenAI-compatible endpoint URL |
| `OPENAI_API_KEY` | *(optional)* | OpenAI / Groq API key |
| `OPENAI_BASE_URL` | *(optional)* | OpenAI-compatible custom base URL (e.g., Groq `https://api.groq.com/openai/v1`) |
| `LLM_MODEL` | `gemini-2.5-flash` | Primary LLM model for answering and reasoning |
| `LLM_VISION_MODEL` | `gemini-2.5-flash` | Multimodal vision model for page parsing |
| `COHERE_API_KEY` | *(optional)* | Cohere API key for 1024-dim dense embeddings |
| `VOYAGE_API_KEY` | *(optional)* | Voyage AI API key for embeddings |
| `EMBED_MODEL` | `embed-english-v3.0` | Dense vector embedding model name |
| `EMBED_DIMENSIONS` | `1024` | Vector dimensionality (1024 for Cohere v3 / Voyage 3) |
| `UPLOAD_DIR` | `./uploads` | Local disk upload staging directory |
| `MAX_FILE_SIZE_MB` | `50` | Maximum single-file upload size in megabytes |
| `STORAGE_TYPE` | `local` | Active storage adapter (`local` or `s3`) |
| `INGESTION_CONCURRENCY` | `2` | BullMQ worker document ingestion concurrency |
| `VISION_PAGE_CONCURRENCY` | `3` | Maximum concurrent page-parsing requests per document |

---

## API Documentation

FolioQ exposes a clean, typed REST and SSE streaming API:

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new user account `{ email, password, name }`
- `POST /api/auth/login` — Authenticate and receive `httpOnly` JWT session cookies
- `POST /api/auth/refresh` — Refresh access token using valid refresh cookie
- `POST /api/auth/logout` — Clear session cookies
- `GET  /api/auth/me` — Retrieve current authenticated user profile

### Workspaces & Collections (`/api/collections`)
- `GET  /api/collections` — List all collections owned by authenticated user
- `POST /api/collections` — Create a new collection `{ name, description }`
- `GET  /api/collections/:id` — Get collection details with associated documents
- `DELETE /api/collections/:id` — Delete collection and associated documents

### Document Upload & Ingestion (`/api/upload`, `/api/documents`)
- `POST /api/upload` — Multi-file multipart upload with MIME & magic-byte validation
- `GET  /api/documents/:id` — Get document ingestion status and metadata
- `GET  /api/documents/:id/elements` — Preview all structured parsed elements (tables, charts, paragraphs)
- `POST /api/documents/:id/reprocess` — Re-trigger 6-stage ingestion pipeline idempotently
- `DELETE /api/documents/:id` — Delete document, pages, chunks, and stored files

### Grounded Q&A & Streaming (`/api/threads`)
- `GET  /api/threads/:collectionId` — List conversation threads for a collection
- `POST /api/threads` — Create a new chat thread `{ collectionId, title }`
- `GET  /api/threads/:id/messages` — Fetch conversation history with citations
- `POST /api/threads/:id/messages` — Ask question with real-time **Server-Sent Events (SSE)** token streaming and structured citations:
  ```json
  {
    "question": "What was the Total Revenue in Q3 FY2024?",
    "documentIds": ["6aedd752d425b6686cf7cc9e"]
  }
  ```

---

## Monorepo Structure

```text
folioq/
├── apps/
│   ├── api/                     # Node.js 20+ Express REST API & Workers
│   │   ├── src/
│   │   │   ├── cli/             # Headless CLI ingestion runners
│   │   │   ├── ingestion/       # 6-Stage Multi-Modal Ingestion Pipeline
│   │   │   │   ├── stage1-render.ts   # 150-200 DPI PNG Page Renderer
│   │   │   │   ├── stage2-native.ts   # Layout & needsOcr Detection
│   │   │   │   ├── stage3-vision.ts   # Multimodal Vision Structured Parsing
│   │   │   │   ├── stage4-stitch.ts   # Continuing Table Stitching
│   │   │   │   ├── stage5-chunk.ts    # Semantic Element Chunking
│   │   │   │   └── stage6-index.ts    # Batch Embedding & Vector Indexing
│   │   │   ├── models/          # Mongoose Schemas (User, Document, Page, Chunk, Thread)
│   │   │   ├── providers/       # Pluggable Provider Gateways
│   │   │   │   ├── embeddings/  # Cohere, Voyage, OpenAI, Mock
│   │   │   │   ├── llm/         # Anthropic, OpenAI/Gemini/Groq, Mock
│   │   │   │   └── vector/      # Atlas Vector Search & Local Cosine Store
│   │   │   ├── queue/           # BullMQ & In-Memory Ingestion Queue
│   │   │   ├── rag/             # Retrieval & Grounded Answering Engine
│   │   │   │   ├── answering.service.ts # SSE Streaming & Verification
│   │   │   │   ├── context.ts   # Visual Context & Page Attachment
│   │   │   │   ├── query-rewriter.ts   # Intent Classification
│   │   │   │   ├── reranker.ts  # Top-8 Reranker
│   │   │   │   ├── retrieval.ts # Parallel Hybrid Vector + BM25 Search
│   │   │   │   └── verification.ts     # Number & Grounding Pass
│   │   │   ├── routes/          # Express Route Controllers (Auth, Upload, Chat)
│   │   │   └── storage/         # Local Disk & S3 Storage Adapters
│   │   └── test/                # Vitest Unit and Integration Test Suites
│   └── web/                     # React 18 + Vite Frontend Workspace
│       └── src/
│           ├── components/
│           │   ├── auth/        # Login and Registration Forms
│           │   ├── chat/        # Grounded Chat, Citation Pills, Recharts, Tables
│           │   ├── documents/   # Multi-File Drag-and-Drop & Element Inspector
│           │   ├── landing/     # Flat Editorial Landing Page & Product Showcase
│           │   ├── layout/      # 3-Pane Resizable Shell & Command Palette (Ctrl+K)
│           │   └── viewer/      # Synced PDF Viewer with Bounding Box Highlighting
│           ├── store/           # Zustand UI and Auth State Stores
│           └── services/        # Axios API Client & SSE Stream Readers
├── packages/
│   └── shared/                  # Shared TypeScript Types & Zod Validation Schemas
├── eval/                        # Golden Evaluation Suite
│   ├── continuing-inventory.pdf # Multi-page continuing inventory table
│   ├── financial-q3.pdf         # 17-row financial balance sheet
│   ├── market-metrics.pdf       # ARR bar charts and NRR pie charts
│   ├── report-overview.pdf      # Hierarchical multi-section report
│   ├── scanned-audit.pdf        # Scanned certificate requiring OCR
│   ├── questions.json           # 42 Golden benchmark question-answer pairs
│   ├── run-eval.ts              # Automated evaluation runner & scoring harness
│   └── test-parsing.ts          # Multi-element parsing verification audit
├── docker-compose.yml           # Infrastructure Stack (MongoDB Atlas / Local, Redis)
├── architecture.md              # Exhaustive System Architecture & Blueprint
├── .env.example                 # Environment Variables Template
└── README.md                    # Project Documentation
```

---

## Golden Evaluation Suite

FolioQ includes an automated evaluation harness in `/eval` designed to test edge cases across multimodal PDF documents:

### Benchmark Test Coverage:
1. **Exact Lookups** — Encryption standards, SLA guarantees, data retention policies, revenue metrics.
2. **Table Calculations** — Arithmetic sums, operational margins, revenue differences across quarters.
3. **Chart Reading** — Bar chart coordinate readings, ARR trajectories, pie chart distribution percentages.
4. **Scanned OCR** — Image-only certificates with zero native text layers.
5. **Multi-Page Continuing Tables** — Hardware inventories continuing across page boundaries with shared schemas.
6. **Cross-Document Synthesis** — Disaster recovery RPO requirements compared against certificate validity.
7. **Negative Assertions** — Queries absent from documents (e.g., Tokyo office headcount, ticker symbol) verified to reply *"I cannot find this information in the provided documents"*.

### Benchmark Audit Score:
```
======================================================
📊 GOLDEN EVALUATION RESULTS SUMMARY
======================================================
Total Test Questions:        42
Citation Accuracy:           39/42 (92.9%)
Breakdown by Category:
  • exact_lookup        : Citation 19/19 (100%)
  • table_calculation   : Citation 3/3   (100%)
  • chart_reading       : Citation 6/6   (100%)
  • scanned_ocr         : Citation 4/4   (100%)
  • multi_page_table    : Citation 5/5   (100%)
  • cross_document      : Citation 1/1   (100%)
  • not_in_document     : Explicit Grounded Fallback
======================================================
```

---

## Contributing

Contributions are welcome! To contribute:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feat/grounded-table-enhancement`)
3. **Commit** your changes (`git commit -m 'feat: improve multi-row table parser'`)
4. **Push** to the branch (`git push origin feat/grounded-table-enhancement`)
5. **Open** a Pull Request

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>FolioQ</strong><br/>
  <em>Every PDF parsed faithfully. Every answer grounded with verifiable page citations.</em>
</p>
