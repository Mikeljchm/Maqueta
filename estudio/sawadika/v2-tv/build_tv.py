import json, re, sys
D = "/tmp/claude-0/-home-user-Maqueta/0ff2d02d-398a-55b3-9e3c-ad2c40e3421f/scratchpad"
TF = sys.argv[1] if len(sys.argv) > 1 else D + "/lyric/timing.json"
timing = json.load(open(TF))
braw = open(D + "/lyric/beats_raw.json").read()
beats = json.loads(braw[braw.find("{"):])["beatTimes"]
DUR = 186.9

# que "canal" usa cada renglon
def chan(i):
    if i <= 11 or 32 <= i <= 43 or 60 <= i <= 71: return "coro"
    if 12 <= i <= 15: return "news"
    if 16 <= i <= 19: return "score"
    if 20 <= i <= 29: return "count"
    if i in (30, 31, 58, 59): return "sky"
    if 44 <= i <= 57: return "bkk"
    return "surf"

KEY = {"sawadika", "geneva", "ferrari", "indigo", "lisa", "diva", "cold", "tv",
       "cage", "murder", "case", "away", "championship", "one", "salon", "gun",
       "take", "wave", "name", "discipline", "comprehend", "within",
       "sky", "ceiling", "mind", "feelings",
       "bangkok", "gang", "bank", "bag", "booked", "cook", "tuktuk", "rooftop", "clock", "fanatic", "anaphylactic", "overdramatic", "medic", "shock"}
lines = []
for i, r in enumerate(timing):
    ws = r["words"]
    st = ws[0]["s"] - 0.12
    nxt = timing[i + 1]["words"][0]["s"] - 0.14 if i + 1 < len(timing) else DUR
    en = min(max(ws[-1]["e"] + 1.3, st + 0.8), nxt)
    if i + 1 < len(timing) and nxt - ws[-1]["e"] < 0.7: en = nxt
    lines.append({"s": round(st, 3), "e": round(en, 3), "c": chan(i),
                  "w": [{"t": w["w"], "s": round(w["s"], 3), "k": re.sub(r"[^a-z]", "", w["w"].lower()) in KEY} for w in ws]})

def first(i): return timing[i]["words"][0]["s"]
# ventanas de canal: (id, inicio, fin, etiqueta OSD)
WIN = [("coro", 0.9, 28.2, "CH 07 · LISA TV"), ("stand", 28.2, 31.3, "CH -- · SIN SEÑAL"),
       ("news", 31.3, first(16) - 0.15, "CH 04 · NOTICIAS"), ("score", first(16) - 0.15, first(20) - 0.15, "CH 12 · DEPORTES"),
       ("count", first(20) - 0.15, first(30) - 0.15, "CH 21 · CONCURSO"), ("sky", first(30) - 0.15, 72.6, "CH ∞ · CIELO"),
       ("coro", 72.6, 99.95, "CH 07 · LISA TV"), ("bkk", 99.95, first(58) - 0.15, "CH 66 · BANGKOK"),
       ("sky", first(58) - 0.15, 138.4, "CH ∞ · CIELO"), ("stand", 138.4, 141.6, "CH -- · SIN SEÑAL"),
       ("coro", 141.6, 168.4, "CH 07 · LISA TV")]
surf = [(168.4, 172.2, 1), (172.2, 175.6, 2), (175.6, 179.0, 3), (179.0, 181.5, 4)]
for a, b, n in surf: WIN.append(("surf%d" % n, a, b, "CH 0%d" % n))
data = {"lines": lines, "beats": beats, "win": WIN, "dur": DUR,
        "count": [round(first(i) - 0.12, 3) for i in range(20, 30)],
        "score": [round(first(i) - 0.12, 3) for i in range(16, 20)],
        "flash": [w["s"] for i in range(12, 16) for w in timing[i]["words"] if re.sub(r"[^a-z]", "", w["w"].lower()) in ("murder", "case", "away", "cage")],
        "hello": [round(first(i), 3) for i in range(len(timing)) if timing[i]["line"].startswith("Hello") and i < 72]}

TAPE = "CASO SAWADIKA · NO PASAR · " * 8
TICK = "ÚLTIMA HORA: LA DIVA ESCAPÓ DE LA JAULA · TESTIGOS CONFIRMAN: SU MUÑECA ESTÁ HELADA · EL CASO SIGUE ABIERTO · " * 3
BKT = "THB ▲ +12% · BKK 33°C · TRÁFICO DE TUK-TUKS EN AUMENTO · LA DIVA LLEGÓ A LA CIUDAD · " * 3

