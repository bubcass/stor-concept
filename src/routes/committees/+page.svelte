<script lang="ts">
  import SectionStoryList from '$lib/components/story/SectionStoryList.svelte';
  import { getStoriesBySection, getStorySection } from '$lib/content/stories';

  const section = getStorySection('committees');
  const stories = getStoriesBySection('committees');
</script>

<svelte:head>
  <title>Committees | Stór | Oireachtas Research Repository</title>
  <meta name="description" content={section?.intro} />
</svelte:head>

{#if section}
  <SectionStoryList {section} {stories} enableSearch />
{/if}
