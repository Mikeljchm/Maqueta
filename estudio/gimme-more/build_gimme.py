import json, re, math
D = "/tmp/claude-0/-home-user-Maqueta/0ff2d02d-398a-55b3-9e3c-ad2c40e3421f/scratchpad"
timing = json.load(open(D + "/gimme/timing.json"))
braw = open(D + "/gimme/beats_raw.json").read()
beats = json.loads(braw[braw.find("{"):])["beatTimes"]
DUR = 249.1
norm = lambda t: re.sub(r"[^a-z]", "", t.lower())

# secciones: (nombre, inicio, fin)
SEC = [("intro", 0, 14), ("v1", 14, 54.85), ("ch1", 54.85, 71.95), ("v2", 71.95, 105.8), ("ch2", 105.8, 122.95),
       ("br", 122.95, 139.6), ("ch3", 139.6, 157.4), ("post", 157.4, 173.55), ("gim", 173.55, 190.5), ("ch4", 190.5, 207.6),
       ("cred", 207.6, 228.6), ("out", 228.6, DUR)]
def sec(t):
    for n, a, b in SEC:
        if a <= t < b: return n
    return "out"

lines = []
for i, r in enumerate(timing):
    ws = r["words"]
    st = ws[0]["s"] - 0.1
    nxt = timing[i + 1]["words"][0]["s"] - 0.08 if i + 1 < len(timing) else DUR
    en = min(max(ws[-1]["e"] + 1.0, st + 0.6), nxt)
    if i + 1 < len(timing) and nxt - ws[-1]["e"] < 0.8: en = nxt
    words, bk = [], False
    for w in ws:
        t = w["w"]
        if t.startswith("("): bk = True
        cls = "bk" if bk else ""
        n = norm(t)
        if n == "more" and t.count("(") == t.count(")"): cls = "m"; t = t.strip("()?!.,")
        if n in ("britney", "bitch", "danja", "lago", "spears", "legendary", "incredible", "unstoppable"): cls = (cls + " n").strip()
        if n in ("cameras", "flashin", "watching", "rockin", "dancin", "attention", "permission", "mission", "control"): cls = (cls + " k").strip()
        words.append({"t": t, "s": round(w["s"], 3), "c": cls})
        if w["w"].endswith(")"): bk = False
    lines.append({"s": round(st, 3), "e": round(en, 3), "g": sec(ws[0]["s"]), "w": words, "gim": norm(ws[0]["w"]) == "gimme"})

# momentos "more" de cada coro (para multiplicar el muro)
mores = {}
for L in lines:
    if L["g"] in ("ch1", "ch2", "ch3", "ch4"):
        for w in L["w"]:
            if "more" in norm(w["t"]): mores.setdefault(L["g"], []).append(w["s"])
flash = [w["s"] for L in lines if norm(L["w"][0]["t"]) == "cameras" for w in L["w"]]
data = {"lines": lines, "beats": beats, "dur": DUR, "sec": SEC, "mores": mores, "flash": flash}

