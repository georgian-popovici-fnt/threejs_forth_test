# IFC Viewer - Technical Implementation

## Architecture Overview

This document describes the technical implementation of the IFC 3D viewer, including design decisions, integration patterns, and best practices.

## Core Components

### 1. IfcViewerComponent

**Purpose**: Presentation layer for the 3D viewport

**Key Features**:
- Standalone Angular component with OnPush change detection
- Signal-based state management for loading and file tracking
- Minimal template focusing on canvas and toolbar
- Proper lifecycle management with `ngOnDestroy()`

**Implementation Highlights**:

```typescript
@Component({
  selector: 'app-ifc-viewer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IfcViewerComponent {
  private readonly viewerService = inject(IfcViewerService);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  
  protected readonly isLoading = signal<boolean>(false);
  protected readonly currentFileName = signal<string>('');
  
  constructor() {
    afterNextRender(() => {
      this.initializeViewer();
    });
  }
}
```

**Why this approach?**
- `afterNextRender()` ensures DOM is ready before Three.js initialization
- Signals provide reactive state without manual change detection
- `viewChild.required()` guarantees canvas availability
- Service injection separates concerns (UI vs 3D logic)

### 2. IfcViewerService

**Purpose**: Core Three.js and @thatopen integration logic

**Responsibilities**:
1. Three.js renderer setup and configuration
2. Scene, camera, and lighting management
3. OrbitControls integration
4. @thatopen/components initialization
5. FragmentsManager and IfcLoader setup
6. Stats.js integration
7. Resource lifecycle management

**Critical Implementation Details**:

#### Renderer Configuration

```typescript
this.renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});

this.renderer.outputColorSpace = THREE.SRGBColorSpace;
this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
this.renderer.toneMappingExposure = 1.0;
this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```

**Design Rationale**:
- `SRGBColorSpace`: Ensures accurate color reproduction
- `ACESFilmicToneMapping`: Provides cinematic look and HDR-like rendering
- `pixelRatio` capped at 2: Balances quality vs performance
- `antialias: true`: Smooth edges at minimal performance cost

#### NgZone Optimization

```typescript
private startRenderLoop(): void {
  this.ngZone.runOutsideAngular(() => {
    this.animate();
  });
}
```

**Why?**
- Render loop runs 60 times per second
- Running inside Angular zone triggers change detection 60 times/sec
- `runOutsideAngular()` prevents unnecessary Angular cycles
- Improves performance dramatically

#### WASM Configuration

```typescript
this.ifcLoader.settings.wasm = {
  path: this.config.wasmPath,
  absolute: false,
};

await this.ifcLoader.setup({ autoSetWasm: false });
```

**Key Points**:
- Set WASM path **before** `setup()` call
- `autoSetWasm: false` prevents CDN auto-fetch
- `absolute: false` uses relative path from domain root
- Ensures WASM files are served from local assets

### 3. ViewerConfig Model

**Purpose**: Centralized configuration interface

**Structure**:

```typescript
export interface ViewerConfig {
  wasmPath: string;
  camera: {
    position: Vector3;
    target: Vector3;
    fov: number;
    near: number;
    far: number;
  };
  backgroundColor: string;
  showGrid: boolean;
  showStats: boolean;
  fragmentsWorkerUrl: string;
}
```

**Benefits**:
- Type-safe configuration
- Single source of truth
- Easy to override per-instance
- Self-documenting via TypeScript types

## Integration Patterns

### @thatopen/components Integration

The viewer integrates with @thatopen/components v3 API:

```typescript
// Create components instance
this.components = new OBC.Components();

// Create FragmentsManager
this.fragmentsManager = new OBC.FragmentsManager(this.components);
this.fragmentsManager.init(this.config.fragmentsWorkerUrl);

// Create IfcLoader
this.ifcLoader = new OBC.IfcLoader(this.components);
this.ifcLoader.settings.wasm = { path: '/assets/wasm/', absolute: false };
await this.ifcLoader.setup({ autoSetWasm: false });
```

**Event Handling**:

```typescript
this.fragmentsManager.onFragmentsLoaded.add((model) => {
  this.scene.add(model.group);
  this.currentModel = model;
});
```

