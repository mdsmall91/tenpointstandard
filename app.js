'use strict';

/* =============================================================
   CONFIG — the only values that need editing after launch.
   ============================================================= */
var CONFIG = {
  // Mailchimp embedded-form action URL for the audience signup form.
  // Mailchimp: Audience > Signup forms > Embedded forms > copy the <form action="..."> URL.
  MAILCHIMP_FORM_ACTION: 'https://tenpointservicestx.us4.list-manage.com/subscribe/post?u=ca6a6d0df8860fb34744c0490&id=32ae7807af&f_id=0046d6e0f0',

  // Google Analytics 4 measurement ID. Leave empty to disable.
  GA_MEASUREMENT_ID: 'G-DK01ZN4VLE'
};

/* =============================================================
   DATA — canonical, copy verbatim from the design handoff.
   ============================================================= */
var POINTS = [
  { n: '01', title: 'Your Guests', pts: 3, max: 12, docs: 'Target Market Analysis · Competitive Analysis · Guest Experience Plan',
    qs: ['Do you know your target guest, and do they already come to the area?',
         'Do you know why they will choose you over options they already have?',
         'Do you know which experiences are must-haves for your guests?',
         'Do you know how your planned amenities map to the guest experience?'] },
  { n: '02', title: 'Your Site', pts: 3, max: 12, docs: 'Survey & Basemap · Site Constraints · Infrastructure Master Plan · Site Analysis Plan',
    qs: ['Do you have a legal boundary and a plan of current site conditions?',
         'Do you know the challenges: wetlands, easements, soils, access?',
         'Is there a plan for water, sanitary, power, and stormwater?',
         'Do you know what makes the site special, and how weather, seasons, and access shape it?'] },
  { n: '03', title: 'Capital Plan', pts: 4, max: 16, docs: 'Funding Strategy · Land Strategy · Cash Flow Model · Financial Partner Review',
    qs: ['Do you know whether you need outside investment, and do you have the required equity?',
         'Do you control the land, and do you know what is time-critical about your position?',
         'Have you modeled cash flow for every phase, and stress-tested the variables?',
         'Have lending partners or outside financial representatives reviewed the plan?'] },
  { n: '04', title: 'Operations Plan', pts: 3, max: 12, docs: 'Management Structure · Staffing & Service Model · Revenue Center P&L · Lifecycle Maintenance Plan',
    qs: ['Do you know who runs the resort day one: your team, a third party, or a flag not yet signed?',
         'Does the space plan support the staffing model, back of house included?',
         'Do you know which revenue centers carry the P&L, and is the design costed to their margin?',
         'Do you know what year-three maintenance looks like, and who signs off on that cost?'] },
  { n: '05', title: 'Schedule', pts: 2, max: 8, docs: 'CMP Baseline Schedule · Schedule Risk Analysis · Float Analysis · Integrated Procurement Schedule',
    qs: ['Do you have milestones, and are they tied to funding or closing?',
         'Do you know what else sits on the critical path: approvals, construction, commissioning?',
         'Does the build duration reconcile with lead times, weather windows, and opening day?',
         'Do you know which materials, supplies, and units carry long lead times?'] },
  { n: '06', title: 'Entitlements & Regulatory', pts: 3, max: 12, docs: 'Zoning Review · Entitlement Strategy · Permit Checklist · Development Approval Matrix',
    qs: ['Do you know the zoning, and do you have use-by-right?',
         'If the use is non-conforming, do you know what compliance requires, and how long?',
         'Do you know which permits you anticipate, and the process to obtain them?',
         'Do you know what approvals govern site development and construction on the property?'] },
  { n: '07', title: 'Design', pts: 2, max: 8, docs: 'Subconsultant Alignment · Brand Strategy · Constructability Review · Construction Documents & Specifications',
    qs: ['Do you know which design professionals you need for regulatory compliance?',
         'Does the design champion the brand and the guest experience?',
         'Is the design constructable, safe, cost-effective, and code-compliant?',
         'Are the drawings detailed enough to build from, and to hold construction to?'] },
  { n: '08', title: 'Procurement', pts: 2, max: 8, docs: 'Long-lead Procurement Plan · Vendor Prequalification · Responsibility Matrix · Site Logistics Matrix',
    qs: ['Is every long-lead item identified, and locked in with deposits?',
         'Are vendors vetted for capacity, financial stability, and track record on resorts like yours?',
         'Do you know what you buy direct versus through the contractor, with handoffs documented?',
         'Do you know where materials are staged, and how delivery is sequenced against installation?'] },
  { n: '09', title: 'Cost Certainty', pts: 2, max: 8, docs: 'Budget Analysis · Independent Cost Validation · Variance Tracking · Contingency & Risk Allocation',
    qs: ['Is the budget a detailed breakdown of hard and soft costs, including regulatory fees?',
         'Has a third party validated how the budget was built and its assumptions?',
         'Is the budget updated regularly, tracking projected against actual?',
         'Are you carrying a contingency, and do you know your biggest risks in the model?'] },
  { n: '10', title: 'Quality Assurance', pts: 1, max: 4, docs: 'Dedicated Project Management · Site Walk & Verification · Quality Guarantee · Standard-of-Care',
    qs: ['Is someone on site every day, walking the work and holding the contract?',
         'Are punch items tracked, with a named owner who closes them?',
         'Is the process to resolve conflicts in writing from contractors and trades?',
         'Are the contractors and vendors on your property insured and licensed in your state?'] }
];

