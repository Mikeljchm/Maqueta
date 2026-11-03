import subprocess, numpy as np, soundfile as sf
SR=48000
def load(f):
    a=np.frombuffer(subprocess.run(['ffmpeg','-loglevel','error','-i',f,'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout,dtype=np.float32)
    return a.reshape(-1,2).copy()
def beep(dur,f=980,amp=0.25):
    t=np.arange(int(dur*SR))/SR; y=(np.sin(2*np.pi*f*t)+0.12*np.sin(2*np.pi*2*f*t))*amp
    e=np.minimum(1,np.minimum(t/0.004,(dur-t)/0.006)); y=y*e; return np.stack([y,y],1).astype(np.float32)
def mix(events,total,out,cut=None):
    buf=np.zeros((int(total*SR),2),np.float32)
    for ev in events:
        a=ev['a'] if 'a' in ev else load(ev['f'])
        s0=int(ev.get('trim',0)*SR); a=a[s0:]
        if 'dur' in ev: a=a[:int(ev['dur']*SR)]
        g=10**(ev.get('db',0)/20); a=a*g
        n=len(a); t=np.arange(n)/SR
        if ev.get('fi'): a*=np.minimum(1,t/ev['fi'])[:,None]
        if ev.get('fo'): a*=np.clip((n/SR-t)/ev['fo'],0,1)[:,None]
        st=int(ev['t']*SR)
        if st<0: a=a[-st:]; st=0
        e=min(len(buf),st+len(a)); buf[st:e]+=a[:e-st]
    if cut: 
        c=int(cut*SR); buf[c:]=0; buf[c-48:c]*=np.linspace(1,0,48)[:,None]
    pk=np.abs(buf).max(); 
    if pk>0.89: buf*=0.89/pk
    sf.write(out,buf,SR); print('mix',out,'pico',round(float(20*np.log10(np.abs(buf).max()+1e-9)),1),'dB')
