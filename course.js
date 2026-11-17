/* لا تعدّل هذا الملف — هذه دالة داخلية يستخدمها كل ملف كورس تلقائيًا */
function registerCourse(id, data) {
  window.__HAKIM_COURSES = window.__HAKIM_COURSES || {};
  window.__HAKIM_COURSES[id] = data;
}

/* ============================================================
   common.js — دوال مشتركة بين كل صفحات الموقع
   ============================================================ */

function hakimEscapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str == null ? '' : String(str);
  return d.innerHTML;
}

const __hakimLoadedScripts = {};
/* ملفات البيانات (إعدادات الموقع/القوائم/الكورسات) بنطلبها بنسخة كل 30 ثانية، عشان تعديلات الأدمن (وضع الصيانة مثلًا)
   تظهر بسرعة بدل ما تستنى كاش المتصفح والـCDN (حوالي 10 دقايق على GitHub Pages) */
function hakimVersioned(src) {
  if (/^vendor\//.test(src) || /^media-utils\.js/.test(src) || /[?&]v=/.test(src)) return src;
  return src + (src.indexOf('?') > -1 ? '&' : '?') + 'v=' + Math.floor(Date.now() / 30000);
}
function hakimLoadScript(src) {
  if (__hakimLoadedScripts[src]) return __hakimLoadedScripts[src];
  __hakimLoadedScripts[src] = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = hakimVersioned(src);
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return __hakimLoadedScripts[src];
}

/* ---------------- زر تثبيت التطبيق (PWA) ---------------- */
let __hakimInstallPrompt = null;
function hakimIsStandalone() { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function hakimIsIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function hakimSyncInstallButton() { document.querySelectorAll('#installAppBtn').forEach(b => { b.style.display = hakimIsStandalone() ? 'none' : ''; }); }
window.addEventListener('appinstalled', () => {
  window.__hakimBIP = null;
  document.querySelectorAll('#installAppBtn').forEach(b => { b.style.display = 'none'; });
  if (typeof hakimToast === 'function') hakimToast('تم تثبيت التطبيق بنجاح ✅', 'success');
});
function hakimShowInstallHelp() {
  const ios = hakimIsIOS();
  const inApp = /FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|MicroMessenger/i.test(navigator.userAgent);
  const body = ios
    ? '<p style="margin:0 0 8px;font-size:.88rem;color:var(--text-muted)">آبل ما بتسمحش بالتثبيت بضغطة واحدة في آيفون/آيباد — لازم 3 خطوات سريعة من سفاري:</p><ol style="margin:0 0 14px;padding-inline-start:20px;line-height:1.9;font-size:.9rem;color:var(--text-muted)"><li>اضغط زر المشاركة ⬆️</li><li>اختر "إضافة إلى الشاشة الرئيسية"</li><li>اضغط "إضافة"</li></ol>'
    : '<p style="margin:0 0 14px;line-height:1.8;font-size:.9rem;color:var(--text-muted)">' + (inApp ? 'المتصفح المدمج داخل التطبيق ده مش بيدعم التثبيت — افتح الرابط في Chrome أو Edge وجرّب تاني.' : 'المتصفح ده مش بيدعم التثبيت المباشر. افتح الموقع في Chrome أو Edge وهتلاقي التثبيت بضغطة واحدة.') + '</p>';
  const old = document.getElementById('installHelpOverlay'); if (old) old.remove();
  const ov = document.createElement('div'); ov.id = 'installHelpOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px';
  ov.innerHTML = '<div role="dialog" aria-modal="true" style="background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:20px;max-width:360px;width:100%;color:var(--text);box-shadow:0 20px 50px rgba(0,0,0,.5)"><h3 style="margin:0 0 10px;font-size:1.05rem">تثبيت التطبيق على الشاشة الرئيسية</h3>' + body + '<button type="button" style="width:100%;background:var(--red);color:#fff;border:0;border-radius:10px;padding:10px;font:inherit;font-weight:700;cursor:pointer">تمام</button></div>';
  ov.addEventListener('click', (e) => { if (e.target === ov || e.target.tagName === 'BUTTON') ov.remove(); });
  document.body.appendChild(ov);
}
/* ينتظر حدث beforeinstallprompt لحظة قصيرة (مصدره سكربت صغير في أول الصفحة) */
function hakimWaitForInstallPrompt(ms) {
  return new Promise(resolve => {
    if (window.__hakimBIP) return resolve(window.__hakimBIP);
    const t = setTimeout(() => { window.removeEventListener('hakim-bip', on); resolve(null); }, ms);
    function on() { clearTimeout(t); resolve(window.__hakimBIP); }
    window.addEventListener('hakim-bip', on, { once: true });
  });
}
async function hakimInstallApp(btn) {
  if (hakimIsStandalone()) { if (typeof hakimToast === 'function') hakimToast('التطبيق مثبّت عندك بالفعل ✅', 'success'); return; }
  const ev = window.__hakimBIP || (hakimIsIOS() ? null : await hakimWaitForInstallPrompt(1800));
  if (!ev) { hakimShowInstallHelp(); return; }
  window.__hakimBIP = null;
  try {
    ev.prompt();
    const r = await ev.userChoice;
    if (r && r.outcome === 'accepted') btn.style.display = 'none';
  } catch (e) { hakimShowInstallHelp(); }
}
function hakimInitInstallButton() {
  const btn = document.getElementById('installAppBtn');
  if (!btn) return;
  hakimSyncInstallButton();
  btn.addEventListener('click', () => hakimInstallApp(btn));
  if ('serviceWorker' in navigator && !window.__HAKIM_PREVIEW) navigator.serviceWorker.register('sw.js').catch(() => {});
}

const HAKIM_PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a0f13"/><stop offset="1" stop-color="#0f1016"/></linearGradient></defs><rect width="300" height="450" fill="url(#g)"/><circle cx="150" cy="215" r="46" fill="none" stroke="#e5202c" stroke-width="3" opacity=".85"/><path d="M138 192v46l38-23z" fill="#e5202c" opacity=".9"/></svg>`);

/* إعدادات الموقع (اسم/فوتر/حقوق) — يتم تحميلها وتطبيقها على أي عنصر بالكلاسات المذكورة */
async function hakimApplySiteSettings() {
  await hakimLoadScript('site-settings.js');
  const s = window.SITE_SETTINGS || {};
  if (s.siteName) { document.querySelectorAll('.js-site-name').forEach(el => { el.textContent = s.siteName; }); const baked = s.siteNameApplied || 'منصة حكيم التعليمية'; if (baked !== s.siteName) document.title = document.title.split(baked).join(s.siteName); }
  if (s.tagline) document.querySelectorAll('.js-tagline').forEach(el => { el.textContent = s.tagline; });
  if (s.footerRights) document.querySelectorAll('.js-footer-rights').forEach(el => { el.textContent = s.footerRights; });
  if (s.footerNote) document.querySelectorAll('.js-footer-note').forEach(el => { el.textContent = s.footerNote; });
  return s;
}

async function hakimRenderSideMenu() {
  const host = document.getElementById('sideMenuItems');
  if (!host) return;
  try { await hakimLoadScript('menu-config.js'); } catch (e) {}
  const P = {
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z',
    folder: 'M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z', mail: 'M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5z',
    bell: 'M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z', chart: 'M5 9h3v10H5zm5-5h3v15h-3zm5 8h3v7h-3z',
    cal: 'M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm0 16H5V9h14z', bulb: 'M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z'
  };
  /* لو menu-config.js ما اتحمّلش (نت ضعيف / فتح من ملف محلي) القائمة ما تفضلش فاضية */
  const cfg = (window.MENU_CONFIG && window.MENU_CONFIG.length) ? window.MENU_CONFIG : [
    { label: 'الإشعارات', href: 'notifications.html', type: 'other', icon: P.bell }, { label: 'الاستطلاعات', href: 'polls.html', type: 'other', icon: P.chart },
    { label: 'مواعيد العرض', href: 'schedule.html', type: 'other', icon: P.cal }, { label: 'الاقتراحات والأفكار', href: 'suggestions.html', type: 'other', icon: P.bulb }
  ];
  const vis = cfg.filter(it => it.visible !== false);
  const link = (it, ico) => `<a class="menu-link${hakimIsHere(it.href || '#') ? ' current' : ''}" href="${hakimEscapeHtml(it.href || '#')}"><svg viewBox="0 0 24 24"><path d="${it.icon || ico}"/></svg>${hakimEscapeHtml(it.label || '')}</a>`;
  const sections = vis.filter(it => it.type === 'section'), others = vis.filter(it => it.type !== 'section');
  const accounts = !!((window.SITE_SETTINGS || {}).supabaseUrl);
  const contact = [{ label: 'اتصل بنا', href: 'contact.html?tab=contact' }, { label: 'الشكاوى والبلاغات', href: 'contact.html?tab=complaint' }, { label: 'DMCA', href: 'contact.html?tab=dmca' }, { label: 'أريد العمل معكم', href: 'contact.html?tab=join' }];
  host.innerHTML = link({ label: 'الرئيسية', href: 'index.html' }, P.home)
    + (accounts ? link({ label: 'ملفي الشخصي', href: 'profile.html' }, P.user) : '')
    + (others.length ? '<h3>المزيد</h3>' + others.map(it => link(it, P.folder)).join('') : '')
    + `<button type="button" class="menu-group-toggle" aria-expanded="${/contact\.html$/.test(location.pathname) ? 'true' : 'false'}"><span>تواصل معنا</span><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M7 10l5 5 5-5z" fill="currentColor"/></svg></button><div class="menu-group-body" ${/contact\.html$/.test(location.pathname) ? '' : 'hidden'}>` + contact.map(it => link(it, P.mail)).join('') + '</div>';
}

function hakimIsHere(href) {
  try {
    const u = new URL(href, location.href), f = p => p.split('/').pop() || 'index.html';
    if (f(u.pathname) !== f(location.pathname)) return false;
    const cur = new URLSearchParams(location.search);
    for (const [k, v] of u.searchParams) if (cur.get(k) !== v) return false;
    return true;
  } catch (e) { return false; }
}
function hakimPlaceDropdown(btn, panel) {
  panel.style.left = ''; panel.style.right = '';
  if (window.matchMedia('(max-width: 640px)').matches) return;
  const wrap = btn.closest('.mylists-wrap'); if (!wrap) return;
  const vw = document.documentElement.clientWidth, w = panel.offsetWidth, wr = wrap.getBoundingClientRect();
  const left = Math.max(10, Math.min(wr.right - w, vw - w - 10));
  panel.style.right = 'auto'; panel.style.left = (left - wr.left) + 'px';
}
function hakimSetDropdownOpen(btn, panel, on) {
  panel._btn = btn;
  panel.classList.toggle('show', on); btn.classList.toggle('active-mylists', on); btn.setAttribute('aria-expanded', on ? 'true' : 'false');
  if (on) hakimPlaceDropdown(btn, panel);
}
window.addEventListener('resize', () => document.querySelectorAll('.mylists-dropdown.show').forEach(p => p._btn && hakimPlaceDropdown(p._btn, p)));

async function hakimRenderSectionsDropdown() {
  const host = document.getElementById('sectionsDropdown');
  if (!host) return;
  await hakimLoadScript('menu-config.js');
  const items = (window.MENU_CONFIG || []).filter(it => it.visible !== false && it.type === 'section');
  if (items.length === 0) {
    host.innerHTML = `<p class="mylists-empty-hint">لا توجد أقسام مضافة بعد.</p>`;
    return;
  }
  host.innerHTML = `<div class="mylists-rows"><a class="mylists-row is-all${hakimIsHere('index.html') ? ' current' : ''}" href="index.html"><span class="name">الصفحة الرئيسية</span></a>${items.map(it =>
    `<a class="mylists-row${hakimIsHere(it.href || '#') ? ' current' : ''}" href="${hakimEscapeHtml(it.href || '#')}"><span class="name">${hakimEscapeHtml(it.label || '')}</span></a>`
  ).join('')}</div>`;
}
function hakimInitSectionsMenu() {
  const btn = document.getElementById('sectionsBtn');
  const panel = document.getElementById('sectionsDropdown');
  if (!btn || !panel) return;
  function open() { const o = document.getElementById('myListsDropdown'), ob = document.getElementById('myListsBtn'); if (o && ob) hakimSetDropdownOpen(ob, o, false); hakimSetDropdownOpen(btn, panel, true); Promise.resolve(hakimRenderSectionsDropdown()).then(() => hakimPlaceDropdown(btn, panel)); }
  function close() { hakimSetDropdownOpen(btn, panel, false); }
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel.classList.contains('show')) close(); else open();
  });
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('show') && !panel.contains(e.target) && !btn.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

function hakimInitMenu() {
  const btn = document.getElementById('menuBtn');
  const overlay = document.getElementById('menuOverlay');
  const panel = document.getElementById('sideMenu');
  const closeBtn = document.getElementById('menuCloseBtn');
  if (!btn || !overlay || !panel) return;
  hakimRenderSideMenu();
  function open() { overlay.classList.add('show'); panel.classList.add('show'); }
  function close() { overlay.classList.remove('show'); panel.classList.remove('show'); }
  btn.addEventListener('click', open);
  overlay.addEventListener('click', close);
  if (closeBtn) closeBtn.addEventListener('click', close);
}

function hakimInitTheme() { /* الثيمات اتشالت: الموقع ليلي أحمر دايمًا */ }

function hakimAddTelegramButton() {
  const s = window.SITE_SETTINGS || {};
  if (!s.telegramUrl) return;
  const a = document.createElement('a');
  a.href = s.telegramUrl; a.target = '_blank'; a.rel = 'noopener';
  a.className = 'floating-telegram'; a.title = 'انضم لقناتنا على تليجرام';
  a.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.14-3.05-2 1.92c-.23.23-.42.42-.82.42z"/></svg>`;
  document.body.appendChild(a);
}

/* ============================================================
   قوائمي — المفضلة + المتابعة + قوائم تشغيل مخصصة (محلي بالكامل)
   ============================================================ */
const HAKIM_MYLISTS_KEY = 'hakim_mylists';

function hakimGetMyLists() {
  try {
    const d = JSON.parse(localStorage.getItem(HAKIM_MYLISTS_KEY) || '{}');
    return { favorites: d.favorites || [], following: d.following || [], later: d.later || [], playlists: d.playlists || [] };
  } catch (e) { return { favorites: [], following: [], later: [], playlists: [] }; }
}
function hakimSaveMyLists(d) { localStorage.setItem(HAKIM_MYLISTS_KEY, JSON.stringify(d)); }

function hakimIsFavorite(id) { return hakimGetMyLists().favorites.includes(id); }
function hakimToggleFavorite(id) {
  const d = hakimGetMyLists();
  const i = d.favorites.indexOf(id);
  if (i === -1) d.favorites.unshift(id); else d.favorites.splice(i, 1);
  hakimSaveMyLists(d);
  return i === -1;
}
function hakimIsFollowing(id) { return hakimGetMyLists().following.includes(id); }
function hakimIsLater(id) { return hakimGetMyLists().later.includes(id); }
function hakimToggleLater(id) {
  const d = hakimGetMyLists();
  const i = d.later.indexOf(id);
  if (i === -1) d.later.unshift(id); else d.later.splice(i, 1);
  hakimSaveMyLists(d);
  return i === -1;
}
function hakimToggleFollowing(id) {
  const d = hakimGetMyLists();
  const i = d.following.indexOf(id);
  if (i === -1) d.following.unshift(id); else d.following.splice(i, 1);
  hakimSaveMyLists(d);
  return i === -1;
}
function hakimCreatePlaylist(name) {
  const d = hakimGetMyLists();
  const pl = { id: 'pl_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, courseIds: [] };
  d.playlists.push(pl);
  hakimSaveMyLists(d);
  return pl.id;
}
function hakimRenamePlaylist(plId, name) {
  const d = hakimGetMyLists();
  const pl = d.playlists.find(p => p.id === plId);
  if (pl && name) { pl.name = name; hakimSaveMyLists(d); }
}
function hakimDeletePlaylist(plId) {
  const d = hakimGetMyLists();
  d.playlists = d.playlists.filter(p => p.id !== plId);
  hakimSaveMyLists(d);
}
function hakimIsInPlaylist(plId, courseId) {
  const pl = hakimGetMyLists().playlists.find(p => p.id === plId);
  return !!(pl && pl.courseIds.includes(courseId));
}
function hakimTogglePlaylistCourse(plId, courseId) {
  const d = hakimGetMyLists();
  const pl = d.playlists.find(p => p.id === plId);
  if (!pl) return false;
  const i = pl.courseIds.indexOf(courseId);
  if (i === -1) pl.courseIds.unshift(courseId); else pl.courseIds.splice(i, 1);
  hakimSaveMyLists(d);
  return i === -1;
}

function hakimToast(msg, type) {
  let el = document.getElementById('hakimToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hakimToast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(el._hakimToastT);
  el._hakimToastT = setTimeout(() => { el.classList.remove('show'); }, 2500);
}

function hakimRenderMyListsDropdown() {
  const host = document.getElementById('myListsDropdown');
  if (!host) return;
  const d = hakimGetMyLists();
  let rows = `
    <a class="mylists-row is-all" href="mylists.html"><span class="name">عرض كل قوائمي</span></a>
    <a class="mylists-row" href="mylists.html?list=favorites"><span class="name">♥ ${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.favoritesLabel) || 'المفضلة')}</span><span class="count">${d.favorites.length}</span></a>
    <a class="mylists-row" href="mylists.html?list=following"><span class="name">◔ ${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.followingLabel) || 'المتابعة')}</span><span class="count">${d.following.length}</span></a>
    <a class="mylists-row" href="mylists.html?list=later"><span class="name">⏱ ${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.laterLabel) || 'المشاهدة لاحقًا')}</span><span class="count">${d.later.length}</span></a>`;
  if (d.playlists.length) {
    rows += `<div class="mylists-divider"></div>` + d.playlists.map(pl =>
      `<a class="mylists-row" href="mylists.html?list=${encodeURIComponent(pl.id)}"><span class="name">▶ ${hakimEscapeHtml(pl.name)}</span><span class="count">${pl.courseIds.length}</span></a>`
    ).join('');
  }
  host.innerHTML = `
    <div class="mylists-rows">${rows}</div>
    <div class="mylists-divider"></div>
    <form class="mylists-new-form" id="myListsNewForm" autocomplete="off">
      <input type="text" id="myListsNewName" placeholder="${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.newPlaylistPlaceholder) || 'اسم قائمة تشغيل جديدة')}" required>
      <button type="submit">+ ${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.createBtn) || 'إنشاء')}</button>
    </form>`;
  const form = document.getElementById('myListsNewForm');
  if (form) form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const input = document.getElementById('myListsNewName');
    const name = input.value.trim();
    if (!name) return;
      if (window.hakimAuthGate && hakimAuthGate('سجّل دخولك عشان تعمل قوائم وتحفظ كورساتك')) return;
        hakimCreatePlaylist(name);
    input.value = '';
    hakimRenderMyListsDropdown();
    hakimToast('تم إنشاء قائمة "' + name + '"', 'success');
  });
}

