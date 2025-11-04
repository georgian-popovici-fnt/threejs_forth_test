import { Injectable, signal } from '@angular/core';
import { TIMING } from '../constants/app.constants';

/**
 * Notification types for different message severity levels
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Interface for notification messages
 */
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

/**
 * Service for displaying user notifications
 * Replaces browser alert() with a more user-friendly notification system
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly notifications = signal<Notification[]>([]);
  private readonly DEFAULT_DURATION = TIMING.NOTIFICATION_DURATION;

  /**
   * Get the current notifications as a read-only signal
   */
  readonly notifications$ = this.notifications.asReadonly();

  /**
   * Show a success notification
   */
  success(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.show('success', message, duration);
  }

  /**
   * Show an error notification
   */
  error(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.show('error', message, duration);
  }

  /**
   * Show a warning notification
   */
  warning(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.show('warning', message, duration);
  }

  /**
   * Show an info notification
   */
  info(message: string, duration: number = this.DEFAULT_DURATION): void {
    this.show('info', message, duration);
  }

  /**
   * Show a notification with a specific type
   */
  private show(type: NotificationType, message: string, duration: number): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      message,
      duration,
    };

    this.notifications.update((notifications) => [...notifications, notification]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(notification.id);
      }, duration);
    }
  }

  /**
   * Dismiss a notification by ID
   */
  dismiss(id: string): void {
    this.notifications.update((notifications) =>
      notifications.filter((n) => n.id !== id)
    );
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications.set([]);
  }

  /**
   * Generate a unique ID for notifications
   */
  private generateId(): string {
    return `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
