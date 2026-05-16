<script lang="ts">
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import StorySearch from "$lib/components/story/StorySearch.svelte";
    import { readBookmarks } from "$lib/components/story/bookmarks";
    import type { Story } from "$lib/content/types";
    import { getStorySection, stories } from "$lib/content/stories";
    import { plainTextFromHtml } from "$lib/content/text";

    const featuredStory = $derived(stories.find((story) => story.featured) ?? stories[0]);
    const secondaryStories = $derived(
        featuredStory ? stories.filter((story) => story.slug !== featuredStory.slug) : [],
    );
    const isVideoHero = (src: string) => src.toLowerCase().endsWith(".mp4");
    let bookmarked = $state<Set<string>>(new Set());

    onMount(() => {
        bookmarked = new Set(readBookmarks());
    });
</script>

<svelte:head>
    <title>Stór | Oireachtas Research Repository</title>
    <meta
        name="description"
        content="SvelteKit static site prototype for a Stór research repository."
    />
</svelte:head>

<section class="story-index page-shell">
    <div class="search-wrap">
        <StorySearch />
    </div>

    {#if featuredStory}
        {@const featuredSection = getStorySection(featuredStory.section)}
        <article class="featured-story">
            <a href="{base}/articles/{featuredStory.slug}/">
                <div class="featured-copy">
                    <div class="story-context">
                        <p>{featuredStory.eyebrow}</p>
                        {#if bookmarked.has(featuredStory.slug)}
                            <span class="saved-chip">Saved</span>
                        {/if}
                    </div>
                    <div class="headline-row">
                        <h3>{featuredStory.title}</h3>
                        <span
                            class="section-chip"
                            style={featuredSection?.accentColor
                                ? `--section-chip-accent: ${featuredSection.accentColor};`
                                : undefined}
                        >
                            {featuredSection?.title}
                        </span>
                    </div>
                    <span class="featured-summary">
                        {plainTextFromHtml(featuredStory.dek)}
                    </span>
                    <small class="story-meta">
                        <span>{featuredStory.date}</span>
                        <span>{featuredStory.readingTime}</span>
                    </small>
                </div>
                {#if isVideoHero(featuredStory.hero.src)}
                    <video autoplay muted loop playsinline aria-hidden="true">
                        <source
                            src="{base}{featuredStory.hero.src}"
                            type="video/mp4"
                        />
                    </video>
                {:else}
                    <img
                        src="{base}{featuredStory.hero.src}"
                        alt=""
                        loading="eager"
                    />
                {/if}
            </a>
        </article>
    {/if}

    <div class="secondary-grid">
        {#each secondaryStories as story}
            {@const sectionMeta = getStorySection(story.section)}
            <article class="secondary-story">
                <a href="{base}/articles/{story.slug}/">
                    {#if isVideoHero(story.hero.src)}
                        <video
                            autoplay
                            muted
                            loop
                            playsinline
                            aria-hidden="true"
                        >
                            <source
                                src="{base}{story.hero.src}"
                                type="video/mp4"
                            />
                        </video>
                    {:else}
                        <img
                            src="{base}{story.hero.src}"
                            alt=""
                            loading="lazy"
                        />
                    {/if}
                    <div class="secondary-copy">
                        <div class="story-context">
                            <p>{story.eyebrow}</p>
                            {#if bookmarked.has(story.slug)}
                                <span class="saved-chip">Saved</span>
                            {/if}
                        </div>
                        <div class="headline-row">
                            <h3>{story.title}</h3>
                            <span
                                class="section-chip"
                                style={sectionMeta?.accentColor
                                    ? `--section-chip-accent: ${sectionMeta.accentColor};`
                                    : undefined}
                            >
                                {sectionMeta?.title}
                            </span>
                        </div>
                        <span class="secondary-summary"
                            >{plainTextFromHtml(story.dek)}</span
                        >
                        <small class="story-meta">
                            <span>{story.date}</span>
                            <span>{story.readingTime}</span>
                        </small>
                    </div>
                </a>
            </article>
        {/each}
    </div>
</section>

<style>
    .story-index {
        padding-top: clamp(var(--space-5), 4vw, var(--space-6));
    }

    .search-wrap {
        margin-bottom: clamp(var(--space-6), 4vw, var(--space-7));
    }

    .featured-story {
        margin-bottom: clamp(var(--space-7), 4vw, 3.25rem);
    }

    .featured-story a {
        border-bottom: 1px solid
            color-mix(in srgb, var(--color-line) 62%, transparent);
        display: grid;
        gap: clamp(var(--space-6), 4vw, var(--space-8));
        grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
        padding-bottom: var(--space-7);
        text-decoration: none;
    }

    .featured-copy {
        align-self: center;
        max-width: var(--measure-card);
    }

    .story-context {
        align-items: baseline;
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem 0.55rem;
        margin-bottom: var(--space-3);
    }

    .story-context p {
        color: var(--color-accent);
        font-size: var(--font-size-small);
        font-weight: var(--font-weight-meta);
        letter-spacing: 0.11em;
        line-height: var(--line-height-small);
        margin: 0;
        text-transform: uppercase;
    }

    .saved-chip {
        -webkit-text-size-adjust: 100%;
        align-self: center;
        border: 1px solid
            color-mix(in srgb, var(--color-accent) 35%, transparent);
        border-radius: 999px;
        color: var(--color-muted);
        display: inline-flex;
        flex: 0 0 auto;
        font-size: 0.72rem;
        font-weight: 500;
        letter-spacing: 0.08em;
        line-height: 1;
        padding: 0.25rem 0.5rem;
        text-transform: uppercase;
        white-space: nowrap;
    }

    .section-chip {
        align-items: center;
        background: color-mix(
            in srgb,
            var(--section-chip-accent, var(--color-soft)) 12%,
            var(--color-soft)
        );
        border: 1px solid
            color-mix(in srgb, var(--section-chip-accent, var(--color-line)) 24%, var(--color-line));
        border-radius: 999px;
        color: color-mix(
            in srgb,
            var(--section-chip-accent, var(--color-accent-2)) 82%,
            var(--color-accent-2)
        );
        display: inline-flex;
        flex: 0 0 auto;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        line-height: 1;
        padding: 0.25rem 0.5rem;
        text-transform: uppercase;
        white-space: nowrap;
    }

    .headline-row {
        align-items: flex-start;
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem 0.75rem;
        margin: 0 0 var(--space-4);
    }

    .featured-story h3 {
        color: var(--color-accent-2);
        font-family: var(--font-sans);
        font-size: clamp(1.7rem, 2.85vw, 2.35rem);
        font-weight: var(--font-weight-heading);
        line-height: 1.08;
        margin: 0;
        max-width: 13ch;
        text-wrap: balance;
    }

    .featured-summary {
        color: var(--color-muted);
        display: block;
        font-family: var(--font-sans);
        font-size: var(--font-size-body);
        line-height: var(--line-height-body);
        max-width: var(--measure-card);
        white-space: pre-line;
    }

    .featured-story img,
    .featured-story video {
        aspect-ratio: 16 / 11;
        background: var(--color-soft);
        max-height: min(31rem, 58vh);
        object-fit: cover;
        width: 100%;
    }

    .secondary-grid {
        display: grid;
        gap: clamp(var(--space-6), 3vw, var(--space-7));
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .secondary-story a {
        display: grid;
        gap: var(--space-4);
        text-decoration: none;
    }

    .secondary-story img,
    .secondary-story video {
        aspect-ratio: 4 / 3;
        background: var(--color-soft);
        object-fit: cover;
        width: 100%;
    }

    .secondary-copy {
        max-width: var(--measure-card);
    }

    .secondary-story h3 {
        color: var(--color-accent-2);
        font-family: var(--font-sans);
        font-size: var(--font-size-h3);
        font-weight: var(--font-weight-heading);
        line-height: 1.18;
        margin: 0;
        max-width: 18ch;
        text-wrap: balance;
    }

    .secondary-summary {
        color: var(--color-muted);
        display: block;
        font-family: var(--font-sans);
        font-size: var(--font-size-body);
        line-height: var(--line-height-body);
        max-width: var(--measure-card);
        white-space: pre-line;
    }

    .story-meta {
        color: var(--color-muted);
        display: flex;
        flex-wrap: wrap;
        font-size: var(--font-size-small);
        font-weight: var(--font-weight-meta);
        gap: 0.35rem 0.65rem;
        letter-spacing: 0.07em;
        line-height: var(--line-height-small);
        margin-top: 1.25rem;
        text-transform: uppercase;
    }

    .story-meta span:not(:last-child)::after {
        color: var(--color-faint);
        content: "·";
        margin-left: 0.65rem;
    }

    @media (max-width: 900px) {
        .featured-story a {
            grid-template-columns: minmax(0, 1fr);
        }
    }

    @media (max-width: 760px) {
        .featured-story a {
            gap: var(--space-5);
            padding-bottom: var(--space-6);
        }

        .featured-story h3 {
            font-size: clamp(1.55rem, 8vw, 2.2rem);
            max-width: 12ch;
        }

        .featured-story img {
            aspect-ratio: 4 / 3;
            max-height: 22rem;
        }

        .secondary-grid {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