function hakimInitMyListsMenu() {
  const btn = document.getElementById('myListsBtn');
  const panel = document.getElementById('myListsDropdown');
  if (!btn || !panel) return;
  function open() { const o = document.getElementById('sectionsDropdown'), ob = document.getElementById('sectionsBtn'); if (o && ob) hakimSetDropdownOpen(ob, o, false); hakimRenderMyListsDropdown(); hakimSetDropdownOpen(btn, panel, true); }
  function close() { hakimSetDropdownOpen(btn, panel, false); }
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panel.classList.contains('show')) close(); else open();
  });
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('show') && !panel.contains(e.target) && !btn.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

async function hakimRenderHomeAlertBanner(hostId) {
  const host = document.getElementById(hostId);
  if (!host) return;
  await Promise.all([hakimLoadScript('notifications.js'), hakimLoadScript('polls.js')]);
  const notif = (window.NOTIFICATIONS || []).slice(-1)[0];
  const pollsCount = (window.POLLS || []).length;
  if (!notif && pollsCount === 0) return;
  const parts = [];
  if (notif) parts.push(`📢 ${hakimEscapeHtml(notif.title || '')}`);
  if (pollsCount > 0) parts.push(`📋 فيه ${pollsCount} استطلاع جديد`);
  host.innerHTML = `
    <div class="home-alert-banner">
      <svg viewBox="0 0 24 24"><path d="M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1z"/></svg>
      <span>${parts.join(' — ')}</span>
      <a href="notifications.html">التفاصيل ←</a>
    </div>`;
}

function hakimLazyFade(img) {
  if (img.complete && img.naturalWidth > 0) { img.classList.add('loaded'); return; }
  img.addEventListener('load', () => img.classList.add('loaded'));
  img.addEventListener('error', () => img.classList.add('loaded'));
}

/* ============================================================
   Supabase — تحليلات، تقييمات، شكاوى، اقتراحات (بدون مكتبات خارجية)
   ============================================================ */
function hakimSbConfig() {
  if (window.__HAKIM_PREVIEW) return { url: '', anonKey: '' }; /* معاينة الأدمن: ما نسجّلش مشاهدات ولا تقييمات */
  const s = window.SITE_SETTINGS || {};
  return { url: s.supabaseUrl || '', anonKey: s.supabaseAnonKey || '' };
}
function hakimSbReady() {
  const c = hakimSbConfig();
  return !!(c.url && c.anonKey);
}
async function hakimSbInsert(table, row) {
  const { url, anonKey } = hakimSbConfig();
  if (!url || !anonKey) return false;
  /* لو الزائر مسجّل دخول نبعت توكنه عشان السيرفر يربط الرسالة بحسابه (وتوصله ردود الإدارة هناك) */
  const post = (token) => fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(row)
  });
  try {
    let tok = '';
    try { if (window.HakimAccount && HakimAccount.token) tok = await HakimAccount.token(); } catch (e) {}
    let res = await post(tok || anonKey);
    if (!res.ok && tok && (res.status === 401 || res.status === 403)) res = await post(anonKey);
    return res.ok;
  } catch (e) { return false; }
}

