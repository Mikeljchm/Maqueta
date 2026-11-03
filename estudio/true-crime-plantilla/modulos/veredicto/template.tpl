<!doctype html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/><script src="assets/gsap.min.js"></script><style>@font-face{font-family:DM;src:url(assets/dm-serif-display-latin-400-normal.woff2)}@font-face{font-family:IT;src:url(assets/inter-tight-latin-500-normal.woff2);font-weight:500}@font-face{font-family:IT;src:url(assets/inter-tight-latin-300-normal.woff2);font-weight:300}@font-face{font-family:SE;src:url(assets/special-elite-latin-400-normal.woff2)}@font-face{font-family:MO;src:url(assets/ibm-plex-mono-latin-500-normal.woff2)}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden;background:#070304}#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#070304}.full{position:absolute;inset:0}#bg{background:radial-gradient(ellipse 70% 70% at 50% 45%,#2c0b13 0%,#110408 60%,#050102 100%)}#grain{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.09;mix-blend-mode:overlay}#vig{background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 50%,rgba(0,0,0,.8) 100%)}#black{background:#000;opacity:1}
#hdr{position:absolute;left:0;right:0;top:80px;text-align:center;font:500 34px IT;letter-spacing:.38em;padding-left:.38em;color:#e3324b}
#ttl{position:absolute;left:0;right:0;top:135px;text-align:center;font:400 96px DM;color:#efe4da}
.side{position:absolute;top:300px;width:760px;height:560px;padding:44px 50px;background:rgba(239,228,218,.05);border:2px solid rgba(239,228,218,.18)}
#L{left:150px}#R{left:1010px}
.side .k{font:500 28px IT;letter-spacing:.3em;color:#b9a79f}
.side .n{font:400 70px/1.05 DM;color:#efe4da;margin-top:16px;white-space:nowrap}
.side .c{font:500 34px IT;color:#d9c9bd;margin-top:22px;letter-spacing:.04em}
.side .st{position:absolute;left:50px;bottom:120px;font:500 76px IT;letter-spacing:.14em;padding:12px 30px;border:7px solid;transform:rotate(-5deg)}
.side .x{position:absolute;left:50px;right:40px;bottom:40px;font:500 32px IT;color:#efe4da}
#L .st{color:#efe4da;border-color:#efe4da}#R .st{color:#ff2e4a;border-color:#ff2e4a}
#foot{position:absolute;left:0;right:0;top:920px;text-align:center;font:400 54px DM;color:#efe4da}
#flash{background:#fff;opacity:0}
</style></head><body><div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080"><div id="scene" class="clip full" data-start="0" data-duration="__DUR__" data-track-index="0"><div id="bg" class="full"></div>
<div id="hdr"></div><div id="ttl">Veredicto</div>
<div class="side" id="L"><div class="k"></div><div class="n"></div><div class="c"></div><div class="st"></div><div class="x"></div></div>
<div class="side" id="R"><div class="k"></div><div class="n"></div><div class="c"></div><div class="st"></div><div class="x"></div></div>
<div id="foot"></div><div id="flash" class="full"></div>
<div id="vig" class="full"></div><canvas id="grain" width="960" height="540"></canvas><div id="black" class="full"></div></div><audio id="mix" src="assets/mix.wav" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio></div>
<script>const DATA=/*DATA*/null;window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});const $=s=>document.querySelector(s);
$('#hdr').textContent=DATA.encabezado; $('#foot').textContent=DATA.pie;
[['#L',DATA.izq],['#R',DATA.der]].forEach(([s,d])=>{const e=$(s);e.querySelector('.k').textContent=d.k;e.querySelector('.n').textContent=d.n;e.querySelector('.c').textContent=d.c;e.querySelector('.st').textContent=d.st;e.querySelector('.x').textContent=d.x||''});
tl.fromTo('#black',{opacity:1},{opacity:0,duration:0.5,immediateRender:false},0.05);
tl.fromTo('#hdr',{opacity:0},{opacity:1,duration:0.6,immediateRender:false},0.3);
tl.fromTo('#ttl',{opacity:0,scale:1.08},{opacity:1,scale:1,duration:0.8,ease:'power3.out',immediateRender:false},0.5);
tl.fromTo('.side',{opacity:0,y:40},{opacity:1,y:0,duration:0.7,stagger:0.25,ease:'power3.out',immediateRender:false},1.2);
gsap.set(['.side .st','.side .x','#foot'],{opacity:0});
const T=DATA.golpes;
[['#L',T[0]],['#R',T[1]]].forEach(([s,t])=>{
 tl.fromTo(s+' .st',{opacity:0,scale:2.2},{opacity:1,scale:1,duration:0.14,ease:'power4.in',immediateRender:false},t);
 tl.fromTo('#flash',{opacity:0},{opacity:0.35,duration:0.02,immediateRender:false},t+0.14);
 tl.fromTo('#flash',{opacity:0.35},{opacity:0,duration:0.3,immediateRender:false},t+0.16);
 tl.fromTo(s+' .x',{opacity:0},{opacity:1,duration:0.5,immediateRender:false},t+0.5);});
tl.fromTo('#foot',{opacity:0,y:20},{opacity:1,y:0,duration:0.7,immediateRender:false},T[2]);
const gc=$("#grain").getContext("2d");const gi=gc.createImageData(960,540);function grain(t){const fr=Math.floor(t*24);let s=(fr*9301+49297)%233280+1;const dd=gi.data;for(let i=0;i<dd.length;i+=4){s=(s*16807)%2147483647;const v=s&255;dd[i]=dd[i+1]=dd[i+2]=v;dd[i+3]=255;}gc.putImageData(gi,0,0);}const clock={t:0};tl.fromTo(clock,{t:0},{t:DATA.dur,duration:DATA.dur,ease:"none",immediateRender:false,onUpdate:()=>grain(tl.time())},0);tl.fromTo("#black",{opacity:0},{opacity:1,duration:0.5,immediateRender:false},DATA.dur-0.55);window.__timelines["main"]=tl;tl.seek(0);</script></body></html>
