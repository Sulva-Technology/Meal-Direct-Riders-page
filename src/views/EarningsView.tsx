import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, CreditCard, Hourglass, Package, Wallet } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { getEarnings, listSettlements } from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';
import { formatDate, formatKobo, humanize } from '../lib/format';
import type { RiderEarningsSummary, RiderSettlementSummary } from '../types/api';

interface EarningsViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

type Range = 'all' | '7d' | '30d';

function rangeQuery(range: Range): { dateFrom?: string; dateTo?: string } {
  if (range === 'all') return {};
  const days = range === '7d' ? 7 : 30;
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days);
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) };
}

async function loadEarnings(range: Range): Promise<{ earnings: RiderEarningsSummary; settlements: RiderSettlementSummary[] }> {
  const [earnings, settlements] = await Promise.all([
    getEarnings(rangeQuery(range)),
    listSettlements({ limit: 8 }).then((r) => r.data),
  ]);
  return { earnings, settlements };
}

export function EarningsView({ navigate }: EarningsViewProps) {
  const [range, setRange] = useState<Range>('all');
  const { data, loading, error, reload } = useApi(() => loadEarnings(range), [range]);

  const chartData = useMemo(() => {
    if (!data) return [];
    const byDate = new Map<string, number>();
    for (const b of data.earnings.batches) {
      byDate.set(b.serviceDate, (byDate.get(b.serviceDate) ?? 0) + b.totalAmountKobo);
    }
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, kobo]) => ({
        name: new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }),
        total: Math.round(kobo / 100),
      }));
  }, [data]);

  if (loading) return <LoadingState label="Loading earnings..." />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const e = data!.earnings;
  const settlements = data!.settlements;
  const pendingPayout = settlements.filter((s) => s.status === 'draft' || s.status === 'approved').reduce((sum, s) => sum + s.payableKobo, 0);
  const paidAmount = settlements.filter((s) => s.status === 'paid').reduce((sum, s) => sum + s.payableKobo, 0) || e.settledAmountKobo;
  const availableBalance = e.pendingAmountKobo;
  const totalDeliveries = e.deliveredOrderCount + e.confirmedOrderCount;

  const cards = [
    { label: 'Total earnings', value: formatKobo(e.totalAmountKobo), icon: <Wallet className="w-6 h-6" />, grad: 'from-slate-900 to-slate-800' },
    { label: 'Available balance', value: formatKobo(availableBalance), icon: <CreditCard className="w-6 h-6" />, grad: 'from-primary-500 to-primary-600' },
    { label: 'Pending payout', value: formatKobo(pendingPayout || e.pendingAmountKobo), icon: <Hourglass className="w-6 h-6" />, grad: 'from-warning to-yellow-500' },
    { label: 'Paid amount', value: formatKobo(paidAmount), icon: <CheckCircle2 className="w-6 h-6" />, grad: 'from-emerald-600 to-emerald-500' },
  ];

  const empty = e.totalAmountKobo === 0 && e.batches.length === 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Earnings</h2>
          <p className="text-slate-500 font-medium">
            {totalDeliveries} deliveries · {e.confirmedOrderCount} confirmed · {formatKobo(e.ratePerOrderKobo)}/order
          </p>
        </div>
        <select value={range} onChange={(ev) => setRange(ev.target.value as Range)} className="min-h-11 bg-white/70 border border-white/80 text-sm font-medium text-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500/50">
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      <div className="rounded-2xl bg-warning/10 border border-warning/20 p-4 text-sm text-slate-600">
        Manual payout status: payouts are processed according to Meal Direct's payout schedule. Automatic payout visibility depends on backend payout-account support.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card p-5 rounded-3xl">
            <div className={`p-3 bg-gradient-to-br ${c.grad} rounded-2xl text-white shadow-lg w-fit mb-4`}>{c.icon}</div>
            <p className="text-sm font-semibold text-slate-500 mb-1">{c.label}</p>
            <h3 className="text-2xl font-display font-bold text-slate-900">{c.value}</h3>
          </motion.div>
        ))}
      </div>

      {empty ? (
        <div className="glass-card rounded-3xl p-8 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-xl font-display font-bold text-slate-900">No earnings yet</h3>
          <p className="text-slate-500 mt-2">Completed and confirmed deliveries will appear here.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 glass-card p-5 rounded-3xl h-[360px] flex flex-col">
            <h3 className="font-display font-bold text-xl text-slate-900 mb-5">Earnings by period</h3>
            <div className="flex-1 w-full relative">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No earnings in this range.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `NGN ${v}`} />
                    <Tooltip formatter={(value: number) => [`NGN ${value.toLocaleString('en-NG')}`, 'Earnings']} />
                    <Area type="monotone" dataKey="total" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-slate-900">Recent payouts</h3>
              <button onClick={() => navigate('payout')} className="text-sm font-semibold text-primary-600">View all</button>
            </div>
            <div className="space-y-3">
              {settlements.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">No payout history yet.</p>
              ) : (
                settlements.map((s) => (
                  <div key={s.id} className="rounded-2xl bg-white/55 border border-white/70 p-3">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{formatDate(s.settlementDate)}</p>
                        <p className="text-xs text-slate-500">{humanize(s.status)} · {s.lineCount} lines</p>
                      </div>
                      <p className="font-bold text-slate-900">{formatKobo(s.payableKobo)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
