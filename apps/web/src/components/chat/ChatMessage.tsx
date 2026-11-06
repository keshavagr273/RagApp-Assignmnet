import React, { useState } from 'react';
import { MessageItem } from '../../services/api';
import { useUIStore } from '../../store/uiStore';
import { TableAnswer } from './TableAnswer';
import { ChartAnswer } from './ChartAnswer';
import { ChevronDown, ChevronRight, FileText, ArrowRight } from 'lucide-react';

interface ChatMessageProps {
  message: MessageItem;
  onSendFollowup?: (text: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onSendFollowup }) => {
  const openCitationInViewer = useUIStore((s) => s.openCitationInViewer);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end my-4">
        <div className="max-w-2xl bg-paper border border-hairline rounded-md px-4 py-2.5 text-ink text-sm font-sans shadow-none">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  // Parse inline citation pills from markdown text e.g. [Document Name, p.1]
  const renderContentWithCitations = (text: string) => {
    const parts = text.split(/(\[[^\]]+,\s*p\.\d+\])/g);

    return parts.map((part, i) => {
      const match = part.match(/\[([^\]]+),\s*p\.(\d+)\]/);
      if (match) {
        const docTitle = match[1].trim();
        const pageNum = parseInt(match[2], 10);
        const matchingCite = message.citations?.find(
          (c) => c.page === pageNum || c.documentTitle.toLowerCase().includes(docTitle.toLowerCase())
        );

        return (
          <button
            key={i}
            onClick={() => {
              if (matchingCite) {
                openCitationInViewer(matchingCite);
              } else {
                openCitationInViewer({
                  id: `cite-${pageNum}`,
                  documentId: message.citations?.[0]?.documentId || '',
                  documentTitle: docTitle,
                  page: pageNum,
                  chunkId: '',
                  elementType: 'paragraph',
                  excerpt: `Page ${pageNum} source reference`,
                });
              }
            }}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 text-xs font-mono font-medium rounded border border-hairline bg-highlight/20 text-ink hover:bg-highlight/40 transition-colors cursor-pointer"
            title={`Open ${docTitle} at page ${pageNum}`}
          >
            <FileText className="w-3 h-3 text-primary inline" />
            <span>{docTitle.length > 18 ? docTitle.slice(0, 15) + '…' : docTitle} · p.{pageNum}</span>
          </button>
        );
      }

      // Format markdown bold & linebreaks
      const lines = part.split('\n');
      return (
        <span key={i}>
          {lines.map((line, lIdx) => (
            <React.Fragment key={lIdx}>
              {lIdx > 0 && <br />}
              {line.split(/(\*\*[^*]+\*\*)/).map((segment, sIdx) => {
                if (segment.startsWith('**') && segment.endsWith('**')) {
                  return <strong key={sIdx} className="font-semibold text-ink">{segment.slice(2, -2)}</strong>;
                }
                return segment;
              })}
            </React.Fragment>
          ))}
        </span>
      );
    });
  };

  return (
    <div className="my-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-display font-medium text-xs text-primary uppercase tracking-wider">FolioQ</span>
        {message.confidence && (
          <span
            className={`text-[11px] font-mono px-1.5 py-0.5 rounded border border-hairline ${
              message.confidence === 'high'
                ? 'bg-primary/10 text-primary'
                : message.confidence === 'medium'
                ? 'bg-highlight/20 text-ink'
                : 'bg-secondary/10 text-secondary'
            }`}
          >
            {message.confidence.toUpperCase()} CONFIDENCE
          </span>
        )}
        {message.latencyMs && (
          <span className="text-[11px] font-mono text-muted">{message.latencyMs}ms</span>
        )}
      </div>

      <div className="text-sm font-sans text-ink leading-relaxed prose prose-stone max-w-none">
        {renderContentWithCitations(message.content)}
      </div>

      {/* Render Structured Tables */}
      {message.tables && message.tables.map((t, idx) => <TableAnswer key={idx} table={t} />)}

      {/* Render Structured Charts */}
      {message.charts && message.charts.map((c, idx) => <ChartAnswer key={idx} chart={c} />)}

      {/* Collapsible Sources Accordion */}
      {message.citations && message.citations.length > 0 && (
        <div className="mt-4 border border-hairline rounded bg-paper/60">
          <button
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono text-muted hover:text-ink transition-colors"
          >
            <span className="font-medium text-ink">Grounding Sources ({message.citations.length})</span>
            {sourcesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {sourcesOpen && (
            <div className="p-3 border-t border-hairline space-y-2 bg-surface">
              {message.citations.map((cite, idx) => (
                <div
                  key={idx}
                  onClick={() => openCitationInViewer(cite)}
                  className="p-2 border border-hairline rounded hover:bg-paper cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="font-medium text-primary">{cite.documentTitle}</span>
                    <span className="text-muted">Page {cite.page} ({cite.elementType})</span>
                  </div>
                  <p className="text-xs text-muted line-clamp-2">{cite.excerpt}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggested Follow-ups */}
      {message.followups && message.followups.length > 0 && onSendFollowup && (
        <div className="mt-3 flex flex-wrap gap-2">
          {message.followups.map((fText, idx) => (
            <button
              key={idx}
              onClick={() => onSendFollowup(fText)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans rounded-full border border-hairline bg-surface hover:bg-paper text-muted hover:text-ink transition-colors text-left"
            >
              <span>{fText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
