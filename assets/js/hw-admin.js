/* ════════════════════════════════════════════════════════════
   HW-ADMIN.JS — Notifications, Suggestions, Broadcast,
                 Admin Panel Central, Inline Edit posts
   Extraído de hw-index.js
   Depende de: hw-auth.js (window.currentUser)
               hw-social.js (window.openMiniProfile)
               hw-feed.js (window.loadPoll)
   Expone: window._adminBanUser, window._adminIsOn,
           window._initNotifBtn, window._initBroadcast,
           window._toggleFollow, window._openAdminPanel, ...
   ════════════════════════════════════════════════════════════ */

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
      var admPanBtn = document.getElementById('adm-panel-btn');
      if (admPanBtn) admPanBtn.style.display = 'flex';
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
  /* ── PANEL ADMIN CENTRAL ── */
  (function(){
    /* escH local — el IIFE de posts no está en scope aquí */
    function escH(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    var s = document.createElement('style');
    s.textContent = [
      '#adm-panel{position:fixed;inset:0;background:var(--bg);z-index:800;display:none;flex-direction:column;transform:translateX(100%);transition:transform 0.35s cubic-bezier(0.16,1,0.3,1);}',
      '#adm-panel.open{display:flex;transform:translateX(0);}',
      '.adm-header{display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1rem;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;}',
      '.adm-back{background:none;border:none;color:var(--text);width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}',
      '.adm-title{font-family:var(--font-d);font-size:1rem;letter-spacing:0.08em;flex:1;}',
      '.adm-tabs{display:flex;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;overflow-x:auto;}',
      '.adm-tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--text-dim);font-family:var(--font-b);font-size:0.62rem;letter-spacing:0.06em;text-transform:uppercase;padding:0.6rem 0.85rem;cursor:pointer;white-space:nowrap;}',
      '.adm-tab.active{color:var(--fire-orange);border-bottom-color:var(--fire-orange);}',
      '.adm-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;}',
      '.adm-section{padding:0.85rem;}',
      /* Stats */
      '.adm-stats{display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:0.85rem;}',
      '.adm-stat{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:0.85rem;text-align:center;}',
      '.adm-stat-n{font-family:var(--font-d);font-size:1.6rem;color:var(--fire-orange);}',
      '.adm-stat-l{font-size:0.62rem;color:var(--text-dim);letter-spacing:0.06em;margin-top:0.15rem;}',
      /* Report cards */
      '.adm-report{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:0.85rem;margin-bottom:0.65rem;}',
      '.adm-report-reason{display:inline-block;font-size:0.6rem;letter-spacing:0.08em;font-family:var(--font-d);padding:0.15rem 0.5rem;border-radius:10px;margin-bottom:0.4rem;}',
      '.adm-report-reason.copyright{background:rgba(255,69,0,0.15);color:var(--fire-orange);}',
      '.adm-report-reason.underage{background:rgba(204,0,0,0.2);color:#ff4444;}',
      '.adm-report-reason.spam{background:rgba(255,184,0,0.12);color:var(--fire-yellow);}',
      '.adm-report-reason.other,.adm-report-reason.harassment,.adm-report-reason.illegal{background:var(--surface-3);color:var(--text-dim);}',
      '.adm-report-body{font-size:0.75rem;color:var(--text-dim);margin-bottom:0.5rem;line-height:1.4;}',
      '.adm-report-meta{font-size:0.62rem;color:var(--text-muted);margin-bottom:0.6rem;}',
      '.adm-report-actions{display:flex;gap:0.4rem;flex-wrap:wrap;}',
      '.adm-btn{border:none;border-radius:8px;padding:0.3rem 0.65rem;font-size:0.68rem;font-family:var(--font-b);cursor:pointer;}',
      '.adm-btn-dismiss{background:var(--surface-3);color:var(--text-dim);}',
      '.adm-btn-confirm{background:rgba(255,69,0,0.15);color:var(--fire-orange);}',
      '.adm-btn-delete{background:rgba(204,0,0,0.15);color:#ff4444;}',
      '.adm-btn-view{background:var(--surface-2);color:var(--text);}',
      /* User cards */
      '.adm-user{display:flex;align-items:center;gap:0.75rem;padding:0.65rem 0;border-bottom:1px solid var(--border);}',
      '.adm-user-av{width:38px;height:38px;border-radius:50%;background:var(--surface-3);overflow:hidden;flex-shrink:0;}',
      '.adm-user-av img{width:100%;height:100%;object-fit:cover;}',
      '.adm-user-info{flex:1;min-width:0;}',
      '.adm-user-name{font-size:0.8rem;color:var(--text);font-family:var(--font-b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.adm-user-meta{font-size:0.62rem;color:var(--text-muted);}',
      '.adm-user-actions{display:flex;gap:0.3rem;flex-shrink:0;}',
      '.adm-badge-suspended{background:rgba(204,0,0,0.2);color:#ff4444;font-size:0.58rem;padding:0.1rem 0.4rem;border-radius:8px;font-family:var(--font-d);}',
      '.adm-badge-strikes{background:rgba(255,69,0,0.15);color:var(--fire-orange);font-size:0.58rem;padding:0.1rem 0.4rem;border-radius:8px;font-family:var(--font-d);}',
      '.adm-search{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:0.5rem 0.75rem;font-size:0.8rem;outline:none;box-sizing:border-box;margin-bottom:0.75rem;}',
      '.adm-filter-tabs{display:flex;gap:0.4rem;margin-bottom:0.75rem;flex-wrap:wrap;}',
      '.adm-filter-tab{background:var(--surface-2);border:1px solid var(--border);color:var(--text-dim);font-size:0.62rem;padding:0.25rem 0.65rem;border-radius:20px;cursor:pointer;font-family:var(--font-b);}',
      '.adm-filter-tab.active{background:var(--fire-orange);color:#fff;border-color:var(--fire-orange);}',
      '.adm-empty{text-align:center;padding:2.5rem 1rem;color:var(--text-muted);font-size:0.8rem;}',
    ].join('');
    document.head.appendChild(s);

    /* Crear el panel */
    var panel = document.createElement('div'); panel.id='adm-panel';
    panel.innerHTML = '<div class="adm-header">'
      + '<button class="adm-back" id="adm-back"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>'
      + '<div class="adm-title">&#128272; ADMIN PANEL</div>'
      + '</div>'
      + '<div class="adm-tabs">'
        + '<button class="adm-tab active" data-adm-tab="dashboard">&#128200; Dashboard</button>'
        + '<button class="adm-tab" data-adm-tab="reports">&#128681; Reports</button>'
        + '<button class="adm-tab" data-adm-tab="users">&#128101; Users</button>'
        + '<button class="adm-tab" data-adm-tab="posts">&#128444; Posts</button>'
        + '<button class="adm-tab" data-adm-tab="threads">&#128172; Threads</button>'
      + '</div>'
      + '<div class="adm-body" id="adm-body"></div>';
    document.body.appendChild(panel);

    document.getElementById('adm-back').addEventListener('click', function(){ panel.classList.remove('open'); });

    /* Tab switcher */
    panel.querySelectorAll('.adm-tab[data-adm-tab]').forEach(function(btn){
      btn.addEventListener('click', function(){
        panel.querySelectorAll('.adm-tab').forEach(function(b){ b.classList.remove('active'); });
        btn.classList.add('active');
        loadAdmTab(btn.getAttribute('data-adm-tab'));
      });
    });

    async function loadAdmTab(tab) {
      var body = document.getElementById('adm-body');
      body.innerHTML = '<div class="adm-section adm-empty">Loading...</div>';

      if (tab === 'dashboard') {
        try {
          var r = await fetch('/api/admin/stats', {credentials:'include'});
          var d = await r.json();
          body.innerHTML = '<div class="adm-section">'
            + '<div class="adm-stats">'
              + '<div class="adm-stat"><div class="adm-stat-n">'+d.users+'</div><div class="adm-stat-l">USERS</div></div>'
              + '<div class="adm-stat"><div class="adm-stat-n">'+d.posts+'</div><div class="adm-stat-l">POSTS</div></div>'
              + '<div class="adm-stat" style="border-color:rgba(255,69,0,0.3)"><div class="adm-stat-n" style="color:#ff4444">'+d.pending_reports+'</div><div class="adm-stat-l">PENDING REPORTS</div></div>'
              + '<div class="adm-stat"><div class="adm-stat-n" style="color:var(--text-dim)">'+d.hidden_posts+'</div><div class="adm-stat-l">HIDDEN POSTS</div></div>'
            + '</div>'
            + (d.pending_reports > 0 ? '<div style="background:rgba(255,69,0,0.08);border:1px solid rgba(255,69,0,0.2);border-radius:12px;padding:0.75rem;font-size:0.75rem;color:var(--fire-orange);">&#9888; '+d.pending_reports+' report(s) need your attention</div>' : '')
          + '</div>';
        } catch(e) { body.innerHTML = '<div class="adm-empty">Error loading stats</div>'; }
      }

      else if (tab === 'reports') {
        var currentStatus = 'pending';
        async function loadReports(status) {
          currentStatus = status;
          body.innerHTML = '<div class="adm-section"><div class="adm-filter-tabs">'
            + ['pending','resolved','dismissed'].map(function(s){
                return '<button class="adm-filter-tab'+(s===status?' active':'')+'" data-rs="'+s+'">'+s.charAt(0).toUpperCase()+s.slice(1)+'</button>';
              }).join('')
            + '</div><div id="adm-reports-list"><div class="adm-empty">Loading...</div></div></div>';
          body.querySelectorAll('.adm-filter-tab[data-rs]').forEach(function(b){
            b.addEventListener('click', function(){ loadReports(b.getAttribute('data-rs')); });
          });
          try {
            var r = await fetch('/api/admin/reports?status='+status, {credentials:'include'});
            var d = await r.json();
            var list = document.getElementById('adm-reports-list');
            if (!d.reports || !d.reports.length) { list.innerHTML='<div class="adm-empty">No '+status+' reports</div>'; return; }
            list.innerHTML = d.reports.map(function(rep){
              var mediaHtml = rep.post_image ? '<img src="'+rep.post_image+'" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;margin-bottom:0.4rem;">' : '';
              var postBodyHtml = rep.post_body ? '<div class="adm-report-body">'+escH(rep.post_body.slice(0,120))+'</div>' : '';
              var dmcaExtra = rep.reason==='copyright' && (rep.reporter_email||rep.original_url||rep.reporter_name) ?
                '<div style="font-size:0.62rem;color:var(--text-dim);margin-bottom:0.4rem;">'
                  +(rep.reporter_name?'&#128100; '+escH(rep.reporter_name)+' &nbsp;':'')
                  +(rep.reporter_email?'&#128140; '+escH(rep.reporter_email)+'<br>':'')
                  +(rep.original_url?'&#128279; <a href="'+escH(rep.original_url)+'" target="_blank" style="color:var(--fire-orange);">View original</a><br>':'')
                  +(rep.details?'&#128221; '+escH(rep.details):'')
                +'</div>' : '';
               var actions = status==='pending' ? (
                 '<button class="adm-btn adm-btn-dismiss" data-adm-rid="'+rep.id+'" data-adm-action="dismiss" data-adm-pid="'+rep.post_id+'" data-adm-owner="'+escH(rep.post_owner||'')+'">&#10003; Dismiss</button>'
                 +'<button class="adm-btn adm-btn-confirm" data-adm-rid="'+rep.id+'" data-adm-action="confirm" data-adm-pid="'+rep.post_id+'" data-adm-owner="'+escH(rep.post_owner||'')+'">&#9888; Confirm + Hide</button>'
                 +'<button class="adm-btn adm-btn-delete" data-adm-rid="'+rep.id+'" data-adm-action="delete" data-adm-pid="'+rep.post_id+'" data-adm-owner="'+escH(rep.post_owner||'')+'">&#128465; Delete Post</button>'
              ) : '<span style="font-size:0.65rem;color:var(--text-muted);">'+status+'</span>';
              return '<div class="adm-report">'
                + '<span class="adm-report-reason '+rep.reason+'">'+rep.reason.toUpperCase()+'</span>'
                + (rep.post_hidden ? '<span style="font-size:0.6rem;color:#ff4444;margin-left:0.4rem;">HIDDEN</span>' : '')
                + mediaHtml + postBodyHtml + dmcaExtra
                + '<div class="adm-report-meta">Post #'+rep.post_id+' &nbsp;&#183;&nbsp; '+new Date(rep.created_at).toLocaleDateString()+'</div>'
                + '<div class="adm-report-actions">'+actions+'</div>'
              + '</div>';
            }).join('');
          } catch(e) { var list2=document.getElementById('adm-reports-list'); if(list2) list2.innerHTML='<div class="adm-empty">Error loading reports</div>'; }
        }
        loadReports('pending');
        window._admReportAction = async function(repId, action, postId, ownerId) {
          try {
            await fetch('/api/admin/report-action', {
              method:'POST', credentials:'include',
              headers:{'Content-Type':'application/json'},
              body: JSON.stringify({report_id:repId, action:action, post_id:postId, post_owner_id:ownerId})
            });
            loadReports(currentStatus);
          } catch(e) { alert('Error: '+e.message); }
        };
      }

      else if (tab === 'users') {
        try {
          var r = await fetch('/api/admin/users', {credentials:'include'});
          var d = await r.json();
          var users = d.users||[];
          function renderUsers(list) {
            document.getElementById('adm-users-list').innerHTML = !list.length ? '<div class="adm-empty">No users found</div>' :
              list.map(function(u){
                var avHtml = u.avatar_url ? '<img src="'+u.avatar_url+'">' : '';
                var strikes = u.dmca_strikes > 0 ? '<span class="adm-badge-strikes">'+u.dmca_strikes+' strike'+(u.dmca_strikes>1?'s':'')+'</span>' : '';
                var susp = u.suspended ? '<span class="adm-badge-suspended">SUSPENDED</span>' : '';
                var actBtn = u.suspended
                  ? '<button class="adm-btn adm-btn-confirm" data-adm-action="unsuspend" data-adm-owner="'+escH(u.user_id)+'">&#9654; Unsuspend</button>'
                  : '<button class="adm-btn adm-btn-delete" data-adm-action="ban" data-adm-owner="'+escH(u.user_id)+'" data-adm-uname="'+escH(u.display_name||u.username||'User')+'">&#128683; Ban</button>';
                return '<div class="adm-user">'
                  + '<div class="adm-user-av">'+avHtml+'</div>'
                  + '<div class="adm-user-info">'
                    + '<div class="adm-user-name">'+(u.display_name||u.username||u.user_id.slice(0,12))+' '+strikes+' '+susp+'</div>'
                    + '<div class="adm-user-meta">'+(u.age_verified?'&#9989; Verified':'&#10060; Unverified')+' &nbsp;&#183;&nbsp; ID: '+u.user_id.slice(0,10)+'...</div>'
                  + '</div>'
                  + '<div class="adm-user-actions">'+actBtn+'</div>'
                + '</div>';
              }).join('');
          }
          body.innerHTML = '<div class="adm-section">'
            + '<input class="adm-search" id="adm-user-search" placeholder="&#128269; Search by name or ID...">'
            + '<div id="adm-users-list"></div></div>';
          renderUsers(users);
          document.getElementById('adm-user-search').addEventListener('input', function(){
            var q = this.value.toLowerCase();
            renderUsers(users.filter(function(u){ return (u.display_name||'').toLowerCase().includes(q)||(u.username||'').toLowerCase().includes(q)||u.user_id.toLowerCase().includes(q); }));
          });
          window._admUserAction = async function(action, uid) {
            await fetch('/api/admin/report-action', {method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({report_id:0,action:action,post_owner_id:uid})});
            loadAdmTab('users');
          };
          window._admBanFromPanel = function(uid, name) {
            if (window._adminBanUser) window._adminBanUser(uid, name);
          };
        } catch(e) { body.innerHTML='<div class="adm-empty">Error loading users</div>'; }
      }

      else if (tab === 'posts') {
        try {
          var r = await fetch('/api/admin/posts', {credentials:'include'});
          var d = await r.json();
          var posts = d.posts||[];
          if (!posts.length) { body.innerHTML='<div class="adm-empty">No posts</div>'; return; }
          body.innerHTML = '<div class="adm-section" id="adm-posts-list"></div>';
          var list3 = document.getElementById('adm-posts-list');
          list3.innerHTML = posts.map(function(p){
            var media = p.image_url ? (function(){
              var lo=(p.image_url||'').toLowerCase().split('?')[0];
              return lo.endsWith('.mp4')||lo.endsWith('.webm')
                ? '<video src="'+p.image_url+'" muted style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;margin-bottom:0.35rem;"></video>'
                : '<img src="'+p.image_url+'" style="width:100%;max-height:120px;object-fit:cover;border-radius:8px;margin-bottom:0.35rem;">';
            })() : '';
            return '<div class="adm-report">'
              + media
              + '<div class="adm-report-body">'+(p.body||'').slice(0,120)+'</div>'
              + '<div class="adm-report-meta">By: '+escH(p.user_name||p.user_id||'')+'&nbsp;&#183;&nbsp;'+new Date(p.created_at).toLocaleDateString()+'&nbsp;&#183;&nbsp;Reports: '+(p.report_count||0)+'</div>'
              + '<div class="adm-report-actions"><button class="adm-btn adm-btn-delete" onclick="window._admDeletePost('+p.id+')">&#128465; Delete</button>'
              +'<button class="adm-btn adm-btn-confirm" onclick="window._admHidePost('+p.id+')">&#128065; Hide</button></div>'
            + '</div>';
          }).join('');
          window._admDeletePost = async function(id) {
            if (!confirm('Delete post #'+id+' permanently?')) return;
            await fetch('/api/admin/post?id='+id, {method:'DELETE',credentials:'include'});
            loadAdmTab('posts');
          };
          window._admHidePost = async function(id) {
            await fetch('/api/admin/post-hide?id='+id, {method:'POST',credentials:'include'});
            loadAdmTab('posts');
          };
        } catch(e) { body.innerHTML='<div class="adm-empty">Error loading posts</div>'; }
      }

      else if (tab === 'threads') {
        try {
          var r = await fetch('/api/admin/threads', {credentials:'include'});
          var d = await r.json();
          var threads = d.threads||[];
          if (!threads.length) { body.innerHTML='<div class="adm-empty">No threads yet</div>'; return; }

          /* Mostrar lista de hilos — al tocar uno expande sus posts */
          body.innerHTML = '<div class="adm-section" id="adm-threads-list">'
            + threads.map(function(t){
                var totalBadge = '<span style="font-size:0.6rem;background:var(--surface-3);color:var(--text-dim);border-radius:10px;padding:0.1rem 0.45rem;margin-left:0.3rem;">'+(t.total_posts||0)+' posts</span>';
                var hiddenCount = (t.total_posts||0) - (t.visible_posts||0);
                var hiddenBadge = hiddenCount > 0 ? '<span style="font-size:0.6rem;background:rgba(204,0,0,0.15);color:#ff4444;border-radius:10px;padding:0.1rem 0.45rem;margin-left:0.3rem;">'+hiddenCount+' hidden</span>' : '';
                return '<div class="adm-report" style="cursor:pointer;" data-adm-thread-id="'+t.id+'" data-adm-thread-name="'+escH(t.name||'')+'">'
                  + '<div style="display:flex;align-items:center;justify-content:space-between;">'
                    + '<div>'
                      + '<div style="font-family:var(--font-d);font-size:0.88rem;color:var(--text);">'+escH(t.name||'Unnamed')+'</div>'
                      + '<div style="font-size:0.65rem;color:var(--text-muted);margin-top:0.15rem;">'+new Date(t.created_at).toLocaleDateString()+'</div>'
                    + '</div>'
                    + '<div>'+totalBadge+hiddenBadge+'</div>'
                  + '</div>'
                  + '<div id="adm-thread-posts-'+t.id+'" style="display:none;margin-top:0.75rem;"></div>'
                + '</div>';
              }).join('')
          + '</div>';

          /* Click en un hilo — expandir/colapsar sus posts */
          body.addEventListener('click', async function(ev){
            var card = ev.target.closest('[data-adm-thread-id]');
            if (!card) return;
            /* Ignorar clicks en botones internos */
            if (ev.target.closest('button')) return;
            var tid   = card.getAttribute('data-adm-thread-id');
            var tname = card.getAttribute('data-adm-thread-name');
            var postsDiv = document.getElementById('adm-thread-posts-'+tid);
            if (!postsDiv) return;
            if (postsDiv.style.display !== 'none') {
              postsDiv.style.display = 'none'; return;
            }
            postsDiv.style.display = 'block';
            postsDiv.innerHTML = '<div class="adm-empty" style="padding:0.75rem 0;">Loading...</div>';
            try {
              var rp = await fetch('/api/admin/thread-posts?thread_id='+tid, {credentials:'include'});
              var dp = await rp.json();
              var posts = dp.posts||[];
              if (!posts.length) { postsDiv.innerHTML='<div class="adm-empty" style="padding:0.5rem 0;">No posts in this thread</div>'; return; }
              postsDiv.innerHTML = posts.map(function(p){
                var isHidden = p.hidden || p.hidden_by_creator;
                var media = '';
                if (p.image_url) {
                  var lo=(p.image_url||'').toLowerCase().split('?')[0];
                  media = lo.endsWith('.mp4')||lo.endsWith('.webm')
                    ? '<video src="'+p.image_url+'" muted style="width:100%;max-height:100px;object-fit:cover;border-radius:6px;margin-bottom:0.3rem;"></video>'
                    : '<img src="'+p.image_url+'" style="width:100%;max-height:100px;object-fit:cover;border-radius:6px;margin-bottom:0.3rem;">';
                }
                return '<div style="border:1px solid var(--border);border-radius:10px;padding:0.6rem;margin-bottom:0.5rem;'+(isHidden?'opacity:0.45;':'')+'">'
                  + (isHidden?'<span style="font-size:0.58rem;color:#ff4444;display:block;margin-bottom:0.25rem;">HIDDEN</span>':'')
                  + media
                  + (p.body?'<div style="font-size:0.72rem;color:var(--text-dim);margin-bottom:0.3rem;">'+escH(p.body.slice(0,120))+'</div>':'')
                  + '<div style="font-size:0.6rem;color:var(--text-muted);margin-bottom:0.35rem;">'+escH(p.user_name||'')+'&nbsp;&#183;&nbsp;'+new Date(p.created_at).toLocaleDateString()+'</div>'
                  + '<div style="display:flex;gap:0.35rem;">'
                    + (!isHidden ? '<button class="adm-btn adm-btn-confirm" data-adm-action="hide-tpost" data-adm-pid="'+p.id+'" data-adm-tid="'+tid+'">&#128065; Hide</button>' : '')
                    + '<button class="adm-btn adm-btn-delete" data-adm-action="del-tpost" data-adm-pid="'+p.id+'" data-adm-tid="'+tid+'">&#128465; Delete</button>'
                  + '</div>'
                + '</div>';
              }).join('');
            } catch(e) { postsDiv.innerHTML='<div class="adm-empty" style="padding:0.5rem 0;">Error loading posts</div>'; }
          });

          window._admHideThreadPost = async function(pid, tid) {
            await fetch('/api/admin/thread-post-hide?id='+pid, {method:'POST',credentials:'include'});
            var el = document.getElementById('adm-thread-posts-'+tid);
            if (el) { el.style.display='none'; el.innerHTML=''; }
            loadAdmTab('threads');
          };
          window._admDelThreadPostPanel = async function(pid, tid) {
            if (!confirm('Delete this thread post permanently?')) return;
            await fetch('/api/admin/thread-post?id='+pid, {method:'DELETE',credentials:'include'});
            var el = document.getElementById('adm-thread-posts-'+tid);
            if (el) { el.style.display='none'; el.innerHTML=''; }
            loadAdmTab('threads');
          };
        } catch(e) { body.innerHTML='<div class="adm-empty">Error loading threads</div>'; }
      }
    }

    /* Exponer el panel */
    window._openAdminPanel = function() {
      panel.classList.add('open');
      loadAdmTab('dashboard');
    };
  })();

  /* Delegation para botones del panel admin */
  document.addEventListener('click', function(e){
    var btn = e.target.closest('[data-adm-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-adm-action');
    var rid    = btn.getAttribute('data-adm-rid');
    var pid    = btn.getAttribute('data-adm-pid');
    var owner  = btn.getAttribute('data-adm-owner');
    var uname  = btn.getAttribute('data-adm-uname');
    if (action === 'unsuspend' || action === 'clear-strikes') {
      if (window._admUserAction) window._admUserAction(action, owner);
    } else if (action === 'ban') {
      if (window._admBanFromPanel) window._admBanFromPanel(owner, uname||owner);
    } else if ((action === 'dismiss' || action === 'confirm' || action === 'delete') && rid) {
      if (window._admReportAction) window._admReportAction(parseInt(rid), action, pid ? parseInt(pid) : null, owner||'');
    } else if (action === 'hide-tpost') {
      var tpid = btn.getAttribute('data-adm-pid');
      var ttid = btn.getAttribute('data-adm-tid');
      if (window._admHideThreadPost) window._admHideThreadPost(tpid, ttid);
    } else if (action === 'del-tpost') {
      var tpid2 = btn.getAttribute('data-adm-pid');
      var ttid2 = btn.getAttribute('data-adm-tid');
      if (window._admDelThreadPostPanel) window._admDelThreadPostPanel(tpid2, ttid2);
    }
  });

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

