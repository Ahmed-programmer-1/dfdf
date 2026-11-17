/* ============================================================
   nav.js — شريط تنقل سفلي على الموبايل (الرئيسية / بحث / قوائمي / المزيد)
   بيتحمّل في كل صفحات الزوار، ويظهر على الشاشات الصغيرة فقط.
   ============================================================ */
(function () {
  'use strict';
  if (window.__hakimNav || !document.body) return;
  window.__hakimNav = true;
  /* خريطة الطبقات (من الأسفل للأعلى): المحتوى < الشريط السفلي (35) < تيليجرام/رجوع للقمة (36) < اقتراح التثبيت/التذكير (90) < toast (100) < النوافذ (200+).
     --bar-h = ارتفاع الشريط (بدون المساحة الآمنة). أي عنصر عايم بيتحط: bottom = --bar-h + 12px + المساحة الآمنة. بيبقى 0 لما الشريط يتخفّى (كيبورد / بحث كامل / مشغّل ملء الشاشة). */
  var CSS = '.m-nav{display:none}@media (max-width:720px){' +
    ':root{--bar-h:58px}html.hk-nobar{--bar-h:0px}html.hk-nobar .m-nav{display:none}' +
    '.m-nav{display:flex;align-items:stretch;position:fixed;left:0;right:0;bottom:0;z-index:35;box-sizing:border-box;height:calc(var(--bar-h) + env(safe-area-inset-bottom,0px));background:var(--surface,#121214);border-top:1px solid var(--line,#26262a);padding:0 6px env(safe-area-inset-bottom,0px);box-shadow:0 -6px 20px rgba(0,0,0,.25);overscroll-behavior:contain;touch-action:manipulation}' +
    '.m-nav a,.m-nav button{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:none;border:0;color:var(--text-muted,#9a9aa2);font:inherit;font-size:.68rem;font-weight:700;padding:0 2px;border-radius:12px;cursor:pointer;text-decoration:none;-webkit-tap-highlight-color:transparent}' +
    '.m-nav svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.m-nav .on{color:var(--red,#e5202c)}.m-nav .on svg{stroke:var(--red,#e5202c)}' +
    'body{padding-bottom:calc(var(--bar-h) + env(safe-area-inset-bottom,0px))}' +
    '.floating-telegram{bottom:calc(var(--bar-h) + 12px + env(safe-area-inset-bottom,0px)) !important;z-index:36}' +
    '.toast{bottom:calc(var(--bar-h) + 12px + env(safe-area-inset-bottom,0px)) !important;z-index:100}' +
    'body:has(#hkSnack,.hk-rem) .floating-telegram{bottom:calc(var(--bar-h) + 88px + env(safe-area-inset-bottom,0px)) !important}}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var isHome = (here === 'index.html' || here === '') && !window.__COURSE_ID;
  var tab = new URLSearchParams(location.search).get('tab');
  var I = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    lists: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.6-9.3-9A5.4 5.4 0 0112 6a5.4 5.4 0 019.3 6c-2.3 4.4-9.3 9-9.3 9z"/></svg>',
    more: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };
  var nav = document.createElement('nav'); nav.className = 'm-nav'; nav.id = 'hkBar'; nav.setAttribute('aria-label', 'تنقل سريع');
  function item(tag, key, label, on, attrs) {
    var el = document.createElement(tag); el.innerHTML = I[key] + '<span>' + label + '</span>';
    if (on) el.className = 'on';
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  nav.appendChild(item('a', 'home', 'الرئيسية', isHome, { href: 'index.html' }));
  var s = item('button', 'search', 'بحث', false, { type: 'button' });
  /* شاشة البحث الكاملة (m-search.js) — بتتحمّل بهدوء بعد فتح الصفحة، فالضغطة بتفتحها فورًا */
  var msLoad = null;
  function loadMs() {
    if (window.HakimMSearch) return Promise.resolve();
    if (msLoad) return msLoad;
    msLoad = new Promise(function (res) { var sc = document.createElement('script'); sc.src = 'm-search.js?v=' + Math.floor(Date.now() / 30000); sc.onload = res; sc.onerror = function () { msLoad = null; res(); }; (document.head || document.documentElement).appendChild(sc); });
    return msLoad;
  }
  function openMs() {
    if (window.HakimMSearch) { window.HakimMSearch.open(); return; }
    loadMs().then(function () { if (window.HakimMSearch) window.HakimMSearch.open(); else location.href = 'index.html?focus=search'; });
  }
  s.addEventListener('click', openMs);
  s.addEventListener('touchstart', loadMs, { passive: true });
  (window.requestIdleCallback || function (f) { return setTimeout(f, 1500); })(function () { loadMs(); });
  if (new URLSearchParams(location.search).get('focus') === 'search' && window.matchMedia && matchMedia('(max-width:720px)').matches) loadMs().then(openMs);
  nav.appendChild(s);
  nav.appendChild(item('a', 'lists', 'قوائمي', here === 'mylists.html', { href: 'mylists.html' }));
  var m = item('button', 'more', 'المزيد', false, { type: 'button' });
  m.addEventListener('click', function () { var b = document.getElementById('menuBtn'); if (b) b.click(); });
  nav.appendChild(m);
  document.body.appendChild(nav);

  try { var __u = JSON.parse(localStorage.getItem('hk_ui') || 'null'); if (__u) { var __h = __u.hide || {}; Object.keys(__h).forEach(function (k) { if (__h[k] && /^[a-z_0-9]+$/i.test(k)) document.documentElement.classList.add('hk-h-' + k); }); if (__u.menuPos === 'start') document.documentElement.classList.add('hk-menu-start'); } } catch (e) {}
  /* إخفاء/إظهار الأزرار العائمة (تيليجرام / رجوع للقمة) لكل جهاز — من الأدمن ← إعدادات الموقع ← 🔘 الأزرار العائمة (floatBtns في site-settings.js) */
  (function () {
    var tries = 0;
    function apply() {
      var s = window.SITE_SETTINGS; if (!s) { if (tries++ < 20) setTimeout(apply, 250); return; }
      var ui = s.ui || {}, hd = ui.hide || {}, root = document.documentElement;
      Object.keys(hd).forEach(function (k) { if (hd[k] && /^[a-z_0-9]+$/i.test(k)) root.classList.add('hk-h-' + k); });
      if (ui.menuPos === 'start') root.classList.add('hk-menu-start');
      try { localStorage.setItem('hk_ui', JSON.stringify(ui)); } catch (e) {}
      var fb = s.floatBtns; if (!fb || document.getElementById('hkFloatCss')) return;
      var rules = [];
      [['telegram', '.floating-telegram'], ['backTop', '.hk-top']].forEach(function (p) {
        var c = fb[p[0]]; if (!c) return;
        if (c.mobile === false) rules.push('@media (max-width:720px){' + p[1] + '{display:none!important}}');
        if (c.desktop === false) rules.push('@media (min-width:721px){' + p[1] + '{display:none!important}}');
      });
      if (rules.length) { var st = document.createElement('style'); st.id = 'hkFloatCss'; st.textContent = rules.join(''); document.head.appendChild(st); }
    }
    apply();
  })();

  /* الشريط يتخفّى لما: الكيبورد يفتح (visualViewport)، شاشة البحث الكاملة تفتح، أو مشغّل الفيديو يدخل ملء الشاشة */
  var de = document.documentElement, vv = window.visualViewport, maxH = window.innerHeight, kb = false;
  function isField(el) { return !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !/^(checkbox|radio|button|submit|range|file)$/i.test(el.type || ''); }
  function sync() {
    var h = vv ? vv.height : window.innerHeight;
    if (!isField(document.activeElement)) { maxH = Math.max(window.innerHeight, h); kb = false; }
    else kb = Math.max(maxH, window.innerHeight) - h > 120;
    var fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
    de.classList.toggle('hk-nobar', kb || fs || de.classList.contains('hk-ms-open'));
  }
  window.hakimBarSync = sync;
  if (vv) { vv.addEventListener('resize', sync); }
  window.addEventListener('resize', sync);
  document.addEventListener('focusin', function () { setTimeout(sync, 60); });
  document.addEventListener('focusout', function () { setTimeout(sync, 60); });
  document.addEventListener('fullscreenchange', sync); document.addEventListener('webkitfullscreenchange', sync);
})();

