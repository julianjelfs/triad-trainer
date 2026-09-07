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

<div class="group">
  <div class="kicker">{title}</div>
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
  .kicker {
    margin-bottom: 12px;
  }

  .options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
</style>
