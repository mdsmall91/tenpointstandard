'use strict';

/* =============================================================
   THE QUICK SCAN CARDS
   =============================================================

   Six cards, drawn from the RVi Experience Builder deck. The old
   Quick Scan asked what somebody was building — type, land, unit
   count, stage — which implied the work starts with a product
   decision. It does not, and that is not how Ten Point approaches a
   project. These six ask who it is for and what it is meant to do.

   THIS LANE NO LONGER FEEDS THE FULL ASSESSMENT. It used to carry
   answers forward and mark them "From your Quick Scan". Experience
   questions do not map onto the forty delivery questions — "who are
   you building for" does not answer "do you have a legal boundary" —
   so nothing here is carried, and readmodel.carry() returns nothing.

   NOTHING HERE READS WHAT SOMEBODY TYPED. The old intake box claimed
   to have picked details up out of a free-text sentence. It was a
   regex over about thirty keywords, with no model behind it in
   production, and it silently showed a default whenever it missed.
   The claim is gone with the box. What a person types on a card is
   theirs; we quote it back and never interpret it.

   THE FOURTH OPTION IS ALWAYS "I DO NOT KNOW YET". It is on every
   card on purpose. For a project this early it is often the honest
   answer, and it is the most useful thing this scan can surface.

   PHONE FIRST. This runs at a trade show, on a phone, standing up,
   one-handed. One card per screen, one photograph, four large
   targets. No sliders, no multi-select, no typing required.
   ============================================================= */

