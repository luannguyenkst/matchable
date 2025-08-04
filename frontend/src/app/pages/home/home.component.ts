import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '@/environments/environment';

interface SessionType {
  id: number;
  name: string;
  description: string;
  base_price: number;
  duration_options: number[];
}

interface Trainer {
  name: string;
  bio: string;
  specializations: string[];
  image_url?: string;
}

interface Session {
  id: number;
  date: string;
  start_time: string;
  end_time: string;  
  duration_minutes: number;
  price: number;
  status: string;
  max_participants: number;
  current_participants: number;
  available_spots: number;
  notes?: string;
  session_type: {
    name: string;
    description: string;
  };
  trainer: Trainer;
}

interface BookingData {
  client_name: string;
  client_email: string;
  client_phone: string;
  sessions: number[];
  terms_accepted: boolean;
  special_requests?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Hero Section -->
      <section class="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-5xl font-bold mb-6">
              Book Your Personal Training Session
            </h1>
            <p class="text-xl mb-8 opacity-90">
              Professional coaching for padel, tennis, and fitness training. 
              Choose your session type, trainer, and time slot.
            </p>
            <div class="space-x-4">
              <button 
                (click)="scrollToSessions()"
                class="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-300">
                Book Now
              </button>
              <button class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition duration-300">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Session Types -->
      <section class="py-16" id="sessions">
        <div class="container mx-auto px-4">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Choose Your Training Type</h2>
            <p class="text-gray-600">Select from our professional training sessions</p>
          </div>

          <div class="grid md:grid-cols-3 gap-8 mb-12">
            <div *ngFor="let type of sessionTypes" 
                 class="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition duration-300"
                 [class.ring-2]="selectedType?.id === type.id"
                 [class.ring-primary-500]="selectedType?.id === type.id"
                 (click)="selectType(type)">
              <div class="p-6">
                <div class="text-center mb-4">
                  <div class="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
                    <span class="text-2xl">
                      {{ type.name === 'padel' ? '🏸' : type.name === 'tennis' ? '🎾' : '🏋️' }}
                    </span>
                  </div>
                  <h3 class="text-xl font-bold text-gray-900 capitalize">{{ type.name }}</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">{{ type.description }}</p>
                <div class="text-center">
                  <span class="text-2xl font-bold text-primary-600">€{{ type.base_price }}</span>
                  <span class="text-gray-500 text-sm">/session</span>
                </div>
                <div class="mt-4">
                  <p class="text-xs text-gray-500">Available durations:</p>
                  <div class="flex justify-center space-x-2 mt-2">
                    <span *ngFor="let duration of type.duration_options" 
                          class="bg-gray-100 px-2 py-1 rounded text-xs">
                      {{ duration }}min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Available Sessions -->
          <div *ngIf="selectedType" class="bg-white rounded-lg shadow p-6">
            <h3 class="text-2xl font-bold text-gray-900 mb-6">
              Available {{ selectedType.name | titlecase }} Sessions
            </h3>
            
            <!-- Filters -->
            <div class="mb-6 flex flex-wrap gap-4">
              <select [(ngModel)]="selectedDate" (change)="filterSessions()" 
                      class="border border-gray-300 rounded px-3 py-2">
                <option value="">All Dates</option>
                <option *ngFor="let date of availableDates" [value]="date">
                  {{ formatDate(date) }}
                </option>
              </select>
              
              <select [(ngModel)]="selectedDuration" (change)="filterSessions()" 
                      class="border border-gray-300 rounded px-3 py-2">
                <option value="">All Durations</option>
                <option *ngFor="let duration of selectedType.duration_options" [value]="duration">
                  {{ duration }} minutes
                </option>
              </select>
            </div>

            <!-- Sessions Grid -->
            <div *ngIf="filteredSessions.length > 0" class="grid gap-6">
              <div *ngFor="let session of filteredSessions" 
                   class="border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                   [class.border-primary-500]="selectedSessions.includes(session.id)"
                   [class.bg-primary-50]="selectedSessions.includes(session.id)">
                
