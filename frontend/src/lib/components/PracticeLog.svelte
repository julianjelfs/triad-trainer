<script lang="ts">
  import { NOTE_NAMES, STRING_SETS, inversionLabel, noteName } from '../music';
  import type { Trainer } from '../state/trainer.svelte';
  import SectionHeader from './SectionHeader.svelte';

  let { trainer }: { trainer: Trainer } = $props();

  let open = $state(false);
  let stats = $derived(trainer.stats);

  const MAX_BAR_HEIGHT = 70;

  /** Bars are relative to the busiest root, so an empty log stays flat. */
  let busiestRoot = $derived(Math.max(1, ...(stats?.by_root ?? []).map((row) => row.count)));

  function barHeight(count: number): string {
    return `${Math.round((count / busiestRoot) * MAX_BAR_HEIGHT)}px`;
  }

  function formatDate(iso: string | null): string {
    return iso ? new Date(iso).toLocaleDateString() : '—';
  }
</script>

<section class="log">
  <SectionHeader
    title="Practice log"
    summary="{stats?.total ?? 0} shapes logged"
    {open}
    onToggle={() => (open = !open)}
  />

  {#if open && stats}
    <div class="body">
      <div class="kicker">Shapes per root</div>
      <div class="roots">
        {#each stats.by_root as row (row.root_pc)}
          <div class="root">
            <div class="count">{row.count}</div>
            <div class="bar" class:empty={row.count === 0} style:height={barHeight(row.count)}></div>
            <div class="name">{NOTE_NAMES[row.root_pc]}</div>
          </div>
        {/each}
      </div>

      <div class="kicker weakest">Least practised</div>
      <table class="table">
        <thead>
          <tr>
            <th>Chord</th>
            <th>String set</th>
            <th>Inversion</th>
            <th class="numeric">Count</th>
            <th class="numeric">Last</th>
          </tr>
        </thead>
        <tbody>
          {#each stats.items as item (`${item.root_pc}|${item.quality}|${item.string_set}|${item.inversion}`)}
            <tr>
              <td>{noteName(item.root_pc)} {item.quality}</td>
              <td>{STRING_SETS[item.string_set].label}</td>
              <td>{inversionLabel(item.inversion)}</td>
              <td class="numeric">{item.count}</td>
              <td class="numeric">{formatDate(item.last_practised_at)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<style>
  .log {
    padding: 22px 0 0;
  }

  .body {
    padding-top: 24px;
  }

  .kicker {
    margin-bottom: 12px;
  }

  .kicker.weakest {
    margin: 28px 0 8px;
  }

  .roots {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 6px;
    align-items: end;
    height: 110px;
  }

  .root {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
    gap: 6px;
  }

  .count {
    font-size: 10px;
    text-align: center;
    color: var(--color-neutral-600);
  }

  .bar {
    background: var(--color-accent-200);
    border-top: 2px solid var(--color-text);
  }

  .bar.empty {
    background: var(--color-neutral-200);
  }

  .name {
    font-size: 11px;
    text-align: center;
    color: var(--color-text);
    font-weight: 600;
  }
</style>
