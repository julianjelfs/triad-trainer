<script lang="ts">
  import { STRING_SETS, inversionLabel, noteName } from '../music';
  import type { Metronome } from '../state/metronome.svelte';
  import type { Trainer } from '../state/trainer.svelte';
  import type { VoiceCommands } from '../state/voice.svelte';
  import CheckRow from './CheckRow.svelte';
  import Fretboard from './Fretboard.svelte';
  import PositionDots from './PositionDots.svelte';

  interface Props {
    trainer: Trainer;
    metronome: Metronome;
    voice: VoiceCommands;
  }

  let { trainer, metronome, voice }: Props = $props();

  let shape = $derived(trainer.shape);

  /**
   * Both buttons move you to a different chord, so both stop the count first
   * rather than leaving it ticking against a shape you are no longer on.
   * Stopping flushes whatever was already played, so nothing is lost.
   */
  function newDrill() {
    metronome.stop();
    void trainer.nextDrill();
  }

  function logAndNext() {
    metronome.stop();
    void trainer.logAndAdvance();
  }
</script>

{#if shape}
  <section class="drill">
    <div class="chord">
      {noteName(shape.item.root_pc)} {shape.item.quality}<!--
      --><span class="inversion">&nbsp;— {inversionLabel(shape.item.inversion).toLowerCase()}</span>
    </div>
    <div class="meta">
      {STRING_SETS[shape.item.string_set].label} · position {trainer.positionIndex + 1} of
      {trainer.positionCount}
    </div>

    <div class="diagram">
      <Fretboard {shape} showLabels={trainer.showLabels} activeString={metronome.beat} />
    </div>

    <div class="controls">
      <PositionDots {trainer} />
      <div class="toggles">
        {#if voice.supported}
          <div class="listen" class:live={voice.listening}>
            <CheckRow
              label={'Listen for “next”'}
              size={14}
              checked={voice.listening}
              onToggle={() => voice.toggle()}
            />
            {#if voice.listening}<span class="pip" aria-hidden="true"></span>{/if}
          </div>
        {/if}
        <CheckRow
          label="Note names"
          size={14}
          checked={trainer.showLabels}
          onToggle={(on) => trainer.setShowLabels(on)}
        />
      </div>
    </div>

    <div class="actions">
      <button type="button" class="btn btn-secondary" onclick={newDrill}>New drill</button>
      <button type="button" class="btn btn-ghost" onclick={logAndNext}>
        Done — log it &amp; next
      </button>
    </div>

    <p class="helper">
      Step through the positions with the squares to get your bearings, then start the metronome to
      walk them up the neck, three beats to a shape.
      {#if voice.supported}
        Turn on Listen and say “next” to move on without letting go of the guitar.
      {/if}
    </p>

    {#if voice.error}
      <p class="voice-error">{voice.error}</p>
    {/if}
  </section>
{:else}
  <section class="empty">
    {trainer.notice || 'Building your first drill…'}
  </section>
{/if}

<style>
  .drill {
    padding: 30px 0 8px;
  }

  .chord {
    font-family: var(--font-heading);
    font-weight: 800;
    font-size: clamp(34px, 5vw, 56px);
    line-height: 1;
    letter-spacing: -0.015em;
  }

  .inversion {
    color: var(--color-accent);
  }

  .meta {
    margin-top: 10px;
    font-size: 13px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-neutral-600);
  }

  .diagram {
    margin: 26px 0 4px;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 14px 0 22px;
  }

  .toggles {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .listen {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .listen.live :global(.label) {
    color: var(--color-accent);
  }

  /* A live mic should be visible without being read as an error. */
  .pip {
    width: 7px;
    height: 7px;
    background: var(--color-accent);
    animation: listening-pulse 1.4s ease-in-out infinite;
  }

  .voice-error {
    margin: 0 0 6px;
    font-size: 13px;
    color: var(--color-accent-700);
  }

  .actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .helper {
    margin: 18px 0 6px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--color-neutral-600);
    max-width: 62ch;
    text-wrap: pretty;
  }

  .empty {
    padding: 40px 0;
    font-size: 15px;
    color: var(--color-neutral-700);
  }
</style>
