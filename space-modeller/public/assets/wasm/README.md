# Web-IFC WASM Files

This directory contains the WebAssembly (WASM) files required for IFC file processing.

## Files

- `web-ifc.wasm` - Main WASM module for IFC processing (single-threaded)
- `web-ifc-mt.wasm` - Multi-threaded version (requires SharedArrayBuffer support)
- `web-ifc-node.wasm` - Node.js version (not used in browser)

## Configuration

The viewer is configured to use these local WASM files by default for production deployments.

### Local Deployment (Recommended for Production)

The default configuration in `src/app/shared/models/viewer-config.model.ts` points to:

```typescript
wasmPath: '/assets/wasm/'
```

This ensures the WASM files are bundled with your application and served from your domain.

### CDN Alternative (Quick Development)

For quick development or prototyping, you can switch to use a CDN by modifying the configuration:

```typescript
wasmPath: 'https://unpkg.com/web-ifc@0.0.57/'
```

**Note:** Using a CDN is not recommended for production as it introduces external dependencies.

## Version

These files are from the `web-ifc` package version installed via npm.
To update, reinstall the package and copy the new WASM files to this directory.

## Size Considerations

Each WASM file is approximately 1.3MB. This is necessary for processing IFC files
but will be downloaded only once and cached by the browser.
