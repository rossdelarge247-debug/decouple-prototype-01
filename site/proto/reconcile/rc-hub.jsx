/* Prepare · household picture hub — three summary papers: your picture, their picture, our household */
(function () {
  const Ic = window.DIc, RC = window.RC, ot = RC.ot;
  const Av = (p) => <window.RCAv {...p}/>;

  function Dialog({ l, v, N, act, fresh, x, onX }) {
    const o = ot(v), O = o === "a" ? N.Me : N.Them, nx = RC.nextUp(l), last = RC.latest(l), me = nx === v;
    const ch = RC.chased(l), stale = !me && !ch && last && RC.rank(last.ago) >= 2, g = RC.gap(l), pd = l.pending;
    const snip = pd && pd.type === "new" ? `${pd.by === v ? "You" : O} proposed ${RC.fmt(l, pd.value)}` : last ? `${last.w === v ? "You" : O}: ${last.file ? "uploaded " + last.file : last.t}` : l.waitDoc ? `Waiting for ${RC.lc(l.waitDoc)}` : "";
    const canAccept = me && ((pd && pd.by === o && pd.type === "new") || l[o] != null);
    const accept = () => act.resolve(l.id, pd && pd.by === o && pd.type === "new" ? "acceptProp" : "acceptTheirs");
    const accLbl = pd && pd.by === o && pd.type === "new" ? `Accept ${RC.fmt(l, pd.value)}` : "Accept";
    return <div className={"hb-dw" + (x ? " x" : "")}>
      <div className={"hb-dl" + (!l.open ? " done" : "") + (me ? " me" : "") + (stale ? " stale" : "") + (fresh ? " new" : "")}>
        <i className="dot"></i>
        <button className="tx" onClick={onX} aria-expanded={x}>{fresh && <span className="nw">New</span>}<b>{l.l}</b>{g != null && <em className="tab">{RC.gbp(g)}</em>}<span className="sn">{snip}</span></button>
        <small className="ag">{last ? last.ago : ""}</small>
        <span className="hb-ac">{!l.open ? <><span className="chased"><Ic.Check s={10} w={3}/>Resolved</span><button className="btn sm ghost" onClick={onX}>Close</button></> : me ? <>{canAccept && <button className="btn sm ok" onClick={accept}>{accLbl}</button>}<button className={"btn sm" + (x ? "" : " ghost")} onClick={onX}>{x ? "Close" : "Respond"}</button></> : ch ? <span className="chased"><Ic.Check s={10} w={3}/>Chased</span> : <button className={"btn sm" + (stale ? " chase" : " ghost")} onClick={() => act.resolve(l.id, "nudge")}>Chase</button>}</span>
      </div>
      {x && <div className="hb-xp"><window.RCThread l={l} v={v} N={N} act={act}/></div>}
    </div>;
  }

  function Rev({ l, v, N, act, x, onX }) {
    const o = ot(v), hint = l[v] == null ? ["n", "Not on yours"] : l[v] === l[o] ? ["m", "Matches yours"] : ["d", `You have ${RC.fmt(l, l[v])}`];
    return <div className={"hb-dw" + (x ? " x" : "")}>
      <div className="hb-dl rv"><i className="dot"></i>
        <span className="tx"><b>{l.l}</b><span className="tab vl">{RC.fmt(l, l[o])}</span><em className={"ht " + hint[0]}>{hint[1]}</em></span>
        <span className="hb-ac"><button className="btn sm ok" onClick={() => act.resolve(l.id, "accept")}>Accept</button><button className={"btn sm" + (x ? "" : " ghost")} onClick={onX}>{x ? "Cancel" : "Query"}</button></span>
      </div>
      {x && <div className="hb-xp"><window.RCNewQuery l={l} v={v} N={N} act={act} onCancel={onX}/></div>}
    </div>;
  }

  function useJustDone(done) {
    const { useRef, useEffect, useState } = React;
    const prev = useRef(done), [fx, setFx] = useState(false);
    useEffect(() => { if (done && !prev.current) { setFx(true); const t = setTimeout(() => setFx(false), 2600); prev.current = done; return () => clearTimeout(t); } prev.current = done; }, [done]);
    return fx;
  }

  function Side({ L, v, N, p, onOpen, onGo, act, seen }) {
    const { useState } = React;
    const o = ot(v), O = o === "a" ? N.Me : N.Them, mine = p === v, reviewer = mine ? o : v;
    const [stop, setStop] = useState(false), [xid, setXid] = useState(null);
    const pr = RC.progress(L, reviewer);
    const threads = L.filter((l) => l.q && (mine ? l.q === o : l.q === v));
    const open = threads.filter((l) => l.open), turn = open.filter((l) => RC.nextUp(l) === v).length;
    const age = (l) => { const m = RC.latest(l); return m ? RC.rank(m.ago) : 50; };
    const items = threads.slice().sort((x, y) => age(x) - age(y) || (x.open ? 0 : 1) - (y.open ? 0 : 1));
    const pct = Math.round((pr.acc / pr.total) * 100), fx = useJustDone(pr.done);
    const toRev = mine ? [] : RC.reviewList(L, v).filter((l) => !l.acc[v] && !l.open), match = toRev.filter((l) => l[v] === l[o]);
    const cta = mine ? (turn ? `Answer ${O}'s questions` : "Open your picture") : pr.done ? `Open ${O}'s picture` : pr.acc === 0 && !threads.length ? `Start reviewing ${O}'s picture` : `Continue reviewing ${O}'s picture`;
    return <div className={"paper pp-card hb-side " + (mine ? "mine" : "theirs") + (pr.done ? " done" : "") + (fx ? " fx" : "")}>
      {fx && <div className="hb-burst" aria-hidden="true">{Array.from({ length: 14 }).map((_, i) => <i key={i} style={{ "--a": i * 25.7 + "deg", "--d": (i % 3) * 60 + "ms" }}></i>)}</div>}
      <span className="ftab" style={{ background: mine ? "#5B21B6" : "#0369A1", gap: 5, paddingLeft: 5 }}><Av w={p} N={N} size={15}/>{mine ? "YOUR PICTURE" : `${O.toUpperCase()}'S PICTURE`}</span>
      <div className="hb-top">
        <div><div className="hb-sh">{mine ? <><span className="ok"><Ic.Check s={10} w={3} c="#FFF"/></span>{`Shared with ${O}`}{!stop ? <button className="lnk" onClick={() => setStop(true)}>Stop sharing</button> : <span className="cf">{`${O} loses access.`}<button className="lnk red" onClick={() => { setStop(false); act.stopShare(); }}>Stop</button><button className="lnk" onClick={() => setStop(false)}>Cancel</button></span>}</> : <><span className="ok"><Ic.Check s={10} w={3} c="#FFF"/></span>Shared with you</>}</div>
          <h2>{mine ? "Your picture" : `${O}'s picture`}</h2>
          <p>{mine ? (pr.done ? "You've both reconciled every open point on your picture." : `Everything else matches — ${open.length} item${open.length !== 1 ? "s" : ""} to reconcile with ${O}.`) : pr.done ? `You've both reconciled every open point on ${O}'s picture.` : `Everything else matches — ${open.length + toRev.length} item${open.length + toRev.length !== 1 ? "s" : ""} to reconcile.`}</p></div>
        <div className={"hb-ring" + (pr.done ? " ok" : "")} style={{ "--p": pct }}><span>{pr.done ? <Ic.Check s={18} w={3}/> : `${pct}%`}</span></div>
      </div>
      <div className="hb-row"><div className="hb-stats">{open.length + toRev.length > 0 ? <span className="op"><i></i>{`${open.length + toRev.length} item${open.length + toRev.length > 1 ? "s" : ""} to reconcile`}</span> : <span className="ok"><i></i>Nothing to reconcile</span>}{turn > 0 && <span className="rn"><i></i>{`${turn} response needed`}</span>}{mine && pr.left > 0 && <span><i></i>{`${pr.left} not reviewed by ${O} yet`}</span>}</div><button className="btn sm hb-cta" onClick={onGo}>{cta}<Ic.Arrow s={12}/></button></div>
      {toRev.length > 0 && <div className="hb-list"><div className="hb-lh"><b>To review</b><span>{match.length > 1 ? <button className="lnk" onClick={() => act.acceptMany(match.map((l) => l.id))}>{`Accept the ${match.length} that match yours`}</button> : `${toRev.length} left`}</span></div>
        {toRev.map((l) => <Rev key={l.id} l={l} v={v} N={N} act={act} x={xid === "q:" + l.id} onX={() => setXid(xid === "q:" + l.id ? null : "q:" + l.id)}/>)}</div>}
      {mine && !pr.done && pr.left > 0 && <div className="hb-wt"><span className="spin"></span><span>{`${O} hasn't reviewed ${pr.left} line${pr.left > 1 ? "s" : ""} yet.`}</span><button className="lnk" onClick={act.chaseReview}>{`Chase ${O}`}</button><button className="proto-mini" onClick={act.simAll}>{`Simulate ${O}`}</button></div>}
      {pr.done && <div className="hb-done"><span className="ok"><Ic.Check s={12} w={3} c="#FFF"/></span>{mine ? "Your picture is reconciled." : `${O}'s picture is reconciled.`}</div>}
      <div className="hb-list"><div className="hb-lh"><b>{mine ? `${O}'s questions` : "Your questions"}</b><span>{open.length ? `${turn} response needed · ${open.length - turn} with ${O} · newest first` : "None open"}</span></div>
        {items.map((l) => l.open || xid === l.id ? <Dialog key={l.id} l={l} v={v} N={N} act={act} x={xid === l.id} onX={() => { setXid(xid === l.id ? null : l.id); act.see(l.id); }} fresh={!seen[l.id] && (RC.latest(l) || {}).w === o && RC.rank((RC.latest(l) || {}).ago) <= 1}/> : <div key={l.id} className="hb-dl done"><i className="dot"></i><button className="tx" onClick={() => setXid(l.id)}><b>{l.l}</b><span className="sn">{l.parked ? "Carried into Settle" : `Agreed at ${RC.fmt(l, l.agreed)}`}</span></button><small className="ag">{(RC.latest(l) || {}).ago || ""}</small><span className="chased"><Ic.Check s={10} w={3}/>Resolved</span></div>)}
        {!items.length && <div className="rc-none">{mine ? `${O} hasn't raised anything.` : "Nothing raised yet. Query any line that doesn't look right."}</div>}</div>
    </div>;
  }

  function HouseCard({ L, v, N, locked, onGo }) {
    const { useRef, useEffect, useState } = React;
    const o = ot(v), O = o === "a" ? N.Me : N.Them, me = RC.progress(L, v), th = RC.progress(L, o), un0 = me.done && th.done;
    const prev = useRef(un0), [bld, setBld] = useState(-1);
    useEffect(() => { if (un0 && !prev.current) { setBld(0); const ts = [700, 1500, 2300, 3100].map((t, i) => setTimeout(() => setBld(i + 1 < 4 ? i + 1 : -1), t)); prev.current = un0; return () => ts.forEach(clearTimeout); } prev.current = un0; }, [un0]);
    const un = un0 && bld < 0;
    if (bld >= 0) { const S = ["Merging both pictures", "Matching joint items", "Adding up the household", "Laying it out side by side"]; return <div className="paper pp-card hb-house bld">
      <span className="ftab" style={{ background: "#9D174D", gap: 5, paddingLeft: 5 }}><Av w="a" N={N} size={15}/><Av w="b" N={N} size={15}/>OUR HOUSEHOLD</span>
      <div className="hb-bld"><div className="hb-spin"><span></span><Av w="a" N={N} size={26}/><Av w="b" N={N} size={26}/></div>
        <div><div className="pq-k" style={{ color: "#9D174D" }}>Both pictures reconciled</div><h2>Building your household picture…</h2>
          <ol>{S.map((s, i) => <li key={i} className={i < bld ? "ok" : i === bld ? "on" : ""}><span className="k">{i < bld ? <Ic.Check s={9} w={3.2} c="#FFF"/> : null}</span>{s}</li>)}</ol></div></div>
      <div className="hb-bar"><i style={{ width: ((bld + 1) / 4) * 100 + "%" }}></i></div>
    </div>; }
    return <div className={"paper pp-card hb-house" + (un ? "" : " off") + (un && prev.current && bld === -1 ? " rv" : "")}>
      <span className="ftab" style={{ background: un ? "#9D174D" : "#A8A29E", gap: 5, paddingLeft: 5 }}><Av w="a" N={N} size={15}/><Av w="b" N={N} size={15}/>OUR HOUSEHOLD</span>
      <div className="hb-hh">
        <div><div className="pq-k" style={{ color: un ? "#9D174D" : "var(--mute)" }}>{un ? (locked ? "Signed · version 1" : "Ready to review together") : <><Ic.Lock s={11}/> Not available yet</>}</div>
          <h2>{`${N.Me} & ${N.Them}, side by side.`}</h2>
          <p>{un ? `Both pictures accepted. ${L.filter((l) => l.q).length} lines changed along the way — each keeps its history.` : `Opens when you've each accepted the other's picture.`}</p></div>
        <div className="hb-gate">
          {[[me, `You accept ${O}'s picture`], [th, `${O} accepts yours`]].map(([p, t], i) => <div key={i} className={"rc-gr" + (p.done ? " ok" : "")}><span className="k">{p.done && <Ic.Check s={10} w={3} c="#FFF"/>}</span><span><b>{t}</b><small>{p.done ? "Done" : `${p.total - p.acc} to reconcile`}</small></span></div>)}
        </div>
        {un ? <div className="hb-nums"><div><small>Net household assets</small><b className="tab">{RC.gbp(RC.net(L, "x"))}</b></div><button className="btn" onClick={onGo}>{locked ? "Open our household" : "Review and sign"}<Ic.Arrow s={13}/></button></div>
          : <div className="hb-nums"><button className="btn" disabled>Our household<Ic.Lock s={12}/></button></div>}
      </div>
    </div>;
  }

  function Hub({ L, v, N, locked, onOpen, goPage, act, seen = {} }) {
    const o = ot(v), O = o === "a" ? N.Me : N.Them, me = RC.progress(L, v), th = RC.progress(L, o);
    const turn = L.filter((l) => l.open && RC.nextUp(l) === v).length;
    return <div className="hb">
      <div className="paper pp-card rc-head hb-head">
        <div className="pq-k" style={{ color: "#9D174D" }}>Prepare · household picture</div>
        <h1>{turn ? <>{`${turn} thing${turn > 1 ? "s" : ""} need`}<br/><em>your reply.</em></> : me.done && th.done ? <>Both pictures<br/><em>accepted.</em></> : me.done ? <>{`Waiting for ${O}`}<br/><em>to finish reviewing.</em></> : <>{`${O}'s picture`}<br/><em>is ready to review.</em></>}</h1>
        <p className="pq-why">{`You each review the other's picture — accept what's right, query what isn't. When you've both accepted, your household comes together side by side.`}</p>
      </div>
      <div className="hb-pair">
        <Side L={L} v={v} N={N} p={v} onOpen={onOpen} onGo={() => goPage("mine")} act={act} seen={seen}/>
        <Side L={L} v={v} N={N} p={o} onOpen={onOpen} onGo={() => goPage("theirs")} act={act} seen={seen}/>
      </div>
      <HouseCard L={L} v={v} N={N} locked={locked} onGo={() => goPage("house")}/>
    </div>;
  }

  Object.assign(window, { RCHub: Hub });
})();
