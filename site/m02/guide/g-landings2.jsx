/* M02 · landing designs F–I: say what the guide is, fast. Each one leads with the same promise (WHAT) and shows real help before asking for anything. Registered into window.GLANDS. */
(function () {
  const { useState } = React;
  const Ic = window.DIc, G = window.G;
  const WHAT = "A free, private guide for anyone separating in England and Wales. In about six minutes, see where you are, the facts that matter to you, and what to do next.";
  const STAGES = [["considering", "Thinking about separating"], ["decided", "We’ve decided to separate"], ["apart", "We’re living apart"], ["filed", "The divorce has started"], ["agreed", "We’ve agreed most things"]];
  const Three = ({ dark }) => (
    <div className={"gx-three" + (dark ? " dk" : "")}>
      {[["Where you are", "The stage you’re at, and what it means"], ["The facts that matter", "Only the ones that apply to you"], ["What to do next", "In order, at your pace"]].map(([t, d], i) => <div key={t}><span className="tab">{i + 1}</span><b>{t}</b><small>{d}</small></div>)}
    </div>
  );
  const Foot = ({ dark }) => <div className={"gx-foot" + (dark ? " dk" : "")}><span><Ic.Check s={13} w={2.2}/> Free</span><span><Ic.Lock s={13}/> Private. No account, no name</span><span><Ic.Spark s={13}/> About 6 minutes</span><span>Not legal advice, just clarity</span></div>;
  const Go = ({ onStart, resume, label, white }) => <button className={"btn lg" + (white ? " white" : "")} onClick={() => onStart()}>{resume ? "Carry on with my guide" : label || "Get my free guide"} <Ic.Arrow s={16}/></button>;

  /* F · Where are you? Pick your stage and get help on the spot */
  function Orient({ onStart, resume }) {
    const [k, setK] = useState(null), S = k && G.STAGE[k];
    const steps = k ? G.road({ stage: k, status: "married" }) : [], hi = steps.findIndex((s) => s.st === "here"), next = steps.slice(Math.max(0, hi), Math.max(0, hi) + 3);
    return (
      <main className="g-land gx gx-orient">
        <div className="wrap">
          <div className="gx-top">
            <div className="kick">Free · private · for England and Wales</div>
            <h1 className="serif">Separating is overwhelming. <span className="em">Start with where you are.</span></h1>
            <p className="serif gx-what">{WHAT}</p>
          </div>
          <div className="gx-pick">
            <div className="gx-pick-q">Where are you right now?</div>
            <div className="gx-chips" role="radiogroup" aria-label="Where are you right now?">{STAGES.map(([v, l]) => <button key={v} role="radio" aria-checked={k === v} className={k === v ? "on" : ""} onClick={() => setK(v)}>{l}</button>)}</div>
            {S ? (
              <div className="gx-ans" aria-live="polite">
                <div className="gx-ans-l"><div className="kick">Where you are</div><h2 className="serif">{S.t}</h2><p>{S.d}</p>{Array.isArray(S.x) && <ul>{S.x.slice(0, 3).map((x) => <li key={x}>{x}</li>)}</ul>}</div>
                <div className="gx-ans-r"><div className="kick">What comes next</div><ol>{next.map((s, i) => <li key={s.id}><span className="tab">{i + 1}</span><div><b>{s.t}</b><small>{s.w}</small></div></li>)}</ol></div>
                <div className="gx-ans-f"><span>Your full guide adds the rest for your situation: children, the home, money, and what’s likely to be fair.</span><button className="btn lg" onClick={() => onStart({ stage: k })}>{resume ? "Carry on with my guide" : "Get my full guide"} <Ic.Arrow s={16}/></button></div>
              </div>
            ) : <div className="gx-hint">Tap one. You’ll see what it means straight away, with nothing to fill in.</div>}
          </div>
          <Foot/>
        </div>
      </main>
    );
  }

  /* G · Cut through the noise: common beliefs, plain facts */
  const MYTHS = [
    ["Someone has to be blamed for a divorce.", "Not since April 2022. You can divorce without blaming anyone, and you can apply together."],
    ["Once we’re divorced, the money’s sorted.", "No. The divorce ends the marriage. Money and property need a separate financial order, or either of you could still make a claim years later."],
    ["Pensions stay with whoever earned them.", "Pensions count, and are often worth more than the house. They can be shared."],
    ["We lived together for years, so we have the same rights as married couples.", "There’s no “common-law marriage” in England and Wales. Couples who aren’t married have far fewer rights, so the steps are different."],
    ["We’ll have to go to court.", "Most couples don’t. Mediation, or agreeing between you, is usual. A judge then approves the agreement, often on paper."],
  ];
  function Noise({ onStart, resume }) {
    const [o, setO] = useState(0);
    return (
      <main className="g-land gx gx-noise">
        <div className="wrap gx-noise-g">
          <div>
            <div className="kick">Cut through the noise</div>
            <h1 className="serif">Everyone has advice. <span className="em">Here are the facts.</span></h1>
            <p className="serif gx-what">{WHAT}</p>
            <Three/>
            <div className="gx-cta"><Go onStart={onStart} resume={resume}/></div>
            <Foot/>
          </div>
          <div className="gx-myths">
            <div className="gx-myths-h">Things people often hear</div>
            {MYTHS.map(([m, f], i) => (
              <div key={m} className={"gx-myth" + (o === i ? " on" : "")}>
                <button onClick={() => setO(o === i ? -1 : i)} aria-expanded={o === i}><span className="gx-m">“{m}”</span><span className="gx-tog">{o === i ? "–" : "+"}</span></button>
                {o === i && <div className="gx-f"><b>The fact</b>{f}</div>}
              </div>
            ))}
            <div className="gx-myths-f">Your guide only includes the facts that apply to you.</div>
          </div>
        </div>
      </main>
    );
  }

  /* H · One step at a time: calm, minimal, what now / soon / later */
  function Calm({ onStart, resume }) {
    return (
      <main className="g-land gx gx-calm">
        <div className="gx-calm-in">
          <div className="kick">If today feels like too much</div>
          <h1 className="serif">One step <span className="em">at a time.</span></h1>
          <p className="serif gx-what">{WHAT}</p>
          <div className="gx-nsl">
            <div><small>Now</small><b>Get steady</b><span>Support, safety, and money for the next few months.</span></div>
            <div><small>Soon</small><b>Get the picture</b><span>What you own, owe and earn, between you.</span></div>
            <div><small>Later</small><b>Agree, then make it legal</b><span>Children, the home, the money. Then a judge approves it.</span></div>
          </div>
          <p className="gx-calm-note">You don’t have to decide anything today. The guide shows what matters now and what can wait.</p>
          <div className="gx-cta center"><Go onStart={onStart} resume={resume} label="Show me where to start"/></div>
          <Foot/>
          <p className="gx-help">Worried about your safety? Call the National Domestic Abuse Helpline free on <b>0808 2000 247</b>, any time.</p>
        </div>
      </main>
    );
  }

  /* I · Your first steps: useful straight away */
  const FIRST = [
    ["Look after yourself first", "Tell someone you trust. If you feel unsafe, that comes before everything else."],
    ["Don’t rush big decisions", "Avoid moving out, moving money or signing anything until you know where you stand."],
    ["Start a rough list", "What you own, owe and earn, in your name and jointly. Estimates are fine for now."],
    ["Find your pension details", "They’re often the biggest thing after the house. An annual statement is a good start."],
    ["Know the order of things", "Divorce and money are separate steps. Your guide shows which comes when, for you."],
  ];
  function First({ onStart, resume }) {
    const [d, setD] = useState({});
    return (
      <main className="g-land gx gx-first">
        <div className="wrap gx-first-g">
          <div>
            <div className="kick">Just found out, or just decided?</div>
            <h1 className="serif">What to do first, <span className="em">when you’re separating.</span></h1>
            <p className="serif gx-what">{WHAT}</p>
            <div className="gx-cta"><Go onStart={onStart} resume={resume} label="Get my full guide"/></div>
            <Foot/>
          </div>
          <div className="gx-list">
            <div className="gx-list-h"><b>Five things for this week</b><span>{Object.values(d).filter(Boolean).length} of {FIRST.length}</span></div>
            {FIRST.map(([t, s], i) => (
              <label key={t} className={"gx-li" + (d[i] ? " done" : "")}><input type="checkbox" checked={!!d[i]} onChange={(e) => setD({ ...d, [i]: e.target.checked })}/><span className="bx"><Ic.Check s={12} w={3} c="#FFF"/></span><span><b>{t}</b><small>{s}</small></span></label>
            ))}
            <div className="gx-list-f">These are for everyone. Your guide gives you the steps for your situation, in order.</div>
          </div>
        </div>
      </main>
    );
  }

  Object.assign(window.GLANDS, {
    f: { name: "F · Where are you? (instant help)", bg: "bg-wash", C: Orient },
    g: { name: "G · Facts, not noise", bg: "bg-paper", C: Noise },
    h: { name: "H · One step at a time", bg: "bg-paper", C: Calm },
    i: { name: "I · What to do first", bg: "bg-wash", C: First },
  });
})();
