import numpy as np, soundfile as sf, sys
SR=44100; D=20.0; N=int(SR*D); L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(3); B=0.5  # 120 bpm
def add(sig,t,g=1.0,pan=0.0):
    i=int(t*SR); s=sig[:max(0,N-i)]
    L[i:i+len(s)]+=s*g*(1-max(0,pan)); R[i:i+len(s)]+=s*g*(1+min(0,pan))
def env(n,a,d):
    t=np.arange(n)/SR; return np.minimum(t/a,1)*np.exp(-t/d)
def kick():
    n=int(.45*SR); t=np.arange(n)/SR; f=48+110*np.exp(-t*28); ph=2*np.pi*np.cumsum(f)/SR
    return np.tanh(2.2*np.sin(ph)*np.exp(-t*7))*.9
def snare():
    n=int(.3*SR); t=np.arange(n)/SR; nz=rng.normal(0,1,n); nz=np.convolve(nz,[1,-0.9],'same')
    return (nz*np.exp(-t*16)*.45+np.sin(2*np.pi*190*t)*np.exp(-t*25)*.5)
def hat(o=False):
    n=int((.18 if o else .05)*SR); t=np.arange(n)/SR; nz=rng.normal(0,1,n); nz=nz-np.convolve(nz,np.ones(6)/6,'same')
    return nz*np.exp(-t*(18 if o else 70))*.22
def bass(f,dur):
    n=int(dur*SR); t=np.arange(n)/SR; s=np.sin(2*np.pi*f*t)+.25*np.sin(4*np.pi*f*t)
    return np.tanh(1.6*s)*env(n,.005,dur*.9)*.42
def chord(fs,dur,g=.07):
    n=int(dur*SR); t=np.arange(n)/SR; s=sum(np.sin(2*np.pi*f*t+np.sin(2*np.pi*f*1.003*t)) + np.sin(2*np.pi*f*1.006*t) for f in fs)
    return s*env(n,.03,dur*.6)*g
def riser(dur):
    n=int(dur*SR); t=np.arange(n)/SR; nz=rng.normal(0,1,n); k=np.linspace(40,2,n).astype(int)
    out=np.array(nz); 
    sm=np.convolve(nz,np.ones(30)/30,'same'); mix=np.linspace(0,1,n); out=sm*(1-mix)+nz*mix
    return out*np.linspace(0,1,n)**2*.28
def impact():
    n=int(1.6*SR); t=np.arange(n)/SR; f=40+60*np.exp(-t*8)
    return np.tanh(2*np.sin(2*np.pi*np.cumsum(f)/SR))*np.exp(-t*2.2)*.8 + rng.normal(0,1,n)*np.exp(-t*9)*.3
E1,G1,C2,D2=41.2,49.0,65.4,73.4
prog=[(E1,[164.8,196.0,246.9]),(C2,[130.8,164.8,196.0]),(G1,[196.0,246.9,293.7]),(D2,[146.8,185.0,220.0])]
for bar in range(10):
    t0=bar*4*B; root,ch=prog[bar%4]
    full = 3<=bar<=8   # 6s..18s
    if bar<9: add(chord(ch,4*B),t0,1.0 if not full else .8)
    for b in range(4):
        tb=t0+b*B
        if bar>=1 and bar<=8 and (full or b%2==0): add(kick(),tb)
        if full and b in (1,3): add(snare(),tb,.9,.1)
        if bar<=8:
            add(hat(),tb+B/2,1,-.3); add(hat(),tb,.6,-.3)
            if full and b==3 and bar%2==1:
                for k in range(4): add(hat(),tb+k*B/4,.7,.3)
        if full or bar in (1,2): 
            if b in (0,2): add(bass(root,B*0.95),tb)
            if b==3: add(bass(root*1.5,B*0.45),tb+B/2)
add(riser(2.0),12.0); add(impact(),14.0,.9); add(riser(1.0),16.0,.8); add(impact(),17.0,1.0)
add(chord([164.8,196.0,246.9,329.6],3.0,.09),17.0)
x=np.stack([L,R],1); x/=np.abs(x).max()*1.12
fade=np.ones(N); fn=int(.8*SR); fade[-fn:]=np.linspace(1,0,fn); x*=fade[:,None]
sf.write(sys.argv[1],x.astype(np.float32),SR,subtype='PCM_16')
