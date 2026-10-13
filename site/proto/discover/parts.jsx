/* Discover — shared parts: icons, nav + mobile sheet, footer, sticky mobile CTA, stage router. */
(function () {
  const { useState, useEffect } = React;
  const J = window.Journey;

  const I = (ch, p = {}) => (
    <svg width={p.s || 14} height={p.s || 14} viewBox="0 0 24 24" fill="none" stroke={p.c || "currentColor"} strokeWidth={p.w || 1.75} strokeLinecap="round" strokeLinejoin="round" style={p.style}>{ch}</svg>
  );
  const Ic = {
    Arrow: (p) => I(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></>, p),
    Down: (p) => I(<><line x1="12" y1="5" x2="12" y2="19"/><polyline points="6 13 12 19 18 13"/></>, p),
    Check: (p) => I(<polyline points="5 12 10 17 19 7"/>, p),
    Plus: (p) => I(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, p),
    X: (p) => I(<><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></>, p),
    Menu: (p) => I(<><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/></>, p),
    Lock: (p) => I(<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>, p),
    Shield: (p) => I(<path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6z"/>, p),
    Spark: (p) => I(<path d="M12 2l1.6 5.4 5.4 1.6-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z"/>, p),
    Bank: (p) => I(<><path d="M3 10l9-6 9 6"/><line x1="5" y1="10" x2="5" y2="18"/><line x1="10" y1="10" x2="10" y2="18"/><line x1="14" y1="10" x2="14" y2="18"/><line x1="19" y1="10" x2="19" y2="18"/><line x1="3" y1="21" x2="21" y2="21"/></>, p),
    Kid: (p) => I(<><circle cx="12" cy="6" r="3"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></>, p),
    Home: (p) => I(<><path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></>, p),
    Help: (p) => I(<><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7V14"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></>, p),
    Star: (p) => I(<polygon points="12 3 14.6 9 21 9.6 16 13.8 17.6 20 12 16.6 6.4 20 8 13.8 3 9.6 9.4 9" fill="currentColor"/>, p),
    Dash: (p) => I(<line x1="7" y1="12" x2="17" y2="12"/>, p),
  };

  const PAGES = [["picture", "The picture"], ["how", "How it works"], ["why", "Why Decouple"], ["pricing", "Pricing"], ["faq", "FAQ"]];
  const go = (p) => { location.hash = "#/" + p; };

  function useRoute() {
    const read = () => (location.hash.replace(/^#\/?/, "") || "landing").split("?")[0];
    const [r, setR] = useState(read());
    useEffect(() => {
      const f = () => { setR(read()); window.scrollTo(0, 0); };
      addEventListener("hashchange", f); return () => removeEventListener("hashchange", f);
    }, []);
    return r;
  }
  function useJourney() {
    const [s, setS] = useState(J.get());
    useEffect(() => J.subscribe((x) => setS({ ...x })), []);
    return s;
  }

  function Wordmark() { return <button className="wm" onClick={() => go("landing")} aria-label="Decouple home">Decouple<i>.</i></button>; }

  function Nav({ route, onStart }) {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => { const f = () => setScrolled(scrollY > 8); f(); addEventListener("scroll", f); return () => removeEventListener("scroll", f); }, []);
    useEffect(() => setOpen(false), [route]);
    const signIn = () => J.goStage("signup", "#signin");
    return (
      <>
        <header className={"nav" + (scrolled ? " scrolled" : "")}>
          <Wordmark/>
          <nav className="nav-links">
            {PAGES.slice(0, 4).map(([k, l]) => <button key={k} className={route === k ? "on" : ""} onClick={() => go(k)}>{l}</button>)}
          </nav>
          <div className="nav-right">
            <button className="signin" onClick={signIn}>Sign in</button>
            <button className="btn" onClick={onStart}>Start free interview <Ic.Arrow s={14}/></button>
          </div>
          <button className="burger" aria-label="Menu" onClick={() => setOpen(true)}><Ic.Menu s={20}/></button>
        </header>
        <div className={"sheet-scrim" + (open ? " open" : "")} onClick={() => setOpen(false)}></div>
        <div className={"msheet" + (open ? " open" : "")} aria-hidden={!open}>
          <div className="msheet-top"><Wordmark/><button className="burger" style={{ display: "flex", background: "#FFF", color: "#1A1A1A", borderColor: "#E5E3DC" }} aria-label="Close menu" onClick={() => setOpen(false)}><Ic.X s={18}/></button></div>
          <nav>
            {PAGES.map(([k, l]) => <button key={k} className={route === k ? "on" : ""} onClick={() => go(k)}>{l}<Ic.Arrow s={16}/></button>)}
          </nav>
          <div className="sub-actions">
            <button className="btn lg full" onClick={() => { setOpen(false); onStart(); }}>Start your free interview <Ic.Arrow s={16}/></button>
            <button className="btn lg ghost full" onClick={signIn}>Sign in</button>
          </div>
        </div>
      </>
    );
  }

  function Footer() {
    return (
      <footer className="foot"><div className="wrap">
        <Wordmark/>
        <nav>{PAGES.map(([k, l]) => <button key={k} onClick={() => go(k)}>{l}</button>)}</nav>
        <small>Decouple is a guided settlement workspace, not a law firm. Available in England & Wales.</small>
      </div></footer>
    );
  }

  function MobileCTA({ onStart }) {
    return <div className="mcta"><button className="btn lg full" onClick={onStart}>Start your free interview <Ic.Arrow s={16}/></button></div>;
  }

  /* ── "Where are you now?" stage router — pre-fills the interview ── */
  const STAGE_OPTS = [
    ["considering", "Thinking about separating", "Nothing's decided yet"],
    ["decided", "We've decided to separate", "Still living under one roof"],
    ["apart", "We're living apart", "Separated, nothing formal yet"],
    ["filed", "Divorce or dissolution has started", "Application made, or about to be"],
    ["agreed", "We've mostly agreed", "It needs writing up and making legal"],
  ];
  const STATUS_OPTS = [
    ["married", "Married", "Including separated, not yet divorced"],
    ["civil", "In a civil partnership", "Registered partnership"],
    ["cohab", "Living together, not married", "Cohabiting partners"],
  ];

  function Router({ onClose }) {
    const saved = J.get().router || {};
    const [step, setStep] = useState(0);
    const [stage, setStage] = useState(saved.stage || null);
    const [status, setStatus] = useState(saved.status || null);
    useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);
    const lbl = (opts, v) => (opts.find((o) => o[0] === v) || [])[1];
    const finish = (skip) => {
      if (skip) { J.set("router", { stage: null, status: null, stageLabel: null, statusLabel: null, skipped: true }); }
      else {
        J.set("router", { stage, status, stageLabel: lbl(STAGE_OPTS, stage), statusLabel: lbl(STATUS_OPTS, status), skipped: false });
        J.set("interview", { status });
      }
      onClose(); J.goStage("interview");
    };
    const q = step === 0
      ? { t: "Where are you right now?", h: "So your interview starts in the right place. You can change this later.", opts: STAGE_OPTS, v: stage, set: setStage }
      : { t: "And the two of you are…", h: "This decides which rights and routes apply. There are no wrong answers.", opts: STATUS_OPTS, v: status, set: setStatus };
    const can = !!q.v;
    return (
      <div className="rt-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="rt" role="dialog" aria-modal="true" aria-label="Before your interview">
          <div className="rt-head">
            <div className="rt-dots"><i className="on"></i><i className={step ? "on" : ""}></i><span style={{ marginLeft: 6 }}>{step + 1} of 2 · before the interview</span></div>
            <button className="rt-x" aria-label="Close" onClick={onClose}><Ic.X s={16}/></button>
          </div>
          <div className="rt-body">
            <h2>{q.t}</h2>
            <p className="hp">{q.h}</p>
            <div className="opts">
              {q.opts.map(([v, l, s]) => (
                <button key={v} className={"opt" + (q.v === v ? " on" : "")} onClick={() => { q.set(v); if (step === 0) setTimeout(() => setStep(1), 220); }}>
                  <div><div className="l">{l}</div><div className="s">{s}</div></div>
                  <span className="r">{q.v === v && <Ic.Check s={11} w={3} c="#FFF"/>}</span>
                </button>
              ))}
            </div>
            {step === 1 && stage && (
              <div className="rt-carry"><span><Ic.Check s={11} w={2.4} c="#166534"/>{lbl(STAGE_OPTS, stage)}</span>{status && <span><Ic.Check s={11} w={2.4} c="#166534"/>{lbl(STATUS_OPTS, status)}</span>}</div>
            )}
            <div className="rt-foot">
              {step === 0
                ? <button className="skip" onClick={() => finish(true)}>Skip — start from scratch</button>
                : <button className="skip" onClick={() => setStep(0)}>← Back</button>}
              {step === 0
                ? <button className="btn" disabled={!can} onClick={() => setStep(1)}>Next <Ic.Arrow s={14}/></button>
                : <button className="btn" disabled={!can} onClick={() => finish(false)}>Start interview · 2 answers filled in <Ic.Arrow s={14}/></button>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  Object.assign(window, { DIc: Ic, DPAGES: PAGES, dGo: go, useDRoute: useRoute, useDJourney: useJourney, DNav: Nav, DFooter: Footer, DMobileCTA: MobileCTA, DRouter: Router });
})();
