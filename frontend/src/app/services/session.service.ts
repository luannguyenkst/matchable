import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { Session, SessionType, Trainer, SessionFilters, Booking, BookingFormData } from '../models/session.model';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private sessionsSubject = new BehaviorSubject<Session[]>([]);
  public sessions$ = this.sessionsSubject.asObservable();

  private sessionTypesSubject = new BehaviorSubject<SessionType[]>([]);
  public sessionTypes$ = this.sessionTypesSubject.asObservable();

  private trainersSubject = new BehaviorSubject<Trainer[]>([]);
  public trainers$ = this.trainersSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  /**
   * Get available sessions with optional filters
   */
  getSessions(filters?: SessionFilters): Observable<{ sessions: Session[], total: number }> {
    let params = new HttpParams();
    
    if (filters?.date) params = params.set('date', filters.date);
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.trainer_id) params = params.set('trainer_id', filters.trainer_id.toString());
    if (filters?.duration) params = params.set('duration', filters.duration.toString());

    return this.apiService.get<{ sessions: Session[], total: number }>('/sessions', params).pipe(
      map(response => {
        const data = (response as any).data || response;
        this.sessionsSubject.next(data.sessions);
        return data;
      })
    );
  }

  /**
   * Get session types
   */
  getSessionTypes(): Observable<{ session_types: SessionType[] }> {
    return this.apiService.get<{ session_types: SessionType[] }>('/sessions/types').pipe(
      map(response => {
        const data = (response as any).data || response;
        this.sessionTypesSubject.next(data.session_types);
        return data;
      })
    );
  }

  /**
   * Get available trainers
   */
  getTrainers(specialization?: string): Observable<{ trainers: Trainer[] }> {
    let params = new HttpParams();
    if (specialization) params = params.set('specialization', specialization);

    return this.apiService.get<{ trainers: Trainer[] }>('/sessions/trainers', params).pipe(
      map(response => {
        const data = (response as any).data || response;
        this.trainersSubject.next(data.trainers);
        return data;
      })
    );
  }

  /**
   * Get specific session details
   */
  getSession(id: number): Observable<Session> {
    return this.apiService.get<Session>(`/sessions/${id}`).pipe(
      map(response => (response as any).data || response)
    );
  }

  /**
   * Create a new booking
   */
  createBooking(bookingData: BookingFormData): Observable<{ message: string, booking: Booking }> {
    return this.apiService.post<{ message: string, booking: Booking }>('/bookings', bookingData).pipe(
      map(response => (response as any).data || response)
    );
  }

  /**
   * Get booking details by booking number
   */
  getBooking(bookingNumber: string): Observable<Booking> {
    return this.apiService.get<Booking>(`/bookings/${bookingNumber}`).pipe(
      map(response => (response as any).data || response)
    );
  }

  /**
   * Cancel a booking
   */
  cancelBooking(bookingNumber: string): Observable<{ message: string, booking_number: string }> {
    return this.apiService.put<{ message: string, booking_number: string }>(`/bookings/${bookingNumber}/cancel`, {}).pipe(
      map(response => (response as any).data || response)
    );
  }

  /**
   * Get sessions for today
   */
  getTodaySessions(): Observable<{ sessions: Session[], total: number }> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSessions({ date: today });
  }

  /**
   * Get sessions for the next 7 days
   */
  getUpcomingSessions(): Observable<{ sessions: Session[], total: number }> {
    return this.getSessions();
  }

  /**
   * Search sessions by session type
   */
  getSessionsByType(type: 'padel' | 'fitness' | 'tennis'): Observable<{ sessions: Session[], total: number }> {
    return this.getSessions({ type });
  }

  /**
   * Get sessions by trainer
   */
  getSessionsByTrainer(trainerId: number): Observable<{ sessions: Session[], total: number }> {
    return this.getSessions({ trainer_id: trainerId });
  }

  /**
   * Get sessions by duration
   */
  getSessionsByDuration(duration: number): Observable<{ sessions: Session[], total: number }> {
    return this.getSessions({ duration });
  }

  /**
   * Get sessions by date range
   */
  getSessionsByDateRange(startDate: string, endDate?: string): Observable<{ sessions: Session[], total: number }> {
    // For now, just get sessions for the start date
    // This can be enhanced to support date ranges in the backend
    return this.getSessions({ date: startDate });
  }

  /**
   * Check if session is available
   */
  isSessionAvailable(session: Session): boolean {
    return session.status === 'available' && session.available_spots > 0;
  }

  /**
   * Format session time for display
   */
  formatSessionTime(session: Session): string {
    const startTime = new Date(`2000-01-01T${session.start_time}`);
    const endTime = new Date(`2000-01-01T${session.end_time}`);
    
    return `${startTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })} - ${endTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })}`;
  }

  /**
   * Format session date for display
   */
  formatSessionDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get session type color for UI
   */
  getSessionTypeColor(type: string): string {
    switch (type.toLowerCase()) {
      case 'padel':
        return 'bg-blue-500 text-white';
      case 'tennis':
        return 'bg-green-500 text-white';
      case 'fitness':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  }

  /**
   * Get session type icon
   */
  getSessionTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'padel':
        return '🏓';
      case 'tennis':
        return '🎾';
      case 'fitness':
        return '💪';
      default:
        return '🏃';
    }
  }
}