<!doctype html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/><script src="assets/gsap.min.js"></script><style>@font-face{font-family:DM;src:url(assets/dm-serif-display-latin-400-normal.woff2)}@font-face{font-family:IT;src:url(assets/inter-tight-latin-500-normal.woff2);font-weight:500}@font-face{font-family:IT;src:url(assets/inter-tight-latin-300-normal.woff2);font-weight:300}@font-face{font-family:SE;src:url(assets/special-elite-latin-400-normal.woff2)}@font-face{font-family:MO;src:url(assets/ibm-plex-mono-latin-500-normal.woff2)}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden;background:#070304}#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#070304}.full{position:absolute;inset:0}#bg{background:radial-gradient(ellipse 70% 70% at 50% 45%,#2c0b13 0%,#110408 60%,#050102 100%)}#grain{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.09;mix-blend-mode:overlay}#vig{background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 50%,rgba(0,0,0,.8) 100%)}#black{background:#000;opacity:1}
#hdr{position:absolute;left:0;right:0;top:64px;text-align:center;font:400 70px DM;color:#efe4da}
#cam{position:absolute;inset:0}
#row{position:absolute;left:80px;top:220px;display:flex;gap:34px}
.bag{position:relative;width:325px;height:640px;background:rgba(235,240,245,.10);border:3px solid rgba(235,240,245,.35);border-radius:10px;padding:0 22px;opacity:0;
 background-image:linear-gradient(120deg,rgba(255,255,255,.10) 0%,rgba(255,255,255,0) 30%,rgba(255,255,255,.06) 55%,rgba(255,255,255,0) 70%)}
.bag .zip{height:22px;margin:0 -22px;border-bottom:3px dashed rgba(235,240,245,.45);background:rgba(235,240,245,.12)}
.bag .hd{margin:18px -6px 0;background:#c4182c;color:#fff;font:500 22px MO;letter-spacing:.08em;padding:8px 10px}
.bag svg{display:block;width:230px;height:230px;margin:34px auto 10px}
.bag .n{font:400 46px/1.08 DM;color:#efe4da;text-align:center}
.bag .st{position:absolute;left:18px;right:18px;bottom:34px;text-align:center;font:500 27px IT;letter-spacing:.06em;color:#ff6b7a;border:4px solid #ff6b7a;padding:10px 4px;transform:rotate(-5deg);opacity:0}
.bag.ok .st{color:#efe4da;border-color:#efe4da}
</style></head><body><div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080"><div id="scene" class="clip full" data-start="0" data-duration="__DUR__" data-track-index="0"><div id="bg" class="full"></div>
<div id="cam"><div id="hdr"></div><div id="row"></div></div>
<div id="vig" class="full"></div><canvas id="grain" width="960" height="540"></canvas><div id="black" class="full"></div></div><audio id="mix" src="assets/mix.wav" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio></div>
<script>const DATA=/*DATA*/null;window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});const $=s=>document.querySelector(s);
const S='fill="none" stroke="#efe4da" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
const IC={envase:'<svg viewBox="0 0 100 100"><path '+S+' d="M34 30 L34 22 L66 22 L66 30 C78 34 82 42 82 52 L82 90 L18 90 L18 52 C18 42 22 34 34 30 Z"/><path '+S+' d="M40 22 L40 12 L60 12 L60 22"/><path d="M30 58 L70 58 L70 76 L30 76 Z" fill="#ff2e4a" opacity=".85"/><path d="M38 12 L62 6" stroke="#ff2e4a" stroke-width="4"/></svg>',
 blusa:'<svg viewBox="0 0 100 100"><path '+S+' d="M36 12 L50 22 L64 12 L88 26 L80 44 L70 40 L70 90 L30 90 L30 40 L20 44 L12 26 Z"/><path d="M50 22 L50 56" stroke="#efe4da" stroke-width="3" stroke-dasharray="4 5"/></svg>',
 bota:'<svg viewBox="0 0 100 100"><path '+S+' d="M30 8 L58 8 L58 58 L84 70 C90 74 90 86 84 88 L22 88 L22 70 L30 60 Z"/><path d="M26 92 L32 84 L36 92 L42 82 L46 92 L54 84 L58 92" stroke="#5fcf6a" stroke-width="5" fill="none" stroke-linecap="round"/></svg>',
 anillo:'<svg viewBox="0 0 100 100"><circle cx="50" cy="60" r="28" '+S+' stroke-width="9"/><path d="M38 32 L50 14 L62 32 Z" fill="#ff2e4a"/></svg>',
 camara:'<svg viewBox="0 0 100 100"><path '+S+' d="M10 34 L32 34 L38 24 L62 24 L68 34 L90 34 L90 80 L10 80 Z"/><circle cx="50" cy="57" r="15" '+S+'/><circle cx="78" cy="44" r="3" fill="#ff2e4a"/></svg>'};
$('#hdr').textContent=DATA.titulo;
DATA.items.forEach((it,i)=>{const b=document.createElement('div');b.className='bag'+(it.ok?' ok':'');
 b.innerHTML='<div class="zip"></div><div class="hd"></div>'+IC[it.ic]+'<div class="n"></div><div class="st"></div>';
 b.querySelector('.hd').textContent='EVIDENCIA Nº '+String(i+1).padStart(2,'0'); b.querySelector('.n').textContent=it.n; b.querySelector('.st').textContent=it.st; $('#row').appendChild(b)});
const bags=[...document.querySelectorAll('.bag')]; gsap.set(bags,{rotation:i=>[-2,1.5,-1,2,-1.5][i%5]});
tl.fromTo('#black',{opacity:1},{opacity:0,duration:0.5,immediateRender:false},0.05);
tl.fromTo('#hdr',{opacity:0,y:-14},{opacity:1,y:0,duration:0.6,immediateRender:false},0.3);
const T0=DATA.inicio,P=DATA.paso;
bags.forEach((b,i)=>{const t=T0+i*P, cx=80+i*359+162;
 tl.to('#cam',{x:(960-cx)*0.85,y:-30,scale:1.32,transformOrigin:cx+'px 540px',duration:0.55,ease:'power3.inOut'},t-0.35);
 tl.fromTo(b,{opacity:0,y:-80},{opacity:1,y:0,duration:0.4,ease:'power3.out',immediateRender:false},t-0.1);
 tl.fromTo(b.querySelector('.st'),{opacity:0,scale:1.8},{opacity:1,scale:1,duration:0.15,ease:'power4.in',immediateRender:false},t+0.75);});
tl.to('#cam',{x:0,y:0,scale:1,duration:0.9,ease:'power3.inOut'},T0+bags.length*P-0.2);
const gc=$("#grain").getContext("2d");const gi=gc.createImageData(960,540);function grain(t){const fr=Math.floor(t*24);let s=(fr*9301+49297)%233280+1;const dd=gi.data;for(let i=0;i<dd.length;i+=4){s=(s*16807)%2147483647;const v=s&255;dd[i]=dd[i+1]=dd[i+2]=v;dd[i+3]=255;}gc.putImageData(gi,0,0);}const clock={t:0};tl.fromTo(clock,{t:0},{t:DATA.dur,duration:DATA.dur,ease:"none",immediateRender:false,onUpdate:()=>grain(tl.time())},0);tl.fromTo("#black",{opacity:0},{opacity:1,duration:0.5,immediateRender:false},DATA.dur-0.55);window.__timelines["main"]=tl;tl.seek(0);</script></body></html>
