# Boussole — Security Notes

This document describes the security posture of the Boussole app after the
hardening pass performed during the audit. It lists what has been fixed,
what remains, and the recommended next steps.

## 1. Threat model

Boussole is a React Native / Expo client paired with a small Express
backend. The client today calls the Groq API directly; the backend wraps
Anthropic Claude and exists for future migration. Attackers we care about:

- **Curious users** poking at the local app data.
- **Anyone who decompiles the APK/IPA** and extracts bundled strings.
- **Script kiddies** hitting the backend with volumetric abuse.
- **Prompt-injection abusers** trying to make the AI ignore its rules
  or exfiltrate the system prompt.

We do **not** currently defend against a sophisticated attacker who
physically owns a rooted device — that would require full storage
encryption (see §6).

## 2. What was fixed in this pass

### Client (`src/services/ai.ts`)

- **Profile whitelisting.** `nationality`, `situation`, and `language`
  are validated against allowlists (ISO code regex, enum membership)
  before being interpolated into the system prompt. This neutralizes
  prompt injection through user profile fields.
- **`sanitizeForPrompt()`** strips newlines, backticks, `${}`, angle
  brackets, and bracketed pseudo-tags like `[SYSTEM]` from any value
  that reaches the system prompt.
- **Input validation.** `callBoussoleAI` now rejects non-string and empty
  messages, and hard-caps user messages at `MAX_USER_MESSAGE_LEN = 1000`.
  The UI `maxLength={500}` is *not* trusted: a tampered bundle can send
  any length, so we enforce again at the network boundary.
- **History bounds.** Conversation history is capped at the last
  `MAX_HISTORY_MESSAGES = 20` messages, each truncated to
  `MAX_HISTORY_MESSAGE_LEN = 2000` chars, preventing runaway token cost
  via long histories.
- **`redactSecrets()`** scrubs anything matching `gsk_*`, `sk-*`, or
  `Bearer …` from log output. Network errors now log only `err.name`.
- **Error codes instead of raw messages.** Client errors are thrown as
  `NETWORK_ERROR`, `API_ERROR_<code>`, `INVALID_RESPONSE`, etc., so the
  UI never surfaces an upstream error body.

### Client (`src/constants/api.ts`)

- **Removed hardcoded dev IP `192.168.1.124`.**
- **Emulator-aware defaults.** Android emulator gets `10.0.2.2`,
  iOS gets `localhost`.
- **`EXPO_PUBLIC_API_URL` is now required in production builds**, and
  `resolveApiBaseUrl()` **throws at startup** if it's missing or not HTTPS.
  This prevents accidentally shipping a build that talks to a dev server
  or downgrades to HTTP.

### Backend (`backend/server.js`)

- **Fail-fast on missing `ANTHROPIC_API_KEY`** — `process.exit(1)` at
  startup rather than crashing mid-request.
- **`helmet()`** adds baseline security headers
  (X-Frame-Options, X-Content-Type-Options, HSTS, etc.).
- **Strict CORS** via `ALLOWED_ORIGINS` env var. Dev lets everything
  through; production allows only the exact allowlisted origins.
  Native apps (no `Origin` header) are allowed.
- **Body-size limit** of `16kb` on `express.json()` — payload-DoS shield.
- **Global rate limit**: 60 req/min/IP in prod, 300 in dev.
- **Chat-specific rate limit**: 10 req/min/IP in prod (the expensive path).
- **Input validation**:
  - `message` must be a non-empty string ≤ 1000 chars.
  - `language` is validated against the 5-language allowlist.
  - `cityId` is validated against `ALLOWED_CITY_IDS` — unknown values
    are dropped silently (no prompt injection via unvalidated strings).
- **Sanitized error responses.** `safeLog()` redacts keys from logs,
  and clients receive only `{ error: "Internal server error" }` for
  any failure. No stack traces or upstream messages leak.
- **Generic health endpoint**: `/api/health` no longer reports
  `process.env.NODE_ENV` back to unauthenticated callers.
- **Centralized error middleware** so CORS rejections return `403`
  cleanly instead of a 500 with a stack trace.
- **`unhandledRejection` / `uncaughtException` handlers** keep redacted
  log lines instead of dumping secrets to stdout.
