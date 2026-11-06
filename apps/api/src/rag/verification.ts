import { CitationItem, AssembledContext } from './context.js';
import { logger } from '../lib/logger.js';

export interface VerificationResult {
  verifiedMarkdown: string;
  verifiedCitations: CitationItem[];
  confidence: 'high' | 'medium' | 'low';
  discrepancies: string[];
}

export function runVerificationPass(
  answerMarkdown: string,
  context: AssembledContext
): VerificationResult {
  const discrepancies: string[] = [];

  // Check if answer is a "not found" / ungrounded response
  const isNotFound = /(?:not found|cannot find|do not contain|not mentioned|not provided in the documents|no information)/i.test(
    answerMarkdown
  );

  if (isNotFound) {
    return {
      verifiedMarkdown: answerMarkdown,
      verifiedCitations: [],
      confidence: 'high',
      discrepancies: [],
    };
  }

  // 1. Validate Citation Markers in Answer: [doc, p.N] or [SOURCE N]
  const verifiedCitations: CitationItem[] = [];
  for (const cite of context.citations) {
    // Check if cite or source number is referenced or if its content words match
    const pageRegex = new RegExp(`(?:p\\.\\s*${cite.page}|page\\s*${cite.page})`, 'i');
    if (pageRegex.test(answerMarkdown) || answerMarkdown.includes(cite.documentTitle)) {
      verifiedCitations.push(cite);
    }
  }

  // If no explicit citation marker was matched, keep top relevant citations as grounded sources
  const finalCitations = verifiedCitations.length > 0 ? verifiedCitations : context.citations.slice(0, 3);

  // 2. Validate numbers in the answer against context
  const numberMatches = answerMarkdown.match(/\b\d+(?:\.\d+)?%?|\$\d+(?:\.\d+)?/g) || [];
  let supportedNumbersCount = 0;

  const contextText = context.promptText;
  for (const num of numberMatches) {
    if (contextText.includes(num)) {
      supportedNumbersCount++;
    } else {
      discrepancies.push(`Number "${num}" in answer not directly seen in context (may be calculated)`);
    }
  }

  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (numberMatches.length > 0 && supportedNumbersCount / numberMatches.length < 0.5) {
    confidence = 'medium';
  }
  if (finalCitations.length === 0) {
    confidence = 'low';
  }

  logger.info(
    { confidence, matchedNumbers: supportedNumbersCount, totalNumbers: numberMatches.length },
    'Verification pass completed'
  );

  return {
    verifiedMarkdown: answerMarkdown,
    verifiedCitations: finalCitations,
    confidence,
    discrepancies,
  };
}

