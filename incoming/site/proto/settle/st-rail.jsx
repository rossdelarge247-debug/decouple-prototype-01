/* Settle — right rail: running split, court reasonableness, Mark's likely response, fallback positions, mediator review, sign-off */
(function () {
  const Ic = window.DIc, ST = window.ST;
  const Av = (p) => <window.RCAv {...p}/>;

  const MED = {
    draft: "£150 for a one-hour review of your draft before it goes. They flag anything that's likely to stall.",
    reply: (O) => `£150 for a one-hour review of ${O}'s counter before you reply. They suggest where there's room to meet.`,
    agree: "£150 for a one-hour read of the agreement before you both sign. They flag anything a court is likely to question.",
  };
  function Mediator({ act, k = "draft", O }) {
    const p = typeof MED[k] === "function" ? MED[k](O) : MED[k];
    return <div className="rc-card rc-med"><div className="pq-k"><Ic.Help s={11}/>Want a second pair of eyes?</div><div className="rc-stt">{k === "agree" ? "Before you sign." : "Mediator review."}</div><p className="rc-p">{p}</p><button className="btn sm ghost" onClick={act.mediator}>Book a review</button></div>;
  }

  function Rail({ page, S, N, draft, setPick, lastA, lastB, resp, setResp, act, agreed, locked, sign, ver, rev, custom = {}, finalN }) {
    const O = N.Them, R = (r) => ST.R[r];
    if (page === "ver" && ver) return <div className="rc-ov"><div className="rc-card"><div className="pq-k" style={{ color: ver.by === "a" ? "#5B21B6" : "#0369A1" }}>{`v${ver.n} · ${ver.by === "a" ? "as you sent it" : `as ${O} sent it`}`}</div><window.STSplit sp={ST.split(S, ver.picks)} N={N} label="How the pot would have landed"/><p className="rc-p">A read-only record. It can't be edited or re-sent.</p><button className="btn sm ghost" onClick={() => act.back()}>Back to overview</button></div></div>;
    if (page === "agree") { const st = agreed ? S.filter((s) => { const o = ST.opt(s, agreed[s.id]); return o && o.r === "stretch"; }) : [];
      return <div className="rc-ov"><div className="rc-card st-signc"><div className="pq-k" style={{ color: "#047857" }}><Ic.Lock s={11}/>Sign the agreement</div><div className="rc-stt">{locked ? "Signed by you both." : "Both of you sign."}</div>
        <p className="rc-p">{locked ? "This version is locked. Finalise turns it into a consent order and the forms the court needs." : "Signing is a formal step. It locks this version for you both and sends it to Finalise."}</p>
        {st.length > 0 && !locked && <div className="st-fl"><em style={{ color: R("stretch")[1], background: R("stretch")[2] }}>A stretch</em><span><b>{`${st.length} section${st.length > 1 ? "s" : ""} may be questioned`}</b>{st.map((s) => s.t).join(", ")} — see the notes in the document.</span></div>}
        <div className="st-sgr">{[["a", N.Me], ["b", O]].map(([k, nm]) => <div key={k} className={"st-sg" + (sign[k] ? " on" : "")}><Av w={k} N={N} size={22}/><span><b>{nm}</b><small>{sign[k] ? `Signed · ${sign[k + "d"] || "today"}` : k === "a" ? "Not signed" : `Waiting for ${O}`}</small></span>{sign[k] ? <span className="ok"><Ic.Check s={11} w={3} c="#FFF"/></span> : k === "a" ? <button className="btn sm" onClick={act.openSign}>Sign</button> : null}</div>)}</div>
        {sign.a && !sign.b && <button className="proto-mini" onClick={() => act.sign("b", true, { bg: { kind: "type", txt: O, font: "f1" }, bd: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) })}>{`Simulate ${O} signing`}</button>}
        {rev && <div className="st-rev sm"><span className="spin"></span><span><b>{`Waiting for ${O} to confirm the reversal`}</b></span><button className="proto-mini" onClick={act.revConfirm}>{`Simulate ${O} confirming`}</button><button className="lnk" onClick={act.revCancel}>Cancel request</button></div>}
        {locked && !rev && <button className="btn rc-next" onClick={() => window.Journey.goStage("finalise")}>Go to Finalise<Ic.Arrow s={13}/></button>}</div>{agreed && <window.STAdvisor S={S} N={N} picks={agreed} custom={custom}/>}{agreed && <window.STDownload S={S} N={N} picks={agreed} custom={custom} finalN={finalN} sign={sign}/>}{!locked && <Mediator act={act} k="agree"/>}</div>; }
    if (page === "reply" && lastB) {
      const ch = S.filter((s) => lastB.picks[s.id] !== lastA.picks[s.id]), sp = ST.split(S, lastB.picks);
      return <div className="rc-ov">
        <div className="rc-card"><div className="pq-k" style={{ color: "#0369A1" }}>{`If you accept v${lastB.n} as written`}</div><window.STSplit sp={sp} N={N} label={`${O}'s version`}/><p className="rc-p">{`Your share moves by ${ST.split(S, lastA.picks).pa - sp.pa} points from v${lastA.n}.`}</p></div>
        <div className="rc-card"><div className="pq-k" style={{ color: "#5B21B6" }}><Ic.Spark s={11}/>Reasonableness check</div><div className="rc-stt">{`${ch.length} change${ch.length !== 1 ? "s" : ""} from ${O}.`}</div>
          {ch.map((s) => { const o = ST.opt(s, lastB.picks[s.id]); return <div key={s.id} className="st-fl"><em style={{ color: R(o.r)[1], background: R(o.r)[2] }}>{R(o.r)[0]}</em><span><b>{s.t}</b>{o.rw}</span></div>; })}</div>
        <div className="rc-card"><div className="pq-k" style={{ color: "#5B21B6" }}><Ic.Spark s={11}/>Fallback positions</div><div className="rc-stt">Suggested middle ground.</div>
          {ch.map((s) => { const m = ST.fallback(s.id, lastB.picks[s.id]), o = ST.opt(s, m), same = m === lastB.picks[s.id]; if (!o) return null; return <div key={s.id} className="st-fb"><b>{s.t}</b><span>{o.t}</span><button className="btn sm" onClick={() => setResp(s.id, same ? { k: "accept" } : { k: "counter", v: m })}>{same ? `Accept ${O}'s` : `Use as my v${lastB.n + 1}`}<Ic.Arrow s={11}/></button></div>; })}</div>
        <Mediator act={act} k="reply" O={O}/>
      </div>;
    }
    const sp = ST.split(S, draft), pr = S.map((s) => [s, ST.predict(s.id, draft[s.id])]), yes = pr.filter(([, p]) => p[0] === "yes").length;
    const stretch = S.filter((s) => { const o = ST.opt(s, draft[s.id]); return o && o.r === "stretch"; });
    const ro = !!lastA && (!lastB || lastB.n < lastA.n);
    return <div className="rc-ov">
      <div className="rc-card"><div className="pq-k" style={{ color: "#5B21B6" }}>If your offer is accepted as written</div><window.STSplit sp={sp} N={N} label="How the pot would land"/></div>
      <div className="rc-card"><div className="pq-k" style={{ color: "#5B21B6" }}><Ic.Spark s={11}/>Court reasonableness</div>
        <div className="rc-stt">{stretch.length ? `${stretch.length} position${stretch.length > 1 ? "s" : ""} may not hold.` : sp.pa >= 45 && sp.pa <= 62 ? "Within the usual range." : "Outside the usual range."}</div>
        <p className="rc-p">{`A ${sp.pa}/${100 - sp.pa} split with the children living mainly with ${N.Me} sits ${sp.pa >= 50 && sp.pa <= 62 ? "inside" : "outside"} the 50–62% band courts usually approve for a main carer.`}</p>
        {stretch.map((s) => <div key={s.id} className="st-fl"><em style={{ color: R("stretch")[1], background: R("stretch")[2] }}>A stretch</em><span><b>{s.t}</b>{ST.opt(s, draft[s.id]).rw}</span></div>)}</div>
      {!ro && pr.some(([s, p]) => p[0] === "no" && draft[s.id] && ST.opt(s, ST.fallback(s.id, draft[s.id]))) && <div className="rc-card"><div className="pq-k" style={{ color: "#5B21B6" }}><Ic.Spark s={11}/>Fallback positions</div><div className="rc-stt">Get to yes faster.</div>
        <p className="rc-p">{`Positions ${O} is likely to accept, without giving up more than you need to.`}</p>{pr.filter(([s, p]) => p[0] === "no" && draft[s.id] && ST.opt(s, ST.fallback(s.id, draft[s.id]))).map(([s]) => { const o = ST.opt(s, ST.fallback(s.id, draft[s.id])); return <div key={s.id} className="st-fb"><b>{s.t}</b><span>{o.t}</span><button className="btn sm" onClick={() => setPick(s.id, o.id)}>Use as my position<Ic.Arrow s={11}/></button></div>; })}</div>}
      <Mediator act={act}/>
    </div>;
  }

  Object.assign(window, { STRail: Rail });
})();
