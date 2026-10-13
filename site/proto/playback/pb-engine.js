/* Playback — rules engine. Turns interview answers into an indicative read. Illustrative rules, not legal advice. */
(function () {
  const MID = {
    home: { u250: 200e3, "250_500": 375e3, "500_1m": 700e3, "1m": 1.3e6 },
    mortgage: { none: 0, u100: 60e3, "100_250": 175e3, "250": 320e3 },
    savings: { u10: 5e3, "10_50": 30e3, "50_150": 100e3, "150": 220e3 },
    pension: { none: 0, u50: 25e3, "50_200": 125e3, "200_500": 350e3, "500": 650e3 },
    debt: { u5: 3e3, "5_20": 12e3, "20_50": 35e3, "50": 70e3 },
    income: { none: 0, u25: 18e3, "25_50": 37e3, "50_100": 75e3, "100": 140e3 },
  };
  const m = (t, v) => (v && MID[t][v] != null ? MID[t][v] : null);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const r5k = (x) => Math.round(x / 5000) * 5000;
  const gbpK = (x) => x >= 1e6 ? "£" + (x / 1e6).toFixed(2).replace(/\.?0+$/, "") + "m" : "£" + Math.round(x / 1000) + "k";

  function names(a) {
    const me = (a.name_me || "").trim(), them = (a.name_them || "").trim();
    return { me: me || "you", Me: me || "You", them: them || "your partner", Them: them || "Your partner", hasMe: !!me, hasThem: !!them };
  }

  function compute(a, w = {}) {
    const N = names(a);
    const cohab = a.status === "cohab";
    const owned = /^own/.test(a.home || "");
    const equity = owned ? Math.max(0, (m("home", a.home_value) || 0) - (m("mortgage", a.mortgage) || 0)) : 0;
    const savings = m("savings", a.savings) || 0;
    const penMe = m("pension", a.pen_me), penThem = m("pension", a.pen_them);
    const pensions = (penMe || 0) + (penThem || 0);
    const hasDebt = Array.isArray(a.debt_kinds) && a.debt_kinds.length && !a.debt_kinds.includes("none");
    const debts = hasDebt ? m("debt", a.debt_total) || 0 : 0;
    const incMe = m("income", a.inc_me), incThem = m("income", a.inc_them);
    const unsure = ["inc_me", "inc_them", "pen_me", "pen_them"].filter((k) => a[k] === "__skip").length + (owned && !a.home_value ? 1 : 0);

    const why = [];
    let mid = 50, half = 4;
    if (cohab) {
      mid = { own_together: 50, own_me: 72, own_them: 28, rent: 50 }[a.home] || 50; half = 6;
      why.push("As you're not married, the split follows who legally owns what, more than need.");
    } else {
      if (a.kids === "with") {
        const k = { me: 5, shared: 1, them: -4, unsettled: 2 }[a.kids_live] || 0;
        mid += k;
        if (k > 2) why.push(`The children live mainly with ${N.me}, so housing them weighs heavily.`);
        if (k < 0) why.push(`The children live mainly with ${N.them}, whose housing needs come first.`);
      }
      if (incMe != null && incThem != null && incMe + incThem > 0) {
        const r = incThem / (incMe + incThem);
        const k = r > .65 ? 4 : r > .55 ? 2 : r < .35 ? -4 : r < .45 ? -2 : 0;
        mid += k;
        if (k > 0) why.push(`${N.Them} earns noticeably more, which tilts capital towards ${N.me}.`);
        if (k < 0) why.push(`${N.Me} earn${N.hasMe ? "s" : ""} noticeably more, which tilts capital towards ${N.them}.`);
      }
      if (a.years === "u5") { half += 2; why.push("A shorter marriage means what each of you brought in matters more."); }
      if (a.years === "20") { half -= 1; why.push("After 20+ years, courts usually start from an equal split."); }
      if (a.years === "10_20") why.push("A long marriage — the starting point is an equal split, adjusted for needs.");
    }
    if (unsure >= 2) { half += 2; why.push("A few answers were 'not sure', so the range is wider for now."); }
    if (w.keepHome && owned) { mid += a.kids === "with" && a.kids_live === "me" ? 3 : 1; }
    if (w.maintenance && !cohab) mid -= 3;
    mid = clamp(mid, 25, 78);
    const lo = clamp(Math.round(mid - half), 20, 80), hi = clamp(Math.round(mid + half), 20, 85);
    const pot = Math.max(0, equity + savings + (w.noPensions || cohab ? 0 : pensions) - debts);
    const penGap = !cohab && penMe != null && penThem != null ? penThem - penMe : null;
    const maint = !cohab && w.maintenance && incThem != null && incMe != null && incThem > incMe ? Math.round(((incThem - incMe) * 0.2) / 12 / 50) * 50 : null;
    return { N, cohab, owned, equity, savings, pensions, debts, pot, lo, hi, mid: Math.round(mid), why, penGap, maint, hasDebt, unsure, potLo: r5k(pot * lo / 100), potHi: r5k(pot * hi / 100) };
  }

  function path(a, r) {
    const hard = a.comms === "hard", agreed = a.stage === "agreed", kids = a.kids === "with";
    const steps = [];
    if (hard) steps.push({ t: "Mediation first", w: "Weeks 0–2", d: "A MIAM, then a mediator alongside you — so you don't have to negotiate face to face.", c: "#6D28D9" });
    if (agreed) {
      steps.push({ t: "Prepare", w: "Week 1", d: "Connect accounts to confirm the figures behind what you've agreed.", c: "#5B21B6" });
      steps.push({ t: "Check", w: "Weeks 2–3", d: `${r.N.Them} confirms, and we check it's fair enough for a judge.`, c: "#9D174D" });
      steps.push({ t: "Finalise", w: "Weeks 4–6", d: "Consent Order and D81 drafted and filed.", c: "#166534" });
      return steps;
    }
    const o = hard ? 2 : 0;
    steps.push({ t: "Prepare", w: `Weeks ${1 + o}–${3 + o}`, d: "Connect accounts, build your private picture.", c: "#5B21B6" });
    steps.push({ t: "Reconcile", w: `Weeks ${3 + o}–${6 + o}`, d: hard ? `Share with ${r.N.them} — with your mediator on hand.` : `Invite ${r.N.them}, line up both pictures.`, c: "#9D174D" });
    steps.push({ t: "Settle", w: `Weeks ${6 + o}–${10 + o}`, d: kids ? "Agree the split and a parenting plan." : "Model a fair split, agree the terms.", c: "#0369A1" });
    steps.push({ t: "Finalise", w: `Weeks ${10 + o}–${12 + o}`, d: "Court-ready documents, filed.", c: "#166534" });
    return steps;
  }

  function watch(a, r, w = {}) {
    const out = [];
    if (a.stage === "filed") out.push(["Don't finalise the divorce too early", "Applying for the final order before your financial order is approved can cost you pension and inheritance rights. Hold it until the money is agreed.", "#B91C1C"]);
    if (a.comms === "hard") out.push(["Use mediation from the start", "When talking is very hard, a mediator keeps things moving — and a MIAM is usually needed before court anyway.", "#6D28D9"]);
    if (w.noPensions || (!r.cohab && (a.pen_me === "__skip" || a.pen_them === "__skip" || (r.penGap && Math.abs(r.penGap) > 50e3)))) out.push(["Don't leave the pensions out", "Pensions are the most overlooked asset in DIY settlements — and often the most valuable. Get a valuation (a CETV) for each one.", "#A16207"]);
    if (r.owned) out.push(["Get the home valued early", "Your biggest asset shouldn't run on a guess. Three agent valuations settle most disputes before they start.", "#0369A1"]);
    if (r.hasDebt && (a.debt_names === "joint" || a.debt_names === "mixed")) out.push(["Joint debts stay joint", "Lenders can chase either of you for joint debts until they're cleared or moved into one name.", "#92400E"]);
    if (a.work === "self") out.push(["Self-employed income needs proof", "Expect to share two to three years of accounts. Start gathering them now.", "#4338CA"]);
    if (Array.isArray(a.complex) && a.complex.some((x) => x !== "none")) out.push(["Get specialist advice too", "A business, trust, second property or overseas assets can need a valuer or solicitor alongside Decouple.", "#57534E"]);
    if (r.cohab) out.push(["Ownership matters most", "Find the deeds, the mortgage paperwork and any record of who paid what towards the home.", "#0369A1"]);
    return out.slice(0, 4);
  }

  function partner(a, r) {
    const T = r.N.Them, out = [];
    if (!r.cohab && r.mid > 52) out.push([`"It should be 50/50."`, `${T} may start from an even split. The answer: equal is the starting point, but needs — especially the children's housing — can move it.`]);
    if (r.owned && a.kids === "with") out.push([`"Let's just sell the house."`, `Selling gives ${r.N.them} cash now. Be ready to show whether you can keep the home, or what a suitable home nearby would cost.`]);
    if (r.penGap && r.penGap > 50e3) out.push([`"My pension is mine."`, `Pensions built during the marriage are usually shared. A pension sharing order can balance it without selling anything.`]);
    if (a.stand === "mine") out.push([`"I'm not ready for this."`, `${T} may need time. Going at their pace now usually makes the money conversation faster later.`]);
    if (a.comms === "hard") out.push([`"I'm not talking to you about this."`, "That's what mediators are for. Decouple lets you exchange figures without a single difficult conversation."]);
    if (!out.length) out.push([`"Show me the numbers."`, `${T} will want to see the evidence. Connecting accounts means every figure arrives with its source attached.`]);
    return out.slice(0, 3);
  }

  function fairness(a, r) {
    const items = { home: "The home", children: "Children", savings: "Savings", pensions: "Pensions", maintenance: "Maintenance", debts: "Debts" };
    return (a.agreed_on || []).map((k) => {
      let ok = true, note = "Looks within the usual range for a situation like yours.";
      if (k === "pensions" && (a.pen_me === "__skip" || a.pen_them === "__skip" || !a.pen_me)) { ok = false; note = "You weren't sure of the values. Agreements made without pension valuations are often unfair to one side."; }
      if (k === "pensions" && r.penGap && Math.abs(r.penGap) > 100e3) { ok = false; note = "There's a large pension gap. Make sure the agreement balances it, or a judge may ask why."; }
      if (k === "home" && a.kids === "with" && a.kids_live === "them") { ok = false; note = "Check the children can stay well housed with " + r.N.them + " under this plan."; }
      if (k === "maintenance" && a.years === "u5") note = "For a shorter marriage, maintenance is usually time-limited.";
      return { k, t: items[k], ok, note };
    });
  }

  /* Common 14-night patterns. A = first parent, B = second. Each cell = who has the children that night (Mon-first). */
  const PATTERNS = [
    { id: "5225", g: "equal", name: "5-2-2-5", days: "AABBAAAAABBBBB", how: "Each of you has the same two weeknights every week, and you take turns with long weekends.", good: "School-age children, homes close together, both of you able to do school runs.", watch: "Needs a fair bit of coordination — a shared calendar helps." },
    { id: "223", g: "equal", name: "2-2-3", days: "AABBAAABBAABBB", how: "Short blocks: two nights, two nights, three nights, then it flips the next week.", good: "Younger children who shouldn't go long without seeing either of you.", watch: "Lots of handovers — hard going if communication is tense." },
    { id: "week", g: "equal", name: "Week on, week off", days: "AAAAAAABBBBBBB", how: "A full week with each of you, handing over on the same day every week.", good: "Teenagers, homes further apart, and keeping handovers to a minimum.", watch: "A week is a long time for young children to be apart from a parent." },
    { id: "3443", g: "equal", name: "3-4-4-3", days: "AAABBBBAAAABBB", how: "Three nights with one of you, four with the other, then swap.", good: "Fixed weeknights each, so routines like clubs stay with one parent.", watch: "Weekends fall unevenly from week to week." },
    { id: "altmid", g: "main", name: "Alternate weekends + midweek", days: "AABAAAAAABABBA", how: "The children live mainly with one of you. The other has every other weekend and one midweek overnight.", good: "One of you works long hours or lives a little further away.", watch: "The midweek night keeps the bond going — protect it." },
    { id: "alt", g: "main", name: "Alternate weekends", days: "AAAAAAAAAAABBA", how: "Every other weekend, Friday and Saturday night, with the second parent.", good: "Longer distances between homes.", watch: "Twelve nights apart is long. Add calls or a midweek tea." },
    { id: "every", g: "main", name: "Every weekend", days: "AAAABBAAAAABBA", how: "Weeknights with one of you, weekends with the other.", good: "When weekday school routines are hard to share.", watch: "The main parent never gets relaxed weekend time." },
    { id: "ext", g: "main", name: "Extended weekends", days: "AAAAAAAAAABBBB", how: "Thursday to Monday morning every other week, using school as the handover.", good: "Avoiding doorstep handovers — school drop-off does it for you.", watch: "Long stretch either side; check it suits younger children." },
  ];
  function suggestPattern(a) {
    const ages = a.ages || [];
    if (a.kids_live === "shared") return ages.includes("u5") ? "223" : ages.length && ages.every((x) => x === "11_16" || x === "16_18") ? "week" : "5225";
    return "altmid";
  }
  function parentingStats(days) {
    const A = days.filter((d) => d === "A").length;
    let h = 0; for (let i = 0; i < days.length; i++) if (days[i] !== days[(i + 1) % days.length]) h++;
    return { A, B: days.length - A, handovers: h };
  }
  const EXAMPLE = { stage: "decided", status: "married", years: "10_20", kids: "with", ages: ["5_11", "11_16"], kids_live: "me", home: "own_together", home_value: "500_1m", mortgage: "100_250", work: "employed", inc_me: "25_50", inc_them: "50_100", savings: "10_50", complex: ["none"], pen_me: "u50", pen_them: "50_200", pen_type: ["work", "public"], debt_kinds: ["cards", "car"], debt_total: "5_20", debt_names: "joint", stand: "mine", comms: "tense", safe: "safe", goals: ["home", "kids", "pension"], name_me: "Sarah", name_them: "Mark", __pre: {} };

  window.PB = { compute, path, watch, partner, fairness, names, gbpK, EXAMPLE, PATTERNS, suggestPattern, parentingStats };
})();
