/**
 * Schedelux mobile design tokens — aligned with web globals.css & docs/design-system/TOKENS.md
 */

export const palette = {
  primaryPink: "#F8BBD0",
  softPinkBackground: "#FFF7FA",
  accentRose: "#E879A6",
  deepRose: "#DB2777",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  borderSoft: "#F3D6E3",
  cardBackground: "#FFFFFF",
  appBackground: "#FAFAFA",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#DC2626",
  info: "#2563EB",
} as const;

/** Semantic colors used across React Native components. */
export const colors = {
  background: palette.softPinkBackground,
  surface: palette.cardBackground,
  primary: palette.primaryPink,
  primaryDark: palette.accentRose,
  primaryForeground: "#3D2230",
  accent: palette.accentRose,
  deepRose: palette.deepRose,
  muted: "#F3E8EE",
  mutedForeground: palette.textMuted,
  border: palette.borderSoft,
  destructive: palette.error,
  success: palette.success,
  warning: palette.warning,
  info: palette.info,
  white: "#FFFFFF",
  black: palette.textDark,
  foreground: palette.textDark,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  full: 999,
  button: 12,
  input: 12,
  card: 16,
  modal: 16,
} as const;

export const shadows = {
  soft: {
    shadowColor: palette.accentRose,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  elevated: {
    shadowColor: palette.accentRose,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "PlusJakartaSans_500Medium",
    sansBold: "PlusJakartaSans_700Bold",
    sansSemiBold: "PlusJakartaSans_600SemiBold",
    fallback: "Inter_400Regular",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    display: 32,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const;

export const touchTargetMinPx = 44;
