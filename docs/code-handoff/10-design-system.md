# 10 — Design system & theming

The web uses Tailwind CSS variables driven by OKLCH color tokens, three theme modes (`light`/`dark`/`system`), and six interchangeable accent palettes. The RN port keeps the **same conceptual model** but delivers it through a JS theme object consumed by themed components (and optionally NativeWind for Tailwind ergonomics).

Web reference: `src/index.css` (1–220), `src/store/settings.ts`.

---

## Color tokens

All colors are defined in OKLCH on web. RN can use **OKLCH directly** (via `culori` or `colorjs.io` for conversion), but the simpler path is to **precompute hex / rgba** for every (theme × accent × token) combination at build time. The lookups below are the converted values — copy them.

### Light mode base

| Token              | OKLCH                          | Hex / rgba         |
| ------------------ | ------------------------------ | ------------------ |
| background         | `oklch(1 0 0)`                 | `#FFFFFF`          |
| foreground         | `oklch(0.145 0 0)`             | `#252525`          |
| card               | `oklch(1 0 0)`                 | `#FFFFFF`          |
| card-foreground    | `oklch(0.145 0 0)`             | `#252525`          |
| popover            | `#FFFFFF`                      |                    |
| popover-foreground | `#252525`                      |                    |
| primary            | `oklch(0.205 0 0)`             | `#343434`  (overridden by accent) |
| primary-foreground | `oklch(0.985 0 0)`             | `#FBFBFB`          |
| secondary          | `oklch(0.97 0 0)`              | `#F5F5F5`          |
| muted              | `#F5F5F5`                      |                    |
| muted-foreground   | `oklch(0.556 0 0)`             | `#878787`          |
| accent             | `#F5F5F5`                      |                    |
| destructive        | `oklch(0.577 0.245 27.325)`    | `#DC2626` (≈ Tailwind red-600) |
| destructive-fg     | `#FFFFFF`                      |                    |
| border             | `oklch(0.922 0 0)`             | `#E5E5E5`          |
| input              | `#E5E5E5`                      |                    |
| ring               | `oklch(0.708 0 0)`             | `#B5B5B5`          |
| success            | (not in CSS — use)             | `#16A34A`          |
| warning            | (not in CSS — use)             | `#D97706`          |

### Dark mode base

| Token              | OKLCH                          | Hex / rgba         |
| ------------------ | ------------------------------ | ------------------ |
| background         | `oklch(0.145 0 0)`             | `#252525`          |
| foreground         | `oklch(0.985 0 0)`             | `#FBFBFB`          |
| card               | `oklch(0.205 0 0)`             | `#343434`          |
| popover            | `#343434`                      |                    |
| primary            | `oklch(0.922 0 0)`             | `#E5E5E5`  (overridden by accent) |
| primary-foreground | `oklch(0.205 0 0)`             | `#343434`          |
| secondary          | `oklch(0.269 0 0)`             | `#454545`          |
| muted              | `#454545`                      |                    |
| muted-foreground   | `oklch(0.708 0 0)`             | `#B5B5B5`          |
| destructive        | `oklch(0.704 0.191 22.216)`    | `#F87171`          |
| border             | `rgba(255,255,255,0.10)`       |                    |
| input              | `rgba(255,255,255,0.15)`       |                    |
| ring               | `oklch(0.556 0 0)`             | `#878787`          |

### Accent overrides

Six accent palettes replace `primary` (and `ring`) when applied. Both light and dark variants exist.

| Accent  | Light primary                                          | Dark primary                                           |
| ------- | ------------------------------------------------------ | ------------------------------------------------------ |
| zinc    | `oklch(0.27 0.005 285)`  ≈ `#3F3F46`                   | `oklch(0.92 0.004 285)`  ≈ `#E4E4E7`                   |
| blue    | `oklch(0.55 0.2 250)`     ≈ `#2563EB`                   | `oklch(0.65 0.2 250)`     ≈ `#3B82F6`                   |
| green   | `oklch(0.55 0.17 155)`    ≈ `#16A34A`                   | `oklch(0.65 0.2 155)`     ≈ `#22C55E`                   |
| purple  | `oklch(0.55 0.2 290)`     ≈ `#7C3AED`                   | `oklch(0.7 0.18 290)`     ≈ `#A78BFA`                   |
| orange  | `oklch(0.65 0.2 50)`      ≈ `#EA580C`                   | `oklch(0.7 0.18 50)`      ≈ `#F97316`                   |
| rose    | `oklch(0.6 0.2 10)`       ≈ `#E11D48`                   | `oklch(0.7 0.18 10)`      ≈ `#FB7185`                   |

