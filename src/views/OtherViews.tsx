import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { MessageSquare, MapPin, Package, Store, Phone, Mail } from 'lucide-react';
import { useApi } from '../lib/useApi';
import { listAssignments } from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';

const env = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;
const SUPPORT_PHONE = env?.VITE_SUPPORT_PHONE ?? '';
const SUPPORT_WHATSAPP = env?.VITE_SUPPORT_WHATSAPP ?? '';
const SUPPORT_EMAIL = env?.VITE_SUPPORT_EMAIL ?? '';
const telHref = (n: string) => `tel:${n.replace(/[^0-9+]/g, '')}`;
const waHref = (n: string) => `https://wa.me/${n.replace(/[^0-9]/g, '')}`;

interface SharedViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

export function DeliveryZonesView({ navigate }: SharedViewProps) {
  const { data, loading, error, reload } = useApi(() => listAssignments(), []);
  if (loading) return <LoadingState label="Loading zones…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const assignments = (data?.data ?? []).filter((a) => a.status !== 'completed' && a.status !== 'cancelled');
  const zones = new Map<string, { name: string; orders: number; vendors: Set<string> }>();
  for (const a of assignments) {
    const z = zones.get(a.zoneId) ?? { name: a.zoneName, orders: 0, vendors: new Set<string>() };
    z.orders += a.orderCount;
    z.vendors.add(a.vendorDisplayName);
    zones.set(a.zoneId, z);
  }
  const zoneList = Array.from(zones.values());

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Delivery Zones</h2>
        <p className="text-slate-500 font-medium">Active zones from your current assignments.</p>
      </div>

      {zoneList.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-xl text-slate-900">No active zones</h3>
          <p className="text-slate-500 mt-2">Accept an assignment to see your zones light up.</p>
          <button onClick={() => navigate('pickup_queue')} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800">Pickup Queue</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {zoneList.map((z, i) => (
            <motion.div key={z.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{z.name}</h3>
                  <p className="text-xs text-success font-semibold">Active</p>
                </div>
              </div>
              <div className="flex gap-6 text-sm">
                <span className="flex items-center gap-1.5 text-slate-600"><Package className="w-4 h-4 text-slate-400" /> {z.orders} orders</span>
                <span className="flex items-center gap-1.5 text-slate-600"><Store className="w-4 h-4 text-slate-400" /> {z.vendors.size} vendors</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SupportView({}: SharedViewProps) {
  const channels = [
    SUPPORT_PHONE && {
      key: 'call',
      label: 'Call Dispatch',
      desc: SUPPORT_PHONE,
      href: telHref(SUPPORT_PHONE),
      icon: <Phone className="w-5 h-5" />,
    },
    SUPPORT_WHATSAPP && {
      key: 'whatsapp',
      label: 'WhatsApp',
      desc: 'Chat with the rider desk',
      href: waHref(SUPPORT_WHATSAPP),
      icon: <MessageSquare className="w-5 h-5" />,
      external: true,
    },
    SUPPORT_EMAIL && {
      key: 'email',
      label: 'Email Support',
      desc: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}`,
      icon: <Mail className="w-5 h-5" />,
    },
  ].filter(Boolean) as { key: string; label: string; desc: string; href: string; icon: ReactNode; external?: boolean }[];

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
      <div className="glass-panel p-8 rounded-3xl text-center space-y-6">
        <div className="w-20 h-20 bg-primary-500/10 rounded-2xl flex items-center justify-center mx-auto text-primary-600">
          <MessageSquare className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-900">Rider Support</h2>
        <p className="text-slate-500 max-w-sm mx-auto">Reach the rider desk about an active order, an issue, or your earnings.</p>

        {channels.length === 0 ? (
          <p className="text-sm text-slate-400">Support contact details are not configured yet.</p>
        ) : (
          <div className="space-y-3 mt-8 text-left">
            {channels.map((c) => (
              <a
                key={c.key}
                href={c.href}
                {...(c.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">{c.icon}</div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{c.label}</p>
                  <p className="text-sm text-slate-500 truncate">{c.desc}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
