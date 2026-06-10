/**
 * Schedelux design tokens — single source of truth for TS/React usage.
 * CSS variables in globals.css remain the runtime theme for Tailwind/shadcn.
 * @see docs/design-system/TOKENS.md
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

export const radii = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.25rem",
  "2xl": "1.5rem",
  full: "9999px",
  button: "0.75rem",
  input: "0.75rem",
  card: "1rem",
  modal: "1rem",
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "2.5rem",
  "3xl": "3rem",
} as const;

export const shadows = {
  soft: "0 4px 24px -4px rgba(232, 121, 166, 0.12), 0 2px 8px -2px rgba(31, 41, 55, 0.06)",
  elevated:
    "0 12px 40px -8px rgba(232, 121, 166, 0.18), 0 4px 16px -4px rgba(31, 41, 55, 0.1)",
} as const;

export const typography = {
  fontFamily: {
    sans: 'var(--font-sans), var(--font-inter), "Inter", system-ui, sans-serif',
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    display: "2rem",
  },
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.625",
  },
} as const;

/** Minimum touch target (mobile). */
export const touchTargetMinPx = 44;
