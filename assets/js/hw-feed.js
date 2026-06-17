/* ════════════════════════════════════════════════════════════
   HW-FEED.JS — Feed, Polls, Hashtags, Like styles, Profiles pagination,
                Community feed, Following strip, Pull-to-refresh,
                initApp, LR Stories, Likes/Comments engine
   Extraído de hw-index.js
   Depende de: hw-auth.js (window.currentUser, window.HottAuth)
   Expone: window.initApp, window.ALL_POSTS, window.loadAllLikes,
           window.loadAllCommentCounts, window.setFeedFilter, window.renderPost,
           window.openCommentsPanel, window.openCollectionsPanel, window.loadPoll, ...
   ════════════════════════════════════════════════════════════ */

/* -- POLLS v2 -- */
(function(){
  var s = document.createElement('style');
  s.textContent = [
    '.poll-container{margin:0;padding:0.9rem 1rem;border-top:1px solid var(--border);}',
    '.poll-question{font-family:var(--font-d);font-size:1rem;letter-spacing:0.04em;margin-bottom:0.7rem;color:var(--text);}',
    '.poll-opt{display:flex;align-items:center;margin:0.4rem 0;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;overflow:hidden;cursor:pointer;transition:border-color 0.2s;}',
    '.poll-opt:hover{border-color:var(--fire-orange);}',
    '.poll-opt.winner{border-color:var(--fire-orange);}',
    '.poll-opt.my-vote{border-color:var(--fire-red);}',
    '.poll-opt-img{width:52px;height:52px;object-fit:cover;flex-shrink:0;}',
    '.poll-opt-placeholder{width:52px;height:52px;flex-shrink:0;background:var(--surface-3);display:flex;align-items:center;justify-content:center;font-size:1.3rem;}',
    '.poll-opt-body{flex:1;padding:0.45rem 0.5rem;}',
    '.poll-opt-label{font-size:0.85rem;font-weight:600;}',
    '.poll-opt-track{height:4px;background:var(--surface-3);border-radius:2px;margin-top:0.35rem;overflow:hidden;}',
    '.poll-opt-fill{height:100%;background:linear-gradient(90deg,var(--fire-orange),var(--fire-red));border-radius:2px;transition:width 0.8s cubic-bezier(0.16,1,0.3,1);}',
    '.poll-opt-pct{font-family:var(--font-d);font-size:0.9rem;color:var(--fire-orange);padding-right:0.7rem;flex-shrink:0;}',
    '.poll-total{font-size:0.7rem;color:var(--text-dim);text-align:right;margin-top:0.35rem;}',
    '.poll-collage{width:100%;display:grid;gap:2px;}',
    '.poll-collage img{width:100%;aspect-ratio:1;object-fit:cover;display:block;}',
    '.poll-disabled .poll-opt{cursor:default;}',
    '.poll-disabled .poll-opt:hover{border-color:var(--border);}'
  ].join('');
  document.head.appendChild(s);
})();

window.loadPoll = async function(postId, container) {
  if (!postId || !container) return;
  try {
    var r = await fetch('/api/polls?post_id=' + encodeURIComponent(postId), { credentials: 'include' });
    var d = await r.json();
    if (!d.poll) return;
    renderPoll(postId, d.poll, container);
  } catch(e) {}
};

function renderPoll(postId, poll, container) {
  var voted = poll.userVote !== null && poll.userVote !== undefined;
  var total = poll.total || 0;
  var imgs = poll.options.map(function(o){ return (o && o.image) ? o.image : ''; }).filter(Boolean);
  var collageHTML = '';
  if (imgs.length > 0) {
    var cols = imgs.length === 1 ? 1 : 2;
    collageHTML = '<div class="poll-collage" style="grid-template-columns:repeat(' + cols + ',1fr);">';
    imgs.forEach(function(src){ collageHTML += '<img src="' + src + '" loading="lazy">'; });
    collageHTML += '</div>';
  }
  var optsHTML = '';
  poll.options.forEach(function(opt, i) {
    var count = poll.counts[i] || 0;
    var pct = total > 0 ? Math.round((count / total) * 100) : 0;
    var maxCount = Math.max.apply(null, poll.counts);
    var isWinner = voted && poll.counts[i] === maxCount && maxCount > 0;
    var isMyVote = poll.userVote === i;
    var cls = isWinner ? ' winner' : '';
    if (isMyVote) cls += ' my-vote';
    var label = (opt && opt.label) ? opt.label : (typeof opt === 'string' ? opt : '');
    var imgSrc = (opt && opt.image) ? opt.image : '';
    var imgHTML = imgSrc
      ? '<img class="poll-opt-img" src="' + imgSrc + '" loading="lazy">'
      : '<div class="poll-opt-placeholder">&#128100;</div>';
    optsHTML += '<div class="poll-opt' + cls + '" data-idx="' + i + '">'
      + imgHTML
      + '<div class="poll-opt-body">'
      + '<div class="poll-opt-label">' + label + (isMyVote ? ' &#10004;' : '') + '</div>'
      + (voted ? '<div class="poll-opt-track"><div class="poll-opt-fill" style="width:' + pct + '%"></div></div>' : '')
      + '</div>'
      + (voted ? '<div class="poll-opt-pct">' + pct + '%</div>' : '')
      + '</div>';
  });
  var html = collageHTML
    + '<div class="poll-container' + (voted ? ' poll-disabled' : '') + '">'
    + '<div class="poll-question">' + poll.question + '</div>'
    + optsHTML
    + '<div class="poll-total">' + total + ' vote' + (total !== 1 ? 's' : '') + '</div>'
    + '</div>';
  container.innerHTML = html;
  if (!voted) {
    container.querySelectorAll('.poll-opt').forEach(function(opt) {
      opt.addEventListener('click', function() {
        votePoll(postId, parseInt(opt.getAttribute('data-idx')), poll, container);
      });
    });
  }
}

async function votePoll(postId, idx, poll, container) {
  try {
    var r = await fetch('/api/polls?post_id=' + encodeURIComponent(postId), {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', option_idx: idx })
    });
    var d = await r.json();
    if (d.ok) { poll.counts = d.counts; poll.total = d.total; poll.userVote = d.userVote; renderPoll(postId, poll, container); }
  } catch(e) {}
}


/* ── HASHTAG SUPPORT ── */
(function(){
  var hStyle = document.createElement('style');
  hStyle.textContent = [
    '.post-hashtag{color:var(--fire-orange);font-weight:600;cursor:pointer;text-decoration:none;}',
    '.post-hashtag:hover{text-decoration:underline;}'
  ].join('');
  document.head.appendChild(hStyle);

  window.hashtagify = function(text) {
    if (!text) return '';
    // Escapar HTML primero excepto los hashtags
    var escaped = String(text)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
    // Convertir #hashtag en span clickeable
    return escaped.replace(/(#[a-zA-Z0-9_À-ɏ]+)/g, function(tag) {
      var clean = tag.slice(1).toLowerCase();
      return '<span class="post-hashtag" onclick="window.filterByHashtag(\"'+clean+'\")">'+tag+'</span>';
    });
  };

  window.filterByHashtag = function(tag) {
    // Intentar filtrar por categoría primero
    var pills = document.querySelectorAll('.cat-pill[data-cat]');
    var matched = false;
    pills.forEach(function(pill) {
      if (pill.getAttribute('data-cat') === tag) {
        pill.click();
        matched = true;
        // Scroll al top del feed
        var feed = document.getElementById('feed-container');
        if (feed) feed.scrollIntoView({behavior:'smooth'});
      }
    });
    // Si no hay pill exacta, filtrar el feed por tag libre
    if (!matched) {
      if (typeof window.setFeedFilter === 'function') {
        window.setFeedFilter(tag);
      }
      // Scroll al top
      var feed = document.getElementById('feed-container');
      if (feed) feed.scrollIntoView({behavior:'smooth'});
    }
  };
})();

/* ── LIKE BUTTON STYLES ── */
(function(){
  var s = document.createElement('style');
  s.textContent = [
    /* Llama SVG — estado liked */
    '.like-btn.liked .like-heart{display:none;}',
    '.like-btn .like-flame{display:none;}',
    '.like-btn.liked .like-flame{display:inline;}',
    '.like-btn.liked{color:var(--fire-orange);}',
    '.like-btn svg{transition:fill 0.25s,stroke 0.25s;}',
    '.like-btn.like-pop{animation:like-pop 0.45s cubic-bezier(0.16,1,0.3,1);}',
    '@keyframes like-pop{0%{transform:scale(1);}15%{transform:scale(0.75);}50%{transform:scale(1.45);}75%{transform:scale(1.15);}100%{transform:scale(1);}}'
  ].join('');
  document.head.appendChild(s);
})();

