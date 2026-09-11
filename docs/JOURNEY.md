# Decouple — the journey in detail

The companion to `docs/BRIEF.md`. The brief says what Decouple is and how to work; this
file holds the concrete essence condensed from the previous prototype's specs: question
sets, state machines, rules, checklists and copy rules. It is the only reference
document in this repository. Where it says LOCKED, the decision was taken by the
product owner and is not reopened without asking.

Five phases, used verbatim as nav labels on every surface: **Start · Build · Reconcile ·
Settle · Finalise**. Share is a button, not a phase. Locked phases stay visible, dimmed,
with "Unlocks when …" and their CTAs replaced by Locked pills.

---

## Start

### The public landing page
One screen: the name, the promise ("the complete picture"), what it costs compared
with the conventional route stated honestly, and one Start button. No account. A
pricing page stub exists because the plan links to it. No other marketing pages.

### The interview (public, ~3 minutes, 8 screens, one topic per screen)
Every screen explains why it asks and what it unlocks. Flags are set silently.

- **O1 Where you're at:** We've decided to separate — I want to get the finances
  sorted · I'm thinking about separating — I want to understand what's involved ·
  We're already in the process — I want to get things moving faster. Sets tone
  (action / softer / faster).
- **O2 Your situation** (four radios, one topic): Relationship — Married / Civil
  partnership / Cohabiting / Other · Living together — Yes / No / Complicated ·
  Children under 18 — No / Yes → 1 / 2 / 3 / 4+ · Your home — Own with mortgage / Own
  outright / Rent / Other. "Cohabiting" routes to an honest exit: the tool is for
  married couples and civil partners; here is what applies to you.
- **O3 How things are between you:** Amicable — we want to sort this out together ·
  Difficult — but manageable · High conflict — communication is very hard · I have
  safety concerns. Plus: "Is this device private to you?" Yes / Not sure.
- **O4 Self-employed or a company director?** No — both employed or not working ·
  Yes — I am · Yes — my ex is · Yes — we both are.
- **O5 How much do you know about your partner's finances?** I have a good idea of
  everything · I know some things but not all · Very little — they managed the money ·
  I suspect they may be hiding things.
- **O6 What matters most** (pick up to 3): fair split · keeping the family home ·
  protecting my pension · stability for the children · a clean break · getting this
  done quickly · keeping costs low · ongoing financial support. **What worries you
  most** (up to 3): not enough to live on · hidden assets or dishonesty · losing my
  pension · can't afford the mortgage alone · the cost of the process · the emotional
  toll · my ex not cooperating · not knowing what's fair.
- **O7 Your plan.** Seven elements: situation summary · the journey timeline (filing →
  building the picture → reconciling → settling → court → implementation) · what needs
  to happen · the conventional path with its costs and timeline · how Decouple helps ·
  personalised notes (max 2 anchored on children and home) · links. No price in the
  plan; a link to pricing. Downloadable as a PDF.
- **O8 What's next:** Create my account · Download the plan (optional email) · I'd
  rather go the conventional route (GOV.UK, MIAM, mediators, solicitors) · I need to
  talk to someone first (support resources).

**Plan generation (LOCKED).** Facts are deterministic, prose is generative. The app
computes the six journey steps, cost and timeline ranges from a versioned facts
module, the resource lists and three flags (safety, device not private, complexity =
self-employed or "hiding"). One LLM call, narrow JSON schema (`additionalProperties:
false`): situation summary, exactly six step positions, one to three notes, one key
difference, nullable safety message, nullable privacy message. The LLM never invents
a number, date, cost or statistic. Safety and privacy messages render first. On any
failure the deterministic plan renders with no visible error; signposting always
renders. Banned framing: "save thousands", urgency, scarcity, social proof.

**Pre-signup state (12 fields)** bridges into the app and is never re-asked: stage,
relationship, living together, children count, home, relationship quality, device
private, self-employment, partner awareness, priorities, worries, plan. It gates the
app: no children ⇒ no children, childcare or Child Benefit sections; rent ⇒ rent
confirmation instead of mortgage; "hiding" ⇒ credit check recommended before sharing;
safety or device-not-private ⇒ the safety branch below.

### Sign-up and sign-in (LOCKED)
Sign-up: full name · email · password (min 12) · terms checkbox · "Create my account".
Sign-in: email · password · Forgot? Password reset comes with real auth.

