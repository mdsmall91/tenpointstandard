# tenpointstandard.com

Static site, no build step. Two ways in to the same readiness framework, plus the Field Journal that feeds both.

**Lane one is The Read.** Ninety seconds, ten questions, mostly pictures, no email. It gives a directional position and names the one thing most likely to stop the project.

**Lane two is The Full Standard.** All ten points, forty questions, scored out of one hundred. The email ask sits here, after the person has already been given something.

## Routes

| URL | What it is | Indexed |
| --- | --- | --- |
| `/` | The Field Journal. The front door. | yes |
| `/read/` | **Quick Scan.** `read.js` + `readmodel.js` | yes |
| `/standard/` | **Full Assessment.** Ten cards. `board.js` + `app.js` + `results.js` | yes |
| `/scorecard/` | The forwardable scorecard, answers in the URL fragment | no |
| `/about/` | One screen on Ten Point Services | yes |
| `/consultation/` | Kenny's direct line, plus a form | yes |
| `/glamping-show/` | Show landing page and QR destination | unlisted |
| `/journal/<slug>.html` | Articles | yes |
| `/journal.html` | Redirects to `/`. Kept because it was indexed. | no |
| `/aga.html` | Redirects to `/glamping-show/`. Kept for links already shared. | no |

GitHub Pages cannot issue a 301, so both redirects are a canonical tag plus a
zero-second meta refresh plus `location.replace`. Neither is noindex: a noindex
page cannot pass its signals to the canonical target.

## Stack
- Plain HTML/CSS/JS, no build step. Edit, commit, push — GitHub Pages redeploys automatically.
- `config.js` — **every shared setting.** Mailchimp, GA4, Kenny's contact details, the model proxy URL. **Load it before any other script.**
- `analytics.js` — one GA4 wiring for the whole site, with a once-per-session guard on milestones and a hard block on localhost.
- `ring.js` + `styles/ring.css` — the ten point ring, shared by both lanes and the scorecard.
- `readmodel.js` — lane one: screens, band mapping, the written read, the carry-forward, and the local intake extraction.
- `read.js` + `styles/read.css` — lane one state machine.
- `app.js` + `results.js` + `standardread.js` + `styles/site.css` — lane two.
- `scorecode.js` — packs the forty answers into sixteen characters for the scorecard URL.
- `scorecard.js` — renders the forwardable page from that code.
- `consult.js` — the consultation form.
- `posts.js`, `journal-core.js`, `journal.js`, `journal-article.js`, `styles/journal.css`, `feed.xml` — the Field Journal.
- `styles/tokens.css`, `styles/base.css` — design system (portable, from the design handoff, do not hand-edit casually).
- `styles/pages.css` — the masthead, the standing CTA block, and the standing pages.
- `CNAME` — custom domain for GitHub Pages.

## Tools

    python tools/dev-proxy.py            # the model proxy, locally, no cloud account
    python tools/test-guard.py           # the boundary regex: 19 must block, 14 must pass
    python tools/build-images.py         # rebuild every photograph from the asset library
    python tools/check-links.py          # every internal link on every page, against the preview
    python tools/set-masthead.py         # the masthead sentence, in one place
    python tools/rename-lanes.py         # the Quick Scan / Full Assessment label map
    python tools/update-journal-pages.py # bring the articles onto the current chrome

`tools/build-images.py` is the only place photographs are cropped, and it carries
the provenance for every one. Re-picking a photo is a one-line edit and one command.

## Cache-busting

Every page pins the same `?v=N` on every shared asset. `config.js` is loaded by
all of them, so two different values give a visitor two cache entries for one
file and fresh HTML can then pair with stale config. Bump them all together:

    grep -rl "?v=13" --include=*.html --include=*.js . | xargs sed -i 's|?v=13|?v=14|g'

## The model layer

Optional everywhere. Every read has a deterministic template behind it, and a
proxy that is down, slow, rate limited, or never deployed changes nothing a
visitor sees. That is a design rule, not a fallback.

Three tasks, all defined in `worker/prompts.json` so the two runtimes cannot
drift: `intake` (pull the stated facts out of what somebody typed), `read`
(lane one's four sentences), and `standard_read` (lane two's six to eight).

