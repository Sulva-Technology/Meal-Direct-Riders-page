import { motion } from 'motion/react';
import { Target, Award, Star, Zap, Activity } from 'lucide-react';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';

interface PerformanceViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

export function PerformanceView({ showNotification }: PerformanceViewProps) {
  const scoreData = [{ name: 'Score', value: 94, fill: '#16A34A' }];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Performance</h2>
        <p className="text-slate-500 font-medium">Track your efficiency and unlock campus badges.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Core Score */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-1/3 glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group cursor-pointer"
          onClick={() => showNotification('Performance Rating', 'You are performing exceptionally well this week!', 'success')}
        >
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
             <Target className="w-32 h-32" />
           </div>
           
           <h3 className="font-display font-bold text-xl text-slate-800 mb-6 relative z-10">Overall Score</h3>
           
           <div className="h-48 w-48 relative z-10">
             <ResponsiveContainer width="100%" height="100%">
               <RadialBarChart 
                 cx="50%" 
                 cy="50%" 
                 innerRadius="80%" 
                 outerRadius="100%" 
                 barSize={12} 
                 data={scoreData}
                 startAngle={90}
                 endAngle={-270}
               >
                 <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                 <RadialBar
                   background={{ fill: 'rgba(255,255,255,0.5)' }}
                   dataKey="value"
                   cornerRadius={10}
                 />
               </RadialBarChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-display font-bold text-slate-900">94</span>
                <span className="text-sm font-semibold text-slate-500">/ 100</span>
             </div>
           </div>

           <div className="mt-6 inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full font-semibold text-sm relative z-10">
             <Award className="w-4 h-4" /> Elite Tier
           </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="w-full lg:w-2/3 grid grid-cols-2 gap-4">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="glass-card p-6 rounded-3xl"
           >
             <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
               <Zap className="w-5 h-5 text-primary-600" />
             </div>
             <p className="text-sm font-semibold text-slate-500 mb-1">Route Efficiency</p>
             <h4 className="text-2xl font-display font-bold text-slate-900">98%</h4>
           </motion.div>
           
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="glass-card p-6 rounded-3xl"
           >
             <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center mb-4">
               <Star className="w-5 h-5 text-warning-700 fill-warning-700" />
             </div>
             <p className="text-sm font-semibold text-slate-500 mb-1">Customer Rating</p>
             <h4 className="text-2xl font-display font-bold text-slate-900">4.96 <span className="text-sm font-medium text-slate-500">/ 5.0</span></h4>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="glass-card p-6 rounded-3xl"
           >
             <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
               <Activity className="w-5 h-5 text-blue-600" />
             </div>
             <p className="text-sm font-semibold text-slate-500 mb-1">Completion Rate</p>
             <h4 className="text-2xl font-display font-bold text-slate-900">100%</h4>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="glass-card p-6 rounded-3xl"
           >
             <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
               <Award className="w-5 h-5 text-purple-600" />
             </div>
             <p className="text-sm font-semibold text-slate-500 mb-1">Weekly Rank</p>
             <h4 className="text-2xl font-display font-bold text-slate-900">Top 5%</h4>
           </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 rounded-3xl"
      >
        <h3 className="font-display font-bold text-xl text-slate-900 mb-6">Badges & Achievements</h3>
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
           <div 
             onClick={() => showNotification('Badge Unlocked', 'You earned the Campus Champion badge yesterday.', 'success')}
             className="flex-shrink-0 w-32 aspect-square bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shadow-primary-500/20 cursor-pointer hover:-translate-y-1 transition-transform"
           >
             <Award className="w-8 h-8 mb-2" />
             <span className="text-xs font-bold text-center px-2">Campus Champion</span>
           </div>
           <div className="flex-shrink-0 w-32 aspect-square bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg cursor-pointer hover:-translate-y-1 transition-transform">
             <Zap className="w-8 h-8 mb-2 text-warning-400" />
             <span className="text-xs font-bold text-center px-2">Speed Demon</span>
           </div>
           <div className="flex-shrink-0 w-32 aspect-square bg-white/40 border border-white/60 rounded-2xl flex flex-col items-center justify-center text-slate-400 cursor-not-allowed">
             <Star className="w-8 h-8 mb-2" />
             <span className="text-xs font-bold text-center px-2">Perfect Week</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
