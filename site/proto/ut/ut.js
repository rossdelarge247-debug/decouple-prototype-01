/* Decouple — user testing mode. Plain JS, loaded on every prototype after journey-store.js (and on the hub).
   On: ?test=1 (or the hub toggle). Off: ?test=0. Participant links can carry ?cfg= (sheet + form URLs).
   When on, moving forward to a later prototype opens the end-of-prototype modal first.
   Answers are always kept locally (exportable from the hub) and posted to a Google Form if one is set up.
   Storage: decouple.ut.v1 only — never touches the journey key. */
window.UT = (function () {
  if (!window.DC && !document.querySelector('script[src*="shared/dc-site.js"]')) { const sc = document.createElement("script"); sc.src = "shared/dc-site.js"; document.head.appendChild(sc); }
  const KEY = "decouple.ut.v1", J = window.Journey, D = window.UT_DEFAULTS || { CSV: "" };
  const STAGES = J ? J.STAGES : [["discover","01","Discover"],["interview","02","Interview"],["playback","03","Playback"],["signup","04","Sign-up"],["onboard","05","Onboard"],["prepare","06","Prepare"],["reconcile","07","Household"],["settle","08","Settle"],["finalise","09","Finalise"],["dashboard","10","Dashboard"]].map(([id, n, name]) => ({ id, n, name }));
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  let S = read();
  const save = (p) => { S = { ...read(), ...p }; localStorage.setItem(KEY, JSON.stringify(S)); emit(); };
  const subs = new Set(), emit = () => subs.forEach((f) => f(S));
  const qp = new URLSearchParams(location.search);
  if (qp.get("test") === "1") { const p = { on: true }; if (qp.get("cfg")) { try { const c = JSON.parse(decodeURIComponent(escape(atob(qp.get("cfg"))))); if (c.sheet) p.sheet = c.sheet; if (c.form) p.form = c.form; } catch (e) {} } if (qp.get("pid")) p.pid = qp.get("pid"); S = { ...S, ...p }; localStorage.setItem(KEY, JSON.stringify(S)); }
  if (qp.get("test") === "0") { S = { ...S, on: false }; localStorage.setItem(KEY, JSON.stringify(S)); }
  const sheetUrl = () => S.sheet || D.SHEET_CSV || "", formUrl = () => S.form || D.FORM_PREFILL || "";
  const stageOf = (k) => STAGES.find((s) => s.id === k || s.n === String(k).padStart(2, "0"));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- question table ---------- */
  function parseCSV(t) {
    const rows = []; let r = [], f = "", q = false;
    for (let i = 0; i < t.length; i++) { const c = t[i];
      if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
      else if (c === '"') q = true; else if (c === ",") { r.push(f); f = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; r.push(f); rows.push(r); r = []; f = ""; } else f += c; }
    if (f || r.length) { r.push(f); rows.push(r); }
    const h = (rows.shift() || []).map((x) => x.trim().toLowerCase());
    return rows.filter((x) => x.some((v) => v.trim())).map((x) => Object.fromEntries(h.map((k, i) => [k, (x[i] || "").trim()])));
  }
  let table = null, tableSrc = "default";
  async function load() {
    const u = sheetUrl();
    if (u) { try { const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 5000); const r = await fetch(u, { signal: ctl.signal, cache: "no-store" }); clearTimeout(to); if (!r.ok) throw 0; const t = await r.text(); const rows = parseCSV(t); if (!rows.length || !("question" in rows[0])) throw 0; localStorage.setItem(KEY + ".cache", t); table = rows; tableSrc = "sheet"; return table; } catch (e) { const c = localStorage.getItem(KEY + ".cache"); if (c) { table = parseCSV(c); tableSrc = "cache"; return table; } } }
    table = parseCSV(D.CSV); tableSrc = "default"; return table;
  }
  const yes = (v) => !v || /^(y|yes|true|1)$/i.test(v);
  const rowsFor = (st) => (table || []).filter((r) => yes(r.active) && (r.proto === "all" || r.proto === st.id || r.proto.padStart(2, "0") === st.n)).sort((a, b) => (+a.order || 0) - (+b.order || 0));
  const SPECIAL = ["recap", "intro", "probe"];
  const pick = (st, type) => { const a = rowsFor(st).filter((r) => r.type === type); if (a.length) return a; const t0 = table; table = parseCSV(D.CSV); const b = rowsFor(st).filter((r) => r.type === type); table = t0; return b; };
  const screen = () => { const el = document.querySelector("[data-screen-label]"); return (el && el.getAttribute("data-screen-label")) || location.hash.slice(1) || "start"; };

  /* ---------- carried data ---------- */
  function carry(id) {
    const s = (J && J.get()) || {}, a = (s.interview || {}).answers || {}, out = [];
    const add = (k, v) => v != null && v !== "" && v !== false && out.push([k, v === true ? "Yes" : v]);
    const tier = { picture: "Your picture · £99", guided: "Guided settlement · £499", complete: "Complete & filed · £999" };
    const nm = window.PB && window.PB.names ? window.PB.names(a) : null;
    if (id === "discover") { add("Where you are", (s.router || {}).stageLabel); add("Relationship", (s.router || {}).statusLabel); add("Plan looked at", tier[(s.discover || {}).tier]); }
    if (id === "interview" || id === "playback") { const IV = window.IV, lb = (q, v) => { if (!IV || v == null) return null; const Q = IV.Q.find((x) => x.id === q), o = Q && (Q.opts || []).find((x) => x[0] === v); return o ? o[1] : null; };
      if (nm && nm.hasMe) add("Names", `${nm.Me} & ${nm.Them}`); add("Where you are", lb("stage", a.stage)); add("Legal status", lb("status", a.status)); add("Children", lb("kids", a.kids)); add("Home", lb("home", a.home));
      if (id === "playback") { const pid = ((s.playback || {}).parenting || {}).id, pt = window.PB && pid && (window.PB.PATTERNS || []).find((p) => p.id === pid); add("Parenting pattern", pt ? pt.name : null); } }
    if (id === "signup") { const su = s.signup || {}; add("Plan", tier[su.tier]); add("Paying", su.payMode === "split" ? "Split with partner" : su.payMode ? "In full" : null); add("Partner invited", su.invited); }
    if (id === "onboard") { const o = s.onboard || {}; add("Banks connected", (o.banks || []).length || null); add("Tour done", o.tourDone); }
    if (id === "prepare") { const p = (s.prepare || {}).ss || {}, SH = { private: "Private, not shared yet", shared: "Shared with your partner", both: "Both pictures shared" }, MK = { invited: "Invited", joined: "Joined" }; add("Your picture", SH[p.share]); add("Your partner", MK[p.mark]); }
    if (id === "reconcile") { const h = s.household || {}; add("Plan", tier[h.plan]); add("Household picture", h.locked ? "Agreed & signed (v1)" : "In progress"); }
    if (id === "settle") { const t = s.settle || {}; add("Versions exchanged", (t.rounds || []).length || null); add("Agreement", t.locked ? "Signed by both" : t.agreed ? "Agreed, not signed" : "Not yet"); }
    if (id === "finalise") { const f = s.finalise || {}; add("Court documents", f.gen ? "Generated" : "Not yet"); add("Details confirmed", f.detDone); }
    if (!out.length) out.push(["Scenario", "Sarah & Mark, example data"]);
    return out;
  }

  /* ---------- submit ---------- */
  function formMap() {
    const u = formUrl(); if (!u) return null;
    try { const x = new URL(u), m = {}; x.searchParams.forEach((v, k) => { if (k.startsWith("entry.")) m[v.trim().toUpperCase()] = k; }); return { action: x.origin + x.pathname.replace(/\/(viewform|formResponse).*$/, "/formResponse"), m }; } catch (e) { return null; }
  }
  async function post(row) {
    const F = formMap(); if (!F) return false;
    const vals = { SID: row.sid, PID: row.pid, PROTO: row.proto, QID: row.qid, QUESTION: row.question, TYPE: row.type, ANSWER: row.answer, TIME: row.at, DEVICE: row.device };
    const b = new URLSearchParams(); Object.entries(F.m).forEach(([ph, k]) => { if (ph in vals) b.append(k, vals[ph]); });
    try { await fetch(F.action, { method: "POST", mode: "no-cors", body: b }); return true; } catch (e) { return false; }
  }
  async function submit(st, answers, probe) {
    const at = new Date().toISOString(), device = `${innerWidth}×${innerHeight} · ${navigator.userAgent.match(/(Firefox|Edg|Chrome|Safari)\/[\d.]+/)?.[0] || "browser"}`;
    const rows = answers.map((x) => ({ sid: S.sid, pid: S.pid, proto: `${st.n} ${st.name}${probe ? " · " + probe : ""}`, qid: x.id, question: x.q, type: x.type, answer: x.a, at, device }));
    save(probe ? { local: [...(read().local || []), ...rows] } : { local: [...(read().local || []), ...rows], done: { ...(read().done || {}), [st.id]: at } });
    if (window.DC && rows.length) { window.DC.send({ sid: S.sid, pid: S.pid, test: "Prototype testing", step: rows[0].proto, rows: rows.map((r) => ({ qid: r.qid, qv: 1, q: r.question, type: r.type, a: r.answer })) }); return true; }
    const ok = await Promise.all(rows.map(post)); return ok.every(Boolean) && rows.length > 0;
  }

  /* ---------- UI ---------- */
  const STY = `.ut-scrim{position:fixed;inset:0;z-index:100000;background:rgba(23,20,31,.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow:auto;font-family:Inter,-apple-system,sans-serif;color:#17141F;animation:utIn .25s ease}
@keyframes utIn{from{opacity:0}}.ut-box{width:100%;max-width:640px;background:#FFF;border-radius:22px;box-shadow:0 40px 100px -20px rgba(20,10,40,.5);overflow:hidden;animation:utUp .35s cubic-bezier(.2,.7,.2,1)}@keyframes utUp{from{transform:translateY(16px);opacity:0}}
.ut-hd{position:relative;padding:28px 32px 24px;background:#17141F;color:#FFF;overflow:hidden}.ut-hd:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 70% 90% at 100% 0%,rgba(124,58,237,.45),transparent 60%)}.ut-hd>*{position:relative}
.ut-k{font:600 10.5px Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#C4B5FD;display:flex;align-items:center;gap:8px}.ut-k i{width:6px;height:6px;border-radius:9px;background:#34D399;box-shadow:0 0 0 3px rgba(52,211,153,.25)}
.ut-hd h2{margin:10px 0 0;font:400 32px/1.1 'Source Serif Pro',Georgia,serif;letter-spacing:-.015em}.ut-hd h2 em{color:#C4B5FD}.ut-hd p{margin:8px 0 0;font-size:14px;line-height:1.5;color:rgba(255,255,255,.7)}
.ut-prog{display:flex;gap:4px;margin-top:18px}.ut-prog span{flex:1;height:3px;border-radius:3px;background:rgba(255,255,255,.18)}.ut-prog span.d{background:#A78BFA}.ut-prog span.c{background:#FFF}
.ut-bd{padding:24px 32px 8px;display:grid;gap:22px}.ut-l{font:600 10.5px Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#78716C;margin-bottom:10px}
.ut-rc{margin:0;padding:0;list-style:none;display:grid;gap:8px}.ut-rc li{display:grid;grid-template-columns:18px minmax(0,1fr);gap:10px;font-size:14px;line-height:1.45}.ut-rc li:before{content:"";width:18px;height:18px;border-radius:99px;background:#ECFDF5 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'%3E%3Cpath d='M5 9.2l2.6 2.6L13 6.4' fill='none' stroke='%23047857' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center no-repeat}
.ut-cy{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px}.ut-cy div{padding:10px 12px;border-radius:12px;background:#F3EEFE}.ut-cy small{display:block;font-size:11px;color:#6D28D9;font-weight:600}.ut-cy b{display:block;margin-top:2px;font-size:13.5px;font-weight:600;color:#2E1065;text-transform:none}
.ut-to{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#57534E}.ut-to b{color:#17141F}
.ut-q{display:grid;gap:10px;padding-top:18px;border-top:1px solid #EEEAE4}.ut-q:first-of-type{border-top:0;padding-top:0}.ut-qt{font-size:15px;font-weight:600;line-height:1.4}.ut-qt sup{color:#B91C1C;font-size:12px;margin-left:2px}
.ut-sc{display:flex;gap:6px}.ut-sc button{all:unset;cursor:pointer;flex:1;min-width:0;height:44px;border-radius:11px;border:1.5px solid #E7E3DC;display:grid;place-items:center;font:600 14px Inter,sans-serif;color:#44403C;transition:.12s}.ut-sc button:hover{border-color:#A78BFA}.ut-sc button.on{background:#5B21B6;border-color:#5B21B6;color:#FFF}
.ut-ends{display:flex;justify-content:space-between;font-size:11.5px;color:#78716C}
.ut-ch{display:flex;flex-wrap:wrap;gap:6px}.ut-ch button{all:unset;cursor:pointer;min-height:40px;padding:0 16px;border-radius:999px;border:1.5px solid #E7E3DC;display:inline-flex;align-items:center;gap:7px;font:500 13.5px Inter,sans-serif;color:#292524;transition:.12s;box-sizing:border-box}.ut-ch button:hover{border-color:#A78BFA}.ut-ch button.on{background:#F3EEFE;border-color:#5B21B6;color:#3B0764;font-weight:600}
.ut-ta{width:100%;box-sizing:border-box;min-height:84px;padding:12px 14px;border:1.5px solid #E7E3DC;border-radius:12px;font:14px/1.5 Inter,sans-serif;resize:vertical;outline:0}.ut-ta:focus,.ut-in:focus{border-color:#5B21B6}
.ut-in{width:100%;box-sizing:border-box;height:48px;padding:0 14px;border:1.5px solid #E7E3DC;border-radius:12px;font:15px Inter,sans-serif;outline:0}
.ut-ft{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:20px 32px 26px}.ut-ft small{font-size:12px;color:#B91C1C}
.ut-btn{all:unset;cursor:pointer;box-sizing:border-box;display:inline-flex;align-items:center;gap:9px;height:48px;padding:0 22px;border-radius:999px;background:#17141F;color:#FFF;font:600 14px Inter,sans-serif;transition:.15s}.ut-btn:hover{background:#000;transform:translateY(-1px)}.ut-btn[disabled]{opacity:.4;pointer-events:none}
.ut-lnk{all:unset;cursor:pointer;font-size:13px;color:#57534E;text-decoration:underline;text-underline-offset:3px}.ut-lnk:hover{color:#5B21B6}
.ut-badge{position:fixed;left:16px;bottom:72px;z-index:99990;display:grid;gap:8px;justify-items:start;font:500 12px Inter,sans-serif;color:#FFF}.ut-pill{display:flex;align-items:center;gap:2px;padding:4px;border-radius:999px;background:#17141F;box-shadow:0 10px 30px -8px rgba(0,0,0,.4)}
.ut-pill .t{display:flex;align-items:center;gap:7px;padding:0 10px 0 8px}.ut-pill .t i{width:7px;height:7px;border-radius:9px;background:#34D399}.ut-pill .t b{font-weight:600;color:#C4B5FD}
.ut-pill button{all:unset;cursor:pointer;padding:7px 12px;border-radius:999px;background:#FFF;color:#17141F;font-weight:600}.ut-pill button:hover{background:#F3EEFE}
.ut-pr{width:min(340px,calc(100vw - 32px));box-sizing:border-box;padding:16px 16px 14px;border-radius:18px;background:#17141F;color:#FFF;box-shadow:0 24px 60px -16px rgba(0,0,0,.5);position:relative;overflow:hidden;transform-origin:bottom left;animation:utGrow .4s cubic-bezier(.2,.8,.2,1)}
.ut-pr:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 80% 80% at 100% 0%,rgba(124,58,237,.4),transparent 60%);pointer-events:none}.ut-pr>*{position:relative}
@keyframes utGrow{from{opacity:0;transform:scale(.6) translateY(20px)}}
.ut-pr .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;font:600 10px Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#C4B5FD}.ut-pr .hd button{all:unset;cursor:pointer;width:24px;height:24px;border-radius:99px;display:grid;place-items:center;color:rgba(255,255,255,.6);font-size:16px}.ut-pr .hd button:hover{background:rgba(255,255,255,.1);color:#FFF}
.ut-pr .q{margin:8px 0 12px;font:400 19px/1.3 'Source Serif Pro',Georgia,serif}
.ut-pr .ch{display:flex;flex-wrap:wrap;gap:6px}.ut-pr .ch button{all:unset;cursor:pointer;padding:8px 13px;border-radius:999px;background:rgba(255,255,255,.1);font-size:13px;font-weight:500}.ut-pr .ch button:hover{background:rgba(255,255,255,.2)}
.ut-pr textarea{width:100%;box-sizing:border-box;min-height:70px;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#FFF;font:13.5px/1.45 Inter,sans-serif;resize:none;outline:0}.ut-pr textarea:focus{border-color:#A78BFA}
.ut-pr .ac{display:flex;justify-content:space-between;align-items:center;margin-top:10px}.ut-pr .ac .sk{all:unset;cursor:pointer;font-size:12px;color:rgba(255,255,255,.6)}.ut-pr .ac .sk:hover{color:#FFF}.ut-pr .ac .go{all:unset;cursor:pointer;padding:8px 14px;border-radius:999px;background:#FFF;color:#17141F;font-size:12.5px;font-weight:600}.ut-pr .ac .go[disabled]{opacity:.4;pointer-events:none}
.ut-pr .dots{display:flex;gap:4px}.ut-pr .dots i{width:5px;height:5px;border-radius:9px;background:rgba(255,255,255,.25)}.ut-pr .dots i.on{background:#FFF}
.ut-pr .ty{margin:6px 0 2px;font-size:13.5px;color:rgba(255,255,255,.8)}
.ut-nx{padding:40px 36px 34px;display:grid;gap:14px}.ut-nx .n{font:400 64px/1 'Source Serif Pro',Georgia,serif;color:#A78BFA;letter-spacing:-.03em}.ut-nx h2{margin:0;font:400 40px/1.05 'Source Serif Pro',Georgia,serif;letter-spacing:-.02em;color:#FFF}.ut-nx p{margin:0;font-size:16px;line-height:1.55;color:rgba(255,255,255,.78);max-width:46ch}
.ut-nx .meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}.ut-nx .meta span{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:999px;background:rgba(255,255,255,.1);font-size:12.5px;font-weight:500;color:#FFF}
.ut-nx .row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:14px;flex-wrap:wrap}.ut-nx .ut-btn{background:#FFF;color:#17141F}.ut-nx .ut-btn:hover{background:#F3EEFE}.ut-nx .ut-prog{margin-top:0}
.ut-box.dk{background:#17141F;position:relative}.ut-box.dk:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse 70% 80% at 100% 0%,rgba(124,58,237,.45),transparent 60%),radial-gradient(ellipse 50% 60% at 0% 100%,rgba(157,23,77,.25),transparent 60%);pointer-events:none}.ut-box.dk>*{position:relative}
.ut-ok{display:grid;place-items:center;text-align:center;gap:6px;padding:40px 32px}.ut-ok .c{width:56px;height:56px;border-radius:18px;background:#D1FAE5;display:grid;place-items:center;margin-bottom:8px}.ut-ok h3{margin:0;font:400 28px 'Source Serif Pro',Georgia,serif}.ut-ok p{margin:0;font-size:14px;color:#57534E;max-width:42ch;line-height:1.5}
@media (max-width:560px){.ut-hd,.ut-bd,.ut-ft{padding-left:20px;padding-right:20px}.ut-hd h2{font-size:26px}.ut-sc{gap:4px}}`;
  function css() { if (document.getElementById("ut-css")) return; const s = document.createElement("style"); s.id = "ut-css"; s.textContent = STY; document.head.appendChild(s); }
  const arrow = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>`;
  function scrim(html) { css(); const w = document.createElement("div"); w.className = "ut-scrim"; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true"); w.innerHTML = `<div class="ut-box">${html}</div>`; document.body.appendChild(w); return w; }

  function start(then) {
    const w = scrim(`<div class="ut-hd"><div class="ut-k"><i></i>User testing session</div><h2>Before you <em>begin.</em></h2><p>You'll walk through Decouple as Sarah, using example data. At the end of each part we'll ask a few quick questions. There are no wrong answers: we're testing the product, not you.</p></div>
      <div class="ut-bd"><div><div class="ut-l">Participant ID or first name</div><input class="ut-in" id="ut-pid" autocomplete="off" placeholder="e.g. P07" value="${esc(S.pid || "")}"/></div><p style="margin:0;font-size:12.5px;line-height:1.5;color:#78716C">By starting, you agree that your answers and comments are saved with this ID to help us improve Decouple. <a href="privacy.html" target="_blank" rel="noopener" style="color:#5B21B6">Privacy notice</a></p></div>
      <div class="ut-ft"><button class="ut-lnk" data-x>Not now</button><button class="ut-btn" data-go disabled>Start session${arrow}</button></div>`);
    const inp = w.querySelector("#ut-pid"), go = w.querySelector("[data-go]");
    const chk = () => (go.disabled = !inp.value.trim()); inp.addEventListener("input", chk); chk(); setTimeout(() => inp.focus(), 50);
    inp.addEventListener("keydown", (e) => e.key === "Enter" && !go.disabled && go.click());
    go.onclick = () => { save({ pid: inp.value.trim(), sid: "S-" + Date.now().toString(36).toUpperCase(), started: new Date().toISOString(), done: {} }); w.remove(); badge(); const cs = stageOf(document.documentElement.dataset.stage); if (cs && !then) upNext(cs, null, true); else then && then(); };
    w.querySelector("[data-x]").onclick = () => w.remove();
  }

  async function upNext(st, go, here) {
    await load(); const it = pick(st, "intro")[0], ci = STAGES.indexOf(st); css();
    const w = document.createElement("div"); w.className = "ut-scrim"; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true");
    w.innerHTML = `<div class="ut-box dk"><div class="ut-nx"><div class="ut-k"><i></i>${here ? "Your first part" : "Up next"} · ${ci + 1} of ${STAGES.length}</div><div class="n">${st.n}</div><h2>${esc(st.name)}</h2>${it ? `<p>${esc(it.question)}</p>` : ""}<div class="meta">${it && it.options ? `<span>About ${esc(it.options)}</span>` : ""}<span>Think aloud as you go</span></div><div class="ut-prog">${STAGES.map((s, i) => `<span class="${i < ci ? "d" : i === ci ? "c" : ""}"></span>`).join("")}</div><div class="row"><span style="font-size:12.5px;color:rgba(255,255,255,.6)">Use “Finish this part”, bottom left, when you're done.</span><button class="ut-btn" data-go>${here ? "Begin" : `Start ${st.n} · ${esc(st.name)}`}${arrow}</button></div></div></div>`;
    document.body.appendChild(w); const b = w.querySelector("[data-go]"); setTimeout(() => b.focus(), 50);
    b.onclick = () => { if (go) { b.innerHTML = "Loading…"; go(); } else w.remove(); };
  }

  async function end(fromId, toId, go) {
    const st = stageOf(fromId), nx = toId ? stageOf(toId) : null; if (!st) return go && go();
    await load(); const rows = rowsFor(st), recap = rows.filter((r) => r.type === "recap"), qs = rows.filter((r) => !SPECIAL.includes(r.type)), ci = STAGES.indexOf(st);
    const ans = {};
    const ctl = (r) => { const t = r.type;
      if (t === "rating5" || t === "ease7") { const n = t === "rating5" ? 5 : 7, e = t === "rating5" ? ["Poor", "Excellent"] : ["Very difficult", "Very easy"]; return `<div class="ut-sc" role="radiogroup">${Array.from({ length: n }, (_, i) => `<button type="button" role="radio" aria-checked="false" data-v="${i + 1}">${i + 1}</button>`).join("")}</div><div class="ut-ends"><span>${e[0]}</span><span>${e[1]}</span></div>`; }
      const o = t === "yesno" ? ["Yes", "No"] : t === "task" ? ["Yes, easily", "Yes, with some help", "No, I couldn't"] : (r.options || "").split("|").map((x) => x.trim()).filter(Boolean);
      return `<div class="ut-ch" role="radiogroup">${o.map((x) => `<button type="button" role="radio" aria-checked="false" data-v="${esc(x)}">${esc(x)}</button>`).join("")}</div>`; };
    const w = scrim(`<div class="ut-hd"><div class="ut-k"><i></i>Prototype ${st.n} of ${STAGES.length} · complete</div><h2>That's the end of <em>${esc(st.name)}.</em></h2><p>${nx ? `A few quick questions, then on to ${nx.n} · ${esc(nx.name)}.` : "A few last questions to finish the session."}</p><div class="ut-prog">${STAGES.map((s, i) => `<span class="${i < ci ? "d" : i === ci ? "c" : ""}"></span>`).join("")}</div></div>
      <div class="ut-bd">
        ${recap.length ? `<div><div class="ut-l">What you just did</div><ul class="ut-rc">${recap.map((r) => `<li>${esc(r.question)}</li>`).join("")}</ul></div>` : ""}
        ${nx ? `<div><div class="ut-l">Carried into ${nx.n} · ${esc(nx.name)}</div><div class="ut-cy">${carry(st.id).map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join("")}</div></div>` : ""}
        ${qs.length ? `<div><div class="ut-l">Your feedback</div><div style="display:grid;gap:18px">${qs.map((r) => `<div class="ut-q" data-q="${esc(r.id)}"><div class="ut-qt">${esc(r.question)}${yes(r.required) && r.required ? "<sup>*</sup>" : ""}</div>${ctl(r)}</div>`).join("")}</div></div>` : ""}
        <div><div class="ut-l">Anything else? <span style="text-transform:none;letter-spacing:0;font-weight:500">(optional)</span></div><textarea class="ut-ta" id="ut-fb" placeholder="What felt confusing, reassuring or missing?"></textarea></div>
      </div>
      <div class="ut-ft"><button class="ut-lnk" data-skip>Skip questions</button><span style="display:flex;align-items:center;gap:12px"><small data-err></small><button class="ut-btn" data-go>${nx ? `Submit & continue to ${nx.n}` : "Submit & finish"}${arrow}</button></span></div>`);
    w.querySelectorAll(".ut-q").forEach((q) => q.addEventListener("click", (e) => { const b = e.target.closest("button[data-v]"); if (!b) return; q.querySelectorAll("button").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); }); ans[q.dataset.q] = b.dataset.v; }));
    const err = w.querySelector("[data-err]"), btn = w.querySelector("[data-go]");
    const finish = (sent) => { if (go) { w.remove(); nx ? upNext(nx, go) : go(); return; } w.querySelector(".ut-box").innerHTML = `<div class="ut-ok"><div class="c"><svg width="26" height="26" viewBox="0 0 18 18"><path d="M5 9.2l2.6 2.6L13 6.4" fill="none" stroke="#047857" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><h3>Thank you.</h3><p>That's the end of the session. ${sent ? "Your answers have been sent." : "Your answers are saved."} You can close this window.</p><div style="margin-top:14px"><button class="ut-btn" data-close>Close</button></div></div>`; w.querySelector("[data-close]").onclick = () => w.remove(); };
    btn.onclick = async () => {
      const miss = qs.filter((r) => r.required && yes(r.required) && !ans[r.id]);
      if (miss.length) { err.textContent = `Answer ${miss.length} more question${miss.length > 1 ? "s" : ""}`; const el = w.querySelector(`[data-q="${window.CSS && CSS.escape ? CSS.escape(miss[0].id) : miss[0].id}"]`); el && w.scrollTo({ top: el.offsetTop - 40, behavior: "smooth" }); return; }
      btn.disabled = true; btn.innerHTML = "Saving…";
      const list = qs.filter((r) => ans[r.id]).map((r) => ({ id: r.id, q: r.question, type: r.type, a: ans[r.id] })), fb = w.querySelector("#ut-fb").value.trim();
      if (fb) list.push({ id: st.n + "-feedback", q: "Anything else?", type: "text", a: fb });
      const sent = await submit(st, list); finish(sent);
    };
    w.querySelector("[data-skip]").onclick = () => { save({ done: { ...(read().done || {}), [st.id]: "skipped" } }); finish(false); };
  }

  function badge() {
    if (!J || J.embedded || !S.on || !S.pid || document.querySelector(".ut-badge")) return; css();
    const cur = stageOf(document.documentElement.dataset.stage); if (!cur) return;
    const b = document.createElement("div"); b.className = "ut-badge";
    b.innerHTML = `<div class="ut-pill"><span class="t"><i></i>Testing · <b>${esc(S.pid)}</b></span><button type="button" data-fin>${cur.id === "dashboard" ? "Finish session" : "Finish this part"}</button></div>`;
    b.querySelector("[data-fin]").onclick = () => { closeProbe(); const ci = STAGES.indexOf(cur), nx = STAGES[ci + 1]; nx ? J.goStage(nx.id) : end(cur.id, null, null); };
    document.body.appendChild(b); dwell(cur, b);
  }

  /* ---------- dwell check-ins ---------- */
  let probeEl = null; const closeProbe = () => { if (probeEl) { probeEl.remove(); probeEl = null; } };
  function dwell(cur, host) {
    const DW = +D.DWELL || 75, RP = +D.REPEAT || 150, MX = +D.MAX_PROBES || 2; let t = 0, next = DW, shown = 0;
    let last = Date.now(); ["pointerdown", "keydown", "scroll"].forEach((ev) => addEventListener(ev, () => (last = Date.now()), { passive: true }));
    const iv = setInterval(() => {
      if (document.hidden || probeEl || document.querySelector(".ut-scrim") || !read().on) return; t++;
      if (t >= next && shown < MX) { shown++; next = t + RP; show(cur, host, shown - 1, Date.now() - last > 20000); }
      if (shown >= MX) clearInterval(iv);
    }, 1000);
  }
  async function show(cur, host, k, idle) {
    await load(); const P = pick(cur, "probe"); if (!P.length) return;
    const first = P[0].options ? P[0] : null, rest = P.filter((r) => r !== first), seq = [first, rest.length ? rest[k % rest.length] : null].filter(Boolean);
    let i = 0; const scr = screen();
    const el = document.createElement("div"); el.className = "ut-pr"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Quick check-in"); probeEl = el; host.prepend(el);
    const send = (r, a) => submit(cur, [{ id: r.id, q: r.question, type: "probe", a }], scr);
    const render = () => { const r = seq[i];
      if (!r) { el.innerHTML = `<div class="hd"><span>Thank you</span></div><p class="ty">That helps. Carry on exploring.</p>`; setTimeout(closeProbe, 2200); return; }
      const opts = (r.options || "").split("|").map((x) => x.trim()).filter(Boolean);
      el.innerHTML = `<div class="hd"><span>${idle && i === 0 ? "Still with us?" : "Quick check-in"}</span><button type="button" aria-label="Close" data-x>×</button></div><div class="q">${esc(r.question)}</div>${opts.length ? `<div class="ch">${opts.map((o) => `<button type="button" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>` : `<textarea placeholder="Type, or just say it out loud"></textarea>`}<div class="ac"><span class="dots">${seq.map((_, j) => `<i class="${j === i ? "on" : ""}"></i>`).join("")}</span><span style="display:flex;gap:12px;align-items:center"><button type="button" class="sk" data-sk>Skip</button>${opts.length ? "" : `<button type="button" class="go" data-go disabled>Send</button>`}</span></div>`;
      el.querySelector("[data-x]").onclick = closeProbe; el.querySelector("[data-sk]").onclick = () => { i++; render(); };
      el.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { send(r, b.dataset.v); i++; render(); }));
      const ta = el.querySelector("textarea"), g = el.querySelector("[data-go]");
      if (ta) { setTimeout(() => ta.focus(), 60); ta.oninput = () => (g.disabled = !ta.value.trim()); g.onclick = () => { send(r, ta.value.trim()); i++; render(); }; ta.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey && ta.value.trim()) { e.preventDefault(); g.click(); } }; }
    };
    render();
  }

  /* ---------- wire up ---------- */
  if (J && !J.embedded) {
    const orig = J.goStage, cur = () => document.documentElement.dataset.stage;
    J.goStage = function (id, hash) {
      S = read(); if (!S.on) return orig(id, hash);
      const from = stageOf(cur()), to = stageOf(id); if (!from || !to) return orig(id, hash);
      const fi = STAGES.indexOf(from), ti = STAGES.indexOf(to), fwd = ti === fi + 1 || (ti > fi && to.id !== "dashboard");
      if (!fwd || (read().done || {})[from.id]) return orig(id, hash);
      if (!S.pid) { start(() => end(from.id, id, () => orig(id, hash))); return true; }
      end(from.id, id, () => orig(id, hash)); return true;
    };
    const boot = () => { if (S.on && !S.pid) start(); badge(); };
    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", boot) : setTimeout(boot, 0);
  }

  return {
    get: () => read(), on: () => !!read().on, set: save, subscribe: (f) => (subs.add(f), () => subs.delete(f)),
    setOn: (v) => save({ on: !!v }), load, parseCSV, defaults: D, source: () => tableSrc, formMap, end, start, upNext, probe: () => { const c = stageOf(document.documentElement.dataset.stage), h = document.querySelector(".ut-badge"); if (c && h && !probeEl) show(c, h, 0, false); },
    newSession: () => save({ pid: null, sid: null, done: {} }),
    participantLink: (base) => { const c = {}; if (sheetUrl()) c.sheet = sheetUrl(); if (formUrl()) c.form = formUrl(); const u = new URL(base || "Proto 01 · Discover.html", location.href); u.searchParams.set("test", "1"); if (Object.keys(c).length) u.searchParams.set("cfg", btoa(unescape(encodeURIComponent(JSON.stringify(c))))); return u.href; },
    exportCSV: () => { const rows = read().local || [], h = ["sid", "pid", "proto", "qid", "question", "type", "answer", "at", "device"], q = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`; return [h.join(","), ...rows.map((r) => h.map((k) => q(r[k])).join(","))].join("\n"); },
    clearLocal: () => save({ local: [] }),
  };
})();
