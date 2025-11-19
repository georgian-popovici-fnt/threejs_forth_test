import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a success notification', () => {
    service.success('Test success message');
    const notifications = service.notifications$();
    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('success');
    expect(notifications[0].message).toBe('Test success message');
  });

  it('should add an error notification', () => {
    service.error('Test error message');
    const notifications = service.notifications$();
    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('error');
    expect(notifications[0].message).toBe('Test error message');
  });

  it('should add a warning notification', () => {
    service.warning('Test warning message');
    const notifications = service.notifications$();
    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('warning');
    expect(notifications[0].message).toBe('Test warning message');
  });

  it('should add an info notification', () => {
    service.info('Test info message');
    const notifications = service.notifications$();
    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('info');
    expect(notifications[0].message).toBe('Test info message');
  });

  it('should dismiss a notification', () => {
    service.success('Test message');
    const notifications = service.notifications$();
    const id = notifications[0].id;

    service.dismiss(id);

    expect(service.notifications$().length).toBe(0);
  });

  it('should clear all notifications', () => {
    service.success('Message 1');
    service.error('Message 2');
    service.warning('Message 3');

    expect(service.notifications$().length).toBe(3);

    service.clearAll();

    expect(service.notifications$().length).toBe(0);
  });

  it('should auto-dismiss notifications after duration', (done) => {
    service.success('Test message', 100);

    expect(service.notifications$().length).toBe(1);

    setTimeout(() => {
      expect(service.notifications$().length).toBe(0);
      done();
    }, 150);
  });

  it('should not auto-dismiss notifications with duration 0', (done) => {
    service.success('Test message', 0);

    expect(service.notifications$().length).toBe(1);

    setTimeout(() => {
      expect(service.notifications$().length).toBe(1);
      done();
    }, 150);
  });

  it('should generate unique IDs for notifications', () => {
    service.success('Message 1');
    service.success('Message 2');

    const notifications = service.notifications$();
    expect(notifications[0].id).not.toBe(notifications[1].id);
  });

  it('should set correct duration for notifications', () => {
    service.success('Test message', 5000);

    const notification = service.notifications$()[0];
    expect(notification.duration).toBe(5000);
  });

  it('should use default duration when not specified', () => {
    service.success('Test message');

    const notification = service.notifications$()[0];
    expect(notification.duration).toBeGreaterThan(0);
  });

  it('should handle dismissing non-existent notification', () => {
    service.success('Test message');
    
    expect(() => {
      service.dismiss('non-existent-id');
    }).not.toThrow();
    
    expect(service.notifications$().length).toBe(1);
  });

  it('should maintain order of notifications', () => {
    service.success('Message 1');
    service.error('Message 2');
    service.warning('Message 3');

    const notifications = service.notifications$();
    expect(notifications[0].message).toBe('Message 1');
    expect(notifications[1].message).toBe('Message 2');
    expect(notifications[2].message).toBe('Message 3');
  });

  it('should dismiss only the specified notification', () => {
    service.success('Message 1');
    service.error('Message 2');
    service.warning('Message 3');

    const notifications = service.notifications$();
    const idToRemove = notifications[1].id;

    service.dismiss(idToRemove);

    const remainingNotifications = service.notifications$();
    expect(remainingNotifications.length).toBe(2);
    expect(remainingNotifications.find(n => n.id === idToRemove)).toBeUndefined();
  });
});
