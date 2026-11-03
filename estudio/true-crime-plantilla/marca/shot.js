const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:900},deviceScaleFactor:1});
await p.goto('file://'+process.cwd()+'/logos.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
for(let i=1;i<=6;i++) await p.locator('#c'+i).screenshot({path:`logo_0${i}.png`});await b.close()})();
