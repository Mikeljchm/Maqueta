
/* -- COMMENTS PANEL (Instagram style) -- */
(function(){
  var panelPostId = null;
  var panelOpen = false;

  // CSS
  var s = document.createElement('style');
  s.textContent = [
    '.cp-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:200;backdrop-filter:blur(2px);opacity:0;transition:opacity 0.3s;pointer-events:none;}',
    '.cp-overlay.open{opacity:1;pointer-events:all;}',
    '.cp-panel{position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-radius:20px 20px 0 0;z-index:201;max-height:82vh;display:flex;flex-direction:column;transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);}',
    '.cp-panel.open{transform:translateY(0);}',
    '.cp-handle{display:flex;justify-content:center;padding:0.7rem 0 0.3rem;flex-shrink:0;cursor:pointer;}',
    '.cp-handle-bar{width:36px;height:4px;background:var(--border);border-radius:2px;}',
    '.cp-header{display:flex;align-items:center;justify-content:space-between;padding:0.2rem 1rem 0.7rem;border-bottom:1px solid var(--border);flex-shrink:0;}',
    '.cp-title{font-family:var(--font-d);font-size:1rem;letter-spacing:0.05em;}',
    '.cp-count{color:var(--text-dim);font-size:0.8rem;margin-left:0.3rem;}',
    '.cp-close{background:none;border:none;color:var(--text-dim);font-size:1.3rem;cursor:pointer;padding:0.2rem;}',
    '.cp-list{flex:1;overflow-y:auto;padding:0.8rem 1rem;display:flex;flex-direction:column;gap:0.9rem;}',
    '.cp-empty{text-align:center;color:var(--text-dim);font-size:0.85rem;padding:2rem 0;}',
    '.cp-item{display:flex;gap:0.6rem;align-items:flex-start;}',
    '.cp-av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--fire-deep),var(--fire-red));display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;flex-shrink:0;overflow:hidden;}',
    '.cp-av img{width:100%;height:100%;object-fit:cover;}',
    '.cp-body{flex:1;min-width:0;}',
    '.cp-username{font-size:0.78rem;font-weight:700;color:var(--fire-orange);margin-bottom:0.15rem;}',
    '.cp-text{font-size:0.85rem;line-height:1.4;word-break:break-word;}',
    '.cp-sticker{width:72px;border-radius:10px;display:block;}',
    '.cp-meta{display:flex;gap:0.8rem;margin-top:0.3rem;align-items:center;}',
    '.cp-time{font-size:0.68rem;color:var(--text-dim);}',
    '.cp-stray{border-top:1px solid var(--border);padding:0.5rem;flex-shrink:0;display:none;}',
    '.cp-stray.open{display:block;}',
    '.cp-stray-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;max-height:120px;overflow-y:auto;}',
    '.cp-stray-item{width:100%;padding-bottom:100%;position:relative;cursor:pointer;border-radius:6px;overflow:hidden;background:var(--surface-3);}',
    '.cp-stray-item video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;}',
    '.cp-stray-item:hover{background:var(--surface-2);}',
    '.cp-stray-nav{display:flex;justify-content:space-between;align-items:center;margin-top:0.4rem;}',
    '.cp-stray-btn{background:none;border:1px solid var(--border);color:var(--text-dim);padding:0.2rem 0.7rem;border-radius:6px;font-size:0.7rem;cursor:pointer;}',
    '.cp-stray-btn:hover{border-color:var(--fire-orange);color:var(--fire-orange);}',
    '.cp-stray-page{font-size:0.7rem;color:var(--text-dim);}',
    '.cp-input-area{padding:0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom,0px));border-top:1px solid var(--border);display:flex;align-items:center;gap:0.5rem;flex-shrink:0;}',
    '.cp-sticker-btn{background:none;border:none;font-size:1.3rem;cursor:pointer;flex-shrink:0;padding:0.2rem;}',
    '.cp-input{flex:1;background:var(--surface-3);border:1px solid var(--border);border-radius:20px;padding:0.5rem 0.9rem;color:var(--text);font-family:var(--font-b);font-size:0.85rem;outline:none;}',
    '.cp-input:focus{border-color:var(--fire-orange);}',
    '.cp-send{background:var(--fire-orange);border:none;color:#fff;padding:0.5rem 1rem;border-radius:20px;font-family:var(--font-d);font-size:0.85rem;cursor:pointer;letter-spacing:0.05em;}'
  ].join('');
  document.head.appendChild(s);

  // Crear panel
  var overlay = document.createElement('div');
  overlay.className = 'cp-overlay';
  overlay.addEventListener('click', closePanel);

  var panel = document.createElement('div');
  panel.className = 'cp-panel';
  panel.innerHTML = '<div class="cp-handle" id="cp-handle"><div class="cp-handle-bar"></div></div>'
    + '<div class="cp-header">'
    + '<div><span class="cp-title">Comments</span><span class="cp-count" id="cp-count"></span></div>'
    + '<button class="cp-close" id="cp-close">&#10005;</button>'
    + '</div>'
    + '<div class="cp-list" id="cp-list"></div>'
    + '<div class="cp-stray" id="cp-stray">'
    + '<div class="cp-stray-grid" id="cp-stray-grid"></div>'
    + '<div class="cp-stray-nav">'
    + '<button class="cp-stray-btn" id="cp-stray-prev">&#8592; Prev</button>'
    + '<span class="cp-stray-page" id="cp-stray-page">1 / 16</span>'
    + '<button class="cp-stray-btn" id="cp-stray-next">Next &#8594;</button>'
    + '</div></div>'
    + '<div class="cp-input-area">'
    + '<button class="cp-sticker-btn" id="cp-sticker-btn">&#128520;</button>'
    + '<input class="cp-input" id="cp-input" placeholder="Add a comment..." maxlength="500">'
    + '<button class="cp-send" id="cp-send">POST</button>'
    + '</div>';

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  // Sticker tray
  var strayPage = 0;
  var STRAY_TOTAL = 16;
  var strayOpen = false;

  function loadStrayPage(page) {
    var grid = document.getElementById('cp-stray-grid');
    var pageEl = document.getElementById('cp-stray-page');
    if (!grid) return;
    grid.innerHTML = '';
    fetch('/assets/data/stickers_' + page + '.json')
      .then(function(r){ return r.json(); })
      .then(function(data) {
        strayPage = page;
        if (pageEl) pageEl.textContent = (page+1) + ' / ' + STRAY_TOTAL;
        data.forEach(function(url) {
          var item = document.createElement('div');
          item.className = 'cp-stray-item';
          item.innerHTML = '<video src="' + url + '" autoplay loop muted playsinline></video>';
          item.addEventListener('click', function(){ sendSticker(url); });
          grid.appendChild(item);
        });
      });
  }

  function sendSticker(url) {
    if (!panelPostId) return;
    var marker = '[sticker]' + url + '[/sticker]';
    fetch('/api/comments?post_id=' + encodeURIComponent(panelPostId), {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: marker })
    }).then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.ok || d.id) {
        addToPanel(marker, '', '');
        updateCount(1);
        // Cerrar stray
        var stray = document.getElementById('cp-stray');
        if (stray) stray.classList.remove('open');
        strayOpen = false;
      }
    }).catch(function(){});
  }

  document.getElementById('cp-sticker-btn').addEventListener('click', function() {
    var stray = document.getElementById('cp-stray');
    strayOpen = !strayOpen;
    stray.classList.toggle('open', strayOpen);
    if (strayOpen && !document.getElementById('cp-stray-grid').children.length) {
      loadStrayPage(0);
    }
  });

  document.getElementById('cp-stray-prev').addEventListener('click', function() {
    if (strayPage > 0) loadStrayPage(strayPage - 1);
  });
  document.getElementById('cp-stray-next').addEventListener('click', function() {
    if (strayPage < STRAY_TOTAL - 1) loadStrayPage(strayPage + 1);
  });

  // Swipe down para cerrar
  var touchStartY = 0;
  document.getElementById('cp-handle').addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.getElementById('cp-handle').addEventListener('touchend', function(e) {
    var dy = e.changedTouches[0].clientY - touchStartY;
    if (dy > 60) closePanel();
  }, { passive: true });

  document.getElementById('cp-close').addEventListener('click', closePanel);

  function renderComment(text, userName, userAvatar) {
    var item = document.createElement('div');
    item.className = 'cp-item';
    var avContent = userAvatar
      ? '<img src="' + userAvatar + '">'
      : (userName || 'J').charAt(0).toUpperCase();
    var stickerMatch = text ? text.match(/\[sticker\]([^\[]+)\[\/sticker\]/) : null;
    var bodyContent = stickerMatch
      ? '<video class="cp-sticker" src="' + stickerMatch[1] + '" autoplay loop muted playsinline></video>'
      : '<div class="cp-text">' + (text || '') + '</div>';
    item.innerHTML = '<div class="cp-av">' + avContent + '</div>'
      + '<div class="cp-body">'
      + (userName ? '<div class="cp-username">' + userName + '</div>' : '')
      + bodyContent
      + '<div class="cp-meta"><span class="cp-time">just now</span></div>'
      + '</div>';
    return item;
  }

  function addToPanel(text, userName, userAvatar) {
    var list = document.getElementById('cp-list');
    if (!list) return;
    var empty = list.querySelector('.cp-empty');
    if (empty) empty.remove();
    var item = renderComment(text, userName, userAvatar);
    list.appendChild(item);
    list.scrollTop = list.scrollHeight;
  }

  function updateCount(delta) {
    var el = document.getElementById('cp-count');
    if (!el) return;
    var cur = parseInt(el.textContent.replace(/[^0-9]/g,'')) || 0;
    el.textContent = ' \u2022 ' + (cur + delta);
    // Actualizar el botón del card también
    if (panelPostId) {
      var btn = document.querySelector('.comment-toggle-btn[data-id="' + panelPostId + '"]');
      if (btn) {
        var c = btn.querySelector('.comment-count');
        if (c) c.textContent = cur + delta;
      }
    }
  }

  // Send comment
  document.getElementById('cp-send').addEventListener('click', function() {
    var input = document.getElementById('cp-input');
    var text = input.value.trim();
    if (!text || !panelPostId) return;
    input.value = '';
    fetch('/api/comments?post_id=' + encodeURIComponent(panelPostId), {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text })
    }).then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.ok || d.id) {
        addToPanel(text, window.currentUser ? (window.currentUser.name || 'You') : 'You',
          window.currentUser ? window.currentUser.picture : '');
        updateCount(1);
      }
    }).catch(function(){});
  });

  // Enter para enviar
  document.getElementById('cp-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('cp-send').click();
  });

  // Abrir panel
  window.openCommentsPanel = function(postId) {
    panelPostId = postId;
    panelOpen = true;
    var list = document.getElementById('cp-list');
    list.innerHTML = '<div class="cp-empty">Loading...</div>';
    document.getElementById('cp-count').textContent = '';
    // Cerrar stray si estaba abierto
    var stray = document.getElementById('cp-stray');
    if (stray) stray.classList.remove('open');
    strayOpen = false;
    overlay.classList.add('open');
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Cargar comentarios
    fetch('/api/comments?post_id=' + encodeURIComponent(postId), { credentials: 'include' })
      .then(function(r){ return r.json(); })
      .then(function(d) {
        list.innerHTML = '';
        if (!d.comments || !d.comments.length) {
          list.innerHTML = '<div class="cp-empty">No comments yet. Be the first!</div>';
        } else {
          d.comments.forEach(function(row) {
            list.appendChild(renderComment(row.body, row.user_name, row.user_avatar));
          });
          list.scrollTop = list.scrollHeight;
        }
        document.getElementById('cp-count').textContent = ' \u2022 ' + (d.comments ? d.comments.length : 0);
      })
      .catch(function() {
        list.innerHTML = '<div class="cp-empty">Error loading comments.</div>';
      });
  };

  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    panelOpen = false;
    panelPostId = null;
  }

})();



