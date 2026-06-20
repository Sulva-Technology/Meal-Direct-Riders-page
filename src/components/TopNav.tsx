import { Menu, Search, Bell } from 'lucide-react';
import { RiderState } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { ToastType } from './Toast';

interface TopNavProps {
  riderState: RiderState;
  setRiderState: (state: Partial<RiderState>) => void;
  onOpenSidebar: () => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

export function TopNav({ riderState, setRiderState, onOpenSidebar, showNotification }: TopNavProps) {
  const toggleStatus = () => {
    const newState = !riderState.isOnline;
    setRiderState({ isOnline: newState });
    showNotification(
      'Status Updated', 
      `You are now ${newState ? 'online and receiving orders' : 'offline'}.`,
      newState ? 'success' : 'info'
    );
  };

  return (
    <header className="glass-panel sticky top-0 z-30 px-6 py-4 flex items-center justify-between rounded-b-2xl mb-6 mx-4 mt-2">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 rounded-xl hover:bg-white/50 text-slate-600" onClick={onOpenSidebar}>
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full border border-white/60 focus-within:ring-2 focus-within:ring-primary-200 transition-all">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search deliveries, zones..." 
            className="bg-transparent border-none outline-none text-sm w-64 placeholder:text-slate-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                showNotification('Search', 'Search functionality is coming soon.', 'info');
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600 hidden sm:block">
            {riderState.isOnline ? 'Online' : 'Offline'}
          </span>
          <button 
            onClick={toggleStatus}
            className={cn(
              "w-12 h-6 rounded-full p-1 transition-colors duration-300 relative",
              riderState.isOnline ? "bg-primary-500" : "bg-slate-300"
            )}
          >
            <motion.div 
              layout
              className="w-4 h-4 bg-white rounded-full shadow-sm"
              animate={{
                x: riderState.isOnline ? 24 : 0
              }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        <button 
          onClick={() => showNotification('Notifications', 'You have no new notifications.', 'info')}
          className="relative p-2 rounded-xl hover:bg-white/50 text-slate-600 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-danger"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-white/40">
          <button 
            onClick={() => showNotification('Profile', 'Profile settings opening...', 'info')}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-primary-200 p-0.5 hover:scale-105 transition-transform"
          >
            <div className="w-full h-full rounded-full bg-white border-2 border-white overflow-hidden">
              <img 
                src={"https://api.dicebear.com/7.x/notionists/svg?seed=David&backgroundColor=e2e8f0"} 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
