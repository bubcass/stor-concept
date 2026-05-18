<script lang="ts">
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import { readBookmarks } from "$lib/components/story/bookmarks";
    import { getStorySection, stories } from "$lib/content/stories";
    import { plainTextFromHtml } from "$lib/content/text";

    const isVideoHero = (src: string) => src.toLowerCase().endsWith(".mp4");
    const hasHero = (src: string | undefined) => Boolean(src?.trim());

    let hydrated = $state(false);
    let bookmarkedSlugs = $state<string[]>([]);

    let bookmarkedStories = $derived(
        stories.filter(
            (story) =>
                story.section === "committees" &&
                bookmarkedSlugs.includes(story.slug),
        ),
    );

    onMount(() => {
        bookmarkedSlugs = readBookmarks();
        hydrated = true;
    });
</script>

<svelte:head>
    <title>Saved reports | Committee report repository</title>
    <meta
        name="description"
        content="Saved committee reports from the committee report repository."
    />
</svelte:head>

<section class="page-shell saved-reports-page">
    <header>
        <p class="eyebrow">Saved reports</p>
        <h1>Saved reports</h1>
        <p class="lede">
            A browser-saved collection of committee reports for this proof-of-concept
            sandbox.
        </p>
    </header>

    {#if !hydrated}
        <p class="status-copy">Loading your saved reports…</p>
    {:else if !bookmarkedStories.length}
        <section class="empty-state">
            <h2>No reports saved yet</h2>
            <p>
                Use the "Save" button on any committee report to collect material
                for later.
            </p>
            <p>
                Saved reports are stored in your browser and won’t appear on other
                devices. They may be cleared if your browser data is removed.
            </p>
            <div class="empty-state__links">
                <a href="{base}/proof-of-concept/committees/"
                    >Browse committee reports</a
                >
            </div>
        </section>
    {:else}
        <div class="archive-list">
            {#each bookmarkedStories as story}
                {@const sectionMeta = getStorySection(story.section)}
                <article>
                    <a
                        href="{base}/proof-of-concept/articles/{story.slug}/"
                        class:no-media={!hasHero(story.hero?.src)}
                    >
                        {#if hasHero(story.hero?.src)}
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
    .saved-reports-page {
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

    article a.no-media {
        grid-template-columns: minmax(0, 1fr);
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

    .headline-row {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 0.9rem;
        margin-bottom: 0.8rem;
    }

    h2 {
        color: var(--color-accent-2);
        font-family: var(--font-sans);
        font-size: clamp(1.55rem, 2vw, 2rem);
        font-weight: var(--font-weight-heading);
        line-height: 1.08;
        margin: 0;
        max-width: 18ch;
        text-wrap: balance;
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
            var(--section-chip-accent, var(--color-accent-2)) 76%,
            var(--color-accent-2)
        );
        display: inline-flex;
        font-size: 0.74rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        line-height: 1;
        padding: 0.42rem 0.78rem;
        text-transform: uppercase;
        white-space: nowrap;
    }

    .summary {
        color: var(--color-muted);
        display: block;
        font-size: var(--font-size-body);
        line-height: var(--line-height-body);
        max-width: 56ch;
        white-space: pre-line;
    }

    .story-meta {
        color: var(--color-accent);
        display: flex;
        gap: 0.85rem;
        letter-spacing: 0.11em;
        margin-top: var(--space-4);
        text-transform: uppercase;
    }

    .story-meta span + span::before {
        content: "•";
        margin-right: 0.85rem;
    }

    .empty-state {
        background: color-mix(in srgb, var(--color-panel) 88%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 65%, transparent);
        padding: clamp(var(--space-5), 4vw, var(--space-6));
    }

    .empty-state h2 {
        font-size: clamp(1.4rem, 2vw, 1.8rem);
        margin-bottom: var(--space-3);
        max-width: none;
    }

    .empty-state p {
        color: var(--color-muted);
        margin: 0 0 var(--space-3);
        max-width: 60ch;
    }

    .empty-state__links {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
        margin-top: var(--space-4);
    }

    .empty-state__links a {
        color: var(--color-accent-2);
        text-decoration-thickness: 1px;
        text-underline-offset: 0.18em;
    }

    .status-copy {
        color: var(--color-muted);
    }

    @media (max-width: 760px) {
        article a {
            grid-template-columns: minmax(0, 1fr);
        }
    }
</style>
