"""Transicion glitch entre dos clips: glitch.py A.mp4 B.mp4 salida.mp4 [audio.wav]
Usa los ultimos 6 cuadros de A y los primeros 6 de B (12 cuadros = 0.4 s a 30 fps)."""
import sys, subprocess, numpy as np
W,H,FPS=1920,1080,30
def nframes(f):
    return int(subprocess.run(['ffprobe','-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=nb_read_frames','-of','csv=p=0',f],capture_output=True,text=True).stdout.strip())
def frames(f,start,n):
    raw=subprocess.run(['ffmpeg','-loglevel','error','-i',f,'-vf',f"select='between(n,{start},{start+n-1})'",'-vsync','0','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.uint8).reshape(-1,H,W,3).copy()
def glitch(img,k,seed,other):
    r=np.random.default_rng(seed); o=img.astype(np.int16)
    dx=int(46*k)
    if dx: o[...,0]=np.roll(o[...,0],dx,1); o[...,2]=np.roll(o[...,2],-dx,1)
    for _ in range(int(3+18*k)):   # franjas desplazadas
        y=r.integers(0,H-10); h=int(r.integers(6,int(20+90*k))); s=int(r.integers(-1,2)*r.integers(40,int(60+340*k)))
        o[y:y+h]=np.roll(o[y:y+h],s,1)
    for _ in range(int(40*k*k)):   # bloques corruptos
        bw=int(r.integers(40,160)); bh=int(r.integers(16,90)); x=int(r.integers(0,W-bw)); y=int(r.integers(0,H-bh)); c=r.integers(0,5)
        if c==0: o[y:y+bh,x:x+bw]=[255,0,200]
        elif c==1: o[y:y+bh,x:x+bw]=[0,255,225]
        elif c==2: o[y:y+bh,x:x+bw]=[40,255,60]
        else:
            sx=int(np.clip(x+r.integers(-300,300),0,W-bw)); o[y:y+bh,x:x+bw]=other[y:y+bh,sx:sx+bw]
    if k>0.55:   # posterizado en una banda
        y=r.integers(0,H//2); h=int(r.integers(80,400)); o[y:y+h]=(o[y:y+h]//72)*72+20
    if k>0.7:    # rayas verticales de cartucho
        for _ in range(int(10*k)):
            x=int(r.integers(0,W)); o[:,x:x+int(r.integers(2,9))]=r.choice([[255,0,200],[0,255,225],[255,255,255],[255,230,0]])
    if k>0.3: o[::2]=(o[::2]*0.72).astype(np.int16)   # lineas de barrido
    if k>0.8: o=np.roll(o,int(r.integers(-140,140)),0)
    return np.clip(o,0,255).astype(np.uint8)
if __name__=='__main__':
    A,B,out=sys.argv[1:4]; aud=sys.argv[4] if len(sys.argv)>4 else None
    nA=nframes(A); fa=frames(A,nA-6,6); fb=frames(B,0,6)
    seq=[(fa[0],.25),(fa[1],.45),(fa[1],.6),(fa[3],.8),(fa[3],.95),(fa[5],1.0),(fb[0],1.0),(fb[0],.85),(fb[2],.6),(fb[3],.4),(fb[4],.25),(fb[5],.1)]
    G=[glitch(f,k,77+i,(fb[0] if i<6 else fa[5])) for i,(f,k) in enumerate(seq)]
    p=subprocess.Popen(['ffmpeg','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-crf','14','-pix_fmt','yuv420p','_g.mp4'],stdin=subprocess.PIPE)
    for g in G: p.stdin.write(g.tobytes())
    p.stdin.close(); p.wait()
    fc=f"[0:v]trim=end_frame={nA-6},setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[g];[2:v]trim=start_frame=6,setpts=PTS-STARTPTS[b];[a][g][b]concat=n=3:v=1:a=0[v]"
    cmd=['ffmpeg','-loglevel','error','-y','-i',A,'-i','_g.mp4','-i',B]+(['-i',aud] if aud else [])+['-filter_complex',fc,'-map','[v]']+(['-map','3:a','-c:a','aac','-b:a','256k','-shortest'] if aud else [])+['-c:v','libx264','-crf','16','-preset','medium','-pix_fmt','yuv420p','-r',str(FPS),out]
    subprocess.run(cmd,check=True); print('ok',out)
