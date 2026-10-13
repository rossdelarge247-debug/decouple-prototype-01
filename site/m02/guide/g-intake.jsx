/* M02 v2 · landing (Proto 01 hero system), interview (Proto 02 screens), build */
(function () {
  const { useState, useEffect } = React;
  const Ic = window.DIc, IV = window.IV, G = window.G;

  const AREAS = [
    { k: "where", n: "01", t: "Where you are", c: "#5B21B6", rows: [["Stage", "Living apart"], ["Next step", "Get the picture"], ["Typical time", "6–9 months"]], more: "Your next step in plain English, and what to expect along the way.", pos: { x: -44, y: 22, r: -5, w: 180 } },
    { k: "kids", n: "02", t: "Children", c: "#9D174D", rows: [["Telling them", "Together"], ["Pattern", "5-2-2-5"], ["Maintenance", "Agreed"]], more: "A child-first starting point for arrangements, and how to talk to them.", pos: { x: 334, y: -6, r: 4, w: 176 } },
    { k: "pic", n: "03", t: "The financial picture", c: "#4338CA", rows: [["Form E", "~28 pages"], ["Statements", "12 months"], ["Pensions", "Ask for a CETV"]], more: "Exactly what you’ll both need to gather, and why it matters.", pos: { x: -40, y: 470, r: 3, w: 184 } },
    { k: "legal", n: "04", t: "Making it legal", c: "#166534", rows: [["Divorce", "20 weeks+"], ["Consent order", "~£60 fee"], ["Final order", "After the money"]], more: "The legal steps in the right order, so nothing catches you out.", pos: { x: 330, y: 486, r: -3, w: 190 } },
  ];
  const SPINE = ["Where you are", "The financial picture", "Children", "The home", "What’s fair", "Reaching agreement", "Making it legal", "Looking after yourself"];
  const HL = { where: 0, pic: 1, kids: 2, legal: 6 };

  function Composition() {
    const [open, setOpen] = useState(null), [hover, setHover] = useState(null), hl = HL[hover || open];
    return (
      <div className="comp">
        <div className="spine">
          <div className="spine-tab">YOUR GUIDE</div>
          <div style={{ padding: "26px 20px 0" }}>
            <div className="kick" style={{ color: "#78716C", fontSize: 9.5 }}>Personalised to you</div>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.15, marginTop: 6 }}>In the right order</div>
            <div className="serif" style={{ fontSize: 12.5, fontStyle: "italic", color: "#57534E", marginTop: 4 }}>eight short chapters</div>
          </div>
          <div style={{ margin: "16px 20px 0", display: "grid", gap: 6 }}>
            {SPINE.map((t, i) => <div key={t} className={"spine-row" + (hl === i ? " hl" : "")}><span className="tab" style={{ fontSize: 10, color: "#5B21B6", fontWeight: 700 }}>{i + 1}</span><span style={{ flex: 1 }}>{t}</span><Ic.Check s={11} w={2.4} c="#5B21B6"/></div>)}
          </div>
        </div>
        {AREAS.map((a) => (
          <button key={a.k} className={"acard" + (open === a.k ? " open" : "")} aria-expanded={open === a.k} style={{ "--x": a.pos.x + "px", "--y": a.pos.y + "px", "--r": a.pos.r + "deg", "--w": a.pos.w + "px", "--c": a.c }}
            onMouseEnter={() => setHover(a.k)} onMouseLeave={() => setHover(null)} onClick={() => setOpen(open === a.k ? null : a.k)}>
            <div className="ah"><i></i><span>Chapter {a.n}</span><Ic.Plus s={12} c="#A8A29E"/></div>
            <h4>{a.t}</h4>
            <div className="rows">{a.rows.map((r) => <div key={r[0]}><span>{r[0]}</span><b>{r[1]}</b></div>)}</div>
            <div className="more"><div><p>{a.more}</p></div></div>
          </button>
        ))}
      </div>
    );
  }

  function Landing({ onStart, resume }) {
    return (
      <main className="g-land">
        <div className="wrap hero">
          <div style={{ paddingTop: 14 }}>
            <div className="pill-kick"><span className="kick">A free, private guide for anyone separating</span></div>
            <h1 className="serif h-hero">Trying to work out<br/>what to do<br/><span className="em">next?</span></h1>
            <p className="serif lede">Separating comes with a hundred questions and no clear order. Answer a few gentle ones, and get a personalised guide: exactly what you need to do, in what order, and what to expect along the way.</p>
            <div className="hero-cta">
              <div><button className="btn lg" onClick={onStart}>{resume ? "Carry on with my guide" : "Get my free guide"} <Ic.Arrow s={16}/></button><span className="note tab">~6 minutes · no account, no name needed</span></div>
            </div>
            <div className="trust">
              <span><Ic.Lock s={13} c="#78716C"/> Private. Your guide stays on this device</span>
              <span><Ic.X s={13} c="#78716C"/> Quick exit at any time</span>
              <span className="yes"><Ic.Check s={13} w={2.1} c="#166534"/> Free, and yours to keep</span>
            </div>
          </div>
          <Composition/>
        </div>
        <div className="wrap explore">
          {[["Know the order", "The steps from here to a legal agreement, with where you are now marked clearly."], ["Know what to expect", "How long things usually take, what they cost, and what people often miss."], ["Children, home and you", "Not just the money. Your guide covers the children, where you’ll live, and how you’re coping."]].map(([t, d]) => (
            <div key={t} className="xcard" style={{ cursor: "default" }}><span className="t">{t}</span><span className="d">{d}</span></div>
          ))}
        </div>
        <div className="wrap" style={{ paddingBottom: 72 }}>
          <div className="band g-band"><div><div className="t">Built for the start, when everything feels unclear.</div><div className="d">This is guidance, not legal advice, based on the law in England and Wales.</div></div><button className="btn" onClick={onStart}>Start now <Ic.Arrow s={14}/></button></div>
        </div>
      </main>
    );
  }

  function Expect({ text }) {
    if (!text) return null;
    return <div className="xpect"><span className="i"><Ic.Help s={16}/></span><div><b>What to expect</b><p>{text}</p></div></div>;
  }

  function Panel({ a, cur }) {
    const rows = G.PANEL.map(([k, f]) => [k, f(a)]), done = rows.filter((r) => r[1]).length, pct = Math.round((done / rows.length) * 100);
    const map = { about: "Where you are", kids: "Children", home: "Home & living", income: "Money", assets: "Money", debts: "Money", pensions: "Pensions", life: "Life & support", where: "Your path", goals: "What matters" };
    return (
      <div className="pp">
        <div className="pp-tab"><Ic.Lock s={10} c="#FFF"/> YOUR GUIDE · PRIVATE</div>
        <div className="pp-card">
          <div className="pp-in">
            <div className="pp-t">Your guide so far</div>
            <div className="pp-s">Each answer shapes a chapter.</div>
            <div className="pp-rows">{rows.map(([k, v]) => <div key={k} className={"pp-row" + (v ? " done" : "") + (map[cur] === k ? " cur" : "")}><span className="d">{v ? <Ic.Check s={10} w={2.8} c="#166534"/> : <i></i>}</span><span className="k">{k}</span><span className="v">{v || "—"}</span></div>)}</div>
          </div>
          <div className="pp-foot"><div className="h"><span>Writing your guide</span><span>{pct}%</span></div><div className="bar"><i style={{ width: pct + "%" }}></i></div></div>
        </div>
        <div className="pp-note"><Ic.Lock s={12}/> Your guide stays on this device. No account needed.</div>
      </div>
    );
  }

  function Interview({ a, setA, pos, setPos, onDone, onStop, onBack, post }) {
    const secs = G.activeSections(a), i = Math.max(0, secs.findIndex((s) => s.id === pos)), sec = secs[i];
    const qs = G.secQs(sec.id, a);
    const optional = typeof sec.optional === "function" ? sec.optional(a) : !!sec.optional;
    const can = optional || qs.every((q) => (q.type === "safe" ? !!a.safe : IV.answered(q, a)));
    const set = (id, v) => setA((p) => ({ ...p, [id]: v }));
    const next = () => { if (!can) return; post(sec, qs); if (sec.id === "safety" && IV.safetyStop(a)) return onStop(); if (i === secs.length - 1) onDone(); else setPos(secs[i + 1].id); };
    const back = () => (i === 0 ? onBack() : setPos(secs[i - 1].id));
    useEffect(() => {
      const k = (e) => { if (/INPUT|TEXTAREA/.test(e.target.tagName)) return; if (e.key === "Enter") { e.preventDefault(); next(); } };
      addEventListener("keydown", k); return () => removeEventListener("keydown", k);
    });
    const ex = sec.expect && sec.expect(a), last = i === secs.length - 1;
    const cta = last ? "Write my guide" : "Continue";
    return (
      <>
        <div className="iv-grid">
          <div style={{ "--c": sec.c }}>
            {a.stage === "considering" && <div className="iv-banner"><Ic.Spark s={12}/> Just exploring. Nothing here commits you to anything.</div>}
            <div className="iv-kick">{sec.name}<span>step {i + 1} of {secs.length}</span></div>
            <h2 className="iv-h">{sec.title}</h2>
            {sec.helper && <p className="iv-help">{sec.helper}</p>}
            <div className="qs">{qs.map((q) => q.type === "safe" ? <IVSafeQ key={q.id} a={a} set={set}/> : <IVQBlock key={q.id} q={q} a={a} set={set}/>)}</div>
            <Expect text={ex}/>
            <div className="iv-nav desk">
              <button className="back" onClick={back}><Ic.Arrow s={14} style={{ transform: "rotate(180deg)" }}/> Back</button>
              <button className="btn lg" disabled={!can} onClick={next}>{cta} <Ic.Arrow s={15}/></button>
              {optional && !qs.every((q) => IV.answered(q, a)) ? <button className="skipsec" onClick={() => (last ? onDone() : setPos(secs[i + 1].id))}>Skip this for now</button> : <span className="hint">or press Enter</span>}
            </div>
          </div>
          <aside className="iv-side"><Panel a={a} cur={sec.id}/></aside>
        </div>
        <div className="mnav"><div className="row"><button className="back" aria-label="Back" onClick={back}><Ic.Arrow s={16} style={{ transform: "rotate(180deg)" }}/></button><button className="btn lg" disabled={!can} onClick={next}>{cta} <Ic.Arrow s={15}/></button></div>{optional && <button className="sv" onClick={() => (last ? onDone() : setPos(secs[i + 1].id))}>Skip this for now</button>}</div>
      </>
    );
  }

  function Build({ a, onOpen }) {
    const items = ["Where you are, and what to expect", "The financial picture you’ll need", a.kids === "with" ? "The children’s arrangements" : "The home, and where you’ll live", "A likely fair range", "The legal steps, in order", "Support for you"];
    const [n, setN] = useState(0);
    useEffect(() => { if (n < items.length) { const t = setTimeout(() => setN(n + 1), 600); return () => clearTimeout(t); } }, [n]);
    const done = n >= items.length;
    return (
      <div className="build">
        <div className="kick">{done ? "Your guide is ready" : "Writing your guide"}</div>
        <h2 className="iv-hero-h" style={{ fontSize: 44 }}>{done ? <>Here’s your<br/><span className="em">way through.</span></> : <>Putting it<br/><span className="em">together…</span></>}</h2>
        <p className="iv-hero-p">We’re turning your answers into a personalised guide: what to do, in what order, and what to expect.</p>
        <div className="build-list">{items.map((t, i) => <div key={t} className={i < n ? "done" : i === n ? "now" : ""}><span className="d">{i < n && <Ic.Check s={11} w={3} c="#FFF"/>}</span>{t}</div>)}</div>
        <div style={{ marginTop: 28, minHeight: 52 }}>{done && <button className="btn lg" onClick={onOpen}>Open my guide <Ic.Arrow s={16}/></button>}</div>
      </div>
    );
  }

  Object.assign(window, { GLanding: Landing, GInterview: Interview, GBuild: Build });
})();
