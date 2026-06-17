/* ════════════════════════════════════════════════════════════
   HW-COMMUNITY.JS — Community Posts Feed, Post Sheet,
                     Threads, HW Native Viewer
   Extraído de hw-index.js
   Depende de: hw-auth.js, hw-social.js, hw-feed.js, hw-admin.js
   ════════════════════════════════════════════════════════════ */

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
