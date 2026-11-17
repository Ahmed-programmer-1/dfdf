/* عميل إشعارات OneSignal (بيتحمّل عند الحاجة بس — لما المستخدم يضغط «متابعة» على كورس مستمر) */
(function () {
  if (window.HakimPush) return;
  var cfg = function () { return window.PUSH_CONFIG || {}; };
  var dir = function () { try { return new URL('.', document.baseURI).pathname; } catch (e) { return location.pathname.replace(/[^\/]*$/, ''); } };   /* جذر الموقع من <base>: /A/ على GitHub Pages، و/ على دومين — وبيشتغل صح في الصفحات المتداخلة كمان */
  var ready = null;
  function enabled() { return !!(cfg().enabled && cfg().appId); }
  function supported() { return 'serviceWorker' in navigator && 'Notification' in window && 'PushManager' in window; }
  function load() {
    if (ready) return ready;
    ready = new Promise(function (resolve, reject) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function (OS) {
        try {
          await OS.init({
            appId: cfg().appId,
            serviceWorkerPath: dir().replace(/^\//, '') + 'push/onesignal/OneSignalSDKWorker.js',
            serviceWorkerParam: { scope: dir() + 'push/onesignal/' },
            notifyButton: { enable: false },
            welcomeNotification: { disable: true },
            allowLocalhostAsSecureOrigin: true
          });
          try { var u = window.HakimAccount && HakimAccount.user; if (u && u.id) await OS.login(String(u.id)); } catch (e) {}
          resolve(OS);
        } catch (e) { reject(e); }
      });
      var s = document.createElement('script'); s.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'; s.defer = true; s.onerror = function () { reject(new Error('sdk')); };
      document.head.appendChild(s);
    });
    return ready;
  }
  function mine() { try { return JSON.parse(localStorage.getItem('hakim_push_courses')) || []; } catch (e) { return []; } }
  function setMine(a) { try { localStorage.setItem('hakim_push_courses', JSON.stringify(a)); } catch (e) {} }
  var tag = function (id) { return 'c_' + id; };
  window.HakimPush = {
    enabled: enabled, supported: supported, tag: tag,
    /* بيرجّع: ok | denied | unsupported | off | error */
    follow: async function (courseId) {
      if (!enabled()) return 'off';
      if (!supported()) return 'unsupported';
      try {
        var OS = await load();
        if (!OS.Notifications.permission) await OS.Notifications.requestPermission();
        if (!OS.Notifications.permission) return 'denied';
        await OS.User.addTag(tag(courseId), '1');
        var a = mine(); if (a.indexOf(courseId) < 0) a.push(courseId); setMine(a);
        return 'ok';
      } catch (e) { return 'error'; }
    },
    unfollow: async function (courseId) {
      if (!enabled() || !supported()) return 'off';
      try { var OS = await load(); await OS.User.removeTag(tag(courseId)); setMine(mine().filter(function (x) { return x !== courseId; })); return 'ok'; }
      catch (e) { return 'error'; }
    }
  };
})();
