'use strict';

/* =============================================================
   TEN POINT — MODEL PROXY CLIENT
   The browser half of the AI layer, shared by both lanes.

   THREE RULES, all of them load-bearing.

   1. NO KEY EVER REACHES THIS FILE. The proxy holds it. This code
      knows a URL and nothing else.

   2. EVERY CALL IS OPTIONAL. The page already has a correct,
      deterministic read on screen before this is called. A success
      swaps in better wording. A failure, a timeout, a rate limit, a
      boundary rejection, or a proxy that was never deployed all do
      exactly the same thing: nothing. The visitor is never shown a
      spinner, an error, or any sign that a call was attempted.

   3. NOTHING WAITS ON IT. There is no loading state to get stuck in,
      because the content it improves is already rendered.

   The URL is chosen by hostname, so a local preview talks to
   tools/dev-proxy.py and production talks to the Worker. Neither
   needs a code change to switch.
   ============================================================= */

var TPModel = (function () {

  function endpoint() {
    if (typeof CONFIG === 'undefined') return '';
    var h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') {
      return CONFIG.MODEL_PROXY_URL_LOCAL || '';
    }
    return CONFIG.MODEL_PROXY_URL || '';
  }

  function enabled() { return !!endpoint(); }

  /* cb(result) with the parsed object, or cb(null) for every kind of
     failure. Callers branch on null and otherwise leave the template
     alone. */
  function ask(task, payload, cb) {
    var url = endpoint();
    if (!url) { cb(null); return; }

    var settled = false;
    function done(v) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      cb(v);
    }
    var timer = setTimeout(function () { done(null); },
      (typeof CONFIG !== 'undefined' && CONFIG.MODEL_PROXY_TIMEOUT_MS) || 6000);

    try {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: task, payload: payload })
      }).then(function (r) {
        return r.ok ? r.json() : null;
      }).then(function (j) {
        done(j && typeof j === 'object' ? j : null);
      })['catch'](function () { done(null); });
    } catch (e) {
      done(null);
    }
  }

  /* Both read tasks return the same shape, and both are checked the
     same way before anything reaches the page: an array of plain
     strings, none of them absurdly long, and enough of them to be a
     read rather than a fragment. Anything else is discarded. */
  function cleanLines(out, min) {
    if (!out || !out.lines || !out.lines.length) return null;
    var clean = [];
    for (var i = 0; i < out.lines.length && i < 8; i++) {
      var l = out.lines[i];
      if (typeof l === 'string' && l.length > 8 && l.length < 400) clean.push(l);
    }
    return clean.length >= (min || 3) ? clean : null;
  }

  return { ask: ask, enabled: enabled, cleanLines: cleanLines };
})();
