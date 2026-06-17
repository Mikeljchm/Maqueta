/* ── HW-SOCIAL.JS — Comments Panel + Stickers extraídos ── */


  /* ── HW-FEED.JS — Feed, Polls, Hashtags, Profiles, initApp, LR Stories extraídos ── */

  /* SERVICE WORKER */
  /* ── HW-AUTH.JS — HottAuth + login/UI extraído a módulo separado ── */


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
    '.post-like-btn.liked svg{fill:var(--fire-orange);stroke:var(--fire-orange);}'
    +'.pc-save-btn.saved svg{fill:var(--fire-orange);stroke:var(--fire-orange);}',
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

  /* ─── Age Verification Screen CSS ─── */
  (function(){
    var av = document.createElement('style');
    av.textContent = [
      '#av-screen{position:fixed;inset:0;background:var(--bg);z-index:9999;display:none;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem;}',
      '#av-screen.open{display:flex;}',
      '.av-logo{font-family:var(--font-d);font-size:2rem;letter-spacing:0.1em;color:var(--fire-orange);margin-bottom:0.5rem;}',
      '.av-sub{font-size:0.75rem;color:var(--text-dim);text-align:center;margin-bottom:1.5rem;line-height:1.6;}',
      '.av-card{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:1.5rem 1.25rem;width:100%;max-width:360px;}',
      '.av-title{font-family:var(--font-d);font-size:1rem;letter-spacing:0.08em;margin-bottom:0.25rem;color:#fff;}',
      '.av-desc{font-size:0.72rem;color:var(--text-dim);margin-bottom:1.1rem;line-height:1.55;}',
      '.av-label{font-size:0.68rem;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:0.3rem;display:block;}',
      '.av-dob{display:flex;gap:0.5rem;margin-bottom:1rem;}',
      '.av-dob select{flex:1;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:0.55rem 0.4rem;font-size:0.78rem;font-family:var(--font-b);outline:none;appearance:none;-webkit-appearance:none;text-align:center;}',
      '.av-dob select:focus{border-color:var(--fire-orange);}',
      '.av-declare{font-size:0.65rem;color:var(--text-dim);line-height:1.55;background:var(--surface-2);border-radius:10px;padding:0.75rem;margin-bottom:1rem;border:1px solid var(--border);}',
      '.av-btn{width:100%;background:linear-gradient(135deg,var(--fire-orange),var(--fire-red));color:#fff;border:none;border-radius:25px;padding:0.75rem;font-family:var(--font-d);font-size:0.9rem;letter-spacing:0.08em;cursor:pointer;transition:opacity 0.2s;}',
      '.av-btn:disabled{opacity:0.4;cursor:not-allowed;}',
      '.av-error{font-size:0.7rem;color:#ff5555;text-align:center;margin-top:0.6rem;min-height:1rem;}',
      '.av-logout{background:none;border:none;color:var(--text-muted);font-size:0.65rem;margin-top:1rem;cursor:pointer;text-decoration:underline;}'
    ].join('');
    document.head.appendChild(av);
  })();

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
  var SAVED_POSTS = new Set();
  try { SAVED_POSTS = new Set(JSON.parse(localStorage.getItem('hw_post_saves')||'[]')); } catch(e){}
  function saveSavedPosts() {
    try { localStorage.setItem('hw_post_saves', JSON.stringify([...SAVED_POSTS])); } catch(e){}
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
                /* También insertar en el community feed del home */
                var _cc = document.getElementById('community-feed-container');
                if (_cc) {
                  var _div = _cc.querySelector('.cf-divider');
                  if (_div) _div.insertAdjacentHTML('afterend', newCard);
                  else _cc.insertAdjacentHTML('afterbegin', newCard);
                  if (window._activateLazyGifs) window._activateLazyGifs(_cc);
                }
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
      /* Copyright/DMCA → mostrar formulario extendido */
      if (cat === 'copyright') {
        closeReportSheet();
        window._openDmcaForm(pid);
        return;
      }
      closeReportSheet();
      try {
        await fetch('/api/report', {
          method:'POST', credentials:'include',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({post_id: parseInt(pid), reason: cat})
        });
        var btn2 = document.querySelector('.post-report-btn[data-post-id="'+pid+'"]');
        if (btn2) { btn2.textContent = 'Reported'; btn2.classList.add('reported'); }
        REPORTED_POSTS.add(pid); saveReported();
        if (cat === 'underage') {
          var card = document.querySelector('.post-card[data-post-id="'+pid+'"]');
          if (card) { card.style.opacity='0.3'; card.style.pointerEvents='none'; }
        }
        var toast = document.getElementById('toast');
        if (toast) {
          toast.textContent = cat==='underage' ? '&#9888; Reported and hidden — thank you' : 'Reported — thank you';
          toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); }, 3000);
        }
      } catch(e){}
      return;
    }

    /* Save post → abrir sheet de colecciones */
    var saveBtn = e.target.closest('.pc-save-btn[data-post-id]');
    if (saveBtn) {
      if (!window.currentUser) {
        var toast = document.getElementById('toast');
        if (toast) { toast.textContent = 'Sign in to save posts'; toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); }, 2500); }
        return;
      }
      var pid = saveBtn.getAttribute('data-post-id');
      var card = saveBtn.closest('.post-card');
      var postImg = '';
      var postBody = '';
      if (card) {
        var imgEl = card.querySelector('.pc-media-single') || card.querySelector('.pc-media-cell img');
        if (imgEl) postImg = imgEl.src || imgEl.getAttribute('data-lazygif') || '';
        var bodyEl = card.querySelector('.pc-tags');
        if (bodyEl) postBody = bodyEl.textContent.slice(0, 100);
      }
      /* Abrir el panel de colecciones con los datos del post */
      if (typeof window.openCollectionsPanel === 'function') {
        window.openCollectionsPanel(parseInt(pid), window.location.href, postImg, postBody);
      }
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

  /* ─── Age Verification Screen DOM + Logic ─── */
  (function(){
    var screen = document.createElement('div');
    screen.id = 'av-screen';
    // Generar opciones de días, meses, años
    var days = '<option value="">DD</option>';
    for(var d=1;d<=31;d++) days += '<option value="'+(d<10?'0':'')+d+'">'+(d<10?'0':'')+d+'</option>';
    var months = '<option value="">MM</option>';
    var mns = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    mns.forEach(function(m,i){ var v=(i+1<10?'0':'')+(i+1); months+='<option value="'+v+'">'+m+'</option>'; });
    var years = '<option value="">YYYY</option>';
    var curY = new Date().getFullYear();
    for(var y=curY-18;y>=curY-100;y--) years += '<option value="'+y+'">'+y+'</option>';

    screen.innerHTML = '<div class="av-logo">🔥 HOTT WRESTLING</div>'
      + '<div class="av-sub">Adult content site &middot; 18+ only<br>Verify your age to continue</div>'
      + '<div class="av-card">'
        + '<div class="av-title">AGE VERIFICATION</div>'
        + '<div class="av-desc">We need to confirm you are 18 or older. This information is stored securely and used only for compliance purposes.</div>'
        + '<label class="av-label">DATE OF BIRTH</label>'
        + '<div class="av-dob">'
          + '<select id="av-day">'+days+'</select>'
          + '<select id="av-month">'+months+'</select>'
          + '<select id="av-year">'+years+'</select>'
        + '</div>'
        + '<div class="av-declare">&#128274; By clicking Confirm, I declare under my responsibility that I am 18 years of age or older and I voluntarily access adult content.</div>'
        + '<button class="av-btn" id="av-confirm">CONFIRM &amp; ENTER</button>'
        + '<div class="av-error" id="av-error"></div>'
        + '<button class="av-logout" id="av-logout-btn">Not you? Sign out</button>'
      + '</div>';
    document.body.appendChild(screen);

    window._showAgeVerification = function() {
      screen.classList.add('open');
    };

    document.getElementById('av-confirm').addEventListener('click', async function() {
      var day   = document.getElementById('av-day').value;
      var month = document.getElementById('av-month').value;
      var year  = document.getElementById('av-year').value;
      var errEl = document.getElementById('av-error');
      if (!day || !month || !year) { errEl.textContent = 'Please select your complete date of birth.'; return; }
      var birthdate = year + '-' + month + '-' + day;
      var btn = document.getElementById('av-confirm');
      btn.disabled = true; btn.textContent = 'Verifying...';
      errEl.textContent = '';
      try {
        var r = await fetch('/api/verify-age', {
          method: 'POST', credentials: 'include',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ birthdate: birthdate })
        });
        var rawText = await r.text();
        var data;
        try { data = JSON.parse(rawText); } catch(je) {
          errEl.textContent = 'Server error ('+r.status+'). Please try again.';
          btn.disabled = false; btn.textContent = 'CONFIRM & ENTER';
          return;
        }
        if (data.ok) {
          screen.classList.remove('open');
          if (window.currentUser) window.currentUser.age_verified = 1;
          try { sessionStorage.removeItem('hw_s'); } catch(e) {}
        } else {
          errEl.textContent = data.error || 'Verification failed ('+r.status+').';
          btn.disabled = false; btn.textContent = 'CONFIRM & ENTER';
        }
      } catch(e) {
        errEl.textContent = 'Network error: ' + (e.message||'unknown');
        btn.disabled = false; btn.textContent = 'CONFIRM & ENTER';
      }
    });

    var logoutBtn = document.getElementById('av-logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', function() {
      sessionStorage.removeItem('hw_s');
      window.location.href = '/auth/google/logout?redirect=' + encodeURIComponent(window.location.href);
    });
  })();

  /* ── DMCA Form completo ── */
  (function(){
    function escH(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    var s = document.createElement('style');
    s.textContent = '.dmca-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:500;display:none;align-items:flex-end;justify-content:center;}'
      +'.dmca-overlay.open{display:flex;}'
      +'.dmca-sheet{background:var(--surface);border-radius:20px 20px 0 0;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;padding:1.25rem 1.1rem calc(2rem + env(safe-area-inset-bottom,0px));position:relative;z-index:901;}'
      +'.dmca-handle{width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 1rem;}'
      +'.dmca-title{font-family:var(--font-d);font-size:1rem;letter-spacing:0.08em;margin-bottom:0.25rem;}'
      +'.dmca-sub{font-size:0.68rem;color:var(--text-dim);margin-bottom:1rem;line-height:1.5;}'
      +'.dmca-label{font-size:0.65rem;color:var(--text-dim);letter-spacing:0.06em;display:block;margin-bottom:0.3rem;margin-top:0.75rem;}'
      +'.dmca-input{width:100%;background:var(--surface-2);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:0.55rem 0.75rem;font-size:0.8rem;font-family:var(--font-b);outline:none;box-sizing:border-box;}'
      +'.dmca-input:focus{border-color:var(--fire-orange);}'
      +'.dmca-warn{background:rgba(204,0,0,0.08);border:1px solid rgba(204,0,0,0.25);border-radius:10px;padding:0.75rem;font-size:0.65rem;color:#ffaaaa;line-height:1.55;margin-top:0.85rem;}'
      +'.dmca-check{display:flex;align-items:flex-start;gap:0.5rem;margin-top:0.65rem;font-size:0.68rem;color:var(--text-dim);line-height:1.5;cursor:pointer;}'
      +'.dmca-check input{margin-top:0.15rem;flex-shrink:0;accent-color:var(--fire-orange);}'
      +'.dmca-send{width:100%;margin-top:1rem;background:var(--fire-orange);color:#fff;border:none;border-radius:25px;padding:0.65rem;font-family:var(--font-d);font-size:0.85rem;letter-spacing:0.07em;cursor:pointer;}'
      +'.dmca-send:disabled{opacity:0.4;}'
      +'.dmca-err{font-size:0.68rem;color:#ff5555;text-align:center;margin-top:0.5rem;min-height:1rem;}';
    document.head.appendChild(s);

    var overlay = document.createElement('div'); overlay.className='dmca-overlay'; overlay.id='dmca-overlay';
    var sheet   = document.createElement('div'); sheet.className='dmca-sheet';
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    var _dmcaPostId = null;

    window._openDmcaForm = function(postId) {
      _dmcaPostId = postId;
      sheet.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">'
          + '<div class="dmca-handle" style="margin:0 auto 0 0;"></div>'
          + '<button id="dmca-close-btn" style="background:none;border:none;color:var(--text-dim);font-size:1.4rem;cursor:pointer;padding:0.1rem 0.4rem;line-height:1;flex-shrink:0;">&#10005;</button>'
          + '</div>'
        + '<div class="dmca-title">&#169; COPYRIGHT / DMCA NOTICE</div>'
        + '<div class="dmca-sub">Complete this form to submit a DMCA takedown notice. False claims may result in legal liability.</div>'
        + '<label class="dmca-label">YOUR FULL NAME *</label>'
        + '<input class="dmca-input" id="dmca-name" placeholder="Full legal name" maxlength="100">'
        + '<label class="dmca-label">YOUR EMAIL *</label>'
        + '<input class="dmca-input" id="dmca-email" type="email" placeholder="contact@email.com" maxlength="200">'
        + '<label class="dmca-label">URL OF ORIGINAL COPYRIGHTED WORK *</label>'
        + '<input class="dmca-input" id="dmca-url" placeholder="https://..." maxlength="500">'
        + '<label class="dmca-label">DESCRIPTION OF YOUR WORK</label>'
        + '<input class="dmca-input" id="dmca-desc" placeholder="Brief description of the original work" maxlength="500">'
        + '<div class="dmca-warn">&#9888; LEGAL NOTICE: False or fraudulent DMCA notices may result in legal liability under 17 U.S.C. &#167;512(f). HOTT WRESTLING reserves the right to take legal action against those who abuse this system.</div>'
        + '<label class="dmca-check"><input type="checkbox" id="dmca-check1"> I have a good faith belief that the use of the described material is not authorized by the copyright owner, its agent, or the law.</label>'
        + '<label class="dmca-check"><input type="checkbox" id="dmca-check2"> I declare, under penalty of perjury, that I am the copyright owner or authorized to act on their behalf, and the information is accurate.</label>'
        + '<label class="dmca-check"><input type="checkbox" id="dmca-check3"> I have read and agree to the legal notice above and confirm my notification is truthful and made in good faith.</label>'
        + '<button class="dmca-send" id="dmca-send">SUBMIT DMCA NOTICE</button>'
        + '<div class="dmca-err" id="dmca-err"></div>';
      overlay.classList.add('open');
      var closeBtn = document.getElementById('dmca-close-btn');
      if (closeBtn) closeBtn.addEventListener('click', function(){ overlay.classList.remove('open'); });

      document.getElementById('dmca-send').addEventListener('click', async function() {
        var name  = document.getElementById('dmca-name').value.trim();
        var email = document.getElementById('dmca-email').value.trim();
        var url   = document.getElementById('dmca-url').value.trim();
        var desc  = document.getElementById('dmca-desc').value.trim();
        var c1 = document.getElementById('dmca-check1').checked;
        var c2 = document.getElementById('dmca-check2').checked;
        var c3 = document.getElementById('dmca-check3').checked;
        var errEl = document.getElementById('dmca-err');
        if (!name || !email || !url) { errEl.textContent = 'Name, email and original URL are required.'; return; }
        if (!c1 || !c2 || !c3) { errEl.textContent = 'You must check all three declarations.'; return; }
        var btn = document.getElementById('dmca-send');
        btn.disabled = true; btn.textContent = 'Submitting...';
        try {
          var r = await fetch('/api/report', {
            method:'POST', credentials:'include',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({post_id:parseInt(_dmcaPostId), reason:'copyright', details:desc, original_url:url, reporter_email:email, reporter_name:name})
          });
          var d = await r.json();
          if (d.ok) {
            overlay.classList.remove('open');
            var toast = document.getElementById('toast');
            if (toast) { toast.textContent = 'DMCA notice submitted — content hidden pending review.'; toast.classList.add('show'); setTimeout(function(){ toast.classList.remove('show'); }, 4000); }
            var repBtn = document.querySelector('.post-report-btn[data-post-id="'+_dmcaPostId+'"]');
            if (repBtn) { repBtn.textContent = 'Reported'; repBtn.classList.add('reported'); }
            /* Ocultar la card inmediatamente en el DOM */
            var card = document.querySelector('.post-card[data-post-id="'+_dmcaPostId+'"]');
            if (card) { card.style.opacity='0.25'; card.style.pointerEvents='none'; }
          } else {
            errEl.textContent = d.error || 'Submission failed.';
            btn.disabled = false; btn.textContent = 'SUBMIT DMCA NOTICE';
          }
        } catch(e) {
          errEl.textContent = 'Network error. Please try again.';
          btn.disabled = false; btn.textContent = 'SUBMIT DMCA NOTICE';
        }
      });
    };
    overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.classList.remove('open'); });
  })();

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

























