/* M02 · question primitives and the step shell */
const { useState: useStateM, useEffect: useEffectM, useRef: useRefM } = React;
const M = window.M02;

const ArrowM = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4"></path></svg>;

function OneM({ f, v, set }) {
  return <div className={"m-opts" + (f.opts.length >= 5 && f.opts.every((o) => o[1].length < 22) ? " two" : "")} role="radiogroup" aria-label={f.q}>
    {f.opts.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={v === k} className={"m-opt" + (v === k ? " on" : "")} onClick={() => set(k)}><i></i><span>{l}</span></button>)}
  </div>;
}
function ManyM({ f, v, set }) {
  const cur = v || [], full = f.max && cur.length >= f.max;
  const tog = (k) => set(cur.includes(k) ? cur.filter((x) => x !== k) : full ? cur : [...cur, k]);
  return <div className="m-opts" role="group" aria-label={f.q}>
    {f.opts.map(([k, l]) => { const on = cur.includes(k); return <button key={k} type="button" role="checkbox" aria-checked={on} className={"m-opt sq" + (on ? " on" : "") + (full && !on ? " dim" : "")} onClick={() => tog(k)}><i></i><span>{l}</span></button>; })}
  </div>;
}
function ScaleM({ f, v, set }) {
  return <div><div className="m-scale" role="radiogroup" aria-label={f.q}>{[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={v === n} className={"m-opt" + (v === n ? " on" : "")} onClick={() => set(n)}><i></i>{n}</button>)}</div><div className="m-ends"><span>{f.lo}</span><span>{f.hi}</span></div></div>;
}
function SliderM({ f, v, set }) {
  return <div className={"m-sl" + (v == null ? " un" : "")}>
    <input type="range" min="0" max="10" step="1" value={v == null ? 5 : v} aria-label={f.q} onChange={(e) => set(+e.target.value)} onClick={(e) => v == null && set(+e.target.value)} />
    <div className="m-ends"><span>{f.lo}</span><span>{f.hi}</span></div>
    <div className="m-slv">{v == null ? "Drag or tap to answer" : `${v} out of 10`}</div>
  </div>;
}
function FeatM({ v, set }) {
  const cur = v || {}, L = [["must", "Must have"], ["nice", "Nice"], ["no", "Not for me"]];
  return <div className="m-feats">{M.FEATURES.map(([id, t, d]) => <div key={id} className={"m-feat" + (cur[id] ? " done" : "")}>
    <div><b>{t}</b><small>{d}</small></div>
    <div className="m-seg" role="radiogroup" aria-label={t}>{L.map(([k, l]) => <button key={k} type="button" role="radio" aria-checked={cur[id] === k} className={(cur[id] === k ? "on " : "") + k} onClick={() => set({ ...cur, [id]: k })}>{l}</button>)}</div>
  </div>)}</div>;
}
function SpendM({ v, set, a }) {
  const cur = v || {}, total = Object.values(cur).reduce((s, x) => s + x, 0), left = 100 - total;
  const r = a.feat || {}, picks = M.FEATURES.filter(([id]) => r[id] === "must" || r[id] === "nice");
  const list = (picks.length >= 2 ? picks : M.FEATURES).sort((x, y) => (r[y[0]] === "must") - (r[x[0]] === "must"));
  const add = (id, d) => { const n = Math.max(0, (cur[id] || 0) + d); set({ ...cur, [id]: n }); };
  return <div>
    <div className="m-wallet"><div><b>£{left}</b> <span>left to spend</span></div><div className="m-coins" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < left / 10 ? "" : "u"}></i>)}</div></div>
    <div className="m-feats">{list.map(([id, t]) => <div key={id} className={"m-sp" + (cur[id] ? " has" : "")}><b>{t}</b><div className="m-step3"><button type="button" aria-label={"Less on " + t} disabled={!cur[id]} onClick={() => add(id, -10)}>−</button><output>£{cur[id] || 0}</output><button type="button" aria-label={"More on " + t} disabled={left <= 0} onClick={() => add(id, 10)}>+</button></div></div>)}</div>
  </div>;
}
function TiersM({ v, set, ver }) {
  const P = M.PRICES[ver];
  return <div>
    <div className="m-tiers">{M.TIERS.map((t, i) => <button key={t.id} type="button" aria-pressed={v === t.id} className={"m-tier" + (v === t.id ? " on" : "")} onClick={() => set(t.id)}>
      <h4>{t.name}</h4><div className="for">{t.for}</div><div className="pr">£{P[i].toLocaleString("en-GB")}<small>for both</small></div>
      <ul>{t.inc.map((x) => <li key={x}>{x}</li>)}</ul>
    </button>)}</div>
    <div className="m-opts m-none"><button type="button" role="radio" aria-checked={v === "none"} className={"m-opt" + (v === "none" ? " on" : "")} onClick={() => set("none")}><i></i><span>None of these would be right for me</span></button></div>
  </div>;
}
function VwM({ v, set, a, ver }) {
  const i = Math.max(0, M.TIERS.findIndex((t) => t.id === a.tier)), t = M.TIERS[i], cur = v || {};
  const Q = [["cheap", "So cheap you’d doubt the quality"], ["bargain", "A bargain, good value for money"], ["dear", "Getting expensive, but you’d still consider it"], ["too", "Too expensive to consider"]];
  return <div>
    <h1 className="m-q">What price would feel right for <em>{t.name}</em>?</h1>
    <p className="m-sub">For both of you together. Forget our price for a moment and go with your gut. Any of these can be left blank.</p>
    <div className="m-vw">{Q.map(([k, l]) => <label key={k} className="m-vwr"><span>{l}</span><span className="m-gbp"><span>£</span><input inputMode="numeric" value={cur[k] || ""} placeholder="0" onChange={(e) => set({ ...cur, [k]: e.target.value.replace(/[^\d]/g, "").slice(0, 6) })} /></span></label>)}</div>
  </div>;
}
function OptInM({ v, set, err }) {
  const cur = v || {}, O = [["launch", "Tell me when it launches"], ["chat", "I’d be happy to do a 30-minute chat"], ["pilot", "We’d try an early version together"]];
  const any = O.some(([k]) => cur[k]);
  return <div>
    <h1 className="m-q">Would you like to stay involved?</h1>
    <p className="m-sub">All optional. We’ll only use your email for what you tick here.</p>
    <div className="m-opts">{O.map(([k, l]) => <button key={k} type="button" role="checkbox" aria-checked={!!cur[k]} className={"m-opt sq" + (cur[k] ? " on" : "")} onClick={() => set({ ...cur, [k]: !cur[k] })}><i></i><span>{l}</span></button>)}</div>
    {any && <input className="m-in" type="email" autoComplete="email" placeholder="Your email address" aria-label="Email address" value={cur.email || ""} onChange={(e) => set({ ...cur, email: e.target.value })} />}
    {err && <p className="m-err" role="alert">{err}</p>}
  </div>;
}

