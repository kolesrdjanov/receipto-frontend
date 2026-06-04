# Expenses "Glass" — Chunk 6: Scan flow restyle (`qr-scanner.tsx`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development) to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Restyle the 674-line `qr-scanner.tsx` from a shadcn `Dialog` into the Glass scan overlay — a centered frosted **modal on desktop / bottom sheet on mobile** (via `GlassDialog`) — across every `scan-flow` state (live camera + finder + torch, processing, retrying-portal, terminal error, camera-slow, loading), **keeping 100% of the camera/torch/device/retry logic untouched**.

**Architecture:** This is a **presentation-only rewrite of one component's `return (...)` JSX** plus its import block. Everything above the `return` (all state, refs, `useMemo`/`useCallback`/`useEffect`, every handler — `toggleTorch`, `resetCameraRuntime`, the torch/video-track polling effect, the scanner-load effect, `handleScan`/`handleError`/`handleClose`/`handleTryAgain`/`handleGalleryFallback`/`handleCameraSelectionChange`, the `cameraConstraints` memo, all the `*Ref`s) stays **byte-for-byte identical**. The `Dialog`/`DialogContent` shell becomes a `GlassDialog`; the 350px `bg-muted` viewport becomes the black `.ex-camera` viewport with a finder reticle + hint + translucent torch; the four overlay states (processing / retrying / terminal-error / camera-slow / loading) are restyled as white-on-black overlays inside that viewport; the camera-select `Select` trigger is restyled to the `.ex-camsel` glass field; the privacy notice becomes a glass info tip; Cancel moves to the `GlassDialog` footer.

**Tech Stack:** React 19, TypeScript (strict), Tailwind v4, `GlassDialog` (Radix Dialog + Framer Motion, mobile-sheet/desktop-modal), shadcn `Select`, `@yudiel/react-qr-scanner` (`Scanner` + `useDevices`), lucide-react, i18next.

**Companion spec:** `docs/superpowers/specs/2026-06-04-expenses-glass-redesign-design.md` (Chunk 6). **Master plan:** `docs/superpowers/plans/2026-06-04-expenses-glass-redesign.md` (Chunk 6). **Reuses:** `components/glass/glass-dialog.tsx` (`GlassDialog` — the established overlay shell, used by every redesigned overlay this cycle). **Data flow (unchanged):** `use-receipt-scanner.tsx` owns the flow — it renders `<QrScanner>` inside `scannerModals` with `open/onOpenChange/onScan/onGalleryFallback/flowState/retryMeta/errorMessage/onRetryNow/onCancelRetry/onFlowStateChange`, and owns the gallery decode + the gallery error **Sonner toasts** (`gallery.noQrFound/invalidImage/error`). **Handoff:** `~/Downloads/design_handoff_expenses/ExpensesStates.jsx` (`ScanSheet` with `state = scan|processing|retry|error`, `ScanViewport`) + the inline `.ex-camera / .ex-finder / .ex-cam-hint / .ex-torch / .ex-camsel / .ex-cambtn / .ex-cam-err / .ex-bsheet / .ex-sheet-foot` CSS in `Expenses.html`.

---

## Decisions (settled — flagged for visibility, not re-litigation)