**The boundary is enforced three times.** No cost, no schedule, no yield, no
ruling on what a jurisdiction will approve. It is stated in the system prompt,
constrained by the output schema, and checked again by regex on the way out.
A response that fails any of the three is discarded and the page keeps its
template. Never remove one of the three because the other two look sufficient.

`tools/test-guard.py` tests the third one, and it earns its keep: the first
version of that regex let "the county will approve this use" straight through.
Run it after any edit to the patterns. It also asserts that real template lines
are NOT blocked, because a guard that eats its own product fails silently.

**Output schemas state a shape, not a range.** `minimum`, `maximum`,
`minLength`, `maxLength`, and `minItems` above 1 are all rejected with a 400.
Bounds live in code: the size is clamped on intake, line counts and lengths in
`TPModel.cleanLines`.

**Testing locally, no cloud account needed:**

    python tools/dev-proxy.py

It reads the key from `ANTHROPIC_API_KEY` or `~/.secrets/anthropic_api_key.txt`,
never from this repository, and prints the tokens and cost of every call.
`modelproxy.js` points the site at it automatically when served from localhost.

**Production** is `worker/`, a Cloudflare Worker. Deploying needs Node:

    winget install OpenJS.NodeJS.LTS
    cd worker && npm install
    npx wrangler secret put ANTHROPIC_API_KEY
    npx wrangler deploy

Then set the deployed URL as `CONFIG.MODEL_PROXY_URL`. Nothing else changes.

Model is `claude-sonnet-5` at `effort: "low"` in both runtimes (Matt's call: the work
is short, tightly specified rewriting with every fact already supplied). Roughly
0.8 cents per completed Quick Scan. Thinking stays on; lowering effort gets the
saving without the risk that comes with switching reasoning off.

## The Full Assessment is a board

`/standard/` asks its forty questions as ten photographic cards. A card
flips in place to its four questions; any card, any order, come back to
anything. It replaced ten sequential screens on 2026-09-09.

Only the question surface changed. The scoring, the six critical gates,
the verdict, the findings, the three actions, the ledger, the scorecard,
the Mailchimp send and the model layer are the same code they were, and
`board.js` writes into the same `state.answers` in the same format, so
identical answers give an identical result either way. `tests/tests.js`
checks that, and checks that nothing is left orphaned at
`/standard/play/`, where the board first arrived as a prototype.

Two rules the board has to keep:

- **It is mounted, not re-rendered.** `app.js` rebuilds `#app` from a
  string on most state changes. Doing that to the board would throw the
  flip away mid-animation and shut the open card under someone's hand.
  `render()` mounts it once and then leaves it alone; the board repaints
  only the card that changed and calls `chromeChanged()` for the score
  and the rail, which it does not own.
- **A card is answered, not good.** Four answers complete a card whatever
  those answers were. The front says "All four answered", never
  "complete" in a sense that could read as ready, and the payout line on
  the back names an open gate when there is one. Readiness is the
  ledger's verdict to give, and only after all six gates have spoken.

Carry-forward from the Quick Scan still applies: anything lane one
established is filled in, confirmed on its own screen first, and marked
on the card with "From your Quick Scan" so it can be changed.

## The model layer runs on a Worker

`worker/src/index.js` is what holds the API key in production. It has been
run for real, not just written: `python tools/worker-dev.py` starts the
actual Worker with its rate limiter and its secret, and against it an
intake call extracted all six fields, a read used the template for facts
and the visitor's words for vocabulary, a prompt-injection attempt asking
for cost, schedule, occupancy and a county's approval came back as a normal
read carrying none of it, and a request from an unknown origin got a 403.

There are two implementations of this contract on purpose:
`tools/dev-proxy.py` is the quick one to develop against, and the Worker is
the one that ships. They agree on the wire format — `{fields}` for intake,
`{lines}` for read — and if that ever stops being true the page falls back
to its template and nobody sees a failure, which is exactly why it would go
unnoticed. Check both when the contract changes.

**Do not put the key in `worker/.dev.vars` and leave it there.** This
repository sits inside a synced OneDrive folder, so a key left in it is a
key uploaded to Atwell's tenant. `tools/worker-dev.py` writes it from
`~/.secrets` on start and deletes it on exit; `.gitignore` covers it either
way. The deployed Worker never uses that path — there the key is a
Cloudflare secret, set once with `npx wrangler secret put ANTHROPIC_API_KEY`.

To deploy, from `worker/`:

