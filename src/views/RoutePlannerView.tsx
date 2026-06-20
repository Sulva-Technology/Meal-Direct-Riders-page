import { motion } from 'motion/react';
import { MapPin, Navigation, Clock, Truck, MoreVertical, Plus, Minus } from 'lucide-react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';

interface RoutePlannerViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const routeStops = [
  { id: 1, title: 'Pickup: Mama Kitchen', address: 'North Food Court', time: '11:45 AM', type: 'pickup', distance: '0.2 mi' },
  { id: 2, title: 'Dropoff: Alpha Dorm', address: 'Building A, Room 102', time: '12:05 PM', type: 'delivery', distance: '1.4 mi' },
  { id: 3, title: 'Dropoff: Beta Dorm', address: 'Building B, Lobby', time: '12:15 PM', type: 'delivery', distance: '0.8 mi' },
  { id: 4, title: 'Dropoff: Science Dept', address: 'Main Entrance North', time: '12:30 PM', type: 'delivery', distance: '2.1 mi' },
];

export function RoutePlannerView({ showNotification }: RoutePlannerViewProps) {
  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Route List */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full lg:w-96 flex flex-col gap-4 h-full"
      >
        <div className="glass-card rounded-3xl p-6 mb-2">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">Active Route</h2>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 bg-white/50 rounded-xl p-3 border border-white/60">
              <p className="text-xs text-slate-500 font-semibold mb-1">EST. TIME</p>
              <p className="font-bold text-slate-900 flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary-500" /> 45 min</p>
            </div>
            <div className="flex-1 bg-white/50 rounded-xl p-3 border border-white/60">
              <p className="text-xs text-slate-500 font-semibold mb-1">DISTANCE</p>
              <p className="font-bold text-slate-900 flex items-center gap-1.5"><Truck className="w-4 h-4 text-primary-500" /> 4.5 mi</p>
            </div>
          </div>
          
          <button 
            onClick={() => showNotification('Navigation Started', 'Calculating fastest route to Mama Kitchen...', 'success')}
            className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 transition-all"
          >
            <Navigation className="w-4 h-4 fill-current" />
            Start Navigation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
          <div className="relative pl-6">
             {/* Timeline Line */}
             <div className="absolute top-4 bottom-4 left-3 w-0.5 bg-slate-200" />
             
             {routeStops.map((stop, i) => (
                <div key={stop.id} className="relative mb-6 last:mb-0 group">
                  <div className={`absolute -left-[27px] top-4 w-4 h-4 rounded-full border-4 border-white ${stop.type === 'pickup' ? 'bg-primary-500' : 'bg-slate-800'} z-10 shadow-sm`} />
                  
                  <div 
                    onClick={() => showNotification('Stop Details', `Opening details for ${stop.title}`, 'info')}
                    className="glass-panel p-4 rounded-2xl hover:bg-white/80 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900 text-sm">{stop.title}</h4>
                      <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></button>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">{stop.address}</p>
                    
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-primary-600 bg-primary-50 px-2 py-1 rounded-md">{stop.time}</span>
                      <span className="text-slate-400">{stop.distance}</span>
                    </div>
                  </div>
                </div>
             ))}
          </div>
        </div>
      </motion.div>

      {/* Map View */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 glass-card rounded-3xl overflow-hidden relative min-h-[400px]"
      >
         <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-sm z-0" />
         <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#16A34A 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
         
         {/* Central visual for map */}
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8 bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 max-w-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
                <Navigation className="w-8 h-8 fill-current" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-800 mb-2">Live Route Optimization</h3>
              <p className="text-sm text-slate-500">Google Maps SDK integration goes here, complete with animated active route lines and glass marker overlays.</p>
            </div>
         </div>

         {/* Floating Map Controls */}
         <div className="absolute right-4 bottom-4 flex flex-col gap-2">
            <button className="w-10 h-10 bg-white/90 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-slate-700 shadow-lg hover:bg-white transition-colors">
              <Plus className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 bg-white/90 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-slate-700 shadow-lg hover:bg-white transition-colors">
              <Minus className="w-5 h-5" />
            </button>
         </div>
      </motion.div>
    </div>
  );
}
