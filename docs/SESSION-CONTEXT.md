# Session context

## Journey and state

Five phases (Start · Build · Reconcile · Settle · Finalise), per `docs/BRIEF.md`; detail
in `docs/JOURNEY.md`. Seeded with the brief, the journey detail (condensed from the
previous prototype's 99 specs), the engine and the golden-path test. No screens, no
design system yet. The golden path fails at step 1. Current phase: **Start**.

## Outcomes, one per session, fresh session each time

1. Start: "A user can complete the interview, see their plan, sign up, and see the
   acknowledgement and tour in the preview."
2. Build: "A user can profile, connect the Tink demo bank or a test scenario, confirm
   by exception, and see Your Picture in the preview." Wires the signal engine to
   the question generator.
3. Invite: "A user can share selected sections after a preview; the other party can
   enter by link, confirm or correct their facts, and sign up."
4. Reconcile: "Both parties see one household schedule with the status quad, triage
   items, raise and answer queries, and reach zero unresolved."
5. Settle: "A party can propose with option cards, the other can counter, and version
   4 is accepted and signed."
6. Finalise: "Pre-flight passes and the print-and-post pack renders."

Kill criterion: by the sixth merged outcome, two parties reach an agreed schedule and
one signed version; if not, the brief is at fault.
**Next: outcome 1** (landing, interview, plan, sign-up, safety branch, acknowledgement, tour).

## Deployment

Production https://decouple-prototype-01.vercel.app; every branch gets a preview. The
Tink callback is registered for production only, so the real bank click works there
only. Env vars `TINK_CLIENT_ID`, `TINK_CLIENT_SECRET`, `ANTHROPIC_API_KEY` are in Vercel.

## Decisions on record

- Name: Decouple, tagline "the complete picture". Print-and-post pack; no e-filing.
- Previous visual design discarded; the design system starts from the owner's new
  reference screens at the first screen build, inspiration not bar. Juro is the
  negotiation bar. Landing page and interview public; app behind sign-up
  from Build; auth stubbed behind one session interface until Reconcile; the stub
  never reaches production.
- Spec mining, 11 Sept: five phases; ES2-style shared picture with Form E as the
  capture checklist; option-card negotiation; arithmetic only, no typical ranges, no
  AI coach; invitee enters by magic link; selective sharing by section; behavioural
  coercive-control detection deferred; honest pricing, nothing hardcoded. LOCKED
  items are marked in JOURNEY.md.

## CI

Lint · typecheck · unit tests · build · Gitleaks · the accessibility floor
(`tests/e2e/screens-a11y.e2e.ts`: axe WCAG AA on every route in `ROUTES`, production
build). Add each new route the session it ships. Nothing else.

## Lessons (one line each)

- The inherited engine has no unit tests beyond the callback route; treat the signal
  rules as untested until a test says otherwise.
- Playwright device presets default to WebKit; projects pin `browserName: 'chromium'`.
- In the Claude sandbox run e2e with `PW_CHROMIUM=/opt/pw-browsers/chromium`.
