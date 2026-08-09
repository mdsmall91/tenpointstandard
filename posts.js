'use strict';

/* =============================================================
   THE JOURNAL — CONTENT MODEL
   Canonical, copied from the design handoff (Field Guide Journal
   v2). One source of truth for the index grid, the filter counts,
   and any future related-post logic.

   The article pages under journal/ are static HTML and do NOT
   read from this file at runtime — that is deliberate, so a
   crawler sees the full text of every entry with JS disabled.
   When you edit an entry here, edit its journal/<slug>.html to
   match. The check in tests/ enforces that they agree.
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
   Entries, newest first. POSTS[0] is the featured entry.

   hero / author.photo are null until the photography lands. The
   renderer keeps the captioned placeholder block in that case —
   never a color fill or an icon (handoff, "Imagery"). Drop the
   file at the documented path and set the field to that path.

   heroAspect drives the tile height, which is what produces the
   masonry rhythm. It is never randomized at runtime.

   body is present only where the copy is written. An entry with
   no body renders the pending block and carries noindex.
   ------------------------------------------------------------- */
var POSTS = [
  {
    slug: 'absorption-curve',
    tag: 'Feasibility',
    title: 'The absorption curve nobody underwrites',
    dek: 'Most outdoor-resort models assume stabilization in year two. The projects that get there share three things, and none of them are in the pro forma.',
    hero: null,                                    // assets/journal/absorption-curve/hero.jpg
    heroAspect: '16/9',
    heroNote: 'Hero photo — site at first light, 16:9, 2400px min',
    heroCaption: 'Photograph: client-supplied field documentation. Caption goes here.',
    author: {
      name: 'Kenny Reed',
      credential: 'Principal, Ten Point Services',
      photo: null,                                 // assets/journal/absorption-curve/author.jpg
      bio: "Twenty-two years across resort development and operations in Texas and the Mountain West. Leads Ten Point's preconstruction audit practice."
    },
    publishedAt: '2026-07-28',
    readTime: '9 min read',
    featured: true,
    body: [
      { type: 'para', text: 'The first operating year of an outdoor resort is not a smaller version of the third. It is a different business, run by a different number of people, against a demand curve that has not yet formed. Underwriting it as a discount to stabilization is the most common error we find in preconstruction audit.' },
      { type: 'para', text: 'Across the projects Ten Point has reviewed since 2021, the ones that hit their year-two occupancy target shared three characteristics. None appeared in the financial model. All three were decisions made before the first pad was graded.' },
      { type: 'head', text: 'One: the arrival radius was tested, not assumed' },
      { type: 'para', text: 'Drive-time catchment gets treated as a mapping exercise. It is a behavioral one. A ninety-minute radius that crosses a metro edge on a Friday afternoon is not a ninety-minute radius. Operators who drove the route at the hour guests actually leave consistently forecast a tighter and more accurate market than those who accepted the isochrone.' },
      { type: 'quote', text: 'The model said two hours. The guests said an hour and ten. We built for the model and spent year one correcting it.', attrib: 'Owner, 210-site property, Hill Country' },
      { type: 'head', text: 'Two: staffing scaled behind occupancy, not ahead of it' },
      { type: 'para', text: 'The instinct is to staff for the season you hope to have. The properties that stabilized on schedule staffed to the reservations on the books, with a named plan for adding a shift inside seventy-two hours. That plan is worth writing down, and worth rehearsing before opening week, when nobody has the attention left to invent it.' },
      { type: 'para', text: 'This is not a labor-cost argument. It is a service-consistency argument. An overstaffed shoulder month teaches a crew habits that break the first time the property is full.' },
      { type: 'head', text: 'Three: the operating reserve survived value engineering' },
      { type: 'para', text: 'When a project runs over on hard costs, the operating reserve is the quietest place to find money. It is also the only line item that determines whether year one is recoverable. Every project we have audited that cut its reserve below four months of fixed operating cost spent year two in conversation with its lender rather than with its guests.' },
      { type: 'para', text: 'None of this is exotic. It is the discipline of deciding things early, in writing, while the decisions are still cheap. That is the whole of the practice.' }
    ]
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
    body: null
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
    body: null
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
    body: null
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
    body: null
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
    body: null
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
    body: null
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
    body: null
  }
];
