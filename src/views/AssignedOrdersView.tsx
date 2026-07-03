import { useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Navigation2,
  PackageOpen,
  Phone,
  ShieldAlert,
  Store,
  Truck,
  User,
  X,
} from 'lucide-react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { useApi } from '../lib/useApi';
import {
  acceptAssignment,
  declineAssignment,
  getAssignment,
  listAssignments,
  markAssignmentArrivedAtVendor,
  markAssignmentPickedUp,
  markOrderArrivedAtCustomer,
  markOrderDelivered,
  markOrderOutForDelivery,
  reportOrderIssue,
} from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';
import { ApiError } from '../lib/api';
import { formatKobo, formatTime, humanize } from '../lib/format';
import { useAuth } from '../lib/auth';
import type { AssignmentStatus, IssueCategory, OrderStatus, RiderAssignmentDetail, RiderOrderDetail } from '../types/api';

interface AssignedOrdersViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const REFRESH_ON = ['md:notifications-updated'];
const ASSIGNMENT_ACTIVE: AssignmentStatus[] = ['assigned', 'accepted', 'arrived_at_vendor', 'picked_up'];
const ORDER_VISIBLE: OrderStatus[] = ['out_for_delivery', 'arrived_at_customer', 'delivered', 'confirmed', 'disputed'];
const DONE_STATES: OrderStatus[] = ['delivered', 'confirmed', 'administratively_completed'];

const ISSUE_CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: 'vendor_delay', label: 'Vendor delay' },
  { value: 'customer_unavailable', label: 'Customer unavailable' },
  { value: 'wrong_address_location', label: 'Wrong address/location' },
  { value: 'wrong_item_package', label: 'Wrong item/package' },
  { value: 'customer_dispute', label: 'Customer dispute' },
  { value: 'unsafe_delivery_situation', label: 'Unsafe delivery situation' },
  { value: 'app_issue', label: 'App issue' },
  { value: 'payment_order_mismatch', label: 'Payment/order mismatch' },
  { value: 'other', label: 'Other' },
];

async function loadDeliveryWork(): Promise<RiderAssignmentDetail[]> {
  const { data } = await listAssignments({ limit: 50 });
  const visible = data.filter((a) => ASSIGNMENT_ACTIVE.includes(a.status) || a.status === 'completed');
  const details = await Promise.all(visible.map((a) => getAssignment(a.id)));
  return details.filter((a) => {
    if (ASSIGNMENT_ACTIVE.includes(a.status)) return true;
    return a.orders.some((o) => ORDER_VISIBLE.includes(o.orderStatus));
  });
}

function supportUnavailable(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 404 || e.status === 405 || e.code === 'NOT_FOUND');
}

function routeUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

function badgeClass(status: string): string {
  if (status === 'delivered' || status === 'confirmed' || status === 'completed') return 'bg-success/10 text-success';
  if (status === 'disputed' || status === 'cancelled') return 'bg-danger/10 text-danger';
  if (status.includes('arrived') || status === 'picked_up' || status === 'out_for_delivery') return 'bg-warning/15 text-warning';
  return 'bg-primary-100 text-primary-700';
}

function nextAction(assignment: RiderAssignmentDetail, order: RiderOrderDetail): string {
  if (assignment.status === 'assigned') return 'Accept or decline delivery';
  if (assignment.status === 'accepted') return 'Arrive at vendor, then confirm pickup';
  if (assignment.status === 'arrived_at_vendor') return 'Confirm vendor handoff';
  if (assignment.status !== 'picked_up') return 'Wait for dispatch update';
  if (order.orderStatus === 'out_for_delivery') return 'Arrive at customer or mark delivered';
  if (order.orderStatus === 'arrived_at_customer') return 'Mark delivered';
  if (DONE_STATES.includes(order.orderStatus)) return order.orderStatus === 'confirmed' ? 'Customer confirmed' : 'Awaiting customer/admin confirmation';
  if (order.orderStatus === 'disputed') return 'Dispute under review';
  return 'Start delivery';
}