/* -- STICKERS EN COMENTARIOS -- */
(function(){
  var TOTAL_PAGES = 16;
  var currentPage = 0;
  var stickers = [];
  var panelOpen = false;
  var activePostId = null;

  var style = document.createElement('style');
  style.textContent = [
    '.sticker-btn{background:none;border:none;cursor:pointer;padding:0.3rem;color:var(--text-dim);font-size:1.1rem;vertical-align:middle;}',
    '.sticker-btn:hover{color:var(--fire-orange);}',
    '.sticker-panel{position:fixed;bottom:60px;left:50%;transform:translateX(-50%);width:min(360px,95vw);background:var(--surface-2);border:1px solid var(--border);border-radius:16px;z-index:999;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.6);}',
    '.sticker-panel-header{display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0.9rem;border-bottom:1px solid var(--border);}',
    '.sticker-panel-title{font-family:var(--font-d);font-size:0.9rem;letter-spacing:0.05em;color:var(--fire-orange);}',
    '.sticker-panel-close{background:none;border:none;color:var(--text-dim);font-size:1.2rem;cursor:pointer;}',
    '.sticker-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:0.6rem;max-height:260px;overflow-y:auto;}',
    '.sticker-item{width:100%;padding-bottom:100%;position:relative;cursor:pointer;border-radius:8px;overflow:hidden;background:var(--surface-3);}',
    '.sticker-item video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;}',
    '.sticker-item:hover{background:var(--surface);}',
    '.sticker-panel-nav{display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0.9rem;border-top:1px solid var(--border);}',
    '.sticker-nav-btn{background:none;border:1px solid var(--border);color:var(--text);padding:0.3rem 0.8rem;border-radius:8px;cursor:pointer;font-size:0.75rem;}',
    '.sticker-nav-btn:hover{border-color:var(--fire-orange);color:var(--fire-orange);}',
    '.sticker-page-info{font-size:0.75rem;color:var(--text-dim);}',
    '.comment-sticker{max-width:80px;border-radius:8px;display:block;}'
  ].join('');
  document.head.appendChild(style);

  // Crear panel una sola vez
  var panel = document.createElement('div');
  panel.className = 'sticker-panel';
  panel.style.display = 'none';
  panel.innerHTML = '<div class="sticker-panel-header">'
    + '<span class="sticker-panel-title">STICKERS</span>'
    + '<button class="sticker-panel-close" onclick="window.closeStickerPanel()">&#10005;</button>'
    + '</div>'
    + '<div class="sticker-grid" id="sticker-grid"></div>'
    + '<div class="sticker-panel-nav">'
    + '<button class="sticker-nav-btn" onclick="window.stickerPrev()">&#8592; Prev</button>'
    + '<span class="sticker-page-info" id="sticker-page-info">1 / ' + TOTAL_PAGES + '</span>'
    + '<button class="sticker-nav-btn" onclick="window.stickerNext()">Next &#8594;</button>'
    + '</div>';
  document.body.appendChild(panel);

  function loadPage(page) {
    var grid = document.getElementById('sticker-grid');
    var info = document.getElementById('sticker-page-info');
    if (!grid) return;
    grid.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-dim);font-size:0.8rem;">Loading...</div>';
    fetch('/assets/data/stickers_' + page + '.json')
      .then(function(r){ return r.json(); })
      .then(function(data) {
        stickers = data;
        currentPage = page;
        if (info) info.textContent = (page+1) + ' / ' + TOTAL_PAGES;
        grid.innerHTML = '';
        data.forEach(function(url) {
          var item = document.createElement('div');
          item.className = 'sticker-item';
          item.innerHTML = '<video src="' + url + '" autoplay loop muted playsinline></video>';
          item.addEventListener('click', function() {
            sendSticker(url);
          });
          grid.appendChild(item);
        });
      })
      .catch(function() {
        grid.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-dim);">Error loading</div>';
      });
  }

  function sendSticker(url) {
    if (!activePostId) return;
    // Enviar como comentario con URL del sticker
    var marker = '[sticker]' + url + '[/sticker]';
    fetch('/api/comments?post_id=' + encodeURIComponent(activePostId), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: marker })
    }).then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.ok || d.id) {
        // Agregar al DOM
        var listEl = document.getElementById('clist-' + activePostId);
        if (!listEl) {
          // Buscar por selector más flexible
          var btn = document.querySelector('.comment-toggle-btn[data-id="' + activePostId + '"]');
          if (btn) {
            var card = btn.closest('.post-card');
            if (card) listEl = card.querySelector('.comments-list');
          }
        }
        if (listEl) {
          var div = document.createElement('div');
          div.className = 'comment-item';
          div.innerHTML = '<video class="comment-sticker" src="' + url + '" autoplay loop muted playsinline></video>';
          listEl.appendChild(div);
        }
        window.closeStickerPanel();
      }
    }).catch(function(){});
  }

  window.openStickerPanel = function(postId) {
    activePostId = postId;
    panel.style.display = 'block';
    panelOpen = true;
    loadPage(0);
  };

  window.closeStickerPanel = function() {
    panel.style.display = 'none';
    panelOpen = false;
  };

  window.stickerNext = function() {
    if (currentPage < TOTAL_PAGES - 1) loadPage(currentPage + 1);
  };

  window.stickerPrev = function() {
    if (currentPage > 0) loadPage(currentPage - 1);
  };

  // Cerrar al tocar fuera
  document.addEventListener('click', function(e) {
    if (panelOpen && !panel.contains(e.target) && !e.target.closest('.sticker-btn')) {
      window.closeStickerPanel();
    }
  });
})();

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

