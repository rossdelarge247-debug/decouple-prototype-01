/* M02 · questions from the "M02 Questions" sheet tab.
   The build writes the tab to m02/guide/questions.json (an array of rows keyed by column name). If it's missing or broken,
   the built-in questions in g-data.js are used. Columns:
   id · section · type · label · helper · options · show_if · required · max · exclusive · placeholder · skip · version · active
   section  = an interview step (about, kids, home, income, assets, debts, pensions, life, where, goals, names),
              ch:<chapter> (ch:where, ch:picture, ch:kids, ch:fair, ch:agree, ch:legal, ch:you), service or last. Safety rows are ignored.
   type     = cards · seg · chips · band · text · long · note (a note shows its label as text)
   options  = key=Label~Optional subtitle | key2=Label 2   (band: the band name, e.g. home). Keep existing keys; the guide reads them.
   show_if  = plain-English rule, e.g.  kids = with  ·  stage is not agreed  ·  home starts with own  ·  debt_kinds lacks none
              ·  stage in decided, apart  ·  goals has home  ·  status = cohab and home starts with own  ·  not (cope = ok)  ·  savings is answered
   label    = may use {partner} and {you}, replaced with first names when given. */
(function () {
  const G = window.G, IV = window.IV;
  const TYPES = ["cards", "seg", "chips", "band", "text", "long", "note"];
  const CORE = ["stage", "status", "years", "kids", "ages", "kids_live", "living", "home", "home_value", "mortgage", "work", "inc_me", "inc_them", "savings", "complex", "debt_kinds", "debt_total", "pen_me", "pen_them", "stand", "comms", "goals", "name_me", "name_them"];
  const yes = (v, dflt) => (v == null || String(v).trim() === "" ? dflt : /^(y|yes|true|1)$/i.test(String(v).trim()));

  /* ── rules ── */
  function tokens(s) { const out = [], re = /\s*(\(|\)|,|!=|=|"[^"]*"|'[^']*'|[^\s(),=!"']+)/g; let m; while ((m = re.exec(s))) { if (!m[1]) break; out.push(m[1]); } return out; }
  function compile(src) {
    const t = tokens(String(src || "")); let i = 0;
    if (!t.length) return null;
    const peek = (k) => (t[i] || "").toLowerCase() === k, take = (k) => { if (k && !peek(k)) throw new Error(`expected “${k}” near “${t.slice(i, i + 3).join(" ")}”`); return t[i++]; };
    const val = () => { const v = take(); if (v == null) throw new Error("missing a value at the end"); if (/^(=|!=|\(|\)|,)$/.test(v)) throw new Error(`expected a value, not “${v}”`); return /^["']/.test(v) ? v.slice(1, -1) : v; };
    const list = () => { const p = peek("("); if (p) take("("); const vs = [val()]; while (peek(",")) { take(","); vs.push(val()); } if (p) take(")"); return vs; };
    const ans = (v) => v != null && v !== "" && !(Array.isArray(v) && !v.length);
    const eq = (v, x) => (Array.isArray(v) ? v.includes(x) : v != null && String(v) === x);
    function cond() {
      const f = take(); if (f == null) throw new Error("the rule ends too early"); if (!/^[a-z_][a-z0-9_]*$/i.test(f)) throw new Error(`“${f}” isn’t a question id`);
      const g = (a) => a[f];
      if (peek("is")) { take(); if (peek("answered")) { take(); return (a) => ans(g(a)); } if (peek("not")) { take(); if (peek("answered")) { take(); return (a) => !ans(g(a)); } const x = val(); return (a) => !eq(g(a), x); } const x = val(); return (a) => eq(g(a), x); }
      if (peek("=")) { take(); const x = val(); return (a) => eq(g(a), x); }
      if (peek("!=")) { take(); const x = val(); return (a) => !eq(g(a), x); }
      if (peek("in")) { take(); const xs = list(); return (a) => xs.some((x) => eq(g(a), x)); }
      if (peek("not")) { take(); take("in"); const xs = list(); return (a) => !xs.some((x) => eq(g(a), x)); }
      if (peek("starts")) { take(); take("with"); const x = val(); return (a) => typeof g(a) === "string" && g(a).startsWith(x); }
      if (peek("has")) { take(); const x = val(); return (a) => eq(g(a), x); }
      if (peek("lacks")) { take(); const x = val(); return (a) => !eq(g(a), x); }
      throw new Error(`don’t know how to read “${t.slice(i - 1, i + 2).join(" ")}”`);
    }
    function unary() { if (peek("not")) { take(); const f = unary(); return (a) => !f(a); } if (peek("(")) { take("("); const f = or(); take(")"); return f; } return cond(); }
    function and() { let f = unary(); while (peek("and")) { take(); const l = f, r = unary(); f = (a) => l(a) && r(a); } return f; }
    function or() { let f = and(); while (peek("or")) { take(); const l = f, r = and(); f = (a) => l(a) || r(a); } return f; }
    const fn = or(); if (i < t.length) throw new Error(`unexpected “${t[i]}”`);
    return (a) => { try { return !!fn(a || {}); } catch (e) { return false; } };
  }

  /* ── rows → questions ── */
  const names = (a) => { const P = window.PB && window.PB.names ? window.PB.names(a || {}) : null; return { partner: P && P.hasThem ? P.Them : "your partner", you: P && P.hasMe ? P.Me : "you" }; };
  const fill = (s) => (/\{(partner|you)\}/.test(s) ? (a) => { const n = names(a); return s.replace(/\{partner\}/g, n.partner).replace(/\{you\}/g, n.you); } : s);
  function opts(s) {
    return String(s || "").split("|").map((x) => x.trim()).filter(Boolean).map((x) => {
      const eqI = x.indexOf("="), key = eqI > 0 ? x.slice(0, eqI).trim() : x.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""), rest = eqI > 0 ? x.slice(eqI + 1) : x, [l, sub] = rest.split("~").map((y) => y.trim());
      return sub ? [key, l, sub] : [key, l];
    });
  }
  function toQ(r, n, errs) {
    const id = String(r.id || "").trim(), sec = String(r.section || "").trim(), type = String(r.type || "").trim().toLowerCase(), bad = (why) => (errs.push({ row: n, id, why }), null);
    if (!id) return bad("no id");
    if (!/^[a-z_][a-z0-9_]*$/i.test(id)) return bad("the id can only use letters, numbers and _");
    if (!TYPES.includes(type)) return bad(`unknown type “${r.type}”`);
    const q = { id, type, v: Math.max(1, parseInt(r.version, 10) || 1) }, label = String(r.label || "").trim();
    if (type === "note") { if (!label) return bad("a note needs its text in label"); q.text = label; } else if (label) q.label = fill(label);
    if (r.helper) q.helper = String(r.helper).trim();
    if (r.placeholder) q.ph = String(r.placeholder).trim();
    if (r.skip) q.skip = String(r.skip).trim();
    if (r.exclusive) q.exclusive = String(r.exclusive).trim();
    if (r.max && +r.max > 0) q.max = +r.max;
    if (type === "band") { const b = String(r.options || "").replace(/^bands:/, "").trim(); if (!IV.BANDS[b]) return bad(`no band called “${b}” (use ${Object.keys(IV.BANDS).join(", ")})`); q.bands = b; }
    else if (["cards", "seg", "chips"].includes(type)) { q.opts = opts(r.options); if (q.opts.length < 2) return bad("needs at least two options"); }
    if (!yes(r.required, true)) q.optional = true;
    if (String(r.show_if || "").trim()) { try { q.when = compile(r.show_if); } catch (e) { return bad("show_if: " + e.message); } }
    return { q, sec };
  }

  /* keep the built-ins, so a missing tab or a bad row never breaks the guide */
  const BUILT = { Q: G.Q.slice(), CH: Object.fromEntries(G.CH.map((c) => [c.id, (c.qs || []).slice()])), service: G.SERVICE_Q.slice(), last: G.LAST_Q.slice() };
  const IVSEC = G.SECTIONS.map((s) => s.id).filter((x) => x !== "safety"), CHS = G.CH.filter((c) => !c.vonly).map((c) => c.id);
  function apply(rows) {
    const errs = [], iv = [], ch = {}, service = [], last = [], seen = new Set(), off = new Set();
    (rows || []).forEach((r, k) => {
      const n = k + 2, sec = String(r.section || "").trim();
      if (sec === "safety") return;
      if (!yes(r.active, true)) { off.add(String(r.id || "").trim()); return; }
      const res = toQ(r, n, errs); if (!res) return;
      const { q } = res;
      if (IVSEC.includes(sec)) { q.sec = sec; iv.push(q); }
      else if (/^ch:/.test(sec) && CHS.includes(sec.slice(3))) (ch[sec.slice(3)] = ch[sec.slice(3)] || []).push(q);
      else if (sec === "service") service.push(q); else if (sec === "last") last.push(q);
      else { errs.push({ row: n, id: q.id, why: `unknown section “${sec}”` }); return; }
      seen.add(q.id);
    });
    if (!seen.size) return { source: "built-in", used: 0, skipped: errs };
    const safety = BUILT.Q.filter((q) => q.sec === "safety");
    BUILT.Q.forEach((q) => { if (q.sec === "safety" || seen.has(q.id)) return; if (off.has(q.id) && !CORE.includes(q.id)) return; if (off.has(q.id)) errs.push({ id: q.id, why: "this question is needed by the guide, so it can’t be switched off. Kept." }); iv.push(q); });
    G.Q.length = 0; G.Q.push(...iv, ...safety);
    G.CH.forEach((c) => { if (c.vonly) return; const mine = ch[c.id] || [], keep = BUILT.CH[c.id].filter((q) => !seen.has(q.id) && !off.has(q.id)); if (mine.length || keep.length !== BUILT.CH[c.id].length) c.qs = [...mine, ...keep]; });
    const swap = (arr, mine, built) => { const keep = built.filter((q) => !seen.has(q.id) && !off.has(q.id)); arr.length = 0; arr.push(...mine, ...keep); };
    swap(G.SERVICE_Q, service, BUILT.service); swap(G.LAST_Q, last, BUILT.last);
    return { source: "sheet", used: seen.size, skipped: errs };
  }

  /* the sheet template, generated from the built-in questions */
  const RULES = { ages: "kids = with", kids_live: "kids = with", kids_know: "kids = with", home_value: "home starts with own", mortgage: "home starts with own", cohab_home: "status = cohab and home starts with own", savings_own: "status = cohab", debt_total: "debt_kinds is answered and debt_kinds lacks none", debt_names: "debt_kinds is answered and debt_kinds lacks none", cohab_pen: "status = cohab" };
  const COLS = ["id", "section", "type", "label", "helper", "options", "show_if", "required", "max", "exclusive", "placeholder", "skip", "version", "active"];
  function rowOf(q, sec, label, rule) {
    const o = q.bands ? q.bands : (q.opts || []).map((x) => x[0] + "=" + x[1] + (x[2] ? "~" + x[2] : "")).join(" | ");
    return { id: q.id, section: sec, type: q.type, label: q.type === "note" ? q.text : label == null ? (typeof q.label === "function" ? "" : q.label || "") : label, helper: q.helper || "", options: o, show_if: rule != null ? rule : RULES[q.id] || "", required: q.optional ? "n" : "y", max: q.max || "", exclusive: q.exclusive || "", placeholder: q.ph || "", skip: q.skip || "", version: q.v || 1, active: "y" };
  }
  function template() {
    const out = [];
    BUILT.Q.forEach((q) => {
      if (q.sec === "safety") return;
      if (q.id === "savings") { out.push(rowOf(q, q.sec, "Savings & investments in joint names", "status = cohab")); out.push(rowOf(q, q.sec, "Savings & investments, between you", "status is not cohab")); return; }
      out.push(rowOf(q, q.sec));
    });
    G.CH.forEach((c) => (BUILT.CH[c.id] || []).forEach((q) => out.push({ ...rowOf(q, "ch:" + c.id), required: "n" })));
    BUILT.service.forEach((q) => out.push({ ...rowOf(q, "service"), required: "n" }));
    BUILT.last.forEach((q) => out.push({ ...rowOf(q, "last"), required: "n" }));
    return out;
  }
  const csv = (rows) => [COLS.join(","), ...rows.map((r) => COLS.map((k) => { const v = String(r[k] == null ? "" : r[k]); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; }).join(","))].join("\n");

  G.sheet = { compile, apply, template, csv, COLS, RULES, BUILT, report: { source: "built-in", used: 0, skipped: [] } };
  G.ready = (async () => {
    try {
      const c = new AbortController(), to = setTimeout(() => c.abort(), 2500);
      const r = await fetch("m02/guide/questions.json", { cache: "no-cache", signal: c.signal }); clearTimeout(to);
      if (!r.ok) return;
      const rows = await r.json(); if (!Array.isArray(rows)) return;
      G.sheet.report = apply(rows);
      if (G.sheet.report.skipped.length) console.warn("[M02 questions] rows skipped:", G.sheet.report.skipped);
    } catch (e) {}
  })();
})();
