import json, re, difflib
norm=lambda t: re.sub(r"[^a-z0-9]","",t.lower())
lines=[l for l in open("lyrics.txt").read().split("\n") if l.strip()]
WM=[w for w in json.load(open("words_medium.en.json")) if not (72<w["s"]<88.5) and not (w["s"]==120.0 and norm(w["w"]) in ("its","my","party"))]
G=json.load(open("words_gaps.json")); WS=[w for w in json.load(open("words_small.en.json")) if not (58<w["s"]<89.9)]+G["3.5_False"]+G["58_False"]
WS=[w for w in WS if not (3.5<=w["s"]<30 and w in json.load(open("words_small.en.json")))]
SEC=[(0,3,0,13.5,"coro"),(3,7,13.5,29.6,"verso"),(7,10,29.6,43,"coro"),(10,14,43,59.2,"verso"),(14,17,59.2,72,"coro"),(17,21,88.0,103.4,"verso"),(21,24,103.4,116.5,"coro"),(24,27,116.5,131,"coro")]
def match(W,a,b,t0,t1):
    ww=[w for w in W if t0<=w["s"]<t1]
    LW=[tok for li in range(a,b) for tok in lines[li].split()]
    sm=difflib.SequenceMatcher(None,[norm(t) for t in LW],[norm(w["w"]) for w in ww],autojunk=False)
    T=[None]*len(LW)
    for x,y,n in sm.get_matching_blocks():
        for k in range(n): T[x+k]=[ww[y+k]["s"],ww[y+k]["e"]]
    return LW,T,ww
res=[];st=[0,0,0]
for a,b,t0,t1,kind in SEC:
    LW,TM,wm=match(WM,a,b,t0,t1); _,TS,ws=match(WS,a,b,t0,t1)
    T=[]
    for m,s in zip(TM,TS):
        if m and s and abs(m[0]-s[0])<0.3: T.append([(m[0]+s[0])/2,(m[1]+s[1])/2]); st[0]+=1
        elif m: T.append(m); st[1]+=1
        elif s: T.append(s); st[1]+=1
        else: T.append(None); st[2]+=1
    last=-1
    for i,t in enumerate(T):
        if t and t[0]<last: T[i]=None
        elif t: last=t[0]
    allw=wm+ws
    if T[0] is None: s=min(w["s"] for w in allw); T[0]=[s,s+0.3]
    if T[-1] is None: e=max(w["e"] for w in allw); T[-1]=[e-0.3,e]
    kn=[i for i,t in enumerate(T) if t]
    for i,t in enumerate(T):
        if t: continue
        p=max(k for k in kn if k<i); q=min(k for k in kn if k>i)
        s=T[p][1]+(T[q][0]-T[p][1])*(i-p)/(q-p); T[i]=[s,s+0.2]
    k=0
    for li in range(a,b):
        toks=lines[li].split(); res.append({"line":lines[li],"kind":kind,"words":[{"w":t,"s":round(T[k+j][0],3),"e":round(T[k+j][1],3)} for j,t in enumerate(toks)]}); k+=len(toks)
print("coinciden %d, uno %d, interpolados %d"%tuple(st))
for r in res: print(f'{r["words"][0]["s"]:6.2f}-{r["words"][-1]["e"]:6.2f} {r["line"]}')
json.dump(res,open("timing.json","w"))
