# 13 — Deliverables

What Claude Design produces, where it lives, how Claude Code will consume it.

---

## Output format

Claude Design produces a **design package** that Claude Code will read as the visual source of truth. The package can take several forms; pick one and stay consistent:

### Option A — Markdown-based design specs (recommended for agent-driven work)

A folder of markdown files mirroring the feature structure of this handoff, where each feature gets a detailed visual spec. Each file contains:

- **Screen layout descriptions** with measurements, positioning, and component composition (text — not images)
- **State matrices** in tabular form
- **Color, typography, spacing decisions** referencing the design system tokens
- **Interaction notes** (what taps, swipes, long-presses do)
- **Annotations** for input attributes, accessibility labels, haptics

This is the simplest format for an AI-driven workflow — readable by Claude Code without an export step.

### Option B — Figma + markdown index

Mockups in Figma (or equivalent), with a markdown index file describing each screen + Figma frame link. Best when a human designer is involved and you want pixel-perfect mockups Claude Code can reference visually.

### Option C — Inline code mockups

Produce React Native code that renders the screens with placeholder data. Slower to iterate but produces something Claude Code can run.

**Recommendation**: Option A for the bulk of work. Reach for B or C only for the most complex screens (Dashboard, ReceiptDetail, Scanner) where ambiguity could cost a lot of dev time.

---

## File structure (Option A)

```
docs/design-output/
├─ 00-index.md                   # links to every spec below
├─ design-tokens.md              # final color/typography decisions (mirrors 02-design-system.md but with any tweaks)
├─ shared-components.md          # Button, Card, Input, Badge, etc., as the design has finalized them
├─ auth/
│  ├─ sign-in.md
│  ├─ sign-up.md
│  ├─ check-email.md
│  ├─ forgot-password.md
│  ├─ reset-password.md
│  └─ verify-email.md
├─ dashboard/
│  ├─ dashboard.md
│  ├─ widget-stats-cards.md
│  ├─ widget-category-pie.md
│  ├─ widget-daily-bars.md
│  ├─ widget-budget-tracker.md
│  ├─ widget-monthly-trend.md
│  ├─ widget-monthly-forecast.md
│  ├─ widget-upcoming-recurring.md
│  ├─ widget-rank-card.md
│  ├─ widget-recent-activity.md
│  └─ edit-mode.md
├─ receipts/
│  ├─ receipts-list.md
│  ├─ receipt-detail.md
│  ├─ manual-entry.md
│  ├─ pfr-entry.md
│  ├─ receipt-viewer.md
│  └─ category-picker-sheet.md
├─ scanning/
│  ├─ scanner.md
│  ├─ retry-card.md
│  ├─ gallery-flow.md
│  ├─ permission-denied.md
│  └─ fab-action-sheet.md
├─ recurring/
│  ├─ recurring-list.md
│  ├─ recurring-form.md
│  ├─ mark-paid-sheet.md
│  └─ payment-history.md
├─ categories/
│  ├─ categories-list.md
│  ├─ category-form.md
│  └─ category-delete-reassignment.md
├─ loyalty/
│  ├─ loyalty-list.md
│  ├─ loyalty-display.md
│  ├─ loyalty-form.md
│  └─ loyalty-scanner.md
├─ settings/
│  ├─ more-tab.md
│  ├─ app-settings.md
│  ├─ profile.md
│  └─ account.md
└─ navigation/
   ├─ tab-bar.md
   ├─ fab.md
   ├─ headers.md
   └─ bottom-sheets.md
```

This sits alongside `docs/design-handoff/` and `docs/code-handoff/`. Claude Code will read `docs/design-output/` for visual specs and `docs/code-handoff/` for everything else.

---

## Per-screen spec template

Each markdown file should follow roughly this template:

