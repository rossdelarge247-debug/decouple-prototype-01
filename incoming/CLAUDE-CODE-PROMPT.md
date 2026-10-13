# Prompt for Claude Code

Paste everything below the line into Claude Code, started in a clone of `rossdelarge247-debug/decouple-prototype-01`, with this zip unpacked at the repo root as `incoming/`.

---

You're turning this repository into the Decouple site at **decouple.uk**. The current Next.js app is now **historical**: archive it, don't delete it. From now on, `main` holds:
- a set of static HTML pages exported from our design project (prototype hub, marketing hub, results, Protos 01–10, the M02 guide and the M01 holding page);
- a thin server layer around them: a login, tester codes, an answers API, a Google Apps Script backend, the guide email, and the build.

**Read `incoming/docs/SITE-SPEC.md` in full first.** It is the source of truth: who can see what, the addresses, the middleware, the build, the API, the Apps Script, the environment variables, the checks and the housework order. The pages in `incoming/site/` are finished. Don't redesign, rewrite or reformat them. The only UI you build is the login page and the 404 page (spec §8).

How to work:
1. **Stop and ask me before anything destructive:**
   - after tagging and branching the old app (spec §12.1);
   - before removing environment variables;
   - before merging to `main`.
   Everything else, go ahead.
2. **Work on a branch,** `site-v1`. Move `incoming/site/` → `site/` and `incoming/docs/SITE-SPEC.md` → `docs/SITE-SPEC.md`, then delete `incoming/`.
3. **Order:**
   1. middleware and sessions;
   2. the build;
   3. the API;
   4. the Apps Script and SETUP.md;
   5. the login and 404 pages;
   6. the tests and CI;
   7. the Vercel config;
   8. the spec §11 checks on the preview.
4. **Testing:**
   - Put the logic in `lib/` as pure functions, with unit tests: cookie signing, code checks, answer cleaning, the public allow-list and the build transform.
   - No tests for the pages themselves.
5. **When a page in `site/` fails:**
   - Find out why from the console and the network log. Don't guess.
   - If the cause is the build, fix the build.
   - If it's the page, don't edit it. List it in the handoff, with the error and the file, so it can be fixed in the design project and re-exported.
6. **If I need to click something** (Google, Resend, DNS, Vercel settings you can't reach), write exact steps, one action per line, then carry on with whatever doesn't depend on it.
7. **Finish with `docs/HANDOFF-SITE-1.md`** (spec §12.9) and a short summary to me:
   - the preview URL;
   - what I need to do, in order;
   - which §11 checks passed.

Don'ts:
- Don't commit secrets.
- Don't add analytics, cookie banners or tracking scripts.
- Don't make any private path redirect to the login: it must 404.
- Don't use the Tink or Anthropic keys.
- Don't change `site/`.
