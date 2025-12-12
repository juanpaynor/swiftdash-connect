'use client';

import { useEffect } from 'react';
import { useBranding } from '@/lib/branding/theme-provider';

/**
 * ThemeInjector - Injects organization branding CSS variables into the DOM
 * This component listens to the branding context and updates CSS custom properties
 */
export function ThemeInjector() {
  const { branding, isLoading } = useBranding();

  useEffect(() => {
    if (isLoading || !branding) {
      return;
    }

    // Convert hex color to HSL for CSS variables
    const hexToHSL = (hex: string): string => {
      // Remove # if present
      hex = hex.replace('#', '');

      // Convert hex to RGB
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0,
        s = 0,
        l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g:
            h = ((b - r) / d + 2) / 6;
            break;
          case b:
            h = ((r - g) / d + 4) / 6;
            break;
        }
      }

      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);

      return `${h} ${s}% ${l}%`;
    };

    // Apply branding colors
    const root = document.documentElement;

    if (branding.primary_color) {
      root.style.setProperty('--primary', hexToHSL(branding.primary_color));
    }

    if (branding.secondary_color) {
      root.style.setProperty('--secondary', hexToHSL(branding.secondary_color));
    }

    if (branding.accent_color) {
      root.style.setProperty('--accent', hexToHSL(branding.accent_color));
      root.style.setProperty('--ring', hexToHSL(branding.accent_color));
    }

    // Apply fonts
    if (branding.font_family) {
      root.style.setProperty('--font-headline', branding.font_family);
      root.style.setProperty('--font-body', branding.font_family);
    }

    // Cleanup function to reset on unmount
    return () => {
      // Reset to default SwiftDash colors
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--font-headline');
      root.style.removeProperty('--font-body');
    };
  }, [branding, isLoading]);

  return null;
}
