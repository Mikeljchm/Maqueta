import bpy, math, random, sys, os
from mathutils import Vector
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),"frames")
argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
ONLY=int(argv[0]) if argv else None
random.seed(3)
sc=bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o,do_unlink=True)
r=sc.render; r.engine='CYCLES'; r.resolution_x,r.resolution_y=540,960; r.fps=24
cy=sc.cycles; cy.samples=16; cy.use_denoising=True; cy.device='CPU'
sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Very High Contrast'
sc.frame_start=1; sc.frame_end=108
w=bpy.data.worlds.new("W"); sc.world=w; w.use_nodes=True; w.node_tree.nodes["Background"].inputs[0].default_value=(0.02,0.015,0.03,1)
def mat(name,col,rough=0.3,metal=0.0):
    m=bpy.data.materials.new(name); m.use_nodes=True; b=m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value=col; b.inputs["Roughness"].default_value=rough; b.inputs["Metallic"].default_value=metal; return m
# piso
bpy.ops.mesh.primitive_plane_add(size=40); fl=bpy.context.object; fl.data.materials.append(mat("piso",(0.06,0.04,0.08,1),0.25))
bpy.ops.rigidbody.object_add(); fl.rigid_body.type='PASSIVE'; fl.rigid_body.friction=0.8; fl.rigid_body.restitution=0.35
# pared de fondo
bpy.ops.mesh.primitive_plane_add(size=40,location=(0,6,10),rotation=(math.radians(90),0,0)); bpy.context.object.data.materials.append(mat("pared",(0.05,0.03,0.07,1),0.6))
cols=[(1,0.08,0.4,1),(1,0.65,0.05,1),(0.05,0.8,0.65,1),(0.45,0.2,1,1),(1,0.3,0.08,1)]
for i,ch in enumerate("MIKEL"):
    bpy.ops.object.text_add(location=(0,0,0)); t=bpy.context.object; t.data.body=ch; t.data.extrude=0.25; t.data.size=1.6; t.data.bevel_depth=0.03
    bpy.ops.object.convert(target='MESH'); t.rotation_euler=(math.radians(90),0,0); bpy.ops.object.transform_apply(rotation=True)
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY',center='BOUNDS'); t.location=(-2.6+i*1.3,0,t.dimensions.z/2+0.002)
    t.data.materials.append(mat("l%d"%i,cols[i],0.15,0.0))
    bpy.ops.rigidbody.object_add(); t.rigid_body.mass=1.2; t.rigid_body.collision_shape='CONVEX_HULL'; t.rigid_body.restitution=0.3; t.rigid_body.friction=0.6
# pared de cubitos detras
k=0
for row in range(4):
    for col in range(9):
        bpy.ops.mesh.primitive_cube_add(size=0.42,location=(-3.4+col*0.85+(row%2)*0.42,1.6,0.21+row*0.42)); c=bpy.context.object
        c.data.materials.append(mat("c%d"%k,cols[k%5],0.25,0.0)); k+=1
        bpy.ops.rigidbody.object_add(); c.rigid_body.mass=0.25; c.rigid_body.restitution=0.3; c.rigid_body.friction=0.7
# bola cromada: animada hasta el cuadro 30, luego queda libre con su velocidad
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.75,segments=48,ring_count=24,location=(-12,0.4,0.75)); b=bpy.context.object; bpy.ops.object.shade_smooth()
b.data.materials.append(mat("cromo",(0.95,0.95,1,1),0.05,1.0))
bpy.ops.rigidbody.object_add(); b.rigid_body.mass=9; b.rigid_body.collision_shape='SPHERE'; b.rigid_body.friction=0.3
# rampa (fuera de cuadro)
ang=math.radians(32); L=8.0
bpy.ops.mesh.primitive_cube_add(size=1,location=(-5-L*math.cos(ang)/2,0.3,L*math.sin(ang)/2-0.1)); rp=bpy.context.object; rp.scale=(L,1.6,0.2); rp.rotation_euler=(0,ang,0)
bpy.ops.object.transform_apply(scale=True); bpy.ops.rigidbody.object_add(); rp.rigid_body.type='PASSIVE'; rp.rigid_body.friction=0.5
rp.data.materials.append(mat("rampa",(0.05,0.03,0.07,1),0.6))
b.location=(-5-(L-0.8)*math.cos(ang),0.3,(L-0.8)*math.sin(ang)+0.9)
sc.rigidbody_world.substeps_per_frame=30; sc.rigidbody_world.point_cache.frame_end=108
# luces
def area(n,loc,col,p,s):
    d=bpy.data.lights.new(n,'AREA'); d.color=col; d.energy=p; d.size=s; o=bpy.data.objects.new(n,d); sc.collection.objects.link(o); o.location=loc
    o.rotation_euler=(Vector((0,0,1))-Vector(loc)).to_track_quat('-Z','Y').to_euler()
area("key",(-4,-5,7),(1,0.95,0.9),1200,4); area("rimR",(5,3,3),(1,0.2,0.5),1500,3); area("rimV",(-5,3,3),(0.5,0.3,1),1500,3)
cd=bpy.data.cameras.new("cam"); cd.lens=36; cam=bpy.data.objects.new("cam",cd); sc.collection.objects.link(cam); sc.camera=cam
cam.location=(0,-12,2.8); cam.rotation_euler=(Vector((0,0,1.15))-cam.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.ptcache.bake_all(bake=True)
for f in range(1,109):
    if ONLY and f!=ONLY: continue
    sc.frame_set(f); r.filepath=os.path.join(OUT,"f_%03d.png"%f); bpy.ops.render.render(write_still=True); print("FRAME",f,flush=True)
