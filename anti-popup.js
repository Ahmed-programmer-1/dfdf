/**
 * anti-popup.js
 * سكريبت بسيط تحطه في موقعك عشان يمنع الإعلانات المنبثقة (popup/popunder)
 * اللي بعض خدمات استضافة الفيديو بتحقنها تلقائياً في صفحتك.
 *
 * إزاي تستخدمه:
 * حط السكريبت ده في وسم <head> بتاع صفحتك، قبل أي كود بتاع مشغّل الفيديو/الاستضافة:
 *   <script src="anti-popup.js"></script>
 *
 * ملحوظة مهمة: السكريبت ده مش بديل كامل لأداة زي uBlock Origin (اللي عندها آلاف
 * قوائم الفلاتر المحدّثة باستمرار من مجتمع ضخم) - هو بيغطي أكتر الحيل شيوعاً
 * اللي بتستخدمها خدمات الفيديو المجانية بس.
 */

(function () {
  "use strict";

  // ============ ⚙️ إعدادات: حط هنا دومينات شبكات الإعلانات اللي إنت مختارها بنفسك ============
  // أي رابط أو iframe من الدومينات دي، السكريبت مش هيلمسه خالص - عشان تقدر تحط
  // إعلانات AdSense أو Monetag بتاعتك براحتك من غير ما الأداة دي تمنعها بالغلط.
  // مثال لما تفعّل AdSense أو Monetag، ضيف دوميناتهم هنا:
  const ALLOWED_AD_DOMAINS = [
    // "googlesyndication.com",
    // "doubleclick.net",
    // "googleadservices.com",
    // "pagead2.googlesyndication.com",
    // "monetag.com",
    // "your-monetag-subdomain.com",
  ];

  function isAllowedDomain(url) {
    if (!url) return false;
    try {
      const hostname = new URL(url, window.location.href).hostname;
      return ALLOWED_AD_DOMAINS.some((domain) => hostname === domain || hostname.endsWith("." + domain));
    } catch (e) {
      return false;
    }
  }

  // ============ 0) تتبّع أنهي فيديو اتدوس عليه قبل أي محاولة إعلان ============
  // عشان الميزة دي تشتغل، حط data-video-id="اسم_أو_رقم_الفيديو" على زرار
  // التشغيل أو الصورة المصغّرة بتاعة كل فيديو في منصتك، مثال:
  //   <div class="play-button" data-video-id="lesson-12">▶</div>
  let lastClickedVideo = null;

  document.addEventListener(
    "click",
    function (e) {
      let el = e.target;
      while (el && el !== document.body) {
        if (el.dataset && el.dataset.videoId) {
          lastClickedVideo = { id: el.dataset.videoId, time: Date.now() };
          console.log("▶️ anti-popup: اتدوس فيديو:", lastClickedVideo.id);
          break;
        }
        el = el.parentElement;
      }
    },
    true
  );

  function attributeToVideo() {
    if (lastClickedVideo && Date.now() - lastClickedVideo.time < 4000) {
      return lastClickedVideo.id;
    }
    return "غير معروف (مفيش فيديو اتدوس عليه في آخر 4 ثواني)";
  }

  // ============ 1) منع window.open (أكتر حيلة شائعة لفتح "نافذة إعلان" جديدة) ============
  const adAttempts = []; // سجل بكل محاولات الإعلان + الفيديو المسؤول عنها

  const originalOpen = window.open;
  window.open = function (...args) {
    if (window.__hakimApLevel === 0) return originalOpen.apply(window, args); /* مزيل الإعلانات متوقف لهذه الحلقة */
    const targetUrl = args[0] || "";
    if (isAllowedDomain(targetUrl)) {
      console.log("✅ anti-popup: مسموح (دومين إعلانك الشرعي):", targetUrl);
      return originalOpen.apply(window, args);
    }
    const culprit = attributeToVideo();
    console.warn("🚫 anti-popup: اتمنع window.open لـ:", targetUrl || "(بدون رابط)", "| سببه الفيديو:", culprit);
    adAttempts.push({ type: "window.open", url: targetUrl, video: culprit, time: new Date().toISOString() });
    return null; // نرجع null بدل ما نفتح النافذة فعلياً
  };

  // [تعديل المنصة] نافذة مضمونة لأكواد المنصة نفسها (زي زر الإبلاغ عن خطأ)، عشان الحماية
  // ما تمنعش window.open الشرعي بتاعها. أكواد الفيديوهات الخارجية ما تعرفش بيها.
  window.hakimTrustedOpen = function (...args) {
    return originalOpen.apply(window, args);
  };

  // ============ 2) منع محاولات إعادة توجيه الصفحة كلها عند أي دوسة (كليك-جاكينج شائع) ============
  // بعض السكريبتات بتحط مستمع "click" على document كله وتحاول تفتح تاب/رابط جديد
  // بمجرد أي دوسة في أي حتة بالصفحة. الكود ده بيوقف الانتشار المبكر لمحاولات زي دي
  // اللي بتيجي من مصادر مش موثوقة (iframes بتاعة الاستضافة نفسها مثلاً).
  document.addEventListener(
    "click",
    function (e) {
      // لو فيه محاولة تغيير location.href من كود مش بتاعك، صعب نمنعها 100% من هنا
      // بس بنقدر نمنع أي <a> جديد اتحقن ديناميكياً وعنده target="_blank" لدومين غريب
      let el = e.target;
      while (el && el !== document.body) {
        if (el.tagName === "A" && el.target === "_blank" && el.dataset.injectedAd) {
          e.preventDefault();
          e.stopPropagation();
          console.warn("🚫 anti-popup: اتمنع لينك إعلان مربوط بالدوسة:", el.href);
          return;
        }
        el = el.parentElement;
      }
    },
    true // capture phase - عشان نمسكها قبل أي حد تاني
  );

  // ============ 3) إزالة أي iframe/div مشبوه بيتحقن ديناميكياً بمعايير إعلانات شائعة ============
  const SUSPICIOUS_PATTERNS = [
    /popunder/i,
    /popup-ad/i,
    /\bad[-_]?overlay\b/i,
    /banner-ad/i,
  ];

  function looksLikeAd(el) {
    const attrs = [el.id, el.className, el.src || "", el.getAttribute("data-src") || ""].join(" ");
    return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(attrs));
  }

  function removeIfAd(el) {
    if (!(el instanceof Element)) return;
    if (isAllowedDomain(el.src)) return; // إعلانك الشرعي - منلمسوش خالص
    if (el.tagName === "IFRAME" || el.tagName === "DIV") {
      if (looksLikeAd(el)) {
        console.warn("🚫 anti-popup: اتشال عنصر شكله إعلان:", el);
        el.remove();
      }
    }
  }

  // ============ 3.5) خيار أخير (يدوي فقط): حط sandbox على iframe الاستضافة ============
  // السطور دي مبتشتغلش لوحدها خالص. الـsandbox بيوقف window.open والتنقل الكامل
  // للصفحة من جوه الـiframe، لكنه بيقدر كمان يبوّظ تشغيل الفيديو نفسه (كوكيز،
  // تخزين محلي، أو أي حاجة الاستضافة محتاجاها عشان الفيديو يشتغل عادي).
  // عشان كده مش بنحطه تلقائي؛ بيتفعّل بس لو ضغطت على الزرار المخصص له في الصفحة
  // أو نديت الأمر يدوياً من الكونسول: antiPopupForceSandbox()
  function forceSandboxIframe(iframe) {
    if (!(iframe instanceof HTMLIFrameElement)) return;
    if (isAllowedDomain(iframe.src)) return; // إعلانك الشرعي - سيبه يشتغل عادي
    if (iframe.dataset.antiPopupSandboxed) return; // اتعالج قبل كده

    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    iframe.dataset.antiPopupSandboxed = "true";
    console.log("🛡️ anti-popup: اتحط sandbox يدوياً على iframe:", iframe.src || "(بدون src)");
  }

  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (node) {
        removeIfAd(node);
        if (node.querySelectorAll) {
          node.querySelectorAll("iframe, div").forEach(removeIfAd);
        }
      });
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  // ============ 3.6) وضع القوة القصوى — بيتفعّل من الأدمن لحساب معيّن (hakim_ctl.adblock_max) ============
  // بيحط sandbox تلقائيًا على iframes الفيديو (من غير allow-popups ولا allow-top-navigation) فمفيش نافذة ولا تحويل للصفحة من جوّاها،
  // وبيزوّد أنماط كشف الإعلانات. ممكن (نادرًا) استضافة فيديو تتأثر — لو حصل، الأدمن بيقفل الوضع لحساب المستخدم ده.
  (function () {
    let ctl = null; try { ctl = JSON.parse(localStorage.getItem("hakim_ctl") || "null"); } catch (e) {}
    if (!ctl || !ctl.adblock_max) return;
    window.__hakimApStrict = true;
    SUSPICIOUS_PATTERNS.push(/\bads?[-_]?(box|frame|wrap|container|slot)\b/i, /sponsor/i, /interstitial/i, /pop(up|under)/i, /overlay[-_]?ad/i);
    const TOK = "allow-scripts allow-same-origin allow-presentation allow-forms allow-pointer-lock";
    function lock(el) {
      if (!(el instanceof HTMLIFrameElement) || isAllowedDomain(el.src)) return;
      if (el.getAttribute("sandbox") !== TOK) el.setAttribute("sandbox", TOK);
    }
    function scan(root) { if (!root) return; if (root.tagName === "IFRAME") lock(root); if (root.querySelectorAll) root.querySelectorAll("iframe").forEach(lock); }
    scan(document);
    new MutationObserver(function (ms) { ms.forEach(function (m) { if (m.type === "attributes") lock(m.target); else m.addedNodes.forEach(scan); }); })
      .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "sandbox"] });
  })();

  // نادِ على window.antiPopupForceSandbox() (أو دوس الزرار في الصفحة) عشان تفعّل
  // الـsandbox يدوياً على كل iframes الاستضافة، لو باقي الحماية مكانتش كفاية
  window.antiPopupForceSandbox = function () {
    const iframes = document.querySelectorAll("iframe");
    if (!iframes.length) {
      console.warn("⚠️ anti-popup: مفيش iframe في الصفحة عشان نحط عليه sandbox");
      return;
    }
    iframes.forEach(forceSandboxIframe);
    return "تم تفعيل الـsandbox على " + iframes.length + " iframe";
  };

  // ============ 4) منع فتح تابات جديدة عن طريق تغيير window.location من كود خارجي مشبوه ============
  // (تحذير: التقنية دي محدودة - مواقع كتير بتحتاج location.href تتغيّر بشكل شرعي،
  //  فمبنمنعش التغيير نفسه، بس بنسجّله في الكونسول عشان تراجعه وتتأكد إنه شرعي)
  // [تعديل المنصة] بنقارن origin + pathname بس، لأن المنصة بتحدّث ?ep=رقم_الحلقة في الرابط
  // (history.replaceState) وده تنقّل داخل نفس الصفحة مش إعادة توجيه.
  const pageKey = () => window.location.origin + window.location.pathname;
  let originalPage = pageKey();
  let originalHref = window.location.href;

  setInterval(function () {
    if (pageKey() === originalPage) { originalHref = window.location.href; return; }
    if (window.location.href !== originalHref) {
      const culprit = attributeToVideo();
      console.warn("⚠️ anti-popup: الصفحة اتنقلت من", originalHref, "لـ", window.location.href, "| سببه الفيديو:", culprit);
      adAttempts.push({ type: "redirect", from: originalHref, to: window.location.href, video: culprit, time: new Date().toISOString() });
      originalHref = window.location.href;
      originalPage = pageKey();
    }
  }, 1000);

  // نادِ على window.antiPopupReport() في أي وقت من الـConsole عشان تشوف ملخص كل المحاولات المسجّلة
  window.antiPopupReport = function () {
    console.table(adAttempts);
    return adAttempts;
  };

  console.log("✅ anti-popup.js شغال - بيراقب الصفحة ضد إعلانات popup/popunder الشائعة");
  console.log("💡 اكتب antiPopupReport() في أي وقت عشان تشوف ملخص كل محاولات الإعلان اللي اتمنعت وأنهي فيديو سببها");
  console.log("🛡️ لو الحماية العادية مكانتش كفاية، اكتب antiPopupForceSandbox() (أو دوس الزرار في الصفحة) كخيار أخير");
})();


