# Handoff · site 7 (17 October 2026): export 2026-10-17b

**Landed.** Export `2026-10-17b` replaced `site/` and `docs/SITE-SPEC.md` whole. Its change note is `docs/exports/2026-10-17b.md`.
- It fixes the four HANDOFF-SITE-6 findings in `site/`.
- The spec keeps the site's three §7 lines from HANDOFF-SITE-6. One line changed: `window.claude.complete` waits up to 60 seconds, and every other request still gives up after 9.
- Nothing to build. `lib/generated/` didn't change.

**Checked.**
- Typecheck, 140 tests and the build.
- On the dev server, all 75 §11 request checks pass, including:
  - 1 to 3: logged out, `/` is the holding page and private paths 404;
  - 14: the help assistant's prompt is built on the server, with 700 tokens for the answer and 4,000 to think.
- In headless Chromium, every hub, proto and MVP 00–08 opens with no errors, as the owner and as each tester. With mode = guide, the guide loads 34 requests, all in `dist/_public.json`, and nothing from outside the site.
- The checks in CHANGES:
  - **A slow answer arrives.** Signed in on `/help`, a reply held back for 12 seconds arrived at 13 seconds, with no "Something went wrong" first and no console errors.
  - **No sideways scroll at 320 px.** `/help` is 320 px wide in As designed and all five looks, and the statement button is fully visible: 54–266 px, or 36–284 px in Field guide. In Flat it wraps to two lines.
  - **The home links open `/`.** In holding mode, logged out, the wordmark, "Back to home" and the footer's "Your free divorce guide" all go to `/` and show the holding page.
  - **Typed questions aren't logged.** As an MVP tester, a typed question logs `(question not sent)` in MVP 08 (`help-ai-q`) and MVP 07 (`ask-q`). A suggested question logs its own text. Neither typed question appears anywhere.
    - These were read from KIT's on-device event list, which holds the same value KIT sends once a participant session has started.
- **Not checked here:** the Vercel preview. This environment can't reach `*.vercel.app` or decouple.uk, so the preview checks are Ross's (below).

**Ross.**
- **On the preview, then on decouple.uk after merging:**
  - Ask the help assistant on `/help`, and Ask in MVP 07, a few real questions. Slow answers should now arrive.
  - CLAUDE_MODEL is `claude-haiku-5-5`. With the 60-second wait, `claude-opus-5-5` should work too, if you want to switch back. It costs more per question.
- **Mode:** the live store has `mode: "guide"`, so everyone sees the full guide at `/`. If that isn't intended, set it back to holding in Site settings.
- **Site settings landing and look:** still open.
  - On decouple.uk, `/api/admin/diagnose?write=1` writes, reads back and removes a probe, and all of it succeeds.
  - Picking a landing and a look in Site settings saves on the dev server.
  - So on the live site the page's saves may not reach the server. One possible cause is the page's preview mode, which keeps changes in the browser only: it starts when `/api/session` doesn't answer within 3.5 seconds.
  - To find out: on `/hub/site`, check whether the "Preview" box shows at the top, and what message appears after picking a landing.
- **Still open from before:**
  - Confirm Anthropic's API retention period for `privacy.html`, through the design project.
  - Paste `proto/ut/mvp-questions.csv` into the question sheet, then redo Results › Sheet setup.
  - Keep Show in search engines off until a family solicitor or mediator has checked `/help`, including the assistant.

**In `site/`, for the design project.**
- Nothing failed.

**Next.** The parked items: the end-to-end tester-code run, the spreadsheet tabs per test, Results playback, analytics and session tools.
