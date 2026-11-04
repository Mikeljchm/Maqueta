import json, os, sys, shutil, subprocess, hashlib, urllib.request, urllib.parse, re, math
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageFilter, ImageOps
S=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,S); import spec
T='/home/user/Maqueta/estudio/true-crime-plantilla'; M=T+'/modulos'; E=T+'/episodios/01-viviana-haeger'; F=E+'/fotos'
W=S+'/w'; os.makedirs(W+'/clips',exist_ok=True); os.makedirs(W+'/mods',exist_ok=True); os.makedirs(W+'/px',exist_ok=True)
FPS=30; ONLY=set(map(int,sys.argv[1].split(','))) if len(sys.argv)>1 and sys.argv[1]!='all' else None
K=open(S+'/.pxkey').read().strip(); UA={'User-Agent':'Mozilla/5.0'}; PX=json.load(open(S+'/pixabay.json'))
FONT=S+'/SpecialElite.ttf'
def sh(c): subprocess.run(c,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
def ff(*a): sh(['ffmpeg','-v','error','-y',*a])
def dur(f): return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
ENC=['-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-r',str(FPS),'-an']
def esc(t): return t.replace('\\','\\\\').replace(':','\\:').replace("'","\u2019").replace('%','\\%')
def dtxt(t): return f",drawbox=x=90:y=ih-170:w=8:h=64:color=0xb3132b:t=fill,drawtext=fontfile={FONT}:text='{esc(t)}':x=120:y=h-160:fontsize=46:fontcolor=0xf4ecdf:shadowcolor=black@0.7:shadowx=2:shadowy=2" if t else ''
GRADE="eq=saturation=0.72:brightness=-0.05:contrast=1.06,vignette=PI/4.5,noise=alls=7:allf=t"
# ---------- módulos HyperFrames
def mod_assets(d,dd,extra):
    a=d+'/assets'; os.makedirs(a,exist_ok=True)
    for f in os.listdir(S+'/fonts'): shutil.copy(S+'/fonts/'+f,a)
    shutil.copy(S+'/gsap.min.js',a)
    ff('-f','lavfi','-i','anullsrc=r=48000:cl=stereo','-t',str(dd),a+'/mix.wav')
    for f in ['cork.jpg','lago.jpg','eye.png']: shutil.copy(S+'/'+f,a)
    Image.open(F+'/08-casa-la-tercera.jpg').convert('RGB').save(a+'/casa.jpg',quality=90)
    if extra.get('_foto'):
        im=Image.open(F+'/'+extra['_foto']).convert('RGB')
        fi=ImageOps.fit(im,(560,686),centering=(0.5,0.3)); g=ImageOps.colorize(fi.convert('L'),'#1a1210','#f1e6d2'); g.save(a+'/foto.jpg',quality=90)
        cv=ImageOps.fit(im,(1920,1080),centering=(0.5,0.35)); cv.save(a+'/foto.jpg' if 'frase' in extra or extra.get('_cv') else a+'/foto_full.jpg',quality=90)
        cv.convert('L').convert('RGB').save(a+'/foto_bn.jpg',quality=90)
def render_mod(name,data,L):
    data=dict(data); dd=None
    src=M+'/'+name if name!='cerradura' else T+'/marca/animaciones/cerradura'
    build=os.path.exists(src+'/build.py')
    if build:
        base=json.load(open(src+'/viviana.json')); base.update({k:v for k,v in data.items() if not k.startswith('_')})
        base['dur']=dd=round(min(max(L,4),40),2)
    key=hashlib.md5((name+json.dumps(data,sort_keys=True,ensure_ascii=False)+str(dd)).encode()).hexdigest()[:12]
    d=W+'/mods/'+name+'_'+key; out=d+'/out.mp4'
    if os.path.exists(out): return out
    shutil.rmtree(d,ignore_errors=True); shutil.copytree(src,d,ignore=shutil.ignore_patterns('assets','*.mp4'))
    if build:
        json.dump(base,open(d+'/datos.json','w'),ensure_ascii=False); subprocess.run(['python3','build.py','datos.json'],cwd=d,check=True,capture_output=True)
    h=open(d+'/index.html').read()
    if not build:
        dd=float(re.search(r'data-duration="([0-9.]+)"',h).group(1))
        if name=='capitulo':
            h=h.replace('CAPÍTULO 2',data['k']).replace('10 · 08 · 2010 &nbsp;—&nbsp; DÍA 42',data['d']).replace("'Seis semanas después'",json.dumps(data['t'],ensure_ascii=False))
        if name=='comentario' and 'frase' in data:
            h=re.sub(r'const DATA=\{.*?\};','const DATA='+json.dumps(dict(frase=data['frase'],sub=data['sub'],freeze=1.2),ensure_ascii=False)+';',h,count=1)
        open(d+'/index.html','w').write(h)
    if name=='comentario': data['_cv']=1
    mod_assets(d,dd,data)
    if name=='recreacion': shutil.copy(W+'/recre_bg.mp4',d+'/assets/recre_bg.mp4')
    r=subprocess.run(['npx','hyperframes','render','-o','out.mp4'],cwd=d,capture_output=True,text=True)
    if not os.path.exists(out): raise RuntimeError(name+': '+r.stdout[-600:])
    return out
# ---------- Pixabay
def px_file(q):
    i=PX[q]['id']; f=W+f'/px/{i}.mp4'
    if not os.path.exists(f):
        h=json.load(urllib.request.urlopen(urllib.request.Request('https://pixabay.com/api/videos/?'+urllib.parse.urlencode(dict(key=K,id=i)),headers=UA)))['hits'][0]['videos']
        v=h['large'] if 0<h['large']['width']<=1920 and h['large']['url'] else h['medium']
        open(f,'wb').write(urllib.request.urlopen(urllib.request.Request(v['url'],headers=UA)).read())
    return f
def clip_px(q,L,txt,out):
    ff('-stream_loop','-1','-i',px_file(q),'-t',f'{L:.3f}','-vf','scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,'+GRADE+dtxt(txt),*ENC,out)
def clip_foto(f,L,txt,out):
    im=Image.open(F+'/'+f).convert('RGB'); bg=ImageOps.fit(im,(1920,1080)).filter(ImageFilter.GaussianBlur(40)).point(lambda p:p*0.45)
    fg=im.copy(); fg.thumbnail((1920,1080)) if fg.width/fg.height>16/9 else fg.thumbnail((1920*2,1080)); fg=ImageOps.contain(im,(1920,1080))
    bg.paste(fg,((1920-fg.width)//2,(1080-fg.height)//2)); p=out+'.png'; bg.resize((3840,2160)).save(p)
    n=max(1,int(L*FPS)); ff('-loop','1','-i',p,'-vf',f"zoompan=z='1+0.10*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s=1920x1080:fps={FPS},"+GRADE+dtxt(txt),'-frames:v',str(n),*ENC,out); os.remove(p)
def fit(src,L,out):
    ff('-i',src,'-vf',f'tpad=stop_mode=clone:stop_duration={L+1:.2f},trim=duration={L:.3f},setpts=PTS-STARTPTS,fps={FPS}',*ENC,out)
# ---------- plan
P=json.load(open(E+'/planos.json'))['planos']; AUD=E+'/audio.mp3'; AD=dur(AUD); P[-1]['fin']=AD
jobs=[]
for o in P:
    if ONLY and o['id'] not in ONLY: continue
    slot=o['fin']-o['inicio']; sh_=spec.B[o['id']]
    fixed=sum(min(4.5,slot*0.5) for s in sh_ if s[0]=='cap'); wsum=sum(s[2] for s in sh_ if s[0]!='cap') or 1
    for k,s in enumerate(sh_):
        L=min(4.5,slot*0.5) if s[0]=='cap' else (slot-fixed)*s[2]/wsum
        jobs.append((o['id'],k,s,L,W+f"/clips/b{o['id']:02d}_{k}.mp4"))
def do_fast(j):
    i,k,s,L,out=j
    if s[0]=='px': clip_px(s[1],L,s[3].get('txt'),out)
    elif s[0]=='foto': clip_foto(s[1],L,s[3].get('txt'),out)
    elif s[0]=='negro': ff('-f','lavfi','-i',f'color=black:s=1920x1080:r={FPS}','-t',f'{L:.3f}',*ENC,out)
    return out
if not os.path.exists(W+'/recre_bg.mp4'):
    for q,i in [('_man',279615),('_door',88883)]: PX[q]={'id':i}
    ff('-f','lavfi','-i','color=0x2a0306:s=1920x1080:r=30:d=10','-stream_loop','-1','-i',px_file('_door'),'-stream_loop','-1','-i',px_file('_man'),'-filter_complex',
       '[1]scale=1920:1080,chromakey=0x55dd33:0.18:0.06[d];[2]scale=1920:1080,chromakey=0x55dd33:0.18:0.06,colorchannelmixer=rr=0:gg=0:bb=0[m];[0][d]overlay[a];[a][m]overlay,vignette=PI/4','-t','10',*ENC,W+'/recre_bg.mp4')
with ThreadPoolExecutor(3) as ex: list(ex.map(do_fast,[j for j in jobs if j[2][0] in('px','foto','negro')]))
print('rápidos listos',flush=True)
for i,k,s,L,out in jobs:
    if s[0] in ('mod','cap'):
        if os.path.exists(out): continue
        try: fit(render_mod('capitulo' if s[0]=='cap' else s[1],s[3],L),L,out); print('ok',i,k,s[1] or 'cap',flush=True)
        except Exception as e: print('FALLA',i,k,s[1],str(e)[:300],flush=True); ff('-f','lavfi','-i',f'color=0x22121a:s=1920x1080:r={FPS}','-t',f'{L:.3f}',*ENC,out)
if ONLY: sys.exit()
intro=W+'/clips/intro.mp4'
if not os.path.exists(intro): fit(render_mod('cerradura',{},10),10,intro)
with open(W+'/lista.txt','w') as f:
    for o in P:
        if o['id']==5: f.write(f"file '{intro}'\n")
        for k,_ in enumerate(spec.B[o['id']]): f.write(f"file '{W}/clips/b{o['id']:02d}_{k}.mp4'\n")
ff('-f','concat','-safe','0','-i',W+'/lista.txt','-c','copy',W+'/video.mp4')
print('video', dur(W+'/video.mp4'),flush=True)
