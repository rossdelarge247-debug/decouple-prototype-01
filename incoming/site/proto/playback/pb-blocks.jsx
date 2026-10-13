/* Playback — content blocks */
(function () {
  const { useState, useEffect } = React;
  const Ic = window.DIc, PB = window.PB, IV = window.IV;
  const pos = (x) => ((Math.max(20, Math.min(80, x)) - 20) / 60) * 100;

  function Range({ a, r, w, setW, compact }) {
    const N = r.N;
    const toggles = [
      r.owned && ["keepHome", `${N.hasMe ? N.Me : "I"} keep${N.hasMe ? "s" : ""} the family home`],
      !r.cohab && r.pensions > 0 && ["noPensions", "Leave pensions out"],
      !r.cohab && r.maint !== undefined && a.inc_them && a.inc_me && PB.compute(a, { maintenance: true }).maint && ["maintenance", "Maintenance instead of a bigger share"],
    ].filter(Boolean);
    const out = w.keepHome ? `Keeping the home (about ${PB.gbpK(r.equity)} of equity) usually means taking less of the savings and pensions.`
      : w.noPensions ? `Without pensions the pot drops to about ${PB.gbpK(r.pot)} — and one of you is likely to be left short in retirement.`
      : w.maintenance && r.maint ? `Around £${r.maint.toLocaleString("en-GB")}/mo maintenance usually means a smaller share of capital.` : "";
    return (
      <div className="card" style={{ "--c": "#4338CA" }}>
        <div className="card-k"><Ic.Spark s={14}/><span>{compact ? "For reference · your likely range" : "Your likely settlement range"}</span></div>
        <div className="card-t">{r.cohab ? <>Based on who owns what, <b>{r.lo}–{r.hi}% to {N.me}</b> looks likely.</> : <>A court would likely see <b>{r.lo}–{r.hi}% to {N.me}</b> as reasonable.</>}</div>
        <div className="rbar" aria-label={`Range ${r.lo} to ${r.hi} percent`}>
          <div className="base"></div>
          <div className="half"><span>50 / 50</span></div>
          <div className="rng" style={{ left: pos(r.lo) + "%", width: pos(r.hi) - pos(r.lo) + "%" }}></div>
          <div className="you" style={{ left: pos(r.mid) + "%" }}><span>{`${N.hasMe ? N.Me : "You"} · ~${r.mid}%`}</span></div>
          <div className="ticks"><span>20%</span><span>80%</span></div>
        </div>
        <div className="stats">
          <div className="stat"><small>Estimated pot</small><b>{r.pot ? PB.gbpK(r.pot) : "—"}</b><em>{w.noPensions ? "excluding pensions" : r.cohab ? "joint assets only" : "after debts"}</em></div>
          <div className="stat"><small>{N.hasMe ? N.Me + "'s" : "Your"} likely share</small><b>{r.pot ? `${PB.gbpK(r.potLo)}–${PB.gbpK(r.potHi)}` : "—"}</b><em>{r.lo}–{r.hi}%</em></div>
          <div className="stat"><small>Pension to balance</small><b>{r.cohab ? "n/a" : r.penGap == null ? "Not sure yet" : r.penGap > 25e3 ? "Yes" : r.penGap < -25e3 ? "Yes, other way" : "Roughly even"}</b><em>{r.penGap && Math.abs(r.penGap) > 25e3 ? `~${PB.gbpK(Math.abs(r.penGap))} gap` : "\u00a0"}</em></div>
        </div>
        {!compact && r.why.length > 0 && <ul className="why">{r.why.map((x) => <li key={x}>{x}</li>)}</ul>}
        {!compact && toggles.length > 0 && (
          <div className="wif">
            <div className="wif-h"><Ic.Help s={13}/> What if…</div>
            <div className="wif-row">{toggles.map(([k, l]) => (
              <button key={k} className={"wif-t" + (w[k] ? " on" : "")} aria-pressed={!!w[k]} onClick={() => setW({ ...w, [k]: !w[k] })}><span className="sw"></span>{l}</button>))}</div>
            <div className="wif-out">{out}</div>
          </div>
        )}
        <div className="disc"><Ic.Help s={13}/><span>An indicative range based on what {N.hasMe ? N.me : "you"} told us — not legal advice. Exact figures come once accounts are connected.</span></div>
      </div>
    );
  }

  function Options({ a, r, w, setW }) {
    const [show, setShow] = useState(false);
    const hl = a.help_now === "talk" ? 0 : a.help_now === "steps" || a.help_now === "options" ? 1 : 2;
    const O = [
      ["Stay and work on it", "Couples counselling can help you both decide, with no pressure either way.", "Relate and similar services"],
      ["Separate informally", "Live apart and agree the basics in a separation agreement. You can make it formal later.", "Decouple can help you draft it"],
      ["Separate formally", "Divorce or dissolution, plus a financial order so it's legally binding and final.", "The full Decouple route"],
    ];
    return (
      <>
        <div className="card">
          <div className="card-k"><Ic.Spark s={14}/>Your options</div>
          <div className="card-t">There's no rush. Here are the three routes most people weigh up.</div>
          <div className="opts3">{O.map(([t, d, who], i) => <div key={t} className={"opt3" + (i === hl ? " hl" : "")}><div className="n">0{i + 1}{i === hl ? " · closest to what you asked" : ""}</div><h4>{t}</h4><p>{d}</p><div className="who">{who}</div></div>)}</div>
          {!show && <div className="reveal"><button className="link" onClick={() => setShow(true)}>Show me a rough range anyway <Ic.Down s={13}/></button></div>}
        </div>
        {show && <Range a={a} r={r} w={w} setW={setW}/>}
      </>
    );
  }

  function Fairness({ a, r }) {
    const f = PB.fairness(a, r);
    const flagged = f.filter((x) => !x.ok).length;
    return (
      <div className="card" style={{ "--c": "#166534" }}>
        <div className="card-k"><Ic.Check s={14} w={2.4}/>Fairness check</div>
        <div className="card-t">{f.length ? (flagged ? <>Most of it looks fair. <b style={{ color: "#92400E" }}>{flagged} thing{flagged > 1 ? "s" : ""} worth a second look.</b></> : <>What you've agreed <b>looks within the usual range.</b></>) : "Tell us what you've agreed and we'll check it."}</div>
        <p className="card-p">A judge has to approve your agreement as fair. These are the things they'd look at first.</p>
        <div className="fair">{f.map((x) => (
          <div key={x.k} className={"fair-row" + (x.ok ? "" : " chk")}>
            <span className="ic">{x.ok ? <Ic.Check s={12} w={2.6} c="#166534"/> : <Ic.Help s={13} c="#92400E"/>}</span>
            <div><b>{x.t}</b><p>{x.note}</p></div><span className="tag">{x.ok ? "Looks fair" : "Check this"}</span>
          </div>))}</div>
      </div>
    );
  }

  function Path({ a, r }) {
    const s = PB.path(a, r), hard = a.comms === "hard", agreed = a.stage === "agreed";
    return (
      <div className="card" style={{ "--c": "#5B21B6" }}>
        <div className="card-k"><Ic.Spark s={14}/><span>{`${a.stage === "considering" ? "If you decide to go ahead" : "Your path"} · ${agreed ? "about 6 weeks" : hard ? "about 14 weeks" : "about 3 months"}`}</span></div>
        {hard && <p className="card-p" style={{ marginTop: 0, marginBottom: 4 }}>Because talking is very hard right now, your path starts with mediation.</p>}
        <div className="pth">{s.map((x, i) => (
          <div key={x.t}><span className="n" style={{ background: x.c + "16", color: x.c }}>{String(i + 1).padStart(2, "0")}</span><h4>{x.t}</h4><div className="w" style={{ color: x.c }}>{x.w}</div><p>{x.d}</p></div>))}</div>
      </div>
    );
  }

  function Watch({ a, r, w }) {
    const items = PB.watch(a, r, w);
    if (!items.length) return null;
    return (
      <div>
        <div className="card-k" style={{ margin: "8px 0 12px 4px" }}>Things to watch</div>
        <div className="watch">{items.map(([t, d, c]) => <div key={t} className="wcard"><div className="ic" style={{ background: c + "14" }}><Ic.Shield s={18} c={c}/></div><h4>{t}</h4><p>{d}</p></div>)}</div>
      </div>
    );
  }

  function Partner({ a, r }) {
    const q = PB.partner(a, r);
    return (
      <div className="card" style={{ "--c": "#0369A1" }}>
        <div className="card-k"><Ic.Help s={14}/><span>{`What ${r.N.them} may say`}</span></div>
        <div className="card-t">Going in prepared makes the hard conversations shorter.</div>
        <div className="quotes">{q.map(([s, resp]) => <div key={s} className="quote"><q>{s}</q><div className="resp"><b>How to think about it</b>{resp}</div></div>)}</div>
      </div>
    );
  }

  function Parenting({ a, r }) {
    const J = window.Journey, N = r.N;
    const sug = PB.suggestPattern(a);
    const saved = (J.get().playback || {}).parenting || {};
    const [pid, setPid] = useState(saved.id || sug);
    const [days, setDays] = useState(saved.days || PB.PATTERNS.find((p) => p.id === (saved.id || sug)).days.split(""));
    const [swap, setSwap] = useState(!!saved.swap);
    useEffect(() => { J.set("playback", { parenting: { id: pid, days, swap } }); }, [pid, days, swap]);
    const pat = PB.PATTERNS.find((p) => p.id === pid);
    const custom = !pat || pat.days !== days.join("");
    const pick = (p) => { setPid(p.id); setDays(p.days.split("")); };
    const flip = (i) => setDays(days.map((d, j) => (j === i ? (d === "A" ? "B" : "A") : d)));
    /* who is A? for "main home" patterns, the parent the children mostly live with */
    const meFirst = (pat && pat.g === "main" ? a.kids_live !== "them" : true) !== swap;
    const P = { A: meFirst ? "me" : "them", B: meFirst ? "them" : "me" };
    const nm = (k) => (k === "me" ? N.Me : N.Them), ini = (k) => (k === "me" ? (N.hasMe ? N.Me[0].toUpperCase() : "Y") : (N.hasThem ? N.Them[0].toUpperCase() : "P"));
    const col = { me: ["#F3EEFE", "#5B21B6"], them: ["#E0F2FE", "#0369A1"] };
    const st = PB.parentingStats(days), meN = P.A === "me" ? st.A : st.B, thN = 14 - meN;
    const young = (a.ages || []).includes("u5");
    const Group = ({ g, label }) => (
      <div className="pp-g"><div className="pp-gl">{label}</div><div className="pp-chips">{PB.PATTERNS.filter((p) => p.g === g).map((p) => (
        <button key={p.id} className={"pp-chip" + (pid === p.id && !custom ? " on" : "")} aria-pressed={pid === p.id && !custom} onClick={() => pick(p)}>{p.name}{p.id === sug && <em>Suggested</em>}</button>))}</div></div>
    );
    return (
      <div className="card" style={{ "--c": "#9D174D" }}>
        <div className="card-k"><Ic.Kid s={14}/><span>A parenting-plan starter</span></div>
        <div className="card-t">{custom ? "Your own pattern" : pat.name}</div>
        <p className="card-p">We've suggested a pattern from where the children live now{a.ages && a.ages.length ? " and their ages" : ""}. Pick another common arrangement, or tap any night to make it yours.</p>
        <div className="pp-pick"><Group g="equal" label="Shared equally"/><Group g="main" label="Mainly with one of you"/></div>
        <div className="pp-cal">
          {[0, 1].map((wk) => (
            <div key={wk} className="pp-wk"><span className="pp-wl">Week {wk + 1}</span>
              <div className="wk">{days.slice(wk * 7, wk * 7 + 7).map((d, i) => { const k = P[d], idx = wk * 7 + i; return (
                <button key={idx} className="pp-day" style={{ background: col[k][0], color: col[k][1] }} aria-label={`${"Mon Tue Wed Thu Fri Sat Sun".split(" ")[i]} night week ${wk + 1}: ${nm(k)}. Tap to switch.`} onClick={() => flip(idx)}><small>{"MTWTFSS"[i]}</small>{ini(k)}</button>); })}</div>
            </div>))}
        </div>
        <div className="pp-stats">
          <span><i style={{ background: "#5B21B6" }}></i><span>{`${N.Me} · ${meN} nights`}</span></span>
          <span><i style={{ background: "#0369A1" }}></i><span>{`${N.Them} · ${thN} nights`}</span></span>
          <span className="tab">{`${Math.round((meN / 14) * 100)}/${Math.round((thN / 14) * 100)} split`}</span>
          <span className="tab">{`${st.handovers} handovers a fortnight`}</span>
        </div>
        <div className="pp-acts">
          {pat && pat.g === "main" && <button className="link" onClick={() => setSwap(!swap)}>Swap who has the children most</button>}
          {custom && pat && <button className="link" onClick={() => pick(pat)}>Reset to {pat.name}</button>}
        </div>
        {!custom && pat && (
          <div className="pp-help">
            <div><b>How it works</b><p>{pat.how}</p></div>
            <div><b>Works well when</b><p>{pat.good}</p></div>
            <div><b>Watch out</b><p>{pat.watch}</p></div>
          </div>
        )}
        {custom && <div className="pp-help one"><div><b>Making it your own</b><p>{st.handovers > 6 ? "That's a lot of handovers. Fewer, longer blocks are usually easier on everyone — especially if talking is tense." : "Looks workable. Think about where school runs and clubs fall, and keep the pattern predictable."}</p></div></div>}
        {young && <p className="card-p" style={{ fontSize: 12.5 }}>With a child under 5, shorter and more frequent time with each of you usually works better than long stretches apart.</p>}
        <div className="pq">{["School runs", "Holidays & birthdays", "Big decisions", "New partners", "Moving house"].map((t) => <span key={t}>{t}</span>)}</div>
      </div>
    );
  }

  const HEARD = ["status", "years", "kids", "kids_live", "home", "home_value", "mortgage", "inc_me", "inc_them", "savings", "pen_me", "pen_them", "debt_total", "comms"];
  function Heard({ a, onChange }) {
    const [ed, setEd] = useState(null);
    const [flash, setFlash] = useState(null);
    const rows = HEARD.map((id) => IV.Q.find((q) => q.id === id)).filter((q) => q && IV.qWhen(q, a) && (!q.sec || IV.activeSections(a).some((s) => s.id === q.sec)));
    return (
      <div className="heard">
        <div className="heard-h"><b>What we heard</b><span>Tap to change</span></div>
        {rows.map((q) => {
          const opts = IV.optsOf(q).concat(q.skip ? [["__skip", q.skip]] : []);
          const lbl = (typeof q.label === "function" ? q.label(a) : q.label) || q.id;
          return (
            <div key={q.id} className={"hrow" + (flash === q.id ? " flash" : "")}>
              <div className="top"><span className="k">{lbl.replace(/\?$/, "")}</span><span className="v">{IV.valLabel(q.id, a) || "—"}</span><button className="ed" aria-expanded={ed === q.id} onClick={() => setEd(ed === q.id ? null : q.id)}>{ed === q.id ? "Done" : "Change"}</button></div>
              {ed === q.id && <div className="hopts">{opts.map(([k, l]) => <button key={k} className={a[q.id] === k ? "on" : ""} onClick={() => { onChange(q.id, k); setFlash(q.id); setTimeout(() => setFlash(null), 900); }}>{l}</button>)}</div>}
            </div>);
        })}
      </div>
    );
  }

  Object.assign(window, { PBRange: Range, PBOptions: Options, PBFairness: Fairness, PBPath: Path, PBWatch: Watch, PBPartner: Partner, PBParenting: Parenting, PBHeard: Heard });
})();
