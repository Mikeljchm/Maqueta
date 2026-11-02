import json, soundfile as sf
from faster_whisper import WhisperModel
m=WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=4)
a,sr=sf.read("song16.wav",dtype="float32")
prompt="Hello Sawadika. Yeah, you know my wrist is cold. Got this time piece from Geneva. If you know it, then you know. I'm that bitch on your TV and my Ferrari indigo. La la Lisa la diva, Sawadika, there she go."
out={}
for (s0,s1) in [(7.5,31.5),(137.5,170.5)]:
    segs,_=m.transcribe(a[int(s0*sr):int(s1*sr)], language="en", word_timestamps=True, initial_prompt=prompt, condition_on_previous_text=False, beam_size=5)
    W=[{"w":w.word.strip(),"s":round(w.start+s0,3),"e":round(w.end+s0,3)} for sg in segs for w in sg.words]
    out[f"{s0}"]=W; print(s0, ' '.join(f"{w['w']}@{w['s']:.1f}" for w in W))
json.dump(out,open("words_gaps.json","w"))
