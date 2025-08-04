export interface Order {
  id: number;
  order_number: string;
  user_id?: number;
  user_email?: string;
  user_name?: string;
  guest_email?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  currency: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  billing_address: Address;
  shipping_address: Address;
  shipping_method?: string;
  tracking_number?: string;
  notes?: string;
  items: OrderItem[];
  transactions: PaymentTransaction[];
  created_at: string;
  updated_at: string;
}

export interface OrderSummary {
  id: number;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  item_count: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_variant_id?: number;
  product_name: string;
  product_sku: string;
  variant_name?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface PaymentTransaction {
  id: number;
  transaction_id: string;
  payment_method: PaymentMethod;
  payment_type: 'payment' | 'refund' | 'partial_refund';
  status: TransactionStatus;
  amount: number;
  currency: string;
  gateway_transaction_id?: string;
  processed_at?: string;
  created_at: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface CreateOrderRequest {
  user_id?: number;
  guest_email?: string;
  billing_address: Address;
  shipping_address: Address;
  shipping_method?: string;
  payment_method?: PaymentMethod;
  notes?: string;
}

export interface OrderListResponse {
  orders: OrderSummary[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export type OrderStatus = 
  | 'pending' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded';

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'paid' 
  | 'failed' 
  | 'refunded' 
  | 'partially_refunded';

export type FulfillmentStatus = 
  | 'unfulfilled' 
  | 'partial' 
  | 'fulfilled';

export type PaymentMethod = 
  | 'stripe' 
  | 'paypal' 
  | 'apple_pay' 
  | 'google_pay';

export type TransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';