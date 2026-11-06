import React, { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '../../store/uiStore';
import { api } from '../../services/api';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface FileUploadProgress {
  id: string;
  name: string;
  size: number;
  status: 'queued' | 'rendering' | 'parsing' | 'embedding' | 'ready' | 'failed';
  error?: string;
  pageCount?: number;
}

export const UploadModal: React.FC = () => {
  const queryClient = useQueryClient();
  const uploadModalOpen = useUIStore((s) => s.uploadModalOpen);
  const setUploadModalOpen = useUIStore((s) => s.setUploadModalOpen);
  const activeCollectionId = useUIStore((s) => s.activeCollectionId);

  const [filesToUpload, setFilesToUpload] = useState<FileUploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!uploadModalOpen) return null;

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !activeCollectionId) return;

    const files = Array.from(fileList).filter((f) => f.type === 'application/pdf');
    if (files.length === 0) return;

    const initialRows: FileUploadProgress[] = files.map((f) => ({
      id: `temp-${f.name}-${Date.now()}`,
      name: f.name,
      size: f.size,
      status: 'queued',
    }));

    setFilesToUpload(initialRows);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    try {
      const res = await api.post(`/collections/${activeCollectionId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedDocs = res.data.documents || [];

      // Start SSE progress tracking for each document
      uploadedDocs.forEach((doc: any) => {
        listenToProgress(doc._id);
      });

      queryClient.invalidateQueries({ queryKey: ['documents', activeCollectionId] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    } catch (err: any) {
      setFilesToUpload((prev) =>
        prev.map((p) => ({
          ...p,
          status: 'failed',
          error: err.response?.data?.error || 'Upload failed',
        }))
      );
    } finally {
      // Finished initiating
    }
  };

  const listenToProgress = (docId: string) => {
    const sse = new EventSource(`/api/documents/${docId}/status`);

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setFilesToUpload((prev) =>
          prev.map((item) =>
            item.id.includes(docId) || item.status !== 'ready'
              ? {
                  ...item,
                  status: data.status,
                  pageCount: data.pageCount,
                  error: data.error,
                }
              : item
          )
        );

        if (data.status === 'ready' || data.status === 'failed') {
          sse.close();
          queryClient.invalidateQueries({ queryKey: ['documents', activeCollectionId] });
        }
      } catch (_e) {
        // Parse error
      }
    };

    sse.onerror = () => {
      sse.close();
    };
  };

  const handleRetry = async (docId: string) => {
    try {
      await api.post(`/documents/${docId}/reprocess`);
      listenToProgress(docId);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-none p-4">
      <div className="w-full max-w-xl bg-surface border border-hairline rounded-lg shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline bg-paper">
          <div>
            <h3 className="font-display font-medium text-lg text-ink">Upload Documents</h3>
            <p className="text-xs text-muted mt-0.5">PDF files up to 50 MB each</p>
          </div>
          <button
            onClick={() => setUploadModalOpen(false)}
            className="p-1.5 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dropzone */}
        <div className="p-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFilesSelected(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-hairline hover:border-primary/60 rounded-lg p-8 text-center cursor-pointer bg-paper/30 hover:bg-paper/60 transition-colors"
          >
            <UploadCloud className="w-10 h-10 text-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-ink">Click to upload or drag and drop PDFs here</p>
            <p className="text-xs text-muted mt-1 font-mono">Accepts mixed text, tables, charts, and diagrams</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </div>

          {/* Files Progress List */}
          {filesToUpload.length > 0 && (
            <div className="mt-6 space-y-2 max-h-60 overflow-y-auto">
              <span className="text-xs font-mono uppercase text-muted tracking-wider block mb-1">
                Ingestion Pipeline Status
              </span>
              {filesToUpload.map((f, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-hairline rounded flex items-center justify-between text-xs bg-paper/40"
                >
                  <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-mono text-ink truncate">{f.name}</span>
                    <span className="text-muted text-[11px] shrink-0 font-mono">
                      ({(f.size / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {f.status === 'ready' ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ready ({f.pageCount || 1} pages)</span>
                      </span>
                    ) : f.status === 'failed' ? (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-secondary bg-secondary/10 px-2 py-0.5 rounded">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Failed</span>
                        </span>
                        <button
                          onClick={() => handleRetry(f.id)}
                          className="p-1 text-muted hover:text-ink rounded border border-hairline"
                          title="Retry Ingestion"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-muted bg-hairline/40 px-2 py-0.5 rounded capitalize skeleton-pulse">
                        {f.status}...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-hairline bg-paper flex justify-end">
          <button
            onClick={() => setUploadModalOpen(false)}
            className="px-4 py-1.5 text-xs font-medium rounded border border-hairline bg-surface hover:bg-paper text-ink transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
