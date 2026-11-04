import json,sys,os,subprocess,numpy as np,soundfile as sf
S=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,S); import spec
E='/home/user/Maqueta/estudio/true-crime-plantilla/episodios/01-viviana-haeger'; W=S+'/w'; A=S+'/aud'; SR=48000
def load(f): return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout,np.float32).reshape(-1,2).copy()
def dur(f): return float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
P=json.load(open(E+'/planos.json'))['planos']; t5=P[4]['inicio']; VD=dur(W+'/video.mp4')
buf=np.zeros((int(VD*SR)+SR,2),np.float32)
def add(a,t,db=0,fi=0,fo=0,d=None):
    if d: a=a[:int(d*SR)]
    a=a*10**(db/20); n=len(a); tt=np.arange(n)/SR
    if fi: a*=np.minimum(1,tt/fi)[:,None]
    if fo: a*=np.clip((n/SR-tt)/fo,0,1)[:,None]
    s=int(t*SR); e=min(len(buf),s+n); buf[s:e]+=a[:e-s]
v=load(E+'/audio.mp3'); add(v[:int(t5*SR)],0); add(v[int(t5*SR):],t5+10)
ev=[(2749,0,-16,10),(1177,0,-20,10),(786,0.6,-8,None),(2623,1.6,-6,None),(2842,2.6,-4,None),(1143,3.65,-2,None),(559,3.65,-4,None),(2858,4.6,-6,None),(2858,5.0,-6,None),(2858,5.4,-6,None),(2858,5.8,-6,None),(677,6.6,-8,None),(790,7.2,-6,2),(498,8.6,-6,None),(187,9.1,-3,None)]
for i,t,db,d in ev: add(load(f'{A}/{i}.mp3'),t5+t,db,fo=0.3 if d else 0,d=d)
# firma del tema en cada tarjeta de capítulo; tema completo en el cierre
st=load(A+'/tema_sting.wav'); full=load(A+'/tema_full.wav'); t=0
for o in P:
    if o['id']==5: t+=10
    for k,s in enumerate(spec.B[o['id']]):
        c=W+f"/clips/b{o['id']:02d}_{k}.mp4"
        if s[0]=='cap': add(st,t,-14,fo=1,d=6)
        if o['id']==85 and k==0: add(full,t,-20,fi=2)
        t+=dur(c)
pk=np.abs(buf).max(); buf*=min(1,0.89/pk)
sf.write(W+'/mezcla.wav',buf[:int(VD*SR)],SR); print('mezcla',VD,pk)
