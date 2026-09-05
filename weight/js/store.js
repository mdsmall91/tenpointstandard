'use strict';

/* =============================================================
   WEIGHT — STORE
   All state lives in localStorage under one key. No server, no
   account, no network. The export/import pair is the whole backup
   story and is deliberately plain JSON you can read yourself.
   ============================================================= */

var Store = (function () {

  var KEY = 'wl.v1';

  function defaults() {
    return {
      version: 1,
      settings: {
        sex: 'unspecified',
        age: 40,
        heightIn: 70,
        activity: 'moderate',
        goalWeight: null,
        goalRateLbPerWk: 1,
        proteinPerLb: 0.8,
        fatPerLb: 0.35,
        alpha: 0.15,
        floorKcal: 1200
      },
      /* Personal food library. Built up as you log; within two weeks it
         covers almost everything you actually eat, and every row is
         right, which no general database can promise. */
      foods: [],
      habits: [
        { id: 'h_protein', name: 'Hit protein target' },
        { id: 'h_steps',   name: '8,000 steps' },
        { id: 'h_alcohol', name: 'No alcohol' },
        { id: 'h_sleep',   name: '7 hours sleep' }
      ],
      /* 'YYYY-MM-DD' -> { weight, food: [line], habits: {id:bool}, note } */
      entries: {}
    };
  }

  var state = null;

  function load() {
    if (state) return state;
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) { state = defaults(); return state; }
    try {
      var parsed = JSON.parse(raw);
      state = migrate(parsed);
    } catch (e) {
      /* Never lose data to a parse error: park the bad blob and start
         clean rather than silently overwriting it. */
      try { localStorage.setItem(KEY + '.corrupt.' + Date.now(), raw); } catch (e2) {}
      state = defaults();
    }
    return state;
  }

  function migrate(obj) {
    var d = defaults();
    if (!obj || typeof obj !== 'object') return d;
    var out = {
      version: 1,
      settings: Object.assign({}, d.settings, obj.settings || {}),
      foods: Array.isArray(obj.foods) ? obj.foods : d.foods,
      habits: Array.isArray(obj.habits) && obj.habits.length ? obj.habits : d.habits,
      entries: (obj.entries && typeof obj.entries === 'object') ? obj.entries : {}
    };
    return out;
  }

  var saveTimer = null;
  function save() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 150);
  }

  function flush() {
    saveTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* Quota is the only realistic failure and it is worth surfacing:
         silent data loss is the one thing a personal log cannot do. */
      if (typeof window !== 'undefined' && window.__wlSaveError) window.__wlSaveError(e);
    }
  }

  function settings() { return load().settings; }
  function foods() { return load().foods; }
  function habits() { return load().habits; }
  function entries() { return load().entries; }

  function entry(key) {
    var e = load().entries;
    if (!e[key]) e[key] = { weight: null, food: [], habits: {}, note: '' };
    if (!e[key].food) e[key].food = [];
    if (!e[key].habits) e[key].habits = {};
    return e[key];
  }

  /* Days that actually carry data, oldest first. */
  function loggedDates() {
    var e = load().entries;
    return Object.keys(e).filter(function (k) {
      var v = e[k];
      return v && (typeof v.weight === 'number' || (v.food && v.food.length) ||
        (v.habits && Object.keys(v.habits).length));
    }).sort();
  }

  function weightPoints() {
    var e = load().entries;
    return Object.keys(e).filter(function (k) {
      return typeof e[k].weight === 'number' && isFinite(e[k].weight) && e[k].weight > 0;
    }).sort().map(function (k) { return { date: k, weight: e[k].weight }; });
  }

  /* Map of day -> kcal, used only for days with food logged. Days with an
     empty log are absent rather than zero: "ate nothing" and "logged
     nothing" must never be confused by the TDEE estimator. */
  function intakeMap() {
    var e = load().entries, out = {};
    Object.keys(e).forEach(function (k) {
      var f = e[k] && e[k].food;
      if (f && f.length) out[k] = WL.entryTotals(e[k]).kcal;
    });
    return out;
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function addFood(food) {
    var f = load().foods;
    food.id = food.id || uid('f');
    f.push(food);
    save();
    return food;
  }

  function updateFood(id, patch) {
    var f = load().foods;
    for (var i = 0; i < f.length; i++) {
      if (f[i].id === id) { Object.assign(f[i], patch); save(); return f[i]; }
    }
    return null;
  }

  function removeFood(id) {
    var s = load();
    s.foods = s.foods.filter(function (x) { return x.id !== id; });
    save();
  }

  function addHabit(name) {
    var h = load().habits;
    var item = { id: uid('h'), name: name };
    h.push(item);
    save();
    return item;
  }

  function removeHabit(id) {
    var s = load();
    s.habits = s.habits.filter(function (x) { return x.id !== id; });
    save();
  }

  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }

  /* Import replaces everything. Validated first so a wrong file cannot
     wipe a real log — the caller gets false and the existing data stands. */
  function importJSON(text) {
    var parsed;
    try { parsed = JSON.parse(text); } catch (e) { return false; }
    if (!parsed || typeof parsed !== 'object' || !parsed.entries) return false;
    state = migrate(parsed);
    flush();
    return true;
  }

  function reset() {
    state = defaults();
    flush();
  }

  return {
    KEY: KEY, load: load, save: save, flush: flush, defaults: defaults, migrate: migrate,
    settings: settings, foods: foods, habits: habits, entries: entries, entry: entry,
    loggedDates: loggedDates, weightPoints: weightPoints, intakeMap: intakeMap,
    addFood: addFood, updateFood: updateFood, removeFood: removeFood,
    addHabit: addHabit, removeHabit: removeHabit,
    exportJSON: exportJSON, importJSON: importJSON, reset: reset, uid: uid
  };
})();
