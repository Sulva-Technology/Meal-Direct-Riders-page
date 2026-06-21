import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import { ToastType } from '../components/Toast';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import { requestPasswordReset } from '../lib/endpoints';

interface LoginViewProps {
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

export function LoginView({ showNotification }: LoginViewProps) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!email || !password) {
      showNotification('Missing Details', 'Enter your email and password.', 'error');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      showNotification('Weak Password', 'Password must be at least 6 characters.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        showNotification('Welcome back', 'Signed in successfully.', 'success');
      } else {
        const res = await signup(email, password);
        if (res.needsVerification) {
          showNotification('Verify Your Email', res.message || 'Account created. Check your email to verify, then sign in.', 'success');
          setMode('login');
          setPassword('');
        } else {
          showNotification('Account Created', 'Your rider account is ready.', 'success');
        }
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Authentication failed. Try again.';
      showNotification(mode === 'login' ? 'Login Failed' : 'Signup Failed', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      showNotification('Enter Email', 'Type your email above first, then tap Forgot.', 'info');
      return;
    }
    try {
      await requestPasswordReset(email);
      showNotification('Reset Sent', 'Check your email for a reset link.', 'success');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not send reset link.';
      showNotification('Reset Failed', msg, 'error');
    }
  };

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

        <div className="text-center mb-10 mt-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto shrink-0 mb-6"
          >
            <img
              src="/logo.png"
              alt="Meal Direct"
              className="w-20 h-20 rounded-[24px] shadow-xl shadow-[#10B981]/30 object-cover"
            />
          </motion.div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-[#0f172a] mb-2">
            <span className="text-[#0f172a]">Meal </span>
            <span className="text-[#10B981]">Direct</span>
          </h1>
          <p className="text-slate-500 font-medium">
            {mode === 'login' ? 'Rider Login Portal' : 'Create your Rider account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rider@example.com"
                  className="w-full bg-white/50 border border-white/60 rounded-xl pl-9 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between items-center ml-1 mb-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Password</label>
                {mode === 'login' && (
                  <button type="button" onClick={handleForgot} className="text-xs font-medium text-primary-600 hover:text-primary-700">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/50 border border-white/60 rounded-xl pl-9 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium text-slate-800"
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
                {mode === 'login' ? 'Sign In To Dashboard' : 'Create Account'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          {mode === 'login' ? (
            <>
              New rider?{' '}
              <button onClick={() => setMode('signup')} className="font-semibold text-primary-600 hover:text-primary-700">
                Create an account
              </button>
            </>
          ) : (
            <>
              Already registered?{' '}
              <button onClick={() => setMode('login')} className="font-semibold text-primary-600 hover:text-primary-700">
                Sign in
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
