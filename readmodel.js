'use strict';

/* =============================================================
   QUICK SCAN — MODEL
   Everything lane one knows, in one pure module. Screens, scoring,
   the written read, and the carry-forward into Full Assessment.
   No DOM here; read.js renders what this returns.

   TWO HARD RULES, both from the spec and both load-bearing for a
   licensed general contractor:

   1. NO NUMBER. Lane one gives a direction, never a score. A number
      invites an argument about accuracy that ten taps cannot win.

   2. NO ESTIMATES OF ANY KIND. No cost, no schedule, no yield, no
      revenue, no ruling on what a county will approve. Not a range,
      not an order of magnitude. Search this file for a dollar sign
      or a duration and you will not find one. Keep it that way.

   The reads below are TEMPLATES and they are the shipping default.
   When CONFIG.MODEL_PROXY_URL is set, read.js asks the model to
   rewrite the same read in the visitor's own project language, and
   falls back to this text on any failure or timeout. The product
   never depends on a model being up.

   DRAFT COPY: Kenny has not passed on the wording yet. Everything
   below is written to be edited, not to be defended.
   ============================================================= */

var TPReadModel = (function () {

  /* ---------------------------------------------------------------
     SCREEN DATA
     `img` is a basename under assets/read/. `caption` and `credit`
     come from tools/build-images.py and are printed on the card, so
     a stock photograph always says it is one.
     --------------------------------------------------------------- */

  var TYPES = [
    { id: 'campground', label: 'Campground', noun: 'campground', unit: 'sites',
      img: 'type-campground', w: 800, caption: 'Outdoorsy Bayfield, Colorado', credit: 'Ten Point Services' },
    { id: 'rv', label: 'RV resort', noun: 'RV resort', unit: 'sites',
      img: 'type-rv', w: 800, caption: 'Stock photograph', credit: 'Adobe Stock' },
    { id: 'glamping', label: 'Glamping', noun: 'glamping property', unit: 'units',
      img: 'type-glamping', w: 800, caption: 'Lagom Retreat, Dripping Springs, Texas', credit: 'Ten Point Services' },
    { id: 'parkrec', label: 'Park and recreation', noun: 'park and recreation project', unit: 'sites',
      img: 'type-parkrec', w: 800, caption: 'Stock photograph', credit: 'Adobe Stock' }
  ];

  var LAND = [
    { id: 'wooded', label: 'Wooded', phrase: 'wooded',
      img: 'land-wooded', w: 800, caption: 'Outdoorsy Hill Country, Texas', credit: 'Ten Point Services' },
    { id: 'open', label: 'Open ground', phrase: 'open',
      img: 'land-open', w: 800, caption: 'Texas Hill Country', credit: 'Ten Point Services' },
    { id: 'water', label: 'On the water', phrase: 'waterfront',
      img: 'land-water', w: 800, caption: 'Outdoorsy Hill Country, Texas', credit: 'Ten Point Services' },
    { id: 'rocky', label: 'Elevated or rocky', phrase: 'elevated or rocky',
      img: 'land-rocky', w: 800, caption: 'Lagom Retreat, Dripping Springs, Texas', credit: 'Ten Point Services' }
  ];

  /* Stage stops carry line drawings, not photographs. Raw land, a
     signed contract, and a finished drawing set do not read at icon
     size, and the library has no photograph of any of the three.
     Consistent line art is faster to read and raises no question
     about whose project is pictured. */
  var STAGE_ART = [
    // 0 looking
    '<path d="M2 30h36M6 30c3-6 6-9 9-9s6 3 9 9M24 30c2-4 4-6 6-6s4 2 6 6"/><circle cx="30" cy="11" r="5"/><path d="M33.6 14.6 38 19"/>',
    // 1 under contract
    '<path d="M11 5h13l6 6v24H11z"/><path d="M24 5v6h6"/><path d="M15 22h11M15 27h8"/>',
    // 2 own
    '<path d="M6 19 20 8l14 11"/><path d="M10 19v16h20V19"/><path d="M17 35v-9h6v9"/>',
    // 3 approvals underway
    '<path d="M11 5h13l6 6v24H11z"/><path d="M24 5v6h6"/><circle cx="27" cy="27" r="7"/><path d="M24 27l2.2 2.2L30.5 25"/>',
    // 4 drawings done
    '<path d="M5 9h30v22H5z"/><path d="M5 15h30M13 15v16M22 15v16"/><path d="M8 34h24"/>',
    // 5 pricing or building
    '<path d="M8 35V7h16l10 8"/><path d="M8 15h16V7"/><path d="M14 35V24h9v11"/><path d="M28 21v14"/>'
  ];

  var STAGES = [
    { id: 'looking',  label: 'Still looking at land',      sentence: 'You are still looking for the right piece of land.' },
    { id: 'contract', label: 'Land under contract',        sentence: 'You have land under contract.' },
    { id: 'own',      label: 'We own the land',            sentence: 'You own the land.' },
    { id: 'approvals',label: 'Approvals underway',         sentence: 'Your approvals are underway.' },
    { id: 'drawings', label: 'Drawings are done',          sentence: 'Your drawings are done.' },
    { id: 'pricing',  label: 'Pricing or already building',sentence: 'You are pricing the work or already building.' }
  ];

  var MONEY = [
    { id: 'exploring', label: 'Still exploring' },
    { id: 'range',     label: 'We have a range' },
    { id: 'number',    label: 'We have a number' },
    { id: 'committed', label: 'The money is committed' }
  ];

  var DATES = [
    { id: 'none',     label: 'No date yet' },
    { id: 'season',   label: 'A season in mind' },
    { id: 'month',    label: 'A target month' },
    { id: 'promised', label: 'A date we have promised somebody' }
  ];

  var TEAM = [
    { id: 'civil',     label: 'Civil engineer' },
    { id: 'designer',  label: 'Architect or designer' },
    { id: 'lender',    label: 'Lender' },
    { id: 'builder',   label: 'Contractor' },
    { id: 'operator',  label: 'Operator' },
    { id: 'none',      label: 'Nobody yet', exclusive: true }
  ];

  var WORRIES = [
    { id: 'site',     label: 'Whether the land works' },
    { id: 'zoning',   label: 'Getting approvals' },
    { id: 'cost',     label: 'What it will cost' },
    { id: 'money',    label: 'Finding the money' },
    { id: 'team',     label: 'Finding the right builder' },
    { id: 'schedule', label: 'Opening on time' }
  ];


  /* ---------------------------------------------------------------
     CONTEXTUAL NOTES
     One short paragraph shown after an answer, explaining why that
     answer matters. This is the thing that makes the Quick Scan feel
     like it is reading the project back rather than collecting form
     fields, and it is the payoff that arrives before the result.

     NAMED SCAN_NOTES, not FIELD_NOTES. app.js has a global of that
     name holding the ten point-opener lines for the Full Assessment,
     and both files load on the same page. Two different things with
     one name is how a later edit goes wrong.

     THE BOUNDARY APPLIES HERE TOO. These explain what an answer
     implies for the work. They never estimate cost, schedule, yield,
     or what a jurisdiction will allow.

     DRAFT, pending Kenny.
     --------------------------------------------------------------- */
  var SCAN_NOTES = {
    land: {
      wooded: 'Tree cover can create immediate guest value. Access, utility routing, fire review, and selective clearing usually become the early design constraints.',
      open: 'Open ground can simplify visibility and circulation. Shade, wind exposure, drainage, and the cost of creating character deserve early attention.',
      water: 'Water can anchor the guest experience. Floodplain, setbacks, bank stability, and the wastewater strategy are worth settling before the site plan hardens.',
      rocky: 'Elevation creates views and identity. It can also concentrate the work in access, grading, foundations, and getting utilities where they need to go.'
    },
    stage: {
      looking: 'At this stage, site control and a written use determination are worth more than detailed design.',
      contract: 'The contract period is the window to test access, utilities, approvals, and the capital plan, while the land is still a decision rather than a commitment.',
      own: 'Ownership removes one uncertainty. The next job is proving what the ground, the jurisdiction, and the budget can support.',
      approvals: 'Keep design, civil work, and pricing moving against the same approval assumptions, so one change does not quietly orphan the other two.',
      drawings: 'A finished drawing set earns its keep once it has been reconciled with procurement, the schedule, and current pricing.',
      pricing: 'The work now lives in the seams: scope to long lead items, schedule to quality control, and construction to the first day of operating.'
    }
  };

  /* Point names, in the live site's order. Lane one lights a few of
     these and greys the rest. */
  var POINT_NAMES = ['Property Details', 'Capital Strategy', 'Regulatory Approvals',
    'Guest Experience', 'Design', 'Procurement', 'Schedule', 'Cost Certainty',
    'Quality Assurance', 'Opening Readiness'];

  var BAND_NAMES = ['Align', 'Design', 'Build'];
  var BAND_NEXT = [
    'The work in front of you is the groundwork. Settle the land, the guest, and the money before anything gets drawn.',
    'The idea holds up. What is left is paper work: approvals, drawings, and a price you can stand behind.',
    'The big questions look answered. From here the job is holding the schedule, the budget, and the quality all the way to opening day.'
  ];

  /* ---------------------------------------------------------------
     THE GATES
     One short block per gate, two sentences. `gate` is used when the
     answers point at a real open gate. `watch` is used when nothing
     is flagged and we are simply answering the thing they told us
     they were worried about.

     Never negative about the person. A gap is a gap, not a mistake.
     Never a ruling: we say what the pattern points toward and
     suggest looking into it.
     --------------------------------------------------------------- */
  var GATES = {
    control: {
      name: 'land control',
      gate: 'The first thing to settle is the land itself. Until you have it under contract or under option, everything after it is planning rather than a project.',
      watch: 'Keep the land position in writing as you go. A contract or an option is what turns a plan into a project.'
    },
    money: {
      name: 'the capital plan',
      gate: 'The money is the piece most likely to hold this up. You are far enough along that a lender or a partner will want to see where the equity comes from.',
      watch: 'The money question comes up sooner than most people expect. Writing down the sources and the amounts early makes every later conversation shorter.'
    },
    zoning: {
      name: 'use rights',
      gate: 'The thing most likely to stop a project like this is whether the county allows the use at all. A pre-application meeting is the cheapest way to find out, and you leave with the answer in writing.',
      watch: 'Approvals go faster when you start with a pre-application meeting. Ask for the use determination in writing and build the rest of the plan around it.'
    },
    site: {
      name: 'the ground',
      gate: 'Nobody on your team is looking at the ground yet. Water, sewer, power, and stormwater set the shape of the whole project, and they are the answers a civil engineer gives you first.',
      watch: 'Wetlands, soils, access, and utilities are where outdoor projects get surprised. A civil engineer can tell you what the ground allows before the design commits to anything.'
    },
    team: {
      name: 'the team',
      gate: 'You are moving without anyone alongside you yet. The first hire changes what the next year looks like, and for most projects at your stage that is a civil engineer.',
      watch: 'Picking the builder is easier once you know what you are asking them to build. The drawings and the site work come first, and the right builder follows from them.'
    },
    cost: {
      name: 'the price',
      gate: 'You have a drawing set and no firm number behind it. Getting the design priced now, while it is still cheap to change, is what keeps the budget from moving later.',
      watch: 'The honest answer on cost comes from pricing your actual drawings on your actual site. Ask for that as soon as the design is far enough along to price.'
    },
    schedule: {
      name: 'the date',
      gate: 'You have promised somebody a date, and the work in front of you is not sequenced yet. Approvals and long lead items run on somebody else’s clock, so those two come first.',
      watch: 'Opening dates hold when the approvals and the long lead items are mapped first. Those two set the calendar, and the build fits inside what is left.'
    },
    guest: {
      name: 'the guest',
      gate: 'The guest is the piece worth settling early. Who they are and whether they already come to the area is the first question every lender asks.',
      watch: 'Keep the guest in front of every other decision. Unit mix, price, and amenities are all guest questions wearing design clothes.'
    }
  };

  /* Ordered most likely to stop a project first. */
  var GATE_ORDER = ['control', 'money', 'zoning', 'site', 'team', 'cost', 'schedule', 'guest'];

  /* ---------------------------------------------------------------
     EVALUATION
     answers: { type, land, stage, compare, size, money, date,
                team: [ids], worry }
     --------------------------------------------------------------- */

  function idx(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return i;
    return -1;
  }

  function hasTeam(a, id) {
    return !!(a.team && a.team.indexOf(id) !== -1);
  }

  function bandOf(a) {
    var s = idx(STAGES, a.stage);
    if (s < 0) s = 0;
    var band = s <= 1 ? 0 : s <= 3 ? 1 : 2;

    // Two honest downgrades. Never an upgrade: ten taps cannot earn
    // a person more confidence than their answers support.
    if (s >= 2 && a.money === 'exploring') band -= 1;
    if (s >= 3 && hasTeam(a, 'none')) band -= 1;
    return Math.max(0, Math.min(2, band));
  }

  /* Which of the ten points lane one has any read on at all. Four
     always, plus Design and Schedule when there is real evidence.
     Everything else stays grey and says so. */
  function litPoints(a) {
    var lit = { 0: true, 1: true, 2: true, 3: true };
    var s = idx(STAGES, a.stage);
    if (s >= 4 || hasTeam(a, 'designer') || hasTeam(a, 'civil')) lit[4] = true;
    var d = idx(DATES, a.date);
    if (d >= 2) lit[6] = true;
    return lit;
  }

  /* Every gate the answers actually trigger, most serious first. */
  function derivedGates(a) {
    var s = idx(STAGES, a.stage);
    var d = idx(DATES, a.date);
    var m = idx(MONEY, a.money);
    var out = [];
    if (s === 0) out.push('control');
    if (m === 0 && s >= 2) out.push('money');
    if (s <= 2) out.push('zoning');
    if (!hasTeam(a, 'civil') && s >= 2) out.push('site');
    if (hasTeam(a, 'none')) out.push('team');
    if (s >= 4 && m <= 1) out.push('cost');
    if (d === 3 && s <= 3) out.push('schedule');
    out.sort(function (x, y) { return GATE_ORDER.indexOf(x) - GATE_ORDER.indexOf(y); });
    return out;
  }

  /* The one gate the read names. If the visitor's own worry is also
     a triggered gate, name that one: they already suspect it, and
     confirming it is worth more than surprising them with something
     else. Otherwise name the most serious triggered gate. */
  function chooseGate(a) {
    var derived = derivedGates(a);
    var worry = a.worry || null;
    if (worry && derived.indexOf(worry) !== -1) return { key: worry, mode: 'gate', confirmed: true };
    if (derived.length) return { key: derived[0], mode: 'gate', confirmed: false };
    if (worry) return { key: worry, mode: 'watch', confirmed: true };
    return { key: 'guest', mode: 'watch', confirmed: false };
  }

  function sizePhrase(a) {
    var t = TYPES[Math.max(0, idx(TYPES, a.type))];
    if (!a.size) return '';
    if (a.size >= 200) return 'about 200 or more ' + t.unit;
    return 'about ' + a.size + ' ' + t.unit;
  }

  /* Three or four sentences. Describe the project back first: people
     need to see that the thing was listening before they will read
     anything it says. */
  function writtenRead(a) {
    var t = TYPES[Math.max(0, idx(TYPES, a.type))];
    var l = LAND[Math.max(0, idx(LAND, a.land))];
    var s = STAGES[Math.max(0, idx(STAGES, a.stage))];
    var band = bandOf(a);
    var g = chooseGate(a);

    var lines = [];
    var size = sizePhrase(a);
    if (size) lines.push('You are planning a ' + t.noun + ' of ' + size + ' on ' + l.phrase + ' land.');
    else lines.push('You are planning a ' + t.noun + ' on ' + l.phrase + ' land.');
    lines.push(s.sentence);
    lines.push(GATES[g.key][g.mode]);
    lines.push(BAND_NEXT[band]);
    return lines;
  }

  function evaluate(a) {
    var band = bandOf(a);
    var lit = litPoints(a);
    var g = chooseGate(a);
    var segments = [];
    for (var i = 0; i < 10; i++) {
      segments.push({
        n: (i + 1 < 10 ? '0' : '') + (i + 1),
        label: POINT_NAMES[i],
        state: lit[i] ? 'directional' : 'unscored'
      });
    }
    var greyCount = 0;
    for (i = 0; i < 10; i++) if (!lit[i]) greyCount++;

    return {
      band: band,
      bandName: BAND_NAMES[band],
      segments: segments,
      litCount: 10 - greyCount,
      greyCount: greyCount,
      gateKey: g.key,
      gateName: GATES[g.key].name,
      gateConfirmed: g.confirmed,
      worry: a.worry || '',
      lines: writtenRead(a)
    };
  }

  /* ---------------------------------------------------------------
     CARRY-FORWARD
     Which of the forty questions lane one has genuinely answered.

     Deliberately short. A tap on a photograph is not the same claim
     as a yes to a written question, and pre-filling a critical gate
     from a soft signal would hand somebody a pass they did not earn.
     Only equivalences that hold on their own are here. Every one is
     shown back on the first screen of lane two with an edit link, so
     nothing is silently assumed.

     Keys are app.js's answer keys: "<pointIndex>-<questionIndex>".
     --------------------------------------------------------------- */
  /* CARRY IS RETIRED.
     The Quick Scan used to hand its answers to the Full Assessment,
     which filled them in and tagged them "From your Quick Scan".

     The Quick Scan is six experience questions now — who this is for,
     what longing it answers, what the land does — and none of that
     maps onto the forty delivery questions. "Who are you building
     for" is not evidence about a legal boundary or a stress-tested
     cash flow, and pretending otherwise would put answers into a
     scored assessment that nobody gave.

     It returns an empty list rather than being deleted, so app.js's
     loadCarry() keeps working and the tag, the confirmation screen
     and the skipped-question count simply never fire.

     The old body mapped stage/money/team onto keys 1-1, 1-2, 7-3 and
     others; it is in git history at 8717b17 if the lane ever needs to
     feed the assessment again. */
  function carry() {
    return [];
  }

  /* extractLocal() stood here.

     It took the free sentence somebody typed on the old intake screen
     and tried to pull a project type, a land type, a stage, a unit
     count, an acreage, a budget posture and a state out of it — with
     about thirty regexes and no model behind them in production
     (CONFIG.MODEL_PROXY_URL is empty). The land test alone needed one
     of sixteen specific words: "wooded", "waterfront", "mesa",
     "prairie" and so on. Type "rolling hill country with a creek
     through the middle" and it matched nothing.

     That would have been fine if the screen had said so. It did not.
     It pre-filled what it hit, printed "We picked this up from what
     you wrote" over those fields, and for everything it missed showed
     its own default silently — so the same answer came back no matter
     what anybody typed, while the page implied it had read them.

     The intake box is gone, so this is gone. Nothing on the Quick
     Scan interprets what a person writes any more. If reading a
     sentence comes back, it reads it with a model, says that it did,
     and shows what it understood before anything counts.
     Removed 2026-09-10; body at 8717b17. */

  /* STATE_NAMES and matchState() went with extractLocal: they only
     existed to guess a state out of the retired intake sentence. */

  return {
    TYPES: TYPES, LAND: LAND, STAGES: STAGES, STAGE_ART: STAGE_ART,
    SCAN_NOTES: SCAN_NOTES,
    MONEY: MONEY, DATES: DATES, TEAM: TEAM, WORRIES: WORRIES,
    POINT_NAMES: POINT_NAMES, BAND_NAMES: BAND_NAMES, GATES: GATES,
    evaluate: evaluate, carry: carry,
    bandOf: bandOf, chooseGate: chooseGate
  };
})();
