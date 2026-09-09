#!/usr/bin/env python3
"""
Rename the two experiences: Quick Scan and Full Assessment.

Why the names changed. "The Read" and "The Full Standard" both sounded
like the methodology rather than like the thing you were about to do,
and a first-time visitor could not tell them apart without reading a
paragraph. "Quick Scan" and "Full Assessment" say what they are.

THE URLS DO NOT CHANGE. /read/ and /standard/ stay exactly as they are.
Labels, titles, metadata, structured data and copy change; routes do
not. Renaming a route buys nothing here and costs the search signals
those paths have started to earn.

WHAT MUST NOT BE RENAMED. "The Ten Point Standard" is the name of the
methodology and of the site itself. The replacements below are ordered
longest first so that the phrases containing it are consumed before any
shorter pattern can reach it, and there is an assertion at the end.

Run:  python tools/rename-lanes.py
"""

import io
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Longest and most specific first. Order is load-bearing.
PAIRS = [
    # --- calls to action -------------------------------------------
    ('Take The Read instead', 'Start the Quick Scan instead'),
    ('Take The Read', 'Start the Quick Scan'),
    ('Start the full Standard', 'Continue to the Full Assessment'),
    ('Take the full Standard', 'Start the Full Assessment'),
    ('Take the Full Standard first', 'Start the Full Assessment first'),
    ('Take the Full Standard', 'Start the Full Assessment'),

    # --- lane two --------------------------------------------------
    ('The Full Standard is', 'The Full Assessment is'),
    ('the full Standard', 'the Full Assessment'),
    ('The Full Standard', 'Full Assessment'),
    ('Full Standard', 'Full Assessment'),

    # --- lane one --------------------------------------------------
    ('The Read is', 'The Quick Scan is'),
    ('The Read asks', 'The Quick Scan asks'),
    ('Your read', 'Your Project Scan'),
    ('The Read', 'Quick Scan'),
    ('THE READ', 'QUICK SCAN'),
    ('The Standard', 'Full Assessment'),
    ('THE STANDARD', 'FULL ASSESSMENT'),
]

# Files that carry visible copy or metadata. Deliberately not the whole
# tree: the tools and the docs keep their own history.
TARGETS = [
    'index.html', 'read/index.html', 'standard/index.html', 'about/index.html',
    'consultation/index.html', 'glamping-show/index.html', 'scorecard/index.html',
    'journal/nature-first.html', 'journal/built-for-the-stay.html',
    'journal/entitlements.html',
    'read.js', 'readmodel.js', 'app.js', 'scorecard.js', 'consult.js',
    'tests/journal-tests.js',
]


def main():
    total = 0
    for rel in TARGETS:
        p = os.path.join(REPO, rel)
        if not os.path.isfile(p):
            print('  missing ' + rel)
            continue
        s = io.open(p, encoding='utf-8').read()
        before = s
        n = 0
        for old, new in PAIRS:
            n += s.count(old)
            s = s.replace(old, new)
        if s != before:
            # The one thing this script must never break.
            if 'Ten Point Quick Scan' in s or 'Ten Point Full Assessment' in s:
                sys.exit('ABORT: a replacement reached "The Ten Point Standard" in ' + rel)
            io.open(p, 'w', encoding='utf-8').write(s)
            print('  ' + str(n).rjust(3) + '  ' + rel)
            total += n
    print(str(total) + ' replacements')


if __name__ == '__main__':
    main()
