import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard, 
  Package, 
  ListOrdered, 
  Route, 
  Map, 
  Wallet, 
  TrendingUp, 
  Camera, 
  Bell, 
  LifeBuoy, 
  User, 
  Settings,
  X
} from 'lucide-react';
import { ViewState } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ currentView, setCurrentView, isOpen, setIsOpen }: SidebarProps) {
  const menuItems: { id: ViewState; label: string; icon: ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'assigned_orders', label: 'Assigned Orders', icon: <Package className="w-5 h-5" /> },
    { id: 'pickup_queue', label: 'Pickup Queue', icon: <ListOrdered className="w-5 h-5" /> },
    { id: 'route_planner', label: 'Route Planner', icon: <Route className="w-5 h-5" /> },
    { id: 'delivery_zones', label: 'Delivery Zones', icon: <Map className="w-5 h-5" /> },
    { id: 'earnings', label: 'Earnings', icon: <Wallet className="w-5 h-5" /> },
    { id: 'performance', label: 'Performance', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const bottomItems: { id: ViewState; label: string; icon: ReactNode }[] = [
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'support', label: 'Support', icon: <LifeBuoy className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleSelect = (id: ViewState) => {
    setCurrentView(id);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 h-screen w-64 glass-panel border-r border-white/40 z-50 flex flex-col gap-8 overflow-y-auto py-6 px-4",
          "transition-transform duration-300 ease-in-out shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Meal Direct"
                className="rounded-2xl w-11 h-11 shrink-0 shadow-sm object-cover"
              />
              <h1 className="font-display font-bold text-2xl tracking-tighter">
                <span className="text-[#0f172a]">Meal </span>
                <span className="text-[#10B981]">Direct</span>
              </h1>
            </div>
            <button className="lg:hidden" onClick={() => setIsOpen(false)}>
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative",
                  currentView === item.id 
                    ? "text-primary-600 bg-primary-500/10 shadow-[0_0_12px_rgba(34,197,94,0.1)]" 
                    : "text-slate-600 hover:bg-white/50 hover:text-slate-900"
                )}
              >
                {item.icon}
                {item.label}
                {currentView === item.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2">
          <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            System
          </div>
          <nav className="flex flex-col gap-1">
            {bottomItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                  currentView === item.id 
                    ? "text-primary-600 bg-primary-500/10" 
                    : "text-slate-600 hover:bg-white/50 hover:text-slate-900"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
