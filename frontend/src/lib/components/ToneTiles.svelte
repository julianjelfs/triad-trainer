<script lang="ts">
  import { SOLFEGE } from '../music';
  import type { ChordTone } from '../types';

  interface Props {
    spelling: Record<ChordTone, string>;
    /** The tone the metronome is calling, lifted off the row. */
    active?: ChordTone | null;
  }

  let { spelling, active = null }: Props = $props();

  const TONES: { tone: ChordTone; role: string }[] = [
    { tone: 'root', role: 'root' },
    { tone: 'third', role: 'third' },
    { tone: 'fifth', role: 'fifth' }
  ];
</script>

<ul class="tiles" aria-label="Chord tones">
  {#each TONES as { tone, role } (tone)}
    <li class="tile {tone}" class:active={active === tone}>
      <span class="syllable">{SOLFEGE[tone]}</span>
      <span class="note">
        {#key spelling[tone]}
          <b class="name">{spelling[tone]}</b>
        {/key}
        <span class="role">{role}</span>
      </span>
    </li>
  {/each}
</ul>

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* A legend, not a poster: syllable and note on one line. */
  .tile {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 16px;
    border-radius: var(--radius-tile);
    transition:
      transform 220ms var(--ease-out),
      box-shadow 220ms var(--ease-out);
  }

  .tile.root {
    background: var(--do);
    color: var(--on-do);
  }

  .tile.third {
    background: var(--mi);
    color: var(--on-mi);
  }

  .tile.fifth {
    background: var(--so);
    color: var(--on-so);
  }

  /* The beat's tile rises off the chart, the way a teacher taps one. */
  .tile.active {
    transform: translateY(-4px);
    box-shadow: 0 10px 18px -8px color-mix(in srgb, var(--ink) 45%, transparent);
  }

  .syllable {
    font-weight: 800;
    font-size: 28px;
    line-height: 1;
    letter-spacing: -0.02em;
    font-variation-settings: 'opsz' 96;
  }

  .note {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .name {
    font-weight: 800;
    font-size: 17px;
    animation: note-in 360ms var(--ease-out) backwards;
  }

  .role {
    font-size: 13px;
    font-weight: 600;
  }

  @keyframes note-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }

  @media (max-width: 600px) {
    .tiles {
      gap: 8px;
    }

    .tile {
      padding: 10px 12px;
    }

    .syllable {
      font-size: 22px;
    }

    .name {
      font-size: 15px;
    }

    /* "root/third/fifth" will not fit beside the note in a third of a phone. */
    .role {
      display: none;
    }
  }
</style>
