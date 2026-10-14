/* MVP 06 · Split planner: four decisions on Sarah's figures, a court-reasonableness tag on each and overall, then the agreement summary,
   the paid agreement pack and two fake doors. Tags are illustrative rules, shown with their reasons. Not legal advice. */
(function () {
  const { useState } = React;
  const K = window.KIT, Ic = window.KIc;
  const F = { value: 450000, mort: 205000, penA: 62000, penB: 214000, savJ: 18000, savA: 3200, savB: 9500, debtJ: 4800, debtB: 7200, incA: 28000, incB: 52000 };
  const EQ = F.value - F.mort, SAV = F.savJ + F.savA + F.savB, DEBT = F.debtJ + F.debtB, PEQ = Math.round((100 * (F.penB - F.penA)) / 2 / F.penB);
  const gbp = (n) => (n < 0 ? "−" : "") + "£" + Math.round(Math.abs(n)).toLocaleString("en-GB");
  const k = (n) => "£" + Math.round(n / 1000) + "k";
  const DEF = { home: "sell", homeP: 50, penP: 0, savP: 50, debt: "equal" };
  const TAG = { strong: ["Strong", "#065F46", "#D1FAE5"], ok: ["Reasonable", "#075985", "#E0F2FE"], stretch: ["A stretch", "#92400E", "#FEF3C7"] };

  function calc(d, kids) {
    const N = K.PERSONA, them = N.them, me = N.me;
    const hA = (EQ * d.homeP) / 100, pA = F.penA + (F.penB * d.penP) / 100, pB = F.penB * (1 - d.penP / 100), sA = (SAV * d.savP) / 100;
    const dA = d.debt === "equal" ? DEBT / 2 : d.debt === "own" ? F.debtJ / 2 : DEBT * (F.incA / (F.incA + F.incB));
    const A = hA + pA + sA - dA, B = EQ - hA + pB + (SAV - sA) - (DEBT - dA), T = A + B, s = (100 * A) / T;
    const cap = (inc) => inc * 4.5;
    let home;
    if (d.home === "keepA") { const need = F.mort + EQ * (1 - d.homeP / 100); home = ["stretch", `${me} would need a mortgage of about ${k(need)} on her own. On ${k(F.incA)} a year, lenders usually offer about ${k(cap(F.incA))}.`]; }
    else if (d.home === "keepB") { const need = F.mort + (EQ * d.homeP) / 100; home = need > cap(F.incB) ? ["stretch", `${them} would need about ${k(need)}, more than lenders usually offer on ${k(F.incB)}.`] : [kids ? "ok" : "strong", kids ? `Possible on ${them}’s income, but the children would move home.` : `Possible on ${them}’s income.`]; }
    else if (d.home === "delay") home = d.homeP >= 50 && d.homeP <= 65 ? ["strong", `The children keep their home. ${them}’s share is paid when the house is sold, usually when the youngest turns 18.`] : ["ok", "Delaying the sale keeps the children’s home, but the split you’ve chosen is unusual for this kind of order."];
    else home = !kids ? (d.homeP >= 45 && d.homeP <= 55 ? ["strong", "An equal split of the home is the usual starting point."] : ["ok", "Fine if it balances something else."]) : d.homeP >= 55 ? ["strong", `Leaves ${me}, who the children mostly live with, enough to rehouse them.`] : d.homeP >= 50 ? ["ok", `${me} may struggle to rehouse the children on ${gbp(hA)}.`] : ["stretch", `${gbp(hA)} may not be enough for ${me} to rehouse the children.`];
    const off = d.penP < 20 && d.homeP >= 65;
    const pd = Math.abs(d.penP - PEQ);
    const pen = off ? ["ok", `Offsetting: ${me} takes more of the home instead of a share of ${them}’s pension. Common, but get the pension valued properly first.`] : pd <= 6 ? ["strong", `Close to equalising the pensions built up in the marriage (about ${PEQ}% of ${them}’s).`] : pd <= 15 ? ["ok", `Equalising would mean about ${PEQ}% of ${them}’s pension going to ${me}.`] : ["stretch", d.penP < PEQ ? `${them} keeps far more pension. Equalising would mean about ${PEQ}%.` : `More than equalising, which is about ${PEQ}%.`];
    const sav = d.savP >= 40 && d.savP <= 70 ? ["strong", "Within the usual range."] : (d.savP >= 25 && d.savP <= 85) ? ["ok", "Fine if it balances something else."] : ["stretch", "A very uneven split of the savings."];
    const debt = d.debt === "equal" ? ["ok", "Simple, though it ignores who took the debts on."] : ["strong", d.debt === "own" ? "Each of you keeps the debts in your own name, and shares the joint ones." : "In proportion to what you each earn."];
    const lo = kids ? 52 : 45, hi = kids ? 62 : 55;
    const all = s >= lo && s <= hi ? ["strong", kids ? `Within the range a court would likely see as fair, given the children mostly live with ${me} and she earns less.` : "Close to an equal split, the usual starting point."] : s >= lo - 5 && s <= hi + 6 ? ["ok", s < lo ? `A little light for ${me}, given her housing needs and lower income.` : `A little generous to ${me}.`] : ["stretch", s < lo ? `Likely too little for ${me}’s needs. A court would probably not approve it.` : `Likely more than a court would give ${me}.`];
    return { A, B, T, s, hA, pA, pB, sA, dA, tags: { home, pen, sav, debt, all } };
  }

  const Tag = ({ t }) => { const [l, c, bg] = TAG[t[0]]; return <span className="sp-tag" style={{ color: c, background: bg }}>{l}</span>; };
  const Opt = ({ v, opts, on }) => <div className="sp-opts">{opts.map(([k2, l, d]) => <button type="button" key={k2} className={v === k2 ? "on" : ""} aria-pressed={v === k2} onClick={() => on(k2)}><b>{l}</b>{d && <small>{d}</small>}</button>)}</div>;
  const Slide = ({ v, on, a, b, min = 0, max = 100, label }) => (
    <div className="sp-slide"><div className="ends"><span><b>{a}</b></span><span><b>{b}</b></span></div><input type="range" min={min} max={max} step={1} value={v} onChange={(e) => on(+e.target.value)} aria-label={label} style={{ "--p": ((v - min) / (max - min)) * 100 + "%" }}/></div>
  );

  function Card({ ic, t, sub, tag, children }) {
    const C = Ic[ic];
    return <section className="sp-card"><div className="hd"><span className="ic"><C s={17}/></span><div><h3 className="serif">{t}</h3><small>{sub}</small></div><Tag t={tag}/></div>{children}<p className="why"><Ic.Help s={13}/> {tag[1]}</p></section>;
  }

  function Figures({ onNext }) {
    const N = K.PERSONA;
    const R = [["Family home", `${gbp(F.value)} value, ${gbp(F.mort)} mortgage`, gbp(EQ) + " equity"], [`${N.me}’s workplace pension`, "CETV", gbp(F.penA)], [`${N.them}’s workplace pension`, "CETV", gbp(F.penB)], ["Savings", `Joint ISA ${gbp(F.savJ)}, ${N.me} ${gbp(F.savA)}, ${N.them} ${gbp(F.savB)}`, gbp(SAV)], ["Debts", `Joint card ${gbp(F.debtJ)}, ${N.them}’s car loan ${gbp(F.debtB)}`, "−" + gbp(DEBT)], ["Income", `${N.me} ${k(F.incA)}, ${N.them} ${k(F.incB)} a year`, ""]];
    return (
      <div className="sp-fig">
        <div className="sp-tbl">{R.map(([a, b, c]) => <div key={a}><b>{a}</b><small>{b}</small><span>{c}</span></div>)}<div className="tot"><b>Everything, after debts</b><small></small><span>{gbp(EQ + F.penA + F.penB + SAV - DEBT)}</span></div></div>
        <aside className="sp-figa"><b className="serif">From your financial statement</b><p>These are the agreed figures from {N.me} and {N.them}’s statement. The planner only works as well as they do: if something’s missing, fix it there first.</p><button type="button" className="btn lg full" onClick={onNext}>Start planning <Ic.Arrow s={15}/></button><button type="button" className="kit-lnk" onClick={() => K.open(K.TOOLS.find((t) => t.id === "statement").file)}>Open the statement</button></aside>
      </div>
    );
  }

  function Plan({ d, set, onDone }) {
    const N = K.PERSONA, kids = K.kids(), r = calc(d, kids), [how, setHow] = useState(false);
    const HOME = [["sell", "Sell it, and split the money"], ["keepA", `${N.me} keeps it`, `and buys ${N.them} out`], ["keepB", `${N.them} keeps it`, `and buys ${N.me} out`], kids && ["delay", "Delay the sale", "until Sam is 18"]].filter(Boolean);
    return (
      <div className="sp-cols">
        <div className="sp-list">
          <Card ic="Home" t="The family home" sub={gbp(EQ) + " equity"} tag={r.tags.home}>
            <Opt v={d.home} opts={HOME} on={(v) => set({ home: v })}/>
            <Slide label={`${N.me}’s share of the equity`} v={d.homeP} on={(v) => set({ homeP: v })} a={`${N.me} ${d.homeP}% · ${gbp(r.hA)}`} b={`${N.them} ${100 - d.homeP}% · ${gbp(EQ - r.hA)}`}/>
          </Card>
          <Card ic="Shield" t="Pensions" sub={`${N.me} ${gbp(F.penA)} · ${N.them} ${gbp(F.penB)}`} tag={r.tags.pen}>
            <Slide label={`Share of ${N.them}’s pension to ${N.me}`} v={d.penP} max={60} on={(v) => set({ penP: v })} a={`${d.penP}% of ${N.them}’s to ${N.me}`} b={`${N.me} ${gbp(r.pA)} · ${N.them} ${gbp(r.pB)}`}/>
            <button type="button" className="kit-lnk" onClick={() => set({ penP: PEQ })}>Set to equal ({PEQ}%)</button>
          </Card>
          <Card ic="Bank" t="Savings" sub={gbp(SAV) + " altogether"} tag={r.tags.sav}>
            <Slide label={`${N.me}’s share of the savings`} v={d.savP} on={(v) => set({ savP: v })} a={`${N.me} ${d.savP}% · ${gbp(r.sA)}`} b={`${N.them} ${100 - d.savP}% · ${gbp(SAV - r.sA)}`}/>
          </Card>
          <Card ic="Dash" t="Debts" sub={gbp(DEBT) + " altogether"} tag={r.tags.debt}>
            <Opt v={d.debt} opts={[["equal", "Split equally"], ["own", "Each keeps their own", "and shares the joint ones"], ["income", "In proportion to income"]]} on={(v) => set({ debt: v })}/>
          </Card>
          {kids && <div className="sp-kids"><Ic.Kid s={16}/><div><b>The children</b><p>Arrangements and child maintenance are in your parenting plan, not here.</p></div><button type="button" className="btn ghost sm" onClick={() => K.open(K.TOOLS.find((t) => t.id === "kids").file)}>Open the plan</button></div>}
          <p className="sp-out">Not covered here: maintenance for {N.me} or {N.them} (spousal maintenance). If either of you might need it, get advice.</p>
        </div>
        <aside className="sp-rail">
          <div className="sp-sum">
            <span className="lbl">How it splits</span>
            <div className="bar"><i style={{ width: r.s + "%" }}></i></div>
            <div className="two"><div><small>{N.me}</small><b className="serif">{gbp(r.A)}</b><span>{Math.round(r.s)}%</span></div><div className="b"><small>{N.them}</small><b className="serif">{gbp(r.B)}</b><span>{100 - Math.round(r.s)}%</span></div></div>
            <div className="ov"><Tag t={r.tags.all}/><p>{r.tags.all[1]}</p></div>
            <button type="button" className="btn lg full" onClick={() => onDone(r)}>Write up our agreement <Ic.Arrow s={15}/></button>
            <button type="button" className="kit-lnk" aria-expanded={how} onClick={() => setHow(!how)}>How we work this out</button>
            {how && <p className="how">A court starts from sharing what you built up during the marriage equally, then looks at needs, above all a home for the children. The tags use simple rules on your figures to show roughly where a judge would likely land. They’re a guide, not legal advice, and no substitute for having a solicitor check your agreement.</p>}
          </div>
        </aside>
      </div>
    );
  }

  function Summary({ d, onEdit }) {
    const N = K.PERSONA, kids = K.kids(), r = calc(d, kids);
    const homeT = { sell: `The family home is sold. ${N.me} gets ${d.homeP}% of the money (${gbp(r.hA)}) and ${N.them} gets ${100 - d.homeP}% (${gbp(EQ - r.hA)}).`, keepA: `${N.me} keeps the family home, takes over the mortgage, and pays ${N.them} ${gbp(EQ - r.hA)} for his share.`, keepB: `${N.them} keeps the family home, takes over the mortgage, and pays ${N.me} ${gbp(r.hA)} for her share.`, delay: `${N.me} and the children stay in the family home until Sam is 18. Then it’s sold: ${d.homeP}% to ${N.me}, ${100 - d.homeP}% to ${N.them}.` }[d.home];
    const rows = [["The family home", homeT, r.tags.home], ["Pensions", d.penP ? `${d.penP}% of ${N.them}’s pension is transferred to ${N.me} by a pension sharing order. ${N.me}: ${gbp(r.pA)}, ${N.them}: ${gbp(r.pB)}.` : `You each keep your own pension. ${N.me}: ${gbp(F.penA)}, ${N.them}: ${gbp(F.penB)}.`, r.tags.pen], ["Savings", `${N.me} gets ${gbp(r.sA)} and ${N.them} gets ${gbp(SAV - r.sA)}.`, r.tags.sav], ["Debts", `${N.me} pays ${gbp(r.dA)} and ${N.them} pays ${gbp(DEBT - r.dA)}.`, r.tags.debt]];
    return (
      <>
        <div className="sp-agree">
          <div className="hd"><div><div className="kick">Agreement summary · draft</div><h2 className="serif">{N.me} {gbp(r.A)} · {N.them} {gbp(r.B)}</h2></div><Tag t={r.tags.all}/></div>
          {rows.map(([t, x, tg]) => <div key={t} className="row"><b>{t}</b><p>{x}</p><Tag t={tg}/></div>)}
          <div className="ft"><button type="button" className="btn ghost" onClick={onEdit}><Ic.Back s={14}/> Change something</button><span>Not binding until a judge approves a consent order.</span></div>
        </div>
        <window.KitPay pack="agreement"/>
        <div className="sp-doors"><window.KitFakeDoor id="online"/><window.KitFakeDoor id="file"/></div>
      </>
    );
  }

  Object.assign(window, { SP: { DEF, calc, F }, SPFigures: Figures, SPPlan: Plan, SPSummary: Summary });
})();
