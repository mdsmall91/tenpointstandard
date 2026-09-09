'use strict';

/* CONFIG now lives in config.js, which index.html loads before this
   file. It is shared with the Field Journal so the Mailchimp and GA
   values exist in exactly one place. */

/* =============================================================
   DATA — canonical, copy verbatim from the design handoff.
   ============================================================= */
/* Order, titles, and question sequence per Field Guide v2 (July 2026). */
var POINTS = [
  { n: '01', title: 'Property Details', pts: 3, max: 12, docs: 'Survey & Basemap · Site Constraints Documented · Infrastructure Master Plan · Site Analysis Plan',
    qs: ['Do you have a legal boundary and a plan of current site conditions?',
         'Do you know the challenges: wetlands, easements, soils, access?',
         'Is there a plan for water, sanitary, power, and stormwater?',
         'Do you know what makes the site special, and how weather, seasons, and access shape it?'] },
  { n: '02', title: 'Capital Strategy', pts: 4, max: 16, docs: 'Funding Strategy · Land Strategy · Cash Flow Model · Financial Partner Review',
    qs: ['Do you know whether you need outside investment, and do you have the required equity?',
         'Do you control the land, and do you know what is time-critical about your position?',
         'Have you modeled cash flow for every phase, and stress-tested the variables?',
         'Have lending partners or outside financial representatives reviewed the plan?'] },
  { n: '03', title: 'Regulatory Approvals', pts: 3, max: 12, docs: 'Zoning Review · Entitlement Strategy · Development Approval Matrix · Permit Checklist',
    qs: ['Do you know the zoning, and do you have use-by-right?',
         'If the use is non-conforming, do you know what compliance requires, and how long?',
         'Do you know what approvals govern site development and construction on the property?',
         'Do you know which permits you anticipate, and the process to obtain them?'] },
  { n: '04', title: 'Guest Experience', pts: 3, max: 12, docs: 'Target Market Analysis · Competition Analysis · Experience Framework Plan · Guest Experience Framework Plan',
    qs: ['Do you know your target guest, and do they already come to the area?',
         'Do you know why they will choose you over options they already have?',
         'Do you know which experiences are must-haves for your guests?',
         'Do you know how your planned amenities map to the guest experience?'] },
  { n: '05', title: 'Design', pts: 2, max: 8, docs: 'Subconsultant Alignment · Brand Strategy · Construction Documents & Specifications · Safety, Code Compliance & Constructability Review',
    qs: ['Do you know which design professionals you need for regulatory compliance?',
         'Does the design champion the brand and the guest experience?',
         'Are the drawings detailed enough to build from, and to hold construction to?',
         'Is the design constructable, safe, cost-effective, and code-compliant?'] },
  { n: '06', title: 'Procurement', pts: 2, max: 8, docs: 'Long-lead Procurement Plan · Vendor Prequalification · Site Logistics Matrix · Responsibility Matrix',
    qs: ['Is every long-lead item identified, and locked in with deposits?',
         'Are vendors vetted for capacity, financial stability, and track record on resorts like yours?',
         'Do you know where materials are staged, and how delivery is sequenced against installation?',
         'Do you know what you buy direct versus through the contractor, with handoffs documented?'] },
  { n: '07', title: 'Schedule', pts: 2, max: 8, docs: 'CMP Baseline Schedule · Schedule Risk Analysis · Integrated Procurement Schedule · Float Analysis & Schedule Compression',
    qs: ['Do you have milestones, and are they tied to funding or closing?',
         'Do you know what else sits on the critical path: approvals, construction, commissioning?',
         'Do you know which materials, supplies, and units carry long lead times?',
         'Does the build duration reconcile with lead times, weather windows, and opening day?'] },
  { n: '08', title: 'Cost Certainty', pts: 2, max: 8, docs: 'Budget Analysis · Independent Cost Validation · Contingency & Risk Allocation · Cost Reporting & Variance Tracking',
    qs: ['Is the budget a detailed breakdown of hard and soft costs, including regulatory fees?',
         'Has a third party validated how the budget was built and its assumptions?',
         'Are you carrying a contingency, and do you know your biggest risks in the model?',
         'Is the budget updated regularly, tracking projected against actual?'] },
  { n: '09', title: 'Quality Assurance', pts: 1, max: 4, docs: 'Dedicated Project Management · Site Walk & Verification · Quality Assurance Standard-of-Care · Quality Guarantee',
    qs: ['Is someone on site every day, walking the work and holding the contract?',
         'Are punch items tracked, with a named owner who closes them?',
         'Is the quality standard written down, and is it owner-written rather than contractor-written?',
         'Do you have written assurance from the contractor and their subcontractors that problems will be made right?'] },
  { n: '10', title: 'Opening Readiness', pts: 3, max: 12, docs: 'Management Structure · Staffing & Service Model · Revenue Center P&L · Lifecycle Maintenance Plan',
    qs: ['Do you know who runs the resort day one: your team, a third party, or a flag not yet signed?',
         'Does the space plan support the staffing model, back of house included?',
         'Do you know which revenue centers carry the P&L, and is the design costed to their margin?',
         'Do you know what year-three maintenance looks like, and who signs off on that cost?'] }
];

/* =============================================================
   FIELD NOTES — one line per point, from real project experience.
   These are what make the assessment feel like a person rather than
   a form, so they are written the way somebody would say them on a
   site walk, not the way a form would ask.

   DRAFT. Kenny has not passed on these yet. They are here so he
   edits rather than writes from a blank page.
   ============================================================= */
