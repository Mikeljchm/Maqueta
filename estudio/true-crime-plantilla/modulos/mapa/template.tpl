<!doctype html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/>
<script src="assets/gsap.min.js"></script>
<style>
@font-face{font-family:DM;src:url(assets/dm-serif-display-latin-400-normal.woff2)}
@font-face{font-family:IT;src:url(assets/inter-tight-latin-500-normal.woff2);font-weight:500}
@font-face{font-family:IT;src:url(assets/inter-tight-latin-300-normal.woff2);font-weight:300}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:#0b0607}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#0b0607}
.full{position:absolute;inset:0}
#map{position:absolute;left:0;top:0;width:1920px;height:1080px}
#map path{vector-effect:non-scaling-stroke}
.cty{fill:#1d1215;stroke:#5a3a40;stroke-width:1.2}
#Chile{fill:#2b1419;stroke:#d9c9bd;stroke-width:1.6}
.lake{fill:#3a0f1a;stroke:#c2465a;stroke-width:1.6}
.rmaj{fill:none;stroke:#d9c9bd;stroke-opacity:.55;stroke-width:1.6}
.rmin{fill:none;stroke:#d9c9bd;stroke-opacity:.22;stroke-width:1}
#route{fill:none;stroke:#ff2e4a;stroke-width:7;stroke-linecap:round;stroke-linejoin:round}
#labels{position:absolute;inset:0}
.lb{position:absolute;white-space:nowrap;font:500 34px IT;letter-spacing:.22em;color:#efe4da;text-shadow:0 2px 10px #000,0 0 3px #000;transform:translate(16px,-50%)}
.lb.big{font:500 44px IT;letter-spacing:.4em;color:#e7b3b3}
.lb.lake{font:300 36px IT;letter-spacing:.5em;color:#e58a98;transform:translate(-50%,-50%)}
.dot{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#efe4da;box-shadow:0 0 0 4px rgba(0,0,0,.5)}
.tri{position:absolute;width:0;height:0;margin:-14px 0 0 -12px;border-left:12px solid transparent;border-right:12px solid transparent;border-bottom:22px solid #d9c9bd}
#tgt{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:#ff2e4a;box-shadow:0 0 30px 8px rgba(255,46,74,.7)}
#ring{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:4px solid #ff2e4a}
#head{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#fff;box-shadow:0 0 24px 8px rgba(255,80,100,.9);opacity:0}
#card{position:absolute;left:110px;bottom:120px;opacity:0}
#card .t{font:400 104px/1.05 DM;color:#efe4da;text-shadow:0 4px 30px #000}
#card .s{font:500 34px IT;letter-spacing:.2em;color:#d9c9bd;margin-top:12px;text-shadow:0 2px 10px #000}
#card .l{height:4px;width:420px;background:#e0233f;margin-top:22px}
#attr{position:absolute;right:40px;bottom:30px;font:300 22px IT;color:#9d8c86}
#grain{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.08;mix-blend-mode:overlay}
#vig{background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 50%,rgba(0,0,0,.8) 100%)}
#black{background:#000;opacity:1}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080">
 <div id="scene" class="clip full" data-start="0" data-duration="__DUR__" data-track-index="0">
  <svg id="map" viewBox="0 0 1920 1080"><g id="cam"><g id="gC"></g><g id="gL"></g><g id="gR"></g><path id="route" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></g></svg>
  <div id="labels"></div>
  <div id="card"><div class="t"></div><div class="s"></div><div class="l"></div></div>
  <div id="attr">Datos: © OpenStreetMap contributors · Natural Earth</div>
  <div id="vig" class="full"></div>
  <canvas id="grain" width="960" height="540"></canvas>
  <div id="black" class="full"></div>
 </div>
 <audio id="mix" src="assets/mix.wav" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const M=/*MAP*/null; const DATA=/*DATA*/null;
window.__timelines=window.__timelines||{}; const tl=gsap.timeline({paused:true}); const $=s=>document.querySelector(s);
const NS='http://www.w3.org/2000/svg'; const mk=(g,d,c,id)=>{const p=document.createElementNS(NS,'path');p.setAttribute('d',d);p.setAttribute('class',c);if(id)p.id=id;$(g).appendChild(p);return p};
for(const n in M.countries) mk('#gC',M.countries[n],'cty',n==='Chile'?'Chile':null);
M.lakes.forEach(d=>mk('#gL',d,'lake')); M.roads.minor.forEach(d=>mk('#gR',d,'rmin')); M.roads.major.forEach(d=>mk('#gR',d,'rmaj'));
$('#route').setAttribute('d',M.route);
// etiquetas con posicion en el mapa (km); se recalculan en cada cuadro
const L=[];
function lab(text,x,y,cls,vis,mark){const e=document.createElement('div');e.className='lb '+(cls||'');e.textContent=text;$('#labels').appendChild(e);
  let m=null; if(mark){m=document.createElement('div');m.className=mark;$('#labels').appendChild(m);} L.push({e,m,x,y,vis});}
const pl=n=>M.places.find(p=>p.n===n).p;
DATA.etiquetas.forEach(o=>{const p=o.lugar?pl(o.lugar):o.p; lab(o.texto,p[0],p[1],o.clase,o.ver,o.marca);});
const T=pl(DATA.objetivo); const tgt=document.createElement('div');tgt.id='tgt';const ring=document.createElement('div');ring.id='ring';$('#labels').append(ring,tgt);
const head=document.createElement('div');head.id='head';$('#labels').appendChild(head);
const rp=$('#route'); const RL=rp.getTotalLength();
// camara: cx, cy (km), s (px/km), interpolacion logaritmica de la escala
const cam={cx:DATA.tomas[0][1],cy:DATA.tomas[0][2],ls:Math.log(DATA.tomas[0][3])};
const vis=(r,s)=>{const [a,b]=r;const k=Math.min(1,Math.max(0,(s-a)/(a*0.4)))*Math.min(1,Math.max(0,(b-s)/(b*0.25)));return k};
function apply(){const s=Math.exp(cam.ls); $('#cam').setAttribute('transform',`translate(${960-cam.cx*s} ${540-cam.cy*s}) scale(${s})`);
  const scr=(x,y)=>[960+(x-cam.cx)*s,540+(y-cam.cy)*s];
  $('#gC').style.opacity=Math.max(0,Math.min(1,(4-s)/2.5)); $('#gL').style.opacity=Math.max(0,Math.min(1,(s-0.8)/2));
  $('#gR').style.opacity=Math.max(0,Math.min(1,(s-3)/6));
  for(const l of L){const [x,y]=scr(l.x,l.y);const o=vis(l.vis,s);l.e.style.left=x+'px';l.e.style.top=y+'px';l.e.style.opacity=o;if(l.m){l.m.style.left=x+'px';l.m.style.top=y+'px';l.m.style.opacity=o;}}
  const [tx,ty]=scr(T[0],T[1]); for(const e of [tgt,ring]){e.style.left=tx+'px';e.style.top=ty+'px';}
  const pr=1-parseFloat(rp.getAttribute('stroke-dashoffset')||1); if(pr>0&&pr<1){const pt=rp.getPointAtLength(pr*RL);const [hx,hy]=scr(pt.x,pt.y);head.style.left=hx+'px';head.style.top=hy+'px';head.style.opacity=1}else head.style.opacity=0;}
DATA.tomas.slice(1).forEach(([t,cx,cy,s,dur,ease])=>{tl.to(cam,{cx,cy,ls:Math.log(s),duration:dur,ease:ease||'power2.inOut',onUpdate:apply},t);});
tl.fromTo('#black',{opacity:1},{opacity:0,duration:0.6,immediateRender:false},0.1);
const R=DATA.ruta; tl.fromTo(rp,{attr:{'stroke-dashoffset':1}},{attr:{'stroke-dashoffset':0},duration:R[1],ease:'power1.inOut',immediateRender:false,onUpdate:apply},R[0]);
gsap.set([tgt,ring],{opacity:0});
tl.fromTo([tgt],{opacity:0,scale:0},{opacity:1,scale:1,duration:0.35,ease:'back.out(3)',immediateRender:false},DATA.marca);
for(let i=0;i<4;i++) tl.fromTo(ring,{opacity:0.9,scale:1},{opacity:0,scale:5,duration:1.2,ease:'power2.out',immediateRender:false},DATA.marca+0.2+i*1.1);
$('#card .t').textContent=DATA.tarjeta[0]; $('#card .s').textContent=DATA.tarjeta[1]; gsap.set('#card .l',{scaleX:0,transformOrigin:'0 50%'});
tl.fromTo('#card',{opacity:0,y:30},{opacity:1,y:0,duration:0.7,ease:'power3.out',immediateRender:false},DATA.tarjeta[2]);
tl.fromTo('#card .l',{scaleX:0},{scaleX:1,duration:0.8,ease:'power3.inOut',immediateRender:false},DATA.tarjeta[2]+0.3);
const gc=$('#grain').getContext('2d'); const gi=gc.createImageData(960,540);
function grain(t){const fr=Math.floor(t*24); let s=(fr*9301+49297)%233280+1; const dd=gi.data;
 for(let i=0;i<dd.length;i+=4){s=(s*16807)%2147483647; const v=s&255; dd[i]=dd[i+1]=dd[i+2]=v; dd[i+3]=255;} gc.putImageData(gi,0,0);}
const clock={t:0}; tl.fromTo(clock,{t:0},{t:DATA.dur,duration:DATA.dur,ease:'none',immediateRender:false,onUpdate:()=>{apply();grain(tl.time())}},0);
apply(); window.__timelines["main"]=tl; tl.seek(0);
</script></body></html>
