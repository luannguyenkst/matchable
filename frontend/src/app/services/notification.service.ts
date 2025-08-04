import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NotificationData } from '../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private defaultDuration = 5000; // 5 seconds

  success(title: string, message?: string, duration?: number): void {
    this.show({
      type: 'success',
      title,
      message,
      duration: duration ?? this.defaultDuration
    });
  }

  error(title: string, message?: string, duration?: number): void {
    this.show({
      type: 'error',
      title,
      message,
      duration: duration ?? this.defaultDuration,
      persistent: true // Errors should be persistent by default
    });
  }

  warning(title: string, message?: string, duration?: number): void {
    this.show({
      type: 'warning',
      title,
      message,
      duration: duration ?? this.defaultDuration
    });
  }

  info(title: string, message?: string, duration?: number): void {
    this.show({
      type: 'info',
      title,
      message,
      duration: duration ?? this.defaultDuration
    });
  }

  show(notification: Omit<NotificationData, 'id'>): void {
    const id = this.generateId();
    const fullNotification: NotificationData = {
      ...notification,
      id
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, fullNotification]);

    // Auto-dismiss if not persistent
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, notification.duration);
    }
  }

  dismiss(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }

  dismissAll(): void {
    this.notificationsSubject.next([]);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}