# Settings & Account "Glass" Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the four Settings & account surfaces (App settings, Profile, Account, Rate modal) on the Glass design system — reusing the established shell/primitives/overlays — and lock the app accent to brand emerald, with the data layer untouched.

**Architecture:** A component-only `components/settings/primitives.tsx` holds the shared building blocks; the three pages are recomposed with `PageToolbar` + mobile header; the rate modal + mobile delete confirm move to `GlassDialog`. `ThemeSegmented` is extracted from the sidebar to a shared component. Accent is retired globally by pointing base `--primary`/`--ring` at brand emerald and making `applyAccentColor` a no-op. Verify via a throwaway `/__set-preview` harness, then lint + build + commit + push on `feature/redesign-main-branch`.

**Tech Stack:** React 19, TS, Tailwind v4 (glass tokens), shadcn/Radix, framer-motion, lucide, i18next, TanStack Query.

**Reference patterns (mirror these):** `pages/warranties/index.tsx` (PageToolbar full-bleed + mobile header + AddButton), `components/recurring-expenses/primitives.tsx`, `components/glass/{glass.tsx,glass-dialog.tsx}`, `components/layout/app-sidebar.tsx` (the private `ThemeSegmented`), `docs/superpowers/specs/2026-06-04-settings-glass-redesign-design.md`.

**Spec:** `docs/superpowers/specs/2026-06-04-settings-glass-redesign-design.md`. Read it first.

---

## Task 1: i18n keys (en + sr)

**Files:** Modify `src/i18n/en.json`, `src/i18n/sr.json` (under the existing `settings` object).

- [ ] **Step 1:** Under `settings.accentColor` in **en.json**, add the retired-note keys (keep the existing `title`/`description`/color keys — they become dead but leave them for now):

```jsonc
"retiredTag": "Retired",
"retiredTitle": "Accent color",
"retiredHelp": "The Glass redesign uses one fixed brand accent — emerald — so surfaces stay calm and legible across light and dark. The six-color picker is being removed."
```

- [ ] **Step 2:** Add the Serbian equivalents under `settings.accentColor` in **sr.json**:

```jsonc
"retiredTag": "Povučeno",
"retiredTitle": "Akcentna boja",
"retiredHelp": "Glass redizajn koristi jednu fiksnu brend boju — smaragdnu — kako bi površine ostale mirne i čitljive u svetlom i tamnom režimu. Birač sa šest boja se uklanja."
```

- [ ] **Step 3:** Verify these reused keys already exist (no add needed) — print presence:

```bash
node -e "const en=require('./src/i18n/en.json');const sr=require('./src/i18n/sr.json');const g=(o,p)=>p.split('.').reduce((x,k)=>x&&x[k],o);['settings.profile.unsavedChanges','common.uploading','common.saving','common.save','common.cancel','common.deleting','settings.security.changePassword','rating.update','rating.submit','rating.submitting'].forEach(p=>console.log((g(en,p)!==undefined?'EN-OK ':'EN-MISS '),(g(sr,p)!==undefined?'SR-OK ':'SR-MISS '),p))"
```

If `settings.profile.unsavedChanges` is missing, add `"unsavedChanges": "Unsaved changes"` (en) / `"unsavedChanges": "Nesačuvane izmene"` (sr) under `settings.profile`. If `common.uploading` is missing, add `"uploading": "Uploading…"` / `"uploading": "Otpremanje…"` under `common`. (The current `profile.tsx` already uses `common.uploading` / `common.saving` so they likely exist; add only the genuinely missing ones.)

- [ ] **Step 4:** Validate + commit:

```bash
node -e "require('./src/i18n/en.json');require('./src/i18n/sr.json');console.log('ok')"
git add src/i18n/en.json src/i18n/sr.json && git commit -m "i18n(settings): add accent-retired note keys (en + sr)"
```

---

## Task 2: Emerald lock — `index.css` + `store/settings.ts`

**Files:** Modify `src/index.css` (base `--primary`/`--ring` + remove `.accent-*` blocks), `src/store/settings.ts` (`applyAccentColor` no-op).

- [ ] **Step 1:** In `src/index.css`, change the base `--primary` and `--ring` to brand emerald (values mirror `.auth-emerald`). In the `:root` block (around line 96 / 108):

```css
  --primary: oklch(0.55 0.16 165);   /* was oklch(0.205 0 0) — emerald locked */
  --ring: oklch(0.55 0.16 165);      /* was oklch(0.708 0 0) */
```

In the `.dark` block (around line 158 / 170):

```css
  --primary: oklch(0.78 0.15 165);   /* was oklch(0.922 0 0) — emerald locked */
  --ring: oklch(0.78 0.15 165);      /* was oklch(0.556 0 0) */
```

Leave `--primary-foreground` untouched in both (light near-white / dark near-black both read correctly on emerald). `--primary-soft` auto-derives via `oklch(from var(--primary) …)`, so it follows automatically.