var BANDS = [
  { range: '0 – 39', title: 'Answer the fundamentals.', service: 'Ten Point Align',
    body: 'Market, land, and money come first. Settle who the guest is, what the site can support, and how the project is funded, before spending on design or permits.' },
  { range: '40 – 69', title: 'Close the gaps on paper.', service: 'Ten Point Design',
    body: 'The idea holds. The remaining risk lives in entitlements, drawings, procurement, and pricing, which is cheaper to resolve on paper than in the field.' },
  { range: '70 – 100', title: 'Protect the plan.', service: 'Ten Point Build',
    body: 'The seams are closed. The work from here is holding schedule, budget, and quality through construction, commissioning, and the first guest stay.' }
];

var STORE_KEY = 'tp-fieldguide-v1';

/* =============================================================
   STATE
   ============================================================= */
var state = { answers: {}, revealed: false, sentTo: '', email: '', emailError: false, step: 0,
  phone: '', fullReq: false, ctaMode: '', ctaError: false };

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
    }
  } catch (e) {}
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ a: state.answers, r: state.revealed, e: state.sentTo, s: state.step, f: state.fullReq }));
  } catch (e) {}
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
function answeredCount() { return Object.keys(state.answers).length; }
function bandIdx(total) { return total <= 39 ? 0 : total <= 69 ? 1 : 2; }
function pointDone(pi) {
  for (var qi = 0; qi < POINTS[pi].qs.length; qi++) {
    if (state.answers[pi + '-' + qi] === undefined) return false;
  }
  return true;
}

/* =============================================================
   ANALYTICS (GA4, optional)
   ============================================================= */
