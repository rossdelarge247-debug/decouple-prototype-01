/* Help & support · Tweaks: switches the look-and-feel treatment (help-themes.css) with <html data-hpt>.
   The page holds the saved choice in its EDITMODE block (window.HELP_TWEAKS). The panel only opens when the design tool
   asks for it, so on decouple.uk this file just applies the saved treatment and does nothing else. */
(function () {
  const T = [
    ["studio", "Studio", "Today’s look: serif heads, soft cards, violet", "#5B21B6"],
    ["flat", "Flat", "Hairlines, no shadows or texture, one accent", "#1A1A1A"],
    ["lilac", "Lilac & warm", "Lilac washes, cream, plum ink, peach notes", "#B48BE0"],
    ["field", "Field guide", "Surprise: editorial print, ink rules, big numerals", "#C2410C"],
    ["service", "Category norm", "How UK divorce services tend to look: green, sand, yellow", "#0F5C4A"],
  ];
  const D = window.HELP_TWEAKS || {};
  const ok = (v) => T.some((t) => t[0] === v);
  /* Site settings › Look and feel (shared/dc-look.js) beats this page's saved choice; only the public page loads it */
  const S = document.documentElement.getAttribute("data-site-theme");
  let cur = ok(S) ? S : ok(D.theme) ? D.theme : "studio";
  const apply = (v) => { if (v === "studio") document.documentElement.removeAttribute("data-hpt"); else document.documentElement.setAttribute("data-hpt", v); };
  apply(cur);

  let panel = null;
  function build() {
    panel = document.createElement("div"); panel.className = "hpt-panel"; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Tweaks");
    panel.innerHTML = '<div class="hd"><b>Tweaks</b><button type="button" class="x" aria-label="Close">✕</button></div><p class="lb">Look and feel</p><div class="hpt-opts"></div>';
    const box = panel.querySelector(".hpt-opts");
    T.forEach(([id, t, d, c]) => {
      const b = document.createElement("button"); b.type = "button"; b.dataset.id = id;
      b.innerHTML = `<i style="background:${c}"></i><span>${t}</span><small>${d}</small>`;
      b.addEventListener("click", () => { cur = id; apply(id); mark(); try { window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { theme: id } }, "*"); } catch (e) {} });
      box.appendChild(b);
    });
    if (ok(S)) { const n = document.createElement("p"); n.className = "nt"; n.textContent = `Site settings › Look and feel is set to ${T.find((t) => t[0] === S)[1]}, so the live page shows that. Your pick here is this page’s own, used when Site settings says “As designed”.`; panel.appendChild(n); }
    panel.querySelector(".x").addEventListener("click", () => { panel.hidden = true; try { window.parent.postMessage({ type: "__edit_mode_dismissed" }, "*"); } catch (e) {} });
    document.body.appendChild(panel); mark();
  }
  const mark = () => panel && panel.querySelectorAll(".hpt-opts button").forEach((b) => b.classList.toggle("on", b.dataset.id === cur));
  window.addEventListener("message", (e) => {
    const t = e && e.data && e.data.type;
    if (t === "__activate_edit_mode") { if (!panel) build(); panel.hidden = false; }
    else if (t === "__deactivate_edit_mode" && panel) panel.hidden = true;
  });
  if (window.parent !== window) { try { window.parent.postMessage({ type: "__edit_mode_available" }, "*"); } catch (e) {} }
})();
