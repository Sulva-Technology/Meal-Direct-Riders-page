import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { MapPin, User, CheckCircle2, Phone, PackageOpen } from 'lucide-react';

interface AssignedOrdersViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const initialOrders = [
  {
    id: 'ORD-7721',
    student: 'Sarah Jenkins',
    phone: '+1 555-0192',
    location: 'Alpha Dorm - Room 102',
    meal: 'Grilled Chicken Salad',
    batch: 'Lunch Batch A',
    status: 'pending',
  },
  {
    id: 'ORD-7722',
    student: 'Michael Chen',
    phone: '+1 555-0193',
    location: 'Alpha Dorm - Room 105',
    meal: 'Vegan Wrap Meal',
    batch: 'Lunch Batch A',
    status: 'pending',
  },
  {
    id: 'ORD-7723',
    student: 'Emily Davis',
    phone: '+1 555-0194',
    location: 'Beta Dorm - Lobby',
    meal: 'Spicy Beef Rice Bowl',
    batch: 'Lunch Batch A',
    status: 'pending',
  }
];

export function AssignedOrdersView({ showNotification }: AssignedOrdersViewProps) {
  const [orders, setOrders] = useState(initialOrders);

  const markDelivered = (id: string) => {
    setOrders(orders.map(order => 
      order.id === id ? { ...order, status: 'delivered' } : order
    ));
    showNotification('Drop-off Logged', `Order ${id} marked as delivered. The student can now confirm receipt.`, 'success');
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  // Group pending orders by batch
  const pendingByBatch = pendingOrders.reduce((acc, order) => {
    if (!acc[order.batch]) acc[order.batch] = [];
    acc[order.batch].push(order);
    return acc;
  }, {} as Record<string, typeof orders>);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Active Deliveries</h2>
        <p className="text-slate-500 font-medium">Manage and drop off individual meals in your current batch.</p>
      </div>

      <div className="space-y-8">
        <AnimatePresence>
          {Object.entries(pendingByBatch).map(([batchName, batchOrders]) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, margin: 0, overflow: 'hidden' }}
              key={batchName}
              className="space-y-4"
            >
              <h3 className="font-display font-bold text-lg text-slate-900 border-b border-slate-200 pb-2">{batchName}</h3>
              {batchOrders.map((order) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, height: 0, padding: 0, margin: 0, overflow: 'hidden' }}
                  key={order.id}
                  className="glass-card rounded-3xl p-6 relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-md">
                          {order.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{order.student}</p>
                              <button 
                                onClick={() => {
                                  showNotification("Calling", `Calling ${order.student}...`, "info");
                                  window.location.href = `tel:${order.phone.replace(/[^0-9+]/g, '')}`;
                                }}
                                className="text-[#10B981] text-xs font-medium flex items-center gap-1 mt-1 hover:text-[#059669]"
                              >
                                <Phone className="w-3 h-3" /> {order.phone}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-sm font-medium text-slate-700">{order.location}</p>
                          </div>
                        </div>
                        
                        <div className="bg-white/40 rounded-xl p-3 border border-white/60 flex items-start gap-3">
                           <PackageOpen className="w-5 h-5 text-[#10B981] mt-0.5 shrink-0" />
                           <div>
                             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Meal Contents</p>
                             <p className="text-sm font-medium text-slate-800">{order.meal}</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-48 shrink-0 flex flex-col justify-end border-t md:border-t-0 md:border-l border-slate-200/50 pt-4 md:pt-0 md:pl-6">
                      <button 
                        onClick={() => markDelivered(order.id)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 font-medium transition-all flex items-center justify-center gap-2 group"
                      >
                        <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform text-[#10B981]" />
                        Mark Delivered
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>

        {pendingOrders.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-center py-12 glass-panel rounded-3xl"
          >
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4 text-success">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900">All caught up!</h3>
            <p className="text-slate-500 mt-2">You have completed all deliveries in this batch.</p>
          </motion.div>
        )}
      </div>

      {deliveredOrders.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display font-bold text-lg text-slate-900 mb-4 px-2">Completed Today</h3>
          <div className="space-y-3">
            {deliveredOrders.map((order) => (
              <div key={order.id} className="bg-white/40 border border-white/60 rounded-2xl p-4 flex items-center justify-between opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{order.student}</p>
                    <p className="text-xs text-slate-500">{order.location}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-400">{order.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
