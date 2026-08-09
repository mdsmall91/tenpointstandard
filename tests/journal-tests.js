'use strict';

/* =============================================================
   JOURNAL DRIFT TESTS

   posts.js is the canonical content model; journal.html and the
   pages under journal/ are hand-maintained static HTML. Nothing
   stops the two from disagreeing, so this checks that they do
   not — the same job QUESTIONS.md does for the assessment.

   Serve over HTTP and open /tests/journal-tests.html. Writes a
   JSON summary to #out and window.__journalResults.
   ============================================================= */

(function () {
  var failures = [], passes = 0;

  function check(name, cond, detail) {
    if (cond) passes++;
    else failures.push({ test: name, detail: detail === undefined ? '' : String(detail) });
  }

  function eq(name, actual, expected) {
    check(name, actual === expected, 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
  }

  /* Collapse whitespace so indentation in the HTML never fails a
     comparison against a single-line string in posts.js. */
  function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

  function get(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
      return r.text();
    }).then(function (t) {
      return new DOMParser().parseFromString(t, 'text/html');
    });
  }

  function text(doc, sel) {
    var el = doc.querySelector(sel);
    return el ? norm(el.textContent) : null;
  }

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  function longDate(iso) {
    var p = iso.split('-');
    return MONTHS[parseInt(p[1], 10) - 1] + ' ' + parseInt(p[2], 10) + ', ' + p[0];
  }

  /* ---------- model-only checks ---------- */
  function checkModel() {
    var featured = POSTS.filter(function (p) { return p.featured; });
    eq('exactly one featured entry', featured.length, 1);
    check('featured entry is first', POSTS[0] && POSTS[0].featured === true);

    var slugs = {};
    POSTS.forEach(function (p) {
      check('tag in enum: ' + p.slug, TAGS.indexOf(p.tag) !== -1, p.tag);
      check('slug unique: ' + p.slug, !slugs[p.slug]);
      slugs[p.slug] = true;
      check('slug is url-safe: ' + p.slug, /^[a-z0-9-]+$/.test(p.slug));
      check('publishedAt is ISO: ' + p.slug, /^\d{4}-\d{2}-\d{2}$/.test(p.publishedAt), p.publishedAt);
      check('has dek: ' + p.slug, !!p.dek);
      check('has readTime: ' + p.slug, /^\d+ min read$/.test(p.readTime), p.readTime);
      check('has heroAspect: ' + p.slug, /^\d+\/\d+$/.test(p.heroAspect), p.heroAspect);
      check('author is inline: ' + p.slug, !!(p.author && p.author.name && p.author.credential && p.author.bio));
    });

    for (var i = 1; i < POSTS.length; i++) {
      check('newest first at index ' + i,
        POSTS[i - 1].publishedAt >= POSTS[i].publishedAt,
        POSTS[i - 1].publishedAt + ' then ' + POSTS[i].publishedAt);
    }
  }

  /* ---------- index page ---------- */
  function checkIndex(doc) {
    var tiles = [].slice.call(doc.querySelectorAll('.jr-tile'));
    eq('index: one tile per post', tiles.length, POSTS.length);

    POSTS.forEach(function (p) {
      var link = doc.querySelector('.jr-tile a[href="journal/' + p.slug + '.html"]');
      check('index: tile exists for ' + p.slug, !!link);
      if (!link) return;

      var tile = link.closest('.jr-tile');
      eq('index: tile tag ' + p.slug, tile.getAttribute('data-tag'), tagSlug(p.tag));
      eq('index: tile title ' + p.slug, norm(link.textContent), p.title);
      eq('index: tile dek ' + p.slug, norm(tile.querySelector('.jr-tile-dek').textContent), p.dek);
      eq('index: tile author ' + p.slug, norm(tile.querySelector('.jr-byline-name').textContent), p.author.name);
      eq('index: tile credential ' + p.slug, norm(tile.querySelector('.jr-byline-cred').textContent), p.author.credential);
      eq('index: tile readTime ' + p.slug, norm(tile.querySelector('.jr-byline-meta').textContent), p.readTime);

      /* The media box carries the post's aspect ratio inline so the
         masonry columns cannot reflow once images land. */
      var media = tile.querySelector('.jr-media');
      var ratio = (media.getAttribute('style') || '').replace(/\s|;$/g, '');
      eq('index: tile aspect ' + p.slug, ratio, 'aspect-ratio:' + p.heroAspect);

      eq('index: featured flag ' + p.slug, tile.hasAttribute('data-featured'), !!p.featured);
    });

    /* Filter chips: All plus the six stages, in enum order. */
    var chips = [].slice.call(doc.querySelectorAll('.jr-chip'));
    eq('index: chip count', chips.length, TAGS.length + 1);
    eq('index: first chip is All', chips[0].getAttribute('data-tag'), 'all');
    TAGS.forEach(function (t, i) {
      eq('index: chip ' + t, chips[i + 1].getAttribute('data-tag'), tagSlug(t));
      eq('index: chip label ' + t, norm(chips[i + 1].textContent), t);
    });

    check('index: is indexable',
      /index/.test(doc.querySelector('meta[name="robots"]').content));
    eq('index: entry count label',
      text(doc, '.tp-hero-meta span'), POSTS.length + ' entries');
    eq('index: newsletter posts to the shared handler',
      !!doc.getElementById('jr-dispatch-form'), true);
  }

  /* ---------- article pages ---------- */
  function checkArticle(p, doc) {
    var s = 'article ' + p.slug + ': ';

    eq(s + 'slug attribute', doc.body.getAttribute('data-slug'), p.slug);
    eq(s + 'h1', text(doc, '.jr-article-title'), p.title);
    eq(s + 'dek', text(doc, '.jr-article-dek'), p.dek);
    eq(s + 'tag', text(doc, '.jr-article-header .jr-tag-label'), p.tag);
    eq(s + 'author', text(doc, '.jr-article-byline .jr-byline-name'), p.author.name);
    eq(s + 'credential', text(doc, '.jr-article-byline .jr-byline-cred'), p.author.credential);
    eq(s + 'bio', text(doc, '.jr-author-bio'), p.author.bio);
    eq(s + 'canonical',
      doc.querySelector('link[rel="canonical"]').getAttribute('href'),
      'https://tenpointstandard.com/journal/' + p.slug + '.html');
    eq(s + 'description', doc.querySelector('meta[name="description"]').content, p.dek);
    eq(s + 'published time',
      doc.querySelector('meta[property="article:published_time"]').content, p.publishedAt);

    var meta = norm(text(doc, '.jr-article-byline .jr-byline-meta'));
    check(s + 'date rendered', meta.indexOf(longDate(p.publishedAt)) !== -1, meta);
    check(s + 'readTime rendered', meta.indexOf(p.readTime) !== -1, meta);

    /* The lead-gen surface is on every article, no exceptions. */
    check(s + 'assessment CTA present', !!doc.querySelector('.jr-cta a.btn'));
    eq(s + 'CTA points at the assessment',
      doc.querySelector('.jr-cta a.btn').getAttribute('href'), '/');
    check(s + 'share row present', doc.querySelectorAll('[data-share]').length === 3);
    check(s + 'copy-link present', !!doc.getElementById('jr-copy'));
    check(s + 'newsletter present', !!doc.getElementById('jr-article-form'));
    check(s + 'back link present',
      doc.querySelector('.jr-back').getAttribute('href') === '../journal.html');

    /* Written entries are indexable and carry their body; unwritten
       ones carry noindex and the pending block instead. Getting this
       backwards puts a thin page in the index. */
    var robots = doc.querySelector('meta[name="robots"]').content;
    var hasBody = !!p.body;
    var pending = !!doc.querySelector('.jr-body-pending');

    if (hasBody) {
      check(s + 'indexable', /^index/.test(robots), robots);
      check(s + 'no pending block', !pending);
      check(s + 'has Article JSON-LD', !!doc.querySelector('script[type="application/ld+json"]'));

      var paras = [].slice.call(doc.querySelectorAll('.jr-body p')).map(function (el) { return norm(el.textContent); });
      var heads = [].slice.call(doc.querySelectorAll('.jr-body h2')).map(function (el) { return norm(el.textContent); });
      var quotes = [].slice.call(doc.querySelectorAll('.jr-body blockquote')).map(function (el) {
        return norm(el.childNodes[0].textContent);
      });

      var wantParas = p.body.filter(function (b) { return b.type === 'para'; }).map(function (b) { return norm(b.text); });
      var wantHeads = p.body.filter(function (b) { return b.type === 'head'; }).map(function (b) { return norm(b.text); });
      var wantQuotes = p.body.filter(function (b) { return b.type === 'quote'; }).map(function (b) { return norm(b.text); });

      eq(s + 'body paragraphs', JSON.stringify(paras), JSON.stringify(wantParas));
      eq(s + 'body headings', JSON.stringify(heads), JSON.stringify(wantHeads));
      eq(s + 'body quotes', JSON.stringify(quotes), JSON.stringify(wantQuotes));
      check(s + 'pull quote uses .pull', wantQuotes.length === 0 || !!doc.querySelector('.jr-body blockquote.pull'));
    } else {
      check(s + 'noindex while unwritten', /noindex/.test(robots), robots);
      check(s + 'pending block shown', pending);
      check(s + 'no body paragraphs', doc.querySelectorAll('.jr-body p').length === 0);
    }
  }

  /* ---------- run ---------- */
  function report(err) {
    var out = {
      passed: passes,
      failed: failures.length,
      total: passes + failures.length,
      failures: failures
    };
    if (err) out.error = String(err);
    window.__journalResults = out;
    document.getElementById('out').textContent = JSON.stringify(out, null, 2);
  }

  checkModel();

  get('../journal.html')
    .then(function (doc) {
      checkIndex(doc);
      return Promise.all(POSTS.map(function (p) {
        return get('../journal/' + p.slug + '.html')
          .then(function (d) { checkArticle(p, d); })
          .catch(function (e) { check('article ' + p.slug + ': page loads', false, e.message); });
      }));
    })
    .then(function () { report(); })
    .catch(function (e) { report(e); });
})();
