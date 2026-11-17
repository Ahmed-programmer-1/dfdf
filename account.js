/* ============================================================
   account.js — نظام الحسابات الأولي (تسجيل / دخول / ملف شخصي)
   بيتحمّل تلقائيًا من nav.js في كل صفحات الزوار (حتى صفحات الكورسات القديمة المولَّدة).
   بيشتغل فوق Supabase Auth (إيميل + اسم مستخدم + كلمة سر). لو Supabase مش مربوط في
   إعدادات الموقع: مفيش زر حساب ظاهر، والقوائم بتفضل شغّالة محليًا زي ما هي.
   الإيميل احتياطي فقط لاسترجاع الحساب. تسجيل الدخول بالإيميل + كلمة السر.
   ============================================================ */
(function () {
  'use strict';
  if (window.HakimAccount) return;

  var KEY = 'hakim_auth';
  var A = { session: null, profile: null, ready: false, cbs: [] };

  function cfg() { var s = window.SITE_SETTINGS || {}; return { url: (s.supabaseUrl || '').replace(/\/+$/, ''), key: s.supabaseAnonKey || '' }; }
  function enabled() { var c = cfg(); return !!(c.url && c.key); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function emit() { A.cbs.forEach(function (f) { try { f(A); } catch (e) {} }); renderHeaderBtn(); }

  /* ---------------- الجلسة ---------------- */
  function loadSession() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  /* بيانات الجنس والسن (للتوصيات فقط — بتتحفظ محليًا كمان عشان المحرك يقراها بدون سيرفر) */
  function cacheDemo(p) {
    try {
      if (p && (p.gender || p.birth_year)) localStorage.setItem('hakim_demo', JSON.stringify({ g: p.gender || '', by: p.birth_year || 0 }));
      else localStorage.removeItem('hakim_demo');
    } catch (e) {}
  }
  function saveSession(s) {
    if (s && s.access_token) {
      s.expires_at = s.expires_at || (Math.floor(Date.now() / 1000) + (s.expires_in || 3600));
      A.session = s; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    } else { A.session = null; A.profile = null; try { localStorage.removeItem(KEY); localStorage.removeItem('hakim_demo'); } catch (e) {} }
  }
  function authErr(j, status) {
    var m = String((j && (j.msg || j.message || j.error_description || j.error)) || '').toLowerCase();
    if (m.indexOf('invalid login') > -1) return 'الإيميل أو كلمة السر غير صحيحة';
    if (m.indexOf('already') > -1 || m.indexOf('registered') > -1) return 'الإيميل ده مسجّل بالفعل — جرّب تسجيل الدخول';
    if (m.indexOf('password') > -1 && (m.indexOf('short') > -1 || m.indexOf('least') > -1 || m.indexOf('weak') > -1)) return 'كلمة السر ضعيفة — اختر 6 خانات على الأقل';
    if (m.indexOf('email') > -1 && m.indexOf('confirm') > -1) return 'لازم تأكّد الإيميل الأول (شوف بريدك)';
    if (m.indexOf('rate') > -1 || status === 429) return 'محاولات كتير — استنى شوية وجرّب تاني';
    if (m.indexOf('valid email') > -1 || m.indexOf('invalid') > -1) return 'تأكد من كتابة الإيميل صح';
    return 'حصلت مشكلة (' + (status || '؟') + ') — جرّب تاني';
  }
  async function authCall(path, body) {
    var c = cfg();
    var res = await fetch(c.url + '/auth/v1/' + path, { method: 'POST', headers: { apikey: c.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    var j = null; try { j = await res.json(); } catch (e) {}
    return { ok: res.ok, status: res.status, json: j };
  }
  async function ensureFresh() {
    if (!A.session) return false;
    if (A.session.expires_at - 60 > Date.now() / 1000) return true;
    var r = await authCall('token?grant_type=refresh_token', { refresh_token: A.session.refresh_token });
    if (r.ok && r.json && r.json.access_token) { saveSession(r.json); return true; }
    saveSession(null); return false;
  }
  async function authed(path, opts) {
    if (!(await ensureFresh())) throw new Error('انتهت الجلسة — سجّل دخولك تاني');
    var c = cfg(); opts = opts || {};
    var h = Object.assign({ apikey: c.key, Authorization: 'Bearer ' + A.session.access_token }, opts.headers || {});
    return fetch(c.url + path, Object.assign({}, opts, { headers: h }));
  }

  /* ---------------- العمليات ---------------- */
  var USER_RE = /^[\p{L}\p{N}_.\- ]{3,24}$/u;
  async function usernameAvailable(u) {
    var c = cfg();
    try {
      var res = await fetch(c.url + '/rest/v1/rpc/username_available', { method: 'POST', headers: { apikey: c.key, Authorization: 'Bearer ' + c.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_username: u }) });
      if (!res.ok) return true; /* الدالة مش موجودة؟ نسيب السيرفر يحكم */
      return (await res.json()) === true;
    } catch (e) { return true; }
  }
  var GENDERS = { male: 'ذكر', female: 'أنثى', na: 'أفضل عدم الإجابة' };
  function checkDemo(gender, age) {
    if (!GENDERS[gender]) return 'اختر الجنس (أو "أفضل عدم الإجابة")';
    var a = parseInt(age, 10);
    if (!(a >= 5 && a <= 99)) return 'اكتب سنّك (رقم من 5 إلى 99)';
    return '';
  }
  function birthYearOf(age) { return new Date().getFullYear() - parseInt(age, 10); }
  async function signUp(email, username, password, gender, age) {
    username = String(username || '').trim();
    if (!USER_RE.test(username)) return { error: 'اسم المستخدم 3 إلى 24 حرفًا (حروف/أرقام/ _ . -)' };
    if (String(password || '').length < 6) return { error: 'كلمة السر لازم تكون 6 خانات على الأقل' };
    var de = checkDemo(gender, age); if (de) return { error: de };
    if (!(await usernameAvailable(username))) return { error: 'اسم المستخدم ده محجوز — اختر اسم تاني' };
    var r = await authCall('signup', { email: String(email).trim(), password: password, data: { username: username, gender: gender, birth_year: birthYearOf(age) } });
    if (!r.ok) return { error: authErr(r.json, r.status) };
    if (r.json && r.json.access_token) { saveSession(r.json); await refreshProfile(); emit(); return { ok: true }; }
    return { ok: true, confirm: true };
  }
  async function signIn(identifier, password) {
    var email = String(identifier || '').trim();
    if (email.indexOf('@') < 0) return { error: 'اكتب الإيميل اللي سجّلت بيه (مش اسم المستخدم)' };
    var r = await authCall('token?grant_type=password', { email: email, password: password });
    if (!r.ok || !r.json || !r.json.access_token) return { error: authErr(r.json, r.status) };
    saveSession(r.json); await refreshProfile(); emit(); syncNow(false); maybeAskDemo(); return { ok: true };
  }
  function signInWithGoogle() {
    var c = cfg();
    try { sessionStorage.setItem('hakim_oauth', '1'); } catch (e) {}
    location.href = c.url + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(location.href.split('#')[0]);
  }
  /* بعد الرجوع من جوجل: التوكن بييجي في الـhash */
  async function finishOAuthFromHash() {
    var h = String(location.hash || '');
    if (h.indexOf('access_token=') < 0) return false;
    var p = new URLSearchParams(h.replace(/^#/, ''));
    var at = p.get('access_token'), rt = p.get('refresh_token');
    if (!at) return false;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    var c = cfg(), user = null;
    try { var ur = await fetch(c.url + '/auth/v1/user', { headers: { apikey: c.key, Authorization: 'Bearer ' + at } }); if (ur.ok) user = await ur.json(); } catch (e) {}
    if (!user) return false;
    saveSession({ access_token: at, refresh_token: rt || '', expires_in: parseInt(p.get('expires_in') || '3600', 10), token_type: 'bearer', user: user });
    return true;
  }
  async function recover(email) {
    var r = await authCall('recover', { email: String(email).trim() });
    return r.ok ? { ok: true } : { error: authErr(r.json, r.status) };
  }
  function signOut() { saveSession(null); emit(); }
  async function refreshProfile() {
    if (!A.session) return null;
    try {
      var uid = A.session.user && A.session.user.id;
      var res = await authed('/rest/v1/profiles?select=*&id=eq.' + encodeURIComponent(uid));
      var rows = res.ok ? await res.json() : [];
      A.profile = rows[0] || null;
    } catch (e) { A.profile = null; }
    cacheDemo(A.profile);
    return A.profile;
  }
  async function updateProfile(fields) {
    var uid = A.session && A.session.user && A.session.user.id; if (!uid) return { error: 'سجّل دخولك الأول' };
    if (fields.username != null) {
      fields.username = String(fields.username).trim();
      if (!USER_RE.test(fields.username)) return { error: 'اسم المستخدم 3 إلى 24 حرفًا (حروف/أرقام/ _ . -)' };
      if (A.profile && fields.username.toLowerCase() !== String(A.profile.username).toLowerCase() && !(await usernameAvailable(fields.username))) return { error: 'اسم المستخدم ده محجوز — اختر اسم تاني' };
    }
    var res = await authed('/rest/v1/profiles?id=eq.' + encodeURIComponent(uid), { method: 'PATCH', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(fields) });
    if (!res.ok) return { error: res.status === 409 ? 'اسم المستخدم ده محجوز — اختر اسم تاني' : 'تعذّر الحفظ (' + res.status + ')' };
    await refreshProfile(); emit(); return { ok: true };
  }
  function squareBlob(file, size) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(img.width, img.height), cv = document.createElement('canvas'); cv.width = cv.height = size;
        cv.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        URL.revokeObjectURL(url); cv.toBlob(function (b) { b ? resolve(b) : reject(new Error('تعذّر معالجة الصورة')); }, 'image/jpeg', 0.86);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('الملف ده مش صورة صالحة')); };
      img.src = url;
    });
  }
  async function uploadAvatar(file) {
    var uid = A.session && A.session.user && A.session.user.id; if (!uid) return { error: 'سجّل دخولك الأول' };
    if (!file || !/^image\//.test(file.type)) return { error: 'اختر ملف صورة' };
    if (file.size > 8 * 1024 * 1024) return { error: 'الصورة كبيرة (الحد 8 ميجا)' };
    try {
      var blob = await squareBlob(file, 256);
      var res = await authed('/storage/v1/object/avatars/' + uid + '/avatar.jpg', { method: 'POST', headers: { 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: blob });
      if (!res.ok) return { error: res.status === 404 || res.status === 400 ? 'مخزن الصور مش جاهز — شغّل hakim-database.sql في Supabase' : 'تعذّر رفع الصورة (' + res.status + ')' };
      var c = cfg();
      return updateProfile({ avatar_url: c.url + '/storage/v1/object/public/avatars/' + uid + '/avatar.jpg?v=' + Date.now() });
    } catch (e) { return { error: e.message }; }
  }


  /* ---------------- عمليات الحساب الإضافية ---------------- */
  async function authUserUpdate(body) {
    var res = await authed('/auth/v1/user', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    var j = null; try { j = await res.json(); } catch (e) {}
    return res.ok ? { ok: true } : { error: authErr(j, res.status) };
  }
  async function changePassword(p) { if (String(p || '').length < 6) return { error: 'كلمة السر لازم تكون 6 خانات على الأقل' }; return authUserUpdate({ password: p }); }
  async function changeEmail(e) { e = String(e || '').trim(); if (!/^\S+@\S+\.\S+$/.test(e)) return { error: 'تأكد من كتابة الإيميل صح' }; var r = await authUserUpdate({ email: e }); if (r.ok) r.note = 'بعتنا رسالة تأكيد — الإيميل بيتغيّر بعد ما تأكّده.'; return r; }
  async function signOutEverywhere() { try { await authed('/auth/v1/logout?scope=global', { method: 'POST' }); } catch (e) {} signOut(); }
  async function deleteAccount() {
    var uid = A.session && A.session.user && A.session.user.id; if (!uid) return { error: 'سجّل دخولك الأول' };
    try { await authed('/storage/v1/object/avatars/' + uid + '/avatar.jpg', { method: 'DELETE' }); } catch (e) {}
    var res = await authed('/rest/v1/rpc/delete_my_account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!res.ok) return { error: res.status === 404 ? 'الميزة دي محتاجة تشغّل hakim-database.sql في Supabase' : 'تعذّر حذف الحساب (' + res.status + ')' };
    wipeSynced(); saveSession(null); emit(); return { ok: true };
  }

  /* ---------------- مزامنة بياناتك على الحساب (قوائمي / آخر حلقة / السجل / ذوقي) ---------------- */
  var SYNC_KEYS = ['hakim_mylists', 'hakim_last_eps', 'hakim_last_watch', 'hakim_watch_history', 'hakim_search_log', 'hakim_ep_order', 'hakim_personalize', 'hakim_reminder', 'hakim_theme', 'hakim_accent', 'hakim_resume_section'];
  var WATCHED = 'hakim_watched_', TS = 'hakim_sts_', S = { applying: false, timer: null, busy: false, last: 0, err: '' };
  var _set = Storage.prototype.setItem, _rem = Storage.prototype.removeItem;
  function tracked(k) { return SYNC_KEYS.indexOf(k) > -1 || String(k).indexOf(WATCHED) === 0; }
  function touch(k) { if (S.applying || !tracked(k)) return; try { _set.call(localStorage, TS + k, String(Date.now())); } catch (e) {} schedule(); }
  Storage.prototype.setItem = function (k, v) { _set.apply(this, arguments); if (this === localStorage) touch(k); };
  Storage.prototype.removeItem = function (k) { _rem.apply(this, arguments); if (this === localStorage) touch(k); };
  function rj(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lts(k) { return parseInt(localStorage.getItem(TS + k) || '0', 10) || 0; }
  function syncOn() { return localStorage.getItem('hakim_sync_off') !== '1'; }
  function wipeSynced() {
    var del = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && (tracked(k) || k.indexOf(TS) === 0 || k === 'hakim_sync_owner' || k === 'hakim_sync_last')) del.push(k); }
    S.applying = true; del.forEach(function (k) { _rem.call(localStorage, k); }); S.applying = false;
  }
  function buildBlob() {
    var watched = {}, wn = 0, wc = 0;
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf(WATCHED) === 0) { var a = rj(k, []); if (Array.isArray(a) && a.length) { watched[k.slice(WATCHED.length)] = a; wn += a.length; wc++; } } }
    var l = rj('hakim_mylists', {}) || {};
    return { v: 1, listsTs: lts('hakim_mylists'), lists: l, lastEps: rj('hakim_last_eps', {}), lastWatch: rj('hakim_last_watch', null), hist: rj('hakim_watch_history', []), slog: rj('hakim_search_log', []), watched: watched,
      prefs: { ts: Math.max(lts('hakim_ep_order'), lts('hakim_personalize')), order: localStorage.getItem('hakim_ep_order'), personalize: localStorage.getItem('hakim_personalize') },
      stats: { watched: wn, courses: wc, favorites: (l.favorites || []).length, following: (l.following || []).length, later: (l.later || []).length, playlists: (l.playlists || []).length } };
  }
  function uniq(a) { return Array.from(new Set(a)); }
  function mergeLists(loc, rem) {
    var o = { favorites: [], following: [], later: [], playlists: [] };
    ['favorites', 'following', 'later'].forEach(function (k) { o[k] = uniq((loc[k] || []).concat(rem[k] || [])); });
    var seen = {}; (loc.playlists || []).concat(rem.playlists || []).forEach(function (p) { if (!p) return; var key = String(p.name || p.id); if (!seen[key]) seen[key] = { id: p.id, name: p.name, courses: [] }; seen[key].courses = uniq(seen[key].courses.concat(p.courses || [])); });
    o.playlists = Object.keys(seen).map(function (k) { return seen[k]; }); return o;
  }
  function merge(r) {
    var changed = false, put = function (k, v) { S.applying = true; try { _set.call(localStorage, k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e) {} S.applying = false; changed = true; };
    var lt = lts('hakim_mylists'), locL = rj('hakim_mylists', null);
    if (r.lists) {
      if (!lt || !locL) { var u = mergeLists(locL || {}, r.lists); put('hakim_mylists', u); _set.call(localStorage, TS + 'hakim_mylists', String(Date.now())); }
      else if ((r.listsTs || 0) > lt) { put('hakim_mylists', r.lists); _set.call(localStorage, TS + 'hakim_mylists', String(r.listsTs)); }
    }
    var eps = rj('hakim_last_eps', {}) || {}; Object.keys(r.lastEps || {}).forEach(function (c) { if (!eps[c] || (r.lastEps[c].ts || 0) > (eps[c].ts || 0)) { eps[c] = r.lastEps[c]; changed = true; } }); if (changed) put('hakim_last_eps', eps);
    var lw = rj('hakim_last_watch', null); if (r.lastWatch && (!lw || (r.lastWatch.ts || 0) > (lw.ts || 0))) put('hakim_last_watch', r.lastWatch);
    var h = {}; (rj('hakim_watch_history', []) || []).concat(r.hist || []).forEach(function (x) { if (x && x.id && (!h[x.id] || (x.ts || 0) > (h[x.id].ts || 0))) h[x.id] = x; });
    var hl = Object.keys(h).map(function (k) { return h[k]; }).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).slice(0, 30);
    if (JSON.stringify(hl) !== JSON.stringify(rj('hakim_watch_history', []))) put('hakim_watch_history', hl);
    var sl = {}; (rj('hakim_search_log', []) || []).concat(r.slog || []).forEach(function (x) { if (x && x.qn) sl[x.qn + '|' + x.ts] = x; });
    var sll = Object.keys(sl).map(function (k) { return sl[k]; }).sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).slice(0, 60);
    if (JSON.stringify(sll) !== JSON.stringify(rj('hakim_search_log', []))) put('hakim_search_log', sll);
    Object.keys(r.watched || {}).forEach(function (c) { var cur = rj(WATCHED + c, []) || [], un = uniq(cur.concat(r.watched[c])).sort(function (a, b) { return a - b; }); if (un.length !== cur.length) put(WATCHED + c, un); });
    if (r.prefs && (r.prefs.ts || 0) > Math.max(lts('hakim_ep_order'), lts('hakim_personalize'))) {
      if (r.prefs.order) put('hakim_ep_order', r.prefs.order); if (r.prefs.personalize != null) put('hakim_personalize', r.prefs.personalize);
    }
    return changed;
  }
  async function syncNow(manual) {
    if (!A.session || !A.session.user || S.busy || !syncOn() || !enabled()) return { skipped: true };
    S.busy = true; S.err = '';
    try {
      var uid = A.session.user.id, owner = localStorage.getItem('hakim_sync_owner');
      if (owner && owner !== uid) wipeSynced();           /* جهاز مشترك: ما نخلطش بيانات مستخدمين */
      _set.call(localStorage, 'hakim_sync_owner', uid);
      var res = await authed('/rest/v1/user_sync?select=data&user_id=eq.' + encodeURIComponent(uid));
      if (!res.ok) { S.err = res.status === 404 ? 'مزامنة الحساب محتاجة تشغّل hakim-database.sql' : 'تعذّرت المزامنة (' + res.status + ')'; return { error: S.err }; }
      var rows = await res.json(), remote = rows[0] && rows[0].data, changed = false;
      if (remote && remote.v) changed = merge(remote);
      var blob = buildBlob();
      if (!remote || JSON.stringify(blob) !== JSON.stringify(remote)) {
        var up = await authed('/rest/v1/user_sync?on_conflict=user_id', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ user_id: uid, data: blob }) });
        if (!up.ok) { S.err = 'تعذّر حفظ المزامنة (' + up.status + ')'; return { error: S.err }; }
      }
      S.last = Date.now(); _set.call(localStorage, 'hakim_sync_last', String(S.last));
      if (changed) { try { window.dispatchEvent(new CustomEvent('hakim:synced', { detail: { changed: true } })); } catch (e) {} }
      return { ok: true, changed: changed };
    } catch (e) { S.err = 'تعذّرت المزامنة'; return { error: S.err }; }
    finally { S.busy = false; }
  }
  function schedule() { if (!A.session || !syncOn()) return; clearTimeout(S.timer); S.timer = setTimeout(function () { syncNow(false); }, 4000); }
  function exportData() {
    var local = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && tracked(k)) local[k] = rj(k, localStorage.getItem(k)); }
    return { exportedAt: new Date().toISOString(), account: { email: A.session && A.session.user && A.session.user.email, profile: A.profile }, synced: buildBlob(), local: local };
  }

  /* ---------------- واجهة الدخول/التسجيل ---------------- */
  var CSS = '.hk-auth-ov{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.66);display:none;align-items:center;justify-content:center;padding:16px}.hk-auth-ov.show{display:flex}' +
    '.hk-auth{width:100%;max-width:400px;background:var(--surface,#161616);color:var(--text,#f2f2f2);border:1px solid var(--line,#2a2a2c);border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.5);font-family:inherit}' +
    '.hk-auth h3{margin:0 0 4px;font-size:1.15rem}.hk-auth p.sub{margin:0 0 14px;font-size:.82rem;color:var(--text-muted,#9a9a9d)}' +
    '.hk-auth .tabs{display:flex;gap:6px;margin-bottom:14px}.hk-auth .tabs button{flex:1;padding:9px;border-radius:10px;border:1px solid var(--line,#2a2a2c);background:none;color:inherit;font:inherit;font-weight:700;cursor:pointer}.hk-auth .tabs button.on{background:var(--red,#e5202c);border-color:var(--red,#e5202c);color:#fff}' +
    '.hk-auth label{display:block;font-size:.78rem;margin:10px 0 4px;color:var(--text-muted,#9a9a9d)}.hk-auth input{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:10px;border:1px solid var(--line,#2a2a2c);background:var(--surface-2,#1c1c1e);color:inherit;font:inherit}' +
    '.hk-auth .go{width:100%;margin-top:16px;padding:12px;border:0;border-radius:12px;background:var(--red,#e5202c);color:#fff;font:inherit;font-weight:800;cursor:pointer}.hk-auth .go[disabled]{opacity:.6}' +
    '.hk-auth .msg{min-height:18px;margin-top:10px;font-size:.8rem;color:#ff7b84}.hk-auth .msg.ok{color:#4ade80}.hk-auth .lnk{background:none;border:0;color:var(--text-muted,#9a9a9d);font:inherit;font-size:.78rem;cursor:pointer;margin-top:8px;text-decoration:underline;padding:0}' +
    '.hk-auth .gbtn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:11px;border-radius:12px;border:1px solid var(--line,#2a2a2c);background:#fff;color:#1f1f1f;font:inherit;font-weight:800;cursor:pointer}.hk-auth .gbtn:hover{box-shadow:0 2px 10px rgba(0,0,0,.25)}' +
    '.hk-auth .or{display:flex;align-items:center;gap:10px;margin:14px 0 2px;color:var(--text-muted,#9a9a9d);font-size:.75rem}.hk-auth .or:before,.hk-auth .or:after{content:"";flex:1;height:1px;background:var(--line,#2a2a2c)}' +
    '.hk-auth select{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:10px;border:1px solid var(--line,#2a2a2c);background:var(--surface-2,#1c1c1e);color:inherit;font:inherit}.hk-auth .why{margin:8px 0 0;font-size:.72rem;color:var(--text-muted,#9a9a9d)}' +
    '.hk-auth #hkF_pass .lnk{display:block;margin:6px 0 0}' +
    '.hk-auth .x{float:left;background:none;border:0;color:inherit;font-size:1.3rem;cursor:pointer;line-height:1}' +
    '.hk-acc-btn{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 12px;border-radius:999px;border:1px solid var(--line,#2a2a2c);background:var(--surface-2,#1c1c1e);color:inherit;font:inherit;font-size:.82rem;font-weight:700;cursor:pointer;text-decoration:none;white-space:nowrap;flex:0 0 auto}' +
    '.hk-acc-btn:hover{border-color:var(--red,#e5202c)}.hk-acc-btn img,.hk-acc-btn .ini{width:24px;height:24px;border-radius:50%;object-fit:cover;background:var(--red,#e5202c);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:.72rem}' +
    '@media(max-width:720px){.hk-acc-btn{padding:0 9px;height:34px}.hk-acc-btn .nm{display:none}}' +
    /* شريط الدخول العلوي بمفتاح تسجيل/دخول (الرئيسية) */
    '.hk-topbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 14px;background:linear-gradient(90deg,rgba(229,32,44,.18),transparent 70%);border-bottom:1px solid var(--line,#2a2a2c);font-family:inherit}' +
    '.hk-topbar .t{font-size:.8rem;color:var(--text,#f2f2f2);line-height:1.5}.hk-topbar .t b{color:var(--red,#e5202c)}' +
    '.hk-switch{position:relative;flex:0 0 auto;display:inline-flex;direction:rtl;width:148px;height:36px;border-radius:999px;border:1px solid var(--line,#2a2a2c);background:var(--surface-2,#1c1c1e);cursor:pointer;padding:0;overflow:hidden;font:inherit;color:inherit}' +
    '.hk-switch .opt{position:relative;z-index:1;flex:1;display:flex;align-items:center;justify-content:center;gap:4px;font-size:.78rem;font-weight:800;color:var(--text-muted,#9a9a9d);transition:color .2s}' +
    '.hk-switch .opt.on{color:#fff}.hk-switch .knob{position:absolute;top:3px;bottom:3px;right:3px;width:calc(50% - 3px);border-radius:999px;background:var(--red,#e5202c);box-shadow:0 2px 10px rgba(229,32,44,.45);transition:transform .28s cubic-bezier(.4,.2,.2,1)}' +
    '.hk-switch[data-side="signup"] .knob{transform:translateX(-100%)}.hk-switch:focus-visible{outline:2px solid var(--red,#e5202c);outline-offset:2px}' +
    '@media(max-width:520px){.hk-topbar .t{font-size:.72rem}.hk-switch{width:128px}}';
  var mode = 'login', modalEl = null;
  function ensureModal() {
    if (modalEl) return modalEl;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    modalEl = document.createElement('div'); modalEl.className = 'hk-auth-ov';
    modalEl.innerHTML = '<div class="hk-auth" role="dialog" aria-modal="true"><button class="x" type="button" aria-label="إغلاق">×</button>' +
      '<h3 id="hkAuthTitle">أهلًا بيك 👋</h3><p class="sub" id="hkAuthSub"></p>' +
      '<div class="tabs"><button type="button" data-m="login">تسجيل الدخول</button><button type="button" data-m="signup">إنشاء حساب</button></div>' +
      '<div id="hkF_google"><button type="button" class="gbtn" id="hkAuthGoogle"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg><span>المتابعة عبر جوجل</span></button><div class="or"><span>أو</span></div></div>' +
      '<div id="hkF_user" style="display:none"><label>اسم المستخدم</label><input id="hkAuthUser" autocomplete="username" maxlength="24" placeholder="مثال: ahmed_55"></div>' +
      '<label id="hkAuthEmailLbl">الإيميل</label><input id="hkAuthEmail" type="email" dir="ltr" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="name@example.com">' +
      '<div id="hkF_pass"><label>كلمة السر</label><input id="hkAuthPass" type="password" dir="ltr" autocomplete="current-password" placeholder="••••••"><button class="lnk" type="button" id="hkAuthForgot">هل نسيت كلمة المرور؟</button></div>' +
      '<div id="hkF_demo" style="display:none"><label>الجنس</label><select id="hkAuthGender"><option value="">— اختر —</option><option value="male">ذكر</option><option value="female">أنثى</option><option value="na">أفضل عدم الإجابة</option></select>' +
      '<label>السن</label><input id="hkAuthAge" type="number" min="5" max="99" inputmode="numeric" dir="ltr" placeholder="مثال: 17"><label style=\"margin-top:10px\">كود التكريم <span style=\"background:#e5202c;color:#fff;padding:1px 9px;border-radius:99px;font-size:.78rem;font-weight:700;margin-inline:6px\">اختياري</span> 🎖️</label><input id=\"hkAuthHonor\" dir=\"ltr\" maxlength=\"32\" autocapitalize=\"characters\" autocomplete=\"off\" placeholder=\"HK-XXXXXX\" style=\"text-transform:uppercase\"><p class="why">ده <b>اختياري</b> — سيبه فاضي لو معندكش كود.</p><p class="why">بنستخدمهم عشان نرشّح لك الكورسات المناسبة لك فقط — مش بيظهروا لأي حد.</p></div>' +
      '<button class="go" type="button" id="hkAuthGo">دخول</button><div class="msg" id="hkAuthMsg"></div></div>';
    document.body.appendChild(modalEl);
    modalEl.addEventListener('click', function (e) { if (e.target === modalEl) closeAuth(); });
    modalEl.querySelector('.x').addEventListener('click', closeAuth);
    modalEl.querySelectorAll('.tabs button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.m); }); });
    modalEl.querySelector('#hkAuthGo').addEventListener('click', submit);
    modalEl.querySelector('#hkAuthForgot').addEventListener('click', function () { setMode(mode === 'forgot' ? 'login' : 'forgot'); });
    modalEl.querySelector('#hkAuthGoogle').addEventListener('click', signInWithGoogle);
    modalEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); if (e.key === 'Escape') closeAuth(); });
    return modalEl;
  }
  function msg(t, ok) { var m = modalEl.querySelector('#hkAuthMsg'); m.textContent = t || ''; m.className = 'msg' + (ok ? ' ok' : ''); }
  function setMode(m) {
    mode = m; var el = ensureModal(); var sw = document.getElementById('hkSwitch'); if (sw && m !== 'forgot') setSwitch(m);
    el.querySelectorAll('.tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.m === (m === 'forgot' ? 'login' : m)); });
    var q = function (id) { return el.querySelector(id); }, em = q('#hkAuthEmail');
    q('#hkF_google').style.display = m === 'forgot' ? 'none' : '';
    q('#hkF_user').style.display = m === 'signup' ? '' : 'none';
    q('#hkF_demo').style.display = m === 'signup' ? '' : 'none';
    q('#hkF_pass').style.display = m === 'forgot' ? 'none' : '';
    q('#hkAuthEmailLbl').textContent = 'الإيميل';
    em.type = 'email'; em.autocomplete = m === 'signup' ? 'email' : 'username';
    q('#hkAuthPass').autocomplete = m === 'signup' ? 'new-password' : 'current-password';
    q('#hkAuthGo').textContent = m === 'signup' ? 'إنشاء الحساب' : m === 'forgot' ? 'ابعت رابط الاسترجاع' : 'دخول';
    q('#hkAuthForgot').style.display = m === 'login' ? '' : 'none';
    var back = q('#hkAuthBack');
    if (m === 'forgot') {
      if (!back) { back = document.createElement('button'); back.type = 'button'; back.id = 'hkAuthBack'; back.className = 'lnk'; back.textContent = '← رجوع لتسجيل الدخول'; back.addEventListener('click', function () { setMode('login'); }); q('#hkAuthGo').insertAdjacentElement('afterend', back); }
      back.style.display = '';
    } else if (back) back.style.display = 'none';
    msg('');
  }
  function openAuth(m, reason) {
    if (!enabled()) { alert('نظام الحسابات لسه ما اتفعّلش في الموقع.'); return; }
    var el = ensureModal(); setMode(m || 'login');
    el.querySelector('#hkAuthSub').textContent = reason || 'سجّل عشان تحفظ وتتابع كورساتك وتبني ملفك الشخصي.';
    el.classList.add('show'); setTimeout(function () { var f = el.querySelector(mode === 'signup' ? '#hkAuthUser' : '#hkAuthEmail'); if (f) f.focus(); }, 60);
  }
  function closeAuth() { if (modalEl) modalEl.classList.remove('show'); }
  async function submit() {
    var go = modalEl.querySelector('#hkAuthGo'), email = modalEl.querySelector('#hkAuthEmail').value.trim(), pass = modalEl.querySelector('#hkAuthPass').value, user = modalEl.querySelector('#hkAuthUser').value.trim();
    if (!email) { msg('اكتب الإيميل'); return; }
    go.disabled = true; msg('جارٍ التنفيذ...', true);
    try {
      var r;
      if (mode === 'signup') { var hc = (modalEl.querySelector('#hkAuthHonor').value || '').trim().toUpperCase(); if (hc) { try { localStorage.setItem('hk_honor_pending', hc); } catch (e) {} } r = await signUp(email, user, pass, modalEl.querySelector('#hkAuthGender').value, modalEl.querySelector('#hkAuthAge').value); }
      else if (mode === 'forgot') { r = await recover(email); if (r.ok) { msg('لو الإيميل مسجّل هيوصلك رابط استرجاع الحساب 📧', true); go.disabled = false; return; } }
      else { if (!pass) { msg('اكتب كلمة السر'); go.disabled = false; return; } r = await signIn(email, pass); }
      if (r.error) msg(r.error);
      else if (r.confirm) msg('اتعمل الحساب ✅ — فعّل الإيميل من الرسالة اللي وصلتلك وبعدين سجّل دخول.', true);
      else { closeAuth(); if (typeof window.hakimToast === 'function') window.hakimToast('أهلًا بيك ' + ((A.profile && A.profile.username) || '') + ' 👋', 'success'); }
    } catch (e) { msg('تعذّر الاتصال — جرّب تاني'); }
    go.disabled = false;
  }

  /* ---------------- استكمال الجنس والسن (حسابات جوجل / حسابات قديمة) — مرة كل جلسة ---------------- */
  var demoEl = null;
  function maybeAskDemo(force) {
    var p = A.profile; if (!A.session || !p || (p.gender && p.birth_year)) return;
    try { if (!force && sessionStorage.getItem('hakim_demo_asked') === '1') return; sessionStorage.setItem('hakim_demo_asked', '1'); } catch (e) {}
    if (!document.getElementById('hkAccStyle')) { var st = document.createElement('style'); st.id = 'hkAccStyle'; st.textContent = CSS; document.head.appendChild(st); }
    if (demoEl) demoEl.remove();
    demoEl = document.createElement('div'); demoEl.className = 'hk-auth-ov show';
    demoEl.innerHTML = '<div class="hk-auth" role="dialog" aria-modal="true"><button class="x" type="button" aria-label="إغلاق">×</button><h3>كمّل بياناتك 🎯</h3><p class="sub">بنستخدمهم عشان نرشّح لك الكورسات المناسبة لك فقط — مش بيظهروا لأي حد.</p>' +
      '<label>الجنس</label><select id="hkDmG"><option value="">— اختر —</option><option value="male">ذكر</option><option value="female">أنثى</option><option value="na">أفضل عدم الإجابة</option></select>' +
      '<label>السن</label><input id="hkDmA" type="number" min="5" max="99" inputmode="numeric" dir="ltr" placeholder="مثال: 17">' +
      '<button class="go" type="button" id="hkDmGo">حفظ</button><div class="msg" id="hkDmMsg"></div></div>';
    document.body.appendChild(demoEl);
    var g = demoEl.querySelector('#hkDmG'), a = demoEl.querySelector('#hkDmA'), m = demoEl.querySelector('#hkDmMsg');
    if (p.gender) g.value = p.gender; if (p.birth_year) a.value = new Date().getFullYear() - p.birth_year;
    demoEl.querySelector('.x').addEventListener('click', function () { demoEl.remove(); demoEl = null; });
    demoEl.querySelector('#hkDmGo').addEventListener('click', async function () {
      var er = checkDemo(g.value, a.value); if (er) { m.textContent = er; return; }
      var r = await updateProfile({ gender: g.value, birth_year: birthYearOf(a.value) });
      if (r.error) m.textContent = r.error; else { demoEl.remove(); demoEl = null; if (typeof window.hakimToast === 'function') window.hakimToast('تم الحفظ ✅', 'success'); }
    });
  }

  /* ---------------- شريط الدخول العلوي (الرئيسية): مفتاح بوضعين تسجيل | دخول ---------------- */
  function setSwitch(side) {
    var sw = document.getElementById('hkSwitch'); if (!sw) return;
    sw.dataset.side = side === 'signup' ? 'signup' : 'login'; sw.setAttribute('aria-checked', side === 'signup' ? 'true' : 'false');
    sw.querySelector('[data-o="login"]').classList.toggle('on', side !== 'signup'); sw.querySelector('[data-o="signup"]').classList.toggle('on', side === 'signup');
  }
  function renderTopbar() {
    var home = document.body && document.body.getAttribute('data-page') === 'home', bar = document.getElementById('hkTopbar');
    var guest = home && enabled() && !(A.session && A.session.user);
    if (!guest) { if (bar) bar.remove(); return; }
    if (bar) return;
    if (!document.getElementById('hkAccStyle')) { var st = document.createElement('style'); st.id = 'hkAccStyle'; st.textContent = CSS; document.head.appendChild(st); }
    bar = document.createElement('div'); bar.id = 'hkTopbar'; bar.className = 'hk-topbar';
    var wn = 0; try { for (var ki = 0; ki < localStorage.length; ki++) { var kk = localStorage.key(ki); if (kk && kk.indexOf('hakim_watched_') === 0) { try { wn += (JSON.parse(localStorage.getItem(kk)) || []).length; } catch (e) {} } } } catch (e) {}
    /* تقدّمك الحقيقي على الجهاز ده (لو موجود) — تذكير صادق إنه ممكن يضيع لو مسجّلتش */
    var TT = window.SITE_TEXT || {};
    var topMsg = wn > 0 ? String(TT.guestBarWatched || 'شاهدت <b>{n} حلقة</b> على الجهاز ده — سجّل عشان تفضل محفوظة وتكمّل من أي جهاز 👋').split('{n}').join(wn) : (TT.guestBarEmpty || 'سجّل عشان <b>تحفظ كورساتك</b> وتكمّل من حيث وقفت على أي جهاز 👋');
    bar.innerHTML = '<span class="t">' + topMsg + '</span>' +
      '<button type="button" class="hk-switch" id="hkSwitch" role="switch" aria-checked="false" data-side="login" aria-label="تسجيل أو تسجيل دخول"><i class="knob"></i><span class="opt on" data-o="login">🔒 دخول</span><span class="opt" data-o="signup">✨ تسجيل</span></button>';
    document.body.insertBefore(bar, document.body.firstChild);
    var sw = bar.querySelector('#hkSwitch');
    function pick(side) { setSwitch(side); setTimeout(function () { openAuth(side); }, 230); }
    sw.addEventListener('click', function (e) {
      var r = sw.getBoundingClientRect(), rightHalf = (e.clientX - r.left) > r.width / 2;   /* RTL: اليمين = دخول */
      pick(rightHalf ? 'login' : 'signup');
    });
    sw.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pick(sw.dataset.side === 'signup' ? 'login' : 'signup'); } if (e.key === 'ArrowLeft') pick('signup'); if (e.key === 'ArrowRight') pick('login'); });
  }

  /* ---------------- زر الهيدر ---------------- */
  function renderHeaderBtn() {
    renderTopbar();
    var host = document.querySelector('.header-actions'); if (!host) return;
    var b = document.getElementById('hkAccBtn');
    if (!enabled()) { if (b) b.remove(); return; }
    if (!document.getElementById('hkAccStyle')) { var st = document.createElement('style'); st.id = 'hkAccStyle'; st.textContent = CSS; document.head.appendChild(st); }
    if (!b) {
      b = document.createElement('a'); b.id = 'hkAccBtn'; b.className = 'hk-acc-btn';
      var anchor = document.getElementById('menuBtn') || host.lastElementChild; host.insertBefore(b, anchor);
    }
    var p = A.profile, u = A.session && A.session.user;
    if (u) {
      var nm = (p && p.username) || (u.email || '').split('@')[0] || 'حسابي';
      b.classList.remove('hk-guest'); b.href = 'profile.html'; b.onclick = null; b.title = 'ملفي الشخصي';
      b.innerHTML = (p && p.avatar_url ? '<img src="' + esc(p.avatar_url) + '" alt="">' : '<span class="ini">' + esc(nm.charAt(0).toUpperCase()) + '</span>') + '<span class="nm">' + esc(nm) + '</span>';
    } else {
      b.classList.add('hk-guest'); b.removeAttribute('href'); b.title = 'تسجيل الدخول'; b.innerHTML = '<span class="gl">تسجيل الدخول</span>';
      b.onclick = function (e) { e.preventDefault(); openAuth('login'); };
    }
  }

  /* بوابة: بترجّع true (وتفتح نافذة الدخول) لو لازم المستخدم يسجّل الأول — بتشتغل بس لو الحسابات مفعّلة */
  window.hakimAuthGate = function (reason) {
    if (!enabled() || (A.session && A.session.user)) return false;
    openAuth('login', reason || 'لازم تسجّل دخولك عشان تحفظ أو تتابع كورس.'); return true;
  };

  window.HakimAccount = {
    enabled: enabled, cfg: cfg, get session() { return A.session; }, get user() { return A.session && A.session.user; }, get profile() { return A.profile; },
    onChange: function (f) { A.cbs.push(f); if (A.ready) { try { f(A); } catch (e) {} } },
    token: async function () { return (A.session && await ensureFresh()) ? A.session.access_token : ''; },
    openAuth: openAuth, closeAuth: closeAuth, signOut: signOut, changePassword: changePassword, changeEmail: changeEmail, signOutEverywhere: signOutEverywhere, deleteAccount: deleteAccount, exportData: exportData,
    sync: { now: function () { return syncNow(true); }, enabled: syncOn, setEnabled: function (on) { try { _set.call(localStorage, 'hakim_sync_off', on ? '0' : '1'); } catch (e) {} if (on) syncNow(true); }, get last() { return S.last || parseInt(localStorage.getItem('hakim_sync_last') || '0', 10) || 0; }, get error() { return S.err; } },
    redeemHonor: redeemHonor, signOutAndKeep: signOut, signUp: signUp, signIn: signIn, signInWithGoogle: signInWithGoogle, askDemo: function () { maybeAskDemo(true); }, updateProfile: updateProfile, uploadAvatar: uploadAvatar, refreshProfile: refreshProfile, usernameAvailable: usernameAvailable
  };

  /* تحكّمات الأدمن في حسابي (منع إعلانات / مزيل فيديو أقوى / VIP / حظر / ترحيب) + كود التكريم */
  async function rpcMe(fn, args) {
    if (!(await ensureFresh())) return null; var tok = A.session.access_token, c = cfg();
    var r = await fetch(c.url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: c.key, Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) });
    if (!r.ok) return null; try { return await r.json(); } catch (e) { return {}; }
  }
  async function redeemHonor(code) {
    code = String(code || '').trim().toUpperCase(); if (!code) return { error: 'اكتب الكود' };
    if (!(A.session && A.session.user)) { try { localStorage.setItem('hk_honor_pending', code); } catch (e) {} return { error: 'سجّل دخول الأول وبعدها الكود هيتفعّل' }; }
    var j = await rpcMe('redeem_honor_code', { p_code: code });
    if (!j) return { error: 'تعذّر الاتصال — جرّب تاني' };
    if (j.ok) { try { localStorage.removeItem('hk_honor_pending'); localStorage.removeItem('hakim_ctl'); } catch (e) {} await refreshControls(true); return { ok: true, label: j.label }; }
    var m = { already: 'الحساب ده استخدم كود تكريم قبل كده', rate: 'محاولات كتير غلط — جرّب بعد ساعة', full: 'الكود ده اكتمل عدده', login: 'سجّل دخول الأول' };
    if (j.error !== 'login' && j.error !== 'rate') { try { localStorage.removeItem('hk_honor_pending'); } catch (e) {} }
    return { error: m[j.error] || 'الكود غير صحيح أو منتهي' };
  }
  async function refreshControls(force) {
    try {
      if (!(A.session && A.session.user)) { try { localStorage.removeItem('hakim_ctl'); } catch (e) {} return; }
      var pend = null; try { pend = localStorage.getItem('hk_honor_pending'); } catch (e) {}
      if (pend) { var rr = await redeemHonor(pend); if (rr && rr.ok && typeof window.hakimToast === 'function') window.hakimToast('🎖️ اتفعّل كود التكريم' + (rr.label ? ' — ' + rr.label : ''), 'success'); }
      var last = null; try { last = JSON.parse(localStorage.getItem('hakim_ctl') || 'null'); } catch (e) {}
      if (!force && last && last.u === A.session.user.id && Date.now() - last.t < 600000) { showWelcome(last); return; }
      var j = await rpcMe('get_my_controls', {}); if (!j) return;
      var ctl = { u: A.session.user.id, t: Date.now(), ads_off: !!j.ads_off, adblock_max: !!j.video_adblock_max, vip: !!j.vip, banned: !!j.banned, wt: j.welcome_title || '', wb: j.welcome_body || '', wl: +j.welcome_left || 0 };
      try { localStorage.setItem('hakim_ctl', JSON.stringify(ctl)); } catch (e) {}
      if (ctl.banned) { try { await signOut(); } catch (e) {} if (typeof window.hakimToast === 'function') window.hakimToast('تم تعليق هذا الحساب. تواصل مع الإدارة لو ده بالغلط.', 'error'); return; }
      showWelcome(ctl);
    } catch (e) {}
  }
  /* نافذة الترحيب (بيحدد الأدمن النص وعدد مرات ظهورها) */
  function showWelcome(ctl) {
    try {
      if (!ctl || !ctl.wl || !ctl.wt || sessionStorage.getItem('hk_welcome_shown') === '1' || /\/(admin|offline|maintenance)\.html$/.test(location.pathname)) return;
      sessionStorage.setItem('hk_welcome_shown', '1');
      if (!document.getElementById('hkAccStyle')) { var st = document.createElement('style'); st.id = 'hkAccStyle'; st.textContent = CSS; document.head.appendChild(st); }
      var el = document.createElement('div'); el.className = 'hk-auth-ov show';
      var h = document.createElement('h3'); h.textContent = ctl.wt; var p = document.createElement('p'); p.className = 'sub'; p.style.whiteSpace = 'pre-wrap'; p.textContent = ctl.wb || '';
      var box = document.createElement('div'); box.className = 'hk-auth'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
      var b = document.createElement('button'); b.type = 'button'; b.className = 'go'; b.textContent = 'تمام 👍';
      box.appendChild(h); box.appendChild(p); box.appendChild(b); el.appendChild(box); document.body.appendChild(el);
      var done = function () { el.remove(); }; b.addEventListener('click', done); el.addEventListener('click', function (e) { if (e.target === el) done(); });
      rpcMe('consume_my_welcome', {}); ctl.wl = Math.max(0, ctl.wl - 1); try { localStorage.setItem('hakim_ctl', JSON.stringify(ctl)); } catch (e) {}
    } catch (e) {}
  }

  /* ---------------- تهيئة: ننتظر إعدادات الموقع (Supabase) تتحمّل ---------------- */
  async function boot() {
    var tries = 0;
    while (!enabled() && tries++ < 25) await new Promise(function (r) { setTimeout(r, 300); });
    if (enabled()) {
      var viaOAuth = await finishOAuthFromHash();
      if (!viaOAuth) A.session = loadSession();
      if (A.session && await ensureFresh()) await refreshProfile(); else if (A.session) saveSession(null);
    }
    try { var hq = new URLSearchParams(location.search).get('honor'); if (hq && /^[A-Za-z0-9\-]{4,32}$/.test(hq)) { localStorage.setItem('hk_honor_pending', hq.toUpperCase()); if (!A.session) setTimeout(function () { try { openAuth('signup'); var f = document.getElementById('hkAuthHonor'); if (f) f.value = hq.toUpperCase(); } catch (e) {} }, 700); } } catch (e) {}
    A.ready = true; emit(); refreshControls(); A.cbs.push(function () { refreshControls(); });
    if (A.session) { syncNow(false); maybeAskDemo(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
