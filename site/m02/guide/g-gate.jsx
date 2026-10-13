/* M02 · before the interview: the tester-code screen (on the site, while testing is private) and the consent screen */
(function () {
  const { useState, useRef, useEffect } = React;
  const Ic = window.DIc;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function Code({ sid, stage, onDone, onBack, codeError }) {
    const [code, setCode] = useState(""), [err, setErr] = useState(codeError ? "That code isn’t right, or it has expired. Check it and try again." : ""), [busy, setBusy] = useState(false);
    const [email, setEmail] = useState(""), [hp, setHp] = useState(""), [mErr, setMErr] = useState(""), [sent, setSent] = useState(false), [mBusy, setMBusy] = useState(false);
    const host = useRef(null);
    const go = async (e) => {
      e && e.preventDefault(); if (!code.trim() || busy) return; setBusy(true); setErr("");
      const r = await window.DC.redeem(code); setBusy(false);
      if (r.ok) onDone(); else setErr(r.status === 0 ? "We couldn’t check that just now. Check your connection and try again." : "That code isn’t right, or it has expired. Check it and try again.");
    };
    const notify = async (e) => {
      e.preventDefault(); if (mBusy) return;
      if (!EMAIL.test(email.trim())) return setMErr("That doesn’t look like an email address.");
      setMBusy(true); setMErr("");
      const ok = await window.DC.human(host.current);
      const r = ok ? await window.DC.signup({ email: email.trim(), stage: stage || "", source: "guide", sid, hp }) : { ok: false };
      setMBusy(false); if (r.ok) setSent(true); else setMErr("Something went wrong. Please try again.");
    };
    return (
      <div className="gate">
        <div className="iv-kick" style={{ "--c": "#5B21B6" }}>Private testing</div>
        <h2 className="iv-h">This guide is being tested privately.</h2>
        <p className="iv-help">If you’ve been given a tester code, enter it below. If not, leave your email and we’ll let you know when it opens to everyone.</p>
        <form className="gate-card" onSubmit={go}>
          <label className="gate-l" htmlFor="g-code">Tester code</label>
          <div className="gate-row"><input id="g-code" className="gate-in code" autoFocus autoComplete="off" autoCapitalize="characters" spellCheck="false" value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(""); }} placeholder="e.g. BLUE-OAK-42"/><button className="btn lg" type="submit" disabled={!code.trim() || busy}>{busy ? "Checking…" : "Continue"} <Ic.Arrow s={15}/></button></div>
          {err && <div className="gate-err" role="alert">{err}</div>}
        </form>
        <div className="gate-or"><span>No code?</span></div>
        {sent ? <div className="gate-card done"><Ic.Check s={16} w={2.4} c="#166534"/><div><b>Thank you. You’re on the list.</b><p>We’ll email you once, when the guide opens. Nothing in the subject line mentions separation.</p></div></div> : (
          <form className="gate-card" onSubmit={notify} ref={host}>
            <label className="gate-l" htmlFor="g-mail">Tell me when it opens</label>
            <div className="gate-row"><input id="g-mail" className="gate-in" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setMErr(""); }} placeholder="you@example.com"/><button className="btn lg ghost" type="submit" disabled={mBusy}>{mBusy ? "Sending…" : "Notify me"}</button></div>
            <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} name="website"/>
            {mErr && <div className="gate-err" role="alert">{mErr}</div>}
            <p className="gate-fine">We only use your email to tell you when the guide opens. <a href="privacy.html" target="_blank" rel="noopener">Privacy notice</a></p>
          </form>
        )}
        <div className="iv-nav desk" style={{ marginTop: 28 }}><button className="back" onClick={onBack}><Ic.Arrow s={14} style={{ transform: "rotate(180deg)" }}/> Back</button></div>
      </div>
    );
  }

  function Consent({ consent, health, needHuman, onDone, onBack }) {
    const [c, setC] = useState(consent || null), [h, setH] = useState(!!health), [busy, setBusy] = useState(false);
    const host = useRef(null);
    const go = async () => {
      if (!c || busy) return;
      if (c === "yes" && needHuman) { setBusy(true); await window.DC.human(host.current); setBusy(false); }
      onDone(c, c === "yes" && h);
    };
    useEffect(() => { const k = (e) => { if (e.key === "Enter" && !/INPUT|TEXTAREA|BUTTON/.test(e.target.tagName)) go(); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); });
    const Opt = ({ v, t, d }) => (
      <button type="button" role="radio" aria-checked={c === v} className={"gate-opt" + (c === v ? " on" : "")} onClick={() => setC(v)}>
        <span className="rd"><i></i></span><span><b>{t}</b><small>{d}</small></span>
      </button>
    );
    return (
      <div className="gate">
        <div className="iv-kick" style={{ "--c": "#5B21B6" }}>Before you start</div>
        <h2 className="iv-h">Your guide is made on this device.</h2>
        <p className="iv-help">You don’t need an account or your name. Your answers are kept in this browser, so you can come back to your guide.</p>
        <div className="gate-card">
          <div className="gate-t">Will you help us improve the guide?</div>
          <p className="gate-p">We’re building a service to help separating couples. With your permission, your answers are sent to us anonymously, to show us what people need. We never receive your name, your email, or your answers to the safety questions.</p>
          <div className="gate-opts" role="radiogroup" aria-label="Help us improve the guide">
            <Opt v="yes" t="Yes, use my answers anonymously" d="You can still skip any question."/>
            <Opt v="no" t="No thanks, just give me the guide" d="Nothing is sent. The guide is exactly the same."/>
          </div>
          {c === "yes" && (
            <label className="gate-chk">
              <input type="checkbox" checked={h} onChange={(e) => setH(e.target.checked)}/>
              <span><b>Also include how I’m coping, and who I have around me.</b> This counts as health information, so we ask separately. It’s fine to leave this unticked.</span>
            </label>
          )}
          <p className="gate-fine">You can change your mind at any time from your guide. <a href="privacy.html" target="_blank" rel="noopener">Read the privacy notice</a></p>
          <div ref={host}></div>
        </div>
        <div className="iv-nav desk">
          <button className="back" onClick={onBack}><Ic.Arrow s={14} style={{ transform: "rotate(180deg)" }}/> Back</button>
          <button className="btn lg" disabled={!c || busy} onClick={go}>{busy ? "One moment…" : "Start my guide"} <Ic.Arrow s={15}/></button>
          <span className="hint">or press Enter</span>
        </div>
        <div className="mnav"><div className="row"><button className="back" aria-label="Back" onClick={onBack}><Ic.Arrow s={16} style={{ transform: "rotate(180deg)" }}/></button><button className="btn lg" disabled={!c || busy} onClick={go}>Start my guide <Ic.Arrow s={15}/></button></div></div>
      </div>
    );
  }

  /* shown in the full guide: change consent, see the guide ID */
  function Privacy({ consent, health, sid, onChange }) {
    return (
      <div className="gate-priv">
        <div className="kick" style={{ marginBottom: 8 }}><Ic.Lock s={11}/> Your privacy</div>
        <label className="gate-sw"><input type="checkbox" checked={consent === "yes"} onChange={(e) => onChange(e.target.checked ? "yes" : "no", e.target.checked && health)}/><span>Send my answers anonymously to help improve the guide</span></label>
        {consent === "yes" && <label className="gate-sw"><input type="checkbox" checked={!!health} onChange={(e) => onChange("yes", e.target.checked)}/><span>Include how I’m coping (health information)</span></label>}
        <p>Turning this off stops anything more being sent. To delete what’s already been sent, email <a href="mailto:hello@decouple.uk">hello@decouple.uk</a> with your guide ID: <code>{sid}</code></p>
      </div>
    );
  }

  Object.assign(window, { GCode: Code, GConsent: Consent, GPrivacy: Privacy });
})();