var FIELD_NOTES = [
  'The survey tells you where the lines are. The site walk tells you what the lines are hiding.',
  'Money that is close is not money that is committed. A lender can tell the difference on the first read.',
  'Most projects we see do not lose time at the permit counter. They lose it waiting on a study nobody scheduled.',
  'Every design argument we have ever sat through was really an argument about who the guest is.',
  'A drawing set is not done when it looks finished. It is done when a builder can price it without calling you.',
  'Knowing the lead time does not reserve the slot. A deposit reserves the slot.',
  'A schedule built backward from opening day is a wish. Build it forward from the approvals.',
  'The budget nobody outside the project has checked is the budget that moves after the money commits.',
  'Quality is decided by whoever walks the site on a Tuesday, not by what the contract says.',
  'The building is the easy half. The first ninety days of operating it is the half that gets skipped.'
];

/* Full-width opener photographs, one per point. Every one is a real
   Ten Point project; tools/build-images.py holds the provenance and
   is the only place the crops are made. */
var POINT_IMG = ['01-property', '02-capital', '03-regulatory', '04-guests', '05-design',
  '06-procurement', '07-schedule', '08-cost', '09-qa', '10-opening'];
var POINT_IMG_W = [1400, 1400, 1400, 1400, 1365, 1400, 1400, 1207, 1210, 1365];
var POINT_IMG_CAP = ['Outdoorsy Hill Country, Texas', 'Outdoorsy Hill Country, Texas',
  'KOA Fredericksburg, Texas', 'Lagom Retreat, Dripping Springs, Texas',
  'Lagom Retreat, Dripping Springs, Texas', 'Lagom Retreat under construction',
  'Lagom Retreat under construction', 'Lagom Retreat under construction',
  'Lagom Retreat under construction', 'Lagom Retreat, Dripping Springs, Texas'];

var BANDS = [
  { range: '0 – 39', title: 'Answer the fundamentals.', service: 'Ten Point Align',
    body: 'Market, land, and money come first. Settle who the guest is, what the site can support, and how the project is funded, before spending on design or permits.' },
  { range: '40 – 69', title: 'Close the gaps on paper.', service: 'Ten Point Design',
    body: 'The idea holds. The remaining risk lives in entitlements, drawings, procurement, and pricing, which is cheaper to resolve on paper than in the field.' },
  { range: '70 – 100', title: 'Protect the plan.', service: 'Ten Point Build',
    body: 'The seams are closed. The work from here is holding schedule, budget, and quality through construction, commissioning, and the first guest stay.' }
];

/* v2: point order changed July 2026; old saved answers would map to the
   wrong questions, so the key bump deliberately discards them. */
var STORE_KEY = 'tp-fieldguide-v2';

/* =============================================================
   STATE
   ============================================================= */
var state = { answers: {}, revealed: false, sentTo: '', email: '', emailError: false, step: 0,
  phone: '', fullReq: false, ctaMode: '', ctaError: false,
  /* Carried in from The Read. `carried` is the list of questions lane
     one answered, kept so the confirmation screen can show them back
     with an edit link and so `questions_skipped_by_carry` is a real
     number rather than an estimate. `readCtx` is the lane one context
     used to describe the project back to the person. */
  carried: [], readCtx: null, carryConfirmed: false,
  /* Set only if the model layer answered in time. The template read is
     what renders until then, and what keeps rendering if it does not. */
  modelLines: null, modelAsked: false };

function load() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      var d = JSON.parse(raw);
      state.answers = d.a || {};
      state.revealed = !!d.r;
      state.sentTo = d.e || '';
      state.step = d.s || 0;
      state.fullReq = !!d.f;
      state.carryConfirmed = !!d.cc;
    }
  } catch (e) {}
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ a: state.answers, r: state.revealed, e: state.sentTo, s: state.step, f: state.fullReq, cc: state.carryConfirmed }));
  } catch (e) {}
}

/* -------------------------------------------------------------
   CARRY FORWARD FROM THE READ
   Anything lane one already established is filled in and marked
   answered, and the count is said out loud on the first screen,
   because skipping a quarter of the questions is a real reward for
   having done the first lane.

   Nothing is assumed silently. Every carried answer is listed back
   with an edit link, and readmodel.js only carries equivalences that
   hold on their own: a tap on a photograph is not the same claim as
   a yes to a written question.
   ------------------------------------------------------------- */
function loadCarry() {
  if (typeof TPReadModel === 'undefined') return;
  var raw;
  try { raw = localStorage.getItem('tp-read-v1'); } catch (e) { return; }
  if (!raw) return;
  var r;
  try { r = JSON.parse(raw); } catch (e) { return; }
  if (!r || !r.done) return;

  state.readCtx = r;
  var rows = TPReadModel.carry(r);
  var fresh = [];
  for (var i = 0; i < rows.length; i++) {
    // A person who already answered a question here outranks the
    // carry: their own later answer is the better evidence.
    if (state.answers[rows[i].key] === undefined) {
      state.answers[rows[i].key] = rows[i].value;
      fresh.push(rows[i]);
    }
  }
  state.carried = fresh;
}

/* =============================================================
   DERIVED
   ============================================================= */
function pointScore(pi) {
  var p = POINTS[pi], score = 0;
  for (var qi = 0; qi < p.qs.length; qi++) {
    if (state.answers[pi + '-' + qi] === true) score += p.pts;
  }
  return score;
}
function totalScore() {
  var t = 0;
  for (var i = 0; i < POINTS.length; i++) t += pointScore(i);
  return t;
}
/* "Not sure" is deliberately NOT answered. It scores as no, and it
   is counted on its own, because "I answered it" and "I do not know"
   are different facts about the same project. */
function answeredCount() {
  var n = 0;
  for (var k in state.answers) if (state.answers[k] === true || state.answers[k] === false) n++;
  return n;
}
function notSureCount() {
  var n = 0;
  for (var k in state.answers) if (state.answers[k] === 'unsure') n++;
  return n;
}
function bandIdx(total) { return total <= 39 ? 0 : total <= 69 ? 1 : 2; }
function pointDone(pi) {
  for (var qi = 0; qi < POINTS[pi].qs.length; qi++) {
    if (state.answers[pi + '-' + qi] === undefined) return false;
  }
  return true;
}
function pointYes(pi) {
  var n = 0;
  for (var qi = 0; qi < POINTS[pi].qs.length; qi++) {
    if (state.answers[pi + '-' + qi] === true) n++;
  }
  return n;
}

