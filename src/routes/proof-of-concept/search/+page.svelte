<script lang="ts">
    import { afterNavigate } from "$app/navigation";
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import StorySearch from "$lib/components/story/StorySearch.svelte";
    import {
        getStoriesBySection,
        getStorySection,
        searchStoriesRanked,
        type StorySearchResult,
    } from "$lib/content/stories";
    import { plainTextFromHtml } from "$lib/content/text";

    type SortMode = "most-relevant" | "newest";

    const sectionFilter = "committees" as const;
    const sectionMeta = getStorySection(sectionFilter);
    const searchableStories = getStoriesBySection(sectionFilter);
    const searchAction = `${base}/proof-of-concept/search/`;

    let query = $state("");
    let sortMode = $state<SortMode>("most-relevant");

    let rankedResults = $derived(searchStoriesRanked(searchableStories, query));
    let sortedResults = $derived.by<StorySearchResult[]>(() => {
        if (sortMode === "newest") {
            return [...rankedResults].sort(
                (a, b) => Date.parse(b.story.date) - Date.parse(a.story.date),
            );
        }

        return rankedResults;
    });

    function submitSortForm(event: Event) {
        (event.currentTarget as HTMLSelectElement).form?.requestSubmit();
    }

    function updateSearchState() {
        const params = new URLSearchParams(window.location.search);
        query = params.get("q")?.trim() ?? "";
        sortMode = params.get("sort") === "newest" ? "newest" : "most-relevant";
    }

    onMount(() => {
        updateSearchState();
    });

    afterNavigate(() => {
        updateSearchState();
    });
</script>

<svelte:head>
    <title>Search reports | Committee report repository</title>
    <meta
        name="description"
        content="Search committee reports in the committee report repository sandbox."
    />
</svelte:head>

