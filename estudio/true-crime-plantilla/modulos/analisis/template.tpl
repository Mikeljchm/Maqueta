<!doctype html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/><script src="assets/gsap.min.js"></script><style>@font-face{font-family:DM;src:url(assets/dm-serif-display-latin-400-normal.woff2)}@font-face{font-family:IT;src:url(assets/inter-tight-latin-500-normal.woff2);font-weight:500}@font-face{font-family:IT;src:url(assets/inter-tight-latin-300-normal.woff2);font-weight:300}@font-face{font-family:SE;src:url(assets/special-elite-latin-400-normal.woff2)}@font-face{font-family:MO;src:url(assets/ibm-plex-mono-latin-500-normal.woff2)}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden;background:#070304}#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#070304}.full{position:absolute;inset:0}#bg{background:radial-gradient(ellipse 70% 70% at 50% 45%,#2c0b13 0%,#110408 60%,#050102 100%)}#grain{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.09;mix-blend-mode:overlay}#vig{background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 50%,rgba(0,0,0,.8) 100%)}#black{background:#000;opacity:1}
#cam{position:absolute;inset:0}
#hdr{position:absolute;left:0;right:0;top:70px;text-align:center;font:400 72px DM;color:#efe4da}
#sub{position:absolute;left:0;right:0;top:165px;text-align:center;font:500 28px IT;letter-spacing:.34em;color:#b9a79f}
#row{position:absolute;left:110px;top:260px;display:flex;gap:40px;perspective:1800px}
.cd{position:relative;width:395px;height:620px;transform-style:preserve-3d}
.fc{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;padding:34px 30px;box-shadow:0 24px 50px rgba(0,0,0,.6)}
.bk{background:#2a1418;border:3px solid #5a3a40;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.bk .n{font:400 180px/1 DM;color:#5a3a40}.bk .l{font:500 26px IT;letter-spacing:.3em;color:#8f7a76;margin-top:14px}
.fr{background:#ece5d6;transform:rotateY(180deg)}
.fr .k{font:500 24px IT;letter-spacing:.22em;color:#7a6b62}
.fr .t{font:400 50px/1.05 DM;color:#1c1613;margin-top:10px}
.fr .ln{height:3px;background:#1c1613;margin:18px 0}
.fr .r{font:400 34px/1.3 SE;color:#2b2420}
.fr .st{position:absolute;left:22px;right:22px;bottom:40px;text-align:center;font:500 33px IT;letter-spacing:.04em;color:#7a2a2a;border:5px solid #7a2a2a;padding:12px 4px;transform:rotate(-6deg)}
.cd.key .st{color:#c4182c;border-color:#c4182c;font-size:42px}
</style></head><body><div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080"><div id="scene" class="clip full" data-start="0" data-duration="__DUR__" data-track-index="0"><div id="bg" class="full"></div>
<div id="cam"><div id="hdr"></div><div id="sub"></div><div id="row"></div></div>
<div id="vig" class="full"></div><canvas id="grain" width="960" height="540"></canvas><div id="black" class="full"></div></div><audio id="mix" src="assets/mix.wav" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio></div>
<script>const DATA=/*DATA*/null;window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});const $=s=>document.querySelector(s);
$('#hdr').textContent=DATA.titulo; $('#sub').textContent=DATA.subtitulo;
DATA.items.forEach((it,i)=>{const c=document.createElement('div');c.className='cd'+(it.clave?' key':'');
 c.innerHTML='<div class="fc bk"><div class="n">'+(i+1)+'</div><div class="l"></div></div><div class="fc fr"><div class="k"></div><div class="t"></div><div class="ln"></div><div class="r"></div><div class="st"></div></div>';
 c.querySelector('.bk .l').textContent=it.dorso; c.querySelector('.k').textContent=it.k; c.querySelector('.t').textContent=it.t; c.querySelector('.r').textContent=it.r; c.querySelector('.st').textContent=it.sello; $('#row').appendChild(c)});
const cds=[...document.querySelectorAll('.cd')];
tl.fromTo('#black',{opacity:1},{opacity:0,duration:0.5,immediateRender:false},0.05);
tl.fromTo(['#hdr','#sub'],{opacity:0,y:-14},{opacity:1,y:0,duration:0.6,stagger:0.15,immediateRender:false},0.3);
tl.fromTo(cds,{opacity:0,y:60},{opacity:1,y:0,duration:0.6,stagger:0.12,ease:'power3.out',immediateRender:false},0.6);
const T0=DATA.inicio,P=DATA.paso;
cds.forEach((c,i)=>{const t=T0+i*P; const cx=110+i*435+197;
 tl.to('#cam',{x:(960-cx)*0.9,y:-60,scale:1.45,transformOrigin:cx+'px 570px',duration:0.6,ease:'power3.inOut'},t-0.3);
 tl.fromTo(c,{rotationY:0},{rotationY:180,duration:0.7,ease:'power3.inOut',immediateRender:false},t);
 tl.fromTo(c.querySelector('.st'),{opacity:0,scale:1.8},{opacity:0.95,scale:1,duration:0.16,ease:'power4.in',immediateRender:false},t+0.9);});
tl.to('#cam',{x:0,y:0,scale:1,duration:0.9,ease:'power3.inOut'},T0+cds.length*P-0.1);
const gc=$("#grain").getContext("2d");const gi=gc.createImageData(960,540);function grain(t){const fr=Math.floor(t*24);let s=(fr*9301+49297)%233280+1;const dd=gi.data;for(let i=0;i<dd.length;i+=4){s=(s*16807)%2147483647;const v=s&255;dd[i]=dd[i+1]=dd[i+2]=v;dd[i+3]=255;}gc.putImageData(gi,0,0);}const clock={t:0};tl.fromTo(clock,{t:0},{t:DATA.dur,duration:DATA.dur,ease:"none",immediateRender:false,onUpdate:()=>grain(tl.time())},0);tl.fromTo("#black",{opacity:0},{opacity:1,duration:0.5,immediateRender:false},DATA.dur-0.55);window.__timelines["main"]=tl;tl.seek(0);</script></body></html>