var TPScanCards = (function () {

  /* Photography is from the existing Ten Point project library.
     `img` is the 800px webp; every one of these is a real project. */
  var CARDS = [
    {
      id: 'guest',
      eyebrow: 'Target guest',
      question: 'Who discovers their perfect escape here?',
      img: '/assets/points/04-guests-1400.webp',
      options: [
        { id: 'city',    label: 'Somebody escaping a week they are sick of',
          reflect: 'somebody escaping a week they are sick of' },
        { id: 'family',  label: 'A family building a tradition they will repeat',
          reflect: 'a family building a tradition' },
        { id: 'place',   label: 'A traveller who came for the place, not the room',
          reflect: 'a traveller who came for the place itself' },
        { id: 'unknown', label: 'I do not know yet' }
      ]
    },
    {
      id: 'longing',
      eyebrow: 'The invitation',
      question: 'What longing are you answering?',
      img: '/assets/points/02-capital-1400.webp',
      options: [
        { id: 'quiet',   label: 'Quiet. Room to hear yourself think.',
          reflect: 'the need for quiet' },
        { id: 'together',label: 'Time together, without the usual interruptions',
          reflect: 'time together without interruption' },
        { id: 'adventure',label: 'Something to tell people about afterwards',
          reflect: 'a story worth telling afterwards' },
        { id: 'unknown', label: 'I do not know yet' }
      ]
    },
    {
      id: 'place',
      eyebrow: 'Authentic place',
      question: 'How does your land shape your story?',
      img: '/assets/points/01-property-1400.webp',
      options: [
        { id: 'feature', label: 'One feature everybody will remember',
          reflect: 'a single feature nobody forgets' },
        { id: 'quiet',   label: 'Nothing dramatic. It is the calm that sells it.',
          reflect: 'calm rather than drama' },
        { id: 'position',label: 'Where it sits. What it is close to.',
          reflect: 'its position and what it is near' },
        { id: 'unknown', label: 'I do not know yet' }
      ]
    },
    {
      id: 'signature',
      eyebrow: 'Signature experiences',
      question: 'What happens here that happens nowhere else?',
      img: '/assets/read/land-water-1400.webp',
      options: [
        { id: 'guided',  label: 'Something we run, on a schedule, with our people',
          reflect: 'something you run yourself' },
        { id: 'built',   label: 'Something we built that nobody else has',
          reflect: 'something built that nobody else has' },
        { id: 'land',    label: 'Something the land does that we just get out of the way of',
          reflect: 'something the land already does' },
        { id: 'unknown', label: 'I do not know yet' }
      ]
    },
    {
      id: 'memory',
      eyebrow: 'Forever memory',
      question: 'What will they still be talking about in ten years?',
      img: '/assets/points/10-opening-1365.webp',
      options: [
        { id: 'moment',  label: 'One moment. They will know the exact one.',
          reflect: 'one specific moment' },
        { id: 'feeling', label: 'Not a moment. How the whole place made them feel.',
          reflect: 'how the whole place felt' },
        { id: 'people',  label: 'Who they were with, and that we made room for it',
          reflect: 'who they were with' },
        { id: 'unknown', label: 'I do not know yet' }
      ]
    },
    {
      id: 'return',
      eyebrow: 'Return journey',
      question: 'What whispers "come back"?',
      img: '/assets/read/land-wooded-1400.webp',
      options: [
        { id: 'season',  label: 'A different season. It is a different place in October.',
          reflect: 'a season they have not seen yet' },
        { id: 'unfinished', label: 'Something they did not get to this time',
          reflect: 'something they did not get to' },
        { id: 'welcome', label: 'Being known by name when they walk back in',
          reflect: 'being known by name' },
        { id: 'unknown', label: 'I do not know yet' }
      ]
    }
  ];

  function card(id) {
    for (var i = 0; i < CARDS.length; i++) if (CARDS[i].id === id) return CARDS[i];
    return null;
  }
  function option(cardId, optId) {
    var c = card(cardId);
    if (!c) return null;
    for (var i = 0; i < c.options.length; i++) if (c.options[i].id === optId) return c.options[i];
    return null;
  }

  /* -------------------------------------------------------------
     THE REFLECTION
     Built from what somebody chose, in their order, and from
     nothing else. It makes no claim about readiness, gives no
     score, and never describes a project it was not told about.

     Every sentence here is assembled from the `reflect` fragments
     above. There is no model behind it and it does not pretend
     there is: it is their own six answers, read back in order, so
     the shape of what they have decided — and what they have not —
     is visible in one paragraph.
     ------------------------------------------------------------- */
  function reflect(answers) {
    var known = [], unknown = [];
    for (var i = 0; i < CARDS.length; i++) {
      var c = CARDS[i], picked = answers[c.id];
      if (!picked || picked === 'unknown') { unknown.push(c); continue; }
      var o = option(c.id, picked);
      if (o && o.reflect) known.push({ card: c, text: o.reflect });
    }

    var lines = [];

    if (!known.length) {
      lines.push('You went through all six and did not settle on one of them, ' +
        'which is a real answer this early. It means the project is still a site ' +
        'and a budget rather than a guest and a promise, and that is the order ' +
        'most projects actually go in.');
      return { lines: lines, known: known, unknown: unknown };
    }

    /* Sentence one: the guest and the longing, when both are known,
       because together they are the whole positioning. */
    var g = find(known, 'guest'), l = find(known, 'longing');
    if (g && l) {
      lines.push('You are building for ' + g + ', and what you are answering is ' + l + '.');
    } else if (g) {
      lines.push('You are building for ' + g + '.');
    } else if (l) {
      lines.push('What you are answering is ' + l + '.');
    }

    var p = find(known, 'place'), s = find(known, 'signature');
    if (p && s) {
      lines.push('The land carries it through ' + p + ', and what happens here that ' +
        'happens nowhere else is ' + s + '.');
    } else if (p) {
      lines.push('The land carries it through ' + p + '.');
    } else if (s) {
      lines.push('What happens here that happens nowhere else is ' + s + '.');
    }

    var m = find(known, 'memory'), r = find(known, 'return');
    if (m && r) {
      lines.push('What they keep is ' + m + ', and what brings them back is ' + r + '.');
    } else if (m) {
      lines.push('What they keep is ' + m + '.');
    } else if (r) {
      lines.push('What brings them back is ' + r + '.');
    }

    /* What is not settled, named plainly. This is the useful half. */
    if (unknown.length === 1) {
      lines.push('The one you did not settle is ' + unknown[0].eyebrow.toLowerCase() +
        ': ' + lower(unknown[0].question) + ' That is where the next conversation starts.');
    } else if (unknown.length > 1) {
      lines.push('You left ' + word(unknown.length) + ' open: ' +
        list(unknown.map(function (c) { return c.eyebrow.toLowerCase(); })) +
        '. Those are the ones worth an hour with somebody who has built this before.');
    } else {
      lines.push('You settled all six, which is further than most projects get ' +
        'before the drawings start. The work now is holding them through design, ' +
        'procurement and opening, which is what the Full Assessment is for.');
    }

    return { lines: lines, known: known, unknown: unknown };
  }

  function find(known, id) {
    for (var i = 0; i < known.length; i++) if (known[i].card.id === id) return known[i].text;
    return null;
  }
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function word(n) {
    return ['none', 'one', 'two', 'three', 'four', 'five', 'six'][n] || String(n);
  }
  function list(items) {
    if (items.length === 1) return items[0];
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  }

  return { CARDS: CARDS, card: card, option: option, reflect: reflect };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = TPScanCards;
