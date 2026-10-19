# Decouple

The site at **decouple.uk**: the pages exported from the design project, a thin server layer
around them, and the build that makes them fast. The spec is `docs/SITE-SPEC.md`; the first
handoff is `docs/HANDOFF-SITE-1.md`. The earlier prototype lives on in `archive/prototype-01/`
(see `ARCHIVE.md`).

| Folder or file | What it is |
|---|---|
| `site/` | The exported pages, read-only. Changed only through `SYNC.md`. |
| `middleware.ts` | Who may see what: the allow-list, the aliases, the sessions, the 404. |
| `api/` | Vercel Functions: login, tester codes, answers, sign-ups, the guide email, results, the owner's switches. |
| `lib/` | Pure, tested logic: cookie signing, code checks, answer cleaning, the settings in Vercel's Global Config store, the build transform. |
| `scripts/build.mjs` | `site/` → `dist/`: compiled JSX, production React, self-hosted fonts, cache-busting, the public allow-list. |
| `scripts/dev.mjs` | Runs the site locally the way Vercel routes it, with every outside service mocked. |
| `pages-src/` | The two pages built here, not in the design project: the login and the 404. |
| `apps-script/` | The Google Apps Script behind the results spreadsheet, and how to set it up. |
| `tests/` | Vitest. |
| `docs/` | The spec and the handoffs. |
| `archive/prototype-01/` | The first prototype, frozen. |

## Run it locally

```
npm ci
npm run build          # site/ → dist/
npm run dev            # http://localhost:3000, services mocked, owner password "decouple-dev"
```

`npm test`, `npm run typecheck` and `npm run build` are what CI runs. `npm run hash-password`
prints the value for `OWNER_PASSWORD_HASH`. To run against the real services, put the
variables from spec §9 in `.env.local` (never committed).

## How a request is served

1. The middleware lets `/api/*`, the login path, `/holding`, `/privacy`, `/help` and every path in
   the public allow-list through, and answers `/robots.txt` and `/sitemap.xml` from the indexing switch.
   The build fills `/help` with GOV.UK text from the Content API (`lib/build/help.mjs`, spec §5.2).
   `/shared/dc-look.js` goes to `/api/look`, which sends the look set in Site settings (spec §7);
   the design project's preview file of that name is left out of `dist/`.
   The help assistant (`/api/claude` with `kind: "help"`) builds its prompt on the server with
   `site/help/help-prompt.js`, which the build compiles into `lib/generated/help-prompt.ts`.
2. `/` shows the guide or the holding page, by the mode switch and the visitor's session.
   `/guide` always shows the guide. `?code=` redeems a tester code.
3. `/take-part` is the participant hub for a tester whose code has a track, or a small code page
   without a session. `?code=` works there too.
4. The aliases in spec §2 map to files. Everything else needs the owner's session, or a tester
   whose track includes it (`lib/tracks.ts`), or returns a plain 404.
5. Every page has a short address of one segment (`lib/aliases.ts`): `/guide`, `/holding`, `/help`,
   `/privacy`; `/hub`, `/marketing`, `/results`, `/settings`, `/take-part`, `/free-tool`, `/p01`–`/p10`,
   `/mvp00`–`/mvp08`. One segment, so a rewrite keeps the address and the page's relative paths still
   resolve. A page's file address, and the older `/hub/…` and `/p/…` aliases, redirect there; for a
   private page only after the session check, so anyone else still gets a 404.

Two things differ from the spec, and why, are in `docs/HANDOFF-SITE-1.md`.
