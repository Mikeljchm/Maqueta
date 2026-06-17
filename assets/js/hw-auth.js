/* ════════════════════════════════════════════════════════════
   HW-AUTH.JS — Autenticación, sesión Google OAuth, PWA install
   Módulo extraído de hw-index.js (división por tamaño)
   Depende de: nada
   Expone: window.currentUser, window.HottAuth (global, no closure)
   Otros dependen de: window.currentUser, window.HottAuth
   ════════════════════════════════════════════════════════════ */

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
      /* following-tab always visible — no show/hide needed */
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
      /* following-tab always visible — no show/hide needed */
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
        /* Recargar feed si ya estaba renderizado — para que aparezca la foto.
           Si el feed todavía no renderizó nada (race condition: fetchUserProfile
           resuelve antes que el feed termine su primera carga), reintentamos
           unos segundos para no dejar avatares viejos pegados permanentemente. */
        var pc = document.getElementById('posts-feed-container');
        if (pc && pc.children.length && typeof window.loadPostsFeed === 'function') {
          window.loadPostsFeed(pc, userId);
        } else if (typeof window.loadPostsFeed === 'function') {
          var _avRetries = 0;
          var _avRetryTimer = setInterval(function() {
            _avRetries++;
            var pc2 = document.getElementById('posts-feed-container');
            if (pc2 && pc2.children.length) {
              clearInterval(_avRetryTimer);
              window.loadPostsFeed(pc2, userId);
            } else if (_avRetries > 15) {
              clearInterval(_avRetryTimer);
            }
          }, 400);
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
      /* Cargar name_color y name_font del perfil — y verificar age_verified */
      fetch('/api/profile',{credentials:'include'}).then(function(r){return r.json();}).then(function(pd){
        if(window.currentUser){
          window.currentUser.name_color=pd.name_color||'';
          window.currentUser.name_font=pd.name_font||'';
          window.currentUser.age_verified=pd.age_verified||0;
        }
        /* Mostrar age verification si no ha verificado edad */
        if (!pd.age_verified && window._showAgeVerification) {
          window._showAgeVerification();
        }
        /* Aplicar estilos de nombre */
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
      // Cargar IDs guardados desde D1 y sincronizar con localStorage
      fetch('/api/posts?action=saved-ids', {credentials:'include'})
        .then(function(r){ return r.json(); })
        .then(function(d){
          if (d.ids && d.ids.length) {
            d.ids.forEach(function(id){ SAVED_POSTS.add(String(id)); });
            saveSavedPosts();
            /* Actualizar botones ya renderizados */
            d.ids.forEach(function(id){
              var btn = document.querySelector('.pc-save-btn[data-post-id="'+id+'"]');
              if (btn) btn.classList.add('saved');
            });
          }
        }).catch(function(){});
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

/* Exponer HottAuth globalmente — otros módulos lo usan como 'typeof HottAuth' */
window.HottAuth = HottAuth;
