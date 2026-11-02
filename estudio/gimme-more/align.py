import json, re, difflib
norm=lambda t: re.sub(r"[^a-z0-9]","",t.lower())
L=[l for l in open("lyrics.txt").read().split("\n") if l.strip()]
WM=[w for w in json.load(open("words_medium.en.json")) if not (26<w["s"]<29)]
WM+= [{"w":w,"s":s,"e":s+0.3} for w,s in [("Every",21.3),("time",22.0),("they",22.5),("turn",22.77),("the",23.03),("lights",23.32),("down",23.8),("Just",26.2),("want",26.48),("to",26.84),("go",27.06),("that",27.3),("extra",27.66),("mile",28.3),("for",28.94),("you",29.38),("Your",29.9)]]
WM.sort(key=lambda w:w["s"])
WS=json.load(open("words_small.en.json"))
GRID0, GB = 54.9, 4.24
def span(a,b,t0,t1):
    toks=[(li,t) for li in range(a,b) for t in L[li].split()]
    def match(W):
        ww=[w for w in W if t0<=w["s"]<t1]
        sm=difflib.SequenceMatcher(None,[norm(t) for _,t in toks],[norm(w["w"]) for w in ww],autojunk=False)
        T=[None]*len(toks)
        for x,y,n in sm.get_matching_blocks():
            for k in range(n): T[x+k]=[ww[y+k]["s"],ww[y+k]["e"]]
        return T,ww
    TM,wm=match(WM); TS,ws=match(WS)
    T=[m if m else (s if s and (not m) else None) for m,s in zip(TM,TS)]
    T=[[(m[0]+s[0])/2,(m[1]+s[1])/2] if (m and s and abs(m[0]-s[0])<0.3) else t for m,s,t in zip(TM,TS,T)]
    last=-1
    for i,t in enumerate(T):
        if t and t[0]<last: T[i]=None
        elif t: last=t[0]
    if T[0] is None: x=min(w["s"] for w in wm+ws); T[0]=[x,x+.3]
    if T[-1] is None: x=max(w["e"] for w in wm+ws); T[-1]=[x-.3,x]
    kn=[i for i,t in enumerate(T) if t]
    for i,t in enumerate(T):
        if t: continue
        p=max(k for k in kn if k<i); q=min(k for k in kn if k>i); s=T[p][1]+(T[q][0]-T[p][1])*(i-p)/(q-p); T[i]=[s,s+.2]
    out={}
    for (li,tok),t in zip(toks,T): out.setdefault(li,[]).append({"w":tok,"s":round(t[0],3),"e":round(t[1],3)})
    return [(li,out[li]) for li in range(a,b)]
SLOT=[(0.0,[0,0.72,1.1],1.78),(1.78,[0,0.36],0.72),(2.5,[0,0.55,0.95],1.74)]
def gim(text,start,slot):
    off,tpl,dur=SLOT[slot]; toks=text.split(); t0=start+off; ws=[]
    for j,tk in enumerate(toks):
        if j<len(tpl) and not (len(toks)>len(tpl) and j>=len(tpl)): s=t0+tpl[j]
        else: n=len(toks)-len(tpl); s=t0+tpl[-1]+0.35+(dur-tpl[-1]-0.45)*(j-len(tpl))/max(1,n)
        ws.append({"w":tk,"s":round(s,3),"e":round(s+0.3,3)})
    return ws
def chorus(lines,k0):
    return [(li,gim(L[li] if isinstance(li,int) else li[1],GRID0+(k0+i//3)*GB,i%3)) for i,li in enumerate(lines)]
R=[]
R+=span(0,3,0,13.5); R+=span(3,14,13.5,54.8)
R+=[("c",x) for x in []]
R+=chorus(list(range(14,26)),0)
R+=span(26,38,72,105.8)
R+=chorus(list(range(38,50)),12)
R+=span(50,51,123.5,128.8)
def man(li,pairs): return (li,[{"w":t,"s":a,"e":a+0.35} for t,a in zip(L[li].split(),pairs)])
R+=[man(51,[129.2,130.2]),man(52,[132.92,133.34,133.78]),man(53,[134.94,135.4,135.8,136.2,136.6]),man(54,[137.3,138.0])]
R+=chorus(list(range(55,67)),20)
def spread(li,a,b):
    toks=L[li].split(); return (li,[{"w":t,"s":round(a+(b-a)*j/len(toks),3),"e":round(a+(b-a)*(j+1)/len(toks),3)} for j,t in enumerate(toks)])
R+=[spread(67,157.6,160.9),spread(68,161.0,171.2),man(69,[172.0,172.3,172.6,172.95])]
R+=chorus(list(range(70,82)),28)
extra=[(None,L[i]) for i in range(14,26)]
R+=[( "x"+str(i), w) for i,(_,w) in enumerate(chorus([(None,L[14+i]) for i in range(12)],32))]
R+=span(82,len(L),207.0,230)
res=[]
for li,ws in R:
    text=L[li] if isinstance(li,int) else L[14+int(li[1:])]
    res.append({"line":text,"words":ws})
json.dump(res,open("timing.json","w"))
for r in res: print(f'{r["words"][0]["s"]:6.2f}-{r["words"][-1]["e"]:6.2f} {r["line"]}')
