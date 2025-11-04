/**
 * Application-wide constants
 */

/**
 * File validation constants
 */
export const FILE_VALIDATION = {
  /** Maximum file size in bytes (100 MB) */
  MAX_FILE_SIZE: 100 * 1024 * 1024,
  /** Allowed file extensions for IFC files */
  ALLOWED_EXTENSIONS: ['.ifc'],
} as const;

/**
 * Timing constants for various operations
 */
export const TIMING = {
  /** Default notification duration in milliseconds */
  NOTIFICATION_DURATION: 3000,
  /** Throttle interval for fragment updates in milliseconds */
  FRAGMENT_UPDATE_THROTTLE: 100,
  /** Worker initialization timeout in milliseconds */
  WORKER_INIT_TIMEOUT: 5000,
  /** Worker polling interval in milliseconds */
  WORKER_POLL_INTERVAL: 100,
  /** Camera fit delay in milliseconds */
  CAMERA_FIT_DELAY: 200,
} as const;

/**
 * Viewer rendering constants
 */
export const VIEWER = {
  /** Maximum pixel ratio for high DPI displays */
  MAX_PIXEL_RATIO: 2,
  /** Default grid size */
  GRID_SIZE: 20,
  /** Default grid divisions */
  GRID_DIVISIONS: 20,
  /** Grid primary color */
  GRID_COLOR_PRIMARY: 0x444444,
  /** Grid secondary color */
  GRID_COLOR_SECONDARY: 0x222222,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_FILE_TYPE: 'Please select a valid IFC file',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed size',
  NO_MODEL_LOADED: 'No model loaded. Please load an IFC file first',
  EXPORT_FAILED: 'Failed to export fragments. Check console for details',
  LOAD_FAILED: 'Error loading IFC file',
  VIEWER_NOT_INITIALIZED: 'Viewer not initialized',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  FILE_LOADED: (fileName: string) => `Successfully loaded: ${fileName}`,
  FILE_EXPORTED: (fileName: string) => `Successfully exported ${fileName}.frag`,
} as const;
