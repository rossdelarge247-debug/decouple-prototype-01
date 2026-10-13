/* Prepare · pictures — picture paper (yours / theirs), inline query threads, household summary */
(function () {
  const { useState, useEffect, useRef } = React;
  const Ic = window.DIc, RC = window.RC, ot = RC.ot;

  function Av({ w, N, size = 24 }) {
    const m = w === "a" ? ["#F3EEFE", "#5B21B6", N.Me[0]] : w === "b" ? ["#E0F2FE", "#0369A1", N.Them[0]] : ["#5B21B6", "#FFF", null];
    return <span className="rc-av" style={{ width: size, height: size, background: m[0], color: m[1], fontSize: size < 22 ? 9.5 : 11 }}>{m[2] ? m[2].toUpperCase() : <Ic.Spark s={size * 0.5} c="#FFF"/>}</span>;
  }
  const nmOf = (N) => (k) => (k === "a" ? N.Me : N.Them);

  /* ---------- inline thread ---------- */
  function Thread({ l, v, N, act }) {
    const o = ot(v), O = nmOf(N)(o), mine = l.q === v; // mine = I raised this query
    const [mode, setMode] = useState(null), [txt, setTxt] = useState(""), [num, setNum] = useState(""), [rev, setRev] = useState(null);
    const end = useRef(null);
    useEffect(() => { if (end.current) end.current.scrollTop = end.current.scrollHeight; }, [l.thread.length]);
    const pd = l.pending, theirP = pd && pd.by === o, mineP = pd && pd.by === v, nx = RC.nextUp(l);
    const mid = l.a != null && l.b != null && l.a !== l.b ? Math.round((l.a + l.b) / 2) : null;
    const ai = v === "a" && l.ai && l.open && nx === v ? l.ai : null;
    const doAi = () => { const m = { ask: ["ask", { doc: l.ai.doc }], nudge: ["nudge"], keep: ["msg", { text: l.ai.why }], upload: ["upload", { doc: l.ai.doc }], new: ["new", { value: l.ai.val }], accept: ["acceptTheirs"], park: ["park"] }[l.ai.act]; act.resolve(l.id, m[0], m[1]); };
    const send = () => { const t = txt.trim(); if (!t) return; if (!rev) { setRev(RC.tone(t)); return; } act.resolve(l.id, "msg", { text: t }); setTxt(""); setRev(null); };
    const acts = mine ? [
      l[o] != null || l.owner === o ? ["c", l[o] != null ? `Accept ${RC.fmt(l, l[o])}` : `Accept ${O}'s figure`, () => act.resolve(l.id, "acceptTheirs")] : null,
      mid != null ? ["s", `Propose ${RC.fmt(l, mid)}`, () => act.resolve(l.id, "new", { value: mid })] : null,
      ["e", "Ask for evidence", () => setMode("ask")],
      ["x", "Propose another figure", () => setMode("new")],
    ] : [
      ["e", "Upload evidence", () => setMode("upload")],
      ["x", "Change my figure", () => setMode("new")],
      l[o] != null ? ["c", `Accept ${O}'s ${RC.fmt(l, l[o])}`, () => act.resolve(l.id, "acceptTheirs")] : null,
    ];
    return (
      <div className="rc-th">
        <div className="rc-msgs" ref={end}>{l.thread.map((m, j) => m.gap ? <div key={j} className="rc-gap"><span>{m.gap}</span></div> : m.sys ? <div key={j} className="rc-sys">{m.sys}</div> : (
          <div key={j} className={"rc-m " + (m.w === v ? "me" : "them")}><Av w={m.w} N={N} size={22}/><div><div className="mh"><b>{m.w === v ? "You" : nmOf(N)(m.w)}</b>{m.ago && <small>{m.ago}</small>}</div><div className="bub">{m.file ? <span className="rc-file"><Ic.Plus s={12}/>{m.file}</span> : m.t}</div></div></div>))}</div>
        {!l.open ? <div className="rc-res"><Ic.Check s={13} w={2.6}/>{l.parked ? "Carried into Settle as a range." : `Agreed at ${RC.fmt(l, l.agreed)}.`}</div> : <div className="rc-tf">
          {theirP && pd.type === "new" && <div className="rc-prop"><span>{`${O} proposes ${RC.fmt(l, pd.value)}`}</span><button className="btn sm" onClick={() => act.resolve(l.id, "acceptProp")}>Agree</button><button className="btn sm ghost" onClick={() => setMode("new")}>Counter</button></div>}
          {theirP && pd.type === "upload" && <div className="rc-prop"><span>{`${O} uploaded ${pd.doc}`}</span><button className="btn sm" onClick={() => act.resolve(l.id, mine ? "acceptTheirs" : "acceptMine")}>{mine ? "That answers it — accept" : "Accept"}</button></div>}
          {mineP ? <div className="rc-wait"><span className="spin"></span>{`Waiting for ${O}`}{RC.chased(l) ? <em>Chased just now</em> : <button className="lnk" onClick={() => act.resolve(l.id, "nudge")}>{`Chase ${O}`}</button>}</div> : <>
            {ai && !mode && <button className="rc-ailine" onClick={doAi}><Av w="ai" N={N} size={18}/><span>{ai.h}</span><b>{ai.lbl}<Ic.Arrow s={11}/></b></button>}
            {!mode && <div className="rc-acts">{acts.filter(Boolean).map(([t, lb, f], j) => <button key={j} className={"q " + t} onClick={f}>{lb}</button>)}<button className="q d" onClick={() => act.resolve(l.id, "park")}>{l.waitDoc && !l.got ? "Carry as pending" : "Agree to disagree"}</button></div>}
            {mode === "ask" && <div className="rc-comp"><small>What would help?</small><div className="rc-docs">{["Payslips", "Bank statement", "Valuation", "Receipt or invoice", "Message or letter"].map((d) => <button key={d} onClick={() => { act.resolve(l.id, "ask", { doc: d }); setMode(null); }}>{d}</button>)}</div><button className="lnk" onClick={() => setMode(null)}>Cancel</button></div>}
            {mode === "new" && <div className="rc-comp"><label className="rc-num"><span>£</span><input autoFocus inputMode="numeric" placeholder={mid != null ? String(Math.abs(mid)) : "Amount"} value={num} onChange={(e) => setNum(e.target.value.replace(/[^0-9]/g, ""))}/>{l.per && <em>{l.per}</em>}</label>
              <div><button className="btn sm" disabled={!num} onClick={() => { act.resolve(l.id, "new", { value: Number(num) * ((l.a || l.b || 0) < 0 ? -1 : 1) }); setMode(null); setNum(""); }}>Propose</button><button className="lnk" onClick={() => setMode(null)}>Cancel</button></div></div>}
            {mode === "upload" && <div className="rc-comp"><button className="drop" onClick={() => { act.resolve(l.id, "upload", { doc: (l.ai && l.ai.doc) || (l.waitDoc ? l.waitDoc + ".pdf" : "Supporting document.pdf") }); setMode(null); }}><Ic.Plus s={18} c="#5B21B6"/><b>Choose a file</b><small>PDF or photo · added to this line for you both</small></button><button className="lnk" onClick={() => setMode(null)}>Cancel</button></div>}
            {!mode && <div className="rc-compose"><textarea rows={2} placeholder={mine ? `Reply to ${O}…` : `Explain your figure to ${O}…`} value={txt} onChange={(e) => { setTxt(e.target.value); setRev(null); }}></textarea>
              {rev && <div className={"rc-rev" + (rev.ok ? "" : " warn")}><Ic.Spark s={12}/><span><b>{rev.h}</b> {rev.b}</span></div>}
              <div className="bar"><span><Ic.Spark s={10}/>Decouple reads it before sending</span><button className="btn sm" disabled={!txt.trim()} onClick={send}>{rev ? "Send" : "Check & send"}<Ic.Arrow s={11}/></button></div></div>}
          </>}
          <button className="proto-mini" onClick={() => act.sim(l.id)}>{`Simulate ${O}`}</button>
        </div>}
      </div>
    );
  }

  /* ---------- new query composer ---------- */
  function NewQuery({ l, v, N, act, onCancel }) {
    const O = nmOf(N)(ot(v)), [why, setWhy] = useState(null), [txt, setTxt] = useState("");
    const R = [["The figure looks wrong", "Figure"], ["I'd like to see evidence", "Evidence"], ["Whose is this?", "Ownership"], ["Something's missing", "Missing"]];
    return <div className="rc-th nq">
      <small>{`What's your question for ${O}?`}</small>
      <div className="rc-acts">{R.map(([t, k]) => <button key={k} className={"q x" + (why === k ? " on" : "")} onClick={() => { setWhy(k); if (!txt) setTxt(k === "Figure" && l[v] != null ? `I have ${RC.fmt(l, l[v])} for this. Where does your figure come from?` : k === "Evidence" ? "Could you upload something that shows this figure?" : k === "Ownership" ? "I don't think this is joint — can we talk about whose it is?" : ""); }}>{t}</button>)}</div>
      <div className="rc-compose"><textarea autoFocus rows={2} placeholder="Add a note…" value={txt} onChange={(e) => setTxt(e.target.value)}></textarea>
        <div className="bar"><button className="lnk" onClick={onCancel}>Cancel</button><button className="btn sm" disabled={!txt.trim()} onClick={() => act.resolve(l.id, "query", { text: txt.trim(), doc: why === "Evidence" ? "Supporting evidence" : null })}>{`Send to ${O}`}<Ic.Arrow s={11}/></button></div></div>
    </div>;
  }

  /* ---------- picture paper ---------- */
  function Line({ l, v, N, p, act, open, setOpen, shut, setShut, seen }) {
    const o = ot(v), theirs = p === o, nm = nmOf(N), O = nm(o), nx = RC.nextUp(l), resp = nx === v;
    const isOpen = open === l.id || (l.open && !shut[l.id]), last = RC.latest(l), g = RC.gap(l), pd = l.pending;
    const fresh = l.open && last && last.w === o && RC.rank(last.ago) <= 1 && !seen[l.id];
    const val = l.done ? RC.fmt(l, l.agreed != null ? l.agreed : l[p]) : RC.fmt(l, l[p]);
    const toggle = () => { if (isOpen) { setShut(l.id, true); if (open === l.id) setOpen(null); } else { setShut(l.id, false); setOpen(l.id); } act.see(l.id); };
    const home = l.owner !== "j" || (l.q === v ? p === o : p === v);
    if (l.open && !home) return <div className="rc-line" id={"rcl-" + l.id}><div className="rc-lr"><span className="rc-l"><span>{l.l}</span><small>{l.sub}</small></span><span className="rc-v tab">{val}</span><button className="lnk rc-elsewhere" onClick={() => act.open(l.id)}>{`Open on ${theirs ? "your" : O + "'s"} picture`}<Ic.Arrow s={10}/></button></div></div>;
    if (l.open) {
      const canAccept = resp && ((pd && pd.by === o && pd.type === "new") || l[o] != null);
      const accLbl = pd && pd.by === o && pd.type === "new" ? `Accept ${RC.fmt(l, pd.value)}` : `Accept ${O}'s`;
      return <div className={"rc-line open" + (resp ? " resp" : "") + (fresh ? " new" : "") + (isOpen ? " x" : "")} id={"rcl-" + l.id}>
        <div className="rc-oh"><i className="dot"></i>
          <button className="tx" onClick={toggle} aria-expanded={isOpen}>{fresh && <span className="nw">New</span>}<b>{l.l}</b>{g != null && <em className="tab">{`${RC.gbp(g)} apart`}</em>}<span className="tab vl">{val}</span></button>
          <span className={"pill" + (resp ? " me" : "")}>{resp ? "Response needed" : `With ${O}`}</span>
          <span className="hb-ac">{canAccept && <button className="btn sm ok" onClick={() => act.resolve(l.id, pd && pd.by === o && pd.type === "new" ? "acceptProp" : "acceptTheirs")}>{accLbl}</button>}<button className="btn sm ghost ic" aria-label={isOpen ? "Collapse" : "Expand"} onClick={toggle}><span className={"cv" + (isOpen ? " up" : "")}><Ic.Down s={12}/></span></button></span>
        </div>
        {isOpen && <Thread l={l} v={v} N={N} act={act}/>}
      </div>;
    }
    let st;
    if (!l.owner) st = <span className="rc-st ok"><Ic.Check s={11} w={2.8}/>Matched</span>;
    else if (l.done) st = <button className="rc-st ok lk" onClick={() => setOpen(open === l.id ? null : l.id)}><Ic.Check s={11} w={2.8}/>{l.parked ? "Carried to Settle" : "Agreed"}{l.q && <Ic.Down s={10}/>}</button>;
    else if (theirs) st = l.acc[v] ? <span className="rc-do"><span className="rc-st ok"><Ic.Check s={11} w={2.8}/>{l[v] === l[p] ? "Matches yours" : "Accepted"}</span><button className="lnk rc-qlk" onClick={() => setOpen(open === "q:" + l.id ? null : "q:" + l.id)}>Query</button></span> : <span className="rc-do"><button className="btn sm ok" onClick={() => act.resolve(l.id, "accept")}><Ic.Check s={11} w={2.8}/>Accept</button><button className="btn sm ghost" onClick={() => setOpen(open === "q:" + l.id ? null : "q:" + l.id)}>Query</button></span>;
    else st = l.acc[o] ? <span className="rc-st ok"><Ic.Check s={11} w={2.8}/>{`${O} accepted`}</span> : <span className="rc-st mu">Not reviewed yet</span>;
    const hint = theirs && l.owner && !l.done && !l.acc[v] ? (l[v] == null ? ["n", "Not on your picture"] : l[v] === l[p] ? ["m", "Matches yours"] : ["d", `You have ${RC.fmt(l, l[v])}`]) : null;
    const exc = theirs && l.owner && !l.done && !l.acc[v];
    return <div className={"rc-line" + (open === l.id || open === "q:" + l.id ? " x" : "") + (exc ? " exc" : "")} id={"rcl-" + l.id}>
      <div className="rc-lr"><span className="rc-l"><span>{l.l}</span>{(l.sub || hint) && <small>{l.sub}{hint && <em className={hint[0]}>{hint[1]}</em>}</small>}</span><span className="rc-v tab">{val}</span>{st}</div>
      {open === l.id && l.q && <Thread l={l} v={v} N={N} act={act}/>}
      {open === "q:" + l.id && <NewQuery l={l} v={v} N={N} act={act} onCancel={() => setOpen(null)}/>}
    </div>;
  }

  function Picture({ L, v, N, p, act, open, setOpen, seen = {} }) {
    const o = ot(v), theirs = p === o;
    const [shut, setS] = useState({}), setShut = (id, x) => setS((s) => ({ ...s, [id]: x }));
    const secs = RC.SECS.filter((s) => L.some((l) => l.sec === s.id && RC.onPic(l, p)));
    return <div className="rc-secs">{secs.map((s) => {
      const ls = L.filter((l) => l.sec === s.id && RC.onPic(l, p)), n = ls.filter((l) => (l.open && (l.owner !== "j" || (l.q === v ? theirs : !theirs))) || (theirs && l.owner && !l.done && !l.acc[v] && !l.open)).length;
      return <section key={s.id} className="rc-sec" id={"rc-" + s.id}>
        <div className="rc-sh"><h3>{s.t}</h3>{n > 0 ? <span className="rc-cnt">{`${n} to reconcile`}</span> : ls.some((l) => l.open) ? <span className="rc-cnt mu">{`Discussed on ${theirs ? "your" : nmOf(N)(o) + "'s"} picture`}</span> : <span className="rc-cnt ok"><Ic.Check s={11} w={2.8}/>All reconciled</span>}</div>
        {ls.map((l) => <Line key={l.id} l={l} v={v} N={N} p={p} act={act} open={open} setOpen={setOpen} shut={shut} setShut={setShut} seen={seen}/>)}
      </section>; })}</div>;
  }

  /* ---------- household (side by side, summary) ---------- */
  function cells(l) {
    const f = RC.final(l), nil = { t: "—", nil: 1 };
    if (!l.owner) return [nil, { t: l.txt, sub: l.sub }, nil];
    if (l.parked && l.a !== l.b) { const r = l.a != null && l.b != null ? RC.range(l) : "Pending"; return l.owner === "j" ? [{ t: RC.fmt(l, l.a), sub: "view", mu: 1 }, { t: r, sub: "carried to Settle", pk: 1 }, { t: RC.fmt(l, l.b), sub: "view", mu: 1 }] : [l.owner === "a" ? { t: r, pk: 1, sub: "carried to Settle" } : nil, nil, l.owner === "b" ? { t: r, pk: 1, sub: "carried to Settle" } : nil]; }
    if (l.owner === "j") return [{ t: RC.fmt(l, f / 2), sub: "50% own", mu: 1 }, { t: RC.fmt(l, f), sub: "joint" }, { t: RC.fmt(l, f / 2), sub: "50% own", mu: 1 }];
    return [l.owner === "a" ? { t: RC.fmt(l, f) } : nil, nil, l.owner === "b" ? { t: RC.fmt(l, f) } : nil];
  }
  function Household({ L, v, N, third }) {
    const nm = nmOf(N), [op, setOp] = useState(null);
    const secs = RC.SECS.filter((s) => L.some((l) => l.sec === s.id));
    return <div className="rc-hh">
      <div className="rc-hcols"><span></span><span>{nm("a")}</span><span className="mid">Shared</span><span>{nm("b")}</span><span></span></div>
      {secs.map((s, i) => <section key={s.id} className="rc-hsec" id={"rc-" + s.id}><div className="rc-sh"><h3>{s.t}</h3></div>
        {L.filter((l) => l.sec === s.id).map((l) => { const ch = l.q && !third, x = op === l.id; return <div key={l.id} className={"rc-hl" + (x ? " x" : "")} id={"rcl-" + l.id}>
          <div className="rc-hr"><span className="rc-l"><span>{l.l}</span>{l.sub && l.owner && <small>{l.sub}</small>}</span>
            {cells(l).map((c, j) => <span key={j} className={"rc-v tab" + (j === 1 ? " mid" : "") + (c.nil ? " nil" : "") + (c.mu ? " mu" : "") + (c.pk ? " pk" : "")}><span>{c.t}</span>{c.sub && <small>{c.sub}</small>}</span>)}
            <span className="rc-hx">{ch ? <button className={"rc-chg" + (x ? " on" : "")} onClick={() => setOp(x ? null : l.id)}>{l.parked ? "Open" : "Changed"}<Ic.Down s={11}/></button> : null}</span></div>
          {x && <ol className="rc-hist">{RC.history(l, N).map((h, j) => <li key={j} className={h.ok ? "ok" : ""}>{h.w ? <Av w={h.w} N={N} size={18}/> : <span className="dot">{h.ok && <Ic.Check s={10} w={3} c="#FFF"/>}</span>}<div><b className={h.msg ? "msg" : ""}>{h.msg ? `“${h.t}”` : h.t}</b>{h.ago && <small>{h.ago}</small>}</div></li>)}</ol>}
        </div>; })}</section>)}
    </div>;
  }

  Object.assign(window, { RCAv: Av, RCPicture: Picture, RCHousehold: Household, RCThread: Thread, RCNewQuery: NewQuery });
})();
