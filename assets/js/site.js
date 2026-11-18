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

  /* ----------------------------------------------------------------
     IMAGE SOURCE RESOLVER
     Every image on the site goes through this. An uploaded image is
     stored as a data: URL; a built-in one is stored as a bare file
     name. Only the bare name gets the assets/img/ prefix — which is
     what used to break uploads.
     ---------------------------------------------------------------- */
  function srcOf(v, folder) {
    v = String(v == null ? '' : v).trim();
    if (!v) return '';
    if (/^(data:|blob:|https?:|\/\/|\/)/i.test(v)) return v;      // already a full reference
    if (v.indexOf('assets/') === 0 || v.indexOf('./') === 0) return v;  // already a site path
    return (folder || 'assets/img/') + v;                          // bare file name
  }

  window.FNFF = {
    src: srcOf,
    get: function () { return C; },
    overrides: function () { return OVER; },
    saveOverride: function (path, value) {
      var parts = path.split('.'), node = OVER, prev = JSON.stringify(OVER);
      for (var i = 0; i < parts.length - 1; i++) {
        if (!node[parts[i]] || typeof node[parts[i]] !== 'object') node[parts[i]] = {};
        node = node[parts[i]];
      }
      node[parts[parts.length - 1]] = value;
      var ok = ls(KEY_C, OVER);
      if (!ok) { OVER = JSON.parse(prev); }   // put it back rather than pretend
      C = deepMerge(BASE, OVER);
      return ok;
    },

    /* how much of the browser's storage the saved changes are using */
    storage: function () {
      var used = 0;
      try { used = (window.localStorage.getItem(KEY_C) || '').length; } catch (e) { }
      var cap = 5 * 1024 * 1024;
      return { used: used, cap: cap, pct: Math.min(100, Math.round(used / cap * 100)) };
    },
    replaceSection: function (key, value) {
      var prev = OVER[key], had = OVER.hasOwnProperty(key);
      OVER[key] = value;
      var ok = ls(KEY_C, OVER);
      if (!ok) { if (had) OVER[key] = prev; else delete OVER[key]; }
      C = deepMerge(BASE, OVER);
      return ok;
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

  function here() {
    var f = location.pathname.split('/').pop() || 'index.html';
    var c = /[?&]c=([^&]+)/.exec(location.search);
    return c ? f + '?c=' + c[1] : f;
  }

  /* =========================================================
     MENU — rendered from content, so the admin can add,
     rename, reorder or remove items and every page follows.
     ========================================================= */
  var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" ' +
    'stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

  function initNav() {
    var items = get('nav', null);
    if (!items || !items.length) return;      // fall back to the built HTML
    var cur = here();

    var top = document.querySelector('.nav');
    if (top) {
      top.innerHTML = items.map(function (it) {
        var sub = it.sub || [];
        var on = (cur === it.href || sub.some(function (s) { return s.href === cur; })) ? ' on' : '';
        if (!sub.length) return '<li><a class="nav-a' + on + '" href="' + esc(it.href) + '">' + it.label + '</a></li>';
        return '<li><a class="nav-a' + on + '" href="' + esc(it.href) + '">' + it.label + CHEV + '</a>' +
          '<div class="drop">' + sub.map(function (s) {
            return '<a href="' + esc(s.href) + '">' + s.label + '</a>';
          }).join('') + '</div></li>';
      }).join('');
    }

    var m = document.getElementById('mnav');
    if (m) {
      var tail = m.querySelector('.mgrp[style]');
      m.innerHTML = items.map(function (it) {
        var sub = it.sub || [];
        if (!sub.length) return '<div class="mgrp"><a class="top" href="' + esc(it.href) + '">' + it.label + '</a></div>';
        return '<div class="mgrp"><p>' + it.label + '</p>' + sub.map(function (s) {
          return '<a href="' + esc(s.href) + '">' + s.label + '</a>';
        }).join('') + '</div>';
      }).join('') + '<div class="mgrp"><a class="top" href="marketing-media.html">Marketing Media</a></div>';
      if (tail) m.appendChild(tail);
    }
  }

  /* =========================================================
     THEME — colours come from content so they are editable
     ========================================================= */
  function initTheme() {
    var t = get('theme', null);
    if (!t) return;
    var r = document.documentElement.style;
    var map = { cream: '--cream', sand: '--sand', euc: '--euc', ochre: '--ochre',
                maroon: '--maroon', charcoal: '--charcoal', ink: '--ink', body: '--body' };
    Object.keys(map).forEach(function (k) { if (t[k]) r.setProperty(map[k], t[k]); });
    if (t.cardBg) r.setProperty('--white', t.cardBg);
    if (t.cardBorder) r.setProperty('--cardline', t.cardBorder);
    if (t.panelBg) r.setProperty('--panelbg', rgba(t.panelBg, t.panelOpacity));
    if (t.titleBandBg) r.setProperty('--bandbg', rgba(t.titleBandBg, t.titleBandOpacity));
  }

  function rgba(hex, a) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return hex;
    var o = (a === undefined || a === null || a === '') ? 1 : parseFloat(a);
    return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' +
           parseInt(h.slice(4, 6), 16) + ',' + o + ')';
  }

  /* =========================================================
     FOOTER WAVE
     The dot-art strip is a PNG with transparency. Sitting inside the
     dark footer, that transparency showed as a black band under the
     section above it. The strip takes the colour of whatever section
     precedes the footer, so the wave reads as one continuous edge.
     ========================================================= */
  function initFooterWave() {
    var w = document.querySelector('.fwave');
    if (!w) return;
    var foot = w.closest('footer');
    if (!foot) return;
    var prev = foot.previousElementSibling, bg = '';
    while (prev) {
      var cs = getComputedStyle(prev).backgroundColor;
      if (cs && cs !== 'transparent' && !/rgba\(0,\s*0,\s*0,\s*0\)/.test(cs)) { bg = cs; break; }
      prev = prev.previousElementSibling;
    }
    if (bg) w.style.backgroundColor = bg;
  }

  /* =========================================================
     PAGE HEADER IMAGES
     Each page's header photograph can be replaced from the admin
     without touching the file, same as any other image.
     ========================================================= */
  function initPageImage() {
    var f = location.pathname.split('/').pop() || 'index.html';
    var map = C.pageImages || {};
    var v = map[f];
    if (!v) return;
    var bg = document.querySelector('.phero .slide-bg');
    if (bg && !bg.id) bg.style.backgroundImage = "url('" + srcOf(v) + "')";
  }

  /* =========================================================
     SEO — per-page title and meta description
     ========================================================= */
  function initSeo() {
    var f = location.pathname.split('/').pop() || 'index.html';
    // read the map directly — a page name contains a dot, which the
    // dotted-path helper would treat as nesting
    var s = (C.seo || {})[f];
    if (!s) return;
    if (s.title) document.title = String(s.title).replace(/&amp;/g, '&');
    if (s.desc) {
      var m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'description'); document.head.appendChild(m); }
      m.setAttribute('content', s.desc);
    }
  }

  /* =========================================================
     SETTINGS — phone, fax, address and email addresses, so
     changing one in the admin updates every page at once.
     ========================================================= */
  function initSettings() {
    var s = get('settings', null);
    if (!s) return;
    document.querySelectorAll('[data-set]').forEach(function (el) {
      var v = s[el.getAttribute('data-set')];
      if (v) el.textContent = v;
    });
    document.querySelectorAll('[data-set-tel]').forEach(function (el) {
      if (!s.phone) return;
      el.setAttribute('href', 'tel:' + s.phone.replace(/[^\d+]/g, ''));
      el.textContent = (el.textContent.indexOf('Ph ') === 0 ? 'Ph ' : '') + s.phone;
    });
    document.querySelectorAll('[data-set-mail]').forEach(function (el) {
      var v = s[el.getAttribute('data-set-mail') || 'emailSales'];
      if (!v) return;
      el.setAttribute('href', 'mailto:' + v);
      el.textContent = v;
    });
  }

  /* =========================================================
     PROGRAM PAGES  (Health & Safety · Modern Slavery)
     ========================================================= */
  window.FNFF.program = function (key) {
    var p = get('programs.' + key, null) || {};
    var intro = document.getElementById('prog-intro');
    if (intro && !intro.innerHTML.trim()) intro.textContent = p.intro || '';

    var pts = document.getElementById('prog-points');
    if (pts) {
      pts.innerHTML = (p.points || []).map(function (x, i) {
        return '<article class="card rv"><div class="cnum"><b>' + ('0' + (i + 1)).slice(-2) + '</b></div>' +
          '<h3>' + esc(x.title) + '</h3><p>' + esc(x.body) + '</p></article>';
      }).join('') || '<div class="empty"><p>No program points added yet.</p></div>';
    }

    var ims = document.getElementById('prog-images'), sec = document.getElementById('prog-imgsec');
    var imgs = p.images || [];
    if (ims) {
      if (!imgs.length) { if (sec) sec.style.display = 'none'; }
      else {
        if (sec) sec.style.display = '';
        ims.innerHTML = imgs.map(function (im) {
          return '<figure class="imgtile rv"><img src="' + esc(srcOf(im.img)) + '" alt="' + esc(im.caption || '') +
            '" loading="lazy">' + (im.caption ? '<figcaption>' + esc(im.caption) + '</figcaption>' : '') + '</figure>';
        }).join('');
      }
    }

    var docs = document.getElementById('prog-docs');
    if (docs) {
      docs.innerHTML = (p.docs || []).map(function (c) {
        var im = c.img ? '<img src="' + esc(srcOf(c.img, 'assets/brand/')) + '" alt="' + esc(c.title) + '" loading="lazy">'
                       : '<div class="cert-ph">' + esc(c.title) + '</div>';
        var body = '<div class="cert-b"><h4>' + esc(c.title) + '</h4><span>' + esc(c.issuer || '') + '</span>' +
          (c.status ? '<span class="cert-st' + (/pend|final|progress/i.test(c.status) ? ' pend' : '') + '">' + esc(c.status) + '</span>' : '') + '</div>';
        var inner = '<div class="cert-img">' + im + '</div>' + body;
        return c.file
          ? '<a class="cert" href="' + esc(srcOf(c.file)) + '" target="_blank" rel="noopener">' + inner + '</a>'
          : '<article class="cert">' + inner + '</article>';
      }).join('') || '<div class="empty"><p>Program documents are provided on request. Upload them in the content admin to list them here.</p></div>';
    }
  };

  /* =========================================================
     CUSTOM PAGES  (created in the admin, served by page.html?p=slug)
     ========================================================= */
  window.FNFF.divisionHeader = function (cat) {
    var bg = document.getElementById('cat-bg');
    if (!bg) return;
    var img = (cat && (cat.header || cat.img)) || '';
    if (img) bg.style.backgroundImage = "url('" + srcOf(img) + "')";
  };

  window.FNFF.customPage = function () {
    var m = /[?&]p=([^&]+)/.exec(location.search);
    var slug = m ? decodeURIComponent(m[1]) : '';
    var pg = (get('pages', []) || []).filter(function (x) { return x.slug === slug; })[0];

    if (!pg) {
      document.getElementById('cp-h1').textContent = 'Page not found';
      document.getElementById('cp-lead').textContent = 'This page is no longer available.';
      document.getElementById('cp-body').innerHTML = '<p><a href="index.html">Return to the home page</a></p>';
      return;
    }
    document.title = (pg.seoTitle || pg.title) + ' | First Nation Fresh Foods';
    var md = document.querySelector('meta[name="description"]');
    if (md && pg.seoDesc) md.setAttribute('content', pg.seoDesc);

    document.getElementById('cp-kick').innerHTML = pg.kicker || 'First Nation Fresh Foods';
    document.getElementById('cp-h1').innerHTML = pg.title || '';
    document.getElementById('cp-lead').innerHTML = pg.lead || '';
    document.getElementById('cp-crumb').innerHTML = '<a href="index.html">Home</a> / ' + (pg.title || '');
    document.getElementById('cp-bg').style.backgroundImage =
      "url('" + srcOf(pg.heroImg || 'hero-about.jpg') + "')";
    document.getElementById('cp-body').innerHTML = pg.body || '';

    var imgs = pg.images || [];
    if (imgs.length) {
      document.getElementById('cp-imgsec').style.display = '';
      document.getElementById('cp-images').innerHTML = imgs.map(function (im) {
        return '<figure class="imgtile rv"><img src="' + esc(srcOf(im.img)) + '" alt="' + esc(im.caption || '') +
          '" loading="lazy">' + (im.caption ? '<figcaption>' + esc(im.caption) + '</figcaption>' : '') + '</figure>';
      }).join('');
    }
  };

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
        '<div class="slide-bg" style="background-image:url(\'' + esc(srcOf(s.img)) + '\')"></div>' +
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
    var items = get('categories', []);
    el.innerHTML = items.map(function (c, i) {
      return '<div class="cf" data-i="' + i + '">' +
        '<div class="cf-img" style="background-image:url(\'' + esc(srcOf(c.imgHome || c.img)) + '\')"></div>' +
        '<div class="cf-fade"></div><div class="cf-b"><span class="cf-chip">' + esc(c.chip || 'Range') + '</span>' +
        '<h3>' + esc(c.label) + '</h3><p>' + esc(c.short || '') + '</p></div></div>';
    }).join('');
    var cards = Array.prototype.slice.call(el.querySelectorAll('.cf'));
    var idx = Math.floor(cards.length / 2);

    function render() {
      cards.forEach(function (c, i) {
        var off = i - idx, a = Math.abs(off);
        c.style.transform = 'translateX(' + (off * 240) + 'px) translateZ(' + (-a * 200) + 'px) rotateY(' + (off * -30) + 'deg)';
        c.style.opacity = a > 2 ? 0 : 1 - a * 0.12;
        // no blur, only a light dim, so the produce photographs stay sharp
        c.style.filter = a === 0 ? 'none' : 'brightness(' + (1 - a * 0.10) + ')';
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
  var PAGE = 48;          // cards drawn at a time
  var shown = PAGE;       // how many of the current list are on screen

  function productHTML(p) {
    // Every card keeps the same shape whether or not a photograph exists,
    // so the grid stays even. Lines without a photo get a brand tile.
    var img = p.img
      ? '<div class="pimg"><img src="' + esc(srcOf(p.img)) + '" alt="' + esc(p.name) +
        '" width="640" height="480" loading="lazy" decoding="async"></div>'
      : '<div class="pimg ph" aria-hidden="true"></div>';
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
    /* ----------------------------------------------------------------
       Draw in batches. The full catalogue is 211 cards and about 17 MB
       of photography; putting it all in the page at once leaves most of
       it queued behind the browser's image limit, which is why cards
       further down sometimes stayed blank. A batch at a time loads
       reliably and the rest follow as the reader reaches them.
       ---------------------------------------------------------------- */
    if (shown > list.length) shown = Math.max(PAGE, Math.ceil(list.length / PAGE) * PAGE);
    var slice = list.slice(0, shown);

    grid.innerHTML = slice.map(productHTML).join('');
    grid.querySelectorAll('.padd').forEach(function (b) {
      b.addEventListener('click', function () { window.fnffAdd(b.getAttribute('data-n'), b.getAttribute('data-s'), b); });
    });

    var more = document.getElementById('pmore');
    if (more) more.parentNode.removeChild(more);
    if (list.length > slice.length) {
      var wrap = document.createElement('div');
      wrap.id = 'pmore';
      wrap.className = 'pmore';
      wrap.innerHTML = '<button class="btn btn-p btn-sm">Show the next ' +
        Math.min(PAGE, list.length - slice.length) + ' lines</button>' +
        '<span>' + slice.length + ' of ' + list.length + ' shown</span>';
      grid.parentNode.insertBefore(wrap, grid.nextSibling);
      wrap.querySelector('button').addEventListener('click', function () {
        shown += PAGE; renderCatalogue();
      });
      watchTail(wrap);
    }
  }

  /* load the next batch as the reader nears the end, so the button is
     a fallback rather than something they have to keep pressing */
  var tailWatcher = null;
  function watchTail(el) {
    if (!('IntersectionObserver' in window)) return;
    if (tailWatcher) tailWatcher.disconnect();
    tailWatcher = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { tailWatcher.disconnect(); shown += PAGE; renderCatalogue(); }
    }, { rootMargin: '600px' });
    tailWatcher.observe(el);
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
        activeCat = t.getAttribute('data-c'); shown = PAGE;
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
        '<img src="' + esc(srcOf(c.img)) + '" alt="' + c.label + '" loading="lazy"></div>' +
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
      var img = c.img ? '<img src="' + esc(srcOf(c.img, 'assets/brand/')) + '" alt="' + esc(c.title) + '" loading="lazy">'
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
        else if (v.url && /\.(mp4|webm|mov)$/i.test(v.url)) frame = '<video src="' + esc(srcOf(v.url)) + '" controls preload="metadata"></video>';
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
        '<img src="' + esc(srcOf(p.img, 'assets/brand/')) + '" alt="' + esc(p.name) + '" loading="lazy" style="object-fit:contain;padding:14px"></div>' +
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
  /* ---------------------------------------------------------------
     FORM DELIVERY
     Posted to the site's own endpoint, which sends the mail from the
     server. Nothing opens Gmail, Outlook or any other mail client.
     If the endpoint is not reachable (for example when the site is
     opened straight from disk), the form falls back to a mail link so
     the enquiry is never simply lost.
     --------------------------------------------------------------- */
  function endpoint() { return get('settings.formEndpoint', 'send.php'); }

  function say(el, cls, text) {
    if (!el) return;
    el.classList.add('fstatus');
    el.classList.remove('ok', 'err', 'busy');
    if (cls) el.classList.add(cls);
    el.textContent = text;
  }

  function post(payload, statusEl, btn, okText, fallback) {
    var url = endpoint();
    var original = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
    say(statusEl, 'busy', 'Sending…');

    function done(ok, message) {
      if (btn) { btn.disabled = false; btn.textContent = original; }
      if (ok) { say(statusEl, 'ok', okText); toast(okText); }
      else { say(statusEl, 'err', message); }
    }

    if (!url || location.protocol === 'file:') { fallback(); done(true, ''); return; }

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return { ok: r.ok }; });
    }).then(function (j) {
      if (j && j.ok) done(true, '');
      else done(false, (j && j.error) || 'We could not send that. Please call us or email directly.');
    }).catch(function () {
      fallback();
      done(false, 'The mail service did not respond. Your email program has been opened instead.');
    });
  }

  function mailtoFallback(to, subject, body) {
    try {
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    } catch (e) { }
  }

  window.fnffSubmit = function (ev) {
    ev.preventDefault();
    var msg = document.getElementById('qmsg'), f = ev.target;
    if (!Q.length) { msg.className = 'qmsg err'; msg.textContent = 'Add at least one line before submitting.'; return false; }

    var to = get('settings.emailOrders', 'orders@firstnationfreshfoods.com.au');
    var lines = Q.map(function (i, n) {
      return (n + 1) + '. ' + i.name + (i.spec ? '  [' + i.spec + ']' : '') + (i.qty ? '  — Qty: ' + i.qty : '');
    }).join('\n');
    var text = 'QUOTE SPECIFICATION REQUEST\n===========================\n\n' +
      'Organisation: ' + f.org.value + '\nContact: ' + f.person.value + '\nEmail: ' + f.email.value +
      '\nPhone: ' + f.phone.value + (f.notes.value ? '\nNotes: ' + f.notes.value : '') +
      '\n\nLINES (' + Q.length + ')\n' + lines;
    var subject = 'Quote specification — ' + f.org.value;

    post({
      form: 'quote', to: to, subject: subject,
      name: f.person.value, email: f.email.value, phone: f.phone.value,
      org: f.org.value, notes: f.notes.value, items: Q, text: text
    }, msg, f.querySelector('button[type=submit]'),
      'Sent. Our sales desk will respond shortly.',
      function () { mailtoFallback(to, subject, text); });

    return false;
  };

  window.fnffEnquiry = function (ev) {
    ev.preventDefault();
    var f = ev.target, out = f.querySelector('[data-feedback]');
    var to = get('settings.emailSales', 'sales@firstnationfreshfoods.com.au');
    var subject = 'Website enquiry — ' + f.org.value;
    var text = 'WEBSITE ENQUIRY\n===============\n\nOrganisation: ' + f.org.value +
      '\nContact: ' + f.person.value + '\nEmail: ' + f.email.value +
      '\nPhone: ' + f.phone.value + '\n\n' + f.message.value;

    post({
      form: 'enquiry', to: to, subject: subject,
      name: f.person.value, email: f.email.value, phone: f.phone.value,
      org: f.org.value, message: f.message.value, text: text
    }, out, f.querySelector('button[type=submit]'),
      'Sent. We will be in touch shortly.',
      function () { mailtoFallback(to, subject, text); });

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
    initTheme(); initNav(); initSeo(); initSettings();
    initPageImage(); initFooterWave();
    bindText();
    initHero(); initTicker(); initCover(); initTilt();
    initTabs(); initCatCards(); renderCatalogue();
    initCerts(); initVideos(); initOwnLabel(); initMarkets();
    qCount(); qRender(); initStats(); initReveal(); initEdit();

    var s = document.getElementById('psearch');
    if (s) s.addEventListener('input', function () { shown = PAGE; renderCatalogue(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') window.fnffDrawer(false); });
  });
})();