```
npx wrangler login                       # opens a browser, Matt authorises
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler deploy
```

Then put the deployed URL in `CONFIG.MODEL_PROXY_URL` in `config.js`.

## What is still open

- **Ten field notes** in `app.js` `FIELD_NOTES`, the ten card teasers in
  `board.js` `TEASERS`, and the template reads in `readmodel.js` and
  `standardread.js` are DRAFT. Kenny reviews them after launch, so they go
  live as they are.
- **Four scope sentences** on `/about/`, one per project. The cards say less
  rather than inventing a condition that was solved.
- **`CONFIG.MODEL_PROXY_URL`** is empty, so production reads come from the
  template. It needs the Worker deployed, and deploying needs a Cloudflare
  account and `npx wrangler login`, which only Matt can complete. Everything
  up to that point is done: Node is installed (user profile, no admin), the
  dependencies are in, and the Worker itself has been run and exercised — see
  below.
- **`CONFIG.MAILCHIMP_GROUP_CONSULT`** is empty, so the consultation form opens
  a mail client instead of posting to Mailchimp. See the comment in `config.js`.
- **The scorecard link has not been clicked from a real send yet.** The merge
  tag resolves to the full URL with its `#s=` fragment intact in Mailchimp's
  live preview, but Mailchimp rewrites links for click tracking at send time.
  One real click after deploy settles it. If the fragment ever comes back
  stripped, turn click tracking off for that one email.

## Configuration (top of `app.js`)
```js
var CONFIG = {
  MAILCHIMP_FORM_ACTION: '',  // Mailchimp embedded-form action URL
  GA_MEASUREMENT_ID: ''       // GA4 measurement ID, e.g. G-XXXXXXXXXX
};
```

### Mailchimp setup
1. In Mailchimp: **Audience > Signup forms > Embedded forms**. Copy the URL from the `<form action="...">` attribute. It looks like `https://xxxx.usXX.list-manage.com/subscribe/post?u=XXXX&id=XXXX`. Paste it into `MAILCHIMP_FORM_ACTION`.
2. In **Audience > Settings > Audience fields and *|MERGE|* tags**, create these fields (all type Text unless noted):
   - `SCORE` (Number) — total score out of 100
   - `BAND` — Ten Point Align / Ten Point Design / Ten Point Build
   - `ANSWERED` (Number) — questions answered out of 40
   - `P01` … `P10` — per-point scores, stored as "n / max" (e.g. "9 / 12")
   - `HEADLINE`, `VERDICT`, `GATES`, `F1`-`F3`, `A1`-`A3`, `SCORECARD`
   These already exist in the live audience, which is at the 30-field cap.
   Adding another one silently does nothing: an unused field has to be
   relabelled instead. Never delete a field that holds data — that destroys
   the column for every contact.
3. Build a **Customer Journey** (or classic automation) triggered on "signs up" that sends the scorecard email **from letstalk@tenpointstandard.com**, using merge tags like `*|SCORE|*`, `*|BAND|*`, `*|P01|*` … `*|P10|*`.
4. To send from `letstalk@tenpointstandard.com`, authenticate the domain in Mailchimp (**Website > Domains**) — it will give you DKIM CNAME records to add in GoDaddy DNS.
5. Recommended: disable double opt-in for this audience, or the scorecard journey should trigger on confirmation instead of signup.

### Google Analytics
GA4 property `tenpointstandard.com` (p546202160), measurement ID in `GA_MEASUREMENT_ID`.

**Funnel events (mark as key events in GA Admin > Events):**

| Event | Fires when | Params |
| --- | --- | --- |
| `assessment_start` | the first question is answered, once per assessment | `method: ten_point_standard` |
| `assessment_complete` | the verdict/scorecard first renders (email gate or skip) | `method`, `score_band` (`align`/`design`/`build`), `score`, `gated` (`yes`/`no`) |
| `cta_click` | a post-verdict CTA is clicked | `cta` (`full_assessment` / `email_results`) |

`assessment_start` keys off the saved answers, and `assessment_complete` only fires on the
transition into the revealed state — so neither re-fires when a returning visitor reloads a
result they already have. "Start over" clears the answers and both can fire again.

`score_band` is the **verdict stage**, not the raw score band: an open critical gate can pull
the shown stage below the score, and `gated: yes` marks that case.

**Journal events** (fired by `journal-core.js`, per the design handoff):

