# Spec v3 build review

**Date:** September 9, 2026
**Branch:** `feature/standard-v3` (preview only; nothing touches `main` until Matt says so)
**Responds to:** `spec-v3-2026-09-09.md`
**Assets reviewed:** `Matt's Files/Ignite Wild/Ten Point Services/Assests/` (567 files: 483 stills, 77 video, brand standards PDF, logo SVG/PSD, InDesign template)

This file holds the reasoning. The chat message holds only the decisions.

---

## 1. What the spec gets right about the live site, and what it misses

The spec's "what is already true" section is accurate: ten points, three bands, six journal categories, three live articles. Three things it does not know about, and each changes the build.

**1.1 The results engine already exists and is tested.** `results.js` (Results Logic Spec v2, July 2026) is a deterministic engine with six critical gates, a verdict override matrix (an open gate can pull the shown stage below the raw score), an eleven-rule headline cascade, a fifteen-finding library, and exactly three actions. It has a 208-check browser test harness including a 20,000-vector sweep. The spec's lane two result (score, band, written read, three priority actions "from the three lowest scoring points") is a thinner version of what is live. Recommendation: keep the engine as the scorer for lane two and layer the ring and per-point payout on top of it. Do not replace gate-aware actions with lowest-three-points actions; the gates are the part Kenny signed off on.

**1.2 Email delivery is not blocked.** Spec item 12 says it depends on an email service account. Mailchimp is already wired end to end: the site posts to the audience with SCORE, BAND, ANSWERED, P01–P10, VERDICT, GATES, HEADLINE, F1–F3, A1–A3, and a journey sends the scorecard email from letstalk@. Two hard constraints carry forward:

- The audience is at Mailchimp's 30 merge-field cap. "Create a new field" is a silent no-op. Only ADDRESS, PHONE, and BIRTHDAY defaults are unused, and their types cannot be changed. There is no free Text slot for the spec's four optional fields (project type, stage, state, opening window) or for lane one's worry.
- Merge fields truncate at 255 characters. A six-to-eight sentence written read cannot ride in one.

Both are solved by 1.3.

**1.3 The forwardable page should be a URL, not an email body.** Forty answers in three states plus lane one's ten answers encode into roughly thirty characters of URL. Build `/scorecard/` as a page that reads that string, re-runs the engine, and renders the ring, score, band, ledger, read, and actions. The email then needs only SCORE, BAND, and the link, which frees merge fields, removes the 255-character problem, gives the `scorecard_forwarded` event a real copy-link action, and needs no server. The written read regenerates from the template deterministically. If the model-written read must survive on the forwardable page, the Worker stores it under a short id later; that is an enhancement, not a dependency.

**1.4 GA4.** The duplicate the spec calls out is real: `fg_email_captured` fires from two code paths in `app.js` (the gate submit and the CTA submit) and re-fires on re-submit. The Aug 8 events (`assessment_start`, `assessment_complete`) are already guarded. New events get the same guard pattern. One known limitation: GA4 will not let an event be starred as a key event until the property has received it once, so key events get marked after the first live hit, not at build time.

---

## 2. Recommended changes to the spec

Numbered so the chat can reference them.

**R1. Keep every URL that is already indexed.** `journal.html` and `journal/<slug>.html` are in the sitemap and Search Console, and the site was only submitted for indexing in August. GitHub Pages cannot issue 301s. Proposed map:

```
/                 Field Journal index (new content at an existing URL)
/journal.html     meta-refresh + canonical to /
/journal/<slug>.html   unchanged
/read/            The Read (new)
/standard/        The Full Standard (the current assessment, moved)
/scorecard/       forwardable page (new, see 1.3)
/about/  /consultation/  /glamping-show/   new
```

The FAQ block and FAQPage schema that carry the search vocabulary move from `/` to `/standard/` with the assessment. The Search Console verification tag stays on `/`.

