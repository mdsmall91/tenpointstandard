# tenpointstandard.com — The Field Guide

Single-page static site: the Ten Point Standard self-assessment (40 yes/no questions, weighted score out of 100, three service bands: Align / Design / Build) behind a soft email gate.

## Stack
- Plain HTML/CSS/JS, no build step. Edit, commit, push — GitHub Pages redeploys automatically.
- `index.html` — page shell (header, nav strip, footer).
- `app.js` — all data (POINTS/BANDS), state, rendering, Mailchimp + GA4 wiring.
- `styles/tokens.css`, `styles/base.css` — design system (portable, from the design handoff, do not hand-edit casually).
- `styles/site.css` — page-specific styles (stepper flow).
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
Create a GA4 property for tenpointstandard.com, copy the `G-…` measurement ID into `GA_MEASUREMENT_ID`. Custom events fired: `fg_begin`, `fg_view_ledger`, `fg_email_captured`, `fg_skip`, `fg_reset` (the capture/skip events carry a `score` param).

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
