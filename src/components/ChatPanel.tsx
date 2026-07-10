import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, MessageCircle, Send, X } from 'lucide-react';
import { listBatchMessages, sendBatchMessage } from '../lib/endpoints';
import { useApi, useMutation } from '../lib/useApi';
import { ApiError } from '../lib/api';
import type { ChatMessage } from '../types/api';

interface ChatPanelProps {
  batchId: string;
  title?: string;
  onClose: () => void;
}

// Newest-first from the API; flip to chronological for a natural chat transcript.
async function loadMessages(batchId: string): Promise<ChatMessage[]> {
  const { data } = await listBatchMessages(batchId, { limit: 50 });
  return [...data].reverse();
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ChatPanel({ batchId, title, onClose }: ChatPanelProps) {
  const { data, loading, error, reload } = useApi(() => loadMessages(batchId), [batchId], {
    pollMs: 3000,
  });
  const { run: send, pending } = useMutation(sendBatchMessage);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = data ?? [];

  // Stick to the bottom as new messages arrive.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const submit = useCallback(async () => {
    const body = draft.trim();
    if (!body || pending) return;
    setSendError(null);
    try {
      await send(batchId, body);
      setDraft('');
      reload();
    } catch (e) {
      setSendError(e instanceof ApiError ? e.message : 'Could not send. Try again.');
    }
  }, [draft, pending, send, batchId, reload]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 40, scale: 0.98 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-lg h-[85vh] sm:h-[70vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-9 h-9 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-slate-900 truncate">{title || 'Batch chat'}</h3>
              <p className="text-xs text-slate-500">Customers see each other only as “Customer N”.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
          {loading && (
            <div className="h-full flex items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          {error && !loading && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-slate-500">Could not load the chat.</p>
              <button onClick={reload} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold">
                Retry
              </button>
            </div>
          )}
          {!loading && !error && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 px-6">
              <MessageCircle className="w-10 h-10 mb-3" />
              <p className="text-sm">No messages yet. Say hello to your batch.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${m.mine ? 'bg-[#10B981] text-white rounded-br-sm' : 'bg-white/80 text-slate-800 border border-white/70 rounded-bl-sm'}`}>
                {!m.mine && (
                  <p className="text-[11px] font-bold mb-0.5 opacity-70">
                    {m.senderLabel}
                    {m.senderRole === 'rider' ? ' · Rider' : ''}
                  </p>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`text-[10px] mt-1 text-right ${m.mine ? 'text-white/70' : 'text-slate-400'}`}>{formatTime(m.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200/60 px-3 py-3 shrink-0">
          {sendError && <p className="text-xs text-danger mb-2 px-1">{sendError}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              rows={1}
              placeholder="Message the batch…"
              className="flex-1 resize-none bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/50 max-h-28"
            />
            <button
              onClick={() => void submit()}
              disabled={pending || draft.trim().length === 0}
              className="min-h-11 min-w-11 rounded-2xl bg-[#10B981] text-white flex items-center justify-center hover:bg-[#059669] disabled:opacity-60 shrink-0"
              aria-label="Send message"
            >
              {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
