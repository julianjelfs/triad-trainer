---
version: 1
slug: "frontend-src-app-svelte"
primary_target: "frontend/src/App.svelte"
related_targets: []
---

# Triad Trainer app shell (learn + comping)

Mode: Operate. One player at a desk, guitar in hand, reading from about a metre. Tasks: pick key/quality/strings and read every shape; in comping, follow the sounding chord. Must work on a phone.

## Direction contract

THESIS: The classroom solfège wall chart, made into a working tool: do, mi and so are the only colours that mean anything, shown as three big tiles you learn by sight. Refuses the dark, neon guitar-app look and the grey card-dashboard default.

OWN-WORLD: Warm paper ground (#f5ecda family), dark brown-black ink, cream card for the neck, soft sand fills for controls. Do vermilion, mi marigold, so cobalt. Bricolage Grotesque throughout, heavy for chord names and syllables. Pills for small controls, 16px radius cards, no rules or boxes beyond that.

STORY: The player sees which chord and which colour is which note, picks key, quality and strings, and reads every shape on the neck below. Changing a choice and seeing its result happen in one view.

FIRST VIEWPORT: Top bar with wordmark left and Learn/Comping segmented control right. Hero row: chord name (heavy, up to 92px) with quality and string set under it, three solfège tiles right. Then the key row and a quality + strings row, then the full-width cream card with the whole fretboard, fret numbers included, above a sticky play/tempo/beat bar. Pickers sit above the neck because desktop is the main screen and at 1440x757 the choices and the whole neck then fit together, so a change and its result are seen at once (revised after the first render, 2026-10-16). On phones the neck stands vertical and starts after the pickers.

FORM: Solfège classroom chart, candidate 1 of my ordered list (pick card), seed key 1165c129. Signature: the metronome's three beats light do, mi, so in turn; a chord change sweeps the shapes in from low frets to high.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
