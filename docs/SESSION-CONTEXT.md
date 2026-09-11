# Session context

## Journey and state

Five phases (Start · Build · Reconcile · Settle · Finalise), per `docs/BRIEF.md`; detail
in `docs/JOURNEY.md`. Start is built (`docs/HANDOFF-1.md`). The golden path fails at the
Build scenario picker (`getByRole('button', { name: /sarah/i })`). Phase: **Build**.

## Outcomes, one per session, fresh session each time

1. Start: done. "A user can complete the interview, see their plan, sign up, and see
   the acknowledgement and tour in the preview."
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
one signed version; if not, the brief is at fault. **Next: outcome 2** (profile, bank or test scenario, confirm by exception, Your Picture).

## Deployment

Production https://decouple-prototype-01.vercel.app; every branch gets a preview. The Tink
callback is registered for production only. Env vars `TINK_CLIENT_ID`,
`TINK_CLIENT_SECRET`, `ANTHROPIC_API_KEY` are in Vercel.

## Decisions on record

- Name: Decouple, tagline "the complete picture". Print-and-post pack; no e-filing.
  Reference screens are inspiration not bar; Juro is the negotiation bar. Public landing
  and interview; app behind sign-up from Build; auth stubbed until Reconcile.
- Spec mining, 11 Sept: ES2-style shared picture, Form E as the capture checklist; option
  cards; arithmetic only, no AI coach; invitee by magic link; selective sharing; honest
  pricing, nothing hardcoded. LOCKED in JOURNEY.
- Session 1: landing shows the conventional £14,561 only. Golden path extended with
  Sarah's clicks, no assertion changed. Plan safety and privacy messages deterministic;
  O3 and flags never reach the model. Production builds; the stub refuses there unless
  `AUTH_PROVIDER` is set. Answers and stub session are httpOnly session cookies.
- Where things live: tokens `src/styles/tokens.ts` + `globals.css`; strings
  `src/copy/start.ts`; facts `src/lib/start/facts.ts`; session `src/lib/session`.

## CI

Lint · typecheck · unit tests · build · Gitleaks · the accessibility floor
(`tests/e2e/screens-a11y.e2e.ts`, axe WCAG AA on every route in `ROUTES`; cookies seeded
from `tests/e2e/fixtures.ts`). Add each new route the session it ships. Nothing else.

## Lessons (one line each)

- The inherited engine has no unit tests beyond the callback route; treat it as untested.
  Playwright presets default to WebKit; projects pin chromium. Sandbox e2e needs
  `PW_CHROMIUM=/opt/pw-browsers/chromium`; wait for `load`, never `networkidle`.
- Next's route announcer echoes the h1 after a client navigation and a strict locator
  polls from the click: keep golden-path phrases out of headlines and the screen being left.
