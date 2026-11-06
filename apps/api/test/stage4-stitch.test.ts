import { describe, it, expect } from 'vitest';
import { stage4CrossPageStitch } from '../src/ingestion/stage4-stitch.js';
import { ProcessedVisionPage } from '../src/ingestion/stage3-vision.js';

describe('Stage 4: Cross-Page Table Stitching and Heading Path Hierarchy', () => {
  it('should stitch continuing tables across pages with matching headers', () => {
    const dummyPages: ProcessedVisionPage[] = [
      {
        pageNumber: 1,
        imageRef: 'pages/doc1/page-1.png',
        degraded: false,
        needsOcr: false,
        textLayerQuality: 'good',
        width: 600,
        height: 800,
        elements: [
          { type: 'heading', level: 1, text: 'Financial Statements' },
          {
            type: 'table',
            caption: 'Balance Sheet Part 1',
            headers: [['Account', '2023', '2024']],
            rows: [
              ['Cash', '$100', '$150'],
              ['Equities', '$200', '$250'],
            ],
            markdown: '| Account | 2023 | 2024 |\n|---|---|---|\n| Cash | $100 | $150 |\n| Equities | $200 | $250 |',
          },
        ],
      },
      {
        pageNumber: 2,
        imageRef: 'pages/doc1/page-2.png',
        degraded: false,
        needsOcr: false,
        textLayerQuality: 'good',
        width: 600,
        height: 800,
        elements: [
          {
            type: 'table',
            caption: 'Balance Sheet (continued)',
            headers: [['Account', '2023', '2024']],
            rows: [
              ['Real Estate', '$500', '$600'],
              ['Total Assets', '$800', '$1000'],
            ],
            markdown: '| Account | 2023 | 2024 |\n|---|---|---|\n| Real Estate | $500 | $600 |\n| Total Assets | $800 | $1000 |',
          },
          { type: 'paragraph', text: 'End of asset statements.' },
        ],
      },
    ];

    const stitched = stage4CrossPageStitch('doc1', dummyPages);

    expect(stitched.elements.length).toBe(3); // 1 heading + 1 merged table + 1 paragraph

    const tableEl = stitched.elements.find((el) => el.element.type === 'table');
    expect(tableEl).toBeDefined();
    expect(tableEl?.page).toBe(1);
    expect(tableEl?.endPage).toBe(2);

    const mergedTable = tableEl?.element as any;
    expect(mergedTable.rows.length).toBe(4);
    expect(mergedTable.rows[2]).toEqual(['Real Estate', '$500', '$600']);
    expect(mergedTable.rows[3]).toEqual(['Total Assets', '$800', '$1000']);
  });

  it('should maintain section heading hierarchy stack correctly', () => {
    const dummyPages: ProcessedVisionPage[] = [
      {
        pageNumber: 1,
        imageRef: 'pages/doc2/page-1.png',
        degraded: false,
        needsOcr: false,
        textLayerQuality: 'good',
        width: 600,
        height: 800,
        elements: [
          { type: 'heading', level: 1, text: 'Chapter 1: Cloud Architecture' },
          { type: 'heading', level: 2, text: '1.1 Storage Layer' },
          { type: 'paragraph', text: 'All data is encrypted with AES-256.' },
          { type: 'heading', level: 2, text: '1.2 Compute Layer' },
          { type: 'paragraph', text: 'Kubernetes nodes auto-scale.' },
        ],
      },
    ];

    const stitched = stage4CrossPageStitch('doc2', dummyPages);
    const p1 = stitched.elements.find((e) => e.element.type === 'paragraph' && (e.element as any).text.includes('encrypted'));
    const p2 = stitched.elements.find((e) => e.element.type === 'paragraph' && (e.element as any).text.includes('Kubernetes'));

    expect(p1?.headingPath).toEqual([
      { level: 1, text: 'Chapter 1: Cloud Architecture' },
      { level: 2, text: '1.1 Storage Layer' },
    ]);

    expect(p2?.headingPath).toEqual([
      { level: 1, text: 'Chapter 1: Cloud Architecture' },
      { level: 2, text: '1.2 Compute Layer' },
    ]);
  });
});

