# Claude Code — Decouple

This repository is the site at decouple.uk. Read `docs/SITE-SPEC.md` before changing anything:
it is the source of truth for who can see what, the addresses, the middleware, the build, the
API, the Google script and the environment variables.

## Rules

- **`site/` is read-only.** It is exported from the design project and changed only through
  `SYNC.md`. If a page fails, find out why from the console and the network log. If the cause is
  the build, fix the build. If it is the page, do not edit it: list it in the handoff with the
  error and the file, so it can be fixed in the design project and re-exported.
- The only pages built here are `pages-src/studio.html` (login) and `pages-src/404.html`.
- `lib/generated/` is written by the build. Never edit it by hand; run `npm run build` and
  commit the result. CI fails when it is stale.
- Logic goes in `lib/` as pure functions with unit tests. No tests for the pages themselves.
- Private paths return 404, never a redirect to the login. Nothing links to the login page.
- No analytics, cookie banners or tracking scripts. No secrets in git. Safety answers, names
  and email addresses are never stored as answers, server-side as well as client-side.
- `archive/prototype-01/` is frozen. Change nothing there unless the task is explicitly about it.

## Running it

```
npm ci && npm run build && npm run dev    # http://localhost:3000, mocked services
npm test && npm run typecheck             # what CI runs, with the build
```

## Where things are

`middleware.ts` (spec §4) · `api/*.ts` (§7) · `lib/` (§3 sessions and codes, §4.4 tracks, §5.1 search,
§7 cleaning, the AI proxy, settings, email) · `scripts/build.mjs` and `lib/build/transform.mjs` (§5) · `apps-script/` (§6)
· `vercel.json` (§12.7) · `docs/HANDOFF-SITE-<n>.md` (the latest says what works and what is still to do; exports are logged in `docs/exports/`).
