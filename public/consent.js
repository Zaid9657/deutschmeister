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
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveChoice(value) {
    try { window.localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* ignore */ }
  }
  function clearChoice() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  // Inject GA4 exactly once.
  function loadAnalytics() {
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

  function removeBanner() {
    var el = document.getElementById('dm-cookie-banner');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function showBanner() {
    if (document.getElementById('dm-cookie-banner')) return;

    var bar = document.createElement('div');
    bar.id = 'dm-cookie-banner';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-live', 'polite');
    bar.setAttribute('aria-label', 'Cookie consent');
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
    msg.innerHTML = 'We use analytics cookies (Google Analytics) to understand how the site ' +
      'is used. They load only if you accept. See our ' +
      '<a href="/privacy" style="color:#fbbf24;text-decoration:underline">Privacy Policy</a>.';

    var btns = document.createElement('div');
    btns.style.cssText = 'display:flex;gap:8px;flex:0 0 auto';

    var decline = document.createElement('button');
    decline.type = 'button';
    decline.textContent = 'Decline';
    decline.style.cssText = 'cursor:pointer;padding:8px 16px;border-radius:8px;' +
      'border:1px solid #475569;background:transparent;color:#e2e8f0;font-weight:600;font-size:14px';

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.textContent = 'Accept';
    accept.style.cssText = 'cursor:pointer;padding:8px 16px;border-radius:8px;border:0;' +
      'background:linear-gradient(90deg,#f59e0b,#f43f5e);color:#fff;font-weight:700;font-size:14px';

    accept.addEventListener('click', function () { saveChoice('accepted'); loadAnalytics(); removeBanner(); });
    decline.addEventListener('click', function () { saveChoice('declined'); removeBanner(); });

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
    if (choice === 'declined') { return; }
    showBanner();
  }

  // Small API so a "Manage cookies" / "Withdraw consent" link (e.g. on the
  // Privacy page) can re-open or change the choice later.
  window.dmCookieConsent = {
    accept: function () { saveChoice('accepted'); loadAnalytics(); removeBanner(); },
    decline: function () { saveChoice('declined'); removeBanner(); },
    reset: function () { clearChoice(); showBanner(); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
