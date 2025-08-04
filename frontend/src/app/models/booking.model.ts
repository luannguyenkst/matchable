export interface Booking {
  id: string;
  user_id?: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface BookingItem {
  id: number;
  booking_session_id: string;
  product_id: number;
  product_variant_id?: number;
  product_name: string;
  product_slug: string;
  product_sku: string;
  product_image?: string;
  variant_name?: string;
  variant_sku?: string;
  variant_attributes?: Record<string, any>;
  quantity: number;
  price: number;
  total: number;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingTotals {
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total: number;
  coupon?: AppliedCoupon;
}

export interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
}

export interface BookingResponse {
  booking: Booking | null;
  items: BookingItem[];
  totals: BookingTotals;
}

export interface AddToBookingRequest {
  product_id: number;
  product_variant_id?: number;
  quantity: number;
}

export interface UpdateBookingItemRequest {
  quantity: number;
}

export interface ApplyCouponRequest {
  code: string;
}