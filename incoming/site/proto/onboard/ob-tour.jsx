/* Onboard — first-time welcome carousel (restored from the original welcome tour) */
(function () {
  const { useState, useEffect } = React;
  const Ic = window.DIc;
  const COPY = {
    prepare: { t: "Prepare your picture.", sub: "Ditch the bank statements, spreadsheets and Word docs.", body: "Connect your accounts once — Decouple reads twelve months of history, sorts every transaction and assembles your private financial picture in the background. Read-only. Bank-grade encryption." },
    reconcile: { t: "Share your position.", sub: "Reconcile your shared household quickly — with minimal conflict.", body: "Invite {them} to build their picture alongside yours. Decouple lines the two up, surfaces differences side by side, and walks you through each one in plain language." },
    settle: { t: "Build your proposal.", sub: "Negotiate with legal checks and reasonableness flags.", body: "Model splits in real time. Every proposal is checked against how a court would likely see it, and every clause comes with a plain-English translation. You stay in control." },
    finalise: { t: "Finalise your agreement.", sub: "Court-ready documents in minutes, not months.", body: "Once you're both aligned, Decouple drafts your Consent Order, Form D81 and supporting bundle — and files them digitally with HMCTS." },
  };
  const inPlan = (k, plan) => k === "prepare" || (k === "finalise" ? plan === "complete" : plan !== "picture");
  const note = (k, plan) => {
    if (k === "prepare" && plan === "picture") return ["Your plan", "Ends with your Form E–style statement, ready for mediation."];
    if (k === "reconcile" && plan !== "picture") return ["Your plan", "This is where Decouple takes the place of mediation."];
    if (!inPlan(k, plan)) return ["Not in your plan", k === "finalise" ? "Add it any time with Complete & filed." : "Add it any time with Guided settlement — you'll only pay the difference."];
    return ["Your plan", "Included."];
  };

  function Tour({ N, plan, onDone }) {
    const PH = window.HWPhases.slice(1), CARDS = window.HWCards;
    const [i, setI] = useState(0);
    const last = PH.length;
    const go = (n) => setI(Math.max(0, Math.min(last, n)));
    useEffect(() => {
      const k = (e) => { if (e.key === "ArrowRight" || e.key === "Enter") { i === last ? onDone() : go(i + 1); } if (e.key === "ArrowLeft") go(i - 1); if (e.key === "Escape") onDone(); };
      addEventListener("keydown", k); return () => removeEventListener("keydown", k);
    }, [i]);
    const p = PH[i - 1], C = p && COPY[p.k], Card = p && CARDS[p.k], nt = p && note(p.k, plan);
    return (
      <div className="tour" data-screen-label={"Onboard · tour · " + (p ? p.rail : "intro")}>
        <button className="tour-skip" onClick={onDone}>Skip tour <Ic.X s={12}/></button>
        <div className="tour-stage" key={i}>
          {i === 0 ? (
            <div className="tour-intro">
              <div className="kick">{N.hasMe ? `Welcome, ${N.Me}` : "Welcome"}</div>
              <h1 className="tour-h1">Four phases to a<br/><span className="em">decoupled</span> life.</h1>
              <p className="tour-p">No paper. No spreadsheets. No back-and-forth over email. A single, focused workspace that takes you from the facts to court-ready documents — calmly, and in the right order.</p>
              <div className="tour-acts"><button className="btn lg" onClick={() => go(1)}>Take the tour <Ic.Arrow s={15}/></button><button className="tour-alt" onClick={onDone}>Skip to dashboard</button></div>
              <div className="iv-meta"><span><Ic.Lock s={12}/> Bank-grade encryption</span><span><Ic.Shield s={12}/> Read-only access</span><span>Takes about 90 seconds</span></div>
            </div>
          ) : (
            <div className="tour-phase" style={{ "--c": p.c, "--soft2": p.soft }}>
              <div>
                <div className="hw-kick"><span className="kick">{p.kick}</span><hr/><span className="w">{`step ${i} / ${last}`}</span></div>
                <div className="hw-num">{p.n}</div>
                <h2 className="tour-h2">{C.t}</h2>
                <p className="hw-sub">{C.sub}</p>
                <p className="hw-body">{C.body.replace("{them}", N.them)}</p>
                <div className={"tour-note" + (inPlan(p.k, plan) ? "" : " out")}>{inPlan(p.k, plan) ? <Ic.Check s={13} w={2.6}/> : <Ic.Lock s={12}/>}<span><b>{nt[0]}</b>{` · ${nt[1]}`}</span></div>
              </div>
              <div className="tour-card"><Card p={p}/></div>
            </div>
          )}
        </div>
        {i > 0 && (
          <div className="tour-nav">
            <button className="tour-alt" onClick={() => go(i - 1)}><Ic.Arrow s={14} style={{ transform: "rotate(180deg)" }}/> Back</button>
            <button className="btn lg" onClick={() => (i === last ? onDone() : go(i + 1))}>{i === last ? "Enter your dashboard" : "Next"} <Ic.Arrow s={15}/></button>
          </div>
        )}
        <div className="tour-rail-wrap">
          <nav className="hw-rail" aria-label="Tour steps">
            <button className={i === 0 ? "on" : "past"} onClick={() => go(0)}><span className="d">{i > 0 ? <Ic.Check s={10} w={3} c="#FFF"/> : "·"}</span>Intro</button>
            <span className="sep"></span>
            {PH.map((x, k) => <button key={x.k} className={i === k + 1 ? "on" : i > k + 1 ? "past" : ""} onClick={() => go(k + 1)}><span className="d">{i > k + 1 ? <Ic.Check s={10} w={3} c="#FFF"/> : k + 1}</span>{x.rail}</button>)}
            <span className="sep"></span>
            <button onClick={onDone}>Finish <Ic.Arrow s={11}/></button>
          </nav>
        </div>
      </div>
    );
  }
  Object.assign(window, { OBTour: Tour });
})();
