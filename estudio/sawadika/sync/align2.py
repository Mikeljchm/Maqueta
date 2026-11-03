import json, re, difflib
main=json.load(open("words.json")); gaps=json.load(open("words_gaps.json"))
W=[w for w in main if w["s"]<7.5]+gaps["7.5"]+[w for w in main if 31.5<=w["s"]<137.5]+gaps["137.5"]
norm=lambda t: re.sub(r"[^a-z0-9]","",t.lower())
lines=[l for l in open("lyrics.txt").read().split("\n") if l.strip()]
SEC=[("coro",0,6,0,14.4),("coro",6,12,14.4,28.2),("verso",12,30,31.3,58.6),("puente",30,32,58.4,70.5),("coro",32,38,72.5,86.1),("coro",38,44,86.1,99.9),
     ("verso",44,58,99.9,126.8),("puente",58,60,126.8,138.6),("coro",60,66,141.5,154.6),("coro",66,72,154.6,168.3)]
res=[]
for kind,a,b,t0,t1 in SEC:
    ww=[w for w in W if t0<=w["s"]<t1]
    LW=[(li,tok) for li in range(a,b) for tok in lines[li].split()]
    sm=difflib.SequenceMatcher(None,[norm(t) for _,t in LW],[norm(w["w"]) for w in ww],autojunk=False)
    T=[None]*len(LW)
    for x,y,n in sm.get_matching_blocks():
        for k in range(n): T[x+k]=[ww[y+k]["s"],ww[y+k]["e"]]
    if T[0] is None: T[0]=[ww[0]["s"],ww[0]["s"]+0.25]
    if T[-1] is None: T[-1]=[ww[-1]["e"]-0.3,ww[-1]["e"]]
    kn=[i for i,t in enumerate(T) if t]
    for i,t in enumerate(T):
        if t: continue
        p=max(k for k in kn if k<i); q=min(k for k in kn if k>i)
        s=T[p][1]+(T[q][0]-T[p][1])*(i-p)/(q-p); T[i]=[s,s+0.2]
    for li in range(a,b):
        ws=[{"w":tok,"s":round(T[i][0],3),"e":round(T[i][1],3)} for i,(x,tok) in enumerate(LW) if x==li]
        res.append({"line":lines[li],"kind":kind,"words":ws})
for l,t0 in zip(lines[72:],[168.6,172.0,175.4,178.9]):
    toks=l.split(); res.append({"line":l,"kind":"outro","words":[{"w":tk,"s":round(t0+k*0.5,3),"e":round(t0+k*0.5+0.45,3)} for k,tk in enumerate(toks)]})
for r in res: print(f'{r["words"][0]["s"]:7.2f}-{r["words"][-1]["e"]:7.2f} {r["kind"][:2]} {r["line"]}')
json.dump(res,open("timing.json","w"),ensure_ascii=False)
