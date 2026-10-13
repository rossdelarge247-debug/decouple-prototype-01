/* Finalise — court documents rendered close to the real forms. Free-text fields are editable by the lead party with tracked changes; Mark's comments pin to a field. */
(function () {
  const { useState, useContext } = React;
  const FN = window.FN, gbp = FN.gbp, fmtD = FN.fmtD;
  const DX = React.createContext(null);
  function diff(a, b) { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; while (i > 0 && a[i - 1] !== " ") i--; let j = 0; while (j < a.length - i && j < b.length - i && a[a.length - 1 - j] === b[b.length - 1 - j]) j++; while (j > 0 && a[a.length - j] !== " " && a.length - j > i) j--; return [a.slice(0, i), a.slice(i, a.length - j), b.slice(i, b.length - j), a.slice(a.length - j)]; }
  window.FNdiff = diff;

  function Ed(p) { const c = useContext(DX); return c.ce ? <CEd {...p} c={c}/> : <EdR {...p}/>; }
  const mk = (from, to, by) => { const [p, o, n, s2] = diff(from, to); return <>{p}{o && <del className={"by-" + by}>{o}</del>}{o && n ? " " : ""}{n && <ins className={"by-" + by}>{n}</ins>}{s2}</>; };
  function caretEnd(el) { el.focus(); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  const hsh = (x) => { let h = 0; for (let i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  function Fx({ id, base, lbl }) { const c = useContext(DX); if (c.ce && c.open) return <CEd id={id} base={base} lbl={lbl} c={c}/>; const e = c.edits[id]; return e ? e.to : base; }
  function CEd({ id, base, c, lbl, kind }) {
    const e = c.edits[id], txt = kind === "term" ? (c.terms || {})[id] || base : e ? e.to : base, sg = c.sugs.find((x) => x.at === id && x.st === "open"), [on, setOn] = useState(false), ref = React.useRef(null);
    const theirs = sg && sg.by !== c.me, shown = sg ? sg.to : txt;
    const begin = () => { if (theirs || c.locked || on) return; setOn(true); setTimeout(() => ref.current && caretEnd(ref.current), 0); };
    const end = () => { const v = ref.current.innerText.replace(/\s+/g, " ").trim(); setOn(false); if (v !== shown) c.onSug(id, txt, v, { lbl, kind, doc: c.doc }); };
    if (on) return <span ref={ref} className="ce-e on" contentEditable suppressContentEditableWarning onBlur={end} onKeyDown={(ev) => { if (ev.key === "Escape") { ref.current.innerText = shown; ref.current.blur(); } }}>{shown}</span>;
    return <span id={"fe-" + id} className={"ce-e" + (c.open ? " k-all" : "") + (sg ? " s-" + sg.by : "") + (c.locked ? " ro" : "") + (c.focus === id ? " foc" + (sg ? " fb-" + sg.by : "") : "")} onClick={begin} title={theirs ? `${c.OT} has suggested a change here. Accept or reject it first.` : c.locked ? undefined : "Click to suggest a change"}>{sg && c.markup ? mk(txt, sg.to, sg.by) : shown}{c.markAt === id && <span className="ce-cur" contentEditable={false}><i>{c.OT}</i></span>}</span>;
  }
  function CLk({ id, t, lbl, c }) {
    if (c.open) return <CEd id={id} base={t} c={c} lbl={lbl} kind="term"/>;
    return <CLkR id={id} t={t} lbl={lbl} c={c}/>;
  }
  function CLkR({ id, t, lbl, c }) {
    const txt = (c.terms || {})[id] || t, sg = c.sugs.find((x) => x.at === id && x.st === "open"), [ed, setEd] = useState(false), [v, setV] = useState(txt), [why, setWhy] = useState("");
    if (ed) return <span className="ce-req"><span className="hd"><b>Request a change to an agreed term</b><small>{`${c.OT} has to agree. If they do, we update your signed agreement in Proposals.`}</small></span><textarea autoFocus value={v} rows={Math.max(3, Math.ceil(v.length / 80))} onChange={(ev) => setV(ev.target.value)}/><input value={why} placeholder={`Why? ${c.OT} sees this.`} onChange={(ev) => setWhy(ev.target.value)}/><span className="b"><button className="btn sm" disabled={v.trim() === txt || !why.trim()} onClick={() => { c.onSug(id, txt, v.trim(), { kind: "term", why: why.trim(), lbl }); setEd(false); }}>{`Send to ${c.OT}`}</button><button className="lnk" onClick={() => setEd(false)}>Cancel</button></span></span>;
    return <span id={"fe-" + id} className={"ce-lk" + (sg ? " s-" + sg.by : "") + (c.focus === id ? " foc" + (sg ? " fb-" + sg.by : "") : "")}>{sg && c.markup ? mk(txt, sg.to, sg.by) : txt}{c.markAt === id && <span className="ce-cur"><i>{c.OT}</i></span>}{sg ? <em className="ce-rqb">{sg.by === c.me ? `Waiting for ${c.OT}` : `${c.OT} wants to change this`}</em> : !c.locked && <button className="ce-rq" onClick={() => { setV(txt); setWhy(""); setEd(true); }}><svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2.5" y="5.5" width="7" height="5" rx="1"/><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5"/></svg>Request change</button>}</span>;
  }
  function EdR({ id, base }) {
    const c = useContext(DX), e = c.edits[id], txt = e ? e.to : base;
    const pins = c.comments.filter((x) => x.at === id && x.st === "open");
    const [v, setV] = useState(txt);
    if (c.editing === id) return <span className="fm-edit"><textarea autoFocus value={v} rows={Math.max(3, Math.ceil(v.length / 78))} onChange={(ev) => setV(ev.target.value)}/><span className="b"><button className="btn sm" onClick={() => c.save(id, base, v)}>Save change</button><button className="lnk" onClick={() => c.setEditing(null)}>Cancel</button><small>Shown to {c.B} as a tracked change</small></span></span>;
    const body = e && c.markup ? (() => { const [p, o, n, s] = diff(e.from, e.to); return <>{p}{o && <del>{o}</del>}{o && n ? " " : ""}{n && <ins>{n}</ins>}{s}</>; })() : txt;
    return <span id={"fe-" + id} className={"fm-e" + (c.canEdit ? " can" : "") + (pins.length ? " pinned" : "") + (c.focus === id ? " foc" + (sg ? " fb-" + sg.by : "") : "")} onClick={c.canEdit ? () => { setV(txt); c.setEditing(id); } : undefined} title={c.canEdit ? "Click to edit" : undefined}>{body}{pins.map((p) => <button key={p.id} className="fm-pin" title={`${c.B}'s comment`} onClick={(ev) => { ev.stopPropagation(); c.openC(p.id); }}>{c.B[0]}</button>)}</span>;
  }
  const Tick = () => <svg viewBox="0 0 12 12" aria-hidden="true"><polyline points="2 6.5 5 9.2 10.2 2.8"/></svg>;
  const txtOf = (n) => (n == null || typeof n === "boolean" ? "" : typeof n === "string" || typeof n === "number" ? String(n) : Array.isArray(n) ? n.map(txtOf).join("") : n.props ? txtOf(n.props.children) : "");
  function Tk({ on, children, sub }) {
    const c = useContext(DX), lab = txtOf(children), id = "k." + ((c && c.doc) || "") + "." + hsh(lab), e = c && c.edits[id], cur = e ? e.to === "1" : !!on;
    const sg = c && c.ce && c.sugs.find((x) => x.at === id && x.st === "open"), shown = sg ? sg.to === "1" : cur, can = c && c.ce && c.open && !c.locked && !(sg && sg.by !== c.me);
    return <div id={"fe-" + id} className={"fm-tk" + (can ? " can" : "") + (sg ? " s-" + sg.by : "") + (c && c.focus === id ? " foc" : "")} onClick={can ? () => c.onSug(id, cur ? "1" : "0", shown ? "0" : "1", { lbl: "Tick box", doc: c.doc, tick: lab.length > 90 ? lab.slice(0, 88) + "…" : lab }) : undefined}><span className={"bx" + (shown ? " on" : "")}>{shown && <Tick/>}</span><span>{children}{sub && <small>{sub}</small>}</span>{sg && <em className="ce-rqb">{sg.by === c.me ? "Suggested" : `${c.OT} suggested`}</em>}</div>;
  }
  const Bx = ({ l, v, h, w, mono }) => <div className="fm-bx" style={w ? { maxWidth: w } : null}>{l && <span className="l">{l}</span>}<span className={"v" + (mono ? " mono" : "")} style={h ? { minHeight: h } : null}>{typeof v === "string" && v ? <Fx id={"x." + hsh((l || "") + "|" + v)} base={v} lbl={l || "Field"}/> : v}</span></div>;
  const Dt = ({ l, iso }) => { const [y, m, d] = iso ? iso.split("-") : ["", "", ""]; return <div className="fm-dt">{l && <span className="l">{l}</span>}<div className="r"><span><small>Day</small><b>{d}</b></span><span><small>Month</small><b>{m}</b></span><span className="y"><small>Year</small><b>{y}</b></span></div></div>; };
  const Q = ({ n, t, children, note }) => <div className={"fm-q" + (note ? "" : " wide")}><div className="m"><div className="qt"><b>{n}</b><span>{t}</span></div><div className="qa">{children}</div></div>{note && <aside className="fm-note">{note}</aside>}</div>;
  const ARMS = "https://commons.wikimedia.org/wiki/Special:FilePath/Coat_of_arms_of_the_United_Kingdom_(black_and_white).svg";
  const Arms = ({ h = 40 }) => <img className="hm-arms" src={ARMS} alt="Royal coat of arms" style={{ height: h }} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}/>;
  const HM = () => <div className="hm-lk"><Arms h={42}/><span>HM Courts &amp;<br/>Tribunals Service</span></div>;
  const CU = () => <div className="hm-cu"><b>For court use only</b><span><small>Date received</small></span><span><small>Fee paid / HWF ref</small></span><span className="seal"><small>Court seal</small></span></div>;
  const Page = ({ foot, n, children, cls = "", code }) => { const off = !cls.includes("sm"); return <section className={"fm-page " + cls}>{off && <div className="hm-ill" title="Prototype only">Illustrative · not an official HMCTS document</div>}<div className="fm-in">{children}</div><footer className="fm-foot"><span>{foot}{off && <small>{code || "© Crown copyright 2025"}</small>}</span><b>{`Page ${n}`}</b></footer></section>; };
  const M = (n) => (n == null ? "" : n === 0 ? "£0" : (n < 0 ? "−£" : "£") + Math.abs(Math.round(n)).toLocaleString("en-GB"));
  const Tb = ({ head, rows, kids }) => <table className="fm-tb"><thead><tr><th className="k"></th><th>{head}</th><th>Applicant</th><th>Respondent</th><th>Child(ren)<small>(if applicable)</small></th></tr></thead><tbody>{rows.map(([k, l, v, tot]) => <tr key={k} className={tot ? "tot" : ""}><td className="k">{k}</td><td>{l}</td><td>{M(v[0])}</td><td>{M(v[1])}</td><td>{kids ? "£0" : "N/A"}</td></tr>)}</tbody></table>;
  const SigImg = ({ g, nm }) => (g.src ? <img className="fm-sgi" src={g.src} alt={"Signature of " + nm}/> : <i className={"fm-sgt " + (g.font || "f1")}>{g.txt || nm}</i>);
  function Sig({ who, s, nm, d, k }) {
    const c = useContext(DX) || {}, doc = c.doc, g = k && c.dsig && c.dsig[doc] && c.dsig[doc][k], on = !!g || (s && (c.locked || !(c.resign || []).includes(doc)));
    let v;
    if (on) v = <SigImg g={g || { kind: "type", txt: nm, font: k === "b" ? "f1" : "f2" }} nm={nm}/>;
    else if (c.ce && k === c.me && !c.locked) { const q = c.canSign(doc); v = <button className={"fm-sgb" + (q.ok ? "" : " off")} disabled={!q.ok} onClick={() => c.openSig(doc)}><svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15c3-6 5-8 6-6s-2 6 0 6 3-4 5-4 1 3 3 3"/></svg>{c.qLbl(q, "Click to sign")}</button>; }
    else v = <em>Awaiting {who}</em>;
    return <div className={"fm-sig" + (on ? " on" : "")}><span className="l">Signed</span><span className="v">{v}</span><span className="l">Date</span><span className="v sm">{on ? (g ? g.at : d) : ""}</span></div>;
  }
  const capRows = (c, tot) => [["A", <>Property 1 Value (after deducting any mortgage(s))<small>12 Oak Road, Exeter EX1 2AB</small></>, c.A], ["B", "Other capital, such as money in bank accounts, savings, investments, ISAs, vehicles etc.", c.B], ["C", <b>Gross capital total (A plus B)</b>, c.C, 1], ["D", "Liabilities (excluding mortgage(s) deducted at A) e.g. loans, overdrafts and credit card debts", c.D], ["E", <b>Net capital total (excluding pensions and PPF compensation) (C minus D)</b>, c.E, 1], ["F", "Pensions valuation (cash equivalent) (see question 12)", c.F], ["G", "PPF compensation valuation", c.G], ["H", <b>{tot}</b>, c.H, 1]];
  const incRows = (i) => [["A", "Earned income after tax and NI contributions have been paid", i.A], ["B", "State Benefits (including child benefit)", i.B], ["C", "Pension income and PPF compensation payments", i.C], ["D", "Interest from bank accounts", i.D], ["E", "Other sources of income", i.E], ["F", <b>Sub-Total (A + B + C + D + E)</b>, i.F, 1], ["G", "Child support/child maintenance paid between the parties", i.G], ["H", "Spousal maintenance paid between the parties", i.H], ["I", <b>Sub-Total (G + H)</b>, i.I, 1], ["J", "Child maintenance received from a person who is not a party", i.L], ["K", "Maintenance paid to a person who is not a party", i.L], ["L", <b>Sub-total (J + K)</b>, i.L, 1], ["M", <b>Grand Total (F + I + L)</b>, i.M, 1]];

  /* ---------------- Consent order ---------------- */
  function Order({ m, det, sign }) {
    const c = useContext(DX), F = `Draft order · Financial remedy final order (consent) · ${det.caseNo}`;
    const Hd = <><div className="co-arms"><Arms h={58}/><span className="co-seal">Seal</span></div><div className="co-hd"><div className="co-ct"><b>IN THE FAMILY COURT</b><span>sitting at <em className="tbc">[to be allocated by the court]</em></span></div><div className="co-no"><small>Case number</small><b className="mono">{det.caseNo}</b></div></div></>;
    const groups = m.C;
    const split = Math.ceil(groups.length / 2);
    return <>
      <Page foot={F} n={1} cls="co" code="Standard Order 2.1 · Standard Family Orders Vol. 1 (Financial and Enforcement) · approved by the President of the Family Division">
        {Hd}
        <div className="co-acts"><span>The Matrimonial Causes Act 1973</span>{m.cm > 0 && <span>The Child Support Act 1991</span>}</div>
        <div className="co-ttl">The marriage of {det.aFull} and {det.bFull}</div>
        <table className="co-pt"><tbody><tr><td>Applicant</td><td><b>{det.aFull.toUpperCase()}</b></td></tr><tr><td>Respondent</td><td><b>{det.bFull.toUpperCase()}</b></td></tr></tbody></table>
        <h2 className="co-h1">Financial remedy order<small>(consent order)</small></h2>
        <p className="co-made">Order made by <em className="tbc">[District Judge — to be completed by the court]</em> on <em className="tbc">[date]</em>, sitting in private, on consideration of the papers.</p>
        <h3 className="co-h">Definitions</h3>
        <ol className="co-def"><li>“the Property” means 12 Oak Road, Exeter EX1 2AB, registered at HM Land Registry under title number <span className="mono">{det.title}</span>.</li>{m.pct && <li>“the Applicant’s pension” means the Applicant’s rights under the NHS Pension Scheme, membership number <span className="mono">{det.nhsRef}</span>.</li>}{m.kids && <li>“the children” means {det.k1} (born {fmtD(det.k1Dob)}) and {det.k2} (born {fmtD(det.k2Dob)}).</li>}</ol>
        <h3 className="co-h">Recitals</h3>
        <p className="co-lead">The parties agree that:</p>
        <ol className="co-rec" type="A">{m.R.map((r, i) => <li key={r.id}>{r.ed ? <Ed id={r.id} base={r.t}/> : <Fx id={"x.co." + r.id} base={r.t} lbl={`Recital ${String.fromCharCode(65 + i)}`}/>}</li>)}</ol>
      </Page>
      {[groups.slice(0, split), groups.slice(split)].map((gs, pi) => <Page key={pi} foot={F} n={pi + 2} cls="co" code="Standard Order 2.1 · Standard Family Orders Vol. 1 (Financial and Enforcement)">
        {pi === 0 && <h3 className="co-h">By consent it is ordered that</h3>}
        {gs.map((g) => <div key={g.id} className="co-g"><h4>{g.h}</h4>{g.items.map((it) => <p key={it.n} className="co-cl"><b>{it.n}.</b><span>{it.pre}{it.ed ? <Ed id={it.id} base={it.t}/> : c.ce ? <CLk id={"t." + g.id + "." + it.n} t={it.t} lbl={`Clause ${it.n} · ${g.h}`} c={c}/> : <span className={it.lk ? "fm-lk" : ""} title={it.lk ? `From your signed agreement (v${m.finalN}).` : undefined}>{(c.terms || {})["t." + g.id + "." + it.n] || it.t}</span>}{it.post}</span></p>)}</div>)}
        {pi === 1 && <><h3 className="co-h">We agree to an order in these terms</h3><div className="fm-sigs"><div><small>Applicant</small><b>{det.aFull}</b><Sig k="a" who={c.A} s={sign.a} nm={det.aFull} d={sign.ad}/></div><div><small>Respondent</small><b>{det.bFull}</b><Sig k="b" who={c.B} s={sign.b} nm={det.bFull} d={sign.bd}/></div></div>
          <div className="co-dated"><span>Dated</span><em className="tbc">[to be completed by the court]</em></div>
          <div className="co-office">The court office at <em className="tbc">[the allocated court]</em> is open between 10am and 4pm Monday to Friday. When corresponding with the court, please address forms or letters to the Court Manager and quote the case number. If you do not quote this number, there may be a delay in dealing with your correspondence.</div></>}
      </Page>)}
    </>;
  }

  /* ---------------- Form A ---------------- */
  function FormA({ m, det, sign }) {
    const F = "Form A Notice of an application for a financial order (04.24)", CD = "© Crown copyright 2024 · Family Procedure Rules 2010, rule 9.4";
    return <>
      <Page foot={F} n={1} cls="gf" code={CD}>
        <div className="gf-mast"><HM/><span className="fc">Form A</span></div><div className="gf-top"><div><h1>Notice of an application for a financial order</h1><p className="sub">Form A · to be used for a financial order in the Family Court</p></div><div className="gf-fields"><Bx l="Name of court" v="Family Court"/><Bx l="Case no." v={det.caseNo} mono/><Bx l="Name of applicant" v={det.aFull}/><Bx l="Name of respondent" v={det.bFull}/><CU/></div></div>
        <div className="gf-bar">Section 1 · The application</div>
        <Q n="1.1" t="Is this an application for a consent order?" note="If you have agreed the terms of an order, tick Yes and attach the draft order and Form D81."><Tk on>Yes — the parties have agreed the terms of the attached draft order</Tk><Tk>No</Tk></Q>
        <Q n="1.2" t="Do you need to attend a MIAM (mediation information and assessment meeting)?" note="A MIAM isn't needed for an application for a consent order."><Tk on>No — this is an application for a consent order</Tk></Q>
        <Q n="1.3" t="The applicant applies for:"><Tk on={m.spAmt > 0}>an order for periodical payments</Tk><Tk on={!!m.lump}>a lump sum order</Tk><Tk on={m.hm !== "now"}>a property adjustment order</Tk><Tk on={!!m.pct}>a pension sharing order</Tk><Tk>a pension attachment order</Tk><Tk>a pension compensation sharing order</Tk><Tk on={m.cm > 0}>periodical payments for the benefit of the children</Tk></Q>
        {m.cm > 0 && <Q n="1.4" t="If you are applying for periodical payments for the children, tick the box that applies:" note="The court can only make a child maintenance order by consent, or in the cases listed."><Tk on>the order would be in the same terms as a written agreement between the parties (s.8(5) Child Support Act 1991)</Tk><Tk>there is a Child Maintenance Service calculation in force</Tk></Q>}
      </Page>
      <Page foot={F} n={2} cls="gf">
        <div className="gf-bar">Section 2 · Property and pensions</div>
        <Q n="2.1" t="Address of the property"><Bx v="12 Oak Road, Exeter EX1 2AB"/><div className="gf-2"><Bx l="HM Land Registry title number" v={det.title} mono/><Bx l="Mortgage lender and account" v={`${det.lender}, ${det.mortRef}`}/></div></Q>
        {m.pct && <Q n="2.2" t="Pension arrangement" note="You must also attach the pension sharing annex (Form P1)."><Bx v={`NHS Pension Scheme · ${det.nhsRef}`}/></Q>}
        <div className="gf-bar">Section 3 · Statement of truth</div>
        <p className="gf-st"><b>I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.</b></p>
        <Tk on={sign.a}><b>I believe</b> that the facts stated in this form are true.</Tk>
        <div className="gf-2"><Sig k="a" who="the applicant" s={sign.a} nm={det.aFull} d={sign.ad}/><Bx l="Full name" v={det.aFull}/></div>
      </Page>
    </>;
  }

  /* ---------------- D81 (04.25, joint form) ---------------- */
  function D81({ m, det, sign }) {
    const F = "D81 Statement of information for a consent order in relation to a financial remedy (04.25)", d = m.d81;
    let n = 0; const P = (props) => <Page foot={F} n={++n} cls="gf" code="© Crown copyright 2025 · Family Procedure Rules 2010, rule 9.26" {...props}/>;
    const rel = (k) => [["none", "I have no intention, at present, to remarry/enter into a new civil partnership or cohabit"], ["cohab", "I am in a cohabiting relationship"], ["intend", "I intend to remarry/form a civil partnership"], ["cohabint", "I intend to cohabit"]].map(([v, l]) => <Tk key={v} on={det[k] === v}>{l}</Tk>);
    return <>
      <P><div className="gf-mast"><HM/><span className="fc">D81</span></div><div className="gf-top"><div><h1>Statement of information for a consent order in relation to a financial remedy</h1></div><div className="gf-fields"><Bx l="Name of court" v="Family Court"/><Bx l="Case no." v={det.caseNo} mono/><Bx l="Name of applicant" v={det.aFull}/><Bx l="Name of respondent" v={det.bFull}/><CU/></div></div>
        <Q t="Are you filling in your own separate D81 form rather than a joint one?" note="Parties are encouraged to fill in one joint form unless there is a good reason not to."><Tk>Yes. Give reasons why</Tk><Tk on>No. This is being submitted as a joint form.</Tk></Q></P>
      <P><h2 className="gf-h">Details of the marriage/civil partnership</h2>
        <Q n="1." t="On what date did you get married or form a civil partnership?"><Dt iso={det.married}/></Q>
        <Q n="2." t="On what date did you separate?"><Dt iso={det.separated}/></Q>
        <Q n="3." t="On what date did the court grant your decree nisi/conditional order?" note="If you don't have one, the court can't make a consent order (except for interim maintenance)."><Dt iso={det.coDate}/></Q>
        <Q n="4." t="Is the consent order for interim maintenance?"><Tk>Yes</Tk><Tk on>No</Tk></Q>
        <Q n="5." t="Has the decree absolute/final order been granted?"><Tk>Yes, it was granted on</Tk><Tk on>No, it has not yet been granted</Tk></Q>
        <h2 className="gf-h">Dates of birth of the parties and any relevant child(ren)</h2>
        <Q n="6." t="What are the dates of birth of the"><div className="gf-2"><Dt l="Applicant" iso={det.aDob}/><Dt l="Respondent" iso={det.bDob}/></div>{m.kids && [[det.k1, det.k1Dob], [det.k2, det.k2Dob]].map(([nm, dob], i) => <div key={i} className="gf-2"><Bx l={`Child ${i + 1} · Full name`} v={nm}/><Dt iso={dob}/></div>)}</Q></P>
      <P><h2 className="gf-h">Financial agreements</h2>
        <Q n="7." t="How was the proposed consent order, attached to this form, reached?"><Tk>Discussion between parties</Tk><Tk>Negotiations through solicitors</Tk><Tk>Out-of-court dispute resolution <small>(for example, mediation, negotiation or other collaborative process)</small></Tk><Tk on>Other (use the box below to explain)</Tk><div className="fm-ta"><Ed id="d.q7" base={m.q7}/></div></Q>
        <h2 className="gf-h">Current capital and income</h2>
        <div className="gf-shade">The information should be stated <b>before</b> implementation of the proposed consent order.</div>
        <Q n="8." t="Money and property"><Tb head="Type of capital" rows={capRows(d.cap1, "Total capital (E + F + G)")} kids={m.kids}/></Q></P>
      <P><Q n="9." t="Net income · total net monthly income from all sources"><Tb head="Income" rows={incRows(d.inc1)} kids={m.kids}/></Q></P>
      <P><h2 className="gf-h">Capital and income after the implementation of proposed order</h2>
        <div className="gf-shade">Tables at 10 and 11 must show what the capital and income position would be if the proposed consent order is made.</div>
        <Q n="10." t="Money and property"><Tb head="Type of capital" rows={capRows(d.cap2, "Total capital and pensions (E + F + G)")} kids={m.kids}/></Q></P>
      <P><Q n="11." t="Net income · total net monthly income from all sources"><Tb head="Income" rows={incRows(d.inc2)} kids={m.kids}/></Q>
        <Q n="12." t="Are there any other matters relating to the proposed consent order that the court should consider?" note="For example medical conditions, a change of employment, or a pre-nuptial agreement."><Tk on={det.other === "yes"}>Yes, there are</Tk>{det.other === "yes" && <div className="fm-ta"><Ed id="d.q12" base={det.otherTxt || "—"}/></div>}<Tk on={det.other !== "yes"}>No</Tk></Q></P>
      <P><Q n="13." t="Please explain concisely the main reasons for your proposed consent order’s division of assets" note="If the order offsets pension against other assets, explain briefly how the offsetting was agreed."><div className="fm-ta tall">{m.q13.map((p) => <p key={p.id}><Ed id={p.id} base={p.t}/></p>)}</div></Q>
        <Q n="14." t="If maintenance claims would be dismissed (i.e. there is to be a clean break), explain briefly how each party will support themselves."><div className="fm-ta"><Ed id="d.q14" base={m.q14}/></div></Q></P>
      <P><Q n="15." t="Tell us where you, your spouse and children will live, and the basis on which each property will be occupied."><table className="fm-tb q15"><thead><tr><th></th><th>Address</th><th>Basis of occupation of property</th></tr></thead><tbody><tr><td>Applicant</td><td>{det.aAddr}</td><td>{m.hm === "later" ? "Joint owner — sole occupation until sale" : m.hm === "keep" ? "Owner (after transfer)" : "To be decided on sale"}</td></tr><tr><td>Respondent</td><td>{det.bAddr}</td><td>{det.bBasis}</td></tr>{m.kids && [det.k1, det.k2].map((k) => <tr key={k}><td>{k}</td><td>{det.aAddr}</td><td>{m.shared ? "Lives equally with both parties" : "Lives with the applicant"}</td></tr>)}</tbody></table></Q>
        <Q n="16." t="New relationships"><div className="gf-sub">Applicant</div>{rel("aRel")}<div className="gf-sub">Respondent</div>{rel("bRel")}</Q></P>
      <P><h2 className="gf-h">Notice to mortgage provider</h2>
        <Q n="17" t="Do the terms of the consent order provide for a transfer of property?"><Tk on={d.transfer}>Yes, go to question 17.1</Tk><Tk on={!d.transfer}>No, go to question 18</Tk></Q>
        {d.transfer && <><Q n="17.1" t="Have the mortgage provider(s) been served with notice of the application?"><Tk on>Yes</Tk><Tk>No</Tk></Q><Q n="17.2" t="Has any objection been made by any mortgage provider within 14 days?"><Tk>Yes</Tk><Tk on>No</Tk></Q></>}
        <h2 className="gf-h">Pension orders</h2>
        <Q n="18." t="Are you applying for a pension order?"><Tk on={d.pso}>Yes</Tk><Tk on={!d.pso}>No, go to question 23</Tk></Q>
        {d.pso && <><Q n="19." t="Has notice been served on every person responsible for any pension arrangement (pension attachment)?" note="Only for attachment orders. Not applicable to a sharing order."><Tk>Yes</Tk><Tk>No</Tk></Q>
          <Q n="21." t="Has the pension arrangement provided the information required by Regulation 4 of the Pensions on Divorce etc. (Provision of Information) Regulations 2000?"><Tk on={det.pinfo === "yes"}>Yes</Tk><Tk on={det.pinfo !== "yes"}>No</Tk></Q>
          <Q n="21.1" t="Does it appear from that information that there is power to make an order including provision under section 24B of the Matrimonial Causes Act 1973 (pension sharing)?"><Tk on>Yes</Tk><Tk>No</Tk></Q></>}</P>
      <P><h2 className="gf-h">Proposed consent order</h2>
        <div className="gf-shade"><b>Important.</b> It is important that the proposed consent order is as clear as possible. It has been drafted from the Standard Orders Volume 1 (Financial and Enforcement Orders).</div>
        <Q n="23." t="Applicant’s full name"><Bx v={det.aFull}/><p className="gf-p">I confirm that I have read the completed statement of information for a consent order from the respondent.</p><Sig k="a" who="the applicant" s={sign.a} nm={det.aFull} d={sign.ad}/></Q>
        <Q n="24." t="Respondent’s full name"><Bx v={det.bFull}/><p className="gf-p">I confirm that I have read the completed statement of information for a consent order from the applicant.</p><Sig k="b" who="the respondent" s={sign.b} nm={det.bFull} d={sign.bd}/></Q></P>
      {[["Applicant", "a", det.aFull], ["Respondent", "b", det.bFull]].map(([r, k, nm]) => <P key={k}><h2 className="gf-h">{r}’s statement of truth</h2>
        <p className="gf-st"><b>I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.</b></p>
        <Tk on={sign[k]}><b>I believe</b> that the facts stated in this Statement of Information for a consent order are true and I have made full disclosure of all relevant facts.</Tk>
        <Tk><b>The {r.toLowerCase()} believes</b> that the facts stated in this Statement of Information are true. <b>I am authorised</b> by the {r.toLowerCase()} to sign this statement.</Tk>
        <Sig k={k} who={r === "Applicant" ? "the applicant" : "the respondent"} s={sign[k]} nm={nm} d={sign[k + "d"]}/><Tk on={sign[k]}>{r}</Tk><Tk>Litigation friend</Tk><Tk>Solicitor</Tk><Bx l="Full name" v={nm}/></P>)}
    </>;
  }

  /* ---------------- Form P1 ---------------- */
  function P1({ m, det }) {
    const F = "P1 Pension sharing annex under section 24B of the Matrimonial Causes Act 1973";
    if (!m.pct) return <Page foot={F} n={1} cls="gf"><div className="fm-na">No pension sharing order in this agreement, so no Form P1 is needed.</div></Page>;
    return <>
      <Page foot={F} n={1} cls="gf">
        <div className="gf-mast"><HM/><span className="fc">P1</span></div><div className="gf-top"><div><h1>Pension sharing annex</h1><p className="sub">Form P1 · under section 24B of the Matrimonial Causes Act 1973</p></div><div className="gf-fields"><Bx l="Name of court" v="Family Court"/><Bx l="Case no." v={det.caseNo} mono/><Bx l="Transferor" v={det.aFull}/><Bx l="Transferee" v={det.bFull}/></div></div>
        <div className="gf-shade">This annex is attached to the consent order. Take notice that the court has made a pension sharing order. It must be sent to the person responsible for the pension arrangement.</div>
        <div className="gf-bar">Section A · The transferor’s pension arrangement</div>
        <Bx l="Name of the arrangement" v="NHS Pension Scheme (2015 Scheme)"/><Bx l="Address of the person responsible" v="NHS Business Services Authority, NHS Pensions, Hesketh House, 200–220 Broadway, Fleetwood FY7 8LG"/><Bx l="Membership or reference number" v={det.nhsRef} mono/>
        <div className="gf-bar">Section B · The transferor</div>
        <div className="gf-2"><Bx l="Full name" v={det.aFull}/><Bx l="National Insurance number" v={det.aNi} mono/></div><div className="gf-2"><Dt l="Date of birth" iso={det.aDob}/><Bx l="Address" v={det.aAddr}/></div>
        <div className="gf-bar">Section C · The transferee</div>
        <div className="gf-2"><Bx l="Full name" v={det.bFull}/><Bx l="National Insurance number" v={det.bNi} mono/></div><div className="gf-2"><Dt l="Date of birth" iso={det.bDob}/><Bx l="Address" v={det.bAddr}/></div>
      </Page>
      <Page foot={F} n={2} cls="gf">
        <div className="gf-bar">Section D · The order</div>
        <Q t="Specified percentage of the cash equivalent of the transferor’s rights to be transferred" note={`Cash equivalent at the date of the last valuation: £112,400. This share is worth about ${gbp(m.tr)}.`}><Bx v={<span className="fm-lk big">{m.pct}%</span>} w={160}/></Q>
        <Q t="The order takes effect on" note="A pension sharing order can't take effect before the final order of divorce, or before the appeal period has ended."><Tk on>the later of the date of the final order of divorce and 28 days after the date of this order</Tk></Q>
        <div className="gf-bar">Section E · Pension sharing charges</div>
        <Q t="The charges of the person responsible for the arrangement are to be apportioned:"><Tk>wholly to the transferor</Tk><Tk>wholly to the transferee</Tk><Tk on>equally between the transferor and the transferee</Tk></Q>
        <div className="gf-bar">Section F · The transferee’s pension credit</div>
        <Q t="How will the pension credit be implemented?" note="The NHS Pension Scheme is an unfunded public service scheme, so the pension credit stays inside the scheme."><Tk on>internal transfer — the transferee becomes a pension credit member of the NHS Pension Scheme</Tk><Tk>external transfer to a qualifying arrangement nominated by the transferee</Tk></Q>
        <Q t="Information pack" note="The scheme's information under Regulation 4 of the Pensions on Divorce etc. (Provision of Information) Regulations 2000."><Tk on={det.pinfo === "yes"}>The person responsible for the arrangement has provided the required information</Tk></Q>
      </Page>
    </>;
  }

  /* ---------------- Plain summary ---------------- */
  function Summary({ m, det, S, agreed, N }) {
    return <Page foot="Decouple · plain-language summary · for your records, not filed" n={1} cls="sm">
      <div className="sm-hd"><span className="wm">Decouple<i>.</i></span><span className="mono">{`v${m.finalN} FINAL · ${det.caseNo}`}</span></div>
      <h2>What you’ve agreed, in plain English</h2>
      <p className="sm-lead">{`${N.Me} and ${N.Them} · signed ${m.signedOn || "2 October 2026"}. The court documents say the same thing in legal language.`}</p>
      <div className="sm-rows">{S.map((s) => { const o = window.ST.opt(s, agreed[s.id]); return <div key={s.id} className="sm-r"><b>{s.t}</b><span>{o ? o.t : "As agreed"}</span>{o && o.a != null && <em className="tab">{`${N.Me} ${gbp(o.a)} · ${N.Them} ${gbp(o.b)}`}</em>}</div>; })}</div>
      <div className="sm-tot"><span>{`${N.Me} ${m.sp.pa}%`}</span><span>{`${N.Them} ${100 - m.sp.pa}%`}</span><span>{`of ${gbp(m.sp.total)}`}</span></div>
      <h3>What happens when</h3>
      <ul className="sm-when"><li><b>When the order is sealed</b>It becomes legally binding on you both.</li><li><b>Your final order</b>Apply only after the order is sealed.</li>{m.lump !== 0 && <li><b>Within 28 days</b>{`The ${gbp(Math.abs(m.lump))} lump sum is paid.`}</li>}{m.pct && <li><b>Within 4 months</b>NHS Pensions carries out the pension share.</li>}{m.spAmt > 0 && <li><b>Monthly</b>{`${gbp(m.spAmt)} maintenance for ${m.spMo} months, then a clean break.`}</li>}</ul>
    </Page>;
  }

  const DOCS = [
    { id: "order", t: "Consent order", s: "The order the judge seals", C: Order },
    { id: "a", t: "Form A", s: "The application · by consent", C: FormA },
    { id: "d81", t: "Form D81", s: "Statement of information · joint", C: D81 },
    { id: "p1", t: "Form P1", s: "Pension sharing annex", C: P1, pen: true },
    { id: "sum", t: "Summary", s: "Plain English · for you", C: Summary },
  ];
  function Doc({ id, ctx, m, det, sign, S, agreed, N }) {
    const D = DOCS.find((d) => d.id === id) || DOCS[0];
    return <DX.Provider value={{ ...ctx, doc: id }}><div className="fm-stack">{<D.C m={m} det={det} sign={sign} S={S} agreed={agreed} N={N}/>}{ctx.ce && ctx.endPanel && ctx.endPanel(D.id)}</div></DX.Provider>;
  }
  Object.assign(window, { FNDoc: Doc, FN_DOCS: DOCS });
})();
