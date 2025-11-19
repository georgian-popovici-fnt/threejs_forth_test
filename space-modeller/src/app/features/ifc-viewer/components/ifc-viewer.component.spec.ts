import { TestBed } from '@angular/core/testing';
import { IfcViewerComponent } from './ifc-viewer.component';
import { IfcViewerService } from '../services/ifc-viewer.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { CameraMode } from '../../../shared/models/camera-mode.model';
import { LightMode } from '../../../shared/models/light-mode.model';

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

  it('should reject files with invalid extensions', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    const mockFile = new File([''], 'test.txt', { type: 'text/plain' });
    const mockEvent = {
      target: {
        files: [mockFile],
        value: '',
      },
    } as any;

    await component['onFileSelected'](mockEvent);

    expect(mockNotificationService.warning).toHaveBeenCalled();
    expect(mockViewerService.loadIfcFile).not.toHaveBeenCalled();
  });

  it('should reject files that are too large', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    // Create a file object with size exceeding the limit
    const largeFile = new File(['x'.repeat(1024 * 1024 * 501)], 'large.ifc', {
      type: 'application/octet-stream',
    });
    
    // Override the size property
    Object.defineProperty(largeFile, 'size', {
      value: 1024 * 1024 * 501, // 501 MB
      writable: false,
    });

    const mockEvent = {
      target: {
        files: [largeFile],
        value: '',
      },
    } as any;

    await component['onFileSelected'](mockEvent);

    expect(mockNotificationService.error).toHaveBeenCalled();
    expect(mockViewerService.loadIfcFile).not.toHaveBeenCalled();
  });

  it('should handle export fragments when model is loaded', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    mockViewerService.getCurrentModel.and.returnValue({ uuid: 'test-model' } as any);
    mockViewerService.exportFragments.and.returnValue(Promise.resolve());
    
    component['currentFileName'].set('test.ifc');

    await component['onExportFragments']();

    expect(mockViewerService.exportFragments).toHaveBeenCalledWith('test');
    expect(mockNotificationService.success).toHaveBeenCalled();
  });

  it('should show warning when trying to export without a model', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    mockViewerService.getCurrentModel.and.returnValue(null);

    await component['onExportFragments']();

    expect(mockNotificationService.warning).toHaveBeenCalled();
    expect(mockViewerService.exportFragments).not.toHaveBeenCalled();
  });

  it('should handle export errors gracefully', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    mockViewerService.getCurrentModel.and.returnValue({ uuid: 'test-model' } as any);
    mockViewerService.exportFragments.and.returnValue(Promise.reject(new Error('Export failed')));
    
    component['currentFileName'].set('test.ifc');

    await component['onExportFragments']();

    expect(mockNotificationService.error).toHaveBeenCalled();
  });

  it('should handle camera mode change', () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    mockViewerService.setCameraMode = jasmine.createSpy('setCameraMode');

    const cameraMode = CameraMode.ORTHOGRAPHIC_TOP;
    component['onCameraModeChange'](cameraMode);

    expect(mockViewerService.setCameraMode).toHaveBeenCalledWith(cameraMode);
    expect(component['currentCameraMode']()).toBe(cameraMode);
  });

  it('should handle camera mode change errors', () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    mockViewerService.setCameraMode = jasmine.createSpy('setCameraMode').and.throwError('Camera error');

    const cameraMode = CameraMode.ORTHOGRAPHIC_TOP;
    component['onCameraModeChange'](cameraMode);

    expect(mockNotificationService.error).toHaveBeenCalled();
  });

  it('should handle light mode change', () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    mockViewerService.setLightMode = jasmine.createSpy('setLightMode');

    const lightMode = LightMode.BRIGHT;
    component['onLightModeChange'](lightMode);

    expect(mockViewerService.setLightMode).toHaveBeenCalledWith(lightMode);
    expect(component['currentLightMode']()).toBe(lightMode);
  });

  it('should handle light mode change errors', () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    mockViewerService.setLightMode = jasmine.createSpy('setLightMode').and.throwError('Light error');

    const lightMode = LightMode.BRIGHT;
    component['onLightModeChange'](lightMode);

    expect(mockNotificationService.error).toHaveBeenCalled();
  });

  it('should handle canvas mouse down for left click', () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    const mockEvent = { button: 0 } as MouseEvent;

    component['onCanvasMouseDown'](mockEvent);

    expect(component['isDragging']()).toBeTrue();
  });

  it('should not set dragging for non-left clicks', () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    const mockEvent = { button: 1 } as MouseEvent; // Middle click

    component['onCanvasMouseDown'](mockEvent);

    expect(component['isDragging']()).toBeFalse();
  });

  it('should handle canvas mouse up', () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    component['isDragging'].set(true);
    component['onCanvasMouseUp']();

    expect(component['isDragging']()).toBeFalse();
  });

  it('should handle class visibility change', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    // Set up some classes
    component['ifcClasses'].set([
      { name: 'IFCWALL', visible: true, itemIds: [1, 2, 3] },
      { name: 'IFCDOOR', visible: true, itemIds: [4, 5] },
    ]);

    await component['onClassVisibilityChange']({ className: 'IFCWALL', visible: false });

    expect(mockViewerService.setItemsVisible).toHaveBeenCalledWith([1, 2, 3], false);
    
    const updatedClasses = component['ifcClasses']();
    const wallClass = updatedClasses.find(c => c.name === 'IFCWALL');
    expect(wallClass?.visible).toBeFalse();
  });

  it('should handle class visibility change for non-existent class', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    component['ifcClasses'].set([
      { name: 'IFCWALL', visible: true, itemIds: [1, 2, 3] },
    ]);

    await component['onClassVisibilityChange']({ className: 'NONEXISTENT', visible: false });

    // Should not call setItemsVisible for non-existent class
    expect(mockViewerService.setItemsVisible).not.toHaveBeenCalled();
  });

  it('should handle class visibility change errors', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    component['ifcClasses'].set([
      { name: 'IFCWALL', visible: true, itemIds: [1, 2, 3] },
    ]);

    mockViewerService.setItemsVisible.and.returnValue(Promise.reject(new Error('Visibility error')));

    await component['onClassVisibilityChange']({ className: 'IFCWALL', visible: false });

    expect(mockNotificationService.error).toHaveBeenCalled();
  });

  it('should handle file selection with no file', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    const mockEvent = {
      target: {
        files: [],
        value: '',
      },
    } as any;

    await component['onFileSelected'](mockEvent);

    expect(mockViewerService.loadIfcFile).not.toHaveBeenCalled();
  });

  it('should load IFC classes after successful file load', async () => {
    const fixture = TestBed.createComponent(IfcViewerComponent);
    const component = fixture.componentInstance;

    mockViewerService.getCategories.and.returnValue(
      Promise.resolve(['IFCWALL', 'IFCDOOR'])
    );
    mockViewerService.getItemsOfCategories.and.returnValue(
      Promise.resolve({
        IFCWALL: [1, 2, 3],
        IFCDOOR: [4, 5],
      })
    );
    mockViewerService.loadIfcFile.and.returnValue(Promise.resolve({ uuid: 'test-model' } as any));

    const mockFile = new File([''], 'test.ifc', { type: 'application/octet-stream' });
    const mockEvent = {
      target: {
        files: [mockFile],
        value: '',
      },
    } as any;

    await component['onFileSelected'](mockEvent);
    await fixture.whenStable();

    expect(mockViewerService.getCategories).toHaveBeenCalled();
    expect(mockViewerService.getItemsOfCategories).toHaveBeenCalled();
    
    const ifcClasses = component['ifcClasses']();
    expect(ifcClasses.length).toBe(2);
  });
});
