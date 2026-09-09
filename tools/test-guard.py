#!/usr/bin/env python3
"""
Test the third boundary guard: the regex check on the way out.

This exists because the first two guards can be argued with. A system
prompt can be talked around and a schema only constrains shape, so the
last line of defence is a dumb pattern match that does not negotiate.
A dumb guard is only worth having if it is tested, and the first
version of it let two approval rulings straight through.

Run:  python tools/test-guard.py
"""

import json
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROMPTS = os.path.join(REPO, 'worker', 'prompts.json')

# Must be caught. Every one of these would be a real problem for a
# licensed general contractor if it reached an owner.
MUST_BLOCK = [
    'Budget about $180,000 per unit.',
    'Expect 250000 dollars for sitework.',
    'Plan on roughly $2.4M total.',
    'Costs run about 45k per pad.',
    'Allow another 30000 dollars for the septic.',
    'This usually takes 18 months from here.',
    'Allow 6 to 9 weeks for the review.',
    'Figure 90 days for the permit.',
    'You should open in 2028.',
    'Target an ADR of 250 and 60% occupancy.',
    'Your cap rate should land around seven.',
    'Expect a strong ROI on this one.',
    'Hays County will approve this use.',
    'They will not approve a septic system that size.',
    'The county will allow 40 units.',
    'Your permit will be granted.',
    'This will never be permitted.',
    'The variance will be denied.',
    'We guarantee that the use is fine.',
]

# Must survive. These are real lines from the templates and the engine.
# A guard that eats its own product is worse than no guard, because the
# reads quietly stop improving and nobody notices.
MUST_PASS = [
    'You are planning a glamping property of about 25 units on wooded land.',
    'You have land under contract.',
    'The thing most likely to stop a project like this is whether the county allows the use at all.',
    'A pre-application meeting is the cheapest way to find out, and you leave with the answer in writing.',
    'Ownership removes one uncertainty. The next job is proving what the ground, the jurisdiction, and the budget can support.',
    'Approvals are the open gate here. That is normal at your stage.',
    'You marked 8 answers not sure, which usually means the project is early rather than weak.',
    'You answered 32 of the 40 questions, and the answers come to 41 points out of 100.',
    'Property Details: 2 of 4.',
    'It is worth looking into zoning early.',
    'Water, sewer, power, and stormwater are still open.',
    'Nothing open here. This is the part of the project you can build on.',
    'The work in front of you is the groundwork.',
    'Keep the land position in writing as you go.',
]


def main():
    d = json.load(open(PROMPTS, encoding='utf-8'))
    pats = [re.compile(p, re.I) for p in d['forbidden']['patterns']]

    def blocked(t):
        return any(p.search(t) for p in pats)

    failures = []
    for t in MUST_BLOCK:
        if not blocked(t):
            failures.append('LEAKED   ' + t)
    for t in MUST_PASS:
        if blocked(t):
            failures.append('FALSE +  ' + t)

    total = len(MUST_BLOCK) + len(MUST_PASS)
    if failures:
        for f in failures:
            print(f)
        print(str(len(failures)) + ' of ' + str(total) + ' checks FAILED')
        sys.exit(1)
    print(str(total) + ' guard checks pass  (' + str(len(MUST_BLOCK)) +
          ' blocked, ' + str(len(MUST_PASS)) + ' allowed through)')


if __name__ == '__main__':
    main()
