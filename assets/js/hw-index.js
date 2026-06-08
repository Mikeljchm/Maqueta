
/* -- COMMENTS PANEL (YouTube-style threads) -- */
(function(){
  var panelPostId  = null;
  var panelOpen    = false;
  var replyingTo   = null; /* {id, userName} del comentario padre */
  var LIKED_COMMENTS = new Set();
  try { LIKED_COMMENTS = new Set(JSON.parse(localStorage.getItem('hw_liked_comments')||'[]')); } catch(e){}
  function saveLikedComments(){ try{ localStorage.setItem('hw_liked_comments',JSON.stringify([...LIKED_COMMENTS])); }catch(e){} }
  var pendingSticker = null;
  var strayOpen    = false;

  /* ── CSS ── */
  var s = document.createElement('style');
  s.textContent = [
    '.cp-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200;opacity:0;pointer-events:none;transition:opacity 0.25s;}',
    '.cp-overlay.open{opacity:1;pointer-events:all;}',
    '.cp-panel{position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-radius:20px 20px 0 0;z-index:201;max-height:85vh;display:flex;flex-direction:column;transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);}',
    '.cp-panel.open{transform:translateY(0);}',
    '.cp-header{display:flex;align-items:center;padding:0.75rem 1rem 0.6rem;border-bottom:1px solid var(--border);flex-shrink:0;}',
    '.cp-title{font-family:var(--font-d);font-size:0.9rem;letter-spacing:0.08em;flex:1;}',
    '.cp-close{background:none;border:none;color:var(--text-dim);font-size:1.2rem;cursor:pointer;padding:0.2rem 0.4rem;}',
    /* List */
    '.cp-list{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0.75rem 1rem;display:flex;flex-direction:column;gap:0;}',
    '.cp-empty{color:var(--text-dim);font-size:0.82rem;text-align:center;padding:2rem 0;}',
    /* Comment item */
    '.cp-item{display:flex;gap:0.6rem;padding:0.6rem 0;border-bottom:1px solid var(--border);}',
    '.cp-item:last-child{border-bottom:none;}',
    '.cp-av{width:32px;height:32px;border-radius:50%;background:var(--surface-3);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:0.85rem;color:var(--text-dim);overflow:hidden;}',
    '.cp-av img{width:100%;height:100%;object-fit:cover;}',
    '.cp-body{flex:1;min-width:0;}',
    '.cp-username{font-family:var(--font-d);font-size:0.75rem;letter-spacing:0.04em;color:var(--text);margin-bottom:0.2rem;}',
    '.cp-text{font-size:0.85rem;line-height:1.5;color:var(--text);word-break:break-word;}',
    '.cp-text-reply-to{color:var(--fire-orange);font-size:0.8rem;}',
    '.cp-sticker{width:72px;border-radius:10px;display:block;}',
    '.cp-meta{display:flex;align-items:center;gap:0.75rem;margin-top:0.35rem;}',
    '.cp-time{font-size:0.65rem;color:var(--text-muted);}',
    '.cp-reply-btn{background:none;border:none;font-size:0.7rem;color:var(--text-dim);cursor:pointer;padding:0;font-family:var(--font-b);letter-spacing:0.04em;transition:color 0.15s;}',
    '.cp-reply-btn:active{color:var(--fire-orange);}',
    '.cp-like-btn{background:none;border:none;display:inline-flex;align-items:center;gap:0.25rem;font-size:0.7rem;color:var(--text-dim);cursor:pointer;padding:0;font-family:var(--font-b);transition:color 0.15s;}',
    '.cp-like-btn svg{width:11px;height:11px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:fill 0.15s,stroke 0.15s;}',
    '.cp-like-btn.liked{color:#ff3b5c;}',
    '.cp-like-btn.liked svg{fill:#ff3b5c;stroke:#ff3b5c;}',
    '.cp-like-count{font-size:0.68rem;line-height:1;}',
    /* Replies thread */
    '.cp-replies-wrap{margin-left:2.4rem;}',
    '.cp-view-replies-btn{background:none;border:none;color:var(--fire-orange);font-size:0.75rem;font-family:var(--font-b);cursor:pointer;padding:0.3rem 0;display:flex;align-items:center;gap:0.35rem;letter-spacing:0.03em;}',
    '.cp-view-replies-btn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform 0.2s;}',
    '.cp-view-replies-btn.expanded svg{transform:rotate(180deg);}',
    '.cp-replies-list{display:flex;flex-direction:column;gap:0;margin-top:0.2rem;}',
    /* Reply item — más pequeño */
    '.cp-item.cp-reply{padding:0.45rem 0;}',
    '.cp-item.cp-reply .cp-av{width:26px;height:26px;font-size:0.7rem;}',
    '.cp-item.cp-reply .cp-username{font-size:0.7rem;}',
    '.cp-item.cp-reply .cp-text{font-size:0.8rem;}',
    /* Input area */
    '.cp-sticker-preview{display:none;align-items:center;gap:0.5rem;padding:0.4rem 1rem 0;flex-shrink:0;}',
    '.cp-sticker-preview.visible{display:flex;}',
    '.cp-sticker-preview video{width:48px;height:48px;border-radius:8px;object-fit:cover;}',
    '.cp-sticker-preview-remove{background:none;border:none;color:var(--text-muted);font-size:1rem;cursor:pointer;padding:0.1rem 0.3rem;}',
    '.cp-reply-indicator{display:none;padding:0.3rem 1rem;font-size:0.72rem;color:var(--fire-orange);background:rgba(255,69,0,0.07);align-items:center;justify-content:space-between;flex-shrink:0;}',
    '.cp-reply-indicator.visible{display:flex;}',
    '.cp-reply-cancel{background:none;border:none;color:var(--text-muted);font-size:0.8rem;cursor:pointer;padding:0.1rem;}',
    '.cp-input-area{padding:0.7rem 1rem calc(0.7rem + env(safe-area-inset-bottom,0px));border-top:1px solid var(--border);display:flex;align-items:center;gap:0.5rem;flex-shrink:0;}',
    '.cp-sticker-btn{background:none;border:none;font-size:1.3rem;cursor:pointer;flex-shrink:0;padding:0.2rem;}',
    '.cp-input{flex:1;background:var(--surface-3);border:1px solid var(--border);border-radius:20px;padding:0.5rem 0.9rem;color:var(--text);font-family:var(--font-b);font-size:0.85rem;outline:none;}',
    '.cp-input:focus{border-color:var(--fire-orange);}',
    '.cp-send{background:var(--fire-orange);border:none;color:#fff;padding:0.5rem 1rem;border-radius:20px;font-family:var(--font-d);font-size:0.85rem;cursor:pointer;letter-spacing:0.05em;}',
    /* Sticker tray */
    '.cp-stray{background:var(--surface-2);border-top:1px solid var(--border);padding:0 1rem;max-height:0;overflow:hidden;display:flex;flex-direction:column;gap:0.5rem;transition:max-height 0.3s cubic-bezier(0.16,1,0.3,1),padding 0.3s;flex-shrink:0;}',
    '.cp-stray.open{max-height:220px;padding:0.75rem 1rem;overflow-y:auto;}',
    '.cp-stray-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:0.5rem;}',
    '.cp-stray-item{cursor:pointer;border-radius:8px;overflow:hidden;aspect-ratio:1;}',
    '.cp-stray-item video{width:100%;height:100%;object-fit:cover;display:block;}',
    '.cp-stray-nav{display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}',
    '.sticker-nav-btn{background:none;border:1px solid var(--border);color:var(--text-dim);border-radius:8px;padding:0.3rem 0.7rem;font-size:0.75rem;cursor:pointer;}',
    '.sticker-page-info{font-size:0.72rem;color:var(--text-dim);}'
  ].join('');
  document.head.appendChild(s);

  /* ── DOM ── */
  var overlay = document.createElement('div');
  overlay.className = 'cp-overlay';
  overlay.addEventListener('click', closePanel);
  document.body.appendChild(overlay);

  var panel = document.createElement('div');
  panel.className = 'cp-panel';
  panel.innerHTML =
    '<div class="cp-header">'
    + '<div class="cp-title">Comments<span id="cp-count"></span></div>'
    + '<button class="cp-close" id="cp-close">&#10005;</button>'
    + '</div>'
    + '<div class="cp-list" id="cp-list"></div>'
    + '<div class="cp-stray" id="cp-stray">'
    + '<div class="cp-stray-nav">'
    + '<button class="sticker-nav-btn" id="cp-sticker-prev">&#8592; Prev</button>'
    + '<span class="sticker-page-info" id="cp-sticker-page">1 / 16</span>'
    + '<button class="sticker-nav-btn" id="cp-sticker-next">Next &#8594;</button>'
    + '</div>'
    + '<div class="cp-stray-grid" id="cp-stray-grid"></div>'
    + '</div>'
    + '<div class="cp-sticker-preview" id="cp-sticker-preview">'
    + '<video id="cp-sticker-preview-video" autoplay loop muted playsinline></video>'
    + '<button class="cp-sticker-preview-remove" id="cp-sticker-preview-remove">&#10005;</button>'
    + '</div>'
    + '<div class="cp-reply-indicator" id="cp-reply-indicator">'
    + '<span id="cp-reply-indicator-text">Replying to @someone</span>'
    + '<button class="cp-reply-cancel" id="cp-reply-cancel">&#10005;</button>'
    + '</div>'
    + '<div class="cp-input-area">'
    + '<button class="cp-sticker-btn" id="cp-sticker-btn">&#128520;</button>'
    + '<input class="cp-input" id="cp-input" placeholder="Add a comment..." maxlength="500">'
    + '<button class="cp-send" id="cp-send">POST</button>'
    + '</div>';
  document.body.appendChild(panel);

  /* ── Sticker tray ── */
  var TOTAL_PAGES = 16;
  var currentPage = 1;

  function loadStickerPage(page) {
    var grid = document.getElementById('cp-stray-grid');
    var info = document.getElementById('cp-sticker-page');
    if (!grid) return;
    grid.innerHTML = '';
    if (info) info.textContent = page + ' / ' + TOTAL_PAGES;
    fetch('/assets/data/stickers_' + page + '.json')
      .then(function(r){ return r.json(); })
      .then(function(data) {
        data.forEach(function(url) {
          var item = document.createElement('div');
          item.className = 'cp-stray-item';
          item.innerHTML = '<video src="' + url + '" autoplay loop muted playsinline></video>';
          item.addEventListener('click', function(){ selectSticker(url); });
          grid.appendChild(item);
        });
      });
  }

  function selectSticker(url) {
    pendingSticker = url;
    var preview = document.getElementById('cp-sticker-preview');
    var video   = document.getElementById('cp-sticker-preview-video');
    if (preview && video) { video.src = url; preview.classList.add('visible'); }
    var stray = document.getElementById('cp-stray');
    if (stray) stray.classList.remove('open');
    strayOpen = false;
    var input = document.getElementById('cp-input');
    if (input) input.focus();
  }
  window.sendSticker = selectSticker; /* compatibilidad con el inline sticker panel */

  document.getElementById('cp-sticker-btn').addEventListener('click', function() {
    var stray = document.getElementById('cp-stray');
    strayOpen = !strayOpen;
    stray.classList.toggle('open', strayOpen);
    if (strayOpen && !document.getElementById('cp-stray-grid').children.length) loadStickerPage(1);
  });
  document.getElementById('cp-sticker-prev').addEventListener('click', function() {
    if (currentPage > 1) { currentPage--; loadStickerPage(currentPage); }
  });
  document.getElementById('cp-sticker-next').addEventListener('click', function() {
    if (currentPage < TOTAL_PAGES) { currentPage++; loadStickerPage(currentPage); }
  });
  document.getElementById('cp-sticker-preview-remove').addEventListener('click', function() {
    pendingSticker = null;
    var preview = document.getElementById('cp-sticker-preview');
    if (preview) preview.classList.remove('visible');
    var v = document.getElementById('cp-sticker-preview-video');
    if (v) v.src = '';
  });

  /* ── Reply indicator ── */
  document.getElementById('cp-reply-cancel').addEventListener('click', function() {
    cancelReply();
  });

  function setReplyingTo(commentId, userName) {
    replyingTo = {id: commentId, userName: userName};
    var ind = document.getElementById('cp-reply-indicator');
    var txt = document.getElementById('cp-reply-indicator-text');
    if (ind) ind.classList.add('visible');
    if (txt) txt.textContent = 'Replying to ' + userName;
    var input = document.getElementById('cp-input');
    if (input) input.focus();
  }

  function cancelReply() {
    replyingTo = null;
    var ind = document.getElementById('cp-reply-indicator');
    if (ind) ind.classList.remove('visible');
  }

  /* ── Helpers ── */
  function timeAgo(d) {
    if (!d) return 'just now';
    var diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60)    return 'just now';
    if (diff < 3600)  return Math.floor(diff/60)+'m ago';
    if (diff < 86400) return Math.floor(diff/3600)+'h ago';
    return Math.floor(diff/86400)+'d ago';
  }
  function escH(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ── Render comment (top-level o reply) ── */
  function renderComment(row, isReply) {
    var item = document.createElement('div');
    item.className = isReply ? 'cp-item cp-reply' : 'cp-item';
    item.setAttribute('data-comment-id', row.id || '');

    var avContent = row.user_avatar
      ? '<img src="' + row.user_avatar + '" loading="lazy">'
      : escH((row.user_name || 'A').charAt(0).toUpperCase());

    var stickerMatch = row.body ? row.body.match(/\[sticker\]([^\[]+)\[\/sticker\]/) : null;
    var textPart = row.body ? row.body.replace(/\[sticker\][^\[]*\[\/sticker\]/g, '').trim() : '';
    var bodyHtml = '';
    if (textPart) bodyHtml += '<div class="cp-text">' + escH(textPart) + '</div>';
    if (stickerMatch) bodyHtml += '<video class="cp-sticker" src="' + stickerMatch[1] + '" autoplay loop muted playsinline></video>';

    var replyCount = row.reply_count || 0;
    var replyBtnHtml = !isReply
      ? '<button class="cp-reply-btn" data-comment-id="' + (row.id||'') + '" data-comment-user="' + escH(row.user_name||'') + '">Reply</button>'
      : '';

    item.innerHTML =
      '<div class="cp-av">' + avContent + '</div>'
      + '<div class="cp-body">'
        + '<div class="cp-username">' + escH(row.user_name || 'Anonymous') + '</div>'
        + bodyHtml
        + '<div class="cp-meta">'
          + '<span class="cp-time">' + timeAgo(row.created_at) + '</span>'
          + replyBtnHtml
          + (row.id ? '<button class="cp-like-btn'+(LIKED_COMMENTS.has(String(row.id))?' liked':'')
            + '" data-comment-like="'+row.id+'" data-like-count="'+(row.like_count||0)+'">'  
            + '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
            + '<span class="cp-like-count">'+(row.like_count||'')+'</span>'
            + '</button>' : '')
        + '</div>'
      + '</div>';

    /* Si es top-level y tiene replies, agregar el botón "View X replies" */
    if (!isReply && replyCount > 0) {
      var repliesWrap = document.createElement('div');
      repliesWrap.className = 'cp-replies-wrap';

      var viewBtn = document.createElement('button');
      viewBtn.className = 'cp-view-replies-btn';
      viewBtn.innerHTML =
        '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>'
        + 'View ' + replyCount + ' repl' + (replyCount === 1 ? 'y' : 'ies');
      viewBtn.setAttribute('data-comment-id', row.id);
      viewBtn.setAttribute('data-loaded', '0');

      var repliesList = document.createElement('div');
      repliesList.className = 'cp-replies-list';
      repliesList.id = 'cp-replies-' + row.id;

      viewBtn.addEventListener('click', function() {
        var loaded = viewBtn.getAttribute('data-loaded') === '1';
        var expanded = viewBtn.classList.contains('expanded');
        if (expanded) {
          repliesList.style.display = 'none';
          viewBtn.classList.remove('expanded');
          viewBtn.querySelector('span') && (viewBtn.querySelector('span').textContent =
            'View ' + replyCount + ' repl' + (replyCount === 1 ? 'y' : 'ies'));
        } else if (loaded) {
          repliesList.style.display = '';
          viewBtn.classList.add('expanded');
        } else {
          loadReplies(row.id, repliesList, viewBtn);
        }
      });

      repliesWrap.appendChild(viewBtn);
      repliesWrap.appendChild(repliesList);

      /* Wrap el item y el thread juntos */
      var wrapper = document.createElement('div');
      wrapper.appendChild(item);
      wrapper.appendChild(repliesWrap);
      return wrapper;
    }

    return item;
  }

  function loadReplies(commentId, repliesList, viewBtn) {
    repliesList.innerHTML = '<div style="padding:0.5rem 0;font-size:0.75rem;color:var(--text-dim);">Loading...</div>';
    fetch('/api/comments?post_id=' + encodeURIComponent(panelPostId) + '&parent_id=' + commentId, { credentials: 'include' })
      .then(function(r){ return r.json(); })
      .then(function(d) {
        repliesList.innerHTML = '';
        (d.comments || []).forEach(function(row) {
          repliesList.appendChild(renderComment(row, true));
        });
        viewBtn.setAttribute('data-loaded', '1');
        viewBtn.classList.add('expanded');
        repliesList.style.display = '';
        /* Actualizar texto del botón */
        var n = (d.comments||[]).length;
        var svgHtml = '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';
        viewBtn.innerHTML = svgHtml + 'Hide repl' + (n === 1 ? 'y' : 'ies');
      })
      .catch(function(){ repliesList.innerHTML = ''; });
  }

  /* ── Delegation: Like comment ── */
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.cp-like-btn[data-comment-like]');
    if (!btn) return;
    var id = String(btn.getAttribute('data-comment-like'));
    var isLiked = LIKED_COMMENTS.has(id);
    if (isLiked) {
      LIKED_COMMENTS.delete(id); btn.classList.remove('liked');
    } else {
      LIKED_COMMENTS.add(id); btn.classList.add('liked');
      btn.style.transform='scale(1.4)'; setTimeout(function(){ btn.style.transform=''; },180);
    }
    saveLikedComments();
    /* Actualizar contador via D1 */
    if (!window.currentUser) return;
    fetch('/api/comment-likes', {
      method:'POST', credentials:'include',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({comment_id: parseInt(id), action: isLiked ? 'unlike' : 'like'})
    }).then(function(r){ return r.json(); }).then(function(d){
      var countEl = btn.querySelector('.cp-like-count');
      if (countEl) countEl.textContent = d.count > 0 ? d.count : '';
    }).catch(function(){});
  });

  /* ── Delegation: Reply button ── */
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.cp-reply-btn[data-comment-id]');
    if (!btn) return;
    setReplyingTo(
      btn.getAttribute('data-comment-id'),
      btn.getAttribute('data-comment-user')
    );
  });

  /* ── Send ── */
  function sendComment() {
    var input = document.getElementById('cp-input');
    var text  = input.value.trim();
    if (!text && !pendingSticker) return;
    if (!panelPostId) return;

    var body = text;
    if (pendingSticker) body = (text ? text + ' ' : '') + '[sticker]' + pendingSticker + '[/sticker]';

    var parentId = replyingTo ? replyingTo.id : null;
    var parentUser = replyingTo ? replyingTo.userName : null;

    input.value = '';
    pendingSticker = null;
    var preview = document.getElementById('cp-sticker-preview');
    if (preview) preview.classList.remove('visible');
    var vid = document.getElementById('cp-sticker-preview-video');
    if (vid) { vid.src = ''; vid.load(); }
    cancelReply();

    fetch('/api/comments?post_id=' + encodeURIComponent(panelPostId), {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body, parent_id: parentId ? parseInt(parentId) : null })
    }).then(function(r){ return r.json(); })
    .then(function(d) {
      if (!d.ok && !d.id) return;
      var uName  = window.currentUser ? (window.currentUser.name || 'You') : 'You';
      var uBadge = window.currentUser && window.currentUser.badge ? window.currentUser.badge + ' ' : '';
      var row = { id: d.id, body: body, user_name: uBadge + uName,
                  user_avatar: window.currentUser ? window.currentUser.picture : '',
                  created_at: null, reply_count: 0 };

      if (parentId) {
        /* Agregar al hilo de replies */
        var repliesList = document.getElementById('cp-replies-' + parentId);
        if (repliesList) {
          repliesList.style.display = '';
          repliesList.appendChild(renderComment(row, true));
          repliesList.scrollIntoView({behavior:'smooth', block:'nearest'});
          /* Actualizar contador en el botón view-replies */
          var vBtn = repliesList.previousElementSibling;
          if (vBtn && vBtn.classList.contains('cp-view-replies-btn')) {
            var n = repliesList.children.length;
            var svgHtml = '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';
            vBtn.innerHTML = svgHtml + 'Hide repl' + (n===1?'y':'ies');
            vBtn.classList.add('expanded');
            vBtn.setAttribute('data-loaded','1');
          }
        } else {
          /* El hilo no está cargado — forzar recarga del panel */
          window.openCommentsPanel(panelPostId);
        }
      } else {
        /* Top-level: agregar al final de la lista */
        var list = document.getElementById('cp-list');
        if (list) {
          var empty = list.querySelector('.cp-empty');
          if (empty) empty.remove();
          list.appendChild(renderComment(row, false));
          list.scrollTop = list.scrollHeight;
        }
      }
      updateCount(1);
    }).catch(function(){});
  }

  document.getElementById('cp-send').addEventListener('click', sendComment);
  document.getElementById('cp-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') sendComment();
  });

  /* ── Close ── */
  document.getElementById('cp-close').addEventListener('click', closePanel);
  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    panelOpen = false;
    panelPostId = null;
    replyingTo = null;
    cancelReply();
    var stray = document.getElementById('cp-stray');
    if (stray) stray.classList.remove('open');
    strayOpen = false;
    pendingSticker = null;
    var prev2 = document.getElementById('cp-sticker-preview');
    if (prev2) prev2.classList.remove('visible');
    var vid2 = document.getElementById('cp-sticker-preview-video');
    if (vid2) { vid2.src = ''; vid2.load(); }
  }

  /* ── updateCount ── */
  function updateCount(delta) {
    var el = document.getElementById('cp-count');
    if (!el) return;
    var cur = parseInt(el.textContent.replace(/[^0-9]/g,'')) || 0;
    el.textContent = ' • ' + (cur + delta);
    if (panelPostId) {
      var btn = document.querySelector('.comment-toggle-btn[data-id="' + panelPostId + '"]');
      if (btn) { var cc = btn.querySelector('.comment-count'); if(cc) cc.textContent = cur + delta; }
    }
  }

  /* ── Open panel ── */
  window.openCommentsPanel = function(postId) {
    panelPostId = postId;
    panelOpen   = true;
    replyingTo  = null;
    cancelReply();
    var list = document.getElementById('cp-list');
    list.innerHTML = '<div class="cp-empty">Loading...</div>';
    document.getElementById('cp-count').textContent = '';
    var stray = document.getElementById('cp-stray');
    if (stray) stray.classList.remove('open');
    strayOpen = false;
    overlay.classList.add('open');
    panel.classList.add('open');
    document.body.style.overflow = 'hidden';

    fetch('/api/comments?post_id=' + encodeURIComponent(postId), { credentials: 'include' })
      .then(function(r){ return r.json(); })
      .then(function(d) {
        list.innerHTML = '';
        if (!d.comments || !d.comments.length) {
          list.innerHTML = '<div class="cp-empty">No comments yet. Be the first!</div>';
        } else {
          d.comments.forEach(function(row) {
            list.appendChild(renderComment(row, false));
          });
          list.scrollTop = list.scrollHeight;
        }
        var total = d.comments ? d.comments.reduce(function(a,b){ return a+(b.reply_count||0)+1; }, 0) : 0;
        document.getElementById('cp-count').textContent = ' • ' + total;
      })
      .catch(function() {
        list.innerHTML = '<div class="cp-empty">Error loading comments.</div>';
      });
  };

  /* Exponer addToPanel para compatibilidad con código externo */
  window._cpAddToPanel = function(text, userName, userAvatar) {
    var list = document.getElementById('cp-list');
    if (!list) return;
    var empty = list.querySelector('.cp-empty');
    if (empty) empty.remove();
    list.appendChild(renderComment({ body:text, user_name:userName, user_avatar:userAvatar, created_at:null, reply_count:0 }, false));
    list.scrollTop = list.scrollHeight;
  };

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
      +'<button class="card-act-btn comment-toggle-btn" data-id="'+(post.path||String(idx))+'"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span class="comment-count">0</span></button>'
      +'<button class="card-act-btn save-btn" data-id="'+(post.path||String(idx))+'" data-url="'+(post.url||'')+'" data-img="'+(post.poster||post.image||'')+'" data-title="'+escH(post.title||'')+'"><svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg><span class="save-count"></span></button>'
      +'<button class="card-act-btn like-btn" data-id="'+(post.path||String(idx))+'"><svg class="like-heart" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg><svg class="like-flame" viewBox="0 0 24 24" width="21" height="21" fill="var(--fire-orange)" stroke="none"><path d="M12 2s-5 5.5-5 10a5 5 0 0010 0c0-4.5-5-10-5-10zm0 14a3 3 0 01-3-3c0-2 1.5-4.5 3-7 1.5 2.5 3 5 3 7a3 3 0 01-3 3z"/></svg><span class="like-count">0</span></button>'
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
    var tb = document.getElementById('trending-bar');
    if (tb) { tb.style.maxHeight = '0'; tb.style.padding = '0 0.75rem'; }
    resetFeed();
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
        window.ALL_POSTS = ALL_POSTS; /* expuesto para Activity Panel */
        renderBatch();
        initObserver();
        // Marcar botones guardados + cargar reacciones una vez el feed esté listo
        if (typeof window._markSavedBtns === 'function') window._markSavedBtns();

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

    // Event delegation para save-btn (collections) — touchend capture para mobile
    document.addEventListener('touchend', function(e) {
      var btn = e.target.closest('.save-btn[data-id]');
      if (!btn) return;
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

  /* Cargar puntos y badge del usuario desde D1 */
  async function fetchUserPoints(userId) {
    if (!userId) return;
    try {
      var r = await fetch('/api/points?user_id=' + encodeURIComponent(userId));
      var d = await r.json();
      if (window.currentUser) {
        window.currentUser.points = d.points || 0;
        window.currentUser.badge  = d.badge  || '🔰';
        window.currentUser.level  = d.level  || 'Rookie';
      }
      /* Actualizar badge en perfil si está visible */
      var profBadge = document.getElementById('prof-badge');
      if (profBadge && profBadge.style.display !== 'none') {
        profBadge.textContent = (d.badge || '') + ' ' + (d.level || '');
        var cls = {Rookie:'badge-rookie',Regular:'badge-regular',Soldier:'badge-soldier',VIP:'badge-vip'};
        profBadge.className = 'prof-badge ' + (cls[d.level] || 'badge-rookie');
      }
    } catch(e) {}
  }

  /* Restaurar estado col-saved en los botones — 1 sola request al servidor */
  async function restoreSavedStates() {
    if (!window.currentUser) return;
    try {
      var r = await fetch('/api/collections?action=saved_posts', { credentials: 'include' });
      var d = await r.json();
      var ids = new Set(d.post_ids || []);
      window._savedPostIds = ids;
      _applyIdsToButtons(ids);
    } catch(e) {}
  }

  function _applyIdsToButtons(ids) {
    if (!ids || !ids.size) return;
    document.querySelectorAll('.save-btn[data-id]').forEach(function(btn) {
      if (ids.has(btn.getAttribute('data-id'))) btn.classList.add('col-saved');
    });
  }

  // Exponer para que el feed IIFE llame después de renderizar
  window._markSavedBtns = function() {
    if (window._savedPostIds && window._savedPostIds.size) {
      _applyIdsToButtons(window._savedPostIds);
    }
  };

  /* Init auth — después del render para no bloquear */
  document.addEventListener('DOMContentLoaded', async function initAuth() {
    const session = await HottAuth.init();
    if (session) {
      currentUser = session; window.currentUser = session;
      updateAuthUI(currentUser);
      /* Cargar puntos y badge del usuario */
      fetchUserPoints(session.id);
    }
    applyAdultBlur();

    // Restaurar estados guardados + colecciones al autenticarse
    if (session) {
      // Restaurar save-btn states (se reintenta cuando el feed renderice)
      setTimeout(restoreSavedStates, 600);
      // Auto-cargar My Collections en la sección More
      setTimeout(function() {
        var c = document.getElementById('my-collections-container');
        if (c && typeof window.renderMyCollections === 'function') window.renderMyCollections(c);
      }, 700);
    }

    HottAuth.onChange(s => {
      if (s) {
        currentUser = s; window.currentUser = s;
        updateAuthUI(currentUser);
        closeAuthModal();
        fetchUserPoints(s.id);
        // Restaurar al hacer login también
        setTimeout(restoreSavedStates, 800);
      } else {
        currentUser = null; window.currentUser = null;
        updateAuthUI(null);
        // Limpiar estados al hacer logout
        document.querySelectorAll('.save-btn.col-saved').forEach(function(btn) {
          btn.classList.remove('col-saved');
        });
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
      /* Agregar botón Confessions al panel admin */
      var s = document.createElement('style');
      s.textContent = '.conf-admin-fab{display:none;position:fixed;bottom:calc(var(--nav-h,56px) + var(--safe-bottom,0px) + 7.5rem);right:1rem;background:#6c3fc7;color:#fff;border:none;border-radius:20px;padding:0.5rem 1rem;font-family:var(--font-d);font-size:0.75rem;letter-spacing:0.06em;cursor:pointer;z-index:101;box-shadow:0 4px 16px rgba(108,63,199,0.4);}.is-admin .conf-admin-fab{display:flex;align-items:center;gap:0.4rem;}.conf-admin-badge{background:#ff3b5c;color:#fff;border-radius:50%;width:17px;height:17px;font-size:0.6rem;display:flex;align-items:center;justify-content:center;font-family:var(--font-b);font-weight:700;flex-shrink:0;margin-left:0.2rem;}' + '.conf-admin-sheet{position:fixed;inset:0;background:var(--bg);z-index:600;display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);}.conf-admin-sheet.open{transform:translateX(0);}.conf-admin-header{display:flex;align-items:center;gap:0.75rem;padding:0.9rem 1rem;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;}.conf-admin-back{background:none;border:none;color:var(--text);width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;}.conf-admin-back svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}.conf-admin-htitle{font-family:var(--font-d);font-size:1rem;letter-spacing:0.07em;}.conf-admin-body{flex:1;overflow-y:auto;padding:0.75rem;}';
      document.head.appendChild(s);
      /* FAB */
      var fab = document.createElement('button');
      fab.className = 'conf-admin-fab';
      fab.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Confessions<span class="conf-admin-badge" id="conf-pending-badge" style="display:none"></span>';
      /* Cargar conteo de pendientes */
      fetch('/api/confessions?status=pending', {credentials:'include'})
        .then(function(r){ return r.json(); })
        .then(function(d){
          var n = (d.confessions||[]).length;
          var badge = document.getElementById('conf-pending-badge');
          if (badge && n > 0) { badge.textContent = n > 9 ? '9+' : n; badge.style.display = 'flex'; }
        }).catch(function(){});
      document.body.appendChild(fab);
      /* Sheet */
      var sheet = document.createElement('div');
      sheet.className = 'conf-admin-sheet';
      sheet.innerHTML = '<div class="conf-admin-header">'
        + '<button class="conf-admin-back" id="conf-admin-back"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>'
        + '<div class="conf-admin-htitle">Pending Confessions</div></div>'
        + '<div class="conf-admin-body" id="conf-admin-body"></div>';
      document.body.appendChild(sheet);
      fab.addEventListener('click', function() {
        sheet.classList.add('open');
        document.body.style.overflow = 'hidden';
        var badge = document.getElementById('conf-pending-badge');
        if (badge) badge.style.display = 'none';
        if (typeof window.loadPendingConfessions === 'function') {
          window.loadPendingConfessions(document.getElementById('conf-admin-body'));
        }
      });
      document.getElementById('conf-admin-back').addEventListener('click', function() {
        sheet.classList.remove('open');
        document.body.style.overflow = '';
      });
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

  document.addEventListener('DOMContentLoaded', function() {
    var editModal = document.getElementById('edit-modal');
    if (editModal) editModal.addEventListener('click', function(e) {
      if (e.target === this) closeEditModal();
    });
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

  /* ── COLLECTION VIEW PANEL ── */
  (function(){
    // CSS del panel de vista de colección
    var sv = document.createElement('style');
    sv.textContent = [
      '.cv-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:400;opacity:0;transition:opacity 0.3s;pointer-events:none;}',
      '.cv-overlay.open{opacity:1;pointer-events:all;}',
      '.cv-panel{position:fixed;inset:0;background:var(--bg);z-index:401;transform:translateX(100%);transition:transform 0.38s cubic-bezier(0.16,1,0.3,1);display:flex;flex-direction:column;}',
      '.cv-panel.open{transform:translateX(0);}',
      '.cv-header{display:flex;align-items:center;gap:0.75rem;padding:0.9rem 1rem 0.75rem;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--surface);}',
      '.cv-back{background:none;border:none;color:var(--text);width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}',
      '.cv-back svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}',
      '.cv-title{font-family:var(--font-d);font-size:1.15rem;letter-spacing:0.06em;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.cv-count{font-size:0.7rem;color:var(--text-dim);letter-spacing:0.08em;flex-shrink:0;}',
      '.cv-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0.75rem;}',
      '.cv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;}',
      '.cv-item{aspect-ratio:1;overflow:hidden;background:var(--surface-2);cursor:pointer;position:relative;}',
      '.cv-item img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.2s;}',
      '.cv-item:active img{transform:scale(0.96);}',
      '.cv-item-no-img{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--surface-3);}',
      '.cv-item-no-img svg{width:28px;height:28px;stroke:var(--text-muted);fill:none;stroke-width:1.5;}',
      '.cv-item-title{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.75));padding:0.4rem 0.4rem 0.3rem;font-size:0.58rem;color:#fff;letter-spacing:0.05em;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
      '.cv-empty{text-align:center;padding:3rem 1rem;color:var(--text-dim);font-size:0.85rem;}',
      '.cv-loading{text-align:center;padding:2.5rem;color:var(--text-dim);font-size:0.8rem;}',
      '.cv-delete-btn{margin:0.5rem 0.75rem 0;background:none;border:1px solid var(--border);color:var(--text-dim);padding:0.5rem 1rem;border-radius:10px;font-size:0.75rem;cursor:pointer;width:calc(100% - 1.5rem);text-align:left;transition:border-color 0.2s,color 0.2s;}',
      '.cv-delete-btn:active{border-color:#cc3333;color:#cc3333;}',
      /* hwConfirm modal */
      '.hw-confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:600;display:flex;align-items:center;justify-content:center;padding:1.5rem;opacity:0;pointer-events:none;transition:opacity 0.2s;}',
      '.hw-confirm-overlay.open{opacity:1;pointer-events:all;}',
      '.hw-confirm-box{background:var(--surface-2);border:1px solid var(--border);border-radius:16px;padding:1.5rem 1.25rem 1.25rem;width:100%;max-width:320px;transform:scale(0.95);transition:transform 0.2s cubic-bezier(0.16,1,0.3,1);}',
      '.hw-confirm-overlay.open .hw-confirm-box{transform:scale(1);}',
      '.hw-confirm-title{font-family:var(--font-d);font-size:1rem;letter-spacing:0.05em;margin-bottom:0.4rem;}',
      '.hw-confirm-msg{font-size:0.8rem;color:var(--text-dim);margin-bottom:1.25rem;line-height:1.4;}',
      '.hw-confirm-btns{display:flex;gap:0.6rem;}',
      '.hw-confirm-cancel{flex:1;background:var(--surface-3);border:1px solid var(--border);color:var(--text);padding:0.65rem;border-radius:10px;font-family:var(--font-b);font-size:0.85rem;cursor:pointer;}',
      '.hw-confirm-ok{flex:1;background:#cc3333;border:none;color:#fff;padding:0.65rem;border-radius:10px;font-family:var(--font-d);font-size:0.85rem;cursor:pointer;letter-spacing:0.04em;}'
    ].join('');
    document.head.appendChild(sv);

    var cvOverlay = document.createElement('div');
    cvOverlay.className = 'cv-overlay';
    cvOverlay.addEventListener('click', closeCV);

    var cvPanel = document.createElement('div');
    cvPanel.className = 'cv-panel';
    cvPanel.innerHTML = ''
      + '<div class="cv-header">'
      + '<button class="cv-back" id="cv-back"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>'
      + '<div class="cv-title" id="cv-title">Collection</div>'
      + '<div class="cv-count" id="cv-count"></div>'
      + '</div>'
      + '<button class="cv-delete-btn" id="cv-delete-btn"><svg viewBox="0 0 24 24" width="13" height="13" style="margin-right:0.35rem;vertical-align:-1px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>Delete collection'
      + '<div class="cv-body"><div class="cv-loading" id="cv-body-inner">Loading...</div></div>';

    document.body.appendChild(cvOverlay);
    document.body.appendChild(cvPanel);

    // Custom confirm modal (replaces native confirm())
    var hcOverlay = document.createElement('div');
    hcOverlay.className = 'hw-confirm-overlay';
    hcOverlay.innerHTML = '<div class="hw-confirm-box">'
      + '<div class="hw-confirm-title" id="hc-title"></div>'
      + '<div class="hw-confirm-msg" id="hc-msg"></div>'
      + '<div class="hw-confirm-btns">'
      + '<button class="hw-confirm-cancel" id="hc-cancel">Cancel</button>'
      + '<button class="hw-confirm-ok" id="hc-ok">Delete</button>'
      + '</div></div>';
    document.body.appendChild(hcOverlay);
    var _hcCallback = null;
    document.getElementById('hc-cancel').addEventListener('click', function() {
      hcOverlay.classList.remove('open'); _hcCallback = null;
    });
    document.getElementById('hc-ok').addEventListener('click', function() {
      hcOverlay.classList.remove('open');
      if (typeof _hcCallback === 'function') { var cb = _hcCallback; _hcCallback = null; cb(); }
    });
    function hwConfirm(title, msg, cb) {
      document.getElementById('hc-title').textContent = title;
      document.getElementById('hc-msg').textContent = msg;
      _hcCallback = cb;
      hcOverlay.classList.add('open');
    }

    document.getElementById('cv-back').addEventListener('click', closeCV);

    // Click delegation for cv-item (data-href)
    cvPanel.addEventListener('click', function(e) {
      var item = e.target.closest('.cv-item[data-href]');
      if (item) {
        var href = item.getAttribute('data-href');
        if (href && href !== '#') window.location.href = href;
      }
    });

    // Swipe right to close
    var swipeStartX = 0;
    cvPanel.addEventListener('touchstart', function(e){ swipeStartX = e.touches[0].clientX; }, {passive:true});
    cvPanel.addEventListener('touchend', function(e){
      if (e.changedTouches[0].clientX - swipeStartX > 70) closeCV();
    }, {passive:true});

    function closeCV() {
      cvPanel.classList.remove('open');
      cvOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.getElementById('cv-delete-btn').addEventListener('click', function() {
      var colId = cvPanel.dataset.colId;
      var colName = document.getElementById('cv-title').textContent;
      if (!colId) return;
      hwConfirm('Delete "' + colName + '"?', 'This cannot be undone.', async function() {
        try {
        var r = await fetch('/api/collections?action=delete', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ col_id: parseInt(colId) })
        });
        var d = await r.json();
        if (d.ok) {
            closeCV();
            var c = document.getElementById('my-collections-container');
            if (c && typeof window.renderMyCollections === 'function') window.renderMyCollections(c);
            if (typeof restoreSavedStates === 'function') restoreSavedStates();
          }
        } catch(e) {}
      });
    });

    window.openCollection = async function(colId, colName) {
      cvPanel.dataset.colId = colId;
      document.getElementById('cv-title').textContent = colName;
      document.getElementById('cv-count').textContent = '';
      var inner = cvPanel.querySelector('.cv-body');
      inner.innerHTML = '<div class="cv-loading">Loading...</div>';

      cvOverlay.classList.add('open');
      cvPanel.classList.add('open');
      document.body.style.overflow = 'hidden';

      try {
        var r = await fetch('/api/collections?action=items&col_id=' + encodeURIComponent(colId), { credentials: 'include' });
        var d = await r.json();
        var items = d.items || [];
        document.getElementById('cv-count').textContent = items.length + ' post' + (items.length !== 1 ? 's' : '');

        if (!items.length) {
          inner.innerHTML = '<div class="cv-empty">Nothing saved here yet.<br>Tap the bookmark on any post.</div>';
          return;
        }

        var html = '<div class="cv-grid">';
        items.forEach(function(item) {
          var href = item.post_url || '#';
          var img = item.post_image || '';
          var title = item.post_title || '';
          html += '<div class="cv-item" data-href="' + href + '">';

          if (img) {
            html += '<img src="' + img + '" loading="lazy" alt="">';
          } else {
            html += '<div class="cv-item-no-img"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
          }
          if (title) html += '<div class="cv-item-title">' + title + '</div>';
          html += '</div>';
        });
        html += '</div>';
        inner.innerHTML = html;
      } catch(e) {
        inner.innerHTML = '<div class="cv-empty">Error loading. Try again.</div>';
      }
    };
  })();


/* ── PROFILE PAGE ── */
(function(){
  'use strict';

  var ps = document.createElement('style');
  ps.textContent = [
    '.prof-topbar{display:flex;align-items:center;justify-content:space-between;padding:0.9rem 1rem 0.5rem;position:sticky;top:0;background:var(--bg);z-index:10;}',
    '.prof-topbar-title{font-family:var(--font-d);font-size:1rem;letter-spacing:0.18em;color:var(--text-dim);}',
    '.prof-menu-btn{background:none;border:none;color:var(--text-dim);padding:0.3rem;cursor:pointer;border-radius:8px;display:flex;}',
    '.prof-dropdown{display:none;position:absolute;top:calc(100% + 0.5rem);right:0;background:var(--surface-2);border:1px solid var(--border);border-radius:14px;min-width:220px;z-index:50;box-shadow:0 8px 32px rgba(0,0,0,0.5);overflow:hidden;}',
    '.prof-dropdown.open{display:block;}',
    '.prof-dd-item{display:flex;align-items:center;justify-content:space-between;padding:0.8rem 1rem;font-size:0.85rem;color:var(--text);text-decoration:none;cursor:pointer;background:none;border:none;width:100%;text-align:left;transition:background 0.15s;border-bottom:1px solid var(--border);}',
    '.prof-dd-item:last-child{border-bottom:none;}',
    '.prof-dd-item:active{background:var(--surface-3);}',
    '.prof-dd-divider{height:1px;background:var(--border);}',
    '.prof-dd-signout{color:#cc4444;}',
    '.prof-toggle{position:relative;display:inline-block;width:38px;height:22px;flex-shrink:0;}',
    '.prof-toggle input{opacity:0;width:0;height:0;position:absolute;}',
    '.prof-toggle-track{position:absolute;inset:0;background:var(--surface-3);border-radius:11px;transition:background 0.2s;cursor:pointer;}',
    '.prof-toggle-track::before{content:"";position:absolute;width:16px;height:16px;left:3px;top:3px;background:#fff;border-radius:50%;transition:transform 0.2s;}',
    '.prof-toggle input:checked + .prof-toggle-track{background:var(--fire-orange);}',
    '.prof-toggle input:checked + .prof-toggle-track::before{transform:translateX(16px);}',
    '.prof-hero{height:110px;background:linear-gradient(135deg,#1a0505 0%,#2d0a00 45%,#1a0505 100%);position:relative;}',
    '.prof-hero-glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 130%,rgba(255,69,0,0.38) 0%,transparent 65%);pointer-events:none;}',
    '.prof-hero-pattern{position:absolute;inset:0;opacity:0.05;background-image:repeating-linear-gradient(45deg,var(--fire-orange) 0,var(--fire-orange) 1px,transparent 0,transparent 50%);background-size:12px 12px;pointer-events:none;}',
    '.prof-avatar-row{padding:0 1rem;margin-top:-34px;margin-bottom:0.65rem;position:relative;z-index:2;}',
    '.prof-avatar-wrap{width:68px;height:68px;border-radius:50%;border:3px solid var(--bg);background:var(--surface-2);overflow:hidden;display:flex;align-items:center;justify-content:center;}',
    '.prof-avatar-wrap img{width:100%;height:100%;object-fit:cover;}',
    '.user-avatar-placeholder svg{width:28px;height:28px;stroke:var(--text-muted);fill:none;stroke-width:1.5;}',
    '.prof-info{padding:0 1rem 0.65rem;}',
    '.prof-fullname{font-family:var(--font-d);font-size:1.2rem;letter-spacing:0.05em;margin-bottom:0.1rem;}',
    '.prof-username-wrap{display:flex;align-items:center;gap:0.4rem;margin-bottom:0.35rem;}',
    '.prof-username{font-size:0.75rem;color:var(--text-dim);}',
    '.prof-username-edit-btn{background:none;border:none;color:var(--text-muted);padding:0.1rem;cursor:pointer;display:flex;}',
    '.prof-username-input-wrap{display:flex;gap:0.4rem;margin-bottom:0.35rem;}',
    '.prof-username-input{flex:1;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:0.3rem 0.6rem;font-size:0.8rem;font-family:var(--font-b);}',
    '.prof-username-save{background:var(--fire-orange);color:#fff;border:none;border-radius:8px;padding:0.3rem 0.7rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-d);letter-spacing:0.05em;}',
    '.prof-badge{display:inline-flex;align-items:center;gap:0.3rem;margin-bottom:0.45rem;font-size:0.58rem;letter-spacing:0.1em;text-transform:uppercase;padding:0.18rem 0.55rem;border-radius:20px;font-family:var(--font-d);}',
    '.badge-rookie{background:var(--surface-3);color:var(--text-dim);}',
    '.badge-regular{background:#1a3a1a;color:#4caf50;}',
    '.badge-soldier{background:#1a1a3a;color:#6c8fff;}',
    '.badge-vip{background:#3a1a00;color:var(--fire-orange);}',
    '.prof-bio-area{margin-top:0.2rem;}',
    '.prof-bio-text{font-size:0.8rem;color:var(--text-dim);line-height:1.5;}',
    '.prof-bio-edit-btn{background:none;border:none;color:var(--text-muted);font-size:0.75rem;cursor:pointer;padding:0;font-family:var(--font-b);font-style:italic;}',
    '.prof-bio-input{width:100%;background:var(--surface-2);border:1px solid var(--fire-orange);color:var(--text);border-radius:8px;padding:0.45rem 0.65rem;font-size:0.8rem;font-family:var(--font-b);resize:none;height:58px;outline:none;margin-top:0.3rem;line-height:1.4;box-sizing:border-box;}',
    '.prof-stats{display:flex;align-items:center;gap:1.1rem;padding:0.5rem 1rem 0.65rem;flex-wrap:wrap;}',
    '.prof-stat{display:flex;align-items:baseline;gap:0.28rem;}',
    '.prof-stat-n{font-family:var(--font-d);font-size:0.95rem;color:var(--text);line-height:1;}',
    '.prof-stat-l{font-size:0.78rem;color:var(--text-dim);}',
    '.prof-stat-div{width:3px;height:3px;border-radius:50%;background:var(--text-muted);}',
    '.prof-tabs{display:flex;border-bottom:1px solid var(--border);margin-top:0.85rem;}',
    '.prof-tab{flex:1;padding:0.65rem 0.25rem;background:none;border:none;color:var(--text-dim);font-family:var(--font-b);font-size:0.72rem;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;}',
    '.prof-tab.active{color:var(--fire-orange);border-bottom-color:var(--fire-orange);}',
    '.prof-signin-card{margin:1.25rem 1rem;background:var(--surface-2);border:1px solid var(--border);border-radius:16px;padding:1.75rem 1.25rem;text-align:center;}',
    '.prof-signin-icon{margin-bottom:0.65rem;}',
    '.prof-signin-title{font-family:var(--font-d);font-size:1rem;letter-spacing:0.06em;margin-bottom:0.3rem;}',
    '.prof-signin-sub{font-size:0.75rem;color:var(--text-dim);margin-bottom:1rem;line-height:1.4;}',
    '.prof-signin-btn{background:var(--fire-orange);color:#fff;border:none;border-radius:10px;padding:0.65rem 1.5rem;font-family:var(--font-d);font-size:0.85rem;letter-spacing:0.06em;cursor:pointer;}',
    '.prof-act-row{display:flex;align-items:center;gap:0.75rem;padding:0.7rem 0;background:none;border:none;color:var(--text);width:100%;text-align:left;cursor:pointer;}',
    '.prof-act-icon{width:36px;height:36px;border-radius:10px;background:var(--surface-2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
    '.prof-act-icon svg{stroke:var(--text-dim);}',
    '.prof-act-text{flex:1;}',
    '.prof-act-label{font-size:0.85rem;}',
    '.prof-act-sub{font-size:0.67rem;color:var(--text-dim);margin-top:0.08rem;}',
    '.prof-act-divider{height:1px;background:var(--border);margin:0;}'
  ].join('');
  document.head.appendChild(ps);

  /* Dropdown */
  var menuBtn  = document.getElementById('prof-menu-btn');
  var dropdown = document.getElementById('prof-dropdown');
  if (menuBtn && dropdown) {
    menuBtn.addEventListener('click', function(e){ e.stopPropagation(); dropdown.classList.toggle('open'); });
    document.addEventListener('click', function(){ dropdown.classList.remove('open'); });
  }
  var ddSignOut = document.getElementById('prof-dd-signout');
  if (ddSignOut) ddSignOut.addEventListener('click', function(){
    if (typeof HottAuth !== 'undefined') HottAuth.logout();
  });
  var adultToggle = document.getElementById('toggle-adult');
  var notifToggle = document.getElementById('toggle-notif');
  if (notifToggle) notifToggle.addEventListener('change', function(){
    if (window.OneSignal) {
      if (this.checked) window.OneSignal.User.PushSubscription.optIn();
      else window.OneSignal.User.PushSubscription.optOut();
    }
  });

  /* Tabs */
  document.addEventListener('click', function(e){
    var tab = e.target.closest('.prof-tab[data-ptab]');
    if (!tab) return;
    var id = tab.getAttribute('data-ptab');
    document.querySelectorAll('.prof-tab').forEach(function(t){ t.classList.remove('active'); });
    document.querySelectorAll('.prof-tab-pane').forEach(function(p){ p.style.display='none'; });
    tab.classList.add('active');
    var pane = document.getElementById('ptab-'+id);
    if (pane) pane.style.display = 'block';
    if (id==='collections'){
      var c2=document.getElementById('my-collections-container');
      if (c2 && typeof window.renderMyCollections==='function') window.renderMyCollections(c2);
    }
    if (id==='posts'){
      var pc=document.getElementById('posts-feed-container');
      if (pc && typeof window.loadPostsFeed==='function') window.loadPostsFeed(pc);
    }
  });

  /* Username */
  var usernameDisplay   = document.getElementById('prof-username-display');
  var usernameWrap      = document.getElementById('prof-username-wrap');
  var usernameInputWrap = document.getElementById('prof-username-input-wrap');
  var usernameInput     = document.getElementById('prof-username-input');
  var usernameSave      = document.getElementById('prof-username-save');
  var editBtn           = document.getElementById('prof-username-edit-btn');
  function showUsernameInput(){
    if(usernameWrap) usernameWrap.style.display='none';
    if(usernameInputWrap) usernameInputWrap.style.display='flex';
    if(usernameInput){ usernameInput.value=(usernameDisplay&&usernameDisplay.textContent.replace('@',''))||''; usernameInput.focus(); }
  }
  function hideUsernameInput(){
    if(usernameWrap) usernameWrap.style.display='flex';
    if(usernameInputWrap) usernameInputWrap.style.display='none';
  }
  if(editBtn) editBtn.addEventListener('click', showUsernameInput);
  if(usernameSave) usernameSave.addEventListener('click', async function(){
    var val=usernameInput?usernameInput.value.trim().replace(/[^a-zA-Z0-9_]/g,''):'';
    if(!val){ hideUsernameInput(); return; }
    try{
      var r=await fetch('/api/profile',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:val})});
      var d=await r.json();
      if(d.ok){ if(usernameDisplay) usernameDisplay.textContent='@'+val; hideUsernameInput(); }
    }catch(e){ hideUsernameInput(); }
  });

  /* Bio */
  var bioEditing = false;
  function showBioInput(){
    if(bioEditing) return;
    bioEditing = true;
    var bioArea=document.getElementById('prof-bio-area');
    var bioText=document.getElementById('prof-bio-text');
    var current=bioText?bioText.textContent:'';
    var ta=document.createElement('textarea');
    ta.className='prof-bio-input'; ta.value=current; ta.maxLength=120;
    ta.placeholder='Write something about yourself...';
    if(bioArea){ bioArea.innerHTML=''; bioArea.appendChild(ta); }
    ta.focus();
    ta.addEventListener('blur', async function(){
      var val=ta.value.trim();
      bioEditing=false;
      var bioArea2=document.getElementById('prof-bio-area');
      if(bioArea2){
        bioArea2.innerHTML='<div class="prof-bio-text" id="prof-bio-text">'+val+'</div>'
          +'<button class="prof-bio-edit-btn" id="prof-bio-edit-btn">'+(val?'Edit bio':'+ Add bio')+'</button>';
        document.getElementById('prof-bio-edit-btn').addEventListener('click', showBioInput);
      }
      try{ await fetch('/api/profile',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({bio:val})}); }catch(e){}
    });
  }
  var bioEditBtnEl=document.getElementById('prof-bio-edit-btn');
  if(bioEditBtnEl) bioEditBtnEl.addEventListener('click', showBioInput);

  /* Activity */
  var rowLiked=document.getElementById('prof-row-liked');
  var rowComments=document.getElementById('prof-row-comments');
  if(rowLiked)    rowLiked.addEventListener('click',    function(){ if(typeof openActivityPanel==='function') openActivityPanel('likes'); });
  if(rowComments) rowComments.addEventListener('click', function(){ if(typeof openActivityPanel==='function') openActivityPanel('comments'); });

  /* Load profile */
  function loadProfilePage(){
    var user=window.currentUser;
    var signinCard=document.getElementById('prof-signin-card');
    var tabs=document.getElementById('prof-tabs');
    var stats=document.getElementById('prof-stats');
    var badge=document.getElementById('prof-badge');
    var unWrap=document.getElementById('prof-username-wrap');
    var bioAreaEl=document.getElementById('prof-bio-area');

    if(user){
      if(signinCard) signinCard.style.display='none';
      if(tabs)       tabs.style.display='';
      if(stats)      stats.style.display='';
      if(unWrap)     unWrap.style.display='flex';
      if(bioAreaEl)  bioAreaEl.style.display='';
      if(badge){
        var lvl=(user.level)||'Rookie';
        var bdg=(user.badge)||'&#128304;';
        var clsMap={Rookie:'badge-rookie',Regular:'badge-regular',Soldier:'badge-soldier',VIP:'badge-vip'};
        badge.textContent=bdg+' '+lvl;
        badge.className='prof-badge '+(clsMap[lvl]||'badge-rookie');
        badge.style.display='';
      }
      var likedArr=[];
      try{ likedArr=JSON.parse(localStorage.getItem('hw_liked_v2')||'[]'); }catch(e){}
      var statLikes=document.getElementById('stat-likes');
      if(statLikes) statLikes.textContent=likedArr.length;
      fetch('/api/collections',{credentials:'include'}).then(function(r){return r.json();}).then(function(d){
        var cols=d.collections||[];
        var sc=document.getElementById('stat-collections'); if(sc) sc.textContent=cols.length;
        var ss=document.getElementById('stat-saved'); if(ss) ss.textContent=cols.reduce(function(a,b){return a+(b.count||0);},0);
        var actSub=document.getElementById('act-liked-count'); if(actSub) actSub.textContent=likedArr.length+' posts liked';
        var c2=document.getElementById('my-collections-container');
        if(c2 && typeof window.renderMyCollections==='function') window.renderMyCollections(c2);
      }).catch(function(){});
      fetch('/api/profile',{credentials:'include'}).then(function(r){return r.json();}).then(function(d){
        if(d.username && usernameDisplay) usernameDisplay.textContent='@'+d.username;
        if(d.bio){
          var bt=document.getElementById('prof-bio-text'); if(bt) bt.textContent=d.bio;
          var eb=document.getElementById('prof-bio-edit-btn'); if(eb) eb.textContent='Edit bio';
        }
      }).catch(function(){});
      if(adultToggle) adultToggle.checked=true;
      var pc=document.getElementById('posts-feed-container');
      if(pc && typeof window.loadPostsFeed==='function') window.loadPostsFeed(pc);
    } else {
      if(signinCard) signinCard.style.display='';
      if(tabs)       tabs.style.display='none';
      if(stats)      stats.style.display='none';
      if(unWrap)     unWrap.style.display='none';
      if(badge)      badge.style.display='none';
      if(bioAreaEl)  bioAreaEl.style.display='none';
      if(adultToggle) adultToggle.checked=false;
      document.querySelectorAll('.prof-tab-pane').forEach(function(p){ p.style.display='none'; });
      var pp=document.getElementById('ptab-posts'); if(pp) pp.style.display='block';
    }
  }

  document.querySelectorAll('.nav-item[data-page="more"]').forEach(function(btn){
    btn.addEventListener('click', loadProfilePage);
  });
  if(typeof HottAuth!=='undefined'){
    HottAuth.onChange(function(){
      if(document.getElementById('page-more')&&document.getElementById('page-more').classList.contains('active'))
        loadProfilePage();
    });
  }
  window.loadProfilePage = loadProfilePage;

})();

/* ── ACTIVITY PANEL ── */
(function(){
  'use strict';

  /* CSS */
  var as = document.createElement('style');
  as.textContent = [
    '.act-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:300;opacity:0;pointer-events:none;transition:opacity 0.25s;}',
    '.act-overlay.open{opacity:1;pointer-events:all;}',
    '.act-panel{position:fixed;inset:0;background:var(--bg);z-index:301;display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);}',
    '.act-panel.open{transform:translateX(0);}',
    '.act-header{display:flex;align-items:center;gap:0.75rem;padding:0.9rem 1rem 0.75rem;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;}',
    '.act-back{background:none;border:none;color:var(--text);width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}',
    '.act-back svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}',
    '.act-title{font-family:var(--font-d);font-size:1.1rem;letter-spacing:0.07em;flex:1;}',
    /* Tab bar */
    '.act-tabs{display:flex;border-bottom:1px solid var(--border);flex-shrink:0;}',
    '.act-tab{flex:1;padding:0.7rem;background:none;border:none;color:var(--text-dim);font-family:var(--font-b);font-size:0.8rem;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;border-bottom:2px solid transparent;transition:color 0.2s,border-color 0.2s;}',
    '.act-tab.active{color:var(--fire-orange);border-bottom-color:var(--fire-orange);}',
    /* Content */
    '.act-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;}',
    '.act-loading{padding:2.5rem;text-align:center;color:var(--text-dim);font-size:0.82rem;}',
    '.act-empty{padding:3rem 1.5rem;text-align:center;color:var(--text-dim);font-size:0.82rem;line-height:1.5;}',
    /* Post row */
    '.act-post{display:flex;align-items:center;gap:0.75rem;padding:0.75rem 1rem;border-bottom:1px solid var(--border);cursor:pointer;text-decoration:none;color:var(--text);transition:background 0.15s;-webkit-tap-highlight-color:transparent;}',
    '.act-post:active{background:var(--surface-2);}',
    '.act-post-thumb{width:52px;height:52px;border-radius:8px;object-fit:cover;flex-shrink:0;background:var(--surface-2);}',
    '.act-post-thumb-placeholder{width:52px;height:52px;border-radius:8px;flex-shrink:0;background:var(--surface-2);display:flex;align-items:center;justify-content:center;}',
    '.act-post-info{flex:1;min-width:0;}',
    '.act-post-title{font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:0.2rem;}',
    '.act-post-meta{font-size:0.7rem;color:var(--text-dim);}',
    '.act-comment-body{font-size:0.75rem;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:0.15rem;}',
    '.act-chev{color:var(--text-muted);flex-shrink:0;}',
    '.act-comment-body video,.act-comment-sticker{max-width:52px;height:52px;border-radius:6px;display:block;object-fit:cover;}'
  ].join('');
  document.head.appendChild(as);

  /* DOM */
  var overlay = document.createElement('div');
  overlay.className = 'act-overlay';

  var panel = document.createElement('div');
  panel.className = 'act-panel';
  panel.innerHTML =
    '<div class="act-header">'
    + '<button class="act-back" id="act-back"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>'
    + '<div class="act-title">My Activity</div>'
    + '</div>'
    + '<div class="act-tabs">'
    + '<button class="act-tab active" data-tab="likes">&#128293; Likes</button>'
    + '<button class="act-tab" data-tab="comments">&#128172; Comments</button>'
    + '</div>'
    + '<div class="act-body" id="act-body"><div class="act-loading">Loading...</div></div>';

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  var currentTab = 'likes';

  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('act-back').addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);

  /* Swipe right to close */
  var swipeX = 0;
  panel.addEventListener('touchstart', function(e){ swipeX = e.touches[0].clientX; }, {passive:true});
  panel.addEventListener('touchend',   function(e){ if (e.changedTouches[0].clientX - swipeX > 70) closePanel(); }, {passive:true});

  /* Tab switching */
  panel.querySelectorAll('.act-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      panel.querySelectorAll('.act-tab').forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      currentTab = tab.getAttribute('data-tab');
      loadTab(currentTab);
    });
  });

  /* Find post in ALL_POSTS by post_id (= post.path) */
  function findPost(postId) {
    if (!window.ALL_POSTS) return null;
    return window.ALL_POSTS.find(function(p){ return p.path === postId || p.url === postId; }) || null;
  }

  function postThumb(post) {
    var img = (post && (post.image || (post.images && post.images[0]))) || '';
    if (img) return '<img class="act-post-thumb" src="'+img+'" loading="lazy" alt="">';
    return '<div class="act-post-thumb-placeholder"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
  }

  function postTitle(post, postId) {
    if (post && post.title) return post.title;
    /* Fallback: shorten the path */
    return postId ? postId.split('/').pop().replace(/\.md$/,'') : 'Post';
  }

  function renderLikes(postIds) {
    if (!postIds.length) {
      return '<div class="act-empty">No liked posts yet.<br>Tap the &#128293; on any post to like it.</div>';
    }
    return postIds.map(function(id) {
      var post = findPost(id);
      var url  = (post && post.url) || '#';
      var title = postTitle(post, id);
      return '<a class="act-post" href="'+url+'">'
        + postThumb(post)
        + '<div class="act-post-info">'
        + '<div class="act-post-title">'+title+'</div>'
        + '<div class="act-post-meta">Liked</div>'
        + '</div>'
        + '<svg class="act-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>'
        + '</a>';
    }).join('');
  }

  function renderComments(comments) {
    if (!comments.length) {
      return '<div class="act-empty">No comments yet.<br>Join the conversation on any post.</div>';
    }
    return comments.map(function(row) {
      var post  = findPost(row.post_id);
      var url   = (post && post.url) || '#';
      var title = postTitle(post, row.post_id);
      var date  = row.created_at ? new Date(row.created_at).toLocaleDateString() : '';
      return '<a class="act-post" href="'+url+'">'
        + postThumb(post)
        + '<div class="act-post-info">'
        + '<div class="act-post-title">'+title+'</div>'
        + '<div class="act-comment-body">'+renderCommentBody(row.body)+'</div>'
        + '<div class="act-post-meta">'+date+'</div>'
        + '</div>'
        + '<svg class="act-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>'
        + '</a>';
    }).join('');
  }

  function escapeHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderCommentBody(body) {
    var s = String(body||'');
    var m = s.match(/\[sticker\]([^\[]+)\[\/sticker\]/);
    if (m) {
      return '<video class="act-comment-sticker" src="'+m[1]+'" autoplay loop muted playsinline></video>';
    }
    return escapeHtml(s);
  }

  async function loadTab(type) {
    var body = document.getElementById('act-body');
    if (!body) return;
    body.innerHTML = '<div class="act-loading">Loading...</div>';
    try {
      var r = await fetch('/api/activity?type='+type, {credentials:'include'});
      var d = await r.json();
      if (type === 'likes') {
        body.innerHTML = renderLikes(d.post_ids || []);
      } else {
        body.innerHTML = renderComments(d.comments || []);
      }
    } catch(e) {
      body.innerHTML = '<div class="act-empty">Could not load. Check your connection.</div>';
    }
  }

  window.openActivityPanel = function(type) {
    currentTab = type || 'likes';
    panel.querySelectorAll('.act-tab').forEach(function(t){
      t.classList.toggle('active', t.getAttribute('data-tab') === currentTab);
    });
    panel.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    loadTab(currentTab);
  };

  /* Expose ALL_POSTS for cross-reference */
  if (!window.ALL_POSTS) window.ALL_POSTS = [];

})();

