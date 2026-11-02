import soundfile as sf
from faster_whisper import WhisperModel
m=WhisperModel("small.en", device="cpu", compute_type="int8", cpu_threads=4)
a,sr=sf.read("song16.wav",dtype="float32")
pr="Gimme, gimme more. Gimme more. Gimme, gimme more. They want more? Well, I'll give them more. Danja, Danja. I just want more."
for s0 in range(122,212,6):
    s1=s0+6
    segs,_=m.transcribe(a[int(s0*sr):int(s1*sr)], language="en", word_timestamps=True, initial_prompt=pr, condition_on_previous_text=False, beam_size=5, temperature=0)
    print(s0, ' '.join(f"{w.word.strip()}@{w.start+s0:.1f}" for sg in segs for w in sg.words), flush=True)
