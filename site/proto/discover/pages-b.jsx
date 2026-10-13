/* Discover — Why Decouple, Pricing, FAQ */
(function () {
  const { useState } = React;
  const Ic = window.DIc, go = window.dGo, J = window.Journey;

  /* Why Decouple — "is this the right route for us?" Compares routes; price appears once and links to Pricing. */
  const ROUTES = [
    { k: "sol", name: "Two solicitors", cost: "£15,000+", time: "12–18 months", see: "What each side chooses to send", lead: "The lawyers", docs: "Drafted by solicitors", kids: "Often caught in the middle" },
    { k: "med", name: "Mediation + solicitors", cost: "£3,000–£6,000", time: "6–9 months", see: "What's brought to each session", lead: "You, in scheduled sessions", docs: "Solicitor drafts afterwards", kids: "Calmer, but slow" },
    { k: "diy", name: "Doing it yourselves", cost: "Court fee only", time: "Unpredictable", see: "Whatever you manage to gather", lead: "You, without guidance", docs: "Higher risk of rejection", kids: "Depends on the day" },
  ];
  const DC = { name: "Decouple", cost: "£499 between you — no mediator needed", time: "About 3 months", see: "Both of you, everything, always", lead: "You both, guided step by step", docs: "Drafted and checked for you", kids: "Child-first plan from day one" };
  const ROWS = [["cost", "Typical cost for both of you"], ["time", "Typical time"], ["see", "Who sees the full picture"], ["lead", "Who's in control"], ["docs", "Court documents"], ["kids", "Pressure on the children"]];

  function Why({ onStart }) {
    const [vs, setVs] = useState("sol");
    const other = ROUTES.find((r) => r.k === vs);
    return (
      <main className="wrap page-pad">
        <div className="kick">Why Decouple</div>
        <h2 className="serif h2">The same outcome.<br/><span className="em">A fraction of the cost and the heartache.</span></h2>
        <p className="p-lede">There's more than one way to separate. Here's how the usual routes compare — so you can choose the one that fits the two of you.</p>

        <div className="rtab" role="table" aria-label="Routes compared">
          <div className="rtab-row head" role="row"><span role="columnheader"></span>{ROUTES.map((r) => <span key={r.k} role="columnheader">{r.name}</span>)}<span role="columnheader" className="dc">{DC.name}<i>.</i></span></div>
          {ROWS.map(([k, l]) => (
            <div key={k} className={"rtab-row" + (k === "cost" || k === "time" ? " big" : "")} role="row">
              <span role="rowheader">{l}</span>{ROUTES.map((r) => <span key={r.k} role="cell">{r[k]}</span>)}
              <span role="cell" className="dc">{k === "cost" ? <>{DC.cost}<button className="dc-link" onClick={() => go("pricing")}>See plans →</button></> : DC[k]}</span>
            </div>
          ))}
        </div>

        <div className="rcmp">
          <div className="rcmp-seg" role="tablist" aria-label="Compare Decouple with">
            {ROUTES.map((r) => <button key={r.k} role="tab" aria-selected={vs === r.k} className={vs === r.k ? "on" : ""} onClick={() => setVs(r.k)}>{r.name}</button>)}
          </div>
          <div className="rcmp-grid">
            <div className="rcmp-col"><div className="h">{other.name}</div>{ROWS.map(([k, l]) => <div key={k} className="c"><small>{l}</small>{other[k]}</div>)}</div>
            <div className="rcmp-col dc"><div className="h">Decouple<i>.</i></div>{ROWS.map(([k, l]) => <div key={k} className="c"><small>{l}</small>{DC[k]}</div>)}<button className="dc-link" onClick={() => go("pricing")}>See plans →</button></div>
          </div>
        </div>
        <p className="rnote">Typical figures for England & Wales. Every situation differs.</p>

        <div className="fit">
          <div className="fit-col yes">
            <div className="kick">A good fit if</div>
            <ul>{["You can both engage — even if things are tense", "Your finances are mostly salaries, the home, pensions and savings", "You'd rather agree it in months than fight it for years", "You want the children kept out of the middle"].map((t) => <li key={t}><Ic.Check s={14} w={2.4}/>{t}</li>)}</ul>
          </div>
          <div className="fit-col no">
            <div className="kick">Get specialist help first if</div>
            <ul>{["You're worried about your safety — call 0808 2000 247, free, 24 hours", "There's a business, a trust or property overseas", "You think money is being hidden", "Your ex-partner refuses to take part at all"].map((t) => <li key={t}><Ic.Help s={14}/>{t}</li>)}</ul>
          </div>
        </div>

        <div className="dark-band">
          <span><Ic.Lock s={15}/>Not sure yet? The interview is free, and tells you which route fits.</span>
          <button className="btn" onClick={onStart}>Start your free interview <Ic.Arrow s={14}/></button>
        </div>
      </main>
    );
  }

  const TIERS = [
    { k: "picture", name: "Your picture", total: 99, solo: true, sub: "Your evidence and numbers — all your ducks in a row",
      feats: ["Your first read, saved", "Connect accounts for exact figures", "Evidence checklist and secure uploads", "A Form E–style financial statement, ready for mediation", "Private until you choose to share"] },
    { k: "guided", name: "Guided settlement", total: 499, sub: "Takes the place of mediation", best: true,
      feats: ["Everything in Your picture", "Invite your ex-partner and reconcile", "Model a fair split with reasonableness checks", "Plain-English guidance — no mediator needed", "Children and housing arrangements"] },
    { k: "complete", name: "Complete & filed", total: 999, sub: "We take it all the way to court",
      feats: ["Everything in Guided settlement", "Court-ready Consent Order and Form D81", "Digital filing to HMCTS", "Document review checks", "Priority human support"] },
  ];

  const PQ = [
    ["Can we start on one plan and upgrade?", "Yes. Upgrade at any point and you only pay the difference. Many people start with Your picture to get their numbers straight, then move to Guided settlement once their ex-partner is on board."],
    ["How does splitting the fee work?", "At checkout you choose to split it or pay it all. If you split, your ex-partner pays their half when they accept your invitation — nothing is unlocked for them until then."],
    ["What if my ex-partner never joins?", "Your picture is yours to keep, and your Form E–style statement is ready for mediation or a solicitor. If you've paid for Guided settlement and they haven't joined within 30 days, we'll refund everything except the £99."],
  ];
  function PriceExtras() {
    const [open, setOpen] = useState(0);
    return (
      <div className="pxtra">
        <div className="pxtra-costs">
          <div className="kick" style={{ color: "#78716C" }}>Other costs to plan for</div>
          {[["Court fee", "Paid directly to HMCTS when the order is filed. We'll show the current amount before you submit.", "Required"], ["Mediator", "Not usually needed — Guided settlement does the job of mediation. If you'd still like one in the room, we can introduce one.", "Optional"], ["Solicitor review", "A fixed-fee look over the final documents, if you'd like the reassurance.", "Optional"]].map(([t, d, tag]) => (
            <div key={t} className="cost"><div><b>{t}</b><p>{d}</p></div><span className={"tag" + (tag === "Required" ? " req" : "")}>{tag}</span></div>
          ))}
        </div>
        <div className="pxtra-q">
          <div className="kick" style={{ color: "#78716C" }}>Pricing questions</div>
          {PQ.map(([q, a], i) => (
            <div key={q} className={"qa" + (open === i ? " open" : "")}>
              <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>{q}<Ic.Plus s={18} c="#57534E"/></button>
              <div className="ans"><div><p>{a}</p></div></div>
            </div>
          ))}
          <button className="link" style={{ marginTop: 18 }} onClick={() => go("faq")}>All questions <Ic.Arrow s={13}/></button>
        </div>
      </div>
    );
  }

  function Pricing({ onStart }) {
    const s = window.useDJourney();
    const d = s.discover || {};
    const pay = d.payMode || "one";
    const tier = d.tier || "guided";
    const m = (n) => "£" + (n % 1 ? n.toFixed(2) : n);
    const price = (t) => t.solo ? [m(t.total), "just for you"] : pay === "split" ? [m(t.total / 2), `each · ${m(t.total)} total, split between you`] : [m(t.total), "one fee, covers you both"];
    return (
      <main className="wrap page-pad" style={{ textAlign: "center" }}>
        <div className="kick">Pricing</div>
        <h2 className="serif h2" style={{ margin: "16px auto 0" }}>Choose how far <span className="em">you'd like to go.</span></h2>
        <p className="p-lede" style={{ margin: "20px auto 0" }}>Start by getting your own evidence and numbers in order. Upgrade when you're ready to settle — you'll only pay the difference.</p>
        <div style={{ marginTop: 28 }}>
          <div className="seg" role="radiogroup" aria-label="Who pays">
            <button className={pay === "one" ? "on" : ""} onClick={() => J.set("discover", { payMode: "one" })}>Pay in full up front</button>
            <button className={pay === "split" ? "on" : ""} onClick={() => J.set("discover", { payMode: "split" })}>We'll split it</button>
          </div>
          {pay === "split" && <p className="split-note"><Ic.Help s={13}/> Your ex-partner pays their half when they sign up. Nothing is unlocked for them until then.</p>}
        </div>
        <div className="tiers" style={{ textAlign: "left" }}>
          {TIERS.map((t) => {
            const [p, ps] = price(t), sel = tier === t.k;
            return (
              <button key={t.k} className={"tier" + (t.best ? " best" : "") + (sel ? " sel" : "")} role="radio" aria-checked={sel} onClick={() => J.set("discover", { tier: t.k })}>
                {t.best && <div className="ribbon"><Ic.Star s={11} c="#FFF"/> MOST CHOSEN · JUST RIGHT</div>}
                <div className="in">
                  <div className="nm">{t.name}<span className="radio">{sel && <Ic.Check s={11} w={3} c="#FFF"/>}</span></div>
                  <div className="sb">{t.sub}</div>
                  <div className="pr"><b>{p}</b><span>{ps}</span></div>
                  <ul>{t.feats.map((f, i) => (
                    <li key={f} className={i === 0 && t.k !== "picture" ? "inh" : ""}><span className="ck"><Ic.Check s={11} w={2.6} c={t.best ? "#5B21B6" : "#166534"}/></span>{f}</li>))}</ul>
                </div>
              </button>
            );
          })}
        </div>
        <div className="price-cta">
          <button className="btn lg" onClick={onStart}>Start your free interview <Ic.Arrow s={16}/></button>
          <p>Every plan starts with the free interview. You choose a plan after you've seen your playback — we'll remember you liked <b style={{ color: "#1A1A1A" }}>{TIERS.find((t) => t.k === tier).name}</b>.</p>
        </div>
        <div className="reassure">
          <span><Ic.Check s={13} w={2.2} c="#166534"/> Free until you choose a plan</span>
          <span><Ic.Shield s={13} c="#78716C"/> 14-day money-back guarantee</span>
          <span><Ic.Help s={13} c="#78716C"/> No hourly billing, ever</span>
        </div>
        <PriceExtras/>
      </main>
    );
  }

  const FAQ = [
    ["basics", "The basics", [
      ["Is Decouple a law firm?", "No. Decouple is a guided settlement workspace. We help you both gather the facts, agree a fair split and prepare the legal documents. A judge approves the final order, and mediators and solicitors are on hand if you want them."],
      ["Is it right for our situation?", "It works best when you can both engage, even if things are tense. If there's a business, a trust or assets overseas, or you're worried about your safety, we'll suggest getting specialist advice alongside or instead."],
      ["How long does it take?", "Most couples finish in about three months. You move at your own pace — nothing is decided until both of you agree."],
    ]],
    ["money", "Money & pricing", [
      ["What does it cost?", "The interview and your first read are free. Your picture is £99 and gets your evidence and numbers ready, including a Form E–style statement for mediation. Guided settlement is £499 and takes the place of mediation; Complete & filed is £999. The two settlement plans cover you both — split it, or one of you pays."],
      ["Are there other costs?", "The court charges its own fee to approve a financial order, paid directly to HMCTS. If you choose to see a mediator or solicitor, they'll charge separately."],
      ["What if we change our minds?", "Every paid plan has a 14-day money-back guarantee."],
    ]],
    ["partner", "Your ex-partner", [
      ["Do we both need to use it?", "To settle, yes. You can start alone and build your picture privately. When you share it, that's what invites your ex-partner in."],
      ["What can they see?", "Only what you choose to share. Your picture stays private until you share it, and you can hold back changes until you're ready."],
      ["What if they won't engage?", "Your picture is still useful — it's the full financial view you'd need anyway. We'll point you to mediation, which is usually the next step."],
    ]],
    ["privacy", "Safety & privacy", [
      ["Is connecting my bank safe?", "We use Tink, an FCA-authorised open banking provider. The connection is read-only — Decouple can see transactions but can never move money."],
      ["What if I don't feel safe?", "Your safety comes first. The interview includes a private check-in and a quick-exit button. If you need support now, the National Domestic Abuse Helpline is free and open 24 hours: 0808 2000 247."],
    ]],
    ["legal", "Legal", [
      ["Is the agreement legally binding?", "It becomes binding once a court approves it as a Consent Order. With Complete & filed, we prepare and file that for you."],
      ["Where can we use Decouple?", "England and Wales. Scotland and Northern Ireland have different rules and aren't covered yet."],
    ]],
  ];

  function Faq({ onStart }) {
    const [open, setOpen] = useState("0-0");
    const [cat, setCat] = useState("all");
    const groups = FAQ.map((g, gi) => [g, gi]).filter(([g]) => cat === "all" || g[0] === cat);
    return (
      <main className="wrap page-pad">
        <div className="kick">Questions</div>
        <h2 className="serif h2">The things people ask <span className="em">before they start.</span></h2>
        <div className="faq-grid">
          <nav className="faq-cats" aria-label="FAQ topics">
            <button className={cat === "all" ? "on" : ""} onClick={() => setCat("all")}>All <span>{FAQ.reduce((n, g) => n + g[2].length, 0)}</span></button>
            {FAQ.map(([k, l, qs]) => <button key={k} className={cat === k ? "on" : ""} onClick={() => setCat(k)}>{l} <span>{qs.length}</span></button>)}
          </nav>
          <div>
            {groups.map(([[k, l, qs], gi]) => (
              <section key={k} className="faq-group">
                <h3>{l}</h3>
                {qs.map(([q, a], qi) => {
                  const id = gi + "-" + qi, o = open === id;
                  return (
                    <div key={id} className={"qa" + (o ? " open" : "")}>
                      <button aria-expanded={o} onClick={() => setOpen(o ? null : id)}>{q}<Ic.Plus s={18} c="#57534E"/></button>
                      <div className="ans"><div><p>{a}</p></div></div>
                    </div>
                  );
                })}
              </section>
            ))}
            <div className="faq-more">
              <span>Still unsure? The interview is free and takes about five minutes.</span>
              <button className="btn" onClick={onStart}>Start your free interview <Ic.Arrow s={14}/></button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  Object.assign(window, { DWhy: Why, DPricing: Pricing, DFaq: Faq });
})();
