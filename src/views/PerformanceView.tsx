import { motion } from 'motion/react';
import { Target, Award, Zap, Activity, Package, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { getEarnings, listAssignments } from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';
import { formatKobo } from '../lib/format';

interface Props {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

async function loadPerformance() {
  const [earnings, assignments] = await Promise.all([getEarnings(), listAssignments()]);
  return { earnings, assignments: assignments.data };
}

export function PerformanceView({}: Props) {
  const { data, loading, error, reload } = useApi(loadPerformance, []);

  if (loading) return <LoadingState label="Crunching your stats…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { earnings, assignments } = data!;
  const totalAssignments = assignments.length;
  const completed = assignments.filter((a) => a.status === 'completed').length;
  const cancelled = assignments.filter((a) => a.status === 'cancelled').length;

  // Confirmation rate: confirmed vs delivered orders (how many deliveries customers confirmed).
  const confirmRate = earnings.deliveredOrderCount
    ? Math.round((earnings.confirmedOrderCount / earnings.deliveredOrderCount) * 100)
    : 0;
  const completionRate = totalAssignments ? Math.round((completed / totalAssignments) * 100) : 0;

  const scoreData = [{ name: 'Score', value: confirmRate, fill: '#16A34A' }];

  const metrics = [
    { label: 'Delivered Orders', value: String(earnings.deliveredOrderCount), icon: <Package className="w-5 h-5 text-primary-600" />, bg: 'bg-primary-100' },
    { label: 'Confirmed Orders', value: String(earnings.confirmedOrderCount), icon: <CheckCircle2 className="w-5 h-5 text-success" />, bg: 'bg-success/20' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: <Activity className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100' },
    { label: 'Total Earned', value: formatKobo(earnings.totalAmountKobo), icon: <Zap className="w-5 h-5 text-warning-700" />, bg: 'bg-warning/20' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Performance</h2>
        <p className="text-slate-500 font-medium">Your delivery efficiency, from live data.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-1/3 glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5"><Target className="w-32 h-32" /></div>
          <h3 className="font-display font-bold text-xl text-slate-800 mb-6 relative z-10">Confirmation Rate</h3>
          <div className="h-48 w-48 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="80%" outerRadius="100%" barSize={12} data={scoreData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: 'rgba(255,255,255,0.5)' }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-display font-bold text-slate-900">{confirmRate}</span>
              <span className="text-sm font-semibold text-slate-500">%</span>
            </div>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full font-semibold text-sm relative z-10">
            <Award className="w-4 h-4" /> {confirmRate >= 90 ? 'Excellent' : confirmRate >= 70 ? 'Good' : 'Keep going'}
          </div>
        </motion.div>

        <div className="w-full lg:w-2/3 grid grid-cols-2 gap-4">
          {metrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (i + 1) }} className="glass-card p-6 rounded-3xl">
              <div className={`w-10 h-10 ${m.bg} rounded-xl flex items-center justify-center mb-4`}>{m.icon}</div>
              <p className="text-sm font-semibold text-slate-500 mb-1">{m.label}</p>
              <h4 className="text-2xl font-display font-bold text-slate-900">{m.value}</h4>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6 rounded-3xl">
        <h3 className="font-display font-bold text-xl text-slate-900 mb-4">Assignment Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/50 rounded-2xl p-4">
            <p className="text-3xl font-display font-bold text-slate-900">{totalAssignments}</p>
            <p className="text-sm text-slate-500">Total</p>
          </div>
          <div className="bg-white/50 rounded-2xl p-4">
            <p className="text-3xl font-display font-bold text-success">{completed}</p>
            <p className="text-sm text-slate-500">Completed</p>
          </div>
          <div className="bg-white/50 rounded-2xl p-4">
            <p className="text-3xl font-display font-bold text-danger">{cancelled}</p>
            <p className="text-sm text-slate-500">Cancelled</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
