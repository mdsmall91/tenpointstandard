'use strict';

/* =============================================================
   TEN POINT — ANALYTICS
   One GA4 wiring for every page. Two jobs beyond wrapping gtag:

   1. ONE INIT. Each page used to inject its own gtag snippet. A page
      that loaded two scripts double-counted every hit on it.

   2. ONE FIRE PER EVENT PER SESSION. The live property shows nine
      `fg_email_captured` events from three users, so every count in
      it is inflated by an unknown factor. `once()` writes a marker
      into sessionStorage before sending, so a re-render, a back
      button, or a reload cannot re-send the same milestone.

   Milestones use once(). Repeatable interactions (a filter click, a
   CTA click, a screen advance) use track() and are meant to repeat.

   NO PERSONAL INFORMATION EVER GOES TO ANALYTICS. No email, no name,
   no phone number, no free text the visitor typed. Params are enums
   and counts only.
   ============================================================= */

var TPA = (function () {

  var booted = false;
  var SEEN_KEY = 'tp-ga-once-v1';
  var seen = null;

  function loadSeen() {
    if (seen) return seen;
    seen = {};
    try {
      var raw = sessionStorage.getItem(SEEN_KEY);
      if (raw) seen = JSON.parse(raw) || {};
    } catch (e) { seen = {}; }
    return seen;
  }

  function markSeen(key) {
    loadSeen()[key] = 1;
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {}
  }

  /* A local preview must never reach the live property. GA4 does not
     filter localhost by default, so without this every development
     session writes real events into the same reports the launch will
     be judged on. Hits are logged to the console instead, which is
     also a better way to check the funnel while building it. */
  function isLocal() {
    var h = location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' ||
      h === '' || /\.local$/.test(h) || /^192\.168\./.test(h);
  }

  /* INTERNAL TRAFFIC. Our own visits were most of the Glamping Show
     page's traffic in September 2026, and they arrive from home, the
     office, a phone and a VPN, so an IP rule alone cannot catch them.
     Open any page once with ?internal=1 and that browser is marked
     for good; ?internal=0 clears it. Marked hits carry
     traffic_type=internal, which the GA4 "Internal Traffic" data
     filter drops from the reports. */
  var INTERNAL_KEY = 'tp-internal-v1';
  function isInternal() {
    try {
      var m = /[?&]internal=([01])(?:&|$)/.exec(location.search);
      if (m && m[1] === '1') localStorage.setItem(INTERNAL_KEY, '1');
      if (m && m[1] === '0') localStorage.removeItem(INTERNAL_KEY);
      return localStorage.getItem(INTERNAL_KEY) === '1';
    } catch (e) { return false; }
  }

  function init() {
    if (booted) return;
    booted = true;
    if (isLocal()) {
      if (window.console) console.info('[TPA] local preview: GA is off, events log here instead');
      return;
    }
    if (typeof CONFIG === 'undefined' || !CONFIG.GA_MEASUREMENT_ID) return;
    if (window.gtag) return;              // another script already wired it
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CONFIG.GA_MEASUREMENT_ID,
      isInternal() ? { traffic_type: 'internal' } : {});
  }

  /* While the interface A/B test is running, every event carries the
     arm the visitor was assigned. Stamping it here rather than at
     each call site means no event can be added later that reports
     without it, which is how an A/B test ends up with a metric it
     cannot split. */
  function withArm(params) {
    var out = params || {};
    if (typeof TPAB === 'undefined' || !TPAB.running()) return out;
    var merged = {};
    for (var k in out) if (Object.prototype.hasOwnProperty.call(out, k)) merged[k] = out[k];
    merged.ab_arm = TPAB.arm();
    return merged;
  }

  /* Repeatable. Every call sends. */
  function track(name, params) {
    var p = withArm(params);
    if (isLocal()) {
      if (window.console) console.info('[TPA] ' + name, p);
      return;
    }
    if (window.gtag) window.gtag('event', name, p);
  }

  /* Milestone. Sends at most once per browser session.
     `key` defaults to the event name; pass one explicitly when the
     same event legitimately fires for different objects, e.g.
     once('standard_point_complete', {...}, 'point-3'). */
  function once(name, params, key) {
    var k = key ? name + ':' + key : name;
    if (loadSeen()[k]) return false;
    markSeen(k);
    track(name, params);
    return true;
  }

  /* "Start over" has to let the milestones fire again. */
  function reset(prefix) {
    var s = loadSeen(), k;
    for (k in s) {
      if (!prefix || k.indexOf(prefix) === 0) delete s[k];
    }
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(s)); } catch (e) {}
  }

  return { init: init, track: track, once: once, reset: reset };
})();
