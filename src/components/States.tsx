import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { ApiError } from '../lib/api';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError | Error; onRetry?: () => void }) {
  const message = error instanceof ApiError ? error.message : error.message || 'Something went wrong.';
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center text-danger">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <div>
        <h3 className="font-display font-bold text-lg text-slate-900">Couldn't load this</h3>
        <p className="text-slate-500 text-sm mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      )}
    </div>
  );
}
