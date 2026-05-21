<script lang="ts">
    import { afterNavigate } from "$app/navigation";
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import {
        getEffectiveStoryDocumentType,
        getStoryDateIso,
        getStoryDateValue,
        getStoryDocumentTypeMeta,
        getStorySection,
        publishedCommitteeNames,
        searchStoriesRanked,
        storyDocumentTypes,
        storySections,
        stories,
        type StorySearchResult,
    } from "$lib/content/stories";
    import { plainTextFromHtml } from "$lib/content/text";
    import type { StoryDocumentType, StorySection } from "$lib/content/types";

    type SortMode = "most-relevant" | "newest";

    let query = $state("");
    let sortMode = $state<SortMode>("most-relevant");
    let requestedSections = $state<StorySection[]>([]);
    let requestedTypes = $state<StoryDocumentType[]>([]);
    let requestedCommittee = $state("");
    let dateFrom = $state("");
    let dateTo = $state("");

    function isStorySection(value: string | null): value is StorySection {
        return (
            value === "committees" ||
            value === "houses-of-the-oireachtas" ||
            value === "parliamentary-budget-office" ||
            value === "library-research-service"
        );
    }

    function coerceStorySections(values: string[]) {
        return values.filter((value): value is StorySection =>
            isStorySection(value),
        );
    }

    function isStoryDocumentType(value: string): value is StoryDocumentType {
        return storyDocumentTypes.some((entry) => entry.value === value);
    }

    function coerceStoryDocumentTypes(values: string[]) {
        return values.filter((value): value is StoryDocumentType =>
            isStoryDocumentType(value),
        );
    }

    function matchesDateRange(
        storyDateIso: string | null,
        from: string,
        to: string,
    ) {
        if (!from && !to) return true;
        if (!storyDateIso) return false;
        if (from && storyDateIso < from) return false;
        if (to && storyDateIso > to) return false;
        return true;
    }

    function buildSearchHref(options?: {
        sections?: StorySection[];
        types?: StoryDocumentType[];
        committee?: string;
        from?: string;
        to?: string;
        sort?: SortMode;
        query?: string;
    }) {
        const params = new URLSearchParams();
        const nextQuery = options?.query ?? query;
        const nextSections = options?.sections ?? requestedSections;
        const nextTypes = options?.types ?? requestedTypes;
        const nextCommittee = options?.committee ?? requestedCommittee;
        const nextFrom = options?.from ?? dateFrom;
        const nextTo = options?.to ?? dateTo;
        const nextSort = options?.sort ?? sortMode;

        if (nextQuery) params.set("q", nextQuery);
        for (const section of nextSections) params.append("section", section);
        for (const type of nextTypes) params.append("type", type);
        if (nextCommittee) params.set("committee", nextCommittee);
        if (nextFrom) params.set("from", nextFrom);
        if (nextTo) params.set("to", nextTo);
        if (nextSort !== "most-relevant") params.set("sort", nextSort);

        const queryString = params.toString();
        return queryString
            ? `${base}/search/?${queryString}`
            : `${base}/search/`;
    }

    let sectionFilter = $derived(
        requestedSections.length === 1 ? requestedSections[0] : undefined,
    );
    let committeesSelected = $derived(requestedSections.includes("committees"));
    let sectionMeta = $derived(
        sectionFilter ? getStorySection(sectionFilter) : undefined,
    );
    let hasActiveSearch = $derived(
        Boolean(
            query ||
            requestedSections.length ||
            requestedTypes.length ||
            requestedCommittee ||
            dateFrom ||
            dateTo,
        ),
    );
    let searchableStories = $derived(
        requestedSections.length
            ? stories.filter((story) =>
                  requestedSections.includes(story.section),
              )
            : stories,
    );
    let typeFilteredStories = $derived(
        requestedTypes.length
            ? searchableStories.filter((story) =>
                  requestedTypes.includes(getEffectiveStoryDocumentType(story)),
              )
            : searchableStories,
    );
    let committeeFilteredStories = $derived(
        requestedCommittee
            ? typeFilteredStories.filter(
                  (story) => story.committeeName === requestedCommittee,
              )
            : typeFilteredStories,
    );
    let rankedResults = $derived.by<StorySearchResult[]>(() => {
        const dateFilteredStories = committeeFilteredStories.filter((story) =>
            matchesDateRange(getStoryDateIso(story), dateFrom, dateTo),
        );

        if (!query) {
            return dateFilteredStories.map((story) => ({ story, score: 0 }));
        }

        return searchStoriesRanked(dateFilteredStories, query);
    });
    let sortedResults = $derived.by<StorySearchResult[]>(() => {
        if (sortMode === "newest") {
            return [...rankedResults].sort(
                (a, b) =>
                    getStoryDateValue(b.story) - getStoryDateValue(a.story),
            );
        }

        return rankedResults;
    });
    let activeFilterChips = $derived.by<Array<{ label: string; href: string }>>(
        () => {
            const chips: Array<{ label: string; href: string }> = [];

            for (const section of requestedSections) {
                chips.push({
                    label: getStorySection(section)?.title ?? section,
                    href: buildSearchHref({
                        sections: requestedSections.filter(
                            (value) => value !== section,
                        ),
                        committee:
                            section === "committees" ? "" : requestedCommittee,
                    }),
                });
            }

            for (const type of requestedTypes) {
                chips.push({
                    label: getStoryDocumentTypeMeta(type)?.label ?? type,
                    href: buildSearchHref({
                        types: requestedTypes.filter((value) => value !== type),
                    }),
                });
            }

            if (requestedCommittee) {
                chips.push({
                    label: requestedCommittee,
                    href: buildSearchHref({ committee: "" }),
                });
            }

            if (dateFrom) {
                chips.push({
                    label: `From ${dateFrom}`,
                    href: buildSearchHref({ from: "" }),
                });
            }

            if (dateTo) {
                chips.push({
                    label: `To ${dateTo}`,
                    href: buildSearchHref({ to: "" }),
                });
            }

            return chips;
        },
    );

    function submitSortForm(event: Event) {
        (event.currentTarget as HTMLSelectElement).form?.requestSubmit();
    }

    function updateSearchState() {
        const params = new URLSearchParams(window.location.search);
        query = params.get("q")?.trim() ?? "";
        requestedSections = coerceStorySections(params.getAll("section"));
        requestedTypes = coerceStoryDocumentTypes(params.getAll("type"));
        requestedCommittee =
            requestedSections.includes("committees") &&
            publishedCommitteeNames.includes(params.get("committee") ?? "")
                ? (params.get("committee") ?? "")
                : "";
        sortMode = params.get("sort") === "newest" ? "newest" : "most-relevant";
        dateFrom = params.get("from") ?? "";
        dateTo = params.get("to") ?? "";
    }

    onMount(() => {
        updateSearchState();
    });

    afterNavigate(() => {
        updateSearchState();
    });
