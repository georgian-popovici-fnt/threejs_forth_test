import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

/**
 * Component for displaying toast notifications
 * Automatically displays notifications from the NotificationService
 */
@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent {
  private readonly notificationService = inject(NotificationService);

  /**
   * Get notifications from the service
   */
  protected readonly notifications = this.notificationService.notifications$;

  /**
   * Dismiss a notification
   */
  protected onDismiss(id: string): void {
    this.notificationService.dismiss(id);
  }

  /**
   * Get icon for notification type
   */
  protected getIcon(type: string): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  }
}
