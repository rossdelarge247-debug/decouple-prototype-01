/* Help & support hub · one renderer for both pages: MVP 08 (toolkit) and Marketing 03 (public, /help).
   Reads help/help-sources.json (ours) and help/help-content.json (written by the build from the GOV.UK Content API, spec §5).
   Without the content file (the design project), each GOV.UK page is a plain link. Nothing is sent from here, except by the
   assistant at the top (help-ai.js), which sends a question to the AI only when someone asks one. The kit page passes onEvent
   for its testing rows; the public page passes nothing. */
window.HELP = (function () {
  const BASE = (document.currentScript && document.currentScript.src.replace(/help\.js(\?.*)?$/, "")) || "help/";
  const GOV = "https://www.gov.uk";
  const el = (tag, attrs, kids) => {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => { if (v == null || v === false) return; if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? "" : v); });
    [].concat(kids || []).forEach((c) => c != null && c !== false && e.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return e;
  };
  const svg = (d, s) => { const n = document.createElementNS("http://www.w3.org/2000/svg", "svg"); n.setAttribute("viewBox", "0 0 24 24"); n.setAttribute("width", s || 14); n.setAttribute("height", s || 14); n.setAttribute("fill", "none"); n.setAttribute("stroke", "currentColor"); n.setAttribute("stroke-width", "1.8"); n.setAttribute("stroke-linecap", "round"); n.setAttribute("stroke-linejoin", "round"); n.setAttribute("aria-hidden", "true"); n.innerHTML = d; return n; };
  const IC = {
    ext: '<path d="M14 4h6v6"/><line x1="20" y1="4" x2="11" y2="13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/>',
    check: '<polyline points="5 12.5 10 17 19 7"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><polyline points="14 3 14 7 18 7"/>',
    chev: '<polyline points="6 9 12 15 18 9"/>',
  };
  const out = (url, kids, cls, onClick) => el("a", { href: url, target: "_blank", rel: "noopener", class: cls, onclick: onClick }, kids);
  const fmt = (iso) => { try { return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return ""; } };
  const two = (n) => String(n).padStart(2, "0");

  /* GOV.UK body → the tags we allow, nothing else. The build cleans it too; this is the second check. */
  const OK = { P: 1, UL: 1, OL: 1, LI: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TH: 1, TD: 1, A: 1, STRONG: 1, EM: 1, B: 1, I: 1, BR: 1, ABBR: 1 };
  function clean(html) {
    const src = new DOMParser().parseFromString(String(html || ""), "text/html").body, frag = document.createDocumentFragment();
    const walk = (from, to) => from.childNodes.forEach((n) => {
      if (n.nodeType === 3) return to.appendChild(document.createTextNode(n.textContent));
      if (n.nodeType !== 1) return;
      let tag = n.tagName;
      if (/^H[1-6]$/.test(tag)) tag = tag <= "H2" ? "H4" : "H5";
      else if (!OK[tag]) return walk(n, to);
      const e = document.createElement(tag);
      if (tag === "A") { const h = n.getAttribute("href") || "", u = h.startsWith("/") ? GOV + h : h; if (/^https:\/\//.test(u)) { e.href = u; e.target = "_blank"; e.rel = "noopener"; } }
      if ((tag === "TD" || tag === "TH") && n.getAttribute("colspan")) e.setAttribute("colspan", n.getAttribute("colspan"));
      walk(n, e); to.appendChild(e);
    });
    walk(src, frag); return frag;
  }

  async function load() {
    const get = (f) => fetch(BASE + f, { credentials: "same-origin" }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [src, content] = await Promise.all([get("help-sources.json"), get("help-content.json")]);
    return { src, content };
  }

  function mount(host, opts) {
    opts = opts || {};
    const ev = (k, q, a, step) => { try { opts.onEvent && opts.onEvent(k, q, a, step); } catch (e) {} };
    host.classList.add("hp");
    host.appendChild(el("p", { class: "hp-loading", text: "Loading…" }));
    load().then(({ src, content }) => {
      host.innerHTML = "";
      if (!src) { host.appendChild(el("p", { class: "hp-err", text: "This page couldn’t load. Please try again." })); return; }
      render(host, src, content, opts, ev);
    });
  }

  function render(host, S, C, opts, ev) {
    const pages = (C && C.pages) || {}, forms = (C && C.forms) || [], live = !!C;
    const onSite = /(^|\.)decouple\.uk$/.test(location.hostname);
    const linkEv = (where, t) => () => ev("help-out", "Opened a link", where + " · " + t, "Link");

    /* one GOV.UK page: fetched text in a disclosure, or a plain link */
    const govItem = (g, topic) => {
      const p = pages[g.path], url = (p && p.url) || GOV + g.path;
      if (!p || !p.body) return out(url, [el("span", {}, [el("b", { text: (p && p.title) || g.t }), el("small", { text: "On GOV.UK" })]), svg(IC.ext, 15)], "hp-g link", linkEv(topic.t, g.t));
      const body = el("div", { class: "hp-body" }); body.appendChild(clean(p.body));
      const d = el("details", { class: "hp-g", ontoggle: (e) => e.target.open && ev("help-read", "Read a GOV.UK page", p.title, "Read · " + topic.id) }, [
        el("summary", {}, [el("span", {}, [el("b", { text: p.title }), p.description ? el("small", { text: p.description }) : null]), svg(IC.chev, 16)]),
        body,
        el("p", { class: "hp-src" }, ["Source: ", out(url, "GOV.UK", null, linkEv(topic.t, p.title)), p.updated ? ", updated " + fmt(p.updated) : ""]),
      ]);
      return d;
    };
    const govBlock = (list, topic) => (list && list.length ? el("div", { class: "hp-gov" }, [el("div", { class: "hp-lbl" }, "From GOV.UK"), ...list.map((g) => govItem(g, topic))]) : null);
    const calls = (list) => (list && list.length ? el("div", { class: "hp-calls" }, list.map(([t, n, d]) => el("a", { class: "hp-call", href: "tel:" + n.replace(/\s/g, "") }, [svg(IC.phone, 16), el("span", {}, [el("b", { text: t }), el("small", { text: d })]), el("span", { class: "num", text: n })]))) : null);
    const more = (list, topic) => (list && list.length ? el("div", { class: "hp-more" }, [el("div", { class: "hp-lbl" }, "More help"), el("div", { class: "hp-links" }, list.map((l) => out(l.url, [el("b", {}, [l.t, svg(IC.ext, 12)]), el("small", { text: l.d })], "hp-l", linkEv(topic.t, l.t))))]) : null);
    const ours = (text) => el("p", { class: "hp-sum" }, [el("span", { class: "hp-ours", text: "In our words" }), text]);

    const order = []; S.topics.forEach((t) => { order.push(t); if (S.disclosure && S.disclosure.after === t.id) order.push({ ...S.disclosure, id: "disclosure", disc: true }); });
    let n = 0; order.forEach((t) => { t.n = t.disc ? null : ++n; });

    const topic = (t) => {
      if (t.disc) return disclosure(t);
      return el("section", { class: "hp-t" + (t.urgent ? " urgent" : ""), id: "help-" + t.id, "data-screen-label": "Help · " + t.t }, [
        el("header", {}, [el("span", { class: "n", text: two(t.n) }), el("div", {}, [el("h2", { text: t.t }), el("p", { class: "cov", text: t.covers })])]),
        ours(t.sum), calls(t.call), govBlock(t.gov, t), more(t.links, t),
        el("p", { class: "hp-adv" }, [el("b", { text: "Where to get advice: " }), t.advice]),
      ]);
    };

    function disclosure(D) {
      const formUrl = (code) => { const f = forms.find((x) => x.code === code); return f ? f.url : GOV + D.collection.path; };
      const formChip = (code) => code === "Consent order" ? el("span", { class: "hp-form plain", text: "Draft consent order" }) : out(formUrl(code), [el("b", { text: code === "A" || /^E/.test(code) || code === "D81" ? "Form " + code : code }), el("small", { text: D.forms[code] || "" })], "hp-form", linkEv(D.t, "Form " + code));
      const start = el("div", { class: "hp-start" });
      const startBtn = el("button", { type: "button", class: "hp-btn", onclick: () => { ev("help-start", D.start, "clicked", "Hand-off · statement"); if (opts.onStart) opts.onStart(); else signup(start, startBtn); } }, [D.start, svg(IC.arrow, 15)]);
      start.append(el("div", {}, [el("b", { text: "Ready to put your own figures together?" }), el("small", { text: opts.ctx === "kit" ? "The financial statement tool builds it with you, one section at a time." : "Our financial statement tool builds it with you, one section at a time. It’s free." })]), startBtn);
      return el("section", { class: "hp-t disc", id: "help-disclosure", "data-screen-label": "Help · Financial disclosure" }, [
        el("header", {}, [el("span", { class: "n sub", text: "10·2" }), el("div", {}, [el("h2", { text: D.t }), el("p", { class: "cov", text: D.covers })])]),
        ours(D.sum),
        el("div", { class: "hp-routes" }, D.routes.map((r) => el("div", { class: "hp-route" }, [
          el("div", { class: "hd" }, [el("b", { text: r.t }), el("small", { text: r.when })]),
          el("p", { text: r.d }),
          el("div", { class: "hp-forms" }, r.forms.map(formChip)),
        ]))),
        el("p", { class: "hp-note" }, live && forms.length ? "Each form links to its current version on GOV.UK." : ["The forms are all on GOV.UK: ", out(GOV + D.collection.path, D.collection.t, null, linkEv(D.t, D.collection.t)), "."]),
        govBlock(D.gov, D),
        el("div", { class: "hp-check" }, [el("div", { class: "hp-lbl" }, [el("span", { text: "What to gather" }), el("span", { class: "hp-ours sm", text: "Our checklist, not the form’s wording" })]), el("ul", {}, D.checklist.map((c) => el("li", {}, [svg(IC.check, 14), c])))]),
        start,
      ]);
    }

    /* public page only: the statement isn't open yet, so offer to tell them when it is. dc-site.js loads now, never before. */
    function signup(box, btn) {
      if (box.querySelector("form")) return;
      btn.remove();
      const err = el("p", { class: "hp-ferr", role: "alert" }), ts = el("div", { class: "hp-ts" });
      const f = el("form", { class: "hp-su", novalidate: true }, [
        el("p", { class: "lead", text: "The financial statement is part of the Decouple toolkit, which isn’t open yet. Leave your email and we’ll tell you when it is." }),
        el("label", {}, [el("span", { text: "Your email" }), el("input", { type: "email", name: "email", autocomplete: "email", placeholder: "you@example.com", required: true })]),
        el("p", { class: "hp-fsafe", text: "Use an email address your partner can’t read. Our emails never mention separation in the subject line." }),
        el("input", { class: "hp-trap", name: "website", tabindex: "-1", autocomplete: "off", "aria-hidden": "true" }),
        ts, err,
        el("button", { type: "submit", class: "hp-btn" }, "Tell me when it’s ready"),
        el("p", { class: "hp-ffine" }, ["One email when it opens. ", el("a", { href: "privacy.html" }, "Privacy notice")]),
      ]);
      const done = () => { box.innerHTML = ""; box.classList.add("done"); box.append(el("div", {}, [el("b", { text: "Thank you. We’ll email you once, when it opens." }), el("small", { text: "Nothing else is kept." })])); };
      f.addEventListener("submit", async (e) => {
        e.preventDefault(); const em = f.email.value.trim(), sb = f.querySelector("button[type=submit]");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { err.textContent = "Please enter a valid email address."; f.email.focus(); return; }
        err.textContent = ""; sb.disabled = true; sb.textContent = "Sending…";
        const fail = () => { sb.disabled = false; sb.textContent = "Tell me when it’s ready"; err.textContent = "Something went wrong. Please try again."; };
        try {
          const DC = await dc(); if (!DC || !(await DC.onSite())) return done();
          if (!(await DC.human(ts))) return fail();
          const r = await DC.signup({ email: em, stage: "", source: "help", sid: DC.rid(), hp: f.website.value });
          return r && r.ok ? done() : fail();
        } catch (x) { fail(); }
      });
      box.appendChild(f); f.email.focus();
    }
    /* the page names dc-site.js in <link id="dc-lazy" rel="prefetch">, so the build cache-busts it like any other reference */
    const dc = () => window.DC ? Promise.resolve(window.DC) : new Promise((res) => { const l = document.getElementById("dc-lazy"), s = document.createElement("script"); s.src = l ? l.href : BASE.replace(/help\/$/, "") + "shared/dc-site.js"; s.onload = () => res(window.DC); s.onerror = () => res(null); document.head.appendChild(s); });

    /* contents */
    const toc = el("details", { class: "hp-toc" }, [el("summary", {}, [el("span", { text: "Topics" }), el("small", { text: order.length + " sections, in the order a separation usually runs" }), svg(IC.chev, 16)]),
      el("ol", {}, order.map((t) => el("li", { class: t.disc ? "sub" : t.urgent ? "urgent" : "" }, el("a", { href: "#help-" + t.id, "data-id": t.id, onclick: (e) => { e.preventDefault(); const s = document.getElementById("help-" + t.id); if (s) window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 88, behavior: "smooth" }); if (!wide.matches) toc.open = false; ev("help-toc", "Jumped to a topic", t.t, "Contents"); } }, [el("span", { class: "n", text: t.disc ? "·" : two(t.n) }), t.t]))))]);
    const wide = matchMedia("(min-width: 980px)"); toc.open = wide.matches; wide.addEventListener && wide.addEventListener("change", () => { toc.open = wide.matches; });

    const notes = [el("p", { class: "hp-scope", text: S.scope })];
    if (!live && !onSite) notes.push(el("p", { class: "hp-proto" }, [el("b", { text: "Prototype" }), " GOV.UK’s own text is added when the site builds (spec §5). Until then, each GOV.UK page is a link."]));
    const main = el("div", { class: "hp-main" }, order.map(topic));
    const jump = (id) => { const s = document.getElementById("help-" + id); if (!s) return; window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 88, behavior: "smooth" }); s.classList.remove("hp-flash"); void s.offsetWidth; s.classList.add("hp-flash"); };
    const ai = window.HELPAI && window.HELPPROMPT ? window.HELPAI.panel({ S, C, opts, ev, jump }) : null;
    host.append(el("div", { class: "hp-notes" }, notes), el("div", { class: "hp-cols" + (ai ? " has-ai" : "") }, [ai, el("aside", { class: "hp-side" }, toc), main]),
      el("div", { class: "hp-foot" }, [
        el("p", {}, ["Contains public sector information licensed under the ", out(S.links_ogl, "Open Government Licence v3.0"), "."]),
        el("p", { text: "Decouple is not a law firm, and nothing here is legal advice." + (live && C.built ? " GOV.UK text last fetched " + fmt(C.built) + "." : "") }),
      ]));

    /* highlight the topic in view */
    if ("IntersectionObserver" in window) {
      const links = toc.querySelectorAll("a[data-id]"), io = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; const id = e.target.id.replace("help-", ""); links.forEach((a) => a.classList.toggle("on", a.dataset.id === id)); }), { rootMargin: "-30% 0px -60% 0px" });
      main.querySelectorAll("section").forEach((s) => io.observe(s));
    }
    if (location.hash && location.hash.startsWith("#help-")) { const s = document.getElementById(location.hash.slice(1)); if (s) setTimeout(() => window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 88 }), 60); }
  }

  return { load, mount, clean, el, svg, IC };
})();
