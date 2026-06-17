/* ════════════════════════════════════════════════════════════
   HW-APP.JS — Collections, Collection View, Profile Page,
               Activity Panel, Trending, Confessions, Battles
   Extraído de hw-index.js
   Depende de: hw-auth.js, hw-social.js, hw-feed.js
   ════════════════════════════════════════════════════════════ */

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
    if (id==='clips'){
      var cc=document.getElementById('clips-feed-container');
      if (cc && !cc.dataset.loaded && window.currentUser) {
        cc.dataset.loaded='1';
        cc.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">Loading...</div>';
        fetch('/api/posts?action=clips&user_id='+encodeURIComponent(window.currentUser.id))
          .then(function(r){return r.json();})
          .then(function(d){
            var posts=d.posts||[];
            if(!posts.length){cc.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">No clips yet. Post a video to see it here.</div>';return;}
            cc.innerHTML=posts.map(window.renderPost||function(p){return '';}).join('');
            if(window._activateLazyGifs)window._activateLazyGifs(cc);
            if(window.loadAllLikes)window.loadAllLikes();
            if(window.loadAllCommentCounts)window.loadAllCommentCounts();
          }).catch(function(){cc.innerHTML='<div style="padding:2rem;text-align:center;color:var(--text-dim);font-size:0.82rem;">Could not load.</div>';});
      }
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
      /* Esperar un frame: el modal recién pasó de display:none a flex,
         y getBoundingClientRect() puede devolver 0x0 si se lee en el
         mismo frame (causa de la pantalla negra en Android). */
      requestAnimationFrame(function() {
        var vpr = vp.getBoundingClientRect();
        _vpW = vpr.width; _vpH = vpr.height;
        if (!_vpW || !_vpH) {
          /* Fallback de emergencia — reintentar un frame más */
          requestAnimationFrame(function() {
            var vpr2 = vp.getBoundingClientRect();
            _vpW = vpr2.width || window.innerWidth;
            _vpH = vpr2.height || window.innerHeight * 0.7;
            _finishCropSetup(type);
          });
          return;
        }
        _finishCropSetup(type);
      });
    };
    imgEl.src = objURL;
  }
  window._openCropModal = _openCropModal;

  function _finishCropSetup(type) {
    var imgEl = document.getElementById('hw-crop-img');
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
  }

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

})();
