# Handoff · site 2 (14 October 2026): export 2026-10-14a

**Landed.** Export `2026-10-14a` replaced `site/` whole, with its newer `docs/SITE-SPEC.md`; its change note is kept as `docs/exports/2026-10-14a.md`. New: the owner-only page `MVP 01 · Shared Statement.html` with `mvp/`, nine guide landing designs A to I (`m02/guide/g-landings2.jsx`), a landing picker on Site settings, a Full vision / MVP tab on the Prototype hub, MVP testing questions, and the three handoff-1 nits fixed (support address, example.com personas, `.jpg` thumbnails). The pages now find `shared/dc-site.js` with `src*=`, so the build cache-busts it like everything else.

**Wired.** The one new server field, `landing` (`"a"` to `"i"` or `"random"`, default `"a"`): read from the Global Config store, returned by `/api/session`, accepted by `/api/admin/site`, shown by the diagnostics page. A store without the item reads as `"a"`; the picker writes it. Answer rows already carried `landing`, so the script, `/api/answers` and `/api/results` needed nothing.

**Checked.** Typecheck, 68 tests, the build. On the emulator: the §11 request checks pass, including the landing round-trip; every hub, all ten protos and MVP 01 open in headless Chromium with no console errors or failed requests; logged out with mode = guide, every request the guide makes is in `_public.json`. Repeat §11 points 1 to 3 on decouple.uk after merging.

**In `site/`, for the design project.** Nothing failed. One note: testers with `TESTERS_CAN_OPEN_PROTOS=true` can open the ten protos but not MVP 01, which stays owner-only, as spec §4 is written. Say if MVP pages should join that rule.

**Next.** As before: the end-to-end tester-code run, the spreadsheet tabs review, the Results playback, and the session tools, all parked until the owner asks.
