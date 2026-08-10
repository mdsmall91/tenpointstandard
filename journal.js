'use strict';

/* =============================================================
   THE JOURNAL — INDEX BEHAVIOR
   The tiles are already in the HTML. This script only filters
   them, keeps the URL honest, and restores where you were.

   Nothing here builds a tile. That is the point: the grid is
   fully crawlable with JS off, which is the lesson index.html
   learned the hard way (see README, "SEO / indexing").
   ============================================================= */

var JR_STORE = 'tp-journal-return';

(function () {
  jrInitGA();

  var chips = [].slice.call(document.querySelectorAll('.jr-chip'));
  var tiles = [].slice.call(document.querySelectorAll('.jr-tile'));
  var empty = document.getElementById('jr-empty');
  var grid = document.getElementById('jr-grid');
  var gridWrap = document.getElementById('jr-grid-wrap');
  var filterBar = document.getElementById('jr-filter');

  /* The filter and the grid ship hidden and are revealed here, so
     that a Journal with a single article shows just the featured
     entry rather than a seven-chip filter over an empty grid. Both
     come back on their own the moment a second tile is added —
     there is no flag anyone has to remember to flip. */
  var hasGrid = tiles.length > 1;
  if (hasGrid) {
    if (gridWrap) gridWrap.hidden = false;
    if (filterBar) filterBar.hidden = false;
  }

  /* ---------- filtering ---------- */
  function apply(tag, opts) {
    var shown = 0;
    for (var i = 0; i < tiles.length; i++) {
      /* Under "All entries" the featured post is suppressed in the
         grid — it is already the hero above. Pick its own tag and
         it rejoins the grid, so the tag view is complete. */
      var match = tag === 'all'
        ? !tiles[i].hasAttribute('data-featured')
        : tiles[i].getAttribute('data-tag') === tag;
      tiles[i].hidden = !match;
      if (match) shown++;
    }

    for (var c = 0; c < chips.length; c++) {
      var on = chips[c].getAttribute('data-tag') === tag;
      chips[c].setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    /* Only meaningful once the grid is in play. With a single entry
       there is no filter to miss with, so "no entries under this
       tag" must never appear. */
    if (hasGrid) {
      if (empty) empty.hidden = shown > 0;
      if (grid) grid.hidden = shown === 0;
    }

    /* Bare /journal.html is "All". Anything else carries ?tag=.
       replaceState on the initial pass so the back button still
       leaves the page rather than stepping through filters. */
    var url = tag === 'all'
      ? location.pathname
      : location.pathname + '?tag=' + encodeURIComponent(tag);
    if (opts && opts.replace) history.replaceState({ tag: tag }, '', url);
    else history.pushState({ tag: tag }, '', url);

    if (!opts || !opts.silent) jrTrack('journal_filter', { tag: tag });
  }

  for (var i = 0; i < chips.length; i++) {
    chips[i].addEventListener('click', function () {
      apply(this.getAttribute('data-tag'), {});
      /* Scroll the filter bar back under the header so the first
         row of results is not hidden behind the sticky chips. */
      var bar = document.querySelector('.jr-filter');
      if (bar && bar.getBoundingClientRect().top < 0) {
        window.scrollTo({ top: bar.offsetTop - 67, behavior: 'auto' });
      }
    });
  }

  window.addEventListener('popstate', function (e) {
    apply((e.state && e.state.tag) || readTagFromUrl(), { replace: true, silent: true });
  });

  function readTagFromUrl() {
    var m = /[?&]tag=([^&]+)/.exec(location.search);
    return m ? decodeURIComponent(m[1]) : 'all';
  }

  function isKnownTag(tag) {
    if (tag === 'all') return true;
    for (var c = 0; c < chips.length; c++) {
      if (chips[c].getAttribute('data-tag') === tag) return true;
    }
    return false;
  }

  /* ---------- return-from-article restore ---------- */
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(JR_STORE) || 'null'); } catch (e) {}

  /* An explicit ?tag= in the URL always wins over the stored one:
     a shared link must show what it says it shows. */
  var urlTag = readTagFromUrl();
  var startTag = urlTag !== 'all' ? urlTag : (saved && saved.tag) || 'all';
  if (!isKnownTag(startTag)) startTag = 'all';

  apply(startTag, { replace: true, silent: true });

  if (saved && typeof saved.y === 'number' && saved.y > 0) {
    /* We restore scroll ourselves, so take it off the browser.
       Left on "auto" the browser resets to 0 after our callback
       and the restore silently does nothing. */
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    var target = saved.y;
    var restore = function () { window.scrollTo(0, target); };

    /* Restore at each stage the page settles: the masonry columns
       need the media boxes measured, the web fonts reflow the tiles
       when they land, and images (once there are any) land last.
       Each pass is a no-op if nothing moved.

       Every stage calls restore() directly and then again inside a
       frame. The direct call is the one that matters: rAF does not
       fire in a background tab, so a restore gated only on it would
       silently do nothing for anyone who opened the article in a new
       tab and came back. The rAF pass just catches layout that
       shifts within the same frame. */
    var settle = function () { restore(); requestAnimationFrame(restore); };

    settle();
    window.addEventListener('load', settle);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
  }
  try { sessionStorage.removeItem(JR_STORE); } catch (e) {}

  /* Remember position and filter on the way into an article. */
  function remember() {
    try {
      sessionStorage.setItem(JR_STORE, JSON.stringify({
        tag: readTagFromUrl(),
        y: window.scrollY || window.pageYOffset || 0
      }));
    } catch (e) {}
  }
  var links = [].slice.call(document.querySelectorAll('a[data-journal-link]'));
  for (var L = 0; L < links.length; L++) links[L].addEventListener('click', remember);

  /* ---------- newsletter ---------- */
  jrBindSubscribe(document.getElementById('jr-dispatch-form'));
})();
