# 02 — Design system

The visual foundation. Reference this from every feature spec you produce.

The system has **3 theme modes** (`light` / `dark` / `system`) × **6 interchangeable accent palettes** (`zinc` / `blue` / `green` / `purple` / `orange` / `rose`). Every screen must work in any combination — that's 12 variants per screen if you exhaust them. In practice: design every screen in **light + dark**, with the default `zinc` accent; then sanity-check one or two screens in each accent to confirm nothing breaks.

---

## Color tokens

Tokens, not raw colors. Reference them by name — never paste hex codes directly into a screen design.

### Light mode base

| Token                  | Hex          | Used for                                                    |
| ---------------------- | ------------ | ----------------------------------------------------------- |
| background             | `#FFFFFF`    | Screen backgrounds                                          |
| foreground             | `#252525`    | Default body text                                           |
| card                   | `#FFFFFF`    | Card surfaces (often same as background — relies on border) |
| card-foreground        | `#252525`    | Text inside cards                                           |
| popover                | `#FFFFFF`    | Sheets, popovers, action sheets                             |
| popover-foreground     | `#252525`    | Text inside sheets                                          |
| primary                | (accent — see below) | Primary buttons, links, active states               |
| primary-foreground     | (accent)     | Text/icon on primary surfaces                               |
| secondary              | `#F5F5F5`    | Secondary button surfaces                                   |
| secondary-foreground   | `#343434`    | Text on secondary surfaces                                  |
| muted                  | `#F5F5F5`    | Background of subtle blocks (search bar background, etc.)   |
| muted-foreground       | `#878787`    | Secondary text, captions, placeholder text                  |
| destructive            | `#DC2626`    | Delete actions, error icons                                 |
| destructive-foreground | `#FFFFFF`    | Text on destructive surfaces                                |
| success                | `#16A34A`    | "Active" badges, paid status, under-budget                  |
| warning                | `#D97706`    | "Due soon", 80–99% of budget                                |
| border                 | `#E5E5E5`    | Card borders, row dividers, input borders                   |
| input                  | `#E5E5E5`    | Input borders (same as border in default state)             |
| ring                   | `#B5B5B5`    | Focus ring (accent overrides this)                          |

### Dark mode base

| Token                  | Hex                       | Notes                                                        |
| ---------------------- | ------------------------- | ------------------------------------------------------------ |
| background             | `#252525`                 | Slightly off-pure-black — keeps OLED contrast without harshness |
| foreground             | `#FBFBFB`                 |                                                              |
| card                   | `#343434`                 | Cards lift slightly from background                          |
| popover                | `#343434`                 |                                                              |
| secondary              | `#454545`                 |                                                              |
| muted                  | `#454545`                 |                                                              |
| muted-foreground       | `#B5B5B5`                 |                                                              |
| destructive            | `#F87171`                 | Brighter red — bright surfaces hurt at night                 |
| success                | `#22C55E`                 |                                                              |
| warning                | `#F59E0B`                 |                                                              |
| border                 | `rgba(255,255,255,0.10)`  | White at 10% alpha (subtle)                                  |
| input                  | `rgba(255,255,255,0.15)`  |                                                              |
| ring                   | `#878787`                 |                                                              |

### Accent palettes

Each replaces `primary`, `primary-foreground`, and `ring`:

| Accent  | Light primary | Light fg  | Dark primary | Dark fg  |
| ------- | ------------- | --------- | ------------ | -------- |
| zinc (default) | `#3F3F46`     | `#FBFBFB` | `#E4E4E7`    | `#343434` |
| blue    | `#2563EB`     | `#FFFFFF` | `#3B82F6`    | `#252525` |
| green   | `#16A34A`     | `#FFFFFF` | `#22C55E`    | `#252525` |
| purple  | `#7C3AED`     | `#FFFFFF` | `#A78BFA`    | `#252525` |
| orange  | `#EA580C`     | `#252525` | `#F97316`    | `#252525` |
| rose    | `#E11D48`     | `#FFFFFF` | `#FB7185`    | `#252525` |

When in doubt, design with `zinc` selected — it's the default. Always show **one screen per feature in a non-zinc accent** so the dev knows which surfaces pick up `primary`.

### Chart palette (5 series)

Use in order for pie / bar / line series. **Independent of accent** — charts use these fixed colors regardless of which accent is active.

Light: `#F97316`, `#0891B2`, `#1E40AF`, `#FACC15`, `#F59E0B`

Dark: `#6366F1`, `#34D399`, `#F59E0B`, `#C084FC`, `#F472B6`

---

## Typography

**Font family**: Plus Jakarta Sans. Weights to bundle: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold).

