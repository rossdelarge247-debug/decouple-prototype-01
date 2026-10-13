/* Dashboard — data: where the user is, to-dos, waiting-on, key dates, guides, evidence vault. Demo date 11 Oct 2026. */
window.DB = (function () {
  const TODAY = new Date(2026, 9, 11);
  const D = (y, m, d) => new Date(y, m - 1, d);
  const fmt = (d, o = { day: "numeric", month: "short" }) => d.toLocaleDateString("en-GB", o);
  const fmtY = (d) => fmt(d, { day: "numeric", month: "short", year: "numeric" });
  const days = (a, b = TODAY) => Math.round((a - b) / 864e5);
  const addM = (d, m) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };
  const ago = (d) => { const n = -days(d); return n <= 0 ? "today" : n === 1 ? "yesterday" : n < 14 ? `${n} days ago` : n < 60 ? `${Math.round(n / 7)} weeks ago` : `${Math.round(n / 30)} months ago`; };

  /* where the user is */
  const SCEN = [
    ["picture", "Your picture"], ["household", "Household picture"], ["settle", "Proposals"], ["finalise", "Finalise"], ["filed", "Filed with the court"],
  ];
  function where(s) {
    const f = s.finalise || {}, st = s.settle || {};
    if (f.filed || f.posted) return "filed";
    if (s.finalise || st.locked) return "finalise";
    if ((st.rounds || []).length) return "settle";
    if (s.reconcile) return "household";
    return "picture";
  }
  const PHASE = { picture: 1, household: 1, settle: 2, finalise: 3, filed: 3 };

  /* evidence: kind → how long it counts as current, in months after its end date */
  const RULE = { payslip: [3, "Courts expect payslips from the last 3 months."], bank: [3, "Courts expect statements that end within the last 3 months."], card: [3, "Courts expect statements from the last 3 months."], mortgage: [3, "A mortgage statement should be no more than 3 months old."], valuation: [6, "Valuations older than 6 months are often challenged."], cetv: [12, "A CETV is usually accepted for 12 months."], p60: [15, "Your P60 is current until the next tax year's is issued."], id: [0, "Doesn't expire."] };
  const CAT = [["income", "Income"], ["bank", "Bank accounts"], ["home", "The home"], ["pensions", "Pensions"], ["debts", "Debts"]];
  const V = (o) => ({ who: "a", ...o });
  const VAULT0 = [
    V({ id: "ps-sep", cat: "income", kind: "payslip", t: "Payslip · September", src: "NHS Business Services", cov: "Sep 2026", end: D(2026, 9, 30), up: D(2026, 10, 3), amt: "£2,847.00" }),
    V({ id: "ps-aug", cat: "income", kind: "payslip", t: "Payslip · August", src: "NHS Business Services", cov: "Aug 2026", end: D(2026, 8, 31), up: D(2026, 10, 3), amt: "£2,847.00" }),
    V({ id: "ps-jul", cat: "income", kind: "payslip", t: "Payslip · July", src: "NHS Business Services", cov: "Jul 2026", end: D(2026, 7, 31), up: D(2026, 8, 4), amt: "£2,812.40" }),
    V({ id: "p60", cat: "income", kind: "p60", t: "P60 · 2025–26", src: "NHS Business Services", cov: "Tax year to 5 Apr 2026", end: D(2026, 4, 5), up: D(2026, 8, 4), amt: "£34,104.00" }),
    V({ id: "mz-cur", cat: "bank", kind: "bank", t: "Current account ••4821", src: "Monzo", cov: "Jul 2025 – Jun 2026", end: D(2026, 6, 30), up: D(2026, 7, 2), amt: "£2,340.12", col: "#FF4F40" }),
    V({ id: "mz-jt", cat: "bank", kind: "bank", t: "Joint account ••7730", src: "Monzo", cov: "Oct 2025 – Sep 2026", end: D(2026, 9, 30), up: D(2026, 10, 3), amt: "£1,186.40", col: "#FF4F40" }),
    V({ id: "mz-sav", cat: "bank", kind: "bank", t: "Instant saver ••1290", src: "Monzo", cov: "Oct 2025 – Sep 2026", end: D(2026, 9, 30), up: D(2026, 10, 3), amt: "£8,420.00", col: "#FF4F40" }),
    V({ id: "val-1", cat: "home", kind: "valuation", t: "Valuation · 12 Oak Road", src: "Harris & Co Estate Agents", cov: "Dated 12 Mar 2026", end: D(2026, 3, 12), up: D(2026, 3, 20), amt: "£370,000" }),
    V({ id: "val-2", cat: "home", kind: "valuation", t: "Valuation · 12 Oak Road", src: "Exeter Homes", cov: "Dated 2 Sep 2026", end: D(2026, 9, 2), up: D(2026, 9, 5), amt: "£380,000" }),
    V({ id: "mort", cat: "home", kind: "mortgage", t: "Mortgage statement", src: "Nationwide BS", cov: "To 31 Aug 2026", end: D(2026, 8, 31), up: D(2026, 9, 5), amt: "£171,240 owing" }),
    V({ id: "cetv-a", cat: "pensions", kind: "cetv", t: "Pension valuation (CETV)", src: "NHS Pension Scheme", cov: "Requested 2 Sep 2026", end: null, up: null, awaited: D(2026, 9, 2), amt: "" }),
    V({ id: "bc", cat: "debts", kind: "card", t: "Credit card statement", src: "Barclaycard", cov: "Sep 2026", end: D(2026, 9, 28), up: D(2026, 10, 3), amt: "£2,150.00", col: "#00AEEF" }),
    V({ id: "b-ps", who: "b", cat: "income", kind: "payslip", t: "Payslip · September", src: "Westcountry Logistics", cov: "Sep 2026", end: D(2026, 9, 30), up: D(2026, 10, 6), amt: "£3,412.00" }),
    V({ id: "b-ll", who: "b", cat: "bank", kind: "bank", t: "Current account ••0057", src: "Lloyds", cov: "Oct 2025 – Sep 2026", end: D(2026, 9, 30), up: D(2026, 10, 6), amt: "£4,903.55", col: "#006A4D" }),
    V({ id: "b-cetv", who: "b", cat: "pensions", kind: "cetv", t: "Pension valuation (CETV)", src: "Aviva", cov: "Dated 14 Jan 2026", end: D(2026, 1, 14), up: D(2026, 1, 30), amt: "£86,400" }),
    V({ id: "b-amex", who: "b", cat: "debts", kind: "card", t: "Credit card statement", src: "American Express", cov: "Jul 2026", end: D(2026, 7, 21), up: D(2026, 8, 1), amt: "£3,200.00", col: "#2E77BB" }),
  ];
  function status(v) {
    if (v.awaited) { const d = days(addM(v.awaited, 3)); return { k: "wait", l: "Awaited", s: `Requested ${fmt(v.awaited)} · providers can take up to 3 months` }; }
    const r = RULE[v.kind] || [0]; if (!r[0]) return { k: "ok", l: "Current", s: r[1] };
    const lim = addM(v.end, r[0]), d = days(lim);
    if (d < 0) return { k: "old", l: "Out of date", s: `Expired ${fmt(lim)} · ${r[1]}`, lim };
    if (d <= 30) return { k: "soon", l: "Renew soon", s: `Current until ${fmt(lim)} · ${r[1]}`, lim };
    return { k: "ok", l: "Current", s: `Current until ${fmtY(lim)}`, lim };
  }

  /* guides */
  const G = (id, cat, t, min, at, body) => ({ id, cat, t, min, at, body });
  const GUIDES = [
    G("cetv", "Money", "Getting your pension valuations (CETVs)", 4, ["picture", "household"], [["p", "A Cash Equivalent Transfer Value is the figure the court uses to compare pensions. Every pension you and your ex have needs one, including old workplace pensions."], ["h", "How to ask"], ["ul", ["Contact each provider and ask for a “CETV for divorce”.", "Most providers do one free valuation a year.", "Public-sector schemes such as the NHS can take up to three months."]], ["tip", "Ask now, even if you're not ready to share. The wait is usually the slowest part of the whole process."]]),
    G("evidence", "Money", "What evidence the court expects", 3, ["picture", "household"], [["p", "Form E asks for proof of most of what you list. You don't need everything on day one, but it needs to be recent when you share."], ["ul", ["12 months of statements for every account.", "Your last 3 payslips and your P60.", "A valuation of the home, ideally from more than one agent.", "A CETV for each pension."]], ["tip", "Statements and payslips go out of date after about three months. We'll flag them in your evidence vault."]]),
    G("talk", "Wellbeing", "Talking about money without a row", 5, ["household", "settle"], [["p", "Most disagreements in this stage are about missing information, not values. Keep the first conversation about facts."], ["ul", ["Agree a time, and keep it short.", "Ask questions in Decouple rather than over text, so there's a record.", "If it heats up, stop and come back to it."]]]),
    G("fair", "Legal", "What a court thinks is fair", 6, ["settle"], [["p", "A judge starts from needs, especially housing for any children, then looks at the overall split. Equal is the usual starting point for assets built up during the marriage, but it isn't a rule."], ["h", "What judges look at"], ["ul", ["Each person's income and earning capacity.", "Housing needs, especially for the children.", "The length of the marriage.", "Pensions, which are often the biggest asset after the home."]]]),
    G("stretch", "Legal", "When a proposal is “a stretch”", 3, ["settle", "finalise"], [["p", "A stretch isn't wrong. It means a judge may ask why. The answer goes in your D81 reasons, in plain English."], ["tip", "Write down the reason while you still remember it. It's much easier than reconstructing it later."]]),
    G("final", "Legal", "Don't apply for your final order too early", 2, ["settle", "finalise", "filed"], [["p", "If you apply for the final divorce order before your financial order is approved, you can lose rights to your ex's pension if they die. Wait until the court seals your consent order."]]),
    G("kids", "Children", "Telling the children, and what to say", 6, ["picture", "household", "settle"], [["p", "Children cope best when they hear the news together, from both parents, in simple words. Plan what you'll say and agree it first."], ["ul", ["Tell them it isn't their fault.", "Say what will stay the same.", "Avoid details about money or blame."]]]),
    G("care", "Wellbeing", "Looking after yourself", 4, ["picture", "household", "settle", "finalise", "filed"], [["p", "Separation is one of the most stressful things people go through. Small routines help: sleep, food, a walk, one person you can call."], ["tip", "If you feel unsafe at home, call 999. The National Domestic Abuse Helpline is free, 24 hours: 0808 2000 247."]]),
  ];

  /* per-scenario content */
  function content(sc, N, shared, vault) {
    const O = N.Them, bad = vault.filter((v) => v.who === "a" && ["old", "soon"].includes(status(v).k));
    const ev = bad.length ? { k: "ev", t: `Renew ${bad.length} document${bad.length > 1 ? "s" : ""} in your evidence vault`, s: bad.map((v) => v.t).join(", "), tag: "Evidence", go: ["dashboard", "#vault"], pri: "soon", why: "Statements and payslips older than 3 months are usually rejected. Renew them before you share or file." } : null;
    const T = {
      picture: [ev, { k: "credit", t: "Check your credit report", s: "Free from Experian, Equifax or TransUnion. Takes 10 minutes.", tag: "Debts", ext: true, pri: "now", why: "Not legally required, but strongly recommended. It lists every debt in your name, including joint ones and any you didn't know about. Form E asks you to declare all your liabilities, and anything missed now can reopen the settlement later.", link: ["Free credit report on GOV.UK", "https://www.gov.uk/check-credit-report"] }, { k: "fin", t: "Finish your picture", s: "3 sections left: debts, pensions, children", tag: "Your picture", go: ["prepare"], pri: "now", why: "Everything that follows is built on your picture. The sooner it's done, the sooner you can share it." }, { k: "cetv", t: "Chase your NHS pension valuation", s: "Requested 2 Sep. Allow up to 3 months.", tag: "Pensions", ext: true, pri: "soon", why: "Pensions are often the biggest asset after the home. You can't share your picture properly without a valuation (CETV) for each one." }, { k: "share", t: `Share your picture with ${O}`, s: "When every section is done", tag: "Household", go: ["reconcile"], pri: "later", why: "Sharing starts the household stage. You choose when, and nothing is visible until you do." }],
      household: [ev, { k: "credit", t: "Check your credit report", s: "Free from Experian, Equifax or TransUnion. Takes 10 minutes.", tag: "Debts", ext: true, pri: "now", why: "Not legally required, but strongly recommended. It lists every debt in your name, including joint ones and any you didn't know about. Form E asks you to declare all your liabilities, and anything missed now can reopen the settlement later.", link: ["Free credit report on GOV.UK", "https://www.gov.uk/check-credit-report"] }, { k: "q", t: `Answer ${O}'s 2 questions`, s: "About the joint account and the car", tag: "Household", go: ["reconcile", "#hub"], pri: "now", why: `${O} can't sign off the household picture until his questions are answered.` }, { k: "chk", t: `Check ${O}'s picture`, s: "6 items to review", tag: "Household", go: ["reconcile", "#theirs"], pri: "now", why: "You're confirming his figures are complete and right. Anything you don't query now is taken as agreed." }, { k: "shared0", t: "Share your picture", s: "Shared on 28 Sep", tag: "Household", go: ["reconcile"], pri: "now", done0: true }, { k: "sign", t: "Sign off the household picture", s: "Unlocks proposals", tag: "Household", go: ["reconcile", "#house"], pri: "soon", why: "Once you both sign off, these become the agreed figures that every proposal is built on." }, { k: "mort", t: "Ask your lender about taking over the mortgage", s: "Only if you might keep the home", tag: "Home", ext: true, pri: "later", why: "If you want to keep the home, the lender has to agree you can afford the mortgage alone. Knowing early saves a proposal that can't work." }],
      settle: [ev, { k: "rep", t: `Reply to ${O}'s counter-proposal`, s: "v3 · he changed 2 of 7 sections", tag: "Proposals", go: ["settle", "#reply"], pri: "now", why: "It's your turn. Nothing moves until you respond." }, { k: "why", t: "Note why the home split is fair", s: "It's marked “a stretch”. You'll need this for the D81.", tag: "Proposals", go: ["settle", "#reply"], pri: "soon", why: "A judge reads your reasons first. Writing them now, while you remember, is much easier than later." }, { k: "advice", t: "Consider one-off legal advice", s: "Before you agree the final version", tag: "Advice", ext: true, pri: "later", why: "Optional. An hour with a family solicitor (about £150–£300) to sense-check the deal before you sign is often worth it." }],
      finalise: [{ k: "sig", t: "Sign Form D81", s: "Your other documents are signed", tag: "Finalise", go: ["finalise", "#docs"], pri: "now", why: "Every document has to be signed before the pre-flight checks can run." }, { k: "pre", t: "Run the pre-flight checks", s: "Unlocks when every document is signed", tag: "Finalise", go: ["finalise", "#hub"], pri: "soon", why: "We check the bundle the way a judge will, so it isn't sent back." }, { k: "file", t: "Choose how to file", s: "File it yourself, or we do it for £199", tag: "Finalise", go: ["finalise", "#hub"], pri: "soon", why: "The court fee is £62 either way." }],
      filed: [{ k: "trk", t: "Keep an eye on your court tracker", s: "The court usually decides in 4 to 8 weeks", tag: "Court", go: ["finalise", "#track"], pri: "soon", why: "We'll tell you as soon as anything changes." }, { k: "fo", t: "Wait before applying for your final order", s: "Only once your consent order is sealed", tag: "Divorce", ext: true, pri: "now", why: "Applying too early can cost you rights to your ex's pension if they die before the financial order is made." }],
    }[sc].filter(Boolean);
    const W = {
      picture: [],
      household: [{ t: `${O} to finish his picture`, s: "Pensions and debts still to do", since: D(2026, 10, 2) }, { t: `${O} to answer your question about the car`, since: D(2026, 10, 7) }],
      settle: [{ t: `${O} to confirm the pension valuation date`, since: D(2026, 10, 4) }],
      finalise: [{ t: `${O} to sign the consent order`, s: "You signed on 9 Oct", since: D(2026, 10, 9) }, { t: `${O} to confirm his details`, s: "NI number and address for Form P1", since: D(2026, 10, 9) }],
      filed: [],
    }[sc];
    const K = [
      { d: D(2026, 8, 14), t: "Conditional order granted", s: "Your divorce, part one", done: true },
      { d: D(2026, 9, 2), t: "NHS pension valuation requested", s: "Expected by early December", done: true },
      sc === "picture" || sc === "household" ? { d: D(2026, 10, 31), t: "July payslip goes out of date", s: "Upload October's when it arrives", warn: true } : null,
      { d: D(2026, 12, 2), t: "NHS pension valuation due", s: "Three months after you asked" },
      sc === "filed" ? { d: D(2026, 11, 20), t: "Court decision expected", s: "Usually 4 to 8 weeks after filing" } : { d: D(2027, 2, 14), t: "Conditional order is 6 months old", s: "Apply for your final order only after the court seals your financial order", warn: true },
    ].filter(Boolean).sort((a, b) => a.d - b.d);
    const A = [
      sc !== "picture" && { w: "b", t: `${O} uploaded his September payslip`, d: D(2026, 10, 6) },
      { w: "a", t: "You uploaded 5 documents", d: D(2026, 10, 3) },
      sc === "settle" && { w: "b", t: `${O} sent counter-proposal v3`, d: D(2026, 10, 8) },
      sc === "finalise" && { w: "a", t: "You signed the consent order", d: D(2026, 10, 9) },
      sc === "filed" && { w: "s", t: "Our solicitor filed your consent order", d: D(2026, 10, 10) },
      sc !== "picture" && { w: "a", t: "You shared your picture", d: D(2026, 9, 28) },
      { w: "s", t: "We flagged your Monzo statements as out of date", d: D(2026, 10, 1) },
    ].filter(Boolean).sort((a, b) => b.d - a.d).slice(0, 5);
    return { T, W, K, A };
  }
  return { TODAY, fmt, fmtY, days, ago, SCEN, where, PHASE, RULE, CAT, VAULT0, status, GUIDES, content, D };
})();
