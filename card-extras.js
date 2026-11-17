/* ============================================================
   card-extras.js — زخرفة كروت الكورسات في كل الصفحات (بدون تعديل كل نسخ دالة الكارت):
   • اسم الكورس بالعربي - English في أعلى يسار الكارت (أبيض واضح)
   • علامة «مترجم / مدبلج / مترجم ومدبلج»
   • تقييم الكورس ★ وعدد المقيّمين (من Supabase مرة واحدة)
   بيراقب أي كارت يتضاف للصفحة (MutationObserver) ويزوّقه تلقائيًا.
   ============================================================ */
(function () {
  'use strict';
  if (window.__hakimCardX) return; window.__hakimCardX = true;
  var DUB = { sub: ['مترجم', 'sub'], dub: ['مدبلج', 'dub'], both: ['مترجم ومدبلج', 'both'] };
  var ratings = null, ratingsP = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function idOf(a) { try { var h = a.getAttribute('href') || ''; if (!/\.html(\?|$)/.test(h) || /^(https?:|\/\/)/.test(h)) return null; return decodeURIComponent(h.split('?')[0].replace(/\.html$/, '')); } catch (e) { return null; } }
  function loadIndex() {
    if (window.COURSES_INDEX) return Promise.resolve();
    if (typeof hakimLoadScript === 'function') return hakimLoadScript('courses-index.js').catch(function () {});
    return new Promise(function (res) { var s = document.createElement('script'); s.src = 'courses-index.js?v=' + Math.floor(Date.now() / 30000); s.onload = res; s.onerror = res; document.head.appendChild(s); });
  }
  function loadRatings() {
    if (ratingsP) return ratingsP;
    ratingsP = new Promise(function (res) {
      try { if (typeof hakimSbReady !== 'function' || !hakimSbReady() || typeof hakimSbRpc !== 'function') return res({}); } catch (e) { return res({}); }
      var cached = null; try { cached = JSON.parse(sessionStorage.getItem('hakim_ratings_bulk') || 'null'); } catch (e) {}
      if (cached && Date.now() - cached.t < 120000) { return res(cached.m); }
      Promise.resolve(hakimSbRpc('get_course_ratings_bulk', {})).then(function (rows) {
        var m = {}; (rows || []).forEach(function (r) { m[r.course_id] = { a: +r.avg_rating, n: +r.ratings_count }; });
        try { sessionStorage.setItem('hakim_ratings_bulk', JSON.stringify({ t: Date.now(), m: m })); } catch (e) {}
        res(m);
      }).catch(function () { res({}); });
    });
    return ratingsP;
  }
  function decorate(card) {
    if (card.__hkx) return; var id = idOf(card); if (!id) return; card.__hkx = 1;
    var c = window.COURSES_INDEX && window.COURSES_INDEX[id]; if (!c) { card.__hkx = 0; return; }
    var media = card.querySelector('.card-media'), body = card.querySelector('.card-body');
    if (media && c.nameEn && !media.querySelector('.hk-names')) {
      var n = document.createElement('span'); n.className = 'hk-names'; n.textContent = (c.name || '') + ' - ' + c.nameEn; media.appendChild(n); media.classList.add('hk-has-names');
    }
    if (body && !body.querySelector('.hk-meta')) {
      var row = document.createElement('div'); row.className = 'hk-meta'; var html = '';
      if (c.dub && DUB[c.dub]) html += '<span class="hk-dub ' + DUB[c.dub][1] + '">' + DUB[c.dub][0] + '</span>';
      html += '<span class="hk-rate" data-id="' + esc(id) + '" hidden></span>';
      row.innerHTML = html; body.insertBefore(row, body.querySelector('.card-share') || null);
      paintRating(row.querySelector('.hk-rate'));
    }
  }
  function paintRating(el) {
    loadRatings().then(function (m) { var r = m[el.dataset.id]; if (r && r.n > 0) { el.innerHTML = '<b>★</b> ' + r.a.toFixed(1) + ' <small>(' + r.n + ')</small>'; el.hidden = false; } });
  }
  function scan(root) { (root.querySelectorAll ? root.querySelectorAll('a.course-card') : []).forEach(decorate); if (root.matches && root.matches('a.course-card')) decorate(root); }
  function start() {
    loadIndex().then(function () {
      scan(document);
      new MutationObserver(function (list) { list.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) scan(n); }); }); }).observe(document.body, { childList: true, subtree: true });
    });
  }
  window.HakimCardX = { rating: function (id) { return loadRatings().then(function (m) { return m[id] || null; }); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