| Token            | Size | Line height | Weight | Used for                                  |
| ---------------- | ---- | ----------- | ------ | ----------------------------------------- |
| display          | 32   | 40          | 700    | Hero amount on receipt detail             |
| heading-1        | 24   | 32          | 700    | Screen titles                             |
| heading-2        | 20   | 28          | 700    | Section titles, modal titles              |
| heading-3        | 17   | 24          | 600    | Card titles                               |
| body             | 15   | 22          | 400    | Default body text                         |
| body-strong      | 15   | 22          | 600    | Emphasis                                  |
| caption          | 13   | 18          | 400    | Secondary text                            |
| caption-strong   | 13   | 18          | 600    | Labels above inputs                       |
| mono             | 14   | 20          | 400    | Code values, journal text                 |
| overline         | 11   | 14          | 600    | Section headers (uppercase, tracked +5%)  |

**Tabular numerals** on every monetary amount. Use the `fontVariant: ['tabular-nums']` style. The font supports it natively.

---

## Spacing scale

Standard scale (in pt):

`0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 80`

Conventions:

- **Screen edge padding**: 16
- **Card padding**: 16 (compact) or 20 (primary)
- **Section gap** (between cards / groups): 24
- **Row gap** (within a stack): 12
- **List row vertical padding**: 16
- **Inter-character / inter-element gap inside a row**: 8

---

## Radius scale

| Token   | pt   | Used for                              |
| ------- | ---- | ------------------------------------- |
| sm      | 6    | Chips, small badges                   |
| md      | 8    | Inputs, small buttons                 |
| lg      | 10   | Standard buttons, list rows           |
| xl      | 14   | Cards, sheets                         |
| 2xl     | 18   | Hero cards, modal containers          |
| 3xl     | 22   | Bottom-sheet handles, prominent cards |
| full    | 9999 | Pills, status badges, avatars         |

---

## Elevation / shadows

4-step scale. Most surfaces have **no shadow** (level 0) — they're delineated by 1pt borders.

| Level | iOS shadow                                                 | Android elevation | Used for                       |
| ----- | ---------------------------------------------------------- | ----------------- | ------------------------------ |
| 0     | none                                                       | 0                 | Cards, list rows, default      |
| 1     | offset 0,1, opacity 4%, radius 2                           | 1                 | Subtle lift (chips on hover)   |
| 2     | offset 0,4, opacity 8%, radius 8                           | 4                 | FAB, bottom-sheet handle       |
| 3     | offset 0,8, opacity 12%, radius 16                         | 8                 | Loyalty card display modal     |
| 4     | offset 0,16, opacity 16%, radius 32                        | 16                | Full-screen overlay (scanner)  |

---

## Component primitives

These are the reusable building blocks. Document each in your design file as a named component with variants — Claude Code will rebuild them in TypeScript using the same names.

### Button

Variants × sizes. All have rounded corners per the radius scale.

| Variant     | Surface                       | Text                            |
| ----------- | ----------------------------- | ------------------------------- |
| default     | `primary`                     | `primary-foreground`            |
| destructive | `destructive`                 | `destructive-foreground`        |
| outline     | transparent, 1pt `border`     | `foreground`                    |
| secondary   | `secondary`                   | `secondary-foreground`          |
| ghost       | transparent                   | `foreground` (or `primary` for link-like) |
| link        | transparent                   | `primary`, underlined           |

| Size  | Height | Horizontal padding | Radius |
| ----- | ------ | ------------------ | ------ |
| sm    | 36     | 12                 | md (8) |
| md    | 44     | 16                 | lg (10)|
| lg    | 52     | 20                 | xl (14)|
| icon  | 44×44  | —                  | lg (10)|

States: default · pressed (90% scale + subtle opacity) · disabled (50% opacity).

### Input

Single-line text input.

- Height: 48
- Padding: 12 horizontal
- Border: 1pt `input` color
- Radius: lg (10)
- States: default · focused (1.5pt `primary` border + optional 2pt `primary` at 20% alpha ring) · error (1pt `destructive` border + helper text below) · disabled (50% opacity)
- Placeholder text: `muted-foreground`
- Optional: trailing icon slot (e.g. eye for password visibility)

### Card

- Background: `card`
- Border: 1pt `border`
- Radius: 2xl (18)
- Padding: 16 (compact) or 20 (primary)
- No shadow

Subcomponents: CardHeader, CardTitle (heading-3), CardDescription (caption + muted-foreground), CardContent, CardFooter.

### Badge / pill

- Radius: full
- Height: 22
- Horizontal padding: 8
- Font: caption (13pt) at weight 600
- Variants: default (secondary surface), success, warning, destructive, outline

Status badges use a colored background at ~12% alpha with the matching colored text:

