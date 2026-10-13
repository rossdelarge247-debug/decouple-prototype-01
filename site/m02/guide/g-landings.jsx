/* M02 v2 · alternative landing screens. A is the original (GLanding in g-intake.jsx). Registry: window.GLANDS */
(function () {
  const Ic = window.DIc, IV = window.IV, G = window.G;
  const Trust = () => (
    <div className="trust">
      <span><Ic.Lock s={13} c="#78716C"/> Private. Your guide stays on this device</span>
      <span><Ic.X s={13} c="#78716C"/> Quick exit at any time</span>
      <span className="yes"><Ic.Check s={13} w={2.1} c="#166534"/> Free, and yours to keep</span>
    </div>
  );
  const CTA = ({ onStart, resume, label }) => (
    <div className="hero-cta"><div><button className="btn lg" onClick={() => onStart()}>{resume ? "Carry on with my guide" : label || "Get my free guide"} <Ic.Arrow s={16}/></button><span className="note tab">~6 minutes · no account, no name needed</span></div></div>
  );
  const SAMPLE = { stage: "decided", status: "married", kids: "with" };
  const Road = ({ n }) => (
    <ol className="road">{G.road(SAMPLE).slice(0, n).map((s, i) => (
      <li key={s.id} className={s.st}><span className="n">{s.st === "past" ? <Ic.Check s={11} w={2.6} c="#047857"/> : i + 1}</span><div><h4>{s.t}{s.st === "here" && <span className="yah">You are here</span>}</h4><div className="w">{s.w}</div><p>{s.d}</p></div></li>
    ))}</ol>
  );

  /* B · the first question is the landing */
  function Ask({ onStart, resume }) {
    const st = IV.Q.find((q) => q.id === "stage");
    return (
      <main className="g-land gl-ask">
        <div className="wrap">
          <div className="pill-kick"><span className="kick">A free, private guide for anyone separating</span></div>
          <h1 className="serif h-hero">Trying to work out what to do <span className="em">next?</span></h1>
          <p className="serif lede">Start here. Tell us where you are, answer a few gentle questions, and get a guide made for your situation: what to do, in what order, and what to expect.</p>
          {resume ? <CTA onStart={onStart} resume/> : (
            <div className="gl-q">
              <div className="gl-ql"><span>Question 1</span>Where are you right now?</div>
              <div className="gl-opts">{st.opts.map(([k, l, s], i) => (
                <button key={k} className="gl-opt" onClick={() => onStart({ stage: k })}><span className="n tab">{i + 1}</span><span className="tx"><b>{l}</b>{s && <small>{s}</small>}</span><Ic.Arrow s={15}/></button>
              ))}</div>
              <div className="gl-qn">About 6 minutes from here · no account, no name needed</div>
            </div>
          )}
          <Trust/>
        </div>
      </main>
    );
  }

  /* C · a calm letter, with a real page from the guide */
  function Letter({ onStart, resume }) {
    const S = G.STAGE.decided;
    return (
      <main className="g-land gl-letter">
        <div className="gl-col">
          <div className="kick">A note before you start</div>
          <h1 className="serif">You don’t have to have it all <span className="em">worked out.</span></h1>
          <div className="gl-body serif">
            <p>Most people come to this not knowing where to begin. There are forms you’ve never heard of, words that sound frightening, and advice that contradicts itself.</p>
            <p>There is an order to it, though, and it’s calmer than it looks from here. Answer a few gentle questions and we’ll write you a short guide: where you are, what comes next, and what to expect along the way.</p>
            <p>It’s free, private, and yours to keep.</p>
          </div>
          <CTA onStart={onStart} resume={resume} label="Write my guide"/>
          <Trust/>
        </div>
        <div className="gl-col gl-sheetw">
          <div className="gl-cap">A page from a guide, for someone who’s just decided</div>
          <div className="gl-sheet">
            <div className="gl-sh-h"><span className="kick">Chapter 1 · Where you are</span><span className="g-chn">1 of 8</span></div>
            <h3 className="serif">{S.t}</h3>
            <p className="gl-sh-d">{S.d}</p>
            <Road n={4}/>
          </div>
        </div>
      </main>
    );
  }

  /* D · the questions people search for, each mapped to a chapter */
  const ASKS = [
    ["How long will this take?", 1, "Where you are"], ["What happens to our pensions?", 2, "The financial picture"],
    ["What about the children?", 3, "Children"], ["Who keeps the house?", 4, "The home"],
    ["What’s a fair split?", 5, "What’s fair"], ["Do I need a solicitor?", 6, "Reaching agreement"],
    ["Is the divorce the same as the money?", 7, "Making it legal"], ["How do I look after myself?", 8, "Looking after yourself"],
  ];
  function Questions({ onStart, resume }) {
    return (
      <main className="g-land gl-qs">
        <div className="wrap">
          <div className="gl-qs-h">
            <div className="kick">The questions everyone asks</div>
            <h1 className="serif">Every question has an answer. <span className="em">And an order.</span></h1>
            <p className="serif">Your free guide answers these for your situation, in the order you’ll need them.</p>
          </div>
          <div className="gl-grid">{ASKS.map(([q, n, ch]) => (
            <button key={q} className="gl-card" onClick={() => onStart()}><span className="q serif">{q}</span><span className="c"><span className="tab">Chapter {n}</span>{ch}</span></button>
          ))}</div>
          <div className="gl-qs-f">
            <button className="btn lg white" onClick={() => onStart()}>{resume ? "Carry on with my guide" : "Get answers for my situation"} <Ic.Arrow s={16}/></button>
            <span>~6 minutes · private · no account, no name needed</span>
          </div>
        </div>
      </main>
    );
  }

  /* E · show the product: the guide itself */
  const CHS = ["Where you are", "The financial picture", "Children", "The home", "What’s fair", "Reaching agreement", "Making it legal", "Looking after yourself"];
  function See({ onStart, resume }) {
    return (
      <main className="g-land gl-see">
        <div className="wrap gl-see-g">
          <div>
            <div className="pill-kick"><span className="kick">Free · private · made for you</span></div>
            <h1 className="serif h-hero">Your separation, in the right <span className="em">order.</span></h1>
            <p className="serif lede">A short, personalised guide to what happens next: the steps, the paperwork, the children, the home, and what’s likely to be fair.</p>
            <ol className="gl-steps">
              <li><span className="tab">1</span><div><b>Answer a few gentle questions</b><small>About 6 minutes. Rough answers are fine.</small></div></li>
              <li><span className="tab">2</span><div><b>Get your guide</b><small>Eight short chapters, written around your answers.</small></div></li>
              <li><span className="tab">3</span><div><b>Keep it</b><small>Print it, email it to yourself, or come back to it.</small></div></li>
            </ol>
            <CTA onStart={onStart} resume={resume}/>
          </div>
          <div className="gl-mock" aria-hidden="true">
            <div className="gl-mock-bar"><i></i><i></i><i></i><span>Your guide · private to you</span></div>
            <div className="gl-mock-in">
              <div className="gl-toc">{CHS.map((t, i) => <div key={t} className={i === 0 ? "cur" : ""}><span className="d tab">{i + 1}</span>{t}</div>)}</div>
              <div className="gl-pg">
                <div className="kick">Chapter 1 · Where you are</div>
                <h3 className="serif">{G.STAGE.decided.t}</h3>
                <Road n={3}/>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  window.GLANDS = {
    a: { name: "A · Chapters (original)", bg: "bg-wash", C: window.GLanding },
    b: { name: "B · First question", bg: "bg-wash", C: Ask },
    c: { name: "C · A letter", bg: "bg-paper", C: Letter },
    d: { name: "D · Questions people ask", bg: "bg-dark", C: Questions },
    e: { name: "E · See your guide", bg: "bg-wash", C: See },
  };
})();
