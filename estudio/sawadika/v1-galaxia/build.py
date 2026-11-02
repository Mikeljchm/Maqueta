import json, random, re
D = "/tmp/claude-0/-home-user-Maqueta/0ff2d02d-398a-55b3-9e3c-ad2c40e3421f/scratchpad"
timing = json.load(open(D + "/lyric/timing.json"))
braw = open(D + "/lyric/beats_raw.json").read()
beats = json.loads(braw[braw.find("{"):])["beatTimes"]
DUR = 186.9
KEY = {"sawadika", "geneva", "ferrari", "indigo", "lisa", "diva", "bangkok", "tuktuk", "cold", "medic",
       "sky", "ceiling", "championship", "murder", "discipline", "rooftop", "dramatic", "overdramatic", "fanatic", "anaphylactic", "cage", "gun", "salon"}

lines = []
for i, r in enumerate(timing):
    ws = r["words"]
    st = ws[0]["s"] - 0.06
    nxt = timing[i + 1]["words"][0]["s"] - 0.1 if i + 1 < len(timing) else DUR
    en = min(max(ws[-1]["e"] + 1.4, st + 0.8), nxt)
    if i + 1 < len(timing) and nxt - ws[-1]["e"] < 0.6:
        en = nxt
    words = [{"t": w["w"], "s": round(w["s"], 3), "k": re.sub(r"[^a-z]", "", w["w"].lower()) in KEY} for w in ws]
    lines.append({"s": round(st, 3), "e": round(en, 3), "kind": r["kind"], "w": words})

# secciones de color
themes = [("coro", 0), ("verso", 31.2), ("puente", 58.4), ("coro", 72.6), ("verso", 100.0), ("puente", 126.8), ("coro", 141.5), ("outro", 168.4)]
random.seed(11)
parts = [{"x": random.randint(20, 1060), "d": round(random.uniform(7, 15), 2), "o": round(random.uniform(0, 15), 2),
          "s": random.randint(4, 12), "a": round(random.uniform(.35, .9), 2)} for _ in range(36)]
data = {"lines": lines, "beats": beats, "themes": themes, "parts": parts, "dur": DUR}

