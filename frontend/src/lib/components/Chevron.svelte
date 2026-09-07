<script lang="ts">
  /** Drawn rather than a text glyph, so it rotates cleanly and takes the accent. */
  let { open = false }: { open?: boolean } = $props();
</script>

<svg width="16" height="16" viewBox="0 0 16 16" class:open aria-hidden="true">
  <path d="M3 5.5 L8 10.5 L13 5.5" fill="none" stroke-width="2" />
</svg>

<style>
  svg {
    display: block;
    transition: transform 120ms ease-out;
  }

  svg.open {
    transform: rotate(180deg);
  }

  path {
    stroke: var(--color-accent);
  }
</style>