- **`npm audit fix` applied**: 0 known vulnerabilities (was 3 before
  — high severity in `path-to-regexp` and `picomatch`, moderate in
  `brace-expansion`).

## 3. Known remaining risks

### 3.1 `EXPO_PUBLIC_GROQ_API_KEY` is bundled into the client

**Severity:** High — architectural.

Any variable prefixed `EXPO_PUBLIC_*` is inlined into the JavaScript
bundle that ships with the APK/IPA. Anyone who downloads the published
app can run it through a standard bundle extractor and read the key.

**Why we haven't fixed it yet.** The fix is a backend proxy (see §4).
The backend exists (`backend/server.js`) but currently uses Anthropic
Claude, not Groq. Migrating requires:

1. Adding a Groq endpoint to the backend *or* switching the backend to
   Groq entirely.
2. Updating `src/services/ai.ts` to `fetch(API_ENDPOINTS.chat)` instead
   of calling Groq directly.
3. Hosting the backend somewhere with HTTPS (Railway / Render / Fly).
4. Setting `EXPO_PUBLIC_API_URL` in production.

Until then: **rotate the Groq key regularly** and monitor usage at
https://console.groq.com/usage. Consider setting a monthly spend cap.

### 3.2 AsyncStorage is plaintext

**Severity:** Medium.

`@react-native-async-storage/async-storage` stores data in plaintext on
disk. On iOS this sits inside the app sandbox (not readable by other
apps without a jailbreak). On Android it's in the app's private
directory — also isolated unless the device is rooted.

What we store:
- `@boussole_profile` — nationality, situation, language, saved/completed
  guide IDs, optional city.
- `@boussole/ai_usage` — daily AI message counter.

None of this is authentication material or financial data, so the
exposure is limited to mild PII if a device is rooted/jailbroken.

**To improve:** migrate to [`expo-secure-store`](https://docs.expo.dev/versions/latest/sdk/securestore/)
which uses Keychain on iOS and EncryptedSharedPreferences on Android.
Requires adding the dep and a one-time migration path for existing
users.

### 3.3 Daily chat limit is client-side

**Severity:** Medium.

`ChatScreen.tsx` enforces a 20-message/day limit by reading a counter
from AsyncStorage. Anyone who clears app storage or edits the bundle
resets it. This matters today because the client pays for Groq tokens
via the exposed key.

**Fix** is tied to §3.1: once the backend proxy exists, move the limit
server-side and key it to a device fingerprint or an anonymous session
token.

### 3.4 No authentication

There is no account system. This is a deliberate product decision — the
app is designed to be usable without sign-up. It means backend calls
are unauthenticated by design, mitigated by rate limiting and strict
input validation.

## 4. Recommended next steps, in priority order

1. **Rotate the current Groq key** (it has been in a local `.env` since
   creation and the .env is gitignored, but the key itself is valid and
   will be bundled into any build produced from this repo).
2. **Backend proxy migration.** Add a Groq endpoint to `server.js`,
   point the client at it via `API_ENDPOINTS.chat`, delete the
   `EXPO_PUBLIC_GROQ_API_KEY` reference from the client. Set a hosted
   backend URL in `EXPO_PUBLIC_API_URL`.
3. **Move the 20/day limit to the backend**, keyed per anonymous session.
4. **Migrate profile storage to `expo-secure-store`** with a migration
   shim that reads old AsyncStorage data on first boot and moves it.
5. **Certificate pinning** for the backend call in production
   (`react-native-ssl-pinning` or a `fetch` wrapper that verifies the
   public key hash). Only worth doing after the backend migration.
6. **Set a Groq/Anthropic spend alert** in each provider's dashboard as
   a backstop in case rate limiting is bypassed.

## 5. Secrets hygiene

- `.env`, `.env.local`, `.env.*.local` are all in `.gitignore`.
- `git ls-files` confirms no `.env` file is tracked — only `.env.example`.
- If a secret is ever committed by mistake: rotate immediately, then
  rewrite history with `git filter-repo` (preferred over
  `git filter-branch`) and force-push with team coordination.

## 6. Reporting a vulnerability

If you find a security issue, please do **not** open a public GitHub
issue. Contact the maintainer privately and allow a reasonable window
to ship a fix before any disclosure.