/* ===== مراقبة الصحة من الزوار الحقيقيين: كل مشكلة بتتسجّل مرة واحدة لكل زائر وبتظهر في "صحة الموقع" بالأدمن ===== */
const __hh = { n: 0, seen: new Set() };
function hakimHealth(type, courseId, ep, detail) {
  try {
    if (window.__HAKIM_PREVIEW) return;
    const cid = courseId || window.__HK_CUR_COURSE || null;
    const key = type + '|' + cid + '|' + ep;
    if (__hh.seen.has(key) || __hh.n >= 15) return;
    __hh.seen.add(key); __hh.n++;
    hakimSbInsert('health_events', { session_id: hakimSessionId(), type, course_id: cid, episode_index: ep != null ? ep : null, page: location.pathname.slice(-80), detail: String(detail || '').slice(0, 300), ua: navigator.userAgent.slice(0, 160) });
  } catch (e) {}
}
window.addEventListener('error', (e) => { hakimHealth('js_error', null, null, (e.message || '') + ' @' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || '')); });
window.addEventListener('unhandledrejection', (e) => { hakimHealth('js_error', null, null, 'promise: ' + String((e.reason && e.reason.message) || e.reason || '')); });
async function hakimSbUpsert(table, row, conflictCols) {
  const { url, anonKey } = hakimSbConfig();
  if (!url || !anonKey) return false;
  try {
    const res = await fetch(`${url}/rest/v1/${table}?on_conflict=${conflictCols}`, {
      method: 'POST',
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates,return=minimal', 'x-hakim-session': hakimSessionId() },
      body: JSON.stringify(row)
    });
    return res.ok;
  } catch (e) { return false; }
}
async function hakimSbRpc(fn, params) {
  const { url, anonKey } = hakimSbConfig();
  if (!url || !anonKey) return null;
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {})
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}
async function hakimSbSelect(pathWithQuery) {
  const { url, anonKey } = hakimSbConfig();
  if (!url || !anonKey) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${pathWithQuery}`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

/* حقن كود مخصص (زي سكربت إعلانات Monetag) — بيتفعّل فورًا/يتوقف فورًا
   عبر مفتاح site_config.ads.enabled في Supabase، حتى لو الكود نفسه
   محفوظ بالفعل في site-settings.js (المتحكم السريع هو التفعيل بس) */
function hakimShowMaintenanceIfNeeded() {
  if (window.__HAKIM_PREVIEW) return false;
  const s = window.SITE_SETTINGS || {};
  if (!s.maintenanceMode) return false;
  location.replace('maintenance.html');
  return true;
}

async function hakimInjectCustomCode() {
  const s = window.SITE_SETTINGS || {};
  if (!s.customCode || !hakimSbReady()) return;
  try {
    const rows = await hakimSbSelect('site_config?key=eq.ads&select=value');
    const adsEnabled = !!(rows && rows[0] && rows[0].value && rows[0].value.enabled);
    if (!adsEnabled) return;
  } catch (e) { return; }
  try {
    const holder = document.createElement('div');
    holder.innerHTML = s.customCode;
    Array.from(holder.childNodes).forEach(node => {
      if (node.tagName === 'SCRIPT') {
        const s2 = document.createElement('script');
        Array.from(node.attributes || []).forEach(a => s2.setAttribute(a.name, a.value));
        if (!node.src) s2.textContent = node.textContent;
        document.body.appendChild(s2);
      } else {
        document.body.appendChild(node);
      }
    });
  } catch (e) { /* كود مخصص خاطئ — يتجاهل بصمت عشان ميكسرش باقي الصفحة */ }
}

function hakimSessionId() {
  let sid = localStorage.getItem('hakim_session_id');
  if (!sid) {
    sid = 'sid_' + Date.now().toString(36) + '_' + (function () { try { const a = new Uint32Array(3); crypto.getRandomValues(a); return Array.from(a, (x) => x.toString(36)).join(''); } catch (e) { return Math.random().toString(36).slice(2); } })();
    localStorage.setItem('hakim_session_id', sid);
  }
  return sid;
}

function hakimDetectAdblock() {
  return new Promise((resolve) => {
    const bait = document.createElement('div');
    bait.className = 'ad-banner ads ad-container adsbox';
    bait.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;';
    document.body.appendChild(bait);
    setTimeout(() => {
      const blocked = !bait.offsetParent || bait.offsetHeight === 0 || getComputedStyle(bait).display === 'none';
      bait.remove();
      resolve(blocked);
    }, 100);
  });
}

async function hakimDetectCountry() {
  try {
    const cached = sessionStorage.getItem('hakim_country');
    if (cached) return cached;
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) return '';
    const data = await res.json();
    const country = data.country_name || '';
    sessionStorage.setItem('hakim_country', country);
    return country;
  } catch (e) { return ''; }
}

function hakimVisitMeta() {
  let m = null; try { m = JSON.parse(sessionStorage.getItem('hakim_visit_meta')); } catch (e) {}
  if (m) return m;
  const ua = navigator.userAgent || '';
  const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  let host = ''; try { host = new URL(document.referrer).hostname.replace(/^www\./, ''); } catch (e) {}
  let source = 'direct';
  if (standalone) source = 'pwa';
  else if (host && host !== location.hostname) source = /google\./.test(host) ? 'google' : (/bing\.|yahoo\.|duckduckgo|yandex|baidu|ecosia/.test(host) ? 'search' : (/facebook|fb\.|instagram|twitter|t\.co|x\.com|tiktok|youtube|youtu\.be|telegram|t\.me|whatsapp|snapchat|reddit|pinterest/.test(host) ? 'social' : 'referral'));
  const device = (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) ? 'tablet' : (/Mobi|Android|iPhone|iPod/i.test(ua) ? 'mobile' : 'desktop');
  const os = /Android/i.test(ua) ? 'android' : (/iPhone|iPad|iPod/i.test(ua) ? 'ios' : (/Windows/i.test(ua) ? 'windows' : (/Mac OS/i.test(ua) ? 'mac' : (/Linux|CrOS/i.test(ua) ? 'linux' : 'other'))));
  m = { source, device, os, lang: String(navigator.language || '').slice(0, 20) };
  try { sessionStorage.setItem('hakim_visit_meta', JSON.stringify(m)); } catch (e) {}
  return m;
}
function hakimVisitorId() {
  try { let v = localStorage.getItem('hakim_vid'); if (!v) { v = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); localStorage.setItem('hakim_vid', v); } return v; } catch (e) { return null; }
}
async function hakimTrackPageView(page, courseId, episodeIndex, section) {
  if (!hakimSbReady()) return;
  const [country, isAdblock] = await Promise.all([hakimDetectCountry(), hakimDetectAdblock()]);
  const row = { session_id: hakimSessionId(), page, course_id: courseId || null, episode_index: episodeIndex != null ? episodeIndex : null, country, is_adblock: isAdblock };
  const m = hakimVisitMeta();
  const ext1 = { source: m.source, device: m.device, os: m.os, lang: m.lang, section: section ? String(section).slice(0, 60) : null };
  const ext2 = Object.assign({ visitor_id: hakimVisitorId() }, ext1);
  /* 3 مستويات: الكامل (hakim-database.sql) ← الإضافي (hakim-database.sql) ← الأساسي. لو العمود مش موجود بينزل مستوى ويفتكره للجلسة */
  let tier = 2; try { const s = sessionStorage.getItem('hakim_pv_tier'); if (s !== null) tier = parseInt(s, 10); } catch (e) {}
  while (tier >= 0) {
    const body = tier === 2 ? Object.assign({}, row, ext2) : (tier === 1 ? Object.assign({}, row, ext1) : row);
    if (await hakimSbInsert('page_views', body)) return;
    tier--; try { sessionStorage.setItem('hakim_pv_tier', String(tier)); } catch (e) {}
  }
}

/* ============================================================
   HakimPlayer — مشغّل فيديو مخصص وقابل لإعادة الاستخدام
   ============================================================ */
const HakimPlayer = (() => {

  /* اكتشاف نوع المصدر وطريقة التشغيل — المنطق في media-utils.js (مشترك مع لوحة الأدمن) */
  function detectSource(url, forced) {
    if (window.HakimMedia) return window.HakimMedia.detect(url, forced);
    return { sourceType: 'embed', playbackStrategy: 'iframe', confidence: 'low', src: String(url || '') };
  }
  let activeEngine = null; /* hls.js شغّال حاليًا — يتفرّغ عند تغيير الحلقة */
  function destroyEngine() {
    if (activeEngine) { try { activeEngine.destroy(); } catch (e) {} activeEngine = null; }
  }
  async function attachEngine(kind, video, src, onFatal) {
    if (kind !== 'hls') return;
    /* hls.js أولًا: بيشتغل على أي متصفح فيه MSE حتى لو المتصفح بيقول إنه بيدعم HLS بنفسه (دعمه الأصلي محدود في كروم/إيدج).
       المشغّل الأصلي للمتصفح بنستخدمه بس لو hls.js مش مدعوم (آيفون وآيباد) */
    const loaded = await hakimLoadScript('vendor/hls.min.js');
    if (loaded && window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls(); activeEngine = hls;
      let recovered = false;
      hls.on(window.Hls.Events.ERROR, (ev, d) => {
        if (!d || !d.fatal) return;
        if (d.type === window.Hls.ErrorTypes.MEDIA_ERROR && !recovered) { recovered = true; hls.recoverMediaError(); return; }
        onFatal('failed');
      });
      hls.loadSource(src); hls.attachMedia(video);
      return;
    }
    if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = src; return; }
    onFatal('unsupported');
  }

  function formatTime(sec) {
    if (!isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = Math.floor(sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function svgIcon(path, extra) {
    return `<svg viewBox="0 0 24 24" ${extra || ''}><path d="${path}"/></svg>`;
  }

  const ICONS = {
    play: 'M8 5v14l11-7z',
    pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
    back10: 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
    fwd10: 'M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z',
    fullscreen: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
    volUp: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
    volMute: 'M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.94 8.94 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
    warn: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'
  };

  function mount(container, { src, type, storageKey, onEnded, onStarted, onWatched, onState, onProgress, onHealth, meta, antiPopup, apLevel, onApOff, apMax, autoFs }) {
    const health = (t, d) => { try { if (typeof onHealth === 'function') onHealth(t, d); } catch (e) {} };
    container.innerHTML = '';
    destroyEngine();
    const source = detectSource(src, type);
    src = source.src;
    const nativeSrc = source.playbackStrategy === 'native';
    /* تقرير حالة التشغيل (بيستخدمه "معاين المشغل" في الأدمن) */
    const emit = (state, extra) => { try { if (typeof onState === 'function') onState(Object.assign({ state, strategy: source.playbackStrategy, sourceType: source.sourceType, src }, extra || {})); } catch (e) {} };

    if (source.playbackStrategy === 'iframe') {
      const wrap = document.createElement('div');
      wrap.className = 'hp-video-wrap';
      /* مزيل الإعلانات (anti-popup.js): لو الأدمن فعّله لهذه الحلقة، الـ iframe بيتحط له sandbox من البداية فيتمنع فتح نوافذ الإعلانات */
      const apSb = apMax ? 'allow-scripts allow-same-origin' : (antiPopup && window.HakimMedia && HakimMedia.apSandbox ? HakimMedia.apSandbox(typeof apLevel === 'number' ? apLevel : 30) : '');
      const sandboxAttr = apSb ? ' sandbox="' + apSb + '"' : '';
      wrap.innerHTML = `<iframe src="${String(src).replace(/"/g, '&quot;')}"${sandboxAttr}${apMax ? ' referrerpolicy="no-referrer"' : ''} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen webkitallowfullscreen mozallowfullscreen></iframe>`;
      emit('embed', { sandbox: apSb });
      container.appendChild(wrap);
      { const fr = wrap.querySelector('iframe'); let loaded = false; fr.addEventListener('load', () => { loaded = true; }); setTimeout(() => { if (!loaded) { health('embed_no_load', String(src).slice(0, 120)); emit('error', { reason: 'embed_no_load' }); } }, 15000); }
      if (autoFs) {
        let fsDone = false; const frm = wrap.querySelector('iframe');
        const trigger = () => { if (fsDone || document.activeElement !== frm) return; fsDone = true; setTimeout(() => { try { if (!(document.fullscreenElement || document.webkitFullscreenElement)) { const rq = wrap.requestFullscreen || wrap.webkitRequestFullscreen; if (rq) rq.call(wrap); } } catch (e) {} }, 2000); };
        window.addEventListener('blur', () => setTimeout(trigger, 0));
      }
      /* لو الحماية شغّالة بـsandbox والمشغّل الخارجي مش بيشتغل، الزائر يقدر يجرّب بدونها بضغطة */
      if (apSb && typeof onApOff === 'function') {
        const help = document.createElement('div'); help.style.cssText = 'text-align:center;margin-top:8px';
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-secondary'; b.style.cssText = 'font-size:.78rem;min-height:36px;padding:0 14px';
        b.textContent = 'الفيديو مش شغّال؟ جرّب بدون حماية الإعلانات'; b.addEventListener('click', () => onApOff());
        help.appendChild(b); container.appendChild(help);
      }
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'hp-video-wrap';
    wrap.innerHTML = `
      <video playsinline preload="metadata"${nativeSrc ? ` src="${String(src).replace(/"/g, '&quot;')}"` : ''}></video>
      <div class="hp-loading" data-role="loading"><div class="hp-spinner"></div></div>
      <div class="hp-error" data-role="error">
        ${svgIcon(ICONS.warn)}
        <strong data-role="errTitle">تعذّر تحميل الفيديو</strong>
        <p data-role="errMsg">تحقق من الاتصال أو من صحة الرابط.</p>
      </div>
      <div class="hp-center-play" data-role="centerPlay" role="button" tabindex="0" aria-label="تشغيل الفيديو">
        ${svgIcon(ICONS.play)}
      </div>
      <div class="hp-bottom" data-role="bottomBar">
        <div class="hp-progress-row">
          <span class="hp-time" data-role="time">00:00 / 00:00</span>
          <div class="hp-progress-wrap">
            <span class="hp-hover-preview" data-role="hoverPreview">00:00</span>
            <input type="range" class="hp-progress-bar" data-role="progress" value="0" min="0" max="100" step="0.1" aria-label="شريط تقدم الفيديو">
          </div>
        </div>
        <div class="hp-controls">
          <button class="hp-btn" data-role="back" title="تأخير 10 ثواني" aria-label="تأخير 10 ثواني">${svgIcon(ICONS.back10)}10</button>
          <button class="hp-btn play-pause" data-role="playPause" title="تشغيل / إيقاف" aria-label="تشغيل أو إيقاف">
            <span data-role="playIcon">${svgIcon(ICONS.play)}</span>
            <span data-role="pauseIcon" style="display:none">${svgIcon(ICONS.pause)}</span>
          </button>
          <button class="hp-btn" data-role="forward" title="تقديم 10 ثواني" aria-label="تقديم 10 ثواني">10${svgIcon(ICONS.fwd10)}</button>
          <div class="hp-volume-wrap">
            <button class="hp-btn" data-role="mute" style="padding:6px" title="كتم/إلغاء كتم الصوت" aria-label="كتم أو إلغاء كتم الصوت">
              <span data-role="volIcon">${svgIcon(ICONS.volUp)}</span>
              <span data-role="muteIcon" style="display:none">${svgIcon(ICONS.volMute)}</span>
            </button>
            <input type="range" class="hp-volume-bar" data-role="volume" min="0" max="1" step="0.01" value="1" aria-label="مستوى الصوت">
          </div>
          <select class="hp-speed" data-role="speed" title="سرعة التشغيل" aria-label="سرعة التشغيل">
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1" selected>1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
          <button class="hp-btn" data-role="fullscreen" title="ملء الشاشة" aria-label="ملء الشاشة">${svgIcon(ICONS.fullscreen)}</button>
        </div>
      </div>
    `;
    container.appendChild(wrap);

    const video = wrap.querySelector('video');
    const q = (role) => wrap.querySelector(`[data-role="${role}"]`);
    const loading = q('loading'), errorBox = q('error'), centerPlay = q('centerPlay'),
          timeLabel = q('time'), progress = q('progress'),
          hoverPreview = q('hoverPreview'), playPauseBtn = q('playPause'),
          playIcon = q('playIcon'), pauseIcon = q('pauseIcon'), backBtn = q('back'),
          forwardBtn = q('forward'), muteBtn = q('mute'), volIcon = q('volIcon'),
          muteIcon = q('muteIcon'), volumeBar = q('volume'), speedSelect = q('speed'),
          fullscreenBtn = q('fullscreen');

    /* تفضيلات المشغّل (الصوت/الكتم/السرعة) تفضل ثابتة من حلقة للتانية */
    const PREF_KEY = 'hakim_player_prefs';
    const readPrefs = () => { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch (e) { return {}; } };
    const writePrefs = (patch) => { try { localStorage.setItem(PREF_KEY, JSON.stringify(Object.assign(readPrefs(), patch))); } catch (e) {} };
    {
      const p = readPrefs();
      if (typeof p.volume === 'number' && p.volume >= 0 && p.volume <= 1) { video.volume = p.volume; volumeBar.value = p.volume; }
      if (p.muted) video.muted = true;
      if (p.speed && [0.5, 0.75, 1, 1.25, 1.5, 2].includes(p.speed)) { video.playbackRate = p.speed; speedSelect.value = String(p.speed); }
    }
    video.addEventListener('volumechange', () => writePrefs({ volume: video.volume, muted: video.muted }));

    function pulse(btn) { btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse'); }
    function showSeekHint(delta) {
      let h = wrap.querySelector('.hp-seek-hint'); if (h) h.remove();
      h = document.createElement('div'); h.className = 'hp-seek-hint ' + (delta < 0 ? 'back' : 'fwd');
      h.textContent = (delta < 0 ? '−' : '+') + Math.abs(delta) + ' ث'; wrap.appendChild(h);
      setTimeout(() => h.remove(), 700);
    }
    function togglePlay() { video.paused ? video.play() : video.pause(); }
    function updateCenterPlay() { centerPlay.classList.toggle('show', video.paused); }

    video.addEventListener('play', () => { playIcon.style.display = 'none'; pauseIcon.style.display = 'block'; updateCenterPlay(); });
    video.addEventListener('pause', () => { playIcon.style.display = 'block'; pauseIcon.style.display = 'none'; updateCenterPlay(); });
    video.addEventListener('ended', () => {
      if (storageKey) { try { localStorage.removeItem(storageKey); } catch (e) {} }
      if (!watchedFired) { watchedFired = true; if (typeof onWatched === 'function') onWatched(); }
      if (typeof onEnded === 'function') onEnded();
    });
    playPauseBtn.addEventListener('click', () => { pulse(playPauseBtn); togglePlay(); });
    /* لمس مزدوج على الموبايل = ±10 ثانية، ونقر مزدوج بالماوس = ملء الشاشة */
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    let tapTimer = null, lastTapAt = 0;
    /* الضغط على أي مكان فاضي في المشغّل (حتى فوق شريط التحكم الشفاف) = تشغيل/إيقاف، مع تجاهل الأزرار نفسها */
    const IGNORE_TAP = 'button, input, select, a, [data-role="centerPlay"], [data-role="error"]';
    wrap.addEventListener('click', (e) => {
      if (e.target.closest(IGNORE_TAP)) return;
      if (!coarse) { togglePlay(); return; }
      const now = Date.now();
      if (now - lastTapAt < 320) {
        clearTimeout(tapTimer); lastTapAt = 0;
        const rect = video.getBoundingClientRect();
        const delta = (e.clientX - rect.left) < rect.width / 2 ? -10 : 10;
        video.currentTime = Math.max(0, Math.min(video.duration || Infinity, video.currentTime + delta));
        showSeekHint(delta); return;
      }
      lastTapAt = now;
      tapTimer = setTimeout(togglePlay, 300);
    });
    wrap.addEventListener('dblclick', (e) => { if (!coarse && !e.target.closest(IGNORE_TAP)) toggleFullscreen(); });
    centerPlay.addEventListener('click', togglePlay);
    centerPlay.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlay(); } });

    backBtn.addEventListener('click', () => { pulse(backBtn); video.currentTime = Math.max(0, video.currentTime - 10); });
    forwardBtn.addEventListener('click', () => { pulse(forwardBtn); video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10); });

    speedSelect.addEventListener('change', () => { video.playbackRate = parseFloat(speedSelect.value); writePrefs({ speed: video.playbackRate }); });

    function toggleFullscreen() {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      const req = wrap.requestFullscreen || wrap.webkitRequestFullscreen;
      if (req) {
        const r = req.call(wrap);
        /* على الموبايل: لما تدخل ملء الشاشة يقلب أفقي تلقائيًا */
        Promise.resolve(r).then(() => { try { if (coarse && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }).catch(() => {});
      } else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    }
    const onFsChange = () => { if (!(document.fullscreenElement || document.webkitFullscreenElement)) { try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {} } };
    document.addEventListener('fullscreenchange', onFsChange);
    fullscreenBtn.addEventListener('click', () => { pulse(fullscreenBtn); toggleFullscreen(); });

    function updateVolumeIcon() {
      const muted = video.muted || video.volume === 0;
      volIcon.style.display = muted ? 'none' : 'block';
      muteIcon.style.display = muted ? 'block' : 'none';
    }
    muteBtn.addEventListener('click', () => {
      pulse(muteBtn);
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) { video.volume = 0.5; volumeBar.value = 0.5; }
      updateVolumeIcon();
    });
    volumeBar.addEventListener('input', () => {
      video.volume = parseFloat(volumeBar.value);
      video.muted = video.volume === 0;
      updateVolumeIcon();
    });

    /* حفظ التقدّم كل 3 ثواني (بدل 4 مرات في الثانية) وعند الإيقاف أو مغادرة الصفحة */
    let lastSaveAt = 0, watchedFired = false, startedFired = false;
    function saveProgress(force) {
      if (!storageKey || isNaN(video.duration) || video.ended) return;
      const now = Date.now(); if (!force && now - lastSaveAt < 3000) return; lastSaveAt = now;
      try { localStorage.setItem(storageKey, video.currentTime); } catch (e) {}
      if (typeof onProgress === 'function') onProgress(video.currentTime, video.duration);
    }
    video.addEventListener('pause', () => saveProgress(true));
    let hpStartT = null, hpWaitT = null;
    video.addEventListener('play', () => { clearTimeout(hpStartT); hpStartT = setTimeout(() => { if (!startedFired) health('video_no_start', String(src).slice(0, 120)); }, 15000); });
    video.addEventListener('waiting', () => { clearTimeout(hpWaitT); hpWaitT = setTimeout(() => health('video_stall', 'توقف > 12 ثانية عند ' + Math.round(video.currentTime || 0) + 'ث'), 12000); });
    video.addEventListener('playing', () => { clearTimeout(hpStartT); clearTimeout(hpWaitT); });
    video.addEventListener('pause', () => clearTimeout(hpWaitT));
    video.addEventListener('playing', () => { if (!startedFired) { startedFired = true; emit('playing'); if (typeof onStarted === 'function') onStarted();
      if (autoFs) setTimeout(() => { try { if (!(document.fullscreenElement || document.webkitFullscreenElement) && !video.paused) toggleFullscreen(); } catch (e) {} }, 2000); } });
    const onPageHide = () => saveProgress(true);
    window.addEventListener('pagehide', onPageHide);
    video.addEventListener('timeupdate', () => {
      if (!isNaN(video.duration)) {
        progress.value = (video.currentTime / video.duration) * 100;
        if (!video.paused) saveProgress(false);
        if (!watchedFired && video.duration > 0 && video.currentTime / video.duration >= 0.9) { watchedFired = true; if (typeof onWatched === 'function') onWatched(); }
      }
      timeLabel.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
    });

    video.addEventListener('loadedmetadata', () => {
      timeLabel.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
      if (storageKey) {
        let saved = 0; try { saved = parseFloat(localStorage.getItem(storageKey)); } catch (e) {}
        if (saved && saved > 1 && saved < video.duration - 2) video.currentTime = saved;
      }
    });

    progress.addEventListener('input', () => {
      if (!isNaN(video.duration)) video.currentTime = (progress.value / 100) * video.duration;
    });
    progress.addEventListener('mousemove', (e) => {
      if (isNaN(video.duration)) return;
      const rect = progress.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      hoverPreview.textContent = formatTime(ratio * video.duration);
      hoverPreview.style.right = `${ratio * 100}%`;
      hoverPreview.classList.add('show');
    });
    progress.addEventListener('mouseleave', () => hoverPreview.classList.remove('show'));

    video.addEventListener('waiting', () => loading.classList.add('show'));
    video.addEventListener('canplay', () => loading.classList.remove('show'));
    video.addEventListener('playing', () => loading.classList.remove('show'));
    video.addEventListener('loadeddata', () => loading.classList.remove('show'));
    function showPlaybackError(reason) {
      loading.classList.remove('show');
      health('video_error', String(reason || '') + ' | ' + String(src).slice(0, 120)); emit('error', { reason: reason === 'unsupported' ? 'صيغة غير مدعومة في المتصفح' : (reason === 'failed' ? 'فشل تحميل البث (تأكد من الروابط وCORS)' : (video.error ? 'خطأ في تحميل الفيديو (كود ' + video.error.code + ')' : 'تعذّر تحميل الفيديو')) });
      const t = q('errTitle'), m = q('errMsg');
      if (reason === 'unsupported' || (source.sourceType === 'mkv' || source.sourceType === 'ts') && reason === 'native') {
        const fmt = { mkv: 'MKV', ts: 'TS', hls: 'M3U8' }[source.sourceType] || 'هذه الصيغة';
        t.textContent = 'المتصفح مش قادر يشغّل هذا الفيديو';
        m.textContent = `صيغة ${fmt} مش مدعومة في متصفحك. جرّب متصفح تاني (Chrome أو Edge) أو بلّغ عن المشكلة.`;
      }
      errorBox.style.display = 'flex';
    }
    video.addEventListener('error', () => showPlaybackError('native'));
    emit('loading');
    if (source.playbackStrategy === 'hls') {
      loading.classList.add('show');
      attachEngine(source.playbackStrategy, video, src, showPlaybackError);
    }

    let hideTimer = null;
    function showControls() {
      wrap.classList.remove('controls-hidden');
      clearTimeout(hideTimer);
      if (!video.paused) hideTimer = setTimeout(() => wrap.classList.add('controls-hidden'), 2500);
    }
    ['mousemove', 'touchstart', 'click'].forEach(evt => wrap.addEventListener(evt, showControls));
    video.addEventListener('play', showControls);
    video.addEventListener('pause', () => { clearTimeout(hideTimer); wrap.classList.remove('controls-hidden'); });

    function playerVisible() {
      const r = wrap.getBoundingClientRect(), vh = window.innerHeight || document.documentElement.clientHeight;
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      return r.height > 0 && visible / r.height > 0.3;
    }
    function keyHandler(e) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const el = document.activeElement, tag = el ? el.tagName : '';
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A' || (el && el.isContentEditable)) return;
      if (!playerVisible()) return;
      /* e.code مستقل عن لغة الكيبورد، فالاختصارات تشتغل مع العربي كمان */
      if (e.code === 'Space' || e.code === 'KeyK') { e.preventDefault(); pulse(playPauseBtn); togglePlay(); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10); pulse(forwardBtn); showSeekHint(10); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 10); pulse(backBtn); showSeekHint(-10); }
      else if (e.code === 'ArrowUp') { e.preventDefault(); video.muted = false; video.volume = Math.min(1, video.volume + 0.1); volumeBar.value = video.volume; updateVolumeIcon(); }
      else if (e.code === 'ArrowDown') { e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); volumeBar.value = video.volume; updateVolumeIcon(); }
      else if (e.code === 'KeyF') { pulse(fullscreenBtn); toggleFullscreen(); }
      else if (e.code === 'KeyM') { pulse(muteBtn); video.muted = !video.muted; updateVolumeIcon(); }
      else if (/^(Digit|Numpad)[0-9]$/.test(e.code) && !isNaN(video.duration)) { video.currentTime = video.duration * (parseInt(e.code.slice(-1), 10) / 10); }
    }
    document.addEventListener('keydown', keyHandler);
    wrap._hakimCleanup = () => {
      document.removeEventListener('keydown', keyHandler);
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('pagehide', onPageHide);
      saveProgress(true);
    };

    /* نافذة عائمة (Picture-in-Picture) */
    if (document.pictureInPictureEnabled) {
      const pip = document.createElement('button');
      pip.className = 'hp-btn'; pip.dataset.role = 'pip'; pip.title = 'نافذة عائمة'; pip.setAttribute('aria-label', 'نافذة عائمة');
      pip.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>';
      fullscreenBtn.parentNode.insertBefore(pip, fullscreenBtn);
      pip.addEventListener('click', async () => { try { if (document.pictureInPictureElement) await document.exitPictureInPicture(); else await video.requestPictureInPicture(); } catch (e) {} });
    }

    /* أزرار قفل الشاشة / الإشعارات (Media Session) */
    if ('mediaSession' in navigator) {
      try {
        const ms = navigator.mediaSession;
        ms.metadata = meta ? new MediaMetadata({ title: meta.title || '', artist: meta.artist || '', album: meta.artist || '', artwork: meta.artwork ? [{ src: new URL(meta.artwork, location.href).href }] : [] }) : null;
        ms.setActionHandler('play', () => video.play());
        ms.setActionHandler('pause', () => video.pause());
        ms.setActionHandler('seekbackward', () => { video.currentTime = Math.max(0, video.currentTime - 10); });
        ms.setActionHandler('seekforward', () => { video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10); });
        ms.setActionHandler('previoustrack', meta && meta.onPrev ? meta.onPrev : null);
        ms.setActionHandler('nexttrack', meta && meta.onNext ? meta.onNext : null);
      } catch (e) {}
    }

    updateCenterPlay();
    updateVolumeIcon();
  }

  function unmount(container) {
    destroyEngine();
    const wrap = container.querySelector('.hp-video-wrap');
    if (wrap && wrap._hakimCleanup) wrap._hakimCleanup();
    container.innerHTML = '';
  }

  return { mount, unmount, detectSource };
})();

/* ============================================================
   course.js — صفحة الكورس المستقلة
   ============================================================ */

(function () {
  const params = new URLSearchParams(location.search);
  const pageId = window.__COURSE_ID || params.get('id') || params.get('c');
  /* id = الموسم المعروض/المشغَّل حاليًا (بيتغيّر لما الزائر يختار موسم تاني من نفس الصفحة).
     pageId = كورس الصفحة نفسها (الغلاف والمعلومات والتقييم والمفضلة). */
  let id = pageId;

  const banner = document.getElementById('banner');
  const infoSection = document.getElementById('infoSection');
  const playerHost = document.getElementById('playerHost');
  const nowPlaying = document.getElementById('nowPlaying');
  const videoStatsRow = document.getElementById('videoStatsRow');
  const playerNav = document.getElementById('playerNav');
  const pageNumbers = document.getElementById('pageNumbers');
  const lessonListEl = document.getElementById('lessonList');
  const pageBody = document.getElementById('pageBody');
  const errorBox = document.getElementById('courseError');

  const PAGE_SIZE = 48;
  let currentVideos = [];
  let courseMeta = { name: '', img: '', playback: {} };
  /* ترتيب عرض الحلقات: الأقدم أولًا (افتراضي) أو الأحدث أولًا — يتحفظ عند الزائر */
  let orderDesc = (() => { try { return localStorage.getItem('hakim_ep_order') === 'desc'; } catch (e) { return false; } })();
  const watchedKey = () => `hakim_watched_${id}`;
  function getWatched() { try { return new Set(JSON.parse(localStorage.getItem(watchedKey())) || []); } catch (e) { return new Set(); } }
  function episodeNumber(i) {
    const v = currentVideos[i] || {}, m = String(v.title || '').match(/(\d+)\s*$/);
    return Number.isFinite(parseInt(v.num, 10)) ? parseInt(v.num, 10) : (m ? parseInt(m[1], 10) : i + 1);
  }
  /* ===== لمسات سلوكية (نصوصها كلها قابلة للتعديل من محرر النصوص) ===== */
  function hakimTx(k, d, v) { var t = (window.SITE_TEXT && window.SITE_TEXT[k]) || d; if (v) { for (var x in v) { t = t.split('{' + x + '}').join(v[x]); } } return t; }
  function behStyle() {
    if (document.getElementById('hkBehStyle')) return;
    const s = document.createElement('style'); s.id = 'hkBehStyle';
    s.textContent = '.hk-beh-ov{position:fixed;inset:0;z-index:130;background:rgba(0,0,0,.66);display:flex;align-items:center;justify-content:center;padding:16px}' +
      '.hk-beh-box{width:100%;max-width:400px;background:var(--surface,#121214);border:1px solid var(--line,#26262a);border-radius:18px;padding:20px 16px;text-align:center;animation:hk-pop .25s ease}' +
      '@keyframes hk-pop{from{transform:scale(.94);opacity:0}to{transform:none;opacity:1}}' +
      '.hk-beh-box h3{margin:0 0 6px;font-size:1.15rem}.hk-beh-box p{margin:0 0 12px;color:var(--text-muted,#9a9aa2);font-size:.85rem}' +
      '.hk-beh-list{display:grid;gap:8px;margin:10px 0}.hk-beh-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:12px;border:1px solid var(--line,#26262a);background:var(--surface-2,#1c1c1e);color:inherit;text-decoration:none;font-weight:800;font-size:.9rem;text-align:right}' +
      '.hk-beh-item span{color:var(--red,#e5202c);white-space:nowrap}.hk-beh-x{margin-top:6px;background:none;border:0;color:var(--text-muted,#9a9aa2);font:inherit;cursor:pointer;padding:8px}' +
      '.hk-rate-sheet{position:fixed;left:0;right:0;bottom:0;z-index:125;display:flex;justify-content:center;padding:0 12px calc(12px + env(safe-area-inset-bottom))}' +
      '.hk-rate-box{width:100%;max-width:420px;background:var(--surface,#121214);border:1px solid var(--red,#e5202c);border-radius:16px;padding:14px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.5);animation:hk-pop .25s ease}' +
      '.hk-rate-box b{display:block;margin-bottom:2px}.hk-rate-box small{display:block;color:var(--text-muted,#9a9aa2);margin-bottom:8px}' +
      '.hk-rate-stars{display:flex;justify-content:center;gap:6px;direction:ltr}.hk-rate-stars button{background:none;border:0;font-size:1.9rem;cursor:pointer;line-height:1;filter:grayscale(1);opacity:.55;transition:transform .12s}.hk-rate-stars button:hover,.hk-rate-stars button:focus-visible{filter:none;opacity:1;transform:scale(1.15)}' +
      '@media (prefers-reduced-motion:reduce){.hk-beh-box,.hk-rate-box{animation:none}}';
    document.head.appendChild(s);
  }
  /* بعد 3 حلقات متشافة: نطلب تقييم الكورس مرة واحدة (وقتها بيكون استفاد فعلًا) */
  function hakimAskRating() {
    try {
      const asked = 'hakim_rate_asked_' + pageId;
      if (localStorage.getItem(asked) || parseInt(localStorage.getItem(courseRatingKey) || '0', 10) > 0) return;
      localStorage.setItem(asked, '1');
    } catch (e) { return; }
    behStyle();
    setTimeout(function () {
      if (document.getElementById('hkRateSheet')) return;
      const d = document.createElement('div'); d.id = 'hkRateSheet'; d.className = 'hk-rate-sheet';
      d.innerHTML = '<div class="hk-rate-box" role="dialog" aria-label="تقييم"><b>' + hakimEscapeHtml(hakimTx('rateAskTitle', 'استفدت من الكورس لحد دلوقتي؟')) + '</b><small>' + hakimEscapeHtml(hakimTx('rateAskSub', 'قيّمه في ثانية — رأيك بيساعد غيرك يختار صح')) + '</small>' +
        '<div class="hk-rate-stars">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-n="' + n + '" aria-label="' + n + ' نجوم">⭐</button>'; }).join('') + '</div><button type="button" class="hk-beh-x">مش دلوقتي</button></div>';
      document.body.appendChild(d);
      d.querySelector('.hk-beh-x').addEventListener('click', function () { d.remove(); });
      d.querySelectorAll('.hk-rate-stars button').forEach(function (b) {
        b.addEventListener('click', async function () {
          const stars = parseInt(b.dataset.n, 10); d.remove();
          try { localStorage.setItem(courseRatingKey, String(stars)); await hakimSbUpsert('course_ratings', { session_id: hakimSessionId(), course_id: pageId, rating: stars }, 'session_id,course_id'); } catch (e) {}
          if (typeof hakimToast === 'function') hakimToast(hakimTx('rateThanks', 'شكرًا لتقييمك 🙏'), 'success');
          try { renderCourseRatingWidget(); } catch (e) {}
        });
      });
      setTimeout(function () { if (d.parentNode) d.remove(); }, 20000);
    }, 2500);
  }
  /* لما يخلّص كل حلقات الكورس: تهنئة + اقتراح كورسات من نفس القسم (بترتيب التوصيات) */
  async function hakimCelebrate() {
    try { if (localStorage.getItem('hakim_done_' + id)) return; localStorage.setItem('hakim_done_' + id, '1'); } catch (e) { return; }
    behStyle();
    let picks = [];
    try {
      if (!window.COURSES_INDEX) await hakimLoadScript('courses-index.js');
      if (!window.HakimReco) await hakimLoadScript('reco-engine.js');
      const idx = window.COURSES_INDEX || {}, cur = idx[pageId] || {};
      const same = (e) => (e.menuSection || '') === (cur.menuSection || '') || (e.extraSections || []).indexOf(cur.menuSection || 'home') > -1 || (cur.extraSections || []).indexOf(e.menuSection || 'home') > -1;
      const items = Object.keys(idx).filter(k => k !== pageId && k !== id && !(idx[k].seasonNumber > 1) && same(idx[k]) && !(typeof hakimVisibleNow === 'function' && !hakimVisibleNow(idx[k])) && !localStorage.getItem('hakim_done_' + k)).map(k => ({ id: k, data: idx[k] }));
      picks = window.HakimReco && items.length ? HakimReco.topFor(items, {}, 3) : items.slice(0, 3);
    } catch (e) {}
    setTimeout(function () {
      if (document.getElementById('hkDoneOv')) return;
      const o = document.createElement('div'); o.id = 'hkDoneOv'; o.className = 'hk-beh-ov';
      o.innerHTML = '<div class="hk-beh-box" role="dialog" aria-label="مبروك"><h3>' + hakimEscapeHtml(hakimTx('completeTitle', '🎉 مبروك! خلّصت «{name}»', { name: courseMeta.name || '' })) + '</h3><p>' + hakimEscapeHtml(hakimTx('completeSub', 'إنجاز حلو 👏 كمّل رحلتك مع كورس تاني من اللي مناسبين ليك:')) + '</p>' +
        (picks.length ? '<div class="hk-beh-list">' + picks.map(function (p) { return '<a class="hk-beh-item" href="' + hakimEscapeHtml(hakimCourseHref(p.id)) + '"><b>' + hakimEscapeHtml(p.data.name || p.id) + '</b><span>ابدأ ◀</span></a>'; }).join('') + '</div>' : '') +
        '<button type="button" class="hk-beh-x">' + hakimEscapeHtml(hakimTx('completeClose', 'تمام')) + '</button></div>';
      document.body.appendChild(o);
      o.addEventListener('click', function (e) { if (e.target === o || e.target.classList.contains('hk-beh-x')) o.remove(); });
    }, 1200);
  }
  function markWatched(i) {
    const s = getWatched(); if (s.has(i)) return; s.add(i);
    try { localStorage.setItem(watchedKey(), JSON.stringify([...s])); } catch (e) {}
    const t = lessonListEl && lessonListEl.querySelector(`.ep-tile[data-index="${i}"]`); if (t) t.classList.add('watched');
    try {
      const n = s.size, total = currentVideos.length;
      if (total >= 2 && n >= total) hakimCelebrate();
      else if (n === 3) hakimAskRating();
    } catch (e) {}
  }
  /* سجل المشاهدة للرئيسية (صف كمّل المشاهدة): آخر حلقة + نسبة التقدّم. لو الحلقة خلصت بننقل المؤشر للحلقة اللي بعدها */
  function saveHistory(i, t, d) {
    try {
      const pct = d > 0 ? Math.min(1, t / d) : 0;
      let h = JSON.parse(localStorage.getItem('hakim_watch_history')); if (!Array.isArray(h)) h = [];
      const old = h.find(x => x.id === id);
      h = h.filter(x => x.id !== id);
      if (pct >= 0.9) {
        if (i >= currentVideos.length - 1) { localStorage.setItem('hakim_watch_history', JSON.stringify(h)); return; }
        h.unshift({ id, index: i + 1, num: episodeNumber(i + 1), pct: 0, ts: Date.now() });
      } else h.unshift({ id, index: i, num: episodeNumber(i), pct: (!pct && old && old.index === i) ? old.pct : pct, ts: Date.now() });
      localStorage.setItem('hakim_watch_history', JSON.stringify(h.slice(0, 30)));
    } catch (e) {}
  }
  function saveLastWatch(i) {
    try { if (window.HakimEngage) HakimEngage.touch(); else hakimLoadScript('engage.js').then(() => { if (window.HakimEngage) HakimEngage.touch(); }); } catch (e) {}
    try { localStorage.setItem('hakim_last_watch', JSON.stringify({ id, index: i, num: episodeNumber(i), ts: Date.now() })); } catch (e) {}
    try { const m = JSON.parse(localStorage.getItem('hakim_last_eps') || '{}'); m[id] = { index: i, ts: Date.now() }; const keys = Object.keys(m); if (keys.length > 200) { keys.sort((x, y) => m[x].ts - m[y].ts).slice(0, keys.length - 200).forEach(k => delete m[k]); } localStorage.setItem('hakim_last_eps', JSON.stringify(m)); } catch (e) {}
  }
  function syncEpisodeUrl(i, push) {
    try {
      const u = new URL(location.href);
      /* الهيكل الجديد: صفحة الحلقة الحقيقية (/course/<العمل>/s1/ep5.html) بدل ?ep= لما تكون صفحات الحلقات مفعّلة */
      if (window.__COURSE_ID && (window.__EP_PAGES || !(window.SITE_SETTINGS && window.SITE_SETTINGS.episodePages === false)) && id === pageId && i < 300 && window.hakimEpPath) {
        const tp = i >= 0 ? hakimEpPath(id, i + 1) : hakimCoursePath(id);
        const nu0 = new URL(tp, document.baseURI);
        if (location.pathname !== nu0.pathname) { const nu = nu0; nu.search = ''; if (push) history.pushState({ hkView: i >= 0 ? 'player' : 'info' }, '', nu.toString()); else history.replaceState(history.state, '', nu.toString()); }
        return;
      }
      if (id !== pageId) u.searchParams.set('s', id); else u.searchParams.delete('s');
      if (i >= 0) u.searchParams.set('ep', String(i + 1)); else u.searchParams.delete('ep');
      if (push) history.pushState({ hkView: 'player' }, '', u.toString()); else history.replaceState(history.state, '', u.toString());
    } catch (e) {}
  }
  let currentIndex = 0;
  let activePage = 0;
  let episodeViewCount = 0;

  const PLACEHOLDER_IMG =
    'data:image/svg+xml;utf8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">
      <rect width="300" height="400" fill="#1c222e"/>
      <text x="50%" y="50%" fill="#8b93a7" font-size="16" font-family="sans-serif" text-anchor="middle" dy=".3em">لا توجد صورة</text>
    </svg>`);

  function showError(title, msg) {
    pageBody.style.display = 'none';
    errorBox.style.display = 'block';
    errorBox.innerHTML = `<h2>${hakimEscapeHtml(title)}</h2><p>${hakimEscapeHtml(msg)}</p><a href="index.html" class="back-link" style="justify-content:center">العودة للرئيسية</a>`;
  }

  const INFO_LABELS = {
    overview: 'نبذة', studio: 'الاستديو', language: 'اللغة', writer: 'الكاتب', status: 'حالة الكورس',
    levelsCount: 'عدد المواسم', episodesCount: 'عدد الحلقات', seasonEpisodes: 'حلقات هذا الموسم',
    country: 'البلد الصانع', ageRange: 'الفئة العمرية', minAge: 'الحد الأدنى للعمر'
  };
  const STATUS_LABELS = { complete: 'مكتمل', ongoing: 'قيد الإنتاج - مستمر', paused: 'متوقف مؤقتًا', stopped: 'متوقف نهائيًا' };
  const AGE_RANGE_LABELS = { '5-10': 'من 5 إلى 10 سنوات', '10-17': 'من 10 إلى 17 سنة', '18-30': 'من 18 إلى 30 سنة', other: 'غير ذلك' };
  const RELEASE_DATE_LABELS = { old: 'قديم', new: 'حديثة', exclusive: 'حصري 🔥' };
  const HIDDEN_INFO_KEYS = ['grade', 'releaseDate']; // لا تُعرض ضمن الشبكة العادية (releaseDate له عرض خاص كشارات)

  function formatInfoValue(key, val) {
    if (key === 'status') return STATUS_LABELS[val] || val;
    if (key === 'minAge') return '🚫 ' + val + '+';
    if (key === 'ageRange') {
      if (AGE_RANGE_LABELS[val] && val !== '5-10' && val !== '10-17' && val !== '18-30') return '';
      const m = /^(\d*)-(\d*)$/.exec(String(val));
      if (m) return m[1] && m[2] ? `من ${m[1]} إلى ${m[2]} سنة` : (m[1] ? `من ${m[1]} سنة فأكثر` : (m[2] ? `حتى ${m[2]} سنة` : ''));
      return AGE_RANGE_LABELS[val] || val;
    }
    return val;
  }

  function renderInfo(info) {
    if (!info) { infoSection.innerHTML = ''; return; }
    const overview = info.overview ? `<div class="info-overview">${hakimEscapeHtml(info.overview)}</div>` : '';
    const items = Object.keys(INFO_LABELS)
      .filter(k => k !== 'overview' && info[k] && !HIDDEN_INFO_KEYS.includes(k))
      .map(k => `<div class="info-item"><div class="label">${INFO_LABELS[k]}</div><div class="value">${hakimEscapeHtml(String(formatInfoValue(k, info[k])))}</div></div>`)
      .join('');
    if (!overview && !items) { infoSection.innerHTML = ''; return; }
    infoSection.innerHTML = `<h3>${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.courseInfoHeading) || 'معلومات الكورس')}</h3>${overview}${items ? `<div class="info-grid">${items}</div>` : ''}`;
  }

  function pageOf(index) { return Math.floor((orderDesc ? currentVideos.length - 1 - index : index) / PAGE_SIZE); }

  function renderPageNumbers() {
    const total = currentVideos.length;
    if (total <= PAGE_SIZE) { pageNumbers.innerHTML = ''; const b0 = document.getElementById('pageNumbersBottom'); if (b0) b0.innerHTML = ''; return; }
    const pageCount = Math.ceil(total / PAGE_SIZE);
    let html = '';
    for (let p = 0; p < pageCount; p++) {
      html += `<button class="page-num-btn ${p === activePage ? 'active' : ''}" data-page="${p}">${p + 1}</button>`;
    }
    pageNumbers.innerHTML = html;
    /* نسخة تانية من الترقيم تحت الحلقات (الأولى فوق زي ما هي) */
    let bottom = document.getElementById('pageNumbersBottom');
    if (!bottom && lessonListEl && lessonListEl.parentNode) {
      bottom = document.createElement('div'); bottom.id = 'pageNumbersBottom'; bottom.className = 'page-numbers page-numbers-bottom';
      lessonListEl.parentNode.insertBefore(bottom, lessonListEl.nextSibling);
    }
    if (bottom) bottom.innerHTML = html;
    [pageNumbers, bottom].forEach(host => {
      if (!host) return;
      host.querySelectorAll('.page-num-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          activePage = parseInt(btn.dataset.page, 10);
          renderPageNumbers();
          renderLessonList();
          if (host === bottom && pageNumbers.scrollIntoView) pageNumbers.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
      });
    });
  }

  function renderLessonList() {
    const total = currentVideos.length;
    const start = total > PAGE_SIZE ? activePage * PAGE_SIZE : 0;
    const end = total > PAGE_SIZE ? Math.min(total, start + PAGE_SIZE) : total;

    const watchedSet = getWatched();
    const orderBtn = total >= 5 ? `<button type="button" class="ep-order-btn" id="epOrderBtn" title="تغيير ترتيب الحلقات">↕ ${orderDesc ? 'الأحدث أولًا' : 'الأقدم أولًا'}</button>` : '';
    let html = `<div class="ep-head"><h3>${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.courseContentHeading) || 'الحلقات')}</h3>${orderBtn}</div><div class="ep-grid">`;
    for (let pos = start; pos < end; pos++) {
      const i = orderDesc ? total - 1 - pos : pos;
      const v = currentVideos[i];
      const num = episodeNumber(i);
      const tip = [v.title, v.description].filter(Boolean).join(' — ');
      html += `<button type="button" class="ep-tile ${i === selectedIndex ? 'active' : ''} ${v.disabled ? 'lesson-disabled' : ''} ${watchedSet.has(i) ? 'watched' : ''}" data-index="${i}" data-video-id="${hakimEscapeHtml(id + '-' + (i + 1))}" title="${hakimEscapeHtml(tip)}">
        <span class="ep-label">${v.disabled ? '🔒' : 'الحلقة'}</span><span class="ep-num">${num}</span>${v.subOnly && !v.disabled ? '<span class="ep-sub" title="حلقة مترجمة (مش مدبلجة)" style="position:absolute;top:3px;inset-inline-end:5px;font-size:.72rem;font-weight:900;color:#f5b301">✔</span>' : ''}
      </button>`;
    }
    html += '</div>';
    lessonListEl.innerHTML = html;

    lessonListEl.querySelectorAll('.ep-tile').forEach(btn => btn.addEventListener('click', () => selectEpisode(parseInt(btn.dataset.index, 10))));
    const ob = document.getElementById('epOrderBtn');
    if (ob) ob.addEventListener('click', () => {
      orderDesc = !orderDesc;
      try { localStorage.setItem('hakim_ep_order', orderDesc ? 'desc' : 'asc'); } catch (e) {}
      activePage = pageOf(Math.max(0, selectedIndex)); renderPageNumbers(); renderLessonList();
    });
  }

  function renderPlayerNav() {
    const total = currentVideos.length;
    playerNav.innerHTML = `
      <button class="nav-btn" id="prevEpBtn" ${currentIndex <= 0 ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        الحلقة السابقة
      </button>
      <button class="nav-btn" id="nextEpBtn" ${currentIndex >= total - 1 ? 'disabled' : ''}>
        الحلقة التالية
        <svg viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
      </button>`;
    const prevBtn = document.getElementById('prevEpBtn');
    const nextBtn = document.getElementById('nextEpBtn');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (currentIndex > 0) { playLesson(currentIndex - 1, true); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
    if (nextBtn) nextBtn.addEventListener('click', () => { if (currentIndex < total - 1) { playLesson(currentIndex + 1, true); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
  }

  /* ---------------- تقييم الحلقة بالنجوم (حقيقي عبر Supabase، المتوسط فقط ظاهر) ---------------- */
  function episodeRatingKey(index) { return `hakim_ep_rating_${id}_${index}`; }

  async function submitEpisodeRating(index, stars) {
    localStorage.setItem(episodeRatingKey(index), String(stars));
    await hakimSbUpsert('episode_ratings', {
      session_id: hakimSessionId(), course_id: id, episode_index: index, rating: stars
    }, 'session_id,course_id,episode_index');
    renderVideoStats(currentVideos[index], index);
  }

  async function renderVideoStats(v, index) {
    /* رابط التحميل: http/https أو مسار نسبي بس (ما نقبلش javascript: وأمثالها) */
    const dl = String(v.download || '').trim();
    const safeDownloadUrl = /^(https?:\/\/|[^:]*$)/i.test(dl) ? dl : '';
    const myRating = parseInt(localStorage.getItem(episodeRatingKey(index)) || '0', 10);
    let avgLabel = '—';
    if (hakimSbReady()) {
      const avg = await hakimSbRpc('get_episode_rating', { p_course_id: id, p_episode_index: index });
      if (avg != null) avgLabel = (typeof avg === 'number' ? avg : parseFloat(avg)).toFixed(1);
    }
    const starsHtml = [1, 2, 3, 4, 5].map(n => `
      <button type="button" class="star-btn ${n <= myRating ? 'filled' : ''}" data-star="${n}" title="قيّم ${n} نجوم">
        <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      </button>`).join('');
    videoStatsRow.innerHTML = `
      <span title="عدد المشاهدات (حقيقي)"><svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12.5a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg> ${episodeViewCount}</span>
      <span class="ep-stars" title="تقييمك لهذه الحلقة">${starsHtml} <b class="ep-avg">${avgLabel}</b></span>
      ${safeDownloadUrl ? `<a class="stat-btn download-btn" href="${hakimEscapeHtml(safeDownloadUrl)}" target="_blank" rel="noopener noreferrer" download>⬇️ تحميل</a>` : ''}
      <button type="button" class="stat-btn report-btn" data-act="report">⚠️ إبلاغ عن خطأ</button>
    `;
    videoStatsRow.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', () => submitEpisodeRating(index, parseInt(btn.dataset.star, 10)));
    });
    videoStatsRow.querySelector('[data-act="report"]').addEventListener('click', () => openReportModal(v, index));
  }

  const REPORT_REASONS = ['ترتيب الحلقة غير صحيح', 'الفيديو لا يعمل', 'الصوت أو الترجمة بها مشكلة', 'محتوى غير لائق', 'مشكلة أخرى'];
  function openReportModal(v, index) {
    let modal = document.getElementById('reportModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'reportModal';
      modal.className = 'admin-overlay';
      modal.innerHTML = `
        <div class="admin-card" style="max-width:420px;width:92%">
          <h2>${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.reportModalTitle) || 'الإبلاغ عن مشكلة')}</h2>
          <p class="hint">${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.reportModalHint) || 'اختر نوع المشكلة في هذه الحلقة، وأضف تفاصيل لو حبيت — البلاغ بيوصل لإدارة الموقع مباشرة.')}</p>
          <div id="reportReasons" style="margin-bottom:14px"></div>
          <div class="field"><label>${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.reportDetailLabel) || 'تفاصيل إضافية (اختياري)')}</label><textarea id="reportDetail"></textarea></div>
          <div style="display:flex;gap:10px">
            <button type="button" class="btn-primary" id="reportSendBtn">${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.reportSendBtn) || 'إرسال البلاغ')}</button>
            <button type="button" class="btn-secondary" id="reportCancelBtn">${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.cancelBtn) || 'إلغاء')}</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.querySelector('#reportCancelBtn').addEventListener('click', () => { modal.style.display = 'none'; });
    }

    modal.querySelector('#reportReasons').innerHTML = REPORT_REASONS.map((r, i) => `
      <label style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:0.85rem;cursor:pointer">
        <input type="radio" name="reportReason" value="${hakimEscapeHtml(r)}" ${i === 0 ? 'checked' : ''}> ${hakimEscapeHtml(r)}
      </label>`).join('');
    modal.querySelector('#reportDetail').value = '';

    modal.querySelector('#reportSendBtn').onclick = () => {
      const reasonInput = modal.querySelector('input[name="reportReason"]:checked');
      const reason = reasonInput ? reasonInput.value : '';
      const detail = modal.querySelector('#reportDetail').value.trim();
      const sendBtn = modal.querySelector('#reportSendBtn'); sendBtn.disabled = true;
      const reportUrl = (siteSettingsCache && siteSettingsCache.reportUrl) || '';
      hakimSbInsert('episode_reports', { session_id: hakimSessionId(), course_id: id, episode_index: index, episode_title: String(v.title || '').slice(0, 150), reason, details: detail.slice(0, 1000), page_url: location.href.slice(0, 300) }).then((ok) => {
        sendBtn.disabled = false;
        if (ok) { alert('وصل بلاغك لإدارة الموقع — شكرًا لمساعدتك 🙏'); modal.style.display = 'none'; return; }
        if (!reportUrl) { alert('تعذّر إرسال البلاغ حاليًا، حاول مرة تانية بعد شوية.'); return; }
        const title = encodeURIComponent(`بلاغ: ${id} — ${v.title || 'حلقة ' + (index + 1)}`);
        const body = encodeURIComponent(`الكورس: ${id}\nالحلقة رقم: ${index + 1} (${v.title || ''})\nسبب البلاغ: ${reason}\nتفاصيل إضافية: ${detail || '(لا يوجد)'}`);
        (window.hakimTrustedOpen || window.open).call(window, `${reportUrl}?title=${title}&body=${body}`, '_blank');
        modal.style.display = 'none';
      });
    };

    modal.style.display = 'flex';
  }


  /* ===== السيو: عنوان/وصف/canonical/OG/JSON-LD/فتات الخبز — يقرأ data.seo لو موجود وإلا يولّد تلقائيًا ===== */
  function seoH1(data) { return (data.seo && data.seo.h1) || data.name || 'كورس بدون اسم'; }
  function seoFill(tpl, n, name) {
    return String(tpl || '').replace(/\{رقم\}|\bX\b/g, n).replace(/\{اسم\}/g, name || '');
  }
  /* قوالب سيو الحلقات الغنية: {اسم} {رقم} {موسم} {عدد} {موقع} {نبذة} {فئة} */
  function seoFillV(tpl, v) {
    return String(tpl || '').replace(/\{رقم\}/g, v.n).replace(/\{اسم\}/g, v.name).replace(/\{موسم\}/g, v.season).replace(/\{عدد\}/g, v.total).replace(/\{موقع\}/g, v.site).replace(/\{نبذة\}/g, v.overview || '').replace(/\{فئة\}/g, v.category || '')
      .replace(/\s+([.،,])/g, '$1').replace(/(?:,\s*){2,}/g, ', ').replace(/,\s*$/, '').replace(/\s+/g, ' ').trim();
  }
  const EP_TPL_DEFAULT = {
    epTitle: '{اسم} الحلقة {رقم} (الموسم {موسم}) — مشاهدة وتحميل',
    epDesc: 'شاهد وحمّل الحلقة {رقم} من {اسم} الموسم {موسم} (من {عدد} حلقة) مجانًا وبجودة عالية على {موقع}. {نبذة}',
    epKeywords: '{اسم} الحلقة {رقم}, مشاهدة الحلقة {رقم} من {اسم}, تحميل {اسم} الحلقة {رقم}, {اسم} الموسم {موسم}, {فئة}'
  };
  /* 🏷️ جملة الشعار (محرر النصوص) بتتضاف لوصف الصفحة — نفس منطق الأدمن */
  function seoWithSlogan(desc) {
    const sl = String((window.SITE_TEXT && window.SITE_TEXT.siteSlogan) || '').replace(/\s+/g, ' ').trim(); desc = String(desc || '').trim();
    if (!sl || desc.indexOf(sl) > -1) return desc; if (!desc) return sl.slice(0, 160);
    const room = 160 - 3 - sl.length;
    if (room >= desc.length) return desc.replace(/[.،]+$/, '') + ' — ' + sl;
    if (room >= 40) return desc.slice(0, room - 1).replace(/[\s،,.]+\S*$/, '').trim() + '… — ' + sl;
    return desc;
  }
  function epSeoFor(data, index, site) {
    const seo = data.seo || {}, v = (data.videos || [])[index] || {}, ov = v.seo || {}, T = Object.assign({}, EP_TPL_DEFAULT, (window.SITE_SETTINGS && window.SITE_SETTINGS.seoTemplates) || {});
    const vars = { n: index + 1, name: (data.name || '').trim(), season: data.seasonNumber || 1, total: (data.videos || []).length, site: site, overview: (data.info && data.info.overview) || '', category: data.category || '' };
    const title = ov.title || seoFillV(seo.episodeTitleTemplate || T.epTitle, vars) || (v.title || ('الحلقة ' + (index + 1)));
    const description = ov.description || seoFillV(seo.episodeDescTemplate || T.epDesc, vars) || v.description || '';
    const kw = [ov.keywords, seoFillV(T.epKeywords, vars), seo.keywords].filter(Boolean).join(', ').split(',').map(x => x.trim()).filter(Boolean);
    return { title: title, description: ov.description ? seoClip(description, 160) : seoWithSlogan(seoClip(description, 160)), keywords: Array.from(new Set(kw)).join(', ') };
  }
  function seoSetMeta(attr, key, val) {
    if (!val) return;
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute('content', val);
  }
  function seoSetCanonical(url) {
    let el = document.head.querySelector('link[rel="canonical"]');
    if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el); }
    el.href = url;
  }
  /* السيو التلقائي: أي حقل فاضي بيتولّد من بيانات الكورس (نفس منطق الأدمن) */
  function seoClip(t, max) { t = String(t || '').replace(/\s+/g, ' ').trim(); if (t.length <= max) return t; const c = t.slice(0, max), s = Math.max(c.lastIndexOf('. '), c.lastIndexOf('؟'), c.lastIndexOf('!')); if (s > max * 0.55) return c.slice(0, s + 1).trim(); const sp = c.lastIndexOf(' '); return (sp > max * 0.6 ? c.slice(0, sp) : c.slice(0, max - 1)).replace(/[\s،,:؛\-—|]+$/, '') + '…'; }
  function seoAuto(data, site) {
    const name = (data.name || 'كورس').trim(), n = (data.videos || []).length, info = data.info || {};
    const full = `${name} — شرح كامل ومجاني | ${site}`;
    return {
      title: full.length <= 62 ? full : seoClip(`${name} | ${site}`, 62),
      description: seoClip(`شاهد ${name} كامل${n ? ` (${n} حلقة)` : ''} مجانًا وبجودة عالية على ${site}.${info.overview ? ' ' + info.overview : ''}`, 158),
      keywords: [...new Set([name, `شرح ${name}`, `مشاهدة ${name}`, `${name} مجانا`, data.category, site].filter(Boolean))].join(', '),
      epTitle: 'الحلقة {رقم} من {اسم}', epDesc: `شاهد الحلقة {رقم} من ${name} مجانًا وبجودة عالية على ${site}`
    };
  }
  function applyCourseSeo(id, data) {
    const site = (window.SITE_SETTINGS && window.SITE_SETTINGS.siteName) || 'منصة حكيم التعليمية';
    const seo = data.seo || {};
    const auto = seoAuto(data, site);
    const title = seo.title || auto.title;
    const desc = seo.description || seoWithSlogan(data.description || auto.description);
    const base = location.href.split('#')[0].split('?')[0];
    const url = window.__COURSE_ID ? base : `${base}?id=${encodeURIComponent(id)}`;
    document.title = title;
    seoSetMeta('name', 'description', desc);
    seoSetMeta('name', 'keywords', seo.keywords || auto.keywords);
    seoSetCanonical(url);
    seoSetMeta('property', 'og:title', title);
    seoSetMeta('property', 'og:description', desc);
    seoSetMeta('property', 'og:type', 'website');
    seoSetMeta('property', 'og:url', url);
    if (data.img) seoSetMeta('property', 'og:image', data.img);
    seoSetMeta('name', 'twitter:card', 'summary_large_image');

    const videos = data.videos || [];
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: seo.h1 || data.name || '',
      description: desc,
      url,
      inLanguage: 'ar',
      provider: { '@type': 'Organization', name: site },
      hasPart: videos.map((v, i) => [v, i]).filter(x => !x[0].disabled).map(([v, i]) => { const es = epSeoFor(data, i, site); return {
        '@type': 'VideoObject',
        name: es.title,
        description: es.description || v.title || '',
        keywords: es.keywords,
        url: `${url}${url.indexOf('?') > -1 ? '&' : '?'}ep=${i + 1}`,
        thumbnailUrl: new URL(data.img || 'icon-512.png', location.href).href,
        contentUrl: v.link || undefined,
        uploadDate: (data.firstPublishedAt && String(data.firstPublishedAt).slice(0, 10)) || (data.info && data.info.startDate) || (new Date().toISOString().slice(0, 10)),
        position: i + 1,
        episodeNumber: i + 1, seasonNumber: data.seasonNumber || 1
      }; })
    };
    let ldEl = document.querySelector('script[data-seo="course"]') || document.getElementById('seoJsonLd');
    if (!ldEl) { ldEl = document.createElement('script'); ldEl.type = 'application/ld+json'; ldEl.id = 'seoJsonLd'; document.head.appendChild(ldEl); }
    ldEl.textContent = JSON.stringify(ld);

    /* فتات الخبز (Breadcrumbs) + JSON-LD لها */
    const cat = data.category || '';
    const crumbs = [{ n: 'الرئيسية', h: 'index.html' }];
    if (cat) crumbs.push({ n: cat, h: `index.html?cat=${encodeURIComponent(cat)}` });
    crumbs.push({ n: data.name || 'الكورس', h: null });
    let nav = document.getElementById('seoBreadcrumbs');
    if (!nav) {
      nav = document.createElement('nav'); nav.id = 'seoBreadcrumbs'; nav.setAttribute('aria-label', 'breadcrumb');
      nav.style.cssText = 'font-size:0.82rem;color:var(--text-muted);margin:6px 0 12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center';
      const back = document.querySelector('.back-link');
      if (back && back.parentNode) back.parentNode.insertBefore(nav, back.nextSibling);
    }
    nav.innerHTML = crumbs.map((c, i) => (c.h ? `<a href="${c.h}" style="color:var(--text-muted)">${hakimEscapeHtml(c.n)}</a>` : `<span style="color:var(--text)">${hakimEscapeHtml(c.n)}</span>`) + (i < crumbs.length - 1 ? '<span>‹</span>' : '')).join(' ');
    let bcEl = document.getElementById('seoBreadcrumbLd');
    if (!bcEl) { bcEl = document.createElement('script'); bcEl.type = 'application/ld+json'; bcEl.id = 'seoBreadcrumbLd'; document.head.appendChild(bcEl); }
    bcEl.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.n })) });
    window.__seoCourse = { data, id };
    const navLabelEl = document.getElementById('sectionsBtnLabel');
    if (navLabelEl) navLabelEl.textContent = data.category || data.name || 'صفحة الكورس';
  }
  function applyEpisodeSeo(index) {
    const c = window.__seoCourse; if (!c) return;
    const v = (c.data.videos || [])[index]; if (!v) return;
    const site = (window.SITE_SETTINGS && window.SITE_SETTINGS.siteName) || 'منصة حكيم التعليمية';
    const es = epSeoFor(c.data, index, site), full = es.title.indexOf(site) > -1 ? es.title : `${es.title} | ${site}`;
    const base = location.href.split('#')[0].split('?')[0], url = window.__COURSE_ID ? base : `${base}?id=${encodeURIComponent(c.id)}`, epUrl = (window.__EP_PAGES && window.__COURSE_ID && index < 300) ? hakimAbsUrl(hakimEpPath(window.__COURSE_ID, index + 1)) : `${url}${url.indexOf('?') > -1 ? '&' : '?'}ep=${index + 1}`;  /* لو صفحات الحلقات الثابتة مفعّلة، الـcanonical بتاع أي حلقة هو صفحتها الثابتة */
    document.title = full;
    seoSetMeta('name', 'description', es.description); seoSetMeta('name', 'keywords', es.keywords);
    seoSetMeta('property', 'og:title', es.title); seoSetMeta('property', 'og:description', es.description); seoSetMeta('property', 'og:url', epUrl); seoSetMeta('property', 'og:type', 'video.episode');
    seoSetCanonical(epUrl);
    let el = document.getElementById('seoEpisodeLd'); if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = 'seoEpisodeLd'; document.head.appendChild(el); }
    el.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'VideoObject', name: es.title, description: es.description || es.title, keywords: es.keywords, url: epUrl, inLanguage: 'ar',
      thumbnailUrl: new URL(c.data.img || 'icon-512.png', location.href).href, uploadDate: (c.data.firstPublishedAt && String(c.data.firstPublishedAt).slice(0, 10)) || new Date().toISOString().slice(0, 10),
      episodeNumber: index + 1, partOfSeries: { '@type': 'Course', name: c.data.name || '', url: url }, isPartOf: { '@type': 'Course', name: c.data.name || '', url: url } });
  }
  /* لما نخرج من صفحة المشاهدة نرجّع سيو الكورس نفسه */
  function restoreCourseSeo() { const c = window.__seoCourse; if (!c) return; try { applyCourseSeo(c.id, c.data); const e = document.getElementById('seoEpisodeLd'); if (e) e.remove(); } catch (er) {} }

  /* ---------------- سيرفرات الفيديو والتحميل (توزيع الحمل تلقائيًا + تبديل عند العطل) ---------------- */
  let srvVideo = [], srvDl = [];
  const srvActive = (arr) => (arr || []).filter(s => s && !s.archived);
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  /* بيرجّع قائمة روابط مرتّبة: الأول هو اللي هيتشغّل، والباقي احتياطي لو حصل عطل. الاختيار ثابت للزائر في نفس الحلقة (بدون تغيير وسط المشاهدة) ومتوزّع بين الزوار */
  function pickSources(v, index) {
    const act = srvActive(srvVideo), urls = [];
    act.forEach(s => { const u = s.id === 'main' ? v.link : (v.sources || {})[s.id]; if (u && String(u).trim()) urls.push(String(u).trim()); });
    if (!act.length || !urls.length) return v.link ? [v.link] : [];
    const uniq = Array.from(new Set(urls)), start = hashStr((window.hakimSessionId ? hakimSessionId() : 'x') + '|' + id + '|' + index) % uniq.length;
    return uniq.slice(start).concat(uniq.slice(0, start));
  }
  function safeHttp(u) { u = String(u || '').trim(); return /^(https?:)?\/\//i.test(u) || /^[\w./-]+$/.test(u) ? u : ''; }
  /* أزرار التحميل: كل سيرفر زر جنب التاني بين المشغّل ومكعبات الحلقات */
  function renderDlServers(v) {
    const pv = document.getElementById('playerView'); if (!pv) return;
    let host = document.getElementById('dlServers');
    if (!host) { host = document.createElement('div'); host.id = 'dlServers'; host.className = 'dl-servers'; const nav = document.getElementById('playerNav'); if (nav && nav.parentNode) nav.parentNode.insertBefore(host, nav.nextSibling); }
    const btns = [];
    srvActive(srvDl).forEach(s => { const u = safeHttp((v.downloads || {})[s.id]); if (u) btns.push(`<a class="dl-btn" href="${hakimEscapeHtml(u)}" target="_blank" rel="noopener noreferrer" download>⬇️ ${hakimEscapeHtml(s.name || 'تحميل')}</a>`); });
    const legacy = safeHttp(v.download); if (legacy && !btns.length) btns.push(`<a class="dl-btn" href="${hakimEscapeHtml(legacy)}" target="_blank" rel="noopener noreferrer" download>⬇️ تحميل الحلقة</a>`);
    host.innerHTML = btns.length ? `<div class="dl-title">تحميل هذه الحلقة</div><div class="dl-row">${btns.join('')}</div>` : '';
  }

  /* =====================================================================
     📥 تشجيع التحميل (من الأدمن ← إعدادات الموقع ← 📥 تشجيع التحميل): ملاحظة كبيرة حمراء فوق المشغّل مباشرة + زر تحميل كبير.
     كل ما فيها صحيح 100% (مفيش ادّعاءات كاذبة): تقليل الاحتكاك (ضغطة واحدة)، إبراز الفوائد، ورسالة أقوى في لحظة الألم (لما الفيديو يتقطّع).
     المشغّل نفسه ما بيتأثرش — الزائر يقدر يكمّل مشاهدة عادي.
     ===================================================================== */
  function dlNudgeOn() { const s = (window.SITE_SETTINGS || {}).dlNudge; return !!(s && Array.isArray(s.ids) && s.ids.indexOf(id) > -1); }
  function dlNudgeLinks(v) {
    const out = [];
    srvActive(srvDl).forEach(s => { const u = safeHttp((v.downloads || {})[s.id]); if (u) out.push({ name: s.name || 'تحميل', url: u }); });
    const legacy = safeHttp(v.download); if (legacy && !out.length) out.push({ name: 'تحميل الحلقة', url: legacy });
    return out;
  }
  function dlnCount(add) { try { const k = 'hk_dln'; let a = JSON.parse(localStorage.getItem(k) || '[]'); if (add && a.indexOf(add) < 0) { a.push(add); if (a.length > 300) a = a.slice(-300); localStorage.setItem(k, JSON.stringify(a)); } return a.length; } catch (e) { return add ? 1 : 0; } }
  function renderDlNudge(v, index) {
    let box = document.getElementById('dlNudge');
    const links = (v && !v.disabled && dlNudgeOn()) ? dlNudgeLinks(v) : [];
    if (!links.length) { if (box) box.remove(); return; }
    const T = window.SITE_TEXT || {}, E = hakimEscapeHtml, main = links[0];
    if (!box) { box = document.createElement('div'); box.id = 'dlNudge'; box.className = 'dl-nudge'; box.setAttribute('role', 'note'); playerHost.parentNode.insertBefore(box, playerHost); }
    box.classList.remove('stall', 'done');
    const aMain = (txt, cls) => `<a class="${cls} dl-btn" data-dln="1" href="${E(main.url)}" target="_blank" rel="noopener noreferrer" download>${txt}</a>`;
    let title = E(T.dlNudgeTitle || '⚠️ إن لم يعمل الفيديو يمكنك تنزيله من {هنا}');
    const here = aMain('هنا', 'dln-here');
    title = title.indexOf('{هنا}') > -1 ? title.replace('{هنا}', here) : (title.indexOf('هنا') > -1 ? title.replace('هنا', here) : title + ' ' + here);
    const ben = String(T.dlNudgeBenefits || 'بدون تقطيع ولا انتظار • شاهدها في أي وقت وبدون إنترنت • تشتغل على أي جهاز').split(/[•\n]/).map(x => x.trim()).filter(Boolean).map(x => `<li>${E(x)}</li>`).join('');
    const alt = links.slice(1).map(l => `<a class="dln-alt-a dl-btn" data-dln="1" href="${E(l.url)}" target="_blank" rel="noopener noreferrer" download>${E(l.name)}</a>`).join('');
    const hasNext = index < currentVideos.length - 1;
    box.innerHTML = `<div class="dln-stall" aria-live="polite">${E(T.dlNudgeStall || 'الفيديو بيتقطّع؟ التحميل بيحلّها بضغطة واحدة 👇')}</div>
      <div class="dln-title">${title}</div>
      ${aMain(E(T.dlNudgeBtn || '⬇️ حمّل الحلقة الآن — ضغطة واحدة') + '<span class="dln-badge">الأسرع</span>', 'dln-btn')}
      ${ben ? `<ul class="dln-ben">${ben}</ul>` : ''}
      ${alt ? `<div class="dln-alt">سيرفرات تحميل بديلة: ${alt}</div>` : ''}
      <div class="dln-foot" aria-live="polite"></div>`;
    hakimHealth('dl_nudge_shown', id, index);
    box.onclick = (e) => {
      const a = e.target.closest('a[data-dln]'); if (!a) { const nx = e.target.closest('.dln-next'); if (nx) playLesson(index + 1, true); return; }
      hakimHealth('dl_nudge_click', id, index, (a.textContent || '').slice(0, 40));
      const n = dlnCount(id + ':' + index);
      box.classList.add('done'); box.classList.remove('stall');
      const foot = box.querySelector('.dln-foot');
      foot.innerHTML = E(T.dlNudgeDone || '✅ بدأ التحميل! لو ما بدأش اضغط الزر تاني') + (n > 1 ? `<br><b>حمّلت ${n} حلقة معانا 💪</b>` : '') + (hasNext ? ` <button type="button" class="dln-next">الحلقة التالية ⏭</button>` : '');
    };
  }
  function bindDlStall() {
    if (!playerHost || playerHost.__dlStall) return; playerHost.__dlStall = true; let tm = null;
    const mark = () => { const b = document.getElementById('dlNudge'); if (b && !b.classList.contains('done') && !b.classList.contains('stall')) { b.classList.add('stall'); hakimHealth('dl_nudge_stall', id, currentIndex); } };
    playerHost.addEventListener('waiting', () => { clearTimeout(tm); tm = setTimeout(mark, 2500); }, true);
    ['playing', 'canplay', 'pause', 'ended'].forEach(ev => playerHost.addEventListener(ev, () => clearTimeout(tm), true));
    playerHost.addEventListener('error', mark, true);
  }

  async function playLesson(index, autoplay) {
    const v = currentVideos[index];
    if (!v) return;
    currentIndex = index;
    if (window.__HAKIM_PREVIEW) { try { parent.postMessage({ hakimPreview: 'episode', index }, '*'); } catch (e) {} }
    syncEpisodeUrl(index);
    try { applyEpisodeSeo(index); } catch (e) {}
    renderWatchHeader(index, v);
    /* ✔ حلقة مترجمة (مش مدبلجة): رسالة اعتذار كبيرة وواضحة فوق المشغّل */
    try {
      let sn = document.getElementById('subNoticeBox');
      if (v.subOnly && !v.disabled) {
        if (!sn) { sn = document.createElement('div'); sn.id = 'subNoticeBox'; sn.setAttribute('role', 'note'); playerHost.parentNode.insertBefore(sn, document.getElementById('dlNudge') || playerHost); }
        sn.style.cssText = 'margin:0 0 14px;padding:22px 20px;border-radius:16px;border:2px solid #f5b301;background:linear-gradient(135deg,rgba(245,179,1,.18),rgba(229,32,44,.12));color:var(--text,#fff);font-size:1.25rem;line-height:1.9;font-weight:800;text-align:center';
        sn.innerHTML = '<div style="font-size:2.2rem;line-height:1;margin-bottom:8px">✔</div>' + hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.subNotice) || 'نأسف لعدم توفير الحلقة بالدبلجة، يمكنك مشاهدتها بالترجمة.');
      } else if (sn) sn.remove();
    } catch (e) {}

    if (v.disabled) {
      playerHost.innerHTML = `
        <div class="episode-disabled-box">
          <svg viewBox="0 0 24 24"><path d="M12 17a2 2 0 002-2 2 2 0 00-2-2 2 2 0 00-2 2 2 2 0 002 2zm6-9a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h1V6a5 5 0 0110 0v2h1zm-6-5a3 3 0 00-3 3v2h6V6a3 3 0 00-3-3z"/></svg>
          <p>${hakimEscapeHtml(v.disabledMessage || 'هذه الحلقة غير متاحة حاليًا.')}</p>
        </div>`;
      nowPlaying.innerHTML = `<strong>${hakimEscapeHtml(v.title || '')}</strong> — غير متاحة حاليًا`;
      videoStatsRow.innerHTML = '';
    } else {
      if (v.adRedirect && window.HakimAds) { try { HakimAds.episodeClick(v.adRedirect, index); } catch (e) {} }
      const cands = pickSources(v, index); let attempt = 0;
      let apOff = false; try { apOff = sessionStorage.getItem('hakim_ap_off') === '1'; } catch (e) {}
      const apOn = !apOff && (!!v.antiPopup || courseMeta.playback.antiPopupAll !== false);
      const apLvl = apOn && window.HakimMedia && HakimMedia.apLevelOf ? HakimMedia.apLevelOf(courseMeta.playback) : 0;
      window.__hakimApLevel = apOn ? apLvl : 0;
      window.__hakimAdMode = { framed: !!courseMeta.playback.adWindow, bg: !!courseMeta.playback.bgAd };
      if (courseMeta.playback.antiPopupMax && window.hakimMaxGuard) { try { hakimMaxGuard((why, n) => { if (n === 1 || n % 5 === 0) { if (typeof hakimToast === 'function') hakimToast('🛡️ تم صدّ محاولة إعلان منبثق', 'success'); } }); } catch (e) {} }
      const mountWith = (url) => HakimPlayer.mount(playerHost, {
        src: url, storageKey: `hakim_progress_${id}_${index}`,
        type: v.rawEmbed ? 'embed' : (v.type || courseMeta.playback.defaultType || 'auto'),
        onState: (st) => {
          if (window.__HAKIM_PREVIEW) { try { parent.postMessage({ hakimPreview: 'state', index, ...st }, '*'); } catch (e) {} }
          /* عطل في السيرفر ده؟ بنبدّل تلقائيًا للسيرفر اللي بعده */
          if (st && st.state === 'error' && attempt + 1 < cands.length && currentIndex === index) { attempt++; hakimHealth('server_failover', id, index, { from: url, to: cands[attempt] }); mountWith(cands[attempt]); const ve = playerHost.querySelector('video'); if (ve) ve.play().catch(() => {}); }
        },
        onHealth: (t, d) => hakimHealth(t, id, index, d),
        antiPopup: apOn && !v.rawEmbed, apLevel: apLvl, apMax: !!courseMeta.playback.antiPopupMax && !v.rawEmbed, autoFs: !!courseMeta.playback.autoFullscreen,
        onApOff: () => { try { sessionStorage.setItem('hakim_ap_off', '1'); } catch (e) {} playLesson(index, true); },
        onProgress: (t, d) => saveHistory(index, t, d),
        onStarted: () => { saveLastWatch(index); saveHistory(index, 0, 0); },
        onWatched: () => markWatched(index),
        meta: {
          title: v.title || '', artist: courseMeta.name, artwork: courseMeta.img || '',
          onPrev: index > 0 ? () => playLesson(index - 1, true) : null,
          onNext: index < currentVideos.length - 1 ? () => playLesson(index + 1, true) : null
        },
        onEnded: () => {
          if (courseMeta.playback.autoNext === false) return;
          if (currentIndex < currentVideos.length - 1) playLesson(currentIndex + 1, true);
        }
      });
      mountWith(cands[0] || v.link);
      if (autoplay) {
        const vidEl = playerHost.querySelector('video');
        if (vidEl) vidEl.play().catch(() => {});
      }
      nowPlaying.innerHTML = `${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.nowPlayingLabel) || 'يُشغَّل الآن:')} <strong>${hakimEscapeHtml(v.title || '')}</strong>`;

      hakimTrackPageView('episode', id, index);
      const evc = await hakimSbRpc('get_episode_views', { p_course_id: id, p_episode_index: index }) || 0;
      if (currentIndex !== index) return; /* الزائر انتقل لحلقة تانية أثناء الانتظار */
      episodeViewCount = evc;
      renderVideoStats(v, index);
    }

    renderPlayerNav();
    try { renderDlServers(v); renderEpAbout(index); renderDlNudge(v, index); bindDlStall(); } catch (e) {}
    renderWatchActions(index);
  }

  /* ===== مرحلة المشغّل: العنوان والإجراءات ===== */
  function renderWatchHeader(index, v) {
    const t = document.getElementById('watchTitle'); if (!t) return;
    const num = episodeNumber(index), site = (window.SITE_SETTINGS && window.SITE_SETTINGS.siteName) || 'منصة حكيم التعليمية';
    const c = window.__seoCourse, es = c ? epSeoFor(c.data, index, site) : { title: v.title || ('الحلقة ' + num) };
    /* H1 خاص بالحلقة فوق المشغّل (عنوان سيو الحلقة) */
    t.innerHTML = `${hakimEscapeHtml(((v.seo && v.seo.h1) || es.title))}<small>${courseMeta.seasonLabel ? hakimEscapeHtml(courseMeta.seasonLabel) + ' — ' : ''}${hakimEscapeHtml(courseMeta.name)}</small><small class="watch-pos">الحلقة ${num} من ${currentVideos.length}</small>`;
  }
  /* كل سيو الحلقة ظاهر في صفحة التشغيل: الوصف + الكلمات المفتاحية */
  function renderEpAbout(index) {
    const pv = document.getElementById('playerView'); if (!pv) return;
    let host = document.getElementById('epAbout');
    if (!host) { host = document.createElement('section'); host.id = 'epAbout'; host.className = 'ep-about'; const anchor = document.getElementById('dlServers') || document.getElementById('playerNav'); if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(host, anchor.nextSibling); }
    const c = window.__seoCourse; if (!c) { host.innerHTML = ''; return; }
    const site = (window.SITE_SETTINGS && window.SITE_SETTINGS.siteName) || 'منصة حكيم التعليمية', es = epSeoFor(c.data, index, site);
    const kws = String(es.keywords || '').split(',').map(x => x.trim()).filter(Boolean);
    host.innerHTML = es.description || kws.length ? `<h2>عن هذه الحلقة</h2>${es.description ? `<p>${hakimEscapeHtml(es.description)}</p>` : ''}${kws.length ? `<div class="ep-kws">${kws.map(k => `<span>${hakimEscapeHtml(k)}</span>`).join('')}</div>` : ''}` : '';
  }
  function renderWatchActions(index) {
    const host = document.getElementById('watchActions'); if (!host) return;
    host.innerHTML = `<button type="button" class="stat-btn" id="allEpsBtn">📚 كل الحلقات</button><button type="button" class="stat-btn" id="shareEpBtn">🔗 مشاركة الحلقة</button>`;
    const all = document.getElementById('allEpsBtn'); if (all) all.addEventListener('click', backToSelection);
    const b = document.getElementById('shareEpBtn');
    if (b) b.addEventListener('click', async () => {
      const url = location.href.split('#')[0], title = `${courseMeta.name} — ${(currentVideos[currentIndex] || {}).title || ''}`;
      if (navigator.share) { try { await navigator.share({ title, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      try { await navigator.clipboard.writeText(url); if (typeof hakimToast === 'function') hakimToast('اتنسخ رابط الحلقة 🔗', 'success'); } catch (e) { prompt('انسخ الرابط', url); }
    });
  }
  let siteSettingsCache = {};

  const courseRatingKey = `hakim_course_rating_${id}`;
  async function renderCourseRatingWidget() {
    const host = document.getElementById('courseRatingHost');
    if (!host) return;
    const myRating = parseInt(localStorage.getItem(courseRatingKey) || '0', 10);
    let avgLabel = '—';
    if (hakimSbReady()) {
      const avg = await hakimSbRpc('get_course_rating', { p_course_id: pageId });
      if (avg != null) avgLabel = (typeof avg === 'number' ? avg : parseFloat(avg)).toFixed(1);
    }
    const starsHtml = [1, 2, 3, 4, 5].map(n => `
      <button type="button" class="star-btn ${n <= myRating ? 'filled' : ''}" data-star="${n}">
        <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      </button>`).join('');
    host.innerHTML = `
      <span style="font-size:0.82rem;color:var(--text-muted)">${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.courseRatingLabel) || 'تقييمك للكورس ككل:')}</span>
      ${starsHtml}
      <b class="ep-avg">${avgLabel}</b>
    `;
    host.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const stars = parseInt(btn.dataset.star, 10);
        localStorage.setItem(courseRatingKey, String(stars));
        await hakimSbUpsert('course_ratings', { session_id: hakimSessionId(), course_id: pageId, rating: stars }, 'session_id,course_id');
        renderCourseRatingWidget();
      });
    });
  }

  const FAV_ICON = '<svg viewBox="0 0 24 24"><path d="M12 21s-6.5-4.35-9.5-8.5C.5 9 2 5.5 5.5 5c2-.3 3.6.7 4.5 2 .9-1.3 2.5-2.3 4.5-2 3.5.5 5 4 3 7.5C18.5 16.65 12 21 12 21z"/></svg>';
  const FOLLOW_ICON = '<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17a5 5 0 110-10 5 5 0 010 10zm0-8a3 3 0 100 6 3 3 0 000-6z"/></svg>';
  const SHARE_ICON = '<svg viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>';
  const LATER_ICON = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7z"/></svg>';
  const PLAYLIST_ICON = '<svg viewBox="0 0 24 24"><path d="M3 5h12v2H3zm0 6h12v2H3zm0 6h8v2H3zM19 9v6.26a3 3 0 102 2.82V11h3V9z"/></svg>';

  /* ذات الصلة: مواسم نفس الكورس تحت قائمة الحلقات */
  /* مواسم العمل (من courses-index.js): الموسم الحالي + باقي المواسم المنشورة */
  async function loadSeries(courseId, data) {
    await Promise.all([hakimLoadScript('courses-index.js'), hakimLoadScript('courses-list.js')]);
    const idx = window.COURSES_INDEX || {}, published = window.COURSES_LIST || [];
    const seriesId = (idx[courseId] && idx[courseId].seriesId) || data.seriesId || courseId;
    const now = Date.now();
    const ids = Object.keys(idx).filter(x => published.includes(x) && (idx[x].seriesId || x) === seriesId && !(idx[x].publishAt && Date.parse(idx[x].publishAt) > now));
    if (!ids.includes(courseId)) ids.push(courseId);
    const own = { seasonNumber: data.seasonNumber || 1, videosCount: (data.videos || []).length };
    ['img', 'name', 'level'].forEach(k => { if (data[k]) own[k] = data[k]; });
    const all = ids.map(x => Object.assign({ id: x }, idx[x] || {}, x === courseId ? own : {}))
      .sort((a, b) => (a.seasonNumber || 1) - (b.seasonNumber || 1));
    window.__hkFamily = all;   /* كل الأعمال المرتبطة: مواسم + ورشات */
    return all.filter(e => !e.workshopOf);   /* المواسم بس — الورشات بتظهر في قسمها تحت الحلقات */
  }
  /* ---- الورشات: كروت (اسم + غلاف مختلفين) تحت صفوف الحلقات ---- */
  function renderWorkshops() {
    const fam = (window.__hkFamily || []).filter(e => e.workshopOf), old = document.getElementById('workshopsSection');
    if (old) old.remove(); if (!fam.length) return;
    const eps = document.getElementById('episodesSection'); if (!eps) return;
    const st = window.SITE_TEXT || {}, sec = document.createElement('section'); sec.id = 'workshopsSection'; sec.className = 'seasons-section workshops-section';
    sec.innerHTML = `<h3>${hakimEscapeHtml(st.workshopsHeading || 'الورشات')} <span class="count-pill">${fam.length}</span></h3><div class="related-grid">${fam.map(e => `<a class="related-card${e.id === id ? ' current' : ''}" href="${hakimEscapeHtml(hakimCourseHref(e.id))}"><img referrerpolicy="no-referrer" src="${hakimEscapeHtml(e.img || PLACEHOLDER_IMG)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'"><span class="rc-name">${hakimEscapeHtml(e.name || e.id)}</span></a>`).join('')}</div>`;
    eps.insertAdjacentElement('afterend', sec);
  }
  /* ---- «عرض الأعمال المرتبطة»: نافذة بكل المواسم والورشات والأعمال اللي في نفس العمل ---- */
  function openRelated() {
    const fam = window.__hkFamily || [], st = window.SITE_TEXT || {};
    const lab = e => e.workshopOf ? (st.workshopLabel || 'ورشة') : (e.level || ('الموسم ' + (e.seasonNumber || 1)));
    const m = document.createElement('div'); m.className = 'hk-rel-modal';
    m.innerHTML = `<div class="hk-rel-box" role="dialog" aria-modal="true"><div class="hk-rel-head"><b>${hakimEscapeHtml(st.relatedHeading || 'الأعمال المرتبطة')}</b><button type="button" class="hk-rel-x" aria-label="إغلاق">✕</button></div><div class="hk-rel-grid">${fam.map(e => `<a class="hk-rel-card${e.id === id ? ' current' : ''}" href="${hakimEscapeHtml(hakimCourseHref(e.id))}"><img referrerpolicy="no-referrer" loading="lazy" src="${hakimEscapeHtml(e.img || PLACEHOLDER_IMG)}" alt="" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'"><span class="rc-tag">${hakimEscapeHtml(lab(e))}</span><span class="rc-name">${hakimEscapeHtml(e.name || e.id)}</span></a>`).join('')}</div></div>`;
    const close = () => { m.remove(); document.removeEventListener('keydown', esc); };
    const esc = (ev) => { if (ev.key === 'Escape') close(); };
    m.addEventListener('click', (ev) => { if (ev.target === m || ev.target.closest('.hk-rel-x')) close(); });
    document.addEventListener('keydown', esc); document.body.appendChild(m);
  }
  function renderSeasons(entries) {
    const host = document.getElementById('seasonsSection'); if (!host) return;
    if (!entries.length) { host.innerHTML = ''; return; }
    const st = window.SITE_TEXT || {};
    /* مواسم «مترجمة فقط» (subRest): مخفية لحد ما الزائر يضغط «عرض باقي الكورس مترجم» — أو لو هو أصلًا داخل موسم منها */
    const sid = (entries[0] && (entries[0].seriesId || entries[0].id)) || id, SK = 'hakim_subrest_' + sid;
    const here = entries.find(e => e.id === id), revealed = !!(here && here.subRest) || (function () { try { return sessionStorage.getItem(SK) === '1'; } catch (e) { return false; } })();
    const hiddenSub = revealed ? [] : entries.filter(e => e.subRest && e.id !== id);
    if (hiddenSub.length) entries = entries.filter(e => !hiddenSub.includes(e));
    const restBtn = hiddenSub.length ? `<button type="button" class="btn-secondary sub-rest-btn" id="subRestBtn">${hakimEscapeHtml(st.showRestSub || 'عرض باقي الكورس مترجم')} (${hiddenSub.length})</button>` : '';
    host.innerHTML = `<h3>${hakimEscapeHtml(st.seasonsHeading || 'المواسم')} <span class="count-pill">${entries.length}</span></h3><div class="related-grid">${entries.map(e => {
      const cur = e.id === id, label = e.level || `الموسم ${e.seasonNumber || 1}`;
      return `<a class="related-card${cur ? ' current' : ''}" href="${hakimEscapeHtml(hakimCourseHref(e.id))}" data-season="${hakimEscapeHtml(e.id)}"${cur ? ' aria-current="true"' : ''}>
        <img referrerpolicy="no-referrer" src="${hakimEscapeHtml(e.img || PLACEHOLDER_IMG)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
        <span class="rc-text"><strong>${hakimEscapeHtml(label)}</strong><small>${e.videosCount || 0} حلقة${cur ? ' · الموسم المختار' : ''}</small></span>
      </a>`;
    }).join('')}</div>${restBtn}`;
    const rb = host.querySelector('#subRestBtn');
    if (rb) rb.addEventListener('click', () => { try { sessionStorage.setItem(SK, '1'); } catch (e) {} renderSeasons(seasonEntries.length ? seasonEntries : entries.concat(hiddenSub)); });
    host.querySelectorAll('a[data-season]').forEach(a => a.addEventListener('click', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return; /* فتح في تبويب جديد بيشتغل عادي */
      ev.preventDefault(); selectSeason(a.dataset.season);
    }));
  }

  /* ===== مراحل الوصول للفيديو داخل نفس الصفحة: (1) معلومات + مواسم + حلقات ← (2) المشغّل ===== */
  let selectedIndex = -1, playingView = false, pushedPlayer = false, savedScroll = 0, seasonEntries = [], infoBase = {};
  const seasonCache = {};
  function seasonLabelOf(d) { return d.level || ((d.seasonNumber || 1) > 1 ? `الموسم ${d.seasonNumber}` : ''); }
  /* بيضمن وجود هيكل المرحلتين حتى لو الصفحة اتولّدت بقالب قديم */
  function ensureViews() {
    if (!pageBody || (document.getElementById('infoView') && document.getElementById('playerView'))) return;
    const mk = (tag, idv, cls) => { let e = document.getElementById(idv); if (!e) { e = document.createElement(tag); e.id = idv; if (cls) e.className = cls; } return e; };
    const infoView = document.createElement('div'); infoView.id = 'infoView';
    const playerView = document.createElement('div'); playerView.id = 'playerView'; playerView.className = 'player-view'; playerView.hidden = true;
    const eps = mk('section', 'episodesSection', 'episodes-section');
    eps.append(mk('div', 'pageNumbers', 'page-numbers'), mk('div', 'lessonList', 'lesson-list'), mk('div', 'playBar', 'play-bar'));
    infoView.append(mk('div', 'banner', 'course-banner'), mk('div', 'infoSection', 'info-section'), mk('div', 'courseRatingHost', 'course-rating-host'), mk('section', 'seasonsSection', 'seasons-section'), eps);
    const back = document.createElement('button'); back.type = 'button'; back.id = 'backToSelect'; back.className = 'back-link player-back'; back.textContent = '← رجوع للمعلومات والحلقات';
    const title = mk('h1', 'watchTitle', 'watch-title');
    playerView.append(back, title, mk('div', 'playerShell', 'player-shell'), mk('div', 'playerNav', 'player-nav'), mk('div', 'watchActions', 'watch-actions'));
    const shell = playerView.querySelector('#playerShell');
    ['playerHost', 'videoStatsRow', 'nowPlaying'].forEach(x => { const e = mk('div', x, x === 'videoStatsRow' ? 'video-stats-row' : x === 'nowPlaying' ? 'now-playing-title' : ''); shell.appendChild(e); });
    const rel = document.getElementById('relatedSeasons'); if (rel) rel.remove();
    pageBody.replaceChildren(infoView, playerView);
  }
  function selectEpisode(i) {
    selectedIndex = i;
    if (playingView) { playLesson(i, true); renderLessonList(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }   /* من صفحة المشاهدة: الضغط على مكعب بيشغّل الحلقة فورًا */
    renderLessonList(); renderPlayBar();
  }
  function renderPlayBar() {
    const host = document.getElementById('playBar'); if (!host) return;
    const v = currentVideos[selectedIndex];
    if (!v) { host.innerHTML = currentVideos.length ? '<p class="play-hint">اختر حلقة من فوق، وبعدها اضغط تشغيل 👆</p>' : ''; return; }
    host.innerHTML = `<div class="play-bar-inner"><span class="play-bar-text">الحلقة المختارة: <b>${hakimEscapeHtml(v.title || ('الحلقة ' + episodeNumber(selectedIndex)))}</b></span><button type="button" class="play-cta" id="playSelBtn">▶ تشغيل</button></div>`;
    document.getElementById('playSelBtn').addEventListener('click', () => openPlayer(selectedIndex, true));
  }
  function showPlayerView() {
    const iv = document.getElementById('infoView'), pv = document.getElementById('playerView');
    if (iv) iv.hidden = true; if (pv) pv.hidden = false;
    document.body.classList.add('is-player'); playingView = true; window.scrollTo(0, 0);
    /* قائمة الحلقات (المكعبات + الترقيم) بتتنقل لصفحة المشاهدة عشان الوصول يبقى سهل */
    const eps = document.getElementById('episodesSection'), wa = document.getElementById('watchActions');
    if (eps && pv && wa && eps.parentNode !== pv) { if (!eps.__ph) { eps.__ph = document.createComment('eps'); eps.parentNode.insertBefore(eps.__ph, eps); } pv.insertBefore(eps, wa); }
  }
  function showInfoView(restore) {
    try { playerHost.innerHTML = ''; videoStatsRow.innerHTML = ''; nowPlaying.innerHTML = ''; } catch (e) {}
    const iv = document.getElementById('infoView'), pv = document.getElementById('playerView');
    const eps = document.getElementById('episodesSection');
    if (eps && eps.__ph && eps.__ph.parentNode && eps.parentNode !== eps.__ph.parentNode) eps.__ph.parentNode.insertBefore(eps, eps.__ph.nextSibling);
    if (pv) pv.hidden = true; if (iv) iv.hidden = false;
    document.body.classList.remove('is-player'); playingView = false; restoreCourseSeo();
    selectedIndex = currentIndex; renderLessonList(); renderPlayBar(); updateCta();
    if (restore) window.scrollTo(0, savedScroll);
  }
  async function openPlayer(index, autoplay, opts) {
    savedScroll = window.pageYOffset || 0;
    showPlayerView();
    if (!(opts && opts.noPush)) { syncEpisodeUrl(index, true); pushedPlayer = true; }
    await playLesson(index, autoplay);
  }
  function backToSelection() {
    if (pushedPlayer) { pushedPlayer = false; history.back(); return; }
    syncEpisodeUrl(-1); showInfoView(true);
  }
  window.addEventListener('popstate', () => {
    if (playingView) { pushedPlayer = false; showInfoView(true); return; }
    const ep = parseInt(new URL(location.href).searchParams.get('ep'), 10) || (((location.pathname.match(/\/ep(\d+)\.html$/) || [])[1]) | 0);
    if (history.state && history.state.hkView === 'player' && ep >= 1 && ep <= currentVideos.length) { pushedPlayer = true; showPlayerView(); playLesson(ep - 1, false); }
  });
  function resumeIndexFor(courseId) {
    try { const lw = JSON.parse(localStorage.getItem('hakim_last_watch')); if (lw && lw.id === courseId && lw.index >= 0 && lw.index < currentVideos.length) return lw.index; } catch (e) {}
    /* آخر حلقة وقف عندها في الكورس ده حتى لو شاف كورسات تانية بعده */
    try { const m = JSON.parse(localStorage.getItem('hakim_last_eps') || '{}'); const r = m[courseId]; if (r && r.index >= 0 && r.index < currentVideos.length) return r.index; } catch (e) {}
    return -1;
  }
  function updateCta() {
    const host = document.getElementById('ctaHost'); if (!host) return;
    if (!currentVideos.length) { host.innerHTML = ''; return; }
    const r = resumeIndexFor(id), idx = r >= 0 ? r : 0;
    host.innerHTML = `<button type="button" class="play-cta" id="playCta">▶ ${r >= 0 ? hakimEscapeHtml(hakimTx('resumeEp', 'كمّل من حلقة {n}', { n: episodeNumber(idx) })) : hakimEscapeHtml(hakimTx('startCta', 'ابدأ المشاهدة'))}</button>`;
    document.getElementById('playCta').addEventListener('click', () => openPlayer(idx, true));
  }
  function refreshInfo() {
    const seasonsCount = seasonEntries.length || 1;
    const totalEpisodes = seasonEntries.reduce((n, e) => n + (e.videosCount || 0), 0) || currentVideos.length;
    renderInfo(Object.assign({}, infoBase, {
      levelsCount: String(seasonsCount),
      episodesCount: totalEpisodes,
      seasonEpisodes: seasonsCount > 1 ? currentVideos.length : ''
    }));
  }
  async function selectSeason(sid) {
    if (!sid || sid === id) return;
    let d = seasonCache[sid];
    if (!d) {
      lessonListEl.innerHTML = '<p class="play-hint">جارٍ تحميل حلقات الموسم...</p>';
      try { await hakimLoadScript(`${sid}.js`); d = (window.__HAKIM_COURSES || {})[sid]; } catch (e) {}
    }
    if (!d) { renderLessonList(); if (typeof hakimToast === 'function') hakimToast('تعذّر تحميل الموسم، جرّب تاني', 'error'); return; }
    seasonCache[sid] = d;
    id = sid; currentVideos = d.videos || []; srvVideo = d.videoServers || []; srvDl = d.downloadServers || [];
    courseMeta = { name: d.name || courseMeta.name, img: d.img || courseMeta.img, playback: d.playback || {}, seasonLabel: seasonLabelOf(d) };
    currentIndex = resumeIndexFor(sid); selectedIndex = currentIndex;
    activePage = pageOf(Math.max(0, currentIndex));
    syncEpisodeUrl(-1);
    renderSeasons(seasonEntries); renderPageNumbers(); renderLessonList(); renderPlayBar(); updateCta(); refreshInfo();
  }

  function renderCourseActionsRow(courseId) {
    const host = document.getElementById('courseActionsRow');
    if (!host) return;

    function draw() {
      const isFav = hakimIsFavorite(courseId);
      const isFollow = hakimIsFollowing(courseId);
      const cd = (window.__HAKIM_COURSES || {})[courseId] || {};
      const st = window.SITE_TEXT || {};
      host.innerHTML = `
        <button class="mylists-action-btn ${isFav ? 'active' : ''}" id="favBtn">${FAV_ICON}<span>${isFav ? hakimEscapeHtml(st.favActiveBtn || 'في المفضلة') : hakimEscapeHtml(st.favAddBtn || 'أضف للمفضلة')}</span></button>
        ${(cd && cd.info && cd.info.status === 'ongoing') ? `<button class="mylists-action-btn ${isFollow ? 'active' : ''}" id="followBtn">${FOLLOW_ICON}<span>${isFollow ? hakimEscapeHtml(st.followActiveBtn || 'متابَع') : hakimEscapeHtml(st.followAddBtn || 'تابع الكورس')}</span></button>` : ''}
        <button class="mylists-action-btn ${hakimIsLater(courseId) ? 'active' : ''}" id="laterBtn">${LATER_ICON}<span>${hakimIsLater(courseId) ? hakimEscapeHtml(st.laterActiveBtn || 'في المشاهدة لاحقًا') : hakimEscapeHtml(st.laterAddBtn || 'أضف إلى المشاهدة لاحقًا')}</span></button>
        <div class="playlist-picker">
          <button class="mylists-action-btn" id="playlistBtn">${PLAYLIST_ICON}<span>${hakimEscapeHtml(st.addToPlaylistBtn || 'أضف لقائمة تشغيل')}</span></button>
          <div class="playlist-picker-panel" id="playlistPanel"></div>
        </div>
        <button class="mylists-action-btn" id="shareBtn">${SHARE_ICON}<span>${hakimEscapeHtml(st.shareBtn || 'مشاركة')}</span></button>
        ${(window.__hkFamily || []).length > 1 ? `<button class="mylists-action-btn" id="relBtn"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg><span>${hakimEscapeHtml(st.relatedBtn || 'عرض الأعمال المرتبطة')}</span></button>` : ''}`;
      { const rb = document.getElementById('relBtn'); if (rb) rb.addEventListener('click', openRelated); }

      document.getElementById('shareBtn').addEventListener('click', async () => {
        const url = (document.head.querySelector('link[rel="canonical"]') || {}).href || location.href.split('#')[0];
        const h1 = document.querySelector('h1');
        const title = (h1 && h1.textContent.trim()) || document.title;
        if (navigator.share) {
          try { await navigator.share({ title, text: title, url }); return; }
          catch (e) { if (e && e.name === 'AbortError') return; }
        }
        let copied = false;
        try { await navigator.clipboard.writeText(url); copied = true; } catch (e) {}
        if (!copied) {
          const ta = document.createElement('textarea'); ta.value = url; ta.style.cssText = 'position:fixed;opacity:0';
          document.body.appendChild(ta); ta.select();
          try { copied = document.execCommand('copy'); } catch (e) {}
          ta.remove();
        }
        hakimToast(copied ? (st.shareCopiedToast || 'تم نسخ رابط الكورس') : url, copied ? 'success' : 'error');
      });

      document.getElementById('favBtn').addEventListener('click', () => {
      if (window.hakimAuthGate && hakimAuthGate('سجّل دخولك عشان تحفظ وتتابع كورساتك')) return; 
        const added = hakimToggleFavorite(courseId);
        hakimToast(added ? (st.favAddedToast || 'اتحفظ في المفضلة ✅ هتلاقيه دايمًا في «قوائمي»') : (st.favRemovedToast || 'أُزيل من المفضلة'), 'success');
        draw();
      });
      const laterBtn = document.getElementById('laterBtn');
      if (laterBtn) laterBtn.addEventListener('click', () => {
        if (window.hakimAuthGate && hakimAuthGate('سجّل دخولك عشان تضيف للمشاهدة لاحقًا')) return;
        const added = hakimToggleLater(courseId);
        hakimToast(added ? (st.laterAddedToast || 'اتحفظ للمشاهدة لاحقًا ✅ هتلاقيه في «قوائمي»') : (st.laterRemovedToast || 'اتشال من المشاهدة لاحقًا'), 'success');
        draw();
      });
      const followBtnEl = document.getElementById('followBtn');
      if (followBtnEl) followBtnEl.addEventListener('click', async () => {
        if (window.hakimAuthGate && hakimAuthGate('سجّل دخولك عشان تتابع الكورسات')) return;
        const added = hakimToggleFollowing(courseId);
        hakimToast(added ? (st.followAddedToast || 'أنت الآن تتابع هذا الكورس ✅ هتلاقيه في «قوائمي»') : (st.followRemovedToast || 'تم إلغاء المتابعة'), 'success');
        draw();
        /* إشعارات فعلية (OneSignal) لو الأدمن فعّلها: المتابعة = اشتراك في حلقات الكورس الجديدة */
        try {
          await hakimLoadScript('push-config.js');
          if (!(window.PUSH_CONFIG && PUSH_CONFIG.enabled && PUSH_CONFIG.appId)) return;
          await hakimLoadScript('push-client.js');
          const TT = window.SITE_TEXT || {};
          const r = added ? await HakimPush.follow(courseId) : await HakimPush.unfollow(courseId);
          if (r === 'ok') {
            hakimSbInsert('push_follow_events', { course_id: String(courseId), session_id: hakimSessionId(), action: added ? 'follow' : 'unfollow' });
            if (added) hakimToast(TT.pushOn || 'هتوصلك إشعارات بالحلقات الجديدة 🔔', 'success');
          } else if (added && r === 'denied') hakimToast(TT.pushDenied || 'الإشعارات مقفولة من المتصفح — فعّلها من إعدادات الموقع عشان توصلك الحلقات الجديدة', 'error');
          else if (added && r === 'unsupported') hakimToast(TT.pushUnsupported || 'متصفحك مش بيدعم الإشعارات — هتلاقي الكورس في «قوائمي»', 'error');
          else if (added && r === 'error') hakimToast(TT.pushError || 'تعذّر تفعيل الإشعارات دلوقتي — جرّب تاني بعد شوية', 'error');
        } catch (e) {}
      });

      const plBtn = document.getElementById('playlistBtn');
      const plPanel = document.getElementById('playlistPanel');
      function renderPlaylistPanel() {
        const d = hakimGetMyLists();
        let html = '';
        if (d.playlists.length === 0) {
          html += `<p class="mylists-empty-hint">${hakimEscapeHtml(st.noPlaylistsHint || 'لا توجد قوائم تشغيل بعد — أنشئ واحدة من زر "قوائمي" في الأعلى.')}</p>`;
        } else {
          html += d.playlists.map(pl => `
            <label class="playlist-check-row">
              <input type="checkbox" data-pl="${pl.id}" ${pl.courseIds.includes(courseId) ? 'checked' : ''}>
              <span>${hakimEscapeHtml(pl.name)} (${pl.courseIds.length})</span>
            </label>`).join('');
        }
        plPanel.innerHTML = html;
        plPanel.querySelectorAll('input[type=checkbox]').forEach(cb => {
          cb.addEventListener('change', () => {
            if (window.hakimAuthGate && hakimAuthGate('سجّل دخولك عشان تعمل قوائم وتحفظ كورساتك')) { cb.checked = !cb.checked; return; }
            const added = hakimTogglePlaylistCourse(cb.dataset.pl, courseId);
            hakimToast(added ? 'أُضيف للقائمة' : 'أُزيل من القائمة', 'success');
          });
        });
      }
      plBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = plPanel.classList.contains('show');
        if (open) { plPanel.classList.remove('show'); }
        else { renderPlaylistPanel(); plPanel.classList.add('show'); }
      });
      document.addEventListener('click', (e) => {
        if (plPanel.classList.contains('show') && !plPanel.contains(e.target) && e.target !== plBtn) {
          plPanel.classList.remove('show');
        }
      });
    }

    draw();
  }

  /* معلومات عن العمل: آخر حاجة في صفحة الكورس — أول سطر + "عرض المزيد". بتتخبّز جاهزة في HTML (للسيو) وبتتبني هنا لو الصفحة قديمة */
  function renderWorkInfo(data) {
    const T = window.SITE_TEXT || {};
    let host = document.getElementById('workInfoBlock');
    if (!host) { const ep = document.getElementById('episodesSection'); if (!ep || !ep.parentNode) return; host = document.createElement('section'); host.className = 'work-info'; host.id = 'workInfoBlock'; ep.parentNode.insertBefore(host, ep.nextSibling); }
    if (host.dataset.baked !== '1') {
      const tpl = (window.SITE_SETTINGS || {}).workInfoTemplate || '', vals = (data && data.workInfo && data.workInfo.values) || [];
      if (!tpl || !vals.some(Boolean)) { host.innerHTML = ''; return; }
      let i = 0;
      const lines = tpl.replace(/(?<![A-Za-z0-9])[Xx](?![A-Za-z0-9])/g, () => (vals[i++] || '').trim()).split('\n').map(s => s.trim()).filter(Boolean);
      if (!lines.length) { host.innerHTML = ''; return; }
      host.innerHTML = `<h3>${hakimEscapeHtml(T.workInfoHeading || 'معلومات عن العمل')}</h3><p class="wi-first">${hakimEscapeHtml(lines[0])}</p>` +
        (lines.length > 1 ? `<div class="wi-more" hidden>${lines.slice(1).map(l => `<p>${hakimEscapeHtml(l)}</p>`).join('')}</div><button type="button" class="wi-toggle">${hakimEscapeHtml(T.workInfoMore || 'عرض المزيد')}</button>` : '');
    }
    const h3 = host.querySelector('h3'); if (h3 && T.workInfoHeading) h3.textContent = T.workInfoHeading;
    const btn = host.querySelector('.wi-toggle'), more = host.querySelector('.wi-more');
    if (btn && more && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => { const open = more.hidden; more.hidden = !open; btn.textContent = open ? (T.workInfoLess || 'عرض أقل') : (T.workInfoMore || 'عرض المزيد'); });
    }
  }
  async function init() {
    siteSettingsCache = await hakimApplySiteSettings();
    hakimInjectCustomCode();
    if (hakimShowMaintenanceIfNeeded()) return;
    await hakimLoadScript('site-text.js');
    hakimLoadScript('vitals.js'); /* قياس قوة المنصة (غير متزامن) */
    hakimLoadScript('ads.js'); /* الإعلانات: بتشتغل بس لو متفعّلة من الأدمن، وممنوعة بالكامل على الصفحات الرئيسية */
    await hakimLoadScript('media-utils.js?v=2');
    hakimAddTelegramButton();
    hakimInitInstallButton();

    if (!id) { showError('لم يتم تحديد كورس', 'الرابط لا يحتوي على معرّف كورس صالح.'); return; }

    /* الصفحة المولَّدة: بيانات الكورس مدمجة جوّاها. الصفحة العامة (القالب): ندوّر على ملف قديم .js وإلا نحوّل لصفحة الكورس */
    let ok = false;
    const inline = document.getElementById('course-data');
    if (inline) {
      try { window.__HAKIM_COURSES = window.__HAKIM_COURSES || {}; window.__HAKIM_COURSES[id] = JSON.parse(inline.textContent); ok = true; } catch (e) { console.warn('course-data', e); }
    } else {
      ok = await hakimLoadScript(`${id}.js`);
      if (!ok && !window.__COURSE_ID) { location.replace(`${hakimCourseHref(id)}`); return; }
    }
    const data = (window.__HAKIM_COURSES || {})[id];

    if (!ok || !data) {
      showError('تعذّر العثور على هذا الكورس', 'تأكد من صحة الرابط أو من وجود ملف بيانات الكورس.');
      return;
    }

    /* كورس مجدول: لسه ما جاش موعد ظهوره */
    if (!window.__HAKIM_PREVIEW && data.publishAt && Date.parse(data.publishAt) > Date.now()) {
      const at = Date.parse(data.publishAt);
      const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m);
      document.title = 'قريبًا — ' + (data.name || '');
      const mainEl = document.querySelector('main');
      mainEl.innerHTML = `<div style="text-align:center;padding:90px 16px"><div style="font-size:3rem">⏳</div><h2 style="margin:12px 0 6px">${hakimEscapeHtml(data.name || '')}</h2><p style="color:var(--text-muted);margin:0 0 6px">هذا الكورس سيتوفر قريبًا</p><p id="soonWhen" style="font-weight:800;font-size:1.1rem;margin:0 0 18px"></p><a class="hero-btn" href="index.html" style="display:inline-block;background:var(--red);color:#fff;padding:10px 24px;border-radius:999px;font-weight:800">العودة للرئيسية</a></div>`;
      const tick = () => {
        const left = at - Date.now();
        if (left <= 0) { location.reload(); return; }
        const d = Math.floor(left / 86400000), h = Math.floor(left % 86400000 / 3600000), mi = Math.floor(left % 3600000 / 60000);
        document.getElementById('soonWhen').textContent = 'يظهر بعد ' + (d ? d + ' يوم و' : '') + h + ' ساعة و' + mi + ' دقيقة';
      };
      tick(); setInterval(tick, 30000);
      return;
    }
    try { applyCourseSeo(id, data); } catch (e) { console.warn('seo', e); }
    window.__HK_CUR_COURSE = id; if (performance.now() > 8000) hakimHealth('slow_load', id, null, Math.round(performance.now()) + 'ms');
    if (data.archived) { const mn = document.querySelector('main'); if (mn) mn.insertAdjacentHTML('afterbegin', '<div style="margin:0 0 12px;padding:10px 14px;border-radius:10px;border:1px solid rgba(160,120,255,.5);background:rgba(160,120,255,.14);font-weight:700;text-align:center">🗄️ مؤرشف — الكورس ده مش ظاهر في قوائم الموقع حاليًا</div>'); }
    /* كورس مخفي (مش في courses-list.js): الصفحة المولَّدة ثابتة فبنمنع فهرستها وقت العرض. لو القائمة ما اتحمّلتش ما نعملش حاجة */
    if (!window.__HAKIM_PREVIEW) hakimLoadScript('courses-list.js').then(() => {
      const l = window.COURSES_LIST;
      if (Array.isArray(l) && !l.includes(id) && !document.querySelector('meta[name="robots"]')) {
        const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m);
      }
    });
    hakimTrackPageView('course', id);
    ensureViews();

    currentVideos = data.videos || []; srvVideo = data.videoServers || []; srvDl = data.downloadServers || [];
    courseMeta = { name: data.name || '', img: data.img || '', playback: data.playback || {}, seasonLabel: seasonLabelOf(data) };
    seasonCache[pageId] = data;
    infoBase = data.info || {};
    const info0 = infoBase;

    /* مواسم العمل (تلقائي) */
    try { seasonEntries = await loadSeries(id, data); } catch (e) { console.warn('series', e); }
    const seasonsCount = seasonEntries.length || 1;
    const totalEpisodes = seasonEntries.reduce((n, e) => n + (e.videosCount || 0), 0) || currentVideos.length;
    const statusLabel = STATUS_LABELS[info0.status] || '';

    banner.innerHTML = `
      <div class="banner-img">
        <img referrerpolicy="no-referrer" loading="lazy" src="${data.img ? hakimEscapeHtml(window.hakimImgUrl ? hakimImgUrl(data.img, 300) : data.img) : PLACEHOLDER_IMG}" alt="${hakimEscapeHtml(data.name || '')}"
             onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}'">
      </div>
      <div>
        <h1>${hakimEscapeHtml(seoH1(data))}</h1>
        ${data.nameEn ? `<div class="banner-en" dir="ltr">${hakimEscapeHtml(data.nameEn)}</div>` : ''}
        <p class="banner-desc">${hakimEscapeHtml(data.description || '')}</p>
        <div class="badges">
          ${data.category ? `<span>${hakimEscapeHtml(data.category)}</span>` : ''}
          ${statusLabel ? `<span>${hakimEscapeHtml(statusLabel)}</span>` : ''}
          ${info0.dubType ? `<span class="hk-dub ${hakimEscapeHtml(info0.dubType)}">${({ sub: 'مترجم', dub: 'مدبلج', both: 'مترجم ومدبلج' })[info0.dubType] || ''}</span>` : ''}
          <span class="hk-rate hk-rate-head" id="headRate" hidden></span>
          ${(data.categories || []).map(c => `<span>${hakimEscapeHtml(c)}</span>`).join('')}
          ${(info0.releaseDate || []).map(r => `<span>${RELEASE_DATE_LABELS[r] || r}</span>`).join('')}
          ${info0.minAge ? `<span class="age-warn" title="غير مناسب لمن هم أقل من ${hakimEscapeHtml(String(info0.minAge))} سنة">🚫 ${hakimEscapeHtml(String(info0.minAge))}+</span>` : ''}
          <span>${seasonsCount === 1 ? 'موسم واحد' : seasonsCount + ' مواسم'}</span>
          <span>${totalEpisodes} حلقة</span>
        </div>
        <div id="ctaHost"></div>
        <div class="course-actions-row" id="courseActionsRow"></div>
      </div>`;
    banner.querySelectorAll('img').forEach(hakimLazyFade);
    /* تقييم الكورس في رأس الصفحة (نفس رقم الكروت) */
    (async () => { try { if (!hakimSbReady()) return; const avg = await hakimSbRpc('get_course_rating', { p_course_id: pageId }); const el = document.getElementById('headRate'); if (el && avg != null && !isNaN(parseFloat(avg))) { el.innerHTML = '<b>★</b> ' + parseFloat(avg).toFixed(1); el.hidden = false; } } catch (e) {} })();

    renderCourseActionsRow(pageId);
    renderSeasons(seasonEntries);
    renderWorkshops();
    refreshInfo();
    await renderCourseRatingWidget();

    const back = document.getElementById('backToSelect'); if (back) back.addEventListener('click', backToSelection);

    /* موسم محدد في الرابط (?s=) */
    const sParam = params.get('s');
    if (sParam && sParam !== id && seasonEntries.some(e => e.id === sParam)) await selectSeason(sParam);

    if (currentVideos.length === 0) {
      lessonListEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem">${hakimEscapeHtml((window.SITE_TEXT && window.SITE_TEXT.noVideosYet) || 'لا توجد فيديوهات مضافة لهذا الكورس بعد.')}</p>`;
      return;
    }

    /* رابط فيه ?ep= (مشاركة / متابعة المشاهدة / معاين الأدمن) ← يفتح مرحلة المشغّل مباشرة */
    const epParam = window.__HAKIM_PREVIEW ? (parseInt(window.__HAKIM_PREVIEW_EP, 10) + 1) : (parseInt(params.get('ep'), 10) || window.__STATIC_EP || NaN);
    const resumeIdx = resumeIndexFor(id);
    currentIndex = resumeIdx; selectedIndex = resumeIdx;
    activePage = pageOf(Math.max(0, resumeIdx));
    renderPageNumbers(); renderLessonList(); renderPlayBar(); updateCta();
    try { renderWorkInfo(data); } catch (e) {}
    if (epParam >= 1 && epParam <= currentVideos.length) {
      await openPlayer(epParam - 1, !!window.__HAKIM_PREVIEW, { noPush: true });
      if (window.__HAKIM_PREVIEW) setTimeout(() => { try { playerHost.scrollIntoView({ block: 'center' }); } catch (e) {} }, 400);
    }
  }

  init();
  hakimInitTheme();
  hakimInitMenu();
  hakimInitMyListsMenu();
  hakimInitSectionsMenu();
})();

