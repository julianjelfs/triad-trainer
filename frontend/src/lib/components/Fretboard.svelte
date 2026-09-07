<script lang="ts">
  import { MAX_FRET, STRING_SETS, noteName } from '../music';
  import type { Shape } from '../types';

  interface Props {
    shape: Shape;
    showLabels: boolean;
    /** Index of the string the metronome is calling, or -1 when it is stopped. */
    activeString?: number;
    /** Right edge of the neck. Fixed for every drill so shapes visibly climb it. */
    highestFret?: number;
    showInlays?: boolean;
  }

  let {
    shape,
    showLabels,
    activeString = -1,
    highestFret = MAX_FRET,
    showInlays = true
  }: Props = $props();

  // Viewbox units. The SVG scales to its container, so these set proportion only.
  const PAD_LEFT = 52;
  const PAD_RIGHT = 16;
  const FRET_WIDTH = 26;
  const FIRST_STRING_Y = 24;
  const STRING_GAP = 47;
  const HEIGHT = 156;
  const DOT_RADIUS = 11;

  /** Single dots here, a pair at the twelfth. Standard neck markers. */
  const SINGLE_INLAYS = [3, 5, 7, 9, 15];
  const PAIRED_INLAY = 12;
  const INLAY_RADIUS = 4;

  let width = $derived(PAD_LEFT + highestFret * FRET_WIDTH + PAD_RIGHT);
  let gridWidth = $derived(highestFret * FRET_WIDTH);
  let frets = $derived(Array.from({ length: highestFret + 1 }, (_, fret) => fret));

  let inlays = $derived(SINGLE_INLAYS.filter((fret) => fret <= highestFret));
  let middleY = FIRST_STRING_Y + STRING_GAP;

  /** Rows run top to bottom, so the highest-pitched string is drawn first. */
  let stringLabels = $derived([...STRING_SETS[shape.item.string_set].names].reverse());

  let dots = $derived(
    shape.frets.map((fret, stringIndex) => {
      const tone = shape.order[stringIndex];
      return {
        stringIndex,
        name: noteName(shape.tones[tone]),
        x: fret === 0 ? PAD_LEFT + 2 : spaceCentre(fret),
        y: rowY(2 - stringIndex),
        isRoot: tone === 'root'
      };
    })
  );

  function fretX(fret: number): number {
    return PAD_LEFT + fret * FRET_WIDTH;
  }

  /** Middle of the space behind a fret wire, which is where a finger goes. */
  function spaceCentre(fret: number): number {
    return fretX(fret) - FRET_WIDTH / 2;
  }

  function rowY(row: number): number {
    return FIRST_STRING_Y + row * STRING_GAP;
  }
</script>

<svg viewBox="0 0 {width} {HEIGHT}" role="img" aria-label="Fretboard diagram">
  {#if showInlays}
    {#each inlays as fret (fret)}
      <circle class="inlay" cx={spaceCentre(fret)} cy={middleY} r={INLAY_RADIUS} />
    {/each}
    {#if highestFret >= PAIRED_INLAY}
      {#each [middleY - 24, middleY + 24] as cy (cy)}
        <circle class="inlay" cx={spaceCentre(PAIRED_INLAY)} {cy} r={INLAY_RADIUS} />
      {/each}
    {/if}
  {/if}

  {#each frets as fret (fret)}
    <line class="fret-wire" class:nut={fret === 0} x1={fretX(fret)} x2={fretX(fret)} y1="14" y2="128" />
    {#if fret > 0}
      <text class="fret-num" x={spaceCentre(fret)} y="150">{fret}</text>
    {/if}
  {/each}

  {#each stringLabels as label, row (row)}
    <line class="string" x1={PAD_LEFT} x2={PAD_LEFT + gridWidth} y1={rowY(row)} y2={rowY(row)} />
    <text class="string-name" x={PAD_LEFT - 10} y={rowY(row)}>{label}</text>
  {/each}

  {#each dots as dot (dot.stringIndex)}
    <circle
      class="note"
      class:root={dot.isRoot}
      class:active={dot.stringIndex === activeString}
      cx={dot.x}
      cy={dot.y}
      r={DOT_RADIUS}
    />
    {#if showLabels}
      <text class="note-name" class:on-root={dot.isRoot} x={dot.x} y={dot.y}>{dot.name}</text>
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
    fill: var(--color-bg);
    stroke: var(--color-text);
    stroke-width: 1.5;
    transition: cx 130ms ease-out;
  }

  .note.root {
    fill: var(--color-accent);
  }

  .note.active {
    stroke: var(--color-accent);
    stroke-width: 3.5;
  }

  .note-name {
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 11px;
    fill: var(--color-text);
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
    transition: x 130ms ease-out;
  }

  .note-name.on-root {
    fill: var(--color-bg);
  }
</style>
