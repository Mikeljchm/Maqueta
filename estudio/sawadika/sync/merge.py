import json, re, difflib
norm=lambda t: re.sub(r"[^a-z0-9]","",t.lower())
lines=[l for l in open("lyrics.txt").read().split("\n") if l.strip()]
SEC=[(0,6,0,14.4),(6,12,14.4,28.2),(12,30,31.3,58.6),(30,32,58.4,70.5),(32,38,72.5,86.1),(38,44,86.1,99.9),(44,58,99.9,126.8),(58,60,126.8,138.6),(60,66,141.5,154.6),(66,72,154.6,168.3)]
main=json.load(open("words.json")); gaps=json.load(open("words_gaps.json"))
WS=[w for w in main if w["s"]<7.5]+gaps["7.5"]+[w for w in main if 31.5<=w["s"]<137.5]+gaps["137.5"]
WM=json.load(open("words_medium.json"))
def match(W,a,b,t0,t1):
    ww=[w for w in W if t0<=w["s"]<t1]
    LW=[tok for li in range(a,b) for tok in lines[li].split()]
    sm=difflib.SequenceMatcher(None,[norm(t) for t in LW],[norm(w["w"]) for w in ww],autojunk=False)
    T=[None]*len(LW)
    for x,y,n in sm.get_matching_blocks():
        for k in range(n): T[x+k]=[ww[y+k]["s"],ww[y+k]["e"]]
    return LW,T,ww
old=json.load(open("timing.json"))
res=[]; stats=[0,0,0,0]
for a,b,t0,t1 in SEC:
    LW,TS,wws=match(WS,a,b,t0,t1); _,TM,wwm=match(WM,a,b,t0,t1)
    T=[]
    for s,m in zip(TS,TM):
        if s and m:
            if abs(s[0]-m[0])<0.3: T.append([(s[0]+m[0])/2,(s[1]+m[1])/2]); stats[0]+=1
            else: T.append(m); stats[1]+=1
        elif m: T.append(m); stats[2]+=1
        elif s: T.append(s); stats[2]+=1
        else: T.append(None); stats[3]+=1
    # monotonia
    last=-1
    for i,t in enumerate(T):
        if t and t[0]<last: T[i]=None
        elif t: last=t[0]
    ww=wwm or wws
    if T[0] is None: T[0]=[min(w["s"] for w in (wws+wwm)),0]; T[0][1]=T[0][0]+0.25
    if T[-1] is None: T[-1]=[max(w["e"] for w in (wws+wwm))-0.3,max(w["e"] for w in (wws+wwm))]
    kn=[i for i,t in enumerate(T) if t]
    for i,t in enumerate(T):
        if t: continue
        p=max(k for k in kn if k<i); q=min(k for k in kn if k>i)
        s=T[p][1]+(T[q][0]-T[p][1])*(i-p)/(q-p); T[i]=[s,s+0.2]
    k=0
    for li in range(a,b):
        n=len(lines[li].split()); ws=[{"w":tok,"s":round(T[k+j][0],3),"e":round(T[k+j][1],3)} for j,tok in enumerate(lines[li].split())]; k+=n
        res.append({"line":lines[li],"words":ws})
res+=old[72:]
# outro: usar medium si lo reconoce
om=[w for w in WM if w["s"]>=168 and "saw" in norm(w["w"])+"x" or (w["s"]>=168 and norm(w["w"]).startswith("hel"))]
print("outro medium:",[(w["w"],w["s"]) for w in WM if w["s"]>=167])
print("ambos-coinciden %d, difieren(usa medium) %d, solo-uno %d, interpolados %d"%tuple(stats))
diff=[abs(x["s"]-y["s"]) for r,o in zip(res,old) for x,y in zip(r["words"],o["words"])]
print("cambio medio vs v1: %.3fs, >0.15s: %d de %d"%(sum(diff)/len(diff),sum(d>0.15 for d in diff),len(diff)))
json.dump(res,open("timing2.json","w"),ensure_ascii=False)
