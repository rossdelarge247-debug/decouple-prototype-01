# Handoff · site 5 (16 October 2026): export 2026-10-16a

**Landed.** Export `2026-10-16a` replaced `site/` whole. The spec is unchanged, and there was nothing to build. The change note is `docs/exports/2026-10-16a.md`. In `site/`:
- the guide's landing header and its interview and guide header link to Help & support;
- `privacy.html` names Anthropic;
- `/council-tax` is no longer marked `confirm`.

Both HANDOFF-SITE-4 findings are fixed.

**Checked.** Typecheck, 115 tests, and the build. `lib/generated/` is unchanged, with the same 51 public paths.

On the emulator:
- Every §11 request check (1, 3–5 and 8–13) passes.
- In headless Chromium, every hub, proto and MVP opens clean, as the owner and as each tester.
- Logged out, the guide makes 35 requests, all of them public.

The checks in the change note:
- **The header link.** Logged out, it opens the help page from `/guide` and, with mode = guide, from `/`, with no console errors. In the interview it opens a new tab (`rel=noopener`) and the guide keeps its place. It is hidden in print.
  - It opens the page at its file address, `/Marketing 03 · Help & Support.html`, not `/help`, the same way the pages link to `privacy.html`. Both addresses serve the same public page, and its canonical link is `https://decouple.uk/help`.
- **`/privacy`** names Anthropic, in the Ask item and in "Who else handles it".
- **The help build** reports no warnings. This pull request's CI build got 24 of 24 GOV.UK pages and forms D81, A, E, E1, E2. No path is marked `confirm` now, and the warn-on-confirm code stays.

**Ross.**
- **Anthropic's API retention period.**
  - Read it on Anthropic's Privacy Center: https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data. It said 30 days when checked, with longer for anything flagged under the Usage Policy. A third-party blog reports 7 days since September 2025, so read the page itself before deciding.
  - Then have the design project replace the marked line in `privacy.html`. `site/` isn't edited here.
- **A lawyer** still needs to check the other marked items in `privacy.html`, including the transfer mechanism for providers in the US.
- **Still open from HANDOFF-SITE-4:**
  - Paste `proto/ut/mvp-questions.csv` into the question sheet, then redo Results › Sheet setup.
  - Keep Show in search engines off until a family solicitor or mediator has checked `/help`.
  - `CRON_SECRET` is now set.

**In `site/`, for the design project.**
- **The Help & support link pushes Quick exit off narrow phones.** In `Marketing 02 · Divorce Guide.html` (with `m02/guide/g.css`), the right side of the header no longer fits:
  - **Landing header** (`header.nav .nav-right`): it scrolls sideways at 361 px wide and narrower. At 360 px, the most common Android width, Quick exit runs 2 px past the edge. At 320 px it is half off the screen, and only "Quick" shows.
  - **Interview and guide header** (`header.iv-top .r`): the same from about 340 px down.
  - Without the link, both fit at 320 px. The link is 97 px wide even with the `max-width:560px` rule.
  - Quick exit is the safety control, so it should be the last thing to lose room. Two ways to fix it: a shorter label ("Help") or an icon below about 400 px, or on phones keeping the link in the footer only and leaving the header to Quick exit.
- **A `?landing=` link sticks for good, so Site settings › Guide landing page seems to stop working.**
  - In `m02/guide/g-store.js`, `GS.load` saves `?landing=x` as `lvFixed` in the guide's saved state (`decouple.m02.v2`), and `?landing=random` as `lvRotate`. Nothing ever clears them.
  - From then on, that browser shows that design whatever Site settings says. After `?landing=random`, it keeps showing the same one random pick (`lvRand`).
  - Reproduced on the emulator. With Site settings set to B and then C, a fresh browser showed B and then C. A browser that had opened `?landing=f` once showed F both times. One that had opened `?landing=random` showed its pick, F, both times.
  - The fix: apply `?landing=` to that visit only, and don't save `lvFixed` or `lvRotate`. Keep saving `lvRand`, so a visitor rotated at random sees the same design each time.
- **The Marketing hub's guide card is out of date** (`Decouple · Marketing Hub.html`).
  - It says there are five designs, A to E, switched in Tweaks. There are nine, A to I.
  - On decouple.uk, Site settings decides the design. The Tweaks picker only works in the design project.
  - The comment at the top of the guide page's script also says `?landing=a–e`.
- Nothing else failed.

**Next.** The parked items: the end-to-end tester-code run, the spreadsheet's tabs per test, the Results playback, analytics and session tools.
