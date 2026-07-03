import { useCallback, useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Clock3, Landmark, Loader2, Pencil, ShieldCheck } from 'lucide-react';
import { ApiError } from '../lib/api';
import { useApi } from '../lib/useApi';
import { getRiderPayoutAccount, updateRiderPayoutAccount } from '../lib/endpoints';
import { formatDate, humanize } from '../lib/format';
import type { RiderPayoutAccount } from '../types/api';
import type { ToastType } from './Toast';

interface Props {
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

type LoadResult =
  | { apiAvailable: true; account: RiderPayoutAccount | null }
  | { apiAvailable: false; account: null; message: string };

const emptyForm = { bankName: '', accountNumber: '', accountName: '', bankCode: '' };

export function PayoutAccountCard({ showNotification }: Props) {
  const load = useCallback(async (): Promise<LoadResult> => {
    try {
      return { apiAvailable: true, account: await getRiderPayoutAccount() };
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 405 || e.code === 'NOT_FOUND')) {
        return {
          apiAvailable: false,
          account: null,
          message: 'Rider payout-account API is not available yet. Manual payout mode is active.',
        };
      }
      throw e;
    }
  }, []);

  const { data, loading, error, reload } = useApi(load, []);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const account = data?.account ?? null;
  const apiAvailable = data?.apiAvailable ?? true;
  const apiUnavailableMessage = data?.apiAvailable === false ? data.message : '';
  const payoutMode = account?.payoutMode ?? 'manual';
  const verification = account?.verificationStatus ?? (account?.status === 'verified' ? 'verified' : account ? 'pending' : 'pending');

  const validation = useMemo(() => {
    const errors: string[] = [];
    if (!form.bankName.trim()) errors.push('Bank is required.');
    if (!/^[0-9]{10}$/.test(form.accountNumber.trim())) errors.push('Account number must be 10 digits.');
    if (!form.accountName.trim()) errors.push('Account name is required.');
    return errors;
  }, [form]);

  const set = (key: keyof typeof emptyForm) => (e: ChangeEvent<HTMLInputElement>) =>
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

  const save = async () => {
    if (validation.length || saving || !apiAvailable) return;
    setSaving(true);
    try {
      await updateRiderPayoutAccount({
        bankName: form.bankName.trim(),
        accountName: form.accountName.trim(),
        accountNumber: form.accountNumber.trim(),
        bankCode: form.bankCode.trim() || undefined,
      });
      showNotification('Payout account saved', 'Your payout account is saved for operations review.', 'success');
      setEditing(false);
      reload();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'Could not save payout account.';
      showNotification('Save failed', msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full bg-white/70 border border-white/80 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/50 font-medium text-slate-800';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary-500" /> Payout account
          </h3>
          <p className="text-sm text-slate-500 mt-1">Payouts are processed according to Meal Direct's payout schedule.</p>
        </div>
        {!editing && !loading && (
          <button onClick={startEdit} className="min-h-10 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700">
            <Pencil className="w-3.5 h-3.5" /> {account ? 'Edit' : 'Add'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{error.message}</p>
      ) : (
        <div className="space-y-4">
          {!apiAvailable && (
            <div className="rounded-2xl bg-warning/10 border border-warning/20 p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">API unavailable</p>
                <p className="text-sm text-slate-600">{apiUnavailableMessage}</p>
                <p className="text-xs text-slate-500 mt-1">Support: operations@mealdirectly.com</p>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3">
            <StatusTile icon={<Clock3 className="w-4 h-4" />} label="Payout mode" value={apiAvailable ? humanize(payoutMode) : 'Manual payout active'} />
            <StatusTile icon={<ShieldCheck className="w-4 h-4" />} label="Verification" value={apiAvailable ? humanize(verification) : 'Admin review required'} />
            <StatusTile icon={<CheckCircle2 className="w-4 h-4" />} label="Status" value={account ? humanize(account.status ?? 'pending_verification') : apiAvailable ? 'No payout account' : 'API unavailable'} />
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Bank</label>
                <input value={form.bankName} onChange={set('bankName')} disabled={!apiAvailable} className={inputCls} placeholder="e.g. Access Bank" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Account number</label>
                <input value={form.accountNumber} onChange={set('accountNumber')} disabled={!apiAvailable} inputMode="numeric" className={inputCls} placeholder="10-digit account number" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Account name</label>
                <input value={form.accountName} onChange={set('accountName')} disabled={!apiAvailable} className={inputCls} placeholder="Name on account" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Bank code <span className="normal-case text-slate-400">(optional)</span></label>
                <input value={form.bankCode} onChange={set('bankCode')} disabled={!apiAvailable} className={inputCls} placeholder="e.g. 044" />
              </div>
              {validation.length > 0 && apiAvailable && (
                <div className="rounded-xl bg-danger/10 border border-danger/15 p-3 text-sm text-danger space-y-1">
                  {validation.map((v) => <p key={v}>{v}</p>)}
                </div>
              )}
              {!apiAvailable && <p className="text-sm text-slate-500">Account submission waits for rider payout-account backend. No backend success is faked.</p>}
              <div className="flex items-center gap-3 pt-1">
                <button onClick={save} disabled={validation.length > 0 || saving || !apiAvailable} className="min-h-11 px-5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
                  Submit for review
                </button>
                <button onClick={() => setEditing(false)} disabled={saving} className="min-h-11 px-5 text-slate-600 rounded-xl text-sm font-semibold hover:bg-white/50">
                  Cancel
                </button>
              </div>
            </div>
          ) : account ? (
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Field label="Bank name" value={account.bankName} />
              <Field label="Account name" value={account.accountName} />
              <Field label="Account number" value={account.maskedAccountNumber} />
              <Field label="Last updated" value={formatDate(account.updatedAt)} />
            </div>
          ) : (
            <div className="rounded-2xl bg-white/50 border border-white/70 p-4 text-center">
              <p className="text-sm text-slate-500">{apiAvailable ? 'No payout account saved yet.' : 'Manual payout is active until the payout API is available.'}</p>
              <button onClick={startEdit} className="mt-3 min-h-11 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold">
                Add payout account
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function StatusTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/55 border border-white/70 p-3">
      <p className="text-xs text-slate-500 font-semibold uppercase flex items-center gap-1.5">{icon}{label}</p>
      <p className="font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/55 border border-white/70 p-3">
      <p className="text-xs text-slate-500 font-semibold uppercase">{label}</p>
      <p className="font-semibold text-slate-900 break-words">{value || 'Not provided'}</p>
    </div>
  );
}
