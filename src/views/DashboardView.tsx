import { motion } from 'motion/react';
import { Package, CheckCircle2, Navigation2, Clock, Star, MapPin } from 'lucide-react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';

interface DashboardViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const stats = [
  { label: "Today's Orders", value: '42', icon: <Package className="w-5 h-5" />, trend: '+12%', color: 'from-blue-500 to-blue-400' },
  { label: 'Completed', value: '28', icon: <CheckCircle2 className="w-5 h-5" />, trend: '+5%', color: 'from-success to-emerald-400' },
  { label: 'In Transit', value: '14', icon: <Navigation2 className="w-5 h-5" />, trend: 'Active', color: 'from-warning to-yellow-400' },
  { label: 'Avg Time', value: '18m', icon: <Clock className="w-5 h-5" />, trend: '-2m', color: 'from-purple-500 to-purple-400' },
];

const activeDeliveries = [
  { id: 'MD-9284', type: 'Lunch Batch A', vendor: 'Mama Kitchen', items: 15, zone: 'North Campus', status: 'In Transit', time: '12:15 PM' },
  { id: 'MD-9285', type: 'Lunch Batch B', vendor: 'Campus Grill', items: 8, zone: 'South Campus', status: 'Pickup Ready', time: '12:30 PM' },
];

export function DashboardView({ navigate, showNotification }: DashboardViewProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <h2 className="text-3xl font-display font-bold text-slate-900">Good Morning, David 👋</h2>
          <p className="text-slate-500 font-medium">You have <span className="text-primary-600 font-bold">14 active orders</span> in your current batch.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card px-4 py-2 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-white/90"
          onClick={() => navigate('delivery_zones')}
        >
          <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_#10B981]" />
          <span className="text-sm font-semibold text-slate-700">Zone Alpha - Active</span>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 rounded-3xl relative overflow-hidden group cursor-pointer"
            onClick={() => showNotification(stat.label, 'Detailed analytics are being generated.', 'info')}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500">
              {stat.icon}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                {stat.icon}
              </div>
              <span className="text-sm font-medium text-slate-500">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-slate-900">{stat.value}</span>
              <span className={`text-xs font-semibold ${stat.trend.startsWith('-') || stat.trend === 'Active' ? 'text-primary-600' : 'text-success'}`}>
                {stat.trend}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Placeholder */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 glass-card rounded-3xl p-2 relative min-h-[400px] overflow-hidden flex flex-col"
        >
          <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-sm z-0" />
          {/* Simulated map background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#16A34A 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
             <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center shadow-xl mb-2">
                <MapPin className="w-8 h-8 text-primary-600" />
             </div>
             <div>
                <h3 className="text-xl font-display font-bold text-slate-800">Live Campus Map</h3>
                <p className="text-slate-500 mt-1 max-w-sm">Google Maps Integration Placeholder. Shows vendors, active routes, and drop-off zones.</p>
             </div>
             <button 
               onClick={() => navigate('route_planner')}
               className="mt-4 bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
             >
               Open Map View
             </button>
          </div>
        </motion.div>

        {/* Real-time Queue */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-3xl p-6 flex flex-col h-full"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-lg text-slate-900">Current Batch</h3>
            <button 
              onClick={() => navigate('pickup_queue')}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View All
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {activeDeliveries.map((delivery, i) => (
              <motion.div 
                key={delivery.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                onClick={() => navigate('pickup_queue')}
                className="bg-white/40 border border-white/60 p-4 rounded-2xl hover:bg-white/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-1 bg-white/80 rounded-md text-slate-700">{delivery.id}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${delivery.status === 'In Transit' ? 'bg-warning/20 text-warning-700' : 'bg-primary-100 text-primary-700'}`}>
                    {delivery.status}
                  </span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1">{delivery.type}</h4>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {delivery.items} orders</span>
                  <span>{delivery.time}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <button 
            onClick={() => navigate('pickup_queue')}
            className="w-full mt-4 bg-[#10B981] hover:bg-[#059669] text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-[#10B981]/20"
          >
            Confirm Pickups
          </button>
        </motion.div>
      </div>

    </div>
  );
}
