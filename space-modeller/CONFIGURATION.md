# Space Modeller - Configuration Documentation

## Project Overview
This is an Angular 18 application named **space-modeller** created with the following specifications:

## Key Features

### 1. Angular 18
- **Version**: Angular 18.2.x
- **Architecture**: Standalone components (no NgModules)
- **Routing**: Enabled with Angular Router

### 2. TypeScript Configuration
- **Version**: TypeScript 5.5.2
- **Strict Mode**: Enabled (`strict: true`)
- **No Implicit Any**: Explicitly enabled (`noImplicitAny: true`)
- Additional strict flags enabled:
  - `noImplicitOverride: true`
  - `noPropertyAccessFromIndexSignature: true`
  - `noImplicitReturns: true`
  - `noFallthroughCasesInSwitch: true`

### 3. Change Detection Strategy
- **Default**: OnPush change detection for all new components
- Configuration in `angular.json`:
  ```json
  "schematics": {
    "@schematics/angular:component": {
      "changeDetection": "OnPush"
    }
  }
  ```

## Project Structure
```
space-modeller/
├── src/
│   ├── app/
│   │   ├── app.component.ts      # Root component (standalone)
│   │   ├── app.config.ts         # Application configuration
│   │   └── app.routes.ts         # Route definitions
│   ├── main.ts                   # Application bootstrap
│   └── index.html                # Main HTML file
├── angular.json                  # Angular CLI configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

## Available Commands

### Development
```bash
npm start          # Start development server
npm run watch      # Build with watch mode
```

### Build
```bash
npm run build      # Production build
```

### Testing
```bash
npm test           # Run unit tests
```

## Verification

To verify the configuration is working correctly:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Run tests**:
   ```bash
   npm test -- --no-watch --browsers=ChromeHeadless
   ```

3. **Generate a new component** (to verify OnPush is default):
   ```bash
   ng generate component my-component
   ```
   
   The generated component will automatically have:
   ```typescript
   changeDetection: ChangeDetectionStrategy.OnPush
   ```

## Notes
- All components use standalone architecture
- Strict TypeScript settings prevent the use of `any` types
- OnPush change detection improves performance by reducing change detection cycles
- The app follows Angular 18 best practices and modern standards
