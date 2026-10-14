/* MVP 00 · Public site: nav, footer and seven pages (home, how it works, tools + a page per tool, prices, right for us?, safety & privacy, FAQ).
   Built from Proto 01's system (discover.css). Every start goes to the free guide first (MVP 01). Routes are #hashes. */
(function () {
  const { useState, useEffect } = React;
  const K = window.KIT, Ic = window.KIc, S = window.SITE;
  const PAGES = [["how", "How it works"], ["tools", "Tools"], ["prices", "Prices"], ["fit", "Right for us?"], ["safety", "Safety & privacy"], ["faq", "FAQ"]];
  const go = (r) => { location.hash = r; window.scrollTo(0, 0); };
  const start = (want) => { K.log("site-start", "Start with the free guide", "cta", want || "general", { step: "Start" }); K.open(K.HOME, { start: 1, ...(want ? { want } : {}) }); };
  const signin = () => { K.write({ acct: true }); K.open(K.HOME, { home: 1 }); };
  const ALL = [...K.TOOLS, { ...K.ASK, step: "", stepT: "Any time", short: "Ask" }];
  const toolBy = (id) => ALL.find((t) => t.id === id);

  function Nav({ route }) {
    const [open, setOpen] = useState(false), [sc, setSc] = useState(false);
    useEffect(() => { const f = () => setSc(scrollY > 8); f(); addEventListener("scroll", f); return () => removeEventListener("scroll", f); }, []);
    useEffect(() => setOpen(false), [route]);
    const on = (k) => route === k || (k === "tools" && route.startsWith("tool/"));
    return <>
      <header className={"nav s-nav" + (sc ? " scrolled" : "")}>
        <window.KitMark onClick={() => go("home")}/>
        <nav className="nav-links">{PAGES.map(([k, l]) => <button type="button" key={k} className={on(k) ? "on" : ""} onClick={() => go(k)}>{l}</button>)}</nav>
        <div className="nav-right"><button type="button" className="signin" onClick={signin}>Sign in</button><button type="button" className="pillbtn exit" onClick={K.exit}><Ic.X s={12} c="#B91C1C"/> Quick exit</button><button type="button" className="btn" onClick={() => start()}>Start free <Ic.Arrow s={14}/></button></div>
        <div className="s-mob"><button type="button" className="pillbtn exit" onClick={K.exit}><Ic.X s={12} c="#B91C1C"/> Exit</button><button type="button" className="burger" aria-label="Menu" onClick={() => setOpen(true)}><Ic.Menu s={20}/></button></div>
      </header>
      <div className={"sheet-scrim" + (open ? " open" : "")} onClick={() => setOpen(false)}></div>
      <div className={"msheet" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="msheet-top"><window.KitMark onClick={() => go("home")}/><button type="button" className="burger" style={{ display: "flex", background: "#FFF" }} aria-label="Close menu" onClick={() => setOpen(false)}><Ic.X s={18}/></button></div>
        <nav>{[["home", "Home"], ...PAGES].map(([k, l]) => <button type="button" key={k} className={on(k) ? "on" : ""} onClick={() => go(k)}>{l}<Ic.Arrow s={16}/></button>)}</nav>
        <div className="sub-actions"><button type="button" className="btn lg full" onClick={() => start()}>Start with the free guide <Ic.Arrow s={16}/></button><button type="button" className="btn lg ghost full" onClick={signin}>Sign in</button></div>
      </div>
    </>;
  }

  const Foot = () => (
    <footer className="foot s-foot"><div className="wrap">
      <window.KitMark onClick={() => go("home")}/>
      <nav>{PAGES.map(([k, l]) => <button type="button" key={k} onClick={() => go(k)}>{l}</button>)}<a href="privacy.html" target="_blank" rel="noopener">Privacy notice</a></nav>
      <small>Decouple is not a law firm, and nothing here is legal advice. For England and Wales.</small>
    </div></footer>
  );

  const Start = ({ want, label, note = true, ghost }) => <div className="s-start"><button type="button" className={"btn lg" + (ghost ? " white" : "")} onClick={() => start(want)}>{label || "Start with the free guide"} <Ic.Arrow s={16}/></button>{note && <span>5 minutes · no account needed</span>}</div>;
  const Head = ({ kick, t, em, p, children }) => <div className="s-head"><div className="kick">{kick}</div><h1 className="serif h2">{t} {em && <span className="em">{em}</span>}</h1>{p && <p className="p-lede">{p}</p>}{children}</div>;
  const priceOf = (t) => (t.pack ? "£" + K.price(t.pack) : null);
  const Tag = ({ t }) => (t.pack ? <span className="s-tag paid"><Ic.Doc s={12}/> Free · pack {priceOf(t)}</span> : <span className="s-tag"><Ic.Check s={12} w={2.4}/> Free</span>);

  function ToolCards({ compact }) {
    return <div className={"s-tools" + (compact ? " compact" : "")}>{ALL.map((t) => (
      <button type="button" key={t.id} className={"s-tool" + (t.kidsOnly ? " kids" : "") + (t.id === "ask" ? " ask" : "")} style={{ "--c": t.c, "--cs": t.soft }} onClick={() => go("tool/" + t.id)}>
        <div className="hd"><window.KitToolIc tool={t}/><span className="n">{t.step ? String(t.step).padStart(2, "0") : <Ic.Spark s={12}/>}<i>{t.stepT}</i></span></div>
        <h3 className="serif">{t.id === "ask" ? "Ask, any time" : t.t}</h3>
        <p>{t.d}</p>
        <div className="ft"><Tag t={t}/>{t.kidsOnly && <span className="s-tag soft">If you have children</span>}<Ic.Arrow s={14}/></div>
      </button>))}</div>;
  }

  const Steps = () => (
    <ol className="s-steps">
      {[["01", "Your free guide", "Five minutes, no account. A plain-English guide to where you are, and it tells the toolkit where to start.", "Required", "Map"],
        ["02", "Use the tools", "In the order things happen. Free, as often as you like. Nothing is kept until you save.", "Free", "List"],
        ["03", "Save your toolkit", "A free account, when you want to come back, invite your partner, or get a pack.", "Free", "Lock"],
        ["04", "Pay for the paperwork", `Only if you want it. The finished, formatted documents, from £${K.price("disclosure")}.`, "Optional", "Doc"]].map(([n, t, d, tag, ic]) => { return <li key={n}><span className="n">{n}</span><div><div className="t"><b className="serif">{t}</b><i>{tag}</i></div><p>{d}</p></div></li>; })}
    </ol>
  );

  function Home() {
    const qs = [S.FAQ[0][1][0], S.FAQ[0][1][1], S.FAQ[2][1][0], S.FAQ[3][1][0]];
    return <main>
      <section className="wrap hero s-hero">
        <div>
          <div className="pill-kick"><span className="kick">Free · private · England and Wales</span></div>
          <h1 className="serif h-hero">Your divorce,<br/><span className="em">one step</span> at a time.</h1>
          <p className="serif lede">A free toolkit for doing it yourselves. Start with a five-minute guide, use the tools as you need them, and pay only if you want the finished paperwork.</p>
          <div className="hero-cta"><Start/><button type="button" className="link" onClick={() => go("how")} style={{ marginBottom: 22 }}>How it works <Ic.Down s={13}/></button></div>
          <div className="trust"><span className="yes"><Ic.Check s={14} c="#047857"/> Free to use</span><span><Ic.Lock s={13}/> No account to start</span><span><Ic.X s={12} c="#B91C1C"/> Quick exit on every page</span></div>
        </div>
        <div className="s-kit" aria-label="What’s in the toolkit">
          <div className="hd"><span className="kit-loz">Your divorce toolkit</span><i>In the order things happen</i></div>
          {ALL.map((t) => <button type="button" key={t.id} className={"r" + (t.id === "ask" ? " ask" : "")} onClick={() => go("tool/" + t.id)}><b className="n">{t.step || <Ic.Spark s={11}/>}</b><window.KitToolIc tool={t} s={16}/><div><b>{t.short}</b><small>{t.stepT}</small></div><span className="pr">{t.pack ? priceOf(t) + " pack" : "Free"}</span></button>)}
          <div className="s-float"><Ic.Lock s={13}/> Nothing is kept until you save</div>
        </div>
      </section>
      <section className="wrap s-sec"><Head kick="How it works" t="Free to use." em="Save when you want. Pay for the paperwork." /><Steps/></section>
      <section className="wrap s-sec"><Head kick="The tools" t="In the order" em="things happen." p="Use them in order, or start with the one you need. The guide tells you which to start with."/><ToolCards/></section>
      <section className="wrap"><div className="s-dark"><div><div className="kick">Honest from the start</div><h2 className="serif">It isn’t right for everyone. We’ll tell you if it isn’t right for you.</h2><p>If there’s fear or control in your relationship, or things are complicated, doing it yourselves may not be safe or wise. Our five-minute check says so plainly, and shows you who can help.</p></div><button type="button" className="btn lg white" onClick={() => go("fit")}>Take the 5-minute check <Ic.Arrow s={15}/></button></div></section>
      <section className="wrap s-sec"><Head kick="Prices" t="Everything is free." em="Except the finished documents."/><Packs/><div className="s-more"><button type="button" className="link" onClick={() => go("prices")}>See what’s in each pack <Ic.Arrow s={13}/></button></div></section>
      <section className="wrap s-sec"><Head kick="Safety & privacy" t="Built for a time" em="when you need to be careful."/><Safety n={4}/><div className="s-more"><button type="button" className="link" onClick={() => go("safety")}>Safety & privacy <Ic.Arrow s={13}/></button></div></section>
      <section className="wrap s-sec"><Head kick="Questions" t="What people" em="ask first."/><Qs list={qs}/><div className="s-more"><button type="button" className="link" onClick={() => go("faq")}>All questions <Ic.Arrow s={13}/></button></div></section>
      <section className="wrap"><div className="s-end"><h2 className="serif">Start with five minutes.</h2><p>Your free guide, then your toolkit. No account, no card.</p><Start/></div></section>
    </main>;
  }

  function Packs({ full }) {
    return <div className={"s-packs" + (full ? " full" : "")}>{Object.entries(K.PACKS).map(([k, p]) => { const t = toolBy(p.from); return (
      <div key={k} className="s-pack" style={{ "--c": t.c, "--cs": t.soft }}>
        <div className="hd"><window.KitToolIc tool={t} s={16}/><span>From your {t.short.toLowerCase()}</span></div>
        <b className="serif nm">{p.t}</b>
        <div className="pr"><b className="serif">{"£" + K.price(k)}</b><span>one payment, for both of you</span></div>
        <p>{p.d}</p>
        {full && <ul>{p.items.map(([a, b]) => <li key={a}><Ic.Check s={13} c="#047857"/><div><b>{a}</b><small>{b}</small></div></li>)}</ul>}
      </div>); })}
    </div>;
  }

  function Safety({ n }) {
    return <div className="s-safe">{S.SAFETY.slice(0, n || 99).map(([ic, t, d]) => { const C = Ic[ic] || Ic.Check; return <div key={t}><span className="ic"><C s={16}/></span><b>{t}</b><p>{d}</p></div>; })}</div>;
  }

  function Qs({ list }) {
    const [o, setO] = useState(null);
    return <div className="s-qs">{list.map(([q, a], i) => <div key={q} className={"s-q" + (o === i ? " open" : "")}><button type="button" aria-expanded={o === i} onClick={() => setO(o === i ? null : i)}><span className="serif">{q}</span><Ic.Plus s={18}/></button>{o === i && <p>{typeof a === "function" ? a() : a}</p>}</div>)}</div>;
  }

  function How() {
    return <main className="wrap page-pad">
      <Head kick="How it works" t="Free to use." em="Save when you want. Pay for the paperwork." p="You can do almost everything without paying, and without an account. Here’s how it fits together."/>
      <Steps/>
      <div className="s-two">
        <div><span className="lbl">Always free</span><ul>{["Your guide", "Every tool, as much as you like", "Your to-do list and journal", "Your parenting plan, as a PDF", "Your statement and agreement, on screen", "Ask, any time", "Saving your toolkit"].map((x) => <li key={x}><Ic.Check s={14} c="#047857"/>{x}</li>)}</ul></div>
        <div className="paid"><span className="lbl">Costs money, only if you want it</span><ul>{Object.entries(K.PACKS).map(([k, p]) => <li key={k}><Ic.Doc s={14}/>{p.t}<b>{"£" + K.price(k)}</b></li>)}<li className="soon"><Ic.Users s={14}/>A solicitor check, for a fixed fee<b>Soon</b></li></ul></div>
      </div>
      <div className="s-why"><b className="serif">Why don’t you ask me to sign up?</b><p>Because you should be able to see if it helps before you give us anything. When you’ve made some progress, we’ll ask once if you want to keep it. You need an account to come back later, to invite your partner, or to get a pack.</p></div>
      <div className="s-end"><h2 className="serif">Start with your free guide.</h2><Start/></div>
    </main>;
  }

  function Tools() {
    return <main className="wrap page-pad"><Head kick="The tools" t="Everything you need," em="in the order it happens." p="Free to use, without an account. The guide comes first, so the toolkit knows where to start."/><ToolCards/><div className="s-end"><h2 className="serif">Start with your free guide.</h2><Start/></div></main>;
  }

  function Tool({ id }) {
    const t = toolBy(id) || K.TOOLS[0], c = S.TOOL[t.id], i = ALL.indexOf(t), nx = ALL[i + 1];
    return <main className="wrap page-pad s-tp" style={{ "--c": t.c, "--cs": t.soft }}>
      <button type="button" className="s-back" onClick={() => go("tools")}><Ic.Back s={13}/> All tools</button>
      <div className="s-tp-h">
        <div><div className="s-tp-k"><window.KitToolIc tool={t}/><span>{t.step ? "Step " + t.step + " · " : ""}{t.stepT}{t.kidsOnly ? " · if you have children" : ""}</span></div><h1 className="serif h2">{t.id === "ask" ? "Ask, any time" : t.t}</h1><p className="p-lede">{c.lede}</p><Start want={t.id} label={"Start with the guide, then " + (t.id === "ask" ? "Ask" : "the " + t.short.toLowerCase())}/></div>
        <aside className="s-tp-get"><span className="lbl">What you get</span>{c.get.map(([g, p]) => <div key={g} className={p === "free" ? "" : "paid"}><span>{p === "free" ? <Ic.Check s={14} w={2.2}/> : <Ic.Doc s={14}/>}</span><b>{g}</b><i>{p === "free" ? "Free" : "£" + K.price(p)}</i></div>)}<p><Ic.Lock s={12}/> {c.good}</p></aside>
      </div>
      <section className="s-tp-do"><span className="lbl">What you’ll do</span><ol>{c.do.map((x, j) => <li key={x}><b>{j + 1}</b><p>{x}</p></li>)}</ol></section>
      {nx && <button type="button" className="s-next" onClick={() => go("tool/" + nx.id)}><span>Next in the toolkit</span><window.KitToolIc tool={nx} s={15}/><b className="serif">{nx.id === "ask" ? "Ask, any time" : nx.t}</b><Ic.Arrow s={15}/></button>}
    </main>;
  }

  function Prices() {
    return <main className="wrap page-pad">
      <Head kick="Prices" t="Everything is free." em="Except the finished documents." p="Use every tool, as often as you like, for nothing. If you want the finished, formatted paperwork, it’s one payment for both of you."/>
      <Packs full/>
      <div className="s-two"><div><span className="lbl">Free, always</span><ul>{["Your guide and every tool", "Your parenting plan, as a PDF", "Your statement and agreement, on screen", "Saving your toolkit"].map((x) => <li key={x}><Ic.Check s={14} c="#047857"/>{x}</li>)}</ul></div><div className="paid"><span className="lbl">Coming soon</span><ul><li className="soon"><Ic.Users s={14}/>A solicitor check, for a fixed fee<b>Waitlist</b></li><li className="soon"><Ic.Shield s={14}/>We file it with the court for you<b>Soon</b></li></ul></div></div>
      <div className="s-cmp"><b className="serif">For comparison</b><p>Sorting out the finances through solicitors often costs thousands of pounds each. Court fees are separate, whichever way you do it: about £600 to apply for the divorce, and about £60 for a consent order.</p></div>
      <Qs list={S.FAQ[1][1]}/>
      <div className="s-end"><h2 className="serif">See what it does for you, free.</h2><Start/></div>
    </main>;
  }

  function Fit() {
    const [pos, setPos] = useState(-2), [a, setA] = useState({}), G = window.FIT.GROUPS;
    useEffect(() => { if (pos >= -1) window.scrollTo(0, 0); }, [pos]);
    if (pos === -2) return <main className="wrap page-pad">
      <Head kick="Is it right for us?" t="Doing it yourselves" em="isn’t right for everyone." p="It works when you can both speak freely, and when things aren’t too complicated. If there’s fear or control, or a business, overseas money or a large pension, you may need a professional for some or all of it."/>
      <div className="s-fit3">{[["#065F46", "#D1FAE5", "It could work, with care", "What to watch as you go."], ["#075985", "#E0F2FE", "Get help with some parts", "Where people usually need a professional, and who."], ["#92400E", "#FEF3C7", "Get advice first", "If anything suggests fear or control, with who to call, in confidence."]].map(([c, bg, t, d]) => <div key={t}><span style={{ color: c, background: bg }}>{t}</span><p>{d}</p></div>)}</div>
      <div className="s-start"><button type="button" className="btn lg" onClick={() => setPos(-1)}>Take the 5-minute check <Ic.Arrow s={16}/></button><span>No account · your answers are never kept</span></div>
      <window.KitSafety/>
    </main>;
    return <div className="s-fitwrap">
      {pos === -1 && <window.FitIntro onStart={() => setPos(0)}/>}
      {pos >= 0 && pos < G.length && <window.FitGroup key={pos} g={G[pos]} i={pos} a={a} set={(id, v) => setA((o) => ({ ...o, [id]: v }))} onBack={() => setPos(pos - 1)} onNext={() => { if (pos < G.length - 1) return setPos(pos + 1); K.log("fit-band", "Right for us? result (public)", "band", window.FIT.band(a).k, { step: "Right for us" }); setPos(G.length); }}/>}
      {pos === G.length && <window.FitResult a={a} pub={() => start("fit")} onRedo={() => { setA({}); setPos(0); }}/>}
    </div>;
  }

  function SafetyPage() {
    return <main className="wrap page-pad">
      <Head kick="Safety & privacy" t="Built for a time" em="when you need to be careful." p="Separating can be risky, especially if someone is checking your phone or your email. Here’s what we do about it, and where to get help."/>
      <section className="s-help"><window.KitSafety/></section>
      <Safety/>
      <div className="s-two">
        <div><span className="lbl">What we keep</span><ul><li><Ic.Check s={14} c="#047857"/>Nothing, until you save your toolkit</li><li><Ic.Check s={14} c="#047857"/>Then only what you put in, encrypted, and private to you</li><li><Ic.Check s={14} c="#047857"/>Your “Right for us?” answers: never, even after you save</li></ul></div>
        <div><span className="lbl">What we never do</span><ul><li><Ic.X s={13} c="#B91C1C"/>Share anything with your partner unless you choose</li><li><Ic.X s={13} c="#B91C1C"/>Sell or share your data</li><li><Ic.X s={13} c="#B91C1C"/>Put anything revealing in an email subject line</li></ul></div>
      </div>
      <div className="s-why"><b className="serif">Leaving quickly</b><p>Quick exit takes you straight to the BBC weather page. It can’t clear your history: use a private or incognito window, or clear your history afterwards. If you think someone may be monitoring your device, use a device they can’t get to.</p></div>
      <div className="s-why"><b className="serif">We’re not a law firm</b><p>Nothing here is legal advice. The tools are built on official guidance, and they say plainly when you should talk to a solicitor or mediator. <a href="privacy.html" target="_blank" rel="noopener">Read the privacy notice</a>.</p></div>
    </main>;
  }

  function Faq() {
    const [cat, setCat] = useState(0);
    return <main className="wrap page-pad">
      <Head kick="Questions" t="Everything" em="people ask us."/>
      <div className="s-faq"><nav>{S.FAQ.map(([c], i) => <button type="button" key={c} className={cat === i ? "on" : ""} onClick={() => setCat(i)}>{c}<span>{S.FAQ[i][1].length}</span></button>)}</nav><Qs key={cat} list={S.FAQ[cat][1]}/></div>
      <div className="s-end"><h2 className="serif">Still deciding? Five minutes will tell you more.</h2><Start/></div>
    </main>;
  }

  function Site() {
    const [route, setRoute] = useState((location.hash || "#home").slice(1));
    useEffect(() => { const f = () => { setRoute((location.hash || "#home").slice(1)); K.log("site-page", "Viewed a page", "page", (location.hash || "#home").slice(1), { step: "Page" }); }; addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
    const label = route.startsWith("tool/") ? "Tool · " + route.slice(5) : (PAGES.find((p) => p[0] === route) || ["home", "Home"])[1];
    const P = route.startsWith("tool/") ? <Tool id={route.slice(5)}/> : { how: <How/>, tools: <Tools/>, prices: <Prices/>, fit: <Fit/>, safety: <SafetyPage/>, faq: <Faq/> }[route] || <Home/>;
    return <div className="site bg-wash s-site" data-screen-label={"MVP 00 · " + label}><Nav route={route}/>{P}<Foot/></div>;
  }

  Object.assign(window, { SiteApp: Site });
})();
