'use strict';

/* =============================================================
   THE FORWARDABLE SCORECARD
   Reads the answers out of the URL fragment, runs the same engine
   the site ran, and renders the whole result as a document.

   It is not a receipt. It is the artifact somebody sends to their
   engineer, their lender, and their partner, and each of those three
   then arrives here. That is how one lead becomes three, which is
   why this page carries the masthead, prints cleanly, and says out
   loud that it is meant to be shared.

   No server and no database. Because the answers are in the link and
   the engine is deterministic, this page cannot drift from the
   result the person actually saw, and the link cannot expire.
   ============================================================= */

/* Point titles and question text come from app.js's POINTS, which is
   the same array the assessment renders and the same one tests/tests.js
   holds byte-identical to QUESTIONS.md. Loading app.js here is safe: it
   only boots when an #app element exists, and this page has none. */
function pointTitle(i) { return POINTS[i].title; }
function questionText(i, q) { return POINTS[i].qs[q]; }

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function answerCell(v) {
  if (v === true) return '<span class="sc-ans sc-ans-yes">Yes</span>';
  if (v === false) return '<span class="sc-ans sc-ans-no">No</span>';
  if (v === 'unsure') return '<span class="sc-ans sc-ans-unsure">Not sure</span>';
  return '<span class="sc-ans sc-ans-no">Not answered</span>';
}

function ringSegments(answers, R) {
  var segs = [];
  for (var i = 0; i < 10; i++) {
    var started = false, yes = 0;
    for (var q = 0; q < 4; q++) {
      var v = answers[i + '-' + q];
      if (v !== undefined) started = true;
      if (v === true) yes++;
    }
    segs.push({
      n: (i + 1 < 10 ? '0' : '') + (i + 1),
      label: pointTitle(i),
      state: started ? 'scored' : 'unscored',
      fill: yes / 4,
      score: R.ledger[i].score,
      max: R.ledger[i].max,
      gateOpen: R.ledger[i].gateOpen
    });
  }
  return segs;
}

function renderEmpty() {
  return '<div class="sc-empty">' +
    '<h1>This scorecard link is not complete.</h1>' +
    '<p class="lede muted" style="margin: 20px auto 0;">The answers travel inside the link, so a link that was cut in half on the way here cannot be rebuilt. Ask whoever sent it for the whole thing, or take the assessment yourself.</p>' +
    '<p style="margin-top: 32px;"><a class="btn accent lg" href="/standard/">Start the Full Assessment</a></p>' +
  '</div>';
}

function render() {
  var answers = TPScoreCode.fromHash(location.hash);
  var root = document.getElementById('sc-app');
  if (!answers) { root.innerHTML = renderEmpty(); return; }

  var R = TPResults.evaluate(answers);
  var segs = ringSegments(answers, R);

  var html = '<div class="sc-top">' +
      '<div>' + TPRing.svg({
        segments: segs, size: 280,
        center: { top: R.verdict.gated ? 'GATED' : '', main: String(R.score), sub: 'of 100 · ' + R.verdict.label }
      }) + '</div>' +
      '<div>' +
        '<div class="eyebrow dotted">The Ten Point Standard</div>' +
        '<h1 class="sc-headline">' + esc(R.headline) + (/\.$/.test(R.headline) ? '' : '.') + '</h1>' +
        '<p class="sc-sub">' + esc(R.subhead) + '</p>' +
        (R.verdict.framing ? '<p style="margin-top:16px;font-weight:500;">' + esc(R.verdict.framing) + '</p>' : '') +
        '<p class="muted" style="margin-top:12px;font-size:14px;">' + esc(R.verdict.body) + '</p>' +
      '</div>' +
    '</div>';

  html += '<div class="sc-block">' +
      '<h2>The read.</h2>' +
      '<div class="sc-read">' +
        TPStandardRead.compose(R, null).map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') +
      '</div>' +
    '</div>';

  html += '<div class="sc-block">' +
      '<h2>Three priority actions.</h2>' +
      '<ol class="sc-actions">' + R.actions.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ol>' +
    '</div>';

  html += '<div class="sc-block">' +
      '<h2>The ten points.</h2>' +
      TPRing.legend(segs) +
    '</div>';

  // The full ledger. Forty rows is the point: this is the document a
  // civil engineer or a lender reads line by line.
  html += '<div class="sc-block">' +
      '<h2>Every answer.</h2>' +
      '<table class="sc-ledger"><thead><tr><th>Point</th><th>Question</th><th>Answer</th></tr></thead><tbody>';
  for (var i = 0; i < 10; i++) {
    for (var q = 0; q < 4; q++) {
      html += '<tr>' +
        '<td class="num">' + (q === 0 ? esc(pointTitle(i)) : '') + '</td>' +
        '<td>' + esc(questionText(i, q)) + '</td>' +
        '<td class="num">' + answerCell(answers[i + '-' + q]) + '</td>' +
      '</tr>';
    }
  }
  html += '</tbody></table></div>';

  html += '<div class="sc-share">' +
      '<h3>Forward this to your engineer, your lender, or your partner.</h3>' +
      '<p class="muted">It is meant to be shared. Everything on this page travels in the link, so anyone you send it to sees exactly what you see.</p>' +
      '<div class="sc-share-row">' +
        '<button class="btn accent" id="sc-copy">Copy the link</button>' +
        '<a class="btn ghost" href="/standard/">Take it yourself</a>' +
        '<a class="btn ghost" href="/consultation/">Talk to us</a>' +
      '</div>' +
      '<p class="muted" style="margin-top:16px;font-size:12px;">' + esc(R.disclaimer) + '</p>' +
    '</div>';

  root.innerHTML = html;

  document.getElementById('sc-copy').addEventListener('click', function () {
    var url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)['catch'](function () {});
    }
    this.textContent = 'Copied';
    TPA.track('scorecard_forwarded', { method: 'copy_link' });
  });

  /* No personal information ever goes to analytics: this records that
     a scorecard was opened and what band it was, nothing else. */
  TPA.once('scorecard_viewed', {
    score: R.score,
    band: ['align', 'design', 'build'][R.verdict.stage],
    not_sure_count: R.notSureCount
  });
}

if (document.getElementById('sc-app')) {
  TPA.init();
  render();
  window.addEventListener('hashchange', render);
}
