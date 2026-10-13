/* Settle — seven decisions from the agreed household. Options allocate each section's value between Sarah (a) and Mark (b).
   Home, pensions and savings also accept slider positions ("now:55", "pen:25", "sav:50"); the children are chosen progressively (group → pattern). */
window.ST = (function () {
  const gbp = (n) => (n < 0 ? "−" : "") + "£" + Math.abs(Math.round(n)).toLocaleString("en-GB");
  const R = { strong: ["Strong", "#047857", "#ECFDF5"], ok: ["Reasonable", "#0369A1", "#E0F2FE"], stretch: ["A stretch", "#B45309", "#FEF3C7"] };
  const swap = (p) => p.replace(/a/g, "x").replace(/b/g, "a").replace(/x/g, "b");
  const EQ = 182500, PA = 112400, PB = 86400, SV = 28126, SVA = 11353;

  function kidsOpts(A, B) {
    const P = {
      eow: ["Every other weekend", "Friday to Sunday, alternate weeks.", "aaaabba" + "aaaaaaa"],
      eowm: ["Every other weekend + a midweek evening", "Tea after school on Wednesdays, back for bedtime.", "aaeabba" + "aaeaaaa"],
      eowo: ["Every other weekend + a midweek overnight", "Wednesday overnight every week.", "aabaabb" + "aabaaaa"],
      wk: ["Every weekend", "Friday to Sunday, every week. Weekdays stay simple.", "aaaabba" + "aaaabba"],
    };
    const cms = { eow: 576, eowm: 576, eowo: 498, wk: 470 };
    const o = [];
    Object.entries(P).forEach(([k, [t, d, pat]]) => o.push({ id: "a:" + k, g: "a", t: `Mainly with ${A} · ${t.toLowerCase()} with ${B}`, short: t, d, cms: cms[k], payer: "b", pat, r: k === "eowm" || k === "eowo" ? "strong" : "ok", rw: k === "wk" ? "Reasonable, though weekends-only squeezes school-night time." : "Close to what's happening now — courts favour stability." }));
    [["wk", "Week on, week off", "Swap on Fridays. Simple, but a long week apart for young children.", "aaaaaaa" + "bbbbbbb"], ["223", "2-2-3 rotation", "Never more than three nights apart from either parent.", "aabbaaa" + "bbaabbb"], ["2255", "2-2-5-5", "Fixed weekdays for each parent, alternate long weekends.", "aabbaaa" + "aabbbbb"], ["3443", "3-4-4-3", "Three or four nights at a time, swapping midweek.", "aaabbbb" + "aaaabbb"]].forEach(([k, t, d, pat]) => o.push({ id: "s:" + k, g: "s", t: `Equal shared care · ${t}`, short: t, d: `${d} No child maintenance either way.`, pat, r: k === "wk" ? "ok" : k === "223" ? "strong" : "ok", rw: k === "223" ? "Often recommended for under-8s — short gaps from both parents." : "Works when homes are close and the children are settled." }));
    ["eow", "eowo"].forEach((k) => o.push({ id: "b:" + k, g: "b", t: `Mainly with ${B} · ${P[k][0].toLowerCase()} with ${A}`, short: P[k][0], d: `A big change from now — ${P[k][1].toLowerCase()}`, cms: 310, payer: "a", pat: swap(P[k][2]), r: "stretch", rw: "Hard to justify against the current arrangement." }));
    return o;
  }

  function secs(N, kids) {
    const A = N.Me, B = N.Them, S = [];
    if (kids) S.push({ id: "children", t: "The children", kids: true, facts: `Emma (7) and Jake (4) live mainly with ${A}. Start with who they'll live with, then the pattern.`, money: false,
      groups: [["a", `Mainly with ${A}`, `${B} has regular time — weekends, evenings or overnights.`], ["s", "Equal shared care", "Roughly half the nights with each of you."], ["b", `Mainly with ${B}`, `${A} has regular time.`]],
      opts: kidsOpts(A, B) });
    S.push({ id: "home", t: "The family home", facts: `12 Oak Road · agreed value £357,500 · £175,000 mortgage · £182,500 equity. ${A} and the children live there.`, total: EQ, dyn: "home",
      modes: [["now", "Sell now"], ["later", "Sell later"], ["keep", `${A} keeps it`], ["mkeep", `${B} keeps it`]],
      opts: [
        { id: "sell50", t: "Sell, split the equity 50/50", a: 91250, b: 91250, d: `Clean break on the house. ${A} and the children would need to move.`, r: "ok", rw: "Fair on paper, but courts weigh the children's housing first." },
        { id: "sell60", t: `Sell, 60/40 to ${A}`, a: 109500, b: 73000, d: `Extra share reflects ${A} housing the children.`, r: "strong", rw: "Typical where one parent is the main carer." },
        { id: "mesher", t: "Defer the sale until Jake is 18", a: 109500, b: 73000, d: `${A} stays with the children; ${B} keeps 40% of the equity, released on sale.`, r: "strong", rw: "A common route (a Mesher order) when the children need the home." },
        { id: "buy", t: `${A} keeps the home and buys ${B} out at 40%`, a: 109500, b: 73000, d: "Needs about £73,000 — a remortgage capacity check comes next.", r: "ok", rw: "Reasonable if the remortgage works; check affordability first." },
      ] });
    S.push({ id: "pensions", t: "Pensions", facts: `${A}'s NHS pension CETV £112,400 · ${B}'s Aviva pension £86,400. A £26,000 gap.`, total: PA + PB, dyn: "pen",
      opts: [
        { id: "each", t: "Each keeps their own pension", a: PA, b: PB, d: "No pension sharing order. Simplest and cheapest.", r: "ok", rw: "Arguable after a 14-year marriage, but within range." },
        { id: "quarter", t: `Share a quarter of the gap to ${B}`, a: 105900, b: 92900, d: "A small pension sharing order (about £6,500).", r: "strong", rw: "Narrows the gap without the cost of full equalisation." },
        { id: "eq", t: "Equalise the pensions", a: 99400, b: 99400, d: "Pension sharing order moves £13,000 to the Aviva scheme.", r: "ok", rw: "Equal is defensible; the NHS scheme charges about £1,500 to implement." },
      ] });
    S.push({ id: "savings", t: "Savings & accounts", facts: `${A}: £10,760 · ${B}: £16,180 incl. Vanguard ISA · joint ••7730: £1,186.`, total: SV, dyn: "sav",
      opts: [
        { id: "each", t: "Each keeps their own, split the joint account", a: SVA, b: SV - SVA, d: "No transfers beyond the joint balance.", r: "ok", rw: "Simple. The ISA difference is small next to the home." },
        { id: "pool", t: "Pool everything and split equally", a: SV / 2, b: SV / 2, d: `${B} transfers £2,710 to ${A}.`, r: "strong", rw: "Savings built during the marriage are usually shared." },
      ] });
    S.push({ id: "vehicles", t: "Vehicles", facts: `${A}'s Golf £10,250 with £7,400 finance · ${B}'s Octavia £14,000, owned outright.`, total: 16850,
      opts: [
        { id: "each", t: "Each keeps their car and its finance", a: 2850, b: 14000, d: "No cash moves.", r: "ok", rw: "Common — though the equity gap is £11,150." },
        { id: "bal", t: `Each keeps their car, ${B} pays £5,575 to balance`, a: 8425, b: 8425, d: "Evens out the equity in the two cars.", r: "strong", rw: "Even and simple." },
      ] });
    S.push({ id: "debts", t: "Debts", facts: `${A}'s Barclaycard £2,150 · ${B}'s Amex £3,200 (holiday and household spending).`, total: -5350,
      opts: [
        { id: "own", t: "Each pays their own", a: -2150, b: -3200, d: "Cards stay with the named holder.", r: "ok", rw: "Usual for personal cards — but some Amex spend was family." },
        { id: "shared", t: `Share the Amex 50/50, Barclaycard stays with ${A}`, a: -3750, b: -1600, d: "Treats the holiday and household spend as joint.", r: "strong", rw: "Fair where spending was for the family." },
      ] });
    S.push({ id: "spousal", t: "Spousal maintenance", facts: `${A} has a £640/mo shortfall after the children's costs. ${B} has about £1,100/mo surplus.`, money: false,
      opts: [
        { id: "clean", t: "Clean break — no ongoing payments", d: `${A} covers the shortfall from savings or more hours.`, total: 0, r: "stretch", rw: "Hard to justify with a clear shortfall and young children." },
        { id: "two", t: "£400/mo for 2 years, then a clean break", d: "£9,600 in total. Bridges the gap while the children settle.", total: 9600, r: "strong", rw: "Short, defined terms are what most courts prefer." },
        { id: "three", t: "£400/mo for 3 years", d: "£14,400 in total, ending when Jake starts school full time.", total: 14400, r: "ok", rw: "Reasonable — tied to a clear milestone." },
        { id: "five", t: "£600/mo for 5 years", d: "£36,000 in total. Covers almost all the shortfall.", total: 36000, r: "stretch", rw: "Likely to be challenged as too long for this income gap." },
      ] });
    S.forEach((s) => { s.A = A; s.B = B; });
    return S;
  }

  /* slider positions → synthetic options */
  const SL = {
    home: { steps: [70, 65, 60, 55, 50, 45, 40, 35, 30], lbl: (n) => `${n}/${100 - n}` },
    pen: { steps: [0, 25, 50, 75, 100], lbl: (p) => (p === 0 ? "Keep own" : p === 100 ? "Equal" : `${p}%`) },
    sav: { steps: [60, 55, 50, 45, 40], lbl: (n) => (n === 40 ? "Keep own" : `${n}/${100 - n}`) },
  };
  function dyn(s, id) {
    const A = s.A, B = s.B, [m, v] = id.split(":"), n = Number(v);
    if (s.dyn === "home" && ["now", "later", "keep", "mkeep"].includes(m)) {
      const a = Math.round((EQ * n) / 100), b = EQ - a, to = n > 50 ? ` to ${A}` : n < 50 ? ` to ${B}` : "";
      const r = n >= 55 && n <= 65 ? "strong" : n === 50 ? "ok" : "stretch";
      const rw = n === 50 ? "Fair on paper, but courts weigh the children's housing first." : n >= 55 && n <= 65 ? `A typical extra share for the parent housing the children.` : n > 65 ? `Above what courts usually give a main carer — expect ${B} to push back.` : `Hard to justify while ${A} is housing the children.`;
      if (m === "now") return { id, a, b, r, rw, t: `Sell now, split the equity ${n}/${100 - n}${to}`, d: n === 50 ? `An equal split. ${A} and the children would need to move.` : n > 50 ? `The extra ${n - 50}% reflects ${A} housing the children.` : `${B} takes the larger share of the equity.` };
      if (m === "later") return { id, a, b, r: r === "strong" ? "strong" : r, rw: `Deferring the sale (a Mesher order) keeps the children settled. ${rw}`, t: `Sell when Jake is 18, split ${n}/${100 - n}${to}`, d: `${A} stays in the home with the children; ${B}'s ${100 - n}% is released on sale.` };
      if (m === "mkeep") return { id, a, b, r: "stretch", rw: `${A} and the children would have to move — courts are wary of that with young children. ${n < 50 ? rw : ""}`.trim(), t: `${B} keeps the home, buys ${A} out at ${n}%`, d: `${A} and the children move; ${B} would need about ${gbp(a)} to buy ${A} out.` };
      return { id, a, b, r: r === "strong" ? "ok" : r, rw: `Depends on ${A} raising about ${gbp(b)}. ${rw}`, t: `${A} keeps the home, buys ${B} out at ${100 - n}%`, d: `${A} would need about ${gbp(b)} — a remortgage capacity check comes next.` };
    }
    if (s.dyn === "pen" && m === "pen") {
      const tr = Math.round((13000 * n) / 100);
      return { id, a: PA - tr, b: PB + tr, t: n === 0 ? "Each keeps their own pension" : n === 100 ? "Equalise the pensions" : `Share ${n}% of the gap to ${B}`, d: n === 0 ? "No pension sharing order. Simplest and cheapest." : `A pension sharing order moves ${gbp(tr)} to ${B}'s Aviva scheme.`, r: n === 25 || n === 50 ? "strong" : "ok", rw: n === 0 ? "Arguable after a 14-year marriage, but within range." : n === 100 ? "Equal is defensible; the NHS scheme charges about £1,500 to implement." : "Narrows the gap without the full cost of equalising." };
    }
    if (s.dyn === "sav" && m === "sav") {
      const a = n === 40 ? SVA : Math.round((SV * n) / 100);
      return { id, a, b: SV - a, t: n === 40 ? "Each keeps their own, split the joint account" : n === 50 ? "Pool everything and split equally" : `Pool everything, split ${n}/${100 - n}`, d: n === 40 ? "No transfers beyond the joint balance." : `${a > SVA ? B + " transfers " + gbp(a - SVA) + " to " + A : A + " transfers " + gbp(SVA - a) + " to " + B}.`, r: n === 50 ? "strong" : n === 60 ? "stretch" : "ok", rw: n === 50 ? "Savings built during the marriage are usually shared." : n === 60 ? "More than an equal share needs a reason, like the children's costs." : "Within range." };
    }
    return null;
  }
  const opt = (s, id) => (!id ? null : s.opts.find((o) => o.id === id) || (id.includes(":") && s.dyn ? dyn(s, id) : null));

  const SARAH = { children: "a:eowm", home: "later:60", pensions: "pen:0", savings: "sav:40", vehicles: "bal", debts: "own", spousal: "three" };
  const MARK = {
    ok: { home: ["sell60", "mesher", "buy"], pensions: ["eq", "quarter"], savings: ["each", "pool"], vehicles: ["each", "bal"], debts: ["shared"], spousal: ["clean", "two"] },
    pref: { pensions: "eq", debts: "shared", spousal: "clean", home: "sell50" },
    mid: { pensions: "quarter", debts: "shared", spousal: "two", home: "mesher" },
    why: {
      children: "I'd like a midweek overnight as well — I don't want to be a weekend-only dad.",
      home: "I'd like the equity closer to equal. 55/45 still gives you the larger share for the children.",
      pensions: "Your NHS pension is worth £112k; mine is £86k. I worked alongside you for most of that time — I'd like them equalised.",
      debts: "Most of the Amex was the bathroom and the family holiday. That feels joint to me.",
      spousal: "I'd prefer a clean break. If there's a genuine shortfall in a specific month, we can talk about it.",
      mid_pensions: "OK — I can live with sharing half the gap. It keeps the cost down for both of us.",
      mid_home: "60/40 then — as long as the sale date is fixed.",
      mid_spousal: "Two years, then a clean break. That I can agree to.",
    },
  };
  function ok(sid, id) {
    if (!id || id === "custom") return false;
    if (sid === "children") return id.startsWith("s:") || ["a:eowo", "a:wk", "a:eowm"].includes(id);
    if (id.includes(":")) { const [m, v] = id.split(":"), n = Number(v); if (sid === "home") return n <= 60 || m === "mkeep"; if (sid === "pensions") return n >= 50; if (sid === "savings") return true; }
    return (MARK.ok[sid] || []).includes(id);
  }
  function counter(sid, id, round) {
    if (sid === "children") return "a:eowo";
    if (id && id.includes(":")) { const m = id.split(":")[0]; if (sid === "home") return `${m}:${round < 1 ? 55 : 60}`; if (sid === "pensions") return round < 1 ? "pen:100" : "pen:50"; }
    return round < 1 ? MARK.pref[sid] || MARK.mid[sid] : MARK.mid[sid] || MARK.pref[sid];
  }
  function fallback(sid, id) {
    if (sid === "children") return "a:eowo";
    if (id && id.includes(":")) { const m = id.split(":")[0]; if (sid === "home") return `${m}:60`; if (sid === "pensions") return "pen:50"; return null; }
    return MARK.mid[sid];
  }
  function split(S, picks) {
    let a = 0, b = 0;
    S.forEach((s) => { const o = opt(s, picks[s.id]); if (o && o.a != null) { a += o.a; b += o.b; } });
    return { a, b, total: a + b, pa: a + b ? Math.round((a / (a + b)) * 100) : 50 };
  }
  function markReply(S, mine, round) {
    const picks = {}, why = {};
    S.forEach((s) => { const p = mine[s.id]; if (ok(s.id, p)) picks[s.id] = p; else { picks[s.id] = counter(s.id, p, round); why[s.id] = round < 1 ? MARK.why[s.id] : MARK.why["mid_" + s.id] || MARK.why[s.id]; } });
    return { picks, why };
  }
  const predict = (sid, id) => (ok(sid, id) ? ["yes", "Likely to accept"] : ["no", "Likely to push back"]);
  const R2S = { home: { sell50: "now:50", sell60: "now:60", mesher: "later:60", buy: "keep:60" }, pensions: { each: "pen:0", quarter: "pen:25", eq: "pen:100" }, savings: { each: "sav:40", pool: "sav:50" } };
  function toStyle(s, id, style) {
    if (!id || id === "custom" || !s.dyn) return id;
    const m = R2S[s.id] || {};
    if (style === "slider") return id.includes(":") ? id : m[id] || null;
    if (!id.includes(":")) return id;
    const back = Object.entries(m).find(([, v]) => v === id);
    return back ? back[0] : null;
  }
  const valid = (s, id, txt) => (id === "custom" ? !!(txt || "").trim() : !!opt(s, id));
  return { toStyle, valid, gbp, R, secs, SARAH, MARK, SL, opt, split, markReply, predict, fallback };
})();
