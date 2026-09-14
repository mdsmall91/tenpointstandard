# Quick Scan — proposed rebuild

Nothing in this document is built. You asked for the proposal first.

---

## 1. You were right about the land page

You said the land answer came back the same whatever you typed, and
that the site was not telling you the truth. It was not.

`readmodel.js:407` `extractLocal()` is a keyword matcher, not a reader.
For the land question it fires on exactly sixteen words:

| It sets | only if your sentence contains |
| --- | --- |
| wooded | wooded, trees, forest |
| water | waterfront, on the lake/river/water, lakefront, riverfront |
| rocky | ridge, rocky, bluff, mesa, hillside, canyon |
| open | pasture, open ground/field/land, meadow, prairie |

Type "rolling hill country with a creek through the middle" and it
matches nothing, so nothing is pre-filled and the land page shows its
default — identical every time. Same for "scrub", "flat", "sandy",
"caliche", "oaks and cedar", "old ranch".

The AI layer that would actually read the sentence is switched **off in
production**: `config.js:51`, `MODEL_PROXY_URL: ''`. So on the live site
there is no reading at all. Thirty-odd regexes, and silence when they
miss.

The dishonest part is not the miss. It is that the page says
**"We picked this up from what you wrote"** on the fields it did match,
which invites you to believe the whole intake was read. Whatever else
we do below, that claim comes out or gets earned.

---

## 2. What the Quick Scan should be instead

Your direction: stop asking what they are building, start prompting
higher-level thinking — who are you building for, what experience are
they looking for, what makes the property special.

The Experience Builder cards are already that product. Twelve cards,
each a photograph carrying one question, flipping to an exercise. The
Quick Scan should be a short run of those cards, in the same card
language as the Full Assessment.

### Proposed: six cards, drawn from the deck

| # | Card | The question on the front |
| --- | --- | --- |
| 1 | Target Guest | Who discovers their perfect escape at your resort? |
| 2 | The Invitation | What longing are you answering? |
| 3 | Authentic Place | How does your land shape your story? |
| 4 | Signature Experiences | What are your unique experiences no one else offers? |
| 5 | Forever Memory | What moment will they remember in 10 years? |
| 6 | Return Journey | What whispers "come back"? |

Six, not twelve, because ninety seconds is the promise. The other six —
Unique Promise, Arrival Magic, The 'Wow' Moment, Real Connections,
Sensory Symphony, Epic Stories — are the charette, not the website.

**"What are you building?" is gone**, as you asked, and Park and
Recreation with it. Nothing in this set asks about units, type, or
count.

### How it asks

These are not yes/no questions, so the tap-a-photograph mechanic does
not carry over unchanged. Proposed: each card offers three or four
**written positions** to choose from, not right answers — the way the
strategy card exercises pose it. Choosing is fast; the value is that
choosing forces the thinking. A free-text box under each, optional.

Example, Target Guest:
- "Somebody escaping a city week they are sick of"
- "A family building a tradition they will repeat"
- "A traveller who wants the place, not the room"
- "I do not know yet, and that is the honest answer"

The fourth option is on every card on purpose. "I do not know yet" is
the most useful thing a Quick Scan can surface, and it is the line into
a conversation with you.

---

## 3. The thing I need you to decide

**The Quick Scan currently feeds the Full Assessment.** Anything it
establishes gets carried into the forty questions and marked "From your
Quick Scan", which is how somebody skips a quarter of the assessment for
having done the first lane.

Experience questions do not map onto the forty. "Who are you building
for" does not answer "do you have a legal boundary and a plan of
current site conditions". So the carry-forward either goes away, or it
keeps working off a much smaller set.

Three ways to go:

**A. The Quick Scan stops feeding the assessment.** It becomes a
standalone thinking prompt that ends in a written reflection and an
invitation to talk. Cleanest, truest to what you described. Cost: the
"we already filled in ten of your forty" reward disappears.

**B. Six experience cards, plus two quiet facts.** The six above, then
two low-key questions (where the land is, and where you are in the
process) that still carry. Keeps the reward. Cost: two questions that
are not in the spirit of the rest.

**C. Keep both lanes separate.** Quick Scan becomes the Experience
Builder; a short, honest "where are you in the process" lives on the
Full Assessment's own first card instead. Cost: more work.

**My recommendation is A.** You described the Quick Scan as prompting
higher-level thinking. A tool that is secretly harvesting inputs for a
different tool is not doing that, and the carry-forward is what dragged
the current version toward units-and-types in the first place.

---

## 4. What the Quick Scan gives back

If it is not scoring readiness, it has to end in something worth the
ninety seconds. Proposed: a written reflection built from the six
choices — the guest they named, the longing, what the land does, the
experience, the memory, the reason to return — read back as a short
paragraph, plus the one card they said "I do not know yet" on, named as
the place to start.

**This has to be honest about how it is written.** Two options:

1. **Templates**, deterministic, no model. Ships today, works offline,
   and reads like a template.
2. **The Worker**, which needs your `npx wrangler login` and about $5 a
   month. Reads like a person wrote it.

If you want option 2, the Worker is built and exercised; it just has
never been deployed. Either way, nothing on screen will claim to have
read something it did not.

---

## Decisions needed

1. **Carry-forward** — default: **A**, the Quick Scan stops feeding the
   Full Assessment. Alternatives: B (two quiet facts) or C.
2. **The six cards** — default: the six named above. Tell me which to
   swap.
3. **How each card asks** — default: three positions plus "I do not know
   yet", with an optional free-text box.
4. **The written reflection** — default: templates now, Worker later.
   Alternative: you run `npx wrangler login` and we ship the real thing.
