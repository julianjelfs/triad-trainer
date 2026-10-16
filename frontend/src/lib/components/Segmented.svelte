<script lang="ts" generics="T extends string">
  /** Two or three mutually exclusive choices in one sand track. */
  interface Props {
    label: string;
    options: { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
  }

  let { label, options, value, onChange }: Props = $props();
</script>

<div class="track" role="radiogroup" aria-label={label}>
  {#each options as option (option.value)}
    <button
      type="button"
      role="radio"
      aria-checked={option.value === value}
      class:on={option.value === value}
      onclick={() => onChange(option.value)}
    >
      {option.label}
    </button>
  {/each}
</div>

<style>
  .track {
    display: inline-flex;
    padding: 4px;
    gap: 2px;
    border-radius: 999px;
    background: var(--sand);
  }

  button {
    min-height: 34px;
    padding: 0 18px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition:
      background-color 200ms var(--ease-out),
      color 200ms var(--ease-out);
  }

  button:hover:not(.on) {
    background: var(--sand-strong);
  }

  button.on {
    background: var(--ink);
    color: var(--paper);
  }
</style>
