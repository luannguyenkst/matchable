import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Session, BookingItem } from '../models/session.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class SessionBookingService {
  private bookingItemsSubject = new BehaviorSubject<BookingItem[]>([]);
  public bookingItems$ = this.bookingItemsSubject.asObservable();

  private readonly STORAGE_KEY = 'matchable_session_booking';

  constructor(private notificationService: NotificationService) {
    this.loadBookingFromStorage();
  }

  /**
   * Add a session to booking
   */
  addToBooking(session: Session): void {
    const currentItems = this.bookingItemsSubject.value;
    const existingItemIndex = currentItems.findIndex(item => item.session.id === session.id);

    if (existingItemIndex >= 0) {
      // Session already in booking, increase quantity
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex].quantity += 1;
      this.updateBooking(updatedItems);
      this.notificationService.info('Updated Booking', 'Session quantity increased in booking.');
    } else {
      // Add new session to booking
      const newItem: BookingItem = {
        session,
        quantity: 1
      };
      const updatedItems = [...currentItems, newItem];
      this.updateBooking(updatedItems);
      this.notificationService.success('Added to Booking', `${session.session_type.name} session added to booking.`);
    }
  }

  /**
   * Remove a session from booking
   */
  removeFromBooking(sessionId: number): void {
    const currentItems = this.bookingItemsSubject.value;
    const updatedItems = currentItems.filter(item => item.session.id !== sessionId);
    this.updateBooking(updatedItems);
    this.notificationService.info('Removed', 'Session removed from booking.');
  }

  /**
   * Update session quantity in booking
   */
  updateQuantity(sessionId: number, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromBooking(sessionId);
      return;
    }

    const currentItems = this.bookingItemsSubject.value;
    const itemIndex = currentItems.findIndex(item => item.session.id === sessionId);
    
    if (itemIndex >= 0) {
      const updatedItems = [...currentItems];
      updatedItems[itemIndex].quantity = quantity;
      this.updateBooking(updatedItems);
    }
  }

  /**
   * Clear all items from booking
   */
  clearBooking(): void {
    this.updateBooking([]);
    this.notificationService.info('Booking Cleared', 'All sessions removed from booking.');
  }

  /**
   * Get booking totals
   */
  getBookingTotals(): { 
    itemCount: number, 
    totalAmount: number, 
    totalSessions: number 
  } {
    const items = this.bookingItemsSubject.value;
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const totalAmount = items.reduce((total, item) => 
      total + (item.session.price * item.quantity), 0);
    const totalSessions = items.length;

    return { itemCount, totalAmount, totalSessions };
  }

  /**
   * Check if session is in booking
   */
  isInBooking(sessionId: number): boolean {
    const items = this.bookingItemsSubject.value;
    return items.some(item => item.session.id === sessionId);
  }

  /**
   * Get session quantity in booking
   */
  getSessionQuantity(sessionId: number): number {
    const items = this.bookingItemsSubject.value;
    const item = items.find(item => item.session.id === sessionId);
    return item ? item.quantity : 0;
  }

  /**
   * Check if booking is empty
   */
  isEmpty(): boolean {
    return this.bookingItemsSubject.value.length === 0;
  }

  /**
   * Get current booking items
   */
  getCurrentItems(): BookingItem[] {
    return this.bookingItemsSubject.value;
  }

  /**
   * Get session IDs for booking
   */
  getSessionIdsForBooking(): number[] {
    const items = this.bookingItemsSubject.value;
    const sessionIds: number[] = [];
    
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        sessionIds.push(item.session.id);
      }
    });
    
    return sessionIds;
  }

  /**
   * Validate booking items (check availability)
   */
  validateBookingItems(): { valid: boolean, invalidItems: BookingItem[] } {
    const items = this.bookingItemsSubject.value;
    const invalidItems: BookingItem[] = [];

    items.forEach(item => {
      if (item.session.status !== 'available' || item.session.available_spots <= 0) {
        invalidItems.push(item);
      }
    });

    return {
      valid: invalidItems.length === 0,
      invalidItems
    };
  }

  /**
   * Remove invalid items from booking
   */
  removeInvalidItems(): void {
    const validation = this.validateBookingItems();
    if (!validation.valid) {
      const validItems = this.bookingItemsSubject.value.filter(item => 
        !validation.invalidItems.includes(item)
      );
      this.updateBooking(validItems);
      this.notificationService.warning(
        'Booking Updated', 
        `${validation.invalidItems.length} unavailable session(s) removed from booking.`
      );
    }
  }

  /**
   * Get booking summary for display
   */
  getBookingSummary(): {
    items: BookingItem[],
    totals: { itemCount: number, totalAmount: number, totalSessions: number },
    sessionsByType: { [key: string]: number },
    sessionsByTrainer: { [key: string]: number }
  } {
    const items = this.bookingItemsSubject.value;
    const totals = this.getBookingTotals();
    
    const sessionsByType: { [key: string]: number } = {};
    const sessionsByTrainer: { [key: string]: number } = {};

    items.forEach(item => {
      const type = item.session.session_type.name;
      const trainer = item.session.trainer.name;
      
      sessionsByType[type] = (sessionsByType[type] || 0) + item.quantity;
      sessionsByTrainer[trainer] = (sessionsByTrainer[trainer] || 0) + item.quantity;
    });

    return {
      items,
      totals,
      sessionsByType,
      sessionsByTrainer
    };
  }

  /**
   * Private method to update booking and save to storage
   */
  private updateBooking(items: BookingItem[]): void {
    this.bookingItemsSubject.next(items);
    this.saveBookingToStorage(items);
  }

  /**
   * Save booking to localStorage
   */
  private saveBookingToStorage(items: BookingItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save booking to localStorage:', error);
    }
  }

  /**
   * Load booking from localStorage
   */
  private loadBookingFromStorage(): void {
    try {
      const savedBooking = localStorage.getItem(this.STORAGE_KEY);
      if (savedBooking) {
        const items: BookingItem[] = JSON.parse(savedBooking);
        this.bookingItemsSubject.next(items);
      }
    } catch (error) {
      console.error('Failed to load booking from localStorage:', error);
      this.bookingItemsSubject.next([]);
    }
  }
}