                <!-- Session Header -->
                <div class="p-6">
                  <div class="flex items-start justify-between">
                    <!-- Left Section: Date & Time -->
                    <div class="flex-1">
                      <div class="flex items-center space-x-4 mb-3">
                        <div class="bg-primary-100 rounded-lg p-3">
                          <div class="text-center">
                            <div class="text-2xl font-bold text-primary-700">
                              {{ formatDateDay(session.date) }}
                            </div>
                            <div class="text-xs text-primary-600 uppercase font-medium">
                              {{ formatDateMonth(session.date) }}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div class="text-lg font-semibold text-gray-900">
                            {{ formatDate(session.date) }}
                          </div>
                          <div class="text-gray-600 text-lg">
                            {{ session.start_time.slice(0,5) }} - {{ session.end_time.slice(0,5) }}
                          </div>
                          <div class="flex items-center space-x-2 mt-1">
                            <span class="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                              {{ session.duration_minutes }} minutes
                            </span>
                            <span class="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                              {{ session.session_type.name | titlecase }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Right Section: Price & Booking -->
                    <div class="text-right ml-6">
                      <div class="text-3xl font-bold text-primary-600 mb-1">
                        €{{ session.price }}
                      </div>
                      <div class="text-sm text-gray-500 mb-3">
                        {{ session.available_spots }} {{ session.available_spots === 1 ? 'spot' : 'spots' }} available
                      </div>
                      <div class="space-y-2">
                        <button 
                          (click)="toggleSession(session.id)"
                          class="w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300"
                          [class]="selectedSessions.includes(session.id) 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300' 
                            : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'">
                          {{ selectedSessions.includes(session.id) ? 'Remove' : 'Book Session' }}
                        </button>
                        <button 
                          [routerLink]="['/sessions', session.id]"
                          class="w-full px-6 py-2 rounded-lg font-medium text-primary-600 border border-primary-600 hover:bg-primary-50 transition-all duration-300">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Trainer Section -->
                  <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-start space-x-4">
                      <!-- Trainer Avatar -->
                      <div class="flex-shrink-0">
                        <div class="w-16 h-16 rounded-full bg-gray-200 overflow-hidden shadow-sm">
                          <img [src]="session.trainer.image_url" 
                               [alt]="session.trainer.name"
                               class="w-full h-full object-cover"
                               (error)="onTrainerImageError($event, session.trainer.name)">
                        </div>
                      </div>

                      <!-- Trainer Info -->
                      <div class="flex-1 min-w-0">
                        <h4 class="text-lg font-semibold text-gray-900 mb-1">
                          {{ session.trainer.name }}
                        </h4>
                        
                        <!-- Trainer Specializations -->
                        <div class="mb-2">
                          <div class="flex flex-wrap gap-1">
                            <span *ngFor="let spec of session.trainer.specializations"
                                  class="inline-block bg-white border border-gray-200 px-2 py-1 rounded-md text-xs font-medium text-gray-700">
                              {{ spec }}
                            </span>
                          </div>
                        </div>

