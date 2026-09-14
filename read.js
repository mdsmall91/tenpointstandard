'use strict';

/* =============================================================
   THE QUICK SCAN — six cards on the way in
   =============================================================

   Rebuilt September 2026. What it was: nine screens asking what
   somebody was building — project type, land type, unit count,
   stage, budget, date, team, worry — scored into a band and a gate,
   with answers carried forward into the Full Assessment.

   Three things were wrong with it.

   1. It opened by asking what you are building, which implies the
      work starts with a product decision. It does not, and it is not
      how Ten Point approaches a project. That screen is gone, and
      Park and Recreation with it.

   2. It claimed to read what you typed. An intake box took a free
      sentence and said "We picked this up from what you wrote" over
      the fields it filled. Behind it was a regex over about thirty
      keywords with no model in production — the land question alone
      needed one of sixteen specific words — and when it missed, the
      screen showed its default with no indication anything had
      failed. So the same answer came back whatever you typed. The
      box is gone and the claim with it. Nothing on this lane now
      interprets anything: what a person types is quoted back, never
      read.

   3. It fed the Full Assessment. Experience questions do not map
      onto forty delivery questions, and the carry is what kept
      dragging this lane back toward units and types. It is gone;
      readmodel.carry() returns nothing.

   What it is now: six cards from the RVi Experience Builder deck,
   asking who this is for and what it is meant to do. It scores
   nothing. It ends in the visitor's own six answers read back, and
   in whichever of the six they could not answer, named.

   PHONE FIRST. This runs at a trade show, on a phone, standing up,
   one-handed. One card per screen, one tap per card, targets at
   56px, nothing to type unless somebody wants to. The old lane had
   a drag slider on it, which is the worst control there is to use
   while holding a coffee.
   ============================================================= */

/* v2: the answer shape changed completely, so a v1 payload cannot be
   read and must not be half-read. The key bump discards it. */
var STORE = 'tp-scan-v2';
var C = TPScanCards;

var S = {
  step: 0,
  answers: {},     // card id -> option id
  note: '',        // one optional note, on the reflection screen
  done: false
};

var CARD_COUNT = C.CARDS.length;   // 6
var RESULT = CARD_COUNT + 1;       // step 7

/* ---------------------------------------------------------------
   STORAGE
   --------------------------------------------------------------- */
