# 15 — Kickoff prompts (Claude Design)

Paste-ready prompts for each design milestone (DM0–DM7 in `14-build-order.md`). Each prompt is **self-contained** — assume the receiving session has read no prior context.

Each prompt expects this folder (`docs/design-handoff/`) to be accessible to the agent. If you're handing the handoff to a fresh Claude Design session in a separate workspace, copy the entire `docs/design-handoff/` folder there first.

---

## How to use

- **One prompt per session.** Don't try to do all of DM0 in one prompt and DM1 in another — give each milestone its own session for clean conversational context.
- **Pause between prompts** to review the output before running the next.
- **Output lands in `docs/design-output/`** — the agent should write its specs there (relative to wherever you put the handoff).
- **Iterate the prompts** if output drifts. The hardest prompts are DM3 (Dashboard, 9 widgets) and DM5 (Scanner, 6 states) — be ready to feed back corrections.

---

## DM0 — Foundations

```
You are designing the Receipto mobile app (React Native). This is the foundations
milestone — before any feature screens, finalize tokens and shared components.

Read these docs first, in order:
- docs/design-handoff/00-README.md
- docs/design-handoff/01-overview.md
- docs/design-handoff/02-design-system.md
- docs/design-handoff/03-navigation.md
- docs/design-handoff/04-mobile-ux.md
- docs/design-handoff/13-deliverables.md  (output format expected)

Produce, writing markdown files into docs/design-output/:

1. design-tokens.md — verbatim copy of the token tables from 02-design-system.md
   (light/dark base, all 6 accents, chart palette). Append any tweaks you'd make
   and explain why. If none, say so.

2. shared-components.md — visual specs for every primitive: Button (6 variants,
   4 sizes), Card (Header/Title/Description/Content/Footer), Input, Textarea,
   Label, Badge (incl. all 6 status badges), Switch, Checkbox, Avatar, Separator,
   Skeleton, Progress, Tabs, Bottom Sheet, Action Sheet, Toast, Alert, List Row,
   Section Header, Empty State, Color Circle (used for categories/recurring/cards),
   Status Pill, Date Picker affordance, Currency Picker affordance, Emoji Picker
   affordance, Color Swatch Picker (10-swatch). Each entry: dimensions, states,
   variants, token references. NO raw hex codes — only token names.

3. navigation/tab-bar.md — bottom tab bar with 5 slots; center FAB. Active /
   inactive states, height, safe area, label and icon sizing. Show in light AND
   dark.

4. navigation/fab.md — center FAB diameter, elevation, icon, color, lift above
   the bar; press state; long-press action sheet.

5. navigation/headers.md — native stack header conventions (large title on tab
   roots; standard header on pushed screens). Modal headers. Bottom sheet headers
   (drag handle, title, close).

6. navigation/bottom-sheets.md — drag handle, snap points, backdrop, dismissal
   behaviors.

End your turn by listing every primitive you specified and any token tweaks you
made. Do NOT design feature screens yet.
```

---

## DM1 — Auth

```
You are designing the Auth flow for the Receipto mobile app.

Read first:
- docs/design-handoff/05-auth.md  (the spec — 6 screens)
- docs/design-handoff/02-design-system.md  (tokens — reference by name)
- docs/design-handoff/04-mobile-ux.md  (keyboard handling especially)
- docs/design-output/shared-components.md  (use these primitives, don't redefine)
- docs/design-output/design-tokens.md

Produce one markdown spec per screen, in docs/design-output/auth/:
- sign-in.md
- sign-up.md
- check-email.md
- forgot-password.md
- reset-password.md
- verify-email.md

Follow the per-screen template from docs/design-handoff/13-deliverables.md.

Cover every state in 05-auth.md's acceptance checklist:
- All screens in light AND dark mode
- Loading, error, success variants
- Email-not-verified inline CTA on sign-in
- Password visibility toggle (hidden / shown)
- Terms checkbox (unchecked / checked / error)
- Resend countdown on CheckEmail
- 2s auto-redirect on Verify success and Reset success
- Google sign-in button (when client ID present; hidden when absent)
- Deep-link entry annotations on ResetPassword and VerifyEmail

For every field, document input attributes (textContentType, autoComplete,
keyboardType, return key behavior).

End your turn by reporting any new primitives you needed that aren't in
shared-components.md (and add them there).
```

---

## DM2 — Settings

