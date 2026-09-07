<script lang="ts">
  import Chevron from './Chevron.svelte';

  interface Props {
    title: string;
    /** Right-aligned status, shown whether the section is open or shut. */
    summary: string;
    open: boolean;
    onToggle: () => void;
  }

  let { title, summary, open, onToggle }: Props = $props();
</script>

<button type="button" class="header" aria-expanded={open} onclick={onToggle}>
  <span class="glyph"><Chevron {open} /></span>
  <span class="title">{title}</span>
  <span class="summary">{summary}</span>
</button>

<style>
  .header {
    display: flex;
    align-items: baseline;
    gap: 14px;
    width: 100%;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: var(--font-heading);
    text-align: left;
  }

  .header:hover .title {
    color: var(--color-accent-700);
  }

  .glyph {
    align-self: center;
    display: inline-flex;
  }

  .title {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text);
  }

  .summary {
    margin-left: auto;
    font-size: 13px;
    font-family: var(--font-body);
    color: var(--color-neutral-600);
  }
</style>
