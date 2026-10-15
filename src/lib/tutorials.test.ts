import assert from 'node:assert/strict';
import {
  EMPTY_PROGRESS,
  SCREEN_TUTORIALS,
  SYSTEM_TOUR,
  markScreenSeen,
  parseProgress,
  setupChecklist,
  shouldAutoOpenScreen,
  shouldAutoOpenTour,
  tutorialForScreen,
  tutorialsByFrequency,
  type TutorialScreen,
} from './tutorials';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

// Exhaustive over every screen: adding a ViewState without listing it here fails tsc.
const ALL_SCREENS: Record<TutorialScreen, true> = {
  assigned_orders: true,
  dashboard: true,
  delivery_zones: true,
  earnings: true,
  guide: true,
  notifications: true,
  payout: true,
  performance: true,
  pickup_queue: true,
  profile: true,
  route_planner: true,
  settings: true,
  support: true,
};

test('every screen has exactly one tutorial', () => {
  for (const screen of Object.keys(ALL_SCREENS)) {
    assert.ok(tutorialForScreen(screen), `missing tutorial for ${screen}`);
  }
  assert.equal(SCREEN_TUTORIALS.length, Object.keys(ALL_SCREENS).length);
});

test('every tutorial explains why and how', () => {
  for (const t of SCREEN_TUTORIALS) {
    assert.ok(t.why.length > 40, t.screen);
    assert.ok(t.steps.length > 0, t.screen);
  }
});

test('one-time screens are profile, bank account, and settings', () => {
  assert.deepEqual(tutorialsByFrequency().once.map((t) => t.screen).sort(), ['payout', 'profile', 'settings']);
  assert.deepEqual(tutorialsByFrequency().every_shift.map((t) => t.screen).sort(), [
    'assigned_orders',
    'dashboard',
    'pickup_queue',
  ]);
});

test('tour links only point at real screens', () => {
  for (const step of SYSTEM_TOUR) {
    for (const link of step.links ?? []) assert.ok(link.screen in ALL_SCREENS, link.screen);
  }
});

test('tour opens once on the dashboard; screen tutorials after it, once each', () => {
  assert.equal(shouldAutoOpenTour(EMPTY_PROGRESS, 'dashboard'), true);
  assert.equal(shouldAutoOpenTour(EMPTY_PROGRESS, 'earnings'), false);
  assert.equal(shouldAutoOpenScreen(EMPTY_PROGRESS, 'earnings'), false);

  const afterTour = { ...EMPTY_PROGRESS, tourCompleted: true };
  assert.equal(shouldAutoOpenTour(afterTour, 'dashboard'), false);
  assert.equal(shouldAutoOpenScreen(afterTour, 'earnings'), true);
  assert.equal(shouldAutoOpenScreen(markScreenSeen(afterTour, 'earnings'), 'earnings'), false);
  assert.equal(shouldAutoOpenScreen({ ...afterTour, autoShowScreens: false }, 'earnings'), false);
  assert.deepEqual(markScreenSeen(markScreenSeen(afterTour, 'x'), 'x').seenScreens, ['x']);
});

test('stored progress is parsed defensively', () => {
  assert.deepEqual(parseProgress(null), EMPTY_PROGRESS);
  assert.deepEqual(parseProgress('not json'), EMPTY_PROGRESS);
  assert.deepEqual(parseProgress('{"tourCompleted":true,"seenScreens":["dashboard",5]}'), {
    autoShowScreens: true,
    seenScreens: ['dashboard'],
    tourCompleted: true,
  });
});

test('setup checklist reflects real state, and verification waits on the team', () => {
  const pending = setupChecklist({ hasName: true, hasPayoutAccount: false, hasPhone: true, pushEnabled: false, status: 'pending' });
  assert.deepEqual(pending.map((i) => [i.id, i.done]), [
    ['verified', false],
    ['profile', true],
    ['payout', false],
    ['push', false],
  ]);
  assert.equal(pending[0]?.waitingOnTeam, true);

  const suspended = setupChecklist({ hasName: true, hasPayoutAccount: true, hasPhone: false, pushEnabled: true, status: 'suspended' });
  assert.equal(suspended[0]?.screen, 'support');
  assert.equal(suspended[1]?.done, false);
});
