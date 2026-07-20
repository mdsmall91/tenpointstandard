'use strict';

/* =============================================================
   RESULTS ENGINE — Results Logic Specification v2.
   Pure and deterministic: answers map in, results object out.
   No DOM access, no question text (IDs only; text lives in
   QUESTIONS.md and app.js POINTS, kept in sync by tests).

   Answer semantics: an unanswered question counts as no
   everywhere (gates, seam triggers, yes-counts). "Qx.y = yes"
   requires an explicit yes.
   ============================================================= */

var TPResults = (function () {

  var PTS = [3, 3, 4, 3, 2, 3, 2, 2, 2, 1];
  var MAX = [12, 12, 16, 12, 8, 12, 8, 8, 8, 4];
  var TITLES = ['Your Guests', 'Your Site', 'Capital Plan', 'Operations Plan', 'Schedule',
    'Entitlements & Regulatory', 'Design', 'Procurement', 'Cost Certainty', 'Quality Assurance'];
  var SHORT = ['Guests', 'Site', 'Capital', 'Operations', 'Schedule',
    'Entitlements', 'Design', 'Procurement', 'Cost Certainty', 'QA'];
  var CLUSTERS = {
    vision: { pts: [0, 6], possible: 20 },
    deal: { pts: [1, 2, 5, 8], possible: 48 },
    delivery: { pts: [3, 4, 7, 9], possible: 32 }
  };
  var STAGE_NAMES = ['Align', 'Design', 'Build'];
  var STAGE_TITLES = ['Answer the fundamentals.', 'Close the gaps on paper.', 'Protect the plan.'];
  var STAGE_SERVICES = ['Ten Point Align', 'Ten Point Design', 'Ten Point Build'];
  var STAGE_BODIES = [
    'Market, land, and money come first. Settle who the guest is, what the site can support, and how the project is funded, before spending on design or permits.',
    'The idea holds. The remaining risk lives in entitlements, drawings, procurement, and pricing, which is cheaper to resolve on paper than in the field.',
    'The seams are closed. The work from here is holding schedule, budget, and quality through construction, commissioning, and the first guest stay.'
  ];
  var FALLBACK_HEADLINES = ['Answer the Fundamentals', 'Close the Gaps on Paper', 'Protect the Plan'];

  /* Gates in dependency order: land, guest, rights, ground, money, number. */
  var GATES = [
    { id: 'Q3.2', pi: 2, qi: 1, name: 'Site control',
      why: 'Without site control, nothing else is real.',
      action: 'Secure site control in writing: purchase agreement, option, or lease. Until the land is yours to develop, nothing downstream is real.' },
    { id: 'Q1.1', pi: 0, qi: 0, name: 'Guest demand',
      why: "Demand in the area is the business case's floor.",
      action: 'Assemble the demand evidence on one page: area visitation data, comps, or bookings. It is the first document every partner asks for.' },
    { id: 'Q6.1', pi: 5, qi: 0, name: 'Use rights',
      why: 'Use rights decide whether the project is legal as conceived.',
      action: 'Schedule a pre-application meeting with the jurisdiction. Leave with the use determination, approval path, and timeline in writing.' },
    { id: 'Q2.3', pi: 1, qi: 2, name: 'Utilities',
      why: 'Utilities feasibility is the foundation every design and budget answer sits on.',
      action: "Get a civil engineer's utility feasibility letter or will-serve confirmations for water, sanitary, power, and stormwater." },
    { id: 'Q3.1', pi: 2, qi: 0, name: 'Capital stack',
      why: 'An unfunded stack stops the project regardless of readiness elsewhere.',
      action: 'Document the capital stack: sources, amounts, status, terms. Name what is committed and what is assumed.' },
    { id: 'Q9.2', pi: 8, qi: 1, name: 'Budget validation',
      why: 'An unvalidated budget reprices the project after money is committed.',
      action: "Have a third party validate the budget's structure and assumptions. An estimator or lender's reviewer, not the person who built it." }
  ];
  var GATE_RANK = {};
  GATES.forEach(function (g, i) { GATE_RANK[g.id] = i; });

  /* ---------- Seam finding library ----------
     conds: individual trigger conjuncts, used for the locked-adjacent
     honesty rule. trigger = every cond true.
     actionPoint / action: the priority-action stub for this seam. */
  var LIB = [
    { id: 'L1', lens: 'Lender', title: 'Committed Money, Unvalidated Numbers', severity: 5,
      points: [2, 8], gateQs: ['Q9.2'], actionPoint: 8,
      action: "Have a third party validate the budget's structure and assumptions before more capital commits.",
      body: 'Your capital plan is ahead of your cost plan. Money is moving toward a budget nobody outside the project has validated. A lender reads this as a number that will move after closing, and prices that risk into your terms. Validate the number before the number revalues you.',
      conds: [function (c) { return c.y[2] >= 3; }, function (c) { return !c.q(8, 1); }] },

    { id: 'L2', lens: 'Lender', title: 'Demand by Assertion', severity: 5,
      points: [0, 2], gateQs: ['Q1.1'], actionPoint: 0,
      action: 'Assemble the demand evidence on one page: visitation data, comps, bookings. Evidence closes loans.',
      body: 'The capital conversation is underway and the demand case is still an assertion. Every underwriter asks the same first question: who is the guest, and are they already coming to the area. Comps, visitation data, bookings. Evidence closes loans. Belief does not.',
      conds: [function (c) { return !c.q(0, 0); }, function (c) { return c.y[2] >= 2; }] },

    { id: 'L3', lens: 'Lender', title: 'Confidence Without Contingency', severity: 3,
      points: [4, 8], gateQs: [], actionPoint: 8,
      action: 'Name the contingency and the three biggest risks it covers, inside the budget document.',
      body: 'The schedule reads confident and the budget carries no contingency behind it. A firm timeline over an unbuffered budget is how projects arrive on time and over budget. Name the contingency and the three biggest risks it covers.',
      conds: [function (c) { return c.y[4] >= 3; }, function (c) { return !c.q(8, 3); }] },

    { id: 'PO1', lens: 'Permit official', title: 'Drawings Ahead of Approvals', severity: 4,
      points: [6, 5], gateQs: ['Q6.1'], actionPoint: 5,
      action: 'Schedule a pre-application meeting with the jurisdiction before further design spend.',
      body: 'The design work is ahead of the approval path. Until zoning and use are confirmed, every drawing is a draft. Setbacks, density, septic sizing, access spacing: any one of these can send the design back. Confirm the use before you refine the plan.',
      conds: [function (c) { return c.y[6] >= 3; }, function (c) { return !c.q(5, 0); }] },

    { id: 'PO2', lens: 'Permit official', title: 'Land Without Use Rights', severity: 5,
      points: [2, 5], gateQs: ['Q3.2', 'Q6.1'], actionPoint: 5,
      action: 'Schedule the pre-application meeting: leave with the use determination in writing.',
      body: 'You control the land. You have not confirmed the right to use it this way. That gap is the most common place outdoor hospitality projects stall, and it is invisible until the day it is not. One pre-application meeting with the jurisdiction turns this from an assumption into a fact.',
      conds: [function (c) { return c.q(2, 1) === true; }, function (c) { return !c.q(5, 0); }] },

    { id: 'PO3', lens: 'Permit official', title: 'A Schedule That Does Not Own the Approval Clock', severity: 4,
      points: [4, 5], gateQs: [], actionPoint: 5,
      action: "Rebuild the approval timeline from the jurisdiction's actual review process, then re-baseline the schedule.",
      body: "Your schedule has dates the jurisdiction has not agreed to. Review cycles, hearing calendars, and resubmittals run on the county's clock, not yours. Build the approval timeline from the jurisdiction's actual process, then let the rest of the schedule follow it.",
      conds: [function (c) { return c.y[4] >= 3; }, function (c) { return c.y[5] <= 1; }] },

    { id: 'C1', lens: 'Contractor', title: 'A Schedule Built on Unordered Scope', severity: 4,
      points: [4, 7], gateQs: [], actionPoint: 7,
      action: 'Lock long-lead items with deposits: units, utility gear, septic components. Reserve the slot.',
      body: 'You know which items carry long lead times, and none of them are locked with deposits. Knowing the lead time does not reserve the slot. Units, utility gear, and septic components book out in months; a schedule that has not secured them is a wish with dates on it.',
      conds: [function (c) { return c.q(4, 3) === true; }, function (c) { return !c.q(7, 0); }] },

    { id: 'C2', lens: 'Contractor', title: 'Finished Drawings, Never Priced', severity: 4,
      points: [6, 8], gateQs: [], actionPoint: 8,
      action: 'Price the current drawings with a builder while the design is still cheap to change.',
      body: 'The drawings are ahead of the pricing. Until a builder prices this specific scope on this specific site, the budget is a placeholder. Price the design while it is still cheap to change.',
      conds: [function (c) { return c.y[6] >= 3; }, function (c) { return c.y[8] <= 1; }] },

    { id: 'C3', lens: 'Contractor', title: 'No Standard for Done', severity: 2,
      points: [9], gateQs: [], actionPoint: 9,
      action: 'Set the acceptance standard: daily site walks, a tracked punch list, a named closer.',
      body: 'You are near the build stage without an acceptance standard. Without daily eyes on the work and a tracked punch process, quality becomes a negotiation at the worst possible moment: after the work is in place. Set the standard before the first crew arrives.',
      conds: [function (c) { return c.verdictStage === 2; }, function (c) { return c.y[9] <= 1; }] },

    { id: 'D1', lens: 'Design professional', title: 'Designing for Nobody in Particular', severity: 3,
      points: [6, 0], gateQs: [], actionPoint: 0,
      action: 'Write the one-page guest profile and let it settle the open design questions.',
      body: 'The design is progressing and the guest is still generic. Unit mix, price point, amenity program, and site layout are all guest decisions wearing design clothing. Settle who the guest is, and half the open design questions answer themselves.',
      conds: [function (c) { return c.y[6] >= 2; }, function (c) { return c.y[0] <= 1; }] },

    { id: 'D2', lens: 'Design professional', title: 'Units Before the Plan That Places Them', severity: 4,
      points: [7, 6], gateQs: [], actionPoint: 6,
      action: 'Pause purchasing until the concept plan places the units. Let the plan set grading and spacing.',
      body: 'Purchasing is ahead of the plan. Units and materials locked before the design is settled become constraints, not assets: they dictate grading, utilities, and spacing instead of responding to them. Let the plan place the units, not the other way around.',
      conds: [function (c) { return c.q(7, 0) === true; }, function (c) { return c.y[6] <= 1; }] },

    { id: 'CE1', lens: 'Civil engineer', title: 'Everything Downstream Floats', severity: 5,
      points: [1], gateQs: ['Q2.3'], actionPoint: 1,
      action: "Get a civil engineer's utility feasibility letter for water, sanitary, power, and stormwater.",
      body: 'Progress is accumulating on top of an unresolved site. Water, sanitary, power, and stormwater are the foundation every other answer sits on. Until the utility plan exists, the design, the budget, and the schedule are all provisional whether they know it or not.',
      conds: [function (c) { return !c.q(1, 2); },
              function (c) { for (var i = 0; i < 10; i++) { if (i !== 1 && c.y[i] >= 3) return true; } return false; }] },

    { id: 'CE2', lens: 'Civil engineer', title: 'Cost Confidence Without Ground Truth', severity: 4,
      points: [8, 1], gateQs: ['Q2.3'], actionPoint: 1,
      action: 'Commission the site investigation: wetlands, soils, access, utilities. Let the ground price the budget.',
      body: 'The budget reads confident and the ground has not spoken yet. Sitework is where outdoor hospitality budgets break: wetlands, soils, access, utilities, stormwater. Cost certainty that predates site understanding is precision without accuracy.',
      conds: [function (c) { return c.y[8] >= 2; }, function (c) { return !c.q(1, 1) || !c.q(1, 2); }] },

    { id: 'H1', lens: 'Hospitality operator', title: 'A Property Without an Operating Model', severity: 3,
      points: [3], gateQs: [], actionPoint: 3,
      action: 'Draft the day-one operating model: operator, staffing, revenue centers, back of house.',
      body: 'The project is nearly ready to build and the operation is still unwritten. Who runs it day one, how the space supports the staffing model, which revenue centers carry the P&L: these decide whether the asset performs after opening day. The building is the easy half.',
      conds: [function (c) { return c.verdictStage === 2; }, function (c) { return c.y[3] <= 1; }] },

    { id: 'H2', lens: 'Hospitality operator', title: 'A Known Guest You Cannot Yet Serve', severity: 2,
      points: [0, 3], gateQs: [], actionPoint: 3,
      action: 'Convert the guest research into staffing, service standards, and back-of-house space requirements.',
      body: 'You know your guest well and the operating plan cannot deliver on that knowledge yet. The expectations you have already documented, converted into staffing, service standards, and back-of-house space, are the fastest operations plan you will ever write. The research is done. Convert it.',
      conds: [function (c) { return c.y[0] >= 3; }, function (c) { return c.y[3] <= 1; }] },

    { id: 'H3', lens: 'Hospitality operator', title: 'Underwriting Without an Operating P&L', severity: 3,
      points: [2, 3], gateQs: [], actionPoint: 3,
      action: 'Build the operating P&L your capital plan rests on: revenue centers, margins, operating costs.',
      body: 'The capital plan is ahead of the operating model. If you do not yet know which revenue centers carry the P&L, the revenue assumptions under your capital plan are unanchored. Operating costs in this asset class surprise people. Build the P&L your numbers claim to rest on.',
      conds: [function (c) { return c.y[2] >= 2; }, function (c) { return !c.q(3, 2); }] }
  ];

  /* Authored actions for points answered 0 or 1 yes. */
  var LOW_POINT_ACTIONS = [
    'Write the one-page guest profile: who they are, where they come from, what they book. Every later decision cites it.',
    'Commission a survey and site constraints map: boundary, wetlands, soils, access. The ground rules everything above it.',
    'Document the capital stack: sources, amounts, status, terms. Name what is committed and what is assumed.',
    'Draft the day-one operating model: who runs it, staffing, revenue centers. The building serves this document.',
    'Build a milestone schedule tied to funding, approvals, and lead times. Dates without dependencies are placeholders.',
    'Schedule a pre-application meeting with the jurisdiction. Leave with the use determination and approval path in writing.',
    'Engage the design professionals your approvals require and set the concept plan. Drawings anchor pricing and permits.',
    'List every long-lead item with lead time and order deadline. The schedule depends on this list.',
    'Build the full budget: hard and soft costs, regulatory fees, contingency. One document, projected against actual.',
    'Name the daily on-site owner and the punch process before the first crew arrives.'
  ];

  /* Protect-mode content for strong projects. */
  var PROTECT_FINDINGS = [
    { lens: '', title: 'Lock the Pricing Window', protect: true, points: [8],
      body: 'The plan is priced today, not forever. Lock the pricing window while the scope is stable, and the number you raised against stays the number you build against.' },
    { lens: '', title: 'Set the Acceptance Standard Now', protect: true, points: [9],
      body: 'Strong projects lose quality in the last mile, not the first. Set the acceptance standard now: daily walks, a tracked punch list, a named closer.' },
    { lens: '', title: 'Write the Opening Playbook', protect: true, points: [3],
      body: 'The build is on track, and opening day is its own project. Write the opening playbook before the walls are up, while operations can still shape the space.' }
  ];
  var PROTECT_ACTIONS = [
    { point: 8, text: 'Price the current scope with a builder and lock the window: costs move faster than drawings.' },
    { point: 9, text: 'Set the acceptance standard: daily site walks, a tracked punch list, a named owner who closes items.' },
    { point: 3, text: 'Write the opening playbook: staffing, service standards, and the first ninety days of operations.' }
  ];

  var DISCLAIMER = 'The Field Guide is a readiness diagnostic. It is not a certification, appraisal, loan approval, legal determination, or guarantee.';

  /* ---------- evaluation ---------- */

  function evaluate(answers) {
    var q = function (pi, qi) { return answers[pi + '-' + qi]; };
    var y = [], score = 0, answered = 0, i, j;
    for (i = 0; i < 10; i++) {
      var c = 0;
      for (j = 0; j < 4; j++) {
        if (q(i, j) !== undefined) answered++;
        if (q(i, j) === true) c++;
      }
      y.push(c);
      score += c * PTS[i];
    }

    var openGates = GATES.filter(function (g) { return q(g.pi, g.qi) !== true; });
    var og = openGates.length;
    var band = score <= 39 ? 0 : score <= 69 ? 1 : 2;

    /* Stage verdict matrix. */
    var stage, gated = false, framing = '';
    if (og === 0) { stage = band; }
    else if (og <= 2) {
      stage = band; gated = true;
      framing = 'Your open gates: ' + openGates.map(function (g) { return g.name; }).join(', ') +
        '. Everything below is subject to these.';
    } else if (og === 3) {
      stage = Math.max(0, band - 1);
      framing = 'The score says ' + STAGE_NAMES[band] + '. The open gates say otherwise.';
    } else {
      stage = 0;
      framing = 'Too many fundamentals are unverified for the score to mean what it says. Answer the fundamentals first.';
    }
    var verdictLabel = STAGE_NAMES[stage] + (gated ? ', gated' : '');

    /* Clusters. */
    function clusterScore(k) {
      var s = 0; CLUSTERS[k].pts.forEach(function (pi) { s += y[pi] * PTS[pi]; }); return s;
    }
    var cl = {};
    Object.keys(CLUSTERS).forEach(function (k) {
      var s = clusterScore(k), p = CLUSTERS[k].possible;
      cl[k] = { score: s, possible: p, hi: s >= 0.75 * p, lo: s <= 0.40 * p };
    });

    /* Seam evaluation. */
    var ctx = { y: y, q: function (pi, qi) { return q(pi, qi) === true; }, verdictStage: stage };
    var fired = LIB.filter(function (f) {
      return f.conds.every(function (fn) { return fn(ctx); });
    });
    function gateRankOf(f) {
      var r = 99; f.gateQs.forEach(function (id) { if (GATE_RANK[id] < r) r = GATE_RANK[id]; }); return r;
    }
    fired.sort(function (a, b) {
      if (b.severity !== a.severity) return b.severity - a.severity;
      var ga = gateRankOf(a), gb = gateRankOf(b);
      if (ga !== gb) return ga - gb;
      return Math.min.apply(null, a.points) - Math.min.apply(null, b.points);
    });
    /* One finding per unique point-pair; keep the higher severity (first after sort). */
    var seenPair = {}, deduped = [];
    fired.forEach(function (f) {
      var key = f.points.slice().sort().join('-');
      if (!seenPair[key]) { seenPair[key] = true; deduped.push(f); }
    });

    /* Displayed findings. */
    function gateFinding(g) {
      return { lens: '', gate: true, gateId: g.id, points: [g.pi], title: g.name + ' is open.',
        body: g.why + ' This gate can stop, redesign, or reprice the project. It reads first.' };
    }
    var displayed = [];
    var strongGated = score >= 70 && og >= 1 && og <= 2;
    if (score === 100) {
      displayed = PROTECT_FINDINGS.slice();
    } else {
      if (strongGated) openGates.forEach(function (g) { displayed.push(gateFinding(g)); });
      deduped.forEach(function (f) { if (displayed.length < 5) displayed.push(f); });
      if (displayed.length < 3) {
        openGates.forEach(function (g) {
          if (displayed.length >= 3) return;
          var already = displayed.some(function (f) { return f.gate && f.gateId === g.id; });
          if (!already) displayed.push(gateFinding(g));
        });
      }
      for (i = 0; displayed.length < 3 && i < PROTECT_FINDINGS.length; i++) {
        displayed.push(PROTECT_FINDINGS[i]);
      }
    }

    /* Locked list: fired-but-not-displayed, plus adjacent patterns with at
       least one trigger condition true. Honesty rule enforced here; the
       perfect score renders no locked list. */
    var lockedRows = [];
    if (score < 100) {
      var displayedIds = {};
      displayed.forEach(function (f) { if (f.id) displayedIds[f.id] = true; });
      LIB.forEach(function (f) {
        if (displayedIds[f.id]) return;
        var anyCond = f.conds.some(function (fn) { return fn(ctx); });
        if (!anyCond) return;
        lockedRows.push({
          id: f.id, lens: f.lens,
          pointsLabel: f.points.map(function (pi) { return SHORT[pi]; }).join(' × ')
        });
      });
    }

    /* Headline cascade. First match wins; score 0 overrides per edge table. */
    var headline;
    if (score === 0) headline = 'Start at the Beginning';
    else if (score >= 90 && og === 0) headline = 'Protect the Plan';
    else if (score >= 70 && og >= 1 && og <= 2) headline = 'Strong Plan. Open Gates.';
    else if (score >= 55 && og >= 4) headline = 'The Paper Is Ahead of the Ground';
    else if (cl.vision.hi && cl.delivery.hi && cl.deal.lo) headline = 'The Paper Is Ahead of the Ground';
    else if (cl.deal.hi && cl.vision.lo) headline = 'The Deal Is Ahead of the Guest';
    else if (cl.vision.hi && cl.deal.hi && cl.delivery.lo) headline = 'The Plan Stops at the Property Line';
    else if (cl.vision.hi && cl.deal.lo && cl.delivery.lo) headline = 'The Idea Is Ahead of the Project';
    else if (og >= 3) headline = 'The Fundamentals Come First';
    else if (score < 15) headline = 'Start at the Beginning';
    else if (fired.length) headline = fired[0].title;
    else headline = FALLBACK_HEADLINES[stage];

    /* Ledger rows. Open gate caps its point's label at In Progress. */
    var gatePoints = {};
    openGates.forEach(function (g) { gatePoints[g.pi] = true; });
    var ledger = [];
    for (i = 0; i < 10; i++) {
      var label = y[i] === 4 ? 'Resolved' : y[i] === 3 ? 'Nearly Resolved' : y[i] === 2 ? 'In Progress' : 'Open';
      if (gatePoints[i] && (label === 'Resolved' || label === 'Nearly Resolved')) label = 'In Progress';
      ledger.push({ pi: i, title: TITLES[i], score: y[i] * PTS[i], max: MAX[i], label: label, gateOpen: !!gatePoints[i] });
    }

    /* Three priority actions. */
    var actions = [], usedPoints = {};
    function takeAction(point, text) {
      if (actions.length >= 3 || usedPoints[point]) return;
      usedPoints[point] = true;
      actions.push(text);
    }
    if (score === 100) {
      PROTECT_ACTIONS.forEach(function (a) { takeAction(a.point, a.text); });
    } else {
      openGates.forEach(function (g) { takeAction(g.pi, g.action); });
      displayed.forEach(function (f) {
        if (f.id && f.action !== undefined) takeAction(f.actionPoint, f.action);
      });
      var lows = [];
      for (i = 0; i < 10; i++) if (y[i] <= 1) lows.push(i);
      lows.sort(function (a, b) { return y[a] !== y[b] ? y[a] - y[b] : a - b; });
      lows.forEach(function (pi) { takeAction(pi, LOW_POINT_ACTIONS[pi]); });
      PROTECT_ACTIONS.forEach(function (a) { takeAction(a.point, a.text); });
      /* Invariant backstop: exactly three, even if every point is used. */
      for (i = 0; actions.length < 3 && i < PROTECT_ACTIONS.length; i++) {
        if (actions.indexOf(PROTECT_ACTIONS[i].text) === -1) actions.push(PROTECT_ACTIONS[i].text);
      }
    }
    actions = actions.slice(0, 3);

    return {
      score: score, answeredCount: answered, yes: y,
      band: band, bandName: STAGE_NAMES[band],
      openGates: openGates.map(function (g) { return { id: g.id, name: g.name }; }),
      verdict: {
        stage: stage, label: verdictLabel, gated: gated, framing: framing,
        title: STAGE_TITLES[stage], body: STAGE_BODIES[stage], service: STAGE_SERVICES[stage]
      },
      clusters: cl,
      headline: headline,
      subhead: score + '/100. Current stage: ' + verdictLabel + '.',
      ledger: ledger,
      findings: displayed.map(function (f) {
        return { id: f.id || null, lens: f.lens || '', title: f.title, body: f.body,
          kind: f.gate ? 'gate' : f.protect ? 'protect' : 'seam' };
      }),
      lockedRows: lockedRows,
      lockedCount: lockedRows.length,
      actions: actions,
      disclaimer: DISCLAIMER,
      payload: (function () {
        /* Pre-rendered strings for the Mailchimp scorecard email. Each fits a
           255-char Text merge field. */
        var p = {
          VERDICT: verdictLabel,
          HEADLINE: headline,
          GATES: openGates.length ? openGates.map(function (g) { return g.name; }).join(', ') : 'none',
          FINDINGS: displayed.filter(function (f) { return f.id; }).map(function (f) { return f.id; }).join(',') +
            (lockedRows.length ? ' +' + lockedRows.length + ' locked' : '')
        };
        for (var fi = 0; fi < 3; fi++) {
          var f = displayed[fi];
          var line = f ? ((f.lens ? f.lens + ' · ' : '') + f.title) : '';
          if (fi === 2 && lockedRows.length) {
            line += ' (+' + lockedRows.length + ' more finding' + (lockedRows.length === 1 ? '' : 's') + ' identified)';
          }
          p['F' + (fi + 1)] = line;
        }
        for (var ai = 0; ai < 3; ai++) p['A' + (ai + 1)] = actions[ai] || '';
        return p;
      })()
    };
  }

  return { evaluate: evaluate, GATES: GATES, LIB: LIB, TITLES: TITLES, PTS: PTS, MAX: MAX };
})();
