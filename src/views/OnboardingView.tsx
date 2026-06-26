import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Loader2, User, Phone, Building2, LogOut } from 'lucide-react';
import { ToastType } from '../components/Toast';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import { listCampuses } from '../lib/endpoints';
import type { CampusRecord } from '../types/api';

interface OnboardingViewProps {
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

export function OnboardingView({ showNotification }: OnboardingViewProps) {
  const { completeOnboarding, logout } = useAuth();

  const [campuses, setCampuses] = useState<CampusRecord[]>([]);
  const [campusId, setCampusId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');

  const [loadingCampuses, setLoadingCampuses] = useState(true);
  const [campusError, setCampusError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load active campuses on mount.
  const loadCampuses = async () => {
    setLoadingCampuses(true);
    setCampusError(false);
    try {
      const { data } = await listCampuses();
      setCampuses(data.filter((c) => c.active));
    } catch {
      setCampusError(true);
    } finally {
      setLoadingCampuses(false);
    }
  };

  useEffect(() => {
    void loadCampuses();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!campusId || displayName.trim().length < 2 || !phone.trim()) {
      showNotification('Missing Details', 'Pick your campus, enter your name (2+ characters) and phone number.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await completeOnboarding({ campusId, displayName: displayName.trim(), phone: phone.trim() });
      showNotification('All Set', 'Your rider profile is ready.', 'success');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not complete onboarding. Try again.';
      showNotification('Onboarding Failed', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'w-full bg-white/50 border border-white/60 rounded-xl pl-9 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium text-slate-800 disabled:opacity-60';

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-green-50 to-slate-100">
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-[10%] w-64 h-64 bg-primary-200/40 rounded-full blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-20 right-[10%] w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="glass-panel w-full max-w-md p-8 rounded-3xl z-10 mx-4 shadow-2xl shadow-green-900/5 relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-200" />

        <div className="text-center mb-8 mt-2">
          <h1 className="font-display text-[26px] font-bold tracking-tight text-[#0f172a] mb-2">
            Finish setting up
          </h1>
          <p className="text-slate-500 font-medium">Tell us where you'll be riding.</p>
        </div>

        {campusError ? (
          <div className="text-center py-8">
            <p className="text-slate-600 font-medium mb-4">Couldn't load campuses.</p>
            <button
              onClick={() => void loadCampuses()}
              className="px-6 py-2 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Campus</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={campusId}
                    onChange={(e) => setCampusId(e.target.value)}
                    disabled={loadingCampuses}
                    className={fieldClass}
                  >
                    <option value="">{loadingCampuses ? 'Loading campuses…' : 'Select your campus'}</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    maxLength={120}
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+2348012345678"
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white rounded-xl py-3.5 font-medium transition-all flex items-center justify-center gap-2 group"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => void logout()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
