# Session context

## Journey and state

Five phases (Start · Build · Reconcile · Settle · Finalise), per `docs/BRIEF.md`; detail
in `docs/JOURNEY.md`. Start and Build are built (`docs/HANDOFF-1.md`, `docs/HANDOFF-2.md`).
The golden path fails at the Share button on `/build/picture`. Phase: **Reconcile**.

## Outcomes, one per session, fresh session each time

1. Start: done. "A user can complete the interview, see their plan, sign up, and see
   the acknowledgement and tour in the preview."
2. Build: done. "A user can profile, connect the Tink demo bank or a test scenario,
   confirm by exception, and see Your Picture in the preview."
3. Invite: "A user can share selected sections after a preview; the other party can
   enter by link, confirm or correct their facts, and sign up."
4. Reconcile: "Both parties see one household schedule with the status quad, triage
   items, raise and answer queries, and reach zero unresolved."
5. Settle: "A party can propose with option cards, the other can counter, and version
   4 is accepted and signed."
6. Finalise: "Pre-flight passes and the print-and-post pack renders."
Kill criterion: by the sixth merged outcome, two parties reach an agreed schedule and
one signed version; if not, the brief is at fault. **Next: outcome 3**, the share.

## Deployment

Production https://decouple-prototype-01.vercel.app; every branch gets a preview. The Tink
callback is whitelisted for production only; elsewhere the five test scenarios stand in.
`TINK_CLIENT_ID`, `TINK_CLIENT_SECRET` and `ANTHROPIC_API_KEY` are Vercel env vars.

## Decisions on record

- Name: Decouple, tagline "the complete picture". Print-and-post pack; no e-filing.
  Reference screens are inspiration not bar; Juro is the negotiation bar. Public landing
  and interview; app behind sign-up from Build; auth stubbed until Reconcile. Spec mining,
  11 Sept (ES2-style shared picture, Form E as the capture checklist, option cards,
  arithmetic only, magic-link invitee, selective sharing, honest pricing): LOCKED in JOURNEY.
- Session 1: landing shows the conventional £14,561 only. Golden path extended with
  Sarah's clicks, no assertion changed. Safety messages deterministic; O3 and flags never
  reach the model. The stub refuses in production unless `AUTH_PROVIDER` is set.
- Session 2: golden path extended with the profile and confirm clicks. Tier 1 is the
  spec's 0.90. Bank data is a gzip, chunked httpOnly cookie behind `BuildStore` until
  server-side storage exists (a production gate). Your Picture drew on the tabbed paper.
- Where things live: tokens `src/styles/tokens.ts` + `globals.css`; strings `src/copy/`;
  session `src/lib/session`; Build domain and store `src/lib/build`; loader `src/app/build/state.ts`.

## CI

Lint · typecheck · unit tests · build · Gitleaks · the accessibility floor
(`tests/e2e/screens-a11y.e2e.ts`, axe on every route in `ROUTES`; cookies seeded from
`tests/e2e/fixtures.ts` with Sarah's profile and scenario). Add each route the session it ships.

## Lessons (one line each)

- The inherited engine is untested beyond what `tests/unit/build` now covers. Sandbox e2e
  needs `PW_CHROMIUM=/opt/pw-browsers/chromium`; wait for `load`, never `networkidle`.
- Next's route announcer echoes the h1 after a client navigation and a strict locator
  polls from the click: keep golden-path phrases out of headlines and the screen being left.
- axe wants `dt`/`dd` as direct children of the `dl` or of one `div`; never nest a wrapper.
