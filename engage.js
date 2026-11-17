/* ============================================================
   engage.js — طبقة الاستبقاء والتحفيز (علم النفس السلوكي) المشتركة بين الصفحات
   كل شيء محلي على جهاز الزائر، وكل الأرقام حقيقية (مفيش أرقام مفبركة ولا ضغط كاذب):
   • سلسلة أيام المشاهدة (عادة + تجنّب الخسارة + أفضل رقم شخصي)   • تتبّع أسبوعي بنقاط (اقتراب من الهدف)
   • اختيار اليوم (فضول + سبب للرجوع كل يوم)                     • دعوة صديق (تبادل + هوية اجتماعية) بعد ما يستثمر الزائر وقته
   • اقتراح تثبيت التطبيق في وقت مناسب (بعد زيارتين ومشاهدة) مرة كل 7 أيام
   لو الزائر أوقف التخصيص (hakim_personalize=0) كل ده بيتوقف. كل النصوص قابلة للتعديل من محرر النصوص.
   ============================================================ */
(function () {
  'use strict';
  if (window.HakimEngage) return;
  var TX = function (k, d, v) { return typeof hakimTx === 'function' ? hakimTx(k, d, v) : String(d).replace(/\{(\w+)\}/g, function (m, x) { return v && v[x] != null ? v[x] : m; }); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function wj(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function off() { try { return localStorage.getItem('hakim_personalize') === '0'; } catch (e) { return false; } }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function addDays(s, n) { var p = s.split('-'); return ymd(new Date(+p[0], +p[1] - 1, +p[2] + n)); }
  var KEY = 'hakim_streak';

  function state() { var s = rj(KEY, null) || {}; if (!Array.isArray(s.days)) s.days = []; s.best = +s.best || 0; return s; }
  function compute(s) {
    var set = {}, today = ymd(), n = 0, cur;
    s.days.forEach(function (d) { set[d] = 1; });
    var done = !!set[today]; cur = done ? today : addDays(today, -1);
    while (set[cur]) { n++; cur = addDays(cur, -1); }
    return { n: n, done: done, atRisk: !done && n > 0, best: Math.max(s.best, n), set: set, today: today, total: s.days.length };
  }
  /* بيتنادى لما الزائر يبدأ يشاهد حلقة فعلًا */
  function touch() {
    if (off()) return null;
    var s = state(), t = ymd();
    if (s.days.indexOf(t) === -1) { s.days.push(t); s.days = s.days.slice(-60); }
    var c = compute(s); s.best = Math.max(s.best, c.n); wj(KEY, s); return c;
  }
  function info() { return compute(state()); }
  function visit() {
    try { if (sessionStorage.getItem('hakim_visit_counted')) return; sessionStorage.setItem('hakim_visit_counted', '1'); } catch (e) { return; }
    try { localStorage.setItem('hakim_visits', String((parseInt(localStorage.getItem('hakim_visits'), 10) || 0) + 1)); } catch (e) {}
  }
  function visits() { try { return parseInt(localStorage.getItem('hakim_visits'), 10) || 0; } catch (e) { return 0; } }

  function siteName() { return (window.SITE_SETTINGS && window.SITE_SETTINGS.siteName) || 'منصة حكيم التعليمية'; }
  function share(text, url, done) {
    var data = { title: siteName(), text: text, url: url };
    if (navigator.share) { navigator.share(data).then(function () { done && done(true); }).catch(function () {}); return; }
    var full = text + ' ' + url;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(full).then(function () { if (typeof hakimToast === 'function') hakimToast(TX('engCopied', 'اتنسخ الرابط — ابعته لصديقك 📋'), 'success'); done && done(true); }).catch(function () {});
  }
  function homeUrl() { try { return new URL('index.html', location.href).href; } catch (e) { return location.href; } }

  /* اختيار اليوم: ثابت طول اليوم (فضول + سبب للرجوع بكرة يلاقي غيره) */
  function dailyPick(ids) {
    if (!ids || !ids.length) return '';
    var s = ymd(), h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ids[(h >>> 0) % ids.length];
  }
  function lastWatchHref() {
    var lw = rj('hakim_last_watch', null);
    return lw && lw.id ? hakimCourseHref(lw.id, (lw.index || 0) + 1) : '';
  }

  /* ---------- بانر السلسلة + الأسبوع ---------- */
  function weekDots(c) {
    var out = '', i, d, label;
    for (i = 6; i >= 0; i--) {
      d = addDays(c.today, -i);
      var p = d.split('-'); label = new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('ar', { weekday: 'narrow' });
      var cls = c.set[d] ? 'on' : (i === 0 ? 'today' : '');
      out += '<span class="hk-dot ' + cls + '" title="' + d + '"><i>' + (c.set[d] ? '✓' : '') + '</i><small>' + esc(label) + '</small></span>';
    }
    return out;
  }
  function streakCopy(c) {
    var MS = { 3: 1, 7: 1, 14: 1, 30: 1, 60: 1 };
    if (c.done && MS[c.n]) return { t: TX('engMilestone', '🎉 {n} أيام متتالية!', { n: c.n }), s: TX('engMilestoneSub', 'إنجاز حقيقي — شاركه مع صديق يمكن يلحقك'), share: true };
    if (c.done) return { t: TX('engDone', '🔥 {n} يوم متتالي', { n: c.n }), s: TX('engDoneSub', 'أحسنت! كل يوم بيقرّبك من عادة تعلّم ثابتة') };
    if (c.atRisk) return { t: TX('engRisk', 'سلسلتك {n} يوم 🔥', { n: c.n }), s: TX('engRiskSub', 'حلقة واحدة اليوم تحافظ عليها'), cta: true };
    if (c.total > 0 && c.best >= 3) return { t: TX('engBack', 'رجعت! 👋', {}), s: TX('engBackSub', 'أفضل سلسلة ليك كانت {n} يوم — ابدأ واحدة جديدة النهارده', { n: c.best }), cta: true };
    return { t: TX('engStart', 'ابدأ سلسلتك اليوم 🚀'), s: TX('engStartSub', 'حلقة واحدة بس تكفي — والباقي بيبقى أسهل'), cta: true };
  }
  function renderStreak(hostId, opts) {
    var host = document.getElementById(hostId); if (!host) return;
    if (off()) { host.innerHTML = ''; host.style.minHeight = '0'; return; }
    opts = opts || {};
    var c = info(), cp = streakCopy(c), resume = lastWatchHref(), pick = dailyPick(opts.ids);
    var btns = '';
    if (cp.share) btns += '<button type="button" class="hk-btn" data-act="share-streak">' + esc(TX('engShareBtn', 'شارك إنجازك')) + '</button>';
    else if (cp.cta) btns += resume ? '<a class="hk-btn" href="' + resume + '">' + esc(TX('engResume', 'كمّل من حيث وقفت')) + '</a>' : '<a class="hk-btn" href="#discoverySection">' + esc(TX('engPickFirst', 'اختر كورسك')) + '</a>';
    if (pick) btns += '<a class="hk-btn ghost" href="' + hakimCourseHref(pick) + '">' + esc(TX('engDaily', '🎁 اختيار اليوم')) + '</a>';
    host.style.minHeight = '';
    host.innerHTML = '<section class="hk-streak" aria-label="' + esc(TX('engAria', 'تقدّمك')) + '">' +
      '<div class="hk-streak-top"><div class="hk-streak-txt"><b>' + esc(cp.t) + '</b><span>' + esc(cp.s) + '</span></div></div>' +
      '<div class="hk-week">' + weekDots(c) + '</div>' + (btns ? '<div class="hk-streak-act">' + btns + '</div>' : '') + '</section>' + inviteHtml(c);
    host.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var a = b.getAttribute('data-act');
      if (a === 'share-streak') share(TX('engShareStreak', 'وصلت {n} أيام متتالية أتعلّم على {site} 🔥 جرّب معايا', { n: c.n, site: siteName() }), homeUrl());
      else if (a === 'invite') share(TX('engInviteText', 'بتعلّم على {site} وحبيت أرشحها ليك ✨', { site: siteName() }), homeUrl(), function () { try { localStorage.setItem('hakim_inv_ts', String(Date.now())); } catch (er) {} });
      else if (a === 'invite-x') { try { localStorage.setItem('hakim_inv_ts', String(Date.now())); } catch (er) {} var card = host.querySelector('.hk-invite'); if (card) card.remove(); }
    };
  }
  /* دعوة صديق: بتظهر بس بعد ما الزائر يستثمر وقته (يومين مشاهدة)، ومرة كل 14 يوم */
  function inviteHtml(c) {
    if (c.total < 2) return '';
    var ts = 0; try { ts = parseInt(localStorage.getItem('hakim_inv_ts'), 10) || 0; } catch (e) {}
    if (ts && Date.now() - ts < 14 * 86400000) return '';
    return '<section class="hk-invite"><div><b>' + esc(TX('engInviteTitle', 'عجبك المحتوى؟ ✨')) + '</b><span>' + esc(TX('engInviteSub', 'التعلّم مع صديق أمتع وأسهل في الاستمرار — ادعُ واحد يشاركك.')) + '</span></div>' +
      '<div class="hk-invite-act"><button type="button" class="hk-btn" data-act="invite">' + esc(TX('engInviteBtn', 'ادعُ صديقًا')) + '</button><button type="button" class="hk-x" data-act="invite-x" aria-label="' + esc(TX('engClose', 'إغلاق')) + '">✕</button></div></section>';
  }

  /* ---------- اقتراح تثبيت التطبيق: بعد زيارتين ومشاهدة، مرة كل 7 أيام ---------- */
  function maybeInstallNudge() {
    if (off() || typeof hakimInstallApp !== 'function') return;
    try { if (typeof hakimIsStandalone === 'function' && hakimIsStandalone()) return; } catch (e) {}
    if (visits() < 2 || info().total < 1) return;
    var ts = 0; try { ts = parseInt(localStorage.getItem('hakim_inst_nudge'), 10) || 0; } catch (e) {}
    if (ts && Date.now() - ts < 7 * 86400000) return;
    setTimeout(function () {
      if (document.getElementById('hkSnack')) return;
      var el = document.createElement('div'); el.id = 'hkSnack'; el.className = 'hk-snack'; el.setAttribute('role', 'status');
      el.innerHTML = '<span>' + esc(TX('engInstallMsg', '📲 ثبّت التطبيق: فتح أسرع وكمّل مشاهدتك بضغطة')) + '</span><button type="button" class="hk-btn" data-i="go">' + esc(TX('engInstallBtn', 'تثبيت')) + '</button><button type="button" class="hk-x" data-i="no" aria-label="' + esc(TX('engClose', 'إغلاق')) + '">✕</button>';
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-i]'); if (!b) return;
        if (b.getAttribute('data-i') === 'go') { try { hakimInstallApp(); } catch (er) {} }
        el.remove();
      });
      document.body.appendChild(el);
      try { localStorage.setItem('hakim_inst_nudge', String(Date.now())); } catch (e) {}
      setTimeout(function () { if (el.parentNode) el.remove(); }, 14000);
    }, 7000);
  }

  window.HakimEngage = { touch: touch, info: info, visit: visit, renderStreak: renderStreak, maybeInstallNudge: maybeInstallNudge, dailyPick: dailyPick, share: share };
})();
