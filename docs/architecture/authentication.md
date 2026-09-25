<!--
SCOPE: authentication and session design, flows, crypto, and abuse controls
DOC_KIND: explanation
DOC_ROLE: canonical
READ_WHEN: you touch login, sessions, tokens, 2FA, or anything security-sensitive
SKIP_WHEN: your change does not involve identity or credentials
PRIMARY_SOURCES: apps/api/src/modules/auth, packages/db/src/schema, packages/shared/src/auth.ts
-->

# Authentication

## Session design

| Element         | Design                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cookie          | `groundwork_session`, sealed with iron-session (`SESSION_SECRET`). HttpOnly, SameSite=Lax, Secure in production, path `/`. Holds identifiers only: `sessionId`, `userId`, or a pending `twoFactorChallenge`. |
| Registry        | `auth_sessions` table: user, IP, user agent, `lastActivityAt`, `expiresAt`, `revokedAt`. The row, not the cookie, decides validity.                                                                          |
| Lifetimes       | Browser-session cookie with a 12 hour idle expiry that slides on activity. "Remember me": persistent cookie, 30 day session. Sliding never shortens a remember-me session.                                   |
| Activity writes | At most one write per minute per session (`recordActivity`).                                                                                                                                                 |
| Revocation      | Logout revokes the row. Password reset revokes every session of the user. A stolen cookie dies with its row.                                                                                                 |
| Guard           | `@Authenticated()` applies `SessionGuard`: unseal cookie, load the active row, record activity, attach `request.auth`.                                                                                       |

Constants live in `apps/api/src/modules/auth/auth.constants.ts`.

## Flows

**Signup and email verification**

1. `POST /auth/signup`: argon2id hash, insert user (unique on lower-cased email), store a SHA-256 hashed verification token (24 h), register the `verify_email` job after commit. Response `201 { status: 'verification_required' }`, no session.
2. Worker sends the link `WEB_PUBLIC_URL/verify-email?token=...`.
3. The web page calls `POST /auth/email/verify` server-side. The token is consumed, with every other open verification token of the user.
4. `POST /auth/email/resend` always answers `202`.

**Login without 2FA**

1. `POST /auth/login` looks the user up and always runs one argon2 verification, even for unknown emails (constant-time behavior).
2. Wrong email or password: `401 auth.invalid_credentials` in both cases. Unverified email: `403 auth.email_not_verified`.
3. Success: create an `auth_sessions` row, set the cookie, return the profile.

**Login with 2FA**

1. Credentials are valid and a confirmed TOTP credential exists: the cookie receives a 10 minute `twoFactorChallenge` and the response is `{ status: 'two_factor_required' }`. No session exists yet.
2. `POST /auth/login/two-factor` with `code` (TOTP, one step of clock tolerance) or `recoveryCode` (single use). Success opens the session with the "remember me" choice made at step 1.

**2FA management** (authenticated)

| Endpoint                        | Behavior                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/two-factor/setup`   | New secret stored encrypted with `enabledAt = null`; returns the secret and `otpauth://` URL (the web renders the QR code server-side). |
| `POST /auth/two-factor/enable`  | Requires a valid code for the pending secret. Enables it, replaces 10 recovery codes (returned once, stored hashed), emails a notice.   |
| `POST /auth/two-factor/disable` | Requires password and a current code. Deletes the credential and codes, emails a notice.                                                |

**Password reset**

1. `POST /auth/password/forgot` always answers `202`. For a known account it consumes older reset tokens and emails a new one (1 h).
2. `POST /auth/password/reset` validates the token, sets the new hash, marks the email verified, consumes the tokens, and revokes all sessions.

## Cryptography

| Secret                       | Protection                                                                     | Code                                  |
| ---------------------------- | ------------------------------------------------------------------------------ | ------------------------------------- |
| Password                     | argon2id (19 MiB, t=2, p=1)                                                    | `services/password-hasher.service.ts` |
| Email tokens, recovery codes | 256-bit random / 40-bit typable codes, stored as SHA-256                       | `shared/crypto/tokens.ts`             |
| TOTP secret                  | AES-256-GCM, versioned `v1.iv.tag.ciphertext`, key `TWO_FACTOR_ENCRYPTION_KEY` | `shared/crypto/secret-box.ts`         |
| Session cookie               | iron-session seal (`SESSION_SECRET`, 32+ chars)                                | `session/session-cookie.service.ts`   |

## Abuse controls

| Control             | Detail                                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account enumeration | Same error for unknown email and wrong password; dummy argon2 verification; `202` for resend and forgot. Signup does report `409 auth.email_already_registered`, a deliberate UX tradeoff.              |
| Rate limiting       | Global 300 requests per minute per client. `@AuthThrottle()` on signup, login, 2FA, resend, forgot, reset, enable, disable: `AUTH_THROTTLE_LIMIT` (default 10) per 15 minutes. Redis-backed.            |
| Client identity     | The BFF forwards `x-client-ip` and `x-client-user-agent`. The API trusts them only when `TRUST_CLIENT_IP_HEADER=true`, which is safe only when the API is reachable exclusively through the web server. |
| Redirects           | Post-login destinations pass through `safeRedirectPath` (same-origin relative paths only).                                                                                                              |

## BFF cookie relay

The API sets the cookie on its own response. `callApi(..., { relaySessionCookie: true })` re-emits it on the web origin with `applySessionSetCookies`, preserving `Max-Age` (persistent) or its absence (browser session). Logout also calls `clearSessionCookie`. `src/proxy.ts` only checks cookie presence; `requireUser()` asks the API.
