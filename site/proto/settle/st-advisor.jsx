/* Settle — agreement page rail extras: Word download for a solicitor, AI advisor (proofread + reasonableness against current family law). Advisor verdicts are scripted from section ratings; "Ask" uses window.claude. Placeholder legal wording — needs legal review. */
(function () {
  const { useState } = React;
  const Ic = window.DIc, ST = window.ST;
  const LAW = {
    children: "Children Act 1989 s.1 — the children's welfare comes first.",
    home: "MCA 1973 s.25(1) — the children's housing is the first consideration.",
    pensions: "MCA 1973 s.24B — pension sharing; length of marriage matters.",
    savings: "Sharing principle (White v White, 2000) — marital savings are usually shared.",
    vehicles: "Sharing principle, balanced against each person's needs.",
    debts: "Debts run up for the family are usually treated as shared.",
    spousal: "MCA 1973 s.25A — clean break where fair; term orders bridge a gap.",
  };
  const VD = { strong: ["up", "Reasonable", "#047857", "#ECFDF5"], ok: ["up", "Within range", "#0369A1", "#E0F2FE"], stretch: ["down", "Likely questioned", "#B45309", "#FEF3C7"] };
  const Thumb = ({ d = "up", c }) => <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={c || "currentColor"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={d === "down" ? { transform: "rotate(180deg)" } : null}><path d="M7 10v10H4V10h3z"/><path d="M7 10l4-6.5a1.8 1.8 0 0 1 3.3 1.3L13.6 9H19a2 2 0 0 1 2 2.3l-1.2 6.9A2 2 0 0 1 17.8 20H7"/></svg>;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  function clauses(S, picks, custom) { return S.map((s, i) => { const o = ST.opt(s, picks[s.id]); return { s, i, o, term: o ? o.t : custom[s.id] || "As set out by the parties" }; }); }

  function wordDoc({ S, N, picks, custom, finalN, sign }) {
    const sp = ST.split(S, picks), O = N.Them, cl = clauses(S, picks, custom);
    const amt = (o) => (o && o.a != null ? `<p style="margin:4px 0 0;color:#444">${esc(N.Me)}: ${ST.gbp(o.a)} &nbsp;·&nbsp; ${esc(O)}: ${ST.gbp(o.b)}</p>` : o && o.total != null ? `<p style="margin:4px 0 0;color:#444">Total: ${ST.gbp(o.total)}</p>` : "");
    const body = `<p style="color:#B45309;font-weight:bold;letter-spacing:1px">DRAFT — FOR SOLICITOR REVIEW</p>
<h1 style="font-family:Georgia;font-size:22pt;margin:0">Financial Settlement Agreement</h1><p>between ${esc(N.Me)} (Party A) and ${esc(O)} (Party B)</p>
<p style="color:#666">Version ${finalN} · Final · Prepared with Decouple on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
<h3>Background</h3><ol type="A"><li>The parties have exchanged financial disclosure through Decouple and agree the values recorded in their household picture.</li><li>This agreement records how they will divide those assets and arrange for the children. It is intended to form the basis of a consent order.</li></ol>
<h3>The parties agree as follows</h3>${cl.map(({ s, i, o, term }) => `<p style="margin:14px 0 0"><b>${i + 1}. ${esc(s.t)}</b><br/>${esc(term)}.${o && o.d ? `<br/><span style="color:#444">${esc(o.d)}</span>` : ""}</p>${amt(o)}${o && o.r === "stretch" ? `<p style="margin:4px 0 0;color:#B45309"><i>Note: marked "a stretch". ${esc(o.rw)}</i></p>` : ""}`).join("")}
<h3>Overall division</h3><table border="1" cellpadding="6" style="border-collapse:collapse"><tr><td>${esc(N.Me)}</td><td>${ST.gbp(sp.a)}</td><td>${sp.pa}%</td></tr><tr><td>${esc(O)}</td><td>${ST.gbp(sp.b)}</td><td>${100 - sp.pa}%</td></tr><tr><td><b>Total divided</b></td><td><b>${ST.gbp(sp.total)}</b></td><td></td></tr></table>
<h3>Signed</h3><p>${esc(N.Me)}: ${sign.a ? "signed electronically · " + esc(sign.ad || "") : "________________________"}</p><p>${esc(O)}: ${sign.b ? "signed electronically · " + esc(sign.bd || "") : "________________________"}</p>
<p style="color:#666;font-size:9pt;margin-top:24pt">Not legally binding until approved by the court as a consent order. This copy is editable so a solicitor can mark it up; changes here don't change the agreement on Decouple.</p>`;
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Settlement agreement</title></head><body style="font-family:Calibri,Arial;font-size:11pt;line-height:1.45">${body}</body></html>`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff", html], { type: "application/msword" })); a.download = `Settlement agreement v${finalN} (draft for solicitor).doc`; document.body.appendChild(a); a.click(); a.remove();
  }

  function Download(P) {
    return <div className="rc-card st-dl"><div className="pq-k"><Ic.Down s={11}/>Download a copy</div><div className="rc-stt">For your solicitor.</div>
      <p className="rc-p">Download a copy to share as a draft with a solicitor. It opens in Word so they can mark it up.</p>
      <button className="st-dlb" onClick={() => wordDoc(P)}><span className="ic">W</span><span><b>{`Settlement agreement v${P.finalN}`}</b><small>Word document · editable draft</small></span><Ic.Arrow s={13}/></button></div>;
  }

  function review(S, N, picks, custom) {
    const cl = clauses(S, picks, custom), sp = ST.split(S, picks), secs = cl.map(({ s, o }) => ({ s, r: (o && o.r) || "ok", why: (o && o.rw) || "", law: LAW[s.id] || "MCA 1973 s.25 factors." }));
    const nx = secs.filter((x) => x.r === "stretch").length, home = picks.home || "";
    const proof = [
      ["ok", "Names and parties are consistent throughout."],
      ["ok", `Every one of the ${S.length} clauses has a clear term.`],
      ["ok", `The overall division adds up to ${ST.gbp(sp.total)}.`],
      (home === "mesher" || String(home).startsWith("later")) && ["fix", "Clause on the home: add \u201cor finishes full-time secondary education, if later\u201d — the usual trigger wording for a deferred sale."],
      picks.pensions && picks.pensions !== "each" && !String(picks.pensions).endsWith(":0") && ["fix", "Pensions: name both schemes and the percentage to be shared, so the pension sharing annex (Form P1) matches."],
      ["fix", "Add the date the values were agreed, so a court can see they're current."],
    ].filter(Boolean);
    const fair = sp.pa >= 50 && sp.pa <= 65;
    return { secs, nx, proof, sp, fair };
  }

  function Advisor({ S, N, picks, custom }) {
    const [st, setSt] = useState("idle"), [res, setRes] = useState(null), [open, setOpen] = useState(null), [pane, setPane] = useState(0);
    const [q, setQ] = useState(""), [qa, setQa] = useState([]), [busy, setBusy] = useState(false);
    const run = () => { setSt("run"); setTimeout(() => { setRes(review(S, N, picks, custom)); setSt("done"); }, 1400); };
    const ask = async (text) => { const t = (text || q).trim(); if (!t || busy) return; setQ(""); setBusy(true); setQa((x) => [...x, { q: t }]);
      const ctx = clauses(S, picks, custom).map(({ s, i, term, o }) => `${i + 1}. ${s.t}: ${term}${o && o.r ? ` [rated ${ST.R[o.r][0]}]` : ""}`).join("\n");
      let a; try { a = await window.claude.complete({ system: `You are Decouple's AI advisor. You review a divorcing couple's financial settlement agreement against current family law in England and Wales (Matrimonial Causes Act 1973 s.25 and s.25A, the sharing and needs principles, Children Act 1989 welfare principle). Answer in plain English, 2-4 short sentences, no markdown, no headings. Say whether something looks reasonable. Never give definitive legal advice; when it matters, suggest checking with a solicitor. If the user mentions violence, threats or harm, gently say this matters and suggest talking to a solicitor or calling 999 if in danger. Party A is ${N.Me}, Party B is ${N.Them}. Children: Emma (7) and Jake (4).`, messages: [{ role: "user", content: `The agreement:\n${ctx}\n\nQuestion: ${t}` }] }); } catch (e) { a = "I couldn't reach the advisor just now. Try again in a moment — or book a mediator review below."; }
      setQa((x) => x.map((m, i) => (i === x.length - 1 ? { ...m, a } : m))); setBusy(false); };
    return <div className="rc-card st-adv"><div className="pq-k" style={{ color: "#5B21B6" }}><span className="st-ai">AI</span>Advisor</div><div className="rc-stt">Proofread and check it.</div>
      {st !== "done" && <><p className="rc-p">Reads the agreement for gaps and wording, then checks each clause against current family law in England and Wales.</p>
        <button className="btn sm st-advb" disabled={st === "run"} onClick={run}>{st === "run" ? <><span className="spin"></span>Reading your agreement…</> : <>Check my agreement<Ic.Arrow s={12}/></>}</button></>}
      {st === "done" && res && <>
        <div className={"st-avv " + (res.nx ? "warn" : "ok")}><Thumb d={res.nx ? "down" : "up"}/><span><b>{res.nx ? `Mostly reasonable · ${res.nx} to look at` : "Looks reasonable"}</b><small>{`${res.sp.pa}/${100 - res.sp.pa} overall — ${res.fair ? "within the range courts approve where one parent houses the children." : "outside the usual range; expect the judge to ask why."}`}</small></span></div>
        <div className="st-car"><div className="st-carh"><span className="st-avh">{pane === 0 ? "By clause" : "Proofread"}</span><span className="st-dots" role="tablist">{["By clause", "Proofread"].map((l, i) => <button key={l} role="tab" aria-selected={pane === i} aria-label={l} className={pane === i ? "on" : ""} onClick={() => setPane(i)}></button>)}</span></div>
        <div className="st-carv"><div className="st-cart" style={{ transform: `translateX(-${pane * 100}%)` }}><div className="st-carp" aria-hidden={pane !== 0}>
        <div className="st-avl">{res.secs.map((x) => { const v = VD[x.r], on = open === x.s.id; return <div key={x.s.id} className={"st-avr" + (on ? " on" : "")}><button onClick={() => setOpen(on ? null : x.s.id)} aria-expanded={on}><span className="th" style={{ background: v[3] }}><Thumb d={v[0]} c={v[2]}/></span><span className="t">{x.s.t}</span><em style={{ color: v[2] }}>{v[1]}</em></button>
          {on && <div className="bd">{x.why && <p>{x.why}</p>}<small>{x.law}</small></div>}</div>; })}</div>
        <button className="lnk st-carn" onClick={() => setPane(1)}>{`Proofread · ${res.proof.filter((p) => p[0] === "fix").length} suggestions`}<Ic.Arrow s={11}/></button>
        </div><div className="st-carp" aria-hidden={pane !== 1}>
        <ul className="st-avp">{res.proof.map(([k, t], i) => <li key={i} className={k}><span className="d">{k === "ok" ? <Ic.Check s={9} w={3.2} c="#FFF"/> : "!"}</span>{t}</li>)}</ul>
        <button className="lnk st-carn" onClick={() => setPane(0)}>Back to clauses</button>
        </div></div></div></div>
        <div className="st-avh">Ask the advisor</div>
        {qa.length === 0 && <div className="st-avs">{["Is the spousal maintenance fair?", "Would a judge question the house?"].map((t) => <button key={t} onClick={() => ask(t)}>{t}</button>)}</div>}
        {qa.map((m, i) => <div key={i} className="st-avq"><b>{m.q}</b>{m.a ? <p>{m.a}</p> : <p className="ld"><span className="spin"></span>Thinking…</p>}</div>)}
        <form className="st-avi" onSubmit={(e) => { e.preventDefault(); ask(); }}><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about any clause…" aria-label="Ask the advisor"/><button className="btn sm" disabled={!q.trim() || busy} aria-label="Ask"><Ic.Arrow s={12}/></button></form>
        <button className="lnk st-avre" onClick={run}>Run the check again</button>
      </>}
      <p className="st-avf">Guidance, not legal advice. A solicitor can confirm.</p>
    </div>;
  }
  Object.assign(window, { STAdvisor: Advisor, STDownload: Download });
})();
