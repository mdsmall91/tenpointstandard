'use strict';

/* Test harness for the Results Logic Specification v2 engine.
   Runs in the browser (no build step); writes a JSON summary to #out
   and window.__results. */

(function () {
  var failures = [], passes = 0;

  function check(name, cond, detail) {
    if (cond) { passes++; }
    else { failures.push({ test: name, detail: detail === undefined ? '' : detail }); }
  }

  /* Build an answers map from ten arrays of four values (true/false/undefined). */
  function answersFrom(grid) {
    var a = {};
    for (var pi = 0; pi < 10; pi++) {
      for (var qi = 0; qi < 4; qi++) {
        var v = grid[pi][qi];
        if (v !== undefined) a[pi + '-' + qi] = v;
      }
    }
    return a;
  }
  function uniform(v) {
    var g = [];
    for (var i = 0; i < 10; i++) g.push([v, v, v, v]);
    return g;
  }
  var Y = true, N = false;

  /* Invariants that must hold for every vector. */
  function checkInvariants(name, a) {
    var R = TPResults.evaluate(a);
    check(name + ': headline', typeof R.headline === 'string' && R.headline.length > 0);
    check(name + ': verdict label', typeof R.verdict.label === 'string' && R.verdict.label.length > 0);
    check(name + ': findings 3-5', R.findings.length >= 3 && R.findings.length <= 5, R.findings.length);
    check(name + ': exactly 3 actions', R.actions.length === 3, R.actions.length);
    check(name + ': ledger rows', R.ledger.length === 10);
    /* Ledger cap: open gate forces at most In Progress. */
    var capOk = R.ledger.every(function (row) {
      return !row.gateOpen || (row.label !== 'Resolved' && row.label !== 'Nearly Resolved');
    });
    check(name + ': gate caps ledger label', capOk, JSON.stringify(R.ledger));
    /* Locked honesty: every locked row's pattern has at least one true condition. */
    var y = [], q = function (pi, qi) { return a[pi + '-' + qi] === true; };
    for (var i = 0; i < 10; i++) {
      var c = 0;
      for (var j = 0; j < 4; j++) if (q(i, j)) c++;
      y.push(c);
    }
    var ctx = { y: y, q: q, verdictStage: R.verdict.stage };
    var honest = R.lockedRows.every(function (row) {
      var f = TPResults.LIB.filter(function (x) { return x.id === row.id; })[0];
      return f && f.conds.some(function (fn) { return fn(ctx); });
    });
    check(name + ': locked honesty', honest);
    /* Determinism. */
    check(name + ': deterministic', JSON.stringify(R) === JSON.stringify(TPResults.evaluate(a)));
    return R;
  }

  /* ---------- explicit vectors ---------- */

  /* Perfect score. */
  var R = checkInvariants('T100', answersFrom(uniform(Y)));
  check('T100 score', R.score === 100, R.score);
  check('T100 headline', R.headline === 'Protect the Plan', R.headline);
  check('T100 protect findings', R.findings.length === 3 && R.findings.every(function (f) { return f.kind === 'protect'; }));
  check('T100 no locked list', R.lockedCount === 0, R.lockedCount);
  check('T100 verdict', R.verdict.label === 'Build', R.verdict.label);

  /* Score 0, all answered no. */
  R = checkInvariants('T0no', answersFrom(uniform(N)));
  check('T0no headline', R.headline === 'Start at the Beginning', R.headline);
  check('T0no gate fallbacks', R.findings.slice(0, 3).every(function (f) { return f.kind === 'gate'; }),
    JSON.stringify(R.findings.map(function (f) { return f.title; })));
  check('T0no first gate is site control', R.findings[0].title === 'Site control is open.', R.findings[0].title);
  check('T0no actions from gates', R.actions[0].indexOf('Secure site control') === 0, R.actions[0]);

  /* Score 0, all unanswered: same treatment. */
  R = checkInvariants('T0un', {});
  check('T0un headline', R.headline === 'Start at the Beginning', R.headline);
  check('T0un verdict Align', R.verdict.stage === 0, R.verdict.label);

  /* v2 point order: 0 Property, 1 Capital, 2 Regulatory, 3 Guests, 4 Design,
     5 Procurement, 6 Schedule, 7 Cost, 8 QA, 9 Opening.
     Gate cells: (1,1) land, (3,0) guest, (2,0) rights, (0,2) ground,
     (1,0) money, (7,1) number. */

  /* The core catch: all non-gate yes, all six gates no. Score 81, verdict Align. */
  var g81 = uniform(Y);
  g81[1][1] = N; g81[3][0] = N; g81[2][0] = N; g81[0][2] = N; g81[1][0] = N; g81[7][1] = N;
  R = checkInvariants('T81', answersFrom(g81));
  check('T81 score', R.score === 81, R.score);
  check('T81 verdict forced Align', R.verdict.stage === 0 && R.verdict.label === 'Align', R.verdict.label);
  check('T81 headline rule 3', R.headline === 'The Paper Is Ahead of the Ground', R.headline);
  check('T81 six open gates', R.openGates.length === 6, R.openGates.length);

  /* Rule 1: 90+, no gates (non-perfect). QA down two, Procurement q1 no: 96. */
  var g92 = uniform(Y);
  g92[8][0] = N; g92[8][1] = N;
  g92[5][0] = N;
  R = checkInvariants('T92', answersFrom(g92));
  check('T92 rule 1 headline', R.score >= 90 && R.openGates.length === 0 && R.headline === 'Protect the Plan',
    R.score + '/' + R.openGates.length + '/' + R.headline);

  /* Rule 2: 70+, one gate. Gate finding first, gate action first. */
  var g98 = uniform(Y);
  g98[7][1] = N; /* Q8.2 no */
  R = checkInvariants('T98', answersFrom(g98));
  check('T98 score', R.score === 98, R.score);
  check('T98 headline rule 2', R.headline === 'Strong Plan. Open Gates.', R.headline);
  check('T98 verdict gated', R.verdict.label === 'Build, gated', R.verdict.label);
  check('T98 gate finding first', R.findings[0].kind === 'gate' && R.findings[0].title === 'Budget validation is open.',
    R.findings[0].title);
  check('T98 gate action first', R.actions[0].indexOf('Have a third party validate') === 0, R.actions[0]);

  /* Rule 4: Vision and Delivery high, Deal low (score 52, below 55 so rule 3 cannot mask it). */
  var g4 = [[N,N,N,N],[N,N,N,N],[N,N,N,N],[Y,Y,Y,Y],[Y,Y,Y,Y],[Y,Y,Y,Y],[Y,Y,Y,Y],[N,N,N,N],[Y,Y,Y,Y],[Y,Y,Y,Y]];
  R = checkInvariants('T-rule4', answersFrom(g4));
  check('rule4 headline', R.headline === 'The Paper Is Ahead of the Ground', R.headline + ' score=' + R.score);

  /* Rule 5: Deal high, Vision low. */
  var g5 = [[Y,Y,Y,Y],[Y,Y,Y,Y],[Y,Y,Y,Y],[N,N,N,N],[N,N,N,N],[Y,Y,N,N],[Y,Y,N,N],[Y,Y,Y,Y],[Y,Y,N,N],[Y,Y,N,N]];
  R = checkInvariants('T-rule5', answersFrom(g5));
  check('rule5 headline', R.headline === 'The Deal Is Ahead of the Guest', R.headline + ' score=' + R.score);

  /* Rule 6: Vision and Deal high, Delivery low. */
  var g6 = [[Y,Y,Y,Y],[Y,Y,Y,Y],[Y,Y,Y,Y],[Y,Y,Y,Y],[Y,Y,Y,Y],[N,N,N,N],[N,N,N,N],[Y,Y,Y,Y],[N,N,N,N],[N,N,N,N]];
  R = checkInvariants('T-rule6', answersFrom(g6));
  check('rule6 headline', R.headline === 'The Plan Stops at the Property Line', R.headline + ' score=' + R.score);

  /* Rule 7: Vision high, Deal and Delivery low. */
  var g7 = [[N,N,N,N],[N,N,N,N],[N,N,N,N],[Y,Y,Y,Y],[Y,Y,Y,Y],[N,N,N,N],[N,N,N,N],[N,N,N,N],[N,N,N,N],[N,N,N,N]];
  R = checkInvariants('T-rule7', answersFrom(g7));
  check('rule7 headline', R.headline === 'The Idea Is Ahead of the Project', R.headline + ' score=' + R.score);

  /* Rule 8: exactly 3 open gates (land, rights, ground), mid clusters. */
  var g8 = [[Y,Y,N,N],[Y,N,N,N],[N,Y,Y,N],[Y,Y,N,N],[Y,Y,N,N],[Y,Y,N,N],[Y,Y,N,N],[Y,Y,N,N],[Y,N,Y,N],[Y,Y,N,N]];
  R = checkInvariants('T-rule8', answersFrom(g8));
  check('rule8 open gates = 3', R.openGates.length === 3, JSON.stringify(R.openGates));
  check('rule8 headline', R.headline === 'The Fundamentals Come First', R.headline + ' score=' + R.score);
  check('rule8 verdict dropped one stage', R.verdict.stage === Math.max(0, R.band - 1), R.verdict.label);

  /* Rule 9: score below 15, two open gates. */
  var g9 = uniform(N);
  g9[1][1] = Y; g9[3][0] = Y; g9[2][0] = Y; g9[0][2] = Y; /* 4+3+3+3 = 13 */
  R = checkInvariants('T-rule9', answersFrom(g9));
  check('rule9 score', R.score === 13, R.score);
  check('rule9 headline', R.headline === 'Start at the Beginning', R.headline);

  /* Rule 10: no gates, mid clusters, seams fire; headline = top seam title (CE2). */
  var g10 = [[Y,N,Y,N],[Y,Y,N,N],[Y,N,N,N],[Y,Y,N,N],[Y,Y,N,N],[Y,Y,N,N],[Y,Y,Y,Y],[Y,Y,N,N],[Y,Y,N,N],[Y,Y,N,N]];
  R = checkInvariants('T-rule10', answersFrom(g10));
  check('rule10 no gates', R.openGates.length === 0, JSON.stringify(R.openGates));
  check('rule10 headline is top seam', R.headline === 'Cost Confidence Without Ground Truth', R.headline);

  /* Rule 11 fallback: no seams, no gates, mid clusters. */
  var g11 = [[Y,Y,Y,N],[Y,Y,N,N],[Y,Y,N,N],[Y,Y,N,N],[Y,Y,N,N],[N,Y,N,Y],[Y,Y,N,N],[Y,Y,N,N],[Y,Y,N,N],[Y,N,Y,N]];
  R = checkInvariants('T-rule11', answersFrom(g11));
  check('rule11 fallback headline', R.headline === 'Close the Gaps on Paper', R.headline + ' score=' + R.score);
  check('rule11 protect backfill', R.findings.length === 3 && R.findings.every(function (f) { return f.kind === 'protect'; }),
    JSON.stringify(R.findings.map(function (f) { return f.kind; })));

  /* Ledger cap: capital 3 yes with Q2.1 no would read Nearly Resolved; must cap. */
  var gcap = uniform(Y);
  gcap[1][0] = N; /* Q2.1 no: capital y=3, gate open */
  R = checkInvariants('T-cap', answersFrom(gcap));
  check('cap label', R.ledger[1].label === 'In Progress' && R.ledger[1].gateOpen, JSON.stringify(R.ledger[1]));

  /* ---------- QUESTIONS.md consistency (spec check 6) ---------- */
  fetch('../QUESTIONS.md').then(function (r) { return r.text(); }).then(function (md) {
    var rx = /^- Q(\d+)\.(\d+)( \(GATE\))?: (.+)$/gm, m, found = 0, gateIds = [];
    while ((m = rx.exec(md)) !== null) {
      found++;
      var pi = parseInt(m[1], 10) - 1, qi = parseInt(m[2], 10) - 1;
      var text = m[4].trim();
      check('QMD Q' + m[1] + '.' + m[2] + ' matches app.js', POINTS[pi] && POINTS[pi].qs[qi] === text,
        'md: ' + text + ' | app: ' + (POINTS[pi] ? POINTS[pi].qs[qi] : 'missing'));
      if (m[3]) gateIds.push('Q' + m[1] + '.' + m[2]);
    }
    check('QMD has 40 questions', found === 40, found);
    var engineGates = TPResults.GATES.map(function (g) { return g.id; }).sort().join(',');
    check('QMD gates match engine', gateIds.sort().join(',') === engineGates, gateIds.join(','));
    /* Engine metadata matches app.js POINTS. */
    for (var i = 0; i < 10; i++) {
      check('engine meta point ' + (i + 1),
        TPResults.TITLES[i] === POINTS[i].title && TPResults.PTS[i] === POINTS[i].pts && TPResults.MAX[i] === POINTS[i].max);
    }
    sweep();
  }).catch(function (e) {
    check('QUESTIONS.md fetch', false, String(e));
    sweep();
  });

  /* ---------- seeded random sweep ---------- */
  function sweep() {
    var seed = 42;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    var n = 20000, bad = 0;
    for (var t = 0; t < n; t++) {
      var a = {};
      for (var k = 0; k < 40; k++) {
        var r = rnd();
        if (r < 0.45) a[Math.floor(k / 4) + '-' + (k % 4)] = true;
        else if (r < 0.9) a[Math.floor(k / 4) + '-' + (k % 4)] = false;
        /* else unanswered */
      }
      var R;
      try { R = TPResults.evaluate(a); } catch (e) { bad++; check('sweep exception', false, String(e)); break; }
      if (!(R.headline && R.verdict.label && R.findings.length >= 3 && R.findings.length <= 5 &&
            R.actions.length === 3 &&
            R.ledger.every(function (row) { return !row.gateOpen || (row.label !== 'Resolved' && row.label !== 'Nearly Resolved'); }))) {
        bad++;
        check('sweep invariant vector ' + t, false, JSON.stringify({ a: a, h: R.headline, f: R.findings.length, act: R.actions.length }));
        if (bad > 5) break;
      }
    }
    check('sweep clean (' + n + ' vectors)', bad === 0, bad + ' bad');
    report();
  }

  function report() {
    var summary = { passes: passes, failures: failures };
    window.__results = summary;
    document.getElementById('out').textContent = JSON.stringify(summary, null, 2);
  }
})();
