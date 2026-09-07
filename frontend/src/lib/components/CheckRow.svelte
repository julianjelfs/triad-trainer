<script lang="ts">
  /**
   * A flat square check, not a native input. The whole row is the hit target;
   * the native checkbox is kept off screen so keyboard and screen readers still
   * get a real checkbox.
   */
  interface Props {
    label: string;
    checked: boolean;
    onToggle: (checked: boolean) => void;
    /** 16 in the settings grid, 14 alongside the position squares. */
    size?: 14 | 16;
  }

  let { label, checked, onToggle, size = 16 }: Props = $props();
</script>

<label class="row" style="--box: {size}px">
  <input type="checkbox" {checked} onchange={(event) => onToggle(event.currentTarget.checked)} />
  <span class="box" aria-hidden="true">{checked ? '✓' : ''}</span>
  <span class="label">{label}</span>
</label>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 2px 0;
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--color-text);
    text-align: left;
    user-select: none;
  }

  .row:hover .label {
    color: var(--color-accent-700);
  }

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  .box {
    width: var(--box);
    height: var(--box);
    flex: 0 0 auto;
    border: 2px solid var(--color-text);
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-bg);
    font-size: calc(var(--box) * 0.75);
    line-height: 1;
  }

  input:checked + .box {
    background: var(--color-accent);
  }

  input:focus-visible + .box {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
</style>
