# Vercel: what to click

The project that serves decouple.uk is the one already connected to this repository. One action per line.

## Project settings

1. Vercel › the project › Settings › General.
2. Framework Preset: Other. Build Command: `node scripts/build.mjs`. Output Directory: `dist`. Install Command: leave default. Save.
3. Node.js Version: 22.x. Save. (`package.json` also says `22.x`.)
4. Settings › Environment Variables: make sure `NODE_ENV` is not set. The build needs the dev dependencies.

## Global Config (the mode, code and test-mode switches)

Vercel renamed Edge Config to Global Config in 2026; the spec's "Edge Config" is this store. It is a Vercel-native store, not a marketplace one, so it may sit above or beside the marketplace list.

1. Vercel › Storage › Create Database › **Global Config**. Name it `decouple-site`. Create.
2. On the store's page: Connect Project › choose the project › Production and Preview › Connect. This adds `GLOBAL_CONFIG` to the project.
3. Items tab › edit and paste: `{ "mode": "holding", "requireCode": true, "testMode": false }` › Save Items.
4. Open https://vercel.com/account/tokens (the Tokens page of your personal account; the switcher at the top left must show your account, not the team). Create: name `decouple-site settings`, Scope: the team `rossdelarge247-debug's projects`, then the project `decouple-prototype-01`, expiry as you like. Copy the `vcp_…` value once, for `VERCEL_API_TOKEN`. It lives only in Vercel's environment variables.
5. `VERCEL_TEAM_ID` = `team_Z76rAImaSJeB08jfbq6gIvGo`. With a team- or project-scoped token Vercel infers the team, so this is a belt-and-braces setting; with a full-account token it is required.
6. `GLOBAL_CONFIG_ID` is optional: the site reads the store ID from the `GLOBAL_CONFIG` connection string the Connect step added.

## Deploy hook (Publish questions)

1. Settings › Git › Deploy Hooks › Create Hook. Name `publish questions`, branch `main`. Copy the URL for `DEPLOY_HOOK_URL`.

## Environment variables

https://vercel.com/rossdelarge247-debugs-projects/decouple-prototype-01/settings/environment-variables, each for Production and Preview:

`SITE_ORIGIN` `https://decouple.uk` · `LOGIN_PATH` `/studio` · `OWNER_PASSWORD_HASH` from `npm run hash-password` · `SESSION_SECRET` from `openssl rand -hex 32` · `TESTER_CODES` (optional fallback) · `TESTERS_CAN_OPEN_PROTOS` `false` · `APPS_SCRIPT_URL` and `APPS_SCRIPT_SECRET` from `apps-script/SETUP.md` · `RESEND_API_KEY` · `MAIL_FROM` `Decouple <hello@decouple.uk>` · `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` from Cloudflare › Turnstile › Add widget (domain decouple.uk, managed mode) · `VERCEL_API_TOKEN` · `VERCEL_TEAM_ID` · `DEPLOY_HOOK_URL` (`GLOBAL_CONFIG` comes from the Connect step; `GLOBAL_CONFIG_ID` only if you prefer to set it by hand).

Then remove `TINK_CLIENT_ID`, `TINK_CLIENT_SECRET` and `ANTHROPIC_API_KEY` from Production, and rotate them at Tink and Anthropic: the app that used them is retired. Deployments › the latest › Redeploy, so the functions pick everything up.

## Checking the connections

Signed in, open `/api/admin/diagnose` on the site. It lists which variables are present and missing, reads the Global Config store, checks the API token can reach it, calls the Google script, and says what the switches still need. It never shows a value. If a switch fails with "Couldn't reach the site", this page says why.

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
