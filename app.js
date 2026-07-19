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
var state = { answers: {}, revealed: false, sentTo: '', email: '', emailError: false, step: 0 };

function load() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      var d = JSON.parse(raw);
      state.answers = d.a || {};
      state.revealed = !!d.r;
      state.sentTo = d.e || '';
      state.step = d.s || 0;
    }
  } catch (e) {}
}
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ a: state.answers, r: state.revealed, e: state.sentTo, s: state.step }));
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
function submitToMailchimp(email) {
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
  for (var i = 0; i < POINTS.length; i++) {
    params.push('P' + POINTS[i].n + '=' + pointScore(i) + ' / ' + POINTS[i].max);
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

  var parts = CONFIG.MAILCHIMP_FORM_ACTION.split('?');
  var script = document.createElement('script');
  script.src = parts[0].replace(/\/post$/, '/post-json') + '?' + parts[1] + '&' + params.join('&');
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
      '<p class="lede" style="margin-top: 24px; max-width: 52ch;">Most projects fail at the seams. Not the design. Not the dream. The seams between site and capital, design and procurement, schedule and operations. Forty questions. One hundred points. See where you are strong, where the risk is concentrated, and what to do next.</p>' +
      '<div style="display: flex; gap: 16px; align-items: center; margin-top: 40px;">' +
        '<button class="btn lg" data-action="begin">Begin the assessment</button>' +
        '<span class="mono" style="font-size: 11px; color: var(--text-faint);">10 POINTS · ~5 MIN</span>' +
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
      '<div style="height: 2px; background: var(--surface-2); margin-top: 16px;"><div style="height: 2px; background: var(--accent); width: ' + Math.round((step / 10) * 100) + '%; transition: width .3s;"></div></div>' +
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
      '<div style="border-top: 1px solid var(--border); margin-top: 8px; padding-top: 16px;">' +
        '<span class="mono" style="font-size: 11px; color: var(--text-faint); letter-spacing: 0.06em;">DOCUMENT · ' + p.docs + '</span>' +
      '</div>' +
    '</section>' +
    '<div style="display: flex; justify-content: space-between; padding: 24px 0 64px;">' +
      '<button class="btn ghost" data-action="prev">Back</button>' +
      '<button class="btn" data-action="next">' + (step === 10 ? 'See the ledger' : 'Next point') + '</button>' +
    '</div>';
  return html;
}

function renderLedger() {
  var total = totalScore();
  var html = '<section style="padding: 56px 0 64px;">' +
    '<div class="eyebrow dotted">The ledger</div>' +
    '<h2 style="margin-top: 12px;">Add up your score.</h2>' +
    '<p class="muted" style="margin-top: 12px;">Every answer is a have or have-not. Capital weighs heaviest. One hundred points possible.</p>' +
    '<div style="margin-top: 32px; max-width: 560px;">';
  for (var i = 0; i < POINTS.length; i++) {
    html += '<div style="display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0; border-top: 1px solid var(--border-soft);">' +
      '<div style="display: flex; gap: 14px; align-items: baseline;"><span class="mono" style="font-size: 12px; color: var(--text-faint);">' + POINTS[i].n + '</span><span style="font-size: 15px;">' + POINTS[i].title + '</span></div>' +
      '<span class="mono" style="font-size: 13px; color: var(--text-strong);">' + pointScore(i) + ' / ' + POINTS[i].max + '</span>' +
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

  if (state.revealed) html += renderResults(total);
  return html;
}

function renderResults(total) {
  var bi = bandIdx(total);
  var html = '<section style="padding: 0 0 64px;">';
  if (state.sentTo) {
    html += '<p class="muted" style="font-size: 13px; margin-bottom: 24px;">A copy of your scorecard is on its way to <span class="mono">' + esc(state.sentTo) + '</span>.</p>';
  }
  html += '<div style="display: flex; align-items: baseline; gap: 20px;">' +
      '<span class="display" style="font-size: clamp(3rem, 6vw, 4.75rem); color: var(--accent-deep);">' + total + '</span>' +
      '<span class="mono" style="font-size: 13px; color: var(--text-faint);">/ 100 · ' + answeredCount() + ' OF 40 ANSWERED</span>' +
    '</div>' +
    '<div class="grid-3" style="margin-top: 32px;">';
  for (var i = 0; i < BANDS.length; i++) {
    html += '<div class="fg-band' + (i === bi ? ' active' : '') + '">' +
      '<div class="mono" style="font-size: 11px; color: var(--text-faint); letter-spacing: 0.06em;">SCORE ' + BANDS[i].range + '</div>' +
      '<h4 style="margin-top: 10px;">' + BANDS[i].title + '</h4>' +
      '<p class="muted" style="font-size: 14px; margin-top: 8px;">' + BANDS[i].body + '</p>' +
      '<div class="badge accent" style="margin-top: 16px;">' + BANDS[i].service + '</div>' +
    '</div>';
  }
  html += '</div>' +
    '<h3 style="margin-top: 56px;">Where the risk is concentrated.</h3>' +
    '<div style="margin-top: 24px; max-width: 640px;">';
  for (var j = 0; j < POINTS.length; j++) {
    var score = pointScore(j), pct = Math.round((score / POINTS[j].max) * 100);
    html += '<div class="fg-bar-row">' +
      '<span class="fg-bar-label" style="font-size: 13px; color: var(--text-muted);">' + POINTS[j].n + ' · ' + POINTS[j].title + '</span>' +
      '<div style="height: 6px; background: var(--surface-2);"><div style="height: 6px; background: var(--accent); width: ' + pct + '%; transition: width .3s;"></div></div>' +
      '<span class="mono" style="font-size: 12px; color: var(--text-strong); text-align: right;">' + score + ' / ' + POINTS[j].max + '</span>' +
    '</div>';
  }
  html += '</div>' +
    '<div style="display: flex; gap: 16px; align-items: center; margin-top: 48px;">' +
      '<a class="btn lg" href="mailto:letstalk@tenpointstandard.com?subject=Field%20Guide%20score">Contact us</a>' +
      '<button class="fg-link-btn" data-action="reset">Start over</button>' +
    '</div>' +
  '</section>';
  return html;
}

function render() {
  renderHeader();
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
      submitToMailchimp(em);
      track('fg_email_captured', { score: totalScore() });
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
      save();
      track('fg_reset');
      render();
      goTop();
      break;
  }
});

document.addEventListener('input', function (e) {
  if (e.target.id === 'gate-email') state.email = e.target.value;
});

/* =============================================================
   BOOT
   ============================================================= */
load();
initGA();
render();
