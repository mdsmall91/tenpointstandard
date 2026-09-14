#!/usr/bin/env python3
"""
Walk every page and check every internal link and asset against the
running preview server.

The site has no build step, so nothing catches a typo in an href. This
does, and it is the cheapest guard against the class of bug that only
shows up as a 404 for a visitor.

Start the preview first, then:  python tools/check-links.py
"""

import io
import os
import re
import sys
import urllib.request

# The preview port. It moved once, to escape a browser cache that
# would not let go of the old build, so it is read from the environment
# with the current default rather than pinned.
BASE = os.environ.get('TP_PREVIEW', 'http://localhost:4174')
SKIP_PREFIX = ('http', 'mailto:', 'tel:', 'data:', '//')


# Directories that contain HTML but are not the site. node_modules
# arrived with the Worker's dependencies and brought wrangler's own
# local UI with it, which is a few dozen pages of someone else's
# markup pointing at /cdn-cgi/ paths this server has never heard of.
# Crawling it turns a clean run into forty phantom 404s.
NOT_THE_SITE = ('.git', 'node_modules', '.wrangler', 'dist')


def pages():
    out = []
    for dirpath, dirnames, filenames in os.walk('.'):
        dirnames[:] = [d for d in dirnames if d not in NOT_THE_SITE]
        if any(part in NOT_THE_SITE for part in dirpath.replace(os.sep, '/').split('/')):
            continue
        for f in filenames:
            if f.endswith('.html'):
                out.append(os.path.join(dirpath, f).replace(os.sep, '/').lstrip('./'))
    return sorted(out)


def check(url):
    try:
        return urllib.request.urlopen(BASE + url, timeout=5).getcode()
    except Exception as e:
        return getattr(e, 'code', 'ERR')


def main():
    seen = set()
    bad = {}
    files = pages()
    for page in files:
        text = io.open(page, encoding='utf-8').read()
        folder = os.path.dirname(page)
        base = '/' + folder + '/' if folder else '/'
        for m in re.finditer(r'(?:href|src)="([^"#][^"]*)"', text):
            u = m.group(1)
            if u.startswith(SKIP_PREFIX):
                continue
            if u.startswith('/'):
                target = u
            else:
                target = os.path.normpath(base + u).replace(os.sep, '/')
            target = target.split('?')[0]
            key = (page, target)
            if key in seen:
                continue
            seen.add(key)
            code = check(target)
            if code != 200:
                bad.setdefault(page, []).append(str(code) + '  ' + target)

    print(str(len(seen)) + ' internal links checked across ' + str(len(files)) + ' pages')
    if bad:
        for page in sorted(bad):
            print('  ' + page)
            for line in bad[page]:
                print('      ' + line)
        sys.exit(1)
    print('  all 200')


if __name__ == '__main__':
    main()
