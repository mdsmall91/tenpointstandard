'use strict';

/* =============================================================
   TEN POINT — SCORECARD CODE
   Packs the forty answers into a short string so the scorecard can
   live at a URL.

   WHY THIS EXISTS. The forwardable scorecard is the highest leverage
   artifact in the system: it is a document somebody sends to their
   engineer, their lender, and their partner, and each of those three
   then arrives at this site. It cannot be the email body, for two
   reasons that are both hard limits rather than preferences:

     1. The Mailchimp audience is at the 30 merge-field cap. "Create
        a new field" there is a silent no-op, so there is no room for
        forty answers plus a written read.
     2. Merge fields truncate at 255 characters. A six to eight
        sentence read does not fit in one.

   So the email carries a link, and the link carries the answers. The
   page re-runs the same deterministic engine the site ran, which
   means the scorecard cannot drift from the result the person saw.
   No server, no database, no expiry.

   Answers ride in the URL FRAGMENT, never the query string. A
   fragment is not sent to the server and is not written into any
   referrer, so a forwarded scorecard does not leak through third
   party requests on the pages it is opened next to.

   FORMAT
     v1<payload>
     Each of the forty answers is two bits: 0 unanswered, 1 yes,
     2 no, 3 not sure. Three answers pack into one character of a
     64 character alphabet, so forty answers cost fourteen
     characters. The whole code is sixteen characters.
   ============================================================= */

var TPScoreCode = (function () {

  var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  var N = 40;

  function codeOf(v) {
    if (v === true) return 1;
    if (v === false) return 2;
    if (v === 'unsure') return 3;
    return 0;
  }
  function valueOf(c) {
    if (c === 1) return true;
    if (c === 2) return false;
    if (c === 3) return 'unsure';
    return undefined;
  }

  /* answers: the app.js map, keys "<point>-<question>". */
  function encode(answers) {
    var digits = [];
    for (var p = 0; p < 10; p++) {
      for (var q = 0; q < 4; q++) digits.push(codeOf(answers[p + '-' + q]));
    }
    var out = '';
    for (var i = 0; i < N; i += 3) {
      var a = digits[i] || 0;
      var b = digits[i + 1] || 0;
      var c = digits[i + 2] || 0;
      out += ALPHA.charAt(a * 16 + b * 4 + c);
    }
    return 'v1' + out;
  }

  function decode(code) {
    if (!code || code.slice(0, 2) !== 'v1') return null;
    var body = code.slice(2);
    var digits = [];
    for (var i = 0; i < body.length; i++) {
      var n = ALPHA.indexOf(body.charAt(i));
      if (n < 0) return null;
      digits.push(Math.floor(n / 16), Math.floor(n / 4) % 4, n % 4);
    }
    if (digits.length < N) return null;
    var answers = {};
    for (var k = 0; k < N; k++) {
      var v = valueOf(digits[k]);
      if (v !== undefined) answers[Math.floor(k / 4) + '-' + (k % 4)] = v;
    }
    return answers;
  }

  function url(answers, origin) {
    var base = origin || (location.protocol + '//' + location.host);
    return base + '/scorecard/#s=' + encode(answers);
  }

  function fromHash(hash) {
    var m = /[#&]s=([A-Za-z0-9\-_]+)/.exec(hash || '');
    return m ? decode(m[1]) : null;
  }

  return { encode: encode, decode: decode, url: url, fromHash: fromHash };
})();