</script>

<svelte:head>
    <title>Search | Stór | Independent Parliamentary Research</title>
    <meta
        name="description"
        content="Search Stór articles by title, author and core article metadata."
    />
</svelte:head>

<section class="page-shell search-page">
    <header class="search-header">
        <form class="search-form" method="GET" action="{base}/search/">
            <div class="search-copy">
                <p class="eyebrow">Search</p>
                <h1>Search articles</h1>
                <p class="lede">
                    Search across Stór with title, author and researcher
                    details.
                </p>
            </div>

            <div class="search-query-group">
                <label class="search-query-label" for="search-query"
                    >Search terms</label
                >
                <input
                    id="search-query"
                    name="q"
                    class="search-query-input"
                    type="search"
                    value={query}
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="Search by title, author, researcher or topic"
                />
            </div>

            <div class="filters-grid">
                <details class="filter-accordion" open>
                    <summary>Sections</summary>
                    <fieldset class="filter-group">
                        <div class="checkbox-group">
                            {#each storySections as section}
                                <label class="checkbox-option">
                                    <input
                                        type="checkbox"
                                        name="section"
                                        value={section.slug}
                                        checked={requestedSections.includes(
                                            section.slug,
                                        )}
                                    />
                                    <span>{section.title}</span>
                                </label>
                            {/each}
                        </div>

                        {#if committeesSelected}
                            <label
                                class="committee-select-group"
                                for="committee-filter"
                            >
                                <span>Specific committee</span>
                                <select
                                    id="committee-filter"
                                    name="committee"
                                    value={requestedCommittee}
                                >
                                    <option value=""
                                        >All published committees</option
                                    >
                                    {#each publishedCommitteeNames as committee}
                                        <option value={committee}
                                            >{committee}</option
                                        >
                                    {/each}
                                </select>
                            </label>
                        {/if}
                    </fieldset>
                </details>

                <details class="filter-accordion">
                    <summary>Publication date</summary>
                    <fieldset class="filter-group">
                        <p class="filter-hint">
                            Leave blank to search across all publication dates.
                        </p>
                        <div class="date-range">
                            <label>
                                <span>From</span>
                                <input
                                    type="date"
                                    name="from"
                                    value={dateFrom}
                                />
                            </label>
                            <label>
                                <span>To</span>
                                <input type="date" name="to" value={dateTo} />
                            </label>
                        </div>
                    </fieldset>
                </details>

                <details class="filter-accordion">
                    <summary>Document type</summary>
                    <fieldset class="filter-group">
                        <div class="checkbox-group checkbox-group--types">
                            {#each storyDocumentTypes as type}
                                <label class="checkbox-option">
                                    <input
                                        type="checkbox"
                                        name="type"
                                        value={type.value}
                                        checked={requestedTypes.includes(
                                            type.value,
                                        )}
                                    />
                                    <span>{type.label}</span>
                                </label>
                            {/each}
                        </div>
                    </fieldset>
                </details>
            </div>

            <div class="filters-actions">
                <button type="submit" class="filters-apply"
                    >Apply filters</button
                >
                <a class="filters-clear" href="{base}/search/"
                    >Clear search and filters</a
                >
            </div>
        </form>
    </header>

    {#if hasActiveSearch}
        <section class="search-results-shell">
            <div class="search-results-bar">
                <div>
                    <p class="results-count">{sortedResults.length} results</p>
                    {#if requestedSections.length === 1 && sectionMeta}
                        <p class="results-scope">Within {sectionMeta.title}</p>
                    {:else if requestedSections.length > 1}
                        <p class="results-scope">
                            Within {requestedSections.length} selected sections
                        </p>
                    {/if}
                    {#if requestedTypes.length}
                        <p class="results-scope">
                            Type:
                            {requestedTypes
                                .map(
                                    (type) =>
                                        getStoryDocumentTypeMeta(type)?.label ??
                                        type,
                                )
                                .join(", ")}
                        </p>
                    {/if}
                    {#if requestedCommittee}
                        <p class="results-scope">
                            Committee: {requestedCommittee}
                        </p>
                    {/if}
                    {#if dateFrom || dateTo}
                        <p class="results-scope">
                            Published between {dateFrom || "start"} and {dateTo ||
                                "today"}
                        </p>
                    {/if}
                </div>

                <form class="sort-form" method="GET" action="{base}/search/">
                    <input type="hidden" name="q" value={query} />
                    {#each requestedSections as section}
                        <input type="hidden" name="section" value={section} />
                    {/each}
                    {#each requestedTypes as type}
                        <input type="hidden" name="type" value={type} />
                    {/each}
                    {#if requestedCommittee}
                        <input
                            type="hidden"
                            name="committee"
                            value={requestedCommittee}
                        />
                    {/if}
                    {#if dateFrom}
                        <input type="hidden" name="from" value={dateFrom} />
                    {/if}
                    {#if dateTo}
                        <input type="hidden" name="to" value={dateTo} />
                    {/if}
                    <label for="sort-mode">Order by</label>
                    <select
                        id="sort-mode"
                        name="sort"
                        onchange={submitSortForm}
                    >
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

            {#if activeFilterChips.length}
                <div class="active-filters" aria-label="Active filters">
                    <p class="active-filters-label">Active filters</p>
                    <div class="active-filters-list">
                        {#each activeFilterChips as chip}
                            <a class="active-filter-chip" href={chip.href}>
                                <span>{chip.label}</span>
                                <span aria-hidden="true">×</span>
                            </a>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if sortedResults.length}
                <div class="results-list">
                    {#each sortedResults as result}
                        <article class="result-card">
                            <a href="{base}/articles/{result.story.slug}/">
                                <div class="result-topline">
                                    <span>{result.story.date}</span>
                                    <span>{result.story.readingTime}</span>
                                </div>
                                <div class="result-chip-row">
                                    <span
                                        class="section-chip"
                                        style={getStorySection(
                                            result.story.section,
                                        )?.accentColor
                                            ? `--section-chip-accent: ${getStorySection(result.story.section)?.accentColor};`
                                            : undefined}
                                    >
                                        {getStorySection(result.story.section)
                                            ?.title}
                                    </span>
                                </div>
                                <h2>{result.story.title}</h2>
                                <p class="result-author">
                                    {result.story.researcher?.name ??
                                        result.story.byline}
                                </p>
                                <p class="result-summary">
                                    {plainTextFromHtml(
                                        result.story.abstract ??
                                            result.story.dek,
                                    )}
                                </p>
                            </a>
                        </article>
                    {/each}
                </div>
            {:else}
                <div class="empty-state">
                    <p>
                        No articles match
                        {#if query}
                            “{query}”
                        {:else}
                            your selected filters
                        {/if}.
                    </p>
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
        border-bottom: 1px solid
            color-mix(in srgb, var(--color-line) 55%, transparent);
        margin-bottom: var(--space-section);
        padding-bottom: var(--space-6);
    }

    .search-form {
        background: color-mix(in srgb, var(--color-panel) 82%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 72%, transparent);
        border-radius: 0.5rem;
        display: grid;
        gap: var(--space-5);
        padding: clamp(var(--space-5), 4vw, var(--space-6));
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

    .search-query-group {
        display: grid;
        gap: var(--space-2);
        max-width: 60rem;
    }

    .search-query-label {
        color: var(--color-accent);
        font-size: var(--font-size-small);
        font-weight: var(--font-weight-meta);
        letter-spacing: 0.11em;
        line-height: var(--line-height-small);
        text-transform: uppercase;
    }

    .search-query-input {
        appearance: none;
        background: color-mix(in srgb, var(--color-paper) 92%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
        border-radius: 0.4rem;
        color: var(--color-accent-2);
        font: inherit;
        font-size: 1rem;
        line-height: 1.2;
        padding: 0.95rem 1.2rem;
        width: 100%;
    }

    .search-query-input::placeholder {
        color: var(--color-faint);
    }

    .search-query-input:focus-visible,
    .date-range input:focus-visible,
    .sort-form select:focus-visible {
        border-color: var(--color-focus);
        outline: 2px solid
            color-mix(in srgb, var(--color-focus) 26%, transparent);
        outline-offset: 2px;
    }

    .search-results-shell {
        display: grid;
        gap: var(--space-6);
    }

    .filters-grid {
        display: grid;
        gap: var(--space-5);
        grid-template-columns: minmax(0, 1fr);
    }

    .filter-group {
        border: 0;
        margin: 0;
        min-width: 0;
        padding: 0;
    }

    .filter-accordion {
        background: color-mix(in srgb, var(--color-paper) 90%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
        border-radius: 0.4rem;
        overflow: clip;
    }

    .filter-accordion summary {
        color: var(--color-accent-2);
        cursor: pointer;
        font-size: 0.98rem;
        font-weight: 600;
        list-style: none;
        padding: 0.9rem 1rem;
    }

    .filter-accordion summary::-webkit-details-marker {
        display: none;
    }

    .filter-accordion[open] summary {
        border-bottom: 1px solid
            color-mix(in srgb, var(--color-line) 72%, transparent);
    }

    .filter-accordion .filter-group {
        padding: 1rem;
    }

    .date-range {
        display: grid;
        gap: var(--space-3);
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .date-range label,
    .checkbox-option {
        display: grid;
        gap: 0.45rem;
    }

    .filter-hint {
        color: var(--color-muted);
        font-size: 0.95rem;
        line-height: 1.5;
        margin: 0 0 var(--space-3);
        max-width: 36rem;
    }

    .date-range span {
        color: var(--color-muted);
        font-size: var(--font-size-small);
        font-weight: 600;
        line-height: var(--line-height-small);
    }

    .date-range input {
        appearance: none;
        background: color-mix(in srgb, var(--color-paper) 92%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
        border-radius: 0.4rem;
        color: var(--color-accent-2);
        font: inherit;
        padding: 0.85rem 1rem;
    }

    .checkbox-group {
        display: grid;
        gap: 0.8rem 1rem;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .checkbox-group--types {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .committee-select-group {
        display: grid;
        gap: 0.45rem;
        margin-top: var(--space-4);
        max-width: 32rem;
    }

    .committee-select-group span {
        color: var(--color-muted);
        font-size: var(--font-size-small);
        font-weight: 600;
        line-height: var(--line-height-small);
    }

    .committee-select-group select {
        appearance: none;
        background: color-mix(in srgb, var(--color-paper) 92%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
        border-radius: 0.4rem;
        color: var(--color-accent-2);
        font: inherit;
        padding: 0.85rem 1rem;
    }

    .checkbox-option {
        align-items: center;
        color: var(--color-accent-2);
        font-size: 0.98rem;
        font-weight: 500;
        grid-template-columns: auto minmax(0, 1fr);
    }

    .checkbox-option input {
        accent-color: var(--color-focus);
        margin: 0.1rem 0 0;
    }

    .filters-actions {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 0.9rem 1rem;
    }

    .filters-apply {
        appearance: none;
        background: var(--color-ink);
        border: 1px solid var(--color-ink);
        border-radius: 0.4rem;
        color: var(--color-paper);
        cursor: pointer;
        font: inherit;
        font-weight: 600;
        padding: 0.85rem 1.2rem;
    }

    .filters-clear {
        color: var(--color-muted);
        font-size: 0.95rem;
        font-weight: 600;
        text-decoration: none;
    }

    .filters-clear:hover,
    .filters-clear:focus-visible {
        color: var(--link-hover);
    }

    .search-results-bar {
        align-items: end;
        display: flex;
        gap: var(--space-5);
        justify-content: space-between;
    }

    .active-filters {
        display: grid;
        gap: 0.7rem;
    }

    .active-filters-label {
        color: var(--color-muted);
        font-size: var(--font-size-small);
        font-weight: 600;
        line-height: var(--line-height-small);
        margin: 0;
    }

    .active-filters-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
    }

    .active-filter-chip {
        align-items: center;
        background: color-mix(in srgb, var(--color-panel) 88%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
        border-radius: 999px;
        color: var(--color-accent-2);
        display: inline-flex;
        gap: 0.5rem;
        line-height: 1;
        padding: 0.55rem 0.8rem;
        text-decoration: none;
    }

    .active-filter-chip:hover,
    .active-filter-chip:focus-visible {
        border-color: var(--color-focus);
        color: var(--link-hover);
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
        border-radius: 0.4rem;
        color: var(--color-accent-2);
        font: inherit;
        padding: 0.85rem 1rem;
    }

    .results-list {
        display: grid;
    }

    .result-card a {
        border-top: 1px solid
            color-mix(in srgb, var(--color-line) 62%, transparent);
        color: inherit;
        display: block;
        padding: var(--space-5) 0;
        text-decoration: none;
    }

    .result-card:last-child a {
        border-bottom: 1px solid
            color-mix(in srgb, var(--color-line) 62%, transparent);
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
            color-mix(
                in srgb,
                var(--section-chip-accent, var(--color-line)) 24%,
                var(--color-line)
            );
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
        border-top: 1px solid
            color-mix(in srgb, var(--color-line) 55%, transparent);
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
        .filters-grid {
            grid-template-columns: minmax(0, 1fr);
        }

        .date-range,
        .checkbox-group,
        .checkbox-group--types {
            grid-template-columns: minmax(0, 1fr);
        }

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
