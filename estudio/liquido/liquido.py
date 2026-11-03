import bpy, random, math, sys, os
from mathutils import Vector
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frames")
argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
NF = int(argv[0]) if argv else 48
ONLY = int(argv[1]) if len(argv) > 1 else None
random.seed(7)
sc = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
r = sc.render; r.engine = 'CYCLES'; r.resolution_x, r.resolution_y = 960, 540; r.fps = 24
cy = sc.cycles; cy.samples = 48; cy.device = 'CPU'
try:
    cy.use_denoising = True; cy.denoiser = 'OPENIMAGEDENOISE'; print("DENOISE ON")
except Exception as e:
    cy.use_denoising = False; cy.samples = 96; print("DENOISE OFF", e)
cy.max_bounces = 12; cy.transmission_bounces = 12; cy.glossy_bounces = 8
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'
# mundo oscuro
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.004, 0.003, 0.008, 1)
# piso brillante
bpy.ops.mesh.primitive_plane_add(size=30); fl = bpy.context.object
mf = bpy.data.materials.new("Piso"); mf.use_nodes = True
b = mf.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (0.01, 0.008, 0.012, 1); b.inputs["Roughness"].default_value = 0.18
fl.data.materials.append(mf)
# fondo curvo (pared)
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 6, 5), rotation=(math.radians(90), 0, 0)); wl = bpy.context.object; wl.data.materials.append(mf)
# liquido: metaballs
mb = bpy.data.metaballs.new("Liq"); mb.resolution = 0.05; mb.render_resolution = 0.012; mb.threshold = 0.6
lo = bpy.data.objects.new("Liq", mb); sc.collection.objects.link(lo)
ml = bpy.data.materials.new("Cereza"); ml.use_nodes = True
b = ml.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (0.85, 0.03, 0.08, 1)
b.inputs["Transmission Weight"].default_value = 1.0; b.inputs["IOR"].default_value = 1.34; b.inputs["Roughness"].default_value = 0.03
mb.materials.append(ml)
# luces de estudio
def area(name, loc, col, power, size):
    d = bpy.data.lights.new(name, 'AREA'); d.color = col; d.energy = power; d.size = size
    o = bpy.data.objects.new(name, d); sc.collection.objects.link(o); o.location = loc
    o.rotation_euler = (Vector((0, 0, 1.0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
area("Key", (-3, -3, 5), (1, 0.95, 0.9), 900, 3)
area("RimRojo", (4, 2, 2.5), (1, 0.05, 0.1), 1500, 2)
area("RimVioleta", (-4, 3, 2), (0.45, 0.1, 1), 1500, 2)
area("Top", (0, 1, 6), (1, 1, 1), 300, 6)
# camara
cd = bpy.data.cameras.new("Cam"); cd.lens = 42; cam = bpy.data.objects.new("Cam", cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0.2, -7.5, 1.6); cam.rotation_euler = (Vector((0.3, 0, 0.9)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
cd.dof.use_dof = True; cd.dof.focus_distance = 7.4; cd.dof.aperture_fstop = 4
# simulacion balistica (sub-pasos)
G = -9.8; DT = 1/24; SUB = 4; parts = []
SRC = Vector((-1.7, 0, 2.3))
frames = []
for f in range(NF):
    if f < NF - 10:
        for _ in range(12):
            v = Vector((2.4 + random.uniform(-0.15, 0.15), random.uniform(-0.12, 0.12), 0.6 + random.uniform(-0.15, 0.15)))
            parts.append({"p": SRC + Vector((random.uniform(-0.04,0.04),random.uniform(-0.04,0.04),random.uniform(-0.04,0.04))) + v*random.uniform(0, DT), "v": v, "r": random.uniform(0.10, 0.13), "suelo": False})
    for _ in range(SUB):
        h = DT/SUB
        for q in parts:
            if q["suelo"]:
                q["v"] *= 0.95; q["p"] += q["v"]*h; continue
            q["v"].z += G*h; q["p"] += q["v"]*h
            if q["p"].z < q["r"]*0.35:
                q["p"].z = q["r"]*0.35
                if abs(q["v"].z) > 2.2 and random.random() < 0.35:
                    q["v"].z = -q["v"].z*0.25; q["r"] *= 0.7  # gotita que rebota
                else:
                    q["suelo"] = True; q["v"].z = 0
                    q["v"].x = q["v"].x*0.35 + random.uniform(-0.6, 0.6); q["v"].y = random.uniform(-0.8, 0.8)
    frames.append([(q["p"].copy(), q["r"], q["suelo"]) for q in parts])
for f, st in enumerate(frames):
    if ONLY is not None and f != ONLY: continue
    mb.elements.clear()
    for p, rad, s in st:
        e = mb.elements.new(); e.co = p; e.radius = rad*(1.25 if s else 1.0)
        if s: e.type = 'ELLIPSOID'; e.size_x = e.size_y = 1.9; e.size_z = 0.3
    sc.frame_set(f+1)
    r.filepath = os.path.join(OUT, f"f_{f:03d}.png")
    bpy.ops.render.render(write_still=True)
    print("FRAME", f, "elems", len(st), flush=True)
