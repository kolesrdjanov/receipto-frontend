# 05 — Auth

Six screens. Email/password with token-based session, plus Google sign-in. Email verification is required after sign-up.

---

## Screen inventory

| #   | Screen           | Entry point                                          |
| --- | ---------------- | ---------------------------------------------------- |
| 1   | SignIn           | Default for unauthenticated users                    |
| 2   | SignUp           | Link from SignIn                                     |
| 3   | CheckEmail       | After sign-up; from "Resend verification" on SignIn  |
| 4   | ForgotPassword   | Link from SignIn                                     |
| 5   | ResetPassword    | Deep link from password-reset email                  |
| 6   | VerifyEmail      | Deep link from verification email                    |

Layout for all: vertically centered on tablets, top-aligned on phones with ~56pt top padding for the brand strip. Single full-screen flow, no tab bar.

---

## Screen specs

### 1. SignIn

**Layout** (top-to-bottom):

- Brand strip: small logo (32pt) centered + "Receipto" wordmark
- 32pt gap
- Heading: "Sign in" (heading-1)
- 8pt gap
- Subcopy: "Welcome back" (caption, muted)
- 32pt gap
- Email field (label + input)
- 12pt gap
- Password field (label + input with trailing eye toggle)
- 8pt gap
- "Forgot password?" link, right-aligned (link variant button)
- 24pt gap
- "Sign in" primary button (full width)
- 16pt gap
- Divider "or"
- 16pt gap
- "Continue with Google" outline button (full width, Google G icon left)
- 32pt gap
- "Don't have an account? Sign up" link, centered

**States to design:**

- Default
- Loading (button spinner, all inputs disabled)
- Generic error (form-level banner above the submit button)
- Email-not-verified error (banner with inline "Resend verification" CTA → navigates to CheckEmail)
- Empty email validation error (inline, below email field)
- Wrong-password error (form-level banner, "Incorrect email or password")

**Validation:**

- Email: required, must be valid email format. Show error on submit, not blur.
- Password: required, no further client-side validation on sign-in.

**Interactions:**

- Email field: keyboard type `email-address`, autocomplete `email`, `textContentType="emailAddress"`, autoCapitalize off.
- Password field: secure, `textContentType="password"`, autoComplete `password`.
- Password eye toggle: tapping the eye icon reveals plaintext; eye-off icon when revealed.
- Return key on email → focuses password.
- Return key on password → submits.
- Tap outside dismisses keyboard.

### 2. SignUp

**Fields** (in order):

- First name (text, required)
- Last name (text, required)
- Email (required)
- Password (required) with visibility toggle
- Confirm password (required) with visibility toggle
- Terms checkbox: "I agree to the Terms and Privacy Policy" with both phrases as tappable inline links

**States:**

- Default
- Loading
- Field-level validation errors (each below its field, destructive)
- Form-level error banner (e.g. "Email already in use")
- Success → navigates to CheckEmail with the email passed along

**Validation (per spec):**

- First / last name: min 1 char
- Email: required, valid format
- Password: min 8, must contain at least one lowercase letter, one uppercase, and one digit
- Confirm password: must equal password
- Terms: must be checked

Show field errors **on blur and on submit**, not on every keystroke. Clear on next edit.

**Interactions:**

- Auto-advance focus with return key.
- Eye toggles on both password fields.
- Terms checkbox states: unchecked, checked, error (when submit attempted without checking — shake animation + destructive ring).

### 3. CheckEmail

A non-form screen. Tells the user to check their email after sign-up.

**Layout:**

- Mail icon (48pt, `primary`)
- "Check your email" (heading-1)
- Subcopy: "We sent a verification link to **{email}**. Click it to verify your account." (the email rendered as bold)
- 32pt gap
- "Resend email" outline button (full width)
- 16pt gap
- "Back to sign in" link

**States:**

- Default
- Resending (button spinner)
- Resent (button shows "Sent ✓", disabled for ~30s with a countdown like "Resend in 28s")
- Error resending (form-level banner)

The countdown is to prevent spam — throttle so the same user can't repeatedly hammer the resend endpoint.

### 4. ForgotPassword

**Layout:**

- Heading: "Forgot password?"
- Subcopy: "Enter your email and we'll send you a reset link."
- Email field
- "Send reset link" primary button (full width)
- "Back to sign in" link

**States:**

- Default
- Loading
- Success (green banner: "If an account exists for that email, a reset link has been sent." — wording matters: don't confirm or deny account existence)
- Validation error (inline)
- Generic error (banner)

### 5. ResetPassword (deep link)

Entered from the email link. The reset token is in the URL.

**Layout:**

- Heading: "Set a new password"
- Subcopy: "Enter and confirm your new password."
- Password field (with eye toggle)
- Confirm password field (with eye toggle)
- "Reset password" primary button

**States:**

- Default
- Loading
- Validation errors (per the same rules as sign-up password)
- Success: green banner, "Password reset. Redirecting to sign in…" — auto-redirect to SignIn after 2s
- Invalid token: full-screen error variant — red icon, "This link has expired or is invalid", "Request a new link" button → ForgotPassword

### 6. VerifyEmail (deep link)

Entered from the verification email. The token is in the URL. On screen open, the app immediately calls the verify endpoint.

**Three distinct states**, each a full-screen layout:

- **verifying**: centered spinner, "Verifying your email…", no buttons
- **success**: large green checkmark icon (48pt), heading-2 "Email verified!", subcopy "You'll be redirected to sign in.", auto-redirect after 2s
- **error**: large red X icon, heading-2 "Verification failed", subcopy with the error message, then an inline form to re-request a verification email (email field + "Resend" button)

---

## Google sign-in

Available on SignIn AND SignUp. A second button below the primary submit, with a divider in between.

- Outline variant
- Full width
- "G" colored Google logo, 18pt, left of the label
- Label: "Continue with Google"

**Hidden** when the Google client ID env var is unset (i.e. dev environments without OAuth configured). Don't design a "Google sign-in unavailable" state — the button just doesn't render.

---

## Cross-cutting visual conventions

- All auth inputs are 48pt tall (slightly taller than the standard 44 — easier thumb targets on small phones).
- Inputs occupy full width (minus 16pt screen padding).
- Labels: caption-strong, 8pt above each input.
- Helper / error text: caption, 4pt below each input.
- All auth screens have the same brand strip at the top.
- Background: `background`. Cards or sections aren't needed — just plain text + inputs on the surface.
- Forms align to ~88pt safe top + brand strip.

---

## Language considerations

Serbian variants of "Forgot password?" / "Continue with Google" can be ~30% longer. Test your layouts with the longest reasonable Serbian copy — buttons should wrap or, if single-line, never overflow.

---

## Acceptance checklist

- [ ] All 6 screens designed in light + dark mode.
- [ ] All states per screen (default / loading / error / success / special variants) designed.
- [ ] Password visibility toggle states (hidden / shown) shown.
- [ ] Terms checkbox states (unchecked / checked / error) shown.
- [ ] Auto-redirect screens (Verify success, Reset success) annotated with the 2s delay.
- [ ] Resend countdown on CheckEmail shown.
- [ ] Google button hidden state noted (just doesn't render — no broken state).
- [ ] Deep-link entries (ResetPassword, VerifyEmail) annotated so dev knows these don't get a "back" affordance pointing into the app — they're entered from outside.
- [ ] Keyboard avoidance annotated (which fields auto-focus on screen open, return key behavior).
- [ ] Input attribute annotations (textContentType / autoComplete) on every field.
