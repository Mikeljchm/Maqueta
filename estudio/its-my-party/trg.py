import json, soundfile as sf
from faster_whisper import WhisperModel
m=WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=4)
a,sr=sf.read("song16.wav",dtype="float32")
P={(3.5,30):"Cry if I want to, cry if I want to. You would cry too if it happened to you. Nobody knows where my Johnny has gone. Judy left the same time. Why was he holding her hand, when he's supposed to be mine?",
   (58,88):"It's my party, and I'll cry if I want to. Cry if I want to, cry if I want to. You would cry too if it happened to you. Judy and Johnny just walked through the door."}
out={}
for (s0,s1),pr in P.items():
    for vad in (False,True):
        segs,_=m.transcribe(a[int(s0*sr):int(s1*sr)], language="en", word_timestamps=True, initial_prompt=pr, condition_on_previous_text=False, beam_size=5, vad_filter=vad)
        W=[{"w":w.word.strip(),"s":round(w.start+s0,3),"e":round(w.end+s0,3)} for sg in segs for w in sg.words]
        print(s0,vad,' '.join(f"{w['w']}@{w['s']:.1f}" for w in W)); out[f"{s0}_{vad}"]=W
json.dump(out,open("words_gaps.json","w"))
