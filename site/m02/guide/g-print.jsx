/* M02 · the guide's print layout (A4): cover, contents, one chapter per page. Used by "Download or print" and by the emailed PDF (?print=pdf).
   Never shows the safety answers. With ?print=pdf it sets window.__printReady = true once fonts and layout have settled. */
(function () {
  const { useEffect } = React;
  const PB = window.PB, G = window.G;
  const NOSAFE = ["safe", "safe2"];
  const today = () => new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  function Print({ a, ready }) {
    const pa = { ...a }; NOSAFE.forEach((k) => delete pa[k]);
    const list = G.chapters(pa).filter((c) => !c.vonly), r = PB.compute(pa), N = r.N;
    useEffect(() => {
      if (!ready) return;
      let off = false;
      const done = () => requestAnimationFrame(() => requestAnimationFrame(() => { if (!off) window.__printReady = true; }));
      Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((res) => setTimeout(res, 8000))]).then(done);
      return () => { off = true; };
    }, []);
    return (
      <div className="site iv bg-paper gp" aria-label="Your guide, print version">
        <section className="gp-cover">
          <div className="gp-wm">Decouple<i>.</i></div>
          <div className="gp-cv">
            <div className="gp-kick">Made {today()}</div>
            <h1>Your guide</h1>
            {N.hasMe && <p className="gp-for">For {N.Me}</p>}
          </div>
          <div className="gp-cfoot"><p>Made from your own answers, on your device. Decouple doesn’t keep a copy.</p><p>Keep it somewhere private.</p></div>
        </section>
        <section className="gp-toc">
          <div className="gp-kick">Contents</div>
          <p className="gp-head">{window.GHeadline ? window.GHeadline(pa) : null}</p>
          <ol>{list.map((c, k) => <li key={c.id}><span className="n">{String(k + 1).padStart(2, "0")}</span><span className="t">{c.t}</span></li>)}</ol>
          <p className="gp-disc">Decouple is not a law firm, and this guide is not legal advice. Figures are rough estimates from the bands you chose, based on the law in England and Wales. If you’re worried about your safety, call the National Domestic Abuse Helpline free on 0808 2000 247, any time. In an emergency, call 999.</p>
        </section>
        {list.map((c, k) => { const C = window.GCH[c.id]; return (
          <section key={c.id} className="gp-ch g-sec" style={{ "--c": c.c }}>
            <div className="gp-chk">Chapter {String(k + 1).padStart(2, "0")}</div>
            <h2>{c.t}</h2>
            <div className="pb-main"><C a={pa} r={r}/></div>
          </section>); })}
      </div>
    );
  }

  /* print-only copy beside the screen guide, so "Download or print" prints this layout */
  function PrintCopy({ a }) { return ReactDOM.createPortal(<div className="gp-print">{<Print a={a}/>}</div>, document.body); }
  /* ?print=pdf: only the print layout, straight away */
  function PrintPage() {
    const s = window.GS.load(), ok = !!(s.a && s.a.stage);
    useEffect(() => { document.documentElement.classList.add("gp-mode"); document.documentElement.removeAttribute("data-hpt"); if (!ok) { window.__printError = "no-guide"; window.__printReady = true; } }, []);
    if (!ok) return <p style={{ font: "16px Inter,sans-serif", padding: 40 }}>There’s no guide in this link.</p>;
    return ReactDOM.createPortal(<div className="gp-print">{<Print a={s.a} ready/>}</div>, document.body);
  }

  Object.assign(window, { GPrintCopy: PrintCopy, GPrintPage: PrintPage, GPRINT: new URLSearchParams(location.search).get("print") === "pdf" });
})();
