import { Injectable, inject, NgZone, signal } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import * as OBC from '@thatopen/components';
import * as FRAGS from '@thatopen/fragments';
import { ViewerConfig, DEFAULT_VIEWER_CONFIG } from '../../../shared/models/viewer-config.model';
import { CameraMode } from '../../../shared/models/camera-mode.model';
import { LightMode } from '../../../shared/models/light-mode.model';
import { TIMING, VIEWER } from '../../../shared/constants/app.constants';
import { LoggerService } from '../../../shared/services/logger.service';
import { environment } from '../../../../environments/environment';

/**
 * Service that manages the 3D viewer, Three.js renderer, and @thatopen/components
 */
@Injectable({
  providedIn: 'root',
})
export class IfcViewerService {
  private readonly ngZone = inject(NgZone);
  private readonly logger = inject(LoggerService);

  // Camera constants
  private readonly ORTHOGRAPHIC_FRUSTUM_SIZE = 20;
  private readonly ORTHOGRAPHIC_CAMERA_DISTANCE = 50;

  private canvas: HTMLCanvasElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera | null = null;
  private perspectiveCamera: THREE.PerspectiveCamera | null = null;
  private orthographicCamera: THREE.OrthographicCamera | null = null;
  private currentCameraMode: CameraMode = CameraMode.PERSPECTIVE_3D;
  private controls: OrbitControls | null = null;
  private components: OBC.Components | null = null;
  private fragmentsManager: OBC.FragmentsManager | null = null;
  private ifcLoader: OBC.IfcLoader | null = null;
  private stats: Stats | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private config: ViewerConfig = DEFAULT_VIEWER_CONFIG;
  private currentModel: FRAGS.FragmentsModel | null = null;
  private lastUpdateTime: number = 0;

  // Lighting properties
  private ambientLight: THREE.AmbientLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private currentLightMode: LightMode = LightMode.DEFAULT;

  // Public signal for the current camera (for reactive UI updates)
  public readonly cameraSignal = signal<THREE.Camera | null>(null);

