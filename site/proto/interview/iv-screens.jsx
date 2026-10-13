/* Interview — intro, safety question, safety stop, build screens */
(function () {
  const { useState, useEffect } = React;
  const Ic = window.DIc, IV = window.IV, J = window.Journey;

  function Intro({ a, onStart }) {
    const pre = a.__pre || {};
    const carried = [pre.stage && IV.valLabel("stage", a), pre.status && IV.valLabel("status", a)].filter(Boolean);
    const gentle = IV.exploring(a), short = IV.agreed(a);
    return (
      <div className="iv-center">
        <div className="kick">The free interview · {short ? "about 3 minutes" : "about 5 minutes"}</div>
        <h1 className="iv-hero-h">{gentle ? <>Just exploring<br/><span className="em">is completely fine.</span></> : <>Tell us what's happening.<br/><span className="em">We'll show you a way through.</span></>}</h1>
        <p className="iv-hero-p">{gentle ? "A few gentle questions, nothing that commits you to anything. At the end you'll see what separating could look like for you — so you can decide in your own time."
          : short ? "You've done the hard part. A few quick questions so we can check what you've agreed is fair and get it written up properly."
          : "A few gentle questions about your situation. At the end you'll get an honest read on where you stand, a likely settlement range and a plan — before you decide anything, and before you pay a penny."}</p>
        {carried.length > 0 && (
          <div className="carry"><div className="h"><Ic.Help s={14} c="#92400E"/> You've already told us {carried.length === 2 ? "two things" : "one thing"} — we'll ask you to confirm.</div><div className="chips">{carried.map((c) => <span key={c}>{c}</span>)}</div></div>
        )}
        <div style={{ marginTop: 32 }}><button className="btn lg" onClick={onStart}>Begin — it's free <Ic.Arrow s={16}/></button></div>
        <div className="iv-meta"><span><Ic.Lock s={12}/> Private & encrypted</span><span><Ic.Shield s={12}/> No account needed</span><span><Ic.X s={12}/> Quick exit at any time</span></div>
      </div>
    );
  }

  function SafeQ({ a, set }) {
    const opts = [["safe", "I feel safe and in control", "#166534", Ic.Check], ["worried", "I have some worries about safety", "#A16207", Ic.Shield], ["unsafe", "I don't feel safe right now", "#B91C1C", Ic.Help]];
    return (
      <div className="qb">
        <div className="oc">{opts.map(([k, l, c, I]) => (
          <button key={k} className={"ocard" + (a.safe === k ? " on" : "")} style={{ "--c": c }} onClick={() => set("safe", k)}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: c + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I s={16} w={2.2} c={c}/></span>
            <div className="l">{l}</div><span className="r">{a.safe === k && <Ic.Check s={11} w={3} c="#FFF"/>}</span>
          </button>))}</div>
        <div className="help-box"><Ic.Help s={17} style={{ flexShrink: 0, marginTop: 1 }}/><div><b>You're not alone.</b> If you're in immediate danger, call 999. For confidential support, the National Domestic Abuse Helpline is free, 24 hours, on 0808 2000 247.<div style={{ marginTop: 6, color: "#B91C1C", fontWeight: 600 }}>The "Quick exit" button leaves this site instantly.</div></div></div>
      </div>
    );
  }

  function Stop({ onBack }) {
    useEffect(() => { J.set("interview", { answers: null, outcome: "safety_stop" }); }, []);
    return (
      <div className="stop-card">
        <div className="lead">
          <div className="safe-ic" style={{ background: "#FEF2F2" }}><Ic.Shield s={22} c="#B91C1C"/></div>
          <div className="kick" style={{ color: "#B91C1C" }}>Your safety comes first</div>
          <h2 className="iv-h" style={{ marginTop: 12 }}>We can't offer you a joint route right now.</h2>
          <p className="iv-help" style={{ maxWidth: 560 }}>Decouple works by sharing information with your partner. From what you've told us, that might not be safe — so we won't start that process. There are people who can help you separate safely, and some of it is free.</p>
          <div className="lines">
            <div className="line urgent"><div><div className="n">In immediate danger</div><div className="d">Police, ambulance</div></div><span className="tel">999</span></div>
            <div className="line"><div><div className="n">National Domestic Abuse Helpline</div><div className="d">Free, confidential, 24 hours</div></div><span className="tel">0808 2000 247</span></div>
            <div className="line"><div><div className="n">Men's Advice Line</div><div className="d">For men experiencing abuse</div></div><span className="tel">0808 801 0327</span></div>
          </div>
        </div>
        <div className="kick" style={{ margin: "28px 0 0 4px", color: "#78716C" }}>What you can still do</div>
        <div className="still">
          <a href="https://www.gov.uk/check-legal-aid" target="_blank" rel="noopener">Check for legal aid<span>Free legal help is often available where there's abuse.</span></a>
          <a href="https://solicitors.lawsociety.org.uk" target="_blank" rel="noopener">Find a family solicitor<span>Look for specialists in domestic abuse.</span></a>
          <a href="https://www.gov.uk/injunction-domestic-violence" target="_blank" rel="noopener">Protective court orders<span>How to apply for a non-molestation order.</span></a>
        </div>
        <div style={{ marginTop: 22, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <button className="iv-nav back" style={{ all: "unset", cursor: "pointer", fontSize: 13, color: "#57534E", textDecoration: "underline", textUnderlineOffset: 3 }} onClick={onBack}>I answered by mistake — go back</button>
          <span style={{ fontSize: 12.5, color: "#78716C" }}>Your answers aren't stored once you leave this page.</span>
        </div>
      </div>
    );
  }

  function Build({ a }) {
    const items = ["Your situation and legal routes", a.kids === "with" ? "Children's arrangements" : "The home and what's fair", "Your likely settlement range", "A step-by-step path for you both", "The things worth watching"];
    const [n, setN] = useState(0);
    useEffect(() => { if (n < items.length) { const t = setTimeout(() => setN(n + 1), 650); return () => clearTimeout(t); } }, [n]);
    const done = n >= items.length;
    useEffect(() => { if (done) J.set("interview", { complete: true, outcome: "complete" }); }, [done]);
    return (
      <div className="build">
        <div className="kick">{done ? "Your first read is ready" : "Building your picture"}</div>
        <h2 className="iv-hero-h" style={{ fontSize: 44 }}>{done ? <>Here's where<br/><span className="em">you stand.</span></> : <>Putting it<br/><span className="em">together…</span></>}</h2>
        <p className="iv-hero-p">We're turning your answers into an honest first read — a likely range, a path, and what to watch.</p>
        <div className="build-list">{items.map((t, i) => <div key={t} className={i < n ? "done" : i === n ? "now" : ""}><span className="d">{i < n && <Ic.Check s={11} w={3} c="#FFF"/>}</span>{t}</div>)}</div>
        <div style={{ marginTop: 28, minHeight: 52 }}>{done && <button className="btn lg" onClick={() => J.goStage("playback")}>See my first read <Ic.Arrow s={16}/></button>}</div>
      </div>
    );
  }

  Object.assign(window, { IVIntro: Intro, IVSafeQ: SafeQ, IVStop: Stop, IVBuild: Build });
})();
