/* Decouple — prototype chrome: floating control pill (device toggle, reset, journey link) + mobile frame.
   Hidden when the page is loaded with ?embed (inside the master journey or the mobile frame). */
(function () {
  const J = window.Journey;
  const DKEY = "decouple.proto.device";
  window.addEventListener("message", (e) => {
    const d = e.data || {};
    if (d.type === "decouple:goStage" && !J.embedded) J.goStage(d.stage, d.hash);
    if (d.type === "decouple:goStage" && J.embedded && window.parent !== window) window.parent.postMessage(d, "*");
  });
  if (J.embedded) return;
  /* participants (from the Take part hub) never see the owner's prototype bar */
  try { const u = JSON.parse(localStorage.getItem("decouple.ut.v1")) || {}; if (u.participant && u.on) return; } catch (e) {}
  const stageId = document.documentElement.dataset.stage;
  const stage = J.STAGES.find((s) => s.id === stageId) || { n: "—", name: "" };
  const css = `
  .pc-pill{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;display:flex;align-items:center;gap:4px;padding:5px;background:#1C1917;color:#F5F1EC;border-radius:999px;font:500 11.5px/1 'JetBrains Mono',ui-monospace,monospace;box-shadow:0 10px 30px rgba(0,0,0,.25)}
  .pc-pill b{font-weight:600;color:#C4B0FD;padding:0 10px 0 12px;letter-spacing:.06em}
  .pc-pill button,.pc-pill a{all:unset;cursor:pointer;padding:8px 11px;border-radius:999px;color:#B8AFA6}
  .pc-pill button:hover,.pc-pill a:hover{color:#F5F1EC;background:#2E2926}
  .pc-pill .on{background:#F5F1EC;color:#1C1917}.pc-pill .on:hover{background:#F5F1EC;color:#1C1917}
  .pc-sep{width:1px;height:16px;background:#3A3430;margin:0 3px}
  .pc-stage{position:fixed;inset:0;z-index:9000;background:#E7E4DF;display:none;align-items:center;justify-content:center;padding:24px 24px 80px}
  .pc-phone{width:390px;height:844px;border-radius:46px;border:10px solid #1C1917;background:#1C1917;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.22);transform-origin:center;flex-shrink:0}
  .pc-phone iframe{width:100%;height:100%;border:0;border-radius:36px;background:#FFF;display:block}
  .pc-toast{position:fixed;left:50%;bottom:72px;transform:translateX(-50%);z-index:9999;max-width:min(520px,calc(100vw - 32px));background:#1C1917;color:#F5F1EC;border-radius:12px;padding:12px 16px;font:13px/1.45 Inter,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);display:none}
  .pc-toast span{color:#B8AFA6;display:block;font:11px/1.5 'JetBrains Mono',monospace;margin-top:4px}`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const pill = document.createElement("div"); pill.className = "pc-pill";
  pill.innerHTML = `<b>${stage.n} · ${stage.name.toUpperCase()}</b><button data-d="desktop">Desktop</button><button data-d="mobile">Mobile</button><span class="pc-sep"></span><button data-act="reset" title="Clear saved journey answers">Reset</button>${/(^|\.)decouple\.uk$/.test(location.hostname) ? `<a href="/hub">Hub ↗</a>` : `<a href="${encodeURI("Decouple Journey.html")}#${stageId}">Journey ↗</a>`}`;
  const frame = document.createElement("div"); frame.className = "pc-stage";
  frame.innerHTML = `<div class="pc-phone"><iframe title="Mobile preview"></iframe></div>`;
  const toast = document.createElement("div"); toast.className = "pc-toast";
  document.body.append(frame, pill, toast);
  const ifr = frame.querySelector("iframe"), phone = frame.querySelector(".pc-phone");
  const fit = () => { const s = Math.min(1, (innerHeight - 110) / 844, (innerWidth - 48) / 390); phone.style.transform = `scale(${s})`; };
  addEventListener("resize", fit);
  function setDevice(d) {
    localStorage.setItem(DKEY, d);
    pill.querySelectorAll("[data-d]").forEach((b) => b.classList.toggle("on", b.dataset.d === d));
    if (d === "mobile") {
      const u = new URL(location.href); u.searchParams.set("embed", "1");
      ifr.src = u.pathname + u.search + location.hash; frame.style.display = "flex"; document.body.style.overflow = "hidden"; fit();
    } else {
      try { const h = ifr.contentWindow && ifr.contentWindow.location.hash; if (h && h !== location.hash) location.hash = h; } catch (e) {}
      frame.style.display = "none"; ifr.src = "about:blank"; document.body.style.overflow = "";
    }
  }
  pill.addEventListener("click", (e) => {
    const d = e.target.closest("[data-d]"); if (d) return setDevice(d.dataset.d);
    if (e.target.closest("[data-act=reset]")) { J.reset(); showToast("Journey answers cleared", "Every stage starts fresh."); }
  });
  let tt;
  function showToast(t, sub) { toast.innerHTML = t + (sub ? `<span>${sub}</span>` : ""); toast.style.display = "block"; clearTimeout(tt); tt = setTimeout(() => (toast.style.display = "none"), 4200); }
  window.addEventListener("journey:unbuilt", (e) => {
    const s = e.detail, saved = J.get().router || {};
    const bits = [saved.stageLabel, saved.statusLabel].filter(Boolean).join(" · ");
    showToast(`${s.n} · ${s.name} prototype isn't built yet — it's next in the queue.`, bits ? "Carried forward: " + bits : "");
  });
  setDevice(localStorage.getItem(DKEY) || "desktop");
})();
