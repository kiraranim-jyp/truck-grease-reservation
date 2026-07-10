export type UserRole = 'customer' | 'admin' | 'super_admin';

export type ReservationStatus =
  | 'requested'
  | 'pending_approval'
  | 'approved'
  | 'visited'
  | 'completed'
  | 'paid'
  | 'rejected'
  | 'cancelled';

export const RESERVATION_FLOW: ReservationStatus[] = [
  'requested',
  'pending_approval',
  'approved',
  'visited',
  'completed',
  'paid',
];

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  requested: '예약',
  pending_approval: '승인대기',
  approved: '승인',
  visited: '방문',
  completed: '완료',
  paid: '결제완료',
  rejected: '반려',
  cancelled: '취소',
};

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  phone_verified: boolean;
  login_provider: string | null;
  referral_code: string;
  referred_by: string | null;
  marketing_agree: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  plate_number: string;
  vehicle_type: string;
  manufacturer: string | null;
  model: string | null;
  year: number | null;
  memo: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  sort_order: number;
}

export interface Reservation {
  id: string;
  customer_id: string;
  vehicle_id: string;
  service_id: string;
  reserved_date: string;
  reserved_time: string;
  status: ReservationStatus;
  price: number;
  coupon_id: string | null;
  discount_amount: number;
  final_price: number;
  customer_memo: string | null;
  admin_memo: string | null;
  rejected_reason: string | null;
  created_at: string;
  // joined
  vehicle?: Vehicle;
  service?: Service;
  customer?: Profile;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  type: 'percent' | 'fixed';
  value: number;
  max_discount: number | null;
  min_price: number;
  issued_reason: string | null;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number;
  used_count: number;
  is_active: boolean;
}

export interface Review {
  id: string;
  reservation_id: string;
  customer_id: string;
  rating: number;
  content: string | null;
  photo_urls: string[];
  admin_reply: string | null;
  is_visible: boolean;
  created_at: string;
}

export interface OperatingSettings {
  id: number;
  open_time: string;
  close_time: string;
  slot_minutes: number;
  max_concurrent_bays: number;
  closed_weekdays: number[];
  blocked_dates: string[];
  auto_approve: boolean;
}
