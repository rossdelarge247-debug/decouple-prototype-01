/* Decouple · Results — sample data, generated in exactly the format the pages post, so the charts are tested end to end. Seeded: same data every load. */
window.RSample = function () {
  const G = window.G, R = window.R, D = window.UT_DEFAULTS || {};
  let seed = 20261013;
  const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const wpick = (items, w) => { const s = w.reduce((a, b) => a + b, 0); let r = rnd() * s; for (let i = 0; i < items.length; i++) { r -= w[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; };
  const out = [], now = Date.now(), DAY = 864e5;
  const add = (sid, pid, proto, qid, q, type, a, t) => out.push(R.norm({ sid, pid, proto, qid, question: q, type, answer: a, at: new Date(t).toISOString() }));
  const W = {}, wts = (k, n) => W[k] || (W[k] = Array.from({ length: n }, () => 0.3 + rnd() * rnd() * 3));

  /* ── M02 · Divorce guide ── */
  const START = { a: 0.36, b: 0.49, c: 0.3, d: 0.41, e: 0.44, f: 0.53, g: 0.45, h: 0.39, i: 0.47 };
  const MUSTP = { shared: 0.62, bank: 0.47, vault: 0.55, formE: 0.6, parent: 0.52, coparent: 0.3, housing: 0.46, mortgage: 0.53, fair: 0.67, ai: 0.26, agree: 0.5, med: 0.38, docs: 0.61, sol: 0.57, after: 0.33, care: 0.29 };
  const TIERW = { A: [0.22, 0.46, 0.2, 0.12], B: [0.34, 0.3, 0.1, 0.26] }, BASE = [190, 640, 1250];
  const SAY = ["Knowing what order to do things in. Everyone tells you something different.", "One place for all the paperwork, instead of emails and spreadsheets.", "Being able to talk about money without it turning into a row.", "Understanding what’s fair without paying a solicitor £300 an hour to tell me.", "The pensions. I had no idea they were even part of it.", "Not having to repeat everything to five different people.", "Knowing what the children will go through and how to tell them.", "Just knowing how long it will all take.", "Getting him to actually share the bank statements.", "Something that explains the legal words in plain English.", "Feeling like someone is on both our sides, not just one.", "Knowing whether we can do it ourselves or need lawyers.", "The cost. I can’t afford two solicitors on top of two homes.", "Being told what to do this week, not everything at once."];
  const rate = (p) => { const r = rnd(); return r < p ? "Must have" : r < p + 0.3 ? "Nice to have" : "Not for me"; };
  const ans = (q, a) => {
    const o = G.optsOf(q); if (!o.length) return null;
    if (q.type === "chips") { const ex = q.exclusive, opts = o.filter((x) => x[0] !== ex), n = 1 + Math.floor(rnd() * Math.min(q.max || 3, 3)), w = wts(q.id, opts.length), pick = new Set(); while (pick.size < n) pick.add(wpick(opts, w)[0]); if (ex && rnd() < 0.06) return [ex]; return [...pick]; }
    return wpick(o, wts(q.id, o.length))[0];
  };
  for (let i = 0; i < 480; i++) {
    const sid = "m02-s" + i.toString(36).padStart(4, "0"), ver = rnd() < 0.5 ? "A" : "B", lv = "abcdefghi"[Math.floor(rnd() * 9)];
    let t = now - Math.pow(rnd(), 1.25) * 28 * DAY;
    const P = (sec) => `M02 Guide · ${sec} · ${ver} · L-${lv}`, tick = () => (t += 15000 + rnd() * 60000);
    const post = (sec, k, q, type, a) => add(sid, "anon", P(sec), "m02." + k, q, type, a, tick());
    if (rnd() > START[lv]) continue;
    post("Landing", "landing_view", "Saw the landing page", "event", R.LANDS[lv]);
    post("Landing", "landing_start", "Started from the landing page", "event", R.LANDS[lv]);
    const a = {}; let quit = false;
    for (const sec of G.activeSections(a)) {
      if (rnd() < 0.045) { quit = true; break; }
      if (sec.id === "safety") { a.safe = "safe"; continue; }
      if (sec.id === "names") continue;
      G.secQs(sec.id, a).forEach((q) => { if (q.type === "text" || q.type === "safe") return; const v = ans(q, a); if (v == null) return; a[q.id] = v; post("Interview", q.id, G.qText(q), q.type, G.labelOf(q, v)); });
    }
    if (quit) continue;
    post("Interview", "done", "Finished interview", "event", "yes");
    let all = true;
    for (const ch of G.chapters(a)) {
      if (rnd() < (ch.id === "service" ? 0.12 : 0.06)) { all = false; break; }
      const sec = "Guide · " + ch.n;
      (ch.feats || []).forEach((id) => rnd() < 0.86 && post(sec, "feat." + id, "Feature: " + G.FEAT[id][0], "feature", rate(MUSTP[id])));
      (ch.qs || []).forEach((q) => { if (rnd() < 0.18) return; if (q.type === "long") { if (rnd() < 0.42) post(sec, q.id, q.label, "long", SAY[Math.floor(rnd() * SAY.length)]); return; } const v = ans(q, a); post(sec, q.id, q.label, q.type, G.labelOf(q, v)); });
      if (ch.id === "service") {
        G.SERVICE_Q.forEach((q) => rnd() < 0.9 && post(sec, q.id, q.label, q.type, G.labelOf(q, ans(q, a))));
        const ti = wpick([0, 1, 2, 3], TIERW[ver]), PR = G.PRICES[ver];
        post(sec, "tier", "Package choice", "tiers", ti === 3 ? "None of these" : `${G.TIERS[ti].name} £${PR[ti]}`);
        const k = ti === 3 ? 1 : ti, tier = G.TIERS[k].id, c = BASE[k] * 0.55 + PR[k] * 0.45, r10 = (x) => Math.max(10, Math.round(x / 10) * 10);
        if (rnd() < 0.85) { const f = 0.75 + rnd() * 0.5, v = { cheap: c * (0.22 + rnd() * 0.22) * f, bargain: c * (0.5 + rnd() * 0.3) * f, dear: c * (1 + rnd() * 0.45) * f, too: c * (1.45 + rnd() * 0.9) * f }; G.VW.forEach(([kk, l]) => post(sec, "vw." + kk, `Price (${tier}): ${l}`, "vw", "£" + r10(v[kk]))); }
      }
      if (ch.id === "last") {
        G.LAST_Q.forEach((q) => post(sec, q.id, q.label, q.type, G.labelOf(q, ans(q, a))));
        if (rnd() < 0.8) { const ids = Object.keys(G.FEAT), sp = {}; for (let c = 0; c < 10; c++) { const id = wpick(ids, ids.map((x) => MUSTP[x] * MUSTP[x])); sp[id] = (sp[id] || 0) + 10; } Object.entries(sp).forEach(([id, v]) => post(sec, "spend." + id, "£100 spend: " + G.FEAT[id][0], "spend", "£" + v)); }
        const picks = [["launch", 0.46], ["chat", 0.21], ["pilot", 0.16]].filter(([, p]) => rnd() < p).map(([k]) => k);
        if (picks.length) post(sec, "optin", "Stay involved", "optin", picks.join("; "));
      }
      post(sec, "ch_done", "Finished chapter", "event", ch.id);
    }
    if (all) post("Guide · Full", "full", "Opened the full guide", "event", "yes");
  }

  /* ── Prototype testing ── */
  const table = R.parseCSV(D.CSV || ""), h = (table.shift() || []).map((x) => x.trim().toLowerCase()), Q = table.map((r) => Object.fromEntries(h.map((k, i) => [k, (r[i] || "").trim()])));
  const ST = [["01", "Discover"], ["02", "Interview"], ["03", "Playback"], ["04", "Sign-up"], ["05", "Onboard"], ["06", "Prepare"], ["07", "Household"], ["08", "Settle"], ["09", "Finalise"], ["10", "Dashboard"]];
  const SCR = { "01": ["Landing", "Pricing"], "02": ["Interview · about", "Interview · money"], "03": ["Playback · fair range", "Playback · next steps"], "04": ["Choose a plan", "Payment"], "05": ["Connect your bank", "Welcome tour"], "06": ["Your picture", "Share with Mark"], "07": ["Household picture", "Thread"], "08": ["Your proposal", "Agreement"], "09": ["Your documents", "Track"], "10": ["Overview", "Evidence vault"] };
  const FB = ["I wasn’t sure what would happen to my data when I clicked share.", "Loved seeing the picture build up as I went.", "The pricing felt clear, but I’d want to know what happens if he doesn’t pay his half.", "Some of the legal words lost me for a second.", "Felt calmer than I expected. The tone is right.", "I wanted a way to save and come back later.", "Not obvious where to go next after signing.", "The slider was satisfying, but I worried about getting it wrong.", "I’d want a real person to check this before it goes to court.", "Really clear. I’d pay for this."];
  const PROBE = ["Overall it makes sense, but I’m not sure what the button does.", "I’m looking for where it says how much this costs.", "I think it’s asking me to confirm Mark’s figures?", "I’d expect it to save automatically."];
  const QUAL = ST.map(() => 0.55 + rnd() * 0.35);
  for (let p = 1; p <= 11; p++) {
    const pid = "P" + String(p).padStart(2, "0"), sid = "S-" + (now - p * 977).toString(36).toUpperCase(), k = 3 + Math.floor(rnd() * 8);
    let t = now - (2 + rnd() * 18) * DAY;
    for (let i = 0; i < k; i++) {
      const [n, name] = ST[i], proto = `${n} ${name}`, qual = QUAL[i] + (rnd() - 0.5) * 0.3;
      t += (3 + rnd() * 6) * 60000;
      Q.filter((r) => (r.proto === n || r.proto === "all") && /^(task|rating5|ease7|choice|yesno)$/.test(r.type)).forEach((r) => {
        let v;
        if (r.type === "rating5") v = String(Math.max(1, Math.min(5, Math.round(1 + qual * 4 + (rnd() - 0.5) * 1.6))));
        else if (r.type === "ease7") v = String(Math.max(1, Math.min(7, Math.round(1 + qual * 6 + (rnd() - 0.5) * 2.2))));
        else if (r.type === "task") v = wpick(["Yes, easily", "Yes, with some help", "No, I couldn't"], [qual, 0.5 - qual * 0.3, 0.12]);
        else if (r.type === "yesno") v = rnd() < 0.3 ? "Yes" : "No";
        else { const o = r.options.split("|").map((x) => x.trim()); v = wpick(o, wts(r.id, o.length)); }
        add(sid, pid, proto, r.id, r.question, r.type, v, t);
      });
      if (rnd() < 0.45) add(sid, pid, proto, n + "-feedback", "Anything else?", "text", FB[Math.floor(rnd() * FB.length)], t);
      if (rnd() < 0.6) { const scr = SCR[n][Math.floor(rnd() * 2)], tp = t - 120000; add(sid, pid, `${proto} · ${scr}`, "pb-1", "How's it going so far?", "probe", wpick(["All good", "A bit unsure", "I'm stuck"], [qual, 0.35, 0.1]), tp); if (rnd() < 0.5) add(sid, pid, `${proto} · ${scr}`, "pb-2", "What do you think is happening on this screen?", "probe", PROBE[Math.floor(rnd() * PROBE.length)], tp + 8000); }
    }
  }
  return out;
};
window.RSampleSignups = function () {
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const byDay = Array.from({ length: 28 }, (_, i) => Math.round(1 + rnd() * 4 + i * 0.25)), count = byDay.reduce((a, b) => a + b, 0) + 37;
  return { count, byDay, byStage: { considering: Math.round(count * 0.31), separated: Math.round(count * 0.29), agreed: Math.round(count * 0.12), professional: Math.round(count * 0.06), "": count - Math.round(count * 0.31) - Math.round(count * 0.29) - Math.round(count * 0.12) - Math.round(count * 0.06) } };
};