/* ── TRENDING ── */
(function(){
  'use strict';

  /* CSS para trd-pills */
  var ts = document.createElement('style');
  ts.textContent = [
    '.trd-pill{display:inline-block;padding:0.3rem 0.85rem;margin-right:0.4rem;border-radius:20px;',
    'background:var(--surface-2);border:1px solid var(--border);color:var(--text-dim);',
    'font-size:0.72rem;letter-spacing:0.06em;cursor:pointer;transition:all 0.2s;white-space:nowrap;',
    'font-family:var(--font-b);}',
    '.trd-pill.active{background:var(--fire-orange);border-color:var(--fire-orange);color:#fff;}',
    '#trending-bar{scrollbar-width:none;}',
    '#trending-bar::-webkit-scrollbar{display:none;}'
  ].join('');
  document.head.appendChild(ts);

  var trendingBar  = document.getElementById('trending-bar');
  var activeTrdType = 'hot';
  var TRENDING_IDS  = [];   /* post_ids del servidor en orden */
  var loading       = false;

  /* Reordenar ALL_POSTS según array de post_ids del servidor */
  function getTrendingPosts() {
    if (!window.ALL_POSTS || !TRENDING_IDS.length) return [];
    var map = {};
    window.ALL_POSTS.forEach(function(p){ map[p.path] = p; });
    var ordered = [];
    TRENDING_IDS.forEach(function(id){
      if (map[id]) ordered.push(map[id]);
    });
    /* Append posts not in trending at the end (por si hay pocos) */
    if (ordered.length < 5) {
      window.ALL_POSTS.forEach(function(p){
        if (!TRENDING_IDS.includes(p.path)) ordered.push(p);
      });
    }
    return ordered;
  }

  async function loadTrending(type) {
    if (loading) return;
    loading = true;
    activeTrdType = type;

    /* Highlight pill */
    if (trendingBar) {
      trendingBar.querySelectorAll('.trd-pill').forEach(function(p){
        p.classList.toggle('active', p.getAttribute('data-trd') === type);
      });
    }

    /* Mostrar spinner en el feed */
    var container = document.getElementById('feed-container');
    if (container) container.innerHTML = '<div style="padding:2.5rem;text-align:center;color:var(--text-dim);font-size:0.85rem;">Loading trending...</div>';

    try {
      var r = await fetch('/api/trending?type=' + type);
      var d = await r.json();
      TRENDING_IDS = d.post_ids || [];
    } catch(e) {
      TRENDING_IDS = [];
    }

    loading = false;
    /* Si no hay resultados trending, mostrar todos los posts ordenados por fecha */
    if (!TRENDING_IDS.length && window.ALL_POSTS && window.ALL_POSTS.length) {
      if (typeof window._renderTrendingFeed === 'function') {
        window._renderTrendingFeed(window.ALL_POSTS.slice());
      }
      return;
    }

    /* Renderizar usando la misma maquinaria del feed */
    if (typeof window._renderTrendingFeed === 'function') {
      window._renderTrendingFeed(getTrendingPosts());
    }
  }

  /* Exponer para que el IIFE del feed lo pueda usar */
  window._getTrendingPosts = getTrendingPosts;

  /* Cat-pill Trending click */
  document.addEventListener('DOMContentLoaded', function() {
    /* Cat pill click */
    var catPills = document.getElementById('cat-pills');
    if (catPills) {
      catPills.addEventListener('click', function(e) {
        var pill = e.target.closest('.cat-pill[data-cat="trending"]');
        if (!pill) {
          /* Otra pill — ocultar trending bar */
          if (trendingBar) { trendingBar.style.maxHeight = '0'; trendingBar.style.padding = '0 0.75rem'; adjustFeedPadding(); }
          return;
        }
        /* Activar trending */
        catPills.querySelectorAll('.cat-pill').forEach(function(p){ p.classList.remove('active'); });
        pill.classList.add('active');
        if (trendingBar) {
          trendingBar.style.maxHeight = '44px';
          trendingBar.style.padding = '0.35rem 0.75rem 0.25rem';
        }
        adjustFeedPadding();
        /* setFeedFilter con modo trending especial */
        if (typeof window.setTrendingFilter === 'function') window.setTrendingFilter('hot');
      });
    }

    /* Trd-pill clicks */
    if (trendingBar) {
      trendingBar.addEventListener('click', function(e) {
        var pill = e.target.closest('.trd-pill[data-trd]');
        if (!pill) return;
        var type = pill.getAttribute('data-trd');
        loadTrending(type);
      });
    }
  });

  /* Ajustar padding del feed según altura real del top-strip */
  function adjustFeedPadding() {
    var topStrip = document.getElementById('top-strip');
    var feedPage = document.getElementById('page-home');
    if (!topStrip || !feedPage) return;
    /* Dar un frame para que el max-height ya animó */
    requestAnimationFrame(function() {
      feedPage.style.paddingTop = topStrip.offsetHeight + 'px';
    });
  }
  window.adjustFeedPadding = adjustFeedPadding;

  /* Inicializar al cargar trending type */
  window.setTrendingFilter = function(type) {
    loadTrending(type || 'hot');
  };

})();

