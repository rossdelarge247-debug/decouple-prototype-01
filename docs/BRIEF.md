# Decouple — base brief (v2, verified 11 September 2026)

Paste this as the opening message of the first session in the new repository.
The name is **Decouple** (tagline "the complete picture"), never "Decoupled".

## What it is

Decouple is the complete settlement workspace for separating couples in England and
Wales. It replaces the solicitor-and-mediator loop (average £14,561 per divorce) with a
bank-evidenced, collaborative, end-to-end alternative at £800–1,100: orient, build your
financial picture privately, share and reconcile it with your ex, negotiate the
settlement like a contract, and leave with a court-ready consent order pack.

Three pillars: shared not adversarial · evidenced not asserted · end-to-end not hand-off.

## Who it's for

Two adults ending a marriage or civil partnership, usually one initiating, neither with
a solicitor. They are stressed, often alone, often late at night, and have never read a
Form E. The product must feel like a brilliant, patient analyst sitting beside them:
"Your salary is £3,218/month from ACME Ltd. Your mortgage is £1,150/month to Halifax.
Here's the picture taking shape." It does the heavy lifting; they confirm, correct or
fill gaps.

## The journey (seven phases, in order; every screen belongs to exactly one)

1. **Orient.** A short interview (under 8 questions) that learns their situation
   (children, home, who earns what, how amicable, where they are in the divorce) and
   shows them the road ahead. No account needed. Ends with a personalised plan and a
   price.
2. **Sign up and invite.** Password account. Invite the other party by email; they get
   their own private space. Both sides are symmetric from here on.
3. **Build, privately.** Connect banks (Tink), upload evidence (payslips, P60s,
   mortgage and pension statements, valuations), answer only the questions the
   evidence leaves open. Output: a private "Your Picture" covering every Form E
   section 2 heading: the home, other property, bank accounts, investments, personal
   assets over £500, debts, business interests, pensions (CE value), income from every
   source. Plus section 3 needs and the children. Every line is evidenced (linked to a
   transaction or document), entered by the user, or explicitly "none". Nothing is
   assumed.
4. **Share and reconcile.** Each party chooses when to disclose. The shared picture is
   one unified list of household items, each carrying who declared it, who holds it,
   and whether the value is agreed (not two Form Es side by side). It flags gaps and
   mismatches (the joint account that appears once, the pension one party forgot) and
   lets either party raise a query against a line, with evidence attached. Ends when
   both confirm the pot: what is A's, B's, joint, and the total.
5. **Propose and negotiate.** Treat the settlement like a contract under version
   control: proposals are versions; every change is a tracked redline with an author
   and a reason; comments attach to clauses; either party can accept a clause, counter
   it, or park it. Clauses cover the home (sell, transfer, defer), lump sums, pensions
   (share or offset), spousal maintenance, child arrangements and child maintenance,
   and future needs. The workspace shows the effect of each version on the split in
   real time. Ends when both accept the same version.
6. **Agree and pack.** Generate the print-and-post pack from the agreed version:
   - Form A, ticked as an application by consent.
   - Form D81 (version 04.25) with both parties' columns pre-filled from the shared
     picture and the agreed version, including the "effect of the order" section.
   - The draft consent order, generated against the structure of Standard Family
     Order 1.3 (consent order, accelerated procedure), revised 11 May 2026.
   - A cover letter addressed to HMCTS Financial Remedy Service, PO Box 12746,
     Harlow, CM20 9QZ, with the fee instructions. The fee is read from the current
     EX50 at pack time, never hardcoded (£62 as of 13 July 2026).
   - A checklist: both parties sign the D81 statement of truth in wet ink (electronic
     signature acceptance is unverified, so ink is the baseline); post only after the
     conditional order; do not apply for the final order until the consent order is
     sealed, because pension and inheritance rights end with the marriage; enquiries
     to ContactFinancialRemedy@justice.gov.uk.
   - A recommendation, not a gate, that a solicitor reviews the draft order on a
     fixed fee before posting.
7. **Implement.** A post-order checklist with owners and dates: transfer the house,
   serve the pension sharing annex on the scheme, close the joint account, set up
   maintenance, apply for the final order.

## Verified process facts (sources in the session that produced this brief)

- No-fault divorce: 20-week reflection period to the conditional order, then 6 weeks
  and 1 day before the final order can be applied for.
- A consent order is applied for after the conditional order with Form A, Form D81 and
  the draft order. Unrepresented couples cannot use the MyHMCTS portal (mandatory for
  solicitors only); they post the pack to the Harlow PO box.
