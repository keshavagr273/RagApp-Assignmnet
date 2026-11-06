import React, { useState } from 'react';
import { Copy, Check, Table as TableIcon, FileSpreadsheet } from 'lucide-react';
import { Citation } from '../../services/api';
import { useUIStore } from '../../store/uiStore';
import { InlineContent } from './InlineContent';

export interface TableData {
  caption?: string;
  units?: string;
  headers?: string[] | string[][];
  alignments?: Array<'left' | 'center' | 'right'>;
  rows?: string[][];
  markdown?: string;
}

interface TableAnswerProps {
  table: TableData;
  citations?: Citation[];
  onOpenCitation?: (docTitle: string, page: number) => void;
}

export const TableAnswer: React.FC<TableAnswerProps> = ({ table, citations = [], onOpenCitation }) => {
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const openCitationInViewer = useUIStore((s) => s.openCitationInViewer);

  // Normalize headers: support both string[] and string[][]
  const headers: string[] = !table.headers || table.headers.length === 0
    ? []
    : Array.isArray(table.headers[0])
    ? (table.headers[0] as string[])
    : (table.headers as string[]);

  const rows: string[][] = table.rows || [];

  // Determine column alignment
  const getColumnAlignment = (colIndex: number): 'left' | 'center' | 'right' => {
    if (table.alignments && table.alignments[colIndex]) {
      return table.alignments[colIndex];
    }
    const headerName = (headers[colIndex] || '').toLowerCase().trim();
    if (
      headerName === 'page' ||
      headerName === 'p.' ||
      headerName === '#' ||
      headerName === 'no' ||
      headerName === 'sr no' ||
      headerName === 'sr. no.'
    ) {
      return 'center';
    }

    // Auto-detect if column is predominantly numeric
    let numericCount = 0;
    let totalNonEmpty = 0;
    for (const row of rows) {
      const val = (row[colIndex] || '').trim();
      if (val) {
        totalNonEmpty++;
        if (/^[\$€£₹]?\s*[-+]?[\d,.]+%?$/.test(val)) {
          numericCount++;
        }
      }
    }
    if (totalNonEmpty > 0 && numericCount / totalNonEmpty >= 0.7) {
      return 'right';
    }
    return 'left';
  };

  const isPageCol = (colIndex: number): boolean => {
    const h = (headers[colIndex] || '').toLowerCase().trim();
    return h === 'page' || h === 'p.' || h === 'p';
  };

  const handleCitationClick = (docTitle: string, pageNum: number) => {
    if (onOpenCitation) {
      onOpenCitation(docTitle, pageNum);
      return;
    }

    const matchingCite = citations.find(
      (c) => c.page === pageNum || (docTitle && c.documentTitle.toLowerCase().includes(docTitle.toLowerCase()))
    );

    if (matchingCite) {
      openCitationInViewer(matchingCite);
    } else {
      openCitationInViewer({
        id: `table-cite-${pageNum}-${Date.now()}`,
        documentId: citations[0]?.documentId || '',
        documentTitle: docTitle || citations[0]?.documentTitle || 'Document',
        page: pageNum,
        chunkId: '',
        elementType: 'table',
        excerpt: `Page ${pageNum} table reference`,
      });
    }
  };

  const cleanCellForExport = (raw: string): string => {
    return raw
      .replace(/\[(?:([^\]]+?)(?:,\s*|\s*·\s*|\s+))?(?:p\.|page\s*)(\d+)\]/g, (_m, doc, p) => {
        const d = doc ? doc.trim() : 'Doc';
        return `${d} (p.${p})`;
      })
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const copyAsCsv = () => {
    const csvLines = [
      headers.map((h) => `"${cleanCellForExport(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cleanCellForExport(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ];
    navigator.clipboard.writeText(csvLines.join('\n'));
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const copyAsMarkdown = () => {
    if (table.markdown) {
      navigator.clipboard.writeText(table.markdown);
    } else {
      const headerLine = `| ${headers.join(' | ')} |`;
      const sepLine = `| ${headers.map((_, i) => (getColumnAlignment(i) === 'right' ? '---:' : getColumnAlignment(i) === 'center' ? ':---:' : '---')).join(' | ')} |`;
      const rowLines = rows.map((r) => `| ${r.join(' | ')} |`);
      navigator.clipboard.writeText([headerLine, sepLine, ...rowLines].join('\n'));
    }
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  if (headers.length === 0 && rows.length === 0) {
    return null;
  }

  return (
    <div className="my-5 border border-hairline rounded-lg bg-surface shadow-xs overflow-hidden">
      {/* Table Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 border-b border-hairline bg-paper/60 gap-2">
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-primary shrink-0" />
          <span className="font-display font-medium text-xs text-ink">
            {table.caption || 'Extracted Table'}
          </span>
          {table.units && (
            <span className="text-[11px] font-mono text-muted">({table.units})</span>
          )}
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-hairline/80 bg-paper text-muted">
            {rows.length} {rows.length === 1 ? 'row' : 'rows'} · {headers.length} cols
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={copyAsCsv}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono text-muted hover:text-ink hover:bg-hairline/30 rounded border border-hairline transition-colors cursor-pointer"
            title="Copy table as CSV (for Excel, Sheets, or pandas)"
          >
            {copiedCsv ? <Check className="w-3.5 h-3.5 text-primary" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            <span>{copiedCsv ? 'Copied CSV' : 'CSV'}</span>
          </button>
          <button
            type="button"
            onClick={copyAsMarkdown}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono text-muted hover:text-ink hover:bg-hairline/30 rounded border border-hairline transition-colors cursor-pointer"
            title="Copy table as Markdown"
          >
            {copiedMd ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedMd ? 'Copied MD' : 'Markdown'}</span>
          </button>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto max-h-[520px]">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-paper sticky top-0 z-10 border-b border-hairline">
            <tr>
              {headers.map((h, i) => {
                const align = getColumnAlignment(i);
                return (
                  <th
                    key={i}
                    scope="col"
                    className={`px-3.5 py-2.5 font-semibold text-ink font-sans tracking-tight text-xs border-r border-hairline/40 last:border-r-0 ${
                      align === 'right'
                        ? 'text-right'
                        : align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    } ${isPageCol(i) ? 'w-20 min-w-[70px]' : ''}`}
                  >
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className={`border-b border-hairline/60 last:border-b-0 transition-colors hover:bg-primary/5 ${
                  rIdx % 2 === 0 ? 'bg-surface' : 'bg-paper/30'
                }`}
              >
                {row.map((cell, cIdx) => {
                  const align = getColumnAlignment(cIdx);
                  const isPage = isPageCol(cIdx);

                  return (
                    <td
                      key={cIdx}
                      className={`px-3.5 py-2.5 text-ink text-xs leading-relaxed border-r border-hairline/30 last:border-r-0 align-top ${
                        align === 'right'
                          ? 'text-right font-mono tabular-nums'
                          : align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      <InlineContent
                        text={cell}
                        citations={citations}
                        onOpenCitation={handleCitationClick}
                        isFirstColPage={isPage}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
