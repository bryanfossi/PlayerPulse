export const brand = {
  colors: {
    // FUSE-ID brand-kit hexes (dark mode). Lowercase per spec.
    bgPrimary: '#0f1120',
    bgSecondary: '#1a1f35',
    bgRaised: '#252b44',
    accent: '#4ade80',        // green-400
    accentDeep: '#22c55e',    // green-500
    accentPressed: '#16a34a', // green-600
    textPrimary: '#ffffff',
    textMuted: '#9ca3af',
    textTertiary: '#555555',
    border: '#252b44',
  },
  logo: {
    full: '/brand/logo-full.svg',
    stacked: '/brand/logo-stacked.svg',
    stackedTransparent: '/brand/logo-stacked-transparent.svg',
    icon: '/brand/logo-icon.svg',
    light: '/brand/logo-full-light.svg',
  },
  appName: 'FUSE-ID',
  tagline: 'Your recruiting process, fused.',
} as const
