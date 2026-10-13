/* Dashboard — Journal & help: AI companion that logs difficult experiences and answers questions. Private to the user. */
(function () {
  const { useState, useRef, useEffect } = React;
  const Ic = window.DIc, J = window.Journey, DB = window.DB;
  const CATS = { incident: ["Difficult interaction", "#B91C1C", "#FEE2E2"], kids: ["Children", "#0369A1", "#E0F2FE"], money: ["Money", "#047857", "#ECFDF5"], feeling: ["How I'm feeling", "#9D174D", "#FCE7F3"], note: ["Note", "#57534E", "#F5F5F4"] };
  const SEED = [
    { id: "j1", d: "2026-10-04", cat: "incident", t: "Argument at handover", s: "Raised voices at Saturday's school-run handover, in front of the children. Mark said I was ‘dragging this out’.", watch: true },
    { id: "j2", d: "2026-09-26", cat: "money", t: "Joint account withdrawal", s: "£600 taken out of the joint account without discussion. Asked Mark about it, no answer yet." },
  ];
  const PROMPTS = {
    log: ["Something difficult happened today", "Mark said something that worried me", "A handover didn't go well", "Money has moved that I didn't expect"],
    help: ["What should I do next?", "Is the home split fair?", "How do I reply to Mark's counter-proposal?", "How long will this take?"],
  };
  const today = () => DB.TODAY.toISOString().slice(0, 10);
  const pretty = (d) => DB.fmt(new Date(d));

  function sysPrompt(N, sc, tasks, entries) {
    return `You are the Decouple companion, inside a UK (England & Wales) divorce finances app. You talk to ${N.Me}, who is separating from ${N.Them}. They are at the "${sc}" stage (picture = gathering finances, household = checking each other's pictures, settle = negotiating proposals, finalise = court documents, filed = with the court).
Her open tasks: ${tasks.map((t) => t.t).join("; ") || "none"}.
Recent journal entries: ${entries.slice(0, 5).map((e) => `${e.d} ${e.t}: ${e.s}`).join(" | ") || "none"}.
Two jobs:
1. JOURNAL: when she describes something that happened (an incident, a difficult interaction, something about the children, money moving, how she feels), acknowledge it warmly in one or two sentences, ask at most one short clarifying question if a key fact is missing (when, who was there), and log it. Neutral, factual wording in the log, as a solicitor would want it: what happened, when, who was present. No judgement of ${N.Them}.
2. HELP: answer questions about her tasks, the process, and strategy. Be practical and specific to her stage. Short paragraphs, plain English, UK terms (consent order, Form E, D81, CETV, MIAM). You are not a solicitor: for anything that needs legal advice, say so briefly and suggest the solicitor review.
SAFETY: if she mentions violence, threats, feeling unsafe or harm to children, put safety first: say clearly to call 999 if in immediate danger and give the National Domestic Abuse Helpline 0808 2000 247 (free, 24 hours). Set "watch": true.
Keep replies under 110 words. British spelling. No emoji.
Respond ONLY with JSON: {"reply": string, "entry": null | {"title": string (max 6 words), "cat": "incident"|"kids"|"money"|"feeling"|"note", "summary": string (one or two neutral sentences), "watch": boolean}}. Only include an entry when she has described something worth logging.`;
  }

  function Journal({ N, sc, tasks, say, full }) {
    const d0 = (J.get().dash || {}).journal;
    const [entries, setEntries] = useState(d0 || SEED), [mode, setMode] = useState("log"), [msgs, setMsgs] = useState([]), [txt, setTxt] = useState(""), [busy, setBusy] = useState(false), [open, setOpen] = useState(null);
    const log = useRef(null);
    useEffect(() => { J.set("dash", { journal: entries }); }, [entries]);
    useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight; }, [msgs, busy]);
    async function send(q) {
      const m = (q || txt).trim(); if (!m || busy) return;
      const hist = [...msgs, { role: "user", content: m }]; setMsgs(hist); setTxt(""); setBusy(true);
      try {
        const raw = await window.claude.complete({ system: sysPrompt(N, sc, tasks, entries), max_tokens: 600, messages: hist.slice(-10).map((x) => ({ role: x.role, content: x.role === "assistant" ? x.content : (mode === "log" ? "[Journal] " : "[Help] ") + x.content })) });
        let r; try { r = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)); } catch (e) { r = { reply: raw, entry: null }; }
        let added = null;
        if (r.entry && r.entry.title) { added = { id: "j" + Date.now(), d: today(), cat: CATS[r.entry.cat] ? r.entry.cat : "note", t: r.entry.title, s: r.entry.summary, watch: !!r.entry.watch }; setEntries((E) => [added, ...E]); say("Saved to your journal", "Private. Only you can see it."); }
        setMsgs([...hist, { role: "assistant", content: r.reply || "I've noted that.", entry: added }]);
      } catch (e) { setMsgs([...hist, { role: "assistant", content: "Sorry, I couldn't reply just then. Your message is still here. Try again in a moment.", err: true }]); }
      setBusy(false);
    }
    const watch = entries.filter((e) => e.watch), [cf, setCf] = useState("all");
    const shown = full ? entries.filter((e) => cf === "all" || (cf === "watch" ? e.watch : e.cat === cf)) : entries.slice(0, 6);
    const months = full ? [...new Set(shown.map((e) => e.d.slice(0, 7)))] : [null];
    const Ent = (e) => { const c = CATS[e.cat] || CATS.note, on = full || open === e.id; return <button key={e.id} className={"db-ent" + (on ? " on" : "")} onClick={() => !full && setOpen(on ? null : e.id)}><span className="tp"><span className="ct" style={{ color: c[1], background: c[2] }}>{c[0]}</span>{e.watch && <em>Watching</em>}<small>{pretty(e.d)}</small></span><b>{e.t}</b>{on && <p>{e.s}</p>}</button>; };
    return <section className={"paper pp-card db-card db-jr" + (full ? " full" : "")}>
      <div className="db-ch"><div className="pq-k" style={{ color: "#9D174D" }}><Ic.Spark s={12} c="#9D174D"/>Journal & help</div><span className="db-vsum"><small><Ic.Lock s={10}/>{` Private. ${N.Them} never sees this.`}</small>{!full && <button className="btn sm ghost" onClick={() => (location.hash = "#journal")}>Open journal<Ic.Arrow s={12}/></button>}</span></div>
      <div className="db-jg">
        <div className="db-chat">
          <div className="db-jm">{[["log", "Log something"], ["help", "Ask for help"]].map(([k, l]) => <button key={k} className={mode === k ? "on" : ""} onClick={() => setMode(k)}>{l}</button>)}</div>
          <div className="db-msgs" ref={log}>
            {!msgs.length && <div className="db-intro"><b>{mode === "log" ? "Need to get something down?" : "Need help?"}</b><p>{mode === "log" ? "Tell me what happened, in your own words. I'll keep a dated, neutral record you can share with a solicitor or mediator if you ever need to." : "Ask me about your tasks, what comes next, or how to approach a decision. I'm not a solicitor, but I'll tell you when you need one."}</p></div>}
            {msgs.map((m, i) => <div key={i} className={"db-msg " + (m.role === "user" ? "me" : "ai") + (m.err ? " err" : "")}>{m.role !== "user" && <span className="who">D</span>}<div><p>{m.content}</p>{m.entry && <span className="db-saved"><Ic.Check s={10} w={3}/>{`Logged · ${m.entry.t}`}</span>}</div></div>)}
            {busy && <div className="db-msg ai"><span className="who">D</span><div><span className="db-dots"><i></i><i></i><i></i></span></div></div>}
          </div>
          <div className="db-sugg">{PROMPTS[mode].map((p) => <button key={p} disabled={busy} onClick={() => (mode === "log" ? setTxt(p + ". ") : send(p))}>{p}</button>)}</div>
          <form className="db-in" onSubmit={(e) => { e.preventDefault(); send(); }}><textarea rows={2} value={txt} placeholder={mode === "log" ? "What happened? When, and who was there?" : "Ask anything about your case"} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} aria-label="Message"/><button className="btn" disabled={!txt.trim() || busy}>Send<Ic.Arrow s={13}/></button></form>
        </div>
        <aside className="db-jl">
          {watch.length > 0 && <div className="db-watch"><b>{`Keeping an eye on ${watch.length} thing${watch.length > 1 ? "s" : ""}`}</b><span>If this becomes a pattern, it may be worth telling a solicitor or mediator. Your log helps.</span></div>}
          <div className="db-jh"><b>{full ? "Every entry" : "Your journal"}</b><small>{`${entries.length} entr${entries.length === 1 ? "y" : "ies"}`}</small></div>
          {full && <div className="db-chips sm">{[["all", "All"], ["watch", "Watching"], ...Object.entries(CATS).map(([k, v]) => [k, v[0]])].map(([k, l]) => <button key={k} className={cf === k ? "on" : ""} onClick={() => setCf(k)}>{l}</button>)}</div>}
          <div className="db-je">{months.map((mo) => <React.Fragment key={mo || "x"}>{mo && <div className="db-mo">{new Date(mo + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>}{shown.filter((e) => !mo || e.d.startsWith(mo)).map(Ent)}</React.Fragment>)}{!shown.length && <p className="db-empty">Nothing here yet.</p>}</div>
          <button className="lnk" onClick={() => say("Journal exported", "PDF with dates · prototype")}>Export as PDF</button>
        </aside>
      </div>
    </section>;
  }
  function JournalPage({ N, sc, tasks, say }) {
    const TIPS = [["Write it soon", "The same day if you can. Dates and times matter more than detail."], ["Stick to facts", "What was said and done, who was there. Leave out how you'd describe them."], ["Note the children", "Anything they saw or heard, and how they seemed afterwards."], ["Keep receipts", "Money that moved, messages, missed handovers. Upload them to the vault."]];
    return <div className="rc-main db-main">
      <window.DBHead c="#9D174D" tab="JOURNAL & HELP · PRIVATE" k="Your journal" h={<>Journal <em>& help.</em></>} p={`A private, dated record of what happens, and someone to ask when you're stuck. ${N.Them} never sees any of it. If you ever need it, you can export it for a solicitor or mediator.`}/>
      <Journal N={N} sc={sc} tasks={tasks} say={say} full/>
      <section className="paper pp-card db-card"><div className="db-ch"><div className="pq-k">Keeping a useful record</div></div><div className="db-tips">{TIPS.map(([t, s]) => <div key={t}><b>{t}</b><span>{s}</span></div>)}</div>
        <div className="db-safe"><Ic.Shield s={15}/><span><b>If you feel unsafe</b>Call 999 in an emergency. The National Domestic Abuse Helpline is free and open 24 hours: 0808 2000 247.</span></div></section>
    </div>;
  }
  Object.assign(window, { DBJournal: Journal, DBJournalPage: JournalPage });
})();
