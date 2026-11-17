/* ============================================================
   vitals.js — قياس قوة المنصة من أجهزة الزوار الحقيقيين (RUM)
   TTFB / FCP / LCP / INP / CLS / TBT / زمن التحميل — بيتبعت مرة واحدة لكل صفحة لجدول web_vitals في Supabase
   بدون أي بيانات شخصية (جلسة عشوائية + نوع الصفحة + نوع الجهاز + نوع الاتصال). بيتخطّى المتصفحات الآلية وlocalhost.
   ============================================================ */
(function () {
  'use strict';
  if (window.__hkVitals || !('PerformanceObserver' in window)) return;
  window.__hkVitals = 1;
  try { if (navigator.webdriver || /^(localhost|127\.|\[::1\])/.test(location.hostname)) return; } catch (e) {}
  var m = { ttfb: null, fcp: null, lcp: null, inp: null, cls: null, tbt: 0, load_ms: null }, sent = false;
  function obs(type, cb, opts) { try { var o = new PerformanceObserver(function (l) { l.getEntries().forEach(cb); }); o.observe(Object.assign({ type: type, buffered: true }, opts || {})); return o; } catch (e) { return null; } }

  var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (nav && nav.responseStart > 0) m.ttfb = Math.round(nav.responseStart);
  obs('paint', function (e) { if (e.name === 'first-contentful-paint') m.fcp = Math.round(e.startTime); });
  obs('largest-contentful-paint', function (e) { m.lcp = Math.round(e.startTime); });

  /* CLS: أسوأ "نافذة" إزاحة (فجوة 1ث، أقصى 5ث) زي ما بتقيسها جوجل */
  var win = 0, winFirst = 0, winLast = 0, clsMax = 0;
  obs('layout-shift', function (e) {
    if (e.hadRecentInput) return;
    if (win && e.startTime - winLast < 1000 && e.startTime - winFirst < 5000) { win += e.value; }
    else { win = e.value; winFirst = e.startTime; }
    winLast = e.startTime; if (win > clsMax) clsMax = win; m.cls = Math.round(clsMax * 10000) / 10000;
  });

  /* INP: أبطأ تفاعل (تقريب: أعلى مدة لكل interactionId، ونتجاهل أسوأ 1 لكل 50 تفاعل) */
  var inter = {};
  obs('event', function (e) { if (!e.interactionId) return; if (!inter[e.interactionId] || e.duration > inter[e.interactionId]) inter[e.interactionId] = e.duration; }, { durationThreshold: 40 });
  function calcInp() { var a = Object.keys(inter).map(function (k) { return inter[k]; }).sort(function (x, y) { return y - x; }); if (!a.length) return null; return Math.round(a[Math.min(a.length - 1, Math.floor(a.length / 50))]); }

  obs('longtask', function (e) { if (m.fcp != null && e.startTime >= m.fcp) m.tbt += Math.max(0, Math.round(e.duration - 50)); });

  function pageName() {
    if (window.__COURSE_ID) return 'course';
    var dp = document.body && document.body.getAttribute('data-page'); if (dp) return dp === 'home' ? 'home' : dp;
    var f = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
    if (f === 'index' || f === '') return 'home';
    return ['section', 'news', 'profile', 'contact', 'privacy', 'hub', 'offline'].indexOf(f) > -1 ? f : 'course';
  }
  function send() {
    if (sent) return; sent = true;
    if (m.fcp == null && m.lcp == null) return;
    if (typeof hakimSbConfig !== 'function') return;
    var cfg = hakimSbConfig(); if (!cfg || !cfg.url || !cfg.anonKey) return;
    var n2 = performance.getEntriesByType('navigation')[0]; if (n2 && n2.loadEventEnd > 0) m.load_ms = Math.round(n2.loadEventEnd);
    var w = innerWidth, pg = pageName();
    var row = {
      session_id: typeof hakimSessionId === 'function' ? hakimSessionId() : String(Math.random()).slice(2),
      page: pg, course_id: pg === 'course' ? (window.__COURSE_ID || decodeURIComponent((location.pathname.split('/').pop() || '').replace(/\.html$/, ''))).slice(0, 60) : null,
      device: w <= 720 ? 'mobile' : (w <= 1024 ? 'tablet' : 'desktop'),
      conn: (navigator.connection && navigator.connection.effectiveType) || null,
      ttfb: m.ttfb, fcp: m.fcp, lcp: m.lcp, inp: calcInp(), cls: m.cls, tbt: m.tbt, load_ms: m.load_ms
    };
    try { fetch(cfg.url + '/rest/v1/web_vitals', { method: 'POST', keepalive: true, headers: { 'apikey': cfg.anonKey, 'Authorization': 'Bearer ' + cfg.anonKey, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, body: JSON.stringify(row) }).catch(function () {}); } catch (e) {}
  }
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') send(); });
  addEventListener('pagehide', send);
})();
