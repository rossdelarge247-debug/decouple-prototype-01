/* Settle — sign the agreement: same Draw / Upload / Type signature capture as Finalise. The adopted signature is reused as "Saved" in Finalise. */
(function () {
  const { useState, useEffect, useRef } = React;
  const Ic = window.DIc, ST = window.ST;
  const FONTS = ["f1", "f2", "f3"];
  const Sg = ({ g, cls = "" }) => (g.src ? <img className={"st-sgi " + cls} src={g.src} alt="Signature"/> : <i className={"fm-sgt " + g.font + " " + cls}>{g.txt}</i>);

  function SignModal({ N, finalN, agreed, S, onDone, close }) {
    const O = N.Them, stx = S.filter((s) => { const o = ST.opt(s, agreed[s.id]); return o && o.r === "stretch"; });
    const [tab, setTab] = useState("draw"), [has, setHas] = useState(false), [up, setUp] = useState(null), [txt, setTxt] = useState(N.Me), [font, setFont] = useState("f2");
    const [read, setRead] = useState(false), [legal, setLegal] = useState(false), [ack, setAck] = useState(false);
    const cv = useRef(null), dr = useRef(false);
    useEffect(() => { if (tab !== "draw" || !cv.current) return; const c = cv.current, r = devicePixelRatio || 1; c.width = c.offsetWidth * r; c.height = c.offsetHeight * r; const x = c.getContext("2d"); x.scale(r, r); x.lineWidth = 2.6; x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = "#1D2B5E"; setHas(false); }, [tab]);
    const pt = (ev) => { const b = cv.current.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; };
    const down = (ev) => { dr.current = true; cv.current.setPointerCapture(ev.pointerId); const x = cv.current.getContext("2d"), [a, b] = pt(ev); x.beginPath(); x.moveTo(a, b); };
    const move = (ev) => { if (!dr.current) return; const x = cv.current.getContext("2d"), [a, b] = pt(ev); x.lineTo(a, b); x.stroke(); setHas(true); };
    const clear = () => { const c = cv.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); setHas(false); };
    const file = (ev) => { const f = ev.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => setUp(r.result); r.readAsDataURL(f); };
    const ready = (tab === "draw" ? has : tab === "up" ? !!up : !!txt.trim()) && read && legal && (!stx.length || ack);
    const adopt = () => { const at = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); const g = tab === "draw" ? { kind: "draw", src: cv.current.toDataURL("image/png"), at } : tab === "up" ? { kind: "up", src: up, at } : { kind: "type", txt: txt.trim(), font, at }; onDone(g, tab === "type" ? txt.trim() : N.Me, at); };
    const Ck = ({ on, set, children }) => <label className={"rc-sign" + (on ? " on" : "")}><input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)}/><span>{children}</span></label>;
    return <div className="mscrim" onClick={(e) => e.target === e.currentTarget && close()}><div className="mbox wide st-signm ce-sm" role="dialog" aria-modal="true" aria-label="Sign the agreement">
      <button className="mx" aria-label="Close" onClick={close}><Ic.X s={16}/></button>
      <div className="pq-k" style={{ color: "#047857" }}>{`Sign · Settlement agreement v${finalN}`}</div>
      <h3>Add your signature</h3>
      <ul><li><Ic.Lock s={14}/>{`Once you've both signed, v${finalN} is locked — neither of you can change it.`}</li><li><Ic.Check s={14} w={2.6}/>Decouple drafts the consent order and Form D81 from it.</li><li><Ic.Help s={14}/>{`Undoing it needs ${O} to agree too.`}</li></ul>
      {stx.length > 0 && <div className="la-note"><b>{`${stx.length} section${stx.length > 1 ? "s" : ""} may be questioned by a court`}</b><span>{stx.map((s) => `${s.t}: ${ST.opt(s, agreed[s.id]).rw}`).join(" ")}</span></div>}
      <div className="ce-stabs st-tabs">{[["draw", "Draw"], ["up", "Upload"], ["type", "Type"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "draw" && <div className="ce-pad draw"><canvas ref={cv} onPointerDown={down} onPointerMove={move} onPointerUp={() => (dr.current = false)} onPointerLeave={() => (dr.current = false)}></canvas><span className="ln"></span>{!has && <span className="ph">Sign here with your mouse, finger or stylus</span>}{has && <button className="lnk cl" onClick={clear}>Clear</button>}</div>}
      {tab === "up" && <label className="ce-pad up">{up ? <img src={up} alt="Uploaded signature"/> : <span className="ph">Choose a photo or scan of your signature<small>PNG or JPG, on a plain background</small></span>}<input type="file" accept="image/*" onChange={file}/></label>}
      {tab === "type" && <div className="ce-type"><input value={txt} onChange={(e) => setTxt(e.target.value)} aria-label="Your full name"/><div className="fs">{FONTS.map((k) => <button key={k} className={font === k ? "on" : ""} onClick={() => setFont(k)}><i className={"fm-sgt " + k}>{txt || N.Me}</i></button>)}</div></div>}
      {stx.length > 0 && <Ck on={ack} set={setAck}>{`I understand ${stx.length > 1 ? "these sections" : "this section"} may not be approved as written`}</Ck>}
      <Ck on={read} set={setRead}>I've read the whole agreement and it's what I've agreed to</Ck>
      <Ck on={legal} set={setLegal}>I understand this is my legal signature</Ck>
      <div className="mrow"><button className="btn lg go" disabled={!ready} onClick={adopt}>Adopt and sign<Ic.Arrow s={14}/></button><button className="btn lg ghost" onClick={close}>Not yet</button></div>
    </div></div>;
  }
  Object.assign(window, { STSignModal: SignModal, STSg: Sg });
})();
