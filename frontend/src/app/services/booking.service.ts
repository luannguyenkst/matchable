import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError } from 'rxjs';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';
import { 
  BookingResponse, 
  BookingItem, 
  BookingTotals, 
  AddToBookingRequest, 
  UpdateBookingItemRequest, 
  ApplyCouponRequest 
} from '../models/booking.model';
import { ApiResponse } from '../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingSubject = new BehaviorSubject<BookingResponse>({
    booking: null,
    items: [],
    totals: {
      subtotal: 0,
      tax_amount: 0,
      shipping_amount: 0,
      discount_amount: 0,
      total: 0
    }
  });

  public booking$ = this.bookingSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  initializeBooking(): void {
    this.loadBooking().subscribe();
  }

  loadBooking(): Observable<ApiResponse<BookingResponse>> {
    return this.apiService.get<BookingResponse>('/booking').pipe(
      tap(response => {
        if (response.success && response.data) {
          this.bookingSubject.next(response.data);
          
          // Store booking session ID if provided
          if (response.data.booking) {
            this.apiService.setBookingSessionHeader(response.data.booking.id);
          }
        }
      }),
      catchError(error => {
        console.error('Failed to load booking:', error);
        throw error;
      })
    );
  }

  addToBooking(request: AddToBookingRequest): Observable<ApiResponse<BookingResponse>> {
    return this.apiService.post<BookingResponse>('/booking/items', request).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.bookingSubject.next(response.data);
          this.notificationService.success(
            'Added to Booking', 
            'Item has been added to your booking.'
          );
        }
      }),
      catchError(error => {
        this.notificationService.error('Error', 'Failed to add item to booking.');
        throw error;
      })
    );
  }

  updateBookingItem(itemId: number, request: UpdateBookingItemRequest): Observable<ApiResponse<BookingResponse>> {
    return this.apiService.put<BookingResponse>(`/booking/items/${itemId}`, request).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.bookingSubject.next(response.data);
        }
      }),
      catchError(error => {
        this.notificationService.error('Error', 'Failed to update booking item.');
        throw error;
      })
    );
  }

  removeFromBooking(itemId: number): Observable<ApiResponse<BookingResponse>> {
    return this.apiService.delete<BookingResponse>(`/booking/items/${itemId}`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.bookingSubject.next(response.data);
          this.notificationService.success('Removed', 'Item has been removed from your booking.');
        }
      }),
      catchError(error => {
        this.notificationService.error('Error', 'Failed to remove item from booking.');
        throw error;
      })
    );
  }

  clearBooking(): Observable<ApiResponse<any>> {
    return this.apiService.delete('/booking').pipe(
      tap(response => {
        if (response.success) {
          this.bookingSubject.next({
            booking: null,
            items: [],
            totals: {
              subtotal: 0,
              tax_amount: 0,
              shipping_amount: 0,
              discount_amount: 0,
              total: 0
            }
          });
          this.notificationService.success('Booking Cleared', 'All items have been removed from your booking.');
        }
      }),
      catchError(error => {
        this.notificationService.error('Error', 'Failed to clear booking.');
        throw error;
      })
    );
  }

  applyCoupon(request: ApplyCouponRequest): Observable<ApiResponse<BookingResponse>> {
    return this.apiService.post<BookingResponse>('/booking/apply-coupon', request).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.bookingSubject.next(response.data);
          this.notificationService.success(
            'Coupon Applied', 
            `Coupon "${request.code}" has been successfully applied.`
          );
        }
      }),
      catchError(error => {
        this.notificationService.error('Invalid Coupon', 'The coupon code is invalid or expired.');
        throw error;
      })
    );
  }

  removeCoupon(): Observable<ApiResponse<BookingResponse>> {
    return this.apiService.delete<BookingResponse>('/booking/remove-coupon').pipe(
      tap(response => {
        if (response.success && response.data) {
          this.bookingSubject.next(response.data);
          this.notificationService.success('Coupon Removed', 'The coupon has been removed.');
        }
      }),
      catchError(error => {
        this.notificationService.error('Error', 'Failed to remove coupon.');
        throw error;
      })
    );
  }

  // Utility methods
  getBookingItemCount(): number {
    const currentBooking = this.bookingSubject.value;
    return currentBooking.items.reduce((total, item) => total + item.quantity, 0);
  }

  getBookingTotal(): number {
    const currentBooking = this.bookingSubject.value;
    return currentBooking.totals.total;
  }

  isInBooking(productId: number, variantId?: number): boolean {
    const currentBooking = this.bookingSubject.value;
    return currentBooking.items.some(item => 
      item.product_id === productId && 
      (!variantId || item.product_variant_id === variantId)
    );
  }

  getBookingItemQuantity(productId: number, variantId?: number): number {
    const currentBooking = this.bookingSubject.value;
    const item = currentBooking.items.find(item => 
      item.product_id === productId && 
      (!variantId || item.product_variant_id === variantId)
    );
    return item ? item.quantity : 0;
  }

  hasOutOfStockItems(): boolean {
    const currentBooking = this.bookingSubject.value;
    return currentBooking.items.some(item => !item.in_stock);
  }

  getOutOfStockItems(): BookingItem[] {
    const currentBooking = this.bookingSubject.value;
    return currentBooking.items.filter(item => !item.in_stock);
  }

  isEmpty(): boolean {
    const currentBooking = this.bookingSubject.value;
    return currentBooking.items.length === 0;
  }

  getCurrentBooking(): BookingResponse {
    return this.bookingSubject.value;
  }
}