| Status badge | Background          | Text             |
| ------------ | ------------------- | ---------------- |
| pending      | muted               | muted-foreground |
| scraped      | success @ 12% alpha | success          |
| failed       | destructive @ 12%   | destructive      |
| manual       | secondary           | foreground       |
| completed    | success @ 12%       | success          |
| recurring    | accent @ 12%        | accent           |

### Switch

Use platform-native styling (iOS pill / Android material). Color the "on" state with `primary`.

### List row

- Min height: 64 (compact) or 72 (with subtitle)
- Padding: 16 horizontal
- Separator: 1pt `border` line, indented 16pt from the left (iOS convention)
- Pressed state: 8% `primary` tint background
- Trailing icon / chevron in `muted-foreground`

### Avatar

- Sizes: 32 (xs), 40 (sm), 48 (md), 64 (lg), 96 (xl on profile)
- Image with fallback to initials on `secondary` surface, `secondary-foreground` text

### Empty state

- Centered column, vertical padding 64+
- Icon: 48–56pt, `muted-foreground`
- Headline: heading-2, `foreground`
- Subcopy: body, `muted-foreground`, centered, max-width ~280pt
- Optional CTA: default button

### Toast

- Top placement, below status bar safe area
- Width: screen width minus 32pt padding
- Variants: success (green surface, white text, check icon), error (red surface, white text, X icon)
- Auto-dismiss: 3s success, 5s error
- Manual dismiss: X button on the right

---

## Common patterns

### Money display

- Tabular numerals always
- Decimal places: 2 by default, configurable per currency (RSD typically shows 0, EUR/USD show 2)
- Currency code follows the number with a single space: `1,234.56 RSD`
- Right-aligned in lists and tables
- Privacy mode (`amountsVisible = false`): replace digits with `•••` keeping currency code

### Color circles for categories / cards

- 48pt diameter (or 32pt in dense lists)
- Background: the entity's `color` at 15% alpha
- Foreground: the entity's `icon` (emoji), centered, at full size

### Status indicators

- A small dot (8pt) before a label is more compact than a full badge — use this in dense lists.
- Color matches the status badge background.

### Section headers (inside scrolling content)

- Overline style (11pt, 600, uppercase, +5% tracking)
- Color: `muted-foreground`
- 16pt above, 8pt below

---

## Iconography

Use **Lucide** (`lucide-react-native`). Default size 20, stroke width 1.75.

Common assignments:

| Function           | Icon                    |
| ------------------ | ----------------------- |
| Receipts           | Receipt                 |
| Dashboard          | LayoutDashboard         |
| Recurring          | Repeat                  |
| Categories         | Tag                     |
| Loyalty cards      | CreditCard              |
| Settings           | Settings                |
| Scan               | ScanLine                |
| Camera             | Camera                  |
| Gallery / image    | Image                   |
| Edit               | Pencil                  |
| Delete             | Trash2                  |
| Pause / Resume     | Pause / Play            |
| Pay                | CreditCard              |
| Eye / Eye-off      | Eye / EyeOff            |
| Rank A / B / C     | Crown / Sparkles / Compass |
| Close              | X                       |
| Back               | ChevronLeft             |
| Add                | Plus                    |
| Filter             | SlidersHorizontal       |
| Sort               | ArrowUpDown             |
| Search             | Search                  |
| More               | MoreHorizontal / Menu   |

---

## Color palette for user-pickable colors

Categories, recurring expenses, and loyalty cards all let users pick a "color" for their item. Use the **same 10-swatch palette** across all three features:

| Hex       | Name (informal)         |
| --------- | ----------------------- |
| `#EF4444` | Red                     |
| `#F97316` | Orange                  |
| `#F59E0B` | Amber                   |
| `#EAB308` | Yellow                  |
| `#22C55E` | Green                   |
| `#14B8A6` | Teal                    |
| `#3B82F6` | Blue                    |
| `#8B5CF6` | Violet                  |
| `#EC4899` | Pink                    |
| `#6B7280` | Gray                    |

5×2 grid, swatches as 40pt circles, selected one gets a checkmark overlay.

---

## Accessibility

- Tap targets: ≥ 44×44pt (iOS HIG) / 48×48dp (Android Material). Don't shrink below this even if it looks tight.
- Color contrast: every text/background pair must meet WCAG AA (4.5:1 for body, 3:1 for large text). Spot-check the destructive token on light mode (it's borderline on some variants).
- Dynamic Type: layouts must accommodate up to 130% font scaling without truncating critical info.
- Don't rely on color alone for status — pair with text or an icon (the receipt status badges do this correctly).
- Reduce motion: when the OS setting is enabled, gate animations off; show instant transitions instead.

---

## Reference

The web app's tokens live in `/Users/kole/workspace/receipto-frontend/src/index.css` lines 1–220 (OKLCH originals before conversion). You don't need to read it — the tables above are exact.
