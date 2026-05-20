/** Baby-pink premium palette — aligned with web globals.css */
export const colors = {
  background: "#FFF7FA",
  surface: "#FFFFFF",
  primary: "#F8BBD0",
  primaryDark: "#E879A6",
  primaryForeground: "#3D2230",
  accent: "#E879A6",
  muted: "#F3E8EE",
  mutedForeground: "#7A5C6A",
  border: "#F0D4E0",
  destructive: "#DC2626",
  success: "#059669",
  white: "#FFFFFF",
  black: "#1A1015",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;
