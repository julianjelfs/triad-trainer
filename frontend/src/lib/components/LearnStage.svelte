<script lang="ts">
  import { tonicName } from '../harmony';
  import { QUALITIES, STRING_SETS } from '../music';
  import type { Metronome } from '../state/metronome.svelte';
  import type { Trainer } from '../state/trainer.svelte';
  import type { ChordTone } from '../types';
  import Fretboard from './Fretboard.svelte';
  import MetronomeBar from './MetronomeBar.svelte';
    import ToggleGroup from './ToggleGroup.svelte';
  import ToneTiles from './ToneTiles.svelte';

  let { trainer, metronome }: { trainer: Trainer; metronome: Metronome } = $props();

  let settings = $derived(trainer.settings!);
  let spelling = $derived(trainer.learnSpelling!);

  const setOptions = STRING_SETS.map((set, index) => ({
    value: index,
    label: set.label.replace('Strings ', '')
  }));

  /** Keys named the way the chosen quality spells them: Db major, C# minor. */
  let keyOptions = $derived(
    Array.from({ length: 12 }, (_, pc) => ({
      value: pc,
      label: tonicName(pc, settings.learn_quality)
    }))
  );

  let quality = $derived(QUALITIES.find((q) => q.value === settings.learn_quality)!.label);

  const BEAT_TONES: ChordTone[] = ['root', 'third', 'fifth'];
  let beatTone = $derived(metronome.beat >= 0 ? BEAT_TONES[metronome.beat] : null);
</script>

<div class="learn">
  <section class="hero">
    <h1 class="chord">
      {spelling.root}
      <span class="quality">
        {quality.toLowerCase()}
        <span class="strings">{STRING_SETS[settings.learn_string_set].label.toLowerCase()}</span>
      </span>
    </h1>
    <ToneTiles {spelling} active={beatTone} />
  </section>

  <section class="controls" aria-label="Choose a chord">
    <ToggleGroup
      title="Key"
      options={keyOptions}
      selected={[settings.learn_key]}
      onToggle={(value) => trainer.set({ learn_key: value })}
      fixedWidth
    />
    <div class="pair">
      <ToggleGroup
        title="Quality"
        options={QUALITIES}
        selected={[settings.learn_quality]}
        onToggle={(value) => trainer.set({ learn_quality: value })}
      />
      <ToggleGroup
        title="Strings"
        options={setOptions}
        selected={[settings.learn_string_set]}
        onToggle={(value) => trainer.set({ learn_string_set: value })}
      />
    </div>
  </section>

  <section class="card" aria-label="Every shape on the neck">
    <Fretboard shapes={trainer.learnShapes} showLabels={trainer.showLabels} {spelling} />
  </section>


  <div class="transport">
    <MetronomeBar {trainer} {metronome} />
  </div>
</div>

<style>
  .learn {
    display: flex;
    flex-direction: column;
  }

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
  }

  .quality {
    display: block;
    margin-top: 6px;
    font-weight: 600;
    font-size: 0.42em;
    letter-spacing: -0.015em;
    color: var(--ink-soft);
  }

  .strings {
    margin-left: 10px;
    font-weight: 500;
    font-size: 15px;
    letter-spacing: 0;
    color: var(--ink-soft);
    font-variation-settings: 'opsz' 14;
  }

  .card {
    margin-top: 18px;
    padding: 14px 22px 10px;
    border-radius: var(--radius-card);
    background: var(--card);
    box-shadow: 0 1px 2px color-mix(in srgb, var(--ink) 8%, transparent);
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 18px;
  }

  .pair {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 40px;
  }

  /* Only the first group lines up with Key; the second sits beside it. */
  @media (min-width: 601px) {
    .pair > :global(.group:last-child) {
      grid-template-columns: auto 1fr;
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
      margin-top: 24px;
      padding: 14px 10px 10px;
    }

    .controls,
    .pair {
      gap: 18px;
    }

    .controls {
      margin-top: 24px;
    }

  }
</style>
