<script lang="ts">
  import { PROGRESSIONS, findProgression, tonicName } from '../harmony';
  import { STRING_SETS } from '../music';
  import type { Comper } from '../state/comper.svelte';
  import type { Trainer } from '../state/trainer.svelte';
  import type { CompInstrument } from '../types';
  import SectionHeader from './SectionHeader.svelte';
  import ToggleGroup from './ToggleGroup.svelte';

  let { trainer, comper }: { trainer: Trainer; comper: Comper } = $props();

  let open = $state(false);

  const progressionOptions = PROGRESSIONS.map((p) => ({ value: p.id, label: p.name }));
  const setOptions = STRING_SETS.map((set, index) => ({ value: index, label: set.label }));
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
    return [key, progression.name, STRING_SETS[settings.comp_string_set].label, sound].join(' · ');
  });

  /** A new key, progression or sound is a different backing, so the old one stops. */
  function changeBacking(patch: Parameters<Trainer['setComp']>[0]) {
    comper.stop();
    trainer.setComp(patch);
  }
</script>

{#if trainer.settings}
  <section class="settings">
    <SectionHeader title="Settings" {summary} {open} onToggle={() => (open = !open)} />

    {#if open}
      <div class="groups">
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
          title="String set"
          options={setOptions}
          selected={[trainer.settings.comp_string_set]}
          onToggle={(value) => trainer.setComp({ comp_string_set: value })}
        />
        <ToggleGroup
          title="Sound"
          options={soundOptions}
          selected={[trainer.settings.comp_instrument]}
          onToggle={(value) => changeBacking({ comp_instrument: value })}
        />
      </div>
    {/if}
  </section>
{/if}

<style>
  .settings {
    padding: 22px 0;
  }

  .groups {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px 0 4px;
  }
</style>
