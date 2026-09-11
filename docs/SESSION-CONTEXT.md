# Session context

## Journey

Five phases, per `docs/BRIEF.md` (Start · Build · Reconcile · Settle · Finalise); the
detail is in `docs/JOURNEY.md`. Current phase: **Start**.

## State

Repository seeded with the brief, the journey detail (condensed from the previous
prototype's 99 specs), the bank and extraction engine, the design tokens and the
golden-path test. No screens built. The golden path fails at step 1.

## Next outcome (session 1)

"A user can answer the interview, sign up, profile, connect the Tink demo bank or a
test scenario, confirm by exception, and see Your Picture in the preview." Start and
Build, by reuse of the engine; wire the signal engine to the question generator.

## Deployment

Production: https://decouple-prototype-01.vercel.app. Vercel deploys every branch; the
Tink callback `https://decouple-prototype-01.vercel.app/api/bank/callback` is registered
in the Tink console, so the real bank click works on production only. Env vars
`TINK_CLIENT_ID`, `TINK_CLIENT_SECRET`, `ANTHROPIC_API_KEY` are set in Vercel.

## Decisions on record

- Name: Decouple, tagline "the complete picture".
- Phase 6 is a print-and-post pack. Solicitor e-filing is out of scope for v1.
- Bar for negotiation UX: Juro. Reference table in the brief.
- Budget: five sessions to the kill criterion.
- Spec mining (11 Sept): five phases, ES2-style shared picture with Form E as the capture
  checklist, option-card negotiation, arithmetic only (no typical ranges, no AI coach),
  invitee enters by magic link, selective sharing by section, behavioural coercive-control
  detection deferred, honest pricing with nothing hardcoded. LOCKED items in JOURNEY.md.
- Landing page and interview are public. The app is behind sign-up and sign-in from
  phase 2. Auth is stubbed behind one session interface until phase 4 needs real
  accounts; the stub never reaches production.

## CI

Floor: lint · typecheck · unit tests · build · Gitleaks · the accessibility floor
(`tests/e2e/screens-a11y.e2e.ts`, axe WCAG AA on every route in its `ROUTES` list, on the
production build). Add each new screen's route to that list the session it ships. Nothing
else: no coverage gates, hooks, personas, review loops or audit checks.

## Lessons (one line each)

- The previous prototype's engine has no dedicated unit tests beyond the callback
  route; treat the signal rules as untested until a test says otherwise.
- Playwright device presets default to WebKit; the projects pin `browserName: 'chromium'`.
- In the Claude sandbox Playwright's own Chromium is absent: run e2e with
  `PW_CHROMIUM=/opt/pw-browsers/chromium` (a symlink to the pinned build).
