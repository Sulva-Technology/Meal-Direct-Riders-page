// Typed wrappers around the rider + common endpoints.
import { apiRequest, apiList } from './api';
import type {
  AuthTokens,
  RiderProfile,
  RiderAssignmentSummary,
  RiderAssignmentDetail,
  RiderOrderDetail,
  RiderIssue,
  RiderEarningsSummary,
  RiderSettlementSummary,
  RiderSettlementDetail,
  RiderPayoutAccount,
  UpsertRiderPayoutAccountBody,
  AssignmentStatus,
  SettlementStatus,
  NotificationRecord,
  NotificationPreferences,
  CampusRecord,
  OnboardRiderBody,
  RiderOnboardResult,
  MeSession,
  DeliveryProofBody,
  RiderIssueBody,
} from '../types/api';

// ---- Auth ----
// Where Supabase should send the user after they click a link in an auth email
// (confirm signup, password reset, etc.). Sent to our backend as `redirectTo`; the
// backend forwards it to supabase.auth.*. Optional — backend uses a per-role default
// if omitted. Override via env per deploy.
const env = (import.meta as ImportMeta & { env?: ImportMetaEnv }).env;
export const AUTH_REDIRECT_URL: string =
  env?.VITE_AUTH_REDIRECT_URL ??
  'https://rider.mealdirectly.com/auth/callback';

export const riderLogin = (email: string, password: string) =>
  apiRequest<AuthTokens>('/auth/rider/login', { method: 'POST', auth: false, body: { email, password } });

export const riderSignup = (email: string, password: string) =>
  apiRequest<AuthTokens>('/auth/rider/signup', {
    method: 'POST',
    auth: false,
    body: { email, password, redirectTo: AUTH_REDIRECT_URL },
  });

export const logout = () => apiRequest<void>('/auth/logout', { method: 'POST' });

// Per-portal password reset. Backend keys the reset flow off `portal` and returns a
// non-enumerating 200 whether or not the email exists — callers must show a neutral
// message. redirectTo stays as the post-click landing (backend falls back to a
// per-portal default if omitted).
export const requestPasswordReset = (email: string) =>
  apiRequest<{ message?: string }>('/auth/password-reset', {
    method: 'POST',
    auth: false,
    body: { email, portal: 'rider', redirectTo: AUTH_REDIRECT_URL },
  });

// Per-portal resend of the signup confirmation email. Non-enumerating 200 like
// password-reset — show a neutral message regardless of whether the account exists.
export const resendConfirmation = (email: string) =>
  apiRequest<{ message?: string }>('/auth/resend-confirmation', {
    method: 'POST',
    auth: false,
    body: { email, portal: 'rider', redirectTo: AUTH_REDIRECT_URL },
  });

export const getMeSession = () => apiRequest<MeSession>('/me');

// ---- Onboarding ----
// A freshly-confirmed rider has a session but no rider profile yet. listCampuses
// powers the campus selector; onboardRider provisions the rider record.
export const listCampuses = () => apiList<CampusRecord>('/campuses');

export const onboardRider = (body: OnboardRiderBody) =>
  apiRequest<RiderOnboardResult>('/rider/onboard', { method: 'POST', body });

// ---- Profile / availability ----
export const getRiderProfile = () => apiRequest<RiderProfile>('/rider/profile');

export const updateRiderProfile = (body: { displayName?: string; phone?: string }) =>
  apiRequest<RiderProfile>('/rider/profile', { method: 'PATCH', body });

// Backend PATCH /rider/availability takes { available } and writes the riders.available
// column (distinct from the admin-controlled riders.active flag). It returns the full
// profile including the persisted `available`, which is the source of truth we trust.
export function setRiderAvailability(available: boolean): Promise<RiderProfile> {
  return apiRequest<RiderProfile>('/rider/availability', { method: 'PATCH', body: { available } });
}

// ---- Assignments ----
export const listAssignments = (query?: { status?: AssignmentStatus; date?: string; cursor?: string; limit?: number }) =>
  apiList<RiderAssignmentSummary>('/rider/assignments', { query });

export const getAssignment = (id: string) =>
  apiRequest<RiderAssignmentDetail>(`/rider/assignments/${id}`);

export const acceptAssignment = (id: string) =>
  apiRequest<RiderAssignmentDetail>(`/rider/assignments/${id}/accept`, { method: 'POST' });

// TODO backend contract:
// POST /rider/assignments/:id/decline -> RiderAssignmentDetail
// Body may include { reason?: string }. Current API may return 404 until implemented.
export const declineAssignment = (id: string, reason?: string) =>
  apiRequest<RiderAssignmentDetail>(`/rider/assignments/${id}/decline`, { method: 'POST', body: { reason } });

