# Handoff · site 3 (14 October 2026): export 2026-10-14d

**Landed.** Export `2026-10-14d` (with 14b and 14c, never landed) replaced `site/` whole, with its newer `docs/SITE-SPEC.md`; its change note is `docs/exports/2026-10-14d.md`. New: the participant hub (`Decouple · Take Part.html`), MVP 00 to 07 (MVP 01 · Shared Statement is now MVP 05 · Financial Statement), the code-making form with tracks, the indexing switch, 75 MVP testing questions.

**Built, in the order of "What to build".**
1. `/api/answers` takes `Screener` and `MVP 0N · Name` (each its own tab). The screener's wellbeing answer (`scr-wb`) is dropped server-side too.
2. Codes carry `track` and `mode` (`lib/tracks.ts`). A tester opens the pages in their track, `/take-part`, `proto/`, `mvp/`, `shared/`, `take-part/` and those pages' inline scripts; never the hubs. `/api/session` returns `track` and `trackMode`. `TESTERS_CAN_OPEN_PROTOS` is gone.
3. `/take-part`: `?code=` redeems and comes back; no session, the code page (`pages-src/take-part-code.html`); a tester whose code has no track goes to `/`.
4. `/api/participant` → `kind: "participant"` → the `Participants` tab, three per `sid`, nothing in test mode. No read returns it.
5. `/api/claude`: owner or tester, 20 messages, 8,000-character system, 1,200 tokens, 40 calls an hour, monthly spend estimate in Global Config `aiSpend`, 503 until `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` and `CLAUDE_MONTHLY_CAP_USD` are all set. Low effort; the default server-side fallback where the model has one. Logs token counts, never content.
6. `/p/mvp00`–`/p/mvp07`, and the old MVP 01 address redirects to MVP 05.
7. `indexing`: robots.txt and the sitemap from the middleware, `/` and `/privacy` lose the noindex header when it's on; canonical links; every script and stylesheet minified, comments out.

Apps Script: `track` and `mode` columns (added to the existing Codes tab on first use), `Participants`, `kind: "participant"`; results never read Participants, Signups or Codes.

**Build fixes this export needed.** `mvp/kit/kit.jsx` sits beside a real `mvp/kit/kit.js`, so JSX beside a same-named script now compiles to `kit.jsx.js` (before, it overwrote it and every MVP page broke). Links are read with `&amp;` decoded. The public list comes from tag attributes only, so `ut-questions.js` stays private.

**Checked.** Typecheck, 99 tests, the build. On the emulator: §11 request checks 1, 3–5, 8–12 pass; in headless Chromium every hub, proto and MVP opens for the owner with no errors, each track opens only its pages, AI answers come back through `/api/claude`, the participant hub walks through to the thank-you step (rows on Screener and Participants, no wellbeing answer), and the guide in guide mode makes 35 requests, all public. Not checked here: anything on decouple.uk or Vercel (blocked from this container), the real sheet, the real AI, Lighthouse.

**Ross.** Paste and redeploy `apps-script/Code.gs`. Choose the model and the cap, then set the three AI variables. Delete `TESTERS_CAN_OPEN_PROTOS` and any old `ANTHROPIC_API_KEY`. Paste `proto/ut/mvp-questions.csv` into the question sheet, redo Results › Sheet setup, then make a test code with track MVP and walk its `/take-part` link.

**In `site/`, for the design project.**
- Spec §7, the `/api/admin/codes` row is garbled: the row repeats itself from the track regex on, and the second copy drops "labels of 40 characters at most". Built as meant: `^(|full|mvp|[pm]\d{2}(,[pm]\d{2})*)$`, labels up to 40, `mode` `un` or `mod` (empty with no track).
- `mvp/kit/kit.js` and `mvp/kit/kit.jsx` share a name. The build copes; renaming one would be tidier.
- `privacy.html` still has the `[AI provider]` placeholders, as the change note says.

**Next.** The parked items: the end-to-end tester-code run, the spreadsheet tabs per test, Results playback, analytics and session tools.
