<script lang="ts">
  import CompBar from './lib/components/CompBar.svelte';
  import CompSettings from './lib/components/CompSettings.svelte';
  import CompStage from './lib/components/CompStage.svelte';
  import LearnStage from './lib/components/LearnStage.svelte';
  import Segmented from './lib/components/Segmented.svelte';
  import { Comper } from './lib/state/comper.svelte';
  import { Metronome } from './lib/state/metronome.svelte';
  import { trainer } from './lib/state/trainer.svelte';
  import type { Mode } from './lib/types';
  import { onDestroy, onMount } from 'svelte';

  const metronome = new Metronome();
  const comper = new Comper();

  const MODES: { value: Mode; label: string }[] = [
    { value: 'learn', label: 'Learn' },
    { value: 'comp', label: 'Comping' }
  ];

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
    <span class="wordmark">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="6" cy="17" r="4.2" fill="var(--do)" />
        <circle cx="12" cy="7.5" r="4.2" fill="var(--mi)" />
        <circle cx="18" cy="17" r="4.2" fill="var(--so)" />
      </svg>
      Triad Trainer
    </span>
    <Segmented label="Mode" options={MODES} value={mode} onChange={switchMode} />
  </header>

  <main>
    {#if trainer.loading}
      <p class="status">Loading…</p>
    {:else if !trainer.settings}
      <!-- Nothing to draw without settings; the notice below says why. -->
    {:else if mode === 'comp'}
      <CompStage {trainer} {comper} />
      <CompSettings {trainer} {comper} />
      <div class="transport">
        <CompBar {trainer} {comper} />
      </div>
    {:else}
      <LearnStage {trainer} {metronome} />
    {/if}
  </main>

  {#if trainer.notice}
    <p class="notice" role="status">{trainer.notice}</p>
  {/if}
</div>

<style>
  .page {
    max-width: 1040px;
    margin: 0 auto;
    padding: 20px 32px 0;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
  }

  .wordmark {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    font-size: 18px;
    letter-spacing: -0.01em;
  }

  .wordmark svg {
    width: 24px;
    height: 24px;
  }

  .status {
    color: var(--ink-soft);
  }

  .notice {
    margin: 28px 0 0;
    padding: 12px 16px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--do) 12%, var(--paper));
    color: color-mix(in srgb, var(--do) 70%, var(--ink));
    font-size: 14px;
  }

  @media (max-width: 600px) {
    .page {
      padding: 14px 16px 0;
    }

    header {
      margin-bottom: 24px;
    }

    .wordmark {
      font-size: 16px;
    }
  }
</style>