function load() {
  try {
    var raw = localStorage.getItem(STORE);
    if (!raw) return;
    var d = JSON.parse(raw);
    S.step = d.step || 0;
    S.answers = d.answers || {};
    S.note = d.note || '';
    S.done = !!d.done;
  } catch (e) {}
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {}
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function answeredCount() {
  var n = 0;
  for (var i = 0; i < C.CARDS.length; i++) if (S.answers[C.CARDS[i].id]) n++;
  return n;
}

/* ---------------------------------------------------------------
   SCREENS
   --------------------------------------------------------------- */

/* Six dots. No numbers, no percentage, no "question 4 of 9" — the
   old progress line said nine while every page on the site promised
   ten, and a dot count cannot drift from the card count because it
   is generated from it. */
function dots(active) {
  var out = '<div class="qs-dots" aria-hidden="true">';
  for (var i = 0; i < CARD_COUNT; i++) {
    var cls = i + 1 === active ? 'on' : (S.answers[C.CARDS[i].id] ? 'done' : '');
    out += '<i class="' + cls + '"></i>';
  }
  return out + '</div>';
}

function opener() {
  return '<section class="qs-screen qs-opener">' +
    '<div class="eyebrow dotted">The Quick Scan</div>' +
    '<h1>Six questions about the people, not the plan.</h1>' +
    '<p class="lede">Before a site plan or a budget, a project needs to know who ' +
    'it is for and what it is meant to do. These are six of the questions we ask ' +
    'at the start of one. There are no right answers and nothing is scored.</p>' +
    '<p class="qs-meta mono">Six cards &middot; about ninety seconds &middot; no email</p>' +
    '<button class="btn accent lg" data-go="1">Start</button>' +
    '<p class="qs-alt">Further along than this? ' +
    '<a href="/standard/">Take the Full Assessment</a> instead — forty questions ' +
    'on whether the project is ready to build.</p>' +
  '</section>';
}

function cardScreen(n) {
  var card = C.CARDS[n - 1];
  var picked = S.answers[card.id];
  var opts = '';
  for (var i = 0; i < card.options.length; i++) {
    var o = card.options[i], on = picked === o.id;
    opts += '<button class="qs-option' + (on ? ' picked' : '') +
      (o.id === 'unknown' ? ' qs-unknown' : '') + '"' +
      ' data-pick="' + esc(o.id) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
      '<span>' + esc(o.label) + '</span>' +
      '<i aria-hidden="true">' + (on ? '&#10003;' : '') + '</i>' +
    '</button>';
  }

  return '<section class="qs-screen qs-card-screen">' +
    dots(n) +
    '<figure class="qs-photo">' +
      '<img src="' + esc(card.img) + '" alt="" ' +
        (n > 1 ? 'loading="lazy" ' : '') + 'decoding="async">' +
      '<figcaption>' +
        '<span class="eyebrow">' + esc(card.eyebrow) + '</span>' +
        '<h2>' + esc(card.question) + '</h2>' +
      '</figcaption>' +
    '</figure>' +
    '<div class="qs-options" role="group" aria-label="' + esc(card.question) + '">' +
      opts +
    '</div>' +
    '<div class="qs-nav">' +
      '<button class="qs-back" data-go="' + (n - 1) + '">&larr; Back</button>' +
      (picked
        ? '<button class="btn accent" data-go="' + (n + 1) + '">' +
            (n === CARD_COUNT ? 'See what you said' : 'Next') + '</button>'
        : '<span class="qs-hint">Pick one to carry on</span>') +
    '</div>' +
  '</section>';
}

function resultScreen() {
  var R = C.reflect(S.answers);

  var lines = '';
  for (var i = 0; i < R.lines.length; i++) {
    lines += '<p>' + esc(R.lines[i]) + '</p>';
  }

  /* Every card, with what they chose, and changeable. An answer we
     show back has to be one they can correct. */
  var rows = '';
  for (var j = 0; j < C.CARDS.length; j++) {
    var card = C.CARDS[j], picked = S.answers[card.id];
    var o = picked ? C.option(card.id, picked) : null;
    var unresolved = !o || o.id === 'unknown';
    rows += '<li class="' + (unresolved ? 'qs-open' : '') + '">' +
      '<span class="qs-row-q">' + esc(card.eyebrow) + '</span>' +
      '<span class="qs-row-a">' + esc(o ? o.label : 'Not answered') + '</span>' +
      '<button class="qs-change" data-go="' + (j + 1) + '" ' +
        'aria-label="Change your answer to ' + esc(card.question) + '">Change</button>' +
    '</li>';
  }

  return '<section class="qs-screen qs-result">' +
    '<div class="eyebrow dotted">What you said</div>' +
    '<h1>' + (R.unknown.length === 0
      ? 'Six for six.'
      : R.known.length === 0
        ? 'Six questions, still open.'
        : 'Here it is, in your words.') + '</h1>' +

    '<div class="qs-read">' + lines + '</div>' +

    /* Said plainly, because a written read that looks generated and
       does not say so is the thing people stop trusting. */
    '<p class="qs-provenance">This is your six answers read back in order. ' +
    'Nothing here is scored, and nothing was written about your project ' +
    'that you did not choose above.</p>' +

    '<h2 class="qs-h2">Your six</h2>' +
    '<ul class="qs-rows">' + rows + '</ul>' +

    '<div class="qs-note-block">' +
      '<label for="qs-note">Anything you want to add? (optional)</label>' +
      '<textarea id="qs-note" rows="3" placeholder="Whatever the six did not ' +
        'have a box for.">' + esc(S.note) + '</textarea>' +
      '<p class="qs-note-help">This stays in your browser. It is not sent ' +
      'anywhere and nothing reads it.</p>' +
    '</div>' +

    '<div class="qs-doors">' +
      '<a class="btn accent lg" href="/consultation/">Talk this through with us</a>' +
      '<a class="btn lg" href="/standard/">Take the Full Assessment</a>' +
    '</div>' +
    '<p class="qs-alt">The Full Assessment is the other half: forty questions on ' +
    'whether the project is ready to build, scored out of a hundred.</p>' +

    '<button class="qs-restart" data-restart>Start the six again</button>' +
  '</section>';
}

function screenFor(step) {
  if (step <= 0) return opener();
  if (step >= RESULT) return resultScreen();
  return cardScreen(step);
}

/* ---------------------------------------------------------------
   FLOW
   --------------------------------------------------------------- */
function render() {
  document.getElementById('rd-app').innerHTML = screenFor(S.step);
  document.body.setAttribute('data-rd-step', S.step);
  window.scrollTo(0, 0);
  /* Move the reader to the top of the new card, not just the page:
     on a phone a screen reader would otherwise stay where it was. */
  var h = document.querySelector('#rd-app h1, #rd-app h2');
  if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
}

function go(n) {
  var prev = S.step;
  S.step = Math.max(0, Math.min(RESULT, n));

  if (S.step > prev && prev >= 1 && prev <= CARD_COUNT) {
    TPA.once('quick_scan_card_complete',
      { card: C.CARDS[prev - 1].id }, 'card-' + C.CARDS[prev - 1].id);
  }
  if (S.step === RESULT && !S.done) {
    S.done = true;
    TPA.once('quick_scan_complete', {
      answered: answeredCount(),
      unresolved: CARD_COUNT - answeredCount()
    });
  }
  save();
  render();
}

/* ---------------------------------------------------------------
   EVENTS
   --------------------------------------------------------------- */
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-pick], [data-go], [data-restart]');
  if (!el) return;

  if (el.hasAttribute('data-restart')) {
    S.answers = {}; S.note = ''; S.done = false;
    TPA.once('quick_scan_restart', {});
    go(0);
    return;
  }

  if (el.hasAttribute('data-pick')) {
    var card = C.CARDS[S.step - 1];
    if (!card) return;
    S.answers[card.id] = el.getAttribute('data-pick');
    TPA.once('read_start', {});
    save();
    /* Tap to answer, tap to move on. Auto-advancing on the first tap
       is faster but takes the choice away from somebody who wants to
       change their mind, and on a phone a mis-tap then costs a Back. */
    render();
    return;
  }

  if (el.hasAttribute('data-go')) {
    go(parseInt(el.getAttribute('data-go'), 10));
  }
});

document.addEventListener('input', function (e) {
  if (e.target.id === 'qs-note') { S.note = e.target.value; save(); }
});

/* Abandonment is the number that says whether ninety seconds is short
   enough, so it fires on the way out rather than on a button. */
function armAbandon() {
  var sent = false;
  function fire() {
    if (sent || S.done || S.step < 1) return;
    sent = true;
    TPA.once('quick_scan_abandon', { last_card: S.step });
  }
  window.addEventListener('pagehide', fire);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') fire();
  });
}

/* ---------------------------------------------------------------
   BOOT
   --------------------------------------------------------------- */
if (document.getElementById('rd-app')) {
  load();
  TPA.init();
  armAbandon();
  render();
}
