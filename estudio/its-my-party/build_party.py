import json, re, random
D = "/tmp/claude-0/-home-user-Maqueta/0ff2d02d-398a-55b3-9e3c-ad2c40e3421f/scratchpad"
timing = json.load(open(D + "/party/timing.json"))
braw = open(D + "/party/beats_raw.json").read()
beats = json.loads(braw[braw.find("{"):])["beatTimes"]
DUR = 134.79

# etapas del arco emocional (inicio de cada una)
ST = [0, 14.5, 29.6, 43.5, 59.3, 72.3, 88.3, 103.4, 116.8]
# 0 fiesta perfecta, 1 primeras grietas, 2 lilas, 3 atardecer, 4 azul, 5 solo (se apaga la fiesta), 6 la sorpresa, 7 tormenta, 8 tormenta final
def stage(t):
    k = 0
    for i, s in enumerate(ST):
        if t >= s: k = i
    return k

KEYP = {"party": "p", "cry": "c", "johnny": "n", "johnnys": "n", "judy": "n", "judys": "n", "ring": "r", "king": "r", "queen": "r",
        "smile": "p", "surprise": "p", "birthday": "p", "mine": "c", "gone": "c", "records": "p", "dancing": "p"}
lines = []
for i, r in enumerate(timing):
    ws = r["words"]
    st = ws[0]["s"] - 0.15
    nxt = timing[i + 1]["words"][0]["s"] - 0.15 if i + 1 < len(timing) else DUR
    en = min(max(ws[-1]["e"] + 1.2, st + 0.8), nxt)
    if i + 1 < len(timing) and nxt - ws[-1]["e"] < 0.8: en = nxt
    words = []
    for w in ws:
        k = KEYP.get(re.sub(r"[^a-z]", "", w["w"].lower()), "")
        words.append({"t": w["w"], "s": round(w["s"], 3), "k": k})
    lines.append({"s": round(st, 3), "e": round(en, 3), "g": stage(ws[0]["s"]), "w": words})

def wt(li, wi): return timing[li]["words"][wi]["s"]
EV = {
    "pop": wt(3, -1),            # "gone": revienta un globo
    "walk": wt(5, 0),            # "Why was he holding her hand": se van tomados de la mano
    "frown": wt(13, -1),         # "smile": el globo carita se pone triste
    "door": wt(17, 0) - 0.4,     # entran por la puerta
    "crown": wt(18, 3),          # "queen"
    "surprise": wt(19, 3),       # "birthday surprise"
    "ring": wt(20, 3),           # "ring"
}
random.seed(5)
conf = [{"x": random.randint(0, 1080), "d": round(random.uniform(5, 9), 2), "o": round(random.uniform(0, 9), 2), "r": random.randint(0, 360),
         "c": random.choice(["#ff6fa8", "#ffd23f", "#5fd6c4", "#9b7bff", "#ff9f5a"]), "w": random.randint(14, 24)} for _ in range(46)]
tears = [{"x": random.randint(20, 1060), "d": round(random.uniform(1.2, 2.2), 2), "o": round(random.uniform(0, 2), 2), "s": round(random.uniform(0.6, 1.3), 2)} for _ in range(60)]
data = {"lines": lines, "beats": beats, "dur": DUR, "st": ST, "ev": EV, "conf": conf, "tears": tears}

