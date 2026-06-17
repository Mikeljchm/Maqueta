/* ════════════════════════════════════════════════════════════
   HW-SOCIAL.JS — Comments Panel, Mini Profile, Stickers
   Extraído de hw-index.js
   Depende de: hw-auth.js (window.currentUser)
   Expone: window.openCommentsPanel, window.openMiniProfile,
           window._activateLazyGifs, window._resolveAvatar,
           window.applyNameStyle, window.openStickerPanel, ...
   ════════════════════════════════════════════════════════════ */


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
    window._viewingProfileOf = uid; /* Flag para renderPost — siempre mostrar report en perfil ajeno */
    /* Guard: si ya está abriendo este uid, no duplicar */
    if (window._currentMiniProfileUid === uid && document.getElementById('page-user-profile')?.style.display !== 'none') return;
    window._currentMiniProfileUid = uid;
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
      '<div style="flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;min-height:0;">'        + '<div style="position:relative;flex-shrink:0;">'          + '<div id="uprof-banner" style="width:100%;height:260px;background:linear-gradient(135deg,#1a0505,#2d0a00,#1a0505);position:relative;overflow:hidden;">'            + '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 100%,rgba(255,69,0,0.45) 0%,transparent 70%);pointer-events:none;"></div>'            + '<div style="position:absolute;inset:0;opacity:0.04;background-image:repeating-linear-gradient(45deg,#FF4500 0,#FF4500 1px,transparent 0,transparent 50%);background-size:12px 12px;pointer-events:none;"></div>'          + '</div>'          + '<button id="uprof-back" style="position:absolute;top:0.6rem;left:0.75rem;z-index:20;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:none;color:#fff;cursor:pointer;">'            + '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>'          + '</button>'          + '<div style="position:absolute;bottom:-30px;left:50%;transform:translateX(-50%);z-index:5;">'            + '<div id="uprof-av" style="width:84px;height:84px;border-radius:50%;border:3px solid var(--bg);background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-family:var(--font-d);font-size:2rem;overflow:hidden;">'+escH((name||'?').charAt(0).toUpperCase())+'</div>'          + '</div>'        + '</div>'        + '<div style="height:38px;"></div>'        + '<div style="text-align:center;padding:0 1rem 0;">'          + '<div id="uprof-name" style="font-family:var(--font-d);font-size:1.3rem;letter-spacing:0.04em;margin-bottom:0.05rem;">'+escH(name||'User')+'</div>'          + '<div id="uprof-username-display" style="font-size:0.75rem;color:var(--text-dim);margin-bottom:0.05rem;"></div>'          + '<div id="uprof-badge" style="display:inline-flex;align-items:center;gap:0.3rem;font-size:0.6rem;letter-spacing:0.1em;padding:0.18rem 0.6rem;border-radius:20px;background:var(--surface-3);color:var(--text-dim);font-family:var(--font-d);margin-top:0.1rem;"></div>'        + '</div>'        + '<div id="uprof-bio" style="text-align:center;font-size:0.78rem;color:var(--text-dim);line-height:1.5;padding:0.1rem 1.5rem 0;"></div>'        + (window.currentUser && window.currentUser.id !== uid            ? '<div style="padding:0.2rem 1rem 0;"><button id="uprof-fb" style="width:100%;background:var(--fire-orange);color:#fff;border:none;border-radius:25px;padding:0.5rem;font-family:var(--font-d);font-size:0.85rem;letter-spacing:0.06em;cursor:pointer;">Follow</button></div>'            : '')        + '<div style="display:flex;justify-content:center;padding:0.15rem 1rem 0.1rem;">'          + '<div style="flex:1;text-align:center;"><div id="uprof-pc" style="font-family:var(--font-d);font-size:1.05rem;line-height:1;">-</div><div style="font-size:0.62rem;color:var(--text-dim);margin-top:0.15rem;">Posts</div></div>'          + '<div style="flex:1;text-align:center;"><div id="uprof-fr" style="font-family:var(--font-d);font-size:1.05rem;line-height:1;">-</div><div style="font-size:0.62rem;color:var(--text-dim);margin-top:0.15rem;">Followers</div></div>'          + '<div style="flex:1;text-align:center;"><div id="uprof-fg" style="font-family:var(--font-d);font-size:1.05rem;line-height:1;">-</div><div style="font-size:0.62rem;color:var(--text-dim);margin-top:0.15rem;">Following</div></div>'        + '</div>'        + '<div style="display:flex;border-bottom:1px solid var(--border);border-top:1px solid var(--border);position:sticky;top:0;background:var(--bg);z-index:2;">'          + '<button class="uprof-tab active" data-utab="posts" style="flex:1;padding:0.55rem 0;background:none;border:none;border-bottom:2px solid var(--fire-orange);color:var(--fire-orange);font-family:var(--font-b);font-size:0.65rem;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;">Posts</button>'
          + '<button class="uprof-tab" data-utab="clips" style="flex:1;padding:0.55rem 0;background:none;border:none;border-bottom:2px solid transparent;color:var(--text-dim);font-family:var(--font-b);font-size:0.65rem;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;">Clips</button>'
          + '<button class="uprof-tab" data-utab="collections" style="flex:1;padding:0.55rem 0;background:none;border:none;border-bottom:2px solid transparent;color:var(--text-dim);font-family:var(--font-b);font-size:0.65rem;letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;">Collections</button>'        + '</div>'        + '<div id="uprof-posts-panel" style="padding:0.75rem 1rem 3rem;"><div style="color:var(--text-dim);font-size:0.82rem;text-align:center;padding:1.5rem;">Loading...</div></div>'        + '<div id="uprof-clips-panel" style="display:none;padding:0.75rem 1rem 3rem;"></div>'        + '<div id="uprof-collections-panel" style="display:none;padding:0.75rem 1rem 3rem;"></div>'      + '</div>'
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ page.style.transform='translateX(0)'; }); });

    function closeUProf(){ page.style.transform='translateX(100%)'; setTimeout(function(){ page.style.display='none'; window._viewingProfileOf=null; window._currentMiniProfileUid=null; },330); }
    document.getElementById('uprof-back').addEventListener('click', closeUProf);
    /* Click en colección del perfil ajeno */
    page.addEventListener('click', function(ev){
      var card = ev.target.closest('.my-col-card[data-col-id]');
      if (!card) return;
      var cid = card.getAttribute('data-col-id');
      var cname = decodeURIComponent(card.getAttribute('data-col-name')||'');
      if (window.openCollection) window.openCollection(parseInt(cid), cname);
    });
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
        /* Limpiar guards de lazy-load para que cada perfil cargue fresh */
        var cp3=document.getElementById('uprof-clips-panel');
        var colP3=document.getElementById('uprof-collections-panel');
        if(cp3) { cp3.dataset.loaded=''; cp3.innerHTML=''; }
        if(colP3) { colP3.dataset.loaded=''; colP3.innerHTML=''; }
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
        document.getElementById('uprof-clips-panel').style.display=tab==='clips'?'':'none';
        document.getElementById('uprof-collections-panel').style.display=tab==='collections'?'':'none';
        if(tab==='clips'){
          var cp2=document.getElementById('uprof-clips-panel');
          if(cp2&&!cp2.dataset.loaded){
            cp2.dataset.loaded='1';
            cp2.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">Loading...</div>';
            fetch('/api/posts?action=clips&user_id='+encodeURIComponent(uid))
              .then(function(r){return r.json();}).then(function(d){
                var posts=d.posts||[];
                if(!posts.length){cp2.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">No clips yet.</div>';return;}
                cp2.innerHTML=posts.map(window.renderPost||function(p){return '';}).join('');
                if(window._activateLazyGifs)window._activateLazyGifs(cp2);
                if(window.loadAllLikes)window.loadAllLikes();
                if(window.loadAllCommentCounts)window.loadAllCommentCounts();
              }).catch(function(){cp2.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">Could not load.</div>';});
          }
        }
        if(tab==='collections'){
          var colP=document.getElementById('uprof-collections-panel');
          if(colP&&!colP.dataset.loaded){
            colP.dataset.loaded='1';
            colP.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">Loading...</div>';
            fetch('/api/collections?user_id='+encodeURIComponent(uid))
              .then(function(r){return r.json();}).then(function(d){
                var cols=d.collections||[];
                if(!cols.length){colP.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">No collections yet.</div>';return;}
                var html='<div class="my-cols-grid">';
                cols.forEach(function(col){
                  var cells=['','','',''].map(function(_,i){
                    return col.images&&col.images[i]
                      ?'<img src="'+col.images[i]+'" loading="lazy">'
                      :'<div class="empty-cell"></div>';
                  }).join('');
                  html+='<div class="my-col-card" data-col-id="'+col.id+'" data-col-name="'+encodeURIComponent(col.name)+'">' 
                    +'<div class="my-col-card-thumb">'+cells+'</div>'
                    +'<div class="my-col-card-info">'
                    +'<div class="my-col-card-name">'+col.name.toUpperCase()+'</div>'
                    +'<div class="my-col-card-count">'+(col.count||0)+' posts</div>'
                    +'</div></div>';
                });
                html+='</div>';
                colP.innerHTML=html;
              }).catch(function(){colP.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">Could not load.</div>';});
          }
        }
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
