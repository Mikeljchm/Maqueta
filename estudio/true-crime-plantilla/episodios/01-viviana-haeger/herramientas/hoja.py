import json, re, sys, unicodedata, difflib, html
sys.path.insert(0, sys.argv[1]); from planos_data import P
H, E = sys.argv[2], sys.argv[3]
def norm(w): w=unicodedata.normalize('NFD',w.lower()); w=''.join(c for c in w if unicodedata.category(c)!='Mn'); return re.sub(r'[^a-z0-9ñ]','',w)
guion=open(H+'/guion.txt').read().split('\n',1)[1]
gw=[norm(w) for w in guion.split()]; gw=[w for w in gw if w]
segs=json.load(open(H+'/whisper.json'))
ww=[(norm(w['w']),w['s']) for s in segs for w in s['words']]; ww=[x for x in ww if x[0]]
sm=difflib.SequenceMatcher(None,gw,[x[0] for x in ww],autojunk=False)
m={}
for a,b,n in sm.get_matching_blocks():
    for k in range(n): m[a+k]=ww[b+k][1]
LAST=[0]
def find(anchor):
    aw=[norm(w) for w in anchor.split()]
    for i in range(LAST[0],len(gw)):
        if gw[i:i+len(aw)]==aw:
            LAST[0]=i+1
            for j in range(i,i+40):
                if j in m: return m[j], j-i
    raise SystemExit('no anclaje: '+anchor)
dur=segs[-1]['end']; out=[]; cap=None
for i,(a,c,t,v,s) in enumerate(P):
    ts,off=find(a); cap=c or cap
    out.append(dict(id=i+1,capitulo=cap,inicio=round(ts,2),anclaje=a,bloque=t,visual=v,sonido=s))
for i,o in enumerate(out): o['fin']=out[i+1]['inicio'] if i+1<len(out) else round(dur,2)
bad=[o['id'] for o in out if o['fin']<=o['inicio']]
f=lambda x:f"{int(x//60):02d}:{x%60:04.1f}"
json.dump(dict(episodio="01-viviana-haeger",audio="audio.mp3 (ElevenReader 1.0, 34:02)",intro_cerradura_antes_del_bloque=5,planos=out),open(E+'/planos.json','w'),ensure_ascii=False,indent=1)
md=["# Episodio 01: Viviana Haeger. Escaleta completa","","Basada en `guion.txt` y en el audio (`whisper.json`). **El texto y el audio mandan** sobre cualquier nota anterior. La intro Cerradura entra antes del bloque 5, solo con música. Los tiempos son del audio de voz, sin contar la intro.",""]
c0=None
for o in out:
    if o['capitulo']!=c0: c0=o['capitulo']; md+=["",f"## {c0}","","| # | Tiempo | Bloque | Visual | Sonido |","|---|---|---|---|---|"]
    md.append(f"| {o['id']} | {f(o['inicio'])}–{f(o['fin'])} | {o['bloque']} | {o['visual']} | {o['sonido']} |")
md+=["","## Reglas de imagen","- Nada de fotos de las hijas, del cuerpo ni de personas privadas (solo íconos o siluetas). Fotos de prensa con crédito → `fuentes.csv`.","- La cara de Pérez no aparece antes del bloque 58 (revelación)."]
open(E+'/escaleta.md','w').write('\n'.join(md)+'\n')
rows=[];c0=None
for o in out:
    if o['capitulo']!=c0: c0=o['capitulo']; rows.append(f'<tr class="cap"><td colspan="5">{html.escape(c0)}</td></tr>')
    rows.append(f"<tr><td>{o['id']}</td><td class=t>{f(o['inicio'])}</td><td><b>{html.escape(o['bloque'])}</b><div class=a>«{html.escape(o['anclaje'])}…»</div></td><td>{html.escape(o['visual'])}</td><td>{html.escape(o['sonido'])}</td></tr>")
page=f"""<!doctype html><html lang=es><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Hoja de planos Haeger</title><style>
:root{{--bg:#f4ecdf;--fg:#2a1416;--vino:#6e1423;--car:#b3132b;--mut:#7a6a60;--line:#d8c9b5}}
@media (prefers-color-scheme:dark){{:root{{--bg:#1a0d0f;--fg:#f4ecdf;--vino:#e8a0a8;--car:#ff4d5e;--mut:#b5a598;--line:#3a2226}}}}
body{{background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif;margin:0;padding:16px}}h1{{font-family:Georgia,serif;color:var(--vino);margin:.2em 0}}
p{{color:var(--mut);max-width:70ch}}.w{{overflow-x:auto}}table{{border-collapse:collapse;width:100%;min-width:640px}}td{{border-bottom:1px solid var(--line);padding:8px 6px;vertical-align:top}}
tr.cap td{{background:var(--vino);color:var(--bg);font-weight:700;letter-spacing:.04em}}.t{{font-family:ui-monospace,monospace;white-space:nowrap;color:var(--car)}}.a{{color:var(--mut);font-size:13px;font-style:italic}}
</style></head><body><h1>Hoja de planos: Viviana Haeger</h1><p>{len(out)} bloques · 34:02 de voz + intro Cerradura antes del bloque 5. Tiempos del audio. Revisa el visual de cada bloque y dime qué cambio.</p>
<div class=w><table><tr><th>#</th><th>Tiempo</th><th>Bloque</th><th>Visual</th><th>Sonido</th></tr>{''.join(rows)}</table></div></body></html>"""
open(E+'/hoja-planos.html','w').write(page)
print(len(out),'bloques; mal ordenados:',bad, 'dur',f(dur))
