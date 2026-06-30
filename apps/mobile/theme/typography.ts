// ═══════════════════════════════════════════════════
// SekolahPintar — Typography
// ═══════════════════════════════════════════════════

import type { FontSizePreset } from '@/types';

export interface TypographyScale {
  caption: number;
  body: number;
  bodyLarge: number;
  subtitle: number;
  title: number;
  header: number;
  hero: number;
}

export const fontSizes: Record<FontSizePreset, TypographyScale> = {
  small: {
    caption: 11,
    body: 13,
    bodyLarge: 14,
    subtitle: 15,
    title: 17,
    header: 20,
    hero: 28,
  },
  medium: {
    caption: 12,
    body: 15,
    bodyLarge: 16,
    subtitle: 17,
    title: 19,
    header: 22,
    hero: 32,
  },
  large: {
    caption: 14,
    body: 18,
    bodyLarge: 19,
    subtitle: 20,
    title: 22,
    header: 26,
    hero: 36,
  },
};

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
};
