import { describe, it, expect } from 'vitest';
import { stage5SemanticChunking } from '../src/ingestion/stage5-chunk.js';
import { StitchedDocument } from '../src/ingestion/stage4-stitch.js';

describe('Stage 5: Semantic Element Chunking', () => {
  it('should chunk tables into single semantic units with contextual headers', () => {
    const stitched: StitchedDocument = {
      documentId: 'doc-table-1',
      elements: [
        {
          page: 1,
          headingPath: [{ level: 1, text: 'Operating Results' }],
          imageRef: 'pages/doc-table-1/page-1.png',
          element: {
            type: 'table',
            caption: 'Quarterly Operating Metrics',
            units: 'USD Millions',
            headers: [['Metric', 'Q1', 'Q2', 'Q3']],
            rows: [
              ['Revenue', '100', '120', '150'],
              ['Expenses', '60', '70', '80'],
            ],
            markdown: '| Metric | Q1 | Q2 | Q3 |\n|---|---|---|---|\n| Revenue | 100 | 120 | 150 |\n| Expenses | 60 | 70 | 80 |',
          },
        },
      ],
    };

    const chunks = stage5SemanticChunking('doc-table-1', 'col-1', 'Financial Report.pdf', stitched);
    expect(chunks.length).toBe(1);
    expect(chunks[0].elementType).toBe('table');
    expect(chunks[0].text).toContain('[Document: Financial Report.pdf] [Section: Operating Results] [Type: table]');
    expect(chunks[0].text).toContain('Caption: Quarterly Operating Metrics');
    expect(chunks[0].text).toContain('Units: USD Millions');
    expect(chunks[0].tokenCount).toBeGreaterThan(0);
  });

  it('should chunk charts into atomic units with axes, series data, and summary', () => {
    const stitched: StitchedDocument = {
      documentId: 'doc-chart-1',
      elements: [
        {
          page: 2,
          headingPath: [{ level: 1, text: 'Growth Analytics' }],
          imageRef: 'pages/doc-chart-1/page-2.png',
          element: {
            type: 'chart',
            chartType: 'bar',
            title: 'ARR Growth',
            xAxisLabel: 'Fiscal Year',
            yAxisLabel: 'ARR ($M)',
            series: [
              {
                name: 'ARR',
                data: [
                  { x: '2023', y: 1150 },
                  { x: '2024', y: 1480 },
                ],
              },
            ],
            summary: 'ARR grew from $1150M to $1480M with 46.7% CAGR.',
            confidence: 'high',
          },
        },
      ],
    };

    const chunks = stage5SemanticChunking('doc-chart-1', 'col-1', 'Analytics.pdf', stitched);
    expect(chunks.length).toBe(1);
    expect(chunks[0].elementType).toBe('chart');
    expect(chunks[0].text).toContain('Chart Title: ARR Growth');
    expect(chunks[0].text).toContain('Series "ARR": (2023: 1150), (2024: 1480)');
    expect(chunks[0].text).toContain('Trend Summary: ARR grew from $1150M to $1480M with 46.7% CAGR.');
  });
});

