<script lang="ts">
  import { MAX_FRET, SOLFEGE, STRING_SETS, noteName, positionLabel } from "../music";
  import type { ChordTone, Shape } from "../types";

  interface Props {
    /** Every shape to draw. All of them are drawn the same way, none is current. */
    shapes: Shape[];
    showLabels: boolean;
    /** Note names as the key spells them. Without it, labels use sharps. */
    spelling?: Record<ChordTone, string> | null;
  }

  let { shapes, showLabels, spelling }: Props = $props();

  /**
   * On a phone the neck stands up, nut at the top and low E on the left, the
   * way chord charts draw it. Lying down it would be too thin to read.
   */
  let vertical = $state(false);

  $effect(() => {
    const query = window.matchMedia("(max-width: 600px)");
    vertical = query.matches;
    const update = (event: MediaQueryListEvent) => (vertical = event.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  });

  /**
   * Viewbox units. "Along" runs up the neck, "across" runs over the strings.
   * The SVG scales to its container, so these set proportion only.
   */
  interface Geometry {
    alongStart: number;
    fretLength: number;
    acrossStart: number;
    stringGap: number;
    dotRadius: number;
    width: number;
    height: number;
  }

  const LYING: Geometry = {
    alongStart: 84,
    fretLength: 28,
    acrossStart: 18,
    stringGap: 25,
    dotRadius: 11,
    width: 84 + MAX_FRET * 28 + 16,
    height: 182,
  };

  const STANDING: Geometry = {
    alongStart: 54,
    fretLength: 34,
    acrossStart: 40,
    stringGap: 42,
    dotRadius: 14,
    width: 40 + 5 * 42 + 26,
    height: 54 + MAX_FRET * 34 + 12,
  };

  let g = $derived(vertical ? STANDING : LYING);
  let acrossEnd = $derived(g.acrossStart + 5 * g.stringGap);
  let alongEnd = $derived(g.alongStart + MAX_FRET * g.fretLength);

  const FRETS = Array.from({ length: MAX_FRET + 1 }, (_, fret) => fret);
  /** Single dots here, a pair at the twelfth. Standard neck markers. */
  const SINGLE_INLAYS = [3, 5, 7, 9, 15];
  const PAIRED_INLAY = 12;

  /** Lowest-pitched first, like everything else in the app. */
  const LYING_NAMES = ["low E", "A", "D", "G", "B", "high E"];
  const STANDING_NAMES = ["E", "A", "D", "G", "B", "e"];

  /** Point on screen from a spot along the neck and a spot across it. */
  function at(along: number, across: number): { x: number; y: number } {
    return vertical ? { x: across, y: along } : { x: along, y: across };
  }

  function wire(fret: number): number {
    return g.alongStart + fret * g.fretLength;
  }

  /**
   * Middle of the space behind a fret wire, which is where a finger goes. An
   * open string has no space, so its dot sits just outside the nut.
   */
  function dotAlong(fret: number): number {
    return fret === 0
      ? g.alongStart - g.dotRadius - 4
      : wire(fret) - g.fretLength / 2;
  }

  /** Guitar string 0 is low E. Lying down it is the bottom row. */
  function stringAcross(string: number): number {
    return g.acrossStart + (vertical ? string : 5 - string) * g.stringGap;
  }

  function guitarString(shape: Shape, index: number): number {
    return STRING_SETS[shape.item.string_set].indices[index];
  }

  let middleAcross = $derived(g.acrossStart + 2.5 * g.stringGap);

  let bands = $derived(
    shapes.map((shape) => ({
      key: `${shape.item.inversion}-${shape.frets.join(",")}`,
      label: positionLabel(shape),
      points: shape.frets
        .map((fret, i) => {
          const p = at(dotAlong(fret), stringAcross(guitarString(shape, i)));
          return `${p.x},${p.y}`;
        })
        .join(" "),
    })),
  );

  /**
   * One dot per spot on the neck. Neighbouring shapes can share a note, and
   * it is the same note with the same job either way, so it is drawn once.
   * Each carries its share of the sweep, from the nut up.
   */
  let dots = $derived.by(() => {
    const seen = new Map<
      string,
      { key: string; x: number; y: number; tone: ChordTone; name: string; delay: number }
    >();
    for (const shape of shapes) {
      shape.frets.forEach((fret, i) => {
        const key = `${guitarString(shape, i)}-${fret}`;
        if (seen.has(key)) return;
        const tone = shape.order[i];
        const p = at(dotAlong(fret), stringAcross(guitarString(shape, i)));
        seen.set(key, {
          key,
          ...p,
          tone,
          name: spelling?.[tone] ?? noteName(shape.tones[tone]),
          delay: Math.round((fret / MAX_FRET) * SWEEP_MS),
        });
      });
    }
    return [...seen.values()];
  });

  /** How long the sweep takes to travel the neck. */
  const SWEEP_MS = 220;

  /** Changes whenever the chord does, so the dots re-mount and sweep again. */
  let chordKey = $derived(
    shapes.map((shape) => shape.frets.join(".")).join("|") + (spelling?.root ?? ""),
  );

  let description = $derived(
    shapes.length
      ? `Fretboard with ${shapes.length} shapes: ${bands.map((band) => band.label).join("; ")}`
      : "Fretboard",
  );
</script>

<svg
  viewBox="0 0 {g.width} {g.height}"
  class:vertical
  role="img"
  aria-label={description}
>
  {#each SINGLE_INLAYS as fret (fret)}
    {@const p = at(dotAlong(fret), middleAcross)}
    <circle class="inlay" cx={p.x} cy={p.y} r="4.5" />
  {/each}
  {#each [-1, 1] as side (side)}
    {@const p = at(dotAlong(PAIRED_INLAY), middleAcross + side * g.stringGap)}
    <circle class="inlay" cx={p.x} cy={p.y} r="4.5" />
  {/each}

  {#key chordKey}
    <g class="bands">
      {#each bands as band (band.key)}
        <polyline
          class="band"
          points={band.points}
          stroke-width={2 * g.dotRadius + 12}
        />
      {/each}
    </g>
  {/key}

  {#each FRETS as fret (fret)}
    {@const a = at(wire(fret), g.acrossStart - 10)}
    {@const b = at(wire(fret), acrossEnd + 10)}
    <line class="fret" class:nut={fret === 0} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
    {#if fret > 0}
      {@const n = vertical
        ? at(dotAlong(fret), g.acrossStart - 26)
        : at(dotAlong(fret), acrossEnd + 26)}
      <text class="fret-number figures" x={n.x} y={n.y}>{fret}</text>
    {/if}
  {/each}

  {#each LYING_NAMES as _, string (string)}
    {@const a = at(g.alongStart, stringAcross(string))}
    {@const b = at(alongEnd, stringAcross(string))}
    {@const label = at(dotAlong(0) - g.dotRadius - 10, stringAcross(string))}
    <line
      class="string"
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke-width={1 + (5 - string) * 0.22}
    />
    <text class="string-name" class:end={!vertical} x={label.x} y={label.y}>
      {vertical ? STANDING_NAMES[string] : LYING_NAMES[string]}
    </text>
  {/each}

  {#key chordKey}
    <g>
      {#each dots as dot (dot.key)}
        <g class="dot" style="animation-delay: {dot.delay}ms">
          <circle class="note {dot.tone}" cx={dot.x} cy={dot.y} r={g.dotRadius}>
            <title>{SOLFEGE[dot.tone]} · {dot.name}</title>
          </circle>
          {#if showLabels}
            <text
              class="note-name {dot.tone}"
              x={dot.x}
              y={dot.y}
              font-size={vertical ? 14 : 11.5}>{dot.name}</text
            >
          {/if}
        </g>
      {/each}
    </g>
  {/key}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
  }

  svg.vertical {
    max-width: 380px;
    margin: 0 auto;
  }

  .inlay {
    fill: var(--inlay);
  }

  /* A thick round-capped line through a shape's three notes reads as one
     blob, which marks it out from its neighbours. */
  .band {
    fill: none;
    stroke: var(--band);
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .bands {
    animation: fade-in 420ms var(--ease-out) backwards;
  }

  .fret {
    stroke: var(--fret);
    stroke-width: 1.5;
  }

  .fret.nut {
    stroke: var(--ink);
    stroke-width: 6;
    stroke-linecap: round;
  }

  .string {
    stroke: var(--string);
  }

  .fret-number,
  .string-name {
    font-size: 11px;
    font-weight: 600;
    fill: var(--ink-soft);
    text-anchor: middle;
    dominant-baseline: central;
  }

  .string-name {
    font-weight: 600;
    fill: var(--ink-soft);
  }

  .string-name.end {
    text-anchor: end;
  }

  .dot {
    transform-box: fill-box;
    transform-origin: center;
    animation: dot-in 420ms var(--ease-out) backwards;
  }

  .note {
    stroke: var(--card);
    stroke-width: 2.5;
  }

  .note.root {
    fill: var(--do);
  }

  /* Marigold on cream is faint, so mi gets its own darker rim. */
  .note.third {
    fill: var(--mi);
    stroke: var(--mi-edge);
    stroke-width: 1.5;
  }

  .note.fifth {
    fill: var(--so);
  }

  .note-name {
    pointer-events: none;
    font-weight: 800;
    text-anchor: middle;
    dominant-baseline: central;
  }

  .note-name.root {
    fill: var(--on-do);
  }

  .note-name.third {
    fill: var(--on-mi);
  }

  .note-name.fifth {
    fill: var(--on-so);
  }

  @keyframes dot-in {
    from {
      opacity: 0;
      transform: scale(0.55);
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
</style>
