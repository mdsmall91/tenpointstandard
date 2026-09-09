'use strict';

/* =============================================================
   THE BOARD — the forty questions as ten cards
   =============================================================

   This is how the Full Assessment asks its questions. Ten
   photographs; each one flips to the four questions behind it;
   any card, any order.

   It replaced ten sequential screens. The questions, the weights,
   the gates, the scoring and the ledger did not change at all: this
   file renders and captures, and nothing else. Everything it learns
   goes straight into the assessment's own state through `api`, in
   the assessment's own format, so a person who answers here and a
   person who answered the old way get the same score for the same
   answers.

   MOUNTED, NOT RE-RENDERED. app.js rebuilds #app from a string on
   most state changes. The board cannot work that way: rebuilding
   the markup mid-flip throws away the animation and the focus, and
   a card would slam shut every time somebody answered a question.
   So app.js mounts this once and then leaves it alone, and the
   board repaints only the one card that changed.

   A CARD IS "ANSWERED", NOT "GOOD". Four answers complete a card
   whatever those answers are, and the front says so in those words.
   Nothing here may imply readiness: that is the ledger's job, and
   the ledger is where the gates get to speak.
   ============================================================= */

var TPBoard = (function () {

  /* One line per point, said the way somebody would say it walking
     the site: what this point is actually for. Front of card, above
     the title, where it has to earn the flip. */
  var TEASERS = [
    'Get to know the ground beneath the idea.',
    'Give the vision a financial foundation.',
    'Know what it takes to move forward.',
    'Make it worth the trip.',
    'Bring the idea into focus.',
    'Get the right things to the right place.',
    'Connect the plan to opening day.',
    'Know what is behind the numbers.',
    'Make sure the work holds up.',
    'Be ready for the very first guest.'
  ];

  var VALUES = [true, false, 'unsure'];
  var LABELS = ['Yes', 'No', 'Not sure'];

  var api = null;
  var root = null;
  var active = null;       // index of the open card, or null
  var question = 0;        // question index within the open card

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function $(sel) { return root.querySelector(sel); }
  function key(pi, qi) { return pi + '-' + qi; }
  function answerOf(pi, qi) { return api.get(key(pi, qi)); }
  function answered(pi, qi) { return answerOf(pi, qi) !== undefined; }
  function count(pi) {
    var n = 0;
    for (var qi = 0; qi < api.points[pi].qs.length; qi++) if (answered(pi, qi)) n++;
    return n;
  }
  function done(pi) { return count(pi) === api.points[pi].qs.length; }
  function pointYes(pi) {
    var n = 0;
    for (var qi = 0; qi < api.points[pi].qs.length; qi++) if (answerOf(pi, qi) === true) n++;
    return n;
  }
  function totalAnswered() {
    var n = 0;
    for (var pi = 0; pi < api.points.length; pi++) n += count(pi);
    return n;
  }
  function doneCards() {
    var n = 0;
    for (var pi = 0; pi < api.points.length; pi++) if (done(pi)) n++;
    return n;
  }

  /* ---------- the front of a card ---------- */
  function frontHtml(pi) {
    var p = api.points[pi], n = count(pi), total = p.qs.length;
    var status = done(pi) ? 'All four answered &middot; tap to review'
      : n ? n + ' of ' + total + ' answered &middot; continue'
          : total + ' questions &middot; flip to explore';
    var dots = '';
    for (var qi = 0; qi < total; qi++) {
      dots += '<i class="' + (answered(pi, qi) ? 'filled' : '') + '"></i>';
    }
    return '' +
      '<img src="' + api.image(pi) + '" alt="" ' + (pi > 3 ? 'loading="lazy"' : '') + ' decoding="async">' +
      '<span class="card-number">' + esc(p.n) + '</span>' +
      '<span class="flip-icon" aria-hidden="true">' + (done(pi) ? '✓' : '↻') + '</span>' +
      '<div class="front-copy">' +
        '<div class="teaser">' + esc(TEASERS[pi]) + '</div>' +
        '<h2>' + esc(p.title) + '</h2>' +
        '<div class="front-bottom"><span>' + status + '</span>' +
          '<span class="front-dots" aria-hidden="true">' + dots + '</span></div>' +
      '</div>';
  }

  function frontLabel(pi) {
    return api.points[pi].title + ': ' +
      (done(pi) ? 'all four answered, review them' : 'flip to explore four questions');
  }

  /* ---------- the back of a card ---------- */
  function backHtml(pi) {
    var p = api.points[pi], qi = question, a = answerOf(pi, qi);
    var nav = '';
    for (var j = 0; j < p.qs.length; j++) {
      nav += '<button data-question="' + j + '"' +
        ' class="' + (j === qi ? 'active' : '') + ' ' + (answered(pi, j) ? 'answered' : '') + '"' +
        ' aria-label="Question ' + (j + 1) + (answered(pi, j) ? ', answered' : '') + '"' +
        (j === qi ? ' aria-current="step"' : '') + '>' +
        (answered(pi, j) ? '✓' : (j + 1)) + '</button>';
    }
    var choices = '';
    for (var v = 0; v < VALUES.length; v++) {
      var on = a === VALUES[v];
      choices += '<button class="answer' + (on ? ' selected' : '') + '" data-answer="' + v + '"' +
        ' aria-pressed="' + (on ? 'true' : 'false') + '">' + LABELS[v] +
        '<span aria-hidden="true">' + (on ? '✓' : '○') + '</span></button>';
    }
    /* A question the Quick Scan already answered says so, because an
       answer we filled in on somebody's behalf has to be visible and
       changeable, never silent. */
    var carried = api.isCarried(key(pi, qi))
      ? '<span class="carried-tag">From your Quick Scan</span>' : '';

    return '' +
      '<div class="back-top"><span class="eyebrow">' + esc(p.n) + ' / ' + esc(p.title) + '</span>' +
        '<button class="close" data-close aria-label="Flip back to ' + esc(p.title) + '">×</button></div>' +
      '<nav class="q-nav" aria-label="' + esc(p.title) + ' questions">' + nav + '</nav>' +
      '<h3 class="question" id="board-question" tabindex="-1">' + esc(p.qs[qi]) + carried + '</h3>' +
      '<div class="answers" role="group" aria-labelledby="board-question">' + choices + '</div>' +
      /* The field note is the human voice in this whole product. It
         stays on the card, under the answers, where it reads as
         someone talking rather than as instructions. Once all four are
         answered the note gives way to what those answers are worth,
         which is the more useful thing to be reading by then. */
      (done(pi)
        ? '<p class="board-note is-payout"><strong>' + esc(p.title) + ': ' +
            pointYes(pi) + ' of ' + p.qs.length + ' yes.</strong> ' + esc(api.payout(pi)) + '</p>'
        : '<p class="board-note">' + esc(api.note(pi)) + '</p>') +
      '<div class="back-bottom">' +
        '<span class="question-count">' + count(pi) + ' of ' + p.qs.length + ' answered</span>' +
        '<button class="primary" data-next' + (a === undefined ? ' disabled' : '') + '>' +
          (done(pi) ? 'Done · flip back ↻' : 'Next question →') + '</button>' +
      '</div>';
  }

  /* ---------- mounting ---------- */
  function boardHtml() {
    return '' +
      '<section class="board-intro">' +
        '<div class="eyebrow dotted">The Ten Point Standard</div>' +
        '<h1>Big plans. Start anywhere.</h1>' +
        '<p>Flip a card to see what is behind it. Answer in any order, ' +
        'come back to anything, and stop whenever you like. Your answers stay in this browser until you send them.</p>' +
      '</section>' +
      '<div class="board-bar">' +
        '<span class="mono">Ten points &middot; forty questions &middot; no required order</span>' +
        '<div class="progress"><span id="board-progress-label" aria-live="polite"></span>' +
        '<progress id="board-progress" max="' + api.points.length + '" aria-label="Cards answered"></progress></div>' +
      '</div>' +
      '<section id="board-grid" class="board" aria-label="The ten points"></section>' +
      '<div class="board-foot">' +
        '<span id="board-foot-note"></span>' +
        '<button class="btn" data-board-ledger>See the ledger</button>' +
      '</div>';
  }

  function mount(el, theApi) {
    api = theApi;
    root = el;
    root.innerHTML = boardHtml();
    var grid = $('#board-grid');
    var cards = '';
    for (var pi = 0; pi < api.points.length; pi++) cards += cardShell(pi);
    grid.innerHTML = cards;
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKey);
    updateChrome();
    active = null;
  }

  function cardShell(pi) {
    return '<article class="card' + (done(pi) ? ' complete' : '') + '" id="card-' + pi + '">' +
      '<div class="card-inner">' +
        '<button class="face front" id="front-' + pi + '" aria-label="' + esc(frontLabel(pi)) + '"' +
          ' aria-expanded="false" aria-controls="back-' + pi + '" data-flip="' + pi + '">' +
          frontHtml(pi) + '</button>' +
        '<section class="face back" id="back-' + pi + '" aria-label="' + esc(api.points[pi].title) +
          ' questions" inert aria-hidden="true"></section>' +
      '</div></article>';
  }

  function isMounted(el) { return root === el && !!root.querySelector('#board-grid'); }

  /* ---------- painting ---------- */
  function updateChrome() {
    var n = totalAnswered(), cards = doneCards(), all = api.points.length * 4;
    $('#board-progress-label').textContent = cards + ' of ' + api.points.length + ' cards answered';
    $('#board-progress').value = cards;
    $('#board-foot-note').textContent = n === all
      ? 'All forty answered. The ledger is ready.'
      : n + ' of ' + all + ' questions answered. The ledger works before you finish.';
    api.chromeChanged();
  }

  function refreshFront(pi) {
    var f = root.querySelector('#front-' + pi);
    if (!f) return;
    f.innerHTML = frontHtml(pi);
    f.setAttribute('aria-label', frontLabel(pi));
    root.querySelector('#card-' + pi).classList.toggle('complete', done(pi));
    updateChrome();
  }

  function renderBack() {
    var pi = active;
    var back = root.querySelector('#back-' + pi);
    back.innerHTML = backHtml(pi);
  }

  /* ---------- open and close ---------- */
  function openCard(pi, atQuestion) {
    if (active !== null && active !== pi) closeCard(false);
    active = pi;
    if (atQuestion !== undefined && atQuestion !== null) {
      question = atQuestion;
    } else {
      var first = -1;
      for (var qi = 0; qi < api.points[pi].qs.length; qi++) {
        if (!answered(pi, qi)) { first = qi; break; }
      }
      question = first < 0 ? 0 : first;
    }
    var front = root.querySelector('#front-' + pi), back = root.querySelector('#back-' + pi);
    root.querySelector('#card-' + pi).classList.add('open');
    front.setAttribute('aria-expanded', 'true');
    front.inert = true;
    front.setAttribute('aria-hidden', 'true');
    back.inert = false;
    back.removeAttribute('aria-hidden');
    renderBack();
    api.cardOpened(pi);
    var q = root.querySelector('#board-question');
    if (q) q.focus({ preventScroll: true });
  }

  function closeCard(refocus) {
    if (active === null) return;
    var pi = active;
    var front = root.querySelector('#front-' + pi), back = root.querySelector('#back-' + pi);
    root.querySelector('#card-' + pi).classList.remove('open');
    back.inert = true;
    back.setAttribute('aria-hidden', 'true');
    front.inert = false;
    front.removeAttribute('aria-hidden');
    front.setAttribute('aria-expanded', 'false');
    active = null;
    refreshFront(pi);
    if (refocus !== false) front.focus({ preventScroll: true });
  }

  /* ---------- events ---------- */
  function onClick(e) {
    var el = e.target.closest('[data-flip], [data-close], [data-question], [data-answer], [data-next], [data-board-ledger]');
    if (!el || !root.contains(el)) return;

    if (el.hasAttribute('data-board-ledger')) { api.goLedger(); return; }
    if (el.hasAttribute('data-flip')) {
      var pi = parseInt(el.getAttribute('data-flip'), 10);
      if (active === pi) closeCard(); else openCard(pi);
      return;
    }
    if (active === null) return;

    if (el.hasAttribute('data-close')) { closeCard(); return; }

    if (el.hasAttribute('data-question')) {
      question = parseInt(el.getAttribute('data-question'), 10);
      renderBack();
      root.querySelector('#board-question').focus({ preventScroll: true });
      return;
    }

    if (el.hasAttribute('data-answer')) {
      var pi2 = active, qi = question;
      var wasDone = done(pi2);
      var v = parseInt(el.getAttribute('data-answer'), 10);
      api.set(key(pi2, qi), VALUES[v], pi2);
      refreshFront(pi2);
      renderBack();
      var again = root.querySelector('[data-answer="' + v + '"]');
      if (again) again.focus({ preventScroll: true });
      if (!wasDone && done(pi2)) api.cardCompleted(pi2);
      return;
    }

    if (el.hasAttribute('data-next')) {
      var pi3 = active;
      if (done(pi3)) { closeCard(); return; }
      var qs = api.points[pi3].qs, next = -1;
      for (var j = question + 1; j < qs.length; j++) if (!answered(pi3, j)) { next = j; break; }
      if (next < 0) for (var k = 0; k < qs.length; k++) if (!answered(pi3, k)) { next = k; break; }
      if (next < 0) { closeCard(); return; }
      question = next;
      renderBack();
      root.querySelector('#board-question').focus({ preventScroll: true });
    }
  }

  function onKey(e) {
    if (e.key === 'Escape' && active !== null) { closeCard(); e.stopPropagation(); }
  }

  return {
    mount: mount,
    isMounted: isMounted,
    open: openCard,
    close: closeCard,
    repaint: function () {
      if (!root) return;
      for (var pi = 0; pi < api.points.length; pi++) refreshFront(pi);
      if (active !== null) renderBack();
    },
    activeCard: function () { return active; }
  };
})();