/* The ring, in both lanes' shared shape. Points that are finished
   are scored; points not started yet stay grey and say so, which is
   the same grammar The Read uses. */
function ringSegments() {
  var R = TPResults.evaluate(state.answers);
  var segs = [];
  for (var i = 0; i < 10; i++) {
    var started = false;
    for (var q = 0; q < 4; q++) if (state.answers[i + '-' + q] !== undefined) started = true;
    segs.push({
      n: POINTS[i].n,
      label: POINTS[i].title,
      state: started ? 'scored' : 'unscored',
      fill: pointYes(i) / 4,
      score: pointScore(i),
      max: POINTS[i].max,
      gateOpen: R.ledger[i].gateOpen
    });
  }
  return segs;
}

/* =============================================================
   ANALYTICS (GA4, optional)
   ============================================================= */
/* One GA wiring for the whole site now lives in analytics.js, and
   milestones go through TPA.once() so a re-render, a back button, or
   a reload cannot re-send them. The live property shows nine
   fg_email_captured events from three users; that is the bug these
   two wrappers close. */
function initGA() { TPA.init(); }
function track(name, params) { TPA.track(name, params); }
function trackOnce(name, params, key) { return TPA.once(name, params, key); }

/* Slugs for the GA4 score_band param. Index matches R.verdict.stage, which is
   the stage the user is actually shown: gates can pull it below the raw band. */
var BAND_SLUGS = ['align', 'design', 'build'];

/* GA4 key event. Fires once, on the transition into the revealed scorecard,
   not on later re-renders or on reloads of a saved result. */
function trackComplete() {
  var R = TPResults.evaluate(state.answers);
  var params = {
    method: 'ten_point_standard',
    score_band: BAND_SLUGS[R.verdict.stage],
    score: R.score,
    gated: R.verdict.gated ? 'yes' : 'no'
  };
  trackOnce('assessment_complete', params);
  trackOnce('standard_complete', {
    score: R.score,
    band: BAND_SLUGS[R.verdict.stage],
    not_sure_count: R.notSureCount,
    questions_skipped_by_carry: state.carried.length
  });
}

/* =============================================================
   MAILCHIMP (JSONP subscribe, no server needed)
   ============================================================= */
function submitToMailchimp(email, extra) {
  if (!CONFIG.MAILCHIMP_FORM_ACTION) {
    console.warn('Mailchimp not configured: set CONFIG.MAILCHIMP_FORM_ACTION in app.js');
    return;
  }
  var total = totalScore();
  var params = [
    'EMAIL=' + encodeURIComponent(email),
    'SCORE=' + total,
    'BAND=' + encodeURIComponent(BANDS[bandIdx(total)].service),
    'ANSWERED=' + answeredCount()
  ];
  /* Per-point values carry the ledger read: "12 / 12 · Resolved",
     with the gate marker when that point's gate is open. */
  var ledger = TPResults.evaluate(state.answers).ledger;
  for (var i = 0; i < POINTS.length; i++) {
    var row = ledger[i];
    params.push('P' + POINTS[i].n + '=' + encodeURIComponent(
      row.score + ' / ' + row.max + ' · ' + row.label + (row.gateOpen ? ' · gate open' : '')));
  }
  /* The link to the forwardable scorecard. Everything the person saw
     is encoded in it, so the email does not have to carry forty
     answers and a written read through merge fields that truncate at
     255 characters.

     NOTE FOR MAILCHIMP: the audience is at the 30 merge-field cap and
     "Create a new field" there is a silent no-op, so SCORECARD needs
     an unused default RELABELLED to it (Audience > Contacts > "..." >
     merge fields; BIRTHDAY and ADDRESS are the remaining unused
     ones). Until that is done this value is accepted and silently
     dropped, exactly like FINDINGS, and the link still works on the
     result screen. Do not delete a field to make room: that destroys
     the column for every contact. */
  params.push('SCORECARD=' + encodeURIComponent(TPScoreCode.url(state.answers)));

  if (extra) {
    for (var k in extra) {
      if (extra[k]) params.push(k + '=' + encodeURIComponent(extra[k]));
    }
  }
  // Honeypot field name is b_<u>_<id>, derived from the form action URL.
  var u = /[?&]u=([^&]+)/.exec(CONFIG.MAILCHIMP_FORM_ACTION);
  var id = /[?&]id=([^&]+)/.exec(CONFIG.MAILCHIMP_FORM_ACTION);
  if (u && id) params.push('b_' + u[1] + '_' + id[1] + '=');

  var cbName = 'mcCallback' + Date.now();
  window[cbName] = function (resp) {
    delete window[cbName];
    if (resp && resp.result === 'error') console.warn('Mailchimp:', resp.msg);
  };
  params.push('c=' + cbName);

  // f_id pins the request to a stored form version; Mailchimp then accepts only
  // the fields defined on that form and silently drops the rest, so the contact
  // subscribes but SCORE/BAND/P01-P10 come through empty. Strip it.
  var parts = CONFIG.MAILCHIMP_FORM_ACTION.split('?');
  var query = (parts[1] || '').split('&').filter(function (kv) {
    return kv && kv.indexOf('f_id=') !== 0;
  });
  var script = document.createElement('script');
  script.src = parts[0].replace(/\/post$/, '/post-json') + '?' + query.concat(params).join('&');
  document.body.appendChild(script);
}

/* =============================================================
   RENDER
   ============================================================= */
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function goTop() { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }
function goStep(i) { state.step = i; save(); render(); goTop(); }

// Cover = 0, each point advances a tenth, ledger = complete.
function progressPct() {
  return state.step === 0 ? 0 : Math.min(100, Math.round((state.step / 10) * 100));
}

