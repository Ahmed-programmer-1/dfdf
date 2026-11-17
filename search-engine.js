/* ============================================================
   search-engine.js — بحث ذكي يفهم الأخطاء الإملائية (كورش النال ← كورس المال)
   - تطبيع عربي قوي + مقارنة تقريبية بوزن للحروف المتشابهة (س/ش، ن/م، ...)
   - بيتعلّم: كل بحث + الكورس اللي المستخدم اختاره بعده (محليًا + Supabase لو مفعّل)
   - بيحمّل "تلميحات" عامة (أكثر ما بيدوّر عليه الناس) ويقدّمها أسرع للكل
   ============================================================ */
(function () {
  var LOG_KEY = 'hakim_search_log', HINT_KEY = 'hakim_search_hints';
  var SIM = ['سشصض', 'نم', 'تثط', 'حخج', 'دذ', 'رز', 'عغ', 'قف', 'كل', 'اىي', 'هة', 'وؤ'];
  var simMap = {};
  SIM.forEach(function (g) { for (var i = 0; i < g.length; i++) { simMap[g[i]] = simMap[g[i]] || {}; for (var j = 0; j < g.length; j++) if (i !== j) simMap[g[i]][g[j]] = 1; } });
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[إأآٱا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[ؤ]/g, 'و').replace(/[ئ]/g, 'ي')
      .replace(/(.)\1{2,}/g, '$1$1').replace(/[^\u0621-\u064Aa-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function tokens(s) { return norm(s).split(' ').filter(Boolean); }
  function stripAl(t) { return t.length > 3 && t.indexOf('ال') === 0 ? t.slice(2) : t; }
  /* مسافة تحرير موزونة: حرف متشابه = 0.4، تبديل مكان حرفين = 0.7 */
  function dist(a, b, limit) {
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > limit) return limit + 1;
    var prev2 = null, prev = [], cur, i, j;
    for (j = 0; j <= lb; j++) prev[j] = j;
    for (i = 1; i <= la; i++) {
      cur = [i]; var rowMin = i;
      for (j = 1; j <= lb; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : ((simMap[a[i - 1]] && simMap[a[i - 1]][b[j - 1]]) ? 0.4 : 1);
        var v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
        if (prev2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 0.7);
        cur[j] = v; if (v < rowMin) rowMin = v;
      }
      if (rowMin > limit) return limit + 1;
      prev2 = prev; prev = cur;
    }
    return prev[lb];
  }
  function limitFor(len) { return len <= 2 ? 0 : (len === 3 ? 0.5 : (len <= 5 ? 1 : (len <= 8 ? 1.5 : 2))); }
  /* تقييم كلمة بحث مقابل كلمة في الاسم: 0..1 */
  function tokScore(q, d) {
    if (q === d) return 1;
    var qs = stripAl(q), ds = stripAl(d);
    if (qs === ds) return 0.97;
    if (ds.indexOf(qs) === 0 && qs.length >= 2) return 0.85;      /* بادئة */
    if (qs.length >= 3 && ds.indexOf(qs) > -1) return 0.7;
    var L = limitFor(Math.max(qs.length, 1)); if (!L) return 0;
    var dd = dist(qs, ds, L);
    if (dd <= L) return Math.max(0.5, 0.9 - dd / Math.max(qs.length, 1) * 0.6);
    return 0;
  }
  function readJson(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function writeJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var hints = readJson(HINT_KEY, { t: 0, m: {} });   /* m: { q_norm: { courseId: n } } */
  var docCache = {};
  function docOf(id, c) {
    var key = id || c.name, d = docCache[key];
    if (d && d.src === c) return d;
    var wv = (c.workInfo && c.workInfo.values) || c.wi || [], tpl = (window.SITE_SETTINGS || {}).workInfoTemplate || '', wi = '';
    if (tpl && wv.length) { var k = 0; wi = tpl.replace(/(^|[^A-Za-z0-9])[Xx](?![A-Za-z0-9])/g, function (m, p) { return p + (wv[k++] || ''); }); }   /* قالب معلومات عن العمل داخل البحث */
    d = { src: c, name: tokens(c.name), nameNorm: norm(c.name), extra: tokens([c.category, (c.categories || []).join(' '), c.description, (c.info && c.info.overview) || '', wi, (c.videos || []).map(function (v) { return v.title; }).join(' ')].join(' ')) };
    docCache[key] = d; return d;
  }
  /* مطابقة كلمة بحث واحدة مع اسم/بيانات كورس */
  function matchTok(q, d) {
    var best = 0, inName = false, ex = false;
    for (var j = 0; j < d.name.length; j++) { var s = tokScore(q, d.name[j]); if (s > best) { best = s; inName = true; ex = s >= 0.85; } }
    if (best < 0.85) for (var k = 0; k < d.extra.length; k++) { var e = d.extra[k] === q || stripAl(d.extra[k]) === stripAl(q) || (q.length >= 3 && stripAl(d.extra[k]).indexOf(stripAl(q)) === 0); if (e) { best = Math.max(best, 0.55); inName = false; ex = true; break; } }
    return { best: best, inName: inName, ex: ex };
  }
  /* score: 0 = مش مطابق. بيرجّع { score, fuzzy } */
  function score(rawQ, id, c) {
    var qt = tokens(rawQ); if (!qt.length) return { score: 1, fuzzy: false };
    var d = docOf(id, c), total = 0, fuzzy = false;
    for (var i = 0; i < qt.length; i++) {
      var r = matchTok(qt[i], d);
      if (r.best < 0.5) return { score: 0, fuzzy: false };
      if (!r.ex) fuzzy = true;
      total += r.best * (r.inName ? 1.6 : 1);
    }
    var sc = total / qt.length;
    var nq = norm(rawQ);
    if (d.nameNorm === nq) sc += 1.2; else if (d.nameNorm.indexOf(nq) === 0) sc += 0.6; else if (d.nameNorm.indexOf(nq) > -1) sc += 0.3;
    var h = hints.m[nq] && id ? hints.m[nq][id] : 0; if (h) sc += Math.min(1.5, 0.4 * Math.log(1 + h));  /* اللي الناس بتختاره بعد نفس البحث */
    var mine = readJson(LOG_KEY, []); for (var m = 0; m < mine.length; m++) if (mine[m].id === id && mine[m].qn === nq) { sc += 0.5; break; }
    return { score: sc, fuzzy: fuzzy };
  }
  /* بيرتّب عناصر [{id,data}] حسب التطابق */
  function rank(rawQ, items) {
    var out = [];
    items.forEach(function (it) { var r = score(rawQ, it.id, it.data); if (r.score > 0) out.push({ item: it, score: r.score, fuzzy: r.fuzzy }); });
    out.sort(function (a, b) { return b.score - a.score; });
    return out;
  }
  /* "هل تقصد": أقرب اسم كورس لو البحث فيه غلط */
  function didYouMean(rawQ, items) {
    var r = rank(rawQ, items); if (!r.length || !r[0].fuzzy) return '';
    return r[0].item.data.name || '';
  }
  /* تسجيل بحث + الكورس اللي اتختار (أو بدون كورس) */
  function record(rawQ, courseId, corrected) {
    var q = String(rawQ || '').trim(); if (q.length < 2) return;
    var qn = norm(q), log = readJson(LOG_KEY, []);
    log.unshift({ q: q.slice(0, 80), qn: qn, id: courseId || '', ts: Date.now() });
    writeJson(LOG_KEY, log.slice(0, 60));
    try {
      if (typeof hakimSbReady === 'function' && hakimSbReady() && typeof hakimSbInsert === 'function') {
        hakimSbInsert('search_events', { session_id: hakimSessionId(), q: q.slice(0, 80), q_norm: qn.slice(0, 80), course_id: courseId ? String(courseId).slice(0, 80) : null, corrected: !!corrected });
      }
    } catch (e) {}
  }
  /* تلميحات الناس كلها (RPC اختياري — لو مش موجود بيتجاهل) */
  function loadHints() {
    if (Date.now() - (hints.t || 0) < 6 * 3600 * 1000) return;
    try {
      if (typeof hakimSbReady !== 'function' || !hakimSbReady() || typeof hakimSbRpc !== 'function') return;
      hakimSbRpc('get_search_hints', { p_limit: 400 }).then(function (rows) {
        if (!Array.isArray(rows)) return; var m = {};
        rows.forEach(function (r) { if (r && r.q_norm && r.course_id) { (m[r.q_norm] = m[r.q_norm] || {})[r.course_id] = r.n; } });
        hints = { t: Date.now(), m: m }; writeJson(HINT_KEY, hints);
      }).catch(function () {});
    } catch (e) {}
  }
  window.HakimSearch = { norm: norm, tokens: tokens, score: score, rank: rank, didYouMean: didYouMean, record: record, loadHints: loadHints, dist: dist };
})();
