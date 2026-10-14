/* Dashboard — evidence vault, guides library, account settings, modals */
(function () {
  const { useState } = React;
  const Ic = window.DIc, DB = window.DB;
  const Av = (p) => <window.RCAv {...p}/>;

  function Vault({ N, vault, shared, onOpen, onUpload }) {
    const [f, setF] = useState("all"), O = N.Them;
    const all = vault.filter((v) => v.who === "a" || shared), st = (v) => DB.status(v).k;
    const L = all.filter((v) => f === "all" || (f === "att" && ["old", "soon"].includes(st(v))) || (f === "a" && v.who === "a") || (f === "b" && v.who === "b"));
    const n = (k) => all.filter((v) => st(v) === k).length;
    return <div className="rc-main db-main">
      <window.DBHead tab="EVIDENCE VAULT" k="Your evidence" h={<>Evidence <em>vault.</em></>} p={`Every document behind your picture, in one place. We flag anything a judge might say is out of date.${shared ? "" : ` ${O}'s appear here once he shares.`}`}>
        <div className="rc-tally">{n("old") > 0 && <span className="op"><i></i>{`${n("old")} out of date`}</span>}{n("soon") > 0 && <span className="sn"><i></i>{`${n("soon")} renew soon`}</span>}{n("wait") > 0 && <span><i></i>{`${n("wait")} awaited`}</span>}<span className="ok"><i></i>{`${n("ok")} current`}</span></div>
      </window.DBHead>
      <div className="db-vbar"><div className="db-chips">{[["all", "All"], ["att", "Needs attention"], ["a", "Yours"], shared && ["b", `${O}'s`]].filter(Boolean).map(([k, l]) => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l}</button>)}</div><button className="btn sm" onClick={onUpload}><Ic.Plus s={13}/>Upload</button></div>
      {DB.CAT.map(([c, t]) => { const xs = L.filter((v) => v.cat === c); if (!xs.length) return null;
        return <section key={c} className="paper pp-card db-card"><div className="db-ch"><div className="pq-k">{t}</div><small>{`${xs.length} file${xs.length > 1 ? "s" : ""}`}</small></div><div className="db-vgrid">{xs.map((v) => <window.DBTile key={v.id} v={v} N={N} onOpen={onOpen}/>)}</div></section>; })}
      {!L.length && <p className="db-empty center">Nothing needs attention. Everything is current.</p>}
    </div>;
  }

  function VaultModal({ v, N, close, onReplace, onRemind }) {
    const s = DB.status(v), mine = v.who === "a";
    return <div className="mscrim" onClick={(e) => e.target === e.currentTarget && close()}><div className="mbox wide db-vm" role="dialog" aria-modal="true" aria-label={v.t}>
      <button className="mx" aria-label="Close" onClick={close}><Ic.X s={16}/></button>
      <div className="db-vmg"><div className="pv"><window.DBMini v={v}/></div>
        <div className="in"><div className="pq-k">{mine ? "Your evidence" : <><Av w="b" N={N} size={14}/>{`${N.Them}'s evidence`}</>}</div><h3>{v.t}</h3><p className="src">{v.src}</p><window.DBLz k={s.k}/>
          <dl>{v.cov && <><dt>Covers</dt><dd>{v.cov}</dd></>}{v.up && <><dt>Uploaded</dt><dd>{`${DB.fmtY(v.up)} · ${DB.ago(v.up)}`}</dd></>}{v.amt && <><dt>Shows</dt><dd>{v.amt}</dd></>}</dl>
          <p className={"rule s-" + s.k}>{s.s}</p>
          <div className="mrow">{v.awaited ? <button className="btn" onClick={() => onReplace(v)}>It's arrived · upload it</button> : mine ? <button className={"btn" + (s.k === "ok" ? " ghost" : "")} onClick={() => onReplace(v)}>{s.k === "ok" ? "Replace" : "Upload a newer one"}</button> : ["old", "soon"].includes(s.k) && <button className="btn" onClick={() => onRemind(v)}>{`Ask ${N.Them} for a newer one`}</button>}<button className="btn ghost" onClick={close}>Close</button></div>
        </div></div>
    </div></div>;
  }

  const CATS = ["All", "Legal", "Money", "Children", "Wellbeing"];
  function Guides({ sc, openGuide }) {
    const [c, setC] = useState("All"), L = DB.GUIDES.filter((g) => c === "All" || g.cat === c);
    return <div className="rc-main db-main">
      <window.DBHead tab="GUIDES" k="Help as you go" h={<>Short <em>guides.</em></>} p="Plain-English help for each stage, written by family lawyers. The ones marked “Now” fit where you are."/>
      <div className="db-chips">{CATS.map((x) => <button key={x} className={c === x ? "on" : ""} onClick={() => setC(x)}>{x}</button>)}</div>
      <div className="db-glib">{L.map((g) => <button key={g.id} className="paper db-g lg" onClick={() => openGuide(g)}><span className="tp"><span className={"cat c-" + g.cat.toLowerCase()}>{g.cat}</span>{g.at.includes(sc) && <em>Now</em>}</span><b>{g.t}</b><p>{(g.body.find((x) => x[0] === "p") || [, ""])[1]}</p><small>{`${g.min} min read`}</small></button>)}</div>
    </div>;
  }
  function GuideModal({ g, close }) {
    return <div className="mscrim" onClick={(e) => e.target === e.currentTarget && close()}><div className="mbox wide db-gm" role="dialog" aria-modal="true" aria-label={g.t}>
      <button className="mx" aria-label="Close" onClick={close}><Ic.X s={16}/></button>
      <span className={"cat c-" + g.cat.toLowerCase()}>{g.cat}</span><h3>{g.t}</h3><small className="rt">{`${g.min} min read · reviewed by a family solicitor`}</small>
      {g.body.map(([k, x], i) => k === "p" ? <p key={i}>{x}</p> : k === "h" ? <h4 key={i}>{x}</h4> : k === "ul" ? <ul key={i}>{x.map((y) => <li key={y}>{y}</li>)}</ul> : <div key={i} className="tip"><Ic.Spark s={13}/><span>{x}</span></div>)}
      <div className="mrow"><button className="btn" onClick={close}>Got it</button></div>
    </div></div>;
  }

  /* account */
  const SECT = [["profile", "Profile & contact"], ["plan", "Plan & billing"], ["security", "Security"], ["notify", "Notifications"], ["sharing", "Sharing with Mark"], ["privacy", "Quick exit & privacy"], ["data", "Your data"], ["help", "Help & support"]];
  const Sw = ({ on, set, l, s }) => <label className="db-sw"><span><b>{l}</b>{s && <small>{s}</small>}</span><input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)}/><i></i></label>;
  const F = ({ l, v, t = "text" }) => <label className="db-f"><span>{l}</span><input type={t} defaultValue={v}/></label>;
  function Account({ N, acc, setAcc, plan, say }) {
    const O = N.Them, a = acc, u = (k) => (v) => setAcc({ ...a, [k]: v }), P = { picture: ["Your picture", "£99"], guided: ["Guided settlement", "£499"], complete: ["Complete & filed", "£999"] }[plan];
    const Card = ({ id, t, children }) => <section id={"acc-" + id} className="paper pp-card db-card db-acc"><div className="db-ch"><h2>{t}</h2></div>{children}</section>;
    return <div className="rc-main db-main">
      <window.DBHead tab="ACCOUNT" av={<Av w="a" N={N} size={15}/>} k="Account settings" h={<>Your <em>account.</em></>} p={`Only you can see this page. Nothing here is shared with ${O}.`}/>
      <Card id="profile" t="Profile & contact"><div className="db-fs"><F l="Full name" v="Sarah Mitchell"/><F l="Email" v="sarah.mitchell@example.com" t="email"/><F l="Mobile" v="07700 900481" t="tel"/><F l="Address" v="12 Oak Road, Exeter EX4 6PL"/></div><div className="db-rw"><span><b>Safest way to contact you</b><small>We'll only use this for anything time-sensitive.</small></span><select defaultValue="email"><option value="email">Email</option><option value="sms">Text message</option><option value="app">In the app only</option></select></div><button className="btn sm" onClick={() => say("Profile saved")}>Save changes</button></Card>
      <Card id="plan" t="Plan & billing"><div className="db-plan"><div><span className="pq-k">Your plan</span><b>{P[0]}</b><small>{`${P[1]} · one-off payment, paid 21 Sep 2026`}</small></div>{plan !== "complete" && <button className="btn sm" onClick={() => window.Journey.goStage("signup", "#plan")}>Upgrade to Complete & filed</button>}</div>
        <div className="db-rw"><span><b>Payment method</b><small>Visa ending 4242 · expires 08/29</small></span><button className="lnk" onClick={() => say("Card details are handled by our payment provider")}>Change</button></div>
        <div className="db-inv">{[["21 Sep 2026", P[0], P[1]], plan === "complete" && ["10 Oct 2026", "Filing by our partner solicitor", "£199"]].filter(Boolean).map(([d, t, p]) => <div key={d}><span>{d}</span><span>{t}</span><b>{p}</b><button className="lnk" onClick={() => say("Receipt downloaded", "PDF · prototype")}>Receipt</button></div>)}</div></Card>
      <Card id="security" t="Security"><div className="db-rw"><span><b>Password</b><small>Last changed 21 Sep 2026</small></span><button className="btn sm ghost" onClick={() => say("We've emailed you a link to change it")}>Change</button></div>
        <Sw on={a.mfa} set={u("mfa")} l="Two-step verification" s="A code by text each time you sign in on a new device"/>
        <div className="db-dev">{[["MacBook · Chrome", "Exeter · this device", true], ["iPhone · Decouple app", "Exeter · 2 days ago"]].map(([d, s, me]) => <div key={d}><span><b>{d}</b><small>{s}</small></span>{me ? <em>Current</em> : <button className="lnk" onClick={() => say("Signed out of " + d)}>Sign out</button>}</div>)}</div></Card>
      <Card id="notify" t="Notifications"><div className="db-nt"><span></span><b>Email</b><b>Text</b><b>App</b>{[["mk", `${O}'s activity`, `When ${O} shares, replies or signs`], ["rm", "Reminders & deadlines", "Key dates and things waiting on you"], ["ev", "Evidence going out of date", "A week before anything expires"], ["nw", "Product news", "Occasional updates from Decouple"]].map(([k, l, s]) => <React.Fragment key={k}><span><b>{l}</b><small>{s}</small></span>{["e", "t", "a"].map((ch) => { const id = k + ch; return <label key={id} className="db-cb"><input type="checkbox" checked={!!a.nt[id]} onChange={(e) => setAcc({ ...a, nt: { ...a.nt, [id]: e.target.checked } })} aria-label={`${l} by ${{ e: "email", t: "text", a: "app" }[ch]}`}/><i></i></label>; })}</React.Fragment>)}</div>
        <Sw on={a.quiet} set={u("quiet")} l="Quiet hours" s="No texts or app alerts between 9pm and 8am"/></Card>
      <Card id="sharing" t={`Sharing with ${O}`}><div className="db-rw"><span><b>Your picture</b><small>Shared on 28 Sep 2026. Shared figures can't be unshared, but you can correct them.</small></span><em className="db-tagok">Shared</em></div>
        <Sw on={a.shareEv} set={u("shareEv")} l="Share new evidence automatically" s={`Off: you choose each time before ${O} sees a new upload`}/>
        <Sw on={a.presence} set={u("presence")} l={`Let ${O} see when you're online`} s="Shows your avatar on documents you're viewing"/>
        <Sw on={a.nudge} set={u("nudge")} l={`Allow ${O} to send you nudges`} s="Neutral reminders, at most one every 3 days"/></Card>
      <Card id="privacy" t="Quick exit & privacy"><Sw on={a.esc} set={u("esc")} l="Quick exit shortcut" s="Press Esc twice to leave instantly"/>
        <div className="db-rw"><span><b>Quick exit goes to</b><small>Opens in place of Decouple and clears it from the back button</small></span><select value={a.exitTo} onChange={(e) => u("exitTo")(e.target.value)}><option value="weather">BBC Weather</option><option value="google">Google</option><option value="news">BBC News</option></select></div>
        <Sw on={a.tab} set={u("tab")} l="Neutral tab title" s="Your browser tab says “Notes” instead of Decouple"/>
        <Sw on={a.preview} set={u("preview")} l="Hide message previews" s="Notifications say “You have an update” and nothing else"/></Card>
      <Card id="data" t="Your data"><div className="db-rw"><span><b>Download everything</b><small>Your picture, evidence, proposals and documents, as a ZIP file</small></span><button className="btn sm ghost" onClick={() => say("We're preparing your download", "We'll email you a link within an hour.")}>Request download</button></div>
        <div className="db-rw danger"><span><b>Delete your account</b><small>{`Deletes everything only you can see. What you've shared with ${O} stays in his record, as your agreement requires.`}</small></span><button className="btn sm ghost dg" onClick={() => say("Deleting needs a second step", "We've emailed you to confirm.")}>Delete account</button></div></Card>
      <Card id="help" t="Help & support"><div className="db-help">{[["Chat with us", "Mon–Fri 9am–6pm · usually under 5 minutes"], ["Email support", "hello@decouple.uk · within 1 working day"], ["Book a call back", "15 minutes with our support team"]].map(([t, s]) => <button key={t} onClick={() => say(t, "Prototype")}><b>{t}</b><small>{s}</small></button>)}</div>
        <div className="db-safe"><Ic.Shield s={15}/><span><b>If you feel unsafe</b>Call 999 in an emergency. The National Domestic Abuse Helpline is free and open 24 hours: 0808 2000 247.</span></div></Card>
    </div>;
  }
  Object.assign(window, { DBVault: Vault, DBVaultModal: VaultModal, DBGuides: Guides, DBGuideModal: GuideModal, DBAccount: Account, DBSECT: SECT });
})();
