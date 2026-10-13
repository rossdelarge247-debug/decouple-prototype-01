/* Finalise — Your documents: thumbnail strip with presence, collaborative editor (restricted editing + suggestions), track-changes column. Mark is scripted. */
(function () {
  const { useState, useEffect, useRef } = React;
  const Ic = window.DIc, FN = window.FN;
  const Av = (p) => <window.RCAv {...p}/>;
  const IC = { undo: <path d="M4 7h8a4 4 0 0 1 0 8H8M4 7l3-3M4 7l3 3"/>, redo: <path d="M16 7H8a4 4 0 0 0 0 8h4M16 7l-3-3M16 7l-3 3"/>, sug: <><path d="M4 16l1-3.5L13.5 4 16 6.5 7.5 15z"/><path d="M11.5 6l2.5 2.5"/></>, dl: <path d="M10 3v10m-4-4 4 4 4-4M4 16h12"/>, cm: <path d="M4 5h12v8H9l-3 3v-3H4z"/> };
  const Svg = ({ k }) => <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{IC[k]}</svg>;
  const cut = (s, n = 110) => (s.length > n ? s.slice(0, n - 2) + "…" : s);

  const SIGD = { order: ["a", "b"], a: ["a"], d81: ["a", "b"] };
  const FONTS = [["f1", "Caveat"], ["f2", "Mrs Saint Delafield"], ["f3", "Homemade Apple"]];
  function SigModal({ N, det, D, saved, onDone, close, full }) {
    const [tab, setTab] = useState(saved ? "saved" : "draw"), [has, setHas] = useState(false), [up, setUp] = useState(null), [txt, setTxt] = useState(full), [font, setFont] = useState("f2"), [ok, setOk] = useState(false);
    const cv = useRef(null), dr = useRef(false);
    useEffect(() => { if (tab !== "draw" || !cv.current) return; const c = cv.current, r = devicePixelRatio || 1; c.width = c.offsetWidth * r; c.height = c.offsetHeight * r; const x = c.getContext("2d"); x.scale(r, r); x.lineWidth = 2.6; x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = "#1D2B5E"; setHas(false); }, [tab]);
    const pt = (ev) => { const b = cv.current.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; };
    const down = (ev) => { dr.current = true; cv.current.setPointerCapture(ev.pointerId); const x = cv.current.getContext("2d"), [a, b] = pt(ev); x.beginPath(); x.moveTo(a, b); };
    const move = (ev) => { if (!dr.current) return; const x = cv.current.getContext("2d"), [a, b] = pt(ev); x.lineTo(a, b); x.stroke(); setHas(true); };
    const clear = () => { const c = cv.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); setHas(false); };
    const file = (ev) => { const f = ev.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => setUp(r.result); r.readAsDataURL(f); };
    const ready = tab === "saved" ? true : tab === "draw" ? has : tab === "up" ? !!up : !!txt.trim();
    const sot = D.id !== "order";
    const adopt = () => { const at = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); const g = tab === "saved" ? { ...saved, at } : tab === "draw" ? { kind: "draw", src: cv.current.toDataURL("image/png"), at } : tab === "up" ? { kind: "up", src: up, at } : { kind: "type", txt: txt.trim(), font, at }; onDone(g); };
    return <div className="mscrim" onClick={(ev) => ev.target === ev.currentTarget && close()}><div className="mbox wide ce-sm" role="dialog" aria-modal="true" aria-label={"Sign " + D.t}>
      <button className="mx" aria-label="Close" onClick={close}><Ic.X s={16}/></button>
      <div className="pq-k" style={{ color: "#047857" }}>{`Sign · ${D.t}`}</div>
      <h3>Add your signature</h3>
      <div className="ce-stabs">{[saved && ["saved", "Saved"], ["draw", "Draw"], ["up", "Upload"], ["type", "Type"]].filter(Boolean).map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "saved" && <div className="ce-pad"><span className="ce-sgv">{saved.src ? <img src={saved.src} alt="Your saved signature"/> : <i className={"fm-sgt " + saved.font}>{saved.txt}</i>}</span><small>The signature you used on another document</small></div>}
      {tab === "draw" && <div className="ce-pad draw"><canvas ref={cv} onPointerDown={down} onPointerMove={move} onPointerUp={() => (dr.current = false)} onPointerLeave={() => (dr.current = false)}></canvas><span className="ln"></span>{!has && <span className="ph">Sign here with your mouse, finger or stylus</span>}{has && <button className="lnk cl" onClick={clear}>Clear</button>}</div>}
      {tab === "up" && <label className="ce-pad up">{up ? <img src={up} alt="Uploaded signature"/> : <span className="ph">Choose a photo or scan of your signature<small>PNG or JPG, on a plain background</small></span>}<input type="file" accept="image/*" onChange={file}/></label>}
      {tab === "type" && <div className="ce-type"><input value={txt} onChange={(ev) => setTxt(ev.target.value)} aria-label="Your full name"/><div className="fs">{FONTS.map(([k]) => <button key={k} className={font === k ? "on" : ""} onClick={() => setFont(k)}><i className={"fm-sgt " + k}>{txt || full}</i></button>)}</div></div>}
      <label className={"rc-sign" + (ok ? " on" : "")}><input type="checkbox" checked={ok} onChange={(ev) => setOk(ev.target.checked)}/><span>{sot ? "I believe the facts in this document are true. I understand this is my legal signature." : "I agree to an order in these terms. I understand this is my legal signature."}</span></label>
      <div className="mrow"><button className="btn lg go" disabled={!ready || !ok} onClick={adopt}>Adopt and sign<Ic.Arrow s={14}/></button><button className="btn lg ghost" onClick={close}>Cancel</button></div>
    </div></div>;
  }

  const RELO = [["none", "No plans to remarry or live with anyone"], ["cohab", "Living with a new partner"], ["intend", "Planning to remarry"], ["cohabint", "Planning to live with a new partner"]];
  const CFF = [["bFull", "Your full name", "As on your marriage certificate", "All forms"], ["bDob", "Date of birth", null, "D81 Q6", "date"], ["bNi", "National Insurance number", null, "Form P1", null, true], ["bAddr", "Where you'll live after the order", null, "D81 Q15"]];
  function ConfB({ det, N, done, setDet, onConf, locked }) {
    const [v, setV] = useState(() => Object.fromEntries([...CFF.map((f) => f[0]), "bRel"].map((k) => [k, det[k] || ""]))), [open, setOpen] = useState(!done);
    const ch = Object.keys(v).filter((k) => (det[k] || "") !== v[k]);
    if (done && !open) return <div className="paper ce-cf dn"><Ic.Check s={12} w={3}/><span><b>Your details are confirmed</b><small>Name, date of birth, NI number, address and relationship plans</small></span>{!locked && <button className="lnk" onClick={() => setOpen(true)}>Change</button>}</div>;
    return <div className="paper pp-card ce-cf"><div className="hd"><div className="pq-k" style={{ color: "#0369A1" }}>Before you sign</div><h2>Confirm <em>your details.</em></h2><p className="pq-why">{`${N.Me} filled these in. Only you can confirm them, and they go on the court forms. Correct anything that's wrong.`}</p></div>
      <div className="fn-2">{CFF.map(([k, l, h, tag, type, mono]) => <label key={k} className="fn-f"><span className="l">{l}<em>{tag}</em></span><input type={type || "text"} className={mono ? "mono" : ""} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })}/>{h && <small className="h">{h}</small>}{(det[k] || "") !== v[k] && <small className="h ch">{`${N.Me} entered: ${det[k] || "nothing"}`}</small>}</label>)}</div>
      <div className="fn-f"><span className="l">New relationships<em>D81 Q16 · a legal declaration</em></span><div className="fn-rs">{RELO.map(([k, l]) => <button key={k} className={"st-opt sm" + (v.bRel === k ? " on" : "")} onClick={() => setV({ ...v, bRel: k })}><span className="rd"></span><span className="tx"><b>{l}</b></span></button>)}</div></div>
      <div className="st-conf"><button className="btn" onClick={() => { if (ch.length) setDet(Object.fromEntries(ch.map((k) => [k, v[k]]))); onConf(ch.length); setOpen(false); }}>{ch.length ? `Save ${ch.length} correction${ch.length > 1 ? "s" : ""} and confirm` : "These are correct"}<Ic.Arrow s={13}/></button></div>
    </div>;
  }

  function DocArea(P) {
    const { N, m, det, sign, S, agreed, docs, doc, setDoc, ctx, fin, act, st, markup, setMarkup, mode, reviewed, onDone, say, locked, ver, renderThumb, editAll, me, bConf, onConf, setDet } = P;
    const ME = me || "a", OT = ME === "a" ? "b" : "a", nm = (w) => (w === "a" ? N.Me : N.Them), O = nm(OT), sugs = fin.sugs || [], resign = locked ? [] : fin.resign || [], D = docs.find((d) => d.id === doc) || docs[0];
    const [markAt, setMarkAt] = useState(null), [markDoc, setMarkDoc] = useState("order"), [tab, setTab] = useState("ch"), [seen, setSeen] = useState(D.id), [foc, setFoc] = useState(null);
    const canvas = useRef(null), [sigM, setSigM] = useState(null), [markSign, setMarkSign] = useState(null);
    const ds = fin.dsig || {}, dk = fin.dok || {};
    const markTodo = docs.map((d) => d.id).find((id) => (SIGD[id] ? SIGD[id].includes(OT) && !(ds[id] || {})[OT] && (!SIGD[id].includes(ME) || (ds[id] || {})[ME]) : (dk[id] || {})[ME] && !(dk[id] || {})[OT]));
    useEffect(() => { if (!markTodo || locked) return; const a = setTimeout(() => { setMarkDoc(markTodo); setMarkAt(null); setMarkSign(markTodo); }, 1200), b = setTimeout(() => { act.markSignDoc(markTodo); setMarkSign(null); }, 4800); return () => { clearTimeout(a); clearTimeout(b); }; }, [markTodo]);
    useEffect(() => { if (fin.mk || locked || ME !== "a") return; const a = setTimeout(() => { setMarkDoc("d81"); setMarkAt("d.q14"); }, 2200), b = setTimeout(() => { act.markSuggest(); setMarkAt(null); }, 7500); return () => { clearTimeout(a); clearTimeout(b); }; }, []);
    const pend = sugs.filter((s) => s.by === ME && s.st === "open").map((s) => s.id + s.to.length).join();
    useEffect(() => { if (!pend || locked) return; const s = sugs.find((x) => x.by === ME && x.st === "open"); const a = setTimeout(() => { setMarkDoc(s.doc); setMarkAt(s.at); }, 1400), b = setTimeout(() => { act.resolveSug(s.id, true, OT); setMarkAt(null); }, 6000); return () => { clearTimeout(a); clearTimeout(b); }; }, [pend]);
    useEffect(() => { if (mode !== "chain" || !canvas.current) return; const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setSeen(e.target.dataset.doc)), { rootMargin: "-40% 0px -55% 0px" }); canvas.current.querySelectorAll(".ce-doc").forEach((el) => io.observe(el)); return () => io.disconnect(); }, [mode, docs.length]);
    const meDoc = mode === "one" ? D.id : seen;
    const tOf = (id) => (docs.find((d) => d.id === id) || {}).t || "";
    const lblOf = (at) => { const s = sugs.find((x) => x.at === at); return s ? s.lbl : (FN.label(at, N)[1] || ""); };
    const ownAt = markAt && sugs.some((s) => s.at === markAt && s.by === ME && s.st === "open");
    const line = markSign ? `${O} is ${SIGD[markSign] ? "signing" : "reviewing"} ${tOf(markSign)}` : markAt ? (ownAt ? `${O} is reviewing your change · ${tOf(markDoc)}, ${lblOf(markAt)}` : `${O} is editing ${tOf(markDoc)} · ${lblOf(markAt)}`) : `${O} is viewing ${tOf(markDoc)}`;
    const jump = (id, at) => { if (mode === "one") setDoc(id); setTimeout(() => { const root = canvas.current, el = root && (at ? root.querySelector('[id="fe-' + at + '"]') : document.getElementById("ce-doc-" + id)); if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - (at ? 160 : 90), behavior: "smooth" }); }, 60); };
    const jumpEnd = (id) => { const run = () => { const root = mode === "one" ? canvas.current : document.getElementById("ce-doc-" + id), el = root && root.querySelector(".fm-sgb, .ce-ok"); if (el) scrollTo({ top: el.getBoundingClientRect().top + scrollY - 200, behavior: "smooth" }); }; if (mode === "one" && id !== D.id) { setDoc(id); setTimeout(run, 80); } else run(); };
    const pick = (id) => { setDoc(id); if (mode === "chain") jump(id); };
    const [act1, setAct1] = useState(null);
    const go = (s) => { jump(s.doc, s.at); setFoc(s.at); setAct1(s.id); clearTimeout(window.__ceF); window.__ceF = setTimeout(() => setFoc(null), 3200); };
    const open = sugs.filter((s) => s.st === "open"), done = sugs.filter((s) => s.st !== "open").slice().reverse(), cms = (fin.comments || []).filter((c) => c.st === "open"), nOpen = open.length + cms.length;
    const PAIR = { order: "d81", d81: "order" };
    const canSign = (doc) => { const own = open.filter((s) => s.doc === doc).length + cms.filter((c) => !c.at.startsWith("f.") && FN.docsOf(c.at)[0] === doc).length, lk = PAIR[doc] ? open.filter((s) => s.kind === "term" && s.doc === PAIR[doc]).length : 0; if (ME === "b" && !bConf) return { ok: false, n: 0, conf: true }; return { ok: !(own + lk), n: own + lk, linked: lk }; };
    const qLbl = (q, ok) => (q.ok ? ok : q.conf ? "Confirm your details first" : q.linked && q.n === q.linked ? "Waiting on a term change in the consent order" : "Resolve " + q.n + " change" + (q.n > 1 ? "s" : "") + " first");
    const endPanel = (id) => { if (SIGD[id]) return null; const q = canSign(id), sum = id === "sum";
      return <div className="ce-ok"><div className="hd"><b>{sum ? "Happy with this summary?" : "Happy with this document?"}</b><small>{sum ? "For your records. It isn't filed with the court." : "This annex isn't signed. Confirm it's right and ready to file."}</small></div>
        {[[ME, nm(ME)], [OT, O]].map(([k, who]) => { const v = (dk[id] || {})[k]; return <div key={k} className={"r" + (v ? " on" : "")}><Av w={k} N={N} size={26}/><b>{who}</b>{v ? <span className="ok"><Ic.Check s={11} w={3}/>{`${sum ? "Happy with this" : "Ready to file"} · ${v}`}</span> : k === ME ? <button className="btn sm" disabled={!q.ok || locked} onClick={() => act.okDoc(id, ME)}>{qLbl(q, sum ? "I'm happy with this" : "Happy with this · ready to file")}</button> : <em>{`Waiting for ${O}`}</em>}</div>; })}</div>; };
    const ectx = { ...ctx, me: ME, OT: O, qLbl, ce: true, open: !!editAll, canSign, endPanel, openSig: (doc) => setSigM(doc), sugs, markAt, markup, focus: foc || ctx.focus, locked, onSug: (a1, a2, a3, x = {}) => act.sug(a1, a2, a3, { ...x, by: ME }) };
        const Doc = (id) => <window.FNDoc id={id} ctx={ectx} m={m} det={det} sign={sign} S={S} agreed={agreed} N={N}/>;
    const hist = [...sugs.filter((s) => s.st === "acc").map((s) => ({ k: s.id, t: s.kind === "term" ? `v${s.v} · ${s.lbl}` : s.lbl, s: s.kind === "term" ? "Agreed term changed · Proposals updated" : `${tOf(s.doc)} · suggestion accepted`, who: s.by, when: s.rt })).reverse(), { k: "gen", t: `Drafted from v${m.finalN}`, s: "Your signed agreement and your details", who: null, when: m.signedOn || "2 October 2026" }];

    function Card({ s }) {
      const mine = s.by === ME, sys = s.by === "sys", add = s.to.startsWith(s.from), d0 = window.FNdiff(s.from, s.to), o = add ? "" : d0[1], n = add ? s.to.slice(s.from.length).trim() : d0[2];
      return <div className={"ce-card s-" + s.by + " " + s.st + (s.kind === "term" ? " term" : "") + (act1 === s.id ? " act" : "")} onClick={() => go(s)} onMouseEnter={() => setFoc(s.at)} onMouseLeave={() => act1 !== s.id && setFoc(null)}>
        <div className="h">{sys ? <span className="ce-sys">D</span> : <Av w={s.by} N={N} size={24}/>}<span className="nm"><b>{sys ? "Decouple · pre-flight" : nm(s.by)}</b><small>{`Today ${s.t}`}</small></span>{s.st === "open" && !mine && <span className="ac"><button title="Accept" aria-label="Accept" onClick={(e) => { e.stopPropagation(); act.resolveSug(s.id, true, ME); }}><Ic.Check s={13} w={2.6}/></button><button title="Reject" aria-label="Reject" onClick={(e) => { e.stopPropagation(); act.resolveSug(s.id, false, ME); }}><Ic.X s={12}/></button></span>}</div>
        <div className="k">{s.kind === "term" ? <><Ic.Lock s={10}/>Agreed term</> : "Suggestion"}<span>{`${tOf(s.doc)} · ${s.lbl}`}</span></div>
        <p>{s.tick ? <><b>{s.to === "1" ? "Tick:" : "Untick:"}</b>{` ${s.tick}`}</> : o && n ? <><b>Replace</b>{` “${cut(o, 70)}” `}<b>with</b>{` “${cut(n)}”`}</> : n ? <><b>Add:</b>{` ${cut(n)}`}</> : <><b>Remove:</b>{` ${cut(o)}`}</>}</p>
        {s.why && <p className="why">{s.why}</p>}
        {s.st === "open" && mine && <div className="w"><span className="spin"></span><span>{`Waiting for ${O}`}{s.kind === "term" && <small>{`If ${O} agrees, your agreement becomes v${ver + 1}`}</small>}</span><button className="lnk" onClick={(e) => { e.stopPropagation(); act.withdraw(s.id); }}>Withdraw</button></div>}
        {s.st === "acc" && <div className="r ok"><Ic.Check s={10} w={3}/>{`Accepted by ${nm(s.rb)} · ${s.rt}`}{s.kind === "term" && <button className="lnk" onClick={(e) => { e.stopPropagation(); window.Journey.goStage("settle"); }}>{`v${s.v} in Proposals`}</button>}</div>}
        {s.st === "rej" && <div className="r no">{`Rejected by ${nm(s.rb)} · ${s.rt}`}</div>}
      </div>;
    }

    const SD = sigM && docs.find((d) => d.id === sigM);
    return <div className="rc-main ce-main">
      {SD && <SigModal N={N} det={det} D={SD} full={ME === "a" ? det.aFull : det.bFull} saved={ME === "a" ? fin.mysig || ((window.Journey.get().settle || {}).sign || {}).ag : fin.mysigB} close={() => setSigM(null)} onDone={(g) => { act.signDoc(SD.id, ME, g); setSigM(null); say(`You've signed ${SD.t}`, SIGD[SD.id].includes(OT) ? `We've asked ${O} to sign.` : "That's everything this form needs."); }}/>}
      <window.FNHead av={<><Av w="a" N={N} size={15}/><Av w="b" N={N} size={15}/></>} tab={`v${ver} · ${ME === "b" ? nm(ME).toUpperCase() + " · CO-SIGNER" : "YOUR DOCUMENTS"}`} k="Finalise · your documents" h={<>Your <em>documents.</em></>} p={ME === "b" ? `${O} drafted these from your signed agreement. Confirm your details, check each document, then sign.` : editAll ? `Click anything to suggest a change. ${O} sees each one marked up.` : "Edit the highlighted passages. The rest comes from your signed agreement."}>
        <div className="ce-strip">{docs.map((d) => { const here = [meDoc === d.id && ME, markDoc === d.id && OT].filter(Boolean), n = open.filter((s) => s.doc === d.id).length + cms.filter((c) => FN.docsOf(c.at)[0] === d.id && !c.at.startsWith("f.")).length;
          return <button key={d.id} className={"fn-th ce-th" + (meDoc === d.id ? " on" : "")} onClick={() => pick(d.id)}><span className="pv"><span className="sc">{renderThumb(d.id)}</span>{here.length > 0 && <span className="ce-pr">{here.map((w) => <span key={w} className={"ce-pa " + w}><Av w={w} N={N} size={20}/></span>)}</span>}{n > 0 && <span className="ce-nb">{`${n} in review`}</span>}</span><b>{d.t}</b><small>{d.s}</small><window.FNLz k={st(d.id)}/></button>; })}</div>
      </window.FNHead>
      {ME === "b" && <ConfB det={det} N={N} done={bConf} setDet={setDet} onConf={onConf} locked={locked}/>}
      <div className="paper ce-ed">
        <div className="ce-top"><div className="ce-who">{[[ME, nm(ME)], [OT, O]].map(([w, who]) => <span key={w} className={"ce-pa big " + w} title={`${who} · online`}><Av w={w} N={N} size={28}/></span>)}</div><span className="ce-line"><i></i>{line}</span><span className="sp"></span>{mode === "one" && <span className="ce-dn"><b>{D.t}</b><small>{D.s}</small></span>}</div>
        <div className="ce-bar">
          <button className="ce-ib" disabled title="Undo"><Svg k="undo"/></button><button className="ce-ib" disabled title="Redo"><Svg k="redo"/></button><span className="sep"></span>
          <span className="ce-mode" title={`Every change needs ${O}'s OK`}><Svg k="sug"/>Suggesting</span>
          <label className="fn-sw"><input type="checkbox" checked={markup} onChange={(e) => setMarkup(e.target.checked)}/><span className="tg"></span><b>Show changes</b></label><span className="sep"></span>
          {editAll ? <span className="ce-key"><i className="e"></i>{`Everything is editable · agreed terms need ${O}'s OK`}</span> : <><span className="ce-key"><i className="e"></i>You can edit</span><span className="ce-key"><i className="l"></i>Agreed · request a change</span></>}
          <span className="sp"></span>{(() => { const sd = mode === "one" ? D.id : meDoc, sg = SIGD[sd], dn = sg ? !sg.includes(ME) || (ds[sd] || {})[ME] : (dk[sd] || {})[ME]; return !locked && !dn && <button className="btn sm ce-sgo" onClick={() => jumpEnd(sd)}>{sg ? "Sign" : "Approve"}<Ic.Arrow s={12}/></button>; })()}<button className="ce-ib" title="Download PDF" onClick={() => say(`${mode === "one" ? D.t : "Court bundle"} downloaded`, "PDF · prototype")}><Svg k="dl"/></button>
        </div>
        <div className="ce-body">
          <div className="ce-canvas" ref={canvas}>{mode === "one" ? Doc(D.id) : docs.map((d) => <section key={d.id} id={"ce-doc-" + d.id} data-doc={d.id} className="ce-doc"><div className="ce-dl"><b>{d.t}</b><small>{d.s}</small><window.FNLz k={st(d.id)}/></div>{Doc(d.id)}</section>)}</div>
          <aside className="ce-side">
            <div className="ce-tabs"><button className={tab === "ch" ? "on" : ""} onClick={() => setTab("ch")}>Changes{nOpen > 0 && <i>{nOpen}</i>}</button><button className={tab === "hi" ? "on" : ""} onClick={() => setTab("hi")}>History</button></div>
            {resign.length > 0 && <div className="ce-rs"><b>{`${resign.map(tOf).join(" and ")} changed after signing`}</b><span>Only this needs signing again. Everything else stays signed.</span><button className="btn sm" onClick={() => jumpEnd(resign[0])}>Sign it again</button></div>}
            {tab === "ch" ? <>
              {!nOpen && !done.length && <p className="ce-empty">No changes yet. Click a highlighted passage to suggest new wording. {editAll ? "Every passage and field is editable. Changes to agreed terms update your agreement if both of you accept." : <>To change an agreed term, hover the clause and choose <b>Request change</b>.</>}</p>}
              {open.map((s) => <Card key={s.id} s={s}/>)}
              {cms.map((c) => <window.FNComment key={c.id} c={c} N={N} act={act} compact/>)}
              {done.length > 0 && <><div className="ce-sub">Resolved</div>{done.map((s) => <Card key={s.id} s={s}/>)}</>}
            </> : <div className="ce-hist">{hist.map((h, i) => <div key={h.k} className={"ce-hi" + (i === 0 ? " now" : "")}>{i === 0 && <em>Latest</em>}<b>{h.t}</b><small>{h.s}</small><span>{h.who ? <><Av w={h.who} N={N} size={16}/>{nm(h.who)}</> : "Decouple"}<i>{h.when}</i></span></div>)}</div>}
          </aside>
        </div>
      </div>
      {reviewed && ME === "b" && <div className="paper pp-card st-send"><div><div className="pq-k" style={{ color: "#047857" }}>Every document agreed &amp; signed</div><h2>{`Over to ${O}.`}</h2><p className="pq-why">{`${O} runs the final checks and files. We'll tell you both the moment anything changes.`}</p></div></div>}
      {reviewed && ME === "a" && <div className="paper pp-card st-send"><div><div className="pq-k" style={{ color: "#047857" }}>Every document agreed &amp; signed</div><h2>Next, <em>pre-flight checks.</em></h2><p className="pq-why">We check the signed bundle the way a judge will. Then your filing options unlock.</p></div><div className="st-conf"><button className="btn" onClick={onDone}>Run pre-flight checks<Ic.Arrow s={13}/></button></div></div>}
    </div>;
  }
  Object.assign(window, { FNDocArea: DocArea });
})();
