/* Finalise — builds the court bundle (Form A, consent order, D81 04.25, Form P1, summary) from the signed Settle agreement + the details wizard. */
window.FN = (function () {
  const ST = window.ST;
  const PA = 112400, PB = 86400, SVA = 11353, SVB = 16773, FIN_A = 7400, GOLF = 10250, OCT = 14000, CARD_A = 2150, AMEX_B = 3200, EQ = 182500;
  const INC = { a: 2180, ab: 111, b: 3640 };
  const FEE = 62, FILE_FEE = 199, FIRM = "Hartwell Penn LLP";
  const EXAMPLE = { children: "a:eowm", home: "later:60", pensions: "quarter", savings: "sav:40", vehicles: "bal", debts: "shared", spousal: "two" };
  const HOME_R = { sell50: ["now", 50], sell60: ["now", 60], mesher: ["later", 60], buy: ["keep", 60] };
  const SP = { two: [400, 24], three: [400, 36], five: [600, 60], clean: [0, 0] };
  const fmtD = (iso) => (iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");
  const gbp = (n) => ST.gbp(n);
  const words = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

  function det0(N) {
    const s = N.Me === "Sarah";
    return {
      caseNo: "1693 8274 0516 2290", coDate: "2026-08-21", foDone: "no",
      aFull: s ? "Sarah Elizabeth Mitchell" : `${N.Me} Mitchell`, bFull: N.Them === "Mark" ? "Mark David Mitchell" : `${N.Them} Mitchell`,
      aDob: "1986-03-14", bDob: "1984-09-02", married: "2011-06-18", separated: "2025-02-08",
      aAddr: "12 Oak Road, Exeter EX1 2AB", bAddr: "Flat 3, 41 Magdalen Road, Exeter EX2 4TA", bBasis: "Tenant (assured shorthold tenancy)",
      k1: "Emma Rose Mitchell", k1Dob: "2019-05-03", k2: "Jake Thomas Mitchell", k2Dob: "2022-01-19",
      lender: "Nationwide Building Society", mortRef: "ending 4417", title: "DN482917",
      aNi: "QQ 12 34 56 C", bNi: "QQ 65 43 21 A", nhsRef: "NHS 7741 2093", pinfo: "yes",
      aRel: "none", bRel: "none", other: "no", otherTxt: "",
    };
  }

  /* editable free-text fields (Sarah edits; terms stay locked to the agreement) */
  const FIELDS = {
    "co.r2": ["Consent order", "Recital · disclosure and advice"],
    "co.r3": ["Consent order", "Recital · the children"],
    "co.trig": ["Consent order", "Clause · when the home is sold"],
    "d.q7": ["D81", "Q7 · How the order was reached"],
    "d.q12": ["D81", "Q12 · Other matters"],
    "d.q13a": ["D81", "Q13 · Reasons — overview"],
    "d.q13h": ["D81", "Q13 · Reasons — the home"],
    "d.q13p": ["D81", "Q13 · Reasons — pensions"],
    "d.q13c": ["D81", "Q13 · Reasons — savings, cars, debts"],
    "d.q13s": ["D81", "Q13 · Reasons — maintenance"],
    "d.q14": ["D81", "Q14 · How each of you will manage"],
  };

  const DETL = { caseNo: "Divorce case number", coDate: "Conditional order date", foDone: "Final order made?", married: "Date of marriage", separated: "Date of separation", aFull: "Your full name", bFull: "{B}'s full name", aDob: "Your date of birth", bDob: "{B}'s date of birth", aAddr: "Your address", bAddr: "{B}'s address", bBasis: "{B}'s housing", k1: "First child's name", k1Dob: "First child's date of birth", k2: "Second child's name", k2Dob: "Second child's date of birth", lender: "Mortgage lender", mortRef: "Mortgage account", title: "Title number", aNi: "Your NI number", bNi: "{B}'s NI number", nhsRef: "NHS Pensions number", pinfo: "Pension information pack", aRel: "Your new relationships", bRel: "{B}'s new relationships", other: "Other matters", otherTxt: "Other matters" };
  const label = (id, N) => FIELDS[id] || (id.startsWith("f.") ? ["Details", (DETL[id.slice(2)] || id.slice(2)).replace("{B}", N.Them)] : ["", id]);
  const docsOf = (k) => (k.startsWith("co.") ? ["order"] : k.startsWith("d.") ? ["d81"] : ["order", "a", "d81", "p1"]);
  function build({ N, S, agreed, custom = {}, rounds = [], det, kids, finalN, signedOn }) {
    const sec = (id) => S.find((s) => s.id === id), o = (id) => (sec(id) && agreed[id] ? ST.opt(sec(id), agreed[id]) : null);
    const A = N.Me, B = N.Them;
    const hid = agreed.home || "later:60", [hm, hp] = hid.includes(":") ? [hid.split(":")[0], +hid.split(":")[1]] : HOME_R[hid] || ["later", 60];
    const ho = o("home") || { a: EQ * 0.6, b: EQ * 0.4 };
    const po = o("pensions"), tr = po ? PA - po.a : 0, pct = tr > 0 ? ((tr / PA) * 100).toFixed(2) : null;
    const sv = o("savings"), ve = o("vehicles"), de = o("debts");
    const svA = sv ? sv.a : SVA, svB = sv ? sv.b : SVB, veA = ve ? ve.a : GOLF - FIN_A, veB = ve ? ve.b : OCT, deA = de ? de.a : -CARD_A, deB = de ? de.b : -AMEX_B;
    const lump = Math.round(svA - SVA + (veA - (GOLF - FIN_A)) + (deA + CARD_A));
    const spo = o("spousal"), spId = (spo && spo.id) || "two", [spAmt, spMo] = SP[spId] || [400, 24];
    const ko = kids ? o("children") : null, shared = ko && ko.g === "s";
    const cm = ko && ko.cms != null && !shared ? Number(custom.children) || ko.cms : 0, cmPayer = (ko && ko.payer) || "b";
    const xs = custom.children_x || [];
    const P = (s) => s.replace(/\bJake\b/g, "Jake").replace(/\{A\}/g, A).replace(/\{B\}/g, B);
    const whyOf = (sid) => { const r = [...rounds].reverse().find((r) => r.by === "b" && r.why && r.why[sid]); return r ? { n: r.n, t: r.why[sid] } : null; };
    const src = (sid) => { const w = whyOf(sid); return w ? `Drafted from ${B}'s note on v${w.n} and the agreed terms` : `Drafted from the agreed terms in v${finalN}`; };

    /* ---- D81 money tables ---- */
    let Aa = [EQ / 2, EQ / 2], Ba = [SVA + GOLF, SVB + OCT], Da = [CARD_A + FIN_A, AMEX_B];
    let A2 = [ho.a, ho.b], B2 = [svA + veA + FIN_A + (deA + CARD_A), svB + veB + (deB + AMEX_B)], D2 = [CARD_A + FIN_A, AMEX_B];
    if (hm === "keep") { A2 = [EQ, 0]; B2 = [B2[0] - ho.b, B2[1] + ho.b]; }
    if (hm === "mkeep") { A2 = [0, EQ]; B2 = [B2[0] + ho.a, B2[1] - ho.a]; }
    const F1 = [PA, PB], F2 = po ? [po.a, po.b] : F1;
    const cap = (Ax, Bx, Dx, Fx) => { const C = [Ax[0] + Bx[0], Ax[1] + Bx[1]], E = [C[0] - Dx[0], C[1] - Dx[1]], H = [E[0] + Fx[0], E[1] + Fx[1]]; return { A: Ax, B: Bx, C, D: Dx, E, F: Fx, G: [0, 0], H }; };
    const inc = (g, h) => { const F = [INC.a + INC.ab, INC.b]; const I = [g[0] + h[0], g[1] + h[1]]; return { A: [INC.a, INC.b], B: [INC.ab, 0], C: [0, 0], D: [0, 0], E: [0, 0], F, G: g, H: h, I, L: [0, 0], M: [F[0] + I[0], F[1] + I[1]] }; };
    const cmV = cm ? (cmPayer === "b" ? [cm, -cm] : [-cm, cm]) : [0, 0];
    const d81 = {
      cap1: cap(Aa, Ba, Da, F1), cap2: cap(A2, B2, D2, F2),
      inc1: inc([0, 0], [0, 0]), inc2: inc(cmV, spAmt ? [spAmt, -spAmt] : [0, 0]),
      transfer: hm === "keep" || hm === "mkeep", pso: !!pct,
    };

    /* ---- consent order ---- */
    const youngest = det.k2 ? det.k2.split(" ")[0] : "Jake";
    const trig0 = `${youngest} attaining the age of 18 years or ceasing full-time secondary education, whichever is the later`;
    const nm = (x) => x.split(B).join("the Respondent").split(A).join("the Applicant");
    const kidsTxt = ko ? `${shared ? `The children will live with both parties under a shared care arrangement (${(ko.short || "").toLowerCase()}).` : `The children will continue to live with the Applicant and spend time with the Respondent ${(ko.short || "").toLowerCase()}, with school holidays shared by agreement.`}${xs.length ? " The parties have also agreed: " + xs.map(nm).join("; ") + "." : ""} The parties consider that no order under the Children Act 1989 is necessary.` : "";
    const R = [
      { id: "r1", t: "The parties intend this order to be in full and final settlement of all claims for income, capital and pension provision that each has or may have against the other, arising from their marriage, save as set out below." },
      { id: "co.r2", ed: true, t: `The parties have each given full and frank disclosure of their finances to the other through Decouple, an online settlement service, and each has been told of their right to take independent legal advice before agreeing this order.` },
      ko && { id: "co.r3", ed: true, t: kidsTxt },
      cm > 0 && { id: "r4", t: `The parties acknowledge that once paragraph ${"{CM}"} has been in force for one year, either of them may apply to the Child Maintenance Service for a maintenance calculation, and that this order will then cease to have effect for child maintenance.` },
      { id: "r5", t: "The parties agree that the terms of this order shall take effect only upon the making of a final order of divorce." },
    ].filter(Boolean);
    const C = [];
    if (lump) C.push({ id: "lump", h: "Lump sum", items: [{ t: lump > 0 ? `The Respondent shall pay to the Applicant a lump sum of ${gbp(lump)} by 4pm on the later of the date 28 days after the date of this order and the date 28 days after the final order of divorce.` : `The Applicant shall pay to the Respondent a lump sum of ${gbp(-lump)} by 4pm on the later of the date 28 days after the date of this order and the date 28 days after the final order of divorce.`, lk: true }] });
    const home = { id: "home", h: "The family home", items: [] };
    if (hm === "later") home.items.push(
      { t: `The Property shall be held by the parties on trust for themselves as tenants in common in the shares ${hp}% to the Applicant and ${100 - hp}% to the Respondent.`, lk: true },
      { pre: "The Applicant shall be entitled to occupy the Property with the children to the exclusion of the Respondent until the first of the following events (the “Trigger Events”): (a) ", id: "co.trig", ed: true, t: trig0, post: "; (b) the death of the Applicant; (c) the Applicant remarrying, forming a civil partnership or cohabiting with another person for a continuous period of more than six months; or (d) further order." },
      { t: `On the first of the Trigger Events the Property shall be sold and the net proceeds of sale, after redemption of the mortgage with ${det.lender} and payment of the costs of sale, divided ${hp}% to the Applicant and ${100 - hp}% to the Respondent.`, lk: true },
      { t: "Until sale, the Applicant shall pay the mortgage instalments, buildings insurance and all outgoings on the Property, and shall indemnify the Respondent against them." });
    else if (hm === "now") home.items.push(
      { t: "The Property shall be placed on the market for sale forthwith at a price agreed between the parties or, failing agreement, at the price recommended by the selling agent, and the parties shall accept any reasonable offer at or above that price." },
      { t: `The net proceeds of sale, after redemption of the mortgage with ${det.lender} and payment of the costs of sale, shall be divided ${hp}% to the Applicant and ${100 - hp}% to the Respondent.`, lk: true });
    else if (hm === "keep") home.items.push(
      { t: `Within 28 days of the final order of divorce, the Respondent shall transfer to the Applicant all his legal estate and beneficial interest in the Property, subject to the mortgage with ${det.lender}.`, lk: true },
      { t: `On completion of the transfer the Applicant shall pay the Respondent ${gbp(ho.b)} and use all reasonable endeavours to procure the release of the Respondent from his covenants under the mortgage, and shall indemnify him against them.`, lk: true });
    else home.items.push(
      { t: `Within 28 days of the final order of divorce, the Applicant shall transfer to the Respondent all her legal estate and beneficial interest in the Property, subject to the mortgage with ${det.lender}.`, lk: true },
      { t: `On completion of the transfer the Respondent shall pay the Applicant ${gbp(ho.a)} and use all reasonable endeavours to procure the release of the Applicant from her covenants under the mortgage.`, lk: true });
    C.push(home);
    if (pct) C.push({ id: "pen", h: "Pension sharing", items: [
      { t: `Provision shall be made in favour of the Respondent by way of pension sharing, in accordance with the annex to this order, in respect of the Applicant’s rights under the NHS Pension Scheme (membership number ${det.nhsRef}), so that ${pct}% of the cash equivalent value of those rights is transferred to the Respondent.`, lk: true },
      { t: "The pension sharing charges of the NHS Pension Scheme shall be borne equally by the parties." }] });
    const cap2 = { id: "cap", h: "Savings, vehicles and debts", items: [] };
    cap2.items.push({ t: sv && sv.id === "sav:40" || (sv && sv.id === "each") ? "Each party shall retain absolutely the bank accounts, savings and investments in their sole name, including the Respondent’s Vanguard ISA. The joint account ending 7730 shall be closed and its balance divided equally." : "Each party shall retain absolutely the bank accounts, savings and investments in their sole name, the balance between them being met by the lump sum above. The joint account ending 7730 shall be closed and its balance divided equally." });
    cap2.items.push({ t: "The Applicant shall retain the Volkswagen Golf registered in her name, together with the outstanding finance with Black Horse, and shall indemnify the Respondent against that finance. The Respondent shall retain the Skoda Octavia registered in his name." });
    cap2.items.push({ t: "Each party shall be solely responsible for the credit card debts in their own name and shall indemnify the other against them." });
    C.push(cap2);
    if (cm > 0) C.push({ id: "cm", h: "Child maintenance", items: [{ t: `${cmPayer === "b" ? "The Respondent shall pay to the Applicant" : "The Applicant shall pay to the Respondent"} for the benefit of the children periodical payments of ${gbp(cm)} per calendar month in total (${gbp(cm / 2)} for each child), payable on the first day of each month, until each child attains the age of 18 years or ceases full-time secondary education, whichever is the later, or further order. This order is made in the terms of the parties’ written agreement under section 8(5) of the Child Support Act 1991.`, lk: true }] });
    if (spAmt) C.push({ id: "sp", h: "Spousal maintenance", items: [
      { t: `The Respondent shall pay to the Applicant periodical payments of ${gbp(spAmt)} per calendar month, payable monthly in advance on the first day of each month, starting on the first day of the month after the final order of divorce, until the first of: (a) the expiry of ${words[spMo / 12] || spMo / 12} years (${spMo} months); (b) the death of either party; (c) the Applicant remarrying or forming a civil partnership; or (d) further order.`, lk: true },
      { t: "Under section 28(1A) of the Matrimonial Causes Act 1973, the Applicant shall not be entitled to apply under section 31 to extend the term of these periodical payments." },
      { t: "The Respondent’s claims for periodical payments against the Applicant are dismissed. On the expiry of the term, the Applicant’s claims for periodical payments shall stand dismissed." }] });
    else C.push({ id: "sp", h: "Clean break", items: [{ t: "The parties’ claims against each other for periodical payments and secured periodical payments are dismissed, and neither shall be entitled to apply under section 31(7A) or (7B) of the Matrimonial Causes Act 1973." }] });
    C.push({ id: "dis", h: "Dismissal of claims", items: [
      { t: "Save as provided in this order, the parties’ claims against each other for financial provision orders, property adjustment orders, pension sharing, pension attachment and pension compensation orders are dismissed, and neither party shall be entitled on the death of the other to apply for an order under section 2 of the Inheritance (Provision for Family and Dependants) Act 1975." },
      { t: "The parties have permission to apply as to the implementation and timing of the terms of this order." },
      { t: "There shall be no order as to costs." }] });
    let n = 0; C.forEach((c) => c.items.forEach((it) => (it.n = ++n)));
    const cmN = (C.find((c) => c.id === "cm") || { items: [{}] }).items[0].n;
    R.forEach((r) => (r.t = r.t.replace("{CM}", cmN)));

    /* ---- D81 narrative ---- */
    const yrs = Math.round((new Date(det.separated) - new Date(det.married)) / 31557600000);
    const q13 = [
      { id: "d.q13a", src: `Drafted from your household picture`, t: `The parties were married for almost ${words[yrs] || yrs} years and have ${kids ? `two children, aged 7 and 4, who ${shared ? "share their time equally between the parties" : "live mainly with the Applicant"}` : "no children"}. The settlement divides the matrimonial assets ${ST.split(S, agreed).pa}/${100 - ST.split(S, agreed).pa} in the Applicant’s favour overall, mainly to meet the children’s housing needs.` },
      { id: "d.q13h", src: src("home"), t: hm === "later" ? `The family home is kept for the children until ${youngest} is 18, then sold. The Applicant’s ${hp}% share reflects her housing the children; the Respondent keeps a ${100 - hp}% share, released on sale. The Applicant can afford the mortgage on her income and maintenance.` : hm === "now" ? `The family home will be sold now and the equity divided ${hp}/${100 - hp}. Both parties can rehouse from their shares.` : `One party keeps the family home and buys the other out at the agreed share, funded by a remortgage.` },
      pct && { id: "d.q13p", src: src("pensions"), t: `The Applicant’s NHS pension (cash equivalent £112,400) is larger than the Respondent’s Aviva pension (£86,400). ${whyOf("pensions") ? "The Respondent asked for the pensions to be equalised. " : ""}The parties agreed a pension sharing order of ${pct}%, which transfers about ${gbp(tr)} to the Respondent. This narrows the gap without the full cost of equalising.` },
      { id: "d.q13c", src: src("vehicles"), t: lump ? `A lump sum of ${gbp(Math.abs(lump))} from the ${lump > 0 ? "Respondent to the Applicant" : "Applicant to the Respondent"} evens out the equity in the two cars and reflects the parties’ agreement that ${de && de.id === "shared" ? "the Respondent’s American Express balance was largely family spending and is shared" : "each keeps their own debts"}.` : "Each party keeps their own savings, car and debts; these are broadly equal." },
      { id: "d.q13s", src: src("spousal"), t: spAmt ? `The Applicant has a monthly shortfall of about £640 after the children’s costs, while the Respondent has a surplus of about £1,100. ${whyOf("spousal") ? "The Respondent asked for an immediate clean break; " : ""}The parties agreed time-limited maintenance of ${gbp(spAmt)} a month for ${spMo} months, giving the Applicant time to increase her hours as the children settle at school.` : `There is an immediate clean break. Each party meets their own needs from their income.` },
    ].filter(Boolean);
    const q14 = spAmt ? `There will be a deferred clean break. The Applicant works part-time as an NHS physiotherapist and expects to increase her hours within ${spMo / 12} years; with ${cm ? "child maintenance and " : ""}Child Benefit she will meet her own needs when the term ends. The Respondent works full-time and can support himself and pay maintenance from his income.` : `There is an immediate clean break. The Applicant works part-time as an NHS physiotherapist and receives Child Benefit${cm ? " and child maintenance" : ""}; the Respondent works full-time. Each can support themselves from their own income.`;
    const q7 = `The parties negotiated directly using Decouple, an online settlement service. They exchanged full financial disclosure, agreed the values of their assets, and made ${rounds.length || 4} rounds of written proposals before both signing an agreement (version ${finalN}) on ${signedOn || "2 October 2026"}.`;
    return { A, B, hm, hp, ho, pct, tr, lump, spAmt, spMo, cm, cmPayer, ko, shared, R, C, q13, q14, q7, d81, kids, finalN, signedOn, youngest, trig0, sp: ST.split(S, agreed) };
  }

  const CHECKS = (m, det) => [
    ["Form A marked as a consent application", "So no MIAM (mediation meeting) is needed."],
    ["Conditional order granted", `Granted on ${fmtD(det.coDate)}. A court can't approve the order before this.`],
    ["Order matches your signed agreement", `Every term matches v${m.finalN}, clause by clause.`],
    ["Uses the courts' standard order wording", "Drafted from the Standard Family Orders, the wording judges expect to see."],
    ["D81 figures match the order", "The before and after tables (Q8–11) agree with each clause."],
    ["D81 reasons explained", "Q13 explains why the assets are split this way; Q14 explains how you'll each manage after the clean break."],
    m.pct ? ["Pension sharing annex (P1) complete", "NHS Pension Scheme details, the percentage, and the information pack from the scheme are all in place."] : ["No pension order needed", "Q18 is answered No."],
    m.d81.transfer ? ["Lender told about the transfer", `${det.lender} has had 14 days' notice (D81 Q17).`] : ["No property transfer", "Q17 is answered No. The home stays in joint names until it's sold."],
    ["Reasons explain the unusual terms", "D81 Q13 gives the reasoning for every section a judge may question."],
    ["Clean-break wording in place", m.spAmt ? "The maintenance term can't be extended (s.28(1A)), and all other claims are dismissed." : "All maintenance claims are dismissed."],
    ["Takes effect on the final order", "The order only takes effect once your divorce is final."],
  ];

  const TRACK = [
    ["Submitted", "Sent to the court online."],
    ["Issued", "The court logs the application. Usually 1–2 weeks."],
    ["With a judge", "A judge checks it's fair from the papers. Usually 4–8 weeks. No hearing in most cases."],
    ["Approved and sealed", "The judge approves and the court seals the order. It's now legally binding."],
    ["Apply for your final order", "Your divorce becomes final. Only do this once the financial order is sealed."],
    ["Put it into effect", "The pension share, lump sum and maintenance start to happen."],
  ];

  return { label, docsOf, det0, build, CHECKS, TRACK, FIELDS, EXAMPLE, FEE, FILE_FEE, FIRM, fmtD, gbp, INC };
})();
