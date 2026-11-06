import React from 'react';
import { Sidebar } from './Sidebar';
import { ChatView } from '../chat/ChatView';
import { PdfViewerPanel } from '../viewer/PdfViewerPanel';
import { UploadModal } from '../documents/UploadModal';
import { ElementInspectorModal } from '../documents/ElementInspectorModal';
import { CommandPalette } from './CommandPalette';
import { useUIStore } from '../../store/uiStore';
import { useQuery } from '@tanstack/react-query';
import { api, Collection } from '../../services/api';
import { PanelRightClose, PanelRightOpen, UploadCloud } from 'lucide-react';

export const AppShell: React.FC = () => {
  const activeCollectionId = useUIStore((s) => s.activeCollectionId);
  const viewerOpen = useUIStore((s) => s.viewerOpen);
  const setViewerOpen = useUIStore((s) => s.setViewerOpen);
  const setUploadModalOpen = useUIStore((s) => s.setUploadModalOpen);

  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await api.get('/collections');
      return res.data.collections;
    },
  });

  const activeCollection = collections.find((c) => c._id === activeCollectionId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-paper font-sans">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Center Main Work Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-paper">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-hairline bg-surface px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-medium text-base text-ink">
              {activeCollection?.name || 'Workspace'}
            </h2>
            {activeCollection?.description && (
              <span className="text-xs text-muted truncate max-w-xs hidden md:inline">
                {activeCollection.description}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded border border-hairline bg-paper hover:bg-hairline/40 text-ink transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-primary" />
              <span>Upload PDF</span>
            </button>

            <button
              onClick={() => setViewerOpen(!viewerOpen)}
              className="p-1.5 rounded border border-hairline text-muted hover:text-ink hover:bg-paper transition-colors"
              title={viewerOpen ? 'Collapse Document Panel' : 'Expand Document Panel'}
            >
              {viewerOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Chat / Interaction view */}
        <div className="flex-1 h-[calc(100%-3.5rem)] overflow-hidden">
          <ChatView />
        </div>
      </main>

      {/* Right PDF / Citation Viewer Panel */}
      <PdfViewerPanel />

      {/* Modals & Overlays */}
      <UploadModal />
      <ElementInspectorModal />
      <CommandPalette />
    </div>
  );
};

