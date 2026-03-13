// User types
export type UserStatus = "active" | "inactive";

export interface User {
  student_id: number;
  first_name: string;
  last_name: string;
  account_balance: number;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

// Admin types
export type AdminRole = "superadmin" | "admin" | "moderator";

export interface Admin {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: AdminRole;
  created_at: string;
}

export interface AdminLoginResponse {
  admin_id: string;
  full_name: string;
  token: string;
}

// Purchase types
export type PurchaseStatus = "completed" | "failed" | "pending" | "canceled";

export interface Purchase {
  id: string;
  student_id: number;
  shelf_id: string;
  price: number;
  status: PurchaseStatus;
  created_at: string;
}

// Payment types
export type PaymentStatus = "completed" | "pending" | "failed";

export interface Payment {
  id: string;
  student_id: number;
  amount_paid: number;
  status: PaymentStatus;
  external_transaction_id?: string;
  idempotency_key?: string;
  created_at: string;
}

// IC Card types
export type ICCardStatus = "active" | "deactivated";

export interface ICCard {
  id: string;
  uid: string;
  student_id?: number;
  status: ICCardStatus;
  created_at: string;
  updated_at: string;
}

// Shelf types
export interface Shelf {
  id: string;
  shelf_id: string;
  usb_port: number;
  price: number;
  created_at: string;
  updated_at: string;
}

// Admin Log types
export interface AdminLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target?: string;
  targeted_student_id?: number;
  created_at: string;
}

// System Setting types
export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

// API Response types
export interface UsersResponse {
  users: User[];
}

export interface PurchasesResponse {
  purchases: Purchase[];
}

export interface PaymentsResponse {
  payments: Payment[];
}

export interface ICCardsResponse {
  iccards: ICCard[];
}

export interface AdminLogsResponse {
  logs: AdminLog[];
}

export interface ShelvesResponse {
  shelves: Shelf[];
}

export interface SystemSettingsResponse {
  settings: SystemSetting[];
}

// Dashboard stats
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDebt: number;
  todayPurchases: number;
  todayPayments: number;
  totalShelves: number;
}
