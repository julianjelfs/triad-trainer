<script lang="ts">
  import { ZONE_ANCHORS, nearestShape } from '../harmony';
  import { STRING_SETS } from '../music';
  import type { Comper } from '../state/comper.svelte';
  import type { Trainer } from '../state/trainer.svelte';
  import Fretboard from './Fretboard.svelte';
  import ToggleButton from './ToggleButton.svelte';

  let { trainer, comper }: { trainer: Trainer; comper: Comper } = $props();

  let chords = $derived(trainer.compChords);
  let stringSet = $derived(trainer.settings?.comp_string_set ?? 2);

  let current = $derived(chords[comper.chordIndex] ?? chords[0]);
  let nextIndex = $derived((comper.chordIndex + 1) % chords.length);
  let next = $derived(chords[nextIndex]);

  let anchor = $derived(ZONE_ANCHORS[comper.zoneIndex]);

  /**
   * The last chord of a loop leads into the first chord of the next one, which
   * is played in the next zone up. The ghost should be waiting there.
   */
  let nextAnchor = $derived(
    comper.running && !comper.countingIn && nextIndex === 0
      ? ZONE_ANCHORS[(comper.zoneIndex + 1) % ZONE_ANCHORS.length]
      : anchor
  );

  let shape = $derived(current ? nearestShape(current, stringSet, anchor) : null);
  let ghost = $derived(next ? nearestShape(next, stringSet, nextAnchor) : null);
</script>

{#if current && shape}
  <section class="comp">
    <div class="chord">
      {current.name}<span class="numeral">&nbsp;{current.numeral}</span>
    </div>
    <div class="meta">
      {comper.countingIn ? 'Count in' : `Next ${next.name}`} · around fret {anchor} ·
      {STRING_SETS[stringSet].label}
      {#if comper.running}· loop {comper.loop + 1}{/if}
    </div>

    <ol class="progression" aria-label="Progression">
      {#each chords as chord, index (index)}
        <li class:on={comper.running && index === comper.chordIndex && !comper.countingIn}>
          {chord.name}
        </li>
      {/each}
    </ol>

    <div class="diagram">
      <Fretboard
        {shape}
        ghosts={ghost ? [ghost] : []}
        showLabels={trainer.showLabels}
        spelling={current.spelling}
        ghostSpellings={next ? [next.spelling] : []}
      />
    </div>

    <div class="controls">
      <ToggleButton
        label="Note names"
        pressed={trainer.showLabels}
        onToggle={(on) => trainer.setShowLabels(on)}
        small
      />
    </div>

    <p class="helper">
      Play a triad for each chord as it comes round. The solid shape is the nearest one to the
      zone, and the faint one is where the next chord is waiting. Every time round the progression
      the zone moves up two frets, so a full lap takes you up the whole neck.
    </p>

    {#if comper.error}
      <p class="error">{comper.error}</p>
    {/if}
  </section>
{/if}

<style>
  .comp {
    padding: 30px 0 8px;
  }

  .chord {
    font-family: var(--font-heading);
    font-weight: 800;
    font-size: clamp(34px, 5vw, 56px);
    line-height: 1;
    letter-spacing: -0.015em;
  }

  .numeral {
    color: var(--color-accent);
  }

  .meta {
    margin-top: 10px;
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-neutral-600);
  }

  .progression {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 18px 0 0;
    padding: 0;
    list-style: none;
  }

  .progression li {
    min-width: 44px;
    padding: 6px 10px;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    border: 2px solid var(--color-neutral-300);
    color: var(--color-neutral-700);
  }

  .progression li.on {
    border-color: var(--color-accent);
    background: var(--color-accent);
    color: var(--color-bg);
  }

  .diagram {
    margin: 26px 0 4px;
  }

  .controls {
    display: flex;
    justify-content: flex-end;
    margin: 14px 0 12px;
  }

  .helper {
    margin: 6px 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--color-neutral-600);
    max-width: 62ch;
    text-wrap: pretty;
  }

  .error {
    margin: 6px 0;
    font-size: 13px;
    color: var(--color-accent-700);
  }
</style>
