<script lang="ts">
  import { inversionLabel, shapePosition } from '../music';
  import type { Trainer } from '../state/trainer.svelte';

  let { trainer }: { trainer: Trainer } = $props();

  let positions = $derived(trainer.drill?.positions ?? []);

  function label(index: number): string {
    const shape = positions[index];
    const fret = shapePosition(shape);
    return `${inversionLabel(shape.item.inversion)}, ${fret === 0 ? 'open' : `fret ${fret}`}`;
  }
</script>

<div class="steppers" role="group" aria-label="Positions in this drill">
  {#each positions as _, index (index)}
    <button
      type="button"
      class="stepper"
      class:current={index === trainer.positionIndex}
      title={label(index)}
      aria-label={label(index)}
      aria-current={index === trainer.positionIndex}
      onclick={() => trainer.showPosition(index)}
    ></button>
  {/each}
</div>

<style>
  .steppers {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .stepper {
    width: 14px;
    height: 14px;
    padding: 0;
    border: 2px solid var(--color-text);
    background: transparent;
    cursor: pointer;
  }

  .stepper:hover {
    border-color: var(--color-accent-600);
  }

  .stepper.current {
    background: var(--color-accent);
  }
</style>