- [ ] **Step 2:** In `src/index.css`, delete the six `.accent-*` rule blocks (the `.accent-blue` … `.accent-zinc` + their `.dark` variants, roughly lines 215–280 — everything from the accent-presets comment through the last `.dark .accent-zinc`). Keep `.auth-emerald` / `.onboarding-emerald` (now redundant but harmless and still referenced by auth/onboarding wrappers). Confirm nothing else references `.accent-`:

```bash
grep -rn "accent-zinc\|accent-blue\|accent-green\|accent-purple\|accent-orange\|accent-rose" src/ || echo "no accent-* refs remain (store handled next)"
```

- [ ] **Step 3:** In `src/store/settings.ts`, make `applyAccentColor` strip any stale class and add nothing (keep the function + the `setAccentColor` setter + `AccentColor` type + the persisted field — only theming stops):

```ts
function applyAccentColor(_color: AccentColor) {
  // Accent retired — the app is locked to brand emerald (see index.css).
  // Strip any accent class persisted from before the lock; add none.
  const root = window.document.documentElement
  root.classList.remove('accent-zinc', 'accent-blue', 'accent-green', 'accent-purple', 'accent-orange', 'accent-rose')
}
```

- [ ] **Step 4:** Typecheck + commit:

```bash
npx tsc -b --pretty false 2>&1 | grep -E "settings.ts|index.css" || echo "clean"
git add src/index.css src/store/settings.ts && git commit -m "feat(theme): retire accent picker — lock app to brand emerald"
```

---

## Task 3: Extract `ThemeSegmented` to a shared component

**Files:** Create `src/components/layout/theme-segmented.tsx`; modify `src/components/layout/app-sidebar.tsx` (remove the private copy, import the shared one).

- [ ] **Step 1:** Create `src/components/layout/theme-segmented.tsx`. Move the existing private `ThemeSegmented` body from `app-sidebar.tsx` (lines ~110–145) and add a `labeled` variant. Icon-only is the sidebar pill; labeled is the settings row (icon + text, taller).

```tsx
import { Sun, Moon, Monitor, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSettingsStore, type Theme } from '@/store/settings'
import { cn } from '@/lib/utils'

interface ThemeSegmentedProps {
  /** Show the Light/Dark/System text label beside each icon (settings row). Default false = icon-only pill (sidebar). */
  labeled?: boolean
  className?: string
}

export function ThemeSegmented({ labeled = false, className }: ThemeSegmentedProps) {
  const { t } = useTranslation()
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const opts: { value: Theme; icon: LucideIcon; label: string }[] = [
    { value: 'light', icon: Sun, label: t('settings.appearance.light') },
    { value: 'dark', icon: Moon, label: t('settings.appearance.dark') },
    { value: 'system', icon: Monitor, label: t('settings.appearance.system') },
  ]
  return (
    <span
      role="group"
      aria-label={t('settings.appearance.theme')}
      className={cn(
        'inline-flex shrink-0 gap-0.5 rounded-full border border-hairline-soft bg-bg-subtle p-[3px]',
        className,
      )}
    >
      {opts.map(({ value, icon: Icon, label }) => {
        const active = theme === value
        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-pressed={active}
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-full transition-colors',
              labeled ? 'h-9 px-3.5 text-[13px] font-semibold' : 'h-[26px] w-7',
              active ? 'bg-card text-foreground shadow-glass-1' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" />
            {labeled && <span>{label}</span>}
          </button>
        )
      })}
    </span>
  )
}
```

- [ ] **Step 2:** In `app-sidebar.tsx`: delete the private `function ThemeSegmented() {…}` (lines ~110–145) and add `import { ThemeSegmented } from '@/components/layout/theme-segmented'` at the top. The two existing `<ThemeSegmented />` usages (desktop popover ~379, mobile drawer ~445) stay as-is (icon-only default). Remove any now-unused imports (`Sun`/`Moon`/`Monitor`/`Theme`) from `app-sidebar.tsx` **only if** they are no longer referenced — verify with grep before deleting.

```bash
grep -n "Sun\|Moon\|Monitor\|\bTheme\b" src/components/layout/app-sidebar.tsx
```

- [ ] **Step 3:** Typecheck + commit:

```bash
npx tsc -b --pretty false 2>&1 | grep -E "theme-segmented|app-sidebar" || echo "clean"
git add src/components/layout/theme-segmented.tsx src/components/layout/app-sidebar.tsx && git commit -m "refactor(shell): extract shared ThemeSegmented (icon-only + labeled variant)"
```

---

## Task 4: Settings primitives — `components/settings/primitives.tsx`

**Files:** Create `src/components/settings/primitives.tsx` (component-only — no exported non-components, per the `react-refresh/only-export-components` lint rule; the tier tone map is a module const, which is fine).

- [ ] **Step 1:** Build the primitives. Anatomy from `SettingsShared.jsx` / `SettingsScreens.jsx`, mapped to real tokens.

