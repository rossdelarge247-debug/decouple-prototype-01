# Handoff · site 8 (18 October 2026): export 2026-10-18a

**Landed.** Export `2026-10-18a` replaced `site/` whole. Its change note is `docs/exports/2026-10-18a.md`.
- It fixes the HANDOFF-SITE-7 finding: on landing A, the hero's "Get my free guide" and "Start now" now call `onStart()` with nothing passed in, like landings B to I.
- `docs/SITE-SPEC.md` is unchanged. Nothing to build, and `lib/generated/` didn't change.

**Checked.**
- Typecheck, 140 tests and the build.
- On the dev server, all 75 §11 request checks pass.
- In headless Chromium, every hub, proto and MVP 00–08 opens with no errors, as the owner and as each tester. With mode = guide, the guide makes no requests outside `dist/_public.json`.
- The checks in CHANGES, logged out with mode = guide:
  - **Landing A's start buttons work.** The hero's "Get my free guide", the header's "Get my free guide" and "Start now" each open the guide's first screen ("Your guide is made on this device.") with no console errors.
  - **Reloading carries on.** From each of those three buttons, a visitor who agreed and answered the first question was still on that question after a reload, with the answer kept.
    - A reload on the consent screen itself goes back to the landing, on every landing. That's deliberate: `m02/guide/g-store.js` sends the code and consent screens back to the landing.
  - **Every link and button on landings A to I works**, clicked one at a time:
    - each start button opens the guide's first screen;
    - Help & support, Privacy and the email link resolve;
    - Quick exit leaves the site;
    - there are no console errors and no blank screens.
- The test blocks every host outside the site, Cloudflare's person check included. So its visitor had no session, and `/api/answers` rightly refused their answers with a 401. On decouple.uk the person check loads.
- **Not checked here:** the Vercel preview. This environment can't reach `*.vercel.app` or decouple.uk.

**Ross.**
- **On decouple.uk after merging:** on landing A, click the hero's "Get my free guide" and then "Start now". Both should open the guide.
- **Still open from HANDOFF-SITE-7:**
  - **Site settings landing and look.** On `/hub/site`, check whether the "Preview" box shows at the top, and what message appears after picking a landing.
  - **The mode.** The live store has `mode: "guide"`. If that isn't intended, set it back to holding.
  - **The privacy page.** Confirm Anthropic's API retention period for `privacy.html`, through the design project.
  - **The question sheet.** Paste `proto/ut/mvp-questions.csv` into it, then redo Results › Sheet setup.
  - **Search.** Keep Show in search engines off until a family solicitor or mediator has checked `/help`, including the assistant.

**Fixed after landing: slow page loads.** Ross found pages slow to load on decouple.uk.
- **What the pages weigh.** Size isn't the cause:
  - the guide is 34 requests and about 550 KB before compression, React's 129 KB being the largest;
  - `/help` is 17 requests and about 200 KB.
- **What they wait for.** On `/` and `/help`, nothing paints until `shared/dc-look.js` comes back from `/api/look`, because it's a script in `<head>`. The guide then shows a blank page until `/api/session` answers. Both were server functions in Vercel's default region, `iad1` (Washington DC), each reading the settings store, and each could be paying for a cold start.
- **Changed:**
  - `vercel.json` sets `"regions": ["lhr1"]`, so the functions run in London, next to the visitors.
  - `/api/look` also sends `Vercel-CDN-Cache-Control: max-age=60`, so Vercel's CDN keeps it for the same minute the browser does. Most visits then get it from the nearest edge without calling a function. `Cache-Control` stays as the spec gives it.
  - `/api/admin/diagnose` shows how long the store read (`store.ms`) and the Google script (`script.ms`) took, and whether the request was this instance's first (`deployment.instance`).
- **Measured on decouple.uk after the move** (`/api/admin/diagnose`):
  - the region is `lhr1`;
  - the settings store read took 154 ms;
  - the Google script took 2,296 ms;
  - the request was a new instance's first.
- **Then, so no page waits for the Google script:**
  - **Tester codes.** Once the middleware's copy of the codes list is over a minute old, it uses that copy and fetches a fresh one in the background (`waitUntil`). It stops doing so once its copy is 10 minutes old.
    - Ross agreed the trade-off: a code turned off can still open one more page after the minute.
    - The functions (`/api/answers`, `/api/session`) and redeeming a code still read the list fresh, so §11 check 8 holds.
  - **Settings.** The middleware reads them again in the background once its copy is 30 seconds old, and never uses a copy older than the spec's 60 seconds. So §11 checks 9 and 15 ("within a minute") hold, and while there are visitors no page waits for the store.
  - On the dev server all 75 §11 request checks pass, and every page opens clean.
- **Every request also goes through the middleware**, fonts and React included, because it has no matcher.
  - Leaving out the folders that are wholly public (`vendor/`, `fonts/`, `inline/`) would save a function call per file.
  - It isn't done yet. The middleware is what keeps private files private, so a wrong matcher would expose them, and it needs checking on a preview first.

