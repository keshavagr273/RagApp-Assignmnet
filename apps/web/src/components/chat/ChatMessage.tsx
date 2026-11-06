import React, { useState, useMemo } from 'react';
import { MessageItem } from '../../services/api';
import { useUIStore } from '../../store/uiStore';
import { TableAnswer } from './TableAnswer';
import { ChartAnswer } from './ChartAnswer';
import { parseMarkdownBlocks } from './markdownParser';
import { InlineContent } from './InlineContent';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';

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

  const handleOpenCitation = (docTitle: string, pageNum: number) => {
    const matchingCite = message.citations?.find(
      (c) =>
        c.page === pageNum ||
        (docTitle && c.documentTitle.toLowerCase().includes(docTitle.toLowerCase()))
    );

    if (matchingCite) {
      openCitationInViewer(matchingCite);
    } else {
      openCitationInViewer({
        id: `cite-${pageNum}-${Date.now()}`,
        documentId: message.citations?.[0]?.documentId || '',
        documentTitle: docTitle || message.citations?.[0]?.documentTitle || 'Document',
        page: pageNum,
        chunkId: '',
        elementType: 'paragraph',
        excerpt: `Page ${pageNum} source reference`,
      });
    }
  };

  const parsedBlocks = useMemo(() => {
    return parseMarkdownBlocks(message.content);
  }, [message.content]);

  const hasMarkdownTable = parsedBlocks.some((b) => b.type === 'table');

  return (
    <div className="my-6 max-w-3xl">
      {/* FolioQ Header Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="font-display font-medium text-xs text-primary uppercase tracking-wider">
          FolioQ
        </span>
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

      {/* Structured Content Rendering */}
      <div className="text-sm font-sans text-ink leading-relaxed">
        {parsedBlocks.map((block, idx) => {
          if (block.type === 'table') {
            return (
              <TableAnswer
                key={idx}
                table={{
                  headers: block.headers,
                  rows: block.rows,
                  alignments: block.alignments,
                  markdown: block.rawMarkdown,
                }}
                citations={message.citations}
                onOpenCitation={handleOpenCitation}
              />
            );
          }

          if (block.type === 'heading') {
            if (block.level === 1) {
              return (
                <h1
                  key={idx}
                  className="text-base font-semibold font-display text-ink mt-5 mb-2.5 tracking-tight border-b border-hairline pb-1"
                >
                  <InlineContent
                    text={block.text}
                    citations={message.citations}
                    onOpenCitation={handleOpenCitation}
                  />
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2
                  key={idx}
                  className="text-sm font-semibold font-display text-ink mt-4 mb-2 tracking-tight"
                >
                  <InlineContent
                    text={block.text}
                    citations={message.citations}
                    onOpenCitation={handleOpenCitation}
                  />
                </h2>
              );
            }
            return (
              <h3
                key={idx}
                className="text-xs font-semibold font-display text-ink uppercase tracking-wider mt-4 mb-2 text-primary"
              >
                <InlineContent
                  text={block.text}
                  citations={message.citations}
                  onOpenCitation={handleOpenCitation}
                />
              </h3>
            );
          }

          if (block.type === 'list') {
            if (block.ordered) {
              return (
                <ol key={idx} className="my-2.5 space-y-1.5 list-none pl-0">
                  {block.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start gap-2 text-sm text-ink leading-relaxed">
                      <span className="font-mono text-xs font-semibold text-primary shrink-0 mt-0.5">
                        {itemIdx + 1}.
                      </span>
                      <span className="flex-1">
                        <InlineContent
                          text={item}
                          citations={message.citations}
                          onOpenCitation={handleOpenCitation}
                        />
                      </span>
                    </li>
                  ))}
                </ol>
              );
            }

            return (
              <ul key={idx} className="my-2.5 space-y-1.5 list-none pl-0">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2 text-sm text-ink leading-relaxed">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span className="flex-1">
                      <InlineContent
                        text={item}
                        citations={message.citations}
                        onOpenCitation={handleOpenCitation}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            );
          }

          if (block.type === 'code') {
            return (
              <div key={idx} className="my-3 border border-hairline rounded bg-paper/60 overflow-hidden">
                {block.language && (
                  <div className="px-3 py-1 bg-paper border-b border-hairline text-[11px] font-mono text-muted">
                    {block.language}
                  </div>
                )}
                <pre className="p-3 text-xs font-mono text-ink overflow-x-auto">
                  <code>{block.content}</code>
                </pre>
              </div>
            );
          }

          // Paragraph
          return (
            <p key={idx} className="my-2.5 text-sm font-sans text-ink leading-relaxed">
              <InlineContent
                text={block.text}
                citations={message.citations}
                onOpenCitation={handleOpenCitation}
              />
            </p>
          );
        })}
      </div>

      {/* Render Structured Tables (if not already parsed from markdown) */}
      {!hasMarkdownTable &&
        message.tables &&
        message.tables.map((t, idx) => (
          <TableAnswer
            key={`struct-${idx}`}
            table={t}
            citations={message.citations}
            onOpenCitation={handleOpenCitation}
          />
        ))}

      {/* Render Structured Charts */}
      {message.charts && message.charts.map((c, idx) => <ChartAnswer key={idx} chart={c} />)}

      {/* Collapsible Sources Accordion */}
      {message.citations && message.citations.length > 0 && (
        <div className="mt-4 border border-hairline rounded-md bg-paper/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-mono text-muted hover:text-ink transition-colors cursor-pointer"
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
                  className="p-2.5 border border-hairline rounded hover:bg-paper cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="font-medium text-primary">{cite.documentTitle}</span>
                    <span className="text-muted">
                      Page {cite.page} ({cite.elementType})
                    </span>
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
        <div className="mt-4 flex flex-wrap gap-2">
          {message.followups.map((fText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendFollowup(fText)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans rounded-full border border-hairline bg-surface hover:bg-paper text-muted hover:text-ink transition-colors text-left cursor-pointer"
            >
              <span>{fText}</span>
              <ArrowRight className="w-3 h-3 text-primary" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
