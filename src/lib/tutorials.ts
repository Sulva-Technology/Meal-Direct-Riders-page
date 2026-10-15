// In-app tutorials for riders: one guided tour of how Meal Direct works end to end,
// and one short tutorial per screen explaining why it exists, how often it is needed,
// and how to use it. Content and pure rules only, so it runs in plain Node tests.

import type { ViewState } from '../types';

/** How often a rider needs a screen. Drives the badge on every tutorial. */
export type TutorialFrequency = 'once' | 'every_shift' | 'weekly' | 'as_needed';

export const FREQUENCY_LABEL: Record<TutorialFrequency, string> = {
  once: 'Do once',
  every_shift: 'Every shift',
  weekly: 'Weekly',
  as_needed: 'When needed',
};

export const FREQUENCY_HINT: Record<TutorialFrequency, string> = {
  once: 'Set this up once when you join. Come back only if something changes.',
  every_shift: 'Part of every delivery shift.',
  weekly: 'Check this about once a week.',
  as_needed: 'Open this only when you need it.',
};

/** Screens that have a tutorial. The guide itself is not a ViewState screen. */
export type TutorialScreen = Exclude<ViewState, 'login'>;

export type ScreenTutorial = {
  screen: TutorialScreen;
  title: string;
  frequency: TutorialFrequency;
  why: string;
  steps: string[];
  tips?: string[];
};

export const SCREEN_TUTORIALS: ScreenTutorial[] = [
  {
    screen: 'dashboard',
    title: 'Dashboard',
    frequency: 'every_shift',
    why: 'Your home screen and where your shift starts. It shows whether you are online, your active batches, and today\'s numbers.',
    steps: [
      'Switch yourself Online when you are ready to work. Only online riders get new deliveries.',
      'Check your active batches: each one is a vendor pickup with one or more orders inside.',
      'Switch Offline when your shift ends so you are not sent work you cannot take.',
    ],
    tips: ['The Online switch is also at the top of every screen.'],
  },
  {
    screen: 'pickup_queue',
    title: 'Pickup Queue',
    frequency: 'every_shift',
    why: 'New work arrives here. A batch is a group of orders from one vendor going to the same area, so you collect them in one trip.',
    steps: [
      'Tap "Accept batch" to take it. If you cannot do it, decline it from Assigned Orders so another rider gets it quickly.',
      'Go to the vendor. Each order in the batch shows Ready or Not ready.',
      'When you get there tap "Mark arrived", collect every order in the batch, then tap "Confirm pickup".',
    ],
    tips: ['Accept or decline fast. A batch waiting on you is food getting cold.'],
  },
  {
    screen: 'assigned_orders',
    title: 'Assigned Orders',
    frequency: 'every_shift',
    why: 'Each order you are carrying, step by step, from leaving the vendor to the customer\'s hands. This is where a delivery is completed.',
    steps: [
      'Tap "Start delivery" when you leave the vendor. You will be asked if the food was ready when you arrived: answer honestly, it decides the vendor\'s readiness bonus.',
      'Use the map link to find the delivery point, then tap "Mark arrived" when you get there.',
      'Ask the customer for their 4-digit code and enter it with "Confirm delivery by code". The order is done only after the code is accepted.',
      'If something goes wrong (customer not reachable, wrong location, damaged food), use "Report issue" on that order.',
    ],
    tips: ['Never hand over food without the code. The code is your proof of delivery.'],
  },
  {
    screen: 'route_planner',
    title: 'Route Planner',
    frequency: 'as_needed',
    why: 'Your stops in order for the work you are carrying: pickups first, then each drop-off, so you take the shortest path.',
    steps: [
      'Open it after accepting a batch to see how many stops you have.',
      'Follow the stops from top to bottom.',
    ],
  },
  {
    screen: 'delivery_zones',
    title: 'Delivery Zones',
    frequency: 'as_needed',
    why: 'The campus areas your current deliveries go to, with how many orders and vendors are in each. Useful when you are new to the campus.',
    steps: ['Check which zones your batches cover before you set off.'],
  },
  {
    screen: 'earnings',
    title: 'Earnings',
    frequency: 'weekly',
    why: 'How much you have earned from completed deliveries, what has been paid, and what is still pending.',
    steps: [
      'Pick a date range to see the deliveries and money in it.',
      'An order counts once it is delivered and confirmed.',
      'Tap "View all" to open your settlements.',
    ],
  },
  {
    screen: 'payout',
    title: 'Settlements & bank account',
    frequency: 'once',
    why: 'Where you add the bank account Meal Direct pays you into, and see each payout and its breakdown.',
    steps: [
      'Add your bank account once. It is checked before your first payout.',
      'Open a settlement to see the earnings, adjustments, and the amount payable.',
    ],
    tips: ['Without a verified bank account your earnings cannot be paid out.'],
  },
  {
    screen: 'performance',
    title: 'Performance',
    frequency: 'weekly',
    why: 'How reliable you are: completed and cancelled deliveries and your delivery efficiency. Better performance means more work.',
    steps: [
      'Look at it weekly.',
      'If cancellations are high, accept only batches you can finish.',
    ],
  },
  {
    screen: 'notifications',
    title: 'Notifications',
    frequency: 'as_needed',
    why: 'Alerts about new assignments, pickups, and payouts in one list.',
    steps: [
      'The bell at the top shows unread alerts.',
      'Turn on push notifications in Settings so new work reaches your phone even when the app is closed.',
    ],
  },
  {
    screen: 'support',
    title: 'Support',
    frequency: 'as_needed',
    why: 'How to reach the Meal Direct operations team when something goes wrong that you cannot fix in the app.',
    steps: [
      'For a problem with one order, use "Report issue" on that order first: it reaches the team with the order details.',
      'Use the contacts here for anything else, such as account or payment questions.',
    ],
  },
  {
    screen: 'profile',
    title: 'My Profile',
    frequency: 'once',
    why: 'Your name and phone number. Vendors and the operations team use them to identify and reach you.',
    steps: [
      'Check your display name and phone number when you join.',
      'Update them only if they change.',
    ],
  },
  {
    screen: 'settings',
    title: 'Settings',
    frequency: 'once',
    why: 'How the app notifies you, and signing out of this device.',
    steps: [
      'Turn on push notifications on the phone you ride with, so new deliveries reach you.',
      'Sign out if you hand this phone to someone else.',
    ],
  },
  {
    screen: 'guide',
    title: 'Guide',
    frequency: 'as_needed',
    why: 'Your map of the whole app: the tour, a setup checklist that ticks itself off, and a tutorial for every screen.',
    steps: [
      'Finish every item in "Your one-time setup".',
      'Replay the tour any time you need a refresher.',
      'Tap any screen card to read why it exists and how to use it.',
    ],
  },
];

