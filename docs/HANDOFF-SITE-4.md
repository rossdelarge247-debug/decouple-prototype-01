# Handoff · site 4 (16 October 2026): export 2026-10-15a

**Landed.** Export `2026-10-15a` replaced `site/` whole, with its newer `docs/SITE-SPEC.md`; its change note is `docs/exports/2026-10-15a.md`. New: the help and support hub, public at `/help` (Marketing 03) and in the toolkit as MVP 08, both reading `help/`. The three HANDOFF-SITE-3 findings are fixed or still open as the change note says.

**Built, in the order of "What to build".**
1. `/help` rewrites like `/privacy`; the page, `help/` and both JSON files are in `_public.json`.
2. The help step (`lib/build/help.mjs`, spec §5.2): each path from the GOV.UK Content API, one at a time with a pause and our User-Agent, retried twice; bodies cleaned to the allowed tags; the five forms from the collection; `help/help-content.json`. A missing path fails the build by name; `confirm` paths warn; anything GOV.UK doesn't answer comes from the live copy, else `{built: null, pages: {}, forms: []}`.
3. `GET /api/cron/rebuild` (Bearer `CRON_SECRET`, 16+ characters) calls the deploy hook; `vercel.json` runs it Mondays 05:00 UTC.
4. Indexing covers `/help`; the sitemap's `lastmod` is read from the deployment's own `_build.json` (for `/`, `/privacy`) and `help/help-content.json` (for `/help`); canonical `https://decouple.uk/help`.
5. `<link rel="prefetch">` was already cache-busted; `help/*.json` is served `no-cache`.
6. Track token `m08`, `mvp` = nine MVPs, `/p/mvp08`.
7. `/api/signup` takes the source `help`.

Two readings of the spec, both noted in the code: GOV.UK titles put the form last ("…: Form D81"), so the forms match takes the code at the start of the title or after a colon, not only at the start. A guide part (`/guide/part`) that GOV.UK doesn't route is looked up in its guide before it counts as missing. A transaction page (a start button, no body) keeps its introduction as its text; a page with no text at all would show its title, summary and link, and the build names it (none did on the first run).

**Checked.** Typecheck, 115 tests (the help step against sample Content API responses), the build. On the emulator: §11 request checks 1, 3–5 and 8–13 pass; in headless Chromium every hub, proto and MVP 00–08 opens clean, and logged out `/help` makes 14 requests, all public, both JSON files included, none to `/api` and none outside the site. With sample content each topic shows "Source: GOV.UK, updated …" and the footer the licence line.

**GOV.UK.** The first real fetch (the CI build of `0865f48`, 18 s): 24 of 24 pages, forms D81, A, E, E1, E2. No path failed and none warned: `/council-tax`, the one marked `confirm`, is on GOV.UK. Every page had body text. The Vercel build fetches again on each deploy, and the weekly rebuild keeps it fresh.

**Ross.** Set `CRON_SECRET` in Vercel. Keep Show in search engines off until a family solicitor or mediator has checked `/help`. Paste `proto/ut/mvp-questions.csv` (84 rows) into the question sheet, then redo Results › Sheet setup (9 MVP tabs plus Screener).

**In `site/`, for the design project.**
- `privacy.html` still has the `[AI provider]` placeholders. The model is now chosen: `claude-opus-5-5`, through Anthropic's API.
- `help/help-sources.json`: `/council-tax` is on GOV.UK, so its `"confirm": true` can go.
- Nothing else failed: every page opened without a console error or a failed request, as owner and as a tester on the `mvp` track.

**Next.** The parked items: the end-to-end tester-code run, the spreadsheet tabs per test, Results playback, analytics and session tools.
