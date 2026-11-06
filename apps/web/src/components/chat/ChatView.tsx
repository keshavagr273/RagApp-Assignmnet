import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, MessageItem, Citation } from '../../services/api';
import { useUIStore } from '../../store/uiStore';
import { ChatMessage } from './ChatMessage';
import { Send, CornerDownLeft, Sparkles, AlertCircle } from 'lucide-react';

export const ChatView: React.FC = () => {
  const queryClient = useQueryClient();
  const activeThreadId = useUIStore((s) => s.activeThreadId);
  const activeCollectionId = useUIStore((s) => s.activeCollectionId);
  const setActiveThread = useUIStore((s) => s.setActiveThread);

  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch thread messages
  const { data: messages = [], isLoading } = useQuery<MessageItem[]>({
    queryKey: ['messages', activeThreadId],
    queryFn: async () => {
      if (!activeThreadId) return [];
      const res = await api.get(`/threads/${activeThreadId}/messages`);
      return res.data.messages;
    },
    enabled: !!activeThreadId,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSend = async (questionText: string) => {
    if (!questionText.trim() || isStreaming) return;
    setErrorMessage(null);

    let threadId = activeThreadId;

    // Create thread if none active
    if (!threadId) {
      if (!activeCollectionId) {
        setErrorMessage('Please select or create a collection first before asking a question.');
        return;
      }
      try {
        const createRes = await api.post('/threads', {
          collectionId: activeCollectionId,
          title: questionText.slice(0, 40),
        });
        threadId = createRes.data.thread._id;
        setActiveThread(threadId);
        queryClient.invalidateQueries({ queryKey: ['threads', activeCollectionId] });
      } catch (err: any) {
        setErrorMessage(err.response?.data?.error || 'Failed to create chat thread');
        return;
      }
    }

    // Optimistically show user message
    const tempUserMsg: MessageItem = {
      _id: `temp-${Date.now()}`,
      threadId: threadId!,
      role: 'user',
      content: questionText,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData<MessageItem[]>(['messages', threadId], (old = []) => [...old, tempUserMsg]);
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingCitations([]);

    try {
      const response = await fetch(`/api/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: questionText }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            const eventMatch = line.match(/^event:\s*(\w+)/m);
            const dataMatch = line.match(/^data:\s*(.+)$/m);

            if (eventMatch && dataMatch) {
              const eventType = eventMatch[1];
              try {
                const eventData = JSON.parse(dataMatch[1]);

                if (eventType === 'token') {
                  setStreamingContent((prev) => prev + eventData.token);
                } else if (eventType === 'citations') {
                  setStreamingCitations(eventData.citations || []);
                } else if (eventType === 'done') {
                  // Final message completed
                  queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
                } else if (eventType === 'error') {
                  setErrorMessage(eventData.error || 'Generation failed');
                }
              } catch (_parseErr) {
                // Ignore parse errors on SSE boundary
              }
            }
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with assistant');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingCitations([]);
      queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
    }
  };

  return (
    <div className="flex flex-col h-full bg-paper">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl w-full mx-auto">
        {isLoading ? (
          <div className="space-y-4 py-8">
            <div className="h-4 w-48 bg-hairline rounded skeleton-pulse" />
            <div className="h-16 w-full bg-hairline/60 rounded skeleton-pulse" />
            <div className="h-16 w-3/4 bg-hairline/60 rounded skeleton-pulse" />
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <div className="py-16 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded border border-hairline bg-surface flex items-center justify-center mx-auto mb-4 text-primary">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-medium text-ink">Grounded Document Q&A</h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              Ask questions across any uploaded PDFs. Every factual answer extracts precise text, tables, or charts and cites its verified source page.
            </p>

            <div className="mt-8 text-left space-y-2">
              <span className="text-xs font-mono uppercase text-muted tracking-wider">Sample Inquiries</span>
              {[
                'What is the Enterprise Tier availability SLA and incident response time?',
                'What was the Q3 FY2024 total revenue and subscription growth percentage?',
                'Compare the ARR trajectory across years from the growth charts.',
                'Which physical servers in the inventory are running with A100 GPUs?',
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sample)}
                  className="w-full text-left p-3 text-xs font-sans rounded border border-hairline bg-surface hover:bg-paper transition-colors flex items-center justify-between group"
                >
                  <span className="text-ink">{sample}</span>
                  <CornerDownLeft className="w-3.5 h-3.5 text-muted group-hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {messages.map((msg) => (
              <ChatMessage key={msg._id} message={msg} onSendFollowup={(q) => handleSend(q)} />
            ))}

            {/* Live Streaming Message Bubble */}
            {isStreaming && (
              <div className="my-6 max-w-3xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-display font-medium text-xs text-primary uppercase tracking-wider">FolioQ</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-hairline bg-primary/10 text-primary">
                    GENERATING
                  </span>
                </div>
                <div className="text-sm font-sans text-ink leading-relaxed whitespace-pre-wrap">
                  {streamingContent || (
                    <div className="space-y-2 py-2">
                      <div className="h-4 w-32 bg-hairline rounded skeleton-pulse" />
                      <div className="h-4 w-full bg-hairline/60 rounded skeleton-pulse" />
                    </div>
                  )}
                </div>
                {streamingCitations.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono text-muted">
                    {streamingCitations.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded border border-hairline bg-paper">
                        {c.documentTitle} · p.{c.page}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="my-4 p-3 rounded border border-secondary/30 bg-secondary/10 flex items-center gap-2 text-xs text-secondary">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-hairline bg-surface px-6 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="max-w-4xl mx-auto flex items-center gap-2 bg-paper border border-hairline rounded-md px-3 py-2 focus-within:border-primary transition-colors"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents... (Press '/' to focus)"
            disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-1.5 rounded bg-primary text-surface hover:opacity-90 disabled:opacity-40 transition-opacity"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="max-w-4xl mx-auto flex items-center justify-between mt-2 text-[11px] font-mono text-muted">
          <span>Answers grounded strictly in your documents with page citations</span>
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
};