<section class="page-shell search-page">
    <header class="search-header">
        <div class="search-copy">
            <p class="eyebrow">Search</p>
            <h1>Search for reports</h1>
            <p class="lede">
                Search within committee report outputs only.
            </p>
        </div>
        <div class="search-field-wrap">
            <StorySearch
                query={query}
                section={sectionFilter}
                label="Search for reports"
                action={searchAction}
            />
        </div>
    </header>

    {#if query}
        <section class="search-results-shell">
            <div class="search-results-bar">
                <div>
                    <p class="results-count">{sortedResults.length} results</p>
                    {#if sectionMeta}
                        <p class="results-scope">Within {sectionMeta.title}</p>
                    {/if}
                </div>

                <form class="sort-form" method="GET" action={searchAction}>
                    <input type="hidden" name="q" value={query} />
                    <input type="hidden" name="section" value={sectionFilter} />
                    <label for="sort-mode">Order by</label>
                    <select id="sort-mode" name="sort" onchange={submitSortForm}>
                        <option
                            value="most-relevant"
                            selected={sortMode === "most-relevant"}
                        >
                            Most relevant
                        </option>
                        <option value="newest" selected={sortMode === "newest"}>
                            Newest
                        </option>
                    </select>
                </form>
            </div>

            {#if sortedResults.length}
                <div class="results-list">
                    {#each sortedResults as result}
                        <article class="result-card">
                            <a href="{base}/proof-of-concept/articles/{result.story.slug}/">
                                <div class="result-topline">
                                    <span>{result.story.date}</span>
                                    <span>{result.story.readingTime}</span>
                                </div>
                                <div class="result-chip-row">
                                    <span
                                        class="section-chip"
                                        style={sectionMeta?.accentColor
                                            ? `--section-chip-accent: ${sectionMeta.accentColor};`
                                            : undefined}
                                    >
                                        {sectionMeta?.title}
                                    </span>
                                </div>
                                <h2>{result.story.title}</h2>
                                <p class="result-author">
                                    {result.story.researcher?.name ?? result.story.byline}
                                </p>
                                <p class="result-summary">
                                    {plainTextFromHtml(
                                        result.story.abstract ?? result.story.dek,
                                    )}
                                </p>
                            </a>
                        </article>
                    {/each}
                </div>
            {:else}
                <div class="empty-state">
                    <p>No reports match “{query}”.</p>
                </div>
            {/if}
        </section>
    {:else}
        <div class="empty-state empty-state--prompt">
            <p>Enter a search term to browse committee report results.</p>
        </div>
    {/if}
</section>

<style>
    .search-page {
        padding-top: clamp(var(--space-7), 7vw, 4.5rem);
    }

    .search-header {
        border-bottom: 1px solid color-mix(in srgb, var(--color-line) 55%, transparent);
        margin-bottom: var(--space-section);
        padding-bottom: var(--space-6);
    }

    .search-copy {
        margin-bottom: var(--space-5);
    }

    h1 {
        color: var(--color-accent-2);
        font-family: var(--font-sans);
        font-size: var(--font-size-h1);
        font-weight: var(--font-weight-heading);
        line-height: var(--line-height-heading);
        margin: 0 0 var(--space-stack-tight);
        max-width: 18ch;
        text-wrap: balance;
    }

    .lede {
        color: var(--color-muted);
        font-size: var(--font-size-body);
        line-height: var(--line-height-body);
        margin: 0;
        max-width: 52rem;
    }

    .search-field-wrap {
        max-width: 52rem;
    }

    .search-results-shell {
        display: grid;
        gap: var(--space-6);
    }

    .search-results-bar {
        align-items: end;
        display: flex;
        gap: var(--space-5);
        justify-content: space-between;
    }

    .results-count {
        color: var(--color-accent-2);
        font-family: var(--font-sans);
        font-size: clamp(1.45rem, 2vw, 1.85rem);
        font-weight: 700;
        line-height: 1.1;
        margin: 0;
    }

    .results-scope {
        color: var(--color-muted);
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0.35rem 0 0;
    }

    .sort-form {
        display: grid;
        gap: 0.45rem;
        min-width: 12rem;
    }

    .sort-form label {
        color: var(--color-muted);
        font-size: var(--font-size-small);
        font-weight: 600;
        line-height: var(--line-height-small);
    }

    .sort-form select {
        appearance: none;
        background: color-mix(in srgb, var(--color-panel) 84%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
        border-radius: 0.8rem;
        color: var(--color-accent-2);
        font: inherit;
        padding: 0.85rem 1rem;
    }

    .results-list {
        display: grid;
    }

    .result-card a {
        border-top: 1px solid color-mix(in srgb, var(--color-line) 62%, transparent);
        color: inherit;
        display: block;
        padding: var(--space-5) 0;
        text-decoration: none;
    }

    .result-card:last-child a {
        border-bottom: 1px solid color-mix(in srgb, var(--color-line) 62%, transparent);
    }

    .result-topline {
        color: var(--color-muted);
        display: flex;
        flex-wrap: wrap;
        font-size: var(--font-size-small);
        font-weight: 500;
        gap: 0.35rem 0.65rem;
        line-height: var(--line-height-small);
        margin-bottom: 0.6rem;
        text-transform: uppercase;
    }

    .result-topline span:not(:last-child)::after {
        color: var(--color-faint);
        content: "·";
        margin-left: 0.65rem;
    }

    .result-chip-row {
        margin-bottom: 0.75rem;
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
        font-size: 0.76rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        line-height: 1;
        padding: 0.42rem 0.62rem;
        text-transform: uppercase;
    }

    .result-card h2 {
        color: var(--color-accent-2);
        font-family: var(--font-sans);
        font-size: clamp(1.25rem, 2vw, 1.6rem);
        font-weight: 700;
        line-height: 1.15;
        margin: 0 0 0.55rem;
        max-width: 26ch;
        text-wrap: balance;
    }

    .result-author {
        color: var(--color-muted);
        font-size: 1rem;
        line-height: 1.5;
        margin: 0 0 0.7rem;
    }

    .result-summary {
        color: var(--color-muted);
        line-height: 1.65;
        margin: 0;
        max-width: 58ch;
    }

    .empty-state {
        border: 1px dashed color-mix(in srgb, var(--color-line) 62%, transparent);
        color: var(--color-muted);
        padding: clamp(var(--space-5), 4vw, var(--space-6));
    }

    .empty-state--prompt {
        margin-top: var(--space-4);
    }

    @media (max-width: 720px) {
        .search-results-bar {
            align-items: flex-start;
            flex-direction: column;
        }
    }
</style>
