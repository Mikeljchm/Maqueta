import json, sys, soundfile as sf, time
from faster_whisper import WhisperModel
name=sys.argv[1]; t=time.time()
m=WhisperModel(name, device="cpu", compute_type="int8", cpu_threads=4)
a,sr=sf.read("song16.wav",dtype="float32")
prompt="It's Britney, bitch. I see you, and I just want to dance with you. Gimme, gimme more. Gimme more. Cameras are flashin' while we're dirty dancin'."
W=[]; L=len(a)/sr; s0=0
while s0<L:
    s1=min(L,s0+30)
    segs,_=m.transcribe(a[int(s0*sr):int(s1*sr)], language="en", word_timestamps=True, initial_prompt=prompt, condition_on_previous_text=False, beam_size=5)
    W+=[{"w":w.word.strip(),"s":round(w.start+s0,3),"e":round(w.end+s0,3)} for sg in segs for w in sg.words]
    s0=s1
json.dump(W,open(f"words_{name}.json","w")); print(name,len(W),round(time.time()-t),"s",flush=True)
