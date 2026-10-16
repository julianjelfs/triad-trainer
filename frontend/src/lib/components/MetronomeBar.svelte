<script lang="ts">
  import type { Metronome } from '../state/metronome.svelte';
  import type { Trainer } from '../state/trainer.svelte';
  import BpmStepper from './BpmStepper.svelte';
  import ToggleButton from './ToggleButton.svelte';

  let { trainer, metronome }: { trainer: Trainer; metronome: Metronome } = $props();

  let bpm = $derived(trainer.settings?.bpm ?? 60);

  /** Beat one is do, two is mi, three is so. */
  const BEAT_TONES = ['root', 'third', 'fifth'] as const;

  function setBpm(value: number) {
    trainer.set({ bpm: value });
    metronome.retempo(value);
  }
</script>

<section class="bar" aria-label="Metronome">
  <button type="button" class="pill solid play" onclick={() => metronome.toggle(bpm)}>
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {#if metronome.running}
        <rect x="4" y="4" width="8" height="8" rx="1.5" />
      {:else}
        <path d="M5 3.5v9l7.5-4.5z" />
      {/if}
    </svg>
    {metronome.running ? 'Stop' : 'Metronome'}
  </button>

  <BpmStepper {bpm} onChange={setBpm} />

  <div class="names">
    <ToggleButton
      label="Note names"
      pressed={trainer.showLabels}
      onToggle={(on) => trainer.setShowLabels(on)}
      small
    />
  </div>

  <div class="beats" aria-hidden="true">
    {#each BEAT_TONES as tone, index (tone)}
      <span class="beat {tone}" class:on={metronome.beat === index}></span>
    {/each}
  </div>
</section>

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .play {
    min-height: 42px;
    padding: 0 20px 0 16px;
  }

  .play svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }

  .names {
    margin-left: auto;
  }

  .beats {
    display: flex;
    gap: 8px;
  }

  /* No room on a phone; the beat lights matter less than the buttons. */
  @media (max-width: 600px) {
    .beats {
      display: none;
    }
  }

  .beat {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--sand-strong);
    transition: background-color 90ms linear;
  }

  .beat.on {
    animation: beat 260ms var(--ease-out);
  }

  .beat.root.on {
    background: var(--do);
  }

  .beat.third.on {
    background: var(--mi);
  }

  .beat.fifth.on {
    background: var(--so);
  }

  @keyframes beat {
    from {
      transform: scale(1.5);
    }
  }
</style>