/* ── PROFILES PAGINATION — wrestlers, studs, bulge ── */
(function(){

  function buildProfileCard(p, type) {
    var photo = p.photo || p.image || '';
    var tag = p.tag || p.sport || '';
    var bio = p.bio || p.team || '';
    var imgHTML = photo
      ? '<img src="'+photo+'" alt="'+escH(p.title||'')+'" loading="lazy">'
      : '<div style="width:100%;height:100%;background:linear-gradient(135deg,var(--fire-deep),var(--surface-3));display:flex;align-items:center;justify-content:center;"><svg viewBox=\"0 0 24 24\" width=\"32\" height=\"32\" fill=\"var(--fire-orange)\"><path d=\"M12 2s-5 5.5-5 10a5 5 0 0010 0c0-4.5-5-10-5-10z\"/></svg></div>';
    return '<a href="'+p.url+'" class="wrestler-card reveal" style="text-decoration:none;" data-wtag="'+escH(tag)+'" data-scat="'+escH(tag)+'" data-bsport="'+escH(tag)+'">'
      +'<div class="wrestler-thumb">'+imgHTML
      +'<div class="wrestler-thumb-overlay">'
      +'<div class="wrestler-name">'+escH(p.title||'')+'</div>'
      +'<div class="wrestler-tag">'+escH(tag)+'</div>'
      +'</div></div>'
      +(bio ? '<div class="wrestler-stats"><span class="wstat">'+escH(bio)+'</span></div>' : '')
      +'</a>';
  }

  function escH(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function loadProfiles(jsonUrl, gridId, pillsId, emptyId, filterAttr) {
    var grid = document.getElementById(gridId);
    var pillsEl = document.getElementById(pillsId);
    var emptyEl = document.getElementById(emptyId);
    if (!grid) return;

    fetch(jsonUrl)
      .then(function(r){ return r.json(); })
      .then(function(data) {
        if (!data || data.length === 0) {
          if (emptyEl) emptyEl.style.display = 'flex';
          return;
        }

        // Construir pills de categorías
        if (pillsEl) {
          var tags = [...new Set(data.map(function(p){ return p.tag || p.sport || ''; }).filter(Boolean))];
          tags.forEach(function(tag) {
            var btn = document.createElement('button');
            btn.className = 'cat-pill';
            btn.setAttribute('data-' + filterAttr, tag);
            btn.textContent = tag;
            btn.onclick = function() {
              pillsEl.querySelectorAll('.cat-pill').forEach(function(b){ b.classList.remove('active'); });
              btn.classList.add('active');
              var filter = btn.getAttribute('data-' + filterAttr);
              grid.querySelectorAll('.wrestler-card').forEach(function(card) {
                var cardTag = card.getAttribute('data-' + filterAttr) || '';
                card.style.display = (filter === 'all' || cardTag === filter) ? '' : 'none';
              });
            };
            pillsEl.appendChild(btn);
          });

          // All pill click
          var allPill = pillsEl.querySelector('[data-' + filterAttr + '="all"]');
          if (allPill) allPill.onclick = function() {
            pillsEl.querySelectorAll('.cat-pill').forEach(function(b){ b.classList.remove('active'); });
            allPill.classList.add('active');
            grid.querySelectorAll('.wrestler-card').forEach(function(c){ c.style.display = ''; });
          };
        }

        // Renderizar cards
        data.forEach(function(p) {
          var div = document.createElement('div');
          div.innerHTML = buildProfileCard(p, filterAttr);
          grid.appendChild(div.firstChild);
        });
      })
      .catch(function() {
        if (emptyEl) emptyEl.style.display = 'flex';
      });
  }

  function loadStuds(jsonUrl, listId, pillsId, emptyId) {
    var list = document.getElementById(listId);
    var pillsEl = document.getElementById(pillsId);
    var emptyEl = document.getElementById(emptyId);
    if (!list) return;
    fetch(jsonUrl)
      .then(function(r){ return r.json(); })
      .then(function(data) {
        if (!data || data.length === 0) {
          if (emptyEl) emptyEl.style.display = 'flex';
          return;
        }
        // Pills
        if (pillsEl) {
          var cats = [...new Set(data.map(function(s){ return s.tag||''; }).filter(Boolean))];
          cats.forEach(function(cat) {
            var btn = document.createElement('button');
            btn.className = 'cat-pill';
            btn.setAttribute('data-scat', cat);
            btn.textContent = cat.replace(/-/g,' ').toUpperCase();
            btn.onclick = function() {
              pillsEl.querySelectorAll('.cat-pill').forEach(function(b){ b.classList.remove('active'); });
              btn.classList.add('active');
              list.querySelectorAll('.badboy-card').forEach(function(card) {
                card.style.display = (card.getAttribute('data-scat') === cat) ? '' : 'none';
              });
            };
            pillsEl.appendChild(btn);
          });
          var allPill = pillsEl.querySelector('[data-scat="all"]');
          if (allPill) allPill.onclick = function() {
            pillsEl.querySelectorAll('.cat-pill').forEach(function(b){ b.classList.remove('active'); });
            allPill.classList.add('active');
            list.querySelectorAll('.badboy-card').forEach(function(c){ c.style.display = ''; });
          };
        }
        // Cards
        data.forEach(function(s) {
          var photo = s.photo || s.image || '';
          var tag = s.tag || '';
          var div = document.createElement('a');
          div.href = s.url;
          div.className = 'badboy-card reveal';
          div.setAttribute('data-scat', tag);
          div.style.textDecoration = 'none';
          div.innerHTML = '<div class="mugshot-wrap">'
            +(photo ? '<img src="'+escH(photo)+'" alt="'+escH(s.title||'')+'" loading="lazy">' : '')
            +'<div class="mugshot-label">'+escH(tag || 'STUD').replace(/-/g,' ').toUpperCase()+'</div>'
            +'</div>'
            +'<div class="badboy-info">'
            +'<div class="badboy-name">'+escH(s.title||'')+'</div>'
            +(s.bio ? '<div class="badboy-desc">'+escH(s.bio)+'</div>' : '')
            +'</div>';
          list.appendChild(div);
        });
      })
      .catch(function() { if (emptyEl) emptyEl.style.display = 'flex'; });
  }

  function initProfiles() {
    loadProfiles('/assets/data/wrestlers.json', 'wrestlers-grid', 'wrestlers-pills', 'wrestlers-empty', 'wtag');
    loadStuds('/assets/data/studs.json', 'studs-list', 'studs-pills', 'studs-empty');
    loadProfiles('/assets/data/bulge.json', 'bulge-grid', 'bulge-pills', 'bulge-empty', 'bsport');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfiles);
  } else {
    initProfiles();
  }

})();

