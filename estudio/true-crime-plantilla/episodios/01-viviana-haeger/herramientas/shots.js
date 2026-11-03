const {chromium}=require('playwright');const fs=require('fs');
const base='/home/user/Maqueta/estudio/true-crime-plantilla/';
const mods={analisis:16,cadena:14,capitulo:4.5,casa:15,cita:8,comentario:7,contadores:9,documento:11,evidencia:14,ficha:8,final:15,hora:9,recreacion:10,registro:11,tablero:12,timeline:16,tv:12,veredicto:12,versiones:13};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
const list=Object.entries(mods).map(([k,d])=>[k,base+'modulos/'+k+'/index.html',d]);list.push(['cerradura',base+'marca/animaciones/cerradura/index.html',10]);
for(const [k,f,d] of list){try{await p.goto('file://'+f,{waitUntil:'load',timeout:20000});await p.waitForTimeout(1200);
await p.evaluate(t=>{const T=window.__timelines||{};for(const n in T){T[n].pause();T[n].seek(t);} document.querySelectorAll('video').forEach(v=>{try{v.currentTime=t}catch(e){}})},d*0.72);
await p.waitForTimeout(500);await p.screenshot({path:process.argv[2]+'/'+k+'.png'});console.log(k)}catch(e){console.log(k,'ERR',e.message.slice(0,80))}}
await b.close()})();
