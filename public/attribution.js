/*
 * Acquisition attribution — which link brought this visitor.
 *
 * Shared by BOTH the React SPA (index.html) and the static Astro pages
 * (Layout.astro), served at /attribution.js from the site root, exactly like
 * consent.js. On every page load it reads the campaign parameters from the URL
 * (utm_source / utm_medium / utm_campaign / utm_content / utm_term, or the
 * short form ?ref=telegram) and, failing those, classifies document.referrer
 * (t.me → telegram, instagram.com → instagram, …). The result is kept in
 * localStorage under dm_attribution as { first, last }: `first` is written
 * once and never overwritten (the link that brought them), `last` is refreshed
 * on every attributed landing. The SPA reads it at signup and sends it as user
 * metadata, where the profiles trigger copies it into profiles.acquisition_*.
 *
 * Privacy posture: first-party, no third-party script, no cookie, no click ids
 * (gclid/fbclid are deliberately NOT stored — only the campaign labels the
 * owner typed into the link). It runs regardless of the analytics consent
 * because nothing leaves the browser until the visitor creates an account.
 *
 * The parser is exposed as window.dmAttribution so tests/attribution.test.mjs
 * can run this exact file under node:vm — there is one classifier, not two.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'dm_attribution';
  var MAX = 100; // characters per field; anything longer is not a campaign label

  // Referrer hosts → canonical source. Suffix-matched on the hostname so
  // l.instagram.com, lm.facebook.com and www.youtube.com all resolve.
  var SOCIAL_HOSTS = [
    ['t.me', 'telegram'], ['telegram.org', 'telegram'], ['telegram.me', 'telegram'],
    ['instagram.com', 'instagram'],
    ['facebook.com', 'facebook'], ['fb.com', 'facebook'], ['messenger.com', 'facebook'],
    ['linkedin.com', 'linkedin'], ['lnkd.in', 'linkedin'],
    ['tiktok.com', 'tiktok'],
    ['youtube.com', 'youtube'], ['youtu.be', 'youtube'],
    ['twitter.com', 'x'], ['x.com', 'x'], ['t.co', 'x'],
    ['whatsapp.com', 'whatsapp'],
    ['reddit.com', 'reddit'],
    ['threads.net', 'threads'],
    ['pinterest.com', 'pinterest'], ['pinterest.de', 'pinterest'],
  ];
  var SEARCH_HOSTS = ['google.', 'bing.com', 'duckduckgo.com', 'ecosia.org', 'yahoo.', 'yandex.'];
  var OWN_HOSTS = ['deutsch-meister.de', 'localhost', '127.0.0.1', 'netlify.app'];

  function clean(v) {
    if (typeof v !== 'string') return null;
    var s = v.trim().toLowerCase().replace(/[^a-z0-9._/ -]+/g, '').slice(0, MAX);
    return s || null;
  }

  function hostOf(url) {
    try { return new URL(url).hostname.toLowerCase(); } catch { return ''; }
  }
  function endsWithHost(host, suffix) {
    return host === suffix || host.slice(-(suffix.length + 1)) === '.' + suffix;
  }
  function isOwn(host) {
    for (var i = 0; i < OWN_HOSTS.length; i++) if (endsWithHost(host, OWN_HOSTS[i])) return true;
    return false;
  }

  /** Classify a referrer host: { source, medium } or null when it is our own site / empty. */
  function classifyReferrer(referrer) {
    var host = hostOf(referrer || '');
    if (!host || isOwn(host)) return null;
    for (var i = 0; i < SOCIAL_HOSTS.length; i++) {
      if (endsWithHost(host, SOCIAL_HOSTS[i][0])) return { source: SOCIAL_HOSTS[i][1], medium: 'social' };
    }
    for (var j = 0; j < SEARCH_HOSTS.length; j++) {
      if (host.indexOf(SEARCH_HOSTS[j]) !== -1) return { source: host.split('.').slice(-2)[0], medium: 'organic' };
    }
    return { source: host.replace(/^www\./, ''), medium: 'referral' };
  }

  /**
   * Parse one landing. Returns the touch { source, medium, campaign, content,
   * term, referrer, landing, at } or null when nothing attributes it (a direct
   * visit, or an internal navigation).
   */
  function parse(search, referrer, path, now) {
    var params;
    try { params = new URLSearchParams(search || ''); } catch { params = new URLSearchParams(); }
    var source = clean(params.get('utm_source')) || clean(params.get('ref'));
    var touch = null;
    if (source) {
      touch = {
        source: source,
        medium: clean(params.get('utm_medium')) || (params.get('utm_source') ? null : 'social'),
        campaign: clean(params.get('utm_campaign')),
        content: clean(params.get('utm_content')),
        term: clean(params.get('utm_term')),
      };
    } else {
      var ref = classifyReferrer(referrer);
      if (!ref) return null;
      touch = { source: ref.source, medium: ref.medium, campaign: null, content: null, term: null };
    }
    var refHost = hostOf(referrer || '');
    touch.referrer = refHost && !isOwn(refHost) ? refHost.slice(0, MAX) : null;
    touch.landing = (path || '/').slice(0, 200);
    touch.at = new Date(now || Date.now()).toISOString();
    return touch;
  }

  function read() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var v = raw ? JSON.parse(raw) : null;
      return v && typeof v === 'object' ? v : null;
    } catch { return null; }
  }

  /** Merge a new touch into the stored record: first wins, last refreshes. */
  function merge(stored, touch) {
    if (!touch) return stored;
    var s = stored || {};
    return { first: s.first || touch, last: touch };
  }

  function record() {
    var touch = parse(window.location.search, document.referrer, window.location.pathname);
    if (!touch) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merge(read(), touch))); } catch { /* ignore */ }
  }

  window.dmAttribution = { parse: parse, classifyReferrer: classifyReferrer, merge: merge, read: read, STORAGE_KEY: STORAGE_KEY };

  if (typeof window.location !== 'undefined' && typeof document !== 'undefined' && !window.__dmAttributionRecorded) {
    window.__dmAttributionRecorded = true;
    record();
  }
})();
