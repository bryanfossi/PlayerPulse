export const brand = {
  colors: {
    // Primary surfaces
    bgPrimary: '#0F1120',
    bgSecondary: '#1A1F38',
    // Accent (electric green)
    accent: '#4ADE80',
    accentDeep: '#22C55E',
    // Text
    textPrimary: '#FFFFFF',
    textMuted: '#9CA3AF',
    // Borders
    border: 'rgba(255,255,255,0.1)',

    // Legacy aliases — kept for incremental migration
    green: '#4ADE80',
    dark: '#0F1120',
    white: '#FFFFFF',
    mintPop: '#E2F9EC',
  },
  logo: {
    full: '/brand/logo-full.svg',
    stacked: '/brand/logo-stacked.svg',
    stackedTransparent: '/brand/logo-stacked-transparent.svg',
    icon: '/brand/logo-icon.svg',
    light: '/brand/logo-full-light.svg',
  },
  appName: 'FuseID',
  tagline: 'Your recruiting process, fused.',
} as const
