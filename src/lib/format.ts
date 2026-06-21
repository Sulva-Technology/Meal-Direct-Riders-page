// Money is integer kobo (1 NGN = 100 kobo) everywhere in the API.

const nairaFmt = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format integer kobo as Naira, e.g. 48250 -> "₦482.50". */
export function formatKobo(kobo: number | null | undefined): string {
  const value = (kobo ?? 0) / 100;
  return nairaFmt.format(value);
}

/** Compact Naira without decimals, e.g. 139000 -> "₦1,390". */
export function formatKoboCompact(kobo: number | null | undefined): string {
  const value = Math.round((kobo ?? 0) / 100);
  return '₦' + value.toLocaleString('en-NG');
}

export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
}

/** Today's date as YYYY-MM-DD (used for the assignments `date` filter). */
export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Turn snake_case / lower statuses into Title Case labels. */
export function humanize(value?: string | null): string {
  if (!value) return '';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
