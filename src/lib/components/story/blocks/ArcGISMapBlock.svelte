<script lang="ts">
  import ArcGISEmbeddedMap from '$lib/components/ArcGISEmbeddedMap.svelte';
  import type { ArcGISMapStoryBlock } from '$lib/content/types';

  let { block }: { block: ArcGISMapStoryBlock } = $props();
</script>

<ArcGISEmbeddedMap
  itemId={block.itemId}
  title={block.title}
  caption={block.caption}
  height={block.height ?? '600px'}
  theme={block.theme ?? 'light'}
  legendEnabled={block.legendEnabled ?? true}
  headingEnabled={block.headingEnabled ?? true}
  informationEnabled={block.informationEnabled ?? true}
  layout={block.layout ?? 'wide'}
  wrapperClass={block.wrapperClass}
/>
