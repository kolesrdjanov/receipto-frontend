# 08 — Scanning

The hero flow. Users capture a fiscal receipt QR code (or pick an image, or type the PFR manually) and the backend extracts structured data.

This is the most state-rich feature in the app. Design every state carefully — the user experience hinges on smooth recovery from failures and clear feedback during long retry waits.

---

## Entry points

Three ways in (all converge on the same final step):

1. **Scan with camera** — opens the camera scanner modal
2. **Pick from gallery** — opens the OS image picker, then a processing state
3. **Enter manually (PFR)** — opens the PFR entry form (designed in `07-receipts.md`)

Entered from:

- FAB tap (default → camera) or long-press (action sheet with all three)
- ReceiptsList "+ Scan" button
- Empty-state CTA on the Dashboard

---

## Scanner modal (camera flow)

A **full-screen modal**, slides up from the bottom, status bar `light-content` over the camera view. No tab bar visible.

### Anatomy

Layered top to bottom:

- **Camera video** fills the entire screen
- **Top overlay** (dark gradient or solid `rgba(0,0,0,0.5)`): close X (top-left, in safe-area inset), title "Scan receipt" (centered), camera-picker icon (top-right; opens a sheet listing rear/front/specific cameras)
- **Viewfinder reticle** (centered, ~70% of the shorter dimension): 4 corner brackets in `primary`, 3pt stroke. Outside the reticle: 50% black overlay creating a "darkroom" effect.
- **Scan-line animation**: thin 1pt gradient line that animates top-to-bottom within the reticle on a 2-second loop. Subtle but communicates "actively scanning."
- **Tip text** below the reticle: "Point your camera at the receipt's QR code" (body, white)
- **Bottom controls** (translucent dark band at the bottom): "Use gallery" (outline button, left) + "Cancel" (ghost, right) + torch toggle (top-right corner of the band — only if device supports it)

### States

This is a state machine — design each state distinctly. Same camera background where applicable.

#### State 1: `camera_loading`

While the camera initializes (rare on fast devices, common on first install):

- Camera background black or very dark
- Centered spinner with caption: "Loading camera…"
- After 10 seconds without a successful start, show fallback options:
  - Inline message: "Camera is taking a while…"
  - Buttons: "Switch camera" / "Use gallery" / "Cancel"

#### State 2: `scanning`

The resting state. Everything described under "Anatomy" above.

#### State 3: `submitting`

A QR was detected; the app is sending it to the backend (first attempt, no delay).

- Dim the entire scanner with `rgba(0,0,0,0.5)` overlay
- Centered card (white in light mode, `card` in dark) with:
  - Spinner (medium size)
  - "Processing receipt…"
