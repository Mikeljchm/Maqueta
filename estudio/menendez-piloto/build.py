import json, subprocess, sys
sys.path.insert(0, "/tmp/claude-0/-home-user-Maqueta/0ff2d02d-398a-55b3-9e3c-ad2c40e3421f/scratchpad/menendez")
from plan import *
G = json.load(open("/tmp/claude-0/-home-user-Maqueta/0ff2d02d-398a-55b3-9e3c-ad2c40e3421f/scratchpad/menendez/guion.json"))
TXT = {k: t for k, t in G}
def vdur(k): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f"{V}/assets/vid/{k}.mp4"],capture_output=True,text=True).stdout)
def at(k, word):  # momento aproximado en que la narradora dice 'word' (proporcional a los caracteres)
    t = TXT[k]; i = t.find(word); return round(NAR[k] + ND[k] * (i / len(t)), 2) if i >= 0 else NAR[k]

# planos: (video, inicio, fin, brillo, recorte_inicio)
SHOTS = [("tape",0,9,.35,0),("city",9,17.3,.7,0),("police",17.3,25.8,.6,0),("hall",26,33,.5,0),
         ("palms",35.5,43,.65,0),("luxury",43,50.5,.5,0),("mansion",50.5,61,.6,0),
         ("highway",63.5,76,.75,0),("shells",76,86,1.0,0),
         ("tv",97.5,107.5,.8,0),("clock",107.5,113.5,.55,0),("hall",119.5,126,.5,4),
         ("rain",129.5,137.5,.6,0),("city",137.5,145.5,.6,4),("festival",145.5,153.5,.55,0),("clock",153.5,159.5,.45,6),
         ("tape",159.5,173.5,.28,0),("tape",173.5,182.5,.28,3),
         ("police",183,191,.55,5),("mansion",191,198,.5,3),("rain",198,206.5,.4,5),
         ("cuffs",206.5,216.5,.9,0)]
VD = {}
vids = []
for i, (k, a, b, br, ms) in enumerate(SHOTS):
    d = VD.setdefault(k, vdur(k)); dd = round(min(b - a, d - ms - 0.05), 2)
    vids.append(f'<video id="v{i}" class="clip vid" src="assets/vid/{k}.mp4" muted playsinline data-start="{a}" data-duration="{dd}" data-media-start="{ms}" data-track-index="{2+i%2}" style="filter:brightness({br}) contrast(1.12) saturate(.78) sepia(.08)"></video>')
CALLL = [("LYLE","Someone killed my parents!","¡Alguien mató a mis padres!"),
         ("OPERADORA","What happened? We have units en route.","¿Qué pasó? Las unidades van en camino."),
         ("LYLE","Shut up! Erik, shut up!","¡Cállate! ¡Erik, cállate!"),
         ("LYLE","Erik, get away from them!","¡Erik, aléjate de ellos!")]
data = {"dur": DUR, "nar": NAR, "nd": ND, "ch": CH, "call": CALL, "title": TITLE, "vera": VERA, "end": END, "imp": IMPACTS,
        "shots": [[s[1], s[2]] for s in SHOTS], "calll": CALLL,
        "cues": {"jose": at("s1","José, de"), "kitty": at("s1","Kitty tenía"), "lyle": at("s1","Lyle,"), "erik": at("s1","Erik, de"),
                 "map": at("s2","manejan"), "recibo": at("s2","Para hacerlo"), "movie": at("s3","La espía"),
                 "j6": at("s3","José recibe"), "k10": at("s3","Kitty, diez"), "last": at("s3","Cuando se les"),
                 "mul": at("s4","Mulholland"), "bat": at("s4","Batman"), "taste": at("s4","Taste"),
                 "mafia": at("s6","un ajuste"), "money": at("s6","setecientos"), "oziel": at("s7","Oziel"),
                 "arr": at("s7","El ocho"), "ent": at("s7","Tres días"), "cond": at("s7","En mil novecientos noventa y seis")}}
auds = [f'<audio id="a_{k}" class="clip" src="assets/audio/{k}.wav" data-start="{s}" data-track-index="{20+i}" data-volume="1"></audio>' for i, (k, s) in enumerate(NAR.items())]
auds.append(f'<audio id="a_mus" class="clip" src="assets/audio/musica.wav" data-start="0" data-duration="{DUR}" data-track-index="30" data-volume="0.8"></audio>')

