<script lang="ts">
  import {
    MAX_FRET,
    STRING_NAMES,
    STRING_SETS,
    noteName,
    positionLabel,
  } from "../music";
  import type { Shape } from "../types";

  interface Props {
    shape: Shape;
    showLabels: boolean;
    /**
     * Every position in the drill, drawn faintly behind the neck. Includes the
     * current one, which is drawn again solid on top, so the faint layer never
     * changes as you step and nothing appears or disappears under the move.
     */
    ghosts?: Shape[];
    /** Index of the string the metronome is calling, or -1 when it is stopped. */
    activeString?: number;
    /** Right edge of the neck. Fixed for every drill so shapes visibly climb it. */
    highestFret?: number;
    showInlays?: boolean;
    /**
     * Called with the index of the ghost the reader picked. The ghosts are
     * controls, not just context: the shape you want to see next is already
     * drawn where it lives, so you can go straight to it rather than counting
     * steps to it on the squares underneath.
     */
    onSelect: (index: number) => void;
  }

  let {
    shape,
    showLabels,
    ghosts = [],
    activeString = -1,
    highestFret = MAX_FRET,
    showInlays = true,
    onSelect,
  }: Props = $props();

  // Viewbox units. The SVG scales to its container, so these set proportion only.
  const PAD_LEFT = 52;
  const PAD_RIGHT = 16;
  const FRET_WIDTH = 26;
  const FIRST_STRING_Y = 22;
  const STRING_GAP = 30;
  const LAST_STRING_Y = FIRST_STRING_Y + 5 * STRING_GAP;
  const HEIGHT = 212;
  const DOT_RADIUS = 11;

  /** Single dots here, a pair at the twelfth. Standard neck markers. */
  const SINGLE_INLAYS = [3, 5, 7, 9, 15];
  const PAIRED_INLAY = 12;
  const INLAY_RADIUS = 4;

  let width = $derived(PAD_LEFT + highestFret * FRET_WIDTH + PAD_RIGHT);
  let gridWidth = $derived(highestFret * FRET_WIDTH);
  let frets = $derived(
    Array.from({ length: highestFret + 1 }, (_, fret) => fret),
  );

  let inlays = $derived(SINGLE_INLAYS.filter((fret) => fret <= highestFret));
  let middleY = FIRST_STRING_Y + 2.5 * STRING_GAP;

  /**
   * All six strings, every drill, so the three you are playing always sit in
   * the same place on the neck you already know rather than floating in a
   * three-line diagram that has to be re-read each time the set changes.
   * Rows run top to bottom, so the highest-pitched string is drawn first.
   */
  let stringLabels = [...STRING_NAMES].reverse();

  // Where the whole drill sits, so the shape you are on has context. Grouped
  // by position rather than flattened, so a click on any of a shape's three
  // notes is a click on that shape.
  let ghostShapes = $derived(
    ghosts.map((position, positionIndex) => ({
      index: positionIndex,
      label: positionLabel(position),
      dots: position.frets.map((fret, stringIndex) => ({
        key: `${stringIndex}-${fret}`,
        x: fret === 0 ? PAD_LEFT + 2 : spaceCentre(fret),
        y: stringY(position, stringIndex),
      })),
    })),
  );

  let dots = $derived(
    shape.frets.map((fret, stringIndex) => {
      const tone = shape.order[stringIndex];
      return {
        stringIndex,
        name: noteName(shape.tones[tone]),
        x: fret === 0 ? PAD_LEFT + 2 : spaceCentre(fret),
        y: stringY(shape, stringIndex),
        isRoot: tone === "root",
      };
    }),
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

  /**
   * A dot's row on the full neck. `stringIndex` counts within the shape's own
   * string set, so it has to be mapped out to the guitar string it names.
   */
  function stringY(position: Shape, stringIndex: number): number {
    const string = STRING_SETS[position.item.string_set].indices[stringIndex];
    return rowY(5 - string);
  }
</script>

<svg viewBox="0 0 {width} {HEIGHT}" role="img" aria-label="Fretboard diagram">
  {#if showInlays}
    {#each inlays as fret (fret)}
      <circle
        class="inlay"
        cx={spaceCentre(fret)}
        cy={middleY}
        r={INLAY_RADIUS}
      />
    {/each}
    {#if highestFret >= PAIRED_INLAY}
      {#each [middleY - STRING_GAP, middleY + STRING_GAP] as cy (cy)}
        <circle
          class="inlay"
          cx={spaceCentre(PAIRED_INLAY)}
          {cy}
          r={INLAY_RADIUS}
        />
      {/each}
    {/if}
  {/if}

  {#each ghostShapes as ghost (ghost.index)}
    <g
      class="ghost-shape"
      role="button"
      tabindex="0"
      aria-label="Show {ghost.label}"
      onclick={() => onSelect(ghost.index)}
      onkeydown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(ghost.index);
        }
      }}
    >
      {#each ghost.dots as dot (dot.key)}
        <circle class="ghost" cx={dot.x} cy={dot.y} r={DOT_RADIUS} />
      {/each}
    </g>
  {/each}

  {#each frets as fret (fret)}
    <line
      class="fret-wire"
      class:nut={fret === 0}
      x1={fretX(fret)}
      x2={fretX(fret)}
      y1={FIRST_STRING_Y - 10}
      y2={LAST_STRING_Y + 10}
    />
    {#if fret > 0}
      <text class="fret-num" x={spaceCentre(fret)} y={LAST_STRING_Y + 28}
        >{fret}</text
      >
    {/if}
  {/each}

  {#each stringLabels as label, row (row)}
    <line
      class="string"
      x1={PAD_LEFT}
      x2={PAD_LEFT + gridWidth}
      y1={rowY(row)}
      y2={rowY(row)}
    />
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
      <text class="note-name" class:on-root={dot.isRoot} x={dot.x} y={dot.y}
        >{dot.name}</text
      >
    {/if}
  {/each}
</svg>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
  }

  /* The neck is decoration. Without this the strings and wires, drawn over the
     ghosts, swallow clicks aimed at the middle of a ghost — which is exactly
     where a dot sits on its string. */
  .inlay,
  .fret-wire,
  .string,
  .fret-num,
  .string-name {
    pointer-events: none;
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

  /* A wash rather than an outline, drawn before the wires and strings so they
     pass over it cleanly rather than being tinted by it. */
  .ghost {
    fill: color-mix(in srgb, var(--color-text) 10%, transparent);
    stroke: none;
  }

  .ghost-shape {
    cursor: pointer;
  }

  .ghost-shape:hover .ghost,
  .ghost-shape:focus-visible .ghost {
    fill: color-mix(in srgb, var(--color-accent) 35%, transparent);
  }

  .ghost-shape:focus {
    outline: none;
  }

  /* The solid dots sit on top of the current shape's own ghost, so they let
     clicks through rather than being a dead patch in the middle of the neck. */
  .note,
  .note-name {
    pointer-events: none;
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
    transition: x 130ms ease-out;
  }

  .note-name.on-root {
    fill: var(--color-bg);
  }
</style>
