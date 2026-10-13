/* Decouple · Results — charts and cards */
(function () {
  const R = window.R;
  const COL = { v: "#5B21B6", vl: "#A78BFA", vs: "#DDD0FE", ind: "#4338CA", mag: "#9D174D", sky: "#0369A1", grn: "#047857", amb: "#B45309", line: "#E7E3DC" }, C = COL;

  function Card({ title, sub, right, span, children, className }) {
    return (
      <section className={"r-card" + (span ? " span" : "") + (className ? " " + className : "")}>
        {(title || right) && <header><div>{title && <h3>{title}</h3>}{sub && <p>{sub}</p>}</div>{right}</header>}
        {children}
      </section>
    );
  }
  const Empty = ({ children }) => <div className="r-empty">{children || "No answers yet."}</div>;

  function Kpis({ items }) {
    return <div className="r-kpis">{items.map((k) => <div key={k.l} className="r-kpi"><b className="tab">{k.v}</b><span>{k.l}</span>{k.s && <small>{k.s}</small>}</div>)}</div>;
  }

  function Bars({ items, color = COL.v, n, mean }) {
    if (!items.length) return <Empty/>;
    const max = Math.max(...items.map((x) => x.n));
    return (
      <div className="r-bars">
        {items.map((x) => (
          <div key={x.label} className="r-bar">
            <span className="l" title={x.label}>{x.label}</span>
            <span className="tr"><i style={{ width: (x.n / max) * 100 + "%", background: color }}></i></span>
            <span className="v tab">{x.p}%<small>{x.n}</small></span>
          </div>
        ))}
        {(n != null || mean != null) && <div className="r-foot">{n != null && <span>{n} answered</span>}{mean != null && <span>Average <b className="tab">{mean}</b></span>}</div>}
      </div>
    );
  }

  /* 100% stacked rows. keys: [{label, c}] in segment order; rows: [{label, sub, parts:[n…], extra}] */
  function Stack({ rows, keys, extraHead }) {
    return (
      <div className="r-stack">
        <div className="r-legend">{keys.map((k) => <span key={k.label}><i style={{ background: k.c }}></i>{k.label}</span>)}{extraHead && <span className="x">{extraHead}</span>}</div>
        {rows.map((r) => { const tot = r.parts.reduce((a, b) => a + b, 0) || 1; return (
          <div key={r.label} className={"r-srow" + (r.extra != null ? " ex" : "")}>
            <span className="l"><b>{r.label}</b>{r.sub && <small>{r.sub}</small>}</span>
            <span className="sb">{r.parts.map((p, i) => p > 0 && <i key={i} style={{ width: (p / tot) * 100 + "%", background: keys[i].c, color: keys[i].ink || "#FFF" }} title={`${keys[i].label}: ${p} (${R.pct(p, tot)}%)`}>{p / tot >= 0.12 ? R.pct(p, tot) + "%" : ""}</i>)}</span>
            <span className="n tab">{tot}</span>
            {r.extra != null && <span className="x tab">{r.extra}</span>}
          </div>
        ); })}
      </div>
    );
  }

  function Funnel({ steps }) {
    if (!steps.length || !steps[0].n) return <Empty/>;
    const top = steps[0].n; let prev = top;
    return (
      <div className="r-funnel">
        {steps.map((s, i) => { const drop = !s.cond && i && prev ? Math.round(((prev - s.n) / prev) * 100) : 0; if (!s.cond) prev = s.n; return (
          <div key={s.label} className={"r-fs" + (s.group ? " g" : "")}>
            <span className="l" title={s.label}>{s.label}</span>
            <span className="tr"><i style={{ width: (s.n / top) * 100 + "%", background: s.c || C.v }}></i></span>
            <span className="v tab"><b>{s.n}</b><span>{R.pct(s.n, top)}%</span></span>
            <span className={"d tab" + (drop >= 20 ? " hi" : "")}>{drop > 0 ? "−" + drop + "%" : ""}</span>
          </div>
        ); })}
      </div>
    );
  }

  function Spark({ data, color = COL.v, h = 36 }) {
    const w = 160, max = Math.max(1, ...data), pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 2 - (v / max) * (h - 6)}`).join(" ");
    return <svg className="r-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity=".08"/><polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke"/></svg>;
  }

  /* Van Westendorp chart */
  function VW({ d, accent = COL.v }) {
    if (!d) return <Empty>Needs at least 3 complete price answers.</Empty>;
    const W = 520, H = 230, L = 40, B = 26, T = 10, Rr = 10, x0 = d.grid[0], x1 = d.grid[d.grid.length - 1];
    const X = (p) => L + ((p - x0) / (x1 - x0 || 1)) * (W - L - Rr), Y = (v) => T + (1 - v) * (H - T - B);
    const line = (a) => d.grid.map((p, i) => `${X(p)},${Y(a[i])}`).join(" ");
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => x0 + f * (x1 - x0));
    const S = [["tooCheap", "Too cheap", "#A8A29E", "4 3"], ["cheap", "A bargain", accent, "4 3"], ["dear", "Getting expensive", accent, ""], ["tooDear", "Too expensive", "#1A1A1A", ""]];
    const f = (v) => (v == null ? "—" : "£" + Math.round(v).toLocaleString("en-GB"));
    return (
      <div className="r-vw">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Price sensitivity curves">
          {d.pmc != null && d.pme != null && <rect x={X(d.pmc)} y={T} width={Math.max(0, X(d.pme) - X(d.pmc))} height={H - T - B} fill={accent} opacity=".07"/>}
          {[0, 0.5, 1].map((v) => <g key={v}><line x1={L} x2={W - Rr} y1={Y(v)} y2={Y(v)} stroke="#EEEAE4"/><text x={L - 6} y={Y(v) + 3} textAnchor="end">{v * 100}%</text></g>)}
          {ticks.map((p, i) => <text key={i} x={X(p)} y={H - 8} textAnchor="middle">£{Math.round(p).toLocaleString("en-GB")}</text>)}
          {S.map(([k, , c, dash]) => <polyline key={k} points={line(d.cur[k])} fill="none" stroke={c} strokeWidth="1.8" strokeDasharray={dash}/>)}
          {d.opp != null && <g><line x1={X(d.opp)} x2={X(d.opp)} y1={T} y2={H - B} stroke={accent} strokeDasharray="2 3"/><circle cx={X(d.opp)} cy={T + 4} r="3.5" fill={accent}/></g>}
        </svg>
        <div className="r-legend sm">{S.map(([k, l, c, dash]) => <span key={k}><i className={dash ? "dash" : ""} style={{ background: dash ? "none" : c, borderColor: c }}></i>{l}</span>)}</div>
        <div className="r-vwk">
          <div><small>Acceptable range</small><b className="tab">{f(d.pmc)} – {f(d.pme)}</b></div>
          <div><small>Optimal price</small><b className="tab">{f(d.opp)}</b></div>
          <div><small>Indifference</small><b className="tab">{f(d.ipp)}</b></div>
          <div><small>Answers</small><b className="tab">{d.N}</b></div>
        </div>
      </div>
    );
  }

  function Quotes({ rows, max = 8 }) {
    const [all, setAll] = React.useState(false);
    if (!rows.length) return <Empty>No written answers yet.</Empty>;
    const list = [...rows].sort((a, b) => b.t - a.t), shown = all ? list : list.slice(0, max);
    return (
      <div className="r-quotes">
        {shown.map((r, i) => <blockquote key={i}><p>{r.a}</p><cite>{r.pid !== "anon" ? r.pid + " · " : ""}{r.meta ? r.meta + " · " : ""}{R.fmtD(r.t)}</cite></blockquote>)}
        {list.length > max && <button className="r-link" onClick={() => setAll(!all)}>{all ? "Show fewer" : `Show all ${list.length}`}</button>}
      </div>
    );
  }

  /* one question → the right chart */
  function QCard({ title, rows, order, color, sub }) {
    const free = rows.length && rows.every((r) => r.type === "long" || r.type === "text" || (r.type === "probe" && r.a.length > 40));
    const nums = rows.length && rows.every((r) => /^\d+$/.test(r.a)) && new Set(rows.map((r) => r.a)).size <= 10;
    let body;
    if (!rows.length) body = <Empty/>;
    else if (free) body = <Quotes rows={rows} max={4}/>;
    else {
      const d = R.dist(rows, nums ? null : order);
      if (nums) d.items.sort((a, b) => +a.label - +b.label);
      body = <Bars items={d.items} color={color} n={d.n} mean={nums ? R.mean(rows.map((r) => +r.a)).toFixed(1) : null}/>;
    }
    return <Card title={title} sub={sub} className="q">{body}</Card>;
  }

  Object.assign(window, { RCOL: COL, RCard: Card, REmpty: Empty, RKpis: Kpis, RBars: Bars, RStack: Stack, RFunnel: Funnel, RSpark: Spark, RVW: VW, RQuotes: Quotes, RQCard: QCard });
})();
