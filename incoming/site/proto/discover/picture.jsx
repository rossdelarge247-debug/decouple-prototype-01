/* Discover — The picture. Product-paper imagery: tabbed household paper, per-area mini graphics, reconcile diagram. */
(function () {
  const { useState } = React;
  const Ic = window.DIc, go = window.dGo;
  const AREAS = window.DAREAS;
  const S = "#5B21B6", M = "#0369A1";
  const gbp = (n) => (n < 0 ? "−" : "") + "£" + Math.abs(n).toLocaleString("en-GB");

  const FIN = [["Home equity", 242500, "#4338CA"], ["Pensions", 148200, "#6366F1"], ["Savings & ISAs", 38400, "#A5B4FC"], ["Cars", 20500, "#C7D2FE"], ["Debts", -42180, "#E5E3DC"]];

  function TabFinances() {
    const pos = FIN.filter((f) => f[1] > 0), tot = pos.reduce((n, f) => n + f[1], 0), net = FIN.reduce((n, f) => n + f[1], 0);
    return (
      <>
        <div className="hp-big"><span>Net household</span><b className="tab">{gbp(net)}</b></div>
        <div className="hp-stack">{pos.map((f) => <i key={f[0]} style={{ flex: f[1] / tot, background: f[2] }} title={f[0]}></i>)}</div>
        <div className="hp-rows">{FIN.map((f) => <div key={f[0]}><span><i style={{ background: f[2] }}></i>{f[0]}</span><b className="tab" style={{ color: f[1] < 0 ? "#B91C1C" : undefined }}>{gbp(f[1])}</b></div>)}</div>
      </>
    );
  }
  const WEEK = "SSSSMMM SSSSSMM".replace(" ", "").split("");
  function TabChildren() {
    return (
      <>
        <div className="hp-kids">{[["Ella", 9], ["Sam", 13]].map(([n, a]) => <span key={n}><b>{n}</b> {a}</span>)}</div>
        <div className="hp-lbl">Living pattern · fortnight</div>
        <div className="hp-week">{WEEK.map((w, i) => <div key={i} style={{ background: w === "S" ? "#F3EEFE" : "#E0F2FE", color: w === "S" ? S : M }}><small>{"MTWTFSS"[i % 7]}</small>{w}</div>)}</div>
        <div className="hp-legend"><span><i style={{ background: S }}></i>Sarah · 9 nights</span><span><i style={{ background: M }}></i>Mark · 5 nights</span></div>
        <div className="hp-rows" style={{ marginTop: 12 }}>{[["Holidays", "Alternating years"], ["School", "St Mary's continues"], ["Big decisions", "Made together"]].map(([a, b]) => <div key={a}><span>{a}</span><b>{b}</b></div>)}</div>
      </>
    );
  }
  function TabHousing() {
    const [pick, setPick] = useState("stay");
    const opts = { stay: ["Sarah stays", "Refinances to buy out Mark's share", "£121,250 to Mark"], sell: ["Sell the home", "Equity split after the mortgage is cleared", "£121,250 each"], transfer: ["Transfer later", "Sarah stays until Sam turns 18, then sell", "Deferred to 2030"] };
    return (
      <>
        <div className="hp-opts">{Object.entries(opts).map(([k, [t]]) => <button key={k} className={pick === k ? "on" : ""} onClick={() => setPick(k)}>{t}</button>)}</div>
        <div className="hp-house">
          <div className="hp-lbl">Equity · £485,000 home, £242,500 mortgage</div>
          <div className="hp-eq"><i style={{ flex: 1, background: "#E5E3DC" }}>Mortgage</i><i style={{ flex: 1, background: "#E0F2FE", color: "#0369A1" }}>Equity £242,500</i></div>
          <div className="hp-out"><b>{opts[pick][0]}</b><span>{opts[pick][1]}</span><em className="tab">{opts[pick][2]}</em></div>
        </div>
      </>
    );
  }
  function TabFuture() {
    const bars = [1200, 1200, 1000, 800, 600, 0];
    return (
      <>
        <div className="hp-big"><span>Maintenance to Sarah</span><b className="tab">£1,200<small>/mo</small></b></div>
        <div className="hp-bars">{bars.map((b, i) => <div key={i}><i style={{ height: (b / 1200) * 64 + 4, background: b ? "#166534" : "#E5E3DC" }}></i><small>Y{i + 1}</small></div>)}</div>
        <div className="hp-rows">{[["Steps down to", "A clean break in year 6"], ["Pension share", "32% of Mark's pension"], ["Career restart", "Retraining funded"]].map(([a, b]) => <div key={a}><span>{a}</span><b>{b}</b></div>)}</div>
      </>
    );
  }
  const TABS = [["fin", "Finances", "#4338CA", TabFinances], ["kid", "Children", "#9D174D", TabChildren], ["home", "Housing", "#0369A1", TabHousing], ["fut", "Future", "#166534", TabFuture]];

  function HouseholdPaper() {
    const [t, setT] = useState("fin");
    const cur = TABS.find((x) => x[0] === t), Body = cur[3];
    return (
      <div className="hp" style={{ "--c": cur[2] }}>
        <div className="hp-tabs" role="tablist">{TABS.map(([k, l, c]) => <button key={k} role="tab" aria-selected={t === k} className={t === k ? "on" : ""} style={{ "--tc": c }} onClick={() => setT(k)}>{l}</button>)}</div>
        <div className="hp-paper">
          <div className="hp-head"><div><div className="hp-k">Our household picture</div><div className="hp-t">{cur[1]}</div></div><span className="hp-ver"><i></i>Shared · v3</span></div>
          <Body/>
          <div className="hp-foot"><span className="av" style={{ background: S }}>S</span><span className="av" style={{ background: M, marginLeft: -6 }}>M</span><span>Both of you see this</span><span style={{ marginLeft: "auto" }}>Updated 14 Nov</span></div>
        </div>
      </div>
    );
  }

  /* per-area mini graphics */
  const Viz = {
    fin: () => (<div className="viz-fin"><div className="hp-stack">{FIN.filter((f) => f[1] > 0).map((f) => <i key={f[0]} style={{ flex: f[1], background: f[2] }}></i>)}</div><div className="vf-l">{FIN.slice(0, 3).map((f) => <span key={f[0]}><i style={{ background: f[2] }}></i>{f[0]}</span>)}</div></div>),
    kid: () => (<div className="hp-week sm">{WEEK.slice(0, 7).map((w, i) => <div key={i} style={{ background: w === "S" ? "#FFF" : "#FBCFE8", color: "#9D174D" }}><small>{"MTWTFSS"[i]}</small></div>)}</div>),
    home: () => (<div className="viz-home">{["Stay", "Sell", "Transfer"].map((o, i) => <span key={o} className={i === 0 ? "on" : ""}>{i === 0 && <Ic.Check s={10} w={3}/>}{o}</span>)}</div>),
    fut: () => (<div className="hp-bars sm">{[1, 1, .8, .6, .4, 0].map((b, i) => <div key={i}><i style={{ height: b * 44 + 4, background: b ? "#166534" : "#FFF" }}></i></div>)}</div>),
  };

  const RC = [["Home equity", 242500, 242500], ["Mark's pension", 148200, 131000], ["Joint savings", 38400, 38400], ["Family car", 12000, 8500]];
  function Reconcile() {
    const [only, setOnly] = useState(false);
    const rows = RC.filter((r) => !only || r[1] !== r[2]);
    const Side = ({ who, c, idx }) => (
      <div className="rc-paper">
        <div className="rc-h"><span className="av" style={{ background: c }}>{who[0]}</span><span>{who + "'s picture"}</span><span className="rc-priv">Shared</span></div>
        {rows.map((r) => <div key={r[0]} className="rc-row"><span>{r[0]}</span><b className="tab">{gbp(r[idx])}</b></div>)}
      </div>
    );
    return (
      <section className="rc">
        <div className="rc-top">
          <div>
            <div className="kick">They reconcile automatically</div>
            <h3 className="serif rc-title">Two pictures in. <span className="em">Only the differences out.</span></h3>
            <p className="p-lede" style={{ marginTop: 12 }}>When you and your ex-partner each build a picture, Decouple lines them up item by item. What matches is agreed; what doesn't becomes a short list to talk through.</p>
          </div>
          <label className="rc-toggle"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)}/><span className="sw"></span>Only show differences</label>
        </div>
        <div className="rc-diagram">
          <Side who="Sarah" c={S} idx={1}/>
          <div className="rc-arrow"><Ic.Arrow s={18} c="#A8A29E"/></div>
          <div className="rc-paper hh">
            <div className="rc-h"><Ic.Home s={14} c="#5B21B6"/>Household<span className="rc-priv hh">{RC.filter((r) => r[1] === r[2]).length} agreed · {RC.filter((r) => r[1] !== r[2]).length} to talk about</span></div>
            {rows.map((r) => { const ok = r[1] === r[2]; return (
              <div key={r[0]} className={"rc-row " + (ok ? "ok" : "diff")}><span>{ok ? <Ic.Check s={12} w={2.6} c="#047857"/> : <span className="dd"></span>}{r[0]}</span><b className="tab">{ok ? gbp(r[1]) : gbp(Math.abs(r[1] - r[2])) + " apart"}</b></div>); })}
          </div>
          <div className="rc-arrow flip"><Ic.Arrow s={18} c="#A8A29E"/></div>
          <Side who="Mark" c={M} idx={2}/>
        </div>
        <div className="rc-cta"><button className="btn" onClick={() => go("how")}>See how it works <Ic.Arrow s={14}/></button></div>
      </section>
    );
  }

  function Picture({ onStart }) {
    return (
      <main className="wrap page-pad pic">
        <section className="pic-hero">
          <div>
            <div className="kick">One picture · not a pile of paperwork</div>
            <h2 className="serif h2">A separation touches four things.<br/><span className="em">Decouple holds all four in one place.</span></h2>
            <p className="p-lede">No spreadsheets, no Word docs, no back-and-forth over email. One living picture that both of you can see, building quietly toward a single court-ready agreement.</p>
            <div style={{ marginTop: 26 }}><button className="btn lg" onClick={onStart}>Start your free interview <Ic.Arrow s={16}/></button></div>
          </div>
          <HouseholdPaper/>
        </section>
        <div className="areas pic-areas">
          {AREAS.map((a) => { const V = Viz[a.k]; return (
            <div key={a.k} className="area">
              <div className="viz" style={{ background: a.soft }}><V/></div>
              <div className="n tab" style={{ color: a.c }}>{a.n}</div>
              <h3>{a.t}</h3>
              <p>{a.d}</p>
              <ul>{a.li.map((l) => <li key={l}><Ic.Check s={13} w={2.2} c={a.c} style={{ marginTop: 2, flexShrink: 0 }}/>{l}</li>)}</ul>
            </div>); })}
        </div>
        <Reconcile/>
      </main>
    );
  }

  Object.assign(window, { DPicture: Picture });
})();
