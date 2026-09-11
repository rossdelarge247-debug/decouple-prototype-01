# Decouple — base brief (v3, 11 September 2026)

Paste this as the opening message of a session. The concrete detail behind every
phase (question sets, state machines, rules, checklists, copy rules) lives in
`docs/JOURNEY.md`; this brief says what Decouple is, what it must never do, and how
to build it. The name is **Decouple**, tagline "the complete picture", never
"Decoupled".

## What it is

Decouple is the complete settlement workspace for separating couples in England and
Wales. It replaces the solicitor-and-mediator loop (£14,561 per person on average) with
a bank-evidenced, collaborative, end-to-end alternative: orient, build your financial
picture privately, share and reconcile it with your ex, settle it like a contract, and
leave with a court-ready consent order pack.

Three pillars: shared not adversarial · evidenced not asserted · end-to-end not hand-off.
Always "the complete settlement workspace", never "a financial disclosure tool".

This document describes a **prototype on sandbox data**. The production gates that
must pass before a real couple touches it are listed at the end of `docs/JOURNEY.md`.

## Who it's for

Two adults ending a marriage or civil partnership, usually one initiating, neither with
a solicitor. They are stressed, often alone, often late at night, and have never read a
Form E. The product must feel like a brilliant, patient analyst sitting beside them:
"Your salary is £3,218/month from ACME Ltd. Your mortgage is £1,150/month to Halifax.
Here's the picture taking shape." It does the heavy lifting; they confirm, correct or
fill gaps.

## The journey: five phases

Used verbatim as nav labels on every surface. Share is a button, not a phase. Locked
phases stay visible, dimmed, with "Unlocks when …".

