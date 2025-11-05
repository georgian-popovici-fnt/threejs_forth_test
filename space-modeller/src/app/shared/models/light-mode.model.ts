/**
 * Lighting modes for the 3D viewer
 */
export enum LightMode {
  /** Default ambient + directional lighting */
  DEFAULT = 'default',
  /** Bright lighting with increased ambient and directional */
  BRIGHT = 'bright',
  /** Soft ambient lighting only */
  SOFT = 'soft',
  /** Dramatic lighting with stronger directional */
  DRAMATIC = 'dramatic',
}

/**
 * Light mode option for dropdown selection
 */
export interface LightModeOption {
  /** Unique identifier */
  value: LightMode;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
}

/**
 * Available light mode options
 */
export const LIGHT_MODE_OPTIONS: LightModeOption[] = [
  {
    value: LightMode.DEFAULT,
    label: 'Default',
    description: 'Balanced ambient and directional lighting',
  },
  {
    value: LightMode.BRIGHT,
    label: 'Bright',
    description: 'Increased lighting for better visibility',
  },
  {
    value: LightMode.SOFT,
    label: 'Soft',
    description: 'Gentle ambient lighting',
  },
  {
    value: LightMode.DRAMATIC,
    label: 'Dramatic',
    description: 'Strong directional lighting with shadows',
  },
];
