import { describe, it, expect } from 'vitest';
import { runVerificationPass } from '../src/rag/verification.js';
import { AssembledContext } from '../src/rag/context.js';

describe('Verification Pass and Citation Mapping', () => {
  it('should verify cited chunks and numbers in grounded answers', () => {
    const dummyContext: AssembledContext = {
      promptText: '[SOURCE 1] (Document: "Q3 Report.pdf", Page: 1, Type: text)\nTotal Revenue for Q3 FY2024 was $370.9 million, up 28.1% year-over-year.',
      citations: [
        {
          id: 'cite-1',
          documentId: 'doc-123',
          documentTitle: 'Q3 Report.pdf',
          page: 1,
          chunkId: 'chunk-1',
          elementType: 'paragraph',
          excerpt: 'Total Revenue for Q3 FY2024 was $370.9 million',
        },
      ],
      tables: [],
      charts: [],
      pageImages: [],
      sourcePages: [1],
    };

    const answer = 'In Q3 FY2024, the total revenue was $370.9 million, representing a 28.1% increase [Q3 Report.pdf, p.1].';
    const result = runVerificationPass(answer, dummyContext);

    expect(result.confidence).toBe('high');
    expect(result.verifiedCitations.length).toBe(1);
    expect(result.verifiedCitations[0].page).toBe(1);
    expect(result.discrepancies.length).toBe(0);
  });

  it('should identify ungrounded/absent answers and assign high confidence without phantom citations', () => {
    const dummyContext: AssembledContext = {
      promptText: '[SOURCE 1] (Document: "Q3 Report.pdf", Page: 1, Type: text)\nSome financial facts.',
      citations: [
        {
          id: 'cite-1',
          documentId: 'doc-123',
          documentTitle: 'Q3 Report.pdf',
          page: 1,
          chunkId: 'chunk-1',
          elementType: 'paragraph',
          excerpt: 'Some financial facts.',
        },
      ],
      tables: [],
      charts: [],
      pageImages: [],
      sourcePages: [1],
    };

    const answer = 'I cannot find this information in the provided documents.';
    const result = runVerificationPass(answer, dummyContext);

    expect(result.confidence).toBe('high');
    expect(result.verifiedCitations.length).toBe(0); // Zero phantom citations
  });
});