export type TourStep = {
  id: string;
  title: string;
  body: string;
  links?: { label: string; screen: TutorialScreen }[];
};

/** The guided tour of the whole system, shown on a rider's first visit. */
export const SYSTEM_TOUR: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Meal Direct',
    body: 'Students order food from campus vendors and pay online. You collect the food from vendors and deliver it to students, and you are paid for every completed delivery. This short tour shows how the app works. It takes about two minutes.',
  },
  {
    id: 'verified',
    title: 'Get verified first',
    body: 'New rider accounts are checked by the Meal Direct team before they can receive deliveries. Until you are verified, set up your profile, bank account and notifications so you are ready the moment you are approved.',
  },
  {
    id: 'setup',
    title: 'Set up once',
    body: 'Do these one time: check your name and phone in Profile, add your bank account under Settlements, and turn on push notifications in Settings. After that you only come back if something changes.',
    links: [
      { label: 'Profile', screen: 'profile' },
      { label: 'Bank account', screen: 'payout' },
      { label: 'Settings', screen: 'settings' },
    ],
  },
  {
    id: 'shift',
    title: 'Every shift',
    body: '1. Go Online. 2. Accept a batch in Pickup Queue. 3. At the vendor tap "Mark arrived", collect every order, and tap "Confirm pickup". 4. In Assigned Orders, tap "Start delivery", "Mark arrived" at the customer, and confirm with the customer\'s 4-digit code. 5. Go Offline when you finish.',
    links: [
      { label: 'Pickup Queue', screen: 'pickup_queue' },
      { label: 'Assigned Orders', screen: 'assigned_orders' },
    ],
  },
  {
    id: 'code',
    title: 'The code is your proof',
    body: 'Every order has a 4-digit code that only the customer has. Never hand over food without entering it. If the customer is unreachable or something is wrong, use "Report issue" on the order instead of guessing.',
  },
  {
    id: 'money',
    title: 'Getting paid',
    body: 'Each delivered and confirmed order adds to your earnings. Check Earnings about once a week, and your settlements show each payout and its breakdown.',
    links: [{ label: 'Earnings', screen: 'earnings' }],
  },
  {
    id: 'help',
    title: 'Help is on every screen',
    body: 'Tap the "?" button on any screen to learn why it exists and how to use it. The Guide in the menu has your setup checklist and this tour, any time you want it.',
  },
];