**R2. Lane one runs screen 4 once, not twice.** Twelve screens plus an optional text box plus an optional upload is not ninety seconds on a phone. One two-up pair holds the target. The second pair can be added if completion rate is above 60% and time-on-lane is under target.

**R3. Screen 3 (stage slider) uses six line illustrations, not six photographs.** Raw land, land under contract, and drawings done do not photograph at 60 pixels, and the library has no raw-land or drawing photography. Consistent illustrations read faster and avoid provenance questions on the most important screen.

**R4. Photography rule, tightened.** Real Ten Point projects only on screen 1 (project type), screen 4 (two-up), the ten point openers, and About. Screen 2 (terrain) is about the visitor's land, not Ten Point's work, so licensed stock is acceptable there if labeled "stock photograph" in the caption. Section 4 maps the library.

**R5. Positioning has to be settled before the masthead is written.** Three sources disagree today:

| Source | Says |
|---|---|
| Spec masthead | "We are a general contractor... across the United States" |
| tenpointservicestx.com (fetched today) | "commercial construction company," Central Texas, Florida via a separate site |
| tenpointstandard.com schema (live) | "Owner's representation and development advisory" |

The spec itself says not to claim national coverage unless confirmed. Default masthead until Kenny confirms otherwise: *Published by Ten Point Services. We build campgrounds, RV resorts, glamping properties, and recreation destinations. Based in the Texas Hill Country.* The schema description changes to match whatever is chosen.

**R6. The AI layer ships behind the template, in this order.** Template reads first (spec already says this). Worker on a `workers.dev` subdomain, so GoDaddy DNS (which carries the M365 mail records) is never touched. Then intake extraction (screen 0), then written reads. Image reading (screen 10) is deferred past the show: it is the most expensive item, it needs upload handling and PDF parsing on the Worker, and it never feeds the score. Screen 10 either ships as "coming soon" or is cut from the show build.

**R7. Glamping show page absorbs `aga.html`.** The AGA "Resort Reality Game" session (Tue Sep 29, 10:30 AM, Matt and Kenny) is at the same show. `/glamping-show/` carries the booth number, the session, the QR destination, and the AGA signup form that already works. `aga.html` redirects there. Booth number is still missing from both.

**R8. Consultation.** No calendar tool exists. Today's path is the "request the full assessment" form (email plus phone into Mailchimp with REQFULL) and Kenny reaches out. Options: keep that and add the visible phone and email the spec asks for; or add Microsoft Bookings (the company is on M365 through GoDaddy, so it is already paid for) or Calendly. Default: keep the form, show (512) 813-1851 and letstalk@tenpointstandard.com, add a booking link later.

**R9. Brand pairing.** `tokens.css` already carries the May 2026 brand standard (Cormorant Garamond / Inter / JetBrains Mono as the "warm" pairing; forest, bronze, stone, heritage accents). The live site runs `data-accent="stone"` with the "editorial" pairing (Source Serif 4 / Inter Tight). Switching is one attribute per page. Default: leave it for the show build, revisit after. Note the brand standard's "Selected Work: never images on the front" rule conflicts with the spec's photo-led About page; the spec wins on this site.

**R10. Field notes.** Ten one-liners from Kenny are on the blocked list. Default: I draft ten in Ten Point voice (there is a `ten-point-voice` skill) and Kenny edits rather than writes from blank. Same for the template reads across three bands and six worries (eighteen short templates).

**R11. "Not sure" carries into the engine as No, counted separately.** `results.js` treats unanswered as No already; "not sure" becomes a third stored state that scores as No, is excluded from `ANSWERED`, and is reported as `not_sure_count`. The finding library does not change.