export function AssignedOrdersView({ navigate, showNotification }: AssignedOrdersViewProps) {
  const { data, loading, error, reload } = useApi(loadDeliveryWork, [], { refreshOn: REFRESH_ON, pollMs: 60000 });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [issueOrder, setIssueOrder] = useState<RiderOrderDetail | null>(null);
  const [proofOrder, setProofOrder] = useState<RiderOrderDetail | null>(null);

  if (loading) return <LoadingState label="Loading delivery work..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const assignments = data ?? [];

  const runAssignmentAction = async (assignment: RiderAssignmentDetail, action: 'accept' | 'decline' | 'arrived_vendor' | 'picked_up') => {
    setBusyId(`${assignment.id}:${action}`);
    try {
      if (action === 'accept') {
        await acceptAssignment(assignment.id);
        showNotification('Delivery accepted', `Batch ${assignment.batchId} accepted.`, 'success');
      }
      if (action === 'decline') {
        await declineAssignment(assignment.id, 'Rider declined in app');
        showNotification('Delivery declined', `Batch ${assignment.batchId} declined.`, 'success');
      }
      if (action === 'arrived_vendor') {
        await markAssignmentArrivedAtVendor(assignment.id);
        showNotification('Arrival recorded', `Vendor arrival saved for ${assignment.vendorDisplayName}.`, 'success');
      }
      if (action === 'picked_up') {
        await markAssignmentPickedUp(assignment.id);
        showNotification('Pickup confirmed', `${assignment.orderCount} orders picked up.`, 'success');
      }
      reload();
    } catch (e) {
      const message = supportUnavailable(e)
        ? 'Backend endpoint not available yet. No status changed.'
        : e instanceof ApiError
          ? e.message
          : 'Action failed. Try again.';
      showNotification('Action failed', message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const runOrderAction = async (order: RiderOrderDetail, action: 'start' | 'arrived_customer' | 'delivered') => {
    if (action === 'delivered') {
      setProofOrder(order);
      return;
    }
    setBusyId(`${order.id}:${action}`);
    try {
      if (action === 'start') {
        await markOrderOutForDelivery(order.id);
        showNotification('Delivery started', `Order ${order.orderNumber} is out for delivery.`, 'success');
      }
      if (action === 'arrived_customer') {
        await markOrderArrivedAtCustomer(order.id);
        showNotification('Arrival recorded', `Customer arrival saved for ${order.orderNumber}.`, 'success');
      }
      reload();
    } catch (e) {
      const message = supportUnavailable(e)
        ? 'Backend endpoint not available yet. No status changed.'
        : e instanceof ApiError
          ? e.message
          : 'Action failed. Try again.';
      showNotification('Action failed', message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelivered = async (order: RiderOrderDetail) => {
    setBusyId(`${order.id}:delivered`);
    try {
      await markOrderDelivered(order.id);
      showNotification('Delivered', `Order ${order.orderNumber} marked delivered.`, 'success');
      setProofOrder(null);
      reload();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not mark delivered.';
      showNotification('Delivery failed', msg, 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Assigned Deliveries</h2>
        <p className="text-slate-500 font-medium">Accept work, pick up from vendors, deliver, and report issues.</p>
      </div>

      {assignments.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 glass-panel rounded-3xl px-5">
          <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4 text-success">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-display text-xl font-bold text-slate-900">No assigned jobs</h3>
          <p className="text-slate-500 mt-2">Stay online. New campus deliveries will appear here.</p>
          <button onClick={() => navigate('pickup_queue')} className="mt-4 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800">
            Open pickup queue
          </button>
        </motion.div>
      )}

      <div className="space-y-6">
        {assignments.map((assignment) => (
          <motion.section key={assignment.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-200/60 pb-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">Batch {assignment.batchId}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${badgeClass(assignment.status)}`}>{humanize(assignment.status)}</span>
                  <span className="text-xs font-semibold px-2 py-1 bg-white/70 rounded-md text-slate-500">{assignment.zoneName}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary-500" />
                  {assignment.vendorDisplayName}
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <Info icon={<MapPin className="w-4 h-4" />} label="Pickup" value={assignment.vendorDisplayName} />
                  <Info icon={<Clock className="w-4 h-4" />} label="Scheduled" value={assignment.deliveryTime || formatTime(assignment.assignedAt)} />
                  <Info icon={<PackageOpen className="w-4 h-4" />} label="Orders/items" value={`${assignment.orderCount} orders`} />
                  <Info icon={<Navigation2 className="w-4 h-4" />} label="Distance/time" value="API not provided" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 lg:max-w-sm">
                {assignment.status === 'assigned' && (
                  <>
                    <ActionButton busy={busyId === `${assignment.id}:accept`} onClick={() => runAssignmentAction(assignment, 'accept')}>
                      Accept
                    </ActionButton>
                    <ActionButton tone="light" busy={busyId === `${assignment.id}:decline`} onClick={() => runAssignmentAction(assignment, 'decline')}>
                      Decline
                    </ActionButton>
                  </>
                )}
                {(assignment.status === 'accepted' || assignment.status === 'arrived_at_vendor') && (
                  <>
                    <ActionButton tone="light" busy={busyId === `${assignment.id}:arrived_vendor`} onClick={() => runAssignmentAction(assignment, 'arrived_vendor')}>
                      Mark arrived
                    </ActionButton>
                    <ActionButton busy={busyId === `${assignment.id}:picked_up`} onClick={() => runAssignmentAction(assignment, 'picked_up')}>
                      Confirm pickup
                    </ActionButton>
                  </>
                )}
                <a href={`tel:${(assignment.vendorPhone || '').replace(/[^0-9+]/g, '')}`} className="min-h-11 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-white/70 text-slate-700 border border-white/80">
                  <Phone className="w-4 h-4" /> Vendor
                </a>
                <button onClick={() => navigate('support')} className="min-h-11 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-white/70 text-slate-700 border border-white/80">
                  <ShieldAlert className="w-4 h-4" /> Support
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {assignment.orders.map((order) => {
                const delivered = DONE_STATES.includes(order.orderStatus);
                const canStart = assignment.status === 'picked_up' && !['out_for_delivery', 'arrived_at_customer', ...DONE_STATES, 'disputed'].includes(order.orderStatus);
                const canArrive = order.orderStatus === 'out_for_delivery';
                const canDeliver = assignment.status === 'picked_up' && (order.orderStatus === 'out_for_delivery' || order.orderStatus === 'arrived_at_customer');
                return (
                  <div key={order.id} className={`rounded-2xl border border-white/70 bg-white/55 p-4 ${delivered ? 'opacity-75' : ''}`}>
                    <div className="flex flex-col lg:flex-row gap-4 justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">Order {order.orderNumber || order.id}</span>
                          <span className={`text-xs font-bold px-2 py-1 rounded-md ${badgeClass(order.orderStatus)}`}>{humanize(order.orderStatus)}</span>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <Info icon={<User className="w-4 h-4" />} label="Customer" value={order.customerDisplayName || `Customer ${order.customerId.slice(0, 6)}`} />
                          <Info icon={<MapPin className="w-4 h-4" />} label="Delivery location" value={order.locationName} />
                          <Info icon={<Store className="w-4 h-4" />} label="Vendor" value={order.vendorDisplayName || assignment.vendorDisplayName} />
                          <Info icon={<Truck className="w-4 h-4" />} label="Next action" value={nextAction(assignment, order)} strong />
                        </div>
                        {(order.deliveryInstructions || order.specialInstructions) && (
                          <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 text-sm text-slate-600">
                            {order.deliveryInstructions || order.specialInstructions}
                          </div>
                        )}
                        <div className="rounded-xl bg-white/60 border border-white/70 p-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Items</p>
                          <div className="space-y-1">
                            {order.items.map((it) => (
                              <p key={it.id} className="text-sm font-medium text-slate-800">
                                {it.quantity}x {it.itemName}
                              </p>
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-2">Order total {formatKobo(order.totalKobo)}</p>
                        </div>
                      </div>

                      <div className="lg:w-56 flex flex-col gap-2">
                        <a href={routeUrl(order.locationName)} target="_blank" rel="noreferrer" className="min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white text-sm font-semibold">
                          <Navigation2 className="w-4 h-4" /> Route
                        </a>
                        {order.customerPhone && (
                          <a href={`tel:${order.customerPhone.replace(/[^0-9+]/g, '')}`} className="min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-700 border border-slate-100 text-sm font-semibold">
                            <Phone className="w-4 h-4" /> Contact customer
                          </a>
                        )}
                        {canStart && (
                          <ActionButton busy={busyId === `${order.id}:start`} onClick={() => runOrderAction(order, 'start')}>
                            Start delivery
                          </ActionButton>
                        )}
                        {canArrive && (
                          <ActionButton tone="light" busy={busyId === `${order.id}:arrived_customer`} onClick={() => runOrderAction(order, 'arrived_customer')}>
                            Mark arrived
                          </ActionButton>
                        )}
                        {canDeliver && (
                          <ActionButton busy={busyId === `${order.id}:delivered`} onClick={() => runOrderAction(order, 'delivered')}>
                            Mark delivered
                          </ActionButton>
                        )}
                        {!delivered && (
                          <button onClick={() => setIssueOrder(order)} className="min-h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-danger/10 text-danger border border-danger/15 text-sm font-semibold">
                            <AlertTriangle className="w-4 h-4" /> Report issue
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        ))}
      </div>

      <AnimatePresence>
        {proofOrder && (
          <ProofModal
            order={proofOrder}
            busy={busyId === `${proofOrder.id}:delivered`}
            onClose={() => setProofOrder(null)}
            onConfirm={() => confirmDelivered(proofOrder)}
          />
        )}
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

function Info({ icon, label, value, strong }: { icon: ReactNode; label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start gap-2 text-sm min-w-0">
      <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase font-semibold text-slate-400">{label}</p>
        <p className={`${strong ? 'font-bold text-slate-900' : 'font-medium text-slate-700'} break-words`}>{value || 'Not provided'}</p>
      </div>
    </div>
  );
}

function ActionButton({
  children,
  busy,
  onClick,
  tone = 'dark',
}: {
  children: ReactNode;
  busy?: boolean;
  onClick: () => void;
  tone?: 'dark' | 'light';
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`min-h-11 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-70 ${
        tone === 'dark' ? 'bg-[#10B981] text-white hover:bg-[#059669]' : 'bg-white text-slate-700 border border-slate-100 hover:bg-slate-50'
      }`}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

function ProofModal({
  order,
  busy,
  onClose,
  onConfirm,
}: {
  order: RiderOrderDetail;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }} onClick={(e) => e.stopPropagation()} className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-xl text-slate-900">Proof of delivery</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Order {order.orderNumber} at {order.locationName}</p>
        <div className="space-y-3 text-sm">
          <div className="rounded-xl bg-success/10 border border-success/20 p-3">
            <p className="font-semibold text-slate-900">Supported now</p>
            <p className="text-slate-600">Backend records delivery timestamp when you mark delivered.</p>
          </div>
          <div className="rounded-xl bg-white/60 border border-white/70 p-3">
            <p className="font-semibold text-slate-900">Needs backend endpoint</p>
            <p className="text-slate-500">Confirmation code, rider note, photo proof, GPS capture, and customer-unavailable reason require `POST /rider/orders/:id/delivery-proof`.</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 min-h-11 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className="flex-1 min-h-11 rounded-xl text-sm font-bold text-white bg-[#10B981] hover:bg-[#059669] disabled:opacity-70 flex items-center justify-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark delivered'}
          </button>
        </div>
      </motion.div>
    </motion.div>
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
  const { profile } = useAuth();
  const [category, setCategory] = useState<IssueCategory>('customer_unavailable');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (description.trim().length < 3) {
      showNotification('Add detail', 'Describe issue before submitting.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await reportOrderIssue(order.id, {
        category,
        description: description.trim(),
        currentDeliveryStatus: order.orderStatus,
        riderId: profile?.id,
        timestamp: new Date().toISOString(),
      });
      showNotification('Issue reported', `Dispatch has been notified about ${order.orderNumber}.`, 'success');
      onSubmitted();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not report issue.';
      showNotification('Report failed', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 10 }} onClick={(e) => e.stopPropagation()} className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-xl text-slate-900">Report issue</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="rounded-xl bg-white/60 border border-white/70 p-3 mb-4 text-sm">
          <p className="font-semibold text-slate-900">Order {order.orderNumber}</p>
          <p className="text-slate-500">Rider {profile?.id || 'session loading'} · status {humanize(order.orderStatus)}</p>
        </div>

        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value as IssueCategory)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm font-medium mb-4 outline-none focus:ring-2 focus:ring-primary-500/50">
          {ISSUE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="What happened?" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm mb-3 outline-none focus:ring-2 focus:ring-primary-500/50 resize-none" />
        <p className="text-xs text-slate-400 mb-5">Image/proof upload needs backend storage support before it can be enabled.</p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 min-h-11 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200">Cancel</button>
          <button onClick={submit} disabled={submitting} className="flex-1 min-h-11 rounded-xl text-sm font-bold text-white bg-danger hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit report'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
