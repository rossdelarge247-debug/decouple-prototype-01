# Handoff 1 — Start

**A user can now** open the landing page, answer the eight-screen interview, see a plan of computed facts with model prose (or without, silently), take one of four exits, sign up, see the safety signposting if flagged, the acknowledgement, the tour, and land on the Build home, in the preview.

**Decisions taken** (asked, answered, recorded in SESSION-CONTEXT): conventional cost figure only on the landing; golden path extended with Sarah's clicks, no assertion changed; safety and privacy messages deterministic and O3 never sent to the model; production keeps building, the stub refuses at runtime.

**Reference screens, one line each** (`docs/design-reference/start-*`):
- Landing (01, 02, 03 folded): took the gradient ground, wordmark, serif-with-italic headline, black pill, trust line; dropped the marketing nav and drill-in pages, TrueLayer, the £980 and "5 minutes"; the brief's one screen, Tink, three minutes, the honest £14,561.
- Interview intro (04): not built; JOURNEY has no intro, its tone went into O1's body.
- Interview screens (05, 06, 07): took the step header, progress, option cards, the "so far" rail, the safety check-in panel; dropped the six-step flow, "how long together" and the financial sliders (they fill no Form E field); O3 uses JOURNEY's four options plus the device question.
- Plan (08): took "here's what we heard", the path strip, two note cards, the next-step rail, "no pressure"; dropped the settlement-range card entirely (the product never says what a user is entitled to) and "email me"; six steps, not four.
- Sign-up (09): the file is a duplicate of the tour welcome, so the form is the LOCKED field set alone, GOV.UK error summary with a reference id.
- Tour (10 to 15): took the phase-coloured panels and step pill; dropped "Prepare", "disclosure", "position", "AI legal assurance"; one panel per URL so it works without JavaScript; the five phase names verbatim.
- First dashboard (16): became `/build`, the honest empty state with the phase nav, private indicator and one next step; Build itself is session 2.

**What broke and was fixed:** Next 16's route announcer echoes the h1 after client navigation and a strict locator polls from the click, so no headline or departing screen may carry a golden-path phrase (unit-tested). `'use server'` files export only async functions. Chromium never reaches network-idle behind the sandbox proxy.

**Left in place:** `src/types/interview.ts` and `src/lib/ai/plan-narrative.ts` are dead legacy code from the previous interview; delete when someone decides. Sign-in in the stub starts a session for any email. The plan's download is print-to-PDF.

**Next:** outcome 2, Build. The golden path now fails at `getByRole('button', { name: /sarah/i })` on `/build`: the test-scenario picker that stands in for the Tink demo bank.
