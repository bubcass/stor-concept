<script lang="ts">
    import { afterNavigate } from "$app/navigation";
    import { base } from "$app/paths";
    import { onMount } from "svelte";
    import {
        getStoriesBySection,
        getStoryDateIso,
        getStoryDateValue,
        getStorySection,
        publishedCommitteeNames,
        searchStoriesRanked,
        type StorySearchResult,
    } from "$lib/content/stories";
    import { plainTextFromHtml } from "$lib/content/text";

    type SortMode = "most-relevant" | "newest";
    type DatePreset =
        | ""
        | "past-week"
        | "past-month"
        | "past-6-months"
        | "past-year"
        | "custom";

    const sectionFilter = "committees" as const;
    const sectionMeta = getStorySection(sectionFilter);
    const committeeStories = getStoriesBySection(sectionFilter);
    const searchAction = `${base}/proof-of-concept/search/`;

    let query = $state("");
    let sortMode = $state<SortMode>("most-relevant");
    let requestedCommittee = $state("");
    let datePreset = $state<DatePreset>("");
    let dateFrom = $state("");
    let dateTo = $state("");

    function todayLocalIsoDate() {
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60_000;
        return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
    }

    function shiftIsoDate(isoDate: string, days: number) {
        const [year, month, day] = isoDate.split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        date.setUTCDate(date.getUTCDate() + days);
        return date.toISOString().slice(0, 10);
    }

    function resolveDateRange(
        preset: DatePreset,
        from: string,
        to: string,
    ) {
        if (preset === "custom") {
            return { from, to };
        }

        const today = todayLocalIsoDate();

        switch (preset) {
            case "past-week":
                return { from: shiftIsoDate(today, -7), to: today };
            case "past-month":
                return { from: shiftIsoDate(today, -30), to: today };
            case "past-6-months":
                return { from: shiftIsoDate(today, -183), to: today };
            case "past-year":
                return { from: shiftIsoDate(today, -365), to: today };
            default:
                return { from, to };
        }
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
        committee?: string;
        datePreset?: DatePreset;
        from?: string;
        to?: string;
        sort?: SortMode;
        query?: string;
    }) {
        const params = new URLSearchParams();
        const nextQuery = options?.query ?? query;
        const nextCommittee = options?.committee ?? requestedCommittee;
        const nextDatePreset = options?.datePreset ?? datePreset;
        const nextFrom = options?.from ?? dateFrom;
        const nextTo = options?.to ?? dateTo;
        const nextSort = options?.sort ?? sortMode;
        const resolvedRange = resolveDateRange(
            nextDatePreset,
            nextFrom,
            nextTo,
        );

        if (nextQuery) params.set("q", nextQuery);
        if (nextCommittee) params.set("committee", nextCommittee);
        if (nextDatePreset) params.set("date", nextDatePreset);
        if (resolvedRange.from) params.set("from", resolvedRange.from);
        if (resolvedRange.to) params.set("to", resolvedRange.to);
        if (nextSort !== "most-relevant") params.set("sort", nextSort);

        const queryString = params.toString();
        return queryString
            ? `${searchAction}?${queryString}`
            : searchAction;
    }

    let effectiveDateRange = $derived(
        resolveDateRange(datePreset, dateFrom, dateTo),
    );
    let hasActiveSearch = $derived(
        Boolean(
            query ||
                requestedCommittee ||
                datePreset ||
                effectiveDateRange.from ||
                effectiveDateRange.to,
        ),
    );
    let committeeFilteredStories = $derived(
        requestedCommittee
            ? committeeStories.filter(
                    (story) => story.committeeName === requestedCommittee,
                )
            : committeeStories,
    );
    let rankedResults = $derived.by<StorySearchResult[]>(() => {
        const dateFilteredStories = committeeFilteredStories.filter((story) =>
            matchesDateRange(
                getStoryDateIso(story),
                effectiveDateRange.from,
                effectiveDateRange.to,
            ),
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

            if (requestedCommittee) {
                chips.push({
                    label: requestedCommittee,
                    href: buildSearchHref({ committee: "" }),
                });
            }

            if (datePreset && datePreset !== "custom") {
                const label =
                    datePreset === "past-week"
                        ? "Past week"
                        : datePreset === "past-month"
                            ? "Past month"
                            : datePreset === "past-6-months"
                                ? "Past 6 months"
                                : "Past year";

                chips.push({
                    label,
                    href: buildSearchHref({
                        datePreset: "",
                        from: "",
                        to: "",
                    }),
                });
            }

            if (dateFrom) {
                chips.push({
                    label: `From ${dateFrom}`,
                    href: buildSearchHref({
                        datePreset: "",
                        from: "",
                        to: "",
                    }),
                });
            }

            if (dateTo) {
                chips.push({
                    label: `To ${dateTo}`,
                    href: buildSearchHref({
                        datePreset: "",
                        from: "",
                        to: "",
                    }),
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
        requestedCommittee = publishedCommitteeNames.includes(
            params.get("committee") ?? "",
        )
            ? (params.get("committee") ?? "")
            : "";
        datePreset = (
            params.get("date") === "past-week" ||
                params.get("date") === "past-month" ||
                params.get("date") === "past-6-months" ||
                params.get("date") === "past-year" ||
                params.get("date") === "custom"
                ? params.get("date")
                : ""
        ) as DatePreset;
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
        </div>
    </header>

    <div class="search-layout">
        <form class="search-form" method="GET" action={searchAction}>
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
                <fieldset class="filter-group">
                    <legend>Committee</legend>
                    <label class="committee-select-group" for="committee-filter">
                        <select
                            id="committee-filter"
                            name="committee"
                            bind:value={requestedCommittee}
                        >
                            <option value="">All published committees</option>
                            {#each publishedCommitteeNames as committee}
                                <option value={committee}>{committee}</option>
                            {/each}
                        </select>
                    </label>
                </fieldset>

                <fieldset class="filter-group filter-group--date">
                    <legend>Publication date</legend>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="date"
                                value=""
                                bind:group={datePreset}
                            />
                            <span>All dates</span>
                        </label>
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="date"
                                value="past-week"
                                bind:group={datePreset}
                            />
                            <span>Past week</span>
                        </label>
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="date"
                                value="past-month"
                                bind:group={datePreset}
                            />
                            <span>Past month</span>
                        </label>
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="date"
                                value="past-6-months"
                                bind:group={datePreset}
                            />
                            <span>Past 6 months</span>
                        </label>
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="date"
                                value="past-year"
                                bind:group={datePreset}
                            />
                            <span>Past year</span>
                        </label>
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="date"
                                value="custom"
                                bind:group={datePreset}
                            />
                            <span>Custom range</span>
                        </label>
                    </div>

                    {#if datePreset === "custom"}
                        <div class="date-range">
                            <label>
                                <span>From</span>
                                <input type="date" name="from" bind:value={dateFrom} />
                            </label>
                            <label>
                                <span>To</span>
                                <input type="date" name="to" bind:value={dateTo} />
                            </label>
                        </div>
                    {/if}
                </fieldset>
            </div>

            <div class="filters-actions">
                <button type="submit" class="filters-apply">
                    Apply filters
                </button>
                <a class="filters-clear" href={searchAction}>
                    Clear search and filters
                </a>
            </div>
        </form>

        {#if hasActiveSearch}
            <section class="search-results-shell">
                <div class="search-results-bar">
                    <div>
                        <p class="results-count">{sortedResults.length} results</p>
                        {#if sectionMeta}
                            <p class="results-scope">Within {sectionMeta.title}</p>
                        {/if}
                        {#if requestedCommittee}
                            <p class="results-scope">
                                Committee: {requestedCommittee}
                            </p>
                        {/if}
                        {#if effectiveDateRange.from || effectiveDateRange.to}
                            <p class="results-scope">
                                Published between {effectiveDateRange.from ||
                                    "start"} and {effectiveDateRange.to ||
                                    "today"}
                            </p>
                        {/if}
                    </div>

                    <form class="sort-form" method="GET" action={searchAction}>
                        <input type="hidden" name="q" value={query} />
                        {#if requestedCommittee}
                            <input
                                type="hidden"
                                name="committee"
                                value={requestedCommittee}
                            />
                        {/if}
                        {#if datePreset}
                            <input type="hidden" name="date" value={datePreset} />
                        {/if}
                        {#if effectiveDateRange.from}
                            <input
                                type="hidden"
                                name="from"
                                value={effectiveDateRange.from}
                            />
                        {/if}
                        {#if effectiveDateRange.to}
                            <input
                                type="hidden"
                                name="to"
                                value={effectiveDateRange.to}
                            />
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
                            <option
                                value="newest"
                                selected={sortMode === "newest"}
                            >
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
                        <p>No reports match your current search.</p>
                    </div>
                {/if}
            </section>
        {:else}
            <div class="empty-state empty-state--prompt">
                <p>Enter a search term to browse committee report results.</p>
            </div>
        {/if}
    </div>
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
        margin-bottom: var(--space-4);
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

    .search-layout {
        align-items: start;
        display: grid;
        gap: var(--space-7);
        grid-template-columns: minmax(16rem, 20rem) minmax(0, 1fr);
    }

    .search-form {
        border-right: 1px solid color-mix(in srgb, var(--color-line) 55%, transparent);
        display: grid;
        gap: var(--space-4);
        min-width: 0;
        padding-right: var(--space-6);
        position: sticky;
        top: calc(var(--header-offset, 4rem) + 1.25rem);
    }

    .search-results-shell {
        min-width: 0;
    }

    .search-query-label,
    legend {
        color: var(--color-accent-3);
        font-size: 0.9rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        line-height: 1.2;
        margin: 0;
        text-transform: uppercase;
    }

    .search-query-group,
    .filter-group {
        display: grid;
        gap: 0.8rem;
    }

    .search-query-input,
    .committee-select-group select,
    .date-range input,
    .sort-form select {
        appearance: none;
        background: color-mix(in srgb, var(--color-panel) 84%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
        border-radius: var(--radius);
        box-sizing: border-box;
        color: var(--color-accent-2);
        font: inherit;
        inline-size: 100%;
        max-inline-size: 100%;
    }

    .search-query-input {
        font-size: 0.95rem;
        line-height: 1.45;
        min-height: 3.2rem;
        padding: 0.85rem 1rem;
    }

    fieldset {
        border: 0;
        margin: 0;
        min-width: 0;
        padding: 0;
    }

    .committee-select-group {
        display: grid;
        gap: 0.5rem;
    }

    .date-range span {
        color: var(--color-muted);
        font-size: 0.9rem;
        font-weight: 500;
        line-height: 1.35;
    }

    .committee-select-group select {
        min-height: 2.9rem;
        padding: 0.75rem 0.95rem;
    }

    .filter-group--date {
        border-top: 1px solid color-mix(in srgb, var(--color-line) 55%, transparent);
        margin-top: var(--space-2);
        padding-top: var(--space-4);
    }

    .radio-group {
        display: grid;
        gap: 0.55rem;
    }

    .radio-option {
        align-items: center;
        color: var(--color-accent-2);
        display: flex;
        gap: 0.7rem;
        font-size: 0.95rem;
        font-weight: 500;
        line-height: 1.25;
        padding-block: 0.08rem;
    }

    .radio-option input {
        accent-color: var(--color-accent-3);
        block-size: 1.1rem;
        inline-size: 1.1rem;
        margin: 0;
    }

    .date-range {
        display: grid;
        gap: 0.85rem;
        margin-top: 0.1rem;
    }

    .date-range label {
        display: grid;
        gap: 0.4rem;
    }

    .date-range input {
        min-height: 2.75rem;
        padding: 0.7rem 0.9rem;
    }

    .filters-actions {
        display: grid;
        gap: 0.75rem;
        margin-top: 0.15rem;
    }

    .filters-apply,
    .filters-clear {
        border-radius: var(--radius);
        box-sizing: border-box;
        display: block;
        font-size: 0.95rem;
        font-weight: 600;
        inline-size: 100%;
        line-height: 1.3;
        max-inline-size: 100%;
        padding: 0.8rem 1rem;
        text-align: center;
        text-decoration: none;
    }

    .filters-apply {
        background: var(--color-ink);
        border: 1px solid var(--color-ink);
        color: var(--color-paper);
        -webkit-text-fill-color: var(--color-paper);
    }

    .filters-clear {
        border: 1px solid color-mix(in srgb, var(--color-line) 70%, transparent);
        color: var(--color-accent-2);
    }

    .search-results-shell {
        display: grid;
        gap: var(--space-5);
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
        padding: 0.75rem 0.95rem;
    }

    .active-filters {
        display: grid;
        gap: 0.7rem;
    }

    .active-filters-label {
        color: var(--color-muted);
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        line-height: 1.2;
        margin: 0;
        text-transform: uppercase;
    }

    .active-filters-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
    }

    .active-filter-chip {
        align-items: center;
        background: color-mix(in srgb, var(--color-soft) 58%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
        border-radius: var(--radius);
        color: var(--color-accent-2);
        display: inline-flex;
        font-size: 0.86rem;
        font-weight: 600;
        gap: 0.5rem;
        line-height: 1.2;
        padding: 0.5rem 0.7rem;
        text-decoration: none;
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

    @media (max-width: 980px) {
        .search-layout {
            grid-template-columns: 1fr;
        }

        .search-form {
            border-right: 0;
            border-bottom: 1px solid
                color-mix(in srgb, var(--color-line) 55%, transparent);
            padding-right: 0;
            padding-bottom: var(--space-6);
            position: static;
            top: auto;
        }
    }

    @media (max-width: 720px) {
        .search-results-bar {
            align-items: flex-start;
            flex-direction: column;
        }
    }
</style>
