<script lang="ts">
  import SectionStoryList from '$lib/components/story/SectionStoryList.svelte';
  import { getStoriesBySection, getStorySection } from '$lib/content/stories';

  const section = getStorySection('parliamentary-budget-office');
  const stories = getStoriesBySection('parliamentary-budget-office');
</script>

<svelte:head>
  <title>Parliamentary Budget Office | Stór | Oireachtas Research Repository</title>
  <meta name="description" content={section?.intro} />
</svelte:head>

{#if section}
  <SectionStoryList {section} {stories} enableSearch />
{/if}
