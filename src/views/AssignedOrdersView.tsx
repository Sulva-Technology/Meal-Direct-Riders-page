import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { MapPin, User, CheckCircle2, Phone, PackageOpen, Navigation2, AlertTriangle, Loader2, Store, X } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { listAssignments, getAssignment, markOrderOutForDelivery, markOrderDelivered, reportOrderIssue } from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';
import { ApiError } from '../lib/api';
import { humanize, formatKobo } from '../lib/format';
import type { RiderAssignmentDetail, RiderOrderDetail, IssueCategory } from '../types/api';

interface AssignedOrdersViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const DELIVERED_STATES = ['delivered', 'administratively_completed'];
const ISSUE_CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: 'customer_unavailable', label: 'Customer unavailable' },
  { value: 'wrong_location', label: 'Wrong location' },
  { value: 'access_restriction', label: 'Access restriction' },
  { value: 'damaged_package', label: 'Damaged package' },
  { value: 'other', label: 'Other' },
];

const REFRESH_ON = ['md:notifications-updated'];

async function loadActiveDeliveries(): Promise<RiderAssignmentDetail[]> {
  const { data } = await listAssignments();
  const active = data.filter((a) => a.status === 'picked_up');
  return Promise.all(active.map((a) => getAssignment(a.id)));
}

export function AssignedOrdersView({ navigate, showNotification }: AssignedOrdersViewProps) {
  const { data, loading, error, reload } = useApi(loadActiveDeliveries, [], { refreshOn: REFRESH_ON });
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [issueOrder, setIssueOrder] = useState<RiderOrderDetail | null>(null);

  if (loading) return <LoadingState label="Loading active deliveries…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const assignments = data ?? [];
  const hasOrders = assignments.some((a) => a.orders.length > 0);

  const runOrderAction = async (order: RiderOrderDetail, action: 'out' | 'delivered') => {
    setBusyOrder(order.id);
    try {
      if (action === 'out') {
        await markOrderOutForDelivery(order.id);
        showNotification('Out for Delivery', `Order ${order.orderNumber} is on the way.`, 'success');
      } else {
        await markOrderDelivered(order.id);
        showNotification('Delivered', `Order ${order.orderNumber} marked delivered.`, 'success');
      }
      reload();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Action failed. Try again.';
      showNotification('Failed', msg, 'error');
    } finally {
      setBusyOrder(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Active Deliveries</h2>
        <p className="text-slate-500 font-medium">Deliver each meal in your picked-up batches.</p>
      </div>

      {!hasOrders && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 glass-panel rounded-3xl">
          <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4 text-success">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900">Nothing to deliver</h3>
          <p className="text-slate-500 mt-2">Confirm a pickup in the queue to start delivering.</p>
          <button onClick={() => navigate('pickup_queue')} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800">
            Go to Pickup Queue
          </button>
        </motion.div>
      )}

      <div className="space-y-8">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="space-y-4">
            <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <Store className="w-5 h-5 text-primary-500" /> {assignment.vendorDisplayName}
              <span className="text-sm font-medium text-slate-400">· {assignment.zoneName}</span>
            </h3>
            <AnimatePresence>
              {assignment.orders.map((order) => {
                const delivered = DELIVERED_STATES.includes(order.orderStatus);
                const outForDelivery = order.orderStatus === 'out_for_delivery';
                const isBusy = busyOrder === order.id;
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={order.id}
                    className={`glass-card rounded-3xl p-6 relative overflow-hidden ${delivered ? 'opacity-70' : ''}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">{order.orderNumber}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${delivered ? 'bg-success/10 text-success' : outForDelivery ? 'bg-warning/20 text-warning-700' : 'bg-primary-100 text-primary-700'}`}>
                            {humanize(order.orderStatus)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <User className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{order.customerDisplayName || 'Customer'}</p>
                                {order.customerPhone && (
                                  <a href={`tel:${order.customerPhone.replace(/[^0-9+]/g, '')}`} className="text-[#10B981] text-xs font-medium flex items-center gap-1 mt-1 hover:text-[#059669]">
                                    <Phone className="w-3 h-3" /> {order.customerPhone}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-slate-700">{order.locationName}</p>
                                {order.deliveryInstructions && <p className="text-xs text-slate-400 mt-0.5">{order.deliveryInstructions}</p>}
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/40 rounded-xl p-3 border border-white/60 flex items-start gap-3">
                            <PackageOpen className="w-5 h-5 text-[#10B981] mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Meal Contents</p>
                              {order.items.map((it) => (
                                <p key={it.id} className="text-sm font-medium text-slate-800">
                                  {it.quantity}× {it.itemName}
                                </p>
                              ))}
                              <p className="text-xs text-slate-400 mt-1">Total {formatKobo(order.totalKobo)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-52 shrink-0 flex flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-200/50 pt-4 md:pt-0 md:pl-6">
                        {!delivered && !outForDelivery && (
                          <button
                            onClick={() => runOrderAction(order, 'out')}
                            disabled={isBusy}
                            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white rounded-xl py-3 font-medium transition-all flex items-center justify-center gap-2"
                          >
                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Navigation2 className="w-4 h-4" /> Start Delivery</>}
                          </button>
                        )}
                        {outForDelivery && (
                          <button
                            onClick={() => runOrderAction(order, 'delivered')}
                            disabled={isBusy}
                            className="w-full bg-[#10B981] hover:bg-[#059669] disabled:opacity-70 text-white rounded-xl py-3 font-medium transition-all flex items-center justify-center gap-2"
                          >
                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Mark Delivered</>}
                          </button>
                        )}
                        {delivered && (
                          <div className="flex items-center justify-center gap-2 text-success font-medium text-sm py-3">
                            <CheckCircle2 className="w-4 h-4" /> Delivered
                          </div>
                        )}
                        {!delivered && (
                          <button
                            onClick={() => setIssueOrder(order)}
                            className="w-full bg-white/60 hover:bg-white text-danger border border-danger/20 rounded-xl py-2 text-sm font-medium transition-all flex items-center justify-center gap-2"
                          >
                            <AlertTriangle className="w-4 h-4" /> Report Issue
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {issueOrder && (
          <IssueModal
            order={issueOrder}
            onClose={() => setIssueOrder(null)}
            onSubmitted={() => {
              setIssueOrder(null);
              reload();
            }}
            showNotification={showNotification}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function IssueModal({
  order,
  onClose,
  onSubmitted,
  showNotification,
}: {
  order: RiderOrderDetail;
  onClose: () => void;
  onSubmitted: () => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}) {
  const [category, setCategory] = useState<IssueCategory>('customer_unavailable');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (description.trim().length < 3) {
      showNotification('Add Detail', 'Please describe the issue.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await reportOrderIssue(order.id, { category, description: description.trim() });
      showNotification('Issue Reported', `Dispatch has been notified about ${order.orderNumber}.`, 'success');
      onSubmitted();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not report the issue.';
      showNotification('Failed', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-xl text-slate-900">Report Issue</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Order {order.orderNumber} · {order.locationName}</p>

        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as IssueCategory)}
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium mb-4 outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          {ISSUE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What happened?"
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm mb-5 outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
          <button onClick={submit} disabled={submitting} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-danger hover:opacity-90 disabled:opacity-70 transition-colors flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
