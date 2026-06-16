
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
    '.cp-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:300;opacity:0;pointer-events:none;transition:opacity 0.25s;}',
    '.cp-overlay.open{opacity:1;pointer-events:all;}',
    '.cp-panel{position:fixed;bottom:0;left:0;right:0;background:var(--surface);border-radius:20px 20px 0 0;z-index:301;max-height:85vh;display:flex;flex-direction:column;transform:translateY(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);}',
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
    '.cp-username{font-family:var(--font-d);font-size:0.75rem;letter-spacing:0.04em;color:var(--text);margin-bottom:0.2rem;cursor:pointer;transition:color 0.15s;}',
    '.cp-username:hover{color:var(--fire-orange);}',
    '.cp-av{cursor:pointer;}',
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
  /* Si el post/comentario es del usuario actual, usar su avatar de D1 (currentUser.picture)
     en lugar del valor guardado en D1 al momento de postear (puede ser Google o vacío) */
  function _resolveAvatar(userId, storedAvatar) {
    if (window.currentUser && window.currentUser.id === userId && window.currentUser.picture) {
      return window.currentUser.picture;
    }
    return storedAvatar || '';
  }
  window._resolveAvatar = _resolveAvatar;

  function renderComment(row, isReply) {
    var item = document.createElement('div');
    item.className = isReply ? 'cp-item cp-reply' : 'cp-item';
    item.setAttribute('data-comment-id', row.id || '');

    var _avUrl = _resolveAvatar(row.user_id, row.user_avatar);
    var avContent = _avUrl
      ? '<img src="' + _avUrl + '" loading="lazy" data-uid="' + escH(row.user_id||'') + '">'
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

    var uid = row.user_id || '';
    item.innerHTML =
      '<div class="cp-av" data-profile-uid="'+uid+'" data-profile-name="'+escH(row.user_name||'')+'">'
        + avContent + '</div>'
      + '<div class="cp-body">'
        + '<div class="cp-username" data-profile-uid="'+uid+'" data-profile-name="'+escH(row.user_name||'')+'">'
          + escH(row.user_name || 'Anonymous') + '</div>'
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
      + (window._adminIsOn && window._adminIsOn()
          ? '<button class="adm-del-btn adm-del-comment" data-uid="'+(row.user_id||'')+'" onclick="window._adminDelComment('+(row.id||0)+',\''+(row.user_id||'')+'\',this)" title="Delete comment">&#128465;</button>'
          : '')
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

  /* ── Delegation: Open user profile from comment ── */
  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-profile-uid]');
    if (!el) return;
    var uid  = el.getAttribute('data-profile-uid');
    var name = el.getAttribute('data-profile-name');
    if (!uid) return;
    /* Si es el propio usuario — abrir su perfil */
    if (window.currentUser && uid === window.currentUser.id) {
      var moreNav = document.querySelector('.nav-item[data-page="more"]');
      if (moreNav) moreNav.click();
      return;
    }
    /* Usuario externo — mostrar mini perfil sheet */
    openMiniProfile(uid, name);
  });

  /* Mini profile sheet */
  function closeMiniProfile() {
    var page = document.getElementById('page-user-profile');
    if (page) {
      page.style.transform = 'translateX(100%)';
      setTimeout(function(){ page.style.display = 'none'; page.style.transform = ''; }, 320);
    }
  }

  /* Aplicar estilo al nombre — función global */
  window.applyNameStyle = function(el, color, font){
    if(!el) return;
    /* Siempre limpiar el gradiente primero */
    el.style.background = '';
    el.style.webkitBackgroundClip = '';
    el.style.webkitTextFillColor = '';
    el.style.backgroundClip = '';
    el.style.color = '';
    /* Fuente */
    if(font && font.trim()){
      var fq = font.indexOf(' ') > -1 ? '"'+font+'"' : font;
      el.style.setProperty('font-family', fq+',cursive,sans-serif', 'important');
    } else {
      el.style.removeProperty('font-family');
    }
    /* Color */
    if(color === 'gradient'){
      el.style.background = 'linear-gradient(135deg,#FF4500,#FFB800)';
      el.style.webkitBackgroundClip = 'text';
      el.style.webkitTextFillColor = 'transparent';
      el.style.backgroundClip = 'text';
    } else if(color && color.trim()){
      el.style.color = color;
    }
  };

  /* Aplicar estilo de nombre del usuario actual si el uid coincide */
  window.applyCurrentUserNameStyle = function(el, uid){
    if(!el||!uid||!window.currentUser) return;
    if(uid !== window.currentUser.id) return;
    var color = window.currentUser.name_color||'';
    var font  = window.currentUser.name_font||'';
    if(!color && !font) return;
    if(window.applyNameStyle) window.applyNameStyle(el, color, font);
  };

  window.openMiniProfile = function openMiniProfile(uid, name) {
    if (window.currentUser && uid === window.currentUser.id) {
      var moreBtn = document.querySelector('.nav-item[data-page="more"]');
      if (moreBtn) moreBtn.click();
      return;
    }
    var page = document.getElementById('page-user-profile');
    if (!page) {
      page = document.createElement('div');
      page.id = 'page-user-profile';
      page.style.cssText = 'position:absolute;inset:0;background:var(--bg);z-index:250;display:none;flex-direction:column;overflow:hidden;transform:translateX(100%);transition:transform 0.32s cubic-bezier(0.16,1,0.3,1);';
      /* Agregar a .pages — hereda position:relative y dimensiones correctas */
      var pagesEl = document.querySelector('.pages') || document.getElementById('app') || document.body;
      pagesEl.appendChild(page);
    }
    page.style.display = 'flex';
    page.innerHTML =
      '<div style="flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;min-height:0;">'        + '<div style="position:relative;flex-shrink:0;">'          + '<div id="uprof-banner" style="width:100%;height:260px;background:linear-gradient(135deg,#1a0505,#2d0a00,#1a0505);position:relative;overflow:hidden;">'            + '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 100%,rgba(255,69,0,0.45) 0%,transparent 70%);pointer-events:none;"></div>'            + '<div style="position:absolute;inset:0;opacity:0.04;background-image:repeating-linear-gradient(45deg,#FF4500 0,#FF4500 1px,transparent 0,transparent 50%);background-size:12px 12px;pointer-events:none;"></div>'          + '</div>'          + '<button id="uprof-back" style="position:absolute;top:0.6rem;left:0.75rem;z-index:20;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:none;color:#fff;cursor:pointer;">'            + '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>'          + '</button>'          + '<div style="position:absolute;bottom:-30px;left:50%;transform:translateX(-50%);z-index:5;">'            + '<div id="uprof-av" style="width:84px;height:84px;border-radius:50%;border:3px solid var(--bg);background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:2rem;overflow:hidden;">'+escH((name||'?').charAt(0).toUpperCase())+'</div>'          + '</div>'        + '</div>'        + '<div style="height:38px;"></div>'        + '<div style="text-align:center;padding:0 1rem 0;">'          + '<div id="uprof-name" style="font-family:var(--font-d);font-size:1.3rem;letter-spacing:0.04em;margin-bottom:0.05rem;">'+escH(name||'User')+'</div>'          + '<div id="uprof-username-display" style="font-size:0.75rem;color:var(--text-dim);margin-bottom:0.05rem;"></div>'          + '<div id="uprof-badge" style="display:inline-flex;align-items:center;gap:0.3rem;font-size:0.6rem;letter-spacing:0.1em;padding:0.18rem 0.6rem;border-radius:20px;background:var(--surface-3);color:var(--text-dim);font-family:var(--font-d);margin-top:0.1rem;"></div>'        + '</div>'        + '<div id="uprof-bio" style="text-align:center;font-size:0.78rem;color:var(--text-dim);line-height:1.5;padding:0.1rem 1.5rem 0;"></div>'        + (window.currentUser && window.currentUser.id !== uid            ? '<div style="padding:0.2rem 1rem 0;"><button id="uprof-fb" style="width:100%;background:var(--fire-orange);color:#fff;border:none;border-radius:25px;padding:0.5rem;font-family:var(--font-d);font-size:0.85rem;letter-spacing:0.06em;cursor:pointer;">Follow</button></div>'            : '')        + '<div style="display:flex;justify-content:center;padding:0.15rem 1rem 0.1rem;">'          + '<div style="flex:1;text-align:center;"><div id="uprof-pc" style="font-family:var(--font-d);font-size:1.05rem;line-height:1;">-</div><div style="font-size:0.62rem;color:var(--text-dim);margin-top:0.15rem;">Posts</div></div>'          + '<div style="flex:1;text-align:center;"><div id="uprof-fr" style="font-family:var(--font-d);font-size:1.05rem;line-height:1;">-</div><div style="font-size:0.62rem;color:var(--text-dim);margin-top:0.15rem;">Followers</div></div>'          + '<div style="flex:1;text-align:center;"><div id="uprof-fg" style="font-family:var(--font-d);font-size:1.05rem;line-height:1;">-</div><div style="font-size:0.62rem;color:var(--text-dim);margin-top:0.15rem;">Following</div></div>'        + '</div>'        + '<div style="display:flex;border-bottom:1px solid var(--border);border-top:1px solid var(--border);position:sticky;top:0;background:var(--bg);z-index:2;">'          + '<button class="uprof-tab active" data-utab="posts" style="flex:1;padding:0.55rem 0;background:none;border:none;border-bottom:2px solid var(--fire-orange);color:var(--fire-orange);font-family:var(--font-b);font-size:0.65rem;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;">Posts</button>'          + '<button class="uprof-tab" data-utab="liked" style="flex:1;padding:0.55rem 0;background:none;border:none;border-bottom:2px solid transparent;color:var(--text-dim);font-family:var(--font-b);font-size:0.65rem;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;">Liked</button>'          + '<button class="uprof-tab" data-utab="activity" style="flex:1;padding:0.55rem 0;background:none;border:none;border-bottom:2px solid transparent;color:var(--text-dim);font-family:var(--font-b);font-size:0.65rem;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;">Activity</button>'        + '</div>'        + '<div id="uprof-posts-panel" style="padding:0.75rem 1rem 3rem;"><div style="color:var(--text-dim);font-size:0.82rem;text-align:center;padding:1.5rem;">Loading...</div></div>'        + '<div id="uprof-liked-panel" style="display:none;padding:0.75rem 1rem 3rem;"></div>'        + '<div id="uprof-activity-panel" style="display:none;padding:0.75rem 1rem 3rem;"></div>'      + '</div>'
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ page.style.transform='translateX(0)'; }); });

    function closeUProf(){ page.style.transform='translateX(100%)'; setTimeout(function(){ page.style.display='none'; },330); }
    document.getElementById('uprof-back').addEventListener('click', closeUProf);
    var _sx=0,_sy=0;
    page.addEventListener('touchstart',function(e){_sx=e.touches[0].clientX;_sy=e.touches[0].clientY;},{passive:true});
    page.addEventListener('touchend',function(e){
      var dx=e.changedTouches[0].clientX-_sx,dy=Math.abs(e.changedTouches[0].clientY-_sy);
      if(_sx<35&&dx>60&&dx>dy*2) closeUProf();
    },{passive:true});

    /* Cargar datos */
    fetch('/api/profile?user_id='+encodeURIComponent(uid),{credentials:'include'})
      .then(function(r){return r.json();}).then(function(d){
        /* Actualizar nombre real desde D1 */
        var realName = d.display_name || name || '';
        if(realName){
          var nameEl=document.getElementById('uprof-name');
          if(nameEl){
            nameEl.textContent=realName;
            nameEl.style.fontSize='2.2rem';
            if(window.applyNameStyle){
              window.applyNameStyle(nameEl, d.name_color||'', d.name_font||'');
              if(d.name_font) setTimeout(function(){ window.applyNameStyle(nameEl, d.name_color||'', d.name_font||''); }, 600);
            }
          }
          var avEl=document.getElementById('uprof-av');
          if(avEl&&!d.avatar_url) avEl.textContent=realName.charAt(0).toUpperCase();
        }
        /* Username @handle */
        var unEl=document.getElementById('uprof-username-display');
        if(unEl&&d.username) unEl.textContent='@'+d.username;
        if(d.banner_url){var bn=document.getElementById('uprof-banner');if(bn){var bi=document.createElement('img');bi.src=d.banner_url;bi.style.cssText='width:100%;height:100%;object-fit:cover;object-position:top;position:absolute;inset:0;z-index:0;';bn.insertBefore(bi,bn.firstChild);}}
        var av=document.getElementById('uprof-av');if(av&&d.avatar_url) av.innerHTML='<img src="'+d.avatar_url+'" style="width:100%;height:100%;object-fit:cover;">';
        var bio=document.getElementById('uprof-bio');if(bio&&d.bio) bio.textContent=d.bio;
        /* Edad pública */
        if(d.age&&d.age_public){
          var ubio=document.getElementById('uprof-bio');
          if(ubio){
            var ageSpan=document.createElement('div');
            ageSpan.style.cssText='font-size:0.68rem;color:var(--text-muted);margin-top:0.2rem;text-align:center;width:100%;';
            ageSpan.textContent=d.age+' years old';
            ubio.parentNode.insertBefore(ageSpan, ubio.nextSibling);
          }
        }
        /* Ubicación */
        var uLocStr=[d.city,d.country].filter(Boolean).join(', ');
        if(uLocStr){
          var ubio2=document.getElementById('uprof-bio');
          if(ubio2){
            var locSpan=document.createElement('div');
            locSpan.style.cssText='font-size:0.68rem;color:var(--text-muted);margin-top:0.15rem;text-align:center;width:100%;';
            locSpan.innerHTML='&#128205; '+uLocStr.replace(/&/g,'&amp;').replace(/</g,'&lt;');
            ubio2.parentNode.insertBefore(locSpan, ubio2.nextSibling);
          }
        }
        /* Admin bar en perfil ajeno */
        if(document.body.classList.contains('is-admin')){
          var adminBar=document.createElement('div');
          adminBar.style.cssText='margin:0.5rem 1rem 0;padding:0.6rem 0.75rem;background:#1a0505;border:1px solid #4a1010;border-radius:10px;display:flex;flex-wrap:wrap;gap:0.4rem;';
          adminBar.innerHTML='<div style="font-size:0.58rem;color:#ff5555;letter-spacing:0.1em;font-family:var(--font-d);width:100%;margin-bottom:0.2rem;">&#9888; ADMIN ACTIONS</div>'
            +'<button onclick="window._adminBanUser(this.dataset.uid,this.dataset.nm)" data-uid="'+uid+'" data-nm="'+escH(d.display_name||'User')+'" style="font-size:0.68rem;background:#3a0a0a;color:#ff5555;border:1px solid #6a1a1a;border-radius:6px;padding:0.25rem 0.6rem;cursor:pointer;font-family:var(--font-b);">&#128683; Ban User</button>'
            +'<button onclick="window._adminClearBanner(this.dataset.uid)" data-uid="'+uid+'" style="font-size:0.68rem;background:#1a1a0a;color:#ffaa00;border:1px solid #4a3a00;border-radius:6px;padding:0.25rem 0.6rem;cursor:pointer;font-family:var(--font-b);">&#128247; Clear Banner</button>'
            +'<button onclick="window._adminClearAvatar(this.dataset.uid)" data-uid="'+uid+'" style="font-size:0.68rem;background:#1a1a0a;color:#ffaa00;border:1px solid #4a3a00;border-radius:6px;padding:0.25rem 0.6rem;cursor:pointer;font-family:var(--font-b);">&#128100; Clear Avatar</button>'
            +'<button onclick="window._adminClearBio(this.dataset.uid)" data-uid="'+uid+'" style="font-size:0.68rem;background:#0a0a1a;color:#aaaaff;border:1px solid #1a1a4a;border-radius:6px;padding:0.25rem 0.6rem;cursor:pointer;font-family:var(--font-b);">&#128221; Clear Bio</button>';
          var profBio=document.getElementById('uprof-bio');
          if(profBio&&profBio.parentNode) profBio.parentNode.insertBefore(adminBar, profBio.nextSibling);
        }
      }).catch(function(){});

    fetch('/api/points?user_id='+encodeURIComponent(uid))
      .then(function(r){return r.json();}).then(function(d){
        var b=document.getElementById('uprof-badge');if(b) b.textContent=(d.badge||'')+' '+(d.level||'Rookie');
      }).catch(function(){});

    fetch('/api/user-follows/stats?user_id='+encodeURIComponent(uid),{credentials:'include'})
      .then(function(r){return r.json();}).then(function(d){
        var fr=document.getElementById('uprof-fr'),fg=document.getElementById('uprof-fg');
        if(fr) fr.textContent=d.followers||0; if(fg) fg.textContent=d.following||0;
        var fb=document.getElementById('uprof-fb');
        if(fb){fb.textContent=d.is_following?'Following':'Follow';fb.style.background=d.is_following?'var(--surface-3)':'var(--fire-orange)';fb.style.color=d.is_following?'var(--text-dim)':'#fff';fb.style.border=d.is_following?'1px solid var(--border)':'none';}
      }).catch(function(){});

    var fb2=document.getElementById('uprof-fb');
    if(fb2) fb2.addEventListener('click',function(){ if(window._toggleFollow) window._toggleFollow(fb2,uid); });

    fetch('/api/posts?user_id='+encodeURIComponent(uid))
      .then(function(r){return r.json();}).then(function(d){
        var posts=d.posts||[];
        var pc=document.getElementById('uprof-pc');if(pc) pc.textContent=posts.length;
        var panel=document.getElementById('uprof-posts-panel');if(!panel) return;
        if(!posts.length){panel.innerHTML='<div style="color:var(--text-muted);text-align:center;padding:2rem 0;font-size:0.8rem;">No posts yet.</div>';return;}
        var _rp = window.renderPost || function(p){return '<div style="padding:0.5rem;color:var(--text-dim);font-size:0.8rem;">'+(p.body||'')+'</div>';};
        panel.innerHTML=posts.map(_rp).join('');
        if(typeof window._activateLazyGifs==='function') window._activateLazyGifs(panel);
        if(typeof window.loadAllLikes==='function') window.loadAllLikes();
        if(typeof window.loadAllCommentCounts==='function') window.loadAllCommentCounts();
      }).catch(function(){});

    page.querySelectorAll('.uprof-tab').forEach(function(btn){
      btn.addEventListener('click',function(){
        page.querySelectorAll('.uprof-tab').forEach(function(b){ b.style.borderBottomColor='transparent'; b.style.color='var(--text-dim)'; });
        btn.style.borderBottomColor='var(--fire-orange)'; btn.style.color='var(--fire-orange)';
        var tab=btn.getAttribute('data-utab');
        document.getElementById('uprof-posts-panel').style.display=tab==='posts'?'':'none';
        document.getElementById('uprof-liked-panel').style.display=tab==='liked'?'':'none';
        document.getElementById('uprof-activity-panel').style.display=tab==='activity'?'':'none';
      });
    });
  };

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
    /* Following filter — load from D1 via separate endpoint */
    if (cat === 'following') {
      var fc = document.getElementById('feed-container');
      var pc = document.getElementById('posts-feed-container');
      if (fc) fc.style.display = 'none';
      if (pc) {
        pc.style.display = 'block';
        pc.innerHTML = '<div class="posts-empty">Loading following feed...</div>';
        fetch('/api/user-follows/feed', { credentials: 'include' })
          .then(function(r) { return r.json(); })
          .then(function(d) {
            var posts = d.posts || [];
            if (!posts.length) {
              pc.innerHTML = '<div class="posts-empty" style="padding:2rem;text-align:center;color:var(--text-dim);">Follow some users to see their posts here.</div>';
              return;
            }
            if (window.loadPostsFeed) window.loadPostsFeed(pc, null, posts);
          })
          .catch(function() { pc.innerHTML = '<div class="posts-empty">Could not load.</div>'; });
      }
      return;
    }
    /* Restore normal feed */
    var fc2 = document.getElementById('feed-container');
    var pc2 = document.getElementById('posts-feed-container');
    if (fc2) fc2.style.display = '';
    if (pc2 && cat === 'all') {
      /* Reload D1 feed normally */
      if (window.currentUser && window.loadPostsFeed) window.loadPostsFeed(pc2, null);
    }
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
      if (currentUser) {
        userName = currentUser.name || currentUser.email.split('@')[0];
        userAvatar = currentUser.picture || null;
      }
      addLRComment(text, true, userName, userAvatar, currentUser ? currentUser.id : null);
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
      /* Step 1: get Google session (cache or fresh) */
      try {
        const raw = sessionStorage.getItem(this._CACHE_KEY);
        if(raw){ const c=JSON.parse(raw); if(Date.now()-c.t<this._TTL){ this._session=c.d; } }
      } catch(e){}
      if (!this._session) {
        try {
          const r = await fetch('/auth/google/session',{credentials:'include'});
          const d = await r.json();
          this._session = d.authenticated ? d.user : null;
        } catch { this._session = null; }
      }
      /* Step 2: ALWAYS fetch D1 to get display_name — overrides Google name every time */
      if (this._session) {
        try {
          const pr = await fetch('/api/profile',{credentials:'include'});
          const pd = await pr.json();
          if (pd.display_name) this._session.display_name = pd.display_name;
          if (pd.avatar_url)   this._session.picture      = pd.avatar_url;
          if (pd.username)     this._session.username     = pd.username;
        } catch(e) {}
        /* Save enriched session — invalidate old cache first */
        try {
          sessionStorage.removeItem(this._CACHE_KEY);
          sessionStorage.setItem(this._CACHE_KEY, JSON.stringify({d:this._session,t:Date.now()}));
        } catch(e){}
      }
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

  async function updateAuthUI(user) {
    const nameEl = document.getElementById('user-display-name');
    const emailEl = document.getElementById('user-display-email');
    const avatarWrap = document.getElementById('user-avatar-wrap');
    const actionBtn = document.getElementById('user-action-btn');

    if (user) {
      const email = user.email || '';
      if (emailEl) emailEl.textContent = email;

      /* Always fetch D1 first — never trust Google name */
      var displayName = user.display_name || user.name || user.email.split('@')[0];
      try {
        var pr = await fetch('/api/profile', {credentials:'include'});
        var pd = await pr.json();
        if (pd.display_name) {
          displayName = pd.display_name;
          if (window.currentUser) window.currentUser.display_name = pd.display_name;
          try {
            var raw = sessionStorage.getItem(HottAuth._CACHE_KEY);
            if (raw) { var sc = JSON.parse(raw); sc.d.display_name = pd.display_name; sessionStorage.setItem(HottAuth._CACHE_KEY, JSON.stringify(sc)); }
          } catch(e) {}
        }
      } catch(e) {}

      if (nameEl) nameEl.textContent = displayName;
      var fpill = document.getElementById('following-pill');
      if (fpill) fpill.style.display = '';
      const avatar = user.picture || '';
      if (avatarWrap) {
        if (avatar) {
          avatarWrap.innerHTML = '<img class="user-avatar" src="' + avatar + '" alt="' + displayName + '">';
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
      var fpill2 = document.getElementById('following-pill');
      if (fpill2) fpill2.style.display = 'none';
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

  /* Cargar avatar/banner de D1 y actualizar currentUser.picture */
  async function fetchUserProfile(userId) {
    if (!userId) return;
    try {
      var r = await fetch('/api/profile', { credentials: 'include' });
      var d = await r.json();
      if (d.avatar_url && window.currentUser) {
        window.currentUser.picture = d.avatar_url;
        /* Actualizar avatar en la UI del header/perfil */
        var aw = document.getElementById('user-avatar-wrap');
        if (aw) {
          aw.innerHTML = '<img src="' + d.avatar_url + '" style="width:100%;height:100%;object-fit:cover;">'
            + '<div class="prof-avatar-cam"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>';
        }
        /* Propagar a TODOS los elementos con data-profile-uid del usuario */
        document.querySelectorAll('[data-profile-uid="' + userId + '"]').forEach(function(el) {
          var img = el.tagName === 'IMG' ? el : el.querySelector('img');
          if (img) { img.src = d.avatar_url; }
        });
        /* Propagar a avatares de posts y comentarios ya renderizados que tengan data-uid */
        document.querySelectorAll('img[data-uid="' + userId + '"]').forEach(function(img) {
          img.src = d.avatar_url;
        });
        /* Recargar feed si ya estaba renderizado — para que aparezca la foto */
        var pc = document.getElementById('posts-feed-container');
        if (pc && pc.children.length && typeof window.loadPostsFeed === 'function') {
          window.loadPostsFeed(pc, userId);
        }
      }
      if (d.banner_url) {
        var pg = document.getElementById('page-more');
        var hero = pg && pg.querySelector('.prof-hero');
        if (hero && !hero.querySelector('img.prof-banner-img')) {
          var ni = document.createElement('img');
          ni.className = 'prof-banner-img';
          ni.src = d.banner_url;
          ni.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:top;position:absolute;inset:0;z-index:0;';
          hero.insertBefore(ni, hero.firstChild);
        } else if (hero) {
          var ex = hero.querySelector('img.prof-banner-img');
          if (ex) ex.src = d.banner_url;
        }
      }
    } catch(e) {}
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
      /* Cargar name_color y name_font del perfil */
      fetch('/api/profile',{credentials:'include'}).then(function(r){return r.json();}).then(function(pd){
        if(window.currentUser){
          window.currentUser.name_color=pd.name_color||'';
          window.currentUser.name_font=pd.name_font||'';
        }
        /* Esperar que las fuentes estén listas antes de aplicar */
        /* Aplicar estilo inmediatamente y reintentar para fuentes */
        if(window.refreshNameStyles) window.refreshNameStyles();
        setTimeout(function(){ if(window.refreshNameStyles) window.refreshNameStyles(); }, 600);
      }).catch(function(){});
      await updateAuthUI(currentUser);
      fetchUserPoints(session.id);
      /* Cargar avatar/banner custom de D1 — pisa el de Google si el usuario subió uno */
      fetchUserProfile(session.id);
      if (window._initNotifBtn) window._initNotifBtn();
      if (window._loadOwnStats) window._loadOwnStats();
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

    HottAuth.onChange(async s => {
      if (s) {
        currentUser = s; window.currentUser = s;
        await updateAuthUI(currentUser);
        closeAuthModal();
        fetchUserPoints(s.id);
        fetchUserProfile(s.id);
        if (window._initNotifBtn) window._initNotifBtn();
        if (window._loadOwnStats) window._loadOwnStats();
        // Restaurar al hacer login también
        setTimeout(restoreSavedStates, 800);
      } else {
        currentUser = null; window.currentUser = null;
        updateAuthUI(null);
        if (window._hideNotifBtn) window._hideNotifBtn();
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
      /* _initBroadcast se define en un IIFE posterior — defer para que ya exista */
      setTimeout(function() { if (window._initBroadcast) window._initBroadcast(); if (window._initSuggestionsBtn) window._initSuggestionsBtn(); }, 0);
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

    /* ── NOTIFICATION SYSTEM ── */
  (function() {
    var _panel     = null;
    var _badge     = null;
    var _btn       = null;
    var _list      = null;
    var _pollTimer = null;
    var _open      = false;
    var _lastData  = null; /* cache last fetch result */

    function _getEls() {
      _btn   = _btn   || document.getElementById('notif-btn');
      _badge = _badge || document.getElementById('notif-badge');
      _panel = _panel || document.getElementById('notif-panel');
      _list  = _list  || document.getElementById('notif-list');
    }

    function _timeAgo(ts) {
      var t = (Date.now() - new Date(ts).getTime()) / 1000;
      if (t < 60)    return 'just now';
      if (t < 3600)  return Math.floor(t/60) + 'm ago';
      if (t < 86400) return Math.floor(t/3600) + 'h ago';
      return Math.floor(t/86400) + 'd ago';
    }

    function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    function _renderNotif(n) {
      var typeIcon = n.type === 'ban' ? '&#128683;' : '&#128276;';
      return '<div data-nid="' + n.id + '" style="'
        + 'padding:0.8rem 1rem;border-bottom:1px solid var(--border);'
        + 'background:' + (n.read ? 'transparent' : 'rgba(255,69,0,0.06)') + ';'
        + 'display:flex;gap:0.65rem;align-items:flex-start;cursor:pointer;">'
        + '<div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:var(--surface-3);'
          + 'display:flex;align-items:center;justify-content:center;font-size:0.85rem;">' + typeIcon + '</div>'
        + '<div style="flex:1;min-width:0;">'
          + (n.title ? '<div style="font-family:var(--font-d);font-size:0.78rem;letter-spacing:0.04em;margin-bottom:0.15rem;">' + _esc(n.title) + '</div>' : '')
          + '<div style="font-size:0.8rem;color:var(--text-dim);line-height:1.45;">' + _esc(n.message || '') + '</div>'
          + '<div style="font-size:0.62rem;color:var(--text-muted);margin-top:0.25rem;">' + _timeAgo(n.created_at) + '</div>'
        + '</div>'
        + (!n.read ? '<div style="width:7px;height:7px;border-radius:50%;background:var(--fire-orange);flex-shrink:0;margin-top:0.3rem;"></div>' : '')
        + '</div>';
    }

    function _renderList(items) {
      _getEls();
      if (!_list) return;
      if (!items || !items.length) {
        _list.innerHTML = '<div style="padding:2rem 1rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">No notifications yet.</div>';
        return;
      }
      _list.innerHTML = items.map(_renderNotif).join('');
      _list.querySelectorAll('[data-nid]').forEach(function(el) {
        el.addEventListener('click', function() {
          var nid = el.getAttribute('data-nid');
          el.style.background = 'transparent';
          var dot = el.querySelector('div[style*="fire-orange"]');
          if (dot) dot.remove();
          fetch('/api/notifications/read', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: parseInt(nid) })
          });
        });
      });
    }

    /* _updateBadge — solo actualiza el contador, no renderiza el panel */
    function _updateBadge(count) {
      _getEls();
      if (!_badge) return;
      if (count > 0) {
        _badge.textContent = count > 9 ? '9+' : count;
        _badge.style.display = 'flex';
      } else {
        _badge.style.display = 'none';
      }
    }

    /* _pollBadge — fetch silencioso solo para el badge, no toca el panel */
    function _pollBadge() {
      if (!window.currentUser) return;
      fetch('/api/notifications?limit=1', { credentials: 'include' })
        .then(function(r) { return r.json(); })
        .then(function(d) { _updateBadge(d.unread_count || 0); })
        .catch(function() {});
    }

    /* _loadPanel — fetch completo que renderiza la lista */
    function _loadPanel() {
      _getEls();
      if (!_list) return;
      _list.innerHTML = '<div style="padding:2rem 1rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">Loading...</div>';
      fetch('/api/notifications?limit=30', { credentials: 'include' })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          _lastData = d;
          _updateBadge(d.unread_count || 0);
          _renderList(d.notifications || []);
        })
        .catch(function() {
          if (_list) _list.innerHTML = '<div style="padding:2rem 1rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">Could not load.</div>';
        });
    }

    function _openPanel() {
      _getEls();
      if (!_panel) return;
      _open = true;
      _panel.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function() {
        _panel.style.transform = 'translateX(-50%)';
      });
      /* Always fetch fresh data when opening — no cache */
      _loadPanel();
    }

    function _closePanel() {
      _getEls();
      if (!_panel) return;
      _open = false;
      _panel.style.transform = 'translateX(calc(-50% + 100vw))';
      document.body.style.overflow = '';
      setTimeout(function() { if (!_open) _panel.style.display = 'none'; }, 340);
    }

    window._initNotifBtn = function() {
      _getEls();
      if (!_btn) return;
      _btn.style.display = 'flex';
      /* Initial badge poll */
      _pollBadge();
      /* Poll badge every 60s */
      if (_pollTimer) clearInterval(_pollTimer);
      _pollTimer = setInterval(_pollBadge, 60000);
      /* Toggle panel */
      _btn.onclick = function() { _open ? _closePanel() : _openPanel(); };
      /* Close button */
      var closeBtn = document.getElementById('notif-close');
      if (closeBtn) closeBtn.onclick = _closePanel;
      /* Mark all read */
      var readAll = document.getElementById('notif-read-all');
      if (readAll) readAll.onclick = function() {
        fetch('/api/notifications/read', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ all: true })
        }).then(function() {
          _updateBadge(0);
          if (_list) _list.querySelectorAll('[data-nid]').forEach(function(el) {
            el.style.background = 'transparent';
            var dot = el.querySelector('div[style*="fire-orange"]');
            if (dot) dot.remove();
          });
        });
      };
    };

    window._hideNotifBtn = function() {
      _getEls();
      if (_btn) _btn.style.display = 'none';
      if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
      _closePanel();
    };
  })();

    /* ── FOLLOW SYSTEM ── */
  /* ── SUGGESTIONS PANEL (admin only) ── */
  (function() {
    var _open = false;
    var CAT_ICONS = { feature: '&#128161;', bug: '&#128027;', design: '&#127912;', content: '&#127919;', other: '&#128172;' };

    function _timeAgo(ts) {
      var t = (Date.now() - new Date(ts).getTime()) / 1000;
      if (t < 60) return 'just now';
      if (t < 3600) return Math.floor(t/60) + 'm ago';
      if (t < 86400) return Math.floor(t/3600) + 'h ago';
      return Math.floor(t/86400) + 'd ago';
    }

    function _close() {
      var s = document.getElementById('suggestions-panel'); if (!s) return;
      _open = false;
      s.style.transform = 'translateX(calc(-50% + 100vw))';
      document.body.style.overflow = '';
      setTimeout(function() { if (!_open) s.style.display = 'none'; }, 340);
    }

    window._closeSuggestionsPanel = _close;
    window._loadSuggestions = function() {
      var list = document.getElementById('suggestions-list');
      if (!list) return;
      list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">Loading...</div>';
      fetch('/api/admin/suggestions', { credentials: 'include' })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          var items = d.suggestions || [];
          if (!items.length) {
            list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);font-size:0.82rem;">No suggestions yet.</div>';
            return;
          }
          /* Update badge */
          var badge = document.getElementById('suggestions-badge');
          if (badge) { badge.textContent = items.length > 9 ? '9+' : items.length; badge.style.display = 'flex'; }
          list.innerHTML = items.map(function(s) {
            var icon = CAT_ICONS[s.category] || '&#128172;';
            var uname = s.username || 'Anonymous';
            return '<div style="padding:0.85rem 1rem;border-bottom:1px solid var(--border);">'
              + '<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;">'
                + '<span style="font-size:0.9rem;">' + icon + '</span>'
                + '<span style="font-family:var(--font-d);font-size:0.72rem;letter-spacing:0.05em;color:var(--fire-orange);">' + s.category.toUpperCase() + '</span>'
                + '<span style="font-size:0.65rem;color:var(--text-muted);margin-left:auto;">' + _timeAgo(s.created_at) + '</span>'
              + '</div>'
              + '<div style="font-size:0.82rem;color:var(--text);line-height:1.5;margin-bottom:0.35rem;">' + s.message.replace(/</g,'&lt;') + '</div>'
              + '<div style="display:flex;align-items:center;justify-content:space-between;">'
                + '<span style="font-size:0.65rem;color:var(--text-muted);">from <b>' + uname + '</b></span>'
                + '<button onclick="window._deleteSuggestion(' + s.id + ',this)" style="background:none;border:none;color:var(--text-muted);font-size:0.65rem;cursor:pointer;padding:0.2rem 0.4rem;">&#128465; Done</button>'
              + '</div>'
              + '</div>';
          }).join('');
        })
        .catch(function() { list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);">Could not load.</div>'; });
    };

    window._deleteSuggestion = function(id, btn) {
      var row = btn.closest('div[style*="border-bottom"]');
      fetch('/api/admin/suggestions?id=' + id, { method: 'DELETE', credentials: 'include' })
        .then(function() { if (row) { row.style.opacity = '0.3'; row.style.pointerEvents = 'none'; } });
    };

    window._initSuggestionsBtn = function() {
      var btn = document.getElementById('suggestions-btn');
      if (!btn) return;
      btn.style.display = 'flex';
      var closeBtn = document.getElementById('suggestions-close');
      if (closeBtn) closeBtn.onclick = _close;
      btn.onclick = function() {
        var panel = document.getElementById('suggestions-panel');
        if (!panel) return;
        if (_open) { _close(); return; }
        _open = true;
        panel.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function() { panel.style.transform = 'translateX(-50%)'; });
        window._loadSuggestions();
      };
      /* Load badge count on init */
      fetch('/api/admin/suggestions', { credentials: 'include' })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          var cnt = (d.suggestions||[]).length;
          var badge = document.getElementById('suggestions-badge');
          if (badge && cnt > 0) { badge.textContent = cnt > 9 ? '9+' : cnt; badge.style.display = 'flex'; }
        }).catch(function(){});
    };
  })();

  /* ── SUGGESTION SYSTEM ── */
  (function() {
    var _open = false;
    function _sheet() { return document.getElementById('suggestion-sheet'); }
    function _close() {
      var s = _sheet(); if (!s) return;
      _open = false;
      s.style.transform = 'translateX(calc(-50% + 100vw))';
      document.body.style.overflow = '';
      setTimeout(function() { if (!_open) s.style.display = 'none'; }, 340);
    }
    window._closeSuggestionSheet = _close;
    window._openSuggestionSheet = function() {
      var s = _sheet(); if (!s) return;
      _open = true;
      s.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function() { s.style.transform = 'translateX(-50%)'; });
      var closeBtn = document.getElementById('suggestion-close');
      if (closeBtn) closeBtn.onclick = _close;
      var msg = document.getElementById('suggestion-msg');
      var chars = document.getElementById('suggestion-chars');
      if (msg && chars) msg.oninput = function() { chars.textContent = msg.value.length + ' / 1000'; };
    };
    window._sendSuggestion = function(btn) {
      var msg = (document.getElementById('suggestion-msg')||{}).value||'';
      var cat = (document.getElementById('suggestion-cat')||{}).value||'other';
      var status = document.getElementById('suggestion-status');
      if (!msg.trim()) { if (status) status.textContent = 'Write your suggestion first.'; return; }
      btn.disabled = true; btn.textContent = 'Sending...';
      if (status) status.textContent = '';
      fetch('/api/suggestions', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, message: msg.trim() })
      })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          btn.disabled = false; btn.innerHTML = '&#128161; SEND SUGGESTION';
          if (d.ok) {
            if (status) status.textContent = '&#10003; Thanks! We got your suggestion.';
            var msgEl = document.getElementById('suggestion-msg');
            if (msgEl) msgEl.value = '';
            var charsEl = document.getElementById('suggestion-chars');
            if (charsEl) charsEl.textContent = '0 / 1000';
            setTimeout(function() { _close(); }, 2000);
          } else {
            if (status) status.textContent = 'Error: ' + (d.error || 'Try again');
          }
        })
        .catch(function() {
          btn.disabled = false; btn.innerHTML = '&#128161; SEND SUGGESTION';
          if (status) status.textContent = 'Request failed.';
        });
    };
  })();

  /* ── CUSTOM AUDIO PLAYER ── */
  window._hwAudioPlay = function(btn) {
    var wrapper = btn.closest('.hw-audio-player');
    if (!wrapper) return;
    var src = wrapper.getAttribute('data-src');
    var fill = wrapper.querySelector('.hw-audio-fill');
    var timeEl = wrapper.querySelector('.hw-audio-time');
    var playIcon = btn.querySelector('.hw-play-icon');
    var pauseIcon = btn.querySelector('.hw-pause-icon');
    var bar = wrapper.querySelector('.hw-audio-progress');

    /* Reuse or create audio element */
    if (!wrapper._audio) {
      wrapper._audio = new Audio(src);
      wrapper._audio.preload = 'metadata';
      wrapper._audio.addEventListener('timeupdate', function() {
        var pct = wrapper._audio.duration ? (wrapper._audio.currentTime / wrapper._audio.duration) * 100 : 0;
        if (fill) fill.style.width = pct + '%';
        if (timeEl) {
          var t = Math.floor(wrapper._audio.currentTime);
          timeEl.textContent = Math.floor(t/60) + ':' + ('0'+t%60).slice(-2);
        }
      });
      wrapper._audio.addEventListener('ended', function() {
        if (fill) fill.style.width = '0%';
        if (timeEl) timeEl.textContent = '0:00';
        if (playIcon) { playIcon.style.display=''; pauseIcon.style.display='none'; }
        wrapper._playing = false;
      });
      /* Click on bar to seek */
      if (bar) bar.addEventListener('click', function(e) {
        if (!wrapper._audio.duration) return;
        var rect = bar.getBoundingClientRect();
        wrapper._audio.currentTime = ((e.clientX - rect.left) / rect.width) * wrapper._audio.duration;
      });
    }

    if (wrapper._playing) {
      wrapper._audio.pause();
      wrapper._playing = false;
      if (playIcon) { playIcon.style.display=''; pauseIcon.style.display='none'; }
    } else {
      /* Pause all other players */
      document.querySelectorAll('.hw-audio-player').forEach(function(p) {
        if (p !== wrapper && p._audio && p._playing) {
          p._audio.pause(); p._playing = false;
          var pi = p.querySelector('.hw-play-icon'), pi2 = p.querySelector('.hw-pause-icon');
          if (pi) { pi.style.display=''; pi2.style.display='none'; }
        }
      });
      wrapper._audio.play();
      wrapper._playing = true;
      if (playIcon) { playIcon.style.display='none'; pauseIcon.style.display=''; }
    }
  };

  window._openFollowSheet = function(uid, type) {
    var sheet = document.getElementById('follow-list-sheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'follow-list-sheet';
      sheet.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(calc(-50% + 100vw));width:100%;max-width:480px;height:100%;z-index:400;background:var(--bg);display:flex;flex-direction:column;transition:transform 0.32s cubic-bezier(0.16,1,0.3,1);';
      sheet.innerHTML = '<div style="display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1rem;border-bottom:1px solid var(--border);flex-shrink:0;">'
        + '<button onclick="window._closeFollowSheet()" style="background:none;border:none;color:var(--text);width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>'
        + '<div id="fls-title" style="font-family:var(--font-d);font-size:0.95rem;letter-spacing:0.06em;flex:1;"></div>'
        + '</div>'
        + '<div id="fls-list" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0.5rem 0;"></div>';
      document.body.appendChild(sheet);
    }
    document.getElementById('fls-title').textContent = type === 'followers' ? 'Followers' : 'Following';
    var listEl = document.getElementById('fls-list');
    listEl.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">Loading...</div>';
    sheet.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function() { sheet.style.transform = 'translateX(-50%)'; });
    fetch('/api/user-follows/list?user_id=' + encodeURIComponent(uid) + '&type=' + type, { credentials: 'include' })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var users = d.users || [];
        if (!users.length) {
          listEl.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);font-size:0.82rem;">No ' + type + ' yet.</div>';
          return;
        }
        listEl.innerHTML = users.map(function(u) {
          var nm = u.username || 'User';
          var av = u.avatar_url
            ? '<img src="' + u.avatar_url + '" style="width:44px;height:44px;border-radius:50%;object-fit:cover;flex-shrink:0;">'
            : '<div style="width:44px;height:44px;border-radius:50%;background:var(--surface-3);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:1.1rem;flex-shrink:0;">' + nm.charAt(0).toUpperCase() + '</div>';
          return '<div data-uid="' + u.user_id + '" data-nm="' + nm.replace(/"/g,'&quot;') + '" style="display:flex;align-items:center;gap:0.85rem;padding:0.75rem 1rem;border-bottom:1px solid var(--border);cursor:pointer;">'
            + av + '<div style="flex:1;font-family:var(--font-d);font-size:0.9rem;">' + nm + '</div></div>';
        }).join('');
        listEl.querySelectorAll('[data-uid]').forEach(function(row) {
          row.addEventListener('click', function() {
            window._closeFollowSheet();
            setTimeout(function() {
              if (window.openMiniProfile) window.openMiniProfile(row.getAttribute('data-uid'), row.getAttribute('data-nm'));
            }, 360);
          });
        });
      })
      .catch(function() { listEl.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-muted);">Could not load.</div>'; });
  };

  window._closeFollowSheet = function() {
    var s = document.getElementById('follow-list-sheet');
    if (!s) return;
    s.style.transform = 'translateX(calc(-50% + 100vw))';
    document.body.style.overflow = '';
    setTimeout(function() { if (s) s.style.display = 'none'; }, 360);
  };

  window._loadOwnStats = function() {
    if (!window.currentUser) return;
    var uid = window.currentUser.id;
    var statsEl = document.getElementById('prof-ig-stats');
    if (statsEl) statsEl.style.display = 'flex';
    fetch('/api/user-follows/stats?user_id=' + encodeURIComponent(uid), { credentials: 'include' })
      .then(function(r){ return r.json(); })
      .then(function(d){
        var fc = document.getElementById('own-followers-count');
        var gc = document.getElementById('own-following-count');
        if (fc) fc.textContent = d.followers || 0;
        if (gc) gc.textContent = d.following || 0;
      }).catch(function(){});
    fetch('/api/posts?user_id=' + encodeURIComponent(uid))
      .then(function(r){ return r.json(); })
      .then(function(d){
        var pc = document.getElementById('own-posts-count');
        if (pc) pc.textContent = (d.posts||[]).length;
      }).catch(function(){});
  };

  window._toggleFollow = function(btn, targetUid) {
    if (!window.currentUser) return;
    var isFollowing = btn.textContent.trim() === 'Following';
    var action = isFollowing ? 'unfollow' : 'follow';
    btn.disabled = true;
    fetch('/api/user-follows', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: targetUid, action: action })
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      btn.disabled = false;
      btn.textContent = d.is_following ? 'Following' : 'Follow';
      btn.style.background = d.is_following ? 'var(--surface-3)' : 'var(--fire-orange)';
      btn.style.color = d.is_following ? 'var(--text-dim)' : '#fff';
      /* Update counts */
      var frEl = document.getElementById('user-prof-followers');
      if (frEl) frEl.textContent = d.followers;
    })
    .catch(function() { btn.disabled = false; });
  };

  /* ── BROADCAST PANEL (admin only) ── */
  (function() {
    var _open = false;

    function _sheet() { return document.getElementById('broadcast-sheet'); }
    function _close() {
      var s = _sheet();
      if (!s) return;
      _open = false;
      s.style.transform = 'translateX(calc(-50% + 100vw))';
      document.body.style.overflow = '';
      setTimeout(function() { if (!_open) s.style.display = 'none'; }, 340);
    }
    function _open_sheet() {
      var s = _sheet();
      if (!s) return;
      _open = true;
      s.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function() { s.style.transform = 'translateX(-50%)'; });
    }

    /* Global — called directly from onclick in HTML */
    window._sendBroadcast = function(btn) {
      var titleEl  = document.getElementById('broadcast-title');
      var msgEl    = document.getElementById('broadcast-msg');
      var statusEl = document.getElementById('broadcast-status');
      var msg = msgEl ? msgEl.value.trim() : '';
      if (!msg) {
        if (statusEl) statusEl.textContent = 'Write a message first.';
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Sending...';
      if (statusEl) statusEl.textContent = '';
      fetch('/api/admin/broadcast', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: (titleEl && titleEl.value.trim()) || 'Announcement',
          message: msg
        })
      })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        btn.disabled = false;
        btn.innerHTML = '&#9993; SEND TO ALL USERS';
        if (d.ok) {
          if (statusEl) statusEl.textContent = 'Sent to ' + d.sent + ' users!';
          if (msgEl) msgEl.value = '';
          if (titleEl) titleEl.value = '';
          var charsEl = document.getElementById('broadcast-chars');
          if (charsEl) charsEl.textContent = '0 / 500';
          setTimeout(_close, 2000);
        } else {
          if (statusEl) statusEl.textContent = 'Error: ' + (d.error || 'unknown');
        }
      })
      .catch(function(e) {
        btn.disabled = false;
        btn.innerHTML = '&#9993; SEND TO ALL USERS';
        if (statusEl) statusEl.textContent = 'Request failed: ' + e.message;
      });
    };

    window._initBroadcast = function() {
      var btn = document.getElementById('broadcast-btn');
      if (!btn) return;
      btn.style.display = 'flex';
      btn.onclick = function() { _open ? _close() : _open_sheet(); };

      var closeBtn = document.getElementById('broadcast-close');
      if (closeBtn) closeBtn.onclick = _close;

      var msgEl   = document.getElementById('broadcast-msg');
      var charsEl = document.getElementById('broadcast-chars');
      if (msgEl && charsEl) {
        msgEl.addEventListener('input', function() {
          charsEl.textContent = msgEl.value.length + ' / 500';
        });
      }
    };
  })();

    /* ── ADMIN ACTION FUNCTIONS ── */
  window._adminIsOn = function() {
    try {
      var m = document.cookie.match(/hw_admin=([^;]+)/);
      if (!m) return false;
      var s = JSON.parse(atob(m[1]));
      return s && s.login === 'Mikeljchm';
    } catch(e) { return false; }
  };

  window._adminDeletePost = function(id, btn) {
    if (!window._adminIsOn()) return;
    var reason = prompt('Reason for deletion (sent to user):');
    if (reason === null) return;
    btn.disabled = true;
    fetch('/api/admin/post?id=' + id, { method: 'DELETE', credentials: 'include' })
      .then(function(r) { return r.json(); })
      .then(function() {
        if (reason.trim()) {
          fetch('/api/admin/notify', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: btn.dataset.uid, message: 'Your post was removed: ' + reason })
          });
        }
        var card = btn.closest('.post-card, [data-post-id]');
        if (card) card.style.cssText = 'opacity:0;transition:opacity 0.3s;pointer-events:none;';
        setTimeout(function() { if (card) card.remove(); }, 300);
      })
      .catch(function() { btn.disabled = false; alert('Error deleting post'); });
  };

  window._adminDelComment = function(id, uid, btn) {
    if (!window._adminIsOn()) return;
    var reason = prompt('Reason (sent to user):');
    if (reason === null) return;
    btn.disabled = true;
    fetch('/api/admin/comment?id=' + id, { method: 'DELETE', credentials: 'include' })
      .then(function(r) { return r.json(); })
      .then(function() {
        if (reason.trim() && uid) {
          fetch('/api/admin/notify', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: uid, message: 'Your comment was removed: ' + reason })
          });
        }
        var item = btn.closest('.cp-item');
        if (item) { item.style.cssText = 'opacity:0;transition:opacity 0.3s;'; setTimeout(function(){ item.remove(); }, 300); }
      })
      .catch(function() { btn.disabled = false; alert('Error deleting comment'); });
  };

  window._adminDelThreadPost = function(id, uid, btn) {
    if (!window._adminIsOn()) return;
    var reason = prompt('Reason (sent to user):');
    if (reason === null) return;
    btn.disabled = true;
    fetch('/api/admin/thread-post?id=' + id, { method: 'DELETE', credentials: 'include' })
      .then(function(r) { return r.json(); })
      .then(function() {
        if (reason.trim() && uid) {
          fetch('/api/admin/notify', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: uid, message: 'Your post in this thread was removed: ' + reason })
          });
        }
        var card = btn.closest('.comm-post');
        if (card) { card.style.cssText = 'opacity:0;transition:opacity 0.3s;'; setTimeout(function(){ card.remove(); }, 300); }
      })
      .catch(function() { btn.disabled = false; alert('Error deleting thread post'); });
  };

  window._adminDeleteUserPost = function(id, uid, btn) {
    if (!window._adminIsOn()) return;
    var reason = prompt('Reason for deletion (sent to user):');
    if (reason === null) return;
    btn.disabled = true;
    fetch('/api/admin/post?id=' + id, { method: 'DELETE', credentials: 'include' })
      .then(function(r) { return r.json(); })
      .then(function() {
        if (reason.trim() && uid) {
          fetch('/api/admin/notify', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: uid, message: 'Your post was removed: ' + reason })
          });
        }
        var card = btn.closest('[data-upid]');
        if (card) { card.style.cssText = 'opacity:0;transition:opacity 0.3s;'; setTimeout(function(){ card.remove(); }, 300); }
        else { btn.closest('div[style]') && (btn.closest('div[style]').style.opacity = '0.3'); }
      })
      .catch(function() { btn.disabled = false; });
  };

  window._adminClearBanner = function(uid) {
    if(!window._adminIsOn()) return;
    if(!confirm('Clear banner for this user?')) return;
    fetch('/api/admin/clear-media?user_id='+encodeURIComponent(uid)+'&field=banner_url',{method:'POST',credentials:'include'})
      .then(function(r){return r.json();}).then(function(d){
        if(d.ok){ var bn=document.getElementById('uprof-banner'); if(bn){ var img=bn.querySelector('img'); if(img) img.remove(); } alert('Banner cleared.'); }
        else alert('Error: '+(d.error||'Unknown'));
      }).catch(function(){ alert('Request failed'); });
  };
  window._adminClearAvatar = function(uid) {
    if(!window._adminIsOn()) return;
    if(!confirm('Clear avatar for this user?')) return;
    fetch('/api/admin/clear-media?user_id='+encodeURIComponent(uid)+'&field=avatar_url',{method:'POST',credentials:'include'})
      .then(function(r){return r.json();}).then(function(d){
        if(d.ok){ var av=document.getElementById('uprof-av'); if(av){ av.innerHTML=av.textContent.charAt(0)||'?'; } alert('Avatar cleared.'); }
        else alert('Error: '+(d.error||'Unknown'));
      }).catch(function(){ alert('Request failed'); });
  };
  window._adminClearBio = function(uid) {
    if(!window._adminIsOn()) return;
    if(!confirm('Clear bio for this user?')) return;
    fetch('/api/admin/clear-media?user_id='+encodeURIComponent(uid)+'&field=bio',{method:'POST',credentials:'include'})
      .then(function(r){return r.json();}).then(function(d){
        if(d.ok){ var bio=document.getElementById('uprof-bio'); if(bio) bio.textContent=''; alert('Bio cleared.'); }
        else alert('Error: '+(d.error||'Unknown'));
      }).catch(function(){ alert('Request failed'); });
  };

  window._adminBanUser = function(uid, uname) {
    if (!window._adminIsOn()) return;
    var reason = prompt('Ban reason for ' + uname + ' (shown to user):');
    if (reason === null) return;
    if (!confirm('BAN + delete ALL content for ' + uname + '?\nThis cannot be undone.')) return;
    fetch('/api/admin/user?user_id=' + encodeURIComponent(uid) + '&reason=' + encodeURIComponent(reason), {
      method: 'DELETE', credentials: 'include'
    })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        if (d.ok) {
          alert('User banned and content wiped.');
          var page = document.getElementById('page-user-profile');
          if (page) { page.style.transform = 'translateX(100%)'; setTimeout(function(){ page.style.display = 'none'; }, 350); }
        } else {
          alert('Error: ' + (d.error || 'Unknown'));
        }
      })
      .catch(function() { alert('Request failed'); });
  };

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
    '.prof-topbar{display:none;}',
    '.prof-topbar-title{display:none;}',
    '.prof-menu-btn{background:none;border:none;color:#fff;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
    '.prof-dropdown{display:none;position:absolute;top:calc(100% + 0.4rem);right:0;background:var(--surface-2);border:1px solid var(--border);border-radius:14px;min-width:220px;z-index:999;box-shadow:0 8px 32px rgba(0,0,0,0.6);overflow:hidden;}',
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
    '.prof-hero{background:linear-gradient(135deg,#1a0505 0%,#2d0a00 45%,#1a0505 100%);position:relative;cursor:pointer;overflow:hidden;}',
    '.prof-hero img{width:100%;height:100%;object-fit:cover;object-position:top;display:block;}',
    '.prof-hero-edit-hint{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0);transition:background 0.2s;pointer-events:none;}',
    '.prof-hero:active .prof-hero-edit-hint{background:rgba(0,0,0,0.35);}',
    '.prof-hero-edit-icon{opacity:0;transition:opacity 0.2s;background:rgba(0,0,0,0.55);border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;}',
    '.prof-hero:active .prof-hero-edit-icon{opacity:1;}',
    '.prof-hero-glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 130%,rgba(255,69,0,0.38) 0%,transparent 65%);pointer-events:none;}',
    '.prof-hero-pattern{position:absolute;inset:0;opacity:0.05;background-image:repeating-linear-gradient(45deg,var(--fire-orange) 0,var(--fire-orange) 1px,transparent 0,transparent 50%);background-size:12px 12px;pointer-events:none;}',
    '',
    '.prof-avatar-wrap{width:68px;height:68px;border-radius:50%;border:3px solid var(--bg);background:var(--surface-2);overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;}',
    '.prof-avatar-cam{position:absolute;inset:0;background:rgba(0,0,0,0);display:flex;align-items:center;justify-content:center;transition:background 0.2s;border-radius:50%;}',
    '.prof-avatar-cam svg{opacity:0;transition:opacity 0.2s;width:18px;height:18px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '.prof-avatar-wrap:active .prof-avatar-cam{background:rgba(0,0,0,0.45);}',
    '.prof-avatar-wrap:active .prof-avatar-cam svg{opacity:1;}',
    '.prof-avatar-wrap img{width:100%;height:100%;object-fit:cover;}',
    '.user-avatar-placeholder svg{width:28px;height:28px;stroke:var(--text-muted);fill:none;stroke-width:1.5;}',
    '.prof-info{padding:0 1rem 0.65rem;}',
    '.prof-fullname{font-family:var(--font-d);font-size:1.2rem;letter-spacing:0.05em;margin-bottom:0.05rem;}',
    '.prof-username-wrap{display:flex;align-items:center;gap:0.4rem;margin-bottom:0.05rem;}',
    '.prof-username{font-size:0.75rem;color:var(--text-dim);}',
    '.prof-username-edit-btn{background:none;border:none;color:var(--text-muted);padding:0.1rem;cursor:pointer;display:flex;}',
    '.prof-username-input-wrap{display:flex;gap:0.4rem;margin-bottom:0.35rem;}',
    '.prof-username-input{flex:1;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:8px;padding:0.3rem 0.6rem;font-size:0.8rem;font-family:var(--font-b);}',
    '.prof-username-save{background:var(--fire-orange);color:#fff;border:none;border-radius:8px;padding:0.3rem 0.7rem;font-size:0.75rem;cursor:pointer;font-family:var(--font-d);letter-spacing:0.05em;}',
    '.prof-badge{display:inline-flex;align-items:center;gap:0.3rem;margin-bottom:0.45rem;font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;padding:0.22rem 0.65rem;border-radius:20px;font-family:var(--font-d);}',
    '.badge-rookie{background:var(--surface-3);color:var(--text-dim);}',
    '.badge-regular{background:#1a3a1a;color:#4caf50;}',
    '.badge-soldier{background:#1a1a3a;color:#6c8fff;}',
    '.badge-vip{background:#3a1a00;color:var(--fire-orange);}',
    '.prof-bio-area{margin-top:0.2rem;}',
    '.prof-bio-text{font-size:0.8rem;color:var(--text-dim);line-height:1.5;}',
    '.prof-bio-edit-btn{background:none;border:none;color:var(--text-muted);font-size:0.75rem;cursor:pointer;padding:0;font-family:var(--font-b);font-style:italic;}',
    '.prof-bio-input{width:100%;background:var(--surface-2);border:1px solid var(--fire-orange);color:var(--text);border-radius:8px;padding:0.45rem 0.65rem;font-size:0.8rem;font-family:var(--font-b);resize:none;height:58px;outline:none;margin-top:0.3rem;line-height:1.4;box-sizing:border-box;}',
    '.prof-avatar-row{padding:0.75rem 1rem 0;position:relative;z-index:2;display:flex;align-items:center;gap:0;}'
    + '.prof-ig-stats{flex:1;display:flex;padding-left:0.75rem;}'
    + '.prof-ig-stat{flex:1;text-align:center;background:none;border:none;cursor:pointer;padding:0.2rem 0;outline:none;}'
    + '.prof-ig-stat-n{font-family:var(--font-d);font-size:1.05rem;line-height:1;color:var(--text);display:block;}'
    + '.prof-ig-stat-l{font-size:0.62rem;color:var(--text-dim);margin-top:0.15rem;display:block;}'
    + '.prof-stats{display:flex;align-items:center;gap:1.1rem;padding:0.5rem 1rem 0.65rem;flex-wrap:wrap;}',
    '.prof-stat{display:flex;align-items:baseline;gap:0.28rem;}',
    '.prof-stat-n{font-family:var(--font-d);font-size:0.95rem;color:var(--text);line-height:1;}',
    '.prof-stat-l{font-size:0.78rem;color:var(--text-dim);}',
    '.prof-stat-div{width:3px;height:3px;border-radius:50%;background:var(--text-muted);}',
    '.prof-tabs{display:flex;border-bottom:1px solid var(--border);margin-top:0.85rem;}',
    '.prof-tab{flex:1;padding:0.7rem 0.25rem;background:none;border:none;color:var(--text-dim);font-family:var(--font-d);font-size:0.8rem;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;}',
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
      var uid = window.currentUser ? window.currentUser.id : null;
      if (pc && typeof window.loadPostsFeed==='function') window.loadPostsFeed(pc, uid);
    }
  });

  /* ── Edit Profile Sheet — un solo botón, todos los campos ── */
  (function(){
    /* CSS del sheet */
    var st=document.createElement('style');
    st.textContent=[
      '.ep-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:350;display:none;}',
      '.ep-overlay.open{display:block;}',
      '.ep-sheet{position:fixed;left:0;right:0;bottom:0;max-width:480px;margin:0 auto;background:var(--surface);border-radius:20px 20px 0 0;border-top:1px solid var(--border);z-index:351;padding:0.5rem 1.1rem calc(1.5rem + env(safe-area-inset-bottom,0px));transform:translateY(100%);transition:transform 0.32s cubic-bezier(0.16,1,0.3,1);max-height:88vh;overflow-y:auto;-webkit-overflow-scrolling:touch;}',
      '.ep-sheet.open{transform:translateY(0);}',
      '.ep-title{font-family:var(--font-d);font-size:0.9rem;letter-spacing:0.08em;margin-bottom:1rem;}',
      '.ep-label{font-size:0.65rem;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.3rem;display:block;}',
      '.ep-input{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:0.6rem 0.85rem;font-size:0.85rem;font-family:var(--font-b);margin-bottom:0.85rem;box-sizing:border-box;outline:none;}',
      '.ep-input:focus{border-color:var(--fire-orange);}',
      '.ep-ta{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:0.6rem 0.85rem;font-size:0.85rem;font-family:var(--font-b);resize:none;height:80px;margin-bottom:0.85rem;box-sizing:border-box;outline:none;line-height:1.5;}',
      '.ep-ta:focus{border-color:var(--fire-orange);}',
      '.ep-age-row{display:flex;gap:0.75rem;align-items:center;margin-bottom:0.85rem;}',
      '.ep-date-input{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:0.6rem 0.85rem;font-size:0.85rem;font-family:var(--font-b);outline:none;margin-bottom:0.5rem;box-sizing:border-box;-webkit-appearance:none;}',
      '.ep-date-input:focus{border-color:var(--fire-orange);}',
      '.ep-toggle-row{display:flex;align-items:center;gap:0.75rem;flex:1;background:var(--surface-2);border-radius:10px;padding:0.5rem 0.85rem;border:1px solid var(--border);}',
      '.ep-toggle-label{font-size:0.78rem;color:var(--text-dim);flex:1;}',
      '.ep-save-btn{width:100%;background:var(--fire-orange);color:#fff;border:none;border-radius:12px;padding:0.75rem;font-family:var(--font-d);font-size:0.88rem;letter-spacing:0.06em;cursor:pointer;margin-top:0.25rem;}',
      '.ep-save-btn:disabled{opacity:0.5;}',
      '.ep-edit-profile-btn{background:none;border:1px solid var(--border);color:var(--text-dim);border-radius:20px;padding:0.35rem 1.1rem;font-family:var(--font-b);font-size:0.72rem;cursor:pointer;margin-top:0.5rem;display:inline-block;}',
      /* Name style picker */
      '.ep-colors{display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.85rem;}',
      '.ep-color-btn{width:32px;height:32px;border-radius:50%;border:3px solid transparent;cursor:pointer;flex-shrink:0;transition:transform 0.15s;}',
      '.ep-color-btn.active{border-color:#fff;transform:scale(1.15);}',
      '.ep-color-btn.gradient{background:linear-gradient(135deg,#FF4500,#FFB800) !important;}',
      '.ep-fonts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.35rem;margin-bottom:0.85rem;max-height:180px;overflow-y:auto;}',
      '.ep-font-btn{background:var(--surface-2);border:2px solid var(--border);color:var(--text);border-radius:10px;padding:0.5rem 0.4rem;cursor:pointer;font-size:0.9rem;text-align:center;}',
      '.ep-font-btn.active{border-color:var(--fire-orange);color:var(--fire-orange);}',
      '.ep-name-preview{font-size:1.8rem;text-align:center;padding:0.5rem 1rem;margin-bottom:0.85rem;min-height:2.5rem;letter-spacing:0.04em;}'
    ].join('');
    document.head.appendChild(st);

    /* Crear overlay y sheet */
    var ov=document.createElement('div'); ov.className='ep-overlay'; ov.id='ep-overlay';
    var sh=document.createElement('div'); sh.className='ep-sheet'; sh.id='ep-sheet';
    sh.innerHTML=
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">'
        +'<div class="ep-title" style="margin-bottom:0;">Edit Profile</div>'
        +'<button id="ep-close" style="background:none;border:none;color:var(--text-dim);font-size:1.3rem;cursor:pointer;padding:0.2rem 0.4rem;line-height:1;">&#10005;</button>'
      +'</div>'
      +'<label class="ep-label">Display Name</label>'
      +'<input class="ep-input" id="ep-name" type="text" maxlength="50" placeholder="Your name">'
      +'<label class="ep-label">Username</label>'
      +'<input class="ep-input" id="ep-username" type="text" maxlength="30" placeholder="@username">'
      +'<label class="ep-label">Bio</label>'
      +'<textarea class="ep-ta" id="ep-bio" maxlength="150" placeholder="Tell something about yourself..."></textarea>'
      +'<label class="ep-label">Date of Birth</label>'
      +'<input class="ep-date-input" id="ep-birth-date" type="date" max="">'
      +'<div class="ep-toggle-row" style="margin-bottom:0.85rem;">'
        +'<span class="ep-toggle-label">Show age publicly</span>'
        +'<label class="prof-toggle"><input type="checkbox" id="ep-age-public"><span class="prof-toggle-track"></span></label>'
      +'</div>'
      +'<label class="ep-label">City</label>'
      +'<input class="ep-input" id="ep-city" type="text" maxlength="60" placeholder="e.g. Medell&#237;n">'
      +'<label class="ep-label">Country</label>'
      +'<input class="ep-input" id="ep-country" type="text" maxlength="60" placeholder="e.g. Colombia">'
      +'<label class="ep-label">Name Style</label>'
      /* Preview del nombre */
      +'<div class="ep-name-preview" id="ep-name-preview">Your Name</div>'
      /* Colores */
      +'<div class="ep-colors" id="ep-colors">'
        +'<button class="ep-color-btn active" data-color="" style="background:var(--text);"></button>'
        +'<button class="ep-color-btn gradient" data-color="gradient"></button>'
        +'<button class="ep-color-btn" data-color="#FF4500" style="background:#FF4500;"></button>'
        +'<button class="ep-color-btn" data-color="#FFB800" style="background:#FFB800;"></button>'
        +'<button class="ep-color-btn" data-color="#CC1100" style="background:#CC1100;"></button>'
        +'<button class="ep-color-btn" data-color="#4488FF" style="background:#4488FF;"></button>'
        +'<button class="ep-color-btn" data-color="#9B59B6" style="background:#9B59B6;"></button>'
        +'<button class="ep-color-btn" data-color="#27AE60" style="background:#27AE60;"></button>'
        +'<button class="ep-color-btn" data-color="#FF69B4" style="background:#FF69B4;"></button>'
      +'</div>'
      /* Fuentes */
      +'<div class="ep-fonts" id="ep-fonts">'
        +'<button class="ep-font-btn active" data-font="">Default</button>'
        +'<button class="ep-font-btn" data-font="Bebas Neue">Bold</button>'
        +'<button class="ep-font-btn" data-font="Playfair Display">Elegant</button>'
        +'<button class="ep-font-btn" data-font="Anton">Sport</button>'
        +'<button class="ep-font-btn" data-font="Righteous">Retro</button>'
        +'<button class="ep-font-btn" data-font="Dancing Script">Script</button>'
        +'<button class="ep-font-btn" data-font="Oswald">Oswald</button>'
        +'<button class="ep-font-btn" data-font="Russo One">Russo</button>'
        +'<button class="ep-font-btn" data-font="Pacifico">Pacifico</button>'
        +'<button class="ep-font-btn" data-font="Lobster">Lobster</button>'
        +'<button class="ep-font-btn" data-font="Permanent Marker">Marker</button>'
        +'<button class="ep-font-btn" data-font="Bungee">Bungee</button>'
        +'<button class="ep-font-btn" data-font="Monoton">Monoton</button>'
        +'<button class="ep-font-btn" data-font="Creepster">Creep</button>'
        +'<button class="ep-font-btn" data-font="Teko">Teko</button>'
        +'<button class="ep-font-btn" data-font="Exo 2">Exo 2</button>'
        +'<button class="ep-font-btn" data-font="Rajdhani">Rajdhani</button>'
        +'<button class="ep-font-btn" data-font="Audiowide">Audiowide</button>'
        +'<button class="ep-font-btn" data-font="Alfa Slab One">Alfa</button>'
        +'<button class="ep-font-btn" data-font="Black Han Sans">Black</button>'
      +'</div>'
      +'<button class="ep-save-btn" id="ep-save">Save Profile</button>';
    document.body.appendChild(ov); document.body.appendChild(sh);
    /* Aplicar fuente a cada botón */
    sh.querySelectorAll('.ep-font-btn[data-font]').forEach(function(btn){
      var f=btn.getAttribute('data-font');
      if(f) btn.style.fontFamily='"'+f+'",cursive,sans-serif';
    });

    /* Estado del picker */
    var _pickerColor = '';
    var _pickerFont  = '';

    function updateNamePreview(){
      var prev=document.getElementById('ep-name-preview');
      var nameVal=document.getElementById('ep-name');
      if(!prev||!nameVal) return;
      var txt=nameVal.value||'Your Name';
      prev.textContent=txt;
      if(_pickerFont && _pickerFont.trim()){
        var pfq=_pickerFont.indexOf(' ')>-1?'"'+_pickerFont+'"':_pickerFont;
        prev.style.setProperty('font-family',pfq+',cursive,sans-serif','important');
      } else {
        prev.style.removeProperty('font-family');
      }
      if(_pickerColor==='gradient'){
        prev.style.background='linear-gradient(135deg,#FF4500,#FFB800)';
        prev.style.webkitBackgroundClip='text';
        prev.style.webkitTextFillColor='transparent';
        prev.style.backgroundClip='text';
        prev.style.color='';
      } else {
        prev.style.background='';
        prev.style.webkitBackgroundClip='';
        prev.style.webkitTextFillColor='';
        prev.style.backgroundClip='';
        prev.style.color=_pickerColor||'var(--text)';
      }
    }

    function openEP(){
      /* Pre-llenar con datos actuales */
      var nameEl=document.getElementById('user-display-name');
      var unEl=document.getElementById('prof-username-display');
      var bioEl=document.getElementById('prof-bio-text');
      var epName=document.getElementById('ep-name');
      var epUn=document.getElementById('ep-username');
      var epBio=document.getElementById('ep-bio');
      var epAge=document.getElementById('ep-age');
      if(epName&&nameEl) epName.value=nameEl.textContent==='Sign in to get started'?'':nameEl.textContent;
      if(epUn&&unEl) epUn.value=unEl.textContent.replace('@','');
      if(epBio&&bioEl) epBio.value=bioEl.textContent;
      /* Cargar age desde API */
      fetch('/api/profile',{credentials:'include'}).then(function(r){return r.json();}).then(function(d){
        var epBirth=document.getElementById('ep-birth-date');
        if(epBirth&&d.birth_date) epBirth.value=d.birth_date;
        /* Poner max = hoy - 18 años */
        if(epBirth){ var maxD=new Date(); maxD.setFullYear(maxD.getFullYear()-13); epBirth.max=maxD.toISOString().split('T')[0]; }
        var apCb=document.getElementById('ep-age-public'); if(apCb) apCb.checked=!!d.age_public;
        var ecity=document.getElementById('ep-city'); if(ecity&&d.city) ecity.value=d.city;
        var ecountry=document.getElementById('ep-country'); if(ecountry&&d.country) ecountry.value=d.country;
        /* Cargar color y fuente guardados */
        _pickerColor=d.name_color||'';
        _pickerFont=d.name_font||'';
        /* Marcar activos */
        document.querySelectorAll('.ep-color-btn').forEach(function(b){
          b.classList.toggle('active',b.getAttribute('data-color')===_pickerColor);
        });
        document.querySelectorAll('.ep-font-btn').forEach(function(b){
          b.classList.toggle('active',b.getAttribute('data-font')===_pickerFont);
        });
        updateNamePreview();
      }).catch(function(){});
      ov.classList.add('open'); sh.classList.add('open'); document.body.style.overflow='hidden';
    }
    function closeEP(){ ov.classList.remove('open'); sh.classList.remove('open'); document.body.style.overflow=''; }
    document.getElementById('ep-close').addEventListener('click',closeEP);

    /* Color picker */
    document.getElementById('ep-colors').addEventListener('click',function(e){
      var btn=e.target.closest('.ep-color-btn'); if(!btn) return;
      document.querySelectorAll('.ep-color-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      _pickerColor=btn.getAttribute('data-color');
      updateNamePreview();
    });
    /* Font picker */
    document.getElementById('ep-fonts').addEventListener('click',function(e){
      var btn=e.target.closest('.ep-font-btn'); if(!btn) return;
      document.querySelectorAll('.ep-font-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      _pickerFont=btn.getAttribute('data-font');
      updateNamePreview();
    });
    /* Live preview mientras escribe */
    document.getElementById('ep-name').addEventListener('input',updateNamePreview);


    /* Botón Edit Profile en el perfil — lo crearemos dinámicamente */
    window._openEditProfile = openEP;

    /* Save */
    document.getElementById('ep-save').addEventListener('click', async function(){
      var btn=this; btn.disabled=true; btn.textContent='Saving...';
      var name=document.getElementById('ep-name').value.trim();
      var username=document.getElementById('ep-username').value.trim().replace(/[^a-zA-Z0-9_]/g,'').toLowerCase();
      var bio=document.getElementById('ep-bio').value.trim();
      var agePub=document.getElementById('ep-age-public').checked;

      try{
        var payload={};
        if(name) payload.display_name=name;
        if(username.length>=3) payload.username=username;
        if(bio!==undefined) payload.bio=bio;
        var birthVal=(document.getElementById('ep-birth-date')||{}).value||'';
        if(birthVal){
          payload.birth_date=birthVal;
          /* Calcular edad */
          var bd=new Date(birthVal); var today=new Date();
          var age=today.getFullYear()-bd.getFullYear();
          var m=today.getMonth()-bd.getMonth();
          if(m<0||(m===0&&today.getDate()<bd.getDate())) age--;
          if(age>=13&&age<120) payload.age=age;
        }
        payload.age_public=agePub;
        var cityVal=(document.getElementById('ep-city')||{}).value||'';
        var countryVal=(document.getElementById('ep-country')||{}).value||'';
        if(cityVal.trim()) payload.city=cityVal.trim();
        if(countryVal.trim()) payload.country=countryVal.trim();
        payload.name_color=_pickerColor;
        payload.name_font=_pickerFont;

        var r=await fetch('/api/profile',{method:'POST',credentials:'include',
          headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        var d=await r.json();

        if(d.error==='Username taken'){
          document.getElementById('ep-username').style.borderColor='#ff4444';
          document.getElementById('ep-username').placeholder='Already taken';
          document.getElementById('ep-username').value='';
          btn.disabled=false; btn.textContent='Save Profile'; return;
        }
        if(d.error && d.error!=='Nothing to update'){
          var t3=document.getElementById('toast');
          if(t3){t3.textContent=d.error;t3.classList.add('show');setTimeout(function(){t3.classList.remove('show');},3000);}
          btn.disabled=false; btn.textContent='Save Profile'; return;
        }

        /* Actualizar UI */
        if(name){
          var ne=document.getElementById('user-display-name');
          if(ne){
            ne.textContent=name;
            ne.style.fontSize='2.2rem';
            if(window.applyNameStyle) window.applyNameStyle(ne,_pickerColor,_pickerFont);
          }
          if(window.currentUser) window.currentUser.display_name=name;
          /* Actualizar nombre en comentarios y posts visibles en el DOM */
          var myUid=window.currentUser?window.currentUser.id:null;
          if(myUid){
            document.querySelectorAll('[data-profile-uid="'+myUid+'"]').forEach(function(el){
              /* Solo actualizar si es el nombre, no el avatar */
              if(el.tagName!=='IMG' && !el.querySelector('img')){
                el.textContent=name;
              }
            });
            /* Actualizar nombres en comentarios */
            document.querySelectorAll('.cp-username[data-profile-uid="'+myUid+'"]').forEach(function(el){
              el.textContent=name;
            });
            /* Actualizar nombres en thread posts */
            document.querySelectorAll('.comm-post-uname[data-profile-uid="'+myUid+'"]').forEach(function(el){
              el.textContent=name;
            });
          }
        }
        if(username.length>=3){
          var ue=document.getElementById('prof-username-display'); if(ue) ue.textContent='@'+username;
        }
        if(bio!==undefined){
          var bt=document.getElementById('prof-bio-text'); if(bt) bt.textContent=bio;
          /* Mostrar la bio area si tiene contenido */
          var ba=document.getElementById('prof-bio-area'); if(ba) ba.style.display='';
        }
        /* Mostrar/ocultar edad en perfil propio */
        var ageEl2=document.getElementById('prof-age-display');
        if(payload.age&&agePub){
          if(!ageEl2){
            ageEl2=document.createElement('div');
            ageEl2.id='prof-age-display';
            ageEl2.style.cssText='font-size:0.72rem;color:var(--text-muted);margin-top:0.2rem;text-align:center;';
            var baRef=document.getElementById('prof-bio-area');
            if(baRef) baRef.parentNode.insertBefore(ageEl2, baRef.nextSibling);
          }
          ageEl2.textContent=payload.age+' years old';
        } else if(ageEl2 && !agePub){
          ageEl2.textContent='';
        }
        /* Location */
        var locEl=document.getElementById('prof-location-display');
        var locStr=[cityVal,countryVal].filter(Boolean).join(', ');
        if(locStr){
          if(!locEl){
            locEl=document.createElement('div');
            locEl.id='prof-location-display';
            locEl.style.cssText='font-size:0.72rem;color:var(--text-muted);margin-top:0.2rem;text-align:center;';
            var baRef2=document.getElementById('prof-bio-area');
            if(baRef2) baRef2.parentNode.insertBefore(locEl, baRef2.nextSibling);
          }
          locEl.innerHTML='&#128205; '+locStr.replace(/&/g,'&amp;').replace(/</g,'&lt;');
        }
        /* Aplicar estilo al nombre en el perfil propio */
        applyNameStyle(document.getElementById('user-display-name'), _pickerColor, _pickerFont);
        closeEP();
        var toast=document.getElementById('toast');
        if(toast){toast.textContent='Profile updated!';toast.classList.add('show');setTimeout(function(){toast.classList.remove('show');},2500);}
      }catch(e){
        console.error('Profile save error:',e);
        var t2=document.getElementById('toast');
        if(t2){t2.textContent='Error saving. Try again.';t2.classList.add('show');setTimeout(function(){t2.classList.remove('show');},3000);}
      }
      btn.disabled=false; btn.textContent='Save Profile';
    });
  })();

  /* Conectar botón prof-name-edit-btn al nuevo sheet */
  var nameEditBtn = document.getElementById('prof-name-edit-btn');
  if(nameEditBtn) nameEditBtn.addEventListener('click', function(){ if(window._openEditProfile) window._openEditProfile(); });
  /* Compat — mantener refs vacías para que el código existente no explote */
  var usernameDisplay = document.getElementById('prof-username-display');
  var bioEditBtnEl    = document.getElementById('prof-bio-edit-btn');

  /* Activity */
  var rowLiked=document.getElementById('prof-row-liked');
  var rowComments=document.getElementById('prof-row-comments');
  if(rowLiked)    rowLiked.addEventListener('click',    function(){ if(typeof openActivityPanel==='function') openActivityPanel('likes'); });
  if(rowComments) rowComments.addEventListener('click', function(){ if(typeof openActivityPanel==='function') openActivityPanel('comments'); });

  /* Load profile */
  function loadProfilePage(){
    /* No correr si page-more no está visible */
    var pm=document.getElementById('page-more');
    if(pm && !pm.classList.contains('active')) return;
    /* Si auth aún no inicializó (HottAuth._session undefined) esperar */
    if(typeof HottAuth!=='undefined' && typeof HottAuth._session==='undefined'){
      setTimeout(loadProfilePage, 100); return;
    }
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
      var editProfBtn=document.getElementById('prof-name-edit-btn'); if(editProfBtn) editProfBtn.style.display='';
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
        if(d.display_name){
          var dnEl=document.getElementById('user-display-name');
          if(dnEl){
            dnEl.textContent=d.display_name;
            dnEl.style.fontSize='2.2rem';
            if(window.applyNameStyle){
              /* Aplicar color Y fuente de una vez — sans fonts.ready que falla en Android */
              window.applyNameStyle(dnEl, d.name_color||'', d.name_font||'');
              /* Reintentar fuente después de 600ms por si Google Fonts no cargó aún */
              if(d.name_font){
                setTimeout(function(){ window.applyNameStyle(dnEl, d.name_color||'', d.name_font||''); }, 600);
              }
            }
          }
          if(window.currentUser){
            window.currentUser.display_name=d.display_name;
            window.currentUser.name_color=d.name_color||'';
            window.currentUser.name_font=d.name_font||'';
          }
        }
        if(d.bio){
          var bt=document.getElementById('prof-bio-text'); if(bt) bt.textContent=d.bio;
          var ba2=document.getElementById('prof-bio-area'); if(ba2) ba2.style.display='';
        }
        /* Avatar guardado en D1 */
        if(d.avatar_url){
          var aw=document.getElementById('user-avatar-wrap');
          if(aw) aw.innerHTML='<img src="'+d.avatar_url+'" style="width:100%;height:100%;object-fit:cover;"><div class="prof-avatar-cam"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>';
        }
        /* Banner guardado en D1 */
        if(d.banner_url){
          var hero=document.getElementById('page-more')&&document.getElementById('page-more').querySelector('.prof-hero');
          if(hero){ var bImg=document.createElement('img'); bImg.src=d.banner_url; bImg.style.cssText='width:100%;height:100%;object-fit:cover;object-position:top;position:absolute;inset:0;'; hero.insertBefore(bImg,hero.firstChild); }
        }
        /* Edad */
        if(d.age && d.age_public){
          var ageEl=document.getElementById('prof-age-display');
          if(!ageEl){
            ageEl=document.createElement('div');
            ageEl.id='prof-age-display';
            ageEl.style.cssText='font-size:0.72rem;color:var(--text-muted);margin-top:0.2rem;text-align:center;';
            var bioArea3=document.getElementById('prof-bio-area');
            if(bioArea3) bioArea3.parentNode.insertBefore(ageEl, bioArea3.nextSibling);
          }
          ageEl.textContent=d.age+' years old';
        }
        /* Ubicación */
        var locStr2=[d.city,d.country].filter(Boolean).join(', ');
        if(locStr2){
          var locEl2=document.getElementById('prof-location-display');
          if(!locEl2){
            locEl2=document.createElement('div');
            locEl2.id='prof-location-display';
            locEl2.style.cssText='font-size:0.72rem;color:var(--text-muted);margin-top:0.2rem;text-align:center;';
            var bioArea4=document.getElementById('prof-bio-area');
            if(bioArea4) bioArea4.parentNode.insertBefore(locEl2, bioArea4.nextSibling);
          }
          locEl2.innerHTML='&#128205; '+locStr2.replace(/&/g,'&amp;').replace(/</g,'&lt;');
        }
      }).catch(function(){});
      if(adultToggle) adultToggle.checked=true;
      var pc=document.getElementById('posts-feed-container');
      if(pc && typeof window.loadPostsFeed==='function') window.loadPostsFeed(pc, user.id);
    } else {
      /* Solo mostrar signin si HottAuth ya confirmó que no hay sesión */
      var authDone = typeof HottAuth==='undefined' || HottAuth._session===null;
      if(!authDone){ setTimeout(loadProfilePage, 200); return; }
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

/* ── Photo Crop & Upload — CSS Transform approach (no canvas preview) ── */

  /* ── Crop Modal Styles ── */
  (function(){
    var s = document.createElement('style');
    s.textContent = [
      '#hw-crop-modal{position:fixed;inset:0;z-index:9999;background:#000;display:none;flex-direction:column;}',
      '#hw-crop-modal.open{display:flex;}',
      '#hw-crop-topbar{display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;flex-shrink:0;background:#000;}',
      '#hw-crop-topbar span{font-family:var(--font-d);font-size:0.85rem;letter-spacing:0.1em;color:#fff;}',
      '#hw-crop-cancel{background:none;border:1px solid #333;color:#aaa;border-radius:20px;padding:0.3rem 0.9rem;font-size:0.75rem;cursor:pointer;}',
      '#hw-crop-save{background:var(--fire-orange);border:none;color:#fff;border-radius:20px;padding:0.3rem 0.9rem;font-family:var(--font-d);font-size:0.75rem;letter-spacing:0.06em;cursor:pointer;}',
      '#hw-crop-viewport{flex:1;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#000;touch-action:none;}',
      '#hw-crop-img{position:absolute;transform-origin:center center;will-change:transform;user-select:none;-webkit-user-select:none;pointer-events:none;max-width:none;max-height:none;}',
      '#hw-crop-overlay{position:absolute;inset:0;pointer-events:none;}',
      /* Avatar: círculo recortador */
      '#hw-crop-modal.avatar #hw-crop-mask{position:absolute;inset:0;pointer-events:none;}',
      '#hw-crop-modal.avatar #hw-crop-mask::before{content:"";position:absolute;inset:0;background:rgba(0,0,0,0.55);-webkit-mask:radial-gradient(circle 42% at 50% 50%,transparent 99%,black 100%);mask:radial-gradient(circle 42% at 50% 50%,transparent 99%,black 100%);}',
      '#hw-crop-modal.avatar #hw-crop-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:84%;aspect-ratio:1/1;border:2px solid rgba(255,255,255,0.7);border-radius:50%;pointer-events:none;}',
      /* Banner: rectángulo recortador */
      '#hw-crop-modal.banner #hw-crop-mask{position:absolute;inset:0;pointer-events:none;}',
      '#hw-crop-modal.banner #hw-crop-mask::before{content:"";position:absolute;inset:0;background:rgba(0,0,0,0.55);-webkit-mask:polygon(0 0,100% 0,100% 100%,0 100%) exclude,polygon(4% 30%,96% 30%,96% 70%,4% 70%);}',
      '#hw-crop-modal.banner #hw-crop-ring{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:92%;height:40%;border:2px solid rgba(255,255,255,0.7);border-radius:8px;pointer-events:none;}',
    ].join('');
    document.head.appendChild(s);
  })();

  /* ── Crop Modal Logic ── */
  var _cropFile = null, _cropType = 'avatar', _cropResolve = null;
  var _imgNatW = 0, _imgNatH = 0;
  var _scale = 1, _minScale = 1;
  var _tx = 0, _ty = 0;
  var _vpW = 0, _vpH = 0;

  function _buildCropModal() {
    if (document.getElementById('hw-crop-modal')) return;
    var m = document.createElement('div');
    m.id = 'hw-crop-modal';
    m.innerHTML =
      '<div id="hw-crop-topbar">'
      + '<button id="hw-crop-cancel">Cancel</button>'
      + '<span id="hw-crop-label">CROP PHOTO</span>'
      + '<button id="hw-crop-save">Save</button>'
      + '</div>'
      + '<div id="hw-crop-viewport">'
      + '<img id="hw-crop-img" src="" alt="">'
      + '<div id="hw-crop-mask"><div id="hw-crop-ring"></div></div>'
      + '</div>';
    document.body.appendChild(m);

    document.getElementById('hw-crop-cancel').addEventListener('click', _closeCropModal);

    document.getElementById('hw-crop-save').addEventListener('click', function() {
      var btn = this; btn.disabled = true; btn.textContent = '...';
      _exportCrop(function(blob) {
        btn.disabled = false; btn.textContent = 'Save';
        if (!blob) return;
        var resolve = _cropResolve;
        _closeCropModal();
        if (resolve) resolve(blob);
      });
    });

    /* Touch handlers en el viewport */
    var vp = document.getElementById('hw-crop-viewport');
    var lastDist = 0, isDragging = false;
    var startTX = 0, startTY = 0, startPX = 0, startPY = 0;

    vp.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) {
        isDragging = true;
        startPX = e.touches[0].clientX;
        startPY = e.touches[0].clientY;
        startTX = _tx; startTY = _ty;
        lastDist = 0;
      } else if (e.touches.length === 2) {
        isDragging = false;
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDist = Math.sqrt(dx*dx + dy*dy);
      }
    }, {passive:true});

    vp.addEventListener('touchmove', function(e) {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging) {
        var dx = e.touches[0].clientX - startPX;
        var dy = e.touches[0].clientY - startPY;
        _tx = startTX + dx;
        _ty = startTY + dy;
        _clamp();
        _applyTransform();
      } else if (e.touches.length === 2) {
        var dx2 = e.touches[0].clientX - e.touches[1].clientX;
        var dy2 = e.touches[0].clientY - e.touches[1].clientY;
        var dist = Math.sqrt(dx2*dx2 + dy2*dy2);
        if (lastDist > 0) {
          var ratio = dist / lastDist;
          var newScale = Math.max(_minScale, Math.min(_scale * ratio, _minScale * 6));
          /* Zoom centrado en el punto medio de los dedos */
          var mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - _vpW / 2;
          var my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - _vpH / 2;
          _tx = mx - (mx - _tx) * (newScale / _scale);
          _ty = my - (my - _ty) * (newScale / _scale);
          _scale = newScale;
          _clamp();
          _applyTransform();
        }
        lastDist = dist;
      }
    }, {passive:false});

    vp.addEventListener('touchend', function(e) {
      if (e.touches.length < 2) lastDist = 0;
      if (e.touches.length === 0) isDragging = false;
    }, {passive:true});
  }

  function _applyTransform() {
    var img = document.getElementById('hw-crop-img');
    if (img) img.style.transform = 'translate(' + _tx + 'px,' + _ty + 'px) scale(' + _scale + ')';
  }

  function _clamp() {
    /* Límites: la imagen siempre debe cubrir el área de recorte */
    var scaledW = _imgNatW * _scale;
    var scaledH = _imgNatH * _scale;
    var cropW = _cropType === 'avatar' ? _vpW * 0.84 : _vpW * 0.92;
    var cropH = _cropType === 'avatar' ? _vpW * 0.84 : _vpH * 0.40;
    var maxTX = (scaledW - cropW) / 2;
    var maxTY = (scaledH - cropH) / 2;
    _tx = Math.max(-maxTX, Math.min(maxTX, _tx));
    _ty = Math.max(-maxTY, Math.min(maxTY, _ty));
  }

  function _openCropModal(file, type, resolve) {
    _buildCropModal();
    _cropFile = file; _cropType = type; _cropResolve = resolve;
    var modal = document.getElementById('hw-crop-modal');
    var imgEl  = document.getElementById('hw-crop-img');
    var vp     = document.getElementById('hw-crop-viewport');
    modal.className = type; /* avatar | banner */
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    /* Usar createObjectURL — no base64, más liviano */
    var objURL = URL.createObjectURL(file);
    imgEl.onload = function() {
      URL.revokeObjectURL(objURL);
      _imgNatW = imgEl.naturalWidth;
      _imgNatH = imgEl.naturalHeight;
      var vpr = vp.getBoundingClientRect();
      _vpW = vpr.width; _vpH = vpr.height;
      /* Escala mínima: imagen cubre el área de recorte */
      var cropW = type === 'avatar' ? _vpW * 0.84 : _vpW * 0.92;
      var cropH = type === 'avatar' ? _vpW * 0.84 : _vpH * 0.40;
      _minScale = Math.max(cropW / _imgNatW, cropH / _imgNatH);
      _scale = _minScale;
      /* Centrar */
      _tx = 0; _ty = 0;
      /* Tamaño base del img element = naturalSize (scale se aplica via transform) */
      imgEl.style.width  = _imgNatW + 'px';
      imgEl.style.height = _imgNatH + 'px';
      _applyTransform();
    };
    imgEl.src = objURL;
  }
  window._openCropModal = _openCropModal;

  function _closeCropModal() {
    var modal = document.getElementById('hw-crop-modal');
    if (modal) { modal.classList.remove('open'); modal.className = ''; }
    document.body.style.overflow = '';
    _cropResolve = null;
    var imgEl = document.getElementById('hw-crop-img');
    if (imgEl) { imgEl.src = ''; imgEl.style.width = ''; imgEl.style.height = ''; }
  }

  function _exportCrop(cb) {
    if (!_cropFile) { cb(null); return; }
    var vp = document.getElementById('hw-crop-viewport');
    var imgEl = document.getElementById('hw-crop-img');
    if (!vp || !imgEl) { cb(null); return; }

    /* Resolución más pequeña — Android no aguanta 1200x800 en WebP */
    var outW = _cropType === 'avatar' ? 400 : 800;
    var outH = _cropType === 'avatar' ? 400 : 534; /* 3:2 ratio */

    var vpRect  = vp.getBoundingClientRect();
    var imgRect = imgEl.getBoundingClientRect();

    var cropW = _cropType === 'avatar' ? vpRect.width * 0.84 : vpRect.width * 0.92;
    var cropH = _cropType === 'avatar' ? vpRect.width * 0.84 : vpRect.height * 0.40;
    var cropOffX = (vpRect.left + (vpRect.width  - cropW) / 2) - imgRect.left;
    var cropOffY = (vpRect.top  + (vpRect.height - cropH) / 2) - imgRect.top;
    var rx = _imgNatW / imgRect.width;
    var ry = _imgNatH / imgRect.height;
    var srcX = Math.max(0, cropOffX * rx);
    var srcY = Math.max(0, cropOffY * ry);
    var srcW = Math.min(Math.max(cropW * rx, 1), _imgNatW - srcX);
    var srcH = Math.min(Math.max(cropH * ry, 1), _imgNatH - srcY);

    var freshURL = URL.createObjectURL(_cropFile);
    var freshImg = new Image();
    freshImg.onerror = function() { URL.revokeObjectURL(freshURL); cb(null); };
    freshImg.onload = function() {
      URL.revokeObjectURL(freshURL);
      var canvas = document.createElement('canvas');
      canvas.width = outW; canvas.height = outH;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(freshImg, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

      /* Intento 1: WebP */
      canvas.toBlob(function(blob) {
        if (blob && blob.size > 500) { cb(blob); return; }
        /* Intento 2: JPEG (más compatible en Android) */
        canvas.toBlob(function(b2) {
          if (b2 && b2.size > 500) { cb(b2); return; }
          /* Intento 3: drawImage con cover y JPEG */
          var c3 = document.createElement('canvas');
          c3.width = outW; c3.height = outH;
          var ctx3 = c3.getContext('2d');
          var s3 = Math.max(outW / freshImg.naturalWidth, outH / freshImg.naturalHeight);
          var dw3 = freshImg.naturalWidth * s3, dh3 = freshImg.naturalHeight * s3;
          ctx3.drawImage(freshImg, (outW - dw3) / 2, (outH - dh3) / 2, dw3, dh3);
          c3.toBlob(function(b3) { cb(b3 && b3.size > 500 ? b3 : null); }, 'image/jpeg', 0.92);
        }, 'image/jpeg', 0.92);
      }, 'image/webp', 0.88);
    };
    freshImg.src = freshURL;
  }

    /* ── Upload & Save ── */
  async function uploadAndSavePhoto(blob, type) {
    var upRes = await fetch('/api/upload', {method:'PUT', credentials:'include',
      headers:{'Content-Type':'image/webp'}, body:blob});
    var upData = await upRes.json();
    if (!upData.ok) return;
    var cdnUrl = upData.url;
    var payload = {};
    payload[type==='banner' ? 'banner_url' : 'avatar_url'] = cdnUrl;
    await fetch('/api/profile', {method:'POST', credentials:'include',
      headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    if (type === 'banner') {
      var pg = document.getElementById('page-more');
      var hero = pg && pg.querySelector('.prof-hero');
      if (hero) {
        var ex = hero.querySelector('img.prof-banner-img');
        if (ex) { ex.src = cdnUrl; }
        else {
          var ni = document.createElement('img');
          ni.className = 'prof-banner-img';
          ni.src = cdnUrl;
          ni.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:top;position:absolute;inset:0;z-index:0;';
          hero.insertBefore(ni, hero.firstChild);
        }
      }
    } else {
      var aw = document.getElementById('user-avatar-wrap');
      if (aw) aw.innerHTML = '<img src="'+cdnUrl+'" style="width:100%;height:100%;object-fit:cover;">'
        + '<div class="prof-avatar-cam"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>';
      if (window.currentUser) window.currentUser.picture = cdnUrl;
      var myUid = window.currentUser ? window.currentUser.id : null;
      if (myUid) {
        document.querySelectorAll('[data-profile-uid="'+myUid+'"]').forEach(function(el2) {
          var img2 = el2.tagName==='IMG' ? el2 : el2.querySelector('img');
          if (img2) { img2.src = cdnUrl; }
        });
        document.querySelectorAll('img[data-uid="'+myUid+'"]').forEach(function(img3) {
          img3.src = cdnUrl;
        });
      }
    }
    var t3 = document.getElementById('toast');
    if (t3) { t3.textContent='Photo updated!'; t3.classList.add('show'); setTimeout(function(){ t3.classList.remove('show'); }, 2500); }
  }

  function setupImageUpload(triggerEl, type) {
    if (!triggerEl) return;
    var inp = document.createElement('input');
    inp.type='file'; inp.accept='image/*'; inp.style.display='none';
    document.body.appendChild(inp);
    triggerEl.addEventListener('click', function(e){ e.stopPropagation(); inp.click(); });
    inp.addEventListener('change', function(e) {
      var file = e.target.files[0]; if (!file) return;
      e.target.value = '';
      /* Abrir crop modal — al guardar sube a Bunny */
      _openCropModal(file, type, function(blob) {
        var t3 = document.getElementById('toast');
        if (t3) { t3.textContent='Uploading...'; t3.classList.add('show'); }
        uploadAndSavePhoto(blob, type);
      });
    });
  }

  var pg2 = document.getElementById('page-more');
  setupImageUpload(pg2 && pg2.querySelector('.prof-hero'), 'banner');
  setupImageUpload(document.getElementById('user-avatar-wrap'), 'avatar');

  document.querySelectorAll('.nav-item[data-page="more"]').forEach(function(btn){
    btn.addEventListener('click', function(){
      /* Pequeño delay para que currentUser esté listo antes de renderizar */
      setTimeout(loadProfilePage, 50);
    });
  });
  if(typeof HottAuth!=='undefined'){
    HottAuth.onChange(function(){
      if(document.getElementById('page-more')&&document.getElementById('page-more').classList.contains('active'))
        loadProfilePage();
    });
  }
  window.loadProfilePage = loadProfilePage;

  /* Aplicar estilo personalizado de nombre a todos los elementos visibles */
  window.refreshNameStyles = function(){
    var u = window.currentUser;
    if(!u||(!u.name_color&&!u.name_font)) return;
    document.querySelectorAll(
      '[data-profile-uid="'+u.id+'"]'
    ).forEach(function(el){
      /* Solo los que son texto, no avatares */
      if(el.tagName==='IMG') return;
      if(el.querySelector('img')) return;
      if(window.applyNameStyle) window.applyNameStyle(el, u.name_color||'', u.name_font||'');
    });
  };

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
    '.conf-mic-btn{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text-dim);border-radius:12px;padding:0.65rem;font-family:var(--font-b);font-size:0.8rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.4rem;margin-bottom:0.6rem;transition:border-color 0.15s,color 0.15s;}'
    + '.conf-mic-btn.recording{border-color:#ff4444;color:#ff4444;}'
    + '.conf-submit-btn:disabled{opacity:0.5;}',
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
        + (cf.audio_url ? '<div class="hw-audio-player" data-src="'+cf.audio_url+'" style="margin:0.4rem 0;">' + '<button class="hw-audio-play" onclick="event.stopPropagation();window._hwAudioPlay(this)"><svg class="hw-play-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg><svg class="hw-pause-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></button>' + '<div class="hw-audio-bar"><div class="hw-audio-progress"><div class="hw-audio-fill"></div></div><span class="hw-audio-time">0:00</span></div>' + '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted);flex-shrink:0;"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>' + '</div>' : '')
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
    + '<button class="conf-mic-btn" id="conf-mic-btn"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> Add Voice Note</button>'
    + '<div id="conf-audio-preview" style="display:none;margin-bottom:0.75rem;"></div>'
    + '<button class="conf-submit-btn" id="conf-submit-btn">Submit Story</button>'
    + '<div class="conf-anon-note">&#128274; Your identity is never stored</div>';
  document.body.appendChild(panel);

  var shareBtn  = document.getElementById('conf-share-btn');
  var submitBtn = document.getElementById('conf-submit-btn');
  var textarea  = document.getElementById('conf-textarea');
  var catSel    = document.getElementById('conf-cat');

  /* ── Voice recording for stories ── */
  var confMicBtn = document.getElementById('conf-mic-btn');
  var confAudioPreview = document.getElementById('conf-audio-preview');
  var confMediaRecorder = null;
  var confAudioChunks = [];
  var confPendingAudio = null;
  var confRecording = false;

  if (confMicBtn) {
    confMicBtn.addEventListener('click', async function() {
      if (confRecording) {
        confMediaRecorder.stop();
        return;
      }
      try {
        var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        var mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/ogg';
        confMediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
        confAudioChunks = [];
        confMediaRecorder.ondataavailable = function(e) { if (e.data.size > 0) confAudioChunks.push(e.data); };
        confMediaRecorder.onstop = function() {
          stream.getTracks().forEach(function(t) { t.stop(); });
          var blob = new Blob(confAudioChunks, { type: mimeType });
          confPendingAudio = { blob: blob, type: mimeType };
          var url = URL.createObjectURL(blob);
          confAudioPreview.style.display = 'block';
          confAudioPreview.innerHTML = '<div class="hw-audio-player" style="margin:0;">'
            + '<button class="hw-audio-play" onclick="window._hwAudioPlay(this)"><svg class="hw-play-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg><svg class="hw-pause-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></button>'
            + '<div class="hw-audio-bar"><div class="hw-audio-progress"><div class="hw-audio-fill"></div></div><span class="hw-audio-time">0:00</span></div>'
            + '</div>'
            + '<button style="background:none;border:none;color:var(--text-muted);font-size:0.7rem;cursor:pointer;margin-top:0.25rem;" id="conf-audio-remove">&#10005; Remove voice note</button>';
          /* Attach audio src */
          confAudioPreview.querySelector('.hw-audio-player').setAttribute('data-src', url);
          document.getElementById('conf-audio-remove').onclick = function() {
            confPendingAudio = null;
            confAudioPreview.style.display = 'none';
            confAudioPreview.innerHTML = '';
          };
          confRecording = false;
          confMicBtn.classList.remove('recording');
          confMicBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> Add Voice Note';
        };
        confMediaRecorder.start();
        confRecording = true;
        confMicBtn.classList.add('recording');
        confMicBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Stop Recording';
      } catch(err) {
        alert('Microphone access denied.');
      }
    });
  }

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
    if (!text && !confPendingAudio) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    try {
      var audioUrl = '';
      if (confPendingAudio) {
        try {
          var auRes = await fetch('/api/upload', { method: 'PUT', credentials: 'include',
            headers: { 'Content-Type': confPendingAudio.type }, body: confPendingAudio.blob });
          var auData = await auRes.json();
          if (auData.ok) audioUrl = auData.url;
        } catch(e) {}
      }
      var r = await fetch('/api/confessions', {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ action:'submit', body: text || ' ',
          title: document.getElementById('conf-title') ? document.getElementById('conf-title').value.trim() : '',
          category: catSel ? catSel.value : 'confession',
          audio_url: audioUrl })
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
    '.posts-sheet-title{font-family:var(--font-d);font-size:1.1rem;letter-spacing:0.1em;margin-bottom:0.75rem;color:#fff;}',
    '.posts-sheet-ta{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:12px;padding:0.75rem;font-size:0.87rem;font-family:var(--font-b);resize:none;height:100px;outline:none;line-height:1.5;box-sizing:border-box;margin-bottom:0.5rem;}',
    '.posts-sheet-ta:focus{border-color:var(--fire-orange);}',
    '.posts-sheet-footer{display:flex;align-items:center;justify-content:space-between;}',
    '.posts-sheet-rules{font-size:0.6rem;color:var(--text-muted);flex:1;padding-right:0.75rem;line-height:1.35;}',
    '.posts-sheet-send{background:var(--fire-orange);color:#fff;border:none;border-radius:20px;padding:0.5rem 1.25rem;font-family:var(--font-d);font-size:0.8rem;letter-spacing:0.06em;cursor:pointer;}',
    '.posts-sheet-send:disabled{opacity:0.5;}',
    '.posts-signin-note{text-align:center;padding:1rem;color:var(--text-dim);font-size:0.82rem;}',
    '.posts-sheet-toolbar{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem;}',
    '.posts-photo-btn{background:none;border:1px solid var(--border);color:var(--text-dim);border-radius:20px;padding:0.3rem 0.75rem;font-size:0.72rem;font-family:var(--font-b);cursor:pointer;display:flex;align-items:center;gap:0.35rem;transition:border-color 0.2s;}',
    '.posts-photo-btn svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '.posts-photo-btn:active{border-color:var(--fire-orange);color:var(--fire-orange);}',
    '.posts-img-preview{width:100%;max-height:200px;object-fit:cover;border-radius:10px;margin-bottom:0.5rem;display:block;}',
    '.posts-img-remove{background:rgba(0,0,0,0.5);border:none;color:#fff;border-radius:50%;width:24px;height:24px;font-size:0.8rem;cursor:pointer;position:absolute;top:0.4rem;right:0.4rem;display:flex;align-items:center;justify-content:center;}',
    '.posts-img-wrap{position:relative;margin-bottom:0.5rem;}',
    /* Multi-media grid preview */
    '.pm-grid{display:grid;gap:3px;border-radius:12px;overflow:hidden;margin-bottom:0.6rem;}',
    '.pm-grid-1{grid-template-columns:1fr;}',
    '.pm-grid-2{grid-template-columns:1fr 1fr;}',
    '.pm-grid-3{grid-template-columns:1fr 1fr;}',
    '.pm-cell{position:relative;aspect-ratio:1;overflow:hidden;background:var(--surface-3);}',
    '.pm-cell-full{aspect-ratio:unset;}',
    '.pm-cell img,.pm-cell video{width:100%;height:100%;object-fit:cover;display:block;}',
    '.pm-cell-full img,.pm-cell-full video{height:auto;max-height:280px;object-fit:contain;}',
    '.pm-rm{position:absolute;top:0.3rem;right:0.3rem;background:rgba(0,0,0,0.65);border:none;color:#fff;border-radius:50%;width:22px;height:22px;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;}',
    '.pm-count{position:absolute;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:1.4rem;color:#fff;}',
    '.pm-add-btn{background:none;border:1px dashed var(--border);color:var(--text-dim);border-radius:10px;padding:0.3rem 0.75rem;font-size:0.72rem;font-family:var(--font-b);cursor:pointer;display:flex;align-items:center;gap:0.35rem;}',
    '.pm-add-btn:active{border-color:var(--fire-orange);color:var(--fire-orange);}',
    '.pm-counter{font-size:0.65rem;color:var(--text-muted);margin-left:0.25rem;}',

    /* Post card */
    /* Post card — Tumblr style */
    '#posts-feed-container{background:#080505;padding:0;}',
    '.post-card{background:#1a1a1a;margin-bottom:12px;overflow:hidden;}',
    /* Header */
    '.pc-header{display:flex;align-items:center;gap:0.6rem;padding:0.75rem 0.85rem 0.5rem;}',
    '.pc-av{width:38px;height:38px;border-radius:50%;background:var(--surface-3);flex-shrink:0;overflow:hidden;}',
    '.pc-av img{width:100%;height:100%;object-fit:cover;display:block;}',
    '.pc-meta{flex:1;min-width:0;}',
    '.pc-name{font-family:var(--font-d);font-size:0.9rem;letter-spacing:0.04em;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.pc-date{font-size:0.62rem;color:var(--text-muted);margin-top:0.05rem;}',
    '.pc-menu-btn{background:none;border:none;color:var(--text-dim);font-size:1.2rem;cursor:pointer;padding:0.25rem 0.4rem;line-height:1;margin-left:auto;}',
    /* Media */
    '.pc-media-wrap{width:100%;cursor:pointer;}',
    '.pc-media-single{width:100%;display:block;object-fit:contain;}',
    '.pc-media-single video{width:100%;display:block;}',
    '.pc-media-2col{display:grid;grid-template-columns:1fr 1fr;gap:2px;}',
    '.pc-media-cell{overflow:hidden;position:relative;cursor:pointer;}',
    '.pc-media-cell img{width:100%;height:100%;object-fit:cover;display:block;}',
    '.pc-media-cell video{width:100%;height:100%;object-fit:cover;display:block;}',
    '.pc-media-2col .pc-media-cell{aspect-ratio:1;}',
    '.pc-media-full{aspect-ratio:unset;}',
    '.pc-media-full img{height:auto;}',
    '.pc-media-more{position:absolute;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:1.5rem;color:#fff;}',
    /* Tags */
    '.pc-tags{padding:0.55rem 0.85rem 0.3rem;font-size:0.78rem;color:var(--text-dim);line-height:1.5;word-break:break-word;}',
    '.pc-tag{color:var(--fire-orange);opacity:0.8;}',
    '.pc-more-btn{background:none;border:none;color:var(--text-muted);font-size:0.75rem;cursor:pointer;padding:0;margin-left:0.3rem;font-family:var(--font-b);}',
    /* Actions */
    '.pc-actions{display:flex;align-items:center;padding:0.5rem 0.6rem 0.8rem;gap:0.25rem;margin-top:0.25rem;}',
    '.pc-act-btn{background:none;border:none;color:#999999 !important;cursor:pointer;display:flex;align-items:center;gap:0.35rem;padding:0.45rem 0.65rem;border-radius:8px;font-family:var(--font-b);font-size:0.78rem;transition:color 0.15s;}',
    '.pc-act-btn:active{color:var(--text);}',
    '.pc-act-btn.liked svg,.pc-act-btn.post-like-btn.liked svg{fill:var(--fire-orange);stroke:var(--fire-orange);}',
    '.pc-act-btn svg{fill:none;stroke:currentColor;}',
    '.post-like-btn svg{fill:none;stroke:currentColor;}',
    '.post-like-btn.liked svg{fill:var(--fire-orange);stroke:var(--fire-orange);}',
    '.pc-act-count{font-size:0.75rem;}',
    '.pc-share-btn{margin-left:auto;}',
    '.post-report-btn{background:none;border:none;color:var(--text-muted);font-size:0.68rem;cursor:pointer;padding:0.2rem 0.5rem;border-radius:8px;font-family:var(--font-b);transition:color 0.2s;}',
    '.post-report-btn:active{color:#cc4444;}',
    '.post-report-btn.reported{color:#cc4444;pointer-events:none;}',
    /* Report category sheet */
    '.rep-sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:350;opacity:0;pointer-events:none;transition:opacity 0.22s;}',
    '.rep-sheet-overlay.open{opacity:1;pointer-events:all;}',
    '.rep-sheet{position:fixed;left:0;right:0;bottom:0;max-width:480px;margin:0 auto;background:var(--surface);border-radius:20px 20px 0 0;border-top:1px solid var(--border);z-index:351;padding:0.5rem 1rem calc(1.5rem + env(safe-area-inset-bottom,0px));transform:translateY(100%);transition:transform 0.32s cubic-bezier(0.16,1,0.3,1);}',
    '.rep-sheet.open{transform:translateY(0);}',
    '.rep-sheet-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 0.85rem;}',
    '.rep-sheet-title{font-family:var(--font-d);font-size:0.9rem;letter-spacing:0.08em;margin-bottom:0.75rem;color:var(--text);}',
    '.rep-cat-btn{display:flex;align-items:center;gap:0.75rem;width:100%;background:none;border:none;border-bottom:1px solid var(--border);padding:0.8rem 0;cursor:pointer;text-align:left;}',
    '.rep-cat-btn:last-child{border-bottom:none;}',
    '.rep-cat-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;}',
    '.rep-cat-underage .rep-cat-icon{background:rgba(204,0,0,0.15);}',
    '.rep-cat-copyright .rep-cat-icon{background:rgba(255,69,0,0.12);}',
    '.rep-cat-spam .rep-cat-icon{background:rgba(255,184,0,0.12);}',
    '.rep-cat-hate .rep-cat-icon{background:rgba(108,143,255,0.12);}',
    '.rep-cat-other .rep-cat-icon{background:var(--surface-3);}',
    '.rep-cat-label{flex:1;}',
    '.rep-cat-name{font-size:0.85rem;color:var(--text);display:block;margin-bottom:0.1rem;}',
    '.rep-cat-desc{font-size:0.68rem;color:var(--text-dim);}',
    '.rep-cat-underage .rep-cat-name{color:#ff4444;}',
    '.post-comment-btn{display:inline-flex;align-items:center;gap:0.3rem;background:none;border:none;color:var(--text-dim);font-size:0.72rem;cursor:pointer;padding:0.2rem 0.5rem;border-radius:8px;font-family:var(--font-b);}',
    '.post-comment-btn svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '.post-comment-btn:active{color:var(--text);}',
    '.post-like-btn{display:inline-flex;align-items:center;gap:0.3rem;background:none;border:none;color:var(--text-dim);font-size:0.72rem;cursor:pointer;padding:0.2rem 0.5rem;border-radius:8px;font-family:var(--font-b);transition:color 0.2s;}',
    '.post-like-btn svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:fill 0.15s,stroke 0.15s;}',
    '.post-like-btn.liked{color:#ff3b5c;}',
    '.post-like-btn.liked svg{fill:#ff3b5c;stroke:#ff3b5c;}',
    /* Post media viewer */
    '.pmv{position:fixed;inset:0;z-index:600;background:#000;display:none;flex-direction:column;align-items:center;justify-content:center;}',
    '.pmv.open{display:flex;}',
    '.pmv-close{position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,0.12);border:none;color:#fff;width:38px;height:38px;border-radius:50%;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;}',
    '.pmv-img{max-width:100%;max-height:100vh;object-fit:contain;display:block;touch-action:pinch-zoom;}',
    '.pmv-video{max-width:100%;max-height:100vh;display:block;}',
    /* Admin post actions */
    '.post-admin-actions{display:flex;gap:0.4rem;margin-top:0.5rem;}',
    '.post-admin-btn{font-size:0.68rem;border:none;border-radius:8px;padding:0.25rem 0.6rem;cursor:pointer;font-family:var(--font-b);}',
    '.post-hide-btn{background:#3a1a1a;color:#cc4444;}',
    '.post-ban-btn{background:#2a0a0a;color:#ff4444;}',
    '.posts-empty{padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;}'      +'.post-admin-bar{margin-top:0.4rem;}'      +'.adm-del-btn{background:#3a0a0a;color:#ff5555;border:1px solid #6a1a1a;border-radius:8px;padding:0.2rem 0.55rem;font-size:0.68rem;cursor:pointer;font-family:var(--font-b);letter-spacing:0.03em;transition:background 0.15s;}'      +'.adm-del-btn:hover{background:#6a1010;}'      +'.adm-del-comment{position:absolute;top:0.4rem;right:0.4rem;padding:0.15rem 0.4rem;font-size:0.6rem;}'      +'.cp-item{position:relative;}'
    /* Repost embed */
    +'.pc-repost-header{display:flex;align-items:center;gap:0.45rem;padding:0.5rem 0.85rem 0.2rem;font-size:0.7rem;color:var(--text-muted);}'
    +'.pc-repost-icon{display:flex;align-items:center;}'
    +'.pc-repost-embed{margin:0 0.65rem 0.6rem;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface-2);}'
    +'.pc-repost-embed-header{display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem 0.3rem;}'
    +'.pc-repost-av{width:28px;height:28px;border-radius:50%;background:var(--surface-3);overflow:hidden;flex-shrink:0;}'
    +'.pc-repost-av img{width:100%;height:100%;object-fit:cover;display:block;}'
    +'.pc-repost-name{font-family:var(--font-d);font-size:0.78rem;color:var(--text);letter-spacing:0.03em;}'
    +'.pc-repost-body{padding:0.1rem 0.75rem 0.5rem;font-size:0.78rem;color:var(--text-dim);line-height:1.45;}'
    +'.pc-repost-media img{width:100%;display:block;max-height:280px;object-fit:cover;}'
    +'.pc-repost-media video{width:100%;display:block;max-height:280px;object-fit:cover;}'
    /* Post menu sheet */
    +'.pmenu-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:360;opacity:0;pointer-events:none;transition:opacity 0.22s;}'
    +'.pmenu-overlay.open{opacity:1;pointer-events:all;}'
    +'.pmenu-sheet{position:fixed;left:0;right:0;bottom:0;max-width:480px;margin:0 auto;background:var(--surface);border-radius:20px 20px 0 0;z-index:361;padding:0.5rem 0 calc(1.5rem + env(safe-area-inset-bottom,0px));transform:translateY(100%);transition:transform 0.32s cubic-bezier(0.16,1,0.3,1);}'
    +'.pmenu-sheet.open{transform:translateY(0);}'
    +'.pmenu-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 0.75rem;}'
    +'.pmenu-item{display:flex;align-items:center;gap:0.85rem;padding:0.85rem 1.25rem;cursor:pointer;border-bottom:1px solid var(--border);font-size:0.88rem;color:var(--text);font-family:var(--font-b);}'
    +'.pmenu-item:last-child{border-bottom:none;}'
    +'.pmenu-item:active{background:var(--surface-2);}'
    +'.pmenu-item-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;}'
    /* Repost sheet */
    +'.rp-sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:370;opacity:0;pointer-events:none;transition:opacity 0.22s;}'
    +'.rp-sheet-overlay.open{opacity:1;pointer-events:all;}'
    +'.rp-sheet{position:fixed;left:0;right:0;bottom:0;max-width:480px;margin:0 auto;background:var(--surface);border-radius:20px 20px 0 0;z-index:371;padding:1rem 1.1rem calc(1.5rem + env(safe-area-inset-bottom,0px));transform:translateY(100%);transition:transform 0.32s cubic-bezier(0.16,1,0.3,1);}'
    +'.rp-sheet.open{transform:translateY(0);}'
    +'.rp-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 0.85rem;}'
    +'.rp-title{font-family:var(--font-d);font-size:1rem;letter-spacing:0.08em;margin-bottom:0.75rem;color:#fff;}'
    +'.rp-caption{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:12px;padding:0.65rem 0.85rem;font-size:0.85rem;font-family:var(--font-b);resize:none;height:80px;outline:none;line-height:1.5;box-sizing:border-box;margin-bottom:0.75rem;}'
    +'.rp-caption:focus{border-color:var(--fire-orange);}'
    +'.rp-preview{border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface-2);margin-bottom:0.85rem;}'
    +'.rp-preview-header{display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem 0.3rem;}'
    +'.rp-preview-av{width:26px;height:26px;border-radius:50%;background:var(--surface-3);overflow:hidden;flex-shrink:0;}'
    +'.rp-preview-av img{width:100%;height:100%;object-fit:cover;}'
    +'.rp-preview-name{font-family:var(--font-d);font-size:0.75rem;color:var(--text);}'
    +'.rp-preview-body{padding:0.1rem 0.75rem 0.5rem;font-size:0.75rem;color:var(--text-dim);}'
    +'.rp-preview-media img{width:100%;display:block;max-height:160px;object-fit:cover;}'
    +'.rp-footer{display:flex;gap:0.6rem;}'
    +'.rp-btn{flex:1;border:none;border-radius:20px;padding:0.55rem;font-family:var(--font-d);font-size:0.82rem;letter-spacing:0.06em;cursor:pointer;}'
    +'.rp-btn-quick{background:var(--surface-3);color:var(--text-dim);}'
    +'.rp-btn-send{background:var(--fire-orange);color:#fff;}'
    +'.rp-btn:disabled{opacity:0.5;}'
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

  /* ── Report sheet ── */
  var repOverlay = document.createElement('div'); repOverlay.className='rep-sheet-overlay'; repOverlay.id='rep-sheet-overlay';
  var repSheet   = document.createElement('div'); repSheet.className='rep-sheet'; repSheet.id='rep-sheet';
  repSheet.innerHTML =
    '<div class="rep-sheet-handle"></div>'
    + '<div class="rep-sheet-title">Report Content</div>'
    + '<button class="rep-cat-btn rep-cat-underage" data-rep-cat="underage">'
      + '<div class="rep-cat-icon">&#128683;</div>'
      + '<div class="rep-cat-label">'
        + '<span class="rep-cat-name">&#9888; Underage Content</span>'
        + '<span class="rep-cat-desc">Content that may depict minors — removed immediately</span>'
      + '</div></button>'
    + '<button class="rep-cat-btn rep-cat-copyright" data-rep-cat="copyright">'
      + '<div class="rep-cat-icon">&#169;</div>'
      + '<div class="rep-cat-label">'
        + '<span class="rep-cat-name">Copyright / DMCA</span>'
        + '<span class="rep-cat-desc">This content belongs to me or someone else</span>'
      + '</div></button>'
    + '<button class="rep-cat-btn rep-cat-spam" data-rep-cat="spam">'
      + '<div class="rep-cat-icon">&#128231;</div>'
      + '<div class="rep-cat-label">'
        + '<span class="rep-cat-name">Spam or Links</span>'
        + '<span class="rep-cat-desc">Unwanted advertising or external links</span>'
      + '</div></button>'
    + '<button class="rep-cat-btn rep-cat-hate" data-rep-cat="hate">'
      + '<div class="rep-cat-icon">&#128308;</div>'
      + '<div class="rep-cat-label">'
        + '<span class="rep-cat-name">Hate Speech</span>'
        + '<span class="rep-cat-desc">Harassment, discrimination or threats</span>'
      + '</div></button>'
    + '<button class="rep-cat-btn rep-cat-other" data-rep-cat="other">'
      + '<div class="rep-cat-icon">&#8943;</div>'
      + '<div class="rep-cat-label">'
        + '<span class="rep-cat-name">Other</span>'
        + '<span class="rep-cat-desc">Something else that violates the rules</span>'
      + '</div></button>';
  document.body.appendChild(repOverlay);
  document.body.appendChild(repSheet);

  var currentReportPostId = null;

  function openReportSheet(postId) {
    currentReportPostId = postId;
    repOverlay.classList.add('open'); repSheet.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  window.openReportSheet = openReportSheet;
  function closeReportSheet() {
    repOverlay.classList.remove('open'); repSheet.classList.remove('open');
    document.body.style.overflow = '';
    currentReportPostId = null;
  }
  window.closeReportSheet = closeReportSheet;
  repOverlay.addEventListener('click', closeReportSheet);
  var repSY=0;
  repSheet.addEventListener('touchstart',function(e){repSY=e.touches[0].clientY;},{passive:true});
  repSheet.addEventListener('touchend',function(e){if(e.changedTouches[0].clientY-repSY>50)closeReportSheet();},{passive:true});

  var LIKED_POSTS = new Set();
  try { LIKED_POSTS = new Set(JSON.parse(localStorage.getItem('hw_post_likes')||'[]')); } catch(e){}
  function saveLikedPosts() {
    try { localStorage.setItem('hw_post_likes', JSON.stringify([...LIKED_POSTS])); } catch(e){}
  }

  /* ── Lazy GIF: muestra primer frame inmediatamente, anima al cargar ── */
  function _activateLazyGifs(container) {
    if (!container) return;
    container.querySelectorAll('img[data-lazygif]').forEach(function(img) {
      var src = img.getAttribute('data-lazygif');
      if (!src) return;
      /* Cargar GIF completo en background */
      var loader = new Image();
      loader.onload = function() {
        img.src = src;
        img.removeAttribute('data-lazygif');
      };
      loader.src = src;
      /* Mientras carga: mostrar el primer frame via src con ?_ trick no funciona en todos
         los navegadores — en su lugar cargamos directo y el browser muestra el primer frame
         antes de que el GIF empiece a animar en muchos casos. Para Android Chrome
         lo mejor es src directo con loading=eager para que empiece cuanto antes. */
      img.src = src;
      img.removeAttribute('data-lazygif');
    });
  }

  function renderPost(p) {
    var isAdmin = document.body.classList.contains('is-admin');
    var isOwn   = window.currentUser && window.currentUser.id === p.user_id;
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

  window.loadPostsFeed = async function(container, userId) {
    if (!container) return;
    container.innerHTML = '<div class="posts-empty">Loading...</div>';
    try {
      var url = userId ? '/api/posts?user_id=' + encodeURIComponent(userId) : '/api/posts';
      var r = await fetch(url);
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
        _activateLazyGifs(container);
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
          + '<div id="posts-img-wrap-area"></div>'
          + '<div class="posts-sheet-toolbar">'
            + '<button class="posts-photo-btn" id="posts-photo-btn">'
              + '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
              + 'Photo / Video / GIF</button>'
            + '<span class="pm-counter" id="pm-counter"></span>'
            + '<input type="file" id="posts-file-input" accept="image/*,video/mp4,video/webm,.gif" multiple style="display:none">'
          + '</div>'
          + '<div class="posts-sheet-footer">'
            + '<div class="posts-sheet-rules">Max 10 archivos &bull; No links &bull; No odio &bull; Violations = ban</div>'
            + '<button class="posts-sheet-send" id="posts-sheet-send">Post</button>'
          + '</div>';
        document.body.appendChild(shOverlay);
        document.body.appendChild(sheet);

        /* ── Foto: Canvas compressor ── */
        /* ── Multi-media: hasta 10 archivos ── */
        /* Cada item: { blob, type, previewUrl } */
        var pendingFiles = [];
        var MAX_FILES = 10;

        function updateCounter() {
          var ct = document.getElementById('pm-counter');
          if (ct) ct.textContent = pendingFiles.length > 0 ? pendingFiles.length+'/'+MAX_FILES : '';
        }

        function renderPreviewGrid() {
          var wrap = document.getElementById('posts-img-wrap-area');
          if (!wrap) return;
          if (!pendingFiles.length) { wrap.innerHTML = ''; updateCounter(); return; }
          var n = pendingFiles.length;
          var gridClass = n === 1 ? 'pm-grid pm-grid-1' : n === 2 ? 'pm-grid pm-grid-2' : 'pm-grid pm-grid-3';
          var html = '<div class="'+gridClass+'">';
          var show = Math.min(n, 3);
          pendingFiles.slice(0, show).forEach(function(item, i) {
            var isV = item.type.startsWith('video/');
            var isLast = i === show - 1;
            var isFull = n === 1 || (n >= 3 && i === 2);
            var cellClass = 'pm-cell' + (isFull ? ' pm-cell-full' : '');
            var media = isV
              ? '<video src="'+item.previewUrl+'" muted playsinline autoplay loop></video>'
              : '<img src="'+item.previewUrl+'" loading="lazy">';
            var extra = (isLast && n > 3) ? '<div class="pm-count">+' + (n - 3) + '</div>' : '';
            html += '<div class="'+cellClass+'" data-pm-idx="'+i+'">'+media+extra
              + '<button class="pm-rm" data-pm-rm="'+i+'">&#10005;</button></div>';
          });
          html += '</div>';
          wrap.innerHTML = html;
          /* Bind remove buttons */
          wrap.querySelectorAll('[data-pm-rm]').forEach(function(btn) {
            btn.addEventListener('click', function(ev) {
              ev.stopPropagation();
              var idx = parseInt(btn.getAttribute('data-pm-rm'));
              URL.revokeObjectURL(pendingFiles[idx].previewUrl);
              pendingFiles.splice(idx, 1);
              renderPreviewGrid();
              /* Reset file input para poder volver a elegir los mismos archivos */
              var fi = document.getElementById('posts-file-input');
              if (fi) fi.value = '';
            });
          });
          updateCounter();
        }

        function clearPendingImg() {
          pendingFiles.forEach(function(f){ URL.revokeObjectURL(f.previewUrl); });
          pendingFiles = [];
          renderPreviewGrid();
        }

        function processFile(file, cb) {
          var isVideo = file.type.startsWith('video/');
          var isGif   = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
          if (isVideo || isGif) {
            if (file.size > 30 * 1024 * 1024) {
              var t = document.getElementById('toast');
              if (t) { t.textContent = file.name+': Max 30MB'; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 3000); }
              cb(null); return;
            }
            cb({ blob: file, type: file.type, previewUrl: URL.createObjectURL(file) });
          } else {
            /* Imagen — comprimir con Canvas a WebP */
            var img2 = new Image();
            var tmpUrl = URL.createObjectURL(file);
            img2.onload = function() {
              var maxW = 1440;
              var ratio = Math.min(maxW / img2.width, 1);
              var cv = document.createElement('canvas');
              cv.width  = Math.round(img2.width  * ratio);
              cv.height = Math.round(img2.height * ratio);
              cv.getContext('2d').drawImage(img2, 0, 0, cv.width, cv.height);
              URL.revokeObjectURL(tmpUrl);
              cv.toBlob(function(blob) {
                var pUrl = URL.createObjectURL(blob);
                cb({ blob: blob, type: 'image/webp', previewUrl: pUrl });
              }, 'image/webp', 0.85);
            };
            img2.onerror = function() { URL.revokeObjectURL(tmpUrl); cb(null); };
            img2.src = tmpUrl;
          }
        }

        document.getElementById('posts-photo-btn').addEventListener('click', function() {
          document.getElementById('posts-file-input').click();
        });

        document.getElementById('posts-file-input').addEventListener('change', function(e) {
          var files = Array.from(e.target.files || []);
          if (!files.length) return;
          var slots = MAX_FILES - pendingFiles.length;
          if (slots <= 0) {
            var t = document.getElementById('toast');
            if (t) { t.textContent = 'Max '+MAX_FILES+' files reached'; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); }, 2500); }
            return;
          }
          files = files.slice(0, slots);
          var pending = files.length;
          files.forEach(function(file) {
            processFile(file, function(item) {
              if (item) pendingFiles.push(item);
              pending--;
              if (pending === 0) renderPreviewGrid();
            });
          });
          e.target.value = '';
        });

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
          if(!text && !pendingFiles.length) return;
          var sendBtn2=document.getElementById('posts-sheet-send');
          sendBtn2.disabled=true;
          sendBtn2.textContent='Posting...';
          try{
            /* 1. Subir todos los archivos en paralelo */
            var imageUrl = '';
            if (pendingFiles.length) {
              var uploadResults = await Promise.all(pendingFiles.map(function(item) {
                return fetch('/api/upload', {
                  method: 'PUT', credentials: 'include',
                  headers: { 'Content-Type': item.type },
                  body: item.blob
                }).then(function(r){ return r.json(); }).then(function(d){ return d.ok ? d.url : null; }).catch(function(){ return null; });
              }));
              var urls = uploadResults.filter(Boolean);
              imageUrl = urls.length === 1 ? urls[0] : JSON.stringify(urls);
            }
            /* 2. Guardar post en D1 */
            var r2=await fetch('/api/posts',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({action:'post',body:text||' ',image_url:imageUrl})}); 
            var d2=await r2.json();
            if(d2.ok){
              if(ta2) ta2.value='';
              clearPendingImg();
              closePostSheet();
              /* Insertar solo el nuevo post al inicio sin recargar el feed */
              if(d2.post && window.renderPost){
                var newCard = window.renderPost(d2.post);
                container.insertAdjacentHTML('afterbegin', newCard);
                /* Actualizar likes del nuevo post */
                setTimeout(function(){ if(window.loadAllLikes) window.loadAllLikes(container); },100);
              } else {
                /* Recargar solo los posts del usuario actual — usar userId del scope */
                window.loadPostsFeed(container, userId || (window.currentUser ? window.currentUser.id : null));
              }
            } else {
              var toast=document.getElementById('toast');
              if(toast){toast.textContent=d2.error||'Error';toast.classList.add('show');setTimeout(function(){toast.classList.remove('show');},3000);}
            }
          }catch(e){}
          sendBtn2.disabled=false;
          sendBtn2.textContent='Post';
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

  /* Post media viewer — fullscreen al tocar imagen/video de post */
  /* openPMV → HWViewer */
  window._openPMV = function(src){ if(window.HWViewer) window.HWViewer.open([src],0,null,null); };


  /* Delegation: comment on post, report post, admin actions */
  document.addEventListener('click', async function(e) {
    /* Abrir imagen/video de post en fullscreen */
    /* Click en media del post — abrir HWViewer */
    var mediaCell = e.target.closest('.pc-media-cell, .pc-media-wrap');
    if (mediaCell) {
      var wrap = mediaCell.closest('[data-tv-urls]') || mediaCell;
      if (!wrap.hasAttribute('data-tv-urls')) wrap = mediaCell.querySelector('[data-tv-urls]') || mediaCell;
      var urlsEnc = wrap.getAttribute('data-tv-urls');
      var tvIdx = parseInt(mediaCell.getAttribute('data-tv-idx')||'0');
      if (urlsEnc && window.HWViewer) {
        try { window.HWViewer.open(JSON.parse(decodeURIComponent(urlsEnc)), tvIdx, null, null); } catch(err){}
        return;
      }
    }
    /* Fallback imagen suelta */
    var postImg = e.target.closest('.post-card-img');
    if (postImg && window.HWViewer) {
      if (postImg.tagName !== 'VIDEO') { window.HWViewer.open([postImg.src],0,null,null); return; }
    }

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
      var wasLiked = LIKED_POSTS.has(pid);
      /* Optimistic update */
      if (wasLiked) {
        LIKED_POSTS.delete(pid);
        likeBtn.classList.remove('liked');
      } else {
        LIKED_POSTS.add(pid);
        likeBtn.classList.add('liked');
        likeBtn.style.transform='scale(1.35)'; setTimeout(function(){ likeBtn.style.transform=''; },200);
      }
      saveLikedPosts();
      /* Update count optimistically */
      var curCount = parseInt(likeBtn.getAttribute('data-like-count')||'0',10);
      var newCount = Math.max(0, curCount + (wasLiked ? -1 : 1));
      likeBtn.setAttribute('data-like-count', newCount);
      var countEl = likeBtn.querySelector('.plc');
      if (countEl) countEl.textContent = newCount > 0 ? newCount : '';
      /* Persist to server */
      if (window.currentUser) {
        fetch('/api/posts', {
          method: 'POST', credentials: 'include',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({post_id: parseInt(pid), action: wasLiked ? 'unlike' : 'like'})
        }).then(function(r){ return r.json(); })
          .then(function(d){
            if (d.count !== undefined) {
              likeBtn.setAttribute('data-like-count', d.count);
              if (countEl) countEl.textContent = d.count > 0 ? d.count : '';
            }
          }).catch(function(){});
      }
      return;
    }

    /* Report post — abrir sheet de categorías */
    var reportBtn = e.target.closest('.post-report-btn[data-post-id]');
    if (reportBtn && !reportBtn.classList.contains('reported')) {
      openReportSheet(reportBtn.getAttribute('data-post-id'));
      return;
    }

    /* Seleccionar categoría de reporte */
    var catBtn = e.target.closest('.rep-cat-btn[data-rep-cat]');
    if (catBtn && currentReportPostId) {
      var cat = catBtn.getAttribute('data-rep-cat');
      var pid = currentReportPostId;
      closeReportSheet();
      try {
        await fetch('/api/posts', {
          method:'POST', credentials:'include',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({action:'report', post_id: parseInt(pid), category: cat})
        });
        /* Marcar como reportado en el DOM */
        var btn2 = document.querySelector('.post-report-btn[data-post-id="'+pid+'"]');
        if (btn2) { btn2.textContent = 'Reported'; btn2.classList.add('reported'); }
        REPORTED_POSTS.add(pid); saveReported();
        /* Si es underage — ocultar la card inmediatamente */
        if (cat === 'underage') {
          var card = document.querySelector('.post-card[data-post-id="'+pid+'"]');
          if (card) { card.style.opacity='0.3'; card.style.pointerEvents='none'; }
        }
        /* Toast */
        var toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = cat==='underage' ? '⚠ Reported and removed — thank you' : 'Reported — thank you';
          toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); }, 3000);
        }
      } catch(e){}
      return;
    }

    /* ⋯ Post menu */
    var menuBtn = e.target.closest('.pc-menu-btn[data-post-id]');
    if (menuBtn) {
      var pid = menuBtn.getAttribute('data-post-id');
      var card = menuBtn.closest('.post-card');
      var pData = {};
      if (card) {
        /* Recoger datos del post desde el DOM para pasarlos al sheet */
        pData.user_id = card.getAttribute('data-post-uid') || '';
        var nameEl = card.querySelector('.pc-name');
        pData.user_name = nameEl ? nameEl.textContent : '';
        var avEl = card.querySelector('.pc-av img');
        pData.user_avatar = avEl ? avEl.src : '';
        var bodyEl = card.querySelector('.pc-tags');
        pData.body = bodyEl ? bodyEl.textContent : '';
        var imgEl = card.querySelector('.pc-media-single') || card.querySelector('.pc-media-cell img');
        pData.image_url = imgEl ? (imgEl.src || imgEl.getAttribute('data-lazygif') || '') : '';
        var vidEl = card.querySelector('.pc-media-single video, .pc-media-cell video');
        if (vidEl) pData.image_url = vidEl.src;
      }
      openPostMenu(pid, pData);
      return;
    }

    /* Share directo (botón ↑) */
    var shareBtn = e.target.closest('.pc-share-btn[data-post-id]');
    if (shareBtn) {
      var pid = shareBtn.getAttribute('data-post-id');
      var card = shareBtn.closest('.post-card');
      var pData = {};
      if (card) {
        var bodyEl2 = card.querySelector('.pc-tags');
        pData.body = bodyEl2 ? bodyEl2.textContent : '';
      }
      doShare(pid, pData);
      return;
    }

    /* Repost directo (botón ↻) */
    var repostBtn = e.target.closest('.pc-repost-btn[data-post-id]');
    if (repostBtn) {
      if (!window.currentUser) {
        var toast = document.getElementById('toast');
        if (toast) { toast.textContent = 'Sign in to repost'; toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); }, 2500); }
        return;
      }
      var pid = repostBtn.getAttribute('data-post-id');
      var card = repostBtn.closest('.post-card');
      var pData = {};
      if (card) {
        var nameEl2 = card.querySelector('.pc-name');
        pData.user_name = nameEl2 ? nameEl2.textContent : '';
        var avEl2 = card.querySelector('.pc-av img');
        pData.user_avatar = avEl2 ? avEl2.src : '';
        var bodyEl3 = card.querySelector('.pc-tags');
        pData.body = bodyEl3 ? bodyEl3.textContent : '';
        var imgEl2 = card.querySelector('.pc-media-single') || card.querySelector('.pc-media-cell img');
        pData.image_url = imgEl2 ? (imgEl2.src || imgEl2.getAttribute('data-lazygif') || '') : '';
        var vidEl2 = card.querySelector('video');
        if (vidEl2) pData.image_url = vidEl2.src;
      }
      openRepostSheet(pid, pData);
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

  /* ── Post menu sheet (⋯) ── */
  var _pmOverlay = document.createElement('div');
  _pmOverlay.className = 'pmenu-overlay';
  var _pmSheet = document.createElement('div');
  _pmSheet.className = 'pmenu-sheet';
  document.body.appendChild(_pmOverlay);
  document.body.appendChild(_pmSheet);

  var _currentMenuPostId = null;
  var _currentMenuPostData = null;

  function openPostMenu(postId, postData) {
    _currentMenuPostId = postId;
    _currentMenuPostData = postData || {};
    var isOwn = window.currentUser && window.currentUser.id === (_currentMenuPostData.user_id || '');
    _pmSheet.innerHTML = '<div class="pmenu-handle"></div>'
      + (window.currentUser
        ? '<div class="pmenu-item" id="pmenu-repost"><div class="pmenu-item-icon" style="background:rgba(255,69,0,0.12);">&#8635;</div>Repost</div>'
        : '')
      + '<div class="pmenu-item" id="pmenu-share"><div class="pmenu-item-icon" style="background:rgba(255,184,0,0.1);">&#8679;</div>Share</div>'
      + '<div class="pmenu-item" id="pmenu-copy"><div class="pmenu-item-icon" style="background:rgba(255,255,255,0.05);">&#128279;</div>Copy link</div>'
      + (isOwn
        ? '<div class="pmenu-item" id="pmenu-delete" style="color:#ff5555;"><div class="pmenu-item-icon" style="background:rgba(204,0,0,0.12);">&#128465;</div>Delete post</div>'
        : '');
    _pmOverlay.classList.add('open');
    _pmSheet.classList.add('open');

    var ri = document.getElementById('pmenu-repost');
    if (ri) ri.addEventListener('click', function() { closePostMenu(); openRepostSheet(postId, _currentMenuPostData); });
    var si = document.getElementById('pmenu-share');
    if (si) si.addEventListener('click', function() { closePostMenu(); doShare(postId, _currentMenuPostData); });
    var ci = document.getElementById('pmenu-copy');
    if (ci) ci.addEventListener('click', function() {
      closePostMenu();
      var link = 'https://maqueta-8t9.pages.dev/post/' + postId;
      if (navigator.clipboard) { navigator.clipboard.writeText(link); }
      var toast = document.getElementById('toast');
      if (toast) { toast.textContent = 'Link copied!'; toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); }, 2500); }
    });
    var di = document.getElementById('pmenu-delete');
    if (di) di.addEventListener('click', function() {
      closePostMenu();
      if (window._adminDeletePost) { window._adminDeletePost(parseInt(postId), null); }
    });
  }
  function closePostMenu() {
    _pmOverlay.classList.remove('open');
    _pmSheet.classList.remove('open');
  }
  _pmOverlay.addEventListener('click', closePostMenu);

  /* ── Repost sheet ── */
  var _rpOverlay = document.createElement('div');
  _rpOverlay.className = 'rp-sheet-overlay';
  var _rpSheet = document.createElement('div');
  _rpSheet.className = 'rp-sheet';
  document.body.appendChild(_rpOverlay);
  document.body.appendChild(_rpSheet);

  function openRepostSheet(postId, pData) {
    if (!window.currentUser) return;
    var rpAvSrc = pData.user_avatar || '';
    var rpAvHtml = rpAvSrc ? '<img src="'+rpAvSrc+'">' : '';
    var rpBody = (pData.body||'').trim();
    var rpImg  = pData.image_url ? (function(){
      var lo = (pData.image_url||'').toLowerCase().split('?')[0];
      return lo.endsWith('.mp4')||lo.endsWith('.webm')
        ? '<video src="'+pData.image_url+'" muted playsinline style="width:100%;max-height:160px;object-fit:cover;display:block;"></video>'
        : '<img src="'+pData.image_url+'" style="width:100%;max-height:160px;object-fit:cover;display:block;">';
    })() : '';
    _rpSheet.innerHTML = '<div class="rp-handle"></div>'
      + '<div class="rp-title">Repost</div>'
      + '<textarea class="rp-caption" id="rp-caption" placeholder="Add a comment... (optional)" maxlength="500"></textarea>'
      + '<div class="rp-preview">'
        + '<div class="rp-preview-header">'
          + '<div class="rp-preview-av">'+rpAvHtml+'</div>'
          + '<div class="rp-preview-name">'+escH(pData.user_name||'')+'</div>'
        + '</div>'
        + (rpImg ? '<div class="rp-preview-media">'+rpImg+'</div>' : '')
        + (rpBody ? '<div class="rp-preview-body">'+escH(rpBody.length>120?rpBody.slice(0,120)+'…':rpBody)+'</div>' : '')
      + '</div>'
      + '<div class="rp-footer">'
        + '<button class="rp-btn rp-btn-quick" id="rp-btn-quick">&#8635; Quick Repost</button>'
        + '<button class="rp-btn rp-btn-send" id="rp-btn-send">&#8635; Repost</button>'
      + '</div>';
    _rpOverlay.classList.add('open');
    _rpSheet.classList.add('open');

    async function doRepost(caption) {
      var q = document.getElementById('rp-btn-quick');
      var s = document.getElementById('rp-btn-send');
      if (q) q.disabled = true; if (s) s.disabled = true;
      try {
        var r = await fetch('/api/posts', {
          method: 'POST', credentials: 'include',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ action: 'repost', post_id: parseInt(postId), caption: caption })
        });
        var d = await r.json();
        if (d.ok) {
          closeRepostSheet();
          var toast = document.getElementById('toast');
          if (toast) { toast.textContent = 'Reposted!'; toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); }, 2500); }
          /* Si estamos en el perfil propio, añadir al feed */
          if (d.post && window.renderPost) {
            var pc = document.getElementById('posts-feed-container');
            if (pc) {
              pc.insertAdjacentHTML('afterbegin', window.renderPost(d.post));
              if (window.loadAllLikes) window.loadAllLikes();
            }
          }
        } else {
          var toast2 = document.getElementById('toast');
          if (toast2) { toast2.textContent = d.error||'Error'; toast2.classList.add('show'); setTimeout(function(){ toast2.classList.remove('show'); }, 3000); }
          if (q) q.disabled = false; if (s) s.disabled = false;
        }
      } catch(e) { if (q) q.disabled = false; if (s) s.disabled = false; }
    }

    var qBtn = document.getElementById('rp-btn-quick');
    var sBtn = document.getElementById('rp-btn-send');
    if (qBtn) qBtn.addEventListener('click', function() { doRepost(''); });
    if (sBtn) sBtn.addEventListener('click', function() {
      var ta = document.getElementById('rp-caption');
      doRepost(ta ? ta.value.trim() : '');
    });
  }
  function closeRepostSheet() {
    _rpOverlay.classList.remove('open');
    _rpSheet.classList.remove('open');
  }
  _rpOverlay.addEventListener('click', closeRepostSheet);

  /* ── Share nativo ── */
  function doShare(postId, pData) {
    var link = 'https://maqueta-8t9.pages.dev/post/' + postId;
    var text = (pData && pData.body ? pData.body.slice(0,100) : '') || 'Check this out on HOTT WRESTLING';
    if (navigator.share) {
      navigator.share({ title: 'HOTT WRESTLING', text: text, url: link }).catch(function(){});
    } else {
      if (navigator.clipboard) navigator.clipboard.writeText(link);
      var toast = document.getElementById('toast');
      if (toast) { toast.textContent = 'Link copied!'; toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); }, 2500); }
    }
  }

  /* Exponer renderPost, _activateLazyGifs y loadPostsFeed para uso cross-IIFE */
  window.renderPost = renderPost;
  window._activateLazyGifs = _activateLazyGifs;
  window.loadPostsFeed = window.loadPostsFeed;

})();

