<script lang="ts">
  import SectionStoryList from '$lib/components/story/SectionStoryList.svelte';
  import { getStoriesBySection, getStorySection } from '$lib/content/stories';

  const section = getStorySection('library-research-service');
  const stories = getStoriesBySection('library-research-service');
</script>

<svelte:head>
  <title>Library &amp; Research Service | Stór | Oireachtas Research Repository</title>
  <meta name="description" content={section?.intro} />
</svelte:head>

{#if section}
  <SectionStoryList {section} {stories} enableSearch />
{/if}
