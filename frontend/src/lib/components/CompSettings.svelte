<script lang="ts">
  import { PROGRESSIONS, findProgression, tonicName } from '../harmony';
  import { DOT_LABELS, STRING_SETS } from '../music';
  import { KEY_CHANGE_BARS, type Comper } from '../state/comper.svelte';
  import type { Trainer } from '../state/trainer.svelte';
  import type { CompInstrument } from '../types';
  import SettingsPanel from './SettingsPanel.svelte';
  import ToggleGroup from './ToggleGroup.svelte';

  let { trainer, comper }: { trainer: Trainer; comper: Comper } = $props();


  const progressionOptions = PROGRESSIONS.map((p) => ({ value: p.id, label: p.name }));
  const setOptions = STRING_SETS.map((set, index) => ({
    value: index,
    label: set.label.replace('Strings ', '')
  }));
  const showOptions: { value: 'triad' | 'root'; label: string }[] = [
    { value: 'triad', label: 'Whole triad' },
    { value: 'root', label: 'Root only' }
  ];
  const soundOptions: { value: CompInstrument; label: string }[] = [
    { value: 'piano', label: 'Piano' },
    { value: 'guitar', label: 'Guitar' }
  ];

  let progression = $derived(findProgression(trainer.settings?.comp_progression ?? ''));

  /** Minor progressions name their keys as minor keys, spelled the way those are. */
  let keyOptions = $derived(
    Array.from({ length: 12 }, (_, pc) => ({
      value: pc,
      label: tonicName(pc, progression.tonality) + (progression.tonality === 'minor' ? 'm' : '')
    }))
  );

  let summary = $derived.by(() => {
    const settings = trainer.settings;
    if (!settings) return '';
    const key = keyOptions[settings.comp_key].label;
    const sound = soundOptions.find((o) => o.value === settings.comp_instrument)?.label;
    return [
      settings.comp_random_key ? `${key}, new key every ${KEY_CHANGE_BARS} bars` : key,
      progression.name,
      STRING_SETS[settings.comp_string_set].label,
      sound,
      ...(settings.comp_root_only ? ['root only'] : []),
      ...(trainer.showLabels ? [] : ['blank dots'])
    ].join(' · ');
  });

  /** A new key, progression or sound is a different backing, so the old one stops. */
  function changeBacking(patch: Parameters<Trainer["set"]>[0]) {
    comper.stop();
    trainer.set(patch);
  }
</script>

{#if trainer.settings}
  <SettingsPanel {summary}>
    <ToggleGroup
      title="Progression"
      options={progressionOptions}
      selected={[trainer.settings.comp_progression]}
      onToggle={(value) => changeBacking({ comp_progression: value })}
    />
    <ToggleGroup
      title="Key"
      options={keyOptions}
      selected={[trainer.settings.comp_key]}
      onToggle={(value) => changeBacking({ comp_key: value })}
      fixedWidth
    >
      <button
        type="button"
        class="pill dice"
        aria-pressed={trainer.settings.comp_random_key}
        aria-label="New key every {KEY_CHANGE_BARS} bars"
        title="New key every {KEY_CHANGE_BARS} bars"
        onclick={() => trainer.set({ comp_random_key: !trainer.settings?.comp_random_key })}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <rect x="1.5" y="1.5" width="13" height="13" rx="3" />
          <circle cx="5" cy="5" r="1.3" />
          <circle cx="8" cy="8" r="1.3" />
          <circle cx="11" cy="11" r="1.3" />
        </svg>
      </button>
    </ToggleGroup>
    <ToggleGroup
      title="Strings"
      options={setOptions}
      selected={[trainer.settings.comp_string_set]}
      onToggle={(value) => trainer.set({ comp_string_set: value })}
    />
    <ToggleGroup
      title="Show"
      options={showOptions}
      selected={[trainer.settings.comp_root_only ? 'root' : 'triad']}
      onToggle={(value) => trainer.set({ comp_root_only: value === 'root' })}
    />
    <ToggleGroup
      title="Sound"
      options={soundOptions}
      selected={[trainer.settings.comp_instrument]}
      onToggle={(value) => changeBacking({ comp_instrument: value })}
    />
    <ToggleGroup
      title="Dots"
      options={DOT_LABELS}
      selected={[trainer.showLabels ? 'names' : 'blank']}
      onToggle={(value) => trainer.setShowLabels(value === 'names')}
    />
  </SettingsPanel>
{/if}

<style>
  .dice {
    width: 48px;
    padding: 0;
  }

  .dice svg {
    width: 18px;
    height: 18px;
  }

  .dice rect {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
  }

  .dice circle {
    fill: currentColor;
  }
</style>
