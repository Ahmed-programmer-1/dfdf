/* ============================================================
   reco-engine.js — محرك التوصية الصامت
   المستخدم مبيختارش تفضيلات. المحرك بيتعلّم لوحده من سلوكه على الجهاز:
     • الحلقات اللي شافها  • المفضلة / المتابعة / القوائم  • تقييمه للكورسات  • تقدّمه في المشاهدة
   وبيرتّب أي قائمة كورسات بنسبة ثابتة:
     70% خوارزمية (الأقرب لذوقه)  —  20% متنوّع (حاجة جديدة عليه)  —  10% مضاد تمامًا (عكس ذوقه)
   والترتيب مبعثر (مش بالتاريخ) ويفضل ثابت طول الجلسة عشان ما يتلخبطش وهو بيتصفّح.
   مفيش حاجة بتروح لأي سيرفر: كله على جهاز الزائر.
   ============================================================ */
(function () {
  'use strict';
  if (window.HakimReco) return;

  var SEED_KEY = 'hakim_feed_seed';
  var RATIO = { A: 7, D: 2, O: 1 }; /* في كل 10 خانات: 7 خوارزمية، 2 متنوع، 1 مضاد */

  function norm(s) {
    return String(s == null ? '' : s).trim().toLowerCase()
      .replace(/[\u064B-\u0652\u0640]/g, '').replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ');
  }
  function readJson(k, def) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } }

  /* ---------- بذرة عشوائية ثابتة في الجلسة ---------- */
  function getSeed() {
    try {
      var s = sessionStorage.getItem(SEED_KEY);
      if (!s) { s = String(Math.floor(Math.random() * 2147483647)); sessionStorage.setItem(SEED_KEY, s); }
      return parseInt(s, 10) || 1;
    } catch (e) { return Math.floor(Math.random() * 2147483647) || 1; }
  }
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(arr, rnd) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }

  /* ---------- الإشارات: قد إيه بيحب كل كورس؟ ---------- */
  function signals() {
    var aff = {}, any = false;
    try { if (localStorage.getItem('hakim_personalize') === '0') return { aff: aff, any: false, terms: {} }; } catch (e) {}  /* المستخدم أوقف التخصيص */
    function add(id, v) { if (!id || !v) return; aff[id] = (aff[id] || 0) + v; any = true; }
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i); if (!k) continue;
        if (k.indexOf('hakim_watched_') === 0) { var w = readJson(k, []); add(k.slice(14), Math.min((w && w.length) || 0, 20)); }
        else if (k.indexOf('hakim_course_rating_') === 0) { var r = parseInt(localStorage.getItem(k), 10) || 0; if (r > 0) add(k.slice(20), (r - 3) * 2.5); }
      }
    } catch (e) {}
    var l = readJson('hakim_mylists', {});
    (l.favorites || []).forEach(function (id) { add(id, 5); });
    (l.following || []).forEach(function (id) { add(id, 4); });
    (l.playlists || []).forEach(function (p) { (p.courses || []).forEach(function (id) { add(id, 2); }); });
    /* بيانات بحث المستخدم: الكورسات اللي فتحها بعد بحث + كلمات بحثه الأخيرة */
    var terms = {}, sl = readJson('hakim_search_log', []);
    if (Array.isArray(sl)) sl.slice(0, 30).forEach(function (x, i) {
      if (!x) return; if (x.id) add(x.id, 3);
      String(x.qn || '').split(' ').forEach(function (t) { if (t.length >= 3) { terms[t] = (terms[t] || 0) + Math.max(0.2, 1 - i / 30); any = true; } });
    });
    var h = readJson('hakim_watch_history', []);
    if (Array.isArray(h)) h.forEach(function (x) { if (x && x.pct >= 0.5) add(x.id, 1.5); });
    return { aff: aff, any: any, terms: terms };
  }

  /* ---------- خصائص الكورس اللي بنقارن بيها ---------- */
  function featuresOf(d) {
    var f = [];
    [d.category].concat(d.categories || []).filter(Boolean).forEach(function (c, i) { f.push(['cat:' + norm(c), i === 0 ? 1 : 0.6]); });
    var info = d.info || {};
    if (info.country) f.push(['country:' + norm(info.country), 0.4]);
    if (info.studio) f.push(['studio:' + norm(info.studio), 0.3]);
    if (info.language) f.push(['lang:' + norm(info.language), 0.2]);
    return f;
  }

  function buildProfile(courses, sig) {
    var fw = {}, max = 0;
    courses.forEach(function (c) {
      var a = sig.aff[c.id]; if (!a) return;
      featuresOf(c.data).forEach(function (p) { fw[p[0]] = (fw[p[0]] || 0) + a * p[1]; });
    });
    Object.keys(fw).forEach(function (k) { max = Math.max(max, Math.abs(fw[k])); });
    if (max > 0) Object.keys(fw).forEach(function (k) { fw[k] = fw[k] / max; });
    return fw;
  }

  function scoreOne(c, fw, sig) {
    var s = 0;
    featuresOf(c.data).forEach(function (p) { s += (fw[p[0]] || 0) * p[1]; });
    /* كلمات بحثه الأخيرة بتشدّ الكورسات اللي اسمها/فئتها فيها كلمة منها */
    if (sig.terms) { var nm = ' ' + String((c.data.name || '') + ' ' + (c.data.category || '')).toLowerCase().replace(/[\u064B-\u0652]/g, '').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي') + ' ', tb = 0; Object.keys(sig.terms).forEach(function (t) { if (nm.indexOf(t) > -1) tb += 0.12 * sig.terms[t]; }); s += Math.min(0.45, tb); }
    /* لو خلّص الكورس تقريبًا، مش أولوية */
    var watched = readJson('hakim_watched_' + c.id, []), eps = (c.data.videos || []).length;
    if (eps && watched && watched.length / eps >= 0.85) s -= 0.4;
    /* لمسة صغيرة للجديد */
    var fp = Date.parse(c.data.firstPublishedAt), age = fp ? (Date.now() - fp) / 86400000 : 999;
    if (age < 30) s += 0.05 * (1 - age / 30);
    return s;
  }

  /* ---------- الملاءمة للمستخدم: السن + الجنس + "موجه لمن؟" + الحد الأدنى للعمر ----------
     مش بتمنع أي كورس — بتضعّفه بس. الكورس اللي الحد الأدنى لعمره أكبر من سن المستخدم بينزل لآخر القائمة. */
  var BLOCK_AT = -1.2;
  function viewer() {
    var d = readJson('hakim_demo', null), age = null, g = '';
    if (d && d.by) { var a = new Date().getFullYear() - d.by; if (a >= 3 && a <= 110) age = a; }
    if (d && (d.g === 'male' || d.g === 'female')) g = d.g;
    return { age: age, g: g };
  }
  function ageGroup(a) { return a < 13 ? 'kids' : a < 18 ? 'teens' : a < 30 ? 'youth' : 'adults'; }
  function demoScore(d, u) {
    var sc = 0, info = (d && d.info) || {}, aud = (d && (d.aud || d.audience)) || {};
    var m = parseInt(info.minAge, 10) || 0;
    if (m) {
      if (u.age !== null) { if (u.age < m) sc -= 1.2 + (m - u.age) * 0.5; }
      else if (m >= 16) sc -= 0.35;   /* زائر مجهول السن: تخفيف بسيط للكورسات الكبيرة */
    }
    if (u.age !== null) { var k = ageGroup(u.age); if (aud[k] !== undefined && aud[k] !== '') sc += (aud[k] / 100 - 0.5) * 2.4; }
    if (u.g && aud[u.g] !== undefined && aud[u.g] !== '') sc += (aud[u.g] / 100 - 0.5) * 1.4;
    return sc;
  }

  /* ---------- الخلط 70/20/10 ---------- */
  function mix(items, scoreOf, rnd, ratioOut) {
    var n = items.length;
    if (n <= 1) return items.slice();
    var scored = items.map(function (it) { return { it: it, s: scoreOf(it) }; });
    var desc = scored.slice().sort(function (a, b) { return b.s - a.s; });
    var range = (desc[0].s - desc[n - 1].s) || 1;
    /* طابور الخوارزمية: الأعلى أولًا مع عشوائية خفيفة عشان مايبقاش ثابت ومكرر */
    var A = desc.map(function (x) { return { it: x.it, k: x.s + (rnd() - 0.5) * range * 0.15 }; }).sort(function (a, b) { return b.k - a.k; });
    var rank = new Map(); desc.forEach(function (x, i) { rank.set(x.it, i); });
    /* المضاد: أقل النص التحتاني درجة */
    var O = desc.filter(function (x) { return rank.get(x.it) >= Math.ceil(n * 0.5); }).reverse();
    /* المتنوّع: عشوائي من خارج أعلى 30% */
    var D = shuffle(desc.filter(function (x) { return rank.get(x.it) >= Math.ceil(n * 0.3); }).slice(), rnd);
    var used = new Set(), out = [];
    function take(q) { while (q.length) { var x = q.shift(); if (!used.has(x.it)) { used.add(x.it); return x.it; } } return null; }
    var ORDER = { A: [A, D, O], D: [D, A, O], O: [O, D, A] };
    for (var base = 0; base < n; base += 10) {
      var pat = [];
      for (var i = 0; i < RATIO.A; i++) pat.push('A');
      for (i = 0; i < RATIO.D; i++) pat.push('D');
      for (i = 0; i < RATIO.O; i++) pat.push('O');
      shuffle(pat, rnd);
      if (base === 0 && pat[0] !== 'A') { var ai = pat.indexOf('A'); pat[ai] = pat[0]; pat[0] = 'A'; } /* أول خانة دايمًا من الخوارزمية */
      for (var j = 0; j < pat.length && out.length < n; j++) {
        var qs = ORDER[pat[j]], got = null;
        for (var k = 0; k < qs.length && !got; k++) got = take(qs[k]);
        if (got) { out.push(got); if (ratioOut) ratioOut.push(pat[j]); }
      }
    }
    return out;
  }

  /* ---------- الواجهة ---------- */
  function order(courses) {
    if (!courses || courses.length < 2) return courses || [];
    var sig = signals(), fw = buildProfile(courses, sig), rnd = mulberry32(getSeed()), u = viewer();
    var dm = new Map(), main = [], tail = [];
    courses.forEach(function (c) { var v = demoScore(c.data, u); dm.set(c, v); (v <= BLOCK_AT ? tail : main).push(c); });
    tail.sort(function (a, b) { return dm.get(b) - dm.get(a); });   /* الأقل تعارضًا الأول، وغير المناسب جدًا في الآخر خالص */
    if (main.length < 2) return main.concat(tail);
    return mix(main, function (c) { return (sig.any ? scoreOne(c, fw, sig) : 0) + dm.get(c); }, rnd).concat(tail);
  }
  /* "الموصي به لك": التوصية أهم عامل (60%) + الأكثر مشاهدة (25%) + الحصري (15%) — والكورسات غير المناسبة لعمره بتتستبعد من القمة */
  function topFor(items, ctx, n) {
    ctx = ctx || {}; var views = ctx.views || {};
    var sig = signals(), fw = buildProfile(items, sig), u = viewer(), rnd = mulberry32(getSeed() + 7);
    var rows = items.map(function (c) { return { c: c, dm: demoScore(c.data, u), p: (sig.any ? scoreOne(c, fw, sig) : 0), v: Math.log(1 + (+views[c.id] || 0)), e: c.data && c.data.exclusive ? 1 : 0 }; });
    var ok = rows.filter(function (r) { return r.dm > BLOCK_AT; });
    if (ok.length) rows = ok;
    var pAll = rows.map(function (r) { return r.p + r.dm; }), pMin = Math.min.apply(null, pAll), pMax = Math.max.apply(null, pAll), vMax = Math.max.apply(null, rows.map(function (r) { return r.v; })) || 1;
    rows.forEach(function (r, i) { var pn = pMax > pMin ? (pAll[i] - pMin) / (pMax - pMin) : 0.5; r.score = 0.60 * pn + 0.25 * (r.v / vMax) + 0.15 * r.e + (rnd() - 0.5) * 0.04; });
    rows.sort(function (a, b) { return b.score - a.score; });
    return rows.slice(0, n || 8).map(function (r) { return r.c; });
  }
  function explain(course, all) {
    var sig = signals(), fw = buildProfile(all || [course], sig), reasons = [];
    featuresOf(course.data).forEach(function (p) { var v = (fw[p[0]] || 0) * p[1]; if (Math.abs(v) > 0.05) reasons.push({ feature: p[0], weight: Math.round(v * 100) / 100 }); });
    reasons.sort(function (a, b) { return Math.abs(b.weight) - Math.abs(a.weight); });
    return { score: sig.any ? Math.round(scoreOne(course, fw, sig) * 100) / 100 : 0, reasons: reasons, hasSignal: sig.any };
  }
  window.HakimReco = {
    RATIO: RATIO,
    order: order,
    topFor: topFor,
    demoScore: function (d) { return demoScore(d, viewer()); },
    explain: explain,
    hasSignal: function () { return signals().any; },
    reshuffle: function () { try { sessionStorage.removeItem(SEED_KEY); } catch (e) {} },
    _mix: mix, _mulberry32: mulberry32
  };
})();
