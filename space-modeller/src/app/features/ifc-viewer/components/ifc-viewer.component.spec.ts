import { TestBed } from '@angular/core/testing';
import { IfcViewerComponent } from './ifc-viewer.component';
import { IfcViewerService } from '../services/ifc-viewer.service';
import { NotificationService } from '../../../shared/services/notification.service';

describe('IfcViewerComponent', () => {
  let mockViewerService: jasmine.SpyObj<IfcViewerService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    mockViewerService = jasmine.createSpyObj('IfcViewerService', [
      'initialize',
      'loadIfcFile',
      'exportFragments',
      'dispose',
      'getCurrentModel',
    ]);

    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'success',
      'error',
      'warning',
      'info',
    ]);

    await TestBed.configureTestingModule({
      imports: [IfcViewerComponent],
      providers: [
        { provide: IfcViewerService, useValue: mockViewerService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should dispose viewer service on destroy', () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    component.ngOnDestroy();

    expect(mockViewerService.dispose).toHaveBeenCalled();
  });

  it('should set loading state while loading IFC file', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    // Mock loadIfcFile to return a resolved promise
    mockViewerService.loadIfcFile.and.returnValue(Promise.resolve({ uuid: 'test-model' } as any));

    // Create a mock file
    const mockFile = new File([''], 'test.ifc', { type: 'application/octet-stream' });
    const mockEvent = {
      target: {
        files: [mockFile],
        value: '',
      },
    } as any;

    // Track loading state changes
    let loadingStates: boolean[] = [];
    component['isLoading'].update = (fn: (value: boolean) => boolean) => {
      const current = component['isLoading']();
      const newValue = fn(current);
      loadingStates.push(newValue);
      return newValue;
    };

    // Call onFileSelected
    await component['onFileSelected'](mockEvent);

    // Verify loadIfcFile was called
    expect(mockViewerService.loadIfcFile).toHaveBeenCalled();

    // Verify loading state is reset
    expect(component['isLoading']()).toBeFalse();
  });

  it('should show success notification when file loads successfully', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    // Mock loadIfcFile to return a resolved promise
    mockViewerService.loadIfcFile.and.returnValue(Promise.resolve({ uuid: 'test-model' } as any));

    // Create a mock file
    const mockFile = new File([''], 'test.ifc', { type: 'application/octet-stream' });
    const mockEvent = {
      target: {
        files: [mockFile],
        value: '',
      },
    } as any;

    // Call onFileSelected
    await component['onFileSelected'](mockEvent);

    // Verify notification service was called with success
    expect(mockNotificationService.success).toHaveBeenCalled();
  });

  it('should handle file loading errors gracefully', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    // Mock loadIfcFile to throw an error
    mockViewerService.loadIfcFile.and.returnValue(Promise.reject(new Error('Test error')));

    // Create a mock file
    const mockFile = new File([''], 'test.ifc', { type: 'application/octet-stream' });
    const mockEvent = {
      target: {
        files: [mockFile],
        value: '',
      },
    } as any;

    // Call onFileSelected
    await component['onFileSelected'](mockEvent);

    // Verify notification service was called with error
    expect(mockNotificationService.error).toHaveBeenCalled();

    // Verify loading state is reset even after error
    expect(component['isLoading']()).toBeFalse();
  });
});
