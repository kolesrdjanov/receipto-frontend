# Navigation Shell — Glass redesign (design)

**Date:** 2026-06-04 · **Branch:** `feature/redesign-main-branch`
**Handoff:** `design_handoff_navigation` (Direction B "Glass")

The final piece of the Glass migration: the chrome that wraps every page. Visual/UX only —
all routes, nav data, feature flags, i18n keys, stores, and the shadcn `Sidebar` primitive
are reused. No backend changes.

## Scope (files)

| File | Change |
|---|---|
| `ui/sidebar.tsx` | Width constants only: `17.5rem` / `4.75rem` rail / `min(88vw,21rem)` mobile. |
| `layout/app-sidebar.tsx` | Rewritten: glass header (brand + version + megaphone + language pill / rail globe), data-driven `MONEY`/`WALLET` nav, Settings + Admin collapsible, footer = desktop popover / mobile inline block; `ThemeSegmented`. |
| `layout/app-layout.tsx` | Frosted edge-to-edge mobile header (language · centered logo · avatar; **no hamburger**); renders `FabActionSheet`. |
| `layout/mobile-tab-bar.tsx` | Home · Expenses · FAB · **Warranties** · More; warranties slot falls back through Wallet group; FAB → page action or `FabActionSheet`. |
| `layout/fab-action-sheet.tsx` | **New.** Global Add/Scan `GlassDialog` → `/receipts?action=scan\|add`. |
| `announcements/announcement-list.tsx` | `Drawer` → `GlassDialog` (desktop modal / mobile sheet), type-tinted cards on glass semantic tokens. |
| `ui/language-switcher.tsx` | Added `pill` / `fullWidth` / `abbreviated` variants (reused by sidebar + mobile header). |
| `pages/receipts/index.tsx` | Honors `?action=scan\|add` (opens scanner / manual add, then strips the param). |
| `i18n/en.json` + `sr.json` | New `fab.{title,scanHint,manualHint}`. |

## Key decisions

1. **Sidebar widths bumped** on the shadcn primitive (only consumer): 280 / 76 / ≤336.
2. **Active nav = `bg-primary-soft text-primary`** — accent-aware. Sidebar stays
   gradient-free; the brand gradient lives only on the logo + mobile FAB.
3. **Announcements → `GlassDialog`** (desktop centered modal, mobile bottom sheet), replacing
   the old `Drawer` (sheet on both).
4. **Theme toggle (new)** — `ThemeSegmented` Light/Dark/System wired to `settings` store,
   in the profile popover (desktop) and drawer footer (mobile). Reuses
   `settings.appearance.*` keys.
5. **Removals** — sidebar Scan CTA, mobile-header hamburger (`SidebarTrigger`),
   "Support us"/donate. Logout lives only in the popover / drawer footer.
6. **One sidebar component, two contexts** — `AppSidebar` renders in the desktop column and
   in the shadcn mobile `Sheet`; the footer branches on `isMobile` (popover vs inline block).

## Verification

`tsc -b && vite build` ✅. Desktop shell rendered + screenshotted (all nav groups, active
state, brand/version, megaphone, language pill, footer). No new lint errors (touched-file
errors are pre-existing baseline). Mobile/popover/announcements visual pass was blocked by a
concurrent session reclaiming the shared preview tab; covered by the build + the desktop render.
