<script lang="ts">
  import {
    MAX_FRET,
    SOLFEGE,
    STRING_NAMES,
    STRING_SETS,
    noteName,
    positionLabel,
  } from "../music";
  import type { ChordTone, Shape } from "../types";

  interface Props {
    /** Every shape to draw. All of them are drawn the same way, none is current. */
    shapes: Shape[];
    showLabels: boolean;
    /** Note names as the key spells them. Without it, labels use sharps. */
    spelling?: Record<ChordTone, string> | null;
  }

  let { shapes, showLabels, spelling }: Props = $props();

  // Viewbox units. The SVG scales to its container, so these set proportion only.
  const PAD_LEFT = 80;
  const PAD_RIGHT = 16;
  const FRET_WIDTH = 26;
  const FIRST_STRING_Y = 22;
  const STRING_GAP = 30;
  const LAST_STRING_Y = FIRST_STRING_Y + 5 * STRING_GAP;
  const HEIGHT = 212;
  const DOT_RADIUS = 11;
  const HIGHEST_FRET = MAX_FRET;

  /** Single dots here, a pair at the twelfth. Standard neck markers. */
  const SINGLE_INLAYS = [3, 5, 7, 9, 15];
  const PAIRED_INLAY = 12;
  const INLAY_RADIUS = 4;

  const OPEN_X = PAD_LEFT - DOT_RADIUS - 4;
  /** Right edge of the string names, clear of an open-string dot. */
  const LABEL_X = OPEN_X - DOT_RADIUS - 6;

  const WIDTH = PAD_LEFT + HIGHEST_FRET * FRET_WIDTH + PAD_RIGHT;
  const GRID_WIDTH = HIGHEST_FRET * FRET_WIDTH;
  const FRETS = Array.from({ length: HIGHEST_FRET + 1 }, (_, fret) => fret);
  const MIDDLE_Y = FIRST_STRING_Y + 2.5 * STRING_GAP;

  /**
   * All six strings, every time, so the three you are playing always sit in
   * the same place on the neck you already know. Rows run top to bottom, so
   * the highest-pitched string is drawn first.
   */
  const STRING_LABELS = [...STRING_NAMES].reverse();

  /** Each shape as its three dots, for the band that ties them together. */
  let bands = $derived(
    shapes.map((shape) => ({
      key: `${shape.item.inversion}-${shape.frets.join(",")}`,
      label: positionLabel(shape),
      points: shape.frets
        .map((fret, i) => `${dotX(fret)},${stringY(shape, i)}`)
        .join(" "),
    })),
  );

  /**
   * One dot per spot on the neck. Neighbouring shapes can share a note, and
   * it is the same note with the same job either way, so it is drawn once.
   */
  let dots = $derived.by(() => {
    const seen = new Map<
      string,
      { key: string; x: number; y: number; tone: ChordTone; name: string }
    >();
    for (const shape of shapes) {
      shape.frets.forEach((fret, i) => {
        const y = stringY(shape, i);
        const key = `${y}-${fret}`;
        if (seen.has(key)) return;
        const tone = shape.order[i];
        seen.set(key, {
          key,
          x: dotX(fret),
          y,
          tone,
          name: spelling?.[tone] ?? noteName(shape.tones[tone]),
        });
      });
    }
    return [...seen.values()];
  });

  function fretX(fret: number): number {
    return PAD_LEFT + fret * FRET_WIDTH;
  }

  /**
   * Middle of the space behind a fret wire, which is where a finger goes. An
   * open string has no space, so its dot sits just outside the nut.
   */
  function dotX(fret: number): number {
    return fret === 0 ? OPEN_X : fretX(fret) - FRET_WIDTH / 2;
  }

  function rowY(row: number): number {
    return FIRST_STRING_Y + row * STRING_GAP;
  }

  /**
   * A dot's row on the full neck. `stringIndex` counts within the shape's own
   * string set, so it has to be mapped out to the guitar string it names.
   */
  function stringY(shape: Shape, stringIndex: number): number {
    const string = STRING_SETS[shape.item.string_set].indices[stringIndex];
    return rowY(5 - string);
  }
</script>

<svg viewBox="0 0 {WIDTH} {HEIGHT}" role="img" aria-label="Fretboard diagram">
  {#each SINGLE_INLAYS as fret (fret)}
    <circle class="inlay" cx={dotX(fret)} cy={MIDDLE_Y} r={INLAY_RADIUS} />
  {/each}
  {#each [MIDDLE_Y - STRING_GAP, MIDDLE_Y + STRING_GAP] as cy (cy)}
    <circle class="inlay" cx={dotX(PAIRED_INLAY)} {cy} r={INLAY_RADIUS} />
  {/each}

  <!-- Under the wires and strings, so they pass over it cleanly. -->
  {#each bands as band (band.key)}
    <polyline class="band" points={band.points}>
      <title>{band.label}</title>
    </polyline>
  {/each}

  {#each FRETS as fret (fret)}
    <line
      class="fret-wire"
      class:nut={fret === 0}
      x1={fretX(fret)}
      x2={fretX(fret)}
      y1={FIRST_STRING_Y - 10}
      y2={LAST_STRING_Y + 10}
    />
    {#if fret > 0}
      <text class="fret-num" x={dotX(fret)} y={LAST_STRING_Y + 28}>{fret}</text>
    {/if}
  {/each}

  {#each STRING_LABELS as label, row (row)}
    <line
      class="string"
      x1={PAD_LEFT}
      x2={PAD_LEFT + GRID_WIDTH}
      y1={rowY(row)}
      y2={rowY(row)}
    />
    <text class="string-name" x={LABEL_X} y={rowY(row)}>{label}</text>
  {/each}

  {#each dots as dot (dot.key)}
    <circle class="note {dot.tone}" cx={dot.x} cy={dot.y} r={DOT_RADIUS}>
      <title>{SOLFEGE[dot.tone]} · {dot.name}</title>
    </circle>
    {#if showLabels}
      <text class="note-name {dot.tone}" x={dot.x} y={dot.y}>{dot.name}</text>
    {/if}
  {/each}
</svg>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .inlay {
    fill: var(--color-neutral-200);
  }

  /* A thick round-capped line through the three dots reads as one blob, which
     is what marks out a shape from its neighbours. */
  .band {
    fill: none;
    stroke: color-mix(in srgb, var(--color-text) 9%, transparent);
    stroke-width: 34;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .fret-wire {
    stroke: var(--color-neutral-400);
    stroke-width: 1;
  }

  .fret-wire.nut {
    stroke: var(--color-text);
    stroke-width: 5;
  }

  .string {
    stroke: var(--color-text);
    stroke-width: 1.5;
  }

  .fret-num,
  .string-name {
    font-family: var(--font-body);
    font-size: 11px;
    fill: var(--color-neutral-600);
  }

  .fret-num {
    text-anchor: middle;
  }

  .string-name {
    text-anchor: end;
    dominant-baseline: middle;
  }

  .note {
    stroke: var(--color-bg);
    stroke-width: 1.5;
  }

  .note.root {
    fill: var(--color-do);
  }

  .note.third {
    fill: var(--color-mi);
  }

  .note.fifth {
    fill: var(--color-so);
  }

  .note-name {
    pointer-events: none;
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 11px;
    fill: var(--color-on-tone);
    text-anchor: middle;
    dominant-baseline: central;
  }

  .note-name.fifth {
    fill: var(--color-on-so);
  }
</style>
