---
name: Triad Trainer
description: A classroom solfège chart turned into a guitar tool. Warm paper, brown-black ink, and three colours for do, mi and so.
colors:
  do: "#c93c25"
  on-do: "#ffffff"
  mi: "#f0b02a"
  mi-edge: "#c48a12"
  so: "#2a6aa8"
  on-so: "#ffffff"
  paper: "#f5ecda"
  card: "#fffaf0"
  sand: "#eadfc8"
  sand-strong: "#dccdb0"
  ink: "#2b2520"
  ink-soft: "#6a5d4e"
  string: "#8a7b68"
  fret: "#e2d5bb"
  inlay: "#efe4cf"
  band: "#f3e8d3"
typography:
  display:
    fontFamily: "'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(56px, 7vw, 80px)"
    fontWeight: 800
    lineHeight: 0.85
    letterSpacing: "-0.035em"
    fontVariation: "'opsz' 96"
  headline:
    fontFamily: "'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
    fontVariation: "'opsz' 96"
  title:
    fontFamily: "'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 800
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
    fontVariation: "'opsz' 14"
  label:
    fontFamily: "'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
  caption:
    fontFamily: "'Bricolage Grotesque Variable', ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  notice: "12px"
  card: "16px"
  tile: "18px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "28px"
  gutter-desktop: "32px"
  gutter-phone: "16px"
components:
  pill:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  pill-hover:
    backgroundColor: "{colors.sand-strong}"
  pill-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  pill-key:
    width: "48px"
    padding: "0"
  pill-small:
    padding: "0 14px"
    height: "32px"
  play-button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0 20px 0 16px"
    height: "42px"
  segmented-track:
    backgroundColor: "{colors.sand}"
    rounded: "{rounded.pill}"
    padding: "4px"
  segmented-option:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "34px"
  segmented-option-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  bpm-stepper:
    backgroundColor: "{colors.sand}"
    rounded: "{rounded.pill}"
    padding: "4px"
  section-header:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px 0 20px"
    height: "48px"
  neck-card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.card}"
    padding: "14px 22px 10px"
  tone-tile-do:
    backgroundColor: "{colors.do}"
    textColor: "{colors.on-do}"
    rounded: "{rounded.tile}"
    padding: "16px 18px 14px"
    height: "100px"
  tone-tile-mi:
    backgroundColor: "{colors.mi}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tile}"
    padding: "16px 18px 14px"
    height: "100px"
  tone-tile-so:
    backgroundColor: "{colors.so}"
    textColor: "{colors.on-so}"
    rounded: "{rounded.tile}"
    padding: "16px 18px 14px"
    height: "100px"
  progression-chip:
    backgroundColor: "{colors.sand}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 16px"
    height: "40px"
  progression-chip-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  transport:
    backgroundColor: "{colors.paper}"
    padding: "12px 16px"
---

# Design System: Triad Trainer

## Overview

**Creative North Star: "The Classroom Solfège Chart"**

The app looks like the chart on a music-room wall. A warm paper ground, brown-black ink, and three saturated colours, each tied to one chord tone: vermilion for do, marigold for mi, cobalt for so. Every other surface is a paper, cream or sand tint of the same warm hue. When the player looks up from the guitar a metre away, the chord tones are the first thing they see because nothing else is allowed to be bright.

Density is low on purpose. The chord name is huge, the tone tiles are the size of flash cards, and the controls are fat pills you can hit between phrases. One typeface, Bricolage Grotesque, does all the work, with weight and optical size carrying the hierarchy. The neck sits on a cream card, the only raised surface in the app. Play, tempo and note names live in a bar stuck to the bottom of the window.

Motion is small and musical. The metronome's three beats lift the do, mi and so tiles in turn, and a chord change sweeps the dots onto the neck from the nut upward over 220ms.

**Key Characteristics:**
- Three meaning colours, everything else warm neutral
- One variable typeface, weight 800 for anything you read from across the room
- Pills for every control, 16px card for the neck, 18px tiles for the tones
- Flat paper with one hairline shadow on the neck card
- A sticky transport bar at the bottom in both modes

## Colors

Warm paper and brown-black ink, with three chord-tone colours that are the only saturated hues in the app.

### Primary
- **Vermilion Do** (do): the root. Fills the do tile, root dots on the neck, and the first metronome beat light. Text on it is white (on-do).
- **Marigold Mi** (mi): the third. Fills the mi tile, third dots and the second beat light. Text on it is ink, because white on marigold fails contrast. Also tints text selection at 55%.
- **Cobalt So** (so): the fifth. Fills the so tile, fifth dots and the third beat light. Text on it is white (on-so).
- **Marigold Rim** (mi-edge): a darker marigold used only as the stroke round mi dots, because marigold alone washes out on cream.

