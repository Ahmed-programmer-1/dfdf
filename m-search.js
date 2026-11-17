/* ============================================================
   m-search.js — شاشة البحث الكاملة على الموبايل (بند 2 في خطة إعادة الهيكلة)
   • بيفتحها زر «بحث» في الشريط السفلي (nav.js)، والكيبورد بيفتح معاها فورًا.
   • قبل الكتابة: «آخر ما بحثت عنه» + «الأكثر بحثًا». أثناء الكتابة: نتائج فورية بكروت صغيرة (3 في الصف).
   • نفس محرك البحث الحالي (search-engine.js: تصحيح الأخطاء العربية).
   • زر الرجوع في الموبايل (والسهم) بيقفل الشاشة بدل ما يطلّع من الموقع (history state).
   • بتحترم «إيقاف التخصيص» (hakim_personalize=0): مفيش سجل بحث بيتكتب ولا بيتعرض.
   • كل نصوصها قابلة للتعديل من محرر النصوص (مجموعة «شاشة البحث الكاملة»).
   ============================================================ */
(function () {
  'use strict';
  if (window.HakimMSearch) return;

  var RECENT_KEY = 'hakim_recent_searches';
  var IMG_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="#1c1c20"/><path d="M80 120l50 30-50 30z" fill="#555"/></svg>');
  var root = null, input, body, clearBtn, micBtn, statusEl, built = false, pushed = false, lastQ = '', shown = 0, curRanked = [], dataP = null, pubIds = null;
  var timer = null;

  function tx(k, d, v) {
    var t = (window.SITE_TEXT && window.SITE_TEXT[k]) || d;
    if (v) for (var x in v) t = t.split('{' + x + '}').join(v[x]);
    return t;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function personalizeOff() { try { return localStorage.getItem('hakim_personalize') === '0'; } catch (e) { return false; } }
  function readJson(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function readRecent() { var r = readJson(RECENT_KEY, []); return Array.isArray(r) ? r : []; }
  function writeRecent(r) { try { localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, 8))); } catch (e) {} }
  function addRecent(q) { q = String(q || '').trim(); if (q.length < 2 || personalizeOff()) return; writeRecent([q].concat(readRecent().filter(function (x) { return x !== q; }))); }

  function loadScript(src) {
    if (typeof window.hakimLoadScript === 'function') { try { return Promise.resolve(window.hakimLoadScript(src)); } catch (e) {} }
    return new Promise(function (res) { var s = document.createElement('script'); s.src = src + '?v=' + Math.floor(Date.now() / 30000); s.onload = function () { res(true); }; s.onerror = function () { res(false); }; document.head.appendChild(s); });
  }
  function loadData() {
    if (dataP) return dataP;
    var jobs = [loadScript('courses-list.js'), loadScript('courses-index.js')];
    if (!window.HakimSearch) jobs.push(loadScript('search-engine.js'));
    if (!window.SITE_TEXT) jobs.push(loadScript('site-text.js'));
    dataP = Promise.all(jobs).then(function () { if (window.HakimSearch && HakimSearch.loadHints) { try { HakimSearch.loadHints(); } catch (e) {} } });
    return dataP;
  }
  function candidates(q) {
    var wantSub = /مترجم|موسم|جزء|season/i.test(q || '');
    var idx = window.COURSES_INDEX || {}, pub = {}; (window.COURSES_LIST || []).forEach(function (id) { pub[id] = 1; });
    var now = Date.now();
    return Object.keys(idx).filter(function (id) {
      var c = idx[id];
      return pub[id] && (!(c.seasonNumber > 1) || (wantSub && c.subRest)) && !(c.publishAt && Date.parse(c.publishAt) > now);
    }).map(function (id) { return { id: id, data: idx[id] }; });
  }

  var CSS = '.hk-ms{position:fixed;left:0;right:0;top:0;height:100%;z-index:1000;background:rgba(8,8,10,.62);-webkit-backdrop-filter:blur(18px) saturate(130%);backdrop-filter:blur(18px) saturate(130%);color:var(--text,#f2f2f2);display:flex;flex-direction:column;overscroll-behavior:contain;padding-top:env(safe-area-inset-top,0px)}.hk-ms[hidden]{display:none}' +
    '.hk-ms-top{display:flex;align-items:center;gap:6px;padding:8px 8px 8px 10px;border-bottom:1px solid var(--line,#26262a);flex:0 0 auto}' +
    '.hk-ms-back,.hk-ms-mic{flex:0 0 auto;width:44px;height:44px;border:0;border-radius:50%;background:none;color:var(--text,#f2f2f2);display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.hk-ms-back svg,.hk-ms-mic svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}.hk-ms-mic.rec{color:#fff;background:var(--red,#e5202c)}.hk-ms-mic[hidden]{display:none}' +
    '.hk-ms-field{position:relative;flex:1 1 auto;min-width:0}' +
    '.hk-ms-field input{width:100%;height:44px;box-sizing:border-box;border-radius:999px;border:1px solid var(--line,#26262a);background:var(--surface,#121214);color:var(--text,#f2f2f2);font:inherit;font-size:16px;padding:0 16px 0 40px;outline:none;-webkit-appearance:none;appearance:none}' +
    '.hk-ms-field input:focus{border-color:var(--red,#e5202c)}.hk-ms-field input::-webkit-search-cancel-button{display:none}' +
    '.hk-ms-clear{position:absolute;left:4px;top:50%;transform:translateY(-50%);width:36px;height:36px;border:0;border-radius:50%;background:none;color:var(--text-muted,#9a9aa2);font-size:1rem;cursor:pointer}.hk-ms-clear[hidden]{display:none}' +
    '.hk-ms-body{flex:1 1 auto;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:12px 12px calc(16px + env(safe-area-inset-bottom,0px))}' +
    '.hk-ms-status{min-height:0;font-size:.78rem;color:var(--red,#e5202c);font-weight:700;padding:0 14px}.hk-ms-status:empty{display:none}.hk-ms-status{padding-top:6px}' +
    '.hk-ms-h{display:flex;align-items:center;justify-content:space-between;margin:4px 2px 8px;font-size:.8rem;font-weight:800;color:var(--text-muted,#9a9aa2)}' +
    '.hk-ms-h button{background:none;border:0;color:var(--red,#e5202c);font:inherit;font-weight:700;padding:8px;margin:-8px;cursor:pointer}' +
    '.hk-ms-row{display:flex;align-items:center;gap:10px;min-height:44px;padding:0 6px;border-radius:10px;cursor:pointer}.hk-ms-row:active{background:var(--surface-2,#18181b)}' +
    '.hk-ms-row .t{flex:1;min-width:0;font-size:.92rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hk-ms-row .x{flex:0 0 auto;width:44px;height:44px;margin:-4px -8px -4px 0;border:0;background:none;color:var(--text-muted,#9a9aa2);cursor:pointer}' +
    '.hk-ms-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}.hk-ms-chip{min-height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--line,#26262a);background:var(--surface,#121214);color:var(--text,#f2f2f2);font:inherit;font-size:.84rem;font-weight:700;cursor:pointer}' +
    '.hk-ms-dym{font-size:.82rem;color:var(--text-muted,#9a9aa2);margin:0 2px 10px}.hk-ms-dym b{color:var(--text,#f2f2f2)}' +
    '.hk-ms-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 8px}' +
    '.hk-ms-card{display:block;min-width:0;color:inherit;text-decoration:none;-webkit-tap-highlight-color:transparent}' +
    '.hk-ms-card .im{position:relative;aspect-ratio:2/3;border-radius:10px;overflow:hidden;background:var(--surface-2,#18181b);border:1px solid var(--line,#26262a)}.hk-ms-card img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.hk-ms-card .n{margin:5px 2px 0;font-size:.74rem;font-weight:700;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.hk-ms-card .s{margin:1px 2px 0;font-size:.64rem;color:var(--text-muted,#9a9aa2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.hk-ms-more{display:block;margin:16px auto 0;min-height:44px;padding:0 26px;border-radius:999px;border:1px solid var(--line,#26262a);background:var(--surface,#121214);color:var(--text,#f2f2f2);font:inherit;font-weight:700;cursor:pointer}' +
    '.hk-ms-empty{text-align:center;padding:40px 16px}.hk-ms-empty .ic{font-size:2.2rem}.hk-ms-empty p{margin:10px 0 16px;font-size:.95rem;font-weight:700}' +
    '.hk-ms-empty a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 24px;border-radius:999px;background:var(--red,#e5202c);color:#fff;font-weight:800;text-decoration:none}' +
    '@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.hk-ms{background:rgba(8,8,10,.96)}}.hk-ms-top{background:rgba(12,12,14,.55)}.hk-ms-field input{background:rgba(24,24,28,.7)}' +
    'html.hk-ms-open,html.hk-ms-open body{overflow:hidden}@media (min-width:721px){.hk-ms{display:none!important}}';

  function build() {
    if (built) return; built = true;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.className = 'hk-ms'; root.id = 'hkMs'; root.hidden = true;
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', tx('msTitle', 'البحث'));
    root.innerHTML =
      '<div class="hk-ms-top">' +
        '<button type="button" class="hk-ms-back" aria-label="' + esc(tx('msBack', 'رجوع')) + '"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>' +
        '<div class="hk-ms-field"><input type="search" id="hkMsInput" enterkeyhint="search" inputmode="search" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="' + esc(tx('searchPlaceholder', 'ابحث عن كورس...')) + '" aria-label="' + esc(tx('searchPlaceholder', 'ابحث عن كورس...')) + '"><button type="button" class="hk-ms-clear" aria-label="' + esc(tx('msClear', 'مسح')) + '" hidden>✕</button></div>' +
        '<button type="button" class="hk-ms-mic" aria-label="' + esc(tx('voiceTitle', 'بحث صوتي')) + '" hidden><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg></button>' +
      '</div><div class="hk-ms-status" role="status" aria-live="polite"></div><div class="hk-ms-body"></div>';
    document.body.appendChild(root);
    input = root.querySelector('input'); body = root.querySelector('.hk-ms-body'); clearBtn = root.querySelector('.hk-ms-clear'); micBtn = root.querySelector('.hk-ms-mic'); statusEl = root.querySelector('.hk-ms-status');

    root.querySelector('.hk-ms-back').addEventListener('click', close);
    clearBtn.addEventListener('click', function () { input.value = ''; onInput(); input.focus(); });
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } else if (e.key === 'Escape') close(); });
    body.addEventListener('click', onBodyClick);
    body.addEventListener('scroll', function () { if (document.activeElement === input && body.scrollTop > 24) input.blur(); }, { passive: true });
    initVoice();
    var vv = window.visualViewport;   /* على الآيفون الكيبورد بيصغّر الـvisual viewport فقط → نضبط الشاشة عليه عشان ما يحصلش قفزة ولا تغطية */
    function fit() { if (!root || root.hidden) return; var h = vv ? vv.height : window.innerHeight; root.style.height = h + 'px'; root.style.top = (vv ? vv.offsetTop : 0) + 'px'; }
    if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); }
    window.addEventListener('resize', fit); root.__fit = fit;
    window.addEventListener('popstate', function () { if (root && !root.hidden) { pushed = false; hide(); } });
  }

  function initVoice() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return;
    micBtn.hidden = false; var rec = null, got = false;
    micBtn.addEventListener('click', function () {
      if (micBtn.classList.contains('rec')) { try { rec && rec.stop(); } catch (e) {} return; }
      try { rec = new SR(); } catch (e) { return; }
      rec.lang = 'ar-EG'; rec.interimResults = true; rec.maxAlternatives = 1; got = false;
      rec.onstart = function () { micBtn.classList.add('rec'); statusEl.textContent = tx('voiceListening', '🎤 أنا أستمع… تحدّث الآن'); };
      rec.onresult = function (ev) {
        var t = ''; for (var i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript;
        t = t.trim(); if (!t) return; got = true; input.value = t; onInput();
        if (ev.results[ev.results.length - 1].isFinal) submit();
      };
      rec.onerror = function (ev) {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') statusEl.textContent = tx('voiceDenied', 'تعذّر الوصول إلى الميكروفون — اسمح به من إعدادات المتصفح');
        else if (ev.error === 'no-speech') statusEl.textContent = tx('voiceNone', 'لم أسمع شيئًا — حاول مرة أخرى');
      };
      rec.onend = function () { micBtn.classList.remove('rec'); if (got) statusEl.textContent = ''; else setTimeout(function () { statusEl.textContent = ''; }, 2500); };
      try { rec.start(); } catch (e) { micBtn.classList.remove('rec'); }
    });
  }

  /* ---------- العرض ---------- */
  function mostSearched() {
    var h = readJson('hakim_search_hints', { m: {} }).m || {}, rows = [];
    Object.keys(h).forEach(function (q) { var n = 0; for (var id in h[q]) n += +h[q][id] || 0; if (n > 0 && q.length > 1) rows.push([q, n]); });
    rows.sort(function (a, b) { return b[1] - a[1]; });
    return rows.slice(0, 8).map(function (r) { return r[0]; });
  }
  function renderIdle() {
    var html = '', rec = personalizeOff() ? [] : readRecent(), top = mostSearched();
    if (rec.length) {
      html += '<div class="hk-ms-h"><span>' + esc(tx('msRecent', 'آخر ما بحثت عنه')) + '</span><button type="button" data-clear="1">' + esc(tx('msClearAll', 'مسح الكل')) + '</button></div>';
      html += rec.map(function (r) { return '<div class="hk-ms-row" data-q="' + esc(r) + '"><span aria-hidden="true">🕘</span><span class="t">' + esc(r) + '</span><button type="button" class="x" data-rm="' + esc(r) + '" aria-label="' + esc(tx('msRemove', 'حذف')) + '">✕</button></div>'; }).join('');
      html += '<div style="height:14px"></div>';
    }
    if (top.length) {
      html += '<div class="hk-ms-h"><span>' + esc(tx('msTop', 'الأكثر بحثًا')) + '</span></div><div class="hk-ms-chips">' +
        top.map(function (q) { return '<button type="button" class="hk-ms-chip" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>';
    }
    body.innerHTML = html; curRanked = []; shown = 0;
  }
  function cardHtml(h) {
    var c = h.c, sub = [c.category || '', c.videosCount ? c.videosCount + ' ' + tx('msEpShort', 'حلقة') : ''].filter(Boolean).join(' · ');
    return '<a class="hk-ms-card" href="' + hakimCourseHref(h.id) + '" data-id="' + esc(h.id) + '"><div class="im"><img referrerpolicy="no-referrer" loading="lazy" decoding="async" alt="" src="' + (c.img ? esc(window.hakimImgUrl ? window.hakimImgUrl(c.img, 160) : c.img) : IMG_FALLBACK) + '" onerror="this.onerror=null;this.src=\'' + IMG_FALLBACK.replace(/'/g, '%27') + '\'"></div><div class="n">' + esc(c.name || '') + '</div>' + (sub ? '<div class="s">' + esc(sub) + '</div>' : '') + '</a>';
  }
  function renderResults(q) {
    var cand = candidates(q), ranked = window.HakimSearch ? HakimSearch.rank(q, cand) : [];
    curRanked = ranked.map(function (r) { return { id: r.item.id, c: r.item.data, fuzzy: r.fuzzy }; });
    /* الأعمال المرتبطة (مواسم/ورشات) بتظهر كلها مع العمل — زي animezid */
    var idxAll = window.COURSES_INDEX || {}, pubSet = {}, wantSub2 = /مترجم|موسم|جزء|season/i.test(q);
    (window.COURSES_LIST || []).forEach(function (k) { pubSet[k] = 1; });
    var seenF = {}, outF = [];
    curRanked.forEach(function (h) { seenF[h.id] = 1; });
    curRanked.forEach(function (h, i) {
      outF.push(h); if (i >= 12) return;
      var sid = (idxAll[h.id] && idxAll[h.id].seriesId) || h.id;
      Object.keys(idxAll).filter(function (k) { return !seenF[k] && pubSet[k] && (idxAll[k].seriesId || k) === sid && (!idxAll[k].subRest || wantSub2) && !(idxAll[k].publishAt && Date.parse(idxAll[k].publishAt) > Date.now()); })
        .sort(function (a, b) { return ((idxAll[a].workshopOf ? 1000 : 0) + (idxAll[a].seasonNumber || 1)) - ((idxAll[b].workshopOf ? 1000 : 0) + (idxAll[b].seasonNumber || 1)); })
        .forEach(function (k) { seenF[k] = 1; outF.push({ id: k, c: idxAll[k], fuzzy: false }); });
    });
    curRanked = outF;
    if (!curRanked.length) {
      body.innerHTML = '<div class="hk-ms-empty"><div class="ic" aria-hidden="true">🔎</div><p>' + esc(tx('msEmpty', 'ما لقيناش «{q}»', { q: q })) + '</p><a href="suggestions.html">' + esc(tx('msRequest', 'اطلب الكورس')) + '</a></div>';
      shown = 0; return;
    }
    var dym = curRanked[0].fuzzy ? curRanked[0].c.name : '';
    shown = Math.min(30, curRanked.length);
    body.innerHTML = (dym ? '<div class="hk-ms-dym">' + esc(tx('msDym', 'هل تقصد:')) + ' <b>' + esc(dym) + '</b>؟</div>' : '') +
      '<div class="hk-ms-grid">' + curRanked.slice(0, shown).map(cardHtml).join('') + '</div>' +
      (curRanked.length > shown ? '<button type="button" class="hk-ms-more" data-more="1">' + esc(tx('msMore', 'عرض المزيد')) + '</button>' : '');
  }
  function onInput() {
    var q = input.value.trim(); lastQ = q; clearBtn.hidden = !input.value; statusEl.textContent = '';
    clearTimeout(timer);
    if (!q) { renderIdle(); return; }
    renderResults(q);
  }
  function submit() {
    var q = input.value.trim(); if (!q) return;
    addRecent(q); if (!personalizeOff() && window.HakimSearch) { try { HakimSearch.record(q, '', false); } catch (e) {} }
    input.blur();   /* الكيبورد يقفل والنتايج تفضل قدام المستخدم */
  }
  function onBodyClick(e) {
    var t = e.target;
    var rm = t.closest('[data-rm]'); if (rm) { e.stopPropagation(); writeRecent(readRecent().filter(function (x) { return x !== rm.getAttribute('data-rm'); })); renderIdle(); return; }
    if (t.closest('[data-clear]')) { writeRecent([]); renderIdle(); return; }
    if (t.closest('[data-more]')) {
      var add = curRanked.slice(shown, shown + 30); shown += add.length;
      body.querySelector('.hk-ms-grid').insertAdjacentHTML('beforeend', add.map(cardHtml).join(''));
      if (shown >= curRanked.length) t.closest('[data-more]').remove(); return;
    }
    var q = t.closest('[data-q]'); if (q) { input.value = q.getAttribute('data-q'); onInput(); submit(); return; }
    var a = t.closest('a.hk-ms-card');
    if (a && lastQ && lastQ.length > 1 && !personalizeOff()) {   /* تعلّم البحث: الكورس اللي اتفتح بعد البحث ده */
      addRecent(lastQ);
      if (window.HakimSearch) { try { var c = (window.COURSES_INDEX || {})[a.getAttribute('data-id')]; var nm = HakimSearch.norm((c && c.name) || ''); HakimSearch.record(lastQ, a.getAttribute('data-id'), HakimSearch.norm(lastQ) !== nm && nm.indexOf(HakimSearch.norm(lastQ)) === -1); } catch (er) {} }
    }
  }

  /* ---------- فتح / قفل ---------- */
  function open() {
    build();
    if (!root.hidden) { input.focus(); return; }
    var de = document.documentElement;
    root.hidden = false; de.classList.add('hk-ms-open'); if (window.hakimBarSync) window.hakimBarSync(); else de.classList.add('hk-nobar');
    try { history.pushState({ hkMs: 1 }, ''); pushed = true; } catch (e) { pushed = false; }
    root.__fit(); input.value = ''; clearBtn.hidden = true; statusEl.textContent = ''; lastQ = '';
    input.focus();   /* مباشرة داخل ضغطة المستخدم → الكيبورد يفتح على طول */
    body.innerHTML = ''; 
    loadData().then(function () { if (!root.hidden) { if (input.value.trim()) renderResults(input.value.trim()); else renderIdle(); } });
  }
  function hide() {
    if (!root || root.hidden) return;
    root.hidden = true; input.blur();
    var de = document.documentElement; de.classList.remove('hk-ms-open'); if (window.hakimBarSync) window.hakimBarSync(); else de.classList.remove('hk-nobar');
  }
  function close() { if (pushed) { pushed = false; hide(); try { history.back(); } catch (e) {} } else hide(); }

  window.HakimMSearch = { open: open, close: close };
})();
