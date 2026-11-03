<!doctype html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/>
<script src="assets/gsap.min.js"></script>
<style>
@font-face{font-family:DM;src:url(assets/dm-serif-display-latin-400-normal.woff2)}
@font-face{font-family:IT;src:url(assets/inter-tight-latin-500-normal.woff2);font-weight:500}
@font-face{font-family:IT;src:url(assets/inter-tight-latin-300-normal.woff2);font-weight:300}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:#070203}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#070203}
.full{position:absolute;inset:0}
#bg{background:radial-gradient(ellipse 65% 70% at 50% 45%,#2e0b13 0%,#120408 60%,#050102 100%)}
#pulse{background:radial-gradient(circle at 50% 42%,rgba(225,30,60,.45),rgba(225,30,60,0) 45%);opacity:0;mix-blend-mode:screen}
#tit{position:absolute;left:0;right:0;top:200px;text-align:center;font:500 40px IT;letter-spacing:.5em;padding-left:.5em;color:#e3324b;opacity:0}
#clk{position:absolute;left:0;right:0;top:250px;text-align:center;font:400 330px/1.1 DM;color:#efe4da;font-variant-numeric:tabular-nums;opacity:0}
#fec{position:absolute;left:0;right:0;top:640px;text-align:center;font:500 52px IT;letter-spacing:.32em;padding-left:.32em;color:#efe4da;opacity:0}
#lug{position:absolute;left:0;right:0;top:720px;text-align:center;font:300 40px IT;letter-spacing:.08em;color:#b9a79f;opacity:0}
#ecg{position:absolute;left:0;top:0;width:1920px;height:1080px}
#grain{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.09;mix-blend-mode:overlay}
#vig{background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 50%,rgba(0,0,0,.8) 100%)}
#drain{background:#0a0809;opacity:0;mix-blend-mode:saturation}
#black{background:#000;opacity:1}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080">
 <div id="scene" class="clip full" data-start="0" data-duration="__DUR__" data-track-index="0">
  <div id="bg" class="full"></div><div id="pulse" class="full"></div>
  <div id="tit"></div><div id="clk"></div><div id="fec"></div><div id="lug"></div>
  <svg id="ecg" viewBox="0 0 1920 1080"><defs><clipPath id="c"><rect id="r" x="0" y="0" width="0" height="1080"/></clipPath>
   <filter id="gl" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   <g clip-path="url(#c)" filter="url(#gl)"><path id="p" fill="none" stroke="#ff2e4a" stroke-width="4" stroke-linejoin="round"/></g>
   <circle id="head" r="8" fill="#fff" filter="url(#gl)" opacity="0"/></svg>
  <div id="drain" class="full"></div><div id="vig" class="full"></div>
  <canvas id="grain" width="960" height="540"></canvas><div id="black" class="full"></div>
 </div>
 <audio id="mix" src="assets/mix.wav" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const DATA=/*DATA*/null;
window.__timelines=window.__timelines||{}; const tl=gsap.timeline({paused:true}); const $=s=>document.querySelector(s);
const D=DATA.dur, Y0=900;
$('#tit').textContent=DATA.titulo; $('#fec').textContent=DATA.fecha; $('#lug').textContent=DATA.lugar;
function beat(x,x0){const d=x-x0;return -10*Math.exp(-Math.pow((d+70)/14,2))+18*Math.exp(-Math.pow((d+18)/5,2))-140*Math.exp(-Math.pow(d/6,2))+50*Math.exp(-Math.pow((d-14)/6,2))-22*Math.exp(-Math.pow((d-75)/20,2));}
// el trazo cruza en DATA.trazo segundos; latidos donde indique DATA.latidos (segundos)
const T0=DATA.t0, TR=DATA.trazo, V=1920/TR; const BX=DATA.latidos.map(t=>(t-T0)*V);
const y=x=>Y0+BX.reduce((a,b)=>a+beat(x,b),0);
let d='';for(let x=-10;x<=1930;x+=2)d+=(x<-9?'M':'L')+x+' '+y(x).toFixed(1); $('#p').setAttribute('d',d);
const tr={x:0}; function draw(){ $('#r').setAttribute('width',tr.x); $('#head').setAttribute('cx',tr.x); $('#head').setAttribute('cy',y(tr.x)); }
// reloj que corre de DATA.desde a DATA.hasta
const toM=s=>{const [h,m]=s.split(':').map(Number);return h*60+m}; const m0=toM(DATA.desde), m1=toM(DATA.hasta);
const ck={m:m0}; const fmt=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(Math.floor(m%60)).padStart(2,'0');
$('#clk').textContent=fmt(m0);
tl.fromTo('#black',{opacity:1},{opacity:0,duration:0.5,immediateRender:false},0.1);
tl.fromTo('#tit',{opacity:0,y:10},{opacity:1,y:0,duration:0.6,immediateRender:false},0.4);
tl.fromTo('#clk',{opacity:0,scale:1.04},{opacity:1,scale:1,duration:0.6,immediateRender:false},0.6);
tl.fromTo(ck,{m:m0},{m:m1,duration:DATA.corre,ease:'power2.inOut',immediateRender:false,onUpdate:()=>{$('#clk').textContent=fmt(ck.m)}},1.0);
tl.fromTo('#fec',{opacity:0,y:14},{opacity:1,y:0,duration:0.6,immediateRender:false},1.4);
tl.fromTo('#lug',{opacity:0},{opacity:1,duration:0.6,immediateRender:false},1.8);
tl.fromTo('#head',{opacity:0},{opacity:1,duration:0.05,immediateRender:false},T0);
tl.fromTo(tr,{x:0},{x:1920,duration:TR,ease:'none',onUpdate:draw,immediateRender:false},T0);
tl.fromTo('#head',{opacity:1},{opacity:0,duration:0.1,immediateRender:false},T0+TR);
DATA.latidos.forEach(t=>{tl.fromTo('#pulse',{opacity:0},{opacity:0.8,duration:0.05,immediateRender:false},t);tl.fromTo('#pulse',{opacity:0.8},{opacity:0,duration:0.6,immediateRender:false},t+0.05);});
const TF=DATA.plana; // la linea queda plana: el reloj se tiñe de rojo
tl.to('#clk',{color:'#e0233f',textShadow:'0 0 60px rgba(224,35,63,.6)',duration:0.3},TF);
tl.fromTo('#drain',{opacity:0},{opacity:0.9,duration:1.0,ease:'power2.in',immediateRender:false},TF+0.4);
tl.fromTo('#black',{opacity:0},{opacity:1,duration:0.03,immediateRender:false},DATA.corte);
const gc=$('#grain').getContext('2d'); const gi=gc.createImageData(960,540);
function grain(t){const fr=Math.floor(t*24); let s=(fr*9301+49297)%233280+1; const dd=gi.data;
 for(let i=0;i<dd.length;i+=4){s=(s*16807)%2147483647; const v=s&255; dd[i]=dd[i+1]=dd[i+2]=v; dd[i+3]=255;} gc.putImageData(gi,0,0);}
const clock={t:0}; tl.fromTo(clock,{t:0},{t:D,duration:D,ease:'none',immediateRender:false,onUpdate:()=>grain(tl.time())},0);
window.__timelines["main"]=tl; tl.seek(0);
</script></body></html>
