import { motion } from 'motion/react';
import { Fingerprint, Smartphone, ScanFace, ArrowRight } from 'lucide-react';
import { ToastType } from '../components/Toast';

interface LoginViewProps {
  onLogin: () => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

export function LoginView({ onLogin, showNotification }: LoginViewProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-green-50 to-slate-100">
      {/* Floating Elements */}
      <motion.div 
        animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[10%] w-64 h-64 bg-primary-200/40 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ y: [0, 30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 right-[10%] w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-panel w-full max-w-md p-8 rounded-3xl z-10 mx-4 shadow-2xl shadow-green-900/5 relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-200" />
        
        <div className="text-center mb-10 mt-2">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="bg-[#10B981] rounded-[24px] w-20 h-20 mx-auto flex items-center justify-center text-white shrink-0 shadow-xl shadow-[#10B981]/30 border border-[#10B981] mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
          </motion.div>
          <h1 className="font-display text-[28px] font-bold tracking-tight text-[#0f172a] mb-2">
            <span className="text-[#0f172a]">Meal </span>
            <span className="text-[#10B981]">Direct</span>
          </h1>
          <p className="text-slate-500 font-medium">Rider Login Portal</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onLogin(); }} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-1 block">Phone Number</label>
              <input 
                type="tel" 
                defaultValue="+1 (555) 000-0000"
                className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium text-slate-800"
              />
            </div>
            
            <div className="relative">
              <div className="flex justify-between items-center ml-1 mb-1 block">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Password</label>
                <button 
                  type="button" 
                  onClick={() => showNotification('Password Reset', 'A reset link has been sent to your phone.', 'success')}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  Forgot?
                </button>
              </div>
              <input 
                type="password" 
                defaultValue="••••••••"
                className="w-full bg-white/50 border border-white/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500/50 accent-primary-600" />
              <span className="text-sm font-medium text-slate-600">Remember me</span>
            </label>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3.5 font-medium transition-all flex items-center justify-center gap-2 group"
          >
            Sign In To Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/50"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white/40 backdrop-blur-md px-4 text-slate-500 font-medium rounded-full py-1">or log in with biometrics</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          <button 
            type="button" 
            onClick={() => showNotification('Face ID', 'Scanning face...', 'success')}
            className="p-4 bg-white/60 hover:bg-white/80 rounded-2xl border border-white/60 shadow-sm transition-all group flex-1 flex justify-center"
          >
            <ScanFace className="w-6 h-6 text-primary-600 group-hover:scale-110 transition-transform" />
          </button>
          <button 
            type="button" 
            onClick={() => showNotification('Touch ID', 'Scanning fingerprint...', 'success')}
            className="p-4 bg-white/60 hover:bg-white/80 rounded-2xl border border-white/60 shadow-sm transition-all group flex-1 flex justify-center"
          >
            <Fingerprint className="w-6 h-6 text-primary-600 group-hover:scale-110 transition-transform" />
          </button>
        </div>

      </motion.div>
    </div>
  );
}
