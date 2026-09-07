<script lang="ts" generics="T extends string | number">
  import CheckRow from './CheckRow.svelte';

  interface Option {
    value: T;
    label: string;
  }

  interface Props {
    title: string;
    options: Option[];
    selected: T[];
    onToggle: (value: T, on: boolean) => void;
  }

  let { title, options, selected, onToggle }: Props = $props();
</script>

<div class="group">
  <div class="kicker">{title}</div>
  <div class="rows">
    {#each options as option (option.value)}
      <CheckRow
        label={option.label}
        checked={selected.includes(option.value)}
        onToggle={(on) => onToggle(option.value, on)}
      />
    {/each}
  </div>
</div>

<style>
  .kicker {
    margin-bottom: 12px;
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>