html = r"""<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="assets/lib/gsap.min.js"></script>
<style>
@font-face{font-family:"Syne";font-weight:700;src:url(assets/fonts/syne-latin-700-normal.woff2) format("woff2")}
@font-face{font-family:"Syne";font-weight:800;src:url(assets/fonts/syne-latin-800-normal.woff2) format("woff2")}
@font-face{font-family:"Playfair";font-weight:700;font-style:italic;src:url(assets/fonts/playfair-display-latin-700-italic.woff2) format("woff2")}
@font-face{font-family:"Playfair";font-weight:900;font-style:italic;src:url(assets/fonts/playfair-display-latin-900-italic.woff2) format("woff2")}
@font-face{font-family:"Inter Tight";font-weight:500;src:url(assets/fonts/inter-tight-latin-500-normal.woff2) format("woff2")}
:root{--gold1:#fff1b8;--gold2:#ffc54d;--gold3:#e08a1e;--pink:#ff3d9a}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#12082e}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#12082e;font-family:"Syne",sans-serif;color:#fff}
.th{position:absolute;inset:0;opacity:0}
.th .b{position:absolute;border-radius:50%}
.th .b1{width:1300px;height:1300px;left:-500px;top:-300px}
.th .b2{width:1200px;height:1200px;left:300px;top:1000px}
#th-coro{background:linear-gradient(170deg,#140840 0%,#2a0d63 55%,#4a0f5e 100%)}
#th-coro .b1{background:radial-gradient(circle,rgba(255,61,154,.55) 0%,rgba(255,61,154,0) 62%)}
#th-coro .b2{background:radial-gradient(circle,rgba(80,60,255,.6) 0%,rgba(80,60,255,0) 62%)}
#th-verso{background:linear-gradient(170deg,#0b0306 0%,#24030c 60%,#3a0710 100%)}
#th-verso .b1{background:radial-gradient(circle,rgba(255,40,60,.55) 0%,rgba(255,40,60,0) 62%)}
#th-verso .b2{background:radial-gradient(circle,rgba(255,120,30,.38) 0%,rgba(255,120,30,0) 62%)}
#th-puente{background:linear-gradient(180deg,#1d2a78 0%,#5b4aa6 40%,#c27fbf 72%,#ffb09a 100%)}
#th-puente .b1{background:radial-gradient(circle,rgba(255,255,255,.28) 0%,rgba(255,255,255,0) 62%)}
#th-puente .b2{background:radial-gradient(circle,rgba(255,200,170,.45) 0%,rgba(255,200,170,0) 62%)}
#th-outro{background:linear-gradient(170deg,#100726 0%,#24104f 60%,#3d1a3a 100%)}
#th-outro .b1{background:radial-gradient(circle,rgba(255,197,77,.45) 0%,rgba(255,197,77,0) 62%)}
#th-outro .b2{background:radial-gradient(circle,rgba(255,61,154,.4) 0%,rgba(255,61,154,0) 62%)}
#stars{position:absolute;inset:0;opacity:0}
#stars i{position:absolute;width:4px;height:4px;border-radius:50%;background:#fff}
#parts{position:absolute;inset:0}
#parts i{position:absolute;top:0;border-radius:50%;background:radial-gradient(circle,#fff 0%,rgba(255,230,180,.0) 70%)}
#pulse{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(255,255,255,.5) 0%,rgba(255,255,255,0) 60%);opacity:0}
#ring{position:absolute;left:290px;top:710px;width:500px;height:500px;border-radius:50%;border:6px solid rgba(255,255,255,.55);opacity:0}
#ghost{position:absolute;left:0;top:760px;white-space:nowrap;font:800 330px/1 "Syne";color:transparent;-webkit-text-stroke:3px rgba(255,255,255,.35);opacity:0}
#head{position:absolute;left:0;right:0;top:110px;text-align:center}
#head .a{font:800 34px "Syne";letter-spacing:.5em;color:#fff;opacity:.92;padding-left:.5em}
#head .b{margin-top:10px;font:500 22px "Inter Tight";letter-spacing:.4em;color:rgba(255,255,255,.6);padding-left:.4em}
#prog{position:absolute;left:140px;right:140px;bottom:150px;height:5px;background:rgba(255,255,255,.18);border-radius:3px;overflow:hidden}
#prog i{position:absolute;inset:0;background:linear-gradient(90deg,var(--pink),var(--gold2));transform-origin:0 50%;transform:scaleX(0)}
#bump{position:absolute;inset:0}
.line{position:absolute;left:70px;right:70px;top:960px;text-align:center;line-height:1.05;opacity:0}
.word{display:inline-block;margin:0 .14em;opacity:0;text-transform:uppercase;font-weight:800;text-shadow:0 8px 40px rgba(0,0,0,.45)}
.word.k{font-family:"Playfair",serif;font-style:italic;font-weight:900;text-transform:none;background:linear-gradient(180deg,var(--gold1) 0%,var(--gold2) 45%,var(--gold3) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 6px 24px rgba(255,170,60,.45));padding:0 .06em}
.verso .word.k{background:linear-gradient(180deg,#fff 0%,#ff9aa5 40%,#ff2a3d 100%);-webkit-background-clip:text;background-clip:text;filter:drop-shadow(0 6px 24px rgba(255,40,60,.5))}
.puente .word{text-transform:none;font-weight:700}
#title,#endc{position:absolute;left:0;right:0;top:760px;text-align:center}
#title .t1,#endc .t1{font:900 italic 190px/1 "Playfair";background:linear-gradient(180deg,var(--gold1),var(--gold2) 50%,var(--gold3));-webkit-background-clip:text;background-clip:text;color:transparent}
#title .t0,#endc .t0{font:800 64px "Syne";letter-spacing:.6em;padding-left:.6em;margin-bottom:24px}
#endc .t2{margin-top:40px;font:500 30px "Inter Tight";letter-spacing:.3em;color:rgba(255,255,255,.7)}
.ch{display:inline-block}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1080" data-height="1920">
  <div id="stage" class="clip" data-start="0" data-duration="__DUR__" data-track-index="0" data-layout-allow-overflow data-layout-allow-overlap data-layout-allow-occlusion style="position:absolute;inset:0">
    <div id="th-coro" class="th"><div class="b b1"></div><div class="b b2"></div></div>
    <div id="th-verso" class="th"><div class="b b1"></div><div class="b b2"></div></div>
    <div id="th-puente" class="th"><div class="b b1"></div><div class="b b2"></div></div>
    <div id="th-outro" class="th"><div class="b b1"></div><div class="b b2"></div></div>
    <div id="stars"></div>
    <div id="parts"></div>
    <div id="pulse"></div>
    <div id="ring"></div>
    <div id="ghost">SAWADIKA · SAWADIKA · SAWADIKA ·</div>
    <div id="bump"></div>
    <div id="title"><div class="t0">LISA</div><div class="t1">Sawadika</div></div>
    <div id="endc"><div class="t0">LISA</div><div class="t1">Sawadika</div><div class="t2">LYRIC VIDEO</div></div>
    <div id="head"><div class="a">LISA</div><div class="b">SAWADIKA</div></div>
    <div id="prog"><i></i></div>
  </div>
  <audio id="song" class="clip" src="assets/audio/song.mp3" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const DATA = __DATA__;
const tl = gsap.timeline({ paused: true });
const $ = (s) => document.querySelector(s);
// ---- estrellas y particulas (deterministas) ----
let rnd = 7; const R = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 70; i++) { const s = document.createElement("i"); s.style.left = (R() * 1080) + "px"; s.style.top = (R() * 1200) + "px"; s.style.opacity = (0.3 + R() * 0.7).toFixed(2); $("#stars").appendChild(s); }
DATA.parts.forEach((p) => {
  const e = document.createElement("i"); e.style.left = p.x + "px"; e.style.width = e.style.height = (p.s * 3) + "px"; e.style.opacity = p.a; $("#parts").appendChild(e);
  const f = (p.o % p.d) / p.d, y0 = 2000 - f * 2080, d0 = p.d * (1 - f);
  tl.fromTo(e, { y: y0 }, { y: -80, duration: d0, ease: "none" }, 0);
  tl.fromTo(e, { y: 2000 }, { y: -80, duration: p.d, ease: "none", repeat: Math.ceil(DATA.dur / p.d), immediateRender: false }, d0);
});
// ---- temas de color ----
DATA.themes.forEach(([k, t], i) => {
  tl.to("#th-" + k, { opacity: 1, duration: i === 0 ? 0.01 : 0.7, ease: "power1.inOut" }, t);
  DATA.themes.forEach(([k2]) => { if (k2 !== k) tl.to("#th-" + k2, { opacity: 0, duration: 0.7, ease: "power1.inOut" }, t); });
  tl.to("#stars", { opacity: k === "puente" ? 1 : 0, duration: 0.8 }, t);
});
tl.to(".th .b1", { x: 380, y: 260, duration: 9, ease: "sine.inOut", yoyo: true, repeat: Math.ceil(DATA.dur / 9) }, 0);
tl.to(".th .b2", { x: -360, y: -320, duration: 11, ease: "sine.inOut", yoyo: true, repeat: Math.ceil(DATA.dur / 11) }, 0);
const themeAt = (t) => { let k = "coro"; DATA.themes.forEach(([kk, tt]) => { if (t >= tt) k = kk; }); return k; };
// ---- pulso con el ritmo ----
DATA.beats.forEach((b, i) => {
  const k = themeAt(b); const gap = (b > 28.2 && b < 31.2) || (b > 138.3 && b < 141.4) || b > 181.5;
  const amp = k === "puente" ? 0.1 : k === "verso" ? 0.32 : 0.38;
  tl.fromTo("#pulse", { opacity: gap ? amp * 1.4 : amp }, { opacity: 0, duration: 0.36, ease: "power2.out" }, b);
  if (k !== "puente") tl.fromTo("#bump", { scale: 1.025 }, { scale: 1, duration: 0.3, ease: "power2.out" }, b);
  if (i % 4 === 0 && k !== "puente") tl.fromTo("#ring", { scale: 0.5, opacity: 0.7 }, { scale: 3.2, opacity: 0, duration: 1.2, ease: "power2.out" }, b);
});
// ---- titulo inicial, huecos instrumentales y cierre ----
tl.from("#title .t0", { opacity: 0, scaleX: 1.6, duration: 0.6, ease: "power3.out" }, 0.05);
tl.from("#title .t1", { opacity: 0, scale: 0.7, duration: 0.6, ease: "back.out(2)" }, 0.15);
tl.to("#title", { opacity: 0, scale: 1.3, filter: "blur(10px)", duration: 0.3, ease: "power2.in" }, 0.85);
[[28.25, 31.3], [138.3, 141.6]].forEach(([a, b]) => {
  tl.fromTo("#ghost", { opacity: 0, x: 0 }, { opacity: 1, duration: 0.4 }, a);
  tl.fromTo("#ghost", { x: 0 }, { x: -1400, duration: b - a, ease: "none" }, a);
  tl.to("#ghost", { opacity: 0, duration: 0.3 }, b - 0.3);
});
tl.from("#endc .t0", { opacity: 0, scaleX: 1.6, duration: 0.9, ease: "power3.out" }, 181.7);
tl.from("#endc .t1", { opacity: 0, scale: 0.7, duration: 0.9, ease: "back.out(1.8)" }, 181.9);
tl.from("#endc .t2", { opacity: 0, y: 30, duration: 0.7, ease: "power3.out" }, 182.4);
tl.to("#endc", { opacity: 0, duration: 1.0, ease: "power1.in" }, 185.6);
gsap.set("#endc", { opacity: 1 });
tl.from("#head", { opacity: 0, y: -30, duration: 0.8 }, 1.0);
tl.to("#head", { opacity: 0, duration: 0.6 }, 181.3);
tl.to("#prog i", { scaleX: 1, duration: DATA.dur, ease: "none" }, 0);
tl.to("#prog", { opacity: 0, duration: 0.6 }, 181.3);
// ---- letra ----
const box = $("#bump");
DATA.lines.forEach((L, li) => {
  const d = document.createElement("div"); d.className = "line " + L.kind;
  const len = L.w.map((w) => w.t).join(" ").length;
  const fs = len <= 15 ? 150 : len <= 22 ? 124 : len <= 30 ? 104 : len <= 40 ? 90 : 80;
  d.style.fontSize = fs + "px";
  L.w.forEach((w) => { const s = document.createElement("span"); s.className = "word" + (w.k ? " k" : ""); s.textContent = w.t; d.appendChild(s); });
  box.appendChild(d);
  gsap.set(d, { yPercent: -50 });
  const ws = d.querySelectorAll(".word");
  tl.set(d, { opacity: 1 }, L.s);
  L.w.forEach((w, j) => {
    const rot = ((j * 37 + li * 13) % 17) - 8;
    if (L.kind === "puente") {
      tl.fromTo(ws[j], { opacity: 0, y: 30, filter: "blur(12px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.55, ease: "power2.out" }, w.s - 0.05);
    } else {
      tl.fromTo(ws[j], { opacity: 0, y: 70, scale: 0.35, rotation: rot }, { opacity: 1, y: 0, scale: 1, rotation: 0, duration: 0.3, ease: "back.out(2.2)" }, w.s - 0.05);
    }
    if (w.k) tl.fromTo(ws[j], { scale: 1.25 }, { scale: 1, duration: 0.45, ease: "elastic.out(1,0.5)" }, w.s + 0.22);
  });
  tl.to(d, { opacity: 0, y: -90, filter: "blur(8px)", duration: 0.28, ease: "power2.in" }, L.e - 0.28);
});
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>
"""
html = html.replace("__DUR__", str(DUR)).replace("__DATA__", json.dumps(data, ensure_ascii=False))
open(D + "/sawadika/index.html", "w").write(html)
print("ok", len(lines), "lines", len(beats), "beats")
