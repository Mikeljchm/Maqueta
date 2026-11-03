import sys,subprocess,time
from tts import tts
notas=open("notas.txt").read().rstrip()+"\n"
paras=[p.strip() for p in open("largo.txt").read().split("\n\n") if p.strip()]
import os; model=os.environ.get("M","gemini-3.8-flash-tts")
for v in sys.argv[1:]:
    if v.endswith("@uno"):
        v=v[:-4]; tts(notas+"#### TRANSCRIPT\n"+" ".join(paras), v, model, f"largo_{v}_una_vez.wav"); continue
    parts=[]
    for i,p in enumerate(paras):
        f=f"l_{v}_{i}.wav"
        if not tts(notas+"#### TRANSCRIPT\n"+p, v, model, f): sys.exit(1)
        parts.append(f); time.sleep(2)
    # quitar silencios de borde y unir con 0.9 s de pausa
    sil="silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.9"
    args=[]; fl=""
    for i,f in enumerate(parts): args+=["-i",f]; fl+=f"[{i}]{sil}[a{i}];"
    fl+="".join(f"[a{i}]" for i in range(len(parts)))+f"concat=n={len(parts)}:v=0:a=1[o]"
    subprocess.run(["ffmpeg","-loglevel","error","-y",*args,"-filter_complex",fl,"-map","[o]",f"largo_{v}_por_partes.wav"],check=True)
