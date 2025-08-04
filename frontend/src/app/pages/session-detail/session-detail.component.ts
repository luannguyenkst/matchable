import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { Session } from '../../models/session.model';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Loading State -->
      <div *ngIf="loading" class="flex justify-center items-center min-h-screen">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="container mx-auto px-4 py-16 text-center">
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h2 class="text-xl font-semibold text-red-800 mb-2">Session Not Found</h2>
          <p class="text-red-600 mb-4">{{ error }}</p>
          <button 
            (click)="goBack()"
            class="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition duration-300">
            Back to Sessions
          </button>
        </div>
      </div>

      <!-- Session Detail Content -->
      <div *ngIf="session && !loading" class="container mx-auto px-4 py-8">
        <!-- Navigation -->
        <div class="mb-6">
          <button 
            (click)="goBack()"
            class="flex items-center text-primary-600 hover:text-primary-700 transition duration-300">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Sessions
          </button>
        </div>

        <!-- Session Header -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div class="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold mb-2">
                  {{ session.session_type.name | titlecase }} Session
                </h1>
                <div class="flex items-center space-x-4 text-primary-100">
                  <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z"></path>
                    </svg>
                    {{ formatDate(session.date) }}
                  </div>
                  <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ session.start_time.slice(0,5) }} - {{ session.end_time.slice(0,5) }}
                  </div>
                  <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ session.duration_minutes }} minutes
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-4xl font-bold mb-2">€{{ session.price }}</div>
                <div class="text-primary-200">
                  {{ session.available_spots }} {{ session.available_spots === 1 ? 'spot' : 'spots' }} available
                </div>
              </div>
            </div>
          </div>

          <!-- Session Status -->
          <div class="p-6 border-b">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <span 
                  class="px-4 py-2 rounded-full text-sm font-medium"
                  [class]="getStatusColor(session.status)">
                  {{ session.status | titlecase }}
                </span>
                <span class="text-gray-600">
                  {{ session.current_participants }}/{{ session.max_participants }} participants
                </span>
              </div>
              <button 
                *ngIf="session.status === 'available' && session.available_spots > 0"
                class="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition duration-300">
                Book This Session
              </button>
            </div>
          </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Session Description -->
            <div class="bg-white rounded-lg shadow p-6">
              <h2 class="text-2xl font-bold text-gray-900 mb-4">About This Session</h2>
              <p class="text-gray-600 leading-relaxed mb-6">
                {{ session.session_type.description }}
              </p>
              
              <!-- Session Notes -->
              <div *ngIf="session.notes" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="font-semibold text-blue-900 mb-2">Special Notes</h3>
                <p class="text-blue-800">{{ session.notes }}</p>
              </div>
            </div>

            <!-- Trainer Details -->
            <div class="bg-white rounded-lg shadow p-6">
              <h2 class="text-2xl font-bold text-gray-900 mb-6">Your Trainer</h2>
              
              <div class="flex items-start space-x-6">
                <!-- Trainer Avatar -->
                <div class="flex-shrink-0">
                  <div class="w-24 h-24 rounded-full bg-gray-200 overflow-hidden shadow-md">
                    <img [src]="session.trainer.image_url" 
                         [alt]="session.trainer.name"
                         class="w-full h-full object-cover"
                         (error)="onImageError($event)">
                  </div>
                </div>

                <!-- Trainer Info -->
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-gray-900 mb-2">
                    {{ session.trainer.name }}
                  </h3>
                  
                  <!-- Specializations -->
                  <div class="mb-4">
                    <h4 class="font-medium text-gray-700 mb-2">Specializations</h4>
                    <div class="flex flex-wrap gap-2">
                      <span *ngFor="let spec of session.trainer.specializations"
                            class="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                        {{ spec }}
                      </span>
                    </div>
                  </div>

                  <!-- Bio -->
                  <div>
                    <h4 class="font-medium text-gray-700 mb-2">About</h4>
                    <p class="text-gray-600 leading-relaxed">
                      {{ session.trainer.bio }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Session Summary -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-4">Session Summary</h3>
              
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">Date</span>
                  <span class="font-medium">{{ formatDate(session.date) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Time</span>
                  <span class="font-medium">{{ session.start_time.slice(0,5) }} - {{ session.end_time.slice(0,5) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Duration</span>
                  <span class="font-medium">{{ session.duration_minutes }} minutes</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Type</span>
                  <span class="font-medium">{{ session.session_type.name | titlecase }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Trainer</span>
                  <span class="font-medium">{{ session.trainer.name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Available Spots</span>
                  <span class="font-medium">{{ session.available_spots }}</span>
                </div>
                <hr class="my-4">
                <div class="flex justify-between text-lg font-bold">
                  <span>Price</span>
                  <span class="text-primary-600">€{{ session.price }}</span>
                </div>
              </div>

              <!-- Book Button -->
              <button 
                *ngIf="session.status === 'available' && session.available_spots > 0"
                class="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition duration-300">
                Book This Session
              </button>

              <!-- Unavailable Message -->
              <div *ngIf="session.status !== 'available' || session.available_spots === 0"
                   class="mt-6 p-3 bg-gray-100 rounded-lg text-center text-gray-600">
                This session is currently unavailable
              </div>
            </div>

            <!-- Session Type Info -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-bold text-gray-900 mb-4">
                {{ session.session_type.name | titlecase }} Training
              </h3>
              <div class="text-center mb-4">
                <span class="text-4xl">
                  {{ getSessionTypeIcon(session.session_type.name) }}
                </span>
              </div>
              <p class="text-gray-600 text-sm leading-relaxed">
                {{ session.session_type.description }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
    }
  `]
})
export class SessionDetailComponent implements OnInit {
  session: Session | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    const sessionId = this.route.snapshot.paramMap.get('id');
    if (sessionId) {
      this.loadSession(parseInt(sessionId));
    } else {
      this.error = 'Invalid session ID';
      this.loading = false;
    }
  }

  loadSession(id: number) {
    this.sessionService.getSession(id).subscribe({
      next: (session) => {
        this.session = session;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Session not found or no longer available';
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/checkout']);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTrainerInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  onImageError(event: any) {
    // Generate a fallback avatar URL using UI Avatars if the primary image fails
    if (this.session) {
      const fallbackUrl = this.generateFallbackAvatar(this.session.trainer.name);
      event.target.src = fallbackUrl;
      // Remove the error handler to prevent infinite loop if fallback also fails
      event.target.onerror = null;
    }
  }

  private generateFallbackAvatar(name: string): string {
    const initials = this.getTrainerInitials(name);
    const colors = ['6366f1', '8b5cf6', '06b6d4', '10b981', 'f59e0b', 'ef4444', 'ec4899', '84cc16', '6b7280', '3b82f6'];
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const background = colors[colorIndex];
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=${background}&color=ffffff&format=png&rounded=true&bold=true`;
  }
}