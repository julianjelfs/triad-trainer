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

OWN-WORLD: Warm paper ground (#f5ecda family), dark brown-black ink, cream card for the neck, soft sand fills for controls. Do vermilion, mi marigold, so cobalt. Bricolage Grotesque throughout, heavy for chord names and syllables. Pills for small controls, 16px radius cards, one hairline above the transport, no other rules or boxes.

STORY: The player sees which chord and which colour is which note, then every shape on the neck straight underneath. Key, quality and strings live in a Settings bar below the neck, shut by default, the same as comping.

FIRST VIEWPORT: Top bar with wordmark left and Learn/Comping segmented control right. Hero row: chord name (heavy, up to 80px) with the quality under it, three compact one-line solfège tiles right. Then the full-width cream card with the whole fretboard, then a collapsible Settings bar (key, quality, strings) shut by default, above a sticky play/tempo/note-names/beat bar. The user asked for learn settings to collapse below the neck like comping's (2026-10-16), so the neck owns the first viewport in both modes. On phones the neck stands vertical.

FORM: Solfège classroom chart, candidate 1 of my ordered list (pick card), seed key 1165c129. Signature: the metronome's three beats light do, mi, so in turn; a chord change sweeps the shapes in from low frets to high.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
