# PayFlow – QA automation interview sandbox

A deliberately "legacy" Next.js app for QA automation interviews. Candidates write automated tests against it.
The code is intentionally inconsistent. Don't clean it up: that's the point.

## Flows

| Flow | Route |
|---|---|
| Register (sends a confirmation email) | `/register` → email link → `/verify?token=…` |
| Login | `/login` (demo: `demo@payflow.test` / `Demo1234!`, comes with 12 seeded payments) |
| Dashboard (stats, recent payments) | `/dashboard` |
| Create payment (validated form, sends claim-code email) | `/dashboard/payments/new` |
| Payments table (search, filter, sort, paging, actions) | `/dashboard/payments` |
| Edit pending payment (new code is emailed if the recipient email changes) | `/dashboard/payments/:id/edit` |
| Public claim page (6-digit OTP, then name + bank account, more than 8 characters) | `/claim` or `/claim?code=123456` |
| Dev mailbox (only when `RESEND_API_KEY` is **not** set) | `/mailbox` |

Payment lifecycle: `pending` → `claimed` (recipient claims with OTP) → `completed` (sender), or `pending` → `cancelled`.

## What makes it hard to test (interviewer notes)

- **Locators vary by page.** Login has `data-testid`s and ids. Register has none: labels are `<div>`s, inputs only have `name`, and the submit "button" is a `<div>`. The payment form mixes testids, stable ids, React `useId` ids (unstable), name-only fields and placeholder-only fields.
- **Custom dropdowns** (payment method, priority) are `div`/`ul`/`li` widgets, not `<select>`. Other fields use native selects.
- **Dynamic fields:** State/Province appears only for US/CA. Description becomes required for category "Other". The ZIP rule depends on the country.
- **Validation:** blur validation on email/amount/zip only, full validation on submit, an error summary banner, and server-side 422 errors are mirrored.
- **Legacy table:** rows are built with `innerHTML` and use event delegation. Row ids are index-based (`row_0`…). Action links are `javascript:void(0)`. Search is debounced. The table auto-refreshes every 15s.
- **Native dialogs:** Cancel uses `window.confirm` and then `window.prompt`. "Clear form" uses `confirm`. "Forgot password" uses `alert`. Set complete uses a custom modal instead.
- **Timing:** every API call has a random 300–1800 ms delay. Toasts disappear after 3s.
- **Email:** OTP and verification links must be read from the inbox (Mailinator) or from `/mailbox`. In the email, the OTP sits in `#otp-code` and the verify link is `#verify-link`.
- **OTP input** is 6 separate boxes with auto-advance. Pasting into the first box fills all six.
- Each candidate should register their own user. Payments are scoped per user.

## Local

```bash
npm install
npm run dev
```

With no env vars set, data is in memory (it resets on restart) and emails go to `/mailbox` instead of being sent (until `RESEND_API_KEY` is set, e.g. in `.env.local`).

## Deploy to Vercel (free)

1. Push the repo and import it in Vercel.
2. **Storage:** In the project, open Storage → Marketplace → **Upstash (Redis)**, free plan, then connect it to the project. This sets `TESTING_KV_REST_API_URL` / `TESTING_KV_REST_API_TOKEN` automatically (with the `TESTING` prefix).
   The in-memory store is *not* reliable on Vercel: instances don't share memory and get recycled, so data would randomly disappear.
3. **Email:** Create an API key at https://resend.com/api-keys and set `RESEND_API_KEY` and `MAIL_FROM`.
   With the default sender `onboarding@resend.dev`, Resend only delivers to your own account email.
   To deliver to `@mailinator.com` inboxes, verify a domain in Resend and set `MAIL_FROM` to an address on it.
4. Set `SESSION_SECRET`. Optionally set `APP_URL` and `RESET_SECRET`.

Reset all data: `curl -X POST https://<app>/api/admin/reset -H "x-reset-secret: $RESET_SECRET"` (the demo data is re-seeded on the next request).
