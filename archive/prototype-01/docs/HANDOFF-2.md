# Handoff 2 — Build

**A user can now** profile (P1 to P7, gated by the interview), connect the Tink demo bank in production or a test scenario anywhere, watch the reveal, confirm by exception in four tiers, and see Your Picture with evidence states and trust badges, in the preview.

**Decisions taken** (asked, answered, recorded in SESSION-CONTEXT): golden path extended with Sarah's profile and confirm clicks, no assertion changed; tier 1 at the spec's 0.90, not the code's 0.95; bank data in a gzip, chunked httpOnly cookie behind a `BuildStore` interface until server-side storage exists.

**The wiring.** `src/lib/build/confirm.ts` turns each detected signal into a finding: the tier comes from the signal's confidence and the profile's gates (lender or provider named ⇒ taken as read; pension answered ⇒ no "no pension" question; no vehicle ⇒ car finance never offered; unticked P6 ⇒ no statement gap), and the inherited generator's step id travels with it as the contract (`GENERATOR_STEP`, unit-tested against the generator). Sarah: five lines taken as read, one quick check, five gaps, three taps.

**Reference screens, one line each** (`docs/design-reference/build-17` to `28`): Your Picture drew on the tabbed paper (17), the only family that is a document with a chapter list, §-numbered sections and a rail; took the paper card, the § numbering, the snapshot and to-do rails, the "private draft" footer; dropped the version chip, the completion percentage, the credit check and the Form E export; changed "Disclose your position" (two banned words) to nothing, since Share is outcome 3. The hub variants (20 to 26) are the post-share moment and belong to Reconcile; the paper dashboards (27, 28) are dashboards, which the LOCKED shape rules out.

**Engine fixes in place:** scenarios use a seeded generator (they used `Math.random`, so a picture changed on every request); Sarah's Child Benefit is now four-weekly at the two-child rate so the engine's inference validates her declared count. Defects 2 to 5 wait for the golden path: `pension.no-contribution` is only gated (a retired profile never sees it), not fixed.

**What broke and was fixed:** axe rejects a `dl` whose `dt`/`dd` sit inside a nested wrapper; `pkill -f "next start"` matches the shell running it; a `'use server'` file must not export pure helpers, hence `src/lib/build/tink.ts`.

**Left in place:** Tink is wired end to end (callback → store → reveal) but unverifiable in the preview, since only the production callback is whitelisted; the Tink cookie is capped at three chunks and trims the oldest transactions to fit. "My bank isn't here" names the upload and manual entry that are not built. Per-section editing is "Change" back to the finding's question; upload, delete, re-categorise and valuations are next. Post-bank sections (children's names, property value, CETV entry) are not asked yet.

**Next:** outcome 3, the share. The golden path now fails at `getByRole('button', { name: /share/i })` on `/build/picture`.
