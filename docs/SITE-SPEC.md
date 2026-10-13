# Decouple site · build and housework spec

For Claude Code. Written 13 Oct 2026, from the design project. The owner is Ross. There is one login, Ross's. Domain: **decouple.uk** (already connected to Vercel). Contact: **hello@decouple.uk**.

---

## 1. What the site is

| Area | Who | What |
|---|---|---|
| **Public** | Anyone | `/`: the M02 guide's landing page, or the M01 holding page (switchable). `/privacy`. |
| **Testers** | Anyone with a tester code | Everything in the guide after the landing page. |
| **Owner** | Ross, signed in | Prototype hub, Marketing hub, Results, Site settings, Protos 01–10, and every other file. |

- The guide's landing page is public. Starting the guide needs a tester code, until the owner turns that off (`requireCode`). The page asks for the code; the server enforces it, because answers and email need a tester or owner session.
- Holding mode only changes `/`, which then shows the holding page. `/guide` always serves the guide file, so emailed guide links keep working. Without a code, nobody can start the guide there while `requireCode` is on.
- Discreet login: the login page is at `LOGIN_PATH` (default `/studio`) and nothing links to it. The one hidden way in: clicking the footer wordmark on the guide or the holding page three times goes to `/studio`, or to `/hub` if already signed in. A private path requested without a session returns a plain **404**, never a redirect to the login page, so private pages don't reveal that they exist.

## 2. Addresses

The files in `site/` keep their names, spaces and `·` included, because the pages link to each other by file name. The addresses below are aliases; each file's own path keeps working too, behind the same rules.

| Address | File in `site/` | Level |
|---|---|---|
| `/` | `Marketing 02 · Divorce Guide.html` or `Marketing 01 · Holding Page.html` (by mode, see §4) | Public |
| `/guide` | `Marketing 02 · Divorce Guide.html` | Public, always |
| `/holding` | `Marketing 01 · Holding Page.html` | Public |
| `/privacy` | `privacy.html` | Public |
| `/studio` | Login page (you build it, §8) | Public, unlinked |
| `/hub` | `Decouple · Prototype Hub.html` | Owner |
| `/hub/marketing` | `Decouple · Marketing Hub.html` | Owner |
| `/hub/results` | `Decouple · Results.html` | Owner |
| `/hub/site` | `Decouple · Site Settings.html` (site settings: public mode, tester codes, test mode) | Owner |
| `/p/01` … `/p/10` | `Proto 01 · Discover.html` … `Proto 10 · Dashboard.html` | Owner (testers too if `TESTERS_CAN_OPEN_PROTOS=true`) |

## 3. Sessions

- Cookies: `dc_owner` and `dc_tester`. Each is httpOnly, Secure, SameSite=Lax, Path=/ and lasts 30 days. Optionally a `dc_human` cookie (24h) after a Turnstile check.
- Value: `base64url(JSON{r, l, c, t, exp}).base64url(HMAC-SHA256)`, keyed with `SESSION_SECRET`. `r` is `"owner"`, `"tester"` or `"human"`. `l` is the tester code's label, which becomes the participant ID on every answer. `c` is the code itself, so that turning a code off ends its sessions: re-check `c` against the codes list on every `/api/answers` and `/api/session`. `t` = 1 for a **test code**.
- **Testing** (sent as `testing` in `/api/session`) is true when the owner is signed in with `testMode` on, or the tester session came from a test code. While testing, `/api/answers` and `/api/signup` reply 200 `{ok:true, test:true}` and save nothing. `/api/email` still sends.
- Owner password: compare against `OWNER_PASSWORD_HASH` (scrypt, with its salt stored alongside) using a constant-time compare. Wait about 800 ms on a failure. Add `npm run hash-password` to generate the hash.
- Tester codes: the "Codes" tab of the sheet (§6), read through the Google script and cached in memory for 60 seconds. Clear the cache on any `/api/admin/codes` change. `TESTER_CODES` (`CODE:label,CODE2:label2`) is a fallback when the script is unreachable. Codes don't depend on capitalisation. A code works if `active` is true and `expires` is empty or today or later. Each successful redeem calls the script's `code_used`, which adds 1 to `uses` and sets `last_used`.

