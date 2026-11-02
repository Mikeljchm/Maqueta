# linea de tiempo compartida por la musica y la composicion
import subprocess
V="/tmp/claude-0/-home-user-Maqueta/0ff2d02d-398a-55b3-9e3c-ad2c40e3421f/scratchpad/menendez-video"
def dur(k): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f"{V}/assets/audio/{k}.wav"],capture_output=True,text=True).stdout)
NAR={"s0":9.0,"s1":35.5,"s2":63.5,"s3":97.5,"s4":129.5,"s5":154.5,"s6":183.0,"s7":206.5}
ND={k:dur(k) for k in NAR}
CH=[(33.0,"I","LA CASA"),(61.0,"II","DOS DÍAS ANTES"),(95.0,"III","LA NOCHE"),(127.0,"IV","LA COARTADA"),(181.0+0.0,"V","LA PISTA FALSA")]
CH=[c for c in CH if c[1]!="V"]
CALL=(159.5,182.0); TITLE=(26.0,33.0); VERA=(224.5,231.0); END=(231.0,238.5); DUR=238.5
IMPACTS=[7.8,26.0,33.0,61.0,95.0,127.0,159.5,206.5,224.5]
def cue(k,frac): return NAR[k]+ND[k]*frac
