'use strict';

/* =============================================================
   THE JOURNAL — ARTICLE BEHAVIOR
   Share row, copy-link, newsletter, and the journal_view event.
   The article text itself is static HTML; nothing here renders
   copy.

   The page declares its own identity on <body>:
     data-slug="absorption-curve"
   ============================================================= */

(function () {
  jrInitGA();

  var slug = document.body.getAttribute('data-slug') || '';
  var title = document.title.split('|')[0].trim();

  /* Prefer the canonical over location.href so a link shared from
     a local preview or a URL carrying junk params still points at
     the real page. */
  var canonical = document.querySelector('link[rel="canonical"]');
  var url = canonical ? canonical.href : location.href;

  jrTrack('journal_view', { slug: slug });

  /* ---------- share ---------- */
  function shareHref(channel) {
    var u = encodeURIComponent(url);
    var t = encodeURIComponent(title);
    if (channel === 'linkedin') return 'https://www.linkedin.com/sharing/share-offsite/?url=' + u;
    if (channel === 'x') return 'https://twitter.com/intent/tweet?url=' + u + '&text=' + t;
    if (channel === 'email') return 'mailto:?subject=' + t + '&body=' + u;
    return '#';
  }

  var shareLinks = [].slice.call(document.querySelectorAll('[data-share]'));
  for (var i = 0; i < shareLinks.length; i++) {
    (function (el) {
      var channel = el.getAttribute('data-share');
      el.setAttribute('href', shareHref(channel));
      if (channel !== 'email') {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
      }
      el.addEventListener('click', function () {
        jrTrack('journal_share', { slug: slug, channel: channel });
      });
    })(shareLinks[i]);
  }

  /* ---------- copy link ---------- */
  var copyBtn = document.getElementById('jr-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      function done() {
        copyBtn.textContent = 'Link copied';
        jrTrack('journal_share', { slug: slug, channel: 'copy' });
        setTimeout(function () { copyBtn.textContent = 'Copy link'; }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, fallback);
      } else {
        fallback();
      }
      /* execCommand path for Safari without clipboard permission
         and for any non-secure-context preview. */
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); }
        catch (e) { copyBtn.textContent = 'Press Ctrl+C'; }
        document.body.removeChild(ta);
      }
    });
  }

  /* ---------- newsletter ---------- */
  jrBindSubscribe(document.getElementById('jr-article-form'));
})();
