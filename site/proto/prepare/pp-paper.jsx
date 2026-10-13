/* Prepare — the completed picture paper: sections, unsorted, evidence, share states, Mark's read-only view, side-by-side */
(function () {
  const { useState } = React;
  const Ic = window.DIc, PP = window.PP;
  const BADGE = { bank: ["From bank", "#166534", "#DCFCE7"], self: ["You said", "#57534E", "#F2EFEA"], gap: ["To add", "#92400E", "#FEF3C7"] };

  function Badge({ b }) { const x = BADGE[b] || BADGE.self; return <em className="pp-b" style={{ color: x[1], background: x[2] }}>{x[0]}</em>; }

  function RowMenu({ row, sec, onMove }) {
    const [o, setO] = useState(false);
    return (
      <span className="pp-menu">
        <button className="pp-dots" aria-label="Recategorise" aria-expanded={o} onClick={() => setO(!o)}>Move</button>
        {o && <div className="pp-pop" onMouseLeave={() => setO(false)}>
          <div className="h">Move to section</div>
          {PP.SECS.filter((s) => s.id !== sec && s.id !== "children").map((s) => <button key={s.id} onClick={() => { onMove(row.key, s.id); setO(false); }}>{s.t}</button>)}
        </div>}
      </span>
    );
  }

  function Query({ row, q, setQ }) {
    const [o, setO] = useState(false), [t, setT] = useState("");
    if (q[row.key]) return <em className="pp-q done"><Ic.Help s={11}/>Queried</em>;
    return o ? (
      <div className="pp-qbox"><textarea autoFocus placeholder={`What would you like to ask about “${row.l}”?`} value={t} onChange={(e) => setT(e.target.value)}></textarea>
        <div><button className="btn sm" disabled={!t.trim()} onClick={() => setQ({ ...q, [row.key]: t })}>Add query</button><button className="lnk" onClick={() => setO(false)}>Cancel</button></div></div>
    ) : <button className="pp-q" onClick={() => setO(true)}>Query this</button>;
  }

  function Rows({ s, pic, act, ro, q, setQ, visual }) {
    const rows = pic.rows[s.id];
    const max = Math.max(1, ...rows.map((r) => Math.abs(r.n || 0)));
    return (
      <div className="pp-rows">{rows.map((r) => (
        <div className={"pp-row" + (r.moved ? " moved" : "")} key={r.key}>
          <div className="pp-rl"><span>{r.l}{r.joint && <em className="pp-j">Joint</em>}</span>{r.sub && <small>{r.sub}</small>}
            {visual && r.n ? <i className="pp-bar"><b style={{ width: (Math.abs(r.n) / max) * 100 + "%", background: s.c }}></b></i> : null}</div>
          <div className="pp-rr"><span className={"tab" + (r.badge === "gap" ? " gap" : "")}>{r.v}</span>
            {ro ? <Query row={r} q={q} setQ={setQ}/> : r.info ? <button className="pp-dots" onClick={() => act.goto("kids-edit")}>Edit</button> : <><Badge b={r.badge}/><RowMenu row={r} sec={s.id} onMove={act.move}/></>}</div>
        </div>))}</div>
    );
  }

  function Evid({ s, pic, act, ro, thumbs }) {
    const ev = pic.evid[s.id];
    if (!ev.length && ro) return null;
    return (
      <div className={"pp-ev" + (thumbs ? " thumbs" : "")}>
        {ev.map((e) => thumbs && false
          ? <div key={e.id} className={"pp-th" + (e.st === "up" ? " ok" : "")}><div className="pg">{e.st === "up" ? <><i></i><i></i><i></i><i></i></> : <Ic.Plus s={16}/>}</div><span>{e.l}</span><small>{e.st === "up" ? "Uploaded" : e.must ? "Needed" : "Later"}</small></div>
          : e.st === "up" || ro ? <span key={e.id} className={e.st === "up" ? "ok" : e.must ? "must" : ""}>{e.st === "up" ? <Ic.Check s={11} w={3}/> : <Ic.Help s={11}/>}{e.l}<small>{e.st === "up" ? "uploaded" : "to follow"}</small></span>
          : <button key={e.id} className={"pp-evb" + (e.must ? " must" : "")} onClick={() => act.fulfil(e.id)}><Ic.Plus s={11}/>{e.l}<small>{e.must ? "needed · upload" : "upload"}</small></button>)}
        {!ro && <button className="pp-up" onClick={() => act.upload(s.id)}><Ic.Plus s={12}/>Upload evidence</button>}
      </div>
    );
  }

  function AddItem({ s, act }) {
    const [o, setO] = useState(false), [l, setL] = useState(""), [v, setV] = useState("");
    if (!o) return <button className="pp-add" onClick={() => setO(true)}><Ic.Plus s={12}/>{`Add ${s.noun ? s.noun.replace(/s$/, "") : "an item"}`}</button>;
    return (
      <div className="pp-addf">
        <input placeholder="What is it?" value={l} autoFocus onChange={(e) => setL(e.target.value)}/>
        <label><span>£</span><input inputMode="numeric" placeholder="Amount" value={v} onChange={(e) => setV(e.target.value.replace(/[^0-9]/g, ""))}/></label>
        <button className="btn sm" disabled={!l.trim()} onClick={() => { act.add(s.id, l.trim(), Number(v || 0)); setO(false); setL(""); setV(""); }}>Add</button>
        <button className="lnk" onClick={() => setO(false)}>Cancel</button>
      </div>
    );
  }

  function Ring({ p, c, size = 34, w = 4 }) {
    const r = (size - w) / 2, C = 2 * Math.PI * r;
    return <svg width={size} height={size} className="pp-ring" aria-hidden="true"><circle cx={size / 2} cy={size / 2} r={r} stroke="#EEEAE3" strokeWidth={w} fill="none"/><circle cx={size / 2} cy={size / 2} r={r} stroke={c} strokeWidth={w} fill="none" strokeDasharray={C} strokeDashoffset={C * (1 - p / 100)} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}/></svg>;
  }

  function Section({ s, pic, act, none, ro, q, setQ, open, toggle, variant, locked }) {
    const st = pic.status.find((x) => x.id === s.id), rows = pic.rows[s.id], isNone = none[s.id] && !rows.length;
    const chip = isNone ? ["None", "#57534E", "#F2EFEA"] : !st.done ? ["Not answered", "#B91C1C", "#FEE2E2"] : st.gaps || st.evOut ? [`${st.gaps + st.evOut} to add`, "#92400E", "#FEF3C7"] : ["Complete", "#166534", "#DCFCE7"];
    const sp = isNone ? 100 : !st.done ? 0 : Math.round(100 - ((st.gaps + st.evOut) / Math.max(1, rows.length + pic.evid[s.id].length)) * 60);
    return (
      <div className={"pp-sec" + (open ? " open" : "")} id={"sec-" + s.id}>
        <button className={"pp-sh" + (locked ? " lk" : "")} aria-expanded={open} onClick={locked ? undefined : toggle}>
          {variant === "visual" ? <span className="pp-rw"><Ring p={sp} c={s.c}/><b>{s.n}</b></span> : <span className="pp-n">{s.n}</span>}
          <span className="pp-st">{s.t}<small>{s.fe}</small></span>
          <em className="pp-chip" style={{ color: chip[1], background: chip[2] }}>{chip[0]}</em>
          {!locked && <Ic.Down s={14} style={{ transform: open ? "rotate(180deg)" : "", transition: "transform .2s", flexShrink: 0 }}/>}
        </button>
        {open && <div className="pp-sb">
          {isNone ? <div className="pp-none">{`You've said you have no ${s.noun || "items"} here.`}{!ro && <button className="lnk" onClick={() => act.none(s.id, false)}>Undo</button>}</div> : <Rows s={s} pic={pic} act={act} ro={ro} q={q} setQ={setQ} visual={variant === "visual"}/>}
          {!rows.length && !isNone && !ro && <div className="pp-zero"><span>{`Nothing here yet. ${s.id === "other_prop" ? "A second home, a buy-to-let or land abroad would go here." : "Add anything your bank statements didn't show."}`}</span><div><AddItem s={s} act={act}/><button className="btn sm ghost" onClick={() => act.none(s.id, true)}>I have none</button></div></div>}
          {rows.length > 0 && !ro && <AddItem s={s} act={act}/>}
          {!isNone && <Evid s={s} pic={pic} act={act} ro={ro} thumbs={variant === "visual"}/>}
        </div>}
      </div>
    );
  }

  function Unsorted({ pic, act }) {
    const [pick, setPick] = useState(null);
    if (!pic.unsorted.length) return null;
    return (
      <div className="pp-uns" id="sec-unsorted">
        <div className="pp-uh"><b>{`Unsorted · ${pic.unsorted.length}`}</b><span>Things you weren't sure about. Sort them before you share.</span></div>
        {pic.unsorted.map((u) => (
          <div className="pp-urow" key={u.key}>
            <div className="pp-rl"><span>{u.l}</span><small>{u.sub}</small></div>
            <span className="tab">{u.v}</span>
            <button className="btn sm ghost" onClick={() => setPick(pick === u.key ? null : u.key)}>{pick === u.key ? "Cancel" : "Sort it"}</button>
            {pick === u.key && <div className="pq-cats sm">{PP.CATS.map(([k, l]) => <button key={k} onClick={() => { act.sort(u.card, k); setPick(null); }}>{l}</button>)}</div>}
          </div>))}
      </div>
    );
  }

  function OutputPanel({ ss, N, pic, act, plan }) {
    const { share, mark } = ss, T = N.Them, solo = plan === "picture";
    const gaps = [
      pic.unsorted.length && `Sort ${pic.unsorted.length} unsorted item${pic.unsorted.length > 1 ? "s" : ""}`,
      ...pic.status.filter((s) => !s.done).map((s) => `Answer ${pic.secs.find((x) => x.id === s.id).t.toLowerCase()}`),
    ].filter(Boolean);
    const evOut = pic.evAll.length - pic.evUp;
    const doc = <div className="pp-fe-doc"><div className="pg"><i></i><i></i><i></i><i></i><i></i></div><div><b>Form E — draft.pdf</b><small>{`28 pages · ${pic.pct}% complete`}</small></div></div>;
    const pct = <div className="pp-pct"><i><b style={{ width: pic.pct + "%" }}></b></i><span className="tab">{pic.pct + "%"}</span></div>;
    const gapList = !pic.ready && <div className="op-gaps"><b>{`${gaps.length} thing${gaps.length > 1 ? "s" : ""} before it's ready`}</b><ul>{gaps.slice(0, 4).map((g) => <li key={g}>{g}</li>)}</ul>{gaps.length > 4 && <small>{`+ ${gaps.length - 4} more`}</small>}</div>;
    const ev = pic.ready && evOut > 0 && <div className="pp-fe-n">{`${evOut} piece${evOut > 1 ? "s" : ""} of evidence can follow later — they'll show as “to follow”.`}</div>;
    const third = (primary) => <button className={"btn full" + (primary ? "" : " ghost")} disabled={!pic.ready} onClick={() => act.export()}><Ic.Arrow s={13}/>{primary ? "Download Form E" : "Export Form E"}</button>;
    if (solo) return (
      <div className="pp-fe op">
        <div className="pq-k">Output</div>
        <div className="pp-fe-t">{pic.ready ? "Your Form E is ready." : "Form E, ready for mediation."}</div>
        {doc}{pct}{gapList}{ev}
        <div className="op-acts">{third(true)}<button className="btn full ghost" disabled={!pic.ready} onClick={() => act.toast("Secure link sent", "Your mediator or solicitor can view and download it for 30 days.")}>Send to a mediator or solicitor</button></div>
        <div className="op-up"><span>{`Want ${N.them} to join and settle here instead?`}</span><button className="lnk" onClick={() => act.toast("Upgrade to Guided settlement", "£499 — Decouple takes the place of mediation.")}>See Guided settlement</button></div>
      </div>
    );
    const status = mark === "none" ? <div className="op-st"><Ic.Lock s={13}/><span>{`Private draft. ${T} hasn't been invited yet.`}</span><button className="lnk" onClick={() => act.setMark("invited")}>{`Invite ${N.them}`}</button></div>
      : mark === "invited" ? <div className="op-st"><Ic.Lock s={13}/><span>{`Private draft. ${T} was invited 2 days ago — not joined yet.`}</span><button className="lnk" onClick={() => act.toast("Invite resent")}>Resend</button></div>
      : <div className="op-st"><Ic.Lock s={13}/><span>{`Private draft. ${T} has joined and is building theirs.`}</span><span className="pp-mk"><i><b style={{ width: "40%" }}></b></i>40%</span></div>;
    let main;
    if (share === "shared") main = <>
      <div className="pp-fe-t">{`Shared with ${N.them}.`}</div>
      <div className="op-st ok"><Ic.Check s={13} w={2.6}/><span>{mark === "joined" ? `Waiting for ${N.them} to share theirs — about 40% there.` : `${T} will see it as soon as they join.`}</span></div>
      <div className="op-acts"><button className="btn full" onClick={() => act.view("mark")}>{`Preview ${N.them}'s view`}</button>{third(false)}</div>
      <div className="pp-fe-n">{`Changes you make now show to ${N.them} as updates.`}</div>
    </>;
    else if (share === "both") main = <>
      <div className="pp-fe-t">Both pictures are in.</div>
      <div className="op-st ok"><Ic.Check s={13} w={2.6}/><span>{`${T} shared theirs yesterday.`}</span></div>
      <div className="op-acts"><button className="btn full v" onClick={() => act.view("compare")}>Compare side by side <Ic.Arrow s={13}/></button>{third(false)}</div>
    </>;
    else main = <>
      <div className="pp-fe-t">{pic.ready ? `Ready to share with ${N.them}.` : `Get ready to share with ${N.them}.`}</div>
      {status}{pct}{gapList}{ev}
      <div className="op-acts">
        <button className="btn full v" disabled={!pic.ready} onClick={act.review}>{`Review & share with ${N.them}`} <Ic.Arrow s={13}/></button>
        {third(false)}
      </div>
      <div className="pp-fe-n">Export a Form E for a mediator or solicitor — included in your plan.</div>
    </>;
    return <div className="pp-fe op"><div className="pq-k">Share &amp; output</div>{main}</div>;
  }

  function Todo({ pic, act, N, plan }) {
    const groups = [];
    if (pic.unsorted.length) groups.push({ id: "unsorted", t: "Unsorted", tasks: [{ k: "high", t: `Sort ${pic.unsorted.length} unsorted item${pic.unsorted.length > 1 ? "s" : ""}`, b: "Things you weren't sure about. They're not shared until sorted.", cta: "Sort now", go: () => act.goto("unsorted") }] });
    pic.secs.forEach((s) => {
      const st = pic.status.find((x) => x.id === s.id), rows = pic.rows[s.id], tasks = [];
      if (!st.done) tasks.push({ k: "high", t: `Answer this section`, b: "Add what you have — or mark it “I have none”.", cta: "Open", go: () => act.goto(s.id) });
      rows.filter((r) => r.badge === "gap").forEach((r) => tasks.push({ k: "med", t: r.l, b: r.sub ? `Currently “${r.sub}”.` : "Needs an amount.", cta: "Add details", go: () => act.goto(s.id) }));
      pic.evid[s.id].filter((e) => e.st !== "up").forEach((e) => tasks.push({ k: e.must ? "high" : "med", t: e.l, b: e.must ? "Needed for Form E — can follow after you share." : "Helpful evidence.", cta: "Upload", go: () => act.fulfil(e.id) }));
      if (tasks.length) groups.push({ id: s.id, t: s.t, c: s.c, tasks });
    });
    const n = groups.reduce((a, g) => a + g.tasks.length, 0);
    return (
      <div className="pp-todo">
        <div className="td-h"><div className="pq-k"><Ic.Spark s={11}/>Your to-do</div>
          <b>{n ? `${n} thing${n > 1 ? "s" : ""} to finish your picture.` : "Nothing left to do."}</b>
          <span>Most important first in each section.</span></div>
        {groups.map((g) => (
          <div className="td-g" key={g.id}>
            <button className="td-gh" onClick={() => act.goto(g.id)}><i style={{ background: g.c || "#B45309" }}></i>{g.t}<small>{g.tasks.length}</small></button>
            {g.tasks.sort((x, y) => (x.k === "high" ? -1 : 1) - (y.k === "high" ? -1 : 1)).map((t, i) => (
              <div className="td-t" key={i}><span className={"td-i " + t.k}>{t.k === "high" ? "!" : "i"}</span>
                <div><b>{t.t}</b><span>{t.b}</span></div>
                <button className={"btn sm" + (t.k === "high" ? " am" : " ghost")} onClick={t.go}>{t.cta}</button></div>))}
          </div>))}
        <div className="td-f">{plan === "picture" ? "When every section is clear, download your Form E." : `When every section is clear, share with ${N.them}.`}</div>
      </div>
    );
  }

  Object.assign(window, { PPSection: Section, PPUnsorted: Unsorted, PPOutput: OutputPanel, PPTodo: Todo, PPBadge: Badge });
})();