/* ── CONFESSIONS — Locker Room Anonymous Stories ── */
(function(){
  'use strict';

  /* CSS */
  var cs = document.createElement('style');
  cs.textContent = [
    /* Bar */
    '.conf-bar{padding:0.75rem 1rem 0.5rem;display:flex;justify-content:flex-end;}',
    '.conf-share-btn{display:flex;align-items:center;gap:0.45rem;background:var(--fire-orange);color:#fff;border:none;border-radius:20px;padding:0.5rem 1.1rem;font-family:var(--font-d);font-size:0.8rem;letter-spacing:0.06em;cursor:pointer;transition:transform 0.15s;}',
    '.conf-share-btn:active{transform:scale(0.95);}',
    /* Feed */
    '.conf-feed{padding:0 0.85rem 1rem;}',
    '.conf-loading{padding:1.5rem;text-align:center;color:var(--text-dim);font-size:0.82rem;}',
    '.conf-empty{padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;line-height:1.5;}',
    /* Card */
    '.conf-card{background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:1rem;margin-bottom:0.75rem;}',
    '.conf-card-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;}',
    '.conf-badge{font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;padding:0.2rem 0.6rem;border-radius:20px;font-family:var(--font-d);}',
    '.conf-badge-confession{background:#1a0a2e;color:#c084fc;}',
    '.conf-badge-fantasy{background:#1a0a00;color:var(--fire-orange);}',
    '.conf-badge-experience{background:#0a1a0a;color:#4ade80;}',
    '.conf-badge-rumor{background:#1a1a0a;color:#facc15;}',
    '.conf-date{font-size:0.65rem;color:var(--text-muted);}',
    '.conf-body{font-size:0.88rem;line-height:1.55;color:var(--text);margin-bottom:0.75rem;}',
    '.conf-actions{display:flex;gap:0.5rem;justify-content:flex-end;}',
    '.conf-like-btn{background:none;border:1px solid var(--border);color:var(--text-dim);border-radius:20px;padding:0.3rem 0.75rem;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;gap:0.35rem;transition:all 0.2s;font-family:var(--font-b);}',
    '.conf-like-btn.liked{color:#ff3b5c;border-color:#ff3b5c;}',
    /* Submit panel */
    '.conf-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:300;opacity:0;pointer-events:none;transition:opacity 0.25s;}',
    '.conf-overlay.open{opacity:1;pointer-events:all;}',
    '.conf-panel{position:fixed;left:0;right:0;bottom:0;background:var(--surface);border-radius:20px 20px 0 0;border-top:1px solid var(--border);z-index:301;padding:0.5rem 1.25rem 2rem;transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);}',
    '.conf-panel.open{transform:translateY(0);}',
    '.conf-panel-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 1rem;}',
    '.conf-panel-title{font-family:var(--font-d);font-size:1rem;letter-spacing:0.07em;margin-bottom:0.85rem;}',
    '.conf-select{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:0.6rem 0.85rem;font-size:0.85rem;font-family:var(--font-b);margin-bottom:0.75rem;-webkit-appearance:none;}',
    '.conf-textarea{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:0.75rem;font-size:0.85rem;font-family:var(--font-b);resize:none;height:120px;line-height:1.5;margin-bottom:0.75rem;box-sizing:border-box;}',
    '.conf-textarea:focus{outline:none;border-color:var(--fire-orange);}',
    '.conf-submit-btn{width:100%;background:var(--fire-orange);color:#fff;border:none;border-radius:12px;padding:0.75rem;font-family:var(--font-d);font-size:0.9rem;letter-spacing:0.07em;cursor:pointer;margin-bottom:0.6rem;transition:opacity 0.2s;}',
    '.conf-submit-btn:disabled{opacity:0.5;}',
    '.conf-anon-note{text-align:center;font-size:0.7rem;color:var(--text-muted);letter-spacing:0.06em;}',
    /* Admin moderation */
    '.conf-admin-card{background:var(--surface-3);border:1px solid var(--border);border-radius:12px;padding:0.85rem;margin-bottom:0.6rem;}',
    '.conf-admin-body{font-size:0.82rem;line-height:1.5;margin-bottom:0.6rem;color:var(--text);}',
    '.conf-admin-actions{display:flex;gap:0.5rem;}',
    '.conf-approve-btn{flex:1;background:#1a3a1a;border:1px solid #4ade80;color:#4ade80;border-radius:8px;padding:0.45rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-d);letter-spacing:0.05em;}',
    '.conf-reject-btn{flex:1;background:#3a1a1a;border:1px solid #cc4444;color:#cc4444;border-radius:8px;padding:0.45rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-d);letter-spacing:0.05em;}',
    /* Title input */
    '.conf-title-input{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:0.6rem 0.85rem;font-size:0.85rem;font-family:var(--font-b);margin-bottom:0.75rem;box-sizing:border-box;}',
    '.conf-title-input:focus{outline:none;border-color:var(--fire-orange);}',
    /* Card preview */
    '.conf-card-title{font-family:var(--font-d);font-size:0.95rem;letter-spacing:0.04em;margin-bottom:0.45rem;}',
    '.conf-body-preview{font-size:0.85rem;line-height:1.55;color:var(--text);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:0.6rem;}',
    '.conf-read-btn{background:none;border:none;color:var(--fire-orange);font-size:0.75rem;cursor:pointer;padding:0;font-family:var(--font-b);letter-spacing:0.04em;}',
    /* Reader panel */
    '.conf-reader{position:fixed;inset:0;background:var(--bg);z-index:400;display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);}',
    '.conf-reader.open{transform:translateX(0);}',
    '.conf-reader-header{display:flex;align-items:center;gap:0.75rem;padding:0.9rem 1rem 0.75rem;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;}',
    '.conf-reader-back{background:none;border:none;color:var(--text);width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}',
    '.conf-reader-back svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}',
    '.conf-reader-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:1.25rem 1rem 3rem;}',
    '.conf-reader-category{margin-bottom:0.85rem;}',
    '.conf-reader-title{font-family:var(--font-d);font-size:1.3rem;letter-spacing:0.05em;line-height:1.25;margin-bottom:1rem;}',
    '.conf-reader-date{font-size:0.7rem;color:var(--text-muted);margin-bottom:1.5rem;}',
    '.conf-reader-text{font-size:0.92rem;line-height:1.7;color:var(--text-dim);white-space:pre-wrap;word-break:break-word;}',
    '.conf-reader-footer{padding:1rem 1rem;border-top:1px solid var(--border);display:flex;align-items:center;justify-content:flex-end;flex-shrink:0;}'
  ].join('');
  document.head.appendChild(cs);

  /* ── Helpers ── */
  var LIKED_KEY = 'hw_conf_liked';
  function getLiked() {
    try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY)||'[]')); } catch(e){ return new Set(); }
  }
  function saveLiked(set) {
    try { localStorage.setItem(LIKED_KEY, JSON.stringify([...set])); } catch(e){}
  }

  function timeAgo(dateStr) {
    var diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60)   return 'just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
  }

  function catBadge(cat) {
    var labels = {confession:'Confession',fantasy:'Fantasy',experience:'Experience',rumor:'Rumor'};
    return '<span class="conf-badge conf-badge-'+cat+'">'+(labels[cat]||cat)+'</span>';
  }

  /* ── Render feed ── */
  function renderFeed(confessions) {
    var feed = document.getElementById('conf-feed');
    if (!feed) return;
    window._confCache = confessions; /* cache para el reader */
    if (!confessions.length) {
      feed.innerHTML = '<div class="conf-empty">No stories yet.<br>Be the first to share.</div>';
      return;
    }
    var liked = getLiked();
    feed.innerHTML = confessions.map(function(cf) {
      var isLiked = liked.has(String(cf.id));
      var hasMore = cf.body && cf.body.length > 180;
      return '<div class="conf-card" data-conf-id="'+cf.id+'" style="cursor:pointer;">'
        + '<div class="conf-card-top">'+catBadge(cf.category||'confession')+'<span class="conf-date">'+timeAgo(cf.created_at)+'</span></div>'
        + (cf.title ? '<div class="conf-card-title">'+escH(cf.title)+'</div>' : '')
        + '<div class="conf-body-preview">'+escH(cf.body)+'</div>'
        + (hasMore ? '<button class="conf-read-btn">Read full story &rsaquo;</button>' : '')
        + '<div class="conf-actions">'
        + '<button class="conf-like-btn'+(isLiked?' liked':'')+' " data-conf-id="'+cf.id+'">'
        + '<svg viewBox="0 0 24 24" width="14" height="14" fill="'+(isLiked?'#ff3b5c':'none')+'" stroke="'+(isLiked?'#ff3b5c':'currentColor')+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
        + '</button>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  function escH(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  }

  /* ── Load confessions ── */
  async function loadConfessions() {
    var feed = document.getElementById('conf-feed');
    if (!feed) return;
    try {
      var r = await fetch('/api/confessions');
      var d = await r.json();
      renderFeed(d.confessions || []);
    } catch(e) {
      if (feed) feed.innerHTML = '<div class="conf-empty">Could not load stories.</div>';
    }
  }

  /* ── Like toggle (localStorage, no login needed) ── */
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.conf-like-btn[data-conf-id]');
    if (!btn) return;
    var id = String(btn.getAttribute('data-conf-id'));
    var liked = getLiked();
    var svg = btn.querySelector('svg');
    if (liked.has(id)) {
      liked.delete(id);
      btn.classList.remove('liked');
      if (svg) { svg.setAttribute('fill','none'); svg.setAttribute('stroke','currentColor'); }
    } else {
      liked.add(id);
      btn.classList.add('liked');
      if (svg) { svg.setAttribute('fill','#ff3b5c'); svg.setAttribute('stroke','#ff3b5c'); }
    }
    saveLiked(liked);
  });

  /* ── Submit panel ── */
  /* Crear overlay y panel en body para que position:fixed funcione correctamente */
  var overlay = document.createElement('div');
  overlay.className = 'conf-overlay';
  overlay.id = 'conf-overlay';
  document.body.appendChild(overlay);

  var panel = document.createElement('div');
  panel.className = 'conf-panel';
  panel.id = 'conf-panel';
  panel.innerHTML =
    '<div class="conf-panel-handle"></div>'
    + '<div class="conf-panel-title">Share Anonymously</div>'
    + '<select class="conf-select" id="conf-cat">'
    + '<option value="confession">&#128172; Confession</option>'
    + '<option value="fantasy">&#128293; Fantasy</option>'
    + '<option value="experience">&#9989; Experience</option>'
    + '<option value="rumor">&#128483; Rumor</option>'
    + '</select>'
    + '<input class="conf-title-input" id="conf-title" type="text" maxlength="100" placeholder="Title (optional)">'
    + '<textarea class="conf-textarea" id="conf-textarea" maxlength="1000" placeholder="Share your confession, fantasy or experience... 100% anonymous"></textarea>'
    + '<button class="conf-submit-btn" id="conf-submit-btn">Submit Story</button>'
    + '<div class="conf-anon-note">&#128274; Your identity is never stored</div>';
  document.body.appendChild(panel);

  var shareBtn  = document.getElementById('conf-share-btn');
  var submitBtn = document.getElementById('conf-submit-btn');
  var textarea  = document.getElementById('conf-textarea');
  var catSel    = document.getElementById('conf-cat');

  function openPanel() {
    if (!panel) return;
    panel.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (textarea) textarea.focus();
  }
  function closePanel() {
    if (!panel) return;
    panel.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* Reader panel — slide in from right */
  var reader = document.createElement('div');
  reader.className = 'conf-reader';
  reader.innerHTML =
    '<div class="conf-reader-header">'
    + '<button class="conf-reader-back" id="conf-reader-back"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>'
    + '<div style="flex:1;"></div>'
    + '<span id="conf-reader-badge"></span>'
    + '</div>'
    + '<div class="conf-reader-body">'
    + '<div class="conf-reader-category" id="conf-reader-cat"></div>'
    + '<div class="conf-reader-title" id="conf-reader-title"></div>'
    + '<div class="conf-reader-date" id="conf-reader-date"></div>'
    + '<div class="conf-reader-text" id="conf-reader-text"></div>'
    + '</div>'
    + '<div class="conf-reader-footer">'
    + '<button class="conf-like-btn" id="conf-reader-like"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>'
    + '</div>';
  document.body.appendChild(reader);

  var readerConfId = null;

  function openReader(conf) {
    readerConfId = String(conf.id);
    var catEl  = document.getElementById('conf-reader-cat');
    var titleEl= document.getElementById('conf-reader-title');
    var dateEl = document.getElementById('conf-reader-date');
    var textEl = document.getElementById('conf-reader-text');
    var likeBtn= document.getElementById('conf-reader-like');
    if (catEl)   catEl.innerHTML  = catBadge(conf.category||'confession');
    if (titleEl) titleEl.textContent = conf.title || '';
    if (dateEl)  dateEl.textContent  = timeAgo(conf.created_at);
    if (textEl)  textEl.textContent  = conf.body || '';
    /* Like state */
    var liked = getLiked();
    var isLiked = liked.has(readerConfId);
    if (likeBtn) {
      likeBtn.setAttribute('data-conf-id', readerConfId);
      likeBtn.classList.toggle('liked', isLiked);
      var svg = likeBtn.querySelector('svg');
      if (svg) { svg.setAttribute('fill', isLiked?'#ff3b5c':'none'); svg.setAttribute('stroke', isLiked?'#ff3b5c':'currentColor'); }
    }
    reader.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeReader() {
    reader.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('conf-reader-back').addEventListener('click', closeReader);
  /* Swipe right to close reader */
  var rSwipeX = 0;
  reader.addEventListener('touchstart', function(e){ rSwipeX = e.touches[0].clientX; }, {passive:true});
  reader.addEventListener('touchend',   function(e){ if (e.changedTouches[0].clientX - rSwipeX > 70) closeReader(); }, {passive:true});

  /* Open reader on card click (but not like button) */
  document.addEventListener('click', function(e) {
    if (e.target.closest('.conf-like-btn')) return;
    var card = e.target.closest('.conf-card[data-conf-id]');
    if (!card) return;
    var id = card.getAttribute('data-conf-id');
    var conf = window._confCache && window._confCache.find(function(x){ return String(x.id)===id; });
    if (conf) openReader(conf);
  });

  if (shareBtn) shareBtn.addEventListener('click', openPanel);
  if (overlay)  overlay.addEventListener('click', closePanel);

  /* Swipe down to close */
  var swipeY = 0;
  if (panel) {
    panel.addEventListener('touchstart', function(e){ swipeY = e.touches[0].clientY; }, {passive:true});
    panel.addEventListener('touchend',   function(e){ if (e.changedTouches[0].clientY - swipeY > 60) closePanel(); }, {passive:true});
  }

  if (submitBtn) submitBtn.addEventListener('click', async function() {
    var text = textarea ? textarea.value.trim() : '';
    if (!text) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    try {
      var r = await fetch('/api/confessions', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action:'submit', body: text,
          title: document.getElementById('conf-title') ? document.getElementById('conf-title').value.trim() : '',
          category: catSel ? catSel.value : 'confession' })
      });
      var d = await r.json();
      if (d.ok) {
        closePanel();
        if (textarea) textarea.value = '';
        var ti = document.getElementById('conf-title'); if (ti) ti.value = '';
        /* Show toast */
        var toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = 'Story submitted! Pending review.';
          toast.classList.add('show');
          setTimeout(function(){ toast.classList.remove('show'); }, 3000);
        }
      }
    } catch(e) {}
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Story';
  });

  /* ── Admin: load pending confessions ── */
  window.loadPendingConfessions = async function(container) {
    if (!container) return;
    container.innerHTML = '<div style="padding:1rem;color:var(--text-dim);font-size:0.82rem;">Loading...</div>';
    try {
      var r = await fetch('/api/confessions?status=pending', {credentials:'include'});
      var d = await r.json();
      var items = d.confessions || [];
      if (!items.length) {
        container.innerHTML = '<div style="padding:1rem;color:var(--text-dim);font-size:0.82rem;">No pending confessions.</div>';
        return;
      }
      container.innerHTML = items.map(function(item) {
        return '<div class="conf-admin-card" id="conf-admin-'+item.id+'">'
          + catBadge(item.category)
          + '<div class="conf-admin-body">'+escH(item.body)+'</div>'
          + '<div class="conf-admin-actions">'
          + '<button class="conf-approve-btn" data-conf-approve="'+item.id+'">Approve</button>'
          + '<button class="conf-reject-btn" data-conf-reject="'+item.id+'">Reject</button>'
          + '</div></div>';
      }).join('');
    } catch(e) {
      container.innerHTML = '<div style="padding:1rem;color:#cc4444;font-size:0.82rem;">Error loading.</div>';
    }
  };

  /* Approve / Reject delegation */
  document.addEventListener('click', async function(e) {
    var approveBtn = e.target.closest('[data-conf-approve]');
    var rejectBtn  = e.target.closest('[data-conf-reject]');
    var id = approveBtn ? approveBtn.getAttribute('data-conf-approve')
           : rejectBtn  ? rejectBtn.getAttribute('data-conf-reject') : null;
    var action = approveBtn ? 'approve' : rejectBtn ? 'reject' : null;
    if (!id || !action) return;
    try {
      var r = await fetch('/api/confessions', {
        method: 'POST', credentials: 'include',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action: action, id: parseInt(id) })
      });
      var d = await r.json();
      if (d.ok) {
        var card = document.getElementById('conf-admin-'+id);
        if (card) card.remove();
        if (action === 'approve') loadConfessions();
      }
    } catch(e) {}
  });

  /* ── Load on page-audio activation ── */
  document.querySelectorAll('.nav-item[data-page="audio"]').forEach(function(btn) {
    btn.addEventListener('click', loadConfessions);
  });
  /* Also load if audio page is already active on load */
  document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('page-audio') &&
        document.getElementById('page-audio').classList.contains('active')) {
      loadConfessions();
    }
  });

})();