1. **Start.** A public landing page (one screen: name, promise, honest cost, one
   button) and the public interview: eight screens, one topic per screen, about three
   minutes, no account. It learns the situation (stage, children, home, how things are
   between them, whether the device is private, self-employment, what they know of
   their partner's finances, priorities and worries) and ends with a personalised plan
   they can download, four exits, and a link to pricing. Facts in the plan are
   computed; only the prose is generated; nothing is invented. Then sign-up (password),
   the safety signposting screen for flagged users, a one-screen acknowledgement of
   what they told us, and a four-panel tour. Detail: JOURNEY §Start.
2. **Build.** Profile first (about three minutes: home, work, vehicles, pensions,
   children count, other assets; every answer gates later questions and the pension
   clock starts on day one), then connect banks, then confirm by exception in four
   tiers with a budget of three to five taps, then upload only the documents the gaps
   name. Output: **Your Picture**, a private document in the court's own shape, every
   line evidenced, entered or explicitly none, with an evidence state and a trust
   badge, children as §1, a monthly-gap metric, and inline per-section editing with a
   change log. No split or percentage is shown here. Detail: JOURNEY §Build.
3. **Reconcile.** The share is a deliberate act: choose sections, preview exactly what
   the other party will see, send. The other party enters by a single-use link,
   confirms or corrects the non-financial facts inherited about them (nothing merges
   silently), builds their own picture with their own bank connection, and triages
   each shared item: agree, value it differently, or don't know. The shared picture
   is one household schedule with a status quad (agreed · values differ · new to you
   · gap), conflict cards, typed queries and structured responses, and a deliberation
   queue ordered by £ impact. Settle unlocks at zero unresolved. If the other party
   never engages, a day 3 / 7 / 14 / 30 ladder ends in a court-ready timeline, and the
   picture stands alone as an export. Detail: JOURNEY §Reconcile.
4. **Settle.** Private prep (preferred and fallback positions, never shared). The
   proposal is per-section option cards (the home: sell and split, one buys out,
   defer until the youngest is 18) with a required reason, arithmetic context beside
   it (equal division, affordability, the CMS formula), and a running split banner.
   The counter shows only what changed, side by side, with Discuss · Counter ·
   Accept, and recomputes the split live. Versions are immutable. A progress board
   shows the £ gap closing. A split beyond 85% asks for an explanation; acceptance has
   a 24-hour cooling-off; Finalise unlocks only when both have signed. Detail:
   JOURNEY §Settle.
5. **Finalise.** The print-and-post pack from the agreed version: Form A by consent,
   D81 (04.25) pre-filled with Section 10 compiled from the reasoning trail, the draft
   order against Standard Family Order 1.3, Form P when a pension is shared, the
   optional Statement of Arrangements, a cover letter to the Harlow PO box with the
   fee read live from EX50, and a checklist (ink signatures on the D81; post only
   after the conditional order; hold the final order until sealed). A pre-flight of
   eight checks gates the pack; a solicitor review is recommended, never required.
   Then a self-reported tracker to sealed, and the implementation checklist with
   pre-filled letters. Detail: JOURNEY §Finalise.

## Verified process facts (11 September 2026)

- No-fault divorce: 20 weeks to the conditional order, then 6 weeks and 1 day before
  the final order can be applied for.
- A consent order is applied for after the conditional order with Form A, D81 and the
  draft order. Unrepresented couples cannot use the MyHMCTS portal; they post the pack
  to HMCTS Financial Remedy Service, PO Box 12746, Harlow, CM20 9QZ.
- D81 current version 04.25; out-of-date versions are rejected; both parties sign.
- Form E 01.23 section 2 headings are the capture checklist; the shared picture
  renders as an ES2-style schedule; the outputs are the D81 and the order.
- Standard Family Orders 1.3 (consent) and 2.1 (omnibus), revised 11 May 2026.
- The consent-route fee is £62 from 13 July 2026 and changes; read EX50 at pack time.
- MIAM exemptions narrowed on 29 April 2024 to domestic abuse, urgency and safety;
  the consent route does not go through a MIAM (confirm when building Finalise).
- Unverified: electronic signatures on the D81. Ink is the baseline.
- Drafting a consent order is not a reserved legal activity; where a party is
  unrepresented the court must approve rather than rubber-stamp.

## Public site and signed-in app

The landing page and the interview are public. The app sits behind sign-up and
sign-in from Build onward. The inviter has a password account; the invitee enters by
a single-use 14-day link to a pre-account landing and creates a password account
before entering any of their own financial data. Two-factor authentication before any
financial data is a production gate. Until Reconcile needs two real parties, a stub
session is acceptable, provided every screen and route reads the user through one
interface (`getSession`, `requireSession`) with the stub behind it, and the production
build fails if the real provider is not configured. The stub never reaches production.

## Non-negotiables

- A warm hand on a cold day. Compassionate, professional, never patronising, never
  legalese without a plain-English line beside it.
- Every question maps to a Form E or D81 field. If the answer fills nothing, don't ask.
- One topic per screen, one decision per moment.
- Profile, then connect, then confirm by exception. Never cold-start a question a bank
  signal or a document already answered.
- Private until shared. Nothing crosses without a previewed, deliberate send; the
  audit trail records what was shared and when.
- No freeform messaging. Queries, responses, proposals and counters are structured;
  free text lives only inside a response and is screened before send. This is a
  safeguarding decision.
- Safety on every screen: the exit control, the universal baseline, the flagged-user
  branch, pause-and-lock. Decouple is not a domestic abuse service and says so.
- The product informs, never advises. Arithmetic only; no "typical range" without a
  sourced basis; never "you should accept"; never what a user is entitled to. It
  recommends a solicitor review of the final order.
- Banned words: disclose, disclosure, position. Vocabulary: picture · shared · build ·
  reconcile · settle · finalise. No emojis. Errors carry a reference id.
- Colour is never the only indicator. WCAG 2.1 AA is a test, not a review.

## Experience pillars (highest-grade UX attention)

**Private and shared spaces.** Two spaces, visually distinct, named on every screen.
The private space is warm, editable and forgiving; the shared space is calmer, more
formal, read-mostly, with provenance on every entry. The only crossing is the send.
The private space keeps a "What I've sent" ledger. The other party's private space is
invisible in every sense: no counts, no hints. Presence in the shared space is a
bucketed status (invited · opened · building · shared), never timestamps, and it is
suppressed entirely when a safety flag is set.

**Queries, responses and the interplay.** Anchored to one item, typed, composed
privately, sent as one considered batch. Responses change the item's state for both
parties. Unanswered items show their age to both sides so nobody is stonewalled
invisibly. Tone is scaffolded with neutral templates.

**Track changes.** Settlement clauses are structured, so the primary diff is
structured: a counter renders changed sections only, old → new per term, author and
reason, with the split recomputed. Use a JSON diff library for the mechanics; the
rendering is ours. Prose fields (reasons, undertakings) may use a ProseMirror-based
editor; prose redlining is a could. No real-time co-editing: each party edits their
own version and sends.

**Safety.** See JOURNEY §Safety: the exit control's order of operations, the flagged
branch, pause-and-lock, and the rule that safeguarding data never appears in an
email, a notification, analytics or an AI request.

**Compassionate guidance.** The interview as the first act of care. One singular
"Your next step" on every post-sign-up screen with the full task list one tap behind
it. Consequences stated in plain words before every send. Quiet milestones. Designed
waiting when it is the other party's turn. A pause and a signpost after the heavy
moments. Every legal term explained beside itself.

## Core data model

Case · Party (two; role, safety flags, presence preference) · Child · Item (type,
owner A / B / joint, ownership tag: sole, joint, pre-marital, inherited, gifted,
disputed; matrimonial yes / no / disputed; per-party claim; evidence state: proved,
inferred, gap, invisible; trust level, six ascending; status: confirmed, contested
value, contested ownership, unique to A, unique to B, missing expected) · Send (a
selection of sections crossing private → shared, with preview snapshot and timestamp)
· Query (on an item; type; evidence; reason) · Response (provide / explain / accept /
dispute) · Proposal (an immutable version: ordered section cards, parent, author) ·
Card (section, chosen option, terms, reason, status: proposed, countered, accepted,
parked) · Comment (on a card id, survives versions) · Agreement (the accepted version
plus both signatures) · Task (phase, owner, needs, state) · Milestone · Change (per-
section log entry).

## Technical constraints

Next.js on Vercel; production https://decouple-prototype-01.vercel.app. Reuse the
engine in `src/lib/bank` and `src/lib/ai`: fifteen named signal rules, the
transformer, extraction schemas, result transformer, five synthetic scenarios. Fix in
place; do not rewrite. Inherited defects are listed in JOURNEY §Build; wire the
signal engine to the question generator first. AI extracts facts; the app generates
questions. Anthropic SDK: `output_config.format`, `additionalProperties: false`, 90 s
timeout, 300 s route `maxDuration`; internal ids not names to the provider; never
safeguarding data. Tink credentials are Vercel env vars; only the production callback
is whitelisted. Server-side state, every action persisted, idempotent. PDF generation
for the pack. Playwright for the golden path and the accessibility floor.

## How to work

- Build vertically. One journey a real person completes on real data before any
  breadth. Screens outside the current phase wait.
- Definition of done per session: one sentence, "a user can now … in the preview",
  verified by clicking it.
- One pass per screen. The product owner's reference screens are inspiration for
  structure, tone, spacing and colour, never a bar: look once, build, ship; no
  comparison, no rounds. Tokens, real data, wire it. Polish once, against the whole
  journey, when the journey works.
- Decisions are the human's. At a fork, ask; record the answer in one line; continue.
  JOURNEY marks what is already LOCKED; do not reopen it without asking.
- No specs, hooks, personas, workflows or review loops. Lint, typecheck, unit tests
  for logic, production build, Gitleaks, the accessibility floor. That is the floor.
- Budget: five sessions to the kill criterion below. Session 1 reaches Your Picture.
  Sessions 2 to 5: the invite, the other party's entry, the shared picture and
  reconciliation, and a first proposal with a counter and an acceptance.

## Out of scope for v1

A marketing site beyond the landing page and a pricing stub · Scotland and Northern
Ireland · unmarried cohabitants (routed to an honest exit) · contested proceedings ·
solicitor e-filing · payments (stub the price; nothing hardcoded) · mediator and
solicitor as in-product participants (exports cover the need) · behavioural
coercive-control detection · pension sharing valuations (take the CE value) ·
electronic signatures.

## The bar

### 1. The golden path (the bar for every session)

Sarah and Mark. Sarah answers the interview, signs up, sees her acknowledgement and
tour, profiles, connects the Tink demo bank, confirms by exception, uploads one
payslip and one mortgage statement, and sees Your Picture. She shares all sections
after a preview. Mark opens the link, confirms the facts about him, builds his own
picture with the demo bank, and triages hers: the joint account is agreed, her
estimate of the house is valued differently, his pension is a gap she queries. He
responds with the CETV letter and the item turns agreed. They resolve the house on a
midpoint. Sarah proposes 55/45 with the house deferred until Jake is 18; Mark counters
50/50 with a sale; version 4 is accepted by both and signed. Pre-flight passes. The
pack renders: Form A, D81 with a compiled Section 10, the draft order, Form P, the
cover letter. Under 40 minutes, no help.

This script is `tests/e2e/golden-path.e2e.ts`. It fails at the first unbuilt step.
Each session moves that point. Kill criterion at session 5: two parties reach an
agreed schedule and one signed version.

### 2. Reference products, one per pattern (feel, not pixels)

| Reference | Study | Apply to |
|---|---|---|
| Juro (juro.com/negotiate) | Version pipeline always visible, private vs shared, item-level accept or counter, threaded comments, deliberate send | Settle |
| GitHub pull request review | Inline comments on a line, approve or request changes, resolved threads | Reconcile queries |
| Stripe Dashboard | Live recalculation as inputs change | The split banner and card impacts |
| Linear | Status-driven progress, speed, keyboard flow | Progress board, task list |
| Monzo, Emma | Bank-connect trust, clean financial cards, progressive reveal | Build, Your Picture |
| GOV.UK Design System | One topic per page, plain language, error summaries | Interview and every form |
| iMessage, WhatsApp | Chronological flow, acknowledgement | Timeline, without freeform chat |

Patterns divorce needs that Juro doesn't: a progress board that makes convergence
visible · evidence linking on every number · "if you adjust this, here's the impact"
· an escalation path to a mediator.

### 3. Documents as the completeness bar

Form E 01.23 section 2 heading by heading: every field evidenced, entered, or
explicitly none. D81 04.25: every pre-filled field comes from the shared picture or
the agreed version, never typed twice. Standard Order 1.3: a draft a solicitor would
recognise and a judge would seal. The seven known rejection causes: none present.

### 4. When UX is satisfactory (the exit test for the polish pass)

- A first-time user completes the golden path with no help and no dead end. Timed.
- Every number shows its provenance on one tap: the transaction, the document, or
  "you told us", with its trust badge.
- No screen asks more than one topic. No question appears whose answer a bank signal
  or a document already gave.
- The other party can never see anything not explicitly sent, and the "What I've
  sent" ledger proves it.
- A counter reads as changed sections only, side by side, with reason and author, and
  the split updates before the user lifts their finger.
- The pack prints on A4 with the D81 fields where the court expects them.
- Works at 400 px width, meets WCAG AA, honours reduced motion, keyboard reachable.
- A user can say, without looking, whether they are in their private or the shared
  space. "Your next step" is present and singular on every post-sign-up screen.
- The safety answer demonstrably changes the journey: signposting, no presence, no
  timestamps, exit on every screen, pause-and-lock reachable.
- No banned word on any screen. No emoji. Every error has a reference id.
- Tone check on every screen: would a person crying at 1am feel steadier for reading
  it?
