<script lang="ts">
  import { STRING_SETS, chordShapes } from '../music';
  import type { Comper } from '../state/comper.svelte';
  import type { Trainer } from '../state/trainer.svelte';
  import Fretboard from './Fretboard.svelte';
  import ToggleButton from './ToggleButton.svelte';
  import ToneLegend from './ToneLegend.svelte';

  let { trainer, comper }: { trainer: Trainer; comper: Comper } = $props();

  let chords = $derived(trainer.compChords);
  let stringSet = $derived(trainer.settings?.comp_string_set ?? 2);

  let current = $derived(chords[comper.chordIndex] ?? chords[0]);
  let next = $derived(chords[(comper.chordIndex + 1) % chords.length]);

  /** The same view as learning mode: every shape of the chord that is sounding. */
  let shapes = $derived(
    current
      ? chordShapes({ root_pc: current.root_pc, quality: current.quality, string_set: stringSet })
      : []
  );
</script>

{#if current}
  <section class="comp">
    <div class="chord">
      {current.name}<span class="numeral">&nbsp;{current.numeral}</span>
    </div>
    <div class="meta">
      {comper.countingIn ? 'Count in' : `Next ${next.name}`} ·
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
      <Fretboard {shapes} showLabels={trainer.showLabels} spelling={current.spelling} />
    </div>

    <div class="controls">
      <ToneLegend spelling={current.spelling} />
      <ToggleButton
        label="Note names"
        pressed={trainer.showLabels}
        onToggle={(on) => trainer.setShowLabels(on)}
        small
      />
    </div>

    <p class="helper">
      Play a triad for each chord as it comes round. The neck shows every shape of the chord that
      is sounding, so pick whichever one is closest to where your hand already is.
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
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
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
