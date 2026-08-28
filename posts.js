'use strict';

/* =============================================================
   THE FIELD JOURNAL — CONTENT MODEL
   Canonical metadata for every entry. One source of truth for the
   index grid, the filter, the sitemap, the feed, and any future
   related-post logic.

   The article pages under journal/ are static HTML and do NOT read
   from this file at runtime — that is deliberate, so a crawler sees
   the full text of every entry with JS disabled.

   Article BODY COPY lives only in the page. It used to be mirrored
   here as a block array, which meant maintaining two copies of
   every paragraph; at 2,000 words an entry that is a drift risk,
   not a safeguard. The tests in tests/journal-tests.html check that
   the metadata below matches the page exactly, and that a published
   page carries a substantial body — they no longer diff prose.
   ============================================================= */

/* Fixed enum. Adding a tag is a code change on purpose: it keeps
   the filter to a single row, which is the whole design premise.
   These are the six Ten Point service stages. */
var TAGS = [
  'Feasibility',
  'Capital',
  'Land & Entitlement',
  'Construction',
  'Operations',
  'Guest Experience'
];

/* URL form of a tag: /journal.html?tag=land-entitlement */
function tagSlug(tag) {
  return tag.toLowerCase().replace(/&/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* -------------------------------------------------------------
   Entries, newest first. POSTS[0] is the featured entry and must
   not be a draft.

   draft: true means the copy is not written. A draft has NO tile,
   NO page, NO sitemap entry and NO feed item — it is held back
   entirely rather than published thin. Its metadata stays here so
   the entry is ready the moment the copy lands.

   hero is null until the photography lands. The renderer keeps the
   captioned placeholder block in that case — never a color fill or
   an icon (handoff, "Imagery"). There are no author photographs
   anywhere: the byline is type only.

   author.credential is the job title. author.company, when set,
   renders on its own line beneath it.

   heroAspect drives the tile height, which is what produces the
   masonry rhythm. It is never randomized at runtime.

   metaDescription is optional. The dek is the on-page standfirst
   and is often short; where a longer, search-facing sentence is
   wanted, set it here and the page's meta description uses it.
   ------------------------------------------------------------- */
var POSTS = [
  {
    slug: 'nature-first',
    tag: 'Land & Entitlement',
    title: 'Nature Should Be Your First Amenity',
    dek: 'Why the best outdoor hospitality projects start with the land.',
    metaDescription: 'Outdoor hospitality projects often make their first expensive mistake before construction begins: treating raw land as something to clear instead of something to understand. How to plan a site so the land does real work for the guest experience and the budget.',
    hero: 'assets/journal/nature-first/hero.jpg',
    heroAlt: 'A cabin on a Texas Hill Country ridgeline at sunrise, framed by live oaks with a valley of native brush below',
    heroAspect: '3/2',
    heroCaption: 'Photograph: Ten Point Services and RVi.',
    author: {
      name: 'Kenny Reed & Matt Small',
      credential: 'Principal & Director of Outdoor Hospitality',
      company: 'Ten Point Services & RVi Planning & Landscape Architecture',
      bio: null
    },
    publishedAt: '2026-08-28',
    readTime: '6 min read',
    featured: true
  },
  {
    slug: 'built-for-the-stay',
    tag: 'Construction',
    title: 'Build for the Stay, Not Just the Inspection',
    dek: 'Why hospitality-first construction protects the guest experience, operating budget, and the next phase of growth.',
    metaDescription: 'Building code and a final inspection prove a project can open. They do not prove it can be staffed, cleaned, maintained, and expanded without workarounds — here is what hospitality-first construction changes before the drawings are locked.',
    hero: 'assets/journal/built-for-the-stay/hero.jpg',
    heroAlt: 'Guest cabins glowing at dusk along a lit gravel path beneath a live oak',
    heroAspect: '16/9',
    heroCaption: 'Photograph: Ten Point Services.',
    author: {
      name: 'Kenny Reed',
      credential: 'Principal',
      company: 'Ten Point Services',
      bio: null
    },
    publishedAt: '2026-08-28',
    readTime: '7 min read',
    featured: false
  },
  {
    slug: 'entitlements',
    tag: 'Land & Entitlement',
    title: 'Entitlements',
    dek: 'Outdoor hospitality owners should have a strategy.',
    metaDescription: 'Entitlements are what you are allowed to do on a parcel. The gray-zone years are ending — how to build an entitlement strategy for a campground, RV resort, or glamping project.',
    hero: 'assets/journal/entitlements/hero.jpg',  // 2400x1350, cropped 16:9 from AdobeStock_804965078
    heroAlt: 'A lit safari tent glowing under the Milky Way in a eucalyptus clearing at night',
    heroAspect: '16/9',
    heroCaption: 'Photograph: Adobe Stock.',
    author: {
      name: 'Matt Small',
      credential: 'Director of Outdoor Hospitality',
      company: 'RVi Planning & Landscape Architecture',
      bio: null                                    // not supplied — author card renders without it
    },
    publishedAt: '2026-08-09',
    readTime: '9 min read',
    featured: false
  },
  {
    /* Sample copy that shipped with the Claude Design handoff, under
       a byline nobody has confirmed. Held as a draft rather than
       published: it reads as a real article by a real person and
       was written by neither. Delete it or replace the copy and the
       byline before this ever goes live. */
    slug: 'absorption-curve',
    tag: 'Feasibility',
    title: 'The absorption curve nobody underwrites',
    dek: 'Most outdoor-resort models assume stabilization in year two. The projects that get there share three things, and none of them are in the pro forma.',
    hero: null,
    heroAspect: '16/9',
    heroNote: 'Hero photo — site at first light, 16:9, 2400px min',
    heroCaption: 'Photograph: client-supplied field documentation. Caption goes here.',
    author: {
      name: 'Kenny Reed',
      credential: 'Principal, Ten Point Services',
      photo: null,
      bio: "Twenty-two years across resort development and operations in Texas and the Mountain West. Leads Ten Point's preconstruction audit practice."
    },
    publishedAt: '2026-07-28',
    readTime: '9 min read',
    featured: false,
    draft: true
  },
  {
    slug: 'lender-reads-first',
    tag: 'Capital',
    title: 'What a lender actually reads first',
    dek: 'A credit officer spends eleven minutes with your package before forming a view. Here is the order they read it in.',
    hero: null,
    heroAspect: '4/5',
    heroNote: 'Photo — loan package on a desk, 4:5',
    heroCaption: 'Photograph: client-supplied field documentation.',
    author: {
      name: 'Dana Whitfield',
      credential: 'SVP Credit, regional bank',
      photo: null,
      bio: 'Underwrites hospitality and recreation credits across the Southwest. Has closed forty-one outdoor-resort loans since 2018.'
    },
    publishedAt: '2026-07-14',
    readTime: '7 min read',
    featured: false,
    draft: true
  },
  {
    slug: 'utility-routing',
    tag: 'Construction',
    title: 'Utility routing is the schedule',
    dek: 'On six of the last eight projects we audited, the critical path ran through a dry utility easement drawn late and negotiated later.',
    hero: null,
    heroAspect: '3/2',
    heroNote: 'Photo — trenching, wide, 3:2',
    heroCaption: 'Photograph: client-supplied field documentation.',
    author: {
      name: 'Marcus Oyelaran',
      credential: 'Site superintendent, 19 years',
      photo: null,
      bio: 'Runs vertical and horizontal construction for outdoor hospitality developments across four states.'
    },
    publishedAt: '2026-06-30',
    readTime: '11 min read',
    featured: false,
    draft: true
  },
  {
    slug: 'shoulder-season-staffing',
    tag: 'Operations',
    title: 'Staffing for a season you cannot forecast',
    dek: 'The shoulder-season labor model is the single largest controllable variance in a first operating year.',
    hero: null,
    heroAspect: '1/1',
    heroNote: 'Photo — morning shift meeting, 1:1',
    heroCaption: 'Photograph: client-supplied field documentation.',
    author: {
      name: 'Renata Alvarez',
      credential: 'General manager, 240-site resort',
      photo: null,
      bio: 'Opened and stabilized three properties. Writes about the operating consequences of development decisions.'
    },
    publishedAt: '2026-06-18',
    readTime: '6 min read',
    featured: false,
    draft: true
  },
  {
    slug: 'reading-a-county',
    tag: 'Land & Entitlement',
    title: 'Reading a county before you read the site',
    dek: 'Zoning tells you what is permitted. The last four commissioners’ meetings tell you what is possible.',
    hero: null,
    heroAspect: '3/2',
    heroNote: 'Photo — county plat map detail, 3:2',
    heroCaption: 'Photograph: client-supplied field documentation.',
    author: {
      name: 'Paul Steinhauer',
      credential: 'Land planner, AICP',
      photo: null,
      bio: 'Entitles recreation and residential land in jurisdictions with no precedent for either.'
    },
    publishedAt: '2026-06-02',
    readTime: '8 min read',
    featured: false,
    draft: true
  },
  {
    slug: 'arrival-sequence',
    tag: 'Guest Experience',
    title: 'The arrival sequence is the product',
    dek: 'Guests decide how they feel about a property in the ninety seconds between the gate and the pad. Most sites spend nothing there.',
    hero: null,
    heroAspect: '4/5',
    heroNote: 'Photo — gatehouse at dusk, 4:5',
    heroCaption: 'Photograph: client-supplied field documentation.',
    author: {
      name: 'Ines Bardot',
      credential: 'Hospitality designer',
      photo: null,
      bio: 'Designs arrival, wayfinding, and common-space sequences for resort properties.'
    },
    publishedAt: '2026-05-21',
    readTime: '5 min read',
    featured: false,
    draft: true
  },
  {
    slug: 'patient-equity',
    tag: 'Capital',
    title: 'Equity that understands seasonality',
    dek: 'Not all capital is patient in the same places. A partner who tolerates a slow year two may not tolerate a slow month six.',
    hero: null,
    heroAspect: '3/2',
    heroNote: 'Photo — meeting room, 3:2',
    heroCaption: 'Photograph: client-supplied field documentation.',
    author: {
      name: 'Dana Whitfield',
      credential: 'SVP Credit, regional bank',
      photo: null,
      bio: 'Underwrites hospitality and recreation credits across the Southwest.'
    },
    publishedAt: '2026-05-09',
    readTime: '7 min read',
    featured: false,
    draft: true
  },
  {
    slug: 'comparable-sets',
    tag: 'Feasibility',
    title: 'Comparable sets that actually compare',
    dek: 'A property forty miles away with a different drive-time catchment is not a comp. It is a coincidence.',
    hero: null,
    heroAspect: '1/1',
    heroNote: 'Photo — regional map on a tailgate, 1:1',
    heroCaption: 'Photograph: client-supplied field documentation.',
    author: {
      name: 'Kenny Reed',
      credential: 'Principal, Ten Point Services',
      photo: null,
      bio: "Leads Ten Point's preconstruction audit practice."
    },
    publishedAt: '2026-04-24',
    readTime: '6 min read',
    featured: false,
    draft: true
  }
];