function renderRail() {
  var pct = progressPct();
  var html = '<div class="fg-rail-items" role="progressbar" aria-label="Assessment progress"' +
    ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '">' +
    '<div class="fg-rail-track"><div class="fg-rail-fill" style="height: ' + pct + '%;"></div></div>';
  for (var i = 0; i < POINTS.length; i++) {
    var cls = state.step === i + 1 ? 'cur' : pointDone(i) ? 'done' : '';
    html += '<button class="fg-rail-item ' + cls + '" data-go="' + (i + 1) + '"' +
      (state.step === i + 1 ? ' aria-current="step"' : '') + '>' +
      '<span class="fg-rail-dot"></span>' +
      '<span class="fg-rail-num">' + POINTS[i].n + '</span>' +
      '<span class="fg-rail-label">' + POINTS[i].title + '</span>' +
    '</button>';
  }
  html += '<button class="fg-rail-item ' + (state.step === 11 ? 'cur' : '') + '" data-go="11"' +
    (state.step === 11 ? ' aria-current="step"' : '') + '>' +
    '<span class="fg-rail-dot"></span>' +
    '<span class="fg-rail-num">—</span>' +
    '<span class="fg-rail-label">The ledger</span>' +
  '</button></div>';
  document.getElementById('rail').innerHTML = html;
}

function renderHeader() {
  document.getElementById('hdr-score').textContent = 'SCORE ' + totalScore() + ' / 100';

  var nav = document.getElementById('step-nav');
  var html = '';
  for (var i = 0; i < POINTS.length; i++) {
    var cls = state.step === i + 1 ? 'cur' : pointDone(i) ? 'done' : '';
    html += '<button class="fg-step-item ' + cls + '" data-go="' + (i + 1) + '"><span class="fg-step-dot"></span>' + POINTS[i].n + '</button>';
  }
  html += '<button class="fg-step-item ' + (state.step === 11 ? 'cur' : '') + '" data-go="11"><span class="fg-step-dot"></span>LEDGER</button>';
  nav.innerHTML = html;
}

/* The first screen for somebody who came from The Read is not a
   question. It is a confirmation of what lane one already captured,
   each row with a way to change it. Saying the skipped count out
   loud matters: it is the reward for having done the first lane. */
function renderCarryConfirm() {
  var n = state.carried.length;
  var left = 40 - n;
  var html = '<section class="fg-cover">' +
    '<div class="eyebrow dotted">The Full Standard</div>' +
    '<h1 style="margin-top: 16px;">Here is what we already know.</h1>' +
    '<p class="lede" style="margin-top: 20px; max-width: 54ch;">You answered these in The Read, so they are filled in already. That leaves ' +
      left + ' questions instead of forty.</p>' +
    '<ul class="fg-carry">';
  for (var i = 0; i < n; i++) {
    var c = state.carried[i];
    var pi = parseInt(c.key.split('-')[0], 10);
    html += '<li>' +
      '<span class="fg-carry-label">' + esc(c.label) + '</span>' +
      '<span class="fg-carry-q muted">' + esc(c.question) + '</span>' +
      '<button class="fg-link-btn" data-go="' + (pi + 1) + '">Change this</button>' +
    '</li>';
  }
  html += '</ul>' +
    '<div style="display: flex; gap: 16px; align-items: center; margin-top: 36px; flex-wrap: wrap;">' +
      '<button class="btn lg accent" data-action="confirm-carry">Looks right, keep going</button>' +
      '<span class="mono" style="font-size: 11px; color: var(--text-faint);">' + left + ' QUESTIONS LEFT</span>' +
    '</div>' +
  '</section>';
  return html;
}

function renderCover() {
  if (state.carried.length && !state.carryConfirmed) return renderCarryConfirm();
  return '' +
    '<section class="fg-cover">' +
      '<div class="eyebrow dotted">The Ten Point Standard</div>' +
      '<h1 class="display" style="margin-top: 16px; font-size: clamp(3rem, 7vw, var(--fs-display));">The Field Guide.</h1>' +
      '<p class="lede" style="margin-top: 24px; max-width: 52ch;">The Field Guide is a readiness diagnostic for owners planning outdoor hospitality resorts. Most projects fail at the seams. Not the design. Not the dream. The seams between site and capital, design and procurement, schedule and operations. Forty questions. One hundred points. See where you are strong, where the risk is concentrated, and what to do next.</p>' +
      '<div style="display: flex; gap: 16px; align-items: center; margin-top: 40px;">' +
        '<button class="btn lg" data-action="begin">Begin the assessment</button>' +
        '<span class="mono" style="font-size: 11px; color: var(--text-faint);">~5 MIN</span>' +
      '</div>' +
      /* A cold visitor should be offered the ninety second version
         first. Forty questions of homework before anything comes back
         is the reason the old front door leaked. */
      '<div class="fg-lane-one">' +
        '<h4>Short on time?</h4>' +
        '<p class="muted">The Read takes about ninety seconds. Ten questions, mostly pictures, and no email. It gives you a direction and names the one thing most likely to stop the project.</p>' +
        '<a class="btn ghost" href="/read/">Take The Read instead</a>' +
      '</div>' +
    '</section>';
}

/* One line of result the moment a point's fourth question lands.
   The old assessment paid out once, at the very end. This one pays
   out ten times, so a person who stops at point six still leaves
   with six points of value and a reason to come back. */