/* ── DOUBLE TAP LIKE + EMOJI EXPLOSION ── */
(function(){
  var EMOJIS = ['❤️','😈','💋','😋','😏','💦','🪶','🍆','🍑','🔥'];
  var lastTap = {};
  var blocked = {};
  var DELAY = 280;

  var style = document.createElement('style');
  style.textContent = [
    '.dtap-zone{position:relative;overflow:hidden;}',
    '.dtap-emoji{position:absolute;pointer-events:none;font-size:3.5rem;transform:translate(-50%,-50%) scale(0);animation:dtap-pop 0.9s cubic-bezier(0.16,1,0.3,1) forwards;z-index:99;}',
    '@keyframes dtap-pop{0%{transform:translate(-50%,-50%) scale(0);opacity:1;}40%{transform:translate(-50%,-80%) scale(1.4);opacity:1;}100%{transform:translate(-50%,-170%) scale(0.8);opacity:0;}}',
    '.like-btn.liked svg{fill:var(--fire-orange);stroke:var(--fire-orange);}',
    '.like-btn svg{transition:fill 0.25s,stroke 0.25s;}',
    '.like-btn.like-pop svg{animation:like-pop 0.45s cubic-bezier(0.16,1,0.3,1) forwards;}',
    '@keyframes like-pop{0%{transform:scale(1);}15%{transform:scale(0.75);}50%{transform:scale(1.45);}75%{transform:scale(1.15);}100%{transform:scale(1);}}',
    '.like-btn-emoji{display:inline-block;font-size:1.2rem;animation:like-emoji-pop 1s cubic-bezier(0.16,1,0.3,1) forwards;}',
    '@keyframes like-emoji-pop{0%{transform:scale(0);opacity:1;}40%{transform:scale(1.6);opacity:1;}70%{transform:scale(1.2);opacity:1;}100%{transform:scale(1);opacity:1;}}'
  ].join('');
  document.head.appendChild(style);

  function pick(){ return EMOJIS[Math.floor(Math.random()*EMOJIS.length)]; }

  function spawnEmoji(zone, x, y, emoji) {
    var el = document.createElement('div');
    el.className = 'dtap-emoji';
    el.textContent = emoji || pick();
    el.style.left = x+'px';
    el.style.top = y+'px';
    zone.appendChild(el);
    setTimeout(function(){ el.remove(); }, 950);
  }

  function triggerLike(zone, emoji) {
    var postId = zone.getAttribute('data-postid');
    if (!postId) return;
    var card = zone.closest('.post-card');
    if (!card) return;
    var likeBtn = card.querySelector('.like-btn');
    if (likeBtn) {
      var svg = likeBtn.querySelector('svg');
      var countEl = likeBtn.querySelector('.like-count');
      if (svg) {
        var span = document.createElement('span');
        span.className = 'like-btn-emoji';
        span.textContent = emoji;
        likeBtn.insertBefore(span, svg);
        svg.style.display = 'none';
        setTimeout(function(){
          span.remove();
          svg.style.display = '';
          likeBtn.classList.add('liked');
        }, 1000);
      }
      likeBtn.classList.add('liked');
      if (countEl) countEl.textContent = (parseInt(countEl.textContent)||0) + 1;
    }
    if (zone.getAttribute('data-liked') !== 'true') {
      zone.setAttribute('data-liked', 'true');
      if (typeof window.toggleLikePublic === 'function') window.toggleLikePublic(postId);
    }
  }

  // touchstart capture — detectar doble tap antes que el <a>
  document.addEventListener('touchstart', function(e) {
    var zone = e.target.closest('.dtap-zone');
    if (!zone) return;
    var id = zone.getAttribute('data-postid') || 'x';
    var now = Date.now();
    if (lastTap[id] && (now - lastTap[id]) < DELAY) {
      lastTap[id] = 0;
      blocked[id] = true;
      e.preventDefault();
      e.stopPropagation();
      var rect = zone.getBoundingClientRect();
      var t = e.touches[0];
      var x = t.clientX - rect.left;
      var y = t.clientY - rect.top;
      var emoji = pick();
      spawnEmoji(zone, x, y, emoji);
      spawnEmoji(zone, x+(Math.random()*50-25), y+(Math.random()*50-25), pick());
      spawnEmoji(zone, x+(Math.random()*50-25), y+(Math.random()*50-25), pick());
      triggerLike(zone, emoji);
    } else {
      lastTap[id] = now;
      blocked[id] = false;
    }
  }, {passive: false, capture: true});

  // touchend y click capture — bloquar si fue doble tap
  function blockIfNeeded(e) {
    var zone = e.target.closest('.dtap-zone');
    if (!zone) return;
    var id = zone.getAttribute('data-postid') || 'x';
    if (blocked[id]) {
      blocked[id] = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }
  document.addEventListener('touchend', blockIfNeeded, {passive: false, capture: true});
  document.addEventListener('click', blockIfNeeded, {capture: true});

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
      mediaHTML = '<div class="card-media-container dtap-zone" data-postid="'+(post.path||String(idx))+'" data-posturl="'+post.url+'" data-liked="false"><a href="'+post.url+'" class="card-media-wrap"><img class="card-first-photo" src="'+imgs[0]+'" alt="'+escH(post.title)+'" loading="lazy" decoding="async"></a>'+(post.adult ? adultOverlay(idx) : '')+'</div>';
    } else if (imgs.length === 2) {
      mediaHTML = '<div class="card-media-container"><a href="'+post.url+'" class="card-media-wrap"><div class="card-duo-grid"><img src="'+imgs[0]+'" alt="" loading="lazy" decoding="async"><img src="'+imgs[1]+'" alt="" loading="lazy" decoding="async"></div></a>'+(post.adult ? adultOverlay(idx) : '')+'</div>';
    } else if (imgs.length > 2) {
      mediaHTML = '<div class="card-media-container dtap-zone" data-postid="'+(post.path||String(idx))+'" data-posturl="'+post.url+'" data-liked="false"><div class="card-media-wrap"><a href="'+post.url+'" style="display:block;"><img class="card-first-photo" src="'+imgs[0]+'" alt="'+escH(post.title)+'" loading="lazy" decoding="async"><div class="card-photo-peek"><img src="'+imgs[1]+'" alt="" loading="lazy" decoding="async"></div></a><a href="'+post.url+'" class="card-see-all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></a></div>'+(post.adult ? adultOverlay(idx) : '')+'</div>';
    }

    var descHTML = post.description ? '<div class="card-desc collapsed" id="desc-'+idx+'">'+hashtagify(post.description)+'</div><button class="card-read-more visible" data-desc="desc-'+idx+'">more</button>' : '';
    var titleHTML = post.title ? '<div class="card-title"><a href="'+post.url+'">'+escH(post.title)+'</a></div>' : '';

    return '<article class="post-card'+(post.adult ? ' adult-card' : '')+'" data-cat="'+(post.category||'')+'" data-idx="'+idx+'" data-adult="'+(post.adult||false)+'" data-path="'+escH(post.path||'')+'" data-title="'+escH(post.title||'')+'" data-desc="'+escH(post.description||'')+'" data-category="'+(post.category||'')+'" data-poster="'+escH(post.poster||'')+'" data-date="'+(post.date||'')+'" data-images="'+escH(JSON.stringify((post.images&&post.images.length>0)?post.images:(post.image?[post.image]:[])))+'" data-videos="'+escH(JSON.stringify(post.videos||[]))+'" data-links="'+escH(JSON.stringify(post.links||[]))+'" data-featured="'+(post.featured||false)+'">'
      +'<div class="card-header"><div class="card-avatar" style="background:linear-gradient(135deg,var(--fire-deep),var(--fire-red));display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" width="18" height="18" fill="var(--fire-orange)"><path d="M12 2s-5 5.5-5 10a5 5 0 0010 0c0-4.5-5-10-5-10zm0 14a3 3 0 01-3-3c0-2 1.5-4.5 3-7 1.5 2.5 3 5 3 7a3 3 0 01-3 3z"/></svg></div><div class="card-meta"><div class="card-author">'+(post.category ? (post.category.charAt(0).toUpperCase()+post.category.slice(1)) : 'General')+'</div><div class="card-cat-label">JUICY STUD</div></div><div class="card-date">'+(post.date||'')+'</div></div>'
      +mediaHTML
      +'<div class="card-body">'+titleHTML+descHTML+'</div>'+'<div class="card-poll" style="padding:0 0.8rem;"></div>'
      +'<div class="card-actions">'
      +'<button class="card-act-btn comment-toggle-btn" data-id="'+(post.path||String(idx))+'"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span class="comment-count">0</span></button>'
      +'<button class="card-act-btn save-btn" data-id="'+(post.path||String(idx))+'" data-url="'+(post.url||'')+'" data-img="'+(post.poster||post.image||'')+'" data-title="'+escH(post.title||'')+'"><svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg><span class="save-count"></span></button>'
      +'<button class="card-act-btn like-btn" data-id="'+(post.path||String(idx))+'"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><span class="like-count">0</span></button>'
      +'<button class="card-act-btn share-btn" data-url="'+post.url+'"><svg viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg></button>'
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
    renderBatch();
  }

  window.setFeedFilter = function(cat) {
    activeFilter = cat || 'all';
    resetFeed();
  };

  // Intersection Observer para infinite scroll
  function initObserver() {
    var sentinel = document.getElementById('feed-sentinel');
    if (!sentinel) return;
    var observer = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting && !LOADING && LOADED < getFilteredPosts().length) {
        LOADING = true;
        var loader = document.getElementById('feed-loader');
        if (loader) loader.style.display = 'flex';
        setTimeout(renderBatch, 100);
      }
    }, { rootMargin: '200px' });
    observer.observe(sentinel);
  }

  function initFeed() {
    fetch('/assets/data/posts.json')
      .then(function(r){ return r.json(); })
      .then(function(data) {
        ALL_POSTS = data || [];
        renderBatch();
        initObserver();
      })
      .catch(function() {
        var container = document.getElementById('feed-container');
        if (container) container.innerHTML = '<div class="empty-feed"><p>No posts yet.</p></div>';
      });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeed);
  } else {
    initFeed();
  }
})();

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
      toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
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
            d.comments.forEach(row => addComment(listEl, row.body, false, row.user_name, row.user_avatar));
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



      function addComment(list, text, animate, userName, userAvatar) {
        const div = document.createElement('div'); div.className = 'comment-item';
        const av = userAvatar ? '<img src="'+userAvatar+'" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">' : '<div class="comment-av">'+(userName||'HW').charAt(0).toUpperCase()+'</div>';
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
          void btn.querySelector('svg') && btn.querySelector('svg').offsetWidth;
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
          d.comments.forEach(row => addComment(listEl, row.body, false, row.user_name, row.user_avatar));
          if (countBtn) { const c = countBtn.querySelector('.comment-count'); if(c) c.textContent = d.comments.length||0; }
        }
      } catch(e) {}
    }

    function addComment(list, text, animate, userName, userAvatar) {
      const div = document.createElement('div'); div.className = 'comment-item';
      const av = userAvatar ? '<img src="'+userAvatar+'" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">' : '<div class="comment-av">'+(userName||'HW').charAt(0).toUpperCase()+'</div>';
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

    // Event delegation para save-btn (collections)
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.save-btn[data-id]');
      if (btn) {
        var id = btn.getAttribute('data-id');
        var url = btn.getAttribute('data-url') || '';
        var img = btn.getAttribute('data-img') || '';
        var title = btn.getAttribute('data-title') || '';
        if (typeof window.openCollectionsPanel === 'function') {
          window.openCollectionsPanel(id, url, img, title);
        }
        return;
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
        if (d.comments) d.comments.forEach(row => addLRComment(row.body, false, row.user_name, row.user_avatar));
      } catch(e) {}
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

  /* ── HW FAN AUTH — Cloudflare Pages ── */
  const HottAuth = {
    _session: null, _cb: [], _CACHE_KEY: 'hw_s', _TTL: 300000,
    async init() {
      try {
        const raw = sessionStorage.getItem(this._CACHE_KEY);
        if(raw){ const c=JSON.parse(raw); if(Date.now()-c.t<this._TTL){ this._session=c.d; this._cb.forEach(fn=>fn(this._session)); return this._session; } }
      } catch(e){}
      try {
        const r = await fetch('/auth/google/session',{credentials:'include'});
        const d = await r.json();
        this._session = d.authenticated ? d.user : null;
        try { sessionStorage.setItem(this._CACHE_KEY, JSON.stringify({d:this._session,t:Date.now()})); } catch(e){}
      } catch { this._session = null; }
      this._cb.forEach(fn => fn(this._session)); return this._session;
    },
    login() { sessionStorage.removeItem(this._CACHE_KEY); window.location.href = '/auth/google/login?redirect=' + encodeURIComponent(window.location.href); },
    logout() { sessionStorage.removeItem(this._CACHE_KEY); window.location.href = '/auth/google/logout?redirect=' + encodeURIComponent(window.location.href); },
    isAuthenticated() { return !!this._session; },
    getUser() { return this._session; },
    onChange(fn) { this._cb.push(fn); }
  };

  let currentUser = null;

  /* GOOGLE ONE TAP CALLBACK */


  function openAuthModal() {
    if (currentUser) return;
    document.getElementById('auth-modal').classList.add('open');
  }

  function openAuthModalFallback() {
    document.getElementById('auth-modal').classList.add('open');
  }

  function closeAuthModal() {
    document.getElementById('auth-modal').classList.remove('open');
  }

  function signInWithGoogle() { HottAuth.login(); }

  function signOut() { HottAuth.logout(); }

  function updateAuthUI(user) {
    const nameEl = document.getElementById('user-display-name');
    const emailEl = document.getElementById('user-display-email');
    const avatarWrap = document.getElementById('user-avatar-wrap');
    const actionBtn = document.getElementById('user-action-btn');

    if (user) {
      const name = user.name || user.email.split('@')[0];
      const avatar = user.picture || '';
      const email = user.email || '';

      if (nameEl) nameEl.textContent = name;
      if (emailEl) emailEl.textContent = email;
      if (avatarWrap) {
        if (avatar) {
          avatarWrap.innerHTML = '<img class="user-avatar" src="' + avatar + '" alt="' + name + '">';
        } else {
          avatarWrap.innerHTML = '<div class="user-avatar-placeholder"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>';
        }
      }
      if (actionBtn) {
        actionBtn.textContent = 'Sign Out';
        actionBtn.onclick = signOut;
        actionBtn.className = 'user-logout-btn';
      }
    } else {
      if (nameEl) nameEl.textContent = 'Sign in to unlock +18 content';
      if (emailEl) emailEl.textContent = 'Free \u00b7 No credit card needed';
      if (avatarWrap) avatarWrap.innerHTML = '<div class="user-avatar-placeholder"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>';
      if (actionBtn) {
        actionBtn.textContent = 'Sign In';
        actionBtn.onclick = openAuthModal;
        actionBtn.className = 'user-login-btn';
      }
    }
  }

  function applyAdultBlur() {
    const isLoggedIn = !!currentUser;
    document.querySelectorAll('.adult-card').forEach(card => {
      const overlay = card.querySelector('.adult-overlay');
      if (isLoggedIn) {
        card.classList.remove('adult-blur');
        if (overlay) overlay.style.display = 'none';
      } else {
        card.classList.add('adult-blur');
        if (overlay) overlay.style.display = 'flex';
      }
    });
  }

  /* Init auth — después del render para no bloquear */
  document.addEventListener('DOMContentLoaded', async function initAuth() {
    const session = await HottAuth.init();
    if (session) {
      currentUser = session;
      updateAuthUI(currentUser);
    }
    applyAdultBlur();

    HottAuth.onChange(s => {
      if (s) {
        currentUser = s;
        updateAuthUI(currentUser);
        closeAuthModal();
      } else {
        currentUser = null;
        updateAuthUI(null);
        document.body.classList.remove('is-admin');
      }
      applyAdultBlur();
    });
  });

  /* ADMIN INLINE EDIT */
  const ADMIN_LOGIN = 'Mikeljchm';
  var editingCard = null;

  // Check admin session from cookie
  function getAdminSession() {
    const match = document.cookie.match(/hw_admin=([^;]+)/);
    if (!match) return null;
    try { return JSON.parse(atob(match[1])); } catch(e) { return null; }
  }

  function initAdmin() {
    const session = getAdminSession();
    if (session && session.login === ADMIN_LOGIN) {
      document.body.classList.add('is-admin');
    }
    // Show login button only if ?admin=true in URL
    if (new URLSearchParams(window.location.search).get('admin') === 'true') {
      document.body.classList.add('show-admin-btn');
    }
  }
  initAdmin();

  var editMode = 'edit'; // 'edit' or 'new'

  function openNewPost() {
    editMode = 'new';
    editingCard = null;
    document.getElementById('edit-sheet-title').textContent = 'New Post';
    document.getElementById('edit-save-btn').textContent = 'Create Post';
    document.getElementById('edit-delete-btn').style.display = 'none';
    // Clear all fields
    ['edit-title-input','edit-desc-input','edit-cat-input','edit-poster-input','edit-images-input','edit-videos-input','edit-links-input'].forEach(function(id){
      document.getElementById(id).value = '';
    });
    document.getElementById('edit-date-input').value = new Date().toISOString().split('T')[0];
    document.getElementById('edit-adult-toggle').checked = false;
    document.getElementById('edit-featured-toggle').checked = false;
    document.getElementById('edit-draft-toggle').checked = false;
    document.getElementById('edit-status').textContent = '';
    document.getElementById('edit-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function openInlineEdit(card) {
    editMode = 'edit';
    editingCard = card;
    document.getElementById('edit-sheet-title').textContent = 'Edit Post';
    document.getElementById('edit-save-btn').textContent = 'Save';
    document.getElementById('edit-delete-btn').style.display = '';
    document.getElementById('edit-title-input').value = card.dataset.title || '';
    document.getElementById('edit-desc-input').value = card.dataset.desc || '';
    document.getElementById('edit-cat-input').value = card.dataset.category || '';
    document.getElementById('edit-poster-input').value = card.dataset.poster || '';
    document.getElementById('edit-date-input').value = card.dataset.date || '';
    try { var _imgs = JSON.parse(card.dataset.images || '[]'); if (!_imgs.length && card.dataset.poster) _imgs = [card.dataset.poster]; document.getElementById('edit-images-input').value = _imgs.join('\n'); } catch(e) { document.getElementById('edit-images-input').value = card.dataset.poster || ''; }
    try {
      var vids = JSON.parse(card.dataset.videos || '[]');
      document.getElementById('edit-videos-input').value = vids.map(function(v){ return v.url + (v.poster ? ' | ' + v.poster : ''); }).join('\n');
    } catch(e) { document.getElementById('edit-videos-input').value = ''; }
    try {
      var links = JSON.parse(card.dataset.links || '[]');
      document.getElementById('edit-links-input').value = links.map(function(l){ return l.label + ' | ' + l.url; }).join('\n');
    } catch(e) { document.getElementById('edit-links-input').value = ''; }
    document.getElementById('edit-adult-toggle').checked = card.dataset.adult === 'true';
    document.getElementById('edit-featured-toggle').checked = card.dataset.featured === 'true';
    document.getElementById('edit-draft-toggle').checked = card.dataset.draft === 'true';
    document.getElementById('edit-status').textContent = '';
    document.getElementById('edit-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('open');
    document.body.style.overflow = '';
    editingCard = null;
  }

  window.addPollOption = function() {
    var container = document.getElementById('poll-opts-container');
    if (!container) return;
    var n = container.querySelectorAll('.poll-opt-row').length + 1;
    var row = document.createElement('div');
    row.className = 'poll-opt-row';
    row.style.cssText = 'display:flex;gap:0.3rem;margin-bottom:0.3rem;';
    row.innerHTML = '<input class="edit-input poll-opt-label-input" placeholder="Option ' + n + '" style="flex:2;">'
      + '<input class="edit-input poll-opt-img-input" placeholder="Image URL (optional)" style="flex:3;">';
    container.appendChild(row);
  };

  window.savePoll = async function() {
    if (!editingCard) return;
    var postId = editingCard.dataset.path;
    if (!postId) return;
    var question = document.getElementById('edit-poll-question').value.trim();
    // Leer todas las opciones dinámicamente
    var opts = [];
    document.querySelectorAll('.poll-opt-row').forEach(function(row) {
      var label = row.querySelector('.poll-opt-label-input').value.trim();
      var image = row.querySelector('.poll-opt-img-input').value.trim();
      if (label) opts.push(image ? { label: label, image: image } : label);
    });
    var status = document.getElementById('poll-status');
    if (!question || opts.length < 2) { status.textContent = 'Need question + 2 options'; return; }
    try {
      var r = await fetch('/api/polls?post_id=' + encodeURIComponent(postId), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', question, options: opts })
      });
      var d = await r.json();
      if (d.ok) {
        status.textContent = 'Poll saved!';
        // Recargar la encuesta en el card
        var pollContainer = editingCard.querySelector('.card-poll');
        if (pollContainer) window.loadPoll(postId, pollContainer);
      }
    } catch(e) { status.textContent = 'Error saving poll'; }
  };

  async function saveEdit() {
    if (editMode === 'edit' && !editingCard) return;
    const btn = document.getElementById('edit-save-btn');
    const status = document.getElementById('edit-status');
    const filePath = editingCard ? editingCard.dataset.path : null;
    if (editMode === 'edit' && !filePath) { status.textContent = 'Error: no file path'; return; }
    const title = document.getElementById('edit-title-input').value.trim();
    const desc = document.getElementById('edit-desc-input').value.trim();
    const category = document.getElementById('edit-cat-input').value.trim();
    const poster = document.getElementById('edit-poster-input').value.trim();
    const date = document.getElementById('edit-date-input').value.trim();
    const adult = document.getElementById('edit-adult-toggle').checked;
    const featured = document.getElementById('edit-featured-toggle').checked;
    const draft = document.getElementById('edit-draft-toggle').checked;
    const images = document.getElementById('edit-images-input').value.split('\n').map(function(l){return l.trim();}).filter(Boolean);
    const videos = document.getElementById('edit-videos-input').value.split('\n').map(function(l){
      var parts = l.split('|').map(function(p){return p.trim();});
      return parts[0] ? {url:parts[0],poster:parts[1]||''} : null;
    }).filter(Boolean);
    const links = document.getElementById('edit-links-input').value.split('\n').map(function(l){
      var parts = l.split('|').map(function(p){return p.trim();});
      return parts[0]&&parts[1] ? {label:parts[0],url:parts[1]} : null;
    }).filter(Boolean);
    btn.classList.add('edit-saving');
    btn.textContent = editMode === 'new' ? 'Creating...' : 'Saving...';
    status.textContent = '';
    try {
      const endpoint = editMode === 'new' ? (window._newProfileCollection ? '/api/create-profile' : '/api/create') : '/api/save';
      const payload = editMode === 'new'
        ? { title, description: desc, category, poster, date, adult, featured, draft, images, videos, links, collection: window._newProfileCollection }
        : { filePath, title, description: desc, category, poster, date, adult, featured, draft, images, videos, links };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.ok) {
        if (editMode === 'new') {
          status.style.color = '#4caf50';
          status.textContent = 'Post created — deploy in ~1 min';
          setTimeout(closeEditModal, 2000);
        } else {
          if (editingCard) {
            editingCard.dataset.title = title;
            editingCard.dataset.desc = desc;
            editingCard.dataset.category = category;
            editingCard.dataset.adult = adult;
            const titleEl = editingCard.querySelector('.card-title a');
            const descEl = editingCard.querySelector('.card-desc');
            const catEl = editingCard.querySelector('.card-cat-label');
            if (titleEl) titleEl.textContent = title;
            if (descEl) descEl.textContent = desc;
            if (catEl) catEl.textContent = category;
            if (draft) editingCard.style.opacity = '0.4';
          }
          status.style.color = '#4caf50';
          status.textContent = 'Saved — deploy in ~1 min';
          setTimeout(closeEditModal, 1500);
        }
      } else {
        status.style.color = '#ff5252';
        status.textContent = 'Error: ' + (data.error || 'Unknown');
      }
    } catch (e) {
      status.style.color = '#ff5252';
      status.textContent = 'Error: ' + e.message;
    } finally {
      btn.classList.remove('edit-saving');
      btn.textContent = editMode === 'new' ? 'Create Post' : 'Save';
    }
  }

  async function deletePost() {
    if (!editingCard) return;
    const status = document.getElementById('edit-status');
    const filePath = editingCard.dataset.path;
    if (!filePath) return;
    if (!confirm('Delete this post? This cannot be undone.')) return;
    status.style.color = '#ff5252';
    status.textContent = 'Deleting...';
    try {
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ filePath })
      });
      const data = await res.json();
      if (data.ok) {
        editingCard.style.transition = 'opacity 0.4s';
        editingCard.style.opacity = '0';
        setTimeout(function(){ editingCard.remove(); }, 400);
        closeEditModal();
      } else {
        status.textContent = 'Error: ' + (data.error || 'Unknown');
      }
    } catch(e) {
      status.textContent = 'Error: ' + e.message;
    }
  }

  function openNewProfile(collection) {
    editMode = 'new';
    editingCard = null;
    var colMap = {'_wrestlers':'wrestler','_studs':'stud','_bulge':'bulge'};
    document.getElementById('edit-sheet-title').textContent = 'New ' + (colMap[collection]||'Profile');
    document.getElementById('edit-save-btn').textContent = 'Create';
    document.getElementById('edit-delete-btn').style.display = 'none';
    ['edit-title-input','edit-desc-input','edit-cat-input','edit-poster-input','edit-images-input','edit-videos-input','edit-links-input'].forEach(function(id){document.getElementById(id).value='';});
    document.getElementById('edit-date-input').value = new Date().toISOString().split('T')[0];
    document.getElementById('edit-adult-toggle').checked = false;
    document.getElementById('edit-featured-toggle').checked = false;
    document.getElementById('edit-draft-toggle').checked = false;
    document.getElementById('edit-status').textContent = '';
    // Store collection for create endpoint
    window._newProfileCollection = collection;
    document.getElementById('edit-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  document.getElementById('edit-modal').addEventListener('click', function(e) {
    if (e.target === this) closeEditModal();
  });

