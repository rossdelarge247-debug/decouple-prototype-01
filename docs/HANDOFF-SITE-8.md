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
- **Every request also goes through the middleware**, fonts and React included, because it has no matcher.
  - Leaving out the folders that are wholly public (`vendor/`, `fonts/`, `inline/`) would save a function call per file.
  - It isn't done yet. The middleware is what keeps private files private, so a wrong matcher would expose them, and it needs checking on a preview first.

**In `site/`, for the design project.**
- Nothing failed.
- **Proposals to speed pages up** (they need the design project, as they change pages or the spec):
  - **The guide is blank until `/api/session` answers** (`Marketing 02 · Divorce Guide.html`, `if (phase === "landing" && site === undefined)`). It could keep the last answer in `sessionStorage` and show that straight away on later page loads in the same visit, checking it when the reply comes.
  - **Private files are never cached.** Spec §4 gives every private response `Cache-Control: private, no-store`, so the owner and testers download every script of a proto again on each page. MVP 05 has 13 such files, 172 KB.
    - The build already adds `?v=<content hash>` to every local script and stylesheet. So `private, max-age=31536000, immutable` for those would be safe to keep in the browser, and never in a shared cache.
    - The pages themselves would stay `no-store`.

**Next.** The parked items: the end-to-end tester-code run, the spreadsheet tabs per test, Results playback, analytics and session tools.
