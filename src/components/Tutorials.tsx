import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CalendarClock, CalendarDays, CheckCircle2, HelpCircle, Repeat, Sparkles, X } from 'lucide-react';
import type { ViewState } from '../types';
import {
  EMPTY_PROGRESS,
  FREQUENCY_HINT,
  FREQUENCY_LABEL,
  SYSTEM_TOUR,
  markScreenSeen,
  parseProgress,
  progressStorageKey,
  shouldAutoOpenScreen,
  shouldAutoOpenTour,
  tutorialForScreen,
  type ScreenTutorial,
  type TutorialFrequency,
  type TutorialProgress,
} from '../lib/tutorials';

type TutorialContextValue = {
  progress: TutorialProgress;
  openTour: () => void;
  openScreen: (screen: string) => void;
  setAutoShowScreens: (value: boolean) => void;
  reset: () => void;
};

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorials(): TutorialContextValue {
  const ctx = useContext(TutorialContext);
  if (!ctx) throw new Error('useTutorials must be used inside TutorialProvider');
  return ctx;
}

function readProgress(riderId: string): TutorialProgress {
  try {
    return parseProgress(localStorage.getItem(progressStorageKey(riderId)));
  } catch {
    return EMPTY_PROGRESS;
  }
}

function writeProgress(riderId: string, progress: TutorialProgress) {
  try {
    localStorage.setItem(progressStorageKey(riderId), JSON.stringify(progress));
  } catch {
    // Private mode or storage full: tutorials still work, they just are not remembered.
  }
}

const FREQUENCY_STYLE: Record<TutorialFrequency, { className: string; Icon: typeof Repeat }> = {
  once: { className: 'bg-violet-50 text-violet-700 border-violet-200', Icon: CheckCircle2 },
  every_shift: { className: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: Repeat },
  weekly: { className: 'bg-sky-50 text-sky-700 border-sky-200', Icon: CalendarDays },
  as_needed: { className: 'bg-slate-50 text-slate-700 border-slate-200', Icon: CalendarClock },
};

export function FrequencyBadge({ frequency }: { frequency: TutorialFrequency }) {
  const { className, Icon } = FREQUENCY_STYLE[frequency];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {FREQUENCY_LABEL[frequency]}
    </span>
  );
}

