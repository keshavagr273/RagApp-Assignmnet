import React from 'react';
import { Citation } from '../../services/api';
import { FileText } from 'lucide-react';

interface InlineContentProps {
  text: string;
  citations?: Citation[];
  onOpenCitation?: (docTitle: string, page: number) => void;
  isFirstColPage?: boolean;
}

/**
 * Renders inline text with citation pills, bold, italic, code, and page tags
 */
export const InlineContent: React.FC<InlineContentProps> = ({
  text,
  citations,
  onOpenCitation,
  isFirstColPage,
}) => {
  if (!text) return null;

  // If this is a page column and contains e.g. "p.1" or "Page 2" or "1"
  if (isFirstColPage) {
    const pageMatch = text.trim().match(/^p(?:age)?\.?\s*(\d+)$/i) || text.trim().match(/^(\d+)$/);
    if (pageMatch) {
      const pageNum = parseInt(pageMatch[1], 10);
      return (
        <button
          type="button"
          onClick={() => onOpenCitation?.('', pageNum)}
          className="inline-flex items-center justify-center font-mono text-[11px] font-semibold px-2 py-0.5 rounded border border-hairline bg-paper/80 text-primary hover:bg-highlight/30 hover:border-primary/40 transition-colors shadow-none cursor-pointer"
          title={`Jump to Page ${pageNum}`}
        >
          p.{pageNum}
        </button>
      );
    }
  }

  // Regex to detect citations: [DocName, p.1] or [DocName · p.1] or [p.1]
  const citationSplitRegex = /(\[(?:[^\]]+?(?:,\s*|\s*·\s*|\s+))?(?:p\.|page\s*)\d+\])/g;
  const parts = text.split(citationSplitRegex);

  return (
    <>
      {parts.map((part, pIdx) => {
        if (!part) return null;

        // Check if part is citation pill
        const citeMatch = part.match(/^\[(?:([^\]]+?)(?:,\s*|\s*·\s*|\s+))?(?:p\.|page\s*)(\d+)\]$/);
        if (citeMatch) {
          const rawDoc = citeMatch[1]?.trim() || '';
          const pageNum = parseInt(citeMatch[2], 10);
          const matchingCite = citations?.find(
            (c) => c.page === pageNum || (rawDoc && c.documentTitle.toLowerCase().includes(rawDoc.toLowerCase()))
          );
          const docTitle = rawDoc || matchingCite?.documentTitle || '';
          const shortTitle = docTitle.length > 18 ? docTitle.slice(0, 15) + '…' : docTitle;

          return (
            <button
              key={pIdx}
              type="button"
              onClick={() => onOpenCitation?.(docTitle, pageNum)}
              className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 text-xs font-mono font-medium rounded border border-hairline bg-highlight/20 text-ink hover:bg-highlight/40 transition-colors cursor-pointer align-baseline"
              title={`Open ${docTitle || 'Document'} at page ${pageNum}`}
            >
              <FileText className="w-3 h-3 text-primary inline shrink-0" />
              <span>
                {shortTitle ? `${shortTitle} · ` : ''}p.{pageNum}
              </span>
            </button>
          );
        }

        // Sub-split by code (`code`), bold (**bold**), and italic (*italic*)
        const subParts = part.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

        return (
          <React.Fragment key={pIdx}>
            {subParts.map((sub, sIdx) => {
              if (!sub) return null;
              if (sub.startsWith('`') && sub.endsWith('`') && sub.length > 2) {
                return (
                  <code
                    key={sIdx}
                    className="font-mono text-xs px-1.5 py-0.5 rounded border border-hairline bg-paper/60 text-primary"
                  >
                    {sub.slice(1, -1)}
                  </code>
                );
              }
              if (sub.startsWith('**') && sub.endsWith('**') && sub.length > 4) {
                return (
                  <strong key={sIdx} className="font-semibold text-ink">
                    {sub.slice(2, -2)}
                  </strong>
                );
              }
              if (sub.startsWith('*') && sub.endsWith('*') && sub.length > 2) {
                return (
                  <em key={sIdx} className="italic text-ink">
                    {sub.slice(1, -1)}
                  </em>
                );
              }
              return sub;
            })}
          </React.Fragment>
        );
      })}
    </>
  );
};

