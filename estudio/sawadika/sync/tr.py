import json, time
from faster_whisper import WhisperModel
t=time.time()
m=WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=4)
prompt="Hello Sawadika. Yeah, you know my wrist is cold. Got this time piece from Geneva. Ferrari indigo. La la Lisa la diva. Bangkok bang. geng mak. tuktuk."
import soundfile as sf
a,_=sf.read("song16.wav",dtype="float32")
segs,_=m.transcribe(a, language="en", word_timestamps=True, initial_prompt=prompt, vad_filter=False, condition_on_previous_text=False, beam_size=5)
W=[]
for s in segs:
    for w in s.words: W.append({"w":w.word.strip(),"s":round(w.start,3),"e":round(w.end,3),"p":round(w.probability,3)})
json.dump(W,open("words.json","w"))
print(len(W),"words", round(time.time()-t),"s")