**`SettingsCard`** — `function SettingsCard({ icon: Icon, title, desc, danger, children, className })`:
- root: `<section className={cn('rounded-2xl border bg-card p-5 sm:p-[22px] shadow-glass-1', danger ? 'border-destructive/40' : 'border-border', className)}>`.
- head (only when `title`): `<header className="mb-4"><h3 className={cn('flex items-center gap-2 text-[17px] font-bold tracking-[-0.01em]', danger && 'text-destructive')}>{Icon && <Icon className={cn('size-[18px]', danger ? 'text-destructive' : 'text-muted-foreground')} />}{title}</h3>{desc && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{desc}</p>}</header>`.

**`SettingRow`** — `function SettingRow({ label, help, htmlFor, children })`: `<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">` → left `<div className="space-y-0.5"><label htmlFor={htmlFor} className="text-sm font-semibold">{label}</label>{help && <p className="text-[13px] text-muted-foreground">{help}</p>}</div>` + right `<div className="shrink-0">{children}</div>`.

**`AccentRetired`** — `function AccentRetired()` (uses `t`): the dashed retired note:
```tsx
<div className="flex items-start gap-3 rounded-xl border border-dashed border-border bg-bg-subtle/60 p-3.5">
  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-bg-subtle text-muted-foreground"><Lock className="size-[15px]" /></span>
  <div className="min-w-0 flex-1">
    <div className="flex items-center gap-2 text-sm font-semibold">
      {t('settings.accentColor.retiredTitle')}
      <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-foreground">{t('settings.accentColor.retiredTag')}</span>
    </div>
    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{t('settings.accentColor.retiredHelp')}</p>
  </div>
  <span aria-hidden className="mt-0.5 size-[26px] shrink-0 rounded-full bg-brand-gradient shadow-sm" title="Brand accent (emerald)" />
</div>
```

**`NotifList` / `NotifRow`** — `function NotifList({ children })`: `<div className="divide-y divide-hairline-soft overflow-hidden rounded-xl border border-border">`. `function NotifRow({ title, help, checked, onCheckedChange, disabled })`: `<div className="flex items-center justify-between gap-4 px-4 py-3.5"><div className="min-w-0"><div className="text-[15px] font-semibold">{title}</div><p className="mt-0.5 text-[13px] text-muted-foreground">{help}</p></div><Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} /></div>` (shadcn `Switch` from `@/components/ui/switch`).

**`RankCard`** — `function RankCard({ count, rank, nextRankName, progress, receiptsToNextRank, name, description })` — takes already-computed values from the page (page owns `lib/rank.ts` calls; keep the i18n string building in the page like the current `profile.tsx`, OR pass `name`/`description` in). Tone map (module const):
```ts
const RANK_TONE = {
  status_a: { tile: 'bg-warning-soft text-warning-foreground', fill: 'var(--warning)', card: 'border-warning/30', icon: Crown },
  status_b: { tile: 'bg-info-soft text-info-foreground',       fill: 'var(--info)',    card: 'border-info/30',    icon: Sparkles },
  status_c: { tile: 'bg-success-soft text-success-foreground', fill: 'var(--success)', card: 'border-success/30', icon: Compass },
  none:     { tile: 'bg-bg-subtle text-muted-foreground',      fill: 'var(--muted-foreground)', card: 'border-border', icon: Compass },
} as const
```
Anatomy: root `<div className={cn('rounded-2xl border bg-card p-5 sm:p-[22px] shadow-glass-1', tone.card)}>`:
1. top row `flex items-start gap-3.5`: crest `<span className={cn('grid size-[54px] shrink-0 place-items-center rounded-2xl', tone.tile)}><tone.icon className="size-[26px]" /></span>` + middle `<div className="min-w-0 flex-1"><span className="t-xs text-fg-faint">{t('settings.profile.rank.title')}</span><div className="text-[22px] font-extrabold tracking-[-0.02em] leading-tight">{name}</div><div className="mt-0.5 text-[13px] text-muted-foreground">{t('settings.profile.rank.receiptsTracked',{count})}</div></div>`.
2. progress block `mt-4`: row `<div className="flex items-center justify-between text-[12.5px] text-muted-foreground"><span>{t('settings.profile.rank.progress')}</span><span className="t-num">{Math.round(progress)}%</span></div>`; track `<div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-subtle"><div className="h-full rounded-full" style={{ width: progress+'%', background: tone.fill }} /></div>`; next line `<div className="mt-1.5 text-[13px] text-muted-foreground">{receiptsToNextRank>0 ? t('settings.profile.rank.nextTarget',{count:receiptsToNextRank,rank:nextRankName}) : t('settings.profile.rank.topTier')}</div>`.
3. description `<p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{description}</p>`.