html = r"""<!doctype html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="assets/lib/gsap.min.js"></script>
<style>
@font-face{font-family:"Archivo";src:url(assets/fonts/archivo-black-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Syne";font-weight:800;src:url(assets/fonts/syne-latin-800-normal.woff2) format("woff2")}
@font-face{font-family:"Playfair";font-weight:900;font-style:italic;src:url(assets/fonts/playfair-display-latin-900-italic.woff2) format("woff2")}
@font-face{font-family:"Inter Tight";font-weight:700;src:url(assets/fonts/inter-tight-latin-700-normal.woff2) format("woff2")}
:root{--pink:#ff2d95;--chrome:linear-gradient(180deg,#ffffff 0%,#e6e6f2 38%,#8c8ca6 50%,#f4f4fb 64%,#b9b9cc 100%)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#060208}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#060208;color:#fff;font-family:"Syne",sans-serif}
.L{position:absolute;inset:0}
#glow1{position:absolute;left:-400px;top:-300px;width:1500px;height:1500px;border-radius:50%;background:radial-gradient(circle,rgba(255,45,149,.33) 0%,rgba(255,45,149,0) 62%)}
#glow2{position:absolute;left:100px;top:900px;width:1400px;height:1400px;border-radius:50%;background:radial-gradient(circle,rgba(120,60,255,.25) 0%,rgba(120,60,255,0) 62%)}
#wall{position:absolute;inset:0}
#wallin{position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:50% 50%}
.cell{position:absolute;width:180px;height:80px;text-align:center;font:400 54px/80px "Archivo";letter-spacing:-.01em;background:var(--chrome);-webkit-background-clip:text;background-clip:text;color:transparent;opacity:0}
.cell.p{background:linear-gradient(180deg,#ffd1ea,#ff2d95 55%,#b3005e);-webkit-background-clip:text;background-clip:text}
#gw{position:absolute;inset:0;opacity:0}
.grow{position:absolute;left:0;white-space:nowrap;font:400 120px/1 "Archivo";color:transparent;-webkit-text-stroke:3px rgba(255,45,149,.75)}
#pinkfx{position:absolute;inset:0;background:var(--pink);mix-blend-mode:screen;opacity:0}
#flash{position:absolute;inset:0;background:#fff;opacity:0}
#band{position:absolute;left:-100px;right:-100px;top:640px;height:640px;background:radial-gradient(ellipse at 50% 50%,rgba(6,2,8,.94) 0%,rgba(6,2,8,.85) 45%,rgba(6,2,8,0) 72%);opacity:0}
.burst{position:absolute;width:260px;height:260px;margin:-130px 0 0 -130px;background:radial-gradient(circle,#fff 0 8%,rgba(255,255,255,.6) 14%,rgba(255,255,255,0) 40%);opacity:0}
.burst:before,.burst:after{content:"";position:absolute;left:0;top:125px;width:260px;height:10px;background:linear-gradient(90deg,transparent,#fff,transparent)}
.burst:after{transform:rotate(90deg)}
.spot{position:absolute;top:-200px;width:520px;height:2400px;background:linear-gradient(180deg,rgba(255,240,200,.35),rgba(255,240,200,0) 85%);clip-path:polygon(45% 0,55% 0,100% 100%,0 100%);transform-origin:50% 0;opacity:0}
/* letra */
#lyr{position:absolute;inset:0}
.line{position:absolute;left:60px;right:60px;top:960px;text-align:center;line-height:1.02;opacity:0}
.word{display:inline-block;margin:0 .11em;opacity:.16;font:800 1em "Syne";text-transform:uppercase;color:#fff;text-shadow:0 6px 30px rgba(0,0,0,.6)}
.word.bk{font:900 italic .62em "Playfair";text-transform:none;color:var(--pink);opacity:.25}
.word.m{font:400 1.35em "Archivo";background:linear-gradient(180deg,#ffd1ea,#ff2d95 55%,#b3005e);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 0 22px rgba(255,45,149,.7));padding:0 .04em}
.word.n{font:900 italic 1.1em "Playfair";text-transform:none;background:var(--chrome);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 4px 16px rgba(255,255,255,.35))}
.word.k{color:#ff8fca}
.gim .word{font-family:"Archivo";font-weight:400}
.cred .word{font-size:.9em}
#endc{position:absolute;left:0;right:0;top:760px;text-align:center;opacity:0}
#endc .a{font:400 260px/1 "Archivo";background:linear-gradient(180deg,#ffd1ea,#ff2d95 55%,#b3005e);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 40px rgba(255,45,149,.7))}
#endc .b{margin-top:20px;font:700 34px "Inter Tight";letter-spacing:.5em;padding-left:.5em;color:#fff}
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1080" data-height="1920">
 <div id="all" class="clip" data-start="0" data-duration="__DUR__" data-track-index="0" data-layout-allow-overflow data-layout-allow-overlap data-layout-allow-occlusion style="position:absolute;inset:0">
  <div id="glow1"></div><div id="glow2"></div>
  <div id="spots" class="L"></div>
  <div id="gw"></div>
  <div id="wall"><div id="wallin"></div></div>
  <div id="pinkfx"></div>
  <div id="bursts" class="L"></div>
  <div id="band"></div>
  <div id="lyr"></div>
  <div id="endc"><div class="a">MORE</div><div class="b">GIMME MORE</div></div>
  <div id="flash"></div>
 </div>
 <audio id="song" class="clip" src="assets/audio/song.mp3" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const DATA = __DATA__;
const tl = gsap.timeline({ paused: true });
const $ = (s, r) => (r || document).querySelector(s);
const mk = (tag, cls, html, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
const S = {}; DATA.sec.forEach(([n, a, b]) => (S[n] = [a, b]));
const IR = { immediateRender: false };
// ---- fondo vivo ----
tl.to("#glow1", { x: 300, y: 400, duration: 13, ease: "sine.inOut", yoyo: true, repeat: 20 }, 0);
tl.to("#glow2", { x: -300, y: -500, duration: 17, ease: "sine.inOut", yoyo: true, repeat: 15 }, 0);
// ---- el muro de MORE: 6 x 24 = 144 celdas, se llenan del centro hacia afuera ----
const cells = []; const W = $("#wallin");
for (let r = 0; r < 24; r++) for (let c = 0; c < 6; c++) { const e = mk("div", "cell" + ((r * 7 + c * 3) % 5 === 0 ? " p" : ""), "MORE", W); e.style.left = c * 180 + "px"; e.style.top = r * 80 + "px"; cells.push({ e, d: Math.hypot((c + 0.5) * 180 - 540, (r + 0.5) * 80 - 960 + ((r * 13 + c * 29) % 7) * 6) }); }
cells.sort((a, b) => a.d - b.d); const CE = cells.map((c) => c.e);
const reveal = (from, to, t) => { const sub = CE.slice(from, to); if (!sub.length) return; tl.fromTo(sub, { opacity: 0, scale: 1.8, y: 0 }, { opacity: 1, scale: 1, y: 0, duration: 0.22, ease: "back.out(2.5)", stagger: Math.min(0.006, 0.25 / sub.length), ...IR }, t); };
const clear = (t) => tl.to(CE, { opacity: 0, y: 260, duration: 0.5, ease: "power2.in", stagger: { each: 0.004, from: "end" } }, t);
const showBand = (a, b) => { tl.fromTo("#band", { opacity: 0 }, { opacity: 1, duration: 0.3, ...IR }, a); tl.fromTo("#band", { opacity: 1 }, { opacity: 0, duration: 0.4, ...IR }, b); };
["ch1", "ch2", "ch4"].forEach((k) => {
  const ms = DATA.mores[k] || []; let shown = 0;
  ms.forEach((t, i) => { const n = Math.min(Math.pow(2, i), 144); if (n > shown) { reveal(shown, n, t); shown = n; } else { tl.fromTo("#pinkfx", { opacity: 0.45 }, { opacity: 0, duration: 0.35, ...IR }, t); tl.fromTo("#wallin", { scale: 1.06 }, { scale: 1, duration: 0.35, ease: "power2.out", ...IR }, t); } });
  showBand(S[k][0], S[k][1] - 0.3); clear(S[k][1] - 0.55);
});
// puente: "I just can't control myself" -> caos; "I'll give them more" -> explota todo
const [ba, bb] = S.br;
reveal(0, 1, 132.95); reveal(1, 144, 136.6);
tl.fromTo("#flash", { opacity: 1 }, { opacity: 0, duration: 0.5, ...IR }, 136.6);
tl.fromTo("#wallin", { scale: 1.5, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.6, ease: "expo.out", ...IR }, 136.6);
showBand(132.8, 157.0);
// coro 3: el muro ya está lleno; cada "more" lo hace temblar y lo pinta de rosa
(DATA.mores.ch3 || []).forEach((t) => { tl.fromTo("#pinkfx", { opacity: 0.5 }, { opacity: 0, duration: 0.35, ...IR }, t); tl.fromTo("#wallin", { scale: 1.07 }, { scale: 1, duration: 0.35, ease: "power2.out", ...IR }, t); });
tl.to("#wallin", { rotation: 4, duration: 8, ease: "sine.inOut", yoyo: true, repeat: 1 }, 139.6);
clear(157.0);
// "control myself": las letras del texto tiemblan (ver letra) + sacudida
tl.fromTo("#lyr", { x: 0 }, { keyframes: { x: [0, -16, 14, -10, 12, -6, 0] }, duration: 0.6, ease: "none", repeat: 3, ...IR }, 125.8);
// post: More more m-m-more -> el muro tartamudea
[157.6, 158.4, 159.0, 159.4].forEach((t, i) => { reveal(0, [6, 12, 18, 36][i], t); });
tl.to(CE.slice(0, 36), { opacity: 0, duration: 0.3, stagger: 0.004 }, 160.9);
showBand(157.4, 173.4);
// GIMME sin "more": filas de GIMME en marquesina
const gw = $("#gw");
for (let r = 0; r < 12; r++) { const row = mk("div", "grow", "GIMME GIMME GIMME GIMME GIMME GIMME", gw); row.style.top = (r * 165 - 40) + "px"; const dir = r % 2 ? 1 : -1; tl.fromTo(row, { x: dir > 0 ? -1400 : 0 }, { x: dir > 0 ? 0 : -1400, duration: S.gim[1] - S.gim[0] + 1, ease: "none", ...IR }, S.gim[0] - 0.5); }
tl.fromTo("#gw", { opacity: 0 }, { opacity: 1, duration: 0.3, ...IR }, S.gim[0]); tl.fromTo("#gw", { opacity: 1 }, { opacity: 0, duration: 0.3, ...IR }, S.gim[1] - 0.2);
showBand(S.gim[0], S.gim[1] - 0.2);
// creditos: reflectores
for (let i = 0; i < 2; i++) { const sp = mk("div", "spot", null, $("#spots")); sp.style.left = (i ? 600 : -40) + "px";
  tl.fromTo(sp, { opacity: 0 }, { opacity: 1, duration: 0.6, ...IR }, S.cred[0]); tl.fromTo(sp, { rotation: i ? 18 : -18 }, { rotation: i ? -14 : 14, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: 6, ...IR }, S.cred[0]); tl.to(sp, { opacity: 0, duration: 0.8 }, S.cred[1]); }
[211.43, 214.58, 218.84].forEach((t) => tl.fromTo("#flash", { opacity: 0.7 }, { opacity: 0, duration: 0.4, ...IR }, t));
// final: el muro se vuelve a llenar con el ritmo y cierra con un MORE gigante
const ob = DATA.beats.filter((b) => b > 229 && b < 244);
ob.forEach((b, i) => { if (i % 2) return; const n = Math.min(144, Math.round(Math.pow(1.5, i / 2 + 1))); const prev = Math.min(144, Math.round(Math.pow(1.5, i / 2))); if (n > prev) reveal(prev, n, b); });
reveal(Math.min(144, Math.round(Math.pow(1.5, ob.length / 2))), 144, 243.5);
clear(245.6);
tl.fromTo("#endc", { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)", ...IR }, 246.4);
tl.from("#endc .b", { opacity: 0, y: 30, duration: 0.6 }, 247.0);
// flashes de camaras
DATA.flash.forEach((t, i) => { tl.fromTo("#flash", { opacity: 0.85 }, { opacity: 0, duration: 0.3, ...IR }, t);
  const b = mk("div", "burst", null, $("#bursts")); b.style.left = (120 + ((i * 337) % 840)) + "px"; b.style.top = (300 + ((i * 523) % 1300)) + "px";
  tl.fromTo(b, { opacity: 1, scale: 0.3, rotation: 0 }, { opacity: 0, scale: 1.6, rotation: 45, duration: 0.5, ease: "power2.out", ...IR }, t); });
// intro: It's Britney, bitch
[0.0, 1.16, 2.12].forEach((t) => tl.fromTo("#flash", { opacity: 0.8 }, { opacity: 0, duration: 0.35, ...IR }, t));
// pulso con el ritmo
DATA.beats.forEach((b, i) => { if (i % 2) return; tl.fromTo("#glow1", { opacity: 1.0 }, { opacity: 0.6, duration: 0.5, ...IR }, b); });
// ---- letra ----
const lyr = $("#lyr");
DATA.lines.forEach((L, li) => {
  const d = mk("div", "line" + (L.gim ? " gim" : "") + (L.g === "cred" ? " cred" : ""), null, lyr);
  const len = L.w.map((w) => w.t).join(" ").length;
  let fs = len <= 12 ? 150 : len <= 20 ? 120 : len <= 30 ? 96 : len <= 42 ? 82 : 70;
  if (L.g === "intro" && li === 0) fs = 150;
  d.style.fontSize = fs + "px";
  const ws = L.w.map((w) => mk("span", "word" + (w.c ? " " + w.c : ""), w.t, d));
  gsap.set(d, { yPercent: -50 });
  tl.fromTo(d, { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.14, ease: "power3.out", ...IR }, L.s);
  L.w.forEach((w, j) => {
    const t = w.s - 0.03, isM = w.c.includes("m");
    if (isM) tl.fromTo(ws[j], { opacity: 0.16, scale: 2.2 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.6)", ...IR }, t);
    else if (L.g === "br" && li > 0) tl.fromTo(ws[j], { opacity: 0.16, rotation: ((j * 47) % 30) - 15, y: 40 }, { opacity: 1, rotation: ((j * 31) % 12) - 6, y: 0, duration: 0.2, ease: "back.out(3)", ...IR }, t);
    else tl.fromTo(ws[j], { opacity: 0.16, y: 30, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "back.out(2.4)", ...IR }, t);
  });
  tl.to(d, { opacity: 0, scale: 0.92, duration: 0.12, ease: "power2.in" }, L.e - 0.12);
});
window.__timelines["main"] = tl;
tl.seek(0);
</script></body></html>
"""
html = html.replace("__DUR__", str(DUR)).replace("__DATA__", json.dumps(data, ensure_ascii=False))
open(D + "/gimme-video/index.html", "w").write(html)
print("ok", len(lines), {k: len(v) for k, v in mores.items()}, len(flash))
