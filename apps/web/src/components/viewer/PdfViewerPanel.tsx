import React, { useState } from 'react';
import { useUIStore } from '../../store/uiStore';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from 'lucide-react';

export const PdfViewerPanel: React.FC = () => {
  const viewerOpen = useUIStore((s) => s.viewerOpen);
  const setViewerOpen = useUIStore((s) => s.setViewerOpen);
  const activeDocumentId = useUIStore((s) => s.activeDocumentId);
  const viewerPage = useUIStore((s) => s.viewerPage);
  const setViewerPage = useUIStore((s) => s.setViewerPage);
  const selectedCitation = useUIStore((s) => s.selectedCitation);

  const [zoom, setZoom] = useState(100);
  const [imageError, setImageError] = useState(false);

  if (!viewerOpen) return null;

  const imageUrl = activeDocumentId
    ? `/api/documents/${activeDocumentId}/pages/${viewerPage}/image`
    : null;

  return (
    <div className="w-96 md:w-[480px] lg:w-[560px] h-full border-l border-hairline bg-surface flex flex-col z-20 shrink-0">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-paper">
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-mono font-medium text-ink truncate">
            {selectedCitation?.documentTitle || 'Document Viewer'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 20))}
            className="p-1 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-muted px-1">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 20))}
            className="p-1 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-hairline mx-1" />

          {/* Close button */}
          <button
            onClick={() => setViewerOpen(false)}
            className="p-1 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors"
            title="Close viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Page Navigation Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-hairline bg-surface text-xs font-mono text-muted">
        <div className="flex items-center gap-2">
          <span>Page {viewerPage}</span>
          {selectedCitation && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-highlight/30 text-ink">
              Cited Source
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewerPage(Math.max(1, viewerPage - 1))}
            disabled={viewerPage <= 1}
            className="p-1 rounded hover:bg-hairline/40 disabled:opacity-30 transition-opacity"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewerPage(viewerPage + 1)}
            className="p-1 rounded hover:bg-hairline/40 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Canvas / Page View */}
      <div className="flex-1 overflow-auto p-4 bg-paper/40 flex justify-center items-start">
        {imageUrl && !imageError ? (
          <div
            className="relative border border-hairline bg-surface shadow-none"
            style={{ width: `${zoom}%`, transition: 'width 0.15s ease-out' }}
          >
            <img
              src={imageUrl}
              alt={`Page ${viewerPage}`}
              className="w-full h-auto block select-none"
              onError={() => setImageError(true)}
            />

            {/* Citation Bounding Box Highlight Overlay */}
            {selectedCitation?.bbox && selectedCitation.page === viewerPage && (
              <div
                className="absolute border-2 border-primary bg-highlight/35 pointer-events-none transition-all"
                style={{
                  left: `${selectedCitation.bbox.x}%`,
                  top: `${selectedCitation.bbox.y}%`,
                  width: `${selectedCitation.bbox.width}%`,
                  height: `${selectedCitation.bbox.height}%`,
                }}
              />
            )}
          </div>
        ) : (
          <div className="py-20 text-center text-xs font-mono text-muted">
            <p>Page {viewerPage} preview not available.</p>
          </div>
        )}
      </div>

      {/* Citation Details Footer */}
      {selectedCitation && (
        <div className="p-3 border-t border-hairline bg-paper text-xs">
          <span className="font-mono text-muted block mb-1">
            Cited Excerpt (Page {selectedCitation.page}):
          </span>
          <p className="font-sans text-ink leading-relaxed line-clamp-3 bg-surface p-2 rounded border border-hairline">
            "{selectedCitation.excerpt}"
          </p>
        </div>
      )}
    </div>
  );
};

