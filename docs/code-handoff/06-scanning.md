# 06 — Scanning Receipts

The hero flow. Users capture a Serbian fiscal receipt QR code with the camera (or pick an image from the gallery, or type the PFR manually), the backend scrapes the fiscal portal (`suf.purs.gov.rs`), and the receipt is created with `status: 'scraped'` and rich `scrapedData`.

This is the single most complex feature in the app. Read this whole doc before coding.

Web reference:

- `src/hooks/receipts/use-receipt-scanner.tsx` (667 lines — the state machine)
- `src/components/receipts/qr-scanner.tsx` (674 lines — the UI)
- `src/components/receipts/pfr-entry-modal.tsx` (PFR manual entry)

---

## Entry points

Three buttons:

| Entry              | Web hook helper          | RN screen / sheet                                 |
| ------------------ | ------------------------ | ------------------------------------------------- |
| Scan with camera   | `openQrScanner()`        | Full-screen camera modal                          |
| Pick from gallery  | `openGalleryScanner()`   | OS image picker, then "Processing…" screen        |
| Manual PFR entry   | `openPfrEntry()`         | PFR entry form (see `03-receipts.md` § "PFR entry") |

All three converge on the same final step: `POST /receipts` with either `{ qrCodeUrl }` or `{ pfrData }`. The retry/backoff logic is identical.

---

## The fiscal QR URL

A valid fiscal receipt QR code decodes to an HTTPS URL of the form:

```
https://suf.purs.gov.rs/v/?vl=<encoded-payload>
```

Validation rules (see `normalizeFiscalQrUrl` in `use-receipt-scanner.tsx:46–58`):

- Protocol must be `https://`
- Hostname must be exactly `suf.purs.gov.rs`

If the scanned value doesn't match, throw a `RecoverableScanError('NON_FISCAL_QR')`, show an inline toast ("This isn't a fiscal receipt QR code"), and return to scanning.

---

## The state machine

`ScanFlowState` enum:

```
'idle' | 'camera_loading' | 'scanning' | 'submitting' | 'retrying_portal' | 'failed_terminal' | 'success'
```

Transitions:

```
idle ──open──▶ camera_loading ──video ready──▶ scanning ──QR detected──▶ submitting
                                                                              │
                              ┌───────────────────────────────────────────────┤
                              ▼                                               │
                          success                                             │
                                                                              │
                              ┌───────────────────────────────────────────────┤
                              ▼                                               │
                       (transient err)                                        │
                              │                                               │
                              ▼                                               │
                       retrying_portal ──delay elapsed──▶ submitting ─────────┘
                              │
                       (cancel / all attempts exhausted)
                              │
                              ▼
                       failed_terminal
```

The user can:

- Cancel during `retrying_portal` (button "Cancel Retry")
- Force-retry during `retrying_portal` (button "Try Now")
- Restart after `failed_terminal` (button "Try again" → back to `scanning`, or "Use Gallery" → gallery flow)

---

## The retry loop (critical)

Constants (`use-receipt-scanner.tsx:31`):

```ts
const RETRY_DELAYS_MS = [0, 5_000, 10_000, 15_000, 20_000, 30_000, 40_000] // 7 attempts
```

Algorithm (`createReceiptWithRetry`):

```ts
for (let attempt = 1; attempt <= 7; attempt++) {
  const delay = RETRY_DELAYS_MS[attempt - 1]
  if (delay > 0) {
    setState('retrying_portal', { attempt, maxAttempts: 7, nextDelayMs: delay, startedAt: Date.now() })
    await waitWithCancelAndForceRetry(delay)  // resolves on delay elapsed, force-retry, or cancel
  } else {
    setState('submitting')
  }
  try {
    const receipt = await api.post('/receipts', { qrCodeUrl })
    setState('success')
    return receipt
  } catch (err) {
    if (isTransientPortalError(err) && attempt < 7) continue   // retry
    throw err                                                  // permanent or out of attempts
  }
}
```

**`isTransientPortalError`** (`use-receipt-scanner.tsx:60–95`) returns true if:

- `status` is `404`, `429`, any `5xx`, or `undefined` (network error)
- OR the message matches `/temporarily unavailable|timeout|unable to reach fiscal portal|network|failed to fetch/i`

The fiscal portal regularly returns 404 / 5xx for receipts that are technically valid but not yet indexed — hence the long retry tail. The portal usually catches up within 60–90s.

**`waitWithCancelAndForceRetry`** (lines 328–353): returns a Promise that resolves when **any of** the following:

- The timer elapses.
- The user clicks "Try Now" (resolve immediately).
- The user clicks "Cancel" (reject with `RecoverableScanError('RETRY_CANCELLED')`).

Implement this with `AbortController` + a `Promise.race`.

---

## Camera UI

Full-screen modal:

- **Top bar** (over the video, dark overlay): close X, title ("Scan QR code"), camera-picker icon (opens a sheet to pick rear/front/specific device).
- **Video preview** fills the entire screen.
- **Targeting reticle**: a centered square (~70% of the shorter side), corners highlighted, with a subtle scan-line animation. Outside the reticle is dimmed (50% black overlay), creating a "viewfinder" effect.
- **Bottom controls**: 
  - "Use Gallery" button (left)
  - Cancel (right)
  - Optional: torch toggle (bottom-right corner) — only if the device's camera supports it. On web this checks `MediaStreamTrack.getCapabilities().torch`. On RN, use the camera lib's torch prop.
- **Tip text** below the reticle: "Point your camera at the receipt's QR code". On scan timeout (10s of `camera_loading` without a track), show "Camera is taking a while…" and a "Switch camera" button.

### State overlays

These overlay the camera (or replace it when the camera is no longer needed):