export function tutorialForScreen(screen: string): ScreenTutorial | undefined {
  return SCREEN_TUTORIALS.find((tutorial) => tutorial.screen === screen);
}

export function tutorialsByFrequency(): Record<TutorialFrequency, ScreenTutorial[]> {
  const groups: Record<TutorialFrequency, ScreenTutorial[]> = {
    once: [],
    every_shift: [],
    weekly: [],
    as_needed: [],
  };
  for (const tutorial of SCREEN_TUTORIALS) groups[tutorial.frequency].push(tutorial);
  return groups;
}

// ---------------------------------------------------------------------------
// Progress rules
// ---------------------------------------------------------------------------

export type TutorialProgress = {
  tourCompleted: boolean;
  seenScreens: string[];
  autoShowScreens: boolean;
};

export const EMPTY_PROGRESS: TutorialProgress = {
  tourCompleted: false,
  seenScreens: [],
  autoShowScreens: true,
};

/** The tour opens by itself once, on the dashboard, for a rider who has not seen it. */
export function shouldAutoOpenTour(progress: TutorialProgress, screen: string): boolean {
  return !progress.tourCompleted && screen === 'dashboard';
}

/** A screen tutorial opens on its first visit, never on top of the tour, unless turned off. */
export function shouldAutoOpenScreen(progress: TutorialProgress, screen: string): boolean {
  return progress.tourCompleted && progress.autoShowScreens && !progress.seenScreens.includes(screen);
}

export function markScreenSeen(progress: TutorialProgress, screen: string): TutorialProgress {
  return progress.seenScreens.includes(screen)
    ? progress
    : { ...progress, seenScreens: [...progress.seenScreens, screen] };
}

const STORAGE_PREFIX = 'md_rider_tutorials:';

/** Parse stored progress defensively: a corrupt or old value falls back to a fresh start. */
export function parseProgress(raw: string | null): TutorialProgress {
  if (!raw) return EMPTY_PROGRESS;
  try {
    const value = JSON.parse(raw) as Partial<TutorialProgress>;
    return {
      autoShowScreens: value.autoShowScreens !== false,
      seenScreens: Array.isArray(value.seenScreens)
        ? value.seenScreens.filter((s): s is string => typeof s === 'string')
        : [],
      tourCompleted: value.tourCompleted === true,
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function progressStorageKey(riderId: string): string {
  return `${STORAGE_PREFIX}${riderId}`;
}

// ---------------------------------------------------------------------------
// One-time setup checklist
// ---------------------------------------------------------------------------

export type SetupItem = {
  id: 'verified' | 'profile' | 'payout' | 'push';
  label: string;
  hint: string;
  screen: TutorialScreen;
  done: boolean;
  /** Done by the Meal Direct team, not the rider. */
  waitingOnTeam?: boolean;
};

export function setupChecklist(input: {
  status: string;
  hasName: boolean;
  hasPhone: boolean;
  hasPayoutAccount: boolean;
  pushEnabled: boolean;
}): SetupItem[] {
  return [
    {
      done: input.status === 'verified',
      hint:
        input.status === 'verified'
          ? 'You can receive deliveries.'
          : input.status === 'pending'
            ? 'The Meal Direct team is checking your account. Nothing to do but wait.'
            : 'Your account is not active. Contact support.',
      id: 'verified',
      label: 'Get verified by Meal Direct',
      screen: input.status === 'pending' || input.status === 'verified' ? 'dashboard' : 'support',
      waitingOnTeam: input.status === 'pending',
    },
    {
      done: input.hasName && input.hasPhone,
      hint: 'Your name and phone number so vendors and the team can reach you.',
      id: 'profile',
      label: 'Check your profile',
      screen: 'profile',
    },
    {
      done: input.hasPayoutAccount,
      hint: 'The bank account your earnings are paid into.',
      id: 'payout',
      label: 'Add your bank account',
      screen: 'payout',
    },
    {
      done: input.pushEnabled,
      hint: 'So new deliveries reach your phone even when the app is closed.',
      id: 'push',
      label: 'Turn on push notifications',
      screen: 'settings',
    },
  ];
}
