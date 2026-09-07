<script lang="ts">
  import { SHOW_ROOT_PICKER } from '../config';
  import { INVERSIONS, NOTE_NAMES, QUALITIES, STRING_SETS } from '../music';
  import type { Trainer } from '../state/trainer.svelte';
  import CheckGroup from './CheckGroup.svelte';
  import SectionHeader from './SectionHeader.svelte';

  let { trainer }: { trainer: Trainer } = $props();

  let open = $state(false);

  const setOptions = STRING_SETS.map((set, index) => ({ value: index, label: set.label }));
  const rootOptions = NOTE_NAMES.map((name, index) => ({ value: index, label: name }));

  const TOTAL_SETS = STRING_SETS.length;
  const TOTAL_INVERSIONS = INVERSIONS.length;

  function plural(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
  }

  /** Reads out the filters while the section is shut, so it is never a mystery. */
  let summary = $derived.by(() => {
    const settings = trainer.settings;
    if (!settings) return '';

    const qualities =
      settings.qualities
        .map((value) => QUALITIES.find((quality) => quality.value === value)?.label)
        .join(' + ') || 'no quality';
    const sets =
      settings.sets.length === TOTAL_SETS ? 'all string sets' : plural(settings.sets.length, 'string set');
    const inversions =
      settings.inversions.length === TOTAL_INVERSIONS
        ? 'all inversions'
        : plural(settings.inversions.length, 'inversion');

    return [qualities, sets, inversions].join(' · ');
  });
</script>

{#if trainer.settings}
  <section class="settings">
    <SectionHeader title="Settings" {summary} {open} onToggle={() => (open = !open)} />

    {#if open}
      <div class="groups">
        <CheckGroup
          title="Quality"
          options={QUALITIES}
          selected={trainer.settings.qualities}
          onToggle={trainer.toggleQuality}
        />
        <CheckGroup
          title="String sets"
          options={setOptions}
          selected={trainer.settings.sets}
          onToggle={trainer.toggleSet}
        />
        <CheckGroup
          title="Inversions"
          options={INVERSIONS}
          selected={trainer.settings.inversions}
          onToggle={trainer.toggleInversion}
        />
        {#if SHOW_ROOT_PICKER}
          <CheckGroup
            title="Roots"
            options={rootOptions}
            selected={trainer.settings.roots}
            onToggle={trainer.toggleRoot}
          />
        {/if}
      </div>
    {/if}
  </section>
{/if}

<style>
  .settings {
    padding: 22px 0;
  }

  .groups {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 28px;
    padding: 24px 0 4px;
  }
</style>
