import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SessionBookingService } from '../../../services/session-booking.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <!-- Top Bar -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center text-sm">
            <div class="flex items-center space-x-4">
              <span>✨ Premium Personal Training Sessions</span>
              <a href="tel:+1-555-123-4567" class="hover:text-blue-200 transition-colors">📞 (555) 123-4567</a>
            </div>
            <div class="flex items-center space-x-4">
              <span class="hover:text-blue-200">🏆 Professional Trainers</span>
              <span class="hover:text-blue-200">💪 Padel • Tennis • Fitness</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Header -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center">
            <a routerLink="/checkout" class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span class="text-white font-bold text-xl">🏅</span>
              </div>
              <div>
                <span class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Matchable</span>
                <div class="text-xs text-gray-500 -mt-1">Personal Training</div>
              </div>
            </a>
          </div>

          <!-- Quick Stats -->
          <div class="hidden lg:flex items-center space-x-8">
            <div class="text-center">
              <div class="text-sm font-semibold text-gray-900">🏓 Padel</div>
              <div class="text-xs text-gray-500">Expert Training</div>
            </div>
            <div class="text-center">
              <div class="text-sm font-semibold text-gray-900">🎾 Tennis</div>
              <div class="text-xs text-gray-500">Professional Coaching</div>
            </div>
            <div class="text-center">
              <div class="text-sm font-semibold text-gray-900">💪 Fitness</div>
              <div class="text-xs text-gray-500">Personal Training</div>
            </div>
          </div>

          <!-- Header Actions -->
          <div class="flex items-center space-x-4">
            <!-- Session Booking -->
            <div class="relative">
              <button class="relative flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h16"/>
                </svg>
                <div class="hidden md:block">
                  <div class="text-sm font-medium">Sessions</div>
                  <div class="text-xs text-gray-500">\${{ bookingTotal | number:'1.2-2' }}</div>
                </div>
                <span
                  *ngIf="bookingItemCount > 0"
                  class="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold animate-pulse"
                >
                  {{ bookingItemCount > 9 ? '9+' : bookingItemCount }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </header>
  `,
  styles: []
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  bookingItemCount = 0;
  bookingTotal = 0;

  constructor(
    private sessionBookingService: SessionBookingService
  ) {}

  ngOnInit(): void {
    // Subscribe to session booking changes
    this.sessionBookingService.bookingItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const totals = this.sessionBookingService.getBookingTotals();
        this.bookingItemCount = totals.itemCount;
        this.bookingTotal = totals.totalAmount;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}