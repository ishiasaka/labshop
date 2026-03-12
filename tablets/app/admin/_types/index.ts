export interface User {
  student_id: number;
  first_name: string;
  last_name: string;
  status: 'active' | 'inactive' | string;
  account_balance: number;
}

export interface IcCard {
  uid: string;
  student_id: number | null;
  status: 'active' | 'inactive' | string;
}

export interface Shelf {
  shelf_id: string;
  usb_port: number;
  price: number;
}

export interface Purchase {
  student_id: number;
  price: number;
  created_at: string;
}

export interface Payment {
  student_id: number;
  amount_paid: number;
  created_at: string;
}

export interface ActivityItem {
  time: string;
  student_id: number;
  type: 'PURCHASE' | 'PAYMENT';
  amount: number;
}

export interface AdminInfo {
  admin_name: string;
  admin_id: string;
}