function payoutLine(pi) {
  var R = TPResults.evaluate(state.answers);
  var row = R.ledger[pi];
  var yes = pointYes(pi);
  var line;
  if (row.gateOpen) {
    line = 'One of the six critical gates sits in this point, and it is still open. That is normal at your stage, and it is worth handling before the work downstream of it.';
  } else if (yes === 4) {
    line = 'Nothing open here. This is the part of the project you can build on.';
  } else if (yes >= 2) {
    line = 'Most of this is settled. The rest is worth closing while it is still cheap to change.';
  } else {
    line = 'This one is mostly open. It is early work rather than late work, which is the good news.';
  }
  return '<div class="fg-payout">' +
      '<div class="fg-payout-ring">' + TPRing.svg({
        segments: ringSegments(), size: 150, band: 13,
        center: { main: String(totalScore()), sub: 'of 100' }
      }) + '</div>' +
      '<div class="fg-payout-body">' +
        '<h4>' + POINTS[pi].title + ': ' + yes + ' of 4.</h4>' +
        '<p class="muted">' + line + '</p>' +
      '</div>' +
    '</div>';
}

function renderPoint(step) {
  var pi = step - 1, p = POINTS[pi], score = pointScore(pi);
  var img = '/assets/points/' + POINT_IMG[pi] + '-' + POINT_IMG_W[pi] + '.webp';
  var html = '' +
    /* The opener runs full width of the column, with the point name
       over it. Every one is a real Ten Point project and the caption
       says which. */
    '<figure class="fg-opener">' +
      '<img src="' + img + '" alt="" loading="lazy" decoding="async" width="' + POINT_IMG_W[pi] + '" height="' + Math.round(POINT_IMG_W[pi] * 9 / 16) + '">' +
      /* The credit sits inside the caption rather than under the frame.
         Below the image it has to clear an absolutely positioned
         overlay to avoid colliding with the title, and that is a
         layout that breaks quietly the first time a photograph
         changes aspect. Inside, it cannot collide with anything. */
      '<figcaption>' +
        '<span class="fg-opener-n mono">POINT ' + p.n + ' / 10</span>' +
        '<span class="fg-opener-title">' + p.title + '</span>' +
        '<span class="fg-opener-credit mono">' + esc(POINT_IMG_CAP[pi]) + ' &middot; Ten Point Services</span>' +
      '</figcaption>' +
    '</figure>' +
    '<section class="fg-pstep">' +
      '<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px 16px; flex-wrap: wrap;">' +
        '<div class="eyebrow dotted">Point ' + p.n + ' / 10</div>' +
        '<div class="mono" style="font-size: 11px; color: var(--text-faint);">EACH YES = ' + p.pts + ' PTS · ' + score + ' / ' + p.max + '</div>' +
      '</div>' +
      '<h2 style="margin-top: 28px;">' + p.title + '.</h2>' +
      /* The field note. One line of plain language from a real
         project, and the thing that makes this read like a person. */
      '<p class="fg-note">' + esc(FIELD_NOTES[pi]) + '</p>' +
      '<div style="margin-top: 24px;">';
  for (var qi = 0; qi < p.qs.length; qi++) {
    var key = pi + '-' + qi, ans = state.answers[key];
    var carried = false;
    for (var c = 0; c < state.carried.length; c++) if (state.carried[c].key === key) carried = true;
    html += '' +
      '<div class="fg-q' + (carried ? ' is-carried' : '') + '">' +
        '<div style="display: flex; gap: 14px; align-items: baseline;"><span class="mono" style="font-size: 11px; color: var(--text-faint); flex: none;">Q' + (qi + 1) + '</span><span style="font-size: 16px; color: var(--text); max-width: 58ch;">' + p.qs[qi] +
          (carried ? '<span class="fg-carried-tag mono">FROM THE READ</span>' : '') + '</span></div>' +
        '<div class="fg-seg" style="display: flex; gap: 6px;">' +
          '<button class="fg-yn yes' + (ans === true ? ' on' : '') + '" data-key="' + key + '" data-val="1">Yes</button>' +
          '<button class="fg-yn no' + (ans === false ? ' on' : '') + '" data-key="' + key + '" data-val="0">No</button>' +
          '<button class="fg-yn unsure' + (ans === 'unsure' ? ' on' : '') + '" data-key="' + key + '" data-val="u">Not sure</button>' +
        '</div>' +
      '</div>';
  }
  html += '</div>';
  /* Pay out the moment the fourth answer lands, not at the end. */
  if (pointDone(pi)) html += payoutLine(pi);
  html += '</section>' +
    '<div style="display: flex; justify-content: space-between; padding: 24px 0 64px;">' +
      '<button class="btn ghost" data-action="prev">Back</button>' +
      '<button class="btn" data-action="next">' + (step === 10 ? 'See the ledger' : 'Next point') + '</button>' +
    '</div>';
  return html;
}

