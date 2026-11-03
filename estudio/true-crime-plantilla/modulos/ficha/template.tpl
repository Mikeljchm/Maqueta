<!doctype html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/>
<script src="assets/gsap.min.js"></script>
<style>
@font-face{font-family:DM;src:url(assets/dm-serif-display-latin-400-normal.woff2)}
@font-face{font-family:IT;src:url(assets/inter-tight-latin-500-normal.woff2);font-weight:500}
@font-face{font-family:IT;src:url(assets/inter-tight-latin-300-normal.woff2);font-weight:300}
@font-face{font-family:SE;src:url(assets/special-elite-latin-400-normal.woff2)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:#080304}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#080304}
.full{position:absolute;inset:0}
#bg{background:radial-gradient(ellipse 60% 80% at 30% 50%,#33101a 0%,#14060a 55%,#060203 100%)}
#frame{position:absolute;left:170px;top:190px;width:600px;height:726px;padding:20px;background:#efe4da;box-shadow:0 30px 60px rgba(0,0,0,.6)}
#ph{position:absolute;left:20px;top:20px;width:560px;height:686px;overflow:hidden}
#ph img{position:absolute;left:0;top:0;width:560px;height:686px}
#stamp{position:absolute;left:250px;top:770px;font:58px/1 SE;color:#c4182c;border:6px solid #c4182c;padding:10px 22px 6px;mix-blend-mode:multiply;opacity:0}
#info{position:absolute;left:880px;top:250px;width:900px}
#rol{font:500 34px IT;letter-spacing:.42em;color:#e3324b;opacity:0}
#nm{font:400 136px/1.12 DM;color:#efe4da;margin-top:14px;white-space:nowrap}
#nm span{display:inline-block;opacity:0}
#ln{height:4px;width:640px;background:#e0233f;margin:22px 0 34px}
.row{display:flex;gap:34px;align-items:baseline;margin-bottom:22px;opacity:0}
.row .k{font:500 28px IT;letter-spacing:.3em;color:#b9a79f;width:300px}
.row .v{font:500 54px IT;color:#efe4da}
#cred{position:absolute;right:60px;bottom:44px;font:300 24px IT;color:#8f7f79;letter-spacing:.05em}
#flash{background:#fff;opacity:0}
#grain{position:absolute;left:0;top:0;width:1920px;height:1080px;opacity:.09;mix-blend-mode:overlay}
#vig{background:radial-gradient(ellipse 85% 85% at 50% 50%,rgba(0,0,0,0) 55%,rgba(0,0,0,.75) 100%)}
#black{background:#000;opacity:1}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080">
 <div id="scene" class="clip full" data-start="0" data-duration="__DUR__" data-track-index="0">
  <div id="bg" class="full"></div>
  <div id="frame"><div id="ph"><img id="img" src="assets/foto.jpg"></div></div>
  <div id="stamp"></div>
  <div id="info"><div id="rol"></div><div id="nm"></div><div id="ln"></div><div id="rows"></div></div>
  <div id="cred"></div>
  <div id="vig" class="full"></div>
  <canvas id="grain" width="960" height="540"></canvas>
  <div id="flash" class="full"></div>
  <div id="black" class="full"></div>
 </div>
 <audio id="mix" src="assets/mix.wav" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const DATA=/*DATA*/null;
window.__timelines=window.__timelines||{}; const tl=gsap.timeline({paused:true}); const $=s=>document.querySelector(s);
$('#rol').textContent=DATA.rol; $('#stamp').textContent=DATA.sello||''; $('#cred').textContent=DATA.credito||'';
DATA.nombre.split('').forEach(c=>{const s=document.createElement('span');s.innerHTML=c===' '?'&nbsp;':c;$('#nm').appendChild(s)});
DATA.filas.forEach(([k,v])=>{const r=document.createElement('div');r.className='row';r.innerHTML='<div class="k"></div><div class="v"></div>';r.children[0].textContent=k;r.children[1].textContent=v;$('#rows').appendChild(r)});
gsap.set('#ln',{scaleX:0,transformOrigin:'0 50%'}); gsap.set('#frame',{rotation:-2});
const D=DATA.dur;
tl.fromTo('#black',{opacity:1},{opacity:0,duration:0.02,immediateRender:false},0.12);
tl.fromTo('#flash',{opacity:0},{opacity:1,duration:0.02,immediateRender:false},0.12);
tl.fromTo('#flash',{opacity:1},{opacity:0,duration:0.5,ease:'power2.out',immediateRender:false},0.14);
tl.fromTo('#frame',{scale:1.06,x:-30},{scale:1,x:0,duration:0.9,ease:'power3.out',immediateRender:false},0.12);
tl.fromTo('#img',{scale:1.0},{scale:1.07,duration:D,ease:'none',immediateRender:false},0.12);
tl.fromTo('#rol',{opacity:0,x:-20},{opacity:1,x:0,duration:0.5,ease:'power2.out',immediateRender:false},0.55);
tl.fromTo('#nm span',{opacity:0,y:50},{opacity:1,y:0,duration:0.6,ease:'power3.out',stagger:0.03,immediateRender:false},0.7);
tl.fromTo('#ln',{scaleX:0},{scaleX:1,duration:0.8,ease:'power3.inOut',immediateRender:false},1.2);
document.querySelectorAll('.row').forEach((r,i)=>tl.fromTo(r,{opacity:0,x:-30},{opacity:1,x:0,duration:0.45,ease:'power3.out',immediateRender:false},1.6+i*0.4));
const ST=1.6+DATA.filas.length*0.4+0.4;
if(DATA.sello) tl.fromTo('#stamp',{opacity:0,scale:1.8,rotation:-14},{opacity:0.92,scale:1,rotation:-8,duration:0.16,ease:'power4.in',immediateRender:false},ST);
tl.fromTo('#cred',{opacity:0},{opacity:1,duration:0.6,immediateRender:false},1.0);
tl.to(['#frame','#info','#stamp','#cred'],{opacity:0,duration:0.5},D-0.6);
const gc=$('#grain').getContext('2d'); const gi=gc.createImageData(960,540);
function grain(t){const fr=Math.floor(t*24); let s=(fr*9301+49297)%233280+1; const d=gi.data;
 for(let i=0;i<d.length;i+=4){s=(s*16807)%2147483647; const v=s&255; d[i]=d[i+1]=d[i+2]=v; d[i+3]=255;} gc.putImageData(gi,0,0);}
const clock={t:0}; tl.fromTo(clock,{t:0},{t:D,duration:D,ease:'none',immediateRender:false,onUpdate:()=>grain(tl.time())},0);
window.__timelines["main"]=tl; tl.seek(0);
</script></body></html>
