/* Decouple · Results — views: overview, M02 guide, prototype testing, generic */
(function () {
  const { useState, useMemo } = React;
  const R = window.R, C = window.RCOL;
  const Card = window.RCard, Kpis = window.RKpis, Bars = window.RBars, Stack = window.RStack, Funnel = window.RFunnel, Spark = window.RSpark, VW = window.RVW, Quotes = window.RQuotes, QCard = window.RQCard, Empty = window.REmpty;

  const dl = (name, text) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
  const Seg = ({ value, options, onChange, label }) => (
    <div className="r-seg" role="radiogroup" aria-label={label}>{label && <span className="lb">{label}</span>}{options.map(([v, l]) => <button key={v} role="radio" aria-checked={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>{l}</button>)}</div>
  );
  function Head({ t, rows, children }) {
    return (
      <div className="r-head">
        <div><div className="kick">{t.code} · {t.kind}</div><h1>{t.name}</h1><p>{t.sub}</p></div>
        <div className="r-head-r">{children}<button className="r-btn ghost" onClick={() => dl(`${t.tab || t.name}.csv`, R.toCSV(rows))} disabled={!rows.length}>Download CSV</button></div>
      </div>
    );
  }
  const Sec = ({ n, title, sub, children }) => <div className="r-sec"><div className="r-sec-h"><span className="tab">{n}</span><div><h2>{title}</h2>{sub && <p>{sub}</p>}</div></div><div className="r-grid">{children}</div></div>;
  const ci = (k, n) => (n ? Math.round(196 * Math.sqrt((k / n) * (1 - k / n) / n)) : 0);

  /* ── overview ── */
  function Overview({ rows, onOpen, signups }) {
    const g = R.by(rows, (r) => r.test), tests = [...R.TESTS, R.OTHER].filter((t) => g[t.id] || t.id === "m02" || t.id === "proto");
    const head = (t, rs) => {
      if (t.id === "m02") { const p = R.sids(rs), d = R.sids(rs, (r) => r.k === "done"), f = R.sids(rs, (r) => r.k === "full"); return [["Finished interview", R.pct(d.size, p.size) + "%"], ["Finished the guide", R.pct(f.size, p.size) + "%"]]; }
      if (t.id === "proto") { const e = rs.filter((r) => r.type === "ease7").map((r) => +r.a), q = rs.filter((r) => r.type === "rating5").map((r) => +r.a); return [["Average ease", e.length ? R.mean(e).toFixed(1) + " / 7" : "—"], ["Average rating", q.length ? R.mean(q).toFixed(1) + " / 5" : "—"]]; }
      return [];
    };
    return (
      <>
        <div className="r-head"><div><div className="kick">Overview</div><h1>Every test, in one place.</h1><p>{rows.length.toLocaleString("en-GB")} answers from {R.sids(rows).size} people.</p></div></div>
        {signups && <Sec n="—" title="Sign-ups" sub="From the holding page, the guide’s ‘tell me when it opens’ and its ‘stay involved’ step. Email addresses stay in the spreadsheet.">
          <Kpis items={[{ v: signups.count, l: "Sign-ups in total" }, { v: (signups.byDay || []).slice(-7).reduce((a, b) => a + b, 0), l: "In the last 7 days" }]}/>
          <Card title="Where they are" sub="Optional question"><Bars items={Object.entries(signups.byStage || {}).map(([label, n]) => ({ label: STAGE_L[label] || label || "Didn’t say", n, p: R.pct(n, signups.count) })).sort((a, b) => b.n - a.n)}/></Card>
          <Card title="By day" sub="Last 28 days"><Spark data={(signups.byDay || []).slice(-28)} h={60}/></Card>
        </Sec>}
        <div className="r-tests">{tests.map((t) => { const rs = g[t.id] || [], last = rs.reduce((m, r) => (r.t > m ? r.t : m), new Date(0)); return (
          <button key={t.id} className="r-test" onClick={() => onOpen(t.id)}>
            <div className="top"><span className="code tab">{t.code}</span><span className="pill">{t.kind}</span></div>
            <h3>{t.name}</h3><p>{t.sub}</p>
            <div className="nums"><div><b className="tab">{R.sids(rs).size}</b><small>people</small></div><div><b className="tab">{rs.length}</b><small>answers</small></div>{head(t, rs).map(([l, v]) => <div key={l}><b className="tab">{v}</b><small>{l}</small></div>)}</div>
            <div className="sp"><Spark data={R.daily(rs, 28)}/><small>{rs.length ? "Last answer " + R.ago(last) : "No answers yet"} · 28 days</small></div>
          </button>
        ); })}</div>
      </>
    );
  }

  /* ── M02 · Divorce guide ── */
  const IVK = ["stage", "status", "years", "where_uk", "kids", "kids_live", "kids_know", "living", "home", "next_home", "work", "cope", "support", "stand", "comms", "goals"];
  const OPT = { launch: "Tell me when it launches", chat: "Happy to talk to the team", pilot: "Try it early" };
  const STAGE_L = { considering: "Thinking about separating", separated: "Separated, finances not agreed", agreed: "Agreed, need it made legal", professional: "Mediator or solicitor", decided: "Decided to separate", apart: "Living apart", filed: "Divorce started" };
  function M02({ rows: all, t }) {
    const G = window.G;
    const [ver, setVer] = useState("all"), [lv, setLv] = useState("all"), [tier, setTier] = useState("guided"), [fs, setFs] = useState("must"), [more, setMore] = useState(false);
    const seg = useMemo(() => all.filter((r) => (ver === "all" || r.ver === ver) && (lv === "all" || r.lv === lv)), [all, ver, lv]);
    const L = useMemo(() => R.latest(seg), [seg]), byK = useMemo(() => R.by(L, (r) => r.k), [L]);
    const has = (f) => R.sids(seg, f);
    const starts = has((r) => r.k === "landing_start" || r.sec === "Interview"), views = new Set([...has((r) => r.k === "landing_view"), ...starts]);
    const chd = (id) => has((r) => r.k === "ch_done" && r.a === id).size;
    const done = has((r) => r.k === "done"), full = has((r) => r.k === "full"), opt = has((r) => r.k === "optin");
    const steps = [
      { label: "Said yes to sharing, and started", n: starts.size }, { label: "Finished the interview", n: done.size },
      ...G.CH.filter((c) => !c.vonly).map((c, i) => ({ label: `Ch ${i + 1} · ${c.n}${c.when ? " (if relevant)" : ""}`, n: chd(c.id), c: c.c, group: true, cond: !!c.when })),
      { label: "If one service did all this", n: chd("service") }, { label: "Two last things", n: chd("last") }, { label: "Opened the full guide", n: full.size },
    ];
    /* landing comparison ignores the landing filter */
    const lands = Object.entries(R.LANDS).map(([k, name]) => { const s = all.filter((r) => r.lv === k && (ver === "all" || r.ver === ver)); return { k, name, v: R.sids(s).size, d: R.sids(s, (r) => r.k === "done").size, p: R.sids(s, (r) => r.k === "ch_done" && r.a === "service").size, f: R.sids(s, (r) => r.k === "full").size }; });
    const best = lands.reduce((b, x) => (x.v >= 20 && (!b || x.d / x.v > b.d / b.v) ? x : b), null);
    /* price sets ignore the price filter */
    const segL = R.latest(all.filter((r) => lv === "all" || r.lv === lv));
    const tierRows = ["A", "B"].map((V) => { const rs = segL.filter((r) => r.ver === V && r.k === "tier"), P = G.PRICES[V]; return { label: "Price set " + V, sub: P.map((p) => "£" + p.toLocaleString("en-GB")).join(" / "), parts: [...G.TIERS.map((T) => rs.filter((r) => r.a.startsWith(T.name)).length), rs.filter((r) => /^None/.test(r.a)).length] }; });
    const vwOf = (V) => { const rs = segL.filter((r) => r.ver === V && r.k.startsWith("vw.") && r.q.includes(`(${tier})`)), m = {}; rs.forEach((r) => { (m[r.sid] = m[r.sid] || {})[r.k.slice(3)] = R.money(r.a); }); return R.vw(Object.values(m)); };
    const TI = G.TIERS.findIndex((x) => x.id === tier);
    /* features */
    const spenders = R.sids(L, (r) => r.k.startsWith("spend.")).size;
    let feats = Object.entries(G.FEAT).map(([id, [name, d]]) => { const rs = byK["feat." + id] || [], sp = (byK["spend." + id] || []).reduce((a, r) => a + (R.money(r.a) || 0), 0); const parts = ["Must have", "Nice to have", "Not for me"].map((l) => rs.filter((r) => r.a === l).length); return { label: name, sub: d, parts, must: parts[0] / (rs.length || 1), sp: spenders ? sp / spenders : 0 }; });
    feats.sort((a, b) => (fs === "must" ? b.must - a.must : b.sp - a.sp));
    const qOf = (k) => G.Q.find((q) => q.id === k);
    const ivList = IVK.filter((k) => byK[k]), ivShown = more ? ivList : ivList.slice(0, 6);
    return (
      <>
        <Head t={t} rows={seg}>
          <Seg label="Prices" value={ver} onChange={setVer} options={[["all", "Both"], ["A", "A"], ["B", "B"]]}/>
          <select className="r-sel" value={lv} onChange={(e) => setLv(e.target.value)} aria-label="Landing"><option value="all">All landings</option>{Object.entries(R.LANDS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
        </Head>
        <Kpis items={[
          { v: starts.size, l: "Said yes to sharing", s: "People who say no send nothing" },
          { v: R.pct(done.size, starts.size) + "%", l: "Finished the interview", s: done.size + " people" }, { v: R.pct(chd("service"), starts.size) + "%", l: "Reached the price questions", s: chd("service") + " people" },
          { v: R.pct(full.size, starts.size) + "%", l: "Finished the guide", s: full.size + " people" }, { v: opt.size, l: "Want to stay involved", s: R.pct(opt.size, done.size) + "% of finishers" },
        ]}/>
        <Sec n="01" title="Where people drop off" sub="Unique people reaching each step. Red marks a drop of 20% or more from the step before. Chapters marked ‘if relevant’ only show to some people, so they aren’t counted as drops.">
          <Card span><Funnel steps={steps}/></Card>
        </Sec>
        <Sec n="02" title="Landing screens" sub={"What happens after each design, among people who said yes to sharing. Visitors who say no send nothing, so start rates can’t be measured. The ± figure is a 95% margin: if two ranges overlap, the difference may be chance." + (lv !== "all" ? " (Shows every landing, whatever the landing filter.)" : "")}>
          <Card span>
            <div className="r-table land">
              <div className="th"><span>Design</span><span>People</span><span>Finished interview</span><span>Reached prices</span><span>Finished guide</span></div>
              {lands.map((x) => { const r = R.pct(x.d, x.v); return (
                <div key={x.k} className={"tr" + (best && best.k === x.k ? " best" : "")}>
                  <span className="nm">{x.name}{best && best.k === x.k && <em>Leading</em>}</span>
                  <span className="tab">{x.v}</span>
                  <span className="rate"><span className="tr2"><i style={{ width: r + "%" }}></i></span><b className="tab">{r}%</b><small className="tab">±{ci(x.d, x.v)}</small></span>
                  <span className="tab">{R.pct(x.p, x.v)}%</span><span className="tab">{R.pct(x.f, x.v)}%</span>
                </div>
              ); })}
            </div>
          </Card>
        </Sec>
        <Sec n="03" title="Price" sub="Visitors see price set A or B at random. Compare the package they’d pick, and what they say feels right.">
          <Card title="Which package would you choose?" sub="Package choice by price set" span>
            <Stack rows={tierRows} keys={[{ label: "Essentials", c: C.vs, ink: "#3B0764" }, { label: "Guided", c: C.vl }, { label: "Complete", c: C.v }, { label: "None of these", c: "#D6D3D1", ink: "#44403C" }]}/>
          </Card>
          <Card title="What price feels right?" sub="Van Westendorp, for one package. Shaded = the acceptable range; dot = optimal price." span right={<Seg value={tier} onChange={setTier} options={G.TIERS.map((x) => [x.id, x.name])}/>}>
            <div className="r-two">{["A", "B"].map((V) => <div key={V}><div className="r-mini">Price set {V} · shown £{G.PRICES[V][TI].toLocaleString("en-GB")}</div><VW d={vwOf(V)} accent={V === "A" ? C.v : C.mag}/></div>)}</div>
          </Card>
          {G.SERVICE_Q.map((q) => <QCard key={q.id} title={q.label} rows={byK[q.id] || []} order={R.order(q.id)}/>)}
        </Sec>
        <Sec n="04" title="Features" sub="Rated at the end of each chapter, plus how people spent an imaginary £100.">
          <Card span right={<Seg value={fs} onChange={setFs} options={[["must", "Sort by must have"], ["sp", "Sort by £100 spend"]]}/>}>
            <Stack rows={feats.map((f) => ({ ...f, extra: "£" + f.sp.toFixed(0) }))} keys={[{ label: "Must have", c: C.v }, { label: "Nice to have", c: C.vs, ink: "#3B0764" }, { label: "Not for me", c: "#E7E3DC", ink: "#57534E" }]} extraHead="Avg of £100"/>
          </Card>
        </Sec>
        <Sec n="05" title="Questions in each chapter">
          {G.CH.filter((c) => c.qs).flatMap((c) => c.qs.map((q) => <QCard key={q.id} title={q.label} sub={c.n} rows={byK[q.id] || []} order={R.order(q.id)} color={c.c}/>))}
        </Sec>
        <Sec n="06" title="Partner, and staying involved">
          {G.LAST_Q.map((q) => <QCard key={q.id} title={q.label} rows={byK[q.id] || []} order={R.order(q.id)}/>)}
          <QCard title="Stay involved" sub="Email addresses are kept out of the feed" rows={(byK.optin || []).map((r) => ({ ...r, a: r.a.split(/;\s*/).map((x) => OPT[x] || x).join("; ") }))} order={Object.values(OPT)}/>
        </Sec>
        <Sec n="07" title="Who took part" sub="From the interview. Safety answers and names are never sent.">
          {ivShown.map((k) => <QCard key={k} title={qOf(k) ? window.G.qText(qOf(k)) : k} rows={byK[k]} order={R.order(k)} color={C.ind}/>)}
          {ivList.length > 6 && <button className="r-more" onClick={() => setMore(!more)}>{more ? "Show fewer" : `Show all ${ivList.length} questions`}</button>}
        </Sec>
        <Sec n="08" title="In their words" sub="“If one thing about separating could be made simpler, what would it be?”">
          <Card span><Quotes rows={(byK.simplify || []).map((r) => ({ ...r, meta: "Price set " + r.ver }))}/></Card>
        </Sec>
      </>
    );
  }

  /* ── Prototype testing ── */
  const STG = [["01", "Discover"], ["02", "Interview"], ["03", "Playback"], ["04", "Sign-up"], ["05", "Onboard"], ["06", "Prepare"], ["07", "Household"], ["08", "Settle"], ["09", "Finalise"], ["10", "Dashboard"]];
  const heat = (v, max) => (v == null ? {} : { background: `color-mix(in srgb, #5B21B6 ${Math.round(((v - 1) / (max - 1)) * 70 + 6)}%, #FFF)`, color: (v - 1) / (max - 1) > 0.55 ? "#FFF" : "#17141F" });
  function Proto({ rows, t }) {
    const ans = useMemo(() => { const m = new Map(); rows.filter((r) => r.type !== "probe").forEach((r) => { const k = r.sid + "|" + r.pn + "|" + r.qid, p = m.get(k); if (!p || r.t >= p.t) m.set(k, r); }); return [...m.values()]; }, [rows]);
    const byP = R.by(ans, (r) => r.pn), probes = R.by(rows.filter((r) => r.type === "probe"), (r) => r.pn);
    const [sel, setSel] = useState(() => (STG.find(([n]) => byP[n]) || STG[0])[0]);
    const sum = STG.map(([n, name]) => { const rs = byP[n] || [], task = rs.filter((r) => r.type === "task"), r5 = rs.filter((r) => r.type === "rating5").map((r) => +r.a), e7 = rs.filter((r) => r.type === "ease7").map((r) => +r.a); return { n, name, ppl: new Set(rs.map((r) => r.pid)).size, task: task.length ? R.pct(task.filter((r) => /^Yes/.test(r.a)).length, task.length) : null, r5: r5.length ? R.mean(r5) : null, e7: e7.length ? R.mean(e7) : null, fb: rs.filter((r) => /feedback$/.test(r.qid)).length + (probes[n] || []).filter((r) => r.a.length > 30).length }; });
    const cur = byP[sel] || [], qs = R.by(cur.filter((r) => !/feedback$/.test(r.qid)), (r) => r.qid), pr = probes[sel] || [];
    const stName = (STG.find(([n]) => n === sel) || [])[1];
    return (
      <>
        <Head t={t} rows={rows}/>
        <Kpis items={[{ v: new Set(rows.map((r) => r.pid)).size, l: "Participants" }, { v: sum.filter((s) => s.ppl).length + " of 10", l: "Prototypes tested" }, { v: rows.filter((r) => /feedback$/.test(r.qid)).length, l: "Written comments" }, { v: rows.filter((r) => r.type === "probe").length, l: "Check-in answers" }]}/>
        <Sec n="01" title="Prototype by prototype" sub="Darker = better. Click a row for the detail.">
          <Card span>
            <div className="r-table proto">
              <div className="th"><span>Prototype</span><span>People</span><span>Task done</span><span>Rating /5</span><span>Ease /7</span><span>Comments</span></div>
              {sum.map((s) => (
                <button key={s.n} className={"tr" + (sel === s.n ? " on" : "")} onClick={() => setSel(s.n)} disabled={!s.ppl}>
                  <span className="nm"><span className="tab code">{s.n}</span>{s.name}</span><span className="tab">{s.ppl || "—"}</span>
                  <span className="tab hc" style={s.task == null ? {} : heat(1 + (s.task / 100) * 4, 5)}>{s.task == null ? "—" : s.task + "%"}</span>
                  <span className="tab hc" style={heat(s.r5, 5)}>{s.r5 == null ? "—" : s.r5.toFixed(1)}</span>
                  <span className="tab hc" style={heat(s.e7, 7)}>{s.e7 == null ? "—" : s.e7.toFixed(1)}</span>
                  <span className="tab">{s.fb || "—"}</span>
                </button>
              ))}
            </div>
          </Card>
        </Sec>
        <Sec n="02" title={`${sel} · ${stName}`} sub="End-of-prototype questions">
          {Object.values(qs).length ? Object.values(qs).map((rs) => <QCard key={rs[0].qid} title={rs[0].q} rows={rs} order={rs[0].type === "task" ? ["Yes, easily", "Yes, with some help", "No, I couldn't"] : rs[0].type === "yesno" ? ["Yes", "No"] : null}/>) : <Card span><Empty>No answers for this prototype yet.</Empty></Card>}
          <Card title="Anything else?" sub="Written comments" span><Quotes rows={cur.filter((r) => /feedback$/.test(r.qid))}/></Card>
        </Sec>
        <Sec n="03" title="Check-ins during the session" sub="Short prompts that appear if someone lingers on a screen.">
          <QCard title="How’s it going so far?" rows={pr.filter((r) => r.qid === "pb-1")} order={["All good", "A bit unsure", "I'm stuck"]} color={C.grn}/>
          <Card title="What they said" sub="Grouped by screen"><Quotes rows={pr.filter((r) => r.qid !== "pb-1").map((r) => ({ ...r, meta: r.screen }))} max={5}/></Card>
        </Sec>
      </>
    );
  }

  /* ── any other test ── */
  function Generic({ rows, t }) {
    const L = R.latest(rows), g = R.by(L.filter((r) => r.type !== "event"), (r) => r.k);
    return (
      <>
        <Head t={t} rows={rows}/>
        <Kpis items={[{ v: R.sids(rows).size, l: "People" }, { v: rows.length, l: "Answers" }, { v: Object.keys(g).length, l: "Questions" }]}/>
        <Sec n="01" title="Every question">{Object.keys(g).length ? Object.values(g).map((rs) => <QCard key={rs[0].k} title={rs[0].q || rs[0].qid} sub={rs[0].qid} rows={rs}/>) : <Card span><Empty/></Card>}</Sec>
      </>
    );
  }

  Object.assign(window, { ROverview: Overview, RM02: M02, RProto: Proto, RGeneric: Generic, RSeg: Seg, Rdl: dl });
})();
