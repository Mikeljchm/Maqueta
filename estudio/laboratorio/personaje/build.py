import json
V=json.load(open("voz.json")); DUR=V["dur"]
html=r"""<!doctype html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/>
<script src="assets/lib/gsap.min.js"></script>
<style>
@font-face{font-family:"Archivo";src:url(assets/fonts/archivo-black-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Inter Tight";font-weight:500;src:url(assets/fonts/inter-tight-latin-500-normal.woff2) format("woff2")}
*{margin:0;padding:0;box-sizing:border-box} html,body{width:1080px;height:1920px;overflow:hidden;background:#7fd6ff}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:linear-gradient(180deg,#8fdcff 0%,#c9f0ff 60%,#ffe7b8 100%)}
.cloud{position:absolute;width:300px;height:100px;border-radius:60px;background:#fff;opacity:.9}
.cloud:before,.cloud:after{content:"";position:absolute;background:#fff;border-radius:50%}
.cloud:before{width:140px;height:140px;left:40px;top:-70px}.cloud:after{width:110px;height:110px;left:150px;top:-50px}
#ground{position:absolute;left:-100px;right:-100px;top:1470px;height:600px;border-radius:50% 50% 0 0/120px 120px 0 0;background:#7ed957}
#shadow{position:absolute;left:355px;top:1490px;width:370px;height:50px;border-radius:50%;background:rgba(0,60,0,.25)}
#char{position:absolute;left:290px;top:915px;width:500px;height:600px;transform-origin:50% 100%}
#bubble{position:absolute;left:80px;right:80px;top:560px;height:290px;padding:0 40px;border-radius:60px;background:#fff;box-shadow:0 14px 0 rgba(0,0,0,.08);text-align:center;font:400 66px/1.12 "Archivo";color:#2b2140;opacity:0}
#bubble:after{content:"";position:absolute;left:426px;bottom:-60px;border:34px solid transparent;border-top:40px solid #fff;border-bottom:0}
.sub{position:absolute;left:40px;right:40px;top:0;bottom:0;display:flex;align-items:center;justify-content:center;opacity:0}
.pop{position:absolute;font:400 110px "Archivo";color:#ff4d8d;opacity:0}
#tag{position:absolute;left:0;right:0;top:190px;text-align:center;font:500 28px "Inter Tight";letter-spacing:.5em;padding-left:.5em;color:rgba(30,40,80,.55)}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1080" data-height="1920">
 <div id="stage" class="clip" data-start="0" data-duration="__DUR__" data-track-index="0" data-layout-allow-overflow data-layout-allow-overlap data-layout-allow-occlusion style="position:absolute;inset:0">
  <div class="cloud" id="cl1" style="left:60px;top:330px"></div><div class="cloud" id="cl2" style="left:700px;top:270px;transform:scale(.7)"></div><div class="cloud" id="cl3" style="left:520px;top:900px;transform:scale(.55)"></div>
  <div id="tag">LABORATORIO · PERSONAJE</div>
  <div id="ground"></div><div id="shadow"></div>
  <div id="bubble"></div>
  <div class="pop" id="q" style="left:760px;top:900px">?</div>
  <div class="pop" id="c1" style="left:150px;top:1080px;color:#7b4dff">&lt;/&gt;</div><div class="pop" id="c2" style="left:770px;top:1150px;color:#00a37a">{ }</div>
  <svg id="char" viewBox="0 0 400 480">
   <g id="body">
    <ellipse cx="200" cy="270" rx="185" ry="200" fill="#ffd23f"/>
    <ellipse cx="150" cy="190" rx="70" ry="45" fill="rgba(255,255,255,.35)"/>
    <ellipse cx="200" cy="455" rx="140" ry="16" fill="rgba(200,140,0,.25)"/>
    <g id="face">
     <ellipse cx="85" cy="300" rx="34" ry="20" fill="#ff8fa8" opacity=".7"/><ellipse cx="315" cy="300" rx="34" ry="20" fill="#ff8fa8" opacity=".7"/>
     <g id="eyeL"><ellipse cx="140" cy="230" rx="38" ry="46" fill="#fff"/><circle id="pL" cx="146" cy="236" r="22" fill="#2b2140"/><circle cx="154" cy="226" r="7" fill="#fff"/></g>
     <g id="eyeR"><ellipse cx="260" cy="230" rx="38" ry="46" fill="#fff"/><circle id="pR" cx="266" cy="236" r="22" fill="#2b2140"/><circle cx="274" cy="226" r="7" fill="#fff"/></g>
     <rect id="lidL" x="98" y="180" width="84" height="100" rx="40" fill="#ffd23f" transform="scale(1,0)" transform-origin="140 180"/>
     <rect id="lidR" x="218" y="180" width="84" height="100" rx="40" fill="#ffd23f" transform="scale(1,0)" transform-origin="260 180"/>
     <path id="browL" d="M108 170 Q140 150 172 166" stroke="#2b2140" stroke-width="10" fill="none" stroke-linecap="round"/>
     <path id="browR" d="M228 166 Q260 150 292 170" stroke="#2b2140" stroke-width="10" fill="none" stroke-linecap="round"/>
     <g id="mouthG" transform="translate(200 330)"><ellipse id="mouth" cx="0" cy="0" rx="46" ry="8" fill="#7a1f3d"/><ellipse id="tongue" cx="0" cy="10" rx="24" ry="8" fill="#ff6f91"/></g>
    </g>
   </g>
  </svg>
 </div>
 <audio id="vo" class="clip" src="assets/audio/voz.wav" data-start="__OFF__" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const V=__V__, DUR=V.dur, OFF=V.off;
const tl=gsap.timeline({paused:true}); const IR={immediateRender:false};
const mouth=document.getElementById("mouth"), tongue=document.getElementById("tongue");
function lip(t){ const f=(t-OFF)*V.fps; let v=0; if(f>=0&&f<V.env.length-1){const i=Math.floor(f); v=V.env[i]+(V.env[i+1]-V.env[i])*(f-i);} 
  const open=Math.min(1,v); mouth.setAttribute("ry",(6+open*46).toFixed(1)); mouth.setAttribute("rx",(46-open*12).toFixed(1)); tongue.setAttribute("cy",(6+open*28).toFixed(1)); tongue.setAttribute("ry",(2+open*10).toFixed(1)); }
const st={t:0}; tl.to(st,{t:DUR,duration:DUR,ease:"none",onUpdate:()=>lip(tl.time())},0);
// entrada: cae del cielo y aplasta (squash & stretch)
tl.fromTo("#char",{y:-1300,scaleX:0.8,scaleY:1.25},{y:0,duration:0.55,ease:"power2.in",...IR},0);
tl.fromTo("#shadow",{scale:0.2,opacity:0},{scale:1,opacity:1,duration:0.55,ease:"power2.in",...IR},0);
tl.to("#char",{scaleX:1.3,scaleY:0.72,duration:0.08,ease:"power2.out"},0.55);
tl.to("#char",{scaleX:0.92,scaleY:1.1,duration:0.14,ease:"power2.out"},0.63);
tl.to("#char",{scaleX:1,scaleY:1,duration:0.35,ease:"elastic.out(1,0.4)"},0.77);
// respiracion idle
tl.to("#body",{scaleY:1.02,scaleX:0.99,transformOrigin:"50% 100%",duration:0.9,ease:"sine.inOut",yoyo:true,repeat:Math.ceil(DUR/0.9)},1.1);
// nubes
tl.to("#cl1",{x:120,duration:DUR,ease:"none"},0); tl.to("#cl2",{x:-140,duration:DUR,ease:"none"},0); tl.to("#cl3",{x:90,duration:DUR,ease:"none"},0);
// parpadeos
[1.6,4.0,6.0,8.4,10.9].forEach(t=>{["#lidL","#lidR"].forEach(l=>{tl.fromTo(l,{scaleY:0},{scaleY:1,duration:0.07,...IR},t); tl.to(l,{scaleY:0,duration:0.09},t+0.1);});});
// actuacion segun el guion
const S=V.subs;
tl.to(["#browL","#browR"],{y:-16,duration:0.15,yoyo:true,repeat:1},S[0].s);            // ¡Epa!
tl.to("#char",{rotation:-6,duration:0.3,ease:"sine.inOut",yoyo:true,repeat:1},S[1].s+0.2);
// "no tengo brazos": mira a los lados ; "no tengo piernas": mira abajo
tl.to(["#pL","#pR"],{x:-14,duration:0.18},S[2].s+0.1); tl.to(["#pL","#pR"],{x:14,duration:0.25},S[2].s+0.75); tl.to(["#pL","#pR"],{x:0,y:16,duration:0.25},S[2].s+1.3); tl.to(["#pL","#pR"],{y:0,duration:0.2},S[3].s-0.1);
// "¡pero mira cómo hablo!": salto con anticipacion
const J=S[3].s; tl.to("#char",{scaleX:1.2,scaleY:0.82,duration:0.12,ease:"power2.out"},J-0.05);
tl.to("#char",{y:-150,scaleX:0.88,scaleY:1.15,duration:0.32,ease:"power2.out"},J+0.07); tl.to("#shadow",{scale:0.55,opacity:0.5,duration:0.32},J+0.07);
tl.to("#char",{y:0,scaleX:0.95,scaleY:1.05,duration:0.28,ease:"power2.in"},J+0.39); tl.to("#shadow",{scale:1,opacity:1,duration:0.28},J+0.39);
tl.to("#char",{scaleX:1.22,scaleY:0.8,duration:0.07},J+0.67); tl.to("#char",{scaleX:1,scaleY:1,duration:0.4,ease:"elastic.out(1,0.4)"},J+0.74);
// "puro codigo": simbolos de codigo
["#c1","#c2"].forEach((c,i)=>{tl.fromTo(c,{opacity:0,scale:0.2,rotation:-20},{opacity:1,scale:1,rotation:i?12:-10,duration:0.4,ease:"back.out(3)",...IR},S[4].s+0.5+i*0.2); tl.to(c,{y:-40,duration:1.5,ease:"sine.inOut"},S[4].s+0.9); tl.to(c,{opacity:0,duration:0.3},S[5].s-0.1);});
// "¿que inventamos ahora?": ladea la cabeza + signo de pregunta
tl.to("#char",{rotation:9,duration:0.35,ease:"back.out(2)"},S[5].s); tl.to("#browR",{y:-14,duration:0.2},S[5].s);
tl.fromTo("#q",{opacity:0,scale:0.2,y:40},{opacity:1,scale:1,y:0,duration:0.45,ease:"back.out(3)",...IR},S[5].s+0.3);
tl.to("#q",{rotation:12,duration:0.4,ease:"sine.inOut",yoyo:true,repeat:3},S[5].s+0.75);
// subtitulos en el globo
const B=document.getElementById("bubble");
S.forEach((s,i)=>{const d=document.createElement("div"); d.className="sub"; d.textContent=s.t; B.appendChild(d);
  tl.fromTo(d,{opacity:0,y:20},{opacity:1,y:0,duration:0.18,...IR},s.s-0.05); const end=i+1<S.length?S[i+1].s-0.08:DUR-0.3; tl.to(d,{opacity:0,duration:0.12},end);});
tl.fromTo("#bubble",{opacity:0,scale:0.6},{opacity:1,scale:1,duration:0.3,ease:"back.out(2.5)",transformOrigin:"50% 100%",...IR},S[0].s-0.15);
tl.to("#bubble",{opacity:0,scale:0.8,duration:0.25},DUR-0.5);
window.__timelines["main"]=tl; tl.seek(0);
</script></body></html>"""
open("index.html","w").write(html.replace("__DUR__",str(DUR)).replace("__OFF__",str(V["off"])).replace("__V__",json.dumps(V,ensure_ascii=False)))
print("ok",DUR)
