<!doctype html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/>
<script src="assets/gsap.min.js"></script>
<style>
@font-face{font-family:DM;src:url(assets/dm-serif-display-latin-400-normal.woff2)}
@font-face{font-family:IT;src:url(assets/inter-tight-latin-500-normal.woff2);font-weight:500}
@font-face{font-family:IT;src:url(assets/inter-tight-latin-300-normal.woff2);font-weight:300}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:#070304}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#070304}
.full{position:absolute;inset:0}
#bg{background:radial-gradient(ellipse 70% 65% at 50% 55%,#2a0a12 0%,#100407 60%,#050102 100%)}
#lab{position:absolute;left:0;right:0;top:120px;text-align:center;font:500 36px IT;letter-spacing:.42em;padding-left:.42em;color:#e3324b;opacity:0}
#wave{position:absolute;left:360px;top:200px;width:1200px;height:200px}
#q{position:absolute;left:230px;right:230px;top:450px;text-align:center;font:400 108px/1.18 DM;color:#efe4da;text-wrap:balance}
#q span{display:inline-block;opacity:0;margin:0 .12em}
#qm{position:absolute;left:150px;top:330px;font:400 360px/1 DM;color:#e0233f;opacity:0}
#at{position:absolute;left:0;right:0;top:880px;text-align:center;font:300 36px IT;color:#b9a79f;opacity:0}
#end{position:absolute;left:0;right:0;top:335px;text-align:center;font:500 34px IT;letter-spacing:.35em;padding-left:.35em;color:#efe4da;opacity:0}
#grain{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.09;mix-blend-mode:overlay}
#vig{background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 50%,rgba(0,0,0,.8) 100%)}
#black{background:#000;opacity:1}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080">
 <div id="scene" class="clip full" data-start="0" data-duration="__DUR__" data-track-index="0">
  <div id="bg" class="full"></div>
  <div id="lab"></div><canvas id="wave" width="1200" height="200"></canvas><div id="end"></div>
  <div id="qm">“</div><div id="q"></div><div id="at"></div>
  <div id="vig" class="full"></div><canvas id="grain" width="960" height="540"></canvas><div id="black" class="full"></div>
 </div>
 <audio id="mix" src="assets/mix.wav" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const DATA=/*DATA*/null;
window.__timelines=window.__timelines||{}; const tl=gsap.timeline({paused:true}); const $=s=>document.querySelector(s);
$('#lab').textContent=DATA.etiqueta; $('#at').textContent=DATA.atribucion; $('#end').textContent=DATA.fin;
const words=DATA.frase.split(' '); words.forEach(w=>{const s=document.createElement('span');s.textContent=w;$('#q').appendChild(s)});
// tiempos de cada palabra: DATA.tiempos (del audio real con Whisper) o repartidos
const W0=DATA.inicio, W1=DATA.finFrase; const tw=DATA.tiempos||words.map((_,i)=>W0+(W1-W0)*i/words.length);
tl.fromTo('#black',{opacity:1},{opacity:0,duration:0.5,immediateRender:false},0.1);
tl.fromTo('#lab',{opacity:0,y:10},{opacity:1,y:0,duration:0.6,immediateRender:false},0.3);
tl.fromTo('#qm',{opacity:0,scale:1.3},{opacity:0.9,scale:1,duration:0.5,ease:'power3.out',immediateRender:false},W0-0.4);
document.querySelectorAll('#q span').forEach((s,i)=>tl.fromTo(s,{opacity:0,y:24,filter:'blur(8px)'},{opacity:1,y:0,filter:'blur(0px)',duration:0.35,ease:'power2.out',immediateRender:false},tw[i]));
tl.fromTo('#at',{opacity:0},{opacity:1,duration:0.6,immediateRender:false},W1+0.5);
tl.fromTo('#end',{opacity:0},{opacity:1,duration:0.05,immediateRender:false},W1+0.35);
tl.fromTo('#q',{x:0},{x:0,duration:0.01,immediateRender:false},0);
tl.fromTo('#black',{opacity:0},{opacity:1,duration:0.5,immediateRender:false},DATA.dur-0.55);
// onda de voz: activa mientras se dice la frase, plana al colgar
const wc=$('#wave').getContext('2d');
function wave(t){wc.clearRect(0,0,1200,200); const on=t>W0-0.1&&t<W1+0.3; const hung=t>=W1+0.3;
  const N=96; for(let i=0;i<N;i++){const x=i*12.5+3; let a;
   if(on){const ph=Math.sin(t*9.0+i*0.55)*0.5+Math.sin(t*23.0+i*1.7)*0.3+Math.sin(t*4.1+i*0.21)*0.4; a=Math.max(0.06,Math.abs(ph))*(0.35+0.65*Math.exp(-Math.pow((i-48)/30,2)));}
   else a=0.03;
   const h=Math.max(3,a*180); wc.fillStyle=hung?'rgba(224,35,63,.55)':(on?'#efe4da':'rgba(239,228,218,.35)'); wc.fillRect(x,100-h/2,6,h);}}
const gc=$('#grain').getContext('2d'); const gi=gc.createImageData(960,540);
function grain(t){const fr=Math.floor(t*24); let s=(fr*9301+49297)%233280+1; const dd=gi.data;
 for(let i=0;i<dd.length;i+=4){s=(s*16807)%2147483647; const v=s&255; dd[i]=dd[i+1]=dd[i+2]=v; dd[i+3]=255;} gc.putImageData(gi,0,0);}
const clock={t:0}; tl.fromTo(clock,{t:0},{t:DATA.dur,duration:DATA.dur,ease:'none',immediateRender:false,onUpdate:()=>{const t=tl.time();wave(t);grain(t)}},0);
window.__timelines["main"]=tl; tl.seek(0);
</script></body></html>
