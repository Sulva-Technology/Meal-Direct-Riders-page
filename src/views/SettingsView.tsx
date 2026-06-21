import { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { getNotificationPreferences, updateNotificationPreferences } from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { NotificationPreferences } from '../types/api';

interface Props {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

type PrefKey = keyof Omit<NotificationPreferences, 'userId' | 'updatedAt'>;

const CHANNELS: { key: PrefKey; label: string; desc: string }[] = [
  { key: 'inAppEnabled', label: 'In-app', desc: 'Show notifications inside the app' },
  { key: 'pushEnabled', label: 'Push', desc: 'Send push notifications to your device' },
  { key: 'emailEnabled', label: 'Email', desc: 'Email me important updates' },
];

const TOPICS: { key: PrefKey; label: string; desc: string }[] = [
  { key: 'orderUpdates', label: 'Order updates', desc: 'New orders and order changes' },
  { key: 'deliveryUpdates', label: 'Delivery updates', desc: 'Pickup and delivery events' },
  { key: 'paymentUpdates', label: 'Payment updates', desc: 'Payment confirmations' },
  { key: 'settlementUpdates', label: 'Settlement updates', desc: 'Payout and settlement status' },
  { key: 'escalationUpdates', label: 'Escalation updates', desc: 'Issues and escalations' },
];

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative shrink-0 disabled:opacity-60 ${on ? 'bg-primary-500' : 'bg-slate-300'}`}
    >
      <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" animate={{ x: on ? 24 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </button>
  );
}

export function SettingsView({ showNotification }: Props) {
  const { logout } = useAuth();
  const { data, loading, error, reload } = useApi(getNotificationPreferences, []);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [savingKey, setSavingKey] = useState<PrefKey | null>(null);

  const current = prefs ?? data;
  if (loading) return <LoadingState label="Loading settings…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!current) return null;

  const toggle = async (key: PrefKey) => {
    const next = { ...current, [key]: !current[key] } as NotificationPreferences;
    setPrefs(next);
    setSavingKey(key);
    try {
      const saved = await updateNotificationPreferences({ [key]: next[key] });
      setPrefs(saved);
    } catch (e) {
      setPrefs(current); // revert
      showNotification('Save Failed', e instanceof ApiError ? e.message : 'Could not save.', 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const Section = ({ title, rows }: { title: string; rows: typeof CHANNELS }) => (
    <div className="glass-card rounded-3xl p-6">
      <h3 className="font-display font-bold text-lg text-slate-900 mb-4">{title}</h3>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
            <div>
              <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                {r.label}
                {savingKey === r.key && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
              </p>
              <p className="text-xs text-slate-500">{r.desc}</p>
            </div>
            <Toggle on={Boolean(current[r.key])} onClick={() => toggle(r.key)} disabled={savingKey !== null} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Settings</h2>
        <p className="text-slate-500 font-medium">Choose how Meal Direct reaches you.</p>
      </div>

      <Section title="Channels" rows={CHANNELS} />
      <Section title="Topics" rows={TOPICS} />

      <div className="glass-card rounded-3xl p-6">
        <h3 className="font-display font-bold text-lg text-slate-900 mb-1">Account</h3>
        <p className="text-sm text-slate-500 mb-4">Sign out of this device.</p>
        <button onClick={() => logout()} className="px-5 py-2.5 bg-danger/10 text-danger rounded-xl text-sm font-semibold hover:bg-danger/20 transition-colors">
          Log Out
        </button>
      </div>
    </div>
  );
}
