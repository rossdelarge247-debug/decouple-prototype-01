/* MVP 05 · Financial statement (was MVP 01 · Shared statement) — store, schema, example couple, flag engine.
   State: decouple.mvp05.v1 only (never the full-vision journey key). A Journey stub lets ut.js and proto-chrome.js work unchanged. */
window.Journey = (function () {
  const KEY = "decouple.mvp05.v1", subs = new Set();
  const STAGES = [{ id: "mvp05", n: "MVP 05", name: "Financial statement", sub: "MVP · financial disclosure", file: "MVP 05 · Financial Statement.html", built: true }];
  let mem = {};
  return { STAGES, KEY, get: () => mem, set: (s, p) => { mem = { ...mem, [s]: { ...(mem[s] || {}), ...p } }; }, reset: () => { localStorage.removeItem(KEY); subs.forEach((f) => f()); }, goStage: () => false, subscribe: (f) => (subs.add(f), () => subs.delete(f)), embedded: new URLSearchParams(location.search).has("embed") };
})();

window.MS = (function () {
  const KEY = "decouple.mvp05.v1";
  const CATS = [
    { id: "home", t: "Property", form: "Form E 2.1–2.2", ic: "Home", q: "Do you own a home or any other property?", help: "Include property in your name, in joint names, or abroad.", doc: "an estate agent’s valuation and your latest mortgage statement" },
    { id: "accounts", t: "Bank & savings", form: "Form E 2.3", ic: "Bank", q: "Do you have any bank or savings accounts?", help: "Every account in your name or joint names, even if it’s nearly empty.", doc: "12 months of statements" },
    { id: "assets", t: "Investments & other assets", form: "Form E 2.4–2.12", ic: "Spark", q: "Any investments, vehicles or valuables worth over £500?", help: "Shares, crypto, cars, jewellery, a business. If it’s worth more than £500, it goes in.", doc: "a recent statement or valuation" },
    { id: "pensions", t: "Pensions", form: "Form E 2.13", ic: "Shield", q: "Do you have any pensions?", help: "Workplace and personal pensions, including old ones from previous jobs.", doc: "a cash equivalent value (CETV) letter from the provider, dated within the last year" },
    { id: "debts", t: "Debts", form: "Form E 2.14", ic: "Dash", q: "Do you owe money on anything, apart from the mortgage?", help: "Credit cards, loans, overdrafts, and money borrowed from family.", doc: "your latest statement" },
    { id: "income", t: "Income", form: "Form E 2.15–2.20", ic: "Star", q: "What money do you have coming in each month?", help: "After tax. Salary, self-employment, benefits, anything regular.", doc: "your last 3 payslips and your P60" },
  ];
  const KINDS = {
    home: [["home", "Family home"], ["other", "Other property"]],
    accounts: [["current", "Current account"], ["joint", "Joint account"], ["savings", "Savings account"], ["isa", "Cash ISA"], ["bonds", "Premium Bonds"]],
    assets: [["shares", "Shares or stocks & shares ISA"], ["car", "Car or vehicle"], ["valuables", "Valuables"], ["business", "A business"], ["crypto", "Crypto"]],
    pensions: [["work", "Workplace pension"], ["personal", "Personal pension or SIPP"], ["old", "Pension from an old job"]],
    debts: [["card", "Credit card"], ["loan", "Personal or car loan"], ["overdraft", "Overdraft"], ["family", "Money owed to family"]],
    income: [["salary", "Salary"], ["self", "Self-employed income"], ["benefits", "Benefits"], ["other", "Other income"]],
  };
  const SRC = {
    home: [["val", "A valuation"], ["stmt", "A statement"], ["est", "My estimate"]],
    income: [["slip", "My payslips"], ["stmt", "Tax return or statement"], ["est", "My estimate"]],
    pensions: [["cetv", "A CETV letter"], ["stmt", "Annual statement"], ["est", "My estimate"]],
    _: [["stmt", "A statement"], ["val", "A valuation"], ["est", "My estimate"]],
  };
  const srcOf = (cat) => SRC[cat] || SRC._;
  const srcLabel = (cat, k) => (srcOf(cat).find((x) => x[0] === k) || [k, "—"])[1];
  const kindLabel = (cat, k) => ((KINDS[cat] || []).find((x) => x[0] === k) || [k, "Item"])[1];
  const jointOK = (cat) => cat !== "income" && cat !== "pensions";

  const gbp = (n) => (n == null || n === "" || isNaN(n) ? "—" : "£" + Math.round(+n).toLocaleString("en-GB"));
  const month = (s) => { if (!s) return "No date"; const [y, m] = s.split("-"); return new Date(+y, +m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" }); };
  const old = (s) => { if (!s) return true; const [y, m] = s.split("-"); return (Date.now() - new Date(+y, +m - 1, 1)) / 864e5 > 120; };
  const rid = () => Math.random().toString(36).slice(2, 8);

  /* the example couple: Sarah (you) and Mark */
  const A_EX = {
    a: { me: "Sarah", them: "Mark", status: "married", sep: "lt1", has_home: "yes", has_accounts: "yes", has_assets: "yes", has_pensions: "yes", has_debts: "yes", has_income: "yes" },
    items: [
      { id: "a1", cat: "home", kind: "home", label: "14 Elm Road (family home)", whose: "joint", amount: 425000, mortgage: 212400, asOf: "2026-09", src: "val", doc: { name: "Hunters valuation, Sep 2026.pdf" }, docM: { name: "Nationwide mortgage statement.pdf" } },
      { id: "a2", cat: "accounts", kind: "joint", label: "Barclays joint account", whose: "joint", amount: 4200, asOf: "2026-09", src: "stmt", doc: { name: "Barclays joint, 12 months.pdf" } },
      { id: "a3", cat: "accounts", kind: "current", label: "Monzo current account", whose: "me", amount: 1850, asOf: "2026-10", src: "stmt", doc: null },
      { id: "a4", cat: "accounts", kind: "isa", label: "Marcus cash ISA", whose: "me", amount: 12000, asOf: "2026-08", src: "est", doc: null },
      { id: "a5", cat: "assets", kind: "car", label: "Family car (2019 Skoda Octavia)", whose: "joint", amount: 9000, asOf: "2026-10", src: "est", doc: null },
      { id: "a6", cat: "pensions", kind: "work", label: "NHS Pension", whose: "me", amount: 38500, asOf: "2026-03", src: "est", doc: null, note: "CETV requested" },
      { id: "a7", cat: "debts", kind: "card", label: "Barclaycard", whose: "me", amount: 1200, asOf: "2026-09", src: "stmt", doc: { name: "Barclaycard statement.pdf" } },
      { id: "a8", cat: "income", kind: "salary", label: "Salary, after tax", whose: "me", amount: 2150, asOf: "2026-09", src: "slip", doc: { name: "Payslips Jul–Sep.pdf" } },
    ],
    hints: [
      { id: "h1", cat: "pensions", kind: "work", label: "Mark’s workplace pension", guess: 150000 },
      { id: "h2", cat: "accounts", kind: "savings", label: "Mark’s Nationwide savings", guess: 8000 },
    ],
  };
  const B_EX = {
    items: [
      { id: "b1", pair: "a1", cat: "home", kind: "home", label: "14 Elm Road", whose: "joint", amount: 460000, mortgage: 198000, asOf: "2026-10", src: "est", doc: null },
      { id: "b2", pair: "a2", cat: "accounts", kind: "joint", label: "Barclays joint", whose: "joint", amount: 4200, asOf: "2026-09", src: "stmt", doc: { name: "Barclays joint statements.pdf" } },
      { id: "b3", cat: "accounts", kind: "current", label: "Lloyds current account", whose: "me", amount: 2100, asOf: "2026-10", src: "stmt", doc: null },
      { id: "b4", cat: "accounts", kind: "savings", label: "Nationwide savings", whose: "me", amount: 8000, asOf: "2026-09", src: "stmt", doc: { name: "Nationwide statement.pdf" } },
      { id: "b5", pair: "a5", cat: "assets", kind: "car", label: "Skoda", whose: "joint", amount: 8800, asOf: "2026-10", src: "est", doc: null },
      { id: "b7", cat: "debts", kind: "card", label: "Amex", whose: "me", amount: 3400, asOf: "2026-09", src: "stmt", doc: { name: "Amex statement.pdf" } },
      { id: "b8", cat: "income", kind: "salary", label: "Salary, after tax", whose: "me", amount: 3850, asOf: "2026-09", src: "slip", doc: { name: "Payslips.pdf" } },
    ],
    hints: [{ id: "hb1", cat: "accounts", kind: "bonds", label: "Premium Bonds in Sarah’s name", guess: 5000 }],
    late: { id: "b9", cat: "pensions", kind: "work", label: "Aviva workplace pension", whose: "me", amount: 162000, asOf: "2025-11", src: "stmt", doc: null },
  };
  const THREADS = {
    "j:a1": [{ w: "b", t: "I used Zoopla. It says about £460k for our road now. Happy to get an agent round.", at: "2 days ago" }],
    "j:a1:m": [{ w: "b", t: "That’s from memory, sorry. I’ll check the app.", at: "2 days ago" }],
  };

  /* rows: one line per thing in the shared statement, with a status */
  const TOL = (x, y) => Math.abs(x - y) <= Math.max(500, 0.02 * Math.max(x, y));
  function rows(A, B, res) {
    res = res || {};
    const out = [], ai = A.items || [], bi = (B && B.items) || [], seen = new Set();
    const push = (r) => { const s = res[r.id]; if (s && s.k === "agreed") r.status = "agreed", r.agreed = s.v; else if (s && s.k === "explained") r.status = "explained", r.why = s.t; out.push(r); };
    const status2 = (x, y, dx, dy) => (x == null || y == null ? "missing" : !TOL(+x, +y) ? "mismatch" : dx || dy ? "backed" : "unbacked");
    ai.forEach((a) => {
      if (a.whose === "joint") {
        const b = bi.find((x) => x.pair === a.id || (x.whose === "joint" && !x.pair && x.cat === a.cat && x.kind === a.kind && !seen.has(x.id)));
        if (b) seen.add(b.id);
        const base = { cat: a.cat, kind: a.kind, label: a.label, whose: "joint", a, b: b || null, owner: "both" };
        push({ ...base, id: "j:" + a.id, va: a.amount, vb: b ? b.amount : null, status: !B ? (a.doc ? "backed" : "unbacked") : !b ? "missing" : status2(a.amount, b.amount, a.doc, b.doc), side: !b && B ? "b" : null });
        if (a.cat === "home" && (a.mortgage || (b && b.mortgage))) push({ ...base, id: "j:" + a.id + ":m", sub: "Mortgage", debt: true, va: a.mortgage, vb: b ? b.mortgage : null, status: !B ? (a.docM ? "backed" : "unbacked") : !b ? "missing" : status2(a.mortgage, b.mortgage, a.docM, b.docM), side: !b && B ? "b" : null });
      } else push({ id: "a:" + a.id, cat: a.cat, kind: a.kind, label: a.label, whose: "a", a, va: a.amount, owner: "a", status: a.amount == null ? "unknown" : a.doc ? "backed" : "unbacked" });
    });
    if (B) {
      bi.forEach((b) => {
        if (seen.has(b.id)) return;
        if (b.whose === "joint") push({ id: "jb:" + b.id, cat: b.cat, kind: b.kind, label: b.label, whose: "joint", a: null, b, va: null, vb: b.amount, owner: "both", status: "missing", side: "a" });
        else push({ id: "b:" + b.id, cat: b.cat, kind: b.kind, label: b.label, whose: "b", b, vb: b.amount, owner: "b", status: b.amount == null ? "unknown" : b.doc ? "backed" : "unbacked" });
      });
      (A.hints || []).forEach((h) => { if (!bi.some((x) => x.whose !== "joint" && x.cat === h.cat && x.kind === h.kind)) push({ id: "h:" + h.id, cat: h.cat, kind: h.kind, label: h.label, whose: "b", hint: h, owner: "b", status: "missing", side: "b", guess: h.guess }); });
      (B.hints || []).forEach((h) => { if (!ai.some((x) => x.whose !== "joint" && x.cat === h.cat && x.kind === h.kind)) push({ id: "hb:" + h.id, cat: h.cat, kind: h.kind, label: h.label, whose: "a", hint: h, owner: "a", status: "missing", side: "a", guess: h.guess }); });
    }
    return out;
  }
  const ST = {
    missing: { t: "Missing", d: "Expected, but not listed", c: "#991B1B", bg: "#FEE2E2", rank: 0 },
    mismatch: { t: "Doesn’t match", d: "Your figures disagree", c: "#92400E", bg: "#FEF3C7", rank: 1 },
    unknown: { t: "Figure to find", d: "No figure yet", c: "#57534E", bg: "#F2EFEA", rank: 2 },
    unbacked: { t: "Not backed yet", d: "No document yet", c: "#57534E", bg: "#F2EFEA", rank: 3 },
    backed: { t: "Backed by a document", d: "", c: "#065F46", bg: "#D1FAE5", rank: 4 },
    agreed: { t: "Agreed", d: "", c: "#5B21B6", bg: "#EDE9FE", rank: 5 },
    explained: { t: "Explained", d: "", c: "#5B21B6", bg: "#EDE9FE", rank: 5 },
  };
  const open = (r) => r.status === "missing" || r.status === "mismatch";
  const value = (r) => (r.status === "agreed" ? r.agreed : r.va != null ? r.va : r.vb);

  /* documents each person still needs to add */
  function todo(A, B, who) {
    const list = [];
    const mine = who === "a" ? A.items : (B && B.items) || [];
    mine.forEach((x) => {
      const c = CATS.find((k) => k.id === x.cat);
      if (x.amount == null) list.push({ id: x.id, t: x.label, d: "Find the figure: " + c.doc, kind: "figure" });
      else if (!x.doc) list.push({ id: x.id, t: x.label, d: "Add " + c.doc, kind: "doc" });
      if (x.cat === "home" && x.mortgage && !x.docM) list.push({ id: x.id + ":m", t: "Mortgage on " + x.label, d: "Add your latest mortgage statement", kind: "docM" });
    });
    return list;
  }
  function totals(rs) {
    const t = { a: { assets: 0, debts: 0, pensions: 0, income: 0 }, b: { assets: 0, debts: 0, pensions: 0, income: 0 }, joint: { assets: 0, debts: 0 } };
    rs.forEach((r) => {
      if (r.status === "missing" && r.hint) return;
      const v = +(value(r) || 0), k = r.debt || r.cat === "debts" ? "debts" : r.cat === "pensions" ? "pensions" : r.cat === "income" ? "income" : "assets";
      if (r.whose === "joint") t.joint[k === "debts" ? "debts" : "assets"] += v; else t[r.whose][k] += v;
    });
    return t;
  }
  return { KEY, CATS, KINDS, srcOf, srcLabel, kindLabel, jointOK, gbp, month, old, rid, A_EX, B_EX, THREADS, rows, ST, open, value, todo, totals };
})();