| Event | Fires when | Params |
| --- | --- | --- |
| `journal_view` | an article page loads | `slug` |
| `journal_filter` | a filter chip is clicked (not on load or back/forward) | `tag` |
| `journal_share` | a share link or copy-link is used | `slug`, `channel` (`linkedin`/`x`/`email`/`copy`) |
| `journal_subscribe` | a Journal newsletter signup succeeds | — |

**Legacy events**, still firing so historical reports keep working: `fg_begin`,
`fg_view_ledger`, `fg_email_captured`, `fg_skip`, `fg_reset`, `fg_full_assessment_request`.

To see `score_band`, `score`, and `cta` in reports, register them as **custom dimensions**
(Admin > Custom definitions), scope Event. Without that they only appear in DebugView and
Realtime.

## The Field Journal

Editorial section at `/journal.html`, built from the Claude Design handoff
(*Field Guide Journal v2*). Credibility, lead gen, and SEO: every article page
ends in the assessment CTA.

**Everything is static.** `journal.html` carries the full markup for every tile,
and each article is a hand-written page under `journal/`. No tile and no
paragraph is injected at runtime — that is deliberate, and it is the same
lesson `index.html` learned (see *SEO / indexing* below). The JS only filters,
shares, and subscribes.

- `posts.js` — canonical **metadata** (`TAGS`, `POSTS`). **No page loads it at
  runtime.** It is the source of truth that the static HTML must agree with, the
  way `QUESTIONS.md` is for the assessment. **Body copy is not in here** — it
  lives only in the page. Mirroring a 2,000-word article in a file nothing loads
  is two copies to keep in step, which is a drift risk rather than a safeguard.
- `feed.xml` — RSS. This is what makes the subscription work; see below.
- `tests/journal-tests.html` — 183 checks that the HTML, `posts.js`, and
  `feed.xml` still agree: titles, deks, bylines, dates, read times, tags,
  canonicals, aspect ratios, chip order, and the draft rule. Prose is not
  diffed; instead a published page must carry a real body (≥3 paragraphs,
  ≥300 words) with a read time within range of its actual length, every pull
  quote must use `.pull`, and every source must carry an `https://` link.
  **Serve over HTTP** (it fetches the pages) and run it after editing any of
  the three.

### Drafts — one article, and the rest held back

An entry with `draft: true` in `posts.js` has **no tile, no page, no sitemap
entry, and no feed item.** It is held back completely rather than published
thin. Only its metadata lives in `posts.js`, ready for the copy.

Right now **one entry is published** — *Entitlements*, by Matt Small — and
eight are drafts, so:

- The **filter bar and the grid ship with `hidden`** and are revealed by
  `journal.js` only when a second tile exists. A seven-chip filter over a single
  article reads as broken. Nothing has to be flipped by hand — add a second tile
  and both come back on their own.
- The page shows the featured entry alone.

### Publishing an entry

Do all of this in one commit; the drift tests fail if any step is missed.

1. In `posts.js`: add the metadata and **remove `draft: true`**. Entries stay
   newest-first, and exactly one carries `featured: true` as `POSTS[0]`. Set
   `metaDescription` if the dek is too short to work as a search snippet.
2. Add the tile to `journal.html` and the page at `journal/<slug>.html`. Copy
   `entitlements.html` — the header, share row, author card, CTA, and
   newsletter block are identical on every article. Body copy goes in the page
   only. Available body elements: `<p>`, `<h2>`, `<ul>`, `<ol>` (a `<strong>`
   lead-in per item reads well on numbered points), `<blockquote class="pull">`,
   and a `.jr-sources` block of numbered citations with links.
3. Add the URL to `sitemap.xml`, and an `<item>` to `feed.xml` with an
   **RFC-822** `pubDate` (`Tue, 28 Jul 2026 00:00:00 -0500`, not ISO). Update
   `<lastBuildDate>`. An ISO date here is the usual reason an RSS campaign
   silently never sends.
4. Run `tests/journal-tests.html` until it reports 0 failures.
5. Bump `?v=N` on `styles/journal.css` and the journal scripts if either changed.

### Field Notes subscription

Built and verified end to end on Aug 9 2026, on the existing Mailchimp
audience (Essentials plan, 500 contacts).

**Done and tested:**

