/* Onboard — bank-connect flow. Decouple consent screen → Tink Link pop-up (simulated: choose bank, approve, pick accounts) → import → done. */
(function () {
  const { useState, useEffect } = React;
  const Ic = window.DIc;
  const BANKS = [
    ["barclays", "Barclays", "#00395D"], ["hsbc", "HSBC", "#B91C1C"], ["lloyds", "Lloyds", "#065F46"], ["natwest", "NatWest", "#4C1D95"],
    ["santander", "Santander", "#C2410C"], ["nationwide", "Nationwide", "#1E3A8A"], ["halifax", "Halifax", "#1D4ED8"], ["monzo", "Monzo", "#0F172A"],
    ["starling", "Starling", "#0F766E"], ["firstdirect", "first direct", "#111827"],
  ];
  const CATS = [["Salary", "#047857", "#D1FAE5"], ["Mortgage", "#0369A1", "#E0F2FE"], ["Groceries", "#57534E", "#F2EFEA"], ["Utilities", "#57534E", "#F2EFEA"], ["Childcare", "#9D174D", "#FCE7F3"], ["Savings & ISAs", "#4338CA", "#EEF2FF"], ["Pension contributions", "#4338CA", "#EEF2FF"], ["Car finance", "#92400E", "#FEF3C7"], ["Credit card", "#92400E", "#FEF3C7"], ["Transfers to partner", "#5B21B6", "#F3EEFE"], ["Council tax", "#57534E", "#F2EFEA"], ["Subscriptions", "#57534E", "#F2EFEA"]];

  /* simulated Tink Link window */
  function TinkLink({ connected, them, onDone, onCancel, onFail }) {
    const [st, setSt] = useState("select"), [q, setQ] = useState(""), [bank, setBank] = useState(null);
    const [accs, setAccs] = useState({ cur: true, joint: true, sav: true });
    useEffect(() => { if (st === "redirect") { const t = setTimeout(() => setSt("auth"), 1100); return () => clearTimeout(t); } }, [st]);
    const list = BANKS.filter((b) => b[1].toLowerCase().includes(q.toLowerCase()));
    const n = Object.values(accs).filter(Boolean).length;
    return (
      <div className="tink-scrim">
        <div className="tink" role="dialog" aria-modal="true" aria-label="Tink — connect your bank">
          <div className="tink-bar"><span className="tink-logo">tink</span><span className="tink-sec"><Ic.Lock s={11}/> Secure connection</span><button aria-label="Close" onClick={onCancel}><Ic.X s={15}/></button></div>
          <div className="tink-in">
            {st === "select" && <>
              <div className="tink-h">Select your bank</div>
              <input className="search" placeholder="Search for your bank" value={q} autoFocus onChange={(e) => setQ(e.target.value)}/>
              <div className="tink-list">{list.map((b) => { const c = connected.some((x) => x.id === b[0]); return (
                <button key={b[0]} disabled={c} onClick={() => { setBank(b); setSt("redirect"); }}><span className="lg" style={{ background: b[2] }}>{b[1][0].toUpperCase()}</span>{b[1]}{c ? <small>Connected</small> : <Ic.Arrow s={13} style={{ marginLeft: "auto" }}/>}</button>); })}</div>
              {!list.length && <p className="tink-p">No banks match "{q}".</p>}
            </>}
            {st === "redirect" && <div className="tink-wait"><span className="spin" style={{ borderColor: "#E5E3DC", borderTopColor: "#111", width: 26, height: 26 }}></span><div className="tink-h" style={{ marginTop: 16 }}>Opening {bank[1]}…</div><p className="tink-p">Log in with your banking app or details to approve.</p></div>}
            {st === "auth" && <>
              <div className="tink-bank" style={{ background: bank[2] }}>{bank[1]}</div>
              <div className="tink-h">Approve access</div>
              <p className="tink-p">Share read-only account information with <b>Decouple</b> via Tink for 90 days.</p>
              <div className="tink-h sm">Choose accounts</div>
              <div className="tink-accs">{[["cur", "Current account", "••4821"], ["joint", "Joint account", `••7730 · shared with ${them}`], ["sav", "Instant saver", "••1290"]].map(([k, l, s]) => (
                <label key={k}><input type="checkbox" checked={accs[k]} onChange={(e) => setAccs({ ...accs, [k]: e.target.checked })}/><span>{l}<small>{s}</small></span></label>))}</div>
              <button className="tink-btn" disabled={!n} onClick={() => onDone(bank, Object.keys(accs).filter((k) => accs[k]))}>Approve</button>
              <button className="tink-ghost" onClick={onCancel}>Cancel</button>
              <div className="redirect" style={{ justifyContent: "center" }}>Simulated Tink window · <button className="proto-mini" onClick={() => onFail(bank)}>simulate a failure</button></div>
            </>}
          </div>
          <div className="tink-foot">Tink is an open banking provider authorised by the FCA. Decouple never sees your login details.</div>
        </div>
      </div>
    );
  }

  function BankFlow({ connected, onConnected, onClose, them, initial }) {
    const [step, setStep] = useState(initial === "upload" ? "upload" : connected.length ? "tink" : "consent");
    const [ok, setOk] = useState(connected.length > 0);
    const [bank, setBank] = useState(null), [n, setN] = useState(0), [pct, setPct] = useState(0);
    const [files, setFiles] = useState([]), [why, setWhy] = useState(""), [sel, setSel] = useState([]);
    useEffect(() => { const k = (e) => e.key === "Escape" && step !== "tink" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [step]);
    useEffect(() => {
      if (step !== "import") return;
      if (pct >= 100) { onConnected({ id: bank[0], name: bank[1], color: bank[2], accounts: n, tx: 412 * n + 48, list: sel }); setStep("done"); return; }
      const t = setTimeout(() => setPct(Math.min(100, pct + 4)), 110); return () => clearTimeout(t);
    }, [step, pct]);
    const shown = CATS.slice(0, Math.floor((pct / 100) * CATS.length));
    let body;
    if (step === "consent" || step === "tink") body = (
      <>
        <div className="step-k">CONNECT YOUR BANK</div>
        <h3>What Decouple will see</h3>
        <div className="perm">
          <div><Ic.Check s={15} w={2.4} c="#166534" style={{ flexShrink: 0, marginTop: 2 }}/><span>Account names and balances<small>So your picture shows what you actually have</small></span></div>
          <div><Ic.Check s={15} w={2.4} c="#166534" style={{ flexShrink: 0, marginTop: 2 }}/><span>12 months of transactions<small>Sorted into income, outgoings and transfers for you</small></span></div>
          <div><Ic.Lock s={15} c="#5B21B6" style={{ flexShrink: 0, marginTop: 2 }}/><span>Read-only — we can never move money<small>Disconnect at any time from your settings</small></span></div>
        </div>
        <div className="mwarn" style={{ marginTop: 14 }}><Ic.Shield s={14} style={{ flexShrink: 0, marginTop: 2 }}/><span><b>Joint accounts:</b> if you connect an account you share with {them}, the bank may show them that Decouple has access. You can leave joint accounts out in the next step.</span></div>
        <label className="chk"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)}/>I agree to share this information with Decouple for 90 days, through Tink.</label>
        <div className="mrow"><button className="btn lg" disabled={!ok} onClick={() => setStep("tink")}>Connect now <Ic.Arrow s={15}/></button><button className="lnk" onClick={() => setStep("upload")}>Upload statements instead</button></div>
      </>
    );
    if (step === "import") body = (
      <>
        <div className="step-k">IMPORTING</div>
        <h3>Reading 12 months from {bank[1]}…</h3>
        <p>We're sorting every transaction. You can close this — it carries on in the background.</p>
        <div className="imp"><div className="bar"><i style={{ width: pct + "%" }}></i></div><div className="cnt"><span>{`${Math.round((pct / 100) * (412 * n + 48)).toLocaleString("en-GB")} transactions`}</span><span>{`${pct}%`}</span></div></div>
        <div className="cats">{shown.map(([l, c, bg]) => <span key={l} style={{ color: c, background: bg }}>{l}</span>)}</div>
      </>
    );
    if (step === "done") { const c = connected.find((x) => x.id === bank[0]) || {}; body = (
      <>
        <div className="mail-ill" style={{ background: "#D1FAE5" }}><Ic.Check s={26} w={2.6} c="#166534"/></div>
        <h3 style={{ textAlign: "center" }}>{`${bank[1]} connected.`}</h3>
        <p style={{ textAlign: "center" }}>{`${c.accounts || n} account${(c.accounts || n) > 1 ? "s" : ""} · ${(c.tx || 0).toLocaleString("en-GB")} transactions sorted into ${CATS.length} categories.`}</p>
        <div className="perm">{connected.map((x) => <div key={x.id}><span style={{ background: x.color, width: 24, height: 24, borderRadius: 7, color: "#FFF", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{x.name[0].toUpperCase()}</span><span>{x.name}<small>{`${x.accounts} accounts · synced just now`}</small></span></div>)}</div>
        <div className="mrow" style={{ justifyContent: "center" }}><button className="btn lg" onClick={onClose}>Done <Ic.Arrow s={15}/></button><button className="btn lg ghost" onClick={() => setStep("tink")}><Ic.Plus s={14}/> Add another account</button></div>
      </>
    ); }
    if (step === "fail") body = (
      <>
        <div className="step-k">CONNECT YOUR BANK</div>
        <h3>{why === "cancelled" ? "Connection cancelled" : `We couldn't connect to ${bank ? bank[1] : "your bank"}`}</h3>
        <div className="fail"><Ic.Help s={16} style={{ flexShrink: 0, marginTop: 2 }}/><span>{why === "cancelled" ? "No problem — nothing was shared. You can try again, or upload statements instead." : "The bank didn't respond in time. This is usually temporary. Nothing was shared."}</span></div>
        <div className="mrow"><button className="btn lg" onClick={() => setStep("tink")}>Try again</button><button className="btn lg ghost" onClick={() => setStep("upload")}>Upload statements instead</button></div>
      </>
    );
    if (step === "upload") body = (
      <>
        <div className="step-k">UPLOAD STATEMENTS</div>
        <h3>Upload your bank statements</h3>
        <p>PDFs or CSVs covering the last 12 months. We'll read and sort them the same way.</p>
        <button className="drop" style={{ width: "100%", font: "inherit" }} onClick={() => setFiles([...files, `Statement_${["Apr", "May", "Jun", "Jul", "Aug", "Sep"][files.length % 6]}_2026.pdf`])}>
          <Ic.Plus s={20} c="#5B21B6"/><div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>Drop files here, or tap to choose</div><div style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}>PDF or CSV · up to 20MB each</div>
        </button>
        {files.length > 0 && <div className="files">{files.map((f, i) => <div key={i}><Ic.Check s={13} w={2.6} c="#166534"/>{f}<small>Reading…</small></div>)}</div>}
        <div className="mrow"><button className="btn lg" disabled={!files.length} onClick={() => { onConnected({ id: "upload-" + Date.now(), name: "Uploaded statements", color: "#57534E", accounts: 1, tx: files.length * 70, upload: true, list: ["stmt"] }); onClose(); }}>Use these statements <Ic.Arrow s={15}/></button><button className="lnk" onClick={() => setStep("consent")}>Connect a bank instead</button></div>
      </>
    );
    return (
      <div className="mscrim" onClick={(e) => e.target === e.currentTarget && step !== "import" && step !== "tink" && onClose()}>
        <div className="mbox wide" role="dialog" aria-modal="true" aria-label="Connect a bank">
          {step !== "import" && <button className="mx" aria-label="Close" onClick={onClose}><Ic.X s={16}/></button>}
          {body}
        </div>
        {step === "tink" && <TinkLink connected={connected} them={them}
          onDone={(b, k) => { setBank(b); setN(k.length); setSel(k); setPct(0); setStep("import"); }}
          onCancel={() => { setWhy("cancelled"); setStep("fail"); }}
          onFail={(b) => { setBank(b); setWhy("failed"); setStep("fail"); }}/>}
      </div>
    );
  }
  Object.assign(window, { OBBankFlow: BankFlow });
})();
