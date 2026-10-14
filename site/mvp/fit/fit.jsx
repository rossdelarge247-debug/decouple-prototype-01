/* MVP 02 · Is doing it ourselves right for us? Five short groups, then an asymmetric result: it never clears anyone,
   and any sign of fear or control means "get advice first". Answers are never saved or sent; only the result band, if they agree. */
(function () {
  const { useState } = React;
  const K = window.KIT, Ic = window.KIc;
  const GROUPS = [
    { id: "safe", t: "Feeling safe", why: "Doing this together only works if you can both speak freely. If you can’t, there’s specialist help, and different rules.",
      qs: [["s1", "Have you ever felt frightened of your partner?", "yes"], ["s2", "Has your partner ever hurt you, or threatened to?", "yes"], ["s3", "Are you worried about how they’ll react when you start sorting things out?", "yes"]] },
    { id: "control", t: "Control", why: "Control isn’t always obvious. It can look like rules about money, your phone, or who you see.",
      qs: [["c1", "Does your partner control the money, or your access to it?", "yes"], ["c2", "Do they check your phone or messages, or track where you go?", "yes"], ["c3", "Do you often give in, just to avoid what happens if you don’t?", "yes"]] },
    { id: "talk", t: "How you talk", why: "You’ll need to agree a lot of things. You don’t have to get on, but you do need to be able to deal with each other.",
      qs: [["t1", "Can you talk about practical things, like bills or the children, without it turning into a row?", "no"], ["t2", "Is your partner willing to sort this out together?", "no"], ["t3", "Do you trust them to be honest about money?", "no"]] },
    { id: "complex", t: "Your situation", why: "Some things are hard to value or split without a specialist. That doesn’t rule out doing the rest yourselves.",
      qs: [["x1", "Does either of you own a business, or a share in one?", "yes"], ["x2", "Are there any assets, savings or pensions outside the UK?", "yes"], ["x3", "Is either of you in a final salary pension, or has a pension worth over £250,000?", "yes"], ["x4", "Do you think your partner might hide money, or has done before?", "yes"]] },
    { id: "you", t: "You", why: "This takes months. It’s fine to go slowly, and to get support for yourself along the way.",
      qs: [["r1", "Do you feel able to make big decisions at the moment?", "no"], ["r2", "Could you fill in forms at your own pace, with tools like these to help?", "no"]] },
  ];
  const ADVICE = {
    x1: ["A business", "An accountant can value it, and a solicitor can advise on how it’s shared."],
    x2: ["Assets abroad", "Rules differ by country. A family solicitor should look at these."],
    x3: ["A large or final salary pension", "These are hard to value. A pension on divorce expert (PODE) report is usual."],
    x4: ["Money that might be hidden", "A solicitor can ask the court to order full disclosure, with evidence."],
    t1: ["Talking is hard", "A mediator can keep conversations calm and on track."], t2: ["Not working together", "If they won’t engage, a solicitor can explain your options."], t3: ["Trust about money", "Full disclosure, with documents, matters even more. A solicitor can help if it stalls."],
  };
  const flagged = (q, v) => v === q[2] || v === "unsure";

  function band(a) {
    const hit = (g) => GROUPS.find((x) => x.id === g).qs.filter((q) => flagged(q, a[q[0]]));
    const danger = [...hit("safe"), ...hit("control")];
    if (danger.length) return { k: "advice", danger, parts: [], you: hit("you") };
    const parts = [...hit("complex"), ...hit("talk")];
    return { k: parts.length ? "parts" : "together", parts, you: hit("you") };
  }

  function Intro({ onStart }) {
    return (
      <main className="fit-intro">
        <window.KitToolIc tool={K.TOOLS[0]} s={22}/>
        <div className="kick">Before you begin · 5 minutes</div>
        <h1 className="serif">Is doing it ourselves <span className="em">right for us?</span></h1>
        <p className="fit-lede">Fifteen honest questions about safety, control, how you talk and how complicated things are. At the end, we’ll tell you plainly if we think you should get advice first.</p>
        <ul className="fit-prom">
          <li><Ic.Lock s={15}/><span><b>Your answers aren’t saved.</b> They stay on this screen and disappear when you leave.</span></li>
          <li><Ic.X s={14} c="#B91C1C"/><span><b>Quick exit</b> at the top, any time. It goes straight to the weather.</span></li>
          <li><Ic.Help s={15}/><span><b>“Not sure” is a fine answer.</b> We treat it carefully.</span></li>
        </ul>
        <div className="fit-cta"><button type="button" className="btn lg" onClick={onStart}>Start the check <Ic.Arrow s={16}/></button></div>
        <p className="fit-fine">This isn’t a test you pass or fail, and it isn’t legal advice. It can’t see everything about your situation.</p>
      </main>
    );
  }

  function Group({ g, i, a, set, onBack, onNext }) {
    const done = g.qs.every((q) => a[q[0]]);
    return (
      <main className="fit-q">
        <div className="fit-prog"><span>{i + 1} of {GROUPS.length}</span><div>{GROUPS.map((x, j) => <i key={x.id} className={j <= i ? "on" : ""}></i>)}</div></div>
        <div className="fit-cols">
          <div>
            <h2 className="serif">{g.t}</h2>
            <div className="fit-list">{g.qs.map(([id, q]) => (
              <div key={id} className="fit-row"><p>{q}</p>
                <div className="fit-seg" role="radiogroup" aria-label={q}>{[["yes", "Yes"], ["unsure", "Not sure"], ["no", "No"]].map(([v, l]) => <button type="button" key={v} role="radio" aria-checked={a[id] === v} className={a[id] === v ? "on" : ""} onClick={() => set(id, v)}>{l}</button>)}</div>
              </div>))}</div>
            <div className="fit-nav"><button type="button" className="back" onClick={onBack}><Ic.Back s={14}/> Back</button><button type="button" className="btn lg" disabled={!done} onClick={onNext}>{i === GROUPS.length - 1 ? "See what we think" : "Continue"} <Ic.Arrow s={15}/></button></div>
          </div>
          <aside className="fit-why"><span className="lbl">Why we ask</span><p>{g.why}</p></aside>
        </div>
      </main>
    );
  }

  const Help = ({ list }) => <div className="fit-help">{list.map(([t, n, d]) => <div key={t}><Ic.Phone s={15}/><div><b>{t}</b><span>{n}</span><small>{d}</small></div></div>)}</div>;
  const ABUSE = [["National Domestic Abuse Helpline", "0808 2000 247", "Free and confidential, 24 hours. Run by Refuge."], ["Men’s Advice Line", "0808 801 0327", "For men experiencing domestic abuse."], ["Rights of Women", "rightsofwomen.org.uk", "Free legal advice for women."], ["Check if you can get legal aid", "gov.uk/check-legal-aid", "Often available for family cases where there’s been abuse."]];

  function Result({ a, onRedo, pub }) {
    const r = band(a), N = K.PERSONA;
    const [keep, setKeep] = useState(false), [agree, setAgree] = useState(null);
    const say = (v) => { setAgree(v); K.log("fit-agree", "Does this feel right to you?", "choice", v, { step: "Result · " + r.k }); };
    const H = {
      advice: ["Please talk to someone who can help, before you go further.", "Some of what you’ve told us suggests there may be fear or control in your relationship. Doing this together assumes you can both speak freely, so we’d suggest getting specialist advice first."],
      parts: ["Some of this may need a professional.", "Nothing you’ve told us rules out doing much of it yourselves. But the parts below are where people usually need help, and getting it early can save money later."],
      together: ["Doing it together looks like it could work.", "From what you’ve told us, the toolkit could suit you. Here’s what to keep an eye on as you go."],
    }[r.k];
    return (
      <main className={"fit-res " + r.k}>
        <div className="fit-res-h">
          <span className="fit-badge">{r.k === "advice" ? <><Ic.Shield s={14}/> Get advice first</> : r.k === "parts" ? <><Ic.Help s={14}/> Get help with some parts</> : <><Ic.Check s={14} w={2.2}/> It could work, with care</>}</span>
          <h1 className="serif">{H[0]}</h1>
          <p>{H[1]}</p>
        </div>
        {r.k === "advice" && <>
          <section className="fit-sec"><h3 className="serif">People who can help, in confidence</h3><Help list={ABUSE}/><p className="fit-note">If you’re in danger now, call 999. If you can’t speak, call 999 and press 55.</p></section>
          <section className="fit-sec two">
            <div><h3 className="serif">Things that may be different for you</h3><ul><li>You may not have to attend a mediation meeting first.</li><li>You may be able to get legal aid.</li><li>A solicitor can deal with your partner for you, so you don’t have to.</li></ul></div>
            <div><h3 className="serif">What the toolkit can still do</h3><ul><li>Your journal is private, and a dated record can help later.</li><li>Your financial statement can be started on your own, and taken to a solicitor.</li><li>We’ve turned off nothing. But please don’t invite your partner into anything yet.</li></ul></div>
          </section>
        </>}
        {r.k === "parts" && <section className="fit-sec"><h3 className="serif">Where to get help</h3><div className="fit-parts">{r.parts.map((q) => { const x = ADVICE[q[0]]; return x ? <div key={q[0]}><b>{x[0]}</b><p>{x[1]}</p></div> : null; })}</div><p className="fit-note">You can still use the toolkit to get organised and fill in your statement, then take it to them. It usually saves time and fees.</p></section>}
        {r.k === "together" && <section className="fit-sec"><h3 className="serif">What to watch</h3><ul className="fit-watch"><li><b>Full disclosure, with documents.</b> Agreements made on incomplete figures can be undone.</li><li><b>Keep the children out of it.</b> Agree arrangements before the money, if you can.</li><li><b>Have it checked.</b> A solicitor reviewing your agreement before it goes to court is worth considering.</li><li><b>Come back to this check</b> if anything changes, or if you start to feel unsure.</li></ul></section>}
        {r.you.length > 0 && r.k !== "advice" && <section className="fit-sec soft"><h3 className="serif">And look after yourself</h3><p>You said decisions or forms feel hard right now. That’s very common. Go at your own pace, and think about talking to your GP or a counsellor. Samaritans are free on 116 123, any time.</p></section>}
        <section className="fit-sec ask"><b>Does this feel right to you?</b><div className="kit-ch">{["Yes", "Partly", "No"].map((v) => <button type="button" key={v} className={agree === v ? "on" : ""} onClick={() => say(v)}>{v}</button>)}</div>{agree && <small>Thank you. If it doesn’t feel right, trust that, and talk to someone.</small>}</section>
        <div className="fit-foot">
          {!pub && <label className="kit-chk"><input type="checkbox" checked={keep} onChange={(e) => { const v = e.target.checked, doIt = () => { setKeep(v); K.write({ fit: v ? { band: r.k, at: new Date().toISOString() } : null }); }; v ? K.needAcct("keep", doIt) : doIt(); }}/> Save this result to your toolkit (your answers are never kept)</label>}
          <div className="fit-cta">{pub ? <button type="button" className="btn" onClick={pub}>Start with the free guide <Ic.Arrow s={14}/></button> : <button type="button" className="btn" onClick={() => K.home()}>Back to my toolkit</button>}<button type="button" className="btn ghost" onClick={onRedo}>Answer again</button></div>
          <p className="fit-fine">This check can’t see everything. It isn’t legal advice, and it isn’t a judgement on you or {N.them}.</p>
        </div>
      </main>
    );
  }

  Object.assign(window, { FIT: { GROUPS, band }, FitIntro: Intro, FitGroup: Group, FitResult: Result });
})();