/* ── FEED PAGINATION — carga posts desde JSON ── */
(function(){
  var ALL_POSTS = [];
  var LOADED = 0;
  var PER_PAGE = 12;
  var LOADING = false;
  var activeFilter = 'all';

  function buildCard(post, idx) {
    var imgs = [];
    if (Array.isArray(post.images) && post.images.length > 0) {
      imgs = post.images.filter(function(i){ return i && i !== ''; });
    } else if (post.image && post.image !== '') {
      imgs = [post.image];
    }

    var mediaHTML = '';
    if (imgs.length === 1) {
      mediaHTML = '<div class="card-media-container"><a href="'+post.url+'" class="card-media-wrap"><img class="card-first-photo" src="'+imgs[0]+'" alt="'+escH(post.title)+'" loading="lazy" decoding="async"></a>'+(post.adult ? adultOverlay(idx) : '')+'</div>';
    } else if (imgs.length === 2) {
      mediaHTML = '<div class="card-media-container"><a href="'+post.url+'" class="card-media-wrap"><div class="card-duo-grid"><img src="'+imgs[0]+'" alt="" loading="lazy" decoding="async"><img src="'+imgs[1]+'" alt="" loading="lazy" decoding="async"></div></a>'+(post.adult ? adultOverlay(idx) : '')+'</div>';
    } else if (imgs.length > 2) {
      mediaHTML = '<div class="card-media-container"><div class="card-media-wrap"><a href="'+post.url+'" style="display:block;"><img class="card-first-photo" src="'+imgs[0]+'" alt="'+escH(post.title)+'" loading="lazy" decoding="async"><div class="card-photo-peek"><img src="'+imgs[1]+'" alt="" loading="lazy" decoding="async"></div></a><a href="'+post.url+'" class="card-see-all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></a></div>'+(post.adult ? adultOverlay(idx) : '')+'</div>';
    }

    var descHTML = post.description ? '<div class="card-desc collapsed" id="desc-'+idx+'">'+hashtagify(post.description)+'</div><button class="card-read-more visible" data-desc="desc-'+idx+'">more</button>' : '';
    var titleHTML = post.title ? '<div class="card-title"><a href="'+post.url+'">'+escH(post.title)+'</a></div>' : '';

    return '<article class="post-card'+(post.adult ? ' adult-card' : '')+'" data-cat="'+(post.category||'')+'" data-idx="'+idx+'" data-adult="'+(post.adult||false)+'" data-path="'+escH(post.path||'')+'" data-title="'+escH(post.title||'')+'" data-desc="'+escH(post.description||'')+'" data-category="'+(post.category||'')+'" data-poster="'+escH(post.poster||'')+'" data-date="'+(post.date||'')+'" data-images="'+escH(JSON.stringify((post.images&&post.images.length>0)?post.images:(post.image?[post.image]:[])))+'" data-videos="'+escH(JSON.stringify(post.videos||[]))+'" data-links="'+escH(JSON.stringify(post.links||[]))+'" data-featured="'+(post.featured||false)+'">'
      +'<div class="card-header"><div class="card-avatar" style="background:linear-gradient(135deg,var(--fire-deep),var(--fire-red));display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" width="18" height="18" fill="var(--fire-orange)"><path d="M12 2s-5 5.5-5 10a5 5 0 0010 0c0-4.5-5-10-5-10zm0 14a3 3 0 01-3-3c0-2 1.5-4.5 3-7 1.5 2.5 3 5 3 7a3 3 0 01-3 3z"/></svg></div><div class="card-meta"><div class="card-author">'+(post.category ? (post.category.charAt(0).toUpperCase()+post.category.slice(1)) : 'General')+'</div><div class="card-cat-label">JUICY STUD</div></div><div class="card-date">'+(post.date||'')+'</div></div>'
      +mediaHTML
      +'<div class="card-body">'+titleHTML+descHTML+'</div>'+'<div class="card-poll" style="padding:0 0.8rem;"></div>'
      +'<div class="card-actions">'
      +'<button class="card-act-btn comment-toggle-btn" data-id="'+(post.path||String(idx))+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span class="comment-count">0</span></button>'
      +'<button class="card-act-btn save-btn" data-id="'+(post.path||String(idx))+'" data-url="'+(post.url||'')+'" data-img="'+(post.poster||post.image||'')+'" data-title="'+escH(post.title||'')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg><span class="save-count"></span></button>'
      +'<button class="card-act-btn like-btn" data-id="'+(post.path||String(idx))+'"><svg class="like-heart" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><svg class="like-flame" viewBox="0 0 24 24" width="21" height="21" fill="var(--fire-orange)" stroke="none"><path d="M12 2s-5 5.5-5 10a5 5 0 0010 0c0-4.5-5-10-5-10zm0 14a3 3 0 01-3-3c0-2 1.5-4.5 3-7 1.5 2.5 3 5 3 7a3 3 0 01-3 3z"/></svg><span class="like-count">0</span></button>'
      +'<button class="card-act-btn share-btn" data-url="'+post.url+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>'
      +'</div>'

      +'</article>';
  }

  function adultOverlay(idx) {
    return '<div class="adult-overlay" id="adult-overlay-'+idx+'" onclick="openAuthModal()"><div class="adult-overlay-icon">&#128520;</div><div class="adult-overlay-text">Adults Only. No Exceptions.</div><div class="adult-overlay-btn">Sign in to unlock &#128293;</div></div>';
  }

  function escH(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function getFilteredPosts() {
    if (activeFilter === 'all') return ALL_POSTS;
    return ALL_POSTS.filter(function(p){ return p.category === activeFilter; });
  }

  function renderBatch() {
    /* NUNCA renderizar Jekyll posts en modo following */
    if (activeFilter === 'following') return;
    var posts = getFilteredPosts();
    var container = document.getElementById('feed-container');
    if (!container) return;
    var batch = posts.slice(LOADED, LOADED + PER_PAGE);
    var isAdmin = (function(){ try { var m = document.cookie.match(/hw_admin=([^;]+)/); if(!m) return false; var s = JSON.parse(atob(m[1])); return s && s.login === 'Mikeljchm'; } catch(e){ return false; } })();
    batch.forEach(function(post, i) {
      var card = document.createElement('div');
      card.innerHTML = buildCard(post, LOADED + i);
      var articleEl = card.firstChild;
      if (isAdmin) {
        var editBtn = document.createElement('button');
        editBtn.className = 'admin-edit-btn';
        editBtn.title = 'Edit';
        editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
        editBtn.onclick = function(){ openInlineEdit(articleEl); };
        var header = articleEl.querySelector('.card-header');
        if (header) header.appendChild(editBtn);
      }
      container.appendChild(articleEl);
      // Cargar encuesta si el card tiene poll
      var pollContainer = articleEl.querySelector('.card-poll');
      if (pollContainer) {
        var pId = articleEl.dataset.path || '';
        if (pId) window.loadPoll(pId, pollContainer);
      }
    });
    LOADED += batch.length;
    var loader = document.getElementById('feed-loader');
    if (loader) loader.style.display = 'none';
    LOADING = false;
    // Cargar likes para los nuevos cards — setTimeout asegura que loadAllLikes ya esté definida
    setTimeout(function(){
      if (typeof window.loadAllLikes === 'function') window.loadAllLikes();
    if (typeof window.loadAllCommentCounts === 'function') window.loadAllCommentCounts();
      if (typeof window.loadAllCommentCounts === 'function') window.loadAllCommentCounts();
    }, 100);

    // Si no hay más posts ocultar sentinel
    var sentinel = document.getElementById('feed-sentinel');
    if (sentinel) sentinel.style.display = LOADED >= posts.length ? 'none' : 'flex';
  }

  function resetFeed() {
    LOADED = 0;
    var container = document.getElementById('feed-container');
    if (container) container.innerHTML = '';
    /* El observer dispara renderBatch cuando llega al sentinel */
  }

  window.setFeedFilter = function(cat) {
    activeFilter = cat || 'all';
    var allView = document.getElementById('all-feed-view');
    var fwView  = document.getElementById('following-feed-view');
    /* Pills */
    document.querySelectorAll('.feed-tab[data-cat]').forEach(function(p){
      p.classList.toggle('active', p.getAttribute('data-cat') === cat);
    });
    if (cat === 'following') {
      /* Si no está logueado → redirigir a login */
      if (!window.currentUser) {
        if (typeof window.openLoginSheet === 'function') window.openLoginSheet();
        else if (typeof window.openAuthModal === 'function') window.openAuthModal();
        /* Devolver tab a ALL */
        document.querySelectorAll('.feed-tab[data-cat]').forEach(function(p){
          p.classList.toggle('active', p.getAttribute('data-cat') === 'all');
        });
        return;
      }
      if (allView) allView.style.display = 'none';
      if (fwView)  fwView.style.display  = 'block';
      window._resetFollowingFeed();
      window._loadFollowingFeed();
    } else {
      if (allView) allView.style.display = 'block';
      if (fwView)  fwView.style.display  = 'none';
    }
  };

  /* Renderizar una lista custom de posts (para Trending) */
  window._renderTrendingFeed = function(posts) {
    var container = document.getElementById('feed-container');
    if (!container) return;
    container.innerHTML = '';
    if (!posts.length) {
      container.innerHTML = '<div style="padding:2.5rem;text-align:center;color:var(--text-dim);font-size:0.85rem;">No trending posts right now. Check back later!</div>';
      return;
    }
    /* Reutilizar buildCard para cada post */
    posts.forEach(function(post, i) {
      var card = document.createElement('div');
      card.innerHTML = buildCard(post, i);
      container.appendChild(card.firstChild);
    });
    /* Cargar likes/counts */
    setTimeout(function(){
      if (typeof window.loadAllLikes === 'function') window.loadAllLikes();
      if (typeof window.loadAllCommentCounts === 'function') window.loadAllCommentCounts();
      if (typeof window._markSavedBtns === 'function') window._markSavedBtns();
    }, 100);
    /* Ocultar sentinel — trending no tiene infinite scroll */
    var sentinel = document.getElementById('feed-sentinel');
    if (sentinel) sentinel.style.display = 'none';
  };

  // Intersection Observer para infinite scroll
  function initObserver() {
    var sentinel = document.getElementById('feed-sentinel');
    if (!sentinel) { if(window.__hwLogPush) window.__hwLogPush('initObserver ABORT: sentinel no existe'); return; }
    if(window.__hwLogPush) window.__hwLogPush('initObserver registrado sobre feed-sentinel');
    var observer = new IntersectionObserver(function(entries) {
      if(window.__hwLogPush) window.__hwLogPush('Jekyll observer dispar\u00f3: isIntersecting=' + entries[0].isIntersecting + ' LOADING=' + LOADING + ' LOADED=' + LOADED + ' total=' + getFilteredPosts().length);
      if (entries[0].isIntersecting && !LOADING && !_cfLoading && LOADED < getFilteredPosts().length) {
        LOADING = true;
        var loader = document.getElementById('feed-loader');
        if (loader) loader.style.display = 'flex';
        setTimeout(renderBatch, 50);
      }
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
  }

  /* ── CSS para la sección Siguiendo y community feed ── */
  (function(){
    var s = document.createElement('style');
    s.textContent = [
      '#following-strip::-webkit-scrollbar{display:none;}',
      /* Pill Following destacado */
      '#following-pill{background:linear-gradient(135deg,var(--fire-orange),var(--fire-red)) !important;color:#fff !important;border-color:transparent !important;font-weight:600;}',
      '#following-pill:before{content:"\2728 ";}'  ,
      '.fw-avatar-card{flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:0.35rem;cursor:pointer;width:58px;}',
      '.fw-avatar-ring{width:52px;height:52px;border-radius:50%;padding:2px;background:linear-gradient(135deg,var(--fire-orange),var(--fire-red));flex-shrink:0;}',
      '.fw-avatar-ring.has-post{background:linear-gradient(135deg,var(--fire-orange),var(--fire-yellow));}',
      '.fw-avatar-inner{width:100%;height:100%;border-radius:50%;background:var(--surface-2);overflow:hidden;border:2px solid var(--bg);}',
      '.fw-avatar-inner img{width:100%;height:100%;object-fit:cover;display:block;}',
      '.fw-avatar-name{font-size:0.58rem;color:var(--text-dim);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:100%;font-family:var(--font-b);}',
      '.cf-divider{display:flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;margin-bottom:0.25rem;}',
      '.cf-divider-line{flex:1;height:1px;background:var(--border);}',
      '.cf-divider-label{font-size:0.6rem;color:var(--text-muted);letter-spacing:0.1em;font-family:var(--font-d);white-space:nowrap;}',
    ].join('');
    document.head.appendChild(s);
  })();

  /* ── Feed de comunidad paginado — 12 posts por carga ── */
  var _cfOffset   = 0;
  var _cfLimit    = 12;
  var _cfLoading  = false;
  var _cfHasMore  = true;
  var _cfObserver = null;

  function _cfRenderPosts(posts, append) {
    if(window.__hwLogPush) window.__hwLogPush('_cfRenderPosts llamada con ' + posts.length + ' posts, append=' + append + ', renderPost type=' + typeof window.renderPost);
    var cc = document.getElementById('community-feed-container');
    if (!cc) { if(window.__hwLogPush) window.__hwLogPush('_cfRenderPosts ABORT: cc no existe'); return; }
    if (!append) {
      /* Primera carga — poner separador + posts */
      var divider = '<div class="cf-divider"><div class="cf-divider-line"></div><div class="cf-divider-label">&#128101; COMMUNITY POSTS</div><div class="cf-divider-line"></div></div>';
      cc.innerHTML = divider;
    }
    var frag = document.createDocumentFragment();
    posts.forEach(function(p) {
      var div = document.createElement('div');
      div.innerHTML = (window.renderPost||function(){ return ''; })(p);
      while (div.firstChild) frag.appendChild(div.firstChild);
    });
    cc.appendChild(frag);
    if(window.__hwLogPush) window.__hwLogPush('_cfRenderPosts terminó, cc.children.length=' + cc.children.length);
    if (window._activateLazyGifs) window._activateLazyGifs(cc);
    if (window.loadAllLikes) window.loadAllLikes();
    if (window.loadAllCommentCounts) window.loadAllCommentCounts();
  }

  async function _cfLoadPage() {
    if(window.__hwLogPush) window.__hwLogPush('_cfLoadPage() llamada, offset=' + _cfOffset + ' hasMore=' + _cfHasMore + ' loading=' + _cfLoading);
    var _aw = document.getElementById('all-feed-view');
    if (_aw && _aw.style.display === 'none') {
      if(window.__hwLogPush) window.__hwLogPush('_cfLoadPage ABORTADA: all-feed-view display=none');
      return;
    }
    if (_cfLoading || !_cfHasMore) {
      if(window.__hwLogPush) window.__hwLogPush('_cfLoadPage ABORTADA: loading=' + _cfLoading + ' hasMore=' + _cfHasMore);
      return;
    }
    _cfLoading = true;
    /* Mostrar spinner en el sentinel del community feed */
    var sentinel = document.getElementById('cf-sentinel');
    if (sentinel) sentinel.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--fire-orange)" stroke-width="2" style="animation:spin 1s linear infinite;"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>';
    try {
      var r = await fetch('/api/posts?limit='+_cfLimit+'&offset='+_cfOffset, {credentials:'include'});
      var d = await r.json();
      var posts = d.posts || [];
      if(window.__hwLogPush) window.__hwLogPush('_cfLoadPage fetch OK, posts.length=' + posts.length);
      _cfHasMore = d.has_more || false;
      if (posts.length) {
        _cfRenderPosts(posts, _cfOffset > 0);
        _cfOffset += posts.length;
        if(window.__hwLogPush) window.__hwLogPush('_cfRenderPosts ejecutado con ' + posts.length + ' posts');
      }
      if (sentinel) sentinel.innerHTML = '';
      /* Ocultar sentinel si no hay más */
      /* Cuando community feed termina, el observer dispara Jekyll automáticamente */
    } catch(e) {
      if(window.__hwLogPush) window.__hwLogPush('_cfLoadPage EXCEPCION: ' + e.message);
      if (sentinel) sentinel.innerHTML = '';
    }
    _cfLoading = false;
  }

  window._initCommunityFeed = function() {
    if(window.__hwLogPush) window.__hwLogPush('_initCommunityFeed() ejecutando');
    _cfOffset = 0; _cfHasMore = true; _cfLoading = false;
    var cc = document.getElementById('community-feed-container');
    if (!cc) { if(window.__hwLogPush) window.__hwLogPush('_initCommunityFeed ABORT: cc no existe'); return; }
    cc.innerHTML = '';
    var sentinel = document.getElementById('feed-sentinel');
    if (!sentinel) { if(window.__hwLogPush) window.__hwLogPush('_initCommunityFeed ABORT: sentinel no existe'); return; }
    sentinel.style.display = '';
    sentinel.innerHTML = '';
    if (_cfObserver) _cfObserver.disconnect();
    _cfObserver = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && !_cfLoading) _cfLoadPage();
    }, { rootMargin: '400px' });
    _cfObserver.observe(sentinel);
    _cfLoadPage();
  };

  /* ── Sección Siguiendo — avatares horizontales con últimos posts ── */
  window._initFollowingStrip = async function() {
    if (!window.currentUser) return;
    var section = document.getElementById('following-section');
    var strip   = document.getElementById('following-strip');
    if (!section || !strip) return;

    try {
      /* Traer los que sigo */
      var r = await fetch('/api/user-follows/list?user_id='+encodeURIComponent(window.currentUser.id)+'&type=following', {credentials:'include'});
      var d = await r.json();
      var following = d.users || d.following || [];
      /* Mostrar la sección siempre que estés logueado — con o sin seguidos */
      section.style.display = 'block';
      if (!following.length) {
        strip.innerHTML = '<div style="color:var(--text-muted);font-size:0.72rem;padding:0.5rem 0;">Sigue a otros usuarios para ver sus posts aquí</div>';
        return;
      }

      /* Traer sus posts recientes para saber quién publicó algo */
      var r2 = await fetch('/api/user-follows/feed', {credentials:'include'});
      var d2 = await r2.json();
      var feedPosts = d2.posts || [];
      var recentPosters = new Set(feedPosts.map(function(p){ return p.user_id; }));

      strip.innerHTML = following.map(function(u){
        var uid   = u.user_id || u.id || '';
        var name  = u.display_name || u.username || u.name || u.user_id?.slice(0,8) || 'User';
        var av    = u.avatar_url || u.picture || '';
        var avHtml = av
          ? '<img src="'+av+'" alt="">'
          : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:1.1rem;color:var(--text-dim);">'+name.charAt(0).toUpperCase()+'</div>';
        var hasPost = recentPosters.has(uid);
        return '<div class="fw-avatar-card" data-profile-uid="'+uid+'" data-profile-name="'+name+'">'
          + '<div class="fw-avatar-ring'+(hasPost?' has-post':'')+'">'
            + '<div class="fw-avatar-inner">'+avHtml+'</div>'
          + '</div>'
          + '<div class="fw-avatar-name">'+name.split(' ')[0]+'</div>'
        + '</div>';
      }).join('');

      /* Click en avatar → perfil */
      strip.querySelectorAll('.fw-avatar-card[data-profile-uid]').forEach(function(card){
        card.addEventListener('click', function(){
          var uid  = card.getAttribute('data-profile-uid');
          var name = card.getAttribute('data-profile-name');
          if (window.openMiniProfile) window.openMiniProfile(uid, name);
        });
      });

      /* Strip de avatares — el pill maneja la navegación */

    } catch(e) {
      var sec2 = document.getElementById('following-section');
      if (sec2) sec2.style.display = 'none';
    }
  };

  /* Feed tabs click — ALL / FOLLOWING */
  document.addEventListener('click', function(e){
    var tab = e.target.closest('.feed-tab[data-cat]');
    if (tab) {
      var cat = tab.getAttribute('data-cat');
      if (typeof window.setFeedFilter === 'function') window.setFeedFilter(cat);
    }
  });

  /* ── Following feed — abre la vista de posts de seguidos ── */
  /* Cargar feed de siguiendo — solo posts de usuarios que el usuario sigue */
  window._loadFollowingFeed = function() {
    if (!window.currentUser) return;
    var fc = document.getElementById('following-feed-container');
    if (!fc) return;
    fc.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">Cargando...</div>';
    fetch('/api/user-follows/feed', {credentials:'include'})
      .then(function(r){ return r.json(); })
      .then(function(d){
        /* Verificar que seguimos en modo following antes de renderizar */
        if (activeFilter !== 'following') return;
        var posts = d.posts || [];
        if (!posts.length) {
          fc.innerHTML = '<div style="padding:2.5rem;text-align:center;color:var(--text-dim);font-size:0.85rem;">No hay posts aún.<br><span style="font-size:0.72rem;color:var(--text-muted);">Sigue a usuarios para ver su contenido aquí.</span></div>';
          return;
        }
        fc.innerHTML = posts.map(function(p){ return (window.renderPost||function(){ return ''; })(p); }).join('');
        if (window._activateLazyGifs) window._activateLazyGifs(fc);
        if (window.loadAllLikes) window.loadAllLikes();
        if (window.loadAllCommentCounts) window.loadAllCommentCounts();
      })
      .catch(function(){
        fc.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-dim);">Error cargando feed.</div>';
      });
  };
  window._resetFollowingFeed = function() {
    var fc = document.getElementById('following-feed-container');
    if (fc) fc.innerHTML = '';
  };

  function initFeed() {
    fetch('/assets/data/posts.json')
      .then(function(r){ return r.json(); })
      .then(function(data) {
        ALL_POSTS = data || [];
        window.ALL_POSTS = ALL_POSTS;
        /* NO llamar renderBatch aquí — el observer lo dispara cuando llega al sentinel */
        initObserver();
        if (typeof window._markSavedBtns === 'function') window._markSavedBtns();
      })
      .catch(function() {
        var container = document.getElementById('feed-container');
        if (container) container.innerHTML = '<div class="empty-feed"><p>No posts yet.</p></div>';
      });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      initFeed();
      /* Community feed y Following strip se inician después de que auth esté listo */
      /* Esperar a que renderPost esté disponible */
      var _cfRetries = 0;
      var _cfInterval = setInterval(function(){
        _cfRetries++;
        if(window.__hwLogPush) window.__hwLogPush('retry #' + _cfRetries + ', renderPost=' + typeof window.renderPost);
        if (window.renderPost || _cfRetries > 20) {
          clearInterval(_cfInterval);
          if(window.__hwLogPush) window.__hwLogPush('Llamando _initCommunityFeed desde retry loop');
          if (window._initCommunityFeed) window._initCommunityFeed();
        }
      }, 200);
    });
  } else {
    initFeed();
    setTimeout(function(){
      if(window.__hwLogPush) window.__hwLogPush('Llamando _initCommunityFeed desde else (readyState ya complete)');
      if (window._initCommunityFeed) window._initCommunityFeed();
    }, 800);
  }
})();

  /* ── Pull-to-refresh ── */
  (function(){
    var _ptrEl      = null;
    var _ptrStart   = 0;
    var _ptrDist    = 0;
    var _ptrActive  = false;
    var _ptrRefresh = false;
    var THRESHOLD   = 72;
    var MAX_PULL    = 100;

    function _ptrCreate() {
      if (_ptrEl) return;
      _ptrEl = document.createElement('div');
      _ptrEl.id = 'ptr-indicator';
      _ptrEl.style.cssText = 'position:fixed;top:0;left:0;width:100%;z-index:9999;display:flex;align-items:center;justify-content:center;height:0;overflow:hidden;background:linear-gradient(180deg,var(--surface) 0%,transparent 100%);transition:height 0.18s var(--ease);pointer-events:none;';
      _ptrEl.innerHTML = '<div id="ptr-icon" style="display:flex;flex-direction:column;align-items:center;gap:4px;opacity:0;transition:opacity 0.15s,transform 0.15s;"><svg id="ptr-svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--fire-orange)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="transition:transform 0.3s var(--ease);"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg><span id="ptr-label" style="font-family:var(--font-d);font-size:0.55rem;letter-spacing:0.14em;color:var(--fire-orange);white-space:nowrap;"></span></div>';
      document.body.appendChild(_ptrEl);
    }

    function _ptrGetScroll() {
      var pages = document.querySelector('.pages');
      return pages ? pages.scrollTop : window.scrollY;
    }

    function _ptrOnStart(e) {
      /* Solo activar si estamos exactamente en el tope */
      if (_ptrGetScroll() > 0) return;
      var touch = e.touches ? e.touches[0] : e;
      _ptrStart   = touch.clientY;
      _ptrActive  = true;
      _ptrRefresh = false;
    }

    function _ptrOnMove(e) {
      if (!_ptrActive) return;
      /* Cancelar si el usuario scrolleó mientras arrastraba */
      if (_ptrGetScroll() > 0) { _ptrActive = false; _ptrHide(); return; }
      var touch = e.touches ? e.touches[0] : e;
      var dy = touch.clientY - _ptrStart;
      /* Solo activar si el gesto es claramente hacia ABAJO (no lateral ni arriba) */
      if (dy < 0) { _ptrActive = false; return; }
      _ptrDist = dy;
      /* Ignorar movimientos pequeños — evita activación accidental */
      if (_ptrDist < 18) return;
      var pull = Math.min(MAX_PULL, _ptrDist * 0.45);
      _ptrEl.style.height = pull + 'px';
      var icon  = document.getElementById('ptr-icon');
      var svg   = document.getElementById('ptr-svg');
      var label = document.getElementById('ptr-label');
      if (icon)  icon.style.opacity = String(Math.min(1, pull / THRESHOLD * 1.4));
      if (svg)   svg.style.transform = 'rotate(' + (pull / MAX_PULL * 340) + 'deg)';
      if (label) label.textContent = (pull >= THRESHOLD * 0.95) ? 'RELEASE' : 'PULL TO REFRESH';
      _ptrRefresh = (pull >= THRESHOLD * 0.95);
      if (_ptrDist > 8 && e.cancelable) e.preventDefault();
    }

    function _ptrOnEnd() {
      if (!_ptrActive) return;
      _ptrActive = false;
      if (_ptrRefresh) { _ptrTrigger(); } else { _ptrHide(); }
      _ptrDist = 0;
    }

    function _ptrHide() {
      if (!_ptrEl) return;
      _ptrEl.style.height = '0';
      var icon = document.getElementById('ptr-icon');
      if (icon) icon.style.opacity = '0';
    }

    function _ptrTrigger() {
      var label = document.getElementById('ptr-label');
      var svg   = document.getElementById('ptr-svg');
      if (label) label.textContent = 'REFRESHING...';
      if (svg)   svg.style.animation = 'spin 0.7s linear infinite';
      var af = window._getActiveFilter ? window._getActiveFilter() : 'all';
      setTimeout(function(){
        if (af === 'following') {
          if (window._resetFollowingFeed) window._resetFollowingFeed();
          if (window._loadFollowingFeed)  window._loadFollowingFeed();
        } else {
          var fc = document.getElementById('feed-container');
          if (fc) fc.innerHTML = '';
          if (window._initCommunityFeed) window._initCommunityFeed();
        }
        setTimeout(_ptrHide, 600);
      }, 500);
    }

    function _ptrInit() {
      _ptrCreate();
      var target = document.querySelector('.pages') || document;
      target.addEventListener('touchstart', _ptrOnStart, {passive:true});
      target.addEventListener('touchmove',  _ptrOnMove,  {passive:false});
      target.addEventListener('touchend',   _ptrOnEnd,   {passive:true});
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _ptrInit);
    } else {
      _ptrInit();
    }
  })();

  window._getActiveFilter = function() {
    var tab = document.querySelector('.feed-tab.active');
    return tab ? tab.getAttribute('data-cat') : 'all';
  };


  /* AGE GATE — fuera del IIFE para q siempre funcione */
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

  /* APP — todo lo demás en IIFE separado */
  (function() {
    'use strict';

    function $(id) { return document.getElementById(id); }
    function fmt(n) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n); }
    let toastTimer;
    function toast(msg) {
      const t = $('toast'); if(!t) return;
      t.textContent = msg; t.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove('show'), 5000);
    }

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

      /* COMMENTS — Cloudflare D1 */
      async function loadComments(postId, listEl, countBtn) {
        try {
          const r = await fetch('/api/comments?post_id=' + encodeURIComponent(postId), { credentials: 'include' });
          const d = await r.json();
          if (d.comments) {
            listEl.innerHTML = '';
            d.comments.forEach(row => addComment(listEl, row.body, false, row.user_name, row.user_avatar, row.user_id));
            if (countBtn) { const c = countBtn.querySelector('.comment-count'); if(c) c.textContent = d.comments.length||0; }
          }
        } catch(e) {}
      }

      /* LIKES — handled by independent IIFE below initApp */

      /* SAVE — handled by independent IIFE below initApp */

      /* SHARE */
      document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const url = btn.dataset.url || location.href;
          if (navigator.share) { try { await navigator.share({ url, title:'JUICY STUD' }); } catch(e){} }
          else { await navigator.clipboard.writeText(url).catch(()=>{}); toast('Link copied!'); }
        });
      });



      function addComment(list, text, animate, userName, userAvatar, userId) {
        const div = document.createElement('div'); div.className = 'comment-item';
        var _avR = (typeof _resolveAvatar==='function') ? _resolveAvatar(userId, userAvatar) : (userAvatar||'');
        const av = _avR ? '<img src="'+_avR+'" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">' : '<div class="comment-av">'+(userName||'HW').charAt(0).toUpperCase()+'</div>';
        const name = userName ? '<span class="comment-username">'+userName+'</span>' : '';
        var stickerMatch = text ? text.match(/\[sticker\]([^[]+)\[\/sticker\]/) : null;
        var bodyContent = stickerMatch
          ? '<video class="comment-sticker" src="'+stickerMatch[1]+'" autoplay loop muted playsinline style="max-width:80px;border-radius:8px;display:block;"></video>'
          : '<div class="comment-text">'+text+'</div>';
        div.innerHTML = av + '<div class="comment-body">'+name+bodyContent+'</div>';
        if (animate) { div.style.cssText='opacity:0;transform:translateY(5px);transition:all 0.3s'; requestAnimationFrame(()=>{ div.style.opacity='1'; div.style.transform='translateY(0)'; }); }
        list.appendChild(div);
      }

      /* PHOTO VIEWER */
      let viewerImgs = [], viewerIdx = 0, viewerPostId = null;
      let scale = 1, pinchDist = 0, pinchScale = 1, swipeSx = 0;

      function openViewer(imgs, startIdx, postId, desc) {
        /* Usar el nuevo visor nativo */
        var urls = imgs.map(function(img){ return img.src || img; });
        var likeCallback = null;
        if(postId){
          likeCallback = function(pid){
            var id = String(pid);
            var isLiked = liked.has(id);
            if(isLiked){ liked.delete(id); } else { liked.add(id); }
            /* Actualizar botón like del viewer */
            var lb = document.getElementById('hw-viewer-like');
            if(lb) lb.classList.toggle('liked', !isLiked);
            /* Actualizar like en el feed */
            var feedBtn = document.querySelector('.post-card[data-post-id="'+id+'"] .like-btn');
            if(feedBtn) feedBtn.classList.toggle('liked', !isLiked);
            /* Persistir en D1 */
            fetch('/api/likes', {method:'POST', credentials:'include',
              headers:{'Content-Type':'application/json'},
              body:JSON.stringify({post_id:pid, action:isLiked?'unlike':'like'})
            }).catch(function(){});
          };
        }
        if(window.HWViewer) window.HWViewer.open(urls, startIdx||0, postId||null, likeCallback);
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

  /* LIKES, SAVE, SHARE, COMMENTS — outside initApp, always work */
  (function() {
    function $(id) { return document.getElementById(id); }
    function fmt(n) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n); }
    function toast(msg) { const t = $('toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2000); }

    /* LIKES */
    const likedKey = 'hw_liked_v2';
    let liked = new Set(JSON.parse(localStorage.getItem(likedKey)||'[]'));
    let likes = {};

    window.loadAllLikes = async function loadAllLikes() {
      // Cargar likes por post individualmente cuando se necesite
      document.querySelectorAll('.like-btn[data-id]').forEach(async btn => {
        const id = btn.dataset.id;
        if (!id || id.includes('{')) return;
        try {
          const r = await fetch('/api/likes?post_id=' + encodeURIComponent(id), { credentials: 'include' });
          const d = await r.json();
          likes[id] = d.count || 0;
          const countEl = btn.querySelector('.like-count');
          if (countEl) countEl.textContent = fmt(d.count||0);
          if (d.liked) { liked.add(id); btn.classList.add('liked'); }
        } catch(e) {}
      });
    }

    window.loadAllCommentCounts = async function() {
      document.querySelectorAll('.comment-toggle-btn[data-id]').forEach(async btn => {
        const id = btn.dataset.id;
        if (!id || id.includes('{')) return;
        try {
          const r = await fetch('/api/comments?post_id=' + encodeURIComponent(id), { credentials: 'include' });
          const d = await r.json();
          const count = d.comments ? d.comments.length : 0;
          const countEl = btn.querySelector('.comment-count');
          if (countEl) countEl.textContent = count > 0 ? fmt(count) : '0';
        } catch(e) {}
      });
    };

    window.toggleLikePublic = async function(id) {
      if (!id || id.includes('{')) return;
      return toggleLike(id);
    };
    async function toggleLike(id) {
      if (!id || id.includes('{')) return;
      const wasLiked = liked.has(id);
      if (wasLiked) { liked.delete(id); } else { liked.add(id); }
      localStorage.setItem(likedKey, JSON.stringify([...liked]));
      const newCount = Math.max(0, (likes[id]||0) + (wasLiked ? -1 : 1));
      likes[id] = newCount;
      document.querySelectorAll('.like-btn[data-id="'+id+'"]').forEach(btn => {
        btn.classList.toggle('liked', !wasLiked);
        if (!wasLiked) {
          btn.classList.remove('like-pop');
          void btn.offsetWidth;
          btn.classList.add('like-pop');
          setTimeout(function(){ btn.classList.remove('like-pop'); }, 450);
        }
        const countEl = btn.querySelector('.like-count');
        if (countEl) countEl.textContent = fmt(newCount);
      });
      try {
        const r = await fetch('/api/likes?post_id=' + encodeURIComponent(id), { method: 'POST', credentials: 'include' });
        const d = await r.json();
        if (d.count !== undefined) { likes[id] = d.count; document.querySelectorAll('.like-btn[data-id="'+id+'"]').forEach(b => { const c = b.querySelector('.like-count'); if(c) c.textContent = fmt(d.count); }); }
      } catch(e) {}
    }

    // Event delegation — funciona con cards creados dinámicamente
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.like-btn[data-id]');
      if (btn && btn.dataset.id && !btn.dataset.id.includes('{')) {
        toggleLike(btn.dataset.id);
      }
    });
    if (typeof window.loadAllLikes === 'function') window.loadAllLikes();
    if (typeof window.loadAllCommentCounts === 'function') window.loadAllCommentCounts();

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

    // save-btn handled by collections event delegation below

    /* Render saved + collections when navigating to More */
    document.querySelectorAll('.nav-item[data-page="more"]').forEach(btn => {
      btn.addEventListener('click', function() {
        renderSavedGrid();
        var c = document.getElementById('my-collections-container');
        if (c && typeof window.renderMyCollections === 'function') {
          window.renderMyCollections(c);
        }
      });
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
        if (navigator.share) { try { await navigator.share({url, title:'JUICY STUD'}); } catch(e){} }
        else { await navigator.clipboard.writeText(url).catch(()=>{}); toast('Link copied!'); }
      });
    });

    /* COMMENTS — D1 */
    async function loadComments(postId, listEl, countBtn) {
      try {
        const r = await fetch('/api/comments?post_id=' + encodeURIComponent(postId), { credentials: 'include' });
        const d = await r.json();
        if (d.comments) {
          listEl.innerHTML = '';
          d.comments.forEach(row => addComment(listEl, row.body, false, row.user_name, row.user_avatar, row.user_id));
          if (countBtn) { const c = countBtn.querySelector('.comment-count'); if(c) c.textContent = d.comments.length||0; }
        }
      } catch(e) {}
    }

    function addComment(list, text, animate, userName, userAvatar, userId) {
      const div = document.createElement('div'); div.className = 'comment-item';
      var _avR = (typeof _resolveAvatar==='function') ? _resolveAvatar(userId, userAvatar) : (userAvatar||'');
      const av = _avR ? '<img src="'+_avR+'" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">' : '<div class="comment-av">'+(userName||'HW').charAt(0).toUpperCase()+'</div>';
      const name = userName ? '<span class="comment-username">'+userName+'</span>' : '';
      div.innerHTML = av + '<div class="comment-body">'+name+'<div class="comment-text">'+text+'</div></div>';
      if (animate) { div.style.cssText='opacity:0;transform:translateY(5px);transition:all 0.3s'; requestAnimationFrame(()=>{ div.style.opacity='1'; div.style.transform='translateY(0)'; }); }
      list.appendChild(div);
    }

    // Event delegation para comment toggle — abre panel
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.comment-toggle-btn[data-id]');
      if (!btn) return;
      var id = btn.dataset.id;
      if (!id || id.includes('{')) return;
      if (typeof window.openCommentsPanel === 'function') {
        window.openCommentsPanel(id);
      }
    });

    // Event delegation para save-btn (collections) — touchend capture para mobile
    var _saveTouchStartX = 0, _saveTouchStartY = 0;
    document.addEventListener('touchstart', function(e) {
      var btn = e.target.closest('.save-btn[data-id]');
      if (!btn) return;
      _saveTouchStartX = e.touches[0].clientX;
      _saveTouchStartY = e.touches[0].clientY;
    }, { passive: true });
    document.addEventListener('touchend', function(e) {
      var btn = e.target.closest('.save-btn[data-id]');
      if (!btn) return;
      /* Ignore if user scrolled more than 8px — it was a scroll not a tap */
      var dx = Math.abs(e.changedTouches[0].clientX - _saveTouchStartX);
      var dy = Math.abs(e.changedTouches[0].clientY - _saveTouchStartY);
      if (dx > 8 || dy > 8) return;
      e.preventDefault();
      e.stopPropagation();
      var id = btn.getAttribute('data-id');
      var postUrl = btn.getAttribute('data-url') || '';
      var img = btn.getAttribute('data-img') || '';
      var title = btn.getAttribute('data-title') || '';
      if (typeof window.openCollectionsPanel === 'function') {
        window.openCollectionsPanel(id, postUrl, img, title);
      }
    }, {passive: false, capture: true});
    // Fallback click para desktop
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.save-btn[data-id]');
      if (!btn) return;
      var id = btn.getAttribute('data-id');
      var postUrl = btn.getAttribute('data-url') || '';
      var img = btn.getAttribute('data-img') || '';
      var title = btn.getAttribute('data-title') || '';
      if (typeof window.openCollectionsPanel === 'function') {
        window.openCollectionsPanel(id, postUrl, img, title);
      }
    });

    // Event delegation para sticker btn
    document.addEventListener('click', function(e) {
      var sb = e.target.closest('.sticker-btn[data-sticker-id]');
      if (sb && typeof window.openStickerPanel === 'function') {
        window.openStickerPanel(sb.getAttribute('data-sticker-id'));
      }
    });

    // Event delegation para comment send
    document.addEventListener('click', function(e) {
      var send = e.target.closest('.comment-send[data-id]');
      if (!send) return;
      var id = send.dataset.id;
      if (!id || id.includes('{')) return;
      var section = document.getElementById('comments-'+id);
      var listEl = document.getElementById('clist-'+id);
      var btn = document.querySelector('.comment-toggle-btn[data-id="'+id+'"]');
      var input = section ? section.querySelector('.comment-field[data-id="'+id+'"]') : null;
      if (!input) return;
      async function postComment() {
        const text = input.value.trim(); if (!text) return;
        input.value = '';
        if (listEl) addComment(listEl, text, true);
        try {
          await fetch('/api/comments?post_id=' + encodeURIComponent(id), { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({body: text}) });
          const r = await fetch('/api/comments?post_id=' + encodeURIComponent(id), { credentials: 'include' });
          const d = await r.json();
          if (d.comments && btn) { const c = btn.querySelector('.comment-count'); if(c) c.textContent = d.comments.length; }
        } catch(e) {}
        toast('Posted!');
      }
      send.addEventListener('click', postComment);
      input.addEventListener('keydown', e => { if(e.key==='Enter') postComment(); });
    });

  })();


  /* LOCKER ROOM — separate IIFE, always runs */
  (function() {
    function $(id) { return document.getElementById(id); }
    function fmt(n) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(n); }
    let toastTimer2;
    function toast(msg) {
      const t = $('toast'); if(!t) return;
      t.textContent = msg; t.classList.add('show');
      clearTimeout(toastTimer2);
      toastTimer2 = setTimeout(() => t.classList.remove('show'), 2200);
    }

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

    /* Locker Room Comments — D1 */
    async function loadLRComments(storySlug) {
      const listEl = document.getElementById('lr-comments-list');
      listEl.innerHTML = '';
      try {
        const r = await fetch('/api/comments?post_id=lr_' + encodeURIComponent(storySlug), { credentials: 'include' });
        const d = await r.json();
        if (d.comments) d.comments.forEach(row => addLRComment(row.body, false, row.user_name, row.user_avatar, row.user_id));
      } catch(e) {}
    }

    function addLRComment(text, animate, userName, userAvatar, userId) {
      const listEl = document.getElementById('lr-comments-list');
      const div = document.createElement('div'); div.className = 'lr-comment-item';
      var _avLR = (typeof _resolveAvatar==='function') ? _resolveAvatar(userId, userAvatar) : (userAvatar||'');
      let avHtml = _avLR
        ? '<div class="lr-comment-av"><img src="'+_avLR+'" alt="'+(userName||'User')+'" onerror="this.parentNode.innerHTML=\'HW\'"></div>'
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
      if (window.currentUser) {
        userName = window.currentUser.name || window.currentUser.email.split('@')[0];
        userAvatar = window.currentUser.picture || null;
      }
      addLRComment(text, true, userName, userAvatar, window.currentUser ? window.currentUser.id : null);
      const postId = 'lr_' + lrCurrentStory.slug;
      try { await fetch('/api/comments?post_id=' + encodeURIComponent(postId), { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({body: text}) }); } catch(e) {}
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


/* ── RENDER POST (movido aquí desde hw-community.js) ──
   renderPost es usado por initFeed() para el feed estático principal de Home,
   por eso NO puede vivir en un módulo lazy (hw-community.js carga solo en Threads/Bulge).
   Se mantiene 100% autocontenido — REPORTED_POSTS y timeAgo son su propia copia local. */
(function(){
  function escH(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function timeAgo(d) {
    var s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60)    return 'just now';
    if (s < 3600)  return Math.floor(s/60)+'m ago';
    if (s < 86400) return Math.floor(s/3600)+'h ago';
    return Math.floor(s/86400)+'d ago';
  }
  var REPORTED_POSTS = new Set();
  try { REPORTED_POSTS = new Set(JSON.parse(localStorage.getItem('hw_reported_posts')||'[]')); } catch(e){}

  function renderPost(p) {
    var isAdmin = document.body.classList.contains('is-admin');
    /* isOwn = false si es un repost de contenido ajeno (para poder reportarlo) */
    var _isRepostOfOther = p.repost_of_id && p.repost_user_id && window.currentUser && p.repost_user_id !== window.currentUser.id;
    var isOwn   = window.currentUser && window.currentUser.id === p.user_id && !window._viewingProfileOf && !_isRepostOfOther;
    var reported = REPORTED_POSTS.has(String(p.id));
    var _avUrlP = (window._resolveAvatar||function(u,a){return a||'';})(p.user_id, p.user_avatar);
    var avatar = _avUrlP
      ? '<img src="'+_avUrlP+'" loading="lazy" alt="">'
      : '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="var(--text-dim)" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>';

    /* ── Recopilar URLs de medios ── */
    var mediaUrls = [];
    if (p.image_url) {
      try {
        var parsed = JSON.parse(p.image_url);
        if (Array.isArray(parsed)) mediaUrls = parsed;
        else mediaUrls = [p.image_url];
      } catch(e) { mediaUrls = [p.image_url]; }
    }
    /* También soportar campo images array */
    if (!mediaUrls.length && Array.isArray(p.images)) mediaUrls = p.images.filter(Boolean);

    /* ── Layout de medios estilo Tumblr ── */
    var mediaHtml = '';
    if (mediaUrls.length === 1) {
      var u0 = mediaUrls[0];
      var lo0 = u0.toLowerCase().split('?')[0];
      var isV0 = lo0.endsWith('.mp4')||lo0.endsWith('.webm');
      var enc0 = encodeURIComponent(JSON.stringify(mediaUrls));
      mediaHtml = '<div class="pc-media-wrap" data-tv-urls="'+enc0+'" data-tv-idx="0">'
        + (isV0
          ? '<video class="pc-media-single" src="'+u0+'" muted playsinline controls controlslist="nodownload"></video>'
          : (lo0.endsWith('.gif')
            ? '<img class="pc-media-single" data-lazygif="'+u0+'" alt="">'
            : '<img class="pc-media-single" src="'+u0+'" loading="lazy" alt="">'))
        + '</div>';
    } else if (mediaUrls.length === 2) {
      var enc2 = encodeURIComponent(JSON.stringify(mediaUrls));
      mediaHtml = '<div class="pc-media-wrap pc-media-2col" data-tv-urls="'+enc2+'">';
      mediaUrls.forEach(function(u,i){
        var lo=u.toLowerCase().split('?')[0]; var isV=lo.endsWith('.mp4')||lo.endsWith('.webm');
        mediaHtml += '<div class="pc-media-cell" data-tv-idx="'+i+'">'
          +(isV?'<video src="'+u+'" muted playsinline></video>':(lo.endsWith('.gif')?'<img data-lazygif="'+u+'" alt="">':'<img src="'+u+'" loading="lazy" alt="">'))
          +'</div>';
      });
      mediaHtml += '</div>';
    } else if (mediaUrls.length >= 3) {
      var enc3 = encodeURIComponent(JSON.stringify(mediaUrls));
      mediaHtml = '<div class="pc-media-wrap" data-tv-urls="'+enc3+'">';
      /* 2 arriba */
      mediaHtml += '<div class="pc-media-2col">';
      [0,1].forEach(function(i){
        var u=mediaUrls[i]; var lo=u.toLowerCase().split('?')[0]; var isV=lo.endsWith('.mp4')||lo.endsWith('.webm');
        mediaHtml += '<div class="pc-media-cell" data-tv-idx="'+i+'">'
          +(isV?'<video src="'+u+'" muted playsinline></video>':(lo.endsWith('.gif')?'<img data-lazygif="'+u+'" alt="">':'<img src="'+u+'" loading="lazy" alt="">'))
          +'</div>';
      });
      mediaHtml += '</div>';
      /* 1 abajo completa con +N si hay más */
      var u2 = mediaUrls[2]; var lo2=u2.toLowerCase().split('?')[0]; var isV2=lo2.endsWith('.mp4')||lo2.endsWith('.webm');
      var extra = mediaUrls.length > 3
        ? '<div class="pc-media-more">+' + (mediaUrls.length-3) + '</div>' : '';
      mediaHtml += '<div class="pc-media-cell pc-media-full" data-tv-idx="2">'
        +(isV2?'<video src="'+u2+'" muted playsinline></video>':(lo2.endsWith('.gif')?'<img data-lazygif="'+u2+'" alt="">':'<img src="'+u2+'" loading="lazy" alt="">'))
        +extra+'</div>';
      mediaHtml += '</div>';
    }

    /* ── Repost embed (si es un repost) ── */
    var repostHtml = '';
    if (p.repost_of_id != null && p.repost_of_id !== '') {
      var rpAvSrc = p.repost_avatar || '';
      var rpAvHtml = rpAvSrc
        ? '<img src="'+rpAvSrc+'" alt="">'
        : '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="var(--text-dim)" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
      var rpLo = (p.repost_image_url||'').toLowerCase().split('?')[0];
      var rpIsV = rpLo.endsWith('.mp4')||rpLo.endsWith('.webm');
      var rpMedia = p.repost_image_url
        ? '<div class="pc-repost-media">'+(rpIsV
            ? '<video src="'+p.repost_image_url+'" muted playsinline controls controlslist="nodownload"></video>'
            : '<img src="'+p.repost_image_url+'" loading="lazy" alt="">')+'</div>'
        : '';
      var rpBody = (p.repost_body||'').trim();
      repostHtml = '<div class="pc-repost-header">'
        + '<div class="pc-repost-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></div>'
        + escH(p.user_name||'')+'<span style="opacity:0.6;"> reposted</span></div>'
        + '<div class="pc-repost-embed">'
          + '<div class="pc-repost-embed-header">'
            + '<div class="pc-repost-av">'+rpAvHtml+'</div>'
            + '<div class="pc-repost-name" data-profile-uid="'+escH(p.repost_user_id||'')+'" data-profile-name="'+escH(p.repost_user_name||'')+'" style="cursor:pointer;">'+escH(p.repost_user_name||'')+'</div>'
          + '</div>'
          + rpMedia
          + (rpBody ? '<div class="pc-repost-body">'+escH(rpBody)+'</div>' : '')
        + '</div>';
    }

    /* ── Tags/body ── */
    var bodyTxt = (p.body||'').trim();
    if (bodyTxt === ' ') bodyTxt = '';
    var tagsHtml = '';
    if (bodyTxt) {
      var short = bodyTxt.length > 120 ? bodyTxt.slice(0,120) : bodyTxt;
      var tagged = short.replace(/#(\w+)/g,'<span class="pc-tag">#$1</span>');
      tagsHtml = '<div class="pc-tags">'
        + tagged
        + (bodyTxt.length > 120 ? '<button class="pc-more-btn" data-post-id="'+p.id+'">Ver más</button>' : '')
        + '</div>';
    }

    /* ── HTML del card ── */
    var html = '<div class="post-card" data-post-id="'+p.id+'" data-post-uid="'+escH(p.user_id||'')+'">'
      /* Header: avatar + nombre + fecha */
      + '<div class="pc-header">'
        + '<div class="pc-av" data-profile-uid="'+escH(p.user_id||'')+'" data-profile-name="'+escH(p.user_name||'')+'" style="cursor:pointer;">'+avatar+'</div>'
        + '<div class="pc-meta">'
          + '<div class="pc-name" data-profile-uid="'+escH(p.user_id||'')+'" data-profile-name="'+escH(p.user_name||'')+'" style="cursor:pointer;">'+escH(p.user_name||'')+'</div>'
          + '<div class="pc-date">'+timeAgo(p.created_at)+'</div>'
        + '</div>'
        + '<button class="pc-menu-btn" data-post-id="'+p.id+'">&#8943;</button>'
      + '</div>'
      /* Repost embed (va antes del media propio) */
      + repostHtml
      /* Medios */
      + mediaHtml
      /* Tags */
      + tagsHtml
      /* Acciones */
      + '<div class="pc-actions">'
        + '<button class="pc-act-btn post-comment-btn" data-post-id="'+p.id+'">'
          + '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
          + '<span class="pc-act-count" id="cc-'+p.id+'"></span>'
        + '</button>'
        + '<button class="pc-act-btn post-like-btn'+(LIKED_POSTS.has(String(p.id))?' liked':'')+'" data-post-id="'+p.id+'" data-like-count="'+(p.like_count||0)+'">'
          + '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
          + '<span class="pc-act-count plc">'+(p.like_count||'')+'</span>'
        + '</button>'
        + '<button class="pc-act-btn pc-save-btn" data-post-id="'+p.id+'" title="Save to collection"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>'
        + '<button class="pc-act-btn pc-repost-btn" data-post-id="'+p.id+'" title="Repost">'
          + '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>'
        + '</button>'
        + '<button class="pc-act-btn pc-share-btn" data-post-id="'+p.id+'" title="Share">'
          + '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>'
        + '</button>'
        + (!isOwn ? '<button class="pc-act-btn post-report-btn'+(reported?' reported':'')+'" data-post-id="'+p.id+'">'
          + '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
          + '</button>' : '')
      + '</div>';

    if (isAdmin) {
      html += '<div class="post-admin-bar">'
        + '<button class="adm-del-btn" data-uid="'+escH(p.user_id||'')+'" onclick="window._adminDeletePost('+p.id+',this)" title="Delete">&#128465; Delete</button>'
        + '</div>';
    }

    html += '</div>';
    return html;
  }

  window.renderPost = renderPost;
})();
