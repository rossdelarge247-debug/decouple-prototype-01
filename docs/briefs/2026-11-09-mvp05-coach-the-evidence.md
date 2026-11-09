# Brief · MVP 05 Financial statement: coach the evidence

For the Claude Design project. A proposal from a planning session on 9 November 2026. It changes MVP 05 only, and needs no spec change.

## Where it comes from

Excel Exercises teaches Excel by doing, not by video, and makes $30–35K a month. Its lesson loop:
1. explain the step in two short paragraphs;
2. show the exact thing to type;
3. let you do it in something that looks and behaves like the real tool;
4. when you go wrong, correct the specific mistake with a reason ("Quotes are needed around the criteria"), plus a way out ("Show Answer", "Skip Question").

Its dashboard shows how fresh each skill is (Good, Needs practice after 14 days, Low accuracy), recommends the next lesson, and ends in a certificate you can show someone else.

Our equivalent of "the real tool" is the real paperwork. MVP 05 already has the bones:
- estimates are allowed and listed to confirm ("An estimate is fine for now…");
- one correction, "Use a figure from the last few months…";
- a status on every line;
- Sarah and Mark's example.

This brief adds the rest of the loop.

## How it should feel: Sarah's NHS pension

**Today.** She picks "My estimate", types £38,500 dated March 2026, and the line says "Not backed yet". Her list says "Add a CETV letter dated within the last year".

**With this brief:**
1. **"Where do I find this?"** opens a fictional pension letter with the transfer value and its date boxed: "Copy this number, and this date."
2. **A specific check.** If she picks "Annual statement" as the source, a short panel says an annual statement shows what the pension might pay her, not its value for a divorce. For that she needs a CETV letter, often free once a year. Its buttons:
   - [Add "Ask NHS Pensions for a CETV" to my list]
   - [Keep my figure for now]
   - [Helpful / Not helpful]
3. **The line ages:** "In date until Mar 2027", later "Getting old", then "Out of date". One bar at the top says "12 of 15 lines ready to share". When it's all green, the statement is **Ready to share**, and the pack is offered then.

## The brief

Keep everything MVP 05 already does. Add:

### 1. "Where do I find this?"
On each item's step, a link opens an annotated sample document with the figure, and its date, boxed. One line goes with it: "Copy this number."

There's one sample for each of:
- payslip
- P60
- bank statement
- mortgage statement
- pension annual statement
- CETV letter
- credit card statement
- estate agent valuation

The documents are fictional and in Sarah's name, from "Example Bank" and the like. They use no real bank's logo or layout.

### 2. Specific checks, each with a reason, a next step and a way out
Replace the single date warning with checks for each type of evidence. Each check has:
- a plain reason why it matters;
- a next step that adds a to-do, e.g. "Ask your pension provider for a CETV";
- "Keep my figure for now";
- "Helpful / Not helpful".

Fixed rules decide when a check shows; no AI in this version.

Draft checks. The family-law reviewer confirms the wording before anything is public:

| When | The check says |
|---|---|
| Pension source is "Annual statement" | A CETV is the value used in divorce. Ask your provider for one; it's often free once a year. |
| CETV dated more than 12 months ago | It needs to be from the last year. |
| Bank account backed by under 12 months of statements | 12 months of statements are needed. |
| Income without the last 3 payslips, or no P60 | Both are needed. |
| Home value from an online estimate | A good start. An agent's valuation is stronger. (Mark's Zoopla thread is the example.) |
| Any figure dated before you separated | Disclosure is as of today. (The existing rule.) |

The checks are about completeness and dates only, never about what's fair.

### 3. Freshness and "Ready to share"
Each line shows how current its evidence is:
- **In date**
- **Getting old**
- **Out of date**
- **Missing**

This is worked out from the evidence's date and type, and it changes as time passes.

One bar at the top, in three colours, shows "N of M lines ready to share". When every line is in date and backed by a document, the statement is **Ready to share**, and that's when the pack is offered.

### 4. Practice first (small)
Before starting, offer "Try it with Sarah's example" beside "Start my own". Practice is clearly labelled, and nothing typed there is kept.

### Tone and privacy
- Calm and factual. No mascot, no points, no streaks.
- Nothing new leaves the device.

### Measure (the MVP bet)
Show the coaching to half of testers, at random. Record which half as an answer row (qid `m05.coach`, `on` or `off`), so no new field is needed.

Pass marks to set, for example:
- coached testers back at least 50% more lines with a document;
- at least 40% reach "Ready to share";
- at least 70% of checks are rated helpful;
- "Would you have paid £X" for the disclosure pack, compared between the two halves.

### Not in this version
- AI wording for the checks. Add it once the rules have proved themselves with testers: the rules decide, and AI only words them.
- Bank connection.
- Changes to the partner's side.

### Spec
No change expected. If one turns out to be needed, write it into `docs/SITE-SPEC.md` and list it in the export's CHANGES.
