/* MVP 03 · To-do list (made from the guide's stage and children) and a private journal with an AI companion ("Talk it through"). */
(function () {
  const { useState, useEffect, useRef } = React;
  const K = window.KIT, Ic = window.KIc;
  const tool = (id) => K.TOOLS.find((t) => t.id === id);

  function tasks(stage, kids) {
    const T = [
      ["now", "fit", "Check whether doing it yourselves is right for you", "Five minutes. It tells you plainly if you should get advice first.", { tool: "fit" }],
      ["now", "list", "Start a list of everything you own and owe", "Rough figures are fine for now. Your financial statement firms them up.", { tool: "statement" }],
      ["now", "cetv", "Ask for your pension valuations", "Ask each provider for a cash equivalent transfer value (CETV). It’s usually free once a year, and can take weeks."],
      kids && ["now", "tell", "Plan what you’ll tell the children", "Together, if you can. Keep it simple, and make sure they know it isn’t their fault.", { tool: "kids" }],
      ["now", "pw", "Change the passwords on your own accounts", "If you’ve shared devices or passwords, change them and turn on two-step sign-in."],
      ["soon", "miam", "Find out about a first mediation meeting (MIAM)", "You usually need one before applying to court about money or children. Many couples use mediation anyway."],
      kids && ["soon", "plan", "Agree the children’s arrangements", "Where they live, handovers and holidays, in a parenting plan.", { tool: "kids" }],
      ["soon", "fs", "Fill in your financial statement", "Every figure with a date and a document. It’s what everything else is built on.", { tool: "statement" }],
      ["soon", "credit", "Check your credit report", "See every loan and card in your name, including joint ones you’d forgotten."],
      ["later", "split", "Try out splits in the planner", "See how a court would likely see each option, before you talk numbers.", { tool: "split" }],
      ["later", "will", "Update your will and pension nominations", "Separating doesn’t change them automatically."],
      stage !== "filed" && ["later", "div", "Apply for the divorce", "Online at gov.uk. The court fee is about £600. It can run alongside sorting the money."],
    ].filter(Boolean);
    return T.map(([g, id, t, why, x]) => ({ g, id, t, why, ...(x || {}) }));
  }
  const GROUPS = [["now", "Do now"], ["soon", "Coming up"], ["later", "When you can"]];
  const CATS = [["feel", "Feelings", "#A16207"], ["money", "Money", "#4338CA"], ["kids", "Children", "#9D174D"], ["home", "Home", "#0369A1"], ["event", "Something happened", "#B91C1C"]];
  const SEED = [
    { id: "e1", d: "2026-10-12", cat: "money", t: "Money moved from joint savings", s: "£2,000 moved from the joint ISA to an account in Mark’s name. He hadn’t mentioned it. Screenshot saved." },
    { id: "e2", d: "2026-10-09", cat: "kids", t: "Late handover", s: "Mark collected Ella and Sam at 7.40pm, not 6pm as agreed. No message beforehand." },
    { id: "e3", d: "2026-10-05", cat: "feel", t: "Told my sister", s: "Told Kate what’s happening. Felt lighter afterwards. She’s offered to help with school runs." },
  ];
  const pretty = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  function Todo({ st, up }) {
    const list = tasks(K.stage(), K.kids()), [txt, setTxt] = useState(""), [why, setWhy] = useState(null);
    const all = [...list, ...(st.mine || []).map((m) => ({ ...m, g: "now", mine: true }))];
    const doneN = all.filter((x) => st.done[x.id]).length;
    const tick = (x) => { const v = !st.done[x.id]; up({ done: { ...st.done, [x.id]: v } }); K.setStatus("todo", "started"); if (v) K.progress(); if (v) K.log("todo-done", x.t, "task", "done", { step: "To-do" }); };
    const add = (e) => { e.preventDefault(); if (!txt.trim()) return; up({ mine: [...(st.mine || []), { id: "m" + Date.now(), t: txt.trim() }] }); setTxt(""); K.log("todo-add", "Added their own task", "task", "added", { step: "To-do" }); };
    return (
      <div className="td-cols">
        <div>
          {GROUPS.map(([g, l]) => { const xs = all.filter((x) => x.g === g); return xs.length ? (
            <section key={g} className="td-grp"><h3><span>{l}</span><i>{xs.filter((x) => st.done[x.id]).length} of {xs.length}</i></h3>
              {xs.map((x) => <div key={x.id} className={"td-item" + (st.done[x.id] ? " done" : "")}>
                <button type="button" className="td-box" role="checkbox" aria-checked={!!st.done[x.id]} aria-label={x.t} onClick={() => tick(x)}>{st.done[x.id] && <Ic.Check s={13} w={2.6} c="#FFF"/>}</button>
                <div className="tx"><b>{x.t}</b>{why === x.id && <p>{x.why}</p>}</div>
                <div className="ac">{x.why && <button type="button" className="td-q" aria-label="Why this matters" aria-expanded={why === x.id} onClick={() => setWhy(why === x.id ? null : x.id)}>?</button>}{x.tool && <button type="button" className="btn ghost sm" onClick={() => K.open(tool(x.tool).file)}>Open <Ic.Arrow s={12}/></button>}</div>
              </div>)}
            </section>) : null; })}
          <form className="td-add" onSubmit={add}><Ic.Plus s={15}/><input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Add something of your own" aria-label="Add a task"/><button type="submit" className="btn sm" disabled={!txt.trim()}>Add</button></form>
        </div>
        <aside className="td-side">
          <div className="td-card"><span className="lbl">Your progress</span><b className="serif">{doneN} of {all.length} done</b><div className="td-bar"><i style={{ width: (100 * doneN / Math.max(1, all.length)) + "%" }}></i></div><p>Made from your guide: {K.STAGE_L[K.stage()].toLowerCase()}{K.kids() ? ", with children" : ""}. It changes as you go.</p></div>
          <div className="td-card"><span className="lbl">Why the order?</span><p>Safety and support first, then the children, then the money. Getting the facts straight before talking about a split takes the heat out of it.</p></div>
        </aside>
      </div>
    );
  }

  function sys(mode) {
    const P = K.PERSONA;
    return `You are the journal companion in Decouple, a UK (England and Wales) divorce toolkit. You are talking to ${P.me}, who is separating from ${P.them}. ${K.STAGE_L[K.stage()]}. ${K.kids() ? P.kidsL + "." : "No children under 18."}
She has written a private journal entry and wants to talk it through. Reflect back what you hear in one or two warm sentences. Then help with one thing: noticing a pattern, a practical next step, or how to write it down factually if it might matter later (what happened, when, who was there, any evidence). Ask at most one gentle question.
Never judge ${P.them}. Never give legal advice or predict outcomes; if something needs a solicitor, say so briefly.
SAFETY: if she mentions violence, threats, fear, control, or harm to the children, put safety first: call 999 in danger, and the National Domestic Abuse Helpline 0808 2000 247 (free, 24 hours).
Under 110 words. British spelling. No emoji. Plain text only.`;
  }

  function Companion({ entry, onClose }) {
    const [msgs, setMsgs] = useState([]), [txt, setTxt] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [safe, setSafe] = useState(false), ref = useRef(null);
    useEffect(() => { if (entry) send(`My journal entry, ${pretty(entry.d)}: “${entry.t}”. ${entry.s}`, true); }, []);
    useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [msgs, busy]);
    async function send(m, first) {
      m = (m || txt).trim(); if (!m || busy) return;
      if (window.KitSafeRe.test(m)) setSafe(true);
      const hist = [...msgs, { role: "user", content: m, hide: first }]; setMsgs(hist); setTxt(""); setBusy(true); setErr("");
      K.log("journal-talk", "Talked an entry through", "ai", first ? "opened" : "message", { step: "Journal · companion" });
      try { const r = await window.KitAI(sys(), hist.slice(-10).map((x) => ({ role: x.role, content: x.content })), 400); setMsgs([...hist, { role: "assistant", content: String(r).trim() }]); }
      catch (e) { setErr("The companion works in the design preview for now. On the live site it needs a small server piece first."); }
      setBusy(false);
    }
    return (
      <div className="td-comp" role="dialog" aria-label="Talk it through">
        <div className="hd"><span className="kit-tic" style={{ background: "#F3EEFE", color: "#5B21B6" }}><Ic.Chat s={16}/></span><div><b className="serif">Talk it through</b><small>Private. Not legal advice.</small></div><button type="button" className="kit-x" style={{ position: "static" }} aria-label="Close" onClick={onClose}><Ic.X s={15}/></button></div>
        <div className="log" ref={ref}>
          {entry && <div className="td-quote"><small>{pretty(entry.d)}</small><b>{entry.t}</b><p>{entry.s}</p></div>}
          {safe && <window.KitSafety/>}
          {msgs.filter((m) => !m.hide).map((m, i) => <div key={i} className={"msg " + m.role}>{m.content}</div>)}
          {busy && <div className="msg assistant typing"><i></i><i></i><i></i></div>}
          {err && <div className="td-err">{err}</div>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }}><input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Say more, or ask something" aria-label="Message"/><button type="submit" aria-label="Send" disabled={busy}><Ic.Arrow s={15}/></button></form>
      </div>
    );
  }

  function Journal({ st, up }) {
    const entries = st.entries || SEED;
    const [cat, setCat] = useState("feel"), [t, setT] = useState(""), [s, setS] = useState(""), [d, setD] = useState(new Date().toISOString().slice(0, 10)), [talk, setTalk] = useState(null), [f, setF] = useState("all");
    const save = () => { if (!s.trim()) return; const e = { id: "e" + Date.now(), d, cat, t: t.trim() || CATS.find((c) => c[0] === cat)[1], s: s.trim() }; up({ entries: [e, ...entries] }); setT(""); setS(""); K.setStatus("todo", "started"); K.progress(); K.log("journal-add", "Wrote a journal entry", "journal", cat, { step: "Journal" }); };
    const C = (k) => CATS.find((c) => c[0] === k);
    const shown = entries.filter((e) => f === "all" || e.cat === f);
    return (
      <div className="td-cols">
        <div>
          <div className="td-new">
            <div className="kit-ch">{CATS.map(([k, l]) => <button type="button" key={k} className={cat === k ? "on" : ""} onClick={() => setCat(k)}>{l}</button>)}</div>
            {cat === "event" && <p className="td-tip"><Ic.Pen s={14}/> Write what happened, when, and who was there. Keep it factual, and note any evidence. It may be useful later.</p>}
            <div className="row"><input value={t} onChange={(e) => setT(e.target.value)} placeholder="A short title (optional)" aria-label="Title"/><input type="date" value={d} onChange={(e) => setD(e.target.value)} aria-label="Date"/></div>
            <textarea value={s} onChange={(e) => setS(e.target.value)} placeholder="What’s on your mind?" aria-label="Entry"></textarea>
            <div className="ft"><span><Ic.Lock s={13}/> Only you can see your journal</span><div><button type="button" className="btn ghost sm" disabled={!s.trim()} onClick={() => setTalk({ id: "draft", d, t: t || "New entry", s })}>Talk it through</button><button type="button" className="btn sm" disabled={!s.trim()} onClick={save}>Save entry</button></div></div>
          </div>
          <div className="td-filt">{[["all", "All"], ...CATS.map(([k, l]) => [k, l])].map(([k, l]) => <button type="button" key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>)}</div>
          <div className="td-entries">{shown.map((e) => <article key={e.id} className="td-entry" style={{ "--c": C(e.cat)[2] }}>
            <div className="hd"><span className="cat">{C(e.cat)[1]}</span><small>{pretty(e.d)}</small></div>
            <b className="serif">{e.t}</b><p>{e.s}</p>
            <div className="ft"><button type="button" className="kit-lnk" onClick={() => setTalk(e)}>Talk it through</button><button type="button" className="kit-lnk" onClick={() => up({ entries: entries.filter((x) => x.id !== e.id) })}>Delete</button></div>
          </article>)}{!shown.length && <p className="td-none">Nothing here yet.</p>}</div>
        </div>
        <aside className="td-side">
          {talk ? <Companion key={talk.id + talk.s.length} entry={talk} onClose={() => setTalk(null)}/> : <>
            <div className="td-card"><span className="lbl">Your journal</span><b className="serif">{entries.length} entries</b><p>Never shared, even if you invite {K.PERSONA.them} into another tool. Delete any entry, or all of them, whenever you like.</p></div>
            <div className="td-card"><span className="lbl">Talk it through</span><p>Open any entry with the companion. It listens, helps you spot patterns, and helps you write things down factually.</p></div>
          </>}
        </aside>
      </div>
    );
  }

  Object.assign(window, { TDTodo: Todo, TDJournal: Journal, TD: { tasks, SEED } });
})();
