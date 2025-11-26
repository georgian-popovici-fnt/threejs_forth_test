# Space Modeller - IFC Viewer Application

A professional-grade Angular 18 application for viewing and exporting IFC (Industry Foundation Classes) 3D models.

## Features

- **3D IFC Model Viewing**: Load and visualize IFC files with dynamic camera controls
- **Fragment Export**: Export loaded models as `.frag` files
- **Professional UI**: Modern, responsive design with toast notifications
- **Performance Optimized**: Environment-based feature toggling and performance tracking
- **Type-Safe**: Strict TypeScript 5.5 with no `any` types
- **Well-Tested**: Comprehensive unit tests with 43+ test cases
- **Business-Ready**: Structured logging, error handling, and file validation

## Tech Stack

- **Angular 18** with standalone components and OnPush change detection
- **TypeScript 5.5** with strict mode enabled
- **Three.js 0.180** for 3D rendering
- **@thatopen/components** for IFC file processing
- **RxJS 7.8** for reactive programming
- **Jasmine + Karma** for testing

## Prerequisites

- Node.js v20 or higher
- npm v10 or higher

## Installation

```bash
npm install
```

## Development

Start the development server:

```bash
npm start
```

Navigate to `http://localhost:4200/`

## Build

Build for production:

```bash
npm run build
```

## Testing

Run unit tests:

```bash
npm test
```

## Key Features

### File Validation
- File type validation (only `.ifc` files accepted)
- File size validation (max 100 MB)
- Automatic filename sanitization for security

### Notification System
- Toast notifications for user feedback
- Success, error, warning, and info message types
- Auto-dismiss functionality

### Logging
- Environment-aware logging (verbose in dev, minimal in prod)
- Performance tracking with marks
- Structured log output with timestamps

### 3D Viewer
- OrbitControls for camera manipulation
- Automatic camera fitting to loaded models
- Dynamic level-of-detail (LOD)
- Grid helper for spatial reference

## Usage

### Loading IFC Files

1. Click the "Load IFC" button
2. Select an `.ifc` file (max 100 MB)
3. Wait for the file to load
4. Navigate the 3D view:
   - Left click + drag: Rotate camera
   - Right click + drag: Pan camera
   - Scroll wheel: Zoom in/out

### Exporting Fragments

1. Load an IFC file first
2. Click the "Download .frag" button
3. The fragment file will be downloaded

## Code Quality

- **Type Safety**: Strict TypeScript with no `any` types
- **Code Organization**: Feature-based folder structure
- **Constants**: Centralized configuration values
- **Error Handling**: Comprehensive try-catch blocks
- **Documentation**: JSDoc comments on all public methods
- **Testing**: 43+ unit tests

## Security

- File input validation and sanitization
- Path traversal prevention
- File size limits
- Content type validation

## Troubleshooting

### "ng is not recognized as a command"
Run `npm install` to install dependencies including Angular CLI

### IFC file won't load
- Check file size (must be < 100 MB)
- Verify file extension is `.ifc`
- Check browser console for error messages

## License

Copyright © 2024
