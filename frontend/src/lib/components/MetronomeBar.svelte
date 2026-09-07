<script lang="ts">
  import type { Metronome } from '../state/metronome.svelte';
  import type { Trainer } from '../state/trainer.svelte';

  let { trainer, metronome }: { trainer: Trainer; metronome: Metronome } = $props();

  const MIN_BPM = 30;
  const MAX_BPM = 160;

  let bpm = $derived(trainer.settings?.bpm ?? 60);

  function onBpmInput(value: string) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < MIN_BPM || parsed > MAX_BPM) return;
    trainer.setBpm(parsed);
    metronome.retempo(parsed);
  }
</script>

<section class="bar">
  <button type="button" class="btn btn-primary" onclick={() => metronome.toggle(bpm)}>
    {metronome.running ? '■ Stop metronome' : '▶ Start metronome'}
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

  <div class="beats" aria-hidden="true">
    {#each { length: metronome.beats } as _, index (index)}
      <span class="beat" class:on={metronome.beat === index}></span>
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
</style>
