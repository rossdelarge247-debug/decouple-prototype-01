/* Prepare · their picture & our household — lines carry an owner (a = Sarah, b = Mark, j = joint, none = matched setup).
   Each person reviews the other's picture: accept a line, or query it (q = who queried). Our household unlocks when both have accepted everything. */
window.RC = (function () {
  const gbp = (n) => (n < 0 ? "−" : "") + "£" + Math.abs(Math.round(n)).toLocaleString("en-GB");
  const ot = (k) => (k === "a" ? "b" : "a");
  const SECS = [
    { id: "children", t: "The children" }, { id: "income", t: "Income" }, { id: "outgoings", t: "Outgoings" }, { id: "home", t: "The family home" },
    { id: "accounts", t: "Bank accounts & savings" }, { id: "other_assets", t: "Other assets" }, { id: "pensions", t: "Pensions" }, { id: "debts", t: "Debts" },
  ];

  function seed(N, kids) {
    const A = N.Me, B = N.Them, L = [];
    const add = (o) => L.push({ per: "", thread: [], ...o });
    if (kids) {
      add({ id: "c1", sec: "children", l: "Emma, 7", sub: `Lives mainly with ${A}`, a: null, b: null, txt: "Dependent" });
      add({ id: "c2", sec: "children", l: "Jake, 4", sub: `Lives mainly with ${A}`, a: null, b: null, txt: "Dependent" });
      add({ id: "c3", sec: "children", l: "Childcare — Bright Horizons", a: 600, b: 600, per: "/ mo", owner: "j" });
    }
    add({ id: "i1", sec: "income", l: `${A}'s salary`, sub: "NHS Business Services", a: 2847, b: 2847, per: "/ mo", owner: "a" });
    add({ id: "i2", sec: "income", l: `${B}'s salary`, sub: "Pearson · net, after tax", a: 3800, b: 3420, per: "/ mo", owner: "b", q: "a",
      thread: [{ w: "a", t: `Your payslips show £3,420 but you were doing regular overtime last year. Is that still happening?`, ago: "2 days ago" }, { gap: "1 day later" }, { w: "b", t: "Overtime stopped in March when the contract changed. £3,420 is what I take home now.", ago: "yesterday" }],
      ai: { h: "Overtime that has stopped usually isn't counted — if there's proof it stopped.", act: "ask", doc: "Last 3 payslips", lbl: "Ask for the last 3 payslips" } });
    add({ id: "i3", sec: "income", l: `${B}'s annual bonus`, a: null, b: 4000, per: "/ yr", owner: "b", q: "a", waitDoc: "P60 for last tax year",
      thread: [{ w: "a", t: "Can you upload your P60 so we can see the bonus?", ago: "3 days ago" }, { sys: `${B} said they'll upload it this week.` }],
      ai: { h: "Nothing to decide until the P60 arrives.", act: "nudge", lbl: `Chase ${B}` } });
    add({ id: "i4", sec: "income", l: "Child maintenance", sub: `From ${B}`, a: 400, b: 400, per: "/ mo", owner: "j" });
    add({ id: "o1", sec: "outgoings", l: "Mortgage — Nationwide", a: 1140, b: 1140, per: "/ mo", owner: "j" });
    add({ id: "o2", sec: "outgoings", l: "Household bills", a: 412, b: 412, per: "/ mo", owner: "a" });
    add({ id: "o3", sec: "outgoings", l: `${A}'s groceries`, sub: `For ${A} and the children`, a: 618, b: 450, per: "/ mo", owner: "a", q: "b",
      thread: [{ w: "b", t: "£618 a month seems high for one adult and two young children. When we were together it was about £600 for four of us.", ago: "2 days ago" }],
      ai: { h: "Your figure is a 12-month average of 64 real payments — well evidenced.", act: "keep", why: "This is the 12-month average from my bank statements — the transactions are attached.", lbl: "Keep mine — share the transactions" } });
    add({ id: "o4", sec: "outgoings", l: `${B}'s rent`, sub: "Flat, Heavitree", a: 950, b: 950, per: "/ mo", owner: "b" });
    add({ id: "h1", sec: "home", l: "12 Oak Road — value", sub: "Joint freehold", a: 375000, b: 340000, owner: "j", q: "a",
      thread: [{ w: "a", t: "Two local agents put it at £370–380k. They've sold three on our street this year.", ago: "4 days ago" }, { gap: "2 days later" }, { w: "b", t: "Zoopla says £340k, and the one at number 22 went for £345k in the spring.", ago: "2 days ago" }],
      ai: { h: "A 10% gap between estimates is common. Most couples meet in the middle or book one RICS survey (about £450, split).", act: "new", val: 357500, lbl: "Propose £357,500 — the midpoint" } });
    add({ id: "h2", sec: "home", l: "Mortgage outstanding", sub: "Nationwide · joint", a: -175000, b: -175000, owner: "j" });
    add({ id: "a1", sec: "accounts", l: `${A}'s current account`, sub: "NatWest", a: 2340, b: 2340, owner: "a" });
    add({ id: "a2", sec: "accounts", l: "Joint account ••7730", a: 1186, b: 1186, owner: "j" });
    add({ id: "a3", sec: "accounts", l: `${A}'s instant saver`, sub: "Monzo", a: 8420, b: 11920, owner: "a", q: "b",
      thread: [{ w: "b", t: "This had about £11,900 in it in March. Where did the £3,500 go?", ago: "yesterday" }],
      ai: { h: "Decouple can see a £3,500 transfer on 14 April, then the car repair and a solicitor's fee.", act: "upload", doc: "April transfers (3 items)", lbl: "Upload the April transactions" } });
    add({ id: "a4", sec: "accounts", l: `${B}'s current account`, sub: "Lloyds", a: 1980, b: 1980, owner: "b" });
    add({ id: "a5", sec: "accounts", l: `${B}'s Vanguard ISA`, a: null, b: 14200, owner: "b" });
    add({ id: "x1", sec: "other_assets", l: `${A}'s car`, sub: "2017 Golf", a: 9000, b: 11500, owner: "a", q: "b",
      thread: [{ w: "b", t: "Parkers has that model at £11,500 in good condition.", ago: "yesterday" }],
      ai: { h: "Trade-in and private-sale values differ by about 20%. A private-sale guide is fair to both of you.", act: "new", val: 10250, lbl: "Propose £10,250 — the midpoint" } });
    add({ id: "x2", sec: "other_assets", l: `${B}'s car`, sub: "2020 Octavia · Parkers", a: null, b: 14000, owner: "b" });
    add({ id: "x3", sec: "other_assets", l: "Money owed — J Hollins", sub: `Lent by ${A}, 2025`, a: 2000, b: 0, owner: "a", q: "b",
      thread: [{ w: "b", t: "That was a gift to your sister, not a loan. It shouldn't count as an asset.", ago: "4 days ago" }],
      ai: { h: "Without a note or message showing she'd repay it, a mediator would usually treat it as a gift.", act: "accept", lbl: `Accept ${B}'s view` } });
    add({ id: "p1", sec: "pensions", l: `${A}'s NHS Pension`, sub: "CETV requested 3 weeks ago", a: null, b: null, txt: "Awaiting CETV", owner: "a", q: "b", waitDoc: "CETV from NHS Pensions",
      thread: [{ w: "b", t: "We can't agree anything on pensions until the NHS valuation is in.", ago: "5 days ago" }, { sys: "NHS Pensions usually takes 6–10 weeks to send a CETV." }],
      ai: { h: "You can carry this line into Settle as pending — it won't hold up everything else.", act: "park", lbl: "Carry into Settle as pending" } });
    add({ id: "p2", sec: "pensions", l: `${B}'s Aviva pension`, sub: "CETV, Mar 2026", a: 86400, b: 86400, owner: "b" });
    add({ id: "d1", sec: "debts", l: `${A}'s Barclaycard`, a: -2150, b: -2150, owner: "a" });
    add({ id: "d2", sec: "debts", l: "Car finance — Black Horse", sub: `${A}'s car`, a: -7400, b: -7400, owner: "a" });
    add({ id: "d3", sec: "debts", l: `${B}'s Amex`, a: -3200, b: -3200, owner: "b", q: "a",
      thread: [{ w: "a", t: "Was this card used for family spending? Some of it was the holiday.", ago: "6 days ago" }],
      ai: { h: "The amount isn't in dispute — only whose debt it is. Settle decides who pays.", act: "accept", lbl: "Accept the figure — note it for Settle" } });
    L.forEach((l) => { l.acc = !l.owner || (!l.q && l.a === l.b) ? { a: true, b: true } : l.q ? {} : l.owner === "b" ? {} : { b: true }; });
    return L;
  }

  function apply(base, st) {
    return base.map((l) => {
      const s = st[l.id] || {}, x = { ...l, ...s, thread: [...l.thread, ...(s.add || [])], acc: { ...l.acc, ...(s.acc || {}) } };
      x.done = x.agreed != null || !!x.parked; x.open = !!x.q && !x.done;
      if (x.done) x.acc = { a: true, b: true };
      return x;
    });
  }
  function fmt(l, v) { if (v == null) return l.txt || "—"; return gbp(v) + (l.per ? " " + l.per : ""); }
  const onPic = (l, p) => l.owner === p || l.owner === "j" || !l.owner;
  const reviewList = (L, r) => L.filter((l) => l.owner === ot(r) || l.owner === "j");
  function progress(L, r) {
    const R = reviewList(L, r), acc = R.filter((l) => l.acc[r]).length, open = R.filter((l) => l.open && !l.acc[r]).length;
    return { total: R.length, acc, open, left: R.length - acc - open, done: acc === R.length };
  }
  function nextUp(l) {
    if (!l.open) return null;
    if (l.pending) return ot(l.pending.by);
    if (l.waitDoc && !l.got) return l.owner === "j" ? ot(l.q) : l.owner;
    const ms = l.thread.filter((m) => m.w), last = ms[ms.length - 1];
    return last ? ot(last.w) : ot(l.q);
  }
  const gap = (l) => (l.a != null && l.b != null && l.a !== l.b ? Math.abs(l.a - l.b) : null);
  const range = (l) => { const lo = Math.min(l.a, l.b), hi = Math.max(l.a, l.b); return gbp(lo) + "–" + gbp(hi).replace("£", "") + (l.per ? " " + l.per : ""); };
  const final = (l) => (l.agreed != null ? l.agreed : l.parked ? null : l.a != null ? l.a : l.b);
  function net(L, side) {
    const v = (l) => (l.agreed != null ? l.agreed : side === "a" ? l.a : side === "b" ? l.b : final(l));
    return L.filter((l) => ["home", "accounts", "other_assets", "debts", "pensions"].includes(l.sec)).reduce((n, l) => n + (v(l) || 0), 0);
  }
  function rank(ago) { if (!ago || ago === "just now") return 0; if (ago === "yesterday") return 1; const m = /(\d+)\s+day/.exec(ago); return m ? Number(m[1]) : 0.5; }
  const latest = (l) => [...l.thread].reverse().find((m) => m.w);
  const chased = (l) => { const s = [...l.thread].reverse().find((m) => m.sys || m.w); return !!(s && s.sys && /Reminder sent/.test(s.sys)); };
  function history(l, N) {
    const nm = (k) => (k === "a" ? N.Me : N.Them), h = [];
    ["a", "b"].forEach((k) => { if (l[k] != null) h.push({ w: k, t: `${nm(k)}'s picture said ${fmt(l, l[k])}` }); });
    l.thread.forEach((m) => { if (m.file) h.push({ w: m.w, t: `${nm(m.w)} uploaded ${m.file}`, ago: m.ago, doc: true }); else if (m.sys) h.push({ t: m.sys }); else if (m.w) h.push({ w: m.w, t: m.t, ago: m.ago, msg: true }); });
    h.push(l.agreed != null ? { ok: true, t: `Agreed at ${fmt(l, l.agreed)}` } : l.parked ? { ok: true, t: "Carried into Settle as a range" } : null);
    return h.filter(Boolean);
  }
  function tone(t) {
    if (/(always|never|ridiculous|lying|liar|typical|pathetic|obviously)/i.test(t)) return { ok: false, h: "This might land as blame.", b: "Try keeping it to the figure and what would change your mind." };
    if (t.length < 12) return { ok: true, h: "Short and clear.", b: "Saying where your figure comes from usually gets a quicker answer." };
    return { ok: true, h: "Clear and calm.", b: "It sticks to the figure. Good to send." };
  }
  const lc = (s) => s.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase());
  return { SECS, seed, apply, fmt, onPic, reviewList, progress, nextUp, gap, range, final, net, rank, latest, chased, history, tone, gbp, ot, lc };
})();
