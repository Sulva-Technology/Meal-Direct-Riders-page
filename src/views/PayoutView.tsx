import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, ChevronDown, Loader2 } from 'lucide-react';
import { ViewState } from '../types';
import { ToastType } from '../components/Toast';
import { useApi } from '../lib/useApi';
import { listSettlements, getSettlement } from '../lib/endpoints';
import { LoadingState, ErrorState } from '../components/States';
import { formatKobo, formatDate, humanize } from '../lib/format';
import type { RiderSettlementSummary, RiderSettlementDetail, SettlementStatus } from '../types/api';

interface Props {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const STATUS_CLS: Record<SettlementStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
};

export function PayoutView({}: Props) {
  const { data, loading, error, reload } = useApi(() => listSettlements({ limit: 50 }), []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RiderSettlementDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  if (loading) return <LoadingState label="Loading settlements…" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const settlements: RiderSettlementSummary[] = data?.data ?? [];

  const toggle = async (s: RiderSettlementSummary) => {
    if (openId === s.id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(s.id);
    setDetail(null);
    setLoadingDetail(true);
    try {
      setDetail(await getSettlement(s.id));
    } finally {
      setLoadingDetail(false);
    }
  };

  if (settlements.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-white/50 border border-white/60 flex items-center justify-center text-slate-400 shadow-xl shadow-slate-200/50">
          <Briefcase className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900">No settlements yet</h2>
        <p className="text-slate-500 font-medium">Your payout records will appear here once deliveries are settled.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Settlements</h2>
        <p className="text-slate-500 font-medium">Your payout history and breakdowns.</p>
      </div>

      <div className="space-y-3">
        {settlements.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card rounded-2xl overflow-hidden">
            <button onClick={() => toggle(s)} className="w-full p-5 flex items-center justify-between gap-4 hover:bg-white/40 transition-colors">
              <div className="text-left">
                <p className="font-bold text-slate-900">{formatDate(s.settlementDate)}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.lineCount} lines · updated {formatDate(s.updatedAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-display font-bold text-lg text-slate-900">{formatKobo(s.payableKobo)}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${STATUS_CLS[s.status]}`}>{humanize(s.status)}</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openId === s.id ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <AnimatePresence>
              {openId === s.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-200/50">
                  <div className="p-5 space-y-3">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white/50 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Earnings</p>
                        <p className="font-bold text-slate-800 text-sm">{formatKobo(s.deliveryEarningsKobo)}</p>
                      </div>
                      <div className="bg-white/50 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Adjustments</p>
                        <p className="font-bold text-slate-800 text-sm">{formatKobo(s.adjustmentsKobo)}</p>
                      </div>
                      <div className="bg-white/50 rounded-xl p-3">
                        <p className="text-xs text-slate-500">Payable</p>
                        <p className="font-bold text-primary-600 text-sm">{formatKobo(s.payableKobo)}</p>
                      </div>
                    </div>

                    {loadingDetail && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>}
                    {detail && detail.id === s.id && (
                      <div className="space-y-2 pt-2">
                        {detail.lines.map((line) => (
                          <div key={line.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0">
                            <div>
                              <p className="font-medium text-slate-800">{line.description || humanize(line.lineType)}</p>
                              {line.orderNumber && <p className="text-xs text-slate-400">{line.orderNumber}</p>}
                            </div>
                            <span className={`font-semibold ${line.amountKobo < 0 ? 'text-danger' : 'text-slate-800'}`}>{formatKobo(line.amountKobo)}</span>
                          </div>
                        ))}
                        {s.externalReference && <p className="text-xs text-slate-400 pt-1">Ref: {s.externalReference}</p>}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
