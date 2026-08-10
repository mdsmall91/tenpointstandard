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

  /* A draft is an entry whose copy is not written. It is held back
     entirely: no tile, no page, no sitemap or feed entry. Only
     published entries exist as far as the site is concerned. */
  function published() { return POSTS.filter(function (p) { return !p.draft; }); }

  /* ---------- model-only checks ---------- */
  function checkModel() {
    var featured = POSTS.filter(function (p) { return p.featured; });
    eq('exactly one featured entry', featured.length, 1);
    check('featured entry is first', POSTS[0] && POSTS[0].featured === true);
    check('featured entry is published', POSTS[0] && !POSTS[0].draft);
    check('at least one published entry', published().length >= 1, published().length);

    /* Body copy lives only in the page now, so there is nothing to
       diff here — the page-level checks assert it is substantial. */
    POSTS.forEach(function (p) {
      check('no stale body array: ' + p.slug, p.body === undefined);
    });

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
      /* Name and credential are required; bio is optional, because an
         author who has not written one gets no bio rather than an
         invented one. */
      check('author is inline: ' + p.slug, !!(p.author && p.author.name && p.author.credential));
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
    eq('index: one tile per published post', tiles.length, published().length);

    /* A draft must leave no trace on the index. */
    POSTS.filter(function (p) { return p.draft; }).forEach(function (p) {
      check('index: no tile for draft ' + p.slug,
        !doc.querySelector('a[href="journal/' + p.slug + '.html"]'));
    });

    /* With only the featured entry published there is nothing to put
       in the grid, so both it and the filter ship hidden; journal.js
       reveals them once a second tile exists. */
    var gridWrap = doc.getElementById('jr-grid-wrap');
    var filterBar = doc.getElementById('jr-filter');
    var expectHidden = published().length <= 1;
    eq('index: grid hidden while single entry', gridWrap.hasAttribute('hidden'), expectHidden);
    eq('index: filter hidden while single entry', filterBar.hasAttribute('hidden'), expectHidden);

    published().forEach(function (p) {
      var link = doc.querySelector('.jr-tile a[href="journal/' + p.slug + '.html"]');
      check('index: tile exists for ' + p.slug, !!link);
      if (!link) return;

      var tile = link.closest('.jr-tile');
      eq('index: tile tag ' + p.slug, tile.getAttribute('data-tag'), tagSlug(p.tag));
      eq('index: tile title ' + p.slug, norm(link.textContent), p.title);
      eq('index: tile dek ' + p.slug, norm(tile.querySelector('.jr-tile-dek').textContent), p.dek);
      eq('index: tile author ' + p.slug, norm(tile.querySelector('.jr-byline-name').textContent), p.author.name);
      eq('index: tile credential ' + p.slug, norm(tile.querySelector('.jr-byline-cred').textContent), p.author.credential);
      eq('index: tile company ' + p.slug,
        tile.querySelector('.jr-byline-org') ? norm(tile.querySelector('.jr-byline-org').textContent) : null,
        p.author.company || null);
      check('index: tile has no author photo ' + p.slug, !tile.querySelector('.jr-avatar'));
      eq('index: tile readTime ' + p.slug, norm(tile.querySelector('.jr-byline-meta').textContent), p.readTime);

      /* The media box carries the post's aspect ratio inline so the
         masonry columns cannot reflow once images land. */
      var media = tile.querySelector('.jr-media');
      var ratio = (media.getAttribute('style') || '').replace(/\s|;$/g, '');
      eq('index: tile aspect ' + p.slug, ratio, 'aspect-ratio:' + p.heroAspect);

      /* An entry with a hero shows the photo; one without keeps the
         captioned placeholder. Never a bare box. */
      var im = media.querySelector('img');
      if (p.hero) {
        check('index: tile shows the photo ' + p.slug, !!im);
        if (im) {
          eq('index: tile img src ' + p.slug, im.getAttribute('src'), p.hero);
          eq('index: tile img alt ' + p.slug, im.getAttribute('alt'), p.heroAlt);
          /* Explicit dimensions are what stop the columns reflowing
             as images decode. */
          check('index: tile img has dimensions ' + p.slug,
            !!im.getAttribute('width') && !!im.getAttribute('height'));
        }
      } else {
        check('index: tile keeps its placeholder ' + p.slug, !!media.querySelector('.jr-media-note'));
      }

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
    eq('index: h1', text(doc, 'h1'), 'Field Journal');
    eq('index: no hero meta column', doc.querySelector('.tp-hero-meta'), null);
    eq('index: newsletter posts to the shared handler',
      !!doc.getElementById('jr-dispatch-form'), true);
    check('index: subscribe eyebrow matches the assessment treatment',
      !!doc.querySelector('.jr-dispatch .eyebrow.dotted'));
    check('index: declares the RSS feed',
      !!doc.querySelector('link[rel="alternate"][type="application/rss+xml"]'));
    check('index: header carries no wordmark', !doc.querySelector('.jr-wordmark'));

    /* The header nav is one link — Field Journal — sitting directly
       beside the CTA. No Field Guide link, no Ten Point Services
       link. */
    var navLinks = [].slice.call(doc.querySelectorAll('.tp-nav a')).map(function (a) { return norm(a.textContent); });
    eq('index: nav is Field Journal only', JSON.stringify(navLinks), JSON.stringify(['Field Journal']));
    check('index: nav sits with the CTA',
      !!doc.querySelector('.jr-header-right .tp-nav') && !!doc.querySelector('.jr-header-right .jr-header-cta'));
  }

  /* ---------- feed ----------
     An RSS-driven campaign is what turns "notify me" into an actual
     send, so the feed drifting from the site breaks the subscription
     silently rather than visibly. */
  function checkFeed(doc) {
    var items = [].slice.call(doc.querySelectorAll('item'));
    eq('feed: one item per published post', items.length, published().length);

    published().forEach(function (p) {
      var url = 'https://tenpointstandard.com/journal/' + p.slug + '.html';
      var item = items.filter(function (i) {
        return norm(i.querySelector('link').textContent) === url;
      })[0];
      check('feed: item for ' + p.slug, !!item);
      if (!item) return;
      eq('feed: title ' + p.slug, norm(item.querySelector('title').textContent), p.title);
      eq('feed: description ' + p.slug, norm(item.querySelector('description').textContent), p.dek);
      /* RFC-822, not ISO. An ISO date here is the usual reason an RSS
         campaign silently never fires. */
      check('feed: pubDate is RFC-822 ' + p.slug,
        /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} [+-]\d{4}$/
          .test(norm(item.querySelector('pubDate').textContent)),
        norm(item.querySelector('pubDate').textContent));
    });

    POSTS.filter(function (p) { return p.draft; }).forEach(function (p) {
      check('feed: draft absent ' + p.slug,
        items.every(function (i) { return i.querySelector('link').textContent.indexOf(p.slug) === -1; }));
    });
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
    eq(s + 'company', text(doc, '.jr-article-byline .jr-byline-org'), p.author.company || null);
    check(s + 'no author photo anywhere', !doc.querySelector('.jr-avatar'));

    var figImg = doc.querySelector('.jr-figure img');
    if (p.hero) {
      check(s + 'hero photo present', !!figImg);
      if (figImg) {
        eq(s + 'hero src', figImg.getAttribute('src'), '../' + p.hero);
        eq(s + 'hero alt', figImg.getAttribute('alt'), p.heroAlt);
        check(s + 'hero has dimensions',
          !!figImg.getAttribute('width') && !!figImg.getAttribute('height'));
        /* The hero is the largest thing above the fold — lazy-loading
           it would delay the one image that should load first. */
        check(s + 'hero is not lazy', figImg.getAttribute('loading') !== 'lazy');
      }
    } else {
      check(s + 'hero keeps its placeholder', !!doc.querySelector('.jr-figure .jr-media-note'));
    }
    eq(s + 'caption', text(doc, '.jr-figure figcaption'), p.heroCaption);
    /* Bio is optional — an author card without one renders no bio
       paragraph rather than an invented sentence. */
    eq(s + 'bio', text(doc, '.jr-author-bio'), p.author.bio || null);
    eq(s + 'canonical',
      doc.querySelector('link[rel="canonical"]').getAttribute('href'),
      'https://tenpointstandard.com/journal/' + p.slug + '.html');
    eq(s + 'description',
      doc.querySelector('meta[name="description"]').content,
      p.metaDescription || p.dek);
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

    /* Only published entries have pages at all, so every page that
       exists must be indexable and carry its copy. */
    var robots = doc.querySelector('meta[name="robots"]').content;
    check(s + 'indexable', /^index/.test(robots), robots);
    check(s + 'has Article JSON-LD', !!doc.querySelector('script[type="application/ld+json"]'));
    check(s + 'header carries no wordmark', !doc.querySelector('.jr-wordmark'));

    /* The body is not diffed against posts.js any more, so guard the
       thing that actually matters: a published page must carry real
       copy. An empty or stub body would otherwise sail through with
       correct metadata and reach the index. */
    var body = doc.querySelector('.jr-body');
    check(s + 'has a body', !!body);
    if (!body) return;

    var paras = body.querySelectorAll('p').length;
    var words = norm(body.textContent).split(' ').length;
    check(s + 'body has paragraphs', paras >= 3, paras);
    check(s + 'body is substantial', words >= 300, words + ' words');

    /* Read time should be within sight of the actual length, at a
       normal 200-250 wpm. Catches a copy/paste byline. */
    var claimed = parseInt(p.readTime, 10);
    var estimate = words / 225;
    check(s + 'readTime is plausible',
      claimed >= Math.floor(estimate * 0.5) && claimed <= Math.ceil(estimate * 2),
      'claims ' + claimed + ' min for ' + words + ' words');

    /* Any pull quote must use the shared .pull component. */
    var quotes = [].slice.call(body.querySelectorAll('blockquote'));
    check(s + 'pull quotes use .pull',
      quotes.every(function (q) { return q.classList.contains('pull'); }));

    /* Every source citation needs a reachable-looking link. */
    var sources = [].slice.call(doc.querySelectorAll('.jr-sources li'));
    check(s + 'each source has a link',
      sources.every(function (li) { return !!li.querySelector('a[href^="https://"]'); }),
      sources.length + ' sources');
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

  Promise.all([
    get('../journal.html').then(checkIndex),

    fetch('../feed.xml').then(function (r) { return r.text(); }).then(function (t) {
      checkFeed(new DOMParser().parseFromString(t, 'text/xml'));
    }),

    Promise.all(published().map(function (p) {
      return get('../journal/' + p.slug + '.html')
        .then(function (d) { checkArticle(p, d); })
        .catch(function (e) { check('article ' + p.slug + ': page loads', false, e.message); });
    })),

    /* A draft must have no page. If one is still on disk it will be
       orphaned — reachable by URL, absent from the index, and
       invisible to anyone reviewing the site. */
    Promise.all(POSTS.filter(function (p) { return p.draft; }).map(function (p) {
      return fetch('../journal/' + p.slug + '.html').then(function (r) {
        check('draft ' + p.slug + ': has no page', r.status === 404, 'HTTP ' + r.status);
      });
    }))
  ])
    .then(function () { report(); })
    .catch(function (e) { report(e); });
})();
