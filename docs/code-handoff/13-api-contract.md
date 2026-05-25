# 13 — API contract

Consolidated reference of every backend endpoint the mobile app will hit, derived from the web's hooks. Use this as the canonical list — anything not listed here is **out of scope** for the RN clone.

Base URL: `process.env.EXPO_PUBLIC_API_URL` (e.g. `https://api.receipto.rs`).

All authenticated requests must send `Authorization: Bearer <accessToken>`. All requests must send `Accept-Language: <en|sr>`. Both are added by the axios request interceptor (`src/lib/api.ts`).

---

## Conventions

- **Date format**: ISO 8601 strings throughout. Some endpoints accept date-only (`YYYY-MM-DD`), others accept full datetime (`YYYY-MM-DDTHH:mm:ssZ`). Receipts use full datetime; recurring expenses' `startDate` / `endDate` are date-only.
- **Amounts**: numbers, fixed-point as strings in some responses (be defensive — coerce to number on read).
- **Currency**: ISO 4217 strings (`RSD`, `EUR`, `USD`, `BAM`, …). Always paired with an amount.
- **Pagination**: `?page=1&limit=10` for paginated endpoints; response includes `{ data, total, page, limit }`.
- **Sorting**: `?sortBy=field&sortOrder=asc|desc`.
- **Errors**: JSON `{ message: string | string[]; code?: string }`. The web's `ApiError` wraps these — port as-is.
- **Refresh**: 401 triggers `POST /auth/refresh`; see `src/lib/api.ts:131-176`.

---

## Auth

| Method | Path                          | Auth | Body                                            | Returns                                  |
| ------ | ----------------------------- | ---- | ----------------------------------------------- | ---------------------------------------- |
| POST   | `/auth/login`                 | ❌    | `{ email, password }`                           | `{ accessToken, refreshToken, user }`    |
| POST   | `/auth/register`              | ❌    | `{ firstName, lastName, email, password }`      | `{}`                                     |
| POST   | `/auth/google`                | ❌    | `{ accessToken: <googleAccessToken> }`          | `{ accessToken, refreshToken, user }`    |
| POST   | `/auth/forgot-password`       | ❌    | `{ email }`                                     | `{}`                                     |
| POST   | `/auth/reset-password`        | ❌    | `{ token, password, confirmPassword }`          | `{}`                                     |
| POST   | `/auth/verify-email`          | ❌    | `{ token }`                                     | `{}`                                     |
| POST   | `/auth/resend-verification`   | ❌    | `{ email }`                                     | `{}`                                     |
| POST   | `/auth/refresh`               | ❌    | `{ refreshToken }`                              | `{ accessToken, refreshToken? }`         |

Special error code: `{ code: 'auth.emailNotVerified' }` on `/auth/login`.

---

## Users

| Method | Path                  | Body                                                | Returns                       |
| ------ | --------------------- | --------------------------------------------------- | ----------------------------- |
| GET    | `/users/me`           | —                                                   | `Me`                          |
| PATCH  | `/users/me`           | `Partial<Me>` (no email, no role)                   | `Me`                          |
| POST   | `/users/me/password`  | `{ currentPassword, newPassword }`                  | `{}`                          |
| DELETE | `/users/me`           | —                                                   | `{}`                          |
| POST   | `/users/me/avatar`    | `FormData { file }` (jpeg/png/webp/heic ≤ 5MB)      | `{ profileImageUrl }`         |
| DELETE | `/users/me/avatar`    | —                                                   | `{}`                          |

`Me` shape:

```ts
type Me = {
  id, email, firstName, lastName,
  profileImageUrl, role,
  street, zipCode, city,
  preferredLanguage,
  warrantyReminderEnabled, budgetAlertEnabled, receiptMilestoneEmailsEnabled,
  rank?: { tier: 'A' | 'B' | 'C' | 'none', count, nextThreshold }
}
```

---

## Receipts

| Method | Path                          | Query / Body                                                                                                                                                  | Returns                                  |
| ------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| GET    | `/receipts`                   | `?page&limit&categoryId&startDate&endDate&minAmount&maxAmount&sortBy&sortOrder`                                                                              | `{ data: Receipt[]; total; page; limit }` |
| GET    | `/receipts/:id`               | —                                                                                                                                                             | `Receipt`                                |
| POST   | `/receipts`                   | One of: `{ qrCodeUrl }`, `{ pfrData: { pfr, counter, date, amount } }`, `{ storeName, totalAmount, currency, receiptDate, categoryId? }`                       | `Receipt`                                |
| PATCH  | `/receipts/:id`               | Any subset of `{ storeName, totalAmount, currency, receiptDate, receiptNumber, categoryId, suggestionAccepted }`                                              | `Receipt`                                |
| DELETE | `/receipts/:id`               | —                                                                                                                                                             | —                                        |
| DELETE | `/receipts/bulk`              | `{ ids: string[] }`                                                                                                                                           | —                                        |
| PATCH  | `/receipts/bulk/category`     | `{ ids: string[]; categoryId: string \| null }`                                                                                                              | —                                        |
| GET    | `/receipts/suggest-category`  | `?storeName=...`                                                                                                                                              | `{ categoryId, categoryName, categoryIcon?, categoryColor?, confidence, reason }` |
| GET    | `/receipts/export`            | —                                                                                                                                                             | CSV blob (optional for v1)               |
| POST   | `/receipts/import`            | `FormData { file }`                                                                                                                                           | `{ imported, errors? }` (optional for v1) |

