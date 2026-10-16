/* MVP toolkit · shared UI: wordmark + lozenge, top bar, icons, modal, prototype note, fake door, finished-pack pay screen. */
(function () {
  const { useState, useEffect, useRef } = React;
  const Ic = window.DIc;
  const I = (ch, p) => <svg width={p.s || 14} height={p.s || 14} viewBox="0 0 24 24" fill="none" stroke={p.c || "currentColor"} strokeWidth={p.w || 1.75} strokeLinecap="round" strokeLinejoin="round" style={p.style} aria-hidden="true">{ch}</svg>;
  const KIc = {
    ...Ic,
    List: (p) => I(<><line x1="9" y1="7" x2="20" y2="7"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="17" x2="20" y2="17"/><polyline points="3.5 7 5 8.5 7 6"/><polyline points="3.5 12 5 13.5 7 11"/><circle cx="5" cy="17" r="1"/></>, p),
    Scale: (p) => I(<><line x1="12" y1="4" x2="12" y2="20"/><line x1="7" y1="20" x2="17" y2="20"/><line x1="5" y1="7" x2="19" y2="7"/><path d="M5 7l-3 6a3 3 0 0 0 6 0z"/><path d="M19 7l-3 6a3 3 0 0 0 6 0z"/></>, p),
    Chat: (p) => I(<path d="M4 5h16v11H9l-5 4z"/>, p),
    Doc: (p) => I(<><path d="M6 3h8l4 4v14H6z"/><polyline points="14 3 14 7 18 7"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></>, p),
    Mail: (p) => I(<><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></>, p),
    Phone: (p) => I(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>, p),
    Ext: (p) => I(<><path d="M14 4h6v6"/><line x1="20" y1="4" x2="11" y2="13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></>, p),
    Users: (p) => I(<><circle cx="9" cy="8" r="3"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14h1a4 4 0 0 1 4 4v1"/></>, p),
    Cal: (p) => I(<><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></>, p),
    Pen: (p) => I(<><path d="M4 20h4L19 9l-4-4L4 16z"/><line x1="13" y1="7" x2="17" y2="11"/></>, p),
    Up: (p) => I(<path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 3 2l-1 4h6a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 17.7 20H7"/>, p),
    Back: (p) => I(<><line x1="19" y1="12" x2="5" y2="12"/><polyline points="11 6 5 12 11 18"/></>, p),
  };

  function Mark({ onClick }) {
    return <button type="button" className="kit-mark" onClick={onClick} aria-label="Decouple, your divorce toolkit"><span className="wm">Decouple<i>.</i></span><span className="kit-loz">Your divorce toolkit</span></button>;
  }

  /* tool pages pass tool to get a "Your toolkit" link; the toolkit home passes onHome */
  function Top({ signedIn, onHome, onSignOut, tool, children }) {
    const [o, setO] = useState(false), ref = useRef(null), P = window.KIT.PERSONA;
    const [acct, setAcct] = useState(window.KIT.acct());
    useEffect(() => window.KIT.subscribe(() => setAcct(window.KIT.acct())), []);
    if (signedIn === undefined) signedIn = acct;
    const goHome = onHome || window.KIT.home;
    useEffect(() => { if (!o) return; const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setO(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, [o]);
    return (
      <header className="kit-top">
        <div className="l"><Mark onClick={goHome}/>{tool && <button type="button" className="kit-crumb" onClick={goHome}><KIc.Back s={13}/> Your toolkit</button>}</div>
        <div className="r">{children}
          <button type="button" className="pillbtn exit" onClick={window.KIT.exit}><Ic.X s={12} c="#B91C1C"/> Quick exit</button>
          {!signedIn && <button type="button" className="btn sm kit-savebtn" onClick={() => window.KIT.needAcct("save")}>Save my progress</button>}
          {signedIn && <div className="kit-acct" ref={ref}>
            <button type="button" className="kit-av" aria-haspopup="menu" aria-expanded={o} aria-label="Your account" onClick={() => setO(!o)}>{P.me[0]}</button>
            {o && <div className="kit-menu" role="menu"><div className="hd"><b>{P.me} Mitchell</b><small>{P.email}</small></div>
              <button type="button" role="menuitem" onClick={() => { setO(false); goHome(); }}>Your toolkit</button>
              <button type="button" role="menuitem" onClick={() => setO(false)}>Account &amp; privacy</button>
              <hr/><button type="button" role="menuitem" onClick={() => { setO(false); window.KIT.signOut(); onSignOut ? onSignOut() : window.KIT.open(window.KIT.SITE); }}>Sign out</button></div>}
          </div>}
        </div>
        {ReactDOM.createPortal(<div className="site kit-portal"><Guest/></div>, document.body)}
      </header>
    );
  }

  const ToolIc = ({ tool, s = 18 }) => { const C = KIc[tool.ic] || KIc.Spark; return <span className="kit-tic" style={{ background: tool.soft, color: tool.c }}><C s={s}/></span>; };

  function Modal({ onClose, children, label, wide }) {
    useEffect(() => { const f = (e) => e.key === "Escape" && onClose(); addEventListener("keydown", f); return () => removeEventListener("keydown", f); }, []);
    return <div className="kit-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}><div className={"kit-modal" + (wide ? " wide" : "")} role="dialog" aria-modal="true" aria-label={label}><button type="button" className="kit-x" aria-label="Close" onClick={onClose}><Ic.X s={16}/></button>{children}</div></div>;
  }

  const Proto = ({ children }) => <div className="kit-proto"><span>Prototype</span><div className="t">{children}</div></div>;

  const Head = ({ kick, title, em, lede, children }) => (
    <div className="kit-head"><div><div className="kick">{kick}</div><h1 className="serif">{title} {em && <span className="em">{em}</span>}</h1>{lede && <p>{lede}</p>}</div>{children && <div className="a">{children}</div>}</div>
  );

  /* ── fake door ── */
  function FakeDoor({ id, compact }) {
    const D = window.KIT.DOORS[id], C = KIc[D.ic] || KIc.Spark, done = (window.KIT.read().doors || {})[id];
    const [open, setOpen] = useState(false), [u, setU] = useState(null), [pick, setPick] = useState([]), [txt, setTxt] = useState(""), [sent, setSent] = useState(!!done), [notify, setNotify] = useState(false);
    const click = () => { window.KIT.log("fd-" + id, D.t, "fakedoor", "clicked", { step: "Fake door · " + id }); setOpen(true); };
    const send = () => {
      const K = window.KIT, st = { step: "Fake door · " + id };
      K.log("fd-" + id + "-useful", "How useful would “" + D.t + "” be?", "rating5", u, st);
      if (pick.length) K.log("fd-" + id + "-why", D.q2, "chips", pick, st);
      if (txt.trim()) K.log("fd-" + id + "-txt", "Anything else about “" + D.t + "”?", "text", txt.trim(), st);
      if (notify) K.log("fd-" + id + "-notify", "Tell me when it’s ready", "yesno", "Yes", st);
      K.write({ doors: { ...(K.read().doors || {}), [id]: { u, pick, at: new Date().toISOString() } } }); setSent(true);
    };
    const tog = (o) => setPick((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));
    return (
      <>
        <div className={"kit-fd" + (compact ? " sm" : "")}>
          <span className="ic"><C s={compact ? 16 : 18}/></span>
          <div><b>{D.t}</b><p>{D.d}</p></div>
          <button type="button" className="btn ghost" onClick={click}>{D.cta} <Ic.Arrow s={13}/></button>
        </div>
        {open && (
          <Modal onClose={() => setOpen(false)} label={D.t}>
            {sent ? (
              <div className="kit-fd-ok"><span className="c"><Ic.Check s={22} w={2.2} c="#065F46"/></span><h2>Thank you.</h2><p>That helps us decide what to build next.{notify ? " We’ll email you once if we build it." : ""}</p><button type="button" className="btn" onClick={() => setOpen(false)}>Back to what I was doing</button></div>
            ) : (
              <>
                <span className="kit-chip soon">Not ready yet</span>
                <h2>{"We haven’t built “" + D.t + "” yet."}</h2>
                <p>We’re finding out whether people want it before we build it. Two quick questions help us decide.</p>
                <div className="kit-fq"><b>How useful would it be for you?</b><div className="kit-sc">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} className={u === n ? "on" : ""} onClick={() => setU(n)}>{n}</button>)}</div><div className="kit-ends"><span>Not useful</span><span>Very useful</span></div></div>
                <div className="kit-fq"><b>{D.q2}</b><small>Tap any</small><div className="kit-ch">{D.opts.map((o) => <button type="button" key={o} className={pick.includes(o) ? "on" : ""} onClick={() => tog(o)}>{o}</button>)}</div></div>
                <div className="kit-fq"><b>Anything else?</b><textarea value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Optional, in your own words"></textarea></div>
                <label className="kit-chk"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)}/> Tell me if you build it</label>
                <div className="kit-mf"><button type="button" className="btn" disabled={!u} onClick={send}>Send</button><button type="button" className="kit-lnk" onClick={() => setOpen(false)}>Not now</button></div>
              </>
            )}
          </Modal>
        )}
      </>
    );
  }

  /* ── finished pack: price shown, nothing charged during testing ── */
  function Pay({ pack, N, onPreview }) {
    const K = window.KIT, P = K.PACKS[pack], pr = K.price(pack), got = (K.read().paid || {})[pack];
    const [step, setStep] = useState(got ? "got" : "offer"), [sol, setSol] = useState(!!(K.read().waitlist || {})[pack]), [ans, setAns] = useState(got && got.ans), [toast, setToast] = useState("");
    const st = { step: "Pay · " + pack, price: "£" + pr };
    const buy = () => { K.log("pay-" + pack, "Get the " + P.t + " · £" + pr, "pay", "clicked", st); K.needAcct("pay", () => setStep("free")); };
    const answer = (a) => { setAns(a); K.log("pay-" + pack + "-would", "Would you have paid £" + pr + " for it?", "choice", a, st); K.write({ paid: { ...(K.read().paid || {}), [pack]: { ans: a, price: pr, at: new Date().toISOString() } } }); setStep("got"); };
    const wait = (v) => { setSol(v); K.write({ waitlist: { ...(K.read().waitlist || {}), [pack]: v } }); if (v) K.log("pay-" + pack + "-solicitor", "Join the solicitor check waitlist", "yesno", "Yes", st); };
    return (
      <section className="kit-pay">
        <div className="kit-pay-l">
          <div className="kick">Your finished pack</div>
          <h2 className="serif">{P.t}</h2>
          <p>{P.d}</p>
          <ul>{P.items.map(([t, d]) => <li key={t}><Ic.Check s={14} c="#047857"/><div><b>{t}</b><small>{d}</small></div></li>)}</ul>
        </div>
        <div className="kit-pay-r">
          {step === "offer" && <>
            <div className="pr"><b className="serif">{"£" + pr}</b><span>One payment, for both of you. The tool itself stays free.</span></div>
            <button type="button" className="btn lg full" onClick={buy}>{"Get the pack · £" + pr}</button>
            <label className="kit-sol"><input type="checkbox" checked={sol} onChange={(e) => wait(e.target.checked)}/><div><b>Add a solicitor check</b><small>A family solicitor reviews it for a fixed fee. Not available yet. Tick to join the waitlist.</small></div></label>
          </>}
          {step === "free" && <>
            <span className="kit-chip done">Free during testing</span>
            <b className="serif big">We’re not charging while we test.</b>
            <p>Your pack is free. One question first, and please be honest:</p>
            <div className="kit-fq"><b>{"Would you have paid £" + pr + " for it?"}</b><div className="kit-ch col">{["Yes", "Probably", "Only if it were cheaper", "No, I wouldn’t need it"].map((a) => <button type="button" key={a} onClick={() => answer(a)}>{a}</button>)}</div></div>
          </>}
          {step === "got" && <>
            <span className="kit-chip done"><Ic.Check s={12} w={2.4}/> Your pack is ready</span>
            <b className="serif big">Here it is, free.</b>
            <div className="kit-dl">{P.items.map(([t]) => <button type="button" key={t} onClick={() => (onPreview ? onPreview(t) : setToast("In the real product this downloads a PDF."))}><KIc.Doc s={15}/><span>{t}</span><small>PDF</small></button>)}</div>
            <label className="kit-sol"><input type="checkbox" checked={sol} onChange={(e) => wait(e.target.checked)}/><div><b>Add a solicitor check</b><small>Not available yet. Tick to join the waitlist.</small></div></label>
          </>}
          <Proto>No card details are ever taken. The price is this visitor’s test price (£{P.prices.join(" / £")}).</Proto>
        </div>
        {toast && <div className="ms-toast kit-toast" onAnimationEnd={() => setToast("")}>{toast}</div>}
      </section>
    );
  }

  /* AI call with a fixed system prompt; on the site it needs the /api/claude proxy (spec), so it fails quietly there */
  async function ai(system, messages, max) {
    if (!window.claude || !window.claude.complete) throw new Error("offline");
    return window.claude.complete({ system, max_tokens: max || 700, messages });
  }
  const SAFE_RE = /\b(hit|hits|hurt|hurts|scared|afraid|frighten|threat|threaten|kill|suicid|end it|self.?harm|abuse|abusive|violent|violence|unsafe|control(s|ling)? (my|me|the money)|won.t let me|took my phone|tracking|stalk)/i;
  const SafetyCard = () => (
    <div className="kit-safe"><b><Ic.Shield s={15}/> If you’re not safe</b><p>If you’re in danger now, call <b>999</b>. If you can’t speak, call 999 then press 55.</p>
      <div><span><b>National Domestic Abuse Helpline</b> 0808 2000 247 · free, 24 hours</span><span><b>Men’s Advice Line</b> 0808 801 0327</span><span><b>Samaritans</b> 116 123 · any time</span></div></div>
  );

  /* ── guest mode host: the save prompt, the leave warning and the sign-up modal. Rendered once, inside KitTop ── */
  const WHY = {
    save: ["Save your toolkit", "Free, and private to you. Come back any time, on any device."],
    pay: ["Save your toolkit first", "So we can send you your pack, and you can download it again later. Saving is free."],
    invite: ["Save your toolkit first", "So you can come back and see " + (window.KIT ? window.KIT.PERSONA.them : "their") + "’s side when it’s ready. Saving is free."],
    keep: ["Save your toolkit to keep this", "Only the result is kept. Your answers never are."],
    leave: ["Save before you go", "Free, and private to you."],
  };
  function Signup({ reason, onDone, onClose }) {
    const K = window.KIT, [email, setEmail] = useState(""), [pw, setPw] = useState(""), [sent, setSent] = useState(false);
    const style = K.read().signin || "magic", ok = /^\S+@\S+\.\S+$/.test(email) && (style === "magic" || pw.length >= 8), W = WHY[reason] || WHY.save;
    const go = (e) => { e.preventDefault(); if (!ok) return; style === "magic" ? setSent(true) : onDone(); };
    return (
      <Modal onClose={onClose} label={W[0]}>
        {sent ? <div className="kit-su sent"><span className="c"><KIc.Mail s={22}/></span><h2>Check your email</h2><p>We’ve sent a sign-in link to <b>{email}</b>. It works once, for 15 minutes.</p><Proto><button type="button" onClick={onDone}>Open the link <Ic.Arrow s={13}/></button></Proto><button type="button" className="kit-lnk" onClick={() => setSent(false)}>Use a different email</button></div> : (
          <form className="kit-su" onSubmit={go}>
            <h2>{W[0]}</h2><p>{W[1]}</p>
            <ul className="kit-su-p"><li><Ic.Lock s={13}/> Nothing is shared unless you choose</li><li><KIc.Mail s={13}/> Emails only ever say “Decouple”</li><li><KIc.Doc s={13}/> Delete it all, any time</li></ul>
            <label className="kit-su-f"><span>Your email</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoFocus/></label>
            <p className="kit-su-safe"><Ic.Shield s={13}/> Use an email address your partner can’t read.</p>
            {style === "password" && <label className="kit-su-f"><span>Choose a password</span><input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters"/></label>}
            <button type="submit" className="btn lg full" disabled={!ok}>{style === "magic" ? "Email me a sign-in link" : "Save my toolkit"} <Ic.Arrow s={15}/></button>
            <p className="kit-su-fine">Free. No card. By saving you agree to the <a href="privacy.html" target="_blank" rel="noopener">privacy notice</a>.</p>
          </form>
        )}
      </Modal>
    );
  }
  function Guest() {
    const K = window.KIT, [nudge, setNudge] = useState(false), [leave, setLeave] = useState(null), [su, setSu] = useState(null);
    useEffect(() => K.on((e) => { if (e.type === "nudge") setTimeout(() => setNudge(true), 600); if (e.type === "leave") setLeave(() => e.go); if (e.type === "signup") { setNudge(false); setSu({ reason: e.reason, then: e.then }); } }), []);
    const done = () => { const s = su; K.signup(s && s.reason); setSu(null); setNudge(false); s && s.then && s.then(); };
    return <>
      {nudge && !su && !leave && <div className="kit-nudge" role="dialog" aria-label="Save your progress"><button type="button" className="kit-x" aria-label="Close" onClick={() => { setNudge(false); K.log("save-nudge", "Save prompt", "save", "not now", { step: "Save · nudge" }); }}><Ic.X s={14}/></button><b className="serif">Keep what you’ve done?</b><p>Nothing is kept until you save. It’s free, and private to you.</p><div><button type="button" className="btn sm" onClick={() => K.needAcct("save")}>Save my progress</button><button type="button" className="kit-lnk" onClick={() => { setNudge(false); K.log("save-nudge", "Save prompt", "save", "not now", { step: "Save · nudge" }); }}>Not now</button></div></div>}
      {leave && !su && <Modal onClose={() => setLeave(null)} label="Leave without saving?"><h2>Leave without saving?</h2><p>You haven’t saved, so what you’ve done here will be lost.</p><div className="kit-mf col"><button type="button" className="btn lg full" onClick={() => { const g = leave; setLeave(null); K.needAcct("leave", g); }}>Save my progress</button><button type="button" className="btn ghost full" onClick={() => { const g = leave; setLeave(null); K.log("save-leave", "Left without saving", "save", "left", { step: "Save · leave" }); g(); }}>Leave without saving</button><button type="button" className="kit-lnk" onClick={() => setLeave(null)}>Stay here</button></div></Modal>}
      {su && <Signup reason={su.reason} onDone={done} onClose={() => setSu(null)}/>}
    </>;
  }

  Object.assign(window, { KitGuest: Guest, KitSignup: Signup, KIc, KitMark: Mark, KitTop: Top, KitToolIc: ToolIc, KitModal: Modal, KitProto: Proto, KitHead: Head, KitFakeDoor: FakeDoor, KitPay: Pay, KitAI: ai, KitSafeRe: SAFE_RE, KitSafety: SafetyCard });
})();
