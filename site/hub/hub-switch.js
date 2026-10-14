/* Hub switcher, shared by the hubs and Results. Add new hubs to HUBS.
   On decouple.uk (owner signed in) it also shows what the public site is doing, and Sign out. Settings live in the Site settings hub. */
(function(){
var HUBS=[
{id:'proto',name:'Prototype hub',sub:'The journey in 10 linked prototypes',href:'Decouple · Prototype Hub.html'},
{id:'mkt',name:'Marketing hub',sub:'Collateral, experiments and research',href:'Decouple · Marketing Hub.html'},
{id:'results',name:'Results',sub:'Answers from every test, charted',href:'Decouple · Results.html'},
{id:'site',name:'Site settings',sub:'Guide or holding page, tester codes, test mode',href:'Decouple · Site Settings.html'}
];
var css='.hsw{position:relative;padding-left:16px;border-left:1px solid rgba(255,255,255,.18)}'+
'.hsw-b{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 8px;margin-left:-8px;border-radius:8px;font:400 12px Inter,sans-serif;color:rgba(255,255,255,.6);transition:.15s}.hsw-b:hover,.hsw.open .hsw-b{color:#FFF;background:rgba(255,255,255,.08)}.hsw-b:focus-visible{outline:2px solid #7C3AED}'+
'.hsw-b svg{width:12px;height:12px;transition:transform .2s}.hsw.open .hsw-b svg{transform:rotate(180deg)}'+
'.hsw-m{position:absolute;top:calc(100% + 12px);left:4px;width:320px;padding:6px;border-radius:16px;background:#221E2C;border:1px solid rgba(255,255,255,.1);box-shadow:0 24px 60px -12px rgba(0,0,0,.5);opacity:0;transform:translateY(-4px);pointer-events:none;transition:.16s;z-index:30;font-family:Inter,sans-serif}.hsw.open .hsw-m{opacity:1;transform:none;pointer-events:auto}'+
'.hsw-h{padding:8px 10px 6px;font:600 10px Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.4)}'+
'.hsw-i{display:grid;grid-template-columns:minmax(0,1fr) 16px;align-items:center;gap:10px;padding:10px;border-radius:10px;color:#FFF;text-decoration:none}.hsw-i:hover{background:rgba(255,255,255,.07);color:#FFF}.hsw-i b{display:block;font-size:13.5px;font-weight:600}.hsw-i small{display:block;margin-top:2px;font-size:12px;color:rgba(255,255,255,.55)}.hsw-i svg{width:16px;height:16px;color:#A78BFA}'+
'.hsw-site{margin:6px 4px 4px;padding:12px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);display:grid;gap:10px;color:#FFF}'+
'.hsw-site .t{display:flex;justify-content:space-between;align-items:center;font:600 10px Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.5)}.hsw-site .t i{font-style:normal;letter-spacing:0;text-transform:none;font-weight:500;font-size:11px;color:#6EE7B7}'+
'.hsw-seg{display:grid;grid-template-columns:1fr 1fr;gap:2px;padding:3px;border-radius:10px;background:rgba(0,0,0,.25)}.hsw-seg button{all:unset;cursor:pointer;text-align:center;height:30px;border-radius:8px;font-size:12.5px;font-weight:500;color:rgba(255,255,255,.7)}.hsw-seg button.on{background:#FFF;color:#17141F;font-weight:600}.hsw-seg button:hover:not(.on){color:#FFF}'+
'.hsw-row{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12.5px;color:rgba(255,255,255,.85)}'+
'.hsw-tg{all:unset;cursor:pointer;width:34px;height:20px;border-radius:99px;background:rgba(255,255,255,.2);position:relative;transition:.15s;flex-shrink:0}.hsw-tg:after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:99px;background:#FFF;transition:.15s}.hsw-tg.on{background:#7C3AED}.hsw-tg.on:after{left:16px}'+
'.hsw-acts{display:flex;gap:6px;flex-wrap:wrap}.hsw-acts button,.hsw-acts a{all:unset;cursor:pointer;height:28px;padding:0 10px;border-radius:8px;background:rgba(255,255,255,.08);font-size:12px;font-weight:500;color:#FFF;display:inline-flex;align-items:center}.hsw-acts button:hover,.hsw-acts a:hover{background:rgba(255,255,255,.14)}.hsw-acts button[disabled]{opacity:.5;pointer-events:none}'+
'.hsw-note{font-size:11.5px;line-height:1.45;color:rgba(255,255,255,.55)}.hsw-note.err{color:#FCA5A5}'+
'.hsw-site[aria-disabled=true] .hsw-seg,.hsw-site[aria-disabled=true] .hsw-row,.hsw-site[aria-disabled=true] .hsw-acts{opacity:.4;pointer-events:none}'+
'@media (max-width:720px){.hsw{padding-left:12px}.hsw-l{display:none}.hsw-m{left:auto;right:-60px}}';
var s=document.createElement('style');s.textContent=css;document.head.appendChild(s);
function dc(){return window.DC?Promise.resolve(window.DC):new Promise(function(res){var e=document.querySelector('script[src*="shared/dc-site.js"]');if(!e){e=document.createElement('script');e.src='shared/dc-site.js';document.head.appendChild(e)}e.addEventListener('load',function(){res(window.DC)});setTimeout(function(){res(window.DC||null)},4000)})}
function site(box){
dc().then(function(D){if(!D)return box.remove();D.session().then(function(x){
if(!x||!x.owner)return box.remove();
box.innerHTML='<div class="t">decouple.uk<i>'+(x.mode==='guide'?'Showing the guide':'Showing the holding page')+'</i></div>'+
'<div class="hsw-note">Tester code '+(x.requireCode?'needed':'not needed')+(x.testing?' · <b style="color:#FDE68A">Test mode on</b>':'')+'</div>'+
'<div class="hsw-acts"><a href="Decouple · Site Settings.html">Change settings</a><a href="/" target="_blank" rel="noopener">Open decouple.uk</a><button type="button" data-out>Sign out</button></div>';
box.querySelector('[data-out]').onclick=async function(){await D.logout();location.href='/'};
})});
}
function mount(el){
if(el.dataset.hswDone)return;el.dataset.hswDone='1';
var cur=HUBS.filter(function(h){return h.id===el.dataset.hubsw})[0]||HUBS[0];
el.classList.add('hsw');
el.innerHTML='<button class="hsw-b" type="button" aria-haspopup="true" aria-expanded="false">'+cur.name+'<span class="hsw-l"> · '+(el.dataset.date||'')+'</span><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4.5l3 3 3-3"></path></svg></button>'+
'<div class="hsw-m" role="menu"><div class="hsw-h">Decouple hubs</div>'+HUBS.map(function(h){return '<a class="hsw-i" role="menuitem" href="'+h.href+'"'+(h.id===cur.id?' aria-current="page"':'')+'><span><b>'+h.name+'</b><small>'+h.sub+'</small></span>'+(h.id===cur.id?'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.2l3 3 6-6.4"></path></svg>':'<span></span>')+'</a>'}).join('')+'<div class="hsw-site"></div></div>';
var b=el.querySelector('.hsw-b');
function set(o){el.classList.toggle('open',o);b.setAttribute('aria-expanded',o)}
b.addEventListener('click',function(e){e.stopPropagation();set(!el.classList.contains('open'))});
document.addEventListener('click',function(e){if(!el.contains(e.target))set(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});
site(el.querySelector('.hsw-site'));
}
window.HubSwitch={mount:mount};
document.querySelectorAll('[data-hubsw]').forEach(mount);
})();
