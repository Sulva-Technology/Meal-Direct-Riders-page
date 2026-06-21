import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, PackageSearch, ArrowRight, CheckCircle2, Loader2, Clock, MapPin } from 'lucide-react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { listAssignments, acceptAssignment, markAssignmentPickedUp } from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';
import { ApiError } from '../lib/api';
import { formatKoboCompact, humanize } from '../lib/format';
import type { RiderAssignmentSummary } from '../types/api';

interface PickupQueueViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const QUEUE_STATUSES = ['assigned', 'accepted'];

export function PickupQueueView({ navigate, showNotification }: PickupQueueViewProps) {
  const { data, loading, error, reload } = useApi(() => listAssignments(), []);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (loading) return <LoadingState label="Loading pickup queue…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const all: RiderAssignmentSummary[] = data?.data ?? [];
  const queue = all.filter((a) => QUEUE_STATUSES.includes(a.status));

  const doAction = async (a: RiderAssignmentSummary) => {
    setBusyId(a.id);
    try {
      if (a.status === 'assigned') {
        await acceptAssignment(a.id);
        showNotification('Assignment Accepted', `You accepted the batch from ${a.vendorDisplayName}.`, 'success');
        reload();
      } else {
        await markAssignmentPickedUp(a.id);
        showNotification('Pickup Confirmed', `Picked up ${a.orderCount} meals from ${a.vendorDisplayName}.`, 'success');
        setTimeout(() => navigate('assigned_orders'), 800);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Action failed. Try again.';
      showNotification('Failed', msg, 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Pickup Queue</h2>
        <p className="text-slate-500 font-medium">Accept new batches and confirm vendor pickups.</p>
      </div>

      <div className="grid gap-6">
        <AnimatePresence>
          {queue.map((batch, i) => {
            const ready = batch.status === 'accepted';
            const isBusy = busyId === batch.id;
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                key={batch.id}
                className="glass-card rounded-3xl p-6 relative overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ready ? 'bg-[#10B981]' : 'bg-warning-500'}`} />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-4">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">{batch.deliverySlotName}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${ready ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-warning-100 text-warning-700'}`}>
                        {humanize(batch.status)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Store className="w-5 h-5 text-primary-500" />
                      {batch.vendorDisplayName}
                    </h3>

                    <div className="flex flex-wrap gap-6 border-t border-slate-200/50 pt-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> Target Zone</p>
                        <p className="font-medium text-slate-800">{batch.zoneName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Delivery Time</p>
                        <p className="font-medium text-slate-800">{batch.deliveryTime || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase">Earnings</p>
                        <p className="font-medium text-slate-800">{formatKoboCompact(batch.deliveryEarningsKobo)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col justify-center bg-white/40 p-4 rounded-2xl border border-white/60 min-w-[200px]">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                        <PackageSearch className="w-6 h-6 text-[#10B981]" />
                      </div>
                      <p className="text-xs text-slate-500 font-medium tracking-wide">BATCH VOLUME</p>
                      <p className="text-2xl font-display font-bold text-slate-900">
                        {batch.orderCount} <span className="text-sm text-slate-500 font-medium">meals</span>
                      </p>
                    </div>
                    <button
                      onClick={() => doAction(batch)}
                      disabled={isBusy}
                      className={`w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 ${
                        ready ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-lg shadow-[#10B981]/20' : 'bg-slate-800 hover:bg-slate-900 text-white'
                      }`}
                    >
                      {isBusy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : ready ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Confirm Pickup
                        </>
                      ) : (
                        <>
                          Accept Batch <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {queue.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
            </div>
            <h3 className="font-display font-bold text-xl text-slate-900">Queue is clear</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">No batches awaiting acceptance or pickup. Stay online for new assignments.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
