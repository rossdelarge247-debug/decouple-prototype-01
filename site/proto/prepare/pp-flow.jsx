/* Prepare — profiling questions + one-question-per-screen sorting flow + between-section playback */
(function () {
  const { useState, useEffect } = React;
  const Ic = window.DIc, PP = window.PP;
  const money = (n) => "£" + n.toLocaleString("en-GB", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

  function Shell({ top, children, foot, k }) {
    return (
      <div className="pq">
        {top}
        <div className="pq-body" key={k}>{children}</div>
        {foot && <div className="pq-foot">{foot}</div>}
      </div>
    );
  }

  function Profile({ qs, P, setP, i, setI, onDone, onExit }) {
    const vis = qs.filter((q) => !q.when || q.when(P));
    const q = vis[Math.min(i, vis.length - 1)];
    useEffect(() => { if (q.pre != null && P[q.id] == null) setP({ ...P, [q.id]: q.pre }); }, [q.id]);
    const v = P[q.id];
    const fromIv = q.pre != null && JSON.stringify(v) === JSON.stringify(q.pre);
    const next = () => (i + 1 >= vis.length ? onDone() : setI(i + 1));
    const pick = (x) => {
      if (q.type === "chips") { const cur = Array.isArray(v) ? v : []; let n = cur.includes(x) ? cur.filter((y) => y !== x) : [...cur, x]; if (x === "none" || x === "unsure") n = cur.includes(x) ? [] : [x]; else n = n.filter((y) => y !== "none" && y !== "unsure"); setP({ ...P, [q.id]: n }); }
      else { setP({ ...P, [q.id]: x }); }
    };
    const top = (
      <div className="pq-top">
        <div className="pq-sec"><span className="pq-k">Before we start · {`${i + 1} of ${vis.length}`}</span><button className="pq-exit" onClick={onExit}>Save &amp; exit</button></div>
        <div className="pq-bar"><i style={{ width: ((i + 1) / vis.length) * 100 + "%" }}></i></div>
      </div>
    );
    const ok = q.type === "kids" ? Array.isArray(v) && v.length > 0 && v.every((k) => k.age !== "") : q.type === "chips" ? Array.isArray(v) && v.length > 0 : v != null;
    const setKid = (j, patch) => setP({ ...P, kids: v.map((k, x) => (x === j ? { ...k, ...patch } : k)) });
    return (
      <Shell k={q.id} top={top} foot={<>{i > 0 ? <button className="btn lg ghost" onClick={() => setI(i - 1)}>Back</button> : <span></span>}<button className="btn lg" disabled={!ok} onClick={next}>Continue <Ic.Arrow s={15}/></button></>}>
        {i === 0 && <div className="pq-intro"><Ic.Spark s={14}/><span>{`${vis.length} quick questions so Decouple knows what to look for in your statements.`}</span></div>}
        <h1 className="pq-h">{typeof q.t === "function" ? q.t(P) : q.t}</h1>
        <p className="pq-why">{q.why}</p>
        {fromIv && <div className="pq-pre"><Ic.Check s={12} w={2.6}/>From your interview — change it if it's moved on</div>}
        {q.type === "kids" && Array.isArray(v) && <div className="pq-kids">
          {v.map((k, j) => (
            <div className="pq-kid" key={j}>
              <span className="kn">{j + 1}</span>
              <input placeholder="First name" value={k.name} onChange={(e) => setKid(j, { name: e.target.value })} aria-label={`Child ${j + 1} first name`}/>
              <select value={k.age} onChange={(e) => setKid(j, { age: e.target.value })} aria-label={`Child ${j + 1} age`}><option value="">Age</option>{Array.from({ length: 18 }, (_, x) => <option key={x} value={String(x)}>{x === 0 ? "Under 1" : x}</option>)}</select>
              {v.length > 1 && <button className="kx" aria-label="Remove" onClick={() => setP({ ...P, kids: v.filter((_, x) => x !== j) })}><Ic.X s={13}/></button>}
            </div>))}
          <button className="pp-add" onClick={() => setP({ ...P, kids: [...v, { name: "", age: "" }] })}><Ic.Plus s={12}/>Add another child</button>
        </div>}
        {q.opts && <div className={"pq-opts" + (q.type === "chips" ? " chips" : "")}>{q.opts.map(([k, l]) => {
          const on = q.type === "chips" ? Array.isArray(v) && v.includes(k) : v === k;
          return <button key={k} className={"pq-opt" + (on ? " on" : "")} aria-pressed={on} onClick={() => pick(k)}><span className="rd">{on && <Ic.Check s={12} w={3} c="#FFF"/>}</span>{l}</button>;
        })}</div>}
      </Shell>
    );
  }

  function Src({ c }) {
    return (
      <div className="pq-src">
        <span className="lg">{c.src.replace(/[^A-Za-z]/g, "")[0] || "£"}</span>
        <span className="nm">{c.src}<small>{c.detail}</small></span>
        {c.amt != null && <span className="am tab">{money(c.amt)}<small>{c.per}</small></span>}
      </div>
    );
  }

  function Card({ c, r, onAnswer, ev, onEv }) {
    const [open, setOpen] = useState(false), [recat, setRecat] = useState(false), [amt, setAmt] = useState(r && r.v != null && c.kind === "amount" ? r.v : c.pre || "");
    const [up, setUp] = useState(ev === "up");
    const secL = (PP.FLOW.find((f) => f[0] === c.sec) || [])[1];
    if (c.kind === "ev") return (
      <>
        <div className="pq-evic"><Ic.Plus s={22} c="#5B21B6"/></div>
        <div className="pq-tags">{c.must ? <em className="must">Needed for Form E</em> : <em>Helpful</em>}</div>
        <h1 className="pq-h">{c.title}</h1>
        <p className="pq-why">{c.detail}</p>
        {up ? <div className="pq-file"><Ic.Check s={14} w={2.6} c="#166534"/><span>{c.evL}.pdf<small>Uploaded just now</small></span></div> : null}
        <div className="pq-opts">
          {!up && <button className="pq-opt big" onClick={() => { setUp(true); onEv("up"); setTimeout(() => onAnswer({ v: "up" }), 650); }}><Ic.Plus s={16}/>Upload now<small>Photo or PDF</small></button>}
          {!up && <button className="pq-opt big" onClick={() => { onEv("later"); onAnswer({ v: "later" }); }}><Ic.Arrow s={16}/>Remind me later<small>We'll add it to your picture as a gap</small></button>}
        </div>
      </>
    );
    return (
      <>
        <Src c={c}/>
        <h1 className="pq-h">{c.title}</h1>
        {c.kind === "group" && c.txs && <button className="pq-more" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide" : `See ${c.txs.length === 4 || c.src.includes("·") ? "the breakdown" : "recent payments"}`}<Ic.Down s={12} style={{ transform: open ? "rotate(180deg)" : "" }}/></button>}
        {open && <div className="pq-txs">{c.txs.map(([d, n], i) => <div key={i}><span>{d}</span><span className="tab">{money(n)}</span></div>)}</div>}
        {c.kind === "group" && !recat && (
          <div className="pq-opts">
            <button className={"pq-opt" + (r && r.v === "yes" ? " on" : "")} onClick={() => onAnswer({ v: "yes" })}><span className="rd">{r && r.v === "yes" && <Ic.Check s={12} w={3} c="#FFF"/>}</span>Yes, that's right</button>
            <button className={"pq-opt" + (r && r.v === "recat" ? " on" : "")} onClick={() => setRecat(true)}><span className="rd"></span>No — it's something else{r && r.v === "recat" && <small style={{ marginLeft: "auto" }}>{PP.catName(r.cat)}</small>}</button>
          </div>
        )}
        {c.kind === "group" && recat && (
          <>
            <div className="pq-sub">What is it, then?</div>
            <div className="pq-cats">{PP.CATS.map(([k, l]) => <button key={k} className={r && r.cat === k ? "on" : ""} onClick={() => onAnswer({ v: "recat", cat: k })}>{l}</button>)}</div>
            <button className="pq-unsure" onClick={() => setRecat(false)}>Back</button>
          </>
        )}
        {(c.kind === "single" || c.kind === "q") && (
          <div className="pq-opts">{c.opts.map(([k, l]) => <button key={k} className={"pq-opt" + (r && r.v === k ? " on" : "")} onClick={() => onAnswer({ v: k })}><span className="rd">{r && r.v === k && <Ic.Check s={12} w={3} c="#FFF"/>}</span>{l}</button>)}</div>
        )}
        {c.kind === "amount" && (
          <>
            <p className="pq-why">{c.detail}</p>
            <label className="pq-amt"><span>£</span><input inputMode="numeric" value={amt === "" ? "" : Number(amt).toLocaleString("en-GB")} onChange={(e) => setAmt(e.target.value.replace(/[^0-9]/g, ""))} aria-label={c.title}/></label>
            <div className="pq-opts"><button className="btn lg" disabled={!amt} onClick={() => onAnswer({ v: Number(amt) })}>Continue <Ic.Arrow s={15}/></button></div>
          </>
        )}
        {c.kind !== "ev" && <button className="pq-unsure" onClick={() => onAnswer({ v: "unsure" })}>{`Not sure — park it in “Unsorted”`}</button>}
        <div className="pq-ctx"><Ic.Lock s={11}/><span>{`${secL} · private to you until you share`}</span></div>
      </>
    );
  }

  function MiniFormE({ secs, pic }) {
    return (
      <div className="mfe">
        <div className="mfe-h"><span>FORM E · FINANCIAL STATEMENT</span><span>Draft</span></div>
        {secs.map((sid) => { const s = PP.SECS.find((x) => x.id === sid), rs = pic.rows[sid], ev = pic.evid[sid]; if (!pic.secs.some((x) => x.id === sid)) return null; return (
          <div className="mfe-s" key={sid}>
            <div className="mfe-t"><b>{s.fe.replace("Form E ", "")}</b>{s.t}</div>
            {rs.length ? rs.map((x) => <div className="mfe-r" key={x.key}><span>{x.l}{x.sub ? <small>{x.sub}</small> : null}</span><i></i><span className={"tab" + (x.badge === "gap" ? " gap" : "")}>{x.v === "—" || x.v === "CETV" ? "to follow" : x.v}</span></div>) : <div className="mfe-r empty"><span>Nothing yet</span></div>}
            {ev.length > 0 && <div className="mfe-ev">{ev.map((e) => <span key={e.id} className={e.st === "up" ? "ok" : ""}>{e.st === "up" ? <Ic.Check s={10} w={3}/> : <Ic.Help s={10}/>}{e.l}</span>)}</div>}
          </div>); })}
      </div>
    );
  }
  const SEC_MAP = { income: ["income"], outgoings: ["outgoings", "children"], assets: ["home", "accounts", "other_assets"], debts: ["debts"], pensions: ["pensions"] };

  function Playback({ sec, pic, list, res, onNext, last }) {
    const name = (PP.FLOW.find((f) => f[0] === sec) || [])[1];
    const cs = list.filter((c) => c.sec === sec), un = cs.filter((c) => res[c.id] && res[c.id].v === "unsure").length;
    const mo = SEC_MAP[sec].flatMap((s) => pic.rows[s]).filter((x) => /\/ mo/.test(x.v)).reduce((n, x) => n + (x.n || 0), 0);
    return (
      <div className="pb-sec">
        <div className="pq-k">{`${name} · sorted`}</div>
        <h1 className="pq-h">{`${name}, done.`}</h1>
        <p className="pq-why">{`Here's how it'll read on your Form E${mo ? ` — about ${PP.gbp(mo)} a month` : ""}.${un ? ` ${un} item${un > 1 ? "s" : ""} parked in Unsorted for later.` : ""}`}</p>
        <MiniFormE secs={SEC_MAP[sec]} pic={pic}/>
        <div className="pq-opts"><button className="btn lg" onClick={onNext}>{last ? "See your picture" : `On to ${PP.FLOW[PP.FLOW.findIndex((f) => f[0] === sec) + 1][1].toLowerCase()}`} <Ic.Arrow s={15}/></button></div>
      </div>
    );
  }

  function Flow({ list, res, setRes, ev, setEv, fi, setFi, pb, setPb, pic, onFinish, onExit }) {
    const c = list[Math.min(fi, list.length - 1)];
    const secs = PP.FLOW.map(([id, l]) => ({ id, l, cs: list.filter((x) => x.sec === id) })).filter((s) => s.cs.length);
    const cur = pb || c.sec, si = secs.findIndex((s) => s.id === cur), S = secs[si];
    const inSec = S.cs.indexOf(c), left = list.length - fi;
    const answer = (r) => {
      setRes({ ...res, [c.id]: r });
      setTimeout(() => {
        const nx = list[fi + 1];
        if (!nx || nx.sec !== c.sec) setPb(c.sec); else setFi(fi + 1);
      }, r.v === "unsure" ? 120 : 260);
    };
    const back = () => { if (pb) { setPb(null); return; } if (fi > 0) setFi(fi - 1); };
    const top = (
      <div className="pq-top">
        <div className="pq-sec"><span className="pq-k">{pb ? `${S.l} · summary` : `${S.l} · ${inSec + 1} of ${S.cs.length}`}</span><button className="pq-exit" onClick={() => onExit(left)}>Save &amp; exit</button></div>
        <div className="pq-segs">{secs.map((s, i) => { const done = i < si || (i === si && pb); const w = i < si || done ? 100 : i === si ? (inSec / S.cs.length) * 100 : 0; return <div key={s.id} className={"pq-seg" + (i === si ? " on" : "")}><i style={{ width: w + "%" }}></i><span>{s.l}</span></div>; })}</div>
      </div>
    );
    if (pb) return (
      <Shell k={"pb" + pb} top={top} foot={null}>
        <Playback sec={pb} pic={pic} list={list} res={res} last={si === secs.length - 1} onNext={() => { setPb(null); if (si === secs.length - 1) onFinish(); else setFi(list.indexOf(secs[si + 1].cs[0])); }}/>
        <button className="pq-unsure" onClick={back}>Back to the last question</button>
      </Shell>
    );
    return (
      <Shell k={c.id} top={top} foot={null}>
        <Card key={c.id} c={c} r={res[c.id]} ev={ev[c.id]} onEv={(v) => setEv({ ...ev, [c.id]: v })} onAnswer={answer}/>
        {fi > 0 && <button className="pq-back" onClick={back}><Ic.Arrow s={13} style={{ transform: "rotate(180deg)" }}/> Back</button>}
      </Shell>
    );
  }

  function Resume({ left, onResume, N }) {
    return (
      <div className="pq-resume">
        <div className="pq-k">{`${N.Me}'s dashboard`}</div>
        <div className="rs-card">
          <div className="rs-ic"><Ic.Spark s={18} c="#5B21B6"/></div>
          <div className="rs-tx"><b>{`Resume — ${left} question${left === 1 ? "" : "s"} left`}</b><span>Your answers are saved. Pick up exactly where you left off.</span></div>
          <button className="btn lg" onClick={onResume}>Resume <Ic.Arrow s={15}/></button>
        </div>
        <p className="pq-why" style={{ textAlign: "center" }}>This is how the prompt appears on your dashboard after you save and exit.</p>
      </div>
    );
  }

  Object.assign(window, { PPProfile: Profile, PPFlow: Flow, PPResume: Resume, PPMiniFormE: MiniFormE });
})();
