<script lang="ts">
  import { onMount } from 'svelte';
  import type { FlourishStoryBlock } from '$lib/content/types';

  let {
    block,
    flourishWidth = 'wide'
  }: {
    block: FlourishStoryBlock;
    flourishWidth?: 'wide' | 'prose';
  } = $props();

  let embedRoot: HTMLDivElement | null = null;
  let resolvedWidth = $derived(block.width ?? flourishWidth);

  let flourishClass = $derived(
    `flourish-embed ${
      block.embedType === 'story'
        ? 'flourish-story'
        : block.embedType === 'visualisation'
          ? 'flourish-visualisation'
          : 'flourish-chart'
    }`
  );

  let scriptUrl = 'https://public.flourish.studio/resources/embed.js';

  let scriptPromise: Promise<void> | null = null;

  function loadFlourishScript() {
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${scriptUrl}"]`
      );

      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve();
          return;
        }

        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Failed to load Flourish embed script.')), {
          once: true
        });
        return;
      }

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.addEventListener(
        'load',
        () => {
          script.dataset.loaded = 'true';
          resolve();
        },
        { once: true }
      );
      script.addEventListener(
        'error',
        () => reject(new Error('Failed to load Flourish embed script.')),
        { once: true }
      );
      document.body.appendChild(script);
    });

    return scriptPromise;
  }

  onMount(() => {
    if (!embedRoot) return;

    void loadFlourishScript()
      .then(() => {
        const flourish = (window as typeof window & {
          Flourish?: { loadEmbeds?: () => void };
        }).Flourish;

        flourish?.loadEmbeds?.();
      })
      .catch((error) => {
        console.error(error);
      });
  });
</script>

<figure class="flourish-block {resolvedWidth}">
  <div
    bind:this={embedRoot}
    class={flourishClass}
    data-src={block.dataSrc}
  >
    {#if block.thumbnail}
      <noscript>
        <img src={block.thumbnail} width="100%" alt={block.alt ?? 'Flourish visualisation'} />
      </noscript>
    {/if}
  </div>

  {#if block.caption}
    <figcaption class="caption">{block.caption}</figcaption>
  {/if}
</figure>

<style>
  .flourish-block {
    display: block;
    margin: var(--space-block) auto;
    padding: 0 var(--gutter);
    width: 100%;
  }

  .flourish-block.wide {
    max-width: var(--wide);
  }

  .flourish-block.prose {
    max-width: calc(var(--measure-prose) + (var(--gutter) * 2));
  }

  .flourish-block :global(iframe),
  .flourish-block :global(svg),
  .flourish-block :global(canvas) {
    display: block;
    max-width: 100%;
  }

  .flourish-block :global(iframe) {
    width: 100% !important;
  }

  .flourish-block .caption {
    margin-top: var(--space-3);
    max-width: var(--measure-card);
  }
 </style>
