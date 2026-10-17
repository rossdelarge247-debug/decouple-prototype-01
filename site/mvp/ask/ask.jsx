/* MVP 07 · Ask: the AI sounding board, five modes. Fixed system prompts, a curated source list, JSON answers with sources,
   safety first, thumbs up or down on every answer. Runs on window.claude.complete here; the live site needs the /api/claude proxy. */
(function () {
  const { useState, useEffect, useRef } = React;
  const K = window.KIT, Ic = window.KIc;
  const LIB = {
    divorce: ["Get a divorce", "GOV.UK", "https://www.gov.uk/divorce"],
    money: ["Money and property when you divorce or separate", "GOV.UK", "https://www.gov.uk/money-property-when-relationship-ends"],
    kids: ["Making child arrangements if you divorce or separate", "GOV.UK", "https://www.gov.uk/looking-after-children-divorce"],
    cms: ["Calculate child maintenance", "GOV.UK", "https://www.gov.uk/calculate-child-maintenance"],
    aid: ["Check if you can get legal aid", "GOV.UK", "https://www.gov.uk/check-legal-aid"],
    fmc: ["Family mediation", "Family Mediation Council", "https://www.familymediationcouncil.org.uk/"],
    mh: ["Divorce and separation", "MoneyHelper", "https://www.moneyhelper.org.uk/en/family-and-care/divorce-and-separation"],
    ca: ["Family", "Citizens Advice", "https://www.citizensadvice.org.uk/family/"],
    cafcass: ["Help for parents", "Cafcass", "https://www.cafcass.gov.uk/"],
    res: ["Find a family law professional", "Resolution", "https://resolution.org.uk/"],
  };
  const MODES = {
    ask: { t: "Ask anything", d: "Plain answers, with the sources to check them.", ic: "Chat", ph: "Ask a question", sug: ["Do we have to go to mediation?", "How are pensions split?", "What is a consent order?", "Do I have to sell the house?", "How long does it all take?"] },
    meet: { t: "Get ready for a meeting", d: "What to bring, what to ask, and what it may cost.", ic: "Cal", opts: ["A first mediation meeting (MIAM)", "A first meeting with a solicitor", "A meeting with a financial adviser", "Talking to Mark about money"] },
    explain: { t: "Explain this letter", d: "Paste a letter or form. Get what it means and what it asks of you.", ic: "Doc", ph: "Paste the letter here. Take out names, addresses and reference numbers first." },
    calm: { t: "Say it calmly", d: "Rewrite a message to your partner so it’s clear, brief and calm.", ic: "Pen", ph: "Write the message you want to send" },
    talk: { t: "Talk it through", d: "Somewhere to think out loud. It listens, and helps you find a next step.", ic: "Help", ph: "What’s on your mind?", sug: ["I keep wondering if I’m doing the right thing", "Today was hard", "I’m dreading telling the children"] },
  };
  const EX = {
    explain: "Dear Mrs Mitchell,\n\nWe act for your husband in relation to the financial matters arising from your separation. Our client proposes that both parties exchange full financial disclosure by way of Form E within 28 days of the date of this letter.\n\nOur client would also welcome your proposals for the children’s arrangements. He is willing to attend mediation and invites you to contact a mediator to arrange a MIAM.\n\nIf we do not hear from you within 14 days, our client may consider making an application to the court using Form A.\n\nYours sincerely,\nHartley & Co Solicitors",
    calm: "Mark, you were nearly two hours late AGAIN on Friday. The kids were waiting by the door with their bags. If you can’t be bothered to turn up on time then maybe you shouldn’t have them at all.",
  };

  function ctx() {
    const P = K.PERSONA;
    return `The user is ${P.me}, in England. ${P.status}, separating from ${P.them}. Stage: ${K.STAGE_L[K.stage()]}. ${K.kids() ? P.kidsL + ", living mostly with her." : "No children under 18."} Home: ${P.home.toLowerCase()}.`;
  }
  const RULES = `You are Ask, inside Decouple, a free divorce toolkit for England and Wales. ${"{CTX}"}
Rules: give general information that is well established and consistent with these sources, and cite one to three by id: ${Object.entries(LIB).map(([k, v]) => `${k} = ${v[1]}: ${v[0]}`).join("; ")}.
Never predict what a court will order or what someone "will get". Never tell them what they legally should do; say plainly when a solicitor or mediator should advise. If rules differ in Scotland or Northern Ireland and it matters, say so.
SAFETY: if they mention violence, threats, fear, control, self-harm or harm to children, start with safety: 999 in danger, the National Domestic Abuse Helpline 0808 2000 247 (free, 24 hours), Samaritans 116 123.
British spelling. Plain English. Warm, calm and brief. No emoji. Respond ONLY with JSON, no other text.`;
  const SHAPE = {
    ask: `{"answer": string (under 140 words, short paragraphs separated by \\n\\n), "sources": [ids], "pro": boolean (true if this really needs a solicitor or mediator), "tool": null | "fit"|"todo"|"kids"|"statement"|"split" (a toolkit tool that would help next)}`,
    meet: `{"intro": string (one sentence), "sections": [{"t": "What to bring"|"Questions to ask"|"What it may cost"|"What happens next", "items": [string, up to 5 each, short]}], "sources": [ids]}`,
    explain: `{"summary": string (two or three sentences, plain English), "asks": [string, what it asks them to do], "deadline": string|null, "terms": [{"term": string, "means": string}], "next": string (one calm suggestion, including getting advice if it’s from a solicitor), "sources": [ids]}`,
    calm: `{"rewrite": string (the calmer message: brief, informative, friendly, firm; keep their meaning), "changes": [string, up to 4 short notes on what changed and why]}`,
    talk: `{"reply": string (under 110 words: reflect back what you hear in one or two sentences, then one gentle question or one small next step)}`,
  };
  const sysFor = (m) => RULES.replace("{CTX}", ctx()) + "\nShape: " + SHAPE[m];
  const parse = (raw) => { const s = String(raw); try { return JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1)); } catch (e) { return null; } };

  const Sources = ({ ids }) => (ids && ids.length ? <div className="ak-src"><span className="lbl">Sources</span>{ids.filter((i) => LIB[i]).map((i) => <a key={i} href={LIB[i][2]} target="_blank" rel="noopener"><b>{LIB[i][1]}</b>{LIB[i][0]}<Ic.Ext s={11}/></a>)}</div> : null);

  function Rate({ mode, i }) {
    const [v, setV] = useState(null);
    const go = (x) => { setV(x); K.log("ask-rate", "Was this helpful? · " + MODES[mode].t, "thumbs", x, { step: "Ask · " + mode }); };
    return <div className="ak-rate"><span>Not legal advice. Check the sources, or ask a professional.</span><div>{v ? <small>Thanks for telling us.</small> : <><button type="button" aria-label="Helpful" onClick={() => go("up")}><Ic.Up s={14}/></button><button type="button" aria-label="Not helpful" onClick={() => go("down")}><Ic.Up s={14} style={{ transform: "rotate(180deg)" }}/></button></>}</div></div>;
  }

  function Answer({ m, d, i }) {
    if (!d) return null;
    const tool = d.tool && K.TOOLS.find((t) => t.id === d.tool);
    return (
      <div className="ak-ans">
        {m === "ask" && <>{String(d.answer || "").split(/\n\n+/).map((p, j) => <p key={j}>{p}</p>)}{d.pro && <div className="ak-pro"><Ic.Users s={14}/> This is one to check with a solicitor or mediator.</div>}{tool && <button type="button" className="ak-tool" onClick={() => K.open(tool.file)}><window.KitToolIc tool={tool} s={15}/><span>This might help next<b>{tool.t}</b></span><Ic.Arrow s={14}/></button>}</>}
        {m === "meet" && <>{d.intro && <p>{d.intro}</p>}<div className="ak-secs">{(d.sections || []).map((s) => <div key={s.t}><b>{s.t}</b><ul>{(s.items || []).map((x) => <li key={x}>{x}</li>)}</ul></div>)}</div></>}
        {m === "explain" && <><p className="lead">{d.summary}</p>{d.deadline && <div className="ak-dl"><Ic.Cal s={14}/> <b>Deadline:</b> {d.deadline}</div>}{(d.asks || []).length > 0 && <div className="ak-blk"><b>What it asks you to do</b><ul>{d.asks.map((x) => <li key={x}>{x}</li>)}</ul></div>}{(d.terms || []).length > 0 && <div className="ak-blk"><b>Words you might not know</b><dl>{d.terms.map((x) => <div key={x.term}><dt>{x.term}</dt><dd>{x.means}</dd></div>)}</dl></div>}{d.next && <p className="next"><b>A calm next step:</b> {d.next}</p>}</>}
        {m === "calm" && <><div className="ak-rew"><span className="lbl">A calmer version</span><p>{d.rewrite}</p><button type="button" className="kit-lnk" onClick={() => navigator.clipboard && navigator.clipboard.writeText(d.rewrite)}>Copy it</button></div>{(d.changes || []).length > 0 && <ul className="ak-ch">{d.changes.map((x) => <li key={x}>{x}</li>)}</ul>}</>}
        {m === "talk" && <p>{d.reply}</p>}
        <Sources ids={d.sources}/>
        <Rate mode={m} i={i}/>
      </div>
    );
  }

  function Panel({ mode, q0 }) {
    const M = MODES[mode], [msgs, setMsgs] = useState([]), [txt, setTxt] = useState(q0 || ""), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [opt, setOpt] = useState(M.opts ? M.opts[0] : ""), ref = useRef(null);
    useEffect(() => { if (q0) ask(q0); }, []);
    useEffect(() => { if (ref.current && msgs.length) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs, busy]);
    async function ask(q) {
      q = String(q || "").trim(); if (!q || busy) return;
      const safe = window.KitSafeRe.test(q), hist = [...msgs, { role: "user", content: q, safe }];
      setMsgs(hist); setTxt(""); setBusy(true); setErr(""); K.setStatus("ask", "started");
      K.log("ask-q", MODES[mode].t, "ai", mode === "meet" ? opt : (M.sug || []).includes(q) && !safe ? q : "(question not sent)", { step: "Ask · " + mode });
      const multi = mode === "ask" || mode === "talk", send = (multi ? hist.slice(-8) : hist.slice(-1)).map((x) => ({ role: x.role, content: x.role === "assistant" ? JSON.stringify(x.data) : x.content }));
      try { const raw = await window.KitAI(sysFor(mode), send, 900), d = parse(raw) || (mode === "talk" ? { reply: String(raw) } : mode === "ask" ? { answer: String(raw) } : null); if (!d) throw new Error("shape"); setMsgs([...hist, { role: "assistant", data: d }]); }
      catch (e) { setErr(e.message === "offline" ? "Ask works in the design preview for now. On the live site it needs a small server piece first." : "Something went wrong. Try asking again."); }
      setBusy(false);
    }
    const meetQ = () => ask(`Help me get ready for: ${opt}.`);
    return (
      <section className="ak-panel">
        <div className="ak-ph"><span className="kit-tic" style={{ background: "#F3EEFE", color: "#5B21B6" }}>{React.createElement(Ic[M.ic] || Ic.Chat, { s: 17 })}</span><div><h2 className="serif">{M.t}</h2><p>{M.d}</p></div></div>
        <div className="ak-ctx"><span><Ic.Lock s={12}/> Knows from your guide:</span>{[K.STAGE_L[K.stage()], K.PERSONA.status, K.kids() ? K.PERSONA.kidsL : "No children under 18", "England"].map((x) => <i key={x}>{x}</i>)}</div>
        <div className="ak-log" ref={ref}>
          {msgs.length === 0 && M.sug && <div className="ak-sug">{M.sug.map((s) => <button type="button" key={s} onClick={() => ask(s)}>{s}</button>)}</div>}
          {msgs.length === 0 && mode === "meet" && <div className="ak-meet"><div className="kit-ch col">{M.opts.map((o) => <button type="button" key={o} className={opt === o ? "on" : ""} onClick={() => setOpt(o)}>{o}</button>)}</div><button type="button" className="btn lg" disabled={busy} onClick={meetQ}>Get me ready <Ic.Arrow s={15}/></button></div>}
          {msgs.map((x, i) => x.role === "user"
            ? <div key={i}>{x.safe && <window.KitSafety/>}<div className={"ak-u" + (mode === "explain" || mode === "calm" ? " long" : "")}>{x.content}</div></div>
            : <Answer key={i} m={mode} d={x.data} i={i}/>)}
          {busy && <div className="ak-busy"><i></i><i></i><i></i><span>Checking the sources</span></div>}
          {err && <div className="td-err ak-err">{err}</div>}
        </div>
        {mode !== "meet" && (mode === "explain" || mode === "calm" ? (
          <div className="ak-big">
            <textarea value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={M.ph} aria-label={M.ph}></textarea>
            <div className="ft"><button type="button" className="kit-lnk" onClick={() => setTxt(EX[mode])}>Use an example</button><span><Ic.Lock s={12}/> Not kept, and never shared</span><button type="button" className="btn" disabled={!txt.trim() || busy} onClick={() => ask(txt)}>{mode === "explain" ? "Explain it" : "Make it calmer"} <Ic.Arrow s={14}/></button></div>
          </div>
        ) : (
          <form className="ak-in" onSubmit={(e) => { e.preventDefault(); ask(txt); }}><input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={M.ph} aria-label={M.ph}/><button type="submit" aria-label="Ask" disabled={busy || !txt.trim()}><Ic.Arrow s={16}/></button></form>
        ))}
        {mode === "meet" && msgs.length > 0 && <div className="ak-again"><button type="button" className="kit-lnk" onClick={() => setMsgs([])}>Get ready for a different meeting</button></div>}
      </section>
    );
  }

  Object.assign(window, { AK: { MODES, LIB }, AKPanel: Panel });
})();
