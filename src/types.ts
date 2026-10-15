export type ViewState = 
  | 'login'
  | 'dashboard'
  | 'assigned_orders'
  | 'pickup_queue'
  | 'route_planner'
  | 'delivery_zones'
  | 'earnings'
  | 'payout'
  | 'performance'
  | 'notifications'
  | 'support'
  | 'profile'
  | 'settings'
  | 'guide';

export interface RiderState {
  isOnline: boolean;
  name: string;
}