/* تحميل نظام الحسابات (account.js) تلقائيًا في كل الصفحات اللي فيها nav.js */
(function () { if (window.__hakimAccLoad) return; window.__hakimAccLoad = true; var s = document.createElement('script'); s.src = 'account.js'; s.defer = true; (document.head || document.documentElement).appendChild(s); })();

/* هيدر الموبايل: حقل البحث بيختفي لما تنزل تتصفّح (يوفّر مساحة) ويرجع لما تطلع لفوق.
   اتعدّل لمنع "الارتعاش": تغيير ارتفاع الهيدر كان بيحرّك الصفحة فيتقلب اتجاه التمرير ويتكرر. دلوقتي: مسافة تراكمية + قفل أثناء الحركة. */
(function () {
  var de = document.documentElement, last = window.pageYOffset || 0, acc = 0, lockUntil = 0, busy = false;
  function set(on) { if (de.classList.contains('hk-compact') === on) return; de.classList.toggle('hk-compact', on); lockUntil = Date.now() + 450; acc = 0; last = window.pageYOffset || 0; }
  window.addEventListener('scroll', function () {
    if (busy) return; busy = true;
    requestAnimationFrame(function () {
      busy = false;
      var y = window.pageYOffset || 0;
      if (Date.now() < lockUntil) { last = y; return; }
      if (y < 40) { set(false); last = y; return; }
      var d = y - last; last = y;
      if (d * acc < 0) acc = 0;
      acc += d;
      if (acc > 140 && y > 160) set(true);
      else if (acc < -90) set(false);
    });
  }, { passive: true });
})();

