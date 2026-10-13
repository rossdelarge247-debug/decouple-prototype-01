/* Settle — proposal builder, Mark's reply, hub summaries, agreement */
(function () {
  const { useState, useEffect } = React;
  const Ic = window.DIc, ST = window.ST;
  const Av = (p) => <window.RCAv {...p}/>;
  const Rz = ({ r }) => { const x = ST.R[r]; return <em className="st-rz" style={{ color: x[1], background: x[2] }}>{x[0]}</em>; };
  const money = (s, o) => (o && o.a != null ? <span className="st-mv"><span><Av w="a" N={window.__N} size={14}/>{ST.gbp(o.a)}</span><span><Av w="b" N={window.__N} size={14}/>{ST.gbp(o.b)}</span></span> : o && o.total != null ? <span className="st-mv"><span>{o.total ? `${ST.gbp(o.total)} total` : "£0"}</span></span> : null);
  function Split({ sp, N, label }) {
    return <div className="st-split"><div className="h"><small>{label || "If accepted as written"}</small></div>
      <div className="row"><span className="s"><Av w="a" N={N} size={18}/><b className="tab">{`${sp.pa}%`}</b><small className="tab">{ST.gbp(sp.a)}</small></span><span className="m"><b className="tab">{`${100 - sp.pa}%`}</b><small className="tab">{ST.gbp(sp.b)}</small><Av w="b" N={N} size={18}/></span></div>
      <div className="bar"><i style={{ width: sp.pa + "%" }}></i></div></div>;
  }

  const Gh = ({ N }) => <em className="st-gh"><Av w="b" N={N} size={13}/>{`${N.Them}'s counter`}</em>;
  /* ---------- controls ---------- */
  function Strip({ pat, N }) {
    const D = ["M", "T", "W", "T", "F", "S", "S"];
    return <span className="st-strip" aria-label="Two-week pattern">{[0, 1].map((w) => <span key={w} className="wk"><small>{`Wk ${w + 1}`}</small>{pat.slice(w * 7, w * 7 + 7).split("").map((c, i) => <i key={i} className={c} title={c === "a" ? N.Me : c === "b" ? N.Them : `${N.Me} · evening with ${N.Them}`}>{w === 0 ? D[i] : ""}</i>)}</span>)}<span className="lg"><i className="a"></i>{N.Me}<i className="b"></i>{N.Them}</span></span>;
  }
  function Extras({ N, xs = [], setXs, ro }) {
    const A = N.Me, B = N.Them, [txt, setTxt] = useState("");
    const G = [
      ["Costs", [`${B} pays for school trips`, `${B} pays for school uniforms`, "School trips and uniforms split 50/50", "Clubs and activities split 50/50", "Childcare split in line with income", "Big costs over £100 agreed first"]],
      ["Holidays and special days", ["Alternate Christmas each year", "Split Christmas Day — morning and afternoon", "Alternate the children's birthdays", "Each parent has them on their own birthday", "Mother's Day and Father's Day with that parent", "School holidays split 50/50", "Up to 2 weeks abroad each, with 30 days' notice"]],
      ["Day to day", ["Handovers at school where possible", "Video call when they're with the other parent", "Agree before moving more than 30 minutes away", `Passports held by ${A}, released for agreed trips`, "Both stay on school and GP contact lists", "New partners introduced only after 6 months"]],
    ];
    const tog = (x) => setXs(xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
    const own = xs.filter((x) => !G.some(([, l]) => l.includes(x)));
    return <div className="st-xs"><div className="h"><small className="st-q">Further details</small><span>{xs.length ? `${xs.length} added` : "Optional — tap any that apply"}</span></div>
      {G.map(([g, l]) => <div key={g} className="grp"><b>{g}</b><div className="chips">{l.map((x) => <button key={x} className={"st-chip" + (xs.includes(x) ? " on" : "")} disabled={ro} aria-pressed={xs.includes(x)} onClick={() => tog(x)}>{xs.includes(x) && <Ic.Check s={10} w={3}/>}{x}</button>)}</div></div>)}
      {own.length > 0 && <div className="grp"><b>Your own</b><div className="chips">{own.map((x) => <button key={x} className="st-chip on" disabled={ro} onClick={() => tog(x)}><Ic.Check s={10} w={3}/>{x}<Ic.X s={10}/></button>)}</div></div>}
      {!ro && <div className="add"><input placeholder="Add your own, e.g. Emma's piano lessons continue on Tuesdays" value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && txt.trim()) { setXs([...xs, txt.trim()]); setTxt(""); } }}/><button className="btn sm ghost" disabled={!txt.trim()} onClick={() => { setXs([...xs, txt.trim()]); setTxt(""); }}><Ic.Plus s={11}/>Add</button></div>}
    </div>;
  }
  function Kids({ s, pick, setPick, N, ro, custom, setCustom, xs, setXs, ghost }) {
    const [g0, setG] = useState(null), g = pick ? pick.split(":")[0] : g0, po = ST.opt(s, pick);
    const [own, setOwn] = useState(!!custom);
    return <div className="st-kids">
      <div className="st-grps">{s.groups.map(([k, t, d]) => <button key={k} className={"st-grp" + (g === k ? " on" : "")} disabled={ro} onClick={() => { setG(k); if (pick && pick.split(":")[0] !== k) setPick(null); }}><span className="rd"></span><b>{t}</b><small>{d}</small>{ghost && ghost.split(":")[0] === k && <Gh N={N}/>}</button>)}</div>
      {g && <div className="st-var"><small className="st-q">{g === "s" ? "Which week structure?" : `How should time with ${g === "a" ? N.Them : N.Me} work?`}</small>
        {s.opts.filter((o) => o.g === g).map((o) => <button key={o.id} className={"st-opt" + (pick === o.id ? " on" : "")} disabled={ro} onClick={() => setPick(o.id)}><span className="rd"></span><span className="tx"><b>{o.short}</b><small>{o.d}</small><Strip pat={o.pat} N={N}/>{ghost === o.id && <Gh N={N}/>}</span><Rz r={o.r}/></button>)}</div>}
      {po && po.cms != null && <div className="st-cms"><small className="st-q">Child maintenance</small>
        <div className="row"><button className={"st-opt sm" + (!own ? " on" : "")} disabled={ro} onClick={() => { setOwn(false); setCustom(""); }}><span className="rd"></span><span className="tx"><b>{`Use the estimate · £${po.cms}/mo from ${po.payer === "b" ? N.Them : N.Me}`}</b><small>Worked out from both incomes and the nights above, using the government's child maintenance formula.</small></span></button>
          <div className={"st-opt sm cmx" + (own ? " on" : "")}><button className="h" disabled={ro} onClick={() => setOwn(true)}><span className="rd"></span><b>Agree a different amount</b></button>
            {own && <label className="rc-num"><span>£</span><input autoFocus inputMode="numeric" placeholder={String(po.cms)} value={custom || ""} disabled={ro} onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}/><em>/ mo</em></label>}</div></div></div>}
      {po && setXs && <Extras N={N} xs={xs} setXs={setXs} ro={ro}/>}
    </div>;
  }
  function Slider({ s, pick, setPick, N, ro, ghost }) {
    const L = ST.SL[s.dyn], modes = s.modes;
    const pm = pick && pick.includes(":") && ST.opt(s, pick) ? pick.split(":") : null; pick = pm ? pick : null;
    const [m0, setM] = useState(modes ? modes[0][0] : s.dyn), mode = pm ? pm[0] : m0;
    const mid = Math.floor(L.steps.length / 2), idx = pm ? Math.max(0, L.steps.indexOf(Number(pm[1]))) : mid;
    const id = `${mode}:${L.steps[idx]}`, o = ST.opt(s, id), set = (i) => setPick(`${mode}:${L.steps[i]}`);
    useEffect(() => { if (!pick && !ro) setPick(id); }, []);
    const gm = ghost && ghost.includes(":") ? ghost.split(":") : null, gIdx = gm && gm[0] === mode ? L.steps.indexOf(Number(gm[1])) : -1, gp = gIdx / (L.steps.length - 1);
    const go = gm && gIdx < 0 ? ST.opt(s, ghost) : null;
    return <div className="st-sl">
      {modes && <div className="st-tabs" role="tablist">{modes.map(([k, t]) => <button key={k} role="tab" aria-selected={mode === k} className={mode === k ? "on" : ""} disabled={ro} onClick={() => { setM(k); if (pm) setPick(`${k}:${pm[1]}`); }}>{t}</button>)}</div>}
      <div className={"st-box" + (pick ? " on" : "")}><div className="tx"><b>{o.t}</b><small>{o.d}</small>{money(s, o)}</div><Rz r={o.r}/></div>
      {go && <div className="st-ghn"><Gh N={N}/><span>{go.t}</span></div>}
      {gIdx >= 0 && gIdx === idx && <div className="st-ghn al"><Ic.Check s={11} w={3}/><span>{`Aligned with ${N.Them}'s counter — this accepts it.`}</span></div>}
      <div className="st-rng"><div className="st-trk">{gIdx >= 0 && <span className="st-gdot" style={{ left: `calc(12px + (100% - 24px) * ${gp})` }} aria-hidden="true"><small>{N.Them}</small></span>}<input type="range" min={0} max={L.steps.length - 1} step={1} value={idx} disabled={ro} aria-label={`${s.t} position`} onChange={(e) => set(Number(e.target.value))} style={{ "--p": (idx / (L.steps.length - 1)) * 100 + "%" }}/></div>
        <div className="ticks">{L.steps.map((v, i) => <button key={i} className={(i === idx ? "on" : "") + (i === gIdx ? " gh" : "")} disabled={ro} onClick={() => set(i)}><i></i><span>{L.lbl(v)}</span></button>)}</div>
        <div className="ends"><span><Av w="a" N={N} size={14}/>{`More to ${N.Me}`}</span><span>{`More to ${N.Them}`}<Av w="b" N={N} size={14}/></span></div></div>
    </div>;
  }
  function Radios({ s, pick, setPick, custom, setCustom, ro, nocustom, ghost, N }) {
    const [open, setOpen] = useState(pick === "custom");
    return <div className="st-opts">{s.opts.map((o) => <button key={o.id} className={"st-opt" + (pick === o.id ? " on" : "")} disabled={ro} onClick={() => { setPick(o.id); setOpen(false); }} aria-pressed={pick === o.id}>
      <span className="rd"></span><span className="tx"><b>{o.t}</b><small>{o.d}</small>{money(s, o)}{ghost === o.id && <Gh N={N}/>}</span><Rz r={o.r}/></button>)}
      {!ro && !nocustom && <div className={"st-opt cu" + (pick === "custom" ? " on" : "")}><button className="h" onClick={() => { setOpen(true); setPick("custom"); }}><span className="rd"></span><b>Propose a different arrangement</b><small>Write it in your own words — we'll model the maths once you write it.</small></button>
        {(open || pick === "custom") && <textarea rows={2} placeholder="e.g. Sell in summer 2028 once Jake is at secondary, split 55/45" value={custom || ""} onChange={(e) => setCustom(e.target.value)}></textarea>}</div>}
    </div>;
  }
  function Control(p) {
    if (p.s.kids) return <Kids {...p}/>;
    if (p.s.dyn && p.style === "slider") return <Slider {...p}/>;
    return <Radios {...p}/>;
  }

  /* ---------- read-only: what was chosen ---------- */
  function Chosen({ s, pick, custom, xs = [], N }) {
    const o = ST.opt(s, pick);
    return <div className="st-chosen"><div className="st-box on ro"><div className="tx"><b>{o ? o.t : pick === "custom" ? custom || "Their own arrangement" : "Not decided"}</b>{o && <small>{o.d}</small>}{o && money(s, o)}{o && o.pat && <Strip pat={o.pat} N={N}/>}
      {o && o.cms != null && <small className="cm">{`Child maintenance · ${custom ? "£" + custom : "£" + o.cms}/mo from ${o.payer === "b" ? N.Them : N.Me}`}</small>}</div>{o && <Rz r={o.r}/>}</div>
      {xs.length > 0 && <ul className="st-agx">{xs.map((x) => <li key={x}>{x}</li>)}</ul>}</div>;
  }
  /* ---------- draft ---------- */
  const MyNote = ({ note, N, w = "a" }) => note ? <blockquote className={"st-why" + (w === "a" ? " me" : "")}><Av w={w} N={N} size={18}/><span><small>{w === "a" ? `Your note to ${N.Them}` : `${N.Them}'s note`}</small>{`“${note}”`}</span></blockquote> : null;
  function Decision({ s, pick, setPick, custom, setCustom, ro, N, style, xs, setXs, note, noteBy }) {
    return <section className="paper pp-card st-sec" id={"st-" + s.id}>
      <div className="st-sh"><h3>{s.t}</h3>{!ro && (ST.valid(s, pick, custom) ? <span className="st-dr"><Ic.Check s={11} w={2.8}/>Drafted</span> : <span className="st-dr no">To decide</span>)}</div>
      <div className="st-facts"><p>{s.facts}</p></div>
      {ro ? <Chosen s={s} pick={pick} custom={custom} xs={xs} N={N}/> : <Control s={s} N={N} pick={pick} setPick={setPick} custom={custom} setCustom={setCustom} ro={ro} style={style} xs={xs} setXs={setXs}/>}
      <MyNote note={note} N={N} w={noteBy}/>
    </section>;
  }
  function Draft({ S, picks, setPick, custom, setCustom, ro, N, style, notes = {}, noteBy = "a" }) {
    return <div className="st-papers">{S.map((s) => <Decision key={s.id} s={s} N={N} style={style} pick={picks[s.id]} setPick={(id) => setPick(s.id, id)} custom={custom[s.id]} setCustom={(t) => setCustom(s.id, t)} xs={custom[s.id + "_x"] || []} setXs={(v) => setCustom(s.id + "_x", v)} ro={ro} note={notes[s.id]} noteBy={noteBy}/>)}</div>;
  }

  /* ---------- reply: Mark's changes, respond inline ---------- */
  function ReplySec({ s, mine, theirs, why, myWhy, resp, setResp, N, compact, style = "slider" }) {
    const O = N.Them, same = mine === theirs, [mode, setMode] = useState(null), [note, setNote] = useState(""), [prev, setPrev] = useState(null);
    const oM = ST.opt(s, mine), oT = ST.opt(s, theirs), r = resp && resp.k;
    if (same) return <div className="st-rs ok" id={"st-" + s.id}><span className="ok"><Ic.Check s={10} w={3} c="#FFF"/></span><b>{s.t}</b><span className="tx">{(oT || {}).t || "Your own arrangement"}</span><em>{`${O} agreed as written`}</em></div>;
    return <div className={"st-rs ch" + (r ? " done" : "")} id={"st-" + s.id}>
      <div className="hd"><b>{s.t}</b><span className={"pill" + (r ? " ok" : " me")}>{r === "accept" ? `You accept ${O}'s` : r === "counter" ? (resp.v === mine ? "Keeping yours" : "You're countering") : r === "discuss" ? "Keeping yours · note added" : "Response needed"}</span></div>
      {!compact && <div className="st-vs"><div className="v a"><small><Av w="a" N={N} size={14}/>Your last version</small><b>{oM ? oM.t : "Your own arrangement"}</b>{oM && money(s, oM)}</div><div className="v b"><small><Av w="b" N={N} size={14}/>{`${O}'s counter`}</small><b>{oT.t}</b>{money(s, oT)}<Rz r={oT.r}/></div></div>}
      {compact && <div className="st-cm"><span><Av w="b" N={N} size={16}/><b>{oT.t}</b></span></div>}
      <MyNote note={myWhy} N={N}/>
      {why && <blockquote className="st-why"><Av w="b" N={N} size={18}/><span>{`“${why}”`}</span></blockquote>}
      {mode === "counter" ? <div className="st-cnt"><small>{`Your counter · starts where you had it, ${O}'s position is marked`}</small><Control s={s} N={N} style={theirs && theirs.includes(":") ? "slider" : style} pick={r === "counter" ? resp.v : r === "accept" ? theirs : mine} ghost={theirs} setPick={(id) => id && setResp(id === theirs ? { k: "accept" } : { k: "counter", v: id })} nocustom/><div className="b"><button className="btn sm" onClick={() => { if (!r) setResp({ k: "counter", v: mine }); setMode(null); }}>{r === "accept" ? `Accept ${O}'s` : r === "counter" && resp.v !== mine ? "Use this counter" : "Keep my position"}</button><button className="lnk" onClick={() => { setResp(prev); setMode(null); }}>Cancel</button></div></div>
        : mode === "discuss" ? <div className="st-cnt"><textarea autoFocus rows={2} placeholder={`Tell ${O} what you'd need to agree…`} value={note} onChange={(e) => setNote(e.target.value)}></textarea><div className="b"><button className="btn sm" disabled={!note.trim()} onClick={() => { setResp({ k: "discuss", note: note.trim() }); setMode(null); }}>Add note</button><button className="lnk" onClick={() => setMode(null)}>Cancel</button></div></div>
        : <div className="st-ra"><button className={"btn sm" + (r === "accept" ? " ok" : " ghost")} onClick={() => setResp(r === "accept" ? null : { k: "accept" })}><Ic.Check s={11} w={2.8}/>{r === "accept" ? "Accepted" : "Accept"}</button><button className="btn sm ghost" onClick={() => { setPrev(resp || null); setMode("counter"); }}>Counter</button><button className="btn sm ghost" onClick={() => setMode("discuss")}>Discuss</button>{r && r !== "accept" && <button className="lnk" onClick={() => setResp(null)}>Undo</button>}</div>}
    </div>;
  }

  function Reply({ S, mine, theirs, why, myWhy = {}, resp, setResp, N, style }) {
    return <div className="st-papers">{S.map((s) => <ReplySec key={s.id} s={s} N={N} style={style} mine={mine[s.id]} theirs={theirs[s.id]} why={why[s.id]} myWhy={myWhy[s.id]} resp={resp[s.id]} setResp={(x) => setResp(s.id, x)}/>)}</div>;
  }

  /* ---------- hub: versions stack down the page, oldest first ---------- */
  const fmtD = (t) => t ? new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
  function Conv({ S, N, rounds, agreed, finalN }) {
    const [open, setOpen] = useState(false), O = N.Them;
    const rows = rounds.map((r, i) => { const A = [...rounds.slice(0, i + 1)].reverse().find((x) => x.by === "a"), B = [...rounds.slice(0, i + 1)].reverse().find((x) => x.by === "b"); const sa = ST.split(S, A.picks), sb = B ? ST.split(S, B.picks) : null; return { r, sa, sb, gap: sb ? Math.abs(sa.a - sb.a) : null, secs: B ? S.filter((s) => A.picks[s.id] !== B.picks[s.id]).length : null }; });
    const first = rows.find((x) => x.gap != null), lastG = [...rows].reverse().find((x) => x.gap != null);
    const lo = 30, hi = 75, pos = (p) => `${Math.max(0, Math.min(100, ((p - lo) / (hi - lo)) * 100))}%`;
    return <div className={"st-cv" + (open ? " open" : "")}>
      <div className="st-cvh"><div className="st-conv">{rounds.map((r, i) => { const sp = ST.split(S, r.picks); return <React.Fragment key={i}>{i > 0 && <span className="ar"><Ic.Arrow s={11}/></span>}<span className={"st-vc " + r.by}><Av w={r.by} N={N} size={16}/><b>{`v${r.n}`}</b><span className="tab">{`${sp.pa} / ${100 - sp.pa}`}</span></span></React.Fragment>; })}{agreed && <><span className="ar"><Ic.Arrow s={11}/></span><span className="st-vc ok"><Ic.Check s={11} w={3}/><b>{`v${finalN} · Final`}</b></span></>}</div>
        {first && <button className="lnk st-cvt" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Hide" : agreed ? "How you got here" : "How the gap is closing"}<Ic.Down s={11}/></button>}</div>
      {open && first && <div className="st-cvb">
        <div className="st-cvs"><span><small>Started</small><b className="tab">{ST.gbp(first.gap)}</b><em>apart</em></span><Ic.Arrow s={14}/><span><small>{agreed ? "Agreed" : "Now"}</small><b className="tab">{agreed ? "£0" : ST.gbp(lastG.gap)}</b><em>{agreed ? "together" : `apart · ${lastG.secs} section${lastG.secs !== 1 ? "s" : ""} open`}</em></span></div>
        <div className="st-cvr">{rows.map(({ r, sa, sb, gap, secs }) => <div key={r.n} className="row"><span className="v" style={{ color: r.by === "a" ? "#5B21B6" : "#0369A1" }}>{`v${r.n}`}</span>
          <span className="trk">{sb && <i className="bar" style={{ left: pos(Math.min(sa.pa, sb.pa)), width: `calc(${pos(Math.max(sa.pa, sb.pa))} - ${pos(Math.min(sa.pa, sb.pa))})` }}></i>}<i className="d a" style={{ left: pos(sa.pa) }} title={`${N.Me} ${sa.pa}%`}></i>{sb && <i className="d b" style={{ left: pos(sb.pa) }} title={`${O} offers ${N.Me} ${sb.pa}%`}></i>}</span>
          <span className="g tab">{gap == null ? `Waiting for ${O}` : `${ST.gbp(gap)} · ${secs} open`}</span></div>)}
          {agreed && (() => { const sp = ST.split(S, agreed); return <div className="row fin"><span className="v">{`v${finalN}`}</span><span className="trk"><i className="d ok" style={{ left: pos(sp.pa) }}></i></span><span className="g tab">{`Agreed · ${sp.pa}/${100 - sp.pa}`}</span></div>; })()}
        </div>
        <div className="st-cvl"><span><i className="d a"></i>{`${N.Me}'s share in her own proposal`}</span><span><i className="d b"></i>{`${N.Me}'s share in ${O}'s`}</span></div>
      </div>}
    </div>;
  }
  function Hub({ S, N, rounds, resp, setResp, agreed, locked, go, act, draftPicks, custom = {}, rev }) {
    const O = N.Them, last = rounds[rounds.length - 1], lastA = [...rounds].reverse().find((r) => r.by === "a"), lastB = [...rounds].reverse().find((r) => r.by === "b");
    const turn = !agreed && (!rounds.length || last.by === "b");
    const changed = lastB && lastA && turn ? S.filter((s) => lastB.picks[s.id] !== lastA.picks[s.id]) : [];
    const need = changed.filter((s) => !resp[s.id]).length, finalN = last ? last.n + 1 : 1;
    const [open, setOpen] = useState({});
    const pickT = (s, p) => { const o = ST.opt(s, p); return o ? o.t : p === "custom" ? custom[s.id] || "Your own arrangement" : "Not decided yet"; };
    const diff = (i) => (i > 0 ? S.filter((s) => rounds[i].picks[s.id] !== rounds[i - 1].picks[s.id]) : []);
    const col = (by) => (by === "a" ? "#5B21B6" : "#0369A1");
    const Tab = ({ by, t, on = true }) => <span className="ftab" style={{ background: on ? col(by) : "#A8A29E", gap: 5, paddingLeft: 5 }}><Av w={by} N={N} size={15}/>{t}</span>;
    const label = (r, i) => (r.by === "a" ? (i === 0 ? "YOUR PROPOSAL" : "YOUR COUNTER") : `${O.toUpperCase()}'S COUNTER`);
    const status = (r) => (r.by === "a" ? `v${r.n} · sent to ${O}` : `v${r.n} · received from ${O}`) + (r.at ? ` · ${fmtD(r.at)}` : "");
    const summary = (r, i) => { const d = diff(i); return i === 0 ? `Opening proposal · ${S.length} sections` : `${r.by === "a" ? "You" : O} changed ${d.length} of ${S.length} section${S.length !== 1 ? "s" : ""}`; };
    const PickList = ({ picks, d = [], prevN }) => <div className="hb-list">{S.map((s) => { const ch = d.includes(s); return <div key={s.id} className={"hb-dl" + (ch ? " me" : "")}><i className="dot"></i><span className="tx"><b>{s.t}</b><span className="sn">{pickT(s, picks[s.id])}</span></span><small className="ag">{ch && prevN ? `Changed from v${prevN}` : ""}</small></div>; })}</div>;
    const h = agreed ? <>You've agreed<br/><em>a settlement.</em></> : !rounds.length ? <>Your opening<br/><em>proposal.</em></> : turn ? <>{`${O} replied —`}<br/><em>{`${changed.length} change${changed.length !== 1 ? "s" : ""} to answer.`}</em></> : <>{`Waiting for ${O}`}<br/><em>{`to reply to v${lastA.n}.`}</em></>;

    function Card({ r, i }) {
      const cur = i === rounds.length - 1 && !agreed, d = diff(i), sp = ST.split(S, r.picks);
      if (!cur) {
        const on = !!open[r.n];
        return <div className={"paper pp-card hb-old" + (on ? " open" : "")}>
          <button className="hb-oh" aria-expanded={on} onClick={() => setOpen((o) => ({ ...o, [r.n]: !on }))}>
            <span className="vn" style={{ color: col(r.by) }}>{`v${r.n}`}</span>
            <span className="tx"><b>{(r.by === "a" ? (i === 0 ? "Your proposal" : "Your counter") : `${O}'s counter`) + " · " + status(r).replace(/^v\d+ · /, "")}</b><small>{summary(r, i)}</small></span>
            <span className="sp tab">{`${sp.pa} / ${100 - sp.pa}`}</span>
            <span className="chev"><Ic.Down s={12}/></span>
          </button>
          {on && <><PickList picks={r.picks} d={d} prevN={i > 0 ? rounds[i - 1].n : null}/>
            <div className="hb-row"><span></span><button className="btn sm ghost" onClick={() => act.view(r.n)}>View previous proposal<Ic.Arrow s={12}/></button></div></>}
        </div>;
      }
      if (r.by === "a") return <div className="paper pp-card hb-side mine">
        <Tab by="a" t={label(r, i)}/>
        <div className="hb-top"><div><div className="hb-sh"><span className="ok"><Ic.Check s={10} w={3} c="#FFF"/></span>{status(r)}</div><h2>{`Version ${r.n}`}</h2><p>{(i > 0 ? `You changed ${d.length} of ${S.length} sections. ` : "") + (r.opened ? `${O} has opened it.` : `${O} hasn't opened it yet.`)}</p></div><div className="st-mini"><Split sp={sp} N={N} label="Your proposal"/></div></div>
        <PickList picks={r.picks} d={d} prevN={i > 0 ? rounds[i - 1].n : null}/>
        <div className="hb-row">{!r.opened ? <button className="btn sm ghost" onClick={act.withdraw}>Withdraw and edit</button> : <span className="st-left" style={{ color: "var(--mute)" }}>Opened — can't be withdrawn</span>}<button className="btn sm hb-cta" onClick={() => go("draft")}>Open your proposal<Ic.Arrow s={12}/></button></div>
      </div>;
      const same = S.filter((s) => !changed.includes(s));
      return <div className="paper pp-card hb-side theirs">
        <Tab by="b" t={label(r, i)}/>
        <div className="hb-top"><div><div className="hb-sh"><span className="ok"><Ic.Check s={10} w={3} c="#FFF"/></span>{status(r)}</div><h2>{`${O}'s counter`}</h2><p>{`${changed.length} section${changed.length !== 1 ? "s" : ""} changed${need ? ` · ${need} still need${need === 1 ? "s" : ""} a response` : " · all answered"}.`}</p></div><div className="st-mini"><Split sp={sp} N={N} label={`${O}'s version`}/></div></div>
        {changed.length > 0 && <div className="hb-list">{changed.map((s) => <ReplySec key={s.id} s={s} N={N} compact mine={lastA.picks[s.id]} theirs={r.picks[s.id]} why={r.why[s.id]} myWhy={lastA.why[s.id]} resp={resp[s.id]} setResp={(x) => setResp(s.id, x)}/>)}</div>}
        {same.length > 0 && <div className="hb-same"><Ic.Check s={11} w={3}/><span><b>{`Agreed as written: `}</b>{same.map((s) => s.t).join(" · ")}</span></div>}
        <div className="hb-row"><span className="st-left">{need ? `${need} to answer` : "Ready to send"}</span><div className="st-btns"><button className="btn sm ghost" onClick={() => go("reply")}>Open full reply</button><button className="btn sm" disabled={need > 0} onClick={act.send}>{changed.every((s) => resp[s.id] && resp[s.id].k === "accept") ? `Accept v${r.n} as written` : `Send v${r.n + 1}`}<Ic.Arrow s={12}/></button></div></div>
      </div>;
    }

    return <div className="hb">
      <div className="paper pp-card rc-head hb-head"><div className="pq-k" style={{ color: "#0369A1" }}>Settle · proposals</div><h1>{h}</h1>
        <p className="pq-why">{`You each put forward how to split the household. Every round is a full version — accept it as written, or change what you can't live with.`}</p>
        {rounds.length > 0 && <Conv S={S} N={N} rounds={rounds} agreed={agreed} finalN={finalN}/>}
      </div>
      {!rounds.length && <div className="paper pp-card hb-side mine">
        <Tab by="a" t="YOUR PROPOSAL"/>
        <div className="hb-top"><div><div className="hb-sh"><span style={{ color: "var(--mute)" }}>Private draft</span></div><h2>Your opening proposal</h2><p>{`${S.filter((s) => ST.opt(s, draftPicks[s.id]) || draftPicks[s.id] === "custom").length} of ${S.length} decisions drafted.`}</p></div><div className="st-mini"><Split sp={ST.split(S, draftPicks)} N={N} label="Your draft"/></div></div>
        <PickList picks={draftPicks}/>
        <div className="hb-row"><span></span><button className="btn sm hb-cta" onClick={() => go("draft")}>Finish your draft<Ic.Arrow s={12}/></button></div>
      </div>}
      {rounds.map((r, i) => <Card key={r.n} r={r} i={i}/>)}
      {!agreed && (!rounds.length || last.by === "a") && <div className="paper pp-card hb-side theirs st-off">
        <Tab by="b" t={`${O.toUpperCase()}'S REPLY`} on={false}/>
        <div className="hb-top"><div><div className="hb-sh"><span style={{ color: "var(--mute)" }}>{last ? `v${last.n + 1} · waiting` : "After you send"}</span></div><h2>{`${O}'s reply`}</h2><p>{last ? "We'll tell you as soon as it lands." : "Send your proposal first."}</p></div></div>
        {last && <div className="hb-wt"><span className="spin"></span><span>{last.opened ? `${O} is reading v${last.n}.` : `${O} hasn't opened v${last.n} yet.`}</span>{!last.opened && <button className="proto-mini" onClick={act.open}>{`Simulate ${O} opening`}</button>}<button className="proto-mini" onClick={act.simMark}>{`Simulate ${O} replying`}</button></div>}
      </div>}
      <div className={"paper pp-card hb-house" + (agreed ? "" : " off")}>
        <span className="ftab" style={{ background: agreed ? "#047857" : "#A8A29E", gap: 5, paddingLeft: 5 }}><Av w="a" N={N} size={15}/><Av w="b" N={N} size={15}/>{agreed ? `AGREEMENT · v${finalN} FINAL` : "AGREEMENT"}</span>
        <div className="hb-hh"><div><div className="pq-k" style={{ color: agreed ? "#047857" : "var(--mute)", display: "flex", gap: 6, alignItems: "center" }}>{agreed ? (locked ? <><Ic.Lock s={11}/>Signed · locked</> : "Agreed · ready to sign") : <><Ic.Lock s={11}/> Not yet</>}</div>
          {agreed && <div className="hb-fv"><b>{`v${finalN}`}</b><span>Final version</span></div>}
          <h2>The settlement you both agree.</h2><p>{agreed ? `Made from v${last.n} as written. ${locked ? "Signed by you both — next, Finalise turns it into court documents." : "Sign it and it goes to Finalise to become court documents."}` : "Opens when one of you accepts the other's version as written."}</p></div>
          <div className="hb-nums"><button className="btn" disabled={!agreed} onClick={() => go("agree")}>{agreed ? (locked ? "Open agreement" : "Review and sign") : "Agreement"}{agreed ? <Ic.Arrow s={13}/> : <Ic.Lock s={12}/>}</button>{agreed && !rev && <button className="lnk hb-recall" onClick={act.recall}>{locked ? "Reverse agreement" : "Recall agreement"}</button>}</div></div>
        {rev && <div className="st-rev"><span className="spin"></span><span><b>{`Reversal requested · waiting for ${O}`}</b>{`The agreement stays signed and locked until ${O} confirms.`}</span><div className="st-btns"><button className="proto-mini" onClick={act.revConfirm}>{`Simulate ${O} confirming`}</button><button className="lnk" onClick={act.revCancel}>Cancel request</button></div></div>}
      </div>
    </div>;
  }

  /* ---------- agreement: rendered as a ruled A4 legal sheet ---------- */
  const SI = (d) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
  const SecIc = {
    children: SI(<><circle cx="9" cy="7" r="2.5"/><circle cx="16" cy="9" r="2"/><path d="M4.5 20v-2.5A3.5 3.5 0 0 1 8 14h2a3.5 3.5 0 0 1 3.5 3.5V20"/><path d="M14.5 14.5h2.5a3 3 0 0 1 3 3V20"/></>),
    home: SI(<><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><rect x="10" y="14" width="4" height="6"/></>),
    pensions: SI(<><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/></>),
    savings: SI(<><path d="M3 10l9-6 9 6"/><line x1="6" y1="10" x2="6" y2="17"/><line x1="10" y1="10" x2="10" y2="17"/><line x1="14" y1="10" x2="14" y2="17"/><line x1="18" y1="10" x2="18" y2="17"/><line x1="3" y1="20" x2="21" y2="20"/></>),
    vehicles: SI(<><path d="M4 16v-4l2-5h12l2 5v4z"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/></>),
    debts: SI(<><rect x="3" y="6" width="18" height="12" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="14.5" x2="11" y2="14.5"/></>),
    spousal: SI(<><path d="M4 9h13"/><polyline points="14 6 17 9 14 12"/><path d="M20 15H7"/><polyline points="10 12 7 15 10 18"/></>),
  };
  const today = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  function Agree({ S, N, picks, custom, sign = {}, finalN, fromN, locked, onSign }) {
    const sp = ST.split(S, picks), O = N.Them;
    const ref = `DC-${new Date().getFullYear()}-0417`;
    const Sig = ({ k, nm }) => <div className={"la-sig" + (sign[k] ? " on" : "")}><small>{k === "a" ? "Party A" : "Party B"}</small>
      <div className="ln">{sign[k] ? (sign[k + "g"] ? <window.STSg g={sign[k + "g"]} cls="la-sgv"/> : <span className="hand">{sign[k + "n"] || nm}</span>) : k === "a" && onSign && !locked ? <button className="btn sm" onClick={onSign}>Sign here<Ic.Arrow s={11}/></button> : <span className="wait">Awaiting signature</span>}</div>
      <b>{nm}</b><span>{sign[k] ? `Signed electronically · ${sign[k + "d"] || today()}` : "Not yet signed"}</span></div>;
    return <div className="la-wrap"><article className="la-sheet" aria-label="Settlement agreement">
      <header className="la-top"><span>Decouple</span><span className="mono">{`${ref} · v${finalN} FINAL`}</span></header>
      <h2 className="la-t">Financial Settlement Agreement</h2>
      <p className="la-sub">{`between ${N.Me} and ${O}`}</p>
      <div className="la-meta"><span>{`Version ${finalN} · Final`}</span><span>{`Made from v${fromN} as written`}</span><span>{locked ? "Signed by both parties" : "Ready to sign"}</span></div>
      <div className="la-parties"><div><small>Party A</small><b>{N.Me}</b></div><div><small>Party B</small><b>{O}</b></div></div>
      <h4 className="la-h">Background</h4>
      <ol className="la-rec" type="A"><li>{`The parties have exchanged financial disclosure through Decouple and agree the values recorded in their household picture.`}</li><li>{`This agreement records how they will divide those assets and arrange for the children. It is intended to form the basis of a consent order.`}</li></ol>
      <h4 className="la-h">The parties agree as follows</h4>
      <div className="la-cls">{S.map((s, i) => { const o = ST.opt(s, picks[s.id]), xs = custom[s.id + "_x"] || [], st = o && o.r === "stretch";
        return <section key={s.id} className="la-cl"><span className="la-ic" aria-hidden="true">{SecIc[s.id]}</span>
          <div className="bd"><div className="hh"><span className="no">{`${i + 1}.`}</span><h5>{s.t}</h5></div>
            <p className="term">{o ? o.t : custom[s.id] || "As set out by the parties"}.</p>{o && o.d && <p className="det">{o.d}</p>}
            {o && o.a != null && <div className="la-amt"><span>{`${N.Me}`}<b className="tab">{ST.gbp(o.a)}</b></span><span>{`${O}`}<b className="tab">{ST.gbp(o.b)}</b></span></div>}
            {o && o.a == null && o.total != null && <div className="la-amt"><span>Total<b className="tab">{o.total ? ST.gbp(o.total) : "£0"}</b></span></div>}
            {xs.length > 0 && <ul className="la-x">{xs.map((x) => <li key={x}>{x}</li>)}</ul>}
            {st && <div className="la-note"><b>Note before signing</b><span>{`Marked "a stretch". ${o.rw} A judge may ask you both to explain it, or send it back.`}</span></div>}
          </div></section>; })}</div>
      <h4 className="la-h">Overall division</h4>
      <table className="la-tot"><tbody><tr><td>{N.Me}</td><td className="tab">{ST.gbp(sp.a)}</td><td className="tab">{`${sp.pa}%`}</td></tr><tr><td>{O}</td><td className="tab">{ST.gbp(sp.b)}</td><td className="tab">{`${100 - sp.pa}%`}</td></tr><tr className="t"><td>Total divided</td><td className="tab">{ST.gbp(sp.total)}</td><td></td></tr></tbody></table>
      <h4 className="la-h">Signed</h4>
      <div className="la-sigs"><Sig k="a" nm={N.Me}/><Sig k="b" nm={O}/></div>
      <footer className="la-foot"><span>{`v${finalN} Final · Page 1 of 1`}</span><span>Not legally binding until approved by the court as a consent order.</span></footer>
    </article></div>;
  }

  Object.assign(window, { STSecIc: SecIc, STDraft: Draft, STReply: Reply, STHub: Hub, STAgree: Agree, STSplit: Split, STRz: Rz });
})();
