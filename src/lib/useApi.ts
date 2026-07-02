import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './api';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
}

interface UseApiOptions {
  /** Poll the loader on this interval (ms) while mounted. Paused when the tab is hidden. */
  pollMs?: number;
  /** Window event names that trigger a background refetch (e.g. a foreground push). */
  refreshOn?: string[];
}

/** Run an async loader on mount (and whenever deps change). Provides reload().
 *  Optionally polls and/or refetches on window events without flashing the loader. */
export function useApi<T>(loader: () => Promise<T>, deps: unknown[] = [], options: UseApiOptions = {}): QueryState<T> {
  const { pollMs, refreshOn } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    run()
      .then((res) => {
        if (alive) setData(res);
      })
      .catch((e) => {
        if (alive) setError(e instanceof ApiError ? e : new ApiError(0, 'UNKNOWN', String(e)));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  // Background refetch: swap data in place without toggling `loading`, so a poll or a
  // push-triggered refresh never flashes the spinner over live content.
  const refreshQuietly = useCallback(() => {
    let alive = true;
    run()
      .then((res) => {
        if (alive) {
          setData(res);
          setError(null);
        }
      })
      .catch(() => {
        /* keep the last good data; a manual reload() surfaces errors */
      });
    return () => {
      alive = false;
    };
  }, [run]);

  // Polling (paused while the tab is hidden to avoid pointless background traffic).
  useEffect(() => {
    if (!pollMs) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshQuietly();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, refreshQuietly]);

  // Event-driven refresh (e.g. a foreground push signalling new work).
  useEffect(() => {
    if (!refreshOn?.length) return;
    const handler = () => refreshQuietly();
    for (const name of refreshOn) window.addEventListener(name, handler);
    return () => {
      for (const name of refreshOn) window.removeEventListener(name, handler);
    };
  }, [refreshOn, refreshQuietly]);

  return { data, loading, error, reload };
}

/** Imperative mutation helper with pending state. */
export function useMutation<TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>) {
  const [pending, setPending] = useState(false);
  const run = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      setPending(true);
      try {
        return await fn(...args);
      } finally {
        setPending(false);
      }
    },
    [fn],
  );
  return { run, pending };
}
