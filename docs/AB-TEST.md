# The interface A/B test

Two interfaces over one assessment, running to **31 October 2026**.

- **`board`** — ten photographic cards, the current site.
- **`list`** — ten sequential screens, the shape the board replaced,
  restored from `f5691e4^`.

**What is being decided:** whichever arm gets more completions, then more
dwell, is what the site keeps. Completions carry the weight.

That ordering is deliberate. Dwell alone cannot tell a pleasant interface
from a confusing one — both hold somebody longer. A completion only
happens when they reached the end.

---

## What is identical between the arms

The same forty questions from the same `questions.js`, the same answers
written into the same `state.answers`, the same engine scoring them, the
same ledger, scorecard, email and model layer. Verified: driving all
forty through each interface produced score 36 both times, with matching
verdict, ledger, findings and actions.

Both arms also land straight in the assessment. The list version
originally opened on a cover screen with a Begin button; giving it that
back would have tested a landing page and an interface at once, and the
result would not say which moved the number.

The only difference is the interface.

## Assignment

`abtest.js`. Drawn once at 50/50, stored in `localStorage['tp-ab-v1']`,
never redrawn. A visitor who saw cards on Tuesday sees cards on Thursday;
otherwise their dwell would be an average of two interfaces and their
completion would land in whichever arm they happened to visit last.

Force an arm with `?ab=board` or `?ab=list`. That is remembered like any
other assignment, so a tester does not silently flip back.

After 31 October everyone gets the board again regardless of what is in
their storage, so a stale assignment cannot outlive the experiment.

## What is measured

Every GA4 event carries **`ab_arm`**. It is stamped in `analytics.js`
rather than at each call site, so an event added later cannot report
without it.

| Event | Carries | Means |
| --- | --- | --- |
| `standard_arm_assigned` | `step` | A visitor entered the assessment |
| `standard_dwell` | `dwell_ms`, `responded`, `completed` | They reached the ledger |
| `standard_abandon` | `dwell_ms`, `responded`, `furthest_point` | They left without reaching it |
| `standard_point_complete` | `point_number`, `point_score` | A point's four questions answered |
| `fg_email_captured` | `score` | They gave an email |

**`responded` counts every answered question, "Not sure" included.**
`answeredCount()` in `app.js` deliberately excludes "Not sure" because the
ledger says "you answered 27 of the 40", which is a claim about how much
is known. Completion is a different question: somebody who answered all
forty and was unsure of thirteen finished. Measuring on `answeredCount`
would undercount exactly the careful people, and would tilt the result if
one arm nudged harder toward "Not sure".

**Dwell is timed by the page, not by GA4.** The clock starts when they
enter the assessment, not when the page loads, so reading the cover does
not count. It pauses when the tab is hidden, because a tab left open over
lunch is not ninety minutes of engagement and would otherwise become the
largest number in the set.

## Reading it honestly

Separating two dwell distributions wants roughly **300 to 400 sessions an
arm**. This site produced **13 completed assessments between July and
September**. The show on 30 September is the one real shot at volume.

So: the first weeks are directional, not significant. A gap of a few
percent between arms in October is noise wearing a number. What would
count as a real result is one arm completing at meaningfully more than
the other across a few hundred sessions each.

The honest reading at the end of October may well be "not enough data to
say", and that is a legitimate outcome. It is worth more than picking a
winner from forty sessions.

Also worth naming: show traffic is people who just met Kenny at a booth,
not organic search. Both arms get the same mix so the comparison stays
fair, but it is not a general audience.

## When the test is called

Delete, in this order:

1. `abtest.js` and its `<script>` tag in `standard/index.html`
2. `withArm` in `analytics.js`
3. `renderPoint` and `payoutBlock` in `app.js`, and the list branches in
   `render`, the rail handler and `next`/`prev`
4. The `THE LIST VARIANT` block at the foot of `styles/site.css`
5. `assets/points-wide/` and the wide picks in `tools/build-images.py`
6. The `Dwell` block in `app.js`, unless the numbers are worth keeping

If the list wins, keep `renderPoint` and delete the board instead.
