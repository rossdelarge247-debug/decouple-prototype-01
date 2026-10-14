/* MVP 01 · start screen and the wizard (Proto 02 question engine for the gating questions, item cards for the exact figures) */
(function () {
  const { useState, useEffect } = React;
  const Ic = window.DIc, MS = window.MS;
  const Back = (p) => <Ic.Arrow s={14} style={{ transform: "rotate(180deg)" }} {...p}/>;

  function Start({ onStart, resume, example }) {
    return (
      <main className="ms-start">
        <div className="ms-start-l">
          <div className="pill-kick"><span className="kick">A shared financial statement</span></div>
          <h1 className="serif">Get the figures straight, <span className="em">together.</span></h1>
          <p className="serif ms-lede">Instead of sending spreadsheets back and forth by email, you each fill in one statement. Then you check each other’s, see what’s missing, and agree it’s complete. It turns into the document your mediator or solicitor needs.</p>
          <ol className="ms-how">
            <li><b>1</b><div><strong>Your side</strong><span>What you own and owe, with exact figures and where each one comes from. About 20 minutes, and you can stop and come back.</span></div></li>
            <li><b>2</b><div><strong>Their side</strong><span>Invite your partner when you’re ready. They fill in theirs before they see yours.</span></div></li>
            <li><b>3</b><div><strong>Check it together</strong><span>One document, both sides. Anything missing or that doesn’t match is flagged, and you sort it out in comments.</span></div></li>
            <li><b>4</b><div><strong>Agree and download</strong><span>When you’re both satisfied: an open financial statement, the figures for a D81, or a Form E draft.</span></div></li>
          </ol>
          <div className="ms-cta">
            <button className="btn lg" onClick={onStart}>{resume ? "Carry on with my statement" : "Start my side"} <Ic.Arrow s={16}/></button>
            <span>{example ? "Sarah’s example figures are filled in. Change anything." : "Have your bank app and latest statements to hand."}</span>
          </div>
          <div className="ms-trust"><span><Ic.Lock s={13} c="#78716C"/> Nothing is shared until you invite them</span><span><Ic.Shield s={13} c="#78716C"/> Your address and phone are never shared</span></div>
        </div>
        <div className="ms-start-r" aria-hidden="true">
          <div className="ms-mini">
            <div className="ms-mini-h"><span>Shared statement</span><i>Sarah · Mark</i></div>
            {[["Family home", "£425,000", "£460,000", "mismatch"], ["Barclays joint account", "£4,200", "£4,200", "backed"], ["Mark’s workplace pension", "—", "not listed", "missing"], ["Monzo current account", "£1,850", "", "unbacked"]].map(([l, a, b, s]) => (
              <div key={l} className="ms-mini-r"><span className="l">{l}</span><span className="v">{a}</span><span className="v">{b}</span><span className="ms-st sm" style={{ color: MS.ST[s].c, background: MS.ST[s].bg }}>{MS.ST[s].t}</span></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* one thing you own or owe, precisely */
  function ItemCard({ it, cat, them, onChange, onRemove }) {
    const up = (p) => onChange({ ...it, ...p });
    const unknown = it.amount == null && it.unknown;
    const warn = [];
    if (it.src === "est" && it.amount != null) warn.push("An estimate is fine for now. It’ll go on your list to confirm with a document.");
    if (it.asOf && MS.old(it.asOf)) warn.push("Use a figure from the last few months if you can. Disclosure is as of today, not when you separated.");
    const money = (v) => (v === "" ? null : Math.max(0, Math.round(+String(v).replace(/[^\d.]/g, "")) || 0));
    return (
      <div className="ms-item">
        <div className="ms-item-h">
          <span className="ms-kind">{MS.kindLabel(cat, it.kind)}</span>
          <button className="ms-x" onClick={onRemove} aria-label={"Remove " + (it.label || "item")}><Ic.X s={14}/></button>
        </div>
        <div className="ms-f2">
          <label className="ms-fld"><span>Name or provider</span><input value={it.label} onChange={(e) => up({ label: e.target.value })} placeholder={cat === "income" ? "e.g. Salary from NHS Trust" : "e.g. Barclays current account"}/></label>
          {MS.jointOK(cat) && <div className="ms-fld"><span>Whose name is it in?</span><div className="oseg" role="radiogroup">{[["me", "Just mine"], ["joint", "Joint, with " + them]].map(([k, l]) => <button key={k} role="radio" aria-checked={it.whose === k} className={it.whose === k ? "on" : ""} onClick={() => up({ whose: k })}>{l}</button>)}</div></div>}
        </div>
        <div className="ms-f3">
          <label className="ms-fld"><span>{cat === "income" ? "Each month, after tax" : cat === "home" ? "What it’s worth" : cat === "debts" ? "Amount owed" : cat === "pensions" ? "Value (CETV if you have it)" : "Balance or value"}</span>
            <div className={"ms-money" + (unknown ? " off" : "")}><i>£</i><input inputMode="numeric" disabled={unknown} value={it.amount == null ? "" : it.amount.toLocaleString("en-GB")} onChange={(e) => up({ amount: money(e.target.value), unknown: false })} placeholder="Exact figure"/></div>
          </label>
          {cat === "home" && <label className="ms-fld"><span>Mortgage left to pay</span><div className="ms-money"><i>£</i><input inputMode="numeric" value={it.mortgage == null ? "" : it.mortgage.toLocaleString("en-GB")} onChange={(e) => up({ mortgage: money(e.target.value) })} placeholder="0 if none"/></div></label>}
          <label className="ms-fld"><span>As of</span><input type="month" value={it.asOf || ""} onChange={(e) => up({ asOf: e.target.value })}/></label>
        </div>
        <div className="ms-fld"><span>Where’s the figure from?</span><div className="oseg" role="radiogroup">{MS.srcOf(cat).map(([k, l]) => <button key={k} role="radio" aria-checked={it.src === k} className={it.src === k ? "on" : ""} onClick={() => up({ src: k })}>{l}</button>)}</div></div>
        <div className="ms-item-f">
          <label className="ms-chk"><input type="checkbox" checked={!!unknown} onChange={(e) => up({ unknown: e.target.checked, amount: e.target.checked ? null : it.amount })}/> I don’t know the figure yet. Add it to my list.</label>
          <Doc doc={it.doc} onDoc={(d) => up({ doc: d })}/>
        </div>
        {warn.map((w) => <div key={w} className="ms-warn"><Ic.Help s={13}/>{w}</div>)}
      </div>
    );
  }
  function Doc({ doc, onDoc, label }) {
    return doc ? (
      <span className="ms-doc on"><Ic.Check s={12} w={2.4}/>{doc.name}<button onClick={() => onDoc(null)} aria-label="Remove document"><Ic.X s={11}/></button></span>
    ) : (
      <label className="ms-doc"><Ic.Plus s={12}/>{label || "Add the document"}<input type="file" onChange={(e) => e.target.files[0] && onDoc({ name: e.target.files[0].name })}/></label>
    );
  }

  /* the wizard */
  function Wizard({ st, up, onDone, onBack }) {
    const a = st.a, them = a.them || "your partner";
    const SECS = [{ id: "about", name: "About you two", title: "First, the two of you.", help: "This decides which forms apply. It isn’t shared with anyone yet." }, ...MS.CATS.map((c) => ({ id: c.id, name: c.t, title: c.q, help: c.help, cat: c })), { id: "partner", name: "What " + them + " has", title: <>What do you think <span className="em">{them}</span> has in their own name?</>, help: "Only your best guess. It stays private, and it’s used to spot anything missing when " + them + " shares their side." }];
    const i = Math.max(0, SECS.findIndex((s) => s.id === st.pos)), sec = SECS[i];
    const set = (id, v) => up((o) => ({ ...o, a: { ...o.a, [id]: v } }));
    const items = st.items.filter((x) => x.cat === sec.id);
    const setItem = (n) => up((o) => ({ ...o, items: o.items.map((x) => (x.id === n.id ? n : x)) }));
    const addItem = (cat, kind) => up((o) => ({ ...o, items: [...o.items, { id: "u" + MS.rid(), cat, kind, label: "", whose: kind === "joint" || kind === "home" ? "joint" : "me", amount: null, asOf: "", src: MS.srcOf(cat)[0][0], doc: null }] }));
    const rmItem = (id) => up((o) => ({ ...o, items: o.items.filter((x) => x.id !== id) }));
    const hints = st.hints || [];
    const addHint = (cat, kind, l) => up((o) => ({ ...o, hints: [...(o.hints || []), { id: "h" + MS.rid(), cat, kind, label: them + "’s " + l.toLowerCase(), guess: null }] }));
    let qs = [], can = true;
    if (sec.id === "about") {
      qs = [
        { id: "me", type: "text", label: "Your first name", ph: "e.g. Sarah" },
        { id: "them", type: "text", label: "Their first name", ph: "e.g. Mark" },
        { id: "status", type: "cards", label: "Are you two…", opts: [["married", "Married"], ["civil", "In a civil partnership"], ["cohab", "Living together, not married", "Form E and D81 don’t apply, but a statement still helps"]] },
        { id: "sep", type: "seg", label: "When did you separate?", opts: [["not", "Not yet"], ["lt1", "Under a year ago"], ["1to2", "1–2 years"], ["gt2", "Over 2 years"]] },
      ];
      can = qs.every((q) => window.IV.answered(q, a));
    } else if (sec.cat) {
      qs = [{ id: "has_" + sec.id, type: "seg", label: null, opts: [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]] }];
      const h = a["has_" + sec.id];
      can = !!h && (h === "no" || (items.length > 0 && items.every((x) => x.label.trim() && (x.amount != null || x.unknown))));
    }
    const next = () => { if (!can) return; if (i === SECS.length - 1) onDone(); else up({ pos: SECS[i + 1].id }); };
    const back = () => (i === 0 ? onBack() : up({ pos: SECS[i - 1].id }));
    useEffect(() => { const k = (e) => { if (e.key === "Enter" && !/INPUT|TEXTAREA|BUTTON|SELECT/.test(e.target.tagName)) next(); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); });
    const h = a["has_" + sec.id];
    const total = st.items.length, firm = st.items.filter((x) => x.amount != null && x.src !== "est").length;
    return (
      <>
        <div className="iv-grid">
          <div style={{ "--c": "#5B21B6" }}>
            <div className="iv-kick">{sec.name}<span>step {i + 1} of {SECS.length}</span></div>
            <h2 className="iv-h">{sec.title}</h2>
            {sec.help && <p className="iv-help">{sec.help}</p>}
            {!!qs.length && <div className="qs">{qs.map((q) => <window.IVQBlock key={q.id} q={q} a={a} set={set}/>)}</div>}
            {sec.cat && (h === "yes" || h === "unsure") && (
              <div className="ms-items">
                {items.map((it) => <ItemCard key={it.id} it={it} cat={sec.id} them={them} onChange={setItem} onRemove={() => rmItem(it.id)}/>)}
                <div className="ms-add"><span>Add {items.length ? "another" : "one"}:</span>{MS.KINDS[sec.id].map(([k, l]) => <button key={k} onClick={() => addItem(sec.id, k)}><Ic.Plus s={12}/>{l}</button>)}</div>
                {h === "unsure" && <div className="ms-warn"><Ic.Help s={13}/>Not sure is fine. Add what you know; anything you’re unsure about goes on your list to check.</div>}
              </div>
            )}
            {sec.id === "partner" && (
              <div className="ms-items">
                {hints.map((x) => (
                  <div key={x.id} className="ms-hint">
                    <input value={x.label} onChange={(e) => up((o) => ({ ...o, hints: o.hints.map((y) => (y.id === x.id ? { ...y, label: e.target.value } : y)) }))} aria-label="What you think they have"/>
                    <div className="ms-money sm"><i>£</i><input inputMode="numeric" placeholder="Rough guess" value={x.guess == null ? "" : x.guess.toLocaleString("en-GB")} onChange={(e) => { const v = e.target.value === "" ? null : Math.round(+e.target.value.replace(/[^\d.]/g, "")) || 0; up((o) => ({ ...o, hints: o.hints.map((y) => (y.id === x.id ? { ...y, guess: v } : y)) })); }}/></div>
                    <button className="ms-x" onClick={() => up((o) => ({ ...o, hints: o.hints.filter((y) => y.id !== x.id) }))} aria-label="Remove"><Ic.X s={14}/></button>
                  </div>
                ))}
                <div className="ms-add"><span>{them} might have:</span>{[["pensions", "work", "Workplace pension"], ["accounts", "savings", "Savings account"], ["accounts", "current", "Current account"], ["assets", "shares", "Shares"], ["assets", "car", "Car"], ["assets", "business", "A business"], ["debts", "card", "Credit card debt"]].map(([c, k, l]) => <button key={c + k} onClick={() => addHint(c, k, l)}><Ic.Plus s={12}/>{l}</button>)}</div>
              </div>
            )}
            <div className="iv-nav desk">
              <button className="back" onClick={back}><Back/> Back</button>
              <button className="btn lg" disabled={!can} onClick={next}>{i === SECS.length - 1 ? "See my statement" : "Continue"} <Ic.Arrow s={15}/></button>
              <span className="hint">{can ? "or press Enter" : sec.cat && h && h !== "no" ? "Give each one a name and a figure, or tick “I don’t know yet”." : ""}</span>
            </div>
          </div>
          <aside className="iv-side">
            <div className="ms-side">
              <div className="ms-side-k"><Ic.Lock s={10} c="#FFF"/> YOUR SIDE · PRIVATE</div>
              <div className="ms-side-c">
                <b>Your statement so far</b>
                <div className="ms-side-rows">{MS.CATS.map((c) => { const n = st.items.filter((x) => x.cat === c.id); return <button key={c.id} className={c.id === sec.id ? "cur" : ""} onClick={() => up({ pos: c.id })}><span>{c.t}</span><i>{a["has_" + c.id] === "no" ? "None" : n.length ? n.length + (n.length === 1 ? " item" : " items") : "—"}</i></button>; })}</div>
                <div className="ms-side-m"><div><i style={{ width: (total ? (firm / total) * 100 : 0) + "%" }}></i></div><small>{firm} of {total} figures from a document or valuation</small></div>
              </div>
            </div>
          </aside>
        </div>
        <div className="mnav"><div className="row"><button className="back" aria-label="Back" onClick={back}><Back s={16}/></button><button className="btn lg" disabled={!can} onClick={next}>{i === SECS.length - 1 ? "See my statement" : "Continue"} <Ic.Arrow s={15}/></button></div></div>
      </>
    );
  }

  Object.assign(window, { MSStart: Start, MSWizard: Wizard, MSDoc: Doc });
})();
