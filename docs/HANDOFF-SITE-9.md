# Handoff · site 9 (19 October 2026): export 2026-10-19a

**Landed.** Export `2026-10-19a` replaced `site/` and `docs/SITE-SPEC.md` whole. Its change note is `docs/exports/2026-10-19a.md`.
- It adds a public About page, `about.html`.
- The guide's landing top bar gains an "About" link, hidden below 520 px.
- The `/help` footer gains "About".
- The spec adds `/about` wherever it names `/privacy`. Nothing else in it changed.
- `2026-10-18a` (landing A's start buttons) had already landed, in HANDOFF-SITE-8.

**Built: `/about`, handled like `/privacy` everywhere.**
- **Address:** `/about` serves `about.html` by rewrite. `about.html` itself redirects (308) to `/about`, as the other public pages' file addresses do since HANDOFF-SITE-8.
- **Middleware:** `/about` goes straight through, with `no-cache`. It drops the noindex header only when `indexing` is on.
- **Search:**
  - `/about` is one of the indexable addresses (`lib/search.ts`);
  - `robots.txt` names `Allow: /about$` after `/privacy`;
  - the sitemap lists `/about`, with the build date as its `lastmod`.
- **Build:**
  - `about.html` is scanned for the public allow-list, which now has 58 paths: the page itself, and nothing it needs that wasn't already public;
  - its canonical is `https://decouple.uk/about`;
  - `lib/generated/public.ts` is rebuilt to match.

**Checked.**
- Typecheck, 146 tests and the build. New test checks:
  - `/about` serves `about.html`, with `no-cache` and the noindex header while indexing is off;
  - `about.html` redirects to `/about`;
  - with indexing on, `/about` has no robots header and is in `robots.txt` and the sitemap.
- In headless Chromium, on the dev server, the checks in CHANGES:
  - **`/about` loads logged out** with no failed requests and no console errors, and it has a Quick exit.
  - **Its wordmark and "Get my free guide" go to `/`.** In holding mode that shows the holding page. In guide mode it shows the guide, once the switch has taken effect (within a minute, as the spec gives it).
  - **The guide's About link** shows in its landing top bar at 1280 and 521 px, and is hidden at 520 and 320 px. Clicked, it opens `/about`.
  - **The `/help` footer** has an About link, and it opens `/about`.
  - **Indexing.** Off, `/about` has `X-Robots-Tag: noindex, nofollow`. On, it has none and is in `robots.txt` and `sitemap.xml`.
  - **Landing A's start buttons** still open the guide (the landing click-through below).
- The regression runs, each on a fresh dev server:
  - **All 76 §11 request checks pass.** The sitemap check now expects `/`, `/privacy`, `/about` and `/help`.
  - **Every hub, proto and MVP opens clean**, as the owner and as each tester. With mode = guide, the guide makes 34 requests, none outside `dist/_public.json`.
  - **Every link and button on landings A to I works.** Their About links open `/about`, and landing A's "Get my free guide" and "Start now" open the guide.
  - **The 30 short-address checks pass:**
    - all 24 private short addresses open and keep their address;
    - every link on `/hub` and `/marketing` lands on a short address;
    - testers reach only their own pages;
    - logged out, every private short address is a 404.
- **Not checked here:** the Vercel preview. This environment can't reach it.

**Ross.**
- **On decouple.uk after merging:** open `/about` from the guide's top bar and from the `/help` footer.
- **Still open:**
  - **Site settings saves.** Since the move to London the store holds the latest picks, so they may be fixed. Check that the landing and the look stick, and that there's no "Preview" box on `/settings`.
  - **The privacy page.** Confirm Anthropic's API retention period for `privacy.html`, through the design project.
  - **Search.** Keep Show in search engines off until a family solicitor or mediator has checked `/help`, including the assistant.

**In `site/`, for the design project.**
- Nothing failed.
- **Carried over from HANDOFF-SITE-8:**
  - the spec §2 update for the short addresses;
  - Site settings falling back to preview mode when `/api/session` is slow;
  - the two speed proposals (show the guide's landing without waiting on `/api/session`, and let browsers keep private `?v=` scripts).
  - The new §2 table should add `/about` to the public pages.

**Next.** The parked items: the end-to-end tester-code run, the spreadsheet tabs per test, Results playback, analytics and session tools.
