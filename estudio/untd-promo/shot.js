const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await p.goto('https://www.untdkicks.com/es', { waitUntil: 'networkidle', timeout: 90000 }).catch(()=>{});
  await p.waitForTimeout(6000);
  const kill = async () => p.evaluate(() => {
    document.querySelectorAll('[role=dialog],[aria-modal=true],.klaviyo-form,[class*=popup],[class*=modal],[id*=popup],[class*=Popup]').forEach(e => { if (e.offsetHeight > 200 || getComputedStyle(e).position === 'fixed') e.remove(); });
    document.querySelectorAll('body *').forEach(e => { const s = getComputedStyle(e); if (s.position === 'fixed' && e.offsetHeight > 300) e.remove(); });
    document.body.style.overflow = 'auto';
    const walker=[...document.querySelectorAll('body *')].filter(e=>/club VIP/i.test(e.textContent)&&e.children.length<3);
    walker.forEach(e=>{let n=e;while(n.parentElement&&n.parentElement!==document.body)n=n.parentElement; if(!n.querySelector('main,#MainContent'))n.remove();});
    document.querySelectorAll('iframe').forEach(f=>{ if(f.offsetHeight>200 && !f.closest('main')) f.remove(); });
  });
  await kill();
  // scroll to load lazy images
  for (let y = 0; y < 9000; y += 600) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(250); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1500); await kill();
  await p.screenshot({ path: 'shots/top.png' });
  await p.screenshot({ path: 'shots/full.png', fullPage: true });
  await b.close();
})();
