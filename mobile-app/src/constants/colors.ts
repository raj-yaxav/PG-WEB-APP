/**
 * PG Manager — Design System Colors
 */

export const Colors = {
  // Primary
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#93C5FD',
  primaryBg: '#DBEAFE',
  primaryGradientStart: '#3B82F6',
  primaryGradientEnd: '#1D4ED8',

  // Backgrounds
  background: '#F0F7FF',
  surface: '#FFFFFF',
  surfaceVariant: '#EAF2FF',
  clayBase: '#F0F7FF',
  claySurface: '#F8FBFF',
  clayInset: '#E4EEFC',

  // Text
  textPrimary: '#0F1F3D',
  textSecondary: '#405575',
  textTertiary: '#70819C',
  textInverse: '#FFFFFF',

  // Borders
  border: '#D7E4F7',
  borderLight: '#EDF5FF',
  borderInput: '#C5D6F0',
  borderInputFocus: '#2563EB',

  // Status
  success: '#0284C7',
  successBg: '#E0F2FE',
  error: '#DC2626',
  errorBg: '#FEE2E2',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  info: '#2563EB',
  infoBg: '#E0F2FE',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: 'rgba(37, 99, 235, 0.14)',
  shadowDeep: 'rgba(30, 64, 175, 0.18)',
  shadowLight: 'rgba(255, 255, 255, 0.92)',
} as const;

export type ColorType = typeof Colors;
