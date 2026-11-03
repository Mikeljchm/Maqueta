<!doctype html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/><script src="assets/gsap.min.js"></script><style>@font-face{font-family:DM;src:url(assets/dm-serif-display-latin-400-normal.woff2)}@font-face{font-family:IT;src:url(assets/inter-tight-latin-500-normal.woff2);font-weight:500}@font-face{font-family:IT;src:url(assets/inter-tight-latin-300-normal.woff2);font-weight:300}@font-face{font-family:SE;src:url(assets/special-elite-latin-400-normal.woff2)}@font-face{font-family:MO;src:url(assets/ibm-plex-mono-latin-500-normal.woff2)}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden;background:#070304}#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#070304}.full{position:absolute;inset:0}#bg{background:radial-gradient(ellipse 70% 70% at 50% 45%,#2c0b13 0%,#110408 60%,#050102 100%)}#grain{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.09;mix-blend-mode:overlay}#vig{background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 50%,rgba(0,0,0,.8) 100%)}#black{background:#000;opacity:1}
#ttl{position:absolute;left:0;right:0;top:70px;text-align:center;font:500 32px IT;letter-spacing:.4em;padding-left:.4em;color:#e3324b}
#div{position:absolute;left:958px;top:170px;width:4px;height:760px;background:#e0233f;transform-origin:50% 0}
.col{position:absolute;top:200px;width:760px}
#A{left:130px}#B{left:1030px}
.col .k{font:500 30px IT;letter-spacing:.3em;color:#b9a79f}
.col .w{font:300 28px IT;color:#9d8c86;margin-top:8px}
.col .q{font:400 60px/1.22 DM;color:#efe4da;margin-top:34px;text-wrap:pretty}
.col .qm{font:400 200px/0.6 DM;color:#e0233f;height:80px;margin-top:40px}
#foot{position:absolute;left:0;right:0;top:960px;text-align:center;font:500 34px IT;letter-spacing:.2em;color:#d9c9bd}
</style></head><body><div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080"><div id="scene" class="clip full" data-start="0" data-duration="__DUR__" data-track-index="0"><div id="bg" class="full"></div>
<div id="ttl"></div><div id="div"></div>
<div class="col" id="A"><div class="k"></div><div class="w"></div><div class="qm">“</div><div class="q"></div></div>
<div class="col" id="B"><div class="k"></div><div class="w"></div><div class="qm">“</div><div class="q"></div></div>
<div id="foot"></div>
<div id="vig" class="full"></div><canvas id="grain" width="960" height="540"></canvas><div id="black" class="full"></div></div><audio id="mix" src="assets/mix.wav" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio></div>
<script>const DATA=/*DATA*/null;window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});const $=s=>document.querySelector(s);
$('#ttl').textContent=DATA.titulo; $('#foot').textContent=DATA.pie;
[['#A',DATA.a],['#B',DATA.b]].forEach(([s,d])=>{const e=$(s);e.querySelector('.k').textContent=d.k;e.querySelector('.w').textContent=d.w;e.querySelector('.q').textContent=d.q});
gsap.set('#div',{scaleY:0}); gsap.set(['#A','#B','#foot'],{opacity:0});
tl.fromTo('#black',{opacity:1},{opacity:0,duration:0.5,immediateRender:false},0.05);
tl.fromTo('#ttl',{opacity:0},{opacity:1,duration:0.6,immediateRender:false},0.3);
tl.fromTo('#div',{scaleY:0},{scaleY:1,duration:0.9,ease:'power3.inOut',immediateRender:false},0.5);
const T=DATA.tiempos;
tl.fromTo('#A',{opacity:0,x:-40},{opacity:1,x:0,duration:0.7,ease:'power3.out',immediateRender:false},T[0]);
tl.fromTo('#B',{opacity:0,x:40},{opacity:0.25,x:0,duration:0.7,ease:'power3.out',immediateRender:false},T[0]+0.2);
tl.to('#A',{opacity:0.3,duration:0.5},T[1]); tl.to('#B',{opacity:1,duration:0.5},T[1]);
tl.to('#A',{opacity:1,duration:0.6},T[2]);
tl.fromTo('#foot',{opacity:0,y:16},{opacity:1,y:0,duration:0.6,immediateRender:false},T[2]+0.2);
const gc=$("#grain").getContext("2d");const gi=gc.createImageData(960,540);function grain(t){const fr=Math.floor(t*24);let s=(fr*9301+49297)%233280+1;const dd=gi.data;for(let i=0;i<dd.length;i+=4){s=(s*16807)%2147483647;const v=s&255;dd[i]=dd[i+1]=dd[i+2]=v;dd[i+3]=255;}gc.putImageData(gi,0,0);}const clock={t:0};tl.fromTo(clock,{t:0},{t:DATA.dur,duration:DATA.dur,ease:"none",immediateRender:false,onUpdate:()=>grain(tl.time())},0);tl.fromTo("#black",{opacity:0},{opacity:1,duration:0.5,immediateRender:false},DATA.dur-0.55);window.__timelines["main"]=tl;tl.seek(0);</script></body></html>
