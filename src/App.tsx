import { useCallback, useEffect, useState } from 'react';
import { ViewState } from './types';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import {
  DashboardView,
  LoginView,
  OnboardingView,
  PickupQueueView,
  RoutePlannerView,
  EarningsView,
  PerformanceView,
  AssignedOrdersView,
  DeliveryZonesView,
  NotificationsView,
  SupportView,
  ProfileView,
  SettingsView,
  PayoutView,
} from './views';
import { ToastContainer, ToastMessage, ToastType } from './components/Toast';
import { initForegroundMessaging } from './lib/pushNotifications';
import { useAuth } from './lib/auth';
import { Loader2 } from 'lucide-react';

const VIEWS = new Set<ViewState>([
  'dashboard',
  'pickup_queue',
  'route_planner',
  'earnings',
  'performance',
  'assigned_orders',
  'delivery_zones',
  'notifications',
  'support',
  'profile',
  'payout',
  'settings',
]);

function getInitialView(): ViewState {
  const queryView = new URLSearchParams(window.location.search).get('view') as ViewState | null;
  if (queryView && VIEWS.has(queryView)) return queryView;
  const storedView = sessionStorage.getItem('meal_direct_view') as ViewState | null;
  return storedView && VIEWS.has(storedView) ? storedView : 'dashboard';
}

export default function App() {
  const { status } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>(getInitialView);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showNotification = useCallback((title: string, message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Foreground pushes (tab focused): toast + nudge the notification bell/inbox to refetch.
  useEffect(() => {
    if (status !== 'authenticated') return;
    return initForegroundMessaging((payload) => {
      const n = payload.notification;
      showNotification(n?.title || 'Meal Direct', n?.body || 'You have a new update.', 'info');
      window.dispatchEvent(new Event('md:notifications-updated'));
    });
  }, [status, showNotification]);

  const navigate = useCallback((view: ViewState) => {
    sessionStorage.setItem('meal_direct_view', view);
    setCurrentView(view);
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-green-50 to-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <>
        <LoginView showNotification={showNotification} />
        <ToastContainer toasts={toasts} onClose={removeNotification} />
      </>
    );
  }

  if (status === 'onboarding') {
    return (
      <>
        <OnboardingView showNotification={showNotification} />
        <ToastContainer toasts={toasts} onClose={removeNotification} />
      </>
    );
  }

  const renderView = () => {
    const viewProps = { navigate, showNotification };
    switch (currentView) {
      case 'dashboard':
        return <DashboardView {...viewProps} />;
      case 'pickup_queue':
        return <PickupQueueView {...viewProps} />;
      case 'route_planner':
        return <RoutePlannerView {...viewProps} />;
      case 'earnings':
        return <EarningsView {...viewProps} />;
      case 'performance':
        return <PerformanceView {...viewProps} />;
      case 'assigned_orders':
        return <AssignedOrdersView {...viewProps} />;
      case 'delivery_zones':
        return <DeliveryZonesView {...viewProps} />;
      case 'notifications':
        return <NotificationsView {...viewProps} />;
      case 'support':
        return <SupportView {...viewProps} />;
      case 'profile':
        return <ProfileView {...viewProps} />;
      case 'payout':
        return <PayoutView {...viewProps} />;
      case 'settings':
        return <SettingsView {...viewProps} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">🚧</span>
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-slate-800">Under Construction</h3>
              <p className="text-slate-500 font-medium mt-1">This section of the premium cockpit is being built.</p>
            </div>
            <button
              onClick={() => navigate('dashboard')}
              className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen w-full relative">
      <ToastContainer toasts={toasts} onClose={removeNotification} />
      <Sidebar
        currentView={currentView}
        setCurrentView={navigate}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <TopNav
          onOpenSidebar={() => setIsSidebarOpen(true)}
          showNotification={showNotification}
          navigate={navigate}
        />
        <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">{renderView()}</div>
      </main>
    </div>
  );
}
