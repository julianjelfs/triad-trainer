<script lang="ts">
  interface Props {
    title: string;
    /** Shown beside the title, open or shut, so a closed section is never a mystery. */
    summary: string;
    open: boolean;
    onToggle: () => void;
  }

  let { title, summary, open, onToggle }: Props = $props();
</script>

<button type="button" class="header" aria-expanded={open} onclick={onToggle}>
  <span class="title">{title}</span>
  <span class="summary">{summary}</span>
  <svg class:open viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 6 8 10.5 12.5 6" />
  </svg>
</button>

<style>
  .header {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 48px;
    padding: 0 16px 0 20px;
    border: 0;
    border-radius: 999px;
    background: var(--sand);
    text-align: left;
    cursor: pointer;
    transition: background-color 160ms var(--ease-out);
  }

  .header:hover {
    background: var(--sand-strong);
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
    transition: transform 220ms var(--ease-out);
  }

  svg.open {
    transform: rotate(180deg);
  }
</style>
