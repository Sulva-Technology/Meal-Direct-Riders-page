import { motion } from 'motion/react';
import { Package, CheckCircle2, Navigation2, Wallet, MapPin, Store } from 'lucide-react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { listAssignments } from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';
import { formatKoboCompact, humanize, formatTime } from '../lib/format';
import { useAuth } from '../lib/auth';
import type { RiderAssignmentSummary } from '../types/api';
import { AvailabilityToggle } from '../components/AvailabilityToggle';

interface DashboardViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const ACTIVE_STATUSES = ['assigned', 'accepted', 'picked_up'];

function statusBadge(status: string) {
  if (status === 'picked_up') return 'bg-warning/20 text-warning-700';
  if (status === 'completed') return 'bg-slate-100 text-slate-500';
  if (status === 'cancelled') return 'bg-danger/10 text-danger';
  return 'bg-primary-100 text-primary-700';
}

export function DashboardView({ navigate, showNotification }: DashboardViewProps) {
  const { profile } = useAuth();
  const { data, loading, error, reload } = useApi(() => listAssignments(), []);

  if (loading) return <LoadingState label="Loading your assignments…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const assignments: RiderAssignmentSummary[] = data?.data ?? [];
  const active = assignments.filter((a) => ACTIVE_STATUSES.includes(a.status));
  const totalOrders = assignments.reduce((s, a) => s + (a.orderCount || 0), 0);
  const completed = assignments.filter((a) => a.status === 'completed').length;
  const pickedUp = assignments.filter((a) => a.status === 'picked_up').length;
  const earningsKobo = assignments.reduce((s, a) => s + (a.deliveryEarningsKobo || 0), 0);

  const stats = [
    { label: 'Assignments', value: String(assignments.length), icon: <Package className="w-5 h-5" />, color: 'from-blue-500 to-blue-400' },
    { label: 'Completed', value: String(completed), icon: <CheckCircle2 className="w-5 h-5" />, color: 'from-success to-emerald-400' },
    { label: 'In Transit', value: String(pickedUp), icon: <Navigation2 className="w-5 h-5" />, color: 'from-warning to-yellow-400' },
    { label: 'Est. Earnings', value: formatKoboCompact(earningsKobo), icon: <Wallet className="w-5 h-5" />, color: 'from-primary-500 to-primary-400' },
  ];

  const firstName = profile?.displayName?.split(' ')[0] || 'Rider';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-slate-900">Hello, {firstName} 👋</h2>
          <p className="text-slate-500 font-medium">
            You have <span className="text-primary-600 font-bold">{active.length} active</span>{' '}
            {active.length === 1 ? 'assignment' : 'assignments'} ({totalOrders} orders total).
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card px-4 py-2 rounded-2xl flex items-center gap-3"
        >
          <div className={`w-2 h-2 rounded-full ${profile?.active ? 'bg-success animate-pulse shadow-[0_0_8px_#10B981]' : 'bg-slate-400'}`} />
          <AvailabilityToggle showNotification={showNotification} labelClassName="font-semibold text-slate-700" />
        </motion.div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 rounded-3xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">{stat.icon}</div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>{stat.icon}</div>
              <span className="text-sm font-medium text-slate-500">{stat.label}</span>
            </div>
            <span className="text-3xl font-display font-bold text-slate-900">{stat.value}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card rounded-3xl p-2 relative min-h-[400px] overflow-hidden flex flex-col"
        >
          <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-sm z-0" />
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#16A34A 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
            <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center shadow-xl mb-2">
              <MapPin className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-slate-800">Route Overview</h3>
              <p className="text-slate-500 mt-1 max-w-sm">
                {active.length
                  ? `Next stop: ${active[0].vendorDisplayName} → ${active[0].zoneName} at ${active[0].deliveryTime}.`
                  : 'No active routes. Accept an assignment to get started.'}
              </p>
            </div>
            <button onClick={() => navigate('route_planner')} className="mt-4 bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors">
              Open Route Planner
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card rounded-3xl p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-lg text-slate-900">Current Batches</h3>
            <button onClick={() => navigate('pickup_queue')} className="text-sm font-medium text-primary-600 hover:text-primary-700">View All</button>
          </div>

          <div className="space-y-4 flex-1">
            {active.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No active batches right now.</p>}
            {active.slice(0, 4).map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                onClick={() => navigate(a.status === 'picked_up' ? 'assigned_orders' : 'pickup_queue')}
                className="bg-white/40 border border-white/60 p-4 rounded-2xl hover:bg-white/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-1 bg-white/80 rounded-md text-slate-700 flex items-center gap-1">
                    <Store className="w-3 h-3" /> {a.vendorDisplayName}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${statusBadge(a.status)}`}>{humanize(a.status)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {a.orderCount} orders</span>
                  <span>{a.deliveryTime || formatTime(a.assignedAt)}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <button onClick={() => navigate('pickup_queue')} className="w-full mt-4 bg-[#10B981] hover:bg-[#059669] text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-[#10B981]/20">
            Go to Pickup Queue
          </button>
        </motion.div>
      </div>
    </div>
  );
}
