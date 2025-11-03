# IFC 3D Viewer - User Guide

## Overview

This is a production-ready 3D viewer for IFC (Industry Foundation Classes) files built with Angular 18, Three.js, and @thatopen/components. The viewer provides high-performance rendering of large IFC models using the Fragments system for optimized geometry handling.

## Features

### Core Functionality
- **IFC File Loading**: Import .ifc files via file picker
- **Fragment Export**: Download loaded models as .frag files for faster loading
- **Real-time Memory Monitoring**: Stats.js panel showing memory usage
- **Smooth Navigation**: OrbitControls for intuitive camera movement
- **Modern Rendering**: sRGB color space and ACES Filmic tone mapping

### Performance Optimizations
- **Fragment System**: Uses @thatopen/components FragmentsManager for efficient rendering
- **Instancing & Culling**: Automatic geometry optimization for large models
- **WASM Processing**: web-ifc WASM module for fast IFC parsing
- **Pixel Ratio Cap**: Capped at 2x for balanced quality and performance

## Getting Started

### Prerequisites
- Node.js v20 or higher
- npm v10 or higher

### Installation

```bash
cd space-modeller
npm install
```

### Running the Application

```bash
npm start
```

Navigate to `http://localhost:4200/` in your browser.

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Using the Viewer

### Loading an IFC File

1. Click the **"Load IFC"** button in the toolbar
2. Select an `.ifc` file from your file system
3. The viewer will parse and render the model
4. Progress is logged to the browser console with percentage updates

**Note**: Depending on the file size, loading may take a few moments. Check the console for progress updates.

### Navigating the 3D Viewport

- **Rotate**: Left mouse button + drag
- **Pan**: Right mouse button + drag (or middle button)
- **Zoom**: Scroll wheel or two-finger pinch on trackpad

### Exporting as Fragment

1. Load an IFC file first
2. Click the **"Download .frag"** button
3. The optimized fragment file will be downloaded
4. Fragment files can be loaded faster than IFC files in future sessions

### Monitoring Memory Usage

The stats.js panel in the top-left corner shows:
- **MB**: Current memory usage in megabytes
- Updates in real-time as you interact with the viewer

## Configuration

### Viewer Settings

Configuration can be customized in `src/app/shared/models/viewer-config.model.ts`:

```typescript
export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
  // WASM path configuration
  wasmPath: '/assets/wasm/',  // Local path (recommended)
  // wasmPath: 'https://unpkg.com/web-ifc@0.0.57/', // CDN alternative

  // Camera settings
  camera: {
    position: { x: 10, y: 10, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    fov: 75,
    near: 0.1,
    far: 1000,
  },

  // Visual settings
  backgroundColor: '#0e1013',  // Dark background
  showGrid: true,              // Show/hide grid helper
  showStats: true,             // Show/hide memory panel
  
  // Fragment worker URL
  fragmentsWorkerUrl: 'https://thatopen.github.io/engine_fragment/resources/worker.mjs',
};
```

### WASM Path Configuration

**For Production (Recommended):**
```typescript
wasmPath: '/assets/wasm/'
```
This uses local WASM files bundled with your application.

**For Development (Alternative):**
```typescript
wasmPath: 'https://unpkg.com/web-ifc@0.0.57/'
```
This uses a CDN but adds external dependency.

## Architecture

### Component Structure

```
src/app/
├── features/
│   └── ifc-viewer/
│       ├── components/
│       │   ├── ifc-viewer.component.ts       # Main viewer component
│       │   ├── ifc-viewer.component.html     # Template
│       │   ├── ifc-viewer.component.css      # Styles
│       │   └── ifc-viewer.component.spec.ts  # Tests
│       └── services/
│           └── ifc-viewer.service.ts         # Viewer logic & Three.js setup
└── shared/
    └── models/
        └── viewer-config.model.ts            # Configuration interface
```

### Service Layer