- **D1 — Shell = `GlassDialog`, not a hand-rolled sheet.** Matches every other redesigned overlay this cycle (mobile bottom sheet / desktop centered modal over a dim+blur scrim, Esc/scrim/X close, focus trap, reduced-motion). The camera viewport + states render in the scrollable body; Cancel in the pinned footer; the camera icon + "Scan" + sub in the `header` slot. (The loyalty-cards full-bleed dark scanner is a *different* pattern for a different screen — the Expenses handoff explicitly shows a contained glass sheet/modal with a 230px viewport, so `GlassDialog` is correct here.)
- **D2 — Logic is frozen; only JSX + imports change.** The camera permission polling, 10s `CAMERA_TIMEOUT_MS`, torch `applyConstraints`, `useSimpleConstraints` overconstrained-fallback, `scannerKey` remounts, duplicate-scan guards, recoverable-vs-terminal error handling, and the `onFlowStateChange` transitions are all preserved verbatim. The only non-JSX edits are the import block and two module-level class-string consts.
- **D3 — Non-fiscal QR stays a recoverable *inline notice*, not a terminal error viewport.** The handoff's red-circle "error" state uses the non-fiscal copy as its *example*, but in the real flow a non-fiscal scan is **recoverable** (`handleScan` → `setNotice(err.message)` → returns to scanning) and a gallery non-fiscal is a **toast** — neither reaches `activeError`. Changing that is a logic change (forbidden, D2). Resolution: the **terminal-error viewport** (`activeError`: camera-access failures + `failed_terminal` create errors) gets the red-circle `.ex-cam-err` treatment; the **recoverable inline notice** (`inlineNotice`, incl. live non-fiscal + `cameraFallbackApplied`) is restyled as a small glass notice pill above the viewport. Both surfaces are reglassed; behavior is unchanged.
- **D4 — Torch "unsupported" info is preserved but de-cluttered.** The torch button stays always-visible (disabled when `!torchSupported`, `title` explains). The verbose `torchUnsupportedHint` moves from an overlay pill *on* the black viewport to a small muted line *below* the viewport (only when a scanner is mounted and torch is unsupported) — keeps the info, frees the camera area (the handoff viewport is only 230px).
- **D5 — Gallery errors need no work here.** `gallery.noQrFound/invalidImage/error` are Sonner toasts emitted by `use-receipt-scanner.tsx` (global toast styling) — there is no scanner surface to restyle for them. The gallery *entry* is a hidden `<input>` in the hook (no presentation). So `use-receipt-scanner.tsx` is **not modified** this chunk.
- **D6 — One net-new i18n key:** `receipts.qrScanner.scanHint` ("Point at the receipt QR code") for the on-camera `.ex-cam-hint`. Every other string reuses an existing `qrScanner.*`/`gallery.*`/`common.*` key. The header sub switches from `scanDescription` ("Choose scan mode…", stale — mode choice/PFR was dropped) to the existing **`qrScanner.description`** ("Point your camera at the receipt QR code to scan it.").
- **D7 — `GlassDialog` close wiring preserves the submitting guard.** `onOpenChange={(next) => { if (!next) handleClose() }}` and `dismissibleOnOverlay={!isSubmitting}`. `handleClose` already early-returns while `isSubmitting`, so scrim/Esc/X/Cancel can't close mid-submit; the parent stays `open` because `onOpenChange(false)` is never forwarded. Cancel button calls `handleClose` directly.

---

## File structure

| File | Action | Responsibility |
|---|---|---|
| `src/components/receipts/qr-scanner.tsx` | modify | Swap `Dialog`→`GlassDialog` shell; reglass header / camera-select / viewport+finder+torch / 5 state overlays / privacy tip / footer. **Logic above `return` unchanged.** |
| `src/i18n/en.json` + `sr.json` | modify | +1 key: `receipts.qrScanner.scanHint` |
| `src/pages/__chunk6-preview.tsx` | create→delete | throwaway harness (flowState toggle), removed before commit |
| `src/routes.tsx` | modify→revert | temporary public harness route (revert via atomic `node` if Edit races) |

No component-unit-test harness (Playwright E2E only). Per-step verify = `npm run build` + preview on port **5180 `--strictPort`** + screenshots.

This is **one component** → not split. Tasks: i18n → import/const prep → JSX rewrite → build/verify → commit.

---

## Task 1 — i18n key (net-new, en + sr)

**Files:** `src/i18n/en.json`, `src/i18n/sr.json`