/* -- COLLECTIONS (Instagram style) -- */
(function(){
  var panelOpen = false;
  var currentPostId = null;
  var currentPostUrl = null;
  var currentPostImage = null;
  var currentPostTitle = null;
  var userCollections = [];
  var savedIn = [];

  // CSS
  var s = document.createElement('style');
  s.textContent = [
    '.col-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:300;backdrop-filter:blur(2px);opacity:0;transition:opacity 0.3s;pointer-events:none;}',
    '.col-overlay.open{opacity:1;pointer-events:all;}',
    '.col-panel{position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-radius:20px 20px 0 0;z-index:301;max-height:78vh;display:flex;flex-direction:column;transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);}',
    '.col-panel.open{transform:translateY(0);}',
    '.col-handle{display:flex;justify-content:center;padding:0.7rem 0 0.3rem;flex-shrink:0;cursor:pointer;}',
    '.col-handle-bar{width:36px;height:4px;background:var(--border);border-radius:2px;}',
    '.col-ph{display:flex;align-items:center;justify-content:space-between;padding:0.2rem 1rem 0.7rem;border-bottom:1px solid var(--border);flex-shrink:0;}',
    '.col-ph-title{font-family:var(--font-d);font-size:1rem;letter-spacing:0.05em;}',
    '.col-ph-close{background:none;border:none;color:var(--text-dim);font-size:1.3rem;cursor:pointer;}',
    '.col-new-btn{display:flex;align-items:center;gap:0.7rem;padding:0.8rem 1rem;border-bottom:1px solid var(--border);cursor:pointer;width:100%;background:none;border-left:none;border-right:none;border-top:none;text-align:left;}',
    '.col-new-icon{width:52px;height:52px;border-radius:10px;background:var(--surface-3);border:2px dashed var(--border);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--fire-orange);flex-shrink:0;}',
    '.col-new-label{font-size:0.9rem;font-weight:600;color:var(--text);}',
    '.col-list{flex:1;overflow-y:auto;}',
    '.col-item{display:flex;align-items:center;gap:0.7rem;padding:0.7rem 1rem;cursor:pointer;transition:background 0.15s;}',
    '.col-item:active{background:var(--surface-2);}',
    '.col-thumb{width:52px;height:52px;border-radius:10px;overflow:hidden;flex-shrink:0;background:var(--surface-3);display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:1px;}',
    '.col-thumb img{width:100%;height:100%;object-fit:cover;}',
    '.col-thumb-empty{background:linear-gradient(135deg,var(--fire-deep),var(--surface-3));width:100%;height:100%;grid-column:1/-1;grid-row:1/-1;}',
    '.col-info{flex:1;}',
    '.col-name{font-size:0.88rem;font-weight:600;}',
    '.col-count{font-size:0.72rem;color:var(--text-dim);margin-top:0.1rem;}',
    '.col-check{width:22px;height:22px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:0.75rem;flex-shrink:0;transition:all 0.2s;}',
    '.col-check.checked{background:var(--fire-orange);border-color:var(--fire-orange);color:#fff;}',
    '.col-create-form{padding:0.8rem 1rem;border-top:1px solid var(--border);display:flex;gap:0.5rem;flex-shrink:0;}',
    '.col-create-input{flex:1;background:var(--surface-3);border:1px solid var(--border);border-radius:10px;padding:0.55rem 0.9rem;color:var(--text);font-family:var(--font-b);font-size:0.85rem;outline:none;}',
    '.col-create-input:focus{border-color:var(--fire-orange);}',
    '.col-create-btn{background:var(--fire-orange);border:none;color:#fff;padding:0.55rem 1rem;border-radius:10px;font-family:var(--font-d);font-size:0.85rem;cursor:pointer;letter-spacing:0.05em;}',
    '.save-btn.col-saved svg{fill:var(--fire-orange);stroke:var(--fire-orange);}',
    /* Collections page */
    '.my-cols-grid{display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;padding:0.5rem 0;}',
    '.my-col-card{background:var(--surface-2);border-radius:12px;overflow:hidden;cursor:pointer;border:1px solid var(--border);}',
    '.my-col-card-thumb{width:100%;aspect-ratio:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:1px;background:var(--border);}',
    '.my-col-card-thumb img{width:100%;height:100%;object-fit:cover;display:block;}',
    '.my-col-card-thumb .empty-cell{background:var(--surface-3);}',
    '.my-col-card-info{padding:0.6rem 0.7rem;}',
    '.my-col-card-name{font-family:var(--font-d);font-size:0.9rem;letter-spacing:0.03em;}',
    '.my-col-card-count{font-size:0.7rem;color:var(--text-dim);margin-top:0.1rem;}',
    '.my-col-new{border:2px dashed var(--border)!important;background:transparent!important;display:flex;align-items:center;justify-content:center;aspect-ratio:1;cursor:pointer;}',
    '.my-col-new-inner{text-align:center;color:var(--text-dim);}',
    '.my-col-new-inner div:first-child{font-size:2rem;margin-bottom:0.3rem;}',
    '.my-col-new-inner div:last-child{font-size:0.75rem;}'
  ].join('');
  document.head.appendChild(s);

  // Crear overlay y panel
  var overlay = document.createElement('div');
  overlay.className = 'col-overlay';
  overlay.addEventListener('click', closeColPanel);

  var panel = document.createElement('div');
  panel.className = 'col-panel';
  panel.innerHTML = '<div class="col-handle" id="col-handle"><div class="col-handle-bar"></div></div>'
    + '<div class="col-ph">'
    + '<span class="col-ph-title">Save to Collection</span>'
    + '<button class="col-ph-close" id="col-ph-close">&#10005;</button>'
    + '</div>'
    + '<button class="col-new-btn" id="col-new-btn">'
    + '<div class="col-new-icon">+</div>'
    + '<div><div class="col-new-label">New collection</div>'
    + '<div style="font-size:0.72rem;color:var(--text-dim);">Create a new one</div></div>'
    + '</button>'
    + '<div class="col-list" id="col-list"></div>'
    + '<div class="col-create-form" id="col-create-form" style="display:none;">'
    + '<input class="col-create-input" id="col-create-input" placeholder="Collection name..." maxlength="50">'
    + '<button class="col-create-btn" id="col-create-btn">CREATE</button>'
    + '</div>';

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  // Swipe down
  var touchY = 0;
  document.getElementById('col-handle').addEventListener('touchstart', function(e){ touchY = e.touches[0].clientY; }, {passive:true});
  document.getElementById('col-handle').addEventListener('touchend', function(e){ if (e.changedTouches[0].clientY - touchY > 60) closeColPanel(); }, {passive:true});
  document.getElementById('col-ph-close').addEventListener('click', closeColPanel);

  // New collection toggle
  document.getElementById('col-new-btn').addEventListener('click', function() {
    var form = document.getElementById('col-create-form');
    form.style.display = form.style.display === 'none' ? 'flex' : 'none';
    if (form.style.display === 'flex') document.getElementById('col-create-input').focus();
  });

  // Create collection
  document.getElementById('col-create-btn').addEventListener('click', createCollection);
  document.getElementById('col-create-input').addEventListener('keydown', function(e){ if (e.key === 'Enter') createCollection(); });

  async function createCollection() {
    var input = document.getElementById('col-create-input');
    var name = input.value.trim();
    if (!name) return;
    try {
      var r = await fetch('/api/collections?action=create', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name })
      });
      var d = await r.json();
      if (d.ok) {
        input.value = '';
        document.getElementById('col-create-form').style.display = 'none';
        userCollections.unshift({ id: d.id, name: name, count: 0, images: [] });
        renderColList();
      }
    } catch(e) {}
  }

  function renderColList() {
    var list = document.getElementById('col-list');
    list.innerHTML = '';
    if (!userCollections.length) {
      list.innerHTML = '<div style="text-align:center;padding:1.5rem;color:var(--text-dim);font-size:0.85rem;">No collections yet</div>';
      return;
    }
    userCollections.forEach(function(col) {
      var isSaved = savedIn.indexOf(col.id) >= 0;
      var item = document.createElement('div');
      item.className = 'col-item';
      // Thumb
      var thumbHTML = '';
      if (col.images && col.images.length > 0) {
        thumbHTML = col.images.slice(0,4).map(function(img){ return '<img src="'+img+'" loading="lazy">'; }).join('');
      } else {
        thumbHTML = '<div class="col-thumb-empty"></div>';
      }
      item.innerHTML = '<div class="col-thumb">' + thumbHTML + '</div>'
        + '<div class="col-info"><div class="col-name">' + col.name + '</div>'
        + '<div class="col-count">' + (col.count||0) + ' posts</div></div>'
        + '<div class="col-check' + (isSaved ? ' checked' : '') + '">' + (isSaved ? '&#10004;' : '') + '</div>';
      item.addEventListener('click', function() { toggleSave(col.id, item); });
      list.appendChild(item);
    });
  }

  async function toggleSave(colId, itemEl) {
    if (!currentPostId) return;
    try {
      var r = await fetch('/api/collections?action=save', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          col_id: colId,
          post_id: currentPostId,
          post_url: currentPostUrl || '',
          post_image: currentPostImage || '',
          post_title: currentPostTitle || ''
        })
      });
      var d = await r.json();
      if (d.ok) {
        var check = itemEl.querySelector('.col-check');
        if (d.saved) {
          savedIn.push(colId);
          check.className = 'col-check checked';
          check.innerHTML = '&#10004;';
          // Actualizar ícono del card
          updateSaveBtnState(currentPostId, true);
        } else {
          savedIn = savedIn.filter(function(id){ return id !== colId; });
          check.className = 'col-check';
          check.innerHTML = '';
          if (!savedIn.length) updateSaveBtnState(currentPostId, false);
        }
      }
    } catch(e) {}
  }

  function updateSaveBtnState(postId, saved) {
    document.querySelectorAll('.save-btn[data-id="'+postId+'"]').forEach(function(btn) {
      btn.classList.toggle('col-saved', saved);
    });
  }

  function closeColPanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    panelOpen = false;
  }

  window.openCollectionsPanel = async function(postId, postUrl, postImage, postTitle) {
    // Verificar sesión
    if (!window.currentUser) {
      if (typeof toast === 'function') toast('Sign in to save posts');
      if (typeof openAuthModal === 'function') openAuthModal();
      return;
    }
    currentPostId = postId;
    currentPostUrl = postUrl || '';
    currentPostImage = postImage || '';
    currentPostTitle = postTitle || '';
    panelOpen = true;
    overlay.classList.add('open');
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Cargar colecciones
    var list = document.getElementById('col-list');
    list.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-dim);font-size:0.8rem;">Loading...</div>';
    try {
      var [rCols, rCheck] = await Promise.all([
        fetch('/api/collections', { credentials: 'include' }),
        fetch('/api/collections?action=check', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postId })
        })
      ]);
      var dCols = await rCols.json();
      var dCheck = await rCheck.json();
      userCollections = dCols.collections || [];
      savedIn = dCheck.saved_in || [];
      renderColList();
    } catch(e) {
      list.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-dim);">Error loading</div>';
    }
  };

  // Render My Collections page
  window.renderMyCollections = async function(container) {
    if (!window.currentUser) {
      container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-dim);">Sign in to see your collections</div>';
      return;
    }
    container.innerHTML = '<div style="text-align:center;padding:1rem;color:var(--text-dim);font-size:0.8rem;">Loading...</div>';
    try {
      var r = await fetch('/api/collections', { credentials: 'include' });
      var d = await r.json();
      var cols = d.collections || [];
      var html = '<div class="my-cols-grid">';
      cols.forEach(function(col) {
        var cells = ['','','',''].map(function(_, i) {
          return col.images && col.images[i]
            ? '<img src="'+col.images[i]+'" loading="lazy">'
            : '<div class="empty-cell"></div>';
        }).join('');
        html += '<div class="my-col-card" onclick="window.openCollection('+col.id+',\''+col.name+'\')">'
          + '<div class="my-col-card-thumb">'+cells+'</div>'
          + '<div class="my-col-card-info">'
          + '<div class="my-col-card-name">'+col.name.toUpperCase()+'</div>'
          + '<div class="my-col-card-count">'+(col.count||0)+' posts</div>'
          + '</div></div>';
      });
      html += '<div class="my-col-card my-col-new" onclick="window.openCollectionsPanel(\'__new__\')">'
        + '<div class="my-col-new-inner"><div>+</div><div>New collection</div></div>'
        + '</div>';
      html += '</div>';
      container.innerHTML = html;
    } catch(e) {
      container.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-dim);">Error loading</div>';
    }
  };

  window.openCollection = function(colId, colName) {
    // Navegar a la colección — mostrar sus posts
    // Por ahora mostrar un alert simple
    // TODO: implementar vista de colección individual
    alert('Collection: ' + colName);
  };

})();
