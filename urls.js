/* مولّد روابط الأعمال والحلقات — مصدر واحد لكل الصفحات.
   الشكل:  /course/<العمل>/            ← صفحة العمل (الموسم الأول)
           /course/<العمل>/s2/          ← صفحة الموسم الثاني
           /course/<العمل>/s1/ep5.html   ← صفحة الحلقة
   كلمة "course" في الرابط = إعداد urlWord (الأدمن ← محرر النصوص). لو غيّرتها لازم "إعادة توليد كل الصفحات". */
(function () {
  var W = window;
  function word() {
    var w = W.__HK_URLWORD || (W.SITE_TEXT && W.SITE_TEXT.urlWord) || (W.SITE_SETTINGS && W.SITE_SETTINGS.urlWord) || 'course';
    w = String(w).toLowerCase().replace(/[^a-z0-9-]/g, '');
    return w || 'course';
  }
  function parts(id) {
    var e = (W.COURSES_INDEX || {})[id] || null;
    var root = (e && e.seriesId) || id, s = e ? (parseInt(e.seasonNumber, 10) || 1) : 1;
    return { root: root, s: s };
  }
  function eps() { return !(W.SITE_SETTINGS && W.SITE_SETTINGS.episodePages === false); }
  W.hakimUrlWord = word;
  /* المسارات نسبية لجذر الموقع (من غير / في الأول) عشان تشتغل على جذر دومين وكمان تحت اسم الريبو على GitHub Pages (/REPO/).
     الصفحات الجذرية بتحلّها نسبةً لمكانها، والصفحات المتداخلة فيها <base href> فبتتحل نسبةً لجذر الموقع. */
  W.hakimCoursePath = function (id) { var p = parts(id); return word() + '/' + encodeURIComponent(p.root) + '/' + (p.s > 1 ? 's' + p.s + '/' : ''); };
  W.hakimEpPath = function (id, n) { var p = parts(id); return word() + '/' + encodeURIComponent(p.root) + '/s' + p.s + '/ep' + n + '.html'; };
  /* رابط مطلق (للـpushState والـcanonical): بيتحل نسبةً لـ document.baseURI */
  W.hakimAbsUrl = function (rel) { try { return new URL(rel, document.baseURI).href; } catch (e) { return rel; } };
  /* href جاهز: بدون n = صفحة العمل، ومعاه n = صفحة الحلقة (أو ?ep= لو صفحات الحلقات مقفولة / أكتر من 300) */
  W.hakimCourseHref = function (id, n) {
    n = parseInt(n, 10);
    if (!n || n < 1) return W.hakimCoursePath(id);
    return (eps() && n <= 300) ? W.hakimEpPath(id, n) : W.hakimCoursePath(id) + '?ep=' + n;
  };
})();