### Neutral
- **Chart Paper** (paper): the page background, the transport bar, the browser theme colour, and text on pressed controls.
- **Cream Card** (card): the neck card, and the 2.5px ring round do and so dots so they separate from the strings.
- **Sand** (sand): resting fill for pills, the segmented track, the BPM stepper, the section header and progression chips.
- **Deep Sand** (sand-strong): hover fill for all sand controls, unlit beat lights, the transport's top hairline and the scrollbar thumb.
- **Brown-Black Ink** (ink): body text, pressed and selected controls, the nut, focus rings and `accent-color`.
- **Soft Ink** (ink-soft): secondary text such as group labels, quality and string-set lines, fret numbers, string names and the "bpm" unit.

### Neck
- **String Brown** (string): the six strings, drawn thicker toward low E.
- **Fret Wire** (fret): fret lines, faint enough that the dots win.
- **Inlay Cream** (inlay): position markers at 3, 5, 7, 9, 12 (pair) and 15.
- **Shape Band** (band): the thick rounded stroke joining a shape's three notes into one blob.

### Named Rules
**The Three Voices Rule.** Do, mi and so are the only saturated colours, and each means one chord tone everywhere it appears. No other element gets a saturated fill, accent or status colour.

**The Ink Selection Rule.** A selected or pressed control turns ink with paper text. Selection never borrows a chord-tone colour.

The one exception in the build is the error and notice box, which mixes do at 12% into paper with do-tinted ink text. It reads as a soft warning wash. Keep it that pale so it never competes with a do dot.

## Typography

