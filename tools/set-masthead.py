#!/usr/bin/env python3
"""
Set the masthead paragraph on every page from one place.

The masthead is static HTML on every page rather than injected, because a
crawler that runs no JavaScript still has to learn whose site this is.
That means the same sentence exists in eleven files, and this script is
what stops those eleven copies from drifting apart. Edit MASTHEAD here,
run it, and every page follows.

Run:  python tools/set-masthead.py
"""

import io
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# The one place this copy lives. Matt's wording, September 9 2026.
MASTHEAD = (
    '<strong>Ten Point Services</strong> is a general contractor that works '
    'across the United States. From initial design through construction we '
    'partner with you to build unique nature based hospitality resorts, and '
    'help you maximize the value of your property through strategic '
    'renovations and expansions.'
)

BLOCK = re.compile(
    r'(<div class="tp-masthead">\s*<div class="tp-masthead-inner">\s*<p>).*?(</p>)',
    re.S,
)


def main():
    changed = []
    for dirpath, dirnames, filenames in os.walk(REPO):
        if '.git' in dirpath:
            continue
        for fn in filenames:
            if not fn.endswith('.html'):
                continue
            p = os.path.join(dirpath, fn)
            s = io.open(p, encoding='utf-8').read()
            if 'tp-masthead' not in s:
                continue
            t = BLOCK.sub(lambda m: m.group(1) + MASTHEAD + m.group(2), s)
            if t != s:
                io.open(p, 'w', encoding='utf-8').write(t)
                changed.append(os.path.relpath(p, REPO).replace(os.sep, '/'))

    if not changed:
        print('no page changed: the masthead already matches')
    else:
        for c in sorted(changed):
            print('updated ' + c)
    print(str(len(changed)) + ' of the pages carrying a masthead were rewritten')


if __name__ == '__main__':
    main()
