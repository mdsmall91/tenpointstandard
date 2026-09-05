'use strict';

/* =============================================================
   WEIGHT — UI
   Render-on-change. Every input writes to the store and calls
   render(); there is no virtual DOM and no framework because the
   whole surface is five panels.
   ============================================================= */

(function () {

  var $ = function (id) { return document.getElementById(id); };
  var day = WL.todayKey();
  var range = 30;
  var foodFilterText = '';

  function fmt(n, dp) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return n.toFixed(dp === undefined ? 0 : dp);
  }
  function signed(n, dp) {
    if (n === null || !isFinite(n)) return '—';
    return (n > 0 ? '+' : '') + n.toFixed(dp === undefined ? 1 : dp);
  }
  function esc(s) { return Chart.esc(s); }

  function longDate(key) {
    var d = WL.fromKey(key), t = WL.todayKey();
    if (key === t) return 'Today';
    if (key === WL.addDays(t, -1)) return 'Yesterday';
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  /* ---------------------------------------------------------------
     DERIVED STATE
     The single place the engine is called. Everything the UI shows
     is a projection of this object.
     --------------------------------------------------------------- */
  function derive() {
    var st = Store.settings();
    var pts = Store.weightPoints();
    var series = WL.trendSeries(pts, st.alpha);
    var hasWeight = pts.length > 0;

    var currentTrend = series.length ? series[series.length - 1].trend : null;
    var lastRaw = pts.length ? pts[pts.length - 1].weight : null;
    var basisLb = currentTrend !== null ? currentTrend : (lastRaw || 0);

    var profile = {
      weightLb: basisLb, heightIn: st.heightIn, age: st.age,
      sex: st.sex, activity: st.activity
    };

    var intake = Store.intakeMap();
    var tdee = WL.estimateTDEE({ trend: series, intake: intake, profile: profile });
    var target = WL.dailyTarget({
      tdee: tdee.tdee, goalRateLbPerWk: st.goalRateLbPerWk,
      profile: profile, floorKcal: st.floorKcal
    });
    var macros = WL.macroTargets({
      targetKcal: target.target, weightLb: basisLb,
      proteinPerLb: st.proteinPerLb, fatPerLb: st.fatPerLb
    });
    var rate = WL.trendRate(series, 21);
    var projection = (hasWeight && typeof st.goalWeight === 'number' && rate !== null)
      ? WL.projectGoal(currentTrend, st.goalWeight, rate, series[series.length - 1].date)
      : null;

    return {
      st: st, pts: pts, series: series, hasWeight: hasWeight,
      currentTrend: currentTrend, lastRaw: lastRaw, basisLb: basisLb,
      profile: profile, intake: intake, tdee: tdee, target: target,
      macros: macros, rate: rate, projection: projection
    };
  }

  /* ---------------------------------------------------------------
     TODAY
     --------------------------------------------------------------- */

  function renderToday(D) {
    $('dayLabel').textContent = longDate(day);
    $('nextDay').disabled = day >= WL.todayKey();

    var e = Store.entry(day);
    var eaten = WL.entryTotals(e);
    var tgt = D.hasWeight ? D.target.target : null;
    var left = tgt === null ? null : tgt - eaten.kcal;

    $('eaten').textContent = fmt(eaten.kcal);
    $('target').textContent = tgt === null ? '—' : fmt(tgt);
    $('remaining').textContent = left === null ? '—' : fmt(Math.abs(left));
    $('remainingLabel').textContent = left === null ? 'log a weight to set a target'
      : (left < 0 ? 'calories over' : 'calories left');
    $('budgetCard').classList.toggle('over', left !== null && left < 0);

    var pct = (tgt && tgt > 0) ? Math.min(100, (eaten.kcal / tgt) * 100) : 0;
    $('budgetBar').classList.toggle('over', left !== null && left < 0);
    $('budgetBar').firstElementChild.style.width = pct + '%';

    $('targetBasis').textContent = basisText(D);

    /* macros */
    var m = D.macros, mm = [
      { k: 'Protein', got: eaten.protein, want: m.protein },
      { k: 'Carbs',   got: eaten.carbs,   want: m.carbs },
      { k: 'Fat',     got: eaten.fat,     want: m.fat }
    ];
    $('macros').innerHTML = mm.map(function (x) {
      var p = x.want > 0 ? Math.min(100, (x.got / x.want) * 100) : 0;
      return '<div class="macro"><div class="label"><span>' + x.k + '</span></div>' +
        '<div class="val">' + fmt(x.got) + ' / ' + (D.hasWeight ? fmt(x.want) : '—') + ' g</div>' +
        '<div class="bar"><i style="width:' + p + '%"></i></div></div>';
    }).join('');

    /* weight */
    $('weightInput').value = (typeof e.weight === 'number') ? e.weight : '';
    var tr = D.series.length ? WL.trendAt(D.series, day) : null;
    $('weightHint').textContent = tr === null
      ? 'Weigh in first thing, after the bathroom, before food. Same conditions every day is what makes the trend mean anything.'
      : 'Trend on this day: ' + fmt(tr, 1) + ' lb';

    /* food log */
    var log = $('foodLog');
    if (!e.food.length) {
      log.innerHTML = '<li><span class="empty" style="flex:1">Nothing logged yet.</span></li>';
    } else {
      log.innerHTML = e.food.map(function (line, i) {
        var t = WL.lineTotals(line);
        var sub = [];
        if (line.qty && line.qty !== 1) sub.push('x' + line.qty);
        if (t.protein || t.carbs || t.fat) {
          sub.push(fmt(t.protein) + 'p ' + fmt(t.carbs) + 'c ' + fmt(t.fat) + 'f');
        }
        return '<li><span class="name"><b>' + esc(line.name || 'Quick add') + '</b>' +
          (sub.length ? '<small>' + esc(sub.join('  ·  ')) + '</small>' : '') + '</span>' +
          '<span class="kcal">' + fmt(t.kcal) + '</span>' +
          '<button class="btn ghost" data-rm="' + i + '" aria-label="Remove">&times;</button></li>';
      }).join('');
    }

    /* food library autocomplete */
    $('foodList').innerHTML = Store.foods().map(function (f) {
      return '<option value="' + esc(f.name) + '"></option>';
    }).join('');

    /* habits */
    var entries = Store.entries();
    $('habitToday').innerHTML = Store.habits().map(function (h) {
      var on = !!(e.habits && e.habits[h.id]);
      var streak = WL.habitStreak(entries, h.id, day);
      return '<label class="habit"><input type="checkbox" data-habit="' + esc(h.id) + '"' +
        (on ? ' checked' : '') + '><span class="name">' + esc(h.name) + '</span>' +
        '<span class="streak' + (streak >= 3 ? ' hot' : '') + '">' +
        (streak ? streak + 'd' : '') + '</span></label>';
    }).join('') || '<p class="empty">No habits yet. Add some on the Habits tab.</p>';

    $('dayNote').value = e.note || '';
  }

  /* Says out loud where the target came from. A number you cannot
     explain is a number you stop trusting in week three. */
  function basisText(D) {
    if (!D.hasWeight) return 'Add a weigh-in to start the adaptive loop.';
    var t = D.tdee;
    var s;
    if (t.method === 'baseline') {
      s = 'Estimated from the formula (' + fmt(t.tdee) + ' cal/day). ' +
        'Log weight and food for two weeks and this switches to your real numbers.';
    } else {
      s = 'Your measured burn: ' + fmt(t.tdee) + ' cal/day (' + t.confidence + ' confidence).';
    }
    if (D.target.clamped) {
      s += ' Target held at the ' + D.target.floor + ' floor — that is ' +
        fmt(D.target.actualRate, 2) + ' lb/wk, not ' + fmt(D.target.requestedRate, 2) + '.';
    }
    return s;
  }

  /* ---------------------------------------------------------------
     TREND
     --------------------------------------------------------------- */

  function renderTrend(D) {
    var series = D.series;
    if (range < 9999 && series.length) {
      var from = WL.addDays(series[series.length - 1].date, -range);
      series = series.filter(function (p) { return p.date >= from; });
    }
    $('weightChart').innerHTML = Chart.weight(series, { goal: D.st.goalWeight });

    var first = D.series.length ? D.series[0] : null;
    var totalChange = (first && D.currentTrend !== null) ? D.currentTrend - first.trend : null;
    var wk = D.series.length ? WL.trendAt(D.series, WL.addDays(D.series[D.series.length - 1].date, -7)) : null;
    var weekChange = (wk !== null && D.currentTrend !== null) ? D.currentTrend - wk : null;

    /* Shown as a distance, not a signed difference: "-15.9" next to a
       goal reads as if you are already under it. */
    var toGoal = { v: '\u2014', n: 'lb' };
    if (typeof D.st.goalWeight === 'number' && D.currentTrend !== null) {
      var diff = D.currentTrend - D.st.goalWeight;
      toGoal = Math.abs(diff) < 0.1
        ? { v: '0.0', n: 'you are there' }
        : { v: fmt(Math.abs(diff), 1), n: diff > 0 ? 'lb to go' : 'lb below goal' };
    }

    var stats = [
      { k: 'Trend weight', v: fmt(D.currentTrend, 1), n: D.lastRaw !== null ? 'last weigh-in ' + fmt(D.lastRaw, 1) : '' },
      { k: 'Rate', v: D.rate === null ? '—' : signed(D.rate, 2), n: 'lb / week, 21-day' },
      { k: '7-day change', v: signed(weekChange, 1), n: 'lb of trend' },
      { k: 'Since start', v: signed(totalChange, 1), n: first ? 'from ' + fmt(first.trend, 1) : '' },
      { k: 'Burn (TDEE)', v: fmt(D.tdee.tdee), n: D.tdee.method === 'adaptive' ? 'measured, ' + D.tdee.confidence : 'formula estimate' },
      { k: 'Target', v: D.hasWeight ? fmt(D.target.target) : '—', n: 'cal / day' },
      { k: 'To goal', v: toGoal.v, n: toGoal.n },
      { k: 'Arrives', v: D.projection ? longDate(D.projection.date) : '—',
        n: D.projection ? Math.round(D.projection.weeks) + ' weeks' : 'need a steady rate' }
    ];
    $('trendStats').innerHTML = stats.map(function (s) {
      return '<div class="stat"><div class="k">' + esc(s.k) + '</div><div class="v">' + esc(s.v) +
        '</div><div class="n">' + esc(s.n || '') + '</div></div>';
    }).join('');

    /* Honest caveats, shown only when they actually apply. */
    var notes = [];
    if (D.pts.length && D.pts.length < 10) {
      notes.push('Ten weigh-ins is roughly where the trend stops lying. You have ' + D.pts.length + '.');
    }
    if (D.tdee.method === 'baseline' && D.pts.length >= 10) {
      notes.push('Still on the formula because food logging is under 75% of days. The adaptive number needs the intake side to be honest.');
    }
    if (D.tdee.clamped) {
      notes.push('The measured burn came out physiologically implausible and has been clamped. Usually that means a mistyped weight or a week of under-logging.');
    }
    if (D.rate !== null && D.st.goalRateLbPerWk > 0 && D.rate > -0.05 && D.pts.length >= 14) {
      notes.push('The trend is flat or rising against a loss goal. Before cutting the target, check that the food log is complete — under-logging is the usual answer, not metabolism.');
    }
    if (D.currentTrend !== null && D.st.goalRateLbPerWk / (D.currentTrend / 100) > 1.05) {
      notes.push('That rate is over 1% of bodyweight per week. It works, but expect to give some of it back.');
    }
    $('trendNotes').innerHTML = notes.map(function (t) {
      return '<div class="note">' + esc(t) + '</div>';
    }).join('');

    /* intake chart — last 21 days */
    var end = WL.todayKey(), days = [];
    for (var i = 20; i >= 0; i--) {
      var k = WL.addDays(end, -i);
      days.push({ date: k, kcal: D.intake[k] || 0 });
    }
    $('intakeChart').innerHTML = Chart.intake(days, { target: D.hasWeight ? D.target.target : 0 });

    var logged = days.filter(function (d) { return d.kcal > 0; });
    if (!logged.length) {
      $('intakeSummary').textContent = 'No food logged in the last three weeks.';
    } else {
      var mean = logged.reduce(function (a, d) { return a + d.kcal; }, 0) / logged.length;
      var over = D.hasWeight ? logged.filter(function (d) { return d.kcal > D.target.target; }).length : 0;
      $('intakeSummary').textContent = logged.length + ' of 21 days logged · average ' +
        fmt(mean) + ' cal' + (D.hasWeight ? ' · ' + over + ' over target' : '');
    }
  }

  /* ---------------------------------------------------------------
     FOODS
     --------------------------------------------------------------- */

  function renderFoods() {
    var foods = Store.foods().slice().sort(function (a, b) {
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
    });
    $('foodCount').textContent = foods.length;
    var q = foodFilterText.toLowerCase();
    var shown = q ? foods.filter(function (f) { return f.name.toLowerCase().indexOf(q) >= 0; }) : foods;

    $('foodLibrary').innerHTML = shown.length ? shown.map(function (f) {
      var t = WL.lineTotals({ kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat, qty: 1 });
      var sub = [];
      if (f.serving) sub.push(f.serving);
      sub.push(fmt(t.protein) + 'p ' + fmt(t.carbs) + 'c ' + fmt(t.fat) + 'f');
      return '<li><span class="name"><b>' + esc(f.name) + '</b><small>' + esc(sub.join('  ·  ')) +
        '</small></span><span class="kcal">' + fmt(t.kcal) + '</span>' +
        '<button class="btn ghost" data-food-rm="' + esc(f.id) + '" aria-label="Delete">&times;</button></li>';
    }).join('') : '<li><span class="empty" style="flex:1">' +
      (q ? 'Nothing matches.' : 'Your library is empty. Add the ten things you eat most and you are basically done.') +
      '</span></li>';
  }

  /* ---------------------------------------------------------------
     HABITS
     --------------------------------------------------------------- */

  function renderHabits() {
    var entries = Store.entries(), today = WL.todayKey();
    var hs = Store.habits();
    $('habitBoard').innerHTML = hs.length ? hs.map(function (h) {
      var cells = '';
      for (var i = 29; i >= 0; i--) {
        var k = WL.addDays(today, -i);
        var on = !!(entries[k] && entries[k].habits && entries[k].habits[h.id]);
        cells += '<i class="' + (on ? 'on' : '') + '" title="' + esc(k) + '"></i>';
      }
      var streak = WL.habitStreak(entries, h.id, today);
      var rate = WL.habitRate(entries, h.id, 30, today);
      return '<div style="margin-bottom:var(--s-5)">' +
        '<div class="habit" style="border:0;padding:0 0 var(--s-1)">' +
        '<span class="name">' + esc(h.name) + '</span>' +
        '<span class="streak' + (streak >= 3 ? ' hot' : '') + '">' + streak + 'd · ' +
        Math.round(rate * 100) + '%</span>' +
        '<button class="btn ghost" data-habit-rm="' + esc(h.id) + '" aria-label="Delete">&times;</button>' +
        '</div><div class="grid30">' + cells + '</div></div>';
    }).join('') : '<p class="empty">No habits yet.</p>';
  }

  /* ---------------------------------------------------------------
     SETTINGS
     --------------------------------------------------------------- */

  function renderSettings() {
    var s = Store.settings();
    $('stAge').value = s.age;
    $('stHeight').value = s.heightIn;
    $('stSex').value = s.sex;
    $('stActivity').value = s.activity;
    $('stGoalWeight').value = (typeof s.goalWeight === 'number') ? s.goalWeight : '';
    $('stRate').value = s.goalRateLbPerWk;
    $('stProtein').value = s.proteinPerLb;
    $('stFat').value = s.fatPerLb;
    $('stAlpha').value = s.alpha;
    $('alphaVal').textContent = Number(s.alpha).toFixed(2);

    var bytes = 0;
    try { bytes = (localStorage.getItem(Store.KEY) || '').length; } catch (e) {}
    var dates = Store.loggedDates();
    $('storageHint').textContent = dates.length + ' days logged · ' +
      (bytes < 1024 ? bytes + ' bytes' : (bytes / 1024).toFixed(1) + ' KB') +
      (dates.length ? ' · since ' + dates[0] : '');
  }

  /* ---------------------------------------------------------------
     RENDER
     --------------------------------------------------------------- */

  function render() {
    var D = derive();
    renderToday(D);
    renderTrend(D);
    renderFoods();
    renderHabits();
    renderSettings();
  }

  /* ---------------------------------------------------------------
     EVENTS
     --------------------------------------------------------------- */

  function num(el) {
    var v = parseFloat(el.value);
    return isFinite(v) ? v : null;
  }

  /* tabs */
  Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.tabs button'), function (x) {
        x.setAttribute('aria-selected', String(x === b));
      });
      Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (p) {
        p.classList.toggle('active', p.id === 'panel-' + b.dataset.tab);
      });
      window.scrollTo(0, 0);
    });
  });

  /* day navigation */
  $('prevDay').addEventListener('click', function () { day = WL.addDays(day, -1); render(); });
  $('nextDay').addEventListener('click', function () {
    if (day < WL.todayKey()) { day = WL.addDays(day, 1); render(); }
  });
  $('dayLabel').addEventListener('click', function () { day = WL.todayKey(); render(); });

  /* weight */
  function saveWeight() {
    var v = num($('weightInput'));
    var e = Store.entry(day);
    e.weight = (v !== null && v > 0) ? v : null;
    Store.save();
    render();
  }
  $('saveWeight').addEventListener('click', saveWeight);
  $('weightInput').addEventListener('change', saveWeight);
  $('weightInput').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); saveWeight(); }
  });

  /* food: add from library, or open the inline form for a new name */
  function findFood(name) {
    var q = String(name || '').trim().toLowerCase();
    if (!q) return null;
    var f = Store.foods();
    for (var i = 0; i < f.length; i++) {
      if (f[i].name.toLowerCase() === q) return f[i];
    }
    return null;
  }

  function addFoodLine() {
    var name = $('foodPick').value.trim();
    if (!name) return;
    var qty = num($('foodQty'));
    if (qty === null || qty <= 0) qty = 1;
    var f = findFood(name);
    if (!f) {
      $('inlineName').textContent = name;
      $('inlineNew').hidden = false;
      $('inKcal').focus();
      return;
    }
    Store.entry(day).food.push({
      foodId: f.id, name: f.name, qty: qty,
      kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat
    });
    Store.save();
    $('foodPick').value = ''; $('foodQty').value = 1;
    $('inlineNew').hidden = true;
    render();
  }
  $('addFoodLine').addEventListener('click', addFoodLine);
  $('foodPick').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); addFoodLine(); }
  });

  $('inSave').addEventListener('click', function () {
    var name = $('inlineName').textContent;
    var f = Store.addFood({
      name: name, serving: '',
      kcal: num($('inKcal')), protein: num($('inP')), carbs: num($('inC')), fat: num($('inF'))
    });
    var qty = num($('foodQty')); if (qty === null || qty <= 0) qty = 1;
    Store.entry(day).food.push({
      foodId: f.id, name: f.name, qty: qty,
      kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat
    });
    Store.save();
    ['inKcal', 'inP', 'inC', 'inF'].forEach(function (id) { $(id).value = ''; });
    $('inlineNew').hidden = true;
    $('foodPick').value = ''; $('foodQty').value = 1;
    render();
  });
  $('inCancel').addEventListener('click', function () { $('inlineNew').hidden = true; });

  /* food: quick add */
  function quickAdd() {
    var k = num($('quickKcal'));
    if (k === null || k <= 0) return;
    Store.entry(day).food.push({ name: 'Quick add', qty: 1, kcal: k });
    Store.save();
    $('quickKcal').value = '';
    render();
  }
  $('addQuick').addEventListener('click', quickAdd);
  $('quickKcal').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); quickAdd(); }
  });

  /* food log: remove a line */
  $('foodLog').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-rm]');
    if (!b) return;
    Store.entry(day).food.splice(Number(b.dataset.rm), 1);
    Store.save();
    render();
  });

  /* habits: toggle for the day */
  $('habitToday').addEventListener('change', function (ev) {
    var cb = ev.target.closest('[data-habit]');
    if (!cb) return;
    var e = Store.entry(day);
    if (cb.checked) e.habits[cb.dataset.habit] = true;
    else delete e.habits[cb.dataset.habit];
    Store.save();
    render();
  });

  /* note */
  $('dayNote').addEventListener('input', function () {
    Store.entry(day).note = $('dayNote').value;
    Store.save();
  });

  /* trend range */
  $('rangeSeg').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-range]');
    if (!b) return;
    range = Number(b.dataset.range);
    Array.prototype.forEach.call($('rangeSeg').children, function (x) {
      x.setAttribute('aria-pressed', String(x === b));
    });
    render();
  });

  /* foods library */
  $('saveFood').addEventListener('click', function () {
    var name = $('nfName').value.trim();
    if (!name) { $('nfName').focus(); return; }
    Store.addFood({
      name: name, serving: $('nfServing').value.trim(),
      kcal: num($('nfKcal')), protein: num($('nfP')), carbs: num($('nfC')), fat: num($('nfF'))
    });
    ['nfName', 'nfServing', 'nfKcal', 'nfP', 'nfC', 'nfF'].forEach(function (id) { $(id).value = ''; });
    render();
  });
  $('foodFilter').addEventListener('input', function () {
    foodFilterText = $('foodFilter').value;
    renderFoods();
  });
  $('foodLibrary').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-food-rm]');
    if (!b) return;
    Store.removeFood(b.dataset.foodRm);
    render();
  });

  /* habits management */
  $('addHabit').addEventListener('click', function () {
    var v = $('newHabit').value.trim();
    if (!v) return;
    Store.addHabit(v);
    $('newHabit').value = '';
    render();
  });
  $('newHabit').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); $('addHabit').click(); }
  });
  $('habitBoard').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-habit-rm]');
    if (!b) return;
    if (!confirm('Delete this habit? Past check-ins stay in the data but stop being shown.')) return;
    Store.removeHabit(b.dataset.habitRm);
    render();
  });

  /* settings */
  function bindSetting(id, key, parse) {
    $(id).addEventListener('change', function () {
      var s = Store.settings();
      s[key] = parse($(id));
      Store.save();
      render();
    });
  }
  bindSetting('stAge', 'age', function (el) { return num(el) || 40; });
  bindSetting('stHeight', 'heightIn', function (el) { return num(el) || 70; });
  bindSetting('stSex', 'sex', function (el) { return el.value; });
  bindSetting('stActivity', 'activity', function (el) { return el.value; });
  bindSetting('stGoalWeight', 'goalWeight', function (el) { return num(el); });
  bindSetting('stRate', 'goalRateLbPerWk', function (el) { var v = num(el); return v === null ? 0 : v; });
  bindSetting('stProtein', 'proteinPerLb', function (el) { var v = num(el); return v === null ? 0.8 : v; });
  bindSetting('stFat', 'fatPerLb', function (el) { var v = num(el); return v === null ? 0.35 : v; });
  $('stAlpha').addEventListener('input', function () {
    Store.settings().alpha = parseFloat($('stAlpha').value);
    $('alphaVal').textContent = parseFloat($('stAlpha').value).toFixed(2);
    Store.save();
    render();
  });

  /* data */
  $('exportBtn').addEventListener('click', function () {
    var blob = new Blob([Store.exportJSON()], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'weight-' + WL.todayKey() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  $('importBtn').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function () {
    var file = $('importFile').files[0];
    if (!file) return;
    if (!confirm('Import replaces everything currently in this browser. Continue?')) {
      $('importFile').value = '';
      return;
    }
    var r = new FileReader();
    r.onload = function () {
      if (Store.importJSON(String(r.result))) { day = WL.todayKey(); render(); alert('Imported.'); }
      else alert('That file did not look like a Weight export. Nothing was changed.');
      $('importFile').value = '';
    };
    r.readAsText(file);
  });
  $('resetBtn').addEventListener('click', function () {
    if (!confirm('Erase every weigh-in, food and habit in this browser? Export first if you want a copy.')) return;
    if (!confirm('Last check — this cannot be undone.')) return;
    Store.reset();
    day = WL.todayKey();
    render();
  });

  window.__wlSaveError = function () {
    alert('Could not save — this browser\'s storage is full or blocked. Export your data before doing anything else.');
  };

  /* Roll the view over if the app is left open past midnight. */
  setInterval(function () {
    var t = WL.todayKey();
    if (day !== t && document.visibilityState === 'visible') {
      var stale = WL.daysBetween(day, t) === 1;
      if (stale) { day = t; render(); }
    }
  }, 60000);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () { /* offline is a bonus, not a requirement */ });
  }

  render();
})();
