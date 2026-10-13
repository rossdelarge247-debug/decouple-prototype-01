/* Sign-up — plan, pay, account (magic link), done (receipt + invite), sign-in (welcome back) */
(function () {
  const { useState, useEffect, useRef } = React;
  const Ic = window.DIc, J = window.Journey;
  const TIERS = [
    { k: "picture", name: "Your picture", total: 99, solo: true, sub: "Your evidence and numbers — all your ducks in a row",
      feats: ["Your first read, saved", "Connect accounts for exact figures", "Evidence checklist and secure uploads", "A Form E–style financial statement, ready for mediation", "Private until you choose to share"] },
    { k: "guided", name: "Guided settlement", total: 499, sub: "Takes the place of mediation", best: true,
      feats: ["Everything in Your picture", "Invite {them} and reconcile", "Model a fair split with reasonableness checks", "Plain-English guidance — no mediator needed", "Children and housing arrangements"] },
    { k: "complete", name: "Complete & filed", total: 999, sub: "We take it all the way to court",
      feats: ["Everything in Guided settlement", "Court-ready Consent Order, Form A, D81 and pension annex", "Pre-flight checks on every document", "Priority human support"], addon: "Filing by our partner solicitor +£199" },
  ];
  const tierOf = (k) => TIERS.find((t) => t.k === (k === "free" ? "picture" : k)) || TIERS[1];
  const due = (t, mode) => (t.solo || mode !== "split" ? t.total : t.total / 2);
  const names = () => { const a = (J.get().interview || {}).answers || {}; return { me: (a.name_me || "").trim(), them: (a.name_them || "").trim() || "your partner", Them: (a.name_them || "").trim() || "Your partner" }; };
  const fmt = (n) => "£" + (n % 1 ? n.toFixed(2) : n.toLocaleString("en-GB"));

  function Steps({ list, cur }) {
    const i = list.indexOf(cur);
    return <div className="su-steps" aria-label="Progress">{list.map((s, k) => <React.Fragment key={s}>{k > 0 && <b></b>}<span className={k === i ? "on" : k < i ? "done" : ""}><i>{k < i ? <Ic.Check s={10} w={3} c="#FFF"/> : k + 1}</i>{s}</span></React.Fragment>)}</div>;
  }

  function Plan({ st, set, onNext }) {
    const N = names(), t = tierOf(st.tier), mode = st.payMode;
    const price = (x) => x.solo ? [fmt(x.total), "just for you"] : mode === "split" ? [fmt(x.total / 2), `each · ${fmt(x.total)} total`] : [fmt(x.total), "one fee, covers you both"];
    const cta = `Continue with ${t.name}`;
    return (
      <>
        <div className="su-center">
          <div className="kick">Choose how far you'd like to go</div>
          <h1 className="su-h">{N.me ? N.me + ", one" : "One"} fair price. <span className="em">Split between you.</span></h1>
          <p className="su-p">No hourly billing. Start with your own picture, and upgrade when you're ready to settle — you'll only pay the difference.</p>
          <div style={{ marginTop: 22 }}><div className="seg" role="radiogroup" aria-label="Who pays">
            <button className={mode === "one" ? "on" : ""} onClick={() => set({ payMode: "one" })}>Pay in full up front</button>
            <button className={mode === "split" ? "on" : ""} onClick={() => set({ payMode: "split" })}>We'll split it</button>
          </div></div>
          {mode === "split" && <p className="split-note"><Ic.Help s={13}/> {N.Them} will pay their half when they sign up. Nothing is unlocked for them until then.</p>}
        </div>
        <div className="tiers">{TIERS.map((x) => { const [p, ps] = price(x), sel = st.tier === x.k; return (
          <button key={x.k} className={"tier" + (x.best ? " best" : "") + (sel ? " sel" : "")} role="radio" aria-checked={sel} onClick={() => set({ tier: x.k })}>
            {x.best && <div className="ribbon"><Ic.Star s={11} c="#FFF"/> MOST CHOSEN · JUST RIGHT</div>}
            <div className="in"><div className="nm">{x.name}<span className="radio">{sel && <Ic.Check s={11} w={3} c="#FFF"/>}</span></div><div className="sb">{x.sub}</div>
              <div className="pr"><b>{p}</b><span>{ps}</span></div>{x.addon && <div className="addon">{x.addon}</div>}
              <ul>{x.feats.map((f, i) => <li key={f} className={i === 0 && x.k !== "picture" ? "inh" : ""}><span className="ck"><Ic.Check s={11} w={2.6} c={x.best ? "#5B21B6" : "#166534"}/></span>{f.replace("{them}", N.them)}</li>)}</ul></div>
          </button>); })}</div>
        <div className="su-plan-cta"><button className="btn lg" onClick={onNext}>{cta} <Ic.Arrow s={15}/></button><p>14-day money-back guarantee · Court fees paid separately to HMCTS</p></div>
        <div className="su-mcta"><button className="btn lg full" onClick={onNext}>{cta} <Ic.Arrow s={15}/></button></div>
      </>
    );
  }

  function Pay({ st, set, onPaid, onBack }) {
    const N = names(), t = tierOf(st.tier), amt = due(t, st.payMode);
    const [email, setEmail] = useState(st.email || (J.get().interview || {}).email || "");
    const [c, setC] = useState({ num: "", exp: "", cvc: "", name: "", pc: "" });
    const [err, setErr] = useState({}), [busy, setBusy] = useState(false);
    const fmtNum = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    const fmtExp = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };
    const validEmail = /^\S+@\S+\.\S+$/.test(email);
    const pay = (express) => {
      const e = {};
      if (!validEmail) e.email = "We need an email for your receipt and sign-in link";
      if (!express) {
        if (c.num.replace(/\s/g, "").length < 16) e.num = "Check the card number";
        if (!/^(0[1-9]|1[0-2])\/\d\d$/.test(c.exp)) e.exp = "MM/YY";
        if (c.cvc.length < 3) e.cvc = "3 digits";
        if (!c.name.trim()) e.name = "Name on the card";
        if (c.pc.trim().length < 5) e.pc = "Postcode";
      }
      setErr(e); if (Object.keys(e).length) return;
      setBusy(express || "card");
      setTimeout(() => { set({ email, paid: true, amount: amt, ref: "DCPL-" + Math.random().toString(36).slice(2, 8).toUpperCase(), method: express || "Card ending " + c.num.slice(-4) }); onPaid(); }, 1400);
    };
    const F = ({ k, label, ph, full, fx, mode = "text", max }) => (
      <label className={"field" + (full ? " full" : "")} style={{ marginTop: 0 }}>{label}
        <input className={err[k] ? "bad" : ""} inputMode={mode} value={c[k]} placeholder={ph} maxLength={max} onChange={(e) => setC({ ...c, [k]: fx ? fx(e.target.value) : e.target.value })}/>{err[k] && <span className="err">{err[k]}</span>}</label>);
    return (
      <div className="su-two">
        <div>
          {!t.solo && <div className="box">
            <h3>Who's paying?</h3><p className="sub">You can change this until {N.them} joins.</p>
            <div className="payopt">
              <button className={st.payMode === "one" ? "on" : ""} onClick={() => set({ payMode: "one" })}><div><div className="l">Pay in full up front</div><div className="s">{N.Them} joins at no cost</div></div><span className="amt">{fmt(t.total)}</span></button>
              <button className={st.payMode === "split" ? "on" : ""} onClick={() => set({ payMode: "split" })}><div><div className="l">We'll split it</div><div className="s">You pay half now; {N.them} pays their half when they sign up</div></div><span className="amt">{fmt(t.total / 2)}</span></button>
            </div>
          </div>}
          <div className="box">
            <h3>Your email</h3><p className="sub">For your receipt, and the link to sign in. No password needed.</p>
            <label className="field" style={{ marginTop: 0 }}><input type="email" className={err.email ? "bad" : ""} value={email} placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)}/>{err.email && <span className="err">{err.email}</span>}</label>
            <div className="mwarn"><Ic.Shield s={14} style={{ flexShrink: 0, marginTop: 2 }}/><span>Use a private email address — one {N.them} can't see or get into.</span></div>
          </div>
          <div className="box">
            <h3>Payment</h3><p className="sub">Encrypted and processed securely. We never see your full card number.</p>
            <div className="express">
              <button className="xbtn" disabled={!!busy} onClick={() => pay("Apple Pay")}>{busy === "Apple Pay" ? <span className="spin"></span> : "Apple Pay"}</button>
              <button className="xbtn g" disabled={!!busy} onClick={() => pay("Google Pay")}>{busy === "Google Pay" ? <span className="spin" style={{ borderColor: "#D6D3CC", borderTopColor: "#1A1A1A" }}></span> : "Google Pay"}</button>
            </div>
            <div className="or">or pay by card</div>
            <div className="cgrid">
              {F({ k: "num", label: "Card number", ph: "1234 5678 9012 3456", full: true, fx: fmtNum, mode: "numeric" })}
              {F({ k: "exp", label: "Expiry", ph: "MM/YY", fx: fmtExp, mode: "numeric" })}
              {F({ k: "cvc", label: "Security code", ph: "123", fx: (v) => v.replace(/\D/g, "").slice(0, 4), mode: "numeric" })}
              {F({ k: "name", label: "Name on card", ph: "S Jones" })}
              {F({ k: "pc", label: "Postcode", ph: "SW1A 1AA", max: 8 })}
            </div>
            <button className="testfill" onClick={() => { setC({ num: "4242 4242 4242 4242", exp: "12/28", cvc: "123", name: N.me ? N.me + " Jones" : "S Jones", pc: "BS1 4DJ" }); if (!validEmail) setEmail("sarah.private@example.com"); }}>Prototype · fill test card</button>
            <button className="btn lg full paybtn" disabled={!!busy} onClick={() => pay(null)}>{busy === "card" ? <><span className="spin"></span> Processing…</> : <><span>{`Pay ${fmt(amt)}`}</span><Ic.Lock s={14}/></>}</button>
          </div>
          <button className="link" style={{ marginTop: 18 }} onClick={onBack}>← Change plan</button>
        </div>
        <aside>
          <div className="box summary">
            <h3>Order summary</h3><p className="sub">{t.name}</p>
            <div className="row"><span>{t.solo ? "Plan for you" : "Plan for you both"}</span><b>{fmt(t.total)}</b></div>
            {!t.solo && st.payMode === "split" && <div className="row"><span>{N.Them} pays later</span><b>−{fmt(t.total / 2)}</b></div>}
            <div className="row tot"><span>Due today</span><b>{fmt(amt)}</b></div>
            <div className="stmt"><Ic.Help s={14}/><span>Shows on your statement as <b>DCPL SERVICES</b> — no mention of Decouple or separation.</span></div>
            <div className="reass"><span><Ic.Check s={13} w={2.2} c="#166534"/> 14-day money-back guarantee</span><span><Ic.Check s={13} w={2.2} c="#166534"/> Upgrade later, pay only the difference</span><span><Ic.Help s={13} c="#78716C"/> Court fee paid separately to HMCTS</span></div>
          </div>
        </aside>
      </div>
    );
  }

  /* magic-link: enter → sent → (prototype) open link */
  function Magic({ st, set, title, sub, cta, onSignedIn, signin }) {
    const [email, setEmail] = useState(st.email || (J.get().interview || {}).email || "");
    const [sent, setSent] = useState(false), [err, setErr] = useState(""), [cool, setCool] = useState(0);
    useEffect(() => { if (cool > 0) { const x = setTimeout(() => setCool(cool - 1), 1000); return () => clearTimeout(x); } }, [cool]);
    const send = () => { if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("That doesn't look like an email address"); set({ email }); setSent(true); setCool(30); };
    if (!sent) return (
      <div className="narrow su-center">
        <div className="mail-ill"><Ic.Lock s={26} c="#5B21B6"/></div>
        <h1 className="su-h" style={{ fontSize: 36 }}>{title}</h1>
        <p className="su-p">{sub}</p>
        <div className="box" style={{ marginTop: 24, textAlign: "left" }}>
          <label className="field" style={{ marginTop: 0 }}>Email address<input type="email" autoFocus value={email} placeholder="you@example.com" onChange={(e) => { setEmail(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && send()}/>{err && <span className="err">{err}</span>}</label>
          {!signin && <div className="mwarn"><Ic.Shield s={14} style={{ flexShrink: 0, marginTop: 2 }}/><span>Use a private email address — one {names().them} can't see.</span></div>}
          <button className="btn lg full" style={{ marginTop: 16 }} onClick={send}>{cta} <Ic.Arrow s={15}/></button>
          <p style={{ fontSize: 12, color: "#78716C", margin: "12px 0 0", textAlign: "center" }}>No password. We'll email you a link that signs you in.</p>
        </div>
      </div>
    );
    return (
      <div className="narrow su-center">
        <div className="mail-ill"><Ic.Check s={26} w={2.4} c="#5B21B6"/></div>
        <div className="kick">Magic link sent</div>
        <h1 className="su-h" style={{ fontSize: 36 }}>Check your inbox.</h1>
        <div className="sent-box">We've sent a sign-in link to <b>{email}</b>. It works once and expires in 15 minutes. The subject line is <b>"Your Decouple link"</b>.</div>
        <div className="sent-acts">
          <button className="protolink" onClick={() => { set({ signedIn: true }); onSignedIn(); }}>Prototype · open the link from the email →</button>
          <div className="row"><button disabled={cool > 0} onClick={() => setCool(30)}>{cool > 0 ? `Resend in ${cool}s` : "Resend link"}</button><button onClick={() => setSent(false)}>Use a different email</button></div>
        </div>
      </div>
    );
  }

  function Done({ st, set }) {
    const N = names(), t = tierOf(st.tier);
    const [pe, setPe] = useState(st.partnerEmail || ""), [err, setErr] = useState(""), [inv, setInv] = useState(!!st.invited);
    const send = () => { if (!/^\S+@\S+\.\S+$/.test(pe)) return setErr("Check the email address"); if (pe === st.email) return setErr("That's your own email"); set({ partnerEmail: pe, invited: true }); setInv(true); };
    const paid = true, solo = !!t.solo;
    return (
      <div className="su-two" style={{ marginTop: 8 }}>
        <div>
          <div className="kick">{paid ? "Payment received" : "You're in"}</div>
          <h1 className="su-h">{N.me ? `Welcome, ${N.me}.` : "Welcome."} <span className="em">Let's get you started.</span></h1>
          <p className="su-p">{solo ? "Your picture is active. Next, a 90-second tour — then connect a bank and start gathering your evidence." : "Your plan is active. Next, a 90-second tour of how the four phases work."}</p>
          {!solo && (
            <div className="box" style={{ marginTop: 24 }}>
              <h3>Give {N.them} a heads-up <span style={{ fontSize: 12, color: "#78716C", fontFamily: "Inter", fontWeight: 500 }}>· optional</span></h3>
              <p className="sub">They'll get a short, neutral email now. They only see your picture once you choose to share it{!solo && st.payMode === "split" ? `, and they pay their half (${fmt(t.total / 2)}) when they accept` : ""}.</p>
              {!inv ? <>
                <label className="field" style={{ marginTop: 0 }}><span>{`${N.Them}'s email`}</span><input type="email" value={pe} placeholder="their@email.com" onChange={(e) => { setPe(e.target.value); setErr(""); }}/>{err && <span className="err">{err}</span>}</label>
                <div className="inv-prev"><div className="fr">PREVIEW · from Decouple · subject: {N.me || "Your ex-partner"} has started using Decouple</div>Hi {N.them === "your partner" ? "there" : N.them}, <b>{N.me || "your ex-partner"}</b> has started sorting out your separation on Decouple — a calm, shared workspace for agreeing finances and arrangements. Nothing is shared with you yet. When {N.me || "they"} share{N.me ? "s" : ""} their picture, you'll get a link to join.</div>
                <div style={{ marginTop: 16, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}><button className="btn" onClick={send}>Send heads-up <Ic.Arrow s={14}/></button><span style={{ fontSize: 12.5, color: "#78716C" }}>Or skip — you can invite when you share.</span></div>
              </> : <div className="stmt" style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}><Ic.Check s={14} w={2.4} c="#166534"/><span>Heads-up sent to <b style={{ fontFamily: "Inter" }}>{pe}</b>. We'll tell you when {N.them} opens it.</span></div>}
            </div>
          )}
          <div style={{ marginTop: 24 }}><button className="btn lg" onClick={() => J.goStage("onboard")}>Start the welcome tour <Ic.Arrow s={15}/></button></div>
        </div>
        <aside>
          {paid ? (
            <div className="receipt">
              <div className="top"><div className="kick" style={{ color: "#166534" }}>Receipt</div><b>{fmt(st.amount || due(t, st.payMode))}</b><div style={{ fontSize: 12.5, color: "#57534E", marginTop: 2 }}>{t.name}{!solo && st.payMode === "split" ? " · your half" : ""}</div></div>
              <div className="in summary">
                <div className="row"><span>Reference</span><b>{st.ref}</b></div>
                <div className="row"><span>Paid with</span><b>{st.method}</b></div>
                <div className="row"><span>On your statement</span><b style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>DCPL SERVICES</b></div>
                <div className="row"><span>Emailed to</span><b style={{ fontSize: 12.5 }}>{st.email}</b></div>
                {!solo && st.payMode === "split" && <div className="row"><span>{N.Them}'s half</span><b>{fmt(t.total / 2)} · on joining</b></div>}
              </div>
            </div>
          ) : (
            <div className="box"><h3>Your picture · Free</h3><p className="sub" style={{ margin: 0 }}>Upgrade any time from your dashboard — you'll only pay the difference.</p></div>
          )}
        </aside>
      </div>
    );
  }

  function WelcomeBack({ st }) {
    const s = J.get(), iv = s.interview || {}, a = iv.answers || {};
    const N = names();
    let range = null; try { if (a.status && window.PB) { const r = window.PB.compute(a, (s.playback || {}).whatif || {}); range = `${r.lo}–${r.hi}% range`; } } catch (e) {}
    const items = [
      ["Free interview", iv.complete ? "Done" : a.status ? "Part-way" : "Not started", !!iv.complete, "interview"],
      ["Your first read", range || "Waiting on the interview", !!iv.complete, "playback"],
      ["Plan", st.paid ? tierOf(st.tier).name : "Not chosen", !!st.paid, "signup"],
      ["Welcome tour", (s.onboard || {}).done ? "Done" : "Next up", !!(s.onboard || {}).done, "onboard"],
    ];
    const nx = items.find((x) => !x[2]) || items[items.length - 1];
    return (
      <div className="narrow su-center">
        <div className="kick">Signed in</div>
        <h1 className="su-h" style={{ fontSize: 38 }}>Welcome back{N.me ? ", " + N.me : ""}.</h1>
        <p className="su-p">Here's where you left off.</p>
        <div className="resume">{items.map(([t, v, done, id]) => <div key={t} className={nx[0] === t ? "nx" : ""}><span className={"d" + (done ? " ok" : "")}>{done ? <Ic.Check s={11} w={3} c="#166534"/> : nx[0] === t ? <Ic.Arrow s={11} c="#FFF"/> : null}</span>{t}<small>{v}</small></div>)}</div>
        <div style={{ marginTop: 22 }}><button className="btn lg" onClick={() => nx[3] === "signup" ? (location.hash = "#plan") : J.goStage(nx[3])}><span>{`Resume · ${nx[0]}`}</span><Ic.Arrow s={15}/></button></div>
      </div>
    );
  }

  Object.assign(window, { SUSteps: Steps, SUPlan: Plan, SUPay: Pay, SUMagic: Magic, SUDone: Done, SUWelcomeBack: WelcomeBack, SUtierOf: tierOf });
})();
