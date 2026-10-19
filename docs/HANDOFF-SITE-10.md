# Handoff · site 10 (19 October 2026): export 2026-10-19b

**Landed.** Export `2026-10-19b` replaced `site/` whole. Its change note is `docs/exports/2026-10-19b.md`.
- New in 19b: a strapline between the top bar and every landing hero, A to I, reading "Free, step-by-step guidance for separation and divorce in England and Wales. Private, no account needed, and not a law firm."
  - The second sentence is hidden on narrow screens.
  - Tweaks offers three wordings or none.
- Everything else in it, the About page and its spec changes, landed with `2026-10-19a` (HANDOFF-SITE-9). The spec is the same as 19a's, so nothing new to build, and `lib/generated/` didn't change.
- **Not in CHANGES:** the guide's own saved look, its Tweaks `theme`, changed from `service` (Category norm) to `studio`. With Look and feel at As designed, the guide now shows in Studio. Site settings already holds `theme: "studio"` on decouple.uk, so the live site looks the same either way.

**Checked.**
- Typecheck, 146 tests and the build.
- In headless Chromium, on the dev server, logged out with mode = guide:
  - **The strapline.**
    - On every landing, A to I, it sits directly under the top bar at 320, 639, 641 and 1280 px, with no sideways scroll and no console errors.
    - The second sentence shows at 641 and 1280 px and is hidden at 320 and 639 px.
  - **The About checks from 19a, repeated, all pass:**
    - `/about` loads clean;
    - its links go to `/`, which shows the holding page or the guide by mode;
    - the guide's About link shows from 521 px;
    - the `/help` footer links to `/about`;
    - indexing works on and off.
  - **Landing A:** "Get my free guide" and "Start now" open the guide.
- The regression runs, each on a fresh dev server:
  - **All 76 §11 request checks pass.**
  - **Every hub, proto and MVP opens clean**, as the owner and as each tester. With mode = guide, the guide makes 37 requests, none outside `dist/_public.json`.
  - **Every link and button on landings A to I works.**
  - **All 30 short-address checks pass.**
- **Not checked here:** the Vercel preview. This environment can't reach it.

**Ross.**
- **On decouple.uk after merging:** check the strapline on the landing on a phone and on a computer.
- **Still open:**
  - **Site settings saves.** Check that the landing and the look stick, and that there's no "Preview" box on `/settings`.
  - **The privacy page.** Confirm Anthropic's API retention period for `privacy.html`, through the design project.
  - **Search.** Keep Show in search engines off until a family solicitor or mediator has checked `/help`, including the assistant.

**In `site/`, for the design project.**
- Nothing failed.
- **A one-pixel boundary.** CHANGES says the strapline's second sentence is hidden below 640 px. `m02/guide/g.css` uses `@media(max-width:640px)`, so it's also hidden at exactly 640. Use `max-width:639px` if 640 should show it. Otherwise this needs nothing.
- **Carried over from HANDOFF-SITE-8 and 9:**
  - the spec §2 update for the short addresses (with `/about` among the public pages);
  - Site settings falling back to preview mode when `/api/session` is slow;
  - the two speed proposals.

**Next.** The parked items: the end-to-end tester-code run, the spreadsheet tabs per test, Results playback, analytics and session tools.