function initGA() {
  if (!CONFIG.GA_MEASUREMENT_ID) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.GA_MEASUREMENT_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', CONFIG.GA_MEASUREMENT_ID);
}
function track(name, params) {
  if (window.gtag) window.gtag('event', name, params || {});
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

function renderCover() {
  return '' +
    '<section class="fg-cover">' +
      '<div class="eyebrow dotted">The Ten Point Standard</div>' +
      '<h1 class="display" style="margin-top: 16px; font-size: clamp(3rem, 7vw, var(--fs-display));">The Field Guide.</h1>' +
      '<p class="lede" style="margin-top: 24px; max-width: 52ch;">The Field Guide is a readiness diagnostic for owners planning outdoor hospitality resorts. Most projects fail at the seams. Not the design. Not the dream. The seams between site and capital, design and procurement, schedule and operations. Forty questions. One hundred points. See where you are strong, where the risk is concentrated, and what to do next.</p>' +
      '<div style="display: flex; gap: 16px; align-items: center; margin-top: 40px;">' +
        '<button class="btn lg" data-action="begin">Begin the assessment</button>' +
        '<span class="mono" style="font-size: 11px; color: var(--text-faint);">~5 MIN</span>' +
      '</div>' +
    '</section>';
}

function renderPoint(step) {
  var pi = step - 1, p = POINTS[pi], score = pointScore(pi);
  var html = '' +
    '<section class="fg-pstep">' +
      '<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px 16px; flex-wrap: wrap;">' +
        '<div class="eyebrow dotted">Point ' + p.n + ' / 10</div>' +
        '<div class="mono" style="font-size: 11px; color: var(--text-faint);">EACH YES = ' + p.pts + ' PTS · ' + score + ' / ' + p.max + '</div>' +
      '</div>' +
      '<h2 style="margin-top: 28px;">' + p.title + '.</h2>' +
      '<div style="margin-top: 24px;">';
  for (var qi = 0; qi < p.qs.length; qi++) {
    var key = pi + '-' + qi, ans = state.answers[key];
    html += '' +
      '<div class="fg-q">' +
        '<div style="display: flex; gap: 14px; align-items: baseline;"><span class="mono" style="font-size: 11px; color: var(--text-faint); flex: none;">Q' + (qi + 1) + '</span><span style="font-size: 16px; color: var(--text); max-width: 58ch;">' + p.qs[qi] + '</span></div>' +
        '<div class="fg-seg" style="display: flex; gap: 6px;">' +
          '<button class="fg-yn yes' + (ans === true ? ' on' : '') + '" data-key="' + key + '" data-val="1">Yes</button>' +
          '<button class="fg-yn no' + (ans === false ? ' on' : '') + '" data-key="' + key + '" data-val="0">No</button>' +
        '</div>' +
      '</div>';
  }
  html += '</div>' +
    '</section>' +
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
  var html = '<section style="padding: 0 0 40px;"><div class="card" style="max-width: 640px; padding: var(--s-8);">' +
    '<h4>Was this useful?</h4>' +
    '<p class="muted" style="font-size: 14px; margin-top: 8px;">These findings came from forty yes/no answers. A full assessment reviews the evidence behind every answer: your documents, your site, your numbers. If you want that second set of eyes, tell us and Kenny will reach out.</p>';
  if (state.fullReq) {
    html += '<p style="font-size: 14px; margin-top: 16px; font-weight: 500;">Thank you. Kenny will reach out.</p>';
  }
  if (state.ctaMode === 'full') {
    html += '<div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">' +
      '<input class="input" type="email" id="cta-email-input" placeholder="you@yourproject.com" value="' + esc(state.email || state.sentTo) + '" style="flex: 1; min-width: 200px;">' +
      '<input class="input" type="tel" id="cta-phone-input" placeholder="Phone (optional)" value="' + esc(state.phone) + '" style="flex: 1; min-width: 160px;">' +
      '<button class="btn accent" data-action="submit-full">Request the full assessment</button>' +
    '</div>' +
    (state.ctaError ? '<div style="font-size: 12px; color: var(--bronze-deep); margin-top: 8px;">Enter a valid email address.</div>' : '');
  } else if (state.ctaMode === 'email') {
    html += '<div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">' +
      '<input class="input" type="email" id="cta-email-input" placeholder="you@yourproject.com" value="' + esc(state.email || state.sentTo) + '" style="flex: 1; min-width: 220px;">' +
      '<button class="btn accent" data-action="submit-results">Email my results</button>' +
    '</div>' +
    (state.ctaError ? '<div style="font-size: 12px; color: var(--bronze-deep); margin-top: 8px;">Enter a valid email address.</div>' : '');
  } else {
    html += '<div style="display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap;">' +
      (state.fullReq ? '' : '<button class="btn accent" data-action="cta-full">I want the full assessment</button>') +
      (state.sentTo ? '' : '<button class="btn ghost" data-action="cta-email">Email me these results</button>') +
    '</div>';
    if (state.sentTo) {
      html += '<p class="muted" style="font-size: 13px; margin-top: 12px;">A copy of your scorecard is on its way to <span class="mono">' + esc(state.sentTo) + '</span>.</p>';
    }
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

function render() {
  renderHeader();
  renderRail();
  var app = document.getElementById('app');
  if (state.step === 0) app.innerHTML = renderCover();
  else if (state.step >= 1 && state.step <= 10) app.innerHTML = renderPoint(state.step);
  else app.innerHTML = renderLedger();
}

/* =============================================================
   EVENTS (delegated)
   ============================================================= */
document.addEventListener('click', function (e) {
  var el = e.target.closest('[data-go], [data-action], [data-key]');
  if (!el) return;

  if (el.dataset.go !== undefined) { goStep(parseInt(el.dataset.go, 10)); return; }

  if (el.dataset.key !== undefined) {
    state.answers[el.dataset.key] = el.dataset.val === '1';
    save();
    render();
    return;
  }

  switch (el.dataset.action) {
    case 'begin':
      track('fg_begin');
      goStep(1);
      break;
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
      track('fg_email_captured', { score: totalScore() });
      render();
      break;
    }
    case 'cta-full':
      state.ctaMode = 'full';
      state.ctaError = false;
      render();
      break;
    case 'cta-email':
      state.ctaMode = 'email';
      state.ctaError = false;
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
      track('fg_email_captured', { score: totalScore() });
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
      save();
      track('fg_reset');
      render();
      goTop();
      break;
  }
});

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
  initGA();
  render();
}
