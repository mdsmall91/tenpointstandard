# Weight

A personal weight, intake and habit log with an adaptive calorie target.
No account, no server, no subscription, no food database. It runs entirely
in one browser and the data is yours in a file.

Built for an audience of one. That constraint is what makes it better than
the commercial options rather than worse: there is nothing to upsell, no
engagement loop, and every food in the library is one you entered and
therefore correct.

## Run it

Any static server, or open `index.html` directly.

```
python3 -m http.server 8000     # then visit localhost:8000
```

On a phone: serve it over HTTPS (or GitHub Pages), open it in Safari or
Chrome, and Add to Home Screen. It installs as a standalone app and works
offline via `sw.js`.

## The four things it does

**1. Trend weight, not weigh-ins.** A single reading is mostly water,
sodium and gut contents; a real 180lb body swings 3–4lb for reasons that
have nothing to do with fat. Every number in the app is driven by an
exponentially weighted moving average, not the raw reading. The chart shows
both so the scatter around the line makes the point visually.

The smoothing constant is per *day*, not per reading, so a weigh-in after a
five-day gap gets `1-(1-α)^5` of the pull. Without that, sporadic logging
leaves the trend lagging arbitrarily far behind reality.

**2. Adaptive TDEE.** The one genuinely smart number. Energy balance run
backwards over a trailing window:

```
TDEE = mean daily intake − (trend weight change in lb × 3500) / days
```

This *measures* your metabolism instead of predicting it from a formula,
and it silently absorbs everything a formula misses — NEAT, adaptation,
and chronic under-logging of intake. Two windows (14 and 28 days) are
blended so the estimate is responsive without being jumpy.

Guard rails, because a confident wrong number is worse than an honest
fallback:

- Days with no food logged are *absent*, not zero. "Ate nothing" and
  "logged nothing" must never be confused.
- Under 75% logging coverage, it refuses to run and falls back to
  Mifflin-St Jeor.
- A physiologically implausible result is clamped and flagged, because that
  means the inputs are wrong, not the metabolism.

**3. Calorie and macro logging, against a personal library.** No 2M-item
database with three conflicting entries for the same banana. You log the
~150 things you actually eat; a new name asks for its macros once and joins
the library. Quick-add covers restaurant meals. Within two weeks logging is
mostly autocomplete, and every row is right.

**4. Habits.** User-defined daily checkboxes with streaks and a 30-day
grid. Streaks tolerate an unlogged today — a streak that breaks at 00:01
every morning trains you to stop looking at it.

## Honesty rules

The app says where its numbers came from and admits when it does not know.
That is a design requirement, not a nicety: a number you cannot explain is
a number you stop trusting in week three.

- The target line states whether it is measured or formula-derived, and
  with what confidence.
- An aggressive goal on a small body gets clamped to a floor, and the app
  reports the rate you will *actually* get instead of the one you asked for.
- A flat trend against a loss goal prompts you to check the food log before
  cutting calories, because under-logging is the usual answer.
- `3500 kcal/lb` is an approximation. It overstates early loss (glycogen and
  water) and understates it later. Fine for a loop that re-estimates weekly.

## Files

```
index.html              shell — five panels
js/core.js              the engine. Pure functions, no DOM, no storage.
js/store.js             localStorage, export/import
js/chart.js             hand-rolled SVG. No charting library.
js/ui.js                render-on-change
styles/app.css          self-contained tokens, light + dark
sw.js                   offline shell (stale-while-revalidate)
tests/tests.html        67 tests — open in a browser, or `node tests/tests.js`
```

No build step, no dependencies. Edit and reload.

## Tests

```
node weight/tests/tests.js      # or open tests/tests.html
```

67 assertions over the engine. The one that matters most is end-to-end: a
synthetic body with a true TDEE of 2600 eating 2100/day is fed in as noisy
weigh-ins, and the estimator has to recover ~2600 and set a target within
150 calories of truth.

## Your data

Everything is in `localStorage` under `wl.v1` in one browser. Nothing is
uploaded, there is no account, and nobody else can see it — which also
means clearing site data erases it. **Export occasionally.** The export is
plain readable JSON and the import validates before it replaces anything.

## Not in here, on purpose

Barcode scanning, a branded-food database, exercise calorie logging (it
double-counts against an adaptive TDEE that already includes your activity),
social features, and streak guilt-tripping.
