# BeautyOS Design Tokens

Foundation reference for **Batch UI-1**. Web uses CSS variables + Tailwind; mobile uses `salonmobileapp/src/theme/tokens.ts`.

## Color palette

| Token | Hex | Usage |
|-------|-----|--------|
| Primary Pink | `#F8BBD0` | Buttons, highlights, sidebar accents |
| Soft Pink Background | `#FFF7FA` | App shell background (web/mobile) |
| Accent Rose | `#E879A6` | Links, charts, active states |
| Deep Rose | `#DB2777` | Strong CTAs, emphasis (use sparingly) |
| Text Dark | `#1F2937` | Headings, primary body |
| Text Muted | `#6B7280` | Secondary labels, hints |
| Border Soft | `#F3D6E3` | Cards, inputs, dividers |
| Card Background | `#FFFFFF` | Cards, modals, popovers |
| App Background | `#FAFAFA` | Neutral page sections (optional) |
| Success | `#16A34A` | Paid, connected, complete |
| Warning | `#F59E0B` | Pending, trial, attention |
| Error | `#DC2626` | Failed, destructive actions |
| Info | `#2563EB` | Informational badges |

**Rule:** Baby pink is an **accent**, not a full-page fill. Prefer white cards on soft pink or neutral backgrounds.

## Typography

| Role | Font | Web class / mobile size |
|------|------|-------------------------|
| Display | Plus Jakarta Sans 700 | `text-display` / 32px |
| Heading | Plus Jakarta Sans 600–700 | `text-2xl`–`text-3xl` / 24–30px |
| Title | Plus Jakarta Sans 600 | `text-title` / 20px |
| Body | Plus Jakarta Sans / Inter 400 | `text-body` / 16px |
| Caption | Plus Jakarta Sans 500 | `text-caption` / 14px |
| Label | Plus Jakarta Sans 600 uppercase | `text-label` / 12px |

**Web fonts:** loaded in `frontend-nextjs/src/app/layout.tsx` (`Plus_Jakarta_Sans`, `Inter`).

**Mobile fonts:** loaded in `salonmobileapp/src/app/_layout.tsx` via `@expo-google-fonts/*`.

## Radius

| Element | Token | Value |
|---------|--------|-------|
| Buttons | `--radius-button` / `radii.button` | 12px (`rounded-xl`) |
| Inputs | `--radius-input` / `radii.input` | 12px |
| Cards | `--radius-card` / `radii.card` | 16px (`rounded-2xl`) |
| Modals | `--radius-modal` / `radii.modal` | 16px |
| Pills | `radii.full` | 999px |

## Spacing

| Token | rem (web) | px (mobile) |
|-------|-----------|-------------|
| xs | 0.25 | 4 |
| sm | 0.5 | 8 |
| md | 1 | 16 |
| lg | 1.5 | 24 |
| xl | 2 | 32 |
| 2xl | 2.5 | 40 |
| 3xl | 3 | 48 |

Web utility classes: `beauty-xs` … `beauty-3xl` (Tailwind spacing).

## Shadows

Use **soft** shadows only — avoid heavy admin-template drops.

| Name | Web | Mobile |
|------|-----|--------|
| soft | `shadow-soft` | `shadows.soft` |
| elevated | `shadow-elevated` | `shadows.elevated` |

## Touch targets (mobile)

Minimum **44px** height/width for interactive controls. Web utility: `min-touch`.

## Dark mode (web)

Class-based `.dark` overrides live in `globals.css`. Semantic tokens (`success`, `warning`, `info`, `destructive`) are defined for both themes. Brand RGB vars (`--brand-*`) stay readable in dark UI.

## File map

| Platform | Source |
|----------|--------|
| Web CSS | `frontend-nextjs/src/app/globals.css` |
| Web Tailwind | `frontend-nextjs/tailwind.config.ts` |
| Web TS | `frontend-nextjs/src/lib/design-tokens.ts` |
| Mobile | `salonmobileapp/src/theme/tokens.ts` |

## Usage examples

**Web (Tailwind):**

```tsx
<div className="rounded-card border border-border bg-card p-beauty-lg shadow-soft">
  <h2 className="text-title">Today&apos;s bookings</h2>
  <p className="text-caption text-muted-foreground">12 appointments</p>
  <button className="min-touch rounded-button bg-primary px-4 py-2 text-primary-foreground">
    New booking
  </button>
</div>
```

**Mobile (React Native):**

```tsx
import { colors, radii, spacing, shadows, typography } from "@/theme/tokens";

<View style={{ backgroundColor: colors.surface, borderRadius: radii.card, padding: spacing.lg, ...shadows.soft }}>
  <Text style={{ fontFamily: typography.fontFamily.sansBold, fontSize: typography.fontSize.xl }}>
    Today&apos;s bookings
  </Text>
</View>
```
