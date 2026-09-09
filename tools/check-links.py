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

BASE = 'http://localhost:4173'
SKIP_PREFIX = ('http', 'mailto:', 'tel:', 'data:', '//')


def pages():
    out = []
    for dirpath, dirnames, filenames in os.walk('.'):
        if '.git' in dirpath:
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