**Short addresses for the public pages.** The pages link to each other by file name, so clicking "Help & support" or "Privacy" left the file name in the address bar (`/Marketing%2003%20·%20Help%20%26%20Support.html`, `/privacy.html`).
- The middleware now sends each public page's file address to its short one with a 308, keeping the query; the browser keeps any `#`:
  - `Marketing 02 · Divorce Guide.html` → `/guide`;
  - `Marketing 01 · Holding Page.html` → `/holding`;
  - `Marketing 03 · Help & Support.html` → `/help`;
  - `privacy.html` → `/privacy`.
- The redirect is `private, no-store`, like every redirect here, so no browser keeps it.
- Checked in headless Chromium:
  - every "Help & support" and "Privacy" link on the nine landings opens `/help` and `/privacy`;
  - the Marketing Hub opens `/holding`, `/guide` (with `?demo=1&phase=guide` kept) and `/help`;
  - the holding page's privacy link opens `/privacy`.
- **Then the private pages too**, at Ross's request:

| Page | Short address | Was |
|---|---|---|
| Prototype hub | `/hub` | `/hub` |
| Marketing hub | `/marketing` | `/hub/marketing`, which redirected to the file |
| Results | `/results` | `/hub/results`, likewise |
| Site settings | `/settings` | `/hub/site`, likewise |
| Take part | `/take-part` | `/take-part` |
| Free tool | `/free-tool` | the file only |
| Proto 01–10 | `/p01` … `/p10` | `/p/01` … `/p/10`, likewise |
| MVP 00–08 | `/mvp00` … `/mvp08` | `/p/mvp00` … `/p/mvp08`, likewise |

  - **Why one segment.** Each is served by a rewrite, so the address stays. The two-segment aliases redirected to the file because a page at `/hub/results` would look for `results/r-app.js` under `/hub/`. At `/results` it finds it at the root, as from the file.
  - **The old addresses.** Each page's file address, the old `/hub/…` and `/p/…` aliases, and the renamed MVP 01 redirect (302) to the short address, keeping the query. They do so only after the session check, so anyone not allowed still gets a plain 404.
  - **No page reads its own file name.** The protos know their stage from a data attribute or their stage list, and the rest read their address only to copy a link or return to a hub. Proto hash routing works at `/p05#…`.
  - **Checked in headless Chromium:**
    - as the owner, all 24 private short addresses open with no errors and keep their address;
    - every same-site link on `/hub` (53) and `/marketing` (12) lands on a short address;
    - a tester's proto link lands on `/p03?test=1`, and `/results` is a 404 for them;
    - logged out, every private short address is a 404.
  - All 76 §11 request checks pass on the dev server, including a new one for `/mvp03`. The page sweep and every landing link pass too.

**In `site/`, for the design project.**
- **Spec §2, to update:** the table above is the new set of addresses. The sentence to add is: "Every page has a one-segment short address. Its file address, and the older `/hub/…` and `/p/…` aliases, redirect there, keeping the query: public pages with a 308 before any session is read, private pages with a 302 after the session check."
  - Today §2 says each file's own path keeps working. It still does, by way of the redirect.
  - Links between pages can stay as file names, which the design tool needs.
- Nothing failed.
- **Site settings drops quietly into preview mode when the site is slow.**
  - `settings/s.js` uses the API only if `DC.session()` answers, and `shared/dc-site.js` gives `/api/session` 3.5 seconds.
  - A slower answer, such as a cold start while the functions were in Washington, puts the page in preview mode. Picks are then saved in the browser only, and they look as if they worked.
  - This is the likely cause of "the landing and look don't stick". After the move to London, the store holds the latest picks (`landing: "e"`, `theme: "studio"`).
  - Proposed fix: on decouple.uk and `*.vercel.app`, if the session check fails or times out, say so ("Couldn't reach the site. Reload to try again.") instead of switching to preview, and give `/api/session` longer there.
- **Proposals to speed pages up** (they need the design project, as they change pages or the spec):
  - **The guide is blank until `/api/session` answers** (`Marketing 02 · Divorce Guide.html`, `if (phase === "landing" && site === undefined)`). It could keep the last answer in `sessionStorage` and show that straight away on later page loads in the same visit, checking it when the reply comes.
  - **Private files are never cached.** Spec §4 gives every private response `Cache-Control: private, no-store`, so the owner and testers download every script of a proto again on each page. MVP 05 has 13 such files, 172 KB.
    - The build already adds `?v=<content hash>` to every local script and stylesheet. So `private, max-age=31536000, immutable` for those would be safe to keep in the browser, and never in a shared cache.
    - The pages themselves would stay `no-store`.

**Next.** The parked items: the end-to-end tester-code run, the spreadsheet tabs per test, Results playback, analytics and session tools.
