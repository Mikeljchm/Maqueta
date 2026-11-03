import json, math
LON0,LAT0=-72.95,-41.30; KX=111.32*math.cos(math.radians(LAT0)); KY=110.574
P=lambda lon,lat:(round((lon-LON0)*KX,3),round(-(lat-LAT0)*KY,3))
def simp(pts,tol):
    out=[pts[0]]
    for p in pts[1:-1]:
        if abs(p[0]-out[-1][0])+abs(p[1]-out[-1][1])>=tol: out.append(p)
    out.append(pts[-1]); return out
def d(pts,close=False): return 'M'+' L'.join(f'{x:.2f} {y:.2f}' if abs(x)>50 else f'{x:.3f} {y:.3f}' for x,y in pts)+(' Z' if close else '')
ne=json.load(open('ne_countries.geojson')); countries={}
for f in ne['features']:
    n=f['properties']['ADMIN']
    if n not in ('Chile','Argentina','Peru','Bolivia'): continue
    g=f['geometry']; polys=g['coordinates'] if g['type']=='MultiPolygon' else [g['coordinates']]
    paths=[]
    for poly in polys:
        ring=[P(*c) for c in poly[0]]
        if len(ring)<8: continue
        paths.append(d(simp(ring,1.5),True))
    countries[n]=' '.join(paths)
osm=json.load(open('osm.json'))['elements']
def stitch(ways):
    ways=[w[:] for w in ways if len(w)>1]; rings=[]
    while ways:
        r=ways.pop(0)
        changed=True
        while changed and r[0]!=r[-1]:
            changed=False
            for i,w in enumerate(ways):
                if w[0]==r[-1]: r+=w[1:]; ways.pop(i); changed=True; break
                if w[-1]==r[-1]: r+=w[::-1][1:]; ways.pop(i); changed=True; break
                if w[-1]==r[0]: r=w+r[1:]; ways.pop(i); changed=True; break
                if w[0]==r[0]: r=w[::-1]+r[1:]; ways.pop(i); changed=True; break
        rings.append(r)
    return rings
lakes=[]
for e in osm:
    if e['type']=='relation':
        outer=[[(n['lon'],n['lat']) for n in m['geometry']] for m in e.get('members',[]) if m.get('role')=='outer' and 'geometry' in m]
        for r in stitch(outer):
            pts=[P(*c) for c in r]
            if len(pts)>20: lakes.append(d(simp(pts,0.05),True))
    elif e['type']=='way' and e['tags'].get('natural')=='water':
        g=[P(n['lon'],n['lat']) for n in e['geometry']]
        xs=[p[0] for p in g]; ys=[p[1] for p in g]
        if (max(xs)-min(xs))*(max(ys)-min(ys))>0.3: lakes.append(d(simp(g,0.03),True))
roads={'major':[],'minor':[]}
r225=[]
for e in osm:
    if e['type']!='way' or 'highway' not in e['tags']: continue
    g=[P(n['lon'],n['lat']) for n in e['geometry']]
    k='major' if e['tags']['highway'] in ('motorway','trunk','primary') else 'minor'
    roads[k].append(d(simp(g,0.02)))
    if '225' in e['tags'].get('ref',''): r225+= [(n['lon'],n['lat']) for n in e['geometry']]
# ruta: Puerto Varas centro -> Parque Stocker
seg=sorted({p for p in r225 if -72.99<=p[0]<=-72.938 and -41.33<=p[1]<=-41.30},key=lambda p:p[0])
route=[P(*p) for p in seg]
places=[]
for e in osm:
    if e['type']=='node' and e['tags'].get('name'):
        places.append({'n':e['tags']['name'],'k':e['tags'].get('place') or e['tags'].get('natural'),'p':P(e['lon'],e['lat'])})
places.append({'n':'Parque Stocker','k':'target','p':P(-72.9397442,-41.3144822)})
places.append({'n':'Ensenada','k':'village','p':P(-72.5386691,-41.2081864)})
json.dump({'countries':countries,'lakes':lakes,'roads':roads,'route':d(route),'routeLen':len(route),'places':places},open('mapdata.json','w'),ensure_ascii=False)
import os; print('ok',os.path.getsize('mapdata.json')//1024,'KB','lagos',len(lakes),'rutas',len(roads['major']),len(roads['minor']),'ruta pts',len(route))
print([p for p in places if p['n'] in ('Puerto Varas','Parque Stocker','Volcán Osorno','Puerto Montt')])
