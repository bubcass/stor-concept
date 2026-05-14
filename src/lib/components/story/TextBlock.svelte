<script lang="ts">
  import type { TextBlock } from '$lib/content/types';

  let { block, headingId }: { block: TextBlock; headingId?: string } = $props();

  const isListMarkup = (paragraph: string) => /^\s*<(ul|ol)\b/i.test(paragraph);
  const headingTag = $derived(block.headingLevel === 3 ? 'h3' : 'h2');
</script>

<section class="text-block story-flow" aria-label={block.heading ?? undefined}>
  {#if block.heading}
    <svelte:element this={headingTag} id={headingId}>{block.heading}</svelte:element>
  {/if}
  {#each block.paragraphs as paragraph}
    {#if isListMarkup(paragraph)}
      <div class="rich-block">{@html paragraph}</div>
    {:else}
      <p>{@html paragraph}</p>
    {/if}
  {/each}
</section>

<style>
  .text-block {
    margin: clamp(var(--space-7), 5vw, 4rem) auto;
    max-width: var(--measure-prose);
  }

  h2,
  h3 {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-heading);
    margin: 0 0 var(--space-stack);
    scroll-margin-top: calc(var(--site-header-height, 3.25rem) + var(--space-5));
    text-wrap: pretty;
  }

  h2 {
    font-size: var(--font-size-h2);
    line-height: var(--line-height-heading);
  }

  h3 {
    font-size: clamp(1.15rem, 1.8vw, 1.45rem);
    line-height: 1.2;
    margin-top: var(--space-6);
  }

  p {
    font-family: var(--font-serif);
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-body);
    margin: 0 0 var(--space-stack);
  }

  .rich-block {
    margin: 0 0 var(--space-stack);
  }

  .rich-block :global(ul),
  .rich-block :global(ol) {
    margin: 0;
    padding-left: 1.4rem;
  }

  .rich-block :global(li) {
    font-family: var(--font-serif);
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-body);
    margin: 0 0 0.45rem;
  }

  p :global(a) {
    color: var(--link);
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--link) 55%, transparent);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
  }

  p :global(a:hover),
  p :global(a:focus-visible) {
    color: var(--link-hover);
    text-decoration-color: currentColor;
  }

  p :global(strong) {
    color: var(--color-accent-2);
    font-weight: 600;
  }

  .rich-block :global(a) {
    color: var(--link);
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--link) 55%, transparent);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
  }

  .rich-block :global(a:hover),
  .rich-block :global(a:focus-visible) {
    color: var(--link-hover);
    text-decoration-color: currentColor;
  }

  .rich-block :global(strong) {
    color: var(--color-accent-2);
    font-weight: 600;
  }

  p:first-of-type {
    margin-top: 0;
  }

  @media (max-width: 620px) {
    .text-block {
      margin: 3rem auto;
    }
  }
</style>
