# 07 — Loyalty Cards

Store loyalty cards (barcodes and QR codes) so users can scan them at checkout from their phone.

Web reference: `src/pages/loyalty-cards/index.tsx`, `src/components/loyalty-cards/*`, `src/hooks/loyalty-cards/use-loyalty-cards.ts`.

---

## Data model

```ts
type LoyaltyCard = {
  id: string
  userId: string
  cardName: string           // user label, e.g. "Mercator Pika"
  codeType: 'qr' | 'barcode'
  codeFormat: BarcodeFormat
  codeValue: string
  color?: string | null      // hex, defaults to #3B82F6 (blue) at render time
  createdAt: string
  updatedAt: string
}

type BarcodeFormat =
  // 1D
  | 'code_128' | 'code_39' | 'code_93' | 'ean_13' | 'ean_8'
  | 'upc_a' | 'upc_e' | 'itf' | 'codabar'
  // 2D
  | 'qr_code' | 'data_matrix' | 'aztec' | 'pdf417'

type CreateLoyaltyCardData = {
  cardName: string
  codeType: 'qr' | 'barcode'
  codeFormat: BarcodeFormat
  codeValue: string
  color?: string
}
```

The data model has **no merchant/store metadata, no image, no notes** — keep it that way. (Adding fields would diverge from the API contract.)

---

## API endpoints

| Endpoint                  | Method | Body                       | Returns          |
| ------------------------- | ------ | -------------------------- | ---------------- |
| `/loyalty-cards`          | GET    | —                          | `LoyaltyCard[]`  |
| `/loyalty-cards/:id`      | GET    | —                          | `LoyaltyCard`    |
| `/loyalty-cards`          | POST   | `CreateLoyaltyCardData`    | `LoyaltyCard`    |
| `/loyalty-cards/:id`      | PATCH  | `Partial<…>`               | `LoyaltyCard`    |
| `/loyalty-cards/:id`      | DELETE | —                          | —                |

---

## Screens

### 1. Loyalty cards grid (`/loyalty-cards`)

**Header**: title "Loyalty cards", "+ Add" button.

**Grid**: 2-column grid (or 1-column on small phones) of card "thumbnails":

- Each card: rounded rectangle, ~3:2 aspect ratio, background = `color` (or default blue) at 100% saturation.
- Top of the card: thin colored strip at full saturation.
- Body of the card: white-ish translucent overlay with the card name (bold) and the `codeValue` (small, monospace, truncated).
- Bottom-right: small "QR" / "barcode" chip indicating type.
- Tap → opens the **full-screen display modal**.
- Long-press → action sheet: "Show", "Edit", "Delete".

**Empty state**: "No loyalty cards yet" + "+ Add your first" button + a credit-card icon.

### 2. Full-screen display modal

The screen you flash at the cashier:

- White background, full bleed.
- **Boost brightness**: set the screen brightness to maximum while this is open (use `expo-brightness` or `react-native-brightness`), and **restore on close**. This is the key UX win — scanners struggle in low-light.
- Card name (large) at top.
- Center: the rendered code:
  - QR: ~280pt × 280pt, EC level M, with margins.
  - Barcode: ~340pt wide × 100pt tall, displayValue=true (the code value printed underneath).
- Code value (selectable, monospace) below the rendered code — fallback for cashiers who type it in.
- Bottom: subtle "Tap anywhere to close" hint.

**Rendering libraries** for RN:

- QR: **`react-native-qrcode-svg`** (uses react-native-svg) — actively maintained.
- 1D barcodes: **`@kichiyaki/react-native-barcode-generator`** or **`react-native-jsbarcode`** — both wrap JsBarcode's format strings (`CODE128`, `EAN13`, etc.).
- Format string mapping (web does this at `loyalty-card-display.tsx:20–30`):

