import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading indicator for certain requests
  const skipLoadingPaths = [
    '/auth/refresh',
    '/booking', // GET booking requests are frequent
  ];

  const shouldShowLoading = !skipLoadingPaths.some(path => 
    req.url.includes(path)
  ) && req.method !== 'GET'; // Don't show loading for GET requests by default

  if (shouldShowLoading) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (shouldShowLoading) {
        loadingService.hide();
      }
    })
  );
};