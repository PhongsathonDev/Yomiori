import { ViewStyle } from 'react-native';

/** Radius scale, matching the web design system. */
export const radius = {
  xs: 3,
  sm: 6,
  md: 10,
  lg: 14,
  full: 999,
} as const;

/** Spacing rhythm: 4 → 32. */
export const space = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Interface type scale. Reading type is controlled by the reader settings. */
export const typeScale = {
  micro: 10,
  meta: 11,
  caption: 12,
  body: 13,
  bodyLg: 14,
  title: 16,
  heading: 18,
  display: 21,
  hero: 25,
} as const;

/**
 * Shadows stay almost invisible: on paper-like surfaces the hairline does the
 * separating, and a heavy drop shadow is what makes an app look generic.
 */
export const shadowSoft: ViewStyle = {
  shadowColor: '#2b2825',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 1,
};

export const shadowRaised: ViewStyle = {
  shadowColor: '#2b2825',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

/** Minimum comfortable touch target. */
export const hitTarget = 44;
