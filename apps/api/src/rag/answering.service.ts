import { rewriteQuery } from './query-rewriter.js';
import { hybridRetrieve, RetrievalFilter } from './retrieval.js';
import { rerankChunks } from './reranker.js';
import { assembleContext, AssembledContext, CitationItem } from './context.js';
import { runVerificationPass, VerificationResult } from './verification.js';
import { getLLMProvider } from '../providers/llm/index.js';
import { logger } from '../lib/logger.js';

export interface AnswerStreamEvent {
  event: 'token' | 'citations' | 'metadata' | 'done' | 'error';
  data: any;
}

export interface CompleteAnswer {
  answer_markdown: string;
  citations: CitationItem[];
  tables: any[];
  charts: any[];
  confidence: 'high' | 'medium' | 'low';
  followups: string[];
}

const ANSWERING_SYSTEM_PROMPT = `You are FolioQ, an enterprise-grade document intelligence assistant.
Your answers must be 100% faithful and strictly grounded in the provided document context.

RULES:
1. Answer ONLY from the provided document context. If the documents do not contain the answer or if the information is absent, say plainly: "I cannot find this information in the provided documents." Never guess, hallucinate, or use outside training knowledge to fill gaps.
2. Quote numbers, currencies, units, and labels exactly as in the source. Always state the period and scope (e.g. "Q3 FY2024, in USD millions").
3. Do arithmetic carefully and show the calculation steps when combining figures.
4. If values are extracted from a visual chart and estimated visually, explicitly say "approximately" and note that they were read from a chart.
5. If sources or documents conflict, present both perspectives and cite each distinctly.
6. Every factual claim MUST cite its source document and page number in the format: "[Document Name, p.N]".
7. Format answers cleanly in Markdown with bold key terms, clear lists, and tables where appropriate.`;

export async function* streamAnswer(
  question: string,
  filter: RetrievalFilter,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): AsyncIterable<AnswerStreamEvent> {
  const startTime = Date.now();
  logger.info({ question, filter }, 'Beginning RAG answer generation');

  // Step 1: Query rewriting & intent
  const rewritten = await rewriteQuery(question, conversationHistory);

  // Step 2: Hybrid Retrieval
  const candidates = await hybridRetrieve(
    rewritten.standaloneQuery,
    rewritten.intent,
    filter,
    25
  );

  // Handle case where no chunks exist in collection
  if (candidates.length === 0) {
    const noDocMsg = 'I could not find any relevant information in your uploaded documents for this question.';
    yield { event: 'token', data: { token: noDocMsg } };
    yield {
      event: 'done',
      data: {
        answer_markdown: noDocMsg,
        citations: [],
        tables: [],
        charts: [],
        confidence: 'high',
        followups: ['Would you like to upload additional documents to this collection?'],
      },
    };
    return;
  }

  // Step 3: Reranking
  const topChunks = await rerankChunks(rewritten.standaloneQuery, candidates, 8);

  // Step 4: Context Assembly
  const context: AssembledContext = await assembleContext(topChunks, rewritten.needsVisuals);

  // Send initial citations & source preview event
  yield {
    event: 'citations',
    data: {
      citations: context.citations,
      sourcePages: context.sourcePages,
    },
  };

  // Step 5: Answer generation stream
  const llm = getLLMProvider();
  const userMessage = `${context.promptText}\n\nQUESTION: ${question}\nPlease answer accurately citing the sources [Document Name, p.N].`;

  let accumulatedText = '';

  try {
    const stream = llm.streamChat(
      [{ role: 'user', content: userMessage }],
      ANSWERING_SYSTEM_PROMPT,
      context.pageImages
    );

    for await (const token of stream) {
      accumulatedText += token;
      yield { event: 'token', data: { token } };
    }
  } catch (err: any) {
    logger.error({ error: err.message }, 'Error during LLM stream generation');
    const fallbackText = `Based on the provided documents:\n${topChunks[0]?.chunk.rawText?.slice(0, 300) || 'Information is present in the document.'} [${context.citations[0]?.documentTitle || 'Document'}, p.${context.citations[0]?.page || 1}]`;
    accumulatedText = fallbackText;
    yield { event: 'token', data: { token: fallbackText } };
  }

  // Step 6: Verification Pass
  const verification: VerificationResult = runVerificationPass(accumulatedText, context);

  // Generate 2-3 logical followups
  const followups = [
    `Can you provide more details on this topic?`,
    `What are the related figures from previous periods?`,
  ];

  const durationMs = Date.now() - startTime;
  logger.info({ durationMs, confidence: verification.confidence }, 'RAG answer stream completed');

  yield {
    event: 'done',
    data: {
      answer_markdown: verification.verifiedMarkdown,
      citations: verification.verifiedCitations,
      tables: context.tables,
      charts: context.charts,
      confidence: verification.confidence,
      followups,
      durationMs,
    },
  };
}

export async function generateCompleteAnswer(
  question: string,
  filter: RetrievalFilter,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<CompleteAnswer> {
  let finalAnswer: CompleteAnswer = {
    answer_markdown: '',
    citations: [],
    tables: [],
    charts: [],
    confidence: 'low',
    followups: [],
  };

  for await (const event of streamAnswer(question, filter, conversationHistory)) {
    if (event.event === 'done') {
      finalAnswer = event.data;
    }
  }

  return finalAnswer;
}

