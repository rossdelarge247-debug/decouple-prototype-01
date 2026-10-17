# Handoff · site 6 (17 October 2026): export 2026-10-17a

**Landed.** Export `2026-10-17a` replaced `site/` and `docs/SITE-SPEC.md` whole. Its change note is `docs/exports/2026-10-17a.md`. It includes 16b and 16c, which never landed on their own:
- the help assistant on `/help` and MVP 08;
- Look and feel in Site settings;
- the three HANDOFF-SITE-5 fixes.

**Built, in the order of "What to build".**
1. **The `theme` site setting.** It takes `page` (the default, also when missing), `studio`, `flat`, `lilac`, `field` or `service`. `/api/admin/site` reads and writes it like `landing`, and anything else is a 400.
2. **`GET /api/look`, served at `/shared/dc-look.js`.** It sends the spec's one-line script with the live look, or `null` for `page`, a missing value or a bad stored value, as `text/javascript` with `public, max-age=60`. It reads no session and sets no cookie. Three things keep the preview file from ever being served:
   - The middleware sends `/shared/dc-look.js` (with or without `?v=`) to `/api/look`. On Vercel the middleware runs before static files, so this doesn't depend on how `vercel.json` rewrites rank against files.
   - The `vercel.json` rewrite the spec asks for is also there.
   - The build leaves the design project's preview file out of `dist/`.
3. **`/api/claude` with `kind: "help"`: the prompt is built on the server.**
   - The build compiles `site/help/help-prompt.js` and `site/help/help-sources.json` into `lib/generated/help-prompt.ts`, so the function runs the page's own builder. CI fails if that file is stale.
   - The GOV.UK text comes from the deployment's own `help/help-content.json`, read once per instance. If that can't be read, for example on a preview behind Vercel's login, it falls back to the live site's copy. If that fails too, it uses no GOV.UK text, and the prompt then gives no figures.
   - The page's `system` is ignored. The messages are cut to the page's last 8 turns, starting from a user turn, then trimmed by `HELPPROMPT.trim`. `max_tokens` is at most 700.
   - The owner and testers keep their 40 an hour. A visitor whose session passed the person check gets 15 an hour and 40 a day, with 300 an hour across everyone. A refused call isn't counted against those.
   - The logs carry `kind` and where the GOV.UK text came from (`own`, `live` or `none`), never content.

Also new:
- **Diagnostics** says whether the help assistant is in the build.
- **The dev server** follows a middleware rewrite to a function, and its Anthropic mock answers help prompts in the JSON shape the panel reads.

Two readings of the spec:
- A request with no session at all still gets 401 before its body is read.
- The limits are per instance, like the existing ones.

**Checked.**
- Typecheck, 134 tests (theme validation, `/api/look` for each value, `page`, missing and bad, and the help assistant), and the build.
- On the emulator, §11 request checks 1, 3–5 and 8–15 pass.
- In headless Chromium:
  - Every hub, proto and MVP 00–08 opens clean, as the owner and as each tester.
  - **§11 13.** Logged out, `/help` loads `help-prompt.js`, `help-ai.js`, both JSON files and `dc-look.js`, all public. It makes no `/api` request and nothing outside the site.
  - **§11 14.** With Turnstile unreachable, the first question says it couldn't check you're a person, and nothing reaches `/api/claude`. Once the person check has passed, the question gets an answer with "On this page" links, and a link scrolls to its topic.
  - **§11 15.** In each of the five looks, `/` (as the owner), `/guide` and `/help` open in it, with `<html data-site-theme>` set before `<body>` exists, so there is no flash of another look. `/help` makes no `/api` request. With As designed set, `?theme=flat` and `?theme=lilac` preview their looks. As designed shows both pages in Category norm, their saved look.
  - **At 320 px:** `/`, `/guide`, the guide's questions and `/p/mvp08` don't scroll sideways in any look, and Quick exit, Help and the back lozenge are fully visible. `/help` does scroll sideways in two looks; see below.
  - **16b.** `/?landing=f` shows F, and the next `/` shows the Site settings design.
