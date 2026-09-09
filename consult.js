'use strict';

/* =============================================================
   THE CONSULTATION FORM
   Two routes, and which one runs is decided by config, not by luck.

   ROUTE A, when CONFIG.MAILCHIMP_GROUP_CONSULT is set: the same
   JSONP subscribe the rest of the site uses, with the request marked
   REQFULL and the message in the note field.

   ROUTE B, while that group is blank: open the visitor's mail client
   addressed to Kenny with everything they typed already in it.

   Why route B exists rather than "just post it anyway". An ungrouped
   Mailchimp signup enters the Field Guide welcome journey and gets
   the scorecard email with every merge field empty. Somebody who
   asked a general contractor for a conversation would receive a
   blank scorecard as their first contact. A mail client that opens
   is a worse form and a much better first impression.

   Either way the phone number and the email address are printed on
   the page. Making somebody fill in a form to reach a contractor is
   the wrong move, so the form is the convenience, not the gate.
   ============================================================= */

(function () {
  var form = document.getElementById('cn-form');
  if (!form) return;

  var status = form.querySelector('.pg-form-status');
  var button = form.querySelector('button[type="submit"]');
  var NOTE_MAX = 255;   // Mailchimp merge fields truncate here

  function say(msg, isError) {
    status.textContent = msg;
    status.className = 'pg-form-status ' + (isError ? 'is-err' : 'is-ok');
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? (el.value || '').trim() : '';
  }

  /* Route B. Everything the visitor typed, in a message they can see
     before it sends, which is also why nothing is sent silently. */
  function mailtoFallback(d) {
    var body =
      'Name: ' + d.first + ' ' + d.last + '\n' +
      'Email: ' + d.email + '\n' +
      (d.phone ? 'Phone: ' + d.phone + '\n' : '') +
      (d.stage ? 'Stage: ' + d.stage + '\n' : '') +
      '\n' + (d.note || 'I would like to talk about my project.') + '\n';
    var href = 'mailto:' + CONFIG.CONTACT_EMAIL +
      '?subject=' + encodeURIComponent('Conversation about my project') +
      '&body=' + encodeURIComponent(body);
    window.location.href = href;
    say('Your email app should be opening with this filled in. If it does not, write to ' +
      CONFIG.CONTACT_EMAIL + ' or call ' + CONFIG.CONTACT_PHONE + '.', false);
  }

  /* Route A. Same two traps the rest of the site already learned:
     f_id pins the request to a stored form version and Mailchimp then
     drops every merge field that form does not define, and tags are
     accepted on this endpoint and silently discarded while groups
     are not. */
  function mailchimp(d) {
    var params = [
      'EMAIL=' + encodeURIComponent(d.email),
      'FNAME=' + encodeURIComponent(d.first),
      'LNAME=' + encodeURIComponent(d.last),
      'REQFULL=' + encodeURIComponent('CONVERSATION'),
      encodeURIComponent(CONFIG.MAILCHIMP_FIELD_NOTE) + '=' +
        encodeURIComponent((d.note + (d.stage ? ' [' + d.stage + ']' : '')).slice(0, NOTE_MAX))
    ];
    if (d.phone) params.push('PHONE=' + encodeURIComponent(d.phone));

    var g = CONFIG.MAILCHIMP_GROUP_CONSULT.split('=');
    params.push(encodeURIComponent(g[0]) + '=' + encodeURIComponent(g[1]));

    var u = /[?&]u=([^&]+)/.exec(CONFIG.MAILCHIMP_FORM_ACTION);
    var id = /[?&]id=([^&]+)/.exec(CONFIG.MAILCHIMP_FORM_ACTION);
    if (u && id) params.push('b_' + u[1] + '_' + id[1] + '=');

    var cb = 'cnMc' + Date.now();
    window[cb] = function (resp) {
      delete window[cb];
      button.disabled = false;
      if (resp && resp.result === 'error' && !/already subscribed/i.test(resp.msg || '')) {
        say('That did not go through. Call ' + CONFIG.CONTACT_PHONE + ' or write to ' +
          CONFIG.CONTACT_EMAIL + '.', true);
        return;
      }
      say('Thank you. ' + CONFIG.CONTACT_NAME.split(' ')[0] + ' will reach out.', false);
    };
    params.push('c=' + cb);

    var parts = CONFIG.MAILCHIMP_FORM_ACTION.split('?');
    var query = (parts[1] || '').split('&').filter(function (kv) {
      return kv && kv.indexOf('f_id=') !== 0;
    });
    var s = document.createElement('script');
    s.src = parts[0].replace(/\/post$/, '/post-json') + '?' + query.concat(params).join('&');
    document.body.appendChild(s);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = {
      first: val('cn-first'), last: val('cn-last'), email: val('cn-email'),
      phone: val('cn-phone'), stage: val('cn-stage'), note: val('cn-note')
    };
    if (!d.first) { say('Enter your first name.', true); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) {
      say('Enter a valid email address.', true);
      return;
    }
    /* No personal information goes to analytics. The event records
       that a request happened and which route carried it. */
    TPA.track('consultation_form_submitted', {
      route: CONFIG.MAILCHIMP_GROUP_CONSULT ? 'list' : 'email',
      stage: d.stage || 'not_given'
    });

    if (CONFIG.MAILCHIMP_GROUP_CONSULT) {
      button.disabled = true;
      say('Sending.', false);
      mailchimp(d);
    } else {
      mailtoFallback(d);
    }
  });

  /* Keep the remaining character count honest rather than letting the
     merge field truncate somebody's message without telling them. */
  var note = document.getElementById('cn-note');
  var count = document.getElementById('cn-note-count');
  if (note && count) {
    var tick = function () {
      var left = NOTE_MAX - note.value.length;
      count.textContent = left + ' characters left';
    };
    note.addEventListener('input', tick);
    tick();
  }
})();
