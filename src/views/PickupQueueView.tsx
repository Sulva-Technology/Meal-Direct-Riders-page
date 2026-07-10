import { useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, CheckCircle2, Clock, Loader2, MapPin, MessageCircle, PackageSearch, ShieldAlert, Store } from 'lucide-react';
import { ChatPanel } from '../components/ChatPanel';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { acceptAssignment, getAssignment, listAssignments, markAssignmentArrivedAtVendor, markAssignmentPickedUp } from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';
import { ApiError } from '../lib/api';
import { formatKoboCompact, humanize } from '../lib/format';
import type { RiderAssignmentDetail } from '../types/api';

interface PickupQueueViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const QUEUE_STATUSES = ['assigned', 'accepted', 'arrived_at_vendor'];
const REFRESH_ON = ['md:notifications-updated'];

async function loadPickupQueue(): Promise<RiderAssignmentDetail[]> {
  const { data } = await listAssignments({ limit: 50 });
  const queue = data.filter((a) => QUEUE_STATUSES.includes(a.status));
  return Promise.all(queue.map((a) => getAssignment(a.id)));
}

function supportUnavailable(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 404 || e.status === 405 || e.code === 'NOT_FOUND');
}

export function PickupQueueView({ navigate, showNotification }: PickupQueueViewProps) {
  const { data, loading, error, reload } = useApi(loadPickupQueue, [], { pollMs: 60000, refreshOn: REFRESH_ON });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [chatBatch, setChatBatch] = useState<{ batchId: string; vendor: string } | null>(null);

  if (loading) return <LoadingState label="Loading pickup queue..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const queue = data ?? [];

  const doAction = async (a: RiderAssignmentDetail, action: 'accept' | 'arrived' | 'pickup') => {
    setBusyId(`${a.id}:${action}`);
    try {
      if (action === 'accept') {
        await acceptAssignment(a.id);
        showNotification('Assignment accepted', `You accepted ${a.vendorDisplayName}.`, 'success');
      }
      if (action === 'arrived') {
        await markAssignmentArrivedAtVendor(a.id);
        showNotification('Arrival recorded', `Vendor arrival saved for ${a.vendorDisplayName}.`, 'success');
      }
      if (action === 'pickup') {
        await markAssignmentPickedUp(a.id);
        showNotification('Pickup confirmed', `Picked up ${a.orderCount} orders from ${a.vendorDisplayName}.`, 'success');
        setTimeout(() => navigate('assigned_orders'), 700);
      }
      reload();
    } catch (e) {
      const msg = supportUnavailable(e)
        ? 'Backend endpoint not available yet. No status changed.'
        : e instanceof ApiError
          ? e.message
          : 'Action failed. Try again.';
      showNotification('Action failed', msg, 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Pickup Queue</h2>
        <p className="text-slate-500 font-medium">Accept assigned batches, check vendor readiness, and confirm handoff.</p>
      </div>

      <div className="grid gap-5">
        <AnimatePresence>
          {queue.map((batch, i) => {
            const accepted = batch.status === 'accepted' || batch.status === 'arrived_at_vendor';
            const arrived = batch.status === 'arrived_at_vendor';
            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: i * 0.04 }}
                key={batch.id}
                className="glass-card rounded-3xl p-4 sm:p-6 relative overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accepted ? 'bg-[#10B981]' : 'bg-warning'}`} />
                <div className="pl-3 flex flex-col lg:flex-row gap-5 justify-between">
                  <div className="space-y-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">Batch {batch.batchId}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${accepted ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-warning/15 text-warning'}`}>{humanize(batch.status)}</span>
                      <span className="text-xs font-semibold px-2 py-1 bg-white/70 rounded-md text-slate-500">{batch.zoneName}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Store className="w-5 h-5 text-primary-500" />
                      {batch.vendorDisplayName}
                    </h3>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Info icon={<MapPin className="w-4 h-4" />} label="Vendor location" value={batch.vendorDisplayName} />
                      <Info icon={<Clock className="w-4 h-4" />} label="Pickup time" value={batch.deliveryTime || batch.deliverySlotName} />
                      <Info icon={<PackageSearch className="w-4 h-4" />} label="Orders/items" value={`${batch.orderCount} orders`} />
                      <Info icon={<CheckCircle2 className="w-4 h-4" />} label="Handoff" value={arrived ? 'Arrived, confirm pickup' : accepted ? 'Accepted, vendor handoff pending' : 'Awaiting rider acceptance'} />
                    </div>

                    <div className="rounded-2xl bg-white/55 border border-white/70 p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-3">Batch order list</p>
                      <div className="space-y-2">
                        {batch.orders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between gap-3 text-sm border-b border-slate-100 last:border-b-0 pb-2 last:pb-0">
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{order.orderNumber}</p>
                              <p className="text-xs text-slate-500 truncate">
                                {order.items.length} items · {order.roomNumber ? `${order.locationName} · Room ${order.roomNumber}` : order.locationName}
                              </p>
                            </div>
                            <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-md ${order.orderStatus === 'ready' ? 'bg-success/10 text-success' : 'bg-warning/15 text-warning'}`}>
                              {order.orderStatus === 'ready' ? 'Ready' : 'Not ready'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 text-sm text-slate-600">
                      Pickup notes: verify package count with vendor before confirming pickup. Arrival tracking requires backend arrival endpoint.
                    </div>
                  </div>

                  <div className="lg:w-60 flex flex-col gap-2 bg-white/45 p-4 rounded-2xl border border-white/70 h-fit">
                    <div className="text-center mb-2">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                        <PackageSearch className="w-6 h-6 text-[#10B981]" />
                      </div>
                      <p className="text-xs text-slate-500 font-semibold uppercase">Earnings</p>
                      <p className="text-2xl font-display font-bold text-slate-900">{formatKoboCompact(batch.deliveryEarningsKobo)}</p>
                    </div>
                    {batch.status === 'assigned' && (
                      <button onClick={() => doAction(batch, 'accept')} disabled={busyId === `${batch.id}:accept`} className="min-h-11 rounded-xl bg-slate-900 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                        {busyId === `${batch.id}:accept` ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Accept batch <ArrowRight className="w-4 h-4" /></>}
                      </button>
                    )}
                    {accepted && (
                      <>
                        <button onClick={() => doAction(batch, 'arrived')} disabled={busyId === `${batch.id}:arrived`} className="min-h-11 rounded-xl bg-white text-slate-700 border border-slate-100 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                          {busyId === `${batch.id}:arrived` ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark arrived'}
                        </button>
                        <button onClick={() => doAction(batch, 'pickup')} disabled={busyId === `${batch.id}:pickup`} className="min-h-11 rounded-xl bg-[#10B981] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70">
                          {busyId === `${batch.id}:pickup` ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm pickup'}
                        </button>
                      </>
                    )}
                    <button onClick={() => setChatBatch({ batchId: batch.batchId, vendor: batch.vendorDisplayName })} className="min-h-11 rounded-xl bg-[#10B981]/10 text-[#059669] border border-[#10B981]/20 text-sm font-semibold flex items-center justify-center gap-2">
                      <MessageCircle className="w-4 h-4" /> Chat
                    </button>
                    <button onClick={() => navigate('support')} className="min-h-11 rounded-xl bg-danger/10 text-danger border border-danger/15 text-sm font-semibold flex items-center justify-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Contact support
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {queue.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 glass-panel rounded-3xl px-5">
            <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
            </div>
            <h3 className="font-display font-bold text-xl text-slate-900">No pickups waiting</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">Stay online for new campus assignments.</p>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {chatBatch && (
          <ChatPanel
            batchId={chatBatch.batchId}
            title={`Batch chat · ${chatBatch.vendor}`}
            onClose={() => setChatBatch(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm min-w-0">
      <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase font-semibold text-slate-400">{label}</p>
        <p className="font-medium text-slate-700 break-words">{value || 'Not provided'}</p>
      </div>
    </div>
  );
}
