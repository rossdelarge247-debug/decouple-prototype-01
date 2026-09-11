# Claude Code — Decouple

Read `docs/BRIEF.md` first. It is the product, the journey, the non-negotiables, the
experience pillars and the bar. This file only says how to work in this repository.

## How to work

- **Build vertically.** One journey a real person completes on real data before any
  breadth. The current phase and the next outcome are named in `docs/SESSION-CONTEXT.md`.
- **One outcome per session, a fresh session each time.** The repository is the only
  memory: git, SESSION-CONTEXT, the last handoff, the golden path's failing step. A
  session that reaches context summarisation was too big; say so in the handoff.
- **Definition of done per session:** one sentence, "a user can now … in the preview",
  verified by clicking it in the Vercel preview.
- **The bar is the golden path.** `tests/e2e/golden-path.e2e.ts` encodes the script in
  the brief and fails at the first unbuilt step. Each session moves that point.
- **One pass per screen.** Reference, tokens, real data, wire it, ship. Polish once,
  against the whole journey, when the journey works.
- **Decisions are the human's.** At a fork, ask with `AskUserQuestion`, record the
  answer in one line in `docs/SESSION-CONTEXT.md`, continue. Never write a spec to
  avoid asking.
- **The floor is CI:** lint, typecheck, unit tests, production build. Nothing else.
  No hooks, personas, workflows, review loops, loop cards or specs.
- **Budget:** five sessions to the kill criterion in the brief. Then judge.

## Docs per session

Update `docs/SESSION-CONTEXT.md` (under 60 lines) and write `docs/HANDOFF-N.md`
(under 25 lines: what a user can now do, decisions taken, what broke, next).

## Startup

1. `npm ci`. For e2e in the Claude sandbox: `PW_CHROMIUM=/opt/pw-browsers/chromium npm run e2e:a11y`.
   Elsewhere `npx playwright install chromium` once.
2. Read `docs/SESSION-CONTEXT.md`.
3. Confirm the session's one outcome with the user, then build.

## Technical rules

- Reuse the engine in `src/lib/bank` and `src/lib/ai` verbatim. Fix bugs in place;
  do not rewrite. AI extracts facts; the app generates questions.
- Anthropic SDK: `output_config.format`, not `response_format`; every JSON schema
  object carries `additionalProperties: false`; 90s SDK timeout, 300s route
  `maxDuration`.
- Design tokens live in `src/styles/tokens.ts` and `src/app/globals.css`, kept in
  parity by `tests/unit/styles/tokens.test.ts`. Never inline a colour or font.
- Effects (storage, network, time) sit behind interfaces so logic is testable
  without mocking the world. Tests where there is logic; not for pure-visual UI.
- Comments say why, never what, and never carry session provenance.
- Production is https://decouple-prototype-01.vercel.app. Tink credentials are Vercel
  env vars and only the production callback is whitelisted in the Tink console.
- Diagnose before fixing: read the error, the log, the live DOM. Don't guess.