/* القائمة الجانبية: مجموعة "تواصل معنا" بتتفتح وتتقفل بزر ▼ (زي قوائمي) */
document.addEventListener('click', function (e) {
  var b = e.target.closest && e.target.closest('.menu-group-toggle'); if (!b) return;
  var body = b.nextElementSibling; if (!body) return;
  var open = body.hidden; body.hidden = !open; b.setAttribute('aria-expanded', open ? 'true' : 'false');
});

/* ===== زر "رجوع للقمة" (بيظهر بعد التمرير؛ مش بيظهر في صفحة الكورس) ===== */
(function () {
  if (!document.body || document.body.getAttribute('data-page') === 'course' || window.__hakimTop) return;
  window.__hakimTop = true;
  var st = document.createElement('style');
  st.textContent = '.hk-top{position:fixed;right:12px;bottom:calc(var(--bar-h,0px) + 12px + env(safe-area-inset-bottom,0px));z-index:36;width:44px;height:44px;border-radius:50%;border:1px solid var(--line,#26262a);background:var(--surface,#121214);color:var(--text,#f2f2f2);box-shadow:0 6px 18px rgba(0,0,0,.4);cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transform:translateY(10px);transition:opacity .2s ease,transform .2s ease,background .15s}' +
    '.hk-top.on{opacity:1;pointer-events:auto;transform:none}.hk-top:hover{background:var(--red,#e5202c);color:#fff;border-color:var(--red,#e5202c)}.hk-top svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}' +
    '@media (max-width:720px){body:has(#hkSnack,.hk-rem) .hk-top{bottom:calc(var(--bar-h,0px) + 88px + env(safe-area-inset-bottom,0px))}}@media (min-width:721px){.hk-top{bottom:24px;right:auto;left:14px}}@media (prefers-reduced-motion:reduce){.hk-top{transition:none}}';
  document.head.appendChild(st);
  var b = document.createElement('button'); b.type = 'button'; b.className = 'hk-top';
  b.setAttribute('aria-label', (window.SITE_TEXT && window.SITE_TEXT.backToTop) || 'رجوع لأعلى الصفحة');
  b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  b.addEventListener('click', function () { var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; window.scrollTo({ top: 0, behavior: rm ? 'auto' : 'smooth' }); });
  document.body.appendChild(b);
  var tick = false;
  window.addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { tick = false; b.classList.toggle('on', (window.pageYOffset || document.documentElement.scrollTop) > 700); });
  }, { passive: true });
})();

