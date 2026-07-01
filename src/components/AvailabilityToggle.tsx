import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';
import type { ToastType } from './Toast';

interface AvailabilityToggleProps {
  showNotification: (title: string, message: string, type?: ToastType) => void;
  labelClassName?: string;
  showLabel?: boolean;
}

export function AvailabilityToggle({
  showNotification,
  labelClassName,
  showLabel = true,
}: AvailabilityToggleProps) {
  const { profile, toggleAvailability } = useAuth();
  const [busy, setBusy] = useState(false);
  const isOnline = profile?.active ?? false;

  const toggleStatus = async () => {
    if (busy || !profile) return;

    setBusy(true);
    try {
      const updated = await toggleAvailability(!isOnline);
      showNotification(
        'Status Updated',
        `You are now ${updated.active ? 'online and receiving assignments' : 'offline'}.`,
        updated.active ? 'success' : 'info',
      );
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not update availability.';
      showNotification('Update Failed', msg, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className={cn('text-sm font-medium text-slate-600', labelClassName)}>
          {busy ? '...' : isOnline ? 'Online' : 'Offline'}
        </span>
      )}
      <button
        type="button"
        onClick={toggleStatus}
        disabled={busy || !profile}
        aria-label={isOnline ? 'Switch to offline' : 'Switch to online'}
        aria-pressed={isOnline}
        className={cn(
          'w-12 h-6 rounded-full p-1 transition-colors duration-300 relative disabled:opacity-60',
          isOnline ? 'bg-primary-500' : 'bg-slate-300',
        )}
      >
        <motion.div
          layout
          className="w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center"
          animate={{ x: isOnline ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {busy && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
        </motion.div>
      </button>
    </div>
  );
}
