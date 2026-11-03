"""Foto 2.5D: depth25d.py foto.jpg salida.mp4 segundos [desplazamiento_px] [zoom]"""
import sys, subprocess, numpy as np, cv2
from PIL import Image
src,out=sys.argv[1],sys.argv[2]; dur=float(sys.argv[3]); SH=float(sys.argv[4]) if len(sys.argv)>4 else 70; ZM=float(sys.argv[5]) if len(sys.argv)>5 else 1.12
W,H,FPS=1920,1080,30
img=Image.open(src).convert('RGB')
from transformers import pipeline
dp=pipeline('depth-estimation',model='depth-anything/Depth-Anything-V2-Small-hf',device='cpu')
d=np.array(dp(img)['depth']).astype(np.float32); d=(d-d.min())/(d.max()-d.min()+1e-6)   # 1 = cerca
# encuadre 16:9 con margen
im=np.array(img); h,w=im.shape[:2]; t=W/H
cw,ch=(w,int(w/t)) if w/h<t else (int(h*t),h)
y0=(h-ch)//2; x0=(w-cw)//2
im=im[y0:y0+ch,x0:x0+cw]; d=cv2.resize(d,(w,h))[y0:y0+ch,x0:x0+cw]
OW,OH=int(W*1.15),int(H*1.15)
im=cv2.resize(im,(OW,OH),interpolation=cv2.INTER_LANCZOS4); d=cv2.resize(d,(OW,OH),interpolation=cv2.INTER_CUBIC)
d=cv2.GaussianBlur(d,(0,0),6)
im=cv2.addWeighted(im,1.35,cv2.GaussianBlur(im,(0,0),2.2),-0.35,0)   # nitidez suave
gx,gy=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32))
p=subprocess.Popen(['ffmpeg','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-crf','16','-pix_fmt','yuv420p',out],stdin=subprocess.PIPE)
N=int(dur*FPS)
for i in range(N):
    u=i/(N-1); e=u*u*(3-2*u)                 # suave
    z=1.0+(ZM-1.0)*e; dx=SH*(e-0.5); dy=-SH*0.25*(e-0.5)
    # muestreo inverso: el plano cercano se mueve mas que el fondo
    cx,cy=OW/2,OH/2
    sx=cx+(gx-W/2)/z; sy=cy+(gy-H/2)/z
    dd=cv2.remap(d,sx,sy,cv2.INTER_LINEAR)
    mx=sx-dx*dd*1.0+dx*0.2; my=sy-dy*dd
    fr=cv2.remap(im,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
    p.stdin.write(fr.tobytes())
p.stdin.close(); p.wait(); print('ok',out)
