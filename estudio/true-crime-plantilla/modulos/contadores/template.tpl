<!doctype html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/>
<script src="assets/gsap.min.js"></script>
<style>
@font-face{font-family:DM;src:url(assets/dm-serif-display-latin-400-normal.woff2)}
@font-face{font-family:IT;src:url(assets/inter-tight-latin-500-normal.woff2);font-weight:500}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:#070304}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#070304}
.full{position:absolute;inset:0}
#bg{background:radial-gradient(ellipse 60% 60% at 50% 48%,#3a0d17 0%,#130509 60%,#050102 100%)}
#cam{position:absolute;inset:0}
.it{position:absolute;left:0;right:0;top:170px;text-align:center;opacity:0}
.it .n{font:400 470px/1 DM;color:#efe4da;font-variant-numeric:tabular-nums}
.it .l{font:500 64px IT;letter-spacing:.36em;padding-left:.36em;color:#e3324b;margin-top:20px}
#sum{position:absolute;left:0;right:0;top:400px;display:flex;justify-content:center;gap:90px;opacity:0}
#sum .c{text-align:center}
#sum .n{font:400 210px/1 DM;color:#efe4da}
#sum .l{font:500 30px IT;letter-spacing:.28em;color:#e3324b;margin-top:14px;white-space:nowrap}
#flash{background:#fff;opacity:0}
#grain{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.09;mix-blend-mode:overlay}
#vig{background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 50%,rgba(0,0,0,.8) 100%)}
#black{background:#000;opacity:1}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080">
 <div id="scene" class="clip full" data-start="0" data-duration="__DUR__" data-track-index="0">
  <div id="bg" class="full"></div><div id="cam"><div id="items"></div><div id="sum"></div></div>
  <div id="vig" class="full"></div><canvas id="grain" width="960" height="540"></canvas><div id="flash" class="full"></div><div id="black" class="full"></div>
 </div>
 <audio id="mix" src="assets/mix.wav" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const DATA=/*DATA*/null;
window.__timelines=window.__timelines||{}; const tl=gsap.timeline({paused:true}); const $=s=>document.querySelector(s);
DATA.items.forEach(([n,l])=>{const d=document.createElement('div');d.className='it';d.innerHTML='<div class="n"></div><div class="l"></div>';d.children[0].textContent=n;d.children[1].textContent=l;$('#items').appendChild(d);
 const c=document.createElement('div');c.className='c';c.innerHTML='<div class="n"></div><div class="l"></div>';c.children[0].textContent=n;c.children[1].textContent=DATA.cortos?DATA.cortos[DATA.items.indexOf(DATA.items.find(x=>x[1]===l))]:l;$('#sum').appendChild(c)});
const its=[...document.querySelectorAll('.it')]; const t0=DATA.inicio, st=DATA.paso;
tl.fromTo('#black',{opacity:1},{opacity:0,duration:0.02,immediateRender:false},0.05);
its.forEach((e,i)=>{const t=t0+i*st;
  tl.fromTo(e,{opacity:0,scale:1.55,filter:'blur(14px)'},{opacity:1,scale:1,filter:'blur(0px)',duration:0.18,ease:'power4.in',immediateRender:false},t-0.18);
  tl.fromTo('#flash',{opacity:0},{opacity:0.55,duration:0.02,immediateRender:false},t);
  tl.fromTo('#flash',{opacity:0.55},{opacity:0,duration:0.25,immediateRender:false},t+0.02);
  [[12,-6],[-9,5],[6,3],[-3,-2],[0,0]].forEach((d,k)=>tl.to('#cam',{x:d[0],y:d[1],duration:0.04,ease:'none'},t+k*0.04));
  tl.fromTo(e,{scale:1},{scale:1.05,duration:st-0.25,ease:'none',immediateRender:false},t+0.2);
  tl.fromTo(e,{opacity:1},{opacity:0,duration:0.06,immediateRender:false},t+st-0.25);});
const TS=t0+its.length*st-0.1;
tl.fromTo('#sum',{opacity:0,y:30},{opacity:1,y:0,duration:0.5,ease:'power3.out',immediateRender:false},TS);
tl.fromTo('#sum .c',{opacity:0},{opacity:1,duration:0.3,stagger:0.12,immediateRender:false},TS);
tl.fromTo('#black',{opacity:0},{opacity:1,duration:0.5,immediateRender:false},DATA.dur-0.55);
const gc=$('#grain').getContext('2d'); const gi=gc.createImageData(960,540);
function grain(t){const fr=Math.floor(t*24); let s=(fr*9301+49297)%233280+1; const dd=gi.data;
 for(let i=0;i<dd.length;i+=4){s=(s*16807)%2147483647; const v=s&255; dd[i]=dd[i+1]=dd[i+2]=v; dd[i+3]=255;} gc.putImageData(gi,0,0);}
const clock={t:0}; tl.fromTo(clock,{t:0},{t:DATA.dur,duration:DATA.dur,ease:'none',immediateRender:false,onUpdate:()=>grain(tl.time())},0);
window.__timelines["main"]=tl; tl.seek(0);
</script></body></html>
