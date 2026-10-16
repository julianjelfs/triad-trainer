<script lang="ts" generics="T extends string | number">
  import ToggleButton from './ToggleButton.svelte';

  interface Option {
    value: T;
    label: string;
  }

  interface Props {
    title: string;
    options: Option[];
    selected: T[];
    onToggle: (value: T, on: boolean) => void;
    /** Equal widths, for rows of short labels like the twelve keys. */
    fixedWidth?: boolean;
  }

  let { title, options, selected, onToggle, fixedWidth = false }: Props = $props();
</script>

<div class="group" role="group" aria-label={title}>
  <span class="title">{title}</span>
  <div class="options">
    {#each options as option (option.value)}
      <ToggleButton
        label={option.label}
        pressed={selected.includes(option.value)}
        onToggle={(on) => onToggle(option.value, on)}
        {fixedWidth}
      />
    {/each}
  </div>
</div>

<style>
  /* Label in its own column on wide screens, so every row of pills starts on
     the same line; above the pills on a phone. */
  .group {
    display: grid;
    grid-template-columns: 96px 1fr;
    align-items: center;
    gap: 12px;
  }

  .title {
    font-weight: 600;
    font-size: 13px;
    color: var(--ink-soft);
  }

  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  @media (max-width: 600px) {
    .group {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }
</style>