/* ── BATTLES — Wrestler voting system ── */
(function(){
  'use strict';

  var BATTLE_SVG = '<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 512 512\" width=\"36\" height=\"36\" fill=\"currentColor\" class=\"bat-vs-svg\"><path d=\"M156.29,453.129l-55.063-82.172c2.25-5.984,2.031-12.875-1.234-18.953c-5.984-11.188-19.906-15.375-31.078-9.375c-11.188,5.984-15.375,19.891-9.391,31.078c4.031,7.5,11.641,11.844,19.578,12.078l55.078,82.188c-2.266,5.984-2.031,12.875,1.234,18.953c5.984,11.172,19.906,15.375,31.078,9.375c11.172-5.984,15.375-19.906,9.375-31.078C171.852,457.707,164.243,453.363,156.29,453.129z\"/><path d=\"M6.852,447.066c-7.359,5.281-9.063,15.531-3.781,22.906l21.594,30.141c5.281,7.375,15.531,9.078,22.906,3.797l58.469-38.641l-37.594-57.438L6.852,447.066z\"/><path d=\"M470.336,172.582C529.07,80.957,463.43,5.02,463.43,5.02s-1.703,5.891-6.281,19.047c-40.172,94.484-118.672,178.797-189.078,240.719c20.328,17.328,39.672,32.625,56.828,45.563C384.383,265.27,443.664,214.191,470.336,172.582z\"/><path d=\"M126.774,371.582l35.844,50.328c0,0,33.813-20.875,79.531-52.141c-17.516-12.219-36.188-25.625-55.063-39.734C151.118,356.613,126.774,371.582,126.774,371.582z\"/><path d=\"M432.898,385.785c7.938-0.234,15.547-4.578,19.578-12.078c5.984-11.188,1.781-25.094-9.391-31.078c-11.172-6-25.094-1.813-31.078,9.375c-3.266,6.078-3.484,12.969-1.234,18.953l-55.078,82.172c-7.938,0.234-15.547,4.578-19.578,12.094c-5.984,11.172-1.781,25.094,9.391,31.078c11.172,6,25.094,1.797,31.078-9.375c3.266-6.078,3.484-12.969,1.234-18.953L432.898,385.785z\"/><path d=\"M505.133,447.066l-61.594-39.234l-37.578,57.438l58.469,38.641c7.375,5.281,17.625,3.578,22.906-3.797l21.594-30.141C514.211,462.598,512.508,452.348,505.133,447.066z\"/><path d=\"M349.383,421.91l14.156-19.875C202.165,292.91,128.024,227.738,91.961,184.082c-12.297-14.906-20.156-27.344-25.438-38.125c-7.047-14.375-9.438-25.828-11.75-35.5c-0.719-2.938,1.094-5.906,4.047-6.609c2.938-0.703,5.906,1.109,6.609,4.063c2.375,9.906,4.484,20,10.953,33.219c6.453,13.219,17.359,29.609,37.469,51.25c39.172,42.219,113.234,104.172,256.046,200.719l15.313-21.516c0,0-247.218-152.016-330.359-347.516C50.258,10.91,48.555,5.02,48.555,5.02s-65.625,75.938-6.891,167.563C104.618,270.801,349.383,421.91,349.383,421.910z\"/></svg>';

  /* Detectar tipo de media para soporte video/gif */
  function renderMedia(src, name) {
    var s = (src||'').toLowerCase().split('?')[0];
    if (s.endsWith('.mp4') || s.endsWith('.webm')) {
      return '<video class="bat-fighter-img" src="'+src+'" autoplay loop muted playsinline></video>';
    }
    return '<img class="bat-fighter-img" src="'+src+'" loading="lazy" alt="'+escH(name)+'">';
  }

  /* ── CSS ── */
  var bs = document.createElement('style');
  bs.textContent = [
    '.wrest-tabs{display:flex;border-bottom:1px solid var(--border);flex-shrink:0;}',
    '.wrest-tab{flex:1;padding:0.65rem;background:none;border:none;color:var(--text-dim);font-family:var(--font-d);font-size:0.8rem;letter-spacing:0.1em;cursor:pointer;border-bottom:2px solid transparent;transition:color 0.2s,border-color 0.2s;}',
    '.wrest-tab.active{color:var(--fire-orange);border-bottom-color:var(--fire-orange);}',
    '.bat-loading{padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;}',
    '.bat-empty{padding:3rem 1rem;text-align:center;color:var(--text-dim);font-size:0.85rem;line-height:1.5;}',
    /* Keyframes */
    '@keyframes bat-enter{from{opacity:0;transform:translateY(32px) scale(0.96);}to{opacity:1;transform:none;}}',
    '@keyframes bat-clash{0%,100%{transform:scale(1) rotate(0);}30%{transform:scale(1.28) rotate(-12deg);}60%{transform:scale(1.15) rotate(9deg);}}',
    '@keyframes bat-glow{0%,100%{filter:drop-shadow(0 0 5px #FF4500) drop-shadow(0 0 14px #ff450055);}50%{filter:drop-shadow(0 0 14px #FF4500) drop-shadow(0 0 36px #ff4500cc) drop-shadow(0 0 4px #FFB800);}}',
    '@keyframes bat-flash{0%{box-shadow:0 0 0 0 rgba(255,69,0,0.9);}60%{box-shadow:0 0 0 18px rgba(255,69,0,0);}100%{box-shadow:0 0 0 0 rgba(255,69,0,0);}}',
    '@keyframes bat-spark{0%{transform:translate(-50%,-50%) scale(1);opacity:1;}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(0);opacity:0;}}',
    '@keyframes bat-winner-pulse{0%,100%{border-color:var(--fire-orange);}50%{border-color:var(--fire-yellow);box-shadow:0 0 16px #FF450055;}}',
    /* Card */
    '.bat-card{background:var(--surface-2);border:1px solid var(--border);border-radius:22px;overflow:hidden;margin-bottom:1.5rem;opacity:0;animation:bat-enter 0.55s cubic-bezier(0.16,1,0.3,1) forwards;}',
    '.bat-title{font-family:var(--font-d);font-size:0.7rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--text-muted);padding:1rem 1rem 0;text-align:center;}',
    /* Arena — fotos lado a lado con VS encima */
    '.bat-arena{position:relative;display:grid;grid-template-columns:1fr 1fr;height:240px;margin:0.75rem 0.75rem 0;}',
    '.bat-fighter{position:relative;overflow:hidden;cursor:pointer;}',
    '.bat-fighter:first-child{border-radius:14px 0 0 14px;}',
    '.bat-fighter:last-child{border-radius:0 14px 14px 0;}',
    '.bat-fighter-img,.bat-fighter video{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.3s cubic-bezier(0.16,1,0.3,1);}',
    '.bat-fighter video{object-fit:cover;}',
    '.bat-fighter:active .bat-fighter-img,.bat-fighter:active video{transform:scale(1.04);}',
    '.bat-fighter-shade{position:absolute;inset:0;pointer-events:none;}',
    /* shade gauche — dégradé vers la droite */
    '.bat-fighter:first-child .bat-fighter-shade{background:linear-gradient(to right,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.55) 100%);}',
    '.bat-fighter:last-child .bat-fighter-shade{background:linear-gradient(to left,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.55) 100%);}',
    /* Degradé inferior nombre */
    '.bat-fighter-namegrad{position:absolute;bottom:0;left:0;right:0;padding:0.85rem 0.5rem 0.5rem;background:linear-gradient(to top,rgba(0,0,0,0.82),transparent);}',
    '.bat-fighter-name{font-family:var(--font-d);font-size:0.78rem;letter-spacing:0.07em;color:#fff;text-align:center;display:block;text-shadow:0 1px 4px rgba(0,0,0,0.9);}',
    /* Winner/loser overlays */
    '.bat-fighter.winner{animation:bat-winner-pulse 1.8s ease-in-out infinite;}',
    '.bat-fighter.winner::after{content:\"WIN\";position:absolute;top:0.5rem;left:50%;transform:translateX(-50%);font-family:var(--font-d);font-size:0.62rem;letter-spacing:0.15em;color:#fff;background:linear-gradient(90deg,var(--fire-deep),var(--fire-orange));padding:0.15rem 0.5rem;border-radius:20px;box-shadow:0 0 10px #FF450088;}',
    '.bat-fighter.loser .bat-fighter-img,.bat-fighter.loser video{filter:grayscale(0.75) brightness(0.6);}',
    '.bat-fighter.winner-1{border:2px solid var(--fire-orange);}',
    '.bat-fighter.winner-2{border:2px solid #6c8fff;}',
    /* VS center badge */
    '.bat-vs-badge{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;display:flex;flex-direction:column;align-items:center;gap:0.1rem;pointer-events:none;}',
    '.bat-vs-svg{color:var(--fire-orange);animation:bat-glow 2.2s ease-in-out infinite,bat-clash 3.8s ease-in-out infinite;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8));}',
    '.bat-vs-label{font-family:var(--font-d);font-size:0.55rem;letter-spacing:0.2em;color:var(--fire-orange);background:rgba(0,0,0,0.65);padding:0.1rem 0.4rem;border-radius:4px;}',
    /* Bars */
    '.bat-bars{padding:0.6rem 0.85rem 0.25rem;}',
    '.bat-bar-row{display:grid;grid-template-columns:1fr 3.5rem 1fr;align-items:center;gap:0.4rem;margin-bottom:0.35rem;}',
    '.bat-bar-wrap{height:12px;border-radius:6px;background:var(--surface-3);overflow:hidden;position:relative;}',
    '.bat-bar-fill{height:100%;border-radius:6px;width:0%;transition:width 1.1s cubic-bezier(0.16,1,0.3,1);}',
    /* Ganador: fuego; perdedor: gris apagado */
    '.bat-bar-fill-win{background:linear-gradient(90deg,#8B1A00,#FF4500,#FFB800);box-shadow:0 0 8px #FF450088;}',
    '.bat-bar-fill-lose{background:var(--surface-3);}',
    '.bat-bar-fill-neu-1{background:linear-gradient(90deg,#8B1A00,#FF4500,#FFB800);}',
    '.bat-bar-fill-neu-2{background:linear-gradient(90deg,#4a3a8a,#6c8fff);}',
    '.bat-bar-pct{font-family:var(--font-d);font-size:0.72rem;text-align:center;}',
    '.bat-bar-pct-win{color:var(--fire-orange);}',
    '.bat-bar-pct-lose{color:var(--text-muted);}',
    '.bat-bar-pct-neu{color:var(--text-dim);}',
    '.bat-total{text-align:center;font-size:0.63rem;color:var(--text-muted);padding-bottom:0.3rem;letter-spacing:0.08em;}',
    /* Vote buttons */
    '.bat-btns{display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;padding:0.5rem 0.85rem 1.1rem;}',
    '.bat-vote-btn{position:relative;overflow:hidden;background:none;border:1px solid var(--border);color:var(--text-dim);border-radius:12px;padding:0.65rem 0.25rem;font-family:var(--font-d);font-size:0.72rem;letter-spacing:0.07em;cursor:pointer;transition:all 0.25s cubic-bezier(0.16,1,0.3,1);white-space:nowrap;text-overflow:ellipsis;}',
    '.bat-vote-btn-1:not([disabled]):active{background:rgba(255,69,0,0.15);border-color:var(--fire-orange);color:var(--fire-orange);}',
    '.bat-vote-btn-2:not([disabled]):active{background:rgba(108,143,255,0.15);border-color:#6c8fff;color:#6c8fff;}',
    '.bat-vote-btn.voted-1{border-color:var(--fire-orange);color:var(--fire-orange);background:rgba(255,69,0,0.12);animation:bat-flash 0.6s ease;}',
    '.bat-vote-btn.voted-2{border-color:#6c8fff;color:#6c8fff;background:rgba(108,143,255,0.12);}',
    '.bat-vote-btn[disabled]:not(.voted-1):not(.voted-2){opacity:0.3;}',
    '.bat-signin{text-align:center;font-size:0.75rem;color:var(--text-dim);padding:0.5rem 0.85rem 1rem;}',
    /* Sparks */
    '.bat-spark{position:fixed;width:7px;height:7px;border-radius:50%;pointer-events:none;z-index:9999;animation:bat-spark 0.65s ease-out forwards;}',
    /* Image viewer */
    '.bat-img-viewer{position:fixed;inset:0;background:rgba(0,0,0,0.93);z-index:500;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity 0.22s;}',
    '.bat-img-viewer.open{opacity:1;pointer-events:all;}',
    '.bat-img-viewer img,.bat-img-viewer video{max-width:92vw;max-height:85vh;object-fit:contain;border-radius:10px;}',
    '.bat-img-viewer-close{position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,0.1);border:none;color:#fff;width:38px;height:38px;border-radius:50%;font-size:1.1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
    /* Admin form */
    '.bat-admin-form{background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:1rem;margin-bottom:1rem;}',
    '.bat-admin-form input{width:100%;background:var(--surface-3);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:0.55rem 0.75rem;font-size:0.82rem;font-family:var(--font-b);margin-bottom:0.5rem;box-sizing:border-box;}',
    '.bat-admin-form input:focus{outline:none;border-color:var(--fire-orange);}',
    '.bat-create-btn{width:100%;background:var(--fire-orange);color:#fff;border:none;border-radius:10px;padding:0.65rem;font-family:var(--font-d);font-size:0.85rem;letter-spacing:0.06em;cursor:pointer;margin-top:0.25rem;}'
  ].join('');
  document.head.appendChild(bs);

  /* ── Tab switching ── */
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.wrest-tab[data-wtab]').forEach(function(tab) {
      tab.addEventListener('click', function() {
        var wtab = tab.getAttribute('data-wtab');
        document.querySelectorAll('.wrest-tab').forEach(function(t){ t.classList.remove('active'); });
        tab.classList.add('active');
        var gridWrap    = document.getElementById('wrestlers-grid-wrap');
        var battlesWrap = document.getElementById('battles-wrap');
        var newBtn      = document.getElementById('wrestlers-new-btn');
        if (wtab === 'profiles') {
          if (gridWrap)    gridWrap.style.display = '';
          if (battlesWrap) battlesWrap.style.display = 'none';
          if (newBtn)      newBtn.style.display = '';
        } else {
          if (gridWrap)    gridWrap.style.display = 'none';
          if (battlesWrap) battlesWrap.style.display = '';
          if (newBtn)      newBtn.style.display = 'none';
          loadBattles();
        }
      });
    });
  });

  /* ── Helpers ── */
  function pct(v, total) { return total ? Math.round(v/total*100) : 0; }
  function fmt(n) { return n>=1000?(n/1000).toFixed(1)+'k':String(n); }
  function escH(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ── Sparks al votar ── */
  function spawnSparks(btn) {
    var rect = btn.getBoundingClientRect();
    var cx = rect.left + rect.width/2;
    var cy = rect.top  + rect.height/2;
    var colors = ['#FF4500','#FFB800','#FF6B00','#FFD700','#FF2200'];
    for (var k=0; k<12; k++) {
      var spark = document.createElement('div');
      spark.className = 'bat-spark';
      var angle = (Math.PI*2/12)*k + Math.random()*0.5;
      var dist  = 40 + Math.random()*40;
      spark.style.cssText = [
        'left:'+(cx-3.5)+'px',
        'top:'+(cy-3.5)+'px',
        'background:'+colors[k%colors.length],
        '--dx:'+(Math.cos(angle)*dist)+'px',
        '--dy:'+(Math.sin(angle)*dist)+'px',
        'animation-delay:'+(Math.random()*0.08)+'s'
      ].join(';');
      document.body.appendChild(spark);
      setTimeout(function(sp){ sp.remove(); }, 800, spark);
    }
  }

  /* ── Render card ── */
  function renderBattleCard(b, idx) {
    var voted   = b.userVote !== null && b.userVote !== undefined;
    var p1      = pct(b.v1, b.total);
    var p2      = pct(b.v2, b.total);
    var isUser1 = b.userVote === 0;
    var isUser2 = b.userVote === 1;
    var win1    = voted && p1 > p2;
    var win2    = voted && p2 > p1;
    var totalStr = b.total ? fmt(b.total)+' vote'+(b.total!==1?'s':'') : 'No votes yet';
    var delay   = (idx||0)*140;

    /* Clases ganador/perdedor */
    var cls1 = win1 ? 'winner winner-1' : (win2 ? 'loser' : '');
    var cls2 = win2 ? 'winner winner-2' : (win1 ? 'loser' : '');

    /* Clases de barra */
    var bCls1 = voted ? (win1 ? 'bat-bar-fill-win' : (win2 ? 'bat-bar-fill-lose' : 'bat-bar-fill-neu-1')) : 'bat-bar-fill-neu-1';
    var bCls2 = voted ? (win2 ? 'bat-bar-fill-win' : (win1 ? 'bat-bar-fill-lose' : 'bat-bar-fill-neu-2')) : 'bat-bar-fill-neu-2';
    var pCls1 = voted ? (win1 ? 'bat-bar-pct-win' : 'bat-bar-pct-lose') : 'bat-bar-pct-neu';
    var pCls2 = voted ? (win2 ? 'bat-bar-pct-win' : 'bat-bar-pct-lose') : 'bat-bar-pct-neu';

    var html = '<div class="bat-card" data-bat-id="'+b.id+'" style="animation-delay:'+delay+'ms">'
      + '<div class="bat-title">'+escH(b.title)+'</div>'
      + '<div class="bat-arena">'
        /* Fighter 1 */
        + '<div class="bat-fighter '+cls1+'" data-bat-img="'+b.wrestler1_image+'" data-bat-vid="'+(b.wrestler1_image.toLowerCase().endsWith('.mp4')||b.wrestler1_image.toLowerCase().endsWith('.webm')?'1':'0')+'">'
          + renderMedia(b.wrestler1_image, b.wrestler1_name)
          + '<div class="bat-fighter-shade"></div>'
          + '<div class="bat-fighter-namegrad"><span class="bat-fighter-name">'+escH(b.wrestler1_name)+'</span></div>'
        + '</div>'
        /* VS badge centrado absolutamente */
        + '<div class="bat-vs-badge">'+BATTLE_SVG+'<span class="bat-vs-label">VS</span></div>'
        /* Fighter 2 */
        + '<div class="bat-fighter '+cls2+'" data-bat-img="'+b.wrestler2_image+'" data-bat-vid="'+(b.wrestler2_image.toLowerCase().endsWith('.mp4')||b.wrestler2_image.toLowerCase().endsWith('.webm')?'1':'0')+'">'
          + renderMedia(b.wrestler2_image, b.wrestler2_name)
          + '<div class="bat-fighter-shade"></div>'
          + '<div class="bat-fighter-namegrad"><span class="bat-fighter-name">'+escH(b.wrestler2_name)+'</span></div>'
        + '</div>'
      + '</div>';

    /* Barras de votos */
    if (voted || b.total > 0) {
      html += '<div class="bat-bars">'
        + '<div class="bat-bar-row">'
          + '<div class="bat-bar-wrap" style="direction:rtl"><div class="bat-bar-fill '+bCls1+'" data-target="'+p1+'%"></div></div>'
          + '<div class="bat-bar-pct '+pCls1+'">'+p1+'%</div>'
          + '<div class="bat-bar-wrap"><div class="bat-bar-fill '+bCls2+'" data-target="'+p2+'%"></div></div>'
        + '</div>'
        + '<div class="bat-total">'+totalStr+'</div>'
      + '</div>';
    }

    /* Botones */
    if (!voted) {
      if (window.currentUser) {
        html += '<div class="bat-btns">'
          + '<button class="bat-vote-btn bat-vote-btn-1" data-bat-id="'+b.id+'" data-wrestler="1">Vote '+escH(b.wrestler1_name)+'</button>'
          + '<button class="bat-vote-btn bat-vote-btn-2" data-bat-id="'+b.id+'" data-wrestler="2">Vote '+escH(b.wrestler2_name)+'</button>'
        + '</div>';
      } else {
        html += '<div class="bat-signin">Sign in to vote</div>';
      }
    } else {
      html += '<div class="bat-btns">'
        + '<button class="bat-vote-btn'+(isUser1?' voted-1':'')+'" disabled>'+escH(b.wrestler1_name)+(isUser1?' &#10003;':'')+'</button>'
        + '<button class="bat-vote-btn'+(isUser2?' voted-2':'')+'" disabled>'+escH(b.wrestler2_name)+(isUser2?' &#10003;':'')+'</button>'
      + '</div>';
    }

    html += '</div>';
    return html;
  }

  function animateBars(container) {
    container.querySelectorAll('.bat-bar-fill[data-target]').forEach(function(bar) {
      var t = bar.getAttribute('data-target');
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ bar.style.width = t; }); });
    });
  }

  /* ── Image viewer ── */
  var imgViewer = document.createElement('div');
  imgViewer.className = 'bat-img-viewer';
  imgViewer.innerHTML = '<div id="bat-viewer-inner"></div><button class="bat-img-viewer-close" id="bat-viewer-close">&#10005;</button>';
  document.body.appendChild(imgViewer);

  function closeViewer() { imgViewer.classList.remove('open'); document.body.style.overflow=''; }
  document.getElementById('bat-viewer-close').addEventListener('click', closeViewer);
  imgViewer.addEventListener('click', function(e){ if(e.target===imgViewer) closeViewer(); });

  document.addEventListener('click', function(e) {
    if (e.target.closest('.bat-vote-btn')) return;
    var fighter = e.target.closest('.bat-fighter[data-bat-img]');
    if (!fighter) return;
    var src = fighter.getAttribute('data-bat-img');
    if (!src) return;
    var inner = document.getElementById('bat-viewer-inner');
    if (!inner) return;
    var s = src.toLowerCase().split('?')[0];
    if (s.endsWith('.mp4') || s.endsWith('.webm')) {
      inner.innerHTML = '<video src="'+src+'" autoplay loop muted playsinline controls></video>';
    } else {
      inner.innerHTML = '<img src="'+src+'" alt="">';
    }
    imgViewer.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  /* ── Load battles ── */
  window.loadBattles = async function() {
    var feed = document.getElementById('battles-feed');
    if (!feed) return;
    feed.innerHTML = '<div class="bat-loading">Loading battles...</div>';
    try {
      var r = await fetch('/api/battles', {credentials:'include'});
      var d = await r.json();
      var battles = d.battles || [];

      var adminForm = '';
      if (document.body.classList.contains('is-admin')) {
        adminForm = '<div class="bat-admin-form">'
          + '<div style="font-family:var(--font-d);font-size:0.72rem;letter-spacing:0.18em;color:var(--text-dim);margin-bottom:0.6rem;">NEW BATTLE</div>'
          + '<input id="bat-f-title"  placeholder="Battle title">'
          + '<input id="bat-f-w1name" placeholder="Wrestler 1 name">'
          + '<input id="bat-f-w1img"  placeholder="Wrestler 1 — image / GIF / video URL">'
          + '<input id="bat-f-w2name" placeholder="Wrestler 2 name">'
          + '<input id="bat-f-w2img"  placeholder="Wrestler 2 — image / GIF / video URL">'
          + '<button class="bat-create-btn" id="bat-create-btn">Create Battle</button>'
          + '</div>';
      }

      if (!battles.length) {
        feed.innerHTML = adminForm + '<div class="bat-empty">No battles yet.<br>Check back soon!</div>';
      } else {
        feed.innerHTML = adminForm + battles.map(function(b,i){ return renderBattleCard(b,i); }).join('');
        animateBars(feed);
      }

      var createBtn = document.getElementById('bat-create-btn');
      if (createBtn) {
        createBtn.addEventListener('click', async function() {
          var title  = (document.getElementById('bat-f-title') ||{}).value||'';
          var w1name = (document.getElementById('bat-f-w1name')||{}).value||'';
          var w1img  = (document.getElementById('bat-f-w1img') ||{}).value||'';
          var w2name = (document.getElementById('bat-f-w2name')||{}).value||'';
          var w2img  = (document.getElementById('bat-f-w2img') ||{}).value||'';
          if (!title||!w1name||!w1img||!w2name||!w2img) return;
          createBtn.disabled = true;
          try {
            var r2 = await fetch('/api/battles',{
              method:'POST',credentials:'include',
              headers:{'Content-Type':'application/json'},
              body:JSON.stringify({action:'create',title,wrestler1_name:w1name,wrestler1_image:w1img,wrestler2_name:w2name,wrestler2_image:w2img})
            });
            var d2 = await r2.json();
            if (d2.ok) window.loadBattles();
          } catch(e){}
          createBtn.disabled = false;
        });
      }
    } catch(e) {
      if (feed) feed.innerHTML = '<div class="bat-empty">Could not load battles.</div>';
    }
  };

  /* ── Vote delegation ── */
  document.addEventListener('click', async function(e) {
    var btn = e.target.closest('.bat-vote-btn[data-bat-id][data-wrestler]');
    if (!btn || btn.disabled) return;
    if (!window.currentUser) { if(typeof openAuthModal==='function') openAuthModal(); return; }
    btn.disabled = true;
    spawnSparks(btn);
    var batId    = btn.getAttribute('data-bat-id');
    var wrestler = btn.getAttribute('data-wrestler');
    try {
      var r = await fetch('/api/battles',{
        method:'POST',credentials:'include',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'vote',id:parseInt(batId),wrestler:parseInt(wrestler)})
      });
      var d = await r.json();
      if (d.ok) {
        var card = document.querySelector('.bat-card[data-bat-id="'+batId+'"]');
        if (card) {
          var imgs  = card.querySelectorAll('.bat-fighter-img, .bat-fighter video');
          var names = card.querySelectorAll('.bat-fighter-name');
          var fighters = card.querySelectorAll('.bat-fighter[data-bat-img]');
          var fakeB = {
            id: batId,
            title: card.querySelector('.bat-title')?card.querySelector('.bat-title').textContent:'',
            wrestler1_name:  names[0]?names[0].textContent:'',
            wrestler1_image: fighters[0]?fighters[0].getAttribute('data-bat-img'):'',
            wrestler2_name:  names[1]?names[1].textContent:'',
            wrestler2_image: fighters[1]?fighters[1].getAttribute('data-bat-img'):'',
            v1:d.v1, v2:d.v2, total:d.total, userVote:d.userVote
          };
          var tmp = document.createElement('div');
          tmp.innerHTML = renderBattleCard(fakeB, 0);
          var newCard = tmp.firstChild;
          newCard.style.animation = 'none';
          newCard.style.opacity   = '1';
          card.parentNode.replaceChild(newCard, card);
          animateBars(newCard);
        }
      }
    } catch(e){ btn.disabled = false; }
  });

})();

