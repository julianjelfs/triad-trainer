<script lang="ts">
  import CurrentShape from './lib/components/CurrentShape.svelte';
  import MetronomeBar from './lib/components/MetronomeBar.svelte';
  import PracticeLog from './lib/components/PracticeLog.svelte';
  import SettingsPanel from './lib/components/SettingsPanel.svelte';
  import { Metronome } from './lib/state/metronome.svelte';
  import { trainer } from './lib/state/trainer.svelte';
  import { VoiceCommands } from './lib/state/voice.svelte';
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

  onMount(() => trainer.load());
  onDestroy(() => {
    metronome.stop();
    voice.stop();
  });
</script>

<div class="page">
  <header>
    <div class="top">
      <span class="tag tag-accent">Drill</span>
      <span class="strapline">Every key · four string sets</span>
    </div>
    <h1>Triad Trainer</h1>
    <p class="subtitle">
      Root, first inversion, second inversion — every key, four string sets. Say the note before you
      play it.
    </p>
  </header>

  <div class="rule"></div>

  {#if trainer.loading}
    <p class="loading">Loading…</p>
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
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
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