function renderLedger() {
  var total = totalScore();
  var R = state.revealed ? TPResults.evaluate(state.answers) : null;
  var html = '<section style="padding: 56px 0 64px;">';
  if (R) {
    if (state.sentTo) {
      html += '<p class="muted" style="font-size: 13px; margin-bottom: 24px;">A copy of your scorecard is on its way to <span class="mono">' + esc(state.sentTo) + '</span>.</p>';
    }
    /* The full ring is the hero of the whole product, and it is built
       to be screenshotted: all ten filled, the score in the middle,
       the legend underneath so it still reads in grayscale. */
    html += '<div class="fg-hero-ring">' +
        '<div>' + TPRing.svg({
          segments: ringSegments(), size: 300,
          center: { top: R.verdict.gated ? 'GATED' : '', main: String(R.score), sub: 'of 100 · ' + R.verdict.label }
        }) + '</div>' +
        '<div class="fg-hero-read">' +
          '<div class="eyebrow dotted">Your read</div>' +
          '<div class="fg-read-lines">' +
            (state.modelLines || TPStandardRead.compose(R, state.readCtx)).map(function (l) {
              return '<p>' + esc(l) + '</p>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>';
    html += renderVerdict(R);
  }
  html += '<div class="eyebrow dotted">The ledger</div>' +
    '<h2 style="margin-top: 12px;">Add up your score.</h2>' +
    '<p class="muted" style="margin-top: 12px;">Every answer is a have or have-not. Capital weighs heaviest. One hundred points possible.</p>' +
    '<div style="margin-top: 32px; max-width: 640px;">';
  for (var i = 0; i < POINTS.length; i++) {
    var right;
    if (R) {
      var row = R.ledger[i];
      right = '<span style="display: inline-flex; gap: 14px; align-items: baseline;">' +
        (row.gateOpen ? '<span class="fg-gate-tag">GATE OPEN</span>' : '') +
        '<span class="mono" style="font-size: 10px; letter-spacing: 0.08em; color: var(--text-faint); text-transform: uppercase;">' + row.label + '</span>' +
        '<span class="mono" style="font-size: 13px; color: var(--text-strong);">' + row.score + ' / ' + row.max + '</span></span>';
    } else {
      right = '<span class="mono" style="font-size: 13px; color: var(--text-strong);">' + pointScore(i) + ' / ' + POINTS[i].max + '</span>';
    }
    html += '<div style="display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0; border-top: 1px solid var(--border-soft);">' +
      '<div style="display: flex; gap: 14px; align-items: baseline;"><span class="mono" style="font-size: 12px; color: var(--text-faint);">' + POINTS[i].n + '</span><span style="font-size: 15px;">' + POINTS[i].title + '</span></div>' +
      right +
    '</div>';
  }
  html += '<div style="display: flex; justify-content: space-between; align-items: baseline; padding: 14px 0; border-top: 2px solid var(--ink-strong);">' +
      '<span style="font-weight: 600;">Total</span>' +
      '<span class="mono" style="font-size: 16px; color: var(--text-strong);">' + total + ' / 100</span>' +
    '</div></div>';

  if (!state.revealed) {
    html += '<div class="card" style="margin-top: 40px; max-width: 560px; padding: var(--s-8);">' +
      '<h4>Where do you land?</h4>' +
      '<p class="muted" style="font-size: 14px; margin-top: 8px;">Enter your email and we will send your scorecard: the read on where your risk is concentrated, and which questions to answer next.</p>' +
      '<div style="display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap;">' +
        '<input class="input" type="email" id="gate-email" placeholder="you@yourproject.com" value="' + esc(state.email) + '" style="flex: 1; min-width: 220px;">' +
        '<button class="btn accent" data-action="submit-email">Email my scorecard</button>' +
      '</div>' +
      (state.emailError ? '<div style="font-size: 12px; color: var(--bronze-deep); margin-top: 8px;">Enter a valid email address.</div>' : '') +
      '<button class="fg-link-btn" style="margin-top: 16px;" data-action="skip">Skip and show my results</button>' +
    '</div>';
  }
  html += '</section>';

  if (R) html += renderFindings(R) + renderActions(R) + renderCTA() + renderFooterNote(R);
  return html;
}

function renderVerdict(R) {
  var gatesLine = R.openGates.length
    ? 'OPEN GATES: ' + R.openGates.map(function (g) { return g.name.toUpperCase(); }).join(' · ')
    : 'NO OPEN CRITICAL GATES';
  return '<div class="fg-verdict">' +
    '<div class="eyebrow dotted">The verdict</div>' +
    '<h2 style="margin-top: 12px;">' + R.headline + (/\.$/.test(R.headline) ? '' : '.') + '</h2>' +
    '<p class="mono" style="font-size: 13px; color: var(--text-muted); margin-top: 10px;">' + R.subhead + '</p>' +
    (R.verdict.framing ? '<p style="font-size: 15px; font-weight: 500; margin-top: 16px; color: var(--text-strong);">' + R.verdict.framing + '</p>' : '') +
    '<p class="muted" style="font-size: 14px; margin-top: 12px;">' + R.verdict.body + '</p>' +
    '<div style="display: flex; gap: 14px; align-items: center; margin-top: 20px; flex-wrap: wrap;">' +
      '<span class="badge accent">' + R.verdict.service + '</span>' +
      '<span class="mono" style="font-size: 11px; color: var(--text-faint); letter-spacing: 0.06em;">' + gatesLine + '</span>' +
    '</div>' +
  '</div>';
}

function renderFindings(R) {
  var html = '<section style="padding: 0 0 24px;">' +
    '<h3>The findings.</h3><div style="margin-top: 8px; max-width: 640px;">';
  R.findings.forEach(function (f) {
    html += '<div class="fg-finding">' +
      (f.lens ? '<div class="mono" style="font-size: 10px; letter-spacing: 0.08em; color: var(--text-faint); text-transform: uppercase;">' + f.lens + '</div>' : '') +
      '<h4 style="margin-top: 6px;">' + f.title + '</h4>' +
      '<p class="muted" style="font-size: 14px; margin-top: 8px;">' + f.body + '</p>' +
    '</div>';
  });
  html += '</div>';
  if (R.lockedCount) {
    html += '<div style="margin-top: 28px; max-width: 640px;">' +
      '<p class="muted" style="font-size: 13px;">' + R.lockedCount + ' more finding' + (R.lockedCount === 1 ? '' : 's') + ' identified in your answers.</p>';
    R.lockedRows.forEach(function (r) {
      html += '<div class="fg-locked-row"><span style="font-size: 13px;">' + (r.lens ? r.lens + ' · ' : '') + r.pointsLabel + '</span><span class="mono" style="font-size: 10px; letter-spacing: 0.08em;">LOCKED</span></div>';
    });
    html += '</div>';
  }
  html += '</section>';
  return html;
}

function renderActions(R) {
  var html = '<section style="padding: 0 0 24px;"><h3>Three priority actions.</h3><ol class="fg-actions">';
  R.actions.forEach(function (a) { html += '<li>' + a + '</li>'; });
  html += '</ol></section>';
  return html;
}

function renderCTA() {
  var html = '';

  /* Two doors of equal weight, same as The Read. A funded developer
     will not fill in another form; a first-time landowner will not
     book a call. And a phone number and an email address are visible
     either way, because making somebody fill in a form to reach a
     contractor is the wrong move. */
  html += '<section class="fg-doors">' +
    '<div class="card fg-door">' +
      '<h4>Send me the full scorecard</h4>' +
      '<p class="muted">The complete ledger, all forty answers, and your three priority actions. A page you can forward to your engineer, your lender, or your partner.</p>' +
      (state.sentTo
        ? '<p class="fg-sent">On its way to <span class="mono">' + esc(state.sentTo) + '</span>.</p>'
        : state.ctaMode === 'email'
          ? '<div class="fg-inline-form">' +
              '<input class="input" type="email" id="cta-email-input" placeholder="you@yourproject.com" value="' + esc(state.email) + '">' +
              '<button class="btn accent" data-action="submit-results">Send it</button>' +
            '</div>' +
            (state.ctaError ? '<p class="fg-err">Enter a valid email address.</p>' : '') +
            '<p class="fg-fineprint muted">No spam. Unsubscribe any time.</p>'
          : '<button class="btn accent" data-action="cta-email">Email my scorecard</button>') +
    '</div>' +
    '<div class="card fg-door">' +
      '<h4>Talk it through with us</h4>' +
      '<p class="muted">Twenty minutes with the team that builds these. No form needed if you would rather just call.</p>' +
      '<a class="btn" href="/consultation/" data-cta="consultation">Set up a conversation</a>' +
      '<p class="fg-direct">' + esc(CONFIG.CONTACT_NAME) + ', ' + esc(CONFIG.CONTACT_TITLE) + '<br>' +
        '<a href="tel:' + esc(CONFIG.CONTACT_PHONE_HREF) + '">' + esc(CONFIG.CONTACT_PHONE) + '</a><br>' +
        '<a href="mailto:' + esc(CONFIG.CONTACT_EMAIL) + '">' + esc(CONFIG.CONTACT_EMAIL) + '</a></p>' +
    '</div>' +
  '</section>';

  /* The scorecard link. This is the artifact that turns one lead into
     three, so it is offered on screen and not only by email. */
  html += '<section class="fg-share">' +
    '<h4>Your scorecard has its own page.</h4>' +
    '<p class="muted">Everything on this screen lives at one link. Forward it to your engineer, your lender, or your partner. It is meant to be shared.</p>' +
    '<div class="fg-share-row">' +
      '<input class="input mono" id="sc-link" readonly value="' + esc(TPScoreCode.url(state.answers)) + '">' +
      '<button class="btn ghost" data-action="copy-link">Copy link</button>' +
      '<a class="btn ghost" href="' + esc(TPScoreCode.url(state.answers)) + '" target="_blank" rel="noopener">Open it</a>' +
    '</div>' +
    '<p class="fg-share-note muted" id="sc-copied" hidden>Copied.</p>' +
  '</section>';

  /* The paid offer, kept distinct from the two free doors above. This
     is the one that converts a reader into an engagement, so it does
     not get folded into the email card. */
  html += '<section class="fg-full"><div class="card">' +
    '<h4>Want a second set of eyes?</h4>' +
    '<p class="muted">These findings came from forty yes and no answers. A full assessment goes to the evidence behind every one of them: your documents, your site, and your numbers. Tell us and ' +
      esc(CONFIG.CONTACT_NAME.split(' ')[0]) + ' will reach out.</p>';
  if (state.fullReq) {
    html += '<p class="fg-sent">Thank you. ' + esc(CONFIG.CONTACT_NAME.split(' ')[0]) + ' will reach out.</p>';
  } else if (state.ctaMode === 'full') {
    html += '<div class="fg-inline-form">' +
        '<input class="input" type="email" id="cta-email-input" placeholder="you@yourproject.com" value="' + esc(state.email || state.sentTo) + '">' +
        '<input class="input" type="tel" id="cta-phone-input" placeholder="Phone (optional)" value="' + esc(state.phone) + '">' +
        '<button class="btn accent" data-action="submit-full">Request it</button>' +
      '</div>' +
      (state.ctaError ? '<p class="fg-err">Enter a valid email address.</p>' : '');
  } else {
    html += '<button class="btn" data-action="cta-full">Request the full assessment</button>';
  }
  html += '</div></section>';

  return html;
}

function renderFooterNote(R) {
  return '<section style="padding: 0 0 64px;">' +
    '<p class="muted" style="font-size: 12px; max-width: 640px;">' + R.disclaimer + '</p>' +
    '<button class="fg-link-btn" style="margin-top: 16px;" data-action="reset">Start over</button>' +
  '</section>';
}

/* The template read is already rendered before this runs. A success
   swaps in warmer wording; a failure, a timeout, or a proxy that was
   never deployed all leave the page exactly as it is. Fires once. */
function requestModelRead() {
  if (state.modelAsked || !state.revealed) return;
  if (typeof TPModel === 'undefined' || !TPModel.enabled()) return;
  state.modelAsked = true;
  var R = TPResults.evaluate(state.answers);
  TPModel.ask('standard_read', {
    template: TPStandardRead.compose(R, state.readCtx),
    score: R.score,
    band: R.verdict.label,
    open_gates: R.openGates.map(function (g) { return g.name; }),
    not_sure_count: R.notSureCount,
    project: state.readCtx ? {
      type: state.readCtx.type, land: state.readCtx.land,
      size: state.readCtx.size, stage: state.readCtx.stage
    } : null
  }, function (out) {
    var clean = TPModel.cleanLines(out, 5);
    if (!clean) return;
    state.modelLines = clean;
    if (state.step === 11 && state.revealed) render();
  });
}

function render() {
  /* Drives the static #fg-about block, which is crawlable copy that belongs
     with the cover and would be noise once the assessment is underway. */
  document.body.setAttribute('data-step', state.step);
  renderHeader();
  renderRail();
  var app = document.getElementById('app');
  if (state.step === 0) app.innerHTML = renderCover();
  else if (state.step >= 1 && state.step <= 10) app.innerHTML = renderPoint(state.step);
  else { app.innerHTML = renderLedger(); requestModelRead(); }
}

/* =============================================================
   EVENTS (delegated)
   ============================================================= */
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-go], [data-action], [data-key], [data-cta]');
  if (!el) return;

  if (el.dataset.cta === 'consultation') {
    track('consultation_cta_clicked', { placement: 'standard_result' });
    return;                                   // let the link navigate
  }

  if (el.dataset.go !== undefined) { goStep(parseInt(el.dataset.go, 10)); return; }

  if (el.dataset.key !== undefined) {
    var v = el.dataset.val === '1' ? true : el.dataset.val === '0' ? false : 'unsure';
    var pi = parseInt(el.dataset.key.split('-')[0], 10);
    state.answers[el.dataset.key] = v;
    save();

    /* Milestones go through once(): a re-answer, a back button, or a
       reload cannot re-send them. */
    trackOnce('assessment_start', { method: 'ten_point_standard' });
    trackOnce('standard_start', { carried_from_read: state.carried.length ? 'yes' : 'no' });

    if (pointDone(pi)) {
      trackOnce('standard_point_complete', {
        point_number: pi + 1,
        point_name: POINTS[pi].title,
        point_score: pointScore(pi)
      }, 'point-' + (pi + 1));
    }
    render();
    return;
  }

  switch (el.dataset.action) {
    case 'begin':
      track('fg_begin');
      goStep(1);
      break;
    case 'confirm-carry':
      state.carryConfirmed = true;
      track('fg_begin');
      trackOnce('standard_start', { carried_from_read: 'yes' });
      goStep(1);
      break;
    case 'copy-link': {
      var input = document.getElementById('sc-link');
      if (!input) break;
      input.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (err) {}
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(input.value)['catch'](function () {});
        ok = true;
      }
      var note = document.getElementById('sc-copied');
      if (note && ok) note.hidden = false;
      track('scorecard_forwarded', { method: 'copy_link' });
      break;
    }
    case 'next':
      if (state.step === 10) track('fg_view_ledger', { score: totalScore() });
      goStep(Math.min(11, state.step + 1));
      break;
    case 'prev':
      goStep(Math.max(0, state.step - 1));
      break;
    case 'submit-email': {
      var em = (document.getElementById('gate-email').value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
        state.email = em;
        state.emailError = true;
        render();
        return;
      }
      state.email = em;
      state.emailError = false;
      state.revealed = true;
      state.sentTo = em;
      save();
      submitToMailchimp(em, TPResults.evaluate(state.answers).payload);
      trackOnce('fg_email_captured', { score: totalScore() });
      trackOnce('scorecard_email_submitted', { placement: 'gate' });
      trackComplete();
      render();
      break;
    }
    case 'cta-full':
      state.ctaMode = 'full';
      state.ctaError = false;
      track('cta_click', { cta: 'full_assessment' });
      render();
      break;
    case 'cta-email':
      state.ctaMode = 'email';
      state.ctaError = false;
      track('cta_click', { cta: 'email_results' });
      render();
      break;
    case 'submit-results': {
      var rem = (document.getElementById('cta-email-input').value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rem)) {
        state.email = rem;
        state.ctaError = true;
        render();
        return;
      }
      state.email = rem;
      state.ctaError = false;
      state.sentTo = rem;
      state.ctaMode = '';
      save();
      submitToMailchimp(rem, TPResults.evaluate(state.answers).payload);
      trackOnce('fg_email_captured', { score: totalScore() });
      trackOnce('scorecard_email_submitted', { placement: 'result' });
      render();
      break;
    }
    case 'submit-full': {
      var fem = (document.getElementById('cta-email-input').value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fem)) {
        state.email = fem;
        state.ctaError = true;
        render();
        return;
      }
      state.email = fem;
      state.ctaError = false;
      state.fullReq = true;
      if (!state.sentTo) state.sentTo = fem;
      state.ctaMode = '';
      save();
      var fullPayload = TPResults.evaluate(state.answers).payload;
      fullPayload.REQFULL = 'YES';
      if (state.phone) fullPayload.PHONE = state.phone;
      submitToMailchimp(fem, fullPayload);
      track('fg_full_assessment_request', { score: totalScore() });
      render();
      break;
    }
    case 'skip':
      state.revealed = true;
      save();
      track('fg_skip', { score: totalScore() });
      trackComplete();
      render();
      break;
    case 'reset':
      state.answers = {};
      state.revealed = false;
      state.sentTo = '';
      state.email = '';
      state.emailError = false;
      state.step = 0;
      state.phone = '';
      state.fullReq = false;
      state.ctaMode = '';
      state.ctaError = false;
      state.carried = [];
      state.carryConfirmed = false;
      state.modelLines = null;
      state.modelAsked = false;
      save();
      /* Starting over has to let the milestones fire again, or the
         second run through is invisible in the funnel. */
      TPA.reset('standard_');
      TPA.reset('assessment_');
      track('fg_reset');
      render();
      goTop();
      break;
  }
});

/* Where people stop is the number that says whether forty questions
   is the barrier everyone assumes it is, so it fires on the way out
   rather than on a button nobody presses. */
(function armAbandon() {
  var sent = false;
  function fire() {
    if (sent || state.revealed || state.step < 1 || state.step > 10) return;
    sent = true;
    TPA.once('standard_abandon', { last_point: state.step });
  }
  window.addEventListener('pagehide', fire);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') fire();
  });
})();

document.addEventListener('input', function (e) {
  if (e.target.id === 'gate-email' || e.target.id === 'cta-email-input') state.email = e.target.value;
  if (e.target.id === 'cta-phone-input') state.phone = e.target.value;
});

/* =============================================================
   BOOT
   ============================================================= */
/* Boot only on the real page; the test harness loads this file for its
   data without a DOM to render into. */
if (document.getElementById('app')) {
  load();
  loadCarry();
  initGA();
  render();
}
