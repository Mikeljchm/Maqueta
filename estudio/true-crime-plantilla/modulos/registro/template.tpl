<!doctype html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/>
<script src="assets/gsap.min.js"></script>
<style>
@font-face{font-family:MO;src:url(assets/ibm-plex-mono-latin-500-normal.woff2);font-weight:500}
@font-face{font-family:MO;src:url(assets/ibm-plex-mono-latin-400-normal.woff2);font-weight:400}
@font-face{font-family:DM;src:url(assets/dm-serif-display-latin-400-normal.woff2)}
@font-face{font-family:IT;src:url(assets/inter-tight-latin-500-normal.woff2);font-weight:500}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:#0a0606}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#0a0606}
.full{position:absolute;inset:0}
#desk{background:radial-gradient(ellipse 80% 90% at 35% 30%,#2a1a14 0%,#130b09 60%,#060303 100%)}
#cam{position:absolute;inset:0}
#sheet{position:absolute;left:170px;top:70px;width:1580px;height:1000px;background:#ece5d6;
  background-image:repeating-linear-gradient(180deg,rgba(0,0,0,0) 0 95px,rgba(80,110,90,.10) 95px 96px);
  box-shadow:0 40px 80px rgba(0,0,0,.7),0 6px 14px rgba(0,0,0,.5);padding:56px 70px}
#sheet:after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,rgba(255,240,215,.0) 30%,rgba(0,0,0,.18) 100%);pointer-events:none}
#hd .t{font:400 64px/1.1 DM;color:#1c1613}
#hd .s{font:500 30px IT;letter-spacing:.28em;color:#6b5d55;margin-top:12px}
#hd .ln{height:4px;background:#1c1613;margin:26px 0 8px}
.cols,.row{display:grid;grid-template-columns:200px 680px 1fr;align-items:center}
.cols{font:500 26px IT;letter-spacing:.3em;color:#7a6b62;height:58px}
.row{position:relative;height:96px;font:500 46px MO;color:#211b18;border-bottom:1px dashed rgba(60,50,45,.35)}
.row .c3{font:400 40px MO;color:#4a3f39}
.row.alerta{color:#b3121f}
.row.alerta .c3{color:#b3121f;font-weight:500}
.hl{position:absolute;left:-14px;right:-14px;top:14px;bottom:14px;background:rgba(225,30,55,.22);transform-origin:0 50%;transform:scaleX(0)}
#lamp{background:radial-gradient(ellipse 50% 60% at 40% 35%,rgba(255,215,160,.16),rgba(0,0,0,0) 65%);mix-blend-mode:screen}
#vig{background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 50%,rgba(0,0,0,.8) 100%)}
#grain{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.09;mix-blend-mode:overlay}
#black{background:#000;opacity:1}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080">
 <div id="scene" class="clip full" data-start="0" data-duration="__DUR__" data-track-index="0">
  <div id="desk" class="full"></div>
  <div id="cam"><div id="sheet"><div id="hd"><div class="t"></div><div class="s"></div><div class="ln"></div></div>
    <div class="cols"><div>HORA</div><div>CONTACTO</div><div>DETALLE</div></div><div id="rows"></div></div></div>
  <div id="lamp" class="full"></div><div id="vig" class="full"></div>
  <canvas id="grain" width="960" height="540"></canvas><div id="black" class="full"></div>
 </div>
 <audio id="mix" src="assets/mix.wav" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const DATA=/*DATA*/null;
window.__timelines=window.__timelines||{}; const tl=gsap.timeline({paused:true}); const $=s=>document.querySelector(s);
$('#hd .t').textContent=DATA.titulo; $('#hd .s').textContent=DATA.subtitulo;
DATA.filas.forEach((f,i)=>{const r=document.createElement('div');r.className='row'+(f[3]?' '+f[3]:'');r.innerHTML='<div class="hl"></div><div class="c1"></div><div class="c2"></div><div class="c3"></div>';
 r.querySelector('.c1').textContent=f[0];r.querySelector('.c2').textContent=f[1];r.querySelector('.c3').textContent=f[2];$('#rows').appendChild(r)});
const rows=[...document.querySelectorAll('.row')];
gsap.set(rows,{clipPath:'inset(0% 100% 0% 0%)'}); gsap.set('#sheet',{rotation:-1.2});
tl.fromTo('#black',{opacity:1},{opacity:0,duration:0.6,immediateRender:false},0.1);
tl.fromTo('#cam',{scale:1.08,x:60,y:40},{scale:1.0,x:0,y:0,duration:1.4,ease:'power3.out',immediateRender:false},0);
const T=DATA.tiempos; // [inicio, paso, duracion de impresion]
rows.forEach((r,i)=>tl.fromTo(r,{clipPath:'inset(0% 100% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:T[2],ease:'steps(26)',immediateRender:false},T[0]+i*T[1]));
const last=rows.length-1, TA=T[0]+last*T[1]+T[2]+0.25;
// la ultima fila: alerta
const lr=rows[last];
tl.fromTo('#cam',{scale:1,x:0,y:0},{scale:1.32,x:180,y:-360,duration:1.2,ease:'power3.inOut',immediateRender:false},TA-0.3);
tl.fromTo(lr.querySelector('.hl'),{scaleX:0},{scaleX:1,duration:0.45,ease:'power2.out',immediateRender:false},TA+0.5);
const J=[[6,0],[-9,0],[4,0],[-3,0],[0,0]];
J.forEach((d,i)=>tl.to(lr,{x:d[0],textShadow:i<4?'3px 0 rgba(0,200,255,.7),-3px 0 rgba(255,0,90,.7)':'none',duration:0.04,ease:'none'},TA+1.0+i*0.04));
tl.fromTo(lr.querySelector('.c3'),{opacity:1},{opacity:0.15,duration:0.05,yoyo:true,repeat:5,ease:'none',immediateRender:false},TA+1.3);
tl.to('#lamp',{opacity:0.4,duration:1.0},TA+1.0);
tl.fromTo('#black',{opacity:0},{opacity:1,duration:0.6,immediateRender:false},DATA.dur-0.7);
const gc=$('#grain').getContext('2d'); const gi=gc.createImageData(960,540);
function grain(t){const fr=Math.floor(t*24); let s=(fr*9301+49297)%233280+1; const dd=gi.data;
 for(let i=0;i<dd.length;i+=4){s=(s*16807)%2147483647; const v=s&255; dd[i]=dd[i+1]=dd[i+2]=v; dd[i+3]=255;} gc.putImageData(gi,0,0);}
const clock={t:0}; tl.fromTo(clock,{t:0},{t:DATA.dur,duration:DATA.dur,ease:'none',immediateRender:false,onUpdate:()=>grain(tl.time())},0);
window.__timelines["main"]=tl; tl.seek(0);
</script></body></html>