// TODO backend contract:
// POST /rider/assignments/:id/arrived-at-vendor -> RiderAssignmentDetail
// Persists rider arrival timestamp and optional GPS on backend.
export const markAssignmentArrivedAtVendor = (id: string) =>
  apiRequest<RiderAssignmentDetail>(`/rider/assignments/${id}/arrived-at-vendor`, { method: 'POST' });

export const markAssignmentPickedUp = (id: string) =>
  apiRequest<RiderAssignmentDetail>(`/rider/assignments/${id}/picked-up`, { method: 'POST' });

// ---- Orders ----
export const getOrder = (id: string) => apiRequest<RiderOrderDetail>(`/rider/orders/${id}`);

export const markOrderOutForDelivery = (id: string) =>
  apiRequest<RiderOrderDetail>(`/rider/orders/${id}/out-for-delivery`, { method: 'POST' });

// TODO backend contract:
// POST /rider/orders/:id/arrived-at-customer -> RiderOrderDetail
// Persists rider customer-arrival timestamp and optional GPS on backend.
export const markOrderArrivedAtCustomer = (id: string) =>
  apiRequest<RiderOrderDetail>(`/rider/orders/${id}/arrived-at-customer`, { method: 'POST' });

export const markOrderDelivered = (id: string) =>
  apiRequest<RiderOrderDetail>(`/rider/orders/${id}/delivered`, { method: 'POST' });

// Existing backend stores category + description. Extra fields are sent for launch
// readiness and should be persisted when backend contract is upgraded.
export const reportOrderIssue = (id: string, body: RiderIssueBody) =>
  apiRequest<RiderIssue>(`/rider/orders/${id}/issues`, { method: 'POST', body });

// TODO backend contract:
// POST /rider/orders/:id/delivery-proof -> RiderOrderDetail
// Body: DeliveryProofBody. Supports confirmation code, rider note, timestamp, optional
// GPS/photo URL, and customer-unavailable reason. Do not call unless backend supports it.
export const submitDeliveryProof = (id: string, body: DeliveryProofBody) =>
  apiRequest<RiderOrderDetail>(`/rider/orders/${id}/delivery-proof`, { method: 'POST', body });

// ---- Earnings & settlements ----
export const getEarnings = (query?: { dateFrom?: string; dateTo?: string }) =>
  apiRequest<RiderEarningsSummary>('/rider/earnings', { query });

export const listSettlements = (query?: { status?: SettlementStatus; cursor?: string; limit?: number }) =>
  apiList<RiderSettlementSummary>('/rider/settlements', { query });

export const getSettlement = (id: string) =>
  apiRequest<RiderSettlementDetail>(`/rider/settlements/${id}`);

// ---- Payout / settlement account ----
// STUB: the backend rider payout-account endpoints do not exist yet (only vendors have
// GET/PUT /vendors/payout-account). These mirror that shape so the rider UI is ready;
// they will 404 until the backend implements /rider/payout-account. See issue #3.
export const getRiderPayoutAccount = () =>
  apiRequest<RiderPayoutAccount | null>('/rider/payout-account');

export const updateRiderPayoutAccount = (body: UpsertRiderPayoutAccountBody) =>
  apiRequest<RiderPayoutAccount>('/rider/payout-account', { method: 'PUT', body });

// ---- Notifications ----
export const listNotifications = (query?: { cursor?: string; limit?: number }) =>
  apiList<NotificationRecord>('/notifications', { query });

export const markAllNotificationsRead = () =>
  apiRequest<{ updated?: number }>('/notifications/read-all', { method: 'POST' });

export const markNotificationRead = (id: string) =>
  apiRequest<NotificationRecord>(`/notifications/${id}/read`, { method: 'POST' });

export const getNotificationPreferences = () =>
  apiRequest<NotificationPreferences>('/notifications/preferences');

export const updateNotificationPreferences = (body: Partial<Omit<NotificationPreferences, 'userId' | 'updatedAt'>>) =>
  apiRequest<NotificationPreferences>('/notifications/preferences', { method: 'PUT', body });

// Firebase Cloud Messaging device tokens. Backend returns 204 for both.
export const registerDeviceToken = (token: string) =>
  apiRequest<void>('/me/device-tokens', { method: 'POST', body: { token, platform: 'web' } });

export const deleteDeviceToken = (token: string) =>
  apiRequest<void>(`/me/device-tokens/${encodeURIComponent(token)}`, { method: 'DELETE' });
