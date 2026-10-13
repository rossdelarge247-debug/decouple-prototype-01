/* Dashboard — lean layout: compact dates + "your stuff" cards */
(function () {
  const Ic = window.DIc, DB = window.DB;
  function LeanDates({ K }) {
    const up = K.filter((k) => !k.done).slice(0, 3);
    if (!up.length) return null;
    return <div className="ln-dates"><span className="pq-k">Coming up</span>{up.map((k, i) => { const d = DB.days(k.d); return <span key={i} className={"ln-d" + (k.warn ? " wn" : "")} title={k.s}><b>{DB.fmt(k.d)}</b>{k.t}<small>{d === 0 ? "today" : d > 0 ? (d < 60 ? `in ${d} days` : `in ${Math.round(d / 30)} months`) : ""}</small></span>; })}</div>;
  }
  function LeanStuff({ N, vault, shared, sc, entries }) {
    const mine = vault.filter((v) => v.who === "a" || shared), bad = mine.filter((v) => ["old", "soon"].includes(DB.status(v).k)).length;
    const G = DB.GUIDES.filter((g) => g.at.includes(sc));
    const docs = sc === "finalise" || sc === "filed";
    const C = (h, t, s, ex, cls = "") => <button key={t} className={"paper ln-c " + cls} onClick={() => (location.hash = h)}><span className="t"><b>{t}</b><Ic.Arrow s={12}/></span><small>{s}</small>{ex}</button>;
    return <section className="ln-stuff"><div className="pq-k">Your stuff</div><div className="ln-g">
      {C("#journal", "Journal & help", "Something on your mind? Log it, or ask a question.", <span className="ln-in">Write or ask…</span>, "jr")}
      {C("#vault", "Evidence vault", `${mine.length} files · ${bad ? `${bad} need${bad === 1 ? "s" : ""} renewing` : "all current"}`, <span className="ln-bar"><i style={{ width: `${Math.round(((mine.length - bad) / Math.max(1, mine.length)) * 100)}%` }}></i></span>)}
      {docs && C("#hub", "Court documents", sc === "filed" ? "5 documents · filed 10 Oct" : "5 documents · 4 signed", null)}
      {C("#guides", "Guides", `${G.length} for where you are now`, <span className="ln-gt">{G.slice(0, 2).map((g) => <em key={g.id}>{g.t}</em>)}</span>)}
    </div></section>;
  }
  /* mirrors FN.TRACK in proto/finalise/fn-data.js; uses it directly when loaded */
  const TRACK0 = [["Submitted", "Sent to the court online."], ["Issued", "Usually 1–2 weeks."], ["With a judge", "Usually 4–8 weeks."], ["Approved and sealed", "Legally binding."], ["Apply for your final order", "Only once sealed."], ["Put it into effect", "Pension share, lump sum, maintenance."]];
  const trackState = () => { const f = window.Journey.get().finalise || {}, L = (window.FN && window.FN.TRACK) || TRACK0; return { f, L, t: Math.min(f.track || 0, L.length - 1) }; };
  function Tracker() {
    const { f, L, t } = trackState(), end = t >= L.length - 1 && (f.track || 0) >= L.length - 1, sealed = t >= 3;
    const foot = end ? "All done. Your financial order is in effect." : sealed ? (t === 3 ? "Your order is sealed and legally binding. You can now apply for your final divorce order." : "Next, put the order into effect: the pension share, lump sum and maintenance.") : "Nothing for you to do. We'll tell you both the moment anything changes.";
    return <section className="paper pp-card db-card db-trk"><div className="db-ch"><div className="pq-k" style={{ color: "#047857" }}>Court tracker</div><small>{f.filed && f.filed.ref ? `Ref ${f.filed.ref}` : ""}</small></div>
      <div className="db-tr" style={{ gridTemplateColumns: `repeat(${L.length},minmax(0,1fr))` }}>{L.map(([lb, d], i) => { const dn = i < t || end, on = i === t && !end; return <div key={lb} className={dn ? "dn" : on ? "on" : ""}><span className="n">{dn ? <Ic.Check s={10} w={3}/> : on ? <span className="pl"></span> : ""}</span><b>{lb}</b><small>{i === 0 && f.filed ? f.filed.at : on ? "Now" : d.split(". ").slice(-1)[0].replace(/\.$/, "")}</small></div>; })}</div>
      <div className="db-trf"><span>{foot}</span></div>
    </section>;
  }
  Object.assign(window, { DBLeanDates: LeanDates, DBLeanStuff: LeanStuff, DBTracker: Tracker, DBtrackState: trackState });
})();
