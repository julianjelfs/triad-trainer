<script lang="ts">
  import { SOLFEGE } from '../music';
  import type { ChordTone } from '../types';

  let { spelling }: { spelling: Record<ChordTone, string> } = $props();

  const TONES: { tone: ChordTone; role: string }[] = [
    { tone: 'root', role: 'root' },
    { tone: 'third', role: 'third' },
    { tone: 'fifth', role: 'fifth' }
  ];
</script>

<ul class="legend" aria-label="Chord tones">
  {#each TONES as { tone, role } (tone)}
    <li>
      <span class="swatch {tone}"></span>
      <span class="syllable">{SOLFEGE[tone]}</span>
      <span class="detail">{spelling[tone]} · {role}</span>
    </li>
  {/each}
</ul>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 28px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .swatch {
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }

  .swatch.root {
    background: var(--color-do);
  }

  .swatch.third {
    background: var(--color-mi);
  }

  .swatch.fifth {
    background: var(--color-so);
  }

  .syllable {
    font-weight: 800;
    font-size: 16px;
  }

  .detail {
    font-size: 13px;
    color: var(--color-neutral-600);
  }
</style>
