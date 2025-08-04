export interface SessionType {
  id: number;
  name: 'padel' | 'fitness' | 'tennis';
  description: string;
  base_price: number;
  duration_options: number[]; // Duration options in minutes
}

export interface Trainer {
  id: number;
  name: string;
  specializations: string[];
  hourly_rate: number;
  bio: string;
  image_url?: string;
}

export interface Session {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price: number;
  status: 'available' | 'booked' | 'cancelled';
  max_participants: number;
  current_participants: number;
  available_spots: number;
  notes?: string;
  session_type: {
    name: string;
    description: string;
  };
  trainer: {
    name: string;
    bio: string;
    specializations: string[];
    image_url?: string;
  };
}

export interface BookingFormData {
  client_name: string;
  client_email: string;
  client_phone: string;
  sessions: number[];
  terms_accepted: boolean;
  special_requests?: string;
}

export interface BookingSession {
  session_id: number;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  session_type: string;
  trainer_name: string;
  price: number;
  status: string;
}

export interface Booking {
  id: number;
  booking_number: string;
  client: {
    name: string;
    email: string;
    phone: string;
  };
  total_amount: number;
  booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  special_requests?: string;
  sessions: BookingSession[];
  created_at: string;
  updated_at: string;
}

export interface SessionFilters {
  date?: string;
  type?: string;
  trainer_id?: number;
  duration?: number;
}

export interface BookingItem {
  session: Session;
  quantity: number;
}