/* ===== كورسات مشابهة (نفس الفئات فقط، من نفس القسم) + وضع التركيز ===== */
(function () {
  function tx(k, d) { return (window.SITE_TEXT && window.SITE_TEXT[k]) || d; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function cats(e) { var s = {}; [e.category].concat(e.categories || []).forEach(function (x) { if (x) s[String(x).trim()] = 1; }); return s; }
  function inSec(e, cur) { var a = e.menuSection || '', b = cur.menuSection || ''; return a === b || (e.extraSections || []).indexOf(b || 'home') > -1 || (cur.extraSections || []).indexOf(a || 'home') > -1; }
  async function similar() {
    var host = document.getElementById('infoView'); if (!host || document.getElementById('similarSection')) return;
    try { if (!window.COURSES_INDEX) await hakimLoadScript('courses-index.js'); } catch (e) { return; }
    var idx = window.COURSES_INDEX || {}, pid = (typeof pageId !== 'undefined' && pageId) || (window.location.pathname.split('/').pop() || '').replace(/\.html.*$/, '');
    var cur = idx[pid]; if (!cur) return;
    var mine = cats(cur); if (!Object.keys(mine).length) return;
    var cand = Object.keys(idx).filter(function (k) { var e = idx[k]; return k !== pid && e && !(e.seasonNumber > 1) && e.seriesId !== cur.seriesId && inSec(e, cur) && !(typeof hakimVisibleNow === 'function' && !hakimVisibleNow(e)); })
      .map(function (k) { var o = 0, c = cats(idx[k]); Object.keys(mine).forEach(function (x) { if (c[x]) o++; }); return { id: k, e: idx[k], o: o }; })
      .filter(function (x) { return x.o > 0; });
    if (!cand.length) return;
    var seed = 0; for (var i = 0; i < pid.length; i++) seed = (seed * 31 + pid.charCodeAt(i)) >>> 0;
    cand.sort(function (a, b) { return b.o - a.o || (((a.id.charCodeAt(0) * 7 + seed) % 13) - ((b.id.charCodeAt(0) * 7 + seed) % 13)); });
    var n = window.matchMedia && matchMedia('(max-width: 720px)').matches ? 1 : 4;   /* على التليفون كورس واحد بس */
    var sec = document.createElement('section'); sec.id = 'similarSection'; sec.className = 'similar-section';
    sec.innerHTML = '<h2 class="similar-title">' + esc(tx('similarTitle', 'كورسات مشابهة قد تعجبك')) + '</h2><div class="similar-grid">' + cand.slice(0, n).map(function (x) {
      return '<a class="similar-card" href="' + esc(hakimCourseHref(x.id)) + '"><div class="similar-img">' + (x.e.img ? '<img loading="lazy" referrerpolicy="no-referrer" src="' + esc(x.e.img) + '" alt="' + esc(x.e.name) + '" onerror="this.remove()">' : '<span>📚</span>') + (x.e.category ? '<em>' + esc(x.e.category) + '</em>' : '') + '</div><div class="similar-name">' + esc(x.e.name) + '</div></a>';
    }).join('') + '</div>';
    host.appendChild(sec);
  }
  function focusMode() {
    var pv = document.getElementById('playerView'), shell = document.getElementById('playerShell');
    if (!pv || !shell || document.getElementById('hkFocusBtn')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'hkFocusBtn'; b.className = 'hk-focus-btn'; b.textContent = tx('focusOn', '🎯 وضع التركيز');
    shell.parentNode.insertBefore(b, shell);
    var x = document.createElement('button'); x.type = 'button'; x.className = 'hk-focus-exit'; x.hidden = true; x.textContent = tx('focusOff', '✕ إنهاء وضع التركيز'); document.body.appendChild(x);
    function set(on) { document.body.classList.toggle('hk-focus', on); x.hidden = !on; if (on) window.scrollTo({ top: 0 }); }
    b.addEventListener('click', function () { set(true); });
    x.addEventListener('click', function () { set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('hk-focus')) set(false); });
    new MutationObserver(function () { if (pv.hidden && document.body.classList.contains('hk-focus')) set(false); }).observe(pv, { attributes: true, attributeFilter: ['hidden'] });
  }
  /* بنستنى لحد ما صفحة الكورس تترسم (من غير ما نلمس خطوات التحميل الأصلية) */
  var tries = 0, timer = setInterval(function () {
    tries++; var ban = document.getElementById('banner');
    if (ban && ban.children.length) { clearInterval(timer); try { similar(); } catch (e) {} try { focusMode(); } catch (e) {} }
    else if (tries > 30) clearInterval(timer);
  }, 400);
})();
