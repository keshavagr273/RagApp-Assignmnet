import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '../../store/uiStore';
import { api, DocumentItem } from '../../services/api';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export const PdfViewerPanel: React.FC = () => {
  const viewerOpen = useUIStore((s) => s.viewerOpen);
  const setViewerOpen = useUIStore((s) => s.setViewerOpen);
  const activeDocumentId = useUIStore((s) => s.activeDocumentId);
  const viewerPage = useUIStore((s) => s.viewerPage);
  const setViewerPage = useUIStore((s) => s.setViewerPage);
  const selectedCitation = useUIStore((s) => s.selectedCitation);

  const [zoom, setZoom] = useState(100);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Fetch document details for accurate title and total pages
  const { data: docData } = useQuery<{ document: DocumentItem }>({
    queryKey: ['document', activeDocumentId],
    queryFn: async () => {
      if (!activeDocumentId) return null as any;
      const res = await api.get(`/documents/${activeDocumentId}`);
      return res.data;
    },
    enabled: !!activeDocumentId,
  });

  const currentDoc = docData?.document;
  const totalPages = currentDoc?.pageCount || 1;
  const documentTitle =
    selectedCitation?.documentTitle || currentDoc?.originalName || 'Document Viewer';

  // Reset loading & error states when document or page changes
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [activeDocumentId, viewerPage]);

  if (!viewerOpen) return null;

  if (!activeDocumentId) {
    return (
      <div className="w-96 md:w-[480px] lg:w-[560px] h-full border-l border-hairline bg-surface flex flex-col z-20 shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-paper">
          <div className="flex items-center gap-2 overflow-hidden">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-mono font-medium text-ink truncate">Document Viewer</span>
          </div>
          <button
            type="button"
            onClick={() => setViewerOpen(false)}
            className="p-1 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors cursor-pointer"
            title="Close viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <FileText className="w-10 h-10 text-muted/30 mb-3" />
          <p className="text-xs font-mono text-muted mb-1">No document selected</p>
          <p className="text-xs text-muted/80">Click any document in the sidebar to view its pages.</p>
        </div>
      </div>
    );
  }

  const imageUrl = `/api/documents/${activeDocumentId}/pages/${viewerPage}/image`;

  return (
    <div className="w-96 md:w-[480px] lg:w-[560px] h-full border-l border-hairline bg-surface flex flex-col z-20 shrink-0">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-paper">
        <div className="flex items-center gap-2 overflow-hidden max-w-[65%]">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-mono font-medium text-ink truncate" title={documentTitle}>
            {documentTitle}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(50, z - 20))}
            className="p-1 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-muted px-1">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(200, z + 20))}
            className="p-1 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-hairline mx-1" />

          {/* Close button */}
          <button
            type="button"
            onClick={() => setViewerOpen(false)}
            className="p-1 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors cursor-pointer"
            title="Close viewer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Page Navigation Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-hairline bg-surface text-xs font-mono text-muted">
        <div className="flex items-center gap-2">
          <span className="text-ink font-medium">
            Page {viewerPage} of {totalPages}
          </span>
          {selectedCitation && selectedCitation.page === viewerPage && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-highlight/30 text-ink border border-highlight/40">
              Cited Source
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewerPage(Math.max(1, viewerPage - 1))}
            disabled={viewerPage <= 1}
            className="p-1 rounded hover:bg-hairline/40 disabled:opacity-30 transition-opacity cursor-pointer disabled:cursor-not-allowed"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewerPage(Math.min(totalPages, viewerPage + 1))}
            disabled={viewerPage >= totalPages}
            className="p-1 rounded hover:bg-hairline/40 disabled:opacity-30 transition-opacity cursor-pointer disabled:cursor-not-allowed"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Canvas / Page View */}
      <div className="flex-1 overflow-auto p-4 bg-paper/40 flex justify-center items-start relative">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper/50 backdrop-blur-xs z-10">
            <div className="flex items-center gap-2 text-xs font-mono text-muted">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading page {viewerPage}...</span>
            </div>
          </div>
        )}

        {imageUrl && !imageError ? (
          <div
            className="relative border border-hairline bg-surface shadow-xs"
            style={{ width: `${zoom}%`, transition: 'width 0.15s ease-out' }}
          >
            <img
              key={`${activeDocumentId}-${viewerPage}`}
              src={imageUrl}
              alt={`Page ${viewerPage}`}
              className="w-full h-auto block select-none"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
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
            <AlertCircle className="w-8 h-8 text-secondary/60 mx-auto mb-2" />
            <p>Page {viewerPage} preview not available.</p>
            <button
              type="button"
              onClick={() => {
                setImageError(false);
                setImageLoading(true);
              }}
              className="mt-2 text-[11px] font-sans underline text-primary hover:text-ink cursor-pointer"
            >
              Retry loading
            </button>
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