### Three.js OrbitControls

```typescript
this.controls = new OrbitControls(this.camera, this.canvas);
this.controls.enableDamping = true;
this.controls.dampingFactor = 0.05;
this.controls.target.set(0, 0, 0);
this.controls.update();
```

**Update in Render Loop**:

```typescript
private animate = (): void => {
  requestAnimationFrame(this.animate);
  
  if (this.controls) {
    this.controls.update();
  }
  
  this.renderer.render(this.scene, this.camera);
};
```

### Stats.js Integration

```typescript
this.stats = new Stats();
this.stats.showPanel(2); // Memory panel
document.body.appendChild(this.stats.dom);

// In render loop:
this.stats.begin();
this.renderer.render(this.scene, this.camera);
this.stats.end();
```

## Resource Management

### Disposal Pattern

The service implements comprehensive resource cleanup:

```typescript
dispose(): void {
  // Stop animation
  if (this.animationFrameId !== null) {
    cancelAnimationFrame(this.animationFrameId);
  }
  
  // Remove stats panel from DOM
  if (this.stats?.dom) {
    document.body.removeChild(this.stats.dom);
  }
  
  // Disconnect observers
  if (this.resizeObserver) {
    this.resizeObserver.disconnect();
  }
  
  // Dispose controls
  if (this.controls) {
    this.controls.dispose();
  }
  
  // Dispose scene objects
  this.scene?.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach(m => m.dispose());
      } else {
        object.material?.dispose();
      }
    }
  });
  
  // Dispose components
  this.components?.dispose();
  
  // Dispose renderer
  this.renderer?.dispose();
}
```

**Why This Matters**:
- Prevents memory leaks
- Frees GPU resources
- Removes event listeners
- Allows component reuse

### Resize Handling

```typescript
this.resizeObserver = new ResizeObserver(() => {
  this.handleResize();
});

this.resizeObserver.observe(this.canvas);
```

**Benefits over window resize events**:
- Only fires when canvas actually resizes
- More efficient than polling
- Works with CSS flexbox/grid layouts
- Automatically handles container changes

## File Processing Flow

### IFC Loading

```
User selects .ifc file
  ↓
Read as ArrayBuffer
  ↓
Convert to Uint8Array
  ↓
Pass to IfcLoader.load()
  ↓
web-ifc WASM parses IFC
  ↓
Geometry converted to Fragments
  ↓
FragmentsManager emits onFragmentsLoaded
  ↓
Model added to scene
```

### Fragment Export

```
User clicks "Download .frag"
  ↓
Get current model
  ↓
Call model.getBuffer(false)
  ↓
Create Blob from ArrayBuffer
  ↓
Generate object URL
  ↓
Trigger download
  ↓
Revoke object URL (cleanup)
```

## Performance Optimizations

### 1. Bundle Size Management

**angular.json** configuration:

```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "5MB",
      "maximumError": "10MB"
    }
  ],
  "allowedCommonJsDependencies": [
    "stats.js"
  ]
}
```

**Rationale**:
- 3D libraries are inherently large
- Realistic budgets for production use
- stats.js whitelisted to suppress warnings

### 2. Render Loop Optimization

- Runs outside Angular zone
- Only updates what changes (controls, camera)
- Stats tracking adds minimal overhead
- `requestAnimationFrame` for smooth 60fps

### 3. Fragment System Benefits

@thatopen Fragments provide:
- Geometry instancing for repeated objects
- Automatic level-of-detail (LOD)
- Spatial indexing for culling
- Compressed geometry storage

## Testing Strategy

### Unit Tests

**Component Tests**:
```typescript
it('should dispose viewer service on destroy', () => {
  const fixture = TestBed.createComponent(IfcViewerComponent);
  const component = fixture.componentInstance;
  
  component.ngOnDestroy();
  
  expect(mockViewerService.dispose).toHaveBeenCalled();
});
```

