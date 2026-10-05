/*
 * Cookie consent + deferred Google Analytics loader.
 *
 * Shared by BOTH the React SPA (index.html) and the static Astro pages
 * (Layout.astro) — served at /consent.js from the site root. No analytics
 * script is present in the initial HTML; GA4 is injected at runtime ONLY after
 * the visitor clicks "Accept". The choice is stored in localStorage so the
 * banner shows once. Framework-free so it runs identically in both contexts.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'dm_cookie_consent'; // 'accepted' | 'declined'
  var GA_ID = 'G-RXNM5897FC';

  function readChoice() {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }
  function saveChoice(value) {
    try { window.localStorage.setItem(STORAGE_KEY, value); } catch { /* ignore */ }
  }
  function clearChoice() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  function setAnalyticsPermission(allowed) {
    // GA honours this flag even after its script has loaded. The consent event
    // lets the SPA stop or restart PostHog in the same browsing session.
    window['ga-disable-' + GA_ID] = !allowed;
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: allowed ? 'granted' : 'denied'
      });
    }
    try {
      window.dispatchEvent(new CustomEvent(allowed ? 'dm-consent-accepted' : 'dm-consent-declined'));
    } catch { /* ignore */ }
  }

  // Inject GA4 exactly once. Also notifies the SPA (dm-consent-accepted) so
  // consent-gated tools like PostHog can start without a page reload.
  function loadAnalytics() {
    setAnalyticsPermission(true);
    if (window.__dmGaLoaded) return;
    window.__dmGaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  function declineAnalytics() {
    setAnalyticsPermission(false);
  }

  function removeBanner() {
    var el = document.getElementById('dm-cookie-banner');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  // The banner speaks the page's language (<html lang>, set before first paint
  // by both heads); Arabic is right-to-left. Unknown languages get English.
  // The Privacy Policy itself is English-only for now, and the Arabic says so.
  var COPY = {
    en: {
      label: 'Cookie consent',
      msg: 'We use analytics cookies (Google Analytics, PostHog) to understand how the site ' +
        'is used. They load only if you accept. See our {privacy}.',
      privacy: 'Privacy Policy',
      decline: 'Decline',
      accept: 'Accept'
    },
    de: {
      label: 'Cookie-Einwilligung',
      msg: 'Wir verwenden Analyse-Cookies (Google Analytics, PostHog), um zu verstehen, wie die Website ' +
        'genutzt wird. Sie werden nur geladen, wenn Sie zustimmen. Mehr in unserer {privacy} (auf Englisch).',
      privacy: 'Datenschutzerklärung',
      decline: 'Ablehnen',
      accept: 'Akzeptieren'
    },
    ar: {
      label: 'الموافقة على ملفات تعريف الارتباط',
      msg: 'نستخدم ملفات تعريف الارتباط التحليلية (Google Analytics وPostHog) لنفهم كيف يُستخدم الموقع. ' +
        'لا تُحمَّل إلا إذا وافقت. التفاصيل في {privacy} (بالإنجليزية).',
      privacy: 'سياسة الخصوصية',
      decline: 'رفض',
      accept: 'موافقة'
    }
  };

  function pageLang() {
    var l = String(document.documentElement.getAttribute('lang') || 'en').slice(0, 2).toLowerCase();
    return COPY[l] ? l : 'en';
  }

  function showBanner() {
    if (document.getElementById('dm-cookie-banner')) return;
    var lang = pageLang();
    var t = COPY[lang];

    var bar = document.createElement('div');
    bar.id = 'dm-cookie-banner';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-live', 'polite');
    bar.setAttribute('aria-label', t.label);
    bar.setAttribute('lang', lang);
    bar.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;' +
      'background:#0f172a;color:#e2e8f0;padding:14px 16px;' +
      'box-shadow:0 -4px 16px rgba(0,0,0,.25);' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
      'font-size:14px;line-height:1.5';

    var wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:1024px;margin:0 auto;display:flex;flex-wrap:wrap;' +
      'align-items:center;gap:12px;justify-content:space-between';

    var msg = document.createElement('p');
    msg.style.cssText = 'margin:0;flex:1 1 320px';
    msg.innerHTML = t.msg.replace('{privacy}',
      '<a href="/privacy" style="color:#fbbf24;text-decoration:underline">' + t.privacy + '</a>');

    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:8px;flex:0 0 auto';

    var decline = document.createElement('button');
    decline.type = 'button';
    decline.textContent = t.decline;
    decline.style.cssText = 'cursor:pointer;min-height:44px;padding:8px 16px;border-radius:8px;' +
      'border:1px solid #475569;background:transparent;color:#e2e8f0;font-weight:600;font-size:14px';

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.textContent = t.accept;
    accept.style.cssText = 'cursor:pointer;min-height:44px;padding:8px 16px;border-radius:8px;border:0;' +
      'background:#0F766E;color:#fff;font-weight:700;font-size:14px';

    accept.addEventListener('click', function () { saveChoice('accepted'); loadAnalytics(); removeBanner(); });
    decline.addEventListener('click', function () {
      saveChoice('declined');
      declineAnalytics();
      removeBanner();
    });

    btns.appendChild(decline);
    btns.appendChild(accept);
    wrap.appendChild(msg);
    wrap.appendChild(btns);
    bar.appendChild(wrap);
    (document.body || document.documentElement).appendChild(bar);
  }

  function init() {
    var choice = readChoice();
    if (choice === 'accepted') { loadAnalytics(); return; }
    if (choice === 'declined') { declineAnalytics(); return; }
    showBanner();
  }

  // Small API so a "Manage cookies" / "Withdraw consent" link (e.g. on the
  // Privacy page) can re-open or change the choice later.
  window.dmCookieConsent = {
    accept: function () { saveChoice('accepted'); loadAnalytics(); removeBanner(); },
    decline: function () { saveChoice('declined'); declineAnalytics(); removeBanner(); },
    reset: function () { clearChoice(); showBanner(); },
    manage: function () { declineAnalytics(); clearChoice(); showBanner(); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
