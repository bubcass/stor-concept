<script lang="ts">
  import { base } from '$app/paths';
  import type { ImageBlock } from '$lib/content/types';

  let { block, headingId }: { block: ImageBlock; headingId?: string } = $props();
  let layout = $derived(block.layout ?? 'inline');
  let isSvg = $derived(block.image.src.toLowerCase().endsWith('.svg'));
</script>

<section class="image-block story-flow" aria-label={block.heading ?? undefined}>
  {#if block.heading}
    <h2 id={headingId}>{block.heading}</h2>
  {/if}

  <figure class="image-figure {layout}">
    <img class:svg-image={isSvg} src="{base}{block.image.src}" alt={block.image.alt} loading="lazy" />
    {#if block.image.caption || block.image.credit}
      <figcaption class="caption">
        {block.image.caption}
        {#if block.image.credit}
          <span>{block.image.credit}</span>
        {/if}
      </figcaption>
    {/if}
  </figure>
</section>

<style>
  .image-block {
    margin: var(--block-space) auto;
  }

  .image-figure {
    margin: 0;
  }

  .inline {
    max-width: var(--measure);
  }

  .portrait {
    margin-left: auto;
    margin-right: auto;
    max-width: min(34rem, calc(100vw - (var(--gutter) * 2)));
  }

  .wide {
    max-width: min(var(--wide), calc(100vw - (var(--gutter) * 2)));
  }

  .full {
    max-width: none;
    width: 100%;
  }

  img {
    background: var(--color-soft);
    border: 1px solid var(--color-line);
    object-fit: cover;
    width: 100%;
  }

  .wide img,
  .full img {
    aspect-ratio: 16 / 9;
  }

  .inline img {
    aspect-ratio: 4 / 3;
  }

  .portrait img {
    aspect-ratio: auto;
    object-fit: contain;
  }

  img.svg-image {
    aspect-ratio: auto;
    object-fit: contain;
  }

  figcaption {
    margin-left: auto;
    margin-right: auto;
  }

  span {
    color: var(--color-faint);
    display: block;
    margin-top: 0.2rem;
  }

  @media (max-width: 620px) {
    .image-block {
      margin: 3.5rem auto;
    }

    .wide {
      max-width: none;
      width: 100%;
    }

    .wide img,
    .full img {
      aspect-ratio: 4 / 3;
    }
  }
</style>
