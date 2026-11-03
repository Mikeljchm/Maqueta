<!doctype html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/><script src="assets/gsap.min.js"></script><style>@font-face{font-family:DM;src:url(assets/dm-serif-display-latin-400-normal.woff2)}@font-face{font-family:IT;src:url(assets/inter-tight-latin-500-normal.woff2);font-weight:500}@font-face{font-family:IT;src:url(assets/inter-tight-latin-300-normal.woff2);font-weight:300}@font-face{font-family:SE;src:url(assets/special-elite-latin-400-normal.woff2)}@font-face{font-family:MO;src:url(assets/ibm-plex-mono-latin-500-normal.woff2)}*{margin:0;padding:0;box-sizing:border-box}html,body{width:1920px;height:1080px;overflow:hidden;background:#070304}#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#070304}.full{position:absolute;inset:0}#bg{background:radial-gradient(ellipse 70% 70% at 50% 45%,#2c0b13 0%,#110408 60%,#050102 100%)}#grain{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.09;mix-blend-mode:overlay}#vig{background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 50%,rgba(0,0,0,.8) 100%)}#black{background:#000;opacity:1}
#hdr{position:absolute;left:70px;top:56px;font:500 30px IT;letter-spacing:.34em;color:#b9a79f}
#cam{position:absolute;left:0;top:0;width:6000px;height:1080px}
#arrows{position:absolute;left:0;top:0;width:6000px;height:1080px;overflow:visible}
.nd{position:absolute;top:300px;width:420px;margin-left:-210px;text-align:center;opacity:0}
.nd .ic{width:240px;height:240px;margin:0 auto;border-radius:50%;border:5px solid #efe4da;background:rgba(239,228,218,.06);display:flex;align-items:center;justify-content:center}
.nd.key .ic{border-color:#ff2e4a;box-shadow:0 0 40px rgba(255,46,74,.5)}
.nd svg{width:150px;height:150px}
.nd .n{font:400 62px/1.1 DM;color:#efe4da;margin-top:34px}
.nd .r{font:500 30px IT;letter-spacing:.16em;color:#e7b3b3;margin-top:12px}
</style></head><body><div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080"><div id="scene" class="clip full" data-start="0" data-duration="__DUR__" data-track-index="0"><div id="bg" class="full"></div>
<div id="cam"><svg id="arrows" viewBox="0 0 6000 1080"></svg><div id="nodes"></div></div><div id="hdr"></div>
<div id="vig" class="full"></div><canvas id="grain" width="960" height="540"></canvas><div id="black" class="full"></div></div><audio id="mix" src="assets/mix.wav" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio></div>
<script>const DATA=/*DATA*/null;window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});const $=s=>document.querySelector(s);
const IC={persona:'<svg viewBox="0 0 100 100"><circle cx="50" cy="32" r="18" fill="#efe4da"/><path d="M14 96 C14 66 30 56 50 56 C70 56 86 66 86 96 Z" fill="#efe4da"/></svg>',
 tv:'<svg viewBox="0 0 100 100"><rect x="10" y="22" width="80" height="58" rx="8" fill="none" stroke="#efe4da" stroke-width="6"/><path d="M36 8 L50 22 L64 8" fill="none" stroke="#efe4da" stroke-width="6"/><circle cx="50" cy="47" r="10" fill="#ff2e4a"/><path d="M38 70 C40 60 60 60 62 70" fill="#ff2e4a"/><path d="M30 92 L70 92" stroke="#efe4da" stroke-width="6"/></svg>',
 abogado:'<svg viewBox="0 0 100 100"><rect x="14" y="34" width="72" height="50" rx="6" fill="none" stroke="#efe4da" stroke-width="6"/><path d="M38 34 L38 22 L62 22 L62 34" fill="none" stroke="#efe4da" stroke-width="6"/><path d="M14 54 L86 54" stroke="#efe4da" stroke-width="5"/></svg>',
 fiscalia:'<svg viewBox="0 0 100 100"><path d="M50 12 L50 88 M26 88 L74 88 M18 28 L82 28" stroke="#efe4da" stroke-width="6" fill="none"/><path d="M18 28 L8 56 L28 56 Z M82 28 L72 56 L92 56 Z" fill="none" stroke="#efe4da" stroke-width="5" stroke-linejoin="round"/></svg>',
 anillo:'<svg viewBox="0 0 100 100"><circle cx="50" cy="60" r="28" fill="none" stroke="#efe4da" stroke-width="8"/><path d="M38 32 L50 14 L62 32 Z" fill="#ff2e4a"/></svg>',
 cerro:'<svg viewBox="0 0 100 100"><path d="M6 86 L38 34 L54 58 L66 42 L94 86 Z" fill="none" stroke="#efe4da" stroke-width="6" stroke-linejoin="round"/><circle cx="72" cy="74" r="6" fill="#ff2e4a"/></svg>'};
$('#hdr').textContent=DATA.titulo; const GAP=DATA.gap, X0=700;
DATA.nodos.forEach((n,i)=>{const d=document.createElement('div');d.className='nd'+(n[3]?' key':'');d.style.left=(X0+i*GAP)+'px';
 d.innerHTML='<div class="ic">'+IC[n[0]]+'</div><div class="n"></div><div class="r"></div>';d.querySelector('.n').textContent=n[1];d.querySelector('.r').textContent=n[2];$('#nodes').appendChild(d);
 if(i>0){const x1=X0+(i-1)*GAP+135,x2=X0+i*GAP-150,y=420; const p=document.createElementNS('http://www.w3.org/2000/svg','path');
  p.setAttribute('d','M'+x1+' '+y+' Q '+((x1+x2)/2)+' '+(y-70)+' '+x2+' '+y);p.setAttribute('fill','none');p.setAttribute('stroke','#e0233f');p.setAttribute('stroke-width','6');p.setAttribute('stroke-dasharray','14 12');p.setAttribute('class','ar');
  const h=document.createElementNS('http://www.w3.org/2000/svg','path');h.setAttribute('d','M'+(x2-22)+' '+(y-16)+' L'+x2+' '+y+' L'+(x2-24)+' '+(y+12));h.setAttribute('fill','none');h.setAttribute('stroke','#e0233f');h.setAttribute('stroke-width','6');h.setAttribute('class','ah');
  $('#arrows').append(p,h);}});
const nds=[...document.querySelectorAll('.nd')], ars=[...document.querySelectorAll('.ar')], ahs=[...document.querySelectorAll('.ah')];
ars.forEach(a=>{const L=a.getTotalLength();a.dataset.L=L;gsap.set(a,{attr:{'stroke-dashoffset':0}});a.style.clipPath='inset(0 100% 0 0)';}); gsap.set(ahs,{opacity:0});
tl.fromTo('#black',{opacity:1},{opacity:0,duration:0.5,immediateRender:false},0.05);
const T0=DATA.inicio,P=DATA.paso; gsap.set('#cam',{x:960-X0});
nds.forEach((n,i)=>{const t=T0+i*P, x=X0+i*GAP;
 if(i>0){tl.to('#cam',{x:960-x+(i<nds.length-1?0:0),duration:P*0.6,ease:'power3.inOut'},t-P*0.6);
  tl.fromTo(ars[i-1],{clipPath:'inset(0% 100% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:P*0.55,ease:'power2.inOut',immediateRender:false},t-P*0.6);
  tl.fromTo(ahs[i-1],{opacity:0},{opacity:1,duration:0.1,immediateRender:false},t-0.1);}
 tl.fromTo(n,{opacity:0,scale:0.7},{opacity:1,scale:1,duration:0.35,ease:'back.out(2.2)',immediateRender:false},t);});
const cx=X0+(nds.length-1)*GAP/2;
tl.to('#cam',{x:960-cx*0.5,y:540-480*0.5-40,scale:0.5,transformOrigin:'0 0',duration:1.3,ease:'power3.inOut'},T0+nds.length*P-0.2);
const gc=$("#grain").getContext("2d");const gi=gc.createImageData(960,540);function grain(t){const fr=Math.floor(t*24);let s=(fr*9301+49297)%233280+1;const dd=gi.data;for(let i=0;i<dd.length;i+=4){s=(s*16807)%2147483647;const v=s&255;dd[i]=dd[i+1]=dd[i+2]=v;dd[i+3]=255;}gc.putImageData(gi,0,0);}const clock={t:0};tl.fromTo(clock,{t:0},{t:DATA.dur,duration:DATA.dur,ease:"none",immediateRender:false,onUpdate:()=>grain(tl.time())},0);tl.fromTo("#black",{opacity:0},{opacity:1,duration:0.5,immediateRender:false},DATA.dur-0.55);window.__timelines["main"]=tl;tl.seek(0);</script></body></html>