```markdown
# {Screen name}

**Route**: {how it's reached in navigation, e.g. "AppTabs → ReceiptsStack → ReceiptDetail"}
**Presentation**: {push / full-screen modal / bottom sheet}
**Header**: {native stack / custom sticky / none}

## Layout

(Text description of the layout, top-to-bottom or zone-by-zone. Reference design system tokens by name.)

- Element X: positioned …, size …, color `foreground`, font heading-2.
- …

## States

| State        | What changes                                                       |
| ------------ | ------------------------------------------------------------------ |
| default      | …                                                                  |
| loading      | …                                                                  |
| empty        | …                                                                  |
| error        | …                                                                  |
| (per-feature variants — list them) | …                                                |

## Interactions

- Tap on X → …
- Long-press on X → …
- Swipe-left on X → …

## Validation rules (if form)

- Field A: required, …
- Field B: …

## Input attributes (if form)

| Field    | textContentType | autoComplete | keyboardType |
| -------- | --------------- | ------------ | ------------ |
| email    | emailAddress    | email        | email-address |
| …        | …               | …            | …            |

## Accessibility

- {Anything special — e.g. brightness boost on Loyalty display, focus order on multi-segment PFR}

## Edge cases

- {Cases the developer might miss — e.g. preserving time portion on date edit}

## References

- Code handoff: `docs/code-handoff/{feature-file}.md` for API and behavior
- Design system: `docs/design-handoff/02-design-system.md` for tokens
```

This is verbose enough that an agent reading it can implement without ambiguity, and structured enough that you can produce dozens of them at a similar quality bar.

---

## Asset deliverables

Beyond screen specs, design produces:

| Asset                | Purpose                                                   | Format / size                                    |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| App icon (iOS)       | Home screen icon                                          | 1024×1024 PNG (no transparency), platform-rendered variants generated by Expo |
| App icon (Android)   | Foreground + background layers for adaptive icon         | 1024×1024 PNG each                               |
| Splash screen        | Brief launch-time logo                                    | 1242×2436 PNG (iPhone X+); Expo generates scaled variants |
| Launch screen background | Hex code                                              | matches `background` token                       |
| Logo (SVG)           | Used in headers, auth screens, sign-out / about         | SVG, viewBox proportions                         |
| Wordmark (SVG)       | "Receipto" text logo                                      | SVG                                              |
| Empty-state illustrations (optional) | "No receipts yet", "No cards yet", etc.       | SVG or PNG @3x                                   |
| Color palette JSON   | The 10-swatch user-color palette for export to design tools | Hex values                                     |

If using a font other than Plus Jakarta Sans, design also produces the font files (.otf / .ttf for each weight) ready to ship.

---

## Store assets (for app submission, deferred to release)

These come at the end of the build, not during design iteration:

- 5–8 App Store screenshots @ 1290×2796 (iPhone 14 Pro Max)
- 5–8 Play Store screenshots @ 1080×1920+
- App Store description / keywords (Serbian + English)
- Play Store short + long description (Serbian + English)
- Promo video (optional)
- App Store feature graphic (Android)

---

## How Claude Code will use the output

When Claude Code receives a task like "implement the Receipts list" it will:

1. Read `docs/code-handoff/03-receipts.md` for behavior, data model, API.
2. Read `docs/design-output/receipts/receipts-list.md` for visual spec.
3. Implement.

The two are deliberately complementary: code-handoff says "what it does"; design-output says "what it looks like and how it feels."

---

## Quality bar

A design-output file is "done" when:

- A developer who has never seen the web app can build the screen from your spec without asking questions.
- All states are covered.
- All interactions are documented.
- All references to design tokens use names (`primary`, `foreground`) not raw hex values.
- All copy strings reference i18n keys (e.g. `t('auth.signIn.title')`) — strings inline in the spec are placeholders, the real translations live in `src/i18n/`.

---

## Things to NOT include in design output

- React Native code (that's Claude Code's job)
- API endpoint shapes (that's the code handoff)
- Zustand store structure or state management decisions
- Tech stack arguments (Vision Camera vs Expo Camera, etc.)
- Build / release / TestFlight steps

If you find yourself spec'ing those, drift detected — pull back to visuals + interactions.
