<script lang="ts">
    import { base } from "$app/paths";
    import SectionStoryList from "$lib/components/story/SectionStoryList.svelte";
    import { getStoriesBySection, getStorySection } from "$lib/content/stories";

    const section = getStorySection("committees");
    const stories = getStoriesBySection("committees");
    const articlePathPrefix = `${base}/proof-of-concept/articles`;
    const searchAction = `${base}/proof-of-concept/search/`;
</script>

<svelte:head>
    <title>Houses of the Oireachtas | Committees</title>
    <meta name="description" content={section?.intro} />
</svelte:head>

{#if section}
    <SectionStoryList
        {section}
        {stories}
        {articlePathPrefix}
        enableSearch={true}
        hideMedia={true}
        listMode={true}
        showHeader={false}
        searchLabel="Search for reports"
        {searchAction}
    />
{/if}
