/* Help assistant · the panel at the top of the Help & support page (MVP 08 and Marketing 03, /help).
   Answers questions and talks things through using only the page's own words and the GOV.UK text the build fetched,
   with links back to the topics and to GOV.UK. The prompt is built by help-prompt.js, the same code the server uses.
   Nothing is kept: the conversation lives in this tab only. Public page: dc-site.js and the person check load on the first question. */
window.HELPAI = (function () {
  const GOV = "https://www.gov.uk";
  const SAFE = /\b(hit|hits|hitting|hurt|hurts|violen|abus|threat|scared|afraid|frighten|kill|suicid|self[- ]?harm|end my life|unsafe|danger|controlling|controls me|stalk)/i;
  const SUG = ["Do we have to go to mediation first?", "What’s the difference between Form A and Form E?", "Can I get help paying court fees?", "I live alone now. What about Council Tax?", "Who gets Child Benefit after we separate?"];
  const parse = (raw) => { const s = String(raw || ""); try { return JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1)); } catch (e) { return null; } };
  const dc = () => window.DC ? Promise.resolve(window.DC) : new Promise((res) => { const l = document.getElementById("dc-lazy"), s = document.createElement("script"); s.src = l ? l.href : "shared/dc-site.js"; s.onload = () => res(window.DC); s.onerror = () => res(null); document.head.appendChild(s); });

  function panel({ S, C, opts, ev, jump }) {
    const H = window.HELP, el = H.el, svg = H.svg, IC = H.IC, P = window.HELPPROMPT;
    const pages = (C && C.pages) || {}, list = P.topics(S), byId = Object.fromEntries(list.map((t) => [t.id, t]));
    const govT = {}; list.forEach((t) => (t.gov || []).forEach((g) => { govT[g.path] = (pages[g.path] && pages[g.path].title) || g.t; }));
    const sug = (S.ask && S.ask.sug) || SUG;
    let msgs = [], busy = false, checked = false;

    const log = el("div", { class: "hpa-log", "aria-live": "polite" });
    const err = el("p", { class: "hpa-err", role: "alert" });
    const ts = el("div", { class: "hpa-ts" });
    const input = el("textarea", { rows: 1, maxlength: P.LIMIT.q, placeholder: "Ask about anything on this page", "aria-label": "Your question" });
    const send = el("button", { type: "submit", class: "hpa-send", "aria-label": "Ask" }, svg(IC.arrow, 17));
    const form = el("form", { class: "hpa-in" }, [input, send]);
    const chips = el("div", { class: "hpa-sug" }, sug.map((s) => el("button", { type: "button", onclick: () => ask(s) }, s)));
    const reset = el("button", { type: "button", class: "hpa-reset", hidden: true, onclick: () => { msgs = []; log.innerHTML = ""; log.hidden = true; chips.hidden = false; reset.hidden = true; err.textContent = ""; input.focus(); } }, "Start again");
    log.hidden = true;
    const grow = () => { send.disabled = busy || !input.value.trim(); if (!input.isConnected) return; input.style.height = ""; const h = input.scrollHeight; if (h > 44) input.style.height = Math.min(h, 160) + "px"; input.style.overflowY = h > 160 ? "auto" : "hidden"; };
    input.addEventListener("input", grow);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
    form.addEventListener("submit", (e) => { e.preventDefault(); ask(input.value); });

    const safety = () => el("div", { class: "hpa-safe" }, [
      el("b", { text: "If you’re in danger, call 999." }),
      el("span", {}, ["If you can’t speak, press 55. ", el("a", { href: "tel:08082000247" }, "0808 2000 247"), " is the free, 24-hour National Domestic Abuse Helpline. ", el("a", { href: "tel:116123" }, "Samaritans: 116 123"), "."]),
      byId.safety ? el("button", { type: "button", class: "hpa-tp urgent", onclick: () => go("safety") }, ["Safety now", svg(IC.arrow, 13)]) : null,
    ]);
    const go = (id) => { ev("help-ai-jump", "Opened a topic from the assistant", (byId[id] || {}).t || id, "Assistant"); jump(id); };

    function answer(d) {
      const box = el("div", { class: "hpa-a" });
      String(d.answer || "").split(/\n\n+/).filter(Boolean).forEach((p) => box.appendChild(el("p", { text: p })));
      if (d.pro) box.appendChild(el("p", { class: "hpa-pro", text: "This is one to check with a solicitor, mediator or adviser." }));
      const tps = (d.topics || []).filter((id) => byId[id]).slice(0, 3), gv = (d.gov || []).filter((p) => govT[p]).slice(0, 3);
      if (tps.length || gv.length) box.appendChild(el("div", { class: "hpa-refs" }, [
        tps.length ? el("div", {}, [el("span", { class: "hpa-lbl", text: "On this page" }), ...tps.map((id) => el("button", { type: "button", class: "hpa-tp" + (byId[id].urgent ? " urgent" : ""), onclick: () => go(id) }, [byId[id].t, svg(IC.arrow, 13)]))]) : null,
        gv.length ? el("div", {}, [el("span", { class: "hpa-lbl", text: "On GOV.UK" }), ...gv.map((p) => el("a", { class: "hpa-gv", href: (pages[p] && pages[p].url) || GOV + p, target: "_blank", rel: "noopener", onclick: () => ev("help-out", "Opened a link", "Assistant · " + govT[p], "Link") }, [govT[p], svg(IC.ext, 12)]))]) : null,
      ]));
      const rate = el("div", { class: "hpa-rate" }, [el("span", { text: "Not legal advice. Check the topic, or ask an adviser." })]);
      const thumbs = el("div", {}, ["up", "down"].map((v) => el("button", { type: "button", "aria-label": v === "up" ? "Helpful" : "Not helpful", onclick: () => { ev("help-ai-rate", "Was this helpful? · Help assistant", v, "Assistant"); thumbs.replaceWith(el("small", { text: "Thanks for telling us." })); } }, svg(v === "up" ? '<path d="M7 11v9H4v-9z"/><path d="M7 11l4-7a2 2 0 0 1 3 2l-1 4h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 16.8 20H7"/>' : '<path d="M17 13V4h3v9z"/><path d="M17 13l-4 7a2 2 0 0 1-3-2l1-4H6a2 2 0 0 1-2-2.3l1.2-6A2 2 0 0 1 7.2 4H17"/>', 14))));
      rate.appendChild(thumbs); box.appendChild(rate);
      const fol = (d.follow || []).filter((x) => typeof x === "string" && x.length < 90).slice(0, 3);
      if (fol.length) box.appendChild(el("div", { class: "hpa-sug fol" }, fol.map((s) => el("button", { type: "button", onclick: () => ask(s) }, s))));
      return box;
    }

    async function complete(system, messages) {
      const DC = await dc();
      if (opts.ctx !== "kit" && DC && !checked && (await DC.onSite())) { if (!(await DC.human(ts))) throw new Error("human"); checked = true; }
      if (!window.claude || !window.claude.complete) throw new Error("offline");
      return window.claude.complete({ kind: "help", system, messages, max_tokens: P.LIMIT.max_tokens });
    }

    async function ask(q) {
      q = String(q || "").trim().slice(0, P.LIMIT.q); if (!q || busy) return;
      busy = true; err.textContent = ""; input.value = ""; grow(); chips.hidden = true; log.hidden = false; reset.hidden = false;
      const turn = el("div", { class: "hpa-turn" }, [el("div", { class: "hpa-u", text: q })]);
      if (SAFE.test(q)) turn.appendChild(safety());
      const wait = el("div", { class: "hpa-busy" }, [el("i"), el("i"), el("i"), el("span", { text: "Reading the page and GOV.UK" })]);
      turn.appendChild(wait); log.appendChild(turn);
      log.querySelectorAll(".hpa-sug.fol").forEach((x) => x.remove());
      log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
      ev("help-ai-q", "Asked the help assistant", SAFE.test(q) ? "(safety, not sent)" : q.slice(0, 200), "Assistant");
      const hist = P.trim([...msgs, { role: "user", content: q }]);
      try {
        const raw = await complete(P.build(S, C, hist), hist), d = parse(raw) || { answer: String(raw || "") };
        if (!d.answer) throw new Error("shape");
        msgs = [...hist, { role: "assistant", content: JSON.stringify({ answer: d.answer, topics: d.topics || [] }) }];
        wait.replaceWith(answer(d));
      } catch (e) {
        wait.remove(); msgs = hist.slice(0, -1);
        err.textContent = e.message === "offline" ? "The assistant isn’t available right now. The topics below have the same information." : e.message === "human" ? "We couldn’t check you’re a person. Please try again." : "Something went wrong. Please ask again.";
      }
      busy = false; grow(); log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
    }

    const live = !!(C && C.pages && Object.keys(C.pages).length);
    grow();
    return el("section", { class: "hpa", "aria-labelledby": "hpa-h", "data-screen-label": "Help · Assistant" }, [
      el("div", { class: "hpa-hd" }, [
        el("span", { class: "hpa-ic" }, svg('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01" stroke-width="2.6"/>', 20)),
        el("div", {}, [el("h2", { id: "hpa-h", text: "Ask about anything on this page" }), el("p", { text: live ? "Answers come from this page and the GOV.UK guidance it links to, with links so you can check. Ask a follow-up, or talk it through." : "Answers come from this page, with links so you can check. Ask a follow-up, or talk it through." })]),
        reset,
      ]),
      chips, log, form, ts, err,
      el("p", { class: "hpa-fine" }, ["Not legal advice. Your question goes to Anthropic, the company that makes the Claude AI model, to write the answer. We don’t keep it. Leave out names and addresses. ", el("a", { href: "privacy.html" }, "Privacy")]),
    ]);
  }
  return { panel };
})();