/* ── COMMUNITY — Comments everywhere + User Posts feed ── */
(function(){
  'use strict';

  /* ─── CSS ─── */
  var cs = document.createElement('style');
  cs.textContent = [
    /* Comment button reutilizable */
    '.sec-comment-btn{display:inline-flex;align-items:center;gap:0.4rem;background:none;border:1px solid var(--border);color:var(--text-dim);border-radius:20px;padding:0.35rem 0.85rem;font-size:0.75rem;font-family:var(--font-b);cursor:pointer;transition:all 0.2s;}',
    '.sec-comment-btn:active{background:var(--surface-2);color:var(--text);}',
    '.sec-comment-btn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    /* Posts feed */
    '.posts-wrap{padding:0.75rem;}',
    /* Post compose sheet */
    '.posts-new-btn{display:flex;align-items:center;gap:0.5rem;background:none;border:1px solid var(--border);color:var(--text-dim);border-radius:20px;padding:0.4rem 0.9rem 0.4rem 0.7rem;font-size:0.78rem;font-family:var(--font-b);cursor:pointer;margin:0 0 0.85rem;transition:border-color 0.2s,color 0.2s;}',
    '.posts-new-btn:active{border-color:var(--fire-orange);color:var(--fire-orange);}',
    '.posts-new-btn svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '.posts-sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:300;opacity:0;pointer-events:none;transition:opacity 0.25s;}',
    '.posts-sheet-overlay.open{opacity:1;pointer-events:all;}',
    '.posts-sheet{position:fixed;left:0;right:0;bottom:0;background:var(--surface);border-radius:20px 20px 0 0;border-top:1px solid var(--border);z-index:301;padding:0.5rem 1.1rem calc(1.5rem + env(safe-area-inset-bottom,0px));transform:translateY(100%);transition:transform 0.32s cubic-bezier(0.16,1,0.3,1);}',
    '.posts-sheet.open{transform:translateY(0);}',
    '.posts-sheet-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 0.85rem;}',
    '.posts-sheet-title{font-family:var(--font-d);font-size:0.9rem;letter-spacing:0.08em;margin-bottom:0.75rem;}',
    '.posts-sheet-ta{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:12px;padding:0.75rem;font-size:0.87rem;font-family:var(--font-b);resize:none;height:100px;outline:none;line-height:1.5;box-sizing:border-box;margin-bottom:0.5rem;}',
    '.posts-sheet-ta:focus{border-color:var(--fire-orange);}',
    '.posts-sheet-footer{display:flex;align-items:center;justify-content:space-between;}',
    '.posts-sheet-rules{font-size:0.6rem;color:var(--text-muted);flex:1;padding-right:0.75rem;line-height:1.35;}',
    '.posts-sheet-send{background:var(--fire-orange);color:#fff;border:none;border-radius:20px;padding:0.5rem 1.25rem;font-family:var(--font-d);font-size:0.8rem;letter-spacing:0.06em;cursor:pointer;}',
    '.posts-sheet-send:disabled{opacity:0.5;}',
    '.posts-signin-note{text-align:center;padding:1rem;color:var(--text-dim);font-size:0.82rem;}',
    /* Post card */
    '.post-card{background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:0.85rem;margin-bottom:0.75rem;}',
    '.post-card-header{display:flex;align-items:center;gap:0.6rem;margin-bottom:0.6rem;}',
    '.post-card-avatar{width:34px;height:34px;border-radius:50%;object-fit:cover;background:var(--surface-3);flex-shrink:0;overflow:hidden;}',
    '.post-card-avatar img{width:100%;height:100%;object-fit:cover;}',
    '.post-card-meta{flex:1;min-width:0;}',
    '.post-card-name{font-family:var(--font-d);font-size:0.8rem;letter-spacing:0.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.post-card-badge{font-size:0.6rem;color:var(--text-dim);}',
    '.post-card-date{font-size:0.65rem;color:var(--text-muted);}',
    '.post-card-body{font-size:0.87rem;line-height:1.55;color:var(--text);white-space:pre-wrap;word-break:break-word;margin-bottom:0.65rem;}',
    '.post-card-actions{display:flex;gap:0.5rem;align-items:center;}',
    '.post-report-btn{background:none;border:none;color:var(--text-muted);font-size:0.68rem;cursor:pointer;padding:0.2rem 0.5rem;border-radius:8px;font-family:var(--font-b);transition:color 0.2s;}',
    '.post-report-btn:active{color:#cc4444;}',
    '.post-report-btn.reported{color:#cc4444;pointer-events:none;}',
    '.post-comment-btn{display:inline-flex;align-items:center;gap:0.3rem;background:none;border:none;color:var(--text-dim);font-size:0.72rem;cursor:pointer;padding:0.2rem 0.5rem;border-radius:8px;font-family:var(--font-b);}',
    '.post-comment-btn svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '.post-comment-btn:active{color:var(--text);}',
    '.post-like-btn{display:inline-flex;align-items:center;gap:0.3rem;background:none;border:none;color:var(--text-dim);font-size:0.72rem;cursor:pointer;padding:0.2rem 0.5rem;border-radius:8px;font-family:var(--font-b);transition:color 0.2s;}',
    '.post-like-btn svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:fill 0.15s,stroke 0.15s;}',
    '.post-like-btn.liked{color:#ff3b5c;}',
    '.post-like-btn.liked svg{fill:#ff3b5c;stroke:#ff3b5c;}',
    /* Admin post actions */
    '.post-admin-actions{display:flex;gap:0.4rem;margin-top:0.5rem;}',
    '.post-admin-btn{font-size:0.68rem;border:none;border-radius:8px;padding:0.25rem 0.6rem;cursor:pointer;font-family:var(--font-b);}',
    '.post-hide-btn{background:#3a1a1a;color:#cc4444;}',
    '.post-ban-btn{background:#2a0a0a;color:#ff4444;}',
    '.posts-empty{padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;}'
  ].join('');
  document.head.appendChild(cs);

  /* ─── Helpers ─── */
  function timeAgo(d) {
    var s = (Date.now() - new Date(d).getTime()) / 1000;
    if (s < 60)    return 'just now';
    if (s < 3600)  return Math.floor(s/60)+'m ago';
    if (s < 86400) return Math.floor(s/3600)+'h ago';
    return Math.floor(s/86400)+'d ago';
  }
  function escH(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ─── Comment button helper — llama el panel existente ─── */
  function makeCommentBtn(postId, label) {
    var btn = document.createElement('button');
    btn.className = 'sec-comment-btn';
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>'
      + (label || 'Comment');
    btn.addEventListener('click', function() {
      if (typeof window.openCommentsPanel === 'function') window.openCommentsPanel(postId);
    });
    return btn;
  }

  /* ─── Inyectar comment buttons en battles ─── */
  document.addEventListener('click', function(e) {
    /* Battle comment */
    var batCard = e.target.closest('.bat-card[data-bat-id]');
    if (batCard && !e.target.closest('.bat-vote-btn') && !e.target.closest('.bat-fighter') && !e.target.closest('.bat-comment-btn')) {
      /* Ya tiene botón? */
    }
  });

  /* Hook: después de renderizar battles, agregar comment buttons */
  var _origLoadBattles = window.loadBattles;
  window.loadBattles = async function() {
    await _origLoadBattles.apply(this, arguments);
    setTimeout(function() {
      document.querySelectorAll('.bat-card[data-bat-id]').forEach(function(card) {
        if (card.querySelector('.bat-comment-btn')) return;
        var id = 'battle_' + card.getAttribute('data-bat-id');
        var btn = makeCommentBtn(id, 'Comment');
        btn.classList.add('bat-comment-btn');
        btn.style.cssText = 'margin:0 0.85rem 0.85rem;font-size:0.7rem;';
        card.appendChild(btn);
      });
    }, 200);
  };

  /* Hook: después de renderizar confesiones */
  var _origLoadConf = window.loadPendingConfessions;
  /* Para el feed público de confesiones inyectar comment btn */
  document.addEventListener('click', function(e) {
    var confCard = e.target.closest('.conf-card[data-conf-id]');
    if (!confCard || e.target.closest('.conf-like-btn') || e.target.closest('.conf-comment-btn')) return;
    /* Agregar btn si no existe */
    if (!confCard.querySelector('.conf-comment-btn')) {
      var id = 'confession_' + confCard.getAttribute('data-conf-id');
      var btn = makeCommentBtn(id, 'Comment');
      btn.classList.add('conf-comment-btn');
      btn.style.cssText = 'margin:0 0 0.75rem 0;font-size:0.7rem;';
      var actions = confCard.querySelector('.conf-actions');
      if (actions) confCard.insertBefore(btn, actions);
    }
  });

  /* ─── POSTS FEED ─── */
  var REPORTED_POSTS = new Set();
  try { REPORTED_POSTS = new Set(JSON.parse(localStorage.getItem('hw_reported_posts')||'[]')); } catch(e){}

  function saveReported() {
    try { localStorage.setItem('hw_reported_posts', JSON.stringify([...REPORTED_POSTS])); } catch(e){}
  }

  var LIKED_POSTS = new Set();
  try { LIKED_POSTS = new Set(JSON.parse(localStorage.getItem('hw_post_likes')||'[]')); } catch(e){}
  function saveLikedPosts() {
    try { localStorage.setItem('hw_post_likes', JSON.stringify([...LIKED_POSTS])); } catch(e){}
  }

  function renderPost(p) {
    var isAdmin = document.body.classList.contains('is-admin');
    var isOwn   = window.currentUser && window.currentUser.id === p.user_id;
    var reported = REPORTED_POSTS.has(String(p.id));
    var avatar   = p.user_avatar
      ? '<img src="'+p.user_avatar+'" loading="lazy" alt="">'
      : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--text-dim)" stroke-width="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>';

    var html = '<div class="post-card" data-post-id="'+p.id+'">'
      + '<div class="post-card-header">'
        + '<div class="post-card-avatar">'+avatar+'</div>'
        + '<div class="post-card-meta">'
          + '<div class="post-card-name">'+escH(p.user_name)+'</div>'
          + '<div class="post-card-date">'+timeAgo(p.created_at)+'</div>'
        + '</div>'
      + '</div>'
      + '<div class="post-card-body">'+escH(p.body)+'</div>'
      + '<div class="post-card-actions">'
        + '<button class="post-like-btn'+(LIKED_POSTS.has(String(p.id))?' liked':'')+'" data-post-id="'+p.id+'">'
          + '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'+(p.like_count||'')+'</button>'
      + '<button class="post-comment-btn" data-post-id="'+p.id+'">'
          + '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> Comment'
        + '</button>';

    if (!isOwn) {
      html += '<button class="post-report-btn'+(reported?' reported':'')+'" data-post-id="'+p.id+'">'
        + (reported ? 'Reported' : 'Report')
      + '</button>';
    }

    html += '</div>';

    if (isAdmin) {
      html += '<div class="post-admin-actions">'
        + '<button class="post-admin-btn post-hide-btn" data-post-id="'+p.id+'">Hide</button>'
        + '<button class="post-admin-btn post-ban-btn" data-post-id="'+p.id+'" data-user-id="'+p.user_id+'">Ban User</button>'
      + '</div>';
    }

    html += '</div>';
    return html;
  }

  window.loadPostsFeed = async function(container) {
    if (!container) return;
    container.innerHTML = '<div class="posts-empty">Loading...</div>';
    try {
      var r = await fetch('/api/posts');
      var d = await r.json();
      var posts = d.posts || [];
      var user  = window.currentUser;

      /* Compose box */
      /* Botón de nuevo post + sheet */
      var newBtnHtml = user
        ? '<button class="posts-new-btn" id="posts-new-btn">'
          + '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
          + 'New post</button>'
        : '<div class="posts-signin-note">Sign in to post your thoughts.</div>';

      if (!posts.length) {
        container.innerHTML = newBtnHtml + '<div class="posts-empty">No posts yet. Be the first!</div>';
      } else {
        container.innerHTML = newBtnHtml + posts.map(renderPost).join('');
      }

      /* Sheet de compose — crear una sola vez en body */
      if (!document.getElementById('posts-sheet')) {
        var shOverlay = document.createElement('div');
        shOverlay.className = 'posts-sheet-overlay'; shOverlay.id = 'posts-sheet-overlay';
        var sheet = document.createElement('div');
        sheet.className = 'posts-sheet'; sheet.id = 'posts-sheet';
        sheet.innerHTML = '<div class="posts-sheet-handle"></div>'
          + '<div class="posts-sheet-title">New Post</div>'
          + '<textarea class="posts-sheet-ta" id="posts-sheet-ta" placeholder="What&#39;s on your mind?" maxlength="500"></textarea>'
          + '<div class="posts-sheet-footer">'
            + '<div class="posts-sheet-rules">No links &bull; No religion hate &bull; Keep it real &bull; Violations = ban</div>'
            + '<button class="posts-sheet-send" id="posts-sheet-send">Post</button>'
          + '</div>';
        document.body.appendChild(shOverlay);
        document.body.appendChild(sheet);
        function openPostSheet(){ shOverlay.classList.add('open'); sheet.classList.add('open'); document.body.style.overflow='hidden'; var ta2=document.getElementById('posts-sheet-ta'); if(ta2) ta2.focus(); }
        function closePostSheet(){ shOverlay.classList.remove('open'); sheet.classList.remove('open'); document.body.style.overflow=''; }
        shOverlay.addEventListener('click', closePostSheet);
        /* Swipe down */
        var shY=0;
        sheet.addEventListener('touchstart',function(e){shY=e.touches[0].clientY;},{passive:true});
        sheet.addEventListener('touchend',function(e){if(e.changedTouches[0].clientY-shY>60)closePostSheet();},{passive:true});
        document.getElementById('posts-sheet-send').addEventListener('click', async function(){
          var ta2=document.getElementById('posts-sheet-ta');
          var text=ta2?ta2.value.trim():'';
          if(!text) return;
          var sendBtn2=document.getElementById('posts-sheet-send');
          sendBtn2.disabled=true;
          try{
            var r2=await fetch('/api/posts',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'post',body:text})});
            var d2=await r2.json();
            if(d2.ok){
              if(ta2) ta2.value='';
              closePostSheet();
              window.loadPostsFeed(container);
            } else {
              var toast=document.getElementById('toast');
              if(toast){toast.textContent=d2.error||'Error';toast.classList.add('show');setTimeout(function(){toast.classList.remove('show');},3000);}
            }
          }catch(e){}
          sendBtn2.disabled=false;
        });
        window._openPostSheet = openPostSheet;
      }

      /* Bind new post button */
      var newBtn = document.getElementById('posts-new-btn');
      if(newBtn) newBtn.addEventListener('click', function(){ if(window._openPostSheet) window._openPostSheet(); });

    } catch(e) {
      container.innerHTML = '<div class="posts-empty">Could not load posts.</div>';
    }
  };

  /* Delegation: comment on post, report post, admin actions */
  document.addEventListener('click', async function(e) {
    /* Comment on post */
    var commentBtn = e.target.closest('.post-comment-btn[data-post-id]');
    if (commentBtn) {
      var pid = 'userpost_' + commentBtn.getAttribute('data-post-id');
      if (typeof window.openCommentsPanel === 'function') window.openCommentsPanel(pid);
      return;
    }

    /* Like post */
    var likeBtn = e.target.closest('.post-like-btn[data-post-id]');
    if (likeBtn) {
      var pid = String(likeBtn.getAttribute('data-post-id'));
      var svg = likeBtn.querySelector('svg');
      if (LIKED_POSTS.has(pid)) {
        LIKED_POSTS.delete(pid);
        likeBtn.classList.remove('liked');
      } else {
        LIKED_POSTS.add(pid);
        likeBtn.classList.add('liked');
        /* Mini pop animation */
        likeBtn.style.transform='scale(1.35)'; setTimeout(function(){ likeBtn.style.transform=''; },200);
      }
      saveLikedPosts();
      return;
    }

    /* Report post */
    var reportBtn = e.target.closest('.post-report-btn[data-post-id]');
    if (reportBtn && !reportBtn.classList.contains('reported')) {
      var postId = reportBtn.getAttribute('data-post-id');
      try {
        await fetch('/api/posts', {
          method:'POST', credentials:'include',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({action:'report', post_id: parseInt(postId)})
        });
        reportBtn.textContent = 'Reported';
        reportBtn.classList.add('reported');
        REPORTED_POSTS.add(postId);
        saveReported();
      } catch(e){}
      return;
    }

    /* Admin: hide post */
    var hideBtn = e.target.closest('.post-hide-btn[data-post-id]');
    if (hideBtn) {
      await fetch('/api/posts',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'hide',post_id:parseInt(hideBtn.getAttribute('data-post-id'))})});
      var card = hideBtn.closest('.post-card');
      if (card) card.remove();
      return;
    }

    /* Admin: ban user */
    var banBtn = e.target.closest('.post-ban-btn[data-user-id]');
    if (banBtn) {
      var uid = banBtn.getAttribute('data-user-id');
      var reason = prompt('Ban reason (optional):') || '';
      await fetch('/api/posts',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'ban',user_id:uid,reason})});
      var card2 = banBtn.closest('.post-card');
      if (card2) { card2.style.opacity='0.3'; card2.style.pointerEvents='none'; }
      return;
    }
  });

  /* Exponer loadPostsFeed para que el Profile page lo llame */
  window.loadPostsFeed = window.loadPostsFeed;

})();
})();

























