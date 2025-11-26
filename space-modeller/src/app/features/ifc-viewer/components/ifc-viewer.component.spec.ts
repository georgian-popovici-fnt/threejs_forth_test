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
      'getCategories',
      'getItemsOfCategories',
      'setItemsVisible',
    ]);

    // Add default return values for new methods
    mockViewerService.getCategories.and.returnValue(Promise.resolve([]));
    mockViewerService.getItemsOfCategories.and.returnValue(Promise.resolve({}));
    mockViewerService.setItemsVisible.and.returnValue(Promise.resolve());

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

  it('should toggle sidebar state', () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    expect(component['isSidebarCollapsed']()).toBeFalse();

    component['toggleSidebar']();
    expect(component['isSidebarCollapsed']()).toBeTrue();

    component['toggleSidebar']();
    expect(component['isSidebarCollapsed']()).toBeFalse();
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

  it('should hide IFCSPACE elements by default when loading IFC classes', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    // Mock the viewer service to return categories including IFCSPACE
    mockViewerService.getCategories.and.returnValue(
      Promise.resolve(['IFCWALL', 'IFCSPACE', 'IFCSLAB'])
    );
    mockViewerService.getItemsOfCategories.and.returnValue(
      Promise.resolve({
        IFCWALL: [1, 2, 3],
        IFCSPACE: [4, 5],
        IFCSLAB: [6, 7, 8],
      })
    );
    mockViewerService.loadIfcFile.and.returnValue(Promise.resolve({ uuid: 'test-model' } as any));

    // Create a mock file
    const mockFile = new File([''], 'test.ifc', { type: 'application/octet-stream' });
    const mockEvent = {
      target: {
        files: [mockFile],
        value: '',
      },
    } as any;

    // Call onFileSelected which will load IFC classes
    await component['onFileSelected'](mockEvent);

    // Wait for promises to resolve
    await fixture.whenStable();

    // Verify that IFCSPACE items were set to not visible
    const setVisibleCalls = mockViewerService.setItemsVisible.calls.all();
    const ifcSpaceCall = setVisibleCalls.find(
      call => call.args[0].toString() === '4,5' // IFCSPACE item IDs
    );

    expect(ifcSpaceCall).toBeDefined();
    expect(ifcSpaceCall?.args[1]).toBeFalse(); // visible parameter should be false

    // Verify that other classes are visible
    const ifcWallCall = setVisibleCalls.find(
      call => call.args[0].toString() === '1,2,3' // IFCWALL item IDs
    );
    expect(ifcWallCall).toBeDefined();
    expect(ifcWallCall?.args[1]).toBeTrue(); // visible parameter should be true

    // Verify the ifcClasses signal has correct visibility state
    const ifcClasses = component['ifcClasses']();
    const ifcSpaceClass = ifcClasses.find(c => c.name === 'IFCSPACE');
    expect(ifcSpaceClass?.visible).toBeFalse();

    const ifcWallClass = ifcClasses.find(c => c.name === 'IFCWALL');
    expect(ifcWallClass?.visible).toBeTrue();
  });
});