## 4. Middleware (`middleware.ts`, Vercel Routing Middleware, Node runtime)

For each request:
1. **Allow straight through:**
   - `/api/*`: each function does its own checks.
   - `LOGIN_PATH`, `/holding`, `/privacy`, `/favicon.ico`.
   - Every path in `dist/_public.json`, which the build generates (§5).
2. **`/` or `/guide`:**
   - Read the site settings from Edge Config (`mode`, `requireCode`, `testMode`), cached for 60 seconds per instance. Defaults: `{ mode: "holding", requireCode: true, testMode: false }`.
   - If `?code=` is present: check it (§3). If it's valid, set `dc_tester` and send a 302 to `/` with the code removed. If not, send a 302 to `/?code_error=1`.
   - At `/`: serve the guide when mode = guide, or the request has a tester or owner session. Otherwise serve the holding page. `/guide` always serves the guide.
   - The owner can preview with `/?view=holding` or `/?view=guide`.
3. **Aliases:** rewrite the addresses in §2 to their files. The destinations need encoding, e.g. `/Decouple%20%C2%B7%20Results.html`.
4. **Everything else:** owner session required. Testers may open the proto files only if `TESTERS_CAN_OPEN_PROTOS=true`: the 10 Proto HTML files and everything under `proto/`. Without a session, return 404 with the 404 page.
5. **Headers on every response:**
   - `X-Robots-Tag: noindex, nofollow` on everything, for now.
   - `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, mic, geolocation off) and `X-Frame-Options: DENY`.
   - Private responses also get `Cache-Control: private, no-store`.

## 5. Build (`scripts/build.mjs` → `dist/`)

`site/` is plain HTML with in-browser Babel. The build makes it fast, without changing behaviour.

1. Copy `site/` to `dist/`.
2. **Compile JSX.** For every HTML file, compile each `<script type="text/babel" src>` and each inline `<script type="text/babel">` with esbuild: loader jsx, target es2019, minified.
   - **Wrap each one in an IIFE.** Every Babel script must keep its own scope. Files deliberately reuse names like `const { useState } = React`, and share things only through `window.*`.
   - Point the tag at the compiled `.js` file and remove the type. Keep the script order exactly as it is.
   - Remove the Babel standalone tag.
3. **React:** swap the unpkg development builds of React and ReactDOM 18.3.1 for the production builds. Serve them from the site, not unpkg: copy them from `node_modules` into `dist/vendor/`.
4. **Fonts:** self-host them instead of Google Fonts. That keeps visitor IPs away from Google, which matters for the privacy notice. Families and weights in use: Inter 400–700, Source Serif Pro 400/600/700 with italics, JetBrains Mono 400–600. Rewrite each `<link href="https://fonts.googleapis.com/...">` to a local `fonts.css`.
5. **Cache-busting:** add `?v=<content hash>` to every local JS and CSS reference. Serve `dist/**/*.{js,css,woff2,png}` with `Cache-Control: public, max-age=31536000, immutable` and HTML with `no-cache`.
6. **Public allow-list:** scan the guide, the holding page and the privacy page, after rewriting, for every local `src` and `href`, and every `url()` in their CSS. Write the list to `dist/_public.json`. The middleware imports it, so nothing else is public.
7. **Questions:** if `APPS_SCRIPT_URL` is set, fetch `?action=questions` and write `dist/m02/guide/questions.json` (an array of row objects keyed by the tab's column names). If the fetch fails or the tab is empty, leave the file out. The page then uses its built-in questions.
8. **Fail the build** if any HTML still contains `text/babel`, `unpkg.com` or `fonts.googleapis.com`, or if a local reference doesn't resolve.

Target: a Lighthouse mobile performance score of 90 or more for `/`.

## 6. Google script (`apps-script/Code.gs` + `apps-script/SETUP.md`)

- It's bound to Ross's existing results spreadsheet (Extensions › Apps Script) and deployed as a web app: Execute as me, Who has access: Anyone. Every call carries `secret` = `APPS_SCRIPT_SECRET`, checked first.
- **Tabs** are created with headers if they're missing:
  - `M02 Guide` and `Prototype testing`: `received_at, batch_key, sid, pid, test, step, price, landing, qid, qv, question, type, answer, device`
  - `Signups`: `received_at, email, stage, source, sid`
  - `Codes`: `code, label, active, test, expires, created, uses, last_used`
  - `M02 Questions`: the header `id, section, type, label, helper, options, show_if, required, max, exclusive, placeholder, skip, version, active`. Ross imports `site/m02/guide/questions-template.csv` into it once; SETUP.md says how.
  - Any other `test` value gets its own tab, named after it.
- **`doPost`, `kind: "answers"`:** take a `LockService` lock. Drop the batch if its `batch_key` was seen in the last 6 hours (CacheService). Otherwise append one row per answer to the test's tab. Return `{ok:true}`.
- **`doPost`, `kind: "signup"`:** append the sign-up to `Signups`.
- **`doPost`, `kind: "codes"`:** `op` is `create` (`codes:[{code,label,expires,test}]`; reject duplicates; sets `active` = TRUE, `created` = now, `uses` = 0), `update` (`code` plus any of `active`, `label`, `expires`, `test`), or `delete` (`code`; removes the row, but answers already given with it are kept). Returns the full list.
- **`doPost`, `kind: "code_used"`:** `{code}` → adds 1 to `uses` and sets `last_used` to now.
- **`doGet`:**
  - `action=codes` → every code, with all its columns. The API filters these for redeeming and shows the full list to the owner.
  - `action=questions` → the `M02 Questions` rows as objects.
  - `action=results&test=…&since=ISO` → the answer rows as objects, plus a signup summary `{count, byStage, byDay}`. **Email addresses are never returned.**
- `SETUP.md` gives Ross a click-by-click setup: paste the code, set the secret, deploy, copy the URL into Vercel, and a test with curl.
- The existing Google Form stays untouched as a backup.

## 7. API (`api/*.ts`, Vercel Functions, Node 20)

All JSON. Reject any body over 64 KB.

| Route | Who | In | Does | Out |
|---|---|---|---|---|
| `GET /api/session` | Anyone | — | Reads the cookies and site settings | `{owner, tester, human, testing, label?, mode, requireCode, turnstileSiteKey}` |
| `POST /api/login` | Anyone | `{password}` | §3 | 200 and sets `dc_owner`, or 401 |
| `POST /api/logout` | Anyone | — | Clears `dc_owner` and `dc_tester` | 200 |
| `POST /api/tester` | Anyone | `{code}` | Checks the code (§3) | 200 `{label}` and sets `dc_tester`, or 404 |
| `POST /api/human` | Anyone | `{token}` | Verifies the Turnstile token | 200 and sets `dc_human`, or 403 |
| `POST /api/answers` | Owner or tester; or human, when `requireCode` is off | `{batchKey, sid, pid?, test, step, price?, landing?, device, hp, rows:[{qid, qv, q, type, a}]}` | Validates and cleans (below), then sends to the Google script | 200 `{ok}` only after the script confirms. 400 bad shape, 401 no session, 502 script failed. |
| `POST /api/signup` | Human | `{email, stage?, source, sid, hp}` | Checks the email, then sends `kind: "signup"`. Sources: `holding:<utm_source>`, `guide`, `guide-optin`. `stage` can be a `;` list. | 200, 400 or 403 |
| `POST /api/email` | Same as `/api/answers` | `{email, link, sid}` | Sends the guide email (below) | 200, 400, 401 or 429 |
| `GET /api/results` | Owner | `?test=&since=` | Passes the request to `action=results` | `{rows:[{sid,pid,test,step,price,landing,qid,qv,q,type,a,at,device}], signups}` |
| `GET` and `POST /api/admin/site` | Owner | `{mode?: "guide"\|"holding", requireCode?: boolean, testMode?: boolean}` | Reads or writes the Edge Config items through the Vercel REST API (`EDGE_CONFIG_ID`, `VERCEL_API_TOKEN`) | `{mode, requireCode, testMode}` |
| `GET` and `POST /api/admin/codes` | Owner | POST: `{action: "create", codes:[{code, label, expires, test}]}`, `{action: "update", code, active?, label?, expires?, test?}` or `{action: "delete", code}` | Passes the change to the script's `kind: "codes"` (GET reads `action=codes`). On create, check the format `^[A-Z]{2,6}-[A-Z]{2,6}-\d{2}$`, labels of 40 characters at most, and at most 20 codes per request. The page makes the code strings. | `{codes:[{code,label,active,test,expires,created,uses,last_used}]}` |
| `POST /api/admin/publish` | Owner | — | Calls `DEPLOY_HOOK_URL`, which rebuilds and so picks up edited questions | `{ok}` |

**Cleaning answers:**
- If `hp` (a hidden trap field) isn't empty, return 200 and drop the batch.
- At most 80 rows. Each `a` at most 2,000 characters, with control characters removed.
- **Never store** any row whose `qid` is in `safe`, `safe2`, `name_me` or `name_them`, or contains `email`. Strip these server-side even though the pages already never send them.
- `pid`: the client's `pid` (trimmed to 40 characters) when the session is the owner's, because testing-mode sessions type in a participant ID. Otherwise the tester's label, or `"anon"`.
- `test` must be `M02 Guide`, `Prototype testing` or `M01 Holding`. Return 400 for anything else; new tests are added here deliberately.

**Rate limits:** at most 120 answer batches per hour per session, and 3 emails per `sid` per day. In-memory is fine for now, because sessions already gate it.

**The guide email (Resend):**
- From `MAIL_FROM` (`Decouple <hello@decouple.uk>`), reply-to `hello@decouple.uk`.
- **Subject: "Your guide"**, discreet on purpose, since a shared inbox could put someone at risk.
- `link` must start with `SITE_ORIGIN + "/"` and be under 8 KB; the answers travel in the link's `#` part.
- The body is a fixed template. Only the link varies, so nobody can send arbitrary content through our domain. It holds:
  - the wordmark;
  - "Here's the guide you made. It opens on this device or any other.";
  - one button, "Open your guide";
  - a line: "If someone else reads your email, you can delete this message. The guide isn't stored by us.";
  - the footer: "Decouple is not a law firm. This guide is not legal advice."
- Plain, accessible HTML plus a text version.

## 8. The only UI you build

The design project owns every other page. The client side of the API is `site/shared/dc-site.js`: it shows exactly what the pages send and expect, and it keeps unsent batches in `decouple.outbox.v1`, retrying them. The Turnstile script is added by JavaScript only when it's needed, never in the HTML. You build:
- **`/studio` (login):**
  - Copy the look of the Results lock screen in `site/results/r.css` (`.r-lock`, `.r-lock-c`): a dark background, a white card, Source Serif heading "Sign in", one password field, a button, and an error line.
  - Afterwards go to `?next=` (same-site paths only) or `/hub`.
  - noindex. No mention of what's behind it.
- **404 page:** the same type, light background. Text: "This page doesn't exist." Link: "Go to Decouple".

## 9. Environment variables (Vercel; never in git)

`SITE_ORIGIN=https://decouple.uk` · `LOGIN_PATH=/studio` · `OWNER_PASSWORD_HASH` · `SESSION_SECRET` (32+ random bytes) · `TESTER_CODES` (fallback) · `TESTERS_CAN_OPEN_PROTOS=false` · `APPS_SCRIPT_URL` · `APPS_SCRIPT_SECRET` · `RESEND_API_KEY` · `MAIL_FROM` · `TURNSTILE_SITE_KEY` · `TURNSTILE_SECRET_KEY` · `EDGE_CONFIG` (the connection string, added when the store is connected) · `EDGE_CONFIG_ID` · `VERCEL_API_TOKEN` (scoped to this project) · `DEPLOY_HOOK_URL`.

**Remove** from the production environment: `TINK_CLIENT_ID`, `TINK_CLIENT_SECRET` and `ANTHROPIC_API_KEY`. Ask Ross first. Suggest rotating them, since the app is retired.

## 10. Things to tell Ross

- **Vercel's Hobby plan is for non-commercial use only.** A company's marketing and testing site should be on Pro ($20 a month).
- **Resend:** add decouple.uk in Resend, then add its DNS records (SPF, DKIM, and DMARC on `_dmarc`). If Vercel manages the DNS, they go in Vercel › Domains.
- **hello@decouple.uk needs a real mailbox** to receive replies, from any provider. Resend only sends.
- Protos 08 and 10 call `window.claude.complete`, which exists only inside the design tool. On the site, check those features fail quietly, and list where they do. Don't fix the pages: report back. A small owner-only `/api/claude` proxy is a possible next step; don't build it now.

## 11. Checks before merging (in the Vercel preview)

1. Logged out: `/` shows the holding page, which is the default mode. `/hub`, `/hub/results` and `/Proto%2001%20%C2%B7%20Discover.html` all return 404. So do `/results/r-app.jsx` and `/proto/ut/ut.js`.
2. Owner signs in at `/studio`, then `/hub`, `/hub/marketing`, `/hub/results`, `/hub/site` and every proto open with no failed requests in the console.
   - Site settings: make a code, copy its link, open the link in a private window, start the guide, then turn the code off. Within a minute the next answer gets 401 and `/api/session` says `tester: false`.
   - Turn test mode on, finish a guide step, and check the sheet gets no rows. Do the same with a test code.
3. Owner sets mode = guide through `POST /api/admin/site`. Logged out, `/` now shows the guide's landing page with no failed requests. Every request it makes is in `_public.json`.
4. `/?code=<valid>` sets `dc_tester` and redirects to `/`. An invalid code redirects to `/?code_error=1`.
5. `/api/answers` without a session → 401. With one → the rows land in the right tab, and the blocked fields are stripped. Sending the same `batchKey` twice → one set of rows.
6. `/api/email` sends to Ross's address. Check the subject and template, and the 429 on the fourth email.
7. `dist/` has no `text/babel`, `unpkg.com` or `fonts.googleapis.com`. Lighthouse mobile on `/` scores 90 or more.
8. The headers in §4 are present. Private responses aren't cached.

Then switch mode back to **holding** before the production deploy. The guide goes public only when the next export lands, with consent and the tester-code screen.

## 12. Repo housework

1. Note the current `main` commit. Tag it `app-v1-final`, create the branch `archive/app-v1` from it, and push both. **Show Ross the commit and the links, and wait for his OK.**
2. On a new branch `site-v1`, remove the old app files from the tree. Their history stays in the tag and the branch. Add the new layout:
```
site/              ← from this zip, unchanged
api/               ← §7
lib/               ← cookies, codes, cleaning, the script client, Edge Config (pure, testable)
middleware.ts      ← §4
scripts/build.mjs  ← §5
scripts/hash-password.mjs
apps-script/Code.gs, SETUP.md
pages-src/studio.html, 404.html   ← §8, copied into dist by the build
tests/             ← vitest: signing, cleaning, the allow-list, code checks, the build transform on a fixture page
vercel.json        ← buildCommand, outputDirectory "dist", headers, cleanUrls false
package.json, tsconfig.json, .gitignore, .github/workflows/ci.yml
README.md, CLAUDE.md, SYNC.md, ARCHIVE.md, docs/SITE-SPEC.md (this file)
```
3. CI: install, typecheck, test, build, Gitleaks.
4. `ARCHIVE.md`: what the old app was, where it lives (tag and branch), and that it isn't to be revived without a decision.
5. `CLAUDE.md` (new): what the repo is, the rule that **`site/` is read-only, exported from the design project, and changed only through `SYNC.md`**, how to run the site locally, and where the spec is.
6. `SYNC.md`: how a new export lands:
   - replace `site/` with the export's copy;
   - run the build and the tests;
   - check §11 points 1 to 3;
   - open a PR named `sync: design export <date>`.
7. Vercel: the project that serves decouple.uk.
   - Settings: Framework Other, Build `node scripts/build.mjs`, Output `dist`, Node 20.
   - Create an Edge Config store, connect it to the project, and seed it with `{ "mode": "holding", "requireCode": true }`.
   - Create the deploy hook and add the environment variables.
   - Make decouple.uk the primary domain and redirect www and `*.vercel.app` to it.
   - Tell Ross exactly what to click if you can't do it yourself.
8. Open the PR and run §11 on the preview. **Wait for Ross's OK**, then merge and check production.
9. Write `docs/HANDOFF-SITE-1.md` in under 25 lines: what works, what Ross still has to do (the script deploy, Resend DNS, the mailbox, the plan), anything in `site/` that failed, and what comes next.
