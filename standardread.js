'use strict';

/* =============================================================
   THE WRITTEN READ — lane two
   Six to eight plain sentences about the person's own project,
   assembled from what the results engine already decided.

   This module INVENTS NOTHING. Every sentence traces to a value the
   engine produced: the score, the stage, the open gates, the top
   finding, the first action, and the count of not sure answers. If
   the engine says nothing about a thing, this file says nothing
   about it either.

   THE BOUNDARY, same as lane one and not negotiable for a licensed
   general contractor: no cost, no schedule, no yield or revenue, no
   ruling on what a jurisdiction will approve. The engine's own copy
   already respects this; keep any edits here inside it.

   Why prose and not just the number. A score out of a hundred reads
   as a test result. A written read of their actual project reads as
   though somebody looked at it, and it is the written read that gets
   forwarded to the civil engineer and the lender.

   DRAFT COPY pending Kenny's pass.
   ============================================================= */

var TPStandardRead = (function () {

  var STAGE_OPEN = [
    'Your answers put this project at the beginning.',
    'Your answers put this project in the middle of the paper work.',
    'Your answers put this project close to the build.'
  ];

  var STAGE_CLOSE = [
    'Settle the land, the guest, and the money, and the rest of the questions get much easier to answer.',
    'Close these on paper now. Every one of them costs more to fix once the work is in the field.',
    'From here the job is holding the schedule, the budget, and the quality all the way to the first guest.'
  ];

  /* One sentence per gate, in the engine's own dependency order. */
  var GATE_LINE = {
    'Site control': 'You do not have the land locked up yet, and that is the one that has to come first.',
    'Guest demand': 'The guest case is not settled yet, and it is the first thing a lender asks about.',
    'Use rights': 'It is not yet confirmed that the county allows this use, which is the most common place projects like this stall.',
    'Utilities': 'Water, sewer, power, and stormwater are still open, and every drawing and every number sits on top of those.',
    'Capital stack': 'The capital stack is not written down yet, so nobody outside the project can check it.',
    'Budget validation': 'Nobody outside the project has checked the budget, which is usually when a number starts to move.'
  };

  function n2w(n) {
    var w = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    return n <= 10 ? w[n] : String(n);
  }

  /* Strip the engine's finding body down to its opening claim, which
     is the plain-language part; the rest is the argument for it.

     Sentences are taken until there are at least sixty characters,
     because some findings open with a very short line. "You control
     the land." on its own reads like a non sequitur in the middle of
     a paragraph about what is still open. */
  function opening(s) {
    var text = String(s || '');
    var out = '';
    var re = /[^.!?]+[.!?]/g;
    var m;
    while ((m = re.exec(text)) !== null) {
      out += m[0];
      if (out.replace(/^\s+/, '').length >= 60) break;
      out += ' ';
    }
    return out.trim() || text;
  }

  /* R:   the TPResults.evaluate() object.
     ctx: optional lane one answers, for the opening description. */
  function compose(R, ctx) {
    var lines = [];
    var stage = R.verdict.stage;

    // 1. Describe the project back before saying anything about it.
    //    People need to see that the thing was listening.
    if (ctx && ctx.type) {
      var t = null, l = null, i;
      for (i = 0; i < TPReadModel.TYPES.length; i++) if (TPReadModel.TYPES[i].id === ctx.type) t = TPReadModel.TYPES[i];
      for (i = 0; i < TPReadModel.LAND.length; i++) if (TPReadModel.LAND[i].id === ctx.land) l = TPReadModel.LAND[i];
      if (t && ctx.size) {
        var count = ctx.size >= 200 ? 'about 200 or more ' + t.unit : 'about ' + ctx.size + ' ' + t.unit;
        lines.push('You are planning a ' + t.noun + ' of ' + count +
          (l ? ' on ' + l.phrase + ' land.' : '.'));
      } else if (t) {
        lines.push('You are planning a ' + t.noun + (l ? ' on ' + l.phrase + ' land.' : '.'));
      }
    }

    // 2. The score, said plainly.
    lines.push('You answered ' + R.answeredCount + ' of the 40 questions, and the answers come to ' +
      R.score + ' points out of 100.');

    // 3. Where that puts them.
    lines.push(STAGE_OPEN[stage]);

    // 4. The gates. These outrank the score, so they read next.
    if (R.openGates.length === 0) {
      lines.push('None of the six critical gates are open, which is not a common result.');
    } else {
      var first = R.openGates[0];
      var extra = R.openGates.length - 1;
      var g = GATE_LINE[first.name] || (first.name + ' is still open.');
      lines.push(g);
      if (extra > 0) {
        lines.push('There ' + (extra === 1 ? 'is one other gate' : 'are ' + n2w(extra) + ' other gates') +
          ' open alongside it: ' +
          R.openGates.slice(1).map(function (x) { return x.name.toLowerCase(); }).join(', ') + '.');
      }
    }

    // 5. The strongest pattern the answers point at.
    if (R.findings.length) {
      lines.push(opening(R.findings[0].body));
    }

    // 6. Not sure is a signal, not a failure. Say so out loud.
    if (R.notSureCount >= 5) {
      lines.push('You marked ' + R.notSureCount + ' answers not sure, which usually means the project is early rather than weak.');
    } else if (R.notSureCount > 0) {
      lines.push('You marked ' + R.notSureCount + ' answers not sure, and those are worth a conversation before they are worth a decision.');
    }

    // 7. What to do first, and where that leaves them.
    if (R.actions.length) lines.push('The first thing to do is straightforward. ' + R.actions[0]);
    lines.push(STAGE_CLOSE[stage]);

    return lines.slice(0, 8);
  }

  return { compose: compose };
})();
