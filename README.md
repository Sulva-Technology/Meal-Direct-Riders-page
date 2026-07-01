# Meal Direct — Rider App

Delivery rider client for Meal Direct scheduled campus meal batch deliveries.
React + Vite + Tailwind, wired to the Meal Direct backend API.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Configure the backend URL — copy `.env.example` to `.env.local` and set:
   `VITE_API_BASE_URL="https://mealdirectbackend.onrender.com/v1"`
   `VITE_WEB_PUSH_PUBLIC_KEY="<your public VAPID key>"`
3. Run the app:
   `npm run dev`

## Scripts

- `npm run dev` — start the dev server (port 3000)
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — TypeScript type check (`tsc --noEmit`)

## Architecture

- `src/lib/api.ts` — fetch client: bearer auth, token refresh on 401, idempotency keys, envelope unwrapping.
- `src/lib/endpoints.ts` — typed wrappers for each rider/auth/notification endpoint.
- `src/lib/auth.tsx` — auth context (login, signup, logout, availability) + session bootstrap.
- `src/lib/useApi.ts` — `useApi` (load + reload) and `useMutation` hooks.
- `src/types/api.ts` — TypeScript shapes mirroring the backend OpenAPI DTOs.
- `src/views/*` — screens, each bound to live data.

API reference: https://mealdirectbackend.onrender.com/docs

All monetary amounts from the API are integer kobo (1 NGN = 100 kobo); see `src/lib/format.ts`.