- **The help build** in this pull request's CI got 24 of 24 GOV.UK pages and forms D81, A, E, E1, E2, with no warnings. `lib/generated/` wasn't stale.

**Fixed after landing.** On decouple.uk, Site settings' landing and look didn't take: the guide stayed on D and the pages on Category norm.
- Inside Vercel functions, the settings client read a copy of the store at `/opt/edge-config/<id>.json` and kept its first parse for the life of the instance. `/api/session`, which gives the guide its landing, and `/api/look` both kept serving what the settings were when the deployment started.
- The middleware wasn't affected, which is why the mode switch kept working.
- Every read now asks the store itself (`consistentRead`): the site settings, the AI spend and the diagnostics page. The site still keeps its own copy for 5 seconds in functions and 60 in the middleware.

**Fixed after landing: the help assistant.** On decouple.uk, the panel on `/help` answered "Something went wrong. Please ask again."
- Claude Opus 5.5 always thinks, and its thinking counts toward `max_tokens`. The panel asks for 700. The first question on the site spent all 700 thinking, so the reply had no text and the proxy returned 502. The month's AI spend shows it: $0.019976 is 1,494 tokens in and exactly 700 out.
- A model that always thinks is now sent the page's `max_tokens` plus 4,000. The page's figure is still what the reply itself gets, and the prompt keeps it short. This covers every AI page, not just the help assistant.
- Each `/api/claude` log line now gives `ms`, how long the model took.
- The page also gives up after 9 seconds; see below.

**Ross.**
- **Look and feel:** set it in Site settings, or leave As designed. `?theme=studio|flat|lilac|field|service` previews any look on `/` and `/help`.
- **Try the help assistant** with a few real questions, and check its answers stick to the page.
  - Logged out, it needs the person check. That works on decouple.uk, but on a preview only if Turnstile allows the preview's address.
  - Signed in, you skip the check.
- **The question sheet:** paste `proto/ut/mvp-questions.csv` (87 rows, 3 new for MVP 08) into it, then redo Results › Sheet setup.
- **Still open:**
  - Confirm Anthropic's API retention period for `privacy.html`, through the design project.
  - Keep Show in search engines off until a family solicitor or mediator has checked `/help`, including the assistant.
  - `CRON_SECRET` is set.

**In `site/`, for the design project.**
- **`/help` scrolls sideways at 320 px in Category norm and Flat.** Category norm is the page's saved look, so this is the default live page.
  - The "Start your financial statement" button (`button.hp-btn`, `white-space: nowrap` in `help/help.css`) is 264–275 px wide and ends at 329–330 px.
  - Studio, Lilac and Field fit.
  - Let it wrap or go full width below about 360 px, in `help/help.css` or `help/help-themes.css`.
- **"Back to home" on `/help` doesn't go to `/`.** It links to `Marketing 02 · Divorce Guide.html`, and so does the wordmark. On decouple.uk in holding mode, a logged-out visitor clicking it lands on the guide's own address and sees the full guide, not the holding page. CHANGES says it goes to `/`. On the site it needs `href="/"`, or a script that sets it there; the design tool's preview can keep the file name.
- **MVP 08 records what testers ask the assistant.** In testing mode, `help/help-ai.js` sends the first 200 characters of each question as an answer row (`help-ai-q`, through `KIT.log`). MVP 07 Ask does the same for "Ask anything".
  - `privacy.html` says "What you type into a tool isn't sent to us".
  - Either log only that a question was asked, or say in `privacy.html` that testing mode keeps the questions asked in Ask and the help assistant.
- **The site gives an AI call 9 seconds.** On the site, `window.claude.complete` in `shared/dc-site.js` posts through `api()`, and `j()` aborts every request after 9 seconds by default.
  - Opus 5.5 thinks before it answers, so a help answer, an Ask reply or a journal reply can take longer than that. The page then shows its error while the server is still answering, and the call is still paid for.
  - Give `/api/claude` its own limit, such as 60 seconds: `j(path, opt, 60000)`. The server allows the model 45 seconds, with one retry.
- Nothing else failed.

**Next.** The parked items: the end-to-end tester-code run, the spreadsheet tabs per test, Results playback, analytics and session tools.
