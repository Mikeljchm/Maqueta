<!doctype html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/><script src="assets/gsap.min.js"></script><style>@font-face{font-family:DM;src:url(assets/dm-serif-display-latin-400-normal.woff2)}@font-face{font-family:IT;src:url(assets/inter-tight-latin-500-normal.woff2);font-weight:500}@font-face{font-family:IT;src:url(assets/inter-tight-latin-300-normal.woff2);font-weight:300}@font-face{font-family:SE;src:url(assets/special-elite-latin-400-normal.woff2)}@font-face{font-family:MO;src:url(assets/ibm-plex-mono-latin-500-normal.woff2)}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden;background:#070304}#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#070304}.full{position:absolute;inset:0}#bg{background:radial-gradient(ellipse 70% 70% at 50% 45%,#2c0b13 0%,#110408 60%,#050102 100%)}#grain{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.09;mix-blend-mode:overlay}#vig{background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 50%,rgba(0,0,0,.8) 100%)}#black{background:#000;opacity:1}
#cam{position:absolute;left:0;top:0;width:8000px;height:1080px}
#axis{position:absolute;left:0;top:560px;height:4px;background:rgba(239,228,218,.25)}
#prog{position:absolute;left:0;top:558px;height:8px;background:#e0233f;box-shadow:0 0 20px rgba(224,35,63,.7);transform-origin:0 50%}
.ev{position:absolute;top:0;width:0;height:1080px}
.ev .dot{position:absolute;left:-14px;top:548px;width:28px;height:28px;border-radius:50%;background:#efe4da;box-shadow:0 0 0 6px rgba(239,228,218,.15)}
.ev .stem{position:absolute;left:-1.5px;width:3px;background:rgba(239,228,218,.5)}
.ev .card{position:absolute;left:-260px;width:520px;text-align:center}
.ev .d{font:500 40px MO;color:#e3324b;letter-spacing:.04em}
.ev .t{font:400 58px/1.12 DM;color:#efe4da;margin-top:10px;text-wrap:balance}
.ev.up .stem{top:330px;height:218px}.ev.up .card{bottom:760px}
.ev.dn .stem{top:576px;height:200px}.ev.dn .card{top:790px}
.ev.key .dot{background:#ff2e4a;box-shadow:0 0 30px 8px rgba(255,46,74,.6)}
#hdr{position:absolute;left:70px;top:56px;font:500 30px IT;letter-spacing:.34em;color:#b9a79f}
</style></head><body><div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080"><div id="scene" class="clip full" data-start="0" data-duration="__DUR__" data-track-index="0"><div id="bg" class="full"></div>
<div id="cam"><div id="axis"></div><div id="prog"></div><div id="evs"></div></div><div id="hdr"></div>
<div id="vig" class="full"></div><canvas id="grain" width="960" height="540"></canvas><div id="black" class="full"></div></div><audio id="mix" src="assets/mix.wav" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio></div>
<script>const DATA=/*DATA*/null;window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});const $=s=>document.querySelector(s);
$('#hdr').textContent=DATA.titulo; const GAP=DATA.gap, X0=900;
DATA.eventos.forEach((e,i)=>{const d=document.createElement('div');d.className='ev '+(i%2?'dn':'up')+(e[2]?' key':'');d.style.left=(X0+i*GAP)+'px';
 d.innerHTML='<div class="stem"></div><div class="dot"></div><div class="card"><div class="d"></div><div class="t"></div></div>';d.querySelector('.d').textContent=e[0];d.querySelector('.t').textContent=e[1];$('#evs').appendChild(d)});
const L=X0+(DATA.eventos.length-1)*GAP+900; $('#axis').style.width=L+'px'; $('#prog').style.width=L+'px';
const evs=[...document.querySelectorAll('.ev')]; gsap.set(evs,{opacity:0}); gsap.set('#prog',{scaleX:0});
tl.fromTo('#black',{opacity:1},{opacity:0,duration:0.5,immediateRender:false},0.05);
const T0=DATA.inicio, P=DATA.paso;
evs.forEach((e,i)=>{const t=T0+i*P; const x=X0+i*GAP;
 tl.to('#cam',{x:960-x,duration:P*0.55,ease:'power3.inOut'},t-P*0.55);
 tl.to('#prog',{scaleX:x/L,duration:P*0.55,ease:'power3.inOut'},t-P*0.55);
 tl.fromTo(e,{opacity:0,y:e.classList.contains('up')?-24:24},{opacity:1,y:0,duration:0.35,ease:'power3.out',immediateRender:false},t-0.1);
 tl.fromTo(e.querySelector('.dot'),{scale:2.4},{scale:1,duration:0.3,ease:'back.out(3)',immediateRender:false},t-0.1);});
tl.to('#cam',{x:960-(X0+(evs.length-1)*GAP/2),scale:0.42,transformOrigin:'50% 50%',duration:1.2,ease:'power3.inOut'},T0+evs.length*P-0.3);
gsap.set('#cam',{x:960-X0});
const gc=$("#grain").getContext("2d");const gi=gc.createImageData(960,540);function grain(t){const fr=Math.floor(t*24);let s=(fr*9301+49297)%233280+1;const dd=gi.data;for(let i=0;i<dd.length;i+=4){s=(s*16807)%2147483647;const v=s&255;dd[i]=dd[i+1]=dd[i+2]=v;dd[i+3]=255;}gc.putImageData(gi,0,0);}const clock={t:0};tl.fromTo(clock,{t:0},{t:DATA.dur,duration:DATA.dur,ease:"none",immediateRender:false,onUpdate:()=>grain(tl.time())},0);tl.fromTo("#black",{opacity:0},{opacity:1,duration:0.5,immediateRender:false},DATA.dur-0.55);window.__timelines["main"]=tl;tl.seek(0);</script></body></html>
