/* MVP 01 · Toolkit: guide hand-off and toolkit home. The public pages are MVP 00; signing up is the shared KitSignup modal. */
(function () {
  const { useState } = React;
  const K = window.KIT, Ic = window.KIc;
  const gbp = (n) => "£" + n;

  function Guide({ stage, onNext }) {
    const P = K.PERSONA, S = K.STAGES[stage];
    return (
      <main className="tk-narrow">
        <div className="kick">Your free guide</div>
        <h1 className="serif">Your guide is ready, <span className="em">{P.me}.</span></h1>
        <div className="tk-gcard">
          <small>{K.STAGE_L[stage]}</small><b className="serif">{S.t}</b>
          <div className="tk-week"><span className="lbl">This week</span>{P.week.map(([t, d]) => <div key={t}><Ic.Check s={14} c="#5B21B6"/><div><b>{t}</b><small>{d}</small></div></div>)}</div>
          <div className="tk-chs"><span className="lbl">{P.chapters.length} chapters, written for you</span><div>{P.chapters.map((c) => <span key={c}>{c}</span>)}</div></div>
          <a className="lnk" href={encodeURI("Marketing 02 · Divorce Guide.html") + "?demo=1&phase=full"} target="_blank" rel="noopener">Read your full guide <Ic.Ext s={13}/></a>
        </div>
        <div className="tk-cta"><button type="button" className="btn lg" onClick={onNext}>Open my toolkit <Ic.Arrow s={16}/></button><span>Free. No account needed.</span></div>
        <window.KitProto>The real guide (Marketing 02) comes before this screen. We’ve used Sarah’s answers.</window.KitProto>
      </main>
    );
  }

  function ToolCard({ t, stage, onOpen, now, want }) {
    const st = K.status(t.id), pk = t.pack && K.PACKS[t.pack];
    const [show, setShow] = useState(false);
    const chip = { new: ["new", "Not started"], started: ["started", "In progress"], done: ["done", "Done"] }[st];
    if (t.kidsOnly && !K.kids() && !show) return (
      <div className="tk-tool mini"><window.KitToolIc tool={t} s={16}/><div><b>{t.t}</b><small>Your guide says you don’t have children under 18 together, so you can skip this.</small></div><button type="button" className="kit-lnk" onClick={() => setShow(true)}>Show it anyway</button></div>
    );
    return (
      <div className={"tk-tool" + (now ? " now" : "")} style={{ "--c": t.c, "--cs": t.soft }}>
        <div className="tk-tool-h"><window.KitToolIc tool={t}/><div><h3 className="serif">{t.t}</h3><div className="tk-meta">{now && <span className="kit-chip now">Now</span>}{want && <span className="kit-chip started">You came for this</span>}<span className={"kit-chip " + chip[0]}>{chip[1]}</span><span>{t.time}</span></div></div></div>
        <p>{t.d}</p>
        <div className="tk-tool-f">{pk ? <span className="tk-pack"><Ic.Doc s={13}/><span>{"Finished pack, " + gbp(K.price(t.pack)) + ". Optional"}</span></span> : <span className="tk-pack free"><Ic.Check s={13}/> Free</span>}<button type="button" className={"btn" + (now ? "" : " ghost")} onClick={() => onOpen(t)}>{st === "done" ? "Review" : st === "started" ? "Carry on" : "Open"} <Ic.Arrow s={14}/></button></div>
      </div>
    );
  }

  function Home({ stage, acct, onOpen, onSave, want }) {
    const P = K.PERSONA, S = K.STAGES[stage], start = K.TOOLS.find((t) => t.id === S.start), A = K.ASK;
    const [q, setQ] = useState("");
    return (
      <main className="tk-home">
        {!acct && <div className="tk-nosave"><span><Ic.Help s={15}/> Try any tool, free. Nothing is kept until you save.</span><button type="button" className="btn" onClick={onSave}>Save my progress</button></div>}
        <div className="tk-hh"><div className="kick">Your toolkit · {K.STAGE_L[stage]}</div><h1 className="serif">{acct ? "Good to see you, " : "Your toolkit is ready, "}<span className="em">{P.me}.</span></h1><p>{S.t} {S.why}</p></div>
        <div className="tk-cols">
          <div>
            <ol className="tk-path">
              {K.TOOLS.map((t) => <li key={t.id} className={(t.id === start.id ? "on" : "") + (t.kidsOnly && !K.kids() ? " skip" : "")}><div className="tk-step"><b>{t.step}</b><span>{t.stepT}</span></div><ToolCard t={t} stage={stage} now={t.id === start.id} want={want === t.id} onOpen={onOpen}/></li>)}
            </ol>
          </div>
          <aside className="tk-side">
            <div className="tk-ask">
              <div className="hd"><span className="kit-tic"><Ic.Chat s={17}/></span><div><b className="serif">Ask, any time</b><small>Answers from official sources, with links. Never legal advice.</small></div></div>
              <form onSubmit={(e) => { e.preventDefault(); onOpen(A, q); }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Do we have to go to mediation?" aria-label="Ask a question"/><button type="submit" aria-label="Ask"><Ic.Arrow s={15}/></button></form>
              <div className="modes">{A.modes.slice(1).map(([k, l]) => <button type="button" key={k} onClick={() => onOpen(A, "", k)}>{l}</button>)}</div>
            </div>
            <div className="tk-card">
              <b className="serif">Finished documents</b>
              <p>Everything in the tools is free. Pay only if you want the finished, formatted pack.</p>
              {Object.entries(K.PACKS).map(([k, p]) => <div key={k} className="tk-pk"><Ic.Doc s={16}/><div><b>{p.t}</b><small>From your {k === "disclosure" ? "financial statement" : "split planner"}</small></div><span>{gbp(K.price(k))}</span></div>)}
            </div>
            <div className="tk-card">
              <b className="serif">Your guide</b>
              <p>{P.chapters.length} chapters, written for where you are.</p>
              <div className="tk-links"><a href={encodeURI("Marketing 02 · Divorce Guide.html") + "?demo=1&phase=full"} target="_blank" rel="noopener">Read it <Ic.Ext s={12}/></a><a href={encodeURI("Marketing 02 · Divorce Guide.html") + "?demo=1"} target="_blank" rel="noopener">Update my answers <Ic.Ext s={12}/></a></div>
            </div>
            <div className="tk-card help">
              <b className="serif">Need someone now?</b>
              <div className="tk-help"><Ic.Phone s={15}/><div><b>Samaritans · 116 123</b><small>Free, any time, day or night</small></div></div>
              <div className="tk-help"><Ic.Phone s={15}/><div><b>National Domestic Abuse Helpline · 0808 2000 247</b><small>Free, 24 hours</small></div></div>
              <button type="button" className="kit-lnk tk-hall" onClick={() => K.open(K.HELP.file)}>All help &amp; support, from GOV.UK and charities <Ic.Arrow s={13}/></button>
            </div>
          </aside>
        </div>
      </main>
    );
  }

  Object.assign(window, { TKGuide: Guide, TKHome: Home });
})();