const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || "").trim());
function answered(f, v) {
  const t = f.type || "one";
  if (f.optional || t === "text" || t === "vw" || t === "spend") return true;
  if (t === "many") return !!(v && v.length);
  if (t === "feat") return !!v && M.FEATURES.every(([id]) => v[id]);
  if (t === "optin") { const any = v && (v.launch || v.chat || v.pilot); return !any || emailOk(v.email); }
  return v != null && v !== "";
}
const visFields = (st, a) => st.fields.filter((f) => !f.when || f.when(a));

function FieldM({ f, a, set, ver, err }) {
  const v = a[f.k], s = (x) => set(f.k, x), t = f.type || "one";
  const body = { one: OneM, many: ManyM, scale: ScaleM, slider: SliderM, feat: FeatM, spend: SpendM, tiers: TiersM }[t];
  if (t === "vw") return <div className="m-field"><VwM v={v} set={s} a={a} ver={ver} /></div>;
  if (t === "optin") return <div className="m-field"><OptInM v={v} set={s} err={err} /></div>;
  return <div className="m-field">
    <h1 className="m-q">{f.q}</h1>{f.sub && <p className="m-sub">{f.sub}</p>}
    {t === "text" ? <textarea className="m-ta" placeholder={f.ph} value={v || ""} onChange={(e) => s(e.target.value)}></textarea> : React.createElement(body, { f, v, set: s, a, ver })}
    {f.k === "safe" && v && v !== "safe" && <div className="m-help" role="note"><b>You don’t have to go through this alone.</b><p>The National Domestic Abuse Helpline is free and confidential, any time: <a href="tel:08082000247">0808 2000 247</a>. If you’re in danger now, call 999. The “Leave quickly” button at the top closes this page straight away.</p></div>}
  </div>;
}

function StepM({ st, i, n, a, set, onNext, onBack, ver, last, label }) {
  const fs = visFields(st, a), ok = fs.every((f) => answered(f, a[f.k]));
  const [err, setErr] = useStateM("");
  const auto = useRefM(null);
  const single = fs.length === 1 && !fs[0].type;
  const setA = (k, x) => {
    setErr(""); set(k, x);
    if (single && k === fs[0].k && !(k === "safe" && x !== "safe")) { clearTimeout(auto.current); auto.current = setTimeout(onNext, 320); }
  };
  useEffectM(() => () => clearTimeout(auto.current), [st.id]);
  const next = () => { if (!ok) { setErr("Please add a valid email address, or untick the boxes."); return; } onNext(); };
  return <div className="m-step" key={st.id}>
    <div className="m-prog"><b>{st.sec}</b><div className="m-bar"><i style={{ width: `${((i + 1) / n) * 100}%` }}></i></div><span>{i + 1} of {n}</span></div>
    {st.note && <div className="m-note">{st.note}</div>}
    {fs.map((f) => <FieldM key={f.k} f={f} a={a} set={setA} ver={ver} err={f.type === "optin" ? err : ""} />)}
    <div className="m-nav"><button type="button" className="m-lnk" onClick={onBack}>Back</button><button type="button" className="m-btn" disabled={!ok && fs[0].type !== "optin"} onClick={next}>{label || (last ? "Finish" : "Continue")}<ArrowM /></button></div>
  </div>;
}

Object.assign(window, { StepM, ArrowM, visFields, answered, emailOk });
