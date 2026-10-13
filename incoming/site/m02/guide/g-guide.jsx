/* M02 v2 · guide walkthrough with woven-in validation, final questions, and the full guide */
(function () {
  const { useState, useEffect } = React;
  const Ic = window.DIc, PB = window.PB, G = window.G;

  function headline(a) {
    const rel = a.status === "cohab" ? "relationship" : a.status === "civil" ? "civil partnership" : "marriage";
    const yrs = { u5: "A short", "5_10": "A 5–10 year", "10_20": "A 10–20 year", "20": "A 20-year-plus" }[a.years] || "A";
    const kids = a.kids === "with" ? ((a.ages || []).length > 1 ? "children at home" : "a child at home") : a.kids === "grown" ? "grown-up children" : "no children together";
    const q = a.stage === "considering" ? "a decision still to make" : a.stage === "agreed" ? "most of it agreed" : "a lot to work out";
    return <>{yrs} {rel}, {kids}, and {q}. <span className="em">Here’s your way through.</span></>;
  }

  function FeatRows({ ids, x, setX }) {
    const cur = x.feat || {};
    return <div className="frows">{ids.map((id) => { const [t, d] = G.FEAT[id]; return (
      <div key={id} className={"frow" + (cur[id] ? " done" : "")}>
        <div><div className="l">{t}</div><div className="s">{d}</div></div>
        <div className="oseg" role="radiogroup" aria-label={t}>{G.MUST.map(([k, l]) => <button key={k} role="radio" aria-checked={cur[id] === k} className={(cur[id] === k ? "on " : "") + k} onClick={() => setX("feat", { ...cur, [id]: k })}>{l}</button>)}</div>
      </div>); })}</div>;
  }
  function XQ({ q, x, setX }) {
    if (q.type === "long") return <div className="qb"><div className="qb-l">{q.label}</div><textarea className="otext-l" placeholder={q.ph} value={x[q.id] || ""} onChange={(e) => setX(q.id, e.target.value)}></textarea></div>;
    return <IVQBlock q={q} a={x} set={setX}/>;
  }
  function Ask({ ch, x, setX }) {
    if (!ch.feats && !ch.qs) return null;
    return (
      <div className="bcard">
        <div className="bcard-k"><Ic.Spark s={13}/>{ch.build ? "Just so you know" : "Help us help others"}</div>
        <h3>{ch.build || ch.ask}</h3>
        <div className="bcard-s"><Ic.Lock s={12}/>Optional. Your answers are anonymous and shape what we build first.</div>
        {ch.feats && <><div className="qb-l" style={{ marginTop: 18 }}>Would these help you?</div><FeatRows ids={ch.feats} x={x} setX={setX}/></>}
        {ch.qs && <div className="qs">{ch.qs.map((q) => <XQ key={q.id} q={q} x={x} setX={setX}/>)}</div>}
      </div>
    );
  }

  function Tiers({ x, setX, ver }) {
    const P = G.PRICES[ver];
    return <>
      <div className="tiers g-tiers">{G.TIERS.map((t, i) => { const on = x.tier === t.id; return (
        <button key={t.id} className={"tier" + (on ? " sel" : "")} aria-pressed={on} onClick={() => setX("tier", t.id)}>
          <div className="in">
            <div className="nm">{t.name}<span className="radio">{on && <Ic.Check s={11} w={3} c="#FFF"/>}</span></div>
            <div className="sb">{t.for}</div>
            <div className="pr"><b>£{P[i].toLocaleString("en-GB")}</b><span>for both of you</span></div>
            <ul>{t.inc.map((li) => <li key={li} className={/^Everything/.test(li) ? "inh" : ""}><span className="ck"><Ic.Check s={10} w={2.6} c="#5B21B6"/></span>{li}</li>)}</ul>
          </div>
        </button>); })}</div>
      <div className="oc" style={{ marginTop: 10 }}><button className={"ocard" + (x.tier === "none" ? " on" : "")} onClick={() => setX("tier", "none")}><div className="l">None of these would be right for me</div><span className="r">{x.tier === "none" && <Ic.Check s={11} w={3} c="#FFF"/>}</span></button></div>
    </>;
  }
  function VW({ x, setX }) {
    const t = G.TIERS.find((y) => y.id === x.tier) || G.TIERS[1], cur = x.vw || {};
    return <div className="qb">
      <div className="qb-l">What price would feel right for {t.name}, for both of you?</div>
      <div className="qb-h">Go with your gut. Any of these can be left blank.</div>
      <div className="vwg">{G.VW.map(([k, l]) => <label key={k} className="field">{l}<span className="gbp"><input inputMode="numeric" placeholder="0" value={cur[k] || ""} onChange={(e) => setX("vw", { ...cur, [k]: e.target.value.replace(/[^\d]/g, "").slice(0, 6) })}/></span></label>)}</div>
    </div>;
  }
  function Spend({ x, setX }) {
    const f = x.feat || {}, cur = x.spend || {}, left = 100 - Object.values(cur).reduce((s, v) => s + v, 0);
    let ids = Object.keys(G.FEAT).filter((id) => f[id] === "must" || f[id] === "nice").sort((p, q) => (f[q] === "must") - (f[p] === "must"));
    if (ids.length < 3) ids = Object.keys(G.FEAT);
    const add = (id, d) => setX("spend", { ...cur, [id]: Math.max(0, (cur[id] || 0) + d) });
    return <div className="qb">
      <div className="qb-l">You have £100. Where would you spend it?</div>
      <div className="qb-h">{ids.length < Object.keys(G.FEAT).length ? "These are the features you said would help. " : ""}Spread it across what matters most. You don’t have to spend it all.</div>
      <div className="spend-w"><div><b className="tab">£{left}</b> <span>left to spend</span></div><div className="coins" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < left / 10 ? "" : "u"}></i>)}</div></div>
      <div className="frows">{ids.map((id) => <div key={id} className={"frow" + (cur[id] ? " done" : "")}><div><div className="l">{G.FEAT[id][0]}</div></div>
        <div className="stepper"><button aria-label={"Less on " + G.FEAT[id][0]} disabled={!cur[id]} onClick={() => add(id, -10)}><Ic.Dash s={14}/></button><output className="tab">£{cur[id] || 0}</output><button aria-label={"More on " + G.FEAT[id][0]} disabled={left <= 0} onClick={() => add(id, 10)}><Ic.Plus s={14}/></button></div></div>)}</div>
    </div>;
  }
  function OptIn({ x, setX }) {
    const cur = x.optin || {}, O = [["launch", "Tell me when it launches"], ["chat", "I’d do a 30-minute chat"], ["pilot", "We’d try an early version"]];
    const any = O.some(([k]) => cur[k]);
    return <div className="qb">
      <div className="qb-l">Would you like to stay involved?</div>
      <div className="qb-h">All optional. We’ll only use your email for what you choose here.</div>
      <div className="ochips">{O.map(([k, l]) => <button key={k} className={"ochip" + (cur[k] ? " on" : "")} aria-pressed={!!cur[k]} onClick={() => setX("optin", { ...cur, [k]: !cur[k] })}>{cur[k] && <Ic.Check s={11} w={3} c="#FFF"/>}{l}</button>)}</div>
      {any && <><label className="field">Email address<input type="email" autoComplete="email" placeholder="you@example.com" value={cur.email || ""} onChange={(e) => setX("optin", { ...cur, email: e.target.value })}/></label><div className="mwarn"><Ic.Shield s={14} style={{ flexShrink: 0, marginTop: 2 }}/><span>Use an email address your partner can’t see.</span></div></>}
    </div>;
  }

  function Service({ x, setX, ver }) {
    return <>
      <div className="card">
        <div className="card-k"><Ic.Spark s={14}/><span>What we’re building</span></div>
        <div className="card-t">One private, shared place to do everything in this guide, <b style={{ color: "#5B21B6" }}>together</b>, at your own pace.</div>
        <p className="card-p">It isn’t ready yet. These questions help us decide what goes in first, and what it should cost. All optional, and anonymous.</p>
        <div className="qs" style={{ maxWidth: "none" }}>{G.SERVICE_Q.map((q) => <XQ key={q.id} q={q} x={x} setX={setX}/>)}</div>
      </div>
      <div className="card">
        <div className="card-k"><span>If these existed today</span></div>
        <div className="card-t">Which would you choose?</div>
        <p className="card-p">Prices are for both of you together, paid once.</p>
        <Tiers x={x} setX={setX} ver={ver}/>
        <div className="qs" style={{ maxWidth: "none" }}><VW x={x} setX={setX}/></div>
      </div>
    </>;
  }
  function Last({ x, setX }) {
    return <div className="card">
      <div className="card-k"><span>Nearly done</span></div>
      <div className="card-t">Two last things, then your full guide.</div>
      <div className="qs" style={{ maxWidth: "none" }}>
        {G.LAST_Q.map((q) => <XQ key={q.id} q={q} x={x} setX={setX}/>)}
        <Spend x={x} setX={setX}/>
        <OptIn x={x} setX={setX}/>
      </div>
    </div>;
  }

  function Toc({ list, i, max, onGo, full }) {
    return <div className="toc">
      <div className="toc-h"><b>Your guide</b><span>{full ? "Jump to" : `${Math.min(i + 1, list.length)} of ${list.length}`}</span></div>
      {list.map((c, k) => { const st = full ? "" : k < i ? "done" : k === i ? "cur" : ""; return (
        <button key={c.id} className={st} disabled={!full && k > max} onClick={() => onGo(k)}>
          <span className="d">{st === "done" ? <Ic.Check s={10} w={2.8} c="#166534"/> : k + 1}</span><span>{c.n}</span>{c.vonly && <span className="v">Questions</span>}
        </button>); })}
    </div>;
  }

  function EmailGuide({ name, onSend, onClose }) {
    const [email, setEmail] = useState(""), [sent, setSent] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
    useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);
    const send = async () => {
      if (busy) return; if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setErr("That doesn’t look like an email address");
      setBusy(true); const r = await onSend(email.trim()); setBusy(false);
      if (r && r.ok === false) setErr(r.status === 429 ? "You’ve sent this a few times today. Try again tomorrow, or save it as a PDF." : "We couldn’t send it just now. Please try again, or save it as a PDF."); else setSent(true);
    };
    return (
      <div className="mscrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="mbox" role="dialog" aria-modal="true" aria-label="Email me my guide">
          <button className="mx" aria-label="Close" onClick={onClose}><Ic.X s={16}/></button>
          {!sent ? <>
            <div className="kick">Email me my guide</div>
            <h3>Keep it for later.</h3>
            <p>We’ll email you a link that opens your guide on any device. The subject line just says “Your guide”. Nothing about separation. We don’t keep your email address or your guide.</p>
            <label className="field">Email address<input type="email" autoFocus value={email} placeholder="you@example.com" onChange={(e) => { setEmail(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && send()}/>{err && <span className="err">{err}</span>}</label>
            <div className="mwarn"><Ic.Shield s={14} style={{ flexShrink: 0, marginTop: 2 }}/><span>Use an email address your partner can’t see.</span></div>
            <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}><button className="btn lg" onClick={send} disabled={busy}>{busy ? "Sending…" : "Send it"} <Ic.Arrow s={15}/></button><button className="btn lg ghost" onClick={onClose}>Not now</button></div>
          </> : <>
            <div className="safe-ic"><Ic.Check s={22} w={2.4} c="#166534"/></div>
            <h3>On its way{name ? ", " + name : ""}.</h3>
            <p>Check <b style={{ color: "#1A1A1A" }}>{email}</b>. If it hasn’t arrived in a few minutes, look in your spam folder.</p>
            <div style={{ marginTop: 20 }}><button className="btn lg" onClick={onClose}>Back to my guide</button></div>
          </>}
        </div>
      </div>
    );
  }

  function Walk({ a, x, setX, ch, maxCh, setCh, ver, onFull, onBack, post }) {
    const list = G.chapters(a), i = Math.min(ch, list.length - 1), c = list[i], r = PB.compute(a), N = r.N;
    const C = window.GCH[c.id], last = i === list.length - 1, nx = list[i + 1];
    const next = () => { post(c); if (last) onFull(); else setCh(i + 1); };
    useEffect(() => {
      const k = (e) => { if (/INPUT|TEXTAREA|BUTTON/.test(e.target.tagName)) return; if (e.key === "Enter") next(); };
      addEventListener("keydown", k); return () => removeEventListener("keydown", k);
    });
    return (
      <main className="pb-body" style={{ "--c": c.c }}>
        <div className="g-crumb"><span className="kick">{i === 0 ? `Your personalised divorce guide${N.hasMe ? ", " + N.Me : ""}` : "Your personalised divorce guide"}</span><span className="g-chn">Chapter {i + 1} of {list.length}</span></div>
        <h1 className="pb-h1">{i === 0 ? headline(a) : c.t}</h1>
        <div className="pb-grid">
          <div className="pb-main">
            {c.id === "service" ? <Service x={x} setX={setX} ver={ver}/> : c.id === "last" ? <Last x={x} setX={setX}/> : <C a={a} r={r}/>}
            <Ask ch={c} x={x} setX={setX}/>
            <div className="iv-nav">
              <button className="back" onClick={() => (i === 0 ? onBack() : setCh(i - 1))}><Ic.Arrow s={14} style={{ transform: "rotate(180deg)" }}/> Back</button>
              <button className="btn lg" onClick={next}>{last ? "See my full guide" : `Next: ${nx.n}`} <Ic.Arrow s={15}/></button>
              {!last && <button className="skipsec" onClick={() => { post(c); onFull(); }}>Skip to my full guide</button>}
            </div>
          </div>
          <aside className="pb-aside g-aside">
            <Toc list={list} i={i} max={maxCh} onGo={setCh}/>
            <div className="calm"><div className="kick" style={{ marginBottom: 6 }}><Ic.Lock s={11}/> Private to you</div>No account, and nothing is shared with {N.them}. Questions along the way are optional. Your full guide is at the end, free to keep.</div>
          </aside>
        </div>
      </main>
    );
  }

  function Full({ a, onEdit, onEmail, emailed, onRestart, privacy }) {
    const list = G.chapters(a).filter((c) => !c.vonly), r = PB.compute(a), N = r.N;
    const [mail, setMail] = useState(false);
    const jump = (k) => { const el = document.getElementById("ch-" + list[k].id); el && window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 80, behavior: "smooth" }); };
    return (
      <main className="pb-body">
        <div className="kick">Your personalised divorce guide{N.hasMe ? ", " + N.Me : ""}</div>
        <h1 className="pb-h1">{headline(a)}</h1>
        <div className="pb-grid">
          <div className="pb-main">{list.map((c, k) => { const C = window.GCH[c.id]; return (
            <section key={c.id} id={"ch-" + c.id} className="g-sec"><div className="g-chh"><span>{String(k + 1).padStart(2, "0")}</span>{c.t}</div><C a={a} r={r}/></section>); })}
            <div className="disc"><Ic.Help s={13}/><span>Decouple is not a law firm, and this guide is not legal advice. Figures are rough estimates from the bands you chose, based on the law in England and Wales.</span></div>
          </div>
          <aside className="pb-aside g-aside">
            <div className="next">
              <div className="kick">Your guide is ready</div>
              <h3>Keep it, and come back to it whenever you need.</h3>
              <p>It’s free and yours to keep. Email yourself a link to it, or save it as a PDF.</p>
              <div className="btns">
                <button className="btn lg full" onClick={() => setMail(true)}>{emailed ? "Email it again" : "Email me my guide"} <Ic.Arrow s={15}/></button>
                <button className="btn lg ghost full" onClick={() => window.print()}>Download or print</button>
              </div>
            </div>
            <Toc list={list} i={-1} max={99} onGo={jump} full/>
            <PBHeard a={a} onChange={onEdit}/>
            {privacy}
            <button className="skipsec" style={{ justifySelf: "start", marginLeft: 4 }} onClick={onRestart}>Start again with new answers</button>
          </aside>
        </div>
        {mail && <EmailGuide name={N.hasMe ? N.Me : ""} onSend={onEmail} onClose={() => setMail(false)}/>}
      </main>
    );
  }

  Object.assign(window, { GWalk: Walk, GFull: Full });
})();
