/* Decouple · Site settings. Owner only on decouple.uk (behind the login). In the design project it runs as a preview:
   switches and codes are kept in this browser (decouple.site.v1), and test mode is real for this browser. */
(function () {
  const KEY = "decouple.site.v1", $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const rd = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const wr = (p) => { const n = { ...rd(), ...p }; localStorage.setItem(KEY, JSON.stringify(n)); return n; };
  const WORDS = ["OAK", "ASH", "ELM", "FERN", "MOSS", "REED", "SAGE", "PINE", "BAY", "IVY", "LARK", "WREN", "DOVE", "HAWK", "OWL", "TERN", "BLUE", "GOLD", "JADE", "RUBY", "MINT", "PLUM", "TEAL", "SAND", "TIDE", "COVE", "DUNE", "HILL", "VALE", "BROOK", "STONE", "CLAY", "MAPLE", "BIRCH", "HAZEL", "CEDAR", "RIVER", "CLOUD", "FROST", "EMBER"];
  const rnd = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const mkCode = (taken) => { let c; do { c = WORDS[rnd(WORDS.length)] + "-" + WORDS[rnd(WORDS.length)] + "-" + String(10 + rnd(90)); } while (taken.has(c)); return c; };
  const fmt = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
  const ago = (d) => { if (!d) return "Never"; const m = (Date.now() - new Date(d)) / 60000; return m < 60 ? Math.max(1, Math.round(m)) + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " d ago"; };
  const expired = (c) => c.expires && new Date(c.expires + "T23:59:59") < new Date();

  let ON = false, st = { mode: "holding", requireCode: true, testMode: false, landing: "a" }, codes = [], filter = "active", fresh = [];
  const LANDS = [["a", "A · Chapters", "The original: hero, with the guide’s chapters alongside"], ["b", "B · First question", "The landing is the first question"], ["c", "C · A letter", "A calm note, beside a page from a guide"], ["d", "D · Questions people ask", "Eight common questions, each mapped to a chapter"], ["e", "E · See your guide", "A look at the guide itself"], ["f", "F · Where are you?", "Pick your stage and get help instantly, before starting"], ["g", "G · Facts, not noise", "Common beliefs, with the plain facts"], ["h", "H · One step at a time", "Calm and minimal: now, soon, later"], ["i", "I · What to do first", "A five-point checklist for this week"]];
  const origin = () => (ON ? location.origin : "https://decouple.uk");

  /* data: the site API when signed in on decouple.uk, otherwise this browser */
  const api = {
    async site(p) {
      if (ON) { const r = p ? await DC.admin.set(p) : await DC.admin.get(); if (!r.ok || !r.data) throw new Error(r.status === 401 || r.status === 404 ? "You’re signed out." : "Couldn’t reach the site."); return r.data; }
      const s = rd(), cur = { mode: s.mode || "guide", requireCode: s.requireCode !== false, testMode: !!s.testMode, landing: s.landing || "a" };
      return p ? (wr(p), { ...cur, ...p }) : cur;
    },
    async codes(op) {
      if (ON) { const r = op ? await DC.admin.codes(op) : await DC.admin.codes(); if (!r.ok || !r.data) throw new Error("Couldn’t update the codes. Try again."); return r.data.codes || []; }
      let list = rd().codes;
      if (!list) list = sample();
      if (op && op.action === "create") list = [...op.codes.map((c) => ({ ...c, active: true, created: new Date().toISOString(), uses: 0, last_used: "" })), ...list];
      if (op && op.action === "update") list = list.map((c) => (c.code === op.code ? { ...c, ...op } : c)).map(({ action, ...c }) => c);
      if (op && op.action === "delete") list = list.filter((c) => c.code !== op.code);
      wr({ codes: list }); return list;
    },
  };
  function sample() {
    const d = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10), t = (n) => new Date(Date.now() - n * 36e5).toISOString();
    return [
      { code: "FERN-LARK-27", label: "P01", active: true, test: false, expires: d(21), created: t(200), uses: 3, last_used: t(30) },
      { code: "TIDE-HAZEL-64", label: "P02", active: true, test: false, expires: d(21), created: t(200), uses: 1, last_used: t(70) },
      { code: "MINT-OWL-12", label: "Me · phone", active: true, test: true, expires: "", created: t(400), uses: 9, last_used: t(2) },
      { code: "CLAY-RIVER-81", label: "Pilot · Hannah", active: false, test: false, expires: d(-3), created: t(900), uses: 4, last_used: t(120) },
    ];
  }

  /* ── render ── */
  function chips() {
    $("#chips").innerHTML = (st.testMode ? '<span class="chip test"><i></i>Test mode on</span>' : "") + `<span class="chip ${st.mode === "guide" ? "live" : "hold"} hide-sm"><i></i>decouple.uk shows the ${st.mode === "guide" ? "guide" : "holding page"}</span>`;
  }
  function site() {
    const lb = $("#lands"); if (lb && !lb.children.length) lb.innerHTML = [...LANDS, ["random", "Rotate at random", "Each visitor sees one of the nine, so Results can compare them"]].map(([k, n, d]) => `<div class="lo" data-l="${k}"><button type="button" role="radio" data-l="${k}"><span class="rd"></span><span><b>${esc(n)}</b><small>${esc(d)}</small></span></button>${k === "random" ? "" : `<a href="${encodeURI("Marketing 02 · Divorce Guide.html")}?demo=1&phase=landing&landing=${k}" target="_blank" rel="noopener">Preview ↗</a>`}</div>`).join("");
    $$(".lo").forEach((o) => { const on = o.dataset.l === (st.landing || "a"); o.classList.toggle("on", on); o.querySelector("button").setAttribute("aria-checked", on); });
    $$(".mo").forEach((b) => { const on = b.dataset.m === st.mode; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
    [["#sw-code", st.requireCode], ["#sw-test", st.testMode]].forEach(([s, v]) => { const b = $(s); b.classList.toggle("on", !!v); b.setAttribute("aria-checked", !!v); });
    $("#test-card").classList.toggle("on", !!st.testMode);
    $("#code-help").textContent = st.requireCode ? "On: anyone can see the landing page, but they need a code to start the guide. Without one, they can leave their email." : "Off: anyone can start the guide. Answers are only sent if they agree on the consent screen.";
    $("#test-help").innerHTML = st.testMode
      ? "<b style=\"color:#92400E\">On.</b> Nothing you do while signed in is saved: guide answers, testing-mode answers and sign-ups are thrown away. Email still sends, so you can check it. Test codes are never saved either."
      : "Turn on while you try the guide yourself. Nothing you do while signed in is saved. On other devices, sign in there or use a test code.";
    chips();
  }
  function table() {
    const list = codes.filter((c) => filter === "all" || (filter === "active" ? c.active && !expired(c) : !c.active || expired(c)));
    $$(".filt button").forEach((b) => b.classList.toggle("on", b.dataset.f === filter));
    $("#n-active").textContent = codes.filter((c) => c.active && !expired(c)).length;
    $("#n-off").textContent = codes.filter((c) => !c.active || expired(c)).length;
    $("#n-all").textContent = codes.length;
    $("#tbl").innerHTML = '<div class="tr th"><span>Code</span><span>Label</span><span>Status</span><span>Expires</span><span>Uses</span><span>Last used</span><span></span></div>' + (list.length ? list.map((c) => {
      const x = expired(c), s = x ? '<span class="st x">Expired</span>' : c.active ? '<span class="st a">Active</span>' : '<span class="st o">Off</span>';
      return `<div class="tr${c.active && !x ? "" : " off"}" data-code="${esc(c.code)}">
        <span><span class="cd">${esc(c.code)}</span>${c.test ? '<span class="tst" title="Answers from this code are never saved">TEST</span>' : ""}<span class="sm-only">${esc(c.label || "No label")} · ${c.uses || 0} uses · ${ago(c.last_used)}</span></span>
        <span class="lb c-lb" title="${esc(c.label)}">${esc(c.label || "—")}</span>
        <span>${s}</span><span class="tab c-ex">${c.expires ? fmt(c.expires) : "Never"}</span><span class="tab c-us">${c.uses || 0}</span><span class="c-last">${ago(c.last_used)}</span>
        <span class="ra"><button class="ib" data-a="copy">Copy link</button><button class="ib" data-a="${c.active ? "off" : "on"}">${c.active ? "Turn off" : "Turn on"}</button><button class="ib dang" data-a="del" aria-label="Delete ${esc(c.code)}">Delete</button></span>
      </div>`;
    }).join("") : `<div class="empty">${filter === "active" ? "No active codes. Make one above." : "Nothing here."}</div>`);
  }
  function freshBox() {
    const b = $("#fresh"); b.classList.toggle("show", fresh.length > 0); if (!fresh.length) return;
    $("#fresh ul").innerHTML = fresh.map((c) => `<li><span><code>${esc(c.code)}</code> ${esc(c.label || "")}${c.test ? ' <span class="tst">TEST</span>' : ""}</span><span class="note">${origin()}/?code=${esc(c.code)}</span></li>`).join("");
  }
  const say = (el, t, k) => { el.textContent = t; el.className = "note" + (k ? " " + k : ""); if (t) setTimeout(() => { if (el.textContent === t) el.textContent = ""; }, 4000); };
  const copy = (t) => (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(() => { const x = document.createElement("textarea"); x.value = t; document.body.appendChild(x); x.select(); document.execCommand("copy"); x.remove(); });

  /* ── actions ── */
  async function setSite(p, msg) {
    const box = p.landing ? $("#land-msg") : $("#site-msg");
    const prev = st; st = { ...st, ...p }; site();
    try { st = { ...st, ...(await api.site(p)) }; site(); say(box, msg, "ok"); }
    catch (e) { st = prev; site(); say(box, e.message, "err"); }
  }
  async function codeOp(op, msg) {
    try { codes = await api.codes(op); table(); if (msg) say($("#code-msg"), msg, "ok"); }
    catch (e) { say($("#code-msg"), e.message, "err"); }
  }
  function wire() {
    $$(".mo").forEach((b) => b.addEventListener("click", () => { if (b.dataset.m === st.mode) return; setSite({ mode: b.dataset.m }, b.dataset.m === "guide" ? "decouple.uk now shows the guide." : "decouple.uk now shows the holding page."); }));
    $("#sw-code").addEventListener("click", () => setSite({ requireCode: !st.requireCode }, !st.requireCode ? "A code is now needed to start the guide." : "Anyone can now start the guide."));
    $("#lands").addEventListener("click", (e) => { const b = e.target.closest("button[data-l]"); if (!b || b.dataset.l === st.landing) return; const n = (LANDS.find((x) => x[0] === b.dataset.l) || [0, "Rotate at random"])[1]; setSite({ landing: b.dataset.l }, b.dataset.l === "random" ? "Visitors now see one of the nine designs at random." : `The guide now opens on ${n}.`); });
    $("#sw-test").addEventListener("click", () => setSite({ testMode: !st.testMode }, !st.testMode ? "Test mode is on. Nothing you do is saved." : "Test mode is off. Answers are saved again."));
    $("#pub").addEventListener("click", async (e) => { const b = e.currentTarget; if (!ON) return say($("#q-msg"), "Publishing works on decouple.uk.", ""); b.disabled = true; const r = await DC.admin.publish(); b.disabled = false; say($("#q-msg"), r.ok ? "Publishing. New questions are live in about a minute." : "Couldn’t start publishing. Try again.", r.ok ? "ok" : "err"); });
    $("#out").addEventListener("click", async () => { if (ON) { await DC.logout(); location.href = "/"; } else say($("#site-msg"), "Signing out works on decouple.uk.", ""); });
    $$(".filt button").forEach((b) => b.addEventListener("click", () => { filter = b.dataset.f; table(); }));
    $("#gen").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, n = Math.max(1, Math.min(20, +f.count.value || 1)), label = f.label.value.trim(), days = f.exp.value, test = f.test.checked;
      const expires = days === "never" ? "" : new Date(Date.now() + +days * 864e5).toISOString().slice(0, 10);
      const taken = new Set(codes.map((c) => c.code)), m = label.match(/^(.*?)(\d+)$/);
      const made = Array.from({ length: n }, (_, i) => { const code = mkCode(taken); taken.add(code); const l = n === 1 ? label : m ? m[1] + String(+m[2] + i).padStart(m[2].length, "0") : (label ? label + " " : "") + (i + 1); return { code, label: l, expires, test }; });
      await codeOp({ action: "create", codes: made }, n === 1 ? "Code made." : n + " codes made.");
      fresh = made; freshBox(); filter = "active"; table();
      f.label.value = ""; f.count.value = 1;
    });
    $("#fresh-copy").addEventListener("click", () => { copy(fresh.map((c) => `${c.label ? c.label + ": " : ""}${origin()}/?code=${c.code}`).join("\n")); say($("#code-msg"), "Links copied.", "ok"); });
    $("#fresh-x").addEventListener("click", () => { fresh = []; freshBox(); });
    $("#tbl").addEventListener("click", (e) => {
      const b = e.target.closest("[data-a]"), row = e.target.closest("[data-code]"); if (!b || !row) return;
      const code = row.dataset.code, c = codes.find((x) => x.code === code), a = b.dataset.a;
      if (a === "copy") { copy(`${origin()}/?code=${code}`); say($("#code-msg"), "Link copied: " + origin() + "/?code=" + code, "ok"); }
      if (a === "off") codeOp({ action: "update", code, active: false }, code + " is off. It stops working within a minute.");
      if (a === "on") codeOp({ action: "update", code, active: true, ...(expired(c) ? { expires: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) } : {}) }, code + (expired(c) ? " is on, for another 30 days." : " is on."));
      if (a === "del" && confirm(`Delete ${code}? Answers already given with it are kept.`)) codeOp({ action: "delete", code }, code + " deleted.");
    });
  }

  async function init() {
    wire();
    const s = await DC.session();
    ON = !!(s && s.owner);
    if (s && !s.owner) { location.replace("/"); return; }
    $("#preview").hidden = ON;
    try { st = { ...st, ...(await api.site()) }; } catch (e) { say($("#site-msg"), e.message, "err"); }
    site();
    try { codes = await api.codes(); } catch (e) { say($("#code-msg"), e.message, "err"); }
    table();
    $("#login-url").textContent = origin() + "/studio";
  }
  init();
})();
