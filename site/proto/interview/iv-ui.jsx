/* Interview — UI atoms, picture panel, save modal, quick-exit neutral page */
(function () {
  const { useState, useEffect } = React;
  const Ic = window.DIc, IV = window.IV;

  function Cards({ q, v, set, pre }) {
    return <div className="oc">{q.opts.map(([k, l, s]) => (
      <button key={k} className={"ocard" + (v === k ? " on" : "") + (pre && v === k ? " pref" : "")} onClick={() => set(k)}>
        <div><div className="l">{l}</div>{s && <div className="s">{s}</div>}</div>
        <span className="r">{v === k && <Ic.Check s={11} w={3} c="#FFF"/>}</span>
      </button>))}</div>;
  }
  function Seg({ q, v, set }) {
    return <div className="oseg" role="radiogroup">{q.opts.map(([k, l]) => <button key={k} role="radio" aria-checked={v === k} className={v === k ? "on" : ""} onClick={() => set(k)}>{l}</button>)}</div>;
  }
  function Chips({ q, v, set }) {
    const cur = Array.isArray(v) ? v : [];
    const tog = (k) => {
      if (q.exclusive === k) return set(cur.includes(k) ? [] : [k]);
      let n = cur.filter((x) => x !== q.exclusive);
      n = n.includes(k) ? n.filter((x) => x !== k) : [...n, k];
      set(n);
    };
    const full = q.max && cur.length >= q.max;
    return (
      <>
        <div className="ochips">{q.opts.map(([k, l]) => { const on = cur.includes(k); return (
          <button key={k} className={"ochip" + (on ? " on" : "")} disabled={!on && full} aria-pressed={on} onClick={() => tog(k)}>{on && <Ic.Check s={11} w={3} c="#FFF"/>}{l}</button>); })}</div>
        {q.max && <div className="qb-h" style={{ margin: "10px 0 0" }}>{cur.length} of {q.max} chosen</div>}
      </>
    );
  }
  function Band({ q, v, set }) {
    const b = IV.BANDS[q.bands], idx = b.findIndex((x) => x[0] === v), pct = idx < 0 ? 0 : (idx / (b.length - 1)) * 100;
    return (
      <div className="band">
        <div className="rail">
          <div className="fill" style={{ width: pct + "%" }}></div>
          {b.map(([k, l], i) => <button key={k} className={"stop" + (i === idx ? " on" : i < idx ? " past" : "")} style={{ left: (i / (b.length - 1)) * 100 + "%" }} aria-label={l} onClick={() => set(k)}><i></i></button>)}
        </div>
        <div className="lbls">{b.map(([k, l]) => <button key={k} className={v === k ? "on" : ""} onClick={() => set(k)}>{l}</button>)}</div>
        {q.skip && <button className={"skipq" + (v === "__skip" ? " on" : "")} onClick={() => set("__skip")}>{v === "__skip" ? "✓ " : ""}{q.skip}</button>}
      </div>
    );
  }

  function Text({ q, v, set }) {
    return <input className="otext" type="text" value={v || ""} placeholder={q.ph} maxLength={30} autoComplete="off" onChange={(e) => set(e.target.value)}/>;
  }

  function QBlock({ q, a, set, pre, onConfirm, solo }) {
    if (q.type === "note") return <div className="qnote"><Ic.Help s={15}/><span>{q.text}</span></div>;
    const C = { cards: Cards, seg: Seg, chips: Chips, band: Band, text: Text }[q.type];
    const lbl = IV.labelOf(q, a);
    return (
      <div className="qb">
        {(!solo && lbl) || pre ? (
          <div className="qb-l">{!solo && lbl}{pre && <span className="pre"><Ic.Help s={11}/> From earlier — is this right? <button onClick={onConfirm}>Yes</button></span>}</div>
        ) : null}
        {q.helper && !solo && <div className="qb-h">{q.helper}</div>}
        <C q={q} v={a[q.id]} set={(v) => set(q.id, v)} pre={pre}/>
      </div>
    );
  }

  function Panel({ a, curSec }) {
    const rows = IV.PANEL.map(([k, f]) => [k, f(a)]);
    const pre = a.__pre || {};
    const done = rows.filter((r) => r[1]).length, pct = Math.round((done / rows.length) * 100);
    const map = { Situation: "about", Relationship: "about", Children: "kids", "The home": "home", Income: "income", Savings: "money", Pensions: "pensions", Debts: "debts", Priorities: "goals" };
    const complex = Array.isArray(a.complex) && a.complex.some((x) => x !== "none");
    return (
      <div className="pp">
        <div className="pp-tab"><Ic.Lock s={10} c="#FFF"/> FORMING · PRIVATE</div>
        <div className="pp-card">
          <div className="pp-in">
            <div className="pp-t">Your picture so far</div>
            <div className="pp-s">Filling in as you answer.</div>
            <div className="pp-rows">{rows.map(([k, v]) => {
              const conf = (k === "Situation" && pre.stage) || (k === "Relationship" && pre.status);
              return (
                <div key={k} className={"pp-row" + (v ? (conf ? " conf" : " done") : "") + (map[k] === curSec ? " cur" : "")}>
                  <span className="d">{v && !conf ? <Ic.Check s={10} w={2.8} c="#166534"/> : <i></i>}</span>
                  <span className="k">{k}</span><span className="v">{v || "—"}</span>
                </div>);
            })}</div>
          </div>
          <div className="pp-foot"><div className="h"><span>Understanding you</span><span>{pct}%</span></div><div className="bar"><i style={{ width: pct + "%" }}></i></div></div>
        </div>
        {complex && <div className="pp-flag">We'll suggest specialist advice alongside Decouple for {IV.valLabel("complex", a).toLowerCase()}.</div>}
        <div className="pp-note"><Ic.Lock s={12}/> Nothing is shared with anyone. No account yet.</div>
      </div>
    );
  }

  function SaveModal({ onClose }) {
    const J = window.Journey, saved = (J.get().interview || {}).email;
    const [email, setEmail] = useState(saved || "");
    const [sent, setSent] = useState(false);
    const [err, setErr] = useState("");
    useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);
    const send = () => { if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("That doesn't look like an email address"); J.set("interview", { email }); setSent(true); };
    return (
      <div className="mscrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="mbox" role="dialog" aria-modal="true" aria-label="Save and finish later">
          <button className="mx" aria-label="Close" onClick={onClose}><Ic.X s={16}/></button>
          {!sent ? (
            <>
              <div className="kick">Save & finish later</div>
              <h3>We'll email you a private link.</h3>
              <p>Pick up exactly where you left off. The email won't mention separation — the subject line just says "Your Decouple link".</p>
              <label className="field">Email address<input type="email" value={email} autoFocus placeholder="you@example.com" onChange={(e) => { setEmail(e.target.value); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && send()}/>{err && <span className="err">{err}</span>}</label>
              <div className="mwarn"><Ic.Shield s={14} style={{ flexShrink: 0, marginTop: 2 }}/><span>Use an email address your partner can't see.</span></div>
              <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}><button className="btn lg" onClick={send}>Send my link <Ic.Arrow s={15}/></button><button className="btn lg ghost" onClick={onClose}>Keep going</button></div>
            </>
          ) : (
            <>
              <div className="safe-ic"><Ic.Check s={22} w={2.4} c="#166534"/></div>
              <h3>Link sent.</h3>
              <p>Check <b style={{ color: "#1A1A1A" }}>{email}</b>. The link works for 30 days. You can close this tab — your answers are saved.</p>
              <div style={{ marginTop: 20 }}><button className="btn lg" onClick={onClose}>Carry on now</button></div>
            </>
          )}
        </div>
      </div>
    );
  }

  function Neutral({ onBack }) {
    useEffect(() => { document.title = "Planting spring bulbs — a beginner's guide"; return () => { document.title = "Decouple — Proto 02 · Interview"; }; }, []);
    return (
      <div className="neutral">
        <div className="nh">The Garden Notebook</div>
        <article>
          <h1>Planting spring bulbs: a beginner's guide</h1>
          <p>Autumn is the time to plant tulips, daffodils and crocuses. Choose firm bulbs, plant them about three times as deep as they are tall, and space them a few centimetres apart.</p>
          <p>Most bulbs prefer well-drained soil and a sunny spot. Water them in after planting, then leave them be — they'll do the rest over winter.</p>
        </article>
        <div className="proto-note"><span>Prototype: quick exit simulated. In production this replaces the page with a neutral site and drops it from history.</span><button onClick={onBack}>Return</button></div>
      </div>
    );
  }

  Object.assign(window, { IVQBlock: QBlock, IVPanel: Panel, IVSave: SaveModal, IVNeutral: Neutral });
})();
