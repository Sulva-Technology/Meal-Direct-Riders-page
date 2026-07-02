# Working Memory

## Problem Summary
- Push notifications are delivered via Firebase Cloud Messaging (FCM). The app requests
  browser permission, obtains an FCM registration token, registers it with the backend,
  and handles both background (service worker) and foreground pushes.

## Product Goal
- Let riders opt this device into delivery alerts from Settings and land in Notifications
  when they tap a push notification.

## Stack And Runtime Assumptions
- Vite + React + TypeScript frontend.
- `firebase` (modular SDK) in the app; the background service worker loads firebase
  compat from the gstatic CDN.
- FCM `getToken()` needs the "Web Push certificate" public key (vapidKey), exposed as
  `VITE_WEB_PUSH_PUBLIC_KEY`.
- App access token (`md_access_token`) is the auth used for the device-token endpoints;
  `VITE_API_BASE_URL` already includes `/v1`, so in-app paths omit it.

## Confirmed Facts
- Notification preferences are read/saved through `/notifications/preferences`.
- Existing notification inbox lives at the `notifications` view; TopNav bell shows unread.
- Backend device-token contract (given, treated as fixed):
  `POST /v1/me/device-tokens` body `{ token, platform: "web" }` → 204;
  `DELETE /v1/me/device-tokens/{token}` → 204.

## Active Files
- `src/lib/firebase.ts` (app init + lazy messaging)
- `src/lib/pushNotifications.ts` (readiness, enable/disable, foreground handler)
- `src/lib/endpoints.ts` (`registerDeviceToken`, `deleteDeviceToken`)
- `src/types/api.ts` (`DeviceTokenBody`)
- `src/App.tsx` (foreground onMessage → toast + `md:notifications-updated` event)
- `src/components/TopNav.tsx` (bell refetch on that event)
- `src/lib/auth.tsx` (delete device token on logout before clearing session)
- `public/firebase-messaging-sw.js` (background handler + notificationclick routing)
- `.env.example`, `README.md`, `src/vite-env.d.ts`
- `src/lib/pushNotifications.test.ts`

## Decisions And Tradeoffs
- Replaced the earlier raw Web Push (VAPID) implementation with FCM; deleted `public/sw.js`.
- Reused `VITE_WEB_PUSH_PUBLIC_KEY` as the FCM vapidKey (its value must now be the
  Firebase Web Push certificate key, not the old raw VAPID key).
- `firebaseConfig` is duplicated in `src/lib/firebase.ts` and the service worker (the SW
  can't import from src) — keep the two literals in sync.
- The registered FCM token is cached in localStorage (`md_fcm_token`) so logout/disable
  can DELETE the exact token.

## Remaining Risks And Next Actions
- Set `VITE_WEB_PUSH_PUBLIC_KEY` (FCM Web Push cert key) in each deployment environment.
- If the backend sends `notification`-type payloads, the SW `showNotification` may double
  with FCM's auto-display; prefer data-only messages from the backend.
- Safari/iOS FCM web support is limited; readiness degrades to `unsupported` gracefully.

## Verification
- `npm run lint` passes.
- `npm test` passes (readiness matrix + device-token body).
- `npm run build` passes (Vite chunk-size warning; bundle now includes firebase).
