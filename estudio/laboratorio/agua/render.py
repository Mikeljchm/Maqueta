import bpy, os, sys
D=os.path.dirname(os.path.abspath(__file__))
argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
ONLY=[int(x) for x in argv] if argv else None
sc=bpy.context.scene; r=sc.render
for f in range(sc.frame_start,sc.frame_end+1):
    if ONLY and f not in ONLY: continue
    sc.frame_set(f); r.filepath=os.path.join(D,"frames","f_%03d.png"%f); bpy.ops.render.render(write_still=True); print("FRAME",f,flush=True)
