import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SessionService } from '../../services/session.service';
import { SessionBookingService } from '../../services/session-booking.service';
import { LoadingService } from '../../services/loading.service';
import { NotificationService } from '../../services/notification.service';
import { Session, SessionType, Trainer, BookingItem, SessionFilters, BookingFormData } from '../../models/session.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <!-- Header Section -->
      <div class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Book Your Training Sessions</h1>
              <p class="mt-2 text-gray-600">Select from our premium padel, tennis, and fitness sessions</p>
            </div>
            <div class="hidden lg:flex items-center space-x-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600">{{ bookingSummary.totals.totalSessions }}</div>
                <div class="text-sm text-gray-500">Session Types</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ bookingSummary.totals.itemCount }}</div>
                <div class="text-sm text-gray-500">Total Sessions</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">\${{ bookingSummary.totals.totalAmount | number:'1.2-2' }}</div>
                <div class="text-sm text-gray-500">Total Amount</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Session Selection Panel -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Filters -->
            <div class="bg-white rounded-xl shadow-sm border p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Filter Sessions</h2>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <!-- Date Filter -->
                <div>
                  <label for="date-filter" class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    id="date-filter"
                    type="date"
                    [(ngModel)]="filters.date"
                    (ngModelChange)="onFilterChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    [min]="todayDate"
                  >
                </div>

                <!-- Session Type Filter -->
                <div>
                  <label for="type-filter" class="block text-sm font-medium text-gray-700 mb-1">Session Type</label>
                  <select
                    id="type-filter"
                    [(ngModel)]="filters.type"
                    (ngModelChange)="onFilterChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">All Types</option>
                    <option *ngFor="let type of sessionTypes" [value]="type.name">
                      {{ type.name | titlecase }}
                    </option>
                  </select>
                </div>

                <!-- Trainer Filter -->
                <div>
                  <label for="trainer-filter" class="block text-sm font-medium text-gray-700 mb-1">Trainer</label>
                  <select
                    id="trainer-filter"
                    [(ngModel)]="filters.trainer_id"
                    (ngModelChange)="onFilterChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">All Trainers</option>
                    <option *ngFor="let trainer of trainers" [value]="trainer.id">
                      {{ trainer.name }}
                    </option>
                  </select>
                </div>

                <!-- Duration Filter -->
                <div>
                  <label for="duration-filter" class="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select
                    id="duration-filter"
                    [(ngModel)]="filters.duration"
                    (ngModelChange)="onFilterChange()"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">All Durations</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                    <option value="120">120 minutes</option>
                  </select>
                </div>

              </div>
            </div>

            <!-- Available Sessions -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-gray-900">
                  Available Sessions 
                  <span class="text-sm font-normal text-gray-500">({{ sessions.length }} found)</span>
                </h2>
                <button
                  *ngIf="sessions.length > 0"
                  (click)="loadSessions()"
                  class="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  🔄 Refresh
                </button>
              </div>

              <!-- Loading State -->
              <div *ngIf="isLoading" class="space-y-4">
                <div *ngFor="let i of [1,2,3,4]" class="bg-white rounded-xl shadow-sm border p-6 animate-pulse">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div class="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                      <div class="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div class="ml-6">
                      <div class="h-10 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Session Cards -->
              <div *ngIf="!isLoading && sessions.length > 0" class="space-y-4">
                <div 
                  *ngFor="let session of sessions; trackBy: trackBySessionId"
                  class="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-300 overflow-hidden"
                  [class.ring-2]="bookingService.isInBooking(session.id)"
                  [class.ring-blue-500]="bookingService.isInBooking(session.id)"
                >
                  <div class="p-6">
                    <div class="flex items-start justify-between">
                      
                      <!-- Session Info -->
                      <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-3">
                          <span 
                            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                            [ngClass]="getSessionTypeClasses(session.session_type.name)"
                          >
                            {{ getSessionTypeIcon(session.session_type.name) }} {{ session.session_type.name | titlecase }}
                          </span>
                          <span class="text-sm text-gray-500">{{ formatSessionDate(session.date) }}</span>
                          <span 
                            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            [ngClass]="getStatusClasses(session.status)"
                          >
                            {{ session.status | titlecase }}
                          </span>
                        </div>

                        <h3 class="text-lg font-semibold text-gray-900 mb-2">
                          {{ session.trainer.name }}
                        </h3>

                        <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            {{ formatSessionTime(session) }}
                          </div>
                          <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            {{ session.duration_minutes }} minutes
                          </div>
                          <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                            {{ session.available_spots }} spots left
                          </div>
                          <div class="flex items-center">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                            </svg>
                            \${{ session.price | number:'1.2-2' }}
                          </div>
                        </div>

                        <p class="text-sm text-gray-600 mb-4">{{ session.trainer.bio }}</p>

                        <div class="flex items-center space-x-2">
                          <div 
                            *ngFor="let spec of session.trainer.specializations" 
                            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {{ spec | titlecase }}
                          </div>
                        </div>
                      </div>

                      <!-- Action Buttons -->
                      <div class="ml-6 flex flex-col items-end space-y-3">
                        <div class="text-right">
                          <div class="text-2xl font-bold text-gray-900">\${{ session.price | number:'1.2-2' }}</div>
                          <div class="text-sm text-gray-500">per session</div>
                        </div>

                        <div class="flex items-center space-x-2">
                          <!-- Quantity Controls (if in booking) -->
                          <div *ngIf="bookingService.isInBooking(session.id)" class="flex items-center space-x-2">
                            <button
                              (click)="updateQuantity(session.id, bookingService.getSessionQuantity(session.id) - 1)"
                              class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors duration-200"
                            >
                              −
                            </button>
                            <span class="w-8 text-center font-medium">{{ bookingService.getSessionQuantity(session.id) }}</span>
                            <button
                              (click)="updateQuantity(session.id, bookingService.getSessionQuantity(session.id) + 1)"
                              [disabled]="session.available_spots <= bookingService.getSessionQuantity(session.id)"
                              class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-gray-600 transition-colors duration-200"
                            >
                              +
                            </button>
                          </div>

                          <!-- Add to Booking Button -->
                          <button
                            *ngIf="!bookingService.isInBooking(session.id)"
                            (click)="addToBooking(session)"
                            [disabled]="!isSessionAvailable(session)"
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                          >
                            {{ isSessionAvailable(session) ? 'Book Session' : 'Unavailable' }}
                          </button>

                          <!-- Remove from Booking Button -->
                          <button
                            *ngIf="bookingService.isInBooking(session.id)"
                            (click)="removeFromBooking(session.id)"
                            class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              <!-- No Sessions Found -->
              <div *ngIf="!isLoading && sessions.length === 0" class="text-center py-12">
                <div class="mx-auto h-24 w-24 text-gray-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0L6 21l6-6 6 6-6-6zM6 21h12"/>
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
                <p class="text-gray-600 mb-6">Try adjusting your filters to find available sessions.</p>
                <button
                  (click)="clearFilters()"
                  class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Clear Filters
                </button>
              </div>

            </div>
          </div>

          <!-- Booking Panel -->
          <div class="space-y-6">
            
            <!-- Booking Summary -->
            <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div class="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 class="text-lg font-semibold text-gray-900 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 8L5 21h14M7 13v8a2 2 0 002 2h6a2 2 0 002-2v-8m-8 4h4"/>
                  </svg>
                  Booking Summary
                </h2>
              </div>

              <div class="p-6">
                <!-- Empty Booking -->
                <div *ngIf="bookingService.isEmpty()" class="text-center py-8">
                  <div class="mx-auto h-16 w-16 text-gray-300 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 8L5 21h14M7 13v8a2 2 0 002 2h6a2 2 0 002-2v-8m-8 4h4"/>
                    </svg>
                  </div>
                  <p class="text-gray-500 mb-4">Your booking is empty</p>
                  <p class="text-sm text-gray-400">Add sessions to get started</p>
                </div>

                <!-- Booking Items -->
                <div *ngIf="!bookingService.isEmpty()" class="space-y-4">
                  
                  <!-- Booking Item -->
                  <div 
                    *ngFor="let item of bookingSummary.items; trackBy: trackByBookingItem"
                    class="border rounded-lg p-4 bg-gray-50"
                  >
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                          <span 
                            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            [ngClass]="getSessionTypeClasses(item.session.session_type.name)"
                          >
                            {{ getSessionTypeIcon(item.session.session_type.name) }} {{ item.session.session_type.name | titlecase }}
                          </span>
                        </div>
                        <h4 class="font-medium text-gray-900 text-sm">{{ item.session.trainer.name }}</h4>
                        <p class="text-xs text-gray-600">{{ formatSessionDate(item.session.date) }} • {{ formatSessionTime(item.session) }}</p>
                        <div class="flex items-center justify-between mt-2">
                          <span class="text-sm font-medium text-gray-900">
                            {{ item.quantity }}x \${{ item.session.price | number:'1.2-2' }}
                          </span>
                          <span class="text-sm font-bold text-blue-600">
                            \${{ (item.session.price * item.quantity) | number:'1.2-2' }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Booking Totals -->
                  <div class="border-t pt-4 space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600">Total Sessions:</span>
                      <span class="font-medium">{{ bookingSummary.totals.itemCount }}</span>
                    </div>
                    <div class="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total Amount:</span>
                      <span class="text-blue-600">\${{ bookingSummary.totals.totalAmount | number:'1.2-2' }}</span>
                    </div>
                  </div>

                  <!-- Booking Actions -->
                  <div class="pt-4 space-y-3">
                    <button
                      (click)="clearBooking()"
                      class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                    >
                      Clear Booking
                    </button>
                  </div>

                </div>
              </div>
            </div>

            <!-- Booking Form -->
            <div *ngIf="!bookingService.isEmpty()" class="bg-white rounded-xl shadow-sm border">
              <div class="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                <h2 class="text-lg font-semibold text-gray-900 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Booking Details
                </h2>
              </div>

              <form [formGroup]="bookingForm" (ngSubmit)="onSubmitBooking()" class="p-6 space-y-6">
                
                <!-- Client Information -->
                <div class="space-y-4">
                  <h3 class="font-medium text-gray-900">Your Information</h3>
                  
                  <div>
                    <label for="client_name" class="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      id="client_name"
                      type="text"
                      formControlName="client_name"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      [class.border-red-500]="bookingForm.get('client_name')?.invalid && bookingForm.get('client_name')?.touched"
                      placeholder="Enter your full name"
                    >
                    <div 
                      *ngIf="bookingForm.get('client_name')?.invalid && bookingForm.get('client_name')?.touched"
                      class="mt-1 text-sm text-red-600"
                    >
                      Name is required and must be at least 2 characters
                    </div>
                  </div>

                  <div>
                    <label for="client_email" class="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      id="client_email"
                      type="email"
                      formControlName="client_email"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      [class.border-red-500]="bookingForm.get('client_email')?.invalid && bookingForm.get('client_email')?.touched"
                      placeholder="Enter your email address"
                    >
                    <div 
                      *ngIf="bookingForm.get('client_email')?.invalid && bookingForm.get('client_email')?.touched"
                      class="mt-1 text-sm text-red-600"
                    >
                      Please enter a valid email address
                    </div>
                  </div>

                  <div>
                    <label for="client_phone" class="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      id="client_phone"
                      type="tel"
                      formControlName="client_phone"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      [class.border-red-500]="bookingForm.get('client_phone')?.invalid && bookingForm.get('client_phone')?.touched"
                      placeholder="Enter your phone number"
                    >
                    <div 
                      *ngIf="bookingForm.get('client_phone')?.invalid && bookingForm.get('client_phone')?.touched"
                      class="mt-1 text-sm text-red-600"
                    >
                      Phone number is required and must be at least 10 digits
                    </div>
                  </div>

                  <div>
                    <label for="special_requests" class="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      id="special_requests"
                      formControlName="special_requests"
                      rows="3"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="Any special requests or notes for your training sessions..."
                    ></textarea>
                  </div>
                </div>

                <!-- Terms and Conditions -->
                <div class="border-t pt-6">
                  <div class="flex items-start">
                    <input
                      id="terms_accepted"
                      type="checkbox"
                      formControlName="terms_accepted"
                      class="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    >
                    <label for="terms_accepted" class="ml-3 text-sm text-gray-700">
                      I agree to the 
                      <a href="#" class="text-green-600 hover:text-green-700 font-medium">Terms and Conditions</a> 
                      and 
                      <a href="#" class="text-green-600 hover:text-green-700 font-medium">Privacy Policy</a>
                      *
                    </label>
                  </div>
                  <div 
                    *ngIf="bookingForm.get('terms_accepted')?.invalid && bookingForm.get('terms_accepted')?.touched"
                    class="mt-2 text-sm text-red-600"
                  >
                    You must accept the terms and conditions to proceed
                  </div>
                </div>

                <!-- Submit Button -->
                <button
                  type="submit"
                  [disabled]="bookingForm.invalid || isSubmitting"
                  class="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center"
                >
                  <svg 
                    *ngIf="isSubmitting" 
                    class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isSubmitting ? 'Processing Booking...' : 'Complete Booking' }}
                </button>

              </form>
            </div>

            <!-- Quick Stats -->
            <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm text-white overflow-hidden">
              <div class="p-6">
                <h3 class="font-semibold mb-4">Your Session Summary</h3>
                <div class="space-y-3">
                  <div 
                    *ngFor="let type of getSessionTypeBreakdown(); trackBy: trackBySessionType" 
                    class="flex items-center justify-between"
                  >
                    <div class="flex items-center">
                      <span class="text-lg mr-2">{{ getSessionTypeIcon(type.name) }}</span>
                      <span class="font-medium">{{ type.name | titlecase }}</span>
                    </div>
                    <span class="font-bold">{{ type.count }}x</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ng-invalid.ng-touched {
      border-color: #ef4444;
    }
    
    .ng-valid.ng-touched {
      border-color: #10b981;
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out;
    }
  `]
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  sessions: Session[] = [];
  sessionTypes: SessionType[] = [];
  trainers: Trainer[] = [];
  
  filters: SessionFilters = {};
  todayDate = new Date().toISOString().split('T')[0];
  
  bookingForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  
  bookingSummary: any = { items: [], totals: { itemCount: 0, totalAmount: 0, totalSessions: 0 } };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sessionService: SessionService,
    public bookingService: SessionBookingService,
    private loadingService: LoadingService,
    private notificationService: NotificationService
  ) {
    this.bookingForm = this.createBookingForm();
  }

  ngOnInit(): void {
    this.initializeData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeData(): void {
    this.loadSessionTypes();
    this.loadTrainers();
    this.loadSessions();
  }

  private setupSubscriptions(): void {
    // Watch booking changes
    this.bookingService.bookingItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.bookingSummary = this.bookingService.getBookingSummary();
      });
  }

  private createBookingForm(): FormGroup {
    return this.fb.group({
      client_name: ['', [Validators.required, Validators.minLength(2)]],
      client_email: ['', [Validators.required, Validators.email]],
      client_phone: ['', [Validators.required, Validators.minLength(10)]],
      special_requests: [''],
      terms_accepted: [false, Validators.requiredTrue]
    });
  }

  loadSessions(): void {
    this.isLoading = true;
    this.sessionService.getSessions(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.sessions = response.sessions;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load sessions:', error);
          this.notificationService.error('Error', 'Failed to load sessions. Please try again.');
          this.isLoading = false;
        }
      });
  }

  loadSessionTypes(): void {
    this.sessionService.getSessionTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.sessionTypes = response.session_types;
        },
        error: (error) => {
          console.error('Failed to load session types:', error);
        }
      });
  }

  loadTrainers(): void {
    this.sessionService.getTrainers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.trainers = response.trainers;
        },
        error: (error) => {
          console.error('Failed to load trainers:', error);
        }
      });
  }

  onFilterChange(): void {
    this.loadSessions();
  }

  clearFilters(): void {
    this.filters = {};
    this.loadSessions();
  }

  addToBooking(session: Session): void {
    if (this.isSessionAvailable(session)) {
      this.bookingService.addToBooking(session);
    }
  }

  removeFromBooking(sessionId: number): void {
    this.bookingService.removeFromBooking(sessionId);
  }

  updateQuantity(sessionId: number, quantity: number): void {
    this.bookingService.updateQuantity(sessionId, quantity);
  }

  clearBooking(): void {
    if (confirm('Are you sure you want to clear all sessions from your booking?')) {
      this.bookingService.clearBooking();
    }
  }

  isSessionAvailable(session: Session): boolean {
    return session.status === 'available' && session.available_spots > 0;
  }

  onSubmitBooking(): void {
    if (this.bookingForm.valid && !this.bookingService.isEmpty()) {
      this.isSubmitting = true;
      
      const bookingData: BookingFormData = {
        ...this.bookingForm.value,
        sessions: this.bookingService.getSessionIdsForBooking()
      };

      this.sessionService.createBooking(bookingData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.notificationService.success(
              'Booking Confirmed!', 
              `Your booking ${response.booking.booking_number} has been created successfully.`
            );
            this.bookingService.clearBooking();
            this.router.navigate(['/booking-confirmation'], { 
              queryParams: { bookingNumber: response.booking.booking_number }
            });
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('Booking failed:', error);
            this.notificationService.error(
              'Booking Failed', 
              error.error?.message || 'Failed to create booking. Please try again.'
            );
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.bookingForm.controls).forEach(key => {
      this.bookingForm.get(key)?.markAsTouched();
    });
  }

  // Utility methods for templates
  formatSessionDate(dateString: string): string {
    return this.sessionService.formatSessionDate(dateString);
  }

  formatSessionTime(session: Session): string {
    return this.sessionService.formatSessionTime(session);
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
    return this.sessionService.getSessionTypeIcon(type);
  }

  getStatusClasses(status: string): string {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getSessionTypeBreakdown(): { name: string, count: number }[] {
    const breakdown = this.bookingSummary.sessionsByType || {};
    return Object.entries(breakdown).map(([name, count]) => ({ name, count: count as number }));
  }

  // TrackBy functions for performance
  trackBySessionId(index: number, session: Session): number {
    return session.id;
  }

  trackByBookingItem(index: number, item: BookingItem): number {
    return item.session.id;
  }

  trackBySessionType(index: number, item: { name: string, count: number }): string {
    return item.name;
  }
}