# Expenses "Glass" — Chunk 8: Polish, states, i18n, docs — Finishing-pass note

**Status:** DONE. The final chunk of the Expenses Glass redesign. This is a finishing pass, not a feature build — most of Chunk 8's items were already delivered in earlier chunks; the remaining net work was docs. **Playwright refresh deliberately skipped (user instruction).** The optional AI-suggestion card is **deferred** (the spec allows it; it is net-new, not a regression — see below).

**Companion spec:** `docs/superpowers/specs/2026-06-04-expenses-glass-redesign-design.md` (Chunk 8). **Master plan:** `2026-06-04-expenses-glass-redesign.md` (Chunk 8).

---

## Item-by-item resolution

| Spec Chunk-8 item | State | Evidence |
|---|---|---|
| Import partial-success toast (`import.partialSuccess` + `errorsOccurred`) | **Already shipped** | `pages/receipts/index.tsx` `handleImportFile` → `toast.warning(...)` with the `errorsOccurred` description (predates this chunk). |
| Converted-currency `info` note on mixed currencies (`convertedNote`/`convertedDisclaimer`) | **Already shipped (C2)** | `expenses-summary.tsx` renders the note when currencies differ; `expense-feed.tsx` per-day subtotal converts when mixed; mobile header shows the converted total. |
| Motion + `prefers-reduced-motion` pass (sheets, stagger) | **Already satisfied** | `StaggerContainer`/`StaggerItem` are **no-op wrappers** (`components/ui/animated.tsx` — stagger is disabled app-wide), so there is no stagger to clamp; all sheets/modals go through `GlassDialog`, which already honors `useReducedMotion`; `PageTransition` is a 0.15s fade. Nothing to change. |
| Tabular-nums on all amounts | **Already satisfied** | Every amount in the feed/summary/bulk-bar/mobile-header routes through the `Amount` primitive, which sets `t-num tabular-nums`. |
| i18n: no hardcoded visible strings; net-new keys in en **and** sr | **Verified clean** | Grep of the new components (`row-kebab`/`bulk-bar`/`assign-category-dialog`/`qr-scanner`) found no hardcoded user-facing strings; all net-new keys (selection/bulk/sort/add-sheet/`qrScanner.scanHint`, `common.edit`/`remove`) were added to both `en.json` + `sr.json` in their chunks. |
| Optional AI-suggestion card on fresh uncategorized **scanned feed rows** | **Deferred (clean)** | `category-suggestion-card.tsx` exists but is used **only** in `receipt-modal.tsx` (the out-of-scope Add/Edit form). `git log -S CategorySuggestionCard -- pages/receipts/index.tsx` is empty → it was **never** a feed feature, so deferring is not a regression. It would be net-new feature work (would warrant its own brainstorming/spec); the spec marks it optional ("only if cheap; else defer"). Deferred. |
| Docs: `design-system.md` + `recent-changes.md`; mark Expenses migrated | **Done this chunk** | See below. |
| Refresh the out-of-date Playwright suite | **SKIPPED (user instruction)** | The suite still asserts removed ids (`receipts-table` from C2, `receipts-filter-button` from C3) + orphaned interim row-action ids. Left untouched per the user's "proceed without touching playwright". Flagged as outstanding tech-debt for a later, dedicated pass. |

## Docs updated

- `receipto-frontend/docs/design-system.md` — added the C0 tokens to the reference tables
  (`--destructive-soft`/`--destructive-foreground-on-soft`, `--brand-violet-soft`/`-foreground`
  in Semantic colors; `--fg-2` in Depth tiers) and expanded the "Migrated so far" expenses
  entry to the full page (filter rail/sheet, day-grouped feed, list primitives, `+`-menu/FAB
  add sheet/template/import, bulk bars + kebab + gating + assign-category, glass scan flow,
  glass shared comps).
- `docs/recent-changes.md` (monorepo root) — new dated entry **2026-06-04: Expenses
  (Receipts) "Glass" Redesign** summarizing the 9-chunk, data-layer-untouched, frontend-only
  migration.

## Verification

Build (`npm run build`, tsc strict + vite) passes; no behavior change (docs + already-shipped
polish). Per-chunk component verification (harness screenshots, mobile+desktop, light+dark)
was done in C0-C7; the live `/receipts` route renders without console errors (the test account
is empty → empty state). The full interactive matrix on real data is bounded by that empty
account; component behavior was verified per chunk.

## Outstanding (not this chunk)

- **Playwright E2E refresh** — the suite is out of sync with the redesigned page; needs a
  dedicated pass (skipped per user instruction).
- **AI-suggestion card in the feed** — deferred net-new feature; pick up via its own
  spec/brainstorm if product wants it.
