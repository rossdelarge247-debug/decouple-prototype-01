/* Prepare — picture layouts (classic paper / visual / case file), review & send, Mark's view, side-by-side */
(function () {
  const { useState, useEffect } = React;
  const Ic = window.DIc, PP = window.PP;

  function totals(pic) {
    const sum = (ids, f) => ids.flatMap((i) => pic.rows[i]).filter(f || (() => true)).reduce((n, r) => n + (r.n || 0), 0);
    return { inc: sum(["income"], (r) => /\/ mo/.test(r.v)), out: sum(["outgoings"], (r) => /\/ mo/.test(r.v)), net: sum(["home", "accounts", "other_assets", "other_prop", "debts"], (r) => !/\/ mo/.test(r.v)) };
  }

  function Head({ N, pic, ro, ss }) {
    const t = totals(pic);
    return (
      <div className="pp-head">
        <div className="pq-k">{ro ? `${N.Me}'s picture · shared with ${N.them}` : ss.share === "private" ? "Your picture · private draft" : "Your picture · shared"}</div>
        <h1>{ro ? <>{`${N.Me}'s `}<em>picture.</em></> : <>Your <em>picture.</em></>}</h1>
        <div className="pp-sum">
          <div><small>Net assets</small><b className="tab">{PP.gbp(t.net)}</b></div>
          <div><small>Income</small><b className="tab">{PP.gbp(t.inc)}<i>/mo</i></b></div>
          <div><small>Outgoings</small><b className="tab">{PP.gbp(t.out)}<i>/mo</i></b></div>
          <div><small>Form E</small><b className="tab">{pic.pct}%</b></div>
        </div>
      </div>
    );
  }

  const ACC = { cur: ["Current account", "4821"], joint: ["Joint account", "7730"], sav: ["Instant saver", "1290"], stmt: ["Uploaded statements", ""] };
  function Connected({ banks, manual, N, act }) {
    const [open, setOpen] = useState(true);
    if (manual) return (
      <div className="pp-conn none"><div className="cn-h"><span className="cn-ic"><Ic.Bank s={13}/></span><b>No bank connected</b></div>
        <p>These figures are what you've entered. Connect a bank and Decouple fills in 12 months of real transactions — and most of your evidence.</p>
        <button className="btn sm v" onClick={() => act.toast("Opens Tink", "Pick your bank in the secure window.")}><Ic.Plus s={11}/>Connect a bank</button></div>
    );
    const list = banks.length ? banks : [{ id: "barclays", name: "Barclays", accounts: 3, list: ["cur", "joint", "sav"] }];
    const n = list.reduce((a, b) => a + (b.list ? b.list.length : b.accounts || 1), 0);
    return (
      <div className="pp-conn">
        <button className="cn-h" aria-expanded={open} onClick={() => setOpen(!open)}><span className="cn-ic"><Ic.Bank s={13}/></span><b>{`${n} bank account${n > 1 ? "s" : ""} connected`}</b><Ic.Down s={13} style={{ marginLeft: "auto", transform: open ? "rotate(180deg)" : "" }}/></button>
        {open && <>
          {list.map((b, i) => (
            <div className="cn-b" key={b.id || i}>
              <div className="cn-bt"><b>{b.name}</b><span>{b.upload ? "Uploaded today" : `This connection lasts for ${[84, 72][i % 2]} days`}</span>
                <button className="cn-x" onClick={() => act.toast(`${b.name} disconnected`, "Its transactions were cleared from your picture.")}>Disconnect &amp; clear</button></div>
              {(b.list || ["cur", "joint", "sav"].slice(0, b.accounts || 1)).map((k) => <div className="cn-a" key={k}><i><Ic.Check s={9} w={3} c="#FFF"/></i><span>{ACC[k][0]}{ACC[k][1] && ` · ••${ACC[k][1]}`}</span><small>{k === "joint" ? `· joint with ${N.them} · 12 months of transactions` : "· 12 months of transactions"}</small></div>)}
            </div>))}
          <div className="cn-f"><button className="btn sm v" onClick={() => act.toast("Opens Tink", "Pick your bank in the secure window.")}><Ic.Plus s={11}/>Connect another bank</button><span>Pulls 12 months of transactions into your picture</span></div>
        </>}
      </div>
    );
  }

  function Paper({ N, pic, act, none, ss, plan, ro, q, setQ, banks, manual }) {
    const [open, setOpen] = useState(() => new Set());
    const complete = (id) => { const st = pic.status.find((x) => x.id === id); return st && st.done && !st.gaps && !st.evOut; };
    const tog = (id) => { const n = new Set(open); n.has(id) ? n.delete(id) : n.add(id); setOpen(n); };
    useEffect(() => { if (act.focus) { goto(act.focus); act.clearFocus(); } }, [act.focus]);
    const goto = (id) => {
      if (id !== "unsorted") { const n = new Set(open); n.add(id); setOpen(n); }
      setTimeout(() => { const el = document.getElementById("sec-" + id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 90, behavior: "smooth" }); }, 30);
    };
    const A = { ...act, goto: (id) => (id === "kids-edit" ? act.editKids() : goto(id)) };
    return (
      <div className={"pp-wrap" + (ro ? " ro" : "")}>
        <div className="pp-main">
          <div className="paper pp-card pp-hcard">
            <span className="ftab">{ro ? "SHARED · READ-ONLY" : ss.share === "private" ? "PRIVATE · ONLY YOU" : "SHARED"}</span>
            <Head N={N} pic={pic} ro={ro} ss={ss}/>
            {!ro && <Connected banks={banks} manual={manual} N={N} act={act}/>}
          </div>
          {!ro && <PPUnsorted pic={pic} act={A}/>}
          <div className="pp-dh"><div><div className="pq-k">Section by section</div><h2>Detailed <em>sections.</em></h2></div><span className="tab">{`${pic.secs.length} sections · ${pic.secDone} answered`}</span></div>
          <div className="pp-secs">{pic.secs.map((s) => <PPSection key={s.id} s={s} pic={pic} act={A} none={none} ro={ro} q={q} setQ={setQ} open={ro ? open.has(s.id) || !complete(s.id) : !complete(s.id) || open.has(s.id)} locked={!ro && !complete(s.id)} toggle={() => tog(s.id)}/>)}</div>
          <div className="pp-foot"><Ic.Lock s={12}/><span>{ro ? `Read-only. Your queries go to ${N.Me} together.` : "Private until you share. Changes save automatically."}</span></div>
        </div>
        {!ro && <aside className="pp-side">
          <PPOutput ss={ss} N={N} pic={pic} act={act} plan={plan}/>
          <PPTodo pic={pic} act={A} N={N} plan={plan}/>
        </aside>}
      </div>
    );
  }

  function Review({ N, pic, mark, onSend, onClose }) {
    const evOut = pic.evAll.filter((e) => e.st !== "up");
    return (
      <div className="mscrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="mbox wide" role="dialog" aria-modal="true" aria-label="Review and send">
          <button className="mx" aria-label="Close" onClick={onClose}><Ic.X s={16}/></button>
          <div className="step-k">REVIEW &amp; SEND</div>
          <h3>{`Share your picture with ${N.them}?`}</h3>
          <p>{`${N.Them} will see every section exactly as it reads here — not your answers to how you're feeling, and not anything in Unsorted.`}</p>
          <div className="perm">{pic.secs.map((s) => <div key={s.id}><Ic.Check s={14} w={2.6} c="#166534" style={{ flexShrink: 0, marginTop: 2 }}/><span>{s.t}<small>{pic.rows[s.id].length ? `${pic.rows[s.id].length} item${pic.rows[s.id].length > 1 ? "s" : ""}` : "None"}</small></span></div>)}</div>
          {evOut.length > 0 && <div className="mwarn" style={{ marginTop: 14 }}><Ic.Help s={14} style={{ flexShrink: 0, marginTop: 2 }}/><span><b>{`${evOut.length} piece${evOut.length > 1 ? "s" : ""} of evidence to follow:`}</b>{` ${evOut.map((e) => e.l).join(", ")}. ${N.Them} will see these marked “to follow”.`}</span></div>}
          {mark !== "joined" && <p style={{ fontSize: 13 }}>{`${N.Them} hasn't joined yet — they'll see it as soon as they do.`}</p>}
          <div className="mrow"><button className="btn lg" onClick={onSend}>{`Send to ${N.them}`} <Ic.Arrow s={15}/></button><button className="lnk" onClick={onClose}>Not yet</button></div>
        </div>
      </div>
    );
  }

  const MARK = {
    children: [["Same children · same ages", "Dependent"], ["Childcare — Bright Horizons", "£600 / mo"]],
    income: [["Salary — Pearson PAYE", "£3,420 / mo"], ["Bonus (annual)", "£4,000"]],
    outgoings: [["Rent — 4 Hill St", "£950 / mo"], ["Household bills", "£280 / mo"], ["Groceries", "£340 / mo"]],
    home: [["12 Oak Road — estimated value", "£340,000"], ["Mortgage outstanding — Nationwide", "−£175,000"]],
    other_prop: [], accounts: [["Current account", "£1,980"], ["Joint account ••7730", "£1,186"]], other_assets: [["Car — estimated value", "£14,000"]],
    pensions: [["Aviva workplace pension", "£86,400 CETV"]], debts: [["Amex", "−£3,200"]],
  };
  function Compare({ N, pic, onBack }) {
    const diff = { home: "Home value: £375k vs £340k", other_assets: `${N.Them}'s car isn't on your picture`, accounts: null };
    const nDiff = Object.values(diff).filter(Boolean).length;
    return (
      <div className="pp-cmp">
        <div className="pp-head"><div className="pq-k">Both pictures</div><h1>Side by <em>side.</em></h1>
          <p className="pq-why">{`${nDiff} differences to talk through. Everything else lines up.`}</p></div>
        <div className="pp-cgrid">
          <div className="pp-ch"><span></span><b>{N.Me}</b><b>{N.Them}</b></div>
          {pic.secs.map((s) => (
            <div className={"pp-crow" + (diff[s.id] ? " diff" : "")} key={s.id}>
              <div className="pp-cs"><b>{s.n}</b>{s.t}{diff[s.id] && <em>{diff[s.id]}</em>}</div>
              <div className="pp-cc">{pic.rows[s.id].length ? pic.rows[s.id].map((r) => <div key={r.key}><span>{r.l}</span><span className="tab">{r.v}</span></div>) : <div className="mute">None</div>}</div>
              <div className="pp-cc">{(MARK[s.id] || []).length ? MARK[s.id].map(([l, v]) => <div key={l}><span>{l}</span><span className="tab">{v}</span></div>) : <div className="mute">None</div>}</div>
            </div>))}
        </div>
        <div className="pp-cta"><div><b>{`Take the ${nDiff} differences to Reconcile.`}</b><span>Decouple lines them up and suggests what evidence settles each one.</span></div><button className="btn lg" onClick={() => window.Journey.goStage("reconcile")}>Go to Reconcile <Ic.Arrow s={15}/></button></div>
        <button className="pq-unsure" onClick={onBack}>Back to your picture</button>
      </div>
    );
  }

  Object.assign(window, { PPPaperView: Paper, PPReview: Review, PPCompare: Compare });
})();
