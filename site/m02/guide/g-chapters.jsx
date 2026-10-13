/* M02 v2 · guide chapters, built from Proto 03 blocks (card, stats, why, pth, watch, quotes, parenting, opts3, still) */
(function () {
  const { useState } = React;
  const Ic = window.DIc, PB = window.PB, G = window.G, IV = window.IV;

  function Where({ a, r }) {
    const s = G.STAGE[a.stage] || G.STAGE.decided, steps = G.road(a), cohab = a.status === "cohab";
    return <>
      <div className="card" style={{ "--c": "#5B21B6" }}>
        <div className="card-k"><Ic.Spark s={14}/><span>Where you are</span></div>
        <div className="card-t">{s.t}</div>
        <p className="card-p">{s.d}</p>
        <div className="lbl-s">What to expect</div>
        <ul className="xl">{s.x.map((t) => <li key={t}><Ic.Check s={13} w={2.4}/>{t}</li>)}</ul>
        {a.where_uk && a.where_uk !== "ew" && <div className="pp-flag" style={{ marginTop: 16 }}>The law in {a.where_uk === "sc" ? "Scotland" : a.where_uk === "ni" ? "Northern Ireland" : "your country"} is different from England and Wales. Use this guide as a general picture, and check the local rules.</div>}
        {cohab && <div className="pp-flag" style={{ marginTop: 16 }}>Because you’re not married, there’s no automatic right to a share of each other’s property or pensions. Who legally owns what matters most.</div>}
      </div>
      <div className="card" style={{ "--c": "#5B21B6" }}>
        <div className="card-k"><span>The whole journey, in order</span></div>
        <div className="card-t">{cohab ? "Without a divorce, the steps are about agreeing, then writing it down." : <>Two things run side by side: <b>the divorce</b>, and <b>the money</b>.</>}</div>
        {!cohab && <p className="card-p">The divorce ends the {a.status === "civil" ? "partnership" : "marriage"}. The money is settled separately, by a financial order. Many people don’t realise they’re different.</p>}
        <ol className="road">{steps.map((x, i) => <li key={x.id} className={x.st}>
          <span className="n">{x.st === "past" ? <Ic.Check s={12} w={2.6} c="#166534"/> : String(i + 1).padStart(2, "0")}</span>
          <div><h4>{x.t}{x.st === "here" && <span className="yah">You are here</span>}{x.todo && <span className="yah amb">Still to do</span>}</h4><div className="w">{x.w}</div><p>{x.d}</p></div>
        </li>)}</ol>
      </div>
    </>;
  }

  function Picture({ a, r }) {
    const N = r.N, pens = !r.cohab && (a.pen_me && a.pen_me !== "none" || a.pen_them && a.pen_them !== "none");
    const cx = Array.isArray(a.complex) ? a.complex.filter((x) => x !== "none") : [];
    const need = [
      ["Bank statements", "12 months, for every account in your name, or joint.", "Both"],
      a.work === "self" ? ["Business accounts and tax returns", "Usually the last two to three years.", "You"] : a.work === "employed" ? ["Payslips and your P60", "Your last three payslips and latest P60.", "Both"] : null,
      pens && ["Pension valuations (a CETV for each)", "Ask each provider now. They can take weeks, sometimes months.", "Both"],
      r.owned && ["The home", "A mortgage statement, and two or three estate agent valuations.", "Both"],
      G.hasDebt(a) && ["Debts", "Latest statements for every card, loan and finance agreement.", "Both"],
      cx.length > 0 && ["Anything more complex", `Details of ${IV.valLabel("complex", a).toLowerCase()}. These may need a specialist valuation.`, "Both"],
      ["What you each need to live on", "Monthly spending, now and after you separate.", "Both"],
    ].filter(Boolean);
    return <>
      <div className="card" style={{ "--c": "#4338CA" }}>
        <div className="card-k"><Ic.Bank s={14}/><span>The financial picture</span></div>
        <div className="card-t">You’ll both need to show everything, <b>with evidence.</b></div>
        <p className="card-p">Courts call this full and frank disclosure. If you use a mediator or solicitor, they’ll usually ask you each to fill in a <b style={{ color: "#1A1A1A" }}>Form E</b>: a long financial statement with documents attached. {N.Them} will need to complete one too, and you’ll swap them.</p>
        <div className="stats">
          <div className="stat"><small>Form E</small><b>About 28 pages</b><em>each of you</em></div>
          <div className="stat"><small>Bank statements</small><b>12 months</b><em>every account</em></div>
          <div className="stat"><small>Typical time</small><b>4 to 8 weeks</b><em>to gather it all</em></div>
        </div>
      </div>
      <div className="card" style={{ "--c": "#4338CA" }}>
        <div className="card-k"><span>What you’ll need, from what you told us</span></div>
        <div className="fair">{need.map(([t, d, w]) => <div key={t} className="fair-row need"><span className="ic"><Ic.Dash s={12} c="#4338CA"/></span><div><b>{t}</b><p>{d}</p></div><span className="tag">{w}</span></div>)}</div>
        <div className="disc"><Ic.Help s={13}/><span>Start with what’s easiest. Requesting pension valuations today is the single biggest time-saver.</span></div>
      </div>
    </>;
  }

  function Kids({ a, r }) {
    const N = r.N, told = a.kids_know === "yes";
    return <>
      <div className="card" style={{ "--c": "#9D174D" }}>
        <div className="card-k"><Ic.Kid s={14}/><span>The children</span></div>
        <div className="card-t">Their arrangements are agreed <b>separately, and child-first.</b></div>
        <p className="card-p">Courts expect parents to agree where the children live and how they spend time with each of you. Most do it without a court, often in a written parenting plan. Child maintenance is separate again: agree it between you, or use the Child Maintenance Service.</p>
        <div className="pp-help">
          <div><b>Telling them</b><p>{told ? "They know. Keep reassuring them it isn’t their fault, and keep routines as steady as you can." : "If you can, tell them together, with a simple, shared explanation. Keep it age-appropriate, and leave blame out."}</p></div>
          <div><b>Where they live</b><p>{a.kids_live === "unsettled" ? "Not settled yet is common. A predictable pattern matters more than a perfect one." : "Starting from what happens now usually works best, then adjust as you go."}</p></div>
          <div><b>Money for them</b><p>Child maintenance is worked out from the paying parent’s income and how many nights the children stay.</p></div>
        </div>
      </div>
      <PBParenting a={a} r={r}/>
    </>;
  }

  function Home({ a, r }) {
    const kids = a.kids === "with", main = a.kids_live === "me" || a.kids_live === "them";
    const O = r.owned ? [
      ["Sell, and split the proceeds", "The cleanest break. You both buy or rent again.", "Works when neither of you can afford it alone."],
      ["One keeps it, and buys the other out", "Needs a mortgage in one name, and enough to pay the other’s share.", "Works when one income can carry the mortgage."],
      kids && ["One stays until the children are older", "The sale is delayed, often until the youngest turns 18. Sometimes called a Mesher order.", "Keeps the children’s home stable.", main],
      ["Transfer it, and balance it elsewhere", "One keeps the home, the other takes more of the savings or pensions.", "Works when there’s enough else to balance it."],
    ].filter(Boolean) : [
      ["Keep the tenancy", "One of you stays, with the landlord’s agreement.", "Check whether one income covers the rent."],
      ["Give notice together", "You both move, and agree how to share the deposit and costs.", "Keeps it simple, and even."],
      ["Change the names", "Ask the landlord to move the tenancy into one name.", "Protects whoever leaves from future arrears."],
    ];
    return <>
      <div className="card" style={{ "--c": "#0369A1" }}>
        <div className="card-k"><Ic.Home s={14}/><span>The home</span></div>
        <div className="card-t">{r.owned ? <>There are <b>{O.length} common ways</b> to deal with the home.</> : <>Renting keeps it simpler, but <b>there’s still a plan to make.</b></>}</div>
        <p className="card-p">{r.cohab && r.owned ? "As you’re not married, it mainly comes down to whose name the home is in, and what each of you paid towards it." : "There’s no single right answer. Most couples look at two or three options side by side before deciding."}</p>
        <div className="opts3 two">{O.map(([t, d, w, hl], i) => <div key={t} className={"opt3" + (hl ? " hl" : "")}><div className="n">0{i + 1}{hl ? " · often fits families like yours" : ""}</div><h4>{t}</h4><p>{d}</p><div className="who">{w}</div></div>)}</div>
      </div>
      <div className="card" style={{ "--c": "#0369A1" }}>
        <div className="card-k"><span>Where you’ll live</span></div>
        <div className="card-t">{a.next_home === "no" ? "Not knowing where you’ll live is one of the hardest parts." : a.next_home === "yes" ? "Knowing where you’ll live makes everything else easier." : "Having some idea is a good start."}</div>
        <p className="card-p">{a.next_home === "yes" ? "Check it works for the long term too: commute, school, and what you can afford on one income." : "Start with a real number. A mortgage in principle, or a look at local rents, tells you what’s realistic before you negotiate."}</p>
        <ul className="xl" style={{ "--c": "#0369A1" }}>
          {r.owned && <li><Ic.Check s={13} w={2.4}/>Ask two or three local agents for a free valuation.</li>}
          <li><Ic.Check s={13} w={2.4}/>Find out what you could borrow, or rent, on your own.</li>
          {a.living === "together" && <li><Ic.Check s={13} w={2.4}/>Moving out doesn’t give up your rights to the home, but get advice before you go if you can.</li>}
          {kids && <li><Ic.Check s={13} w={2.4}/>Think about school runs and the children’s routines when you look.</li>}
        </ul>
      </div>
    </>;
  }

  function Fair({ a }) {
    const [w, setW] = useState({}), r = PB.compute(a, w), F = r.cohab ? G.COURT_C : G.COURT.map((f) => f[0] === "Needs" && a.kids !== "with" ? ["Needs", "Especially housing: what each of you needs to live on, now and after."] : f);
    return <>
      <PBRange a={a} r={r} w={w} setW={setW}/>
      <div className="card" style={{ "--c": "#4338CA" }}>
        <div className="card-k"><span>{r.cohab ? "What matters when you’re not married" : "What a court looks at"}</span></div>
        <div className="card-t">{r.cohab ? "It’s mostly about ownership, not need." : "It isn’t a formula. It’s these things, weighed together."}</div>
        <div className="opts3 two">{F.map(([t, d]) => <div key={t} className="opt3"><h4 style={{ marginTop: 0 }}>{t}</h4><p>{d}</p></div>)}</div>
      </div>
      <PBWatch a={a} r={r} w={w}/>
    </>;
  }

  function Agree({ a, r }) {
    const hl = a.comms === "good" ? ["self", "med"] : ["med"];
    return <>
      <div className="card" style={{ "--c": "#6D28D9" }}>
        <div className="card-k"><Ic.Help s={14}/><span>Reaching agreement</span></div>
        <div className="card-t">Most couples agree in <b>mediation</b>. Some use solicitors. Few end up in court.</div>
        <p className="card-p">{a.comms === "hard" ? "When talking is very hard, mediators can keep you in separate rooms and pass messages between you. It’s called shuttle mediation." : a.comms === "tense" ? "When things are tense, a neutral person in the room keeps conversations on track." : "If you can talk calmly, you may be able to agree most of it yourselves, then get it checked."}</p>
        <div className="routes">{G.ROUTES.map(([id, t, d, c, tm]) => <div key={id} className={"route" + (hl.includes(id) ? " hl" : "")}>
          <div><b>{t}{id === "med" && <span className="yah lt">Most common</span>}</b><p>{d}</p></div>
          <div><small>Typical cost</small>{c}</div><div><small>Typical time</small>{tm}</div>
        </div>)}</div>
        <div className="disc"><Ic.Help s={13}/><span>Typical figures for England and Wales, October 2026. Mediation vouchers may help with costs if you have children.</span></div>
      </div>
      {a.stage !== "considering" && <PBPartner a={a} r={r}/>}
    </>;
  }

  function Legal({ a, r }) {
    if (r.cohab) return (
      <div className="card" style={{ "--c": "#166534" }}>
        <div className="card-k"><Ic.Shield s={14}/><span>Making it legal</span></div>
        <div className="card-t">Without marriage, there’s <b>no court order</b> to make it binding.</div>
        <p className="card-p">Instead, you write it down: a separation agreement for what you’ve agreed, and a declaration of trust if one of you keeps a share of the home. Both are best drafted, or at least checked, by a solicitor, so they hold up later.</p>
      </div>
    );
    const S = [["Apply for the divorce", "Week 0", "Online, alone or jointly.", "#5B21B6"], ["Conditional order", "Week 20+", "Apply once the 20 weeks are up.", "#4338CA"], ["Send the consent order", "After that", "With a D81 summary form.", "#0369A1"], ["A judge approves it", "Weeks to months", "Usually on paper, no hearing.", "#9D174D"], ["Final order", "Last", "Only once the money is approved.", "#166534"]];
    return <>
      <div className="card" style={{ "--c": "#166534" }}>
        <div className="card-k"><Ic.Shield s={14}/><span>Making it legal</span></div>
        <div className="card-t">An agreement only becomes binding <b>once a judge approves it.</b></div>
        <p className="card-p">This is done with a consent order: your agreement written in legal terms, sent to the court with a short summary form called a D81. A judge reviews it to check it’s fair, usually without either of you attending.</p>
        <div className="pth">{S.map(([t, w, d, c], i) => <div key={t}><span className="n" style={{ background: c + "16", color: c }}>{String(i + 1).padStart(2, "0")}</span><h4>{t}</h4><div className="w" style={{ color: c }}>{w}</div><p>{d}</p></div>)}</div>
        <div className="stats">
          <div className="stat"><small>Divorce application</small><b>About £600</b><em>court fee, paid once</em></div>
          <div className="stat"><small>Consent order</small><b>About £60</b><em>court fee</em></div>
          <div className="stat"><small>Shortest timetable</small><b>6 to 7 months</b><em>set by the divorce</em></div>
        </div>
      </div>
      <div className="watch"><div className="wcard"><div className="ic" style={{ background: "#B91C1C14" }}><Ic.Shield s={18} c="#B91C1C"/></div><h4>Don’t finalise the divorce too early</h4><p>Applying for the final order before the financial order is approved can cost you pension and inheritance rights.</p></div>
        <div className="wcard"><div className="ic" style={{ background: "#16653414" }}><Ic.Check s={18} c="#166534"/></div><h4>It doesn’t have to be a solicitor</h4><p>You can write and file a consent order yourselves. Many people still pay for a check, so the wording holds up.</p></div></div>
    </>;
  }

  function You({ a, r }) {
    const sup = (a.support || []).filter((x) => x !== "none"), names = sup.map((k) => ({ family: "family", friends: "friends", therapy: "a counsellor", gp: "your GP", work: "your employer" }[k]));
    const todo = Object.keys(G.ADMIN).filter((k) => !(a.admin || []).includes(k)).filter((k) => k !== "school" || a.kids === "with");
    const week = [];
    if (a.safe && a.safe !== "safe") week.push(["Talk to someone about your safety", "The National Domestic Abuse Helpline is free on 0808 2000 247. Everything else can wait."]);
    if (a.cope === "hard") week.push(["Tell one person how you’re really doing", "A friend, your GP, or Samaritans on 116 123."]);
    week.push(["Start a list of everything you own and owe", "Rough figures are fine. You’ll firm them up later."]);
    if (!r.cohab && (a.pen_me !== "none" || a.pen_them !== "none")) week.push(["Ask for your pension valuations", "Request a CETV from each provider. It’s usually free once a year."]);
    if (a.stage === "filed") week.push(["Hold off on the final order", "Wait until the financial order is approved."]);
    if (a.comms === "hard") week.push(["Look up a local mediator", "A first meeting (MIAM) is a good next step."]);
    if (a.kids === "with" && a.kids_know !== "yes") week.push(["Plan what you’ll tell the children", "Together, if you can."]);
    return <>
      <div className="card" style={{ "--c": G.AMB }}>
        <div className="card-k"><Ic.Help s={14}/><span>Looking after yourself</span></div>
        <div className="card-t">{a.cope === "hard" ? "It sounds like things are really hard right now." : a.cope === "updown" ? "Up and down is completely normal." : "You’re holding steady. Keep the basics going."}</div>
        <p className="card-p">{a.cope === "hard" ? "Please talk to someone today. Your GP can help, and Samaritans are free on 116 123, any time. You don’t have to sort everything at once." : a.cope === "updown" ? "Expect good days and hard ones, sometimes in the same hour. Sleep, food and someone to talk to matter more than any form." : "Separating is one of life’s biggest stresses, even when it’s going well. Keep an eye on sleep, and ask for help early."}</p>
        <p className="card-p">{sup.length ? `You have ${names.join(", ").replace(/, ([^,]*)$/, " and $1")} around you. Lean on them, and tell them what would actually help.` : "You don’t have anyone around you yet. That matters. A GP, a counsellor or a local support group is a good first step."}</p>
      </div>
      <div className="card" style={{ "--c": G.AMB }}>
        <div className="card-k"><span>What to do this week</span></div>
        <div className="card-t">Small, practical steps that make everything after them easier.</div>
        <div className="fair">{week.slice(0, 5).map(([t, d], i) => <div key={t} className="fair-row need amb"><span className="ic tab">{i + 1}</span><div><b>{t}</b><p>{d}</p></div></div>)}</div>
        {todo.length > 0 && <><div className="lbl-s" style={{ marginTop: 22 }}>Practical things to sort, when you’re ready</div><ul className="xl" style={{ "--c": G.AMB }}>{todo.map((k) => <li key={k}><Ic.Check s={13} w={2.4}/><span><b style={{ fontWeight: 600 }}>{G.ADMIN[k][0]}.</b> {G.ADMIN[k][1]}</span></li>)}</ul></>}
      </div>
      <div>
        <div className="card-k" style={{ margin: "8px 0 12px 4px" }}>Free, trusted support</div>
        <div className="still">{G.SUPPORT.map(([t, d, u]) => <a key={t} href={u} target="_blank" rel="noopener">{t}<span>{d}</span></a>)}</div>
      </div>
    </>;
  }

  window.GCH = { where: Where, picture: Picture, kids: Kids, home: Home, fair: Fair, agree: Agree, legal: Legal, you: You };
})();
