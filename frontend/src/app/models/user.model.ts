export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: number;
  type: 'billing' | 'shipping';
  is_default: boolean;
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  created_at: string;
  updated_at: string;
}