The hex values above are approximate — for pixel-accurate parity convert directly from OKLCH (the `colorjs.io` JS library does this in two lines).

### Chart palette

Five distinct values for data viz, defined for both modes (`--chart-1` … `--chart-5`). Use them in order for pie / bar / line series.

Light:

| Chart # | OKLCH                            | Hex     |
| ------- | -------------------------------- | ------- |
| 1       | `oklch(0.646 0.222 41.116)`     | `#F97316` |
| 2       | `oklch(0.6 0.118 184.704)`      | `#0891B2` |
| 3       | `oklch(0.398 0.07 227.392)`     | `#1E40AF` |
| 4       | `oklch(0.828 0.189 84.429)`     | `#FACC15` |
| 5       | `oklch(0.769 0.188 70.08)`      | `#F59E0B` |

Dark:

| Chart # | OKLCH                            | Hex     |
| ------- | -------------------------------- | ------- |
| 1       | `oklch(0.488 0.243 264.376)`    | `#6366F1` |
| 2       | `oklch(0.696 0.17 162.48)`      | `#34D399` |
| 3       | `oklch(0.769 0.188 70.08)`      | `#F59E0B` |
| 4       | `oklch(0.627 0.265 303.9)`      | `#C084FC` |
| 5       | `oklch(0.645 0.246 16.439)`     | `#F472B6` |

---

## ThemeProvider (RN)

A React context that builds a `theme` object from the settings store:

```ts
// src/theme/ThemeProvider.tsx
import { useColorScheme } from 'react-native'
import { useSettingsStore } from '@/store/settings'
import { tokens } from './tokens'   // the precomputed tables above

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themePref = useSettingsStore((s) => s.theme)
  const accent = useSettingsStore((s) => s.accentColor)
  const systemScheme = useColorScheme()
  const mode = themePref === 'system' ? (systemScheme ?? 'light') : themePref
  const theme = useMemo(() => buildTheme({ mode, accent }), [mode, accent])
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

// buildTheme merges base[mode] + accent[mode][accent] into a flat object:
// { background, foreground, card, primary, primaryForeground, … }
```

Use a `useTheme()` hook everywhere instead of hardcoding colors.

### NativeWind path (recommended)

If using **NativeWind v4**, generate `tailwind.config.js` to expose the same token names:

```js
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        // …
      },
    },
  },
}
```

Drive the CSS variables from the JS theme via NativeWind's `vars()` helper or a top-level `<View style={vars(currentVarsForMode)}>`.

This setup means **you can copy classes like `bg-card text-card-foreground border-border` straight from the web**, which makes porting components much faster.

---

## Typography

