/* Dashboard — to-do list with priorities, "why" help, snooze, internal click-through, external "have you done this?" */
(function () {
  const { useState } = React;
  const Ic = window.DIc;
  const PRI = [["now", "Do now", "#B91C1C", "#FEE2E2"], ["soon", "Coming up", "#B45309", "#FEF3C7"], ["later", "When you can", "#57534E", "#F5F5F4"]];
  const Ext = () => <svg viewBox="0 0 20 20" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4h5v5M16 4l-7 7M14 12v4H4V6h4"/></svg>;

  function Item({ x, st, set, say }) {
    const [why, setWhy] = useState(false), [ask, setAsk] = useState(false);
    const done = st === "done" || (x.done0 && st !== "undo");
    const go = () => { if (!x.ext) { set("done"); window.DBgo(x.go); } };
    return <div className={"db-td2" + (done ? " dn" : "") + (" p-" + x.pri)}>
      <span className="st">{done ? <span className="ckd"><Ic.Check s={11} w={3} c="#FFF"/></span> : <span className="pd"></span>}</span>
      <div className="bd">
        <div className="tl">{x.ext || done ? <b>{x.t}</b> : <button className="tlb" onClick={go}>{x.t}</button>}{x.ext && <span className="ex" title="Something you do outside Decouple"><Ext/>Outside Decouple</span>}{x.why && <button className={"wh" + (why ? " on" : "")} aria-expanded={why} aria-label="Why is this here?" onClick={() => setWhy(!why)}>?</button>}</div>
        <small>{done ? (x.ext ? "You've done this" : x.s.startsWith("Shared") ? x.s : "Done") : x.s}</small>
        {why && x.why && <div className="whb"><b>Why it's on your list</b><span>{x.why}</span>{x.link && <a href={x.link[1]} target="_blank" rel="noopener">{x.link[0]} ↗</a>}</div>}
        {ask && !done && <div className="ask"><b>Have you done this?</b><span><button className="btn sm" onClick={() => { set("done"); setAsk(false); say("Nice work", `“${x.t}” is ticked off.`); }}>Yes, it's done</button><button className="btn sm ghost" onClick={() => { setAsk(false); set("snz"); say("We'll remind you next time", "It's moved to Snoozed."); }}>Not yet, remind me</button><button className="lnk" onClick={() => setAsk(false)}>Cancel</button></span></div>}
      </div>
      <span className="tg">{x.tag}</span>
      <span className="ac">{done ? <button className="lnk" onClick={() => set("dis")}>Dismiss</button> : <>
        {!ask && <button className="sz" title="Snooze until your next visit" onClick={() => { set("snz"); say("Snoozed", "We'll remind you next time you sign in."); }}>Snooze</button>}
        {x.ext ? !ask && <button className="btn sm ghost" onClick={() => setAsk(true)}>Done it?</button> : <button className="ar" aria-label={`Go to ${x.t}`} onClick={go}><Ic.Arrow s={14}/></button>}
      </>}</span>
    </div>;
  }

  function Todo({ T, done, setDone, say }) {
    const [showS, setShowS] = useState(false);
    const set = (k) => (v) => setDone({ ...done, [k]: v });
    const live = T.filter((x) => done[x.k] !== "dis" && done[x.k] !== "snz"), snz = T.filter((x) => done[x.k] === "snz");
    const nOpen = live.filter((x) => !(done[x.k] === "done" || x.done0)).length;
    return <section className="paper pp-card db-card db-todo"><div className="db-ch"><div className="pq-k">To do</div><small>{nOpen ? `${nOpen} open` : "All done"}</small></div>
      {PRI.map(([p, l, c, bg]) => { const xs = live.filter((x) => x.pri === p); if (!xs.length) return null;
        return <div key={p} className="db-pg"><div className="db-pl"><span style={{ color: c, background: bg }}>{l}</span></div>{xs.map((x) => <Item key={x.k} x={x} st={done[x.k]} set={set(x.k)} say={say}/>)}</div>; })}
      {!live.length && <p className="db-empty">Nothing for you right now. We'll tell you when something needs you.</p>}
      {snz.length > 0 && <div className="db-snz"><button className="lnk" onClick={() => setShowS(!showS)}>{`${snz.length} snoozed until your next visit`}{showS ? " · hide" : " · show"}</button>
        {showS && snz.map((x) => <div key={x.k}><span>{x.t}</span><button className="lnk" onClick={() => set(x.k)(undefined)}>Bring back</button></div>)}</div>}
    </section>;
  }
  Object.assign(window, { DBTodo: Todo });
})();
