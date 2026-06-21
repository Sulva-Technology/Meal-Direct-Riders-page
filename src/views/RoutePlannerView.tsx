import { motion } from 'motion/react';
import { Navigation, Clock, Truck, Store, MapPin, Plus, Minus, Package } from 'lucide-react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { listAssignments, getAssignment } from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';
import { humanize } from '../lib/format';
import type { RiderAssignmentDetail } from '../types/api';

interface Props {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

interface Stop {
  id: string;
  title: string;
  address: string;
  type: 'pickup' | 'delivery';
  status: string;
}

async function loadRoute(): Promise<RiderAssignmentDetail[]> {
  const { data } = await listAssignments();
  const active = data.filter((a) => a.status === 'accepted' || a.status === 'picked_up');
  return Promise.all(active.map((a) => getAssignment(a.id)));
}

export function RoutePlannerView({ navigate, showNotification }: Props) {
  const { data, loading, error, reload } = useApi(loadRoute, []);

  if (loading) return <LoadingState label="Building your route…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const assignments = data ?? [];
  const stops: Stop[] = [];
  for (const a of assignments) {
    stops.push({ id: `pickup-${a.id}`, title: `Pickup: ${a.vendorDisplayName}`, address: `${a.deliverySlotName} · ${a.deliveryTime}`, type: 'pickup', status: humanize(a.status) });
    for (const o of a.orders) {
      stops.push({ id: `drop-${o.id}`, title: `Drop-off: ${o.customerDisplayName || o.orderNumber}`, address: `${o.locationName} · ${a.zoneName}`, type: 'delivery', status: humanize(o.orderStatus) });
    }
  }

  const totalDrops = stops.filter((s) => s.type === 'delivery').length;

  return (
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-96 flex flex-col gap-4 h-full">
        <div className="glass-card rounded-3xl p-6 mb-2">
          <h2 className="text-2xl font-display font-bold text-slate-900 mb-1">Active Route</h2>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 bg-white/50 rounded-xl p-3 border border-white/60">
              <p className="text-xs text-slate-500 font-semibold mb-1">STOPS</p>
              <p className="font-bold text-slate-900 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-primary-500" /> {stops.length}</p>
            </div>
            <div className="flex-1 bg-white/50 rounded-xl p-3 border border-white/60">
              <p className="text-xs text-slate-500 font-semibold mb-1">DROP-OFFS</p>
              <p className="font-bold text-slate-900 flex items-center gap-1.5"><Package className="w-4 h-4 text-primary-500" /> {totalDrops}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('assigned_orders')}
            className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 transition-all"
          >
            <Navigation className="w-4 h-4 fill-current" /> Manage Deliveries
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
          {stops.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-10">No active route. Accept a batch first.</div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute top-4 bottom-4 left-3 w-0.5 bg-slate-200" />
              {stops.map((stop) => (
                <div key={stop.id} className="relative mb-6 last:mb-0">
                  <div className={`absolute -left-[27px] top-4 w-4 h-4 rounded-full border-4 border-white ${stop.type === 'pickup' ? 'bg-primary-500' : 'bg-slate-800'} z-10 shadow-sm`} />
                  <div onClick={() => showNotification('Stop', stop.title, 'info')} className="glass-panel p-4 rounded-2xl hover:bg-white/80 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        {stop.type === 'pickup' ? <Store className="w-3.5 h-3.5 text-primary-500" /> : <MapPin className="w-3.5 h-3.5 text-slate-500" />}
                        {stop.title}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{stop.address}</p>
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-md">{stop.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex-1 glass-card rounded-3xl overflow-hidden relative min-h-[400px]">
        <div className="absolute inset-0 bg-slate-100/50 backdrop-blur-sm z-0" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#16A34A 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8 bg-white/60 backdrop-blur-md rounded-3xl border border-white/60 max-w-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
              <Truck className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-xl text-slate-800 mb-2">{stops.length} stops on this route</h3>
            <p className="text-sm text-slate-500">Map rendering (Google Maps SDK) plugs in here. Stops are driven by your live assignments.</p>
          </div>
        </div>
        <div className="absolute right-4 bottom-4 flex flex-col gap-2">
          <button className="w-10 h-10 bg-white/90 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-slate-700 shadow-lg"><Plus className="w-5 h-5" /></button>
          <button className="w-10 h-10 bg-white/90 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center text-slate-700 shadow-lg"><Minus className="w-5 h-5" /></button>
        </div>
      </motion.div>
    </div>
  );
}
