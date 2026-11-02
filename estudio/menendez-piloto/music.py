import numpy as np, soundfile as sf, sys
sys.path.insert(0,"."); from plan import *
SR=44100; N=int(DUR*SR); out=np.zeros(N); rng=np.random.default_rng(9); t=np.arange(N)/SR
def lp(x,a):  # filtro paso bajo simple
    y=np.zeros_like(x); acc=0.0
    for i in range(0,len(x),1): pass
    return np.convolve(x,np.ones(a)/a,"same")
# zumbido grave continuo (dos senos desafinados + armonico) con respiracion lenta
dr=0.5*np.sin(2*np.pi*43.6*t)+0.35*np.sin(2*np.pi*43.9*t+1)+0.12*np.sin(2*np.pi*87.3*t)+0.06*np.sin(2*np.pi*130.8*t+2)
dr*=0.55+0.45*np.sin(2*np.pi*t/11.0)**2
# pad oscuro (acorde menor muy suave, Re menor)
pad=sum(np.sin(2*np.pi*f*t+np.sin(2*np.pi*0.1*t)*0.5) for f in (146.8,174.6,220.0))*0.05
pad*=np.clip((t-9)/6,0,1)
# ruido de viento filtrado
nz=rng.normal(0,1,N); wind=np.convolve(nz,np.ones(200)/200,"same")*3.0*(0.5+0.5*np.sin(2*np.pi*t/17)**2)
out+=dr*0.30+pad+wind*0.05
def add(sig,at,g=1.0):
    i=int(at*SR); s=sig[:max(0,N-i)]; out[i:i+len(s)]+=s*g
def impact():
    n=int(2.8*SR); tt=np.arange(n)/SR; f=55*np.exp(-tt*1.5)+28
    return (np.tanh(2.5*np.sin(2*np.pi*np.cumsum(f)/SR))*np.exp(-tt*1.6)*0.9 + np.convolve(rng.normal(0,1,n),np.ones(30)/30,"same")*np.exp(-tt*5)*1.2)
def riser(d):
    n=int(d*SR); tt=np.arange(n)/SR; x=rng.normal(0,1,n); k=np.linspace(60,2,n).astype(int)
    sm=np.convolve(x,np.ones(25)/25,"same"); mix=np.linspace(0,1,n)**2
    return (sm*(1-mix)+x*mix*0.4)*np.linspace(0,1,n)**2.5*0.5 + np.sin(2*np.pi*np.cumsum(np.linspace(80,400,n))/SR)*np.linspace(0,1,n)**3*0.15
def beat():
    n=int(0.5*SR); tt=np.arange(n)/SR
    def th(d): x=np.sin(2*np.pi*48*tt)*np.exp(-tt*22); return np.roll(x,int(d*SR))
    return (th(0)+0.7*th(0.22))*0.9
def tick():
    n=int(0.03*SR); return rng.normal(0,1,n)*np.exp(-np.arange(n)/SR*300)*0.5
def glitch(d=0.35):
    n=int(d*SR); x=np.sign(np.sin(2*np.pi*np.cumsum(rng.uniform(200,3000,n))/SR))*0.25; return x*(rng.random(n)>0.3)
for a in IMPACTS: add(impact(),a,0.9); add(riser(2.5),max(0,a-2.5),0.8); add(glitch(),a,0.6)
# latidos durante la escena del crimen
s3=NAR["s3"]
for k in np.arange(s3+8,s3+ND["s3"]+2,0.9): add(beat(),k,0.55+0.35*min(1,(k-s3)/20))
# tic-tac del reloj (escena del crimen, clip del reloj)
for k in np.arange(s3+9.5,s3+15.5,0.5): add(tick(),k,0.5)
for k in np.arange(154.5,159.5,0.5): add(tick(),k,0.5)
# estatica de cinta en la llamada y el arranque en frio
for a,b in [(0.0,8.6),(CALL[0],CALL[1])]:
    n=int((b-a)*SR); hiss=rng.normal(0,1,n)*0.06; hum=np.sin(2*np.pi*60*np.arange(n)/SR)*0.03
    add((hiss+hum)*np.minimum(1,np.minimum(np.arange(n),n-np.arange(n))/SR/0.3),a,1.0)
# reduccion bajo la voz (ducking)
env=np.ones(N)
for k,s in NAR.items():
    a,b=int(s*SR),int((s+ND[k])*SR); env[a:b]=0.45
env=np.convolve(env,np.ones(int(0.4*SR))/int(0.4*SR),"same")
out*=env
fade=np.ones(N); fn=int(3*SR); fade[-fn:]=np.linspace(1,0,fn); fade[:int(0.3*SR)]=np.linspace(0,1,int(0.3*SR)); out*=fade
out=out/np.abs(out).max()*0.7
sf.write(V+"/assets/audio/musica.wav",np.stack([out,out*0.98],1).astype(np.float32),SR,subtype="PCM_16")
print("ok",DUR,{k:round(v,1) for k,v in ND.items()})
