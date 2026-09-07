<script lang="ts">
  import { SHOW_INVERSION_PICKER, SHOW_ROOT_PICKER } from '../config';
  import { INVERSIONS, NOTE_NAMES, QUALITIES, STRING_SETS } from '../music';
  import type { Trainer } from '../state/trainer.svelte';
  import SectionHeader from './SectionHeader.svelte';
  import ToggleGroup from './ToggleGroup.svelte';

  let { trainer }: { trainer: Trainer } = $props();

  let open = $state(false);

  const setOptions = STRING_SETS.map((set, index) => ({ value: index, label: set.label }));
  const rootOptions = NOTE_NAMES.map((name, index) => ({ value: index, label: name }));

  const TOTAL_SETS = STRING_SETS.length;
  const TOTAL_INVERSIONS = INVERSIONS.length;
  const TOTAL_ROOTS = NOTE_NAMES.length;

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

    // Naming the keys outright while there are few of them, because a narrowed
    // selection is the easiest thing to forget behind a closed panel.
    const roots = settings.roots.length === TOTAL_ROOTS
      ? 'all keys'
      : settings.roots.length === 0
        ? 'no keys'
        : settings.roots.length <= 4
          ? [...settings.roots].sort((a, b) => a - b).map((pc) => NOTE_NAMES[pc]).join(' ')
          : plural(settings.roots.length, 'key');

    // A filter with no control behind it can never differ, so saying so is noise.
    return [
      qualities,
      sets,
      ...(SHOW_INVERSION_PICKER ? [inversions] : []),
      ...(SHOW_ROOT_PICKER ? [roots] : [])
    ].join(' · ');
  });
</script>

{#if trainer.settings}
  <section class="settings">
    <SectionHeader title="Settings" {summary} {open} onToggle={() => (open = !open)} />

    {#if open}
      <div class="groups">
        <ToggleGroup
          title="Quality"
          options={QUALITIES}
          selected={trainer.settings.qualities}
          onToggle={trainer.toggleQuality}
        />
        <ToggleGroup
          title="String sets"
          options={setOptions}
          selected={trainer.settings.sets}
          onToggle={trainer.toggleSet}
        />
        {#if SHOW_INVERSION_PICKER}
          <ToggleGroup
            title="Inversions"
            options={INVERSIONS}
            selected={trainer.settings.inversions}
            onToggle={trainer.toggleInversion}
          />
        {/if}
        {#if SHOW_ROOT_PICKER}
          <ToggleGroup
            title="Keys"
            options={rootOptions}
            selected={trainer.settings.roots}
            onToggle={trainer.toggleRoot}
            fixedWidth
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

  /* Stacked full-width rows rather than columns: the buttons are wide enough
     that columns would wrap them awkwardly, and each row reads as one filter. */
  .groups {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 24px 0 4px;
  }
</style>
