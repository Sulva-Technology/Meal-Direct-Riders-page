import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

export interface ToastProps extends ToastMessage {
  onClose: (id: string) => void;
}

export function Toast({ id, type, title, message, onClose }: ToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success" />,
    error: <AlertCircle className="w-5 h-5 text-danger" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning-600" />,
    info: <Info className="w-5 h-5 text-primary-500" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="bg-white/90 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(34,197,94,0.15)] rounded-2xl p-4 flex gap-3 items-start pointer-events-auto min-w-[300px] max-w-sm"
    >
      <div className="mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{message}</p>
      </div>
      <button onClick={() => onClose(id)} className="text-slate-400 hover:text-slate-600 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onClose }: { toasts: ToastMessage[], onClose: (id: string) => void }) {
  return (
    <div className="fixed top-20 right-4 lg:top-4 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(({ id, type, title, message }) => (
          <Toast key={id} id={id} type={type} title={title} message={message} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}
