/* Decouple · Results — lock, data set-up, shell */
(function () {
  const { useState, useEffect, useMemo } = React;
  const R = window.R, SS = "decouple.results.unlocked", DEMO = new URLSearchParams(location.search).get("demo") === "1";
  const Arrow = () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>;
  const LockI = ({ s = 13 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>;

  function Lock({ onOpen }) {
    const st = R.read(), first = !st.pass;
    const [a, setA] = useState(""), [b, setB] = useState(""), [err, setErr] = useState("");
    const go = async (e) => {
      e.preventDefault(); setErr("");
      if (first) { if (a.length < 6) return setErr("Use at least 6 characters."); if (a !== b) return setErr("Those don’t match."); const h = await R.hash(a); R.save({ pass: h }); sessionStorage.setItem(SS, h); return onOpen(); }
      const h = await R.hash(a); if (h === st.pass) { sessionStorage.setItem(SS, h); onOpen(); } else setErr("That’s not the passcode.");
    };
    const reset = () => { if (confirm("Forget the passcode and the saved feed link on this browser? You’ll need to connect your sheet again.")) { R.save({ pass: null, feed: null, src: "sample" }); location.reload(); } };
    return (
      <div className="r-lock">
        <form className="r-lock-c" onSubmit={go}>
          <div className="r-lock-k"><LockI/> Results · private</div>
          <span className="wm">Decouple<i>.</i></span>
          <h1>{first ? "Set a passcode" : "Enter your passcode"}</h1>
          <p>{first ? "This locks the results page on this browser. Choose something only you know." : "The results page is locked on this browser."}</p>
          <input type="password" autoFocus autoComplete={first ? "new-password" : "current-password"} placeholder="Passcode" value={a} onChange={(e) => setA(e.target.value)}/>
          {first && <input type="password" autoComplete="new-password" placeholder="Type it again" value={b} onChange={(e) => setB(e.target.value)}/>}
          {err && <div className="err">{err}</div>}
          <button className="r-btn lg" type="submit">{first ? "Set passcode and open" : "Open results"} <Arrow/></button>
          {!first && <button type="button" className="r-link" onClick={reset}>Forgotten it? Reset this browser</button>}
        </form>
      </div>
    );
  }

  function Setup({ onClose, load, nLocal, onSite }) {
    const st = R.read();
    const [tab, setTab] = useState(st.respTab || "Form responses 1"), [url, setUrl] = useState(st.feed || ""), [msg, setMsg] = useState(""), [cp, setCp] = useState("");
    const F = R.formulas(tab);
    const copy = (t, k) => { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).catch(() => { const x = document.createElement("textarea"); x.value = t; document.body.appendChild(x); x.select(); document.execCommand("copy"); x.remove(); }); setCp(k); setTimeout(() => setCp(""), 1600); };
    const connect = async () => { if (!/^https:\/\/docs\.google\.com\//.test(url.trim())) return setMsg("Paste the link Google gives you in Publish to web. It starts https://docs.google.com/"); R.save({ feed: url.trim(), respTab: tab, src: "feed" }); setMsg("Loading…"); try { await load("feed"); onClose(); } catch (e) { setMsg(e.message); } };
    const file = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = async () => { try { await load("file", r.result, f.name); onClose(); } catch (er) { setMsg(er.message); } }; r.readAsText(f); };
    const pick = async (src) => { R.save({ src }); await load(src); onClose(); };
    return (
      <div className="r-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="r-modal" role="dialog" aria-modal="true" aria-label="Connect your data">
          <header><div><div className="kick">Connect your data</div><h2>{onSite ? "Connected to decouple.uk." : "From one sheet to a tab per test."}</h2></div><button className="r-x" onClick={onClose} aria-label="Close">×</button></header>
          {onSite && <div className="r-sitenote"><p>Answers come straight from the spreadsheet, through the signed-in part of the site. There’s nothing to publish, and each test already has its own tab.</p><button className="r-btn sm" onClick={() => pick("site")}>Use the live answers</button></div>}
          <div className={"r-steps" + (onSite ? " site" : "")}>
            <section>
              <div className="n tab">1</div>
              <div>
                <h3>Give each test its own tab</h3>
                <p>Every page sends its answers to the same Google Form, so they all land in one tab. Each row says which test it came from. Add a tab for each test below and paste its formula into cell A1. It fills itself as new answers arrive, and the original tab stays untouched.</p>
                <label className="r-field">Your answers tab is called<input value={tab} onChange={(e) => { setTab(e.target.value); R.save({ respTab: e.target.value }); }}/></label>
                <div className="r-fx">{F.map((f) => (
                  <div key={f.tab} className="r-fxr">
                    <div className="h"><b>{f.tab}</b><span>{f.why}</span></div>
                    <code>{f.f}</code>
                    <button className="r-btn sm ghost" onClick={() => copy(f.f, f.tab)}>{cp === f.tab ? "Copied" : "Copy formula"}</button>
                  </div>
                ))}</div>
                <p className="r-note">A tab shows an error until its first answer arrives. That’s normal. New tests get a line here when we build them.</p>
              </div>
            </section>
            <section>
              <div className="n tab">2</div>
              <div>
                <h3>Publish only the Feed tab</h3>
                <p>In Google Sheets: <b>File › Share › Publish to web</b>. Choose the <b>Feed</b> tab and <b>Comma-separated values (.csv)</b>, then Publish and copy the link.</p>
                <div className="r-row"><input className="r-in" placeholder="https://docs.google.com/spreadsheets/d/e/…/pub?gid=…&output=csv" value={url} onChange={(e) => setUrl(e.target.value)}/><button className="r-btn" onClick={connect}>Connect</button></div>
                {msg && <div className="r-msg">{msg}</div>}
                <p className="r-note">The Feed leaves out email addresses. Names and safety answers are never sent in the first place. Anyone with the link could read the feed, so keep it to yourself. The link is saved only in this browser, never in the page.</p>
              </div>
            </section>
            <section>
              <div className="n tab">3</div>
              <div>
                <h3>Or keep it all off the web</h3>
                <p>Skip publishing. On the Feed tab, <b>File › Download › Comma-separated values</b>, then choose the file here. It’s read in this browser and not saved anywhere.</p>
                <label className="r-btn ghost r-file">Choose a CSV file<input type="file" accept=".csv,text/csv" onChange={file}/></label>
              </div>
            </section>
          </div>
          <footer>
            <button className="r-link" onClick={() => pick("sample")}>Show sample data</button>
            <button className="r-link" onClick={() => pick("local")} disabled={!nLocal}>Use testing answers saved in this browser ({nLocal})</button>
          </footer>
        </div>
      </div>
    );
  }

  function App() {
    const [site, setSite] = useState(undefined);
    const [open, setOpen] = useState(() => { if (DEMO) return true; const p = R.read().pass; return !!p && sessionStorage.getItem(SS) === p; });
    const [data, setData] = useState({ rows: [], src: "", at: null, name: "", signups: null }), [busy, setBusy] = useState(false), [err, setErr] = useState("");
    const [view, setView] = useState(() => location.hash.slice(1) || "overview"), [days, setDays] = useState("all"), [setup, setSetup] = useState(false);
    const hsw = React.useRef(null);
    const load = async (src, text, name) => {
      setBusy(true); setErr("");
      try {
        if (src === "site") { const r = await window.DC.results(); if (!r.ok || !r.data) throw new Error(r.status === 401 || r.status === 404 ? "You’re signed out. Sign in again." : "The spreadsheet didn’t answer (" + (r.status || "no connection") + ")."); setData({ rows: R.fromApi(r.data.rows), src, at: new Date(), name: "", signups: r.data.signups || null }); return; }
        const rows = src === "feed" ? await R.fromFeed(R.read().feed) : src === "file" ? R.fromCSV(text) : src === "local" ? R.fromLocal() : window.RSample();
        setData({ rows, src, at: new Date(), name: name || "", signups: src === "sample" ? window.RSampleSignups() : null });
      }
      finally { setBusy(false); }
    };
    useEffect(() => { (window.DC ? window.DC.session() : Promise.resolve(null)).then((x) => { setSite(x); if (x && x.owner) setOpen(true); }); }, []);
    useEffect(() => { if (hsw.current && window.HubSwitch) window.HubSwitch.mount(hsw.current); });
    useEffect(() => {
      if (!open || site === undefined) return;
      if (DEMO) { load("sample"); return; }
      if (site && site.owner) { const s = R.read(); (s.src === "sample" || s.src === "file" ? load("sample") : load("site")).catch(async (e) => { await load("sample"); setErr(e.message + " Showing sample data instead."); }); return; }
      const s = R.read(), src = s.src === "feed" && s.feed ? "feed" : s.src === "local" ? "local" : "sample";
      load(src).catch(async (e) => { await load("sample"); setErr("Couldn’t load the feed: " + e.message + " Showing sample data instead."); });
    }, [open, site]);
    useEffect(() => { history.replaceState(null, "", "#" + view); window.scrollTo(0, 0); }, [view]);
    const rows = useMemo(() => { if (days === "all") return data.rows; const cut = Date.now() - +days * 864e5; return data.rows.filter((r) => r.t >= cut); }, [data, days]);
    const byT = useMemo(() => R.by(rows, (r) => r.test), [rows]);
    const nLocal = useMemo(() => R.fromLocal().length, [setup]);
    const onSite = !!(site && site.owner);
    if (site === undefined && !DEMO) return <div className="r-empty big">Loading…</div>;
    if (!open) return <Lock onOpen={() => setOpen(true)}/>;
    const tests = [...R.TESTS, R.OTHER].filter((t) => byT[t.id] || t.id === "m02" || t.id === "proto"), t = tests.find((x) => x.id === view);
    const V = !t ? null : t.id === "m02" ? window.RM02 : t.id === "proto" ? window.RProto : window.RGeneric;
    const srcL = { sample: ["Sample data", "amb"], site: ["decouple.uk · live", "grn"], feed: ["Live feed", "grn"], file: ["File · " + data.name, "grn"], local: ["This browser’s testing answers", "grn"] }[data.src] || ["Loading…", ""];
    return (
      <div className="r-app">
        <header className="r-top">
          <span className="wm">Decouple<i>.</i></span><div ref={hsw} data-hubsw="results" data-date="October 2026"></div><span className="r-priv"><LockI s={11}/> Private</span>
          <div className="r-top-r">
            <span className={"r-src " + srcL[1]}><i></i>{srcL[0]}{data.at && (data.src === "feed" || data.src === "site") ? " · " + R.ago(data.at).replace(" ago", "") : ""}</span>
            {(data.src === "feed" || data.src === "site") && <button className="r-tb" onClick={() => load(data.src).catch((e) => setErr(e.message))} disabled={busy}>{busy ? "Loading…" : "Refresh"}</button>}
            {!DEMO && <button className="r-tb" onClick={() => setSetup(true)}>{onSite ? "Data source" : "Connect data"}</button>}
            {!DEMO && !onSite && <button className="r-tb icon" onClick={() => { sessionStorage.removeItem(SS); setOpen(false); }} aria-label="Lock" title="Lock"><LockI s={14}/></button>}
          </div>
        </header>
        <div className="r-body">
          <nav className="r-rail" aria-label="Tests">
            <button className={"r-ri" + (view === "overview" ? " on" : "")} onClick={() => setView("overview")}><span className="c">All</span><span className="t"><b>Overview</b></span><span className="n tab">{R.sids(rows).size}</span></button>
            <div className="r-rl">Tests</div>
            {tests.map((x) => <button key={x.id} className={"r-ri" + (view === x.id ? " on" : "")} onClick={() => setView(x.id)}><span className="c tab">{x.code}</span><span className="t"><b>{x.name}</b><small>{x.kind}</small></span><span className="n tab">{R.sids(byT[x.id] || []).size}</span></button>)}
            <div className="r-rl">Time</div>
            <window.RSeg value={days} onChange={setDays} options={[["7", "7 days"], ["30", "30 days"], ["all", "All"]]}/>
            <p className="r-rn">Counts are people (unique sessions), not answers.</p>
          </nav>
          <main className="r-main">
            {err && <div className="r-banner err">{err}</div>}
            {data.src === "sample" && <div className="r-banner"><span><b>You’re looking at sample data.</b> It’s generated in the same format the pages send, so every chart works before real answers arrive.</span>{!DEMO && <button className="r-btn sm" onClick={() => (onSite ? load("site").then(() => R.save({ src: "site" })).catch((e) => setErr(e.message)) : setSetup(true))}>{onSite ? "Show the live answers" : "Connect your sheet"} <Arrow/></button>}</div>}
            {!data.src ? <div className="r-empty big">Loading…</div> : view === "overview" || !t ? <window.ROverview rows={rows} onOpen={setView} signups={data.signups}/> : <V key={t.id} rows={byT[t.id] || []} t={t}/>}
          </main>
        </div>
        {setup && <Setup onClose={() => setSetup(false)} load={load} nLocal={nLocal} onSite={onSite}/>}
      </div>
    );
  }
  ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
})();
