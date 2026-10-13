# Vercel: what to click

The project that serves decouple.uk is the one already connected to this repository. One action per line.

## Project settings

1. Vercel › the project › Settings › General.
2. Framework Preset: Other. Build Command: `node scripts/build.mjs`. Output Directory: `dist`. Install Command: leave default. Save.
3. Node.js Version: 22.x. Save. (`package.json` also says `22.x`.)
4. Settings › Environment Variables: make sure `NODE_ENV` is not set. The build needs the dev dependencies.

## Edge Config (the mode, code and test-mode switches)

1. Vercel › Storage › Create Database › Edge Config. Name it `decouple-site`. Create.
2. On the store's page: Connect Project › choose the project › Production and Preview › Connect. This adds `EDGE_CONFIG` to the project.
3. Items tab › edit and paste: `{ "mode": "holding", "requireCode": true, "testMode": false }` › Save Items.
4. Copy the store ID (starts with `ecfg_`) for `EDGE_CONFIG_ID`.
5. Account › Settings › Tokens › Create: name `decouple-site settings`, scope the project, expiry as you like. Copy it for `VERCEL_API_TOKEN`.
6. If the project is in a team, copy the team ID from Team Settings › General for `VERCEL_TEAM_ID`.

## Deploy hook (Publish questions)

1. Settings › Git › Deploy Hooks › Create Hook. Name `publish questions`, branch `main`. Copy the URL for `DEPLOY_HOOK_URL`.

## Environment variables

Settings › Environment Variables, each for Production and Preview:

`SITE_ORIGIN` `https://decouple.uk` · `LOGIN_PATH` `/studio` · `OWNER_PASSWORD_HASH` from `npm run hash-password` · `SESSION_SECRET` from `openssl rand -hex 32` · `TESTER_CODES` (optional fallback) · `TESTERS_CAN_OPEN_PROTOS` `false` · `APPS_SCRIPT_URL` and `APPS_SCRIPT_SECRET` from `apps-script/SETUP.md` · `RESEND_API_KEY` · `MAIL_FROM` `Decouple <hello@decouple.uk>` · `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` from Cloudflare › Turnstile › Add widget (domain decouple.uk, managed mode) · `EDGE_CONFIG_ID` · `VERCEL_API_TOKEN` · `VERCEL_TEAM_ID` (team only) · `DEPLOY_HOOK_URL`.

Then remove `TINK_CLIENT_ID`, `TINK_CLIENT_SECRET` and `ANTHROPIC_API_KEY` from Production, and rotate them at Tink and Anthropic: the app that used them is retired. Deployments › the latest › Redeploy, so the functions pick everything up.

## Domain

1. Settings › Domains: decouple.uk is the primary domain; `www.decouple.uk` redirects to it (Edit › Redirect to decouple.uk, 308).
2. The `*.vercel.app` address: Settings › Domains › the vercel.app entry › Edit › Redirect to decouple.uk.

## Resend and the mailbox

1. Resend › Domains › Add Domain › `decouple.uk` › region EU.
2. Add the records it shows (SPF `TXT`, DKIM `TXT`, and `_dmarc` `TXT` with `v=DMARC1; p=none`) where the DNS lives: if Vercel manages it, Vercel › Domains › decouple.uk › DNS Records.
3. Resend › API Keys › Create › sending access, domain decouple.uk. Copy for `RESEND_API_KEY`.
4. hello@decouple.uk needs a real mailbox to receive replies, from any provider; Resend only sends.

## Plan

Vercel's Hobby plan is for non-commercial use only. Settings › Billing › upgrade to Pro ($20 a month) before the site is used for the business.
