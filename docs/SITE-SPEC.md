# Decouple site · build and housework spec

For Claude Code. Owned by the design project; last updated 16 Oct 2026 (export `2026-10-16c`). Changes since the last export are listed in that export's `CHANGES.md`. The owner is Ross. There is one login, Ross's. Domain: **decouple.uk** (already connected to Vercel). Contact: **hello@decouple.uk**.

---

## 1. What the site is

| Area | Who | What |
|---|---|---|
| **Public** | Anyone | `/`: the M02 guide's landing page, or the M01 holding page (switchable). `/privacy`. `/about`. `/help`, the help and support hub (Marketing 03). |
| **Testers** | Anyone with a tester code | Everything in the guide after the landing page. If their code has a `track`, also the participant hub (`/take-part`) and the prototypes in that track. Never the hubs. |
| **Owner** | Ross, signed in | Prototype hub, Marketing hub, Results, Site settings, Protos 01–10, MVP 00–08, and every other file. |

- The guide's landing page is public. Starting the guide needs a tester code, until the owner turns that off (`requireCode`). The page asks for the code; the server enforces it, because answers and email need a tester or owner session.
- Holding mode only changes `/`, which then shows the holding page. `/guide` always serves the guide file, so emailed guide links keep working. Without a code, nobody can start the guide there while `requireCode` is on.
- Discreet login: the login page is at `LOGIN_PATH` (default `/studio`) and nothing links to it. The one hidden way in: clicking the footer wordmark on the guide or the holding page three times goes to `/studio`, or to `/hub` if already signed in. A private path requested without a session returns a plain **404**, never a redirect to the login page, so private pages don't reveal that they exist.

## 2. Addresses

The files in `site/` keep their names, spaces and `·` included, because the pages link to each other by file name. The addresses below are aliases; each file's own path keeps working too, behind the same rules. Single-segment aliases (`/`, `/guide`, `/holding`, `/privacy`, `/help`, `/hub`) **rewrite**. Aliases with a path segment (`/hub/marketing`, `/hub/results`, `/hub/site`, `/p/01` to `/p/10`) **redirect** to the file's own path: pages load assets by relative path and route with `location.hash`, so a rewrite would break them, and a `<base>` tag would break their `#` links.

