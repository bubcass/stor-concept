<script lang="ts">
    import { plainTextFromHtml } from "$lib/content/text";
    import StoryPage from "$lib/components/story/StoryPage.svelte";

    let { data } = $props();
</script>

<svelte:head>
    <title>{data.story.title} | Stór | Oireachtas Research Repository</title>
    <meta name="description" content={plainTextFromHtml(data.story.dek)} />
</svelte:head>

<StoryPage story={data.story} />
