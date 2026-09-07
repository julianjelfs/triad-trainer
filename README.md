# Triad Trainer

Guitar triad drill. It hands you a chord on a string set, chosen from whatever
you have practised least, and the metronome walks you through every inversion
of it from the lowest position on the neck to the highest, a bar to each shape,
wrapping back to the bottom until you stop. What you play goes into the log,
which is what picks the next one.

You filter what it may choose from. You do not choose the chord itself.

Svelte 5 frontend, FastAPI backend, SQLite file on this machine.

## Running it

```sh
./scripts/dev.sh
```

That starts the API on port 8000 and the Vite dev server on port 5173. Open
<http://localhost:5173>. Vite proxies `/api` to the backend, so there is one
origin to think about in development.

First run needs the dependencies:

```sh
cd backend  && uv sync --group dev
cd frontend && npm install
```

## How a drill works

A drill is one chord on one string set, say G major on strings 6-5-4. Its
positions are every enabled inversion at every playable spot on the neck,
ordered upwards:

```
G major, strings 6-5-4
  root position    frets 3-2-0
  first inversion  frets 7-5-5
  second inversion frets 10-10-9
  root position    frets 15-14-12   (the first grip, an octave up)
  -> wrap to the bottom
```

A row of dots under the diagram steps through the positions by hand, for
getting your bearings before you play. Browsing is not practice, so nothing is
logged, and starting the metronome goes back to the lowest position whichever
dot you left it on.

The metronome counts three beats to a bar, one per note of the triad, and the
shape changes on beat 1. Each shape it passes goes into the log, so one lap of
that drill logs root position twice and the other two once each.

The diagram draws the neck from fret 0 to 15 for every drill, so the grips
visibly climb it rather than the diagram rescaling under them.

## What's on screen

One flat column, max-width 1000px. No panel boxes: 2px rules separate the
sections. Everything flush left, no corner radius anywhere.

**Header.** A "Drill" tag and "EVERY KEY · FOUR STRING SETS" on one baseline,
then the title in 76px uppercase Archivo, then the subtitle.

