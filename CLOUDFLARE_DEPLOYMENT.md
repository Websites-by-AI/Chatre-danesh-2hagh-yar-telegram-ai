# Secure Cloudflare Pages deployment

This project supports Cloudflare Pages Functions through `functions/api/[[path]].ts` and uses the D1 binding named `DB` from `wrangler.json`.

## 0. Revoke the credentials exposed in chat

Before deploying, revoke and regenerate every exposed GitHub, Hugging Face, Cloudflare, R2, Telegram, and Bale credential. Do not paste replacements into chat, source code, build logs, or `.env` files committed to Git.

Cloudflare API tokens and GitHub PATs are deployment credentials; they are **not** application runtime variables. R2 credentials are not currently used by this codebase and should not be attached to the application.

## 1. Connect the repository

In Cloudflare Dashboard:

1. Open **Workers & Pages → Create → Pages → Connect to Git**.
2. Authorize Cloudflare's GitHub App for this repository. Do not use a personal access token as an application secret.
3. Production branch: `main`.
4. Build command: `npm run build`.
5. Build output directory: `dist`.
6. Node version: 20 or 22.

The build now runs TypeScript checking first, so a broken bundle cannot be published silently.

## 2. Bind D1

The expected binding is:

- Variable name: `DB`
- Database name: `taranom-mehr-db`

The current `wrangler.json` contains a database ID. Verify that this database belongs to the intended account. If not, create/select the correct database and replace the ID in `wrangler.json`.

Initialize or migrate the production database from a trusted local terminal authenticated to Cloudflare. The schema is idempotent and now includes the shared `study_plans` table used to synchronize counselor and student panels:

```bash
npx wrangler d1 execute taranom-mehr-db --remote --file=./schema.sql
```

Alternatively, paste `schema.sql` into the D1 dashboard console. Re-run this migration for an existing database before deploying the new application code.

### Create the first administrator

Registration deliberately creates only `student` accounts. Register the intended admin normally, then promote that exact account in the D1 console:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'ADMIN_EMAIL_HERE';
```

Verify the result:

```sql
SELECT id, name, email, mobile, role FROM users WHERE role = 'admin';
```

Promote verified counselor accounts in the same controlled way:

```sql
UPDATE users SET role = 'counselor' WHERE email = 'COUNSELOR_EMAIL_HERE';
```

Never add a public endpoint that allows users to choose or promote their own role. A counselor/admin session can publish a plan for a registered student; that student receives the same plan from D1 after login, including after a refresh or on another device.

## 3. Configure runtime secrets

Open **Pages project → Settings → Variables and Secrets**. Add sensitive values as encrypted **Secrets** for Production (and separate Preview values if needed).

### Secrets used by the app

- `GEMINI_API_KEY` — optional Gemini provider key
- `OPENROUTER_API_KEY` — optional OpenRouter fallback
- `HF_TOKEN` — Hugging Face inference token
- `WANDB_API_KEY` — optional W&B integration
- `TELEGRAM_BOT_TOKEN` — Telegram bot API token
- `BALE_BOT_TOKEN` — Bale bot token
- `ZARINPAL_MERCHANT_ID` — production payment merchant ID

### Plain configuration variables

- `HF_MODEL` — e.g. `meta-llama/Llama-3.3-70B-Instruct:featherless-ai`
- `EXAM_RAG_URL` — deployed RAG service URL
- `APP_URL` — canonical HTTPS site origin
- `ZARINPAL_CALLBACK_URL` — `${APP_URL}/api/payment/verify`

### Do not configure on Cloudflare Pages

- GitHub personal access tokens
- Cloudflare account API token
- R2 S3 access key/secret (R2 is not used by this repository)
- `CF_ACCOUNT_ID`, `D1_DATABASE_ID`, or `D1_API_TOKEN` when the native `DB` binding is available
- `DEV_AUTH_CODES=true`
- Any secret prefixed with `VITE_`, `NEXT_PUBLIC_`, or otherwise bundled into browser code

`DEV_AUTH_CODES` must remain unset or `false` in Production. Until a real SMS provider is implemented, users should sign in with password; the OTP endpoint returns 503 rather than exposing a code.

## 4. Configure bot webhooks after deployment

Use the newly rotated bot tokens from your own terminal. Never save the command with a literal token in shell history; load it from a temporary environment variable or secret manager.

Endpoints implemented by this project:

- Telegram: `https://YOUR_DOMAIN/api/telegram-webhook`
- Bale: `https://YOUR_DOMAIN/api/bale-webhook`

Review provider documentation for setting webhooks. The bot tokens belong only in Cloudflare encrypted secrets and the one-time provider setup request.

## 5. Deploy and verify

Push the reviewed code to `main`; Cloudflare's Git integration will build and deploy it.

Smoke checks:

```bash
curl -i https://YOUR_DOMAIN/api/health
curl -i https://YOUR_DOMAIN/api/ai-status
curl -i https://YOUR_DOMAIN/api/hf-status
curl -i https://YOUR_DOMAIN/api/auth/list
```

Expected behavior:

- Health endpoints return 200.
- Anonymous `/api/auth/list` returns 401.
- Opening `/admin` anonymously shows login, not the admin dashboard.
- A student login cannot become admin by selecting the admin tab.
- A D1 account explicitly assigned `role='admin'` can sign in and load `/admin`.
- `/blog`, `/download`, `/study-planner`, and generated study plans render without `ReferenceError`.

## 6. Recommended production follow-ups

Before enabling OTP login:

1. Add a real Iranian SMS provider.
2. Store only hashed OTP values.
3. Add per-IP and per-mobile rate limits and attempt counters.
4. Keep OTPs single-use (the current patch deletes a code after successful verification).

Also configure Cloudflare WAF/rate-limit rules for `/api/auth/login`, `/api/auth/register`, `/api/auth/otp-send`, `/api/auth/otp-verify`, AI endpoints, and bot webhooks.