| Address | File in `site/` | Level |
|---|---|---|
| `/` | `Marketing 02 · Divorce Guide.html` or `Marketing 01 · Holding Page.html` (by mode, see §4) | Public |
| `/guide` | `Marketing 02 · Divorce Guide.html` | Public, always |
| `/holding` | `Marketing 01 · Holding Page.html` | Public |
| `/privacy` | `privacy.html` | Public |
| `/about` | `about.html` | Public |
| `/help` | `Marketing 03 · Help & Support.html` (help and support; loads `help/`) | Public. Rewrite, like `/privacy`. |
| `/studio` | Login page (you build it, §8) | Public, unlinked |
| `/hub` | `Decouple · Prototype Hub.html` | Owner |
| `/hub/marketing` | `Decouple · Marketing Hub.html` | Owner |
| `/hub/results` | `Decouple · Results.html` | Owner |
| `/hub/site` | `Decouple · Site Settings.html` (site settings: public mode, tester codes, test mode) | Owner |
| `/p/01` … `/p/10` | `Proto 01 · Discover.html` … `Proto 10 · Dashboard.html` | Owner, and testers whose track includes it (§4.4) |
| `/take-part` | `Decouple · Take Part.html` (the participant hub) | Testers whose code has a `track`, and the owner. Rewrite. |
| `/p/mvp00` … `/p/mvp08` | `MVP 00 · Public Site.html`, `MVP 01 · Toolkit.html`, `MVP 02 · Right for Us.html`, `MVP 03 · To-do & Journal.html`, `MVP 04 · Parenting Plan.html`, `MVP 05 · Financial Statement.html`, `MVP 06 · Split Planner.html`, `MVP 07 · Ask.html`, `MVP 08 · Help & Support.html` (the `&` in 03 and 08 encodes as `%26`) | Owner, and testers whose track includes it (§4.4). Redirect, like `/p/01`. MVP 00 is a prototype, **not** a public page. |

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
   - `LOGIN_PATH`, `/holding`, `/privacy`, `/about`, `/help`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`.
   - Every path in `dist/_public.json`, which the build generates (§5). It includes `help/help-sources.json` and `help/help-content.json`, which the help page fetches by script.
   - **`/shared/dc-look.js` is served by `/api/look`, never the file** (a rewrite in `vercel.json`, ahead of the static file, with or without `?v=`). The file in `site/` is the design project's preview and reads the browser's storage.
2. **`/` or `/guide`:**
   - Read the site settings from Global Config, formerly Edge Config (`mode`, `requireCode`, `testMode`, `landing`, `indexing`, `theme`), cached for 60 seconds per instance. Defaults: `{ mode: "holding", requireCode: true, testMode: false, landing: "a", indexing: false, theme: "page" }`.
   - If `?code=` is present: check it (§3). If it's valid, set `dc_tester` and send a 302 to `/` with the code removed. If not, send a 302 to `/?code_error=1`.
   - **`/take-part`** works the same way: `/take-part?code=<valid>` sets `dc_tester` and redirects to `/take-part`. Without a tester or owner session (or with an invalid code), serve the small code page (§8), never a 404, so participants who lose their cookie can type the code in.
   - At `/`: serve the guide when mode = guide, or the request has a tester or owner session. Otherwise serve the holding page. `/guide` always serves the guide.
   - The owner can preview with `/?view=holding` or `/?view=guide`.
3. **Aliases:** rewrite or redirect the addresses in §2 to their files, as §2 says. The destinations need encoding, e.g. `/Decouple%20%C2%B7%20Results.html`.
4. **Everything else:** owner session required. **Testers and tracks.** Each tester code has a `track` (§3). A tester whose track is not empty may open `/take-part`, the prototype pages in their track, and everything under `proto/`, `mvp/`, `shared/` and `take-part/`. Track tokens map to files: `p01`…`p10` → `Proto 01 · …` … `Proto 10 · …`; `m00`…`m08` → `MVP 00 · …` … `MVP 08 · …`; `full` = all ten Protos; `mvp` = all nine MVPs. Read the track from the cached codes list using the session's `c`. An empty track means the guide only, as before. **`TESTERS_CAN_OPEN_PROTOS` is retired**: remove it. The hubs (`/hub`, `/hub/*`, and their files) are always owner-only. Without a session, return 404 with the 404 page.
5. **Headers on every response:**
   - `X-Robots-Tag: noindex, nofollow` on everything, except: when `indexing` is true, `/`, `/privacy`, `/about` and `/help` get no robots header. `/guide` always keeps it (it duplicates `/`). The pages carry no robots meta tag of their own, so this header decides.
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
4. **Fonts:** self-host them instead of Google Fonts. That keeps visitor IPs away from Google, which matters for the privacy notice. Families and weights in use: Inter 400–700, Source Serif Pro 400/600/700 with italics, JetBrains Mono 400–600, plus the signature fonts on Protos 08 and 09: Caveat, Mrs Saint Delafield and Homemade Apple. A new family in an export is flagged in its `CHANGES.md`. Rewrite each `<link href="https://fonts.googleapis.com/...">` to a local `fonts.css`.
5. **Cache-busting:** add `?v=<content hash>` to every local JS and CSS reference, including `<link rel="prefetch">` (the help page names `shared/dc-site.js` that way and loads it only when someone signs up). Serve `dist/**/*.{js,css,woff2,png}` with `Cache-Control: public, max-age=31536000, immutable`, and HTML and `help/*.json` with `no-cache`.
6. **Public allow-list:** scan the guide, the holding page, the privacy page, the about page and the help page (`Marketing 03 · Help & Support.html`), after rewriting, for every local `src` and `href`, and every `url()` in their CSS. Add `help/help-sources.json` and `help/help-content.json`. Write the list to `dist/_public.json`. The middleware imports it, so nothing else is public.
7. **Questions:** if `APPS_SCRIPT_URL` is set, fetch `?action=questions` and write `dist/m02/guide/questions.json` (an array of row objects keyed by the tab's column names). If the fetch fails or the tab is empty, write an empty list. The page then uses its built-in questions, with no failed request. Then fetch the help content (§5.2).
8. **Minify all JS and CSS**, not just compiled JSX, and strip comments. Comments in the public files describe the prototypes and how things work.
9. **Canonical:** add `<link rel="canonical" href="https://decouple.uk/">` to the guide and the holding page, `https://decouple.uk/privacy` to the privacy page, `https://decouple.uk/about` to the about page, and `https://decouple.uk/help` to the help page.
10. **Fail the build** if any HTML still contains `text/babel`, `unpkg.com` or `fonts.googleapis.com`, if a local reference doesn't resolve, or if a help path doesn't exist (§5.2).

Target: a Lighthouse mobile performance score of 90 or more for `/`.

### 5.1 Search engines

Both files are served by a function, from the `indexing` setting.
- **`/robots.txt`**, `indexing` false: `User-agent: *` and `Disallow: /`.
- **`/robots.txt`**, `indexing` true: `User-agent: *`, `Allow: /$`, `Allow: /privacy$`, `Allow: /about$`, `Allow: /help$`, one `Allow:` line for each path in `_public.json` (so crawlers can render the page), then `Disallow: /` and `Sitemap: https://decouple.uk/sitemap.xml`. **Never name a private path** (the hubs, the protos, `LOGIN_PATH`): robots.txt is public, and listing them would point people to them.
- **`/sitemap.xml`**: `/`, `/privacy`, `/about` and `/help` when `indexing` is true, each with `lastmod` (for `/help`, the help content's `built` date). 404 otherwise.
- Private pages keep `noindex, nofollow` and return 404 without a session (§1), so nothing private can be indexed even if it's linked from elsewhere.

### 5.2 Help content (`help/help-content.json`)

The help page (Marketing 03, `/help`) and MVP 08 read the same two files. `help/help-sources.json` belongs to the design project, like the questions template: per topic, its `id`, title, GOV.UK paths (`gov[].path`) and linked sites. The build writes the other one from GOV.UK. GOV.UK content is reused under the Open Government Licence v3.0; the page shows the attribution and each page's updated date.

1. Read `site/help/help-sources.json`. Collect every `topics[].gov[].path`, every `disclosure.gov[].path`, and `disclosure.collection.path`.
2. For each path, `GET https://www.gov.uk/api/content<path>`, one at a time with a short pause, `User-Agent: decouple.uk build (hello@decouple.uk)`. Retry twice on a network error or 5xx.
3. Keep, per path: `title`, `description`, `updated` (= `public_updated_at`), `url` (= `https://www.gov.uk` + the path) and `body`:
   - `details.body` when there is one;
   - for a guide (`details.parts`), every part in order, each under an `<h2>` of its title; if the path names one part (`/guide/part-slug`), that part only;
   - cleaned to `h2`–`h4`, `p`, `ul`, `ol`, `li`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `a` (`href` only, relative links made absolute to `https://www.gov.uk`), `strong`, `em`, `abbr`, `br`. Drop everything else: images, scripts, styles, iframes, classes, ids. The page cleans it again.
4. **Forms:** from the collection, list its documents (`links.documents`) and keep those whose title matches `^Form (D81|A|E|E1|E2)\b` as `forms: [{code, title, url}]`. The Content API doesn't serve the PDFs, so the page links each form's GOV.UK page, never a copy.
5. Write `dist/help/help-content.json`: `{built: <ISO>, pages: {"<path>": {title, description, updated, url, body}}, forms: [...]}`.
6. **A path that doesn't exist (404 or 410) fails the build**, naming the path and its topic. Paths marked `"confirm": true` are the exception: print a warning naming them, leave them out, and list them in the handoff, so the design project confirms or removes them.
7. **If GOV.UK can't be reached** after the retries, reuse `https://decouple.uk/help/help-content.json` (the copy already live) and warn. If that fails too, write `{built: null, pages: {}, forms: []}`: the page then links each GOV.UK page instead of showing its text, so it never empties.
8. Never type a figure: the page has no fees, amounts or dates of its own, only what this file carries.
9. **Refresh:** weekly, through `/api/cron/rebuild` (§7), and whenever the owner presses Publish in Site settings.

## 6. Google script (`apps-script/Code.gs` + `apps-script/SETUP.md`)

- It's bound to Ross's existing results spreadsheet (Extensions › Apps Script) and deployed as a web app: Execute as me, Who has access: Anyone. Every call carries `secret` = `APPS_SCRIPT_SECRET`, checked first.
- **Tabs** are created with headers if they're missing:
  - `M02 Guide` and `Prototype testing`: `received_at, batch_key, sid, pid, test, step, price, landing, qid, qv, question, type, answer, device`
  - `Signups`: `received_at, email, stage, source, sid`
  - `Codes`: `code, label, active, test, expires, created, uses, last_used, track, mode` (add the last two to an existing tab)
  - `Participants`: `received_at, pid, sid, email, followup, voucher`. **Never returned by any read action.**
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

## 7. API (`api/*.ts`, Vercel Functions, Node 22)

All JSON. Reject any body over 64 KB.

| Route | Who | In | Does | Out |
|---|---|---|---|---|
| `GET /api/session` | Anyone | — | Reads the cookies and site settings | `{owner, tester, human, testing, label?, track?, trackMode?, mode, requireCode, landing, turnstileSiteKey}`. `track` and `trackMode` (the code's `mode`: `un` or `mod`) for testers only. |
| `POST /api/login` | Anyone | `{password}` | §3 | 200 and sets `dc_owner`, or 401 |
| `POST /api/logout` | Anyone | — | Clears `dc_owner` and `dc_tester` | 200 |
| `POST /api/tester` | Anyone | `{code}` | Checks the code (§3) | 200 `{label}` and sets `dc_tester`, or 404 |
| `POST /api/human` | Anyone | `{token}` | Verifies the Turnstile token | 200 and sets `dc_human`, or 403 |
| `POST /api/answers` | Owner or tester; or human, when `requireCode` is off | `{batchKey, sid, pid?, test, step, price?, landing?, device, hp, rows:[{qid, qv, q, type, a}]}` | Validates and cleans (below), then sends to the Google script | 200 `{ok}` only after the script confirms. 400 bad shape, 401 no session, 502 script failed. |
| `POST /api/signup` | Human | `{email, stage?, source, sid, hp}` | Checks the email, then sends `kind: "signup"`. Sources: `holding:<utm_source>`, `guide`, `guide-optin`, `help` (the help page's "Start your financial statement"). `stage` can be a `;` list. | 200, 400 or 403 |
| `POST /api/email` | Same as `/api/answers` | `{email, link, sid}` | Sends the guide email (below) | 200, 400, 401 or 429 |
| `GET /api/results` | Owner | `?test=&since=` | Passes the request to `action=results` | `{rows:[{sid,pid,test,step,price,landing,qid,qv,q,type,a,at,device}], signups}` |
| `GET` and `POST /api/admin/site` | Owner | `{mode?: "guide"\|"holding", requireCode?: boolean, testMode?: boolean, landing?: "a"…"i"\|"random", indexing?: boolean, theme?: "page"\|"studio"\|"flat"\|"lilac"\|"field"\|"service"}` | Reads or writes the Edge Config items through the Vercel REST API (`EDGE_CONFIG_ID`, `VERCEL_API_TOKEN`) | `{mode, requireCode, testMode, landing, indexing, theme}` |
| `GET /api/look` (served at `/shared/dc-look.js`, §4) | Anyone | — | Reads `theme` from the site settings. The guide and the help page load it in `<head>`, before they paint. | `Content-Type: text/javascript`, `Cache-Control: public, max-age=60`. Exactly this, with `T` the JSON of `theme`, or `null` when it's `page` or missing: `(function(){var O=["studio","flat","lilac","field","service"],t=null;try{t=new URLSearchParams(location.search).get("theme")}catch(e){}if(O.indexOf(t)<0)t=T;if(O.indexOf(t)>=0)document.documentElement.setAttribute("data-site-theme",t)})();` |
| `GET` and `POST /api/admin/codes` | Owner | POST: `{action: "create", codes:[{code, label, expires, test, track, mode}]}`, `{action: "update", code, active?, label?, expires?, test?, track?, mode?}` or `{action: "delete", code}` | Passes the change to the script's `kind: "codes"` (GET reads `action=codes`). On create, check the format `^[A-Z]{2,6}-[A-Z]{2,6}-\d{2}$`, labels of 40 characters at most, `track` matching `^(|full|mvp|[pm]\d{2}(,[pm]\d{2})*)$`, `mode` of `un` or `mod` (empty when there's no track), and at most 20 codes per request. The page makes the code strings. | `{codes:[{code,label,active,test,expires,created,uses,last_used,track,mode}]}` |
| `POST /api/participant` | Tester (or owner) | `{sid, followup, voucher, email, hp}` | The participant hub's thank-you step. Checks `email` when given. Sends `kind: "participant"` to the script, which appends to `Participants` with the tester's label as `pid`. Test codes and test mode: 200 `{ok, test}`, nothing stored. At most 3 per `sid`. | 200, 400 or 401 |
| `POST /api/claude` | Owner or tester; with `kind: "help"`, also a visitor who has passed the person check (`human`) | `{system, messages:[{role, content}], max_tokens}`, or `{kind: "help", messages}` | The AI proxy (below) | 200 `{text}`; 400 bad shape; 401 no session; 429 over the rate limit; 503 no key or over the monthly cap |
| `POST /api/admin/publish` | Owner | — | Calls `DEPLOY_HOOK_URL`, which rebuilds and so picks up edited questions and fresh help content (§5.2) | `{ok}` |
| `GET /api/cron/rebuild` | Vercel Cron only: `Authorization: Bearer CRON_SECRET` | — | Calls `DEPLOY_HOOK_URL`, so the help content refreshes weekly. Schedule in `vercel.json`: `0 5 * * 1`. Anything else gets 401. | `{ok}` |

**Cleaning answers:**
- If `hp` (a hidden trap field) isn't empty, return 200 and drop the batch.
- At most 80 rows. Each `a` at most 2,000 characters, with control characters removed.
- **Never store** any row whose `qid` is in `safe`, `safe2`, `name_me` or `name_them`, or contains `email`. Strip these server-side even though the pages already never send them.
- `pid`: the client's `pid` (trimmed to 40 characters) when the session is the owner's, because testing-mode sessions type in a participant ID. Otherwise the tester's label, or `"anon"`.
- `test` must be `M02 Guide`, `Prototype testing`, `M01 Holding`, `Screener` (the participant hub), or match `^MVP \d{2} · [A-Za-z&' -]{1,40}$` (one per MVP prototype, e.g. `MVP 05 · Financial statement`; each gets its own tab, as §6 already does for other values). Return 400 for anything else; new tests are added here deliberately.

**Rate limits:** at most 120 answer batches per hour per session, and 3 emails per `sid` per day. In-memory is fine for now, because sessions already gate it.

**The AI proxy (`/api/claude`):**
- Used by Ask (MVP 07), the journal companion (MVP 03) and Protos 08 and 10. `shared/dc-site.js` defines `window.claude.complete` on the site and posts here, waiting up to 60 seconds (every other request: 9); the pages are unchanged.
- Calls the Anthropic Messages API with `ANTHROPIC_API_KEY` and `CLAUDE_MODEL`. No tools, no web access, no streaming. Returns the reply text as `{text}`.
- Limits: `max_tokens` at most 1,200; at most 20 messages; `system` at most 8,000 characters; body at most 64 KB. 40 calls per hour per session.
- A model that thinks on every request (Opus 5.5 and 5, Fable 5.1 and 5, Sonnet 5.5 and 5, Haiku 5.5) is sent the page's `max_tokens` plus 4,000. Its thinking counts toward `max_tokens`, so without the extra room a short allowance can go entirely on thinking and leave no reply.
- **Spend cap:** estimate cost from the usage the API returns, keep a running total per calendar month (Global Config item `aiSpend: {month, usd}`, written at most once a minute per instance), and return 503 once it passes `CLAUDE_MONTHLY_CAP_USD`.
- **Never log content.** Log only time, route, session role, token counts, status and how long the model took.
- Works in test mode too: it stores nothing.
- For now the other pages send their own system prompts, which is acceptable while only the owner and testers can reach them.
- **The help assistant (`kind: "help"`) is public, so its prompt is built on the server.** The panel at the top of `/help` (and MVP 08) sends `{kind: "help", messages, max_tokens}`; the page also sends `system`, but the server ignores it. Instead:
  - Load `site/help/help-prompt.js` as a module (`require(...).HELPPROMPT`; it's plain JS with no DOM and no network) and read the deployment's own `help/help-sources.json` and `help/help-content.json` (cache both per instance).
  - `messages = HELPPROMPT.trim(messages)` (the last 8 turns; a user turn at most 1,000 characters, an assistant turn at most 2,000), then `system = HELPPROMPT.build(sources, content, messages)` (always under 8,000 characters). `max_tokens` at most 700, plus the room for thinking above.
  - Who: owner, tester, or a session with `human` (the existing Turnstile check through `/api/human`). Anyone else gets 401. The page runs the check before the first question.
  - Limits for `human` sessions: 15 calls per hour and 40 per day per session, plus 300 per hour across all visitors; 429 past any of them. The monthly spend cap covers it too. Owner and tester sessions keep their limits.
  - Nothing is stored, and content is never logged (as above). Log `kind` with the rest.

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
- **`/take-part` code page:** the same look as `/studio`. Heading "Enter your code", one field, a button, and an error line. It posts to `/api/tester`, then reloads `/take-part`. No mention of what's behind it. noindex.
- **404 page:** the same type, light background. Text: "This page doesn't exist." Link: "Go to Decouple".

## 9. Environment variables (Vercel; never in git)

`SITE_ORIGIN=https://decouple.uk` · `LOGIN_PATH=/studio` · `OWNER_PASSWORD_HASH` · `SESSION_SECRET` (32+ random bytes) · `TESTER_CODES` (fallback) · `APPS_SCRIPT_URL` · `APPS_SCRIPT_SECRET` · `RESEND_API_KEY` · `MAIL_FROM` · `TURNSTILE_SITE_KEY` · `TURNSTILE_SECRET_KEY` · `EDGE_CONFIG` (the connection string, added when the store is connected) · `EDGE_CONFIG_ID` · `VERCEL_API_TOKEN` (scoped to this project) · `DEPLOY_HOOK_URL` · `CRON_SECRET` (for `/api/cron/rebuild`; Vercel Cron sends it).

**For `/api/claude`:** `ANTHROPIC_API_KEY` (a new key, just for this; rotate the old app's key), `CLAUDE_MODEL` (agree with Ross), `CLAUDE_MONTHLY_CAP_USD` (e.g. 50).

**Remove** from the production environment: `TINK_CLIENT_ID` and `TINK_CLIENT_SECRET`. Ask Ross first. Suggest rotating them, since the app is retired.

## 10. Things to tell Ross

- **Vercel's Hobby plan is for non-commercial use only.** A company's marketing and testing site should be on Pro ($20 a month).
- **Resend:** add decouple.uk in Resend, then add its DNS records (SPF, DKIM, and DMARC on `_dmarc`). If Vercel manages the DNS, they go in Vercel › Domains.
- **hello@decouple.uk needs a real mailbox** to receive replies, from any provider. Resend only sends.
- **AI features** (Protos 08 and 10, MVP 03 and MVP 07) now reach `/api/claude` through `shared/dc-site.js`. Agree the model, the monthly cap and the provider's data terms (no training on inputs, retention) with Ross before setting the key. Until the key is set they fail quietly, with a message saying so.
- **Participants:** a tester code with a `track` opens the participant hub at `/take-part` (consent, screener, then only that track). Make them in Site settings. `TESTERS_CAN_OPEN_PROTOS` is gone.
- **Help (`/help`):** public from this export, and refreshed from GOV.UK every Monday. Keep `indexing` off until a family solicitor or mediator has checked it. Set `CRON_SECRET`.

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
9. Search (§5.1): with `indexing` off, `/robots.txt` is `Disallow: /` and `/` has the noindex header. Turn it on in Site settings: within a minute `/` and `/privacy` lose the header, `/guide` keeps it, and robots.txt and the sitemap name no private path. Turn it back off. Logged out, `/proto/ut/ut-questions.js` returns 404.
10. **MVP prototypes and tracks:** owner opens `/p/mvp00` and walks MVP 00 → 01 → each tool with no failed requests. Make a code with track `mvp`: its link opens `/take-part`, the tester can open MVP pages, and `/p/01` and `/hub` give 404. A code with track `p03,m05` opens only those two. A code with no track sees the guide only. In testing mode, finishing a part lands rows on that MVP's own tab (e.g. `MVP 05 · Financial statement`). `/api/answers` with `test` = `MVP 99 · <b>` returns 400.
11. **`/api/claude`:** no session → 401. As a tester, MVP 07 · Ask answers a question. The 41st call in an hour → 429. The logs hold no message content.
12. **Participant hub:** `/take-part` with no session shows the code page. In it: consent, screener (rows land on the `Screener` tab; the wellbeing answer never arrives), the session list, then the thank-you step (a row in `Participants`, nothing on the answer tabs, and `/api/results` never returns it).

13. **Help:** logged out, `/help` loads with every request public, both JSON files and `help/help-prompt.js` and `help/help-ai.js` included, and makes no `/api` request until someone submits its sign-up or asks the assistant a question. Its GOV.UK text shows with "Source: GOV.UK, updated …". A made-up path added to `help-sources.json` fails the build by name. A tester with track `mvp` opens `/p/mvp08`. `/help` is in the sitemap, and loses the noindex header, only while `indexing` is on. `/api/cron/rebuild` without the secret → 401.
14. **Help assistant:** logged out on `/help`, the first question runs the person check, then gets an answer with "On this page" links that scroll to the topic. A changed `system` in the request makes no difference to the answer's rules (the server builds its own). `/api/claude` with `kind: "help"` and no `human` → 401; without `kind` from a `human` session → 401. The 16th help call in an hour → 429. The logs hold no message content.
15. **Look and feel:** logged out, `/shared/dc-look.js` returns the script in §7 with `null`. In Site settings pick Field guide: within a minute `/` and `/help` render in it (`<html data-site-theme="field">`) with no flash of the old look, and `/help` still makes no `/api` request. `/help?theme=flat` shows Flat. Set it back to As designed.

Then switch mode back to **holding** before the production deploy. The guide goes public only when the next export lands, with consent and the tester-code screen.

## 12. How exports land

- An export is a zip holding `site/`, plus `docs/SITE-SPEC.md` when the spec changed, and a `CHANGES.md` for Claude Code.
- `site/EXPORT.json` holds the export ID and date. The pull request is named `sync: design export <ID>`.
- `CHANGES.md` lists: changed or new pages, renamed or removed files, new fonts or outside scripts, new public pages, spec changes (by section), and the handoff findings this export fixes.
- Findings about pages go in the next `docs/HANDOFF-SITE-<n>.md` under "In `site/`, for the design project". The design project reads that from GitHub.

## 13. Repo housework (done 13 Oct 2026; kept for the record)

As built: the old app was archived as `archive/prototype-01/` on `main` (the tag `prototype-01-root-layout` points at the last root layout), not as a tag and branch; Node 22; Global Config. See `docs/HANDOFF-SITE-1.md`. The original brief follows.

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
