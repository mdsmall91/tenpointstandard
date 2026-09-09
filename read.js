'use strict';

/* =============================================================
   QUICK SCAN — lane one
   Ten interactions, no email, no account. The visitor taps or drags.
   They never type unless they choose to.

   State machine only: every word and every rule lives in
   readmodel.js, and the ring is TPRing. This file renders and
   listens.

   Storage is tp-read-v1. Full Assessment reads the same key to
   carry answers forward, so the shape below is a contract between
   the two lanes. Do not rename a field without updating carry() in
   readmodel.js and the confirmation screen in app.js.
   ============================================================= */

var STORE = 'tp-read-v1';
var M = TPReadModel;

var S = {
  step: 0,
  intake: '',
  intakeUsed: false,
  prefilled: {},          // field -> true, drives the "we read this" confirmation
  type: '', land: '', stage: '', compare: '',
  size: 20, money: '', date: '', team: [], worry: '',
  done: false
};

/* Screens 1 to 9 are the ten interactions the spec counts; screen 0
   is the optional prompt and screen 10 is the payoff. */
var LAST_Q = 9;
var RESULT = 10;

/* ---------------------------------------------------------------
   STORAGE
   --------------------------------------------------------------- */
function load() {
  try {
    var raw = localStorage.getItem(STORE);
    if (!raw) return;
    var d = JSON.parse(raw);
    for (var k in d) if (S.hasOwnProperty(k)) S[k] = d[k];
  } catch (e) {}
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {}
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* The model layer lives in modelproxy.js and is optional everywhere.
   Every read below is already correct before a call is made. */
function askModel(task, payload, cb) { TPModel.ask(task, payload, cb); }

/* ---------------------------------------------------------------
   RENDER HELPERS
   --------------------------------------------------------------- */

/* Every photo card carries a visible text label. The image is never
   the only signal, and the caption always says whose project it is
   so a stock photograph cannot read as Ten Point's work. */
function photoCard(item, group, selected) {
  return '<button class="rd-card' + (selected ? ' is-on' : '') + '" type="button"' +
    ' data-pick="' + group + '" data-val="' + esc(item.id) + '" aria-pressed="' + (selected ? 'true' : 'false') + '">' +
    '<span class="rd-card-media">' +
      '<img src="/assets/read/' + item.img + '-' + item.w + '.webp" alt="" loading="lazy" decoding="async">' +
    '</span>' +
    '<span class="rd-card-body">' +
      '<span class="rd-card-label">' + esc(item.label) + '</span>' +
      '<span class="rd-card-credit">' + esc(item.caption) + '</span>' +
    '</span>' +
  '</button>';
}

function screenHead(eyebrow, title, sub) {
  return '<div class="rd-head">' +
    '<div class="eyebrow dotted">' + esc(eyebrow) + '</div>' +
    '<h2>' + esc(title) + '</h2>' +
    (sub ? '<p class="rd-sub muted">' + esc(sub) + '</p>' : '') +
  '</div>';
}

/* A stop slider: a real range input so it is keyboard operable and
   announced properly, with the stop labels drawn beneath it. */
function stopSlider(group, list, valueId, artIndex) {
  var i = 0;
  for (var k = 0; k < list.length; k++) if (list[k].id === valueId) i = k;
  var cur = list[i];
  var art = '';
  if (artIndex) {
    art = '<div class="rd-stage-art" aria-hidden="true">' +
      '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      M.STAGE_ART[i] + '</svg></div>';
  }
  return '<div class="rd-slider">' +
    art +
    '<div class="rd-slider-value">' + esc(cur.label) + '</div>' +
    '<input class="rd-range" type="range" min="0" max="' + (list.length - 1) + '" step="1" value="' + i + '"' +
      ' data-slider="' + group + '" aria-label="' + esc(group) + '"' +
      ' aria-valuetext="' + esc(cur.label) + '">' +
    '<div class="rd-slider-stops">' +
      list.map(function (o, n) {
        return '<span class="rd-stop' + (n === i ? ' is-on' : '') + '">' + esc(o.label) + '</span>';
      }).join('') +
    '</div>' +
  '</div>';
}

function navRow(backable, nextLabel, nextAction, disabled) {
  return '<div class="rd-nav">' +
    (backable ? '<button class="btn ghost" type="button" data-action="prev">Back</button>' : '<span></span>') +
    (nextLabel ? '<button class="btn accent" type="button" data-action="' + nextAction + '"' +
      (disabled ? ' disabled' : '') + '>' + esc(nextLabel) + '</button>' : '') +
  '</div>';
}

function progress() {
  if (S.step < 1 || S.step > LAST_Q) return '';
  var pct = Math.round((S.step / LAST_Q) * 100);
  var active = currentPhase(S.step);
  return '<div class="rd-progress">' +
    '<div class="rd-progress-track" aria-hidden="true">' +
      '<div class="rd-progress-fill" style="width:' + pct + '%"></div>' +
    '</div>' +
    '<div class="rd-progress-phases" aria-hidden="true">' +
      PHASES.map(function (phase) {
        var state = S.step > phase.to ? ' is-done' : active.id === phase.id ? ' is-current' : '';
        return '<span class="rd-progress-phase' + state + '">' +
          '<span class="rd-progress-dot"></span>' + esc(phase.label) + '</span>';
      }).join('') +
    '</div>' +
    /* The phases are decoration to a screen reader, which needs the
       position said once, in words, rather than five dotted labels. */
    '<p class="rd-sr" aria-live="polite">' + esc(active.label) +
      ', question ' + S.step + ' of ' + LAST_Q + '</p>' +
  '</div>';
}

/* A pre-filled answer is shown as a confirmation, never as a silent
   assumption. That is the whole rule for the intake step. */
function prefillNote(field) {
  if (!S.prefilled[field]) return '';
  return '<p class="rd-prefill">We picked this up from what you wrote. Change it if it is not right.</p>';
}


/* =============================================================
   PHASES
   The progress line counts phases, not questions. "3 of 9" tells
   somebody how much homework is left; "Land, then Position" tells
   them what the thing is doing and roughly how far in they are. The
   bar still moves per question underneath.
   ============================================================= */
var PHASES = [
  { id: 'project',  label: 'Project',  from: 1, to: 1 },
  { id: 'land',     label: 'Land',     from: 2, to: 2 },
  { id: 'position', label: 'Position', from: 3, to: 5 },
  { id: 'delivery', label: 'Delivery', from: 6, to: 8 },
  { id: 'priority', label: 'Priority', from: 9, to: 9 }
];

function currentPhase(step) {
  for (var i = 0; i < PHASES.length; i++) {
    if (step >= PHASES[i].from && step <= PHASES[i].to) return PHASES[i];
  }
  return PHASES[0];
}

function findById(list, id) {
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

/* =============================================================
   THE PROJECT SNAPSHOT
   Builds visibly as the visitor answers. It is the difference
   between filling in a form and watching something get assembled.

   It shows ONLY what has actually been answered. It never implies
   that a point has been evaluated, and it carries no score, because
   the Quick Scan does not produce one.
   ============================================================= */
function projectSnapshot() {
  var type = findById(M.TYPES, S.type);
  var land = findById(M.LAND, S.land);
  var stage = findById(M.STAGES, S.stage);
  var money = findById(M.MONEY, S.money);

  var items = [];
  if (type) items.push({ label: 'Project', value: type.label });
  if (land) items.push({ label: 'Land', value: land.label });
  if (stage) items.push({ label: 'Position', value: stage.label });
  if (S.size && S.step >= 5) {
    items.push({ label: 'Scale', value: (S.size >= 200 ? '200 or more' : String(S.size)) +
      ' ' + (type ? type.unit : 'sites') });
  }
  if (money) items.push({ label: 'Money', value: money.label });
  if (S.team && S.team.length) {
    var names = S.team.map(function (id) {
      var t = findById(M.TEAM, id); return t ? t.label : id;
    });
    items.push({ label: 'Team', value: names.join(', ') });
  }
  if (!items.length) return '';

  return '<aside class="rd-snapshot" aria-label="Your project so far">' +
    '<div class="rd-snapshot-head">' +
      '<span class="eyebrow">Your project</span>' +
      '<span class="mono">SO FAR</span>' +
    '</div>' +
    '<dl>' + items.map(function (item) {
      return '<div><dt>' + esc(item.label) + '</dt><dd>' + esc(item.value) + '</dd></div>';
    }).join('') + '</dl>' +
  '</aside>';
}

/* One short paragraph on why the previous answer matters. Rendered on
   the screen AFTER the answer, because the photo and slider screens
   advance on tap and a note on the answering screen is never seen. */
function scanNote(group, value) {
  var notes = M.SCAN_NOTES && M.SCAN_NOTES[group];
  var copy = notes && notes[value];
  if (!copy) return '';
  TPA.track('quick_scan_field_note_viewed', { group: group, value: value });
  return '<aside class="rd-note" aria-live="polite">' +
    '<span class="eyebrow">Field note</span>' +
    '<p>' + esc(copy) + '</p>' +
  '</aside>';
}

/* The question pane and the snapshot, side by side on a desktop and
   stacked with the snapshot first on a phone. */
function workspace(inner) {
  return '<div class="rd-workspace">' +
    '<div class="rd-question-pane">' + inner + '</div>' +
    projectSnapshot() +
  '</div>';
}

/* ---------------------------------------------------------------
   SCREENS
   --------------------------------------------------------------- */

function scr0() {
  return '<section class="rd-screen">' +
    screenHead('Quick Scan', 'Tell us about your project.',
      'A sentence or two is plenty. Skip this if you would rather just tap through.') +
    '<textarea class="textarea rd-intake" id="rd-intake" rows="4" maxlength="600" ' +
      'placeholder="We have 40 acres outside Fredericksburg under contract, and we want about 25 glamping units.">' +
      esc(S.intake) + '</textarea>' +
    '<div class="rd-nav">' +
      '<button class="btn ghost" type="button" data-action="skip-intake">Skip this</button>' +
      '<button class="btn accent" type="button" data-action="use-intake">Start</button>' +
    '</div>' +
    '<p class="rd-foot muted">Ten questions, mostly pictures. About ninety seconds. No email needed.</p>' +
  '</section>';
}

function scr1() {
  return '<section class="rd-screen">' + progress() +
    screenHead('Project', 'What are you building?') +
    prefillNote('type') +
    '<div class="rd-grid rd-grid-4">' +
      M.TYPES.map(function (t) { return photoCard(t, 'type', S.type === t.id); }).join('') +
    '</div>' + navRow(true, '', '') +
  '</section>';
}

function scr2() {
  return '<section class="rd-screen">' + progress() +
    screenHead('Land', 'Which of these looks most like your land?') +
    prefillNote('land') +
    '<div class="rd-grid rd-grid-4">' +
      M.LAND.map(function (t) { return photoCard(t, 'land', S.land === t.id); }).join('') +
    '</div>' + navRow(true, '', '') +
  '</section>';
}

function scr3() {
  return '<section class="rd-screen">' + progress() +
    screenHead('Position', 'Where are you today?') +
    /* The land answer landed on the previous screen, which advances
       on tap. This is the first chance to say why it mattered. */
    workspace(
      scanNote('land', S.land) +
      prefillNote('stage') +
      stopSlider('stage', M.STAGES, S.stage || M.STAGES[0].id, true) +
      navRow(true, 'Next', 'next')
    ) +
  '</section>';
}

function scr4() {
  var a = { id: 'a', label: 'This one', img: 'compare-a', w: 800,
    caption: 'Austin Moto Adventures, Texas', credit: 'Ten Point Services' };
  var b = { id: 'b', label: 'This one', img: 'compare-b', w: 800,
    caption: 'Lagom Retreat, Dripping Springs, Texas', credit: 'Ten Point Services' };
  return '<section class="rd-screen">' + progress() +
    screenHead('Position', 'Which one is closer to what you are building?') +
    workspace(
      scanNote('stage', S.stage) +
      '<div class="rd-grid rd-grid-2 rd-compare">' +
        photoCard(a, 'compare', S.compare === 'a') +
        photoCard(b, 'compare', S.compare === 'b') +
      '</div>' + navRow(true, '', '')
    ) +
  '</section>';
}

function scr5() {
  var t = null;
  for (var i = 0; i < M.TYPES.length; i++) if (M.TYPES[i].id === S.type) t = M.TYPES[i];
  var unit = t ? t.unit : 'sites';
  var shown = S.size >= 200 ? '200 or more' : String(S.size);
  return '<section class="rd-screen">' + progress() +
    screenHead('Position', 'About how many ' + unit + '?') +
    workspace(
    prefillNote('size') +
    '<div class="rd-slider rd-size">' +
      '<div class="rd-size-value">' + esc(shown) + ' <span class="rd-size-unit">' + esc(unit) + '</span></div>' +
      '<div class="rd-size-art" aria-hidden="true">' + sizeArt(S.size) + '</div>' +
      '<input class="rd-range" type="range" min="1" max="200" step="1" value="' + S.size + '"' +
        ' data-size aria-label="Number of ' + esc(unit) + '" aria-valuetext="' + esc(shown) + ' ' + esc(unit) + '">' +
      '<div class="rd-slider-stops"><span class="rd-stop">1</span><span class="rd-stop">50</span>' +
      '<span class="rd-stop">100</span><span class="rd-stop">150</span><span class="rd-stop">200 or more</span></div>' +
    '</div>' + navRow(true, 'Next', 'next')
    ) +
  '</section>';
}

/* The illustration above the size slider changes as the number
   moves: a row of unit marks that fills out with the count. */
function sizeArt(n) {
  var marks = Math.max(1, Math.min(24, Math.round(n / 9) + 1));
  var out = '<svg viewBox="0 0 240 44" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">';
  for (var i = 0; i < marks; i++) {
    var x = 6 + i * 9.6;
    out += '<path d="M' + x + ' 32 l4-6 4 6z"></path><path d="M' + x + ' 32h8"></path>';
  }
  return out + '</svg>';
}

function scr6() {
  return '<section class="rd-screen">' + progress() +
    screenHead('Delivery', 'How firm is the money?') +
    workspace(
      prefillNote('money') +
      stopSlider('money', M.MONEY, S.money || M.MONEY[0].id) +
      navRow(true, 'Next', 'next')
    ) +
  '</section>';
}

function scr7() {
  return '<section class="rd-screen">' + progress() +
    screenHead('Delivery', 'How firm is the opening date?') +
    workspace(
      prefillNote('date') +
      stopSlider('date', M.DATES, S.date || M.DATES[0].id) +
      navRow(true, 'Next', 'next')
    ) +
  '</section>';
}

function scr8() {
  return '<section class="rd-screen">' + progress() +
    screenHead('Delivery', 'Who is on the team so far?', 'Tap all that apply.') +
    workspace(
    '<div class="rd-grid rd-grid-3 rd-chips">' +
      M.TEAM.map(function (o) {
        var on = S.team.indexOf(o.id) !== -1;
        return '<button class="rd-chip' + (on ? ' is-on' : '') + '" type="button" data-team="' + esc(o.id) + '"' +
          ' aria-pressed="' + (on ? 'true' : 'false') + '">' + esc(o.label) + '</button>';
      }).join('') +
    '</div>' + navRow(true, 'Next', 'next')
    ) +
  '</section>';
}

function scr9() {
  return '<section class="rd-screen">' + progress() +
    screenHead('Priority', 'What is on your mind the most right now?') +
    workspace(
    '<div class="rd-grid rd-grid-3 rd-chips">' +
      M.WORRIES.map(function (o) {
        var on = S.worry === o.id;
        return '<button class="rd-chip rd-chip-lg' + (on ? ' is-on' : '') + '" type="button"' +
          ' data-pick="worry" data-val="' + esc(o.id) + '" aria-pressed="' + (on ? 'true' : 'false') + '">' +
          esc(o.label) + '</button>';
      }).join('') +
    '</div>' + navRow(true, '', '')
    ) +
  '</section>';
}

/* The payoff. Ring, position, written read, two doors of equal
   weight. No number anywhere on this screen. */
function scrResult() {
  var R = M.evaluate(S);
  var lines = (S.modelLines && S.modelLines.length) ? S.modelLines : R.lines;

  var html = '<section class="rd-result">' +
    '<div class="rd-result-top">' +
      '<div class="rd-ring-wrap">' +
        TPRing.svg({
          segments: R.segments, size: 300,
          center: { top: 'DIRECTIONAL', main: R.bandName, sub: R.greyCount + ' not yet scored' }
        }) +
      '</div>' +
      '<div class="rd-result-lead">' +
        '<div class="eyebrow dotted">Your Project Scan</div>' +
        '<h1 class="rd-band">Ten Point ' + esc(R.bandName) + '</h1>' +
        '<p class="rd-directional mono">DIRECTIONAL READ · ' + R.litCount + ' OF 10 POINTS</p>' +
        '<div class="rd-lines">' + lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div>' +
      '</div>' +
    '</div>' +

    '<div class="rd-legend-wrap">' +
      '<h3>The ten points.</h3>' +
      '<p class="muted rd-legend-note">Four to six of these have a direction from what you just told us. The rest need the full questions before anyone can say anything honest about them.</p>' +
      TPRing.legend(R.segments) +
    '</div>' +

    '<div class="rd-doors">' +
      '<div class="card rd-door">' +
        '<h3>Score all ten points</h3>' +
        '<p class="muted">Forty questions. About five minutes. We will email you the full scorecard.</p>' +
        '<a class="btn accent lg" href="/standard/" data-door="standard">Continue to the Full Assessment</a>' +
      '</div>' +
      '<div class="card rd-door">' +
        '<h3>Talk it through with us</h3>' +
        '<p class="muted">Twenty minutes with the team that builds these.</p>' +
        '<a class="btn lg" href="/consultation/" data-door="consultation">Set up a conversation</a>' +
      '</div>' +
    '</div>' +

    '<div class="rd-result-foot">' +
      '<p class="muted">The Quick Scan is a directional diagnostic. It is not a feasibility study, an appraisal, a cost estimate, or advice on any specific project.</p>' +
      '<button class="rd-link" type="button" data-action="reset">Start over</button>' +
    '</div>' +
  '</section>';
  return html;
}

var SCREENS = [scr0, scr1, scr2, scr3, scr4, scr5, scr6, scr7, scr8, scr9, scrResult];

/* ---------------------------------------------------------------
   FLOW
   --------------------------------------------------------------- */
function render() {
  document.getElementById('rd-app').innerHTML = SCREENS[S.step]();
  document.body.setAttribute('data-rd-step', S.step);
  window.scrollTo(0, 0);
  var ta = document.getElementById('rd-intake');
  if (ta) ta.focus();
}

function go(n) {
  var prev = S.step;
  if (n >= 1 && n <= LAST_Q) {
    var ph = currentPhase(n);
    TPA.once('quick_scan_phase_viewed', { phase: ph.id }, 'phase-' + ph.id);
  }
  S.step = Math.max(0, Math.min(RESULT, n));
  if (S.step > prev && prev >= 1 && prev <= LAST_Q) {
    TPA.once('read_screen_complete', { screen_number: prev }, 'screen-' + prev);
  }
  if (S.step === RESULT && !S.done) {
    S.done = true;
    var R = M.evaluate(S);
    TPA.once('read_complete', { band: R.bandName.toLowerCase(), worry: S.worry || 'none' });
    requestModelRead();
  }
  save();
  render();
}

/* Ask the model to say the same thing in the visitor's own project
   language. The template is already on screen; a successful reply
   swaps it, a failure changes nothing. */
function requestModelRead() {
  if (!TPModel.enabled()) return;
  askModel('read', {
    type: S.type, land: S.land, stage: S.stage, size: S.size,
    money: S.money, date: S.date, team: S.team, worry: S.worry,
    intake: S.intake, gate: M.evaluate(S).gateKey, band: M.evaluate(S).bandName
  }, function (out) {
    var clean = TPModel.cleanLines(out, 3);
    if (!clean) return;
    S.modelLines = clean;
    if (S.step === RESULT) render();
  });
}

function applyExtract(fields) {
  var allowed = { type: 1, land: 1, stage: 1, size: 1, money: 1, date: 1 };
  var used = false;
  for (var k in fields) {
    if (!allowed[k]) continue;
    if (fields[k] === undefined || fields[k] === null || fields[k] === '') continue;
    S[k] = fields[k];
    S.prefilled[k] = true;
    used = true;
  }
  return used;
}

/* ---------------------------------------------------------------
   EVENTS
   --------------------------------------------------------------- */
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-action],[data-pick],[data-team],[data-door]');
  if (!el) return;

  if (el.dataset.door) {
    TPA.track('consultation_cta_clicked', { placement: 'read_result' });
    if (el.dataset.door === 'standard') TPA.track('cta_click', { cta: 'full_standard' });
    return;                                   // let the link navigate
  }

  if (el.dataset.pick) {
    startOnce();
    var g = el.dataset.pick;
    S[g] = el.dataset.val;
    delete S.prefilled[g];
    save();
    // A photo tap is the answer and the Next button at once.
    go(S.step + 1);
    return;
  }

  if (el.dataset.team) {
    startOnce();
    var id = el.dataset.team;
    var at = S.team.indexOf(id);
    if (id === 'none') {
      S.team = at === -1 ? ['none'] : [];
    } else {
      var none = S.team.indexOf('none');
      if (none !== -1) S.team.splice(none, 1);
      if (at === -1) S.team.push(id); else S.team.splice(at, 1);
    }
    save();
    render();
    return;
  }

  switch (el.dataset.action) {
    case 'use-intake': {
      var ta = document.getElementById('rd-intake');
      S.intake = ta ? (ta.value || '').trim() : '';
      startOnce();
      if (S.intake) {
        var local = M.extractLocal(S.intake);
        var used = applyExtract(local);
        S.intakeUsed = true;
        TPA.once('read_intake_used', { fields_filled: Object.keys(S.prefilled).length });
        // The model, when it is wired, gets the same job and wins if
        // it answers in time. Nothing waits on it.
        askModel('intake', { text: S.intake }, function (out) {
          if (out && out.fields) {
            if (applyExtract(out.fields) && S.step >= 1 && S.step <= LAST_Q) render();
          }
        });
        if (used) { /* fall through to screen 1 as a confirmation */ }
      }
      save();
      go(1);
      break;
    }
    case 'skip-intake':
      startOnce();
      go(1);
      break;
    case 'next':
      // Sliders default to their first stop, which is a real answer.
      if (S.step === 3 && !S.stage) S.stage = M.STAGES[0].id;
      if (S.step === 6 && !S.money) S.money = M.MONEY[0].id;
      if (S.step === 7 && !S.date) S.date = M.DATES[0].id;
      go(S.step + 1);
      break;
    case 'prev':
      go(S.step - 1);
      break;
    case 'reset':
      TPA.reset('read_');
      S = { step: 0, intake: '', intakeUsed: false, prefilled: {}, type: '', land: '', stage: '',
        compare: '', size: 20, money: '', date: '', team: [], worry: '', done: false };
      save();
      render();
      break;
  }
});

