/* MVP 01 · your statement, the invite, the shared statement, agreeing, and the outputs */
(function () {
  const { useState, useEffect, useMemo } = React;
  const Ic = window.DIc, MS = window.MS;
  const Pill = ({ s, sm }) => <span className={"ms-st" + (sm ? " sm" : "")} style={{ color: MS.ST[s].c, background: MS.ST[s].bg }}>{MS.ST[s].t}</span>;
  const who = (r, N) => (r.whose === "joint" ? "Joint" : r.whose === "a" ? N.me : N.them);

  /* ── your statement (solo) ── */
  function Mine({ st, up, N, onInvite, onEdit }) {
    const rs = MS.rows(st, null, {}), t = MS.totals(rs), list = MS.todo(st, null, "a");
    const setDoc = (id, d) => up((o) => ({ ...o, items: o.items.map((x) => (x.id === id.replace(/:m$/, "") ? (id.endsWith(":m") ? { ...x, docM: d } : { ...x, doc: d }) : x)) }));
    const docs = st.items.reduce((n, x) => n + (x.doc ? 1 : 0) + (x.docM ? 1 : 0), 0), need = docs + list.length;
    return (
      <div className="ms-wrap">
        <div className="ms-head">
          <div><div className="kick">Your side · private</div><h1 className="serif">Your statement, <span className="em">{N.me}.</span></h1><p>Only you can see this. Check it, add documents as you get them, then invite {N.them} when you’re ready.</p></div>
          <div className="ms-head-a"><button className="btn ghost" onClick={() => onEdit("about")}>Edit answers</button><button className="btn lg" onClick={onInvite}>Invite {N.them} <Ic.Arrow s={15}/></button></div>
        </div>
        <div className="ms-cols">
          <div className="ms-sheet">
            <div className="ms-sum">
              <div><small>You own</small><b>{MS.gbp(t.a.assets)}</b></div><div><small>Joint, before splitting</small><b>{MS.gbp(t.joint.assets - t.joint.debts)}</b></div><div><small>Your pensions</small><b>{MS.gbp(t.a.pensions)}</b></div><div><small>You owe</small><b>{MS.gbp(t.a.debts)}</b></div><div><small>Income a month</small><b>{MS.gbp(t.a.income)}</b></div>
            </div>
            {MS.CATS.map((c) => { const r = rs.filter((x) => x.cat === c.id); return (
              <div key={c.id} className="ms-sec">
                <div className="ms-sec-h"><h3>{c.t}</h3><span>{c.form}</span><button className="lnk" onClick={() => onEdit(c.id)}>Edit</button></div>
                {r.length ? r.map((x) => (
                  <div key={x.id} className="ms-ln solo">
                    <span className="l"><b>{x.sub ? x.sub + " · " : ""}{x.label}</b><small>{x.whose === "joint" ? "Joint" : "Yours"} · {MS.srcLabel(c.id, x.a.src)} · {MS.month(x.a.asOf)}</small></span>
                    <span className={"v" + (x.debt || c.id === "debts" ? " neg" : "")}>{x.va == null ? "To find" : MS.gbp(x.va)}{c.id === "income" && x.va != null ? <small>/mo</small> : null}</span>
                    <Pill s={x.status} sm/>
                  </div>
                )) : <div className="ms-none">{st.a["has_" + c.id] === "no" ? "You said you don’t have any." : "Nothing added."}</div>}
              </div>
            ); })}
            {!!(st.hints || []).length && <div className="ms-sec private"><div className="ms-sec-h"><h3>What you think {N.them} has</h3><span><Ic.Lock s={11}/> Never shared</span></div>{st.hints.map((h) => <div key={h.id} className="ms-ln solo"><span className="l"><b>{h.label}</b><small>Your guess</small></span><span className="v">{h.guess ? "~" + MS.gbp(h.guess) : "Not sure"}</span><span></span></div>)}</div>}
          </div>
          <aside className="ms-rail">
            <div className="ms-card">
              <div className="ms-card-h"><b>Documents to add</b><span>{docs} of {need}</span></div>
              <div className="ms-bar"><i style={{ width: (need ? (docs / need) * 100 : 100) + "%" }}></i></div>
              <p className="ms-note">You can invite {N.them} before these are done. They’re needed before you both agree it’s complete.</p>
              <div className="ms-todo">{list.map((x) => <div key={x.id}><span><b>{x.t}</b><small>{x.d}</small></span>{x.kind !== "figure" && <window.MSDoc onDoc={(d) => setDoc(x.id, d)} label="Add"/>}</div>)}{!list.length && <div className="ms-none">All done.</div>}</div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  /* ── invite: safety first ── */
  function Invite({ st, up, N, onBack, onSent }) {
    const [step, setStep] = useState(st.a.safe ? 1 : 0), [email, setEmail] = useState(st.inviteTo || "");
    const set = (id, v) => up((o) => ({ ...o, a: { ...o.a, [id]: v } }));
    if (step === 0) {
      if (st.a.safe && window.IV.safetyStop(st.a)) return <main className="iv-body"><window.IVStop onBack={() => set("safe", undefined)}/></main>;
      return (
        <main className="iv-body"><div className="ms-narrow">
          <div className="iv-kick" style={{ "--c": "#5B21B6" }}>Before you invite {N.them}</div>
          <h2 className="iv-h">First, a quick safety check.</h2>
          <p className="iv-help">Sharing finances with someone can be risky if you don’t feel safe with them. Your answer stays private.</p>
          <div className="qs"><window.IVSafeQ a={st.a} set={set}/></div>
          <div className="iv-nav desk"><button className="back" onClick={onBack}><Ic.Arrow s={14} style={{ transform: "rotate(180deg)" }}/> Back</button><button className="btn lg" disabled={!st.a.safe} onClick={() => (window.IV.safetyStop(st.a) ? null : setStep(1))}>Continue <Ic.Arrow s={15}/></button></div>
        </div></main>
      );
    }
    return (
      <main className="iv-body"><div className="ms-narrow">
        <div className="iv-kick" style={{ "--c": "#5B21B6" }}>Invite {N.them}</div>
        <h2 className="iv-h">What {N.them} will see, and what they won’t.</h2>
        <div className="ms-see">
          <div><b><Ic.Check s={13} w={2.4} c="#047857"/> Shared when you both finish</b><ul><li>Everything in your statement, with its figures and dates</li><li>Which documents you’ve added (they can open them)</li><li>Comments you write on a line</li></ul></div>
          <div><b><Ic.Lock s={13} c="#991B1B"/> Never shared</b><ul><li>What you think {N.them} has. It’s only used to flag gaps.</li><li>Your address and phone number</li><li>Your safety answers</li></ul></div>
        </div>
        <p className="ms-note">{N.them} fills in their side first. Neither of you sees the other’s figures until you’ve both finished, so nobody adjusts theirs to match.</p>
        <label className="ms-fld" style={{ marginTop: 18 }}><span>{N.them}’s email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mark@example.com"/></label>
        <div className="ms-msg"><small>The email {N.them} gets</small><b>{N.me} has invited you to a shared financial statement</b><p>“{N.me} would like you both to fill in a financial statement, so you can check each other’s figures in one place instead of by email. You fill in yours first. Nothing of {N.me}’s is shown until you’ve finished.”</p></div>
        <div className="iv-nav desk"><button className="back" onClick={onBack}><Ic.Arrow s={14} style={{ transform: "rotate(180deg)" }}/> Back</button><button className="btn lg" disabled={!/^\S+@\S+\.\S+$/.test(email)} onClick={() => { up({ inviteTo: email, invited: true }); onSent(); }}>Send the invite <Ic.Arrow s={15}/></button></div>
      </div></main>
    );
  }
  function Waiting({ N, onDemo, onBack }) {
    return (
      <main className="iv-body"><div className="ms-narrow center">
        <div className="ms-wait"><span></span></div>
        <div className="kick">Invite sent</div>
        <h2 className="iv-h">Now it’s {N.them}’s turn.</h2>
        <p className="iv-help">We’ll email you when {N.them} has finished their side. Meanwhile, keep adding documents to yours.</p>
        <div className="ms-cta center"><button className="btn ghost" onClick={onBack}>Back to my statement</button></div>
        <div className="ms-proto"><span>Prototype</span><button onClick={onDemo}>Skip ahead: {N.them} has finished his side <Ic.Arrow s={13}/></button></div>
      </div></main>
    );
  }

  /* ── the shared statement ── */
  function Shared({ st, up, N, onAgree }) {
    const B = st.b, rs = useMemo(() => MS.rows(st, B, st.res), [st]);
    const [f, setF] = useState("all"), [sel, setSel] = useState(null), [txt, setTxt] = useState(""), [v, setV] = useState("");
    const openN = rs.filter(MS.open).length, unb = rs.filter((r) => r.status === "unbacked" || r.status === "unknown").length;
    const shown = rs.filter((r) => f === "all" || (f === "open" ? MS.open(r) : f === "doc" ? r.status === "unbacked" || r.status === "unknown" : !MS.open(r) && r.status !== "unbacked" && r.status !== "unknown"));
    const cur = rs.find((r) => r.id === sel) || shown.slice().sort((x, y) => MS.ST[x.status].rank - MS.ST[y.status].rank)[0];
    useEffect(() => { setV(""); setTxt(""); }, [cur && cur.id]);
    const th = (cur && st.threads[cur.id]) || [];
    const say = (t, w) => up((o) => ({ ...o, threads: { ...o.threads, [cur.id]: [...(o.threads[cur.id] || []), { w: w || "a", t, at: "Just now" }] } }));
    const resolve = (r) => up((o) => ({ ...o, res: { ...o.res, [cur.id]: r } }));
    const setMyDoc = (d) => { const id = cur.a.id, m = cur.debt; up((o) => ({ ...o, items: o.items.map((x) => (x.id === id ? (m ? { ...x, docM: d } : { ...x, doc: d }) : x)) })); };
    const addMine = () => { const h = cur.hint; up((o) => ({ ...o, items: [...o.items, { id: "u" + MS.rid(), cat: h.cat, kind: h.kind, label: MS.kindLabel(h.cat, h.kind), whose: "me", amount: null, unknown: true, asOf: "", src: "stmt", doc: null }], pos: h.cat })); };
    const markAdds = () => up((o) => ({ ...o, b: { ...o.b, items: [...o.b.items, MS.B_EX.late] }, threads: { ...o.threads, "b:b9": [{ w: "b", t: "Forgot this one, sorry. It’s from my last job. I’ve asked Aviva for a CETV.", at: "Just now" }] } }));
    const F = [["all", "Everything", rs.length], ["open", "Needs sorting", openN], ["doc", "To back up", unb], ["ok", "Settled", rs.length - openN - unb]];
    return (
      <div className="ms-wrap">
        <div className="ms-head">
          <div><div className="kick">Shared statement · {N.me} and {N.them}</div><h1 className="serif">{openN ? <>{openN} thing{openN === 1 ? "" : "s"} to <span className="em">sort out.</span></> : <>Everything <span className="em">lines up.</span></>}</h1><p>Both sides, in one place. Pick a line to see both figures, the documents, and what you’ve said about it.</p></div>
          <div className="ms-head-a"><button className="btn lg" onClick={onAgree} disabled={!!openN}>{openN ? "Sort the flagged lines first" : "We’re both satisfied"} <Ic.Arrow s={15}/></button></div>
        </div>
        <div className="ms-filt" role="tablist">{F.map(([k, l, n]) => <button key={k} role="tab" aria-selected={f === k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}<i>{n}</i></button>)}</div>
        <div className="ms-cols">
          <div className="ms-sheet">
            <div className="ms-ln th"><span>Item</span><span>{N.me}</span><span>{N.them}</span><span>Status</span></div>
            {MS.CATS.map((c) => { const r = shown.filter((x) => x.cat === c.id); if (!r.length) return null; return (
              <div key={c.id} className="ms-sec">
                <div className="ms-sec-h"><h3>{c.t}</h3><span>{c.form}</span></div>
                {r.map((x) => (
                  <button key={x.id} className={"ms-ln" + (cur && cur.id === x.id ? " sel" : "") + (MS.open(x) ? " flag" : "")} onClick={() => setSel(x.id)}>
                    <span className="l"><b>{x.sub ? x.sub + " · " : ""}{x.label}</b><small>{who(x, N)}{(st.threads[x.id] || []).length ? " · " + st.threads[x.id].length + " comment" + (st.threads[x.id].length === 1 ? "" : "s") : ""}</small></span>
                    <span className={"v" + (x.debt || c.id === "debts" ? " neg" : "")}>{x.whose === "b" ? "" : x.va == null ? (x.status === "missing" ? "Not listed" : "To find") : MS.gbp(x.va)}</span>
                    <span className={"v" + (x.debt || c.id === "debts" ? " neg" : "")}>{x.whose === "a" ? "" : x.vb == null ? (x.status === "missing" ? "Not listed" : "To find") : MS.gbp(x.vb)}</span>
                    <Pill s={x.status} sm/>
                  </button>
                ))}
              </div>
            ); })}
          </div>
          <aside className="ms-rail">
            {cur && (
              <div className="ms-card ms-detail">
                <div className="ms-card-h"><b>{cur.sub ? cur.sub + " · " : ""}{cur.label}</b><Pill s={cur.status}/></div>
                <div className="ms-two">
                  {cur.whose !== "b" && <div><small>{N.me}</small><b>{cur.va == null ? "—" : MS.gbp(cur.va)}</b>{cur.a && <span>{MS.srcLabel(cur.cat, cur.a.src)} · {MS.month(cur.a.asOf)}</span>}{cur.a && <i className={(cur.debt ? cur.a.docM : cur.a.doc) ? "ok" : ""}>{(cur.debt ? cur.a.docM : cur.a.doc) ? (cur.debt ? cur.a.docM : cur.a.doc).name : "No document yet"}</i>}</div>}
                  {cur.whose !== "a" && <div><small>{N.them}</small><b>{cur.vb == null ? "—" : MS.gbp(cur.vb)}</b>{cur.b && <span>{MS.srcLabel(cur.cat, cur.b.src)} · {MS.month(cur.b.asOf)}</span>}{cur.b && <i className={cur.b.doc ? "ok" : ""}>{cur.b.doc ? cur.b.doc.name : "No document yet"}</i>}</div>}
                </div>
                {cur.status === "mismatch" && (
                  <div className="ms-act">
                    <p>{MS.gbp(Math.abs(cur.va - cur.vb))} apart. Agree one figure, or get it valued independently.</p>
                    <div className="ms-act-b"><button onClick={() => resolve({ k: "agreed", v: cur.va })}>Use {N.me}’s {MS.gbp(cur.va)}</button><button onClick={() => resolve({ k: "agreed", v: cur.vb })}>Use {N.them}’s {MS.gbp(cur.vb)}</button><button onClick={() => resolve({ k: "agreed", v: Math.round((cur.va + cur.vb) / 2) })}>Split the difference</button></div>
                    <div className="ms-row"><div className="ms-money sm"><i>£</i><input inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} placeholder="Another figure"/></div><button className="btn sm" disabled={!v} onClick={() => resolve({ k: "agreed", v: Math.round(+v.replace(/[^\d.]/g, "")) })}>Agree this</button></div>
                    {cur.cat === "home" && !cur.debt && <p className="ms-note">Tip: many couples ask two local agents for a free appraisal and use the midpoint.</p>}
                  </div>
                )}
                {cur.status === "missing" && cur.side === "b" && (
                  <div className="ms-act">
                    <p>{cur.hint ? <>You think {N.them} has this{cur.guess ? <>, about <b>{MS.gbp(cur.guess)}</b></> : null}, but it isn’t in his statement. He won’t see your guess, only your question.</> : <>You listed this as joint, but {N.them} hasn’t.</>}</p>
                    <div className="ms-act-b"><button onClick={() => say(cur.hint ? `Do you have ${cur.hint.label.replace(/^Mark’s /, "a ")}? I think there might be one.` : `Did you leave out ${cur.label}? I’ve got it as joint.`)}>Ask {N.them} about it</button></div>
                    {cur.hint && (st.threads[cur.id] || []).length > 0 && <div className="ms-proto"><span>Prototype</span><button onClick={markAdds}>{N.them} replies and adds it <Ic.Arrow s={13}/></button></div>}
                  </div>
                )}
                {cur.status === "missing" && cur.side === "a" && (
                  <div className="ms-act">
                    <p>{N.them} thinks you have this{cur.guess ? <>, about <b>{MS.gbp(cur.guess)}</b></> : null}. Add it, or explain why it isn’t there.</p>
                    <div className="ms-act-b"><button onClick={addMine}>Add it to my statement</button></div>
                    <textarea value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="e.g. I cashed them in in 2024 to pay for the boiler. The NS&I letter is attached."/>
                    <button className="btn sm" disabled={!txt.trim()} onClick={() => { say(txt); resolve({ k: "explained", t: txt }); }}>I don’t have this. Send my explanation</button>
                  </div>
                )}
                {(cur.status === "unbacked" || cur.status === "unknown") && (
                  <div className="ms-act">
                    <p>{cur.status === "unknown" ? "There’s no figure yet." : "There’s a figure, but no document behind it yet."} You’ll need {MS.CATS.find((c) => c.id === cur.cat).doc}.</p>
                    {cur.whose !== "b" && cur.a && <window.MSDoc onDoc={setMyDoc} label="Add my document"/>}
                    {cur.whose !== "a" && <div className="ms-act-b"><button onClick={() => say("Could you add the document for this when you have it?")}>Ask {N.them} for it</button></div>}
                  </div>
                )}
                {(cur.status === "agreed" || cur.status === "explained") && <div className="ms-act"><p>{cur.status === "agreed" ? <>Agreed at <b>{MS.gbp(cur.agreed)}</b>. This is the figure that goes in your documents.</> : <>Explained: “{cur.why}”</>}</p><button className="lnk" onClick={() => up((o) => { const r = { ...o.res }; delete r[cur.id]; return { ...o, res: r }; })}>Undo</button></div>}
                <div className="ms-th">
                  <div className="ms-th-h">Comments</div>
                  {th.map((m, k) => <div key={k} className={"ms-c " + m.w}><span className="av">{(m.w === "a" ? N.me : N.them)[0]}</span><div><b>{m.w === "a" ? N.me : N.them} <small>{m.at}</small></b><p>{m.t}</p></div></div>)}
                  {!th.length && <div className="ms-none">No comments yet.</div>}
                  <form className="ms-row" onSubmit={(e) => { e.preventDefault(); const t = e.target.c.value.trim(); if (t) { say(t); e.target.reset(); } }}><input name="c" placeholder="Write a comment" aria-label="Write a comment"/><button className="btn sm" type="submit">Send</button></form>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  /* ── agree, then the documents ── */
  function Agree({ st, up, N, onBack, onDone }) {
    const rs = MS.rows(st, st.b, st.res), docsA = MS.todo(st, st.b, "a"), docsB = MS.todo(st, st.b, "b"), [chk, setChk] = useState(!!st.agreed.a);
    return (
      <main className="iv-body"><div className="ms-narrow">
        <div className="iv-kick" style={{ "--c": "#5B21B6" }}>Agree it’s complete</div>
        <h2 className="iv-h">Is this everything, as far as you know?</h2>
        <div className="ms-chk-list">
          <div className="ok"><Ic.Check s={14} w={2.4}/>Nothing missing or disagreed: {rs.length} lines settled</div>
          <div className={docsA.length ? "warn" : "ok"}>{docsA.length ? <Ic.Help s={14}/> : <Ic.Check s={14} w={2.4}/>}{docsA.length ? `${docsA.length} of your documents still to add. They’ll be listed as “to follow”.` : "All your documents are in"}</div>
          <div className={docsB.length ? "warn" : "ok"}>{docsB.length ? <Ic.Help s={14}/> : <Ic.Check s={14} w={2.4}/>}{docsB.length ? `${docsB.length} of ${N.them}’s documents still to add` : `All ${N.them}’s documents are in`}</div>
        </div>
        <label className="ms-decl"><input type="checkbox" checked={chk} onChange={(e) => setChk(e.target.checked)}/><span>I’ve included everything I own and owe, in my name and jointly, to the best of my knowledge. I understand that an agreement based on missing information can be overturned later.<small>Draft wording, to be reviewed by a family lawyer</small></span></label>
        <div className="ms-agree">
          <div className={st.agreed.a ? "on" : ""}><span className="av">{N.me[0]}</span><b>{N.me}</b><i>{st.agreed.a ? "Confirmed" : "Not yet"}</i></div>
          <div className={st.agreed.b ? "on" : ""}><span className="av b">{N.them[0]}</span><b>{N.them}</b><i>{st.agreed.b ? "Confirmed" : st.agreed.a ? "Waiting" : "Not yet"}</i></div>
        </div>
        {!st.agreed.a ? (
          <div className="iv-nav desk"><button className="back" onClick={onBack}><Ic.Arrow s={14} style={{ transform: "rotate(180deg)" }}/> Back</button><button className="btn lg" disabled={!chk} onClick={() => up((o) => ({ ...o, agreed: { ...o.agreed, a: true } }))}>Confirm my side <Ic.Arrow s={15}/></button></div>
        ) : !st.agreed.b ? (
          <div className="ms-proto"><span>Prototype</span><button onClick={() => up((o) => ({ ...o, agreed: { ...o.agreed, b: true } }))}>{N.them} confirms his side <Ic.Arrow s={13}/></button></div>
        ) : (
          <div className="iv-nav desk"><button className="btn lg" onClick={onDone}>Get our documents <Ic.Arrow s={15}/></button></div>
        )}
      </div></main>
    );
  }

  function Outputs({ st, N, onFinish }) {
    const [doc, setDoc] = useState(null), [toast, setToast] = useState("");
    const rs = MS.rows(st, st.b, st.res), t = MS.totals(rs);
    const OUT = [
      { id: "ofs", t: "Open financial statement", d: "Both sides in one schedule, with sources and documents. What a mediator or solicitor reads first.", for: "Mediation, or advice from a solicitor" },
      { id: "d81", t: "D81 figures", d: "The capital, pensions and income tables a D81 asks for, for each of you.", for: "Applying for a consent order" },
      { id: "e", t: "Form E draft", d: "Your answers placed into Form E’s sections, with what’s still to complete.", for: "If it goes to court, or your solicitor asks for one" },
    ];
    return (
      <div className="ms-wrap">
        <div className="ms-head"><div><div className="kick">Agreed by {N.me} and {N.them}</div><h1 className="serif">Your statement is <span className="em">complete.</span></h1><p>Take it to a mediator, use it for a consent order, or keep it ready. If anything changes, update it and you’ll both be asked to confirm again.</p></div><div className="ms-head-a"><button className="btn lg" onClick={onFinish}>Finish <Ic.Arrow s={15}/></button></div></div>
        <div className="ms-outs">{OUT.map((o) => <div key={o.id} className="ms-out"><div className="ms-out-p" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><b>{o.t}</b><p>{o.d}</p><small>For: {o.for}</small><div className="ms-row"><button className="btn sm" onClick={() => setDoc(o)}>Preview</button><button className="btn sm ghost" onClick={() => setToast("In the real product this downloads a PDF.")}>Download PDF</button></div></div>)}</div>
        {toast && <div className="ms-toast" onAnimationEnd={() => setToast("")}>{toast}</div>}
        {doc && (
          <div className="ms-scrim" onClick={(e) => e.target === e.currentTarget && setDoc(null)}>
            <div className="ms-paper" role="dialog" aria-modal="true" aria-label={doc.t}>
              <button className="ms-x" onClick={() => setDoc(null)} aria-label="Close"><Ic.X s={16}/></button>
              <div className="kick">{doc.t} · draft</div>
              <h2 className="serif">{N.me} and {N.them}</h2>
              <p className="ms-note">Prepared {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} from information each of you supplied and confirmed. Not checked by Decouple.</p>
              {doc.id === "d81" ? (
                <table className="ms-tbl"><thead><tr><th></th><th>{N.me}</th><th>{N.them}</th><th>Joint</th></tr></thead><tbody>
                  <tr><td>Capital (net of debts)</td><td>{MS.gbp(t.a.assets - t.a.debts)}</td><td>{MS.gbp(t.b.assets - t.b.debts)}</td><td>{MS.gbp(t.joint.assets - t.joint.debts)}</td></tr>
                  <tr><td>Pensions (CETV)</td><td>{MS.gbp(t.a.pensions)}</td><td>{MS.gbp(t.b.pensions)}</td><td>—</td></tr>
                  <tr><td>Net income a month</td><td>{MS.gbp(t.a.income)}</td><td>{MS.gbp(t.b.income)}</td><td>—</td></tr>
                </tbody></table>
              ) : (
                <table className="ms-tbl"><thead><tr><th>{doc.id === "e" ? "Form E section" : "Item"}</th><th>Whose</th><th>Value</th><th>Basis</th><th>Document</th></tr></thead><tbody>
                  {MS.CATS.map((c) => rs.filter((r) => r.cat === c.id).map((r, k) => { const it = r.a || r.b; return <tr key={r.id}><td>{k === 0 ? <b className="ms-tsec">{doc.id === "e" ? c.form + " · " : ""}{c.t}</b> : null}{r.sub ? r.sub + " · " : ""}{r.label}</td><td>{who(r, N)}</td><td>{MS.gbp(MS.value(r))}</td><td>{r.status === "agreed" ? "Agreed figure" : it ? MS.srcLabel(c.id, it.src) : "—"}</td><td>{(r.debt ? it && it.docM : it && it.doc) ? "Provided" : "To follow"}</td></tr>; }))}
                </tbody></table>
              )}
              {doc.id === "e" && <div className="ms-warn"><Ic.Help s={13}/>Still to complete in Form E: monthly outgoings (3.1), your housing and income needs (3.2–3.3), and the statement of truth. One Form E each.</div>}
            </div>
          </div>
        )}
      </div>
    );
  }

  Object.assign(window, { MSMine: Mine, MSInvite: Invite, MSWaiting: Waiting, MSShared: Shared, MSAgree: Agree, MSOutputs: Outputs });
})();
