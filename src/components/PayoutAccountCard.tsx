import { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { Landmark, Loader2, CheckCircle2, Pencil } from 'lucide-react';
import { ApiError } from '../lib/api';
import { useApi } from '../lib/useApi';
import { getRiderPayoutAccount, updateRiderPayoutAccount } from '../lib/endpoints';
import type { ToastType } from './Toast';

interface Props {
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const emptyForm = { bankName: '', accountNumber: '', accountName: '', bankCode: '' };

/** Rider settlement (bank) account. Lets a rider set where payouts are sent.
 *  NOTE: the backend /rider/payout-account endpoints are not implemented yet — a GET
 *  404 is treated as "no account configured" so the form is usable now, and a save will
 *  surface the backend error until the endpoint lands. See issue #3. */
export function PayoutAccountCard({ showNotification }: Props) {
  // Treat a 404 (unimplemented / not-yet-configured) as "no account".
  const load = useCallback(async () => {
    try {
      return await getRiderPayoutAccount();
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.code === 'NOT_FOUND')) return null;
      throw e;
    }
  }, []);

  const { data: account, loading, error, reload } = useApi(load, []);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const startEdit = () => {
    setForm({
      bankName: account?.bankName ?? '',
      accountNumber: '',
      accountName: account?.accountName ?? '',
      bankCode: account?.bankCode ?? '',
    });
    setEditing(true);
  };

  const valid =
    form.bankName.trim().length > 0 &&
    form.accountName.trim().length > 0 &&
    /^[0-9]{6,20}$/.test(form.accountNumber.trim());

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await updateRiderPayoutAccount({
        bankName: form.bankName.trim(),
        accountName: form.accountName.trim(),
        accountNumber: form.accountNumber.trim(),
        bankCode: form.bankCode.trim() || undefined,
      });
      showNotification('Payout Account Saved', 'Your settlement account was updated.', 'success');
      setEditing(false);
      reload();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not save your payout account.';
      showNotification('Save Failed', msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full bg-white/60 border border-white/60 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/50 font-medium text-slate-800';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
          <Landmark className="w-5 h-5 text-primary-500" /> Payout account
        </h3>
        {!editing && !loading && (
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            <Pencil className="w-3.5 h-3.5" /> {account ? 'Edit' : 'Add'}
          </button>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-4">Where your settlements are paid out.</p>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{error.message}</p>
      ) : editing ? (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Bank name</label>
            <input value={form.bankName} onChange={set('bankName')} className={inputCls} placeholder="e.g. Access Bank" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Account number</label>
            <input
              value={form.accountNumber}
              onChange={set('accountNumber')}
              inputMode="numeric"
              className={inputCls}
              placeholder="10-digit account number"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Account name</label>
            <input value={form.accountName} onChange={set('accountName')} className={inputCls} placeholder="Name on the account" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              Bank code <span className="normal-case text-slate-400">(optional)</span>
            </label>
            <input value={form.bankCode} onChange={set('bankCode')} className={inputCls} placeholder="e.g. 044" />
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={save}
              disabled={!valid || saving}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
              Save account
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="px-5 py-2.5 text-slate-600 rounded-xl text-sm font-semibold hover:bg-white/40 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : account ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Bank</span>
            <span className="font-semibold text-slate-800">{account.bankName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Account name</span>
            <span className="font-semibold text-slate-800">{account.accountName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Account number</span>
            <span className="font-semibold text-slate-800">{account.maskedAccountNumber}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white/40 border border-white/60 p-4 text-center">
          <p className="text-sm text-slate-500">No payout account yet. Add one so your settlements can be paid.</p>
          <button
            onClick={startEdit}
            className="mt-3 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Add payout account
          </button>
        </div>
      )}
    </motion.div>
  );
}
