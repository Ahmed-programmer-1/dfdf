/* ============================================================
   ads.js — تشغيل الإعلانات (بانر علوي/سفلي + نافذة منبثقة + إعادة توجيه + أكواد الشبكات) وتتبّعها
   الإدارة كلها من admin.html ← 📢 الإعلانات (ads-config.js). بيشتغل فقط داخل صفحة الكورس (بعد الدخول على كرت الكورس). كل صفحات الواجهة
   (الرئيسية/الأقسام/الإشعارات/الاستطلاعات/المواعيد/الاقتراحات/قوائمي/الحساب/الأخبار/التواصل/الخصوصية) (الرئيسية/الأقسام/الحساب/الأخبار/التواصل/الخصوصية) ممنوع فيها الإعلان تمامًا
   حتى لو اتحمّل الملف بالغلط (قفل مزدوج هنا).
   ============================================================ */
(function () {
  'use strict';
  if (window.HakimAds) return;
  var LOCKED = { home: 1, section: 1, profile: 1, news: 1, contact: 1, privacy: 1, offline: 1, maintenance: 1, admin: 1, notifications: 1, polls: 1, schedule: 1, suggestions: 1, mylists: 1 }; /* الإعلانات بس داخل صفحة الكورس وما بعدها */
  function pageType() {
    if (window.__COURSE_ID) return 'course';
    var f = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/i, '').toLowerCase();
    if (f === 'index' || f === '') return 'home';
    var known = ['section', 'profile', 'news', 'contact', 'privacy', 'offline', 'maintenance', 'admin', 'notifications', 'polls', 'schedule', 'suggestions', 'mylists'];
    return known.indexOf(f) > -1 ? f : 'course';
  }
  var PT = pageType();
  if (LOCKED[PT]) return;
  var CFG = null, courseId = PT === 'course' ? (window.__COURSE_ID || decodeURIComponent((location.pathname.split('/').pop() || '').replace(/\.html$/i, ''))) : '';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function sj(k, d) { try { var v = JSON.parse(sessionStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function ss(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function device() { return innerWidth <= 720 ? 'mobile' : (innerWidth <= 1024 ? 'tablet' : 'desktop'); }
  /* 🔍 حماية السيو: جوجل بيعاقب النوافذ المزعجة عند الدخول من نتائج البحث. زائر جاي من محرك بحث ما بتظهرلوش
     (منبثق/إعادة توجيه/سكربت عام) في أول مشاهدة له — البانرات عادية. بتتقفل من الأدمن (seoSafe=false). */
  var SEARCH_REF = /(^|\.)(google|bing|yahoo|duckduckgo|yandex|baidu|ecosia|startpage|search\.brave)\./i;
  function fromSearchFirstView() {
    try {
      var n = (parseInt(sessionStorage.getItem('hakim_ad_pv'), 10) || 0) + 1; sessionStorage.setItem('hakim_ad_pv', String(n));
      if (n === 1) { var h = ''; try { h = new URL(document.referrer).hostname; } catch (e) {} sessionStorage.setItem('hakim_ad_search', SEARCH_REF.test(h) ? '1' : '0'); }
      return sessionStorage.getItem('hakim_ad_search') === '1' && n < 2;
    } catch (e) { return false; }
  }
  var SEO_QUIET = fromSearchFirstView();
  function allowed(fmt) {
    if (SEO_QUIET && (CFG && CFG.seoSafe !== false) && (fmt === 'popup' || fmt === 'redirect' || fmt === 'pageScript')) return false;
    return !!(CFG && CFG.enabled && CFG.rules && CFG.rules[PT] && CFG.rules[PT][fmt]);
  }
  function liveNow(a) {
    if (a.enabled === false) return false; var t = Date.now();
    if (a.start && t < Date.parse(a.start)) return false; if (a.end && t > Date.parse(a.end) + 86399000) return false;
    if (a.onlyCourses && a.onlyCourses.length && PT === 'course' && a.onlyCourses.indexOf(courseId) === -1) return false;
    if (a.devices && a.devices.length && a.devices.indexOf(device()) === -1) return false;
    return true;
  }
  function pickWeighted(list) { var tot = list.reduce(function (n, a) { return n + (+a.weight || 1); }, 0), r = Math.random() * tot; for (var i = 0; i < list.length; i++) { r -= (+list[i].weight || 1); if (r <= 0) return list[i]; } return list[0]; }

  /* ---------- تتبّع ---------- */
  function track(event, ad, placement, kind) {
    try {
      if (typeof hakimSbInsert !== 'function') return;
      hakimSbInsert('ad_events', { session_id: typeof hakimSessionId === 'function' ? hakimSessionId() : 'x', ad_id: String(ad.id || '').slice(0, 40), ad_name: String(ad.name || '').slice(0, 80), kind: kind || 'my', event: event, page_type: PT, course_id: courseId || null, placement: placement, device: device() });
    } catch (e) {}
  }

  /* ---------- حقن كود إعلاني (السكربتات بتتنفّذ فعلًا) ---------- */
  function injectHtml(el, html) {
    var t = document.createElement('template'); t.innerHTML = html;
    Array.prototype.slice.call(t.content.childNodes).forEach(function (n) {
      if (n.nodeName === 'SCRIPT') { var s = document.createElement('script'); Array.prototype.slice.call(n.attributes).forEach(function (a) { s.setAttribute(a.name, a.value); }); s.text = n.textContent; el.appendChild(s); }
      else el.appendChild(document.importNode(n, true));
    });
  }
  function css() {
    if (document.getElementById('hkAdCss')) return;
    var st = document.createElement('style'); st.id = 'hkAdCss';
    st.textContent = '.hk-ad{position:relative;margin:14px 0;border-radius:16px;padding:2px;background:linear-gradient(120deg,var(--red,#e5202c),#ff8a3d,#7c5cff,var(--red,#e5202c));background-size:300% 300%;animation:hk-adglow 6s linear infinite}' +
      '.hk-ad-in{background:var(--surface,#121214);border-radius:14px;overflow:hidden;display:block;min-height:50px}.hk-ad-in img{display:block;width:100%;height:auto;max-height:260px;object-fit:cover}' +
      '.hk-ad-tag{position:absolute;top:8px;inset-inline-start:10px;z-index:2;font-size:.62rem;font-weight:800;padding:2px 8px;border-radius:99px;background:rgba(0,0,0,.6);color:#fff;letter-spacing:.3px}' +
      '@keyframes hk-adglow{0%{background-position:0 50%}100%{background-position:300% 50%}}' +
      '.hk-ad-modal{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.72);display:grid;place-items:center;padding:16px}.hk-ad-modal .hk-ad{margin:0;width:min(560px,100%)}' +
      '.hk-ad-x{position:absolute;top:-14px;inset-inline-end:-6px;z-index:3;min-width:38px;height:38px;border-radius:99px;border:0;background:#fff;color:#111;font-weight:800;cursor:pointer;padding:0 12px}.hk-ad-x[disabled]{opacity:.7;cursor:default}' +
      '@media (prefers-reduced-motion:reduce){.hk-ad{animation:none}}';
    document.head.appendChild(st);
  }

  /* ---------- بانر ---------- */
  function imgFor(ad) { var m = innerWidth <= 760; return (m ? (ad.imgMobile || ad.imgDesktop) : (ad.imgDesktop || ad.imgMobile)) || ''; }
  function buildBanner(ad, placement) {
    var box = document.createElement('div'); box.className = 'hk-ad'; box.setAttribute('data-ad', ad.id);
    var inner = '<span class="hk-ad-tag">إعلان</span>';
    var img = imgFor(ad);
    if (!img) return null;
    inner += '<a class="hk-ad-in" href="' + esc(ad.link || '#') + '" target="_blank" rel="noopener sponsored"><img alt="' + esc(ad.name || 'إعلان') + '" loading="lazy" src="' + esc(img) + '"></a>';
    box.innerHTML = inner;
    var im = box.querySelector('img'); box.__ad = ad;
    if (CFG && CFG.attract && CFG.attract.enabled) attractify(box, ad);
    window.addEventListener('resize', function () { var n = imgFor(ad); if (n && im.getAttribute('src') !== n) im.setAttribute('src', n); });
    box.querySelector('a').addEventListener('click', function () { track('click', ad, placement); });
    watchImpression(box, ad, placement);
    return box;
  }
  function watchImpression(el, ad, placement, kind) {
    if (!('IntersectionObserver' in window)) { track('impression', ad, placement, kind); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting && es[0].intersectionRatio >= 0.5) { io.disconnect(); track('impression', ad, placement, kind); } }, { threshold: [0.5] });
    io.observe(el);
  }
  function buildNetwork(n, placement) {
    var box = document.createElement('div'); box.className = 'hk-ad'; box.setAttribute('data-ad', n.id);
    box.innerHTML = '<span class="hk-ad-tag">إعلان</span><div class="hk-ad-in" style="padding:6px;text-align:center"></div>';
    injectHtml(box.querySelector('.hk-ad-in'), n.code || '');
    watchImpression(box, n, placement, 'network');
    return box;
  }
  function fillSlot(slot, placement) {
    var fmt = placement === 'top' ? 'bannerTop' : 'bannerBottom';
    if (!allowed(fmt)) return;
    var mine = (CFG.myAds || []).filter(function (a) { return a.type !== 'redirect' && (a.placements || []).indexOf(placement) > -1 && liveNow(a) && imgFor(a); });
    var nets = (CFG.networks || []).filter(function (n) { return n.code && (n.placements || []).indexOf(placement) > -1 && liveNow(n); });
    var pool = mine.map(function (a) { return { t: 'my', a: a }; }).concat(nets.map(function (n) { return { t: 'net', a: n }; }));
    if (!pool.length) return;
    var pick = pool[Math.floor(Math.random() * pool.length)];
    if (mine.length && nets.length === 0) pick = { t: 'my', a: pickWeighted(mine) };
    var el = pick.t === 'my' ? buildBanner(pick.a, placement) : buildNetwork(pick.a, placement);
    if (el) slot.appendChild(el);
  }
  function mountBanners() {
    var main = document.querySelector('main') || document.body; if (!main) return;
    if (allowed('bannerTop')) {
      var top = document.createElement('div'); top.id = 'hkAdTop';
      var back = main.querySelector('.back-link'); if (back && back.parentNode === main) back.insertAdjacentElement('afterend', top); else main.insertBefore(top, main.firstChild);
      fillSlot(top, 'top');
    }
    if (allowed('bannerBottom')) { var bot = document.createElement('div'); bot.id = 'hkAdBottom'; main.appendChild(bot); fillSlot(bot, 'bottom'); }
  }

  /* ---------- أكواد الشبكات العامة (pageScript) ---------- */
  function mountPageScripts() {
    if (!allowed('pageScript')) return;
    (CFG.networks || []).filter(function (n) { return n.code && (n.placements || []).indexOf('page') > -1 && liveNow(n); }).forEach(function (n) {
      var h = document.createElement('div'); h.style.display = 'contents'; h.setAttribute('data-ad', n.id); document.body.appendChild(h); injectHtml(h, n.code); track('impression', n, 'page', 'network');
    });
  }


  /* ---------- 🧲 جذب البانر: تقنيات سلوكية ضد «عمى البانر» (كلها صادقة — مفيش ندرة مزيّفة ولا أرقام مختلقة) ----------
     1) زر دعوة واضح (CTA) فوق الصورة: الإعلان اللي شكله «قابل للضغط» بيتضغط أكتر.
     2) حركة مرة واحدة عند الدخول في الشاشة (الحركة بتشدّ العين) + لمعة خفيفة متباعدة بدل وميض مستمر بيتجاهله المخ.
     3) عدّاد حقيقي لو الإعلان له تاريخ انتهاء (ندرة حقيقية).
     4) تنويع الصياغة بين الظهور والتاني (التكرار بيخلّي المخ يتجاهل).  */
  var ATTRACT_CTA = ['شاهد العرض ←', '👀 اكتشف التفاصيل', '🎁 عرض يستحق نظرة', 'اعرف أكتر ←'];
  function attractCss() {
    if (document.getElementById('hkAttractCss')) return;
    var st = document.createElement('style'); st.id = 'hkAttractCss';
    st.textContent = '.hk-ad.hk-att{animation:none;transform:translateY(10px) scale(.985);opacity:0;transition:transform .55s cubic-bezier(.2,.9,.25,1.2),opacity .5s}.hk-ad.hk-att.in{transform:none;opacity:1}' +
      '.hk-ad.hk-att .hk-ad-in{position:relative}.hk-att-cta{position:absolute;inset-inline-end:10px;bottom:10px;z-index:3;padding:7px 14px;border-radius:99px;background:var(--red,#e5202c);color:#fff;font-weight:800;font-size:.8rem;box-shadow:0 6px 18px rgba(0,0,0,.45);pointer-events:none}' +
      '.hk-att-timer{position:absolute;inset-inline-start:10px;bottom:10px;z-index:3;padding:4px 10px;border-radius:99px;background:rgba(0,0,0,.65);color:#fff;font-size:.7rem;font-weight:800;pointer-events:none}' +
      '.hk-att-shine::after{content:"";position:absolute;top:0;bottom:0;width:40%;left:-60%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent);animation:hk-shine 7s ease-in-out infinite;pointer-events:none}' +
      '@keyframes hk-shine{0%,70%{left:-60%}100%{left:130%}}@media (prefers-reduced-motion:reduce){.hk-att-shine::after{animation:none}.hk-ad.hk-att{transition:none}}';
    document.head.appendChild(st);
  }
  function attractCount(ad) { var k = 'hakim_ad_att', m = rj(k, {}); m[ad.id] = (m[ad.id] || 0) + 1; try { localStorage.setItem(k, JSON.stringify(m)); } catch (e) {} return m[ad.id]; }
  function attractify(box, ad) {
    attractCss(); box.classList.add('hk-att');
    var inn = box.querySelector('.hk-ad-in'); if (!inn) return;
    var n = attractCount(ad), phrases = ((CFG.attract && CFG.attract.cta) || []).filter(Boolean); if (!phrases.length) phrases = ATTRACT_CTA;
    var cta = document.createElement('span'); cta.className = 'hk-att-cta'; cta.textContent = phrases[(n - 1) % phrases.length]; inn.appendChild(cta);
    if (ad.end) { var left = Date.parse(ad.end) + 86399000 - Date.now(); if (left > 0 && left < 14 * 86400000) { var d = Math.ceil(left / 86400000), t = document.createElement('span'); t.className = 'hk-att-timer'; t.textContent = d <= 1 ? '⏳ آخر يوم' : '⏳ متبقي ' + d + ' أيام'; inn.appendChild(t); } }
    if (!(CFG.attract && CFG.attract.shine === false)) inn.classList.add('hk-att-shine');
    if (!('IntersectionObserver' in window)) { box.classList.add('in'); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); setTimeout(function () { box.classList.add('in'); }, 120); } }, { threshold: [0.25] });
    io.observe(box);
  }

  /* ---------- 🔗 سمارت لينك: رابط بيتفتح عند الضغط على أماكن محددة داخل صفحة الكورس فقط ---------- */
  var SL_SEL = { episode: '.ep-tile', season: '.related-card[data-season]', play: '.play-cta, .hp-center-play', navep: '#prevEpBtn, #nextEpBtn', similar: '.similar-card', download: '.dl-btn, .download-btn',
    /* 🎬 مشغّل المنصة نفسه (الأزرار الداخلية للمشغّل المدمج) */
    player: '.hp-center-play, [data-role="playPause"]', playerseek: '[data-role="back"], [data-role="forward"]', playerfull: '[data-role="fullscreen"]' };
  function mountSmartLinks() {
    if (PT !== 'course' || !allowed('smartLink')) return;
    var links = (CFG.smartLinks || []).filter(function (l) { return l && l.url && l.enabled !== false && (l.triggers || []).length && liveNow(l); });
    if (!links.length) return;
    document.addEventListener('click', function (e) {
      if (!e.isTrusted || e.target.closest('.hk-ad,[data-noad],.hk-ad-modal')) return;
      var hit = null, hits = [];
      for (var k in SL_SEL) { if (e.target.closest(SL_SEL[k])) { hits.push(k); if (!hit) hit = k; } }
      if (!hit) return;
      var st = sj('hakim_sl', { n: 0, last: 0, by: {} }), now = Date.now();
      /* الوضع الدائم (الافتراضي): كل ضغطة على أي زر فيه سمارت لينك تفتح الإعلان + الزر بيشتغل بنفس الضغطة. الوضع المحدود (always=false) بيستخدم حد الجلسة والفاصل */
      function isAlways(l) { return l.always !== undefined ? l.always !== false : (CFG.smartMode !== 'limited'); }
      var pool = links.filter(function (l) { return l.triggers.some(function (tk) { return hits.indexOf(tk) > -1; }) && (isAlways(l) || ((+(st.by[l.id] || 0) < (+l.perSession || 3)) && (now - (+st.by['t' + l.id] || 0) > (+l.gapSec >= 0 ? +l.gapSec : 45) * 1000))); });
      if (!pool.length) return;
      var l = pickWeighted(pool);
      if (!openAd(l.url)) return;
      if (!isAlways(l)) { st.by[l.id] = (+st.by[l.id] || 0) + 1; st.by['t' + l.id] = now; ss('hakim_sl', st); }
      track('redirect', { id: 'sl-' + l.id, name: l.name || l.url }, 'smart:' + hit);
    }, true);
  }
  /* ---------- 📜 ملفات JS إعلانية مرفوعة (شبكات): بتتحمّل داخل صفحة الكورس فقط ---------- */
  function mountScriptFiles() {
    if (PT !== 'course' || !allowed('pageScript')) return;
    (CFG.scripts || []).filter(function (f) { return f && f.file && f.enabled !== false && /^[A-Za-z0-9_.\-]+\.js$/.test(f.file); }).forEach(function (f) {
      var sc = document.createElement('script'); sc.src = f.file + '?v=' + (f.v || 1); sc.async = true; sc.setAttribute('data-ad', f.id || f.file); document.body.appendChild(sc);
      track('impression', { id: f.id || f.file, name: f.name || f.file }, 'page', 'network');
    });
  }

  /* ---------- نافذة منبثقة ---------- */
  function mountPopup() {
    if (!allowed('popup')) return;
    var every = ((CFG.popup && CFG.popup.everyMin) || 15) * 60000, last = +localStorage.getItem('hakim_ad_popup') || 0;
    if (Date.now() - last < every) return;
    var mine = (CFG.myAds || []).filter(function (a) { return a.type !== 'redirect' && (a.placements || []).indexOf('popup') > -1 && liveNow(a) && imgFor(a); });
    var nets = (CFG.networks || []).filter(function (n) { return n.code && (n.placements || []).indexOf('popup') > -1 && liveNow(n); });
    if (!mine.length && !nets.length) return;
    setTimeout(function () {
      var useMine = mine.length && (!nets.length || Math.random() < .5), ad = useMine ? pickWeighted(mine) : nets[Math.floor(Math.random() * nets.length)];
      var el = useMine ? buildBanner(ad, 'popup') : buildNetwork(ad, 'popup'); if (!el) return;
      var m = document.createElement('div'); m.className = 'hk-ad-modal'; m.appendChild(el);
      var x = document.createElement('button'); x.type = 'button'; x.className = 'hk-ad-x'; x.disabled = true; var n = 3; x.textContent = 'إغلاق بعد ' + n;
      el.appendChild(x); var iv = setInterval(function () { n--; if (n <= 0) { clearInterval(iv); x.disabled = false; x.textContent = '✕ إغلاق'; } else x.textContent = 'إغلاق بعد ' + n; }, 1000);
      x.addEventListener('click', function () { if (!x.disabled) m.remove(); });
      document.body.appendChild(m); try { localStorage.setItem('hakim_ad_popup', String(Date.now())); } catch (e) {}
    }, Math.max(2, (CFG.popup && CFG.popup.delaySec) || 10) * 1000);
  }

  /* ---------- إعادة التوجيه: أي ضغطة ← إعلان في تبويب جديد، وبعده خطوتين مجانيتين ---------- */
  /* فتح إعلاناتنا: عادي (تبويب)، أو «نافذة تصفحية مملوءة» (نافذة صغيرة بالربع العلوي من الشاشة وبتتقفل لوحدها)،
     أو «في الخلفية» (التركيز بيرجع للموقع فورًا والنافذة بتتقفل تلقائيًا). بتتفعّل لكورس معيّن من الأدمن. على الموبايل المتصفح بيفتحها كتبويب وبنقفلها تلقائيًا. */
  function openAd(url) {
    var mode = window.__hakimAdMode || {}, sec = ((CFG && CFG.framed && +CFG.framed.seconds) || 8) * 1000, op = window.hakimTrustedOpen || window.open;
    try {
      var w;
      if (mode.framed && innerWidth > 900) {
        var sw = screen.availWidth || innerWidth, sh = screen.availHeight || innerHeight;
        w = op.call(window, url, 'hakimAd', 'popup=yes,noopener=no,left=0,top=0,width=' + sw + ',height=' + Math.round(sh / 4) + ',menubar=no,toolbar=no,location=no,status=no');
      } else w = op.call(window, url, '_blank', (mode.framed || mode.bg) ? '' : 'noopener');
      if (w && (mode.framed || mode.bg)) { try { w.blur(); window.focus(); } catch (e) {} setTimeout(function () { try { w.close(); } catch (e) {} try { window.focus(); } catch (e) {} }, sec); }
      return !!w || !(mode.framed || mode.bg);
    } catch (e) { return false; }
  }
  function redirectPool() { return ((CFG.redirect && CFG.redirect.urls) || []).concat((CFG.myAds || []).filter(function (a) { return a.type === 'redirect' && a.link; }).map(function (a) { return { id: a.id, name: a.name, url: a.link, weight: a.weight, enabled: a.enabled, start: a.start, end: a.end, onlyCourses: a.onlyCourses, devices: a.devices }; })).filter(function (u) { return u && u.url && liveNow(u); }); }
  function mountRedirect() {
    if (!allowed('redirect')) return;
    document.addEventListener('click', function (e) {
      if (!e.isTrusted || e.target.closest('.hk-ad,[data-noad],.hk-ad-modal')) return;
      var st = sj('hakim_ad_st', { free: 0, last: 0 }), now = Date.now();
      if (st.free > 0) { st.free--; ss('hakim_ad_st', st); return; }
      var gap = ((CFG.redirect && CFG.redirect.minGapSec != null) ? +CFG.redirect.minGapSec : 60) * 1000;
      if (now - st.last < gap) return;
      var pool = redirectPool(); if (!pool.length) return;
      var ad = pickWeighted(pool); if (!openAd(ad.url)) return;
      st.free = (CFG.redirect && CFG.redirect.freeSteps != null) ? +CFG.redirect.freeSteps : 2; st.last = now; ss('hakim_ad_st', st);
      track('redirect', { id: ad.id || 'rd', name: ad.name || ad.url }, 'click');
    }, true);
  }
  /* زر تشغيل حلقة معيّنة له رابط إعادة توجيه خاص (مرة واحدة لكل حلقة في الجلسة) */
  function episodeClick(url, index) {
    if (blockedHere()) return;
    if (!url || !allowed('redirect') || LOCKED[PT]) return;
    if (navigator.userActivation && !navigator.userActivation.isActive) return; /* لازم ضغطة حقيقية (مش تشغيل تلقائي) */
    var done = sj('hakim_ad_ep', {}), k = courseId + ':' + index; if (done[k]) return;
    if (openAd(url)) { done[k] = 1; ss('hakim_ad_ep', done); track('redirect', { id: 'ep-' + k, name: url.slice(0, 60) }, 'episode'); }
  }

  /* ---------- 🚫 أقسام ممنوع فيها الإعلانات (من الأدمن ← الإعلانات): أي عمل ينتمي لقسم محظور = ولا إعلان ---------- */
  function blockedHere() {
    try {
      var bs = (CFG && CFG.blockedSections) || []; if (!bs.length) return false;
      var d = (window.__HAKIM_COURSES || {})[courseId] || null;
      if (!d) { var el = document.getElementById('course-data'); if (el) d = JSON.parse(el.textContent); }
      if (!d && window.COURSES_INDEX) d = window.COURSES_INDEX[courseId];
      if (!d) return false;
      var secs = [d.menuSection].concat(d.extraSections || [], (d.categories || []).map(function (c) { return 'cat:' + c; }));
      return secs.some(function (s) { return s && bs.indexOf(s) > -1; });
    } catch (e) { return false; }
  }
  /* ---------- 🎈 بانر عائم (فوق الموقع) — زي زر التيليجرام: مش مدمج ولا بيزق التصميم. زر ✕ بيقفله بس (من غير أي إعلان) ---------- */
  function mountFloat() {
    if (!allowed('bannerFloat')) return;
    if (CFG.floatOn && CFG.floatOn !== 'both') { var isEp = !!window.__STATIC_EP || /\/ep\d+\.html$/.test(location.pathname); if ((CFG.floatOn === 'episode') !== isEp) return; }
    if (sj('hakim_float_x', 0)) return;
    var mine = (CFG.myAds || []).filter(function (a) { return a.type !== 'redirect' && (a.placements || []).indexOf('float') > -1 && liveNow(a) && imgFor(a); });
    if (!mine.length) return;
    var ad = pickWeighted(mine), img = imgFor(ad); if (!img) return;
    var st = document.createElement('style'); st.textContent = '#hkAdFloat{position:fixed;top:calc(env(safe-area-inset-top,0px) + 8px);left:50%;transform:translateX(-50%);width:min(728px,calc(100% - 20px));z-index:120;border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.45);background:#111}#hkAdFloat img{display:block;width:100%;height:auto;max-height:110px;object-fit:cover}#hkAdFloat .fx{position:absolute;top:4px;inset-inline-end:4px;width:28px;height:28px;border-radius:99px;border:0;background:rgba(0,0,0,.7);color:#fff;font-size:15px;line-height:1;cursor:pointer;z-index:2}#hkAdFloat .ft{position:absolute;top:4px;inset-inline-start:6px;font-size:.6rem;font-weight:800;padding:1px 7px;border-radius:99px;background:rgba(0,0,0,.65);color:#fff;z-index:2}';
    document.head.appendChild(st);
    var box = document.createElement('div'); box.id = 'hkAdFloat'; box.setAttribute('data-ad', ad.id);
    box.innerHTML = '<span class="ft">إعلان</span><button type="button" class="fx" aria-label="إغلاق">✕</button><a href="' + esc(ad.link || '#') + '" target="_blank" rel="noopener sponsored"><img alt="' + esc(ad.name || 'إعلان') + '" src="' + esc(img) + '"></a>';
    box.querySelector('.fx').addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); ss('hakim_float_x', 1); box.remove(); });
    box.querySelector('a').addEventListener('click', function () { track('click', ad, 'float'); });
    document.body.appendChild(box); watchImpression(box, ad, 'float');
  }
  function start() {
    /* لو فيه أقسام محظورة بنستنى بيانات العمل (ثواني قليلة) عشان نعرف قسمه قبل ما نعرض أي إعلان */
    var needWait = PT === 'course' && CFG && (CFG.blockedSections || []).length && !((window.__HAKIM_COURSES || {})[courseId]);
    if (needWait) { var tries = 0, iv = setInterval(function () { if ((window.__HAKIM_COURSES || {})[courseId] || ++tries > 40) { clearInterval(iv); go(); } }, 100); return; }
    go();
  }
  function go() {
    if (blockedHere()) return;
    css(); mountBanners(); mountFloat(); mountPageScripts(); mountScriptFiles(); mountPopup(); mountRedirect(); mountSmartLinks();
  }
  window.HakimAds = { episodeClick: function (u, i) { if (CFG) episodeClick(u, i); else window.__hkAdQ = (window.__hkAdQ || []).concat([[u, i]]); }, pageType: PT };
  function boot() {
    var load = typeof hakimLoadScript === 'function' ? hakimLoadScript('ads-config.js') : new Promise(function (res) { var s = document.createElement('script'); s.src = 'ads-config.js?v=' + Math.floor(Date.now() / 30000); s.onload = res; s.onerror = res; document.head.appendChild(s); });
    Promise.resolve(load).then(function () {
      CFG = window.ADS_CONFIG || null; if (!CFG || !CFG.enabled) return;
      var ctl = rj('hakim_ctl', null); if (ctl && ctl.ads_off) return; /* الأدمن قفل كل الإعلانات لهذا الحساب */
      start(); (window.__hkAdQ || []).forEach(function (q) { episodeClick(q[0], q[1]); }); window.__hkAdQ = [];
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
