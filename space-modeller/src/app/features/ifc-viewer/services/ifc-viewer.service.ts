import { Injectable, inject, NgZone } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';
import * as OBC from '@thatopen/components';
import * as FRAGS from '@thatopen/fragments';
import { ViewerConfig, DEFAULT_VIEWER_CONFIG } from '../../../shared/models/viewer-config.model';

/**
 * Service that manages the 3D viewer, Three.js renderer, and @thatopen/components
 */
@Injectable({
  providedIn: 'root',
})
export class IfcViewerService {
  private readonly ngZone = inject(NgZone);

  // Worker initialization configuration
  private static readonly WORKER_INIT_MAX_WAIT_MS = 5000; // 5 seconds
  private static readonly WORKER_INIT_POLL_INTERVAL_MS = 100; // Check every 100ms
  private static readonly CAMERA_FIT_DELAY_MS = 200; // Delay for camera fitting to allow geometry to populate

  private canvas: HTMLCanvasElement | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create scene with dark background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.backgroundColor);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      this.config.camera.fov,
      canvas.clientWidth / canvas.clientHeight,
      this.config.camera.near,
      this.config.camera.far
    );
    this.camera.position.set(
      this.config.camera.position.x,
      this.config.camera.position.y,
      this.config.camera.position.z
    );

    // Initialize @thatopen/components
    this.components = new OBC.Components();

    // Initialize OrbitControls
    this.initializeControls();

    // Add basic lighting
    this.setupLighting();

    // Add grid helper if enabled
    if (this.config.showGrid) {
      this.gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
      this.scene.add(this.gridHelper);
    }

    // Initialize FragmentsManager with worker
    await this.initializeFragmentsManager();

    // Initialize IFC Loader
    await this.initializeIfcLoader();

    // Initialize the Components system
    this.components.init();
    console.log('Components system initialized');

    // Initialize stats if enabled
    if (this.config.showStats) {
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
   * Set up basic scene lighting
   */
  private setupLighting(): void {
    if (!this.scene) return;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    this.scene.add(directionalLight);
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
      console.log('FragmentsManager.init() called with worker URL:', this.config.fragmentsWorkerUrl);

      // Wait for the worker to be ready (poll with timeout)
      // The init() method is synchronous but worker loading is async
      const startTime = Date.now();

      while (
        !this.fragmentsManager.initialized &&
        Date.now() - startTime < IfcViewerService.WORKER_INIT_MAX_WAIT_MS
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, IfcViewerService.WORKER_INIT_POLL_INTERVAL_MS)
        );
      }

      if (this.fragmentsManager.initialized) {
        console.log('FragmentsManager worker initialized successfully');
      } else {
        console.warn('FragmentsManager worker may not be fully initialized after waiting');
      }
    } catch (error) {
      console.error('Error initializing FragmentsManager:', error);
      throw error;
    }

    // Listen for new fragments (this may not always fire, so we have fallback in loadIfcFile)
    this.fragmentsManager.onFragmentsLoaded.add((model) => {
      if (!this.scene) return;

      console.log('onFragmentsLoaded event fired - adding to scene');
      console.log('Event model details:', {
        modelId: model.modelId,
        tiles: model.tiles,
        tilesSize: model.tiles.size,
        object: model.object,
        objectChildren: model.object.children.length
      });

      // Use the model.object property which is the THREE.Object3D container
      const modelGroup = model.object;
      
      if (!modelGroup) {
        console.warn('Model has no renderable group/object');
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
      }, IfcViewerService.CAMERA_FIT_DELAY_MS);

      console.log('Model added to scene successfully via event');
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

    console.log('IfcLoader initialized successfully');
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

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

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

    // Render scene
    this.renderer.render(this.scene, this.camera);

    // Update stats after render
    if (this.stats) {
      this.stats.end();
    }
  };

  /**
   * Load an IFC file from a Uint8Array buffer
   */
  async loadIfcFile(
    buffer: Uint8Array,
    fileName: string = 'model'
  ): Promise<FRAGS.FragmentsModel | null> {
    if (!this.ifcLoader) {
      console.error('IFC Loader not initialized');
      return null;
    }

    if (!this.fragmentsManager) {
      console.error('FragmentsManager not initialized');
      return null;
    }

    try {
      console.log(`Loading IFC file: ${fileName}, size: ${buffer.byteLength} bytes`);
      console.log('FragmentsManager initialized:', this.fragmentsManager.initialized);
      console.log('FragmentsManager list before load:', this.fragmentsManager.list.size);

      // Load IFC with coordinate transformation enabled (true)
      // This transforms the model coordinates to origin for better viewport positioning
      const model = await this.ifcLoader.load(buffer, true, fileName, {
        processData: {
          progressCallback: (progress: number) => {
            console.log(`Loading progress: ${(progress * 100).toFixed(1)}%`);
          },
        },
      });

      console.log('FragmentsManager list after load:', this.fragmentsManager.list.size);

      console.log('IFC file loaded successfully, model:', model);
      console.log('Model details:', {
        modelId: model.modelId,
        tiles: model.tiles,
        tilesSize: model.tiles.size,
        object: model.object,
        objectChildren: model.object.children.length,
        box: model.box
      });

      // Force update to ensure tiles are loaded
      console.log('Forcing FragmentsModels update...');
      await this.fragmentsManager.core.update(true);
      console.log('Update complete. Tiles now:', model.tiles.size);

      // Set camera for dynamic tile loading
      if (this.camera) {
        console.log('Setting camera on model for tile loading...');
        model.useCamera(this.camera);
        // Force another update after setting camera
        await this.fragmentsManager.core.update(true);
        console.log('After camera set, tiles:', model.tiles.size);
      }
      
      // Manually add model to scene as the onFragmentsLoaded event may not fire
      // Use the model.object property which is the THREE.Object3D container
      const modelGroup = model.object;
      
      if (modelGroup && this.scene) {
        // Check if model was already added by onFragmentsLoaded event
        if (!this.scene.children.includes(modelGroup)) {
          console.log('Manually adding model to scene (event did not fire)');
          this.scene.add(modelGroup);
          this.currentModel = model;
          
          // Defer camera fitting to allow geometry to populate
          setTimeout(() => {
            this.fitCameraToModel(modelGroup);
          }, IfcViewerService.CAMERA_FIT_DELAY_MS);
        }
      }
      
      return model;
    } catch (error) {
      console.error('Error loading IFC file:', error);
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
      console.warn('Model bounding box is empty, using default camera distance');
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

    console.log('Model bounding box:', { 
      min: box.min, 
      max: box.max, 
      size, 
      center 
    });

    // Calculate the maximum dimension
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Calculate camera distance to fit the model in view
    // Using FOV and desired framing (1.5x for some padding)
    const fov = this.camera.fov * (Math.PI / 180); // Convert to radians
    const cameraDistance = (maxDim / 2) / Math.tan(fov / 2) * 1.5;

    // Position camera at an angle that shows the model well
    const direction = new THREE.Vector3(1, 1, 1).normalize();
    const cameraPosition = center.clone().add(direction.multiplyScalar(cameraDistance));

    // Update camera position
    this.camera.position.copy(cameraPosition);

    // Update controls target to model center
    this.controls.target.copy(center);
    this.controls.update();

    console.log('Camera fitted to model:', {
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

      console.log(`Exported fragments as ${fileName}.frag`);
    } catch (error) {
      console.error('Error exporting fragments:', error);
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

    console.log('Viewer disposed successfully');
  }

  /**
   * Get current model
   */
  getCurrentModel(): FRAGS.FragmentsModel | null {
    return this.currentModel;
  }
}
