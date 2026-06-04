# Expenses "Glass" — Chunk 1: App Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Restyle the desktop sidebar to glass (gradient Scan button + Money/Wallet sections), add a global mobile bottom tab-bar + center FAB, and add a reusable sticky glass `PageToolbar` — app-wide, keeping all existing nav logic, feature-flag gating, and the footer user popover.

**Architecture:** Keep the shadcn `Sidebar` shell and ALL its logic; restyle in place (gradient Scan CTA at top, Money/Wallet section labels, existing active-tint). Add two new layout components (`MobileTabBar`, `PageToolbar`) and mount the tab-bar in `app-layout.tsx` with bottom padding so content clears it. The global mobile header is **kept** (see Decision D1). Gradient appears only on the Scan CTA + FAB.

**Tech Stack:** React 19, TypeScript (strict), Tailwind v4, shadcn/ui Sidebar (Radix), react-router-dom 7 (`NavLink`), lucide-react, i18next.

**Companion spec:** `docs/superpowers/specs/2026-06-04-expenses-glass-redesign-design.md`. **Master plan:** `docs/superpowers/plans/2026-06-04-expenses-glass-redesign.md` (Chunk 1).

---

## Decisions to confirm (flagged — app-wide blast radius)

- **D1 — Keep the global mobile header.** The handoff says mobile should use *page-level* frosted headers, not the global one. But removing the global header (`app-layout.tsx` lines 45–66: hamburger · logo · avatar) app-wide would strip every non-migrated page's mobile header. **Recommendation: keep it for now** (top header + bottom tab-bar = standard native pattern); Expenses gets its page-level summary header in Chunk 2, other pages convert later. Low risk.
- **D2 — Money/Wallet item mapping.** Handoff groups nav into **Money** + **Wallet**. Proposed mapping that preserves all current items + feature flags:
  - **Money:** Dashboard · Expenses · Recurring · Categories · Price Tracker
  - **Wallet:** Group Spending · Warranties · Loyalty Cards
  - **(unchanged bottom):** Settings · Admin (admin-only collapsible)
- **D3 — Scan CTA / FAB target.** A real global scan needs the per-page `useReceiptScanner`. For Chunk 1 the sidebar **Scan receipt** button and the tab-bar **FAB** both `navigate('/receipts')`; Chunk 4 wires the FAB to open the Add/Scan action sheet on Expenses. (Interim, faithful to "FAB opens Add/Scan" once Chunk 4 lands.)

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/layout/page-toolbar.tsx` | create | Sticky glass title/subtitle/actions bar (`>= md` only) |
| `src/components/layout/mobile-tab-bar.tsx` | create | Fixed frosted bottom tab-bar: Home · Expenses · FAB · Groups · More |
| `src/components/layout/app-layout.tsx` | modify | Mount `<MobileTabBar/>`; add bottom padding to `<main>` |
| `src/components/layout/app-sidebar.tsx` | modify | Gradient Scan button + Money/Wallet section labels (keep all logic) |
| `src/i18n/en.json` + `src/i18n/sr.json` | modify | net-new: `nav.money/wallet/scanReceipt/home/more/groupsShort` |

No tests harness (Playwright-only); per-step verification = `npm run build` + preview on **5180 `--strictPort`** + screenshots (throwaway `/__chunk1-preview` route for `PageToolbar`; real routes for sidebar + tab-bar).

---

## Task 1 — i18n keys (net-new, en + sr)

**Files:** `src/i18n/en.json`, `src/i18n/sr.json`

- [ ] **Step 1:** In both files, inside the `nav` object, add (en shown; sr in parens):
  - `"money": "Money"` (`"Novac"`)
  - `"wallet": "Wallet"` (`"Novčanik"`)
  - `"scanReceipt": "Scan receipt"` (`"Skeniraj račun"`)
  - `"home": "Home"` (`"Početna"`)
  - `"more": "More"` (`"Više"`)
  - `"groupsShort": "Groups"` (`"Grupe"`)
- [ ] **Step 2:** `node -e "require('./src/i18n/en.json'); require('./src/i18n/sr.json')"` → both parse (valid JSON).

---

## Task 2 — `PageToolbar` (sticky glass bar)

**Files:** create `src/components/layout/page-toolbar.tsx`

- [ ] **Step 1: Create the component**

```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageToolbarProps {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}