- [ ] **Step 1:** In **both** files, inside `receipts.qrScanner`, add a `scanHint` key (place it right after `scanDescription`):
  - en: `"scanHint": "Point at the receipt QR code",`
  - sr: `"scanHint": "Usmerite na QR kôd računa",`
  Find the anchor with `grep -n '"scanDescription"' src/i18n/en.json src/i18n/sr.json` and insert after it.
- [ ] **Step 2:** Validate: `node -e "require('./src/i18n/en.json'); require('./src/i18n/sr.json'); console.log('ok')"` → `ok`.

> Shared-branch i18n hazard (recurred every prior chunk — a parallel session added a top-level `"fab"` block to these files mid-C5): before staging i18n at Task 5, run `git diff src/i18n/en.json` and stage **only your `scanHint` hunk** via `git diff <file> | awk 'BEGIN{h=0} /^@@/{h++} {print}'` inspection → if foreign hunks are present, commit code first and apply just your hunk with `git apply --cached --recount`. Validate the staged blob parses.

---

## Task 2 — `qr-scanner.tsx`: imports + module constants

**Files:** modify `src/components/receipts/qr-scanner.tsx`

- [ ] **Step 1: Swap the shell import.** Replace the `Dialog` import block (lines 3-9):
  ```tsx
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog'
  ```
  with:
  ```tsx
  import { GlassDialog } from '@/components/glass/glass-dialog'
  ```
  (Keep the `Button` and `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue` imports as-is.)

- [ ] **Step 2: Adjust the lucide import** (line ~18-30) — drop `Info`, add `ShieldCheck`:
  ```tsx
  import {
    Camera,
    X,
    Flashlight,
    FlashlightOff,
    Loader2,
    ImageIcon,
    CameraOff,
    RefreshCw,
    RotateCcw,
    Smartphone,
    ShieldCheck,
  } from 'lucide-react'
  ```

- [ ] **Step 3: Add two viewport-button class consts** next to the existing module constants (after `const CAMERA_SELECTION_KEY = 'receipto-camera-selection'`, ~line 75):
  ```tsx
  // Glass camera-overlay buttons (white-on-black viewport)
  const CAMBTN = 'inline-flex h-8 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-40 disabled:pointer-events-none'
  const CAMBTN_SOLID = 'inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-[12px] font-semibold text-[#111] transition-colors hover:bg-white/90'
  ```

- [ ] **Step 4:** `npm run build` → expect errors only about the now-unused old JSX (`Dialog`, `Info`) until Task 3 lands; if building between tasks, it's fine to proceed to Task 3 first. (Recommended: do Task 3 before building.)

---

## Task 3 — `qr-scanner.tsx`: rewrite the `return (...)` JSX

**Files:** modify `src/components/receipts/qr-scanner.tsx` — replace the **entire `return (...)` block** (currently lines ~441-674, from `return (` through the final `)` before the closing `}`). **Do not touch anything above `return (`.**

- [ ] **Step 1: Replace the return block** with:

