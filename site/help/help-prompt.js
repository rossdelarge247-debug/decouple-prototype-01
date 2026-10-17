/* Help assistant · the system prompt, built from help-sources.json and help-content.json. Pure: no DOM, no network.
   The same file runs in the browser (window.HELPPROMPT) and on the server (require(...).HELPPROMPT): on decouple.uk,
   /api/claude with kind "help" ignores the page's system prompt and builds its own with this (spec §7). */
(function (root) {
  const LIMIT = { system: 7800, turns: 8, q: 1000, max_tokens: 700 };
  const STOP = new Set("the and for are you your yours our can how what when where who why which with that this from have has had does did will would should could about into than then them they their there here its it's not but all any get got just also been being was were want need like know tell much many more most some such very only own one two our out off over under after before because while if or of to in on at by as is am be do a an me my we us i i'm i've i'd let please really still even ever".split(" "));
  const ent = { amp: "&", lt: "<", gt: ">", quot: '"', nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", pound: "£" };
  const strip = (h) => String(h || "").replace(/<\/(p|li|h\d|tr|div)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&(#\d+|[a-z]+);/gi, (m, k) => (k[0] === "#" ? String.fromCharCode(+k.slice(1)) : ent[k.toLowerCase()] || " ")).replace(/[ \t]+/g, " ").replace(/ *\n[\s\n]*/g, "\n").trim();
  const stem = (w) => w.replace(/'s$/, "").replace(/ies$/, "y").replace(/(ss)$/, "$1").replace(/([^s])s$/, "$1").replace(/(ing|ed)$/, "");
  const words = (s) => (String(s || "").toLowerCase().replace(/’/g, "'").match(/[a-z][a-z']{2,}/g) || []).filter((w) => !STOP.has(w)).map(stem).filter((w) => w.length > 2);

  /* every topic on the page, in page order, with the disclosure section where the page shows it */
  function topics(S) {
    const out = [];
    (S.topics || []).forEach((t) => { out.push(t); if (S.disclosure && S.disclosure.after === t.id) out.push({ ...S.disclosure, id: "disclosure" }); });
    return out;
  }
  const topicText = (t) => [t.t, t.covers, t.sum, t.advice, (t.routes || []).map((r) => r.t + " " + r.when + " " + r.d).join(" "), (t.checklist || []).join(" "), (t.gov || []).map((g) => g.t).join(" "), (t.links || []).map((l) => l.t + " " + l.d).join(" ")].join(" ");

  /* the topics most like the question (and the turn before it), best first */
  function pick(S, C, text, n) {
    const q = new Set(words(text)); if (!q.size) return [];
    const pages = (C && C.pages) || {};
    return topics(S).map((t) => {
      let s = 0; const own = words(topicText(t)), head = words(t.t + " " + t.covers);
      own.forEach((w) => { if (q.has(w)) s += 1; }); head.forEach((w) => { if (q.has(w)) s += 3; });
      (t.gov || []).forEach((g) => { const p = pages[g.path]; if (!p) return; let h = 0; words(p.title + " " + (p.description || "") + " " + strip(p.body)).forEach((w) => { if (q.has(w)) h++; }); s += Math.min(h, 12) * 0.5; });
      return { t, s };
    }).filter((x) => x.s >= 2).sort((a, b) => b.s - a.s).slice(0, n || 3).map((x) => x.t);
  }

  /* the GOV.UK paragraphs most like the question, kept in their own order, up to a budget */
  function excerpt(body, q, budget) {
    const paras = strip(body).split("\n").map((p) => p.trim()).filter((p) => p.length > 30);
    if (!paras.length) return "";
    const scored = paras.map((p, i) => { let s = 0; words(p).forEach((w) => { if (q.has(w)) s++; }); return { p, i, s: s + (i < 2 ? 0.5 : 0) }; });
    const keep = []; let used = 0;
    scored.slice().sort((a, b) => b.s - a.s).forEach((x) => { if (used + x.p.length + 1 > budget) return; keep.push(x); used += x.p.length + 1; });
    return keep.sort((a, b) => a.i - b.i).map((x) => x.p).join("\n");
  }

  const RULES = `You are the help assistant on Decouple's Help & support page, a free page for people separating or divorcing in England and Wales. You answer questions and talk things through, using ONLY what this page says and the GOV.UK text below.
Rules:
- Use the page's words and the GOV.UK text. Don't add rules, exceptions or "you don't need to" claims that aren't in them: if they don't settle it, say what the page says, say it depends, and point to the topic and to where to get advice. Never invent rules, forms, services or phone numbers.
- Fees, amounts, time limits and dates: only give one if it appears in the GOV.UK text below, and say it's from GOV.UK. Otherwise say GOV.UK has the current figure.
- Never predict what a court will order or what someone "will get". Never tell them what they legally must do. Say when a solicitor, mediator or adviser should help, and name the topic's "where to get advice".
- This page covers England and Wales only. If they're in Scotland or Northern Ireland, say the law is different there.
- SAFETY FIRST: if they mention violence, threats, fear, being controlled, self-harm or harm to children, start with: 999 in an emergency (press 55 if you can't speak), the National Domestic Abuse Helpline 0808 2000 247 (free, 24 hours), Samaritans 116 123. Then answer gently, if at all.
- It's a conversation: if the question is unclear, ask one short question back. Keep earlier turns in mind.
- British spelling. Plain English. Warm, calm and brief: under 130 words, short paragraphs. No emoji, no headings, no markdown.
Respond ONLY with JSON, no other text: {"answer": string (paragraphs separated by \\n\\n), "topics": [up to 3 topic ids from the list, most useful first], "gov": [up to 3 GOV.UK paths from the text below that back the answer], "pro": boolean (true if this really needs a solicitor, mediator or adviser), "follow": [up to 3 short follow-up questions they might ask next, under 60 characters each]}`;

  /* messages: [{role, content}], newest last. Returns the system prompt, never longer than LIMIT.system. */
  function build(S, C, messages) {
    const pages = (C && C.pages) || {}, list = topics(S);
    const users = (messages || []).filter((m) => m.role === "user").map((m) => String(m.content || ""));
    const recent = users.slice(-2).join(" "), q = new Set(words(recent));
    const chosen = pick(S, C, recent, 3), near = new Set(chosen.map((t) => t.id));
    /* every topic by title; the ones nearest the question (and Safety, always) with what the page says */
    const index = list.map((t) => near.has(t.id) || t.urgent ? `[${t.id}] ${t.t}: ${t.sum}${t.call ? " Calls: " + t.call.map((c) => c[0] + " " + c[1]).join("; ") + "." : ""} Where to get advice: ${t.advice || "see the topic"}` : `[${t.id}] ${t.t} (${t.covers})`).join("\n");
    let sys = RULES + `\n\n${S.scope}\n\nTOPICS ON THIS PAGE (id, title; the nearest ones with what the page says in its own words):\n${index}`;
    const D = S.disclosure;
    if (D && chosen.some((t) => t.id === "disclosure")) sys += `\n\nFINANCIAL DISCLOSURE ROUTES (the page's words):\n${D.routes.map((r) => `${r.t} (${r.when}): ${r.d} Forms: ${r.forms.join(", ")}.`).join("\n")}\nForms: ${Object.entries(D.forms).map(([k, v]) => k + " = " + v).join("; ")}.\nWhat to gather: ${D.checklist.join("; ")}.`;
    const govs = []; chosen.forEach((t) => (t.gov || []).forEach((g) => { const p = pages[g.path]; if (p && p.body) govs.push({ g, p, t }); }));
    let room = LIMIT.system - sys.length - 120;
    if (govs.length && room > 400) {
      sys += "\n\nGOV.UK TEXT (fetched from GOV.UK; quote figures only from here):";
      const each = Math.floor(room / govs.length) - 120;
      govs.forEach(({ g, p, t }) => { const ex = excerpt(p.body, q, Math.max(200, each)); if (ex) sys += `\n--- ${g.path} · "${p.title}" (topic ${t.id}${p.updated ? ", updated " + String(p.updated).slice(0, 10) : ""})\n${ex}`; });
    } else if (!govs.length) sys += "\n\nNo GOV.UK text is loaded for this question. Point to the GOV.UK pages by topic, and don't give any figure.";
    if (sys.length > LIMIT.system) sys = sys.slice(0, LIMIT.system);
    return sys;
  }

  /* what the client may send: the last turns, each trimmed */
  const trim = (messages) => (messages || []).slice(-LIMIT.turns).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, m.role === "assistant" ? 2000 : LIMIT.q) }));

  root.HELPPROMPT = { build, pick, topics, strip, trim, LIMIT };
})(typeof module !== "undefined" && module.exports ? module.exports : window);
