import json, urllib.request, urllib.parse, subprocess, os, sys
K="58374031-f3264b3124afc0ba6649babc6"; V=sys.argv[1]; R="raw"
Q={"police":"police car lights night","palms":"palm trees night","mansion":"mansion night","highway":"highway night driving","tv":"old television static","hall":"dark hallway night","city":"los angeles night city lights","festival":"night festival crowd","phone":"old telephone","rain":"rain window night","tape":"police tape","news":"old newspaper","cell":"prison bars","clock":"clock ticking dark"}
BAD=("ai generated","anime","cartoon","animation","3d","render","generated","illustration","fantasy")
H={"User-Agent":"Mozilla/5.0"}
out={}
for k,q in Q.items():
    d=json.load(urllib.request.urlopen(urllib.request.Request("https://pixabay.com/api/videos/?"+urllib.parse.urlencode({"key":K,"q":q,"per_page":20,"safesearch":"true"}),headers=H),timeout=20))
    pick=None
    for h in d["hits"]:
        if any(b in h["tags"].lower() for b in BAD) or h["duration"]<7: continue
        rend=[v for v in h["videos"].values() if v.get("width")==1920 and v.get("url")]
        if rend: pick=(h,rend[0]); break
    if not pick: print(k,"SIN RESULTADO"); continue
    h,r=pick; src=f"{R}/{k}.mp4"
    urllib.request.urlretrieve if False else None
    req=urllib.request.Request(r["url"],headers=H); open(src,"wb").write(urllib.request.urlopen(req,timeout=60).read())
    dst=f"{V}/assets/vid/{k}.mp4"
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",src,"-t","14","-an","-vf","scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30","-c:v","libx264","-crf","24","-preset","veryfast","-pix_fmt","yuv420p",dst])
    out[k]={"id":h["id"],"tags":h["tags"],"dur":min(14,h["duration"]),"user":h.get("user"),"page":h.get("pageURL")}
    print(k,h["id"],h["duration"],"|",h["tags"][:60])
json.dump(out,open("stock.json","w"),indent=1)
