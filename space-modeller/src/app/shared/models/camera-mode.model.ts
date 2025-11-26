/**
 * Camera view modes for the 3D viewer
 */
export enum CameraMode {
  /** 3D perspective view with orbit controls */
  PERSPECTIVE_3D = 'perspective-3d',
  /** 2D orthographic top view (looking down along Y-axis) */
  ORTHOGRAPHIC_TOP = 'orthographic-top',
  /** 2D orthographic front view (looking along Z-axis) */
  ORTHOGRAPHIC_FRONT = 'orthographic-front',
  /** 2D orthographic side view (looking along X-axis) */
  ORTHOGRAPHIC_SIDE = 'orthographic-side',
}

/**
 * Camera mode option for dropdown selection
 */
export interface CameraModeOption {
  /** Unique identifier */
  value: CameraMode;
  /** Display label */
  label: string;
  /** Optional icon name */
  icon?: string;
}

/**
 * Available camera mode options
 */
export const CAMERA_MODE_OPTIONS: CameraModeOption[] = [
  {
    value: CameraMode.PERSPECTIVE_3D,
    label: '3D View',
    icon: 'cube',
  },
  {
    value: CameraMode.ORTHOGRAPHIC_TOP,
    label: '2D Top View',
    icon: 'square',
  },
  {
    value: CameraMode.ORTHOGRAPHIC_FRONT,
    label: '2D Front View',
    icon: 'square',
  },
  {
    value: CameraMode.ORTHOGRAPHIC_SIDE,
    label: '2D Side View',
    icon: 'square',
  },
];
