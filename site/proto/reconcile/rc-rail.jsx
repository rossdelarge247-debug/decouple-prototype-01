/* Prepare · pictures — right rail: review progress, query inbox, the gate to Our household, sign-off */
(function () {
  const Ic = window.DIc, RC = window.RC, ot = RC.ot;
  const Av = (p) => <window.RCAv {...p}/>;

  function QItem({ l, v, N, onOpen, act }) {
    const o = ot(v), O = o === "a" ? N.Me : N.Them, nx = RC.nextUp(l), last = RC.latest(l), mt = nx === v, ch = RC.chased(l);
    const stale = !mt && !ch && last && RC.rank(last.ago) >= 2;
    return <div className={"rc-qi" + (mt ? " me" : "") + (stale ? " stale" : "")}>
      <button className="main" onClick={() => onOpen(l.id)}><b>{l.l}</b>{last && <span className="q"><Av w={last.w} N={N} size={16}/><span>{last.file ? `Uploaded ${last.file}` : last.t}</span></span>}
        <small>{mt ? (l.pending && l.pending.type === "new" ? `${O} proposed ${RC.fmt(l, l.pending.value)}` : `${O} replied${last && last.ago ? " " + last.ago : ""}`) : `You replied${last && last.ago ? " " + last.ago : ""}`}</small></button>
      {!mt && (ch ? <span className="chased"><Ic.Check s={10} w={3}/>Chased</span> : <button className={"lnk" + (stale ? " st" : "")} onClick={() => act.resolve(l.id, "nudge")}>Chase</button>)}
    </div>;
  }

  function Gate({ L, v, N, onHouse }) {
    const o = ot(v), O = o === "a" ? N.Me : N.Them, me = RC.progress(L, v), th = RC.progress(L, o), both = me.done && th.done;
    const row = (p, lbl) => <div className={"rc-gr" + (p.done ? " ok" : "")}><span className="k">{p.done && <Ic.Check s={10} w={3} c="#FFF"/>}</span><span><b>{lbl}</b><small>{p.done ? "Done" : `${p.total - p.acc} to reconcile`}</small></span></div>;
    return <div className={"rc-card rc-gate" + (both ? " open" : "")}>
      <div className="pq-k" style={{ color: both ? "#047857" : "#9D174D" }}>{both ? <Ic.Check s={11} w={2.8}/> : <Ic.Lock s={11}/>}Our household</div>
      {row(me, `You accept ${O}'s picture`)}{row(th, `${O} accepts yours`)}
      <p className="rc-p">{both ? "You've both accepted each other's pictures. Your side-by-side household is ready." : me.done ? `You're done. Waiting for ${O} to finish reviewing yours.` : th.done ? `${O} has accepted your picture. Finish reviewing theirs to unlock the household.` : "Unlocks when you've each accepted the other's picture."}</p>
      {both && <button className="btn rc-next" onClick={onHouse}>Open our household<Ic.Arrow s={13}/></button>}
    </div>;
  }

  function Rail({ page, L, v, N, act, onOpen, onHouse, sign, plan, sol, third, setThird }) {
    const o = ot(v), O = o === "a" ? N.Me : N.Them;
    if (page === "house" && !(RC.progress(L, v).done && RC.progress(L, o).done)) return <div className="rc-ov"><div className="rc-card"><div className="pq-k"><Ic.Lock s={11}/>Sign off</div><p className="rc-p">Signing opens once you've both accepted each other's pictures.</p></div></div>;
    if (page === "house") {
      return <div className="rc-ov">
        <div className="rc-card"><div className="pq-k">Sign off</div><div className="rc-stt">Agree the household picture.</div>
          <p className="rc-p">When you both sign, it locks as version 1 and you move on to proposals.</p>
          {[["a", N.Me], ["b", N.Them]].map(([k, nm]) => <label key={k} className={"rc-sign" + (sign[k] ? " on" : "") + (k !== v ? " other" : "")}><input type="checkbox" disabled={k !== v} checked={!!sign[k]} onChange={(e) => act.sign(k, e.target.checked)}/><span>{k === v ? "I agree this household picture" : `${nm} agrees`}<small>{sign[k] ? "Signed today" : k === v ? "Tick to sign" : "Not yet"}</small></span></label>)}
          {sign[v] && !sign[o] && <button className="proto-mini" onClick={() => act.sign(o, true)}>{`Simulate ${O} signing`}</button>}
          {plan === "complete" && <div className="rc-sol"><b>Solicitor check</b><span>{sol === "done" ? "Done — no issues found." : sol === "req" ? "In review · usually 2 working days" : "Included in Complete & filed."}</span>{!sol && <button className="btn sm ghost" onClick={act.sol}>Request a check</button>}{sol === "req" && <button className="proto-mini" onClick={act.solDone}>Simulate review done</button>}</div>}
        </div>
        <div className="rc-card"><div className="pq-k"><Ic.Shield s={11}/>Share with a professional</div>
          <label className="rc-tog"><input type="checkbox" checked={third} onChange={(e) => setThird(e.target.checked)}/><span>Preview as a mediator sees it<small>Figures and outcomes only — no messages</small></span></label>
          <div className="rc-btns"><button className="btn sm ghost" onClick={act.mediator}>Invite a mediator</button><button className="btn sm ghost" onClick={act.formE}>Form E draft<Ic.Down s={12}/></button></div></div>
      </div>;
    }
    const theirs = page === "theirs";
    const items = L.filter((l) => (l.open && (theirs ? (l.owner === o || (l.owner === "j" && l.q === v)) : (l.owner === v || (l.owner === "j" && l.q !== v)))) || (theirs && l.owner && (l.owner === o || l.owner === "j") && !l.done && !l.acc[v] && !l.open));
    const imp = (l) => { const g = RC.gap(l); if (g == null) { const x = l[o] != null ? l[o] : l[v]; return x != null ? Math.abs(x) * (l.per === "/ mo" ? 12 : 1) : 0; } return g * (l.per === "/ mo" ? 12 : 1); };
    const ranked = items.slice().sort((x, y) => imp(y) - imp(x)), total = ranked.reduce((n, l) => n + imp(l), 0), top = ranked[0];
    const tip = (l) => {
      const g = RC.gap(l), monthly = l.per === "/ mo", nx = RC.nextUp(l);
      const what = g != null ? `${RC.gbp(g)}${monthly ? " a month" : ""} apart` : l.waitDoc && !l.got ? `Needs ${RC.lc(l.waitDoc)}` : l[v] == null ? "Not on your picture" : "Different view";
      const effect = !g ? null : ["home", "accounts", "other_assets", "pensions", "debts"].includes(l.sec) ? `Moves net assets by ${RC.gbp(g)} — about ${RC.gbp(g / 2)} each.` : monthly ? `${RC.gbp(g * 12)} a year — it shapes maintenance and affordability in Settle.` : null;
      const ai = v === "a" && l.ai ? l.ai.h : l.waitDoc && !l.got ? "Evidence will settle this — there's nothing to negotiate until it arrives." : g != null && g < 2500 ? "Small next to the whole picture. Worth closing quickly rather than debating." : "Ask for evidence before conceding — it usually decides lines like this.";
      return { what, effect, ai, nx };
    };
    return <div className="rc-ov">
      <div className="rc-card rc-ins">
        <div className="pq-k" style={{ color: "#5B21B6" }}><Ic.Spark s={11}/>Decouple insight</div>
        {top ? <><div className="rc-stt">{ranked.length === 1 ? "One item left." : `Start with ${top.l.replace(/ — .*/, "")}.`}</div>
          <p className="rc-p">{total > 0 && imp(top) / total > 0.5 ? `It's ${Math.round((imp(top) / total) * 100)}% of the value still in question. The other ${ranked.length - 1} together are worth ${RC.gbp(total - imp(top))}.` : `${ranked.length} items, worth ${RC.gbp(total)} between them. None dominates, so clear the quick ones first.`}</p></>
          : <><div className="rc-stt">Nothing left to reconcile.</div><p className="rc-p">{theirs ? `Every line on ${O}'s picture is accepted.` : `${O} has no open questions on your picture.`}</p></>}
        <small className="rc-fine">A guide, not legal advice.</small>
      </div>
      {ranked.map((l) => { const t = tip(l); return <button key={l.id} className={"rc-card rc-it" + (t.nx === v ? " me" : "")} onClick={() => onOpen(l.id)}>
        <span className="h"><b>{l.l}</b><em>{t.nx === v ? "Response needed" : t.nx ? `With ${O}` : "To review"}</em></span>
        <span className="w tab">{t.what}</span>
        {t.effect && <span className="e">{t.effect}</span>}
        <span className="a"><Ic.Spark s={11}/>{t.ai}</span>
      </button>; })}
      <Gate L={L} v={v} N={N} onHouse={onHouse}/>
    </div>;
  }

  Object.assign(window, { RCRail: Rail, RCGate: Gate });
})();