```tsx
  return (
    <GlassDialog
      open={open}
      onOpenChange={(next) => { if (!next) handleClose() }}
      title={t('receipts.qrScanner.scanTitle')}
      desktopWidth={460}
      dismissibleOnOverlay={!isSubmitting}
      header={
        <div>
          <div className="flex items-center gap-2">
            <Camera className="size-5 text-primary" />
            <h2 className="t-h3">{t('receipts.qrScanner.scanTitle')}</h2>
          </div>
          <p className="t-sm mt-1 text-muted-foreground">{t('receipts.qrScanner.description')}</p>
        </div>
      }
      footer={
        <div className="flex md:justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full rounded-xl md:w-auto md:min-w-[120px]"
          >
            {t('common.cancel')}
          </Button>
        </div>
      }
    >
      {/* Camera selection */}
      <Select value={cameraSelection} onValueChange={handleCameraSelectionChange}>
        <SelectTrigger className="mb-3 h-10 gap-2 rounded-lg border-border bg-bg-subtle px-3 text-[13px] font-semibold text-fg-2">
          <Smartphone className="size-[15px] shrink-0 text-muted-foreground" />
          <SelectValue placeholder={t('receipts.qrScanner.cameraAuto')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">{t('receipts.qrScanner.cameraAuto')}</SelectItem>
          <SelectItem value="rear">{t('receipts.qrScanner.cameraRear')}</SelectItem>
          <SelectItem value="front">{t('receipts.qrScanner.cameraFront')}</SelectItem>
          {devices.map((device) => (
            <SelectItem key={device.deviceId} value={`device:${device.deviceId}`}>
              {device.label || t('receipts.qrScanner.cameraDeviceFallback')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Recoverable inline notice (non-fiscal QR / camera fallback) */}
      {inlineNotice && (
        <p className="mb-3 rounded-lg bg-bg-subtle px-3 py-2 text-xs text-muted-foreground">
          {inlineNotice}
        </p>
      )}

      {/* Camera viewport */}
      <div
        ref={containerRef}
        className="relative grid h-[240px] w-full place-items-center overflow-hidden rounded-2xl bg-[#0b0b0c]"
      >
        {showBlockingState ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 p-5 text-center">
            <Loader2 className="size-9 animate-spin text-white" />
            {isRetrying ? (
              <>
                <p className="text-[15px] font-semibold text-white">{t('receipts.qrScanner.retryingTitle')}</p>
                <p className="max-w-[260px] text-[12.5px] text-white/70">
                  {retryMeta
                    ? t('receipts.qrScanner.retryingDescription', { attempt: retryMeta.attempt, max: retryMeta.maxAttempts })
                    : t('receipts.qrScanner.retryingGeneric')}
                </p>
                <p className="max-w-[260px] text-[11px] text-white/55">{t('receipts.qrScanner.portalDelayHint')}</p>
                <div className="mt-1.5 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={onRetryNow} disabled={!onRetryNow} className={CAMBTN}>
                    <RefreshCw className="size-3.5" />
                    {t('receipts.qrScanner.retryNow')}
                  </button>
                  <button type="button" onClick={onCancelRetry} disabled={!onCancelRetry} className={CAMBTN}>
                    <RotateCcw className="size-3.5" />
                    {t('receipts.qrScanner.cancelRetry')}
                  </button>
                  {onGalleryFallback && (
                    <button type="button" onClick={handleGalleryFallback} className={CAMBTN_SOLID}>
                      <ImageIcon className="size-3.5" />
                      {t('receipts.qrScanner.useGallery')}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-[15px] font-semibold text-white">{t('receipts.qrScanner.processing')}</p>
                <p className="max-w-[260px] text-[12.5px] text-white/70">{t('receipts.qrScanner.processingDescription')}</p>
                <p className="max-w-[260px] text-[11px] text-white/55">{t('receipts.qrScanner.portalDelayHint')}</p>
              </>
            )}
          </div>
        ) : activeError ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-5 text-center">
            <div className="grid size-[54px] place-items-center rounded-full bg-destructive">
              <X className="size-6 text-white" />
            </div>
            <p className="max-w-[260px] text-[13.5px] text-white">{activeError}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={handleTryAgain} className={CAMBTN}>
                {t('receipts.qrScanner.tryAgain')}
              </button>
              {onGalleryFallback && (
                <button type="button" onClick={handleGalleryFallback} className={CAMBTN_SOLID}>
                  <ImageIcon className="size-3.5" />
                  {t('receipts.qrScanner.useGallery')}
                </button>
              )}
            </div>
          </div>
        ) : isLoading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 p-5 text-center">
            {cameraTimedOut ? (
              <>
                <CameraOff className="size-9 text-white/80" />
                <p className="text-[14px] font-semibold text-white">{t('receipts.qrScanner.cameraSlowTitle')}</p>
                <p className="max-w-[260px] text-[12px] text-white/65">{t('receipts.qrScanner.cameraSlowDescription')}</p>
                <div className="mt-1 flex flex-wrap justify-center gap-2">
                  <button type="button" onClick={handleTryAgain} className={CAMBTN}>
                    {t('receipts.qrScanner.tryAgain')}
                  </button>
                  {onGalleryFallback && (
                    <button type="button" onClick={handleGalleryFallback} className={CAMBTN_SOLID}>
                      <ImageIcon className="size-3.5" />
                      {t('receipts.qrScanner.useGallery')}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <Loader2 className="size-8 animate-spin text-white/80" />
                <p className="text-[12.5px] text-white/70">{t('common.loading')}</p>
              </>
            )}
          </div>
        ) : null}

        {/* Live scanner + finder reticle + hint + torch */}
        {open && ScannerComponent && !activeError && (
          <>
            <ScannerComponent
              key={scannerKey}
              onScan={handleScan}
              onError={handleError}
              scanDelay={250}
              formats={['qr_code']}
              constraints={cameraConstraints}
              styles={{
                container: { width: '100%', height: '240px' },
                video: { width: '100%', height: '100%', objectFit: 'cover' },
              }}
              components={{ finder: false }}
            />

            {!showBlockingState && !isLoading && (
              <>
                <div className="pointer-events-none absolute inset-0 z-[5] grid place-items-center">
                  <div className="size-[148px] rounded-[18px] border-[3px] border-white/85" />
                </div>
                <p className="pointer-events-none absolute inset-x-0 bottom-4 z-[5] text-center text-[12.5px] text-white/80">
                  {t('receipts.qrScanner.scanHint')}
                </p>
                <button
                  type="button"
                  onClick={() => toggleTorch(!torchEnabled)}
                  disabled={!torchSupported}
                  title={
                    torchSupported
                      ? t(torchEnabled ? 'receipts.qrScanner.torchOff' : 'receipts.qrScanner.torchOn')
                      : t('receipts.qrScanner.torchUnsupported')
                  }
                  className="absolute bottom-3 right-3 z-10 grid size-[38px] place-items-center rounded-[10px] bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {torchEnabled ? <FlashlightOff className="size-[18px]" /> : <Flashlight className="size-[18px]" />}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Torch-unsupported hint (below the viewport; preserves the explicit-unsupported UX, D4) */}
      {open && ScannerComponent && !activeError && !showBlockingState && !isLoading && !torchSupported && (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          {t('receipts.qrScanner.torchUnsupportedHint')}
        </p>
      )}

      {/* Privacy notice */}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-bg-subtle px-3.5 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-[12.5px] leading-[1.45] text-muted-foreground">{t('receipts.qrScanner.privacyNotice')}</p>
      </div>
    </GlassDialog>
  )
```

