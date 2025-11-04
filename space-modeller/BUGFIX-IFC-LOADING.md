# IFC Loading Bug Fix

## Problem
The loading screen remained blocked indefinitely when importing IFC files. Users would select an IFC file, see the loading spinner appear, but it would never disappear even after waiting a long time.

## Root Cause
The issue was caused by multiple initialization problems with the @thatopen/components library:

1. **Improper component initialization**: The `FragmentsManager` and `IfcLoader` were being instantiated directly using `new` instead of using the Components system's `get()` method, which is the proper pattern for registering components.

2. **Missing Components.init() call**: The @thatopen/components `Components` instance requires calling `init()` to start the system and process components properly.

3. **Worker initialization timing**: The `FragmentsManager` worker was being initialized asynchronously but the code wasn't waiting for it to be ready before attempting to load IFC files.

4. **Incorrect coordinate parameter**: The `ifcLoader.load()` method was being called with `coordinate: false`, which could cause processing issues.

## Changes Made

### 1. Use components.get() Pattern (ifc-viewer.service.ts)
**Before:**
```typescript
this.fragmentsManager = new OBC.FragmentsManager(this.components);
this.ifcLoader = new OBC.IfcLoader(this.components);
```

**After:**
```typescript
this.fragmentsManager = this.components.get(OBC.FragmentsManager);
this.ifcLoader = this.components.get(OBC.IfcLoader);
```

This ensures components are properly registered in the Components system.

### 2. Add Components.init() Call (ifc-viewer.service.ts)
**Added after component initialization:**
```typescript
// Initialize the Components system
this.components.init();
console.log('Components system initialized');
```

This starts the Components system's internal processes.

### 3. Wait for Worker Initialization (ifc-viewer.service.ts)
**Added polling mechanism:**
```typescript
// Wait for the worker to be ready (poll with timeout)
const maxWaitTime = 5000; // 5 seconds
const pollInterval = 100; // Check every 100ms
const startTime = Date.now();

while (!this.fragmentsManager.initialized && (Date.now() - startTime) < maxWaitTime) {
  await new Promise(resolve => setTimeout(resolve, pollInterval));
}

if (this.fragmentsManager.initialized) {
  console.log('FragmentsManager worker initialized successfully');
} else {
  console.warn('FragmentsManager worker may not be fully initialized after waiting');
}
```

This ensures the worker is ready before proceeding.

### 4. Fix Coordinate Parameter (ifc-viewer.service.ts)
**Before:**
```typescript
const model = await this.ifcLoader.load(buffer, false, fileName, {...});
```

**After:**
```typescript
const model = await this.ifcLoader.load(buffer, true, fileName, {...});
```

Setting `coordinate: true` enables coordinate transformation to origin, which is the recommended setting.

### 5. Enhanced Error Handling and Logging
- Added comprehensive logging throughout the loading process
- Improved error messages for better debugging
- Added user-friendly error alerts with specific error messages
- Added null checks and validation

### 6. Unit Tests
Added tests to verify:
- Loading state is properly managed
- Errors are handled gracefully
- Loading state is reset even when errors occur

## Testing Instructions

### Manual Testing
1. Start the development server:
   ```bash
   cd space-modeller
   npm start
   ```

2. Open http://localhost:4200 in your browser

3. Open browser Developer Tools (F12) to see console logs

4. Click "Load IFC" button and select an IFC file

5. Verify:
   - Loading spinner appears
   - Console shows initialization logs:
     ```
     FragmentsManager.init() called with worker URL: ...
     FragmentsManager worker initialized successfully
     IfcLoader initialized successfully
     Components system initialized
     ```
   - Console shows loading progress:
     ```
     Starting to load file: example.ifc
     File read successfully, size: XXXXX bytes
     Loading IFC file: example, size: XXXXX bytes
     Loading progress: XX.X%
     ```
   - Loading spinner disappears when complete
   - Model appears in the 3D viewport
   - Success alert is shown

### Automated Tests
Run unit tests:
```bash
cd space-modeller
npm test
```

All tests should pass (7/7).

## Browser Console Debugging

If loading still fails, check browser console for:

1. **Worker loading errors**:
   - Look for network errors loading worker.mjs
   - Verify worker URL is accessible

2. **WASM loading errors**:
   - Look for 404 errors for web-ifc.wasm files
   - Verify /assets/wasm/ directory contains WASM files

3. **Initialization warnings**:
   - "FragmentsManager may not be fully initialized" - Worker didn't load in 5 seconds
   - "FragmentsManager not initialized" - Worker never initialized

4. **Loading errors**:
   - Error messages will indicate specific failure points
   - Stack traces help identify root cause

## Known Limitations

- The FragmentsManager worker is loaded from a CDN (https://thatopen.github.io/engine_fragment/resources/worker.mjs)
- If the CDN is unavailable, loading will fail
- Large IFC files may take time to load and process
- Browser must support WebAssembly

## Verification

To verify the fix is working:
1. ✅ Build completes without errors: `npm run build`
2. ✅ All tests pass: `npm test`
3. ✅ Loading spinner appears and disappears correctly
4. ✅ Console shows proper initialization sequence
5. ✅ IFC model appears in viewport after loading
6. ✅ No errors in browser console
