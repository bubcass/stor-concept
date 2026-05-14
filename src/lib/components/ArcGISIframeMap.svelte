<script lang="ts">
  // Keep the iframe variant available for cases where third-party web components
  // are blocked or where the ArcGIS embeddable component has compatibility issues.
  let {
    src,
    title,
    caption,
    height = '600px',
    layout = 'wide'
  }: {
    src: string;
    title: string;
    caption?: string;
    height?: string;
    layout?: 'wide' | 'prose';
  } = $props();
</script>

<figure class={`arcgis-map ${layout}`.trim()}>
  <iframe
    title={title}
    src={src}
    scrolling="no"
    loading="lazy"
    style={`height:${height}; width:100%;`}
  ></iframe>

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

  iframe {
    background: var(--color-soft);
    border: 1px solid var(--color-line);
    display: block;
    width: 100%;
  }

  .caption {
    margin-top: var(--space-3);
    max-width: var(--measure-card);
  }
</style>