/* ===== نصوص الواجهة: تعديل أي نص ظاهر من محرر النصوص (ui-text.js) بدون لمس الكود ===== */
(function () {
  if (!document.body || window.__hakimUiText) return;
  window.__hakimUiText = true;
  var KEY = 'hakim_ui_text', map = {}, has = false, ATTRS = ['placeholder', 'title', 'aria-label'];
  function nz(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function setMap(o) { map = {}; has = false; if (o && typeof o === 'object') for (var k in o) { if (typeof o[k] === 'string' && o[k].trim() && nz(k) !== nz(o[k])) { map[nz(k)] = o[k]; has = true; } } }
  function fixText(n) {
    var v = n.nodeValue; if (!v || !v.trim()) return;
    var t = nz(v), r = map[t]; if (r === undefined || r === t) return;
    n.nodeValue = v.match(/^\s*/)[0] + r + v.match(/\s*$/)[0];
  }
  function fixEl(el) {
    if (!el.getAttribute) return;
    for (var i = 0; i < ATTRS.length; i++) { var v = el.getAttribute(ATTRS[i]); if (v) { var r = map[nz(v)]; if (r !== undefined && r !== v) el.setAttribute(ATTRS[i], r); } }
  }
  function walk(root) {
    if (!has || !root) return;
    if (root.nodeType === 3) { if (!/^(SCRIPT|STYLE|TEXTAREA)$/.test((root.parentNode || {}).tagName || '')) fixText(root); return; }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA)$/.test(root.tagName)) return;
    fixEl(root);
    var els = root.querySelectorAll('[placeholder],[title],[aria-label]'); for (var i = 0; i < els.length; i++) fixEl(els[i]);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { return /^(SCRIPT|STYLE|TEXTAREA)$/.test((n.parentNode || {}).tagName || '') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; } });
    var n; while ((n = tw.nextNode())) fixText(n);
  }
  try { setMap(JSON.parse(localStorage.getItem(KEY))); } catch (e) {}
  walk(document.body);
  try {
    new MutationObserver(function (muts) {
      if (!has) return;
      for (var i = 0; i < muts.length; i++) {
        var m = muts[i];
        if (m.type === 'childList') { for (var j = 0; j < m.addedNodes.length; j++) walk(m.addedNodes[j]); }
        else if (m.type === 'attributes') fixEl(m.target);
        else if (m.type === 'characterData') fixText(m.target);
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ATTRS, characterData: true });
  } catch (e) {}
  var s = document.createElement('script'); s.src = 'ui-text.js?v=' + Math.floor(Date.now() / 60000);
  s.onload = function () { if (window.UI_TEXT) { try { localStorage.setItem(KEY, JSON.stringify(window.UI_TEXT)); } catch (e) {} setMap(window.UI_TEXT); walk(document.body); } };
  s.onerror = function () {}; document.head.appendChild(s);
})();

