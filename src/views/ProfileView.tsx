import { useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { User, Phone, ShieldCheck, AlertCircle, CheckCircle2, Loader2, BadgeCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { updateRiderProfile } from '../lib/endpoints';
import { ApiError } from '../lib/api';
import { humanize } from '../lib/format';

interface ProfileViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const STATUS_STYLE: Record<string, { cls: string; icon: ReactNode }> = {
  verified: { cls: 'bg-success/10 text-success', icon: <ShieldCheck className="w-4 h-4" /> },
  pending: { cls: 'bg-warning-100 text-warning-700', icon: <AlertCircle className="w-4 h-4" /> },
  suspended: { cls: 'bg-danger/10 text-danger', icon: <AlertCircle className="w-4 h-4" /> },
  deactivated: { cls: 'bg-slate-200 text-slate-500', icon: <AlertCircle className="w-4 h-4" /> },
};

export function ProfileView({ showNotification }: ProfileViewProps) {
  const { profile, setProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);

  if (!profile) return null;
  const statusStyle = STATUS_STYLE[profile.status] ?? STATUS_STYLE.pending;
  const dirty = displayName !== (profile.displayName ?? '') || phone !== (profile.phone ?? '');

  const save = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const updated = await updateRiderProfile({ displayName: displayName.trim(), phone: phone.trim() });
      setProfile(updated);
      showNotification('Profile Updated', 'Your details were saved.', 'success');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not save your profile.';
      showNotification('Save Failed', msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">My Profile</h2>
        <p className="text-slate-500 font-medium">Manage your rider account details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6 text-center">
            <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 border-4 border-white shadow-lg flex items-center justify-center">
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">{profile.displayName || 'Rider'}</h3>
            <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold ${statusStyle.cls}`}>
              {statusStyle.icon} {humanize(profile.status)}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
              <span className={`w-2 h-2 rounded-full ${profile.available ? 'bg-success' : 'bg-slate-300'}`} />
              {profile.available ? 'Available for assignments' : 'Currently offline'}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-3xl p-6">
            <h3 className="font-bold text-slate-900 mb-4 px-1 flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-primary-500" /> Account</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Rider ID</span><span className="font-medium text-slate-800 truncate max-w-[140px]">{profile.id}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Campus ID</span><span className="font-medium text-slate-800 truncate max-w-[140px]">{profile.campusId}</span></div>
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-3xl p-6 md:p-8">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h3 className="font-bold text-xl text-slate-900">Edit Details</h3>
              <p className="text-sm text-slate-500 mt-1">Update your display name and contact number.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Display Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-white/60 border border-white/60 rounded-xl pl-9 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/50 font-medium text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/60 border border-white/60 rounded-xl pl-9 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/50 font-medium text-slate-800"
                  />
                </div>
              </div>

              <button
                onClick={save}
                disabled={!dirty || saving}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