**IfcViewerService** manages:
- Three.js renderer initialization
- Scene, camera, and lighting setup
- OrbitControls configuration
- @thatopen/components integration
- FragmentsManager for optimized rendering
- IfcLoader for IFC file processing
- Stats.js memory monitoring
- Resource cleanup and disposal

### Key Technologies

- **Angular 18**: Standalone components with OnPush change detection
- **Three.js 0.180**: 3D rendering engine
- **@thatopen/components 3.2.2**: IFC processing and fragments
- **@thatopen/fragments 3.2.0**: Optimized geometry handling
- **stats.js**: Performance monitoring
- **web-ifc**: WASM-based IFC parser

## Performance Considerations

### Bundle Size
The production build is approximately 5.2 MB (uncompressed), primarily due to:
- Three.js library (~2 MB)
- @thatopen/components (~2 MB)
- web-ifc WASM files (~1.3 MB each, 3 files total)

After gzip compression, the transfer size is reduced to ~550 KB for JavaScript.

### Hardware Requirements
- **Minimum**: 4GB RAM, integrated graphics
- **Recommended**: 8GB+ RAM, dedicated GPU
- **Browser**: Modern browser with WebGL 2.0 support

### Large Model Handling
The viewer uses several techniques for large models:
- Fragment-based rendering (instancing)
- Automatic geometry culling
- Coordinate origin optimization
- Lazy loading of geometry data

## Troubleshooting

### IFC File Won't Load
- Check browser console for error messages
- Ensure the file is a valid IFC format (not just renamed)
- Try a smaller test file first
- Check that WASM files are accessible at `/assets/wasm/`

### Memory Issues
- Close other browser tabs
- Reduce model complexity if possible
- Monitor the stats panel for memory usage
- Reload the page to free memory

### WebGL Errors
- Update your graphics drivers
- Try a different browser (Chrome, Firefox, Edge recommended)
- Check if WebGL is enabled: visit `https://get.webgl.org/`
- Disable browser extensions that might interfere with WebGL

### WASM Loading Errors
- Ensure WASM files are in `/public/assets/wasm/`
- Check network tab for 404 errors
- Verify `wasmPath` configuration is correct
- If using a CDN, check your internet connection

## Development

### Running Tests

```bash
npm test
```

### Running Tests in Headless Mode

```bash
npm test -- --browsers=ChromeHeadless --watch=false
```

### Code Structure Best Practices

This project follows Angular best practices:
- **Standalone components** for better modularity
- **OnPush change detection** for performance
- **Signal-based state** for reactivity
- **Dependency injection** for testability
- **NgZone.runOutsideAngular** for render loop performance

### Adding New Features

When extending the viewer:
1. Keep the service layer focused on Three.js logic
2. Use signals for component state
3. Run render loop outside Angular zone
4. Dispose resources in `ngOnDestroy()`
5. Follow TypeScript strict mode (no `any` types)

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+
- ⚠️ Mobile browsers (limited due to WebGL complexity)

## Security Considerations

- WASM files are served from the same domain (no CORS issues)
- No external data collection or analytics
- File processing happens entirely client-side
- Worker URLs are from trusted @thatopen sources

## License

See the main project LICENSE file for details.

## Support & Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [@thatopen/components Documentation](https://docs.thatopen.com/)
- [IFC Format Specification](https://www.buildingsmart.org/standards/bsi-standards/industry-foundation-classes/)
- [Angular Documentation](https://angular.dev/)

## Known Limitations

- No IFC editing capabilities (read-only viewer)
- No property/metadata display yet (geometry only)
- Fragment format is proprietary to @thatopen
- Worker URL requires external CDN access
- No offline mode support currently

## Roadmap

Potential future enhancements:
- [ ] IFC property panel display
- [ ] Object selection and highlighting
- [ ] Measurement tools
- [ ] Section planes / cutting
- [ ] Multiple model comparison
- [ ] Local fragment file loading
- [ ] Touch gesture support for mobile
- [ ] Export to other 3D formats
