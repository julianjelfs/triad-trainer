<script lang="ts">
  import CompBar from './lib/components/CompBar.svelte';
  import CompSettings from './lib/components/CompSettings.svelte';
  import CompStage from './lib/components/CompStage.svelte';
  import CurrentShape from './lib/components/CurrentShape.svelte';
  import MetronomeBar from './lib/components/MetronomeBar.svelte';
  import PracticeLog from './lib/components/PracticeLog.svelte';
  import SettingsPanel from './lib/components/SettingsPanel.svelte';
  import ToggleButton from './lib/components/ToggleButton.svelte';
  import { Comper } from './lib/state/comper.svelte';
  import { Metronome } from './lib/state/metronome.svelte';
  import { trainer } from './lib/state/trainer.svelte';
  import { VoiceCommands } from './lib/state/voice.svelte';
  import type { Mode } from './lib/types';
  import { onDestroy, onMount } from 'svelte';

  const voice = new VoiceCommands(() => trainer.nextPosition());

  // The metronome drives the drill: it restarts the cycle, steps it on each bar
  // line, and banks whatever was played when it stops. Voice stepping is for
  // the phase before that, and the mic would only hear the clicks, so counting
  // and listening never run at once.
  const metronome = new Metronome({
    onStart: () => {
      voice.stop();
      trainer.restartCycle();
    },
    onBar: () => trainer.advance(),
    onStop: () => trainer.flushPlayed()
  });

  const comper = new Comper();

  let mode = $derived<Mode>(trainer.settings?.mode ?? 'drill');

  /** Only one thing makes sound at a time, so leaving a mode silences it. */
  function switchMode(next: Mode) {
    if (next === mode) return;
    metronome.stop();
    comper.stop();
    voice.stop();
    trainer.setMode(next);
  }

  onMount(() => trainer.load());
  onDestroy(() => {
    metronome.stop();
    comper.stop();
    voice.stop();
  });
</script>

<div class="page">
  <header>
    <div class="top">
      <div class="modes">
        <ToggleButton label="Drill" pressed={mode === 'drill'} onToggle={() => switchMode('drill')} small />
        <ToggleButton label="Comping" pressed={mode === 'comp'} onToggle={() => switchMode('comp')} small />
      </div>
      <span class="strapline">
        {mode === 'drill' ? 'Every key · four string sets' : 'Real changes · the whole neck'}
      </span>
    </div>
    <h1>Triad Trainer</h1>
    <p class="subtitle">
      {#if mode === 'drill'}
        Root, first inversion, second inversion — every key, four string sets. Say the note before you
        play it.
      {:else}
        Pick a key and a progression, and it plays the changes. You play triads over them, a zone of
        the neck at a time.
      {/if}
    </p>
  </header>

  <div class="rule"></div>

  {#if trainer.loading}
    <p class="loading">Loading…</p>
  {:else if mode === 'comp'}
    <CompSettings {trainer} {comper} />
    <div class="rule"></div>

    <CompStage {trainer} {comper} />
    <div class="rule"></div>

    <CompBar {trainer} {comper} />
  {:else}
    <SettingsPanel {trainer} />
    <div class="rule"></div>

    <CurrentShape {trainer} {metronome} {voice} />
    <div class="rule"></div>

    <MetronomeBar {trainer} {metronome} />
    <div class="rule"></div>

    <PracticeLog {trainer} />
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
