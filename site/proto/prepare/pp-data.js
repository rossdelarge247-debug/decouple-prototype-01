/* Prepare — profiling questions, the question-per-screen flow, and how answers become Form E-aligned picture rows. */
window.PP = (function () {
  const gbp = (v) => "£" + Math.round(v).toLocaleString("en-GB");
  const SECS = [
    { id: "children", n: "0", t: "The children", fe: "Form E 1.13–1.14", c: "#9D174D", bg: "#FCE7F3" },
    { id: "income", n: "1", t: "Income", fe: "Form E 2.15–2.19", c: "#047857", bg: "#D1FAE5" },
    { id: "outgoings", n: "2", t: "Outgoings", fe: "Form E Part 3", c: "#57534E", bg: "#F2EFEA" },
    { id: "home", n: "3", t: "The family home", fe: "Form E 2.1", c: "#0369A1", bg: "#E0F2FE" },
    { id: "other_prop", n: "4", t: "Other property", fe: "Form E 2.2", c: "#0369A1", bg: "#E0F2FE", noun: "other property" },
    { id: "accounts", n: "5", t: "Bank accounts & savings", fe: "Form E 2.3–2.4", c: "#4338CA", bg: "#EEF2FF" },
    { id: "other_assets", n: "6", t: "Other assets & business", fe: "Form E 2.6–2.11", c: "#4338CA", bg: "#EEF2FF", noun: "other assets" },
    { id: "pensions", n: "7", t: "Pensions", fe: "Form E 2.13", c: "#5B21B6", bg: "#F3EEFE", noun: "pensions" },
    { id: "debts", n: "8", t: "Debts", fe: "Form E 2.14", c: "#92400E", bg: "#FEF3C7", noun: "debts" },
  ];
  const FLOW = [["income", "Income"], ["outgoings", "Outgoings"], ["assets", "Assets"], ["debts", "Debts"], ["pensions", "Pensions"]];
  const CATS = [
    ["salary", "Salary or wages", "income"], ["selfinc", "Self-employed income", "income"], ["benefit", "Benefits", "income"], ["otherinc", "Other income", "income"],
    ["housing", "Mortgage or rent", "outgoings"], ["bills", "Household bills", "outgoings"], ["food", "Groceries", "outgoings"], ["kids", "Children", "outgoings"],
    ["transport", "Car & transport", "outgoings"], ["personal", "Personal spending", "outgoings"], ["debtpay", "Debt repayment", "debts"], ["saving", "Savings", "accounts"],
    ["owed", "Money owed to you", "other_assets"], ["transfer", "Transfer between my accounts", null],
  ];
  const catName = (k) => (CATS.find((c) => c[0] === k) || [k, k])[1];
  const catSec = (k) => (CATS.find((c) => c[0] === k) || [])[2];

  function profileQs(a, N) {
    const pre = {
      housing: { own_together: "mort_joint", own_me: "mort_me", own_them: "mort_them", rent: "rent", family: "other" }[a.home],
      work: { employed: "employed", self: "self", none: "none", retired: "none" }[a.work],
      pens: Array.isArray(a.pen_type) ? a.pen_type.filter((x) => ["work", "personal", "public"].includes(x)) : undefined,
    };
    return [
      a.kids === "with" && { id: "kids", t: "Tell us about your children", why: "First names and ages. They lead the whole picture — and Form E asks for them.", type: "kids",
        pre: (Array.isArray(a.ages) && a.ages.length ? a.ages : ["5_11"]).map((g) => ({ name: "", age: String({ u5: 3, "5_11": 8, "11_16": 13, "16_18": 17 }[g] || 8) })) },
      a.kids === "with" && { id: "live", t: "Where do they live day to day?", why: "This is about now — not what you'll agree later.", type: "cards", pre: { me: "me", them: "them", shared: "shared", unsettled: "unsettled" }[a.kids_live],
        opts: [["me", "Mostly with me"], ["them", `Mostly with ${N.them}`], ["shared", "Roughly equal time with each of us"], ["unsettled", "It's not settled yet"]] },
      { id: "housing", t: "Your home — mortgage or rent?", why: "So we know what to look for in your outgoings.", type: "cards", pre: pre.housing,
        opts: [["mort_joint", "We own it — joint mortgage"], ["mort_me", "Own it — mortgage in my name"], ["mort_them", `Own it — mortgage in ${N.them}'s name`], ["outright", "Own it outright, no mortgage"], ["rent", "We rent"], ["other", "Living with family, or something else"]] },
      { id: "payer", t: (p) => `Who's paying the ${p.housing === "rent" ? "rent" : "mortgage"} at the moment?`, why: "It changes whose outgoings it belongs in.", type: "cards", when: (p) => p.housing && !["outright", "other"].includes(p.housing),
        opts: [["me", "Me"], ["them", N.Them], ["both", "We're splitting it"], ["nobody", "It's not being paid right now"]] },
      { id: "work", t: "How do you earn your income?", why: "Employment and self-employment need different evidence.", type: "cards", pre: pre.work,
        opts: [["employed", "Employed"], ["self", "Self-employed"], ["both", "Both"], ["benefits", "Benefits only"], ["none", "Not working right now"]] },
      { id: "car", t: "Do you have a car?", why: "Car finance is a debt; a car you own is an asset.", type: "cards",
        opts: [["owned", "Yes — I own it outright"], ["finance", "Yes — on finance"], ["lease", "Yes — leased"], ["none", "No car"]] },
      { id: "pens", t: "What pensions do you have?", why: "Tap all that apply. We'll look for contributions.", type: "chips", pre: pre.pens,
        opts: [["work", "Workplace"], ["public", "Public sector (NHS, teachers…)"], ["personal", "Personal / SIPP"], ["none", "None"], ["unsure", "Not sure"]] },
    ].filter(Boolean);
  }

  function cards(a, P, N, opt) {
    const manual = !!opt.manual, kids = a.kids === "with", bankN = opt.bank || "Barclays";
    const work = P.work || "employed", hs = P.housing || "mort_joint", car = P.car || "none", pens = P.pens || [];
    const out = [];
    const C = (o) => out.push(o);
    /* income */
    if (work === "employed" || work === "both") {
      C({ id: "i_sal", sec: "income", kind: "group", title: "Is this your salary?", src: "NHS Business Services", detail: "12 monthly payments into your current account", amt: 2847, per: "/mo",
        txs: [["25 Sep", 2847], ["25 Aug", 2847], ["25 Jul", 2812.4]], row: { sec: "income", l: "Salary — NHS Business Services", v: "£2,847 / mo", n: 2847 } });
      C({ id: "i_ev_pay", sec: "income", kind: "ev", title: "Add your last 3 payslips and your P60", detail: "Form E asks for these as proof of employment income.", must: true, evSec: "income", evL: "Payslips ×3 and P60" });
    }
    if (work === "self" || work === "both") {
      C({ id: "i_self", sec: "income", kind: "group", title: "Is this your self-employed income?", src: "Stripe Payments UK", detail: "Varying payments, about £3,100 a month on average", amt: 3100, per: "/mo avg",
        txs: [["28 Sep", 3480], ["29 Aug", 2610], ["30 Jul", 3215]], row: { sec: "income", l: "Self-employed income — Stripe payouts", v: "~£3,100 / mo", n: 3100 } });
      C({ id: "i_ev_sa", sec: "income", kind: "ev", title: "Add your last two tax returns (SA302s)", detail: "Self-employed income needs two years of accounts or SA302s.", must: true, evSec: "income", evL: "SA302s × 2 years" });
    }
    if (work === "benefits") C({ id: "i_ben", sec: "income", kind: "group", title: "Is this Universal Credit?", src: "DWP UC", detail: "Monthly payments from the DWP", amt: 940, per: "/mo", txs: [["14 Sep", 940], ["14 Aug", 940]], row: { sec: "income", l: "Universal Credit", v: "£940 / mo", n: 940 } });
    C({ id: "i_tr", sec: "income", kind: "q", title: `What are the monthly payments from ${N.Them}?`, src: `${(N.them === "your partner" ? "PARTNER" : N.them.toUpperCase())} · standing order`, amt: 400, per: "/mo", detail: "£400 on the 1st of every month since June",
      opts: [kids && ["maint", "Child maintenance"], ["bills", "Their share of the bills"], ["loan", "Paying back money I lent"], ["other", "Something else"]].filter(Boolean),
      toRow: (v) => ({ sec: "income", l: `From ${N.Them} — ${{ maint: "child maintenance", bills: "share of bills", loan: "loan repayment", other: "regular payment" }[v]}`, v: "£400 / mo", n: 400 }) });
    if (kids) C({ id: "i_cb", sec: "income", kind: "group", title: "Is this Child Benefit?", src: "HMRC Child Benefit", detail: "Paid every four weeks", amt: 102.4, per: "/4 wks", txs: [["22 Sep", 102.4], ["25 Aug", 102.4]], row: { sec: "income", l: "Child Benefit", v: "£111 / mo", n: 111 } });
    C({ id: "i_hmrc", sec: "income", kind: "single", title: "What was this payment?", src: "HMRC", detail: "One payment on 14 March", amt: 1250, per: "once",
      opts: [["refund", "A tax refund — one-off"], ["benefit", "A benefit payment"], ["other", "Something else"]], toRow: (v) => ({ sec: "income", l: v === "refund" ? "One-off: HMRC tax refund" : "HMRC payment", v: "£1,250 once", n: 0 }) });
    /* outgoings */
    if (hs !== "outright" && hs !== "other") {
      const rent = hs === "rent";
      C({ id: "o_home", sec: "outgoings", kind: "group", title: rent ? "Is this your rent?" : "Is this your mortgage?", src: rent ? "Foxtons Lettings" : "Nationwide BS", detail: P.payer === "them" ? `You said ${N.them} pays this — but it's leaving your account` : "Monthly direct debit, same day each month", amt: rent ? 1350 : 1140, per: "/mo",
        txs: [["1 Sep", rent ? 1350 : 1140], ["1 Aug", rent ? 1350 : 1140]], row: { sec: "outgoings", l: rent ? "Rent — Foxtons" : "Mortgage — Nationwide", v: gbp(rent ? 1350 : 1140) + " / mo", n: rent ? 1350 : 1140 } });
    }
    C({ id: "o_bills", sec: "outgoings", kind: "group", title: "Are these your household bills?", src: "4 regular payees", detail: "Octopus Energy · Severn Trent · Exeter City Council · Sky", amt: 412, per: "/mo",
      txs: [["Octopus Energy", 168], ["Exeter City Council", 162], ["Severn Trent", 44], ["Sky", 38]], row: { sec: "outgoings", l: "Household bills", sub: "energy · council tax · water · broadband", v: "£412 / mo", n: 412 } });
    C({ id: "o_food", sec: "outgoings", kind: "group", title: "Is this your food shopping?", src: "Tesco · Sainsbury's · Aldi", detail: "64 payments over 12 months", amt: 618, per: "/mo avg",
      txs: [["Tesco", 342], ["Sainsbury's", 188], ["Aldi", 88]], row: { sec: "outgoings", l: "Groceries", sub: "Tesco · Sainsbury's · Aldi", v: "£618 / mo", n: 618 } });
    if (kids) C({ id: "o_kids", sec: "outgoings", kind: "q", title: "Who pays for childcare and school costs?", src: "Bright Horizons", detail: "£600 a month to a nursery", amt: 600, per: "/mo",
      opts: [["me", "Mostly me"], ["split", "We split them"], ["them", `Mostly ${N.them}`]], toRow: (v) => ({ sec: "children", l: "Childcare — Bright Horizons", sub: { me: "paid by you", split: "split between you", them: `paid by ${N.them}` }[v], v: "£600 / mo", n: v === "them" ? 0 : v === "split" ? 300 : 600 }) });
    if (kids) C({ id: "o_school", sec: "outgoings", kind: "q", title: "Any school fees or regular school costs?", src: "School costs", detail: "Uniform, trips and clubs count too.",
      opts: [["state", "State school — small costs only"], ["fees", "We pay school fees"], ["notyet", "Not at school yet"]],
      toRow: (v) => v === "fees" ? { sec: "children", l: "School fees", sub: "amount to add", v: "—", n: 0, badge: "gap" } : v === "state" ? { sec: "children", l: "School costs — uniform, trips, clubs", v: "~£45 / mo", n: 45, badge: "self" } : null });
    C({ id: "o_amz", sec: "outgoings", kind: "single", title: "What's this mostly for?", src: "Amazon", detail: "38 payments, about £214 a month", amt: 214, per: "/mo avg",
      opts: [["bills", "The household"], ["kids", "The children"], ["personal", "Me"]], toRow: (v) => ({ sec: "outgoings", l: "Amazon", sub: { bills: "household", kids: "children", personal: "personal" }[v], v: "£214 / mo", n: 214 }) });
    if (car === "finance") C({ id: "o_car", sec: "outgoings", kind: "group", title: "Is this your car finance?", src: "Black Horse", detail: "Monthly payment, 22 months left", amt: 289, per: "/mo", txs: [["5 Sep", 289], ["5 Aug", 289]], row: { sec: "outgoings", l: "Car finance — Black Horse", v: "£289 / mo", n: 289 } });
    if (car === "lease") C({ id: "o_car", sec: "outgoings", kind: "group", title: "Is this your car lease?", src: "LeasePlan", detail: "Monthly payment", amt: 329, per: "/mo", txs: [["9 Sep", 329]], row: { sec: "outgoings", l: "Car lease — LeasePlan", v: "£329 / mo", n: 329 } });
    if (car === "owned") C({ id: "o_car", sec: "outgoings", kind: "group", title: "Are these your car costs?", src: "Shell · BP · DVLA", detail: "Fuel, tax and servicing", amt: 160, per: "/mo avg", txs: [["Shell", 96], ["BP", 44], ["DVLA", 20]], row: { sec: "outgoings", l: "Car running costs", sub: "fuel · tax · servicing", v: "£160 / mo", n: 160 } });
    C({ id: "o_gift", sec: "outgoings", kind: "single", title: "What was this payment?", src: "J HOLLINS", detail: "One transfer on 3 June", amt: 2000, per: "once",
      opts: [["gift", "A gift"], ["loan", "A loan — they'll pay it back"], ["own", "To another account of mine"]],
      toRow: (v) => v === "own" ? null : v === "loan" ? { sec: "other_assets", l: "Money owed to you — J Hollins", v: "£2,000", n: 2000 } : { sec: "outgoings", l: "One-off: gift to J Hollins", v: "£2,000 once", n: 0 } });
    /* assets */
    if (hs !== "rent" && hs !== "other") {
      C({ id: "a_home", sec: "assets", kind: "amount", title: "What's the home worth, roughly?", src: "12 Oak Road, Exeter", detail: "From your interview. You can add a valuation later.", pre: 375000,
        toRow: (v) => ({ sec: "home", l: "12 Oak Road — estimated value", sub: hs === "mort_joint" ? `joint with ${N.them}` : "", v: gbp(v), n: v, badge: "self" }) });
      if (hs !== "outright") C({ id: "a_mort", sec: "assets", kind: "group", title: "Is this what's left on the mortgage?", src: "Nationwide BS", detail: "From your annual mortgage statement", amt: 175000, per: "owing", txs: [["Balance at 1 Sep", 175000]], row: { sec: "home", l: "Mortgage outstanding — Nationwide", v: "−£175,000", n: -175000 } });
      C({ id: "a_ev_val", sec: "assets", kind: "ev", title: "Add an estate agent's valuation", detail: "Three agents' figures settle most disagreements before they start.", evSec: "home", evL: "Valuation of 12 Oak Road" });
    }
    if (manual) C({ id: "a_acc", sec: "assets", kind: "amount", title: "How much is in your bank accounts, in total?", src: "All your accounts", detail: "A rough total for now. Upload statements later.", pre: 4000, toRow: (v) => ({ sec: "accounts", l: "Bank accounts — total", v: gbp(v), n: v, badge: "self" }) });
    else C({ id: "a_acc", sec: "assets", kind: "group", title: "Are these balances right?", src: bankN, detail: "As at today, from your connected accounts", amt: 11946.52, per: "total",
      txs: [["Current ••4821", 2340.12], ["Joint ••7730", 1186.4], ["Instant saver ••1290", 8420]],
      rows: [{ sec: "accounts", l: "Current account ••4821", sub: bankN, v: "£2,340", n: 2340 }, { sec: "accounts", l: "Joint account ••7730", sub: `${bankN} · joint with ${N.them}`, v: "£1,186", n: 1186, joint: true }, { sec: "accounts", l: "Instant saver ••1290", sub: bankN, v: "£8,420", n: 8420 }] });
    C({ id: "a_sav", sec: "assets", kind: "q", title: "Any savings, ISAs or investments that aren't in a connected account?", src: "Money elsewhere", detail: "Premium Bonds, shares, crypto or an account at another bank all count.",
      opts: [["yes", "Yes — I'll add them"], ["no", "No, that's everything"]], toRow: (v) => v === "yes" ? { sec: "accounts", l: "Savings elsewhere", sub: "to add", v: "—", n: 0, badge: "gap" } : null });
    if (car === "owned" || car === "finance") C({ id: "a_car", sec: "assets", kind: "amount", title: "Roughly what's your car worth?", src: "Your car", detail: "A quick online valuation is fine.", pre: 9000, toRow: (v) => ({ sec: "other_assets", l: "Car — estimated value", v: gbp(v), n: v, badge: "self" }) });
    C({ id: "a_biz", sec: "assets", kind: "q", title: "Do you own, or part-own, a business?", src: "Business interests", detail: "Including a limited company, a partnership, or shares in a family firm.",
      opts: [["yes", "Yes"], ["no", "No"]], toRow: (v) => v === "yes" ? { sec: "other_assets", l: "Business interest", sub: "needs a valuation", v: "—", n: 0, badge: "gap" } : null });
    /* debts */
    C({ id: "d_card", sec: "debts", kind: "group", title: "Is this a credit card?", src: "Barclaycard", detail: "18 payments, about £180 a month", amt: 180, per: "/mo", txs: [["12 Sep", 180], ["12 Aug", 210]], row: { sec: "debts", l: "Barclaycard", sub: "balance to confirm", v: "—", n: 0, badge: "gap" } });
    C({ id: "d_ev_card", sec: "debts", kind: "ev", title: "Add your latest Barclaycard statement", detail: "So we can show the balance, not just the payments.", evSec: "debts", evL: "Barclaycard statement" });
    if (car === "finance") C({ id: "d_car", sec: "debts", kind: "amount", title: "What's left to pay on the car finance?", src: "Black Horse", detail: "It's on your finance agreement or app.", pre: 7400, toRow: (v) => ({ sec: "debts", l: "Car finance — Black Horse", v: "−" + gbp(v), n: -v, badge: "self" }) });
    C({ id: "d_else", sec: "debts", kind: "q", title: "Any loans or cards we can't see — held with another bank?", src: "Debts elsewhere", detail: "Store cards, personal loans, buy-now-pay-later and family loans count.",
      opts: [["yes", "Yes — I'll add them"], ["no", "No"]], toRow: (v) => v === "yes" ? { sec: "debts", l: "Debts elsewhere", sub: "to add", v: "—", n: 0, badge: "gap" } : null });
    /* pensions */
    if (pens.includes("work") || pens.includes("public") || (!pens.length && work !== "none")) {
      C({ id: "p_con", sec: "pensions", kind: "group", title: "Is this your workplace pension?", src: "NHS Pension Scheme", detail: "£312 a month, taken from your salary", amt: 312, per: "/mo", txs: [["Sep payslip", 312], ["Aug payslip", 312]], row: { sec: "pensions", l: "NHS Pension Scheme", sub: "valuation needed", v: "CETV", n: 0, badge: "gap" } });
    }
    if (!pens.includes("none")) C({ id: "p_ev", sec: "pensions", kind: "ev", title: "Request a pension valuation (CETV)", detail: "Ask each provider for a “Cash Equivalent Transfer Value for divorce”. It can take up to three months — so ask today.", must: true, evSec: "pensions", evL: "CETV for each pension" });
    C({ id: "p_old", sec: "pensions", kind: "q", title: "Any old workplace or private pensions?", src: "Other pensions", detail: "Pensions from previous jobs are easy to forget — and they all count.",
      opts: [["yes", "Yes — I'll add them"], ["no", "No"], ["unsure", "Not sure — help me find them"]], toRow: (v) => v === "yes" || v === "unsure" ? { sec: "pensions", l: v === "yes" ? "Old pensions" : "Find old pensions (Pension Tracing Service)", sub: "to add", v: "—", n: 0, badge: "gap" } : null });
    if (manual) out.forEach((c) => { if (c.kind === "group" && c.row && c.row.n > 0) { c.kind = "amount"; c.pre = c.amt; c.title = c.title.replace(/^Is this |^Are these /, "How much is ").replace(/\?$/, ", roughly?"); c.toRow = (v) => ({ ...c.row, v: gbp(v) + " / mo", n: v, badge: "self" }); } });
    return out;
  }

  const flowSec = (c) => c.sec;
  /* turn answers into rows per paper section */
  function picture(list, res, ev, extra, ko = {}) {
    const rows = {}, unsorted = [], evid = {};
    const secs = SECS.filter((s) => s.id !== "children" || ko.kids).map((s, i) => ({ ...s, n: String(i + 1) }));
    SECS.forEach((s) => { rows[s.id] = []; evid[s.id] = []; });
    if (ko.kids) (ko.list || []).filter((k) => k.age !== "").forEach((k, i) => rows.children.push({ key: "kid" + i, l: `${k.name || "Child " + (i + 1)}, ${k.age}`, sub: { me: "Lives mainly with you", them: `Lives mainly with ${ko.them}`, shared: "Shared care, roughly equal", unsettled: "Living arrangements not settled" }[ko.live] || "", v: "Dependent", n: 0, badge: "self", info: true }));
    list.forEach((c) => {
      const r = res[c.id]; if (!r) return;
      if (c.kind === "ev") { evid[c.evSec].push({ id: c.id, l: c.evL, st: ev[c.id] || r.v, must: c.must }); return; }
      if (r.v === "unsure") { unsorted.push({ key: c.id, l: c.src, sub: c.detail, v: c.amt ? gbp(c.amt) + (c.per && c.per !== "once" && c.per !== "total" && c.per !== "owing" ? " " + c.per : "") : "—", card: c.id }); return; }
      let rs = [];
      if (r.v === "recat" || c.kind === "group") rs = r.v === "yes" ? (c.rows || [c.row]) : r.v === "recat" && catSec(r.cat) ? [{ sec: catSec(r.cat), l: `${c.src} — ${catName(r.cat).toLowerCase()}`, v: c.amt ? gbp(c.amt) + (c.per && c.per.startsWith("/") ? " " + c.per.replace("/", "/ ") : "") : "—", n: 0, badge: "self" }] : [];
      else if (c.toRow) { const x = c.toRow(r.v); if (x) rs = [x]; }
      rs.filter((x) => x && x.sec).forEach((x, i) => rows[x.sec].push({ badge: "bank", ...x, key: c.id + i }));
    });
    (extra.added || []).forEach((x) => rows[x.sec] && rows[x.sec].push({ ...x, badge: "self" }));
    Object.entries(extra.moved || {}).forEach(([key, to]) => {
      for (const s in rows) { const i = rows[s].findIndex((x) => x.key === key); if (i >= 0 && s !== to) { const [x] = rows[s].splice(i, 1); rows[to].push({ ...x, moved: true }); break; } }
    });
    Object.entries(extra.uploads || {}).forEach(([sec, n]) => { for (let i = 0; i < n; i++) evid[sec].push({ id: sec + "-up" + i, l: ["Document", "Statement", "Letter"][i % 3] + ` ${i + 1}.pdf`, st: "up" }); });
    const none = extra.none || {};
    if (ko.kids && !rows.children.some((r) => r.info)) rows.children.unshift({ key: "kid-gap", l: "Your children's names and ages", sub: "to add", v: "—", n: 0, badge: "gap" });
    const status = secs.map((s) => ({ id: s.id, done: rows[s.id].length > 0 || !!none[s.id], gaps: rows[s.id].filter((x) => x.badge === "gap").length, evOut: evid[s.id].filter((e) => e.st !== "up").length }));
    const evAll = Object.values(evid).flat(), evUp = evAll.filter((e) => e.st === "up").length;
    const secDone = status.filter((s) => s.done).length;
    const pct = Math.round((secDone / secs.length) * 70 + (unsorted.length ? 0 : 10) + (evAll.length ? (evUp / evAll.length) * 20 : 20));
    const ready = secDone === secs.length && unsorted.length === 0;
    return { secs, rows, unsorted, evid, status, pct, ready, secDone, evAll, evUp };
  }
  return { SECS, FLOW, CATS, catName, catSec, profileQs, cards, picture, gbp, flowSec };
})();