- Hidden group **Subscriptions > Field Notes** on the one audience.
- The subscribe form on `/journal.html` and every article sends that group, so
  Field Notes subscribers are distinguishable from scorecard leads.
- Saved segment **"Field Notes subscribers"** (`Subscriptions one of Field
  Notes`) — this is what an RSS campaign targets.
- Verified by live signup through the real form: the contact lands with
  `Groups > Subscriptions > Field Notes`, and the segment resolves to it.

**CRITICAL — it must be a group, not a tag.** `tags=<id>` on the
`post-json` endpoint is accepted and then **silently discarded**: the contact
subscribes, the response says `success`, and the tag never lands. This was
confirmed by live test, not assumed — a first attempt using a tag produced a
subscribed contact with an empty Tags column. Groups pass through correctly.
This is the same class of trap as the `f_id` parameter in `app.js`.

The field name is Mailchimp's own, `group[<categoryId>][<bit>]`, held in
`JR_CONFIG.MAILCHIMP_GROUP_PARAM`. Read it off the hosted signup form
(`tenpointservicestx.us4.list-manage.com/subscribe?u=..&id=..`) — **not** from
the interest id in the admin URL, which does not work here.

**Why a group and not a second audience:** Essentials allows three audiences,
but a contact in two counts twice against the 500-contact plan and splits
unsubscribes across two lists. A group is also the primitive Mailchimp intends
for "which mailings do you want", so it appears in the preferences centre free.

**On GoDaddy:** GoDaddy sells mailbox hosting (the Microsoft 365 mail on this
domain) and, separately, email marketing bundled with a Websites + Marketing
plan — different products, and the mailbox plan includes no subscriber list.
Mailchimp was used because it is already wired, paid for, and verified.

#### Still to do — two blockers

**1. The RSS campaign cannot be created until the Journal is deployed.**
"Email people when a new article publishes" is an RSS campaign, not a signup
trigger: a signup trigger fires once on join and sends whatever existed then, so
it will never send the *next* article. An RSS campaign watches the feed and
sends when it changes — which is why `feed.xml` exists. Mailchimp validates the
feed URL on creation, and `https://tenpointstandard.com/feed.xml` currently
404s because this work is unmerged. Once it is live:

> Audience > Segments > **Field Notes subscribers** > Actions > **Send RSS
> email**, feed `https://tenpointstandard.com/feed.xml`.

(That Actions menu is the only entry point left in this account's UI. There is
no RSS option under Create > Email, and the legacy `wizard/neapolitan?type=rss`
URL 404s. The "Share blog updates via RSS" flow template also exists under
Automations > Flow templates.)

**2. ~~The Welcome journey fires for Field Notes subscribers.~~ Fixed Aug 9
2026.** "Welcome new contacts" triggered on any signup, so a Field Notes
subscriber received the scorecard email with every merge field empty. The
trigger now carries a filter:

> `Group category: Subscriptions > none of > Group interest: Field Notes`

It is a **trigger filter, not a step**, so it does not count against the
4-step Essentials limit (still "2 of 4 steps left").

Verified live, both directions, because the failure mode here is silent:

| Test signup | Group | Welcome email |
| --- | --- | --- |
| `+fntest4` via the Journal form | Field Notes | **not sent** — correct |
| `+sctest1`, scorecard-style | none | **sent**, with SCORE/BAND/ANSWERED — correct |

Journey counter went 9 → 10 across two signups, confirming exactly one entered
and that **the trigger did not go stale** on reactivation.

If you edit this journey again, follow the same order: Pause & Edit → change →
open the trigger's ⋮ > Edit > **Save Trigger** → Turn back on → run a live
signup of each kind and check the contact's Activity. A stale trigger shows
"Active" while silently admitting nobody.

**Test contacts to clean up** (all mine, safe to delete):
`coloradojeeper.small+` `fntest1` (no group — the failed tag attempt),
`fntest2` (no group — stale-cache run), `fntest3` and `fntest4` (in the Field
Notes group), `sctest1` (scorecard control, carries a fake Score of 55).

### Imagery

No photography has been supplied. Every media box renders the captioned
placeholder from the design (a mono note describing the shot and its ratio) —
never a color fill or an icon. To add a photo: drop it at
`assets/journal/<slug>/hero.jpg` (2400px long edge) or `author.jpg` (square,
400px), set `hero` / `author.photo` in `posts.js`, and replace the
`.jr-media-note` span with an `<img>`. Keep the `aspect-ratio` on `.jr-media` —
it is what stops the masonry columns reflowing as images load.

