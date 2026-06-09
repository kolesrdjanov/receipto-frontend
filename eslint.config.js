import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

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
      ],
    },
  },
])