/* ===== شريط تذكير المذاكرة (بيظهر بعد الميعاد لو التذكير مفعّل ولسه ما شافش حاجة النهاردة) ===== */
(function () {
  if (!document.body || document.body.getAttribute('data-page') === 'course' || window.__hakimRem) return;
  window.__hakimRem = true;
  function ymd(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  setTimeout(function () {
    var r, now = new Date(), today = ymd(now);
    try { r = JSON.parse(localStorage.getItem('hakim_reminder')); } catch (e) {}
    if (!r || !r.on || (r.days || []).indexOf(now.getDay()) < 0) return;
    var t = String(r.time || '20:00').split(':'), at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(t[0], 10) || 0, parseInt(t[1], 10) || 0);
    if (now < at) return;
    try { if (localStorage.getItem('hakim_rem_dismiss') === today) return; var lw = JSON.parse(localStorage.getItem('hakim_last_watch')); if (lw && lw.ts && ymd(new Date(lw.ts)) === today) return; } catch (e) {}
    var T = window.SITE_TEXT || {}, lw2 = null; try { lw2 = JSON.parse(localStorage.getItem('hakim_last_watch')); } catch (e) {}
    var href = lw2 && lw2.id ? hakimCourseHref(lw2.id, lw2.num) : 'index.html';
    var st = document.createElement('style');
    st.textContent = '.hk-rem{position:fixed;left:12px;right:12px;bottom:calc(var(--bar-h,0px) + 12px + env(safe-area-inset-bottom,0px));z-index:90;max-width:440px;margin:0 auto;display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface,#121214);border:1px solid var(--red,#e5202c);border-radius:14px;box-shadow:0 8px 26px rgba(0,0,0,.45);font-size:.85rem;font-weight:700}.hk-rem span{flex:1}.hk-rem a{background:var(--red,#e5202c);color:#fff;border-radius:999px;padding:7px 14px;text-decoration:none;font-weight:800;white-space:nowrap}.hk-rem button{background:none;border:0;color:var(--text-muted,#9a9aa2);font-size:1.1rem;cursor:pointer;padding:4px}@media (min-width:721px){.hk-rem{bottom:20px;right:auto;margin:0;left:20px}}';
    document.head.appendChild(st);
    var b = document.createElement('div'); b.className = 'hk-rem'; b.setAttribute('role', 'status');
    var sp = document.createElement('span'); sp.textContent = T.remBannerText || 'ميعاد مذاكرتك جه ⏰ كمّل من حيث وقفت';
    var a = document.createElement('a'); a.href = href; a.textContent = T.remBannerBtn || 'كمّل دلوقتي';
    var x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'إغلاق'); x.textContent = '✕';
    x.addEventListener('click', function () { try { localStorage.setItem('hakim_rem_dismiss', today); } catch (e) {} b.remove(); });
    b.appendChild(sp); b.appendChild(a); b.appendChild(x); document.body.appendChild(b);
  }, 2500);
})();


/* ============================================================
   🔔 جرس الإشعارات بجانب زر تثبيت التطبيق: بيتلوّن أحمر وبيظهر عدّاد لو فيه إشعار لسه ما اتقرأش.
   "مقروء" = الزائر فتح صفحة الإشعارات بعد صدوره. الإشعارات الأقدم من 14 يوم ما بتتحسبش كجديدة لزائر جديد.
   ============================================================ */
