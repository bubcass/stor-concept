<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { base } from "$app/paths";
  import { onMount } from "svelte";
  import StorySearch from "$lib/components/story/StorySearch.svelte";
  import {
    getStoriesBySection,
    getStorySection,
    searchStoriesRanked,
    stories,
    type StorySearchResult,
  } from "$lib/content/stories";
  import { plainTextFromHtml } from "$lib/content/text";
  import type { StorySection } from "$lib/content/types";

  type SortMode = "most-relevant" | "newest";

  let query = $state("");
  let sortMode = $state<SortMode>("most-relevant");
  let requestedSection = $state<string | null>(null);

  function isStorySection(value: string | null): value is StorySection {
    return (
      value === "committees" ||
      value === "parliamentary-budget-office" ||
      value === "library-research-service"
    );
  }

  let sectionFilter = $derived(
    isStorySection(requestedSection) ? requestedSection : undefined,
  );
  let sectionMeta = $derived(
    sectionFilter ? getStorySection(sectionFilter) : undefined,
  );
  let searchableStories = $derived(
    sectionFilter ? getStoriesBySection(sectionFilter) : stories,
  );
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
    requestedSection = params.get("section");
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
  <title>Search | Stór | Oireachtas Research Repository</title>
  <meta
    name="description"
    content="Search Stór articles by title, author and core article metadata."
  />
</svelte:head>

<section class="page-shell search-page">
  <header class="search-header">
    <div class="search-copy">
      <p class="eyebrow">Search</p>
      <h1>Search articles</h1>
      <p class="lede">
        Search across Stór metadata including title, author and researcher details.
      </p>
    </div>
    <div class="search-field-wrap">
      <StorySearch query={query} section={sectionFilter} />
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

        <form class="sort-form" method="GET" action="{base}/search/">
          <input type="hidden" name="q" value={query} />
          {#if sectionFilter}
            <input type="hidden" name="section" value={sectionFilter} />
          {/if}
          <label for="sort-mode">Order by</label>
          <select id="sort-mode" name="sort" onchange={submitSortForm}>
            <option value="most-relevant" selected={sortMode === "most-relevant"}>
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
              <a href="{base}/stories/{result.story.slug}/">
                <div class="result-topline">
                  <span>{result.story.date}</span>
                  <span>{result.story.readingTime}</span>
                </div>
                <div class="result-chip-row">
                  <span class="section-chip">
                    {getStorySection(result.story.section)?.title}
                  </span>
                </div>
                <h2>{result.story.title}</h2>
                <p class="result-author">
                  {result.story.researcher?.name ?? result.story.byline}
                </p>
                <p class="result-summary">
                  {plainTextFromHtml(result.story.abstract ?? result.story.dek)}
                </p>
              </a>
            </article>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <p>No articles match “{query}”.</p>
        </div>
      {/if}
    </section>
  {:else}
    <div class="empty-state empty-state--prompt">
      <p>Enter a search term to browse article results.</p>
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
    background: color-mix(in srgb, var(--color-soft) 82%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-line) 76%, transparent);
    border-radius: 999px;
    color: var(--color-accent-2);
    display: inline-flex;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    line-height: 1;
    padding: 0.42rem 0.62rem;
    text-transform: uppercase;
  }

  h2 {
    color: var(--color-accent-2);
    font-family: var(--font-sans);
    font-size: clamp(1.25rem, 2vw, 1.6rem);
    font-weight: 700;
    line-height: 1.15;
    margin: 0 0 0.55rem;
    max-width: 28ch;
    text-wrap: balance;
  }

  .result-author {
    color: var(--color-accent);
    font-size: 0.92rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    line-height: 1.5;
    margin: 0 0 0.8rem;
  }

  .result-summary {
    color: var(--color-muted);
    font-size: var(--font-size-body);
    line-height: var(--line-height-body);
    margin: 0;
    max-width: 58rem;
  }

  .result-card a:hover h2,
  .result-card a:focus-visible h2 {
    color: var(--link-hover);
  }

  .empty-state {
    border-top: 1px solid color-mix(in srgb, var(--color-line) 55%, transparent);
    padding-top: var(--space-6);
  }

  .empty-state p {
    color: var(--color-muted);
    font-size: var(--font-size-body);
    line-height: var(--line-height-body);
    margin: 0;
  }

  .empty-state--prompt {
    margin-top: var(--space-6);
  }

  @media (max-width: 760px) {
    .search-results-bar {
      align-items: start;
      flex-direction: column;
    }

    .sort-form {
      width: 100%;
    }

    .sort-form select {
      width: 100%;
    }
  }
</style>
