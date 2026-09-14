<script lang="ts">
  import { BEATS_PER_BAR } from '../harmony';
  import type { Comper } from '../state/comper.svelte';
  import type { Trainer } from '../state/trainer.svelte';

  let { trainer, comper }: { trainer: Trainer; comper: Comper } = $props();

  const MIN_BPM = 30;
  const MAX_BPM = 160;

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

  function onBpmInput(value: string) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < MIN_BPM || parsed > MAX_BPM) return;
    trainer.setComp({ comp_bpm: parsed });
    comper.retempo(parsed);
  }
</script>

<section class="bar">
  <button type="button" class="btn btn-primary" onclick={toggle}>
    {#if comper.loading}
      Loading samples… ■
    {:else if comper.running}
      ■ Stop comping
    {:else}
      ▶ Start comping
    {/if}
  </button>

  <label class="bpm">
    BPM
    <input
      class="input"
      type="number"
      min={MIN_BPM}
      max={MAX_BPM}
      value={bpm}
      oninput={(event) => onBpmInput(event.currentTarget.value)}
    />
  </label>

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
    gap: 20px;
    flex-wrap: wrap;
    padding: 22px 0;
  }

  .bpm {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-neutral-600);
  }

  .bpm .input {
    width: 72px;
  }

  .beats {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  .beat {
    width: 14px;
    height: 14px;
    background: var(--color-neutral-300);
  }

  .beat.on {
    background: var(--color-accent);
    animation: beat-pulse 150ms ease-out;
  }

  /* The count-in is not a bar of the tune, so it reads as an outline. */
  .counting .beat.on {
    background: transparent;
    box-shadow: inset 0 0 0 2px var(--color-accent);
  }
</style>
