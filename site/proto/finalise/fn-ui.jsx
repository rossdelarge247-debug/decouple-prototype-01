/* Finalise — pages: plan gate/upsell, details wizard, generation, overview, documents, pre-flight, Mark's review, sign, file, tracking. */
(function () {
  const { useState, useEffect } = React;
  const Ic = window.DIc, FN = window.FN, gbp = FN.gbp, fmtD = FN.fmtD;
  const Av = (p) => <window.RCAv {...p}/>;
  const Head = ({ c = "#047857", tab, av, k, h, p, children }) => <div className="paper pp-card rc-head" style={{ "--hc": c }}><span className="ftab rc-ftab" style={{ background: c }}>{av}{tab}</span><div className="pq-k" style={{ color: c }}>{k}</div><h1>{h}</h1>{p && <p className="pq-why">{p}</p>}{children}</div>;

  /* ---------- gate ---------- */
  const TIERS = [
    { k: "picture", name: "Your picture", total: 99, sub: "Your evidence and numbers", feats: ["Your first read, saved", "Connect accounts for exact figures", "A Form E–style financial statement"] },
    { k: "guided", name: "Guided settlement", total: 499, sub: "Takes the place of mediation", feats: ["Everything in Your picture", "Reconcile and agree together", "A signed settlement agreement"] },
    { k: "complete", name: "Complete & filed", total: 999, sub: "We take it all the way to court", feats: ["Everything in Guided settlement", "Consent order, Form A, D81 and pension annex", "Pre-flight checks on every document", "Priority human support"], addon: `Filing by our partner solicitor +£${FN.FILE_FEE}` },
  ];
  function Upsell({ plan, N, onUpgrade, onAgreement }) {
    const cur = TIERS.findIndex((t) => t.k === plan), [busy, setBusy] = useState(false);
    return <div className="rc-main fn-gate">
      <Head tab="FINALISE · NOT IN YOUR PLAN" k="Finalise · court documents" h={<>Your agreement is signed.<br/><em>Make it legally binding.</em></>} p={`A signed agreement isn't enforceable on its own. A judge has to approve it as a consent order. Complete & filed drafts every court document from what you and ${N.Them} agreed. You only pay the difference.`}/>
      <div className="tiers fn-tiers">{TIERS.map((x, i) => { const own = i <= cur, up = x.k === "complete"; return <div key={x.k} className={"tier" + (up ? " best sel" : "") + (own ? " own" : "")}>
        {up && <div className="ribbon"><Ic.Star s={11} c="#FFF"/> THE LAST STEP</div>}
        <div className="in"><div className="nm">{x.name}{own && <span className="fn-own"><Ic.Check s={10} w={3} c="#FFF"/>{i === cur ? "Your plan" : "Included"}</span>}</div><div className="sb">{x.sub}</div>
          <div className="pr"><b>{`£${x.total}`}</b><span>one fee, covers you both</span></div>
          {x.addon && <div className="addon">{x.addon}</div>}
          <ul>{x.feats.map((f, j) => <li key={f} className={j === 0 && x.k !== "picture" ? "inh" : ""}><span className="ck"><Ic.Check s={11} w={2.6} c={up ? "#5B21B6" : "#166534"}/></span>{f}</li>)}</ul>
          {up && <button className="btn lg fn-upb" disabled={busy} onClick={() => { setBusy(true); setTimeout(onUpgrade, 900); }}>{busy ? <><span className="spin"></span>Upgrading…</> : <>{`Upgrade · pay £${x.total - (TIERS[cur] || TIERS[1]).total}`}<Ic.Arrow s={14}/></>}</button>}</div></div>; })}</div>
      <div className="paper pp-card fn-alt"><div><b>Not ready to upgrade?</b><span>Download your signed agreement. You can take it to a solicitor to turn into a consent order.</span></div><button className="btn ghost" onClick={onAgreement}>Download signed agreement</button></div>
    </div>;
  }
  function NeedSign({ N, onSettle, onExample, picture }) {
    return <div className="rc-main fn-gate"><Head c="#78716C" tab={picture ? "FINALISE · NOT IN YOUR PLAN" : "FINALISE · LOCKED"} k="Finalise" h={picture ? <>Finalise comes<br/><em>after an agreement.</em></> : <>Sign your agreement<br/><em>first.</em></>} p={picture ? `Your picture is just for you. To reach a court order, you and ${N.Them} need to agree first. That's Guided settlement.` : `Finalise turns your signed settlement into court documents. You and ${N.Them} need to sign it in Settle first.`}>
      <div className="st-btns" style={{ marginTop: 18 }}>{picture ? <button className="btn" onClick={() => window.Journey.goStage("signup", "#plan")}>See plans<Ic.Arrow s={13}/></button> : <button className="btn" onClick={onSettle}>Go to Settle<Ic.Arrow s={13}/></button>}<button className="proto-mini" onClick={onExample}>Prototype · use the example signed agreement</button></div></Head></div>;
  }

  /* ---------- wizard ---------- */
  const WSTEPS = (kids) => [["div", "Your divorce"], ["you", "About you both"], kids && ["kids", "The children"], ["home", "Home and pension"], ["else", "Anything else"], ["why", "Your reasons"]].filter(Boolean);
  function Fld({ l, k, det, set, hint, type = "text", mono, tag: r }) {
    return <label className="fn-f"><span className="l">{l}{r && <em>{r}</em>}</span><input type={type} className={mono ? "mono" : ""} value={det[k] || ""} onChange={(e) => set({ [k]: e.target.value })}/>{hint && <small>{hint}</small>}</label>;
  }
  function Wizard({ det, set, onDone, N, kids, whyEl }) {
    const steps = WSTEPS(kids), [i, setI] = useState(0), sk = steps[i][0], P = { det, set };
    const opts = [["none", "No plans to remarry or live with anyone"], ["cohab", "Living with a new partner"], ["intend", "Planning to remarry"], ["cohabint", "Planning to live with a new partner"]];
    const Rel = ({ k, who }) => <div className="fn-f"><span className="l">{who}<em>D81 Q16</em></span><div className="fn-rs">{opts.map(([v, l]) => <button key={v} className={"st-opt sm" + (det[k] === v ? " on" : "")} onClick={() => set({ [k]: v })}><span className="rd"></span><span className="tx"><b>{l}</b></span></button>)}</div></div>;
    return <div className="rc-main">
      <Head c="#5B21B6" av={<Av w="a" N={N} size={15}/>} tab={`${N.Me.toUpperCase()} · DETAILS FOR THE COURT`} k={`Finalise · step ${i + 1} of ${steps.length}`} h={i === 0 ? <>A few details<br/><em>the court needs.</em></> : sk === "why" ? <>Your reasons,<br/><em>in your own words.</em></> : steps[i][1] + "."} p={sk === "why" ? `The judge reads D81 questions 13 and 14 first. We've drafted them from the notes you and ${N.Them} made in Settle. Check each one, then we'll draft your documents.` : i === 0 ? `Your agreement has the terms. The forms also need some facts we don't have yet. We've filled in what we could. Check each one. ${N.Them} confirms his own details when you share.` : null}>
        <div className="fn-steps">{steps.map(([k, t], j) => <button key={k} className={j === i ? "on" : j < i ? "dn" : ""} onClick={() => j < i && setI(j)}><i>{j < i ? <Ic.Check s={10} w={3} c="#FFF"/> : j + 1}</i>{t}</button>)}</div>
      </Head>
      <div className={"paper pp-card fn-wz" + (sk === "why" ? " fn-wzw" : "")}>
        {sk === "why" && whyEl}
        {sk === "div" && <><Fld {...P} k="caseNo" l="Divorce case number" tag="All forms" mono hint="16 digits, on your conditional order. The financial order goes on the same case."/><Fld {...P} k="coDate" type="date" l="Date of your conditional order" tag="D81 Q3" hint="A judge can't approve the order before this date."/><div className="fn-f"><span className="l">Has the final order been made?<em>D81 Q5</em></span><div className="fn-rs"><button className={"st-opt sm" + (det.foDone === "no" ? " on" : "")} onClick={() => set({ foDone: "no" })}><span className="rd"></span><span className="tx"><b>Not yet</b><small>Recommended. Wait until the financial order is sealed.</small></span></button><button className={"st-opt sm" + (det.foDone === "yes" ? " on" : "")} onClick={() => set({ foDone: "yes" })}><span className="rd"></span><span className="tx"><b>Yes, it's been made</b></span></button></div></div><Fld {...P} k="married" type="date" l="Date you married" tag="D81 Q1"/><Fld {...P} k="separated" type="date" l="Date you separated" tag="D81 Q2"/></>}
        {sk === "you" && <><div className="fn-2"><Fld {...P} k="aFull" l="Your full name" tag="Applicant" hint="As it appears on your marriage certificate."/><Fld {...P} k="bFull" l={`${N.Them}'s full name`} tag="Respondent"/></div><div className="fn-2"><Fld {...P} k="aDob" type="date" l="Your date of birth" tag="D81 Q6"/><Fld {...P} k="bDob" type="date" l={`${N.Them}'s date of birth`} tag="D81 Q6"/></div><div className="fn-2"><Fld {...P} k="aAddr" l="Where you'll live" tag="D81 Q15"/><Fld {...P} k="bAddr" l={`Where ${N.Them} will live`} tag="D81 Q15" hint={`${N.Them} confirms this.`}/></div><div className="fn-2"><Fld {...P} k="aNi" l="Your National Insurance number" tag="Form P1" mono/><Fld {...P} k="bNi" l={`${N.Them}'s National Insurance number`} tag="Form P1" mono hint={`${N.Them} confirms this.`}/></div></>}
        {sk === "kids" && <><div className="fn-2"><Fld {...P} k="k1" l="First child's full name" tag="D81 Q6"/><Fld {...P} k="k1Dob" type="date" l="Date of birth"/></div><div className="fn-2"><Fld {...P} k="k2" l="Second child's full name" tag="D81 Q6"/><Fld {...P} k="k2Dob" type="date" l="Date of birth"/></div><p className="fn-hint"><Ic.Help s={13}/>The order records where the children live in a recital. The court won't make a separate children's order unless you ask.</p></>}
        {sk === "home" && <><div className="fn-2"><Fld {...P} k="title" l="Land Registry title number" tag="Consent order" mono hint="On your title register. We found it from the address."/><Fld {...P} k="lender" l="Mortgage lender" tag="D81 Q17"/></div><Fld {...P} k="mortRef" l="Mortgage account" mono/><div className="fn-2"><Fld {...P} k="nhsRef" l="NHS Pensions membership number" tag="Form P1" mono/><div className="fn-f"><span className="l">NHS Pensions information pack<em>D81 Q21</em></span><div className="fn-rs"><button className={"st-opt sm" + (det.pinfo === "yes" ? " on" : "")} onClick={() => set({ pinfo: "yes" })}><span className="rd"></span><span className="tx"><b>Received</b><small>The letter that came with your CETV</small></span></button><button className={"st-opt sm" + (det.pinfo !== "yes" ? " on" : "")} onClick={() => set({ pinfo: "no" })}><span className="rd"></span><span className="tx"><b>Not yet</b><small>We'll request it for you</small></span></button></div></div></div></>}
        {sk === "else" && <><Rel k="aRel" who="You"/><Rel k="bRel" who={`${N.Them} (he confirms)`}/><div className="fn-f"><span className="l">Anything else the judge should know?<em>D81 Q12</em></span><div className="fn-rs"><button className={"st-opt sm" + (det.other !== "yes" ? " on" : "")} onClick={() => set({ other: "no" })}><span className="rd"></span><span className="tx"><b>No</b></span></button><button className={"st-opt sm" + (det.other === "yes" ? " on" : "")} onClick={() => set({ other: "yes" })}><span className="rd"></span><span className="tx"><b>Yes</b><small>For example a health condition, a job change, or a pre-nuptial agreement</small></span></button></div>{det.other === "yes" && <textarea className="fn-ta" value={det.otherTxt || ""} onChange={(e) => set({ otherTxt: e.target.value })} placeholder="Explain briefly"/>}</div></>}
        <div className="fn-wf">{i > 0 ? <button className="btn ghost" onClick={() => setI(i - 1)}>Back</button> : <span></span>}<button className="btn" onClick={() => (i < steps.length - 1 ? (setI(i + 1), scrollTo({ top: 0 })) : onDone())}>{i < steps.length - 1 ? "Continue" : "Draft my documents"}<Ic.Arrow s={13}/></button></div>
      </div>
    </div>;
  }

  /* ---------- generation ---------- */
  const GEN = [["order", "Consent order", ["Definitions and recitals", "Clauses from your 7 agreed sections", "Standard order wording"]], ["a", "Form A", ["Marked as a consent application", "Orders applied for"]], ["d81", "Form D81", ["Capital and income, before and after", "Q13 reasons from your notes", "Statements of truth"]], ["p1", "Form P1", ["NHS Pension Scheme details", "Percentage to share"]], ["sum", "Plain-English summary", ["What happens when"]]];
  function Gen({ onDone, pen }) {
    const list = GEN.filter((g) => pen || g[0] !== "p1"), [k, setK] = useState(0);
    useEffect(() => { if (k >= list.length * 3) { const t = setTimeout(onDone, 700); return () => clearTimeout(t); } const t = setTimeout(() => setK(k + 1), 380); return () => clearTimeout(t); }, [k]);
    return <div className="rc-main"><div className="paper pp-card fn-gen">
      <div className="pq-k" style={{ color: "#047857" }}>Drafting your court bundle</div>
      <h1>Turning your agreement<br/><em>into court documents.</em></h1>
      <div className="fn-gl">{list.map(([id, t, sub], i) => { const st = k >= (i + 1) * 3 ? "dn" : k >= i * 3 ? "on" : ""; return <div key={id} className={"fn-gi " + st}><span className="pg"><i></i><i></i><i></i></span><div><b>{t}</b><small>{st === "dn" ? "Ready" : st === "on" ? sub[Math.min(k - i * 3, sub.length - 1)] + "…" : "Waiting"}</small></div><span className="ok">{st === "dn" && <Ic.Check s={11} w={3} c="#FFF"/>}{st === "on" && <span className="spin"></span>}</span></div>; })}</div>
      <button className="lnk" onClick={onDone}>Skip</button>
    </div></div>;
  }

  /* ---------- status lozenge ---------- */
  const LZ = { prog: ["In progress", "#92400E", "#FEF3C7", "#FDE68A"], done: ["Agreed & signed", "#FFF", "#047857", "#047857"] };
  function Lz({ k }) { const x = LZ[k] || LZ.prog; return <span className={"fn-lz " + k} style={{ color: x[1], background: x[2], borderColor: x[3] }}><i></i>{x[0]}</span>; }
  /* ---------- quick view ---------- */
  function Quick({ docs, id, setId, close, render, st, onOpen, say }) {
    const i = Math.max(0, docs.findIndex((d) => d.id === id)), D = docs[i], ref = React.useRef(null), [n, setN] = useState(0);
    useEffect(() => { if (ref.current) { ref.current.scrollTop = 0; setN(ref.current.querySelectorAll(".fm-page").length); } }, [id]);
    useEffect(() => { const k = (e) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight" && i < docs.length - 1) setId(docs[i + 1].id); if (e.key === "ArrowLeft" && i > 0) setId(docs[i - 1].id); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [i]);
    return <div className="mscrim fn-qvs" onClick={(e) => e.target === e.currentTarget && close()}>
      {i > 0 && <button className="fn-qa l" title={docs[i - 1].t} aria-label={"Previous: " + docs[i - 1].t} onClick={() => setId(docs[i - 1].id)}><Ic.Arrow s={16}/></button>}
      <div className="fn-qv" role="dialog" aria-modal="true" aria-label={D.t}>
        <div className="h"><div className="t"><b>{D.t}</b><small>{`${D.s} · ${n} page${n !== 1 ? "s" : ""} · ${i + 1} of ${docs.length}`}</small></div><Lz k={st(D.id)} a={D.id === "a"}/><span className="sp"></span><button className="btn sm ghost" onClick={() => say(`${D.t} downloaded`, "PDF · prototype")}>Download</button><button className="btn sm" onClick={() => onOpen(D.id)}>Open full review</button><button className="fn-qx" aria-label="Close" onClick={close}><Ic.X s={16}/></button></div>
        <div className="bd" ref={ref}>{render(D.id)}</div>
      </div>
      {i < docs.length - 1 && <button className="fn-qa r" title={docs[i + 1].t} aria-label={"Next: " + docs[i + 1].t} onClick={() => setId(docs[i + 1].id)}><Ic.Arrow s={16}/></button>}
    </div>;
  }
  /* ---------- your reasons ---------- */
  const WHY_T = { "d.q13a": "Overview", "d.q13h": "The home", "d.q13p": "Pensions", "d.q13c": "Savings, cars and debts", "d.q13s": "Maintenance", "d.q14": "How each of you will manage" };
  const WHY_SEC = { "d.q13h": ["home"], "d.q13p": ["pensions"], "d.q13c": ["savings", "vehicles", "debts"], "d.q13s": ["spousal"], "d.q13a": ["children"] };
  function WhyList({ m, N, S, agreed, edits, setEditOf, locked, advFor, advOk = {}, onAdv }) {
    const stretch = S.filter((s) => { const o = window.ST.opt(s, agreed[s.id]); return o && o.r === "stretch"; });
    const items = [...m.q13.map((p) => ({ id: p.id, base: p.t, src: p.src })), { id: "d.q14", base: m.q14, src: "Drafted from the agreed maintenance terms" }];
    return <div className="fn-why">{items.map((it) => { const e = edits[it.id], v = e ? e.to : it.base, F = FN.FIELDS[it.id] || ["", it.id], secs = stretch.filter((s) => advFor(s).at === it.id);
      return <div key={it.id} className="fn-wi"><div className="hd"><b>{WHY_T[it.id] || F[1]}</b><span className="q mono">{it.id === "d.q14" ? "Q14" : "Q13"}</span>{e && <em className="st-rz" style={{ color: "#5B21B6", background: "#F3EEFE" }}>Edited</em>}</div>
        {secs.map((s) => { const a = advFor(s), ok = v.includes(a.line) || (a.covers && a.covers.test(v)); return <div key={s.id} className={"fn-wadv" + (ok ? " ok" : "")}>{ok ? <Ic.Check s={12} w={3}/> : <em className="st-rz" style={{ color: "#B45309", background: "#FEF3C7" }}>Advisory</em>}<div className="tx"><b>{ok ? `Explains why ${s.t.toLowerCase()} was “a stretch”` : `${s.t} was marked “a stretch” in Settle`}</b>{!ok && <p>A judge may ask you both why. A sentence here usually answers it.</p>}{!ok && <p className="sg">{`“${a.line}”`}</p>}</div>{!ok && !locked && <button className="btn sm" onClick={() => { setEditOf(it.id, (v + " " + a.line).trim()); onAdv(s.id); }}>Use this sentence</button>}</div>; })}
        <textarea value={v} disabled={locked} rows={Math.max(3, Math.ceil(v.length / 92))} onChange={(ev) => setEditOf(it.id, ev.target.value)}/>
        <div className="ft"><small>{e && e.via ? `Changed from ${N.Them}'s comment` : it.src}</small>{e && !locked && <button className="lnk" onClick={() => setEditOf(it.id, it.base)}>Restore our draft</button>}</div></div>; })}</div>;
  }
  function Why(P) {
    const { m, N, seen, done, onDone } = P;
    return <div className="rc-main">
      <Head c="#5B21B6" av={<Av w="a" N={N} size={15}/>} tab="D81 · QUESTIONS 13 AND 14" k="Finalise · your reasons" h={<>In your<br/><em>own words.</em></>} p={`This is the only part of the bundle in your own words, and the judge reads it first. We've drafted it from the notes you and ${N.Them} made in Settle. Keep it short and factual.${seen ? ` ${N.Them} has seen this. Any change now goes back to him for approval.` : ""}`}/>
      <div className="paper pp-card"><WhyList {...P}/></div>
      {!done && <div className="paper pp-card st-send"><div><div className="pq-k" style={{ color: "#5B21B6" }}>Next</div><h2>Next, <em>your documents.</em></h2><p className="pq-why">{`Read each one with ${N.Them}, agree any changes, then sign.`}</p></div><div className="st-conf"><button className="btn" onClick={onDone}>These are our reasons<Ic.Arrow s={13}/></button></div></div>}
    </div>;
  }

  /* ---------- overview ---------- */
  function Thumbs({ docs, open, render, st }) {
    const r = React.useRef(null), by = (d) => r.current && r.current.scrollBy({ left: d * 332, behavior: "smooth" });
    return <div className="fn-thw"><button className="fn-tha l" aria-label="Previous documents" onClick={() => by(-1)}><Ic.Arrow s={13}/></button>
      <div className="fn-ths" ref={r}>{docs.map((d) => <button key={d.id} className="fn-th" onClick={() => open(d.id)}><span className="pv"><span className="sc">{render(d.id)}</span></span><b>{d.t}</b><small>{d.s}</small>{st && <Lz k={st(d.id)} a={d.id === "a"}/>}</button>)}</div>
      <button className="fn-tha r" aria-label="More documents" onClick={() => by(1)}><Ic.Arrow s={13}/></button></div>;
  }
  function Hub({ N, steps, go, m, det, thumbs, fileOpts, preEl }) {
    const cur = steps.find((s) => !s.done) || steps[steps.length - 1];
    return <div className="rc-main">
      <Head av={<><Av w="a" N={N} size={15}/><Av w="b" N={N} size={15}/></>} tab={`v${m.finalN} FINAL · COURT BUNDLE`} k="Finalise · overview" h={<>From agreement<br/><em>to court order.</em></>} p={`Your signed agreement is now a set of court documents. Read them, check them, and both sign. Then file them yourself, or we file for you.`}>
        <div className="rc-tally"><span className="ok"><i></i>{`Case ${det.caseNo}`}</span><span><i></i>{`Conditional order ${fmtD(det.coDate)}`}</span></div>
      </Head>
      <div className="fn-steps-l">{steps.map((s, i) => { const on = s === cur; const opts = s.k === "file" && on && !s.lock && !s.done, pin = s.k === "pre" && !s.lock;
        return <div key={s.k} id={"fn-st-" + s.k} className={"paper pp-card fn-st" + (on ? " on" : "") + (s.done ? " dn" : "") + (s.lock && !on ? " lk" : "")}>
        <span className="n">{s.done ? <Ic.Check s={13} w={3} c="#FFF"/> : s.lock ? <Ic.Lock s={11}/> : i + 1}</span>
        <div className="tx"><b>{s.t}</b><small>{s.s}</small>{on && s.p && <p>{s.p}</p>}</div>
        {(s.done || on) && !s.lock && !opts && !pin && <button className={"btn" + (on ? "" : " sm ghost")} onClick={() => go(s.k)}>{on ? s.cta : "Open"}{on && <Ic.Arrow s={13}/>}</button>}
        {s.k === "docs" && thumbs}{pin && preEl}{opts && <div className="fn-unl"><div className="pq-k" style={{ color: "#047857" }}><Ic.Check s={10} w={3}/>Unlocked · signed and checked</div>{fileOpts}</div>}
      </div>; })}</div>
    </div>;
  }

  /* ---------- documents ---------- */
  function Review({ N, m, det, sign, S, agreed, doc, setDoc, ctx, markup, setMarkup, locked, onDone, reviewed, say, st }) {
    const docs = window.FN_DOCS.filter((d) => !d.pen || m.pct), D = docs.find((d) => d.id === doc) || docs[0];
    return <div className="rc-main">
      <Head av={<Av w="a" N={N} size={15}/>} tab="COURT BUNDLE · DRAFT FOR REVIEW" k="Finalise · read the documents" h={<>Five documents,<br/><em>one agreement.</em></>} p={`Everything here comes from what you agreed in v${m.finalN} and the details you gave us. The documents themselves can't be edited. To fix a fact, change it in Your details and we redraft. The reasons in the D81 are yours to word, in the next step.`}/>
      <div className="fn-tabs" role="tablist">{docs.map((d) => <button key={d.id} role="tab" aria-selected={d.id === D.id} className={d.id === D.id ? "on" : ""} onClick={() => setDoc(d.id)}><b>{d.t}</b><small>{d.s}</small><Lz k={st(d.id)} a={d.id === "a"}/></button>)}</div>
      <div className="fn-tool"><label className="fn-sw"><input type="checkbox" checked={markup} onChange={(e) => setMarkup(e.target.checked)}/><span className="tg"></span><b>Show changes</b></label><span className="fn-lkd"><Ic.Lock s={11}/>{locked ? "Signed — locked" : `Read-only · drafted from v${m.finalN}`}</span><span className="sp"></span><button className="btn sm ghost" onClick={() => say(`${D.t} downloaded`, "PDF · prototype")}>Download PDF</button></div>
      <div className="fn-edh"><Ic.Help s={13}/><span>Something wrong? <b>A fact</b> — change it in Your details. <b>The reasons</b> — next step. <b>A term</b> (the split, the sale, maintenance) — that needs the agreement reopening in Settle.</span></div>
      <window.FNDoc id={D.id} ctx={ctx} m={m} det={det} sign={sign} S={S} agreed={agreed} N={N}/>
      {!reviewed && <div className="paper pp-card st-send"><div><div className="pq-k" style={{ color: "#047857" }}>When you've read them</div><h2>Next, <em>your reasons.</em></h2><p className="pq-why">The one part of the D81 in your own words.</p></div><div className="st-conf"><button className="btn" onClick={onDone}>I've read the documents<Ic.Arrow s={13}/></button></div></div>}
    </div>;
  }

  /* ---------- pre-flight ---------- */
  function Pre({ m, det, N, S, agreed, state, run, next }) {
    const L = FN.CHECKS(m, det), [k, setK] = useState(state === "pass" ? L.length : -1);
    useEffect(() => { if (k < 0 || k >= L.length) return; const t = setTimeout(() => setK(k + 1), 260); return () => clearTimeout(t); }, [k]);
    useEffect(() => { if (k === L.length && state !== "pass") run(); }, [k]);
    const st = S.filter((s) => { const o = window.ST.opt(s, agreed[s.id]); return o && o.r === "stretch" && !explained(s); }), done = k >= L.length;
    return <div className="rc-main">
      <Head tab={done ? `PRE-FLIGHT · ${L.length} OF ${L.length} PASSED` : "PRE-FLIGHT"} k="Finalise · pre-flight" h={done ? <>{`All ${L.length} checks`}<br/><em>passed.</em></> : <>Check it the way<br/><em>a judge will.</em></>} p="Most consent orders that get sent back have a missing date, an unclear clause, or a thin D81. We check for all of them."/>
      <div className="paper pp-card fn-ck">{L.map(([t, b], i) => <div key={t} className={"fn-cr" + (k > i ? " ok" : k === i ? " on" : "")}><span className="i">{k > i ? <Ic.Check s={11} w={3} c="#FFF"/> : k === i ? <span className="spin"></span> : null}</span><div><b>{t}</b>{k > i && <small>{b}</small>}</div></div>)}
        {k < 0 && <div className="fn-ckgo"><button className="btn" onClick={() => setK(0)}>Run pre-flight checks<Ic.Arrow s={13}/></button></div>}</div>
      {done && st.length > 0 && <div className="paper pp-card fn-adv"><em className="st-rz" style={{ color: "#B45309", background: "#FEF3C7" }}>Advisory</em><div><b>{`${st.length} section${st.length > 1 ? "s" : ""} marked “a stretch” in Settle`}</b><p>{`${st.map((s) => s.t).join(", ")}. A judge may ask you both to explain. Your D81 Q13 explains the reasons. It's worth reading that part once more.`}</p></div></div>}
      {done && <div className="paper pp-card st-send"><div><div className="pq-k" style={{ color: "#047857" }}>Unlocked</div><h2>Ready to <em>file.</em></h2><p className="pq-why">File it yourself, or let us do the whole thing. Your options are on the overview.</p></div><div className="st-conf"><button className="btn" onClick={next}>See filing options<Ic.Arrow s={13}/></button></div></div>}
    </div>;
  }

  function PreIn({ m, det, S, agreed, state, run, sugs = [], onResolve, openAt, explained = () => false }) {
    const L = FN.CHECKS(m, det), [k, setK] = useState(state === "pass" ? L.length : -1), [open, setOpen] = useState(state !== "pass");
    useEffect(() => { if (k < 0 || k >= L.length) return; const t = setTimeout(() => setK(k + 1), 260); return () => clearTimeout(t); }, [k]);
    useEffect(() => { if (k === L.length && state !== "pass") run(); }, [k]);
    const st = S.filter((s) => { const o = window.ST.opt(s, agreed[s.id]); return o && o.r === "stretch" && !explained(s); }), done = k >= L.length;
    return <div className="fn-unl fn-prei">
      {k < 0 && <button className="btn" onClick={() => setK(0)}>Run pre-flight checks<Ic.Arrow s={13}/></button>}
      {k >= 0 && done && !open && <button className="lnk" onClick={() => setOpen(true)}>{`Show all ${L.length} checks`}</button>}
      {k >= 0 && (open || !done) && <div className="fn-ckl">{L.map(([t, b], i) => <div key={t} className={"fn-cr" + (k > i ? " ok" : k === i ? " on" : "")}><span className="i">{k > i ? <Ic.Check s={11} w={3} c="#FFF"/> : k === i ? <span className="spin"></span> : null}</span><div><b>{t}</b>{k > i && <small>{b}</small>}</div></div>)}</div>}
      {done && st.map((s) => { const g = sugs.filter((x) => x.adv === s.id).pop(), res = g && g.st === "acc";
        return <div key={s.id} className={"fn-adv" + (res ? " res" : "")}><em className="st-rz" style={res ? { color: "#047857", background: "#D1FAE5" } : { color: "#B45309", background: "#FEF3C7" }}>{res ? "Resolved" : "Advisory"}</em><div className="tx"><b>{`${s.t} was marked “a stretch” in Settle`}</b><p>{res ? "Your reasons now explain it. Form D81 needs signing again." : g && g.st === "open" ? "We've suggested wording for D81 Q13. Accept or change it in Form D81." : "A judge may ask you both to explain it. We can suggest a sentence for your D81 reasons."}</p></div>{!res && (g && g.st === "open" ? <button className="btn sm ghost" onClick={() => openAt(g.at)}>Review in Form D81</button> : <button className="btn sm" onClick={() => onResolve(s)}>Resolve</button>)}</div>; })}
    </div>;
  }

  /* ---------- comments ---------- */
  function Comment({ c, N, act, compact }) {
    const [r, setR] = useState(false), [txt, setTxt] = useState(""), F = FN.label(c.at, N), K = { fact: "His details", why: "Your reasons", term: "A term" }[c.kind || "why"];
    return <div className={"fn-cm " + c.st + (compact ? " sm" : "")}><div className="h"><Av w="b" N={N} size={20}/><b>{N.Them}</b><span className={"fn-ck " + (c.kind || "why")}>{K}</span>{c.at.startsWith("f.") ? <span className="lbl">{F[1]}</span> : <button className="lnk" onClick={() => act.focus(c)}>{`${F[0]} · ${F[1]}`}</button>}</div>
      <p>{c.t}</p>
      {c.st === "open" && !r && <div className="st-ra">{c.sug && <button className="btn sm ok" onClick={() => act.acceptC(c)}>Accept · make the change</button>}<button className="btn sm ghost" onClick={() => setR(true)}>Reply</button></div>}
      {r && c.st === "open" && <div className="st-cnt"><textarea rows={2} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={`Reply to ${N.Them}`}/><div className="b"><button className="btn sm" disabled={!txt.trim()} onClick={() => act.replyC(c, txt.trim())}>Send reply</button><button className="lnk" onClick={() => setR(false)}>Cancel</button></div></div>}
      {c.st === "done" && <div className="fn-res"><Ic.Check s={11} w={3}/>{c.res || "Change made · shown as tracked"}</div>}
      {c.st === "replied" && <div className="fn-rep"><Av w="a" N={N} size={16}/><span>{c.reply}</span></div>}
    </div>;
  }

  /* ---------- file ---------- */
  function File({ N, path, posted, act, say }) {
    const [ck, setCk] = useState({});
    const G = [["dl", "Download and print the pack", "Form A, the consent order (3 copies), the D81 and Form P1. Your signatures are already on them."], ["fee", `Pay the £${FN.FEE} court fee`, "Cheque payable to “HM Courts & Tribunals Service”. If you're on a low income, apply for Help with Fees first and write your reference on Form A."], ["post", "Post it to the court", "HMCTS Financial Remedy Service, PO Box 12746, Harlow CM20 9QZ. Use a tracked service and keep a copy."], ["tell", `Tell ${N.Them} it's posted`, "So you both know when to expect the court's letter."]];
    if (path === "self") return <div className="rc-main">
      <Head c="#44403C" tab="FILING IT YOURSELF" k="Finalise · file it yourself" h={posted ? <>Posted.<br/><em>Now we wait.</em></> : <>Four steps<br/><em>to file it yourself.</em></>} p={posted ? "The court usually writes within 2 weeks to say it has the application, then a judge reviews it on the papers. Most decisions take 4–8 weeks." : "Courts accept consent orders by post from people without a solicitor. It's free, apart from the court fee."}/>
      <div className="paper pp-card fn-guide">{G.map(([k, t, s], i) => <label key={k} className={"rc-sign" + (ck[k] || posted ? " on" : "")}><input type="checkbox" checked={!!ck[k] || posted} disabled={posted} onChange={(e) => setCk({ ...ck, [k]: e.target.checked })}/><span>{`${i + 1}. ${t}`}<small>{s}</small></span>{k === "dl" && !posted && <button className="btn sm ghost" onClick={(e) => { e.preventDefault(); setCk({ ...ck, dl: true }); say("Filing pack downloaded", "6 PDFs · prototype"); }}>Download</button>}</label>)}
        {!posted ? <div className="fn-wf"><button className="lnk" onClick={() => act.setPath(null)}>Back to options</button><button className="btn" disabled={!G.every(([k]) => ck[k])} onClick={act.posted}>I've posted it<Ic.Arrow s={13}/></button></div> : <div className="fn-up"><span>{`Changed your mind? We can still file online for you for £${FN.FILE_FEE}, before the court has logged your paper copy.`}</span></div>}</div>
    </div>;
    return <div className="rc-main">
      <Head tab="READY TO FILE" k="Finalise · file with the court" h={<>Two ways<br/><em>to file.</em></>} p={`The court fee is £${FN.FEE} either way, paid to HMCTS. It's separate from your Decouple plan.`}/>
      <FileOpts act={act}/>
    </div>;
  }

  const FileOpts = ({ act }) =>
      <div className="fn-opts">
        <div className="paper pp-card fn-opt"><div className="pq-k" style={{ color: "#44403C" }}>Included in your plan</div><h3>File it yourself</h3><div className="pr"><b>{`£${FN.FEE}`}</b><span>court fee</span></div><ul className="fn-ul"><li>Download the signed pack</li><li>Step-by-step posting guide</li><li>The court writes to you by post</li></ul><button className="btn ghost" onClick={() => act.setPath("self")}>Get the filing pack</button></div>
        <div className="paper pp-card fn-opt best"><div className="pq-k" style={{ color: "#047857" }}>Recommended</div><h3>We file it for you</h3><div className="pr"><b>{`£${FN.FILE_FEE}`}</b><span>all in, court fee included</span></div><ul className="fn-ul"><li>No need to contact the court</li><li>One last set of legal eyes on your documents</li><li>A solicitor files online, usually the same day</li><li>Faster than post, and nothing gets lost</li><li>Track every stage here</li><li>We handle any questions from the court</li></ul><button className="btn" onClick={act.openPay}>File it for me<Ic.Arrow s={13}/></button></div>
      </div>;

  /* ---------- tracking ---------- */
  function Track({ N, filed, stage, act, say, det }) {
    const T = FN.TRACK, done = stage >= T.length - 1;
    return <div className="rc-main">
      <Head av={<><Av w="a" N={N} size={15}/><Av w="b" N={N} size={15}/></>} tab={`FILED · ${filed.ref}`} k="Finalise · tracking" h={stage >= 3 ? <>Approved.<br/><em>It's legally binding.</em></> : <>With the<br/><em>court.</em></>} p={stage >= 3 ? "A judge has approved your order and the court has sealed it. You'll both get a sealed copy." : `We'll tell you both the moment anything changes. The court contacts our solicitor, and we pass everything on straight away.`}>
        <div className="rc-tally"><span className="ok"><i></i>{`Filing ref ${filed.ref}`}</span><span><i></i>{`Divorce case ${det.caseNo}`}</span><span><i></i>{`Filed online ${filed.at}`}</span><span><i></i>{`By ${FN.FIRM}`}</span></div>
      </Head>
      <div className="paper pp-card fn-tl">{T.map(([t, s], i) => <div key={t} className={"r" + (i < stage ? " dn" : i === stage ? " on" : "")}><span className="d">{i < stage ? <Ic.Check s={10} w={3} c="#FFF"/> : null}</span><div><b>{t}</b><small>{s}</small>
        {i === 4 && stage === 4 && <div className="fn-warn"><b>Your financial order is sealed, so now you can apply.</b><span>Applying for your final order before the financial order is sealed can cost you pension and inheritance rights. You can apply online on GOV.UK.</span><button className="btn sm" onClick={act.advance}>I've applied for my final order</button></div>}</div></div>)}
        {stage < 4 && <button className="proto-mini" onClick={act.advance}>Prototype · simulate the court</button>}</div>
      {done && <div className="paper pp-card fn-end"><div className="pq-k" style={{ color: "#047857" }}>Put it into effect</div><h2>Last few things.</h2>
        <ul className="fn-ul ck"><li>Our partner solicitor sends the sealed order and Form P1 to NHS Pensions. They have 4 months to carry out the share.</li><li>Any lump sum is paid within 28 days of the final order.</li><li>Tell Nationwide and update the buildings insurance.</li><li>Update your will. Your divorce cancels gifts to your ex-partner.</li></ul>
        <div className="st-btns"><button className="btn" onClick={() => say("Sealed order downloaded", "PDF · prototype")}>Download sealed order</button><button className="btn ghost" onClick={() => say("Full bundle downloaded", "ZIP · prototype")}>Download everything</button><button className="btn ghost" onClick={() => window.Journey.goStage("dashboard")}>Go to your dashboard<Ic.Arrow s={13}/></button></div>
        <div className="fn-exit"><b>What happens to your account?</b><div className="fn-rs"><button className="st-opt sm on"><span className="rd"></span><span className="tx"><b>Keep a read-only archive</b><small>Free for 7 years. Useful if anything needs varying later.</small></span></button><button className="st-opt sm" onClick={() => say("We'll email you a copy, then close your account", "Prototype")}><span className="rd"></span><span className="tx"><b>Download everything and close my account</b><small>We delete your data after 30 days.</small></span></button></div></div></div>}
    </div>;
  }

  /* ---------- right rail ---------- */
  function Rail({ page, N, m, edits, comments, act, share, changed, sign, path, filed }) {
    const O = N.Them, E = Object.entries(edits);
    const bundle = <div className="rc-card"><div className="pq-k" style={{ color: "#047857" }}><Ic.Lock s={11}/>Your court bundle</div><div className="rc-stt">{`From v${m.finalN} · signed agreement`}</div>
      <div className="fn-bl">{window.FN_DOCS.filter((d) => !d.pen || m.pct).map((d) => <button key={d.id} onClick={() => act.openDoc(d.id)}><span className="ic"></span><span><b>{d.t}</b><small>{d.s}</small></span></button>)}</div></div>;
    const fee = <div className="rc-card"><div className="pq-k">Court fee</div><div className="fn-fee"><b className="tab">{`£${FN.FEE}`}</b><span>Paid to HMCTS when you file. You may get help with this (Help with Fees).</span></div></div>;
    const markC = <div className="rc-card"><div className="pq-k" style={{ color: "#0369A1" }}><Av w="b" N={N} size={14}/>{O}</div><div className="rc-stt">{changed ? "Needs to re-approve" : { none: "Not shared yet", sent: "Reading the bundle", commented: comments.some((c) => c.st === "open") ? "Left comments" : "Waiting for your changes", resent: "Reviewing your changes", approved: "Approved" }[share.st]}</div>{(share.st === "sent" || share.st === "resent") && <button className="proto-mini" onClick={act.simMark}>{`Simulate ${O}`}</button>}</div>;
    if (page === "docs") return <div className="rc-ov">
      <div className="rc-card"><div className="pq-k" style={{ color: "#5B21B6" }}><Av w="a" N={N} size={14}/>Changes since drafting</div><div className="rc-stt">{E.length ? `${E.length} change${E.length > 1 ? "s" : ""}` : "No changes yet"}</div>
        {!E.length && <p className="rc-p">Nothing has changed since the bundle was drafted. Facts change in Your details; the reasons change in Your reasons.</p>}
        {E.map(([id, e]) => { const F = FN.label(id, N); return <div key={id} className="fn-ch">{id.startsWith("f.") ? <span className="lbl">{`${F[0]} · ${F[1]}`}</span> : <button className="lnk" onClick={() => act.focus({ at: id })}>{`${F[0]} · ${F[1]}`}</button>}{(() => { const [, o, n] = window.FNdiff(e.from, e.to), cut = (s) => (s.length > 120 ? s.slice(0, 118) + "…" : s); return <>{o && <span className="dl">{cut(o)}</span>}{n && <span className="in">{cut(n)}</span>}</>; })()}<div className="mt"><small>{e.via ? `From ${O}'s comment` : `${N.Me} · ${e.at}`}</small>{!sign.a && <button className="lnk" onClick={() => act.undo(id)}>Undo</button>}</div></div>; })}</div>
      {comments.length > 0 && <div className="rc-card"><div className="pq-k" style={{ color: "#0369A1" }}>{`${O}'s comments`}</div>{comments.map((c) => <Comment key={c.id} c={c} N={N} act={act} compact/>)}</div>}
      {markC}</div>;
    if (page === "mark") return <div className="rc-ov">{markC}<div className="rc-card"><div className="pq-k"><Ic.Help s={11}/>{`${O}'s independent advice`}</div><p className="rc-p">{`We tell ${O} he can take his own legal advice before he approves. Many people book a fixed-fee check. It doesn't hold you up.`}</p></div>{bundle}</div>;
    if (page === "file") return <div className="rc-ov">{fee}<div className="rc-card"><div className="pq-k">What you pay today</div><div className="fn-cost"><span>Court fee</span><b>{`£${FN.FEE}`}</b><span>{`We file it · optional`}</span><b>{`£${FN.FILE_FEE}`}</b></div><p className="rc-p">Your Complete & filed plan already covers the documents and checks.</p></div></div>;
    if (page === "track" && filed) return <div className="rc-ov"><div className="rc-card"><div className="pq-k" style={{ color: "#047857" }}>Your case</div><div className="rc-stt mono">{filed.ref}</div><p className="rc-p">{`Filed online on ${filed.at}. The court will contact the solicitor, and we'll pass everything on to you both straight away.`}</p></div>{bundle}</div>;
    return <div className="rc-ov">{bundle}{page !== "sign" && markC}{fee}</div>;
  }

  Object.assign(window, { FNThumbs: Thumbs, FNLz: Lz, FNQuick: Quick, FNWhy: Why, FNWhyList: WhyList, FNUpsell: Upsell, FNNeedSign: NeedSign, FNWizard: Wizard, FNGen: Gen, FNHub: Hub, FNReview: Review, FNPre: Pre, FNFile: File, FNTrack: Track, FNRail: Rail, FNHead: Head, FNComment: Comment, FNFileOpts: FileOpts, FNPreIn: PreIn });
})();
