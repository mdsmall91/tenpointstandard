#!/usr/bin/env python3
"""Remove the leftover half of the old patterns array. Run once."""

import io
import json
import os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(REPO, 'worker', 'prompts.json')
lines = io.open(p, encoding='utf-8').read().split('\n')

# Find the first closing bracket of the new patterns array, then drop
# everything up to and including the stale second one.
start = next(i for i, l in enumerate(lines) if '"patterns": [' in l)
first_close = next(i for i in range(start, len(lines)) if lines[i].strip() == ']')
second_close = next(i for i in range(first_close + 1, len(lines)) if lines[i].strip() == ']')

kept = lines[:first_close + 1] + lines[second_close + 1:]
io.open(p, 'w', encoding='utf-8').write('\n'.join(kept))

d = json.load(open(p, encoding='utf-8'))
print('prompts.json valid again. ' + str(len(d['forbidden']['patterns'])) + ' guard patterns:')
for x in d['forbidden']['patterns']:
    print('   ' + x)
print()
print('tasks: ' + ', '.join(sorted(d['tasks'])))
