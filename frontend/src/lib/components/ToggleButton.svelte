<script lang="ts">
  /**
   * A filter you tap rather than tick. `aria-pressed` rather than a checkbox,
   * because these are toggle buttons: the label is the control, not a caption
   * next to one.
   */
  interface Props {
    label: string;
    pressed: boolean;
    onToggle: (pressed: boolean) => void;
    /** Equal widths, for rows of short labels like the twelve keys. */
    fixedWidth?: boolean;
    /** Smaller, for toggles that sit alongside the drill rather than in settings. */
    small?: boolean;
  }

  let { label, pressed, onToggle, fixedWidth = false, small = false }: Props = $props();
</script>

<button
  type="button"
  class="toggle"
  class:pressed
  class:fixed={fixedWidth}
  class:small
  aria-pressed={pressed}
  onclick={() => onToggle(!pressed)}
>
  {label}
</button>

<style>
  .toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0 16px;
    border: 2px solid var(--color-text);
    background: transparent;
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    user-select: none;
  }

  .toggle.small {
    min-height: 34px;
    padding: 0 12px;
    font-size: 13px;
  }

  .toggle.fixed {
    width: 58px;
    padding: 0;
  }

  .toggle:hover:not(.pressed) {
    border-color: var(--color-accent-600);
    color: var(--color-accent-700);
  }

  .toggle.pressed {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: var(--color-bg);
  }

  .toggle.pressed:hover {
    background: var(--color-accent-600);
    border-color: var(--color-accent-600);
  }
</style>