html = r"""<!doctype html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1920, height=1080"/>
<script src="assets/lib/gsap.min.js"></script>
<style>
@font-face{font-family:"Playfair";font-weight:900;font-style:italic;src:url(assets/fonts/playfair-display-latin-900-italic.woff2) format("woff2")}
@font-face{font-family:"Playfair";font-weight:700;font-style:italic;src:url(assets/fonts/playfair-display-latin-700-italic.woff2) format("woff2")}
@font-face{font-family:"Inter Tight";font-weight:500;src:url(assets/fonts/inter-tight-latin-500-normal.woff2) format("woff2")}
@font-face{font-family:"Inter Tight";font-weight:700;src:url(assets/fonts/inter-tight-latin-700-normal.woff2) format("woff2")}
@font-face{font-family:"Bebas";src:url(assets/fonts/bebas-neue-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Marker";src:url(assets/fonts/permanent-marker-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Mono";font-weight:700;src:url(assets/fonts/DejaVuSansMono-Bold.ttf) format("truetype")}
:root{--red:#c8102e;--wine:#5a0b16;--paper:#efe6d3}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:#050304}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:#050304;font-family:"Inter Tight",sans-serif;color:#fff}
.vid{position:absolute;inset:0;width:1920px;height:1080px;object-fit:cover}
#all{position:absolute;inset:0}
.L{position:absolute;inset:0}
.o{opacity:0}
#grain{position:absolute;left:0;top:0;width:2880px;height:1620px;background:url(assets/img/grain.png) 0 0/960px 540px;opacity:.09;mix-blend-mode:screen}
#vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 45%,rgba(0,0,0,.78) 100%)}
#tint{position:absolute;inset:0;background:linear-gradient(180deg,rgba(90,11,22,.25),rgba(10,20,40,.25));mix-blend-mode:multiply}
.gl{position:absolute;inset:0;background-size:1920px 1080px;mix-blend-mode:screen;opacity:0}
#flash{position:absolute;inset:0;background:#fff;opacity:0}
#blk{position:absolute;inset:0;background:#050304;opacity:0}
.tag{position:absolute;left:110px;bottom:120px;font:700 30px "Inter Tight";letter-spacing:.32em;text-transform:uppercase;opacity:0}
.tag .bar{display:inline-block;width:60px;height:4px;background:var(--red);vertical-align:middle;margin-right:24px}
.tag small{display:block;margin-top:12px;font:700 italic 44px "Playfair";letter-spacing:0;text-transform:none;color:#e9dccb}
/* titulo */
#title{position:absolute;left:0;right:0;top:360px;text-align:center;opacity:0}
.tt{position:relative;display:inline-block;font:900 italic 150px/1 "Playfair"}
.tt i{position:absolute;left:0;top:0;font-style:italic;mix-blend-mode:screen}
.tt .r{color:#ff1744}.tt .c{color:#00e5ff}.tt .w{position:relative;color:#fff}
#title .sub{margin-top:36px;font:500 34px "Inter Tight";letter-spacing:.5em;text-transform:uppercase;color:#d8c8b8;padding-left:.5em}
#title .line{width:0;height:3px;background:var(--red);margin:34px auto 0}
/* capitulos */
.chap{position:absolute;inset:0;background:#050304;opacity:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.chap .n{font:400 46px "Bebas";letter-spacing:.5em;color:var(--red);padding-left:.5em}
.chap .t{margin-top:10px;font:900 italic 120px "Playfair";color:#fff}
/* fichas */
.card{position:absolute;right:110px;width:520px;height:150px;background:rgba(10,6,8,.82);border-left:6px solid var(--red);display:flex;align-items:center;gap:26px;padding:0 26px;opacity:0;box-shadow:0 20px 50px rgba(0,0,0,.5)}
.card svg{flex:0 0 96px}
.card .nm{font:900 italic 44px/1 "Playfair"}
.card .ag{margin-top:10px;font:700 22px "Inter Tight";letter-spacing:.25em;color:#d6b7b7;text-transform:uppercase}
/* mapa */
#map{position:absolute;right:140px;top:170px;width:620px;height:700px;opacity:0}
#map .lbl{position:absolute;font:700 24px "Inter Tight";letter-spacing:.2em;text-transform:uppercase}
#map .km{position:absolute;left:300px;top:330px;font:400 64px "Bebas";color:var(--red)}
/* recibo */
#rec{position:absolute;left:560px;top:120px;width:800px;padding:50px 60px;background:var(--paper);color:#231a14;font:700 30px/1.5 "Mono";box-shadow:0 30px 80px rgba(0,0,0,.7);opacity:0}
#rec h3{font:700 40px "Mono";text-align:center;border-bottom:3px dashed #8a7a66;padding-bottom:16px;margin-bottom:18px}
#rec .hl{background:rgba(200,16,46,.18)}
#rec .st{position:absolute;right:-30px;top:-34px;transform:rotate(12deg);background:rgba(239,230,211,.9);border:6px solid var(--red);color:var(--red);font:400 54px "Bebas";padding:4px 18px;letter-spacing:.06em;opacity:0}
#rec .note{margin-top:20px;font:500 italic 20px "Inter Tight";color:#7d6c5c}
/* contadores */
.cnt{position:absolute;left:0;right:0;text-align:center;opacity:0}
.cnt .k{font:700 34px "Inter Tight";letter-spacing:.4em;color:#d0c0c0;padding-left:.4em}
.cnt .v{font:400 260px/0.95 "Bebas";color:var(--red);text-shadow:0 0 60px rgba(200,16,46,.6)}
.cnt .u{font:400 52px "Bebas";letter-spacing:.3em;color:#fff;padding-left:.3em}
/* llamada */
#call{position:absolute;left:250px;right:250px;top:90px;bottom:90px;border:2px solid rgba(255,255,255,.18);background:rgba(5,3,4,.55);opacity:0}
#call .hd{position:absolute;left:44px;right:44px;top:34px;display:flex;justify-content:space-between;font:700 26px "Mono";color:#c9b8a6;letter-spacing:.08em}
#call .rec{color:#ff2b3a}
#wave{position:absolute;left:44px;right:44px;top:120px;height:180px}
.cl{position:absolute;left:70px;right:70px;opacity:0}
.cl .who{font:700 24px "Mono";color:var(--red);letter-spacing:.2em}
.cl .en{margin-top:6px;font:700 50px "Mono";color:#fff}
.cl .es{margin-top:6px;font:700 italic 38px "Playfair";color:#e6cfa8}
#call .ft{position:absolute;left:44px;bottom:26px;font:500 italic 22px "Inter Tight";color:#9b8b7b}
/* sellos y textos */
.stamp{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-8deg);border:8px solid var(--red);color:var(--red);font:400 92px "Bebas";padding:8px 34px;letter-spacing:.06em;opacity:0;background:rgba(5,3,4,.35);white-space:nowrap}
#money{position:absolute;left:0;right:0;top:330px;text-align:center;opacity:0}
#money .v{font:400 230px "Bebas";color:#e9d9a6;text-shadow:0 0 50px rgba(233,217,166,.35)}
#money .k{font:700 30px "Inter Tight";letter-spacing:.4em;color:#cdb;padding-left:.4em}
#paper{position:absolute;left:440px;top:150px;width:1040px;height:760px;background:var(--paper);color:#1d1712;padding:60px 70px;box-shadow:0 30px 90px rgba(0,0,0,.8);opacity:0;transform:rotate(-2deg)}
#paper .mast{font:900 italic 74px "Playfair";text-align:center;border-bottom:4px double #3a2e24;padding-bottom:12px}
#paper .date{font:700 20px "Inter Tight";letter-spacing:.3em;text-align:center;margin:12px 0 26px;color:#5a4a3a}
#paper .hl{font:400 150px/0.95 "Bebas";text-align:center}
#paper .dk{margin-top:24px;font:700 italic 36px "Playfair";text-align:center;color:#3a2e24}
#paper .rc{position:absolute;right:30px;bottom:18px;font:500 italic 18px "Inter Tight";color:#8a7a68}
#vera{position:absolute;left:640px;top:250px;width:640px;height:500px;background:#f3ecd9;box-shadow:0 30px 80px rgba(0,0,0,.8);opacity:0;padding:70px 60px;transform:rotate(3deg)}
#vera:before{content:"";position:absolute;left:280px;top:-18px;width:90px;height:40px;background:rgba(200,16,46,.75);transform:rotate(-4deg)}
#vera .tx{font:400 54px/1.3 "Marker";color:#b3001b}
#vera .sg{margin-top:30px;text-align:right;font:400 60px "Marker";color:#b3001b}
#endc{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0}
#endc .h{font:400 40px "Bebas";letter-spacing:.6em;color:var(--red);padding-left:.6em}
#endc .t{font:900 italic 130px "Playfair"}
#endc .s{margin-top:26px;font:700 30px "Inter Tight";letter-spacing:.35em;text-transform:uppercase;color:#d6c6b6;padding-left:.35em}
#endc .f{position:absolute;bottom:60px;font:500 20px "Inter Tight";color:#8d7d6d;letter-spacing:.06em;text-align:center}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1920" data-height="1080">
__VIDS__
<div id="all" class="clip" data-start="0" data-duration="__DUR__" data-track-index="10" data-layout-allow-overflow data-layout-allow-overlap data-layout-allow-occlusion>
 <div id="tint"></div><div id="vig"></div>
 <div id="blk"></div>
 <div id="fx" class="L"></div>
 <div id="grain"></div>
 <div class="gl" id="g0" style="background-image:url(assets/img/glitch0.png)"></div><div class="gl" id="g1" style="background-image:url(assets/img/glitch1.png)"></div><div class="gl" id="g2" style="background-image:url(assets/img/glitch2.png)"></div>
 <div id="flash"></div>
</div>
__AUDS__
</div>
<script>
const D=__DATA__, C=D.cues, tl=gsap.timeline({paused:true}), IR={immediateRender:false};
const $=(s,r)=>(r||document).querySelector(s);
const mk=(tag,cls,html,p,st)=>{const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; if(st)e.setAttribute("style",st); (p||$("#fx")).appendChild(e); return e;};
const show=(el,t,d=0.5)=>tl.fromTo(el,{opacity:0},{opacity:1,duration:d,ease:"power1.out",...IR},t);
const hide=(el,t,d=0.5)=>tl.fromTo(el,{opacity:1},{opacity:0,duration:d,ease:"power1.in",...IR},t);
// ---- videos: fundidos suaves y empuje lento de camara ----
document.querySelectorAll(".vid").forEach((v,i)=>{const [a,b]=D.shots[i]; tl.fromTo(v,{opacity:0},{opacity:1,duration:0.6,...IR},a); tl.fromTo(v,{opacity:1},{opacity:0,duration:0.6,...IR},b-0.6);});
// ---- grano y glitch ----
tl.to("#grain",{x:-960,y:-540,duration:0.4,ease:"steps(12)",repeat:Math.ceil(D.dur/0.4)},0);
function glitch(t,s=1){ ["#g0","#g1","#g2"].forEach((g,i)=>{tl.fromTo(g,{opacity:0.9*s,x:(i-1)*40},{opacity:0,x:(i-1)*-30,duration:0.18+i*0.05,ease:"steps(4)",...IR},t+i*0.04);});
  tl.fromTo("#fx",{x:-18*s,skewX:6*s},{x:0,skewX:0,duration:0.22,ease:"steps(5)",...IR},t); }
D.imp.forEach(t=>{glitch(t,1.2); tl.fromTo("#flash",{opacity:0.55},{opacity:0,duration:0.35,...IR},t);});
[3.2,5.6,17.3,43,50.5,76,86,107.5,113.5,116.2,119.5,137.5,145.5,153.5,164.5,170,175.5,191,198,216.5].forEach(t=>glitch(t,0.6));
// negro detras de tarjetas y capitulos
const blackSeg=(a,b,o=1)=>{tl.fromTo("#blk",{opacity:0},{opacity:o,duration:0.4,...IR},a); tl.fromTo("#blk",{opacity:o},{opacity:0,duration:0.5,...IR},b-0.5);};
// ---- arranque en frio: la llamada ----
const callBox=mk("div",null,null,null,"position:absolute;inset:0"); callBox.id="callwrap";
const call=mk("div",null,'<div class="hd"><span>BEVERLY HILLS POLICE DEPT. · LÍNEA 911</span><span class="rec">● REC 20.08.1989 · 23:47</span></div><canvas id="wave" width="1332" height="180"></canvas><div class="ft">Extractos de la transcripción de la llamada real · recreación visual</div>',callBox); call.id="call";
const lines=D.calll.map((l,i)=>{const e=mk("div","cl",`<div class="who">${l[0]}</div><div class="en">${l[1]}</div><div class="es">${l[2]}</div>`,call); e.style.top=(330+i*0)+"px"; return e;});
// onda de audio (determinista) solo mientras "habla"
const W=$("#wave"), g=W.getContext("2d"); let speak=[[1.0,6.5]];
const callT=[D.call[0]+0.6,D.call[0]+6.2,D.call[0]+11.6,D.call[0]+16.8]; callT.forEach((t,i)=>speak.push([t,t+(i==1?4.2:3.6)]));
function wave(t){ g.clearRect(0,0,1332,180); const on=speak.some(([a,b])=>t>=a&&t<b); const vis=(t<9)||(t>=D.call[0]&&t<D.call[1]); if(!vis) return;
  for(let x=0;x<111;x++){ const s=Math.sin(x*12.9898+Math.floor(t*12)*78.233)*43758.5453; const r=s-Math.floor(s); const amp=on?(0.25+r*0.75):(0.04+r*0.06);
    const h=amp*170; g.fillStyle=on?"#ff2b3a":"#5a4a4a"; g.fillRect(x*12,90-h/2,7,h);} }
const st={t:0}; tl.to(st,{t:D.dur,duration:D.dur,ease:"none",onUpdate:()=>wave(tl.time())},0);
// en frio: solo la primera frase
show(call,0.3,0.4); show(lines[0],1.0,0.15); hide(lines[0],7.6,0.2); hide(call,8.4,0.5);
// llamada completa
show(call,D.call[0]+0.2,0.4); callT.forEach((t,i)=>{show(lines[i],t,0.15); glitch(t,0.5); hide(lines[i],(i<3?callT[i+1]:D.call[1])-0.5,0.25);}); hide(call,D.call[1]-0.4,0.4);
// ---- etiquetas de lugar ----
const tag=(t,a,b,txt,sub)=>{const e=mk("div","tag",`<span class="bar"></span>${txt}${sub?`<small>${sub}</small>`:""}`); show(e,a,0.6); tl.fromTo(e,{x:-30},{x:0,duration:0.8,ease:"power3.out",...IR},a); hide(e,b,0.6); return e;};
tag(0,D.nar.s0+0.3,D.nar.s0+7.5,"Beverly Hills, California","Domingo 20 de agosto de 1989");
tag(0,D.nar.s0+8.3,D.nar.s0+15.5,"23:47 · Línea de emergencias","Una llamada que lo cambió todo");
// ---- titulo ----
const T=mk("div",null,'<div class="tt"><i class="r">La noche de Elm Drive</i><i class="c">La noche de Elm Drive</i><span class="w">La noche de Elm Drive</span></div><div class="line"></div><div class="sub">El crimen de los hermanos Menéndez</div>'); T.id="title";
show(T,D.title[0]+0.1,0.3); tl.fromTo("#title .r",{x:-14},{x:-4,duration:2.5,ease:"none",...IR},D.title[0]); tl.fromTo("#title .c",{x:14},{x:4,duration:2.5,ease:"none",...IR},D.title[0]);
tl.fromTo("#title .line",{width:0},{width:520,duration:1.2,ease:"power3.out",...IR},D.title[0]+0.8); tl.from("#title .sub",{opacity:0,y:20,duration:0.8},D.title[0]+1.2);
[D.title[0]+2.6,D.title[0]+4.4].forEach(t=>glitch(t,0.8)); hide(T,D.title[1]-0.6,0.5);
// ---- capitulos ----
D.ch.forEach(([t,n,txt])=>{const e=mk("div","chap",`<div class="n">CAPÍTULO ${n}</div><div class="t">${txt}</div>`); show(e,t,0.25); tl.from(e.querySelector(".t"),{opacity:0,y:30,duration:0.7,ease:"power3.out"},t+0.25); hide(e,t+2.4,0.35);});
// ---- fichas de la familia ----
const sil='<svg width="96" height="110" viewBox="0 0 96 110"><circle cx="48" cy="32" r="22" fill="#3a2a2e"/><path d="M8 110 C8 70 88 70 88 110 Z" fill="#3a2a2e"/></svg>';
[["jose","José Menéndez","45 años · ejecutivo"],["kitty","Kitty Menéndez","47 años · madre"],["lyle","Lyle Menéndez","21 años · hijo mayor"],["erik","Erik Menéndez","18 años · hijo menor"]].forEach(([k,n,a],i)=>{
  const e=mk("div","card",`${sil}<div><div class="nm">${n}</div><div class="ag">${a}</div></div>`); e.style.top=(150+i*175)+"px";
  show(e,C[k],0.4); tl.fromTo(e,{x:60},{x:0,duration:0.6,ease:"power3.out",...IR},C[k]); glitch(C[k],0.3); hide(e,D.nar.s1+D.nd.s1-0.3,0.5);});
// ---- mapa LA -> San Diego ----
const map=mk("div",null,`<svg width="620" height="700" viewBox="0 0 620 700"><path d="M60 40 C120 120 170 160 210 230 C250 300 300 360 340 430 C380 500 420 560 470 660" stroke="#6b5a4a" stroke-width="5" fill="none" opacity=".6"/>
<path id="route" d="M230 250 C280 320 330 420 420 600" stroke="#c8102e" stroke-width="7" fill="none" stroke-dasharray="560" stroke-dashoffset="560" stroke-linecap="round"/>
<circle cx="230" cy="250" r="14" fill="#fff"/><circle id="sd" cx="420" cy="600" r="14" fill="#c8102e"/></svg>
<div class="lbl" style="left:20px;top:200px">Los Ángeles</div><div class="lbl" style="left:440px;top:610px;color:#ff5a6a">San Diego</div><div class="km">≈ 190 KM</div>`); map.id="map";
show(map,C.map,0.5); tl.fromTo("#route",{attr:{"stroke-dashoffset":560}},{attr:{"stroke-dashoffset":0},duration:3,ease:"power2.inOut",...IR},C.map+0.4);
tl.from("#map .km",{opacity:0,scale:0.6,duration:0.5,ease:"back.out(2)"},C.map+3.2); hide(map,74.5,0.6);
// ---- recibo recreado ----
const rec=mk("div",null,`<h3>BIG 5 SPORTING GOODS</h3>SAN DIEGO, CA · 18/08/1989<br>────────────────────────<br>2 × ESCOPETA MOSSBERG CAL. 12<br>MUNICIÓN (PERDIGÓN / POSTA)<br>────────────────────────<br><span class="hl">IDENTIFICACIÓN: DONOVAN GOODREAU</span><div class="st">IDENTIDAD PRESTADA</div><div class="note">Recreación ilustrativa basada en el expediente del caso</div>`); rec.id="rec";
blackSeg(86,94.6,0.92); show(rec,86.2,0.5); tl.fromTo(rec,{y:40,rotation:-3},{y:0,rotation:-1.5,duration:0.8,ease:"power3.out",...IR},86.2);
show($("#rec .st"),C.recibo+3.0,0.1); tl.fromTo("#rec .st",{scale:2.2},{scale:1,duration:0.25,ease:"power4.in",...IR},C.recibo+3.0); glitch(C.recibo+3.0,0.7); hide(rec,94.2,0.5);
// ---- la noche ----
tag(0,C.movie,C.movie+6,"En pantalla","La espía que me amó (1977)");
blackSeg(112.7,119.8,1);
const c1=mk("div","cnt",'<div class="k">JOSÉ MENÉNDEZ</div><div class="v">6</div><div class="u">disparos</div>'); c1.style.top="230px";
const c2=mk("div","cnt",'<div class="k">KITTY MENÉNDEZ</div><div class="v">10</div><div class="u">disparos</div>'); c2.style.top="230px";
show(c1,C.j6-0.2,0.15); glitch(C.j6,1); hide(c1,C.k10-0.35,0.2); show(c2,C.k10-0.15,0.15); glitch(C.k10,1); hide(c2,119.4,0.4);
tl.fromTo("#flash",{opacity:0.35},{opacity:0,duration:0.3,...IR},C.j6); tl.fromTo("#flash",{opacity:0.35},{opacity:0,duration:0.3,...IR},C.k10);
// ---- coartada ----
tag(0,C.mul-0.2,C.mul+6.5,"Mulholland Drive","Allí enterraron las escopetas");
tag(0,C.bat,C.bat+5,"Batman (1989)","Los boletos llevaban la hora impresa");
tag(0,C.taste,C.taste+7,"Taste of L.A. · Santa Mónica","La coartada");
// ---- pista falsa y dinero ----
const sm=mk("div","stamp","HIPÓTESIS: AJUSTE DE CUENTAS"); show(sm,C.mafia,0.1); tl.fromTo(sm,{scale:2},{scale:1,duration:0.25,ease:"power4.in",...IR},C.mafia); glitch(C.mafia,0.8); hide(sm,C.mafia+5,0.4);
const mo=mk("div",null,'<div class="v">$0</div><div class="k">GASTADOS EN MESES</div>'); mo.id="money"; const mv={v:0};
show(mo,C.money-0.3,0.4); tl.to(mv,{v:700000,duration:2.4,ease:"power2.out",onUpdate:()=>{mo.firstChild.textContent="$"+Math.round(mv.v).toLocaleString("es-ES")}},C.money); hide(mo,D.nar.s6+D.nd.s6+0.4,0.5);
// ---- final: arresto y condena ----
tag(0,C.arr,C.arr+3.6,"8 de marzo de 1990","Lyle es arrestado frente a la mansión");
tag(0,C.ent,C.ent+3.4,"11 de marzo de 1990","Erik se entrega");
const pp=mk("div",null,'<div class="mast">The Daily Record</div><div class="date">LOS ÁNGELES · 1996</div><div class="hl">CONDENADOS</div><div class="dk">Lyle y Erik Menéndez, culpables del asesinato de sus padres</div><div class="rc">Recreación</div>'); pp.id="paper";
blackSeg(216.5,224.4,1); show(pp,216.8,0.4); tl.fromTo(pp,{scale:1.25,rotation:-8},{scale:1,rotation:-2,duration:0.9,ease:"power3.out",...IR},216.8); glitch(217.6,0.6); hide(pp,224,0.4);
// ---- nota de Vera ----
const ve=mk("div",null,'<div class="tx">Esperaron a la policía.<br>Nunca llegó.</div><div class="sg">— V.</div>'); ve.id="vera";
blackSeg(D.vera[0],D.vera[1]+0.3,1); show(ve,D.vera[0]+0.3,0.4); tl.fromTo(ve,{y:60,rotation:8},{y:0,rotation:3,duration:0.9,ease:"power3.out",...IR},D.vera[0]+0.3); hide(ve,D.vera[1]-0.4,0.4);
// ---- cierre ----
const en=mk("div",null,'<div class="h">Relaciones Peligrosas</div><div class="t">Hasta que la muerte…</div><div class="s">Suscríbete · nuevo caso cada semana</div><div class="f">Fuentes: registros judiciales y prensa de la época · Video de ambiente: Pixabay · Documentos y diálogos: recreaciones ilustrativas</div>'); en.id="endc";
blackSeg(D.end[0],D.dur+1,1); show(en,D.end[0]+0.3,0.8); glitch(D.end[0]+0.4,0.8); tl.from("#endc .s",{opacity:0,y:20,duration:0.8},D.end[0]+1.3); hide(en,D.dur-1.6,1.2);
window.__timelines["main"]=tl; tl.seek(0);
</script></body></html>"""
html = (html.replace("__DUR__", str(DUR)).replace("__VIDS__", "\n".join(vids)).replace("__AUDS__", "\n".join(auds))
        .replace("__DATA__", json.dumps(data, ensure_ascii=False)))
open(V + "/index.html", "w").write(html)
print("ok", len(vids), "planos", data["cues"])