**`camera_loading`**: spinner centered, "Loading camera…". After 10s show fallback options ("Use Gallery", "Try different camera").

**`scanning`**: just the camera view, no overlay. This is the resting state.

**`submitting`**: spinner over a dimmed background, "Processing receipt…". No cancel button — let the first attempt run.

**`retrying_portal`**: a center card showing:

- Spinner
- "The fiscal portal is busy" (or `t('scan.retry.title')`)
- `Retry 2 / 7` indicator (current attempt / max).
- A circular countdown timer (showing seconds until next attempt).
- Two buttons: **Try Now** (primary), **Cancel Retry** (ghost).
- Subtle copy: "We'll keep trying for ~2 minutes."

**`failed_terminal`**: red X icon, error message (`error.message`), and buttons: "Try Again", "Use Gallery", "Manual PFR entry", "Close".

**`success`**: brief checkmark animation, then close the modal and navigate to the new receipt's detail screen (the receipt is in cache via `setQueryData` for the optimistic UX).

---

## Gallery flow

Triggered by "Use Gallery". Steps:

1. Open the OS image picker (`expo-image-picker` / `react-native-image-picker`). Accept image MIME types.
2. **HEIC/HEIF handling** (iOS): if the file is HEIC, decode it natively. On RN, `expo-image-picker` returns a JPEG-encoded URI by default — verify and convert if needed.
3. Show a "Processing image…" full-screen state.
4. Decode the QR code from the image. On RN, candidates:
   - **`expo-camera`** has a `scanFromURLAsync` API.
   - **`vision-camera-code-scanner`** + **`react-native-vision-camera`** can also decode still images.
   - **`react-native-mlkit-barcodes`** for MLKit's BarcodeDetector.
5. If a QR is found and it's a valid fiscal URL → enter the retry loop (`createReceiptWithRetry`).
6. If not found → "We couldn't find a QR code in this image" error with "Try a different photo" CTA.

The web implementation does **5 enhancement passes** (original, contrast+grayscale, extreme contrast, adaptive binarization, sharpening+binarization) using `BarcodeDetector` + canvas filters. **For the RN clone, rely on the native scanner libs' built-in decoders** — they're more capable than the web's `BarcodeDetector`. Implement a simple "rotate 90° / 180° / 270° and retry" loop only if real-world testing shows you need it.

---

## PFR manual entry

For receipts where the QR is damaged or missing. Fields:

- **PFR ID** (3 parts: `[A-Z0-9]{8}` - `[A-Z0-9]{8}` - `[A-Z0-9]{6}`)
- **Counter** (2 parts: `\d{6}` - `\d{6}`)
- **Date / time** (datetime input)
- **Amount** (decimal)

Auto-uppercase the alphanumeric segments and auto-advance focus when a segment fills.

Submit → `POST /receipts { pfrData: { pfr, counter, date, amount } }` → enter the retry loop as if it were a scanned QR (the backend constructs the fiscal portal URL on the server).

---

## Concurrent scans

Prevent duplicate submissions:

- After a QR is decoded, set a `submitting` flag and ignore subsequent `onScan` callbacks until the flow ends. (Web does this at `qr-scanner.tsx:338-344`.)
- This is especially important on mobile cameras which can fire multiple frame-level detections in quick succession.

---

## Permissions

- **iOS**: `NSCameraUsageDescription` in Info.plist with a localized string like `"Receipto needs camera access to scan receipt QR codes."`. For gallery, `NSPhotoLibraryUsageDescription`.
- **Android**: `android.permission.CAMERA`. Gallery doesn't need a permission on Android 13+ but legacy versions need `READ_EXTERNAL_STORAGE` (use `expo-image-picker`'s recommended pattern, which handles this).
- Handle "permission denied" gracefully: a card explaining why we need it + "Open Settings" deep link.

---

## Telemetry

The web emits Sentry events on every retry attempt and on terminal failure (see `use-receipt-scanner.tsx:399–427`). Mirror this on RN with `@sentry/react-native`:

- Tag: `feature: 'scan'`
- Context: `{ attempt, maxAttempts, transient, qrCodeUrl: redacted }` — strip the `vl=` query param to avoid leaking PII.

---

## API summary

| Endpoint                | Method | Body                                     | Returns   |
| ----------------------- | ------ | ---------------------------------------- | --------- |
| `/receipts`             | POST   | `{ qrCodeUrl }` _or_ `{ pfrData }`       | `Receipt` |

The receipt comes back with `status: 'scraped'` (success) — or, in the rare case the backend gives up too, `status: 'failed'`.

---

## Visual spec

See `../design-output/scanning/` for the full visual spec (reticle, scan-line animation, retry-card countdown ring, terminal-failure screen, FAB action sheet). This doc owns the state machine, the retry algorithm with exact delays, error classification, and the API integration. **Implement the retry loop exactly as specified — the backend does not retry on its own.**

---

## Acceptance checklist

- [ ] Camera modal opens, requests permission on first use, falls back gracefully if denied.
- [ ] Non-fiscal QR codes are rejected with an inline message and the scanner keeps running.
- [ ] First successful submission shows checkmark and navigates to the new receipt detail.
- [ ] Transient portal errors trigger the retry loop with exactly 7 attempts and the correct delays.
- [ ] "Try Now" during retry advances immediately to the next attempt.
- [ ] "Cancel Retry" aborts cleanly and shows the terminal failure screen.
- [ ] Gallery picker reads the image, decodes a QR, and feeds it into the same retry loop.
- [ ] HEIC images from iOS work.
- [ ] PFR manual entry validates segment lengths and submits.
- [ ] Permission denied shows a "Open Settings" CTA.
- [ ] Sentry events fire for every retry attempt and terminal failure (no PII in tags).
- [ ] No duplicate POSTs from rapid-fire onScan callbacks.
