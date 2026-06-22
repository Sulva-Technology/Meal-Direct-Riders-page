# Rider Onboarding — Design

Date: 2026-06-22

## Problem

After a rider signs up and confirms their email, they have a Supabase/auth
session but **no rider profile** in the backend. `GET /rider/profile` returns
`404 NOT_FOUND ("Rider profile was not found.")`. The current bootstrap treats
that as a dead session and force-logs-out, kicking a valid, confirmed rider back
to the login screen. There is no path to create the rider profile.

The backend already supports onboarding via `POST /v1/me/complete-onboarding`.

## Backend contract

- `GET /v1/campuses` → `{ data: CampusRecordDto[] }` — `{ id, name, slug, active, ... }`
- `GET /v1/campuses/{campusId}/locations` → `{ data: CampusLocationRecordDto[] }`
  — `{ id, campusId, name, type: 'department'|'hostel', zoneName, active, displayOrder, ... }`
- `POST /v1/me/complete-onboarding` body `{ defaultCampusId, defaultLocationId, phoneNumber }`
  (all required; phone example `+2348012345678`) → profile envelope.

## Approach

Add a dedicated `onboarding` auth status so every entry point (email-confirm
callback, login, returning-session bootstrap) routes a profile-less rider to a
single onboarding screen. One helper owns the NOT_FOUND → onboarding decision.

## Changes

### Types — `src/types/api.ts`
- `CampusRecord { id, name, slug, active }`
- `CampusLocation { id, campusId, name, type, zoneName, active, displayOrder }`
- `CompleteOnboardingBody { defaultCampusId, defaultLocationId, phoneNumber }`

### Endpoints — `src/lib/endpoints.ts`
- `listCampuses()` → `apiList<CampusRecord>('/campuses')`
- `listCampusLocations(campusId)` → `apiList<CampusLocation>('/campuses/${campusId}/locations')`
- `completeOnboarding(body)` → `apiRequest<RiderProfile>('/me/complete-onboarding', { method: 'POST', body })`

### Auth — `src/lib/auth.tsx`
- Status enum: `loading | authenticated | onboarding | unauthenticated`.
- `loadProfileOrOnboard()`: `getRiderProfile()` → `authenticated`; on `ApiError`
  with `status === 404 || code === 'NOT_FOUND'` → `onboarding`; any other error → `finishLogout()`.
- Bootstrap and `afterAuth` (covers login + callback) both go through it, so
  `login()` no longer throws for a not-yet-onboarded rider.
- New context method `completeOnboarding(body)`: POST, then reload via
  `getRiderProfile`. If the reload still 404s, refresh the session token once and
  retry (mirrors the vendor `tokenRefreshRequired` pattern), then `authenticated`.

### View — `src/views/OnboardingView.tsx`
Mirrors `LoginView` glass styling.
- Load active campuses on mount → campus `<select>`.
- On campus change → load that campus's active locations (sorted by `displayOrder`)
  → location `<select>` (label `name` + `zoneName`).
- Phone input (placeholder `+234...`).
- Submit → `completeOnboarding` → dashboard. Loading + inline error states.
- "Sign out" escape hatch.

### App — `src/App.tsx`
`status === 'onboarding'` renders `OnboardingView` (parallel to the
`unauthenticated` → `LoginView` branch).

## Error handling
- Campus/location load failure → inline message + retry.
- Submit failure → toast using the existing sanitized `ApiError.message`.

## Out of scope
- Editing campus/location after onboarding (Profile/Settings already exist for later).
- Collecting phone at signup (single source: onboarding).