**Display Font:** Bricolage Grotesque Variable (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** the same family
**Label/Mono Font:** the same family, with tabular figures for frets and BPM

**Character:** A slightly quirky grotesque that looks like classroom signage at weight 800 and stays plain at 400 to 600. The variable optical-size axis is set to 96 for the chord name and syllables and 14 for body text, so big type tightens and small type opens up.

### Hierarchy
- **Display** (800, clamp(56px, 7vw, 80px), line-height 0.85, -0.035em): the chord name in learn mode. The quality underneath is 0.42em at weight 600 in soft ink.
- **Headline** (800, 44px, 0.9): the do, mi, so syllables on the tone tiles. 32px on phones.
- **Title** (800, 18px): the wordmark. Note names on the tiles are 800 at 20px (17px on phones). Section header titles are 700 at 15px.
- **Body** (400, 15px, 1.5): base text, status lines, the string-set line.
- **Label** (600, 14px, line-height 1): pill, segmented and chip text.
- **Caption** (600, 13px): group labels ("Key", "Quality", "Strings"), tone role words, numerals in chips, the small pill. Fret numbers and string names on the neck are 600 in soft ink.

### Named Rules
**The Heavy Means Read-From-Afar Rule.** Weight 800 is for things the player reads from a metre away: chord name, syllables, note names, the wordmark, labels inside dots. Controls stay at 600.

**The Tabular Rule.** Numbers that sit in a row (fret numbers, BPM) use tabular figures so they don't jitter.

## Layout

A single centred column, max 1040px, with 32px side gutters on desktop and 16px at 600px and below. The learn page runs top to bottom: header with wordmark left and the Learn/Comping control right; a hero row with the chord name and the three tone tiles (grid 1fr to 1.7fr, aligned to the bottom edge); the pickers; the full-width neck card; then the sticky transport. The pickers sit above the neck so a change and its result are on screen together at 1440×757.

Picker rows are a two-column grid with a 96px label column, so every row of pills starts on the same line. Pills in a row are 6px apart and wrap. On phones the label moves above the pills.

Comping keeps the same hero and neck card, adds a progression strip of chips between them, and puts its pickers in a collapsible Settings section below the neck. Its transport holds play, BPM, note names and four beat lights.

Vertical rhythm is loose: 28px under the header and above the transport, 18px between hero, pickers and card (24px on phones), 10 to 14px between picker rows.

Breakpoints:
- At 760px the hero stacks: chord name above, tiles below.
- At 600px gutters shrink, tiles tighten, beat lights hide, and the fretboard turns vertical: nut at the top, low E on the left, capped at 380px wide.

## Elevation & Depth

Flat paper. Depth comes from tone: paper ground, cream card, sand controls. Two shadows exist and both are small.

### Shadow Vocabulary
- **Card hairline** (`box-shadow: 0 1px 2px color-mix(in srgb, var(--ink) 8%, transparent)`): the neck card only, so it reads as a sheet laid on the page.
- **Beat lift** (`box-shadow: 0 10px 18px -8px color-mix(in srgb, var(--ink) 45%, transparent)` with `translateY(-6px)`): the tone tile the metronome is on. It appears for the beat and goes away.

### Named Rules
**The Lift Is The Beat Rule.** Nothing rises off the page at rest. A shadow means "this tone, now".

## Shapes

Round and soft, with three corner sizes. Every control is a full pill (999px), including the segmented track, the BPM stepper, the section header and the progression chips. Content surfaces use larger fixed radii: 16px for the neck card, 18px for the tone tiles, 12px for notice and error boxes. Beat lights and fret dots are circles. The only line in the chrome is the 1px deep-sand hairline above the transport. On the neck itself, strings, frets and the 6px round-capped nut are drawn lines.

## Components

### Pill
The one button shape. Sand at rest, deep sand on hover, ink with paper text when pressed (`aria-pressed="true"`) or solid. Weight 600 at 14px, 40px tall, 16px side padding. It scales to 0.96 on press over 160ms. Disabled drops to 50% opacity. The key row uses fixed 48px widths so twelve keys line up. A small variant (32px tall, 13px) is used only for the Note names toggle in the transport.

### Play button
A solid ink pill, 42px tall, with a 14px filled play or stop glyph drawn in SVG. It leads the transport in both modes.

### Segmented control
A sand track with 4px padding holding two to three 34px pills. The chosen one is ink with paper text, and the others hover to deep sand. Used for the Learn/Comping switch, with radio semantics.

### BPM stepper
A sand pill holding round minus and plus buttons (34px) either side of a bare number input at 700/17px with tabular figures and a soft-ink "bpm" unit. Steps of 5 between 30 and 160. A disabled button fades to 35%.

### Tone tiles
Three tiles in a grid with 12px gaps, at least 100px tall, filled do, mi and so. Each carries the syllable large at top left and the spelled note plus its role ("root", "third", "fifth") at the bottom. A new note name rises 6px into place over 360ms. The tile on the current metronome beat lifts 6px with the beat shadow.

### Neck card and fretboard
A cream card holding an SVG fretboard to fret 15. Shapes are drawn as wide round-capped band strokes with chord-tone dots on top: do and so ringed in cream, mi ringed in marigold rim. Note names inside dots are weight 800 in each tone's on-colour. On a chord change, dots scale in from 0.55 with delays proportional to fret, a 220ms sweep up the neck, and the bands fade in over 420ms.

### Section header
A full-width sand pill, 48px tall: bold title, a soft-ink one-line summary that truncates, and a chevron that turns 180° when open. Used for comping's Settings.

### Progression strip
Sand chips with the chord symbol at 700 and its numeral in soft ink. The sounding chord turns ink with paper text and a deep-sand numeral. The current chord's numeral in the hero status line is a small ink badge.

### Transport
A bar stuck to the bottom of the window, paper background, deep-sand top hairline, 12px padding plus the safe-area inset. Play, BPM stepper, Note names, then beat lights pushed right. Learn's three beat lights take do, mi, so in turn. Comping's four lights are ink, and during the count-in they show as ink rings.

## Do's and Don'ts

### Do:
- **Do** keep do, mi and so as the only saturated colours, each tied to its one tone.
- **Do** put ink text on mi and white text on do and so.
- **Do** ring mi dots with the marigold rim wherever they sit on cream.
- **Do** make every control a pill: sand at rest, deep sand on hover, ink when chosen.
- **Do** use weight 800 for anything read from a metre away, and tabular figures for numbers in a row.
- **Do** keep the pickers and the neck in one view on desktop, and stand the neck up on phones.
- **Do** honour reduced motion. The global rule cuts every animation and transition to 1ms.

### Don't:
- **Don't** add a fourth saturated colour for status, links or decoration.
- **Don't** use a chord-tone colour for selection or pressed state. That is ink's job.
- **Don't** add shadows to controls or cards at rest beyond the neck card's hairline.
- **Don't** add rules, borders or boxes around groups. The transport's hairline is the only one.
- **Don't** introduce a second typeface or fall back to a system display face for headings.
- **Don't** go dark or neon. The ground is warm paper.
