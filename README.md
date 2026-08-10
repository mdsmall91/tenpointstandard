# tenpointstandard.com — The Field Guide

Single-page static site: the Ten Point Standard self-assessment (40 yes/no questions, weighted score out of 100, three service bands: Align / Design / Build) behind a soft email gate.

## Stack
- Plain HTML/CSS/JS, no build step. Edit, commit, push — GitHub Pages redeploys automatically.
- `index.html` — page shell (header, nav strip, footer).
- `app.js` — all data (POINTS/BANDS), state, rendering, Mailchimp + GA4 wiring.
- `styles/tokens.css`, `styles/base.css` — design system (portable, from the design handoff, do not hand-edit casually).
- `styles/site.css` — page-specific styles (stepper flow).
- `journal.html`, `journal/<slug>.html`, `posts.js`, `journal-core.js`, `journal.js`,
  `journal-article.js`, `styles/journal.css`, `feed.xml` — the Field Journal (see below).
- `CNAME` — custom domain for GitHub Pages.

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

- `posts.js` — canonical content model (`TAGS`, `POSTS`). **No page loads it at
  runtime.** It is the source of truth that the static HTML must agree with, the
  way `QUESTIONS.md` is for the assessment.
- `feed.xml` — RSS. This is what makes the subscription work; see below.
- `tests/journal-tests.html` — 168 checks that the HTML, `posts.js`, and
  `feed.xml` still agree: titles, deks, bylines, dates, read times, tags,
  canonicals, aspect ratios, body copy, and the draft rule. **Serve over HTTP**
  (it fetches the pages) and run it after editing any of the three.

### Drafts — one article, and the rest held back

An entry with `draft: true` in `posts.js` has **no tile, no page, no sitemap
entry, and no feed item.** It is held back completely rather than published
thin. Only its metadata lives in `posts.js`, ready for the copy.

Right now one entry is published and seven are drafts, so:

- The **filter bar and the grid ship with `hidden`** and are revealed by
  `journal.js` only when a second tile exists. A seven-chip filter over a single
  article reads as broken. Nothing has to be flipped by hand — add a second tile
  and both come back on their own.
- The page shows the featured entry alone.

### Publishing an entry

Do all of this in one commit; the drift tests fail if any step is missed.

1. In `posts.js`: add the `body` array and **remove `draft: true`**. Entries stay
   newest-first, and exactly one carries `featured: true` as `POSTS[0]`.
2. Add the tile to `journal.html` and the page at `journal/<slug>.html`. Copy
   `absorption-curve.html` — the header, share row, author card, CTA, and
   newsletter block are identical on every article.
3. Add the URL to `sitemap.xml`, and an `<item>` to `feed.xml` with an
   **RFC-822** `pubDate` (`Tue, 28 Jul 2026 00:00:00 -0500`, not ISO). Update
   `<lastBuildDate>`. An ISO date here is the usual reason an RSS campaign
   silently never sends.
4. Run `tests/journal-tests.html` until it reports 0 failures.
5. Bump `?v=N` on `styles/journal.css` and the journal scripts if either changed.

### Field Notes subscription

The form at the bottom of `/journal.html` and every article posts to whatever
`JR_CONFIG.MAILCHIMP_FORM_ACTION` points at in `journal-core.js`. It currently
points at the **existing, verified Mailchimp audience** — the same one the
scorecard uses — because that pipeline is already proven end to end.

**Two things here cannot be done from the repo, and are not done:**

1. **The list itself.** Creating a subscriber list is an account action inside
   the ESP's dashboard, behind a login. Nothing in this repo can do it.
2. **The send automation.** Same — it is built in the ESP, not in code.

**"Email people when a new article publishes" is an RSS campaign, not a signup
trigger.** A signup trigger fires once, when someone joins, and sends whatever
was authored at that moment. It will not send them the *next* article. The
mechanism that does is an RSS-driven campaign pointed at
`https://tenpointstandard.com/feed.xml`: publishing an entry changes the feed,
and the campaign sends on its next check. That is why `feed.xml` exists, and why
step 3 above is not optional.

In Mailchimp the path is **Campaigns > Email > Automated > Share your blog**,
feed URL `https://tenpointstandard.com/feed.xml`. Use a **separate audience or a
`journal` tag** so Field Notes subscribers are not mixed with scorecard
recipients — note the audience is already at the 30-merge-field cap, so add no
new fields. And re-read the two Mailchimp gotchas above: strip `f_id`, and
re-save the trigger after any pause/edit/reactivate cycle.

**On GoDaddy:** GoDaddy sells mailbox hosting (the Microsoft 365 mail on this
domain) and, separately, email marketing bundled with a Websites + Marketing
plan. Those are different products, and the mailbox plan does not include a
subscriber list. Whether that plan exists on this account can only be checked by
signing in. Before moving off Mailchimp, weigh that a working, verified pipeline
with an active journey would be replaced by one that has to be rebuilt and
re-tested — and confirm GoDaddy's form can accept a cross-origin post from a
static page, which Mailchimp's JSONP endpoint is what makes possible here.

### Imagery

No photography has been supplied. Every media box renders the captioned
placeholder from the design (a mono note describing the shot and its ratio) —
never a color fill or an icon. To add a photo: drop it at
`assets/journal/<slug>/hero.jpg` (2400px long edge) or `author.jpg` (square,
400px), set `hero` / `author.photo` in `posts.js`, and replace the
`.jr-media-note` span with an `<img>`. Keep the `aspect-ratio` on `.jr-media` —
it is what stops the masonry columns reflowing as images load.

### Config duplication (known)

`journal-core.js` mirrors `MAILCHIMP_FORM_ACTION` and `GA_MEASUREMENT_ID` from
the top of `app.js`, because `app.js` runs the whole assessment on load and the
Journal cannot include it. **Rotate either value in both files.** The clean fix
is extracting a shared `config.js`; that touches the live assessment page, so it
was left out of the Journal branch.

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
Any static server, e.g. `python -m http.server 4173` in this folder, then open http://localhost:4173.