html = r"""<!doctype html>
<html lang="es"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=1080, height=1920" />
<script src="assets/lib/gsap.min.js"></script>
<style>
@font-face{font-family:"Syne";font-weight:800;src:url(assets/fonts/syne-latin-800-normal.woff2) format("woff2")}
@font-face{font-family:"Playfair";font-weight:900;font-style:italic;src:url(assets/fonts/playfair-display-latin-900-italic.woff2) format("woff2")}
@font-face{font-family:"Playfair";font-weight:700;font-style:italic;src:url(assets/fonts/playfair-display-latin-700-italic.woff2) format("woff2")}
@font-face{font-family:"Oswald";font-weight:700;src:url(assets/fonts/oswald-latin-700-normal.woff2) format("woff2")}
@font-face{font-family:"Russo";src:url(assets/fonts/russo-one-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"Barlow";font-weight:800;font-style:italic;src:url(assets/fonts/barlow-condensed-latin-800-italic.woff2) format("woff2")}
@font-face{font-family:"Bebas";src:url(assets/fonts/bebas-neue-latin-400-normal.woff2) format("woff2")}
@font-face{font-family:"VCR";font-weight:700;src:url(assets/fonts/DejaVuSansMono-Bold.ttf) format("truetype")}
@font-face{font-family:"Inter Tight";font-weight:500;src:url(assets/fonts/inter-tight-latin-500-normal.woff2) format("woff2")}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#000}
#root{position:relative;width:1080px;height:1920px;overflow:hidden;background:#000;color:#fff;font-family:"Syne",sans-serif}
#screen{position:absolute;inset:0;overflow:hidden;background:#05030a;transform-origin:50% 50%}
.win{position:absolute;inset:0;opacity:0;overflow:hidden}
/* --- coro: estudio --- */
.w-coro{background:linear-gradient(165deg,#12072f 0%,#2b0b66 50%,#5a0d63 100%)}
.w-coro .beam{position:absolute;top:-300px;width:420px;height:2600px;background:linear-gradient(180deg,rgba(255,120,220,.35),rgba(255,120,220,0) 80%);transform-origin:50% 0}
.w-coro .bug{position:absolute;right:70px;top:1500px;font:900 italic 46px "Playfair";color:rgba(255,255,255,.75)}
.w-coro .bug b{font:800 22px "Syne";letter-spacing:.3em;font-style:normal;color:#ff4fa8;margin-left:8px}
/* --- carta de ajuste --- */
.w-stand{background:#111}
.w-stand .bars{position:absolute;left:0;right:0;top:0;height:1280px;display:flex}
.w-stand .bars i{flex:1}
.w-stand .low{position:absolute;left:0;right:0;top:1280px;height:640px;background:linear-gradient(90deg,#0b2e7a 0 16%,#fff 16% 32%,#3a0a6e 32% 48%,#111 48% 100%)}
.w-stand .box{position:absolute;left:190px;right:190px;top:820px;padding:30px 0;background:#000;border:6px solid #fff;text-align:center;font:700 54px "VCR";letter-spacing:.06em}
.w-stand .box small{display:block;font-size:30px;color:#bbb;margin-top:10px}
/* --- noticias --- */
.w-news{background:radial-gradient(ellipse at 50% 45%,#16244f 0%,#070b1c 75%)}
.w-news .grid{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(80,140,255,.08) 0 2px,transparent 2px 80px),repeating-linear-gradient(90deg,rgba(80,140,255,.08) 0 2px,transparent 2px 80px)}
.w-news .badge{position:absolute;left:70px;top:330px;background:#e3101b;font:700 44px "Oswald";letter-spacing:.06em;padding:6px 22px}
.w-news .badge2{position:absolute;left:70px;top:398px;background:#fff;color:#0a0f24;font:700 30px "Oswald";letter-spacing:.08em;padding:4px 22px}
.tape{position:absolute;left:-200px;width:1600px;height:86px;background:#ffd400;color:#111;font:700 46px/86px "Oswald";white-space:nowrap;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.5)}
.tape span{display:inline-block}
.ticker{position:absolute;left:0;right:0;top:1360px;height:76px;background:#e3101b;overflow:hidden;white-space:nowrap;font:700 40px/76px "Oswald"}
.ticker span{display:inline-block;padding-left:30px}
.ticker.b{background:#0e0e0e;color:#fff;border-top:4px solid #24e0ff}
/* --- deportes --- */
.w-score{background:radial-gradient(ellipse at 50% 120%,#1b6b2d 0%,#0a2a12 45%,#030b05 80%)}
.w-score .field{position:absolute;left:-100px;right:-100px;top:1250px;height:900px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.06) 0 120px,rgba(0,0,0,0) 120px 240px);transform:perspective(600px) rotateX(55deg);transform-origin:50% 0}
.board{position:absolute;left:140px;right:140px;top:300px;height:250px;background:#0b0b0b;border:6px solid #333;border-radius:18px;box-shadow:0 0 60px rgba(255,170,0,.25)}
.board .lb{position:absolute;top:22px;font:400 34px "Russo";color:#ffb000;letter-spacing:.1em}
.board .lb.l{left:40px}.board .lb.r{right:40px}
.board .sc{position:absolute;left:0;right:0;top:70px;text-align:center;font:400 140px/1 "Russo";color:#ff9d00;text-shadow:0 0 24px rgba(255,140,0,.8)}
.board .cap{position:absolute;left:0;right:0;bottom:-58px;text-align:center;font:700 32px "Oswald";letter-spacing:.3em;color:#fff}
/* --- concurso --- */
.w-count{background:#2a0a52}
.w-count .rays{position:absolute;left:-760px;top:-460px;width:2600px;height:2600px;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.07) 0 10deg,rgba(255,255,255,0) 10deg 20deg);border-radius:50%}
.w-count .ttl{position:absolute;left:0;right:0;top:300px;text-align:center;font:400 96px "Russo";color:#ffd23f;text-shadow:0 6px 0 #c2410c,0 0 30px rgba(255,210,63,.6)}
.w-count .panel{position:absolute;left:330px;width:420px;top:1290px;height:190px;border-radius:24px;background:#111;border:8px solid #ffd23f}
.w-count .panel .n{position:absolute;inset:0;text-align:center;font:400 140px/174px "Russo";color:#fff}
.bulbs{position:absolute;inset:-26px;border-radius:40px;background:radial-gradient(circle,#fff6c2 0 7px,transparent 8px) 0 0/40px 40px;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;padding:14px}
/* --- cielo --- */
.w-sky{background:linear-gradient(180deg,#040a2a 0%,#13246a 55%,#4b3b8f 85%,#a0629a 100%)}
.w-sky .stars i{position:absolute;width:4px;height:4px;border-radius:50%;background:#fff}
.w-sky .moon{position:absolute;right:150px;top:330px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fffbe8,#e9dfc0 60%,#bfb38f);box-shadow:0 0 120px rgba(255,248,220,.5)}
/* --- bangkok --- */
.w-bkk{background:radial-gradient(ellipse at 50% 30%,#2d0b4d 0%,#0b0418 70%)}
.w-bkk .neon{position:absolute;left:0;right:0;top:300px;text-align:center;font:800 italic 150px "Barlow";color:#ffe9fb;text-shadow:0 0 10px #ff2fb4,0 0 30px #ff2fb4,0 0 70px #ff2fb4}
.w-bkk .frame{position:absolute;left:60px;right:60px;top:600px;height:720px;border:6px solid #9ffcff;border-radius:30px;box-shadow:0 0 18px #22e6ff,inset 0 0 18px #22e6ff}
.w-bkk .city{position:absolute;left:0;right:0;bottom:0;height:420px;background:linear-gradient(0deg,#05010c 0 40%,transparent 40%),repeating-linear-gradient(90deg,#140a26 0 70px,#1d0f36 70px 110px,#0d0619 110px 190px);-webkit-mask:linear-gradient(0deg,#000 0 60%,transparent 60%) ;opacity:.9}
.w-bkk .lt{position:absolute;left:60px;top:1460px;background:#ff2fb4;font:800 italic 44px "Barlow";padding:4px 20px}
/* --- zapping final --- */
.w-surf1{background:linear-gradient(160deg,#ff2f8e,#6a0dad)} .w-surf2{background:linear-gradient(160deg,#00c2ff,#1b1464)}
.w-surf3{background:linear-gradient(160deg,#ffcc33,#c2410c)} .w-surf4{background:linear-gradient(160deg,#2b0b66,#5a0d63)}
/* --- letra --- */
#lyr{position:absolute;inset:0}
#wins{position:absolute;inset:0}
.line{position:absolute;left:80px;right:80px;top:960px;text-align:center;line-height:1.06;opacity:0}
.word{display:inline-block;margin:0 .13em;opacity:.16}
.c-coro .word,.c-surf .word{font:800 1em "Syne";text-transform:uppercase;text-shadow:-5px 0 rgba(255,0,90,.75),5px 0 rgba(0,225,255,.75)}
.c-coro .word.k,.c-surf .word.k{font:900 italic 1.08em "Playfair";text-transform:none;color:#ffd166;text-shadow:-4px 0 rgba(255,0,90,.6),4px 0 rgba(0,225,255,.6),0 0 30px rgba(255,190,80,.6)}
.c-news .word{font:700 1em "Oswald";text-transform:uppercase;letter-spacing:.01em}
.c-news .word.k{background:#ffd400;color:#000;padding:0 .12em}
.c-score .word{font:400 .92em "Russo";text-transform:uppercase;color:#fff}
.c-score .word.k{color:#ffb000;text-shadow:0 0 20px rgba(255,160,0,.9)}
.c-count .word{font:400 .95em "Russo";text-transform:uppercase}
.c-count .word.k{color:#ffd23f;text-shadow:0 5px 0 #c2410c}
.c-sky .word{font:700 italic 1em "Playfair";text-shadow:0 0 30px rgba(180,200,255,.6)}
.c-sky .word.k{color:#ffe7a8}
.c-bkk .word{font:800 italic 1.08em "Barlow";text-transform:uppercase;color:#f4fdff;text-shadow:0 0 8px #22e6ff,0 0 24px #22e6ff}
.c-bkk .word.k{color:#fff0fb;text-shadow:0 0 8px #ff2fb4,0 0 26px #ff2fb4,0 0 50px #ff2fb4}
/* --- efectos de tele --- */
#pulse{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(255,255,255,.35),rgba(255,255,255,0) 65%);opacity:0}
#flash{position:absolute;inset:0;background:#fff;opacity:0}
#noise{position:absolute;left:0;top:0;width:1620px;height:2880px;background:url(assets/img/noise.png) 0 0/540px 960px;opacity:.07;mix-blend-mode:screen}
#static{position:absolute;left:0;top:0;width:1620px;height:2880px;background:url(assets/img/noise.png) 0 0/270px 480px;opacity:0}
#scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 2px,rgba(0,0,0,0) 2px 5px)}
#roll{position:absolute;left:0;right:0;top:0;height:260px;background:linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,.06),rgba(255,255,255,0))}
#bezel{position:absolute;inset:0;border-radius:90px;box-shadow:0 0 0 120px #000,inset 0 0 160px rgba(0,0,0,.85),inset 0 0 30px rgba(0,0,0,.9)}
.osd{position:absolute;font:700 40px "VCR";color:#5dff7a;text-shadow:0 0 10px rgba(93,255,122,.8),3px 3px 0 rgba(0,0,0,.6)}
#osdch{left:90px;top:150px;opacity:0}
#live{right:90px;top:150px;color:#fff;text-shadow:3px 3px 0 rgba(0,0,0,.6)}
#live i{display:inline-block;width:26px;height:26px;border-radius:50%;background:#ff2238;margin-right:12px;vertical-align:-2px;box-shadow:0 0 14px #ff2238}
#play{left:90px;top:1560px;color:#fff;font-size:36px}
#tc{right:90px;top:1560px;color:#fff;font-size:36px}
#endc{position:absolute;inset:0;background:#000;text-align:center;opacity:0}
#endc .a{position:absolute;left:0;right:0;top:820px;font:800 60px "Syne";letter-spacing:.6em;padding-left:.6em}
#endc .b{position:absolute;left:0;right:0;top:900px;font:900 italic 180px "Playfair";color:#ffd166}
#endc .c{position:absolute;left:0;right:0;top:1130px;font:700 30px "VCR";color:#5dff7a;letter-spacing:.2em}
#dot{position:absolute;left:530px;top:950px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 0 40px #fff;opacity:0}
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="__DUR__" data-width="1080" data-height="1920">
 <div id="tv" class="clip" data-start="0" data-duration="__DUR__" data-track-index="0" data-layout-allow-overflow data-layout-allow-overlap data-layout-allow-occlusion style="position:absolute;inset:0">
  <div id="screen">
   <div id="wins"></div>
   <div id="lyr"></div>
   <div id="pulse"></div>
   <div id="noise"></div>
   <div id="static"></div>
   <div id="flash"></div>
   <div id="scan"></div>
   <div id="roll"></div>
   <div id="osdch" class="osd">CH 07</div>
   <div id="live" class="osd"><i></i>EN VIVO</div>
   <div id="play" class="osd">PLAY ▶</div>
   <div id="tc" class="osd">0:00:00</div>
   <div id="bezel"></div>
  </div>
  <div id="dot"></div>
  <div id="endc"><div class="a">LISA</div><div class="b">Sawadika</div><div class="c">FIN DE LA TRANSMISIÓN</div></div>
 </div>
 <audio id="song" class="clip" src="assets/audio/song.mp3" data-start="0" data-duration="__DUR__" data-track-index="1" data-volume="1"></audio>
</div>
<script>
const DATA = __DATA__;
const TAPE = __TAPE__, TICK = __TICK__, BKT = __BKT__;
const tl = gsap.timeline({ paused: true });
const $ = (s, r) => (r || document).querySelector(s);
const mk = (tag, cls, html, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; parent.appendChild(e); return e; };
let rnd = 9; const R = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
const wins = $("#wins");
const builders = {
  coro(w) { for (let i = 0; i < 3; i++) { const b = mk("div", "beam", null, w); b.style.left = (80 + i * 330) + "px"; tl.fromTo(b, { rotation: -25 + i * 8 }, { rotation: 20 - i * 6, duration: 4 + i, ease: "sine.inOut", yoyo: true, repeat: 50 }, 0); } mk("div", "bug", "LISA<b>TV</b>", w); },
  stand(w) { const bars = mk("div", "bars", null, w); ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"].forEach((c) => { mk("i", null, null, bars).style.background = c; }); mk("div", "low", null, w); mk("div", "box", "POR FAVOR ESPERE<small>PLEASE STAND BY</small>", w); },
  news(w, a, b) { mk("div", "grid", null, w); mk("div", "badge", "ÚLTIMA HORA", w); mk("div", "badge2", "EL CASO SAWADIKA", w);
    const t1 = mk("div", "tape", "<span>" + TAPE + "</span>", w); t1.style.top = "540px"; gsap.set(t1, { rotation: -7 });
    const t2 = mk("div", "tape", "<span>" + TAPE + "</span>", w); t2.style.top = "1240px"; gsap.set(t2, { rotation: 6 });
    tl.fromTo(t1.firstChild, { x: 0 }, { x: -900, duration: b - a, ease: "none" }, a); tl.fromTo(t2.firstChild, { x: -900 }, { x: 0, duration: b - a, ease: "none" }, a);
    const tk = mk("div", "ticker", "<span>" + TICK + "</span>", w); tl.fromTo(tk.firstChild, { x: 0 }, { x: -1600, duration: b - a, ease: "none" }, a); },
  score(w) { mk("div", "field", null, w); const bd = mk("div", "board", '<div class="lb l">LISA</div><div class="lb r">RIVALES</div><div class="sc">0 : 0</div><div class="cap">CAMPEONATO MUNDIAL</div>', w);
    DATA.score.forEach((t, i) => { tl.set($(".sc", bd), { textContent: i + " : 0" }, t); if (i) tl.fromTo($(".sc", bd), { scale: 1.35 }, { scale: 1, duration: 0.4, ease: "back.out(3)" }, t); }); },
  count(w, a, b) { const r = mk("div", "rays", null, w); tl.fromTo(r, { rotation: 0 }, { rotation: 60, duration: b - a, ease: "none" }, a); mk("div", "ttl", "¿HOW MANY?", w);
    const p = mk("div", "panel", '<div class="bulbs"></div><div class="n">00</div>', w);
    tl.to($(".bulbs", p), { opacity: 0.35, duration: 0.2, ease: "steps(1)", yoyo: true, repeat: Math.ceil((b - a) / 0.2) }, a);
    DATA.count.forEach((t, i) => { tl.set($(".n", p), { textContent: String(i + 1).padStart(2, "0") }, t); tl.fromTo($(".n", p), { scale: 1.4 }, { scale: 1, duration: 0.3, ease: "back.out(3)" }, t); }); },
  sky(w, a, b) { const st = mk("div", "stars", null, w); for (let i = 0; i < 90; i++) { const s = mk("i", null, null, st); s.style.left = R() * 1080 + "px"; s.style.top = R() * 1500 + "px"; s.style.opacity = (0.3 + R() * 0.7).toFixed(2); }
    mk("div", "moon", null, w); tl.fromTo(st, { y: 0 }, { y: 120, duration: b - a, ease: "none" }, a); },
  bkk(w, a, b) { mk("div", "city", null, w); const n = mk("div", "neon", "BANGKOK", w); mk("div", "frame", null, w); mk("div", "lt", "EN VIVO DESDE BANGKOK", w);
    const tk = mk("div", "ticker b", "<span>" + BKT + "</span>", w); tk.style.top = "1380px"; tl.fromTo(tk.firstChild, { x: 0 }, { x: -1600, duration: b - a, ease: "none" }, a);
    [0.3, 0.42, 0.5, 7.1, 7.2, 15.6, 15.7, 22.4].forEach((d) => tl.fromTo(n, { opacity: 0.25 }, { opacity: 1, duration: 0.06, ease: "steps(1)" }, a + d)); },
};
// ventanas (canales)
const switches = [];
DATA.win.forEach(([k, a, b, label], i) => {
  const base = k.startsWith("surf") ? "surf" : k;
  const w = mk("div", "win w-" + k, null, wins);
  if (builders[base]) builders[base](w, a, b);
  tl.fromTo(w, { opacity: 0 }, { opacity: 1, duration: 0.02, ease: "none", immediateRender: false }, a); tl.fromTo(w, { opacity: 1 }, { opacity: 0, duration: 0.02, ease: "none", immediateRender: false }, b - 0.02);
  switches.push([a, label]);
});
// cambio de canal: estatica + salto + OSD
switches.forEach(([t, label], i) => {
  const t0 = Math.max(0, t - 0.06);
  tl.fromTo("#static", { opacity: 0.95 }, { opacity: 0, duration: 0.24, ease: "steps(4)", immediateRender: false }, t0);
  tl.fromTo("#wins", { yPercent: 5 }, { yPercent: 0, duration: 0.2, ease: "steps(3)" }, t0);
  tl.set("#osdch", { textContent: label, opacity: 1 }, t0);
  tl.set("#osdch", { opacity: 0 }, t + 2.2);
});
DATA.hello.forEach((t) => tl.fromTo("#static", { opacity: 0.6 }, { opacity: 0, duration: 0.16, ease: "steps(3)", immediateRender: false }, t - 0.1));
DATA.flash.forEach((t) => tl.fromTo("#flash", { opacity: 0.85 }, { opacity: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, t));
// efectos continuos
tl.to("#noise", { x: -540, y: -960, duration: 0.5, ease: "steps(15)", repeat: Math.ceil(DATA.dur / 0.5) }, 0);
tl.to("#static", { x: -270, y: -480, duration: 0.3, ease: "steps(9)", repeat: Math.ceil(DATA.dur / 0.3) }, 0);
tl.fromTo("#roll", { y: -300 }, { y: 1950, duration: 6, ease: "none", repeat: Math.ceil(DATA.dur / 6) }, 0);
tl.to("#live i", { opacity: 0.15, duration: 0.6, ease: "steps(1)", yoyo: true, repeat: Math.ceil(DATA.dur / 0.6) }, 0);
for (let s = 0; s <= Math.floor(DATA.dur); s++) tl.set("#tc", { textContent: "0:" + String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0") }, s);
const chAt = (t) => { let k = "coro"; DATA.win.forEach(([kk, a]) => { if (t >= a) k = kk; }); return k; };
DATA.beats.forEach((b) => { const k = chAt(b); if (k === "sky" || k === "stand") return; tl.fromTo("#pulse", { opacity: k === "news" ? 0.25 : 0.4 }, { opacity: 0, duration: 0.32, ease: "power2.out", immediateRender: false }, b); });
// encendido
tl.fromTo("#dot", { opacity: 1, scaleX: 1, scaleY: 1 }, { opacity: 1, scaleX: 54, scaleY: 0.6, duration: 0.25, ease: "power3.in" }, 0);
tl.fromTo("#dot", { opacity: 1 }, { opacity: 0, duration: 0.02, immediateRender: false }, 0.25);
tl.fromTo("#screen", { scaleY: 0.004 }, { scaleY: 1, duration: 0.35, ease: "power3.out" }, 0.25);
tl.fromTo("#flash", { opacity: 1 }, { opacity: 0, duration: 0.45, ease: "power2.out" }, 0.25);
// letra
const lyr = $("#lyr");
DATA.lines.forEach((L, li) => {
  const d = mk("div", "line c-" + L.c, null, lyr);
  const len = L.w.map((w) => w.t).join(" ").length;
  d.style.fontSize = (len <= 15 ? 140 : len <= 22 ? 118 : len <= 30 ? 100 : len <= 40 ? 86 : 76) + "px";
  if (L.c === "news" || L.c === "bkk") d.style.top = "930px";
  L.w.forEach((w) => mk("span", "word" + (w.k ? " k" : ""), w.t, d));
  gsap.set(d, { yPercent: -50 });
  const ws = d.querySelectorAll(".word");
  if (L.c === "sky") tl.fromTo(d, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, L.s);
  else tl.fromTo(d, { x: -40, skewX: 30, opacity: 0 }, { x: 0, skewX: 0, opacity: 1, duration: 0.16, ease: "steps(4)" }, L.s);
  L.w.forEach((w, j) => {
    const t = w.s - 0.03;
    if (L.c === "sky") tl.fromTo(ws[j], { opacity: 0.16, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.45, ease: "power2.out" }, t);
    else if (L.c === "news") tl.fromTo(ws[j], { opacity: 0.16, x: 24 }, { opacity: 1, x: 0, duration: 0.12, ease: "power3.out" }, t);
    else if (L.c === "score") tl.fromTo(ws[j], { opacity: 0.16 }, { opacity: 1, duration: 0.12, ease: "steps(3)" }, t);
    else if (L.c === "bkk") tl.fromTo(ws[j], { opacity: 0.16 }, { opacity: 1, duration: 0.14, ease: "steps(3)" }, t);
    else tl.fromTo(ws[j], { opacity: 0.16, y: 40, scale: 0.6 }, { opacity: 1, y: 0, scale: 1, duration: 0.24, ease: "back.out(2.5)" }, t);
    if (w.k && L.c !== "sky") tl.fromTo(ws[j], { scale: 1.25 }, { scale: 1, duration: 0.4, ease: "back.out(3)" }, w.s + 0.18);
  });
  tl.to(d, { opacity: 0, x: 30, skewX: -20, duration: 0.14, ease: "steps(3)" }, L.e - 0.14);
  tl.fromTo(d, { opacity: 0 }, { opacity: 0, duration: 0.01, immediateRender: false }, L.e);
});
// apagado y cierre
tl.to("#flash", { opacity: 1, duration: 0.25, ease: "power2.in" }, 181.55);
tl.to("#screen", { scaleY: 0.004, duration: 0.28, ease: "power3.in" }, 181.55);
tl.to("#screen", { scaleX: 0, duration: 0.2, ease: "power3.in" }, 181.83);
tl.fromTo("#dot", { opacity: 1, scaleX: 1, scaleY: 1 }, { opacity: 0, scaleX: 0.2, scaleY: 0.2, duration: 0.45, ease: "power2.in", immediateRender: false }, 182.0);
tl.fromTo("#endc", { opacity: 0 }, { opacity: 1, duration: 0.02, immediateRender: false }, 182.4);
tl.from("#endc .a", { opacity: 0, y: 20, duration: 0.8, ease: "power3.out" }, 182.5);
tl.from("#endc .b", { opacity: 0, scale: 0.8, duration: 0.9, ease: "back.out(1.8)" }, 182.7);
tl.from("#endc .c", { opacity: 0, duration: 0.6, ease: "steps(6)" }, 183.4);
tl.to("#endc", { opacity: 0, duration: 0.9 }, 185.8);
window.__timelines["main"] = tl;
tl.seek(0);
</script></body></html>
"""
for k, v in {"__DUR__": str(DUR), "__DATA__": json.dumps(data, ensure_ascii=False), "__TAPE__": json.dumps(TAPE, ensure_ascii=False),
             "__TICK__": json.dumps(TICK, ensure_ascii=False), "__BKT__": json.dumps(BKT, ensure_ascii=False)}.items():
    html = html.replace(k, v)
open(D + "/sawadika-tv/index.html", "w").write(html)
print("ok", len(lines))
