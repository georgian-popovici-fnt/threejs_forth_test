/**
 * Configuration interface for the IFC 3D Viewer
 */
export interface ViewerConfig {
  /**
   * WASM path configuration for web-ifc
   * Use local path for production or CDN for development
   */
  wasmPath: string;

  /**
   * Initial camera configuration
   */
  camera: {
    /** Camera position */
    position: { x: number; y: number; z: number };
    /** Camera target (look-at point) */
    target: { x: number; y: number; z: number };
    /** Field of view in degrees */
    fov: number;
    /** Near clipping plane */
    near: number;
    /** Far clipping plane */
    far: number;
  };

  /**
   * Scene background color (CSS color or hex)
   */
  backgroundColor: string;

  /**
   * Whether to show the grid helper
   */
  showGrid: boolean;

  /**
   * Whether to show the stats panel (memory usage)
   */
  showStats: boolean;

  /**
   * FragmentsManager worker URL
   */
  fragmentsWorkerUrl: string;
}

/**
 * Default viewer configuration
 */
export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
  // Local WASM path (recommended for production)
  // Switch to CDN for quick development: 'https://unpkg.com/web-ifc@0.0.57/web-ifc.wasm'
  wasmPath: '/assets/wasm/',

  camera: {
    position: { x: 10, y: 10, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    fov: 75,
    near: 0.1,
    far: 1000,
  },

  backgroundColor: '#0e1013',

  showGrid: true,

  showStats: true,

  // Use local worker file to avoid CORS issues
  fragmentsWorkerUrl: '/assets/fragments/worker.mjs',
};
