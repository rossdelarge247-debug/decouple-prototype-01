/* Take part · the participant hub: welcome & consent → screener → who you'll be → how it works → your session → thank you.
   Never links to the owner's hubs. State in decouple.tp.v1 (step, persona, sid); screener answers are kept only in memory. */
(function () {
  const { useState, useEffect } = React;
  const T = window.TP, Ic = window.DIc;
  const KEY = "decouple.tp.v1";
  const rd = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const exit = () => location.replace("https://www.bbc.co.uk/weather");
  const send = (who, step, rows) => window.DC && window.DC.send({ sid: who.sid, pid: who.pid, test: "Screener", step, rows });

  const Mark = () => <span className="tp-mark"><span className="wm">Decouple<i>.</i></span><span className="tp-loz">Research session</span></span>;
  const Top = () => <header className="tp-top"><Mark/><button type="button" className="pillbtn exit" onClick={exit}><Ic.X s={12} c="#B91C1C"/> Quick exit</button></header>;
  const Steps = ({ i }) => <ol className="tp-steps" aria-label="Progress">{["Welcome", "About you", "How it works", "Your session"].map((s, j) => <li key={s} className={j < i ? "done" : j === i ? "on" : ""}><span>{j < i ? <Ic.Check s={11} w={2.6}/> : j + 1}</span>{s}</li>)}</ol>;
  const Help = () => <div className="tp-help">{T.HELP.map(([t, n, d]) => <div key={t}><b>{t}</b><span>{n}</span><small>{d}</small></div>)}</div>;

  function Welcome({ who, onNext }) {
    const [ok, setOk] = useState(false), mins = T.parts(who.track).reduce((s, x) => s + x.min, 0) + 5;
    return <main className="tp-main">
      <Steps i={0}/>
      <div className="kick">Thank you for helping</div>
      <h1 className="serif">You’re helping us design something <span className="em">for people going through a separation.</span></h1>
      <p className="tp-lede">You’ll try some early designs and tell us what you think. It takes about {mins} minutes{who.mode === "mod" ? ", with one of us alongside you" : ", on your own, at your own pace"}.</p>
      <div className="tp-card"><b className="serif">Before you start</b><ul>
        <li><Ic.Check s={14} c="#047857"/><span><b>It’s a prototype.</b> It looks real, but nothing is. No real accounts, payments or emails.</span></li>
        <li><Ic.Check s={14} c="#047857"/><span><b>We’re testing the design, not you.</b> There are no wrong answers.</span></li>
        <li><Ic.Check s={14} c="#047857"/><span><b>What we keep:</b> your answers to our questions, and which buttons you press. Not what you type into the designs. Your answers are linked to a participant code, not your name.</span></li>
        <li><Ic.Check s={14} c="#047857"/><span><b>Stop any time</b>, for any reason. Quick exit, top right, leaves straight away.</span></li>
      </ul><a href="privacy.html" target="_blank" rel="noopener">Read the privacy notice</a></div>
      <label className="tp-agree"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)}/><span>I understand, and I’m happy to take part.</span></label>
      <div className="tp-nav"><button type="button" className="btn lg" disabled={!ok} onClick={onNext}>Start <Ic.Arrow s={15}/></button></div>
    </main>;
  }

  function Screener({ who, onDone, onOut }) {
    const [a, setA] = useState({}), [stop, setStop] = useState(null);
    const qs = T.SCREEN.filter((q) => !q.when || q.when(a)), ok = qs.every((q) => a[q.id]);
    const set = (id, v) => setA((o) => ({ ...o, [id]: v }));
    const next = () => {
      const out = a.exp === "none" ? "none" : ["scotland", "ni", "else"].includes(a.where) ? "where" : null;
      const rows = qs.filter((q) => !q.private).map((q) => ({ qid: "scr-" + q.id, q: q.q, type: "choice", a: q.o.find((o) => o[0] === a[q.id])[1] }));
      if (out) { send(who, "Screened out", [...rows, { qid: "scr-out", q: "Screened out", type: "choice", a: out }]); return onOut(out); }
      if (a.wb === "no") return setStop("wb");
      send(who, "Screener", rows); onDone(a);
    };
    if (stop === "wb") return <main className="tp-main narrow"><div className="kick">That’s completely fine</div><h1 className="serif">Thank you for telling us.</h1><p className="tp-lede">You don’t need to take part today. If you’d like to talk to someone, these are free and confidential.</p><Help/><div className="tp-nav"><button type="button" className="btn ghost" onClick={() => setStop(null)}>I’d like to take part after all</button></div></main>;
    return <main className="tp-main">
      <Steps i={1}/>
      <div className="kick">About you</div>
      <h1 className="serif">A few quick questions <span className="em">first.</span></h1>
      <p className="tp-lede">So we can understand your answers. Nothing here identifies you.</p>
      <div className="tp-qs">{qs.map((q) => <fieldset key={q.id} className="tp-q"><legend>{q.q}</legend><div className={"kit-ch" + (q.row ? "" : " col")}>{q.o.map(([k, l]) => <button type="button" key={k} className={a[q.id] === k ? "on" : ""} aria-pressed={a[q.id] === k} onClick={() => set(q.id, k)}>{l}</button>)}</div>{q.id === "wb" && a.wb === "hard" && <p className="tp-note">Thank you for being honest. Go gently, take breaks, and stop whenever you like. If it gets too much, Samaritans are free on 116 123, any time.</p>}</fieldset>)}</div>
      <div className="tp-nav"><button type="button" className="btn lg" disabled={!ok} onClick={next}>Continue <Ic.Arrow s={15}/></button></div>
    </main>;
  }

  function Out({ why }) {
    return <main className="tp-main narrow"><div className="kick">Thank you</div><h1 className="serif">Thanks for your time.</h1><p className="tp-lede">{T.OUT[why]} We’re grateful you were willing to help, and you don’t need to do anything else.</p><p className="tp-small">You can close this page now.</p></main>;
  }

  function Mindset({ who, persona, setPersona, onNext }) {
    const mod = who.mode === "mod";
    return <main className="tp-main">
      <Steps i={2}/>
      <div className="kick">How it works</div>
      <h1 className="serif">Who would you like <span className="em">to be?</span></h1>
      <div className="tp-two">
        <button type="button" className={"tp-pick" + (persona === "sarah" ? " on" : "")} aria-pressed={persona === "sarah"} onClick={() => setPersona("sarah")}><span className="r"></span><b className="serif">Play Sarah</b><small>{T.SARAH.t}</small><p>{T.SARAH.d}</p><i>Best if you’d rather not use your own situation.</i></button>
        <button type="button" className={"tp-pick" + (persona === "self" ? " on" : "")} aria-pressed={persona === "self"} onClick={() => setPersona("self")}><span className="r"></span><b className="serif">Be yourself</b><small>Your own situation</small><p>Imagine using it for your own separation. Make up any figures you like. Some screens start with Sarah’s example, so just picture it as yours.</p><i>Nothing you type into the designs is sent to us.</i></button>
      </div>
      <div className="tp-tips">
        <div><b>Some things aren’t built yet</b><p>A few buttons say so when you press them. That’s on purpose, and pressing them helps us.</p></div>
        <div><b>{mod ? "Say what you’re thinking" : "Tell us as you go"}</b><p>{mod ? "Talk us through what you see and what you’d expect. We may ask a question now and then." : "Short questions pop up now and then, and at the end of each part. A sentence or two is plenty."}</p></div>
        <div><b>Be honest</b><p>If something is confusing, off-putting or wrong, that’s exactly what we need to hear.</p></div>
        <div><b>Take your time</b><p>You can take a break between parts, and come back to this page.</p></div>
      </div>
      <div className="tp-nav"><button type="button" className="btn lg" disabled={!persona} onClick={onNext}>See my session <Ic.Arrow s={15}/></button></div>
    </main>;
  }

  function Session({ who, onFinish }) {
    const list = T.parts(who.track), U = window.UT, done = (U && U.get().done) || {};
    const nx = list.find((x) => !done[x.stage]), all = list.length > 0 && !nx;
    const open = (x) => {
      const hub = location.origin + location.pathname;
      U && U.set({ on: true, participant: true, hub, track: list.map((y) => y.stage), pid: who.pid, sid: who.sid, started: (U.get().started || new Date().toISOString()) });
      location.href = encodeURI(x.file) + "?test=1";
    };
    if (!list.length) return <main className="tp-main narrow"><div className="kick">Your code</div><h1 className="serif">This code is for the guide.</h1><p className="tp-lede">There are no designs to try with it. If you were expecting some, ask the person who sent you the link.</p><a className="btn" href="/guide">Open the guide</a></main>;
    return <main className="tp-main">
      <Steps i={3}/>
      <div className="kick">Your session</div>
      <h1 className="serif">{all ? "All done. Thank you." : <>{list.length} part{list.length === 1 ? "" : "s"}, <span className="em">in order.</span></>}</h1>
      <p className="tp-lede">{all ? "You’ve tried everything we hoped you would." : "Start with the first. When you finish a part, a few questions follow, then you come back here."}</p>
      <ol className="tp-list">{list.map((x) => { const d = !!done[x.stage], here = nx === x; return <li key={x.tok} className={(d ? "done" : "") + (here ? " next" : "")}>
        <span className="n">{d ? <Ic.Check s={13} w={2.6}/> : x.n}</span>
        <div><b>{x.t}</b><p>{x.d}</p></div>
        <span className="m">{d ? "Done" : "About " + x.min + " min"}</span>
        <button type="button" className={"btn" + (here ? "" : " ghost")} onClick={() => open(x)}>{d ? "Again" : here ? "Start" : "Open"}</button>
      </li>; })}</ol>
      <div className="tp-nav">{all ? <button type="button" className="btn lg" onClick={onFinish}>Finish <Ic.Arrow s={15}/></button> : <button type="button" className="kit-lnk" onClick={onFinish}>I need to stop here</button>}</div>
      {who.preview && <div className="tp-prev">Preview · {who.pid} · {T.trackLabel(who.track)} · {who.mode === "mod" ? "with a researcher" : "on their own"}</div>}
    </main>;
  }

  function Thanks({ who }) {
    const I = T.INCENTIVE, [fu, setFu] = useState(null), [v, setV] = useState(""), [email, setEmail] = useState(""), [hp, setHp] = useState(""), [st, setSt] = useState("");
    const okMail = /^\S+@\S+\.\S+$/.test(email), need = fu === "yes" || !!v, can = fu && (!need || okMail);
    const go = async (e) => { e.preventDefault(); if (!can) return; setSt("busy"); const b = { sid: who.sid, followup: fu === "yes", voucher: v, email: need ? email.trim() : "", hp };
      const r = window.DC && window.DC.participant ? await window.DC.participant(b) : { ok: false, status: 0 }; setSt(r.ok ? "sent" : r.status === 0 ? "preview" : "err"); };
    if (st === "sent" || st === "preview") return <main className="tp-main narrow"><div className="kick">Thank you</div><h1 className="serif">That’s everything.</h1><p className="tp-lede">{v ? "We’ll email your voucher within a week. " : ""}{fu === "yes" ? "We may be in touch about a short follow-up chat. " : ""}Thank you for your time, and for being so open with us.</p>{st === "preview" && <p className="tp-small">Preview: nothing was sent.</p>}<p className="tp-small">You can close this page now.</p></main>;
    return <main className="tp-main narrow">
      <div className="kick">Thank you</div>
      <h1 className="serif">You’ve been <span className="em">really helpful.</span></h1>
      <form className="tp-form" onSubmit={go}>
        <fieldset className="tp-q"><legend>Would you be happy to talk to us for 30 minutes, another time?</legend><div className="kit-ch">{[["yes", "Yes, I’d be happy to"], ["no", "No, thank you"]].map(([k, l]) => <button type="button" key={k} className={fu === k ? "on" : ""} aria-pressed={fu === k} onClick={() => setFu(k)}>{l}</button>)}</div></fieldset>
        <fieldset className="tp-q"><legend>As a thank you, we’d like to send you a {I.amount} voucher.</legend><div className="kit-ch">{I.choices.map((c) => <button type="button" key={c} className={v === c ? "on" : ""} aria-pressed={v === c} onClick={() => setV(v === c ? "" : c)}>{c}</button>)}</div></fieldset>
        {need && <label className="tp-fld"><span>Your email</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"/><small>Only for {[v && "your voucher", fu === "yes" && "arranging a chat"].filter(Boolean).join(" and ")}. Kept apart from your answers, and deleted afterwards. Use an address your partner can’t read.</small></label>}
        <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} name="website"/>
        {st === "err" && <p className="tp-err" role="alert">That didn’t send. Please try again.</p>}
        <div className="tp-nav"><button type="submit" className="btn lg" disabled={!can || st === "busy"}>Done <Ic.Arrow s={15}/></button></div>
      </form>
    </main>;
  }

  function App({ who }) {
    const [s, setS] = useState(() => ({ step: "welcome", persona: "", ...rd() }));
    const up = (p) => setS((o) => { const n = { ...o, ...p }; localStorage.setItem(KEY, JSON.stringify({ step: n.step, persona: n.persona, out: n.out, pid: who.pid })); return n; });
    useEffect(() => { window.scrollTo(0, 0); }, [s.step]);
    useEffect(() => { if (rd().pid && rd().pid !== who.pid) up({ step: "welcome", persona: "", out: "" }); }, []);
    const setPersona = (p) => { up({ persona: p }); };
    const toMind = () => up({ step: "mind" });
    const toSession = () => { send(who, "Persona", [{ qid: "scr-persona", q: "Who would you like to be?", type: "choice", a: s.persona === "sarah" ? "Play Sarah" : "Be yourself" }]); up({ step: "session" }); };
    return <div className="site tp" data-screen-label={"Take part · " + s.step}>
      <Top/>
      {s.step === "welcome" && <Welcome who={who} onNext={() => up({ step: "screen" })}/>}
      {s.step === "screen" && <Screener who={who} onDone={toMind} onOut={(w) => up({ step: "out", out: w })}/>}
      {s.step === "out" && <Out why={s.out || "none"}/>}
      {s.step === "mind" && <Mindset who={who} persona={s.persona} setPersona={setPersona} onNext={toSession}/>}
      {s.step === "session" && <Session who={who} onFinish={() => up({ step: "thanks" })}/>}
      {s.step === "thanks" && <Thanks who={who}/>}
      <footer className="tp-foot"><span>Decouple is not a law firm, and nothing here is legal advice.</span><a href="privacy.html" target="_blank" rel="noopener">Privacy</a></footer>
    </div>;
  }

  Object.assign(window, { TPApp: App, TPKEY: KEY });
})();
