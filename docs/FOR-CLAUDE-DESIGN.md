# Working with the live site: what the design project owns, what the build owns

For the Claude Design project. The site at decouple.uk is your export plus a thin layer around it.
Your export is the `site/` folder of the repository, read-only, replaced whole on every export.
The layer (middleware, API, Google script, build) lives beside it and never edits it. If a page
fails on the site, it is reported back to you with the file and the error; it is not patched here.

## You own

Every page and asset in `site/`: copy, layout, behaviour. The shared client `shared/dc-site.js`.
The questions template `m02/guide/questions-template.csv`. The site spec `docs/SITE-SPEC.md`.

## The build does these to your pages, so you do not have to

- Compiles every `text/babel` script with esbuild, one IIFE each, and removes the Babel tag.
- Swaps the unpkg React development builds for production builds served from the site.
- Replaces Google Fonts links with self-hosted fonts.
- Adds `?v=<hash>` to JS and CSS references.
- Works out which files are public from the guide, the holding page and the privacy page.
- Writes `m02/guide/questions.json` from the sheet, or an empty list, so the page never 404s.

## The contract: keep these and an export drops in with no wiring changes

1. Talk to the server only through `shared/dc-site.js` and the routes in spec §7, with the same
   payload shapes. New data, a new route or a new email is a spec change: write it into
   `docs/SITE-SPEC.md` before exporting, and it gets built first.
2. Keep the page file names. The address table maps `/`, `/guide`, `/holding`, `/privacy`, `/hub`,
   `/hub/marketing`, `/hub/results`, `/hub/site` and `/p/01` to `/p/10` onto them. A renamed or new
   page needs a line in the export notes.
3. Keep assets on relative paths, as now, with no `<base>` tag. Hash routing is fine. Addresses
   with a path segment redirect to the file for this reason.
4. Keep `shared/dc-site.js` under exactly that name. Since export 2026-10-14a the pages find it
   with `src*=`, so the build cache-busts it like every other script.
5. Fonts self-hosted today: Inter, Source Serif Pro, JetBrains Mono, Caveat, Mrs Saint Delafield,
   Homemade Apple. A new family is one line in the build, but flag it.
6. The only outside scripts expected are unpkg React and Babel, which the build replaces.
   Anything else loaded from a CDN, flag it.
7. Public pages are the guide, the holding page and the privacy page. A new public page must be
   named, so it joins the allow-list; everything else is owner-only by default.
8. Safety answers, names and email addresses never travel as answers; the client already strips
   them and the server strips them again.

## How an export lands

A zip holding `site/`, plus `docs/SITE-SPEC.md` when the spec changed. The site replaces `site/`,
runs the build, the tests and the checks, and opens a pull request named `sync: design export
<date>`. Minutes, not a rebuild. The build refuses an export that still loads Babel, unpkg or
Google Fonts, that references a missing file, or that needs an unknown font, and says which.

## Waiting for you

Nothing after export 2026-10-14a. New findings go in the next `docs/HANDOFF-SITE-<n>.md`, as
spec §12 says.

## Current state of the layer, for reference

Node 22 on Vercel. The settings store is Vercel Global Config (Edge Config, renamed). The owner's
switches, tester codes, answers, sign-ups and the guide email are live once their services are set
up; `/api/admin/diagnose`, signed in, shows which are. Pages are served unchanged except for the
build steps above.