/** Sticky frosted toolbar for desktop screens (mobile uses a page-level header). */
export function PageToolbar({ title, subtitle, actions, className }: PageToolbarProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-30 hidden items-center justify-between gap-4 border-b border-border px-8 py-[18px] md:flex',
        'bg-card/72 [backdrop-filter:blur(22px)_saturate(1.5)] [-webkit-backdrop-filter:blur(22px)_saturate(1.5)]',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="t-h2 truncate">{title}</h1>
        {subtitle && <div className="t-sm mt-0.5 text-muted-foreground">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

---

## Task 3 — `MobileTabBar` (frosted bottom tab-bar + FAB)

**Files:** create `src/components/layout/mobile-tab-bar.tsx`

Recipe from handoff `.tab-bar` (78px, `bg-elev/0.85`, `blur(20px)`, top hairline, safe-area bottom pad), `.tab-item` (col, gap 4, 10.5px, `fg-faint`; active = `--primary`), `.tab-item-fab` (52px gradient circle, `-mt-22`, brand shadow).

- [ ] **Step 1: Create the component**

```tsx
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Receipt, Users, MoreHorizontal, Plus, type LucideIcon } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

function Tab({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-1 py-1.5 text-[10.5px] font-semibold transition-colors',
          isActive ? 'text-primary' : 'text-fg-faint',
        )
      }
    >
      <Icon className="size-[22px]" />
      {label}
    </NavLink>
  )
}

export function MobileTabBar() {
  const { t } = useTranslation()
  const { setOpenMobile } = useSidebar()
  const navigate = useNavigate()

  // Chunk 4 wires this to open the Add/Scan action sheet on Expenses. Until then, route there.
  const onFab = () => navigate('/receipts')

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card/85 [backdrop-filter:blur(20px)] [-webkit-backdrop-filter:blur(20px)] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex w-full items-center justify-around px-3 pt-2 pb-[6px]" style={{ minHeight: 70 }}>
        <Tab to="/dashboard" icon={LayoutDashboard} label={t('nav.home')} />
        <Tab to="/receipts" icon={Receipt} label={t('nav.receipts')} />
        <button
          type="button"
          onClick={onFab}
          aria-label={t('nav.scanReceipt')}
          className="btn-brand -mt-6 grid size-[52px] shrink-0 place-items-center rounded-full text-white"
        >
          <Plus className="size-[26px]" strokeWidth={2.4} />
        </button>
        <Tab to="/groups" icon={Users} label={t('nav.groupsShort')} />
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className="flex flex-1 flex-col items-center gap-1 py-1.5 text-[10.5px] font-semibold text-fg-faint transition-colors"
        >
          <MoreHorizontal className="size-[22px]" />
          {t('nav.more')}
        </button>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2:** `npm run build` → PASS.

**Notes:** `NavLink` (no `end`) keeps Groups active on `/groups/:id`. FAB uses `.btn-brand` (the only gradient). `useSidebar()` is available because the tab-bar mounts inside `SidebarProvider` (Task 4).

---

## Task 4 — Wire `MobileTabBar` into `app-layout.tsx`

**Files:** modify `src/components/layout/app-layout.tsx`

- [ ] **Step 1: Import** — add `import { MobileTabBar } from '@/components/layout/mobile-tab-bar'`.
- [ ] **Step 2: Bottom padding on `<main>`** so the feed clears the bar. Change:
  ```tsx
  <main className="container mx-auto px-4 py-6 md:px-8 md:py-8">
  ```
  to:
  ```tsx
  <main className="container mx-auto px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-8">
  ```
- [ ] **Step 3: Render the tab-bar** — directly after `</main>` (still inside `<SidebarInset>`):
  ```tsx
      </main>
      <MobileTabBar />
    </SidebarInset>
  ```
- [ ] **Step 4: D1 — keep the global mobile header** (no change to lines 45–66).
- [ ] **Step 5:** `npm run build` → PASS.

---

## Task 5 — Sidebar glass restyle (`app-sidebar.tsx`)

**Files:** modify `src/components/layout/app-sidebar.tsx` — keep ALL logic; two visual changes.

- [ ] **Step 1: Add the gradient "Scan receipt" button** at the top of `<SidebarContent>` (before the first `SidebarGroup`). Collapses to icon-only via `group-data-[collapsible=icon]` utilities:

```tsx
<SidebarContent>
  {/* Gradient Scan CTA — the only gradient in the sidebar */}
  <div className="px-2 pt-2 group-data-[collapsible=icon]:px-0">
    <Link
      to="/receipts"
      onClick={closeMobile}
      className="btn-brand flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:p-0"
    >
      <QrCode className="size-4 shrink-0" />
      <span className="group-data-[collapsible=icon]:hidden">{t('nav.scanReceipt')}</span>
    </Link>
  </div>
  {/* ...existing groups below... */}
```
  Add `QrCode` to the lucide import list.

- [ ] **Step 2: Money/Wallet section labels (D2).** Reorganize the existing groups:
  - Remove the bare "Overview" group's lack of label; wrap Dashboard + Expenses-area items under one **Money** group with `<SidebarGroupLabel>{t('nav.money')}</SidebarGroupLabel>`: Dashboard, Expenses (Receipts), Recurring (flag), Categories, Price Tracker (flag).
  - Rename the "Manage" group label to **Wallet** (`t('nav.wallet')`): Groups, Warranties (flag), Loyalty Cards (flag).
  - Keep the Settings + Admin group unchanged.
  - This is a label/grouping move only — every `SidebarMenuItem`, `isActive`, `tooltip`, `closeMobile`, and feature-flag conditional stays byte-identical; only which `<SidebarGroup>`/`<SidebarGroupLabel>` they sit under changes.

- [ ] **Step 3:** `npm run build` → PASS (verify no unused-import / JSX errors).

---

## Task 6 — Build + cross-route verification

- [ ] **Step 1:** `npm run build` → PASS.
- [ ] **Step 2: Throwaway `PageToolbar` harness** — add a public `/__chunk1-preview` route rendering `<PageToolbar title="Expenses" subtitle="934 expenses" actions={<button className="btn-brand ...">Scan</button>} />` in light + dark; screenshot; remove the route after.
- [ ] **Step 3: Real-route preview** (requires the dev login state if backend is up; otherwise screenshot the sidebar + tab-bar via the harness frame). Preview on 5180:
  - **Desktop:** `/dashboard`, `/receipts`, `/groups`, `/categories`, `/settings` — glass sidebar shows gradient Scan button + Money/Wallet sections; active item tinted; collapse/expand still works; footer popover works. Light + dark.
  - **Mobile (375px):** tab-bar shows (Home/Expenses/FAB/Groups/More), active = primary, FAB routes to `/receipts`, **More** opens the sidebar sheet, safe-area bottom respected, content clears the bar. Light + dark.
- [ ] **Step 4:** Remove the throwaway route + page; `npm run build` → PASS.

---

## Task 7 — Commit + push

- [ ] **Step 1:** Stage the 4 component files + 2 i18n files (exclude `.claude/`).
- [ ] **Step 2:** Commit: `feat(layout): glass sidebar + mobile tab-bar/FAB + sticky PageToolbar`.
- [ ] **Step 3:** `git push origin feature/redesign-main-branch` (pre-push build hook runs).

---

## Self-review

- **Spec coverage:** sidebar glass + gradient Scan ✓T5; Money/Wallet sections ✓T5(D2); global MobileTabBar + FAB ✓T3,T4; More→sidebar sheet ✓T3; sticky PageToolbar ✓T2; bottom padding ✓T4; safe-areas ✓T3; gradient only on Scan CTA + FAB ✓T3,T5; feature-flag gating + footer popover preserved ✓T5; i18n en+sr ✓T1.
- **Decisions flagged:** D1 (keep global mobile header), D2 (Money/Wallet mapping), D3 (Scan/FAB → /receipts interim) — all reversible, surfaced for approval.
- **Out of scope (later chunks):** page-level mobile header for Expenses (C2), FAB→Add sheet wiring (C4), filter rail (C3).
- **Type consistency:** `PageToolbar`/`MobileTabBar` names match the master plan's file-structure table; `nav.*` keys consistent across tab-bar + sidebar.
```