| Our enum     | JsBarcode format |
| ------------ | ---------------- |
| `code_128`   | `CODE128`        |
| `code_39`    | `CODE39`         |
| `code_93`    | `CODE93`         |
| `ean_13`     | `EAN13`          |
| `ean_8`      | `EAN8`           |
| `upc_a`      | `UPC`            |
| `upc_e`      | `UPCE`           |
| `itf`        | `ITF`            |
| `codabar`    | `codabar`        |

For 2D formats other than QR (`data_matrix`, `aztec`, `pdf417`) — RN libraries are sparse. **For v1 of the clone, render these as a QR code if rendering fails, and always show the `codeValue` text below**. Realistically 95%+ of loyalty cards are CODE128, EAN13, or QR.

### 3. Add / Edit card modal

A form sheet with:

- **Card name** (text, required) — e.g. "Mercator Pika"
- **Code value** (text input).
  - Trailing icons: 📷 "Scan from image" and 🎥 "Scan with camera".
- **Color** — same swatch palette as the recurring-expense / category color picker. 10 presets.

Both scan paths produce: `codeType` (inferred), `codeFormat`, and `codeValue`. The user can then edit the name and color.

- **Scan from image**: open image picker → resize to ≤1200px (web does this client-side; for RN you can skip the resize, the scanners handle large images) → decode → fill the fields → close the scanner.
- **Scan with camera**: open the loyalty-card scanner (see below) → on detect, fill fields → close.

Format-to-type inference (`src/components/loyalty-cards/loyalty-card-modal.tsx:77–81`):

- QR-class formats (`qr_code`, `data_matrix`, `aztec`, `pdf417`) → `codeType: 'qr'`
- Everything else → `codeType: 'barcode'`

Submit:

- Create → `POST /loyalty-cards`.
- Edit → `PATCH /loyalty-cards/:id`.

### 4. Loyalty card scanner

Looks similar to the receipt scanner but **not** restricted to fiscal QR URLs:

- Full-screen camera.
- Reticle is **wider than tall** (e.g. 320 × 160pt) to encourage horizontal barcode framing.
- On detect: normalize the format string (`CODE_128` → `code_128`), set `codeType` and `codeFormat`, return values to the modal, and dismiss.

RN libraries:

- **`react-native-vision-camera`** + **`vision-camera-code-scanner`** — fastest, supports 1D + 2D out of the box.
- Or **`expo-camera`**'s `BarCodeScanner` — easier integration on Expo.

Format normalization: vision-camera / MLKit format names map cleanly to lowercase snake_case (e.g. `CODE_128` → `code_128`).

Camera: rear-facing, framerate 10fps is fine, autofocus continuous.

Permissions: same as `06-scanning.md`.

---

## Hooks

`src/hooks/loyalty-cards/use-loyalty-cards.ts` — port verbatim:

- `useLoyaltyCards()`
- `useLoyaltyCard(id)`
- `useCreateLoyaltyCard()`
- `useUpdateLoyaltyCard()`
- `useDeleteLoyaltyCard()`

Mutations invalidate `loyaltyCards.all` only.

---

## Visual spec

See `../design-output/loyalty/` for the full visual spec (card thumbnails, display modal layout, scanner viewfinder dimensions). Implementation notes:

- **Brightness boost** on display modal is non-negotiable: set brightness to 1.0 on mount and restore on unmount. Listen to AppState to restore when the user backgrounds the app mid-display.
- The 10-swatch color palette is shared with Categories and Recurring.
- No sorting / search in v1 — keep parity with the web until a real need emerges.

---

## Acceptance checklist

- [ ] Grid renders cards with color, name, code preview, type chip.
- [ ] Tap opens the display modal; brightness boosts and restores reliably.
- [ ] Display modal renders QR via `react-native-qrcode-svg` and barcodes via JsBarcode-equivalent.
- [ ] Add/Edit form opens, color palette works, code can be entered manually.
- [ ] "Scan with camera" detects 1D and 2D codes and fills the form.
- [ ] "Scan from image" decodes barcodes from gallery images.
- [ ] Delete confirmation removes the card from the list and cache.
- [ ] Long-press menu offers Show / Edit / Delete.
