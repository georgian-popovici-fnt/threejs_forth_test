import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  viewChild,
  inject,
  NgZone,
  afterNextRender,
  input,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import * as THREE from 'three';

/**
 * Orientation Cube Component
 * Displays a small 3D cube in the top-right corner that mirrors the main camera orientation
 */
@Component({
  selector: 'app-orientation-cube',
  standalone: true,
  template: `
    <canvas #canvas class="orientation-cube-canvas"></canvas>
    <div class="coordinates-panel">
      <div class="coordinates-section">
        <div class="coordinates-label">Position</div>
        <div class="coordinates-value">X: {{ cameraPosition().x }}</div>
        <div class="coordinates-value">Y: {{ cameraPosition().y }}</div>
        <div class="coordinates-value">Z: {{ cameraPosition().z }}</div>
      </div>
      <div class="coordinates-section">
        <div class="coordinates-label">Rotation</div>
        <div class="coordinates-value">X: {{ cameraRotation().x }}°</div>
        <div class="coordinates-value">Y: {{ cameraRotation().y }}°</div>
        <div class="coordinates-value">Z: {{ cameraRotation().z }}°</div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 1000;
      pointer-events: none;
    }

    .orientation-cube-canvas {
      display: block;
      width: 80px;
      height: 80px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .coordinates-panel {
      margin-top: 8px;
      background: rgba(0, 0, 0, 0.75);
      border-radius: 6px;
      padding: 8px 10px;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      color: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
      min-width: 120px;
    }

    .coordinates-section {
      margin-bottom: 6px;
    }

    .coordinates-section:last-child {
      margin-bottom: 0;
    }

    .coordinates-label {
      font-weight: bold;
      font-size: 9px;
      text-transform: uppercase;
      color: #4a90e2;
      margin-bottom: 2px;
      letter-spacing: 0.5px;
    }

    .coordinates-value {
      font-size: 10px;
      line-height: 1.3;
      color: #e0e0e0;
      padding-left: 4px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrientationCubeComponent implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  // Input: main camera to mirror
  readonly camera = input<THREE.Camera | null>(null);

  // Writable signals for camera position and rotation (updated in animation loop)
  protected readonly cameraPosition = signal({ x: '0.00', y: '0.00', z: '0.00' });
  protected readonly cameraRotation = signal({ x: '0', y: '0', z: '0' });

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private cubeCamera: THREE.PerspectiveCamera | null = null;
  private cube: THREE.Group | null = null;
  private animationFrameId: number | null = null;
  private lastCoordinateUpdate: number = 0;
  private readonly COORDINATE_UPDATE_INTERVAL = 100; // ms

  // Constants
  private readonly MAX_PIXEL_RATIO = 2;
  private readonly CANVAS_SIZE = 256; // High resolution for crisp text
  private readonly MAX_TEXT_LENGTH = 10;
  private readonly CUBE_SIZE = 1.5;
  private readonly CAMERA_DISTANCE = 4;
  private readonly CAMERA_FOV = 50;

  // Face configuration with colors and labels
  private readonly faceConfig = [
    { name: 'Front (N)', color: 0x4a90e2, normal: new THREE.Vector3(0, 0, 1) },   // +Z
    { name: 'Back (S)', color: 0xe24a4a, normal: new THREE.Vector3(0, 0, -1) },   // -Z
    { name: 'Right (E)', color: 0x50c878, normal: new THREE.Vector3(1, 0, 0) },   // +X
    { name: 'Left (W)', color: 0xf39c12, normal: new THREE.Vector3(-1, 0, 0) },   // -X
    { name: 'Top', color: 0x9b59b6, normal: new THREE.Vector3(0, 1, 0) },         // +Y
  ];

  constructor() {
    afterNextRender(() => {
      this.initCube();
      this.ngZone.runOutsideAngular(() => this.animate());
    });
  }

  /**
   * Initialize the orientation cube scene
   */
  private initCube(): void {
    const canvas = this.canvasRef().nativeElement;
    const pixelRatio = Math.min(window.devicePixelRatio, this.MAX_PIXEL_RATIO);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(80, 80, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Create scene with transparent background
    this.scene = new THREE.Scene();

    // Create camera for the cube view
    this.cubeCamera = new THREE.PerspectiveCamera(this.CAMERA_FOV, 1, 0.1, 100);
    this.cubeCamera.position.set(0, 0, this.CAMERA_DISTANCE);

    // Create cube group
    this.cube = new THREE.Group();

    // Create the cube with labeled faces
    this.createLabeledCube();

    this.scene.add(this.cube);

    // Add subtle ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Add directional light for better face visibility
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
  }

  /**
   * Create a cube with labeled faces
   */
  private createLabeledCube(): void {
    if (!this.cube) return;

    const geometry = new THREE.BoxGeometry(this.CUBE_SIZE, this.CUBE_SIZE, this.CUBE_SIZE);
    
    // Create materials for each face
    const materials: THREE.MeshBasicMaterial[] = [];
    
    // BoxGeometry face order: +X (right), -X (left), +Y (top), -Y (bottom), +Z (front), -Z (back)
    // Map to our face config: Right, Left, Top, (skip Bottom), Front, Back
    const faceOrder = [2, 3, 4, 5, 0, 1]; // Indices into this.faceConfig
    const BOTTOM_FACE_INDEX = 3; // -Y face in BoxGeometry
    
    for (let i = 0; i < 6; i++) {
      const configIndex = faceOrder[i];
      
      // Skip bottom face (-Y)
      if (i === BOTTOM_FACE_INDEX) {
        materials.push(new THREE.MeshBasicMaterial({ 
          color: 0x222222,
          transparent: true,
          opacity: 0.3
        }));
        continue;
      }
      
      const config = this.faceConfig[configIndex];
      const canvas = this.createTextCanvas(config.name, config.color);
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      
      materials.push(new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
      }));
    }

    const mesh = new THREE.Mesh(geometry, materials);
    this.cube.add(mesh);

    // Add wireframe for borders
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    this.cube.add(wireframe);
  }

  /**
   * Create a canvas with text for a cube face
   */
  private createTextCanvas(text: string, backgroundColor: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.CANVAS_SIZE;
    canvas.height = this.CANVAS_SIZE;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Background color
    ctx.fillStyle = `#${backgroundColor.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

    // Add subtle gradient
    const gradient = ctx.createLinearGradient(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);

    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Handle multi-line text (e.g., "Front (N)")
    const lines = this.wrapText(text, this.MAX_TEXT_LENGTH);
    const lineHeight = 56;
    const startY = this.CANVAS_SIZE / 2 - ((lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, i) => {
      ctx.fillText(line, this.CANVAS_SIZE / 2, startY + i * lineHeight);
    });

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, this.CANVAS_SIZE - 2, this.CANVAS_SIZE - 2);

    return canvas;
  }

  /**
   * Wrap text into multiple lines
   */
  private wrapText(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text];
    
    // Try to split on space or parenthesis
    const parts = text.match(/(.+?)(\s*\([^)]+\))?$/);
    if (parts && parts[2]) {
      return [parts[1].trim(), parts[2].trim()];
    }
    
    return [text];
  }

  /**
   * Animation loop - sync cube rotation with main camera
   */
  private animate = (): void => {
    if (!this.renderer || !this.scene || !this.cubeCamera || !this.cube) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    const mainCamera = this.camera();
    if (mainCamera) {
      // Copy the main camera's rotation to the cube
      // We invert the quaternion so the cube appears to rotate opposite to the camera view
      const quaternion = mainCamera.quaternion.clone();
      this.cube.quaternion.copy(quaternion).invert();

      // Update coordinate signals periodically (throttled to avoid excessive change detection)
      const now = Date.now();
      if (now - this.lastCoordinateUpdate >= this.COORDINATE_UPDATE_INTERVAL) {
        this.lastCoordinateUpdate = now;
        
        // Run inside Angular zone for change detection
        this.ngZone.run(() => {
          this.cameraPosition.set({
            x: mainCamera.position.x.toFixed(2),
            y: mainCamera.position.y.toFixed(2),
            z: mainCamera.position.z.toFixed(2),
          });

          const euler = new THREE.Euler().setFromQuaternion(mainCamera.quaternion);
          this.cameraRotation.set({
            x: Math.round(THREE.MathUtils.radToDeg(euler.x)).toString(),
            y: Math.round(THREE.MathUtils.radToDeg(euler.y)).toString(),
            z: Math.round(THREE.MathUtils.radToDeg(euler.z)).toString(),
          });
        });
      }
    }

    this.renderer.render(this.scene, this.cubeCamera);
  };

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Dispose geometries and materials
    if (this.cube) {
      this.cube.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((m) => {
                m.map?.dispose();
                m.dispose();
              });
            } else {
              object.material.map?.dispose();
              object.material.dispose();
            }
          }
        } else if (object instanceof THREE.LineSegments) {
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

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.cubeCamera = null;
    this.cube = null;
  }
}
