# CORS Worker Fix

## Problem
The application was failing with a CORS (Cross-Origin Resource Sharing) error when trying to load the FragmentsManager worker script from an external CDN:

```
ERROR SecurityError: Failed to construct 'Worker': Script at 'https://thatopen.github.io/engine_fragment/resources/worker.mjs' cannot be accessed from origin 'http://localhost:4200'.
```

This is a browser security restriction that prevents loading worker scripts from different origins.

## Solution
Changed from using an external CDN URL to serving the worker file locally from the application's assets:

1. **Added worker file to assets**: Copied `worker.mjs` from `@thatopen/fragments` package to `public/assets/fragments/`
2. **Updated configuration**: Changed `fragmentsWorkerUrl` from external CDN to local path `/assets/fragments/worker.mjs`
3. **Automated copying**: Added postinstall script to automatically copy the worker file when dependencies are installed

## Changes Made

### 1. Worker File Location
- **Source**: `node_modules/@thatopen/fragments/dist/Worker/worker.mjs`
- **Destination**: `public/assets/fragments/worker.mjs`

### 2. Configuration Update (viewer-config.model.ts)
**Before:**
```typescript
fragmentsWorkerUrl: 'https://thatopen.github.io/engine_fragment/resources/worker.mjs',
```

**After:**
```typescript
// Use local worker file to avoid CORS issues
fragmentsWorkerUrl: '/assets/fragments/worker.mjs',
```

### 3. Postinstall Script (package.json)
```json
"scripts": {
  "postinstall": "node scripts/copy-worker.js"
}
```

### 4. Copy Script (scripts/copy-worker.js)
A Node.js script that automatically copies the worker file from node_modules to public/assets after `npm install`.

## Files Changed
- `public/assets/fragments/worker.mjs` - Added worker file
- `src/app/shared/models/viewer-config.model.ts` - Updated worker URL
- `package.json` - Added postinstall script
- `scripts/copy-worker.js` - Added copy script
- `BUGFIX-IFC-LOADING.md` - Updated documentation

## Benefits
- ✅ No CORS errors
- ✅ Works offline (no external CDN dependency)
- ✅ Faster loading (served locally)
- ✅ More reliable (no external service dependency)
- ✅ Automatic setup via postinstall script

## Testing
All tests pass (7/7):
```bash
npm test -- --no-watch --browsers=ChromeHeadless
```

Build succeeds without errors:
```bash
npm run build
```

Worker file is correctly included in build output at:
```
dist/space-modeller/browser/assets/fragments/worker.mjs
```

## Deployment Notes
- The worker file is automatically copied during `npm install`
- The worker file is committed to version control
- The worker file is included in production builds
- No special configuration needed for deployment
