import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// jsx-a11y's recommended set, with every rule forced to `warn`. The repo lint
// baseline is intentionally dirty (gate = 0 NEW errors in touched files), so a11y
// findings ship as warnings — visible in editors/CI, never breaking the build.
// Promote individual rules to `error` once the codebase is clean for them.
const jsxA11yWarn = Object.fromEntries(
  Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, 'warn']),
)

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // Accessibility baseline (docs/design-system.md → "Accessibility baseline").
    // jsx-a11y recommended set, as warnings. Catches alt-text, invalid ARIA props/
    // roles, redundant roles, label associations, etc. — the machine-checkable slice
    // of the audit rules. (Touch targets, "icon-only needs aria-label", and
    // color-not-only stay human-reviewed; see the custom rule + the doc.)
    files: ['**/*.tsx'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: jsxA11yWarn,
  },
  {
    // Touch-target guardrail: a 32/36px icon button (size-8 / size-9) must declare a
    // 44px hit area — either the `hit-area` utility (raw buttons) or <Button size="icon"
    // | "icon-sm">. Catches the single most-repeated finding from the 2026-06-24 audit.
    // Primitive layer is NOT exempt (this is exactly where the small kebabs/swatches
    // live and need hit-area). Add `// eslint-disable-next-line no-restricted-syntax --
    // touch-target-ok: <reason>` for the rare legitimate exception (e.g. a decorative
    // non-interactive box that merely happens to be size-8).
    files: ['**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          // className literal containing size-8 or size-9 but NOT hit-area.
          // Matches both the standalone size and a trailing-space-delimited token.
          selector:
            "JSXElement[openingElement.name.name=/^(Button|button)$/]:has(JSXAttribute[name.name='className'] > Literal[value=/(^|\\s)size-[89]($|\\s)/]):not(:has(Literal[value=/hit-area/]))",
          message:
            'A size-8/size-9 element that is interactive needs a 44px touch target: add the `hit-area` utility (raw <button>) or use <Button size="icon"|"icon-sm">. See docs/design-system.md → Accessibility baseline. If this element is purely decorative/non-interactive, add `// eslint-disable-next-line no-restricted-syntax -- touch-target-ok: <reason>`.',
        },
      ],
    },
  },
  {
    // Steer raw <button> to the shared <Button>. The design-primitive layer
    // (components/ui, components/glass, *primitives.tsx) is exempt — that's where
    // bespoke interactive surfaces legitimately live. Hard `error` for all new /
    // clean files; the PostToolUse hook (.claude/hooks/no-raw-button.sh) additionally
    // blocks new raw buttons everywhere. Pre-existing offenders are grandfathered to
    // `warn` in the override below — shrink that list as files get migrated.
    files: ['**/*.tsx'],
    ignores: ['**/components/ui/**', '**/components/glass/**', '**/*primitives.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='button']",
          message:
            'Use the shared <Button> from @/components/ui/button instead of a raw <button> (variants: brand/glass/destructive-soft/etc.). Raw <button> belongs only in the primitive layer (components/ui, components/glass, *primitives.tsx), or add `// eslint-disable-next-line no-restricted-syntax -- raw-button-ok: <reason>`.',
        },
        {
          selector:
            "JSXElement[openingElement.name.name=/^(Button|button)$/]:has(JSXAttribute[name.name='className'] > Literal[value=/(^|\\s)size-[89]($|\\s)/]):not(:has(Literal[value=/hit-area/]))",
          message:
            'A size-8/size-9 element that is interactive needs a 44px touch target: add the `hit-area` utility (raw <button>) or use <Button size="icon"|"icon-sm">. See docs/design-system.md → Accessibility baseline. If this element is purely decorative/non-interactive, add `// eslint-disable-next-line no-restricted-syntax -- touch-target-ok: <reason>`.',
        },
      ],
    },
  },
  {
    // Luma monochrome guardrail. The app is monochrome — red (--destructive) is the only
    // chromatic hue; per-category / per-loyalty-card data colors are the one approved
    // exception (their palette files are exempt below, as are the out-of-scope Price
    // Tracker + Admin screens). This blocks the two regression patterns the redesign
    // audit actually found: (1) re-introducing legacy palette hexes, (2) `oklch(from
    // var(--…))` expressions that re-inject chroma onto neutralized tokens (rendered
    // pink once). For a deliberate exception add
    // `// eslint-disable-next-line no-restricted-syntax -- chroma-ok: <reason>`.
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/components/categories/primitives.tsx', // approved: category color palette
      'src/components/loyalty-cards/format.ts', // approved: card color presets
      'src/pages/items/**', // out of scope: Price Tracker
      'src/components/items/**',
      'src/pages/admin/**', // low-priority admin charts
    ],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/oklch\\(from var\\(--/i]",
          message:
            'Never re-inject chroma onto a neutralized token (`oklch(from var(--…) L C h)` rendered pink once). Use --destructive for danger or the neutral tiers. Deliberate exception: `// eslint-disable-next-line no-restricted-syntax -- chroma-ok: <reason>`.',
        },
        {
          selector:
            'Literal[value=/#(0ea5e9|8b5cf6|06b6d4|10b981|22c55e|34d399|16a34a|059669|f59e0b|d97706|ec4899|f43f5e|6366f1|3b82f6|14b8a6|f97316|a855f7|eab308|08a373)/i]',
          message:
            'Luma is monochrome — red (--destructive) is the only chromatic hue. Legacy palette hexes are retired; use tokens (or the per-category/per-card data color, which flows from data, not literals). Deliberate exception: `// eslint-disable-next-line no-restricted-syntax -- chroma-ok: <reason>`.',
        },
      ],
    },
  },
  {
    // Steer app form inputs to the shared 40px <Input> (@/components/ui/input).
    // The glass <Field>/<PasswordField> are the 50px AUTH-only inputs — using them in
    // app form modals creates the height inconsistency this rule prevents (the
    // warranty/category/loyalty bug). Other glass exports (Alert, IconTile, Badge…)
    // stay allowed. The glass layer itself and auth screens are exempt (overrides below).
    // Paired with the PostToolUse hook (.claude/hooks/no-glass-field.sh).
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/components/glass/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/components/glass/glass',
              importNames: ['Field', 'PasswordField'],
              message:
                'The glass <Field>/<PasswordField> are the 50px AUTH-only inputs. App forms must use the shared 40px <Input> from @/components/ui/input + a `fieldLabel` label (see receipts/receipt-modal.tsx) — this keeps every form modal at one height. Only src/pages/auth and src/components/auth may use the glass field.',
            },
          ],
        },
      ],
    },
  },
  {
    // Auth screens legitimately use the tall glass <Field>/<PasswordField>.
    files: ['src/pages/auth/**', 'src/components/auth/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // Grandfathered files with pre-existing raw <button> (mostly legitimate bespoke
    // controls — scanners, lightbox toolbars, table kebabs, filter chips). Downgraded
    // to `warn` so the baseline stays green; migrate + delete entries over time.
    // NOTE: the touch-target selector is re-listed here as `warn` too, so these files
    // keep both raw-button and touch-target findings at warn (not error).
    files: [
      'src/components/admin/announcements-table.tsx',
      'src/components/admin/ratings-table.tsx',
      'src/components/admin/users-table.tsx',
      'src/components/announcements/announcement-banner.tsx',
      'src/components/auth/google-sign-in-button.tsx',
      'src/components/categories/category-modal.tsx',
      'src/components/coach/coach-card.tsx',
      'src/components/dashboard/category-budget-progress.tsx',
      'src/components/dashboard/upcoming-recurring.tsx',
      'src/components/dashboard/widget-wrapper.tsx',
      'src/components/groups/group-receipts-table.tsx',
      'src/components/layout/app-sidebar.tsx',
      'src/components/layout/fab-action-sheet.tsx',
      'src/components/layout/mobile-tab-bar.tsx',
      'src/components/layout/theme-segmented.tsx',
      'src/components/loyalty-cards/loyalty-card-scanner.tsx',
      'src/components/onboarding/onboarding-modal.tsx',
      'src/components/receipts/add-menu.tsx',
      'src/components/receipts/assign-category-dialog.tsx',
      'src/components/receipts/bulk-bar.tsx',
      'src/components/receipts/expenses-mobile-header.tsx',
      'src/components/receipts/expenses-summary.tsx',
      'src/components/receipts/filter-chip.tsx',
      'src/components/receipts/filter-rail.tsx',
      'src/components/receipts/qr-scanner.tsx',
      'src/components/receipts/receipt-modal.tsx',
      'src/components/receipts/row-kebab.tsx',
      'src/components/receipts/template-selector-modal.tsx',
      'src/components/recurring-expenses/recurring-expense-modal.tsx',
      'src/components/warranties/warranty-gallery-modal.tsx',
      'src/components/warranties/warranty-modal.tsx',
      'src/pages/auth/sign-in.tsx',
      'src/pages/dashboard/index.tsx',
      'src/pages/groups/[[]id[]].tsx',
      'src/pages/recurring-expenses/index.tsx',
    ],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "JSXOpeningElement[name.name='button']",
          message:
            'Use the shared <Button> from @/components/ui/button instead of a raw <button> (variants: brand/glass/destructive-soft/etc.). Raw <button> belongs only in the primitive layer (components/ui, components/glass, *primitives.tsx), or add `// eslint-disable-next-line no-restricted-syntax -- raw-button-ok: <reason>`.',
        },
        {
          selector:
            "JSXElement[openingElement.name.name=/^(Button|button)$/]:has(JSXAttribute[name.name='className'] > Literal[value=/(^|\\s)size-[89]($|\\s)/]):not(:has(Literal[value=/hit-area/]))",
          message:
            'A size-8/size-9 element that is interactive needs a 44px touch target: add the `hit-area` utility (raw <button>) or use <Button size="icon"|"icon-sm">. See docs/design-system.md → Accessibility baseline. If this element is purely decorative/non-interactive, add `// eslint-disable-next-line no-restricted-syntax -- touch-target-ok: <reason>`.',
        },
      ],
    },
  },
])
