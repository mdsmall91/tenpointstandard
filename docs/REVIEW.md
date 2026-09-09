# Branch review — `feature/standard-v3`

Eleven commits, 128 files. `main` is untouched at `c2af3ba`. Nothing is
deployed. Preview is at **http://localhost:4174** (`python tools/preview-server.py`
if it is not running).

---

## Walk it in this order

**1. The front door — http://localhost:4174/**

The Field Journal is the site root, which is how it was already indexed.
The masthead is the national positioning you supplied. Nav is Field
Journal · Quick Scan · Full Assessment · About.

**2. Quick Scan — /read/**

Ninety seconds, mostly pictures, no email. Type a sentence about a
project first: it fills in what it can and shows you what it read, and
every one of those is changeable. The ring at the end is the same dial
the Full Assessment and the scorecard use.

Worth trying: type something, then contradict it by tapping different
answers. The written read follows what you tapped, not what you typed.

**3. Full Assessment — /standard/**

This is the new direction. Ten photographic cards; each flips in place to
its four questions; any card, any order. The field note is on the back of
the card. The fourth answer on a card pays out with what those answers
are worth, including naming an open critical gate.

A card is **answered**, not good. Four noes complete a card. Readiness is
the ledger's word, after the six gates have spoken.

If you came from the Quick Scan, what it established is filled in,
confirmed on its own screen first, and tagged "From your Quick Scan" on
the card so you can change it.

**4. The ledger, and what it sends**

Score, verdict, the six gates, findings, three actions. Then the email
gate and the forwardable scorecard.

**5. The scorecard — /scorecard/**

Everything is in the URL fragment, so the answers never reach a server
and never appear in a referrer. Forwardable to a partner or a lender.

---

## What I would look hardest at

- **The ten field notes** (`app.js` `FIELD_NOTES`). Draft, Kenny after
  launch. They are the human voice of the whole thing.
- **The card fronts.** They carry the number, the name and progress and
  nothing else. I had written a teaser line for each; you said no, so
  they are gone and the photograph does the inviting. Judge whether the
  fronts now feel too bare.
- **The written reads.** Generated, and they are the part a stranger
  will judge us on.
- **The photography**, which you are replacing in the morning.

## What is not done

- **The AI layer is off in production.** `CONFIG.MODEL_PROXY_URL` is
  empty, so reads come from their templates, which are correct. Turning
  it on needs the Cloudflare Worker deployed, and that needs your
  `npx wrangler login`. Everything up to that is done and the Worker has
  been run and exercised for real.
- **The scorecard link has never been clicked from a real send.** The
  merge tag resolves correctly with its `#s=` fragment in Mailchimp's
  preview, but Mailchimp rewrites links for click tracking at send time.
  One real click after deploy settles it.
- **Four scope sentences** on `/about/`, one per project.

## Tests

| Suite | How | Result |
| --- | --- | --- |
| Results engine | `/tests/tests.html` | 221 of 221 |
| Journal drift | `/tests/journal-tests.html` | 332 of 332 |
| Boundary guard | `python tools/test-guard.py` | 33 of 33 |
| Internal links | `python tools/check-links.py` | 177 of 177 |

The board was driven through all forty questions with the real buttons
and compared against the same answers handed straight to the engine:
score, verdict, ledger, findings and actions identical.

## Deploying, when you say so

`main` is the deploy branch — a push to it publishes. So:

```
git checkout main
git merge feature/standard-v3
git push
```

Nothing else. No build step.