**Settings.** Collapsible, shut by default. The header carries a summary of the
current filters (`Major · all string sets · all inversions`) so shutting it
hides no information. Open, it is a three-column grid: quality (major, minor),
the four string sets, the three inversions. Everything on by default except
minor. Changes save themselves, coalesced into one request 300ms after you stop
clicking. The twelve root checkboxes are in the markup but hidden, see
[Hidden controls](#hidden-controls).

**Drill.** The chord in 56px Archivo with the inversion in red after an em
dash, then "STRINGS 6-5-4 · POSITION 1 OF 4", then the fretboard, then a row of
14px square position steppers with a "Note names" checkbox pushed right.
A **Listen for "next"** toggle sits beside it, see [Voice stepping](#voice-stepping).
**New drill** (outlined) and **Done — log it & next** (red text) below, then a
line of helper copy. Both buttons stop the metronome, since both move you to a
different chord. A drill is fetched on load, so the section is never empty
with no way out of it.

**Metronome.** Solid red start/stop, a BPM field (30 to 160, default 60,
saved), and three beat squares pushed right that fill red and pulse on the
beat. Changing tempo mid-count restarts on the new one. While it counts, the
note being called is ringed in red on the diagram.

**Practice log.** Collapsible, shut by default, with "N shapes logged" in the
header. Open: a 12-column bar chart of shapes per root, then a table of the
eight least-practised combinations.

A notice line sits at the very bottom, empty until the backend is unreachable,
a save fails, or the filters match nothing.

## Visual language

The Modernist design system, from a Claude Design handoff. Tokens live at the
top of `frontend/src/app.css` and are the source of truth.

| Token | | Used for |
| --- | --- | --- |
| `--color-bg` | `#f3f2f2` | page, note dots, reversed-out labels |
| `--color-surface` | `#eae9e9` | the BPM input |
| `--color-text` | `#201e1d` | text, strings, the nut, control borders |
| `--color-accent` | `#ec3013` | root notes, primary button, checks, active marks |
| `--color-accent-200` | `#ffe0d9` | practice-log bars |
| `--color-accent-700` | `#ae1800` | hover on headers and rows, the notice line |
| `--color-neutral-200` | `#eae7e7` | fret inlays, empty log bars |
| `--color-neutral-300` | `#d7d3d3` | unlit beat squares |
| `--color-neutral-400` | `#bab6b6` | fret wires |
| `--color-neutral-600` | `#7d7979` | kickers, meta lines, fret numbers |
| `--color-divider` | text at 40% | the 2px rules, button and input borders |

Archivo at 400/600/800 throughout, pulled from Google Fonts by an `@import` in
`app.css`, so first paint of the headings needs the network. No serif anywhere.
Radius is 0 everywhere; rules are 2px; control borders are 2px solid text.
Focus is a 2px accent outline, never the browser's blue ring.

Checkboxes are drawn, not native: a 16px square with a 2px border that fills
accent with a reversed-out tick. The real input is kept off screen so keyboard
and screen readers still get a checkbox. Both collapsible headers use the same
drawn chevron, which rotates 180° over 120ms.

The fretboard is hand-drawn SVG in `Fretboard.svelte`, in viewBox units: 52
left pad, 26 per fret, strings at y 24/71/118. The neck is drawn from fret 0 to
15 for **every** drill, so shapes climb against a constant backdrop rather than
the diagram rescaling under them. The nut is a 5px bar, fret wires 1px, inlays
sit at 3, 5, 7, 9, 15 with a pair at 12. Root notes fill accent with reversed
labels; the third and fifth are outlined. The note the metronome is calling
takes a 3.5px accent ring. Dots ease between positions over 130ms.

## Voice stepping

While you are learning a drill's shapes, "Listen for “next”" advances a
position when you say the word, so you can keep both hands on the guitar. It
steps and wraps exactly as the squares do, and browsing is not practice, so it
logs nothing.

Three things to know before switching it on:

- **The audio is not processed on your machine.** This is the browser's
  SpeechRecognition, and Chrome implements it by streaming microphone audio to
  Google's servers. It runs only while the toggle is on, but that is the trade
  being made.
- **Chrome and Edge only.** Firefox has no implementation, and the toggle hides
  itself where the API is missing. It needs HTTPS or localhost, which the dev
  server is.
- **It never runs against the metronome.** Starting the count drops the mic,
  since the clicks are all it would hear. The two are alternatives.

Chrome ends a listening session on its own every so often; `voice.svelte.ts`
restarts it. Silence is treated as normal rather than an error. A refused
microphone says so under the buttons instead of failing quietly. The vocabulary
is the `COMMAND` regex in that file, currently just `next`.

## Voicings

Close-voiced triads on three adjacent strings, which is the standard set the
CAGED forms are built from. Nothing here is invented: each combination of
quality, string set and inversion is one movable grip, transposed to whichever
root you are playing. All twenty-four, as fret offsets from the lowest note:

| | 6-5-4 | 5-4-3 | 4-3-2 | 3-2-1 |
| --- | --- | --- | --- | --- |
| major, root position | 3-2-0 | 3-2-0 | 2-1-0 | 2-2-0 |
| major, first | 2-0-0 | 2-0-0 | 2-0-1 | 1-0-0 |
| major, second | 1-1-0 | 1-1-0 | 0-0-0 | 0-1-0 |
| minor, root position | 3-1-0 | 3-1-0 | 2-0-0 | 2-1-0 |
| minor, first | 1-0-0 | 1-0-0 | 1-0-1 | 0-0-0 |
| minor, second | 2-2-0 | 2-2-0 | 1-1-0 | 1-2-0 |

`music.ts` derives them rather than listing them. Each string's chord tone
fixes its fret to within an octave, so there are eight ways to spread the three
notes across octaves; a voicing is kept when the notes ascend across the strings
and the grip spans four frets or fewer. That leaves exactly one grip per row
above, which `music.test.ts` asserts against the table.

Without the span limit you get voicings that are in the right pitch order but
unplayable, D major on strings 4-3-2 coming out as frets 0-11-10 rather than
12-11-10.

## Hidden controls

`frontend/src/lib/config.ts` holds flags for controls that exist but are kept
off screen. `SHOW_ROOT_PICKER` is off: choosing your own keys means practising
the comfortable ones, so the trainer covers all twelve. Flip it to `true` and
the twelve checkboxes come back, no other change needed. The setting itself is
stored, sent and honoured either way.

While the picker is hidden nothing can switch a root back on, so a stored subset
would quietly stick. The trainer widens the selection back to all twelve on
load.

## Layout

```
backend/
  app/
    main.py          FastAPI app, CORS, router wiring
    db.py            connection, schema, seed defaults
    schemas.py       pydantic request/response models
    repository.py    every SQL statement in the project
    selection.py     which drill to practise next
    routers/         HTTP layer, one module per resource
  tests/             pytest, runs against a temporary database
frontend/
  src/
    app.css          palette and type tokens, global element styles
    App.svelte       page shell, wires the metronome to the trainer
    lib/
      music.ts       triad grips and fretboard maths, pure functions
      music.test.ts  asserts the grips against the table above
      api.ts         typed client for the backend
      types.ts       shared shapes, mirroring the API models
      config.ts      flags for controls kept off screen
      state/
        trainer.svelte.ts    settings, current drill, stats, logging
        metronome.svelte.ts  beat and bar counting, Web Audio clicks
        voice.svelte.ts      spoken "next" stepping, off unless switched on
      components/
        SectionHeader.svelte  chevron + title + summary, the collapsible header
        Chevron.svelte        the drawn caret, rotates when open
        CheckRow.svelte       flat square checkbox with a real input behind it
        SettingsPanel.svelte  collapsible filters and their summary line
        CheckGroup.svelte     one kicker plus its rows
        CurrentShape.svelte   chord name, diagram, steppers, buttons
        Fretboard.svelte      the SVG diagram
        PositionDots.svelte   square steppers, browse positions by hand
        MetronomeBar.svelte   start/stop, BPM, beat squares
        PracticeLog.svelte    collapsible totals, per-root bars, weakest table
```

The split: the backend knows a drill only as three fields (root pitch class,
quality, string set) and picks the next one from the log. The frontend turns
those into grips and positions. No music theory in Python, no scheduling rules
in TypeScript.

## Data

`backend/triads.db`, or wherever `TRIADS_DB_PATH` points. Three tables:

- `setting_selection` holds one row per enabled option, so a missing row means
  the option is off.
- `preference` holds the scalars, currently BPM and label visibility.
- `practice_event` is append-only, one row per shape you play. Counts and
  last-practised dates are `GROUP BY` queries over it, not stored totals, so the
  history stays intact if the aggregation ever changes.

A lap arrives as one POST rather than one per bar.

## API

| Method | Path | Does |
| --- | --- | --- |
| GET | `/api/settings` | current selections and preferences |
| PUT | `/api/settings` | replace them |
| GET | `/api/practice/next` | next chord and string set to drill; 409 if the settings match nothing |
| POST | `/api/practice/events` | log a list of shapes, normally one lap |
| GET | `/api/practice/stats` | totals, per-root counts, least-practised items |
| DELETE | `/api/practice/events` | wipe the log; no button for this in the UI |

A drill is scored on the total across its enabled inversions, so a chord you
have drilled on one inversion does not come back ahead of one you have never
played.

Interactive docs at <http://localhost:8000/docs> while the backend is running.

## Tests

```sh
cd backend  && uv run pytest
cd frontend && npm test          # vitest: grips, positions, voice commands
cd frontend && npm run check     # svelte-check, types and templates
```

## Notes on the port

The app started as `triad-trainer.html`, a single self-contained page in a
beige "practice notebook" style, since deleted. Two display bugs came across
from it and were fixed on the way: fret numbers were drawn one space to the
right of the dots they labelled, and "high E" was clipped off the left edge of
the diagram. The notebook look is gone too, replaced by the Modernist system
above.

Three behaviours changed with the redesign, all of them specified by the
handoff rather than incidental:

- A drill is fetched on load. The only "New drill" button lives inside the
  drill block, so an empty start state would have been a dead end.
- **New drill** and **Done** both stop the metronome. Either way you land on a
  different chord, so leaving it counting against a shape you are no longer on
  is wrong. Stopping flushes what was already played, so nothing is lost.
- The fret window is fixed at 0 to 15 rather than fitted to each drill.

## Things left undone

- The neck stops at fret 15, which gives three or four positions per drill.
  `MAX_FRET` in `music.ts` sets both the highest voicing and the width of the
  diagram, so changing it moves both together.
- The cycle only ascends. Ascending then descending would drill the downward
  moves too.
- Spread voicings, and triads on non-adjacent string sets, are not covered.
- Voice stepping only goes forward. A "back" command is one more branch in the
  same handler.
