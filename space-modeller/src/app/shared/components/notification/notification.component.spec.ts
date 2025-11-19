import { TestBed } from '@angular/core/testing';
import { NotificationComponent } from './notification.component';
import { NotificationService } from '../../services/notification.service';

describe('NotificationComponent', () => {
  let service: NotificationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationComponent],
    }).compileComponents();

    service = TestBed.inject(NotificationService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NotificationComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should display notifications from the service', () => {
    const fixture = TestBed.createComponent(NotificationComponent);
    fixture.detectChanges();

    service.success('Test notification');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.notification')).toBeTruthy();
    expect(compiled.textContent).toContain('Test notification');
  });

  it('should dismiss notification when close button is clicked', () => {
    const fixture = TestBed.createComponent(NotificationComponent);
    fixture.detectChanges();

    service.success('Test notification');
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector(
      '.notification-close'
    ) as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();

    expect(service.notifications$().length).toBe(0);
  });

  it('should return correct icon for each notification type', () => {
    const fixture = TestBed.createComponent(NotificationComponent);
    const component = fixture.componentInstance;

    expect(component['getIcon']('success')).toBe('✓');
    expect(component['getIcon']('error')).toBe('✕');
    expect(component['getIcon']('warning')).toBe('⚠');
    expect(component['getIcon']('info')).toBe('ℹ');
  });

  it('should return default icon for unknown type', () => {
    const fixture = TestBed.createComponent(NotificationComponent);
    const component = fixture.componentInstance;

    expect(component['getIcon']('unknown')).toBe('ℹ');
  });

  it('should display multiple notifications', () => {
    const fixture = TestBed.createComponent(NotificationComponent);
    fixture.detectChanges();

    service.success('Notification 1');
    service.error('Notification 2');
    service.warning('Notification 3');
    fixture.detectChanges();

    const notifications = fixture.nativeElement.querySelectorAll('.notification');
    expect(notifications.length).toBe(3);
  });

  it('should call dismiss on service when onDismiss is called', () => {
    const fixture = TestBed.createComponent(NotificationComponent);
    const component = fixture.componentInstance;
    
    spyOn(service, 'dismiss');
    
    component['onDismiss']('test-id');
    
    expect(service.dismiss).toHaveBeenCalledWith('test-id');
  });

  it('should display correct notification types with proper styling', () => {
    const fixture = TestBed.createComponent(NotificationComponent);
    fixture.detectChanges();

    service.success('Success message');
    fixture.detectChanges();

    const notification = fixture.nativeElement.querySelector('.notification');
    expect(notification.classList.contains('notification-success')).toBe(true);
  });
});