- **Font family**: Plus Jakarta Sans (web's `--font-display`). Bundle the font in `assets/fonts/Plus_Jakarta_Sans/` and load with `expo-font` (or `useFonts`). Variants: `400` / `500` / `600` / `700`.
- **Default font**: set globally via a `<Text>` wrapper component or NativeWind's font config so every `<Text>` defaults to Plus Jakarta Sans.

Type scale:

| Token        | Size | Line height | Weight | Usage                                  |
| ------------ | ---- | ----------- | ------ | -------------------------------------- |
| display      | 32   | 40          | 700    | Hero amount on receipt detail          |
| heading-1    | 24   | 32          | 700    | Screen titles                          |
| heading-2    | 20   | 28          | 700    | Section titles, modal titles           |
| heading-3    | 17   | 24          | 600    | Card titles                            |
| body         | 15   | 22          | 400    | Default body text                      |
| body-strong  | 15   | 22          | 600    | Emphasis                               |
| caption      | 13   | 18          | 400    | Secondary text                         |
| caption-strong | 13 | 18          | 600    | Labels above inputs                    |
| mono         | 14   | 20          | 400    | Code values, journal text              |
| overline     | 11   | 14          | 600    | Section headers (uppercase, tracking)  |

Tabular numerals on all monetary values (`fontVariant: ['tabular-nums']`).

---

## Spacing scale

Use the same scale as Tailwind:

`{ 0:0, 0.5:2, 1:4, 1.5:6, 2:8, 2.5:10, 3:12, 4:16, 5:20, 6:24, 8:32, 10:40, 12:48, 16:64, 20:80 }`

Standard paddings:

- Screen edge padding: 16 (`px-4`)
- Card padding: 16 (`p-4`) for compact, 20 (`p-5`) for primary
- Section gap: 24 (`gap-6`)
- Row gap: 12 (`gap-3`)
- List row vertical padding: 16

---

## Radius scale

Web `--radius` is `0.625rem` (10px); derived variants `sm 6 / md 8 / lg 10 / xl 14 / 2xl 18 / 3xl 22`.

| Token   | Radius | Used by                                          |
| ------- | ------ | ------------------------------------------------ |
| sm      | 6      | Chips, small badges                              |
| md      | 8      | Inputs, small buttons                            |
| lg      | 10     | Standard buttons, list rows                      |
| xl      | 14     | Cards, sheets                                    |
| 2xl     | 18     | Hero cards, modal containers                     |
| 3xl     | 22     | Bottom-sheet handles, prominent cards            |
| full    | 999    | Pills, status badges, avatars                    |

---

## Elevation / shadows

RN shadows are platform-specific. Use this 4-step scale:

| Level | iOS shadow                                                 | Android elevation |
| ----- | ---------------------------------------------------------- | ----------------- |
| 0     | none                                                       | 0                 |
| 1     | `{ offset: { 0, 1 }, opacity: 0.04, radius: 2 }`           | 1                 |
| 2     | `{ offset: { 0, 4 }, opacity: 0.08, radius: 8 }`           | 4                 |
| 3     | `{ offset: { 0, 8 }, opacity: 0.12, radius: 16 }`          | 8                 |
| 4     | `{ offset: { 0, 16 }, opacity: 0.16, radius: 32 }`         | 16                |

Use level 2 for FABs and bottom-sheet handles; level 3 for the loyalty card display modal. Cards and rows have **no shadow** by default — they're delineated by a 1pt border.

---

## Component primitives to build

Recreate the web's `src/components/ui/*` as **themed RN components**. Each lives in `src/components/ui/`:

| Component       | Web counterpart                       | Notes                                          |
| --------------- | ------------------------------------- | ---------------------------------------------- |
| Button          | `button.tsx` (CVA variants)           | Variants: default, destructive, outline, secondary, ghost, link. Sizes: sm, md, lg, icon. |
| Card            | `card.tsx`                            | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| Input           | `input.tsx`                           | 48pt tall, themed border, focus ring          |
| Textarea        | `textarea.tsx`                        | Multiline input                                |
| Label           | `label.tsx`                           | Above inputs                                   |
| Badge           | `badge.tsx`                           | Variants: default, secondary, destructive, outline, success, warning. Rounded-full. |
| Switch          | `switch.tsx`                          | Wrap RN `Switch` with themed colors            |
| Checkbox        | `checkbox.tsx`                        | Custom — RN has no native checkbox             |
| Avatar          | `avatar.tsx`                          | Image + fallback initials                      |
| Separator       | `separator.tsx`                       | 1pt line                                       |
| Skeleton        | `skeleton.tsx`                        | Shimmer placeholder                            |
| Progress        | `progress.tsx`                        | Horizontal bar                                 |
| Tabs            | `tabs.tsx`                            | Segmented control                              |
| Tooltip         | `tooltip.tsx`                         | Skip on RN — replace with long-press hint     |
| Popover         | `popover.tsx`                         | Replace with bottom-sheet                      |
| Select          | `select.tsx`                          | Replace with bottom-sheet picker               |
| Date picker     | `date-picker.tsx`                     | Wrap `@react-native-community/datetimepicker`  |
| Calendar        | `calendar.tsx`                        | Wrap `react-native-calendars`                  |
| Alert dialog    | `alert-dialog.tsx`                    | Wrap RN `Alert.alert` (iOS native) or `react-native-modal` |
| Dialog          | `dialog.tsx`                          | `@gorhom/bottom-sheet` (or full-screen modal)  |
| Drawer          | `drawer.tsx`                          | `@gorhom/bottom-sheet`                         |
| Sheet           | `sheet.tsx`                           | `@gorhom/bottom-sheet`                         |
| Confirm dialog  | `confirm-dialog.tsx`                  | Wrapper around alert dialog                    |
| Pagination      | `pagination.tsx`                      | Drop — use infinite scroll                     |
| Sidebar         | `sidebar.tsx`                         | Drop — use bottom tabs                         |
| Currency select | `currency-select.tsx`                 | Searchable bottom-sheet picker                 |
| Emoji picker    | `emoji-picker.tsx`                    | `rn-emoji-keyboard`                            |
| Language switcher | `language-switcher.tsx`             | Custom segmented control                       |
| Logo            | `logo.tsx`                            | SVG or PNG of the brand logo                   |
| Table           | `table.tsx`                           | Drop — stack as list rows                      |

---

## Common patterns

### Cards

- Background: `card`
- Border: `1pt border` colored `border`
- Radius: `2xl` (18)
- Padding: 16 or 20
- No shadow (level 0). Shadow only for elevated modals / FABs.

### List rows

- Height: 64–72pt
- Padding: 16 horizontal
- Separator: 1pt `border` line between rows, indented 16pt from left (typical iOS)
- Tap state: 8% primary tint background
- Swipe actions revealed on swipe-left (`react-native-gesture-handler` + a row component)

### Buttons

- Default: solid primary background, primary-foreground text, radius `lg`
- Outline: transparent background, 1pt border `border`, foreground text
- Ghost: transparent background, primary text, no border
- Destructive: solid destructive background, white text
- Heights: sm 36, md 44, lg 52, icon 44×44
- Disabled: 50% opacity, no tap response
- Pressed: 90% scale (via `react-native-reanimated`'s `useSharedValue` + spring)

### Inputs

- Height: 48
- Padding: 12 horizontal
- Border: 1pt `input` color
- Focus: 1.5pt border in `primary`, optional 2pt soft `primary/20` ring
- Disabled: 50% opacity
- Error: 1pt `destructive` border + helper text below in destructive

### Empty states

- Centered column, icon (48–56pt) in `muted-foreground`, headline, optional subcopy, optional primary CTA.

### Toasts

- Success: green, white text, check icon, auto-dismiss 3s.
- Error: red, white text, X icon, auto-dismiss 5s.
- Top placement (under the status bar).

---

## Iconography

Use **`lucide-react-native`** (same icon set as web's `lucide-react`). Default size 20, stroke width 1.75.

Common mappings:

| Function           | Icon                   |
| ------------------ | ---------------------- |
| Receipts           | Receipt                |
| Dashboard          | LayoutDashboard         |
| Recurring          | Repeat                 |
| Categories         | Tag                    |
| Loyalty cards      | CreditCard             |
| Settings           | Settings               |
| Scan               | ScanLine               |
| Camera             | Camera                 |
| Gallery            | Image                  |
| Edit               | Pencil                 |
| Delete             | Trash2                 |
| Pause / Resume     | Pause / Play           |
| Pay                | CreditCard             |
| Eye / Eye-off      | Eye / EyeOff           |
| Crown / Sparkles / Compass | (for rank tiers) |

---

## Accessibility

- All interactive elements have `accessibilityLabel` (use the same translation keys as the visible text).
- Touch targets ≥ 44pt.
- Respect `prefers-reduced-motion` (web does this in `index.css:14`) — gate Reanimated animations with `useReducedMotion()`.
- Color contrast: all default token combinations exceed WCAG AA. Verify accent palettes individually when in active use (`primary` against `primary-foreground`).
- Dynamic Type / font scaling: use RN's `allowFontScaling` (default true). Make sure layouts don't break at 130%.
