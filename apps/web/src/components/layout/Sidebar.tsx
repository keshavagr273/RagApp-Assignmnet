import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, Collection, DocumentItem, ThreadItem } from '../../services/api';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import {
  Folder,
  Plus,
  FileText,
  MessageSquare,
  UploadCloud,
  Layers,
  RefreshCw,
  Trash2,
  LogOut,
  Moon,
  Sun,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const activeCollectionId = useUIStore((s) => s.activeCollectionId);
  const setActiveCollection = useUIStore((s) => s.setActiveCollection);
  const activeThreadId = useUIStore((s) => s.activeThreadId);
  const setActiveThread = useUIStore((s) => s.setActiveThread);
  const activeDocumentId = useUIStore((s) => s.activeDocumentId);
  const setActiveDocument = useUIStore((s) => s.setActiveDocument);
  const setViewerOpen = useUIStore((s) => s.setViewerOpen);
  const setViewerPage = useUIStore((s) => s.setViewerPage);
  const setUploadModalOpen = useUIStore((s) => s.setUploadModalOpen);
  const setElementInspectorDocId = useUIStore((s) => s.setElementInspectorDocId);
  const darkMode = useUIStore((s) => s.darkMode);
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Fetch Collections
  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await api.get('/collections');
      return res.data.collections;
    },
  });

  // Auto-select first collection if none selected
  React.useEffect(() => {
    if (!activeCollectionId && collections.length > 0) {
      setActiveCollection(collections[0]._id);
    }
  }, [collections, activeCollectionId, setActiveCollection]);

  // Fetch Documents for active collection
  const { data: documents = [] } = useQuery<DocumentItem[]>({
    queryKey: ['documents', activeCollectionId],
    queryFn: async () => {
      if (!activeCollectionId) return [];
      const col = collections.find((c) => c._id === activeCollectionId);
      if (!col || !col.documentIds || col.documentIds.length === 0) return [];

      const docPromises = col.documentIds.map(async (docId) => {
        try {
          const res = await api.get(`/documents/${docId}`);
          return res.data.document;
        } catch (_e) {
          return null;
        }
      });
      const resolved = await Promise.all(docPromises);
      return resolved.filter(Boolean);
    },
    enabled: !!activeCollectionId && collections.length > 0,
  });

  // Auto-select first document if none active
  React.useEffect(() => {
    if (!activeDocumentId && documents.length > 0) {
      const readyDoc = documents.find((d) => d.status === 'ready') || documents[0];
      if (readyDoc) {
        setActiveDocument(readyDoc._id);
      }
    }
  }, [documents, activeDocumentId, setActiveDocument]);

  // Fetch Threads for active collection
  const { data: threads = [] } = useQuery<ThreadItem[]>({
    queryKey: ['threads', activeCollectionId],
    queryFn: async () => {
      if (!activeCollectionId) return [];
      const res = await api.get(`/threads?collectionId=${activeCollectionId}`);
      return res.data.threads;
    },
    enabled: !!activeCollectionId,
  });

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      const res = await api.post('/collections', { name: newCollectionName.trim() });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setActiveCollection(res.data.collection._id);
      setNewCollectionName('');
      setIsCreatingCollection(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateThread = async () => {
    if (!activeCollectionId) return;
    try {
      const res = await api.post('/threads', {
        collectionId: activeCollectionId,
        title: 'New Thread',
      });
      queryClient.invalidateQueries({ queryKey: ['threads', activeCollectionId] });
      setActiveThread(res.data.thread._id);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document and its chunks?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      queryClient.invalidateQueries({ queryKey: ['documents', activeCollectionId] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleReprocessDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/documents/${docId}/reprocess`);
      queryClient.invalidateQueries({ queryKey: ['documents', activeCollectionId] });
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <aside className="w-72 h-full border-r border-hairline bg-surface flex flex-col z-20 shrink-0">
      {/* App Branding */}
      <div className="p-4 border-b border-hairline flex items-center justify-between bg-paper">
        <div>
          <h1 className="font-display font-medium text-lg tracking-tight text-ink">FolioQ</h1>
          <p className="text-[11px] font-mono text-muted uppercase tracking-wider">Document Intelligence</p>
        </div>
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="p-1.5 rounded border border-hairline text-muted hover:text-ink hover:bg-hairline/40 transition-colors"
          title="Open Command Palette (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Collections Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-muted tracking-wider">Collections</span>
            <button
              onClick={() => setIsCreatingCollection(true)}
              className="p-1 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors"
              title="Create Collection"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isCreatingCollection && (
            <form onSubmit={handleCreateCollection} className="mb-2">
              <input
                type="text"
                autoFocus
                placeholder="Collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onBlur={() => {
                  if (!newCollectionName.trim()) setIsCreatingCollection(false);
                }}
                className="w-full text-xs px-2.5 py-1.5 rounded border border-primary bg-paper text-ink focus:outline-none"
              />
            </form>
          )}

          <div className="space-y-1">
            {collections.length === 0 && !isCreatingCollection && (
              <button
                onClick={() => setIsCreatingCollection(true)}
                className="w-full text-left px-2.5 py-2 rounded text-xs border border-dashed border-hairline text-muted hover:text-ink hover:border-primary/40 flex items-center gap-1.5 transition-colors font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create a collection</span>
              </button>
            )}

            {collections.map((col) => (
              <button
                key={col._id}
                onClick={() => setActiveCollection(col._id)}
                className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                  activeCollectionId === col._id
                    ? 'bg-primary text-surface font-medium'
                    : 'text-ink hover:bg-paper'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  <span className="truncate">{col.name}</span>
                </div>
                <span className="text-[11px] font-mono opacity-60 shrink-0">
                  {col.documentIds?.length || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Threads Section */}
        {activeCollectionId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase text-muted tracking-wider">Threads</span>
              <button
                onClick={handleCreateThread}
                className="p-1 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors"
                title="New Thread"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {threads.map((t) => (
                <button
                  key={t._id}
                  onClick={() => setActiveThread(t._id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center gap-2 truncate transition-colors ${
                    activeThreadId === t._id
                      ? 'bg-paper text-ink font-medium border border-hairline'
                      : 'text-muted hover:text-ink hover:bg-paper/50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Document Library Section */}
        {activeCollectionId && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase text-muted tracking-wider">Documents</span>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-primary hover:underline"
              >
                <UploadCloud className="w-3 h-3" />
                <span>Upload</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <p className="text-xs text-muted font-mono py-2">No documents in this collection.</p>
            ) : (
              <div className="space-y-1.5">
                {documents.map((doc) => {
                  const isActive = activeDocumentId === doc._id;
                  return (
                    <div
                      key={doc._id}
                      onClick={() => {
                        setActiveDocument(doc._id);
                        setViewerPage(1);
                        setViewerOpen(true);
                      }}
                      className={`p-2 rounded border transition-colors text-xs group cursor-pointer ${
                        isActive
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-hairline bg-paper/30 hover:bg-paper/70 text-ink'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 truncate max-w-[75%]">
                          <FileText
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'text-primary' : 'text-primary'
                            }`}
                          />
                          <span
                            className={`font-mono truncate ${
                              isActive ? 'font-medium text-primary' : 'text-ink'
                            }`}
                            title={doc.originalName}
                          >
                            {doc.originalName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-muted">
                          {doc.pageCount ? `${doc.pageCount}p` : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono">
                        {doc.status === 'ready' ? (
                          <span className="text-primary flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Ready</span>
                          </span>
                        ) : doc.status === 'failed' ? (
                          <span className="text-secondary flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Failed</span>
                          </span>
                        ) : (
                          <span className="text-muted capitalize skeleton-pulse">
                            {doc.status}...
                          </span>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setElementInspectorDocId(doc._id);
                            }}
                            className="p-1 rounded text-muted hover:text-ink hover:bg-hairline"
                            title="Inspect Extracted Elements"
                          >
                            <Layers className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReprocessDocument(doc._id, e);
                            }}
                            className="p-1 rounded text-muted hover:text-ink hover:bg-hairline"
                            title="Reprocess Document"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDocument(doc._id, e);
                            }}
                            className="p-1 rounded text-muted hover:text-secondary hover:bg-hairline"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer User Bar */}
      <div className="p-3 border-t border-hairline bg-paper flex items-center justify-between text-xs">
        <div className="truncate max-w-[130px]">
          <span className="font-medium text-ink block truncate">{user?.name}</span>
          <span className="text-[11px] font-mono text-muted block truncate">{user?.email}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-1.5 rounded text-muted hover:text-ink hover:bg-hairline/40 transition-colors cursor-pointer"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-highlight" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded text-muted hover:text-secondary hover:bg-hairline/40 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

