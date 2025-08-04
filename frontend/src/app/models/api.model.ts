export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  status?: number;
}

export interface ValidationError {
  [field: string]: string[];
}

export interface PaymentIntentResponse {
  client_secret?: string;
  approval_url?: string;
  transaction_id: string;
  publishable_key?: string;
  client_id?: string;
}

export interface ConfirmPaymentRequest {
  transaction_id: string;
  payment_method: string;
  gateway_data?: any;
}

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}