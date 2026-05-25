# 01 — Auth

Email/password auth with JWT access + refresh tokens, plus Google OAuth.

Web reference: `src/pages/auth/*`, `src/hooks/auth/*`, `src/store/auth.ts`, `src/components/auth/*`, `src/lib/api.ts`.

---

## Data model

```ts
type User = {
  id: string
  email: string
  firstName: string
  lastName: string
  profileImageUrl?: string | null
  role: 'user' | 'admin'
  warrantyReminderEnabled?: boolean
  budgetAlertEnabled?: boolean
  receiptMilestoneEmailsEnabled?: boolean
}

type AuthState = {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}
```

`AuthState` is persisted (key: `auth-storage`). On RN, use `AsyncStorage` (or `MMKV`) via the Zustand `persist` middleware's `storage` option.

---

## API endpoints

| Endpoint                     | Method | Body                                              | Response                                                  |
| ---------------------------- | ------ | ------------------------------------------------- | --------------------------------------------------------- |
| `/auth/login`                | POST   | `{ email, password }`                             | `{ accessToken, refreshToken, user }`                     |
| `/auth/register`             | POST   | `{ firstName, lastName, email, password }`        | `{ }` (no tokens — verification required)                 |
| `/auth/google`               | POST   | `{ accessToken: <googleAccessToken> }`            | `{ accessToken, refreshToken, user }`                     |
| `/auth/forgot-password`      | POST   | `{ email }`                                       | `{ }`                                                     |
| `/auth/reset-password`       | POST   | `{ token, password, confirmPassword }`            | `{ }`                                                     |
| `/auth/verify-email`         | POST   | `{ token }`                                       | `{ }`                                                     |
| `/auth/resend-verification`  | POST   | `{ email }`                                       | `{ }`                                                     |
| `/auth/refresh`              | POST   | `{ refreshToken }`                                | `{ accessToken, refreshToken? }`                          |

### Special error codes

- API may return `{ code: 'auth.emailNotVerified', message: '…' }` from `/auth/login`. UI must detect this and offer a "Resend verification" button that navigates to the CheckEmail screen with the email prefilled.

---

## Validation rules (Zod, identical on RN)

Sign-up / Reset password:

- `firstName`, `lastName`: min 1 char
- `email`: required, valid email format
- `password`: min 8 chars, must contain `[a-z]`, `[A-Z]`, `[0-9]`
- `confirmPassword`: must match `password`
- `terms`: must be `true` (sign-up only)

The exact schemas live in `src/hooks/auth/use-sign-up.ts:7` and `src/hooks/auth/use-reset-password.ts`. **Copy them as-is.**

---

## Screens

### 1. SignIn (`/sign-in`)

- **Fields**: email, password
- **Buttons**: "Sign in", "Continue with Google" (hide if no Google client ID), "Forgot password?" link, "Don't have an account? Sign up" link.
- **States**:
  - default
  - loading (button spinner, fields disabled)
  - error (inline destructive box; if `code === 'auth.emailNotVerified'` → show "Resend verification" CTA that navigates to CheckEmail with email)
- **Success**: store tokens + user via `login()`, navigate to the route that initiated the redirect (from `route.params.from`) or `Dashboard` by default.

### 2. SignUp (`/sign-up`)

- **Fields**: firstName, lastName, email, password (visibility toggle), confirmPassword (visibility toggle), terms checkbox
- **Terms checkbox** contains links to T&C and Privacy Policy (open external browser).
- **Buttons**: "Create account", "Continue with Google", "Already have an account? Sign in"
- **Validation**: client-side Zod (see above). Show field-level errors that clear on change.
- **Success**: navigate to `CheckEmail` with email in route params. **No tokens are issued at sign-up** — user must verify first.

### 3. CheckEmail (`/check-email`)

- Reached after sign-up or after "Resend verification" on sign-in.
- Shows: mail icon, "Check your email" heading, message containing the user's email (passed via route params), "Resend verification email" button.
- **Resend** calls `POST /auth/resend-verification { email }`. Show success message; throttle the button (disable + countdown) to prevent abuse.

### 4. VerifyEmail (deep link only)

