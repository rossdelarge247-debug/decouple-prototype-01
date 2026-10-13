/* Dashboard — shared parts + overview */
(function () {
  const { useState } = React;
  const Ic = window.DIc, J = window.Journey, DB = window.DB;
  const Av = (p) => <window.RCAv {...p}/>;
  const LZ = { ok: ["Current", "#047857", "#ECFDF5"], soon: ["Renew soon", "#92400E", "#FEF3C7"], old: ["Out of date", "#B91C1C", "#FEE2E2"], wait: ["Awaited", "#475569", "#F1F5F9"] };
  const Lz = ({ k }) => { const x = LZ[k]; return <span className={"db-lz " + k} style={{ color: x[1], background: x[2] }}><i style={{ background: x[1] }}></i>{x[0]}</span>; };
  const go = (g) => (g[0] === "dashboard" ? (location.hash = g[1] || "#hub") : J.goStage(g[0], g[1]));

  const Bars = ({ n = 3, w = [80, 60, 70, 50] }) => <>{Array.from({ length: n }, (_, i) => <i key={i} className="br" style={{ width: w[i % w.length] + "%" }}></i>)}</>;
  const Row = ({ l, v }) => <span className="rw"><span>{l}</span><b>{v}</b></span>;
  function Mini({ v }) {
    if (v.awaited) return <div className="db-mini aw"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/></svg><b>Awaited</b><small>{v.src}</small></div>;
    const c = v.col || "#1C1917";
    return <div className={"db-mini k-" + v.kind}><div className="lh" style={{ borderColor: c }}><b style={{ color: c }}>{v.src}</b><small>{v.cov}</small></div><div className="tt">{v.t.split(" · ")[0]}</div>
      {v.kind === "payslip" && <div className="tb"><Row l="Basic pay" v="3,560.00"/><Row l="Income tax" v="−412.20"/><Row l="National Ins." v="−198.40"/><Row l="Pension" v="−312.00"/><span className="tot"><span>Net pay</span><b>{v.amt}</b></span></div>}
      {(v.kind === "bank" || v.kind === "card") && <div className="tb">{["02", "05", "09", "14", "19", "23", "28"].map((d, i) => <span key={d} className="tx"><span>{d}</span><i className="br" style={{ width: [70, 45, 60, 38, 55, 66, 42][i] + "%" }}></i><b>{["−42.10", "+2,847", "−1,842", "−18.99", "−65.00", "−120.0", "−9.99"][i]}</b></span>)}<span className="tot"><span>{v.kind === "card" ? "Balance" : "Closing"}</span><b>{v.amt}</b></span></div>}
      {v.kind === "valuation" && <div className="tb"><Bars n={5}/><span className="tot big"><span>Market value</span><b>{v.amt}</b></span><Bars n={2} w={[60, 40]}/></div>}
      {v.kind === "cetv" && <div className="tb"><Bars n={3}/><span className="tot big"><span>Cash equivalent transfer value</span><b>{v.amt}</b></span><Bars n={2} w={[50, 70]}/></div>}
      {v.kind === "mortgage" && <div className="tb"><Row l="Opening balance" v="173,010"/><Row l="Payments" v="−1,842 × 1"/><Row l="Interest" v="+72.00"/><span className="tot"><span>Outstanding</span><b>{v.amt.replace(" owing", "")}</b></span><Bars n={2}/></div>}
      {v.kind === "p60" && <div className="tb grid">{["Pay", "Tax", "NI", "Code"].map((l, i) => <span key={l} className="bx"><small>{l}</small><b>{[v.amt.replace(".00", ""), "5,130", "2,412", "1257L"][i]}</b></span>)}</div>}
    </div>;
  }
  function Tile({ v, N, onOpen, big }) {
    const s = DB.status(v);
    return <button className={"db-tile s-" + s.k + (big ? " big" : "")} onClick={() => onOpen(v)}>
      <span className="pv"><Mini v={v}/>{v.who === "b" && <span className="wh"><Av w="b" N={N} size={18}/></span>}{(s.k === "old" || s.k === "soon") && <span className="fl" title={s.l}>!</span>}</span>
      <b>{v.t}</b><small>{v.awaited ? s.s.split(" · ")[0] : `Uploaded ${DB.fmt(v.up)} · ${v.cov}`}</small><Lz k={s.k}/>
    </button>;
  }

  function Head({ c = "#5B21B6", tab, k, h, p, av, children }) {
    return <div className="paper pp-card rc-head db-head" style={{ "--hc": c }}><span className="ftab rc-ftab" style={{ background: c }}>{av}{tab}</span><div className="pq-k" style={{ color: c }}>{k}</div><h1>{h}</h1>{p && <p className="pq-why">{p}</p>}{children}</div>;
  }

  const PH = [["Getting started", "Onboard"], ["Household picture", "Yours, theirs, together"], ["Proposals", "Settle"], ["Finalise", "Court documents & filing"]];
  const NOW = { picture: "Your picture", household: "Checking each other's pictures", settle: "Mark's counter-proposal, v3", finalise: "Signing your court documents", filed: "With the court" };
  const SUB = { picture: "Getting your numbers and evidence together.", household: "You've shared. Now you check each other's pictures.", settle: "You're negotiating the settlement, one version at a time.", finalise: "Agreed. Now the paperwork for the court.", filed: "Your consent order is with the court." };

  const RES = (O) => ({
    picture: [<>Let's jump back into<br/><em>your picture.</em></>, "Debts, pensions and children are still to do. About 15 minutes.", "Continue your picture", ["prepare"]],
    household: [<>{`${O} has questions`}<br/><em>about your picture.</em></>, `He's asked about the joint account and the car. Answer them, then check his picture.`, `Answer ${O}`, ["reconcile", "#hub"]],
    settle: [<>{`${O} has replied`}<br/><em>to your proposal.</em></>, "He accepted 5 of 7 sections in v3 and changed 2. Read his changes and respond.", "See his reply", ["settle", "#reply"]],
    finalise: [<>Let's jump back into<br/><em>your court documents.</em></>, "Form D81 is the last one you need to sign. Then we run the pre-flight checks.", "Sign Form D81", ["finalise", "#docs"]],
    filed: [<>Your order is<br/><em>with the court.</em></>, "Filed by our solicitor on 10 Oct. The court usually decides in 4 to 8 weeks. Nothing for you to do.", "Open your tracker", ["finalise", "#track"]],
  });

  const DL = (t, s, k = "pdf") => ({ t, s, k });
  const PAST = (N, sc) => {
    const O = N.Them, signed = sc === "finalise" || sc === "filed";
    return {
      0: { h: <>Getting started<br/><em>is complete.</em></>, p: "You took the tour, connected your bank and worked through your first steps.", cta: "Revisit getting started", go: ["onboard"],
        dl: [DL("Your interview summary", "What you told us on day one · 2 pages")],
        done: [["Took the welcome tour", "21 Sep"], ["Connected Monzo · 3 accounts", "21 Sep"], ["Confirmed your interview answers", "22 Sep"], ["Requested your NHS pension valuation", "2 Sep"], [`Gave ${O} a heads-up`, "23 Sep"]] },
      1: { h: <>Your household picture<br/><em>is complete.</em></>, p: `You and ${O} have both shared, checked each other's figures and signed off one agreed picture. Everything in Proposals is built on it.`, cta: "Open the household picture", go: ["reconcile", "#house"],
        dl: [DL(`Form E · ${N.Me}`, "Financial statement · 28 pages · signed 3 Oct"), DL(`Form E · ${O}`, "Financial statement · 26 pages · signed 3 Oct"), DL("Form ES2 · Asset schedule", "Both of you, side by side · agreed 3 Oct"), DL("Household picture summary", "Plain-English overview · 4 pages")],
        done: [["Shared your picture", "28 Sep"], [`Checked ${O}'s picture · 34 items`, "1 Oct"], [`Answered ${O}'s 4 questions`, "2 Oct"], ["Resolved 2 differences: the car and the joint account", "2 Oct"], ["Signed off the household picture together", "3 Oct"]] },
      2: { h: <>Your proposals<br/><em>are agreed.</em></>, p: `It took 5 versions. You both signed v5 on ${signed ? "8 Oct" : "—"}, and your court documents are drafted from it.`, cta: "Open the agreement", go: ["settle", "#agree"],
        dl: [DL("Signed agreement · v5", "7 sections · signed by you both · 6 pages"), DL("Version history", "v1 to v5, with every change · 12 pages")],
        done: [["Sent your opening proposal · v1", "4 Oct"], [`${O}'s counter-proposals · v2 and v4`, "5–7 Oct"], ["Agreed all 7 sections", "8 Oct"], ["Signed the agreement · v5", "8 Oct"]] },
    };
  };
  function DocSec({ dl, N, k = "Your documents", lz = "Agreed" }) {
    const [got, setGot] = useState({}), P = { dl };
    return <section className="paper pp-card db-card"><div className="db-ch"><div className="pq-k" style={{ color: "#047857" }}>{k}</div><small>{`${dl.length} to download`}</small></div>
        <div className="db-strip db-dstrip">{P.dl.map((d) => <div key={d.t} className="db-tile big"><button className="pv" onClick={() => setGot({ ...got, [d.t]: true })} aria-label={`Download ${d.t}`}><div className="db-mini doc"><div className="lh" style={{ borderColor: "#1C1917" }}><b>{d.t.split(" · ")[0]}</b><small>{d.t.split(" · ")[1] || "Decouple"}</small></div><div className="tb">{[86, 72, 90, 64, 80, 58, 76, 88, 52, 70, 84, 60].map((w, i) => <i key={i} className="br" style={{ width: w + "%" }}></i>)}</div><div className="sg"><i>{N.Me}</i><i>{N.Them}</i></div></div><span className="dlh"><Ic.Down s={16}/></span></button><b>{d.t}</b><small>{d.s}</small><span className="db-tf"><span className="db-lz ok" style={{ color: "#047857", background: "#ECFDF5" }}><i style={{ background: "#047857" }}></i>{lz}</span><button className={"lnk" + (got[d.t] ? " ok" : "")} onClick={() => setGot({ ...got, [d.t]: true })}>{got[d.t] ? "Downloaded" : "Download PDF"}</button></span></div>)}</div>
      </section>;
  }
  const COURT = (N) => [DL("Consent order", "Sealed copy to follow · 6 pages"), DL("Form A", "Notice of application · 4 pages"), DL("Form D81", "Statement of information · signed by you both · 14 pages"), DL("Form P1", "Pension sharing annex · 3 pages"), DL("Plain-English summary", "For your records · 3 pages")];
  function Past({ P, N }) {
    return <>
      <DocSec dl={P.dl} N={N}/>
      <section className="paper pp-card db-card"><div className="db-ch"><div className="pq-k">What you did</div><small>{`${P.done.length} complete`}</small></div>
        {P.done.map(([t, d]) => <div key={t} className="db-td dn"><span className="ckd"><Ic.Check s={11} w={3} c="#FFF"/></span><span className="bd"><b>{t}</b></span><span className="tg">{d}</span><span></span></div>)}
      </section>
    </>;
  }

  function Hub({ N, sc, vault, shared, nudged, setNudged, onOpen, openGuide, done, setDone, say, lean }) {
    const O = N.Them, { T, W, K, A } = DB.content(sc, N, shared, vault), pi = DB.PHASE[sc];
    const mine = vault.filter((v) => v.who === "a" || shared), bad = mine.filter((v) => ["old", "soon"].includes(DB.status(v).k));
    const strip = [...mine].sort((a, b) => ({ old: 0, soon: 1, wait: 2, ok: 3 }[DB.status(a).k] - { old: 0, soon: 1, wait: 2, ok: 3 }[DB.status(b).k]));
    const G = DB.GUIDES.filter((g) => g.at.includes(sc)).slice(0, 3);
    const open = T.filter((x) => !done[x.k] && !x.done0), hour = 9;
    let R = RES(O)[sc];
    let nowL = NOW[sc]; if (sc === "filed" && window.DBtrackState) { const { L, t } = window.DBtrackState(); nowL = t >= L.length - 1 ? "In effect" : t >= 3 ? "Sealed" : "With the court"; }
    if (sc === "filed" && window.DBtrackState) { const { f, L, t } = window.DBtrackState(), at = f.filed ? f.filed.at : "";
      R = t >= L.length - 1 ? [<>Your financial order<br/><em>is in effect.</em></>, "The court sealed your order and both of you have acted on it. Keep your sealed copy somewhere safe.", "Download your sealed order", ["finalise", "#track"]]
        : t >= 3 ? [<>Your order is<br/><em>sealed.</em></>, "A judge approved it and it's now legally binding. You can now apply for your final divorce order.", "Apply for your final order", ["finalise", "#track"]]
        : [<>Your order is<br/><em>with the court.</em></>, `Filed${at ? " on " + at : ""}. A judge usually decides in 4 to 8 weeks. Nothing for you to do.`, "Open your tracker", ["finalise", "#track"]]; }
    const [alOpen, setAlOpen] = useState(false);
    const [view, setView] = useState(pi), [dir, setDir] = useState("n"), past = view < pi, P = past ? PAST(N, sc)[view] : null;
    const pick = (i) => { if (i > pi || i === view) return; setDir(i < view ? "b" : "f"); setView(i); };
    React.useEffect(() => { setDir("n"); setView(pi); }, [pi]);
    React.useEffect(() => { const f = (e) => { const i = e.detail; setView((v) => { if (i > pi || i === v) return v; setDir(i < v ? "b" : "f"); return i; }); scrollTo({ top: 0, behavior: "smooth" }); }; addEventListener("db:view", f); return () => removeEventListener("db:view", f); }, [pi]);
    const strip_ = <div className="db-ph" role="tablist" aria-label="Stages">{PH.map(([t, s], i) => { const lk = i > pi; return <button key={t} role="tab" aria-selected={i === view} disabled={lk} className={(i < pi ? "dn" : i === pi ? "cur" : "") + (i === view ? " on" : "")} onClick={() => pick(i)}><span className="n">{i < pi ? <Ic.Check s={10} w={3}/> : i + 1}</span><span className="tx"><b>{t}</b><small>{i === pi ? nowL : i < pi ? (i === view ? "Viewing · complete" : "Complete · view") : s}</small></span></button>; })}</div>;
    const allN = W.length > 0 && W.every((w, i) => nudged[i]);
    const nudgeAll = () => { const n = {}; W.forEach((w, i) => { n[i] = true; }); setNudged({ ...nudged, ...n }); setAlOpen(false); say(`We've nudged ${O} about ${W.length > 1 ? "all " + W.length + " things" : "it"}`, "Neutral wording, from Decouple. He won't see what you've been doing."); };
    const rows = <div className="ls">{W.map((w, i) => { const n = -DB.days(w.since), nd = nudged[i], late = n >= 7; return <div key={i} className={"it" + (late ? " late" : "")}><span className="dy"><b>{n}</b><small>{n === 1 ? "day" : "days"}</small></span><div><b>{w.t}</b>{w.s && <small>{w.s}</small>}</div>{nd ? <span className="nd"><Ic.Check s={11} w={3}/>Nudged today<button className="lnk" onClick={() => { const x = { ...nudged }; delete x[i]; setNudged(x); }}>Undo</button></span> : <button className="btn sm" onClick={() => { setNudged({ ...nudged, [i]: true }); say(`We've sent ${O} a gentle reminder`, "Neutral wording. He won't see what you've been doing."); }}>Nudge</button>}</div>; })}</div>;
    const alertEl = !past && W.length > 0 && (allN
      ? <section className={"db-alert mini" + (alOpen ? " open" : "")} role="region" aria-label={`Waiting on ${O}`}>
          <button className="mt" aria-expanded={alOpen} onClick={() => setAlOpen(!alOpen)}><span className="ok"><Ic.Check s={11} w={3}/></span><b>{`${O} nudged today`}</b><small>{`${W.length} thing${W.length > 1 ? "s" : ""} waiting on him`}</small><span className="tg">{alOpen ? "Hide" : "Show"}<svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ transform: alOpen ? "rotate(180deg)" : "none" }}><path d="M3 4.5 6 7.5 9 4.5"/></svg></span></button>
          {alOpen && rows}
        </section>
      : <section className="db-alert" role="region" aria-label={`Waiting on ${O}`}>
          <div className="hd"><span className="ic">!</span><div><b>{`${W.length} thing${W.length > 1 ? "s are" : " is"} waiting on ${O}`}</b><small>{(() => { const m = Math.max(...W.map((w) => -DB.days(w.since))); return `The oldest has been waiting ${m} day${m === 1 ? "" : "s"}. Nothing moves on until he acts.`; })()}</small></div><button className="btn" onClick={nudgeAll}>{W.length > 1 ? "Nudge all & dismiss" : "Nudge & dismiss"}<Ic.Arrow s={13}/></button></div>
          {rows}
        </section>);
    const Tl = lean ? T.filter((x) => x.k !== "fo") : T;
    return <div className={"rc-main db-main" + (lean ? " lean" : "")}>
      {!lean && alertEl}
      {past ? <Head tab={`${PH[view][0].toUpperCase()} · COMPLETE`} av={<><Av w="a" N={N} size={15}/><Av w="b" N={N} size={15}/></>} c="#047857" k={`Dashboard · ${PH[view][0]}`} h={P.h} p={P.p}>
        <div className="db-cta"><button className="btn lg" onClick={() => go(P.go)}>{P.cta}<Ic.Arrow s={14}/></button><button className="lnk" onClick={() => pick(pi)}>{`Back to ${PH[pi][0].toLowerCase()}`}</button></div>
        {strip_}
      </Head> : <Head tab={`${N.Me.toUpperCase()} · DASHBOARD`} av={<Av w={sc === "household" || sc === "settle" ? "b" : "a"} N={N} size={15}/>} c={sc === "household" || sc === "settle" ? "#0369A1" : sc === "filed" ? "#047857" : "#5B21B6"} k={`Welcome back, ${N.Me}`} h={R[0]} p={R[1]}>
        <div className="db-cta"><button className="btn lg" onClick={() => go(R[3])}>{R[2]}<Ic.Arrow s={14}/></button>{open.length > 1 && <span>{`and ${open.length - 1} more thing${open.length > 2 ? "s" : ""} on your list below`}</span>}</div>
        {lean && alertEl}
        {strip_}
      </Head>}
      <div key={view} className={"db-slide sl-" + dir}>{past ? <Past P={P} N={N}/> : <>
      {sc === "filed" && window.DBTracker && <window.DBTracker N={N}/>}
      {(sc === "filed" || sc === "finalise") && <DocSec dl={COURT(N)} N={N} k={sc === "filed" ? "Your filed court documents" : "Your court documents"} lz={sc === "filed" ? "Filed" : "Drafted"}/>}
      {lean ? <><window.DBTodo T={Tl} done={done} setDone={setDone} say={say}/><window.DBLeanDates K={K}/><window.DBLeanStuff N={N} vault={vault} shared={shared} sc={sc}/></> : <>
      <div className="db-grid">
        <div className="db-col">
          <window.DBTodo T={T} done={done} setDone={setDone} say={say}/>
          <section className="paper pp-card db-card"><div className="db-ch"><div className="pq-k">Helpful right now</div><button className="lnk" onClick={() => (location.hash = "#guides")}>All guides</button></div>
            <div className="db-gs">{G.map((g) => <button key={g.id} className="db-g" onClick={() => openGuide(g)}><span className={"cat c-" + g.cat.toLowerCase()}>{g.cat}</span><b>{g.t}</b><small>{`${g.min} min read`}</small></button>)}</div>
          </section>
        </div>
        <div className="db-col">
          <section className="paper pp-card db-card"><div className="db-ch"><div className="pq-k">Key dates & reminders</div></div>
            <div className="db-kd">{K.map((k, i) => { const d = DB.days(k.d); return <div key={i} className={"db-k" + (k.done ? " dn" : k.warn ? " wn" : "")}><span className="dt"><b>{k.d.getDate()}</b><small>{k.d.toLocaleDateString("en-GB", { month: "short" })}</small></span><div><b>{k.t}</b><small>{k.s}</small></div><em>{k.done ? "Done" : d === 0 ? "Today" : d > 0 ? `In ${d < 60 ? d + " days" : Math.round(d / 30) + " months"}` : ""}</em></div>; })}</div>
          </section>
          <section className="paper pp-card db-card"><div className="db-ch"><div className="pq-k">Recent activity</div></div>
            <div className="db-act">{A.map((a, i) => <div key={i}>{a.w === "s" ? <span className="sys">D</span> : <Av w={a.w} N={N} size={22}/>}<span>{a.t}</span><small>{DB.ago(a.d)}</small></div>)}</div>
          </section>
        </div>
      </div>
      </>}
      </>}
      {!lean && window.DBJournal && <window.DBJournal N={N} sc={sc} tasks={open} say={say}/>}
      {!lean && <section className="paper pp-card db-card db-vs"><div className="db-ch"><div className="pq-k">Evidence vault</div><span className="db-vsum">{bad.length > 0 && <span className="bad">{`${bad.length} need${bad.length === 1 ? "s" : ""} renewing`}</span>}<small>{`${mine.length} files`}</small><button className="btn sm ghost" onClick={() => (location.hash = "#vault")}>Open vault<Ic.Arrow s={12}/></button></span></div>
        <div className="db-strip">{strip.slice(0, 8).map((v) => <Tile key={v.id} v={v} N={N} onOpen={onOpen}/>)}</div>
      </section>}
      </div>
    </div>;
  }
  Object.assign(window, { DBHub: Hub, DBTile: Tile, DBMini: Mini, DBLz: Lz, DBHead: Head, DBgo: go });
})();