**R12. Lane one to band mapping** (proposed, needs Kenny's yes):

- Stage 1–2 → Align. Stage 3–4 → Design. Stage 5–6 → Build.
- Drop one band if stage is 3 or higher and money is "Still exploring."
- Drop one band if stage is 4 or higher and team is "Nobody yet."
- Never move a band up.
- Ring segments lit (directional): Property details, Capital strategy, Regulatory approvals, Guest experience, Schedule. Design lights only at stage 5+ or when an architect/designer is on the team. Procurement, Cost certainty, Quality assurance, Opening readiness stay grey; those are what the Full Standard scores.
- The "open gate" named in the read: the worry from screen 9 if it maps to a lit point that is weak; otherwise the first weak point in the engine's gate order (land control, guest, zoning, utilities, equity, cost).

---

## 3. The photo library

**What is in the folder.** 483 stills. Named, provenance-clear sets: Lagom Retreat (Dripping Springs TX; Strohboid, Tubbo, Nomad wagon, Sliding Unit, DSC and IMG series, construction sequence), Outdoorsy Bayfield CO (9), Austin Moto Adventures (9), KOA Fredericksburg (aerial plus two images that look like renderings), Outdoorsy Hill Country / Stonewall TX (MLS aerials, gallery, dusk). Unknown provenance: Granby / River Run RV Resort CO (4), Larkspur Jellystone CO (6), the 2025-08-18 screenshots of elevated coastal houses, and 73 files with 32-character hash names that are Instagram or Pinterest saves (most are Lagom marketing shots, some are clearly unrelated: a Jack Nicklaus golf club, a "HOWDY" flag, a barn wedding venue). Five Adobe Stock lifestyle images. Two 294-pixel Google Image saves of Roberts Resorts Moab, unusable. A `upscaled_realesrgan/` copy of most of the library at 2048 pixels on the long side exists, so the 500-pixel Instagram crops in `Lagom/` are not a limit.

**Rights flags.** The Lagom videos carry a "MUST CREDIT @thecontenthouse.io" folder name; the Lagom stills may carry the same obligation. The MLS-named aerials came from a real estate listing. The hashed files have no source record. Anything used on the site needs a yes from Kenny that Ten Point has the right to use it, not just that Ten Point built the project.

**Proposed picks** (contact sheet: `docs/photo-picks-2026-09-09.jpg`). File paths are relative to `Assests/Photos/`; `U/` is `upscaled_realesrgan/`, `T/` is `10PS Images/`.

| Screen | Card | File | Source | Flag |
|---|---|---|---|---|
| Read S1 | Campground | `T/Outdoorsy Bayfield/4.jpg` | Outdoorsy Bayfield | 1280 px, fine for a card |
| Read S1 | RV resort | `Larkspur RV2.jpg` | Larkspur | provenance unknown |
| Read S1 | Glamping | `T/Copy of DSC00121.jpg` | Lagom Strohboid | |
| Read S1 | Park & recreation | `Larkspur Activity.jpg` | Larkspur | provenance unknown; else labeled stock |
| Read S2 | Wooded | `U/Outdoorsy Hill Country/356-web-or-mls-33-3777.jpg` | Outdoorsy HC | MLS origin |
| Read S2 | Open ground | `U/Booth Images/Hill Country Landscape.jpg` | Hill Country | |
| Read S2 | On the water | `Granby Overall.jpg` | Granby | provenance unknown; else labeled stock |
| Read S2 | Elevated / rocky | `IMG_4852.JPEG` | Lagom | finished unit, not raw land; acceptable |
| Read S4 | Pair A: cluster | `Moto Adventures/2200x1278-30-cabins.jpg` | Austin Moto Adventures | |
| Read S4 | Pair A: single unit | `D_Cam_DJI_Mini3Pro_..._2026-03-17_IG.jpg` | Lagom Tubbo aerial | |
| Read S4 | Pair B: safari tent | `T/Outdoorsy Bayfield/3.jpg` | Outdoorsy Bayfield | 960 px; use for a half-width card only |
| Read S4 | Pair B: architectural | `U/Lagom Ranch/5f0b2200...jpg` | Lagom Strohboid at dusk | hashed origin |
| Std 01 | Property details | `U/Outdoorsy Hill Country/356-...jpg` | Outdoorsy HC aerial | MLS origin |
| Std 02 | Capital strategy | `U/Outdoorsy Hill Country/Stonewall.jpg` | Outdoorsy HC dusk | |
| Std 03 | Regulatory approvals | `6f8ead17d99b5c732d5a7a1ab5d9b37d.jpg` | graded site aerial | which project? 1080 px |
| Std 04 | Guest experience | `U/Lagom Ranch/ac359e6c...jpg` | Lagom interior | hashed origin |
| Std 05 | Design | `T/Copy of DSC00097.jpg` | Lagom A-frame | |
| Std 06 | Procurement | `U/Tubbo-ATX2.jpg` | Lagom Tubbo shell delivery | |
| Std 07 | Schedule | `U/KOA-Fredricksburg.jpg` | KOA Fredericksburg grading | |
| Std 08 | Cost certainty | `U/Lagom.jpg` | Lagom drywall stage | |
| Std 09 | Quality assurance | `dcffdb6f7f6c2cd7df69b579511c735a.jpg` | crew with Strohboid arch | hashed origin, 1080 px |
| Std 10 | Opening readiness | `T/Copy of DSC01085.jpg` | Lagom porch | |
| About | Lagom Retreat, Dripping Springs TX | `T/Copy of DSC00593.jpg` | Tubbo | |
| About | Outdoorsy Bayfield CO | `T/Outdoorsy Bayfield/1.jpg` | safari tent | |
| About | KOA Fredericksburg TX | `U/KOA Fredericksburg/be988c80...jpg` | looks like a rendering | confirm it is a photo |
| About | Austin Moto Adventures | `Moto Adventures/2000x1053-01.jpg` | A-frame cabins | |

The four About projects match the brand standard's Selected Work strip (Lagom Retreat, Outdoorsy Hill Country, Outdoorsy Bayfield, KOA Fredericksburg) with Moto Adventures swapped in for Outdoorsy Hill Country because the library has finished-product photography for Moto and only aerials for Outdoorsy Hill Country. Either is fine.

**Resolution plan.** Cards render at 400–600 CSS pixels; sources above 1080 px are fine. Point openers are full-bleed and want 2000 px; every pick above clears that except the two hashed files (03 and 09), which the upscaled folder covers at 2048. Every image gets a WebP at 800, 1400, and 2000 wide with `srcset`, plus a JPEG fallback, generated by a script in the repo so re-picks are one command. Open Graph cards are 1200 by 630 crops of the same files with the masthead overlaid.

**What is not in the library.** Raw land before any work. Any drawing, survey, or site plan. Any RV resort or campground that is unambiguously a Ten Point project. Park and recreation of any kind. Those four gaps drive R3 and R4.

---

## 4. Build order for September 24

Fifteen days. The spec's order is right; the dependencies are different once 1.2 and 1.3 are applied.

| Order | Item | Blocked on |
|---|---|---|
| 1 | GA4 guard + duplicate fix; new event names | nothing |
| 2 | Journal to `/`, masthead, article CTA block, redirects | R5 wording |
| 3 | Image pipeline script + first pass of picks | Kenny's yes on section 3 |
| 4 | The Read, screens 1–9 and 11, template reads | photo picks, R12 |
| 5 | `/scorecard/` URL-encoded forwardable page | nothing |
| 6 | The Full Standard: ring, per-point payout, Not sure, carry-forward | field notes |
| 7 | Mailchimp: free one text slot, add the scorecard link, re-save the journey trigger, live test both signup kinds | Matt's Mailchimp login (Google SSO fails on that account) |
| 8 | About, Consultation, Glamping Show (absorbing `aga.html`) | booth number, positioning |
| 9 | Cloudflare Worker + intake extraction + written reads | Anthropic API key, Cloudflare account, Kenny's sample review |
| 10 | Full funnel in GA4 DebugView, then merge to `main` | everything |

Items 1–6 and 8 are code and copy and can run now. Item 7 is a half-day with the Mailchimp login. Item 9 is the only item that can miss the show without the product being incomplete, because the templates stand in for it.
