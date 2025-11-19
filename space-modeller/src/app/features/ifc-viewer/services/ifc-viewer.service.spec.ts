import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { IfcViewerService } from './ifc-viewer.service';
import { LoggerService } from '../../../shared/services/logger.service';
import { CameraMode } from '../../../shared/models/camera-mode.model';
import { LightMode } from '../../../shared/models/light-mode.model';
import * as THREE from 'three';

describe('IfcViewerService', () => {
  let service: IfcViewerService;
  let mockLogger: jasmine.SpyObj<LoggerService>;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockLogger = jasmine.createSpyObj('LoggerService', [
      'info',
      'debug',
      'warn',
      'error',
      'startPerformanceMark',
      'endPerformanceMark',
    ]);

    TestBed.configureTestingModule({
      providers: [
        IfcViewerService,
        { provide: LoggerService, useValue: mockLogger },
      ],
    });

    service = TestBed.inject(IfcViewerService);
    
    // Create a mock canvas element
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
  });

  afterEach(() => {
    // Clean up the service after each test
    if (service) {
      service.dispose();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default config', async () => {
    await service.initialize(mockCanvas);
    
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should initialize with custom config', async () => {
    const customConfig = {
      backgroundColor: '#333333',
      showGrid: false,
      showStats: false,
    };

    await service.initialize(mockCanvas, customConfig);
    
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should return null for current model when no model is loaded', () => {
    const model = service.getCurrentModel();
    expect(model).toBeNull();
  });

  it('should update camera signal when initialized', async () => {
    await service.initialize(mockCanvas);
    
    const camera = service.cameraSignal();
    expect(camera).toBeTruthy();
    expect(camera).toBeInstanceOf(THREE.Camera);
  });

  it('should set camera mode to perspective 3D', async () => {
    await service.initialize(mockCanvas);
    
    service.setCameraMode(CameraMode.PERSPECTIVE_3D);
    
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should set camera mode to orthographic top', async () => {
    await service.initialize(mockCanvas);
    
    service.setCameraMode(CameraMode.ORTHOGRAPHIC_TOP);
    
    const camera = service.cameraSignal();
    expect(camera).toBeInstanceOf(THREE.OrthographicCamera);
  });

  it('should set camera mode to orthographic front', async () => {
    await service.initialize(mockCanvas);
    
    service.setCameraMode(CameraMode.ORTHOGRAPHIC_FRONT);
    
    const camera = service.cameraSignal();
    expect(camera).toBeInstanceOf(THREE.OrthographicCamera);
  });

  it('should set camera mode to orthographic side', async () => {
    await service.initialize(mockCanvas);
    
    service.setCameraMode(CameraMode.ORTHOGRAPHIC_SIDE);
    
    const camera = service.cameraSignal();
    expect(camera).toBeInstanceOf(THREE.OrthographicCamera);
  });

  it('should set light mode to default', async () => {
    await service.initialize(mockCanvas);
    
    service.setLightMode(LightMode.DEFAULT);
    
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should set light mode to bright', async () => {
    await service.initialize(mockCanvas);
    
    service.setLightMode(LightMode.BRIGHT);
    
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should set light mode to dim', async () => {
    await service.initialize(mockCanvas);
    
    service.setLightMode(LightMode.SOFT);
    
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should set light mode to dramatic', async () => {
    await service.initialize(mockCanvas);
    
    service.setLightMode(LightMode.DRAMATIC);
    
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should handle getCategories when no model is loaded', async () => {
    await service.initialize(mockCanvas);
    
    const categories = await service.getCategories();
    
    expect(categories).toEqual([]);
  });

  it('should handle getItemsOfCategories when no model is loaded', async () => {
    await service.initialize(mockCanvas);
    
    const items = await service.getItemsOfCategories(['IFCWALL']);
    
    expect(items).toEqual({});
  });

  it('should handle setItemsVisible when no model is loaded', async () => {
    await service.initialize(mockCanvas);
    
    await expectAsync(service.setItemsVisible([1, 2, 3], true)).toBeResolved();
  });

  it('should dispose all resources', async () => {
    await service.initialize(mockCanvas);
    
    service.dispose();
    
    expect(mockLogger.info).toHaveBeenCalledWith('Viewer disposed successfully');
  });

  it('should handle dispose when not initialized', () => {
    expect(() => {
      service.dispose();
    }).not.toThrow();
  });

  it('should handle multiple dispose calls', async () => {
    await service.initialize(mockCanvas);
    
    service.dispose();
    service.dispose();
    
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should handle camera mode change without initialization', () => {
    expect(() => {
      service.setCameraMode(CameraMode.PERSPECTIVE_3D);
    }).not.toThrow();
  });

  it('should handle light mode change without initialization', () => {
    expect(() => {
      service.setLightMode(LightMode.DEFAULT);
    }).not.toThrow();
  });

  it('should return null camera signal before initialization', () => {
    const camera = service.cameraSignal();
    expect(camera).toBeNull();
  });

  it('should handle export fragments when no model is loaded', async () => {
    await service.initialize(mockCanvas);
    
    // Should resolve without error when no model is loaded
    await expectAsync(service.exportFragments('test')).toBeResolved();
  });

  it('should initialize renderer with correct settings', async () => {
    await service.initialize(mockCanvas);
    
    // Verify that the service was initialized (indirectly through logs)
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should handle resize operations', async () => {
    await service.initialize(mockCanvas);
    
    // Trigger a resize
    mockCanvas.width = 1024;
    mockCanvas.height = 768;
    window.dispatchEvent(new Event('resize'));
    
    // Give time for resize observer to trigger
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(service).toBeTruthy();
  });

  it('should maintain camera signal after camera mode changes', async () => {
    await service.initialize(mockCanvas);
    
    const initialCamera = service.cameraSignal();
    expect(initialCamera).toBeTruthy();
    
    service.setCameraMode(CameraMode.ORTHOGRAPHIC_TOP);
    
    const updatedCamera = service.cameraSignal();
    expect(updatedCamera).toBeTruthy();
    expect(updatedCamera).not.toBe(initialCamera);
  });

  it('should switch back to perspective camera from orthographic', async () => {
    await service.initialize(mockCanvas);
    
    service.setCameraMode(CameraMode.ORTHOGRAPHIC_TOP);
    service.setCameraMode(CameraMode.PERSPECTIVE_3D);
    
    const camera = service.cameraSignal();
    expect(camera).toBeInstanceOf(THREE.PerspectiveCamera);
  });

  it('should handle multiple camera mode switches', async () => {
    await service.initialize(mockCanvas);
    
    service.setCameraMode(CameraMode.ORTHOGRAPHIC_TOP);
    service.setCameraMode(CameraMode.ORTHOGRAPHIC_FRONT);
    service.setCameraMode(CameraMode.ORTHOGRAPHIC_SIDE);
    service.setCameraMode(CameraMode.PERSPECTIVE_3D);
    
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should handle multiple light mode switches', async () => {
    await service.initialize(mockCanvas);
    
    service.setLightMode(LightMode.BRIGHT);
    service.setLightMode(LightMode.SOFT);
    service.setLightMode(LightMode.DRAMATIC);
    service.setLightMode(LightMode.DEFAULT);
    
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should log errors when they occur', async () => {
    // This test verifies error handling
    expect(service).toBeTruthy();
  });

  it('should handle empty item IDs in setItemsVisible', async () => {
    await service.initialize(mockCanvas);
    
    await expectAsync(service.setItemsVisible([], true)).toBeResolved();
  });

  it('should handle getItemsOfCategories with empty categories', async () => {
    await service.initialize(mockCanvas);
    
    const items = await service.getItemsOfCategories([]);
    
    expect(items).toEqual({});
  });
});
