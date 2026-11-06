import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface TableAnswerProps {
  table: {
    caption?: string;
    units?: string;
    headers?: string[][];
    rows?: string[][];
    markdown?: string;
  };
}

export const TableAnswer: React.FC<TableAnswerProps> = ({ table }) => {
  const [copied, setCopied] = useState(false);

  const headers = table.headers && table.headers.length > 0 ? table.headers[0] : [];
  const rows = table.rows || [];

  const copyAsCsv = () => {
    const csvLines = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ];
    navigator.clipboard.writeText(csvLines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNumeric = (val: string) => /^[\$€£]?\s*[-+]?[\d,.]+%?$/.test(val.trim());

  return (
    <div className="my-4 border border-hairline rounded bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-hairline bg-paper/50">
        <div>
          {table.caption && <span className="font-medium text-xs text-ink">{table.caption}</span>}
          {table.units && <span className="text-xs text-muted ml-2">({table.units})</span>}
        </div>
        <button
          onClick={copyAsCsv}
          className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono text-muted hover:text-ink hover:bg-hairline/30 rounded border border-hairline transition-colors"
          title="Copy table as CSV"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied CSV' : 'Copy CSV'}</span>
        </button>
      </div>

      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-paper sticky top-0 z-10 border-b border-hairline">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-3 py-2 font-medium text-ink tracking-wider ${
                    i > 0 ? 'text-right' : 'text-left'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-hairline/60 hover:bg-paper/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-3 py-2 text-ink ${
                      isNumeric(cell) || cIdx > 0
                        ? 'text-right font-mono tabular-nums'
                        : 'text-left'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