**`SaveBar`** — `function SaveBar({ dirty, saving, onSave })`: `<div className="flex items-center justify-end gap-3">` → dirty-only indicator `{dirty && !saving && <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-warning-foreground"><span className="size-1.5 rounded-full bg-warning" />{t('settings.profile.unsavedChanges')}</span>}` + `<Button type="button" onClick={onSave} disabled={!dirty || saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{saving ? t('common.saving') : t('common.save')}</Button>` (shadcn `Button`; primary when enabled).

**`StarPicker`** — `function StarPicker({ value, onChange })`: own internal `hover` state. `<div className="flex justify-center gap-1" role="radiogroup">` mapping 1..5 → `<button type="button" onClick={()=>onChange(n)} onMouseEnter={()=>setHover(n)} onMouseLeave={()=>setHover(0)} className="p-1 transition-transform hover:scale-110"><Star className={cn('size-[34px] transition-colors', n <= (hover||value) ? 'fill-warning text-warning' : 'text-border')} /></button>`. (Uses `--warning` amber; empty = `text-border`.)

- [ ] **Step 2:** Typecheck: `npx tsc -b --pretty false 2>&1 | grep "settings/primitives" || echo "clean"`. Expected `clean`.
- [ ] **Step 3:** Lint the new file: `npx eslint src/components/settings/primitives.tsx`. Expected: clean (watch the `only-export-components` rule — only components + the module-const tone map are exported/defined; if lint complains, move `RANK_TONE` inline into `RankCard` or to a sibling `.ts`).
- [ ] **Step 4:** Commit: `git add src/components/settings/primitives.tsx && git commit -m "feat(settings): glass primitives (card, row, accent-retired, notif list, rank crest, save bar, stars)"`

---

## Task 5: App settings page — rewrite `pages/settings/app.tsx`

**Files:** Modify `src/pages/settings/app.tsx`.

