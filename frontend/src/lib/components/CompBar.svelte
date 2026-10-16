<script lang="ts">
  import { BEATS_PER_BAR } from '../harmony';
  import type { Comper } from '../state/comper.svelte';
  import type { Trainer } from '../state/trainer.svelte';
  import BpmStepper from './BpmStepper.svelte';
  import ToggleButton from './ToggleButton.svelte';

  let { trainer, comper }: { trainer: Trainer; comper: Comper } = $props();

  let bpm = $derived(trainer.settings?.comp_bpm ?? 80);

  function toggle() {
    if (comper.running || comper.loading) {
      comper.stop();
      return;
    }
    void comper.start({
      chords: trainer.compChords,
      bpm,
      instrument: trainer.settings?.comp_instrument ?? 'piano'
    });
  }

  function setBpm(value: number) {
    trainer.set({ comp_bpm: value });
    comper.retempo(value);
  }
</script>

<section class="bar" aria-label="Backing">
  <button type="button" class="pill solid play" onclick={toggle}>
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {#if comper.running || comper.loading}
        <rect x="4" y="4" width="8" height="8" rx="1.5" />
      {:else}
        <path d="M5 3.5v9l7.5-4.5z" />
      {/if}
    </svg>
    {#if comper.loading}
      Loading samples…
    {:else if comper.running}
      Stop
    {:else}
      Start comping
    {/if}
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

  <div class="beats" class:counting={comper.countingIn} aria-hidden="true">
    {#each { length: BEATS_PER_BAR } as _, index (index)}
      <span class="beat" class:on={comper.beat === index}></span>
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
  }

  .beat.on {
    background: var(--ink);
    animation: beat 260ms var(--ease-out);
  }

  /* The count-in is not a bar of the tune, so it shows as a ring. */
  .counting .beat.on {
    background: transparent;
    box-shadow: inset 0 0 0 3px var(--ink);
  }

  @keyframes beat {
    from {
      transform: scale(1.5);
    }
  }
</style>
