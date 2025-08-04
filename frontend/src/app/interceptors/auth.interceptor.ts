import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiService } from '../services/api.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiService = inject(ApiService);

  // Clone the request to add new headers
  let authReq = req.clone();

  // Add Booking Session ID header if it exists
  const bookingSessionId = apiService.getBookingSessionId();
  if (bookingSessionId) {
    authReq = authReq.clone({
      setHeaders: {
        'X-Booking-Session-ID': bookingSessionId
      }
    });
  }

  return next(authReq);
};