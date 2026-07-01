/**
 * PG Manager — Design System Colors
 */

export const Colors = {
  // Primary
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  primaryBg: '#EEF2FF',
  primaryGradientStart: '#6366F1',
  primaryGradientEnd: '#8B5CF6',

  // Backgrounds
  background: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceVariant: '#F9FAFB',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderInput: '#D1D5DB',
  borderInputFocus: '#6366F1',

  // Status
  success: '#22C55E',
  successBg: '#DCFCE7',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  info: '#3B82F6',
  infoBg: '#DBEAFE',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: 'rgba(0, 0, 0, 0.08)',
} as const;

export type ColorType = typeof Colors;
