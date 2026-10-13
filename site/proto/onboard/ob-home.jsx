/* Onboard — zero-data dashboard: one hero (connect a bank) + one ordered list of next steps */
(function () {
  const { useState } = React;
  const Ic = window.DIc, J = window.Journey;

  const ACCT = {
    cur: { n: "Current account", t: "Current", m: "4821", b: 2340.12, o: "Sole" },
    joint: { n: "Joint account", t: "Current", m: "7730", b: 1186.4, o: "Joint" },
    sav: { n: "Instant saver", t: "Savings", m: "1290", b: 8420, o: "Sole" },
    stmt: { n: "Statements (PDF)", t: "Current", m: "—", b: 1912.55, o: "Sole" },
  };
  const gbp = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function rows(banks) {
    return banks.flatMap((bk, bi) => (bk.list || ["cur", "joint", "sav"].slice(0, Math.max(1, bk.accounts || 1))).map((k) => {
      const a = ACCT[k] || ACCT.cur, f = 1 + bi * 0.37;
      return { ...a, key: bk.id + k, bank: bk.name, color: bk.color, bal: Math.round(a.b * f * 100) / 100 };
    }));
  }
  function Accounts({ banks, them }) {
    const r = rows(banks), tot = r.reduce((n, x) => n + x.bal, 0), joint = r.filter((x) => x.o === "Joint").reduce((n, x) => n + x.bal, 0);
    return (
      <div className="acc-sum">
        <div className="acc-head"><span>{`${r.length} account${r.length > 1 ? "s" : ""}`}</span><span className="tab">{gbp(tot)}<small>total balance</small></span></div>
        <div className="acc-list">{r.map((x) => (
          <div className="acc-row" key={x.key}>
            <i style={{ background: x.color }}>{x.bank[0].toUpperCase()}</i>
            <span className="acc-n">{x.n}<small>{x.m === "—" ? `${x.bank} · balance at last statement` : `${x.bank} · ••${x.m}`}</small></span>
            <span className="acc-tags"><em>{x.t}</em>{x.o === "Joint" && <em className="j">{`Joint with ${them}`}</em>}</span>
            <span className="acc-b tab">{gbp(x.bal)}</span>
          </div>))}</div>
        {joint > 0 && <div className="acc-note"><Ic.Help s={13} style={{ flexShrink: 0, marginTop: 1 }}/><span>{`Joint balances (${gbp(joint)}) are usually treated as shared — we'll show them as half each in your picture.`}</span></div>}
      </div>
    );
  }

  function BankHero({ banks, onOpen, snoozed, setSnoozed, them }) {
    if (banks.length) {
      const tx = banks.reduce((n, b) => n + b.tx, 0);
      return (
        <div className="hero-bank done" data-tip="bank">
          <div className="hb-k"><Ic.Check s={13} w={2.6}/><span>Bank connected</span></div>
          <h2 className="hb-h">Your picture is being drafted.</h2>
          <p className="hb-p">{`${tx.toLocaleString("en-GB")} transactions sorted. Next, we'll walk you through what we found — a few quick questions, one at a time.`}</p>
          <Accounts banks={banks} them={them || "your partner"}/>
          <div className="hb-acts"><button className="btn lg" onClick={() => J.goStage("prepare")}>Go to your picture <Ic.Arrow s={15}/></button><button className="btn lg ghost" onClick={() => onOpen(null)}><Ic.Plus s={14}/> Add another account</button></div>
        </div>
      );
    }
    if (snoozed) return (
      <div className="hb-slim"><Ic.Bank s={16} c="#5B21B6"/><span><b>Connect a bank</b> whenever you're ready — your picture fills itself in.</span><button className="btn sm v" onClick={() => setSnoozed(false)}>Connect now</button></div>
    );
    return (
      <div className="hero-bank" data-tip="bank">
        <div className="hb-k"><span>Start here · step 1</span></div>
        <h2 className="hb-h">Connect your first bank.</h2>
        <p className="hb-p">It's the single biggest step. Decouple reads twelve months of history and drafts your private picture for you — no statements to dig out.</p>
        <div className="hb-why">
          <div><Ic.Check s={14} w={2.4} c="#166534"/><span>Real figures, not estimates</span></div>
          <div><Ic.Check s={14} w={2.4} c="#166534"/><span>Most of your evidence, gathered for you</span></div>
          <div><Ic.Check s={14} w={2.4} c="#166534"/><span>About a minute</span></div>
        </div>
        <div className="hb-cta"><button className="btn lg v" onClick={() => onOpen(null)}>Connect now <Ic.Arrow s={15}/></button><span>Opens a secure window from Tink, our open banking partner. Pick your bank there.</span></div>
        <div className="hb-trust"><span><Ic.Lock s={12}/> Read-only — we can't move money</span><span><Ic.Shield s={12}/> Through Tink, authorised by the FCA</span><span>Disconnect any time</span></div>
        <div className="hb-alt"><button onClick={() => onOpen("upload")}>Upload statements instead</button><button onClick={() => setSnoozed(true)}>Not now</button></div>
      </div>
    );
  }

  function NextSteps({ items, done, mark }) {
    const [open, setOpen] = useState(null), [showDone, setShowDone] = useState(false);
    const todo = items.filter((it) => !done[it.k]), fin = items.filter((it) => done[it.k]);
    const Row = (it, idx) => {
      const d = !!done[it.k], o = open === it.k;
      return (
        <div key={it.k} className={"ns" + (d ? " done" : "")}>
          <button className="ns-ck" aria-label={d ? "Mark not done" : "Mark done"} onClick={() => mark(it.k, !d)}>{d ? <Ic.Check s={12} w={3} c="#FFF"/> : <span>{idx + 1}</span>}</button>
          <div className="ns-tx">
            <div className="ns-l"><span>{it.l}</span>{it.out && <em className="ns-out">Outside Decouple</em>}{it.optional && <em className="ns-opt">Optional</em>}</div>
            <div className="ns-d">{it.d}</div>
            {o && it.help && <div className="ns-help">{it.help}</div>}
          </div>
          {!d && <div className="ns-act">{it.help ? <button className="btn sm ghost" aria-expanded={o} onClick={() => setOpen(o ? null : it.k)}>{o ? "Close" : it.btn}</button> : <button className="btn sm ghost" onClick={it.act}>{it.btn}</button>}</div>}
        </div>
      );
    };
    return (
      <div className="steps-card" data-tip="steps">
        <div className="sc-h"><h3>{todo.length ? "Then, in this order" : "All done for now"}</h3><span className="tab">{`${fin.length} of ${items.length} done`}</span></div>
        <div className="ns-list">{todo.map((it, i) => Row(it, i))}</div>
        {fin.length > 0 && <>
          <button className="ns-done-t" aria-expanded={showDone} onClick={() => setShowDone(!showDone)}>{`${showDone ? "Hide" : "Show"} done (${fin.length})`}</button>
          {showDone && <div className="ns-list">{fin.map((it, i) => Row(it, i))}</div>}
        </>}
      </div>
    );
  }

  Object.assign(window, { OBBankHero: BankHero, OBNextSteps: NextSteps });
})();