/* ============================================================
   🛡️ وضع «أقوى حد» — بيتفعّل لكورس معيّن من الأدمن (كيفية العرض ← تقوية مانع الإعلانات). طبقات بتشتغل في نفس الوقت:
   1) تجميد window.open (ما حدش يقدر يرجّعها)           2) منع نقر الروابط البرمجي (a.click()/dispatchEvent) بدون ضغطة حقيقية
   3) مراقب DOM: بيشيل أي رابط target=_blank أو iframe غريب أو طبقة إعلانية بـ z-index خرافي بتتحقن في الصفحة
   4) فخ فقدان التركيز: لو نافذة سرقت التركيز بعد ضغطة على المشغّل، بنرجّع التركيز فورًا ونسجّل المحاولة
   5) (من course.js) sandbox صارم + no-referrer على مشغّل التضمين
   تنبيه صريح: الإعلانات اللي جوّه صفحة مشغّل خارجي (iframe من دومين تاني) المتصفح مش بيسمح لأي صفحة تانية تشوفها أو تقفلها؛ الحماية الوحيدة ليها هي الـsandbox.
   ============================================================ */
(function () {
  "use strict";
  if (window.hakimMaxGuard) return;
  window.hakimMaxGuard = function (onBlock) {
    if (window.__hakimMaxOn) return; window.__hakimMaxOn = true;
    var hits = 0; function hit(why) { hits++; try { console.warn("🛡️ max-guard:", why); } catch (e) {} if (typeof onBlock === "function") onBlock(why, hits); }
    var active = function () { return !navigator.userActivation || navigator.userActivation.isActive; };
    /* 1) تجميد window.open */
    try { var blocked = function () { hit("window.open"); return null; }; Object.defineProperty(window, "open", { value: blocked, writable: false, configurable: false }); } catch (e) {}
    /* 2) نقر الروابط البرمجي */
    try {
      var origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () { try { var u = new URL(this.href, location.href); if (u.origin !== location.origin && !this.closest("[data-platform-link]")) { hit("anchor.click " + u.hostname); return; } } catch (e) {} return origClick.apply(this, arguments); };
      var origDispatch = EventTarget.prototype.dispatchEvent;
      EventTarget.prototype.dispatchEvent = function (ev) { try { if (ev && ev.type === "click" && !ev.isTrusted && this instanceof HTMLAnchorElement) { var u = new URL(this.href, location.href); if (u.origin !== location.origin) { hit("dispatch click " + u.hostname); return false; } } } catch (e) {} return origDispatch.apply(this, arguments); };
    } catch (e) {}
    /* 3) مراقب DOM */
    var mo = new MutationObserver(function (list) {
      list.forEach(function (m) { m.addedNodes && m.addedNodes.forEach(function (n) {
        if (n.nodeType !== 1) return;
        var els = [n].concat(n.querySelectorAll ? Array.prototype.slice.call(n.querySelectorAll("a[target=_blank],iframe,div,section")) : []);
        els.forEach(function (el) {
          try {
            if (el.matches && el.matches("a[target=_blank]") && !el.closest("[data-platform-link],.hk-ad,.site-footer,footer,nav,.menu")) { el.removeAttribute("target"); el.setAttribute("rel", "noopener noreferrer"); el.addEventListener("click", function (e) { if (new URL(el.href, location.href).origin !== location.origin) { e.preventDefault(); hit("blank link"); } }, true); }
            if (el.tagName === "IFRAME" && !el.closest("#player, #playerHost, .hp-wrap, .player-wrap, .hk-ad, [data-platform-frame]") && el.parentElement === document.body) { el.remove(); hit("foreign iframe"); }
            if (el.parentElement === document.body && el.tagName !== "SCRIPT") { var cs = getComputedStyle(el); if (cs.position === "fixed" && parseInt(cs.zIndex || "0", 10) >= 2147483000 && !el.matches(".hk-ad-modal,#hkSnack,[data-platform-overlay]")) { el.remove(); hit("overlay z=" + cs.zIndex); } }
          } catch (e) {}
        });
      }); });
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    /* 4) فخ فقدان التركيز */
    var lastPtr = 0; document.addEventListener("pointerdown", function () { lastPtr = Date.now(); }, true);
    window.addEventListener("blur", function () { if (Date.now() - lastPtr < 900 && document.activeElement && document.activeElement.tagName === "IFRAME") { setTimeout(function () { try { window.focus(); } catch (e) {} }, 0); hit("focus stolen"); } });
    document.addEventListener("visibilitychange", function () { if (document.hidden && Date.now() - lastPtr < 1200) hit("tab hidden right after click"); });
  };
})();
