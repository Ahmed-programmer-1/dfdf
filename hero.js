/* ============================================================
   hero.js — بانر مقدمة القسم (متحرك تلقائيًا) — نفس شكل بانر الرئيسية، ومشترك لصفحات الأقسام
   HakimHero.mount(hostEl, [{id, data}]) — بيعرض الكورسات المرسلة (أعلى 15 مشاهدة في القسم)
   ============================================================ */
(function () {
  'use strict';
  if (window.HakimHero) return;
  var CSS = '.hero{position:relative;margin-top:16px;border-radius:18px;overflow:hidden;min-height:300px;background:var(--surface,#121214)}' +
    '.hero[hidden]{display:none}.hero-slide{position:absolute;inset:0;display:flex;align-items:center;gap:28px;padding:26px 34px;opacity:0;visibility:hidden;transition:opacity .6s ease,visibility .6s}' +
    '.hero-slide.active{opacity:1;visibility:visible}.hero-bg{position:absolute;top:-30px;left:-30px;width:calc(100% + 60px);height:calc(100% + 60px);object-fit:cover;filter:blur(22px) brightness(.5);z-index:0}' +
    '.hero-slide::before{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(0,0,0,.2),rgba(0,0,0,.65))}' +
    '.hero-poster,.hero-info{position:relative;z-index:2}.hero-poster{flex:0 0 auto;width:150px;aspect-ratio:2/3;border-radius:14px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,.5)}.hero-poster img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.hero-info{flex:1;min-width:0;max-width:620px;color:#fff}.hero-badges{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap}.hero-badges span{font-size:.72rem;font-weight:800;padding:3px 11px;border-radius:999px;background:rgba(255,255,255,.18)}.hero-badges .b-cat{background:var(--red,#e5202c)}' +
    '.hero-info h2{margin:0 0 8px;font-weight:800;font-size:clamp(1.3rem,3vw,2rem);line-height:1.3}.hero-meta{margin:0 0 8px;font-size:.82rem;opacity:.85}.hero-desc{margin:0 0 16px;font-size:.9rem;line-height:1.8;opacity:.9;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}' +
    '.hero-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 26px;border-radius:999px;font-weight:800;background:var(--red,#e5202c);color:#fff;text-decoration:none}' +
    '.hero-nav{position:absolute;top:50%;transform:translateY(-50%);z-index:4;width:40px;height:40px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:1.4rem;cursor:pointer}.hero-nav.prev{inset-inline-start:12px}.hero-nav.next{inset-inline-end:12px}' +
    '.hero-dots{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);z-index:4;display:flex;gap:6px;max-width:80%;flex-wrap:wrap;justify-content:center}.hero-dots button{width:8px;height:8px;border-radius:999px;border:0;background:rgba(255,255,255,.45);cursor:pointer;padding:0}.hero-dots button.on{width:26px;background:#fff}' +
    '@media (max-width:720px){.hero{min-height:250px}.hero-slide{padding:18px 16px 34px;align-items:flex-end}.hero-poster,.hero-nav{display:none}.hero-desc{-webkit-line-clamp:2;font-size:.82rem;margin-bottom:12px}.hero-btn{padding:9px 22px;font-size:.86rem}}';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function mount(host, items) {
    if (!host) return;
    if (!document.getElementById('hkHeroCss')) { var st = document.createElement('style'); st.id = 'hkHeroCss'; st.textContent = CSS; document.head.appendChild(st); }
    if (!items || !items.length) { host.hidden = true; return; }
    var PH = (typeof HAKIM_PLACEHOLDER_IMG !== 'undefined' && HAKIM_PLACEHOLDER_IMG) || '';
    host.className = 'hero'; host.hidden = false;
    host.innerHTML = items.map(function (it, i) {
      var c = it.data || {}, img = c.img ? esc(window.hakimImgUrl ? window.hakimImgUrl(c.img, 720) : c.img) : PH, st = c.info && c.info.status, stTxt = st === 'ongoing' ? 'مستمر' : (st === 'complete' ? 'مكتمل' : '');
      var n = (c.videos && c.videos.length) || c.videosCount || 0;
      return '<div class="hero-slide' + (i === 0 ? ' active' : '') + '"><img class="hero-bg" referrerpolicy="no-referrer" src="' + img + '" alt="">' +
        '<a class="hero-poster" href="' + hakimCourseHref(it.id) + '"><img referrerpolicy="no-referrer" src="' + img + '" alt="' + esc(c.name) + '"></a>' +
        '<div class="hero-info"><div class="hero-badges">' + (c.category ? '<span class="b-cat">' + esc(c.category) + '</span>' : '') + (stTxt ? '<span>' + stTxt + '</span>' : '') + '</div>' +
        '<h2>' + esc(c.name) + '</h2><p class="hero-meta">' + (n ? n + ' حلقة' : '') + '</p>' + (c.description ? '<p class="hero-desc">' + esc(c.description) + '</p>' : '') +
        '<a class="hero-btn" href="' + hakimCourseHref(it.id) + '">▶ شاهد الآن</a></div></div>';
    }).join('') + (items.length > 1 ? '<button type="button" class="hero-nav prev" aria-label="السابق">‹</button><button type="button" class="hero-nav next" aria-label="التالي">›</button><div class="hero-dots">' + items.map(function (_, i) { return '<button type="button" data-i="' + i + '"' + (i === 0 ? ' class="on"' : '') + ' aria-label="' + (i + 1) + '"></button>'; }).join('') + '</div>' : '');
    var cnt = items.length, idx = 0, timer = null;
    function show(n) { idx = (n + cnt) % cnt; host.querySelectorAll('.hero-slide').forEach(function (el, i) { el.classList.toggle('active', i === idx); }); host.querySelectorAll('.hero-dots button').forEach(function (el, i) { el.classList.toggle('on', i === idx); }); }
    function play() { clearInterval(timer); if (cnt > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(function () { if (!document.hidden) show(idx + 1); }, 4800); }
    host.addEventListener('click', function (ev) { var b = ev.target.closest('.hero-nav, .hero-dots button'); if (!b) return; if (b.classList.contains('next')) show(idx - 1); else if (b.classList.contains('prev')) show(idx + 1); else show(parseInt(b.dataset.i, 10)); play(); });
    host.addEventListener('pointerenter', function () { clearInterval(timer); }); host.addEventListener('pointerleave', play);
    var sx = null; host.addEventListener('pointerdown', function (e) { sx = e.clientX; }); host.addEventListener('pointerup', function (e) { if (sx == null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50 && cnt > 1) { show(idx + (dx < 0 ? 1 : -1)); play(); } });
    play();
  }
  window.HakimHero = { mount: mount };
})();