### First screens after sign-up
1. **Safety signposting** (flagged users only, before anything else): six named
   helplines — Women's Aid, National Domestic Abuse Helpline, Men's Advice Line,
   Refuge, Surviving Economic Abuse, Samaritans — and 999; three choices: Continue —
   I'm safe to · Exit to a safe site now · Show me more support services.
2. **Moment 1 acknowledgement:** "Based on what you told us: separating · 2 children ·
   own with a mortgage · …" with correct affordances.
3. **Welcome tour**, four panels: build your picture · share and reconcile · propose
   and settle · finalise.
4. **Your next step** appears from here on every screen, singular.

---

## Build

### Pre-bank profiling (~3 minutes, one topic per screen, each answer gates later questions)
- **P1 Home.** Mortgage → "Who is your mortgage with?" (lender list of the 15 largest
  UK lenders + other). Own outright → skipped. Rent → landlord or agent, amount, day.
- **P2 Work.** Self-employed or director (from O4) → business name, structure (sole
  trader / Ltd / partnership / other), how you pay yourself (PAYE salary only /
  dividends only / both / drawings / not sure), other income channels (client payments
  / rental through the company / other / none). Otherwise skipped.
- **P3 Vehicles.** None / one / more; per vehicle: on finance? provider (12 named).
- **P4 Pensions.** Yes, one / Yes, more than one / Already drawing / Not sure — maybe
  from old jobs / No. Then provider, and the quiet defined-benefit proxy: "Do any of
  these apply?" public sector (NHS, teachers, civil service, police, armed forces,
  local government) · a large company joined before 2012 · none / not sure. The user
  never sees "DB" or "DC" here. Then the CETV nudge: what it is, why it takes 6 to 12
  weeks (public sector up to 12 months), request it today; it becomes the first task.
- **P5 Children** (if any): count confirmed only; names and ages come after the bank.
- **P6 Other assets** checklist: savings · investments · crypto · life insurance ·
  valuables over £500 · money someone owes you · none. Unticked items are never asked
  about later.
- **P7 Accounts heads-up** (not a checklist): app banks (Monzo, Starling, Revolut,
  Chase), savings providers with statements only (NS&I, Marcus, Chip, Atom), joint
  accounts, accounts closed in the last 12 months.

**Gates.** Workplace pension known ⇒ no visible contribution is expected, not a gap.
No vehicle ⇒ a large payment is not assumed to be a car. Provider known ⇒ Aviva is
disambiguated pension-vs-insurance with a hint. Unticked P6 items ⇒ no false-positive
questions.

### Bank connection
Order: profile → connect → confirm by exception → targeted upload for gaps.
Trust band on the connect screen: "FCA regulated · Read-only, we can't move money ·
Disconnect anytime" (Tink). Picker grid of 8 popular banks + search all providers +
"My bank isn't here" → CSV/PDF upload → "Enter manually". Same document, different
badge. Outcomes: success → reveal; cancelled → state preserved, return to picker;
error → recovery screen (retry / different bank / upload / manual). Failure modes to
handle: OAuth timeout, unsupported bank, browser crash mid-flow, 90-day consent expiry
(renewal prompt 7 days out; if not renewed the data is labelled "as of [date]").
Multiple banks are normal (most people have 3 to 5). A joint account connected by
both parties merges by sort code + account number.

**The reveal** (the designed magic moment): per account, items fade in staggered
(salary, mortgage, car finance, Child Benefit validating the declared child count,
insurances, council tax, utilities, transaction count), values count up, the progress
bar advances per item. Timing budget: micro 100–150 ms, content swap 200 ms,
structural 300 ms, showcase 250 ms per item; never over 600 ms; no spring or bounce on
financial values; no auto-advance; `prefers-reduced-motion` makes every transition
instant; animation never blocks input.

### Confirmation by exception
Four tiers by confidence, budget 3 to 5 taps for 12 to 18 findings:
- **Tier 1 auto-confirmed** (≥ 0.95 in code; ≥ 0.90 by spec): shown as a batch,
  "Here's what we found", per-item "Not right?".
