import { motion } from 'motion/react';
import { DollarSign, Wallet, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';

interface EarningsViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const data = [
  { name: 'Mon', total: 120 },
  { name: 'Tue', total: 180 },
  { name: 'Wed', total: 150 },
  { name: 'Thu', total: 220 },
  { name: 'Fri', total: 280 },
  { name: 'Sat', total: 240 },
  { name: 'Sun', total: 200 },
];

export function EarningsView({ showNotification }: EarningsViewProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Earnings</h2>
        <p className="text-slate-500 font-medium">Track your financial performance and payouts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-3xl"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white shadow-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="flex items-center text-sm font-semibold text-success bg-success/10 px-2 py-1 rounded-md">
              <ArrowUpRight className="w-4 h-4 mr-1" /> 18%
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-500 mb-1">Available Balance</p>
          <h3 className="text-4xl font-display font-bold text-slate-900">$482.50</h3>
          <button 
            onClick={() => showNotification('Payout Requested', 'Your funds are being transferred to your connected bank account.', 'success')}
            className="w-full mt-6 bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-medium transition-colors"
          >
            Cash Out Now
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-3xl"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white shadow-lg">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500 mb-1">Today's Earnings</p>
          <h3 className="text-4xl font-display font-bold text-slate-900">$84.20</h3>
          <p className="text-sm text-slate-500 mt-2">12 Deliveries completed</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-3xl"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="flex items-center text-sm font-semibold text-warning-600 bg-warning/10 px-2 py-1 rounded-md">
              <ArrowDownRight className="w-4 h-4 mr-1" /> 4%
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-500 mb-1">Weekly Earnings</p>
          <h3 className="text-4xl font-display font-bold text-slate-900">$1,390.00</h3>
          <p className="text-sm text-slate-500 mt-2">Projection: $1,450.00</p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 rounded-3xl h-[400px] flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl text-slate-900">Revenue Analysis</h3>
          <select 
            onChange={() => showNotification('Data Filtered', 'Chart data updated.', 'info')}
            className="bg-white/50 border border-white/60 text-sm font-medium text-slate-700 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary-500/50"
          >
            <option>This Week</option>
            <option>Last Week</option>
            <option>This Month</option>
          </select>
        </div>
        
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.4)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)' }}
                itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                formatter={(value: number) => [`$${value}`, 'Earnings']}
              />
              <Area type="monotone" dataKey="total" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
