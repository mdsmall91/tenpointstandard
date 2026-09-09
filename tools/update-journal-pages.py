#!/usr/bin/env python3
"""
Bring the three published Journal articles onto the v3 chrome.

Five changes, applied identically to every article so the pages
cannot drift from each other:

  1. Load styles/pages.css, which carries the masthead and the
     standing call-to-action block.
  2. Full site nav in the header, and the header CTA points at The
     Read rather than the assessment. The ninety second version is
     the right first ask of somebody who just finished an article.
  3. The masthead under the header, static in the HTML.
  4. The standing CTA block, same words on every article and on the
     index. Repetition is what makes it stick. On articles over a
     thousand words it also appears once inline, at roughly the
     sixty percent mark, between two top-level sections.
  5. Back link and footer point at the new URLs, and every asset is
     pinned to ?v=10 alongside the rest of the site.

Run:  python tools/update-journal-pages.py
"""

import io
import os
import re

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ['journal/nature-first.html', 'journal/built-for-the-stay.html',
         'journal/entitlements.html']

MASTHEAD = """
  <div class="tp-masthead">
    <div class="tp-masthead-inner">
      <p>Published by <strong>Ten Point Services</strong>. We are a general contractor. We build campgrounds, RV resorts, glamping properties, and recreation destinations across the United States.</p>
    </div>
  </div>
"""

NAV = """      <div class="jr-header-right">
        <nav class="tp-nav" aria-label="Primary">
          <a href="/" class="active">Field Journal</a>
          <a href="/read/">The Read</a>
          <a href="/standard/">The Standard</a>
          <a href="/about/">About</a>
        </nav>
        <a class="btn accent sm jr-header-cta" href="/read/">See where you are</a>
      </div>"""

CTA = """        <div class="tp-cta">
          <div>
            <div class="tp-cta-eyebrow">The Ten Point Standard</div>
            <h3>Where does your project actually stand?</h3>
            <p>Ninety seconds. Ten questions, mostly pictures. No email needed.</p>
          </div>
          <a class="btn lg accent" href="/read/">See where you are</a>
        </div>"""

CTA_INLINE = """
        <div class="tp-cta tp-cta-inline">
          <div>
            <div class="tp-cta-eyebrow">The Ten Point Standard</div>
            <h3>Where does your project actually stand?</h3>
            <p>Ninety seconds. Ten questions, mostly pictures. No email needed.</p>
          </div>
          <a class="btn accent" href="/read/">See where you are</a>
        </div>
"""

FOOTER = """  <footer class="tp-footer">
    <div class="tp-footer-inner">
      <span>&copy; 2026 TEN POINT SERVICES &middot; ALL RIGHTS RESERVED</span>
      <span class="tp-footer-nav">
        <a href="/">FIELD JOURNAL</a>
        <a href="/read/">THE READ</a>
        <a href="/standard/">THE STANDARD</a>
        <a href="/about/">ABOUT</a>
      </span>
      <span>THE TEN POINT STANDARD</span>
    </div>
  </footer>"""


def word_count(html):
    body = re.sub(r'<[^>]+>', ' ', html)
    return len(body.split())


def apply(path):
    p = os.path.join(REPO, path)
    s = io.open(p, encoding='utf-8').read()
    before = s

    # 1. pages.css, ahead of journal.css so the article sheet still wins.
    if 'styles/pages.css' not in s:
        s = s.replace('<link rel="stylesheet" href="../styles/journal.css',
                      '<link rel="stylesheet" href="../styles/pages.css?v=10">\n'
                      '<link rel="stylesheet" href="../styles/journal.css', 1)

    # 2. header nav
    s = re.sub(r'      <div class="jr-header-right">.*?\n      </div>', NAV, s,
               count=1, flags=re.S)

    # 3. masthead, directly after the header
    if 'tp-masthead' not in s:
        s = s.replace('  </header>\n', '  </header>\n' + MASTHEAD, 1)

    # 4. the standing CTA, replacing the old .jr-cta block
    s = re.sub(r'        <div class="jr-cta">.*?\n        </div>', CTA, s,
               count=1, flags=re.S)

    # 4b. one inline CTA on the long articles, between two <h2> sections at
    #     roughly sixty percent of the way down.
    if word_count(s) > 1000 and 'tp-cta-inline' not in s:
        heads = [m.start() for m in re.finditer(r'\n        <h2', s)]
        if len(heads) >= 3:
            at = heads[int(len(heads) * 0.6)]
            s = s[:at] + '\n' + CTA_INLINE + s[at:]

    # 5. links and cache-busting
    s = s.replace('href="../journal.html"', 'href="/"')
    s = s.replace('href="/journal.html"', 'href="/"')
    s = re.sub(r'(\.\./(?:config|journal-core|journal-article)\.js)\?v=\d+', r'\1?v=10', s)
    s = re.sub(r'(\.\./styles/journal\.css)\?v=\d+', r'\1?v=10', s)
    s = re.sub(r'<footer class="tp-footer">.*?</footer>', FOOTER, s, count=1, flags=re.S)

    # analytics.js loads before journal-core.js so one GA wiring serves the
    # whole site and journal-core defers to it.
    if 'analytics.js' not in s:
        s = s.replace('<script src="../journal-core.js',
                      '<script src="../analytics.js?v=10"></script>\n'
                      '<script src="../journal-core.js', 1)

    if s != before:
        io.open(p, 'w', encoding='utf-8').write(s)
        print('updated ' + path + '  (' + str(word_count(s)) + ' words'
              + (', inline CTA' if 'tp-cta-inline' in s else '') + ')')
    else:
        print('no change ' + path)


for page in PAGES:
    apply(page)
