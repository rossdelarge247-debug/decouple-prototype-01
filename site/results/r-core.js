/* Decouple · Results — data layer. Reads the answers sheet (one row per answer: SID, PID, PROTO, QID, QUESTION, TYPE, ANSWER, TIME, DEVICE).
   Settings live in decouple.results.v1 only (feed URL, source, passcode hash). Nothing here writes to any other key. */
window.R = (function () {
  const KEY = "decouple.results.v1";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const save = (p) => { const n = { ...read(), ...p }; localStorage.setItem(KEY, JSON.stringify(n)); return n; };

  /* one entry per test. `tab` = the sheet tab name; `re` matches the PROTO column */
  const TESTS = [
    { id: "m02", code: "M02", name: "Divorce guide", sub: "Landing, interview, guide with questions woven in", kind: "Experiment", re: /^M02 Guide/i, tab: "M02 Guide", rx: "^M02 Guide" },
    { id: "mvp", code: "MVP", name: "MVP prototypes", sub: "End-of-prototype questions for the MVP journeys", kind: "Questionnaire", re: /^MVP \d{2} /, tab: "MVP testing", rx: "^MVP [0-9]{2} " },
    { id: "proto", code: "UT", name: "Prototype testing", sub: "End-of-prototype questions and check-ins, Protos 01–10", kind: "Questionnaire", re: /^\d{2} /, tab: "Prototype testing", rx: "^[0-9]{2} " },
    { id: "m02v1", code: "M02 v1", name: "Free tool (first version)", sub: "Retired. Kept for earlier answers", kind: "Experiment", re: /^M02 Free tool/i, tab: "M02 Free tool", rx: "^M02 Free tool" },
    { id: "m01", code: "M01", name: "Holding page", sub: "Sign-ups and where people are", kind: "Sign-ups", re: /^M01/i, tab: "M01 Holding", rx: "^M01" },
  ];
  const OTHER = { id: "other", code: "?", name: "Unsorted", sub: "Rows that match no test", kind: "Other" };
  const LANDS = { a: "A · Chapters (original)", b: "B · First question", c: "C · A letter", d: "D · Questions people ask", e: "E · See your guide", f: "F · Where are you? (instant help)", g: "G · Facts, not noise", h: "H · One step at a time", i: "I · What to do first" };
  const testOf = (proto) => TESTS.find((t) => t.re.test(proto || "")) || OTHER;
  /* rows from /api/results on decouple.uk: {sid,pid,test,step,price,landing,qid,qv,q,type,a,at,device} */
  const protoOf = (x) => x.test === "M02 Guide" ? `M02 Guide · ${x.step} · ${x.price || ""} · L-${x.landing || "a"}` : x.test === "Prototype testing" ? x.step : `${x.test} · ${x.step}`;
  const fromApi = (rows) => (rows || []).map((x) => norm({ sid: x.sid, pid: x.pid, proto: protoOf(x), qid: x.qid, question: x.q, type: x.type, answer: x.a, at: x.at, device: x.device }));

  /* sheet set-up: tab formulas. Columns are found by header name, so the form's question order doesn't matter */
  const formulas = (src) => {
    const S = `'${(src || "Form responses 1").replace(/'/g, "''")}'`, A = `${S}!A2:K`, H = `${S}!A1:K1`;
    const col = (k) => `INDEX(${A},,MATCH("*${k}*",${H},0))`;
    const tab = (rx) => `={${H};FILTER(${A},REGEXMATCH(${col("PROTO")},"${rx}"))}`;
    return [
      { tab: "Feed", why: "Every answer except email addresses. This is the only tab you publish.", f: `={${H};FILTER(${A},INDEX(${A},,1)<>"",NOT(REGEXMATCH(${col("QID")},"email")))}` },
      ...TESTS.map((t) => ({ tab: t.tab, why: t.name + " only.", f: tab(t.rx) })),
    ];
  };

  /* CSV → rows */
  function parseCSV(t) {
    const rows = []; let r = [], f = "", q = false;
    for (let i = 0; i < t.length; i++) { const c = t[i];
      if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
      else if (c === '"') q = true; else if (c === ",") { r.push(f); f = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; r.push(f); rows.push(r); r = []; f = ""; } else f += c; }
    if (f || r.length) { r.push(f); rows.push(r); }
    return rows.filter((x) => x.some((v) => String(v).trim()));
  }
  const ukDate = (s) => { const m = String(s || "").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T]?(\d{1,2})?:?(\d{2})?:?(\d{2})?/); return m ? new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)) : null; };
  function fromCSV(text) {
    const all = parseCSV(text); if (!all.length) return [];
    const h = all[0].map((x) => x.trim().toLowerCase());
    const find = (k) => { let i = h.indexOf(k); if (i < 0) i = h.findIndex((x) => x.includes(k) && !(k === "time" && x.includes("timestamp"))); return i; };
    const ix = { sid: find("sid"), pid: find("pid"), proto: find("proto"), qid: find("qid"), q: find("question"), type: find("type"), a: find("answer"), time: find("time"), ts: find("timestamp"), dev: find("device") };
    if (ix.proto < 0 || ix.qid < 0) throw new Error("Couldn’t find the PROTO and QID columns. Check the first row has the column names.");
    return all.slice(1).map((r) => norm({ sid: r[ix.sid], pid: r[ix.pid], proto: r[ix.proto], qid: r[ix.qid], question: r[ix.q], type: r[ix.type], answer: r[ix.a], at: r[ix.time] || r[ix.ts], device: r[ix.dev] }));
  }
  function norm(r) {
    const proto = String(r.proto || "").trim(), parts = proto.split(" · "), test = testOf(proto);
    let t = new Date(r.at); if (isNaN(t)) t = ukDate(r.at) || new Date(0);
    const o = { sid: String(r.sid || "").trim() || "—", pid: String(r.pid || "").trim() || "anon", proto, qid: String(r.qid || "").trim(), q: String(r.question || "").trim(), type: String(r.type || "").trim(), a: String(r.answer == null ? "" : r.answer).trim(), t, dev: r.device || "", test: test.id };
    if (test.id === "m02") { const p = parts.slice(1); o.lv = p.length && /^L-/.test(p[p.length - 1]) ? p.pop().slice(2).toLowerCase() || "a" : "a"; o.ver = p.length && /^[AB]$/i.test(p[p.length - 1]) ? p.pop().toUpperCase() : ""; o.sec = p.join(" · "); o.k = o.qid.replace(/^m02\./, ""); }
    else if (test.id === "proto") { o.pn = proto.slice(0, 2); o.pname = parts[0].slice(3); o.screen = parts[1] || ""; o.k = o.qid; }
    else o.k = o.qid;
    return o;
  }

  /* sources */
  async function fromFeed(url) {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(url, { cache: "no-store", signal: ctl.signal }); clearTimeout(to);
    if (!r.ok) throw new Error("The feed returned " + r.status + ". Check it’s published as CSV.");
    const t = await r.text(); if (/^\s*</.test(t)) throw new Error("That link returned a web page, not CSV. In Publish to web, pick the Feed tab and ‘Comma-separated values’.");
    return fromCSV(t);
  }
  const fromLocal = () => { try { return ((JSON.parse(localStorage.getItem("decouple.ut.v1")) || {}).local || []).map(norm); } catch (e) { return []; } };

  /* helpers */
  const uniq = (a) => [...new Set(a)];
  const by = (a, f) => a.reduce((m, x) => { const k = f(x); (m[k] = m[k] || []).push(x); return m; }, {});
  const latest = (rows) => { const m = new Map(); rows.forEach((r) => { const k = r.sid + "|" + r.k, p = m.get(k); if (!p || r.t >= p.t) m.set(k, r); }); return [...m.values()]; };
  const sids = (rows, f) => new Set(rows.filter(f || (() => true)).map((r) => r.sid));
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  const money = (s) => { const n = parseFloat(String(s).replace(/[£,\s]/g, "")); return isNaN(n) ? null : n; };
  const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const fmtD = (d) => d && d.getTime() ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";
  const ago = (d) => { if (!d || !d.getTime()) return "—"; const m = (Date.now() - d) / 60000; return m < 60 ? Math.max(1, Math.round(m)) + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " d ago"; };
  const daily = (rows, days) => { const out = Array(days).fill(0), now = new Date(); now.setHours(23, 59, 59, 999); const seen = new Set(); rows.forEach((r) => { const k = r.sid + r.t.toDateString(); if (seen.has(k)) return; seen.add(k); const d = Math.floor((now - r.t) / 864e5); if (d >= 0 && d < days) out[days - 1 - d]++; }); return out; };

  /* counts for one question; splits multi-select ("a; b"). order = known option labels */
  function dist(rows, order) {
    const c = {}; let n = 0;
    rows.forEach((r) => { if (!r.a) return; n++; (r.type === "chips" || r.type === "optin" || /; /.test(r.a) ? r.a.split(/;\s*/) : [r.a]).forEach((v) => { v = v.trim(); if (v) c[v] = (c[v] || 0) + 1; }); });
    let items = Object.entries(c).map(([label, k]) => ({ label, n: k, p: pct(k, n) }));
    if (order && order.length) items.sort((x, y) => { const a = order.indexOf(x.label), b = order.indexOf(y.label); return (a < 0 ? 99 : a) - (b < 0 ? 99 : b) || y.n - x.n; });
    else items.sort((x, y) => y.n - x.n);
    return { n, items };
  }

  /* Van Westendorp: four cumulative curves on a price grid, and where they cross */
  function vw(resp) {
    const ok = resp.filter((r) => [r.cheap, r.bargain, r.dear, r.too].every((v) => v != null)); if (ok.length < 3) return null;
    const vals = ok.flatMap((r) => [r.cheap, r.too]), lo = Math.min(...vals), hi = Math.max(...vals), step = Math.max(1, (hi - lo) / 80), N = ok.length, grid = [];
    for (let p = lo; p <= hi + 0.001; p += step) grid.push(p);
    const cur = {
      tooCheap: grid.map((p) => ok.filter((r) => r.cheap >= p).length / N),
      cheap: grid.map((p) => ok.filter((r) => r.bargain >= p).length / N),
      dear: grid.map((p) => ok.filter((r) => r.dear <= p).length / N),
      tooDear: grid.map((p) => ok.filter((r) => r.too <= p).length / N),
    };
    const cross = (a, b) => { for (let i = 1; i < grid.length; i++) { const d0 = a[i - 1] - b[i - 1], d1 = a[i] - b[i]; if (d0 > 0 && d1 <= 0) { if (d1 < 0) return grid[i - 1] + (grid[i] - grid[i - 1]) * (d0 / (d0 - d1)); let j = i; while (j + 1 < grid.length && a[j + 1] - b[j + 1] === 0) j++; return (grid[i] + grid[j]) / 2; } } return null; };
    return { N, grid, cur, pmc: cross(cur.tooCheap, cur.dear), pme: cross(cur.cheap, cur.tooDear), opp: cross(cur.tooCheap, cur.tooDear), ipp: cross(cur.cheap, cur.dear) };
  }

  /* known option labels per M02 question, for chart ordering */
  const order = (k) => {
    const G = window.G; if (!G) return null;
    const all = [...G.Q, ...G.CH.flatMap((c) => c.qs || []), ...G.SERVICE_Q, ...G.LAST_Q], q = all.find((x) => x.id === k);
    return q ? G.optsOf(q).map((o) => o[1]) : null;
  };

  const toCSV = (rows) => { const h = ["sid", "pid", "proto", "qid", "question", "type", "answer", "time"], e = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`; return [h.join(","), ...rows.map((r) => [r.sid, r.pid, r.proto, r.qid, r.q, r.type, r.a, r.t.toISOString()].map(e).join(","))].join("\n"); };
  async function hash(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("decouple:" + s)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }

  return { KEY, read, save, TESTS, OTHER, LANDS, testOf, fromApi, formulas, parseCSV, fromCSV, fromFeed, fromLocal, norm, uniq, by, latest, sids, pct, money, median, mean, fmtD, ago, daily, dist, vw, order, toCSV, hash };
})();
