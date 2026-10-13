/* M02 · the free result: orientation + rough financial picture */
function ResultsM({ a, onSurvey, onSkip, onEmail, emailed, surveyDone, onRestart }) {
  const M = window.M02, PB = window.PB;
  const x = { ...a, debt_kinds: a.debt_total && a.debt_total !== "none" ? ["other"] : ["none"] };
  const r = PB.compute(x), watch = PB.watch(x, r), g = PB.gbpK;
  const cohab = a.status === "cohab", civil = a.status === "civil", kids = a.kids === "with", owned = M.owns(a);
  const [st, sd] = window.M02.STAGE[a.stage] || window.M02.STAGE.decided;
  const order = cohab ? M.ORDER_COHAB : M.ORDER, here = M.HERE[a.stage] || "sep";
  const hi = order.findIndex((o) => o[0] === here);
  const [mail, setMail] = React.useState("");
  const est = cohab ? ["2 to 4 months", "Without a divorce, the timetable is set by how quickly you agree and get it written down."]
    : a.stage === "agreed" ? ["3 to 6 months", "Most of the time is the divorce timetable and the judge’s review."]
    : a.comms === "hard" ? ["9 to 18 months", "When talking is very hard, mediation adds time but usually saves far more than court would."]
    : a.comms === "tense" ? ["7 to 10 months", "The divorce timetable sets the minimum. Agreeing the money is usually what takes longer."]
    : ["6 to 8 months", "The divorce timetable sets the minimum. If you can agree, the money can be sorted within it."];

  const todo = [];
  if (a.safe && a.safe !== "safe") todo.push(["Talk to someone about your safety", "Call the National Domestic Abuse Helpline free on 0808 2000 247. Everything else can wait."]);
  if (a.stage === "filed") todo.push(["Don’t apply for the final order yet", "Wait until your financial order is approved. Finalising too early can cost you pension and inheritance rights."]);
  todo.push(["Start a list of everything you own and owe", "Home, accounts, pensions, cars, debts. Rough figures are fine for now."]);
  todo.push(["Download recent statements", "Three to six months for every account, card and loan, in your name and joint."]);
  if (!cohab && (a.pen_me !== "none" || a.pen_them !== "none")) todo.push(["Ask for your pension valuations", "Request a cash equivalent transfer value (CETV) from each provider. It’s usually free once a year, and can take weeks."]);
  if (owned) todo.push(["Get a feel for the home’s value", "Ask two or three local estate agents for a free valuation."]);
  if (a.comms === "hard") todo.push(["Look up a local mediator", "A first meeting (MIAM) is a good next step, and usually needed before court."]);
  if (kids) todo.push(["Think about what you’ll tell the children", "Together, if you can. Cafcass has a free parenting plan to help."]);
  todo.push(["Look after yourself", "Sleep, food and someone to talk to. Separating is one of life’s hardest things."]);

  const can = ["List and gather your finances, with statements", "Get the home valued by local agents", "Request pension valuations", "Talk through what you each need", "Apply for the divorce online", cohab ? "Agree who keeps what, in writing" : "Agree the split, and draft your heads of terms"];
  const pro = ["If you have any worries about safety or pressure", "If either of you won’t share the full picture", "Large or complex pensions (a specialist report)", "A business, trust, or property abroad", cohab ? "Drafting a declaration of trust" : "Checking the consent order wording before it goes to court", "If you can’t agree, and it may go to court"];

  const T = [["where", "Where you are"], ["order", "What happens next"], ["money", "Your finances"], ["diy", "What you can do"], ["cost", "Costs and time"], ["week", "This week"], ["help", "Support"]];
  return <div className="m-res">
    <div className="m-rh">
      <div className="kick">Your footing</div>
      <h1>Here’s where you <em>stand.</em></h1>
      <p>A private summary based on your answers. It’s a starting point, not legal advice, and it’s shaped by the law in England and Wales.</p>
      <div className="m-acts">
        <button type="button" className="m-ghost" onClick={() => window.print()}><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v8M4.5 7L8 10.5 11.5 7M3 13.5h10"></path></svg>Download or print</button>
        {!surveyDone && <button type="button" className="m-ghost" onClick={onSurvey}>Help shape what comes next</button>}
        <button type="button" className="m-ghost" onClick={onRestart}>Start again</button>
      </div>
      {emailed ? <div className="m-ok">Thanks. We’ll email your summary to you shortly.</div> :
        <form className="m-mail" onSubmit={(e) => { e.preventDefault(); if (window.emailOk(mail)) onEmail(mail.trim()); }}><input type="email" placeholder="Email me this summary" aria-label="Email address" value={mail} onChange={(e) => setMail(e.target.value)} /><button className="m-btn" type="submit" disabled={!window.emailOk(mail)}>Send</button></form>}
      <nav className="m-toc" aria-label="Sections">{T.map(([id, l]) => <a key={id} href={"#" + id}>{l}</a>)}</nav>
    </div>

    <section className="m-rs" id="where"><div className="m-n">01</div><h2>{st}</h2><p>{sd}</p>
      {(a.where && a.where !== "ew") && <div className="m-scope">The law in {a.where === "sc" ? "Scotland" : a.where === "ni" ? "Northern Ireland" : "your country"} is different from England and Wales. Treat this as a general picture, and check the local rules.</div>}
      {cohab && <div className="m-scope">Because you’re not married, there’s no automatic right to a share of each other’s property or pensions. What matters is who legally owns what, and what each of you put in.</div>}
    </section>

    <section className="m-rs" id="order"><div className="m-n">02</div><h2>What has to happen, in order</h2><p>{cohab ? "There’s no divorce to apply for. The steps are about agreeing and recording who keeps what." : `Two things run side by side: the ${civil ? "dissolution" : "divorce"}, which ends the ${civil ? "partnership" : "marriage"}, and the financial order, which settles the money. They’re separate.`}</p>
      <ol className="m-ord">{order.map(([k, t, d], i) => <li key={k} className={i < hi ? "past" : i === hi ? "here" : ""}><span className="d">{i + 1}</span><div><b>{civil && k === "div" ? "Apply to end the civil partnership" : t}{i === hi && <span className="m-you">You are here</span>}</b><p>{d}</p>{k === "final" && !cohab && <span className="m-warn">Finalising before the financial order is approved can cost you pension and inheritance rights.</span>}</div></li>)}</ol>
    </section>

    <section className="m-rs" id="money"><div className="m-n">03</div><h2>Your rough financial picture</h2><p>Built from your bands, so treat every figure as a rough guide. It shows the kind of outcome a court might see as fair, not what you’re entitled to.</p>
      <div className="m-pot"><div><small>Home, after the mortgage</small><b>{owned ? g(r.equity) : "None"}</b></div><div><small>Savings, less debts</small><b>{g(Math.max(0, r.savings - r.debts))}</b></div><div><small>Pensions{cohab ? " (usually kept)" : ""}</small><b>{r.pensions ? g(r.pensions) : "None"}</b></div></div>
      {r.pot > 0 ? <div className="m-range">
        <div className="t">A common outcome for a situation like yours</div>
        <div className="big"><span>{r.lo}% to {r.hi}%</span> for you</div>
        <div className="t" style={{ marginTop: 6 }}>About {g(r.potLo)} to {g(r.potHi)} of roughly {g(r.pot)} in total</div>
        <div className="m-track" aria-hidden="true"><i style={{ left: r.lo + "%", width: Math.max(2, r.hi - r.lo) + "%" }}></i><u></u></div>
        <div className="m-tl"><span>0%</span><span>Equal</span><span>100%</span></div>
      </div> : <div className="m-scope">From your answers there isn’t much to divide. The focus will be on income, housing and any debts.</div>}
      {r.why.length > 0 && <><div className="m-sub2">What’s shaping this</div><ul className="m-why">{r.why.map((w) => <li key={w}>{w}</li>)}</ul></>}
      {!cohab && <><div className="m-sub2">What a court looks at</div><div className="m-g2">{M.COURT.map(([t, d]) => <div key={t} className="m-card"><h3>{t}</h3><p>{d}</p></div>)}</div></>}
      {watch.length > 0 && <><div className="m-sub2">Worth watching</div><div className="m-g2">{watch.map(([t, d]) => <div key={t} className="m-card w"><h3>{t}</h3><p>{d}</p></div>)}</div></>}
    </section>

    <section className="m-rs" id="diy"><div className="m-n">04</div><h2>What you can do yourselves</h2><p>Most of this is within reach without paying anyone. Some situations do need a professional.</p>
      <div className="m-g2"><div><div className="m-sub2" style={{ marginTop: 0 }}>You can do</div><ul className="m-ck">{can.map((c) => <li key={c}>{c}</li>)}</ul></div><div><div className="m-sub2" style={{ marginTop: 0 }}>Get professional help</div><ul className="m-ck pro">{pro.map((c) => <li key={c}>{c}</li>)}</ul></div></div>
    </section>

    <section className="m-rs" id="cost"><div className="m-n">05</div><h2>Typical costs and time</h2>
      <div className="m-head"><div><small>Realistic time to a legally binding agreement</small><b>{est[0]}</b></div><p>{est[1]}</p></div>
      <div className="m-costs">{M.COSTS.filter((c) => !(cohab && /Divorce|Consent/.test(c[0]))).map(([t, d, w]) => <div key={t} className="m-cost"><b>{t}</b><span>{d}</span><em>{w}</em></div>)}</div>
      <p className="m-disc" style={{ marginTop: 12 }}>Typical figures for England and Wales, October 2026. Court fees change, so check GOV.UK before you pay.</p>
    </section>

    <section className="m-rs" id="week"><div className="m-n">06</div><h2>What to do this week</h2><p>Small, practical steps that make everything after them easier.</p>
      <ol className="m-todo">{todo.slice(0, 6).map(([t, d]) => <li key={t}><div><b>{t}</b><p>{d}</p></div></li>)}</ol>
    </section>

    <section className="m-rs" id="help"><div className="m-n">07</div><h2>Support, practical and emotional</h2><p>Free, trusted places to turn.</p>
      <div className="m-sup">{M.SUPPORT.map(([t, d, u]) => <a key={t} href={u} target="_blank" rel="noopener"><b>{t}</b><small>{d}</small></a>)}</div>
    </section>

    {!surveyDone && <div className="m-cta"><div className="kick">Optional · about 6 minutes</div><h2>Help us shape what comes next.</h2><p>We’re building a service to help couples do all of this together. Tell us what would actually help, what you’d trust, and what it would be worth to you. Your summary stays here.</p><div className="row"><button type="button" className="m-btn lt" onClick={onSurvey}>Help shape it<ArrowM /></button><button type="button" className="m-lnk" onClick={onSkip}>No thanks</button></div></div>}
    <p className="m-disc">Decouple is not a law firm and this is not legal advice. Figures are rough estimates based on the bands you chose and simplified rules.</p>
  </div>;
}
window.ResultsM = ResultsM;
