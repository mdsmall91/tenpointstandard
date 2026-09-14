'use strict';

/* =============================================================
   AGA SESSION SIGNUP — aga.html only
   Analytics plus one Mailchimp call. Self-contained rather than
   riding journal-core.js, because that file's subscribe path is
   hardwired to the Field Notes group and sends EMAIL alone.
   ============================================================= */

if (typeof CONFIG === 'undefined') {
  throw new Error('aga.js: config.js must be loaded first');
}

/* ---------- analytics ---------- */
function agaInitGA() {
  /* analytics.js owns the GA wiring for the whole site now. This
     stays as the fallback for any page that has not loaded it yet,
     and the gtag guard is what stops a page that loads both from
     counting every hit twice. */
  if (typeof TPA !== 'undefined') { TPA.init(); return; }
  if (window.gtag) return;
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

function agaTrack(name, params) {
  if (typeof TPA !== 'undefined') { TPA.track(name, params); return; }
  if (window.gtag) window.gtag('event', name, params || {});
}

/* ---------- one name box, two merge fields ----------
   The form asks for a name, not a first name and a last name: it is a
   seat request, and two boxes to sit at a table is two boxes too many.
   Mailchimp still wants FNAME and LNAME, and the confirmation email
   greets somebody by FNAME, so the split happens here.

   Split on the FIRST space, not the last. "Mary Anne Villanueva" then
   greets as "Mary", which is right, and puts the rest in LNAME. Split
   on the last space and a compound surname breaks instead, which is
   the worse failure: a greeting can read a little formal, a mangled
   surname is just wrong. A single word goes to FNAME and LNAME is
   left empty rather than guessed at. */
function agaSplitName(full) {
  var name = (full || '').trim().replace(/\s+/g, ' ');
  var cut = name.indexOf(' ');
  if (cut === -1) return { first: name, last: '' };
  return { first: name.slice(0, cut), last: name.slice(cut + 1) };
}

/* ---------- submit ----------
   JSONP against /subscribe/post-json, the same path app.js and
   journal-core.js use. Two rules carried over from both, each
   learned by a live test that looked like a success and was not:

   - f_id pins the request to a stored form version, and Mailchimp
     then drops every merge field that form does not define. Strip it.
   - Groups work on this endpoint. Tags do not: tags= is accepted,
     answered with result:"success", and discarded. */
function agaSubmit(data, statusEl, button) {
  function say(msg, isError) {
    statusEl.textContent = msg;
    statusEl.className = 'aga-status' + (isError ? ' error' : '');
  }

  if (!data.first) { say('Enter your name.', true); return false; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
    say('Enter a valid email address.', true);
    return false;
  }

  /* Refuse rather than half-work. Without the group the signup drops
     into the Field Guide welcome journey and gets a scorecard email
     with empty merge fields, which looks fine from the reader's side
     and is completely wrong. A visible error is better. */
  if (!CONFIG.MAILCHIMP_FORM_ACTION || !CONFIG.MAILCHIMP_GROUP_AGA) {
    console.warn('aga.js: set MAILCHIMP_GROUP_AGA in config.js before this page goes live');
    say('Signup is not switched on yet. Email info@tenpointstandard.com and we will hold you a seat.', true);
    return false;
  }

  var params = [
    'EMAIL=' + encodeURIComponent(data.email),
    'FNAME=' + encodeURIComponent(data.first),
    'LNAME=' + encodeURIComponent(data.last)
  ];

  /* Encode the brackets in group[70477][2] but not the = that
     separates the field name from its value. */
  var g = CONFIG.MAILCHIMP_GROUP_AGA.split('=');
  params.push(encodeURIComponent(g[0]) + '=' + encodeURIComponent(g[1]));

  // Honeypot field name is b_<u>_<id>, derived from the action URL.
  var u = /[?&]u=([^&]+)/.exec(CONFIG.MAILCHIMP_FORM_ACTION);
  var id = /[?&]id=([^&]+)/.exec(CONFIG.MAILCHIMP_FORM_ACTION);
  if (u && id) params.push('b_' + u[1] + '_' + id[1] + '=');

  var cbName = 'agaMc' + Date.now();
  window[cbName] = function (resp) {
    delete window[cbName];
    button.disabled = false;
    if (resp && resp.result === 'error') {
      /* Mailchimp reports an existing contact as an error. For a
         seat request it is not one, and a second submit does update
         the profile, so the name still lands. */
      var already = /already subscribed/i.test(resp.msg || '');
      if (already) {
        say('You are already on our list, and your seat request is in. See you Wednesday.', false);
        agaTrack('aga_signup', { existing_contact: true });
        return;
      }
      say('That did not go through. Try again, or email info@tenpointstandard.com.', true);
      console.warn('Mailchimp:', resp.msg);
      return;
    }
    say('You are on the list. Watch for a confirmation email, and come find us at the booth.', false);
    agaTrack('aga_signup', { existing_contact: false });
  };
  params.push('c=' + cbName);

  var parts = CONFIG.MAILCHIMP_FORM_ACTION.split('?');
  var query = (parts[1] || '').split('&').filter(function (kv) {
    return kv && kv.indexOf('f_id=') !== 0;
  });

  var script = document.createElement('script');
  script.src = parts[0].replace(/\/post$/, '/post-json') + '?' + query.concat(params).join('&');
  script.onerror = function () {
    button.disabled = false;
    say('That did not go through. Try again, or email info@tenpointstandard.com.', true);
  };
  document.body.appendChild(script);

  button.disabled = true;
  say('Sending…', false);
  return true;
}

/* ---------- wiring ---------- */
document.addEventListener('DOMContentLoaded', function () {
  agaInitGA();
  agaTrack('aga_view', {});

  var form = document.getElementById('aga-form');
  if (!form) return;

  var status = form.querySelector('.aga-status');
  var button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = agaSplitName(document.getElementById('aga-name').value);
    agaSubmit({
      first: name.first,
      last: name.last,
      email: document.getElementById('aga-email').value.trim()
    }, status, button);
  });
});
