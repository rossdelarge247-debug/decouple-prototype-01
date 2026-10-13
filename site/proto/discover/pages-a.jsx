/* Discover — Landing, The picture, How it works */
(function () {
  const { useState } = React;
  const Ic = window.DIc, go = window.dGo;
  const C = { indigo: "#4338CA", magenta: "#9D174D", sky: "#0369A1", green: "#166534" };

  const AREAS = [
    { k: "fin", n: "01", t: "Finances", c: C.indigo, soft: "#EEF2FF", ic: Ic.Bank,
      rows: [["Assets", "£612,400"], ["Pensions", "£148,200"], ["Debts", "£42,180"]],
      more: "Accounts pulled in read-only through Open Banking, then sorted into what's shared and what's yours.",
      d: "Accounts, pensions, property and debts — pulled in and classified for you.",
      li: ["Read-only bank connection", "Pension values in one place", "Debts split out, not hidden"], pos: { x: -34, y: 26, r: -5, w: 186 } },
    { k: "kid", n: "02", t: "Children", c: C.magenta, soft: "#FCE7F3", ic: Ic.Kid,
      rows: [["Living", "Shared 60/40"], ["Holidays", "Alternating"], ["Schools", "Continued"]],
      more: "A parenting plan in plain language, written child-first and agreed by you both.",
      d: "Living arrangements, schooling and time together, written in plain language.",
      li: ["Week-by-week living pattern", "Holidays and special days", "School and health decisions"], pos: { x: 318, y: 6, r: 4, w: 180 } },
    { k: "home", n: "03", t: "Housing", c: C.sky, soft: "#E0F2FE", ic: Ic.Home,
      rows: [["Family home", "Sarah stays"], ["Move date", "12 months"], ["Mortgage", "Refinanced"]],
      more: "Stay, sell or transfer. Each route modelled side by side so you can see what's fair.",
      d: "Who stays, who moves, and how the home is dealt with — fairly.",
      li: ["Stay, sell or transfer modelled", "Mortgage capacity checked", "Moving dates agreed"], pos: { x: -16, y: 350, r: 3, w: 176 } },
    { k: "fut", n: "04", t: "Future needs", c: C.green, soft: "#D1FAE5", ic: Ic.Spark,
      rows: [["Maintenance", "£1,200/mo"], ["Career restart", "Funded"], ["Pension share", "32%"]],
      more: "Maintenance and pension sharing set so you both start from a fair footing.",
      d: "Maintenance, pension sharing and a fair footing for the years ahead.",
      li: ["Spousal & child maintenance", "Pension sharing orders", "A clean break where possible"], pos: { x: 312, y: 372, r: -3, w: 196 } },
  ];

  function Composition() {
    const [open, setOpen] = useState(null);
    const [hover, setHover] = useState(null);
    const hl = hover || open;
    return (
      <div className="comp">
        <div className="spine">
          <div className="spine-tab">THE SETTLEMENT</div>
          <div style={{ padding: "28px 20px 0" }}>
            <div className="kick" style={{ color: "#78716C", fontSize: 9.5 }}>One document</div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.15, marginTop: 6 }}>Everything, agreed</div>
            <div className="serif" style={{ fontSize: 12.5, fontStyle: "italic", color: "#57534E", marginTop: 4 }}>covering all four areas</div>
          </div>
          <div style={{ margin: "20px 20px 0", display: "grid", gap: 10 }}>
            {AREAS.map((a, i) => (
              <div key={a.k} className={"spine-row" + (hl === a.k ? " hl" : "")}>
                <span className="tab" style={{ fontSize: 10, color: a.c, fontWeight: 700 }}>§{i + 1}</span>
                <span style={{ flex: 1 }}>{a.t}</span><Ic.Check s={11} w={2.4} c={a.c}/>
              </div>
            ))}
          </div>
          <div style={{ margin: "20px 20px 0", paddingTop: 16, borderTop: "1px solid #E5E3DC" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#78716C" }}><span>Court-ready</span><span className="tab">v1 · draft</span></div>
            <div style={{ marginTop: 12, display: "flex", gap: 6 }}>{Array.from({ length: 14 }).map((_, i) => <span key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < 9 ? "#1A1A1A" : "#E5E3DC" }}></span>)}</div>
          </div>
        </div>
        {AREAS.map((a) => (
          <button key={a.k} className={"acard" + (open === a.k ? " open" : "")} aria-expanded={open === a.k}
            style={{ "--x": a.pos.x + "px", "--y": a.pos.y + "px", "--r": a.pos.r + "deg", "--w": a.pos.w + "px", "--c": a.c }}
            onMouseEnter={() => setHover(a.k)} onMouseLeave={() => setHover(null)} onClick={() => setOpen(open === a.k ? null : a.k)}>
            <div className="ah"><i></i><span>Area {a.n}</span><Ic.Plus s={12} c="#A8A29E"/></div>
            <h4>{a.t}</h4>
            <div className="rows">{a.rows.map((r) => <div key={r[0]}><span>{r[0]}</span><b>{r[1]}</b></div>)}</div>
            <div className="more"><div><p>{a.more}</p></div></div>
          </button>
        ))}
      </div>
    );
  }

  function Landing({ onStart }) {
    return (
      <main>
        <div className="wrap hero">
          <div style={{ paddingTop: 14 }}>
            <div className="pill-kick"><span className="kick">The complete settlement workspace for separating couples</span></div>
            <h1 className="serif h-hero">Sort out your<br/>separation —<br/><span className="em">together</span>.</h1>
            <p className="serif lede">Finances, children, the home — all of it — settled for £499 between you, in about 3 months. Instead of £15,000 and 18 months.</p>
            <div className="hero-cta">
              <div><button className="btn lg" onClick={onStart}>Start your free interview <Ic.Arrow s={16}/></button><span className="note tab">~5 minutes · no account needed</span></div>
              <button className="link" onClick={() => go("how")} style={{ marginBottom: 22 }}>How it works <Ic.Down s={13}/></button>
            </div>
            <div className="trust">
              <span><Ic.Shield s={13} c="#78716C"/> FCA-authorised bank connection via Tink</span>
              <span><Ic.Lock s={13} c="#78716C"/> Read-only · we can't move money</span>
              <span className="yes"><Ic.Check s={13} w={2.1} c="#166534"/> Free until you choose a plan</span>
            </div>
          </div>
          <Composition/>
        </div>
        <div className="wrap explore">
          {[["picture", "The picture", "Four areas, one living document you both can see."], ["how", "How it works", "Four phases in the right order, about 3 months."], ["why", "Why Decouple", "Same outcome as solicitors, a fraction of the cost."]].map(([k, t, d]) => (
            <button key={k} className="xcard" onClick={() => go(k)}><span className="t">{t}<Ic.Arrow s={16}/></span><span className="d">{d}</span></button>
          ))}
        </div>
      </main>
    );
  }

  Object.assign(window, { DLanding: Landing, DAREAS: AREAS });
})();
