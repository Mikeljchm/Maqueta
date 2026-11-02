import json, soundfile as sf, time
from faster_whisper import WhisperModel
t=time.time()
m=WhisperModel("medium.en", device="cpu", compute_type="int8", cpu_threads=4)
a,sr=sf.read("song16.wav",dtype="float32")
prompt="Hello Sawadika. Yeah, you know my wrist is cold. Got this time piece from Geneva. If you know it, then you know. I'm that bitch on your TV and my Ferrari indigo. La la Lisa la diva, Sawadika, there she go."
W=[]
for s0,s1 in [(0,31.5),(31.5,72.5),(72.5,100),(100,141.5),(141.5,186.9)]:
    segs,_=m.transcribe(a[int(s0*sr):int(s1*sr)], language="en", word_timestamps=True, initial_prompt=prompt, condition_on_previous_text=False, beam_size=5)
    W+=[{"w":w.word.strip(),"s":round(w.start+s0,3),"e":round(w.end+s0,3)} for sg in segs for w in sg.words]
    print(s0,len(W),round(time.time()-t),flush=True)
json.dump(W,open("words_medium.json","w"))
