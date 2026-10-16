<script lang="ts">
  import CompBar from './lib/components/CompBar.svelte';
  import CompSettings from './lib/components/CompSettings.svelte';
  import CompStage from './lib/components/CompStage.svelte';
  import LearnStage from './lib/components/LearnStage.svelte';
  import MetronomeBar from './lib/components/MetronomeBar.svelte';
  import ToggleButton from './lib/components/ToggleButton.svelte';
  import { Comper } from './lib/state/comper.svelte';
  import { Metronome } from './lib/state/metronome.svelte';
  import { trainer } from './lib/state/trainer.svelte';
  import type { Mode } from './lib/types';
  import { onDestroy, onMount } from 'svelte';

  const metronome = new Metronome();
  const comper = new Comper();

  let mode = $derived<Mode>(trainer.settings?.mode ?? 'learn');

  /** Only one thing makes sound at a time, so leaving a mode silences it. */
  function switchMode(next: Mode) {
    if (next === mode) return;
    metronome.stop();
    comper.stop();
    trainer.setMode(next);
  }

  onMount(() => trainer.load());
  onDestroy(() => {
    metronome.stop();
    comper.stop();
  });
</script>

<div class="page">
  <header>
    <div class="top">
      <div class="modes">
        <ToggleButton label="Learn" pressed={mode === 'learn'} onToggle={() => switchMode('learn')} small />
        <ToggleButton label="Comping" pressed={mode === 'comp'} onToggle={() => switchMode('comp')} small />
      </div>
      <span class="strapline">
        {mode === 'learn' ? 'One chord · every shape' : 'Real changes · the whole neck'}
      </span>
    </div>
    <h1>Triad Trainer</h1>
    <p class="subtitle">
      {#if mode === 'learn'}
        Pick a key, a quality and a string set, and see every shape of that triad on the neck. Red
        is do, blue is mi, amber is so.
      {:else}
        Pick a key and a progression, and it plays the changes. The neck shows every shape of the
        chord that is sounding.
      {/if}
    </p>
  </header>

  <div class="rule"></div>

  {#if trainer.loading}
    <p class="loading">Loading…</p>
  {:else if !trainer.settings}
    <!-- Nothing to draw without settings; the notice below says why. -->
  {:else if mode === 'comp'}
    <CompSettings {trainer} {comper} />
    <div class="rule"></div>

    <CompStage {trainer} {comper} />
    <div class="rule"></div>

    <CompBar {trainer} {comper} />
  {:else}
    <LearnStage {trainer} />
    <div class="rule"></div>

    <MetronomeBar {trainer} {metronome} />
  {/if}

  <div class="notice">{trainer.notice}</div>
</div>

<style>
  .page {
    max-width: 1000px;
    margin: 0 auto;
    padding: 40px 28px 72px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .modes {
    display: flex;
    gap: 8px;
  }

  .strapline {
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-neutral-600);
  }

  h1 {
    font-size: clamp(44px, 7vw, 76px);
    line-height: 0.95;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    margin: 18px 0 14px;
  }

  .subtitle {
    margin: 0 0 24px;
    max-width: 52ch;
    font-size: 15px;
    line-height: 1.5;
    color: var(--color-neutral-700);
    text-wrap: pretty;
  }

  .loading {
    padding: 40px 0;
    color: var(--color-neutral-700);
  }

  .notice {
    min-height: 18px;
    margin-top: 28px;
    font-size: 12px;
    color: var(--color-accent-700);
  }
</style>
