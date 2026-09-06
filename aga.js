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
  if (window.gtag) window.gtag('event', name, params || {});
}

/* ---------- the one field the note lives in ----------
   CONFIG.MAILCHIMP_FIELD_NOTE holds the merge tag, e.g. 'NOTE'. */
var AGA_NOTE_MAX = 255; // merge fields truncate here

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

  if (!data.first) { say('Enter your first name.', true); return false; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
    say('Enter a valid email address.', true);
    return false;
  }

  /* Refuse rather than half-work. Without the group the signup drops
     into the Field Guide welcome journey and gets a scorecard email
     with empty merge fields; without the note field the note is
     accepted and silently thrown away. Both are worse than a visible
     error, because both look fine from the reader's side. */
  if (!CONFIG.MAILCHIMP_FORM_ACTION || !CONFIG.MAILCHIMP_GROUP_AGA || !CONFIG.MAILCHIMP_FIELD_NOTE) {
    console.warn('aga.js: set MAILCHIMP_GROUP_AGA and MAILCHIMP_FIELD_NOTE in config.js before this page goes live');
    say('Signup is not switched on yet. Email info@tenpointstandard.com and we will hold you a seat.', true);
    return false;
  }

  var params = [
    'EMAIL=' + encodeURIComponent(data.email),
    'FNAME=' + encodeURIComponent(data.first),
    'LNAME=' + encodeURIComponent(data.last),
    encodeURIComponent(CONFIG.MAILCHIMP_FIELD_NOTE) + '=' +
      encodeURIComponent(data.note.slice(0, AGA_NOTE_MAX))
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
         the profile, so the note and name still land. */
      var already = /already subscribed/i.test(resp.msg || '');
      if (already) {
        say('You are already on our list, and your seat request is in. See you Tuesday.', false);
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
  var note = document.getElementById('aga-note');
  var count = document.getElementById('aga-note-count');

  /* maxlength already stops typing past the cap; this just tells the
     reader where the ceiling is, since a note is the one field where
     someone will want to say more than fits. */
  function updateCount() {
    count.textContent = (AGA_NOTE_MAX - note.value.length) + ' characters left';
  }
  note.addEventListener('input', updateCount);
  updateCount();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    agaSubmit({
      first: document.getElementById('aga-first').value.trim(),
      last: document.getElementById('aga-last').value.trim(),
      email: document.getElementById('aga-email').value.trim(),
      note: note.value.trim()
    }, status, button);
  });
});