- [ ] **Step 2:** `npm run build` → PASS. Resolve any tsc-strict unused-symbol errors (expect: the old `Dialog*`/`Info` symbols are gone; `Camera`/`X`/`ShieldCheck`/`Smartphone`/all torch+state glyphs are used; `Button`/`Select*` still used). Confirm no reference to `DialogContent`/`DialogHeader`/`DialogTitle`/`DialogDescription`/`Info` remains: `grep -nE "DialogContent|DialogHeader|DialogTitle|DialogDescription|[^a-zA-Z]Info[^a-zA-Z]" src/components/receipts/qr-scanner.tsx` → no matches.

---

## Task 4 — Build + verify (throwaway harness)

- [ ] **Step 1:** `npm run build` → PASS.
- [ ] **Step 2: Throwaway harness** `src/pages/__chunk6-preview.tsx` (public) — renders the real `<QrScanner open>` with a `flowState` toggle so the prop-driven overlays (processing / retrying / error) render deterministically **without a camera** (they're `absolute inset-0 z-10` and derive from the `flowState`/`errorMessage`/`retryMeta` props):
  ```tsx
  import { useState } from 'react'
  import { QrScanner } from '@/components/receipts/qr-scanner'
  import type { ScanFlowState, RetryMeta } from '@/hooks/receipts/scan-flow'

  const STATES: ScanFlowState[] = ['scanning', 'submitting', 'retrying_portal', 'failed_terminal']
  const RETRY: RetryMeta = { attempt: 2, maxAttempts: 7, nextDelayMs: 5000, startedAt: 0 }

  export default function Chunk6Preview() {
    const [flow, setFlow] = useState<ScanFlowState>('submitting')
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {STATES.map((s) => (
            <button
              key={s}
              className="rounded-full border px-3 py-1.5 text-sm"
              onClick={() => setFlow(s)}
            >
              {s}{flow === s ? ' ✓' : ''}
            </button>
          ))}
        </div>
        <QrScanner
          open
          onOpenChange={() => {}}
          onScan={async () => {}}
          onGalleryFallback={() => {}}
          flowState={flow}
          retryMeta={flow === 'retrying_portal' ? RETRY : null}
          errorMessage={flow === 'failed_terminal' ? 'This is not a Serbian fiscal receipt QR code.' : null}
          onRetryNow={() => {}}
          onCancelRetry={() => {}}
          onFlowStateChange={() => {}}
        />
      </div>
    )
  }
  ```
  Add a temporary **public** route in `src/routes.tsx`: `const Chunk6Preview = lazy(() => import('./pages/__chunk6-preview'))` + `{ path: '/__chunk6-preview', element: <Chunk6Preview /> }` as a sibling of `/sign-in`.
  > `routes.tsx` is edited by parallel sessions → if Edit hits a "modified since read" race, add/revert the route via an atomic `node` read-replace-write, not Edit.

- [ ] **Step 3: Build + preview** on port **5180 `--strictPort`**. Screenshot `/__chunk6-preview`, toggling the four buttons:
  - **Desktop (≥1024px, 1280×860):** the glass **modal** shell (camera icon + "Scan" + sub, X, camera-select `.ex-camsel` field, black viewport, privacy tip, Cancel footer) with: **`submitting`** → white spinner + "Processing receipt…" + description + 2-min hint; **`retrying_portal`** → "Waiting for fiscal server" + "Retrying attempt 2 / 7" + hint + Retry now / Cancel retry / Use gallery (`.ex-cambtn`, Gallery solid); **`failed_terminal`** → red `.ex-cam-err` circle + message + Try again / Use gallery. Light + **dark** (class-based: `document.documentElement.classList.add('dark')` or set `receipto-settings.state.theme='dark'` in localStorage + reload — `preview_resize colorScheme` does NOT flip it).
  - **Mobile (390×844):** same three states as a glass **bottom sheet** (drag handle, full-width Cancel) — after `preview_resize`, dispatch a `resize` event so `GlassDialog` switches modal→sheet. Light + dark.
  - **Live camera (best-effort):** the `scanning`/finder + camera-slow paths need `getUserMedia`; the preview Chrome usually has no camera → the viewport shows the **loading** then (after 10s) the **camera-slow** overlay (screenshot it — it's a real state). If a fake camera *is* available, screenshot the finder reticle + hint + torch. Note in the verification summary that the live finder is best-confirmed on a real device (logic unchanged from production).
  - Check `preview_console_logs level=error` → no errors (a benign `getUserMedia`/permissions message from the camera attempt is expected, not a React error).

- [ ] **Step 4: Remove the harness** — delete `src/pages/__chunk6-preview.tsx`; revert the route + import in `src/routes.tsx`. `grep -rn "__chunk6-preview\|Chunk6Preview" src/` → no matches.
- [ ] **Step 5:** `npm run build` → PASS (after harness removal). Confirm whole-tree build (mirrors the pre-push hook): re-run `npm run build`.

---

## Task 5 — Commit + push — FAST (shared branch)

- [ ] **Step 1:** Stage **explicit paths only** (never `git add -A`):
  ```bash
  git add src/components/receipts/qr-scanner.tsx \
          docs/superpowers/plans/2026-06-04-expenses-glass-chunk6-scan.md
  ```
  Then handle i18n per the Task-1 hazard note: if `git diff src/i18n/en.json` shows only your `scanHint` hunk, `git add src/i18n/en.json src/i18n/sr.json`; if foreign hunks (e.g. `fab`) are present, commit the code first and add only your hunk via `git apply --cached --recount` of a filtered patch. Confirm with `git status --short` + `git show :src/i18n/en.json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const o=JSON.parse(s);console.log('scanHint:',o.receipts.qrScanner.scanHint)})"`.
- [ ] **Step 2:** `npm run build` once more (whole working tree — the pre-push hook builds everything; another session's broken WIP can block the push).
- [ ] **Step 3:** Commit: `feat(receipts): glass scan flow (camera/processing/retry/error)`. End the message with the `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer.
- [ ] **Step 4:** `git push origin feature/redesign-main-branch`. Push immediately.

---

## Self-review

- **Spec coverage (Chunk 6):** glass shell sheet(mobile)/modal(desktop) ✓T3,D1; header camera icon + "Scan" + sub + privacy tip + Cancel footer ✓T3; camera viewport `.ex-camera` + finder reticle + `.ex-cam-hint` + `.ex-torch` ✓T3; camera-select Auto/Rear/Front/devices restyled `.ex-camsel`, persistence + logic unchanged ✓T3,D2; `processing` state ✓T3; `retrying_portal` state with attempt/max from `retryMeta` + Retry now/Cancel/Gallery + portalDelayHint ✓T3; terminal-error red-circle + Try again/Use gallery ✓T3,D3; camera-slow + loading ✓T3; recoverable inline notice reglassed ✓T3,D3; torch-unsupported preserved ✓T3,D4; wired to existing `scan-flow` states + `retryMeta`, QR validation + 2-min portal retry intact ✓D2; gallery errors are toasts, no surface here ✓D5.
- **Logic-frozen check:** the only edits are imports (Task 2 S1-2), two consts (Task 2 S3), and the `return` JSX (Task 3). Every `use*`/ref/handler/effect/memo above `return` is untouched — re-confirm with `git diff` that nothing between line ~95 (`export function QrScanner`) and `return (` changed except the const block near line 75.
- **Placeholder scan:** the only line-range markers (Task 2/3) point at existing code to swap/replace, not invent; the full new JSX is provided.
- **Type consistency:** props (`open/onOpenChange/onScan/onGalleryFallback/flowState/retryMeta/errorMessage/onCancelRetry/onRetryNow/onFlowStateChange`) and the derived `isSubmitting/isRetrying/showBlockingState/activeError`, plus `cameraSelection/handleCameraSelectionChange/devices/containerRef/ScannerComponent/scannerKey/cameraConstraints/handleScan/handleError/toggleTorch/torchEnabled/torchSupported/handleTryAgain/handleGalleryFallback/handleClose/inlineNotice/isLoading/cameraTimedOut` are all referenced exactly as defined above the return. `GlassDialog` props (`open/onOpenChange/title/header/footer/desktopWidth/dismissibleOnOverlay`) match its interface; `ShieldCheck` added, `Info`/`Dialog*` removed. `receipts.qrScanner.scanHint` added in T1.
- **i18n:** 1 net-new key (`scanHint`, en+sr); header sub switched to existing `qrScanner.description`; everything else reuses existing `qrScanner.*`/`gallery.*`/`common.*`. Shared-branch staging caution carried in T1/T5.
- **E2E:** the Playwright suite is already out of sync with this branch (C1-C5 deferred the refresh); Chunk 6 changes no `data-testid`s the suite asserts (the scanner has none), so no new drift. Suite refresh stays deferred to the Chunk 8 pass.
```
