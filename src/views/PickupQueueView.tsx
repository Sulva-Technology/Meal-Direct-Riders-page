import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, PackageSearch, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';

interface PickupQueueViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const initialBatches = [
  {
    id: 'BATCH-A12',
    vendor: 'Mama Kitchen',
    location: 'North Food Court',
    totalOrders: 15,
    readyOrders: 15,
    pickupTime: '11:45 AM',
    zone: 'Hostel Area A',
    status: 'Ready for Pickup',
    action: 'Confirm Pickup'
  },
  {
    id: 'BATCH-B05',
    vendor: 'Campus Grill',
    location: 'Student Union Hub',
    totalOrders: 8,
    readyOrders: 6,
    pickupTime: '12:00 PM',
    zone: 'Engineering Block',
    status: 'Preparing',
    action: 'View Details'
  }
];

export function PickupQueueView({ navigate, showNotification }: PickupQueueViewProps) {
  const [batches, setBatches] = useState(initialBatches);
  const [activeConfirmId, setActiveConfirmId] = useState<string | null>(null);
  const [vendorCode, setVendorCode] = useState('');

  const handleConfirmPickup = (id: string) => {
    setActiveConfirmId(id);
    setVendorCode('');
  };

  const submitCode = (id: string) => {
    if (vendorCode.length < 4) {
      showNotification('Missing Code', 'Please enter the 4-digit vendor code.', 'error');
      return;
    }
    showNotification('Pickup Confirmed', `You have successfully picked up ${id}.`, 'success');
    setBatches(v => v.filter(b => b.id !== id));
    setActiveConfirmId(null);
    setTimeout(() => {
      navigate('assigned_orders');
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Pickup Queue</h2>
        <p className="text-slate-500 font-medium">Manage your batched orders from vendors.</p>
      </div>

      <div className="grid gap-6">
        <AnimatePresence>
          {batches.map((batch, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.1 }}
              key={batch.id}
              className="glass-card rounded-3xl p-6 relative overflow-hidden"
            >
              {/* Status indicator line */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${batch.status === 'Ready for Pickup' ? 'bg-[#10B981]' : 'bg-warning-500'}`} />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-4">
                <div className="space-y-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                          {batch.id}
                        </span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                          batch.status === 'Ready for Pickup' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-warning-100 text-warning-700'
                        }`}>
                          {batch.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Store className="w-5 h-5 text-primary-500" />
                        {batch.vendor}
                      </h3>
                      <p className="text-sm text-slate-500">{batch.location}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6 border-t border-slate-200/50 pt-4">
                     <div>
                       <p className="text-xs font-semibold text-slate-400 uppercase">Target Zone</p>
                       <p className="font-medium text-slate-800">{batch.zone}</p>
                     </div>
                     <div>
                       <p className="text-xs font-semibold text-slate-400 uppercase">Pickup By</p>
                       <p className="font-medium text-slate-800">{batch.pickupTime}</p>
                     </div>
                     <div>
                       <p className="text-xs font-semibold text-slate-400 uppercase">Orders</p>
                       <p className="font-medium text-slate-800 flex items-center gap-2">
                         {batch.readyOrders} / {batch.totalOrders} Ready
                       </p>
                     </div>
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col justify-center bg-white/40 p-4 rounded-2xl border border-white/60 min-w-[200px]">
                   <div className="text-center mb-4">
                     <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                       <PackageSearch className="w-6 h-6 text-[#10B981]" />
                     </div>
                     <p className="text-xs text-slate-500 font-medium tracking-wide">TOTAL BATCH VOLUME</p>
                     <p className="text-2xl font-display font-bold text-slate-900">{batch.totalOrders} <span className="text-sm text-slate-500 font-medium">meals</span></p>
                   </div>
                   
                   {activeConfirmId === batch.id ? (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                       <div className="relative">
                         <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                         <input 
                           type="text" 
                           placeholder="Vendor Code" 
                           className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm font-medium focus:ring-2 focus:ring-[#10B981]/50 outline-none"
                           value={vendorCode}
                           onChange={e => setVendorCode(e.target.value)}
                           maxLength={6}
                           autoFocus
                         />
                       </div>
                       <div className="flex gap-2">
                         <button onClick={() => setActiveConfirmId(null)} className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                           Cancel
                         </button>
                         <button onClick={() => submitCode(batch.id)} className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-[#10B981] hover:bg-[#059669] transition-colors">
                           Verify
                         </button>
                       </div>
                     </motion.div>
                   ) : (
                     <button 
                       onClick={() => {
                         if (batch.status === 'Ready for Pickup') {
                           handleConfirmPickup(batch.id);
                         } else {
                           showNotification('Batch Details', `Loading details for ${batch.id}...`, 'info');
                           navigate('assigned_orders');
                         }
                       }}
                       className={`w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                         batch.status === 'Ready for Pickup' 
                          ? 'bg-[#10B981] hover:bg-[#059669] text-white shadow-lg shadow-[#10B981]/20' 
                          : 'bg-slate-800 hover:bg-slate-900 text-white'
                       }`}
                     >
                       {batch.status === 'Ready for Pickup' ? <CheckCircle2 className="w-4 h-4" /> : null}
                       {batch.action}
                       {batch.status !== 'Ready for Pickup' ? <ArrowRight className="w-4 h-4" /> : null}
                     </button>
                   )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {batches.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
             <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-4">
               <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
             </div>
             <h3 className="font-display font-bold text-xl text-slate-900">All Pickups Complete</h3>
             <p className="text-slate-500 max-w-sm mx-auto mt-2">You've successfully picked up all batched meals. Proceed to deliveries.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
