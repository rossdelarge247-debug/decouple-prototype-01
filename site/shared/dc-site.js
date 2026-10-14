/* Decouple · site client. Shared by the guide, the holding page, the hubs, Results and testing mode.
   On decouple.uk it talks to /api (see docs/SITE-SPEC.md). In the design project there is no API: it falls back to the
   Google Form (answers) or does nothing (everything else), so pages keep working.
   Storage: decouple.outbox.v1 (batches waiting to be sent). Reads decouple.site.v1.testMode (Site settings preview) when off the site.
   Test mode: when the session says testing (owner with test mode on, or a test code), nothing is queued or sent. */
window.DC = (function () {
  const OUT = "decouple.outbox.v1", BLOCK = ["safe", "safe2", "name_me", "name_them"];
  const blocked = (qid) => { const k = String(qid || "").replace(/^m02\./, ""); return BLOCK.includes(k) || /email/i.test(k); };
  const j = async (url, opt, ms) => {
    const c = new AbortController(), t = setTimeout(() => c.abort(), ms || 9000);
    try { return await fetch(url, { credentials: "same-origin", cache: "no-store", ...opt, signal: c.signal, headers: { "Content-Type": "application/json" } }); }
    finally { clearTimeout(t); }
  };
  const api = async (path, body, method) => {
    try { const r = await j(path, { method: method || "POST", body: body ? JSON.stringify(body) : undefined }); let d = null; try { d = await r.json(); } catch (e) {} return { ok: r.ok, status: r.status, data: d }; }
    catch (e) { return { ok: false, status: 0, data: null }; }
  };

  /* session: null = not on the site (design project, file://, API missing) */
  let sp = null, last;
  function session(force) {
    if (sp && !force) return sp;
    sp = (async () => {
      if (!/^https?:$/.test(location.protocol)) return (last = null);
      try { const r = await j("/api/session", { method: "GET" }, 3500); if (!r.ok) return (last = null); const d = await r.json(); return (last = d && typeof d === "object" && "mode" in d ? d : null); } catch (e) { return (last = null); }
    })();
    return sp;
  }
  const localTest = () => { try { return !!(JSON.parse(localStorage.getItem("decouple.site.v1")) || {}).testMode; } catch (e) { return false; } };
  const testingNow = () => (last ? !!last.testing : localTest());
  const testing = () => session().then((x) => (x ? !!x.testing : localTest()));

  /* outbox: one batch per step, retried until the server confirms */
  const rd = () => { try { return JSON.parse(localStorage.getItem(OUT)) || []; } catch (e) { return []; } };
  const wr = (q) => { try { localStorage.setItem(OUT, JSON.stringify(q.slice(-200))); } catch (e) {} };
  let n = 0, busy = false, timer = null;
  function send(b) {
    const rows = (b.rows || []).filter((r) => r && r.qid && !blocked(r.qid) && r.a != null && r.a !== "").map((r) => ({ qid: r.qid, qv: r.qv || 1, q: String(r.q || "").slice(0, 300), type: r.type || "", a: String(r.a).slice(0, 2000) }));
    if (!rows.length || testingNow()) return false;
    const it = { batchKey: b.batchKey || `${b.sid}:${Date.now().toString(36)}:${(n++).toString(36)}`, sid: b.sid, pid: b.pid || "", test: b.test, step: b.step, price: b.price || "", landing: b.landing || "", device: `${innerWidth}×${innerHeight}`, hp: b.hp || "", at: new Date().toISOString(), rows, tries: 0 };
    wr([...rd(), it]); flush(); return true;
  }
  const protoOf = (x) => x.test === "M02 Guide" ? `M02 Guide · ${x.step} · ${x.price} · L-${x.landing || "a"}` : x.test === "Prototype testing" ? x.step : `${x.test} · ${x.step}`;
  function formMap() {
    const u = (window.UT && window.UT.formMap && window.UT.formMap()) || null; if (u) return u;
    const p = (window.UT_DEFAULTS || {}).FORM_PREFILL; if (!p) return null;
    try { const x = new URL(p), m = {}; x.searchParams.forEach((v, k) => { if (k.startsWith("entry.")) m[v.trim().toUpperCase()] = k; }); return { action: x.origin + x.pathname.replace(/\/(viewform|formResponse).*$/, "/formResponse"), m }; } catch (e) { return null; }
  }
  async function viaForm(x) {
    const F = formMap(); if (!F) return "drop";
    try {
      for (const r of x.rows) {
        const v = { SID: x.sid, PID: x.pid || "anon", PROTO: protoOf(x), QID: r.qid, QUESTION: r.q, TYPE: r.type, ANSWER: r.a, TIME: x.at, DEVICE: x.device }, b = new URLSearchParams();
        Object.entries(F.m).forEach(([ph, k]) => { if (ph in v) b.append(k, v[ph]); });
        await fetch(F.action, { method: "POST", mode: "no-cors", body: b });
      }
      return true;
    } catch (e) { return false; }
  }
  async function viaApi(x) {
    const { tries, at, ...body } = x, r = await api("/api/answers", body);
    if (r.ok) return true; if (r.status === 400 || r.status === 413) return "drop"; return false;
  }
  async function flush() {
    if (busy) return; busy = true;
    try {
      const s = await session(), now = Date.now();
      if (s ? s.testing : localTest()) { wr([]); return; }
      let q = rd().filter((x) => now - Date.parse(x.at) < 7 * 864e5); wr(q);
      for (const x of q) {
        if (x.next && x.next > Date.now()) continue;
        const res = s ? await viaApi(x) : await viaForm(x), cur = rd(), i = cur.findIndex((y) => y.batchKey === x.batchKey);
        if (i < 0) continue;
        if (res === true || res === "drop") cur.splice(i, 1); else { cur[i].tries = (cur[i].tries || 0) + 1; cur[i].next = Date.now() + Math.min(300000, 2000 * Math.pow(2, cur[i].tries)); }
        wr(cur); if (res === false) break;
      }
    } finally { busy = false; }
    const left = rd(); clearTimeout(timer);
    if (left.length) timer = setTimeout(flush, Math.max(2000, Math.min(...left.map((x) => (x.next || 0) - Date.now()))));
  }
  addEventListener("online", () => flush());
  if (rd().length) setTimeout(flush, 1500);

  /* Turnstile: proves a visitor is human when there's no tester or owner session */
  let tsP = null;
  const loadTs = () => tsP || (tsP = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s); }));
  async function human(host) {
    const s = await session(); if (!s) return true;
    if (s.owner || s.tester || s.human) return true;
    if (!s.turnstileSiteKey) return false;
    try { await loadTs(); } catch (e) { return false; }
    return new Promise((res) => {
      const el = document.createElement("div"); el.className = "dc-ts"; (host || document.body).appendChild(el);
      const done = (v) => { try { el.remove(); } catch (e) {} res(v); };
      window.turnstile.render(el, { sitekey: s.turnstileSiteKey, appearance: "interaction-only", callback: async (token) => { const r = await api("/api/human", { token }); if (r.ok) session(true); done(r.ok); }, "error-callback": () => done(false), "timeout-callback": () => done(false) });
    });
  }

  /* discreet way in: three clicks on an element within a second and a half */
  function secret(el) {
    if (!el) return; let n = 0, t = 0;
    el.addEventListener("click", () => { const now = Date.now(); n = now - t < 600 ? n + 1 : 1; t = now; if (n >= 3) { n = 0; session().then((x) => { location.href = x ? (x.owner ? "/hub" : "/studio") : "Decouple · Site Settings.html"; }); } });
  }

  /* AI: on the site, the pages' window.claude.complete goes to /api/claude (spec §7). In the design tool window.claude already exists. */
  if (!window.claude && /(^|\.)decouple\.uk$|\.vercel\.app$/.test(location.hostname)) window.claude = { complete: async (o) => {
    const b = typeof o === "string" ? { messages: [{ role: "user", content: o }] } : o || {};
    const r = await api("/api/claude", { system: String(b.system || ""), messages: (b.messages || []).slice(-20), max_tokens: Math.min(+b.max_tokens || 700, 1200) });
    if (!r.ok || !r.data) throw new Error(r.status === 401 || r.status === 404 || r.status === 503 ? "offline" : "ai");
    return r.data.text;
  } };

  return {
    session, onSite: () => session().then((s) => !!s), blocked, send, flush, pending: () => rd().length, human, testing, secret,
    redeem: async (code) => { const r = await api("/api/tester", { code: String(code || "").trim() }); if (r.ok) session(true); return r; },
    signup: async (b) => ((await testing()) ? { ok: true, status: 200, data: { test: true } } : api("/api/signup", b)),
    email: (b) => api("/api/email", b),
    participant: async (b) => ((await testing()) ? { ok: true, status: 200, data: { test: true } } : api("/api/participant", b)),
    results: (q) => api("/api/results?" + new URLSearchParams(q || {}), null, "GET"),
    logout: async () => { await api("/api/logout", {}); session(true); },
    admin: { get: () => api("/api/admin/site", null, "GET"), set: (p) => api("/api/admin/site", p), publish: () => api("/api/admin/publish", {}), codes: (op) => (op ? api("/api/admin/codes", op) : api("/api/admin/codes", null, "GET")) },
    rid: () => Math.random().toString(36).slice(2, 10),
  };
})();