                        <!-- Trainer Bio -->
                        <p class="text-sm text-gray-600 leading-relaxed">
                          {{ session.trainer.bio }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Session Details -->
                  <div class="mt-4 pt-4 border-t border-gray-200">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div class="flex items-center space-x-2">
                        <span class="text-gray-500">Session Type:</span>
                        <span class="font-medium text-gray-900">{{ session.session_type.name | titlecase }}</span>
                      </div>
                      <div class="flex items-center space-x-2">
                        <span class="text-gray-500">Duration:</span>
                        <span class="font-medium text-gray-900">{{ session.duration_minutes }} minutes</span>
                      </div>
                      <div class="flex items-center space-x-2">
                        <span class="text-gray-500">Max Participants:</span>
                        <span class="font-medium text-gray-900">{{ session.current_participants }}/{{ session.max_participants }}</span>
                      </div>
                    </div>
                    
                    <!-- Session Description -->
                    <div *ngIf="session.session_type.description" class="mt-3">
                      <p class="text-sm text-gray-600">
                        <span class="font-medium text-gray-700">About this session:</span>
                        {{ session.session_type.description }}
                      </p>
                    </div>

                    <!-- Session Notes -->
                    <div *ngIf="session.notes" class="mt-3">
                      <p class="text-sm text-gray-600">
                        <span class="font-medium text-gray-700">Notes:</span>
                        {{ session.notes }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="filteredSessions.length === 0" class="text-center py-8 text-gray-500">
              No sessions available for the selected criteria.
            </div>
          </div>

          <!-- Booking Summary -->
          <div *ngIf="selectedSessions.length > 0" class="mt-8 bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Your Selected Sessions</h3>
            <div class="space-y-2 mb-4">
              <div *ngFor="let sessionId of selectedSessions" class="flex justify-between">
                <span>{{ getSessionDetails(sessionId) }}</span>
                <span class="font-semibold">€{{ getSessionPrice(sessionId) }}</span>
              </div>
            </div>
            <div class="border-t pt-4">
              <div class="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span class="text-primary-600">€{{ getTotalPrice() }}</span>
              </div>
            </div>
            <button 
              (click)="showBookingForm = true"
              class="w-full mt-4 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition duration-300">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </section>

      <!-- Booking Form Modal -->
      <div *ngIf="showBookingForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-gray-900">Complete Your Booking</h3>
            <button (click)="showBookingForm = false" class="text-gray-400 hover:text-gray-600">
              <span class="text-2xl">&times;</span>
            </button>
          </div>

          <form (ngSubmit)="submitBooking()" #bookingForm="ngForm">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text"
                  [(ngModel)]="bookingData.client_name"
                  name="client_name"
                  required
                  class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-primary-500 focus:border-primary-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email"
                  [(ngModel)]="bookingData.client_email"
                  name="client_email"
                  required
                  class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-primary-500 focus:border-primary-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel"
                  [(ngModel)]="bookingData.client_phone"
                  name="client_phone"
                  required
                  class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-primary-500 focus:border-primary-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Special Requests (Optional)</label>
                <textarea 
                  [(ngModel)]="bookingData.special_requests"
                  name="special_requests"
                  rows="3"
                  class="w-full border border-gray-300 rounded px-3 py-2 focus:ring-primary-500 focus:border-primary-500"></textarea>
              </div>

              <div class="flex items-start">
                <input 
                  type="checkbox"
                  [(ngModel)]="bookingData.terms_accepted"
                  name="terms_accepted"
                  required
                  class="mr-2 mt-1">
                <label class="text-sm text-gray-600">
                  I accept the terms and conditions and cancellation policy
                </label>
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <button 
                type="submit"
                [disabled]="!bookingForm.valid || isSubmitting"
                class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300">
                {{ isSubmitting ? 'Processing...' : 'Confirm Booking' }}
              </button>
              <button 
                type="button"
                (click)="showBookingForm = false"
                class="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition duration-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div *ngIf="message" 
           class="fixed bottom-4 right-4 max-w-sm p-4 rounded-lg shadow-lg z-50"
           [class]="message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
        <div class="flex justify-between items-start">
          <div>
            <h4 class="font-semibold">{{ message.type === 'success' ? 'Success!' : 'Error' }}</h4>
            <p class="text-sm mt-1">{{ message.text }}</p>
          </div>
          <button (click)="message = null" class="text-gray-400 hover:text-gray-600 ml-4">
            &times;
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
    }
    .btn {
      @apply inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md transition-colors duration-200;
    }
    .btn-lg {
      @apply px-8 py-4 text-lg;
    }
  `]
})
export class HomeComponent implements OnInit {
  sessionTypes: SessionType[] = [];
  sessions: Session[] = [];
  filteredSessions: Session[] = [];
  selectedType: SessionType | null = null;
  selectedSessions: number[] = [];
  selectedDate: string = '';
  selectedDuration: number | string = '';
  availableDates: string[] = [];
  showBookingForm = false;
  isSubmitting = false;
  message: { type: string; text: string } | null = null;

  bookingData: BookingData = {
    client_name: '',
    client_email: '',
    client_phone: '',
    sessions: [],
    terms_accepted: false,
    special_requests: ''
  };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadSessionTypes();
  }

  loadSessionTypes() {
    this.http.get<any>(`${environment.apiUrl}/sessions/types`).subscribe({
      next: (response) => {
        if (response.success) {
          this.sessionTypes = response.data.session_types;
        }
      },
      error: (error) => {
        this.showMessage('Error loading session types', 'error');
      }
    });
  }

  selectType(type: SessionType) {
    this.selectedType = type;
    this.selectedSessions = [];
    this.loadSessions();
  }

  loadSessions() {
    if (!this.selectedType) return;

    const params = new URLSearchParams({
      type: this.selectedType.name
    });

    this.http.get<any>(`${environment.apiUrl}/sessions?${params}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.sessions = response.data.sessions;
          this.extractAvailableDates();
          this.filterSessions();
        }
      },
      error: (error) => {
        this.showMessage('Error loading sessions', 'error');
      }
    });
  }

  extractAvailableDates() {
    const dates = [...new Set(this.sessions.map(s => s.date))].sort();
    this.availableDates = dates;
  }

  filterSessions() {
    this.filteredSessions = this.sessions.filter(session => {
      const dateMatch = !this.selectedDate || session.date === this.selectedDate;
      const durationMatch = !this.selectedDuration || session.duration_minutes === Number(this.selectedDuration);
      return dateMatch && durationMatch;
    });
  }

  toggleSession(sessionId: number) {
    const index = this.selectedSessions.indexOf(sessionId);
    if (index > -1) {
      this.selectedSessions.splice(index, 1);
    } else {
      this.selectedSessions.push(sessionId);
    }
  }

  getSessionDetails(sessionId: number): string {
    const session = this.sessions.find(s => s.id === sessionId);
    if (!session) return '';
    return `${this.formatDate(session.date)} ${session.start_time.slice(0,5)} - ${session.session_type.name} (${session.duration_minutes}min)`;
  }

  getSessionPrice(sessionId: number): number {
    const session = this.sessions.find(s => s.id === sessionId);
    return session ? session.price : 0;
  }

  getTotalPrice(): number {
    return this.selectedSessions.reduce((total, sessionId) => {
      return total + this.getSessionPrice(sessionId);
    }, 0);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatDateDay(dateStr: string): string {
    const date = new Date(dateStr);
    return date.getDate().toString();
  }

  formatDateMonth(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  }

  submitBooking() {
    if (this.selectedSessions.length === 0) {
      this.showMessage('Please select at least one session', 'error');
      return;
    }

    this.isSubmitting = true;
    this.bookingData.sessions = this.selectedSessions;

    this.http.post<any>('/api/bookings', this.bookingData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage(`Booking confirmed! Reference: ${response.data.booking.booking_number}`, 'success');
          this.resetBooking();
        } else {
          this.showMessage('Booking failed. Please try again.', 'error');
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        this.showMessage('Booking failed. Please try again.', 'error');
        this.isSubmitting = false;
      }
    });
  }

  resetBooking() {
    this.showBookingForm = false;
    this.selectedSessions = [];
    this.bookingData = {
      client_name: '',
      client_email: '',
      client_phone: '',
      sessions: [],
      terms_accepted: false,
      special_requests: ''
    };
    this.loadSessions(); // Refresh sessions to show updated availability
  }

  showMessage(text: string, type: string) {
    this.message = { text, type };
    setTimeout(() => this.message = null, 5000);
  }

  scrollToSessions() {
    document.getElementById('sessions')?.scrollIntoView({ behavior: 'smooth' });
  }

  onTrainerImageError(event: any, trainerName: string) {
    // Generate a fallback avatar URL using UI Avatars if the primary image fails
    const fallbackUrl = this.generateFallbackAvatar(trainerName);
    event.target.src = fallbackUrl;
    // Remove the error handler to prevent infinite loop if fallback also fails  
    event.target.onerror = null;
  }

  private generateFallbackAvatar(name: string): string {
    const colors = ['6366f1', '8b5cf6', '06b6d4', '10b981', 'f59e0b', 'ef4444', 'ec4899', '84cc16', '6b7280', '3b82f6'];
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const background = colors[colorIndex];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=${background}&color=ffffff&format=png&rounded=true&bold=true`;
  }
}