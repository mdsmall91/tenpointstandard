#!/usr/bin/env python3
"""Rewrite the boundary regex list in worker/prompts.json. Run once.

Written as a file rather than a heredoc because Bash heredocs strip
backslashes on this machine, and every one of these patterns is
backslashes.
"""

import io
import json
import os

B = chr(92)   # a single backslash, kept out of the literals below

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(REPO, 'worker', 'prompts.json')

# The patterns, as regex source. json.dump handles the escaping.
PATTERNS = [
    # money
    B + '$' + B + 's?[0-9]',
    '[0-9][0-9,.]*' + B + 's*(dollars|usd|k per|per site|per unit|per pad)',
    # durations and dates
    B + 'b[0-9]+' + B + 's*(to|-|and)?' + B + 's*[0-9]*' + B + 's*(days|weeks|months|years)' + B + 'b',
    B + 'b(20[2-9][0-9])' + B + 'b',
    # yield and return
    B + 'b(roi|irr|cap rate|occupancy rate|adr|revpar)' + B + 'b',
    # rulings on approvals. Broad on purpose: the subject of the
    # sentence does not matter, only that a future approval is being
    # asserted. "whether the county allows the use" is a question and
    # survives; "the county will allow" is a ruling and does not.
    B + 'bwill' + B + 's+(not' + B + 's+|never' + B + 's+)?(be' + B + 's+)?'
    '(approv|allow|permit|den|reject|grant)(e[ds]?|ing|s)?' + B + 'b',
    B + 'b(guarantee[ds]?|guaranteeing)' + B + 'b',
]

s = io.open(p, encoding='utf-8').read()
start = s.index('"patterns": [')
end = s.index(']', start) + 1
body = ',\n      '.join(json.dumps(x) for x in PATTERNS)
s = s[:start] + '"patterns": [\n      ' + body + '\n    ]' + s[end:]
io.open(p, 'w', encoding='utf-8').write(s)

d = json.load(open(p, encoding='utf-8'))
print('prompts.json valid. ' + str(len(d['forbidden']['patterns'])) + ' guard patterns:')
for x in d['forbidden']['patterns']:
    print('   ' + x)