```
You are designing the Settings feature for the Receipto mobile app.

Read first:
- docs/design-handoff/12-settings.md
- docs/design-handoff/03-navigation.md  (More tab is the entry point)
- docs/design-output/shared-components.md
- docs/design-output/design-tokens.md

Produce one markdown spec per screen, in docs/design-output/settings/:
- more-tab.md       (the grouped-list landing — Categories, Loyalty, Settings,
                     Profile, Account, Support us, Sign out)
- app-settings.md   (theme, accent, language, currency, notifications)
- profile.md        (avatar, name, address, rank)
- account.md        (change password, sign out, delete account)

Per 12-settings.md acceptance checklist:
- Light + dark for every screen
- AppSettings appearance section showing an active theme AND an active accent
- LanguagePicker + CurrencyPicker bottom sheets
- Notification switches in on/off states
- Profile avatar in three states: present / absent (initials fallback) / uploading
- Account change-password with field-level error states
- Delete account section: button DISABLED (input empty) AND ENABLED (input == "DELETE")
- Sign out confirmation Alert

End your turn by reporting any pattern reuse opportunities you noticed (e.g.
"the grouped-list pattern from More tab is reused by AppSettings" — if so,
make sure shared-components.md has the pattern documented once).
```

---

## DM3 — Dashboard

```
You are designing the Dashboard for the Receipto mobile app.

This is the broadest milestone — 9 widgets, each with multiple states. Plan to
take 3–5 sessions to complete this in chunks. This prompt covers the first
chunk; iterate.

Read first:
- docs/design-handoff/06-dashboard.md
- docs/design-output/shared-components.md
- docs/design-output/design-tokens.md

Produce, in docs/design-output/dashboard/:
- dashboard.md         — the overall screen: sticky header, scroll behavior,
                         widget ordering, FAB position, pull-to-refresh
- widget-stats-cards.md
- widget-category-pie.md
- widget-daily-bars.md
- widget-budget-tracker.md
- widget-monthly-trend.md
- widget-monthly-forecast.md
- widget-upcoming-recurring.md
- widget-rank-card.md
- widget-recent-activity.md
- edit-mode.md         — what changes when the user enters edit mode

Per 06-dashboard.md acceptance:
- Every widget in populated + empty + loading states
- Light AND dark for each
- Sticky header with month switcher in two states (current month / past month)
- Month picker sheet
- Currency picker sheet
- Privacy mode (eye toggle) applied to Stats cards and Pie legend
- FAB long-press action sheet
- First-time empty dashboard (no data anywhere)
- Pull-to-refresh

Chart styling decisions to commit:
- Donut inner radius (% of outer)
- Bar corner radius
- Line chart stroke width
- Tooltip / interaction style

Tabular numerals on every amount.

If this prompt is too large for one session, start with the sticky header,
edit-mode, and the first 3 widgets. Tell me where you stopped so I can spin up
a follow-up session for the remaining widgets.
```

---

## DM4 — Receipts

```
You are designing the Receipts feature for the Receipto mobile app.

Read first:
- docs/design-handoff/07-receipts.md
- docs/design-output/shared-components.md
- docs/design-output/design-tokens.md

Produce, in docs/design-output/receipts/:
- receipts-list.md
- receipt-detail.md
- manual-entry.md
- pfr-entry.md
- receipt-viewer.md
- category-picker-sheet.md

Per 07-receipts.md acceptance:
- All 6 status badge variants (pending / scraped / failed / manual / completed
  / recurring) in light AND dark — confirm contrast on each
- ReceiptsList: empty, loading, populated; selection mode with multiple selected
- FilterSheet, SortSheet
- Search bar activated state
- ReceiptDetail: scraped variant (full data, line items, taxes, details accordion
  open + closed) AND manual variant (sparse)
- Edit mode with sticky save bar
- Category suggestion card (compact + dismissed state)
- PfrEntry with auto-advance segments highlighted (focus on segment 2 after
  filling segment 1)
- PfrEntry verifying state (spinner + disabled form)
- ReceiptViewer modal with monospace text, pinch-to-zoom, share affordance
- CategoryPickerSheet (reused across multiple flows)
- Tabular numerals on every amount
- Time preservation on date edit ANNOTATED (the dev needs the reminder)

End your turn by listing any patterns you'd extract back to shared-components.md.
```

---

## DM5 — Scanning

