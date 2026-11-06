import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '../../store/uiStore';
import { api } from '../../services/api';
import { X, Layers, Table, BarChart3, FileText } from 'lucide-react';

export const ElementInspectorModal: React.FC = () => {
  const docId = useUIStore((s) => s.elementInspectorDocId);
  const setDocId = useUIStore((s) => s.setElementInspectorDocId);

  const [selectedPage, setSelectedPage] = useState<number | 'all'>('all');

  const { data: elements = [], isLoading } = useQuery<any[]>({
    queryKey: ['elements', docId, selectedPage],
    queryFn: async () => {
      if (!docId) return [];
      const url = selectedPage === 'all'
        ? `/documents/${docId}/elements`
        : `/documents/${docId}/elements?page=${selectedPage}`;
      const res = await api.get(url);
      return res.data.elements;
    },
    enabled: !!docId,
  });

  if (!docId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div className="w-full max-w-3xl h-[80vh] bg-surface border border-hairline rounded-lg shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-paper">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-display font-medium text-base text-ink">Extracted Content Preview</h3>
              <p className="text-xs text-muted font-mono">Inspect structured JSON elements extracted by the 6-stage pipeline</p>
            </div>
          </div>
          <button
            onClick={() => setDocId(null)}
            className="p-1.5 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-6 py-2 border-b border-hairline bg-paper/50 flex items-center justify-between text-xs font-mono">
          <span>Total Elements: {elements.length}</span>
          <div className="flex items-center gap-2">
            <span className="text-muted">Filter by Page:</span>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="bg-surface border border-hairline rounded px-2 py-1 text-ink focus:outline-none"
            >
              <option value="all">All Pages</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                <option key={p} value={p}>Page {p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-6 w-32 bg-hairline rounded skeleton-pulse" />
              <div className="h-20 w-full bg-hairline/60 rounded skeleton-pulse" />
            </div>
          ) : elements.length === 0 ? (
            <div className="py-20 text-center text-xs font-mono text-muted">
              No parsed elements found for this document yet.
            </div>
          ) : (
            elements.map((el, idx) => (
              <div key={idx} className="p-4 border border-hairline rounded bg-paper/40 text-xs">
                <div className="flex items-center justify-between font-mono mb-2 border-b border-hairline pb-1.5">
                  <div className="flex items-center gap-1.5">
                    {el.elementType === 'table' ? (
                      <Table className="w-3.5 h-3.5 text-primary" />
                    ) : el.elementType === 'chart' ? (
                      <BarChart3 className="w-3.5 h-3.5 text-secondary" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-muted" />
                    )}
                    <span className="font-medium text-ink uppercase tracking-wider">{el.elementType}</span>
                    <span className="text-muted">· Page {el.page}</span>
                  </div>
                  <span className="text-muted font-mono text-[11px]">~{el.tokenCount} tokens</span>
                </div>

                <div className="mb-2">
                  <span className="font-mono text-muted text-[11px] block">Section Hierarchy:</span>
                  <span className="font-sans font-medium text-ink">
                    {el.headingPath?.map((h: any) => h.text).join(' > ') || 'General / Root'}
                  </span>
                </div>

                <div className="bg-surface p-3 rounded border border-hairline font-mono text-[11px] text-ink overflow-x-auto whitespace-pre-wrap max-h-40">
                  {el.rawText || el.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-hairline bg-paper flex justify-end">
          <button
            onClick={() => setDocId(null)}
            className="px-4 py-1.5 text-xs font-medium rounded border border-hairline bg-surface hover:bg-paper text-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