function Dialog({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center sm:p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-display font-bold text-xl text-slate-900">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 -m-1 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function ScreenTutorialContent({ tutorial }: { tutorial: ScreenTutorial }) {
  return (
    <div className="space-y-5 text-sm">
      <div>
        <FrequencyBadge frequency={tutorial.frequency} />
        <p className="text-slate-500 mt-2">{FREQUENCY_HINT[tutorial.frequency]}</p>
      </div>
      <section>
        <h4 className="font-semibold text-slate-900 mb-1">Why this screen exists</h4>
        <p className="text-slate-700 leading-relaxed">{tutorial.why}</p>
      </section>
      <section>
        <h4 className="font-semibold text-slate-900 mb-2">How to use it</h4>
        <ol className="space-y-2">
          {tutorial.steps.map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-xs font-bold text-primary-600">
                {i + 1}
              </span>
              <span className="leading-relaxed pt-0.5 text-slate-700">{step}</span>
            </li>
          ))}
        </ol>
      </section>
      {tutorial.tips && tutorial.tips.length > 0 && (
        <section className="rounded-2xl bg-primary-500/5 border border-primary-500/15 p-3">
          <h4 className="font-semibold text-slate-900 mb-1">Tips</h4>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            {tutorial.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TourDialog({ onClose, navigate }: { onClose: () => void; navigate: (view: ViewState) => void }) {
  const [index, setIndex] = useState(0);
  const step = SYSTEM_TOUR[index] ?? SYSTEM_TOUR[0];
  const isLast = index === SYSTEM_TOUR.length - 1;

  return (
    <Dialog title={step.title} subtitle={`Step ${index + 1} of ${SYSTEM_TOUR.length}`} onClose={onClose}>
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-slate-700">{step.body}</p>
        {step.links && (
          <div className="flex flex-wrap gap-2">
            {step.links.map((link) => (
              <button
                key={link.screen}
                onClick={() => {
                  onClose();
                  navigate(link.screen);
                }}
                className="rounded-full border border-primary-500/30 px-3 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-500/10"
              >
                Go to {link.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
          {SYSTEM_TOUR.map((s, i) => (
            <span key={s.id} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-primary-500' : 'w-1.5 bg-slate-300'}`} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
            Skip tour
          </button>
          <div className="flex gap-2">
            {index > 0 && (
              <button onClick={() => setIndex(index - 1)} className="min-h-11 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? onClose() : setIndex(index + 1))}
              className="min-h-11 px-4 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
            >
              {isLast ? 'Start riding' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

/**
 * Owns tutorial progress for the signed-in rider: opens the tour on the first visit,
 * each screen's tutorial on its first visit, and renders the "?" button.
 */
export function TutorialProvider({
  riderId,
  currentView,
  navigate,
  children,
}: {
  riderId: string;
  currentView: ViewState;
  navigate: (view: ViewState) => void;
  children: ReactNode;
}) {
  const [progress, setProgress] = useState<TutorialProgress>(() => readProgress(riderId));
  const [tourOpen, setTourOpen] = useState(false);
  const [screenOpen, setScreenOpen] = useState<string | null>(null);

  const save = useCallback(
    (change: (p: TutorialProgress) => TutorialProgress) => {
      setProgress((prev) => {
        const next = change(prev);
        writeProgress(riderId, next);
        return next;
      });
    },
    [riderId],
  );

  // Decide once per screen change whether to open anything by itself.
  useEffect(() => {
    if (tourOpen || screenOpen) return;
    if (shouldAutoOpenTour(progress, currentView)) {
      setTourOpen(true);
    } else if (tutorialForScreen(currentView) && shouldAutoOpenScreen(progress, currentView)) {
      setScreenOpen(currentView);
    }
    // Only on navigation, not on every progress change.
  }, [currentView]);

  const closeTour = useCallback(() => {
    setTourOpen(false);
    // Finished or skipped both count as done; the tour can be replayed from the Guide.
    save((p) => ({ ...p, tourCompleted: true }));
  }, [save]);

  const closeScreen = useCallback(() => {
    if (screenOpen) save((p) => markScreenSeen(p, screenOpen));
    setScreenOpen(null);
  }, [save, screenOpen]);

  const value = useMemo<TutorialContextValue>(
    () => ({
      openScreen: (screen) => {
        setTourOpen(false);
        setScreenOpen(screen);
      },
      openTour: () => {
        setScreenOpen(null);
        setTourOpen(true);
      },
      progress,
      reset: () => save(() => EMPTY_PROGRESS),
      setAutoShowScreens: (value) => save((p) => ({ ...p, autoShowScreens: value })),
    }),
    [progress, save],
  );

  const current = tutorialForScreen(currentView);
  const open = screenOpen ? tutorialForScreen(screenOpen) : undefined;

  return (
    <TutorialContext.Provider value={value}>
      {children}

      {current && (
        <button
          onClick={() => value.openScreen(current.screen)}
          aria-label={`How the ${current.title} screen works`}
          title={`How the ${current.title} screen works`}
          className="fixed right-4 bottom-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      )}

      {tourOpen && <TourDialog onClose={closeTour} navigate={navigate} />}

      {open && (
        <Dialog title={open.title} onClose={closeScreen}>
          <div className="space-y-5">
            <ScreenTutorialContent tutorial={open} />
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => {
                  closeScreen();
                  navigate('guide');
                }}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600"
              >
                <Sparkles className="w-4 h-4" /> How the whole app works
              </button>
              <button onClick={closeScreen} className="min-h-11 px-5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700">
                Got it
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </TutorialContext.Provider>
  );
}