- Reached when user taps the link in the verification email.
- **Deep link**: `receipto://verify-email?token=<JWT>` (and the equivalent universal link / app link).
- On mount: call `POST /auth/verify-email { token }`.
- **States**:
  - `verifying` — spinner
  - `success` — checkmark, "Email verified", auto-navigate to SignIn after 2s
  - `error` — destructive icon, error message, inline form to re-request via `/auth/resend-verification`

### 5. ForgotPassword (`/forgot-password`)

- **Fields**: email
- **Submit**: `POST /auth/forgot-password { email }`
- **Success state**: green confirmation card, "Back to sign in" link. Do NOT reveal whether email exists (the API returns 200 regardless).

### 6. ResetPassword (deep link only)

- **Deep link**: `receipto://reset-password?token=<JWT>`
- **Fields**: password, confirmPassword (Zod validation identical to sign-up)
- **Submit**: `POST /auth/reset-password { token, password, confirmPassword }`
- **Success**: green message, redirect to SignIn after 2s.
- **Invalid token**: error card with link to ForgotPassword.

---

## Google OAuth (mobile)

The web uses `@react-oauth/google`. On RN replace with **`expo-auth-session` / Google Sign-In** (or the Firebase Auth Google flow if Firebase is already in the stack — it's not in the web app).

Flow:

1. User taps "Continue with Google".
2. Native Google sign-in returns an `accessToken`.
3. `POST /auth/google { accessToken }` → `{ accessToken, refreshToken, user }`.
4. Store via `login()`, navigate to Dashboard.

The button is **hidden** if the Google client ID env var is missing — keep this behavior.

---

## Protected routes

`src/components/protected-route.tsx` (web) checks `isAuthenticated` and redirects to `/sign-in` with `state.from` set to the attempted route.

**On RN**, implement at the navigator level:

- A root navigator switches between an `AuthStack` (sign-in, sign-up, etc.) and an `AppStack` (everything else) based on `useAuthStore(s => s.isAuthenticated)`.
- When transitioning from `AppStack` → `AuthStack` (e.g. logout), no `from` is needed since the user is going to sign-in by choice.
- When transitioning from `AuthStack` → `AppStack` (after login), default landing screen is `Dashboard`.
- **Deep links** for verify-email / reset-password must work even when unauthenticated — they live in the `AuthStack`.

---

## Token refresh (critical)

Implemented in `src/lib/api.ts` (lines 67–96, 131–176). Port the logic verbatim:

- Axios response interceptor catches 401.
- If `requiresAuth !== false` and not already retried, call `refreshAccessToken()`.
- `refreshAccessToken()` is **single-flight**: stores the in-flight promise in a module-level `refreshPromise` variable so concurrent 401s share one refresh call.
- On success: write new tokens to the auth store (and refresh token if rotated), retry the original request with the new bearer token.
- On failure: call `logout()` and reject with `ApiError('Session expired. Please sign in again.', { status: 401 })`.

`Authorization: Bearer <accessToken>` is attached by a request interceptor (only when `requiresAuth !== false`).

---

## Logout

`useLogout()` (`src/hooks/auth/use-logout.ts`):

- Clears the React Query cache.
- Calls `useAuthStore.getState().logout()` which resets `user`, both tokens, and `isAuthenticated`.

On RN also clear any secure-store entries and reset the root navigator to `AuthStack`.

---

## Visual spec

See `../design-output/auth/` for the full visual spec per screen (layouts, states, input attributes, keyboard handling). This doc owns behavior, validation rules, and API integration.

---

## Acceptance checklist

- [ ] Sign-in works with valid credentials and stores tokens persistently.
- [ ] Sign-in with unverified account shows "Resend verification" CTA, not a generic error.
- [ ] Sign-up sends user to CheckEmail with email visible; "Resend" works and is throttled.
- [ ] Verify-email deep link verifies the token and redirects to sign-in on success.
- [ ] Forgot/reset password flow works end-to-end via deep link.
- [ ] Google sign-in works on iOS and Android; button hides when client ID missing.
- [ ] Tokens persist across app restarts; user stays signed in.
- [ ] 401 on any authenticated request triggers a single-flight refresh and retries.
- [ ] Logout clears tokens + React Query cache and routes to AuthStack.
