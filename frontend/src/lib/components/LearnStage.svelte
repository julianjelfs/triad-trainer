<script lang="ts">
  import { tonicName } from '../harmony';
  import { QUALITIES, STRING_SETS } from '../music';
  import type { Trainer } from '../state/trainer.svelte';
  import Fretboard from './Fretboard.svelte';
  import ToggleButton from './ToggleButton.svelte';
  import ToggleGroup from './ToggleGroup.svelte';
  import ToneLegend from './ToneLegend.svelte';

  let { trainer }: { trainer: Trainer } = $props();

  let settings = $derived(trainer.settings!);
  let spelling = $derived(trainer.learnSpelling!);

  const setOptions = STRING_SETS.map((set, index) => ({ value: index, label: set.label }));

  /** Keys named the way the chosen quality spells them: Db major, C# minor. */
  let keyOptions = $derived(
    Array.from({ length: 12 }, (_, pc) => ({
      value: pc,
      label: tonicName(pc, settings.learn_quality)
    }))
  );

  let quality = $derived(QUALITIES.find((q) => q.value === settings.learn_quality)!.label);
</script>

<section class="choose">
  <ToggleGroup
    title="Key"
    options={keyOptions}
    selected={[settings.learn_key]}
    onToggle={(value) => trainer.set({ learn_key: value })}
    fixedWidth
  />
  <ToggleGroup
    title="Quality"
    options={QUALITIES}
    selected={[settings.learn_quality]}
    onToggle={(value) => trainer.set({ learn_quality: value })}
  />
  <ToggleGroup
    title="String set"
    options={setOptions}
    selected={[settings.learn_string_set]}
    onToggle={(value) => trainer.set({ learn_string_set: value })}
  />
</section>

<div class="rule"></div>

<section class="stage">
  <div class="chord">{spelling.root} {quality.toLowerCase()}</div>
  <div class="meta">
    {STRING_SETS[settings.learn_string_set].label} · {trainer.learnShapes.length} shapes
  </div>

  <div class="diagram">
    <Fretboard shapes={trainer.learnShapes} showLabels={trainer.showLabels} {spelling} />
  </div>

  <div class="under">
    <ToneLegend {spelling} />
    <ToggleButton
      label="Note names"
      pressed={trainer.showLabels}
      onToggle={(on) => trainer.setShowLabels(on)}
      small
    />
  </div>
</section>

<style>
  .choose {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px 0;
  }

  .stage {
    padding: 30px 0 8px;
  }

  .chord {
    font-family: var(--font-heading);
    font-weight: 800;
    font-size: clamp(34px, 5vw, 56px);
    line-height: 1;
    letter-spacing: -0.015em;
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

  .under {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
    margin: 14px 0 12px;
  }
</style>
