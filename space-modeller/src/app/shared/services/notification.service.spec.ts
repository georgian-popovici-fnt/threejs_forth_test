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
});
