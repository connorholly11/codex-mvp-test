# Design Tokens - Mobile Tool Bridge

The confirm sheet and nudge surfaces follow the "modern calm" direction. Tokens mapping:

## Color Palette

| Token | Value | Usage |
| ----- | ----- | ----- |
| `color.background.primary` | `#0d0a1a` | App background (safe area, chat gradient base). |
| `color.surface` | `#151026` | Cards, tool highlights, empty states. |
| `color.surface.elevated` | `#1e1933` | Hero card, confirmation sheet container. |
| `color.border.muted` | `rgba(255,255,255,0.08)` | Card outlines and divider hairlines. |
| `color.text.primary` | `#f8f7ff` | High-emphasis text. |
| `color.text.secondary` | `rgba(248,247,255,0.72)` | Body copy and helper text. |
| `color.text.muted` | `rgba(248,247,255,0.56)` | Metadata, captions, footnotes. |
| `color.text.inverted` | `#0d0a1a` | Text on accent buttons. |
| `color.accent` | `#7c6cff` | Primary actions, badges, sparkline. |
| `color.error` | `#ff6b6b` | Error copy/pills. |

## Typography

- Headline: `font.family = "Space Grotesk", weight 700, size 18` (confirm sheet titles).
- Body: `font.family = "Inter", weight 500, size 14`, line height 20.
- Footnote: `font.family = "Inter", weight 500, size 12`, uppercase tracking 6 for badges.

## Radii & Spacing

- `radius.card` = 20 (confirm sheet, empty states).
- `radius.button` = 16 (primary/secondary CTAs).
- `radius.pill` = 12 (detail highlights, error banners).
- Vertical rhythm: 12px increments; highlight cards use 8px internal gap.
- Horizontal padding for sheets: 18px, vertical 18px.

## Motion

- Layout transitions: spring `duration 180ms`, damping 18, overshoot 1.05.
- Button press: scale to 0.97 with haptic light impact.
- Typing indicator: dot opacity pulse `duration 900ms` offset by 120ms each.

## Shadows / Glows

- `shadow.soft` = `0 18px 48px rgba(124,108,255,0.18)` used behind elevated cards.
- `focus.glow` = inset `0 0 0 1px rgba(248,247,255,0.18)` for keyboard focus states.

## Iconography

- Icon stroke color `rgba(248,247,255,0.72)` with 1.5px weight.
- Use orbiting spark glyph for analytics success states (`accent` gradient).

These tokens map to the Expo stylesheet via `palette` (see `apps/mobile/theme/index.ts`). Future design-system work should lift them into a shared JSON token file for cross-platform consumption.
