/* MVP 04 · Parenting plan: the children, where they live (a two-week pattern), handovers, holidays, decisions, money, then the plan.
   Before the money in the toolkit. Minimised, not hidden, when the guide says there are no children under 18. */
(function () {
  const { useState } = React;
  const K = window.KIT, Ic = window.KIc;
  const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
  const mk = (b) => Array.from({ length: 14 }, (_, i) => (b.includes(i) ? "b" : "a"));
  const PATTERNS = [
    ["eow", "Every other weekend", "Fri and Sat nights, every second week", mk([11, 12])],
    ["eowmid", "Every other weekend, plus a midweek night", "A Wednesday sleepover each week too", mk([2, 9, 11, 12])],
    ["5225", "5-2-2-5", "Same weekdays each week, weekends alternate", mk([2, 3, 9, 10, 11, 12, 13])],
    ["223", "2-2-3", "Short stretches, good for younger children", mk([2, 3, 7, 8, 11, 12, 13])],
    ["wk", "Week on, week off", "Fewer handovers, better for older children", mk([7, 8, 9, 10, 11, 12, 13])],
  ];
  const INC = { a: 28000, b: 52000 };
  const STEPS = [["kids", "The children"], ["live", "Where they live"], ["hand", "Handovers"], ["hol", "Holidays & special days"], ["dec", "Decisions & talking"], ["money", "Money for them"], ["plan", "Your plan"]];
  const DEF = { told: "Partly", views: "", pat: "eowmid", nights: PATTERNS[1][3], where: "At school", time: "6pm", notice: "48 hours", drive: "The parent collecting", summer: "Split in half", xmas: "Alternate years", bday: "Both see them on the day", mfday: true, talk: ["Text"], together: ["Schools", "Health and medical", "Moving further away", "Holidays abroad"], partners: "Agree before introducing them", cm: "Use the Child Maintenance Service rates", cmOwn: "", extras: "Split by income" };

  /* rough child maintenance from the CMS's published rates; under £200 a week, or equal care, sends them to the gov.uk calculator */
  function cms(a) {
    const bN = a.nights.filter((x) => x === "b").length * 26, aN = 364 - bN, n = K.PERSONA.children.length;
    if (bN === aN) return { equal: true, bN };
    const payer = bN < aN ? "b" : "a", nights = Math.min(aN, bN), wk = INC[payer] / 52;
    if (wk < 200) return { low: true, payer, nights };
    const r1 = [0.12, 0.16, 0.19][Math.min(n, 3) - 1], r2 = [0.09, 0.12, 0.15][Math.min(n, 3) - 1];
    let w = Math.min(wk, 800) * r1 + Math.max(0, Math.min(wk, 3000) - 800) * r2;
    const cut = nights >= 175 ? null : nights >= 156 ? 3 / 7 : nights >= 104 ? 2 / 7 : nights >= 52 ? 1 / 7 : 0;
    if (cut === null) return { equal: true, bN };
    return { payer, nights, wk: Math.round(w * (1 - cut)), cut };
  }

  const Chips = ({ v, opts, on, multi }) => <div className="kit-ch">{opts.map((o) => { const sel = multi ? v.includes(o) : v === o; return <button type="button" key={o} className={sel ? "on" : ""} aria-pressed={sel} onClick={() => on(multi ? (sel ? v.filter((x) => x !== o) : [...v, o]) : o)}>{o}</button>; })}</div>;
  const F = ({ l, h, children }) => <div className="pp-f"><b>{l}</b>{h && <small>{h}</small>}{children}</div>;

  function Cal({ nights, onTog, N }) {
    const c = { a: nights.filter((x) => x === "a").length, b: nights.filter((x) => x === "b").length };
    return (
      <div className="pp-cal">
        <div className="hd"><span className="d">{DAYS.map((d, i) => <i key={i}>{d}</i>)}</span></div>
        {[0, 1].map((w) => <div key={w} className="wk"><small>Week {w + 1}</small><div>{nights.slice(w * 7, w * 7 + 7).map((x, i) => <button type="button" key={i} className={x} onClick={() => onTog && onTog(w * 7 + i)} aria-label={`Week ${w + 1}, ${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i]} night: ${x === "a" ? N.me : N.them}`}>{x === "a" ? N.me[0] : N.them[0]}</button>)}</div></div>)}
        <div className="key"><span className="a"><i></i>{N.me} · {c.a} nights</span><span className="b"><i></i>{N.them} · {c.b} nights</span><em>in every two weeks</em></div>
      </div>
    );
  }

  function Step({ id, a, set, N }) {
    const kidsT = K.PERSONA.children.map(([n, age]) => `${n} (${age})`).join(" and ");
    if (id === "kids") return <>
      <div className="pp-kids">{K.PERSONA.children.map(([n, age]) => <div key={n}><span className="av">{n[0]}</span><div><b>{n}</b><small>{age} years old</small></div></div>)}</div>
      <F l="Do they know you’re separating?"><Chips v={a.told} opts={["Yes", "Partly", "Not yet"]} on={(v) => set({ told: v })}/></F>
      <F l="What have they said they’d like?" h="Optional. Older children’s views carry real weight."><textarea value={a.views} onChange={(e) => set({ views: e.target.value })} placeholder="e.g. Ella wants to stay at the same school"></textarea></F>
      <div className="pp-tip"><Ic.Help s={15}/><p>Plans work best when they’re about the children’s week, not about being fair to the two of you. Start from what happens now.</p></div>
    </>;
    if (id === "live") return <>
      <div className="pp-pats">{PATTERNS.map(([k, t, d, n]) => <button type="button" key={k} className={a.pat === k ? "on" : ""} onClick={() => set({ pat: k, nights: n })}><b>{t}</b><small>{d}</small></button>)}<button type="button" className={a.pat === "own" ? "on" : ""} onClick={() => set({ pat: "own" })}><b>Something else</b><small>Tap the nights below to set your own</small></button></div>
      <Cal N={N} nights={a.nights} onTog={(i) => set({ pat: "own", nights: a.nights.map((x, j) => (j === i ? (x === "a" ? "b" : "a") : x)) })}/>
      <div className="pp-tip"><Ic.Help s={15}/><p>A predictable pattern matters more than a perfect one. Younger children usually do better with shorter gaps between seeing each of you.</p></div>
    </>;
    if (id === "hand") return <>
      <F l="Where will handovers happen?"><Chips v={a.where} opts={["At school", "At my home", `At ${N.them}’s home`, "A neutral place"]} on={(v) => set({ where: v })}/></F>
      <F l="Usual time"><input className="pp-in" value={a.time} onChange={(e) => set({ time: e.target.value })} aria-label="Usual handover time"/></F>
      <F l="Who does the driving?"><Chips v={a.drive} opts={["The parent collecting", "The parent dropping off", "Take turns"]} on={(v) => set({ drive: v })}/></F>
      <F l="If plans need to change, how much notice?"><Chips v={a.notice} opts={["24 hours", "48 hours", "A week"]} on={(v) => set({ notice: v })}/></F>
    </>;
    if (id === "hol") return <>
      <F l="Summer holidays"><Chips v={a.summer} opts={["Split in half", "Alternate weeks", "Two weeks each, the rest as usual"]} on={(v) => set({ summer: v })}/></F>
      <F l="Christmas"><Chips v={a.xmas} opts={["Alternate years", "Split the day", "Christmas Eve with one, the Day with the other"]} on={(v) => set({ xmas: v })}/></F>
      <F l="Birthdays"><Chips v={a.bday} opts={["Whoever’s turn it is", "Both see them on the day", "They choose"]} on={(v) => set({ bday: v })}/></F>
      <label className="kit-chk"><input type="checkbox" checked={a.mfday} onChange={(e) => set({ mfday: e.target.checked })}/> Mother’s Day and Father’s Day with that parent</label>
    </>;
    if (id === "dec") return <>
      <F l="How will you talk about the children?" h="Tap any"><Chips multi v={a.talk} opts={["Text", "Email", "A co-parenting app", "In person"]} on={(v) => set({ talk: v })}/></F>
      <F l="What will you decide together?" h="Tap any"><Chips multi v={a.together} opts={["Schools", "Health and medical", "Religion", "Moving further away", "Holidays abroad"]} on={(v) => set({ together: v })}/></F>
      <F l="New partners"><Chips v={a.partners} opts={["Agree before introducing them", "Wait six months", "No rule"]} on={(v) => set({ partners: v })}/></F>
      <window.KitFakeDoor id="coparent"/>
    </>;
    if (id === "money") { const c = cms(a), who = c.payer === "a" ? N.me : N.them, to = c.payer === "a" ? N.them : N.me; return <>
      <div className="pp-cms">
        <span className="lbl">A rough estimate</span>
        {c.equal ? <><b className="serif">Care is shared about equally.</b><p>The Child Maintenance Service’s rules work differently for equal care. Use the gov.uk calculator to see what applies.</p></>
          : c.low ? <><b className="serif">Use the gov.uk calculator.</b><p>At this income, reduced or flat rates may apply.</p></>
          : <><b className="serif">{who} pays {to} about £{c.wk} a week</b><p>For {kidsT}, based on {who}’s income of about £{(INC[c.payer] / 1000).toFixed(0)}k a year before tax, and {c.nights} nights a year with {who}{c.cut ? `, which lowers it by ${Math.round(c.cut * 7)}/7` : ""}.</p></>}
        <a href="https://www.gov.uk/calculate-child-maintenance" target="_blank" rel="noopener">Calculate child maintenance on gov.uk <Ic.Ext s={12}/></a>
      </div>
      <F l="How will you settle it?"><Chips v={a.cm} opts={["Use the Child Maintenance Service rates", "Agree our own amount"]} on={(v) => set({ cm: v })}/></F>
      {a.cm === "Agree our own amount" && <F l="The amount you’ve agreed, per week"><input className="pp-in" value={a.cmOwn} onChange={(e) => set({ cmOwn: e.target.value })} placeholder="£"/></F>}
      <F l="Extras: clubs, school trips, clothes"><Chips v={a.extras} opts={["Split by income", "Split equally", "Whoever has them pays"]} on={(v) => set({ extras: v })}/></F>
    </>; }
    return null;
  }

  function Plan({ a, N, onEdit }) {
    const P = PATTERNS.find((p) => p[0] === a.pat), c = cms(a), [toast, setToast] = useState("");
    const rows = [
      ["The children", K.PERSONA.children.map(([n, age]) => `${n}, ${age}`).join(" · ") + (a.views ? ` · Their views: ${a.views}` : ""), "kids"],
      ["Where they live", `${P ? P[1] : "Our own pattern"}. ${N.me}: ${a.nights.filter((x) => x === "a").length} nights, ${N.them}: ${a.nights.filter((x) => x === "b").length} nights, every two weeks.`, "live"],
      ["Handovers", `${a.where}, usually ${a.time}. ${a.drive} drives. ${a.notice}’ notice for changes.`, "hand"],
      ["Holidays", `Summer: ${a.summer.toLowerCase()}. Christmas: ${a.xmas.toLowerCase()}. Birthdays: ${a.bday.toLowerCase()}.${a.mfday ? " Mother’s and Father’s Day with that parent." : ""}`, "hol"],
      ["Decisions", `We’ll talk by ${a.talk.join(", ").toLowerCase() || "agreement"}. Together we decide: ${a.together.join(", ").toLowerCase() || "nothing listed"}. New partners: ${a.partners.toLowerCase()}.`, "dec"],
      ["Money", (a.cm === "Agree our own amount" && a.cmOwn ? `£${a.cmOwn.replace(/^£/, "")} a week, agreed between us.` : c.wk ? `Child maintenance at the Child Maintenance Service rates, about £${c.wk} a week.` : "Child maintenance at the Child Maintenance Service rates.") + ` Extras: ${a.extras.toLowerCase()}.`, "money"],
    ];
    return (
      <div className="pp-plan">
        <div className="pp-paper">
          <div className="kick">Parenting plan · draft</div>
          <h2 className="serif">For {K.PERSONA.children.map((x) => x[0]).join(" and ")}</h2>
          <p className="sub">Agreed by {N.me} and {N.them}. We’ll look at it again in six months, or sooner if something changes.</p>
          <window.PPCal N={N} nights={a.nights}/>
          {rows.map(([t, d, k]) => <div key={t} className="row"><b>{t}</b><p>{d}</p><button type="button" className="kit-lnk" onClick={() => onEdit(k)}>Change</button></div>)}
          <div className="sig"><div><i></i><small>{N.me}</small></div><div><i></i><small>{N.them}</small></div></div>
        </div>
        <aside className="pp-out">
          <span className="kit-chip done"><Ic.Check s={12} w={2.4}/> Free</span>
          <b className="serif">Your plan is ready.</b>
          <p>Parenting plans aren’t legally binding. They’re what you’ve both agreed. If you can’t agree, a court can make a child arrangements order.</p>
          <button type="button" className="btn full" onClick={() => { setToast("In the real product this downloads a PDF."); K.log("pp-download", "Downloaded the parenting plan", "doc", "pdf", { step: "Plan" }); }}><window.KIc.Doc s={15}/> Download as PDF</button>
          <button type="button" className="btn ghost full" onClick={() => K.home()}>Back to my toolkit</button>
          <window.KitFakeDoor id="coparent" compact/>
        </aside>
        {toast && <div className="kit-toast" onAnimationEnd={() => setToast("")}>{toast}</div>}
      </div>
    );
  }

  Object.assign(window, { PP: { STEPS, DEF, PATTERNS, cms }, PPStep: Step, PPPlan: Plan, PPCal: Cal });
})();
