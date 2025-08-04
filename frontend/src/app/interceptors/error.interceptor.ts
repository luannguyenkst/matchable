import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 400:
            errorMessage = error.error?.message || 'Bad request';
            break;
          case 401:
            errorMessage = 'Unauthorized access';
            break;
          case 403:
            errorMessage = 'Access forbidden';
            break;
          case 404:
            errorMessage = 'Resource not found';
            break;
          case 422:
            // Validation errors - handle these differently
            if (error.error?.details) {
              // Don't show global notification for validation errors
              // Let the component handle them
              return throwError(() => error);
            }
            errorMessage = error.error?.message || 'Validation failed';
            break;
          case 429:
            errorMessage = 'Too many requests. Please try again later.';
            break;
          case 500:
            errorMessage = 'Internal server error';
            router.navigate(['/500']);
            break;
          case 503:
            errorMessage = 'Service temporarily unavailable';
            break;
          default:
            errorMessage = error.error?.message || `HTTP Error ${error.status}`;
        }
      }

      // Don't show notifications for validation errors
      const shouldShowNotification = error.status !== 422;

      if (shouldShowNotification && error.status !== 401) {
        notificationService.error('Error', errorMessage);
      }

      return throwError(() => error);
    })
  );
};