- No buttons — the first attempt is uncancellable (it's short).

#### State 4: `retrying_portal`

The first attempt got a transient error (the fiscal portal is busy). The app retries up to 7 times with increasing delays: 5s, 10s, 15s, 20s, 30s, 40s.

Design this as the **most novel state in the app**. The user is now waiting for a network operation that may take ~2 minutes total. Reassurance matters.

Layout (same dimmed backdrop as `submitting`):

- Centered card, wider than `submitting`'s card
- **Spinner ring** at the top — but with a *progress overlay* showing the seconds until the next retry. The ring fills as time elapses. (Think: an Apple-Watch-style countdown ring.)
- Inside the ring: the current second count, e.g. `15s`
- Heading-3: "The fiscal portal is busy"
- Caption (muted): "Retry 3 / 7"
- Caption (muted): "We'll keep trying for ~2 minutes."
- Two buttons side by side:
  - **Try now** (primary, half width) — fires the next retry immediately
  - **Cancel retry** (ghost, half width) — aborts and goes to `failed_terminal`

When the countdown reaches zero, transition seamlessly into `submitting` for the next attempt.

#### State 5: `failed_terminal`

All retries exhausted, or user cancelled, or a non-transient error (4xx other than 404 or 429).

- Dimmed backdrop
- Centered card with:
  - Red X icon (48pt, `destructive`)
  - Heading-3: dynamic error message (e.g. "We couldn't scan that receipt")
  - Body (muted): sub-description if helpful
  - Three buttons (stacked):
    - "Try again" (primary, full width) — back to `scanning`
    - "Use gallery" (outline)
    - "Enter manually (PFR)" (outline)
- Close X in the top-right of the card

#### State 6: `success`

Receipt created successfully.

- Dimmed backdrop
- Centered card:
  - Large green checkmark icon (48pt, success)
  - "Receipt added!" (heading-3)
  - Auto-dismisses after ~1.2s
- On dismiss: modal closes, navigation routes to the new ReceiptDetail (or back to wherever the user came from, with a success toast — design both, the dev will pick).

### Inline error toast (non-fiscal QR)

If the user scans a non-fiscal QR code (e.g. a Wi-Fi QR), don't crash the flow:

- A toast slides down from the top: "This isn't a fiscal receipt QR code"
- Toast auto-dismisses in 3s
- The scanner stays in `scanning` state — user can try another QR

Same toast pattern for any other recoverable scan-time error (e.g. duplicate scan suppression).

---

## Gallery flow

Triggered by "Use gallery" in the scanner OR from the FAB action sheet.

### State A: Image picker (OS native)

Opens the platform-native image picker. No design needed.

### State B: `gallery_processing`

After the user picks an image, transition to a full-screen processing state:

- Background: `background`
- Centered: large image thumbnail (the picked photo) at ~280pt wide
- Below the thumbnail: spinner + "Processing image…" caption
- Cancel button at the bottom (ghost) — aborts decoding

If a QR is found in the image:

- Transition into the same `submitting` → `retrying_portal` → `success` / `failed_terminal` flow as camera scanning.

If no QR is found:

- Replace processing state with: red X icon + "We couldn't find a QR code in this image" + "Try a different photo" (primary) + "Use camera" (outline)

---

## Permission states

### Camera permission denied

First-time camera launch triggers a system permission prompt (not designed by us — OS handles it). If the user denies:

- Full-screen layout in the scanner modal:
  - Camera icon (48pt, muted)
  - Heading-2: "Camera access needed"
  - Body: "Receipto needs camera access to scan receipt QR codes."
  - Primary button: "Open settings" → deep links to the app's settings page in iOS Settings / Android Settings
  - Secondary: "Use gallery instead"
  - Close X (top-right)

### Photo library permission denied (Android < 13)

Similar layout, with the appropriate icon and copy.

---

## Long-press FAB action sheet

When the user long-presses the FAB on the Dashboard / Receipts / Recurring tabs:

- Action sheet slides up from the bottom (system style on iOS, sheet on Android)
- Title: "Add a receipt"
- Three rows:
  - 🔲 Scan QR code
  - 🖼 Choose from gallery
  - ⌨ Enter manually (PFR)
- Cancel row at the bottom

---

## Visual conventions specific to scanning

- **Reticle corner brackets**: 3pt stroke, `primary` color, sharp 90° corners (not rounded).
- **Outside-reticle overlay**: `rgba(0,0,0,0.5)`. This creates the spotlight effect.
- **Scan line**: 1pt thin line, gradient from transparent → `primary` (50% alpha) → transparent across its length. Animates from top of reticle to bottom on a 2s loop.
- **Buttons inside the scanner**: outline buttons with white border + white text for legibility against the camera view. Pressed state: slight white-fill at 20% alpha.
- **Spinner**: standard system spinner color (white inside scanner overlays, primary inside cards).
- **The retrying card's ring** is the single most novel visual — design it with care. It should feel calm, not urgent.

---

## Haptics (annotate, don't render)

| Event                    | Haptic              |
| ------------------------ | ------------------- |
| QR detected              | Light impact        |
| Receipt success          | Notification success |
| Receipt terminal failure | Notification error  |

---

## Acceptance checklist

- [ ] Camera modal `scanning` state designed in light + dark (dark mode = same camera view, but UI overlays use dark-mode tints).
- [ ] All 6 scanner states (`camera_loading`, `scanning`, `submitting`, `retrying_portal`, `failed_terminal`, `success`) designed.
- [ ] `retrying_portal` countdown ring detailed — show at least 3 progress points (just-started, halfway, almost-done).
- [ ] Inline non-fiscal-QR toast designed.
- [ ] Gallery `gallery_processing` state designed.
- [ ] "No QR found in image" state designed.
- [ ] Camera permission-denied screen designed.
- [ ] FAB long-press action sheet designed.
- [ ] Camera-picker sheet (rear / front / specific device) designed.
- [ ] Torch toggle state designed (off / on).
- [ ] Haptic events annotated on the relevant states.