html = r"""<!doctype html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="assets/lib/gsap.min.js"></script>
<style>
@font-face{font-family:"Pacifico";src:url(assets/fonts/pacifico-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Abril";src:url(assets/fonts/abril-fatface-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Marker";src:url(assets/fonts/permanent-marker-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Bebas";src:url(assets/fonts/bebas-neue-latin-400-normal.woff2) format("woff2")}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#ffd9e8}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#ffd9e8;font-family:"Abril",serif}
.L{position:absolute;inset:0}
.bg{position:absolute;inset:0;opacity:0}
#bg0{opacity:1;background:linear-gradient(180deg,#ffe3ef 0%,#ffd1e3 45%,#fff1c9 100%)}
#bg1{background:linear-gradient(180deg,#f7dcf2 0%,#e9cff3 50%,#ffe6d1 100%)}
#bg2{background:linear-gradient(180deg,#e4d3fb 0%,#cdbff2 55%,#f2c9e0 100%)}
#bg3{background:linear-gradient(180deg,#9f8fde 0%,#b591d1 55%,#f0a7b8 100%)}
#bg4{background:linear-gradient(180deg,#5d6cc7 0%,#7a72c4 55%,#c189b9 100%)}
#bg5{background:linear-gradient(180deg,#2c3a85 0%,#3f4a9a 55%,#6a5c9c 100%)}
#bg6{background:linear-gradient(180deg,#1d2766 0%,#2a3180 55%,#4a3f7c 100%)}
#bg7{background:linear-gradient(180deg,#0f1640 0%,#1a2160 60%,#2b2758 100%)}
.dots{position:absolute;inset:0;background:radial-gradient(circle,rgba(255,255,255,.55) 0 7px,transparent 8px) 0 0/90px 90px}
/* guirnalda */
#garland{position:absolute;left:0;right:0;top:170px;height:200px}
#garland svg{position:absolute;left:0;top:0}
.flag{position:absolute;top:0;width:78px;height:96px;clip-path:polygon(0 0,100% 0,50% 100%);display:flex;justify-content:center;padding-top:8px;font:400 44px "Bebas";color:#fff;transform-origin:50% 0}
/* globos */
.bal{position:absolute;width:150px;height:184px;border-radius:50% 50% 48% 48%;box-shadow:inset -18px -14px 0 rgba(0,0,0,.08),inset 14px 10px 0 rgba(255,255,255,.25);transform-origin:50% 100%}
.bal:after{content:"";position:absolute;left:66px;bottom:-14px;border:9px solid transparent;border-bottom:14px solid inherit}
.str{position:absolute;left:74px;top:184px;width:2px;height:300px;background:rgba(80,50,90,.35)}
.face{position:absolute;inset:0}
.face i{position:absolute;top:62px;width:16px;height:22px;border-radius:50%;background:#3a1442}
.face b{position:absolute;left:40px;top:96px;width:70px;height:36px;border:7px solid #3a1442;border-top:none;border-radius:0 0 70px 70px}
/* confeti y lagrimas */
#conf i{position:absolute;top:0;height:10px;border-radius:2px}
#tears i{position:absolute;top:0;width:22px;height:32px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:linear-gradient(180deg,rgba(220,240,255,.95),rgba(120,180,255,.75));clip-path:polygon(50% 0,100% 62%,90% 88%,50% 100%,10% 88%,0 62%)}
/* pastel */
#cake{position:absolute;left:340px;top:1420px;width:400px;height:330px}
#cake .plate{position:absolute;left:-30px;right:-30px;bottom:0;height:26px;border-radius:50%;background:#fff;box-shadow:0 8px 0 rgba(0,0,0,.08)}
#cake .t1{position:absolute;left:0;right:0;bottom:18px;height:130px;border-radius:24px 24px 14px 14px;background:#ff8fbb}
#cake .t2{position:absolute;left:50px;right:50px;bottom:140px;height:100px;border-radius:22px 22px 10px 10px;background:#ffc2d9}
#cake .icing{position:absolute;left:0;right:0;top:0;height:34px;background:radial-gradient(circle at 20px 0,#fff 22px,transparent 23px) 0 0/40px 40px;}
#cake .cdl{position:absolute;bottom:236px;width:22px;height:80px;border-radius:6px;background:repeating-linear-gradient(135deg,#fff 0 10px,#5fd6c4 10px 20px);transform-origin:50% 100%}
#cake .fl{position:absolute;left:-6px;top:-44px;width:34px;height:48px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 70%,#fff7c2 0 20%,#ffcf3f 45%,#ff7a1a 75%,transparent 76%);transform-origin:50% 100%}
#cake .smk{position:absolute;left:0;top:-90px;width:26px;height:26px;border-radius:50%;background:rgba(220,220,235,.7);opacity:0}
/* vinilo */
#vinyl{position:absolute;left:-40px;top:1380px;width:360px;height:360px;border-radius:50%;background:radial-gradient(circle,#ff6fa8 0 52px,#111 53px 58px,#1b1b1b 59px),repeating-radial-gradient(circle,#222 0 3px,#151515 3px 6px);box-shadow:0 20px 40px rgba(0,0,0,.35);opacity:0}
#vinyl:after{content:"";position:absolute;left:170px;top:170px;width:20px;height:20px;border-radius:50%;background:#eee}
#vinyl .lbl{position:absolute;left:0;right:0;top:150px;text-align:center;font:400 22px "Pacifico";color:#fff}
/* pareja (siluetas planas) */
.cp{position:absolute;width:300px;height:440px}
.fig{position:absolute;bottom:0;width:120px;height:420px}
.fig .hd{position:absolute;left:28px;top:0;width:64px;height:72px;border-radius:50%;background:#3a1442}
.fig .bd{position:absolute;left:14px;top:78px;width:92px;height:200px;border-radius:40px 40px 10px 10px;background:#3a1442}
.fig .lg{position:absolute;top:270px;width:20px;height:150px;border-radius:10px;background:#3a1442}
.fig.j .hair{position:absolute;left:30px;top:-16px;width:58px;height:34px;border-radius:30px 30px 6px 6px;background:#3a1442;transform:skewX(-20deg)}
.fig.g .bd{clip-path:polygon(25% 0,75% 0,100% 100%,0 100%);width:120px;left:0;height:230px}
.fig.g .pony{position:absolute;left:84px;top:10px;width:30px;height:70px;border-radius:20px;background:#3a1442;transform:rotate(30deg)}
.arm{position:absolute;left:96px;top:150px;width:110px;height:16px;border-radius:8px;background:#3a1442}
.crown{position:absolute;left:20px;top:-58px;width:80px;height:50px;background:#ffcf3f;clip-path:polygon(0 100%,0 20%,25% 60%,50% 0,75% 60%,100% 20%,100% 100%);opacity:0}
#door{position:absolute;left:340px;top:1180px;width:400px;height:560px;background:#ffeab0;box-shadow:0 0 120px rgba(255,220,140,.8);opacity:0}
#door .leaf{position:absolute;inset:0;background:#6b3b5a;transform-origin:0 50%;border:10px solid #4e2a42}
#ring{position:absolute;left:390px;top:470px;width:300px;height:300px;opacity:0}
#ring .band{position:absolute;left:45px;top:95px;width:210px;height:210px;border-radius:50%;border:26px solid #ffcf3f;box-shadow:0 0 40px rgba(255,210,90,.8),inset 0 0 20px rgba(160,100,0,.5)}
#ring .gem{position:absolute;left:110px;top:30px;width:80px;height:80px;background:linear-gradient(135deg,#ffffff,#b6e8ff 45%,#6fc6ff);clip-path:polygon(50% 0,100% 40%,50% 100%,0 40%);filter:drop-shadow(0 0 20px #fff)}
#ring .spark{position:absolute;left:140px;top:60px;width:20px;height:20px;background:#fff;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)}
#flash{position:absolute;inset:0;background:#fff;opacity:0}
#vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 55%,rgba(10,10,40,.45) 100%);opacity:0}
/* letra */
#lyr{position:absolute;inset:0}
.line{position:absolute;left:70px;right:70px;top:930px;text-align:center;line-height:1.08;opacity:0}
.word{display:inline-block;margin:0 .12em;opacity:.18;position:relative}
.g0 .word,.g1 .word,.g2 .word{color:#3a1442}
.word{color:#fff;text-shadow:0 6px 30px rgba(10,10,50,.35)}
.g0 .word,.g1 .word,.g2 .word{text-shadow:0 4px 0 rgba(255,255,255,.6)}
.word.p{font-family:"Pacifico";color:#ff3f8e;font-size:1.06em}
.word.n{font-family:"Pacifico";color:#7a3cff;font-size:1.04em}
.word.r{font-family:"Pacifico";color:#ffcf3f;text-shadow:0 0 24px rgba(255,200,80,.8)}
.word.c{font-family:"Marker";color:#3d8bff;font-size:1.08em}
.g3 .word.p,.g4 .word.p,.g5 .word.p,.g6 .word.p,.g7 .word.p,.g8 .word.p{color:#ff9cc6}
.g3 .word.n,.g4 .word.n,.g5 .word.n,.g6 .word.n,.g7 .word.n,.g8 .word.n{color:#d3b8ff}
.g3 .word.c,.g4 .word.c,.g5 .word.c,.g6 .word.c,.g7 .word.c,.g8 .word.c{color:#9fd0ff}
.drop{position:absolute;left:50%;top:80%;width:18px;height:26px;margin-left:-9px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:#7fbaff;opacity:0}
.drip{position:absolute;top:86%;width:6px;height:90px;border-radius:3px;background:linear-gradient(180deg,rgba(170,200,255,.75),rgba(170,200,255,0));transform-origin:50% 0;opacity:.9}
#title{position:absolute;left:0;right:0;top:820px;text-align:center}
#title .a{font:400 150px/1.1 "Pacifico";color:#ff3f8e;text-shadow:0 8px 0 #fff}
#title .b{font:400 46px "Bebas";letter-spacing:.4em;color:#3a1442;padding-left:.4em}
#endc{position:absolute;left:0;right:0;top:720px;text-align:center;opacity:0}
#endc .a{font:400 130px/1.15 "Pacifico";color:#ffd6ea;text-shadow:0 0 30px rgba(255,120,180,.6)}
#endc .b{margin-top:30px;font:400 40px "Bebas";letter-spacing:.5em;color:#cfd6ff;padding-left:.5em}
#solo{position:absolute;left:0;right:0;top:860px;text-align:center;font:400 120px "Pacifico";color:#ffd6ea;opacity:0}
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1080" data-height="1920">
 <div id="all" class="clip" data-start="0" data-duration="__DUR__" data-track-index="0" data-layout-allow-overflow data-layout-allow-overlap data-layout-allow-occlusion style="position:absolute;inset:0">
  <div id="bgs" class="L"><div id="bg0" class="bg"></div><div id="bg1" class="bg"></div><div id="bg2" class="bg"></div><div id="bg3" class="bg"></div><div id="bg4" class="bg"></div><div id="bg5" class="bg"></div><div id="bg6" class="bg"></div><div id="bg7" class="bg"></div><div class="dots" id="dots"></div></div>
  <div id="bals" class="L"></div>
  <div id="garland"></div>
  <div id="conf" class="L"></div>
  <div id="door"><div class="leaf"></div></div>
  <div id="couple" class="L"></div>
  <div id="cake"><div class="t1"><div class="icing"></div></div><div class="t2"><div class="icing"></div></div><div class="plate"></div></div>
  <div id="vinyl"><div class="lbl">my records</div></div>
  <div id="ring"><div class="band"></div><div class="gem"></div><div class="spark"></div></div>
  <div id="vig"></div>
  <div id="tears" class="L"></div>
  <div id="lyr"></div>
  <div id="title"><div class="a">It's my party</div><div class="b">LYRIC VIDEO</div></div>
  <div id="solo">· · ·</div>
  <div id="endc"><div class="a">It's my party</div><div class="b">AND I'LL CRY IF I WANT TO</div></div>
  <div id="flash"></div>
 </div>
 <audio id="song" class="clip" src="assets/audio/song.mp3" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const DATA = __DATA__;
const tl = gsap.timeline({ paused: true });
const $ = (s, r) => (r || document).querySelector(s);
const mk = (tag, cls, html, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
const EV = DATA.ev, ST = DATA.st, END = DATA.dur;
const show = (el, t, d) => tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: d || 0.5, ease: "power1.inOut", immediateRender: false }, t);
const hide = (el, t, d) => tl.fromTo(el, { opacity: 1 }, { opacity: 0, duration: d || 0.5, ease: "power1.inOut", immediateRender: false }, t);
// ---- fondos: el color va de fiesta rosa a tormenta azul ----
const bgAt = [0, 1, 2, 3, 4, 5, 6, 7, 7];
for (let i = 1; i < ST.length; i++) { if (bgAt[i] !== bgAt[i - 1]) { show("#bg" + bgAt[i], ST[i] - 0.6, 1.6); } }
tl.to("#dots", { opacity: 0, duration: 20, ease: "none" }, 43);
show("#vig", 59, 6);
// ---- guirnalda HAPPY BIRTHDAY ----
const G = $("#garland"); const txt = "HAPPY BIRTHDAY"; const cols = ["#ff6fa8", "#ffb43f", "#5fd6c4", "#9b7bff"];
G.innerHTML = '<svg width="1080" height="80"><path d="M0 10 Q540 70 1080 10" stroke="#7a4a6a" stroke-width="4" fill="none"/></svg>';
let fx = 0; const flags = [];
for (let i = 0; i < txt.length; i++) { if (txt[i] === " ") continue; const f = mk("div", "flag", txt[i], G); const x = 40 + i * 74; f.style.left = x + "px"; const y = 10 + 60 * (1 - Math.pow((x + 39 - 540) / 540, 2)) * 0.95 - 4; f.style.top = y + "px"; f.style.background = cols[fx++ % 4]; flags.push(f);
  tl.fromTo(f, { rotation: -5 }, { rotation: 5, duration: 1.4 + (i % 3) * 0.2, ease: "sine.inOut", yoyo: true, repeat: 40 }, 0); }
// en el solo las letras se caen una por una
flags.forEach((f, i) => tl.to(f, { y: 1900, rotation: (i % 2 ? 1 : -1) * (90 + i * 13), duration: 1.6, ease: "power2.in" }, 73 + i * 1.1));
// ---- globos ----
const BAL = [[60, 520, "#ff6fa8"], [820, 470, "#ffd23f"], [210, 700, "#5fd6c4"], [700, 760, "#9b7bff"], [420, 430, "#ff9f5a", 1], [880, 1060, "#ff6fa8"], [30, 1050, "#9b7bff"]];
const bals = BAL.map(([x, y, c, face], i) => { const b = mk("div", "bal", '<div class="str"></div>' + (face ? '<div class="face"><i style="left:44px"></i><i style="left:90px"></i><b></b></div>' : ""), $("#bals")); b.style.left = x + "px"; b.style.top = y + "px"; b.style.background = c;
  tl.fromTo(b, { y: 0 }, { y: -30, duration: 2 + i * 0.3, ease: "sine.inOut", yoyo: true, repeat: 60 }, 0); return b; });
// "gone": revienta el globo amarillo
tl.to(bals[1], { scale: 1.25, duration: 0.08 }, EV.pop - 0.08); tl.to(bals[1], { scale: 0, opacity: 0, duration: 0.06 }, EV.pop);
tl.fromTo("#flash", { opacity: 0.5 }, { opacity: 0, duration: 0.3, immediateRender: false }, EV.pop);
// "smile": la carita se pone triste
tl.to(bals[4].querySelector(".face b"), { rotation: 180, y: 18, duration: 0.5, ease: "back.out(2)" }, EV.frown);
// los globos se van desinflando y bajando
bals.forEach((b, i) => { if (i === 1) return; tl.to(b, { scale: 0.75, rotation: (i % 2 ? 8 : -8), duration: 25, ease: "none" }, 60 + i); tl.to(b, { scale: 0.45, y: 700 + i * 60, rotation: (i % 2 ? 25 : -25), duration: 20, ease: "power1.in" }, 88 + i * 2); });
// ---- confeti ----
DATA.conf.forEach((c) => { const e = mk("i", null, null, $("#conf")); e.style.left = c.x + "px"; e.style.width = c.w + "px"; e.style.background = c.c;
  const f = (c.o % c.d) / c.d; tl.fromTo(e, { y: -40 + f * 1980, rotation: c.r }, { y: 1940, rotation: c.r + 300, duration: c.d * (1 - f), ease: "none" }, 0);
  tl.fromTo(e, { y: -40, rotation: c.r }, { y: 1940, rotation: c.r + 720, duration: c.d, ease: "none", repeat: Math.ceil(END / c.d), immediateRender: false }, c.d * (1 - f)); });
tl.to("#conf", { opacity: 0.15, duration: 30, ease: "none" }, 30);
tl.to("#conf", { opacity: 0, duration: 3 }, 72);
// confeti irónico en "birthday surprise"
tl.fromTo("#conf", { opacity: 0 }, { opacity: 1, duration: 0.15, immediateRender: false }, EV.surprise); tl.to("#conf", { opacity: 0, duration: 2 }, EV.surprise + 1.5);
// ---- lagrimas: cada coro llueve más ----
const tearsAmt = [[29.6, 0.35], [43.3, 0], [59.3, 0.6], [72.0, 0.15], [88.3, 0], [103.4, 0.9], [116.8, 1]];
DATA.tears.forEach((t, i) => { const e = mk("i", null, null, $("#tears")); e.style.left = t.x + "px"; gsap.set(e, { scale: t.s });
  tl.fromTo(e, { y: -60 }, { y: 1980, duration: t.d, ease: "power1.in", repeat: Math.ceil(END / t.d) + 1 }, -0.0001 + (t.o % t.d) * 0 ); });
gsap.set("#tears", { opacity: 0 });
tearsAmt.forEach(([t, a]) => tl.to("#tears", { opacity: a, duration: 1.2, ease: "power1.inOut" }, t));
// ---- pastel y velas ----
const cake = $("#cake"); const cdl = [];
[110, 189, 268].forEach((x, i) => { const c = mk("div", "cdl", '<div class="fl"></div><div class="smk"></div>', cake); c.style.left = x + "px"; cdl.push(c);
  tl.fromTo(c.querySelector(".fl"), { scaleY: 1, rotation: -4 }, { scaleY: 0.85, rotation: 4, duration: 0.18 + i * 0.03, ease: "sine.inOut", yoyo: true, repeat: Math.ceil(END / 0.2) }, 0);
  tl.to(c, { scaleY: 0.55, duration: 70, ease: "none" }, 15); });
// en el solo se apagan las velas (con humito)
cdl.forEach((c, i) => { const t = 76 + i * 3.4; tl.to(c.querySelector(".fl"), { opacity: 0, scale: 0.2, duration: 0.25 }, t);
  tl.fromTo(c.querySelector(".smk"), { opacity: 0.8, y: 0, scale: 0.6 }, { opacity: 0, y: -160, scale: 2.4, duration: 2.2, ease: "power1.out", immediateRender: false }, t); });
tl.to(cake, { y: 120, duration: 4, ease: "power2.inOut" }, 82);
tl.to(cake, { y: 700, duration: 1.2, ease: "power2.in" }, 87.4);
tl.to(cake, { y: 120, duration: 1.2, ease: "power2.out" }, 103.4);
// el pastel se esconde mientras sale el vinilo
tl.to(cake, { x: 380, duration: 0.8, ease: "power2.inOut" }, 43.6); tl.to(cake, { x: 0, duration: 0.8, ease: "power2.inOut" }, 58.6);
show("#vinyl", 44.2, 0.6); tl.fromTo("#vinyl", { x: -200 }, { x: 330, duration: 0.8, ease: "power3.out", immediateRender: false }, 44.2);
tl.to("#vinyl", { rotation: 360 * 8, duration: 14.5, ease: "none" }, 44.2); tl.to("#vinyl", { x: -400, opacity: 0, duration: 0.8, ease: "power2.in" }, 58.4);
// ---- pareja ----
const mkCouple = () => { const c = mk("div", "cp", '<div class="fig j" style="left:0"><div class="hair"></div><div class="hd"></div><div class="bd"></div><div class="lg" style="left:30px"></div><div class="lg" style="left:70px"></div><div class="arm"></div><div class="crown"></div></div><div class="fig g" style="left:170px"><div class="pony"></div><div class="hd"></div><div class="bd"></div><div class="lg" style="left:36px"></div><div class="lg" style="left:66px"></div><div class="crown"></div></div>', $("#couple")); return c; };
const c1 = mkCouple(); c1.style.top = "1300px"; gsap.set(c1, { opacity: 0 });
show(c1, EV.walk - 0.3, 0.3); tl.fromTo(c1, { x: -340 }, { x: 1150, duration: 6.5, ease: "none", immediateRender: false }, EV.walk - 0.3);
tl.fromTo(c1, { y: 0 }, { y: -14, duration: 0.25, ease: "sine.inOut", yoyo: true, repeat: 25, immediateRender: false }, EV.walk - 0.3);
// puerta + entrada
show("#door", EV.door - 0.6, 0.6); tl.fromTo("#door .leaf", { rotationY: 0 }, { rotationY: -100, duration: 0.9, ease: "power2.inOut", transformPerspective: 1200 }, EV.door);
const c2 = mkCouple(); c2.style.left = "390px"; c2.style.top = "1300px"; gsap.set(c2, { opacity: 0 });
show(c2, EV.door + 0.5, 0.4); tl.fromTo(c2, { scale: 0.7, y: -60 }, { scale: 1, y: 0, duration: 2.2, ease: "power2.out", immediateRender: false }, EV.door + 0.5);
c2.querySelectorAll(".crown").forEach((cr, i) => { tl.fromTo(cr, { opacity: 0, y: -60 }, { opacity: 1, y: 0, duration: 0.5, ease: "bounce.out", immediateRender: false }, EV.crown + i * 0.15); });
hide("#door", 103.2, 1); hide(c2, 103.2, 1);
// anillo
show("#ring", EV.ring - 0.2, 0.3); tl.fromTo("#ring", { scale: 0.2, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.7, ease: "back.out(2)", immediateRender: false }, EV.ring - 0.2);
tl.fromTo("#ring .spark", { scale: 0, rotation: 0 }, { scale: 3, rotation: 90, duration: 0.5, ease: "power2.out", yoyo: true, repeat: 3 }, EV.ring + 0.3);
hide("#ring", 103.0, 0.6);
// ---- titulo, solo y cierre ----
tl.from("#title .a", { scale: 0.6, opacity: 0, duration: 0.5, ease: "back.out(2)" }, 0);
tl.to("#title", { opacity: 0, y: -60, duration: 0.3 }, 0.45);
show("#solo", 72.6, 1); tl.fromTo("#solo", { y: 0 }, { y: 40, duration: 15, ease: "none", immediateRender: false }, 72.6); hide("#solo", 87.5, 0.8);
show("#endc", 130.6, 1.2); tl.from("#endc .b", { opacity: 0, y: 30, duration: 0.8 }, 131.4);
// pulso suave con el ritmo
DATA.beats.forEach((b, i) => { if (i % 2 || (b > 72 && b < 88)) return; tl.fromTo("#bals", { scale: 1.015 }, { scale: 1, duration: 0.4, ease: "power2.out", immediateRender: false }, b); });
// ---- letra ----
const lyr = $("#lyr");
DATA.lines.forEach((L, li) => {
  const d = mk("div", "line g" + L.g, null, lyr);
  const len = L.w.map((w) => w.t).join(" ").length;
  d.style.fontSize = (len <= 18 ? 118 : len <= 26 ? 100 : len <= 34 ? 88 : 78) + "px";
  const ws = L.w.map((w) => mk("span", "word" + (w.k ? " " + w.k : ""), w.t, d));
  gsap.set(d, { yPercent: -50 });
  const sad = L.g >= 4;
  tl.fromTo(d, { opacity: 0, y: sad ? -30 : 40, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, L.s);
  L.w.forEach((w, j) => {
    const t = w.s - 0.04;
    if (sad) tl.fromTo(ws[j], { opacity: 0.18, y: -18 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, t);
    else tl.fromTo(ws[j], { opacity: 0.18, y: 26, scale: 0.7 }, { opacity: 1, y: 0, scale: 1, duration: 0.26, ease: "back.out(3)", immediateRender: false }, t);
    if (w.k === "c") { const dr = mk("i", "drop", null, ws[j]); tl.fromTo(dr, { opacity: 0.95, y: 0 }, { opacity: 0, y: 220, duration: 0.9, ease: "power2.in", immediateRender: false }, w.s + 0.15); }
    if (w.k === "r") tl.fromTo(ws[j], { scale: 1.4 }, { scale: 1, duration: 0.5, ease: "elastic.out(1,0.5)", immediateRender: false }, w.s + 0.2);
  });
  if (L.g >= 7) { for (let k = 0; k < 5; k++) { const dp = mk("i", "drip", null, d); dp.style.left = (12 + k * 19 + ((li * 7 + k * 13) % 9)) + "%"; tl.fromTo(dp, { scaleY: 0 }, { scaleY: 1, duration: 1.6, ease: "power1.in", immediateRender: false }, L.s + 0.4 + k * 0.25); } }
  tl.to(d, { opacity: 0, y: sad ? 60 : -50, duration: 0.25, ease: "power2.in" }, L.e - 0.25);
});
window.__timelines["main"] = tl;
tl.seek(0);
</script></body></html>
"""
html = html.replace("__DUR__", str(DUR)).replace("__DATA__", json.dumps(data, ensure_ascii=False))
open(D + "/party-video/index.html", "w").write(html)
print("ok", len(lines), EV)
