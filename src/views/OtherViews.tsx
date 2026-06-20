import { motion } from 'motion/react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { Bell, Search, Filter, MessageSquare, Briefcase, Settings2, ShieldCheck, MapPin, Package, Camera } from 'lucide-react';

interface SharedViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

function EmptyState({ icon, title, description, badge }: { icon: React.ReactNode, title: string, description: string, badge?: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 rounded-full bg-white/50 border border-white/60 flex items-center justify-center text-slate-400 shadow-xl shadow-slate-200/50 mb-4"
      >
        {icon}
      </motion.div>
      {badge && <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold uppercase tracking-wider">{badge}</span>}
      <h2 className="text-2xl font-display font-bold text-slate-900">{title}</h2>
      <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

export function DeliveryZonesView({}: SharedViewProps) {
  return <EmptyState 
    badge="Live Heatmap"
    title="Zone Activity" 
    description="Your current assigned zone (Zone Alpha) is experiencing moderate demand. Stay nearby for priority assignments." 
    icon={<MapPin className="w-10 h-10 text-primary-500" />} 
  />;
}

export function NotificationsView({}: SharedViewProps) {
  return <EmptyState 
    title="You're all caught up" 
    description="There are no new notifications or alerts for you right now." 
    icon={<Bell className="w-10 h-10" />} 
  />;
}

export function SupportView({ showNotification }: SharedViewProps) {
  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="glass-panel p-8 rounded-3xl text-center space-y-6">
        <div className="w-20 h-20 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto text-primary-600">
          <MessageSquare className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-900">Rider Support</h2>
        <p className="text-slate-500 max-w-sm mx-auto">Get help with an active order, report an issue, or ask a question about your earnings.</p>
        
        <div className="grid grid-cols-2 gap-4 mt-8">
          <button 
            onClick={() => {
              showNotification("Initiating Chat", "Connecting to a live agent...", "info");
              // Simulation of starting a chat
              setTimeout(() => {
                showNotification("Live Chat", "No agents available right now. Please leave a message.", "warning");
              }, 1500);
            }}
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-colors font-semibold text-slate-800"
          >
            Live Chat
          </button>
          <button 
            onClick={() => {
              showNotification("Call Service", "Starting call with dispatch...", "info");
              window.location.href = "tel:+18005550199";
            }}
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-colors font-semibold text-slate-800"
          >
            Call Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}



export function PayoutView({}: SharedViewProps) {
  return <EmptyState 
    title="Payouts & Banking" 
    description="Link your bank account, view deposit history, and manage automatic withdrawals." 
    icon={<Briefcase className="w-10 h-10" />} 
  />;
}

export function SettingsView({}: SharedViewProps) {
  return <EmptyState 
    title="App Settings" 
    description="Manage notifications, audio preferences, and navigation settings." 
    icon={<ShieldCheck className="w-10 h-10" />} 
  />;
}