- [ ] **Step 1:** Rewrite. Keep ALL wiring verbatim (`useSettingsStore` currency/theme/language setters, `useMe(true)`/`useAuthStore` `effectiveUser`, `useUpdateMe`, the three notification flags). Remove the accent-swatch picker and the theme `Select`; drop now-unused imports (`Palette` stays; remove `Check`, the `accentColors` array, `Label` if unused, the theme `Select`). Layout = `AppLayout` + `PageTransition` + desktop `PageToolbar` (full-bleed) + mobile header, then a `max-w-3xl` single column of cards with `space-y-5` (the handoff's 768px centered column).

  - **Shell:**
    ```tsx
    <AppLayout>
      <PageTransition>
        <PageToolbar className="md:-mx-8 md:-mt-8 md:mb-6" title={t('settings.title')} subtitle={t('settings.subtitle')} />
        <div className="mb-5 md:hidden">
          <h1 className="t-h1 text-[28px]">{t('settings.title')}</h1>
          <p className="t-sm mt-1 text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
        <div className="mx-auto max-w-3xl space-y-5">
          {/* cards */}
        </div>
      </PageTransition>
    </AppLayout>
    ```
  - **Appearance card** (`SettingsCard` icon `Palette`, title `settings.appearance.title`, desc `settings.appearance.description`): a `SettingRow` (label `settings.appearance.theme`, help `settings.appearance.themeHelp`) → `<ThemeSegmented labeled />`; then `<div className="my-4 h-px bg-hairline-soft" />`; then `<AccentRetired />`.
  - **Language card** (icon `Languages`, title/desc `settings.language.*`): `SettingRow` (label `settings.language.label`, help `settings.language.help`) → the existing shadcn `Select` (value `language`, on change `setLanguage(v)` + `updateMe.mutate({ preferredLanguage: v })`) with a `Globe` lead icon inside the trigger and `triggerClassName`/width `sm:w-[200px]` — reuse the existing `languages` array. (Keep `Select`; it already matches. Add the globe by placing `<Globe className="size-4 text-muted-foreground" />` before `<SelectValue />` in the trigger.)
  - **Currency card** (icon `DollarSign`, title/desc `settings.currency.*`): `SettingRow` (label `settings.currency.label`, help `settings.currency.help`) → `<CurrencySelect id="currency" value={currency} onValueChange={setCurrency} placeholder={t('settings.currency.label')} variant="full" triggerClassName="w-full sm:w-[248px]" />`.
  - **Notifications card** (icon `Bell`, title/desc `settings.notifications.*`): `<NotifList>` with 3 `<NotifRow>`:
    1. `title={t('settings.notifications.rankMilestones')}` `help={t('settings.notifications.rankMilestonesHelp')}` `checked={receiptMilestoneEmailsEnabled}` `onCheckedChange={(c)=>updateMe.mutate({ receiptMilestoneEmailsEnabled: c })}`.
    2. `warranties` → `warrantyReminderEnabled`.
    3. `budget` → `budgetAlertEnabled` (`effectiveUser?.budgetAlertEnabled ?? true`).
    `disabled={updateMe.isPending}` on each.

- [ ] **Step 2:** Typecheck + lint: `npx tsc -b --pretty false 2>&1 | grep "settings/app" || echo clean` then `npx eslint src/pages/settings/app.tsx`. Expected clean.
- [ ] **Step 3:** Commit: `git add src/pages/settings/app.tsx && git commit -m "feat(settings): Glass App settings (theme segmented, retired accent, currency, notif list)"`

---

## Task 6: Profile page — rewrite `pages/settings/profile.tsx`

**Files:** Modify `src/pages/settings/profile.tsx`.

- [ ] **Step 1:** Rewrite presentation; **keep ALL logic verbatim** — `effectiveUser`, `receiptCount`, `receiptRank`, the `rankConfig` `useMemo`, `draft`/`initial`/`isDirty`, `handleSaveProfile`/`handleRemoveProfileImage`/`handleFileSelect`/`handleFileChange`, the hidden file input + validation + toasts. Swap the rank `useMemo`'s presentational fields (`icon`/`iconClassName`/`cardClassName`) usage to pass `receiptRank` straight into `RankCard` (which owns the tone map); keep `rankConfig.name`/`description`/`progress`/`nextRankName`/`receiptsToNextRank` (still computed from i18n + `lib/rank.ts`).

  - **Shell:** same as Task 5 (`PageToolbar` full-bleed title `settings.profile.title` / subtitle `settings.profile.description`; mobile header; `mx-auto max-w-3xl space-y-5`).
  - **Identity card** (`SettingsCard`, no icon/title — pass `children` only): avatar block `<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><Avatar firstName={…} lastName={…} imageUrl={effectiveUser.profileImageUrl} size="2xl" /><div><div className="space-y-0.5"><span className="text-sm font-semibold">{t('settings.profile.picture')}</span><p className="text-[13px] text-muted-foreground">{t('settings.profile.pictureHelp')}</p></div><div className="mt-3 flex gap-2"><Button variant="outline" size="sm" className="h-10" onClick={handleFileSelect} disabled={uploadProfileImage.isPending}><ImageIcon className="size-4" />{uploadProfileImage.isPending ? t('common.uploading') : t('settings.profile.upload')}</Button><Button variant="ghost" size="sm" className="h-10 text-destructive hover:text-destructive" onClick={handleRemoveProfileImage} disabled={!effectiveUser.profileImageUrl || updateMe.isPending}><Trash2 className="size-4" />{t('settings.profile.remove')}</Button></div></div></div></div>` + the hidden `<input ref={fileInputRef} type="file" … className="hidden" />`. Then `<div className="my-5 h-px bg-hairline-soft" />`. Then names 2-col + email, using the glass `Field`:
    - `<div className="grid gap-4 sm:grid-cols-2"><Field label={t('settings.profile.firstName')} id="firstName" value={draft.firstName} onChange={e=>setDraft(p=>({...p,firstName:e.target.value}))} autoComplete="given-name" /><Field label={t('settings.profile.lastName')} … /></div>`
    - email (disabled, mail lead): `<div className="mt-4"><Field label={t('settings.profile.email')} id="email" icon={Mail} value={effectiveUser.email} disabled containerClassName="opacity-… " /></div>` (the glass `Field` accepts `icon`, `disabled`, and standard input props; disabled styling via the input's `disabled:` — acceptable as-is).
  - **Address card** (`SettingsCard` icon `MapPin`, title/desc `settings.profile.address.*`): `Field` street (full), then 2-col `Field` zipCode (`postal-code`) + city (`address-level2`). Bind to `draft.street/zipCode/city`.
  - **Monthly Income card** (icon `Wallet`, title `settings.profile.income`, desc `settings.profile.incomeDescription`): 2-col — `Field` monthlyIncome (`type="number"` min 0 step 0.01 placeholder `0.00`, bind `draft.monthlyIncome`) + a labeled `CurrencySelect` for income currency. Since `CurrencySelect` renders its own trigger (not a glass `Field`), wrap it with a glass-style label: `<div className="min-w-0 flex-1"><label className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">{t('settings.profile.incomeCurrency')}</label><CurrencySelect value={draft.incomeCurrency} onValueChange={v=>setDraft(p=>({...p,incomeCurrency:v}))} placeholder={t('settings.profile.incomeCurrency')} variant="full" triggerClassName="h-[50px] w-full rounded-[14px]" /></div>`.
  - **Rank card:** `<RankCard count={receiptCount} rank={receiptRank} name={rankConfig.name} description={rankConfig.description} progress={rankConfig.progress} nextRankName={rankConfig.nextRankName} receiptsToNextRank={rankConfig.receiptsToNextRank} />`.
  - **Save bar:** `<SaveBar dirty={isDirty} saving={updateMe.isPending} onSave={handleSaveProfile} />`.
  - **Not-loaded guard:** keep the `!effectiveUser` → `t('common.loading')` branch (render a small skeleton or the loading text inside the column).

- [ ] **Step 2:** Reconcile `RankCard` props with Task 4 — final signature is `{ count, rank, name, description, progress, nextRankName, receiptsToNextRank }`. Update Task 4's `RankCard` if it diverges (this is the source of truth).
- [ ] **Step 3:** Typecheck + lint: `npx tsc -b --pretty false 2>&1 | grep "settings/profile" || echo clean` then `npx eslint src/pages/settings/profile.tsx`. Expected clean.
- [ ] **Step 4:** Commit: `git add src/pages/settings/profile.tsx src/components/settings/primitives.tsx && git commit -m "feat(settings): Glass Profile (identity/address/income cards, rank crest, dirty save bar)"`

---

## Task 7: Account page — rewrite `pages/settings/account.tsx`

**Files:** Modify `src/pages/settings/account.tsx`.

- [ ] **Step 1:** Rewrite presentation; **keep ALL logic verbatim** — `passwordForm`, `passwordError`, the 3 `show*` toggles, `handleChangePassword` (all validation + error keys unchanged), `deleteConfirmText`, `showDeleteConfirm`, `handleDeleteAccount`. Add `const isMobile = useIsMobile(768)` for the responsive delete confirm.

  - **Shell:** same pattern (`PageToolbar` full-bleed title `nav.account` / subtitle `settings.security.accountPageDescription`; mobile header; `mx-auto max-w-3xl space-y-5`).
  - **Security card** (`SettingsCard` icon `KeyRound`, title/desc `settings.security.*`):
    - Current password: `<PasswordField label={t('settings.security.currentPassword')} id="currentPassword" value={passwordForm.currentPassword} onChange={e=>setPasswordForm(p=>({...p,currentPassword:e.target.value}))} autoComplete="current-password" />` (the glass `PasswordField` has the eye toggle built in — replaces the manual `show*` + `Input pr-10` markup for this field).
    - 2-col grid: New password `<div><PasswordField label={t('settings.security.newPassword')} id="newPassword" value={passwordForm.newPassword} onChange={…} error={undefined} autoComplete="new-password" /><PasswordStrengthMeter value={passwordForm.newPassword} /></div>` + Confirm `<PasswordField label={t('settings.security.confirmPassword')} id="confirmPassword" value={passwordForm.confirmPassword} onChange={…} autoComplete="new-password" />`.
      - NOTE: `PasswordField` owns its own show/hide state, so the page's `show*` state becomes unused for these fields — remove `showCurrentPassword/showNewPassword/showConfirmPassword` + their imports (`Eye`,`EyeOff`) since `PasswordField` handles it. (Confirm none referenced elsewhere before deleting.)
    - Inline error (replaces `<p className="text-sm text-destructive">`): `{passwordError && <Alert kind="err" icon={CircleAlert}>{passwordError}</Alert>}` (glass `Alert` from `@/components/glass/glass`).
    - Footer: `<div className="flex justify-end"><Button type="button" onClick={handleChangePassword} disabled={changePassword.isPending || !passwordForm.currentPassword || !passwordForm.newPassword}><KeyRound className="size-4" />{changePassword.isPending ? t('common.saving') : t('settings.security.changePassword')}</Button></div>`.
  - **Danger Zone card** (`SettingsCard danger` icon `AlertTriangle`, title `settings.dangerZone.title`, desc `settings.dangerZone.description`):
    - Warning box: `<div className="rounded-xl bg-destructive-soft p-4"><p className="text-sm font-semibold text-[color:var(--destructive-foreground-on-soft)]">{t('settings.dangerZone.deleteAccountWarning')}</p><ul className="mt-2 list-inside list-disc space-y-1 text-[13px] text-[color:var(--destructive-foreground-on-soft)]/85"><li>{deleteItem1}</li>…<li>{deleteItem4}</li></ul></div>` (4 items `settings.dangerZone.deleteItem1..4`).
    - Trigger / confirm:
      - **Collapsed** (always the entry point): `<Button variant="destructive" className="mt-4 !text-white" onClick={()=> isMobile ? setShowDeleteConfirm(true) : setShowDeleteConfirm(true)}><Trash2 className="size-4" />{t('settings.dangerZone.deleteAccount')}</Button>`. (Same `setShowDeleteConfirm(true)` either way; the rendering differs by `isMobile`.)
      - **Desktop expanded inline** (`!isMobile && showDeleteConfirm`): a danger-bordered block below the button — `<div className="mt-4 space-y-3 rounded-xl border border-destructive/50 p-4"><p className="text-sm font-semibold">{t('settings.dangerZone.confirmPrompt')}</p><Input type="text" placeholder="DELETE" value={deleteConfirmText} onChange={e=>setDeleteConfirmText(e.target.value)} className="font-mono" /><div className="flex gap-2"><Button variant="outline" onClick={()=>{setShowDeleteConfirm(false);setDeleteConfirmText('')}}>{t('common.cancel')}</Button><Button variant="destructive" className="!text-white" onClick={handleDeleteAccount} disabled={deleteConfirmText!=='DELETE'||deleteMyAccount.isPending}><Trash2 className="size-4" />{deleteMyAccount.isPending ? t('common.deleting') : t('settings.dangerZone.confirmDelete')}</Button></div></div>`. (Keep the existing shadcn `Input` here.)
  - **Mobile delete sheet** (`GlassDialog`, rendered once at page root, `open={isMobile && showDeleteConfirm}`): title `t('settings.dangerZone.deleteAccount')`, description `t('settings.dangerZone.mobileSubtitle')` *(verify key; if absent reuse `settings.dangerZone.description`)*. Body = a danger badge `<div className="mb-4 grid place-items-center"><span className="grid size-[60px] place-items-center rounded-[18px] bg-destructive-soft text-destructive"><AlertTriangle className="size-[26px]" /></span></div>` + the same warning box + bullets + prompt + `Input` (font-mono). Footer (stacked): `<div className="flex flex-col gap-2"><Button variant="destructive" className="!text-white w-full" onClick={handleDeleteAccount} disabled={deleteConfirmText!=='DELETE'||deleteMyAccount.isPending}>…confirmDelete</Button><Button variant="ghost" className="w-full" onClick={()=>{setShowDeleteConfirm(false);setDeleteConfirmText('')}}>{t('common.cancel')}</Button></div>`. `onOpenChange` → `{setShowDeleteConfirm(false);setDeleteConfirmText('')}`.

- [ ] **Step 2:** Typecheck + lint: `npx tsc -b --pretty false 2>&1 | grep "settings/account" || echo clean` then `npx eslint src/pages/settings/account.tsx`. Expected clean.
- [ ] **Step 3:** Commit: `git add src/pages/settings/account.tsx && git commit -m "feat(settings): Glass Account (auth-style password card + strength meter, responsive danger zone)"`

---

## Task 8: Rate app modal — rewrite `components/rating/rate-app-modal.tsx`

**Files:** Modify `src/components/rating/rate-app-modal.tsx`.

- [ ] **Step 1:** Rewrite on `GlassDialog`; **keep ALL logic verbatim** — `useMyRating`/`useSubmitRating`, the `useEffect` prefill, `rating`/`hoveredRating`/`description`/`isPublic`, `handleSubmit`, `displayRating`. Replace the shadcn `Dialog` shell with `GlassDialog` and the inline star markup with `StarPicker`.

```tsx
<GlassDialog
  open={open}
  onOpenChange={handleClose}
  title={t('rating.title')}
  description={t('rating.description')}
  desktopWidth={480}
  footer={
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <Button variant="outline" onClick={handleClose} disabled={submitRating.isPending} className="sm:w-auto w-full sm:order-1 order-2">{t('common.cancel')}</Button>
      <Button onClick={() => handleSubmit()} disabled={rating === 0 || submitRating.isPending} className="sm:w-auto w-full sm:order-2 order-1">
        {submitRating.isPending ? t('rating.submitting') : existingRating ? t('rating.update') : t('rating.submit')}
      </Button>
    </div>
  }
>
  <div className="space-y-4">
    <div>
      <p className="mb-2.5 text-center text-sm font-semibold">{t('rating.ratingLabel')}</p>
      <StarPicker value={rating} onChange={setRating} />
    </div>
    <div>
      <label htmlFor="rating-description" className="mb-1.5 ml-0.5 block text-xs font-semibold text-muted-foreground">{t('rating.descriptionLabel')}</label>
      <div className="relative">
        <Textarea id="rating-description" value={description} onChange={e=>setDescription(e.target.value)} placeholder={t('rating.descriptionPlaceholder')} rows={4} maxLength={1000} disabled={submitRating.isPending} className="resize-none rounded-[14px] pr-2" />
        <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] tabular-nums text-fg-faint">{description.length}/1000</span>
      </div>
    </div>
    <label className="flex cursor-pointer select-none items-center gap-2.5">
      <Checkbox checked={isPublic} onChange={e=>setIsPublic((e.target as HTMLInputElement).checked)} disabled={submitRating.isPending} />
      <span className="text-sm text-muted-foreground">{t('rating.allowPublic')}</span>
    </label>
  </div>
</GlassDialog>
```
  - NOTE: `handleSubmit` currently takes `(e: React.FormEvent)` and calls `e.preventDefault()`. Since there's no `<form>` now, change its signature to `handleSubmit()` (drop the `e` param + `preventDefault`). The submit `Button` is `type="button"` (default) calling `onClick={() => handleSubmit()}`.
  - `Checkbox` is the glass one from `@/components/glass/glass` (custom 20px control, uses `onChange`).
  - Drop the old `Dialog`/`DialogContent`/`DialogHeader`/`DialogFooter`/`DialogTitle`/`DialogDescription`/`Label`/`Star`/`cn` imports that are no longer used; add `GlassDialog`, `StarPicker`, `Checkbox`.

- [ ] **Step 2:** Typecheck + lint: `npx tsc -b --pretty false 2>&1 | grep "rate-app-modal" || echo clean` then `npx eslint src/components/rating/rate-app-modal.tsx`. Expected clean.
- [ ] **Step 3:** Commit: `git add src/components/rating/rate-app-modal.tsx && git commit -m "feat(rating): rate-app modal on GlassDialog (desktop modal / mobile sheet, glass stars)"`

---

## Task 9: Verify, lint, build, docs, push

**Files:** temporary `src/pages/__set-preview.tsx` + a route in `src/routes.tsx` (both deleted after); modify `docs/design-system.md`.

- [ ] **Step 1:** Add a throwaway public route `/__set-preview` (mirror the warranties/`__rec-preview` harness — a public route added to `routes.tsx` outside the auth guard) rendering, each block once in light and once inside a `<div className="dark bg-background">` panel:
  - The **App settings** cards: Appearance (`<ThemeSegmented labeled />` + `<AccentRetired />`), a `NotifList` of 3 `NotifRow`s with local toggle state.
  - The **Profile** `RankCard` at two tiers (`none` low count + `status_a` 120) and a `SaveBar` in clean + dirty + saving states.
  - The **Account** Security card (rest, then with `PasswordStrengthMeter` filled, then with an `Alert` error) + Danger Zone collapsed + desktop-expanded.
  - The **Rate modal** body (`StarPicker` empty/filled + textarea + checkbox).
  Wrap each in plain `bg-card` cards; this harness imports the real primitives, so it proves the visuals without auth/back end.
- [ ] **Step 2:** Start preview + screenshot: `npm run dev -- --port 5180 --strictPort` (config `.claude/launch.json`). Use `preview_start`, then `preview_screenshot` at 390 (mobile) + 1280 (desktop) widths. **Set explicit width AND height** on resize (per the categories-cycle gotcha — the preview viewport silently collapsed to `innerW:1`; never rely on the desktop preset). Check `preview_console_logs` for errors. Verify: emerald accent everywhere (buttons/active rings are emerald), the retired-accent note renders dashed with the gradient swatch, the rank crest tints per tier, the strength meter colors, the danger box uses `destructive-soft`. Fix any issue by editing source, then re-screenshot.
- [ ] **Step 3:** Remove the harness: delete `src/pages/__set-preview.tsx` and its route line in `routes.tsx`. Confirm: `grep -n "__set-preview" src/routes.tsx || echo "route removed"`.
- [ ] **Step 4:** Update `docs/design-system.md`: add **settings** to the "Migrated so far" list (App settings / Profile / Account / Rate modal — theme segmented extracted shared, retired-accent note, rank crest, responsive danger sheet); add the **emerald lock** note (accent picker retired, base `--primary` now brand emerald app-wide, `applyAccentColor` no-op) near the "Accent lock" paragraph; and note `ThemeSegmented` now lives in `components/layout/theme-segmented.tsx` (labeled variant).
- [ ] **Step 5:** Lint + build (the real gate): `npm run lint` (no NEW errors vs the repo's pre-existing baseline in the files touched) and `npm run build` (tsc + vite). **Both must pass.** Fix anything that fails before continuing.
- [ ] **Step 6:** Commit + push:

```bash
git add -A && git commit -m "docs(settings): mark Glass settings redesign migrated in design-system.md"
git push origin feature/redesign-main-branch
```

---

## Self-review notes
- **Spec coverage:** emerald lock (T2), App settings incl. theme segmented + retired accent + notif list (T3+T5), Profile incl. rank crest + dirty save (T6), Account incl. auth password card + responsive danger sheet (T7), Rate modal → GlassDialog (T8), i18n (T1), verify/lint/build/docs/push (T9). All spec sections covered.
- **Type consistency:** `RankCard` final prop signature fixed in T6 Step 2 (supersedes the T4 sketch): `{ count, rank, name, description, progress, nextRankName, receiptsToNextRank }`. `ThemeSegmented({ labeled })` used icon-only in sidebar / labeled in settings. `NotifRow` uses shadcn `Switch` `onCheckedChange`. `StarPicker` owns its hover. `handleSubmit()` loses its event param in T8.
- **No new deps:** all reused (`GlassDialog`, glass `Field`/`PasswordField`/`PasswordStrengthMeter`/`Checkbox`/`Alert`, shadcn `Switch`/`Select`/`Textarea`/`Input`/`Button`, `CurrencySelect`, `Avatar`, `Progress` not needed — rank bar is a plain div).
- **Honest gaps:** emerald lock changes `--primary` app-wide (intended); `accentColor` store field left in place (dead for theming); password/profile forms keep local-state validation (no RHF/zod — that's TD-1); authed end-to-end not run live (verified in isolation + build).
```
