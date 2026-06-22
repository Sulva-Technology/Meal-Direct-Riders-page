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
  active: boolean;
}

// ---- Onboarding ----
export interface CampusRecord {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface CampusLocation {
  id: string;
  campusId: string;
  name: string;
  type: 'department' | 'hostel';
  zoneName: string;
  active: boolean;
  displayOrder: number;
}

export interface CompleteOnboardingBody {
  defaultCampusId: string;
  defaultLocationId: string;
  phoneNumber: string;
}

export type AssignmentStatus = 'accepted' | 'assigned' | 'cancelled' | 'completed' | 'picked_up';

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
  | 'delivered'
  | 'expired'
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
}

export interface RiderAssignmentDetail extends RiderAssignmentSummary {
  orders: RiderOrderDetail[];
}

export type IssueCategory =
  | 'access_restriction'
  | 'customer_unavailable'
  | 'damaged_package'
  | 'other'
  | 'wrong_location';

export interface RiderIssue {
  id: string;
  orderId: string;
  category: string;
  description: string;
  status: string;
  openedAt: string;
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
  updatedAt: string;
}

export interface CursorPaginationMeta {
  hasMore: boolean;
  limit: number;
  nextCursor?: string;
}
