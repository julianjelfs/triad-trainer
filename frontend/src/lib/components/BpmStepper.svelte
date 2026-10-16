<script lang="ts">
  /**
   * Tempo with big step buttons either side, because reaching for a keyboard
   * with a guitar on your lap is the wrong way to change it.
   */
  interface Props {
    bpm: number;
    onChange: (bpm: number) => void;
  }

  let { bpm, onChange }: Props = $props();

  const MIN_BPM = 30;
  const MAX_BPM = 160;
  const STEP = 5;

  function clamp(value: number): number {
    return Math.min(MAX_BPM, Math.max(MIN_BPM, value));
  }

  function onInput(value: string) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < MIN_BPM || parsed > MAX_BPM) return;
    onChange(parsed);
  }
</script>

<div class="stepper">
  <button
    type="button"
    aria-label="Slower"
    disabled={bpm <= MIN_BPM}
    onclick={() => onChange(clamp(bpm - STEP))}
  >
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9" /></svg>
  </button>
  <label>
    <input
      class="figures"
      type="number"
      min={MIN_BPM}
      max={MAX_BPM}
      value={bpm}
      oninput={(event) => onInput(event.currentTarget.value)}
    />
    <span>bpm</span>
  </label>
  <button
    type="button"
    aria-label="Faster"
    disabled={bpm >= MAX_BPM}
    onclick={() => onChange(clamp(bpm + STEP))}
  >
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9M8 3.5v9" /></svg>
  </button>
</div>

<style>
  .stepper {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    border-radius: 999px;
    background: var(--sand);
  }

  button {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    transition: background-color 160ms var(--ease-out);
  }

  button:hover:not(:disabled) {
    background: var(--sand-strong);
  }

  button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }

  label {
    display: flex;
    align-items: baseline;
    gap: 4px;
    padding: 0 4px;
  }

  input {
    width: 3ch;
    border: 0;
    background: transparent;
    font-weight: 700;
    font-size: 17px;
    text-align: right;
    -moz-appearance: textfield;
    appearance: textfield;
  }

  input::-webkit-inner-spin-button,
  input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input:focus-visible {
    outline-offset: 4px;
    border-radius: 4px;
  }

  span {
    font-size: 13px;
    color: var(--ink-soft);
  }
</style>