- D81 current version 04.25. Out-of-date versions are rejected. Both parties sign.
- Form E current version 01.23, five sections; section 2 headings define completeness.
- Standard Family Orders 1.3 (consent) and 2.1 (omnibus) are the drafting templates.
- MIAM exemptions narrowed from 29 April 2024 to domestic abuse, urgency and safety.
  The consent route does not go through a MIAM (confirm at phase 6 build), but the
  safeguarding exit applies on every screen regardless.
- Unverified: whether the court accepts an electronically signed D81. Ink is baseline.

## Public site and signed-in app

Two surfaces, one codebase.

- **The public site** needs no account: a landing page (the name, the promise, the
  price, one "Start" button) and the whole of the phase 1 interview. Anyone can
  arrive from a search or a shared link, answer the interview, and see their plan
  before being asked for anything. The landing page is one screen in v1; it exists
  because the interview needs a front door, not as a marketing site.
- **The app** sits behind sign-up and sign-in from phase 2 onwards. Everything a
  party discloses, shares or negotiates is theirs alone and their ex's only when
  sent, so the app requires a real, secure account per party in production.
- **Auth can be deferred; the boundary cannot.** Real accounts are needed by phase 4,
  when two parties act on one case. Until then a stub session (a fixed local user,
  no password check) is acceptable, provided every screen and route reads the user
  through one interface (`getSession`, `requireSession`) with the stub behind it. A
  later swap to a real provider must not touch a screen. Never let the stub reach
  production: the production build fails if the real provider is not configured.

## Non-negotiables

- A warm hand on a cold day. Compassionate, professional, never patronising, never
  legalese without a plain-English line beside it.
- Every question maps to a Form E or D81 field. If the answer fills nothing, don't ask.
- One thing at a time: one question per screen, one decision per moment.
- Connect first, confirm by exception. Bank data does 70%; the user confirms the rest.
- Show, don't ask. Never cold-start a question when a bank signal exists.
- Private until shared. Nothing crosses to the other party without an explicit,
  previewed send, and the audit trail records what was shared and when.
- No freeform messaging. All communication is structured: queries, proposals,
  responses. This is a safeguarding decision, not a feature gap.
- Safeguarding first. A domestic-abuse exit on every screen, helpline signposting,
  and an escalation path ("get help from a mediator") when the tool reaches its limit.
- Not legal advice. The product explains the law (section 25 factors, clean break,
  how pensions are valued) and recommends a solicitor review of the final order. It
  never tells a user what they are entitled to.

## Experience pillars (these get the highest-grade UX attention in the build)

### Private and shared spaces

Two spaces, always visually distinct, never confusable. The private space is "yours":
warm, editable, forgiving, full of drafts and notes nobody else sees. The shared space
is "ours": calmer, more formal, read-mostly, where every entry carries who put it
there and when. The boundary between them is a single deliberate act, the send, with
a preview of exactly what the other party will see. Rules:

- A persistent indicator on every screen says which space the user is in.
- Nothing moves from private to shared silently. No autosave crosses the line.
- The private space keeps a "what I've sent" ledger so a user can see their own
  disclosure history without visiting the shared space.
- The shared space shows both parties' presence and last activity ("Mark viewed your
  disclosure Tuesday 9:14pm") because knowing the other person is engaging is
  itself reassurance.
- The other party's private space is invisible in every sense: no counts, no "Mark
  has 3 unsent items", nothing that leaks.

### Queries, comments and responses (the interplay)

The conversation between the parties is the product. It is structured, item-anchored
and asynchronous, and it must feel fair to both sides at all times.

- A query is raised against one item or clause, never free-floating. It has a type
  (missing, mismatch, needs evidence, needs explanation), an optional evidence
  attachment, and a short reason.
