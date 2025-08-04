import { Routes } from '@angular/router';

export const routes: Routes = [
  // Home - Redirect to checkout for this demo
  {
    path: '',
    redirectTo: '/checkout',
    pathMatch: 'full'
  },

  // Checkout - Main booking page
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent),
    title: 'Book Training Sessions - Matchable'
  },

  // Booking Confirmation
  {
    path: 'booking-confirmation',
    loadComponent: () => import('./pages/booking-confirmation/booking-confirmation.component').then(m => m.BookingConfirmationComponent),
    title: 'Booking Confirmed - Matchable'
  },

  // Home
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'Matchable - Premium Training Sessions'
  },

  // Session Detail
  {
    path: 'sessions/:id',
    loadComponent: () => import('./pages/session-detail/session-detail.component').then(m => m.SessionDetailComponent),
    title: 'Session Details - Matchable'
  },

  // Wildcard - redirect all unknown routes to checkout
  {
    path: '**',
    redirectTo: '/checkout'
  }
];