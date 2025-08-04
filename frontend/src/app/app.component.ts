import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';

import { HeaderComponent } from './components/layout/header/header.component';
import { FooterComponent } from './components/layout/footer/footer.component';
import { LoadingService } from './services/loading.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    FooterComponent
  ],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <!-- Global Loading Indicator -->
      <div 
        *ngIf="isLoading$ | async" 
        class="fixed top-0 left-0 w-full h-1 bg-primary-200 z-50"
      >
        <div class="h-full bg-primary-600 animate-pulse"></div>
      </div>

      <!-- Global Notifications -->
      <div class="fixed top-4 right-4 z-50 space-y-2">
        <div
          *ngFor="let notification of notifications"
          class="w-[350px] shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300"
          [ngClass]="{
            'bg-success-50 border-l-4 border-success-400': notification.type === 'success',
            'bg-error-50 border-l-4 border-error-400': notification.type === 'error',
            'bg-warning-50 border-l-4 border-warning-400': notification.type === 'warning',
            'bg-primary-50 border-l-4 border-primary-400': notification.type === 'info'
          }"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <!-- Success Icon -->
                <svg 
                  *ngIf="notification.type === 'success'"
                  class="h-5 w-5 text-success-400" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                
                <!-- Error Icon -->
                <svg 
                  *ngIf="notification.type === 'error'" 
                  class="h-5 w-5 text-error-400" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
                
                <!-- Warning Icon -->
                <svg 
                  *ngIf="notification.type === 'warning'" 
                  class="h-5 w-5 text-warning-400" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                
                <!-- Info Icon -->
                <svg 
                  *ngIf="notification.type === 'info'" 
                  class="h-5 w-5 text-primary-400" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              </div>
              
              <div class="ml-3 w-0 flex-1">
                <p 
                  class="text-sm font-medium"
                  [ngClass]="{
                    'text-success-800': notification.type === 'success',
                    'text-error-800': notification.type === 'error',
                    'text-warning-800': notification.type === 'warning',
                    'text-primary-800': notification.type === 'info'
                  }"
                >
                  {{ notification.title }}
                </p>
                <p 
                  *ngIf="notification.message"
                  class="mt-1 text-sm"
                  [ngClass]="{
                    'text-success-700': notification.type === 'success',
                    'text-error-700': notification.type === 'error',
                    'text-warning-700': notification.type === 'warning',
                    'text-primary-700': notification.type === 'info'
                  }"
                >
                  {{ notification.message }}
                </p>
              </div>
              
              <div class="ml-4 flex-shrink-0 flex">
                <button
                  class="rounded-md inline-flex focus:outline-none focus:ring-2 focus:ring-offset-2"
                  [ngClass]="{
                    'text-success-400 hover:text-success-500 focus:ring-success-600': notification.type === 'success',
                    'text-error-400 hover:text-error-500 focus:ring-error-600': notification.type === 'error',
                    'text-warning-400 hover:text-warning-500 focus:ring-warning-600': notification.type === 'warning',
                    'text-primary-400 hover:text-primary-500 focus:ring-primary-600': notification.type === 'info'
                  }"
                  (click)="dismissNotification(notification.id)"
                >
                  <span class="sr-only">Close</span>
                  <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Header -->
      <app-header></app-header>

      <!-- Main Content -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <app-footer></app-footer>
    </div>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  isLoading$: Observable<boolean>;
  notifications: any[] = [];

  constructor(
    private loadingService: LoadingService,
    private notificationService: NotificationService
  ) {
    this.isLoading$ = this.loadingService.loading$;
  }

  ngOnInit(): void {
    // Subscribe to notifications
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
  }

  dismissNotification(id: string): void {
    this.notificationService.dismiss(id);
  }
}