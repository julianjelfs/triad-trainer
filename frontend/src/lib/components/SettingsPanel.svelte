<script lang="ts">
  import type { Snippet } from 'svelte';
  import { slide } from 'svelte/transition';

  /**
   * A sand panel whose header row opens it. The choices live inside the same
   * panel, so it reads as one section opening rather than a bar with things
   * appearing under it.
   */
  interface Props {
    /** One line saying what is chosen, shown open or shut. */
    summary: string;
    children: Snippet;
  }

  let { summary, children }: Props = $props();

  let open = $state(false);

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
</script>

<section class="panel" class:open>
  <button
    type="button"
    class="header"
    aria-expanded={open}
    aria-controls="settings-body"
    onclick={() => (open = !open)}
  >
    <span class="title">Settings</span>
    <span class="summary">{summary}</span>
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 6 8 10.5 12.5 6" />
    </svg>
  </button>

  {#if open}
    <div
      id="settings-body"
      class="body"
      transition:slide={{ duration: reduceMotion ? 0 : 260 }}
    >
      <div class="inner">
        {@render children()}
      </div>
    </div>
  {/if}
</section>

<style>
  /* Pills inside sit on sand, so they take the cream of the card instead. */
  .panel {
    --pill-bg: var(--card);
    --pill-hover: var(--paper);
    margin-top: 24px;
    border-radius: 24px;
    background: var(--sand);
    transition: border-radius 260ms var(--ease-out);
  }

  .panel.open {
    border-radius: var(--radius-card);
  }

  .header {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 48px;
    padding: 0 18px 0 20px;
    border: 0;
    border-radius: inherit;
    background: transparent;
    text-align: left;
    cursor: pointer;
    transition: background-color 160ms var(--ease-out);
  }

  .header:hover {
    background: var(--sand-strong);
  }

  .open .header {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .title {
    font-weight: 700;
    font-size: 15px;
  }

  .summary {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    color: var(--ink-soft);
  }

  svg {
    flex: none;
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 260ms var(--ease-out);
  }

  .open svg {
    transform: rotate(180deg);
  }

  .inner {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: 0 8px;
    padding: 18px 12px 20px;
    border-top: 1px solid var(--sand-strong);
  }

  @media (max-width: 600px) {
    .inner {
      gap: 18px;
      padding: 16px 8px 18px;
    }
  }
</style>
