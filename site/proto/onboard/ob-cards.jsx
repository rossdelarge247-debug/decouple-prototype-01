/* Onboard — dashboard parts */
(function () {
  const { useState, useEffect, useLayoutEffect } = React;
  const Ic = window.DIc, J = window.Journey;

  const PHASES = [
    { id: "onboard", n: 1, t: "Getting started", s: "Onboard", inc: () => true },
    { id: "prepare", n: 2, t: "Household picture", s: "Prepare", inc: () => true },
    { id: "settle", n: 3, t: "Proposals", s: "Settle", inc: (p) => p !== "picture" },
    { id: "finalise", n: 4, t: "Finalise", s: "Court documents & filing", inc: (p) => p === "complete" },
  ];
  const lockNote = (ph, plan) => {
    if (ph.inc(plan)) return null;
    if (ph.id === "finalise") return ["Not in your plan", "Upgrade to Complete & filed"];
    return ["Not in your plan", "Upgrade to Guided settlement"];
  };
  const DASH = { id: "dashboard", n: 0, t: "Dashboard", s: "To-dos, reminders & guides", inc: () => true };
  const dashOn = () => { const x = J.get(); return !!(x.prepare || x.reconcile || x.settle || x.finalise || (x.dash && x.dash.on)); };
  const after = { prepare: "After getting started", settle: "After your household picture", finalise: "After agreement" };
  /* Default Prepare groups when a page only supplies "Your picture" items (Prepare 06) */
  function PrepTail({ plan }) {
    const them = (window.PB && J.get().interview && window.PB.names(J.get().interview.answers || {}).them) || "Mark";
    const T = them.charAt(0).toUpperCase() + them.slice(1);
    return <>{plan !== "picture" && <button className="ph-grp" onClick={() => J.goStage("reconcile", "#theirs")}><span className="gt"><span className="k"></span>{`${T}'s picture`}</span><small>When they share</small></button>}
      {plan !== "picture" && <button className="ph-grp soft" onClick={() => J.goStage("reconcile", "#house")}><span className="gt"><span className="k lk"><Ic.Lock s={8}/></span>Our household</span><small>Locked</small></button>}</>;
  }
  function PrepHead({ plan }) {
    return plan !== "picture" ? <button className="ph-grp" onClick={() => J.goStage("reconcile", "#hub")}><span className="gt"><span className="k pt"></span>Overview</span><small></small></button> : null;
  }

  function Rail({ plan, pct, active = "onboard", sub, full, util = true, reach: rp, onPhase }) {
    if (active === "reconcile") active = "prepare";
    const dash = active === "dashboard" || (active !== "onboard" && dashOn());
    const L = dash ? [DASH, ...PHASES.slice(1)] : PHASES;
    const ai = L.findIndex((p) => p.id === active);
    const vt = (J.get().vault || {}), vb = vt.bad || 0;
    const x0 = J.get(), reach = rp != null ? rp : x0.finalise ? 3 : x0.settle && (x0.settle.rounds || []).length ? 2 : x0.prepare || x0.reconcile ? 1 : 0, onDash = active === "dashboard";
    return (
      <nav className="ob-rail" aria-label="Navigation" data-tip="rail">
        <div className="h">Navigation</div>
        {L.map((ph, i) => { const ln = lockNote(ph, plan), on = i === ai, dn = ph.id !== "dashboard" && (onDash ? i < reach : ai >= 0 && i < ai && !(dash && i === 0)), cur = onDash && i === reach && i > 0; return (
          <React.Fragment key={ph.id}>
            <div className={"ph" + (on ? " on" : "") + (dn ? " dn" : "") + (ln ? " locked" : "") + (!on && !ln ? " go" : "")} role={!on && !ln ? "link" : undefined} tabIndex={!on && !ln ? 0 : undefined} onClick={!on && !ln ? () => (onPhase && onDash && i <= reach ? onPhase(i) : J.goStage(ph.id)) : undefined} onKeyDown={!on && !ln ? (e) => e.key === "Enter" && (onPhase && onDash && i <= reach ? onPhase(i) : J.goStage(ph.id)) : undefined}>
              <span className={"n" + (ph.id === "dashboard" ? " hm" : "")}>{ph.id === "dashboard" ? <Ic.Home s={12} w={2}/> : dn ? <Ic.Check s={11} w={3}/> : ph.n}</span>
              <div><div className="t">{ph.t}</div><div className="s">{ph.id === "prepare" ? (plan === "picture" ? "Prepare · leads to your Form E" : "Prepare · yours, theirs, together") : ph.s}</div>
                {!on && !dn && !ln && !cur && after[ph.id] && <div className="lk"><Ic.Lock s={10}/>{after[ph.id]}</div>}{cur && <div className="lk now">You're here</div>}
                {ln && <><div className="lk"><Ic.Lock s={10}/>{ln[0]}</div><button className="up" onClick={() => J.goStage("signup", "#plan")}>{ln[1]} →</button></>}
              </div>
            </div>
            {on && ph.id === "prepare" && sub && !full && <><PrepHead plan={plan}/><div className="ph-grp on"><span className="gt"><span className="k pt"></span>Your picture</span></div>{sub}<PrepTail plan={plan}/></>}
            {on && (ph.id !== "prepare" || !sub || full) && (sub || <div className="ph-sub"><div>Checklist <i><b style={{ width: pct + "%" }}></b></i></div></div>)}
          </React.Fragment>); })}
        {util && dash && <div className="rail-util"><button onClick={() => J.goStage("dashboard", "#vault")}><span className="ri"><svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14M8 11h4"/></svg></span>Evidence vault{vb > 0 ? <em className="bad">{`${vb} to renew`}</em> : vt.n ? <small>{vt.n}</small> : null}</button><button onClick={() => J.goStage("dashboard", "#guides")}><span className="ri"><svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M4 4h5a2 2 0 0 1 2 2v10a2 2 0 0 0-2-2H4zM16 4h-5a2 2 0 0 0-2 2v10a2 2 0 0 1 2-2h5z"/></svg></span>Guides</button></div>}
        <button className="rail-foot" onClick={() => J.goStage("dashboard", "#account-help")}><Ic.Help s={13}/> Get support</button>
      </nav>
    );
  }

  function Top({ N, onExit, children }) {
    const [o, setO] = useState(false), ref = React.useRef(null), x = J.get(), su = x.signup || {};
    const me = (N && N.Me) || "Sarah", full = su.name || (me === "Sarah" ? "Sarah Mitchell" : me), mail = su.email || `${me.toLowerCase()}.mitchell@example.com`;
    useEffect(() => { if (!o) return; const f = (e) => { if (ref.current && !ref.current.contains(e.target)) setO(false); }, k = (e) => e.key === "Escape" && setO(false); addEventListener("mousedown", f); addEventListener("keydown", k); return () => { removeEventListener("mousedown", f); removeEventListener("keydown", k); }; }, [o]);
    const go = (h) => { setO(false); if (document.documentElement.dataset.stage === "dashboard") location.hash = h; else J.goStage("dashboard", h); };
    const home = dashOn() && document.documentElement.dataset.stage !== "onboard";
    return <header className="ob-top">
      {home ? <span className="wm wm-b" role="link" tabIndex={0} onClick={() => go("#hub")} onKeyDown={(e) => e.key === "Enter" && go("#hub")} aria-label="Decouple · dashboard">Decouple<i>.</i></span> : <span className="wm" style={{ cursor: "default" }}>Decouple<i>.</i></span>}
      <div className="r">{children}<button className="pillbtn exit" onClick={onExit}><Ic.X s={12} c="#B91C1C"/> Quick exit</button>
        <div className="acct" ref={ref}><button className="avatar acct-b" aria-haspopup="menu" aria-expanded={o} aria-label="Your account" onClick={() => setO(!o)}>{me[0].toUpperCase()}</button>
          {o && <div className="acct-m" role="menu"><div className="hd"><span className="avatar">{me[0].toUpperCase()}</span><div><b>{full}</b><small>{mail}</small></div></div>
            {[["#account", "Account settings"], ["#account-plan", "Plan & billing"], ["#account-notify", "Notifications"], ["#account-privacy", "Quick exit & privacy"], ["#account-help", "Help & support"]].map(([h, l]) => <button key={h} role="menuitem" onClick={() => go(h)}>{l}</button>)}
            <hr/><button role="menuitem" onClick={() => { setO(false); onExit && onExit(); }}>Sign out</button></div>}
        </div></div>
    </header>;
  }

  function PhaseStrip({ plan }) {
    return <div className="pstrip">{PHASES.map((ph, i) => <div key={ph.id} className={i === 0 ? "on" : lockNote(ph, plan) ? "lock" : ""}><span className="n">{lockNote(ph, plan) ? <Ic.Lock s={9}/> : ph.n}</span><span className="t">{ph.s.split(" ·")[0]}</span></div>)}</div>;
  }

  /* AI question card */
  function aiQuestions(a, N, banks) {
    if (banks.length) {
      const b = banks.find((x) => !x.upload) || banks[0], bc = b.color, bn = b.name;
      return [
        { amt: "£2,847.00", src: `${bn} · 25 Sep`, bc, q: "Is this your salary?", why: "Regular monthly credit from NHS Pensions Agency.", opts: ["Yes", "No", "Edit"] },
        { amt: "£1,842.00", src: `${bn} · 1 Oct`, bc, q: "Is this the mortgage on the family home?", why: "Monthly payment to Halifax Mortgages.", opts: ["Yes", "No", "It's another property"] },
        { amt: "£400.00", src: `${bn} · monthly`, bc, q: "Is this ISA in your name only?", why: "Standing order to Vanguard.", opts: ["Just mine", "Joint", "Not sure"] },
        a.kids === "with" && { amt: "£650.00", src: `${bn} · 3 Oct`, bc, q: "Is this childcare for the children?", why: "Monthly payment to Little Acorns.", opts: ["Yes", "No"] },
        { amt: "£95.00", src: `${bn} · 12 Oct`, bc, q: `Is this money you sent to ${N.them}?`, why: "Transfer to an account in their name.", opts: ["Yes", "No", "Edit"] },
        { amt: "£312.40", src: `${bn} · 14 Oct`, bc, q: "Is this credit card in your name?", why: "Payment to American Express.", opts: ["Mine", "Joint", "Theirs"] },
      ].filter(Boolean);
    }
    const out = [];
    const home = { own_together: "you own your home together", own_me: "the home is in your name", own_them: `the home is in ${N.them}'s name`, rent: "you rent" }[a.home];
    if (home) out.push({ q: `You said ${home}. Is that still right?`, why: "From your interview.", opts: ["Yes", "It's changed"] });
    if (a.kids_live) out.push({ q: { me: "You said the children live mostly with you. Still the case?", them: `You said the children live mostly with ${N.them}. Still the case?`, shared: "You said the children's time is roughly shared. Still the case?", unsettled: "Have the children's living arrangements settled yet?" }[a.kids_live], why: "From your interview.", opts: ["Yes", "It's changed", "Not yet"] });
    if (a.pen_them === "__skip" || !a.pen_them) out.push({ q: `You weren't sure about ${N.them}'s pensions. Do you know who the provider is?`, why: "We'll help you request a valuation (CETV).", opts: ["Yes, I'll add it", "No idea"] });
    if (a.debt_names === "joint" || a.debt_names === "mixed") out.push({ q: "You mentioned joint debts. Are any payments behind right now?", why: "Arrears can affect both of you.", opts: ["No", "Some are", "Not sure"] });
    if (a.work === "self") out.push({ q: "Do you have your last two years' accounts to hand?", why: "Self-employed income needs proof.", opts: ["Yes", "Not yet"] });
    out.push({ q: "Do you have a recent payslip or P60 to hand?", why: "You'll need three payslips for your statement.", opts: ["Yes", "Not yet"] });
    return out;
  }
  function AICard({ a, N, banks, onBank }) {
    const qs = aiQuestions(a, N, banks);
    const key = banks.length ? "bank" : "setup";
    const st = (J.get().onboard || {}).ai || {};
    const [i, setI] = useState(st[key] || 0);
    useEffect(() => { setI(((J.get().onboard || {}).ai || {})[key] || 0); }, [key]);
    const next = () => { const n = i + 1; setI(n); J.set("onboard", { ai: { ...((J.get().onboard || {}).ai || {}), [key]: n } }); };
    const q = qs[i];
    return (
      <div className="ai" data-tip="ai">
        <div className="ai-top"><span className="ai-k"><Ic.Spark s={13}/>{banks.length ? "From your bank" : "Quick check-in"}</span>{q && <span className="ai-n">{i + 1} of {qs.length}</span>}</div>
        {q ? (
          <div className="ai-q" key={key + i}>
            {q.amt && <><div className="ai-amt">{q.amt}</div><span className="ai-src"><i style={{ background: q.bc }}>{q.src[0]}</i>{q.src}</span></>}
            <div className="ai-t">{q.q}</div>
            <div className="ai-why">{q.why}</div>
            <div className="ai-acts">{q.opts.map((o, k) => <button key={o} className={"btn" + (k ? " ghost" : "")} onClick={next}>{o}</button>)}<button className="later" onClick={next}>Ask me later</button></div>
          </div>
        ) : (
          <div className="ai-done"><span className="avatar" style={{ background: "#D1FAE5", color: "#166534" }}><Ic.Check s={16} w={2.6}/></span><span>All caught up. {banks.length ? "We'll ask again as new transactions come in." : "Connect a bank and we'll start sorting your transactions."}</span></div>
        )}
        {!banks.length && <div className="ai-mode"><Ic.Bank s={14}/>These questions come from your interview. Once a bank is connected, we'll ask about real transactions.<button className="link" style={{ fontSize: 12.5, paddingBottom: 2 }} onClick={onBank}>Connect a bank</button></div>}
      </div>
    );
  }

  function Todo({ a, N }) {
    const done = (J.get().onboard || {}).todo || {};
    const [d, setD] = useState(done);
    const tog = (k) => { const n = { ...d, [k]: !d[k] }; setD(n); J.set("onboard", { todo: n }); };
    const owned = /^own/.test(a.home || "");
    const out = [
      a.status !== "cohab" && a.stage !== "filed" && ["divorce", "Apply for your divorce", "On GOV.UK · a court fee applies"],
      ["cetv", "Request pension valuations (CETVs)", "From each provider · can take 3 months"],
      owned && ["vals", "Get 3 estate agent valuations", "Free from most local agents"],
    ].filter(Boolean);
    const inn = [["payslips", "Upload your last 3 payslips"], owned && ["title", "Confirm the property title"], ["budget", "Add your monthly budget"]].filter(Boolean);
    const Row = ([k, l, s]) => <button key={k} className={"td" + (d[k] ? " done" : "")} onClick={() => tog(k)} aria-pressed={!!d[k]}><span className="b">{d[k] && <Ic.Check s={10} w={3} c="#FFF"/>}</span><span>{l}{s && <small>{s}</small>}</span></button>;
    return (
      <div className="scard" data-tip="todo">
        <div className="h"><b>To do</b><span>{Object.values(d).filter(Boolean).length}/{out.length + inn.length}</span></div>
        <div className="gl">Outside Decouple</div>{out.map(Row)}
        <div className="gl">In Decouple</div>{inn.map(Row)}
      </div>
    );
  }

  function Evidence({ a, banks, plan, ev, setEv }) {
    const bank = banks.length > 0;
    const items = [
      ["bank", "12 months of bank statements", bank ? `From ${banks.map((b) => b.name).join(", ")}` : "Connect a bank or upload", bank],
      ["pay", "Last 3 payslips and your P60", null],
      ["cetv", "Pension valuations (CETVs)", "One for each pension"],
      /^own/.test(a.home || "") && ["mort", "Latest mortgage statement", null],
      /^own/.test(a.home || "") && ["val", "Property valuation", "Three agent valuations"],
      ["cards", "Credit card and loan statements", bank ? "Partly from your bank" : null],
      a.work === "self" && ["tax", "Last 2 years' tax returns", "SA302s or accounts"],
    ].filter(Boolean);
    const isOk = (it) => it[3] || ev[it[0]];
    const n = items.filter(isOk).length, pct = Math.round((n / items.length) * 100);
    return (
      <div className={"scard" + (plan === "picture" ? " upsell" : "")} data-tip="evidence">
        <div className="h"><b>Evidence for your Form E</b><span>{n}/{items.length}</span></div>
        {items.map((it) => (
          <div key={it[0]} className={"ev" + (isOk(it) ? " ok" : "")}>
            <span className="s">{isOk(it) ? <Ic.Check s={10} w={3} c="#166534"/> : <i style={{ width: 5, height: 5, borderRadius: 9, background: "#CFC9C0" }}></i>}</span>
            <div className="tx">{it[1]}{(ev[it[0]] || it[2]) && <small>{ev[it[0]] || it[2]}</small>}</div>
            {!isOk(it) && <button onClick={() => setEv({ ...ev, [it[0]]: it[0] === "cetv" ? "Requested · 2 providers" : "1 file uploaded" })}>{it[0] === "cetv" ? "Request" : "Upload"}</button>}
          </div>))}
        <div className="fe-bar"><b>{plan === "picture" ? "Your Form E–style statement" : "Your financial statement"}</b> · {pct}% ready{pct < 100 ? " — finish in Prepare" : ""}<div className="bar"><i style={{ width: pct + "%" }}></i></div></div>
      </div>
    );
  }

  /* inline tips */
  const TIPS = [
    ["rail", "Your journey", "Five phases, in order. You'll unlock each as you go — anything outside your plan shows an upgrade link."],
    ["checklist", "Getting started", "A handful of first steps. Do them in any order; skip what doesn't apply."],
    ["ai", "Quick questions", "We ask one thing at a time. Answer, or 'Ask me later' — nothing's final."],
    ["evidence", "Evidence", "Everything a Form E asks for, ticked off as you gather it."],
  ];
  function Tips({ onDone }) {
    const [i, setI] = useState(0), [box, setBox] = useState(null);
    useLayoutEffect(() => {
      const el = document.querySelector(`[data-tip="${TIPS[i][0]}"]`);
      if (!el) return;
      const r0 = el.getBoundingClientRect();
      if (r0.top < 70 || r0.bottom > innerHeight) window.scrollTo({ top: Math.max(0, r0.top + scrollY - 90) });
      const t = setTimeout(() => { const r = el.getBoundingClientRect(); setBox({ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: Math.min(r.height, innerHeight - 140) }); }, 60);
      return () => clearTimeout(t);
    }, [i]);
    if (!box) return null;
    const right = box.x + box.w + 320 < innerWidth;
    const tx = right ? box.x + box.w + 16 : Math.max(16, Math.min(box.x, innerWidth - 316));
    const ty = right ? box.y : box.y + box.h + 14;
    return (
      <>
        <div className="tip-ring" style={{ left: box.x - 4, top: box.y - 4, width: box.w + 8, height: box.h + 8 }}></div>
        <div className="tip" style={{ left: tx, top: ty }} role="dialog" aria-label="Tip">
          <div className="k">TIP {i + 1} OF {TIPS.length}</div><h4>{TIPS[i][1]}</h4><p>{TIPS[i][2]}</p>
          <div className="acts"><button className="sk" onClick={onDone}>Skip tips</button><button onClick={() => (i < TIPS.length - 1 ? setI(i + 1) : onDone())}>{i < TIPS.length - 1 ? "Next" : "Got it"}</button></div>
        </div>
      </>
    );
  }

  function Modal({ label, onClose, children, wide }) {
    useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);
    return <div className="mscrim" onClick={(e) => e.target === e.currentTarget && onClose()}><div className={"mbox" + (wide ? " wide" : "")} role="dialog" aria-modal="true" aria-label={label}><button className="mx" aria-label="Close" onClick={onClose}><Ic.X s={16}/></button>{children}</div></div>;
  }

  function HomePensions({ a, N, onSave, onClose }) {
    const s = (J.get().onboard || {}).assets || {};
    const [v, setV] = useState({ home: s.home || "", mort: s.mort || "", p1: s.p1 || "", p1v: s.p1v || "", p2: s.p2 || "" });
    const owned = /^own/.test(a.home || "");
    const F = (k, l, ph, num) => <label className="field" style={{ marginTop: 12 }}><span>{l}</span><input inputMode={num ? "numeric" : "text"} value={v[k]} placeholder={ph} onChange={(e) => setV({ ...v, [k]: num ? e.target.value.replace(/[^\d,£]/g, "") : e.target.value })}/></label>;
    return (
      <Modal label="Add the home and pensions" onClose={onClose}>
        <div className="kick">Add the home and pensions</div>
        <h3>The two biggest things, roughly.</h3>
        <p>Best guesses are fine — you'll firm them up with evidence in Prepare.</p>
        {owned && <>{F("home", "What's the home worth?", "£ e.g. 650,000", true)}{F("mort", "What's left on the mortgage?", "£ e.g. 180,000", true)}</>}
        {F("p1", "Your pension provider", "e.g. NHS Pension Scheme")}
        {F("p1v", "Its approximate value", "£ — or leave blank", true)}
        {F("p2", `${N.Them}'s pension provider, if you know it`, "e.g. Aviva")}
        <div className="mrow"><button className="btn lg" onClick={() => { J.set("onboard", { assets: v }); onSave(); }}>Save <Ic.Check s={14} w={2.4}/></button><button className="lnk" onClick={onClose}>I'll do this later</button></div>
      </Modal>
    );
  }

  function Headsup({ N, onSave, onClose }) {
    const [pe, setPe] = useState(""), [err, setErr] = useState("");
    return (
      <Modal label="Give a heads-up" onClose={onClose}>
        <div className="kick">Optional</div>
        <h3>{`Give ${N.them} a heads-up`}</h3>
        <p>A short, neutral email. They see nothing of yours until you choose to share your picture.</p>
        <label className="field"><span>{`${N.Them}'s email`}</span><input type="email" value={pe} placeholder="their@email.com" onChange={(e) => { setPe(e.target.value); setErr(""); }}/>{err && <span className="err">{err}</span>}</label>
        <div className="mrow"><button className="btn lg" onClick={() => { if (!/^\S+@\S+\.\S+$/.test(pe)) return setErr("Check the email address"); J.set("signup", { partnerEmail: pe, invited: true }); onSave(); }}>Send heads-up <Ic.Arrow s={15}/></button><button className="lnk" onClick={onClose}>Not now</button></div>
      </Modal>
    );
  }

  Object.assign(window, { OBRail: Rail, OBTop: Top, OBdashOn: dashOn, OBPhaseStrip: PhaseStrip, OBAICard: AICard, OBTodo: Todo, OBEvidence: Evidence, OBTips: Tips, OBModal: Modal, OBHomePensions: HomePensions, OBHeadsup: Headsup });
})();
