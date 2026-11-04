import json, sys, html, os, subprocess
sys.path.insert(0, sys.argv[1]); from planos_data import R, FOTOS
S, E = sys.argv[1], sys.argv[2]
px = json.load(open(S+'/pixabay.json')) if os.path.exists(S+'/pixabay.json') else {}
os.makedirs(E+'/hoja', exist_ok=True)
for f in os.listdir(S+'/thumbs'):
    subprocess.run(['ffmpeg','-v','error','-y','-i',S+'/thumbs/'+f,'-vf','scale=480:-1','-q:v','5',E+'/hoja/'+f.replace('.png','.jpg')],check=True)
P = json.load(open(E+'/planos.json'))['planos']
fm = lambda x: f"{int(x//60):02d}:{int(x%60):02d}"
def tile(r):
    k, v = r.split(':',1)
    if k=='m':
        if v=='mapa': return '<div class="ph map">MAPA OpenStreetMap<br><small>Chile → Puerto Varas → Parque Stocker</small></div>'
        return f'<img src="hoja/{v}.jpg" loading=lazy alt="{v}"><span class=lb>{v}</span>'
    if k=='n': return '<div class="ph neg">NEGRO · SILENCIO</div>'
    if k=='f': return f'<div class="ph foto">FOTO REAL<br><b>{v}</b><br><small>{html.escape(FOTOS[v])}</small></div>'
    c = px.get(v)
    if c: return f'<a href="{c["page"]}" target=_blank><img src="{c["thumb"]}" loading=lazy alt="clip"></a><span class=lb>Pixabay {c["id"]}</span>'
    return f'<div class="ph px">CLIP PIXABAY<br><small>«{html.escape(v)}»</small></div>'
out=[]; cap=None
for o in P:
    if o['capitulo']!=cap: cap=o['capitulo']; out.append(f'<h2>{html.escape(cap)}</h2>')
    tiles=''.join(f'<div class=t>{tile(r)}</div>' for r in R[o['id']].split('|'))
    out.append(f'<section><div class=hd><span class=n>{o["id"]}</span><span class=tm>{fm(o["inicio"])}</span><b>{html.escape(o["bloque"])}</b></div><div class=st>{tiles}</div><p>{html.escape(o["visual"])}</p><p class=q>«{html.escape(o["anclaje"])}…»</p></section>')
fl=''.join(f'<li><b>{k}</b>: {html.escape(v)}</li>' for k,v in FOTOS.items())
page=f"""<!doctype html><html lang=es><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Hoja de planos Haeger</title><style>
:root{{--bg:#140a0c;--fg:#f4ecdf;--car:#ff4d5e;--mut:#b5a598;--card:#22121a;--line:#3a2226}}
body{{background:var(--bg);color:var(--fg);font:15px/1.4 system-ui,sans-serif;margin:0;padding:16px;max-width:1100px;margin:auto}}
h1{{font-family:Georgia,serif;margin:.2em 0}}h2{{font-family:Georgia,serif;color:var(--car);border-bottom:1px solid var(--line);padding-bottom:4px;margin-top:32px}}
section{{background:var(--card);border-radius:10px;padding:10px;margin:10px 0}}.hd{{display:flex;gap:10px;align-items:baseline}}.n{{color:var(--mut)}}.tm{{font-family:ui-monospace,monospace;color:var(--car)}}
.st{{display:flex;gap:8px;overflow-x:auto;margin:8px 0}}.t{{flex:0 0 260px;position:relative}}.t img,.ph{{width:260px;aspect-ratio:16/9;object-fit:cover;border-radius:6px;display:block}}
.ph{{display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;font-size:13px;box-sizing:border-box;padding:8px}}
.foto{{background:#fff;color:#222;border:3px dashed var(--car)}}.px{{background:#1d3a2a;color:#cfe}}.map{{background:#203040;color:#cde}}.neg{{background:#000;color:#666;border:1px solid #333}}
.lb{{position:absolute;left:6px;bottom:6px;background:#000a;font-size:11px;padding:1px 5px;border-radius:3px}}p{{margin:4px 0;color:var(--mut)}}.q{{font-style:italic;font-size:13px}}
.box{{background:#fff;color:#222;border-radius:10px;padding:12px 16px}}.box b{{font-family:ui-monospace,monospace}}
</style></head><body><h1>Hoja de planos · Viviana Haeger</h1><p>Cada bloque muestra lo que se ve. <b style="color:#fff">Blanco = foto real que buscas tú.</b> Los módulos salen con datos de demostración: en el episodio llevan los datos de cada bloque.</p>
<div class=box><b style="font-family:inherit">Fotos para el zip ({len(FOTOS)})</b> · usa estos nombres y anota la fuente de cada una:<ul>{fl}</ul></div>{''.join(out)}</body></html>"""
import base64,re
imgs={}
def rep(m):
    f=m.group(1); c=imgs.setdefault(f,'i%d'%len(imgs)); return f'class="im {c}" role=img'
page=re.sub(r'<img src="(hoja/[^"]+)"[^>]*>',lambda m:'<div '+rep(m)+'></div>',page)
css=''.join('.%s{background-image:url(data:image/jpeg;base64,%s)}'%(c,base64.b64encode(open(E+'/'+f,'rb').read()).decode()) for f,c in imgs.items())
page=page.replace('</style>','.im{width:260px;aspect-ratio:16/9;background-size:cover;background-position:center;border-radius:6px}'+css+'</style>')
open(E+'/hoja-planos.html','w').write(page); print('ok', len(P))
