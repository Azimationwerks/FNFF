/* ===========================================================
   First Nation Fresh Foods — v2 site behaviour
   Content store · hero slider · coverflow · catalogue
   quote list · in-page editing · certificates · videos
   =========================================================== */
(function () {
  'use strict';

  var KEY_Q = 'fnff_quote_v2';
  var KEY_C = 'fnff_content_v2';

  /* ---------------- storage helpers (never throw) ---------------- */
  function ls(k, v) {
    try {
      if (v === undefined) { var r = window.localStorage.getItem(k); return r ? JSON.parse(r) : null; }
      window.localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch (e) { return v === undefined ? null : false; }
  }

  function deepMerge(base, over) {
    if (!over) return base;
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    Object.keys(over).forEach(function (k) {
      var b = out[k], o = over[k];
      if (o && typeof o === 'object' && !Array.isArray(o) && b && typeof b === 'object' && !Array.isArray(b)) {
        out[k] = deepMerge(b, o);
      } else { out[k] = o; }
    });
    return out;
  }

  /* ---------------- content store ---------------- */
  var BASE = window.FNFF_CONTENT || {};
  var OVER = ls(KEY_C) || {};
  var C = deepMerge(BASE, OVER);
  window.FNFF = {
    get: function () { return C; },
    overrides: function () { return OVER; },
    saveOverride: function (path, value) {
      var parts = path.split('.'), node = OVER;
      for (var i = 0; i < parts.length - 1; i++) {
        if (!node[parts[i]] || typeof node[parts[i]] !== 'object') node[parts[i]] = {};
        node = node[parts[i]];
      }
      node[parts[parts.length - 1]] = value;
      ls(KEY_C, OVER);
      C = deepMerge(BASE, OVER);
    },
    replaceSection: function (key, value) {
      OVER[key] = value; ls(KEY_C, OVER); C = deepMerge(BASE, OVER);
    },
    resetAll: function () { OVER = {}; ls(KEY_C, {}); C = deepMerge(BASE, {}); },
    exportFile: function () {
      return 'window.FNFF_CONTENT = ' + JSON.stringify(C, null, 2) + ';\n';
    }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function get(path, fallback) {
    var n = C, p = String(path).split('.');
    for (var i = 0; i < p.length; i++) { if (n == null) return fallback; n = n[p[i]]; }
    return n == null ? fallback : n;
  }

  /* ---------------- toast ---------------- */
  var tEl, tT;
  function toast(msg) {
    if (!tEl) { tEl = document.createElement('div'); tEl.className = 'toast'; document.body.appendChild(tEl); }
    tEl.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>' + esc(msg) + '</span>';
    tEl.classList.add('on');
    clearTimeout(tT); tT = setTimeout(function () { tEl.classList.remove('on'); }, 2500);
  }
  window.fnffToast = toast;

  /* ---------------- mobile nav ---------------- */
  window.fnffNav = function () { var m = document.getElementById('mnav'); if (m) m.classList.toggle('open'); };

  /* =========================================================
     TEXT BINDING  —  [data-ed="key"] pulls from the store
     ========================================================= */
  function bindText() {
    document.querySelectorAll('[data-ed]').forEach(function (el) {
      var v = get('text.' + el.getAttribute('data-ed'), null);
      if (v != null) el.innerHTML = v;
    });
  }

  /* =========================================================
     EDIT MODE  —  ?edit=1
     ========================================================= */
  function initEdit() {
    var on = /[?&]edit=1/.test(location.search);
    if (!on) return;
    document.body.classList.add('editing');

    var bar = document.createElement('div');
    bar.className = 'editbar';
    bar.innerHTML =
      '<b>Edit mode</b><span class="sp"></span>' +
      '<button class="btn btn-sm btn-l" id="ed-save">Save changes</button>' +
      '<button class="btn btn-sm btn-l" id="ed-reset">Undo all</button>' +
      '<a class="btn btn-sm btn-p" href="admin.html">Admin panel</a>' +
      '<a class="btn btn-sm btn-l" href="' + location.pathname + '">Exit</a>';
    document.body.appendChild(bar);

    document.querySelectorAll('[data-ed]').forEach(function (el) {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
    });

    document.getElementById('ed-save').addEventListener('click', function () {
      var n = 0;
      document.querySelectorAll('[data-ed]').forEach(function (el) {
        window.FNFF.saveOverride('text.' + el.getAttribute('data-ed'), el.innerHTML.trim());
        n++;
      });
      toast(n + ' text blocks saved');
    });
    document.getElementById('ed-reset').addEventListener('click', function () {
      if (!confirm('Undo every saved text change on this site?')) return;
      window.FNFF.resetAll(); location.reload();
    });
  }

  /* =========================================================
     HERO CUBE SLIDER
     ========================================================= */
  function initHero() {
    var stage = document.getElementById('cube');
    if (!stage) return;
    var slides = get('hero', []);
    if (!slides.length) return;

    stage.innerHTML = slides.map(function (s, i) {
      return '<div class="slide' + (i === 0 ? ' on' : '') + '">' +
        '<div class="slide-bg" style="background-image:url(\'assets/img/' + esc(s.img) + '\')"></div>' +
        '<div class="slide-sh"></div><div class="wrap"><div class="slide-tx">' +
        '<div class="htag"><i></i>' + esc(s.tag) + '</div>' +
        '<h1><span class="ln"><span>' + esc(s.line1) + '</span></span>' +
        '<span class="ln"><span>' + esc(s.line2) + (s.accent ? ' <em>' + esc(s.accent) + '</em>' : '') + '</span></span></h1>' +
        '<p>' + esc(s.body) + '</p>' +
        '<div class="hcta"><a class="btn btn-p" href="' + esc(s.cta1href) + '">' + esc(s.cta1) + '</a>' +
        '<a class="btn btn-l" href="' + esc(s.cta2href) + '">' + esc(s.cta2) + '</a></div>' +
        '</div></div></div>';
    }).join('');

    var bars = document.getElementById('hbars');
    bars.innerHTML = slides.map(function (_, i) {
      return '<button class="hbar' + (i === 0 ? ' on' : '') + '" data-i="' + i + '" aria-label="Slide ' + (i + 1) + '"><i></i></button>';
    }).join('');

    var els = Array.prototype.slice.call(stage.querySelectorAll('.slide'));
    var bEls = Array.prototype.slice.call(bars.querySelectorAll('.hbar'));
    var cur = 0, timer;

    function go(n) {
      if (n === cur) return;
      var out = els[cur], inn = els[n];
      els.forEach(function (e) { e.classList.remove('on', 'out', 'in-r'); });
      inn.classList.add('in-r'); void inn.offsetWidth;
      out.classList.add('out'); inn.classList.remove('in-r'); inn.classList.add('on');
      bEls.forEach(function (b, i) {
        b.classList.remove('on');
        var bar = b.querySelector('i'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
        if (i === n) b.classList.add('on');
      });
      cur = n; restart();
    }
    function next() { go((cur + 1) % els.length); }
    function prev() { go((cur - 1 + els.length) % els.length); }
    function restart() { clearInterval(timer); timer = setInterval(next, 7000); }

    document.getElementById('h-next').addEventListener('click', next);
    document.getElementById('h-prev').addEventListener('click', prev);
    bEls.forEach(function (b) { b.addEventListener('click', function () { go(+b.getAttribute('data-i')); }); });
    restart();
  }

  /* =========================================================
     COVERFLOW
     ========================================================= */
  function initCover() {
    var el = document.getElementById('cf');
    var bNext = document.getElementById('cf-next'), bPrev = document.getElementById('cf-prev');
    if (!el || !bNext || !bPrev) return;
    var items = get('categories', []).slice(0, 6);
    el.innerHTML = items.map(function (c, i) {
      return '<div class="cf" data-i="' + i + '">' +
        '<div class="cf-img" style="background-image:url(\'assets/img/' + esc(c.img) + '\')"></div>' +
        '<div class="cf-fade"></div><div class="cf-b"><span class="cf-chip">' + esc(c.chip || 'Range') + '</span>' +
        '<h3>' + esc(c.label) + '</h3><p>' + esc(c.short || '') + '</p></div></div>';
    }).join('');
    var cards = Array.prototype.slice.call(el.querySelectorAll('.cf'));
    var idx = Math.floor(cards.length / 2);

    function render() {
      cards.forEach(function (c, i) {
        var off = i - idx, a = Math.abs(off);
        c.style.transform = 'translateX(' + (off * 240) + 'px) translateZ(' + (-a * 200) + 'px) rotateY(' + (off * -30) + 'deg)';
        c.style.opacity = a > 2 ? 0 : 1 - a * 0.18;
        c.style.filter = a === 0 ? 'none' : 'brightness(' + (1 - a * 0.22) + ') blur(' + (a * 0.6) + 'px)';
        c.style.zIndex = 10 - a;
        c.style.pointerEvents = a > 2 ? 'none' : 'auto';
      });
      var lbl = document.getElementById('cf-link');
      if (lbl && items[idx]) { lbl.textContent = 'View ' + String(items[idx].label).replace(/&amp;/g, '&'); lbl.href = items[idx].href || 'products.html'; }
    }
    function go(i) { idx = Math.max(0, Math.min(cards.length - 1, i)); render(); }
    bNext.addEventListener('click', function () { go(idx + 1 >= cards.length ? 0 : idx + 1); });
    bPrev.addEventListener('click', function () { go(idx - 1 < 0 ? cards.length - 1 : idx - 1); });
    cards.forEach(function (c, i) { c.addEventListener('click', function () { go(i); }); });

    var dx = null;
    el.addEventListener('pointerdown', function (e) { dx = e.clientX; });
    window.addEventListener('pointerup', function (e) {
      if (dx === null) return;
      var d = e.clientX - dx;
      if (d < -50) go(idx + 1 >= cards.length ? 0 : idx + 1);
      else if (d > 50) go(idx - 1 < 0 ? cards.length - 1 : idx - 1);
      dx = null;
    });
    render();
    setInterval(function () { if (!document.hidden) go(idx + 1 >= cards.length ? 0 : idx + 1); }, 5600);
  }

  /* =========================================================
     TILT CARDS
     ========================================================= */
  function initTilt() {
    document.querySelectorAll('.tilt').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.transform = 'rotateY(' + ((x - .5) * 9) + 'deg) rotateX(' + ((.5 - y) * 9) + 'deg) translateZ(4px)';
        card.style.setProperty('--mx', (x * 100) + '%');
        card.style.setProperty('--my', (y * 100) + '%');
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* =========================================================
     TICKER
     ========================================================= */
  function initTicker() {
    var t = document.getElementById('ttrack');
    if (!t) return;
    var items = get('ticker', []);
    var html = items.map(function (x) { return '<span class="tit"><i></i>' + esc(x) + '</span>'; }).join('');
    t.innerHTML = html + html;
  }

  /* =========================================================
     CATALOGUE
     ========================================================= */
  var activeCat = 'all';

  function productHTML(p) {
    var img = p.img
      ? '<div class="pimg"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy"></div>'
      : '';
    return '<article class="prod' + (p.img ? '' : ' noimg') + '">' + img +
      '<div class="pbody"><span class="pcat">' + esc(p.catLabel) + '</span>' +
      '<h3>' + esc(p.name) + '</h3>' +
      '<p class="spec">' + esc(p.spec || 'Supplied whole or cut to your specification') + '</p>' +
      '<button class="padd" data-n="' + esc(p.name) + '" data-s="' + esc(p.spec || '') + '">+ Add to Quote</button>' +
      '</div></article>';
  }

  function renderCatalogue() {
    var grid = document.getElementById('pgrid');
    if (!grid) return;
    var only = grid.getAttribute('data-only');
    var all = get('products', []);
    var cats = {}; get('categories', []).forEach(function (c) { cats[c.id] = c.label; });

    var q = (document.getElementById('psearch') || { value: '' }).value.toLowerCase().trim();
    var list = all.filter(function (p) {
      if (only) { if (p.cat !== only) return false; }
      else if (activeCat !== 'all' && p.cat !== activeCat) return false;
      if (!q) return true;
      return (p.name + ' ' + (p.spec || '') + ' ' + (cats[p.cat] || '')).toLowerCase().indexOf(q) > -1;
    }).map(function (p) {
      return { name: p.name, cat: p.cat, catLabel: (cats[p.cat] || '').replace(/&amp;/g, '&'), spec: p.spec, img: p.img };
    });

    var cnt = document.getElementById('pcount');
    if (cnt) cnt.textContent = list.length + (only ? ' lines' : ' of ' + all.length + ' lines');

    if (!list.length) {
      grid.innerHTML = '<div class="empty"><h3>No line matches &ldquo;' + esc(q) + '&rdquo;</h3>' +
        '<p style="margin-top:8px">We cut to any documented specification. Add a custom request and our sales desk will quote it.</p>' +
        '<button class="btn btn-p btn-sm" style="margin-top:16px" id="customreq">+ Add custom specification</button></div>';
      var cb = document.getElementById('customreq');
      if (cb) cb.addEventListener('click', function () {
        window.fnffAdd('Custom specification: ' + (q || 'to be advised'), 'Bespoke cut or product request', cb);
      });
      return;
    }
    grid.innerHTML = list.map(productHTML).join('');
    grid.querySelectorAll('.padd').forEach(function (b) {
      b.addEventListener('click', function () { window.fnffAdd(b.getAttribute('data-n'), b.getAttribute('data-s'), b); });
    });
  }
  window.fnffRenderCatalogue = renderCatalogue;

  function initTabs() {
    var bar = document.getElementById('ptabs');
    if (!bar) return;
    var cats = get('categories', []);
    bar.innerHTML = '<button class="ptab on" data-c="all">All lines</button>' +
      cats.map(function (c) { return '<button class="ptab" data-c="' + esc(c.id) + '">' + c.label + '</button>'; }).join('');
    bar.querySelectorAll('.ptab').forEach(function (t) {
      t.addEventListener('click', function () {
        activeCat = t.getAttribute('data-c');
        bar.querySelectorAll('.ptab').forEach(function (x) { x.classList.remove('on'); });
        t.classList.add('on');
        renderCatalogue();
      });
    });
  }

  /* =========================================================
     CATEGORY CARDS (products landing)
     ========================================================= */
  function initCatCards() {
    var el = document.getElementById('catcards');
    if (!el) return;
    var all = get('products', []);
    el.innerHTML = get('categories', []).map(function (c) {
      var n = all.filter(function (p) { return p.cat === c.id; }).length;
      return '<article class="mcard"><a href="' + esc(c.href) + '" style="display:contents">' +
        '<div class="mimg"><span class="mtag">' + esc(c.chip || '') + '</span>' +
        '<img src="assets/img/' + esc(c.img) + '" alt="' + c.label + '" loading="lazy"></div>' +
        '<div class="mbody"><h3>' + c.label + '</h3><p>' + c.blurb + '</p>' +
        '<div class="mmeta">' + n + ' lines listed</div></div></a></article>';
    }).join('');
  }

  /* =========================================================
     CERTIFICATES
     ========================================================= */
  function initCerts() {
    var el = document.getElementById('certgrid');
    if (!el) return;
    var items = get('certificates', []);
    if (!items.length) { el.innerHTML = '<div class="empty"><p>No certificates have been added yet. Use the admin panel to add one.</p></div>'; return; }
    el.innerHTML = items.map(function (c) {
      var img = c.img ? '<img src="' + esc(c.img) + '" alt="' + esc(c.title) + '" loading="lazy">'
                      : '<div class="cert-ph">' + esc(c.title) + '</div>';
      var st = c.status ? '<span class="cert-st' + (/pend|final|progress/i.test(c.status) ? ' pend' : '') + '">' + esc(c.status) + '</span>' : '';
      return '<article class="cert"><div class="cert-img">' + img + '</div>' +
        '<div class="cert-b"><h4>' + esc(c.title) + '</h4><span>' + esc(c.issuer || '') + '</span>' + st + '</div></article>';
    }).join('');
  }

  /* =========================================================
     VIDEOS
     ========================================================= */
  function embed(url) {
    if (!url) return null;
    var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/);
    if (yt) return 'https://www.youtube.com/embed/' + yt[1];
    var vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) return 'https://player.vimeo.com/video/' + vm[1];
    return null;
  }

  function initVideos() {
    document.querySelectorAll('[data-videos]').forEach(function (el) {
      var group = el.getAttribute('data-videos');
      var items = get('videos', []).filter(function (v) { return !group || v.group === group; });
      if (!items.length) {
        el.innerHTML = '<div class="empty"><p>No videos have been added for this section yet. Use the admin panel to add one.</p></div>';
        return;
      }
      el.innerHTML = items.map(function (v) {
        var src = embed(v.url), frame;
        if (src) frame = '<iframe src="' + esc(src) + '" title="' + esc(v.title) + '" allowfullscreen loading="lazy"></iframe>';
        else if (v.url && /\.(mp4|webm|mov)$/i.test(v.url)) frame = '<video src="' + esc(v.url) + '" controls preload="metadata"></video>';
        else frame = '<div class="vid-ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="3"/><polygon points="10 9 15 12 10 15" fill="currentColor" stroke="none"/></svg><span>Video to be added</span></div>';
        return '<article class="vid"><div class="vid-f">' + frame + '</div>' +
          '<div class="vid-b"><h4>' + esc(v.title) + '</h4><p>' + esc(v.desc || '') + '</p></div></article>';
      }).join('');
    });
  }

  /* =========================================================
     OWN-LABEL CARDS
     ========================================================= */
  function initOwnLabel() {
    var el = document.getElementById('ownlabel');
    if (!el) return;
    el.innerHTML = get('ownLabel', []).map(function (p) {
      return '<article class="mcard">' +
        '<div class="mimg" style="aspect-ratio:3/4;background:var(--cream)">' +
        '<img src="assets/brand/' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" style="object-fit:contain;padding:14px"></div>' +
        '<div class="mbody"><h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p>' +
        '<div class="mmeta">' + esc(p.pack) + '</div>' +
        '<button class="padd" data-n="' + esc(p.name) + '" data-s="' + esc(p.pack) + '">+ Add to Quote</button>' +
        '</div></article>';
    }).join('');
    el.querySelectorAll('.padd').forEach(function (b) {
      b.addEventListener('click', function () { window.fnffAdd(b.getAttribute('data-n'), b.getAttribute('data-s'), b); });
    });
  }

  /* =========================================================
     MARKETS
     ========================================================= */
  function initMarkets() {
    var el = document.getElementById('marketgrid');
    if (!el) return;
    el.innerHTML = get('markets', []).map(function (m, i) {
      return '<article class="card"><div class="cnum"><b>SECTOR ' + ('0' + (i + 1)).slice(-2) + '</b>' +
        '<span class="pill">' + esc(m.chip) + '</span></div><h3>' + esc(m.title) + '</h3><p>' + esc(m.body) + '</p></article>';
    }).join('');
  }

  /* =========================================================
     QUOTE LIST
     ========================================================= */
  var Q = ls(KEY_Q) || [];
  function qSave() { ls(KEY_Q, Q); }
  function qCount() {
    document.querySelectorAll('[data-qcount]').forEach(function (e) { e.textContent = Q.length; });
    document.querySelectorAll('.qbtn').forEach(function (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
  }
  function qRender() {
    var box = document.getElementById('qbody');
    if (!box) return;
    if (!Q.length) {
      box.innerHTML = '<div class="qempty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2 6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6l-3-4z"/><path d="M6 6h12"/><path d="M10 11h4"/></svg>' +
        '<p>Your specification list is empty.</p><p style="margin-top:7px;font-size:13px">Use <b>+ Add to Quote</b> on any product line to build a specification for our sales desk.</p>' +
        '<a class="btn btn-p btn-sm" style="margin-top:16px" href="products.html">Browse products</a></div>';
      return;
    }
    box.innerHTML = Q.map(function (it, i) {
      return '<div class="qitem"><div class="qitem-t"><div><b>' + esc(it.name) + '</b><small>' + esc(it.spec || '') + '</small></div>' +
        '<button class="qrm" data-rm="' + i + '" aria-label="Remove">&#10005;</button></div>' +
        '<div class="qqty"><label>Qty</label><input type="text" value="' + esc(it.qty || '') + '" data-q="' + i + '" placeholder="e.g. 10 x 5kg"></div></div>';
    }).join('');
    box.querySelectorAll('[data-rm]').forEach(function (b) {
      b.addEventListener('click', function () { Q.splice(+b.getAttribute('data-rm'), 1); qSave(); qRender(); qCount(); });
    });
    box.querySelectorAll('[data-q]').forEach(function (inp) {
      inp.addEventListener('change', function () { var i = +inp.getAttribute('data-q'); if (Q[i]) { Q[i].qty = inp.value; qSave(); } });
    });
  }
  window.fnffDrawer = function (open) {
    var d = document.getElementById('qd'), b = document.getElementById('qback');
    if (!d) return;
    if (open) { qRender(); d.classList.add('on'); b.classList.add('on'); document.body.style.overflow = 'hidden'; }
    else { d.classList.remove('on'); b.classList.remove('on'); document.body.style.overflow = ''; }
  };
  window.fnffAdd = function (name, spec, btn) {
    if (Q.some(function (i) { return i.name === name; })) { toast('Already on your quote list'); return; }
    Q.push({ name: name, spec: spec || '', qty: '' });
    qSave(); qCount(); qRender();
    if (btn) {
      var o = btn.textContent; btn.textContent = '✓ Added'; btn.classList.add('added');
      setTimeout(function () { btn.textContent = o; btn.classList.remove('added'); }, 1600);
    }
    toast('Added to your quote specification');
  };
  window.fnffClear = function () { Q = []; qSave(); qRender(); qCount(); toast('List cleared'); };
  window.fnffSubmit = function (ev) {
    ev.preventDefault();
    var msg = document.getElementById('qmsg');
    if (!Q.length) { msg.className = 'qmsg err'; msg.textContent = 'Add at least one line before submitting.'; return false; }
    var f = ev.target;
    var lines = Q.map(function (i, n) {
      return (n + 1) + '. ' + i.name + (i.spec ? '  [' + i.spec + ']' : '') + (i.qty ? '  — Qty: ' + i.qty : '');
    }).join('\n');
    var body = 'QUOTE SPECIFICATION REQUEST\n===========================\n\n' +
      'Organisation: ' + f.org.value + '\nContact: ' + f.person.value + '\nEmail: ' + f.email.value +
      '\nPhone: ' + f.phone.value + (f.notes.value ? '\nNotes: ' + f.notes.value : '') +
      '\n\nLINES (' + Q.length + ')\n' + lines + '\n\n-- firstnationfreshfoods.com.au --';
    msg.className = 'qmsg'; msg.textContent = '✓ Specification prepared for orders@firstnationfreshfoods.com.au';
    try {
      window.location.href = 'mailto:orders@firstnationfreshfoods.com.au?subject=' +
        encodeURIComponent('Quote specification — ' + f.org.value) + '&body=' + encodeURIComponent(body);
    } catch (e) { }
    toast('Quote specification ready to send');
    return false;
  };
  window.fnffEnquiry = function (ev) {
    ev.preventDefault();
    var f = ev.target, out = f.querySelector('[data-feedback]');
    if (out) out.textContent = '✓ Prepared for sales@firstnationfreshfoods.com.au';
    try {
      window.location.href = 'mailto:sales@firstnationfreshfoods.com.au?subject=' +
        encodeURIComponent('Website enquiry — ' + f.org.value) +
        '&body=' + encodeURIComponent('Organisation: ' + f.org.value + '\nContact: ' + f.person.value +
          '\nEmail: ' + f.email.value + '\nPhone: ' + f.phone.value + '\n\n' + f.message.value);
    } catch (e) { }
    toast('Enquiry ready to send');
    return false;
  };

  /* ---------------- stats count-up ---------------- */
  function initStats() {
    var nums = document.querySelectorAll('.stat b[data-to]');
    if (!nums.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, to = parseInt(el.getAttribute('data-to'), 10), sfx = el.getAttribute('data-sfx') || '';
        var c = 0, step = Math.max(1, Math.floor(to / 42));
        (function tick() {
          c += step;
          if (c >= to) { el.textContent = to + sfx; }
          else { el.textContent = c + sfx; requestAnimationFrame(tick); }
        })();
        io.unobserve(el);
      });
    }, { threshold: .5 });
    nums.forEach(function (n) { io.observe(n); });
  }

  /* ---------------- reveal ---------------- */
  function initReveal() {
    var els = document.querySelectorAll('.rv');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e, i) { e.style.transitionDelay = (i % 4) * .07 + 's'; io.observe(e); });
  }

  /* ---------------- init ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    bindText();
    initHero(); initTicker(); initCover(); initTilt();
    initTabs(); initCatCards(); renderCatalogue();
    initCerts(); initVideos(); initOwnLabel(); initMarkets();
    qCount(); qRender(); initStats(); initReveal(); initEdit();

    var s = document.getElementById('psearch');
    if (s) s.addEventListener('input', renderCatalogue);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') window.fnffDrawer(false); });
  });
})();
