/* Decouple — shared journey state for every stage prototype (localStorage). */
window.Journey = (function () {
  const KEY = "decouple.journey.v1";
  const STAGES = [
    { id: "discover",  n: "01", name: "Discover",  sub: "Public site",           file: "Proto 01 · Discover.html", built: true },
    { id: "interview", n: "02", name: "Interview", sub: "Free profiling",        file: "Proto 02 · Interview.html", built: true },
    { id: "playback",  n: "03", name: "Playback",  sub: "The magic moment",      file: "Proto 03 · Playback.html", built: true },
    { id: "signup",    n: "04", name: "Sign-up",   sub: "Pricing, account, pay", file: "Proto 04 · Sign-up.html", built: true },
    { id: "onboard",   n: "05", name: "Onboard",   sub: "Welcome tour",          file: "Proto 05 · Onboard.html", built: true },
    { id: "prepare",   n: "06", name: "Prepare",   sub: "Your picture",          file: "Proto 06 · Prepare.html", built: true },
    { id: "reconcile", n: "07", name: "Household", sub: "Prepare · their picture & our household", file: "Proto 07 · Reconcile.html", built: true },
    { id: "settle",    n: "08", name: "Settle",    sub: "Proposals & versions",  file: "Proto 08 · Settle.html", built: true },
    { id: "finalise",  n: "09", name: "Finalise",  sub: "Agreement & filing",    file: "Proto 09 · Finalise.html", built: true },
    { id: "dashboard", n: "10", name: "Dashboard", sub: "To-dos, evidence vault, guides, account", file: "Proto 10 · Dashboard.html", built: true }
  ];
  const listeners = new Set(), EMB = new URLSearchParams(location.search).has("embed");
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  let state = read();
  const emit = () => listeners.forEach((f) => f(state));
  function set(section, patch) {
    state = { ...state, [section]: { ...(state[section] || {}), ...patch } };
    localStorage.setItem(KEY, JSON.stringify(state)); emit();
  }
  function reset() { state = {}; localStorage.removeItem(KEY); emit(); }
  window.addEventListener("storage", (e) => { if (e.key === KEY) { state = read(); emit(); } });
  function goStage(id, hash) {
    const s = STAGES.find((x) => x.id === id);
    if (!s) return false;
    if (EMB && window.parent !== window) { window.parent.postMessage({ type: "decouple:goStage", stage: id, hash }, "*"); return true; }
    if (!s.built) { window.dispatchEvent(new CustomEvent("journey:unbuilt", { detail: s })); return false; }
    location.href = encodeURI(s.file) + (hash || ""); return true;
  }
  return {
    STAGES, KEY, get: () => state, set, reset, goStage,
    subscribe(f) { listeners.add(f); return () => listeners.delete(f); },
    embedded: new URLSearchParams(location.search).has("embed")
  };
})();
