import { useSyncExternalStore } from 'react';
import { CheckCircle2, ChevronRight, Circle, Hourglass, PlayCircle } from 'lucide-react';
import type { ViewState } from '../types';
import type { ToastType } from '../components/Toast';
import { useAuth } from '../lib/auth';
import { useApi } from '../lib/useApi';
import { getRiderPayoutAccount } from '../lib/endpoints';
import { FrequencyBadge, useTutorials } from '../components/Tutorials';
import {
  FREQUENCY_HINT,
  FREQUENCY_LABEL,
  setupChecklist,
  tutorialsByFrequency,
  type TutorialFrequency,
} from '../lib/tutorials';

interface GuideViewProps {
  navigate: (view: ViewState) => void;
  showNotification: (title: string, message: string, type?: ToastType) => void;
}

const GROUP_ORDER: TutorialFrequency[] = ['once', 'every_shift', 'weekly', 'as_needed'];

const noSubscription = () => () => {};

function usePushEnabled(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => typeof Notification !== 'undefined' && Notification.permission === 'granted',
    () => false,
  );
}

export function GuideView({ navigate }: GuideViewProps) {
  const { profile } = useAuth();
  const tutorials = useTutorials();
  const pushEnabled = usePushEnabled();
  // A missing payout account (or the endpoint not being live yet) both mean "not added".
  const payout = useApi(() => getRiderPayoutAccount().catch(() => null), []);

  const checklist = setupChecklist({
    hasName: Boolean(profile?.displayName?.trim()),
    hasPayoutAccount: Boolean(payout.data),
    hasPhone: Boolean(profile?.phone?.trim()),
    pushEnabled,
    status: profile?.status ?? 'pending',
  });
  const doneCount = checklist.filter((item) => item.done).length;
  const groups = tutorialsByFrequency();

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">Guide</h2>
        <p className="text-slate-500 font-medium">How Meal Direct works, what to set up once, and what to do every shift.</p>
      </div>

      <section className="glass-panel rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-display font-bold text-lg text-slate-900">How the whole app works</h3>
          <p className="text-sm text-slate-500 mt-1">A two-minute tour: from going online to getting paid.</p>
        </div>
        <button
          onClick={tutorials.openTour}
          className="min-h-11 inline-flex items-center justify-center gap-2 px-5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
        >
          <PlayCircle className="w-5 h-5" />
          {tutorials.progress.tourCompleted ? 'Replay the tour' : 'Start the tour'}
        </button>
      </section>

      <section className="glass-panel rounded-3xl p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-lg text-slate-900">Your one-time setup</h3>
            <p className="text-sm text-slate-500 mt-1">Do these once. They tick themselves off as you finish them.</p>
          </div>
          {!payout.loading && (
            <span className="shrink-0 rounded-full bg-primary-500/10 px-3 py-1 text-sm font-bold text-primary-600">
              {doneCount}/{checklist.length}
            </span>
          )}
        </div>
        <ul className="mt-4 divide-y divide-slate-100">
          {checklist.map((item) => (
            <li key={item.id}>
              <button onClick={() => navigate(item.screen)} className="w-full flex items-center gap-3 py-3 text-left group">
                {item.done ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-success" aria-label="Done" />
                ) : item.waitingOnTeam ? (
                  <Hourglass className="w-5 h-5 shrink-0 text-warning" aria-label="Waiting on the Meal Direct team" />
                ) : (
                  <Circle className="w-5 h-5 shrink-0 text-slate-300" aria-label="Not done yet" />
                )}
                <span className="flex-1 min-w-0">
                  <span className={`block text-sm font-semibold ${item.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{item.label}</span>
                  <span className="block text-xs text-slate-500">{item.hint}</span>
                </span>
                <ChevronRight className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-primary-600" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-5">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-900">Every screen, and why it exists</h3>
          <p className="text-sm text-slate-500 mt-1">Tap a screen for its full tutorial, or tap the ? button on any screen.</p>
        </div>
        {GROUP_ORDER.map((frequency) => {
          const screens = groups[frequency].filter((t) => t.screen !== 'guide');
          if (screens.length === 0) return null;
          return (
            <div key={frequency}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <FrequencyBadge frequency={frequency} />
                <span className="text-xs text-slate-500">{FREQUENCY_HINT[frequency]}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {screens.map((t) => (
                  <button
                    key={t.screen}
                    onClick={() => tutorials.openScreen(t.screen)}
                    aria-label={`${t.title}: ${FREQUENCY_LABEL[t.frequency]}. Open tutorial`}
                    className="glass-panel rounded-2xl p-4 text-left hover:ring-2 hover:ring-primary-500/30 transition-all"
                  >
                    <span className="block font-semibold text-slate-900">{t.title}</span>
                    <span className="block text-sm text-slate-500 mt-1 line-clamp-3">{t.why}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="glass-panel rounded-3xl p-5 space-y-3">
        <h3 className="font-display font-bold text-lg text-slate-900">Tutorial settings</h3>
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={tutorials.progress.autoShowScreens}
            onChange={(e) => tutorials.setAutoShowScreens(e.target.checked)}
            className="w-4 h-4 accent-primary-600"
          />
          Show each screen&apos;s tutorial the first time I open it
        </label>
        <button onClick={tutorials.reset} className="text-sm font-semibold text-primary-600">
          Show all tutorials again from the start
        </button>
      </section>
    </div>
  );
}
