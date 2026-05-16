<script lang="ts">
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import { readBookmarks } from "$lib/components/story/bookmarks";
    import { getStorySection, stories } from "$lib/content/stories";
    import { plainTextFromHtml } from "$lib/content/text";

    const isVideoHero = (src: string) => src.toLowerCase().endsWith(".mp4");

    let hydrated = $state(false);
    let bookmarkedSlugs = $state<string[]>([]);

    let bookmarkedStories = $derived(
        stories.filter((story) => bookmarkedSlugs.includes(story.slug)),
    );

    onMount(() => {
        bookmarkedSlugs = readBookmarks();
        hydrated = true;
    });
</script>

<svelte:head>
    <title>My Stór | Stór | Oireachtas Research Repository</title>
    <meta
        name="description"
        content="Your saved articles and repository items from Stór."
    />
</svelte:head>

<section class="page-shell my-stor-page">
    <header>
        <p class="eyebrow">Saved articles</p>
        <h1>My Stór</h1>
        <p class="lede">
            Save the research you need with a personalised collection of pieces.
        </p>
    </header>

    {#if !hydrated}
        <p class="status-copy">Loading your saved articles…</p>
    {:else if !bookmarkedStories.length}
        <section class="empty-state">
            <h2>Nothing saved yet</h2>
            <p>
                Use the "Save" button on any article page to collect material for
                later.
            </p>
            <p>
                Saved articles are stored in your browser and won't appear on
                other devices. They do not require a sign-on but may be cleared
                if your browser data is removed.
            </p>
            <div class="empty-state__links">
                <a href="{base}/committees/">Browse Committees</a>
                <a href="{base}/parliamentary-budget-office/"
                    >Browse Parliamentary Budget Office</a
                >
                <a href="{base}/library-research-service/"
                    >Browse Library &amp; Research Service</a
                >
            </div>
        </section>
    {:else}
        <div class="archive-list">
            {#each bookmarkedStories as story}
                {@const sectionMeta = getStorySection(story.section)}
                <article>
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
                        <div>
                            <div class="story-context">
                                <p>{story.eyebrow}</p>
                                <span class="saved-chip">Saved</span>
                            </div>
                            <div class="headline-row">
                                <h2>{story.title}</h2>
                                <span
                                    class="section-chip"
                                    style={sectionMeta?.accentColor
                                        ? `--section-chip-accent: ${sectionMeta.accentColor};`
                                        : undefined}
                                >
                                    {sectionMeta?.title}
                                </span>
                            </div>
                            <span class="summary"
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
    {/if}
</section>

<style>
    .my-stor-page {
        padding-top: clamp(var(--space-7), 7vw, 4.75rem);
    }

    header {
        border-bottom: 1px solid
            color-mix(in srgb, var(--color-line) 55%, transparent);
        margin-bottom: var(--space-section);
        padding-bottom: var(--space-6);
    }

    h1 {
        color: var(--color-accent-2);
        font-family: var(--font-sans);
        font-size: var(--font-size-h1);
        font-weight: var(--font-weight-heading);
        line-height: var(--line-height-heading);
        margin: 0 0 var(--space-stack-tight);
    }

    .archive-list {
        display: grid;
    }

    article a {
        border-bottom: 1px solid var(--color-line);
        display: grid;
        gap: var(--space-5);
        grid-template-columns: minmax(12rem, 0.48fr) minmax(0, 1fr);
        padding: var(--space-5) 0;
        text-decoration: none;
    }

    img,
    video {
        aspect-ratio: 4 / 3;
        border: 1px solid var(--color-line);
        object-fit: cover;
        width: 100%;
    }

    .story-context {
        align-items: baseline;
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem 0.55rem;
        margin-bottom: 0.55rem;
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
        margin: 0 0 var(--space-3);
    }

    h2 {
        color: var(--color-accent-2);
        font-family: var(--font-sans);
        font-size: var(--font-size-h3);
        font-weight: var(--font-weight-heading);
        line-height: 1.18;
        margin: 0;
    }

    .summary {
        color: var(--color-muted);
        display: block;
        font-family: var(--font-sans);
        font-size: var(--font-size-body);
        line-height: var(--line-height-body);
        max-width: var(--measure-card);
        white-space: pre-line;
    }

    small,
    .status-copy {
        color: var(--color-muted);
        display: block;
        font-size: var(--font-size-small);
        line-height: var(--line-height-small);
    }

    .story-meta {
        color: var(--color-muted);
        display: flex;
        flex-wrap: wrap;
        font-weight: var(--font-weight-meta);
        gap: 0.35rem 0.65rem;
        letter-spacing: 0.07em;
        margin-top: 1.25rem;
        text-transform: uppercase;
    }

    .story-meta span:not(:last-child)::after {
        color: var(--color-faint);
        content: "·";
        margin-left: 0.65rem;
    }

    .empty-state {
        border: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
        background: color-mix(in srgb, var(--color-soft) 45%, white);
        padding: clamp(var(--space-5), 4vw, var(--space-7));
        max-width: var(--measure-prose);
    }

    .empty-state h2 {
        margin-bottom: var(--space-2);
    }

    .empty-state p {
        color: var(--color-muted);
        font-family: var(--font-sans);
        font-size: var(--font-size-body);
        line-height: var(--line-height-body);
        margin: 0;
    }

    .empty-state__links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1rem;
        margin-top: var(--space-4);
    }

    .empty-state__links a {
        color: var(--link);
        font-family: var(--font-sans);
        font-size: var(--font-size-small);
        font-weight: 600;
        text-decoration: underline;
        text-underline-offset: 0.18em;
    }

    .empty-state__links a:hover,
    .empty-state__links a:focus-visible {
        color: var(--link-hover);
    }

    @media (max-width: 760px) {
        article a {
            display: block;
        }

        img,
        video {
            margin-bottom: 1rem;
        }
    }
</style>
