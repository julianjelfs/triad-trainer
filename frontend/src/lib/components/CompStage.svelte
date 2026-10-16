<script lang="ts">
  import { chordShapes } from '../music';
  import type { Comper } from '../state/comper.svelte';
  import type { Trainer } from '../state/trainer.svelte';
  import Fretboard from './Fretboard.svelte';
    import ToneTiles from './ToneTiles.svelte';

  let { trainer, comper }: { trainer: Trainer; comper: Comper } = $props();

  let chords = $derived(trainer.compChords);
  let stringSet = $derived(trainer.settings?.comp_string_set ?? 2);

  let current = $derived(chords[comper.chordIndex] ?? chords[0]);
  let playing = $derived(comper.running && !comper.countingIn);

  /** The same view as learning mode: every shape of the chord that is sounding. */
  let shapes = $derived(
    current
      ? chordShapes({ root_pc: current.root_pc, quality: current.quality, string_set: stringSet })
      : []
  );
</script>

{#if current}
  <section class="hero">
    <div class="name">
      {#key current.name}
        <h1 class="chord">{current.name}</h1>
      {/key}
    </div>
    <ToneTiles spelling={current.spelling} />
  </section>

  <ol class="progression" aria-label="Progression">
    {#each chords as chord, index (index)}
      <li class:on={playing && index === comper.chordIndex}>
        <span class="symbol">{chord.name}</span>
        <span class="numeral-small">{chord.numeral}</span>
      </li>
    {/each}
  </ol>

  <section class="card" aria-label="Every shape of the sounding chord">
    <Fretboard {shapes} showLabels={trainer.showLabels} spelling={current.spelling} />
  </section>

  {#if comper.error}
    <p class="error" role="alert">{comper.error}</p>
  {/if}
{/if}

<style>
  .hero {
    display: grid;
    grid-template-columns: minmax(200px, 1fr) minmax(0, 1.3fr);
    align-items: end;
    gap: 24px;
  }

  .chord {
    margin: 0;
    font-weight: 800;
    font-size: clamp(56px, 7vw, 80px);
    line-height: 0.85;
    letter-spacing: -0.035em;
    font-variation-settings: 'opsz' 96;
    animation: chord-in 320ms var(--ease-out) backwards;
  }

  .progression {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 26px 0 0;
    padding: 0;
    list-style: none;
  }

  .progression li {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    min-height: 40px;
    padding: 10px 16px;
    border-radius: 999px;
    background: var(--sand);
    transition:
      background-color 160ms var(--ease-out),
      color 160ms var(--ease-out);
  }

  .progression li.on {
    background: var(--ink);
    color: var(--paper);
  }

  .symbol {
    font-weight: 700;
  }

  .numeral-small {
    font-size: 13px;
    font-weight: 600;
    color: var(--ink-soft);
  }

  .progression li.on .numeral-small {
    color: var(--sand-strong);
  }

  .card {
    margin-top: 18px;
    padding: 14px 22px 10px;
    border-radius: var(--radius-card);
    background: var(--card);
    box-shadow: 0 1px 2px color-mix(in srgb, var(--ink) 8%, transparent);
  }

  .error {
    margin: 16px 0 0;
    padding: 12px 16px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--do) 12%, var(--paper));
    color: color-mix(in srgb, var(--do) 70%, var(--ink));
    font-size: 14px;
  }

  @keyframes chord-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }

  @media (max-width: 760px) {
    .hero {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }

  @media (max-width: 600px) {
    .card {
      padding: 14px 10px 10px;
    }
  }
</style>