```
You are designing the Scanning flow for the Receipto mobile app. This is the
highest-complexity feature visually — design with care.

Read first:
- docs/design-handoff/08-scanning.md  (read in full, twice)
- docs/design-output/shared-components.md
- docs/design-output/design-tokens.md

Produce, in docs/design-output/scanning/:
- scanner.md          — the main camera modal, all 6 states
- retry-card.md       — DETAILED spec of the retrying_portal state (the most
                         novel visual in the app — countdown ring, two CTAs,
                         attempt counter)
- gallery-flow.md     — gallery_processing state, "no QR found" error
- permission-denied.md
- fab-action-sheet.md — long-press menu (Scan / Gallery / Manual PFR)

Per 08-scanning.md acceptance:
- All 6 scanner states (camera_loading, scanning, submitting, retrying_portal,
  failed_terminal, success)
- Retry card with at least 3 progress points on the countdown ring
  (just-started, halfway, almost-done)
- Inline non-fiscal-QR toast
- Reticle dimensions + scan-line animation direction
- Torch toggle on/off
- Camera picker sheet (rear / front / specific device)
- Light AND dark mode for all UI overlays
- Haptic events annotated on the relevant states

The retry card is critical. Design it so that:
- A user staring at it for 40 seconds doesn't get anxious
- The "Try now" action feels useful (not impatient-spamming-the-button)
- The "Cancel retry" action feels safe (not destructive)

Status bar style on scanner = light-content (it sits over the camera).

End your turn by listing any concerns about the retry card's clarity or
duration — if you think 7 attempts × the spec'd delays is too long for an
acceptable UX, flag it.
```

---

## DM6 — Recurring + Categories + Loyalty

```
You are designing three related features for the Receipto mobile app. Bundle
because they share patterns (list + form + color-picker + emoji-picker + delete
flow).

Read first:
- docs/design-handoff/09-recurring.md
- docs/design-handoff/10-categories.md
- docs/design-handoff/11-loyalty.md
- docs/design-output/shared-components.md
- docs/design-output/design-tokens.md

Produce, in docs/design-output/:

recurring/
- recurring-list.md
- recurring-form.md
- mark-paid-sheet.md
- payment-history.md

categories/
- categories-list.md
- category-form.md
- category-delete-reassignment.md

loyalty/
- loyalty-list.md
- loyalty-display.md         (with brightness-boost annotation)
- loyalty-form.md
- loyalty-scanner.md

Per the three feature acceptance checklists.

Pattern consistency to maintain:
- The 10-swatch color picker is identical across all three features
- The emoji picker is the same component everywhere
- Form layouts use the same field-stacking pattern
- Delete flows follow the same Alert → execute pattern, except CategoryDelete
  uses a reassignment sheet when there are linked receipts

Brightness-boost on LoyaltyDisplay: annotate clearly. Mockup it in higher
apparent brightness if your tool supports it.

End your turn by listing any inconsistencies you noticed across the three
features that should be reconciled in shared-components.md.
```

---

## DM7 — Polish & assets

```
You are wrapping up the Receipto mobile design.

Read first:
- docs/design-handoff/00-README.md  (re-check non-negotiables)
- docs/design-handoff/14-build-order.md  (DM7 section)
- All your prior design-output files

Do, in order:

1. Walk every screen in light + dark + at least 2 non-zinc accents (try blue
   and rose). Fix any contrast or alignment issues. Update the relevant
   design-output files with corrections.

2. Verify Serbian copy doesn't break any layout. Identify any button / label
   that would overflow with the longest reasonable Serbian translation. Note
   fixes (e.g. shorter wording, multi-line wrapping permitted).

3. Cross-check that every primitive referenced in feature specs is defined in
   shared-components.md. Add anything missing.

4. Run an accessibility spot-check on at least 5 screens:
   - Tap targets ≥ 44pt
   - Contrast ≥ WCAG AA
   - Dynamic Type up to 130% doesn't break layout
   Document findings and fix flagged issues.

5. Produce app assets:
   - App icon (1024×1024 PNG, both iOS and Android variants)
   - Splash screen
   - Logo SVG + Wordmark SVG (if not already done)
   - Brand color palette JSON

6. Produce store assets (defer if not yet near release):
   - 5–8 App Store screenshots @ 1290×2796
   - 5–8 Play Store screenshots @ 1080×1920
   - Short and long descriptions in EN and SR

End by producing a docs/design-output/00-index.md that links to every file
you've created with a one-line summary of each.
```

---

## Tips for prompt iteration

If a milestone produces shallow or incorrect specs, common causes:

- **"Read these docs first" was ignored.** Quote it back: "What does
  04-mobile-ux.md say about haptics in scanning?" If the agent can't quote,
  the docs weren't read.
- **Output didn't follow the template.** Cite `13-deliverables.md`'s template
  in the next iteration.
- **Specs reference raw colors instead of tokens.** Reject and rerun with
  "use token names from design-tokens.md, never hex values directly."
- **States missing.** Cite the acceptance checklist from the relevant feature
  doc and ask the agent to verify each item.
- **Dark mode skipped.** Always ask for "light AND dark" explicitly.

The prompts above include these guards already, but reinforce as needed.