document.addEventListener('input', function (e) {
  var el = e.target;
  if (el.dataset && el.dataset.slider) {
    var group = el.dataset.slider;
    var list = group === 'stage' ? M.STAGES : group === 'money' ? M.MONEY : M.DATES;
    S[group] = list[parseInt(el.value, 10)].id;
    delete S.prefilled[group];
    save();
    render();
    var again = document.querySelector('[data-slider="' + group + '"]');
    if (again) again.focus();
    return;
  }
  if (el.hasAttribute && el.hasAttribute('data-size')) {
    S.size = parseInt(el.value, 10);
    delete S.prefilled.size;
    save();
    var wrap = document.querySelector('.rd-size');
    if (wrap) {
      var t = null;
      for (var i = 0; i < M.TYPES.length; i++) if (M.TYPES[i].id === S.type) t = M.TYPES[i];
      var shown = S.size >= 200 ? '200 or more' : String(S.size);
      wrap.querySelector('.rd-size-value').innerHTML =
        esc(shown) + ' <span class="rd-size-unit">' + esc(t ? t.unit : 'sites') + '</span>';
      wrap.querySelector('.rd-size-art').innerHTML = sizeArt(S.size);
      el.setAttribute('aria-valuetext', shown);
    }
  }
});

function startOnce() {
  TPA.once('read_start', {});
}

/* Abandonment is the number that tells us whether ninety seconds is
   short enough, so it has to fire on the way out, not on a button. */
function armAbandon() {
  var sent = false;
  function fire() {
    if (sent || S.done || S.step < 1) return;
    sent = true;
    TPA.once('read_abandon', { last_screen: S.step });
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
