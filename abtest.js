'use strict';

/* =============================================================
   THE INTERFACE A/B TEST   (runs to 2026-10-31)
   =============================================================

   Two interfaces over one assessment. `board` is ten photographic
   cards; `list` is the ten sequential screens the board replaced.
   Same forty questions from the same questions.js, the same answers
   written into the same state, the same engine scoring them, the
   same ledger, scorecard and email. The interface is the only
   difference. Anything else that varies makes the result
   unreadable, so nothing else may vary.

   WHAT IS BEING DECIDED: whichever arm gets more completions, and
   then more dwell, is what the site keeps. Completions carry the
   weight. That ordering matters, because dwell alone cannot tell a
   pleasant interface from a confusing one — both hold somebody
   longer — while a completion only happens when they got to the
   end.

   ASSIGNMENT IS STICKY. A visitor who saw cards on Tuesday must not
   see a list on Thursday: their dwell would be the average of two
   interfaces and their completion would be attributed to whichever
   arm they happened to land in last. The arm is drawn once, stored,
   and never redrawn.

   HONEST ABOUT POWER. Separating two dwell distributions wants
   roughly 300 to 400 sessions an arm. This site produced 13
   completed assessments between July and September. The show on
   September 30 is the one real shot at volume, and even then the
   first weeks are directional, not significant. Read the numbers
   with that in mind rather than calling it early.
   ============================================================= */

var TPAB = (function () {

  var KEY = 'tp-ab-v1';
  var ARMS = ['board', 'list'];
  var END = '2026-10-31';

  var arm = null;

  /* A query string wins, for QA and for showing somebody a specific
     arm on purpose. It is remembered like any other assignment so a
     tester does not silently flip back on the next page. */
  function fromQuery() {
    var m = /[?&]ab=(board|list)/.exec(location.search);
    return m ? m[1] : null;
  }

  function stored() {
    try {
      var v = localStorage.getItem(KEY);
      return ARMS.indexOf(v) === -1 ? null : v;
    } catch (e) {
      return null;
    }
  }

  function remember(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  /* Once the test is over everybody sees the board again, whatever
     is in their localStorage, so a stale assignment cannot outlive
     the experiment. Change this line, not the stored values. */
  function over() {
    return new Date().toISOString().slice(0, 10) > END;
  }

  function assign() {
    if (arm) return arm;
    if (over()) { arm = 'board'; return arm; }

    var forced = fromQuery();
    if (forced) { arm = forced; remember(arm); return arm; }

    var was = stored();
    if (was) { arm = was; return arm; }

    /* Math.random is fine here. This splits traffic; it does not
       protect anything. */
    arm = ARMS[Math.random() < 0.5 ? 0 : 1];
    remember(arm);
    return arm;
  }

  return {
    /* 'board' or 'list'. Safe to call as often as you like. */
    arm: assign,
    isList: function () { return assign() === 'list'; },
    /* Stamped onto every GA4 event so any metric can be cut by arm
       without a second reporting path. */
    param: function () { return { ab_arm: assign() }; },
    running: function () { return !over(); },
    endsOn: END
  };
})();
