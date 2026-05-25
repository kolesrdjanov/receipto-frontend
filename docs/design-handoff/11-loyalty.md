# 11 — Loyalty cards

Users store loyalty cards (barcodes / QR codes) so they can present them at checkout from their phone instead of carrying physical cards.

---

## Screens

| Screen            | Purpose                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| LoyaltyList       | Grid of all cards                                                             |
| LoyaltyDisplay    | Full-screen modal showing the barcode/QR for cashier scanning                 |
| LoyaltyForm       | Create / edit a card                                                          |
| LoyaltyScanner    | Camera scanner to capture a code from a physical card                         |

---

## Data fields

- `cardName` — user label, e.g. "Mercator Pika"
- `codeType` — `qr` or `barcode`
- `codeFormat` — `code_128`, `ean_13`, `qr_code`, etc.
- `codeValue` — the actual barcode/QR payload
- `color` — hex from the 10-swatch palette (defaults to blue if unset)

No merchant metadata, no notes, no image. Keep it simple.

---

## LoyaltyList

### Header

- Title: "Loyalty cards"
- Right: "+ Add" primary button

### Grid

A 2-column grid (1-column on the smallest phones, 2 on most, 3 on tablets). Each cell:

- Rounded rectangle with ~3:2 aspect ratio
- Background: card's `color` at full saturation
- Top of the card: thin colored strip at full saturation (so the card has visible "structure" — like a real card)
- Body: a translucent white overlay (`rgba(255,255,255,0.85)` in light mode, `rgba(0,0,0,0.7)` in dark mode? — try both and pick what reads best) with:
  - Card name (body-strong, dark text in light mode)
  - Code value below (caption, monospace, truncated with ellipsis)
- Bottom-right corner: small chip ("QR" or "Barcode") in caption-strong

### Interactions

- **Tap** card → opens LoyaltyDisplay modal
- **Long-press** → action sheet: Show / Edit / Delete
- **Swipe-left** on the card (if your grid supports it; otherwise rely on long-press) → reveal Delete

### Empty state

- CreditCard icon (48pt, muted)
- "No loyalty cards yet"
- "Add your store cards to leave the plastic at home."
- "+ Add your first" primary CTA

### Loading

Skeleton: 4 placeholder card-shaped boxes with shimmer.

---

## LoyaltyDisplay

The "flash this at the cashier" screen. Full-screen modal.

### Behavior

- **Screen brightness boosted to maximum** on mount, restored on unmount AND on app backgrounding. This is critical — annotate the design with a clear note ("BRIGHTNESS BOOST" callout).
- Status bar: `dark-content` (white background underneath).

### Layout

- White background, full bleed (ignore safe areas)
- Top: card name (heading-2, centered, dark text)
- Center: the rendered code
  - **QR codes**: ~280 × 280pt, with margins
  - **Barcodes**: ~340pt wide × 100pt tall, with the code value printed underneath (`displayValue` on)
- Below the code: the `codeValue` as selectable monospace text (~14pt) — fallback for cashiers who type
- Bottom: subtle "Tap anywhere to close" caption (caption, muted)

### Dismissal

- Tap anywhere on the screen (or close X if you prefer to be explicit)
- Swipe down to dismiss (gesture indicator at top would help)

### Brightness annotation

Show this modal in your design at higher apparent brightness than other screens (you can't actually represent it but a callout annotation works). Something like:

> 🔆 Screen brightness boosts to 100% while this modal is open. Restored on close or backgrounding.

---

## LoyaltyForm

Bottom sheet or full-screen modal (form is short — sheet is fine).

### Layout

- Header: title "Add card" / "Edit card", Cancel left, Save right
- Fields:

| Field           | Type                                                                |
| --------------- | ------------------------------------------------------------------- |
| Card name       | text, required                                                      |
| Code value      | text input with trailing **two icons**: 🖼 "Scan from image", 📷 "Scan with camera" |
| Color           | inline 10-swatch palette                                            |

### Scan from image

- Tap icon → opens OS image picker
- After selection: scanner processes the image silently in the background; on detect, fills `code value` (and stores `codeType` / `codeFormat` invisibly)
- If no code found: inline error below the value field

### Scan with camera

- Tap icon → opens LoyaltyScanner (described below)
- On detect: scanner closes; form's `code value` populated

---

## LoyaltyScanner

A separate full-screen modal, similar to the receipt Scanner but **not restricted to fiscal URLs**.

### Differences from receipt Scanner

- Reticle is wider than tall (320 × 160pt) to encourage horizontal barcode framing
- No retry loop — detection is instant and local; no backend involved
- Tip text: "Point your camera at the barcode or QR code"
- States are simpler: `camera_loading`, `scanning`, `success`

On detect:

- Light impact haptic
- Brief success state (checkmark, 500ms)
- Modal dismisses, code passed back to LoyaltyForm

### Permission denied

Same pattern as the receipt Scanner: camera icon + "Camera access needed" + "Open settings" CTA.

---

## Visual conventions

- **Card thumbnails on the grid**: feel like real plastic cards. Solid color background, subtle top strip, slight elevation (shadow level 1 — the only place we use it freely). No glassmorphism / blur.
- **Code value font**: monospace with slightly increased letter-spacing (+5%) for legibility.
- **Code chip ("QR" / "Barcode")**: small caption-strong pill at the bottom-right of the thumbnail, dark bg / white text (regardless of card color).
- **Color palette**: the shared 10 swatches. Same as Categories, Recurring.

---

## Acceptance checklist

- [ ] LoyaltyList grid designed in light + dark with at least 4 cards of varied colors.
- [ ] Empty state designed.
- [ ] Long-press action sheet designed (Show / Edit / Delete).
- [ ] Swipe-left delete reveal designed (or document why it's not used — relying on long-press).
- [ ] LoyaltyDisplay modal designed for both a QR card and a barcode card.
- [ ] Brightness-boost behavior annotated.
- [ ] LoyaltyDisplay shown in light AND dark mode (the modal is always light-background, but the surrounding system tone matters).
- [ ] LoyaltyForm designed with the two scan-from icons in the code value field.
- [ ] LoyaltyScanner designed with `scanning` and `success` states (camera_loading and permission-denied can be specified by reference to `08-scanning.md`).
- [ ] Reticle dimensions called out (320 × 160 for horizontal barcode framing).
