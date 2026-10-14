/* Decouple MVP toolkit · shared store and registry for MVP 01–07, numbered in journey order.
   decouple.kit.v1 holds what the tools share: the stage and children from the guide, each tool's status, the visitor's price level,
   paid packs, fake-door answers and a local log of events. Each MVP page also keeps its own key (decouple.mvpNN.v1). */
(function migrate() {
  /* Oct 2026 renumbering: the statement moved from mvp01 to mvp05, the toolkit from mvp02 to mvp01. Move, never drop. */
  try {
    const g = (k) => localStorage.getItem(k), mv = (from, to, test) => { const v = g(from); if (!v) return; let o; try { o = JSON.parse(v); } catch (e) { return; } if (!o || !test(o)) return; if (!g(to)) localStorage.setItem(to, v); localStorage.removeItem(from); };
    mv("decouple.mvp01.v1", "decouple.mvp05.v1", (o) => Array.isArray(o.items));
    mv("decouple.mvp02.v1", "decouple.mvp01.v1", (o) => ["land", "guide", "save", "home"].includes(o.phase));
  } catch (e) {}
})();

window.KIT = (function () {
  const KEY = "decouple.kit.v1";
  const rd = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const subs = new Set();
  const wr = (p) => { const n = { ...rd(), ...p }; localStorage.setItem(KEY, JSON.stringify(n)); subs.forEach((f) => f(n)); return n; };
  const HOME = "MVP 01 · Toolkit.html";

  /* tools, in the order of the process */
  const TOOLS = [
    { id: "fit", stage: "mvp02", n: "MVP 02", step: 1, stepT: "Before you begin", t: "Is doing it ourselves right for us?", short: "Right for us?", ic: "Shield", time: "5 min", file: "MVP 02 · Right for Us.html",
      d: "Honest questions about safety, control, complexity and how you talk. It tells you when to get advice first.", c: "#166534", soft: "#ECFDF5" },
    { id: "todo", stage: "mvp03", n: "MVP 03", step: 2, stepT: "Get organised", t: "To-do list & journal", short: "To-do & journal", ic: "List", time: "Ongoing", file: "MVP 03 · To-do & Journal.html",
      d: "This week’s list, made from your guide. A private journal for dates, feelings and anything you may need later.", c: "#A16207", soft: "#FFFBEB" },
    { id: "kids", stage: "mvp04", n: "MVP 04", step: 3, stepT: "The children", t: "Parenting plan", short: "Parenting plan", ic: "Kid", time: "25 min", file: "MVP 04 · Parenting Plan.html",
      d: "Where the children live, handovers, holidays and how you’ll decide things. A plan you can both sign up to.", c: "#9D174D", soft: "#FCE7F3", kidsOnly: true },
    { id: "statement", stage: "mvp05", n: "MVP 05", step: 4, stepT: "The money", t: "Your financial statement", short: "Financial statement", ic: "Bank", time: "45 min, in sittings", file: "MVP 05 · Financial Statement.html",
      d: "Every figure, with a date and a document. Ready for a mediator, a solicitor or the court.", c: "#4338CA", soft: "#EEF2FF", pack: "disclosure" },
    { id: "split", stage: "mvp06", n: "MVP 06", step: 5, stepT: "Agree what’s fair", t: "Split planner", short: "Split planner", ic: "Scale", time: "20 min", file: "MVP 06 · Split Planner.html",
      d: "Try splits of the home, pensions and savings, and see how a court would likely see each one.", c: "#0369A1", soft: "#E0F2FE", pack: "agreement" },
  ];
  const ASK = { id: "ask", stage: "mvp07", n: "MVP 07", t: "Ask", ic: "Chat", file: "MVP 07 · Ask.html", c: "#5B21B6", soft: "#F3EEFE",
    d: "A sounding board, any time. Answers from official sources, with links, and never legal advice.",
    modes: [["ask", "Ask anything"], ["meet", "Get ready for a meeting"], ["explain", "Explain this letter"], ["calm", "Say it calmly"], ["talk", "Talk it through"]] };

  /* finished documents: the only paid things. Prices are tested per visitor */
  const PACKS = {
    disclosure: { t: "Financial disclosure pack", from: "statement", prices: [29, 49, 79],
      d: "Everything a mediator, a solicitor or the court asks for, built from your statement and formatted to send.",
      items: [["Open financial statement", "Both sides in one schedule, with sources"], ["Form E draft", "Your figures placed in Form E’s sections"], ["D81 figures", "The tables a consent order needs"], ["Evidence checklist", "Every document, and what’s still missing"]] },
    agreement: { t: "Agreement pack", from: "split", prices: [79, 149, 249],
      d: "What you’ve agreed, written up properly: ready for a solicitor to check, or for you to send to the court.",
      items: [["Agreement in plain English", "What each of you gets, and when"], ["Draft consent order", "Your agreement in the court’s wording"], ["D81 statement", "The summary form that goes with it"], ["Next steps", "How to file it, and what it costs"]] },
  };

  /* fake doors: full-vision features shown where they'd live. Clicking is the first signal; the reveal asks two questions */
  const DOORS = {
    bank: { t: "Connect your bank", ic: "Bank", d: "Fill in your accounts, savings and debts straight from your bank. Read-only, and you choose which accounts.", cta: "Connect my bank",
      q2: "What would you need to trust it?", opts: ["Bank-level security, regulated by the FCA", "Read-only: nothing can move money", "Deleted once I’m done", "Decouple never sees my login", "I’d rather type it in myself"] },
    docs: { t: "We’ll collect your documents", ic: "Doc", d: "We ask your pension providers and lenders for valuations and statements, and chase them for you.", cta: "Collect them for me",
      q2: "Which documents are hardest to get?", opts: ["Pension valuations (CETV)", "Mortgage statements", "Payslips and P60", "Bank statements", "Business accounts", "None, they’re easy"] },
    coparent: { t: "Shared calendar & calm messages", ic: "Chat", d: "Share the plan with Mark. One calendar for handovers and holidays, and messages with a gentle tone check.", cta: "Set it up with Mark",
      q2: "What would worry you about it?", opts: ["Feeling monitored", "Mark wouldn’t use it", "Arguments moving into the app", "The children’s details being online", "Nothing"] },
    online: { t: "Agree it together online", ic: "Users", d: "Send this plan to Mark. He accepts or suggests changes, and you see each version side by side until you agree.", cta: "Send it to Mark",
      q2: "How would you most like to reach agreement?", opts: ["In an app like this", "With a mediator", "Talking it through ourselves", "Through solicitors"] },
    file: { t: "We file it with the court", ic: "Shield", d: "We check your consent order and D81, file them online for you, and track it until a judge approves it.", cta: "File it for us",
      q2: "Who would you want to file it?", opts: ["Me, myself", "Decouple, for a fee", "A solicitor", "Not sure yet"] },
  };

  /* the guide's stages (Marketing 02), with where each one starts in the toolkit */
  const STAGES = {
    considering: { t: "You’re weighing it up. There’s no rush.", start: "fit", why: "Before anything else, check whether doing it yourselves would be right for you." },
    decided: { t: "You’ve decided. The next job is the picture.", start: "fit", why: "A five-minute check first, then your list for this week." },
    apart: { t: "You’re living apart. Now it needs making official.", start: "statement", why: "Most people at your stage start on the money: what you both have, with the documents to show it." },
    filed: { t: "The divorce is under way. The money is a separate job.", start: "statement", why: "The court will want full financial disclosure before it approves any agreement." },
    agreed: { t: "You’ve agreed. Now make it stick.", start: "split", why: "Put what you’ve agreed into the planner, and check how a court would likely see it." },
  };
  const STAGE_L = { considering: "Thinking about separating", decided: "Decided, still living together", apart: "Living apart", filed: "Divorce under way", agreed: "Mostly agreed" };

  /* what the guide gave Sarah (Marketing 02 demo answers), in short */
  const PERSONA = { me: "Sarah", them: "Mark", email: "sarah.mitchell@example.com", kidsL: "Two children, 9 and 12", children: [["Ella", 12], ["Sam", 9]], home: "Owned together", status: "Married 14 years",
    week: [["Start a list of everything you own and owe", "Rough figures are fine. You’ll firm them up later."], ["Ask for your pension valuations", "Request a CETV from each provider. It’s usually free once a year."], ["Plan what you’ll tell the children", "Together, if you can."]],
    chapters: ["Where you are", "The financial picture", "Children", "The home", "What’s fair", "Reaching agreement", "Making it legal", "Looking after yourself"] };
  const kids = () => rd().kids !== false;
  const stage = () => rd().stage || "apart";

  function tier() { let s = rd(); if (s.tier == null) s = wr({ tier: Math.floor(Math.random() * 3) }); return s.tier; }
  const price = (pack) => PACKS[pack].prices[tier()];

  /* ── guest mode: nothing is kept until they sign up. Page state lives in memory (lost on leaving); signing up writes it out ── */
  const acct = () => !!rd().acct;
  const mem = {}, memTools = {}, bus = new Set();
  const emit = (e) => bus.forEach((f) => f(e));
  function save(key, obj) { if (acct()) localStorage.setItem(key, JSON.stringify(obj)); else mem[key] = obj; }
  function load(key) { if (!acct()) return mem[key] || null; try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  function drop(key) { delete mem[key]; if (acct()) localStorage.removeItem(key); }
  let dirty = false;
  /* call at the tool's first real progress: marks unsaved work and shows the save prompt once */
  function progress() { if (acct() || dirty) return; dirty = true; emit({ type: "nudge" }); log("save-nudge", "Save prompt shown", "save", "shown", { step: "Save · nudge" }); }
  /* actions that need an account (save, pay, invite, keep a result) */
  function needAcct(reason, then) { if (acct()) return then && then(); emit({ type: "signup", reason, then }); }
  function signup(reason) {
    const t = { ...(rd().tools || {}) }; Object.entries(memTools).forEach(([id, v]) => { if (!(t[id] === "done" && v === "started")) t[id] = v; });
    wr({ acct: true, tools: t }); Object.entries(mem).forEach(([key, v]) => localStorage.setItem(key, JSON.stringify(v))); dirty = false;
    log("signup", "Saved their toolkit", "save", reason || "save", { step: "Save · " + (reason || "save") });
  }
  const signOut = () => { wr({ acct: false }); Object.keys(mem).forEach((x) => delete mem[x]); dirty = false; };
  addEventListener("beforeunload", (e) => { if (dirty && !acct()) { e.preventDefault(); e.returnValue = ""; } });

  function status(id) {
    if (!acct()) return memTools[id] || "new";
    const s = rd().tools || {};
    if (id === "statement") { try { const m = JSON.parse(localStorage.getItem("decouple.mvp05.v1")); if (m && m.phase === "out") return "done"; if (m && !m.example && m.items && m.items.length) return "started"; } catch (e) {} }
    return s[id] || "new";
  }
  const setStatus = (id, v) => { const cur = status(id); if (cur === "done" && v === "started") return; if (!acct()) { memTools[id] = v; return; } wr({ tools: { ...(rd().tools || {}), [id]: v } }); };

  /* a one-stage Journey stub, so ut.js and proto-chrome.js work unchanged */
  function journey(id, n, name, sub, file, key) {
    const s = new Set(); let mem = {};
    return { STAGES: [{ id, n, name, sub, file, built: true }], KEY: key, get: () => mem, set: (k, p) => { mem = { ...mem, [k]: { ...(mem[k] || {}), ...p } }; },
      reset: () => { localStorage.removeItem(key); s.forEach((f) => f()); }, goStage: () => false, subscribe: (f) => (s.add(f), () => s.delete(f)), embedded: new URLSearchParams(location.search).has("embed") };
  }
  const here = () => (window.Journey && window.Journey.STAGES[0]) || { id: "mvp", n: "MVP", name: "" };
  /* open another MVP page; in testing mode, ask this page's questions first */
  function open(file, q) {
    const nav = () => { dirty = false; location.href = encodeURI(file) + (q ? "?" + new URLSearchParams(q) : ""); };
    const go = () => (window.UT && window.UT.on() ? window.UT.end(here().id, null, nav) : nav());
    if (dirty && !acct()) emit({ type: "leave", go }); else go();
  }
  const home = () => open(HOME, { home: 1 });
  const exit = () => location.replace("https://www.bbc.co.uk/weather");

  /* events: always kept on this device; sent only in testing mode (the participant has agreed), to this MVP's own test */
  function log(qid, q, type, a, extra) {
    const st = here(), at = new Date().toISOString(), ev = { at, stage: st.id, qid, q, type, a, ...(extra || {}) };
    wr({ events: [...(rd().events || []), ev].slice(-300) });
    const U = window.UT, D = window.DC;
    if (U && U.on() && D && D.send) { const u = U.get(); D.send({ sid: u.sid, pid: u.pid, test: `${st.n} · ${st.name}`, step: `${st.n} ${st.name} · ${(extra && extra.step) || type}`, price: extra && extra.price, rows: [{ qid, qv: 1, q, type, a: Array.isArray(a) ? a.join("; ") : String(a) }] }); }
  }

  tier();
  return { acct, save, load, drop, progress, needAcct, signup, signOut, on: (f) => (bus.add(f), () => bus.delete(f)), isDirty: () => dirty, SITE: "MVP 00 · Public Site.html", KEY, HOME, read: rd, write: wr, subscribe: (f) => (subs.add(f), () => subs.delete(f)), TOOLS, ASK, PACKS, DOORS, STAGES, STAGE_L, PERSONA, kids, stage, price, tier, status, setStatus, journey, open, home, exit, log };
})();
