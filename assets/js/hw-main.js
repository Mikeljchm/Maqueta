/* HOTT WRESTLING — hw-main.js */
/* ── Utilidades globales ── */
function $(id) { return document.getElementById(id); }
function fmt(n) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n); }
let _toastTimer;
function toast(msg) {
  const t = document.getElementById('toast'); if(!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}
const SB_URL = ''; const SB_KEY = '';
async function sbFetch(path, method, body) {
  if (!SB_URL) return null;
  const opts = { method: method||'GET', headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer '+SB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' } };
  if (body) opts.body = JSON.stringify(body);
  try { const r = await fetch(SB_URL+'/rest/v1/'+path, opts); if(!r.ok) return null; const tx = await r.text(); return tx ? JSON.parse(tx) : null; } catch(e) { return null; }
}

  (function() {
    const ageKey = 'hw_age_ok';
    function $(id) { return document.getElementById(id); }

    function showApp() {
      const ag = $('age-gate');
      const app = $('app');
      if (ag) { ag.classList.remove('visible'); ag.classList.add('hidden'); }
      if (app) { app.style.display = 'flex'; app.classList.add('visible'); }
      try { initApp(); } catch(e) { console.warn('initApp:', e); }
    }

    if (localStorage.getItem(ageKey)) {
      showApp();
    } else {
      const ag = $('age-gate');
      if (ag) ag.classList.add('visible');
      const btn = $('ag-enter');
      const leave = $('ag-leave');
      if (btn) btn.addEventListener('click', () => { localStorage.setItem(ageKey,'1'); showApp(); });
      if (leave) leave.addEventListener('click', () => { window.location.href = 'https://www.google.com'; });
    }

    window._showApp = showApp;
  })();

  (function() {
    'use strict';


    /* PWA FIX — nav disappears when returning from post */
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const app = document.getElementById('app');
        const nav = document.querySelector('.bottom-nav');
        if (app) app.style.display = 'flex';
        if (nav) nav.style.display = 'flex';
      }
    });
    window.addEventListener('pageshow', (e) => {
      const app = document.getElementById('app');
      const nav = document.querySelector('.bottom-nav');
      if (app) app.style.display = 'flex';
      if (nav) nav.style.display = 'flex';
    });

    /* NAV — outside initApp so it always works */
    document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.page;
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const pg = document.getElementById('page-' + id);
        if (pg) pg.classList.add('active');
        // Show strip only on home, hide on all other sections
        var strip = document.getElementById('top-strip');
        var fab = document.getElementById('new-post-fab');
        if (id === 'home') {
          if (strip) { strip.style.display = 'block'; strip.style.transform = 'translateY(0)'; }
          if (fab) fab.style.display = '';
        } else {
          if (strip) strip.style.display = 'none';
          if (fab) fab.style.display = 'none';
        }
        /* Reset home feed when going back to home */
        if (id === 'home') {
          currentCat = 'all';
          visibleCount = POSTS_PER_PAGE;
          document.querySelectorAll('.cat-pill[data-cat]').forEach(b => b.classList.remove('active'));
          const allPill = document.querySelector('.cat-pill[data-cat="all"]');
          if (allPill) allPill.classList.add('active');
          renderFeed();
        }
      });
    });

    document.querySelectorAll('.menu-item[data-nav]').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.nav;
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const navBtn = document.querySelector('.nav-item[data-page="'+id+'"]');
        if (navBtn) navBtn.classList.add('active');
        const pg = document.getElementById('page-' + id);
        if (pg) pg.classList.add('active');
        var strip = document.getElementById('top-strip');
        if (strip) strip.style.display = 'none';
      });
    });

    /* WRESTLER CATEGORY PILLS — outside initApp */
    document.querySelectorAll('.cat-pill[data-wcat]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill[data-wcat]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.wcat;
        document.querySelectorAll('.wrestler-card[data-wtag]').forEach(card => {
          card.style.display = (cat === 'all' || card.dataset.wtag === cat) ? '' : 'none';
        });
      });
    });

    /* STUD CATEGORY PILLS — outside initApp */
    document.querySelectorAll('.cat-pill[data-scat]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill[data-scat]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.scat;
        document.querySelectorAll('.badboy-card[data-scat]').forEach(card => {
          card.style.display = (cat === 'all' || card.dataset.scat === cat) ? '' : 'none';
        });
      });
    });

    /* BULGE SPORT PILLS — outside initApp */
    document.querySelectorAll('.cat-pill[data-bcat]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill[data-bcat]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sport = btn.dataset.bcat;
        document.querySelectorAll('.wrestler-card[data-bsport]').forEach(card => {
          card.style.display = (sport === 'all' || card.dataset.bsport === sport) ? '' : 'none';
        });
      });
    });

    /* CATEGORY PILLS — outside initApp so always works */
    const POSTS_PER_PAGE = 12;
    let currentCat = 'all';
    let visibleCount = POSTS_PER_PAGE;

    function getFilteredCards() {
      return Array.from(document.querySelectorAll('.post-card')).filter(card => {
        return currentCat === 'all' || card.dataset.cat === currentCat;
      });
    }

    function renderFeed() {
      const filtered = getFilteredCards();
      const allCards = document.querySelectorAll('.post-card');
      allCards.forEach(c => c.style.display = 'none');
      filtered.forEach((card, i) => {
        card.style.display = i < visibleCount ? '' : 'none';
      });
      const btn = document.getElementById('load-more-btn');
      if (btn) btn.style.display = filtered.length > visibleCount ? '' : 'none';
    }

    document.querySelectorAll('.cat-pill[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-pill[data-cat]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCat = btn.dataset.cat;
        visibleCount = POSTS_PER_PAGE;
        renderFeed();
      });
    });

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        visibleCount += POSTS_PER_PAGE;
        renderFeed();
      });
    }

    /* Init feed on load */
    renderFeed();

    /* Skeleton loader — quita el shimmer cuando la imagen carga */
    document.querySelectorAll('.card-media-wrap img').forEach(img => {
      if(img.complete) {
        img.closest('.card-media-wrap').style.setProperty('--skeleton','none');
      } else {
        img.addEventListener('load', function() {
          this.closest('.card-media-wrap').style.setProperty('--skeleton','none');
          this.closest('.card-media-wrap').style.background='#000';
        });
      }
    });

    /* RESTORE NAV ON BACK NAVIGATION — also fixes PWA */
    function restoreNav(){
      var nav = document.querySelector('.bottom-nav');
      if(nav){ nav.classList.remove('hidden'); nav.style.transform = 'translateY(0)'; }
      var strip = document.getElementById('top-strip');
      if(strip){ strip.style.transform = 'translateY(0)'; }
    }
    // Only restore on actual back navigation (persisted = from bfcache)
    window.addEventListener('pageshow', function(e){
      if(e.persisted) restoreNav();
    });
    // PWA — only when coming from background (hidden -> visible)
    var wasHidden = false;
    document.addEventListener('visibilitychange', function(){
      if(document.visibilityState === 'hidden'){ wasHidden = true; }
      else if(wasHidden){ wasHidden = false; restoreNav(); }
    });

    /* HIDE ON SCROLL — top-strip completo */
    (function(){
      var strip = document.getElementById('top-strip');
      var lastY = 0;
      var ticking = false;
      var stripH = 0;
      var offsetY = 0;
      var scrollEl = document.getElementById('page-home');
      if(!strip) return;
      if(!scrollEl){ setTimeout(function(){ setStripOffset(); }, 300); return; }

      function setStripOffset(){
        stripH = strip.offsetHeight || 92;
        var home = document.getElementById('page-home');
        if(home) home.style.paddingTop = stripH + 'px';
      }
      // Wait for strip to fully render
      setTimeout(function(){ setStripOffset(); }, 100);
      window.addEventListener('resize', setStripOffset);

      // Nav hide on scroll
      var nav = document.querySelector('.bottom-nav');
      var lastNavY = 0;
      var navTicking = false;
      document.querySelectorAll('.page').forEach(function(pg){
        pg.addEventListener('scroll', function(){
          if(!navTicking){
            requestAnimationFrame(function(){
              var y = pg.scrollTop;
              if(y > lastNavY && y > 80){
                if(nav) nav.style.transform = 'translateY(100%)';
              } else {
                if(nav) nav.style.transform = 'translateY(0)';
              }
              lastNavY = y;
              navTicking = false;
            });
            navTicking = true;
          }
        }, {passive:true});
      });

      scrollEl.addEventListener('scroll', function(){
        if(!ticking){
          requestAnimationFrame(function(){
            var y = scrollEl.scrollTop;
            var dy = y - lastY;
            // Move strip with scroll — clamp between -stripH (hidden) and 0 (visible)
            offsetY = Math.min(0, Math.max(-stripH, offsetY - dy));
            strip.style.transform = 'translateY(' + offsetY + 'px)';
            scrollEl.style.paddingTop = Math.max(0, stripH + offsetY) + 'px';
            lastY = y;
            ticking = false;
          });
          ticking = true;
        }
      }, {passive:true});
    })();

    /* LR CATEGORY PILLS — outside initApp */
    document.querySelectorAll('.lr-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.lr-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.lcat;
        document.querySelectorAll('.lr-card').forEach(card => {
          card.style.display = (cat === 'all' || card.dataset.lcat === cat) ? '' : 'none';
        });
      });
    });

    /* LR CARDS — make visible and clickable outside initApp */
    document.querySelectorAll('.lr-card').forEach(card => {
      card.style.opacity = '1';
      card.style.transform = 'none';
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.storyIdx);
        if (typeof window.openLRStory === 'function') window.openLRStory(idx, 0);
      });
    });

    /* Pre-register LR functions as globals */
    window.openLRStory = function(idx, chap, auto) {
      if (window._openLRStoryImpl) window._openLRStoryImpl(idx, chap, auto);
    };
    window.closeLRReader = function() {
      if (window._closeLRReaderImpl) window._closeLRReaderImpl();
    };

    window.initApp = function initApp() {

      /* CATEGORY PILLS — moved outside initApp */

      /* READ MORE */
      document.querySelectorAll('.card-read-more').forEach(btn => {
        btn.addEventListener('click', () => {
          const desc = document.getElementById(btn.dataset.desc);
          if (!desc) return;
          if (desc.classList.contains('collapsed')) { desc.classList.remove('collapsed'); btn.textContent = 'less'; }
          else { desc.classList.add('collapsed'); btn.textContent = 'more'; }
        });
      });

      /* likes/comments — CF KV pendiente */

      /* LIKES — handled by independent IIFE below initApp */

      /* SAVE — handled by independent IIFE below initApp */

      /* SHARE */
      document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const url = btn.dataset.url || location.href;
          if (navigator.share) { try { await navigator.share({ url, title:'HOTT WRESTLING' }); } catch(e){} }
          else { await navigator.clipboard.writeText(url).catch(()=>{}); toast('Link copied!'); }
        });
      });

      /* COMMENTS — Supabase */
      async function loadComments(postId, listEl, countBtn) {
        const data = await sbFetch('comments?post_id=eq.' + encodeURIComponent(postId) + '&order=created_at.asc&select=text');
        if (data) {
          listEl.innerHTML = '';
          data.forEach(row => addComment(listEl, row.text, false));
          if (countBtn) countBtn.querySelector('.comment-count').textContent = data.length || 0;
        }
      }

      function addComment(list, text, animate) {
        const div = document.createElement('div'); div.className = 'comment-item';
        div.innerHTML = '<div class="comment-av">HW</div><div class="comment-text">' + text + '</div>';
        if (animate) { div.style.cssText='opacity:0;transform:translateY(5px);transition:all 0.3s'; requestAnimationFrame(()=>{ div.style.opacity='1'; div.style.transform='translateY(0)'; }); }
        list.appendChild(div);
      }

      /* PHOTO VIEWER */
      let viewerImgs = [], viewerIdx = 0, viewerPostId = null;
      let scale = 1, pinchDist = 0, pinchScale = 1, swipeSx = 0;

      function openViewer(imgs, startIdx, postId, desc) {
        viewerImgs = imgs; viewerIdx = startIdx || 0; viewerPostId = postId;
        const track = $('viewer-track');
        track.innerHTML = '';
        imgs.forEach(src => {
          const slide = document.createElement('div'); slide.className = 'viewer-slide';
          const img = document.createElement('img'); img.src = src; img.alt = '';
          slide.appendChild(img); track.appendChild(slide);
        });
        updateSlide(false);
        $('viewer-desc').innerHTML = (desc || '').replace(/#(\w+)/g,'<span class="htag">#$1</span>');
        $('photo-viewer').classList.add('open');
        document.body.style.overflow = 'hidden';
        const id = String(postId);
        $('viewer-like').classList.toggle('liked', liked.has(id));
        $('viewer-like-count').textContent = fmt(likes[id] || 0);
      }

      function updateSlide(animate) {
        const track = $('viewer-track');
        const w = window.innerWidth;
        track.style.transition = animate ? 'transform 0.32s cubic-bezier(0.16,1,0.3,1)' : 'none';
        track.style.transform = 'translateX(-' + (viewerIdx * w) + 'px)';
        $('viewer-counter').textContent = (viewerIdx+1) + ' / ' + viewerImgs.length;
        scale = 1;
        track.querySelectorAll('img').forEach(i => { i.style.transition=''; i.style.transform='scale(1)'; });
      }

      function closeViewer() { $('photo-viewer').classList.remove('open'); document.body.style.overflow = ''; }
      if($('viewer-back'))$('viewer-back').addEventListener('click', closeViewer);

      /* Open viewer on photo tap — uses actual card classes */
      document.querySelectorAll('.post-card').forEach(card => {
        const postId = card.querySelector('.like-btn')?.dataset.id;
        const desc = card.querySelector('.card-desc')?.textContent || '';
        const imgs = Array.from(card.querySelectorAll('.card-media-wrap img, .card-first-photo'))
          .map(im => im.src).filter(Boolean);
        if (!imgs.length) return;
        card.querySelectorAll('.card-media-wrap img, .card-first-photo').forEach((img, i) => {
          img.style.cursor = 'pointer';
          img.addEventListener('click', e => {
            e.preventDefault();
            openViewer(imgs, i, postId, desc);
          });
        });
      });

      /* Viewer like — delegates to feed like-btn via click */
      if($('viewer-like'))$('viewer-like').addEventListener('click', () => {
        if (!viewerPostId) return;
        const feedBtn = document.querySelector('.like-btn[data-id="'+viewerPostId+'"]');
        if (feedBtn) feedBtn.click();
        else $('viewer-like').classList.toggle('liked');
      });

      if($('viewer-save'))$('viewer-save').addEventListener('click', () => {
        if (!viewerPostId) return;
        const feedBtn = document.querySelector('.save-btn[data-id="'+viewerPostId+'"]');
        if (feedBtn) feedBtn.click();
      });

      /* Double tap to like */
      let lastTap = 0;
      if($('viewer-photo-wrap'))$('viewer-photo-wrap').addEventListener('touchend', e => {
        if (e.touches.length > 0) return;
        const now = Date.now();
        if (now - lastTap < 320) {
          if (viewerPostId && !liked.has(String(viewerPostId))) $('viewer-like').click();
          const h = $('viewer-heart');
          h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop');
          setTimeout(() => h.classList.remove('pop'), 700);
          e.preventDefault();
        }
        lastTap = now;
      });

      /* Swipe down to close */
      let vsy = 0;
      $('photo-viewer').addEventListener('touchstart', e => { if(e.touches.length===1) vsy=e.touches[0].clientY; },{passive:true});
      $('photo-viewer').addEventListener('touchend', e => { if(e.changedTouches[0].clientY - vsy > 110) closeViewer(); });

      /* Pinch zoom */
      const wrap = $('viewer-photo-wrap');
      wrap.addEventListener('touchstart', e => {
        if (e.touches.length===2) { pinchDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); pinchScale=scale; e.preventDefault(); }
        else { swipeSx=e.touches[0].clientX; }
      },{passive:false});
      wrap.addEventListener('touchmove', e => {
        if (e.touches.length===2) { e.preventDefault(); const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY); scale=Math.max(1,Math.min(4,pinchScale*(d/pinchDist))); const img=$('viewer-track').querySelectorAll('img')[viewerIdx]; if(img) img.style.transform='scale('+scale+')'; }
      },{passive:false});
      wrap.addEventListener('touchend', e => {
        if (scale<=1.1) {
          scale=1;
          const img=$('viewer-track').querySelectorAll('img')[viewerIdx];
          if(img){img.style.transition='transform 0.3s';img.style.transform='scale(1)';setTimeout(()=>img.style.transition='',300);}
          const dx=e.changedTouches[0].clientX-swipeSx;
          if(Math.abs(dx)>50){
            if(dx<0&&viewerIdx<viewerImgs.length-1)viewerIdx++;
            else if(dx>0&&viewerIdx>0)viewerIdx--;
            updateSlide(true);
          }
        }
      });

      /* SEARCH */
      const allPosts = [];
      document.querySelectorAll('.post-card').forEach(card => {
        const img = card.querySelector('.card-media-wrap img, .card-first-photo');
        const desc = card.querySelector('.card-desc');
        const title = card.querySelector('.card-title');
        const cat = card.dataset.cat || '';
        const id = card.querySelector('.like-btn')?.dataset.id;
        const url = card.querySelector('.card-title a')?.href || '#';
        if (img) allPosts.push({ img:img.src, desc:desc?desc.textContent:'', title:title?title.textContent:'', cat, id, url });
      });

      if($('search-input'))$('search-input').addEventListener('input', e => {
        const q = e.target.value.toLowerCase().trim();
        const grid = $('search-grid'); grid.innerHTML = '';
        if (!q) return;
        allPosts.filter(p => p.desc.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q)).slice(0,9).forEach(p => {
          const div = document.createElement('div'); div.className = 'grid-thumb';
          div.innerHTML = '<img src="'+p.img+'" loading="lazy"><span class="grid-thumb-cat">'+p.cat+'</span>';
          div.addEventListener('click', () => openViewer([p.img],0,p.id,''));
          grid.appendChild(div);
        });
      });

      document.querySelectorAll('.search-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          $('search-input').value = tag.textContent;
          $('search-input').dispatchEvent(new Event('input'));
        });
      });

      /* CARD ENTRANCE — staggered cascade */
      const cardObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const card = e.target;
            const delay = Math.min(parseInt(card.dataset.idx || 0) * 70, 350);
            setTimeout(() => card.classList.add('visible'), delay);
            cardObs.unobserve(card);
          }
        });
      },{ threshold:0.06, rootMargin:'0px 0px -30px 0px' });
      document.querySelectorAll('.post-card').forEach(card => {
        card.classList.add('animate');
        cardObs.observe(card);
      });

      /* REVEAL */
      const revObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('visible');revObs.unobserve(e.target);} });
      },{ threshold:0.1 });
      document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

      /* MINI PLAYER */
      if($('mini-play-btn'))$('mini-play-btn').addEventListener('click', () => {
        const btn = $('mini-play-btn');
        const isPlaying = btn.innerHTML.includes('rect');
        btn.innerHTML = isPlaying ? '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>' : '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
      });
      if($('mini-close-btn'))$('mini-close-btn').addEventListener('click', () => { if($('mini-player'))$('mini-player').classList.remove('visible'); });

      /* PWA */
      let deferredPWA;
      window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPWA = e; $('pwa-install-btn').classList.add('visible'); });
      if($('pwa-install-btn'))$('pwa-install-btn').addEventListener('click', async () => {
        if (!deferredPWA) return;
        deferredPWA.prompt();
        const { outcome } = await deferredPWA.userChoice;
        if (outcome==='accepted') toast('App installed!');
        deferredPWA = null; $('pwa-install-btn').classList.remove('visible');
      });

      /* ── LOCKER ROOM — LR_STORIES filled here then shared globally ── */
      window.LR_STORIES = [];
      document.querySelectorAll('.lr-card[data-story-idx]').forEach(card => {
        const idx = parseInt(card.dataset.storyIdx);
        try {
          const storyData = JSON.parse(card.dataset.storyJson || '{}');
          window.LR_STORIES[idx] = storyData;
        } catch(e) {}
      });

    } /* end initApp */

  })();

  (function() {

    /* LIKES */
    const likedKey = 'hw_liked_v2';
    let liked = new Set(JSON.parse(localStorage.getItem(likedKey)||'[]'));
    let likes = {};

    async function loadAllLikes() {
      const data = await sbFetch('likes?select=post_id,count');
      if (data) { data.forEach(r => { likes[r.post_id] = r.count || 0; }); }
      document.querySelectorAll('.like-btn[data-id]').forEach(btn => {
        const id = btn.dataset.id;
        if (!id || id.includes('{')) return;
        const countEl = btn.querySelector('.like-count');
        if (countEl) countEl.textContent = fmt(likes[id]||0);
        if (liked.has(id)) btn.classList.add('liked');
      });
    }

    async function toggleLike(id) {
      if (!id || id.includes('{')) return;
      const wasLiked = liked.has(id);
      if (wasLiked) { liked.delete(id); } else { liked.add(id); }
      localStorage.setItem(likedKey, JSON.stringify([...liked]));
      const newCount = Math.max(0, (likes[id]||0) + (wasLiked ? -1 : 1));
      likes[id] = newCount;
      document.querySelectorAll('.like-btn[data-id="'+id+'"]').forEach(btn => {
        btn.classList.toggle('liked', !wasLiked);
        const countEl = btn.querySelector('.like-count');
        if (countEl) countEl.textContent = fmt(newCount);
      });
      const existing = await sbFetch('likes?post_id=eq.'+encodeURIComponent(id)+'&select=id');
      if (existing && existing.length > 0) { await sbFetch('likes?post_id=eq.'+encodeURIComponent(id), 'PATCH', {count:newCount}); }
      else { await sbFetch('likes', 'POST', {post_id:id, count:newCount}); }
    }

    document.querySelectorAll('.like-btn[data-id]').forEach(btn => {
      if (btn.dataset.id && !btn.dataset.id.includes('{'))
        btn.addEventListener('click', () => toggleLike(btn.dataset.id));
    });
    loadAllLikes();

    /* SAVE */
    const savedKey = 'hw_saved';
    let savedIds = new Set(JSON.parse(localStorage.getItem(savedKey)||'[]'));

    function renderSavedGrid() {
      const grid = $('saved-grid'); if (!grid) return;
      if (savedIds.size === 0) {
        grid.innerHTML = '<div class="saved-empty" style="grid-column:1/-1;text-align:center;padding:1.5rem;color:#6e6e6e;font-size:0.82rem;">Nothing saved yet. Tap the bookmark on any post.</div>';
        return;
      }
      grid.innerHTML = '';
      document.querySelectorAll('.post-card').forEach(card => {
        const saveBtn = card.querySelector('.save-btn');
        const id = saveBtn?.dataset.id;
        if (!id || !savedIds.has(id)) return;
        const img = card.querySelector('.card-media-wrap img, .card-first-photo');
        const url = card.querySelector('.card-title a')?.href || '#';
        if (!img) return;
        const a = document.createElement('a');
        a.href = url;
        a.style.cssText = 'display:block;aspect-ratio:1;overflow:hidden;background:#111;border-radius:4px;';
        const i = document.createElement('img');
        i.src = img.src;
        i.style.cssText = 'width:100%;height:100%;object-fit:cover;';
        a.appendChild(i); grid.appendChild(a);
      });
      if (grid.children.length === 0) {
        grid.innerHTML = '<div class="saved-empty" style="grid-column:1/-1;text-align:center;padding:1.5rem;color:#6e6e6e;font-size:0.82rem;">Nothing saved yet.</div>';
      }
    }

    document.querySelectorAll('.save-btn[data-id]').forEach(btn => {
      const id = btn.dataset.id;
      if (!id || id.includes('{')) return;
      if (savedIds.has(id)) btn.classList.add('saved');
      btn.addEventListener('click', () => {
        if (savedIds.has(id)) { savedIds.delete(id); toast('Removed'); }
        else { savedIds.add(id); toast('Saved!'); }
        btn.classList.toggle('saved', savedIds.has(id));
        localStorage.setItem(savedKey, JSON.stringify([...savedIds]));
        renderSavedGrid();
      });
    });

    /* Render saved when navigating to More */
    document.querySelectorAll('.nav-item[data-page="more"]').forEach(btn => {
      btn.addEventListener('click', renderSavedGrid);
    });
    document.querySelectorAll('.menu-item[data-nav]').forEach(item => {
      item.addEventListener('click', () => {
        const target = item.dataset.nav;
        document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const navBtn = document.querySelector('.nav-item[data-page="'+target+'"]');
        const pg = document.getElementById('page-'+target);
        if (navBtn) navBtn.classList.add('active');
        if (pg) pg.classList.add('active');
      });
    });

    /* SHARE */
    document.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const url = btn.dataset.url || location.href;
        if (navigator.share) { try { await navigator.share({url, title:'HOTT WRESTLING'}); } catch(e){} }
        else { await navigator.clipboard.writeText(url).catch(()=>{}); toast('Link copied!'); }
      });
    });

    /* COMMENTS */
    async function loadComments(postId, listEl, countBtn) {
      const data = await sbFetch('comments?post_id=eq.'+encodeURIComponent(postId)+'&order=created_at.asc&select=text');
      if (data) {
        listEl.innerHTML = '';
        data.forEach(row => addComment(listEl, row.text, false));
        if (countBtn) { const c = countBtn.querySelector('.comment-count'); if(c) c.textContent = data.length||0; }
      }
    }

    function addComment(list, text, animate) {
      const div = document.createElement('div'); div.className = 'comment-item';
      div.innerHTML = '<div class="comment-av">HW</div><div class="comment-text">'+text+'</div>';
      if (animate) { div.style.cssText='opacity:0;transform:translateY(5px);transition:all 0.3s'; requestAnimationFrame(()=>{ div.style.opacity='1'; div.style.transform='translateY(0)'; }); }
      list.appendChild(div);
    }

    document.querySelectorAll('.comment-toggle-btn[data-id]').forEach(btn => {
      const id = btn.dataset.id;
      if (!id || id.includes('{')) return;
      const section = $('comments-'+id);
      const listEl = $('clist-'+id);
      if (!section || !listEl) return;
      loadComments(id, listEl, btn);
      btn.addEventListener('click', () => section.classList.toggle('open'));
      const input = section.querySelector('.comment-field[data-id="'+id+'"]');
      const send = section.querySelector('.comment-send[data-id="'+id+'"]');
      if (!input || !send) return;
      async function postComment() {
        const text = input.value.trim(); if (!text) return;
        input.value = '';
        addComment(listEl, text, true);
        await sbFetch('comments', 'POST', {post_id:id, text});
        const data = await sbFetch('comments?post_id=eq.'+encodeURIComponent(id)+'&select=id');
        if (data) { const c = btn.querySelector('.comment-count'); if(c) c.textContent = data.length; }
        toast('Posted!');
      }
      send.addEventListener('click', postComment);
      input.addEventListener('keydown', e => { if(e.key==='Enter') postComment(); });
    });

  })();

  (function() {


    /* Fill LR_STORIES here too — works even if initApp crashed */
    if (!window.LR_STORIES || window.LR_STORIES.length === 0) {
      window.LR_STORIES = [];
      document.querySelectorAll('.lr-card[data-story-idx]').forEach(card => {
        const idx = parseInt(card.dataset.storyIdx);
        try {
          const storyData = JSON.parse(card.dataset.storyJson || '{}');
          window.LR_STORIES[idx] = storyData;
        } catch(e) { console.warn('LR story parse error:', e); }
      });
    }
    let lrCurrentStory = null;
    let lrCurrentLang = null;
    let lrCurrentChapter = 0;
    let lrTTSPlaying = false;
    let lrTTSUtterance = null;
    let lrTTSSpeed = 1;
    let lrTTSKeepAlive = null;

    /* Category filter */
    document.querySelectorAll('.lr-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.lr-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.lcat;
        document.querySelectorAll('.lr-card').forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.lcat === cat) ? '' : 'none';
        });
      });
    });

    /* Open story reader */
    function openLRStory(storyIdx, chapterIdx, autoPlay) {
      const story = window.LR_STORIES[storyIdx];
      if (!story) { console.warn('Story not found:', storyIdx, window.LR_STORIES); return; }
      lrCurrentStory = story;
      lrCurrentChapter = chapterIdx || 0;
      stopLRTTS();

      // Determine language — use saved preference or first available
      const savedLang = localStorage.getItem('hw_lr_lang');
      const langs = story.languages || [];
      if (savedLang && langs.find(l => l.code === savedLang)) {
        lrCurrentLang = savedLang;
      } else if (langs.length > 0) {
        lrCurrentLang = langs[0].code;
      } else {
        lrCurrentLang = 'en';
      }

      renderLRReader(story, lrCurrentLang, lrCurrentChapter);
      document.getElementById('lr-reader').classList.add('open');
      document.body.style.overflow = 'hidden';
      document.getElementById('lr-reader-scroll').scrollTop = 0;

      // Load comments
      loadLRComments(story.slug);

      if (autoPlay) setTimeout(startLRTTS, 500);
    }

    function renderLRReader(story, langCode, chapterIdx) {
      const langs = story.languages || [];
      const langData = langs.find(l => l.code === langCode) || langs[0];
      const chapters = langData ? (langData.chapters || []) : [];
      const chapter = chapters[chapterIdx] || chapters[0] || { title: story.title, content: '' };

      document.getElementById('lr-reader-title-sm').textContent = story.title;
      document.getElementById('lr-tts-status').textContent = 'Listen to this story';
      updateLRTTSIcon(false);

      let html = '';
      if (story.cover) html += `<img class="lr-reader-cover" src="${story.cover}" alt="${story.title}" loading="lazy">`;
      html += `<div class="lr-reader-body">`;
      html += `<div class="lr-reader-cat">${story.category}</div>`;
      html += `<div class="lr-reader-title">${story.title}</div>`;
      html += `<div class="lr-reader-meta"><span>${story.read_time}</span>`;

      // Language switcher inline
      if (langs.length > 1) {
        html += `<span style="margin-left:auto;display:flex;gap:0.3rem;">`;
        langs.forEach(l => {
        const active = l.code === langCode ? 'style="color:var(--fire-orange);border-color:rgba(255,69,0,0.4)"' : '';
        html += `<button onclick="switchLRLang('${l.code}')" style="background:none;border:1px solid var(--border);border-radius:4px;padding:0.15rem 0.4rem;font-size:0.55rem;color:var(--text-muted);cursor:pointer;font-weight:700;" ${active}>${l.code.toUpperCase()}</button>`;
        });
        html += `</span>`;
      }

      html += `</div>`;

      // Chapter title
      if (chapters.length > 1) {
        html += `<div class="lr-chapter-title">${chapter.title || 'Chapter ' + (chapterIdx + 1)}</div>`;
      }

      // Content — split into paragraphs
      const paragraphs = (chapter.content || '').split(/\n+/).filter(p => p.trim());
      html += `<div class="lr-reader-text" id="lr-reader-text">`;
      paragraphs.forEach(p => { html += `<p>${p.trim()}</p>`; });
      html += `</div></div>`;

      document.getElementById('lr-reader-content').innerHTML = html;

      // Chapter navigation
      const navEl = document.getElementById('lr-chapter-nav');
      if (chapters.length > 1) {
        let navHtml = '';
        if (chapterIdx > 0) {
        navHtml += `<button class="lr-chapter-btn" onclick="goLRChapter(${chapterIdx - 1})">&#8592; Previous</button>`;
        } else { navHtml += `<span></span>`; }
        navHtml += `<span class="lr-chapter-counter">${chapterIdx + 1} / ${chapters.length}</span>`;
        if (chapterIdx < chapters.length - 1) {
        navHtml += `<button class="lr-chapter-btn primary" onclick="goLRChapter(${chapterIdx + 1})">Next &#8594;</button>`;
        } else { navHtml += `<span></span>`; }
        navEl.innerHTML = navHtml;
        navEl.style.display = 'flex';
      } else {
        navEl.style.display = 'none';
      }
    }

    function goLRChapter(idx) {
      lrCurrentChapter = idx;
      stopLRTTS();
      renderLRReader(lrCurrentStory, lrCurrentLang, idx);
      document.getElementById('lr-reader-scroll').scrollTop = 0;
    }

    function switchLRLang(code) {
      lrCurrentLang = code;
      localStorage.setItem('hw_lr_lang', code);
      stopLRTTS();
      renderLRReader(lrCurrentStory, code, lrCurrentChapter);
      document.getElementById('lr-reader-scroll').scrollTop = 0;
    }

    function closeLRReader() {
      stopLRTTS();
      document.getElementById('lr-reader').classList.remove('open');
      document.body.style.overflow = '';
      lrCurrentStory = null;
    }

    /* TTS — chunk-based for Android reliability */
    function toggleLRTTS() {
      if (lrTTSPlaying) { pauseLRTTS(); } else { startLRTTS(); }
    }

    function startLRTTS() {
      if (!('speechSynthesis' in window)) { toast('TTS not supported'); return; }
      const textEl = document.getElementById('lr-reader-text');
      if (!textEl) return;
      stopLRTTS();

      const fullText = textEl.innerText.trim();
      if (!fullText) return;

      /* Split into sentences — Android handles short chunks reliably */
      const chunks = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
      let chunkIdx = 0;

      function speakNext() {
        if (chunkIdx >= chunks.length) {
        lrTTSPlaying = false;
        document.getElementById('lr-tts-status').textContent = 'Finished';
        updateLRTTSIcon(false);
        return;
        }
        const chunk = chunks[chunkIdx].trim();
        if (!chunk) { chunkIdx++; speakNext(); return; }

        const utt = new SpeechSynthesisUtterance(chunk);
        utt.rate = lrTTSSpeed;
        utt.lang = lrCurrentLang || 'en-US';
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find(v => v.lang.startsWith(lrCurrentLang || 'en'));
        if (match) utt.voice = match;
        utt.onend = () => { chunkIdx++; speakNext(); };
        utt.onerror = (e) => { if (e.error !== 'interrupted') { chunkIdx++; speakNext(); } };
        lrTTSUtterance = utt;
        window.speechSynthesis.speak(utt);
      }

      function doSpeak() {
        window.speechSynthesis.cancel();
        lrTTSPlaying = true;
        chunkIdx = 0;
        document.getElementById('lr-tts-status').textContent = 'Reading aloud...';
        updateLRTTSIcon(true);
        setTimeout(speakNext, 200);
      }

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) { doSpeak(); }
      else { window.speechSynthesis.onvoiceschanged = doSpeak; setTimeout(doSpeak, 800); }
    }

    function pauseLRTTS() {
      window.speechSynthesis.pause();
      lrTTSPlaying = false;
      document.getElementById('lr-tts-status').textContent = 'Paused';
      updateLRTTSIcon(false);
    }

    function stopLRTTS() {
      window.speechSynthesis.cancel();
      clearInterval(lrTTSKeepAlive);
      lrTTSPlaying = false;
      lrTTSUtterance = null;
    }

    function cycleLRSpeed() {
      const speeds = [1, 1.25, 1.5, 0.75];
      lrTTSSpeed = speeds[(speeds.indexOf(lrTTSSpeed) + 1) % speeds.length];
      document.getElementById('lr-tts-speed').textContent = lrTTSSpeed + 'x';
      if (lrTTSPlaying) { stopLRTTS(); startLRTTS(); }
    }

    function updateLRTTSIcon(playing) {
      const btn = document.getElementById('lr-tts-play');
      btn.innerHTML = playing
        ? '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:#fff"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
        : '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    }

    /* Locker Room Comments — Supabase */
    async function loadLRComments(storySlug) {
      const listEl = document.getElementById('lr-comments-list');
      listEl.innerHTML = '';
      const data = await sbFetch('comments?post_id=eq.lr_' + encodeURIComponent(storySlug) + '&order=created_at.asc&select=text,user_name,user_avatar');
      if (data) data.forEach(row => addLRComment(row.text, false, row.user_name, row.user_avatar));
    }

    function addLRComment(text, animate, userName, userAvatar) {
      const listEl = document.getElementById('lr-comments-list');
      const div = document.createElement('div'); div.className = 'lr-comment-item';
      let avHtml = userAvatar
        ? '<div class="lr-comment-av"><img src="'+userAvatar+'" alt="'+(userName||'User')+'" onerror="this.parentNode.innerHTML=\'HW\'"></div>'
        : '<div class="lr-comment-av">HW</div>';
      const nameHtml = userName ? '<div class="lr-comment-username">'+userName+'</div>' : '';
      div.innerHTML = avHtml + '<div class="lr-comment-body">'+nameHtml+'<div class="lr-comment-text">'+text+'</div></div>';
      if (animate) { div.style.cssText='opacity:0;transform:translateY(5px);transition:all 0.3s'; requestAnimationFrame(()=>{ div.style.opacity='1'; div.style.transform='translateY(0)'; }); }
      listEl.appendChild(div);
    }

    async function postLRComment() {
      if (!lrCurrentStory) return;
      const input = document.getElementById('lr-comment-input');
      const text = input.value.trim(); if (!text) return;
      input.value = '';
      let userName = null, userAvatar = null;
      if (currentUser) {
        userName = currentUser.name || currentUser.email.split('@')[0];
        userAvatar = currentUser.picture || null;
      }
      addLRComment(text, true, userName, userAvatar);
      const postId = 'lr_' + lrCurrentStory.slug;
      await sbFetch('comments', 'POST', { post_id: postId, text, user_name: userName, user_avatar: userAvatar });
      toast('Posted!');
    }

    const lrCommentInput = document.getElementById('lr-comment-input');
    if (lrCommentInput) {
      lrCommentInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') postLRComment();
      });
    }

    /* Expose globals */
    window.openLRStory = function(idx, chap, auto) { openLRStory(idx, chap, auto); };
    window._openLRStoryImpl = openLRStory;
    window._closeLRReaderImpl = closeLRReader;
    window.closeLRReader = closeLRReader;
    window.toggleLRTTS = toggleLRTTS;
    window.cycleLRSpeed = cycleLRSpeed;
    window.goLRChapter = goLRChapter;
    window.switchLRLang = switchLRLang;
    window.postLRComment = postLRComment;


  })();

  /* SERVICE WORKER */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
        })
        .catch(() => {});
    });
  }

  // Handle PWA shortcuts — navigate to section on launch
  (function(){
    var params = new URLSearchParams(window.location.search);
    var section = params.get('section');
    if(section){
      // Wait for app to init then navigate to section
      var attempts = 0;
      var check = setInterval(function(){
        var pg = document.getElementById('page-' + section);
        var btn = document.querySelector('.nav-item[data-page="' + section + '"]');
        if(pg && btn){
          clearInterval(check);
          btn.click();
        }
        if(++attempts > 20) clearInterval(check);
      }, 200);
    }
  })();

  // PWA install prompt
  var deferredPrompt;
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferredPrompt = e;
    var btn = document.getElementById('pwa-install-btn');
    if(btn) btn.classList.add('visible');
  });
  window.addEventListener('appinstalled', function(){
    deferredPrompt = null;
    var btn = document.getElementById('pwa-install-btn');
    if(btn) btn.classList.remove('visible');
  });
  </script>