### Config

All shared settings live in **`config.js`** — `MAILCHIMP_FORM_ACTION`,
`GA_MEASUREMENT_ID`, and `MAILCHIMP_GROUP_FIELD_NOTES`. Both `index.html` and
every Journal page load it **first**, before any other script, so these values
exist in exactly one place. `journal-core.js` throws if it is missing rather
than silently failing to subscribe anyone.

`tests/tests.html` loads it too, since `app.js` no longer defines `CONFIG`.

## SEO / indexing
- `robots.txt` — allows everything except `/tests/`, points at the sitemap.
- `sitemap.xml` — the single URL. **Bump `<lastmod>` when the page content changes materially.**
- `index.html` `<head>` carries the title, meta description, canonical, OG/Twitter tags, and
  a JSON-LD `@graph` with Organization (Ten Point Services as publisher), WebSite, and FAQPage.
- `#fg-about` in `index.html` is the **static, crawlable copy**. Everything else on the page is
  injected by `app.js`, which leaves a crawler almost nothing to index. Two rules:
  1. The FAQ answers in `#fg-about` and the ones in the JSON-LD must stay identical. Google
     drops (and can penalise) FAQ markup that is not visible on the page.
  2. It is shown with the cover and hidden from step 1 on, via `body[data-step]` in `site.css`.
     The attribute is absent until `app.js` runs, so it is visible to a crawler and with JS off.

### Search Console
Property `https://tenpointstandard.com/` (URL-prefix) was created Aug 9 2026 under
coloradojeeper.small@gmail.com. No GoDaddy DNS record is involved, so nothing here can
disturb the M365 mail records.

**Ownership is proved two ways, both of which must stay in the repo forever:**
- `googlec3c92888c8f523e7.html` at the site root
- the `google-site-verification` meta tag in `index.html`

Deleting either can un-verify the property. **The Google Analytics verification method does
not work on this site** — it was tried and failed with "could not find any Google Analytics
tracking codes on the index page," because `app.js` injects the gtag snippet at runtime and
Google reads the raw source. Same reason the static `#fg-about` block exists.

Remaining steps, all of which require the deploy to be live first:
1. Search Console > **Verify** (the property sits unverified until the two tokens are reachable).
2. **Sitemaps** > submit `sitemap.xml` (404s until deployed).
3. **URL Inspection** on `https://tenpointstandard.com/` > *Request indexing*.
4. Check "View crawled page" in URL Inspection to confirm Google executes the JS and sees the
   assessment, not just the static block.

## Deploy (GitHub Pages)
- Repo pushes to `main` auto-publish via GitHub Pages (branch: main, root).
- Custom domain: `tenpointstandard.com` (the `CNAME` file). GoDaddy DNS:
  - Four `A` records on `@`: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
  - `CNAME` record `www` → `<github-username>.github.io`
  - In the repo's Pages settings, set the custom domain and enable "Enforce HTTPS" once the certificate is issued.

## Cache busting (important when deploying)
GitHub Pages serves assets with `Cache-Control: max-age=600`, so a browser can hold a
stale `app.js` for up to 10 minutes after a push. `index.html` references the assets as
`app.js?v=N` and `styles/site.css?v=N` — **bump `N` in `index.html` on any deploy that
changes those files.** Without it a visitor can end up with fresh HTML and stale JS,
which breaks the page rather than merely showing old content.

To confirm a deploy actually landed, check the server directly rather than the browser:
`curl -s https://tenpointstandard.com/app.js | grep <some-new-string>`

## Local preview
Run `python tools/preview-server.py`, then open http://localhost:4174.

Use that rather than `python -m http.server`. The plain server sends no
cache headers, and a browser handed HTML with none of its own invents a
freshness lifetime and keeps serving an old build. That has already cost
this project twice: a review pass that got a version of the site several
builds old and looked broken, and a drift suite that reported 121 of 122
passing against a stale copy of its own test file. `tools/preview-server.py`
sends `no-store`, refuses to answer 304, and listens on both spellings of
loopback so `localhost` does not pay a two-second IPv6 timeout per request.

If a preview ever still looks stale, the browser is holding a copy keyed
by path, and a query string will not shake it loose. Change the port.
