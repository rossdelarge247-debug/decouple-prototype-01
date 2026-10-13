# Landing a new export from the design project

`site/` is a copy of the design project's export. It is never edited here. When a new export
lands, replace it whole:

1. Unzip the export. Its `site/` folder replaces this repository's `site/` folder entirely:
   delete the old one first, so removed files go too.
   ```
   rm -rf site && cp -R /path/to/export/site site
   ```
2. If the export carries a newer `docs/SITE-SPEC.md`, copy that over as well and read the diff.
3. Build and test:
   ```
   npm run build && npm test && npm run typecheck
   ```
   The build fails if a page still loads Babel, unpkg or Google Fonts, if a reference does not
   resolve, or if a page needs a font family the build does not self-host (add it to
   `FONT_PACKAGES` in `lib/build/transform.mjs` and install its `@fontsource` package).
4. Commit `site/` together with `lib/generated/`, which the build rewrote.
5. Run the site locally (`npm run dev`) and check spec §11, points 1 to 3: logged out `/` shows
   the holding page and private paths 404; signed in, the hubs and every proto open with no
   failed requests; with mode = guide, the guide's landing page loads with every request in
   `dist/_public.json`.
6. Open a pull request named `sync: design export <date>`. The preview deployment is where the
   §11 checks are repeated before merging.