/* ── THREADS ── */
(function(){
  'use strict';

  /* CSS */
  var cs = document.createElement('style');
  cs.textContent = [
    '.comm-create-btn{background:var(--fire-orange);color:#fff;border:none;border-radius:20px;padding:0.35rem 0.85rem;font-family:var(--font-d);font-size:0.72rem;letter-spacing:0.06em;cursor:pointer;}',
    /* Sort tabs */
    '.thread-sort-tabs{display:flex;gap:0;border-bottom:1px solid var(--border);padding:0 1rem;}',
    '.thread-sort-tab{background:none;border:none;color:var(--text-dim);font-family:var(--font-b);font-size:0.72rem;padding:0.55rem 0.75rem 0.55rem 0;cursor:pointer;border-bottom:2px solid transparent;transition:all 0.2s;margin-right:0.5rem;}',
    '.thread-sort-tab.active{color:var(--fire-orange);border-bottom-color:var(--fire-orange);}',
    /* Search */
    '.comm-search-bar{margin:0.6rem 1rem;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;display:flex;align-items:center;gap:0.5rem;padding:0.45rem 0.75rem;}',
    '.comm-search-bar svg{stroke:var(--text-muted);flex-shrink:0;}',
    '.comm-search-bar input{background:none;border:none;color:var(--text);font-family:var(--font-b);font-size:0.82rem;outline:none;flex:1;}',
    '.comm-search-bar input::placeholder{color:var(--text-muted);}',
    /* Category pills */
    '.comm-cat-pills{display:flex;gap:0.4rem;padding:0 1rem 0.5rem;overflow-x:auto;scrollbar-width:none;}',
    '.comm-cat-pills::-webkit-scrollbar{display:none;}',
    '.comm-cat-pill{background:none;border:1px solid var(--border);color:var(--text-dim);border-radius:20px;padding:0.25rem 0.75rem;font-size:0.68rem;font-family:var(--font-b);cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all 0.2s;}',
    '.comm-cat-pill.active{background:var(--fire-orange);border-color:var(--fire-orange);color:#fff;}',
    /* Popular tags */
    '.thread-tags-row{display:flex;gap:0.35rem;padding:0 1rem 0.65rem;overflow-x:auto;scrollbar-width:none;flex-wrap:nowrap;}',
    '.thread-tags-row::-webkit-scrollbar{display:none;}',
    '.thread-tag-chip{background:var(--surface-3);border:1px solid var(--border);color:var(--text-muted);border-radius:20px;padding:0.2rem 0.6rem;font-size:0.62rem;font-family:var(--font-b);cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all 0.2s;}',
    '.thread-tag-chip.active{background:rgba(255,69,0,0.1);border-color:rgba(255,69,0,0.5);color:var(--fire-orange);}',
    /* Loading / empty */
    '.comm-loading,.comm-empty{padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;line-height:1.6;}',
    /* Thread card */
    '.comm-card{margin:0 1rem 0.85rem;background:var(--surface-2);border:1px solid var(--border);border-radius:18px;overflow:hidden;cursor:pointer;transition:border-color 0.2s;}',
    '.comm-card:active{border-color:var(--fire-orange);}',
    '.comm-card-cover{height:75px;position:relative;background:linear-gradient(135deg,#1a0505,#2d0a00,#1a0505);overflow:hidden;}',
    '.comm-card-cover-glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 130%,rgba(255,69,0,0.38) 0%,transparent 65%);pointer-events:none;}',
    '.comm-card-cover-pat{position:absolute;inset:0;opacity:0.05;background-image:repeating-linear-gradient(45deg,#FF4500 0,#FF4500 1px,transparent 0,transparent 50%);background-size:12px 12px;pointer-events:none;}',
    '.comm-card-cover img{width:100%;height:100%;object-fit:cover;display:block;}',
    '.comm-cat-tag{position:absolute;top:0.4rem;left:0.4rem;background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);color:var(--text-dim);font-size:0.55rem;letter-spacing:0.12em;text-transform:uppercase;padding:0.15rem 0.5rem;border-radius:20px;font-family:var(--font-d);}',
    /* Thumbnails strip */
    '.comm-card-thumbs{display:flex;gap:2px;height:0;overflow:hidden;transition:height 0.2s;}',
    '.comm-card-thumbs.has-imgs{height:52px;}',
    '.comm-card-thumb{flex:1;background:var(--surface-3);overflow:hidden;}',
    '.comm-card-thumb img,.comm-card-thumb video{width:100%;height:100%;object-fit:cover;display:block;}',
    '.comm-card-body{padding:0.65rem;}',
    '.comm-card-name{font-family:var(--font-d);font-size:0.95rem;letter-spacing:0.05em;margin-bottom:0.2rem;}',
    '.comm-card-desc{font-size:0.72rem;color:var(--text-dim);line-height:1.4;margin-bottom:0.45rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
    '.comm-card-tags{display:flex;gap:0.3rem;flex-wrap:wrap;margin-bottom:0.5rem;}',
    '.comm-card-tag{font-size:0.58rem;color:var(--text-muted);background:var(--surface-3);border-radius:20px;padding:0.12rem 0.5rem;font-family:var(--font-b);}',
    '.comm-card-foot{display:flex;align-items:center;justify-content:space-between;}',
    '.comm-card-stats{display:flex;gap:0.6rem;}',
    '.comm-card-stat{font-size:0.62rem;color:var(--text-muted);display:flex;align-items:center;gap:0.22rem;}',
    '.comm-card-stat svg{width:10px;height:10px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '.comm-card-activity{font-size:0.58rem;color:var(--text-muted);font-style:italic;}',
    '.comm-join-btn{background:none;border:1px solid var(--border);color:var(--text-dim);border-radius:20px;padding:0.22rem 0.7rem;font-size:0.65rem;font-family:var(--font-b);cursor:pointer;transition:all 0.2s;}',
    '.comm-join-btn.joined{background:rgba(255,69,0,0.1);border-color:var(--fire-orange);color:var(--fire-orange);}',
    /* Thread detail */
    '.comm-detail{position:absolute;inset:0;background:var(--bg);z-index:5;display:flex;flex-direction:column;transform:translateX(100%);transition:transform 0.32s cubic-bezier(0.16,1,0.3,1);height:100%;overflow:hidden;}',
    '.comm-detail.open{transform:translateX(0);}',
    '.comm-detail-header{display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1rem 0.5rem;border-bottom:1px solid var(--border);background:var(--bg);flex-shrink:0;}',
    '.comm-detail-back{background:none;border:none;color:var(--text);width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}',
    '.comm-detail-back svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;}',
    '.comm-detail-name{font-family:var(--font-d);font-size:0.95rem;letter-spacing:0.06em;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    '.comm-detail-post-btn{background:var(--fire-orange);color:#fff;border:none;border-radius:20px;padding:0.35rem 0.85rem;font-family:var(--font-d);font-size:0.7rem;letter-spacing:0.06em;cursor:pointer;flex-shrink:0;}',
    '.comm-detail-cover{height:90px;background:linear-gradient(135deg,#1a0505,#2d0a00,#1a0505);position:relative;flex-shrink:0;}',
    '.comm-detail-cover-glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 130%,rgba(255,69,0,0.42) 0%,transparent 65%);pointer-events:none;}',
    '.comm-detail-info{padding:0.85rem 1rem 0.65rem;border-bottom:1px solid var(--border);flex-shrink:0;}',
    '.comm-detail-title{font-family:var(--font-d);font-size:1.2rem;letter-spacing:0.05em;margin-bottom:0.25rem;}',
    '.comm-detail-desc{font-size:0.76rem;color:var(--text-dim);line-height:1.5;margin-bottom:0.5rem;}',
    '.comm-detail-info-tags{display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.55rem;}',
    '.comm-detail-info-tag{font-size:0.6rem;color:var(--text-muted);background:var(--surface-3);border-radius:20px;padding:0.12rem 0.5rem;font-family:var(--font-b);}',
    '.comm-detail-stats-row{display:flex;align-items:center;justify-content:space-between;}',
    '.comm-detail-stats{display:flex;gap:0.85rem;font-size:0.62rem;color:var(--text-muted);}',
    '.comm-detail-stats span{display:flex;align-items:center;gap:0.22rem;}',
    '.comm-detail-stats svg{width:10px;height:10px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '.comm-follow-btn{background:none;border:1px solid var(--border);color:var(--text-dim);border-radius:20px;padding:0.22rem 0.7rem;font-size:0.65rem;font-family:var(--font-b);cursor:pointer;transition:all 0.2s;}',
    '.comm-follow-btn.following{background:rgba(255,184,0,0.1);border-color:var(--fire-yellow);color:var(--fire-yellow);}',
    '.comm-detail-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0;}',
    '.comm-detail-collapse{overflow:hidden;transition:max-height 0.35s cubic-bezier(0.16,1,0.3,1),opacity 0.25s ease;max-height:500px;opacity:1;flex-shrink:0;}',
    '.comm-detail-collapse.hidden{max-height:0 !important;opacity:0;pointer-events:none;}',
    /* Thread post */
    '.hw-audio-player{display:flex;align-items:center;gap:0.55rem;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:0.5rem 0.75rem;margin:0.4rem 0;}'
    + '.hw-audio-play{width:32px;height:32px;border-radius:50%;background:var(--fire-orange);border:none;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:transform 0.15s;}'
    + '.hw-audio-play:active{transform:scale(0.9);}'
    + '.hw-audio-bar{flex:1;display:flex;align-items:center;gap:0.5rem;}'
    + '.hw-audio-progress{flex:1;height:3px;background:var(--border);border-radius:3px;cursor:pointer;position:relative;}'
    + '.hw-audio-fill{height:100%;background:var(--fire-orange);border-radius:3px;width:0%;transition:width 0.1s linear;}'
    + '.hw-audio-time{font-size:0.62rem;color:var(--text-muted);font-family:var(--font-b);white-space:nowrap;min-width:2.5rem;text-align:right;}'
    + '.comm-post{margin:0.75rem 1rem 0;background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:0.85rem;}',
    '.comm-post.pinned{border-color:rgba(255,184,0,0.3);background:rgba(255,184,0,0.03);}',
    '.comm-post-pin-label{font-size:0.58rem;color:var(--fire-yellow);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:0.35rem;display:flex;align-items:center;gap:0.25rem;}',
    '.comm-post-header{display:flex;align-items:center;gap:0.55rem;margin-bottom:0.6rem;}',
    '.comm-post-av{width:38px;height:38px;border-radius:50%;background:var(--surface-3);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:0.9rem;overflow:hidden;flex-shrink:0;cursor:pointer;border:2px solid rgba(255,69,0,0.25);}',
    '.comm-post-av img{width:100%;height:100%;object-fit:cover;}',
    '.comm-post-uname{font-family:var(--font-d);font-size:0.92rem;letter-spacing:0.05em;cursor:pointer;transition:color 0.15s;color:#fff;}',
    '.comm-post-uname:hover,.comm-post-uname:active{color:var(--fire-orange);}',
    '.comm-post-time{font-size:0.62rem;color:var(--text-muted);}',
    '.comm-post-body{font-size:0.9rem;line-height:1.65;color:#e8e2d8;margin-bottom:0.6rem;white-space:pre-wrap;word-break:break-word;font-family:var(--font-b);}',
    '.comm-post-img{width:100%;border-radius:10px;margin-bottom:0.6rem;display:block;max-height:300px;object-fit:cover;}',
    '.comm-post-vid{width:100%;border-radius:10px;margin-bottom:0.6rem;display:block;}',
    '.comm-post-actions{display:flex;gap:0.35rem;align-items:center;}',
    '.comm-post-act{background:none;border:none;color:var(--text-dim);font-size:0.7rem;cursor:pointer;display:flex;align-items:center;gap:0.28rem;padding:0.2rem 0.4rem;border-radius:8px;font-family:var(--font-b);transition:color 0.15s;}',
    '.comm-report-btn{margin-left:auto;color:var(--text-muted);border:1px solid rgba(255,255,255,0.06);font-size:0.62rem;padding:0.18rem 0.55rem;border-radius:20px;}',
    '.comm-report-btn:active{color:#cc4444;border-color:rgba(204,68,68,0.3);}',
    '.comm-post-act svg{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:fill 0.15s,stroke 0.15s;}',
    '.comm-post-act.liked{color:#ff3b5c;}',
    '.comm-post-act.liked svg{fill:#ff3b5c;stroke:#ff3b5c;}',
    '.comm-post-act.creator-act{color:var(--fire-yellow);font-size:0.62rem;}',
    /* Sheets */
    '.comm-sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:310;opacity:0;pointer-events:none;transition:opacity 0.25s;}',
    '.comm-sheet-overlay.open{opacity:1;pointer-events:all;}',
    '.comm-sheet{position:fixed;left:0;right:0;bottom:0;max-width:480px;margin:0 auto;background:var(--surface);border-radius:20px 20px 0 0;border-top:1px solid var(--border);z-index:311;padding:0.5rem 1.1rem calc(1.5rem + env(safe-area-inset-bottom,0px));transform:translateY(100%);transition:transform 0.32s cubic-bezier(0.16,1,0.3,1);}',
    '.comm-sheet.open{transform:translateY(0);}',
    '.comm-sheet-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 0.85rem;}',
    '.comm-sheet-title{font-family:var(--font-d);font-size:0.9rem;letter-spacing:0.08em;margin-bottom:0.75rem;}',
    '.comm-sheet-input{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:0.55rem 0.85rem;font-size:0.85rem;font-family:var(--font-b);margin-bottom:0.5rem;box-sizing:border-box;}',
    '.comm-sheet-input:focus,.comm-sheet-ta:focus{outline:none;border-color:var(--fire-orange);}',
    '.comm-sheet-select{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:0.55rem 0.85rem;font-size:0.85rem;font-family:var(--font-b);margin-bottom:0.5rem;-webkit-appearance:none;}',
    '.comm-sheet-ta{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:0.6rem 0.85rem;font-size:0.85rem;font-family:var(--font-b);resize:none;height:90px;outline:none;margin-bottom:0.6rem;line-height:1.5;box-sizing:border-box;}',
    '.comm-sheet-label{font-size:0.68rem;color:var(--text-muted);margin-bottom:0.3rem;display:block;}',
    '.comm-sheet-toolbar{display:flex;gap:0.5rem;margin-bottom:0.6rem;}',
    '.comm-sheet-media-btn{flex:1;background:none;border:1px solid var(--border);color:var(--text-dim);border-radius:10px;padding:0.48rem;font-size:0.7rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.35rem;font-family:var(--font-b);}',
    '.comm-sheet-media-btn svg{width:13px;height:13px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '.comm-sheet-cta{width:100%;background:var(--fire-orange);color:#fff;border:none;border-radius:12px;padding:0.7rem;font-family:var(--font-d);font-size:0.88rem;letter-spacing:0.06em;cursor:pointer;}',
    '.comm-sheet-cta:disabled{opacity:0.5;}',
    '.comm-post-img-preview{width:100%;border-radius:10px;margin-bottom:0.5rem;max-height:200px;object-fit:cover;display:block;}',
    '.comm-post-img-wrap{position:relative;margin-bottom:0.5rem;}',
    '.comm-post-img-remove{position:absolute;top:0.4rem;right:0.4rem;background:rgba(0,0,0,0.6);border:none;color:#fff;border-radius:50%;width:24px;height:24px;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
    '.thread-viewer{position:fixed;inset:0;background:#000;z-index:500;display:none;flex-direction:column;align-items:center;justify-content:center;}',
    '.thread-viewer.open{display:flex;}',
    '.thread-viewer-img{max-width:100vw;max-height:100vh;object-fit:contain;display:block;}',
    '.thread-viewer-video{max-width:100vw;max-height:100vh;}',
    '.thread-viewer-close{position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,0.15);border:none;color:#fff;border-radius:50%;width:38px;height:38px;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;}',
    '.thread-viewer-counter{position:absolute;top:1rem;left:1rem;background:rgba(0,0,0,0.5);color:#fff;font-size:0.72rem;padding:0.25rem 0.65rem;border-radius:20px;font-family:var(--font-b);}',
    '.thread-viewer-nav{position:absolute;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.15);border:none;color:#fff;border-radius:50%;width:36px;height:36px;font-size:1.2rem;cursor:pointer;}',
    '.thread-viewer-prev{left:0.75rem;}',
    '.thread-viewer-next{right:0.75rem;}'
  ].join('');
  document.head.appendChild(cs);

  /* ═══════════════════════════════════════════════════════════
     HW NATIVE VIEWER — 60fps, GPU-accelerated, pinch/zoom/swipe
     Reemplaza photo-viewer y thread-viewer
  ═══════════════════════════════════════════════════════════ */
  (function(){
    /* CSS */
    var st = document.createElement('style');
    st.textContent = [
      '#hw-viewer{position:fixed;inset:0;z-index:9000;background:#000;display:none;touch-action:none;will-change:transform;overscroll-behavior:none;}',
      '#hw-viewer.open{display:flex;flex-direction:column;}',
      '#hw-viewer-bar{position:absolute;top:0;left:0;right:0;height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 1rem;z-index:2;background:linear-gradient(#000a,transparent);}',
      '#hw-viewer-counter{color:#fff;font-size:0.8rem;font-family:var(--font-b);}',
      '#hw-viewer-close{background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer;padding:0.5rem;line-height:1;}',
      '#hw-viewer-actions{position:absolute;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:space-around;padding:1rem 1rem calc(1rem + env(safe-area-inset-bottom,0));background:linear-gradient(transparent,#000a);z-index:2;}',
      '#hw-viewer-like{background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:0.2rem;font-family:var(--font-b);font-size:0.65rem;}',
      '#hw-viewer-like svg{width:26px;height:26px;fill:none;stroke:#fff;stroke-width:2;transition:all 0.15s;}',
      '#hw-viewer-like.liked svg{fill:#FF4500;stroke:#FF4500;}',
      '.hw-viewer-heart-anim{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);pointer-events:none;font-size:5rem;opacity:0;transition:none;z-index:10;}',
      '.hw-viewer-heart-anim.pop{animation:hwHeartPop 0.6s ease forwards;}',
      '@keyframes hwHeartPop{0%{transform:translate(-50%,-50%) scale(0);opacity:1;}50%{transform:translate(-50%,-50%) scale(1.3);opacity:1;}100%{transform:translate(-50%,-50%) scale(1);opacity:0;}}',
      '#hw-viewer-stage{position:absolute;inset:0;overflow:hidden;display:flex;align-items:center;justify-content:center;}'
    ].join('');
    document.head.appendChild(st);

    /* HTML */
    var viewer = document.createElement('div');
    viewer.id = 'hw-viewer';
    viewer.innerHTML =
      '<div id="hw-viewer-bar">'
        + '<button id="hw-viewer-close">&#10005;</button>'
        + '<div id="hw-viewer-counter"></div>'
        + '<div style="width:40px;"></div>'
      + '</div>'
      + '<div id="hw-viewer-stage"></div>'
      + '<div class="hw-viewer-heart-anim" id="hw-heart">&#10084;&#65039;</div>'
      + '<div id="hw-viewer-actions" style="display:none;">'
        + '<button id="hw-viewer-like"><svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span id="hw-viewer-like-count"></span></button>'
      + '</div>';
    document.body.appendChild(viewer);

    /* State */
    var _urls = [], _idx = 0, _postId = null;
    var _scale = 1, _minScale = 1, _maxScale = 5;
    var _tx = 0, _ty = 0;
    var _vx = 0, _vy = 0; /* velocity para momentum */
    var _pinchStartDist = 0, _pinchStartScale = 1;
    var _rafId = null;
    var _imgW = 0, _imgH = 0;
    var _stageW = 0, _stageH = 0;
    var _curImg = null;
    var _onLikeCallback = null;

    /* Helpers */
    function clamp(v, mn, mx){ return Math.max(mn, Math.min(mx, v)); }
    function dist(t){ return Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY); }
    function mid(t){ return {x:(t[0].clientX+t[1].clientX)/2, y:(t[0].clientY+t[1].clientY)/2}; }

    function clampTranslate(){
      if(_scale <= _minScale + 0.001){ _tx = 0; _ty = 0; _scale = _minScale; return; }
      /* El stage es la referencia — al scale=1 la imagen ocupa todo el stage */
      var maxX = _stageW * (_scale - 1) / 2;
      var maxY = _stageH * (_scale - 1) / 2;
      /* Asegurar valores positivos */
      maxX = Math.max(0, maxX);
      maxY = Math.max(0, maxY);
      _tx = clamp(_tx, -maxX, maxX);
      _ty = clamp(_ty, -maxY, maxY);
    }

    function applyTransform(animate){
      if(!_curImg) return;
      var tf = 'translate3d('+_tx+'px,'+_ty+'px,0) scale('+_scale+')';
      if(animate){
        _curImg.style.transition = 'transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)';
      } else {
        _curImg.style.transition = 'none';
      }
      _curImg.style.transform = tf;
    }

    function showSlide(idx, dir){
      _idx = idx;
      _scale = _minScale = 1; _tx = 0; _ty = 0;
      _vx = 0; _vy = 0;
      var stage = document.getElementById('hw-viewer-stage');
      if(!stage) return;

      /* Animar salida */
      var old = stage.querySelector('.hw-slide');
      if(old && dir){
        old.style.transition = 'transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)';
        old.style.transform = 'translate3d('+(dir<0?'100%':'-100%')+',0,0)';
        setTimeout(function(){ if(old.parentNode) old.parentNode.removeChild(old); }, 260);
      } else if(old){
        stage.removeChild(old);
      }

      _stageW = stage.offsetWidth || window.innerWidth;
      _stageH = stage.offsetHeight || window.innerHeight;

      var url = _urls[idx];
      var slide = document.createElement('div');
      slide.className = 'hw-slide';
      slide.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden;';
      if(dir){
        slide.style.transform = 'translate3d('+(dir>0?'100%':'-100%')+',0,0)';
      }

      var lo = (url||'').toLowerCase().split('?')[0];
      var isVid = lo.endsWith('.mp4')||lo.endsWith('.webm');

      if(isVid){
        var vid = document.createElement('video');
        vid.src = url;
        vid.controls = true;
        vid.autoplay = true;
        vid.setAttribute('playsinline','');
        vid.setAttribute('controlslist','nodownload');
        vid.style.cssText = 'max-width:100%;max-height:100vh;display:block;';
        slide.appendChild(vid);
        _curImg = vid;
      } else {
        var img = new Image();
        img.style.cssText = 'width:100%;height:100%;object-fit:contain;display:block;will-change:transform;touch-action:none;user-select:none;-webkit-user-drag:none;position:absolute;inset:0;';
        img.draggable = false;
        img.onload = function(){
          _imgW = img.naturalWidth; _imgH = img.naturalHeight;
          /* minScale = 1 — imagen siempre ocupa el stage completo */
          _minScale = 1;
          _scale = 1;
          _tx = 0; _ty = 0;
          applyTransform(false);
        };
        img.src = url;
        slide.appendChild(img);
        _curImg = img;
      }

      stage.appendChild(slide);

      /* Animar entrada */
      if(dir){
        requestAnimationFrame(function(){
          requestAnimationFrame(function(){
            slide.style.transition = 'transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)';
            slide.style.transform = 'translate3d(0,0,0)';
          });
        });
      }

      /* Counter */
      var ctr = document.getElementById('hw-viewer-counter');
      if(ctr) ctr.textContent = _urls.length > 1 ? (_idx+1)+' / '+_urls.length : '';

      /* Prev/next arrows */
      var prevBtn = document.getElementById('hw-viewer-prev');
      var nextBtn = document.getElementById('hw-viewer-next');
      if(prevBtn) prevBtn.style.display = (_urls.length>1&&_idx>0)?'':'none';
      if(nextBtn) nextBtn.style.display = (_urls.length>1&&_idx<_urls.length-1)?'':'none';
    }

    /* Touch state */
    var _touches = [];
    var _lastDist = 0, _lastMid = null;
    var _lastTx = 0, _lastTy = 0;
    var _lastT = 0;
    var _tapTimer = null, _tapCount = 0;
    var _swipeStartY = 0, _swipeStartX = 0;
    var _swipeStartScale = 1;
    var _swipeActive = false;

    var stage = document.getElementById('hw-viewer-stage');

    stage.addEventListener('touchstart', function(e){
      e.preventDefault();
      _touches = Array.from(e.touches);
      _lastTx = _tx; _lastTy = _ty;
      _swipeStartY = _touches[0].clientY;
      _swipeStartX = _touches[0].clientX;
      _swipeActive = false;
      if(_rafId){ cancelAnimationFrame(_rafId); _rafId = null; }
      _vx = 0; _vy = 0;

      if(_touches.length === 2){
        _lastDist = dist(_touches);
        _pinchStartDist = _lastDist;
        _pinchStartScale = _scale;
        _lastMid  = mid(_touches);
        _swipeStartScale = _scale;
      }

      /* Doble tap */
      _tapCount++;
      if(_tapCount === 1){
        _tapTimer = setTimeout(function(){ _tapCount = 0; }, 300);
      } else if(_tapCount >= 2){
        clearTimeout(_tapTimer); _tapCount = 0;
        handleDoubleTap(_touches[0].clientX, _touches[0].clientY);
      }
    }, {passive:false});

    stage.addEventListener('touchmove', function(e){
      e.preventDefault();
      var t = Array.from(e.touches);
      var now = Date.now();

      if(t.length === 2){
        /* Pinch zoom */
        var d2 = dist(t);
        var m2 = mid(t);
        /* Calcular scale relativo a la distancia inicial del pinch */
        var newScale = clamp(_pinchStartScale * (d2 / _pinchStartDist), _minScale, _maxScale);

        /* Zoom desde el punto central del pinch */
        var stageRect = stage.getBoundingClientRect();
        _stageW = stageRect.width;
        _stageH = stageRect.height;
        var px = m2.x - stageRect.left - _stageW/2;
        var py = m2.y - stageRect.top  - _stageH/2;
        var ds = newScale / _scale;
        _tx = px - ds*(px - _tx);
        _ty = py - ds*(py - _ty);
        _scale = newScale;
        clampTranslate();

        /* Pan con 2 dedos */
        if(_lastMid){
          _tx += m2.x - _lastMid.x;
          _ty += m2.y - _lastMid.y;
          clampTranslate();
        }

        _lastMid  = m2;
        _lastDist = d2;
        applyTransform(false);

      } else if(t.length === 1){
        var dx = t[0].clientX - _touches[0].clientX;
        var dy = t[0].clientY - _touches[0].clientY;
        var dt = now - _lastT || 16;
        _vx = dx / dt;
        _vy = dy / dt;
        _lastT = now;

        if(_scale > _minScale + 0.01){
          /* Pan */
          _tx = _lastTx + (t[0].clientX - _swipeStartX);
          _ty = _lastTy + (t[0].clientY - _swipeStartY);
          clampTranslate();
          applyTransform(false);
        } else {
          /* Swipe para cambiar imagen o cerrar */
          var totalDx = t[0].clientX - _swipeStartX;
          var totalDy = t[0].clientY - _swipeStartY;
          if(!_swipeActive && (Math.abs(totalDx)>8||Math.abs(totalDy)>8)){
            _swipeActive = true;
          }
          if(_swipeActive){
            if(Math.abs(totalDy) > Math.abs(totalDx)){
              /* Swipe down → preview cierre */
              if(totalDy > 0){
                viewer.style.background = 'rgba(0,0,0,'+(1 - Math.min(totalDy/300, 0.6))+')';
                if(_curImg) _curImg.style.transform = 'translate3d(0,'+totalDy+'px,0) scale('+(1 - totalDy/1200)+')';
              }
            } else if(_urls.length > 1){
              /* Swipe horizontal → preview cambio */
              if(_curImg) _curImg.style.transform = 'translate3d('+totalDx+'px,0,0)';
            }
          }
        }
        _touches = t;
      }
    }, {passive:false});

    stage.addEventListener('touchend', function(e){
      e.preventDefault();
      var t = Array.from(e.changedTouches);
      var totalDx = t[0].clientX - _swipeStartX;
      var totalDy = t[0].clientY - _swipeStartY;

      if(_scale <= _minScale + 0.01 && _swipeActive){
        if(Math.abs(totalDy) > Math.abs(totalDx) && totalDy > 80){
          /* Cerrar con swipe down */
          closeViewer();
          return;
        } else if(Math.abs(totalDx) > Math.abs(totalDy) && Math.abs(totalDx) > 60){
          /* Cambiar imagen */
          viewer.style.background = '';
          if(totalDx < 0 && _idx < _urls.length-1){ showSlide(_idx+1, 1); }
          else if(totalDx > 0 && _idx > 0){ showSlide(_idx-1, -1); }
          else if(_curImg) { _curImg.style.transition='transform 0.2s'; _curImg.style.transform='translate3d(0,0,0)'; }
          return;
        } else {
          /* Reset si no llegó al threshold */
          viewer.style.background = '';
          if(_curImg){ _curImg.style.transition='transform 0.2s'; _curImg.style.transform='translate3d(0,0,0) scale(1)'; }
        }
      }

      /* Momentum */
      if(_scale > _minScale + 0.01 && Math.abs(_vx)+Math.abs(_vy) > 0.1){
        momentum();
      } else {
        /* Snap back si fuera de bounds */
        clampTranslate();
        applyTransform(true);
      }

      _touches = Array.from(e.touches);
    }, {passive:false});

    function momentum(){
      if(Math.abs(_vx) < 0.01 && Math.abs(_vy) < 0.01){ clampTranslate(); applyTransform(true); return; }
      _tx += _vx * 16;
      _ty += _vy * 16;
      _vx *= 0.92;
      _vy *= 0.92;
      clampTranslate();
      applyTransform(false);
      _rafId = requestAnimationFrame(momentum);
    }

    function handleDoubleTap(x, y){
      if(_scale > _minScale + 0.05){
        /* Zoom out — volver a fit */
        _scale = _minScale; _tx = 0; _ty = 0;
      } else {
        /* Zoom in x2.5 centrado en el punto tocado */
        var targetScale = 2.5;
        var stageRect = stage.getBoundingClientRect();
        _stageW = stageRect.width;
        _stageH = stageRect.height;
        var px = x - stageRect.left - _stageW/2;
        var py = y - stageRect.top  - _stageH/2;
        var ds = targetScale / _scale;
        _tx = px - ds*(px - _tx);
        _ty = py - ds*(py - _ty);
        _scale = targetScale;
        clampTranslate();
      }
      applyTransform(true);

      /* Like con corazón en doble tap */
      if(_scale <= _minScale + 0.01 && _postId){
        triggerHeartAnim();
        if(_onLikeCallback) _onLikeCallback(_postId);
      }
    }

    function triggerHeartAnim(){
      var h = document.getElementById('hw-heart');
      if(!h) return;
      h.classList.remove('pop');
      void h.offsetWidth;
      h.classList.add('pop');
    }

    function openViewer_new(urls, startIdx, postId, likeCallback){
      _urls = Array.isArray(urls) ? urls : [urls];
      _postId = postId || null;
      _onLikeCallback = likeCallback || null;
      _idx = startIdx || 0;
      _scale = 1; _tx = 0; _ty = 0; _vx = 0; _vy = 0;
      viewer.style.background = '#000';

      /* Actions bar */
      var actBar = document.getElementById('hw-viewer-actions');
      if(actBar) actBar.style.display = _postId ? '' : 'none';

      viewer.classList.add('open');
      document.body.style.overflow = 'hidden';
      showSlide(_idx, 0);
    }

    function closeViewer(){
      if(_curImg){
        _curImg.style.transition = 'transform 0.2s, opacity 0.2s';
        _curImg.style.opacity = '0';
        _curImg.style.transform = 'translate3d(0,60px,0) scale(0.95)';
      }
      viewer.style.transition = 'opacity 0.2s';
      viewer.style.opacity = '0';
      setTimeout(function(){
        viewer.classList.remove('open');
        viewer.style.opacity = '';
        viewer.style.transition = '';
        viewer.style.background = '#000';
        var stage2 = document.getElementById('hw-viewer-stage');
        if(stage2) stage2.innerHTML = '';
        _curImg = null;
        document.body.style.overflow = '';
      }, 220);
    }

    /* Botón cerrar */
    document.getElementById('hw-viewer-close').addEventListener('click', closeViewer);

    /* Like button */
    var likeBtn = document.getElementById('hw-viewer-like');
    if(likeBtn) likeBtn.addEventListener('click', function(){
      if(_postId && _onLikeCallback){ triggerHeartAnim(); _onLikeCallback(_postId); }
    });

    /* Exponer globalmente — reemplaza openViewer y openThreadViewer */
    window.openThreadViewer = function(urls, idx){ openViewer_new(urls, idx||0, null, null); };
    window.HWViewer = { open: openViewer_new, close: closeViewer };

  })();

    /* State */
  var currentThread    = null;
  var currentSort      = 'trending';
  var currentCategory  = 'all';
  var currentTag       = '';
  var COMM_LIKED = new Set();
  try{ COMM_LIKED=new Set(JSON.parse(localStorage.getItem('hw_comm_liked')||'[]')); }catch(e){}
  function saveCommLiked(){ try{ localStorage.setItem('hw_comm_liked',JSON.stringify([...COMM_LIKED])); }catch(e){} }

  function escH(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function timeAgo(d){
    var s=(Date.now()-new Date(d).getTime())/1000;
    if(s<60) return 'just now'; if(s<3600) return Math.floor(s/60)+'m ago';
    if(s<86400) return Math.floor(s/3600)+'h ago'; if(s<604800) return Math.floor(s/86400)+'d ago';
    return Math.floor(s/604800)+'w ago';
  }
  function catLabel(c){ return {wrestling:'Wrestling',fantasy:'Fantasy',stories:'Stories',visual:'Visual',discussion:'Discussion',other:'Other'}[c]||c; }

  /* Sheets */
  var shOverlay = document.createElement('div'); shOverlay.className='comm-sheet-overlay'; shOverlay.id='comm-sh-overlay';
  var sheet     = document.createElement('div'); sheet.className='comm-sheet'; sheet.id='comm-sheet';
  document.body.appendChild(shOverlay); document.body.appendChild(sheet);
  var sheetMode='create'; var pendingPostBlob=null; var pendingPostType='image/webp';

  function openSheet(mode){
    sheetMode=mode; pendingPostBlob=null;
    sheet.innerHTML = mode==='create' ? buildCreateForm() : buildPostForm();
    shOverlay.classList.add('open'); sheet.classList.add('open');
    document.body.style.overflow='hidden';
    bindSheetEvents();
  }
  function closeSheet(){
    shOverlay.classList.remove('open'); sheet.classList.remove('open');
    document.body.style.overflow=''; pendingPostBlob=null;
  }
  shOverlay.addEventListener('click', closeSheet);

  function buildCreateForm(){
    return '<div class="comm-sheet-handle"></div>'
      +'<div class="comm-sheet-title">New Thread</div>'
      +'<label class="comm-sheet-label">Title</label>'
      +'<input class="comm-sheet-input" id="cs-name" placeholder="What&#39;s this thread about?" maxlength="60">'
      +'<label class="comm-sheet-label">Category</label>'
      +'<select class="comm-sheet-select" id="cs-cat">'
        +'<option value="wrestling">Wrestling</option>'
        +'<option value="fantasy">Fantasy</option>'
        +'<option value="stories">Stories</option>'
        +'<option value="visual">Visual</option>'
        +'<option value="discussion">Discussion</option>'
        +'<option value="other">Other</option>'
      +'</select>'
      +'<label class="comm-sheet-label">Tags (comma separated)</label>'
      +'<input class="comm-sheet-input" id="cs-tags" placeholder="singlet, college, muscle..." maxlength="150">'
      +'<label class="comm-sheet-label">Description</label>'
      +'<textarea class="comm-sheet-ta" id="cs-desc" placeholder="Describe your thread..." maxlength="300"></textarea>'
      +'<label class="comm-sheet-label">Cover photo (optional)</label>'
      +'<div id="cs-cover-wrap" style="margin-bottom:0.6rem;">'
        +'<button type="button" class="comm-sheet-media-btn" id="cs-cover-btn" style="width:100%;justify-content:center;">'
          +'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
          +' Add Cover Photo</button>'
        +'<input type="file" id="cs-cover-input" accept="image/*" style="display:none">'
        +'<div id="cs-cover-preview"></div>'
      +'</div>'
      +'<button class="comm-sheet-cta" id="cs-submit">Create Thread</button>';
  }

  function buildPostForm(){
    return '<div class="comm-sheet-handle"></div>'
      +'<div class="comm-sheet-title">New Post</div>'
      +'<textarea class="comm-sheet-ta" id="cp-body-ta" placeholder="What&#39;s on your mind?" maxlength="500" style="height:80px;"></textarea>'
      +'<div id="cp-media-grid" style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.5rem;"></div>'
      +'<div class="comm-sheet-toolbar">'
        +'<button class="comm-sheet-media-btn" id="cp-media-btn">'
          +'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
          +' Add Photos / Videos <span id="cp-media-count"></span></button>'
        +'<input type="file" id="cp-file-input" accept="image/*,video/mp4,video/webm,.gif" multiple style="display:none">'
      
        +'<button class="comm-sheet-media-btn" id="cp-mic-btn" style="margin-left:0.4rem;">'
          +'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>'
          +' Voice Note</button>'
        +'<div id="cp-audio-preview" style="display:none;margin-top:0.4rem;width:100%;"></div>'+'</div>'
      +'<div style="font-size:0.6rem;color:var(--text-muted);margin-bottom:0.65rem;">Up to 10 files &#183; No links &#183; Violations = ban</div>'
      +'<button class="comm-sheet-cta" id="cp-submit">Post</button>';
  }

  function bindSheetEvents(){
    var submitBtn=document.getElementById(sheetMode==='create'?'cs-submit':'cp-submit');
    if(!submitBtn) return;
    if(sheetMode==='create'){
      /* Cover photo upload */
      var coverUrl='';
      var coverBtn=document.getElementById('cs-cover-btn');
      var coverInput=document.getElementById('cs-cover-input');
      var coverPreview=document.getElementById('cs-cover-preview');
      if(coverBtn) coverBtn.addEventListener('click',function(){ coverInput.click(); });
      if(coverInput) coverInput.addEventListener('change', function(e){
        var file=e.target.files[0]; if(!file) return;
        e.target.value='';
        if(typeof _openCropModal === 'function'){
          _openCropModal(file, 'banner', async function(blob){
            coverBtn.textContent='Uploading...';
            try{
              var upRes=await fetch('/api/upload',{method:'PUT',credentials:'include',headers:{'Content-Type':'image/webp'},body:blob});
              var upData=await upRes.json();
              if(upData.ok){
                coverUrl=upData.url;
                if(coverPreview) coverPreview.innerHTML='<img src="'+coverUrl+'" style="width:100%;height:70px;object-fit:cover;border-radius:8px;margin-top:0.4rem;">';
                coverBtn.textContent='\u2713 Cover added';
              } else { coverBtn.textContent='Error - try again'; }
            }catch(err){ coverBtn.textContent='Error - try again'; }
          });
        }
      });
      submitBtn.addEventListener('click', async function(){
        var name=(document.getElementById('cs-name')||{}).value||'';
        var tags=(document.getElementById('cs-tags')||{}).value||'';
        var desc=(document.getElementById('cs-desc')||{}).value||'';
        var cat=(document.getElementById('cs-cat')||{}).value||'other';
        if(!name.trim()) return;
        submitBtn.disabled=true;
        try{
          var r=await fetch('/api/communities',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({action:'create',name:name.trim(),description:desc.trim(),category:cat,tags:tags,cover_url:coverUrl})});
          var d=await r.json();
          if(d.ok){ closeSheet(); loadCommunities(); }
        }catch(e){}
        submitBtn.disabled=false;
      });
    } else {
      /* Multi-file state */
      var pendingFiles = []; /* [{blob, type, previewUrl}] */

      function updateMediaGrid(){
        var grid=document.getElementById('cp-media-grid');
        var countEl=document.getElementById('cp-media-count');
        if(countEl) countEl.textContent=pendingFiles.length?'('+pendingFiles.length+'/10)':'';
        if(!grid) return;
        grid.innerHTML=pendingFiles.map(function(f,i){
          var isVid=f.type.startsWith('video/');
          var thumb=isVid
            ?'<video src="'+f.previewUrl+'" style="width:100%;height:100%;object-fit:cover;" muted playsinline></video>'
            :'<img src="'+f.previewUrl+'" style="width:100%;height:100%;object-fit:cover;">';
          return '<div style="position:relative;width:calc(33.3% - 0.3rem);aspect-ratio:1;background:var(--surface-3);border-radius:8px;overflow:hidden;">'
            +thumb
            +'<button data-rm-idx="'+i+'" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.65);border:none;color:#fff;border-radius:50%;width:20px;height:20px;font-size:0.6rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">&#10005;</button>'
          +'</div>';
        }).join('');
        /* Remove buttons */
        grid.querySelectorAll('button[data-rm-idx]').forEach(function(btn){
          btn.addEventListener('click',function(){
            var idx=parseInt(btn.getAttribute('data-rm-idx'));
            pendingFiles.splice(idx,1); updateMediaGrid();
          });
        });
      }

      var mediaBtn=document.getElementById('cp-media-btn');
      var fileInput=document.getElementById('cp-file-input');
      if(mediaBtn) mediaBtn.addEventListener('click',function(){
        if(pendingFiles.length>=10) return;
        fileInput.click();
      });
      if(fileInput) fileInput.addEventListener('change',async function(e){
        var files=Array.from(e.target.files).slice(0, 10-pendingFiles.length);
        for(var i=0;i<files.length;i++){
          var file=files[i];
          var isVideo=file.type.startsWith('video/');
          var isGif=file.type==='image/gif'||file.name.toLowerCase().endsWith('.gif');
          if(isVideo||isGif){
            pendingFiles.push({blob:file,type:file.type,previewUrl:URL.createObjectURL(file)});
          } else {
            await new Promise(function(res){
              var img2=new Image(); var u2=URL.createObjectURL(file);
              img2.onload=function(){
                var maxW=1440; var ratio=Math.min(maxW/img2.width,1);
                var canvas=document.createElement('canvas');
                canvas.width=Math.round(img2.width*ratio); canvas.height=Math.round(img2.height*ratio);
                canvas.getContext('2d').drawImage(img2,0,0,canvas.width,canvas.height);
                URL.revokeObjectURL(u2);
                canvas.toBlob(function(blob){
                  var reader=new FileReader(); reader.onload=function(ev){
                    pendingFiles.push({blob:blob,type:'image/webp',previewUrl:ev.target.result});
                    res();
                  }; reader.readAsDataURL(blob);
                },'image/webp',0.88);
              }; img2.src=u2;
            });
          }
        }
        updateMediaGrid();
        e.target.value='';
      });

      /* ── Voice recording ── */
      var micBtn = document.getElementById('cp-mic-btn');
      var audioPreview = document.getElementById('cp-audio-preview');
      var mediaRecorder = null;
      var audioChunks = [];
      var pendingAudio = null; /* {blob, type} */
      var isRecording = false;

      if (micBtn) {
        micBtn.addEventListener('click', async function() {
          if (isRecording) {
            /* Stop recording */
            mediaRecorder.stop();
            return;
          }
          try {
            var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            var mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/ogg';
            mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
            audioChunks = [];
            mediaRecorder.ondataavailable = function(e) { if (e.data.size > 0) audioChunks.push(e.data); };
            mediaRecorder.onstop = function() {
              stream.getTracks().forEach(function(t) { t.stop(); });
              var blob = new Blob(audioChunks, { type: mimeType });
              pendingAudio = { blob: blob, type: mimeType };
              /* Show preview player */
              var url = URL.createObjectURL(blob);
              audioPreview.style.display = 'block';
              audioPreview.innerHTML = '<audio controls style="width:100%;border-radius:8px;margin-top:0.25rem;" src="' + url + '"></audio>'
                + '<button style="background:none;border:none;color:var(--text-muted);font-size:0.7rem;cursor:pointer;margin-top:0.2rem;" id="cp-audio-remove">&#10005; Remove voice note</button>';
              document.getElementById('cp-audio-remove').onclick = function() {
                pendingAudio = null;
                audioPreview.style.display = 'none';
                audioPreview.innerHTML = '';
              };
              isRecording = false;
              micBtn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> Voice Note';
              micBtn.style.color = '';
              micBtn.style.borderColor = '';
            };
            mediaRecorder.start();
            isRecording = true;
            micBtn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Stop Recording';
            micBtn.style.color = '#ff4444';
            micBtn.style.borderColor = '#ff4444';
          } catch(err) {
            alert('Microphone access denied. Please allow microphone in your browser settings.');
          }
        });
      }

      submitBtn.addEventListener('click', async function(){
        var ta=document.getElementById('cp-body-ta');
        var text=ta?ta.value.trim():'';
        if(!text&&!pendingFiles.length&&!pendingAudio) return;
        if(!currentThread) return;
        submitBtn.disabled=true; submitBtn.textContent='Posting...';
        try{
          /* Subir todos los archivos en paralelo */
          var mediaUrls=[];
          for(var fi=0;fi<pendingFiles.length;fi++){
            var pf=pendingFiles[fi];
            var upRes=await fetch('/api/upload',{method:'PUT',credentials:'include',headers:{'Content-Type':pf.type},body:pf.blob});
            var upData=await upRes.json();
            if(upData.ok) mediaUrls.push(upData.url);
          }
          /* Upload voice note if present */
          var audioUrl='';
          if(pendingAudio){
            var auRes=await fetch('/api/upload',{method:'PUT',credentials:'include',headers:{'Content-Type':pendingAudio.type},body:pendingAudio.blob});
            var auData=await auRes.json();
            if(auData.ok) audioUrl=auData.url;
          }
          var r=await fetch('/api/community-posts',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({action:'post',community_id:currentThread.id,body:text||' ',image_url:mediaUrls[0]||'',media_urls:JSON.stringify(mediaUrls),audio_url:audioUrl})});
          var d=await r.json();
          if(d.ok){ pendingAudio=null; closeSheet(); loadThreadPosts(currentThread.id); }
          else{ var toast=document.getElementById('toast'); if(toast){toast.textContent=d.error||'Error';toast.classList.add('show');setTimeout(function(){toast.classList.remove('show');},3000);} }
        }catch(e){}
        submitBtn.disabled=false; submitBtn.textContent='Post';
      });
    }
  }

  /* Render thread card */
  function renderThreadCard(t){
    var tags=(t.tags||'').split(',').filter(Boolean);
    var tagHtml=tags.slice(0,4).map(function(tg){ return '<span class="comm-card-tag">#'+escH(tg)+'</span>'; }).join('');
    return '<div class="comm-card" data-comm-id="'+t.id+'">'
      +'<div class="comm-card-cover">'
        +(t.cover_url?'<img src="'+t.cover_url+'" loading="lazy" alt="">':'')
        +'<div class="comm-card-cover-glow"></div><div class="comm-card-cover-pat"></div>'
        +'<div class="comm-cat-tag">'+catLabel(t.category)+'</div>'
      +'</div>'
      +'<div class="comm-card-thumbs" id="thumbs-'+t.id+'"></div>'
      +'<div class="comm-card-body">'
        +'<div class="comm-card-name">'+escH(t.name)+'</div>'
        +(t.description?'<div class="comm-card-desc">'+escH(t.description)+'</div>':'')
        +(tagHtml?'<div class="comm-card-tags">'+tagHtml+'</div>':'')
        +'<div class="comm-card-foot">'
          +'<div class="comm-card-stats">'
            +'<div class="comm-card-stat"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'+(t.member_count||1)+'</div>'
            +'<div class="comm-card-stat"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+(t.post_count||0)+' posts</div>'
          +'</div>'
          +'<button class="comm-join-btn'+(t.is_member?' joined':'')+'" data-comm-id="'+t.id+'" data-joined="'+(t.is_member?'1':'0')+'">'+(t.is_member?'&#10003; Joined':'Join')+'</button>'
        +'</div>'
        +(t.last_activity?'<div class="comm-card-activity">Active '+timeAgo(t.last_activity)+'</div>':'')
      +'</div>'
    +'</div>';
  }

  /* Load communities */
  function loadCommunities(){
    var feed=document.getElementById('comm-feed');
    if(!feed) return;
    feed.innerHTML='<div class="comm-loading">Loading threads...</div>';
    var url='/api/communities?sort='+currentSort+'&popular_tags=1';
    if(currentCategory&&currentCategory!=='all') url+='&category='+currentCategory;
    if(currentTag) url+='&tag='+encodeURIComponent(currentTag);
    var search=(document.getElementById('comm-search-input')||{}).value||'';
    if(search.trim()) url+='&q='+encodeURIComponent(search.trim());
    fetch(url,{credentials:'include'}).then(function(r){return r.json();}).then(function(d){
      var threads=d.threads||[];
      /* Popular tags */
      var tagsRow=document.getElementById('thread-tags-row');
      if(tagsRow&&d.popular_tags&&d.popular_tags.length){
        tagsRow.innerHTML=d.popular_tags.map(function(tg){
          return '<button class="thread-tag-chip'+(currentTag===tg?' active':'')+'" data-tag="'+escH(tg)+'">#'+escH(tg)+'</button>';
        }).join('');
      }
      if(!threads.length){ feed.innerHTML='<div class="comm-empty">No threads yet.<br>Be the first to create one!</div>'; return; }
      feed.innerHTML=threads.map(renderThreadCard).join('')+'<div style="height:4rem;"></div>';
    }).catch(function(){ feed.innerHTML='<div class="comm-empty">Could not load threads.</div>'; });
  }

  /* Render thread post */
  function renderThreadPost(p, isCreator){
    var isLiked=COMM_LIKED.has(String(p.id));
    var _avUrlT=(window._resolveAvatar||function(u,a){return a||'';})(p.user_id,p.user_avatar);
    var avContent=_avUrlT?'<img src="'+_avUrlT+'" loading="lazy">':escH((p.user_name||'?').charAt(0).toUpperCase());
    var mediaHtml='';
    var mediaList=[];
    try{ if(p.media_urls) mediaList=JSON.parse(p.media_urls); }catch(e){}
    if(!mediaList.length && p.image_url) mediaList=[p.image_url];
    if(mediaList.length===1){
      var lo=mediaList[0].toLowerCase().split('?')[0];
      var tvSingleEnc=encodeURIComponent(JSON.stringify(mediaList));
      mediaHtml=lo.endsWith('.mp4')||lo.endsWith('.webm')
        ?'<video class="comm-post-vid" src="'+mediaList[0]+'" muted playsinline controls controlslist="nodownload" oncontextmenu="return false"></video>'
        :'<img class="comm-post-img" src="'+mediaList[0]+'" loading="lazy" style="cursor:pointer;" data-tv-idx="0" data-tv-urls="'+tvSingleEnc+'">';
    } else if(mediaList.length>1){
      /* Álbum grid */
      var cols=mediaList.length===2?2:3;
      var tvUrlsEnc=encodeURIComponent(JSON.stringify(mediaList));
      mediaHtml='<div class="thread-album" style="display:grid;grid-template-columns:repeat('+cols+',1fr);gap:3px;margin-bottom:0.6rem;border-radius:10px;overflow:hidden;" data-tv-urls="'+tvUrlsEnc+'">';
      mediaList.slice(0,9).forEach(function(url,idx){
        var lo2=url.toLowerCase().split('?')[0];
        var isV=lo2.endsWith('.mp4')||lo2.endsWith('.webm');
        var extra=mediaList.length>9&&idx===8?'<div style="position:absolute;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:1.2rem;color:#fff;">+'+( mediaList.length-9)+'</div>':'';
        var cellStyle=isV?'position:relative;overflow:hidden;background:#111;cursor:pointer;':'position:relative;aspect-ratio:1;overflow:hidden;background:#111;cursor:pointer;';
        mediaHtml+='<div style="'+cellStyle+'" data-tv-idx="'+idx+'">'
          +(isV?'<video src="'+url+'" style="width:100%;display:block;" muted playsinline controlslist="nodownload" oncontextmenu="return false"></video>'
              :'<img src="'+url+'" style="width:100%;height:100%;object-fit:cover;" loading="lazy">')
          +extra+'</div>';
      });
      mediaHtml+='</div>';
    }
    var audioHtml = p.audio_url
      ? '<div class="hw-audio-player" data-src="' + p.audio_url + '">'        + '<button class="hw-audio-play" onclick="window._hwAudioPlay(this)" aria-label="Play">'          + '<svg class="hw-play-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>'          + '<svg class="hw-pause-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'        + '</button>'        + '<div class="hw-audio-bar">'          + '<div class="hw-audio-progress"><div class="hw-audio-fill"></div></div>'          + '<span class="hw-audio-time">0:00</span>'        + '</div>'        + '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-muted);flex-shrink:0;"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>'      + '</div>'      : '';
    var body=p.body&&p.body.trim()&&p.body.trim()!==' '?'<div class="comm-post-body">'+escH(p.body)+'</div>':'';
    var pinnedBadge=p.is_pinned?'<div class="comm-post-pin-label">&#128204; Pinned post</div>':'';
    return '<div class="comm-post'+(p.is_pinned?' pinned':'')+'" data-cpost-id="'+p.id+'" data-cpost-uid="'+escH(p.user_id||'')+'">'
      +pinnedBadge
      +'<div class="comm-post-header">'
        +'<div class="comm-post-av" data-profile-uid="'+escH(p.user_id||'')+'" data-profile-name="'+escH(p.user_name||'')+'">'+avContent+'</div>'
        +'<div style="flex:1;">'
          +'<div class="comm-post-uname" data-profile-uid="'+escH(p.user_id||'')+'" data-profile-name="'+escH(p.user_name||'')+'">'+escH(p.user_name||'Anonymous')+'</div>'
          +'<div class="comm-post-time">'+timeAgo(p.created_at)+'</div>'
        +'</div>'
      +'</div>'
      +mediaHtml+audioHtml+body
      +'<div class="comm-post-actions">'
        +'<button class="comm-post-act'+(isLiked?' liked':'')+'" data-clike-id="'+p.id+'">'
          +'<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'+(p.like_count||'')
        +'</button>'
        +'<button class="comm-post-act" data-ccomment-id="'+p.id+'">'
          +'<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+(p.comment_count||'')
        +'</button>'
        +(isCreator?
          '<button class="comm-post-act creator-act" data-cpin-id="'+p.id+'" title="Pin post">&#128204;</button>'
          +'<button class="comm-post-act creator-act" data-chide-id="'+p.id+'" title="Hide post">&#128683;</button>'
          +'<button class="comm-post-act creator-act" data-cban-uid="'+escH(p.user_id||'')+'" title="Ban user">&#128468;</button>'
          :'')
        +'<button class="comm-post-act comm-report-btn" data-crep-id="'+p.id+'">'
          +'<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>'
          +' Report'
        +'</button>'
      +(window._adminIsOn&&window._adminIsOn()? '<button class="adm-del-btn" onclick="window._adminDelThreadPost('+p.id+',\''+escH(p.user_id||'')+'\',this)" title="Delete">&#128465;</button>' :'')
      +'</div>'
    +'</div>';
  }

  /* Load thread posts */
  function loadThreadPosts(threadId){
    var scroll=document.getElementById('comm-posts-inner');
    if(!scroll) return;
    scroll.innerHTML='<div class="comm-loading">Loading posts...</div>';
    var isCreator=currentThread&&window.currentUser&&currentThread.creator_id===window.currentUser.id;
    fetch('/api/community-posts?community_id='+threadId,{credentials:'include'})
      .then(function(r){return r.json();})
      .then(function(d){
        var posts=d.posts||[];
        if(!posts.length){ scroll.innerHTML='<div class="comm-empty">No posts yet.<br>Be the first to post!</div>'; return; }
        scroll.innerHTML=posts.map(function(p){return renderThreadPost(p,isCreator);}).join('')+'<div style="height:4rem;"></div>';
        setTimeout(function(){ if(window.refreshNameStyles) window.refreshNameStyles(); },80);
      }).catch(function(){ scroll.innerHTML='<div class="comm-empty">Could not load posts.</div>'; });
  }

  /* Open thread detail */
  function openThreadDetail(thread){
    currentThread=thread;
    var dp=document.getElementById('comm-detail-page');
    if(!dp) return;
    dp.style.display='block';
    document.body.style.overflow='hidden';
    var tags=(thread.tags||'').split(',').filter(Boolean);
    var tagHtml=tags.map(function(t){return '<span class="comm-detail-info-tag">#'+escH(t)+'</span>';}).join('');
    var isCreator=window.currentUser&&thread.creator_id===window.currentUser.id;
    dp.innerHTML='<div class="comm-detail" id="comm-detail-inner">'
      +'<div class="comm-detail-header">'
        +'<button class="comm-detail-back" id="cdb-btn"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>'
        +'<div class="comm-detail-name">'+escH(thread.name)+'</div>'
        +(window.currentUser?'<button class="comm-detail-post-btn" id="cdp-btn">+ Post</button>':'')
      +'</div>'
      +'<div class="comm-detail-scroll" id="comm-detail-scroll">'
        +'<div class="comm-detail-cover">'
          +(thread.cover_url?'<img src="'+thread.cover_url+'" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy">':'')
          +'<div class="comm-detail-cover-glow"></div>'
        +'</div>'
        +'<div class="comm-detail-info">'
          +'<div class="comm-detail-title">'+escH(thread.name)+'</div>'
          +(thread.description?'<div class="comm-detail-desc">'+escH(thread.description)+'</div>':'')
          +(tagHtml?'<div class="comm-detail-info-tags">'+tagHtml+'</div>':'')
          +'<div class="comm-detail-stats-row">'
            +'<div class="comm-detail-stats">'
              +'<span><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'+(thread.member_count||1)+' members</span>'
              +'<span><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+(thread.post_count||0)+' posts</span>'
            +'</div>'
            +(window.currentUser?'<button class="comm-follow-btn'+(thread.is_following?' following':'')+'" id="cd-follow-btn" data-tid="'+thread.id+'" data-following="'+(thread.is_following?'1':'0')+'">'+(thread.is_following?'&#11088; Following':'&#11088; Follow')+'</button>':'')
          +'</div>'
        +'</div>'
        +'<div id="comm-posts-inner"></div>'
      +'</div>'
    +'</div>';

    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      var inner=document.getElementById('comm-detail-inner');
      if(inner) inner.classList.add('open');
    }); });

    function closeDetail(){
      var inner2=document.getElementById('comm-detail-inner');
      if(inner2){ inner2.style.transform='translateX(100%)'; setTimeout(function(){dp.style.display='none';document.body.style.overflow='';currentThread=null;},330); }
    }

    document.getElementById('cdb-btn').addEventListener('click', closeDetail);
    if(document.getElementById('cdp-btn')) document.getElementById('cdp-btn').addEventListener('click',function(){
      if(!window.currentUser){if(typeof openAuthModal==='function')openAuthModal();return;}
      openSheet('post');
    });

    /* Follow button */
    var followBtn=document.getElementById('cd-follow-btn');
    if(followBtn) followBtn.addEventListener('click', async function(){
      var tid=parseInt(followBtn.getAttribute('data-tid'));
      var isFollowing=followBtn.getAttribute('data-following')==='1';
      var action=isFollowing?'unfollow':'follow';
      try{
        await fetch('/api/communities',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action,thread_id:tid})});
        followBtn.setAttribute('data-following',isFollowing?'0':'1');
        followBtn.textContent=isFollowing?'&#11088; Follow':'&#11088; Following';
        followBtn.classList.toggle('following',!isFollowing);
        if(currentThread) currentThread.is_following=!isFollowing;
      }catch(e){}
    });

    /* Swipe right to back */
    var inner3=document.getElementById('comm-detail-inner'); var sx2=0;
    if(inner3){
      var sy2=0;
      inner3.addEventListener('touchstart',function(e){
        sx2=e.touches[0].clientX;
        sy2=e.touches[0].clientY;
      },{passive:true});
      inner3.addEventListener('touchend',function(e){
        var dx=e.changedTouches[0].clientX-sx2;
        var dy=Math.abs(e.changedTouches[0].clientY-sy2);
        /* Solo cerrar si: empieza en el borde izquierdo (<35px) + swipe horizontal dominante + distancia suficiente */
        if(sx2<35 && dx>60 && dx>dy*2) closeDetail();
      },{passive:true});
    }

    loadThreadPosts(thread.id);

    /* Scroll: ocultar nav al bajar, mostrarlo al subir */
    var detailScroll = document.getElementById('comm-detail-scroll');
    var navBar       = document.querySelector('.bottom-nav');
    if (detailScroll && navBar) {
      var lastY = 0; var navHidden = false;
      detailScroll.addEventListener('scroll', function() {
        var y = detailScroll.scrollTop;
        var goingDown = y > lastY;
        var delta = Math.abs(y - lastY);
        lastY = y;
        if (delta < 5) return;
        if (goingDown && y > 80 && !navHidden) {
          navHidden = true;
          navBar.style.transition = 'transform 0.3s cubic-bezier(0.16,1,0.3,1)';
          navBar.style.transform = 'translateY(100%)';
        } else if (!goingDown && navHidden) {
          navHidden = false;
          navBar.style.transform = 'translateY(0)';
        }
      }, {passive:true});
    }
  }

  /* Event delegation */
  document.addEventListener('click', async function(e){
    /* Open thread */
    var card=e.target.closest('.comm-card[data-comm-id]');
    if(card&&!e.target.closest('.comm-join-btn')){
      var cid=parseInt(card.getAttribute('data-comm-id'));
      fetch('/api/communities',{credentials:'include'}).then(function(r){return r.json();}).then(function(d){
        var t=(d.threads||[]).find(function(x){return x.id===cid;});
        if(t) openThreadDetail(t);
      }).catch(function(){});
      return;
    }

    /* Join/Leave */
    var joinBtn=e.target.closest('.comm-join-btn[data-comm-id]');
    if(joinBtn){
      e.stopPropagation();
      if(!window.currentUser){if(typeof openAuthModal==='function')openAuthModal();return;}
      var cid2=parseInt(joinBtn.getAttribute('data-comm-id'));
      var joined=joinBtn.getAttribute('data-joined')==='1';
      try{
        await fetch('/api/communities',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:joined?'leave':'join',thread_id:cid2})});
        joinBtn.setAttribute('data-joined',joined?'0':'1');
        joinBtn.innerHTML=joined?'Join':'&#10003; Joined';
        joinBtn.classList.toggle('joined',!joined);
      }catch(e2){}
      return;
    }

    /* Like thread post */
    var likeBtn=e.target.closest('.comm-post-act[data-clike-id]');
    if(likeBtn){
      if(!window.currentUser){if(typeof openAuthModal==='function')openAuthModal();return;}
      var pid=String(likeBtn.getAttribute('data-clike-id'));
      var wasLiked=COMM_LIKED.has(pid);
      if(wasLiked){COMM_LIKED.delete(pid);likeBtn.classList.remove('liked');}
      else{COMM_LIKED.add(pid);likeBtn.classList.add('liked');likeBtn.style.transform='scale(1.35)';setTimeout(function(){likeBtn.style.transform='';},200);}
      saveCommLiked();
      fetch('/api/community-posts',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'like',post_id:parseInt(pid)})}).catch(function(){});
      return;
    }

    /* Comment */
    var commentBtn=e.target.closest('.comm-post-act[data-ccomment-id]');
    if(commentBtn){
      if(typeof window.openCommentsPanel==='function') window.openCommentsPanel('communitypost_'+commentBtn.getAttribute('data-ccomment-id'));
      return;
    }

    /* Report */
    var repBtn=e.target.closest('.comm-post-act[data-crep-id]');
    if(repBtn){
      if(typeof openReportSheet==='function') openReportSheet(repBtn.getAttribute('data-crep-id'));
      return;
    }

    /* Creator: pin post */
    var pinBtn=e.target.closest('.comm-post-act[data-cpin-id]');
    if(pinBtn&&currentThread){
      try{
        await fetch('/api/communities',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'pin_post',thread_id:currentThread.id,post_id:parseInt(pinBtn.getAttribute('data-cpin-id'))})});
        loadThreadPosts(currentThread.id);
      }catch(e){}
      return;
    }

    /* Creator: hide post */
    var hideBtn=e.target.closest('.comm-post-act[data-chide-id]');
    if(hideBtn){
      try{
        await fetch('/api/community-posts',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'creator_hide',post_id:parseInt(hideBtn.getAttribute('data-chide-id'))})});
        var postEl=hideBtn.closest('.comm-post');
        if(postEl){postEl.style.opacity='0.3';postEl.style.pointerEvents='none';}
      }catch(e){}
      return;
    }

    /* Creator: ban user from thread */
    var banBtn=e.target.closest('.comm-post-act[data-cban-uid]');
    if(banBtn&&currentThread){
      var banUid=banBtn.getAttribute('data-cban-uid');
      if(!banUid||!banUid.trim()) return;
      try{
        await fetch('/api/communities',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({action:'ban_user',thread_id:currentThread.id,user_id:banUid})});
        var toast2=document.getElementById('toast');
        if(toast2){toast2.textContent='User removed from thread';toast2.classList.add('show');setTimeout(function(){toast2.classList.remove('show');},2500);}
      }catch(e){}
      return;
    }

    /* Open thread media viewer */
    var tvEl = e.target.closest('[data-tv-idx]');
    if (tvEl) {
      var tvIdx2 = parseInt(tvEl.getAttribute('data-tv-idx'));
      var urlsEnc = '';
      /* Buscar data-tv-urls en el elemento o en el parent album */
      if (tvEl.hasAttribute('data-tv-urls')) {
        urlsEnc = tvEl.getAttribute('data-tv-urls');
      } else {
        var album = tvEl.closest('[data-tv-urls]');
        if (album) urlsEnc = album.getAttribute('data-tv-urls');
      }
      if (urlsEnc && typeof window.openThreadViewer === 'function') {
        try {
          var tvUrls2 = JSON.parse(decodeURIComponent(urlsEnc));
          window.openThreadViewer(tvUrls2, tvIdx2);
        } catch(err){}
      }
      return;
    }

    /* Tag chip filter */
    var tagChip=e.target.closest('.thread-tag-chip[data-tag]');
    if(tagChip){
      var tag=tagChip.getAttribute('data-tag');
      currentTag=currentTag===tag?'':tag;
      document.querySelectorAll('.thread-tag-chip').forEach(function(c){ c.classList.toggle('active',c.getAttribute('data-tag')===currentTag); });
      loadCommunities();
      return;
    }
  });

  /* Category pills */
  document.addEventListener('click', function(e){
    var pill=e.target.closest('.comm-cat-pill[data-ccat]');
    if(!pill) return;
    currentCategory=pill.getAttribute('data-ccat');
    document.querySelectorAll('.comm-cat-pill').forEach(function(p){p.classList.remove('active');});
    pill.classList.add('active');
    loadCommunities();
  });

  /* Sort tabs */
  document.addEventListener('click', function(e){
    var tab=e.target.closest('.thread-sort-tab[data-sort]');
    if(!tab) return;
    currentSort=tab.getAttribute('data-sort');
    document.querySelectorAll('.thread-sort-tab').forEach(function(t){t.classList.remove('active');});
    tab.classList.add('active');
    loadCommunities();
  });

  /* Search */
  var searchTimer=null;
  document.addEventListener('input', function(e){
    if(e.target.id!=='comm-search-input') return;
    clearTimeout(searchTimer); searchTimer=setTimeout(loadCommunities,400);
  });

  /* Create button */
  document.addEventListener('click', function(e){
    if(e.target.id!=='comm-create-btn') return;
    if(!window.currentUser){if(typeof openAuthModal==='function')openAuthModal();return;}
    openSheet('create');
  });

  /* Load on nav */
  document.querySelectorAll('.nav-item[data-page="bulge"]').forEach(function(btn){
    btn.addEventListener('click', loadCommunities);
  });

})();
})();

























