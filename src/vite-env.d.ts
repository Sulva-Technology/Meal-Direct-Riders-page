/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTH_REDIRECT_URL?: string;
  readonly VITE_WEB_PUSH_PUBLIC_KEY?: string; // FCM Web Push certificate (vapidKey)
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
