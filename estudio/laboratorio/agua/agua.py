import bpy, math, os, sys, time
from mathutils import Vector
D=os.path.dirname(os.path.abspath(__file__))
argv=sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
MODE=argv[0] if argv else "bake"; ONLY=[int(x) for x in argv[1:]] if len(argv)>1 else None
for o in list(bpy.data.objects): bpy.data.objects.remove(o,do_unlink=True)
sc=bpy.context.scene; S0=20; END=96; sc.frame_start=1; sc.frame_end=END
r=sc.render; r.engine='CYCLES'; r.resolution_x,r.resolution_y=540,960; r.fps=24
cy=sc.cycles; cy.samples=48; cy.use_denoising=True; cy.max_bounces=12; cy.transmission_bounces=12; cy.glossy_bounces=6; cy.caustics_reflective=False; cy.caustics_refractive=False
sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Punchy'
w=bpy.data.worlds.new("W"); sc.world=w; w.use_nodes=True; w.node_tree.nodes["Background"].inputs[0].default_value=(0.03,0.02,0.05,1)
def mat(n,c,ro=0.3,me=0.0):
    m=bpy.data.materials.new(n); m.use_nodes=True; b=m.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value=c; b.inputs["Roughness"].default_value=ro; b.inputs["Metallic"].default_value=me; return m
agua=bpy.data.materials.new("agua"); agua.use_nodes=True; b=agua.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value=(0.75,0.92,1,1); b.inputs["Transmission Weight"].default_value=1; b.inputs["IOR"].default_value=1.33; b.inputs["Roughness"].default_value=0.02
# piso y fondo (fondo degradado con franjas de color para que el agua refracte algo bonito)
bpy.ops.mesh.primitive_plane_add(size=40,location=(0,0,0)); bpy.context.object.data.materials.append(mat("piso",(0.04,0.03,0.07,1),0.12))
bpy.ops.mesh.primitive_plane_add(size=40,location=(0,4.5,10),rotation=(math.radians(90),0,0)); bk=bpy.context.object
bm=bpy.data.materials.new("fondo"); bm.use_nodes=True; nt=bm.node_tree; em=nt.nodes.new("ShaderNodeEmission"); tc=nt.nodes.new("ShaderNodeTexCoord"); wv=nt.nodes.new("ShaderNodeTexWave"); cr=nt.nodes.new("ShaderNodeValToRGB")
wv.inputs["Scale"].default_value=0.07; wv.inputs["Distortion"].default_value=2.0; wv.wave_type='BANDS'; cr.color_ramp.elements[0].color=(0.9,0.1,0.5,1); cr.color_ramp.elements[1].color=(0.15,0.25,1,1)
nt.links.new(tc.outputs["Object"],wv.inputs["Vector"]); nt.links.new(wv.outputs["Color"],cr.inputs["Fac"]); nt.links.new(cr.outputs["Color"],em.inputs["Color"]); em.inputs["Strength"].default_value=0.45
nt.links.new(em.outputs["Emission"],nt.nodes["Material Output"].inputs["Surface"]); bk.data.materials.append(bm)
# texto MIKEL (sera el agua inicial)
bpy.ops.object.text_add(); t=bpy.context.object; t.data.body="MIKEL"; t.data.size=2.0; t.data.extrude=0.38; t.data.bevel_depth=0.04; t.data.align_x='CENTER'
bpy.ops.object.convert(target='MESH'); t.rotation_euler=(math.radians(90),0,0); bpy.ops.object.transform_apply(rotation=True)
bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY',center='BOUNDS'); t.location=(0,0,t.dimensions.z/2+0.03)
t.data.materials.append(agua); print("TXT",tuple(round(x,2) for x in t.dimensions))
# dominio
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,1.6)); dom=bpy.context.object; dom.scale=(t.dimensions.x+2.4,3.2,3.2); bpy.ops.object.transform_apply(scale=True)
md=dom.modifiers.new("F",'FLUID'); md.fluid_type='DOMAIN'; ds=md.domain_settings; ds.domain_type='LIQUID'; ds.resolution_max=150; ds.use_mesh=True
ds.cache_directory=os.path.join(D,"cache"); ds.cache_type='ALL'; ds.cache_frame_start=S0; ds.cache_frame_end=END; ds.time_scale=0.8
ds.use_flip_particles=True if hasattr(ds,"use_flip_particles") else None
dom.data.materials.append(agua)
mf=t.modifiers.new("F",'FLUID'); mf.fluid_type='FLOW'; fs=mf.flow_settings; fs.flow_type='LIQUID'; fs.flow_behavior='GEOMETRY'; fs.use_initial_velocity=False
# visibilidad: texto quieto hasta S0-1, luego el agua simulada
for o,vis in ((t,[(1,False),(S0,True)]),(dom,[(1,True),(S0,False)])):
    for f,h in vis: o.hide_render=h; o.keyframe_insert("hide_render",frame=f)
# luces
def area(n,loc,c,p,s):
    d=bpy.data.lights.new(n,'AREA'); d.color=c; d.energy=p; d.size=s; o=bpy.data.objects.new(n,d); sc.collection.objects.link(o); o.location=loc
    o.rotation_euler=(Vector((0,0,0.8))-Vector(loc)).to_track_quat('-Z','Y').to_euler()
area("key",(-3,-5,6),(1,0.97,0.95),900,4); area("rimA",(5,2,2.5),(0.3,0.6,1),1600,3); area("rimB",(-5,2,2.5),(1,0.3,0.7),1600,3); area("top",(0,0,7),(1,1,1),400,6)
cd=bpy.data.cameras.new("cam"); cd.lens=34; cam=bpy.data.objects.new("cam",cd); sc.collection.objects.link(cam); sc.camera=cam
def aim(loc,tgt): cam.location=loc; cam.rotation_euler=(Vector(tgt)-Vector(loc)).to_track_quat('-Z','Y').to_euler()
aim((0,-11.5,2.6),(0,0,1.05)); cam.keyframe_insert("location",frame=1); cam.keyframe_insert("rotation_euler",frame=1)
aim((0.5,-10.2,1.9),(0,0,0.6)); cam.keyframe_insert("location",frame=END); cam.keyframe_insert("rotation_euler",frame=END)
if MODE=="bake":
    bpy.context.view_layer.objects.active=dom; t0=time.time(); res=bpy.ops.fluid.bake_all(); print("BAKE",res,round(time.time()-t0),"s",flush=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D,"agua.blend")); print("SAVED",flush=True)
else:
    for f in range(1,END+1):
        if ONLY and f not in ONLY: continue
        sc.frame_set(f); r.filepath=os.path.join(D,"frames","f_%03d.png"%f); bpy.ops.render.render(write_still=True); print("FRAME",f,flush=True)
