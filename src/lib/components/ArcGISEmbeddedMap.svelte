<script lang="ts">
  let {
    itemId,
    title,
    caption,
    height = '600px',
    theme = 'light',
    legendEnabled = true,
    headingEnabled = true,
    informationEnabled = true,
    layout = 'wide',
    wrapperClass = ''
  }: {
    itemId: string;
    title?: string;
    caption?: string;
    height?: string;
    theme?: 'light' | 'dark';
    legendEnabled?: boolean;
    headingEnabled?: boolean;
    informationEnabled?: boolean;
    layout?: 'wide' | 'prose';
    wrapperClass?: string;
  } = $props();

  let mapElement: HTMLElement | null = null;

  function syncBooleanAttribute(name: string, enabled: boolean) {
    if (!mapElement) return;

    if (enabled) {
      mapElement.setAttribute(name, '');
      return;
    }

    mapElement.removeAttribute(name);
  }

  $effect(() => {
    if (!mapElement) return;

    mapElement.setAttribute('item-id', itemId);
    mapElement.setAttribute('theme', theme);

    if (title) {
      mapElement.setAttribute('aria-label', title);
      mapElement.setAttribute('title', title);
    } else {
      mapElement.removeAttribute('aria-label');
      mapElement.removeAttribute('title');
    }

    syncBooleanAttribute('legend-enabled', legendEnabled);
    syncBooleanAttribute('heading-enabled', headingEnabled);
    syncBooleanAttribute('information-enabled', informationEnabled);
  });
</script>

<figure class={`arcgis-map ${layout} ${wrapperClass}`.trim()}>
  <arcgis-embedded-map
    bind:this={mapElement}
    item-id={itemId}
    theme={theme}
    title={title}
    aria-label={title}
    style={`height:${height}; width:100%;`}
  ></arcgis-embedded-map>

  {#if caption}
    <figcaption class="caption">{caption}</figcaption>
  {/if}
</figure>

<style>
  .arcgis-map {
    display: block;
    margin: var(--space-block) auto;
    padding: 0 var(--gutter);
    width: 100%;
  }

  .arcgis-map.wide {
    max-width: var(--wide);
  }

  .arcgis-map.prose {
    max-width: calc(var(--measure-prose) + (var(--gutter) * 2));
  }

  .arcgis-map :global(arcgis-embedded-map) {
    background: var(--color-soft);
    border: 1px solid var(--color-line);
    display: block;
    max-width: 100%;
    width: 100%;
  }

  .caption {
    margin-top: var(--space-3);
    max-width: var(--measure-card);
  }
</style>
