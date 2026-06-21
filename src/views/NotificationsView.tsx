import { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, CheckCheck, Loader2, Dot } from 'lucide-react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';
import { ApiError } from '../lib/api';
import { formatTime, formatDate, humanize } from '../lib/format';
import type { NotificationRecord } from '../types/api';

interface Props {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

export function NotificationsView({ showNotification }: Props) {
  const { data, loading, error, reload } = useApi(() => listNotifications({ limit: 50 }), []);
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingState label="Loading notifications…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const items: NotificationRecord[] = data?.data ?? [];
  const unread = items.filter((n) => !n.readAt);

  const readAll = async () => {
    if (!unread.length) return;
    setBusy(true);
    try {
      await markAllNotificationsRead();
      showNotification('Marked Read', 'All notifications marked as read.', 'success');
      reload();
    } catch (e) {
      showNotification('Failed', e instanceof ApiError ? e.message : 'Could not update.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const readOne = async (n: NotificationRecord) => {
    if (n.readAt) return;
    try {
      await markNotificationRead(n.id);
      reload();
    } catch {
      /* silent */
    }
  };

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-white/50 border border-white/60 flex items-center justify-center text-slate-400 shadow-xl shadow-slate-200/50">
          <Bell className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900">You're all caught up</h2>
        <p className="text-slate-500 font-medium">No notifications right now.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 mb-1">Notifications</h2>
          <p className="text-slate-500 font-medium">{unread.length} unread · {items.length} total</p>
        </div>
        <button
          onClick={readAll}
          disabled={busy || unread.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
          Mark all read
        </button>
      </div>

      <div className="space-y-3">
        {items.map((n, i) => (
          <motion.button
            key={n.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => readOne(n)}
            className={`w-full text-left glass-card rounded-2xl p-4 flex gap-4 items-start transition-colors ${n.readAt ? 'opacity-70' : 'ring-1 ring-primary-200'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.readAt ? 'bg-slate-100 text-slate-400' : 'bg-primary-100 text-primary-600'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {!n.readAt && <Dot className="w-5 h-5 text-primary-500 -ml-1.5" />}
                <h4 className="font-bold text-slate-900 text-sm truncate">{n.title}</h4>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>
              <p className="text-xs text-slate-400 mt-1">{humanize(n.eventType)} · {formatDate(n.createdAt)} {formatTime(n.createdAt)}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
