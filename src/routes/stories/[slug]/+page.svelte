<script lang="ts">
    import { plainTextFromHtml } from "$lib/content/text";
    import StoryPage from "$lib/components/story/StoryPage.svelte";
    import type { Story } from "$lib/content/types";

    let { data } = $props();
    let story = $derived((data as { story: Story }).story);
</script>

<svelte:head>
    <title>{story.title} | Stór | Oireachtas Research Repository</title>
    <meta name="description" content={plainTextFromHtml(story.dek)} />
</svelte:head>

<StoryPage {story} />
