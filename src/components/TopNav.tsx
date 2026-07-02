import { useEffect, useState } from 'react';
import { Menu, Search, Bell, LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToastType } from './Toast';
import { useAuth } from '../lib/auth';
import { ViewState } from '../types';
import { AvailabilityToggle } from './AvailabilityToggle';
import { useApi } from '../lib/useApi';
import { listNotifications } from '../lib/endpoints';

interface TopNavProps {
  onOpenSidebar: () => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
  navigate: (view: ViewState) => void;
}

export function TopNav({ onOpenSidebar, showNotification, navigate }: TopNavProps) {
  const { profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: notifs, reload } = useApi(() => listNotifications({ limit: 50 }), []);
  const hasUnread = (notifs?.data ?? []).some((n) => !n.readAt);

  // Refetch when a foreground push arrives so the unread dot stays current.
  useEffect(() => {
    const handler = () => reload();
    window.addEventListener('md:notifications-updated', handler);
    return () => window.removeEventListener('md:notifications-updated', handler);
  }, [reload]);

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
        <AvailabilityToggle showNotification={showNotification} labelClassName="hidden sm:block" />

        <button
          onClick={() => navigate('notifications')}
          className="relative p-2 rounded-xl hover:bg-white/50 text-slate-600 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {hasUnread && <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-danger"></span>}
        </button>

        <div className="relative flex items-center gap-3 pl-4 border-l border-white/40">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-primary-200 p-0.5 hover:scale-105 transition-transform"
          >
            <div className="w-full h-full rounded-full bg-white border-2 border-white overflow-hidden flex items-center justify-center text-slate-500">
              <UserIcon className="w-5 h-5" />
            </div>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="absolute right-0 top-12 z-20 w-56 glass-panel rounded-2xl p-2 shadow-xl border border-white/60"
                >
                  <div className="px-3 py-2 border-b border-slate-200/50 mb-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{profile?.displayName || 'Rider'}</p>
                    <p className="text-xs text-slate-500 truncate">{profile?.phone || '-'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('profile');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-white/60"
                  >
                    <UserIcon className="w-4 h-4" /> My Profile
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-danger hover:bg-danger/10"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
