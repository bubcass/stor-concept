<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { ObservableStoryBlock } from '$lib/content/types';
  import {
    OBSERVABLE_INSPECTOR_CSS_URL,
    OBSERVABLE_RUNTIME_MODULE_URL,
    deriveObservableNotebookUrl
  } from '$lib/embeds/observable';

  let {
    block,
    flourishWidth = 'wide'
  }: {
    block: ObservableStoryBlock;
    flourishWidth?: 'wide' | 'prose';
  } = $props();

  let embedRoot: HTMLDivElement | null = null;
  let resolvedWidth = $derived(block.width ?? flourishWidth);
  let notebookUrl = $derived(block.notebookUrl || deriveObservableNotebookUrl(block.moduleUrl));
  let runtimeInstance: { dispose?: () => void } | null = null;

  function ensureInspectorCss() {
    if (document.querySelector(`link[href="${OBSERVABLE_INSPECTOR_CSS_URL}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = OBSERVABLE_INSPECTOR_CSS_URL;
    document.head.appendChild(link);
  }

  async function mountObservableCell() {
    if (!embedRoot || !block.moduleUrl || !block.cellName) return;

    runtimeInstance?.dispose?.();
    runtimeInstance = null;
    embedRoot.innerHTML = '';

    ensureInspectorCss();

    const runtimeModule = (await import(
      /* @vite-ignore */ OBSERVABLE_RUNTIME_MODULE_URL
    )) as {
      Runtime: new () => { module: (define: unknown, observer: (name: string) => unknown) => void; dispose?: () => void };
      Inspector: new (element: Element) => unknown;
    };
    const notebookModule = (await import(
      /* @vite-ignore */ block.moduleUrl
    )) as { default?: unknown };

    const runtime = new runtimeModule.Runtime();
    runtime.module(notebookModule.default, (name: string) => {
      if (name === block.cellName && embedRoot) {
        return new runtimeModule.Inspector(embedRoot);
      }

      return undefined;
    });

    runtimeInstance = runtime;
  }

  $effect(() => {
    embedRoot;
    block.moduleUrl;
    block.cellName;

    if (!embedRoot || !block.moduleUrl || !block.cellName) return;

    void mountObservableCell().catch((error) => {
      console.error(error);
    });
  });

  onDestroy(() => {
    runtimeInstance?.dispose?.();
    runtimeInstance = null;
  });
</script>

<figure class="observable-block {resolvedWidth}">
  <div bind:this={embedRoot} class="observable-block__embed"></div>

  {#if block.caption || block.creditText || block.creditHref}
    <figcaption class="caption">
      {#if block.caption}
        <span>{block.caption}</span>
      {/if}
      {#if block.creditText || block.creditHref}
        <span class="observable-block__credit">
          Credit:
          {#if block.creditHref}
            <a href={block.creditHref}>{block.creditText || block.creditHref}</a>
          {:else if block.creditText}
            {block.creditText}
          {/if}
        </span>
      {/if}
    </figcaption>
  {/if}
</figure>

<style>
  .observable-block {
    display: block;
    margin: var(--space-block) auto;
    padding: 0 var(--gutter);
    width: 100%;
  }

  .observable-block.wide {
    max-width: var(--wide);
  }

  .observable-block.prose {
    max-width: calc(var(--measure-prose) + (var(--gutter) * 2));
  }

  .observable-block__embed {
    max-width: 100%;
  }

  .observable-block :global(iframe),
  .observable-block :global(svg),
  .observable-block :global(canvas) {
    display: block;
    max-width: 100%;
  }

  .observable-block .caption {
    display: grid;
    gap: var(--space-2);
    margin-top: var(--space-3);
    max-width: var(--measure-card);
  }

  .observable-block__credit {
    color: var(--ink-muted, inherit);
    font-size: 0.95em;
  }
 </style>
