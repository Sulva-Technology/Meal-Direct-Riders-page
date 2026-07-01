// Typed wrappers around the rider + common endpoints.
import { ApiError, apiRequest, apiList } from './api';
import type {
  AuthTokens,
  RiderProfile,
  RiderAssignmentSummary,
  RiderAssignmentDetail,
  RiderOrderDetail,
  RiderIssue,
  IssueCategory,
  RiderEarningsSummary,
  RiderSettlementSummary,
  RiderSettlementDetail,
  AssignmentStatus,
  SettlementStatus,
  NotificationRecord,
  NotificationPreferences,
  RegisterPushSubscriptionBody,
  UnregisterPushSubscriptionBody,
  CampusRecord,
  OnboardRiderBody,
  RiderOnboardResult,
  MeSession,
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

export const requestPasswordReset = (email: string) =>
  apiRequest<{ message?: string }>('/auth/password-reset', {
    method: 'POST',
    auth: false,
    body: { email, redirectTo: AUTH_REDIRECT_URL },
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

export async function setRiderAvailability(available: boolean): Promise<RiderProfile> {
  try {
    return await apiRequest<RiderProfile>('/rider/availability', { method: 'PATCH', body: { active: available } });
  } catch (err) {
    if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
      return apiRequest<RiderProfile>('/rider/availability', { method: 'PATCH', body: { available } });
    }
    throw err;
  }
}

// ---- Assignments ----
export const listAssignments = (query?: { status?: AssignmentStatus; date?: string; cursor?: string; limit?: number }) =>
  apiList<RiderAssignmentSummary>('/rider/assignments', { query });

export const getAssignment = (id: string) =>
  apiRequest<RiderAssignmentDetail>(`/rider/assignments/${id}`);

export const acceptAssignment = (id: string) =>
  apiRequest<RiderAssignmentDetail>(`/rider/assignments/${id}/accept`, { method: 'POST' });

export const markAssignmentPickedUp = (id: string) =>
  apiRequest<RiderAssignmentDetail>(`/rider/assignments/${id}/picked-up`, { method: 'POST' });

// ---- Orders ----
export const getOrder = (id: string) => apiRequest<RiderOrderDetail>(`/rider/orders/${id}`);

export const markOrderOutForDelivery = (id: string) =>
  apiRequest<RiderOrderDetail>(`/rider/orders/${id}/out-for-delivery`, { method: 'POST' });

export const markOrderDelivered = (id: string) =>
  apiRequest<RiderOrderDetail>(`/rider/orders/${id}/delivered`, { method: 'POST' });

export const reportOrderIssue = (id: string, body: { category: IssueCategory; description: string }) =>
  apiRequest<RiderIssue>(`/rider/orders/${id}/issues`, { method: 'POST', body });

// ---- Earnings & settlements ----
export const getEarnings = (query?: { dateFrom?: string; dateTo?: string }) =>
  apiRequest<RiderEarningsSummary>('/rider/earnings', { query });

export const listSettlements = (query?: { status?: SettlementStatus; cursor?: string; limit?: number }) =>
  apiList<RiderSettlementSummary>('/rider/settlements', { query });

export const getSettlement = (id: string) =>
  apiRequest<RiderSettlementDetail>(`/rider/settlements/${id}`);

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

export const registerPushSubscription = (body: RegisterPushSubscriptionBody) =>
  apiRequest<{ registered?: boolean }>('/notifications/push-subscriptions', { method: 'POST', body });

export const unregisterPushSubscription = (body: UnregisterPushSubscriptionBody) =>
  apiRequest<{ removed?: boolean }>('/notifications/push-subscriptions', { method: 'DELETE', body });
