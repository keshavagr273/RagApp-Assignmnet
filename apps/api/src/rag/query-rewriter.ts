import { getLLMProvider } from '../providers/llm/index.js';
import { logger } from '../lib/logger.js';

export type QueryIntent = 'lookup' | 'comparison' | 'calculation' | 'summary' | 'visual_chart_table';

export interface RewrittenQuery {
  standaloneQuery: string;
  intent: QueryIntent;
  needsVisuals: boolean;
}

export async function rewriteQuery(
  rawQuery: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<RewrittenQuery> {
  const isVisualOrNumeric = /(?:chart|table|graph|plot|figure|number|trend|growth|revenue|margin|cost|ebitda|percentage|%|compare|highest|lowest|breakdown)/i.test(rawQuery);

  let intent: QueryIntent = 'lookup';
  if (/compare|versus|vs|difference|between/i.test(rawQuery)) {
    intent = 'comparison';
  } else if (/calculate|total|sum|average|growth\s+rate|percentage/i.test(rawQuery)) {
    intent = 'calculation';
  } else if (/summarize|summary|overview|explain/i.test(rawQuery)) {
    intent = 'summary';
  } else if (isVisualOrNumeric) {
    intent = 'visual_chart_table';
  }

  // If no previous history, the query is already standalone
  if (!conversationHistory || conversationHistory.length === 0) {
    return {
      standaloneQuery: rawQuery.trim(),
      intent,
      needsVisuals: isVisualOrNumeric,
    };
  }

  // If there is conversation history, rewrite follow-up questions
  try {
    const llm = getLLMProvider();
    const historyText = conversationHistory
      .slice(-4)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const prompt = `Given the conversation history and a follow-up query, rephrase the follow-up query into a single, complete, standalone question. Do not answer it, just rewrite it so it contains all needed subject context.

CONVERSATION:
${historyText}

FOLLOW-UP QUERY: ${rawQuery}

STANDALONE QUERY:`;

    let standalone = rawQuery.trim();
    const stream = llm.streamChat([{ role: 'user', content: prompt }], 'You are a query rewriting assistant. Reply ONLY with the standalone rephrased query.');
    const tokens: string[] = [];
    for await (const t of stream) {
      tokens.push(t);
    }
    const result = tokens.join('').trim();
    if (result && result.length > 5) {
      standalone = result.replace(/^STANDALONE QUERY:\s*/i, '').trim();
    }

    return {
      standaloneQuery: standalone,
      intent,
      needsVisuals: isVisualOrNumeric,
    };
  } catch (err: any) {
    logger.warn({ error: err.message }, 'Query rewrite fallback to raw query');
    return {
      standaloneQuery: rawQuery.trim(),
      intent,
      needsVisuals: isVisualOrNumeric,
    };
  }
}

