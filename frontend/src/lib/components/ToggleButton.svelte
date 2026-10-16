<script lang="ts">
  /**
   * A choice you tap. `aria-pressed` rather than a checkbox, because the label
   * is the control, not a caption next to one.
   */
  interface Props {
    label: string;
    pressed: boolean;
    onToggle: (pressed: boolean) => void;
    /** Equal widths, for rows of short labels like the twelve keys. */
    fixedWidth?: boolean;
    /** Smaller, for toggles that sit beside the fretboard. */
    small?: boolean;
  }

  let { label, pressed, onToggle, fixedWidth = false, small = false }: Props = $props();
</script>

<button
  type="button"
  class="pill"
  class:fixed={fixedWidth}
  class:small
  aria-pressed={pressed}
  onclick={() => onToggle(!pressed)}
>
  {label}
</button>

<style>
  .fixed {
    width: 48px;
    padding: 0;
  }

  .small {
    min-height: 32px;
    padding: 0 14px;
    font-size: 13px;
  }
</style>