**Service Mocking**:
```typescript
beforeEach(async () => {
  mockViewerService = jasmine.createSpyObj('IfcViewerService', [
    'initialize',
    'loadIfcFile',
    'exportFragments',
    'dispose',
  ]);
  
  await TestBed.configureTestingModule({
    providers: [
      { provide: IfcViewerService, useValue: mockViewerService }
    ]
  }).compileComponents();
});
```

### Integration Considerations

**Current Limitations**:
- No integration tests for Three.js rendering (requires headless WebGL)
- No tests for actual IFC file loading (would need test fixtures)
- Service is tested via component integration

**Future Improvements**:
- Add headless-gl for Node.js testing
- Create small test IFC files
- Test fragment export/import cycle
- Performance benchmarks

## Browser Compatibility

### WebGL Requirements

```typescript
// Implicit WebGL 2.0 support check via Three.js
const renderer = new THREE.WebGLRenderer({ canvas });
```

**Fallback Strategy**:
- Three.js automatically falls back to WebGL 1.0 if needed
- No manual detection required
- Console warnings for software rendering

### WASM Support

All modern browsers support WASM:
- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

No fallback needed for target audience.

## Security Considerations

### Content Security Policy

**Required CSP Directives**:

```
script-src 'self' 'wasm-unsafe-eval';
worker-src 'self' https://thatopen.github.io;
connect-src 'self' https://thatopen.github.io;
```

**Explanation**:
- `wasm-unsafe-eval`: Required for WASM execution
- `worker-src`: Allows FragmentsManager worker
- `connect-src`: Allows worker script fetching

### Input Validation

```typescript
if (!file.name.toLowerCase().endsWith('.ifc')) {
  alert('Please select a valid IFC file');
  return;
}
```

**Additional Validation**:
- File type check on extension
- WASM parser validates IFC structure
- Try-catch around all async operations
- User-friendly error messages

## Deployment

### Production Build

```bash
npm run build
```

**Output Structure**:
```
dist/space-modeller/
├── browser/
│   ├── index.html
│   ├── main-[hash].js
│   ├── polyfills-[hash].js
│   ├── styles-[hash].css
│   └── assets/
│       └── wasm/
│           ├── web-ifc.wasm
│           ├── web-ifc-mt.wasm
│           └── web-ifc-node.wasm
```

### Serving Requirements

**Web Server Configuration**:

1. **MIME Types**: Ensure `.wasm` files served as `application/wasm`
2. **Compression**: Enable gzip/brotli for .js and .wasm
3. **Caching**: Long cache for hashed files, short for index.html
4. **HTTPS**: Required for SharedArrayBuffer (multi-threaded WASM)

**Example nginx config**:

```nginx
location /assets/wasm/ {
  types {
    application/wasm wasm;
  }
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

## Troubleshooting

### Common Issues

**1. WASM 404 Errors**

Check that WASM files are copied during build:

```json
// angular.json
"assets": [
  {
    "glob": "**/*",
    "input": "public"
  }
]
```

**2. Worker Loading Errors**

Ensure worker URL is accessible:
- Check network tab for worker.mjs request
- Verify CORS if using external worker
- Consider hosting worker locally for production

**3. Memory Leaks**

Verify disposal is called:
```typescript
ngOnDestroy(): void {
  this.viewerService.dispose();
}
```

## Future Enhancements

### Potential Improvements

1. **Property Display**
   - Parse IFC properties
   - Show element metadata on selection
   - Property panel UI

2. **Selection System**
   - Raycasting for object picking
   - Highlight selected objects
   - Multi-selection support

3. **Measurement Tools**
   - Distance measurement
   - Area calculation
   - Angle measurement

4. **View Management**
   - Save/restore camera views
   - Predefined views (top, front, side)
   - Animation between views

5. **Performance**
   - Implement LOD system
   - Progressive loading for large files
   - Spatial culling optimization

## References

- [Three.js Manual](https://threejs.org/manual/)
- [@thatopen/components Docs](https://docs.thatopen.com/)
- [web-ifc GitHub](https://github.com/ThatOpen/engine_web-ifc)
- [IFC Schema](https://standards.buildingsmart.org/IFC/RELEASE/IFC4/ADD2_TC1/HTML/)
- [Angular Best Practices](https://angular.dev/best-practices)