See `03-receipts.md` for the full `Receipt` shape and `06-scanning.md` for the retry semantics on `POST /receipts`.

---

## Recurring expenses

| Method | Path                                    | Query / Body                                                                                                            | Returns                                  |
| ------ | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| GET    | `/recurring-expenses`                   | —                                                                                                                       | `RecurringExpense[]`                     |
| GET    | `/recurring-expenses/:id`               | —                                                                                                                       | `RecurringExpense`                       |
| POST   | `/recurring-expenses`                   | `{ name, amount, currency, isFixed, frequency, dayOfMonth?, startDate, endDate?, icon?, color?, notes?, categoryId? }`   | `RecurringExpense`                       |
| PATCH  | `/recurring-expenses/:id`               | Subset of the above + `isPaused`                                                                                         | `RecurringExpense`                       |
| DELETE | `/recurring-expenses/:id`               | —                                                                                                                       | —                                        |
| GET    | `/recurring-expenses/upcoming`          | `?days=30`                                                                                                              | `{ overdue, dueSoon, upcoming }`         |
| GET    | `/recurring-expenses/summary`           | —                                                                                                                       | `Summary`                                |
| POST   | `/recurring-expenses/:id/pay`           | `{ amount, paidDate, notes? }`                                                                                          | `RecurringExpensePayment`                |
| GET    | `/recurring-expenses/:id/payments`      | `?limit=10`                                                                                                             | `RecurringExpensePayment[]`              |

---

## Categories

| Method | Path                          | Body                                                                                  | Returns      |
| ------ | ----------------------------- | ------------------------------------------------------------------------------------- | ------------ |
| GET    | `/categories`                 | —                                                                                     | `Category[]` |
| GET    | `/categories/:id`             | —                                                                                     | `Category`   |
| GET    | `/categories/:id/receipts`    | —                                                                                     | `Receipt[]`  |
| POST   | `/categories`                 | `{ name, color?, icon?, description?, monthlyBudget?, budgetCurrency? }`              | `Category`   |
| PATCH  | `/categories/:id`             | Partial of the above                                                                  | `Category`   |
| DELETE | `/categories/:id`             | —                                                                                     | —            |

---

## Loyalty cards

| Method | Path                  | Body                                                                                       | Returns          |
| ------ | --------------------- | ------------------------------------------------------------------------------------------ | ---------------- |
| GET    | `/loyalty-cards`      | —                                                                                          | `LoyaltyCard[]`  |
| GET    | `/loyalty-cards/:id`  | —                                                                                          | `LoyaltyCard`    |
| POST   | `/loyalty-cards`      | `{ cardName, codeType, codeFormat, codeValue, color? }`                                    | `LoyaltyCard`    |
| PATCH  | `/loyalty-cards/:id`  | Partial of the above                                                                       | `LoyaltyCard`    |
| DELETE | `/loyalty-cards/:id`  | —                                                                                          | —                |

---

## Dashboard / aggregates

| Method | Path                                                | Query             | Returns                                            |
| ------ | --------------------------------------------------- | ----------------- | -------------------------------------------------- |
| GET    | `/dashboard/aggregated/stats`                       | —                 | `{ totalReceipts, totalCategories, byCurrency[], recentReceipts[] }` |
| GET    | `/dashboard/aggregated/category-stats`              | `?year&month`     | `{ categoryId, name, icon, color, byCurrency[] }[]` |
| GET    | `/dashboard/aggregated/daily-stats`                 | `?year&month`     | `{ day: number; byCurrency[] }[]`                  |
| GET    | `/dashboard/aggregated/monthly-stats`               | `?year`           | `{ month: number; byCurrency[] }[]`                |

`CurrencyBreakdown`: `{ currency: string; totalAmount: number; receiptCount: number }`.

---

## Currencies

| Method | Path                | Returns                                                            |
| ------ | ------------------- | ------------------------------------------------------------------ |
| GET    | `/currencies`       | `{ code; name; symbol }[]`                                         |
| GET    | `/currencies/rates` | `{ base; rates: Record<string, number>; updatedAt }` (optional — confirm with backend) |

The mobile app converts amounts from each receipt's stored currency into the user's display currency at render time.

---

## Auth header rules

| Endpoint family       | Auth header required? |
| --------------------- | ---------------------- |
| `/auth/*`             | ❌ (refresh sends body) |
| Everything else       | ✅                      |

The web sets `requiresAuth: false` on auth endpoints via the axios config — keep this pattern.

---

## Endpoints intentionally NOT used by the clone

These exist on the backend (the web hits them) but are **excluded** from the RN clone per scope:

- `/items/*`, `/price-compare/*` (Price Compare feature — out of scope)
- `/savings/*` (Savings module — out of scope)
- `/warranties/*` (Warranties — likely out of scope)
- `/groups/*` (Group spending — out of scope)
- `/templates/*` (Receipt templates — out of scope)
- `/admin/*` (Admin features — out of scope)
- `/announcements/*` (App announcements — defer)
- `/ratings/*` (Rate-app prompt — defer)
- `/support/*` (Contact support form — defer)

Confirm with backend if any of these become relevant later; until then, do not call them.