(function () {
  'use strict';
  if (window.__hakimBell) return; window.__hakimBell = true;
  function key(n) { return n.id || ((n.title || '') + '|' + (n.date || '')); }
  function unreadCount(list) {
    var seen = []; try { seen = JSON.parse(localStorage.getItem('hakim_notif_seen_ids') || '[]'); } catch (e) {}
    var now = Date.now(), c = 0;
    list.forEach(function (n) {
      if (seen.indexOf(key(n)) > -1) return;
      var t = n.date ? Date.parse(n.date) : NaN;
      if (!isNaN(t) && now - t > 14 * 86400000) return;
      c++;
    });
    return c;
  }
  function paint(bell, c) {
    bell.classList.toggle('unread', c > 0);
    var dot = bell.querySelector('.hk-bell-dot'); dot.textContent = c > 9 ? '9+' : String(c); dot.style.display = c > 0 ? '' : 'none';
    bell.setAttribute('aria-label', c > 0 ? 'الإشعارات — ' + c + ' جديد' : 'الإشعارات');
  }
  function init() {
    var inst = document.getElementById('installAppBtn'); if (!inst || document.getElementById('hkBell')) return;
    var bell = document.createElement('a'); bell.id = 'hkBell'; bell.className = 'icon-btn hk-bell'; bell.href = 'notifications.html'; bell.title = 'الإشعارات';
    bell.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1z"/></svg><span class="hk-bell-dot" style="display:none"></span>';
    inst.parentNode.insertBefore(bell, inst);
    paint(bell, 0);
    var load = typeof hakimLoadScript === 'function' ? hakimLoadScript('notifications.js') : new Promise(function (res) { var s = document.createElement('script'); s.src = 'notifications.js?v=' + Math.floor(Date.now() / 30000); s.onload = res; s.onerror = res; document.head.appendChild(s); });
    Promise.resolve(load).then(function () { paint(bell, unreadCount(window.NOTIFICATIONS || [])); }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();


/* تحميل زخرفة الكروت (الاسم الإنجليزي + مترجم/مدبلج + التقييم) في كل الصفحات */
(function () { if (window.__hakimCardXLoader) return; window.__hakimCardXLoader = true; var s = document.createElement('script'); s.src = 'card-extras.js?v=1'; s.defer = true; document.head.appendChild(s); })();


/* ============================================================
   قائمة الموبايل: الإشعارات (بعدّاد) + الأخبار + تسجيل الخروج آخر خيار — بتتضاف تلقائيًا لو مش موجودة
   ============================================================ */
(function () {
  'use strict';
  if (window.__hakimMenuExtras) return; window.__hakimMenuExtras = true;
  var ICON = { bell: 'M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z', news: 'M4 4h13a2 2 0 012 2v12a2 2 0 002 2H6a2 2 0 01-2-2V4zm3 4v2h8V8H7zm0 4v2h8v-2H7z', out: 'M10 17l1.4-1.4L8.8 13H20v-2H8.8l2.6-2.6L10 7l-5 5 5 5zM4 5h8V3H4a2 2 0 00-2 2v14a2 2 0 002 2h8v-2H4V5z' };
  function link(cls, href, label, ico, extra) { var a = document.createElement('a'); a.className = 'menu-link ' + cls; a.href = href; a.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + ico + '"/></svg>' + label + (extra || ''); return a; }
  function build(host) {
    if (!host || host.__hkx) return; var links = host.querySelectorAll('a.menu-link'); if (!links.length) return; host.__hkx = 1;
    var has = function (f) { return Array.prototype.some.call(links, function (a) { return (a.getAttribute('href') || '').indexOf(f) === 0; }); };
    var bell = document.getElementById('hkBell'), unread = bell && bell.classList.contains('unread') ? (bell.querySelector('.hk-bell-dot') || {}).textContent : '';
    var anchor = host.querySelector('.menu-group-toggle');
    function put(el) { if (anchor) host.insertBefore(el, anchor); else host.appendChild(el); }
    if (!has('notifications.html')) put(link('hk-menu-notif', 'notifications.html', 'الإشعارات', ICON.bell, ''));
    var n = host.querySelector('a[href^="notifications.html"]');
    if (n && unread && !n.querySelector('.hk-bell-dot')) { n.classList.add('hk-menu-notif'); n.insertAdjacentHTML('beforeend', '<span class="hk-bell-dot">' + unread + '</span>'); }
    if (!has('news.html')) put(link('', 'news.html', 'الأخبار', ICON.news, ''));
    if (!has('about.html')) put(link('', 'about.html', 'عن المنصة', 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z', ''));
    function logout() {
      var old = host.querySelector('.hk-menu-logout'); if (old) old.remove();
      var u = window.HakimAccount && HakimAccount.user; if (!u) return;
      var b = document.createElement('a'); b.href = '#'; b.className = 'menu-link hk-menu-logout'; b.innerHTML = '<svg viewBox="0 0 24 24"><path d="' + ICON.out + '"/></svg>تسجيل الخروج';
      b.addEventListener('click', function (e) { e.preventDefault(); try { HakimAccount.signOut(); } catch (er) {} if (typeof hakimToast === 'function') hakimToast('تم تسجيل الخروج', 'success'); setTimeout(function () { location.reload(); }, 400); });
      host.appendChild(b);   /* آخر خيار في المنيو */
    }
    logout(); if (window.HakimAccount && HakimAccount.onChange) HakimAccount.onChange(logout);
  }
  function init() {
    var host = document.getElementById('sideMenuItems'); if (!host) return;
    build(host); new MutationObserver(function () { host.__hkx = 0; build(host); }).observe(host, { childList: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* ============================================================
   ⚡ طبقة السرعة (كل الصفحات) — 7 نوفمبر 2026
   1) hakimImgUrl(url, width): لو اتحدد imageCdn في إعدادات الموقع (قالب رابط خدمة تصغير/WebP بعد الاستضافة الخارجية) بيرجّع الصورة مصغّرة، وإلا بيرجّع الرابط زي ما هو.
      imageCdn مثال: "https://img.example.com/cdn-cgi/image/width={w},quality=75,format=auto/{url}"  ({w} العرض بالبكسل، {url} رابط الصورة الأصلي، {eu} نفس الرابط مُرمَّز).
   2) hakimPreconnect(urls): بيفتح اتصال مبكر بخوادم الصور اللي هتتحمّل.
   3) تحميل مسبق ذكي للصفحة قبل الضغط (لمس/مرور الماوس) — بيوقف نفسه مع «توفير البيانات» والشبكات البطيئة.
   ============================================================ */
(function () {
  var conn = navigator.connection || {}, SAVE = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  window.hakimImgUrl = function (url, w) {
    try {
      var t = (window.SITE_SETTINGS || {}).imageCdn; if (!t || !url || !/^https?:/i.test(url)) return url;
      var dpr = Math.min(2, window.devicePixelRatio || 1), px = Math.round((w || 300) * dpr / 20) * 20 || 300;
      return t.split('{w}').join(px).split('{eu}').join(encodeURIComponent(url)).split('{url}').join(url);
    } catch (e) { return url; }
  };
  var seenOrigins = {};
  window.hakimPreconnect = function (urls) {
    (urls || []).slice(0, 40).forEach(function (u) {
      try {
        var o = new URL(u, location.href).origin; if (o === location.origin || seenOrigins[o] || Object.keys(seenOrigins).length >= 4) return; seenOrigins[o] = 1;
        var l = document.createElement('link'); l.rel = 'preconnect'; l.href = o; l.crossOrigin = ''; document.head.appendChild(l);
        var d = document.createElement('link'); d.rel = 'dns-prefetch'; d.href = o; document.head.appendChild(d);
      } catch (e) {}
    });
  };
  if (SAVE) return;
  var done = {}, tm = null, PAGES = /^(index|section|profile|mylists|notifications|polls|schedule|suggestions|news|contact|privacy|about|offline|maintenance|admin|course)(\d*)\.html$/;
  function pf(href) {
    if (done[href] || Object.keys(done).length > 24) return; done[href] = 1;
    var l = document.createElement('link'); l.rel = 'prefetch'; l.href = href; l.as = 'document'; document.head.appendChild(l);
    var m = /^([A-Za-z0-9_\-]+)\.html$/.exec(href.split('?')[0].split('/').pop());
    if (m && !PAGES.test(m[0])) { var d = document.createElement('link'); d.rel = 'prefetch'; d.href = m[1] + '.js'; d.as = 'script'; document.head.appendChild(d); }   /* بيانات الكورس */
  }
  function target(e) { var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.origin !== location.origin || /\.html(\?|$)/.test(a.pathname + a.search) === false && a.pathname !== '/') return null; if (a.href === location.href) return null; return a; }
  document.addEventListener('touchstart', function (e) { var a = target(e); if (a) pf(a.pathname.split('/').pop() + a.search); }, { passive: true, capture: true });
  document.addEventListener('mouseover', function (e) { var a = target(e); if (!a) return; clearTimeout(tm); tm = setTimeout(function () { pf(a.pathname.split('/').pop() + a.search); }, 80); }, { passive: true, capture: true });
  document.addEventListener('mouseout', function () { clearTimeout(tm); }, { passive: true, capture: true });
})();

/* ============================================================
   📢 شريط الإشعار العلوي (كل الأقسام): من الأدمن ← الإشعارات ← «إظهار كشريط». فيه صورة/رابط اختياريين، وجدولة، وزر ✕ للمستخدم.
   ============================================================ */
(function () {
  if (/\/(admin|offline|maintenance)\.html$/.test(location.pathname)) return;
  var KEY = 'hk_nbar_cache';
  function live(n) { var t = Date.now(); return n && n.banner && (!n.start || Date.parse(n.start) <= t) && (!n.end || Date.parse(n.end) > t); }
  function gone(n) { try { return localStorage.getItem('hk_nd_' + n.id) === '1'; } catch (e) { return false; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function render(n) {
    var old = document.getElementById('hkNBar'); if (old) old.remove();
    if (!n || !live(n) || gone(n) || !document.body) return;
    var url = n.url || 'notifications.html', ext = /^https?:/i.test(url) && url.indexOf(location.origin) !== 0;
    var b = document.createElement('div'); b.id = 'hkNBar'; b.className = 'hk-nbar'; b.setAttribute('role', 'status');
    b.innerHTML = '<a class="hk-nbar-in" href="' + esc(url) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + (n.image ? '<img src="' + esc(n.image) + '" alt="" referrerpolicy="no-referrer">' : '<span class="hk-nbar-ic">📢</span>') + '<span class="hk-nbar-tx"><b>' + esc(n.title) + '</b>' + (n.message ? '<small>' + esc(n.message) + '</small>' : '') + '</span></a><button type="button" class="hk-nbar-x" aria-label="إغلاق">✕</button>';
    b.querySelector('.hk-nbar-x').addEventListener('click', function () { try { localStorage.setItem('hk_nd_' + n.id, '1'); } catch (e) {} b.remove(); });
    document.body.insertBefore(b, document.body.firstChild);
  }
  function pick(list) { return (list || []).filter(live).filter(function (n) { return !gone(n); }).slice(-1)[0] || null; }
  try { var c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c) { var run = function () { render(c); }; if (document.body) run(); else document.addEventListener('DOMContentLoaded', run); } } catch (e) {}
  function refresh() {
    var sc = document.createElement('script'); sc.src = 'notifications.js?v=' + Math.floor(Date.now() / 60000);
    sc.onload = function () { var n = pick(window.NOTIFICATIONS); try { localStorage.setItem(KEY, n ? JSON.stringify(n) : 'null'); } catch (e) {} render(n); };
    document.head.appendChild(sc);
  }
  (window.requestIdleCallback || function (f) { return setTimeout(f, 1200); })(refresh);
})();

/* ============================================================
   🛠️ أدوات الأدمن السريعة على الكروت: لما تكون مسجّل دخول في لوحة الأدمن (آخر 12 ساعة) بتظهر على كل كرت أزرار ✏️ تعديل / 🗄️ أرشفة / 🗑️ حذف.
   الأزرار بتفتح لوحة الأدمن بالإجراء — والتنفيذ الفعلي بيحتاج جلسة الأدمن (مفيش صلاحيات بتتكشف للزوار).
   ============================================================ */
(function () {
  var h = 0; try { h = +localStorage.getItem('hakim_admin_hint') || 0; } catch (e) {}
  if (!h || Date.now() - h > 12 * 3600 * 1000 || /\/admin\.html$/.test(location.pathname)) return;
  var NON = /^(index|section|profile|mylists|notifications|polls|schedule|suggestions|news|contact|privacy|about|offline|maintenance|admin|course)\d*$/;
  function idOf(card) { var a = card.matches('a[href]') ? card : card.querySelector('a[href]'); if (!a) return null; var m = /([A-Za-z0-9_\-]+)\.html/.exec(a.getAttribute('href') || ''); return m && !NON.test(m[1]) ? m[1] : null; }
  function tools(card) {
    if (card.__adm) return; var id = idOf(card); if (!id) return; card.__adm = 1;
    var host = card.querySelector('.card-media, .hc-img, .gc-img, .sim-img, .similar-img') || card; if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var bar = document.createElement('div'); bar.className = 'hk-adm';
    [['edit', '✏️', 'تعديل'], ['archive', '🗄️', 'أرشفة'], ['delete', '🗑️', 'حذف']].forEach(function (a) {
      var b = document.createElement('button'); b.type = 'button'; b.title = a[2]; b.textContent = a[1];
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); window.open('admin.html?act=' + a[0] + '&id=' + encodeURIComponent(id), '_blank'); });
      bar.appendChild(b);
    });
    host.appendChild(bar);
  }
  function scan(root) { (root.querySelectorAll ? root.querySelectorAll('.course-card, .hcard, .gcard, .similar-card, .related-card:not([data-season])') : []).forEach(tools); }
  var st = document.createElement('style'); st.textContent = '.hk-adm{position:absolute;top:4px;left:4px;z-index:6;display:flex;gap:3px}.hk-adm button{width:26px;height:26px;border:0;border-radius:8px;background:rgba(0,0,0,.72);color:#fff;font-size:.8rem;line-height:1;cursor:pointer;padding:0}.hk-adm button:hover{background:#e5202c}'; document.head.appendChild(st);
  function go() { scan(document); new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { if (n.matches && n.matches('.course-card,.hcard,.gcard,.similar-card')) tools(n); scan(n); } }); }); }).observe(document.body, { childList: true, subtree: true }); }
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();
