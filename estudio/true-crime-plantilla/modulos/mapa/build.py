import json,sys
d=json.load(open(sys.argv[1])); m=open(sys.argv[2]).read(); t=open('template.tpl').read()
open('index.html','w').write(t.replace('/*MAP*/null',m).replace('/*DATA*/null',json.dumps(d,ensure_ascii=False)).replace('__DUR__',str(d['dur'])))
