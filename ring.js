'use strict';

/* =============================================================
   TEN POINT — THE RING
   Ten segments, one per point. The single shared visual across both
   lanes: Quick Scan lights a few and greys the rest, Full Assessment
   fills all ten. Same component, same geometry, same order, so a
   person who did lane one recognises their own ring in lane two.

   Segment states:
     scored       filled in proportion to the point's score
     directional  lane one has a read on this point, no number
     unscored     grey, and labelled "not yet scored"

   The grey is deliberate. It makes the gap visible, and the visible
   gap is what earns the second lane.

   ACCESSIBILITY. State is never carried by colour alone. Every ring
   ships with a text legend that names each point and its state, the
   SVG carries a full aria-label, and the legend is real text a
   screen reader walks. Callers must render legend() next to svg().
   ============================================================= */

var TPRing = (function () {

  var GAP_DEG = 3.2;
  var SEG_DEG = 36;

  function polar(cx, cy, r, deg) {
    var rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  /* An annular arc as a closed path, so it can be filled rather than
     stroked. Stroked arcs round their caps at different rates on
     different browsers; a filled band is identical everywhere. */
  function arc(cx, cy, rOuter, rInner, startDeg, endDeg) {
    if (endDeg - startDeg < 0.01) return '';
    var large = (endDeg - startDeg) > 180 ? 1 : 0;
    var o1 = polar(cx, cy, rOuter, startDeg);
    var o2 = polar(cx, cy, rOuter, endDeg);
    var i2 = polar(cx, cy, rInner, endDeg);
    var i1 = polar(cx, cy, rInner, startDeg);
    return 'M' + f(o1.x) + ' ' + f(o1.y) +
      ' A' + f(rOuter) + ' ' + f(rOuter) + ' 0 ' + large + ' 1 ' + f(o2.x) + ' ' + f(o2.y) +
      ' L' + f(i2.x) + ' ' + f(i2.y) +
      ' A' + f(rInner) + ' ' + f(rInner) + ' 0 ' + large + ' 0 ' + f(i1.x) + ' ' + f(i1.y) +
      ' Z';
  }

  function f(n) { return Math.round(n * 100) / 100; }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* segments: ten objects, in point order.
       { n: '01', label: 'Property Details',
         state: 'scored' | 'directional' | 'unscored',
         fill: 0..1,          // scored only
         score: 9, max: 12,   // scored only, for the legend
         gateOpen: bool }
     center: { top: 'DIRECTIONAL', main: 'Design', sub: '5 of 10 scored' }
  */
  function svg(opts) {
    var segs = opts.segments || [];
    var size = opts.size || 280;
    var cx = size / 2, cy = size / 2;
    var rOuter = size / 2 - 2;
    var band = opts.band || Math.round(size * 0.085);
    var rInner = rOuter - band;

    var body = '';
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      var start = i * SEG_DEG + GAP_DEG / 2;
      var end = (i + 1) * SEG_DEG - GAP_DEG / 2;

      // Track. Unscored points read as a hollow outline, not a fill,
      // so "no data" and "a score of zero" cannot be confused.
      var trackCls = s.state === 'unscored' ? 'tpr-track tpr-track-empty' : 'tpr-track';
      body += '<path class="' + trackCls + '" d="' + arc(cx, cy, rOuter, rInner, start, end) + '"></path>';

      if (s.state === 'scored') {
        var frac = Math.max(0, Math.min(1, s.fill || 0));
        if (frac > 0) {
          body += '<path class="tpr-fill' + (s.gateOpen ? ' tpr-gate' : '') + '" d="' +
            arc(cx, cy, rOuter, rInner, start, start + (end - start) * frac) + '"></path>';
        }
      } else if (s.state === 'directional') {
        // A directional read is a half-height band: present, but not a number.
        var mid = (rOuter + rInner) / 2;
        body += '<path class="tpr-dir" d="' +
          arc(cx, cy, mid + band * 0.18, mid - band * 0.18, start, end) + '"></path>';
      }

      // Point number, outside the ring is too tight at this size, so
      // it sits centred inside its own segment band.
      var lp = polar(cx, cy, (rOuter + rInner) / 2, (start + end) / 2);
      body += '<text class="tpr-num' + (s.state === 'unscored' ? ' tpr-num-empty' : '') +
        '" x="' + f(lp.x) + '" y="' + f(lp.y) + '" dy="0.34em">' + esc(s.n) + '</text>';
    }

    var c = opts.center || {};
    var textY = cy;
    var centre = '';
    if (c.top) centre += '<text class="tpr-c-top" x="' + cx + '" y="' + f(textY - size * 0.115) + '">' + esc(c.top) + '</text>';
    if (c.main) centre += '<text class="tpr-c-main" x="' + cx + '" y="' + f(textY + size * 0.035) + '">' + esc(c.main) + '</text>';
    if (c.sub) centre += '<text class="tpr-c-sub" x="' + cx + '" y="' + f(textY + size * 0.135) + '">' + esc(c.sub) + '</text>';

    return '<svg class="tpr" viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size +
      '" role="img" aria-label="' + esc(ariaLabel(segs, c)) + '">' + body + centre + '</svg>';
  }

  function ariaLabel(segs, c) {
    var parts = [];
    if (c.main) parts.push(c.main + '.');
    var scored = [], grey = [];
    for (var i = 0; i < segs.length; i++) {
      if (segs[i].state === 'unscored') grey.push(segs[i].label);
      else if (segs[i].state === 'scored') scored.push(segs[i].label + ' ' + segs[i].score + ' of ' + segs[i].max);
      else scored.push(segs[i].label + ', directional');
    }
    if (scored.length) parts.push(scored.join('. ') + '.');
    if (grey.length) parts.push('Not yet scored: ' + grey.join(', ') + '.');
    return parts.join(' ');
  }

  /* The legend is not decoration. It is how the ring's information
     survives without colour, and it is the only place the per-point
     numbers are readable. Always render it. */
  function legend(segs) {
    var html = '<ul class="tpr-legend">';
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      var right;
      if (s.state === 'scored') right = '<span class="tpr-legend-score">' + s.score + ' / ' + s.max + '</span>';
      else if (s.state === 'directional') right = '<span class="tpr-legend-state">directional</span>';
      else right = '<span class="tpr-legend-state tpr-legend-empty">not yet scored</span>';
      html += '<li class="tpr-legend-row' + (s.state === 'unscored' ? ' is-empty' : '') + '">' +
        '<span class="tpr-legend-n">' + esc(s.n) + '</span>' +
        '<span class="tpr-legend-label">' + esc(s.label) + '</span>' +
        (s.gateOpen ? '<span class="tpr-legend-gate">GATE OPEN</span>' : '') +
        right +
      '</li>';
    }
    return html + '</ul>';
  }

  return { svg: svg, legend: legend };
})();
