# Working Memory

## Problem Summary
- Push notifications existed only as a saved `pushEnabled` preference; the app did not request browser permission, create a Push API subscription, register it with the backend, or handle push payloads.

## Product Goal
- Let riders opt this device into delivery alerts from Settings and land in Notifications when they tap a push notification.

## Stack And Runtime Assumptions
- Vite + React + TypeScript frontend.
- Browser Push API requires service workers, notification permission, and a public VAPID key exposed as `VITE_WEB_PUSH_PUBLIC_KEY`.

## Confirmed Facts
- Notification preferences are read and saved through `/notifications/preferences`.
- Existing notification inbox lives at the `notifications` view.
- API docs timed out from this environment, so the new subscription endpoint path is an implementation assumption.

## Active Files
- `src/lib/pushNotifications.ts`
- `src/lib/endpoints.ts`
- `src/types/api.ts`
- `src/views/SettingsView.tsx`
- `src/App.tsx`
- `public/sw.js`
- `.env.example`
- `src/vite-env.d.ts`
- `src/lib/pushNotifications.test.ts`

## Decisions And Tradeoffs
- Added conventional subscription endpoints at `/notifications/push-subscriptions` for `POST` register and `DELETE` unregister.
- Settings only saves `pushEnabled=true` after browser permission and backend subscription registration succeed.
- Settings allows disabling push even if current deployment/browser readiness is incomplete.

## API Contracts
- Register body: `{ subscription: { endpoint, expirationTime, keys }, userAgent }`.
- Unregister body: `{ endpoint }`.

## Remaining Risks And Next Actions
- Confirm the backend subscription endpoint path and payload shape against the live API when docs are reachable.
- Configure `VITE_WEB_PUSH_PUBLIC_KEY` in each deployment environment.

## Verification
- `npm test` passes.
- `npm run lint` passes.
- `npm run build` passes with Vite's chunk-size warning.
- Dev server started successfully at `http://localhost:3000` and returned HTTP 200.
