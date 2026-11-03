import glob, numpy as np
from PIL import Image
from scipy import ndimage as nd
W,H=1920,1080; rng=np.random.default_rng(3)
ms=sorted(glob.glob("mk/*.png")); N=len(ms)
M=[np.array(Image.open(f).resize((W,H),Image.BILINEAR),np.float32)/255 for f in ms]
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
def radial(cx,cy,r): return np.exp(-(((xx-cx)/r)**2+((yy-cy)/(r*0.8))**2))
# niebla: ruido suave grande
def fogtile(seed,s):
    r=np.random.default_rng(seed).random((H//s+4,W//s+8)).astype(np.float32); return nd.zoom(nd.gaussian_filter(r,2),s,order=1)
F1=fogtile(1,24); F2=fogtile(2,40)
rain=[(rng.uniform(0,W),rng.uniform(0,H),rng.uniform(40,90),rng.uniform(0.15,0.4)) for _ in range(260)]
vig=np.clip(1-0.75*(((xx-W/2)/(W*0.62))**2+((yy-H/2)/(H*0.62))**2),0.15,1)
cx=[]
for m in M:
    cols=m.sum(0); idx=np.where(cols>H*0.02)[0]; cx.append((idx.min()+idx.max())/2 if len(idx) else W/2)
cx=np.array(cx); k=31; pad=np.pad(cx,(k//2,k//2),mode="edge"); cxs=np.convolve(pad,np.ones(k)/k,"valid")
print("centros",int(cxs.min()),int(cxs.max()))
for i in range(N):
    t=i/30.0
    m=np.median(np.stack([M[max(0,i-1)],M[i],M[min(N-1,i+1)]]),0)
    shift=int(W/2-cxs[i])
    m=np.roll(m,shift,axis=1)
    if shift<0: m[:,shift:]=0
    elif shift>0: m[:,:shift]=0
    m=nd.gaussian_filter(m,0.8)
    # fondo: contraluz rojo-anaranjado que respira y parpadea un poco
    flick=0.92+0.08*np.sin(t*23)*np.sin(t*7.1)
    glow=radial(960,430,620)*flick
    bg=np.zeros((H,W,3),np.float32); bg[...]=(0.035,0.012,0.018)
    bg+=glow[...,None]*np.array([0.85,0.16,0.12])*0.9
    bg+=radial(960,380,260)[...,None]*np.array([1.0,0.55,0.35])*0.45
    # persianas: franjas diagonales de luz
    blinds=(np.sin((yy+xx*0.35)/26.0)>0.35).astype(np.float32)*radial(1000,420,520)
    bg+=nd.gaussian_filter(blinds,3)[...,None]*np.array([0.9,0.3,0.2])*0.12
    # policia a lo lejos (rojo/azul alternando, muy suave)
    side=radial(1750,520,380); ph=(np.sin(t*9)>0)
    bg+=side[...,None]*(np.array([0.5,0.02,0.05]) if ph else np.array([0.03,0.08,0.45]))*0.35
    # niebla detras
    f2=np.roll(F2,int(t*18),axis=1)[:H,:W]; bg+=(f2*0.12)[...,None]*np.array([0.8,0.35,0.35])
    # borde de luz (rim) en las siluetas
    edge=np.clip(m-nd.grey_erosion(m,size=(7,7)),0,1); edge=nd.gaussian_filter(edge,2.2)
    sil=np.array([0.008,0.004,0.006])
    img=bg*(1-m[...,None])+sil*m[...,None]
    img+=edge[...,None]*np.array([1.0,0.35,0.25])*0.8*flick
    # niebla delante (abajo) y lluvia
    f1=np.roll(F1,-int(t*35),axis=1)[:H,:W]; fogf=f1*np.clip((yy-H*0.55)/(H*0.45),0,1)*0.35
    img=img*(1-fogf[...,None]*0.6)+fogf[...,None]*np.array([0.35,0.14,0.15])
    rl=np.zeros((H,W),np.float32)
    for (x0,y0,l,a) in rain:
        y=(y0+t*1400)%(H+100)-100; x=int(x0+ (y-y0)*0.08)%W; y1=int(max(0,y)); y2=int(min(H,y+l))
        if y2>y1: rl[y1:y2,x]=np.maximum(rl[y1:y2,x],a)
    img+=nd.gaussian_filter(rl,0.6)[...,None]*np.array([0.7,0.6,0.65])*0.6
    img*=vig[...,None]
    img+=(rng.random((H,W))[...,None]-0.5)*0.035
    # empuje de camara lento
    out=Image.fromarray((np.clip(img,0,1)**0.95*255).astype(np.uint8))
    s=1.0+0.07*(i/N); cw,ch=int(W/s),int(H/s); x0=(W-cw)//2; y0=int((H-ch)*0.45)
    out.crop((x0,y0,x0+cw,y0+ch)).resize((W,H),Image.BICUBIC).save("out/%04d.png"%i)
    if i%60==0: print(i,flush=True)
print("ok")