  /**
   * Initialize the viewer with a canvas element
   */
  async initialize(canvas: HTMLCanvasElement, config: Partial<ViewerConfig> = {}): Promise<void> {
    this.config = { ...DEFAULT_VIEWER_CONFIG, ...config };
    this.canvas = canvas;

    // Initialize Three.js renderer with modern defaults
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });

    // Set modern rendering settings
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, VIEWER.MAX_PIXEL_RATIO));

    // Create scene with dark background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.backgroundColor);

    // Initialize both perspective and orthographic cameras
    this.initializeCameras(canvas);

    // Initialize @thatopen/components
    this.components = new OBC.Components();

    // Initialize OrbitControls
    this.initializeControls();

    // Add basic lighting
    this.setupLighting();

    // Add grid helper if enabled
    if (this.config.showGrid) {
      this.gridHelper = new THREE.GridHelper(
        VIEWER.GRID_SIZE,
        VIEWER.GRID_DIVISIONS,
        VIEWER.GRID_COLOR_PRIMARY,
        VIEWER.GRID_COLOR_SECONDARY
      );
      this.scene.add(this.gridHelper);
    }

    // Initialize FragmentsManager with worker
    await this.initializeFragmentsManager();

    // Initialize IFC Loader
    await this.initializeIfcLoader();

    // Initialize the Components system
    this.components.init();
    this.logger.info('Components system initialized');

    // Initialize stats if enabled
    if (this.config.showStats && environment.enableStats) {
      this.initializeStats();
    }

    // Set up resize handling
    this.setupResizeHandling();

    // Start render loop
    this.startRenderLoop();
  }

  /**
   * Initialize OrbitControls for camera manipulation
   */
  private initializeControls(): void {
    if (!this.camera || !this.canvas) return;

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Set camera target
    this.controls.target.set(
      this.config.camera.target.x,
      this.config.camera.target.y,
      this.config.camera.target.z
    );

    this.controls.update();
  }

  /**
   * Initialize both perspective and orthographic cameras
   */
  private initializeCameras(canvas: HTMLCanvasElement): void {
    const aspect = canvas.clientWidth / canvas.clientHeight;

    // Create perspective camera (default)
    this.perspectiveCamera = new THREE.PerspectiveCamera(
      this.config.camera.fov,
      aspect,
      this.config.camera.near,
      this.config.camera.far
    );
    this.perspectiveCamera.position.set(
      this.config.camera.position.x,
      this.config.camera.position.y,
      this.config.camera.position.z
    );

    // Create orthographic camera
    const frustumSize = this.ORTHOGRAPHIC_FRUSTUM_SIZE;
    this.orthographicCamera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      this.config.camera.near,
      this.config.camera.far
    );
    this.orthographicCamera.position.set(
      this.config.camera.position.x,
      this.config.camera.position.y,
      this.config.camera.position.z
    );

    // Set active camera to perspective by default
    this.camera = this.perspectiveCamera;
    this.cameraSignal.set(this.camera);
  }

  /**
   * Switch between camera modes (3D perspective and 2D orthographic views)
   */
  setCameraMode(mode: CameraMode): void {
    if (!this.perspectiveCamera || !this.orthographicCamera) {
      this.logger.warn('Cameras not initialized');
      return;
    }

    this.currentCameraMode = mode;

    // Store current camera position and target
    const currentPosition = this.camera?.position.clone() || new THREE.Vector3();
    const currentTarget = this.controls?.target.clone() || new THREE.Vector3();

    switch (mode) {
      case CameraMode.PERSPECTIVE_3D:
        this.camera = this.perspectiveCamera;
        // Restore or set default 3D position
        this.camera.position.copy(currentPosition);
        break;

      case CameraMode.ORTHOGRAPHIC_TOP:
        this.camera = this.orthographicCamera;
        // Top view: look down from positive Y
        this.camera.position.set(currentTarget.x, currentTarget.y + this.ORTHOGRAPHIC_CAMERA_DISTANCE, currentTarget.z);
        this.camera.up.set(0, 0, -1); // Set up vector for proper orientation
        break;

      case CameraMode.ORTHOGRAPHIC_FRONT:
        this.camera = this.orthographicCamera;
        // Front view: look from positive Z
        this.camera.position.set(currentTarget.x, currentTarget.y, currentTarget.z + this.ORTHOGRAPHIC_CAMERA_DISTANCE);
        this.camera.up.set(0, 1, 0); // Standard up vector
        break;

      case CameraMode.ORTHOGRAPHIC_SIDE:
        this.camera = this.orthographicCamera;
        // Side view: look from positive X
        this.camera.position.set(currentTarget.x + this.ORTHOGRAPHIC_CAMERA_DISTANCE, currentTarget.y, currentTarget.z);
        this.camera.up.set(0, 1, 0); // Standard up vector
        break;
    }

    // Update controls to use the new camera
    if (this.controls && this.canvas) {
      this.controls.dispose();
      this.controls = new OrbitControls(this.camera, this.canvas);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.target.copy(currentTarget);
      
      // For orthographic views, disable rotation to keep the view locked
      if (mode !== CameraMode.PERSPECTIVE_3D) {
        this.controls.enableRotate = false;
      } else {
        this.controls.enableRotate = true;
      }
      
      this.controls.update();
    }

    // Update fragment model camera if model is loaded
    if (this.currentModel && this.camera) {
      this.currentModel.useCamera(this.camera);
    }

    // Update camera signal for reactive UI updates
    this.cameraSignal.set(this.camera);

    this.logger.info(`Camera mode changed to: ${mode}`);
  }

  /**
   * Get current camera mode
   */
  getCameraMode(): CameraMode {
    return this.currentCameraMode;
  }

  /**
   * Set up basic scene lighting
   */
  private setupLighting(): void {
    if (!this.scene) return;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(10, 10, 10);
    this.scene.add(this.directionalLight);
  }

  /**
   * Initialize FragmentsManager with worker
   */
  private async initializeFragmentsManager(): Promise<void> {
    if (!this.components) return;

    // Use components.get() to properly instantiate and register the component
    this.fragmentsManager = this.components.get(OBC.FragmentsManager);

    // Initialize worker with URL
    try {
      this.fragmentsManager.init(this.config.fragmentsWorkerUrl);
      this.logger.info('FragmentsManager.init() called with worker URL:', this.config.fragmentsWorkerUrl);

      // Wait for the worker to be ready (poll with timeout)
      // The init() method is synchronous but worker loading is async
      const startTime = Date.now();

      while (
        !this.fragmentsManager.initialized &&
        Date.now() - startTime < TIMING.WORKER_INIT_TIMEOUT
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, TIMING.WORKER_POLL_INTERVAL)
        );
      }

      if (this.fragmentsManager.initialized) {
        this.logger.info('FragmentsManager worker initialized successfully');
      } else {
        this.logger.warn('FragmentsManager worker may not be fully initialized after waiting');
      }
    } catch (error) {
      this.logger.error('Error initializing FragmentsManager:', error);
      throw error;
    }

    // Listen for new fragments (this may not always fire, so we have fallback in loadIfcFile)
    this.fragmentsManager.onFragmentsLoaded.add((model) => {
      if (!this.scene) return;

      this.logger.debug('onFragmentsLoaded event fired for model:', model.modelId);

      // Use the model.object property which is the THREE.Object3D container
      const modelGroup = model.object;
      
      if (!modelGroup) {
        this.logger.warn('Model has no renderable group/object');
        return;
      }
      
      // Add to scene if not already added
      if (!this.scene.children.includes(modelGroup)) {
        this.scene.add(modelGroup);
      }

      // Store current model
      this.currentModel = model;

      // Fit camera to view the model after a short delay
      setTimeout(() => {
        this.fitCameraToModel(modelGroup);
      }, TIMING.CAMERA_FIT_DELAY);

      this.logger.info('Model added to scene successfully via event');
    });
  }

  /**
   * Initialize IFC Loader
   */
  private async initializeIfcLoader(): Promise<void> {
    if (!this.components) return;

    // Use components.get() to properly instantiate and register the component
    this.ifcLoader = this.components.get(OBC.IfcLoader);

    // Configure WASM settings BEFORE setup to prevent auto-fetch
    this.ifcLoader.settings.wasm = {
      path: this.config.wasmPath,
      absolute: false,
    };

    // Optimize performance
    this.ifcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;

    // Setup with autoSetWasm disabled to use our configured path
    await this.ifcLoader.setup({ autoSetWasm: false });

    this.logger.info('IfcLoader initialized successfully');
  }

  /**
   * Initialize stats.js for memory monitoring
   */
  private initializeStats(): void {
    this.stats = new Stats();
    this.stats.showPanel(2); // 2 = MB panel
    this.stats.dom.style.position = 'absolute';
    this.stats.dom.style.top = '0px';
    this.stats.dom.style.left = '0px';
    this.stats.dom.style.zIndex = '1000';

    // Append to body
    document.body.appendChild(this.stats.dom);
  }

  /**
   * Set up resize handling
   */
  private setupResizeHandling(): void {
    if (!this.canvas) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });

    this.resizeObserver.observe(this.canvas);
  }

  /**
   * Handle window/canvas resize
   */
  private handleResize(): void {
    if (!this.canvas || !this.camera || !this.renderer) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const aspect = width / height;

    // Update camera based on type
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    } else if (this.camera instanceof THREE.OrthographicCamera) {
      const frustumSize = this.ORTHOGRAPHIC_FRUSTUM_SIZE;
      this.camera.left = (-frustumSize * aspect) / 2;
      this.camera.right = (frustumSize * aspect) / 2;
      this.camera.top = frustumSize / 2;
      this.camera.bottom = -frustumSize / 2;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.setSize(width, height, false);
  }

  /**
   * Start the render loop outside Angular zone
   */
  private startRenderLoop(): void {
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    if (!this.renderer || !this.scene || !this.camera) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    // Update stats before render
    if (this.stats) {
      this.stats.begin();
    }

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Update FragmentsModels for dynamic LOD and culling (throttled to avoid excessive calls)
    // Only update if enough time has passed since last update
    const now = Date.now();
    if (this.fragmentsManager?.core && now - this.lastUpdateTime >= TIMING.FRAGMENT_UPDATE_THROTTLE) {
      this.lastUpdateTime = now;
      // Update is async but we don't await it to avoid blocking the render loop
      this.fragmentsManager.core.update().catch((err) => {
        this.logger.warn('FragmentsModels update error:', err);
      });
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);

    // Update stats after render
    if (this.stats) {
      this.stats.end();
    }
  };

  /**
   * Remove the previous model from the scene and dispose its resources
   */
  private removePreviousModel(): void {
    if (!this.currentModel || !this.scene) {
      return;
    }

    this.logger.info('Removing previous model from scene');

    // Remove model object from scene
    if (this.currentModel.object) {
      this.scene.remove(this.currentModel.object);
    }

    // Dispose model resources
    try {
      this.currentModel.dispose();
      this.logger.debug('Previous model disposed successfully');
    } catch (error) {
      this.logger.warn('Error disposing previous model:', error);
    }

    // Clear the reference
    this.currentModel = null;
  }

  /**
   * Load an IFC file from a Uint8Array buffer
   */
  async loadIfcFile(
    buffer: Uint8Array,
    fileName: string = 'model'
  ): Promise<FRAGS.FragmentsModel | null> {
    if (!this.ifcLoader) {
      this.logger.error('IFC Loader not initialized');
      return null;
    }

    if (!this.fragmentsManager) {
      this.logger.error('FragmentsManager not initialized');
      return null;
    }

    try {
      // Remove the previous model before loading a new one
      this.removePreviousModel();

      this.logger.startPerformanceMark('ifc-load');
      this.logger.info(`Loading IFC file: ${fileName}, size: ${buffer.byteLength} bytes`);

      // Load IFC with coordinate transformation enabled (true)
      // This transforms the model coordinates to origin for better viewport positioning
      const model = await this.ifcLoader.load(buffer, true, fileName, {
        processData: {
          progressCallback: (progress: number) => {
            this.logger.debug(`Loading progress: ${(progress * 100).toFixed(1)}%`);
          },
        },
      });

      this.logger.info('IFC file loaded successfully');
      this.logger.debug('Model has', model.tiles.size, 'tiles initially');

      // Set camera for dynamic tile loading - required for FragmentsModel to load geometry
      if (this.camera) {
        try {
          model.useCamera(this.camera);
          // Force initial update to load visible tiles
          // Parameter 'true' forces immediate update rather than throttled update
          await this.fragmentsManager.core.update(true);
          this.logger.debug('After camera set and update:', model.tiles.size, 'tiles loaded');
          
          if (model.tiles.size === 0) {
            this.logger.warn(
              'No tiles loaded after update. Model may not have geometry or ' +
              'geometry may still be loading asynchronously.'
            );
          }
        } catch (error) {
          this.logger.error('Error setting up model camera and loading tiles:', error);
          this.logger.warn(
            'Model will be added to scene but geometry may not be visible. ' +
            'Try reloading the file.'
          );
          // Continue execution - model will be added to scene even if tile loading fails
        }
      } else {
        this.logger.warn(
          'No camera available - model tiles cannot be loaded. ' +
          'Geometry will not be visible.'
        );
      }
      
      // Add model to scene
      // The model.object is a THREE.Object3D container that holds the mesh tiles
      const modelGroup = model.object;
      
      if (modelGroup && this.scene) {
        // Check if model was already added by onFragmentsLoaded event
        if (!this.scene.children.includes(modelGroup)) {
          this.logger.info('Adding model to scene');
          this.scene.add(modelGroup);
          this.currentModel = model;
          
          // Fit camera to view the model after a short delay to allow tiles to populate
          setTimeout(() => {
            this.fitCameraToModel(modelGroup);
          }, TIMING.CAMERA_FIT_DELAY);
        } else {
          this.logger.debug('Model already in scene (added by event)');
        }
      }
      
      this.logger.endPerformanceMark('ifc-load');
      return model;
    } catch (error) {
      this.logger.error('Error loading IFC file:', error);
      throw error; // Re-throw to propagate to component
    }
  }

  /**
   * Fit camera to view the entire model
   */
  private fitCameraToModel(object: THREE.Object3D): void {
    if (!this.camera || !this.controls) return;

    // Compute bounding box of the model
    const box = new THREE.Box3().setFromObject(object);
    
    // Check if bounding box is valid
    if (box.isEmpty()) {
      this.logger.warn('Model bounding box is empty, using default camera distance');
      // Position camera at a reasonable default distance
      const defaultDistance = 20;
      const direction = new THREE.Vector3(1, 1, 1).normalize();
      const cameraPosition = direction.multiplyScalar(defaultDistance);
      this.camera.position.copy(cameraPosition);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      return;
    }

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    this.logger.debug('Model bounding box:', { 
      min: box.min, 
      max: box.max, 
      size, 
      center 
    });

    // Calculate the maximum dimension
    const maxDim = Math.max(size.x, size.y, size.z);
    
    let cameraDistance: number;
    
    // Calculate camera distance based on camera type
    if (this.camera instanceof THREE.PerspectiveCamera) {
      // Using FOV and desired framing (1.5x for some padding)
      const fov = this.camera.fov * (Math.PI / 180); // Convert to radians
      cameraDistance = (maxDim / 2) / Math.tan(fov / 2) * 1.5;
    } else {
      // For orthographic camera, use a fixed distance
      cameraDistance = maxDim * 1.5;
      
      // Update orthographic camera frustum to fit the model
      if (this.camera instanceof THREE.OrthographicCamera && this.canvas) {
        const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        const frustumSize = maxDim * 1.2;
        this.camera.left = (-frustumSize * aspect) / 2;
        this.camera.right = (frustumSize * aspect) / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = -frustumSize / 2;
        this.camera.updateProjectionMatrix();
      }
    }

    // Position camera at an angle that shows the model well
    const direction = new THREE.Vector3(1, 1, 1).normalize();
    const cameraPosition = center.clone().add(direction.multiplyScalar(cameraDistance));

    // Update camera position
    this.camera.position.copy(cameraPosition);

    // Update controls target to model center
    this.controls.target.copy(center);
    this.controls.update();

    this.logger.debug('Camera fitted to model:', {
      position: this.camera.position,
      target: this.controls.target,
      distance: cameraDistance
    });
  }

  /**
   * Export current model as .frag file
   */
  async exportFragments(fileName: string = 'model'): Promise<void> {
    if (!this.currentModel) {
      console.warn('No model loaded to export');
      return;
    }

    try {
      const buffer = await this.currentModel.getBuffer(false);
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.frag`;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);

      this.logger.info(`Exported fragments as ${fileName}.frag`);
    } catch (error) {
      this.logger.error('Error exporting fragments:', error);
    }
  }

  /**
   * Dispose of all resources and clean up
   */
  dispose(): void {
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Remove stats
    if (this.stats?.dom) {
      document.body.removeChild(this.stats.dom);
      this.stats = null;
    }

    // Disconnect resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    // Dispose grid helper
    if (this.gridHelper) {
      this.gridHelper.geometry?.dispose();
      if (this.gridHelper.material) {
        if (Array.isArray(this.gridHelper.material)) {
          this.gridHelper.material.forEach((m) => m.dispose());
        } else {
          this.gridHelper.material.dispose();
        }
      }
      this.gridHelper = null;
    }

    // Dispose scene objects
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((m) => m.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
    }

    // Dispose components
    if (this.components) {
      this.components.dispose();
      this.components = null;
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    // Clear references
    this.controls = null;
    this.fragmentsManager = null;
    this.ifcLoader = null;
    this.scene = null;
    this.camera = null;
    this.canvas = null;
    this.currentModel = null;

    this.logger.info('Viewer disposed successfully');
  }

  /**
   * Get current model
   */
  getCurrentModel(): FRAGS.FragmentsModel | null {
    return this.currentModel;
  }

  /**
   * Get current camera
   */
  getCamera(): THREE.Camera | null {
    return this.camera;
  }

  /**
   * Get all IFC categories from the current model
   */
  async getCategories(): Promise<string[]> {
    if (!this.currentModel) {
      this.logger.warn('No model loaded - cannot get categories');
      return [];
    }

    try {
      const categories = await this.currentModel.getCategories();
      this.logger.debug('Retrieved categories:', categories);
      return categories;
    } catch (error) {
      this.logger.error('Error getting categories:', error);
      return [];
    }
  }

  /**
   * Get item IDs for specific categories
   */
  async getItemsOfCategories(categories: string[]): Promise<{ [category: string]: number[] }> {
    if (!this.currentModel) {
      this.logger.warn('No model loaded - cannot get items by category');
      return {};
    }

    try {
      // Convert category names to RegExp patterns for exact matching
      const regexPatterns = categories.map(cat => new RegExp(`^${cat}$`));
      const items = await this.currentModel.getItemsOfCategories(regexPatterns);
      this.logger.debug('Retrieved items for categories:', items);
      return items;
    } catch (error) {
      this.logger.error('Error getting items by category:', error);
      return {};
    }
  }

  /**
   * Set visibility for specific items
   */
  async setItemsVisible(itemIds: number[], visible: boolean): Promise<void> {
    if (!this.currentModel) {
      this.logger.warn('No model loaded - cannot set visibility');
      return;
    }

    try {
      await this.currentModel.setVisible(itemIds, visible);
      this.logger.debug(`Set visibility to ${visible} for ${itemIds.length} items`);
    } catch (error) {
      this.logger.error('Error setting item visibility:', error);
    }
  }

  /**
   * Set lighting mode
   */
  setLightMode(mode: LightMode): void {
    if (!this.ambientLight || !this.directionalLight) {
      this.logger.warn('Lights not initialized');
      return;
    }

    this.currentLightMode = mode;

    switch (mode) {
      case LightMode.DEFAULT:
        this.ambientLight.intensity = 0.5;
        this.directionalLight.intensity = 0.8;
        break;

      case LightMode.BRIGHT:
        this.ambientLight.intensity = 0.8;
        this.directionalLight.intensity = 1.2;
        break;

      case LightMode.SOFT:
        this.ambientLight.intensity = 0.7;
        this.directionalLight.intensity = 0.3;
        break;

      case LightMode.DRAMATIC:
        this.ambientLight.intensity = 0.2;
        this.directionalLight.intensity = 1.5;
        break;
    }

    this.logger.info(`Light mode changed to: ${mode}`);
  }

  /**
   * Get current light mode
   */
  getLightMode(): LightMode {
    return this.currentLightMode;
  }

  /**
   * Enable or disable pan mode
   */
  setPanMode(enabled: boolean): void {
    if (!this.controls) {
      this.logger.warn('Controls not initialized');
      return;
    }

    // When pan mode is enabled, disable rotation and enable panning
    // When disabled, restore rotation and keep panning available
    this.controls.enableRotate = !enabled;
    this.controls.enablePan = true; // Always allow panning
    
    this.logger.info(`Pan mode ${enabled ? 'enabled' : 'disabled'}`);
  }
}
