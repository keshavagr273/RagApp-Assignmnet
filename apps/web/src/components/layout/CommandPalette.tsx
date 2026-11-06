import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '../../store/uiStore';
import { api, Collection, ThreadItem } from '../../services/api';
import { Search, Folder, MessageSquare, UploadCloud, X } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const setActiveCollection = useUIStore((s) => s.setActiveCollection);
  const setActiveThread = useUIStore((s) => s.setActiveThread);
  const setUploadModalOpen = useUIStore((s) => s.setUploadModalOpen);

  const [query, setQuery] = useState('');

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  const { data: collections = [] } = useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await api.get('/collections');
      return res.data.collections;
    },
    enabled: open,
  });

  const { data: threads = [] } = useQuery<ThreadItem[]>({
    queryKey: ['all-threads'],
    queryFn: async () => {
      const res = await api.get('/threads');
      return res.data.threads;
    },
    enabled: open,
  });

  if (!open) return null;

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );
  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-ink/40 p-4">
      <div className="w-full max-w-xl bg-surface border border-hairline rounded-lg shadow-sm overflow-hidden flex flex-col">
        {/* Input bar */}
        <div className="flex items-center px-4 py-3 border-b border-hairline bg-paper">
          <Search className="w-4 h-4 text-muted shrink-0 mr-2" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collections, threads, actions... (Esc to exit)"
            className="flex-1 bg-transparent text-sm text-ink focus:outline-none placeholder:text-muted"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded text-muted hover:text-ink"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-4">
          {/* Quick Action */}
          <div>
            <span className="text-[10px] font-mono uppercase text-muted tracking-wider px-2 block mb-1">
              Actions
            </span>
            <button
              onClick={() => {
                setOpen(false);
                setUploadModalOpen(true);
              }}
              className="w-full text-left px-3 py-2 rounded text-xs flex items-center gap-2 hover:bg-paper text-ink transition-colors"
            >
              <UploadCloud className="w-4 h-4 text-primary" />
              <span>Upload New PDF Documents</span>
            </button>
          </div>

          {/* Collections */}
          {filteredCollections.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase text-muted tracking-wider px-2 block mb-1">
                Collections
              </span>
              {filteredCollections.map((col) => (
                <button
                  key={col._id}
                  onClick={() => {
                    setActiveCollection(col._id);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-xs flex items-center gap-2 hover:bg-paper text-ink transition-colors"
                >
                  <Folder className="w-4 h-4 text-muted" />
                  <span>{col.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Threads */}
          {filteredThreads.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase text-muted tracking-wider px-2 block mb-1">
                Threads
              </span>
              {filteredThreads.map((th) => (
                <button
                  key={th._id}
                  onClick={() => {
                    setActiveCollection(th.collectionId);
                    setActiveThread(th._id);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded text-xs flex items-center gap-2 hover:bg-paper text-ink transition-colors truncate"
                >
                  <MessageSquare className="w-4 h-4 text-muted shrink-0" />
                  <span className="truncate">{th.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

