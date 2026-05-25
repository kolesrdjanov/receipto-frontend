# 14 — Build order

The order in which Claude Design should produce screen specs. Optimized for downstream code consumption.

---

## Principles

1. **Foundations before features.** Tokens and shared components first. Without them, every feature spec drifts.
2. **Auth + Settings early.** Auth gates everything; Settings exercises the theme system. Test the visual system on these before designing data-heavy screens.
3. **Receipts before Scan.** Scan creates receipts; the visual conventions for displaying them must be settled first.
4. **Cluster related features.** Categories + Recurring + Loyalty share patterns (color picker, emoji picker, list-with-form pattern) — design them as one batch after Receipts.
5. **Polish at the end.** Don't perfect screen 1 before designing screen 8. First pass everything; second pass for consistency.

---

## Design milestones

### DM0 — Foundations (week 1)

**Output**:

- `design-output/design-tokens.md` — finalized tokens (typically a verbatim copy of `02-design-system.md` from this handoff, unless you've changed anything)
- `design-output/shared-components.md` — Button, Card, Input, Badge, Switch, Toast, Alert, List Row, Section Header, Empty State, Color Circle, Status Pill — every reusable primitive documented
- `design-output/navigation/` — tab-bar.md, fab.md, headers.md, bottom-sheets.md

**Prerequisites**: Read `00-README.md`, `01-overview.md`, `02-design-system.md`, `03-navigation.md`, `04-mobile-ux.md` from this handoff.

**Definition of done**: A developer looking at `shared-components.md` can build every primitive without ambiguity. Each component's variants and states are documented.

### DM1 — Auth (week 1)

**Output**: `design-output/auth/` — all 6 screens.

**Prerequisites**: DM0 complete (need shared components — Input, Button, Toast).

**Definition of done**: Per `05-auth.md` acceptance checklist.

### DM2 — Settings (week 2)

**Output**: `design-output/settings/` — More tab, AppSettings, Profile, Account.

**Prerequisites**: DM1 complete.

**Definition of done**: Per `12-settings.md` acceptance checklist.

**Why early**: Settings is where the theme system gets exercised by the user. If your theme tokens are wrong, you'll discover it here — better to find out in week 2 than week 7.

### DM3 — Dashboard (week 2–3)

**Output**: `design-output/dashboard/` — dashboard.md and one file per widget, plus edit-mode.md.

**Prerequisites**: DM2 complete.

**Definition of done**: Per `06-dashboard.md` acceptance checklist.

**Note**: The Dashboard is **wide** in spec — 9 widgets, each with multiple states. Pace this milestone over 4–5 sessions; don't try to do it in one shot.

### DM4 — Receipts (week 3–4)

**Output**: `design-output/receipts/` — list, detail, manual entry, PFR entry, viewer, category-picker.

**Prerequisites**: DM3 complete (status badge styling and amount display patterns established).

**Definition of done**: Per `07-receipts.md` acceptance checklist.

### DM5 — Scanning (week 4–5)

**Output**: `design-output/scanning/` — Scanner with all 6 states, retry card (high-detail), gallery flow, permission-denied, FAB action sheet.

**Prerequisites**: DM4 complete (need receipt status conventions for the success-state transition).

**Definition of done**: Per `08-scanning.md` acceptance checklist.

**Note**: The retry card is the single most novel visual in the app. Spend extra time on it.

### DM6 — Recurring + Categories + Loyalty (week 5–6)

**Output**: `design-output/recurring/`, `design-output/categories/`, `design-output/loyalty/`.

**Prerequisites**: DM4 complete.

**Why bundled**: All three follow a similar pattern (list + form + delete-with-confirmation), share the 10-swatch color palette, and reuse the CategoryPickerSheet / EmojiPicker primitives. Designing them together keeps patterns consistent.

**Definition of done**: All three feature acceptance checklists.

### DM7 — Polish (week 6–7)

**Output**:

- Walk every screen in light + dark + at least 2 non-zinc accents. Fix divergences.
- Verify Serbian copy doesn't break any layout.
- Cross-check that every primitive used in feature specs is defined in `shared-components.md`.
- Spot-check accessibility (contrast, touch targets, Dynamic Type implications).
- Produce store screenshots and app icon (or hand to a brand designer).

**Definition of done**: A code agent can read any spec and produce the screen without questions.

---

## Schedule (single designer)

| Week | Milestone              | Outputs                                 |
| ---- | ---------------------- | --------------------------------------- |
| 1    | DM0 + DM1              | Foundations + auth screens              |
| 2    | DM2 + start DM3        | Settings + dashboard header & 2 widgets |
| 3    | Finish DM3 + start DM4 | Remaining widgets + receipts list       |
| 4    | Finish DM4 + start DM5 | Receipt detail + Scanner states         |
| 5    | Finish DM5 + start DM6 | Retry card + recurring screens          |
| 6    | Finish DM6             | Categories + loyalty                    |
| 7    | DM7 polish + assets    | Store screenshots, icon, walkthrough    |

Faster if multiple sessions can run in parallel (e.g. designer A on DM4 while designer B on DM5). Just rendezvous at the end of each week.

---

## What triggers a feedback loop with Claude Code

Some design decisions only become obvious during code review. Expect to revise specs when:

- Lists turn out denser than the spec implied → tighten row heights
- A bottom sheet's content overflows → switch to full-screen modal
- A specific accent's contrast fails → adjust the accent token
- Serbian copy breaks a button → loosen width or pick shorter copy
- Camera viewfinder doesn't fit on a small device → reduce reticle size

These don't mean the original spec was wrong — they mean mobile is tight and we discover constraints by building. Treat the design output as a **living document**; expect 10–20% of specs to need updates after first implementation.

---

## Things NOT to design

Just to be explicit (these features are out of scope):

- Price Compare (Items pricing)
- Savings module
- Groups / shared receipts
- Warranties
- Receipt templates
- Admin features
- AI coach insights beyond the receipt category suggestion card
- In-app rating prompts
- In-app announcements drawer
- Onboarding tour (the web app has one; defer to v2)

If a code-handoff doc mentions one of these, ignore it — those are stale references from the web app.