- A response is one of: provide (attach evidence or a value), explain (text), accept
  (agree the other party's figure), or dispute (keep mine, say why). Every response
  changes the item's state visibly for both parties.
- Threads resolve. An item is either open, awaiting A, awaiting B, or agreed. The
  progress board counts these, so convergence is visible and neither party can be
  stonewalled invisibly.
- Everything queued, nothing pushed. A party composes queries privately, reviews the
  batch, and sends once. The other party receives one considered set, not a stream.
- Tone is scaffolded. Query and response templates are pre-written in neutral, plain
  language ("Can you attach the statement for this account?"). Free text is allowed
  inside a response but never as a standalone message, and it is screened for
  abusive content before send, with a cooling prompt rather than a block.
- No read-and-ignore. Unanswered queries show their age to both parties, and the
  next-action list on each side always includes "3 queries waiting for you".

### Track changes: what to build and what to use

Settlement clauses are structured data (type, terms, amounts, dates), so the primary
redline is a structured diff, not a text diff. Build it: a clause-level comparison
between any two versions that renders each changed term as old → new with author and
reason, and recomputes the split. Use a JSON diff library such as jsondiffpatch for
the mechanics; the rendering is ours.

Where clauses carry prose (the reason for a change, particular child arrangements,
undertakings), use a ProseMirror-based editor via TipTap with prosemirror-changeset
to compute and display tracked insertions and deletions between versions. Comments
anchored to clauses can use TipTap's comments extension or our own thread model tied
to the Clause id; prefer our own, because comments must survive across versions and
attach to structured clauses, not only to text ranges. Do not adopt real-time
co-editing (Yjs, Liveblocks): both parties edit their own version and send; that is
the Juro model and the safeguarding model.

### Safety

Safety is a property of every screen, not a phase. Concretely:

- An "Exit this page" control in the same place on every screen that leaves the site
  instantly and does not appear in history.
- The interview asks about safety early, gently, and privately ("Is there anything
  about your relationship that makes you feel unsafe?"), and its answer changes the
  journey: no shared presence indicators, no activity timestamps visible to the other
  party, a route to the MIAM exemption evidence, and signposting to helplines and to
  a mediator or solicitor instead of direct negotiation.
- Financial control is abuse. The product watches for it in the data (income
  disappearing, accounts closed, one party with no access to the household money) and
  raises it privately with the affected party, never in the shared space.
- The other party can never learn a user's location, device, session times, or
  whether they read something, unless presence is explicitly on.

### Compassionate guidance, hand-holding and next actions

The product is a guide, not a form. It should feel like a calm professional walking
alongside, one step at a time, never leaving a user wondering what happens next.

- The interview (phase 1) is the first act of care. Under 8 questions, one per
  screen, each explaining why it is asked and what it unlocks. It ends with a plain
  plan: "Here's what happens, in what order, and roughly how long each part takes."
- A single "Your next step" is visible on every screen after sign-up. Only one. The
  full task list sits one tap behind it, grouped by phase, with each task showing
  what it needs (a document, a decision, the other party) and its state.
- Actions carry consequences in plain words before they happen: "Sending this means
  Mark will see these 14 items. You can't unsend, but you can add to them."
- Milestones are acknowledged: first bank connected, disclosure complete, pot agreed,
  version accepted. Quiet, not confetti.
- Explanations sit beside every legal term, in one sentence, with a "tell me more"
  that never leaves the screen.
- Waiting is designed. When the next step is the other party's, the screen says so,
  says what they have been asked to do, and gives the user something useful they can
  do meanwhile (upload the next document, read what a consent order does).
- Emotional pacing. After the heavy moments (disclosure, first counter-proposal) the
  product offers a pause and a signpost to support, and never stacks another demand
  on the same screen.

## Core data model

Case · Party (two; safety flags, presence preference) · Child · Item (asset,
liability, income, outgoing) with owner (A, B, joint), value, evidence links,
confidence, agreed flag and state (open, awaiting A, awaiting B, agreed) · Send (a
batch of items or queries crossing from private to shared, with timestamp and
preview snapshot) · Query (on an item or clause; type: missing, mismatch, needs
evidence, needs explanation; evidence; reason) · Response (provide, explain, accept,
dispute) · Proposal (a version: ordered clauses, parent version, author) · Clause
(type, terms, prose, status: proposed, countered, accepted, parked) · Comment (on a
clause id, survives versions) · Agreement (the accepted version plus signatures) ·
Task (phase, owner, needs, state) · Milestone.

## Technical constraints

Next.js 15 on Vercel. Reuse the existing bank engine verbatim: Tink client,
transformer, signal rules, extraction schemas, result transformer, five synthetic
scenarios. AI extracts facts; the app generates questions. Anthropic SDK for document
extraction. Tink credentials are Vercel env vars; the production callback is the only
whitelisted redirect. Playwright for the golden-path test. PDF generation for the pack.

## How to work

- Build vertically. One journey a real person completes on real data before any
  breadth. Screens outside the current phase wait.
- Definition of done per session: one sentence of the form "a user can now … in the
  preview", verified by clicking it.
- One pass per screen. Reference, tokens, real data, wire it, ship. Polish once,
  against the whole journey, when the journey works.
- Decisions are the human's. At a fork, ask; record the answer in one line; continue.
- No specs, hooks, personas, workflows or review loops. Lint, typecheck, unit tests
  for logic, production build. That is the whole floor.
- Budget: five sessions to reach the kill criterion below. Session 1 reaches Your
  Picture by reuse. Sessions 2 to 5 build invite, shared picture, reconcile, and a
  first proposal version with acceptance.

## Out of scope for v1

A marketing site beyond the one landing page · Scotland and Northern Ireland · pension sharing valuations (take the CE value the user
uploads) · unmarried cohabitants · contested proceedings · solicitor e-filing · payments
(stub the price).

## The bar

### 1. The golden path (the bar for every session)

Sarah and Mark. Sarah answers the interview, signs up, invites Mark. Both connect the
Tink demo bank and upload one payslip and one mortgage statement each. Both disclose.
The shared picture shows the joint account once, flags Mark's missing pension, Sarah
queries it (one considered batch, previewed, sent), Mark responds with the statement
and the item turns agreed. They agree the pot. Sarah proposes 55/45 with the house
deferred until Jake is 18; Mark counters 50/50 with a sale; they land on version 4.
The D81, Form A and draft order render into one pack. Under 40 minutes, no help.

This script is the first Playwright test in the repo. It fails at the first unbuilt
step. Each session moves the point where it fails. The kill criterion at session 5:
two parties reach an agreed pot and one accepted version.

### 2. Reference products, one per pattern (feel, not pixels)

The earlier research (collaboration specs 35 and 37) settled on Juro as the contract
tool. Keep it. The table below is that research plus the phases it didn't cover.

| Reference | Study | Apply to |
|---|---|---|
| Juro (juro.com/negotiate) | Version pipeline, clause-level redlining, threaded comments, deliberate send | Phase 5 negotiation |
| GitHub pull request review | Inline comments on a line, approve or request changes, resolved threads | Phase 4 queries on items |
| Stripe Dashboard | Real-time recalculation as inputs change | Effect of a version on the split |
| Linear | Status-driven progress, speed, keyboard flow | Progress board across phases |
| Monzo, Emma | Bank connect trust, clean financial cards, progressive disclosure | Phase 3 Your Picture |
| GOV.UK Design System | One question per page, plain language, error summaries | Interview and every form |
| iMessage, WhatsApp | Read receipts, chronological flow | Timeline and accountability, without freeform chat |

Five patterns lifted from Juro: version pipeline always visible · private workspace
vs shared space · item-level accept or counter, never whole-proposal · threaded
comments on items with evidence links · deliberate send with preview.
Four patterns divorce needs that Juro doesn't: a progress board that makes convergence
visible · evidence linking on every number · scenario modelling ("if you adjust this,
here's the impact") · an escalation path to a mediator.

### 3. Documents as the completeness bar

Form E 01.23 section by section: every field evidenced, entered, or explicitly none.
D81 04.25: every field the pack pre-fills comes from the shared picture or the agreed
version, never typed twice. Standard Order 1.3: the draft order a solicitor would
recognise and a judge would seal.

### 4. When UX is satisfactory (the exit test for the polish pass)

- A first-time user completes the golden path with no help and no dead end. Timed.
- Every number on screen shows its provenance on one tap: the transaction, the
  document, or "you told us".
- No screen asks more than one thing. No question appears whose answer a bank signal
  or document already gave.
- The other party can never see anything the first party hasn't explicitly sent, and
  the audit trail proves it.
- Version 4 of a proposal reads as a redline against version 3, with author and
  reason on every change, and the split updates before the user lifts their finger.
- The pack prints on A4 with the D81 fields where the court expects them.
- Works on a phone at 400px width, meets WCAG AA contrast, honours reduced motion,
  and every interactive element is reachable by keyboard.
- A user can say, without looking, whether they are in their private space or the
  shared space, and can find "what I've sent" in one tap.
- A query, its response and the item's resulting state are visible to both parties
  in one thread, with the age of anything unanswered showing on both sides.
- "Your next step" is present and singular on every post-sign-up screen, and every
  send shows its consequence in plain words before it happens.
- The safety answer in the interview demonstrably changes the journey: no presence,
  no timestamps, helplines and the mediator route surfaced, "Exit this page" on
  every screen.
- Tone check on every screen: would a person crying at 1am feel steadier for reading
  it?
