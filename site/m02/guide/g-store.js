/* M02 v2 · state, sending, and an in-memory Journey stub so the reused proto blocks never touch decouple.journey.v1 */
window.Journey = (function () {
  let mem = {};
  return { STAGES: [], KEY: "m02-mem", get: () => mem, set: (s, p) => { mem = { ...mem, [s]: { ...(mem[s] || {}), ...p } }; }, reset: () => { mem = {}; }, goStage: () => false, subscribe: () => () => {}, embedded: false };
})();
window.GS = (function () {
  const KEY = "decouple.m02.v2", qp = new URLSearchParams(location.search), DEMO = qp.get("demo") === "1";
  const HEALTH = ["cope", "support"];
  const rid = () => "m02-" + Math.random().toString(36).slice(2, 8);
  const b64 = { enc: (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), dec: (s) => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))))) };
  function load() {
    let s = {};
    if (!DEMO) { try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {} }
    if (!s.sid) s.sid = rid();
    const v = (qp.get("v") || "").toUpperCase(); if (v === "A" || v === "B") s.ver = v; if (!s.ver) s.ver = Math.random() < 0.5 ? "A" : "B";
    if (qp.get("pid")) s.pid = qp.get("pid");
    /* ?landing= applies to this visit only; otherwise Site settings decides. lvRand is kept so a rotated visitor keeps their design. */
    delete s.lvFixed; delete s.lvRotate;
    const L = (qp.get("landing") || "").toLowerCase(); if (/^[a-i]$/.test(L)) s.lvFixed = L; else if (L === "random") s.lvRotate = true;
    if (!s.lvRand) s.lvRand = "abcdefghi"[Math.floor(Math.random() * 9)];
    s.a = s.a || {}; s.x = s.x || {}; s.phase = s.phase || "landing"; s.ch = s.ch || 0; s.maxCh = s.maxCh || 0; s.held = s.held || [];
    if (["code", "consent"].includes(s.phase)) s.phase = "landing";
    /* a guide opened from its email link: #g=<answers> */
    if (/^#g=/.test(location.hash)) { try { s.a = b64.dec(location.hash.slice(3)); s.phase = "full"; s.fromLink = true; } catch (e) {} history.replaceState(null, "", location.pathname + location.search); }
    if (DEMO) { s.a = { ...window.PB.EXAMPLE, where_uk: "ew", kids_know: "partly", living: "together", next_home: "some", cope: "updown", support: ["friends", "family"], admin: ["accounts"], safe: "safe" }; s.phase = qp.get("phase") || "guide"; s.maxCh = 20; s.consent = "no"; }
    return s;
  }
  const save = (s) => { if (!DEMO) localStorage.setItem(KEY, JSON.stringify(s)); };
  const link = (s) => { const a = { ...s.a }; ["safe", "safe2", "name_me", "name_them"].forEach((k) => delete a[k]); return location.origin + (location.hostname.endsWith("decouple.uk") ? "/guide" : location.pathname) + "#g=" + b64.enc(a); };
  /* rows: [qid, question, type, answer]. Nothing leaves the device without consent. */
  const qv = (id) => { const G = window.G; if (!G) return 1; const q = [...G.Q, ...G.CH.flatMap((c) => c.qs || []), ...G.SERVICE_Q, ...G.LAST_Q].find((x) => x.id === id); return (q && q.v) || 1; };
  function batch(s, step, rows, lv) {
    return { sid: s.sid, pid: s.pid || "", test: "M02 Guide", step, price: s.ver, landing: lv || s.lv || "a", rows: rows.filter(([id]) => s.health || !HEALTH.includes(id)).map(([id, q, type, a]) => ({ qid: "m02." + id, qv: qv(id), q, type, a })) };
  }
  function post(s, step, rows, lv) {
    if (DEMO || !rows || !rows.length) return;
    if (s.consent !== "yes") return;
    window.DC.send(batch(s, step, rows, lv));
  }
  return { KEY, DEMO, qp, rid, load, save, post, link, HEALTH };
})();
