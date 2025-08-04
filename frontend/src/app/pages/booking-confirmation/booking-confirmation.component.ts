import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, timer } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { SessionService } from '../../services/session.service';
import { NotificationService } from '../../services/notification.service';
import { Booking } from '../../models/session.model';

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      
      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Loading your booking details...</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="!isLoading && !booking" class="flex items-center justify-center min-h-screen">
        <div class="max-w-md mx-auto text-center">
          <div class="mx-auto h-24 w-24 text-red-400 mb-6">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
          <p class="text-gray-600 mb-6">We couldn't find the booking you're looking for. Please check your booking number and try again.</p>
          <button
            (click)="goToCheckout()"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
          >
            Back to Booking
          </button>
        </div>
      </div>

      <!-- Success State -->
      <div *ngIf="!isLoading && booking" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <!-- Success Header -->
        <div class="text-center mb-12">
          <div class="mx-auto h-24 w-24 text-green-500 mb-6 animate-bounce">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Booking Confirmed! 🎉</h1>
          <p class="text-xl text-gray-600">Your training sessions have been successfully booked.</p>
        </div>

        <!-- Booking Details Card -->
        <div class="bg-white rounded-2xl shadow-lg border overflow-hidden mb-8">
          
          <!-- Header -->
          <div class="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold">Booking #{{ booking.booking_number }}</h2>
                <p class="text-green-100 mt-1">{{ formatDate(booking.created_at) }}</p>
              </div>
              <div class="text-right">
                <div class="text-3xl font-bold">\${{ booking.total_amount | number:'1.2-2' }}</div>
                <div class="text-green-100">Total Amount</div>
              </div>
            </div>
          </div>

          <!-- Client Information -->
          <div class="px-8 py-6 border-b bg-gray-50">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Client Information
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-500">Name</label>
                <p class="mt-1 text-lg font-medium text-gray-900">{{ booking.client.name }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Email</label>
                <p class="mt-1 text-lg font-medium text-gray-900">{{ booking.client.email }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500">Phone</label>
                <p class="mt-1 text-lg font-medium text-gray-900">{{ booking.client.phone }}</p>
              </div>
            </div>
          </div>

          <!-- Booking Status -->
          <div class="px-8 py-6 border-b">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-2">Booking Status</label>
                <span 
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  [ngClass]="getStatusClasses(booking.booking_status)"
                >
                  <span class="w-2 h-2 rounded-full mr-2" [ngClass]="getStatusDotClasses(booking.booking_status)"></span>
                  {{ booking.booking_status | titlecase }}
                </span>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-500 mb-2">Payment Status</label>
                <span 
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  [ngClass]="getPaymentStatusClasses(booking.payment_status)"
                >
                  <span class="w-2 h-2 rounded-full mr-2" [ngClass]="getPaymentStatusDotClasses(booking.payment_status)"></span>
                  {{ booking.payment_status | titlecase }}
                </span>
              </div>
            </div>
          </div>

          <!-- Booked Sessions -->
          <div class="px-8 py-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l6 6-6 6zM6 21h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Your Booked Sessions ({{ booking.sessions.length }})
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                *ngFor="let session of booking.sessions; trackBy: trackBySessionId"
                class="border rounded-xl p-6 hover:shadow-md transition-shadow duration-300"
                [class.bg-gray-50]="session.status === 'cancelled'"
              >
                <div class="flex items-start justify-between">
                  
                  <!-- Session Info -->
                  <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-3">
                      <span 
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        [ngClass]="getSessionTypeClasses(session.session_type)"
                      >
                        {{ getSessionTypeIcon(session.session_type) }} {{ session.session_type | titlecase }}
                      </span>
                      <span 
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        [ngClass]="getSessionStatusClasses(session.status)"
                      >
                        {{ session.status | titlecase }}
                      </span>
                    </div>

                    <h4 class="text-lg font-semibold text-gray-900 mb-2">{{ session.trainer_name }}</h4>
                    
                    <div class="space-y-2 text-sm text-gray-600">
                      <div class="flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l6 6-6 6z"/>
                        </svg>
                        {{ formatSessionDate(session.date) }}
                      </div>
                      <div class="flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {{ formatSessionTime(session.start_time, session.end_time) }}
                      </div>
                      <div class="flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3"/>
                        </svg>
                        {{ session.duration_minutes }} minutes
                      </div>
                    </div>
                  </div>

                  <!-- Price -->
                  <div class="ml-6 text-right">
                    <div class="text-xl font-bold text-gray-900">\${{ session.price | number:'1.2-2' }}</div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <!-- Special Requests -->
          <div *ngIf="booking.special_requests" class="px-8 py-6 border-t bg-blue-50">
            <h3 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
              </svg>
              Special Requests
            </h3>
            <p class="text-gray-700 bg-white rounded-lg p-4 border border-blue-200">{{ booking.special_requests }}</p>
          </div>

        </div>

        <!-- Next Steps -->
        <div class="bg-white rounded-2xl shadow-lg border overflow-hidden mb-8">
          <div class="px-8 py-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              What's Next?
            </h3>
          </div>
          <div class="px-8 py-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="flex items-start">
                <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span class="text-green-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 mb-2">Confirmation Email</h4>
                  <p class="text-gray-600 text-sm">You'll receive a confirmation email with all booking details at {{ booking.client.email }}.</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span class="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 mb-2">Prepare for Sessions</h4>
                  <p class="text-gray-600 text-sm">Arrive 10 minutes early and bring appropriate workout attire and water.</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span class="text-purple-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 mb-2">Contact Trainers</h4>
                  <p class="text-gray-600 text-sm">Your trainers may reach out to discuss specific training goals and preparation.</p>
                </div>
              </div>
              <div class="flex items-start">
                <div class="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                  <span class="text-orange-600 font-semibold text-sm">4</span>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-900 mb-2">Payment Processing</h4>
                  <p class="text-gray-600 text-sm">Payment will be processed shortly. You'll receive a receipt via email.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="text-center space-y-4">
          <div class="space-x-4">
            <button
              (click)="printBooking()"
              class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium inline-flex items-center"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              Print Confirmation
            </button>
            
            <button
              (click)="goToCheckout()"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium inline-flex items-center"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              Book More Sessions
            </button>
          </div>
          
          <p class="text-sm text-gray-500 mt-6">
            Need help? Contact us at 
            <a href="mailto:support&#64;matchable.com" class="text-blue-600 hover:text-blue-700 font-medium">support&#64;matchable.com</a> 
            or 
            <a href="tel:+1-555-123-4567" class="text-blue-600 hover:text-blue-700 font-medium">+1 (555) 123-4567</a>
          </p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @media print {
      .no-print {
        display: none !important;
      }
    }

    @keyframes bounceIn {
      0% {
        opacity: 0;
        transform: scale(0.3);
      }
      50% {
        opacity: 1;
        transform: scale(1.1);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .animate-bounce-in {
      animation: bounceIn 0.8s ease-out;
    }
  `]
})
export class BookingConfirmationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  booking: Booking | null = null;
  isLoading = true;
  bookingNumber: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.bookingNumber = params['bookingNumber'];
        if (this.bookingNumber) {
          this.loadBookingDetails();
        } else {
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBookingDetails(): void {
    if (!this.bookingNumber) return;

    this.sessionService.getBooking(this.bookingNumber)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (booking) => {
          this.booking = booking;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load booking:', error);
          this.isLoading = false;
          this.notificationService.error(
            'Booking Not Found',
            'Could not load booking details. Please check your booking number.'
          );
        }
      });
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  printBooking(): void {
    window.print();
  }

  // Utility methods for templates
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatSessionDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatSessionTime(startTime: string, endTime: string): string {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    return `${start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })} - ${end.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })}`;
  }

  getStatusClasses(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusDotClasses(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-400';
      case 'confirmed':
        return 'bg-green-400';
      case 'cancelled':
        return 'bg-red-400';
      case 'completed':
        return 'bg-blue-400';
      default:
        return 'bg-gray-400';
    }
  }

  getPaymentStatusClasses(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getPaymentStatusDotClasses(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-400';
      case 'paid':
        return 'bg-green-400';
      case 'failed':
        return 'bg-red-400';
      case 'refunded':
        return 'bg-blue-400';
      default:
        return 'bg-gray-400';
    }
  }

  getSessionTypeClasses(type: string): string {
    switch (type.toLowerCase()) {
      case 'padel':
        return 'bg-blue-100 text-blue-800';
      case 'tennis':
        return 'bg-green-100 text-green-800';
      case 'fitness':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

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

  getSessionStatusClasses(status: string): string {
    switch (status.toLowerCase()) {
      case 'booked':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // TrackBy function for performance
  trackBySessionId(index: number, session: any): number {
    return session.session_id;
  }
}