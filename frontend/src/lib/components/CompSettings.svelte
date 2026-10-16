<script lang="ts">
  import { PROGRESSIONS, findProgression, tonicName } from '../harmony';
  import { DOT_LABELS, STRING_SETS } from '../music';
  import type { Comper } from '../state/comper.svelte';
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
      key,
      progression.name,
      STRING_SETS[settings.comp_string_set].label,
      sound,
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
    />
    <ToggleGroup
      title="Strings"
      options={setOptions}
      selected={[trainer.settings.comp_string_set]}
      onToggle={(value) => trainer.set({ comp_string_set: value })}
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
