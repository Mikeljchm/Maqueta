import mido, subprocess, numpy as np, soundfile as sf, sys
BPM=64; TPB=480; BEAT=60/BPM; BAR=4*BEAT
N={'A1':33,'Bb1':34,'D2':38,'A2':45,'Bb2':46,'D3':50,'F3':53,'A3':57,'G3':55,'Bb3':58,'C#4':61,'D4':62,'E4':64,'F4':65,'A4':69,'C#5':73,'D5':74,'E5':76,'F5':77,'A5':81,'C#6':85,'D6':86,'E6':88,'F6':89}
def build(version):
    mid=mido.MidiFile(ticks_per_beat=TPB); ev={}  # ch -> list of (tick,msg)
    def prog(ch,p): ev.setdefault(ch,[]).append((0,mido.Message('program_change',channel=ch,program=p)))
    def note(ch,n,beat,dur,vel):
        t0=int(beat*TPB); t1=int((beat+dur)*TPB)
        ev.setdefault(ch,[]).append((t0,mido.Message('note_on',channel=ch,note=N[n] if isinstance(n,str) else n,velocity=vel)))
        ev[ch].append((t1,mido.Message('note_off',channel=ch,note=N[n] if isinstance(n,str) else n,velocity=0)))
    def cc(ch,beat,c,v): ev.setdefault(ch,[]).append((int(beat*TPB),mido.Message('control_change',channel=ch,control=c,value=v)))
    prog(0,0); prog(1,48); prog(2,42); prog(3,44); prog(4,47); prog(5,49)
    for ch in range(6): cc(ch,0,91,110); cc(ch,0,93,20)
    def motif(b,oct=0,vel=58,end='C#5'):
        up=lambda n: N[n]+12*oct
        for i,n in enumerate(['D5','F5','E5']): note(0,up(n),b+i,1.3,vel-(i==2)*6)
        note(0,up(end),b+3,4.5,vel-4)
    if version=='sting':
        note(4,'D2',0,2.5,110); note(1,'D2',0,7,70); note(1,'A2',0,7,60)
        motif(0.5,0,66); note(0,'A1',0.5,6,40)
        return mid,ev,8.5
    # 1. drone
    for n,v in [('D2',62),('A2',52)]: note(1,n,0,48,v)
    cc(1,0,11,40)
    for k in range(0,32): cc(1,k*0.25,11,min(127,40+k*2))
    # 2. motivo A (compases 3-6)
    motif(8,0,56); note(0,'D2',8,4,38); note(0,'A1',12,4,36)
    motif(16,0,60,'A4'); note(0,'Bb1',16,4,40); note(0,'A1',20,4,38)
    # 3. con cello (compases 7-10)
    motif(24,1,52); motif(32,1,56,'A5')
    for n,b,d in [('A3',24,4),('Bb3',28,4),('A3',32,2),('G3',34,2),('A3',36,4)]: note(2,n,b,d,62)
    for n,b in [('D3',24),('A2',28),('Bb2',32),('A2',36)]: note(1,n,b,4,58)
    # 4. subida (compases 11-12)
    for n in ['Bb2','D3','F3']: note(3,n,40,4,70)
    for n in ['A2','C#4','E4']: note(3,n,44,4,90)
    for k in range(32): cc(3,40+k*0.25,11,min(127,50+k*3))
    for k in range(32): note(4,'A1',40+k*0.25,0.24,min(120,30+k*3))
    # 5. golpe (compás 13) y motivo final sin resolver
    note(4,'D2',48,3,127); note(5,'D3',48,2.5,100); note(5,'A3',48,2.5,90); note(1,'D2',48,8,80)
    motif(50,1,50); note(0,'D2',50,8,30)
    return mid,ev,58*BEAT
def render(version,out):
    mid,ev,dur=build(version)
    t0=mido.MidiTrack(); t0.append(mido.MetaMessage('set_tempo',tempo=mido.bpm2tempo(BPM),time=0)); mid.tracks.append(t0)
    for ch,lst in ev.items():
        tr=mido.MidiTrack(); mid.tracks.append(tr); lst.sort(key=lambda x:(x[0],x[1].type=='note_on')); last=0
        for t,m in lst: tr.append(m.copy(time=t-last)); last=t
    mid.save(version+'.mid')
    subprocess.run(['fluidsynth','-ni','-g','0.9','-r','48000','-o','synth.reverb.room-size=0.92','-o','synth.reverb.width=1.0','-o','synth.reverb.level=0.85','-F',version+'_raw.wav','/usr/share/sounds/sf2/FluidR3_GM.sf2',version+'.mid'],check=True,capture_output=True)
    a,sr=sf.read(version+'_raw.wav'); a=a[:int((dur+4)*sr)]
    t=np.arange(len(a))/sr; add=np.zeros(len(a))
    def thump(t0,amp):
        for d,g in [(0,1),(0.2,0.7)]:
            s=int((t0+d)*sr); n=int(0.35*sr); tt=np.arange(n)/sr
            y=np.sin(2*np.pi*(48+30*np.exp(-tt*18))*tt)*np.exp(-tt*9)*g*amp
            e=min(len(add),s+n); add[s:e]+=y[:e-s]
    if version=='sting': thump(0,0.6)
    else:
        for b in range(8,48,2): thump(b*BEAT, 0.18+0.25*(b/48))
        thump(48*BEAT,0.9)
        for k in range(24*4,40*4):  # tic de reloj en semicorcheas
            s=int(k/4*BEAT*sr); n=int(0.012*sr); y=np.random.default_rng(k).standard_normal(n)*np.exp(-np.arange(n)/sr*400)*0.035
            add[s:s+n]+=y
    a=a+add[:,None]
    pk=np.abs(a).max(); a=a*(0.89/pk)
    sf.write(out,a,sr)
render(sys.argv[1],sys.argv[2])
