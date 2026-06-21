import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, Hourglass, CheckCircle2, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { getEarnings } from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';
import { formatKobo } from '../lib/format';

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

export function EarningsView({ navigate }: EarningsViewProps) {
  const [range, setRange] = useState<Range>('all');
  const { data, loading, error, reload } = useApi(() => getEarnings(rangeQuery(range)), [range]);

  const chartData = useMemo(() => {
    if (!data) return [];
    const byDate = new Map<string, number>();
    for (const b of data.batches) {
      byDate.set(b.serviceDate, (byDate.get(b.serviceDate) ?? 0) + b.totalAmountKobo);
    }
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, kobo]) => ({
        name: new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }),
        total: Math.round(kobo / 100),
      }));
  }, [data]);

  if (loading) return <LoadingState label="Loading earnings…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const e = data!;
  const cards = [
    { label: 'Total Earnings', value: formatKobo(e.totalAmountKobo), icon: <Wallet className="w-6 h-6" />, grad: 'from-slate-900 to-slate-800' },
    { label: 'Pending', value: formatKobo(e.pendingAmountKobo), icon: <Hourglass className="w-6 h-6" />, grad: 'from-warning to-yellow-500' },
    { label: 'Settled', value: formatKobo(e.settledAmountKobo), icon: <CheckCircle2 className="w-6 h-6" />, grad: 'from-primary-500 to-primary-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Earnings</h2>
          <p className="text-slate-500 font-medium">
            {e.deliveredOrderCount} delivered · {e.confirmedOrderCount} confirmed · {formatKobo(e.ratePerOrderKobo)}/order
          </p>
        </div>
        <select
          value={range}
          onChange={(ev) => setRange(ev.target.value as Range)}
          className="bg-white/50 border border-white/60 text-sm font-medium text-slate-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary-500/50"
        >
          <option value="all">All time</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-6 rounded-3xl">
            <div className={`p-3 bg-gradient-to-br ${c.grad} rounded-2xl text-white shadow-lg w-fit mb-4`}>{c.icon}</div>
            <p className="text-sm font-semibold text-slate-500 mb-1">{c.label}</p>
            <h3 className="text-3xl font-display font-bold text-slate-900">{c.value}</h3>
            {c.label === 'Settled' && (
              <button onClick={() => navigate('payout')} className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-medium transition-colors">
                View Settlements
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 rounded-3xl h-[400px] flex flex-col">
        <h3 className="font-display font-bold text-xl text-slate-900 mb-6">Earnings by Service Date</h3>
        <div className="flex-1 w-full relative">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No earnings in this range yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.4)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(v) => `₦${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  formatter={(value: number) => [`₦${value.toLocaleString('en-NG')}`, 'Earnings']}
                />
                <Area type="monotone" dataKey="total" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>
    </div>
  );
}
