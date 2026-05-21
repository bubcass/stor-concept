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
    type DatePreset =
        | ""
        | "past-week"
        | "past-month"
        | "past-6-months"
        | "past-year"
        | "custom";

    let query = $state("");
    let sortMode = $state<SortMode>("most-relevant");
    let requestedSections = $state<StorySection[]>([]);
    let requestedTypes = $state<StoryDocumentType[]>([]);
    let requestedCommittee = $state("");
    let datePreset = $state<DatePreset>("");
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

    function buildSearchHref(options?: {
        sections?: StorySection[];
        types?: StoryDocumentType[];
        committee?: string;
        datePreset?: DatePreset;
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
        for (const section of nextSections) params.append("section", section);
        for (const type of nextTypes) params.append("type", type);
        if (nextCommittee) params.set("committee", nextCommittee);
        if (nextDatePreset) params.set("date", nextDatePreset);
        if (resolvedRange.from) params.set("from", resolvedRange.from);
        if (resolvedRange.to) params.set("to", resolvedRange.to);
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
    let effectiveDateRange = $derived(
        resolveDateRange(datePreset, dateFrom, dateTo),
    );
    let hasActiveSearch = $derived(
        Boolean(
            query ||
            requestedSections.length ||
            requestedTypes.length ||
            requestedCommittee ||
            datePreset ||
            effectiveDateRange.from ||
            effectiveDateRange.to,
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
    <title>Search | Stór | Independent Parliamentary Research</title>
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
                Search across Stór with title, author and researcher
                details.
            </p>
        </div>
    </header>

    <div class="search-layout">
        <form class="search-form" method="GET" action="{base}/search/">
            <div class="search-copy">
                <p class="search-panel-title">Refine search</p>
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
                <fieldset class="filter-group">
                    <legend>Sections</legend>
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
                            <span>Committee</span>
                            <select
                                id="committee-filter"
                                name="committee"
                                value={requestedCommittee}
                            >
                                <option value=""
                                    >All published committees</option
                                >
                                {#each publishedCommitteeNames as committee}
                                    <option value={committee}>{committee}</option>
                                {/each}
                            </select>
                        </label>
                    {/if}
                </fieldset>

                <fieldset class="filter-group">
                    <legend>Publication date</legend>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="date"
                                value=""
                                checked={datePreset === ""}
                            />
                            <span>All dates</span>
                        </label>
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="date"
                                value="past-week"
                                checked={datePreset === "past-week"}
                            />
                            <span>Past week</span>
                        </label>
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="date"
                                value="past-month"
                                checked={datePreset === "past-month"}
                            />
                            <span>Past month</span>
                        </label>
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="date"
                                value="past-6-months"
                                checked={datePreset === "past-6-months"}
                            />
                            <span>Past 6 months</span>
                        </label>
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="date"
                                value="past-year"
                                checked={datePreset === "past-year"}
                            />
                            <span>Past year</span>
                        </label>
                        <label class="radio-option">
                            <input
                                type="radio"
                                name="date"
                                value="custom"
                                checked={datePreset === "custom"}
                            />
                            <span>Custom range</span>
                        </label>
                    </div>

                    {#if datePreset === "custom"}
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
                    {/if}
                </fieldset>

                <fieldset class="filter-group">
                    <legend>Document type</legend>
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
                    {#if effectiveDateRange.from || effectiveDateRange.to}
                        <p class="results-scope">
                            Published between {effectiveDateRange.from ||
                                "start"} and {effectiveDateRange.to || "today"}
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
    </div>
</section>

<style>
    .search-page {
        padding-top: clamp(var(--space-7), 7vw, 4.5rem);
    }

    .search-header {
        border-bottom: 1px solid
            color-mix(in srgb, var(--color-line) 55%, transparent);
        margin-bottom: var(--space-6);
        padding-bottom: var(--space-5);
    }

    .search-layout {
        align-items: start;
        display: grid;
        gap: clamp(var(--space-6), 4vw, var(--space-7));
        grid-template-columns: minmax(17rem, 22rem) minmax(0, 1fr);
    }

    .search-form {
        background: color-mix(in srgb, var(--color-panel) 82%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 72%, transparent);
        border-radius: var(--radius);
        display: grid;
        gap: 1rem;
        position: sticky;
        top: calc(var(--site-header-height, 3.25rem) + 1rem);
        padding: clamp(0.95rem, 3vw, 1.2rem);
    }

    .search-panel-title {
        color: var(--color-accent);
        font-size: var(--font-size-small);
        font-weight: var(--font-weight-meta);
        letter-spacing: 0.11em;
        line-height: var(--line-height-small);
        margin: 0;
        text-transform: uppercase;
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
        gap: 0.35rem;
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
        border-radius: var(--radius);
        color: var(--color-accent-2);
        font: inherit;
        font-size: 0.98rem;
        line-height: 1.2;
        padding: 0.8rem 0.95rem;
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
        min-width: 0;
    }

    .filters-grid {
        display: grid;
        gap: 1.15rem;
        grid-template-columns: minmax(0, 1fr);
    }

    .filter-group {
        border: 0;
        border-top: 1px solid
            color-mix(in srgb, var(--color-line) 65%, transparent);
        margin: 0;
        min-width: 0;
        padding: 1rem 0 0;
    }

    .filter-group:first-child {
        border-top: 0;
        padding-top: 0;
    }

    .filter-group legend {
        color: var(--color-muted);
        font-size: 0.86rem;
        font-weight: 600;
        letter-spacing: 0.05em;
        line-height: 1.2;
        margin-bottom: 0.8rem;
        padding: 0;
        text-transform: uppercase;
    }

    .date-range {
        display: grid;
        gap: 0.65rem;
        grid-template-columns: minmax(0, 1fr);
    }

    .date-range label,
    .checkbox-option {
        display: grid;
        gap: 0.45rem;
    }

    .date-range span {
        color: var(--color-muted);
        font-size: 0.78rem;
        font-weight: 600;
        line-height: var(--line-height-small);
    }

    .date-range input {
        appearance: none;
        background: color-mix(in srgb, var(--color-paper) 92%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
        border-radius: var(--radius);
        color: var(--color-accent-2);
        font: inherit;
        font-size: 0.95rem;
        padding: 0.72rem 0.85rem;
    }

    .checkbox-group {
        display: grid;
        gap: 0.7rem;
        grid-template-columns: minmax(0, 1fr);
    }

    .checkbox-group--types {
        grid-template-columns: minmax(0, 1fr);
    }

    .radio-group {
        display: grid;
        gap: 0.7rem;
    }

    .committee-select-group {
        display: grid;
        gap: 0.45rem;
        margin-top: 0.7rem;
        max-width: 32rem;
    }

    .committee-select-group span {
        color: var(--color-muted);
        font-size: 0.78rem;
        font-weight: 600;
        line-height: var(--line-height-small);
    }

    .committee-select-group select {
        appearance: none;
        background: color-mix(in srgb, var(--color-paper) 92%, transparent);
        border: 1px solid color-mix(in srgb, var(--color-line) 78%, transparent);
        border-radius: var(--radius);
        color: var(--color-accent-2);
        font: inherit;
        font-size: 0.95rem;
        padding: 0.72rem 0.85rem;
    }

    .checkbox-option {
        align-items: center;
        color: var(--color-accent-2);
        font-size: 0.92rem;
        font-weight: 500;
        grid-template-columns: auto minmax(0, 1fr);
        line-height: 1.35;
    }

    .radio-option {
        align-items: center;
        color: var(--color-accent-2);
        display: grid;
        font-size: 0.92rem;
        font-weight: 500;
        gap: 0.45rem;
        grid-template-columns: auto minmax(0, 1fr);
        line-height: 1.35;
    }

    .checkbox-option input {
        accent-color: var(--color-focus);
        margin: 0.08rem 0 0;
    }

    .radio-option input {
        accent-color: var(--color-focus);
        margin: 0.08rem 0 0;
    }

    .filters-actions {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-start;
        gap: 0.75rem 0.9rem;
    }

    .filters-apply {
        appearance: none;
        background: var(--color-ink);
        border: 1px solid var(--color-ink);
        border-radius: var(--radius);
        color: var(--color-paper);
        cursor: pointer;
        font: inherit;
        font-weight: 600;
        font-size: 0.95rem;
        padding: 0.72rem 0.95rem;
    }

    .filters-clear {
        color: var(--color-muted);
        font-size: 0.9rem;
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
    border-radius: var(--radius);
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
        border-radius: var(--radius);
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
        .search-layout {
            grid-template-columns: minmax(0, 1fr);
        }

        .search-form {
            position: static;
        }

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
