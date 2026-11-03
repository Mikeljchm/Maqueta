import json
L="/tmp/claude-0/-home-user-Maqueta/0ff2d02d-398a-55b3-9e3c-ad2c40e3421f/scratchpad/lab/viz"; V="/tmp/claude-0/-home-user-Maqueta/0ff2d02d-398a-55b3-9e3c-ad2c40e3421f/scratchpad/lab/viz-video"
A=json.load(open(L+"/audio.json")); DUR=round(A["n"]/A["fps"],2)
html=r"""<!doctype html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/>
<script src="assets/lib/gsap.min.js"></script>
<style>
@font-face{font-family:"Syne";font-weight:800;src:url(assets/fonts/syne-latin-800-normal.woff2) format("woff2")}
@font-face{font-family:"Inter Tight";font-weight:500;src:url(assets/fonts/inter-tight-latin-500-normal.woff2) format("woff2")}
*{margin:0;padding:0;box-sizing:border-box} html,body{width:1080px;height:1920px;overflow:hidden;background:#05020c}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#05020c}
#cv{position:absolute;left:0;top:0;width:1080px;height:1920px}
#t1{position:absolute;left:0;right:0;top:1560px;text-align:center;font:800 64px "Syne";letter-spacing:.35em;padding-left:.35em;color:#fff}
#t2{position:absolute;left:0;right:0;top:1650px;text-align:center;font:500 28px "Inter Tight";letter-spacing:.4em;padding-left:.4em;color:rgba(255,255,255,.55)}
#t0{position:absolute;left:0;right:0;top:200px;text-align:center;font:500 26px "Inter Tight";letter-spacing:.5em;padding-left:.5em;color:rgba(255,255,255,.5)}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1080" data-height="1920">
 <div id="stage" class="clip" data-start="0" data-duration="__DUR__" data-track-index="0" data-layout-allow-overflow data-layout-allow-overlap data-layout-allow-occlusion style="position:absolute;inset:0">
  <canvas id="cv" width="1080" height="1920"></canvas>
  <div id="t0">LABORATORIO · AUDIO-REACTIVO</div>
  <div id="t1">SAWADIKA</div><div id="t2">EL SONIDO DIBUJA LA IMAGEN</div>
 </div>
 <audio id="au" class="clip" src="assets/audio/clip.mp3" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const A=__A__, DUR=__DUR__, FPS=A.fps;
const cv=document.getElementById("cv"), g=cv.getContext("2d"); const CX=540, CY=880;
let rs=12345; const R=()=>(rs=(rs*16807)%2147483647)/2147483647;
// particulas: nacen en cada golpe y salen disparadas desde el orbe
const P=[]; A.kicks.forEach(k=>{for(let i=0;i<70;i++){const a=R()*Math.PI*2, v=380+R()*900; P.push({t:k,a,v,s:2+R()*5,h:R()<0.5?330:(R()<0.5?45:270),life:0.9+R()*0.9});}});
const stars=[]; for(let i=0;i<160;i++) stars.push({x:R()*1080,y:R()*1920,s:R()*2+0.5,p:R()*6});
const lerp=(a,b,t)=>a+(b-a)*t;
function at(arr,t){const f=Math.min(arr.length-1,Math.max(0,t*FPS)); const i=Math.floor(f), j=Math.min(arr.length-1,i+1); return lerp(arr[i],arr[j],f-i);}
function draw(t){
  const bass=at(A.bass,t), mid=at(A.mid,t), hi=at(A.hi,t), fi=Math.min(A.n-1,Math.floor(t*FPS)), bands=A.bands[fi];
  const hue=300+40*Math.sin(t*0.4);
  // fondo
  const bg=g.createRadialGradient(CX,CY,50,CX,CY,1300); bg.addColorStop(0,`hsla(${hue},70%,${8+bass*14}%,1)`); bg.addColorStop(1,"#05020c"); g.fillStyle=bg; g.fillRect(0,0,1080,1920);
  // estrellas que titilan con los agudos
  stars.forEach(s=>{g.globalAlpha=0.25+0.75*Math.abs(Math.sin(t*1.3+s.p))*(0.4+hi); g.fillStyle="#fff"; g.fillRect(s.x,s.y,s.s,s.s);}); g.globalAlpha=1;
  // ondas expansivas en cada golpe
  A.kicks.forEach(k=>{const d=t-k; if(d<0||d>1.2) return; const r=260+d*900; g.strokeStyle=`hsla(${hue+20},100%,70%,${(1-d/1.2)*0.6})`; g.lineWidth=6*(1-d/1.2)+1; g.beginPath(); g.arc(CX,CY,r,0,Math.PI*2); g.stroke();});
  // anillo de barras (espectro en espejo)
  const nb=bands.length, NB=nb*2, base=230+bass*60, rot=t*0.25;
  for(let i=0;i<NB;i++){ const v=bands[i<nb?i:NB-1-i]; const a=rot+i/NB*Math.PI*2; const len=20+v*v*360;
    const x1=CX+Math.cos(a)*base, y1=CY+Math.sin(a)*base, x2=CX+Math.cos(a)*(base+len), y2=CY+Math.sin(a)*(base+len);
    const gr=g.createLinearGradient(x1,y1,x2,y2); gr.addColorStop(0,`hsla(${hue},100%,65%,0.95)`); gr.addColorStop(1,`hsla(${hue+60},100%,75%,0.2)`);
    g.strokeStyle=gr; g.lineWidth=9; g.lineCap="round"; g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
  // anillo de puntos (medios)
  for(let i=0;i<64;i++){const a=-rot*1.6+i/64*Math.PI*2; const v=bands[(i*3)%nb]; const r=base+430+v*80; g.fillStyle=`hsla(${hue+90},100%,80%,${0.3+v*0.7})`; g.beginPath(); g.arc(CX+Math.cos(a)*r,CY+Math.sin(a)*r,3+v*7,0,Math.PI*2); g.fill();}
  // orbe central que late con el bajo
  const orb=170+bass*70; const og=g.createRadialGradient(CX-orb*0.3,CY-orb*0.3,10,CX,CY,orb);
  og.addColorStop(0,"#fff"); og.addColorStop(0.25,`hsla(${hue+40},100%,75%,1)`); og.addColorStop(0.8,`hsla(${hue},100%,45%,1)`); og.addColorStop(1,`hsla(${hue},100%,30%,0)`);
  g.shadowColor=`hsla(${hue},100%,60%,1)`; g.shadowBlur=60+bass*80; g.fillStyle=og; g.beginPath(); g.arc(CX,CY,orb,0,Math.PI*2); g.fill(); g.shadowBlur=0;
  // particulas
  P.forEach(p=>{const d=t-p.t; if(d<0||d>p.life) return; const e=1-Math.pow(1-d/p.life,3); const r=orb*0.8+p.v*e*0.9; const x=CX+Math.cos(p.a)*r, y=CY+Math.sin(p.a)*r+d*d*120;
    g.fillStyle=`hsla(${p.h},100%,75%,${1-d/p.life})`; g.beginPath(); g.arc(x,y,p.s*(1-d/p.life*0.6),0,Math.PI*2); g.fill();});
  // onda del sonido abajo
  g.strokeStyle=`hsla(${hue+30},100%,75%,0.8)`; g.lineWidth=4; g.beginPath();
  for(let i=0;i<=120;i++){const x=90+i*7.5; const v=bands[Math.floor(i/120*(nb-1))]; const y=1460+Math.sin(i*0.35+t*9)*v*55; i?g.lineTo(x,y):g.moveTo(x,y);} g.stroke();
}
const tl=gsap.timeline({paused:true}); const st={t:0};
tl.to(st,{t:DUR,duration:DUR,ease:"none",onUpdate:()=>draw(tl.time())},0);
tl.from("#t1",{opacity:0,y:40,duration:0.8},0.2); tl.from("#t2",{opacity:0,duration:0.8},0.6); tl.from("#t0",{opacity:0,duration:0.8},0.4);
tl.to(["#t0","#t1","#t2"],{opacity:0,duration:0.6},DUR-0.8);
draw(0); window.__timelines["main"]=tl; tl.seek(0);
</script></body></html>"""
open(V+"/index.html","w").write(html.replace("__DUR__",str(DUR)).replace("__A__",json.dumps(A)))
print("ok",DUR)
