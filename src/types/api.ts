// TypeScript shapes mirroring the Meal Direct backend OpenAPI DTOs.
// Source: https://mealdirectbackend.onrender.com/docs

export type Role = 'customer' | 'vendor' | 'rider' | 'campus_admin' | 'super_admin';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user: AuthUser;
  message?: string;
}

export type RiderStatus = 'pending' | 'verified' | 'suspended' | 'deactivated';

export interface RiderProfile {
  id: string;
  campusId: string;
  displayName: string;
  phone: string;
  status: RiderStatus;
  // Admin-controlled account flag (verify / suspend / activate).
  active: boolean;
  // Rider's own online/offline availability toggle. This is what dispatch + admin read.
  available: boolean;
}

export interface ProfileRecord {
  id: string;
  displayName?: string | null;
  phoneNumber?: string | null;
  defaultCampusId?: string | null;
}

export interface MeSession {
  roles: Role[];
  riderProfiles: RiderProfile[];
}

// ---- Onboarding ----
export interface CampusRecord {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

// Body for POST /rider/onboard — provisions the rider record for the caller.
export interface OnboardRiderBody {
  campusId: string;
  displayName: string;
  phone: string;
}

// Result of POST /rider/onboard. tokenRefreshRequired signals the rider_id claim
// isn't in the current access token yet, so the client must refresh its session.
export interface RiderOnboardResult {
  rider: RiderProfile;
  tokenRefreshRequired: boolean;
}

export type AssignmentStatus =
  | 'accepted'
  | 'assigned'
  | 'arrived_at_vendor'
  | 'cancelled'
  | 'completed'
  | 'declined'
  | 'picked_up';

export interface RiderAssignmentSummary {
  id: string;
  batchId: string;
  riderId: string;
  vendorId: string;
  vendorDisplayName: string;
  vendorPhone?: string | null;
  serviceDate: string;
  deliverySlotId: string;
  deliverySlotName: string;
  deliveryTime: string;
  zoneId: string;
  zoneName: string;
  status: AssignmentStatus;
  batchStatus: string;
  orderCount: number;
  deliveryEarningsKobo: number;
  assignedAt: string;
  acceptedAt?: string | null;
  pickedUpAt?: string | null;
  completedAt?: string | null;
}

export type OrderStatus =
  | 'accepted'
  | 'administratively_completed'
  | 'cancelled'
  | 'confirmed'
  | 'disputed'
  | 'delivered'
  | 'expired'
  | 'arrived_at_customer'
  | 'out_for_delivery'
  | 'paid'
  | 'pending_payment'
  | 'preparing'
  | 'ready'
  | 'refunded';

export interface OrderItem {
  id: string;
  menuItemId: string;
  itemName: string;
  unitType: string;
  unitPriceKobo: number;
  quantity: number;
  lineTotalKobo: number;
  customization: Record<string, unknown>;
}

export interface PaymentSnapshot {
  id: string;
  provider: string;
  providerReference: string;
  status: string;
  expectedAmountKobo: number;
  paidAmountKobo?: number | null;
  currency: string;
  initializedAt: string;
  verifiedAt?: string | null;
  paidAt?: string | null;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  customerId: string;
  campusId: string;
  vendorId: string;
  vendorDisplayName: string;
  serviceDate: string;
  deliverySlotId: string;
  deliverySlotName: string;
  locationId: string;
  locationName: string;
  roomNumber?: string | null;
  orderStatus: OrderStatus;
  deliveryMode: string;
  specialInstructions?: string | null;
  foodSubtotalKobo: number;
  deliveryFeeKobo: number;
  discountKobo: number;
  totalKobo: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
  deliveredAt?: string | null;
  confirmedAt?: string | null;
  items: OrderItem[];
  latestPayment?: PaymentSnapshot;
}

export interface RiderOrderDetail extends OrderDetail {
  assignmentId: string;
  batchId: string;
  assignmentStatus: AssignmentStatus;
  customerDisplayName?: string | null;
  customerPhone?: string | null;
  deliveryInstructions?: string | null;
  zoneName: string;
  // 4-digit code set once the order goes out for delivery. The customer reads it to the
  // rider; the rider enters it via POST /rider/orders/confirm-delivery to complete the
  // delivery. null until out for delivery. Rider does NOT read this out — reference only.
  deliveryCode?: string | null;
}

export interface RiderAssignmentDetail extends RiderAssignmentSummary {
  orders: RiderOrderDetail[];
}

export type IssueCategory =
  | 'app_issue'
  | 'customer_dispute'
  | 'customer_unavailable'
  | 'payment_order_mismatch'
  | 'unsafe_delivery_situation'
  | 'vendor_delay'
  | 'wrong_address_location'
  | 'wrong_item_package'
  | 'other'
  // Legacy backend values still accepted while API contract catches up.
  | 'access_restriction'
  | 'damaged_package'
  | 'wrong_location';

export interface RiderIssue {
  id: string;
  orderId: string;
  category: string;
  description: string;
  status: string;
  openedAt: string;
}

export interface RiderIssueBody {
  category: IssueCategory;
  description: string;
  currentDeliveryStatus: AssignmentStatus | OrderStatus;
  riderId?: string;
  timestamp: string;
  imageUrl?: string;
}

export interface DeliveryProofBody {
  confirmationCode?: string;
  riderNote?: string;
  customerUnavailableReason?: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
}

export type SettlementStatus = 'approved' | 'cancelled' | 'draft' | 'paid';

export interface RiderEarningsBatch {
  assignmentId: string;
  batchId: string;
  serviceDate: string;
  vendorId: string;
  vendorDisplayName: string;
  deliveredOrderCount: number;
  confirmedOrderCount: number;
  pendingAmountKobo: number;
  settledAmountKobo: number;
  totalAmountKobo: number;
  settlementId?: string | null;
  settlementStatus?: SettlementStatus;
}

export interface RiderEarningsSummary {
  riderId: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  deliveredOrderCount: number;
  confirmedOrderCount: number;
  pendingAmountKobo: number;
  settledAmountKobo: number;
  totalAmountKobo: number;
  currency: string;
  ratePerOrderKobo: number;
  batches: RiderEarningsBatch[];
}

export interface RiderSettlementSummary {
  id: string;
  campusId: string;
  riderId: string;
  settlementDate: string;
  status: SettlementStatus;
  deliveryEarningsKobo: number;
  adjustmentsKobo: number;
  payableKobo: number;
  paidAt?: string | null;
  externalReference?: string | null;
  lineCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RiderSettlementLine {
  id: string;
  settlementId: string;
  orderId?: string | null;
  orderNumber?: string | null;
  lineType: string;
  amountKobo: number;
  description: string;
  createdAt: string;
}

export interface RiderSettlementDetail extends RiderSettlementSummary {
  lines: RiderSettlementLine[];
}

// ---- Payout / settlement account ----
// Masked snapshot of where a rider's settlements are paid out. Mirrors the vendor
// payout-account shape. Full account numbers are never returned — only a mask.
export interface RiderPayoutAccount {
  bankName: string;
  bankCode: string | null;
  maskedAccountNumber: string;
  accountName: string;
  paystackRecipientCode?: string | null;
  updatedAt?: string;
  status?: 'none' | 'pending_verification' | 'verified' | 'verification_failed' | 'admin_review_required';
  verificationStatus?: 'pending' | 'verified' | 'failed' | 'manual_review';
  payoutMode?: 'manual' | 'automatic';
  lastReviewedAt?: string | null;
}

// Body for PUT /rider/payout-account. The full accountNumber is sent once and masked
// server-side before storage.
export interface UpsertRiderPayoutAccountBody {
  bankName: string;
  bankCode?: string;
  accountName: string;
  accountNumber: string;
}

export interface NotificationRecord {
  id: string;
  recipientUserId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  title: string;
  body: string;
  linkPath?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  userId: string;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  orderUpdates: boolean;
  paymentUpdates: boolean;
  deliveryUpdates: boolean;
  escalationUpdates: boolean;
  settlementUpdates: boolean;
  batchChatEnabled: boolean;
  updatedAt: string;
}

// ---- Batch chat ----
export type ChatSenderRole = 'rider' | 'customer' | 'vendor';

export interface ChatMessage {
  id: string;
  batchId: string;
  senderUserId: string;
  senderLabel: string;
  senderRole: ChatSenderRole;
  body: string;
  createdAt: string;
  mine: boolean;
}

export interface ChatParticipant {
  userId: string;
  role: ChatSenderRole;
  label: string;
  joinedAt: string;
}

export interface DeviceTokenBody {
  token: string;
  platform: 'web';
}

export interface CursorPaginationMeta {
  hasMore: boolean;
  limit: number;
  nextCursor?: string;
}