- **Tier 2 quick confirm** (0.70 to 0.90): one tap, profile-filtered options ("Aviva
  £85/month — pension or insurance?").
- **Tier 3 genuine question** (low confidence): one question, max one follow-up,
  "what is this?" with a profile-ranked dropdown, Skip, "This isn't mine → removed".
- **Tier 4 gap prompt:** always skippable, Skip prominent.
Every question has an escape, says why it asks, is non-destructive, and the user can
go back and change any answer. Skipped ⇒ TBC with a count on the section card.

**Auto-confirm conditions.** Salary: same source, variation under 5%, paid 25th to
31st ± 3 days, ≥ 3 consecutive months, named employer. Child Benefit: matched to the
weekly rates per child, infers child count. Council tax infers location. Mortgage:
known lender, £200 to £5,000 a month, ≥ 3 months. Dividends: round multiples of £100
or £1,000, irregular timing, company name without SALARY; own company = both patterns
from one source or a surname match.

**Don't ask:** balances per period, individual transactions, arithmetic, anything a
bank signal or a document already answered, anything that fills no Form E field.

**Internal red flags, never shown as questions:** gambling, cash withdrawals over
£500, a sudden stop in a regular payment, solicitor or mediator payments.

### The engine as carried over
Fifteen rules in `src/lib/bank/signal-rules`, each with a tier (must_nail /
good_enough / ask_for_help), a Form E field, reasoning and evidence:
`income.regular-salary` (2.15) · `income.benefits-hmrc` (2.20, Child Benefit, infers
child count) · `income.benefits-dwp` (2.20) · `income.self-employment-signal` (2.16:
Stripe, PayPal, HMRC SA, variable company credits) · `income.none-visible` ·
`property.mortgage-detected` (2.1 + 3.1) · `property.council-tax` · `property.rent-
detected` · `property.no-housing` · `pension.contribution-detected` (2.13: NEST,
Scottish Widows, Aviva) · `pension.no-contribution` · `accounts.investment-platform`
(2.3: HL, Vanguard, Trading 212, AJ Bell) · `debt.credit-card` · `debt.loan` ·
`debt.bnpl` (Klarna, Clearpay, Laybuy) · `flag.gambling` (internal).
Bands: ≥ 0.85 auto, 0.6 to 0.85 ask, below flag. The result transformer aggregates
payments by normalised payee (strip LTD, PLC, DD, SO), annualises, and carries a
24-row keyword table with Form E fields and confidences.

**Known defects, inherited.** (1) The signal engine and the question generator were
never wired together: questions came from raw bank data, not from detected signals.
Wire them in Build. (2) `pension.no-contribution` fires wrongly for someone drawing a
pension; there is no pension-income rule. (3) No large one-off rule, so Form E 2.6
(vehicles), 2.7 (belongings over £500), 2.9 (gifts and disposals) never fill. (4) No
car-as-asset when finance is detected; no director's loan account prompt. (5) Missing
categories: holidays, clothing, vehicle maintenance. Fix (1) first; (2) to (5) when
the golden path reaches them.

**Large one-off rule to add:** unknown category, ≤ 2 occurrences to a payee, ≥ £3,000 →
fork: asset (vehicle → 2.6 reg, make, model, value · property → 2.1 · valuables → 2.7)
/ bill (building work, holiday, medical, legal) / gift or transfer → 2.9 (gifts over
£500 in the last 12 months are disclosable) / deposit with finance / other; £1,000 to
£3,000 → "what was this?"; below £1,000 nothing. Confirming a vehicle asks whether an
existing loan and insurance belong to it (signal linking → secured debt).

### Evidence and trust
Every item carries an evidence state: **Proved** (bank alone) · **Inferred** (bank
suggests, user confirms) · **Gap** (bank cannot prove; a document can) · **Invisible**
(only the user can say). Spending is the only section fully proved by bank data;
pensions are the weakest.

Trust badge on every evidenceable line, six ascending levels (LOCKED): self-declared →
bank-evidenced → credit-verified → document-evidenced → both-party-agreed →
court-sealed. Colour encodes the level, the label names the source: "Estimated"
(amber), "Verified from Barclays xxxx2323" (green). Confidence is three states: known
/ estimated / unknown. `null` means unknown, never zero.

Document → Form E: bank statement → 2.3, 2.15 to 2.20, 3.1 · payslip → 2.15 (links
2.13, 2.14) · P60 / SA302 → 2.15 to 2.16 · mortgage statement → 2.1 · CETV letter →
2.13 · savings or investment statement → 2.3 / 2.4 · credit card statement → 2.14.

**Gap engine.** Six rules produce provider-named gaps ("Mortgage statement from
Halifax"), each with what, from whom, why, how long, and help. Ordered by lead time,
which is why the pension clock starts on day one: CETV (6 to 12 weeks; public sector
up to 12 months; McCloud note for public-sector schemes) → property valuation (1 to 2
weeks; three agents or RICS) → mortgage statement (1 to 3 days) → payslips (to hand) →
card and loan statements → extra accounts. Typical gap lists: employed homeowner with
a pension 4 documents; renter without a pension 1; self-employed 6.

**Fidelity ladder:** Sketch (profile only) → Draft (bank connected) → Evidenced
(bank + CETV, valuation, mortgage statement, payslips) → Locked. Four readiness
labels drive the copy: "Not yet ready for a first conversation" → "Ready for a first
conversation" → "Ready to share (some items outstanding)" → "Complete". Sharing is
not gated by completeness (LOCKED); the receiving side sees the completeness.

### Your Picture (LOCKED shape)
A document, not a dashboard. Three columns: left, a chapter list with completion
icons; middle, §-numbered sections in legal-prose style with structured data inline;
right, a contextual rail (snapshot · data sources · needs attention). No summary
section: the document is the summary. No version chip; last-updated plus per-section
history. Editing is per-section inline (edit · upload evidence · delete ·
re-categorise · add transaction · add valuation); every change lands in a timestamped
per-section change log, because a court may need to see how the picture evolved.

Sections and Form E mapping: §1 the children · §2 your home (2.1 to 2.2) · §3 other
property and valuables (2.6 to 2.8) · §4 pensions (2.13) · §5 savings and investments
(2.3 to 2.4) · §6 debts (2.14) · §7 income (2.15 to 2.20) · §8 spending (3.1, the 29
budget lines as a search-and-select, reviewed as category totals not transactions) ·
§9 business (2.10, 2.11, 2.16) · §10 needs (3, only at Draft or above). A "+ More to
add" control inserts a section that was never asked about (a forgotten pension,
crypto).

Snapshot metrics: net position = assets − debts; **monthly gap = net income − outgoings**,
a first-class metric that becomes the future-needs input. Negatives in parentheses
and red. No split, share or percentage is shown in the private picture.

Item metadata: per-party claim (value, basis, notes) · ownership tag (joint / sole A /
sole B / pre-marital / inherited / gifted / disputed), separate from matrimonial
yes / no / disputed (a loan in one name for the other's car is matrimonial) · trust
level · status (confirmed / contested value / contested ownership / unique to A /
unique to B / missing expected) · thread.

### Post-bank sections the bank cannot see
- **Property:** value (estimate or valuation), mortgage balance, scheme (Help to Buy,
  shared ownership %, Right to Buy), ownership (sole / joint / tenants in common),
  who lives there now, intent (sell and split / one stays / defer / undecided /
  already agreed).
- **Children** C1 to C5: name or nickname, age (not date of birth), school (state /
  private, fees, whether private is agreed), special needs by progressive disclosure,
  primary care (with me / with ex / equal shared care / set pattern / roughly shared /
  not settled) and split %, childcare auto-populated from the bank, Child Benefit
  recipient recorded under income.
- **Pensions:** per pension DB or DC in plain language ("not sure" is treated as DB),
  value or CETV status with a countdown from the request date; if drawing, the income.
- **Debts:** sole or joint per debt. **Vehicles:** reg, make, model, value.
- **Accounts:** additional accounts, closed accounts in the last 12 months (Form E
  requires statements even for closed accounts), transfers to accounts not connected
  (the engine exposes outbound destinations; the anti-hidden-assets safeguard).
- **Business:** salary vs dividends vs client income classification, business value
  (skippable → task), shareholding (Ltd only), director's loan account balance ("the
  most commonly missed item on Form E"), accountant, SA302 and accounts auto-task.
- **Spending** fork: full six-category walkthrough (found items → did we miss
  anything → transaction search → sub-summary) / estimates-only form / skip, with
  spending then flagged as an estimate downstream.

### Before sharing
- **Commonly missed items checklist:** jewellery, TVs and consoles, art, tools,
  collectibles, instruments, designer items over £500; cash over £500; money owed
  both ways; endowments and life insurance; compensation and inheritance; crypto;
  foreign property and accounts; timeshares; horses and livestock. "Better to include
  a £400 ring than leave it out."
- **Credit check** (Experian soft check): recommended by default, strongly when O5 was
  "hiding", never a gate; flags accounts on file that were not declared, and CCJs. It
  is also the substitute verification when the other party won't connect a bank.
- **Save & continue later** on every screen. Returning after weeks: "Welcome back.
  You left off at [step]. X items may need updating."

---

## Reconcile

### The invite
Fields: first name, last name, email, optional personal message. Single-use link,
14-day expiry, resend issues a new link and invalidates the old; expiry is
configurable on resend. Framing is neutral and equal-status: "our household picture",
never "her workspace that he joined". Direct sharing is OFF by default for flagged
users, with an opt-in warning, 7-day links and one-tap revoke.

### Share
The share modal has three steps (LOCKED): Who (the ex; solicitor and mediator appear
as future options) → **What to share** (section checkboxes, all ticked, "You're
sharing N of M sections with Mark", "You can share these later") → Confirm, showing
exactly what they will see and what they won't (not private notes, not fallbacks).
Consequence stated before the act: "Sending this means Mark will see these 14 items.
You can't unsend, but you can add to them." CTA states: Share with Mark → sent (grey
chip with elapsed time) → Share update (amber, after new edits) → in flight → error
with retry. A re-share bumps the version; previously agreed items that changed are
flagged for re-confirmation.

Nothing crosses privately-to-shared without this act. No autosave crosses the line.
The private space keeps a "What I've sent" ledger.

### The other party's journey (respondent state machine)
Symmetric architecture, asymmetric sequence in practice. Mark is a builder, not a
verifier: his own account, his own picture, his own plan.

Pre-account, by token: validate → **landing** (personalised; "I'd rather not use
this" → decline with reason, inviter notified neutrally) → **confirm or correct**, one
screen per inherited non-financial fact (relationship status, living together, child
count, home type, mortgage lender, schools): confirm raises trust; correct raises a
conflict into Reconcile with both values; nothing merges silently; no financial
figures here → stage → how things are (his own safety branch, private to him) →
knowledge → fork: build my own plan (priorities, worries, plan) or skip → sign-up.

Signed in: welcome → choose **review Sarah's picture first** (read-only, evidence
tappable, early comments allowed, Sarah notified) or **build mine first** → wellbeing
(managing / finding this hard → gentler pacing / need safety support → resumable exit)
→ his own profiling and bank connection → his picture ready → reconcile. While
building, he never sees Sarah's values for his own items. Expired link after sign-up
→ "access via login".

The inviter sees a **status machine**, bucketed so it leaks no behaviour: not invited
/ invited, not opened / opened / building / shared, with nudge and resend, and a
designed waiting screen that gives her something useful to do meanwhile.

### Reconciliation
The shared picture is one ES2-style schedule of assets and income: one list of
household items, each carrying who declared it, who holds it, and whether the value
is agreed. Not two Form Es side by side.

**Status quad** header (LOCKED): Agreed by both · Values differ · New to you · Gap to
address (expected but neither declared). Tiles filter the document. Labels are
viewer-specific ("New to you" for Sarah is "yours" for Mark); the data is identical.

**Triage per item** by the second party: I know about this (agree) · I'd value it
differently (+ value + why) · I don't know about this. Then "add anything they didn't
declare", auto-matched. Live counters: confirmed together / needs agreement / new to
you / gaps.

**Conflict card:** side by side, each party's value with provenance, a corner delta
("Values differ by £30,000"), the CTA "Resolve together — this doesn't need to be a
debate", and five paths: discuss · a suggested midpoint · an independent check
(valuation, statement) · accept their value · defer. Contested ownership is its own
state with its own questions (when opened, where the funds came from).

**Queries** are anchored to one item, typed (missing / mismatch / needs evidence /
needs explanation), composed privately, previewed and sent as one batch. **Responses**
are one of provide / explain / accept / dispute; every response changes the item's
state for both parties. Unanswered queries show their age to both sides. No freeform
messaging; free text lives only inside a response, screened before send, with a
cooling prompt rather than a block.

**Deliberation queue:** biggest £ impact first; copy is impact-forward, never
instruction-forward. Good: "A midpoint of £465,000 sits within both estimates. If
agreed, it closes 1 of 3 contested items." Banned: "You should agree £465,000."
Tolerance for "agreed": property within 5%, pensions exact, cash within £100.

**Emotional pacing (LOCKED):** first-visit banner "This is the first time you've both
seen the same picture. No rush, no judgement." Persistent footer: "Nothing here is
final. Agreements only lock when you both sign off in Settle."

Settle unlocks at zero across Values differ + New to you + Gap to address. "N items
need attention before you can start a proposal → Resolve all" opens a linear wizard.

### When the other party doesn't engage
Ladder from the send: **day 3** automatic reminder · **day 7** options: reminder with a
personal message / a different contact method / continue alone / understand your
options · **day 14** tone shifts; download the standalone picture, share it with a
mediator, learn about Form A · **day 30** the timeline becomes court evidence: a
court-ready document of invitation, reminders and non-response. Partial engagement
("confirmed 8 of 18 items"): nudge, soft deadline, or continue with unconfirmed items
carried as "Sarah's claim, unconfirmed by Mark" at lower trust. Refusing the bank never
blocks: manual path with a weaker badge, asymmetry visible to both, credit check as
the substitute. Solo mode has value and never reads as failure: the picture stands
alone for a solicitor, a mediator, a Form E or Form A evidence.

**Escape hatches (LOCKED):** export as Form E, ES2 or plain PDF is always available
from the document menu and never locks the user out of continuing. Prompted at 4 weeks
of non-engagement (Form E) and after 5 stuck reconciliation rounds (ES2, "take it to a
mediator").

---

## Settle

**Who proposes first** is a choice: I'll propose · wait for them · joint proposal.

**Private prep** (never leaves the private space): per major item a preferred
position, a fallback position and private reasoning. During narrowing the system tells
its author, privately, "your fallback would close this gap".

**The proposal** (LOCKED) is per-section option cards, not free drafting. Each card:
title, £ impact to each party, one-line descriptor, optional feasibility note
("requires Sarah to refinance · £230k mortgage capacity"), radio control, and a
required "Why?" with sensible starters. Property reference set: sell and split 50/50 ·
Sarah buys out · Mark buys out · defer the sale until the youngest is 18 (a Mesher
order). Other sections: lump sums, pensions (share % with the transfer amount computed
from the CETVs, or offset), spousal maintenance (from the income-vs-spending surplus),
child maintenance (the CMS formula, or custom), child arrangements (contact patterns:
every other weekend, plus a midweek night, week on / week off, 2-2-3, custom;
holidays; handover, including school drop-off to avoid direct contact; decision rights
for school, medical, religion, travel abroad), future needs. Beside each card the
arithmetic context: equal division, affordability per income, the primary carer's
housing need. Arithmetic only; no typical ranges; nothing prescriptive.

A **running split banner** above the first section ("Sarah 54% £311,472 · Mark 46%
£132,000 · 6 of 7 drafted"), carried into the recipient's view. Autosave, last-saved
stamp, no save button. A review step renders the proposal exactly as the recipient
will see it, then a deliberate send.

**The extreme-split flag:** any proposal giving one party more than 85% of net assets
prompts for an explanation before send. It informs; it never blocks.

**Counter** (LOCKED): header "Mark accepted X of Y sections. He'd like to discuss Z."
Per contested section a side-by-side YOUR V1 / MARK'S COUNTER with his reasoning and
three controls: Discuss · Counter · Accept, plus free-text reasoning. Send only when
every contested section has a response. The counter shows only changed sections
(unchanged green, changed amber) and recomputes the split live: "changes the overall
split from 54/46 to 48/52". Versions are immutable snapshots: V1 → V2 → … → agreed.

**Progress board:** always visible; items agreed n of m; the £ gap ("78% agreed, gap is
£8,400"); a convergence chart of the gap per version, preserved in the final
artefact as "How you got here" — a record of good-faith negotiation.

**Narrowing** when one or two items remain: accept · split the difference · offset
against another item · bring in a mediator. After five rounds without convergence:
"export the schedule and take it to a mediator".

**Safeguards:** a 24-hour cooling-off before an acceptance becomes final; a
cooling-off suggestion after receiving a proposal; if safety flags are set, direct
interaction is off and the route is through a mediator.

**Agreement:** Finalise unlocks only when every section is agreed **and both parties
have signed**. Acceptance alone is not enough; the sign step carries the legal weight.

---

## Finalise

### The pack (print and post)
Generated from the agreed version:
- **Form A**, ticked as an application by consent.
- **Form D81** (version 04.25), both columns pre-filled from the shared picture and the
  agreed version, including the effect of the order. **Section 10** (why the order is
  fair) is compiled from the reasoning trail across every round; a thin Section 10 is
  the most common reason a consent order comes back.
- **The draft consent order** against the structure of Standard Family Order 1.3
  (consent, accelerated procedure; May 2026 revision), with clean-break wording.
- **Form P** pension sharing annex whenever a pension share exists: scheme name, CETV
  valuation date, percentage, per the Welfare Reform and Pensions Act 1999.
- **Statement of Arrangements** for the children (optional checkbox).
- **Settlement summary** in plain English, and "How you got here".
- **Cover letter** to HMCTS Financial Remedy Service, PO Box 12746, Harlow, CM20 9QZ,
  with fee instructions; the fee is read from the current EX50 at pack time (£62 on
  13 July 2026), never hardcoded.
- **Checklist:** both parties sign the D81 statement of truth in ink (electronic
  acceptance unverified); post only after the conditional order; do not apply for the
  final order until the consent order is sealed (pension and inheritance rights end
  with the marriage); enquiries to ContactFinancialRemedy@justice.gov.uk.

Every generated document carries "auto-generated from user input". User
acknowledgements at bank connection, at generation and at pack. Statement-of-truth
consequences and set-aside education: what happens if something was hidden.

### Pre-flight (LOCKED as a gate)
Eight checks, each row expandable, three outcomes: pass · warnings the user can
accept · blocking issues that must be fixed. Checks: every required clause present ·
clean-break wording · pension share complete (scheme, CETV date, %, Form P) · D81
Section 10 complete · both statements of truth · any split beyond 85% has an
explanation · no unusual terms · fee read at pack time. Behind them, the seven known
rejection causes: vague wording, missing clauses, blank or thin Section 10,
unexplained unfair split, missing dismissal of future claims, wrong jurisdiction or
party details, imprecise pension percentages. Because at least one party is
unrepresented, the court must approve rather than rubber-stamp, so drafting quality
matters more, not less. The pre-flight result is exportable as a PDF to take to a
solicitor. A fixed-fee solicitor review is recommended, never gated: "it doesn't
change the legal effect; it's insurance, not necessity".

### After posting
Self-reported tracker: posted → allocated → approved / clarification requested /
rejected → **sealed**, at which point the artefact becomes COURT-SEALED · FINAL and
agreed items take the court-sealed trust level. A judge-asked-a-question path captures
the query and the resubmission. Then the **implementation checklist** with owners,
dates and pre-filled artefacts: transfer the title · serve Form P on the scheme ·
close the joint account · council tax to single occupancy · update DVLA (V62), HMRC
(CH2), the employer and the pension providers · apply for the final order. Long-
running items carry reminders. Sealed documents stay downloadable forever.

---

## Cross-cutting

### Safety
**Universal baseline, every user:** "Exit this page" in the footer on every screen,
redirecting to BBC News; on click it clears local and session storage first, replaces
history second, redirects third, and calls a best-effort endpoint that kills the
session and cookies (a slow redirect leaves evidence if done in another order).
Neutral email subjects; no financial content in email bodies; no push by default;
non-descript tab titles; "pause my account" (archive, never delete); helplines in the
footer. Decouple is not a domestic abuse service and says so.

**Flagged users** (O3 safety, or device not private): the signposting screen before
Moment 1; no presence or activity timestamps shown to the other party; direct share
off by default; 7-day links; one-tap revoke; recovery via a nominated phone; the
route to the MIAM exemption evidence and to a mediator instead of direct negotiation.
Device not private ⇒ no resume-by-email links, fresh login each session, a soft gate
before any financial write.

**Pause and lock:** immediately freezes the shared document and revokes the ex's
access with no notification to them; unpause or delete.

**Data rule:** safety answers, flags and exit-page clicks are safeguarding-tier data:
never in an email, a notification or analytics, and never sent to the AI provider.

**Later (V1.5):** behavioural coercive-control detection (sudden acceptance of
everything, acceptance of a 90/10 split, erratic changes, replies within minutes, the
same device on both accounts, copy-pasted language) with a graduated private
response. The financial-control signals that already exist (income disappearing,
accounts closed, no access to household money) may be raised privately to the
affected party, never in the shared space.

### Copy (LOCKED)
- **Banned words:** disclose, disclosure, position. Replacement vocabulary: picture ·
  shared · build · reconcile · settle · finalise. The one exception is a literal legal
  reference that a solicitor or judge could say verbatim ("Form E section 2.15
  requires disclosure of income"). Also avoid: challenge, dispute, contest, exchange,
  negotiate in navigation; "submit" only for the literal court act.
- **Tone:** no emojis. One exclamation mark, only on success. Headline ≤ 6 words, body
  ≤ 2 short sentences, CTA ≤ 4 words. Never "Oops", "Error", "Something went wrong",
  "You need to", "Action required", "Congratulations", red as the only signal. Errors
  carry a short reference id ("ref: a4b2"). Four templates: confirmation, attention,
  success, error.
- **Empty states:** narrative sections "Tell us about your {topic}"; list sections
  "Add a {item}"; body "Nothing here yet".
- **Every legal term** explained inline in one plain sentence, with "tell me more"
  that never leaves the screen. The product informs, never advises: "here's what
  equal division looks like" is fine; "you should accept" is not.
- **Positioning:** always "the complete settlement workspace", never "a financial
  disclosure tool".

### Visual
Per-phase colour arc: Build indigo #4338CA · Reconcile pink #9D174D · Settle blue
#0369A1 · Finalise green #166534, each with a soft variant. Connected-source cards show
masked accounts (`20-00-00 ****4821`), "auto-syncs daily · read-only". Time-estimate
affordance on any step with a knowable duration ("~60s"). Colour is never the only
indicator. Mobile-first for Start and Build; Reconcile onward responsive with a
"works best on a larger screen" nudge. WCAG 2.1 AA, keyboard reachable, screen-reader
tested on the document view.

### Account and notifications
- Roles: party_a / party_b / solo. Link states: not_invited / invitation_pending /
  linked / revoked.
- Change email: token to the new address, old stays active until verified, both
  addresses notified. Change password: current-password challenge. Delete: soft
  delete with a 30-day grace, all sessions invalidated, login during grace restores
  with a warning; then anonymisation. Shared cases: the other party is notified
  neutrally, their picture is preserved, the deleted party's data is redacted from the
  joint picture. Export before delete.
- Eleven transactional emails, no opt-out in v1: invite sent / opened / declined /
  accepted / opened-no-action nudge at 7 days · early comment · reconciliation started
  · password changed · email changed · deletion requested · grace ending. One sender,
  reply-to support, nothing financial in the body.
- Server-side state; every action persisted immediately; idempotent operations; no
  reliance on browser storage across a case that runs for months.

### Before a real couple uses it (production gates; the prototype runs on sandbox data)
Data tiers with a safeguarding tier and a legal-binding tier · per-party isolation at
the database layer, the shared document holding references not copies · every
sensitive read and write audit-logged, append-only · two-factor authentication before
any financial data · encryption at rest and TLS · DPIA, ICO registration, data
processing agreements with Tink and hosting · penetration test · professional
indemnity and cyber insurance · order templates vetted by counsel · the reserved-legal-
activity position on file (drafting a consent order is not a reserved activity, but the
position is documented) · a written safeguarding policy · a decision on whether we
collect the court fee · retention: 90 days after the case, sealed documents forever.

### Commercial hypothesis (not shown in the product yet)
Free to build · £149 to share and reconcile · £299 to settle · £99 for the pack, all
under test. Professional review at a 20% platform fee; mediators £50 per case. The
honest all-in cost to a couple, including a valuation and any review, is £1,200 to
£2,500 against £14,561 per person conventionally. Nothing in the prototype implies a
fixed price and no fee is hardcoded.
