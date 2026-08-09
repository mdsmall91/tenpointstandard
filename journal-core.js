'use strict';

/* =============================================================
   THE JOURNAL — SHARED RUNTIME
   Loaded by journal.html and every journal/<slug>.html.
   Analytics, the Mailchimp subscribe call, and small helpers.
   ============================================================= */

/* MIRRORED from CONFIG at the top of app.js. app.js runs the whole
   assessment on load, so the Journal cannot just include it.
   These two values must be kept in step with app.js by hand —
   if you rotate either one, change it in both places. */
var JR_CONFIG = {
  MAILCHIMP_FORM_ACTION: 'https://tenpointservicestx.us4.list-manage.com/subscribe/post?u=ca6a6d0df8860fb34744c0490&id=32ae7807af&f_id=0046d6e0f0',
  GA_MEASUREMENT_ID: 'G-DK01ZN4VLE'
};

/* =============================================================
   ANALYTICS
   Event names per the handoff: journal_view, journal_filter,
   journal_share, journal_subscribe.
   ============================================================= */
function jrInitGA() {
  if (!JR_CONFIG.GA_MEASUREMENT_ID) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + JR_CONFIG.GA_MEASUREMENT_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', JR_CONFIG.GA_MEASUREMENT_ID);
}

function jrTrack(name, params) {
  if (window.gtag) window.gtag('event', name, params || {});
}

/* =============================================================
   MAILCHIMP — same JSONP path as app.js submitToMailchimp().
   EMAIL only: the audience is at the 30-merge-field cap, so the
   Journal deliberately adds no new fields.
   ============================================================= */
function jrSubscribe(email, statusEl) {
  function say(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = 'jr-form-status' + (isError ? ' error' : '');
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    say('Enter a valid email address.', true);
    return false;
  }
  if (!JR_CONFIG.MAILCHIMP_FORM_ACTION) {
    console.warn('Mailchimp not configured: set JR_CONFIG.MAILCHIMP_FORM_ACTION');
    say('Subscription is not configured yet.', true);
    return false;
  }

  var params = ['EMAIL=' + encodeURIComponent(email)];

  // Honeypot field name is b_<u>_<id>, derived from the action URL.
  var u = /[?&]u=([^&]+)/.exec(JR_CONFIG.MAILCHIMP_FORM_ACTION);
  var id = /[?&]id=([^&]+)/.exec(JR_CONFIG.MAILCHIMP_FORM_ACTION);
  if (u && id) params.push('b_' + u[1] + '_' + id[1] + '=');

  var cbName = 'jrMc' + Date.now();
  window[cbName] = function (resp) {
    delete window[cbName];
    if (resp && resp.result === 'error') {
      // Already-subscribed comes back as an error; it is not one to the reader.
      var already = /already subscribed/i.test(resp.msg || '');
      say(already ? 'You are already on the list.' : 'That did not go through. Try again.', !already);
      if (!already) console.warn('Mailchimp:', resp.msg);
      return;
    }
    say('Thanks — you are on the list.', false);
    jrTrack('journal_subscribe', {});
  };
  params.push('c=' + cbName);

  /* f_id pins the request to a stored form version, and Mailchimp
     then silently drops any field not on that form. Strip it — the
     same reason app.js does. */
  var parts = JR_CONFIG.MAILCHIMP_FORM_ACTION.split('?');
  var query = (parts[1] || '').split('&').filter(function (kv) {
    return kv && kv.indexOf('f_id=') !== 0;
  });

  var script = document.createElement('script');
  script.src = parts[0].replace(/\/post$/, '/post-json') + '?' + query.concat(params).join('&');
  script.onerror = function () { say('That did not go through. Try again.', true); };
  document.body.appendChild(script);

  say('Sending…', false);
  return true;
}

/* Wire a form built as: <form> <input type="email"> <button> </form>
   plus a .jr-form-status element. */
function jrBindSubscribe(form) {
  if (!form) return;
  var input = form.querySelector('input[type="email"]');
  var status = form.querySelector('.jr-form-status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    jrSubscribe(input.value.trim(), status);
  });
}

/* 2026-07-28 -> "July 28, 2026". Parsed as parts rather than
   new Date(str), which reads a bare ISO date as UTC and can show
   the previous day west of Greenwich. */
var JR_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December'];
function jrFormatDate(iso) {
  var p = String(iso).split('-');
  if (p.length !== 3) return iso;
  return JR_MONTHS[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
}
