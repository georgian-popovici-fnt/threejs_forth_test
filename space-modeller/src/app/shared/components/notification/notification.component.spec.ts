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
});
