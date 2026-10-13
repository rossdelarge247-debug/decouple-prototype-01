/* Discover — How it works. Graphics adapted from the welcome tour (folder-tab paper cards, progress rail). */
(function () {
  const { useState, useEffect, useRef } = React;
  const Ic = window.DIc;

  const PH = [
    { k: "interview", n: "00", rail: "Interview", kick: "Start · The free interview", when: "Today · 5 min", c: "#5B21B6", soft: "#F3EEFE",
      t: "Tell us what's happening.", sub: "Five minutes, no account, no exact figures.",
      body: "A short, calm interview about your situation: the two of you, children, the home and a ballpark of the finances. A quiet check-in makes sure this route is safe for you.",
      gets: "An honest first read — your likely range and a path" },
    { k: "prepare", n: "01", rail: "Prepare", kick: "Phase 1 · Prepare", when: "Weeks 1–3", c: "#5B21B6", soft: "#F3EEFE",
      t: "Prepare your picture.", sub: "Ditch the bank statements, spreadsheets and Word docs.",
      body: "Connect your accounts once. Decouple reads twelve months of history, sorts every transaction and builds your private financial picture in the background. Read-only — nothing is shared until you choose.",
      gets: "Your private financial picture" },
    { k: "reconcile", n: "02", rail: "Reconcile", kick: "Phase 2 · Reconcile", when: "Weeks 3–6", c: "#9D174D", soft: "#FCE7F3",
      t: "Share your position.", sub: "Reconcile your shared household quickly — with minimal conflict.",
      body: "Sharing your picture is what invites your ex-partner in. They build theirs alongside, Decouple lines the two up, and you only talk about what differs — one item at a time, with the evidence attached.",
      gets: "One household picture you both agree is true" },
    { k: "settle", n: "03", rail: "Settle", kick: "Phase 3 · Settle", when: "Weeks 6–10", c: "#0369A1", soft: "#E0F2FE",
      t: "Build your proposal.", sub: "Negotiate with legal checks and reasonableness flags.",
      body: "Model a split in real time and see how a court would likely view it. Swap proposals and counter-proposals until the gap closes. Mediators are on hand if you get stuck.",
      gets: "An agreed proposal" },
    { k: "finalise", n: "04", rail: "Finalise", kick: "Phase 4 · Finalise", when: "Weeks 10–12", c: "#15803D", soft: "#DCFCE7",
      t: "Finalise your agreement.", sub: "Court-ready documents in minutes, not months.",
      body: "Once you're both aligned, Decouple drafts your Consent Order, Form D81 and supporting bundle. With Complete & filed we submit it digitally to HMCTS; or hand it to a solicitor for a final look.",
      gets: "A court-approved financial order" },
  ];
  const vars = (p) => ({ "--c": p.c, "--soft2": p.soft });
  const jump = (k) => { const el = document.getElementById("hw-" + k); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 136, behavior: "smooth" }); };

  function Paper({ p, children }) {
    return <div className="pc" style={vars(p)}><span className="pc-tab">{p.n === "00" ? "START" : p.n}</span><div className="pc-k">{p.rail}</div>{children}</div>;
  }

  function CardInterview({ p }) {
    const [v, setV] = useState("together");
    const opts = [["together", "We own our home together"], ["rent", "We rent together"], ["one", "One of us owns it"], ["apart", "We already live apart"]];
    return (
      <Paper p={p}>
        <div className="pc-q">Where do you both live right now?</div>
        {opts.map(([k, l]) => <button key={k} className={"pc-opt" + (v === k ? " on" : "")} onClick={() => setV(k)}>{l}<span className="r">{v === k && <Ic.Check s={10} w={3} c="#FFF"/>}</span></button>)}
        <div className="pc-foot"><span className="tab">Step 3 of 6</span><span className="a"><Ic.Lock s={11}/> No account needed</span></div>
      </Paper>
    );
  }
  function CardPrepare({ p }) {
    const rows = [["Tesco Metro", "Groceries", "−£48.32"], ["NHS Pensions", "Salary", "+£2,847"], ["Halifax Mortgage", "Housing", "−£1,842", true], ["BG Energy", "Utilities", "−£184.50"], ["Vanguard ISA", "Savings", "−£400"]];
    return (
      <Paper p={p}>
        <div style={{ marginTop: 8 }}>
          {rows.map(([n, c, a, hi]) => <div key={n} className={"tx" + (hi ? " hi" : "")}><span className="dt"></span><span className="nm">{n}</span><span className="cat">{c}</span><span className="am" style={{ color: a[0] === "+" ? "#047857" : "#1A1A1A" }}>{a}</span></div>)}
        </div>
        <div className="pc-foot"><span className="tab">1,284 transactions sorted</span><span className="a"><Ic.Spark s={11}/> Auto-categorised</span></div>
      </Paper>
    );
  }
  function CardReconcile({ p }) {
    const [open, setOpen] = useState(false);
    const ppl = [["S", "Sarah", "#5B21B6", 1, "100%"], ["M", "Mark", "#0369A1", .7, "72%"]];
    const diffs = [["Family car", "£12,000", "£8,500"], ["Mark's pension", "£148,200", "£131,000"], ["Joint savings", "£9,400", "—"]];
    return (
      <Paper p={p}>
        <div className="two">
          {ppl.map(([i, n, c, f, pct]) => (
            <div key={n} className="who">
              <div className="h"><span className="av" style={{ background: c }}>{i}</span>{n}</div>
              <div className="bars">{[1, .8, .5, .3].map((w, k) => <span key={k}><i style={{ width: w * f * 100 + "%", background: c }}></i></span>)}</div>
              <div className="ft"><span>Disclosure</span><b className="tab" style={{ color: c }}>{pct}</b></div>
            </div>
          ))}
        </div>
        <div className={"diffs" + (open ? " open" : "")}>
          <button aria-expanded={open} onClick={() => setOpen(!open)}>3 differences found<Ic.Down s={13} style={{ transform: "rotate(0)" }}/></button>
          <div className="list"><div>
            <div className="diff" style={{ color: "#78716C", fontSize: 10.5, fontWeight: 600, letterSpacing: ".06em" }}><span>ITEM</span><span>SARAH SAID</span><span>MARK SAID</span></div>
            {diffs.map(([n, a, b]) => <div key={n} className="diff"><span>{n}</span><span className="v" style={{ color: "#5B21B6" }}>{a}</span><span className="v" style={{ color: "#0369A1" }}>{b}</span></div>)}
          </div></div>
        </div>
      </Paper>
    );
  }
  function CardSettle({ p }) {
    const [v, setV] = useState(58);
    const MIN = 40, MAX = 80, LO = 48, HI = 70, pos = (x) => ((x - MIN) / (MAX - MIN)) * 100;
    const ok = v >= LO && v <= HI;
    return (
      <Paper p={p}>
        <div className="split-top"><span>Capital split — Sarah</span><b>{v}%</b></div>
        <div className="track">
          <div className="rband" style={{ left: pos(LO) + "%", width: pos(HI) - pos(LO) + "%" }}></div>
          <div className="fill" style={{ width: pos(v) + "%" }}></div>
          <div className="knob" style={{ left: pos(v) + "%" }}></div>
          <input type="range" min={MIN} max={MAX} value={v} onChange={(e) => setV(+e.target.value)} aria-label="Capital split for Sarah"/>
        </div>
        <div className="ticks"><span>40/60</span><span style={{ color: "#15803D" }}>reasonable band</span><span>80/20</span></div>
        <div className={"check" + (ok ? "" : " warn")}>
          <Ic.Spark s={13} c={ok ? p.c : "#92400E"} style={{ marginTop: 2, flexShrink: 0 }}/>
          <div>
            <div className="t">{ok ? "Legal check · likely reasonable" : v < LO ? "Legal check · below the usual range" : "Legal check · above the usual range"}</div>
            <div className="d">{ok ? `A ${v}/${100 - v} split reflects a 14-year marriage and primary care of the children. A court would likely accept it.` : v < LO ? "Sarah would be giving up more than a court would usually expect, given the children live mainly with her." : "This is more than a court would usually award. Expect Mark to push back — and a judge to ask why."}</div>
          </div>
        </div>
        <div className="pc-foot"><span>Drag to model a split</span><span className="a">v3 · Mark countered</span></div>
      </Paper>
    );
  }
  function CardFinalise({ p }) {
    const docs = [["Consent Order", "12 pages · signed by both"], ["Form D81", "Statement of information"], ["Disclosure bundle", "324 pages · indexed"]];
    return (
      <Paper p={p}>
        {docs.map(([n, m]) => <div key={n} className="doc"><span className="ico"><i></i><i></i><i></i></span><div><div className="n">{n}</div><div className="m">{m}</div></div><span className="ok"><Ic.Check s={9} w={3}/> Ready</span></div>)}
        <div className="filed"><span>Filed to HMCTS</span><span className="bar"><i></i><i></i><i></i><i className="off"></i></span><span className="tab">3 of 4</span></div>
      </Paper>
    );
  }
  const CARDS = { interview: CardInterview, prepare: CardPrepare, reconcile: CardReconcile, settle: CardSettle, finalise: CardFinalise };

  function Fan() {
    const pos = [[0, 70, -8, 1], [110, 30, -3, 2], [220, 20, 3, 3], [300, 80, 8, 4]];
    return (
      <div className="hw-fan">
        {PH.slice(1).map((p, i) => {
          const [x, y, r, z] = pos[i];
          return (
            <button key={p.k} className="fan-card" style={{ ...vars(p), "--x": x + "px", "--y": y + "px", "--r": r + "deg", "--z": z }} onClick={() => jump(p.k)}>
              <span className="tabn">{p.n}</span>
              <div className="fk">{p.rail}</div>
              <div className="ft">{p.t}</div>
              <div className="fl"><i style={{ width: "70%" }}></i><i></i><i style={{ width: "85%" }}></i><i style={{ width: "60%" }}></i></div>
              <div className="fw"><span>{p.when}</span><Ic.Arrow s={12}/></div>
            </button>
          );
        })}
      </div>
    );
  }

  function Rail({ active }) {
    const idx = PH.findIndex((p) => p.k === active);
    return (
      <div className="hw-rail-wrap">
        <nav className="hw-rail" aria-label="Phases">
          {PH.map((p, i) => (
            <React.Fragment key={p.k}>
              {i === 1 && <span className="sep"></span>}
              <button className={i === idx ? "on" : i < idx ? "past" : ""} onClick={() => jump(p.k)}>
                <span className="d">{i < idx ? <Ic.Check s={10} w={3} c="#FFF"/> : i === 0 ? "·" : i}</span>{p.rail}
              </button>
            </React.Fragment>
          ))}
        </nav>
      </div>
    );
  }

  function How({ onStart }) {
    const [active, setActive] = useState("interview");
    const ref = useRef(null);
    useEffect(() => {
      const els = ref.current.querySelectorAll(".hw-ph");
      const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.dataset.k)), { rootMargin: "-40% 0px -55% 0px" });
      els.forEach((el) => io.observe(el)); return () => io.disconnect();
    }, []);
    return (
      <main className="wrap hw" ref={ref}>
        <section className="hw-hero">
          <div>
            <div className="kick">How it works · about 3 months</div>
            <h2 className="serif hw-h1">Four phases to a<br/><span className="em">decoupled</span> life.</h2>
            <p className="p-lede">No paper, no spreadsheets, no back-and-forth over email. One calm workspace that takes you both from the facts to court-ready documents, in the right order.</p>
            <div style={{ marginTop: 28, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              <button className="btn lg" onClick={onStart}>Start your free interview <Ic.Arrow s={16}/></button>
              <button className="link" onClick={() => jump("prepare")}>See the phases <Ic.Down s={13}/></button>
            </div>
          </div>
          <Fan/>
        </section>
        <Rail active={active}/>
        {PH.map((p, i) => {
          const Card = CARDS[p.k];
          return (
            <section key={p.k} id={"hw-" + p.k} data-k={p.k} className={"hw-ph" + (i % 2 ? " flip" : "")} style={vars(p)}>
              <div>
                <div className="hw-kick"><span className="kick">{p.kick}</span><hr/><span className="w">{p.when}</span></div>
                <div className="hw-num">{p.n}</div>
                <h3 className="hw-t">{p.t}</h3>
                <p className="hw-sub">{p.sub}</p>
                <p className="hw-body">{p.body}</p>
                <div className="hw-gets"><span className="g"><Ic.Check s={13} w={2.4} c={p.c}/></span><span>You come away with <b>{p.gets}</b></span></div>
              </div>
              <div className="hw-card-col"><Card p={p}/></div>
            </section>
          );
        })}
        <section className="hw-end">
          <div className="kick">It starts with five minutes</div>
          <h3>Ready when you are.</h3>
          <p>The interview is free and needs no account. You'll see your first read before you decide anything.</p>
          <button className="btn lg" onClick={onStart}>Start your free interview <Ic.Arrow s={16}/></button>
        </section>
      </main>
    );
  }

  Object.assign(window, { DHow: How, HWPhases: PH, HWCards: CARDS });
})();
